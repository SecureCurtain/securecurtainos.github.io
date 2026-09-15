#pragma once
#include <stdint.h>
#include <stdbool.h>

#define IPC_MAX_CHANNELS   16
#define IPC_PAYLOAD_SIZE   256
#define IPC_MAGIC_HEADER   0x49504347 // "IPCG" binary tracking tag

// Message block container structure
typedef struct {
    uint32_t magic;
    uint32_t sender_pid;
    uint32_t recipient_pid;
    uint32_t data_length;
    uint8_t  encrypted_payload[IPC_PAYLOAD_SIZE];
} IpcMessagePacket;

// IPC Message Channel mapping state block
typedef struct {
    uint32_t         channel_id;
    uint32_t         source_pid;
    uint32_t         dest_pid;
    IpcMessagePacket pending_queue;
    bool             has_message;
    bool             is_locked;
} IpcChannelNode;

typedef struct {
    IpcChannelNode channels[IPC_MAX_CHANNELS];
    uint32_t       total_allocated_channels;
} IpcGateControlRegistry;

// Microkernel System Call Mappings
void init_ipc_gate_subsystem(void);
int32_t open_secure_ipc_channel(uint32_t source_pid, uint32_t dest_pid);
bool sys_ipc_send_secure_message(uint32_t channel_id, uint32_t sender_pid, const uint8_t* clear_data, uint32_t length);
bool sys_ipc_receive_secure_message(uint32_t channel_id, uint32_t recipient_pid, uint8_t* out_clear_buffer, uint32_t max_len);