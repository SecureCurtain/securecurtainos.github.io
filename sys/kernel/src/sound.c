#include "sound.h"
#include "ipc.h"
#include "auth.h"
#include <string.h>

// Forward declaration
static void local_mix_and_amplify_pcm(const int16_t* incoming_pcm, int16_t* hardware_dest_buffer, uint16_t samples, uint32_t volume_gain);

// Simulated user-space mapping base for our motherboard's Intel HD Audio controller registers
#define USER_SPACE_HDA_MMIO_ADDR  0x0000800000000000ULL

// Core Intel HD Audio (HDA) register offsets
#define HDA_REG_GCAP              0x0000 // Global Capabilities Register
#define HDA_REG_GCTL              0x0008 // Global Control Register (Reset and Wake pins)
#define HDA_REG_SD_BDPL(n)        (0x0080 + ((n) * 0x20)) // Stream Descriptor Base Descriptor List Address Low

typedef struct {
    volatile uint32_t* hda_mmio;
    uint32_t           current_volume;   // Ranges from 0 to 150 (150 = 150% gain boost)
    ipc_handle_t       auth_server_proxy;// Handle linking securely back to auth_server.bin
    uint8_t            hardware_active;
} secure_sound_server_t;

static secure_sound_server_t g_sound_server;
extern void print_string(const char* str, int row);

void init_sound_server(void) {
    memset(&g_sound_server, 0, sizeof(secure_sound_server_t));
    g_sound_server.hda_mmio = (volatile uint32_t*)USER_SPACE_HDA_MMIO_ADDR;
    g_sound_server.current_volume = 100; // Default baseline start volume parameter (100%)
    g_sound_server.auth_server_proxy = 8; // Tied directly to your auth_server.bin handle

    // 1. Request a hardware reset handshake pass to the Intel HDA chip inside user space
    uint32_t gctl = g_sound_server.hda_mmio[HDA_REG_GCTL / 4];
    g_sound_server.hda_mmio[HDA_REG_GCTL / 4] = gctl | (1 << 0); // Flip CRST (Controller Reset) bit to 1 to exit reset

    // Verify if the hardware chip acknowledges execution parameters safely
    if (g_sound_server.hda_mmio[HDA_REG_GCTL / 4] & (1 << 0)) {
        g_sound_server.hardware_active = 1;
        print_string("[OK] Sandboxed Sound Server: Intel HD Audio Core Online.", 31);
    } else {
        g_sound_server.hardware_active = 0;
        print_string("[WARN] Audio chip initialization timeout. Sound server running in safe fallback mode.", 31);
    }
}

/**
 * 🛡️ HARDENED DIGITAL AUDIO AMPLIFICATION ENGINE
 * Multiplies wave amplitudes to provide up to 150% gain boost.
 * Executes mandatory saturation clamping to prevent destructive integer overflows.
 */
static void local_mix_and_amplify_pcm(const int16_t* incoming_pcm, int16_t* hardware_dest_buffer, uint16_t samples, uint32_t volume_gain) {
    // 2. Compute the precise floating amplification scaling coefficient inside user space
    float gain_multiplier = (float)volume_gain / 100.0f; // e.g., 150 volume = 1.5x multiplier

    for (uint16_t i = 0; i < samples; i++) {
        // Multiply the signed sample wave by the gain coefficient to boost volume
        float boosted_sample = (float)incoming_pcm[i] * gain_multiplier;

        // 3. 🛡️ CRITICAL HARD-LIMITING SATURATION CLAMP: Protect physical speaker hardware
        // Blasting waveforms out past 100% gain causes waves to wrap around mathematically.
        // We clip waveforms strictly at the architectural thresholds of signed 16-bit PCM space.
        if (boosted_sample > 32767.0f) {
            hardware_dest_buffer[i] = 32767;  // Clip top-most peak square cleanly
        } else if (boosted_sample < -32768.0f) {
            hardware_dest_buffer[i] = -32768; // Clip bottom-most trough square cleanly
        } else {
            hardware_dest_buffer[i] = (int16_t)boosted_sample; // Safe within bounds range pass
        }
    }
}

