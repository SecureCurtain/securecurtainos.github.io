/* SecureCurtain OS - Preemptive Multitasking & Round-Robin Task Scheduler Header
 * Author: Jared Busby (jb7572)
 * Architecture: x86_64 Freestanding
 */

#ifndef _SECURECURTAIN_SCHED_H
#define _SECURECURTAIN_SCHED_H

#include <stdint.h>
#include <stddef.h>
#include <stdbool.h>

#define KERNEL_TASK_STACK_SIZE (32 * 1024) // 32 KB per kernel thread
#define DEFAULT_TIME_SLICE     5           // 5 ticks = 50ms at 100Hz
#define MAX_TASKS              64

typedef enum {
    PERSONALITY_NATIVE = 0,
    PERSONALITY_LINUX  = 1,
    PERSONALITY_WINDOWS = 2
} os_personality_t;

typedef enum {
    TASK_READY = 0,
    TASK_RUNNING,
    TASK_BLOCKED,
    TASK_SLEEPING,
    TASK_ZOMBIE
} task_state_t;

typedef void (*task_entry_t)(void);

/* Task Control Block (TCB) */
struct task {
    uint64_t pid;
    char name[32];
    task_state_t state;
    os_personality_t personality; // Dual-persona isolation (Linux vs Windows)
    uint64_t rsp;                 // Saved kernel stack pointer (%rsp)
    uint64_t user_rsp;            // Userland stack pointer (Ring 3)
    uint64_t user_entry_point;    // Userland entry point instruction pointer (Ring 3 RIP)
    bool is_user_mode;            // Flag indicating Ring 3 task
    uintptr_t cr3;                // PML4 physical memory space (CR3)
    uint64_t priority;            // Priority weight (1 = Low, 5 = Normal, 10 = Real-time)
    uint64_t time_slice;          // Allocated ticks per quantum
    uint64_t ticks_remaining;     // Remaining ticks in active quantum
    uint64_t sleep_until;         // Tick threshold for waking up
    uint64_t total_ticks;         // Total CPU ticks consumed
    void *stack_base;             // Allocated stack memory base
    size_t stack_size;
    task_entry_t entry_point;     // Task entry function pointer
    int exit_code;
    struct task *next;
};

/* Scheduler Statistics */
struct sched_stats {
    uint64_t total_tasks;
    uint64_t running_tasks;
    uint64_t sleeping_tasks;
    uint64_t total_context_switches;
    uint64_t uptime_ticks;
};

/* Scheduler Public Interface */
void sched_init(void);
struct task *sched_create_task(const char *name, task_entry_t entry, uint64_t priority);
void sched_yield(void);
void sched_tick(void *frame);
void sched_sleep(uint64_t ticks);
void sched_exit(int exit_code);
struct task *sched_get_current(void);
struct sched_stats sched_get_stats(void);
void sched_dump_tasks(void);

#endif /* _SECURECURTAIN_SCHED_H */
