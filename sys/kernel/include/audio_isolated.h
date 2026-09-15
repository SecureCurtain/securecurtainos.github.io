#pragma once
#include <stdint.h>
#include <stdbool.h>

#define AUDIO_BUFFER_PCM_SIZE  512  // 512-byte raw Pulse Code Modulation audio streaming chunks
#define AUDIO_MAGIC_TAG        0x4155444F // "AUDO" binary hardware registry tag

typedef struct {
    uint32_t magic;
    uint32_t active_recording_pid; // Only this process is allowed to read real microphone data
    uint8_t  hardware_dma_buffer[AUDIO_BUFFER_PCM_SIZE];
    bool     mic_mute_forced;
    bool     is_streaming;
} SecureAudioRegistry;

void init_secure_audio_driver(void);
void set_authorized_audio_recorder(uint32_t pid);
void process_hardware_audio_dma_interrupt(const uint8_t* raw_mic_inputs, uint32_t length);
bool sys_read_microphone_stream(uint32_t calling_pid, uint8_t* out_pcm_buffer, uint32_t max_len);