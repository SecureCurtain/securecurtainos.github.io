#pragma once
#include <stdint.h>
#include <stddef.h>
#include "ipc.h" // Needed to route audio streams over secure handles

// 🛡️ SECURITY: Standardized AUDIO MIXER IPC Command Identifiers
#define SOUND_CMD_STREAM_PCM     0x1701
#define SOUND_CMD_SET_VOLUME     0x1702
#define SOUND_CMD_MUTE           0x1703

#define AUDIO_BUFFER_MAX_SAMPLES 256  // Enforce a tight, static layout size for active streaming chunks
#define MAX_VOLUME_COEFFICIENT   150  // Hard constraint ceiling: allow up to 150% software amplification

// 🛡️ STRUCTURED AUDIO STREAM REQUEST PACKET
// Encapsulates audio streams safely inside standard ipc_message_t envelopes
typedef struct {
    uint32_t sample_rate;               // Sizing metrics validation target (e.g., 44100 Hz, 48000 Hz)
    uint16_t sample_count;              // Precise constraint threshold: must be <= AUDIO_BUFFER_MAX_SAMPLES
    uint8_t  channels;                  // 1 = Mono, 2 = Stereo
    uint8_t  session_token;             // Token used to authorize master volume modifications
} __attribute__((packed)) sound_ipc_stream_frame_t;

// --- Primary API Entry Points ---

/**
 * Initializes the unprivileged user-space hardware audio rings and mixer trackers.
 */
void init_sound_server(void);

/**
 * 🛡️ SANDBOXED AUDIO MIXER & COERCION ENGINE
 * Executes entirely within the unprivileged user-space 'sound_server.bin' process container.
 * Parses PCM audio waveforms, handles digital amplification, and applies hard-clipping clamps.
 * 
 * @param msg The incoming IPC packet containing raw system/web audio streams or volume settings.
 * @param out_response Output response container to route completion states back to the client.
 */
int handle_sound_message(const ipc_message_t* msg, ipc_message_t* out_response);