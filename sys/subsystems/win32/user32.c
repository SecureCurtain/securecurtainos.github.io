#include <stddef.h>
#include <stdint.h>

typedef void* HWND;
typedef struct { HWND hwnd; uint32_t message; uintptr_t wParam; uintptr_t lParam; } MSG;

#define UI_CMD_GET_INPUT 0x90A

extern void native_ipc_call(uint32_t cmd, void* payload, size_t size);

HWND __attribute__((stdcall)) CreateWindowExW(uint32_t dwExStyle, const uint16_t* lpClassName, const uint16_t* lpWindowName, uint32_t dwStyle, int x, int y, int nWidth, int nHeight, HWND hWndParent, void* hMenu, void* hInstance, void* lpParam) {
    (void)dwExStyle; (void)lpClassName; (void)lpWindowName; (void)dwStyle; (void)x; (void)y; (void)nWidth; (void)nHeight; (void)hWndParent; (void)hMenu; (void)hInstance; (void)lpParam;
    // Notify your native microkernel UI server to draw a window frame
    return (HWND)0xDEAF; 
}

int __attribute__((stdcall)) GetMessageW(MSG* lpMsg, HWND hWnd, uint32_t wMsgFilterMin, uint32_t wMsgFilterMax) {
    (void)hWnd; (void)wMsgFilterMin; (void)wMsgFilterMax;
    // Block the thread until your native UI daemon passes a keyboard or mouse click packet
    native_ipc_call(UI_CMD_GET_INPUT, lpMsg, sizeof(MSG));
    return 1;
}

long __attribute__((stdcall)) DispatchMessageW(const MSG* lpMsg) {
    (void)lpMsg;
    // Forwards the message payload back out to the internal application's main drawing routine
    return 0;
}
