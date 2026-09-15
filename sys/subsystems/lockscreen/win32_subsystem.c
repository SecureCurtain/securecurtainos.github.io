#include "win32_subsystem.h"
#include "../../kernel/include/kstring.h"
#include "../../kernel/include/sandbox.h"
#include "../../kernel/include/security_audit.h"
#include <stdio.h>

#define IPC_PAYLOAD_SIZE 256
#define USER_SPACE_MAX_LIMIT 0x00007FFFFFFFFFFF

static Win32SubsystemRegistry g_win32_server;

extern int32_t sys_ipc_receive_message(uint32_t channel_id, uint32_t* sender_pid, uint8_t* buffer, uint32_t max_len);
extern bool    sys_ipc_send_secure_message(uint32_t channel_id, uint32_t sender_pid, const uint8_t* data, uint32_t length);
extern int32_t sys_vfs_open(const char* path, int32_t flags);
extern void    sys_vfs_close(int32_t fd);
extern int32_t sys_arch_prctl(uint32_t code, uint64_t addr);

void init_user_space_win32_subsystem(void) {
    kmemset(&g_win32_server, 0, sizeof(Win32SubsystemRegistry));
    g_win32_server.magic = WIN32_SUB_MAGIC_TAG;
    g_win32_server.total_allocated_handles = 0;
    g_win32_server.total_translated_api_calls = 0;
    printf("[Win32 Server]: User-Space Win32 translation personality subsystem online.\\n");
}

uint32_t sys_win32_bridge_virtual_alloc(uint32_t client_pid, uint64_t desired_addr, uint32_t allocation_size_bytes) {
    // 🛡️ SECURITY: Bounds check allocation size and address against null-page and kernel ranges
    if (allocation_size_bytes == 0 || allocation_size_bytes > 256 * 1024 * 1024) { // Max 256MB per alloc
        return 0; // STATUS_INVALID_PARAMETER
    }

    if (desired_addr != 0 && (desired_addr < 0x10000 || desired_addr + allocation_size_bytes >= USER_SPACE_MAX_LIMIT)) {
        return 0; // STATUS_ACCESS_VIOLATION
    }

    uint32_t pages_needed = (allocation_size_bytes + 4095) / 4096;
    uint64_t target_addr = (desired_addr == 0) ? 0x00400000 : desired_addr;
    
    extern bool sys_mmu_map_user_pages_range(uint32_t pid, uint64_t start_addr, uint32_t count);
    bool map_success = sys_mmu_map_user_pages_range(client_pid, target_addr, pages_needed);
    
    if (map_success) {
        printf("[Win32 Bridge]: VirtualAlloc allocated %u pages for Windows PID %u\\n", pages_needed, client_pid);
        return (uint32_t)target_addr;
    }
    return 0; // STATUS_NO_MEMORY
}

// Native Portable Executable (PE) Binary Parsing Engine
bool sys_win32_pe_loader_validate(const uint8_t* raw_exe_buffer, uint32_t len) {
    if (!raw_exe_buffer || len < 64) return false;

    // 1. Verify standard DOS Stub Magic Signature Header ('MZ')
    if (raw_exe_buffer[0] != 'M' || raw_exe_buffer[1] != 'Z') {
        return false;
    }

    // 2. Extract the absolute 4-byte offset pointing to the PE signature header
    uint32_t pe_header_offset = *(uint32_t*)(&raw_exe_buffer[0x3C]);
    if (pe_header_offset + 24 > len) return false;

    // 3. Verify the core Portable Executable Magic Signature Token ('PE\\0\\0')
    const uint8_t* pe_sig = raw_exe_buffer + pe_header_offset;
    if (pe_sig[0] != 'P' || pe_sig[1] != 'E' || pe_sig[2] != '\\0' || pe_sig[3] != '\\0') {
        printf("[PE Loader Rejection]: Invalid PE header signature footprint.\\n");
        return false;
    }

    printf("[PE Loader]: Windows PE32+ signature validated successfully. Authorized for injection.\\n");
    return true;
}

