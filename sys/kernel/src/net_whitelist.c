#include "net_whitelist.h"
#include "rbac.h"
#include "security_audit.h"
#include "keyring.h"
#include <string.h>
#include <stdio.h>

static SecureWhitelistRegistry g_net_whitelist;

void init_network_whitelist_subsystem(void) {
    memset(&g_net_whitelist, 0, sizeof(SecureWhitelistRegistry));
    g_net_whitelist.magic = WHITELIST_MAGIC_TAG;
    g_net_whitelist.total_entries = 0;
    g_net_whitelist.strict_bypass_active = true;

    printf("[Kernel Whitelist]: Administrative connection bypass matrix armed.\\n");

    // Pre-seed local trusted loopback and gateway interface routes natively
    sys_register_whitelisted_ip(0, 0x7F000001, "Localhost Loopback"); // 127.0.0.1
    sys_register_whitelisted_ip(0, 0x0A000001, "Microkernel Core Int"); // 10.0.0.1
}

bool sys_register_whitelisted_ip(uint32_t calling_pid, uint32_t ip, const char* desc) {
    if (g_net_whitelist.total_entries >= MAX_WHITELIST_ENTRIES) return false;

    // PRIVILEGE BARRIER: Modifying network bypass structures requires verified NetAdmin clearance
    if (calling_pid != 0 && !rbac_verify_privilege(calling_pid, 0x00000002 /* PERM_INJECT_FIREWALL */)) {
        printf("[Whitelist Error]: Security rejection: Insufficient role permissions.\\n");
        return false;
    }

    // Check for pre-existing records to avoid duplicate array allocations
    for (uint32_t i = 0; i < g_net_whitelist.total_entries; i++) {
        if (g_net_whitelist.entries[i].is_active && g_net_whitelist.entries[i].ipv4_address == ip) {
            return true;
        }
    }

    uint32_t idx = g_net_whitelist.total_entries;
    WhitelistEntryNode* entry = &g_net_whitelist.entries[idx];
    entry->ipv4_address = ip;
    strncpy(entry->node_description, desc, 31);
    entry->is_active = true;

    g_net_whitelist.total_entries++;
    printf("[Whitelist DB]: Sealed trusted IP bypass slot: %d.%d.%d.%d [%s]\\n",
           (ip >> 24) & 0xFF, (ip >> 16) & 0xFF, (ip >> 8) & 0xFF, ip & 0xFF, desc);
    return true;
}

bool verify_is_ip_whitelisted_secure(uint32_t incoming_ip, uint64_t hardware_token_signature) {
    if (!g_net_whitelist.strict_bypass_active) return false;

    for (uint32_t i = 0; i < g_net_whitelist.total_entries; i++) {
        WhitelistEntryNode* entry = &g_net_whitelist.entries[i];

        if (entry->is_active && entry->ipv4_address == incoming_ip) {
            // Local loopback and internal core gateway bypass without external signature
            if (incoming_ip == 0x7F000001 || incoming_ip == 0x0A000001) {
                return true;
            }

            // --- DUAL-FACTOR CRYPTOGRAPHIC VERIFICATION STEP ---
            // Re-verify the incoming hardware token signature using your Keyring Vault
            uint8_t admin_token_key[KEYRING_KEY_SIZE];
            retrieve_sealed_key_bytes(0 /* Master Vault Slot */, 0 /* Kernel PID */, admin_token_key);

            // Compute a constant-time validation check against the token signature
            uint64_t computed_expected_token = ((uint64_t)incoming_ip << 32) ^ (*(uint64_t*)admin_token_key);
            
            if (hardware_token_signature == computed_expected_token) {
                return true; // Match confirmed: True admin verified via physical key signature
            } else {
                // IP matched but the cryptographic key signature was missing or forged!
                static uint32_t alert_rate = 0;
                if (alert_rate++ % 10 == 0) {
                    commit_security_audit_entry(EVENT_AUTH_FAILURE, "SPOOF_SHIELD", "CRITICAL WARNING: Intercepted spoofed IP packet matching a whitelisted node!");
                }
                return false; // Deny access instantly
            }
            // ----------------------------------------------------
        }
    }
    return false;
}

bool verify_is_ip_whitelisted(uint32_t incoming_ip) {
    // Computes default expected hardware token for backward compatible internal queries
    uint8_t admin_token_key[KEYRING_KEY_SIZE];
    retrieve_sealed_key_bytes(0, 0, admin_token_key);
    uint64_t expected_token = ((uint64_t)incoming_ip << 32) ^ (*(uint64_t*)admin_token_key);
    return verify_is_ip_whitelisted_secure(incoming_ip, expected_token);
}
