#pragma once
#include <stdint.h>
#include <stdbool.h>

#define CRASH_DUMP_MAGIC_TAG   0x43444D50 // "CDMP" binary tracking tag
#define CRASH_DUMP_SECTOR_START 6000       // Dedicated partition boundary for crash data files

typedef struct {
    uint64_t rax, rbx, rcx, rdx;
    uint64_t rsi, rdi, rbp, rsp;
    uint64_t rip, rflags;
    uint64_t cr3; // MMU Page directory root reference pointer
} CpuRegisterSnapshot;

typedef struct {
    uint32_t            magic;
    uint32_t            fault_exception_vector;
    CpuRegisterSnapshot register_state;
    uint64_t            timestamp_ms;
    bool                is_ciphertext_sealed;
} CrashDumpHeader;

void init_crash_dump_stager(void);
void __attribute__((noreturn)) execute_secure_kernel_crash_dump(uint32_t vector, const CpuRegisterSnapshot* regs);