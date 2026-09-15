#include "rbac.h"
#include "security_audit.h"
#include <string.h>
#include <stdio.h>

static RbacControlRegistry g_rbac_manager;

void init_rbac_subsystem(void) {
    memset(&g_rbac_manager, 0, sizeof(RbacControlRegistry));
    g_rbac_manager.magic = RBAC_MAGIC_TAG;
    g_rbac_manager.total_roles = 0;

    printf("[Kernel RBAC]: Policy definition matrices operational.\\n");

    // =========================================================================
    // POPULATION OF THE EXPLICIT ROLE-BASED ACCESS CONTROL MATRIX
    // =========================================================================
    
    // 1. Security Auditor -> Can read audit logs, but cannot change network rules or clock registers
    rbac_register_role_profile(ROLE_SECURITY_AUDITOR, PERM_READ_AUDIT_LOGS, "Auditor");

    // 2. Network Administrator -> Can inject firewall filters and manage tarpits
    rbac_register_role_profile(ROLE_NETWORK_ADMIN, PERM_INJECT_FIREWALL, "NetAdmin");

    // 3. System Configuration Officer -> Can modify clock frames and system registry parameters
    rbac_register_role_profile(ROLE_SYSTEM_CONFIG, PERM_MODIFY_SYSTEM_TIME | PERM_ACCESS_REGISTRY, "SysConfig");

    // 4. Super Administrator -> Possesses total omnipotent system clearance caps
    rbac_register_role_profile(ROLE_SUPER_ADMIN, 0xFFFFFFFF, "SuperAdmin");
}

void rbac_register_role_profile(UserRoleType role, uint32_t perm_mask, const char* name) {
    if (g_rbac_manager.total_roles >= MAX_ROLES_REGISTERED) return;

    RoleDefinitionNode* node = &g_rbac_manager.role_table[g_rbac_manager.total_roles];
    node->role_type = role;
    node->allowed_permissions_mask = perm_mask;
    strncpy(node->role_name, name, 15);

    g_rbac_manager.total_roles++;
}

bool rbac_establish_user_session(uint32_t pid, const char* username, UserRoleType role) {
    for (uint32_t i = 0; i < MAX_ACTIVE_SESSIONS; i++) {
        if (!g_rbac_manager.active_sessions[i].is_valid) {
            UserSessionToken* token = &g_rbac_manager.active_sessions[i];
            token->process_id = pid;
            strncpy(token->username, username, 31);
            token->assigned_role = role;
            token->is_valid = true;

            printf("[RBAC Engine]: Established privilege token for User: %s [Role: %s] linked to PID %d\\n", 
                   username, g_rbac_manager.role_table[role - 1].role_name, pid);
            return true;
        }
    }
    return false; // Session pool limit saturated
}

void rbac_terminate_user_session(uint32_t pid) {
    for (uint32_t i = 0; i < MAX_ACTIVE_SESSIONS; i++) {
        if (g_rbac_manager.active_sessions[i].is_valid && g_rbac_manager.active_sessions[i].process_id == pid) {
            g_rbac_manager.active_sessions[i].is_valid = false;
            break;
        }
    }
}

bool rbac_verify_privilege(uint32_t pid, uint32_t required_permission) {
    // 1. Locate the active session matching the executing process ID context
    for (uint32_t i = 0; i < MAX_ACTIVE_SESSIONS; i++) {
        UserSessionToken* token = &g_rbac_manager.active_sessions[i];

        if (token->is_valid && token->process_id == pid) {
            // 2. Fetch the corresponding permission mask for the assigned role
            for (uint32_t r = 0; r < g_rbac_manager.total_roles; r++) {
                if (g_rbac_manager.role_table[r].role_type == token->assigned_role) {
                    
                    // 3. Bitwise verification step evaluating authorization status
                    if ((g_rbac_manager.role_table[r].allowed_permissions_mask & required_permission) == required_permission) {
                        return true; // Clearance matched!
                    }

                    // Abuse detection vector: An authenticated process attempted an unassigned call parameter
                    char anomaly_desc[128];
                    snprintf(anomaly_desc, sizeof(anomaly_desc), 
                             "RBAC VIOLATION: User %s (PID %d) denied permission bit 0x%08X", 
                             token->username, pid, required_permission);
                    
                    commit_security_audit_entry(EVENT_AUTH_FAILURE, "RBAC_VALIDATOR", anomaly_desc);
                    printf("[SECURITY WARNING]: %s\\n", anomaly_desc);
                    return false;
                }
            }
        }
    }

    // Default posture fallback: Deny all actions if process lacks an explicitly mapped session token
    return false;
}
