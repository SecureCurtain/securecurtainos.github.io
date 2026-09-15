#include "user_admin_panel.h"
#include "../../kernel/include/user_space.h"
#include "../../kernel/include/rbac.h"
#include "../../kernel/include/security_audit.h"
#include <stdio.h>
#include <string.h>

#define PANEL_X   60
#define PANEL_Y   60
#define PANEL_W   540
#define PANEL_H   360

extern void gfx_draw_filled_rect(uint32_t x, uint32_t y, uint32_t w, uint32_t h, uint32_t color);
extern void gfx_draw_string(uint32_t x, uint32_t y, const char* text, uint32_t color);
extern uint32_t query_active_focused_window_pid(void);
extern const char* prompt_admin_for_secondary_pin_dialog(void);
extern bool sys_validate_superadmin_pin(uint32_t pid, const char* input_pin);

// Access external user database array safely via declared tracking symbols
extern MultiTenantControlRegistry g_user_manager;

void render_administrative_user_control_panel(void) {
    uint32_t my_pid = query_active_focused_window_pid();
    
    // PRIVILEGE BARRIER: Verify calling process token possesses SuperAdmin rights before drawing panel
    if (!rbac_verify_privilege(my_pid, 0xFFFFFFFF /* Master mask clearance */)) {
        gfx_draw_filled_rect(PANEL_X, PANEL_Y, PANEL_W, PANEL_H, 0x221111);
        gfx_draw_string(PANEL_X + 40, PANEL_Y + 160, "SECURITY FAULT: Administrative Privileges Required.", 0xFF3333);
        return;
    }

    // Draw main management dashboard console window shell
    gfx_draw_filled_rect(PANEL_X, PANEL_Y, PANEL_W, PANEL_H, 0x15181F);
    gfx_draw_filled_rect(PANEL_X, PANEL_Y, PANEL_W, 28, 0x232833);
    gfx_draw_string(PANEL_X + 16, PANEL_Y + 8, "Administrative Multi-Tenant User Management Station", 0xFFFFFF);

    gfx_draw_string(PANEL_X + 20, PANEL_Y + 44, "ACTIVE REAL-TIME USER ACCOUNTS REGISTRY:", 0x8A9FB4);
    gfx_draw_filled_rect(PANEL_X + 20, PANEL_Y + 60, PANEL_W - 40, 1, 0x2C3240);

    // List all configured user profiles dynamically from the Ring 0 database
    for (uint32_t i = 0; i < g_user_manager.registered_users_count; i++) {
        UserProfileNode* user = &g_user_manager.user_registry[i];
        uint32_t line_y = PANEL_Y + 76 + (i * 24);
        
        uint32_t status_color = user->is_locked_out ? 0xFF3333 : (user->is_logged_in ? 0x3CD070 : 0x999999);
        char user_info_row[128];
        snprintf(user_info_row, sizeof(user_info_row), "%-16s UID:%04d   TIER:%d   [%s]", 
                 user->username, user->uid, user->privilege_tier, user->is_locked_out ? "LOCKED OUT" : (user->is_logged_in ? "ACTIVE" : "OFFLINE"));
        
        gfx_draw_string(PANEL_X + 24, line_y, user_info_row, status_color);

        // Render individual [ UNLOCK ] reset switches exclusively for locked accounts
        if (user->is_locked_out) {
            uint32_t btn_x = PANEL_X + PANEL_W - 130;
            gfx_draw_filled_rect(btn_x, line_y - 2, 110, 18, 0x336699); // Blue interactive switch button
            gfx_draw_string(btn_x + 10, line_y + 2, "[ RESET SWITCH ]", 0xFFFFFF);
        }
    }

    gfx_draw_string(PANEL_X + 20, PANEL_Y + PANEL_H - 40, "Note: Overriding locks requires multi-factor alpha-numeric case-sensitive PIN validation.", 0x555A64);
}

void render_administrative_user_management_panel(void) {
    render_administrative_user_control_panel();
}

void process_user_admin_panel_clicks(uint32_t mx, uint32_t my) {
    uint32_t my_pid = query_active_focused_window_pid();

    for (uint32_t i = 0; i < g_user_manager.registered_users_count; i++) {
        UserProfileNode* user = &g_user_manager.user_registry[i];
        if (!user->is_locked_out) continue;

        uint32_t line_y = PANEL_Y + 76 + (i * 24);
        uint32_t btn_x = PANEL_X + PANEL_W - 130;

        // Collision coordinator tracking click intersections over account reset switches
        if (mx >= btn_x && mx <= btn_x + 110 && my >= line_y - 2 && my <= line_y + 16) {
            printf("[Admin Utility]: Unlock trigger fired for user: %s. Initiating secondary PIN challenge...\\n", user->username);
            
            // Pop open secondary verification challenge window modal text entry boxes
            const char* admin_pin_input = prompt_admin_for_secondary_pin_dialog();

            if (sys_validate_superadmin_pin(my_pid, admin_pin_input)) {
                // Clear the active lockout parameters inside Ring 0 user registers
                user->is_locked_out = false;
                user->consecutive_violations_count = 0;

                char log_desc[128];
                snprintf(log_desc, sizeof(log_desc), "Administrative Override: Account lock cleared manually for user: %s", user->username);
                commit_security_audit_entry(0x0002 /* EVENT_LOCKSCREEN_UNLOCKED */, "USER_ADMIN", log_desc);
                printf("[Admin Utility]: Reset switch verified. Account cleared.\\n");
            } else {
                printf("[Admin Utility Error]: Secondary case-sensitive validation PIN mismatch. Operation dismissed.\\n");
            }
            break;
        }
    }
}
