#pragma once
#include <stdint.h>
#include <stdbool.h>

#define TARPIT_MAGIC_TAG    0x54525054 // "TRPT" binary tracking token
#define TARPIT_MAX_SLOTS    128

typedef struct {
    uint32_t ip_address;
    uint16_t port;
    uint32_t total_stalled_packets;
    uint64_t last_seen_timestamp_ms;
    bool     is_slot_active;
} TarpitTrackerNode;

typedef struct {
    uint32_t          magic;
    TarpitTrackerNode slots[TARPIT_MAX_SLOTS];
    uint32_t          total_active_stalls;
    uint64_t          total_connections_neutralized;
} TarpitControlRegistry;

void init_stateful_tarpit_subsystem(void);
bool sys_tarpit_track_connection(uint32_t ip, uint16_t port);
bool sys_tarpit_evaluate_and_stall_packet(const uint8_t* raw_ip_packet, uint32_t len, uint8_t* out_response_packet, uint32_t* out_len);
