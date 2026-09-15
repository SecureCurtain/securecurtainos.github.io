#include "ipc_gate.h"
#include "sandbox_watchdog.h"
#include "sandbox.h"
#include "pm_core.h"
#include <string.h>
#include <stdio.h>

static IpcGateControlRegistry g_ipc_gate;

extern SwapCryptoContext g_hibernation_crypto;

// Generate process-specific cryptographic streams to isolate message footprints inline
static void ipc_crypto_transform(uint32_t pid_seed, const uint8_t* input, uint8_t* output, uint32_t length) {
    for (uint32_t i = 0; i < length; i++) {
        // Compound the core transient kernel key with localized application PIDs
        uint8_t seed_byte = (uint8_t)((pid_seed >> (i % 4 * 8)) & 0xFF);
        uint8_t master_key_byte = g_hibernation_crypto.key_buffer[i % SWAP_ENCRYPTION_KEY_SIZE];
        
        output[i] = input[i] ^ master_key_byte ^ seed_byte;
    }
}

void init_ipc_gate_subsystem(void) {
    memset(&g_ipc_gate, 0, sizeof(IpcGateControlRegistry));
    g_ipc_gate.total_allocated_channels = 0;
    printf("[Kernel IPC Gate]: Cross-sandbox transactional routing matrix operational.\\n");
}

int32_t open_secure_ipc_channel(uint32_t source_pid, uint32_t dest_pid) {
    if (g_ipc_gate.total_allocated_channels >= IPC_MAX_CHANNELS) return -1;

    uint32_t channel_idx = g_ipc_gate.total_allocated_channels;
    IpcChannelNode* chan = &g_ipc_gate.channels[channel_idx];

    chan->channel_id = channel_idx + 500; // Unique secure channel tracking ID descriptor
    chan->source_pid = source_pid;
    chan->dest_pid = dest_pid;
    chan->has_message = false;
    chan->is_locked = false;

    g_ipc_gate.total_allocated_channels++;
    printf("[Kernel IPC]: Opened secure communication gate channel %d (%d -> %d)\\n", chan->channel_id, source_pid, dest_pid);
    return (int32_t)chan->channel_id;
}

bool sys_ipc_send_secure_message(uint32_t channel_id, uint32_t sender_pid, const uint8_t* clear_data, uint32_t length) {
    if (length > IPC_PAYLOAD_SIZE) return false;

    if (!sys_watchdog_log_ipc_transaction(sender_pid)) {
        return false;
    }

    for (uint32_t i = 0; i < g_ipc_gate.total_allocated_channels; i++) {
        IpcChannelNode* chan = &g_ipc_gate.channels[i];

        if (chan->channel_id == channel_id && chan->source_pid == sender_pid) {
            if (chan->has_message || chan->is_locked) return false; // Channel pipeline is busy

            chan->is_locked = true;

            IpcMessagePacket* packet = &chan->pending_queue;
            packet->magic = IPC_MAGIC_HEADER;
            packet->sender_pid = sender_pid;
            packet->recipient_pid = chan->dest_pid;
            packet->data_length = length;

            // Enforce sandbox verification checks on the sender memory footprint segment
            if (!validate_memory_access_bounds(sender_pid, (uint64_t)clear_data, length, false)) {
                chan->is_locked = false;
                return false; // Access violation abort
            }

            // Encrypt and stage the plaintext payload directly inside our Ring 0 cache boundary
            ipc_crypto_transform(sender_pid ^ chan->dest_pid, clear_data, packet->encrypted_payload, length);

            chan->has_message = true;
            chan->is_locked = false;
            return true;
        }
    }
    return false; // Unauthorized sender or dead link channel allocation mapping
}

bool sys_ipc_receive_secure_message(uint32_t channel_id, uint32_t recipient_pid, uint8_t* out_clear_buffer, uint32_t max_len) {
    for (uint32_t i = 0; i < g_ipc_gate.total_allocated_channels; i++) {
        IpcChannelNode* chan = &g_ipc_gate.channels[i];

        if (chan->channel_id == channel_id && chan->dest_pid == recipient_pid) {
            if (!chan->has_message || chan->is_locked) return false; // Queue empty or blocked

            chan->is_locked = true;

            IpcMessagePacket* packet = &chan->pending_queue;
            if (packet->magic != IPC_MAGIC_HEADER) {
                chan->is_locked = false;
                return false; // Corrupted packet validation structure
            }

            // Enforce sandbox write clearance checks on the recipient target space layout
            if (!validate_memory_access_bounds(recipient_pid, (uint64_t)out_clear_buffer, packet->data_length, true)) {
                chan->is_locked = false;
                return false;
            }

            uint32_t bytes_to_copy = (packet->data_length > max_len) ? max_len : packet->data_length;

            // Decrypt the raw stored database payload straight out of kernel cache into app space
            ipc_crypto_transform(packet->sender_pid ^ recipient_pid, packet->encrypted_payload, out_clear_buffer, bytes_to_copy);

            // Flush queue states cleanly
            memset(packet, 0, sizeof(IpcMessagePacket));
            chan->has_message = false;
            chan->is_locked = false;
            return true;
        }
    }
    return false; // Unauthorized receiver access query
}
