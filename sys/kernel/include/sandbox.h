#pragma once
#include <stdint.h>
#include <stdbool.h>

#define MAX_SANDBOXED_PROCESSES 32
#define USER_SPACE_MIN_ADDR     0x0000400000000000 // Standard isolated layout lower bound
#define USER_SPACE_MAX_ADDR     0x00007FFFFFFFFFFF // Standard isolated layout upper bound

typedef struct {
    uint32_t process_id;
    uint64_t virtual_memory_root; // Physical CR3 page directory pointer context
    uint64_t memory_base_limit;   // Lower allowed address limit 
    uint64_t memory_upper_limit;  // Upper allowed address limit
    bool     is_active;
    char     process_tag[32];
} SandboxContext;

typedef struct {
    SandboxContext contexts[MAX_SANDBOXED_PROCESSES];
    uint32_t       active_count;
    bool           strict_enforcement;
} SandboxManager;

// Sandbox Control Engine Mappings
void init_sandbox_manager(void);
int32_t register_sandboxed_process(const char* name, uint64_t cr3_page_root);
bool validate_memory_access_bounds(uint32_t pid, uint64_t target_address, uint32_t size, bool is_write);
void handle_sandbox_violation(uint32_t pid, uint64_t violating_address, bool is_write);