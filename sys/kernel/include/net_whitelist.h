#pragma once
#include <stdint.h>
#include <stdbool.h>

#define MAX_WHITELIST_ENTRIES 32
#define WHITELIST_MAGIC_TAG   0x574C5354 // "WLST" binary tracking tag

typedef struct {
    uint32_t ipv4_address;
    char     node_description[32];
    uint64_t authorized_timestamp;
    bool     is_active;
} WhitelistEntryNode;

typedef struct {
    uint32_t           magic;
    WhitelistEntryNode entries[MAX_WHITELIST_ENTRIES];
    uint32_t           total_entries;
    bool               strict_bypass_active;
} SecureWhitelistRegistry;

void init_network_whitelist_subsystem(void);
bool sys_register_whitelisted_ip(uint32_t calling_pid, uint32_t ip, const char* desc);
bool verify_is_ip_whitelisted(uint32_t incoming_ip);
bool verify_is_ip_whitelisted_secure(uint32_t incoming_ip, uint64_t hardware_token_signature);