/* SecureCurtain OS - Physical Memory Manager (PMM) Dynamic Bitmap Allocator
 * Author: Jared Busby (jb7572)
 * Architecture: x86_64 Freestanding Long Mode
 *
 * Fully dynamic physical memory tracking:
 * Scales automatically to the exact maximum physical RAM supported by the host
 * motherboard, UEFI memory map, and CPU memory controller (e.g. 8GB, 64GB, 128GB, 256GB, 512GB, 1TB+).
 */

#include "pmm.h"
#include "kernel.h"
#include "multiboot2.h"

#define FRAMES_PER_BYTE 8

/* Linker symbol marking the physical/virtual end of kernel sections */
extern uint8_t _kernel_end[];

/* Pointer to the dynamically sized bitmap placed immediately after _kernel_end */
static uint8_t *pmm_bitmap = NULL;
static uint64_t max_physical_address = 0;
static uint64_t total_frames = 0;
static uint64_t used_frames = 0;
static uintptr_t bitmap_start_frame = 0;
static size_t bitmap_frame_count = 0;
static size_t bitmap_size_bytes = 0;

static inline void bitmap_set(size_t frame) {
    if (frame < total_frames && pmm_bitmap) {
        pmm_bitmap[frame / FRAMES_PER_BYTE] |= (1 << (frame % FRAMES_PER_BYTE));
    }
}

static inline void bitmap_clear(size_t frame) {
    if (frame < total_frames && pmm_bitmap) {
        pmm_bitmap[frame / FRAMES_PER_BYTE] &= ~(1 << (frame % FRAMES_PER_BYTE));
    }
}

static inline bool bitmap_test(size_t frame) {
    if (frame < total_frames && pmm_bitmap) {
        return (pmm_bitmap[frame / FRAMES_PER_BYTE] & (1 << (frame % FRAMES_PER_BYTE))) != 0;
    }
    return true; // Out-of-bounds treated as reserved/used
}

