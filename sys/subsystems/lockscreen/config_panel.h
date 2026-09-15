#pragma once
#include <stdint.h>

void handle_config_panel_adjustments(uint32_t target_setting_id, uint32_t new_timeout_value);
void process_panel_action_buttons(uint32_t button_action_id);
void render_config_panel_gui_frame(void);
void process_config_panel_mouse(uint32_t message_type, uint32_t mouse_x, uint32_t mouse_y);