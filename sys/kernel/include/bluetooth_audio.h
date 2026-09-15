#pragma once
#include <stdint.h>
#include <stddef.h>
#include "ipc.h" // Needed to route Bluetooth packets over secure handles

// 🛡️ SECURITY: Standardized BLUETOOTH IPC Command Identifiers
#define BT_CMD_START_DISCOVERY   0x1801
#define BT_CMD_PAIR_DEVICE       0x1802
#define BT_CMD_STREAM_A2DP       0x1803

#define BT_MAC_ADDR_LEN          6
#define BT_NAME_MAX_LEN          32
#define BT_AUDIO_MAX_SAMPLES     256

// 🛡️ STRUCTURED BLUETOOTH PAIRING REQUEST PACKET
// Encapsulates hardware device addresses safely inside standard ipc_message_t envelopes
typedef struct {
    uint8_t  target_mac_addr[BT_MAC_ADDR_LEN]; // Target headphone physical hardware MAC address
    char     device_name[BT_NAME_MAX_LEN];     // Discovered device name string
    uint32_t fixed_pin_code;                   // 4-digit or 6-digit Bluetooth pairing PIN
    uint8_t  session_token;                // Current user's token from auth_server.bin to allow pairing
} __attribute__((packed)) bt_ipc_pair_frame_t;

// --- Primary API Entry Points ---

/**
 * Initializes the unprivileged user-space Bluetooth audio transmitter memory states.
 */
void init_bluetooth_audio_server(void);

/**
 * 🛡️ SANDBOXED BLUETOOTH AUDIO CORE
 * Executes entirely within the unprivileged user-space 'bluetooth_audio_server.bin' process container.
 * Enforces strictly unidirectional audio streaming and drops all unauthorized inbound data channels.
 * 
 * @param msg The incoming IPC packet containing pairing frames or raw audio samples.
 * @param out_response Output response container to route transaction statuses back to the caller.
 */
int handle_bluetooth_audio_message(const ipc_message_t* msg, ipc_message_t* out_response);