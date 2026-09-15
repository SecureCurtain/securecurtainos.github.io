#pragma once
#include <stdint.h>
#include <stdbool.h>
#include <stddef.h>

#define VIRTIO_GPU_MAGIC_TAG          0x56475055 // "VGPU" binary tracking token
#define VIRTIO_GPU_F_VIRGL            (1 << 0)   // 3D Acceleration mode
#define VIRTIO_GPU_F_EDID             (1 << 1)

// VirtIO-GPU Command Types
typedef enum {
    VIRTIO_GPU_CMD_GET_DISPLAY_INFO = 0x0100,
    VIRTIO_GPU_CMD_RESOURCE_CREATE_2D,
    VIRTIO_GPU_CMD_RESOURCE_UNREF,
    VIRTIO_GPU_CMD_SET_SCANOUT,
    VIRTIO_GPU_CMD_RESOURCE_FLUSH,
    VIRTIO_GPU_CMD_TRANSFER_TO_HOST_2D,
    VIRTIO_GPU_CMD_RESOURCE_ATTACH_BACKING,
    VIRTIO_GPU_CMD_RESOURCE_DETACH_BACKING,
    VIRTIO_GPU_CMD_GET_CAPSET_INFO,
    VIRTIO_GPU_CMD_GET_CAPSET,
    VIRTIO_GPU_CMD_GET_EDID,
    // 3D virgl commands
    VIRTIO_GPU_CMD_CTX_CREATE = 0x0200,
    VIRTIO_GPU_CMD_CTX_DESTROY,
    VIRTIO_GPU_CMD_CTX_ATTACH_RESOURCE,
    VIRTIO_GPU_CMD_CTX_DETACH_RESOURCE,
    VIRTIO_GPU_CMD_RESOURCE_CREATE_3D,
    VIRTIO_GPU_CMD_TRANSFER_TO_HOST_3D,
    VIRTIO_GPU_CMD_SUBMIT_3D,
    // Responses
    VIRTIO_GPU_RESP_OK_NODATA = 0x1100,
    VIRTIO_GPU_RESP_OK_DISPLAY_INFO,
    VIRTIO_GPU_RESP_OK_CAPSET_INFO,
    VIRTIO_GPU_RESP_OK_CAPSET,
    VIRTIO_GPU_RESP_OK_EDID,
    VIRTIO_GPU_RESP_ERR_UNSPEC = 0x1200
} VirtioGpuCtrlType;

// VirtIO Control Header
typedef struct __attribute__((packed)) {
    uint32_t type;
    uint32_t flags;
    uint64_t fence_id;
    uint32_t ctx_id;
    uint32_t padding;
} VirtioGpuCtrlHdr;

// 2D Resource Create Request
typedef struct __attribute__((packed)) {
    VirtioGpuCtrlHdr hdr;
    uint32_t         resource_id;
    uint32_t         format; // 1 = B8G8R8A8_UNORM, 2 = B8G8R8X8_UNORM, 3 = A8R8G8B8_UNORM
    uint32_t         width;
    uint32_t         height;
} VirtioGpuResourceCreate2D;

// Set Scanout Command
typedef struct __attribute__((packed)) {
    VirtioGpuCtrlHdr hdr;
    struct {
        uint32_t x;
        uint32_t y;
        uint32_t width;
        uint32_t height;
    } r;
    uint32_t scanout_id;
    uint32_t resource_id;
} VirtioGpuSetScanout;

// Transfer to Host 2D Command
typedef struct __attribute__((packed)) {
    VirtioGpuCtrlHdr hdr;
    struct {
        uint32_t x;
        uint32_t y;
        uint32_t width;
        uint32_t height;
    } r;
    uint64_t offset;
    uint32_t resource_id;
    uint32_t padding;
} VirtioGpuTransferToHost2D;

// Resource Flush Command (Presents frame to host display at 60 FPS)
typedef struct __attribute__((packed)) {
    VirtioGpuCtrlHdr hdr;
    struct {
        uint32_t x;
        uint32_t y;
        uint32_t width;
        uint32_t height;
    } r;
    uint32_t resource_id;
    uint32_t padding;
} VirtioGpuResourceFlush;

// Device State Context
typedef struct {
    uint32_t magic;
    uint16_t io_base_port;
    uint32_t primary_resource_id;
    uint32_t screen_width;
    uint32_t screen_height;
    uint32_t* backbuffer_linear_address;
    bool     is_3d_acceleration_enabled;
    uint64_t total_frames_flushed;
    uint32_t current_fps;
    uint64_t last_fps_calculation_tick;
} VirtioGpuDeviceContext;

// Driver Interfaces
void init_virtio_gpu_subsystem(void);
bool virtio_gpu_create_scanout_resource(uint32_t width, uint32_t height);
void virtio_gpu_blit_framebuffer_60fps(const uint32_t* pixel_buffer, uint32_t width, uint32_t height);
void virtio_gpu_draw_hw_rect(uint32_t x, uint32_t y, uint32_t w, uint32_t h, uint32_t color_argb);
void virtio_gpu_get_telemetry(uint32_t* fps, uint64_t* total_flushes, bool* is_3d_active);
