#pragma once
#include <stdint.h>
#include <stdbool.h>

#define POLICY_MAGIC_TAG     0x41444750 // "ADGP" binary tracking tag
#define MAX_DOMAIN_NAME_LEN  64
#define MAX_OU_PATH_LEN      128

typedef enum {
    DOMAIN_STATE_STANDALONE = 0,
    DOMAIN_STATE_JOINING,
    DOMAIN_STATE_ENROLLED,
    DOMAIN_STATE_DISCONNECTED
} ActiveDirectoryState;

// Structural container tracking live enterprise Group Policy metrics
typedef struct {
    uint32_t enforced_inactivity_timeout_ms;
    bool     allow_unauthenticated_usb;
    uint32_t rbac_superadmin_sid_mapping; // Links AD Group Security IDs to native rbac.c roles
    uint32_t rbac_netadmin_sid_mapping;
    bool     fs_integrity_strict_check;
} GroupPolicyObjectManifest;

typedef struct {
    uint32_t                  magic;
    ActiveDirectoryState     domain_status;
    char                      joined_domain_fqdn[MAX_DOMAIN_NAME_LEN];
    char                      organizational_unit[MAX_OU_PATH_LEN];
    GroupPolicyObjectManifest active_gpo_rules;
    uint64_t                  last_gpo_fetch_timestamp;
    bool                      is_policy_enforced;
} EnterprisePolicyRegistry;

// Microkernel Enterprise Mapping Core Primitives
void init_enterprise_policy_engine(void);
bool sys_enroll_into_ad_domain(const char* domain_fqdn, const char* ou_path, uint32_t computer_account_sid);
bool sys_commit_remote_gpo_update(const GroupPolicyObjectManifest* incoming_gpo_block, const uint8_t* crypto_signature);
bool query_gpo_restriction_state(uint32_t policy_type_flag);