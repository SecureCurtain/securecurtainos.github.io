#pragma once
#include <stdint.h>
#include <stdbool.h>

#define WM_MAGIC_TAG         0x574D4752 // "WMGR" binary tracking token
#define WM_MAX_WINDOWS       8
#define CHROME_BTN_SIZE      32         // Oversized control blocks for bad eyesight

typedef struct {
    uint32_t window_id;
    uint32_t owner_pid;
    char     title[32];
    uint32_t x;                         // Dynamic horizontal coordinate location on screen
    uint32_t y;                         // Dynamic vertical coordinate location on screen
    uint32_t w;                         // Dynamic adjustable width
    uint32_t h;                         // Dynamic adjustable height
    bool     is_minimized;
    bool     is_maximized;
    bool     is_active_focus;
    bool     is_dragging;
    bool     is_resizing_edge;
} WindowFrameNode;

typedef struct {
    uint32_t        magic;
    WindowFrameNode window_stack[WM_MAX_WINDOWS];
    uint32_t        total_managed_windows;
    int32_t         active_drag_window_idx;
} WindowManagerRegistry;

void init_desktop_window_manager(void);
int32_t sys_wm_register_application_window(uint32_t pid, const char* title, uint32_t x, uint32_t y, uint32_t w, uint32_t h);
void render_desktop_window_decorations(void);
void process_window_manager_mouse_down(uint32_t mx, uint32_t my);
void process_window_manager_mouse_move(uint32_t mx, uint32_t my);
void process_window_manager_mouse_up(void);
