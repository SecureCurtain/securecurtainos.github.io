#include "sandbox_watchdog.h"
#include "sandbox.h"
#include "security_panic.h"
#include "security_audit.h"
#include <string.h>
#include <stdio.h>

static SandboxWatchdogRegistry g_watchdog_registry;

extern uint64_t get_system_uptime_ms(void);
extern void     handle_sandbox_violation(uint32_t pid, uint64_t address, bool is_write);

void init_sandbox_watchdog_daemon(void) {
    memset(&g_watchdog_registry, 0, sizeof(SandboxWatchdogRegistry));
    g_watchdog_registry.magic = WATCHDOG_MAGIC_TAG;
    g_watchdog_registry.monitored_count = 0;
    g_watchdog_registry.is_enforcement_active = true;

    printf("[Kernel Watchdog]: Real-time process heuristics scanner active.\\n");
}

void register_process_with_watchdog(uint32_t pid) {
    if (g_watchdog_registry.monitored_count >= MAX_WATCHED_PROCESSES) return;

    uint32_t idx = g_watchdog_registry.monitored_count;
    ProcessBehaviorNode* node = &g_watchdog_registry.processes[idx];
    
    node->process_id = pid;
    node->active_fork_count = 1;
    node->ipc_messages_in_current_sec = 0;
    node->last_time_window_ms = get_system_uptime_ms();
    node->accumulated_violations = 0;
    node->is_monitored = true;

    g_watchdog_registry.monitored_count++;
}

bool sys_watchdog_log_ipc_transaction(uint32_t pid) {
    if (!g_watchdog_registry.is_enforcement_active) return true;

    for (uint32_t i = 0; i < g_watchdog_registry.monitored_count; i++) {
        ProcessBehaviorNode* node = &g_watchdog_registry.processes[i];
        if (node->is_monitored && node->process_id == pid) {
            uint64_t now = get_system_uptime_ms();
            
            // If one second has lapsed, reset the rolling message frequency window counters
            if (now - node->last_time_window_ms >= 1000) {
                node->ipc_messages_in_current_sec = 0;
                node->last_time_window_ms = now;
            }

            node->ipc_messages_in_current_sec++;

            // HEURISTIC VIOLATION CHECK: Detect rapid messaging flooding anomalies
            if (node->ipc_messages_in_current_sec > MAX_IPC_MSG_PER_SEC) {
                node->accumulated_violations++;
                
                char warning_desc[128];
                snprintf(warning_desc, sizeof(warning_desc), "IPC Flood Detected from PID %d (%d msgs/sec limit breached)", pid, MAX_IPC_MSG_PER_SEC);
                commit_security_audit_entry(0x0003 /* EVENT_AUTH_FAILURE */, "WATCHDOG_HEUR", warning_desc);
                printf("[WATCHDOG WARNING]: %s\\n", warning_desc);

                if (node->accumulated_violations >= 3) {
                    // Evict compromised sandbox thread queues to isolate system
                    handle_sandbox_violation(pid, 0x0000000000000000, false);
                    return false;
                }
            }
            return true;
        }
    }
    return true;
}

bool sys_watchdog_log_thread_fork(uint32_t pid) {
    for (uint32_t i = 0; i < g_watchdog_registry.monitored_count; i++) {
        ProcessBehaviorNode* node = &g_watchdog_registry.processes[i];
        if (node->is_monitored && node->process_id == pid) {
            node->active_fork_count++;

            // FORK BOMB MITIGATION: Protect multi-core allocation threads from resource starvation
            if (node->active_fork_count > MAX_ALLOWED_THREAD_FORKS) {
                char alert_desc[128];
                snprintf(alert_desc, sizeof(alert_desc), "Process ID %d Evicted: Exceeded Thread Fork Limit of %d", pid, MAX_ALLOWED_THREAD_FORKS);
                commit_security_audit_entry(0x0003, "WATCHDOG_HEUR", alert_desc);
                printf("[WATCHDOG MITIGATION]: %s\\n", alert_desc);
                
                // Evict malicious context cleanly from the active core allocator queues
                handle_sandbox_violation(pid, 0x0000000000000000, false);
                return false;
            }
            return true;
        }
    }
    return true;
}

void execute_watchdog_behavioral_audit_sweep(void) {
    // Continuously runs within the main background timer daemon loops
    uint64_t now = get_system_uptime_ms();
    for (uint32_t i = 0; i < g_watchdog_registry.monitored_count; i++) {
        ProcessBehaviorNode* node = &g_watchdog_registry.processes[i];
        if (node->is_monitored && (now - node->last_time_window_ms >= 5000)) {
            // Decay violation penalties slowly over time for well-behaved sandboxes
            if (node->accumulated_violations > 0) node->accumulated_violations--;
            node->ipc_messages_in_current_sec = 0;
            node->last_time_window_ms = now;
        }
    }
}
