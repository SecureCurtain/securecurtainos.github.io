/* SecureCurtain OS - 64-bit Global Descriptor Table (GDT) Header
 * Author: Jared Busby (jb7572)
 * Architecture: x86_64 Long Mode
 */

#ifndef _SECURECURTAIN_GDT_H
#define _SECURECURTAIN_GDT_H

#include <stdint.h>
#include <stddef.h>

#define GDT_KERNEL_CODE  0x08
#define GDT_KERNEL_DATA  0x10
#define GDT_USER_DATA    0x18
#define GDT_USER_CODE    0x20
#define GDT_TSS          0x28

#define USER_CS_SELECTOR (GDT_USER_CODE | 3) // 0x23
#define USER_DS_SELECTOR (GDT_USER_DATA | 3) // 0x1B

/* GDT Pointer structure for lgdt instruction */
struct gdt_ptr {
    uint16_t limit;
    uint64_t base;
} __attribute__((packed));

void gdt_init(void);

#endif /* _SECURECURTAIN_GDT_H */
