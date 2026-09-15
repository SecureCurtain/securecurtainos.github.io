#include "../../kernel/include/security_audit.h"
#include "lock_screen.h"
#include <stdio.h>
#include <string.h>

#define MAX_VIEWER_RECORDS 128
static UnifiedViewerRecord g_viewer_records[MAX_VIEWER_RECORDS];
static uint32_t g_viewer_record_count = 0;

extern void gfx_get_screen_dimensions(uint32_t* width, uint32_t* height);
extern void gfx_draw_filled_rect(uint32_t x, uint32_t y, uint32_t w, uint32_t h, uint32_t color);
extern void gfx_draw_string(uint32_t x, uint32_t y, const char* text, uint32_t color);

void population_viewer_data_cache(void) {
    // Unpack, decrypt, and parse both system logs and out-of-band IPS vectors
    g_viewer_record_count = 0;
}

void render_unified_security_viewer(void) {
    uint32_t sw = 0, sh = 0;
    gfx_get_screen_dimensions(&sw, &sh);

    uint32_t vx = (sw > 700) ? (sw - 700) / 2 : 10;
    uint32_t vy = (sh > 400) ? (sh - 400) / 2 : 10;

    gfx_draw_filled_rect(vx, vy, 700, 400, 0x1E1E1E);
    gfx_draw_filled_rect(vx, vy, 700, 28, 0x2D2D30);
    gfx_draw_string(vx + 12, vy + 8, "Unified Security Audit & Telemetry Console", 0xFFFFFF);

    gfx_draw_string(vx + 20, vy + 45, "EVENT TYPE", 0x888888);
    gfx_draw_string(vx + 140, vy + 45, "ORIGIN", 0x888888);
    gfx_draw_string(vx + 240, vy + 45, "SEVERITY", 0x888888);
    gfx_draw_string(vx + 340, vy + 45, "DESCRIPTION", 0x888888);

    gfx_draw_filled_rect(vx + 10, vy + 65, 680, 1, 0x3E3E42);
}
