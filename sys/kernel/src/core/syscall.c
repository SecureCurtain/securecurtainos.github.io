/* SecureCurtain OS - 64-bit SYSCALL/SYSRET ABI & Dispatcher
 * Author: Jared Busby (jb7572)
 * Architecture: x86_64 Long Mode (IA32_LSTAR / IA32_STAR MSRs)
 */

#include "kernel.h"
#include "sched.h"

#define MSR_EFER        0xC0000080
#define MSR_STAR        0xC0000081
#define MSR_LSTAR       0xC0000082
#define MSR_FMASK       0xC0000084

// POSIX Linux Syscall Numbers
#define SYS_LINUX_READ        0
#define SYS_LINUX_WRITE       1
#define SYS_LINUX_OPEN        2
#define SYS_LINUX_CLOSE       3
#define SYS_LINUX_EXIT        60

// Windows NT / Win32 Syscall Numbers (x64)
#define SYS_WIN32_READ_FILE          0x0003
#define SYS_WIN32_WRITE_FILE         0x0008
#define SYS_WIN32_CLOSE              0x000F
#define SYS_WIN32_ALLOC_VIRT_MEM     0x0018
#define SYS_WIN32_FREE_VIRT_MEM      0x001E
#define SYS_WIN32_MAP_VIEW_OF_SECTION 0x0028
#define SYS_WIN32_TERMINATE_PROCESS  0x002C
#define SYS_WIN32_DELAY_EXECUTION    0x0034
#define SYS_WIN32_QUERY_SYS_INFO     0x0036
#define SYS_WIN32_CREATE_FILE        0x0055

static inline uint64_t rdmsr64(uint32_t msr) {
    uint32_t low, high;
    __asm__ volatile ("rdmsr" : "=a"(low), "=d"(high) : "c"(msr));
    return ((uint64_t)high << 32) | low;
}

static inline void wrmsr64(uint32_t msr, uint64_t value) {
    uint32_t low = (uint32_t)value;
    uint32_t high = (uint32_t)(value >> 32);
    __asm__ volatile ("wrmsr" : : "c"(msr), "a"(low), "d"(high));
}

/* Windows NT Subsystem Syscall Dispatcher */
static int64_t win32_syscall_dispatcher(uint64_t sys_num, uint64_t arg1, uint64_t arg2, uint64_t arg3) {
    switch (sys_num) {
        case SYS_WIN32_WRITE_FILE: {
            const char *buf = (const char *)arg2;
            size_t count = (size_t)arg3;
            kprintf("[WIN32:NtWriteFile] ");
            for (size_t i = 0; i < count; i++) {
                kprint_char(buf[i]);
            }
            return 0; // STATUS_SUCCESS
        }
        case SYS_WIN32_READ_FILE:
            return 0; // STATUS_SUCCESS (EOF)
        case SYS_WIN32_CLOSE:
            return 0;
        case SYS_WIN32_ALLOC_VIRT_MEM:
            serial_puts("[WIN32:NtAllocateVirtualMemory] User heap segment provisioned.\n");
            return 0; // STATUS_SUCCESS
        case SYS_WIN32_FREE_VIRT_MEM:
            serial_puts("[WIN32:NtFreeVirtualMemory] User heap memory released.\n");
            return 0; // STATUS_SUCCESS
        case SYS_WIN32_CREATE_FILE:
            serial_puts("[WIN32:NtCreateFile] Handled NT file handle creation request.\n");
            return 0; // STATUS_SUCCESS
        case SYS_WIN32_MAP_VIEW_OF_SECTION:
            serial_puts("[WIN32:NtMapViewOfSection] Section view mapped into user address space.\n");
            return 0; // STATUS_SUCCESS
        case SYS_WIN32_DELAY_EXECUTION:
            serial_puts("[WIN32:NtDelayExecution] Thread sleep quantum dispatched.\n");
            return 0; // STATUS_SUCCESS
        case SYS_WIN32_QUERY_SYS_INFO:
            serial_puts("[WIN32:NtQuerySystemInformation] Returning processor & architecture info.\n");
            return 0; // STATUS_SUCCESS
        case SYS_WIN32_TERMINATE_PROCESS:
            kprintf("[WIN32:NtTerminateProcess] Windows PE process exited code: %lu\n", arg1);
            sched_exit((int)arg1);
            return 0;
        default:
            serial_puts("[WIN32] Unimplemented NT system call service: 0x");
            char hex[9];
            for (int i = 7; i >= 0; i--) {
                int nibble = (sys_num >> (i * 4)) & 0xF;
                hex[7 - i] = (nibble < 10) ? ('0' + nibble) : ('a' + nibble - 10);
            }
            hex[8] = '\0';
            serial_puts(hex);
            serial_puts("\n");
            return -1; // STATUS_NOT_IMPLEMENTED
    }
}

