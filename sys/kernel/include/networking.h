#pragma once
#include <stdint.h>
#include <stddef.h>
#include "ipc.h" // Needed to route network states via secure capability handles

// 🛡️ SECURITY: Standardized NETWORKING IPC Command Identifiers for Server Isolation
#define NET_CMD_DRIVER_INIT   0x901
#define NET_CMD_SOCKET_OPEN   0x902
#define NET_CMD_SOCKET_CLOSE  0x903
#define NET_CMD_SEND_PACKET   0x904
#define NET_CMD_RECV_PACKET   0x905
#define NET_CMD_REGISTER_DRIVER   0x906

// Standard maximum transmission unit (MTU) packet constraint size for Ethernet frames
#define NET_MAX_PACKET_SIZE   1514

// 🛡️ STRUCTURED NETWORKING IPC REQUEST PACKETS
// Encapsulates network arguments safely inside standard ipc_message_t envelopes
typedef struct {
    uint32_t target_ip_addr;  // Destination IPv4 address
    uint16_t target_port;     // Destination TCP/UDP port
    uint16_t payload_length;  // Must be strictly <= NET_MAX_PACKET_SIZE
} __attribute__((packed)) net_ipc_socket_frame_t;

// 🛡️ THE UNIFIED USER-SPACE DRIVER PLUGIN TEMPLATE
// Any NIC manufacturer writes a standalone user-space daemon that fulfills these hooks.
typedef struct {
    int  (*nic_init)(uint64_t mmio_vaddr);
    int  (*nic_transmit)(const uint8_t* buffer, uint16_t length);
    int  (*nic_receive)(uint8_t* out_buffer, uint16_t* out_length);
    void (*nic_shutdown)(void);
} nic_driver_ops_t;

// Expose the global registration interface
void network_register_hardware_driver(nic_driver_ops_t* ops);

// Simulated user-space mapping base for our network card's MMIO registers
#define USER_SPACE_NIC_MMIO_ADDR  0x0000400000000000ULL

// --- Primary API Entry Points ---

/**
 * Initializes the unprivileged user-space network driver server tracking arrays.
 */
void init_network_subsystem(void);

/**
 * 🛡️ SANDBOXED NETWORK ROUTER INTERFACE
 * This function runs entirely within the unprivileged user-space 'network_server.bin' 
 * process container. It translates network arguments, processes TCP/IP headers, 
 * and handles packet buffers safely without touching supervisor memory.
 * 
 * @param msg The incoming IPC packet containing socket requests or raw hardware frames.
 * @param out_response Output response container to route transaction states back to the caller.
 */
int handle_network_server_message(const ipc_message_t* msg, ipc_message_t* out_response);