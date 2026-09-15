#include "pipewire_audio.h"
#include "../../kernel/include/kstring.h"
#include "../../kernel/include/security_audit.h"
#include <stdio.h>

static PipeWireAudioServerRegistry g_pw_server;

extern uint64_t get_system_uptime_ms(void);

static inline int16_t clamp_pcm16(int32_t val) {
    if (val > 32767)  return 32767;
    if (val < -32768) return -32768;
    return (int16_t)val;
}

void init_pipewire_audio_server(void) {
    kmemset(&g_pw_server, 0, sizeof(PipeWireAudioServerRegistry));
    g_pw_server.magic = PIPEWIRE_MAGIC_TAG;
    g_pw_server.total_nodes = 0;
    g_pw_server.total_links = 0;
    
    // Seed Hardware Sink Master Output Node
    uint32_t master_sink_id = pw_create_audio_node(0, "alsa_output.pci-0000_00_1b.0.analog-stereo", 1);
    if (master_sink_id < PIPEWIRE_MAX_NODES) {
        g_pw_server.nodes[master_sink_id].state = PW_NODE_STATE_RUNNING;
        g_pw_server.nodes[master_sink_id].volume_percent = 100;
    }

    g_pw_server.hda_hardware_sink.buffer_size_bytes = PIPEWIRE_BUFFER_SAMPLES * 4;
    g_pw_server.hda_hardware_sink.stream_running = true;

    printf("[PipeWire Core]: Low-latency audio processing graph initialized (48kHz/16-bit/Stereo, 512-sample quantum).\\n");
    commit_security_audit_entry(0x0005, "PIPEWIRE_AUDIO", "PipeWire Sound Server & Intel HDA DMA Ring Online");
}

uint32_t pw_create_audio_node(uint32_t pid, const char* name, uint32_t protocol_type) {
    if (g_pw_server.total_nodes >= PIPEWIRE_MAX_NODES) return 0xFFFFFFFF;

    uint32_t node_idx = g_pw_server.total_nodes++;
    PwNode* node = &g_pw_server.nodes[node_idx];
    node->node_id = node_idx + 1;
    node->owner_pid = pid;
    node->media_type = PW_MEDIA_TYPE_AUDIO;
    node->state = PW_NODE_STATE_IDLE;
    node->client_protocol = protocol_type;
    node->volume_percent = 100;
    node->is_muted = false;
    kstrcpy(node->name, name ? name : "unnamed_audio_stream");

    node->num_ports = 2;
    node->ports[0].port_id = 1;
    node->ports[0].node_id = node->node_id;
    node->ports[0].direction = PW_PORT_DIR_OUTPUT;
    kstrcpy(node->ports[0].name, "playback_FL");
    node->ports[0].is_active = true;

    node->ports[1].port_id = 2;
    node->ports[1].node_id = node->node_id;
    node->ports[1].direction = PW_PORT_DIR_OUTPUT;
    kstrcpy(node->ports[1].name, "playback_FR");
    node->ports[1].is_active = true;

    if (node_idx > 0) {
        pw_create_node_link(node->node_id, 1);
    }

    printf("[PipeWire Node]: Registered Node #%u '%s' (PID %u, Proto %u)\\n", node->node_id, node->name, pid, protocol_type);
    return node_idx;
}

bool pw_create_node_link(uint32_t src_node_id, uint32_t dst_node_id) {
    if (g_pw_server.total_links >= PIPEWIRE_MAX_LINKS) return false;
    if (src_node_id == 0 || src_node_id > g_pw_server.total_nodes) return false;
    if (dst_node_id == 0 || dst_node_id > g_pw_server.total_nodes) return false;

    uint32_t link_idx = g_pw_server.total_links++;
    PwLink* link = &g_pw_server.links[link_idx];
    link->link_id = link_idx + 1;
    link->src_node_id = src_node_id;
    link->src_port_id = 1;
    link->dst_node_id = dst_node_id;
    link->dst_port_id = 1;
    link->is_active = true;

    printf("[PipeWire Link]: Bound Node %u -> Node %u (Link #%u)\\n", src_node_id, dst_node_id, link->link_id);
    return true;
}