void pmm_init(uint64_t mem_map_addr, uint64_t mem_map_size) {
    serial_puts("[PMM] Probing Motherboard Memory Map for Dynamic Bitmap Sizing...\n");

    max_physical_address = 0;
    uint64_t reported_usable_ram = 0;

    // --- Pass 1: Discover Highest Physical Address of Usable RAM ---
    if (mem_map_addr != 0 && mem_map_size >= sizeof(struct multiboot_tag_mmap)) {
        struct multiboot_tag_mmap *mmap = (struct multiboot_tag_mmap *)mem_map_addr;
        if (mmap->entry_size > 0) {
            size_t num_entries = (mem_map_size - sizeof(struct multiboot_tag_mmap)) / mmap->entry_size;
            for (size_t i = 0; i < num_entries; i++) {
                struct multiboot_tag_mmap_entry *entry = (struct multiboot_tag_mmap_entry *)((uint8_t *)mmap->entries + (i * mmap->entry_size));
                if (entry->type == 1) { // Usable RAM ONLY
                    uint64_t entry_end = entry->addr + entry->len;
                    if (entry_end > max_physical_address) {
                        max_physical_address = entry_end;
                    }
                    reported_usable_ram += entry->len;
                }
            }
        }
    }

    // Fallback baseline: If no memory map provided or parsed, scale to safe default of 2 GB
    if (max_physical_address == 0) {
        max_physical_address = (2ULL * 1024 * 1024 * 1024); // 2 GB Safe Fallback
        reported_usable_ram = max_physical_address;
    }

    // Place the bitmap safely AFTER the kernel and AFTER the boot initramfs module
    extern struct multiboot_tag_module *boot_module_tag;
    uintptr_t kernel_phys_end = ((uintptr_t)&_kernel_end - KERNEL_VIRTUAL_BASE);
    kernel_phys_end = (kernel_phys_end + PAGE_SIZE - 1) & ~(PAGE_SIZE - 1);

    uintptr_t bitmap_phys_addr = kernel_phys_end;
    if (boot_module_tag && (uintptr_t)boot_module_tag->mod_end > bitmap_phys_addr) {
        bitmap_phys_addr = ((uintptr_t)boot_module_tag->mod_end + PAGE_SIZE - 1) & ~(PAGE_SIZE - 1);
    }

    // Ensure max_physical_address covers the module AND the bitmap itself
    if (bitmap_phys_addr > max_physical_address) {
        max_physical_address = bitmap_phys_addr;
    }

    // Align to 4KB page boundary
    (void)reported_usable_ram;
    max_physical_address = (max_physical_address + PAGE_SIZE - 1) & ~(PAGE_SIZE - 1);
    total_frames = max_physical_address / PAGE_SIZE;

    // Calculate required bitmap storage (1 bit per 4KB frame = 32KB per 1GB RAM)
    bitmap_size_bytes = (total_frames + FRAMES_PER_BYTE - 1) / FRAMES_PER_BYTE;
    bitmap_frame_count = (bitmap_size_bytes + PAGE_SIZE - 1) / PAGE_SIZE;

    // If bitmap extends beyond max_physical_address, expand to cover it
    if (bitmap_phys_addr + bitmap_size_bytes > max_physical_address) {
        max_physical_address = (bitmap_phys_addr + bitmap_size_bytes + PAGE_SIZE - 1) & ~(PAGE_SIZE - 1);
        total_frames = max_physical_address / PAGE_SIZE;
        bitmap_size_bytes = (total_frames + FRAMES_PER_BYTE - 1) / FRAMES_PER_BYTE;
        bitmap_frame_count = (bitmap_size_bytes + PAGE_SIZE - 1) / PAGE_SIZE;
    }

    bitmap_start_frame = bitmap_phys_addr / PAGE_SIZE;
    pmm_bitmap = (uint8_t *)(KERNEL_VIRTUAL_BASE + bitmap_phys_addr);

    // Step A: Mark all frames as used/reserved by default
    for (size_t i = 0; i < bitmap_size_bytes; i++) {
        pmm_bitmap[i] = 0xFF;
    }

    // Step B: Mark usable RAM ranges as free (bit = 0)
    if (mem_map_addr != 0 && mem_map_size >= sizeof(struct multiboot_tag_mmap)) {
        struct multiboot_tag_mmap *mmap = (struct multiboot_tag_mmap *)mem_map_addr;
        if (mmap->entry_size > 0) {
            size_t num_entries = (mem_map_size - sizeof(struct multiboot_tag_mmap)) / mmap->entry_size;
            for (size_t i = 0; i < num_entries; i++) {
                struct multiboot_tag_mmap_entry *entry = (struct multiboot_tag_mmap_entry *)((uint8_t *)mmap->entries + (i * mmap->entry_size));
                if (entry->type == 1) { // Usable RAM
                    uint64_t start_f = entry->addr / PAGE_SIZE;
                    uint64_t count_f = entry->len / PAGE_SIZE;
                    for (uint64_t f = 0; f < count_f && (start_f + f) < total_frames; f++) {
                        bitmap_clear(start_f + f);
                    }
                }
            }
        }
    } else {
        // Clear all frames if running in virtual fallback mode
        for (size_t f = 0; f < total_frames; f++) {
            bitmap_clear(f);
        }
    }

    // Step C: Protect essential system regions
    // 1. Lower 1MB (0x0 - 0x100000: Real-Mode IVT, BIOS BDA, EBDA, Video buffer)
    for (size_t f = 0; f < (1024 * 1024 / PAGE_SIZE); f++) {
        bitmap_set(f);
    }

    // 2. Kernel image (1MB to kernel_phys_end)
    size_t kernel_end_frame = kernel_phys_end / PAGE_SIZE;
    for (size_t f = (1024 * 1024 / PAGE_SIZE); f < kernel_end_frame && f < total_frames; f++) {
        bitmap_set(f);
    }

    // 3. Multiboot2 Initramfs/Ramdisk Module if loaded to prevent overwrites
    if (boot_module_tag) {
        uint64_t start_f = boot_module_tag->mod_start / PAGE_SIZE;
        uint64_t end_f = (boot_module_tag->mod_end + PAGE_SIZE - 1) / PAGE_SIZE;
        for (uint64_t f = start_f; f < end_f && f < total_frames; f++) {
            bitmap_set(f);
        }
    }

    // 4. Dynamic PMM Bitmap itself (bitmap_start_frame to bitmap_start_frame + bitmap_frame_count)
    for (size_t f = bitmap_start_frame; f < (bitmap_start_frame + bitmap_frame_count) && f < total_frames; f++) {
        bitmap_set(f);
    }

    // Calculate initial used frames
    used_frames = 0;
    for (size_t byte_idx = 0; byte_idx < bitmap_size_bytes; byte_idx++) {
        uint8_t byte = pmm_bitmap[byte_idx];
        if (byte == 0xFF) {
            used_frames += 8;
        } else if (byte != 0x00) {
            for (int b = 0; b < 8; b++) {
                if (byte & (1 << b)) used_frames++;
            }
        }
    }

    kprintf("[PMM] Dynamic Bitmap successfully configured.\n");
    kprintf("[PMM] Host Motherboard RAM Capacity: %lu MB (%lu GB)\n",
            max_physical_address / (1024ULL * 1024),
            max_physical_address / (1024ULL * 1024 * 1024));
    kprintf("[PMM] Total 4KB Frames: %lu | Bitmap Size: %lu KB\n",
            total_frames,
            bitmap_size_bytes / 1024);
    kprintf("[PMM] Usable Frames: %lu | Reserved/Used: %lu\n",
            total_frames - used_frames,
            used_frames);
}

