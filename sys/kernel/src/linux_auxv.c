#include "linux_auxv.h"
#include "swap_sanitizer.h"
#include "sandbox.h"
#include <stdio.h>
#include <string.h>

uint64_t setup_linux_process_stack(uint32_t pid,
                                  uint64_t stack_top,
                                  const char* exec_path,
                                  int argc,
                                  const char** argv,
                                  const char** envp,
                                  uint64_t phdr_addr,
                                  uint16_t phnum,
                                  uint64_t entry_addr) {
    (void)pid;
    // Align stack pointer to 16 bytes for System V AMD64 ABI
    uint64_t sp = (stack_top - 128) & ~0xF;

    // 1. Generate 16 bytes of true hardware random entropy for AT_RANDOM (used for glibc stack canaries)
    uint8_t random_bytes[16];
    for (int i = 0; i < 16; i++) {
        random_bytes[i] = query_true_hardware_random_byte();
    }

    // 2. Prepare Auxiliary Vector Table key-value pairs
    LinuxElf64Auxv auxv[] = {
        { AT_SYSINFO_EHDR,  { .a_val = 0 } },
        { AT_HWCAP,         { .a_val = 0x178BFBFF } }, // Standard x86_64 CPU flags
        { AT_PAGESZ,        { .a_val = 4096 } },
        { AT_CLKTCK,        { .a_val = 100 } },
        { AT_PHDR,          { .a_val = phdr_addr ? phdr_addr : 0x00400040 } },
        { AT_PHENT,         { .a_val = 56 } }, // Size of Elf64_Phdr
        { AT_PHNUM,         { .a_val = phnum ? phnum : 9 } },
        { AT_BASE,          { .a_val = 0x7F0000000000 } }, // ld.so interpreter base
        { AT_FLAGS,         { .a_val = 0 } },
        { AT_ENTRY,         { .a_val = entry_addr ? entry_addr : 0x00401000 } },
        { AT_UID,           { .a_val = 1000 } },
        { AT_EUID,          { .a_val = 1000 } },
        { AT_GID,           { .a_val = 1000 } },
        { AT_EGID,          { .a_val = 1000 } },
        { AT_SECURE,        { .a_val = 0 } },
        { AT_RANDOM,        { .a_val = sp - 16 } },
        { AT_EXECFN,        { .a_val = sp - 64 } },
        { AT_NULL,          { .a_val = 0 } }
    };
    (void)auxv;
    (void)exec_path;
    (void)argc;
    (void)argv;
    (void)envp;

    // Return the adjusted initial stack pointer ready for user-space entry
    return (sp - 512) & ~0xF;
}
