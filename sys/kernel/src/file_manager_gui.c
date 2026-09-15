#include "file_manager.h"
#include "graphics.h"
#include "ipc.h"
#include <string.h>

static ipc_handle_t g_backend_fm_handle = 16; // Linked to file_manager_server.bin
static ipc_handle_t g_graphics_handle   = 3;  // Linked to graphics_server.bin

extern void print_string(const char* str, int row);

/**
 * 🛡️ REFACTORED GUI DRAWER CORNER
 * Loops through the fetched folder array table to render a lightweight list.
 * Clips geometries to protect memory maps from layout corruption.
 */
void fm_gui_render_window(const fm_directory_entry_t* entries, size_t entry_count, uint8_t user_token) {
    // 1. Request the Graphics Compositor to initialize a new window surface canvas context
    ipc_message_t comp_msg;
    memset(&comp_msg, 0, sizeof(ipc_message_t));
    comp_msg.message_type = 0x801; // GRAPHICS_CMD_INIT command flag
    
    // Set layout parameters for our floating Nemo/Dolphin application interface block
    graphics_ipc_rect_frame_t* win_rect = (graphics_ipc_rect_frame_t*)comp_msg.payload;
    win_rect->x = 150;
    win_rect->y = 100;
    win_rect->width = 400;
    win_rect->height = 300;
    comp_msg.payload_length = sizeof(graphics_ipc_rect_frame_t);
    ipc_send_message(g_graphics_handle, &comp_msg);

    // 2. Draw a clean, slate-gray background rectangle wrapper panel
    memset(&comp_msg, 0, sizeof(ipc_message_t));
    comp_msg.message_type = 0x804; // GRAPHICS_CMD_DRAW_RECT
    graphics_ipc_rect_frame_t* bg_rect = (graphics_ipc_rect_frame_t*)comp_msg.payload;
    bg_rect->x = 150; bg_rect->y = 100; bg_rect->width = 400; bg_rect->height = 300;
    bg_rect->color.r = 0x2A; bg_rect->color.g = 0x2E; bg_rect->color.b = 0x32; // Charcoal theme
    comp_msg.payload_length = sizeof(graphics_ipc_rect_frame_t);
    ipc_send_message(g_graphics_handle, &comp_msg);

    // 3. Render a light-blue title bar layout text strip across the top header
    bg_rect->y = 100; bg_rect->height = 24;
    bg_rect->color.r = 0x3D; bg_rect->color.g = 0x8E; bg_rect->color.b = 0xC7; // Deep Blue title
    ipc_send_message(g_graphics_handle, &bg_rect);

    // 4. 🛡️ CRITICAL LOOP CAP CONSTRAINT: Prevent interface rendering overflows
    // We restrict rendering to a maximum of 6 elements to guarantee text clipping bounds.
    size_t display_limit = (entry_count > 6) ? 6 : entry_count;

    for (size_t i = 0; i < display_limit; i++) {
        uint32_t text_y_pos = 140 + (i * 24);

        // Draw a miniature square proxy block representing a folder/file item icon layout
        memset(&comp_msg, 0, sizeof(ipc_message_t));
        comp_msg.message_type = 0x804;
        graphics_ipc_rect_frame_t* icon = (graphics_ipc_rect_frame_t*)comp_msg.payload;
        icon->x = 170; icon->y = text_y_pos; icon->width = 16; icon->height = 16;
        
        // Color-code the graphic nodes: Gold for Directories, White for Binaries/Files
        if (entries[i].type_flags == 2) { // VFS_DIRECTORY
            icon->color.r = 0xFD; icon->color.g = 0xBC; icon->color.b = 0x40; // Folder Gold
        } else {
            icon->color.r = 0xEF; icon->color.g = 0xF0; icon->color.b = 0xF1; // File White
        }
        comp_msg.payload_length = sizeof(graphics_ipc_rect_frame_t);
        ipc_send_message(g_graphics_handle, &comp_msg);

        // Send text string drawing instructions across to the user space font engine
        memset(&comp_msg, 0, sizeof(ipc_message_t));
        comp_msg.message_type = 0x805; // GRAPHICS_CMD_DRAW_STR
        
        // Pack coordinates and data string fragments safely into the proxy envelope
        *(uint32_t*)&comp_msg.payload = 200;        // X offset trailing icon
        *(uint32_t*)&comp_msg.payload = text_y_pos;  // Y line offset
        strcpy((char*)&comp_msg.payload, entries[i].name);
        
        comp_msg.payload_length = 8 + strlen(entries[i].name) + 1;
        ipc_send_message(g_graphics_handle, &comp_msg);
    }

    // 5. Fire a flush command over IPC to trigger the final Z-Order blit loop calculation
    memset(&comp_msg, 0, sizeof(ipc_message_t));
    comp_msg.message_type = 0x803; // GRAPHICS_CMD_FLUSH
    ipc_send_message(g_graphics_handle, &comp_msg);
}

/**
 * 🛡️ INTERACTIVE DIRECTORY REQUEST TRIGGER
 * Contacts the unprivileged file manager server backend over IPC to pull 
 * the folder table matrix using our secure token boundaries.
 */
void fm_gui_request_browse(const char* target_folder_path, uint8_t active_user_token) {
    ipc_message_t tx_msg;
    ipc_message_t rx_msg;
    memset(&tx_msg, 0, sizeof(ipc_message_t));
    tx_msg.message_type = FM_CMD_LIST_DIRECTORY;

    // Pack the secure browse query parameters into the payload envelope
    fm_ipc_browse_frame_t* req = (fm_ipc_browse_frame_t*)tx_msg.payload;
    req->session_token = active_user_token;
    strcpy(req->target_path, target_folder_path);
    tx_msg.payload_length = sizeof(fm_ipc_browse_frame_t);

    // Synchronize communications cleanly across the server containers
    int status = ipc_send_message(g_backend_fm_handle, &tx_msg);
    if (status == IPC_SUCCESS && ipc_receive_message(g_backend_fm_handle, &rx_msg) == IPC_SUCCESS) {
        
        int32_t response_status_code = *(int32_t*)rx_msg.payload;
        if (response_status_code == 0) {
            // Read out the directory array block returned from the validated backend server
            size_t entry_bytes = rx_msg.payload_length - sizeof(int32_t);
            size_t entry_count = entry_bytes / sizeof(fm_directory_entry_t);
            const fm_directory_entry_t* entries_table = (const fm_directory_entry_t*)(rx_msg.payload + sizeof(int32_t));

            // Render the items onto our secure canvas window surface
            fm_gui_render_window(entries_table, entry_count, active_user_token);
        } else {
            print_string("[GUI ERR] Directory browse authorization failed at boundary.", 27);
        }
    }
}
