#pragma once
#include <stdint.h>

// Visual placement parameters for the User Management Station window frame
#define PANEL_X   60
#define PANEL_Y   60
#define PANEL_W   540
#define PANEL_H   360

/**
 * @brief Renders the administrative user control panel matrix.
 *        Queries Ring 0 multi-tenant structures to display active, offline, or locked accounts.
 */
void render_administrative_user_control_panel(void);
void render_administrative_user_management_panel(void);

/**
 * @brief Intercepts cursor clicks to coordinate reset switches and lock status alterations.
 * @param mx Active mouse X coordinate on the desktop canvas grid.
 * @param my Active mouse Y coordinate on the desktop canvas grid.
 */
void process_user_admin_panel_clicks(uint32_t mx, uint32_t my);