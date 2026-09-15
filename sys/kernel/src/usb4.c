#include "usb4.h"
#include "ipc.h"
#include "auth.h" // Accesses token verification command flags
#include <string.h>

// Forward declaration
static int local_usb4_configure_path(uint8_t adapter_idx, uint16_t hop_id, uint32_t config_data);

// Simulated user-space mapping base for our motherboard's USB4 NHI registers
#define USER_SPACE_USB4_NHI_ADDR  0x0000700000000000ULL

// Core USB4 Non-Host Interface (NHI) Register offsets
#define NHI_REG_REG_ACCESS         0x00ULL
#define NHI_REG_PATH_CONFIG_ADDR   0x10ULL // Path Configuration Space Pointer
#define NHI_REG_PATH_CONFIG_DATA   0x14ULL // Path Configuration Space Data Port

typedef struct {
    uint8_t  path_id;
    uint8_t  in_adapter;
    uint8_t  out_adapter;
    uint8_t  is_allocated;
    uint16_t bandwidth;
} usb4_virtual_path_t;

typedef struct {
    volatile uint32_t* nhi_mmio;
    ipc_handle_t       auth_server_proxy; // Handle linking securely back to auth_server.bin
    usb4_virtual_path_t active_paths[USB4_MAX_PATHS];
    size_t              path_count;
} secure_usb4_manager_t;

static secure_usb4_manager_t g_usb4_mgr;
extern void print_string(const char* str, int row);

// Inline helpers to handle direct register access safely within the Ring 3 sandbox
static inline void nhi_write(uint32_t reg, uint32_t val) {
    g_usb4_mgr.nhi_mmio[reg / 4] = val;
}

static inline uint32_t nhi_read(uint32_t reg) {
    return g_usb4_mgr.nhi_mmio[reg / 4];
}

void init_usb4_manager(void) {
    memset(&g_usb4_mgr, 0, sizeof(secure_usb4_manager_t));
    g_usb4_mgr.nhi_mmio = (volatile uint32_t*)USER_SPACE_USB4_NHI_ADDR;
    g_usb4_mgr.auth_server_proxy = 8; // Tied directly to your auth_server.bin handle
    g_usb4_mgr.path_count = 0;

    print_string("[OK] Sandboxed USB4 Connection Manager: Video Tunneling Sub-Engine Online.", 30);
}

/**
 * 🛡️ HARDWARE PATH CONFIGURATION SPACE WRITER
 * Sets up a virtual routing path descriptor inside the USB4 Host Router.
 * Executing this memory-mapped topology routing loop inside user space shields Ring 0.
 */
static int local_usb4_configure_path(uint8_t adapter_idx, uint16_t hop_id, uint32_t config_data) {
    // Wait until the controller status register signals it is ready to ingest a new path command
    uint64_t timeout_counter = 500000;
    while (nhi_read(NHI_REG_PATH_CONFIG_ADDR) & (1ULL << 31)) { // Busy bit tracking loop
        __asm__ __volatile__("pause");
        if (--timeout_counter == 0) return -1; // Intercept hardware stall safely
    }

    // Pack the target hardware matrix parameters into the address register
    // Bit 0-7 = Adapter Index, Bit 8-19 = Hop ID, Bit 31 = Initiate Write Command Flag
    uint32_t addr_reg = (1ULL << 31) | ((uint32_t)hop_id << 8) | adapter_idx;
    
    nhi_write(NHI_REG_PATH_CONFIG_DATA, config_data);
    nhi_write(NHI_REG_PATH_CONFIG_ADDR, addr_reg);
    return 0;
}

int handle_usb4_message(const ipc_message_t* msg, ipc_message_t* out_response) {
    if (!msg || !out_response) return -1;
    if (msg->message_type != USB4_CMD_ALLOC_DP_TUNNEL) return -1;

    memset(out_response, 0, sizeof(ipc_message_t));
    out_response->message_type = msg->message_type;
    out_response->payload_length = sizeof(int32_t);
    int32_t* return_status = (int32_t*)out_response->payload;

    if (msg->payload_length < sizeof(usb4_ipc_tunnel_frame_t)) {
        *return_status = -2; // Corrupt packet layout configuration boundary
        return 0;
    }

    const usb4_ipc_tunnel_frame_t* tunnel = (const usb4_ipc_tunnel_frame_t*)msg->payload;

    // 1. 🛡️ SESSION INTEGRITY HANDSHAKE
    // Validate the session token with your unprivileged auth_server.bin module
    ipc_message_t auth_check_tx, auth_check_rx;
    memset(&auth_check_tx, 0, sizeof(ipc_message_t));
    auth_check_tx.message_type = AUTH_CMD_VALIDATE_TOKEN;
    auth_check_tx.payload_length = 32;
    memcpy(auth_check_tx.payload, &tunnel->session_token, 1); // Extract matching single-byte user token alignment

    int auth_status = ipc_send_message(g_usb4_mgr.auth_server_proxy, &auth_check_tx);
    if (auth_status != IPC_SUCCESS || ipc_receive_message(g_usb4_mgr.auth_server_proxy, &auth_check_rx) != IPC_SUCCESS) {
        *return_status = -4; // Access Denied: Auth service communication dropped, abort tunnel mapping
        return 0;
    }

    auth_ipc_response_frame_t* auth_resp = (auth_ipc_response_frame_t*)auth_check_rx.payload;

    // 2. 🛡️ REFACTORED USER AUTHORIZATION FILTER
    // Check if the current user session belongs to the verified master "aaa" account (UID 1000)
    if (auth_resp->status_code != 0 || auth_resp->authorized_uid != 1000) {
        print_string("[SECURITY LOCKOUT] Unauthorized USB4 display connection blocked!", 31);
        *return_status = -4; // Access Denied
        return 0;
    }

    // 3. 🛡️ ALLOCATION OVERFLOW PROTECTION BOUNDARY
    if (g_usb4_mgr.path_count >= USB4_MAX_PATHS) {
        *return_status = -1; // Max virtual channels active
        return 0;
    }

    // 4. Configure the virtual DisplayPort Tunnel inside the hardware controller registers
    // Hop ID 8 and 9 are standard architectural entry points for first-line DisplayPort tunneling
    uint16_t base_hop_id = 8; 
    
    // Map the forward path: DisplayPort In Adapter -> DisplayPort Out Adapter (Type-C line)
    // Packet configuration markers: Bit 0 = Enable Tunnel, Bit 16-23 = Target Destination Link
    uint32_t dp_path_config_payload = (1 << 0) | ((uint32_t)tunnel->adapter_out_idx << 16);
    int err = local_usb4_configure_path(tunnel->adapter_in_idx, base_hop_id, dp_path_config_payload);
    
    if (err != 0) {
        print_string("[USB4 ERR] Hardware path configuration timeout. Link failed.", 31);
        *return_status = -5; // Hardware I/O Error
        return 0;
    }

    // Track the validated virtual channel safely inside our Ring 3 array
    size_t idx = g_usb4_mgr.path_count++;
    g_usb4_mgr.active_paths[idx].path_id = (uint8_t)idx;
    g_usb4_mgr.active_paths[idx].in_adapter = tunnel->adapter_in_idx;
    g_usb4_mgr.active_paths[idx].out_adapter = tunnel->adapter_out_idx;
    g_usb4_mgr.active_paths[idx].bandwidth = tunnel->requested_bandwidth;
    g_usb4_mgr.active_paths[idx].is_allocated = 1;

    print_string("[USB4 MGR] DisplayPort Protocol Tunnel established successfully.", 31);
    *return_status = 0; // Success
    return 0;
}
