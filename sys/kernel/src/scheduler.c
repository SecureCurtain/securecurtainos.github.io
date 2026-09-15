#include "scheduler.h"
#include "gdt_idt.h" // Needed to update the Task State Segment (g_tss) dynamically
#include "syscall.h" // Accesses our structured cpu_state_t definition

// Assume standard 4KB frame tracking allocation constant
#define PAGE_SIZE 4096

// External reference to the global TSS instance managed inside gdt_idt.c
typedef struct {
    uint32_t reserved0;
    uint64_t rsp0;
    uint64_t rsp1;
    uint64_t rsp2;
    uint64_t reserved1;
    uint64_t ist[8];
    uint64_t reserved2;
    uint16_t reserved3;
    uint16_t iomap_base;
} __attribute__((packed)) external_tss_t;

extern external_tss_t g_tss;
extern void pmm_free_frame(void* frame);
extern void* pmm_alloc_frame(void);

static tcb_t thread_queue[MAX_THREADS];
static int   g_current_thread_index = -1;
static int   g_total_threads_registered = 0;

extern void print_string(const char* str, int row);

tcb_t* get_tcb_by_id(int thread_id) {
    if (thread_id < 0 || thread_id >= g_total_threads_registered) return NULL;
    return &thread_queue[thread_id];
}

void init_scheduler(void) {
    for (int i = 0; i < MAX_THREADS; i++) {
        thread_queue[i].state = STATE_DEAD;
    }
    g_current_thread_index = -1;
    g_total_threads_registered = 0;
    print_string("[OK] Preemptive Task Scheduler Engine Synchronized.", 15);
}

int scheduler_create_thread(uint64_t entry_point, uint64_t user_stack_base, uint8_t personality, uint64_t vm_space) {
    if (g_total_threads_registered >= MAX_THREADS) return -1;

    int new_index = g_total_threads_registered++;
    tcb_t* new_thread = &thread_queue[new_index];

    // 1. Allocate a pristine, dedicated Ring 0 stack frame for this thread
    void* kernel_stack_frame = pmm_alloc_frame();
    if (!kernel_stack_frame) return -1;
    
    uint64_t kernel_stack_top = (uint64_t)kernel_stack_frame + PAGE_SIZE;

    // 2. Initialize a complete cpu_state_t register stack footprint inside the kernel stack
    uint64_t* stack = (uint64_t*)kernel_stack_top;
    
    // We step backwards to build out our cpu_state_t structure sequentially
    stack[-1] = 0x23;             // user_ss   (Ring 3 Data Descriptor selector: 0x20 | 3)
    stack[-2] = user_stack_base;  // user_rsp  (The application's unprivileged user stack)
    stack[-3] = 0x202;            // rflags    (Interrupts enabled natively: IF bit set)
    stack[-4] = 0x1B;             // user_cs   (Ring 3 Code Descriptor selector: 0x18 | 3)
    stack[-5] = entry_point;      // rip       (Application entry point)
    
    // Zero out all 15 general-purpose registers inside our cpu_state_t structure
    for (int i = 6; i <= 20; i++) {
        stack[-i] = 0;
    }

    new_thread->thread_id = new_index;
    new_thread->process_id = new_index; // Mapping 1:1 for simplicity
    new_thread->state = STATE_READY;
    new_thread->personality = personality;
    new_thread->time_slice = DEFAULT_TIME_SLICE;
    new_thread->vm_space_root = vm_space;
    new_thread->kernel_stack_top = kernel_stack_top;
    
    // Point saved_rsp exactly to the lowest address of the newly instantiated stack snapshot
    new_thread->saved_rsp = (uint64_t)&stack[-20];

    return new_index;
}

// 🛡️ INTERRUPT-DRIVEN SECURE CONTEXT MULTIPLEXOR
// This function replaces your old cooperative schedule_next() loop.
uint64_t scheduler_context_switch(uint64_t current_rsp) {
    if (g_total_threads_registered == 0) return current_rsp;

    // Save the active execution state pointer back into the current TCB structure block
    if (g_current_thread_index != -1) {
        tcb_t* active_task = &thread_queue[g_current_thread_index];
        active_task->saved_rsp = current_rsp;
        
        // Handle time slices cleanly
        if (active_task->time_slice > 0) {
            active_task->time_slice--;
        }

        if (active_task->state == STATE_RUNNING) {
            active_task->state = STATE_READY;
        }
    }

    // Run the selection sequence (Round-Robin)
    int next_index = (g_current_thread_index + 1) % g_total_threads_registered;
    uint64_t security_loop_count = MAX_THREADS;

    while (thread_queue[next_index].state != STATE_READY && thread_queue[next_index].state != STATE_RUNNING) {
        next_index = (next_index + 1) % g_total_threads_registered;
        if (--security_loop_count == 0) {
            // Panic fallback: No executable processes found, idle context loop
            return current_rsp; 
        }
    }

    g_current_thread_index = next_index;
    tcb_t* target_task = &thread_queue[g_current_thread_index];
    target_task->state = STATE_RUNNING;
    target_task->time_slice = DEFAULT_TIME_SLICE; // Re-allocate execution quota

    // 🛡️ SECURITY STEP 1: Swap virtual memory directories safely via CR3 register
    // This updates physical translation maps instantly, preventing cross-process snooping.
    __asm__ __volatile__("mov %0, %%cr3" : : "r"(target_task->vm_space_root) : "memory");

    // 🛡️ SECURITY STEP 2: Update global TSS structure root stack location
    // This ensures that the NEXT time a system call or interrupt triggers, the CPU
    // targets this thread's secure kernel stack, preventing cross-thread state pollution.
    g_tss.rsp0 = target_task->kernel_stack_top;

    // Return the new target execution address pointer back to your assembly intercept stubs
    return target_task->saved_rsp;
}
