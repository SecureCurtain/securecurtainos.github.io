#include "net_repo.h"
#include "rbac.h"
#include "registry.h"
#include "sandbox.h"
#include "security_audit.h"
#include <string.h>
#include <stdio.h>

static EnterpriseRepoRegistry g_repo_manager;

extern bool registry_write_setting(const char* key, const char* val, uint32_t len);

void init_network_repository_subsystem(void) {
    memset(&g_repo_manager, 0, sizeof(EnterpriseRepoRegistry));
    g_repo_manager.magic = REPO_MAGIC_TAG;
    g_repo_manager.total_configured_mirrors = 0;
    g_repo_manager.force_strict_ssl_verification = true;

    printf("[Kernel Net Repo]: Linux mirror site repository registry online.\\n");

    // Pre-seed trusted vanilla baseline mirrors for both OS personalities on system boot
    // 1. Pre-seed standard Debian Apt repository address mirror site
    sys_register_linux_mirror(0, REPO_TYPE_DEBIAN_APT, "https://debian.org", "bookworm");

    // 2. Pre-seed standard Arch Linux Pacman repository address mirror site
    sys_register_linux_mirror(0, REPO_TYPE_ARCH_PACMAN, "https://pkgbuild.com", "core");
}

bool sys_register_linux_mirror(uint32_t calling_pid, LinuxRepoType type, const char* url, const char* codename) {
    if (g_repo_manager.total_configured_mirrors >= MAX_REPOS_REGISTERED) return false;
    if (strlen(url) >= MAX_URL_LEN || strlen(codename) >= 32) return false;

    // PRIVILEGE BARRIER: Modifying network repository profiles requires verified NetAdmin or SuperAdmin clearance
    if (calling_pid != 0 && !rbac_verify_privilege(calling_pid, 0x00000002 /* PERM_INJECT_FIREWALL equivalent */)) {
        printf("[Net Repo Error]: Security rejection: Insufficient administrative privileges.\\n");
        return false;
    }

    // Verify sandbox memory access boundaries if invoked via user-space calls
    if (calling_pid != 0) {
        if (!validate_memory_access_bounds(calling_pid, (uint64_t)url, strlen(url), false) ||
            !validate_memory_access_bounds(calling_pid, (uint64_t)codename, strlen(codename), false)) {
            return false;
        }
    }

    uint32_t idx = g_repo_manager.total_configured_mirrors;
    RepositoryMirrorNode* node = &g_repo_manager.registry[idx];

    node->repo_id = idx + 3400;
    node->os_personality_type = type;
    strncpy(node->mirror_url, url, MAX_URL_LEN - 1);
    strncpy(node->distribution_codename, codename, 31);
    node->require_signed_packages = true;
    node->is_enabled = true;

    g_repo_manager.total_configured_mirrors++;

    // Serialize the newly injected repository data variables straight into the secure configuration registry database
    char key_buf[64], val_buf[128];
    snprintf(key_buf, sizeof(key_buf), "sys.net.repo.%d.url", node->repo_id);
    snprintf(val_buf, sizeof(val_buf), "%d|%s", type, url);
    registry_write_setting(key_buf, val_buf, strlen(val_buf));

    printf("[Net Repo Registry]: Registered %s Mirror ID %d -> %s (%s)\\n",
           (type == REPO_TYPE_DEBIAN_APT) ? "Debian" : "Arch", node->repo_id, url, codename);
    return true;
}

bool sys_toggle_mirror_status(uint32_t calling_pid, uint32_t repo_id, bool enable) {
    if (!rbac_verify_privilege(calling_pid, 0x00000002)) return false;

    for (uint32_t i = 0; i < g_repo_manager.total_configured_mirrors; i++) {
        if (g_repo_manager.registry[i].repo_id == repo_id) {
            g_repo_manager.registry[i].is_enabled = enable;
            printf("[Net Repo Registry]: Mirror ID %d status toggled to: %s\\n", repo_id, enable ? "ENABLED" : "DISABLED");
            return true;
        }
    }
    return false;
}

bool query_authorized_mirror_string(uint32_t repo_id, char* out_url_buffer, uint32_t max_len) {
    for (uint32_t i = 0; i < g_repo_manager.total_configured_mirrors; i++) {
        RepositoryMirrorNode* node = &g_repo_manager.registry[i];
        if (node->repo_id == repo_id && node->is_enabled) {
            strncpy(out_url_buffer, node->mirror_url, max_len);
            return true;
        }
    }
    return false;
}
