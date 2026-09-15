/* SecureCurtain OS - Process & Dual-Persona Userland Execution Header
 * Author: Jared Busby (jb7572)
 * Target: x86_64 Long Mode
 */

#ifndef _SECURECURTAIN_PROCESS_H
#define _SECURECURTAIN_PROCESS_H

#include <stdint.h>
#include <stddef.h>
#include <stdbool.h>
#include "sched.h"

#define USER_STACK_TOP      0x00007FFFFFFFF000ULL
#define USER_STACK_SIZE     (1024 * 1024) // 1 MB user stack
#define USER_STACK_BOTTOM   (USER_STACK_TOP - USER_STACK_SIZE)

/* Process Structure */
struct process {
    uint64_t pid;
    char name[32];
    os_personality_t personality;
    uintptr_t cr3;            // Userland PML4 Table
    uint64_t entry_point;     // Userland Entry Address (RIP)
    uint64_t user_rsp;        // Userland Stack Pointer (RSP)
    uint64_t heap_start;      // Process heap base
    uint64_t heap_brk;        // Current process break (sbrk)
    struct task *main_thread; // Primary scheduler TCB
};

/* Universal Binary Loader Result */
struct load_result {
    uint64_t entry_point;
    uint64_t user_rsp;
    os_personality_t personality;
    uintptr_t cr3;
    bool success;
    char error_msg[64];
};

/* Public Process & Loader API */
void process_init(void);
struct load_result loader_load_binary(const uint8_t *binary_data, size_t binary_size);
struct process *process_spawn(const char *path, os_personality_t persona_hint);
void ring3_jump(uint64_t entry_point, uint64_t user_rsp);

#endif /* _SECURECURTAIN_PROCESS_H */
