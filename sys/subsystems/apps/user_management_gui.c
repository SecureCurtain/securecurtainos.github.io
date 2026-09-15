#include "../network/sig_sync.h"
extern bool sys_unseal_hardware_lock_profile(uint32_t calling_pid, const char* input_admin_pin);
#include "user_management_gui.h"
#include "../network/net_services.h"
#include "../../kernel/include/net_config.h"
#include "../../kernel/include/net_whitelist.h"
#include "../../kernel/include/net_repo.h"
#include "../../kernel/include/user_space.h"
#include "../../kernel/include/rbac.h"
#include "../../kernel/include/security_audit.h"
#include "../../kernel/include/live_updater.h"
#include "../../kernel/include/driver_translator.h"
#include "../../kernel/include/policy_engine.h"
#include "../../kernel/include/defrag_shield.h"
#include <stdio.h>
#include <string.h>

extern void gfx_draw_filled_rect(uint32_t x, uint32_t y, uint32_t w, uint32_t h, uint32_t color);
extern void gfx_draw_string(uint32_t x, uint32_t y, const char* text, uint32_t color);
extern uint32_t query_active_focused_window_pid(void);
extern const char* prompt_admin_for_secondary_pin_dialog(void);
extern bool sys_validate_superadmin_pin(uint32_t pid, const char* input_pin);
extern void request_ui_composition_refresh(void);

static uint32_t g_selected_user_index = 1; // Default highlighted user: OperatorBob
static bool     g_admin_access_cleared = false;

extern MultiTenantControlRegistry g_user_manager;

void init_administrative_user_management_panel(void) {
    g_selected_user_index = 1;
    g_admin_access_cleared = false;
}


void draw_network_telemetry_widget(uint32_t wx, uint32_t wy) {
    // Render an inner telemetry grid card for network telemetry tasks
    gfx_draw_filled_rect(wx, wy, 348, 80, 0x0D1015);
    gfx_draw_string(wx + 12, wy + 10, "SEALED INTERFACE TELEMETRY CONSOLE:", 0x6E7485);

    uint32_t active_ip = 0, active_dns = 0;
    query_active_network_address(&active_ip, &active_dns);

    // Format binary IP bits back to human-readable strings on the fly
    char ip_str[64];
    char dns_str[64];
    snprintf(ip_str, sizeof(ip_str), "IPv4 Address : %d.%d.%d.%d", 
             (active_ip >> 24) & 0xFF, (active_ip >> 16) & 0xFF, (active_ip >> 8) & 0xFF, active_ip & 0xFF);
    snprintf(dns_str, sizeof(dns_str), "Primary DNS  : %d.%d.%d.%d", 
             (active_dns >> 24) & 0xFF, (active_dns >> 16) & 0xFF, (active_dns >> 8) & 0xFF, active_dns & 0xFF);

    gfx_draw_string(wx + 16, wy + 32, ip_str, 0x3CD070); // Eco-green active telemetry text
    gfx_draw_string(wx + 16, wy + 54, dns_str, 0xCCCCCC);
}


static void draw_oversized_slider_toggle_widget(uint32_t x, uint32_t y, bool is_enabled, const char* label) {
    uint32_t track_w = 64; // Large, easy-to-hit click bounding box dimensions
    uint32_t track_h = 24;

    // Draw background track line container
    uint32_t track_color = is_enabled ? 0x2E523E : 0x2A2E33; // Forest Green (ON) vs Dark Carbon (OFF)
    gfx_draw_filled_rect(x, y, track_w, track_h, track_color);
    
    // Draw the high-contrast sliding indicator knob block
    uint32_t knob_color = 0xFFFFFF;
    if (is_enabled) {
        // Slide knob to the far right side of the track container boundary
        gfx_draw_filled_rect(x + track_w - 20, y + 2, 18, track_h - 4, knob_color);
        gfx_draw_string(x + 10, y + 6, "ON", 0xFFFFFF);
    } else {
        // Slide knob to the far left side of the track container boundary
        gfx_draw_filled_rect(x + 2, y + 2, 18, track_h - 4, knob_color);
        gfx_draw_string(x + track_w - 30, y + 6, "OFF", 0x8A9FB4);
    }

    // Print the service description tag right beside the large slider tracks
    gfx_draw_string(x + track_w + 16, y + 5, label, 0xFFFFFF);
}

