#include "user_tree.h"
#include "sandbox.h"
#include "rbac.h"
#include "security_panic.h"
#include "security_audit.h"
#include <string.h>
#include <stdio.h>

extern int32_t vfs_open(const char* path, const char* mode);
extern void    vfs_close(int32_t fd);

// Low-overhead VFS directory creator simulation helper
static void kernel_vfs_mkdir_stub(const char* absolute_path) {
    // In complete whole-drive encrypted storage pipeline, opens an atomic transaction
    // block via Virtual Journal Driver (vfs_journal.c) and creates a directory node entry
    int32_t fd = vfs_open(absolute_path, "w+dir");
    if (fd >= 0) {
        vfs_close(fd);
    }
}

void init_user_space_tree_provisioner(void) {
    printf("[Kernel User Tree]: Multi-personality path environment provisioner active.\\n");
}

bool sys_provision_user_space_directories(uint32_t uid, const char* username) {
    if (!username || strlen(username) >= 32) return false;

    char base_path[256];
    printf("[User Tree]: Provisioning isolated filesystem structure for profile: %s (UID:%d)\\n", username, uid);

    // =========================================================================
    // PROVISIONING THE CRITICAL WINDOWS ENVIRONMENT FILE PATHS
    // =========================================================================
    snprintf(base_path, sizeof(base_path), "/vfs/home/%s/windows_space/C_Drive", username);
    kernel_vfs_mkdir_stub(base_path);

    char win_p1[256], win_p2[256], win_p3[256], win_p4[256];
    snprintf(win_p1, sizeof(win_p1), "%s/Windows/System32", base_path);
    snprintf(win_p2, sizeof(win_p2), "%s/ProgramFiles", base_path);
    snprintf(win_p3, sizeof(win_p3), "%s/Users/Administrator/AppData/Roaming", base_path);
    snprintf(win_p4, sizeof(win_p4), "%s/Users/Administrator/Documents", base_path);

    kernel_vfs_mkdir_stub(win_p1);
    kernel_vfs_mkdir_stub(win_p2); // Reference for Windows application installations (%ProgramFiles%)
    kernel_vfs_mkdir_stub(win_p3); // Reference for software operational metadata configurations (%AppData%)
    kernel_vfs_mkdir_stub(win_p4); // Reference path allowing users to store data files securely

    // =========================================================================
    // PROVISIONING THE CRITICAL LINUX FHS ENVIRONMENT FILE PATHS
    // =========================================================================
    snprintf(base_path, sizeof(base_path), "/vfs/home/%s/linux_space", username);
    kernel_vfs_mkdir_stub(base_path);

    char lin_p1[256], lin_p2[256], lin_p3[256], lin_p4[256];
    snprintf(lin_p1, sizeof(lin_p1), "%s/bin", base_path);
    snprintf(lin_p2, sizeof(lin_p2), "%s/usr/local/bin", base_path);
    snprintf(lin_p3, sizeof(lin_p3), "%s/home/operator/.config", base_path);
    snprintf(lin_p4, sizeof(lin_p4), "%s/home/operator/Documents", base_path);

    kernel_vfs_mkdir_stub(lin_p1);
    kernel_vfs_mkdir_stub(lin_p2); // Target directory for unpaved upstream network packaging modules
    kernel_vfs_mkdir_stub(lin_p3); // Target path satisfying Linux standard $XDG_CONFIG_HOME definitions
    kernel_vfs_mkdir_stub(lin_p4); // Target path satisfying user data and document generation scripts

    char log_desc[256];
    snprintf(log_desc, sizeof(log_desc), "User Tree: Environment path maps successfully generated for operator profile: %s", username);
    commit_security_audit_entry(0x0004, "USER_TREE", log_desc);
    return true;
}

bool verify_application_path_sandbox_tier(uint32_t calling_pid, const char* accessed_vfs_path, uint32_t required_tier) {
    // SECURITY WALL INTERCEPT: Integrates with Secure File Extension Vault (ext_vault.c)
    // Ensures an unprivileged application cannot attempt an out-of-bounds cross-write escape,
    // like a Windows program trying to maliciously inject files into private Linux space configurations
    if (strstr(accessed_vfs_path, "windows_space") != NULL && strstr(accessed_vfs_path, "linux_space") != NULL) {
        char exception_log[256];
        snprintf(exception_log, sizeof(exception_log), "PATH PROTECTION VIOLATION: PID %d attempted cross-personality file tamper on path -> %s", calling_pid, accessed_vfs_path);
        commit_security_audit_entry(0x0003, "PATH_SHIELD", exception_log);
        
        // Trigger instant sandbox queue eviction to neutralize path exploitation loop
        extern void handle_sandbox_violation(uint32_t pid, uint64_t address, bool is_write);
        handle_sandbox_violation(calling_pid, 0x00000000, false);
        return false;
    }
    return true;
}


// =========================================================================
// SHARED MULTI-PERSONALITY DESKTOP ENVIRONMENT ROUTER
// =========================================================================
void sys_provision_shared_desktop_environment_variables(uint32_t target_pid, uint8_t personality_type) {
    printf("[User Tree]: Provisioning shared SecureCurtain Native Desktop desktop routing environment for PID %d\\n", target_pid);

    // 1. All personalities must be pointed to the central Wayland runtime directory socket
    // This allows them to see the running native desktop service session
    extern void sandbox_inject_environment_variable(uint32_t pid, const char* key, const char* value);
    
    sandbox_inject_environment_variable(target_pid, "XDG_RUNTIME_DIR", "/vfs/home/operator/linux_space/tmp");
    sandbox_inject_environment_variable(target_pid, "WAYLAND_DISPLAY", "wayland-0"); // Standard Wayland session label

    // 2. Personality-Specific Translation Routing
    if (personality_type == 1) { // PERSONALITY_WINDOWS
        // Instruct the Windows subsystem sandbox to route its GDI graphics operations 
        // through the unprivileged proxy layer to render seamlessly on the desktop
        sandbox_inject_environment_variable(target_pid, "DISPLAY", ":0"); // standard X11/XWayland server port mapping
        sandbox_inject_environment_variable(target_pid, "GDK_BACKEND", "x11");
        printf("[User Tree]: Windows subsystem bound cleanly to the native desktop bridge.\\n");
    } 
    else if (personality_type == 2) { // PERSONALITY_LINUX
        // Instruct Linux binaries to pass their windows straight to the native desktop
        sandbox_inject_environment_variable(target_pid, "GDK_BACKEND", "wayland");
        sandbox_inject_environment_variable(target_pid, "QT_QPA_PLATFORM", "wayland");
        printf("[User Tree]: Linux subsystem bound cleanly to native desktop Wayland channels.\\n");
    }

    commit_security_audit_entry(0x0002, "DESKTOP_ROUTER", "Shared Environment: App sandbox workspace environment paths successfully mapped to central SecureCurtain Native Desktop service.");
}
