#pragma once
#include <stdint.h>
#include <stdbool.h>

#define RBAC_MAGIC_TAG       0x52424143 // "RBAC" binary tracking tag
#define MAX_ROLES_REGISTERED 8
#define MAX_ACTIVE_SESSIONS  16

// Operational Permission Bitmasks
#define PERM_NONE            0x00000000
#define PERM_READ_AUDIT_LOGS 0x00000001 // Clearance for log_exporter & security_viewer
#define PERM_INJECT_FIREWALL 0x00000002 // Clearance for fw_injector & tarpit
#define PERM_MODIFY_SYSTEM_TIME 0x00000004 // Clearance for rtc_shield adjustments
#define PERM_UPDATE_BINARIES 0x00000008 // Clearance for live_updater staging
#define PERM_ACCESS_REGISTRY 0x00000010 // Clearance for system registry writes

// Role Classification Descriptors
typedef enum {
    ROLE_UNPRIVILEGED = 0,
    ROLE_SECURITY_AUDITOR,
    ROLE_NETWORK_ADMIN,
    ROLE_SYSTEM_CONFIG,
    ROLE_SUPER_ADMIN
} UserRoleType;

typedef struct {
    UserRoleType role_type;
    uint32_t     allowed_permissions_mask;
    char         role_name[16];
} RoleDefinitionNode;

// Real-time active user session container tracking hardware contexts
typedef struct {
    uint32_t     process_id;
    char         username[32];
    UserRoleType assigned_role;
    bool         is_valid;
} UserSessionToken;

typedef struct {
    uint32_t           magic;
    RoleDefinitionNode role_table[MAX_ROLES_REGISTERED];
    UserSessionToken   active_sessions[MAX_ACTIVE_SESSIONS];
    uint32_t           total_roles;
} RbacControlRegistry;

// Microkernel Core Permission Mappings
void init_rbac_subsystem(void);
void rbac_register_role_profile(UserRoleType role, uint32_t perm_mask, const char* name);
bool rbac_establish_user_session(uint32_t pid, const char* username, UserRoleType role);
void rbac_terminate_user_session(uint32_t pid);
bool rbac_verify_privilege(uint32_t pid, uint32_t required_permission);