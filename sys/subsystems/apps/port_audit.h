#pragma once
#include <stdint.h>
#include <stdbool.h>

#define AUDIT_WIN_X      300
#define AUDIT_WIN_Y      250
#define AUDIT_WIN_W      1100 // High-contrast, large-scale 4K bounding layout parameters
#define AUDIT_WIN_H      500

typedef struct {
    uint16_t port_number;
    char     service_description[16];
    bool     is_currently_listening;
    uint32_t connection_count;
} PortStatusNode;

typedef struct {
    PortStatusNode tracked_ports[4]; // Track Port 21 (FTPES), 22 (SSH), 80 (HTTP), 443 (HTTPS)
    uint32_t       total_ports_monitored;
    uint64_t       last_scan_timestamp_ms;
} PortAuditWorkspaceContext;

void init_network_port_auditor(void);
void render_network_port_auditor(void);
void sys_execute_asynchronous_port_scan(void);
