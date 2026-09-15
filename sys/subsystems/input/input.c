#include <stdbool.h>
#include <string.h>
#include "input_ipc.h"

// Hardcoded resolution limitations for your graphics canvas view boundaries
#define SCREEN_MAX_X 1024
#define SCREEN_MAX_Y 768

static int32_t current_mouse_x = 512;
static int32_t current_mouse_y = 384;
static uint32_t active_focus_app_pid = 6; // Default input focus assigned to logon shell/init

typedef struct {
    uint32_t message_type;
    uint64_t sender_pid;
    uint8_t  payload[512];
} input_ipc_packet_t;

extern void native_ipc_receive_message(uint32_t target_pid, void* packet);
extern void native_ipc_forward_message(uint32_t target_pid, uint32_t cmd, void* payload, size_t size);
extern void ui_update_hardware_cursor_position(int32_t x, int32_t y);

/**
 * Main Thread Loop for input.bin (Running as PID 10 in Ring 3)
 */
void input_daemon_main_loop(void) {
    input_ipc_packet_t incoming_packet;

    while (true) {
        // Block thread natively until the microkernel delivers a hardware interrupt envelope
        native_ipc_receive_message(INPUT_SERVICE_PID, &incoming_packet);

        // Security check: Only accept input messages originating from the kernel core itself (PID 0)
        if (incoming_packet.sender_pid != 0) continue;

        switch (incoming_packet.message_type) {

            case INPUT_CMD_KEYBOARD_EVENT: {
                // Forward the raw key data block directly down to the app holding active window focus
                native_ipc_forward_message(
                    active_focus_app_pid, 
                    INPUT_CMD_KEYBOARD_EVENT, 
                    incoming_packet.payload, 
                    sizeof(input_key_event_t)
                );
                break;
            }

            case INPUT_CMD_MOUSE_EVENT: {
                input_mouse_event_t* mouse = (input_mouse_event_t*)incoming_packet.payload;

                // 1. Calculate the new mouse tracking coordinate limits
                current_mouse_x += mouse->delta_x;
                current_mouse_y -= mouse->delta_y; // Invert axis matching top-left coordinate rules

                // 2. Enforce window border screen clamping rules
                if (current_mouse_x < 0) current_mouse_x = 0;
                if (current_mouse_x >= SCREEN_MAX_X) current_mouse_x = SCREEN_MAX_X - 1;
                if (current_mouse_y < 0) current_mouse_y = 0;
                if (current_mouse_y >= SCREEN_MAX_Y) current_mouse_y = SCREEN_MAX_Y - 1;

                // 3. Instruct the graphical server node to reposition the visual cursor block on the screen
                ui_update_hardware_cursor_position(current_mouse_x, current_mouse_y);

                // 4. Forward mouse event properties to the targeted application workspace
                native_ipc_forward_message(
                    active_focus_app_pid, 
                    INPUT_CMD_MOUSE_EVENT, 
                    incoming_packet.payload, 
                    sizeof(input_mouse_event_t)
                );
                break;
            }
        }
    }
}
