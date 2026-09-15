#include "swap_sanitizer.h"
#include "security_audit.h"
#include <string.h>
#include <stdio.h>

static SecureSanitizerRegistry g_swap_sanitizer;

extern uint8_t query_true_hardware_random_byte(void);
extern void    write_block_to_vfs_swap_node(uint32_t sector, const uint8_t* data);

void init_swap_file_sanitizer(void) {
    memset(&g_swap_sanitizer, 0, sizeof(SecureSanitizerRegistry));
    g_swap_sanitizer.magic = SANITIZER_MAGIC_TAG;
    g_swap_sanitizer.total_sanitized_swap_blocks = 0;
    g_swap_sanitizer.clear_cycles_count = 2; // Two-pass rapid overwrite sequence
    g_swap_sanitizer.is_scrubbing = true;

    printf("[Kernel Sanitizer]: Virtual memory swap-space data sanitizer online.\\n");
}

void sys_secure_sanitize_swap_sectors(uint32_t sector_offset) {
    if (!g_swap_sanitizer.is_scrubbing) return;

    uint8_t random_mask_sector[512];
    uint8_t zero_mask_sector[512];
    memset(zero_mask_sector, 0, 512);

    // Populate high-entropy cleaning masks from physical CPU hardware loops
    for (uint16_t b = 0; b < 512; b++) {
        random_mask_sector[b] = query_true_hardware_random_byte();
    }

    // A single 4KB swap memory block spans exactly 8 raw drive sectors
    // Pass 1: Overwrite the target swap boundaries completely with random bytes
    for (uint32_t s = 0; s < 8; s++) {
        write_block_to_vfs_swap_node(sector_offset + s, random_mask_sector);
    }

    // Pass 2: Overwrite with hard zero strings to leave the sectors sterile
    for (uint32_t s = 0; s < 8; s++) {
        write_block_to_vfs_swap_node(sector_offset + s, zero_mask_sector);
    }

    g_swap_sanitizer.total_sanitized_swap_blocks++;
}
