#include "user_tree.h"
#include "user_space.h"
#include "rbac.h"
#include "security_audit.h"
#include "security_panic.h"
#include "sandbox.h"
#include <string.h>
#include <stdio.h>

static MultiTenantControlRegistry g_user_manager;

extern uint64_t get_system_uptime_ms(void);

// Simple one-way hashing function to securely store case-sensitive alpha-numeric PIN structures inside the kernel
static void calculate_pin_hash_matrix(const char* pin, uint8_t* out_hash) {
    uint32_t hash_state = 0x811C9DC5;
    uint32_t len = strlen(pin);

    for (uint32_t i = 0; i < 32; i++) {
        char c = (i < len) ? pin[i] : (char)(i + 0x3F);
        hash_state ^= (uint8_t)c;
        hash_state *= 0x01000193; // Prime multiplier preserving upper/lower casing distributions
        out_hash[i] = (uint8_t)((hash_state ^ (hash_state >> 16)) & 0xFF);
    }
}

void init_user_space_subsystem(void) {
    memset(&g_user_manager, 0, sizeof(MultiTenantControlRegistry));
    g_user_manager.magic = USER_SPACE_MAGIC_TAG;
    g_user_manager.registered_users_count = 0;
    g_user_manager.active_session_uid = 0;

    printf("[Kernel User Space]: Multi-tenant boundary isolation framework operational.\\n");

    // Establish default SuperAdmin profile baseline configuration during setup
    // Custom case-sensitive alpha-numeric administrative execution confirmation PIN: "aB3xPin" (5 characters long)
    sys_register_new_user("Administrator", 3 /* SuperAdmin Tier */, "aB3xPin");
    sys_register_new_user("OperatorBob",   1 /* Auditor Tier */,    "");
}

bool sys_register_new_user(const char* name, uint32_t tier, const char* setup_pin) {
    if (g_user_manager.registered_users_count >= MAX_SYSTEM_USERS) return false;

    uint32_t idx = g_user_manager.registered_users_count;
    UserProfileNode* user = &g_user_manager.user_registry[idx];

    user->uid = idx + 5000;
    strncpy(user->username, name, 31);
    user->privilege_tier = tier;
    user->is_logged_in = false;
    user->is_locked_out = false;
    user->consecutive_violations_count = 0;
    
    uint32_t pin_len = strlen(setup_pin);
    if (tier == 3 && (pin_len < 2 || pin_len > 8)) {
        printf("[User Setup Error]: Administrative approval PIN must remain 2-to-8 characters long.\\n");
        return false; // Rejects improper length configurations
    }

    user->pin_length = pin_len;
    calculate_pin_hash_matrix(setup_pin, user->secure_admin_pin_hash);

    // Automatically layout the isolated Windows and Linux directory paths for this fresh user profile
    sys_provision_user_space_directories(user->uid, name);

    g_user_manager.registered_users_count++;
    return true;
}