uintptr_t pmm_alloc_frame(void) {
    if (!pmm_bitmap) {
        kernel_panic("PMM: Allocator invoked before pmm_init!");
        return 0;
    }

    for (size_t byte_idx = 0; byte_idx < bitmap_size_bytes; byte_idx++) {
        if (pmm_bitmap[byte_idx] != 0xFF) { // At least one free bit in byte
            for (int bit = 0; bit < 8; bit++) {
                if (!(pmm_bitmap[byte_idx] & (1 << bit))) {
                    size_t frame = byte_idx * 8 + bit;
                    if (frame < total_frames) {
                        bitmap_set(frame);
                        used_frames++;
                        return (uintptr_t)(frame * PAGE_SIZE);
                    }
                }
            }
        }
    }
    kernel_panic("PMM: Out of Physical Memory Frames!");
    return 0;
}

void pmm_free_frame(uintptr_t frame_addr) {
    if (!pmm_bitmap) return;
    size_t frame = frame_addr / PAGE_SIZE;
    if (frame < total_frames && bitmap_test(frame)) {
        bitmap_clear(frame);
        if (used_frames > 0) used_frames--;
    }
}

uintptr_t pmm_alloc_frames(size_t count) {
    if (count == 0) return 0;
    if (count == 1) return pmm_alloc_frame();
    if (!pmm_bitmap) return 0;

    size_t contiguous = 0;
    size_t start_frame = 0;
    size_t search_start = bitmap_start_frame + bitmap_frame_count;

    for (size_t f = search_start; f < total_frames; f++) {
        if (!bitmap_test(f)) {
            if (contiguous == 0) start_frame = f;
            contiguous++;
            if (contiguous == count) {
                for (size_t i = 0; i < count; i++) {
                    bitmap_set(start_frame + i);
                    used_frames++;
                }
                return (uintptr_t)(start_frame * PAGE_SIZE);
            }
        } else {
            contiguous = 0;
        }
    }
    kernel_panic("PMM: Failed to allocate contiguous physical frames!");
    return 0;
}

uint64_t pmm_get_total_memory(void) {
    return total_frames * PAGE_SIZE;
}

uint64_t pmm_get_used_memory(void) {
    return used_frames * PAGE_SIZE;
}

uint64_t pmm_get_free_memory(void) {
    return (total_frames > used_frames) ? (total_frames - used_frames) * PAGE_SIZE : 0;
}

uint64_t pmm_get_max_address(void) {
    return max_physical_address;
}

uint64_t pmm_get_total_frames(void) {
    return total_frames;
}

size_t pmm_get_bitmap_size_bytes(void) {
    return bitmap_size_bytes;
}
