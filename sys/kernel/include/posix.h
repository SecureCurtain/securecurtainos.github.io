#pragma once
#include <stdint.h>
#include <stddef.h>
#include "ipc.h" // Needed to route messages via secure handles

// 🛡️ SECURITY: Explicit POSIX IPC Command IDs for Environmental Subsystem Isolation
#define POSIX_CMD_READ   0x300
#define POSIX_CMD_WRITE  0x301
#define POSIX_CMD_OPEN   0x302
#define POSIX_CMD_CLOSE  0x303
#define POSIX_CMD_EXIT   0x304
#define POSIX_CMD_NORM_PATH 0x305
#define POSIX_MAX_PATH_LEN  256

// Linux x86_64 System Call ID Numbers (Passed as fields inside structures, never as direct raw states)
#define LINUX_SYS_READ   0
#define LINUX_SYS_WRITE  1
#define LINUX_SYS_OPEN   2
#define LINUX_SYS_CLOSE  3
#define LINUX_SYS_EXIT   60

// --- 🛡️ STRUCTURED POSIX IPC TRANSLATION PACKETS ---
// These structures encapsulate arguments safely inside standard ipc_message_t envelopes
typedef struct {
    uint64_t sys_vector_id; // The raw Linux system call identifier (e.g., LINUX_SYS_WRITE)
    uint64_t arg1;          // Linux RDI register mapped parameter (e.g., File Descriptor)
    uint64_t arg2;          // Linux RSI register mapped parameter (e.g., Buffer User Address)
    uint64_t arg3;          // Linux RDX register mapped parameter (e.g., Character Count)
} __attribute__((packed)) posix_syscall_frame_t;

// --- Primary API Entry Points ---

/**
 * Initializes the POSIX environmental proxy boundaries within your microkernel core.
 */
void init_posix_layer(void);

/**
 * 🛡️ SANDBOXED POSIX ROUTER INTERFACE
 * This function no longer runs in Ring 0 supervisor mode. It runs inside the
 * unprivileged user-space 'posix_env.bin' process container to parse and translate
 * requests into clean, microkernel-native VFS message sequences.
 * 
 * @param msg The secure incoming IPC packet containing the application's register data snapshot.
 * @param out_response Output response container to route results safely back to the calling app.
 */
int handle_posix_subsystem_message(const ipc_message_t* msg, ipc_message_t* out_response);

int posix_normalize_path(const char* input_path, char* output_path);