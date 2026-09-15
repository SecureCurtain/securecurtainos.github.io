#pragma once
#include <stdint.h>
#include <stddef.h>
#include "ipc.h" // Needed to route peripheral states over secure handles

// 🛡️ SECURITY: Standardized USB GUARD IPC Command Identifiers
#define GUARD_CMD_VET_DEVICE     0x1101
#define GUARD_CMD_FORCE_DISCONNECT 0x1102

// Standard USB Core Class Code Categories
#define USB_CLASS_MASS_STORAGE   0x08  // Thumb drives, external HDDs/SSDs
#define USB_CLASS_VIDEO_CAMERA   0x0E  // Webcams, capture cards, imaging chips
#define USB_CLASS_HUB            0x09  // USB Hub splitters

// 🛡️ STRUCTURED USB DEVICE DETECTION FRAME
// Encapsulates raw device properties safely inside standard ipc_message_t envelopes
typedef struct {
    uint16_t vendor_id;                 // Vendor ID (e.g., 0x058F for Alcor Micro)
    uint16_t device_id;                 // Product ID
    uint8_t  device_class;              // USB Core Class Code (e.g., USB_CLASS_MASS_STORAGE)
    uint8_t  port_number;               // The physical xHCI slot index on the motherboard
    uint8_t  session_token[32];         // The current user's token from auth_server.bin
} __attribute__((packed)) usb_guard_vet_frame_t;

// --- Primary API Entry Points ---

/**
 * Initializes the unprivileged user-space hardware authorization driver tables.
 */
void init_usb_guard_server(void);

/**
 * 🛡️ SANDBOXED HARDWARE SECURITY ACCESS DAEMON
 * Executes entirely within the unprivileged user-space 'usb_guard_server.bin' 
 * process container. It parses device descriptors, matches session tokens, 
 * and controls port power states without touching supervisor memory.
 * 
 * @param msg The incoming IPC packet containing hot-plug parameters and user session tokens.
 * @param out_response Output response container to route access statuses (0 = Mount, -4 = Force Kill).
 */
int handle_usb_guard_message(const ipc_message_t* msg, ipc_message_t* out_response);