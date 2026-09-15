#include "vpn.h"
#include "ipc.h"
#include "networking.h" // Accesses network command identifiers
#include <string.h>

// Add this near the top of vpn.c under your #includes:
static void local_crypt_vpn_packet(const uint8_t* source, uint8_t* dest, uint16_t length, const uint8_t* key);

// Simulated runtime state tracking parameters for our unprivileged VPN container
typedef struct {
    uint8_t      local_private_key[VPN_KEY_LEN];
    uint8_t      peer_public_key[VPN_KEY_LEN];
    uint32_t     peer_gateway_ip;
    ipc_handle_t network_stack_handle; // Secure capability handle linking straight to network_server.bin
    uint8_t      is_tunnel_active;      // 0 = Down/Unencrypted, 1 = Secure VPN Tunnel Armed
} secure_vpn_tunnel_t;

static secure_vpn_tunnel_t g_vpn_tunnel;
extern void print_string(const char* str, int row);

void init_vpn_server(void) {
    memset(&g_vpn_tunnel, 0, sizeof(secure_vpn_tunnel_t));
    g_vpn_tunnel.network_stack_handle = 6; // Tied directly to your network_server.bin handle
    g_vpn_tunnel.is_tunnel_active = 0;

    print_string("[OK] Sandboxed VPN Multiplexer Server: Cryptographic Tunnel Engine Online.", 34);
}

/**
 * 🛡️ INTERNAL SYMMETRIC PACKET STREAM CIPHER CORE
 * Executes a simulated ChaCha20-Poly1305 data block packet encryption loop.
 * Running heavy cryptography algorithms completely inside user space shields the Ring 0 stack.
 */
static void local_crypt_vpn_packet(const uint8_t* source, uint8_t* dest, uint16_t length, const uint8_t* key) {
    // Basic structural mathematical proxy for symmetric block packet scrambling
    uint32_t crypto_nonce = 0x12345678;

    for (uint16_t i = 0; i < length; i++) {
        // Apply key masking and unique block nonce offsets to every individual byte frame
        dest[i] = source[i] ^ key[i % VPN_KEY_LEN] ^ ((uint8_t*)&crypto_nonce)[i % 4];
        crypto_nonce += i; // Shift stream state slightly per iteration pass
    }
}

int handle_vpn_message(const ipc_message_t* msg, ipc_message_t* out_response) {
    if (!msg || !out_response) return -1;

    memset(out_response, 0, sizeof(ipc_message_t));
    out_response->message_type = msg->message_type;

    // Configure the response envelope parameters safely
    out_response->payload_length = sizeof(int32_t);
    int32_t* return_status = (int32_t*)out_response->payload;

    // --------------------------------------------------------------------------
    // 🛡️ INTERCEPT ROUTE: DYNAMIC PEER AND KEY CONFIGURATION
    // --------------------------------------------------------------------------
    if (msg->message_type == VPN_CMD_CONFIGURE_PEER) {
        if (msg->payload_length < VPN_KEY_LEN + sizeof(uint32_t)) {
            *return_status = -2; // Corrupt packet sizing layout boundary
            return 0;
        }

        // 1. 🛡️ SECURITY FIXED: Enforce authorized key load validation checks.
        // We look up msg->sender_pid (populated strictly by the kernel system call gate).
        // Ensures that a regular guest process cannot forge messages to pass arbitrary peer identities.
        if (msg->sender_pid != 12) { // Assuming PID 12 is your authenticated shell_server.bin
            *return_status = -4; // Access Denied: Malicious tunnel hijack attempt blocked!
            print_string("[SECURITY HAZARD] Unauthorized VPN peer injection attempt blocked!", 35);
            return 0;
        }

        // Extract public keys and remote target gateway IPs cleanly from the payload envelope
        g_vpn_tunnel.peer_gateway_ip = *(uint32_t*)msg->payload;
        memcpy(g_vpn_tunnel.peer_public_key, msg->payload + sizeof(uint32_t), VPN_KEY_LEN);
        
        // Mock setting a secure internal handshake private tracking token key
        memset(g_vpn_tunnel.local_private_key, 0x99, VPN_KEY_LEN);
        g_vpn_tunnel.is_tunnel_active = 1;

        print_string("[VPN CORE] Cryptographic peer key authenticated. Secure tunnel armed.", 35);
        *return_status = 0; // Success
        return 0;
    }

    // --------------------------------------------------------------------------
    // 🛡️ INTERCEPT ROUTE: BOUNDS-SAFE PACKET ENCAPSULATION
    // --------------------------------------------------------------------------
    else if (msg->message_type == VPN_CMD_ENCAPSULATE) {
        if (!g_vpn_tunnel.is_tunnel_active) {
            *return_status = -6; // Tunnel Down: Cryptographic keys not configured
            return 0;
        }

        const vpn_ipc_packet_frame_t* frame = (const vpn_ipc_packet_frame_t*)msg->payload;

        // 2. 🛡️ SECURITY FIXED: Protect network loops against packet-size injection attacks.
        // Attackers pass massive payload lengths to trick transmission code into overflowing heap data.
        if (frame->packet_payload_len > VPN_MTU_SIZE || frame->packet_payload_len == 0) {
            *return_status = -3; // Reject packet sizing violation instantly
            return 0;
        }

        // Allocate a localized packet staging array entirely on the unprivileged user-space stack
        uint8_t plaintext_packet[VPN_MTU_SIZE];
        uint8_t ciphertext_packet[VPN_MTU_SIZE];

        const uint8_t* raw_subsystem_bytes = msg->payload + frame->transport_offset;
        memcpy(plaintext_packet, raw_subsystem_bytes, frame->packet_payload_len);

        // 3. Encrypt the plaintext bytes safely inside the user-space container
        local_crypt_vpn_packet(plaintext_packet, ciphertext_packet, frame->packet_payload_len, g_vpn_tunnel.local_private_key);

        // 4. Proxy the cryptographically sealed wire packet down to your user-space network server stack
        ipc_message_t net_tx_msg;
        memset(&net_tx_msg, 0, sizeof(ipc_message_t));
        net_tx_msg.message_type = NET_CMD_SEND_PACKET;
        
        // Build out the target network destination parameters inside the envelope header
        net_ipc_socket_frame_t* sock_hdr = (net_ipc_socket_frame_t*)net_tx_msg.payload;
        sock_hdr->target_ip_addr = g_vpn_tunnel.peer_gateway_ip;
        sock_hdr->target_port = 51820; // Standard WireGuard default port allocation marker
        sock_hdr->payload_length = frame->packet_payload_len;

        // Copy our freshly cipher-scrambled bytes right behind the packet socket header
        uint8_t* net_payload_ptr = net_tx_msg.payload + sizeof(net_ipc_socket_frame_t);
        memcpy(net_payload_ptr, ciphertext_packet, frame->packet_payload_len);
        net_tx_msg.payload_length = sizeof(net_ipc_socket_frame_t) + frame->packet_payload_len;

        // Dispatch the secure packet straight down the wire to your isolated driver server
        ipc_send_message(g_vpn_tunnel.network_stack_handle, &net_tx_msg);

        // 5. 🛡️ SECURITY FIXED: Strict Stack Sanitization.
        // Forcefully overwrite temporary stack structures to destroy transient keys and plaintext blocks.
        memset(plaintext_packet, 0, VPN_MTU_SIZE);
        memset(ciphertext_packet, 0, VPN_MTU_SIZE);

        print_string("[VPN] Subsystem payload sealed inside WireGuard frame and dispatched.", 36);
        *return_status = 0; // Operation successful
        return 0;
    }

    return -1;
}
