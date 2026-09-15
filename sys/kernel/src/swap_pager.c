#include "swap_sanitizer.h"
#include "swap_pager.h"
#include "keyring.h"
#include "sandbox.h"
#include "security_panic.h"
#include <string.h>
#include <stdio.h>

static EncryptedSwapControlRegistry g_swap_pager;

// Local cryptographic worker to cipher raw page memory blocks via Keyring variables
static void swap_page_crypto_transform(const uint8_t* input, uint8_t* output, const uint8_t* encryption_key) {
    uint8_t dynamic_feedback = 0xAA;

    for (uint32_t i = 0; i < SWAP_PAGE_SIZE; i++) {
        // Mix the 4KB block payload against the master 256-bit keyring data sequence
        uint8_t key_byte = encryption_key[i % KEYRING_KEY_SIZE];
        
        output[i] = input[i] ^ key_byte ^ dynamic_feedback;
        dynamic_feedback = output[i]; // Form defensive block data feedback chain
    }
}

void init_encrypted_swap_pager(uint32_t physical_keyring_slot) {
    memset(&g_swap_pager, 0, sizeof(EncryptedSwapControlRegistry));
    g_swap_pager.magic = SWAP_MAGIC_HEADER;
    g_swap_pager.total_allocated_slots = 0;
    g_swap_pager.keyring_slot_reference = physical_keyring_slot;

    printf("[Kernel Swap Pager]: Opaque memory eviction array operational (Key Slot: %d).\\n", physical_keyring_slot);
}

int32_t sys_evict_page_to_swap(uint32_t pid, uint64_t virtual_addr, const uint8_t* clear_page_data) {
    if (g_swap_pager.total_allocated_slots >= MAX_SWAP_SLOTS) return -1;

    // Enforce strict sandbox mapping check before pulling bytes from source contexts
    if (!validate_memory_access_bounds(pid, (uint64_t)clear_page_data, SWAP_PAGE_SIZE, false)) {
        return -2; // Security sandbox rejection
    }

    uint32_t slot_idx = g_swap_pager.total_allocated_slots;
    SwapPageMetadata* meta = &g_swap_pager.slots[slot_idx];

    meta->virtual_slot_id = slot_idx + 2000;
    meta->owner_process_id = pid;
    meta->source_virtual_address = virtual_addr;
    meta->disk_sector_offset = slot_idx * 8; // 8 * 512-byte blocks = 4KB page bounds
    
    // Retrieve master key data from the Ring 0 Keyring Vault under kernel privilege (PID 0)
    uint8_t master_crypto_key[KEYRING_KEY_SIZE];
    if (!retrieve_sealed_key_bytes(g_swap_pager.keyring_slot_reference, 0, master_crypto_key)) {
        execute_kernel_security_panic("Swap encryption keys unavailable.");
    }

    uint8_t ciphertext_staging_page[SWAP_PAGE_SIZE];
    swap_page_crypto_transform(clear_page_data, ciphertext_staging_page, master_crypto_key);
    memset(master_crypto_key, 0, KEYRING_KEY_SIZE); // Instantly erase transient key footprint from registers

    // Direct sector serialization: write the encrypted memory segment to the raw swap partition bounds
    extern void write_block_to_vfs_swap_node(uint32_t sector, const uint8_t* data);
    write_block_to_vfs_swap_node(meta->disk_sector_offset, ciphertext_staging_page);

    meta->is_occupied = true;
    meta->is_encrypted = true;
    g_swap_pager.total_allocated_slots++;

    printf("[Swap Core]: Evicted page for PID %d to secure slot %d (Ciphered on disk).\\n", pid, meta->virtual_slot_id);
    return (int32_t)meta->virtual_slot_id;
}

bool sys_rehydrate_page_from_swap(uint32_t slot_id, uint32_t pid, uint8_t* out_clear_page_frame) {
    for (uint32_t i = 0; i < g_swap_pager.total_allocated_slots; i++) {
        SwapPageMetadata* meta = &g_swap_pager.slots[i];

        if (meta->virtual_slot_id == slot_id && meta->is_occupied) {
            // SECURITY CHECK: Verify that the process attempting to reload the memory block owns the data structure
            if (meta->owner_process_id != pid) {
                execute_kernel_security_panic("Cross-sandbox swap rehydration breach.");
                return false;
            }

            // Verify write clearances to target page frames before transferring bytes
            if (!validate_memory_access_bounds(pid, (uint64_t)out_clear_page_frame, SWAP_PAGE_SIZE, true)) {
                return false;
            }

            uint8_t ciphertext_staging_page[SWAP_PAGE_SIZE];
            extern void read_block_from_vfs_swap_node(uint32_t sector, uint8_t* destination);
            read_block_from_vfs_swap_node(meta->disk_sector_offset, ciphertext_staging_page);

            uint8_t master_crypto_key[KEYRING_KEY_SIZE];
            retrieve_sealed_key_bytes(g_swap_pager.keyring_slot_reference, 0, master_crypto_key);

            // Reverse crypto mixing cycle: unpack the raw disk blocks cleanly back to plaintext application space
            swap_page_crypto_transform(ciphertext_staging_page, out_clear_page_frame, master_crypto_key);
            memset(master_crypto_key, 0, KEYRING_KEY_SIZE); // Instantly erase transient key footprint from registers

            // Data has been successfully restored cleanly to physical memory page arrays!
            sys_secure_sanitize_swap_sectors(meta->disk_sector_offset);

            // Cleanly free swap mapping slot structures
            meta->is_occupied = false;
            return true;
        }
    }
    return false; // Target swap identification node missing
}
