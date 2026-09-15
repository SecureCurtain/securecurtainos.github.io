/* SecureCurtain OS - Multiboot2 Specification Header
 * Author: Jared Busby (jb7572)
 */

#ifndef _SECURECURTAIN_MULTIBOOT2_H
#define _SECURECURTAIN_MULTIBOOT2_H

#include <stdint.h>

#define MULTIBOOT2_BOOTLOADER_MAGIC        0x36D76289
#define MULTIBOOT2_TAG_TYPE_END            0
#define MULTIBOOT2_TAG_TYPE_CMDLINE        1
#define MULTIBOOT2_TAG_TYPE_BOOT_LOADER_NAME 2
#define MULTIBOOT2_TAG_TYPE_MODULE         3
#define MULTIBOOT2_TAG_TYPE_BASIC_MEMINFO  4
#define MULTIBOOT2_TAG_TYPE_BOOTDEV        5
#define MULTIBOOT2_TAG_TYPE_MMAP           6
#define MULTIBOOT2_TAG_TYPE_FRAMEBUFFER    8
#define MULTIBOOT2_TAG_TYPE_ACPI_OLD       14
#define MULTIBOOT2_TAG_TYPE_ACPI_NEW       15

struct multiboot_tag {
    uint32_t type;
    uint32_t size;
};

struct multiboot_tag_mmap_entry {
    uint64_t addr;
    uint64_t len;
    uint32_t type;
    uint32_t zero;
};

struct multiboot_tag_mmap {
    uint32_t type;
    uint32_t size;
    uint32_t entry_size;
    uint32_t entry_version;
    struct multiboot_tag_mmap_entry entries[0];
};

struct multiboot_tag_framebuffer {
    uint32_t type;
    uint32_t size;
    uint64_t framebuffer_addr;
    uint32_t framebuffer_pitch;
    uint32_t framebuffer_width;
    uint32_t framebuffer_height;
    uint8_t  framebuffer_bpp;
    uint8_t  framebuffer_type;
    uint16_t reserved;
};

struct multiboot_tag_module {
    uint32_t type;
    uint32_t size;
    uint32_t mod_start;
    uint32_t mod_end;
    char cmdline[0];
};

#endif /* _SECURECURTAIN_MULTIBOOT2_H */
