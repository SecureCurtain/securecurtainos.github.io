#pragma once
#include <stdint.h>
#include <stddef.h>
#include <stdbool.h>
#include <stdarg.h>
#include "sched.h"
#include "pmm.h"

#define KERNEL_VIRTUAL_BASE 0xFFFFFFFF80000000ULL
#define KERNEL_VERSION      "1.0.0"

// Low-level x86_64 Port I/O Helpers
static inline void outb(uint16_t port, uint8_t val) {
    __asm__ volatile ("outb %0, %1" : : "a"(val), "Nd"(port));
}

static inline uint8_t inb(uint16_t port) {
    uint8_t ret;
    __asm__ volatile ("inb %1, %0" : "=a"(ret) : "Nd"(port));
    return ret;
}

static inline void io_wait(void) {
    outb(0x80, 0);
}

// Thread definition hook extension
typedef struct {
    uint64_t         thread_id;
    uint64_t         process_id;
    os_personality_t personality; // Explicitly tracks if thread belongs to the win32 sandbox
    uint32_t         state;       // 0=Ready, 1=Running, 2=Blocked
} kernel_thread_t;

// 🛡️ SECURITY CONFIGURATION: Structure layout mapping the modern, authenticated UEFI parameter frame
typedef struct {
    uintptr_t               framebuffer_address;     // Physical base address of the GPU canvas
    uint32_t                screen_width;
    uint32_t                screen_height;
    uint32_t                pixels_per_scan_line;
    
    pmm_memory_map_entry_t* firmware_memory_map;    // UEFI-passed structural layout segments array
    size_t                  memory_map_entry_count;  // Precise hardware fragment entry count
    uintptr_t               bitmap_target_physical;  // Dynamically computed physical tracking address
} boot_parameters_t;

// --- Primary Microkernel Diagnostic and Entry API ---

/**
 * 🛡️ Clears the graphics canvas framebuffer with a zeroed mask.
 */
void clear_screen(void);

/**
 * 🛡️ Renders white text output onto the diagnostics canvas at a specified row stride.
 */
void print_string(const char* str, int row);

/**
 * 🛡️ PRIMARY BOOTSTRAP PIPELINE & COMPATIBILITY ENTRY POINTS
 */
void kmain(uint32_t magic, void *mb2_info);
void kernel_main(uint32_t magic, void *mb2_info);

void serial_init(void);
void serial_putc(char c);
void serial_puts(const char *str);
void vga_putc(char c);
void kprint_char(char c);
void vkprintf(const char *fmt, va_list args);
void kprintf(const char *fmt, ...);
void kernel_panic(const char *reason);
