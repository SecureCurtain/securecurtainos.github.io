#include "secure_chat.h"
#include <string.h>
#include <stdio.h>

extern void gfx_draw_filled_rect(uint32_t x, uint32_t y, uint32_t w, uint32_t h, uint32_t color);
extern void gfx_draw_string(uint32_t x, uint32_t y, const char* text, uint32_t color);
extern void encapsulate_and_encrypt_tunnel_stream(const uint8_t* plaintext_ip_packet, uint32_t length);
extern uint64_t get_system_uptime_ms(void);
extern void request_ui_composition_refresh(void);

static char g_chat_input_box[CHAT_BUFFER_MAX_LEN] = {0};
static uint32_t g_chat_input_len = 0;

// Local message caching queues to display conversations
static SecureChatMessage g_chat_history[8];
static uint32_t        g_chat_history_count = 0;

void init_secure_chat_app(void) {
    memset(g_chat_input_box, 0, CHAT_BUFFER_MAX_LEN);
    g_chat_input_len = 0;
    g_chat_history_count = 0;
}

void render_chat_window_frame(void) {
    uint32_t cx = 400, cy = 120;
    uint32_t cw = 360, ch = 300;

    // 1. Draw central workspace card container window
    gfx_draw_filled_rect(cx, cy, cw, ch, 0x1A1D24);
    gfx_draw_filled_rect(cx, cy, cw, 28, 0x2A303D); // Header block
    gfx_draw_string(cx + 12, cy + 8, "VPN Shielded Encrypted Chat Core", 0xFFFFFF);

    // 2. Render Historical Chat Log Output Strings
    for (uint32_t i = 0; i < g_chat_history_count; i++) {
        uint32_t line_y = cy + 40 + (i * 24);
        uint32_t color = (g_chat_history[i].sender_id == 0x1) ? 0x4A90E2 : 0x3CD070; // Blue (Self) vs Green (Peer)
        
        char formatted_line[160];
        snprintf(formatted_line, sizeof(formatted_line), "<Node-%d>: %s", g_chat_history[i].sender_id, g_chat_history[i].message_text);
        gfx_draw_string(cx + 12, line_y, formatted_line, color);
    }

    // 3. Render Interactive Text Entry Field Input Box
    uint32_t input_box_y = cy + ch - 40;
    gfx_draw_filled_rect(cx + 12, input_box_y, cw - 24, 24, 0x111318);
    
    if (g_chat_input_len == 0) {
        gfx_draw_string(cx + 20, input_box_y + 6, "Type private message and hit [ENTER]...", 0x555A64);
    } else {
        gfx_draw_string(cx + 20, input_box_y + 6, g_chat_input_box, 0xFFFFFF);
    }
}

void process_chat_keyboard_input(uint32_t key_code) {
    if (key_code == 0x0D) { // Enter key pressed -> Dispatch over secure channel
        if (g_chat_input_len == 0) return;

        SecureChatMessage outbound_msg;
        outbound_msg.sender_id = 0x1; // Local Node Designation ID
        outbound_msg.timestamp_ms = get_system_uptime_ms();
        strncpy(outbound_msg.message_text, g_chat_input_box, CHAT_BUFFER_MAX_LEN - 1);

        // Append locally to chat history list view cache
        if (g_chat_history_count < 8) {
            memcpy(&g_chat_history[g_chat_history_count++], &outbound_msg, sizeof(SecureChatMessage));
        }

        // Direct serialization: Stream raw plaintext message payload straight into the Ring 0 VPN tunnel
        encapsulate_and_encrypt_tunnel_stream((const uint8_t*)&outbound_msg, sizeof(SecureChatMessage));

        // Flush entry fields
        memset(g_chat_input_box, 0, CHAT_BUFFER_MAX_LEN);
        g_chat_input_len = 0;
        request_ui_composition_refresh();
    } 
    else if (key_code == 0x08) { // Backspace handling
        if (g_chat_input_len > 0) {
            g_chat_input_box[--g_chat_input_len] = '\\0';
            request_ui_composition_refresh();
        }
    } 
    else if (g_chat_input_len < (CHAT_BUFFER_MAX_LEN - 1)) {
        g_chat_input_box[g_chat_input_len++] = (char)key_code;
        request_ui_composition_refresh();
    }
}

void receive_inbound_tunnel_chat_msg(const SecureChatMessage* incoming_msg) {
    // Intercepts decapsulated data streams peeled out of the VPN loopback adapters
    if (g_chat_history_count >= 8) {
        // Shift cache buffer contents to scroll out old messages
        for(uint32_t s = 1; s < 8; s++) g_chat_history[s-1] = g_chat_history[s];
        g_chat_history_count = 7;
    }
    memcpy(&g_chat_history[g_chat_history_count++], incoming_msg, sizeof(SecureChatMessage));
    request_ui_composition_refresh();
}
