#include <stdint.h>
#include <stddef.h>
#include "win32_string.h"

typedef void* HANDLE;
typedef const uint16_t* LPCWSTR;
typedef uint32_t DWORD;

#define NT_CMD_ALLOC 0x10A

extern void native_ipc_call(uint32_t cmd, void* payload, size_t size);

HANDLE __attribute__((stdcall)) VirtualAlloc(HANDLE lpAddress, size_t dwSize, DWORD flAllocationType, DWORD flProtect) {
    (void)flAllocationType;
    void* allocated_address = lpAddress;
    struct { void* proc; void** addr; size_t size; uint32_t flags; } args = { (void*)-1, &allocated_address, dwSize, flProtect };
    native_ipc_call(NT_CMD_ALLOC, &args, sizeof(args));
    return allocated_address;
}

HANDLE __attribute__((stdcall)) CreateFileW(LPCWSTR lpFileName, DWORD dwDesiredAccess, DWORD dwShareMode, void* lpSecurityAttributes, DWORD dwCreationDisposition, DWORD dwFlagsAndAttributes, HANDLE hTemplateFile) {
    (void)dwDesiredAccess; (void)dwShareMode; (void)lpSecurityAttributes; (void)dwCreationDisposition; (void)dwFlagsAndAttributes; (void)hTemplateFile;
    
    // Allocate a temporary 512-byte safe stack buffer for the native conversion target
    char native_utf8_path[512];
    
    // Run the conversion instantly
    convert_utf16_to_utf8(lpFileName, native_utf8_path, sizeof(native_utf8_path));

    // For debugging/logging purposes inside your subsystem simulation runtime
    HANDLE open_file_handle = (HANDLE)0;
    
    return open_file_handle;
}

void __attribute__((stdcall)) ExitProcess(DWORD uExitCode) {
    (void)uExitCode;
    while(1); // Infinite trap loop until your native system cuts the thread power
}

HANDLE __attribute__((stdcall)) CreateThread(void* lpThreadAttributes, size_t dwStackSize, void* lpStartAddress, void* lpParameter, DWORD dwCreationFlags, DWORD* lpThreadId) {
    (void)lpThreadAttributes; (void)dwStackSize; (void)lpStartAddress; (void)lpParameter; (void)dwCreationFlags; (void)lpThreadId;
    return (HANDLE)100;
}
