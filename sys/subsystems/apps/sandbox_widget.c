#include "sandbox_widget.h"
#include "../../kernel/include/core_allocator.h"
#include <stdio.h>
#include <string.h>
#include <stdbool.h>

extern void gfx_draw_filled_rect(uint32_t x, uint32_t y, uint32_t w, uint32_t h, uint32_t color);
extern void gfx_draw_string(uint32_t x, uint32_t y, const char* text, uint32_t color);

// Simulating mapping extraction from the active core_allocator.c tracker variables
typedef struct {
    uint32_t process_id;
    uint32_t enclave_tier;
    bool     busy;
} WidgetCpuSnapshot;

void render_sandbox_memory_monitor_widget(void) {
    // 1. Draw central widget card layout panel
    gfx_draw_filled_rect(WDGT_X, WDGT_Y, WDGT_W, WDGT_H, 0x111317);
    gfx_draw_filled_rect(WDGT_X, WDGT_Y, WDGT_W, 26, 0x1F242E);
    gfx_draw_string(WDGT_X + 12, WDGT_Y + 6, "Hardware Thread Enclaves Matrix", 0xFFFFFF);

    gfx_draw_string(WDGT_X + 12, WDGT_Y + 36, "CORE TOPOLOGY GRID SCHEDULING:", 0x6E7485);

    // 2. Iterate through all 32 logical hardware threads and map block modules onto screen coordinates
    // Creates a high-density, real-time matrix layout visualization
    for (uint32_t t = 0; t < 32; t++) {
        uint32_t grid_x = WDGT_X + 16 + ((t % 4) * 52);
        uint32_t grid_y = WDGT_Y + 54 + ((t / 4) * 26);

        // Determine thread enclave color groupings dynamically:
        // Crimson Red = Kernel Core (Enclave 0), Amber Gold = System Daemons (Enclave 1), Cyan Blue = Sandbox User Apps (Enclave 2)
        uint32_t element_color = 0x333333; // Default idle slot grey
        
        uint32_t enclave_tier = (t < 16) ? 0 : ((t < 24) ? 1 : 2);
        bool is_thread_active = (t % 3 != 0); // Simulated live execution thread processing loops

        if (is_thread_active) {
            if (enclave_tier == 0)      element_color = 0xEF5350; // Kernel Enclave 0 Crimson
            else if (enclave_tier == 1) element_color = 0xFFA726; // Privileged Enclave 1 Amber
            else                        element_color = 0x26C6DA; // User Space Enclave 2 Cyan
        }

        // Draw individual micro-block indicators representing the hardware threads configuration matrix
        gfx_draw_filled_rect(grid_x, grid_y, 44, 18, element_color);
        
        char id_str[16];
        snprintf(id_str, sizeof(id_str), "T%02d", t);
        gfx_draw_string(grid_x + 6, grid_y + 4, id_str, is_thread_active ? 0xFFFFFF : 0x666666);
    }

    // Lower Color-Key Legend Panel Boundary Marks
    uint32_t legend_y = WDGT_Y + WDGT_H - 46;
    gfx_draw_filled_rect(WDGT_X + 12, legend_y, 10, 10, 0xEF5350);
    gfx_draw_string(WDGT_X + 28, legend_y - 2, "Ring0", 0x8A8D9A);

    gfx_draw_filled_rect(WDGT_X + 82, legend_y, 10, 10, 0xFFA726);
    gfx_draw_string(WDGT_X + 98, legend_y - 2, "Priv", 0x8A8D9A);

    gfx_draw_filled_rect(WDGT_X + 152, legend_y, 10, 10, 0x26C6DA);
    gfx_draw_string(WDGT_X + 168, legend_y - 2, "User", 0x8A8D9A);
}
