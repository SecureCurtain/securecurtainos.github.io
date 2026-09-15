#include "signature_parser.h"
#include "fw_injector.h"
#include "security_audit.h"
#include <stdio.h>

static FirewallBlockRule g_blocked_ip_table[MAX_BLOCKED_IPS];
static uint32_t         g_total_blocked_rules = 0;

extern uint64_t get_system_uptime_ms(void);

void init_firewall_injector(void) {
    g_total_blocked_rules = 0;
    for (uint32_t i = 0; i < MAX_BLOCKED_IPS; i++) {
        g_blocked_ip_table[i].is_active = false;
    }
}

void inject_firewall_block_rule(uint32_t offending_ip) {
    // Check if the IP is already blocked to prevent rule duplication
    for (uint32_t i = 0; i < g_total_blocked_rules; i++) {
        if (g_blocked_ip_table[i].is_active && g_blocked_ip_table[i].ipv4_address == offending_ip) {
            return; 
        }
    }

    if (g_total_blocked_rules >= MAX_BLOCKED_IPS) {
        printf("[Firewall Engine]: Table limit reached. Dropping oldest rules first.\\n");
        g_total_blocked_rules = 0; // Simple ring buffer override
    }

    FirewallBlockRule* rule = &g_blocked_ip_table[g_total_blocked_rules];
    rule->ipv4_address = offending_ip;
    rule->insertion_tick = get_system_uptime_ms();
    rule->is_active = true;

    g_total_blocked_rules++;

    unsigned char bytes[4];
    bytes[0] = offending_ip & 0xFF;
    bytes[1] = (offending_ip >> 8) & 0xFF;
    bytes[2] = (offending_ip >> 16) & 0xFF;
    bytes[3] = (offending_ip >> 24) & 0xFF;
    
    printf("[Firewall Engine]: INJECTED HARD BLOCK RULE -> Isolated IP: %d.%d.%d.%d\\n", bytes[0], bytes[1], bytes[2], bytes[3]);
}

bool evaluate_packet_against_blocklist(uint32_t source_ip) {
    for (uint32_t i = 0; i < g_total_blocked_rules; i++) {
        if (g_blocked_ip_table[i].is_active && g_blocked_ip_table[i].ipv4_address == source_ip) {
            return true; // Match found: Packet must be dropped immediately
        }
    }
    return false; // Safe to pass to higher subsystem stacks
}

bool sys_evaluate_inbound_firewall_frame(uint16_t d_port, const uint8_t* data_stream, uint32_t len) {
    if (!sys_evaluate_network_signature((uint32_t)d_port, data_stream, len)) {
        return false;
    }
    return true;
}
