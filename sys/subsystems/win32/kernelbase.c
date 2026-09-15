#include <stdint.h>

static uint32_t current_thread_error = 0;

uint32_t __attribute__((stdcall)) GetLastError(void) {
    return current_thread_error;
}

void __attribute__((stdcall)) SetLastError(uint32_t dwErrCode) {
    current_thread_error = dwErrCode;
}

void __attribute__((stdcall)) DebugBreak(void) {
    // Execute a physical CPU software breakpoint trap instruction
    __asm__("int3"); 
}
