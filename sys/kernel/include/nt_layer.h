#pragma once
#include <stdint.h>
#include <stddef.h>
#include "ipc.h" // Needed to route messages via secure handles
#include "loader.h"

// 🛡️ SECURITY: Explicit NT Subsystem IPC Command IDs for Environment Sandboxing
#define NT_SUBSC_CMD_INVOKE      0x400
#define NT_CMD_VALIDATE_PE       0x401
#define NT_CMD_PARSE_PE_SECTIONS   0x402
#define NT_CMD_RELOCATE_PE         0x403
#define PE_MACHINE_X86_64        0x8664 // Target 64-bit AMD64/x86_64 architecture code

// Windows NT System Call ID Signatures (Maintained inside our isolated translation lists)
#define WIN_NT_READ_FILE         0x0006
#define WIN_NT_WRITE_FILE        0x0008
#define WIN_NT_TERMINATE_PROCESS 0x002C

// Windows NT Status Return Code Formats
#define STATUS_SUCCESS           ((uint32_t)0x00000000)
#define STATUS_INVALID_HANDLE    ((uint32_t)0xC0000008)
#define STATUS_NOT_IMPLEMENTED   ((uint32_t)0xC0000002)

// --- 🛡️ STRUCTURED NT IPC TRANSLATION PACKETS ---
// This encapsulates the raw x86_64 calling registers safely inside an ipc_message_t payload
typedef struct {
    uint32_t nt_call_id;     // The raw NT system call ID number parsed from RAX
    uint64_t param1;         // RCX mapped parameter (e.g., File Handle)
    uint64_t param2;         // RDX mapped parameter (e.g., Event Handle or Buffer)
    uint64_t param3;         // R8  mapped parameter (e.g., ApcRoutine or Length)
    uint64_t param4;         // R9  mapped parameter (e.g., IoStatusBlock)
} __attribute__((packed)) nt_syscall_frame_t;

// --- Primary API Entry Points ---

/**
 * Initializes the Windows NT compatibility proxy engine inside your user-space daemon environment.
 */
void init_nt_layer(void);

/**
 * 🛡️ SANDBOXED NT SUBSYSTEM ROUTER INTERFACE
 * This function runs entirely within the unprivileged user-space 'nt_env.bin' 
 * process container. It translates complex NT arguments and handles safely into 
 * microkernel-native VFS proxy calls without touching supervisor memory.
 * 
 * @param msg The incoming IPC packet containing the application's register snapshot.
 * @param out_response Output response container to route the NTSTATUS value back to the application.
 */
int handle_nt_subsystem_message(const ipc_message_t* msg, ipc_message_t* out_response);

int nt_validate_pe_signature(const uint8_t* buffer, size_t total_size);
int nt_parse_pe_sections(const uint8_t* buffer, size_t total_size, vm_space_t target_space);
int nt_relocate_pe_image(const uint8_t* buffer, size_t total_size, uint64_t load_delta);