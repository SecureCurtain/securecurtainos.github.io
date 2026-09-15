#include "load_balancer.h"
#include <string.h>
#include <stdio.h>

static CoreBalancerRegistry g_load_balancer;

extern uint64_t get_system_uptime_ms(void);
extern MultiCoreAllocatorRegistry g_core_allocator;

void init_multi_core_load_balancer(void) {
    memset(&g_load_balancer, 0, sizeof(CoreBalancerRegistry));
    g_load_balancer.magic = BALANCER_MAGIC_TAG;
    g_load_balancer.last_balance_timestamp = get_system_uptime_ms();
    g_load_balancer.is_balancing_enabled = true;

    g_load_balancer.enclaves[0].enclave_id = 0; g_load_balancer.enclaves[0].baseline_thread_count = 16;
    g_load_balancer.enclaves[1].enclave_id = 1; g_load_balancer.enclaves[1].baseline_thread_count = 8;
    g_load_balancer.enclaves[2].enclave_id = 2; g_load_balancer.enclaves[2].baseline_thread_count = 8;

    printf("[Kernel Balancer]: Multi-core resource topology load balancing metrics online.\\n");
}

uint32_t sys_select_least_saturated_thread(SecurityEnclaveType enclave) {
    uint32_t target_mask = g_core_allocator.active_enclave_masks[enclave];
    uint32_t selected_thread_index = 0xFFFFFFFF;
    
    // Pick the logical thread index within the required security enclave mask that is currently idle
    for (uint32_t i = 0; i < RYZEN_TOTAL_THREADS; i++) {
        if ((1 << i) & target_mask) {
            if (!g_core_allocator.processors[i].is_thread_busy) {
                return i; // Instant match for true idle processing execution channels
            }
            selected_thread_index = i; // Fallback recycling anchor
        }
    }
    return selected_thread_index;
}

void sys_balance_enclave_load_metrics(void) {
    if (!g_load_balancer.is_balancing_enabled) return;
    
    uint64_t now = get_system_uptime_ms();
    if (now - g_load_balancer.last_balance_timestamp < 1000) return; // Process ticks at a non-blocking 1Hz cycle

    // Update internal telemetry weights based on active thread usage registers
    for (uint32_t enc = 0; enc < 3; enc++) {
        uint32_t busy_accumulator = 0;
        uint32_t target_mask = g_core_allocator.active_enclave_masks[enc];

        for (uint32_t i = 0; i < RYZEN_TOTAL_THREADS; i++) {
            if (((1 << i) & target_mask) && g_core_allocator.processors[i].is_thread_busy) {
                busy_accumulator++;
            }
        }
        g_load_balancer.enclaves[enc].active_task_weight = busy_accumulator;
        if (busy_accumulator > g_load_balancer.enclaves[enc].peak_observed_saturation) {
            g_load_balancer.enclaves[enc].peak_observed_saturation = busy_accumulator;
        }
    }
    g_load_balancer.last_balance_timestamp = now;
}
