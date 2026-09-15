#include "window_manager.h"
#include "../../kernel/gop_mux.h"
#include <string.h>
#include <stdio.h>

static WindowManagerRegistry g_wm;

extern void gfx_draw_filled_rect(uint32_t x, uint32_t y, uint32_t w, uint32_t h, uint32_t color);
extern void gfx_draw_string(uint32_t x, uint32_t y, const char* text, uint32_t color);
extern void request_ui_composition_refresh(void);

void init_desktop_window_manager(void) {
    memset(&g_wm, 0, sizeof(WindowManagerRegistry));
    g_wm.magic = WM_MAGIC_TAG;
    g_wm.total_managed_windows = 0;
    g_wm.active_drag_window_idx = -1;
    printf("[Window Manager]: Dynamic desktop window manager and compositor online.\\n");
}

int32_t sys_wm_register_application_window(uint32_t pid, const char* title, uint32_t x, uint32_t y, uint32_t w, uint32_t h) {
    if (g_wm.total_managed_windows >= WM_MAX_WINDOWS) return -1;

    uint32_t idx = g_wm.total_managed_windows;
    WindowFrameNode* win = &g_wm.window_stack[idx];
    win->window_id = idx + 700;
    win->owner_pid = pid;
    strncpy(win->title, title, 31);
    win->x = x;
    win->y = y;
    win->w = w;
    win->h = h;
    win->is_minimized = false;
    win->is_maximized = false;
    win->is_dragging = false;
    win->is_resizing_edge = false;

    g_wm.total_managed_windows++;
    return (int32_t)win->window_id;
}

void render_desktop_window_decorations(void) {
    for (uint32_t i = 0; i < g_wm.total_managed_windows; i++) {
        WindowFrameNode* win = &g_wm.window_stack[i];
        if (win->is_minimized) continue;

        // 1. DRAW OVERSIZED WINDOW CHROME HEADER BAR (Thick 42px header for visibility)
        gfx_draw_filled_rect(win->x, win->y, win->w, 42, 0x1E2430);
        gfx_draw_string(win->x + 16, win->y + 12, win->title, 0xFFFFFF);

        // 2. RENDER THE GIANT ACCESSIBILITY CHROME CONTROL BUTTONS INTERFACES
        uint32_t btn_start_x = win->x + win->w - (3 * CHROME_BTN_SIZE) - 16;
        uint32_t btn_y = win->y + 5;

        // Minimize Button Block [ _ ]
        gfx_draw_filled_rect(btn_start_x, btn_y, CHROME_BTN_SIZE, CHROME_BTN_SIZE, 0x2A3240);
        gfx_draw_string(btn_start_x + 10, btn_y + 6, "_", 0xFFFFFF);

        // Maximize/Restore Button Block [ ▢ ]
        gfx_draw_filled_rect(btn_start_x + CHROME_BTN_SIZE + 6, btn_y, CHROME_BTN_SIZE, CHROME_BTN_SIZE, 0x2A3240);
        gfx_draw_string(btn_start_x + CHROME_BTN_SIZE + 14, btn_y + 6, "o", 0xFFFFFF);

        // Exit/Close Button Block [ X ] (Bright alert crimson for instant scannability)
        gfx_draw_filled_rect(btn_start_x + (2 * CHROME_BTN_SIZE) + 12, btn_y, CHROME_BTN_SIZE, CHROME_BTN_SIZE, 0x992222);
        gfx_draw_string(btn_start_x + (2 * CHROME_BTN_SIZE) + 22, btn_y + 6, "X", 0xFFFFFF);

        // 3. DRAW VISIBLE RESIZING OUTER BORDER LINES FRAME
        gfx_draw_filled_rect(win->x, win->y + 42, 4, win->h - 42, 0x334155);          // Left border line
        gfx_draw_filled_rect(win->x + win->w - 4, win->y + 42, 4, win->h - 42, 0x334155);  // Right border line
        gfx_draw_filled_rect(win->x, win->y + win->h - 4, win->w, 4, 0x334155);          // Bottom resizing lip
    }
}

void process_window_manager_mouse_down(uint32_t mx, uint32_t my) {
    // Traverse the window stack from top to bottom to intercept user clicks
    for (int32_t i = (int32_t)g_wm.total_managed_windows - 1; i >= 0; i--) {
        WindowFrameNode* win = &g_wm.window_stack[i];
        if (win->is_minimized) continue;

        // Intercept Chrome Control Window Action Buttons First
        uint32_t btn_start_x = win->x + win->w - (3 * CHROME_BTN_SIZE) - 16;
        uint32_t btn_y = win->y + 5;

        if (mx >= btn_start_x && mx <= win->x + win->w && my >= btn_y && my <= btn_y + CHROME_BTN_SIZE) {
            if (mx >= btn_start_x && mx < btn_start_x + CHROME_BTN_SIZE) {
                win->is_minimized = true; // Clicked [ _ ]: Minimize window to taskbar shelf
                printf("[WM]: Application window PID %d minimized.\\n", win->owner_pid);
            } 
            else if (mx >= btn_start_x + CHROME_BTN_SIZE + 6 && mx < btn_start_x + (2 * CHROME_BTN_SIZE) + 6) {
                win->is_maximized = !win->is_maximized; // Clicked [ ▢ ]: Maximize window bounds
                if (win->is_maximized) { win->x = 0; win->y = 0; win->w = 3840; win->h = 2160; }
                else                   { win->x = 100; win->y = 100; win->w = 1400; win->h = 900; }
            } 
            else if (mx >= btn_start_x + (2 * CHROME_BTN_SIZE) + 12) {
                // Clicked [ X ]: Terminate session container cleanly via core allocator
                extern void sys_monitor_terminate_task(uint32_t target_pid);
                sys_monitor_terminate_task(win->owner_pid);
                win->is_minimized = true; 
            }
            request_ui_composition_refresh();
            return;
        }

        // Intercept Window Drag Handling inside Title Header Bar Block
        if (mx >= win->x && mx <= win->x + win->w && my >= win->y && my <= win->y + 42) {
            win->is_dragging = true;
            g_wm.active_drag_window_idx = i;
            return;
        }

        // Intercept Outer lip border lines for dynamic resizing clicks (12px outer lip boundary catch)
        if (mx >= win->x + win->w - 12 && mx <= win->x + win->w && my >= win->y + 42 && my <= win->y + win->h) {
            win->is_resizing_edge = true;
            g_wm.active_drag_window_idx = i;
            return;
        }
    }
}

void process_window_manager_mouse_move(uint32_t mx, uint32_t my) {
    if (g_wm.active_drag_window_idx == -1) return;
    WindowFrameNode* win = &g_wm.window_stack[g_wm.active_drag_window_idx];

    if (win->is_dragging) {
        // Dynamically adjust position registers to track cursor movement across layout coordinates
        win->x = mx - (win->w / 2); // Center window under cursor
        win->y = my - 20;           // Anchor to header bar
        request_ui_composition_refresh();
    } 
    else if (win->is_resizing_edge) {
        // Dynamically recalculate width and height constraints on cursor movement
        if (mx > win->x + 100) win->w = mx - win->x;
        if (my > win->y + 100) win->h = my - win->y;
        request_ui_composition_refresh();
    }
}

void process_window_manager_mouse_up(void) {
    if (g_wm.active_drag_window_idx != -1) {
        WindowFrameNode* win = &g_wm.window_stack[g_wm.active_drag_window_idx];
        win->is_dragging = false;
        win->is_resizing_edge = false;
        g_wm.active_drag_window_idx = -1;
    }
}
