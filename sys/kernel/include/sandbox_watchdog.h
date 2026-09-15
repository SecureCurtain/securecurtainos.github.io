#pragma once
#include <stdint.h>
#include <stdbool.h>

#define WATCHDOG_MAGIC_TAG       0x57444743 // "WDGC" binary tracking token
#define MAX_WATCHED_PROCESSES    32
#define MAX_ALLOWED_THREAD_FORKS 16
#define MAX_IPC_MSG_PER_SEC      100

typedef struct {
    uint32_t process_id;
    uint32_t active_fork_count;
    uint32_t ipc_messages_in_current_sec;
    uint64_t last_time_window_ms;
    uint32_t accumulated_violations;
    bool     is_monitored;
} ProcessBehaviorNode;

typedef struct {
    uint32_t            magic;
    ProcessBehaviorNode processes[MAX_WATCHED_PROCESSES];
    uint32_t            monitored_count;
    bool                is_enforcement_active;
} SandboxWatchdogRegistry;

void init_sandbox_watchdog_daemon(void);
void register_process_with_watchdog(uint32_t pid);
bool sys_watchdog_log_ipc_transaction(uint32_t pid);
bool sys_watchdog_log_thread_fork(uint32_t pid);
void execute_watchdog_behavioral_audit_sweep(void);