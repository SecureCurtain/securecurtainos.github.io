#pragma once
#include <stdint.h>
#include <stddef.h>
#include "memory.h" // Needed to process environment setups within a specific vm_space_t context

// --- Windows 64-bit Process Environment Block (PEB) ---
typedef struct {
    uint8_t  inherited_address_space;
    uint8_t  read_image_file_exec_options;
    uint8_t  being_debugged;               
    uint8_t  bit_field;
    uint64_t mutant;
    uint64_t image_base_address;           
    uint64_t loader_data;                  
    uint64_t process_parameters;           
} __attribute__((packed)) nt_peb_t;

// --- Windows 64-bit Thread Environment Block (TEB) ---
typedef struct {
    uint64_t exception_list;               // 🛡️ User-space exception frame head (Never parsed by Ring 0)
    uint64_t stack_base;                   // Verified unprivileged stack boundary top
    uint64_t stack_limit;                  // Verified unprivileged stack boundary bottom
    uint64_t sub_system_tib;
    uint64_t fiber_data;
    uint64_t arbitrary_user_pointer;
    uint64_t teb_self_instance;            // Must match the absolute virtual address in User Space
    uint64_t environment_pointer;
    uint32_t client_id_process;            
    uint32_t client_id_thread;             
    uint64_t active_rpc_handle;
    uint64_t thread_local_storage_pointer; 
    uint64_t peb_address;                  
} __attribute__((packed)) nt_teb_t;

// --- Primary API Entry Points ---

/**
 * Initializes the microkernel's environmental configuration proxy bounds.
 */
void init_environment_manager(void);

/**
 * 🛡️ SANDBOXED CONTEXT ENVIRONMENT SETUP (WINDOWS)
 * Builds the structural PEB/TEB data layouts safely within a localized virtual address target.
 * Enforces strict verification to ensure all blocks are mapped with Non-Executable (PAGE_NX) data permissions.
 * 
 * @param target_space The isolated destination address space directory handle (PML4 root).
 * @param target_user_vaddr The target user-space virtual memory block where the TEB/PEB will reside.
 * @param image_base The verified user-space physical loading address of the executable image.
 * @param pid The immutable, kernel-assigned process ID.
 * @param tid The immutable, kernel-assigned thread ID.
 */
int env_setup_windows_blocks(vm_space_t target_space, uint64_t target_user_vaddr, uint64_t image_base, uint32_t pid, uint32_t tid);

/**
 * 🛡️ SANDBOXED CONTEXT ENVIRONMENT SETUP (LINUX)
 * Safely parses input strings (argv/envp) and populates the initial stack argument array
 * inside a specific process's unprivileged memory layout, protecting against overflow vector probes.
 */
int env_setup_linux_stack(vm_space_t target_space, uint64_t stack_top_vaddr, const char* argv[], const char* envp[]);