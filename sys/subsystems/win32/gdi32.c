#include <stdint.h>

typedef void* HDC;
typedef void* HGDIOBJ;

HDC __attribute__((stdcall)) CreateCompatibleDC(HDC hdc) {
    (void)hdc;
    return (HDC)0x1111;
}

HGDIOBJ __attribute__((stdcall)) SelectObject(HDC hdc, HGDIOBJ h) {
    (void)hdc;
    return h;
}

int __attribute__((stdcall)) BitBlt(HDC hdcDst, int x, int y, int cx, int cy, HDC hdcSrc, int x1, int y1, uint32_t rop) {
    (void)hdcDst; (void)x; (void)y; (void)cx; (void)cy; (void)hdcSrc; (void)x1; (void)y1; (void)rop;
    // Route pixels to your native windowing environment buffer
    return 1; 
}
