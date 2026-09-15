#include "registry.h"
#include "pm_core.h"
#include <string.h>
#include <stdio.h>

static SecureRegistryStore g_system_registry;

extern SwapCryptoContext g_hibernation_crypto;

// Helper to encrypt or decrypt data inline using the kernel session key
static void registry_crypto_transform(const char* input, char* output, uint32_t length) {
    for (uint32_t i = 0; i < length; i++) {
        // Fetch sub-key indexes directly from your core ephemeral cryptographic block
        uint8_t key_byte = g_hibernation_crypto.key_buffer[i % SWAP_ENCRYPTION_KEY_SIZE];
        output[i] = input[i] ^ key_byte;
    }
}

void init_system_registry(void) {
    memset(&g_system_registry, 0, sizeof(SecureRegistryStore));
    g_system_registry.magic = REGISTRY_MAGIC_TAG;
    g_system_registry.total_records = 0;
    g_system_registry.is_sealed = false;

    printf("[Kernel Registry]: Secure transactional key-value store initialized.\\n");

    // Pre-populate core operational system configurations safely
    registry_write_setting("sys.lockscreen.time", "10", 2);
    registry_write_setting("sys.sleep.time",      "20", 2);
    registry_write_setting("sys.vpn.peer_ip",     "192.168.1.100", 13);
}

bool registry_write_setting(const char* clear_key, const char* clear_value, uint32_t val_len) {
    if (g_system_registry.is_sealed || val_len >= REGISTRY_VAL_LEN) return false;

    // Check if key already exists to overwrite it safely
    for (uint32_t i = 0; i < g_system_registry.total_records; i++) {
        char temporary_decrypted_key[REGISTRY_KEY_LEN] = {0};
        registry_crypto_transform(g_system_registry.entries[i].encrypted_key, temporary_decrypted_key, REGISTRY_KEY_LEN);
        
        if (g_system_registry.entries[i].is_active && strcmp(temporary_decrypted_key, clear_key) == 0) {
            // Re-encrypt and overwrite value bytes
            memset(g_system_registry.entries[i].encrypted_value, 0, REGISTRY_VAL_LEN);
            registry_crypto_transform(clear_value, g_system_registry.entries[i].encrypted_value, val_len);
            g_system_registry.entries[i].val_length = val_len;
            return true;
        }
    }

    // Abort if registry table structure is maxed out
    if (g_system_registry.total_records >= REGISTRY_MAX_ENTRIES) return false;

    RegistryNode* new_node = &g_system_registry.entries[g_system_registry.total_records];
    
    // Encrypt both key strings and value strings to keep configuration footprints obfuscated in memory
    registry_crypto_transform(clear_key, new_node->encrypted_key, REGISTRY_KEY_LEN);
    registry_crypto_transform(clear_value, new_node->encrypted_value, val_len);
    
    new_node->val_length = val_len;
    new_node->is_active = true;

    g_system_registry.total_records++;
    return true;
}

bool registry_read_setting(const char* clear_key, char* out_clear_value, uint32_t max_len) {
    for (uint32_t i = 0; i < g_system_registry.total_records; i++) {
        if (!g_system_registry.entries[i].is_active) continue;

        char temporary_decrypted_key[REGISTRY_KEY_LEN] = {0};
        registry_crypto_transform(g_system_registry.entries[i].encrypted_key, temporary_decrypted_key, REGISTRY_KEY_LEN);

        // Match found against a stored configuration key element
        if (strcmp(temporary_decrypted_key, clear_key) == 0) {
            uint32_t length_to_copy = (g_system_registry.entries[i].val_length > max_len) ? max_len : g_system_registry.entries[i].val_length;
            
            // Decrypt the raw stored database value directly into the output storage array window
            registry_crypto_transform(g_system_registry.entries[i].encrypted_value, out_clear_value, length_to_copy);
            return true;
        }
    }
    return false; // Option code key lookup missing
}
