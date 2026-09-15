#include <stddef.h>
#include <stdint.h>
#include <string.h>
#include "../vfs/vfs_ipc.h"
#include "win32_string.h" // Holds your previously written convert_utf16_to_utf8 helper

#define STATUS_SUCCESS 0x00000000
#define NT_CMD_ALLOC   0x10A
#define NT_CMD_CLOSE   0x30C
#define VFS_SERVICE_PID 8

extern void native_ipc_call(uint32_t cmd, void* payload, size_t size);
extern void native_ipc_call_with_response(uint32_t target_pid, uint32_t cmd, void* send_buf, size_t size, void* recv_buf);

uint32_t __attribute__((stdcall)) NtAllocateVirtualMemory(void* ProcessHandle, void** BaseAddress, uintptr_t ZeroBits, size_t* RegionSize, uint32_t AllocationType, uint32_t Protect) {
    (void)ZeroBits;
    (void)AllocationType;
    struct { void* proc; void** addr; size_t size; uint32_t flags; } args = { ProcessHandle, BaseAddress, *RegionSize, Protect };
    
    // Pass the parameters directly down to your microkernel core
    native_ipc_call(NT_CMD_ALLOC, &args, sizeof(args));
    return STATUS_SUCCESS;
}

/**
 * Windows Native API File Entry Interceptor matching the standard Microsoft signature definitions.
 */
uint32_t __attribute__((stdcall)) NtOpenFile(void** FileHandle, uint32_t DesiredAccess, void* ObjectAttributes, void* IoStatusBlock, uint32_t ShareAccess, uint32_t OpenOptions) {
    (void)IoStatusBlock;
    (void)ShareAccess;
    
    // 1. Extract the raw Windows UTF-16 path array from the pointer layout passed by the app
    // (ObjectAttributes inside Windows contains a pointer to a UNICODE_STRING structure)
    uint16_t* win_utf16_path_ptr = *(uint16_t**)((uintptr_t)ObjectAttributes + 8); 

    vfs_open_request_t open_packet;
    open_packet.access_flags  = DesiredAccess;
    open_packet.creation_mode = OpenOptions;

    // 2. Perform instant dynamic conversion to translate the application string into standard UTF-8 text
    convert_utf16_to_utf8(win_utf16_path_ptr, open_packet.absolute_path, sizeof(open_packet.absolute_path));

    uint32_t returned_vfs_handle = 0;

    // 3. Ship the formatted VFS open command directly across to the user-space file router (PID 8)
    native_ipc_call_with_response(
        VFS_SERVICE_PID, 
        VFS_CMD_OPEN, 
        &open_packet, 
        sizeof(vfs_open_request_t), 
        &returned_vfs_handle
    );

    // 4. Populate the application's handle memory variable and return success
    *FileHandle = (void*)(uintptr_t)returned_vfs_handle;
    
    return STATUS_SUCCESS;
}

uint32_t __attribute__((stdcall)) NtClose(void* Handle) {
    native_ipc_call(NT_CMD_CLOSE, &Handle, sizeof(Handle));
    return STATUS_SUCCESS;
}
