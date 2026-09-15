#pragma once
#include <stdint.h>
#include <stdbool.h>

#define MIRROR_MAGIC_TAG  0x4D495252 // "MIRR" binary verification tag

typedef struct {
    uint32_t magic;
    uint32_t physical_framebuffer_addr;
    uint32_t framebuffer_size_bytes;
    uint32_t screen_token_auth_pid; // Only this process can issue read-backs
    bool     anti_screenshot_active;
} SecureMirrorRegistry;

void init_secure_display_mirror(uint32_t phys_fb, uint32_t size);
void update_secure_display_ownership(uint32_t authorized_compositor_pid);
bool sys_read_framebuffer_pixels(uint32_t calling_pid, uint32_t byte_offset, uint8_t* out_pixel_data, uint32_t count);