/* SecureCurtain OS - Preemptive Multitasking & Round-Robin Task Scheduler
 * Author: Jared Busby (jb7572)
 * Architecture: x86_64 Freestanding
 */

#include "sched.h"
#include "kernel.h"
#include "heap.h"
#include "vmm.h"
#include "idt.h"

extern void tss_set_rsp0(uint64_t rsp0);

static struct task *ready_queue_head = NULL;
static struct task *ready_queue_tail = NULL;
static struct task *sleeping_queue_head = NULL;

static struct task *current_task = NULL;
static struct task *idle_task = NULL;
static struct task kernel_init_task; // PID 0 (Initial kernel bootstrap context)

static uint64_t next_pid = 0;
static uint64_t global_uptime_ticks = 0;
static uint64_t total_context_switches = 0;

/* Low-level Context Switch in x86_64 Long Mode
 * System V AMD64 ABI registers: rdi = prev_rsp, rsi = next_rsp, rdx = next_cr3
 * Callee-saved registers: rbx, rbp, r12, r13, r14, r15, rflags
 */
__attribute__((naked))
static void cpu_switch_context(uint64_t *prev_rsp, uint64_t next_rsp, uintptr_t next_cr3) {
    __asm__ volatile (
        "push %rbx\n\t"
        "push %rbp\n\t"
        "push %r12\n\t"
        "push %r13\n\t"
        "push %r14\n\t"
        "push %r15\n\t"
        "pushfq\n\t"

        "mov %rsp, (%rdi)\n\t"    // Save current RSP into *prev_rsp
        "mov %rsi, %rsp\n\t"      // Switch RSP to next_rsp

        // Switch address space (CR3) if next_cr3 is provided and different
        "test %rdx, %rdx\n\t"
        "jz 1f\n\t"
        "mov %cr3, %rax\n\t"
        "cmp %rdx, %rax\n\t"
        "je 1f\n\t"
        "mov %rdx, %cr3\n\t"
        "1:\n\t"

        "popfq\n\t"
        "pop %r15\n\t"
        "pop %r14\n\t"
        "pop %r13\n\t"
        "pop %r12\n\t"
        "pop %rbp\n\t"
        "pop %rbx\n\t"
        "ret\n\t"
    );
}

/* Trampoline executed when a newly created task starts for the first time */
static void task_trampoline(void) {
    // Enable hardware interrupts
    __asm__ volatile ("sti");

    if (current_task && current_task->entry_point) {
        current_task->entry_point();
    }

    sched_exit(0);
}

/* Enqueue a task to the tail of the ready queue */
static void enqueue_ready(struct task *t) {
    if (!t) return;
    t->state = TASK_READY;
    t->next = NULL;

    if (!ready_queue_head) {
        ready_queue_head = t;
        ready_queue_tail = t;
    } else {
        ready_queue_tail->next = t;
        ready_queue_tail = t;
    }
}

/* Dequeue the next task from the head of the ready queue */
static struct task *dequeue_ready(void) {
    if (!ready_queue_head) return NULL;

    struct task *t = ready_queue_head;
    ready_queue_head = ready_queue_head->next;
    if (!ready_queue_head) {
        ready_queue_tail = NULL;
    }
    t->next = NULL;
    return t;
}

/* Idle Task Routine (Runs HLT when no other tasks are runnable) */
static void idle_task_routine(void) {
    for (;;) {
        __asm__ volatile ("hlt");
    }
}

struct task *sched_create_task(const char *name, task_entry_t entry, uint64_t priority) {
    struct task *t = (struct task *)kmalloc(sizeof(struct task));
    if (!t) {
        serial_puts("[SCHED] Error: Out of memory allocating TCB!\n");
        return NULL;
    }

    // Allocate thread kernel stack (32 KB)
    void *stack = kmalloc(KERNEL_TASK_STACK_SIZE);
    if (!stack) {
        serial_puts("[SCHED] Error: Out of memory allocating task stack!\n");
        kfree(t);
        return NULL;
    }

    t->pid = next_pid++;
    
    // Copy name safely
    size_t i = 0;
    if (name) {
        while (name[i] && i < 31) {
            t->name[i] = name[i];
            i++;
        }
    }
    t->name[i] = '\0';

