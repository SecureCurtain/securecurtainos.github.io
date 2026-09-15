#pragma once
#include <stdint.h>
#include <stdbool.h>

#define MAX_TRACKED_WINDOWS 16
#define MOUSE_MAGIC_TAG     0x4D4F5553 // "MOUS" binary header tracking tag

typedef struct {
    uint32_t process_id;
    uint32_t x1, y1; // Top-left bounding box pixel coordinates
    uint32_t x2, y2; // Bottom-right bounding box pixel coordinates
    bool     is_focused;
    bool     is_visible;
} WindowCollisionFrame;

typedef struct {
    uint32_t             magic;
    uint32_t             current_hardware_x;
    uint32_t             current_hardware_y;
    uint32_t             active_focused_pid;
    WindowCollisionFrame windows[MAX_TRACKED_WINDOWS];
    uint32_t             registered_window_count;
} SecureMouseRegistry;

// Core Input Isolation Engine Mappings
void init_secure_mouse_tracker(void);
void register_window_mouse_boundary(uint32_t pid, uint32_t x, uint32_t y, uint32_t w, uint32_t h);
void update_window_mouse_position(uint32_t pid, uint32_t x, uint32_t y);
void process_raw_hardware_mouse_packet(int16_t delta_x, int16_t delta_y, uint8_t buttons);
bool query_isolated_mouse_coordinates(uint32_t calling_pid, uint32_t* out_x, uint32_t* out_y, uint8_t* out_buttons);
uint32_t query_active_focused_window_pid(void);