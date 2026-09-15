#pragma once
#include <stdint.h>
#include <stdbool.h>

#define SIEM_MAGIC_TAG         0x5349454D // "SIEM" binary tracking tag
#define PORT_SYSLOG_TLS        6514       // Industry-standard secure syslog port
#define MAX_SIEM_ENDPOINT_LEN  128

typedef enum {
    SIEM_MODE_LOCAL_ONLY = 0,
    SIEM_MODE_RFC5424_SYSLOG_TLS,
    SIEM_MODE_HTTPS_JSON_API
} SiemRoutingMode;

typedef struct {
    uint32_t magic;
    uint8_t  active_routing_mode; // Tracks SiemRoutingMode choices
    char     siem_collector_fqdn[MAX_SIEM_ENDPOINT_LEN];
    uint16_t siem_port;
    uint64_t total_events_streamed;
    bool     is_domain_switched;
} SiemRouterRegistry;

void init_enterprise_siem_router(void);
void sys_signal_domain_join_siem_switch(const char* siem_host, uint8_t mode);
bool sys_stream_event_to_siem(const char* facility, uint8_t severity, const char* message);
