#pragma once
#include <stdint.h>
#include <stdbool.h>

#define SANITIZE_BLOCK_SIZE  4096 // Clearing standard 4KB virtual swap pages
#define SANITIZER_MAGIC_TAG  0x53414E53 // "SANS" binary tracking token

typedef struct {
    uint32_t magic;
    uint32_t total_sanitized_swap_blocks;
    uint8_t  clear_cycles_count;
    bool     is_scrubbing;
} SecureSanitizerRegistry;

void init_swap_file_sanitizer(void);
void sys_secure_sanitize_swap_sectors(uint32_t sector_offset);