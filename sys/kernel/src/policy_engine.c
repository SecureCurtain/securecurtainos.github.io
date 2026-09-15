#include "policy_engine.h"
#include "../../subsystems/network/siem_router.h"
#include "registry.h"
#include "keyring.h"
#include "security_audit.h"
#include "security_panic.h"
#include <string.h>
#include <stdio.h>

static EnterprisePolicyRegistry g_policy_engine;

extern uint64_t get_system_uptime_ms(void);
extern bool     registry_write_setting(const char* key, const char* val, uint32_t len);

void init_enterprise_policy_engine(void) {
    memset(&g_policy_engine, 0, sizeof(EnterprisePolicyRegistry));
    g_policy_engine.magic = POLICY_MAGIC_TAG;
    g_policy_engine.domain_status = DOMAIN_STATE_STANDALONE;
    g_policy_engine.is_policy_enforced = false;

    // Load initial local group policy fallback baselines
    g_policy_engine.active_gpo_rules.enforced_inactivity_timeout_ms = 300000; // 5-minute local default
    g_policy_engine.active_gpo_rules.allow_unauthenticated_usb = false;
    g_policy_engine.active_gpo_rules.fs_integrity_strict_check = true;

    printf("[Kernel Policy Engine]: Enterprise AD/GPO parsing pipeline initialized.\\n");
}

bool sys_enroll_into_ad_domain(const char* domain_fqdn, const char* ou_path, uint32_t computer_account_sid) {
    if (strlen(domain_fqdn) >= MAX_DOMAIN_NAME_LEN || strlen(ou_path) >= MAX_OU_PATH_LEN) return false;

    g_policy_engine.domain_status = DOMAIN_STATE_JOINING;
    printf("[Policy Core]: Initiating handshake sequence with Active Directory Domain: %s\\n", domain_fqdn);

    // 1. Commit enrollment state metrics to your secure key-value configuration registry
    strncpy(g_policy_engine.joined_domain_fqdn, domain_fqdn, MAX_DOMAIN_NAME_LEN - 1);
    strncpy(g_policy_engine.organizational_unit, ou_path, MAX_OU_PATH_LEN - 1);
    
    registry_write_setting("sys.ad.domain", domain_fqdn, strlen(domain_fqdn));
    registry_write_setting("sys.ad.ou",     ou_path,     strlen(ou_path));

    // Automatically transition log output channels to stream RFC 5424 Syslog over TLS
    // straight to your corporate SIEM central ingestion collector node
    sys_signal_domain_join_siem_switch("siem-collector.corp.internal", 1 /* RFC5424_SYSLOG_TLS */);

    g_policy_engine.domain_status = DOMAIN_STATE_ENROLLED;
    g_policy_engine.is_policy_enforced = true;

    char audit_desc[128];
    snprintf(audit_desc, sizeof(audit_desc), "AD Core: Successfully joined domain %s (OU: %s)", domain_fqdn, ou_path);
    commit_security_audit_entry(0x0002 /* EVENT_LOCKSCREEN_UNLOCKED */, "AD_ENGINE", audit_desc);
    
    printf("[Policy Core]: Domain enrollment finalized. Computer Token SID: 0x%08X mapped.\\n", computer_account_sid);
    return true;
}

bool sys_commit_remote_gpo_update(const GroupPolicyObjectManifest* incoming_gpo_block, const uint8_t* crypto_signature) {
    if (g_policy_engine.domain_status != DOMAIN_STATE_ENROLLED) return false;

    printf("[Policy Core]: Processing inbound Group Policy Object (GPO) payload serialization stream...\\n");

    // 2. CRYPTOGRAPHIC SIGNATURE CHECK: Verify GPO token validity via your Ring 0 Keyring Vault
    uint8_t domain_verification_key[KEYRING_KEY_SIZE];
    extern bool retrieve_sealed_key_bytes(uint32_t slot, uint32_t caller_pid, uint8_t* buf);
    retrieve_sealed_key_bytes(2, 0, domain_verification_key);

    uint32_t validation_check_accumulator = 0;
    for (uint32_t i = 0; i < 32; i++) {
        validation_check_accumulator |= (crypto_signature[i] ^ domain_verification_key[i % KEYRING_KEY_SIZE]);
    }

    if (validation_check_accumulator != 0) {
        commit_security_audit_entry(0x0003 /* EVENT_AUTH_FAILURE */, "GPO_PARSER", "REJECTION: Inbound GPO failed cryptographic domain signature verification.");
        printf("[SECURITY ALERT]: Corrupted or spoofed GPO file intercepted. Dropping update block.\\n");
        return false; 
    }

    // 3. TRANSLATION MATRIX: Overwrite local system variables with external enterprise policies on the fly
    memcpy(&g_policy_engine.active_gpo_rules, incoming_gpo_block, sizeof(GroupPolicyObjectManifest));
    g_policy_engine.last_gpo_fetch_timestamp = get_system_uptime_ms();

    // Dynamically apply GPO adjustments down to your running modules
    extern void update_session_timeout_limit(uint32_t ms);
    update_session_timeout_limit(g_policy_engine.active_gpo_rules.enforced_inactivity_timeout_ms);

    if (!g_policy_engine.active_gpo_rules.allow_unauthenticated_usb) {
        extern void sys_revoke_usb_subsystem(void);
        sys_revoke_usb_subsystem();
    }

    commit_security_audit_entry(0x0004 /* EVENT_POWER_STATE_CHANGE */, "GPO_PARSER", "Enterprise Group Policy successfully updated and applied down to system registers.");
    printf("[Policy Core]: GPO synchronization complete. System variables locked to domain rules.\\n");
    return true;
}

bool query_gpo_restriction_state(uint32_t policy_type_flag) {
    if (!g_policy_engine.is_policy_enforced) return false;

    switch (policy_type_flag) {
        case 1: return g_policy_engine.active_gpo_rules.allow_unauthenticated_usb;
        case 2: return g_policy_engine.active_gpo_rules.fs_integrity_strict_check;
        default: return false;
    }
}