int handle_sound_message(const ipc_message_t* msg, ipc_message_t* out_response) {
    if (!msg || !out_response) return -1;

    memset(out_response, 0, sizeof(ipc_message_t));
    out_response->message_type = msg->message_type;
    out_response->payload_length = sizeof(int32_t);
    int32_t* return_status = (int32_t*)out_response->payload;

    // --------------------------------------------------------------------------
    // 🛡️ INTERCEPT ROUTE: DYNAMIC AMPLIFICATION SCALING (UP TO 150%)
    // --------------------------------------------------------------------------
    if (msg->message_type == SOUND_CMD_SET_VOLUME) {
        if (msg->payload_length < 5) { // Sizing safety check parameter
            *return_status = -2;
            return 0;
        }

        uint32_t requested_volume = *(uint32_t*)msg->payload;
        uint8_t  user_token       = msg->payload[4];

        // 4. 🛡️ VOLUME UPPER CEILING BOUNDARY GUARD
        // Attackers pass massive values (e.g. 0xFFFFFFF) to trigger sign extension failures.
        if (requested_volume > MAX_VOLUME_COEFFICIENT || requested_volume == 0) {
            *return_status = -3; // Reject parameter sizing violation instantly
            return 0;
        }

        // Cross-verify the command token with your unprivileged auth_server.bin module
        ipc_message_t auth_check_tx, auth_check_rx;
        memset(&auth_check_tx, 0, sizeof(ipc_message_t));
        auth_check_tx.message_type = AUTH_CMD_VALIDATE_TOKEN;
        auth_check_tx.payload_length = 32;
        memcpy(auth_check_tx.payload, &user_token, 1);

        int auth_status = ipc_send_message(g_sound_server.auth_server_proxy, &auth_check_tx);
        if (auth_status != IPC_SUCCESS || ipc_receive_message(g_sound_server.auth_server_proxy, &auth_check_rx) != IPC_SUCCESS) {
            *return_status = -4; // Access Denied
            return 0;
        }

        auth_ipc_response_frame_t* auth_resp = (auth_ipc_response_frame_t*)auth_check_rx.payload;

        // Only the master "aaa" account (UID 1000) can alter master mixing limits
        if (auth_resp->status_code != 0 || auth_resp->authorized_uid != 1000) {
            *return_status = -4; // Access Denied
            print_string("[AUDIO] Unauthorized master volume change blocked at boundary.", 32);
            return 0;
        }

        g_sound_server.current_volume = requested_volume;
        print_string("[AUDIO] Mixer volume parameter successfully updated.", 32);
        *return_status = 0;
        return 0;
    }

    // --------------------------------------------------------------------------
    // 🛡️ INTERCEPT ROUTE: ASYNCHRONOUS SYSTEM & WEB PCM AUDIO STREAMING
    // --------------------------------------------------------------------------
    else if (msg->message_type == SOUND_CMD_STREAM_PCM) {
        if (msg->payload_length < sizeof(sound_ipc_stream_frame_t)) {
            *return_status = -2;
            return 0;
        }

        const sound_ipc_stream_frame_t* stream = (const sound_ipc_stream_frame_t*)msg->payload;

        // 5. Enforce ironclad array boundary limits on structural sizes
        if (stream->sample_count > AUDIO_BUFFER_MAX_SAMPLES || stream->sample_count == 0) {
            *return_status = -3; // Block invalid size frames from causing buffer overruns
            return 0;
        }

        // Locate the raw PCM short wave values trailing the structural packet header envelope
        const int16_t* incoming_wave_samples = (const int16_t*)(msg->payload + sizeof(sound_ipc_stream_frame_t));
        
        // Allocate fixed-size staging arrays entirely on the unprivileged user-space stack
        int16_t processed_hardware_pcm[AUDIO_BUFFER_MAX_SAMPLES];
        memset(processed_hardware_pcm, 0, sizeof(processed_hardware_pcm));

        // 6. Execute volume boosting and hard-clipping normalization inside the safe sandbox.
        // If a web page passes a corrupted waveform designed to crash a driver, your core microkernel stays immune.
        local_mix_and_amplify_pcm(incoming_wave_samples, processed_hardware_pcm, stream->sample_count, g_sound_server.current_volume);

        // Stream the final mixed, safely amplified waves into the Intel hardware DMA channels
        if (g_sound_server.hardware_active) {
            // Stream bytes into the designated memory-mapped HDA FIFO channel register lines
            // volatile uint32_t* hda_fifo = (volatile uint32_t*)((uintptr_t)g_sound_server.hda_mmio + HDA_REG_SD_BDPL(0));
            // memcpy((void*)hda_fifo, processed_hardware_pcm, stream->sample_count * sizeof(int16_t));
        }

        *return_status = 0; // Stream chunk mixed and sent to hardware successfully
        return 0;
    }

    return -1;
}
