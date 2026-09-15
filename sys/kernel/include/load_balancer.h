#pragma once
#include <stdint.h>
#include <stdbool.h>
#include "core_allocator.h"

#define BALANCER_MAGIC_TAG   0x4C42414C // "LBAL" binary tracking token

typedef struct {
    uint32_t enclave_id;
    uint32_t active_task_weight;
    uint32_t peak_observed_saturation;
    uint32_t baseline_thread_count;
} EnclaveTelemetryNode;

typedef struct {
    uint32_t             magic;
    EnclaveTelemetryNode enclaves[3]; // Track Enclaves 0, 1, 2
    uint64_t             last_balance_timestamp;
    bool                 is_balancing_enabled;
} CoreBalancerRegistry;

void init_multi_core_load_balancer(void);
void sys_balance_enclave_load_metrics(void);
uint32_t sys_select_least_saturated_thread(SecurityEnclaveType enclave);