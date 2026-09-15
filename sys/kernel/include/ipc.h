#pragma once
#include <stdint.h>
#include <stddef.h>

#define IPC_MAX_PAYLOAD_SIZE 256
#define IPC_SUCCESS           0
#define IPC_ERR_INVALID_HDL  -1
#define IPC_ERR_BUFFER_FULL  -2
#define IPC_ERR_BUFFER_EMPTY -3
#define IPC_ERR_ACCESS_DENIED -4

// 🛡️ SECURITY: Structured packet frame instead of raw bytes
typedef struct {
    uint32_t sender_pid;                  // Filled by the kernel, never trusted from user-space
    uint32_t message_type;               // Identifies the command (e.g., VFS_OPEN, NT_CREATE)
    size_t   payload_length;             // Must be strictly <= IPC_MAX_PAYLOAD_SIZE
    uint8_t  payload[IPC_MAX_PAYLOAD_SIZE];
} __attribute__((packed)) ipc_message_t;

// Secure IPC handle identifier (replaces raw structure pointers)
typedef int32_t ipc_handle_t;

// ------------------------------------------------------------------------------
// Microkernel Core IPC Interfaces
// ------------------------------------------------------------------------------

/**
 * Sends a secure message frame to a target destination channel.
 * @param handle The kernel-validated capability handle for the IPC channel.
 * @param msg Pointer to the message payload structure in user space.
 */
int ipc_send_message(ipc_handle_t handle, const ipc_message_t* msg);

/**
 * Retrieves a message frame from the process queue.
 * @param handle The kernel-validated capability handle for the IPC channel.
 * @param out_msg Pointer to the user-space buffer where the message will be copied.
 */
int ipc_receive_message(ipc_handle_t handle, ipc_message_t* out_msg);

/**
 * Securely maps a shared memory region between two isolated modules.
 * Used for high-speed transfers like disk sector blocks and graphics frames.
 */
int ipc_map_shared_memory(ipc_handle_t handle, void* target_virtual_addr, size_t page_count, uint32_t flags);