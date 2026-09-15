#pragma once
#include <stdint.h>
#include <stddef.h>
#include "ipc.h" // Needed to route network/display states over secure handles

// 🛡️ SECURITY: Standardized USB4 WORKSPACE IPC Command Identifiers
#define USB4_CMD_PROBE_ROUTERS   0x1301
#define USB4_CMD_ALLOC_DP_TUNNEL 0x1302
#define USB4_CMD_DROP_TUNNEL     0x1303

#define USB4_MAX_ROUTERS         4
#define USB4_MAX_PATHS           16

// 🛡️ STRUCTURED USB4 DISPLAYPORT TUNNEL REQUEST PACKET
// Encapsulates hardware routing paths safely inside standard ipc_message_t envelopes
typedef struct {
    uint8_t  host_router_id;       // The target USB4 Host Controller index on the motherboard
    uint8_t  adapter_in_idx;       // The physical Type-C input adapter port index
    uint8_t  adapter_out_idx;      // The target DisplayPort output adapter port index
    uint16_t requested_bandwidth;  // Bandwidth allocation block tracking metric (in Mbps)
    uint8_t  session_token;    // The current user's token from auth_server.bin to allow connect
} __attribute__((packed)) usb4_ipc_tunnel_frame_t;

// --- Primary API Entry Points ---

/**
 * Initializes the unprivileged user-space USB4 connection manager state maps.
 */
void init_usb4_manager(void);

/**
 * 🛡️ SANDBOXED USB4 CONNECTION MANAGER DAEMON
 * Executes entirely within the unprivileged user-space 'usb4_manager.bin' 
 * process container. It handles protocol tunneling, sets up virtual paths, 
 * and maps DisplayPort streams without touching supervisor memory.
 */
int handle_usb4_message(const ipc_message_t* msg, ipc_message_t* out_response);