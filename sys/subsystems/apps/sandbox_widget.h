#pragma once
#include <stdint.h>

// Visual alignment bounding coordinates for the desktop canvas widget panel
#define WDGT_X   740
#define WDGT_Y   40
#define WDGT_W   240
#define WDGT_H   320

/**
 * @brief Renders the real-time high-density matrix of processing enclaves.
 *        Queries the Ring 0 core allocator to color-code active thread lanes.
 */
void render_sandbox_memory_monitor_widget(void);