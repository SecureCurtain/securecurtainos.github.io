#pragma once
#include <stdint.h>
#include <stddef.h>
#include <stdbool.h>

#define MSR_STAR          0xC0000081
#define MSR_LSTAR         0xC0000082
#define MSR_SFMASK        0xC0000084
#define MSR_GS_BASE       0xC0000101

#define SUBSYSTEM_LINUX   1
#define SUBSYSTEM_WINDOWS 2

#define ARCH_SET_GS       0x1001
#define ARCH_GET_GS       0x1002

// Matches the exact push/pop order in your syscall.asm
typedef struct {
    uint64_t r15, r14, r13, r12, r11, r10, r9, r8;
    uint64_t rax, rbx, rcx, rdx, rsi, rdi, rbp;
    uint64_t rip, rflags, rsp; // Filled by CPU or assembly wrapper
} __attribute__((packed)) cpu_state_t;

// Global interfaces
void init_syscall_router(void);
void handle_syscall(cpu_state_t* regs);
extern void syscall_entry_asm(void);

// Ring 0 Architecture Control System Call for GS Base & TEB Management
int32_t sys_arch_prctl(uint32_t code, uint64_t addr);

// External translation layer hooks
void handle_posix_syscall(cpu_state_t* regs);
void handle_nt_syscall(cpu_state_t* regs);
