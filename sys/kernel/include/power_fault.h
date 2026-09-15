#pragma once
#include <stdint.h>
#include <stdbool.h>

#define POWER_FAULT_MAGIC_TAG  0x50575246 // "PWRF" binary tracking tag

typedef struct {
    uint32_t magic;
    uint64_t last_power_status_check;
    uint32_t active_voltage_millivolts;
    bool     power_loss_imminent;
    uint32_t urgent_flush_counter;
} PowerFaultRegistry;

void init_power_fault_saver(void);
void handle_hardware_power_loss_interrupt(uint32_t active_voltage_mv);
void execute_emergency_telemetry_flush(void);