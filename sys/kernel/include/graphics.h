#pragma once
#include <stdint.h>
#include <stddef.h>
#include "ipc.h" // Needed to route messages via secure handles

// 🛡️ SECURITY: Standardized GRAPHICS IPC Command Identifiers for Driver Isolation
#define GRAPHICS_CMD_INIT        0x801
#define GRAPHICS_CMD_SET_RES     0x802
#define GRAPHICS_CMD_FLUSH       0x803
#define GRAPHICS_CMD_DRAW_RECT   0x804
#define GRAPHICS_CMD_DRAW_STR    0x805

// A universal pixel description (32-bit True Color)
typedef struct {
    uint8_t b;
    uint8_t g;
    uint8_t r;
    uint8_t a;
} pixel_t;

// --- 🛡️ STRUCTURED GRAPHICS IPC TRANSACTION PACKETS ---
// These structures encapsulate arguments safely inside standard ipc_message_t envelopes
typedef struct {
    uint32_t x;
    uint32_t y;
    uint32_t width;
    uint32_t height;
    pixel_t  color;
} __attribute__((packed)) graphics_ipc_rect_frame_t;

typedef struct {
    uint32_t width;
    uint32_t height;
} __attribute__((packed)) graphics_ipc_res_frame_t;

// --- Primary API Entry Points ---

/**
 * Initializes the unprivileged user-space graphics driver server configurations.
 */
void init_graphics_subsystem(void);

/**
 * 🛡️ BOUNDARY SANITIZED GLYPH RASTERIZER
 * Renders a single character bitmap safely into your user-space display buffer.
 */
void graphics_draw_char(uint32_t x, uint32_t y, char c, pixel_t foreground_color, pixel_t background_color, uint8_t draw_bg);

/**
 * 🛡️ HARDENED STRING RASTERIZER PROXIED INTERFACE
 * Loops through strings cleanly, managing screen tracking line steps while maintaining
 * strict array boundaries to insulate server memory layouts.
 */
void graphics_draw_string(uint32_t x, uint32_t y, const char* str, pixel_t fg_color, pixel_t bg_color, uint8_t draw_bg);

/**
 * 🛡️ SANDBOXED GRAPHICS ROUTER INTERFACE
 * This function no longer runs in Ring 0 supervisor mode. It executes entirely within the
 * unprivileged user-space 'graphics_server.bin' process container. It safely parses commands,
 * manipulates pixel arrays, and renders interfaces without touching supervisor memory.
 * 
 * @param msg The secure incoming IPC packet containing drawing commands or register payloads.
 * @param out_response Output response container to route completion states back to the kernel.
 */
int handle_graphics_server_message(const ipc_message_t* msg, ipc_message_t* out_response);

void compositor_flush_screen(void);