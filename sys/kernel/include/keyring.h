#pragma once
#include <stdint.h>
#include <stdbool.h>

#define KEYRING_MAX_SLOTS   8
#define KEYRING_KEY_SIZE    32 // 256-bit cryptographic keys
#define KEYRING_MAGIC_TAG   0x4B524E47 // "KRNG" tracking token

typedef enum {
    KEY_TYPE_STORAGE = 1,
    KEY_TYPE_NETWORK_TUNNEL,
    KEY_TYPE_AUTH_TOKEN
} KeyUsageType;

// Structured layout for an isolated master key slot
typedef struct {
    uint32_t     slot_id;
    KeyUsageType usage_type;
    uint8_t      sealed_key_data[KEYRING_KEY_SIZE];
    bool         is_sealed;
    uint32_t     authorized_owner_pid; // Only this process can query this slot
} KeyRingSlot;

typedef struct {
    uint32_t    magic;
    KeyRingSlot slots[KEYRING_MAX_SLOTS];
    uint32_t    allocated_slots;
    bool        vault_locked;
} MasterKeyRingVault;

// Secure Vault Internal Mappings
void init_hardware_keyring_vault(void);
int32_t generate_and_seal_master_key(KeyUsageType type, uint32_t owner_pid);
bool retrieve_sealed_key_bytes(uint32_t slot_id, uint32_t caller_pid, uint8_t* out_key_buffer);
void lock_down_hardware_keyring(void);void sys_manually_override_master_key(const uint8_t* key_bytes);