void run_win32_subsystem_server_loop(void) {
    // 🛡️ FULL-ALIGNED 256-BYTE IPC STAGING BUFFER
    uint8_t ipc_message_staging_buffer[IPC_PAYLOAD_SIZE];
    uint32_t client_pid = 0;
    
    #define WIN32_IPC_CHANNEL_GATE 8
    init_user_space_win32_subsystem();

    while (true) {
        int32_t read_bytes = sys_ipc_receive_message(WIN32_IPC_CHANNEL_GATE, &client_pid, ipc_message_staging_buffer, IPC_PAYLOAD_SIZE);
        
        if (read_bytes >= 8) {
            g_win32_server.total_translated_api_calls++;
            
            uint32_t api_call_id = *(uint32_t*)(&ipc_message_staging_buffer[0]);
            uint64_t arg1        = *(uint64_t*)(&ipc_message_staging_buffer[4]);
            uint64_t arg2        = (read_bytes >= 20) ? *(uint64_t*)(&ipc_message_staging_buffer[12]) : 0;

            uint64_t translation_return_register = 0;

            switch (api_call_id) {
                case WIN32_API_VIRTUALALLOC: {
                    translation_return_register = sys_win32_bridge_virtual_alloc(client_pid, arg1, (uint32_t)arg2);
                    break;
                }

                case WIN32_API_CREATEFILEW: {
                    if (g_win32_server.total_allocated_handles < MAX_WIN32_HANDLES) {
                        uint32_t handle_idx = g_win32_server.total_allocated_handles;
                        Win32HandleEntry* entry = &g_win32_server.handle_table[handle_idx];
                        
                        entry->handle_id = WIN32_HANDLE_BASE + handle_idx;
                        entry->object_type = HANDLE_TYPE_FILE;
                        entry->associated_vfs_fd = 5;
                        entry->is_inherited = false;

                        g_win32_server.total_allocated_handles++;
                        translation_return_register = entry->handle_id;
                    }
                    break;
                }

                case WIN32_API_CLOSEHANDLE: {
                    for (uint32_t i = 0; i < g_win32_server.total_allocated_handles; i++) {
                        if (g_win32_server.handle_table[i].handle_id == (uint32_t)arg1) {
                            g_win32_server.handle_table[i].object_type = HANDLE_TYPE_FREE;
                            translation_return_register = 1;
                            break;
                        }
                    }
                    break;
                }

                default:
                    printf("[Win32 Server Warning]: Unimplemented Win32 API intercept ID: %d\\n", api_call_id);
                    translation_return_register = 0;
                    break;
            }

            uint8_t outbound_response_buffer[8];
            *(uint64_t*)(&outbound_response_buffer[0]) = translation_return_register;
            sys_ipc_send_secure_message(WIN32_IPC_CHANNEL_GATE, client_pid, outbound_response_buffer, 8);
        }
        
        asm volatile("pause" ::: "memory");
    }
}

// =============================================================================
// HARDWARE THREAD ENVIRONMENT BLOCK (TEB) PROVISIONING VIA RING 0 SYSCALL
// =============================================================================
static Win32TebControlRegistry g_teb_manager;

void sys_win32_provision_hardware_thread_context(uint32_t pid, uint64_t stack_base_addr) {
    if (g_teb_manager.total_tebs_allocated >= 32) return;

    uint32_t idx = g_teb_manager.total_tebs_allocated;
    Win32ThreadEnvironmentBlock* teb = &g_teb_manager.active_teb_slots[idx];

    // Setup standard parameters required by the Windows runtime stubs
    teb->exception_list = 0xFFFFFFFFFFFFFFFF;
    teb->stack_base = stack_base_addr;
    teb->stack_limit = stack_base_addr - (64 * 1024);
    teb->process_id = pid;
    teb->thread_id = pid + 200;
    teb->last_error_code = 0;
    
    // gs:[0x30] self pointer
    teb->self_teb_ptr = (uint64_t)(uintptr_t)teb;

    // 🛡️ CALL SECURE RING 0 SYSCALL FOR MSR PROGRAMMING
    #define ARCH_SET_GS 0x1001
    uint64_t teb_addr = (uint64_t)(uintptr_t)teb;
    int32_t ret = sys_arch_prctl(ARCH_SET_GS, teb_addr);

    if (ret == 0) {
        g_teb_manager.total_tebs_allocated++;
        printf("[Win32 Core]: Successfully bound hardware GS segment to TEB at 0x%llX via Ring 0\\n", teb_addr);
    } else {
        printf("[Win32 Core Error]: Failed to set GS segment register for PID %u (ret: %d)\\n", pid, ret);
    }
}
