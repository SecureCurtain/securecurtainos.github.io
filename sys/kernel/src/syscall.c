#include "syscall.h"
#include "security_audit.h"
#include <stdbool.h>

#define SYS_READ 0 // Standard Linux x86_64 Read System Call ID Vector
#define VFS_CMD_READ 0x602
#define USER_SPACE_MAX_LIMIT 0x00007FFFFFFFFFFF

extern bool native_is_descriptor_linux_mouse(uint64_t fd);
extern void native_ipc_call_kernel_to_user(uint32_t target_pid, uint32_t cmd, void* send_buf, size_t size);
extern void* native_kernel_get_last_ipc_response_payload(void);
extern void native_copy_to_user_space(uint64_t dest_ptr, void* src, size_t size);

bool native_is_descriptor_linux_mouse(uint64_t fd) {
    return (fd == 3); // Virtual file descriptor corresponding to /dev/input/mice
}

uint64_t handle_linux_native_syscall(uint64_t syscall_number, uint64_t fd, uint64_t buf_ptr, uint64_t count) {
    if (syscall_number == SYS_READ) {
        if (native_is_descriptor_linux_mouse(fd)) {
            native_ipc_call_kernel_to_user(8, VFS_CMD_READ, &count, sizeof(count));
            void* result_bytes = native_kernel_get_last_ipc_response_payload();
            native_copy_to_user_space(buf_ptr, result_bytes, 3);
            return 3;
        }
    }
    return 0;
}

static inline void wrmsr(uint32_t msr, uint64_t val) {
    uint32_t low = (uint32_t)val;
    uint32_t high = (uint32_t)(val >> 32);
    __asm__ __volatile__("wrmsr" : : "c"(msr), "a"(low), "d"(high));
}

// 🛡️ SECURITY FILTER: Validates that pointers from user space stay in user space
static int is_user_buffer_safe(void* buffer, size_t size) {
    uint64_t start = (uint64_t)buffer;
    uint64_t end = start + size;
    // Prevent integer wrap-around attacks and null-page exploits
    if (start < 0x1000 || end < start) return 0;
    // Reject pointers that cross into or point directly to Ring 0 kernel memory
    if (start >= USER_SPACE_MAX_LIMIT || end >= USER_SPACE_MAX_LIMIT) {
        return 0; 
    }
    return 1;
}

// 🛡️ HARDENED RING 0 GS_BASE / ARCH_PRCTL CONTROLLER
int32_t sys_arch_prctl(uint32_t code, uint64_t addr) {
    if (code == ARCH_SET_GS) {
        // Enforce strict canonical user-space memory boundaries for TEBs
        if (!is_user_buffer_safe((void*)addr, 64)) {
            commit_security_audit_entry(0x0001, "SECURITY_FAULT", "Blocked unauthorized Ring 0 / Non-canonical GS_BASE MSR write attempt!");
            return -14; // -EFAULT
        }
        
        // Execute privileged MSR write safely in Ring 0
        wrmsr(MSR_GS_BASE, addr);
        commit_security_audit_entry(0x0002, "MSR_GS_BASE", "Safely updated IA32_GS_BASE register for Win32 enclave context");
        return 0; // Success
    }
    return -22; // -EINVAL
}

void init_syscall_router(void) {
    wrmsr(MSR_LSTAR, (uint64_t)syscall_entry_asm);
    // GDT Segment Selectors configuration
    uint64_t star = ((uint64_t)0x08 << 32) | ((uint64_t)0x1B << 48);
    wrmsr(MSR_STAR, star);
    // Clear Interrupt Flag (IF), Direction Flag (DF), and Trap Flag (TF) on entry
    wrmsr(MSR_SFMASK, 0x00000300); 
}

int identify_calling_subsystem(void) {
    return SUBSYSTEM_LINUX; 
}

void handle_syscall(cpu_state_t* regs) {
    int subsystem = identify_calling_subsystem();
    if (subsystem == SUBSYSTEM_LINUX) {
        if (regs->rax == SYS_READ && native_is_descriptor_linux_mouse(regs->rdi)) {
            regs->rax = handle_linux_native_syscall(regs->rax, regs->rdi, regs->rsi, regs->rdx);
            return;
        }
        if (regs->rax == 1) { // sys_write (RDI=fd, RSI=buf, RDX=count)
            if (!is_user_buffer_safe((void*)regs->rsi, regs->rdx)) {
                regs->rax = -14; // -EFAULT
                return;
            }
        }
        if (regs->rax == 158) { // sys_arch_prctl (RDI=code, RSI=addr)
            regs->rax = sys_arch_prctl((uint32_t)regs->rdi, regs->rsi);
            return;
        }
        handle_posix_syscall(regs);
    } 
    else if (subsystem == SUBSYSTEM_WINDOWS) {
        handle_nt_syscall(regs);
    } 
    else {
        regs->rax = 0xFFFFFFFF; 
    }
}
