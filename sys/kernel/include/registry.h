#pragma once
#include <stdint.h>
#include <stdbool.h>

#define REGISTRY_MAX_ENTRIES 64
#define REGISTRY_KEY_LEN     32
#define REGISTRY_VAL_LEN     64
#define REGISTRY_MAGIC_TAG   0x52454753 // "REGS" binary header tag

// The structural container for a single secure configuration entry
typedef struct {
    char     encrypted_key[REGISTRY_KEY_LEN];
    char     encrypted_value[REGISTRY_VAL_LEN];
    uint32_t val_length;
    bool     is_active;
} RegistryNode;

// Master database control state structure
typedef struct {
    uint32_t     magic;
    RegistryNode entries[REGISTRY_MAX_ENTRIES];
    uint32_t     total_records;
    bool         is_sealed;
} SecureRegistryStore;

// Kernel core function mappings
void init_system_registry(void);
bool registry_write_setting(const char* clear_key, const char* clear_value, uint32_t val_len);
bool registry_read_setting(const char* clear_key, char* out_clear_value, uint32_t max_len);