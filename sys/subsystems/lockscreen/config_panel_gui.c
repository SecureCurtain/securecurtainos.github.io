#include "../apps/net_panel_gui.c"
#include "../apps/user_admin_panel.h"
#include "../apps/sys_monitor_gui.h"
#include "config_panel.h"
#include "lock_screen.h"
#include <stdint.h>
#include <stdio.h>
#include <stdbool.h>

typedef struct {
    uint32_t minutes_to_lock;
    uint32_t minutes_to_sleep;
    uint32_t minutes_to_hybrid;
    uint32_t minutes_to_hibernate;
    uint32_t minutes_to_poweroff;
} PowerConfig;

extern PowerConfig g_pm_settings;
extern void lock_system_display(void);
extern void request_ui_composition_refresh(void);

static bool g_is_network_panel_visible = false;
static bool g_is_user_mgmt_panel_visible = false;
bool g_is_telemetry_monitor_visible = false;

extern void render_administrative_user_management_panel(void);
extern void process_user_admin_panel_clicks(uint32_t mx, uint32_t my);
extern void render_network_configuration_panel(void);
extern void process_network_panel_mouse_clicks(uint32_t mx, uint32_t my);
extern int32_t sys_power_management(uint32_t state);

void handle_config_panel_adjustments(uint32_t target_setting_id, uint32_t new_timeout_value) {
    switch (target_setting_id) {
        case 0: g_pm_settings.minutes_to_lock = new_timeout_value; break;
        case 1: g_pm_settings.minutes_to_sleep = new_timeout_value; break;
        case 2: g_pm_settings.minutes_to_hybrid = new_timeout_value; break;
        case 3: g_pm_settings.minutes_to_hibernate = new_timeout_value; break;
        case 4: g_pm_settings.minutes_to_poweroff = new_timeout_value; break;
    }
    printf("[Power Panel Config]: Configuration Node adjusted (ID: %d -> %d Min)\\n", target_setting_id, new_timeout_value);
}

void process_panel_action_buttons(uint32_t action_id) {
    switch (action_id) {
        case 101: lock_system_display(); break;
        case 102: sys_power_management(2); break;
        case 103: sys_power_management(3); break;
        case 104: sys_power_management(4); break;
        case 105: sys_power_management(5); break;
    }
}

static const uint32_t wx = 100;
static const uint32_t wy = 100;
static const uint32_t start_y = 150;

static bool check_btn_collision(uint32_t mx, uint32_t my, uint32_t x, uint32_t y, uint32_t w, uint32_t h) {
    return (mx >= x && mx <= x + w && my >= y && my <= y + h);
}

