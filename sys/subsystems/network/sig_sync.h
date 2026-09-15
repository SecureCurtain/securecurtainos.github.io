#pragma once
#include <stdint.h>
#include <stdbool.h>

#define SIG_SYNC_MAGIC_TAG   0x53535943 // "SSYC" binary tracking token
#define SYNC_MAX_URL_LEN     128
#define INGESTION_BUF_SIZE   8192

typedef enum {
    FEED_ET_OPEN_SURICATA = 1,
    FEED_WAZUH_HIPS_XML,
    FEED_CLAMAV_CVD_HASHES
} ThreatIntelFeedType;

typedef struct {
    uint32_t feed_id;
    uint8_t  feed_type; // Maps to ThreatIntelFeedType
    char     remote_mirror_url[SYNC_MAX_URL_LEN];
    uint64_t last_synchronized_timestamp_ms;
    uint32_t accumulated_records_ingested;
    bool     is_sync_active;
} ThreatFeedNode;

typedef struct {
    uint32_t       magic;
    ThreatFeedNode feeds[3]; // Track our three industry-standard pipelines
    uint64_t       rolling_timer_ms;
    uint32_t       network_passkey_auth;
    bool           strict_signature_verification;
} PolicySyncRegistry;

void init_automated_policy_synchronizer(void);
void run_policy_synchronizer_daemon_loop(void);
bool execute_mbedtls_feed_fetch(uint32_t feed_idx);
void sys_parse_and_inject_to_kernel(uint8_t type, const char* raw_buffer, uint32_t len);
