#include "display_mirror.h"
#include "sandbox.h"
#include "security_panic.h"
#include <string.h>
#include <stdio.h>

static SecureMirrorRegistry g_display_mirror;

void init_secure_display_mirror(uint32_t phys_fb, uint32_t size) {
    memset(&g_display_mirror, 0, sizeof(SecureMirrorRegistry));
    g_display_mirror.magic = MIRROR_MAGIC_TAG;
    g_display_mirror.physical_framebuffer_addr = phys_fb;
    g_display_mirror.framebuffer_size_bytes = size;
    g_display_mirror.screen_token_auth_pid = 0; // Default to core kernel composer
    g_display_mirror.anti_screenshot_active = true;

    printf("[Kernel Mirror]: Framebuffer graphic scraper shielding operational.\\n");
}

void update_secure_display_ownership(uint32_t authorized_compositor_pid) {
    g_display_mirror.screen_token_auth_pid = authorized_compositor_pid;
}

bool sys_read_framebuffer_pixels(uint32_t calling_pid, uint32_t byte_offset, uint8_t* out_pixel_data, uint32_t count) {
    if (byte_offset + count > g_display_mirror.framebuffer_size_bytes) return false;

    // Verify sandbox write layout alignments on caller dest buffer
    if (!validate_memory_access_bounds(calling_pid, (uint64_t)out_pixel_data, count, true)) {
        return false;
    }

    // PRIVILEGE CHECK: Verify that the process asking for pixels is your authorized workspace compositor (startup_gui)
    if (g_display_mirror.anti_screenshot_active && calling_pid != g_display_mirror.screen_token_auth_pid) {
        // Obfuscation fallback: Flood the unprivileged buffer with dark static noise pattern bytes
        for (uint32_t i = 0; i < count; i++) {
            out_pixel_data[i] = (uint8_t)((i ^ 0x3F) & 0x1F); 
        }
        printf("[SECURITY WARNING]: PID %d blocked from scraping the screen context mapping.\\n", calling_pid);
        return true; 
    }

    // Authorization matched: permit direct kernel-space memory read
    uint8_t* hardware_fb_ptr = (uint8_t*)(uintptr_t)(g_display_mirror.physical_framebuffer_addr + byte_offset);
    memcpy(out_pixel_data, hardware_fb_ptr, count);
    return true;
}
