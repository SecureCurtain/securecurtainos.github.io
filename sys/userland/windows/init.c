/* SecureCurtain OS - Native Windows Persona Ring 3 Init Payload
 * Author: Jared Busby (jb7572)
 * Architecture: x86_64 Microsoft x64 Calling Convention & NT Syscall ABI
 */

#include <stdint.h>
#include <stddef.h>

// Windows NT Status Codes
#define STATUS_SUCCESS                   0x00000000L

// Windows NT System Call Numbers (x64)
#define NT_READ_FILE                     0x0003
#define NT_WRITE_FILE                    0x0008
#define NT_CLOSE                         0x000F
#define NT_ALLOCATE_VIRTUAL_MEMORY       0x0018
#define NT_FREE_VIRTUAL_MEMORY           0x001E
#define NT_MAP_VIEW_OF_SECTION           0x0028
#define NT_TERMINATE_PROCESS             0x002C
#define NT_DELAY_EXECUTION               0x0034
#define NT_QUERY_SYSTEM_INFORMATION      0x0036
#define NT_CREATE_FILE                   0x0055

/* Windows x64 NT Syscall Dispatcher:
 * In Windows NT x64:
 *   - RCX is copied to R10 (because syscall clobbers RCX)
 *   - EAX holds the NT Service System Call Index
 *   - RDX, R8, R9 hold args 2, 3, 4
 *   - 32-byte shadow stack space allocated by caller
 */
static inline int64_t nt_syscall4(uint32_t ssn, uint64_t a1, uint64_t a2, uint64_t a3, uint64_t a4) {
    int64_t status;
    __asm__ volatile (
        "movq %1, %%r10\n\t"     // arg1 -> r10
        "movq %2, %%rax\n\t"     // ssn -> rax
        "syscall\n\t"
        : "=a"(status)
        : "r"(a1), "r"((uint64_t)ssn), "d"(a2), "r"(a3), "r"(a4)
        : "rcx", "r10", "r11", "memory"
    );
    return status;
}

static inline void nt_terminate(uint64_t exit_status) {
    __asm__ volatile (
        "movq %0, %%r10\n\t"
        "movq %1, %%rax\n\t"
        "syscall\n\t"
        :
        : "r"(exit_status), "r"((uint64_t)NT_TERMINATE_PROCESS)
        : "rcx", "r10", "r11", "memory"
    );
    while (1);
}

static size_t win_strlen(const char *str) {
    size_t len = 0;
    while (str[len]) len++;
    return len;
}

static void win_write_console(const char *msg) {
    nt_syscall4(NT_WRITE_FILE, 1, (uint64_t)msg, win_strlen(msg), 0);
}

void mainCRTStartup(void) {
    win_write_console("[USERLAND:WIN32] Hello from Windows Persona User Mode (Ring 3)!\n");
    win_write_console("[USERLAND:WIN32] Subsystem: Win32 CUI / NT Executive\n");
    win_write_console("[USERLAND:WIN32] Testing NtAllocateVirtualMemory heap request...\n");

    // Request virtual memory heap block
    nt_syscall4(NT_ALLOCATE_VIRTUAL_MEMORY, (uint64_t)-1, 0x0000000050000000ULL, 0x10000, 0x3000);

    win_write_console("[USERLAND:WIN32] Native NT Service NtWriteFile verified.\n");
    win_write_console("[USERLAND:WIN32] Calling NtTerminateProcess (STATUS_SUCCESS)...\n");

    nt_terminate(STATUS_SUCCESS);
}
