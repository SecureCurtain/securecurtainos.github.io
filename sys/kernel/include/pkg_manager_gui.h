#pragma once
#include <stdint.h>
#include <stddef.h>

/**
 * Initializes the Package Repository Setup GUI Application in Ring 3.
 */
void init_package_manager_gui(void);

/**
 * Renders the Package Repository Setup GUI window canvas for Pacman and APT configuration.
 */
void pkg_manager_gui_render_window(void);