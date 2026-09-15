#pragma once
#include <stdint.h>
#include <stdbool.h>

#define MAX_REPOS_REGISTERED  16
#define MAX_URL_LEN           128
#define REPO_MAGIC_TAG        0x4E524550 // "NREP" binary tracking tag

typedef enum {
    REPO_TYPE_DEBIAN_APT = 1,
    REPO_TYPE_ARCH_PACMAN
} LinuxRepoType;

typedef struct {
    uint32_t      repo_id;
    LinuxRepoType os_personality_type;
    char          mirror_url[MAX_URL_LEN];
    char          distribution_codename[32]; // e.g., "bookworm" or "core"
    bool          require_signed_packages;
    bool          is_enabled;
} RepositoryMirrorNode;

typedef struct {
    uint32_t             magic;
    RepositoryMirrorNode registry[MAX_REPOS_REGISTERED];
    uint32_t             total_configured_mirrors;
    bool                 force_strict_ssl_verification;
} EnterpriseRepoRegistry;

// Microkernel Core Repository System Call Mappings
void init_network_repository_subsystem(void);
bool sys_register_linux_mirror(uint32_t calling_pid, LinuxRepoType type, const char* url, const char* codename);
bool sys_toggle_mirror_status(uint32_t calling_pid, uint32_t repo_id, bool enable);
bool query_authorized_mirror_string(uint32_t repo_id, char* out_url_buffer, uint32_t max_len);