#pragma once
#include <stdint.h>
#include <stdbool.h>

#define MAX_TIMEOUT_LIMIT_MS  300000 // 5-minute absolute inactivity timeout limit

typedef struct {
    uint32_t tracked_pid;
    uint64_t last_interaction_uptime;
    uint32_t configured_timeout_ms;
    bool     is_expired;
} SessionExpiryNode;

void monitor_active_session_clocks(void);
void refresh_session_interaction_anchor(uint32_t pid);