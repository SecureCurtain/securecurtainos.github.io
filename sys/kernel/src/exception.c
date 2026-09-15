#include <stdint.h>
#include "thread.h"

// Mock external declarations representing your system's IPC and task manager
extern thread_tcb_t* native_get_current_running_thread(void);
extern void          native_ipc_send_to_subsystem(uint64_t subsystem_pid, uint32_t code, void* context);
extern void          native_terminate_thread(thread_tcb_t* thread);
extern void          print_kernel_panic(const char* msg, uint32_t code);

#define SUBSYSTEM_PID_WIN32     5
#define EXCEPTION_CODE_SEH      0xC0000005 // Windows Access Violation Code

/**
 * Central CPU Exception routing trap handler invoked from Ring 0 assembly interrupts
 */
void kernel_handle_cpu_exception(uint32_t exception_vector, uint64_t faulting_address) {
    // 1. Fetch the currently executing thread context descriptor
    thread_tcb_t* current_thread = native_get_current_running_thread();
    
    // 2. ROUTING BRANCH: Check if the thread belongs to the Windows environment
    if (current_thread->personality == PERSONALITY_WIN32) {
        
        // Structure the current CPU state to ship across the internal IPC tracks
        struct {
            uint64_t thread_id;
            uint32_t win32_exception_type;
            uint64_t target_fault_address;
        } exception_packet;
        
        exception_packet.thread_id            = current_thread->thread_id;
        exception_packet.win32_exception_type = EXCEPTION_CODE_SEH;
        exception_packet.target_fault_address = faulting_address;
        
        // 3. Route the execution state back out to user-space nt_env.bin to handle structured exceptions
        native_ipc_send_to_subsystem(SUBSYSTEM_PID_WIN32, exception_vector, &exception_packet);
        
        // 4. Suspend this thread securely; do not let it execute further until nt_env.bin responds
        current_thread->state = 2; // BLOCKED state
        return;
    }
    
    // 5. FALLBACK: Native applications trigger an immediate kernel panic crash sequence
    print_kernel_panic("Fatal Native Exception. System Halted.", exception_vector);
    while(1);
}