    t->state = TASK_READY;
    t->cr3 = 0; // Inherit kernel page tables
    t->priority = (priority > 0 && priority <= 10) ? priority : 5;
    t->time_slice = DEFAULT_TIME_SLICE * t->priority;
    t->ticks_remaining = t->time_slice;
    t->sleep_until = 0;
    t->total_ticks = 0;
    t->stack_base = stack;
    t->stack_size = KERNEL_TASK_STACK_SIZE;
    t->entry_point = entry;
    t->exit_code = 0;
    t->next = NULL;

    // Set up initial stack frame for x86_64 context switch
    uint64_t *stack_top = (uint64_t *)((uintptr_t)stack + KERNEL_TASK_STACK_SIZE);
    // Align to 16 bytes
    stack_top = (uint64_t *)((uintptr_t)stack_top & ~0xFULL);

    // Simulated stack frame for cpu_switch_context:
    // [0] return address (task_trampoline)
    // [1] rflags (0x202 = IF enabled)
    // [2] r15
    // [3] r14
    // [4] r13
    // [5] r12
    // [6] rbp
    // [7] rbx
    *(--stack_top) = (uint64_t)task_trampoline; // Return address for ret
    *(--stack_top) = 0x202;                     // RFLAGS (Interrupts enabled)
    *(--stack_top) = 0;                         // R15
    *(--stack_top) = 0;                         // R14
    *(--stack_top) = 0;                         // R13
    *(--stack_top) = 0;                         // R12
    *(--stack_top) = 0;                         // RBP
    *(--stack_top) = 0;                         // RBX

    t->rsp = (uint64_t)stack_top;

    enqueue_ready(t);

    serial_puts("[SCHED] Created Task PID ");
    serial_putc('0' + (t->pid % 10));
    serial_puts(": ");
    serial_puts(t->name);
    serial_puts("\n");

    return t;
}

void sched_yield(void) {
    __asm__ volatile ("cli");

    struct task *prev = current_task;
    struct task *next = dequeue_ready();

    if (!next) {
        // If ready queue is empty, keep running current task or idle
        if (prev && prev->state == TASK_RUNNING) {
            __asm__ volatile ("sti");
            return;
        }
        next = idle_task;
    }

    if (prev && prev->state == TASK_RUNNING) {
        enqueue_ready(prev);
    }

    current_task = next;
    current_task->state = TASK_RUNNING;
    current_task->ticks_remaining = current_task->time_slice;
    total_context_switches++;

    // Update TSS Ring 0 stack pointer to top of new task's kernel stack
    uint64_t kernel_stack_top = (uint64_t)current_task->stack_base + current_task->stack_size;
    tss_set_rsp0(kernel_stack_top);

    cpu_switch_context(&prev->rsp, next->rsp, next->cr3);

    __asm__ volatile ("sti");
}

void sched_tick(void *frame) {
    (void)frame;
    global_uptime_ticks++;

    if (!current_task) return;

    current_task->total_ticks++;

    // 1. Wake up sleeping tasks whose sleep timer has expired
    struct task **curr = &sleeping_queue_head;
    while (*curr != NULL) {
        struct task *s = *curr;
        if (global_uptime_ticks >= s->sleep_until) {
            *curr = s->next;
            enqueue_ready(s);
        } else {
            curr = &(*curr)->next;
        }
    }

    // 2. Preempt current task if its time slice has expired
    if (current_task->ticks_remaining > 0) {
        current_task->ticks_remaining--;
    }

    if (current_task->ticks_remaining == 0) {
        sched_yield();
    }
}

void sched_sleep(uint64_t ticks) {
    if (ticks == 0) {
        sched_yield();
        return;
    }

    __asm__ volatile ("cli");
    current_task->state = TASK_SLEEPING;
    current_task->sleep_until = global_uptime_ticks + ticks;
    
    // Add to sleeping queue
    current_task->next = sleeping_queue_head;
    sleeping_queue_head = current_task;

    sched_yield();
}

