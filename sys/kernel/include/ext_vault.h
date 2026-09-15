#pragma once
#include <stdint.h>
#include <stdbool.h>

#define MAX_VAULT_RULES      16
#define VAULT_MAGIC_TAG      0x45585456 // "EXTV" binary tracking tag

typedef struct {
    char extension_string[8]; // e.g., ".exe", ".ko", ".bin"
    uint32_t required_sandbox_tier; // Enforces minimum security level maps
    bool     is_restricted;
} ExtensionRuleNode;

typedef struct {
    uint32_t          magic;
    ExtensionRuleNode rule_database[MAX_VAULT_RULES];
    uint32_t          total_registered_rules;
    bool              is_vault_enforcing;
} SecureExtensionVaultRegistry;

void init_file_extension_vault(void);
bool sys_register_vault_restriction(const char* ext, uint32_t sandbox_tier);
bool verify_vfs_extension_compliance(const char* target_file_path, uint32_t process_sandbox_tier);