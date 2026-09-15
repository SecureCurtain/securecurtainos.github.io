#pragma once
#include <stdint.h>
#include <stdbool.h>

#define AUDIT_MAGIC_HEADER      0x41554454 // "AUDT" magic signature identifier
#define AUDIT_LOG_RECORD_SIZE   128        // Fixed-size record padding for block optimization

// Event Classification IDs
#define EVENT_LOCKSCREEN_LOCKED     0x0001
#define EVENT_LOCKSCREEN_UNLOCKED   0x0002
#define EVENT_AUTH_FAILURE          0x0003
#define EVENT_POWER_STATE_CHANGE    0x0004
#define EVENT_IPS_PACKET_DROP       0x0005
#define EVENT_IPS_PORT_SCAN         0x0006
#define EVENT_IPS_MALFORMED_HEADER  0x0007
#define EVENT_SECURITY_LOCKDOWN     0x0008
#define EVENT_SYSTEM_TERMINAL_PANIC 0x0009

#define IPC_MSG_SECURITY_ALERT      0x71A0

// Inter-Process Signaling Definition Structure
typedef struct {
    uint32_t event_id;
    uint32_t severity;        // 0 = Info, 1 = Warning, 2 = Critical Threat
    char     source_tag[16];  // "AUTH", "IPS", "KERNEL"
    char     alert_text[64];  // Descriptive message string
} SecurityAlertIpcMsg;

// Unified Row Log Viewer Definition Structure
typedef struct {
    uint32_t event_type;
    uint64_t timestamp_ms;
    char     subsystem_origin[16];
    char     message_details[96];
    uint32_t severity_level;
} UnifiedViewerRecord;

typedef struct {
    uint32_t magic;
    uint32_t event_id;
    uint64_t timestamp_ms;
    char     user_context[32];
    char     description[64];
    uint32_t padding;
} AuditRecord;

void init_security_auditor(void);
void commit_security_audit_entry(uint32_t event_id, const char* user, const char* description);