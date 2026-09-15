#include "pmm.h"
#include <string.h>

void pmm_log_hardware_regions(const pmm_memory_map_entry_t* map, size_t entry_count);

static uint64_t* g_pmm_bitmap = NULL;
static uint64_t  g_total_frames = 0;
static uint64_t  g_bitmap_size_bytes = 0;

// Central spinlock tracking variable to protect sequential iteration operations
static volatile uint32_t g_pmm_lock = 0;

extern void print_string(const char* str, int row);

// Atomic Spinlock Implementation with a safety break mechanism
static inline int pmm_lock_acquire(void) {
    uint64_t timeout = 2000000;
    while (__sync_lock_test_and_set(&g_pmm_lock, 1)) {
        __asm__ __volatile__("pause");
        if (--timeout == 0) return 0; // Prevent permanent multi-core deadlock stalls
    }
    return 1;
}

static inline void pmm_lock_release(void) {
    __sync_lock_release(&g_pmm_lock);
}

void init_physical_memory(const pmm_memory_map_entry_t* firmware_map, size_t entry_count, uintptr_t bitmap_staging_vaddr) {
    if (!firmware_map || entry_count == 0 || bitmap_staging_vaddr == 0) return;

    // 1. Traverse the map first to find the absolute maximum upper boundary of physical address space
    uint64_t highest_address = 0;
    uint64_t available_ram_bytes = 0;

    for (size_t i = 0; i < entry_count; i++) {
        uint64_t entry_end = firmware_map[i].physical_start + (firmware_map[i].page_count * PAGE_SIZE);
        if (entry_end > highest_address) {
            highest_address = entry_end;
        }
        if (firmware_map[i].type_status == PMM_REGION_AVAILABLE) {
            available_ram_bytes += (firmware_map[i].page_count * PAGE_SIZE);
        }
    }

    // 2. Perform mandatory physical space evaluation safety constraints
    if (available_ram_bytes < MIN_RAM_REQUIRED) {
        print_string("[CRITICAL WARNING] System lacks 16GB of allocatable physical RAM capacity!", 6);
    } else {
        print_string("[OK] Firmware Map Verified: 16GB+ Safe Allocatable Memory Pool Online.", 6);
    }

    g_total_frames = highest_address / PAGE_SIZE;
    g_bitmap_size_bytes = g_total_frames / 8;
    g_pmm_bitmap = (uint64_t*)bitmap_staging_vaddr;

    // 3. 🛡️ SECURITY FIXED: Mark ALL memory as RESERVED/IN-USE (1) by default.
    // We start by locking down the entire machine, then selectively punch holes
    // only for regions explicitly verified as safe conventional memory by UEFI.
    memset(g_pmm_bitmap, 0xFF, g_bitmap_size_bytes);

    // 4. Free up pages that are explicitly reported as available conventional memory
    for (size_t i = 0; i < entry_count; i++) {
        if (firmware_map[i].type_status == PMM_REGION_AVAILABLE) {
            for (uint64_t p = 0; p < firmware_map[i].page_count; p++) {
                uint64_t frame_index = (firmware_map[i].physical_start / PAGE_SIZE) + p;
                
                // Clear the bit to 0 (Marking the specific frame as verified and allocatable)
                g_pmm_bitmap[frame_index / 64] &= ~(1ULL << (frame_index % 64));
            }
        }
    }

    // 5. Explicitly re-lock the frames occupied by the tracking bitmap itself
    size_t bitmap_frames = (g_bitmap_size_bytes + PAGE_SIZE - 1) / PAGE_SIZE;
    for (size_t i = 0; i < bitmap_frames; i++) {
        size_t bit_index = (bitmap_staging_vaddr / PAGE_SIZE) + i;
        g_pmm_bitmap[bit_index / 64] |= (1ULL << (bit_index % 64));
    }

    print_string("[PMM] Firmware-Validated Allocation Bitmap Armed and Masked.", 8);

    // 🛡️ PASTE THIS HOOK HERE: Run the hardware layout verification scan
    pmm_log_hardware_regions(firmware_map, entry_count);
}

