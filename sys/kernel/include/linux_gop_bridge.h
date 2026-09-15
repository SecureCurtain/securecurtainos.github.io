#pragma once
#include <stdint.h>
#include <stdbool.h>

#define LINUX_GOP_MAGIC_TAG  0x4C474F50 // "LGOP" binary tracking token
#define VIRTUAL_DRI_FD       4          // Simulated Linux file descriptor for /dev/dri/card0

typedef struct {
    uint32_t ioctl_command_id;
    uint32_t width;
    uint32_t height;
    uint32_t pitch;
    uint32_t handle;
    uint64_t offset;
} LinuxDrmModeCreateDumb;

typedef struct {
    uint32_t magic;
    bool     is_wayland_server_bound;
    uint64_t virtual_dri_memory_map_addr;
    uint32_t active_desktop_enclave_pid;
} LinuxGopBridgeRegistry;

void init_linux_gop_bridge_subsystem(void);
int32_t sys_intercept_linux_open_call(uint32_t pid, const char* path_string);
int32_t sys_intercept_linux_ioctl_call(uint32_t pid, int32_t fd, uint32_t request, void* arg_struct_ptr);
void sys_linux_gop_bridge_flush_framebuffer(const uint32_t* desktop_software_framebuffer);
