#pragma once
#include <stdint.h>
#include <stdbool.h>

#define VGPU_MAX_SLICES      8
#define VGPU_SLICE_SIZE_MB   64
#define VGPU_MAGIC_TAG       0x56475055 // "VGPU" binary tracking tag

typedef struct {
    uint32_t slice_id;
    uint32_t owner_process_id;
    uint64_t physical_vram_base;
    uint64_t virtual_vram_limit;
    uint64_t hardware_fence_sequence;
    bool     is_active;
} VgpuSliceContext;

typedef struct {
    uint32_t         magic;
    uint64_t         physical_gpu_mmio_addr;
    VgpuSliceContext slices[VGPU_MAX_SLICES];
    uint32_t         total_allocated_slices;
    uint32_t         active_hardware_context_pid;
    uint32_t         cpu_optimization_profile; // 1=Ryzen 9 9950, 2=Core Ultra 7, 0=Default
} VgpuMultiplexerRegistry;

void init_vgpu_multiplexer(uint64_t gpu_mmio, uint64_t vram_phys_base);
int32_t sys_allocate_vgpu_slice(uint32_t pid);
bool sys_submit_vgpu_command_stream(uint32_t slice_id, uint32_t pid, const uint32_t* cmd_buffer, uint32_t dwords_len);
void execute_vgpu_context_switch(uint32_t target_pid);
void set_vgpu_cpu_tuning_profile(uint32_t profile_type);