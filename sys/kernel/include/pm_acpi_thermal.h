// =========================================================================
// ACPI POWER MANAGEMENT & THERMAL THROTTLING RING HEADER
// =========================================================================
#ifndef SECURECURTAIN_PM_ACPI_THERMAL_H
#define SECURECURTAIN_PM_ACPI_THERMAL_H

#include <stdint.h>
#include <stdbool.h>

#define ACPI_THERMAL_MAGIC     0x504D5448 // "PMTH"
#define MAX_THERMAL_CORES      32
#define MAX_P_STATES           8

typedef enum {
    P_STATE_P0_TURBO = 0,    // Maximum Frequency / Voltage
    P_STATE_P1_BASE  = 1,    // Nominal Clock
    P_STATE_P2_ECO   = 2,    // Power Saving
    P_STATE_P3_THROTTLE = 3  // Emergency Throttling
} CpuPerformanceState;

typedef struct {
    uint32_t frequency_mhz;
    uint32_t voltage_mv;
    uint32_t power_milliwatts;
    uint32_t transition_latency_us;
} AcpiPStateDescriptor;

typedef struct {
    uint32_t            core_id;
    uint32_t            current_temp_mC;       // milli-Celsius (e.g. 45000 = 45.0 C)
    uint32_t            passive_temp_limit_mC; // _PSV threshold
    uint32_t            critical_temp_limit_mC;// _CRT threshold
    CpuPerformanceState current_pstate;
    bool                is_throttling;
    uint64_t            throttle_event_count;
} CoreThermalContext;

typedef struct {
    uint32_t             magic;
    bool                 acpi_thermal_active;
    uint32_t             fan_duty_cycle_pct;    // 0% - 100% PWM
    uint32_t             core_count;
    AcpiPStateDescriptor pstates[MAX_P_STATES];
    CoreThermalContext   cores[MAX_THERMAL_CORES];
    uint64_t             total_thermal_polls;
} AcpiThermalRegistry;

void                init_acpi_thermal_management(void);
void                sys_pm_poll_thermal_zones(void);
void                sys_pm_set_core_pstate(uint32_t core_id, CpuPerformanceState pstate);
void                sys_pm_adjust_fan_pwm(uint32_t duty_cycle_pct);
uint32_t            sys_pm_get_max_core_temp_mC(void);
CpuPerformanceState sys_pm_get_active_pstate(uint32_t core_id);

#endif // SECURECURTAIN_PM_ACPI_THERMAL_H
