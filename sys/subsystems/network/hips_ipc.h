#pragma once
#include <stdint.h>

#define HIPS_CMD_UPDATE_SIGNATURES 0x701
#define HIPS_CMD_GET_ALERTS         0x702

#define MAX_SIGNATURE_LEN 32
#define MAX_HIPS_RULES    64

// The binary structure for an individual attack payload signature
typedef struct {
    uint32_t signature_id;
    char     pattern[MAX_SIGNATURE_LEN]; // e.g., "MALWARE_PAYLOAD_STRING"
    uint8_t  pattern_len;
    uint32_t severity;                   // 1 = Low, 2 = Medium, 3 = High/Drop
} hips_rule_t;

// Structure for tracking security alerts caught in memory
typedef struct {
    uint64_t timestamp;
    uint32_t src_ip;
    uint32_t signature_id;
    char     matched_payload[MAX_SIGNATURE_LEN];
} hips_alert_t;