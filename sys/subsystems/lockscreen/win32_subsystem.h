#pragma once
#include <stdint.h>
#include <stdbool.h>

#define WIN32_SUB_MAGIC_TAG   0x57333253 // "W32S" binary tracking token
#define MAX_WIN32_HANDLES     512
#define WIN32_HANDLE_BASE     0x00000A00

// Win32 System Call Identifier Codes mapped to our synchronous rendezvous IPC
typedef enum {
    WIN32_API_VIRTUALALLOC = 101,
    WIN32_API_CREATEFILEW,
    WIN32_API_WRITEFILE,
    WIN32_API_CLOSEHANDLE
} Win32ApiCallId;

typedef enum {
    HANDLE_TYPE_FREE = 0,
    HANDLE_TYPE_FILE,
    HANDLE_TYPE_PROCESS,
    HANDLE_TYPE_MUTEX
} Win32HandleType;

// Object Handle Table entry structure to isolate application handles
typedef struct {
    uint32_t handle_id;
    uint8_t  object_type; // Maps to Win32HandleType
    uint32_t associated_vfs_fd;
    uint64_t object_state_flags;
    bool     is_inherited;
} Win32HandleEntry;

typedef struct {
    uint32_t         magic;
    Win32HandleEntry handle_table[MAX_WIN32_HANDLES];
    uint32_t         total_allocated_handles;
    uint64_t         total_translated_api_calls;
} Win32SubsystemRegistry;

void init_user_space_win32_subsystem(void);
void run_win32_subsystem_server_loop(void);
uint32_t sys_win32_bridge_virtual_alloc(uint32_t client_pid, uint64_t desired_addr, uint32_t allocation_size_bytes);
uint32_t sys_win32_translate_handle_to_fd(uint32_t client_pid, uint32_t win32_handle);
