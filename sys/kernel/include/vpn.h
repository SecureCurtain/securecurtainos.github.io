#pragma once
#include <stdint.h>
#include <stddef.h>
#include "ipc.h" // Needed to route encrypted packet streams over secure handles

// 🛡️ SECURITY: Standardized VPN IPC Command Identifiers
#define VPN_CMD_CONFIGURE_PEER   0xF01
#define VPN_CMD_ENCAPSULATE      0xF02
#define VPN_CMD_DECAPSULATE      0xF03

#define VPN_KEY_LEN              32   // Standard 256-bit cryptographic key size
#define VPN_MTU_SIZE             1420 // WireGuard standard MTU limit to accommodate encapsulation overhead

// 🛡️ STRUCTURED VPN PACKET ROUTING FRAME
// Encapsulates network payloads safely inside standard ipc_message_t envelopes
typedef struct {
    uint32_t peer_endpoint_ip;          // Remote physical VPN gateway IP address
    uint16_t packet_payload_len;        // Must be strictly <= VPN_MTU_SIZE
    uint32_t transport_offset;          // Boundary validation offset tracker inside the packet
} __attribute__((packed)) vpn_ipc_packet_frame_t;

// --- Primary API Entry Points ---

/**
 * Initializes the unprivileged user-space VPN tunnel structures and session trackers.
 */
void init_vpn_server(void);

/**
 * 🛡️ SANDBOXED VIRTUAL PRIVATE NETWORK SERVER
 * Executes entirely within the unprivileged user-space 'vpn_server.bin' 
 * process container. It safely encrypts/decrypts packet buffers, wraps payload 
 * lengths, and routes tunnels to network stacks without touching supervisor memory.
 * 
 * @param msg The incoming IPC packet containing plaintext packets or incoming encrypted wire frames.
 * @param out_response Output response container to route encrypted payloads or execution statuses.
 */
int handle_vpn_message(const ipc_message_t* msg, ipc_message_t* out_response);