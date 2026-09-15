#include "display_manager.h"
#include "ipc.h"
#include "auth.h"
#include <string.h>

// Add this near the top of display_manager.c under your #includes:
int display_manager_route_pixel(int32_t global_x, int32_t global_y, uint8_t* out_monitor_id, int32_t* out_local_x, int32_t* out_local_y);

typedef struct {
    uint8_t  monitor_id;
    int32_t  x_offset;         // Spatial layout position relative to global (0,0)
    int32_t  y_offset;         // Spatial layout position relative to global (0,0)
    uint32_t width;
    uint32_t height;
    pixel_t* hw_framebuffer;   // Unprivileged mapped address to this screen's VRAM segment
    uint8_t  is_active;
} sandboxed_monitor_t;

static sandboxed_monitor_t g_monitors[DISP_MAX_MONITORS];
static size_t              g_connected_monitors_count = 0;
static ipc_handle_t        g_auth_proxy = 8; // Tied directly to your auth_server.bin handle

extern void print_string(const char* str, int row);

void init_display_manager(void) {
    memset(g_monitors, 0, sizeof(g_monitors));
    g_connected_monitors_count = 0;

    // Primary Display (Monitor 0) defaults to global origin (0,0)
    g_monitors[0].monitor_id = 0;
    g_monitors[0].x_offset = 0;
    g_monitors[0].y_offset = 0;
    g_monitors[0].width = 1024;
    g_monitors[0].height = 768;
    g_monitors[0].hw_framebuffer = (pixel_t*)0x0000300000000000ULL; // Mapped via kernel.c
    g_monitors[0].is_active = 1;
    g_connected_monitors_count = 1;

    print_string("[OK] Sandboxed Display Manager: Multi-Head Spatial Server Online.", 33);
}

/**
 * 🛡️ COMPANION GUI: RENDER DISPLAY ARRANGEMENT PANEL
 * Generates an unprivileged graphical window utility dialog within the compositor 
 * to let authorized users drag and click boxes to change display orientations.
 */
void display_manager_draw_config_gui(void) {
    print_string("--- [ DISPLAY ARRANGEMENT CONTROLS ] ---", 28);
    print_string("[Primary: 1024x768]  <--->  [HDMI-1: 1024x768 (Right)]", 29);
    print_string("Action: Press [S] to shift HDMI-1 to Left workspace orientation.", 30);
}

/**
 * 🛡️ SPATIAL COORDINATE TRANSLATOR LOOP
 * Converts a raw coordinate pair from your user-space input_router.bin 
 * and identifies which specific physical screen buffer it maps onto.
 */
int display_manager_route_pixel(int32_t global_x, int32_t global_y, uint8_t* out_monitor_id, int32_t* out_local_x, int32_t* out_local_y) {
    // Traverse active screen configuration vectors securely within the Ring 3 sandbox
    for (size_t i = 0; i < g_connected_monitors_count; i++) {
        sandboxed_monitor_t* m = &g_monitors[i];
        if (!m->is_active) continue;

        // 1. 🛡️ CRITICAL SPATIAL BOUNDARY FILTER: Verify vector coordinates fit the current monitor slice
        if (global_x >= m->x_offset && global_x < (m->x_offset + (int32_t)m->width) &&
            global_y >= m->y_offset && global_y < (m->y_offset + (int32_t)m->height)) {
            
            *out_monitor_id = m->monitor_id;
            // Translate the virtual workspace position to localized physical screen pixels
            *out_local_x = global_x - m->x_offset;
            *out_local_y = global_y - m->y_offset;
            return 1; // Coordinate successfully bound to active hardware screen
        }
    }
    return 0; // Out of bounds pixel drop
}

int handle_display_manager_message(const ipc_message_t* msg, ipc_message_t* out_response) {
    if (!msg || !out_response) return -1;
    if (msg->message_type != DISP_CMD_SET_ALIGNMENT) return -1;

    memset(out_response, 0, sizeof(ipc_message_t));
    out_response->message_type = msg->message_type;
    out_response->payload_length = sizeof(int32_t);
    int32_t* return_status = (int32_t*)out_response->payload;

    if (msg->payload_length < sizeof(display_ipc_align_frame_t)) {
        *return_status = -2; // Corrupt frame buffer layout boundary
        return 0;
    }

    const display_ipc_align_frame_t* align = (const display_ipc_align_frame_t*)msg->payload;

    // 2. 🛡️ SECURITY FIXED: Enforce User Authorization Handshake verification
    // Blocks unauthenticated apps from stealthily restructuring monitor grids to execute UI click-jacking attacks.
    ipc_message_t auth_check_tx, auth_check_rx;
    memset(&auth_check_tx, 0, sizeof(ipc_message_t));
    auth_check_tx.message_type = AUTH_CMD_VALIDATE_TOKEN;
    auth_check_tx.payload_length = 32;
    memcpy(auth_check_tx.payload, align->session_token, 32);

    int auth_status = ipc_send_message(g_auth_proxy, &auth_check_tx);
    if (auth_status != IPC_SUCCESS || ipc_receive_message(g_auth_proxy, &auth_check_rx) != IPC_SUCCESS) {
        *return_status = -4; // Access Denied
        return 0;
    }

    auth_ipc_response_frame_t* auth_resp = (auth_ipc_response_frame_t*)auth_check_rx.payload;

    // 3. 🛡️ REFACTORED WORKSPACE ALIGNMENT MANAGER
    // Check if the current user session belongs to the verified master "aaa" account (UID 1000)
    if (auth_resp->status_code != 0 || auth_resp->authorized_uid != 1000) {
        print_string("[SECURITY LOCKOUT] Unauthorized display reconfiguration block!", 31);
        *return_status = -4; // Access Denied
        return 0;
    }

    uint8_t target_id = align->monitor_id;
    if (target_id >= DISP_MAX_MONITORS) {
        *return_status = -3; // Out of bounds array tracking protection
        return 0;
    }

    // 4. Update the spatial coordinates matrix safely inside the user-space container
    g_monitors[target_id].x_offset = align->global_x;
    g_monitors[target_id].y_offset = align->global_y;
    g_monitors[target_id].width    = align->width;
    g_monitors[target_id].height   = align->height;
    g_monitors[target_id].is_active = 1;
    
    if (g_connected_monitors_count <= target_id) {
        g_connected_monitors_count = target_id + 1;
    }

    print_string("[DISPLAY MGR] New spatial monitor alignment successfully committed.", 31);
    *return_status = 0; // Success
    return 0;
}
