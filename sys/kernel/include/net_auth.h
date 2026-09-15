#pragma once
#include <stdint.h>
#include <stdbool.h>

#define NET_AUTH_MAGIC_TAG    0x4E415448 // "NATH" binary tracking tag
#define MAX_TICKET_SIZE       1024
#define MAX_SID_GROUPS        8

// Representation of an Active Directory user token payload
typedef struct {
    char     user_principal_name[64]; // e.g., "alice@corp.prototype.internal"
    uint32_t primary_user_sid;
    uint32_t group_sids[MAX_SID_GROUPS];
    uint32_t group_count;
    uint64_t ticket_expiration_timestamp;
} EnterpriseUserToken;

typedef struct {
    uint32_t            magic;
    EnterpriseUserToken current_network_session;
    bool                is_network_auth_active;
    uint32_t            ad_public_key_slot; // References the Secure Key Ring
} NetAuthRegistry;

// Microkernel Core Enterprise Authentication Mappings
void init_network_authentication_subsystem(uint32_t keyring_public_key_slot);
bool sys_authenticate_network_user(uint32_t pid, const uint8_t* raw_kerberos_ticket, uint32_t ticket_len);
void sys_terminate_network_auth_session(uint32_t pid);