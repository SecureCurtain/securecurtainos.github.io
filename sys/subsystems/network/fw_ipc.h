#pragma once
#include <stdint.h>

// Unique IPC Command IDs
#define FW_CMD_ADD_RULE    0x501
#define FW_CMD_GET_LOGS    0x502
#define FW_CMD_LOG_EVENT   0x503

// Firewall Action Directives
#define FW_ACTION_ALLOW    0
#define FW_ACTION_DROP     1

// Connection State Tracking Identifiers
typedef enum {
    STATE_NEW,
    STATE_ESTABLISHED,
    STATE_RELATED
} fw_state_t;

// Binary layout for a firewall filtering rule
typedef struct {
    uint32_t src_ip;
    uint32_t dest_ip;
    uint16_t src_port;
    uint16_t dest_port;
    uint8_t  protocol;  // 6 = TCP, 17 = UDP
    uint8_t  action;    // FW_ACTION_ALLOW or FW_ACTION_DROP
} fw_rule_t;

// Binary layout for a logged packet event (Upgraded structure mapping)
typedef struct {
    uint64_t timestamp;
    uint32_t src_ip;
    uint32_t dest_ip;
    uint16_t src_port;
    uint16_t dest_port;
    uint8_t  protocol;
    uint8_t  action;     // Stores FW_ACTION_DROP, ALLOW, or FW_REASON_BAD_FLAGS
    uint8_t  tcp_flags;  // ADD THIS LINE: Captures raw flags for deep GUI analysis
} fw_log_entry_t;

// Standard RFC 793 TCP Flag Bitmasks
#define TCP_FLAG_FIN  (1 << 0) // 0x01
#define TCP_FLAG_SYN  (1 << 1) // 0x02
#define TCP_FLAG_RST  (1 << 2) // 0x04
#define TCP_FLAG_PSH  (1 << 3) // 0x08
#define TCP_FLAG_ACK  (1 << 4) // 0x10
#define TCP_FLAG_URG  (1 << 5) // 0x20

// Custom Security Dropping Action Reason Identifiers for your Logging GUI
#define FW_REASON_BAD_FLAGS 0x99