#pragma once
#include <stdint.h>
#include <stdbool.h>

#define KBD_SHIELD_MAGIC_TAG  0x4B424453 // "KBDS" tracking token
#define KBD_DATA_PORT         0x60
#define KBD_STATUS_PORT       0x64
#define SHIELD_MASK_KEY       0xA7         // Localized scancode obfuscation encryption token

typedef struct {
    uint64_t total_scancodes_intercepted;
    uint32_t active_obfuscation_key;
    bool     is_shielding_active;
} KbdShieldStatsRegistry;

typedef struct {
    uint32_t               magic;
    KbdShieldStatsRegistry metrics;
} KbdShieldControlRegistry;

void init_hardware_keyboard_shield(void);
uint8_t sys_kbd_shield_intercept_isr_scancode(void);
char sys_kbd_translate_scancode_to_ascii(uint8_t scancode);