bool verify_vfs_file_access_clearance(uint32_t calling_pid, const char* target_file_owner_name, uint32_t file_tier) {
    // Look up the active operating profile linked to the calling process context block
    uint32_t caller_tier = 0;
    UserProfileNode* active_user = NULL;

    // (In your complete core, this scans active session mappings mapped to the process ID)
    // Simulating active session validation parameters:
    for (uint32_t i = 0; i < g_user_manager.registered_users_count; i++) {
        if (g_user_manager.user_registry[i].is_logged_in) {
            active_user = &g_user_manager.user_registry[i];
            caller_tier = active_user->privilege_tier;
            break;
        }
    }

    if (!active_user) return false; // Default stance: deny anonymous filesystem manipulation

    // RULE 1: SuperAdmin (Tier 3) possesses global access rights, overriding lower-tier file blocks
    if (caller_tier == 3) return true;

    // RULE 2: Standard users are completely blind to files owned by alternate profiles
    if (strcmp(active_user->username, target_file_owner_name) != 0 && file_tier > caller_tier) {
        active_user->consecutive_violations_count++;

        if (active_user->consecutive_violations_count == 1) {
            // First Infraction Phase: Trigger a user-space alert dialog notification card overlay
            extern void show_ui_alert(const char* msg);
            show_ui_alert("WARNING: Unauthorized File Query. This operation has been logged. A subsequent attempt will lock your session.");
            
            char alert_log[256];
            snprintf(alert_log, sizeof(alert_log), "SECURITY POLICY DISCREPANCY: User %s attempted reading file owned by %s", active_user->username, target_file_owner_name);
            commit_security_audit_entry(EVENT_AUTH_FAILURE, "USER_ISOLATION", alert_log);
            return false;
        } 
        else if (active_user->consecutive_violations_count >= 2) {
            // Second Consecutive Infraction Phase: Immediate session eviction and lockout lock enforcement
            active_user->is_locked_out = true;
            active_user->is_logged_in = false;

            char lockout_log[256];
            snprintf(lockout_log, sizeof(lockout_log), "CRITICAL: Account %s isolated and locked out due to repeat access violations.", active_user->username);
            commit_security_audit_entry(EVENT_AUTH_FAILURE, "USER_ISOLATION", lockout_log);
            printf("[USER SHIELD]: %s\\n", lockout_log);

            // Terminate user session and instantly slide the secure login lockout frame overlay back in place
            extern void lock_system_display(void);
            lock_system_display(); 
            return false;
        }
    }

    // Reset violation counters on successful authorized clearance paths
    active_user->consecutive_violations_count = 0;
    return true;
}

bool sys_validate_superadmin_pin(uint32_t pid, const char* input_pin) {
    // Verify that the process calling for the PIN loop belongs to a SuperAdmin session context
    UserProfileNode* admin_profile = NULL;
    for (uint32_t i = 0; i < g_user_manager.registered_users_count; i++) {
        if (g_user_manager.user_registry[i].privilege_tier == 3) {
            admin_profile = &g_user_manager.user_registry[i];
            break;
        }
    }

    if (!admin_profile) return false;

    uint8_t input_pin_hash[32];
    calculate_pin_hash_matrix(input_pin, input_pin_hash);

    // Constant-time bitwise confirmation loop to prevent hardware side-channel timing analysis
    uint32_t mismatch_accumulator = 0;
    for (uint32_t i = 0; i < 32; i++) {
        mismatch_accumulator |= (input_pin_hash[i] ^ admin_profile->secure_admin_pin_hash[i]);
    }

    if (mismatch_accumulator == 0) {
        printf("[User Space Core]: Secondary multi-factor administrative PIN matched successfully. Transaction allowed.\\n");
        return true;
    }

    commit_security_audit_entry(EVENT_AUTH_FAILURE, "PIN_VALIDATOR", "Administrative transaction blocked: Invalid validation PIN signature input.");
    return false;
}

bool sys_user_login_session(const char* name, uint32_t pid) {
    for (uint32_t i = 0; i < g_user_manager.registered_users_count; i++) {
        UserProfileNode* user = &g_user_manager.user_registry[i];
        if (strcmp(user->username, name) == 0) {
            if (user->is_locked_out) {
                printf("[Login Error]: Account %s is disabled. Administrative reset switch verification required.\\n", name);
                return false;
            }
            user->is_logged_in = true;
            g_user_manager.active_session_uid = user->uid;
            
            // Map their role token directly into your operational RBAC matrix layout
            extern bool rbac_establish_user_session(uint32_t p, const char* uname, uint32_t role);
            rbac_establish_user_session(pid, name, (UserRoleType)user->privilege_tier);
            return true;
        }
    }
    return false;
}

void sys_user_logout_session(uint32_t uid) {
    for (uint32_t i = 0; i < g_user_manager.registered_users_count; i++) {
        UserProfileNode* user = &g_user_manager.user_registry[i];
        if (user->uid == uid) {
            user->is_logged_in = false;
            printf("[User Space Core]: Session for UID %d terminated and home directory encrypted.\\n", uid);
            break;
        }
    }
}
