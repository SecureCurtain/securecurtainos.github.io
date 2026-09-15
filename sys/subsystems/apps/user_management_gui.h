#pragma once
#include <stdint.h>
#include <stdbool.h>

#define ADMIN_PANEL_X       40
#define ADMIN_PANEL_Y       40
#define ADMIN_PANEL_W       720
#define ADMIN_PANEL_H       500

void init_administrative_user_management_panel(void);
void render_administrative_user_management_panel(void);
void process_administrative_panel_mouse_clicks(uint32_t mx, uint32_t my);