void sched_exit(int exit_code) {
    __asm__ volatile ("cli");

    serial_puts("[SCHED] Task PID ");
    serial_putc('0' + (current_task->pid % 10));
    serial_puts(" (");
    serial_puts(current_task->name);
    serial_puts(") terminated with exit code ");
    serial_putc('0' + (exit_code % 10));
    serial_puts(".\n");

    current_task->state = TASK_ZOMBIE;
    current_task->exit_code = exit_code;

    // Yield to the next runnable task (zombie will never be re-enqueued)
    sched_yield();

    // Should never reach here
    for (;;) {
        __asm__ volatile ("hlt");
    }
}

struct task *sched_get_current(void) {
    return current_task;
}

struct sched_stats sched_get_stats(void) {
    struct sched_stats stats;
    stats.total_tasks = next_pid;
    stats.running_tasks = 1;
    stats.sleeping_tasks = 0;
    stats.total_context_switches = total_context_switches;
    stats.uptime_ticks = global_uptime_ticks;

    struct task *t = sleeping_queue_head;
    while (t) {
        stats.sleeping_tasks++;
        t = t->next;
    }
    return stats;
}

void sched_dump_tasks(void) {
    serial_puts("\n=== SECURECURTAIN OS TASK TABLE ===\n");
    serial_puts("PID | NAME                 | STATE   | PRIO | TICKS\n");
    serial_puts("----+----------------------+---------+------+------\n");

    if (current_task) {
        serial_putc('0' + (current_task->pid % 10));
        serial_puts("   | ");
        serial_puts(current_task->name);
        serial_puts("                 | RUNNING | ");
        serial_putc('0' + (current_task->priority % 10));
        serial_puts("    | ");
        serial_putc('0' + (current_task->total_ticks % 10));
        serial_puts("\n");
    }

    struct task *t = ready_queue_head;
    while (t) {
        serial_putc('0' + (t->pid % 10));
        serial_puts("   | ");
        serial_puts(t->name);
        serial_puts("                 | READY   | ");
        serial_putc('0' + (t->priority % 10));
        serial_puts("    | ");
        serial_putc('0' + (t->total_ticks % 10));
        serial_puts("\n");
        t = t->next;
    }
    serial_puts("===================================\n\n");
}

void sched_init(void) {
    serial_puts("[SCHED] Initializing Preemptive Round-Robin Multitasking Engine...\n");

    ready_queue_head = NULL;
    ready_queue_tail = NULL;
    sleeping_queue_head = NULL;
    total_context_switches = 0;
    global_uptime_ticks = 0;
    next_pid = 0;

    // 1. Initialize bootstrap task (PID 0: Kernel Main)
    kernel_init_task.pid = next_pid++;
    kernel_init_task.name[0] = 'k';
    kernel_init_task.name[1] = 'm';
    kernel_init_task.name[2] = 'a';
    kernel_init_task.name[3] = 'i';
    kernel_init_task.name[4] = 'n';
    kernel_init_task.name[5] = '\0';
    kernel_init_task.state = TASK_RUNNING;
    kernel_init_task.rsp = 0;
    kernel_init_task.cr3 = 0;
    kernel_init_task.priority = 5;
    kernel_init_task.time_slice = DEFAULT_TIME_SLICE * 5;
    kernel_init_task.ticks_remaining = kernel_init_task.time_slice;
    kernel_init_task.sleep_until = 0;
    kernel_init_task.total_ticks = 0;
    kernel_init_task.stack_base = (void *)(KERNEL_VIRTUAL_BASE + 0x100000);
    kernel_init_task.stack_size = 0x20000;
    kernel_init_task.entry_point = NULL;
    kernel_init_task.exit_code = 0;
    kernel_init_task.next = NULL;

    current_task = &kernel_init_task;

    // 2. Spawn idle task (PID 1)
    idle_task = sched_create_task("idle", idle_task_routine, 1);
    // Remove idle task from ready queue so it is only scheduled when no other tasks exist
    ready_queue_head = NULL;
    ready_queue_tail = NULL;

    // 3. Register scheduler timer tick with IDT Vector 32 (APIC / PIT timer)
    idt_register_handler(32, (irq_handler_t)sched_tick);

    serial_puts("[SCHED] Multitasking initialized. PID 0 active, 100Hz preemption armed.\n");
}
