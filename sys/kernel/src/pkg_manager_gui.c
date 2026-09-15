#include "pkg_manager_gui.h"
#include "pkg_manager.h"
#include "graphics.h"
#include "ipc.h"
#include <string.h>

static ipc_handle_t g_pkg_backend          = 18; // Linked to pkg_manager_server.bin
static ipc_handle_t g_graphics_compositor = 3;  // Linked to graphics_server.bin

extern void print_string(const char* str, int row);

void init_package_manager_gui(void) {
    print_string("[OK] Package Repository GUI Setup Panel initialized.", 31);
}

void pkg_manager_gui_render_window(void) {
    // 1. Request Graphics Compositor to initialize window surface for Repo Setup
    ipc_message_t comp_msg;
    memset(&comp_msg, 0, sizeof(ipc_message_t));
    comp_msg.message_type = 0x801; // GRAPHICS_CMD_INIT
    
    graphics_ipc_rect_frame_t* win_rect = (graphics_ipc_rect_frame_t*)comp_msg.payload;
    win_rect->x = 450;
    win_rect->y = 120;
    win_rect->width = 520;
    win_rect->height = 360;
    comp_msg.payload_length = sizeof(graphics_ipc_rect_frame_t);
    ipc_send_message(g_graphics_compositor, &comp_msg);

    // 2. Draw dark slate background canvas
    memset(&comp_msg, 0, sizeof(ipc_message_t));
    comp_msg.message_type = 0x804; // GRAPHICS_CMD_DRAW_RECT
    graphics_ipc_rect_frame_t* bg_rect = (graphics_ipc_rect_frame_t*)comp_msg.payload;
    bg_rect->x = 450; bg_rect->y = 120; bg_rect->width = 520; bg_rect->height = 360;
    bg_rect->color.r = 0x1E; bg_rect->color.g = 0x22; bg_rect->color.b = 0x2A; // Breeze Dark Surface
    comp_msg.payload_length = sizeof(graphics_ipc_rect_frame_t);
    ipc_send_message(g_graphics_compositor, &comp_msg);

    // 3. Title bar header strip
    bg_rect->y = 120; bg_rect->height = 28;
    bg_rect->color.r = 0x16; bg_rect->color.g = 0xA0; bg_rect->color.b = 0x85; // Teal header accent
    ipc_send_message(g_graphics_compositor, &bg_rect);

    // Title Text
    memset(&comp_msg, 0, sizeof(ipc_message_t));
    comp_msg.message_type = 0x805; // GRAPHICS_CMD_DRAW_STR
    *(uint32_t*)&comp_msg.payload = 460;
    *(uint32_t*)&comp_msg.payload = 126;
    strcpy((char*)&comp_msg.payload, "Linux Package Repository Setup (Pacman & APT)");
    comp_msg.payload_length = 8 + strlen((char*)&comp_msg.payload) + 1;
    ipc_send_message(g_graphics_compositor, &comp_msg);

    // 4. Tab / Section Headers
    *(uint32_t*)&comp_msg.payload = 470; *(uint32_t*)&comp_msg.payload = 165;
    strcpy((char*)&comp_msg.payload, "[Pacman Config: /etc/pacman.conf]   [APT Config: /etc/apt/sources.list]");
    comp_msg.payload_length = 8 + strlen((char*)&comp_msg.payload) + 1;
    ipc_send_message(g_graphics_compositor, &comp_msg);

    // 5. Active Repositories List
    *(uint32_t*)&comp_msg.payload = 470; *(uint32_t*)&comp_msg.payload = 205;
    strcpy((char*)&comp_msg.payload, "1. [arch-core] https://geo.mirror.pkgbuild.com/core (Ed25519)");
    comp_msg.payload_length = 8 + strlen((char*)&comp_msg.payload) + 1;
    ipc_send_message(g_graphics_compositor, &comp_msg);

    *(uint32_t*)&comp_msg.payload = 470; *(uint32_t*)&comp_msg.payload = 235;
    strcpy((char*)&comp_msg.payload, "2. [deb-main] http://deb.debian.org/debian bookworm (GPG/RSA)");
    comp_msg.payload_length = 8 + strlen((char*)&comp_msg.payload) + 1;
    ipc_send_message(g_graphics_compositor, &comp_msg);

    // 6. Repository Management Controls
    *(uint32_t*)&comp_msg.payload = 470; *(uint32_t*)&comp_msg.payload = 280;
    strcpy((char*)&comp_msg.payload, "Add Repo URL: [ https://mirror.rackspace.com/archlinux/extra ]");
    comp_msg.payload_length = 8 + strlen((char*)&comp_msg.payload) + 1;
    ipc_send_message(g_graphics_compositor, &comp_msg);

    *(uint32_t*)&comp_msg.payload = 470; *(uint32_t*)&comp_msg.payload = 320;
    strcpy((char*)&comp_msg.payload, "< [ + Add Repository ] >   < [ Sync Databases (pacman -Sy / apt update) ] >");
    comp_msg.payload_length = 8 + strlen((char*)&comp_msg.payload) + 1;
    ipc_send_message(g_graphics_compositor, &comp_msg);

    // Flush compositor draw instructions
    memset(&comp_msg, 0, sizeof(ipc_message_t));
    comp_msg.message_type = 0x803; // GRAPHICS_CMD_FLUSH
    ipc_send_message(g_graphics_compositor, &comp_msg);
}
