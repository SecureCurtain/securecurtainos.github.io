#pragma once
#include <stdint.h>

// 1. Define the system environment personalities
typedef enum {
    PERSONALITY_NATIVE  = 0,
    PERSONALITY_WIN32   = 1
} thread_personality_t;

// 2. Locate your existing Thread Control Block (TCB) structure and add the flag
typedef struct {
    uint64_t             thread_id;
    uint64_t             process_id;
    uint64_t             cpu_registers[16]; // Saved state (RAX, RBX, etc.)
    void*                stack_pointer;
    
    // ADD THIS LINE HERE: Tracks if this thread is running inside the Windows sandbox
    thread_personality_t personality; 
    
    uint32_t             state;             // RUNNING, BLOCKED, SLEEPING
} thread_tcb_t;