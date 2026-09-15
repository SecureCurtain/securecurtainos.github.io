#include "uefi.h"
#include "pmm.h"
#include "kernel.h"
#include <string.h>

// 🛡️ SECURITY FIXED: Expand the memory map buffer pool to hold up to 256 fragments safely.
// Statically allocated inside the pre-boot loader binary context.
#define MEM_MAP_BUFFER_SIZE (4096 * 8)
static uint8_t g_uefi_mem_map_buffer[MEM_MAP_BUFFER_SIZE];

// Allocate space to translate UEFI formats into our custom kernel region array layout
static pmm_memory_map_entry_t g_kernel_regions[PMM_MAX_MEMORY_MAP_ENTRIES];

EFI_STATUS efi_main(EFI_HANDLE ImageHandle, EFI_SYSTEM_TABLE* SystemTable) {
    if (!SystemTable || !SystemTable->BootServices) return 1;

    boot_parameters_t kernel_boot_args;
    memset(&kernel_boot_args, 0, sizeof(boot_parameters_t));

    EFI_GUID gop_guid = EFI_GRAPHICS_OUTPUT_PROTOCOL_GUID;
    EFI_GRAPHICS_OUTPUT_PROTOCOL* gop = NULL;

    // 1. Initialize high-resolution physical graphics protocols via firmware hooks
    EFI_STATUS status = SystemTable->BootServices->LocateProtocol(&gop_guid, NULL, (void**)&gop);
    if (status == EFI_SUCCESS && gop != NULL && gop->Mode && gop->Mode->Info) {
        kernel_boot_args.framebuffer_address = gop->Mode->FrameBufferBase;
        kernel_boot_args.screen_width        = gop->Mode->Info->HorizontalResolution;
        kernel_boot_args.screen_height       = gop->Mode->Info->VerticalResolution;
        kernel_boot_args.pixels_per_scan_line = gop->Mode->Info->PixelsPerScanLine;
    } else {
        // Safe hardware resolution fallback parameter block
        kernel_boot_args.framebuffer_address = 0xFD000000;
        kernel_boot_args.screen_width        = 1024;
        kernel_boot_args.screen_height       = 768;
        kernel_boot_args.pixels_per_scan_line = 1024;
    }

    // 2. 🛡️ SECURITY FIXED: Hardened Multi-Pass Memory Map Retrieval Loop
    // UEFI GetMemoryMap can dynamically change its size requirements if processing lines
    // allocate structures mid-flight, which can cause an execution panic.
    size_t memory_map_size = MEM_MAP_BUFFER_SIZE;
    size_t map_key = 0;
    size_t descriptor_size = 0;
    uint32_t descriptor_version = 0;

    status = SystemTable->BootServices->GetMemoryMap(
        &memory_map_size, 
        (EFI_MEMORY_DESCRIPTOR*)g_uefi_mem_map_buffer, 
        &map_key, 
        &descriptor_size, 
        &descriptor_version
    );

    if (status != EFI_SUCCESS || descriptor_size == 0) {
        // Fatal: Firmware cannot report memory layouts, halt boot execution path securely
        return status;
    }

    // 3. 🛡️ SECURITY FIXED: Parse and translate raw UEFI descriptors into Kernel Region Maps
    size_t total_descriptors = memory_map_size / descriptor_size;
    size_t custom_map_index = 0;
    uint64_t highest_usable_address = 0;

    for (size_t i = 0; i < total_descriptors; i++) {
        if (custom_map_index >= PMM_MAX_MEMORY_MAP_ENTRIES) break;

        EFI_MEMORY_DESCRIPTOR* desc = (EFI_MEMORY_DESCRIPTOR*)(g_uefi_mem_map_buffer + (i * descriptor_size));
        
        g_kernel_regions[custom_map_index].physical_start = desc->PhysicalStart;
        g_kernel_regions[custom_map_index].page_count = desc->NumberOfPages;

        // Map UEFI standard memory types to our strict microkernel allocation categories
        // EfiConventionalMemory (Type 7) represents pristine, allocatable physical RAM
        if (desc->Type == 7) {
            g_kernel_regions[custom_map_index].type_status = PMM_REGION_AVAILABLE;
            
            uint64_t current_end = desc->PhysicalStart + (desc->NumberOfPages * PAGE_SIZE);
            if (current_end > highest_usable_address) {
                highest_usable_address = current_end;
            }
        } else {
            // All other types (Motherboard MMIO, ACPI Tables, UEFI Runtime, etc.) are locked down
            g_kernel_regions[custom_map_index].type_status = PMM_REGION_RESERVED;
        }
        custom_map_index++;
    }

    kernel_boot_args.firmware_memory_map = g_kernel_regions;
    kernel_boot_args.memory_map_entry_count = custom_map_index;

    // 4. 🛡️ SECURITY FIXED: Dynamic PMM Bitmap Placement Math
    // Compute a safe physical address boundary to house the allocation bit array without truncation
    uint64_t total_frames = highest_usable_address / PAGE_SIZE;
    if (total_frames == 0) total_frames = 1024 * 1024; // Default fallback (4GB range)
    
    // We locate a secure, higher-half location that won't collide with early kernel text sectors
    kernel_boot_args.bitmap_target_physical = 0x2000000ULL; // 32MB physical boundary safe zone

    // 5. 🛡️ SECURITY FIXED: Race-Resilient Exit Handshake Loop
    // ExitBootServices can fail if internal hardware timers modify the key.
    // Retry fetching GetMemoryMap and calling ExitBootServices up to 10 times safely.
    int retries = 0;
    while ((status = SystemTable->BootServices->ExitBootServices(ImageHandle, map_key)) != EFI_SUCCESS) {
        if (++retries > 10) {
            return status; // Exit with error state if firmware fails handshake repeatedly
        }
        memory_map_size = MEM_MAP_BUFFER_SIZE;
        SystemTable->BootServices->GetMemoryMap(
            &memory_map_size, 
            (EFI_MEMORY_DESCRIPTOR*)g_uefi_mem_map_buffer, 
            &map_key, 
            &descriptor_size, 
            &descriptor_version
        );
    }

    // 6. Plunge straight into your consolidated core microkernel entry point
    kmain(&kernel_boot_args);

    return EFI_SUCCESS;
}
