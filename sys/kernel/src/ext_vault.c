#include "ext_vault.h"
#include "security_panic.h"
#include "security_audit.h"
#include <string.h>
#include <stdio.h>

static SecureExtensionVaultRegistry g_ext_vault;

void init_file_extension_vault(void) {
    memset(&g_ext_vault, 0, sizeof(SecureExtensionVaultRegistry));
    g_ext_vault.magic = VAULT_MAGIC_TAG;
    g_ext_vault.total_registered_rules = 0;
    g_ext_vault.is_vault_enforcing = true;

    printf("[Kernel Vault]: Structural VFS file format extension isolation barriers armed.\\n");

    // Pre-seed absolute lock definitions on boot setup execution parameters
    sys_register_vault_restriction(".exe", 2); // Windows executable formats locked to Tier 2+ sandboxes
    sys_register_vault_restriction(".ko",  2); // Linux kernel driver formats locked to Tier 2+ sandboxes
    sys_register_vault_restriction(".bin", 1); // Native binary formats locked to Tier 1+ sandboxes
}

bool sys_register_vault_restriction(const char* ext, uint32_t sandbox_tier) {
    if (g_ext_vault.total_registered_rules >= MAX_VAULT_RULES || strlen(ext) >= 8) return false;

    uint32_t idx = g_ext_vault.total_registered_rules;
    ExtensionRuleNode* rule = &g_ext_vault.rule_database[idx];
    
    strncpy(rule->extension_string, ext, 7);
    rule->required_sandbox_tier = sandbox_tier;
    rule->is_restricted = true;
    g_ext_vault.total_registered_rules++;
    
    printf("[Extension Vault]: Sealed format boundary constraint: '%s' bound to Sandbox Tier %d\\n", ext, sandbox_tier);
    return true;
}

bool verify_vfs_extension_compliance(const char* target_file_path, uint32_t process_sandbox_tier) {
    if (!g_ext_vault.is_vault_enforcing || !target_file_path) return true;

    // Isolate and extract file extension suffix from path strings
    const char* extension_dot = strrchr(target_file_path, '.');
    if (!extension_dot) return true; // File lacks extension tracking strings, bypass

    for (uint32_t i = 0; i < g_ext_vault.total_registered_rules; i++) {
        ExtensionRuleNode* rule = &g_ext_vault.rule_database[i];
        if (rule->is_restricted && strcmp(rule->extension_string, extension_dot) == 0) {
            
            // POLICY BOUNDARY CHECK: Evaluate application tier capabilities against extension vault laws
            if (process_sandbox_tier < rule->required_sandbox_tier) {
                char alert_desc[128];
                snprintf(alert_desc, sizeof(alert_desc), "VAULT BREACH BLOCKED: Process Tier %u denied opening '%s'", process_sandbox_tier, target_file_path);
                commit_security_audit_entry(0x0003 /* EVENT_AUTH_FAILURE */, "EXT_VAULT", alert_desc);
                printf("[SECURITY FAULT]: %s -> Access denied.\\n", alert_desc);
                return false; // Breach attempt blocked: reject VFS file stream assembly parameters
            }
        }
    }
    return true; // Extension compliant with sandbox policy maps
}
