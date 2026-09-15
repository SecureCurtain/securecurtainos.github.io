#pragma once
#include <stdint.h>
#include <stdbool.h>

#define MAX_SYSTEM_USERS     16
#define PIN_MAX_LEN          8
#define USER_SPACE_MAGIC_TAG 0x55535043 // "USPC" binary tracking tag

typedef struct {
    uint32_t uid;
    char     username[32];
    uint32_t privilege_tier; // 0=Regular User, 1=Auditor, 2=NetAdmin, 3=SuperAdmin
    bool     is_logged_in;
    bool     is_locked_out;
    uint32_t consecutive_violations_count;
    uint8_t  secure_admin_pin_hash[32]; // Secondary alpha-numeric confirmation PIN
    uint32_t pin_length;
} UserProfileNode;

typedef struct {
    uint32_t        magic;
    UserProfileNode user_registry[MAX_SYSTEM_USERS];
    uint32_t        registered_users_count;
    uint32_t        active_session_uid;
} MultiTenantControlRegistry;

// Microkernel Core Multi-User Isolation Mappings
void init_user_space_subsystem(void);
bool sys_register_new_user(const char* name, uint32_t tier, const char* setup_pin);
bool sys_user_login_session(const char* name, uint32_t pid);
void sys_user_logout_session(uint32_t uid);
bool sys_validate_superadmin_pin(uint32_t pid, const char* input_pin);
bool verify_vfs_file_access_clearance(uint32_t calling_pid, const char* target_file_owner_name, uint32_t file_tier);