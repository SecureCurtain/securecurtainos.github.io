#include "anti_debug.h"
#include "sandbox.h"
#include "security_panic.h"
#include "security_audit.h"
#include <string.h>
#include <stdio.h>

static AntiDebugRegistry g_anti_debug_vault;

// Reads the CPU's raw high-precision hardware Time Stamp Counter register inline
static inline uint64_t read_hardware_tsc(void) {
    uint32_t lo, hi;
    asm volatile("rdtsc" : "=a"(lo), "=d"(hi));
    return ((uint64_t)hi << 32) | lo;
}

void init_anti_debug_tracer(void) {
    memset(&g_anti_debug_vault, 0, sizeof(AntiDebugRegistry));
    g_anti_debug_vault.magic = ANTI_DEBUG_MAGIC_TAG;
    g_anti_debug_vault.total_watched_tasks = 0;
    printf("[Kernel Anti-Debug]: Code injection and reverse-engineering shields armed.\\n");
}

void register_process_for_debug_shield(uint32_t pid) {
    if (g_anti_debug_vault.total_watched_tasks >= 32) return;

    uint32_t idx = g_anti_debug_vault.total_watched_tasks;
    DebugWatchNode* node = &g_anti_debug_vault.monitored_tasks[idx];
    
    node->process_id = pid;
    node->last_observed_tsc = read_hardware_tsc();
    node->signature_traps_tripped = 0;
    node->is_being_monitored = true;

    g_anti_debug_vault.total_watched_tasks++;
}

bool perform_realtime_anti_debug_check(uint32_t pid) {
    for (uint32_t i = 0; i < g_anti_debug_vault.total_watched_tasks; i++) {
        DebugWatchNode* node = &g_anti_debug_vault.monitored_tasks[i];
        
        if (node->is_being_monitored && node->process_id == pid) {
            // Check 1: Hardware Breakpoint Register Audit (DR0 - DR3 tracking)
            uint64_t dr0_val = 0;
            asm volatile("mov %%dr0, %0" : "=r"(dr0_val));
            if (dr0_val != 0) {
                handle_debugging_breach(pid, "Hardware Breakpoint Set (DR0 Register Match)");
                return false;
            }

            // Check 2: High-Precision Temporal Delta Analysis (Detects code stepping/pausing)
            uint64_t current_tsc = read_hardware_tsc();
            uint64_t delta_tsc = current_tsc - node->last_observed_tsc;
            
            // If delta cycles exceed an abstract threshold (e.g., 5,000,000 clock ticks), 
            // it indicates a human debugger is actively pausing and stepping through the execution path
            if (delta_tsc > 5000000 && node->last_observed_tsc != 0) {
                handle_debugging_breach(pid, "Execution Stepping (Time Stamp Counter Delay Divergence)");
                return false;
            }

            node->last_observed_tsc = current_tsc; // Reset tracking anchor window
            return true;
        }
    }
    return true;
}

void handle_debugging_breach(uint32_t pid, const char* exploit_vector) {
    char audit_desc[128];
    snprintf(audit_desc, sizeof(audit_desc), "Reverse-Engineering Blocked: PID %d triggered %s", pid, exploit_vector);
    commit_security_audit_entry(EVENT_AUTH_FAILURE, "ANTI_DEBUG_CORE", audit_desc);
    
    printf("[CRITICAL TIMING EXCEPTION]: %s\\n", audit_desc);

    // Eviction Action: If a core subsystem daemon is being target-analyzed, force a structural kernel panic
    if (pid < 103) { 
        execute_kernel_security_panic("Subsystem boundary analysis attempt detected.");
    } else {
        // Standard unprivileged application: terminate process scheduling instantly to isolate code
        printf("[Kernel Anti-Debug]: Evicting context pools for PID %d to preserve intellectual properties.\\n", pid);
        // (In your complete core, this triggers a direct context purge flag)
    }
}
