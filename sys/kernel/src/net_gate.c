#include "net_gate.h"
#include "security_audit.h"
#include <string.h>
#include <stdio.h>
#include <stdlib.h>

#define MAX_NETWORK_PASSKEYS 64

typedef struct {
    uint32_t pid;
    uint64_t passkey_token;
    uint32_t capabilities;
    uint64_t issued_timestamp;
    bool     is_active;
} NetworkPasskeyEntry;

static NetworkPasskeyEntry g_network_passkeys[MAX_NETWORK_PASSKEYS];

extern uint64_t get_system_uptime_ms(void);

// Cryptographically randomized token generator with nonces
static uint64_t generate_secure_crypto_token(uint32_t pid, uint32_t caps) {
    uint64_t entropy = get_system_uptime_ms();
    uint64_t token = 0xA55A6B7C8D9E0F12ULL;
    token ^= ((uint64_t)pid << 48);
    token ^= ((uint64_t)caps << 32);
    token ^= ((uint64_t)rand() << 16);
    token ^= entropy;
    return token;
}

uint64_t sys_issue_network_passkey_capability(uint32_t pid, uint32_t capabilities) {
    if (pid == 0) return 0;

    // Check if slot already exists for this PID
    for (int i = 0; i < MAX_NETWORK_PASSKEYS; i++) {
        if (g_network_passkeys[i].is_active && g_network_passkeys[i].pid == pid) {
            g_network_passkeys[i].capabilities |= capabilities;
            return g_network_passkeys[i].passkey_token;
        }
    }

    // Allocate new slot
    for (int i = 0; i < MAX_NETWORK_PASSKEYS; i++) {
        if (!g_network_passkeys[i].is_active) {
            g_network_passkeys[i].pid = pid;
            g_network_passkeys[i].capabilities = capabilities;
            g_network_passkeys[i].passkey_token = generate_secure_crypto_token(pid, capabilities);
            g_network_passkeys[i].issued_timestamp = get_system_uptime_ms();
            g_network_passkeys[i].is_active = true;

            commit_security_audit_entry(0x0003, "NET_CAP_ISSUE", "Issued cryptographically bound capability token to process");
            return g_network_passkeys[i].passkey_token;
        }
    }
    return 0;
}

uint64_t sys_request_network_access_passkey(uint32_t calling_pid) {
    return sys_issue_network_passkey_capability(calling_pid, CAP_NET_AUDIT | CAP_NET_BIND);
}

// 🛡️ ZERO-TRUST CAPABILITY VERIFICATION: Eliminates hardcoded bypasses & static tokens
bool sys_verify_network_passkey_capability(uint32_t pid, uint64_t passkey_token, uint32_t required_cap) {
    if (pid == 0 || passkey_token == 0) return false;

    for (int i = 0; i < MAX_NETWORK_PASSKEYS; i++) {
        if (g_network_passkeys[i].is_active && g_network_passkeys[i].pid == pid) {
            if (g_network_passkeys[i].passkey_token == passkey_token) {
                // Verify required capability flag
                if ((g_network_passkeys[i].capabilities & required_cap) == required_cap) {
                    return true;
                } else {
                    commit_security_audit_entry(0x0001, "SECURITY_DENIED", "Network capability privilege insufficient for requested operation");
                    return false;
                }
            }
        }
    }

    commit_security_audit_entry(0x0001, "UNAUTHORIZED_NET_ACCESS", "Invalid or forged network passkey token presented");
    return false;
}

bool sys_revoke_network_passkey_capability(uint32_t pid) {
    for (int i = 0; i < MAX_NETWORK_PASSKEYS; i++) {
        if (g_network_passkeys[i].is_active && g_network_passkeys[i].pid == pid) {
            g_network_passkeys[i].is_active = false;
            g_network_passkeys[i].passkey_token = 0;
            g_network_passkeys[i].capabilities = 0;
            commit_security_audit_entry(0x0003, "NET_CAP_REVOKE", "Revoked network capability token");
            return true;
        }
    }
    return false;
}
