#pragma once
#include <stdint.h>

#define INPUT_CMD_KEYBOARD_EVENT 0x901
#define INPUT_CMD_MOUSE_EVENT    0x902

#define INPUT_SERVICE_PID 10

// Binary structure mapping a raw keyboard stroke
typedef struct {
    uint8_t  scan_code; // Raw PS/2 or USB scan code
    uint8_t  is_pressed; // 1 = Key Down, 0 = Key Up
} input_key_event_t;

// Binary structure mapping mouse hardware displacement tick parameters
typedef struct {
    int16_t  delta_x;    // Relative movement on X axis
    int16_t  delta_y;    // Relative movement on Y axis
    uint8_t  buttons;    // Bitmask: Bit 0 = Left click, Bit 1 = Right click
} input_mouse_event_t;