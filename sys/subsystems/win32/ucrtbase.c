#include <stddef.h>
#include <stdint.h>

#define NT_CMD_ALLOC 0x10A

extern void native_ipc_call(uint32_t cmd, void* payload, size_t size);

void* malloc(size_t size) {
    void* allocated_address = NULL;
    struct { void* proc; void** addr; size_t size; uint32_t flags; } args = { (void*)-1, &allocated_address, size, 0x04 };
    native_ipc_call(NT_CMD_ALLOC, &args, sizeof(args));
    return allocated_address;
}

void free(void* ptr) {
    (void)ptr;
    // Optional implementation depending on your microkernel page tracker memory rules
}

void* memcpy(void* dest, const void* src, size_t n) {
    char* d = dest;
    const char* s = src;
    while (n--) *d++ = *s++;
    return dest;
}

void* memset(void* s, int c, size_t n) {
    char* p = s;
    while (n--) *p++ = c;
    return s;
}
