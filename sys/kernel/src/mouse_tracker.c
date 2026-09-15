#include "../../subsystems/lockscreen/session_timer.h"
#include "mouse_tracker.h"
#include "sandbox.h"
#include "security_audit.h"
#include <string.h>
#include <stdio.h>

static SecureMouseRegistry g_mouse_tracker;
static uint8_t             g_hardware_button_state = 0;
static uint32_t            g_screen_width = 1024; // Baseline system defaults
static uint32_t            g_screen_height = 768;

extern void gfx_get_screen_dimensions(uint32_t* width, uint32_t* height);

void init_secure_mouse_tracker(void) {
    memset(&g_mouse_tracker, 0, sizeof(SecureMouseRegistry));
    g_mouse_tracker.magic = MOUSE_MAGIC_TAG;
    g_mouse_tracker.current_hardware_x = g_screen_width / 2;
    g_mouse_tracker.current_hardware_y = g_screen_height / 2;
    g_mouse_tracker.active_focused_pid = 0; // Microkernel context default
    g_mouse_tracker.registered_window_count = 0;

    gfx_get_screen_dimensions(&g_screen_width, &g_screen_height);
    printf("[Kernel Mouse Tracker]: Hardware cursor coordinate isolation framework online.\\n");
}

void register_window_mouse_boundary(uint32_t pid, uint32_t x, uint32_t y, uint32_t w, uint32_t h) {
    if (g_mouse_tracker.registered_window_count >= MAX_TRACKED_WINDOWS) return;

    // Check if the window boundary already exists to update it smoothly
    for (uint32_t i = 0; i < g_mouse_tracker.registered_window_count; i++) {
        if (g_mouse_tracker.windows[i].process_id == pid) {
            g_mouse_tracker.windows[i].x1 = x;
            g_mouse_tracker.windows[i].y1 = y;
            g_mouse_tracker.windows[i].x2 = x + w;
            g_mouse_tracker.windows[i].y2 = y + h;
            return;
        }
    }

    WindowCollisionFrame* win = &g_mouse_tracker.windows[g_mouse_tracker.registered_window_count];
    win->process_id = pid;
    win->x1 = x;
    win->y1 = y;
    win->x2 = x + w;
    win->y2 = y + h;
    win->is_focused = false;
    win->is_visible = true;

    g_mouse_tracker.registered_window_count++;
}

void update_window_mouse_position(uint32_t pid, uint32_t x, uint32_t y) {
    for (uint32_t i = 0; i < g_mouse_tracker.registered_window_count; i++) {
        if (g_mouse_tracker.windows[i].process_id == pid) {
            uint32_t w = g_mouse_tracker.windows[i].x2 - g_mouse_tracker.windows[i].x1;
            uint32_t h = g_mouse_tracker.windows[i].y2 - g_mouse_tracker.windows[i].y1;
            g_mouse_tracker.windows[i].x1 = x;
            g_mouse_tracker.windows[i].y1 = y;
            g_mouse_tracker.windows[i].x2 = x + w;
            g_mouse_tracker.windows[i].y2 = y + h;
            break;
        }
    }
}

void process_raw_hardware_mouse_packet(int16_t delta_x, int16_t delta_y, uint8_t buttons) {
    refresh_session_interaction_anchor(g_mouse_tracker.active_focused_pid);
    // 1. Process relative mouse changes safely within screen limits
    int32_t nx = (int32_t)g_mouse_tracker.current_hardware_x + delta_x;
    int32_t ny = (int32_t)g_mouse_tracker.current_hardware_y + delta_y;

    if (nx < 0) nx = 0;
    if (nx >= (int32_t)g_screen_width)  nx = g_screen_width - 1;
    if (ny < 0) ny = 0;
    if (ny >= (int32_t)g_screen_height) ny = g_screen_height - 1;

    g_mouse_tracker.current_hardware_x = (uint32_t)nx;
    g_mouse_tracker.current_hardware_y = (uint32_t)ny;
    g_hardware_button_state = buttons;

    // 2. Compute Topmost Geometric Collision to isolate focus contexts
    uint32_t new_focus_pid = 0; // Default to shell workspace context
    
    // Scan backwards to ensure topmost/newest windows capture coordinate priority
    for (int32_t i = (int32_t)g_mouse_tracker.registered_window_count - 1; i >= 0; i--) {
        WindowCollisionFrame* win = &g_mouse_tracker.windows[i];
        if (win->is_visible && 
            g_mouse_tracker.current_hardware_x >= win->x1 && g_mouse_tracker.current_hardware_x <= win->x2 &&
            g_mouse_tracker.current_hardware_y >= win->y1 && g_mouse_tracker.current_hardware_y <= win->y2) {
            
            new_focus_pid = win->process_id;
            break;
        }
    }

    if (new_focus_pid != g_mouse_tracker.active_focused_pid) {
        // Clear previous flags and shift focus states cleanly
        for (uint32_t i = 0; i < g_mouse_tracker.registered_window_count; i++) {
            g_mouse_tracker.windows[i].is_focused = (g_mouse_tracker.windows[i].process_id == new_focus_pid);
        }
        g_mouse_tracker.active_focused_pid = new_focus_pid;
    }
}

bool query_isolated_mouse_coordinates(uint32_t calling_pid, uint32_t* out_x, uint32_t* out_y, uint8_t* out_buttons) {
    // Enforce strict sandbox write boundary clearance checks on recipient parameters
    if (!validate_memory_access_bounds(calling_pid, (uint64_t)out_x, sizeof(uint32_t), true) ||
        !validate_memory_access_bounds(calling_pid, (uint64_t)out_y, sizeof(uint32_t), true) ||
        !validate_memory_access_bounds(calling_pid, (uint64_t)out_buttons, sizeof(uint8_t), true)) {
        return false;
    }

    // PRIVILEGE ISOLATION BARRIER: Processes can only query tracking data if they currently hold topmost focus.
    if (calling_pid != g_mouse_tracker.active_focused_pid) {
        // Return blank coordinate maps to inactive/background applications to block input scraping
        *out_x = 0;
        *out_y = 0;
        *out_buttons = 0;
        return true; 
    }

    // Topmost process confirmed: provide localized, window-relative coordinate parameters
    for (uint32_t i = 0; i < g_mouse_tracker.registered_window_count; i++) {
        if (g_mouse_tracker.windows[i].process_id == calling_pid) {
            *out_x = g_mouse_tracker.current_hardware_x - g_mouse_tracker.windows[i].x1;
            *out_y = g_mouse_tracker.current_hardware_y - g_mouse_tracker.windows[i].y1;
            *out_buttons = g_hardware_button_state;
            return true;
        }
    }

    // Default system fallback parameters for un-windowed root daemons
    *out_x = g_mouse_tracker.current_hardware_x;
    *out_y = g_mouse_tracker.current_hardware_y;
    *out_buttons = g_hardware_button_state;
    return true;
}

uint32_t query_active_focused_window_pid(void) {
    return g_mouse_tracker.active_focused_pid;
}
