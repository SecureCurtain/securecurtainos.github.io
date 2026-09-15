#pragma once
#include <stdint.h>
#include <stdbool.h>

#define HW_GATE_MAGIC_TAG    0x48574754 // "HWGT" binary tracking token

typedef struct {
    bool     ram_passed;
    bool     cpu_passed;
    bool     gpu_passed;
    bool     disk_passed;
    bool     display_passed;
    uint64_t detected_ram_mb;
    uint32_t detected_disk_gb;
    uint32_t detected_width;
    uint32_t detected_height;
    char     detected_cpu_model[64];
    char     detected_gpu_desc[64];
} HardwareValidationReport;

typedef struct {
    uint32_t                 magic;
    HardwareValidationReport report;
    bool                     is_baseline_satisfied;
} HardwareGateRegistry;

void init_hardware_baseline_gate(void);
bool sys_execute_bare_metal_baseline_check(void);
const HardwareValidationReport* sys_get_hardware_gate_report(void);

struct HardwareManifest;
void sys_hardware_gate_override_discovered_bounds(const struct HardwareManifest* m);
