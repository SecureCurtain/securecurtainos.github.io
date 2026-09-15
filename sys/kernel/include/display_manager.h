#pragma once
#include <stdint.h>
#include <stddef.h>
#include "ipc.h"
#include "graphics.h"

// 🛡️ SECURITY: Standardized DISPLAY CONFIGURATION IPC Command Identifiers
#define DISP_CMD_GET_TOPOLOGY    0x1201
#define DISP_CMD_SET_ALIGNMENT   0x1202
#define DISP_CMD_MAP_FRAMEBUFFER 0x1203

#define DISP_MAX_MONITORS        4

// 🛡️ STRUCTURED SPATIAL ARRANGEMENT PACKET
// Encapsulates display spatial configurations safely inside standard ipc_message_t envelopes
typedef struct {
    uint8_t  monitor_id;       // Hardware monitor index tracker (e.g., 0 for Internal, 1 for HDMI)
    int32_t  global_x;         // The relative X coordinate position on the virtual workspace matrix
    int32_t  global_y;         // The relative Y coordinate position on the virtual workspace matrix
    uint32_t width;            // Resolution width (e.g., 1920)
    uint32_t height;           // Resolution height (e.g., 1080)
    uint8_t  session_token[32];// Current user's token from auth_server.bin to restrict modification
} __attribute__((packed)) display_ipc_align_frame_t;

// --- Primary API Entry Points ---

/**
 * Initializes the unprivileged multi-monitor topology arrays.
 */
void init_display_manager(void);

/**
 * 🛡️ COMPANION GUI: RENDER DISPLAY ARRANGEMENT PANEL
 */
void display_manager_draw_config_gui(void);

/**
 * 🛡️ SANDBOXED MULTI-DISPLAY TOPOLOGY SERVER
 * Executes entirely within the unprivileged user-space 'display_manager.bin' process container.
 * Safely computes coordinate tracking spaces and maps display outputs without touching Ring 0.
 */
int handle_display_manager_message(const ipc_message_t* msg, ipc_message_t* out_response);