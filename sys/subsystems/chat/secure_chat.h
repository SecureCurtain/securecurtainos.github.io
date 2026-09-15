#pragma once
#include <stdint.h>

#define CHAT_BUFFER_MAX_LEN 128
#define CHAT_PORT_ID        0x4348 // Internal Chat Application Sync Port

typedef struct {
    uint32_t sender_id;
    uint64_t timestamp_ms;
    char     message_text[CHAT_BUFFER_MAX_LEN];
} SecureChatMessage;

void init_secure_chat_app(void);
void render_chat_window_frame(void);
void process_chat_keyboard_input(uint32_t key_code);
void receive_inbound_tunnel_chat_msg(const SecureChatMessage* incoming_msg);