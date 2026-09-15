#pragma once
#include <stdint.h>
#include <stddef.h>
#include "ipc.h" // Needed to route messages via secure handles

#define EVENT_MOUSE_CLICK  1
#define EVENT_KEYPRESS     2

// 🛡️ SECURITY: Standardized INPUT IPC Command Identifiers for Router Isolation
#define INPUT_CMD_ROUTE_PACKET   0x701
#define INPUT_CMD_REG_SUBSYSTEM  0x702
#define INPUT_CMD_SET_FOCUS      0x703
#define INPUT_CMD_ADD_SURFACE    0x704

// 🛡️ SECURITY FIXED: Structured packet layout matching safe IPC packet constraints
typedef struct {
    uint8_t  event_type;
    int32_t  mouse_x;
    int32_t  mouse_y;
    uint32_t key_code;
} __attribute__((packed)) input_packet_t;

// --- Primary API Entry Points ---

/**
 * Initializes the unprivileged user-space input routing thread structures.
 */
void init_input_router(void);

/**
 * 🛡️ SANDBOXED INPUT PACKET ROUTER INTERFACE
 * This function no longer runs in Ring 0 supervisor mode. It executes entirely within the
 * unprivileged user-space 'input_router.bin' process container. It safely analyzes window maps,
 * translates coordinates, and forwards input packets to authorized subsystems via secure handles.
 * 
 * @param msg The secure incoming IPC packet containing the driver's raw hardware input data.
 * @param out_response Output response container to route completion states back to the kernel.
 */
int handle_input_router_message(const ipc_message_t* msg, ipc_message_t* out_response);

/**
 * 🛡️ ASYNCHRONOUS PACKET EVENT MULTIPLEXER LOOP
 * Continually reads raw device frames from the microkernel's hardware IPC channel.
 * Translates bytes, updates screen states, and dispatches data to foreground windows.
 */
void run_input_router_event_loop(ipc_handle_t kernel_hw_channel);