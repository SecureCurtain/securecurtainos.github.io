#pragma once
#include <stdint.h>
#include <stdbool.h>

#define CAP_NET_NONE     0x00000000
#define CAP_NET_AUDIT    0x00000001
#define CAP_NET_BIND     0x00000002
#define CAP_NET_RAW      0x00000004
#define CAP_NET_ADMIN    0x00000008

uint64_t sys_issue_network_passkey_capability(uint32_t pid, uint32_t capabilities);
uint64_t sys_request_network_access_passkey(uint32_t calling_pid);
bool     sys_verify_network_passkey_capability(uint32_t pid, uint64_t passkey_token, uint32_t required_cap);
bool     sys_revoke_network_passkey_capability(uint32_t pid);