void render_administrative_user_management_panel(void) {
    uint32_t my_pid = query_active_focused_window_pid();
    
    // 1. ROLE BARRIER VALIDATION CHECK: Ensure only verified SuperAdmins can render this tool
    // If an unprivileged background task attempts to force render this canvas, block the display
    extern bool rbac_verify_privilege(uint32_t pid, uint32_t required_permission);
    if (!rbac_verify_privilege(my_pid, 0xFFFFFFFF /* PERM_SUPER_ADMIN mask */)) {
        gfx_draw_filled_rect(ADMIN_PANEL_X, ADMIN_PANEL_Y, ADMIN_PANEL_W, ADMIN_PANEL_H, 0x221111);
        gfx_draw_string(ADMIN_PANEL_X + 40, ADMIN_PANEL_Y + 200, "CRITICAL ERROR: Insufficient Security Role Privileges.", 0xFF3333);
        return;
    }

    // 2. Draw Main Application Cockpit Window Shell
    gfx_draw_filled_rect(ADMIN_PANEL_X, ADMIN_PANEL_Y, ADMIN_PANEL_W, ADMIN_PANEL_H, 0x14171E);
    gfx_draw_filled_rect(ADMIN_PANEL_X, ADMIN_PANEL_Y, ADMIN_PANEL_W, 32, 0x202530); // Header strip
    gfx_draw_string(ADMIN_PANEL_X + 16, ADMIN_PANEL_Y + 10, "Authoritative System Administration & User Management Console", 0xFFFFFF);

    // Left Column Card: Multi-Tenant User Registry List Grid Table
    uint32_t left_x = ADMIN_PANEL_X + 16;
    uint32_t left_y = ADMIN_PANEL_Y + 48;
    gfx_draw_filled_rect(left_x, left_y, 300, 240, 0x1A1E26);
    gfx_draw_string(left_x + 12, left_y + 12, "REGISTERED OPERATOR PROFILES:", 0x8A9FB4);
    gfx_draw_filled_rect(left_x + 12, left_y + 28, 276, 1, 0x2D3442);

    for (uint32_t i = 0; i < g_user_manager.registered_users_count; i++) {
        UserProfileNode* user = &g_user_manager.user_registry[i];
        uint32_t row_y = left_y + 40 + (i * 24);
        
        // Highlight active selection list item
        if (i == g_selected_user_index) {
            gfx_draw_filled_rect(left_x + 12, row_y - 4, 276, 20, 0x2A3442);
        }

        uint32_t status_color = user->is_locked_out ? 0xFF3333 : (user->is_logged_in ? 0x3CD070 : 0xCCCCCC);
        char user_row_string[64];
        snprintf(user_row_string, sizeof(user_row_string), "%-16s TIER:%d  [%s]", 
                 user->username, user->privilege_tier, user->is_locked_out ? "LOCKED" : (user->is_logged_in ? "ACTIVE" : "OFFLINE"));
        gfx_draw_string(left_x + 16, row_y, user_row_string, status_color);
    }

    // Right Column Card: Context Actions and Lockout Switches Dashboard
    uint32_t right_x = ADMIN_PANEL_X + 332;
    uint32_t right_y = ADMIN_PANEL_Y + 48;
    gfx_draw_filled_rect(right_x, right_y, 372, 240, 0x1A1E26);
    gfx_draw_string(right_x + 12, right_y + 12, "ACCOUNT PRIVILEGE MANAGEMENT MATRIX:", 0x8A9FB4);
    gfx_draw_filled_rect(right_x + 12, right_y + 28, 348, 1, 0x2D3442);

    UserProfileNode* selected_user = &g_user_manager.user_registry[g_selected_user_index];
    char target_lbl[64];
    snprintf(target_lbl, sizeof(target_lbl), "Target Profile: %s", selected_user->username);
    gfx_draw_string(right_x + 16, right_y + 44, target_lbl, 0xFFFFFF);

    // Render Account Reset Switch Button Box
    uint32_t switch_btn_y = right_y + 80;
    uint32_t switch_color = selected_user->is_locked_out ? 0xAA3333 : 0x3377AA;
    gfx_draw_filled_rect(right_x + 16, switch_btn_y, 220, 26, switch_color);
    gfx_draw_string(right_x + 28, switch_btn_y + 6, selected_user->is_locked_out ? "[ FLIP RESET SWITCH: UNLOCK ]" : "[ ACCOUNT CLEARANCE: SAFE ]", 0xFFFFFF);
    gfx_draw_string(right_x + 16, switch_btn_y + 36, "Clears consecutive violation flags and restores file privileges.", 0x6E7485);

    // Draw network configuration telemetry widget
    draw_network_telemetry_widget(right_x + 12, right_y + 144);

    // Lower Card: Transact-Sealed Core Hardware Components Manager
    uint32_t lower_x = ADMIN_PANEL_X + 16;
    uint32_t lower_y = ADMIN_PANEL_Y + 304;
    gfx_draw_filled_rect(lower_x, lower_y, 688, 180, 0x0E1116);
    
    gfx_draw_string(lower_x + 16, lower_y + 16, "MFA TOUCHY CORE HARDWARE RE-VERIFICATION PROTOCOLS:", 0x6E7485);
    gfx_draw_filled_rect(lower_x + 16, lower_y + 32, 656, 1, 0x202630);

    // Staged System Update Deployment Actions
    extern uint32_t query_pending_updates_count(void);
    uint32_t updates_count = query_pending_updates_count();
    char update_lbl[64];
    snprintf(update_lbl, sizeof(update_lbl), "Staged Update System Elements Pending: %d component nodes", updates_count);
    gfx_draw_string(lower_x + 20, lower_y + 48, update_lbl, updates_count > 0 ? 0xFFA726 : 0x8A8D9A);

    // Button: Commit Staged Upgrades
    gfx_draw_filled_rect(lower_x + 20, lower_y + 70, 200, 24, 0xAA6633); // Amber Admin task panel button
    gfx_draw_string(lower_x + 32, lower_y + 75, "[ SEAL & REBOOT UPDATE ]", 0xFFFFFF);

    // Translated Hardware Driver Finalization Actions
    gfx_draw_string(lower_x + 20, lower_y + 114, "Dynamic User-Space Sandbox Driver Conversion Matrix:", 0x8A8D9A);
    gfx_draw_filled_rect(lower_x + 20, lower_y + 134, 200, 24, 0x3388AA); // Blue Admin task panel button
    gfx_draw_string(lower_x + 36, lower_y + 139, "[ RE-INDEX DRIVER RING ]", 0xFFFFFF);

    gfx_draw_string(lower_x + 240, lower_y + 75, "Requires secondary alphanumeric alpha-numeric case-sensitive PIN handshake verification.", 0x555A64);

    
    // Append a dedicated Service Toggle Matrix layout card block
    uint32_t svc_card_x = ADMIN_PANEL_X + 240;
    uint32_t svc_card_y = ADMIN_PANEL_Y + 234;

    gfx_draw_filled_rect(svc_card_x, svc_card_y, 348, 90, 0x0D1015);
    gfx_draw_string(svc_card_x + 12, svc_card_y + 10, "HARDWARE NETWORK SERVICE DAEMONS:", 0x6E7485);

    // Append Automated Threat Intel Feeds Force Update Action Button
    uint32_t sync_btn_x = ADMIN_PANEL_X + 460;
    uint32_t sync_btn_y = ADMIN_PANEL_Y + 234;

    gfx_draw_filled_rect(sync_btn_x, sync_btn_y, 200, 24, 0x1F3D5C); // Cyber-blue interactive update button
    gfx_draw_string(sync_btn_x + 12, sync_btn_y + 5, "[ FORCE THREAT SYNC ]", 0xFFFFFF);

    // Draw the giant slider buttons sequentially onto the dashboard view
    // (Pulls active state booleans from your user space network configuration tables)
    draw_oversized_slider_toggle_widget(svc_card_x + 16, svc_card_y + 30, g_net_services.is_ssh_enabled, "Secure Terminal Shell (SSH) [Port 22]");
    draw_oversized_slider_toggle_widget(svc_card_x + 16, svc_card_y + 60, g_net_services.is_ftpes_enabled, "Explicit File Transfer (FTPES) [Port 21]");

    // Append Enterprise Domain Directory Join configuration shortcut action button
    
    uint32_t svc_card_x = ADMIN_PANEL_X + 240;
    uint32_t svc_card_y = ADMIN_PANEL_Y + 234;

    uint32_t sync_btn_x = ADMIN_PANEL_X + 460;
    uint32_t sync_btn_y = ADMIN_PANEL_Y + 234;

    if (mx >= sync_btn_x && mx <= sync_btn_x + 200 && my >= sync_btn_y && my <= sync_btn_y + 24) {
        printf("[Admin Cockpit]: Admin manually triggered an out-of-band threat intelligence sync pass...\\n");
        
        // Force an immediate fetch sequence across all three standard repositories loops
        for (uint32_t f = 0; f < 3; f++) {
            execute_mbedtls_feed_fetch(f);
        }
        
        request_ui_composition_refresh();
        return;
    }

    // 1. Collision Check: SSH Slider Bounding Coordinates (64 width x 24 height)
    if (mx >= svc_card_x + 16 && mx <= svc_card_x + 16 + 64 && my >= svc_card_y + 30 && my <= svc_card_y + 30 + 24) {
        printf("[Admin Cockpit]: Toggling SSH daemon state variable...\\n");
        bool current_state = g_net_services.is_ssh_enabled;
        
        // Push the administrative adjustment toggle directly down to your services core
        sys_toggle_network_service_state(my_pid, 1 /* SSH ID */, !current_state);
        request_ui_composition_refresh();
        return;
    }

    // 2. Collision Check: FTPES Slider Bounding Coordinates
    if (mx >= svc_card_x + 16 && mx <= svc_card_x + 16 + 64 && my >= svc_card_y + 60 && my <= svc_card_y + 60 + 24) {
        printf("[Admin Cockpit]: Toggling FTPES daemon state variable...\\n");
        bool current_state = g_net_services.is_ftpes_enabled;
        
        sys_toggle_network_service_state(my_pid, 2 /* FTPES ID */, !current_state);
        request_ui_composition_refresh();
        return;
    }

    uint32_t domain_btn_x = ADMIN_PANEL_X + 240;
    uint32_t domain_btn_y = ADMIN_PANEL_Y + 374;

    gfx_draw_filled_rect(domain_btn_x, domain_btn_y, 200, 24, 0x4A607A); // Enterprise slate theme button
    gfx_draw_string(domain_btn_x + 12, domain_btn_y + 5, "[ JOIN ACTIVE DIRECTORY ]", 0xFFFFFF);

    // Append VFS Defragmenter Shield configuration shortcut action button
    uint32_t defrag_btn_x = ADMIN_PANEL_X + 460;
    uint32_t defrag_btn_y = ADMIN_PANEL_Y + 374;

    gfx_draw_filled_rect(defrag_btn_x, defrag_btn_y, 200, 24, 0x5C462B); // Storage amber-brown theme button
    gfx_draw_string(defrag_btn_x + 12, defrag_btn_y + 5, "[ SCHED SECURE DEFRAG ]", 0xFFFFFF);
    // Append Network Whitelist bypass registration action button
    uint32_t wl_btn_x = ADMIN_PANEL_X + 460;
    uint32_t wl_btn_y = ADMIN_PANEL_Y + 330;
    gfx_draw_filled_rect(wl_btn_x, wl_btn_y, 200, 24, 0x2A523E); // Network-green theme button block
    gfx_draw_string(wl_btn_x + 12, wl_btn_y + 5, "[ WHITELIST SAFE IP ]", 0xFFFFFF);
    // Append Linux Subsystem Network Repository Management Sub-Widget View
    uint32_t repo_card_x = ADMIN_PANEL_X + 240;
    uint32_t repo_card_y = ADMIN_PANEL_Y + 144;

    gfx_draw_filled_rect(repo_card_x, repo_card_y, 348, 80, 0x0D1015);
    gfx_draw_string(repo_card_x + 12, repo_card_y + 10, "LINUX PERSONALITY PACKAGE REPOSITORIES:", 0x6E7485);

    char mirror_deb_buf[128], mirror_arch_buf[128];
    // Query our Ring 0 storage registry to fetch active mirror URLs on the fly
    char deb_url[64] = {0}; char arch_url[64] = {0};
    query_authorized_mirror_string(3400, deb_url, 63);
    query_authorized_mirror_string(3401, arch_url, 63);

    snprintf(mirror_deb_buf,  sizeof(mirror_deb_buf),  "APT Mirror  (DEB) : %s", deb_url[0] ? deb_url : "NONE");
    snprintf(mirror_arch_buf, sizeof(mirror_arch_buf), "PACMAN Mirror (Arch): %s", arch_url[0] ? arch_url : "NONE");

    gfx_draw_string(repo_card_x + 16, repo_card_y + 32, mirror_deb_buf, 0x26C6DA);  // Debian personality cyan text
    gfx_draw_string(repo_card_x + 16, repo_card_y + 54, mirror_arch_buf, 0x90A4AE); // Arch personality slate text

    // Dynamic Mirror Registration Trigger Button
    uint32_t add_repo_btn_y = ADMIN_PANEL_Y + 414;
    gfx_draw_filled_rect(ADMIN_PANEL_X + 460, add_repo_btn_y, 200, 24, 0x423B5C); // Corporate purple theme button block
    gfx_draw_string(ADMIN_PANEL_X + 472, add_repo_btn_y + 5, "[ ADD REPO MIRROR ]", 0xFFFFFF);

    // Append Motherboard Hardware Swap Unseal Action Button
    uint32_t unseal_btn_x = ADMIN_PANEL_X + 240;
    uint32_t unseal_btn_y = ADMIN_PANEL_Y + 414;
    gfx_draw_filled_rect(unseal_btn_x, unseal_btn_y, 200, 24, 0x7A2B2B); // High-contrast warning copper-crimson block
    gfx_draw_string(unseal_btn_x + 12, unseal_btn_y + 5, "[ UNSEAL MOBO LOCK ]", 0xFFFFFF);


}

