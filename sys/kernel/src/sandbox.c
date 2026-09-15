#include "sandbox.h"
#include "security_panic.h"
#include "security_audit.h"
#include <string.h>
#include <stdio.h>

static SandboxManager g_sandbox_manager;

void init_sandbox_manager(void) {
    memset(&g_sandbox_manager, 0, sizeof(SandboxManager));
    g_sandbox_manager.active_count = 0;
    g_sandbox_manager.strict_enforcement = true;

    printf("[Kernel Sandbox]: Dynamic Process Isolation Layer successfully operational.\\n");
}

int32_t register_sandboxed_process(const char* name, uint64_t cr3_page_root) {
    if (g_sandbox_manager.active_count >= MAX_SANDBOXED_PROCESSES) return -1;

    uint32_t new_pid = g_sandbox_manager.active_count + 100; // Unique unprivileged PID tracking
    SandboxContext* ctx = &g_sandbox_manager.contexts[g_sandbox_manager.active_count];
    
    ctx->process_id = new_pid;
    ctx->virtual_memory_root = cr3_page_root;
    
    // Hardcode strict hardware bounds isolating app execution entirely into user-space space pages
    ctx->memory_base_limit = USER_SPACE_MIN_ADDR;
    ctx->memory_upper_limit = USER_SPACE_MAX_ADDR;
    ctx->is_active = true;
    strncpy(ctx->process_tag, name, 31);

    g_sandbox_manager.active_count++;
    printf("[Kernel Sandbox]: Isolated memory boundary active for PID %d (%s)\\n", new_pid, name);
    return (int32_t)new_pid;
}

bool validate_memory_access_bounds(uint32_t pid, uint64_t target_address, uint32_t size, bool is_write) {
    if (!g_sandbox_manager.strict_enforcement) return true;

    for (uint32_t i = 0; i < g_sandbox_manager.active_count; i++) {
        SandboxContext* ctx = &g_sandbox_manager.contexts[i];
        
        if (ctx->is_active && ctx->process_id == pid) {
            // Check if the targeted memory region leaks below or above the isolated boundaries
            uint64_t upper_bound_check = target_address + size;
            
            if (target_address < ctx->memory_base_limit || upper_bound_check > ctx->memory_upper_limit) {
                // Out of bounds anomaly caught!
                handle_sandbox_violation(pid, target_address, is_write);
                return false; 
            }
            return true; // Memory boundary validation passed
        }
    }
    return true; // Bypass checks for system/kernel execution processes
}

void handle_sandbox_violation(uint32_t pid, uint64_t violating_address, bool is_write) {
    char process_name[32] = "UNKNOWN";
    
    for (uint32_t i = 0; i < g_sandbox_manager.active_count; i++) {
        if (g_sandbox_manager.contexts[i].process_id == pid) {
            strcpy(process_name, g_sandbox_manager.contexts[i].process_tag);
            break;
        }
    }

    char audit_desc[128];
    snprintf(audit_desc, sizeof(audit_desc), 
             "Sandbox Breach: %s (PID %d) attempted illegal %s at 0x%016llX", 
             process_name, pid, is_write ? "WRITE" : "READ", violating_address);

    // 1. Commit the violation log directly to your encrypted security history database
    commit_security_audit_entry(EVENT_AUTH_FAILURE, "SANDBOX_ENGINE", audit_desc);
    printf("[CRITICAL ALERT]: %s\\n", audit_desc);

    // 2. Defensive Action: Unprivileged sandbox apps are never allowed to touch kernel space.
    // If a process target leaks into Ring 0 kernel pages, deploy immediate hardware panic containment loops.
    if (violating_address < USER_SPACE_MIN_ADDR) {
        char panic_summary[64];
        snprintf(panic_summary, sizeof(panic_summary), "Process %s cross-space memory exploitation attempt.", process_name);
        execute_kernel_security_panic(panic_summary);
    } else {
        // Standard user-space cross-process leak: terminate the offending task safely to preserve workspace state
        printf("[Kernel Sandbox]: Evicting thread queue context for PID %d to isolate system.\\n", pid);
        // (In your complete core, this schedules a thread kill flag command on the target context)
    }
}
