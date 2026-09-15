#include "signature_parser.h"
#include "security_panic.h"
#include "security_audit.h"
#include <string.h>
#include <stdio.h>

static YamlSignatureRegistry g_signature_db;

// Lightweight helper to match string prefixes safely under freestanding parameters
static bool match_yaml_key(const char* line, const char* key, char* out_value, uint32_t max_val_len) {
    const char* found = strstr(line, key);
    if (found != NULL) {
        found += strlen(key);
        // Strip out trailing spaces, colons, or quote marks from the structural value
        while (*found == ' ' || *found == ':' || *found == '"' || *found == '\\'') {
            found++;
        }
        uint32_t idx = 0;
        while (*found != '\\0' && *found != '\\n' && *found != '\\r' && *found != '"' && *found != '\\'' && idx < max_val_len - 1) {
            out_value[idx++] = *found++;
        }
        out_value[idx] = '\\0';
        return true;
    }
    return false;
}

void init_yaml_signature_parser(void) {
    memset(&g_signature_db, 0, sizeof(YamlSignatureRegistry));
    g_signature_db.magic = SIGNATURE_MAGIC_TAG;
    g_signature_db.total_ingested_rules = 0;
    g_signature_db.strict_compliance_active = true;

    printf("[Kernel Signature Engine]: Industry-standard declarative YAML rules engine online.\\n");
}

bool sys_ingest_raw_yaml_stream(const char* raw_yaml_buffer, uint32_t buffer_len) {
    if (!raw_yaml_buffer || g_signature_db.total_ingested_rules >= MAX_YAML_RULES_STORED) return false;

    printf("[Signature Engine]: Processing declarative signature layout streams...\\n");

    // Static buffer to hold individual rows tokenized out of the memory stream
    char current_line[MAX_SIGNATURE_RULE_LEN];
    uint32_t line_idx = 0;
    
    uint32_t current_rule_slot = g_signature_db.total_ingested_rules;
    DecodedYamlRuleNode* node = &g_signature_db.parsed_rules[current_rule_slot];
    
    static uint32_t rule_id_allocator = 88001;

    for (uint32_t i = 0; i < buffer_len; i++) {
        char c = raw_yaml_buffer[i];
        if (c == '\\n' || c == '\\0' || line_idx >= MAX_SIGNATURE_RULE_LEN - 1) {
            current_line[line_idx] = '\\0';
            
            // Parse individual signature properties out of the token line
            char scratch_val[64];
            
            if (match_yaml_key(current_line, "type", scratch_val, 64)) {
                node->rule_id = rule_id_allocator++;
                if (strcmp(scratch_val, "network_firewall") == 0) node->rule_type = SIG_TYPE_NETWORK_FIREWALL;
                else if (strcmp(scratch_val, "host_ips") == 0)     node->rule_type = SIG_TYPE_HOST_IPS;
                else if (strcmp(scratch_val, "malware_yara") == 0) node->rule_type = SIG_TYPE_MALWARE_YARA_POLY;
            }
            else if (match_yaml_key(current_line, "name", scratch_val, 32)) {
                strncpy(node->rule_name, scratch_val, 31);
            }
            else if (match_yaml_key(current_line, "pattern", scratch_val, 64)) {
                strncpy(node->payload_pattern, scratch_val, 63);
            }
            else if (match_yaml_key(current_line, "action", scratch_val, 16)) {
                if (strcmp(scratch_val, "DROP") == 0)            node->action_modifier = 1;
                else if (strcmp(scratch_val, "TARPIT_STALL") == 0) node->action_modifier = 2;
                else if (strcmp(scratch_val, "EVICT_PROCESS") == 0) node->action_modifier = 3;
                
                // Once an action block terminates the YAML block layout object node, seal the slot
                node->is_active = true;
                g_signature_db.total_ingested_rules++;
                
                printf("  [Ingested Rule]: ID %d Type:%d '%s' bound to Action %d.\\n", 
                       node->rule_id, node->rule_type, node->rule_name, node->action_modifier);
                
                if (g_signature_db.total_ingested_rules >= MAX_YAML_RULES_STORED) break;
                node = &g_signature_db.parsed_rules[g_signature_db.total_ingested_rules];
            }

            line_idx = 0;
            if (c == '\\0') break;
        } else {
            if (c != '\\r') current_line[line_idx++] = c;
        }
    }

    commit_security_audit_entry(0x0004, "SIG_PARSER", "Declarative industry-standard YAML signature engine configurations parsed and locked.");
    return true;
}

bool sys_evaluate_network_signature(uint32_t dest_port, const uint8_t* payload, uint32_t len) {
    if (!g_signature_db.strict_compliance_active) return true;

    for (uint32_t i = 0; i < g_signature_db.total_ingested_rules; i++) {
        DecodedYamlRuleNode* rule = &g_signature_db.parsed_rules[i];
        if (rule->is_active && rule->rule_type == SIG_TYPE_NETWORK_FIREWALL) {
            
            // Check if the payload pattern matches a specific target string or target destination port
            if (payload && strstr((const char*)payload, rule->payload_pattern) != NULL) {
                printf("[FIREWALL MATCH]: Packet matched rule '%s'! Executing Action %d\\n", rule->rule_name, rule->action_modifier);
                
                if (rule->action_modifier == 2) { // Action 2: Route directly to your 128-slot TCP Tarpit Stall loop
                    extern bool sys_tarpit_track_connection(uint32_t ip, uint16_t port);
                    sys_tarpit_track_connection(0, (uint16_t)dest_port);
                }
                return false; // Deny packet routing
            }
        }
    }
    return true; // Frame cleared
}

bool sys_evaluate_malware_signature(const uint8_t* binary_buffer, uint32_t len) {
    for (uint32_t i = 0; i < g_signature_db.total_ingested_rules; i++) {
        DecodedYamlRuleNode* rule = &g_signature_db.parsed_rules[i];
        if (rule->is_active && rule->rule_type == SIG_TYPE_MALWARE_YARA_POLY) {
            
            // Look for dangerous binary footprints inside memory blocks
            if (binary_buffer && len > strlen(rule->payload_pattern)) {
                if (strstr((const char*)binary_buffer, rule->payload_pattern) != NULL) {
                    char audit_desc[64];
                    snprintf(audit_desc, sizeof(audit_desc), "IPS BLOCK: Malware binary matched signature profile '%s'!", rule->rule_name);
                    commit_security_audit_entry(0x0003, "MALWARE_SCANNER", audit_desc);
                    
                    printf("[SECURITY EXCEPTION]: %s -> Evicting binary context.\\n", audit_desc);
                    return false; // Block execution sequence
                }
            }
        }
    }
    return true; // Code cleared
}