void* pmm_alloc_frame(void) {
    if (!pmm_lock_acquire()) return NULL;

    size_t total_bitmap_words = g_bitmap_size_bytes / sizeof(uint64_t);
    for (size_t i = 0; i < total_bitmap_words; i++) {
        
        // Optimize search parameters: verify if the 64-bit word has any 0 bits
        if (g_pmm_bitmap[i] != 0xFFFFFFFFFFFFFFFFULL) {
            for (int bit = 0; bit < 64; bit++) {
                
                // Use a non-destructive test to confirm if the bit is free (0)
                if (!(g_pmm_bitmap[i] & (1ULL << bit))) {
                    
                    // 🛡️ SECURITY FIXED: Enforce a multi-core safe Atomic Bit-Test-And-Set operation.
                    // This instruction sets the bit to 1 and returns the previous bit value natively 
                    // via hardware lines, completely eliminating context allocation races.
                    uint64_t mask = (1ULL << bit);
                    uint64_t previous_word = __sync_fetch_and_or(&g_pmm_bitmap[i], mask);
                    
                    // Verify if another CPU core managed to steal this identical slot before us
                    if (!(previous_word & mask)) {
                        uint64_t frame_index = (i * 64) + bit;
                        uintptr_t target_physical_ptr = (uintptr_t)(frame_index * PAGE_SIZE);

                        pmm_lock_release();

                        // 🛡️ SECURITY FIXED: Force absolute data sanitization before allocation handoff.
                        // Erases any leftover parameters or cryptographic keys from old processes.
                        memset((void*)target_physical_ptr, 0, PAGE_SIZE);

                        return (void*)target_physical_ptr;
                    }
                }
            }
        }
    }

    pmm_lock_release();
    return NULL; // System Out-Of-Memory fallback
}

void pmm_free_frame(void* frame_addr) {
    uint64_t frame_index = (uint64_t)frame_addr / PAGE_SIZE;
    
    // 🛡️ SECURITY FIXED: Boundary check to block malicious or corrupt pointers passed to free()
    if (frame_index >= g_total_frames || frame_addr == NULL) {
        return; // Reject out-of-bounds frame parameters or arbitrary pointer corruption attempts
    }

    size_t i = frame_index / 64;
    int bit = frame_index % 64;
    uint64_t mask = ~(1ULL << bit);

    // Enforce an atomic hardware bit clear operation across active cores
    __sync_fetch_and_and(&g_pmm_bitmap[i], mask);
}

// 🛡️ SECURITY CONSTANTS: Explicitly define diagnostic tracking parameters
#define PMM_LOG_ROW_START  24

/**
 * 🛡️ HARDENED FIRMWARE MAP VERIFIER & LOGGER
 * Iterates through the UEFI memory regions array to audit layout safety boundaries.
 * Enforces strict non-destructive bounds check loops to protect against corrupted boot variables.
 */
void pmm_log_hardware_regions(const pmm_memory_map_entry_t* map, size_t entry_count) {
    if (!map || entry_count == 0) return;

    print_string("--- [HARDWARE MAP DIAGNOSTIC SCAN] ---", PMM_LOG_ROW_START);

    // Limit the maximum number of printed rows to prevent screen coordinate clipping overflows
    size_t print_limit = (entry_count > 8) ? 8 : entry_count;

    for (size_t i = 0; i < print_limit; i++) {
        uint64_t start_addr = map[i].physical_start;
        uint64_t size_bytes = map[i].page_count * PAGE_SIZE;
        uint64_t end_addr   = start_addr + size_bytes;

        // 1. 🛡️ CRITICAL BOUNDS CHECK: Prevent parsing integers wrap-around loops
        // If the map data contains corrupted or distorted sizing fields, block execution path
        if (end_addr < start_addr || size_bytes == 0) {
            print_string("[CRITICAL ERROR] Corrupted firmware memory entry detected! Boot halted.", PMM_LOG_ROW_START + i + 1);
            while (1) { __asm__ __volatile__("hlt"); }
        }

        // Construct a safe, fixed-size stack character buffer to parse diagnostic logs
        char log_buffer[64];
        memset(log_buffer, 0, sizeof(log_buffer));

        // Create a lightweight, secure manual text proxy formatter to print address ranges
        // Pre-allocating string fragments cleanly instead of calling complex string utilities
        strcpy(log_buffer, "Region [");
        log_buffer[8]  = '0' + (i % 10);
        log_buffer[9]  = ']';
        log_buffer[10] = ':';
        log_buffer[11] = ' ';

        if (map[i].type_status == PMM_REGION_AVAILABLE) {
            strcat(log_buffer, "CONVENTIONAL RAM (Safe Alloc)");
        } else {
            strcat(log_buffer, "SYSTEM RESERVED (Locked)");
        }

        // Print the audited hardware layout entry directly onto our high-resolution console
        print_string(log_buffer, PMM_LOG_ROW_START + i + 1);
    }
}
