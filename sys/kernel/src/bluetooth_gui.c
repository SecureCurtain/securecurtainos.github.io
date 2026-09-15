#include "bluetooth_audio.h"
#include "graphics.h"
#include "ipc.h"
#include <string.h>

static ipc_handle_t g_bluetooth_backend    = 21; // Linked to bluetooth_audio_server.bin
static ipc_handle_t g_graphics_compositor  = 3;  // Linked to graphics_server.bin

extern void print_string(const char* str, int row);

/**
 * 🛡️ REFACTORED BLUETOOTH PAIR PANEL DRAWER
 * Generates an unprivileged graphical widget window layout inside the compositor space.
 */
void bluetooth_gui_render_window(uint8_t link_active) {
    // 1. Request the Graphics Compositor to initialize a new floating window surface context
    ipc_message_t comp_msg;
    memset(&comp_msg, 0, sizeof(ipc_message_t));
    comp_msg.message_type = 0x801; // GRAPHICS_CMD_INIT
    
    graphics_ipc_rect_frame_t* win_rect = (graphics_ipc_rect_frame_t*)comp_msg.payload;
    win_rect->x = 600; win_rect->y = 400; win_rect->width = 380; win_rect->height = 200;
    comp_msg.payload_length = sizeof(graphics_ipc_rect_frame_t);
    ipc_send_message(g_graphics_compositor, &comp_msg);

    // 2. Draw a clean, dark charcoal container panel
    memset(&comp_msg, 0, sizeof(ipc_message_t));
    comp_msg.message_type = 0x804; // GRAPHICS_CMD_DRAW_RECT
    graphics_ipc_rect_frame_t* bg_rect = (graphics_ipc_rect_frame_t*)comp_msg.payload;
    bg_rect->x = 600; bg_rect->y = 400; bg_rect->width = 380; bg_rect->height = 200;
    bg_rect->color.r = 0x1E; bg_rect->color.g = 0x1E; bg_rect->color.b = 0x1E;
    comp_msg.payload_length = sizeof(graphics_ipc_rect_frame_t);
    ipc_send_message(g_graphics_compositor, &bg_rect);

    // 3. Render a light blue header bar strip to indicate wireless setups
    bg_rect->y = 400; bg_rect->height = 24;
    bg_rect->color.r = 0x29; bg_rect->color.g = 0x80; bg_rect->color.b = 0xB9; // Belize Blue header
    ipc_send_message(g_graphics_compositor, &bg_rect);

    // Write the panel text strings using our user-space font engine
    memset(&comp_msg, 0, sizeof(ipc_message_t));
    comp_msg.message_type = 0x805; // GRAPHICS_CMD_DRAW_STR
    *(uint32_t*)&comp_msg.payload = 610; *(uint32_t*)&comp_msg.payload = 404;
    strcpy((char*)&comp_msg.payload + 8, "Bluetooth Audio Pairing");
    comp_msg.payload_length = 8 + strlen("Bluetooth Audio Pairing") + 1;
    ipc_send_message(g_graphics_compositor, &comp_msg);

    // 4. Render Connection Line State
    *(uint32_t*)&comp_msg.payload = 620; *(uint32_t*)&comp_msg.payload = 450;
    if (link_active) {
        strcpy((char*)&comp_msg.payload + 8, "Status: Connected (AAA Headset)");
    } else {
        strcpy((char*)&comp_msg.payload + 8, "Status: Scanning... Found [AAA Headset]");
    }
    comp_msg.payload_length = 8 + strlen((char*)&comp_msg.payload + 8) + 1;
    ipc_send_message(g_graphics_compositor, &comp_msg);

    // 5. Flush updates to screen
    memset(&comp_msg, 0, sizeof(ipc_message_t));
    comp_msg.message_type = 0x803; // GRAPHICS_CMD_FLUSH
    ipc_send_message(g_graphics_compositor, &comp_msg);
}

/**
 * 🛡️ INTERACTIVE PAIRING TRIGGER KEY
 * Bundles the user token and target MAC address into an IPC envelope to commit connection links.
 */
void bluetooth_gui_request_pair(uint8_t user_session_token) {
    ipc_message_t tx_msg, rx_msg;
    memset(&tx_msg, 0, sizeof(ipc_message_t));
    tx_msg.message_type = BT_CMD_PAIR_DEVICE;

    bt_ipc_pair_frame_t* pair_frame = (bt_ipc_pair_frame_t*)tx_msg.payload;
    pair_frame->session_token = user_session_token;
    pair_frame->fixed_pin_code = 0000; // Standard legacy default pairing validation PIN
    uint8_t mock_headset_mac[6] = {0x00, 0x11, 0x22, 0x33, 0x44, 0x55};
    memcpy(pair_frame->target_mac_addr, mock_headset_mac, BT_MAC_ADDR_LEN);
    strcpy(pair_frame->device_name, "AAA Headset");
    tx_msg.payload_length = sizeof(bt_ipc_pair_frame_t);

    int status = ipc_send_message(g_bluetooth_backend, &tx_msg);
    if (status == IPC_SUCCESS && ipc_receive_message(g_bluetooth_backend, &rx_msg) == IPC_SUCCESS) {
        int32_t res_code = *(int32_t*)rx_msg.payload;
        if (res_code == 0) {
            bluetooth_gui_render_window(1); // Re-draw as fully connected
        }
    }
}
