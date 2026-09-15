#pragma once
#include <stdint.h>
#include <stdbool.h>

#define USER_TREE_MAGIC_TAG  0x55545245 // "UTRE" binary tracking token

typedef struct {
    uint32_t magic;
    bool     are_windows_paths_mapped;
    bool     are_linux_paths_mapped;
    uint32_t owner_uid;
} UserSpaceTreeManifest;

// Microkernel Directory Tree Generation Primitives
void init_user_space_tree_provisioner(void);
bool sys_provision_user_space_directories(uint32_t uid, const char* username);
bool verify_application_path_sandbox_tier(uint32_t calling_pid, const char* accessed_vfs_path, uint32_t required_tier);

void sys_provision_shared_desktop_environment_variables(uint32_t target_pid, uint8_t personality_type);