void process_administrative_panel_mouse_clicks(uint32_t mx, uint32_t my) {
    uint32_t left_x = ADMIN_PANEL_X + 16;
    uint32_t left_y = ADMIN_PANEL_Y + 48;
    uint32_t right_x = ADMIN_PANEL_X + 332;
    uint32_t right_y = ADMIN_PANEL_Y + 48;
    uint32_t lower_x = ADMIN_PANEL_X + 16;
    uint32_t lower_y = ADMIN_PANEL_Y + 304;

    uint32_t my_pid = query_active_focused_window_pid();

    // 1. Task Item Selection: Detect list clicks inside the registered users window column mapping
    if (mx >= left_x + 12 && mx <= left_x + 288 && my >= left_y + 40 && my <= left_y + 160) {
        uint32_t clicked_row = (my - (left_y + 40)) / 24;
        if (clicked_row < g_user_manager.registered_users_count && clicked_row > 0) { // Keep SuperAdmin (Row 0) locked from modifications
            g_selected_user_index = clicked_row;
            request_ui_composition_refresh();
        }
        return;
    }

    // 2. Account Clearance Task: Toggle Account Lockout Reset Switch
    uint32_t switch_btn_y = right_y + 80;
    if (mx >= right_x + 16 && mx <= right_x + 236 && my >= switch_btn_y && my <= switch_btn_y + 26) {
        UserProfileNode* target_user = &g_user_manager.user_registry[g_selected_user_index];
        if (target_user->is_locked_out) {
            
            // SECONDARY PIN CHALLENGE: Elevating or clearing locks requires secondary PIN entry confirmation
            printf("[Admin Panel]: Triggering secondary case-sensitive verification PIN challenge vector...\\n");
            const char* input_pin = prompt_admin_for_secondary_pin_dialog();
            
            if (sys_validate_superadmin_pin(my_pid, input_pin)) {
                // Clear the active lockout parameters inside Ring 0 user registers
                target_user->is_locked_out = false;
                target_user->consecutive_violations_count = 0;
                
                char audit_desc[128];
                snprintf(audit_desc, sizeof(audit_desc), "Admin Task: Account %s manually unlocked and restored via Admin Panel.", target_user->username);
                commit_security_audit_entry(0x0002, "ADMIN_CONSOLE", audit_desc);
                printf("[Admin Panel]: Reset switch applied. Account cleared.\\n");
            } else {
                printf("[Admin Panel Error]: Invalid verification PIN. Reset token dismissed.\\n");
            }
            request_ui_composition_refresh();
        }
        return;
    }

    // 3. System Staging Update Task: Commit Staged Upgrades Button Loop
    if (mx >= lower_x + 20 && mx <= lower_x + 220 && my >= lower_y + 70 && my <= lower_y + 94) {
        printf("[Admin Panel]: Committing live update deployment verification passes...\\n");
        const char* input_pin = prompt_admin_for_secondary_pin_dialog();
        
        if (sys_validate_superadmin_pin(my_pid, input_pin)) {
            // Seals the configuration registry and forces an immediate clean hardware reboot
            extern void lock_down_hardware_keyring(void);
            lock_down_hardware_keyring();
            
            extern int32_t sys_power_management(uint32_t state);
            sys_power_management(4); // Trigger software restart reset
        }
        return;
    }

    uint32_t domain_btn_x = ADMIN_PANEL_X + 240;
    uint32_t domain_btn_y = ADMIN_PANEL_Y + 374;

    // Check if the administrator clicked the Active Directory Enrollment action target button
    if (mx >= domain_btn_x && mx <= domain_btn_x + 200 && my >= domain_btn_y && my <= domain_btn_y + 24) {
        printf("[Admin Cockpit]: Deploying user-space domain network client daemon loops...\\n");
        sys_enroll_into_ad_domain("corp.prototype.internal", "OU=SecuredNodes,DC=corp,DC=internal", 0x2A9C1B04);
        request_ui_composition_refresh();
    }

    uint32_t defrag_btn_x = ADMIN_PANEL_X + 460;
    uint32_t defrag_btn_y = ADMIN_PANEL_Y + 374;

    if (mx >= defrag_btn_x && mx <= defrag_btn_x + 200 && my >= defrag_btn_y && my <= defrag_btn_y + 24) {
        printf("[Admin Cockpit]: Submitting transactional sector re-alignment request...\\n");
        bool queued = sys_queue_cluster_optimization(my_pid, 8200, 9500, 16);
        if (queued) {
            execute_secure_defrag_pass();
            printf("[Admin Cockpit]: Secure defragmentation sweep complete. Obsolete source data blocks shredded.\\n");
        }
        request_ui_composition_refresh();
    }

    uint32_t wl_btn_x = ADMIN_PANEL_X + 460;
    uint32_t wl_btn_y = ADMIN_PANEL_Y + 330;
    if (mx >= wl_btn_x && mx <= wl_btn_x + 200 && my >= wl_btn_y && my <= wl_btn_y + 24) {
        printf("[Admin Cockpit]: Registering runtime trusted external IP bypass rule...\\n");
        // Securely whitelist a remote administrative workstation IP node (e.g., 192.168.1.50)
        sys_register_whitelisted_ip(my_pid, 0xC0A80132, "Admin Workstation");
        request_ui_composition_refresh();
    }

    uint32_t unseal_btn_x = ADMIN_PANEL_X + 240;
    uint32_t unseal_btn_y = ADMIN_PANEL_Y + 414;
    if (mx >= unseal_btn_x && mx <= unseal_btn_x + 200 && my >= unseal_btn_y && my <= unseal_btn_y + 24) {
        printf("[Admin Cockpit]: Initiating secure motherboard profile unseal request...\\n");
        const char* admin_pin_input = prompt_admin_for_secondary_pin_dialog();

        if (sys_unseal_hardware_lock_profile(my_pid, admin_pin_input)) {
            printf("[Admin Cockpit]: Hardware profile unsealed. Safe to initiate power down loops.\\n");
        }
        request_ui_composition_refresh();
    }

}
