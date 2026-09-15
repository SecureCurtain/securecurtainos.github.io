#pragma once
#include <stdint.h>
#include <stddef.h>

#define MAX_THREADS          64
#define DEFAULT_TIME_SLICE   10  // Hardware timer ticks allocated per execution loop

// Thread Execution States
#define STATE_READY          0
#define STATE_RUNNING        1
#define STATE_BLOCKED        2
#define STATE_DEAD           3

// Subsystem Personality Isolation Targets
#define PERSONALITY_LINUX    1
#define PERSONALITY_WINDOWS  2

// 🛡️ SECURE THREAD CONTROL BLOCK (TCB)
typedef struct {
    uint32_t thread_id;       // Unique thread identification token
    uint32_t process_id;      // Parent process tracking boundary index
    uint8_t  state;           // Current lifecycle execution state
    uint8_t  personality;     // Environment proxy layout (Linux vs Windows)
    uint32_t time_slice;      // 🛡️ Remaining execution quota before mandatory preemption
    
    uint64_t vm_space_root;   // The validated PML4 (CR3) memory root address 
    
    uint64_t kernel_stack_top;// 🛡️ Isolated Ring 0 execution stack (loaded into TSS on switch)
    uint64_t saved_rsp;       // Pointer to the thread's saved register frame within its kernel stack
} tcb_t;

// ------------------------------------------------------------------------------
// Microkernel Scheduling Engine Interfaces
// ------------------------------------------------------------------------------

/**
 * Looks up a Thread Control Block (TCB) pointer by thread ID.
 */
tcb_t* get_tcb_by_id(int thread_id);

/**
 * Initializes the core task scheduling queues and prepares the thread table.
 */
void init_scheduler(void);

/**
 * Creates an isolated execution context thread inside the system.
 * 
 * @param entry_point The target code virtual memory starting location.
 * @param user_stack_base The target unprivileged application stack memory block.
 * @param personality Subsystem identification marker (e.g., PERSONALITY_LINUX).
 * @param vm_space The secure virtual address directory root (vm_space_t handle).
 */
int scheduler_create_thread(uint64_t entry_point, uint64_t user_stack_base, uint8_t personality, uint64_t vm_space);

/**
 * 🛡️ INTERRUPT-DRIVEN HARDWARE CONTEXT SWITCHER
 * Core kernel multiplexer called exclusively by interrupt/exception assembly frames.
 * Updates quotas and modifies the machine register state pointer to transition contexts.
 * 
 * @param current_rsp Pointer to the current CPU register snapshot container on the stack.
 * @return uint64_t The address of the NEW thread's saved register container to reload.
 */
uint64_t scheduler_context_switch(uint64_t current_rsp);