// =========================================================================
// UNIFIED INPUT EVENT RING & COMPOSITOR DRIVER HEADER
// =========================================================================
#ifndef SECURECURTAIN_INPUT_MUX_H
#define SECURECURTAIN_INPUT_MUX_H

#include <stdint.h>
#include <stdbool.h>

#define INPUT_MUX_MAGIC        0x494E4D58 // "INMX"
#define INPUT_EVENT_QUEUE_SIZE 128
#define CURSOR_WIDTH           16
#define CURSOR_HEIGHT          16

typedef enum {
    INPUT_EV_NONE = 0,
    INPUT_EV_KEY_DOWN,
    INPUT_EV_KEY_UP,
    INPUT_EV_MOUSE_MOVE,
    INPUT_EV_MOUSE_BUTTON_DOWN,
    INPUT_EV_MOUSE_BUTTON_UP,
    INPUT_EV_SCROLL
} InputEventType;

typedef struct {
    InputEventType type;
    uint32_t       timestamp_ms;
    uint32_t       code;       // Keycode or Button Index (1=Left, 2=Right, 3=Middle)
    int32_t        rel_x;      // Relative mouse delta X
    int32_t        rel_y;      // Relative mouse delta Y
    uint32_t       abs_x;      // Absolute screen X coordinate
    uint32_t       abs_y;      // Absolute screen Y coordinate
    uint32_t       modifiers;  // Shift (1), Ctrl (2), Alt (4), Super (8)
} InputEventPacket;

typedef struct {
    uint32_t         magic;
    bool             is_active;
    uint32_t         cursor_x;
    uint32_t         cursor_y;
    uint32_t         cursor_color;
    uint32_t         mouse_buttons_held;
    uint32_t         under_cursor_save_buffer[CURSOR_WIDTH * CURSOR_HEIGHT];
    bool             has_saved_cursor_pixels;
    
    InputEventPacket event_ring[INPUT_EVENT_QUEUE_SIZE];
    uint32_t         ring_head;
    uint32_t         ring_tail;
    uint64_t         total_events_processed;
} InputMuxRegistry;

void init_input_multiplexer_compositor(void);
void sys_input_push_event(const InputEventPacket* ev);
bool sys_input_pop_event(InputEventPacket* out_ev);

// Direct Hardware Interrupt Handlers (PS/2 & USB HID)
void sys_input_handle_ps2_keyboard_irq(uint8_t scancode);
void sys_input_handle_ps2_mouse_irq(int32_t delta_x, int32_t delta_y, uint8_t buttons);

// Bare-metal hardware cursor blit & restore
void sys_compositor_draw_cursor_overlay(void);
void sys_compositor_restore_under_cursor(void);

#endif // SECURECURTAIN_INPUT_MUX_H
