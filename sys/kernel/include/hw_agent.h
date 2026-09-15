// =========================================================================
// AUTOMATED HARDWARE SYNTHESIS CONFIGURATION AGENT HEADER
// =========================================================================
#ifndef SECURECURTAIN_HW_AGENT_H
#define SECURECURTAIN_HW_AGENT_H

#pragma once
#include <stdint.h>
#include <stdbool.h>

#define HW_AGENT_MAGIC_TAG     0x48574147 // "HWAG" binary tracking token
#define MAX_CPU_BRAND_LEN      48
#define MAX_MOTHERBOARD_LEN    32

// Unified, bare-metal hardware manifest structure populated dynamically during Pass 1
typedef struct {
    char     cpu_brand_string[MAX_CPU_BRAND_LEN];
    uint32_t cpu_family;
    uint32_t cpu_model;
    uint32_t logical_core_count;
    uint64_t physical_ram_bytes;
    uint64_t total_lba_sectors;
    uint32_t gop_native_width;
    uint32_t gop_native_height;
    uint64_t gop_framebuffer_base;
    char     motherboard_oem_id[MAX_MOTHERBOARD_LEN];
} HardwareManifest;

typedef struct {
    uint32_t         magic;
    HardwareManifest detected_specs;
    bool             is_pass1_harvest_complete;
    bool             is_pass2_synthesis_complete;
} HardwareAgentRegistry;

// Core Configuration Agent Primitives
void init_hardware_configuration_agent(void);
void sys_execute_pass1_hardware_harvest(void);
void sys_execute_pass2_profile_synthesis(void);
const HardwareManifest* sys_get_synthesized_manifest(void);

#endif // SECURECURTAIN_HW_AGENT_H
