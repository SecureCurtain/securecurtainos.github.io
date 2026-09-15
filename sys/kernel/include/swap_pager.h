#pragma once
#include <stdint.h>
#include <stdbool.h>

#define SWAP_PAGE_SIZE       4096 // Matching a standard 4KB hardware memory page translation block
#define MAX_SWAP_SLOTS       512  // Maximum paged memory blocks tracked in swap storage
#define SWAP_MAGIC_HEADER    0x53574150 // "SWAP" binary tracking tag

typedef struct {
    uint32_t virtual_slot_id;
    uint32_t owner_process_id;
    uint64_t source_virtual_address;
    uint32_t disk_sector_offset;
    bool     is_occupied;
    bool     is_encrypted;
} SwapPageMetadata;

typedef struct {
    uint32_t         magic;
    SwapPageMetadata slots[MAX_SWAP_SLOTS];
    uint32_t         total_allocated_slots;
    uint32_t         keyring_slot_reference; // Key used from the Secure Key Ring
} EncryptedSwapControlRegistry;

// Microkernel Core Memory System Pager Call Mappings
void init_encrypted_swap_pager(uint32_t physical_keyring_slot);
int32_t sys_evict_page_to_swap(uint32_t pid, uint64_t virtual_addr, const uint8_t* clear_page_data);
bool sys_rehydrate_page_from_swap(uint32_t slot_id, uint32_t pid, uint8_t* out_clear_page_frame);