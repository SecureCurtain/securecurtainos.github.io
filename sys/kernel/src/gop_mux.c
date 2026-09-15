#include "gop_mux.h"
#include "sandbox.h"
#include "security_panic.h"
#include <string.h>
#include <stdio.h>

static GopMultiplexerRegistry g_gop_mux;

void init_uefi_gop_multiplexer(uint64_t physical_fb_base_addr, uint32_t hw_w, uint32_t hw_h) {
    memset(&g_gop_mux, 0, sizeof(GopMultiplexerRegistry));
    g_gop_mux.magic = GOP_MUX_MAGIC_TAG;
    g_gop_mux.physical_linear_framebuffer_addr = physical_fb_base_addr;
    g_gop_mux.detected_hardware_width = hw_w;
    g_gop_mux.detected_hardware_height = hw_h;
    g_gop_mux.anti_capture_mirror_active = true;

    // HARDWARE UP-SCALING SCALE RATIO CALCULATION MATRIX (2026 PROFILER)
    if (hw_w == 1280 || hw_h == 720) {
        g_gop_mux.scale_ratio_fixed_point = 85; // 1280 / 3840 = ~0.333x fixed-point scale factor fraction
        printf("[GOP Mux]: Budget 720p Monitor Detected (1280x720). Activating 0.33x high-visibility scaling maps.\\n");
    } else if (hw_w == 1920) {
        g_gop_mux.scale_ratio_fixed_point = 128; // 1920 / 3840 = 0.5x scale factor matrix step
        printf("[GOP Mux]: 1K Monitor Detected (1920x1080). Activating 0.5x down-scaling translation loops.\\n");
    } else if (hw_w == 2560) {
        g_gop_mux.scale_ratio_fixed_point = 170; // 2560 / 3840 = 0.66x scale factor matrix step
        printf("[GOP Mux]: 2K Monitor Detected (2560x1440). Activating 0.66x down-scaling translation loops.\\n");
    } else {
        g_gop_mux.scale_ratio_fixed_point = 256; // 3840x2160 native unscaled baseline parameters
        printf("[GOP Mux]: 4K Monitor Detected (3840x2160). Maintaining pristine unscaled graphics outputs.\\n");
    }
}

uint32_t sys_scale_coordinate_value(uint32_t native_value) {
    return (native_value * g_gop_mux.scale_ratio_fixed_point) / 256;
}

int32_t sys_register_gop_window_aperture(uint32_t pid, uint32_t x, uint32_t y, uint32_t w, uint32_t h) {
    if (g_gop_mux.total_active_windows >= GOP_MAX_APERTURES) return -1;

    uint32_t scaled_x = sys_scale_coordinate_value(x);
    uint32_t scaled_y = sys_scale_coordinate_value(y);
    uint32_t scaled_w = sys_scale_coordinate_value(w);
    uint32_t scaled_h = sys_scale_coordinate_value(h);

    if (scaled_x + scaled_w > g_gop_mux.detected_hardware_width || 
        scaled_y + scaled_h > g_gop_mux.detected_hardware_height) return -1;

    uint32_t idx = g_gop_mux.total_active_windows;
    GpuDisplayApertureNode* ap = &g_gop_mux.apertures[idx];
    ap->aperture_id = idx + 600;
    ap->owner_pid = pid;
    ap->start_x = scaled_x;
    ap->start_y = scaled_y;
    ap->width = scaled_w;
    ap->height = scaled_h;
    ap->is_minimized_hidden = false;

    g_gop_mux.total_active_windows++;
    return (int32_t)ap->aperture_id;
}

bool sys_gop_blit_pixel_stream(uint32_t aperture_id, uint32_t pid, uint32_t local_x, uint32_t local_y, uint32_t pixel_color) {
    for (uint32_t i = 0; i < g_gop_mux.total_active_windows; i++) {
        GpuDisplayApertureNode* ap = &g_gop_mux.apertures[i];
        if (ap->aperture_id == aperture_id && !ap->is_minimized_hidden) {
            
            if (ap->owner_pid != pid) {
                execute_kernel_security_panic("GOP FRAUD DETECTION: Unauthorized screen buffer pixel-write attempt!");
                return false;
            }

            uint32_t scaled_local_x = sys_scale_coordinate_value(local_x);
            uint32_t scaled_local_y = sys_scale_coordinate_value(local_y);

            if (scaled_local_x >= ap->width || scaled_local_y >= ap->height) return false;

            uint32_t absolute_x = ap->start_x + scaled_local_x;
            uint32_t absolute_y = ap->start_y + scaled_local_y;
            uint64_t linear_offset_bytes = ((uint64_t)absolute_y * g_gop_mux.detected_hardware_width + absolute_x) * 4;

            volatile uint32_t* raw_fb = (volatile uint32_t*)(uintptr_t)g_gop_mux.physical_linear_framebuffer_addr;
            
            if (g_gop_mux.anti_capture_mirror_active && pid >= 100 && (pixel_color & 0x00FFFFFF) == 0) {
                pixel_color ^= 0x00ABCDEF; 
            }

            *(volatile uint32_t*)((uint8_t*)raw_fb + linear_offset_bytes) = pixel_color;
            return true;
        }
    }
    return false;
}
