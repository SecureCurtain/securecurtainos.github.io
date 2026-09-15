// =========================================================================
// ACPI POWER MANAGEMENT & THERMAL THROTTLING RING IMPLEMENTATION
// =========================================================================
#include "pm_acpi_thermal.h"
#include "security_panic.h"
#include "security_audit.h"
#include "kstring.h"
#include <stdio.h>

static AcpiThermalRegistry g_thermal;

// Low-level MSR reading/writing for Intel/AMD dynamic P-States & Thermal Status
static inline uint64_t read_msr(uint32_t msr) {
    uint32_t lo, hi;
    asm volatile("rdmsr" : "=a"(lo), "=d"(hi) : "c"(msr));
    return ((uint64_t)hi << 32) | lo;
}

static inline void write_msr(uint32_t msr, uint64_t val) {
    uint32_t lo = (uint32_t)val;
    uint32_t hi = (uint32_t)(val >> 32);
    asm volatile("wrmsr" : : "a"(lo), "d"(hi), "c"(msr));
}

// Embedded Controller (EC) I/O port fan controller (Ports 0x62/0x66)
static inline void ec_write_fan_speed(uint8_t duty_pct) {
    asm volatile("outb %0, %1" : : "a"((uint8_t)0x80), "Nd"((uint16_t)0x66)); // Write Command
    for (volatile int i = 0; i < 1000; i++) asm volatile("pause");
    asm volatile("outb %0, %1" : : "a"(duty_pct), "Nd"((uint16_t)0x62));     // Write Data
}

void init_acpi_thermal_management(void) {
    kmemset(&g_thermal, 0, sizeof(AcpiThermalRegistry));
    g_thermal.magic = ACPI_THERMAL_MAGIC;
    g_thermal.acpi_thermal_active = true;
    g_thermal.fan_duty_cycle_pct = 35; // Quiet default baseline (35%)
    g_thermal.core_count = 16;

    // Define standard P-State table
    g_thermal.pstates[P_STATE_P0_TURBO]    = (AcpiPStateDescriptor){ 5700, 1350, 170000, 10 };
    g_thermal.pstates[P_STATE_P1_BASE]     = (AcpiPStateDescriptor){ 4200, 1100, 105000, 20 };
    g_thermal.pstates[P_STATE_P2_ECO]      = (AcpiPStateDescriptor){ 2800, 900,  45000,  30 };
    g_thermal.pstates[P_STATE_P3_THROTTLE] = (AcpiPStateDescriptor){ 1400, 750,  15000,  50 };

    for (uint32_t i = 0; i < g_thermal.core_count; i++) {
        CoreThermalContext* c = &g_thermal.cores[i];
        c->core_id = i;
        c->current_temp_mC = 38000 + (i * 300); // 38.0°C nominal
        c->passive_temp_limit_mC = 78000;       // 78.0°C passive cooling threshold (_PSV)
        c->critical_temp_limit_mC = 95000;      // 95.0°C emergency shutdown limit (_CRT)
        c->current_pstate = P_STATE_P0_TURBO;
        c->is_throttling = false;
        c->throttle_event_count = 0;
    }

    ec_write_fan_speed(g_thermal.fan_duty_cycle_pct);
    printf("[Kernel ACPI PM]: Dynamic thermal management & P-state throttling ring active.\\n");
}

void sys_pm_set_core_pstate(uint32_t core_id, CpuPerformanceState pstate) {
    if (core_id >= g_thermal.core_count || pstate > P_STATE_P3_THROTTLE) return;
    
    CoreThermalContext* c = &g_thermal.cores[core_id];
    c->current_pstate = pstate;

    // IA32_PERF_CTL MSR (0x199) or AMD P-State MSR (0xC0010062)
    uint64_t target_ratio = 42;
    if (pstate == P_STATE_P0_TURBO) target_ratio = 57;
    else if (pstate == P_STATE_P2_ECO) target_ratio = 28;
    else if (pstate == P_STATE_P3_THROTTLE) target_ratio = 14;

    uint64_t msr_val = (target_ratio << 8) | 0x00;
    // write_msr(0x199, msr_val);
    (void)msr_val;
}

void sys_pm_adjust_fan_pwm(uint32_t duty_cycle_pct) {
    if (duty_cycle_pct > 100) duty_cycle_pct = 100;
    if (duty_cycle_pct < 20) duty_cycle_pct = 20; // Minimum safety airflow
    g_thermal.fan_duty_cycle_pct = duty_cycle_pct;
    ec_write_fan_speed((uint8_t)duty_cycle_pct);
}

void sys_pm_poll_thermal_zones(void) {
    if (!g_thermal.acpi_thermal_active) return;
    g_thermal.total_thermal_polls++;

    uint32_t max_temp = 0;

    for (uint32_t i = 0; i < g_thermal.core_count; i++) {
        CoreThermalContext* c = &g_thermal.cores[i];
        
        // Simulating physical MSR 0x1B0 IA32_THERM_STATUS read
        // In real silicon, temp = TjMax - DigitalReadout
        if (c->current_temp_mC > max_temp) {
            max_temp = c->current_temp_mC;
        }

        // Evaluate Thermal Rules
        if (c->current_temp_mC >= c->critical_temp_limit_mC) {
            // Critical Overheat: Force P3 Maximum Throttle & 100% Fan PWM
            c->is_throttling = true;
            c->throttle_event_count++;
            sys_pm_set_core_pstate(i, P_STATE_P3_THROTTLE);
            sys_pm_adjust_fan_pwm(100);
            commit_security_audit_entry(0x0001, "THERMAL_CRITICAL", "Emergency thermal throttling engaged on core.");
        } else if (c->current_temp_mC >= c->passive_temp_limit_mC) {
            // Passive Limit Reached: Step down to P1 or P2, increase fan to 75%
            c->is_throttling = true;
            if (c->current_pstate == P_STATE_P0_TURBO) {
                sys_pm_set_core_pstate(i, P_STATE_P1_BASE);
            }
            sys_pm_adjust_fan_pwm(75);
        } else if (c->current_temp_mC < (c->passive_temp_limit_mC - 10000)) {
            // Core Cooled Down (< 68°C): Restore Turbo P0, quiet fan
            if (c->is_throttling) {
                c->is_throttling = false;
                sys_pm_set_core_pstate(i, P_STATE_P0_TURBO);
            }
        }
    }

    // Auto-scale fan curve based on max core temp
    if (max_temp < 50000) {
        sys_pm_adjust_fan_pwm(30);
    } else if (max_temp < 70000) {
        sys_pm_adjust_fan_pwm(50);
    }
}

uint32_t sys_pm_get_max_core_temp_mC(void) {
    uint32_t max_t = 0;
    for (uint32_t i = 0; i < g_thermal.core_count; i++) {
        if (g_thermal.cores[i].current_temp_mC > max_t) {
            max_t = g_thermal.cores[i].current_temp_mC;
        }
    }
    return max_t;
}

CpuPerformanceState sys_pm_get_active_pstate(uint32_t core_id) {
    if (core_id < g_thermal.core_count) {
        return g_thermal.cores[core_id].current_pstate;
    }
    return P_STATE_P1_BASE;
}
