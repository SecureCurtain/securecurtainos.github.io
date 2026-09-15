/* SecureCurtain OS - Linear GOP Framebuffer & Visual Console Driver Header
 * Author: Jared Busby (jb7572)
 * Architecture: x86_64 Freestanding
 */

#ifndef _SECURECURTAIN_FB_H
#define _SECURECURTAIN_FB_H

#include <stdint.h>
#include <stddef.h>
#include <stdbool.h>

#define FRAMEBUFFER_VIRT_BASE 0xFFFFFFFFA0000000ULL

/* Framebuffer Configuration */
struct fb_info {
    uint64_t phys_addr;
    uintptr_t virt_addr;
    uint32_t width;
    uint32_t height;
    uint32_t pitch;
    uint8_t  bpp;
    bool     active;
};

/* Public API */
int  fb_init(uint64_t phys_addr, uint32_t width, uint32_t height, uint32_t pitch, uint8_t bpp);
bool fb_is_active(void);
void fb_draw_pixel(uint32_t x, uint32_t y, uint32_t color);
void fb_fill_rect(uint32_t x, uint32_t y, uint32_t w, uint32_t h, uint32_t color);
void fb_draw_char(uint32_t x, uint32_t y, char c, uint32_t fg, uint32_t bg);
void fb_draw_string(uint32_t x, uint32_t y, const char *str, uint32_t fg, uint32_t bg);
void fb_console_putc(char c);
void fb_console_puts(const char *str);
void fb_draw_decorations(void);
struct fb_info *fb_get_info(void);

#endif /* _SECURECURTAIN_FB_H */
