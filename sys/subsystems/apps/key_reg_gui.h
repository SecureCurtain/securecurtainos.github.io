#pragma once
#include <stdint.h>
#include <stdbool.h>

#define REG_WIN_X       400
#define REG_WIN_Y       300
#define REG_WIN_W       1000 // Giant 4K layout bounds for vision impairment
#define REG_WIN_H       600
#define MAX_KEY_STRING  64

typedef enum {
    KEY_TARGET_USER_PIN = 1,
    KEY_TARGET_SSH_PUB,
    KEY_TARGET_ESCROW_KEK
} KeyRegistrationType;

typedef struct {
    char     input_buffer[MAX_KEY_STRING];
    uint32_t current_char_count;
    uint8_t  selected_target_type; // Maps to KeyRegistrationType
    bool     is_key_masked_hidden;
    bool     is_registration_successful;
} KeyRegistrationContext;

void init_secure_key_registration_utility(void);
void render_secure_key_registration_utility(void);
void process_key_registration_mouse_clicks(uint32_t mx, uint32_t my);
void process_key_registration_keyboard_input(uint32_t scancode, char ascii_char);
bool sys_commit_key_to_hardware_vault(uint32_t calling_pid, uint8_t type, const char* key_string);
