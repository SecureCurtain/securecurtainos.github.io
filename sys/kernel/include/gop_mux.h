#pragma once
#include <stdint.h>
#include <stdbool.h>

#define GOP_MUX_MAGIC_TAG     0x474F504D
#define GOP_MAX_APERTURES     6

typedef struct {
    uint32_t aperture_id;
    uint32_t owner_pid;
    uint32_t start_x;
    uint32_t start_y;
    uint32_t width;
    uint32_t height;
    bool     is_minimized_hidden;
} GpuDisplayApertureNode;

typedef struct {
    uint32_t               magic;
    uint64_t               physical_linear_framebuffer_addr;
    uint32_t               detected_hardware_width;  // Dynamically populated on boot (e.g. 1280, 1920, 2560, 3840)
    uint32_t               detected_hardware_height; // Dynamically populated on boot (e.g. 720, 1080, 1440, 2160)
    uint32_t               scale_ratio_fixed_point;  // 256 = 1.0x scale (85 = 0.33x for 720p)
    GpuDisplayApertureNode apertures[GOP_MAX_APERTURES];
    uint32_t               total_active_windows;
    bool                   anti_capture_mirror_active;
} GopMultiplexerRegistry;

void init_uefi_gop_multiplexer(uint64_t physical_fb_base_addr, uint32_t hw_w, uint32_t hw_h);
int32_t sys_register_gop_window_aperture(uint32_t pid, uint32_t x, uint32_t y, uint32_t w, uint32_t h);
bool sys_gop_blit_pixel_stream(uint32_t aperture_id, uint32_t pid, uint32_t local_x, uint32_t local_y, uint32_t pixel_color);
uint32_t sys_scale_coordinate_value(uint32_t native_value);