// 🛡️ HARDENED QUANTUM BUFFER VALIDATOR
void pw_submit_pcm_stream_quantum(uint32_t node_id, const int16_t* pcm_data, uint32_t sample_frames) {
    if (!pcm_data || node_id == 0 || node_id > g_pw_server.total_nodes) return;
    
    PwNode* node = &g_pw_server.nodes[node_id - 1];
    node->state = PW_NODE_STATE_RUNNING;
    
    uint32_t count = (sample_frames > PIPEWIRE_BUFFER_SAMPLES) ? PIPEWIRE_BUFFER_SAMPLES : sample_frames;
    uint32_t total_samples = count * 2; // 2 channels

    for (uint32_t i = 0; i < total_samples; i++) {
        if (node->is_muted) {
            node->ports[0].pcm_staging_buffer[i] = 0;
        } else {
            int32_t scaled = ((int32_t)pcm_data[i] * (int32_t)node->volume_percent) / 100;
            node->ports[0].pcm_staging_buffer[i] = clamp_pcm16(scaled);
        }
    }
}

void pw_process_audio_graph_cycle(void) {
    kmemset(g_pw_server.master_mix_bus, 0, sizeof(g_pw_server.master_mix_bus));

    for (uint32_t l = 0; l < g_pw_server.total_links; l++) {
        PwLink* link = &g_pw_server.links[l];
        if (!link->is_active) continue;

        uint32_t src_idx = link->src_node_id - 1;
        if (src_idx >= g_pw_server.total_nodes) continue;
        PwNode* src_node = &g_pw_server.nodes[src_idx];

        if (src_node->state == PW_NODE_STATE_RUNNING) {
            for (uint32_t s = 0; s < PIPEWIRE_BUFFER_SAMPLES * 2; s++) {
                g_pw_server.master_mix_bus[s] += src_node->ports[0].pcm_staging_buffer[s];
            }
        }
    }

    g_pw_server.total_frames_processed += PIPEWIRE_BUFFER_SAMPLES;
}

void pw_set_node_volume(uint32_t node_id, uint32_t volume_percent) {
    if (node_id == 0 || node_id > g_pw_server.total_nodes) return;
    g_pw_server.nodes[node_id - 1].volume_percent = (volume_percent > 150) ? 150 : volume_percent;
}

void pw_get_server_telemetry(uint32_t* active_nodes, uint32_t* active_links, uint64_t* total_frames, uint32_t* underruns) {
    if (active_nodes) *active_nodes = g_pw_server.total_nodes;
    if (active_links) *active_links = g_pw_server.total_links;
    if (total_frames) *total_frames = g_pw_server.total_frames_processed;
    if (underruns)    *underruns    = g_pw_server.underrun_counter;
}

// Multi-Personality Emulation Bridges
int32_t pw_bridge_win32_waveout_write(uint32_t client_pid, const uint8_t* wave_buffer, uint32_t length) {
    if (!wave_buffer || length < 4 || length > 65536) return 0;
    
    uint32_t target_node_id = 0;
    for (uint32_t i = 0; i < g_pw_server.total_nodes; i++) {
        if (g_pw_server.nodes[i].owner_pid == client_pid && g_pw_server.nodes[i].client_protocol == 4) {
            target_node_id = g_pw_server.nodes[i].node_id;
            break;
        }
    }
    if (target_node_id == 0) {
        char node_name[48];
        ksnprintf(node_name, sizeof(node_name), "win32_waveout_app_pid_%u", client_pid);
        uint32_t idx = pw_create_audio_node(client_pid, node_name, 4);
        if (idx < PIPEWIRE_MAX_NODES) target_node_id = g_pw_server.nodes[idx].node_id;
    }

    uint32_t frames = (length / 4);
    pw_submit_pcm_stream_quantum(target_node_id, (const int16_t*)wave_buffer, frames);
    return (int32_t)length;
}

int32_t pw_bridge_alsa_pcm_writei(uint32_t client_pid, const void* buffer, uint32_t frames) {
    return pw_bridge_win32_waveout_write(client_pid, (const uint8_t*)buffer, frames * 4);
}

int32_t pw_bridge_pulseaudio_stream_write(uint32_t client_pid, const uint8_t* data, size_t bytes) {
    return pw_bridge_win32_waveout_write(client_pid, data, (uint32_t)bytes);
}
