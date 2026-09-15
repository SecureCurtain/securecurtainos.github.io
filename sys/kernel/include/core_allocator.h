// =========================================================================
// LOCAL APIC MULTI-CORE SCHEDULER & IPI WAKE ENGINE HEADER
// =========================================================================
#ifndef SECURECURTAIN_CORE_ALLOCATOR_H
#define SECURECURTAIN_CORE_ALLOCATOR_H

#include <stdint.h>
#include <stdbool.h>

#define LAPIC_MAGIC_TAG       0x4C415043 // "LAPC" binary tracking token
#define LAPIC_BASE_MMIO_ADDR  0xFEE00000 // Standard x86_64 Local APIC memory map location
#define LAPIC_REG_ID          0x0020
#define LAPIC_REG_ICR_LOW     0x0300
#define LAPIC_REG_ICR_HIGH    0x0310

typedef struct {
    uint32_t core_id;
    uint32_t active_enclave_pid;
    uint32_t active_thread_weight;
    bool     is_core_online;
} CpuCoreExecutionNode;

typedef struct {
    uint32_t             magic;
    CpuCoreExecutionNode logical_cores[64]; // Supports up to 64 concurrent cores
    uint32_t             total_online_cores;
    uint32_t             global_scheduler_load_weight;
} MultiCoreSchedulerRegistry;

void     init_multi_core_apic_scheduler(void);
void     sys_apic_wake_auxiliary_cores(void);
uint32_t sys_query_active_ryzen_core_load_weight(void);
void     sys_apic_reconfigure_core_topology_limits(uint32_t active_cores);
uint32_t allocate_hardware_core_for_task(uint32_t pid);
void     release_hardware_core(uint32_t core_id);

#endif // SECURECURTAIN_CORE_ALLOCATOR_H
