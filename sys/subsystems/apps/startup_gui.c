// === ADD TO THE TOP OF STARTUP_GUI.C (GLOBAL DEF INCLUSIONS) ===
#include <stdint.h>
#include <stdbool.h>
#include <stdio.h>
#include <string.h>
#include "startup_ipc.h"
#include "../lockscreen/config_panel.h"
#include "../lockscreen/lock_screen.h"
#include "../../kernel/include/security_audit.h"

typedef enum {
    NOTIFY_STATE_HIDDEN = 0,
    NOTIFY_STATE_SLIDING_IN,
    NOTIFY_STATE_VISIBLE,
    NOTIFY_STATE_SLIDING_OUT
} NotifyUiState;

static SecurityAlertIpcMsg g_active_alert_payload;
static NotifyUiState       g_notify_state = NOTIFY_STATE_HIDDEN;
static uint32_t            g_notify_current_y_offset = 0; // Relative pixel tracking for slide paths
static uint64_t            g_notify_display_start_tick = 0;

#define NOTIFY_POPUP_WIDTH   300
#define NOTIFY_POPUP_HEIGHT  80
#define NOTIFY_SLIDE_SPEED   4     // Pixels per frame step
#define NOTIFY_HOLD_TIME_MS  5000  // Display alert for 5 seconds before sliding out

extern uint64_t get_system_uptime_ms(void);
extern void gfx_draw_filled_rect(uint32_t x, uint32_t y, uint32_t w, uint32_t h, uint32_t color);
extern void gfx_draw_string(uint32_t x, uint32_t y, const char* text, uint32_t color);
extern void gfx_get_screen_dimensions(uint32_t* width, uint32_t* height);

#define MAX_DESKTOP_ICONS 64
#define ICON_HITBOX_WIDTH  64
#define ICON_HITBOX_HEIGHT 80
#define WM_LBUTTONDOWN 0x0201
#define DOUBLE_CLICK_THRESHOLD_MS 400

bool g_is_config_panel_visible = true; // Tracking state toggled by desktop icons

typedef struct {
    char app_name[64];
    char target_path[256];
    char subsystem_type[16];
    uint32_t bounding_x1;
    uint32_t bounding_y1;
    uint32_t bounding_x2;
    uint32_t bounding_y2;
} CachedIconHitbox;

static CachedIconHitbox g_desktop_grid[MAX_DESKTOP_ICONS];
static uint32_t g_registered_icon_count = 0;
static uint64_t g_last_click_time = 0;
static uint32_t g_last_click_x = 0;
static uint32_t g_last_click_y = 0;

extern uint64_t get_system_uptime_ms(void);
extern int32_t invoke_subsystem_process(const char* daemon_path, const char* app_path, const char* flags);
extern void request_ui_composition_refresh(void);
extern void execute_subsystem_shortcut(CachedIconHitbox* icon);

// System proxy links mapping graphical desktop window elements (user32.dll styling tools)
extern void ui_create_window(const char* title, int w, int h);
extern void ui_draw_text(int x, int y, const char* text);
extern void ui_draw_checkbox(int x, int y, int checked_state, int button_id);
extern void native_ipc_call_with_response(uint32_t target_pid, uint32_t cmd, void* send_buf, size_t size, void* recv_buf);

static startup_item_t local_items_cache[MAX_STARTUP_ITEMS];
#define STARTUP_SERVICE_PID 9

/**
 * Requests the background daemon to pass the latest application authorization settings
 */
void refresh_startup_gui_data(void) {
    native_ipc_call_with_response(
        STARTUP_SERVICE_PID, 
        STARTUP_CMD_GET_ITEMS, 
        NULL, 0, 
        local_items_cache
    );
}

/**
 * Fired by your windowing message loop whenever a user clicks a checkbox element
 * 
 * @param button_id   The absolute identification integer mapped to the clicked item row
 */
void on_startup_checkbox_clicked(int button_id) {
    uint32_t target_program_id = (uint32_t)button_id;

    // Send the toggle command directly down to the background process (PID 9)
    native_ipc_call_with_response(
        STARTUP_SERVICE_PID, 
        STARTUP_CMD_TOGGLE_ITEM, 
        &target_program_id, sizeof(uint32_t), 
        NULL
    );

    // Re-synchronize local data caches to update the window panel presentation rows
    refresh_startup_gui_data();
}

