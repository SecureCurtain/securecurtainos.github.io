#pragma once
#include <stdint.h>
#include <stddef.h>
#include "ipc.h" // Needed to route wireless packets over secure handles

// 🛡️ SECURITY: Standardized WIRELESS IPC Command Identifiers for Server Isolation
#define WIFI_CMD_SCAN            0xA01
#define WIFI_CMD_CONNECT         0xA02
#define WIFI_CMD_DISCONNECT      0xA03
#define WIFI_CMD_RX_MGMT_FRAME   0xA04

// Security Protocol Profile Definitions
#define WIFI_SEC_WPA2_PSK        2  // WPA2 Personal (Pre-Shared Key)
#define WIFI_SEC_WPA2_ENT        3  // WPA2 Enterprise (802.1X/EAP)
#define WIFI_SEC_WPA3_SAE        4  // WPA3 Personal (Simultaneous Authentication of Equals)
#define WIFI_SEC_WPA3_ENT        5  // WPA3 Enterprise (192-bit Suite B Security)

#define WIFI_SSID_MAX_LEN        32
#define WIFI_KEY_MAX_LEN         64

// 🛡️ STRUCTURED WIRELESS CONNECT REQUEST PACKET
// Encapsulates network credentials safely inside standard ipc_message_t envelopes
typedef struct {
    char     ssid[WIFI_SSID_MAX_LEN];     // Target network identifier string
    uint8_t  security_profile;            // e.g., WIFI_SEC_WPA3_SAE
    char     passphrase[WIFI_KEY_MAX_LEN];// WPA2-PSK or WPA3-SAE password
    uint32_t eap_identity_offset;         // Used for Enterprise credential pointer maps
    uint32_t eap_password_offset;         // Used for Enterprise credential pointer maps
    uint16_t credential_block_length;     // Boundaries constraint check tracking metric
} __attribute__((packed)) wifi_ipc_connect_frame_t;

// --- Primary API Entry Points ---

/**
 * Initializes the unprivileged user-space wireless authentication supplicant state maps.
 */
void init_wireless_supplicant(void);

/**
 * 🛡️ SANDBOXED WIRELESS SECURITY DAEMON MODULE
 * Executes entirely within the unprivileged user-space 'wpa_supplicant_server.bin' 
 * process container. It safely parses cryptographic handshakes, executes SAE math, 
 * and handles EAP authentication loops without touching supervisor memory.
 * 
 * @param msg The incoming IPC packet containing authentication tokens or raw 802.11 frames.
 * @param out_response Output response container to route authentication states back to the client.
 */
int handle_wireless_supplicant_message(const ipc_message_t* msg, ipc_message_t* out_response);