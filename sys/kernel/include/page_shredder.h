#pragma once
#include <stdint.h>
#include <stdbool.h>

#define SHRED_PAGE_SIZE 4096 // Wiping standard 4KB physical hardware pages
#define SHRED_MAGIC_TAG 0x53485244 // "SHRD" binary tracking tag

typedef enum {
    SHRED_PASS_RANDOM = 1,
    SHRED_PASS_COMPLEMENT,
    SHRED_PASS_ZERO
} ShredPassType;

typedef struct {
    uint32_t      magic;
    uint32_t      total_shredded_pages;
    uint8_t       shred_passes_count;
    bool          is_active;
} SecureShredderRegistry;

void init_page_shredder_subsystem(void);
void sys_secure_shred_page(uint64_t physical_frame_address);