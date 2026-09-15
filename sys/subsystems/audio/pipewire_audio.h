#pragma once
#include <stdint.h>
#include <stdbool.h>
#include <stddef.h>

#define PIPEWIRE_MAGIC_TAG        0x50574952 // "PWIR" binary tracking token
#define PIPEWIRE_MAX_NODES        32
#define PIPEWIRE_MAX_PORTS_PER_NODE 8
#define PIPEWIRE_MAX_LINKS        64
#define PIPEWIRE_BUFFER_SAMPLES   512 // 512 samples @ 48kHz = ~10.6ms low-latency buffer quantum
#define PIPEWIRE_SAMPLE_RATE      48000
#define PIPEWIRE_CHANNELS         2 // 16-bit Stereo PCM

// Protocol identifiers matching PipeWire / PulseAudio / ALSA / Win32 WaveOut bridge
typedef enum {
    PW_MEDIA_TYPE_AUDIO = 1,
    PW_MEDIA_TYPE_MIDI,
    PW_MEDIA_TYPE_VIDEO
} PwMediaType;

typedef enum {
    PW_NODE_STATE_IDLE = 0,
    PW_NODE_STATE_SUSPENDED,
    PW_NODE_STATE_RUNNING,
    PW_NODE_STATE_ERROR
} PwNodeState;

typedef enum {
    PW_PORT_DIR_INPUT = 0,
    PW_PORT_DIR_OUTPUT = 1
} PwPortDirection;

// PipeWire Port representation
typedef struct {
    uint32_t        port_id;
    uint32_t        node_id;
    PwPortDirection direction;
    char            name[32];
    int16_t         pcm_staging_buffer[PIPEWIRE_BUFFER_SAMPLES * 2]; // Interleaved L/R
    bool            is_active;
} PwPort;

// PipeWire Node representation (Sound Source / Sink / Filter)
typedef struct {
    uint32_t    node_id;
    char        name[64];
    uint32_t    owner_pid;
    PwMediaType media_type;
    PwNodeState state;
    uint32_t    client_protocol; // 1 = PipeWire Native, 2 = ALSA Bridge, 3 = PulseAudio Bridge, 4 = Win32 WaveOut
    uint32_t    volume_percent;  // 0 - 150%
    bool        is_muted;
    PwPort      ports[PIPEWIRE_MAX_PORTS_PER_NODE];
    uint32_t    num_ports;
} PwNode;

// PipeWire Link binding an output port to an input port
typedef struct {
    uint32_t link_id;
    uint32_t src_node_id;
    uint32_t src_port_id;
    uint32_t dst_node_id;
    uint32_t dst_port_id;
    bool     is_active;
} PwLink;

// Intel HDA Ring Buffer Descriptor
typedef struct {
    uint64_t dma_buffer_phys_addr;
    uint32_t buffer_size_bytes;
    uint32_t cyclic_position;
    bool     stream_running;
} IntelHdaStreamEngine;

// Master PipeWire Audio Server Context
typedef struct {
    uint32_t             magic;
    PwNode               nodes[PIPEWIRE_MAX_NODES];
    uint32_t             total_nodes;
    PwLink               links[PIPEWIRE_MAX_LINKS];
    uint32_t             total_links;
    IntelHdaStreamEngine hda_hardware_sink;
    int32_t              master_mix_bus[PIPEWIRE_BUFFER_SAMPLES * 2]; // 32-bit headroom accumulator
    uint64_t             total_frames_processed;
    uint32_t             underrun_counter;
} PipeWireAudioServerRegistry;

// Primary Subsystem Entry Points
void init_pipewire_audio_server(void);
uint32_t pw_create_audio_node(uint32_t pid, const char* name, uint32_t protocol_type);
bool pw_create_node_link(uint32_t src_node_id, uint32_t dst_node_id);
void pw_submit_pcm_stream_quantum(uint32_t node_id, const int16_t* pcm_data, uint32_t sample_frames);
void pw_process_audio_graph_cycle(void);
void pw_set_node_volume(uint32_t node_id, uint32_t volume_percent);
void pw_get_server_telemetry(uint32_t* active_nodes, uint32_t* active_links, uint64_t* total_frames, uint32_t* underruns);

// Multi-Personality Emulation Bridges
int32_t pw_bridge_win32_waveout_write(uint32_t client_pid, const uint8_t* wave_buffer, uint32_t length);
int32_t pw_bridge_alsa_pcm_writei(uint32_t client_pid, const void* buffer, uint32_t frames);
int32_t pw_bridge_pulseaudio_stream_write(uint32_t client_pid, const uint8_t* data, size_t bytes);
