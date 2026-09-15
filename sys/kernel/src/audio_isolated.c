#include "audio_isolated.h"
#include "mouse_tracker.h"
#include "sandbox.h"
#include "security_audit.h"
#include <string.h>
#include <stdio.h>

static SecureAudioRegistry g_audio_subsystem;

// External stub pulling the active focused application context from your mouse collision map
extern uint32_t query_active_focused_window_pid(void);

void init_secure_audio_driver(void) {
    memset(&g_audio_subsystem, 0, sizeof(SecureAudioRegistry));
    g_audio_subsystem.magic = AUDIO_MAGIC_TAG;
    g_audio_subsystem.active_recording_pid = 0; // Default to isolated core kernel
    g_audio_subsystem.mic_mute_forced = false;
    g_audio_subsystem.is_streaming = true;

    printf("[Kernel Audio]: Hardware mic line isolation shield fully armed.\\n");
}

void set_authorized_audio_recorder(uint32_t pid) {
    g_audio_subsystem.active_recording_pid = pid;
    printf("[Kernel Audio]: Exclusive recording clearance passed to PID %d\\n", pid);
}

void process_hardware_audio_dma_interrupt(const uint8_t* raw_mic_inputs, uint32_t length) {
    if (!g_audio_subsystem.is_streaming) return;

    uint32_t copy_len = (length > AUDIO_BUFFER_PCM_SIZE) ? AUDIO_BUFFER_PCM_SIZE : length;
    
    // Copy incoming plaintext physical audio samples directly into Ring 0 DMA storage caching area
    memcpy(g_audio_subsystem.hardware_dma_buffer, raw_mic_inputs, copy_len);
}

bool sys_read_microphone_stream(uint32_t calling_pid, uint8_t* out_pcm_buffer, uint32_t max_len) {
    uint32_t bytes_to_copy = (max_len > AUDIO_BUFFER_PCM_SIZE) ? AUDIO_BUFFER_PCM_SIZE : max_len;

    // Verify sandbox write clearance coordinates on destination buffer parameters first
    if (!validate_memory_access_bounds(calling_pid, (uint64_t)out_pcm_buffer, bytes_to_copy, true)) {
        return false;
    }

    // Dynamic focus validation sync step: pull focus from your secure mouse tracker
    uint32_t current_ui_focus_pid = query_active_focused_window_pid();

    // PRIVILEGE AND ISOLATION BARRIER: Block background audio scraping
    // Access is strictly blocked if:
    // 1. The application calling the microphone does not match the active recording privilege slot.
    // 2. The process has been moved into the background (lost user focus).
    if (calling_pid != g_audio_subsystem.active_recording_pid || calling_pid != current_ui_focus_pid) {
        
        // Zero-fill the caller's target buffer completely to return absolute silence
        memset(out_pcm_buffer, 0, bytes_to_copy);
        
        // Generate a subtle warning flag tracking background interception behavior
        static uint32_t rate_limit_log = 0;
        if (rate_limit_log++ % 100 == 0) {
            char warning_desc[128];
            snprintf(warning_desc, sizeof(warning_desc), "Background Mic Scrape Blocked: Process PID %d denied data feed access.", calling_pid);
            commit_security_audit_entry(EVENT_AUTH_FAILURE, "AUDIO_SHIELD", warning_desc);
            printf("[SECURITY ALERT]: %s\\n", warning_desc);
        }
        return true; 
    }

    // Authorization verified: deliver physical audio samples from the secure cache ring
    memcpy(out_pcm_buffer, g_audio_subsystem.hardware_dma_buffer, bytes_to_copy);
    return true;
}
