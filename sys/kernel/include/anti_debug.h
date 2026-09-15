#pragma once
#include <stdint.h>
#include <stdbool.h>

#define ANTI_DEBUG_MAGIC_TAG 0x41444247 // "ADBG" tracking token

typedef struct {
    uint32_t process_id;
    uint64_t last_observed_tsc; // Time Stamp Counter record flag
    uint32_t signature_traps_tripped;
    bool     is_being_monitored;
} DebugWatchNode;

typedef struct {
    uint32_t       magic;
    DebugWatchNode monitored_tasks[32];
    uint32_t       total_watched_tasks;
} AntiDebugRegistry;

void init_anti_debug_tracer(void);
void register_process_for_debug_shield(uint32_t pid);
bool perform_realtime_anti_debug_check(uint32_t pid);
void handle_debugging_breach(uint32_t pid, const char* exploit_vector);