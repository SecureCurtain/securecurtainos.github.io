// =========================================================================
// UNIFIED INPUT EVENT RING & COMPOSITOR DRIVER IMPLEMENTATION
// =========================================================================
#include "input_mux.h"
#include "gop_mux.h"
#include "kstring.h"
#include <stdio.h>

static InputMuxRegistry g_input_mux;

extern bool sys_gop_blit_pixel_stream(uint32_t aperture_id, uint32_t pid, uint32_t local_x, uint32_t local_y, uint32_t pixel_color);

// Built-in 16x16 Arrow Pointer Bitmap Mask
// 1 = Cursor Color (White), 2 = Cursor Border (Black), 0 = Transparent
static const uint8_t g_arrow_cursor[16][16] = {
    {2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0},
    {2,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0},
    {2,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0},
    {2,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0},
    {2,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0},
    {2,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0},
    {2,1,1,1,1,1,1,0,0,0,0,0,0,0,0,0},
    {2,1,1,1,1,1,1,1,0,0,0,0,0,0,0,0},
    {2,1,1,1,1,1,1,1,1,0,0,0,0,0,0,0},
    {2,1,1,1,1,1,1,1,1,1,0,0,0,0,0,0},
    {2,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0},
    {2,1,0,2,1,1,0,0,0,0,0,0,0,0,0,0},
    {2,0,0,2,1,1,0,0,0,0,0,0,0,0,0,0},
    {0,0,0,0,2,1,1,0,0,0,0,0,0,0,0,0},
    {0,0,0,0,2,1,1,0,0,0,0,0,0,0,0,0},
    {0,0,0,0,0,2,2,0,0,0,0,0,0,0,0,0}
};

void init_input_multiplexer_compositor(void) {
    kmemset(&g_input_mux, 0, sizeof(InputMuxRegistry));
    g_input_mux.magic = INPUT_MUX_MAGIC;
    g_input_mux.is_active = true;
    g_input_mux.cursor_x = 960; // Center screen default
    g_input_mux.cursor_y = 540;
    g_input_mux.cursor_color = 0xFFFFFF; // Crisp White Cursor

    printf("[Kernel Input]: Unified Input Event Ring & Hardware Cursor Compositor active.\\n");
}

void sys_input_push_event(const InputEventPacket* ev) {
    if (!ev || !g_input_mux.is_active) return;
    uint32_t next_head = (g_input_mux.ring_head + 1) % INPUT_EVENT_QUEUE_SIZE;
    if (next_head != g_input_mux.ring_tail) {
        kmemcpy(&g_input_mux.event_ring[g_input_mux.ring_head], ev, sizeof(InputEventPacket));
        g_input_mux.ring_head = next_head;
        g_input_mux.total_events_processed++;
    }
}

bool sys_input_pop_event(InputEventPacket* out_ev) {
    if (!out_ev || g_input_mux.ring_head == g_input_mux.ring_tail) return false;
    kmemcpy(out_ev, &g_input_mux.event_ring[g_input_mux.ring_tail], sizeof(InputEventPacket));
    g_input_mux.ring_tail = (g_input_mux.ring_tail + 1) % INPUT_EVENT_QUEUE_SIZE;
    return true;
}

void sys_input_handle_ps2_keyboard_irq(uint8_t scancode) {
    InputEventPacket ev;
    kmemset(&ev, 0, sizeof(InputEventPacket));
    bool is_release = (scancode & 0x80) != 0;
    ev.type = is_release ? INPUT_EV_KEY_UP : INPUT_EV_KEY_DOWN;
    ev.code = scancode & 0x7F;
    ev.abs_x = g_input_mux.cursor_x;
    ev.abs_y = g_input_mux.cursor_y;
    sys_input_push_event(&ev);
}

void sys_input_handle_ps2_mouse_irq(int32_t delta_x, int32_t delta_y, uint8_t buttons) {
    int32_t new_x = (int32_t)g_input_mux.cursor_x + delta_x;
    int32_t new_y = (int32_t)g_input_mux.cursor_y - delta_y;

    if (new_x < 0) new_x = 0;
    if (new_x > 3840) new_x = 3840;
    if (new_y < 0) new_y = 0;
    if (new_y > 2160) new_y = 2160;

    g_input_mux.cursor_x = (uint32_t)new_x;
    g_input_mux.cursor_y = (uint32_t)new_y;
    g_input_mux.mouse_buttons_held = buttons;

    InputEventPacket ev;
    kmemset(&ev, 0, sizeof(InputEventPacket));
    ev.type = INPUT_EV_MOUSE_MOVE;
    ev.rel_x = delta_x;
    ev.rel_y = delta_y;
    ev.abs_x = g_input_mux.cursor_x;
    ev.abs_y = g_input_mux.cursor_y;
    ev.code = buttons;
    sys_input_push_event(&ev);
}

void sys_compositor_draw_cursor_overlay(void) {
    uint32_t base_x = g_input_mux.cursor_x;
    uint32_t base_y = g_input_mux.cursor_y;

    for (uint32_t row = 0; row < CURSOR_HEIGHT; row++) {
        for (uint32_t col = 0; col < CURSOR_WIDTH; col++) {
            uint8_t pixel_type = g_arrow_cursor[row][col];
            if (pixel_type == 1) {
                // White arrow fill
                sys_gop_blit_pixel_stream(600, 100, base_x + col, base_y + row, 0xFFFFFF);
            } else if (pixel_type == 2) {
                // High-contrast black border
                sys_gop_blit_pixel_stream(600, 100, base_x + col, base_y + row, 0x000000);
            }
        }
    }
}
