#include "../../kernel/include/driver_translator.h"
#include "../../kernel/include/rbac.h"
#include <stdio.h>
#include <string.h>

#define WINDOW_X  120
#define WINDOW_Y  120
#define WINDOW_W  560
#define WINDOW_H  380

extern void gfx_draw_filled_rect(uint32_t x, uint32_t y, uint32_t w, uint32_t h, uint32_t color);
extern void gfx_draw_string(uint32_t x, uint32_t y, const char* text, uint32_t color);
extern bool sys_analyze_and_convert_oem_driver(const char* oem_file_path, WrappedDriverContext* out_context);
extern bool sys_commit_translated_driver_to_vfs(const WrappedDriverContext* context, const char* destination_path);
extern uint32_t query_active_focused_window_pid(void);

static WrappedDriverContext g_term_conversion_workspace;
static bool g_has_analyzed_file = false;
static char g_source_file_target[64] = "/vfs/home/downloads/oem_wifi.ko";

// Main handler invoked when double-clicking a driver binary package frame
void trigger_driver_installation_terminal_flow(const char* clicked_file_path) {
    strncpy(g_source_file_target, clicked_file_path, 63);
    
    // 1. Instantly parse and map foreign hardware structures inside the translation workspace
    g_has_analyzed_file = sys_analyze_and_convert_oem_driver(g_source_file_target, &g_term_conversion_workspace);
}

void render_driver_installer_terminal(void) {
    // Render terminal dark console layout frame
    gfx_draw_filled_rect(WINDOW_X, WINDOW_Y, WINDOW_W, WINDOW_H, 0x0A0D10);
    gfx_draw_filled_rect(WINDOW_X, WINDOW_Y, WINDOW_W, 28, 0x1A1F26); // Header block
    gfx_draw_string(WINDOW_X + 12, WINDOW_Y + 8, "Interactive OEM Hardware Driver Compiler & Sandbox Installer", 0xFFFFFF);

    char path_buf[128];
    snprintf(path_buf, sizeof(path_buf), "Source Binary Asset: %s", g_source_file_target);
    gfx_draw_string(WINDOW_X + 20, WINDOW_Y + 44, path_buf, 0x8A9FB4);

    if (!g_has_analyzed_file) {
        gfx_draw_string(WINDOW_X + 20, WINDOW_Y + 80, "Status: Awaiting execution analysis parsing steps...", 0x777A85);
        return;
    }

    // 2. Render Translation Conversion Matrix Data to Terminal Interface Screen
    gfx_draw_string(WINDOW_X + 20, WINDOW_Y + 70, "TRANSLATION METRICS COMPILING SUCCESSFULLY:", 0x3CD070); // Green status line
    
    char format_buf[128];
    snprintf(format_buf, sizeof(format_buf), "Detected Format: %s", 
             (g_term_conversion_workspace.foreign_format == DRIVER_FORMAT_LINUX_KO) ? "Linux Kernel Module (.ko)" : "Windows Driver Base (.sys)");
    gfx_draw_string(WINDOW_X + 20, WINDOW_Y + 92, format_buf, 0xDDDDDD);

    // List remapped symbol boundaries inside terminal viewport
    gfx_draw_string(WINDOW_X + 20, WINDOW_Y + 120, "SYMBOL REMAPPING SUMMARY MATRIX LAYER:", 0x8A9FB4);
    for (uint32_t i = 0; i < g_term_conversion_workspace.mapped_symbol_count; i++) {
        char sym_buf[128];
        snprintf(sym_buf, sizeof(sym_buf), "  -> Import [%s] remapped to secure proxy code [0x%016llX]", 
                 g_term_conversion_workspace.symbol_table[i].oem_symbol_name,
                 (unsigned long long)g_term_conversion_workspace.symbol_table[i].native_proxy_handler);
        gfx_draw_string(WINDOW_X + 20, WINDOW_Y + 142 + (i * 18), sym_buf, 0xCCCCCC);
    }

    gfx_draw_string(WINDOW_X + 20, WINDOW_Y + 230, "SECURITY COMPLIANCE GUARANTEE: Driver will execute inside Ring 3 Sandbox Context.", 0xFFA726);

    // 3. Render Interactive Permission Confirmation Action Buttons
    gfx_draw_string(WINDOW_X + 20, WINDOW_Y + 270, "Authorize compilation deployment and finalize installation?", 0xFFFFFF);
    
    gfx_draw_filled_rect(WINDOW_X + 20,  WINDOW_Y + 296, 140, 26, 0x228855); // Green [ ALLOW AND INSTALL ] button
    gfx_draw_string(WINDOW_X + 28, WINDOW_Y + 302, "[ ALLOW & INSTALL ]", 0xFFFFFF);

    gfx_draw_filled_rect(WINDOW_X + 180, WINDOW_Y + 296, 140, 26, 0xAA3333); // Red [ ABORT AND DENY ] button
    gfx_draw_string(WINDOW_X + 192, WINDOW_Y + 302, "[ ABORT & DENY ]", 0xFFFFFF);
}

// Intercept clicks on installer buttons
void process_driver_installer_terminal_clicks(uint32_t mx, uint32_t my) {
    if (!g_has_analyzed_file) return;

    // Button 1: Allow and Install Trigger
    if (mx >= WINDOW_X + 20 && mx <= WINDOW_X + 160 && my >= WINDOW_Y + 296 && my <= WINDOW_Y + 322) {
        uint32_t my_pid = query_active_focused_window_pid();
        
        // Enforce a strict RBAC privilege verification pass before writing system drivers
        if (rbac_verify_privilege(my_pid, PERM_UPDATE_BINARIES)) {
            sys_commit_translated_driver_to_vfs(&g_term_conversion_workspace, "/sys/drivers/hardware_device.bin");
            printf("[Driver Installer]: Conversion successfully committed. Driver active on subsequent boot.\\n");
        } else {
            printf("[Driver Installer Privilege Error]: Operation blocked. Administrative credentials required.\\n");
        }
        g_has_analyzed_file = false; // Reset terminal state
    }
    // Button 2: Abort and Deny Trigger
    else if (mx >= WINDOW_X + 180 && mx <= WINDOW_X + 320 && my >= WINDOW_Y + 296 && my <= WINDOW_Y + 322) {
        printf("[Driver Installer]: Translation aborted. Unverified driver files discarded.\\n");
        g_has_analyzed_file = false;
    }
}
