#include "session_timer.h"
#include "../../kernel/include/policy_engine.h"
#include "../../kernel/include/rbac.h"
#include "../../kernel/include/security_audit.h"
#include <stdio.h>

static SessionExpiryNode g_active_timer_node = {0, 0, MAX_TIMEOUT_LIMIT_MS, false};
static uint32_t g_runtime_timeout_ceiling_ms = MAX_TIMEOUT_LIMIT_MS;

void update_session_timeout_limit(uint32_t ms) {
    g_runtime_timeout_ceiling_ms = ms;
    printf("[Session Timer]: Security timeout limit dynamically recalibrated via GPO to: %d ms\\n", ms);
}

extern uint64_t get_system_uptime_ms(void);
extern void     lock_system_display(void);
extern uint32_t query_active_focused_window_pid(void);

void refresh_session_interaction_anchor(uint32_t pid) {
    g_active_timer_node.tracked_pid = pid;
    g_active_timer_node.last_interaction_uptime = get_system_uptime_ms();
    g_active_timer_node.is_expired = false;
}

void monitor_active_session_clocks(void) {
    if (g_active_timer_node.is_expired) return;

    uint32_t current_focused_pid = query_active_focused_window_pid();
    if (current_focused_pid == 0) return; // System idle boundary bypass

    uint64_t current_uptime = get_system_uptime_ms();
    uint64_t total_idle_delta = current_uptime - g_active_timer_node.last_interaction_uptime;

    // Check if the current user session has breached the maximum allowed inactivity threshold
    uint32_t active_limit = (g_runtime_timeout_ceiling_ms < g_active_timer_node.configured_timeout_ms) ? g_runtime_timeout_ceiling_ms : g_active_timer_node.configured_timeout_ms;
    if (total_idle_delta >= active_limit) {
        g_active_timer_node.is_expired = true;

        char log_summary[64];
        snprintf(log_summary, sizeof(log_summary), "Session Expired: PID %d stripped of credentials due to inactivity.", current_focused_pid);
        commit_security_audit_entry(EVENT_POWER_STATE_CHANGE, "SESSION_TIMER", log_summary);
        
        printf("[SESSION TIMEOUT]: %s Revoking role permissions.\\n", log_summary);

        // 1. Direct Ring 0 Revocation: Strip the user's role tokens from the active RBAC matrix
        rbac_terminate_user_session(current_focused_pid);

        // 2. Lock down display: Force secure lock screen dialog back over the screen space
        lock_system_display();
    }
}
