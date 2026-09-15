#pragma once
#include <stdint.h>
#include <stdbool.h>

extern bool g_rescue_terminal_active;

bool evaluate_rescue_egg_cursor_override(uint32_t mx, uint32_t my, uint32_t* forced_cursor_type);
void render_rescue_egg_graphic_element(void);
void process_rescue_egg_double_click(uint32_t mx, uint32_t my);
void process_rescue_terminal_keyboard_input(uint32_t key_code);