void render_config_panel_gui_frame(void) {
    gfx_draw_filled_rect(wx, wy, 520, 360, 0x1E1E1E);
    gfx_draw_filled_rect(wx, wy, 520, 30, 0x2D2D2D);
    gfx_draw_string(wx + 10, wy + 8, "OS Inactivity & Power Policy Station", 0xFFFFFF);

    const char* setting_labels[] = {
        "Inactivity Limit -> Display Lock   :",
        "Inactivity Limit -> Sleep Mode     :",
        "Inactivity Limit -> Hybrid Sleep   :",
        "Inactivity Limit -> Hibernation    :",
        "Inactivity Limit -> Power Off      :"
    };

    uint32_t current_values[] = {
        g_pm_settings.minutes_to_lock,
        g_pm_settings.minutes_to_sleep,
        g_pm_settings.minutes_to_hybrid,
        g_pm_settings.minutes_to_hibernate,
        g_pm_settings.minutes_to_poweroff
    };

    for (uint32_t i = 0; i < 5; i++) {
        gfx_draw_string(wx + 20, start_y + (i * 36), setting_labels[i], 0xDDDDDD);
        gfx_draw_filled_rect(wx + 280, start_y + (i * 36) + 4, 120, 4, 0x444444);
        
        uint32_t handle_offset = (current_values[i] > 120) ? 120 : current_values[i];
        gfx_draw_filled_rect(wx + 280 + handle_offset, start_y + (i * 36) - 2, 8, 12, 0x4A90E2);
        char val_buf[32];
        snprintf(val_buf, sizeof(val_buf), "%d Mins", current_values[i]);
        gfx_draw_string(wx + 415, start_y + (i * 36), val_buf, 0x00FF00);
    }

    uint32_t btn_y = wy + 260;
    gfx_draw_string(wx + 20, btn_y, "Force Hardware Execution Commands Now:", 0x888888);

    gfx_draw_filled_rect(wx + 20,  btn_y + 20, 80, 24, 0xAA3333);
    gfx_draw_string(wx + 26, btn_y + 25, "[ LOCK ]", 0xFFFFFF);
    gfx_draw_filled_rect(wx + 110, btn_y + 20, 80, 24, 0x3388AA);
    gfx_draw_string(wx + 116, btn_y + 25, "[ SLEEP ]", 0xFFFFFF);
    gfx_draw_filled_rect(wx + 200, btn_y + 20, 90, 24, 0x33AA66);
    gfx_draw_string(wx + 204, btn_y + 25, "[ HYBRID ]", 0xFFFFFF);
    gfx_draw_filled_rect(wx + 300, btn_y + 20, 90, 24, 0xAA6633);
    gfx_draw_string(wx + 302, btn_y + 25, "[ HIBERN ]", 0xFFFFFF);
    gfx_draw_filled_rect(wx + 400, btn_y + 20, 80, 24, 0x555555);
    gfx_draw_string(wx + 404, btn_y + 25, "[ SHUTDN ]", 0xFFFFFF);

    // App Launch Action Buttons
    uint32_t net_btn_x = wx + 20;
    uint32_t net_btn_y = wy + 300;
    gfx_draw_filled_rect(net_btn_x, net_btn_y, 140, 24, 0x3A4454);
    gfx_draw_string(net_btn_x + 12, net_btn_y + 6, "[ NET SETTINGS ]", 0xFFFFFF);

    uint32_t user_btn_x = wx + 180;
    uint32_t user_btn_y = wy + 300;
    gfx_draw_filled_rect(user_btn_x, user_btn_y, 140, 24, 0x3A4454);
    gfx_draw_string(user_btn_x + 12, user_btn_y + 6, "[ USER MGMT ]", 0xFFFFFF);

    // Append oversized Task Telemetry Cockpit launcher action button
    uint32_t mon_btn_x = wx + 340;
    uint32_t mon_btn_y = wy + 300;
    gfx_draw_filled_rect(mon_btn_x, mon_btn_y, 160, 24, 0x1F4A68); // High-contrast deep blue theme block
    gfx_draw_string(mon_btn_x + 14, mon_btn_y + 6, "[ SYS MONITOR ]", 0xFFFFFF);

    if (g_is_telemetry_monitor_visible) {
        render_whole_system_telemetry_monitor();
    } else if (g_is_user_mgmt_panel_visible) {
        render_administrative_user_management_panel();
    } else if (g_is_network_panel_visible) {
        render_network_configuration_panel();
    }
}

#define WM_LBUTTONDOWN 0x0201
#define WM_MOUSEMOVE   0x0200
#define WM_LBUTTONUP   0x0202

static bool g_is_dragging_slider = false;
static int32_t g_active_slider_id = -1;

void process_dashboard_panel_menu_clicks(uint32_t mx, uint32_t my) {
    if (mx >= wx + 20 && mx <= wx + 160 && my >= wy + 300 && my <= wy + 324) {
        printf("[Dashboard Router]: Invoking network configuration profile overlay view.\\n");
        g_is_network_panel_visible = !g_is_network_panel_visible;
        request_ui_composition_refresh();
    }
    if (mx >= wx + 180 && mx <= wx + 320 && my >= wy + 300 && my <= wy + 324) {
        printf("[Dashboard Router]: Invoking master administrative user management cockpit overlay view.\\n");
        g_is_user_mgmt_panel_visible = !g_is_user_mgmt_panel_visible;
        request_ui_composition_refresh();
    }
    if (mx >= wx + 340 && mx <= wx + 500 && my >= wy + 300 && my <= wy + 324) {
        printf("[Dashboard Router]: Initializing oversized whole-system diagnostic telemetry suite window.\\n");
        g_is_telemetry_monitor_visible = !g_is_telemetry_monitor_visible;
        request_ui_composition_refresh();
    }
}

