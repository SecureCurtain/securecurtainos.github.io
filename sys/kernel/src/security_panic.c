#include "security_panic.h"
#include "security_audit.h"
#include "pm_core.h"
#include <string.h>
#include <stdio.h>

extern void gfx_get_screen_dimensions(uint32_t* width, uint32_t* height);
extern void gfx_draw_filled_rect(uint32_t x, uint32_t y, uint32_t w, uint32_t h, uint32_t color);
extern void gfx_draw_string(uint32_t x, uint32_t y, const char* text, uint32_t color);
extern void issue_hardware_bus_command(uint16_t port, uint16_t command);

extern SwapCryptoContext g_hibernation_crypto;

// Terminal Ring 0 execution barrier invoked when system boundary integrity collapses
void __attribute__((noreturn)) execute_kernel_security_panic(const char* threat_origin) {
    // 1. Immediately disable all physical hardware interrupts to freeze scheduling cascades
    asm volatile("cli");

    // 2. Erase transient memory keys to prevent memory extraction
    memset(g_hibernation_crypto.key_buffer, 0, SWAP_ENCRYPTION_KEY_SIZE);
    g_hibernation_crypto.is_initialized = false;

    // 3. Physically sever the storage interface controller via out-of-band I/O commands
    //    Sends a hardware isolation block to your disk host adapters
    issue_hardware_bus_command(0x01F7, 0x0000); // Clear drive command registers
    issue_hardware_bus_command(0x03F6, 0x0004); // Assert reset/disable controller lines

    // 4. Force high-contrast kernel panic overlay matrix
    uint32_t sw = 0, sh = 0;
    gfx_get_screen_dimensions(&sw, &sh);
    gfx_draw_filled_rect(0, 0, sw, sh, 0x420000); // Crimson defense overlay frame

    uint32_t cx = (sw > 500) ? (sw - 500) / 2 : 10;
    uint32_t cy = (sh > 200) ? (sh - 200) / 2 : 10;

    gfx_draw_filled_rect(cx, cy, 500, 200, 0x111111);
    gfx_draw_filled_rect(cx, cy, 500, 4, 0xFF3333); // Red line accent strip

    gfx_draw_string(cx + 24, cy + 24, "!!! HARDWARE KERNEL SECURITY PANIC !!!", 0xFF3333);
    gfx_draw_string(cx + 24, cy + 54, "CRITICAL MALICIOUS INTRA-ACTIVITY EXPLOIT DETECTED", 0xFFFFFF);
    
    char details[128];
    snprintf(details, sizeof(details), "Threat Root Vector Context Identification: %s", threat_origin ? threat_origin : "Unknown");
    gfx_draw_string(cx + 24, cy + 84, details, 0xAAAAAA);

    gfx_draw_string(cx + 24, cy + 124, "STORAGE CONTROLLER ISOLATED. EPHEMERAL KEYS PURGED.", 0xFFA726);
    gfx_draw_string(cx + 24, cy + 154, "System halted. Cycle physical power line to restart.", 0x777777);

    // 5. Place the CPU into a permanent structural halt state loop
    for (;;) {
        asm volatile("hlt");
    }
}
