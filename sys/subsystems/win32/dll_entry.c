#include <stdint.h>
#include <stddef.h>
#include <stdbool.h>

/**
 * Standard PE/COFF dynamic link library entry point for Win32.
 * Called by Windows loader during process/thread attachment and detachment.
 */
bool __attribute__((stdcall)) DllMain(void* hinstDLL, uint32_t fdwReason, void* lpReserved) {
    (void)hinstDLL;
    (void)fdwReason;
    (void)lpReserved;
    return true; // TRUE indicates initialization succeeded
}

/**
 * MinGW CRT default entry symbol expected by the linker.
 * Returns TRUE (1) to indicate initialization success.
 */
int __attribute__((stdcall)) DllMainCRTStartup(void* hinstDLL, uint32_t fdwReason, void* lpReserved) {
    return DllMain(hinstDLL, fdwReason, lpReserved) ? 1 : 0;
}

/**
 * Clean-room native microkernel IPC system call bridge for Win32 proxy DLLs.
 * Dispatches commands to Ring 0 kernel or subsystem daemon via x86_64 syscall instruction.
 */
__attribute__((visibility("default")))
void native_ipc_call(uint32_t cmd, void* payload, size_t size) {
    register uint64_t r_rax __asm__("rax") = (uint64_t)cmd;
    register void*    r_rdi __asm__("rdi") = payload;
    register size_t   r_rsi __asm__("rsi") = size;
    __asm__ __volatile__(
        "syscall"
        : "+r"(r_rax)
        : "r"(r_rdi), "r"(r_rsi)
        : "rcx", "r11", "memory"
    );
}

/**
 * Clean-room IPC system call bridge with synchronous target PID response routing.
 */
__attribute__((visibility("default")))
void native_ipc_call_with_response(uint32_t target_pid, uint32_t cmd, void* send_buf, size_t size, void* recv_buf) {
    (void)recv_buf;
    register uint64_t r_rax __asm__("rax") = (uint64_t)cmd;
    register uint64_t r_rdi __asm__("rdi") = (uint64_t)target_pid;
    register void*    r_rsi __asm__("rsi") = send_buf;
    register size_t   r_rdx __asm__("rdx") = size;
    __asm__ __volatile__(
        "syscall"
        : "+r"(r_rax)
        : "r"(r_rdi), "r"(r_rsi), "r"(r_rdx)
        : "rcx", "r11", "memory"
    );
}
