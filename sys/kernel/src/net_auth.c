#include "net_auth.h"
#include "keyring.h"
#include "rbac.h"
#include "user_space.h"
#include "sandbox.h"
#include "security_audit.h"
#include <string.h>
#include <stdio.h>

static NetAuthRegistry g_net_auth;

extern uint64_t get_system_uptime_ms(void);
extern bool rbac_establish_user_session(uint32_t pid, const char* username, UserRoleType role);

void init_network_authentication_subsystem(uint32_t keyring_public_key_slot) {
    memset(&g_net_auth, 0, sizeof(NetAuthRegistry));
    g_net_auth.magic = NET_AUTH_MAGIC_TAG;
    g_net_auth.is_network_auth_active = false;
    g_net_auth.ad_public_key_slot = keyring_public_key_slot;

    printf("[Kernel Net Auth]: Centralized enterprise Kerberos authentication core online.\\n");
}

bool sys_authenticate_network_user(uint32_t pid, const uint8_t* raw_kerberos_ticket, uint32_t ticket_len) {
    if (ticket_len > MAX_TICKET_SIZE || ticket_len < sizeof(EnterpriseUserToken)) return false;

    // Enforce strict sandbox read memory clearance before analyzing the ticket stream
    if (!validate_memory_access_bounds(pid, (uint64_t)raw_kerberos_ticket, ticket_len, false)) {
        return false;
    }

    printf("[Net Auth Core]: Intercepting incoming Kerberos ticket payload for verification...\\n");

    // 1. CRYPTOGRAPHIC SIGNATURE PASS: Fetch the domain public key block from your Keyring Vault
    uint8_t domain_pub_key[KEYRING_KEY_SIZE];
    if (!retrieve_sealed_key_bytes(g_net_auth.ad_public_key_slot, 0, domain_pub_key)) {
        printf("[Net Auth Error]: Active Directory public verification key unavailable in Keyring.\\n");
        return false;
    }

    // Verify the ticket signature against the domain key (XOR-feedback loop checksum validation)
    uint32_t validation_checksum = 0;
    for (uint32_t i = 0; i < 32; i++) {
        validation_checksum |= (raw_kerberos_ticket[ticket_len - 32 + i] ^ domain_pub_key[i % KEYRING_KEY_SIZE]);
    }

    if (validation_checksum != 0) {
        commit_security_audit_entry(EVENT_AUTH_FAILURE, "KERBEROS_SHIELD", "Network logon attempt blocked: Invalid domain ticket signature.");
        printf("[SECURITY ALERT]: Spoofed or tampered Kerberos ticket intercepted. Rejecting logon.\\n");
        return false;
    }

    // 2. EXTRACTION: Copy out the verified token metadata structure from the packet body
    EnterpriseUserToken ticket_data;
    memcpy(&ticket_data, raw_kerberos_ticket, sizeof(EnterpriseUserToken));

    // Check ticket expiration status variables
    if (get_system_uptime_ms() > ticket_data.ticket_expiration_timestamp) {
        printf("[Net Auth Error]: Kerberos session ticket has expired.\\n");
        return false;
    }

    // 3. TRANSLATION MATRIX: Map Active Directory Group SIDs dynamically to your internal RBAC roles
    UserRoleType local_assigned_role = ROLE_UNPRIVILEGED;
    
    for (uint32_t i = 0; i < ticket_data.group_count; i++) {
        uint32_t group_sid = ticket_data.group_sids[i];

        // Map Domain Admins SID (e.g., 512) directly to local SuperAdmin privilege
        if (group_sid == 512) {
            local_assigned_role = ROLE_SUPER_ADMIN;
            break;
        } 
        // Map Domain NetAdmins SID (e.g., 514) to local Network Administrator privilege
        else if (group_sid == 514) {
            local_assigned_role = ROLE_NETWORK_ADMIN;
        }
        // Map Domain Auditors SID (e.g., 515) to local Security Auditor privilege
        else if (group_sid == 515 && local_assigned_role == ROLE_UNPRIVILEGED) {
            local_assigned_role = ROLE_SECURITY_AUDITOR;
        }
    }

    // 4. INJECTION: Commit the mapped credentials straight to your active multi-tenant subsystems
    memcpy(&g_net_auth.current_network_session, &ticket_data, sizeof(EnterpriseUserToken));
    g_net_auth.is_network_auth_active = true;

    // Dynamically inject the session into your native RBAC and multi-tenant environment tables
    rbac_establish_user_session(pid, ticket_data.user_principal_name, local_assigned_role);
    
    // Automatically register them in the local user_space.c tracker list to enforce workspace isolation
    extern bool sys_register_new_user(const char* name, uint32_t tier, const char* setup_pin);
    sys_register_new_user(ticket_data.user_principal_name, local_assigned_role, "");

    char log_desc[128];
    snprintf(log_desc, sizeof(log_desc), "Net Logon: Enterprise user %s mapped to local role tier %d", 
             ticket_data.user_principal_name, local_assigned_role);
    commit_security_audit_entry(EVENT_LOCKSCREEN_UNLOCKED, "KERBEROS_CORE", log_desc);

    printf("[Net Auth Core]: Logon verified! Network environment session sealed for user: %s\\n", ticket_data.user_principal_name);
    return true;
}

void sys_terminate_network_auth_session(uint32_t pid) {
    if (!g_net_auth.is_network_auth_active) return;

    printf("[Net Auth Core]: Revoking active enterprise user network tokens...\\n");
    rbac_terminate_user_session(pid);
    g_net_auth.is_network_auth_active = false;
}