/**
 * Primary window drawing layout constructor loop
 */
void paint_startup_manager_window(void) {
    ui_create_window("Startup Applications Manager", 550, 400);
    ui_draw_text(20, 20, "Select which services initialize instantly upon session logon:");

    int start_y = 60;
    for (int i = 0; i < MAX_STARTUP_ITEMS; i++) {
        if (local_items_cache[i].program_id == 0) break; // End of list entries

        // Render check-box block with its checked state tied directly to the daemon binary flag
        ui_draw_checkbox(30, start_y, local_items_cache[i].is_enabled, local_items_cache[i].program_id);
        
        ui_draw_text(60, start_y, local_items_cache[i].display_name);
        ui_draw_text(240, start_y, local_items_cache[i].binary_path);
        
        start_y += 30; // Shift down coordinate boundaries for the next display item row
    }
}

// === INSERT INSIDE MAIN MOUSE EVENT INTERCEPT WINDOW LOOP ===
void process_startup_gui_mouse(uint32_t msg, uint32_t mx, uint32_t my) {
    // If the power strategy window is active, route mouse parameters into its click matrix first
    if (g_is_config_panel_visible) {
        // Bounding box match tracking our application layout dimensions: W:500, H:360 anchored at X:100, Y:100
        if (mx >= 100 && mx <= 600 && my >= 100 && my <= 460) {
            process_config_panel_mouse(msg, mx, my);
            return; // Intercept complete, bypass underlying desktop icon clicks
        }
    }

    if (msg == WM_LBUTTONDOWN) {
        uint64_t current_time = get_system_uptime_ms();
        uint64_t time_delta = current_time - g_last_click_time;

        if (time_delta <= DOUBLE_CLICK_THRESHOLD_MS && mx == g_last_click_x && my == g_last_click_y) {
            for (uint32_t i = 0; i < g_registered_icon_count; i++) {
                CachedIconHitbox* icon = &g_desktop_grid[i];
                if (mx >= icon->bounding_x1 && mx <= icon->bounding_x2 &&
                    my >= icon->bounding_y1 && my <= icon->bounding_y2) {
                    
                    // Trigger double-click routing
                    execute_subsystem_shortcut(icon);
                    break;
                }
            }
        }
        g_last_click_time = current_time;
        g_last_click_x = mx;
        g_last_click_y = my;
    }
}

// === APPEND TO THE BOTTOM OF STARTUP_GUI.C ===
void register_icon_hitbox(const char* name, const char* path, const char* subsystem, uint32_t grid_x, uint32_t grid_y) {
    if (g_registered_icon_count >= MAX_DESKTOP_ICONS) return;
    CachedIconHitbox* icon = &g_desktop_grid[g_registered_icon_count];
    strncpy(icon->app_name, name, 63);
    strncpy(icon->target_path, path, 255);
    strncpy(icon->subsystem_type, subsystem, 15);
    icon->bounding_x1 = grid_x;
    icon->bounding_y1 = grid_y;
    icon->bounding_x2 = grid_x + ICON_HITBOX_WIDTH;
    icon->bounding_y2 = grid_y + ICON_HITBOX_HEIGHT;
    g_registered_icon_count++;
}

void execute_subsystem_shortcut(CachedIconHitbox* icon) {
    if (strcmp(icon->subsystem_type, "WINDOWS") == 0) {
        invoke_subsystem_process("/sys/bin/nt_env.bin", icon->target_path, "--gui-attached");
    } else if (strcmp(icon->subsystem_type, "LINUX") == 0) {
        invoke_subsystem_process("/sys/bin/linux_env.bin", icon->target_path, "--native-elf");
    }
}

// IPC Listener function triggered by notify_desktop_environment_refresh()
void notify_desktop_environment_refresh(void) {
    g_registered_icon_count = 0; // Clear index tree
    
    // Virtual directory enumeration mock layout generator
    // Ordinarily loops through files on: "/vfs/home/desktop/"
    register_icon_hitbox("SampleApp", "/vfs/home/apps/installed_app.exe", "WINDOWS", 20, 60);
    
    request_ui_composition_refresh();
}

