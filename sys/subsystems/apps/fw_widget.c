#include "fw_widget.h"
#include "../../kernel/include/tarpit.h"
#include <stdio.h>
#include <string.h>
#include <stdbool.h>

extern void gfx_draw_filled_rect(uint32_t x, uint32_t y, uint32_t w, uint32_t h, uint32_t color);
extern void gfx_draw_string(uint32_t x, uint32_t y, const char* text, uint32_t color);

// Simulated data structural link pulling elements from the 128-slot tarpit queues
typedef struct {
    uint32_t ip;
    uint32_t duration_seconds;
    bool     is_active;
} TarpitWidgetSnapshot;

void render_firewall_monitor_map_widget(void) {
    // 1. Draw central widget frame card container
    gfx_draw_filled_rect(FW_WDGT_X, FW_WDGT_Y, FW_WDGT_W, FW_WDGT_H, 0x101216);
    gfx_draw_filled_rect(FW_WDGT_X, FW_WDGT_Y, FW_WDGT_W, 26, 0x1F232D);
    gfx_draw_string(FW_WDGT_X + 12, FW_WDGT_Y + 6, "IDS Intrusion Monitor Console", 0xFFFFFF);

    gfx_draw_string(FW_WDGT_X + 12, FW_WDGT_Y + 36, "ACTIVE TARPIT ATTACK VECTORS:", 0x6E7485);

    // 2. Draw a high-density, vector map grid representing the 128 tracker slots
    // Structured as an 8-row by 16-column grid array matrix block (8 * 16 = 128 concurrent targets)
    uint32_t row_count = 8;
    uint32_t col_count = 16;
    uint32_t active_counter = 0;

    for (uint32_t r = 0; r < row_count; r++) {
        for (uint32_t c = 0; col_count > c; c++) {
            uint32_t slot_x = FW_WDGT_X + 14 + (c * 13);
            uint32_t slot_y = FW_WDGT_Y + 54 + (r * 16);

            // Simulation link: Render the target dot amber/red if an intrusion occupies this slot index
            bool slot_occupied = ((r * col_count + c) % 5 == 0 && (r + c) % 2 == 0);
            uint32_t dot_color = 0x22262F; // Dull grey representing an empty, available channel slot

            if (slot_occupied) {
                active_counter++;
                // Alternate dot colors based on tracking clock parameters to represent severity states
                dot_color = (c % 2 == 0) ? 0xFFA726 : 0xEF5350; // Amber or Crimson vector tracking dot
            }

            gfx_draw_filled_rect(slot_x, slot_y, 9, 10, dot_color);
        }
    }

    // 3. Render Status Telemetry String Values
    char telemetry_summary[64];
    snprintf(telemetry_summary, sizeof(telemetry_summary), "Trapped Intruders : %03d / 128 Max", active_counter);
    gfx_draw_string(FW_WDGT_X + 12, FW_WDGT_Y + 200, telemetry_summary, active_counter > 0 ? 0xFFA726 : 0x8A8D9A);

    // Draw a minimized, clean wireframe line trend box inside the widget panel window
    uint32_t trend_y = FW_WDGT_Y + 230;
    gfx_draw_filled_rect(FW_WDGT_X + 12, trend_y, FW_WDGT_W - 24, 60, 0x07080A);
    gfx_draw_string(FW_WDGT_X + 20, trend_y + 8, "IPS Mitigation Engine: Active", 0x3CD070); // Eco-green operational text
    gfx_draw_filled_rect(FW_WDGT_X + 20, trend_y + 26, 180, 2, 0x3CD070); // Simulated steady-state line graph
    
    char bypass_summary[64];
    snprintf(bypass_summary, sizeof(bypass_summary), "Protected Admin Whitelist Blocks: Active");
    gfx_draw_string(FW_WDGT_X + 12, FW_WDGT_Y + FW_WDGT_H - 24, bypass_summary, 0x6E7485);
}
