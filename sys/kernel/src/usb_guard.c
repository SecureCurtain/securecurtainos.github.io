#include "usb_guard.h"
#include "ipc.h"
#include "auth.h" // Accesses token verification command flags
#include <string.h>

// Forward declaration
static void local_force_disconnect_port(uint8_t port_number);

// Simulated user-space mapping base for our motherboard's USB xHCI controller registers
#define USER_SPACE_USB_XHCI_ADDR  0x0000600000000000ULL

// Core xHCI operational register offsets
#define XHCI_REG_CONFIG_BASE      0x00ULL
#define XHCI_REG_PORTSC_BASE      0x400ULL // Port Status and Control base offset range

typedef struct {
    volatile uint32_t* xhci_mmio;
    ipc_handle_t       auth_server_proxy; // Handle linking securely back to auth_server.bin
    uint8_t            is_lockdown_mode;   // 1 = Block all unvetted data media completely
} secure_usb_guard_t;

static secure_usb_guard_t g_usb_guard;
extern void print_string(const char* str, int row);

void init_usb_guard_server(void) {
    memset(&g_usb_guard, 0, sizeof(secure_usb_guard_t));
    g_usb_guard.xhci_mmio = (volatile uint32_t*)USER_SPACE_USB_XHCI_ADDR;
    g_usb_guard.auth_server_proxy = 8; // Tied directly to your auth_server.bin handle
    g_usb_guard.is_lockdown_mode = 1;  // High-security boundary armed by default

    print_string("[OK] Sandboxed USB Guard Server: Peripheral Access Lockout Engine Online.", 32);
}

/**
 * 🛡️ LOW-LEVEL PORT HARDWARE LOCKOUT VECTOR
 * Writes directly to the emulated or physical xHCI Port Status and Control registers (PORTSC).
 * Disables or cuts power to a specific motherboard slot completely inside user space.
 */
static void local_force_disconnect_port(uint8_t port_number) {
    // Each physical USB port takes up one 32-bit register block in the xHCI register sheet
    uint32_t portsc_register_offset = XHCI_REG_PORTSC_BASE + (port_number * 4);
    
    // Read the current physical hardware state of the target motherboard slot
    volatile uint32_t* port_reg = (volatile uint32_t*)((uintptr_t)g_usb_guard.xhci_mmio + portsc_register_offset);
    uint32_t current_val = *port_reg;

    // 🛡️ SECURITY ENFORCED: Forcefully write to the Port Disable (PED) or Port Power (PP) pins.
    // Bit 3 = Port Enabled/Disabled, Bit 9 = Port Power. Clearing these cuts the data stream.
    uint32_t disconnect_mask = current_val & ~(1ULL << 3); // Clear PED bit to disable the line
    disconnect_mask &= ~(1ULL << 9);                        // Clear PP bit to drop slot power entirely
    
    *port_reg = disconnect_mask;
    
    print_string("[USB HARDWARE] Cut physical power and data lines to unauthorized motherboard slot.", 34);
}

int handle_usb_guard_message(const ipc_message_t* msg, ipc_message_t* out_response) {
    if (!msg || !out_response) return -1;
    if (msg->message_type != GUARD_CMD_VET_DEVICE) return -1;

    memset(out_response, 0, sizeof(ipc_message_t));
    out_response->message_type = msg->message_type;
    out_response->payload_length = sizeof(int32_t);
    int32_t* return_status = (int32_t*)out_response->payload;

    if (msg->payload_length < sizeof(usb_guard_vet_frame_t)) {
        *return_status = -2; // Corrupt packet sizing layout boundary
        return 0;
    }

    const usb_guard_vet_frame_t* device = (const usb_guard_vet_frame_t*)msg->payload;

    // 1. 🛡️ IDENTITY VERIFICATION HANDSHAKE
    // Request an inline verification pass from your unprivileged auth_server.bin
    ipc_message_t auth_check_tx;
    ipc_message_t auth_check_rx;
    memset(&auth_check_tx, 0, sizeof(ipc_message_t));
    auth_check_tx.message_type = AUTH_CMD_VALIDATE_TOKEN;
    auth_check_tx.payload_length = 32;
    memcpy(auth_check_tx.payload, device->session_token, 32);

    int auth_status = ipc_send_message(g_usb_guard.auth_server_proxy, &auth_check_tx);
    if (auth_status != IPC_SUCCESS || ipc_receive_message(g_usb_guard.auth_server_proxy, &auth_check_rx) != IPC_SUCCESS) {
        *return_status = -4; // Access Denied: Authentication server offline, lock all ports down
        local_force_disconnect_port(device->port_number);
        return 0;
    }

    auth_ipc_response_frame_t* auth_resp = (auth_ipc_response_frame_t*)auth_check_rx.payload;

    // 2. 🛡️ REFACTORED PERIPHERAL LOCKOUT FILTER
    // Check if the hot-plugged hardware matches restricted data-moving storage media profiles
    if (device->device_class == USB_CLASS_MASS_STORAGE || device->device_class == USB_CLASS_VIDEO_CAMERA) {
        
        // 🛡️ SECURITY FIXED: Check session authorization flags returned from the auth engine.
        // Even if the device has completely valid hardware descriptors, if the current session 
        // does not belong to the verified master "aaa" account (UID 1000), access is blocked.
        if (auth_resp->status_code != 0 || auth_resp->authorized_uid != 1000) {
            
            // ACCESS DENIED: Terminate device connection immediately at the hardware level
            print_string("[SECURITY LOCKOUT] Unauthorized media device detected! Restricting port.", 33);
            local_force_disconnect_port(device->port_number);
            
            *return_status = -4; // Access Denied / Security Block
            return 0;
        }
    }

    // Access Authorized: Device classification is safe or verified by "aaa" credentials
    print_string("[USB GUARD] Media peripheral authorized. Mounting data lines cleanly.", 33);
    *return_status = 0; // Mount allowed
    return 0;
}
