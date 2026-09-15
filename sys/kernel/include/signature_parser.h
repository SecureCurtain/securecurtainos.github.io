#pragma once
#include <stdint.h>
#include <stdbool.h>

#define MAX_SIGNATURE_RULE_LEN 128
#define MAX_YAML_RULES_STORED  32
#define SIGNATURE_MAGIC_TAG    0x59414D4C // "YAML" binary tracking tag

typedef enum {
    SIG_TYPE_NETWORK_FIREWALL = 1, // Mapped to fw_injector / tarpit rules
    SIG_TYPE_HOST_IPS,             // Mapped to sandbox_watchdog heuristic constraints
    SIG_TYPE_MALWARE_YARA_POLY     // Mapped to malware_scanner binary block patterns
} SignatureRuleType;

typedef struct {
    uint32_t rule_id;
    uint8_t  rule_type;            // Maps to SignatureRuleType
    char     rule_name[32];
    char     payload_pattern[64];  // Hex block signature strings, target ports, or alert keys
    uint32_t action_modifier;      // 1=DROP, 2=TARPIT_STALL, 3=EVICT_PROCESS
    bool     is_active;
} DecodedYamlRuleNode;

typedef struct {
    uint32_t            magic;
    DecodedYamlRuleNode parsed_rules[MAX_YAML_RULES_STORED];
    uint32_t            total_ingested_rules;
    bool                strict_compliance_active;
} YamlSignatureRegistry;

void init_yaml_signature_parser(void);
bool sys_ingest_raw_yaml_stream(const char* raw_yaml_buffer, uint32_t buffer_len);
bool sys_evaluate_network_signature(uint32_t dest_port, const uint8_t* payload, uint32_t len);
bool sys_evaluate_malware_signature(const uint8_t* binary_buffer, uint32_t len);
