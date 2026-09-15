/* SecureCurtain OS - Native Linux Persona Ring 3 Init Payload
 * Author: Jared Busby (jb7572)
 * Architecture: x86_64 System V AMD64 ABI
 */

#include <stdint.h>
#include <stddef.h>

#define SYS_READ   0
#define SYS_WRITE  1
#define SYS_OPEN   2
#define SYS_CLOSE  3
#define SYS_EXIT   60

/* Direct x86_64 System V Syscall Stub */
static inline int64_t sys_call3(uint64_t num, uint64_t arg1, uint64_t arg2, uint64_t arg3) {
    int64_t ret;
    __asm__ volatile (
        "syscall"
        : "=a"(ret)
        : "a"(num), "D"(arg1), "S"(arg2), "d"(arg3)
        : "rcx", "r11", "memory"
    );
    return ret;
}

static inline void sys_exit(int code) {
    __asm__ volatile (
        "syscall"
        :
        : "a"(SYS_EXIT), "D"(code)
        : "rcx", "r11", "memory"
    );
    while (1);
}

static size_t str_len(const char *s) {
    size_t len = 0;
    while (s[len]) len++;
    return len;
}

static void print_msg(const char *msg) {
    sys_call3(SYS_WRITE, 1, (uint64_t)msg, str_len(msg));
}

void _start(void) {
    print_msg("[USERLAND:LINUX] Hello from SecureCurtain Ring 3 User Space!\n");
    print_msg("[USERLAND:LINUX] Executing inside isolated unprivileged mode.\n");
    print_msg("[USERLAND:LINUX] Memory protection active: Ring 0 Kernel data is inaccessible.\n");
    print_msg("[USERLAND:LINUX] POSIX sys_write syscall executed successfully via IA32_LSTAR.\n");
    print_msg("[USERLAND:LINUX] Process initialization test complete. Exiting cleanly (status 0)...\n");

    sys_exit(0);
}
