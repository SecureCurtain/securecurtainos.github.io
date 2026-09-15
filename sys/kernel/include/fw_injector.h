#pragma once
#include <stdint.h>
#include <stdbool.h>

#define MAX_BLOCKED_IPS 128

typedef struct {
    uint32_t ipv4_address; // Network byte order representation
    uint64_t insertion_tick;
    bool     is_active;
} FirewallBlockRule;

void init_firewall_injector(void);
void inject_firewall_block_rule(uint32_t offending_ip);
bool evaluate_packet_against_blocklist(uint32_t source_ip);