// Callback triggered whenever an IPC packet hits your desktop listener loop (Channel 0xDE50)
void handle_incoming_security_ipc_alert(const SecurityAlertIpcMsg* message) {
    // 1. Pass the signal to our automated lockdown evaluation loops first
    evaluate_lockdown_policy(message->event_id, message->severity);

    // 2. Proceed with drawing standard slide-in notification toasts...
    // Stage the message payload into user space cache structures
    memcpy(&g_active_alert_payload, message, sizeof(SecurityAlertIpcMsg));
    
    // Arm the visual sliding state machine mechanics
    g_notify_state = NOTIFY_STATE_SLIDING_IN;
    g_notify_current_y_offset = 0; // Begin rendering completely below screen baseline bounds
    request_ui_composition_refresh();
}

// Internal composition hook executed on every system frame cycle
void update_and_render_security_popups(void) {
    if (g_notify_state == NOTIFY_STATE_HIDDEN) return;

    uint32_t sw = 0, sh = 0;
    gfx_get_screen_dimensions(&sw, &sh);

    // Compute base anchoring position coordinates at lower-right padding zones
    uint32_t base_x = sw - NOTIFY_POPUP_WIDTH - 20;
    uint32_t hidden_y = sh; // Below taskbar line
    uint32_t visible_y = sh - NOTIFY_POPUP_HEIGHT - 20; // Fully displayed anchoring point

    // 1. Process State Machine Coordinate Transformations
    if (g_notify_state == NOTIFY_STATE_SLIDING_IN) {
        g_notify_current_y_offset += NOTIFY_SLIDE_SPEED;
        uint32_t targeted_y = hidden_y - g_notify_current_y_offset;
        
        if (targeted_y <= visible_y) {
            g_notify_state = NOTIFY_STATE_VISIBLE;
            g_notify_display_start_tick = get_system_uptime_ms();
        }
        request_ui_composition_refresh(); // Force subsequent frame ticks
    }
    else if (g_notify_state == NOTIFY_STATE_VISIBLE) {
        if (get_system_uptime_ms() - g_notify_display_start_tick >= NOTIFY_HOLD_TIME_MS) {
            g_notify_state = NOTIFY_STATE_SLIDING_OUT;
        }
    }
    else if (g_notify_state == NOTIFY_STATE_SLIDING_OUT) {
        if (g_notify_current_y_offset > NOTIFY_SLIDE_SPEED) {
            g_notify_current_y_offset -= NOTIFY_SLIDE_SPEED;
        } else {
            g_notify_state = NOTIFY_STATE_HIDDEN;
        }
        request_ui_composition_refresh();
    }

    // 2. Render Card Graphics based on computed spatial geometries
    uint32_t render_y = hidden_y - g_notify_current_y_offset;
    
    // Map context coloring (Red card = Critical Threat, Amber card = IPS/Warning)
    uint32_t card_bg_color = (g_active_alert_payload.severity == 2) ? 0x5C1D24 : 0x5C3E1D;
    uint32_t border_color  = (g_active_alert_payload.severity == 2) ? 0xEF5350 : 0xFFA726;

    // Draw main toast layout box and highlights
    gfx_draw_filled_rect(base_x, render_y, NOTIFY_POPUP_WIDTH, NOTIFY_POPUP_HEIGHT, card_bg_color);
    gfx_draw_filled_rect(base_x, render_y, 4, NOTIFY_POPUP_HEIGHT, border_color); // Accent line

    // Render localized security alert notification string layers
    gfx_draw_string(base_x + 16, render_y + 12, g_active_alert_payload.source_tag, border_color);
    gfx_draw_string(base_x + 16, render_y + 32, g_active_alert_payload.alert_text, 0xFFFFFF);
    gfx_draw_string(base_x + 16, render_y + 54, "Review the Unified Audit Console immediately.", 0xAAAAAA);
}

void render_desktop_workspace(void) {
    // Blit wallpaper, paint background icons, map active windows
    paint_startup_manager_window();

    // Overlay active sliding threat alert cards directly on top of all workspace containers
    update_and_render_security_popups();
}
