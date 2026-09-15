#pragma once
#include <stdint.h>
#include <stddef.h>

#define PAGE_SIZE            4096       
#define MIN_RAM_REQUIRED     (16ULL * 1024 * 1024 * 1024) 

// 🛡️ SECURITY CONSTANTS: Explicitly track the state of physical frames
#define PMM_REGION_RESERVED   0  // Unusable (Motherboard MMIO, ACPI, UEFI runtime)
#define PMM_REGION_AVAILABLE  1  // Safe for general microkernel allocation

// Maximum number of distinct hardware memory fragments we track (Standard UEFI map size capacity)
#define PMM_MAX_MEMORY_MAP_ENTRIES 128

// Represents a verified physical memory region returned by the UEFI boot architecture
typedef struct {
    uint64_t physical_start;
    uint64_t page_count;
    uint32_t type_status;
} pmm_memory_map_entry_t;

// ------------------------------------------------------------------------------
// Microkernel Physical Memory Core Interfaces
// ------------------------------------------------------------------------------

/**
 * 🛡️ FIRMWARE-VALIDATED INITIALIZATION ENGINE
 * Parses a secure map structure passed directly from uefi_main.c.
 * Iterates through every hardware fragment, configures the allocation bitmap, 
 * and ensures that firmware and architecture critical pages are permanently locked.
 * 
 * @param firmware_map Array of validated memory region layouts populated at boot.
 * @param entry_count Total number of structural blocks stored inside the array.
 * @param bitmap_staging_vaddr Secure kernel address where the tracking map will reside.
 */
void pmm_init(uint64_t mem_map_addr, uint64_t mem_map_size);
void init_physical_memory(const pmm_memory_map_entry_t* firmware_map, size_t entry_count, uintptr_t bitmap_staging_vaddr);

/**
 * 🛡️ CONCURRENCY-SAFE FRAME ALLOCATOR
 * Searches the allocation maps using atomic spinlocks to prevent multi-core race bugs.
 * Automatically zeroes out newly allocated frames to prevent cross-process data leaks.
 * 
 * @return void* A clean, 4KB physical page address frame alignment. Returns NULL if out of memory.
 */
uintptr_t pmm_alloc_frame(void);
void pmm_free_frame(uintptr_t frame_addr);
uint64_t pmm_get_max_address(void);
uint64_t pmm_get_total_frames(void);

void pmm_log_hardware_regions(const pmm_memory_map_entry_t* firmware_map, size_t entry_count);