void process_config_panel_mouse(uint32_t message_type, uint32_t mouse_x, uint32_t mouse_y) {
    uint32_t btn_y = wy + 260;
    if (message_type == WM_LBUTTONDOWN) {
        if (g_is_telemetry_monitor_visible) {
            process_telemetry_monitor_mouse_clicks(mouse_x, mouse_y);
            if (check_btn_collision(mouse_x, mouse_y, wx + 340, wy + 300, 160, 24)) {
                g_is_telemetry_monitor_visible = false;
                request_ui_composition_refresh();
            }
            return;
        }
        if (g_is_user_mgmt_panel_visible) {
            process_user_admin_panel_clicks(mouse_x, mouse_y);
            if (check_btn_collision(mouse_x, mouse_y, wx + 180, wy + 300, 140, 24)) {
                g_is_user_mgmt_panel_visible = false;
                request_ui_composition_refresh();
            }
            return;
        }
        if (g_is_network_panel_visible) {
            process_network_panel_mouse_clicks(mouse_x, mouse_y);
            if (check_btn_collision(mouse_x, mouse_y, wx + 20, wy + 300, 140, 24)) {
                g_is_network_panel_visible = false;
                request_ui_composition_refresh();
            }
            return;
        }

        // Intercept action button launchers
        if (check_btn_collision(mouse_x, mouse_y, wx + 20, wy + 300, 140, 24) ||
            check_btn_collision(mouse_x, mouse_y, wx + 180, wy + 300, 140, 24) ||
            check_btn_collision(mouse_x, mouse_y, wx + 340, wy + 300, 160, 24)) {
            process_dashboard_panel_menu_clicks(mouse_x, mouse_y);
            return;
        }

        // 1. Evaluate Immediate Execution Core Action Buttons
        if (check_btn_collision(mouse_x, mouse_y, wx + 20,  btn_y + 20, 80, 24))  { process_panel_action_buttons(101); return; }
        if (check_btn_collision(mouse_x, mouse_y, wx + 110, btn_y + 20, 80, 24))  { process_panel_action_buttons(102); return; }
        if (check_btn_collision(mouse_x, mouse_y, wx + 200, btn_y + 20, 90, 24))  { process_panel_action_buttons(103); return; }
        if (check_btn_collision(mouse_x, mouse_y, wx + 300, btn_y + 20, 90, 24))  { process_panel_action_buttons(104); return; }
        if (check_btn_collision(mouse_x, mouse_y, wx + 400, btn_y + 20, 80, 24))  { process_panel_action_buttons(105); return; }

        // 2. Evaluate Slider Track Click Collisions
        for (uint32_t i = 0; i < 5; i++) {
            uint32_t ty = start_y + (i * 36);
            if (mouse_x >= wx + 280 && mouse_x <= wx + 400 && mouse_y >= ty - 4 && mouse_y <= ty + 16) {
                g_is_dragging_slider = true;
                g_active_slider_id = i;
                uint32_t relative_x = mouse_x - (wx + 280);
                handle_config_panel_adjustments(g_active_slider_id, relative_x);
                request_ui_composition_refresh();
                break;
            }
        }
    }
    else if (message_type == WM_MOUSEMOVE) {
        if (g_is_dragging_slider && g_active_slider_id != -1) {
            if (mouse_x >= wx + 280 && mouse_x <= wx + 400) {
                uint32_t relative_x = mouse_x - (wx + 280);
                handle_config_panel_adjustments(g_active_slider_id, relative_x);
                request_ui_composition_refresh();
            }
        }
    }
    else if (message_type == WM_LBUTTONUP) {
        g_is_dragging_slider = false;
        g_active_slider_id = -1;
    }
}
