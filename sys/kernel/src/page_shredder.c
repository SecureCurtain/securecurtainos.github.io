#include "page_shredder.h"
#include <string.h>
#include <stdio.h>

static SecureShredderRegistry g_shredder_core;

// Pulls entropy directly from physical CPU registers built into your system
extern uint8_t query_true_hardware_random_byte(void);

void init_page_shredder_subsystem(void) {
    memset(&g_shredder_core, 0, sizeof(SecureShredderRegistry));
    g_shredder_core.magic = SHRED_MAGIC_TAG;
    g_shredder_core.total_shredded_pages = 0;
    g_shredder_core.shred_passes_count = 3; // Enforce explicit 3-pass cleaning standard
    g_shredder_core.is_active = true;

    printf("[Kernel Shredder]: Multi-level page memory sanitization pipeline active.\\n");
}

void sys_secure_shred_page(uint64_t physical_frame_address) {
    if (!g_shredder_core.is_active || physical_frame_address == 0) return;

    uint8_t* page_ptr = (uint8_t*)(uintptr_t)physical_frame_address;

    // Pass 1: High-entropy hardware randomized data overwrite
    for (uint32_t i = 0; i < SHRED_PAGE_SIZE; i++) {
        page_ptr[i] = query_true_hardware_random_byte();
    }

    // Pass 2: Invert all bits (Complement pass) to exhaust capacitive retention
    for (uint32_t i = 0; i < SHRED_PAGE_SIZE; i++) {
        page_ptr[i] = ~page_ptr[i];
    }

    // Pass 3: Final zero-fill sweep to return a sterile page block to the allocator
    memset(page_ptr, 0, SHRED_PAGE_SIZE);

    g_shredder_core.total_shredded_pages++;
}
