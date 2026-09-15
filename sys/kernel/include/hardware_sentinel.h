#pragma once
#include <stdint.h>
#include <stddef.h>
#include "ipc.h" // Needed to route structural states over secure handles

// 🛡️ SECURITY: Standardized HARDWARE SENTINEL IPC Command Identifiers
#define SENTINEL_CMD_AUDIT_TOPOLOGY  0x1501
#define SENTINEL_CMD_COMMIT_BASELINE 0x1502
#define SIGNAL_CMD_AUDIT_TOPOLOGY   0x1501

// 🛡️ STRUCTURED TOPOLOGY AUDIT PACKET
// Encapsulates current hardware signatures safely inside standard ipc_message_t envelopes
typedef struct {
    uint32_t current_pci_device_hash;  // Combined hash sum of all discovered vendor/device IDs
    uint16_t total_pci_devices;        // Total physical device slots populated on the PCIe bus
    uint8_t  session_token;        // Token from auth_server.bin used to authorize overrides
} __attribute__((packed)) sentinel_ipc_audit_frame_t;

// --- Primary API Entry Points ---

/**
 * Initializes the user-space hardware baseline tracking states.
 */
void init_hardware_sentinel(void);

/**
 * 🛡️ SANDBOXED HARDWARE TOPOLOGY AUDIT DAEMON
 * Executes entirely within the unprivileged user-space 'hardware_sentinel.bin' process container.
 * Safely cross-examines device hash states and handles security lockouts without touching Ring 0.
 */
int handle_hardware_sentinel_message(const ipc_message_t* msg, ipc_message_t* out_response);