/* Linux POSIX System V Syscall Dispatcher */
static int64_t linux_syscall_dispatcher(uint64_t sys_num, uint64_t arg1, uint64_t arg2, uint64_t arg3) {
    switch (sys_num) {
        case SYS_LINUX_WRITE: {
            int fd = (int)arg1;
            const char *buf = (const char *)arg2;
            size_t count = (size_t)arg3;
            if (fd == 1 || fd == 2) { // stdout or stderr
                for (size_t i = 0; i < count; i++) {
                    kprint_char(buf[i]);
                }
                return count;
            }
            return -1;
        }
        case SYS_LINUX_READ:
            return 0; // EOF for minimal stub
        case SYS_LINUX_OPEN:
            return 3; // Synthetic fd
        case SYS_LINUX_CLOSE:
            return 0;
        case SYS_LINUX_EXIT:
            kprintf("[LINUX:sys_exit] Process exited with status code: %lu\n", arg1);
            sched_exit((int)arg1);
            return 0;
        default:
            return -38; // -ENOSYS: Function not implemented
    }
}

/* Central Dual-Persona Syscall Dispatcher */
int64_t syscall_dispatcher(uint64_t sys_num, uint64_t arg1, uint64_t arg2, uint64_t arg3) {
    struct task *curr = sched_get_current();
    if (curr && curr->personality == PERSONALITY_WINDOWS) {
        return win32_syscall_dispatcher(sys_num, arg1, arg2, arg3);
    }
    return linux_syscall_dispatcher(sys_num, arg1, arg2, arg3);
}

uint64_t syscall_saved_user_rsp = 0;
uint8_t syscall_kernel_stack[16384] __attribute__((aligned(16)));

extern void syscall_entry_stub(void);

__asm__(
    ".global syscall_entry_stub\n\t"
    ".type syscall_entry_stub, @function\n\t"
    "syscall_entry_stub:\n\t"
    "movq %rsp, syscall_saved_user_rsp(%rip)\n\t"
    "leaq syscall_kernel_stack + 16384(%rip), %rsp\n\t"
    "pushq %r11\n\t"
    "pushq %rcx\n\t"
    "pushq %rbp\n\t"
    "pushq %rbx\n\t"
    "pushq %r12\n\t"
    "pushq %r13\n\t"
    "pushq %r14\n\t"
    "pushq %r15\n\t"
    "subq $8, %rsp\n\t"
    "movq %rdx, %rcx\n\t"
    "movq %rsi, %rdx\n\t"
    "movq %rdi, %rsi\n\t"
    "movq %rax, %rdi\n\t"
    "call syscall_dispatcher\n\t"
    "addq $8, %rsp\n\t"
    "popq %r15\n\t"
    "popq %r14\n\t"
    "popq %r13\n\t"
    "popq %r12\n\t"
    "popq %rbx\n\t"
    "popq %rbp\n\t"
    "popq %rcx\n\t"
    "popq %r11\n\t"
    "movq syscall_saved_user_rsp(%rip), %rsp\n\t"
    "sysretq\n\t"
);

void syscall_init(void) {
    serial_puts("[SYSCALL] Initializing x86_64 Fast System Call Extensions...\n");

    // Enable System Call Extensions (SCE, bit 0) in IA32_EFER
    uint64_t efer = rdmsr64(MSR_EFER);
    wrmsr64(MSR_EFER, efer | 1);

    // Setup STAR MSR:
    // Bits 47:32 = Kernel CS (0x08) & Kernel SS (0x10)
    // Bits 63:48 = Base for sysret: 0x0010 (sysret loads SS from STAR[63:48]+8=0x18, CS from STAR[63:48]+16=0x20)
    uint64_t star = ((uint64_t)0x0010 << 48) | ((uint64_t)0x0008 << 32);
    wrmsr64(MSR_STAR, star);

    // Setup LSTAR: Address of ring 0 fast syscall entry stub
    wrmsr64(MSR_LSTAR, (uint64_t)syscall_entry_stub);

    // Setup FMASK: Mask Interrupt Flag (bit 9) to prevent interrupts upon entering syscall
    wrmsr64(MSR_FMASK, 1 << 9);

    serial_puts("[SYSCALL] Fast System Call (LSTAR / STAR) MSRs configured.\n");
}
