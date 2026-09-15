#pragma once
#include <stdint.h>
#include <stdbool.h>

#define POWER_STATE_SLEEP      1
#define POWER_STATE_HYBRID     2
#define POWER_STATE_HIBERNATE  3
#define POWER_STATE_OFF        4

#define SWAP_ENCRYPTION_KEY_SIZE 32 // 256-bit transient key allocation
#define SWAP_STORAGE_BLOCK_SIZE  4096 // Matching a standard 4KB MMU page table boundary

typedef struct {
    uint8_t key_buffer[SWAP_ENCRYPTION_KEY_SIZE];
    bool is_initialized;
} SwapCryptoContext;

int32_t sys_power_management(uint32_t requested_state);
void generate_transient_storage_key(void);
void encrypt_system_ram_image(const uint8_t* source_page, uint8_t* destination_block);
void draw_rehydration_clock_dial(uint32_t processed_pages, uint32_t total_pages);
void __attribute__((noreturn)) execute_kernel_security_panic(const char* threat_origin);