#include <stdint.h>
#include <stdbool.h>
#include "thread.h"

#define MAX_WAIT_OBJECTS 64
#define STATUS_WAIT_0    0x00000000
#define STATUS_TIMEOUT   0x00000102

extern thread_tcb_t* native_get_current_running_thread(void);
extern void          kernel_scheduler_yield(void);

typedef struct {
    uint32_t object_type; // 0 = Event, 1 = Mutex, 2 = Semaphore
    bool     is_signaled;
} nt_kernel_object_t;

/**
 * Implements the core multi-object blocking synchronization logic inside Ring 0
 * 
 * @param count        Number of object handles the application is watching
 * @param objects      Array of kernel synchronization primitives to evaluate
 * @param wait_all     If true, the thread stays blocked until ALL objects trigger
 * @return             Status indicating which object woke the thread up
 */
uint32_t kernel_nt_wait_for_multiple_objects(uint32_t count, nt_kernel_object_t** objects, bool wait_all) {
    if (count > MAX_WAIT_OBJECTS || count == 0) return 0xFFFFFFFF;
    
    thread_tcb_t* current_thread = native_get_current_running_thread();
    
    // Infinite verification tracking loop
    while (true) {
        uint32_t signaled_count = 0;
        uint32_t first_signaled_index = 0xFFFFFFFF;
        
        // Evaluate the real-time signaled flags of all passed descriptors
        for (uint32_t i = 0; i < count; i++) {
            if (objects[i]->is_signaled) {
                signaled_count++;
                if (first_signaled_index == 0xFFFFFFFF) {
                    first_signaled_index = i;
                }
            }
        }
        
        // Evaluation Check: Has our wake condition been met?
        if (wait_all && signaled_count == count) {
            return STATUS_WAIT_0; // All matched successfully
        } 
        else if (!wait_all && signaled_count > 0) {
            return STATUS_WAIT_0 + first_signaled_index; // At least one triggered
        }
        
        // If execution has not been unlocked, yield execution power to another task block
        current_thread->state = 2; // Set state to BLOCKED
        kernel_scheduler_yield(); // Relinquish CPU execution control frame
    }
}
