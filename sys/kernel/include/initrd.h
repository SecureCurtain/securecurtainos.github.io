/* SecureCurtain OS - TAR / USTAR Initramfs & Ramdisk Driver Header
 * Author: Jared Busby (jb7572)
 * Architecture: x86_64 Freestanding
 */

#ifndef _SECURECURTAIN_INITRD_H
#define _SECURECURTAIN_INITRD_H

#include <stdint.h>
#include <stddef.h>
#include "vfs.h"

/* Standard POSIX USTAR 512-byte Header */
struct tar_header {
    char filename[100];
    char mode[8];
    char uid[8];
    char gid[8];
    char size[12];     // Octal ASCII string
    char mtime[12];
    char chksum[8];
    char typeflag;     // '0' = File, '5' = Directory
    char linkname[100];
    char magic[6];     // "ustar\0" or "ustar "
    char version[2];
    char uname[32];
    char gname[32];
    char devmajor[8];
    char devminor[8];
    char prefix[155];
    char padding[12];
} __attribute__((packed));

/* Initrd Public Interface */
struct vfs_node *initrd_init(uintptr_t initrd_start_virt, size_t initrd_size);

#endif /* _SECURECURTAIN_INITRD_H */
