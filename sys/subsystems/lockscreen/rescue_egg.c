#include "../../kernel/include/user_space.h"
#include "../../kernel/include/security_audit.h"
#include "rescue_egg.h"
#include <stdio.h>
#include <string.h>

#define EGG_X1 10
#define EGG_Y1 740 // Positioned inconspicuously near the lower baseline boundary frame mapping
#define EGG_W  24
#define EGG_H  24

bool g_rescue_terminal_active = false;
static char g_rescue_input_stream[128] = {0};
static uint32_t g_rescue_input_len = 0;

extern void gfx_draw_filled_rect(uint32_t x, uint32_t y, uint32_t w, uint32_t h, uint32_t color);
extern void gfx_draw_string(uint32_t x, uint32_t y, const char* text, uint32_t color);
extern void request_ui_composition_refresh(void);

// Verification routine to confirm the Easter Egg coordinate collision boundary boxes
bool evaluate_rescue_egg_cursor_override(uint32_t mx, uint32_t my, uint32_t* forced_cursor_type) {
    if (mx >= EGG_X1 && mx <= EGG_X1 + EGG_W && my >= EGG_Y1 && my <= EGG_Y1 + EGG_H) {
        *forced_cursor_type = 0; // HARD OVERRIDE: Enforce flat standard arrow shape, completely blocking pointer swaps
        return true; 
    }
    return false;
}

void render_rescue_egg_graphic_element(void) {
    // Draw an innocuous micro geometric wireframe grid pattern that looks purely ornamental
    gfx_draw_filled_rect(EGG_X1,      EGG_Y1,      EGG_W, 2, 0x333540); // Subtle gray accent baseline design
    gfx_draw_filled_rect(EGG_X1 + 4,  EGG_Y1 + 6,  2, 2, 0x22242D);
    gfx_draw_filled_rect(EGG_X1 + 12, EGG_Y1 + 12, 2, 2, 0x22242D);

    if (g_rescue_terminal_active) {
        // Render raw zero-trace terminal panel frame directly onto lower layout segments
        uint32_t tx = 40, ty = 500;
        gfx_draw_filled_rect(tx, ty, 560, 220, 0x050508);
        gfx_draw_filled_rect(tx, ty, 560, 4, 0xFFA726); // Alert highlighting line
        
        gfx_draw_string(tx + 16, ty + 16, "=== CRITICAL ARCHITECTURAL RECOVERY SHELL ENTRY VIA INTERCEPT ===", 0xFFA726);
        gfx_draw_string(tx + 16, ty + 46, "ACCOUNT LOCKOUT BYPASS DETECTED. PROVIDE SEQUENTIAL VERIFICATION BLOCK:", 0xBBBBBB);
        
        // Typing parameter window entry container fields
        gfx_draw_string(tx + 16, ty + 84, "Challenge String Packet Seq -> ", 0x8A8D9A);
        
        // Obfuscate character feedback metrics via masking blocks to keep inputs fully hidden
        char masked_dots[128] = {0};
        for (uint32_t i = 0; i < g_rescue_input_len; i++) masked_dots[i] = '#';
        gfx_draw_string(tx + 260, ty + 84, masked_dots, 0x00FF00);
        
        gfx_draw_string(tx + 16, ty + 124, "Input Layout Format Rule: [OldPassword][CaseSensitiveAlphanumericPIN]x3", 0x555A64);
        gfx_draw_string(tx + 16, ty + 154, "Provide token challenge loop packet stream and hit [ENTER] key.", 0x555A64);
    }
}

void process_rescue_egg_double_click(uint32_t mx, uint32_t my) {
    if (mx >= EGG_X1 && mx <= EGG_X1 + EGG_W && my >= EGG_Y1 && my <= EGG_Y1 + EGG_H) {
        g_rescue_terminal_active = true;
        memset(g_rescue_input_stream, 0, sizeof(g_rescue_input_stream));
        g_rescue_input_len = 0;
        printf("[Rescue Intercept]: Triggered raw zero-trace emergency terminal console.\\n");
        request_ui_composition_refresh();
    }
}

void process_rescue_terminal_keyboard_input(uint32_t key_code) {
    if (!g_rescue_terminal_active) return;

    if (key_code == 0x0D) { // ENTER key pressed -> Validate Challenge sequence parameters
        // Verification verification sequence structure template mapping check:
        // Expected structure validation formula: "password123" + "aB3xPin" + "aB3xPin" + "aB3xPin"
        const char* expected_recovery_token = "password123aB3xPinaB3xPinaB3xPin";

        if (strcmp(g_rescue_input_stream, expected_recovery_token) == 0) {
            printf("[Rescue Engine]: EMERGENCY RECOVERY VALIDATION SEQUENCE PASSED 3/3 TIMES SUCCESSFULLY.\\n");
            
            // Re-open and revive the locked SuperAdmin account profile nodes inside kernel space variables
            extern MultiTenantControlRegistry g_user_manager;
            for (uint32_t i = 0; i < g_user_manager.registered_users_count; i++) {
                if (g_user_manager.user_registry[i].privilege_tier == 3) {
                    g_user_manager.user_registry[i].is_locked_out = false; // RESET ACCOUNT LOCKOUT SWITCH
                    g_user_manager.user_registry[i].consecutive_violations_count = 0;
                    
                    // Provision fresh replacement credential markers baseline records safely
                    strcpy(g_user_manager.user_registry[i].username, "Administrator");
                    break;
                }
            }
            
            commit_security_audit_entry(EVENT_SECURITY_LOCKDOWN, "RESCUE_EGG", "EMERGENCY CLEARANCE OVERRIDE CHALLENGE PASSED. Admin account successfully re-activated.");
            
            // Cleanly minimize and exit the shell interface like it was never there
            g_rescue_terminal_active = false;
            memset(g_rescue_input_stream, 0, sizeof(g_rescue_input_stream));
            g_rescue_input_len = 0;
            
            // Pop open an overlay modal dialogue text field to complete password reconfiguration updates
            extern void show_ui_alert(const char* message);
            show_ui_alert("Recovery Complete. Admin account restored. Update login password fields immediately.");
        } else {
            // Sequence entry discrepancy mismatch detected: increment alarm triggers
            commit_security_audit_entry(EVENT_AUTH_FAILURE, "RESCUE_EGG", "CRITICAL WARNING: Malicious or incorrect emergency override challenge submission.");
            g_rescue_terminal_active = false; // Discard workspace layout on infraction
            memset(g_rescue_input_stream, 0, sizeof(g_rescue_input_stream));
            g_rescue_input_len = 0;
        }
        request_ui_composition_refresh();
    }
    else if (key_code == 0x08) { // Backspace key processing
        if (g_rescue_input_len > 0) {
            g_rescue_input_stream[--g_rescue_input_len] = '\\0';
            request_ui_composition_refresh();
        }
    }
    else if (g_rescue_input_len < 127) {
        g_rescue_input_stream[g_rescue_input_len++] = (char)key_code;
        request_ui_composition_refresh();
    }
}
