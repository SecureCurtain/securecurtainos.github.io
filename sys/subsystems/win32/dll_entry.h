#pragma once
#include <stdint.h>
#include <stdbool.h>

/**
 * Standard Win32 DLL Entry Point.
 * Reason constants:
 * 1 = DLL_PROCESS_ATTACH
 * 2 = DLL_THREAD_ATTACH
 * 3 = DLL_THREAD_DETACH
 * 0 = DLL_PROCESS_DETACH
 */
static inline bool __attribute__((stdcall)) DllMain(void* hinstDLL, uint32_t fdwReason, void* lpReserved) {
    (void)hinstDLL;
    (void)fdwReason;
    (void)lpReserved;
    return true;
}

/**
 * Default CRT entry symbol called by the Windows PE loader upon DLL load.
 * Returning 1 (TRUE) signals to the OS loader that initialization succeeded.
 */
static inline int __attribute__((stdcall)) DllMainCRTStartup(void* hinstDLL, uint32_t fdwReason, void* lpReserved) {
    return DllMain(hinstDLL, fdwReason, lpReserved) ? 1 : 0;
}
