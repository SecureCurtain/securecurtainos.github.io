#pragma once
#include <stdint.h>

// Pre-computed fixed-point Sine table for angles 0 through 90 degrees (scaled by 256)
static const int16_t g_sin_table_90[] = {
    0,   4,   8,  13,  17,  22,  26,  31,  35,  40,  44,  48,  53,  57,  61,  66,
    70,  74,  79,  83,  87,  91,  95, 100, 104, 108, 112, 116, 120, 124, 128, 131,
    135, 139, 143, 146, 150, 154, 157, 161, 164, 167, 171, 174, 177, 181, 184, 187,
    190, 193, 196, 199, 202, 204, 207, 210, 212, 215, 217, 220, 222, 224, 226, 228,
    230, 232, 234, 236, 238, 239, 241, 242, 244, 245, 246, 247, 248, 249, 250, 251,
    252, 253, 253, 254, 254, 254, 255, 255, 255, 255, 256
};

// Fixed-point calculation of Sine (Angle 0-359, output scaled by 256)
static inline int32_t fixed_sin(int32_t angle) {
    angle = angle % 360;
    if (angle < 0) angle += 360;
    
    if (angle <= 90) return g_sin_table_90[angle];
    if (angle <= 180) return g_sin_table_90[180 - angle];
    if (angle <= 270) return -g_sin_table_90[angle - 180];
    return -g_sin_table_90[360 - angle];
}

// Fixed-point calculation of Cosine (Angle 0-359, output scaled by 256)
static inline int32_t fixed_cos(int32_t angle) {
    return fixed_sin(angle + 90);
}