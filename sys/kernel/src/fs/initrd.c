/* SecureCurtain OS - USTAR Initramfs & Ramdisk Driver
 * Author: Jared Busby (jb7572)
 * Architecture: x86_64 Freestanding
 */

#include "initrd.h"
#include "vfs.h"
#include "kernel.h"
#include "heap.h"

#define MAX_INITRD_FILES 64

struct initrd_file {
    char name[VFS_MAX_NAME];
    uint8_t *data;
    size_t size;
    bool is_dir;
    struct vfs_node node;
};

static struct initrd_file files[MAX_INITRD_FILES];
static size_t file_count = 0;
static struct vfs_node initrd_root;
static struct vfs_dirent current_dirent;

/* Parse octal ASCII string into uint64_t */
static uint64_t parse_octal(const char *str, size_t len) {
    uint64_t val = 0;
    size_t i = 0;
    while (i < len && (str[i] == ' ' || str[i] == '\t')) {
        i++;
    }
    for (; i < len; i++) {
        if (str[i] >= '0' && str[i] <= '7') {
            val = (val << 3) | (str[i] - '0');
        } else {
            break;
        }
    }
    return val;
}

static size_t initrd_read(struct vfs_node *node, uint64_t offset, size_t size, uint8_t *buffer) {
    if (!node || !buffer) return 0;
    struct initrd_file *f = (struct initrd_file *)node->device;
    if (!f || !f->data) return 0;

    if (offset >= f->size) return 0;
    if (offset + size > f->size) {
        size = f->size - offset;
    }

    uint8_t *src = f->data + offset;
    for (size_t i = 0; i < size; i++) {
        buffer[i] = src[i];
    }
    return size;
}

static struct vfs_dirent *initrd_readdir(struct vfs_node *node, uint32_t index) {
    (void)node;
    if (index >= file_count) return NULL;

    size_t i = 0;
    while (files[index].name[i] && i < VFS_MAX_NAME - 1) {
        current_dirent.name[i] = files[index].name[i];
        i++;
    }
    current_dirent.name[i] = '\0';
    current_dirent.inode = index + 1;
    current_dirent.type = files[index].is_dir ? VFS_DIRECTORY : VFS_FILE;
    return &current_dirent;
}

static struct vfs_node *initrd_finddir(struct vfs_node *node, const char *name) {
    (void)node;
    for (size_t i = 0; i < file_count; i++) {
        bool match = true;
        size_t j = 0;
        while (name[j] != '\0' || files[i].name[j] != '\0') {
            if (name[j] != files[i].name[j]) {
                match = false;
                break;
            }
            j++;
        }
        if (match) {
            return &files[i].node;
        }
    }
    return NULL;
}

struct vfs_node *initrd_init(uintptr_t initrd_start_virt, size_t initrd_size) {
    kprintf("[INITRD] Scanning In-Memory USTAR Boot Ramdisk Archive (0x%lx, %lu KB)...\n",
            initrd_start_virt, (uint64_t)(initrd_size / 1024));

    file_count = 0;
    uintptr_t current = initrd_start_virt;
    uintptr_t end = initrd_start_virt + initrd_size;

    while (current + 512 <= end) {
        struct tar_header *hdr = (struct tar_header *)current;
        if (hdr->filename[0] == '\0') break; // End of archive

        size_t fsize = (size_t)parse_octal(hdr->size, sizeof(hdr->size));
        bool is_dir = (hdr->typeflag == '5');

        if (file_count < MAX_INITRD_FILES) {
            struct initrd_file *f = &files[file_count];
            
            // Clean up filename (strip leading "./" or "/")
            const char *src_name = hdr->filename;
            if (src_name[0] == '.' && src_name[1] == '/') src_name += 2;
            if (src_name[0] == '/') src_name++;

            size_t n_idx = 0;
            while (src_name[n_idx] && n_idx < VFS_MAX_NAME - 1) {
                // Strip trailing slash on directory
                if (src_name[n_idx] == '/' && src_name[n_idx + 1] == '\0') break;
                f->name[n_idx] = src_name[n_idx];
                n_idx++;
            }
            f->name[n_idx] = '\0';

            f->data = (uint8_t *)(current + 512);
            f->size = fsize;
            f->is_dir = is_dir;

            // Configure VFS node
            for (size_t k = 0; k < VFS_MAX_NAME; k++) f->node.name[k] = f->name[k];
            f->node.flags = is_dir ? VFS_DIRECTORY : VFS_FILE;
            f->node.size = fsize;
            f->node.inode = file_count + 1;
            f->node.read = initrd_read;
            f->node.write = NULL;
            f->node.open = NULL;
            f->node.close = NULL;
            f->node.readdir = is_dir ? initrd_readdir : NULL;
            f->node.finddir = is_dir ? initrd_finddir : NULL;
            f->node.device = f;

            kprintf("  [+] Extracted: %s (Bytes: %u, Type: %s)\n",
                    f->name, (uint32_t)fsize, is_dir ? "DIR" : "FILE");

            file_count++;
        }

        // Advance to next 512-byte aligned TAR block
        size_t total_blocks = 1 + ((fsize + 511) / 512);
        current += total_blocks * 512;
    }

    // Configure Root Node for Initrd
    initrd_root.name[0] = 'i';
    initrd_root.name[1] = 'n';
    initrd_root.name[2] = 'i';
    initrd_root.name[3] = 't';
    initrd_root.name[4] = 'r';
    initrd_root.name[5] = 'd';
    initrd_root.name[6] = '\0';
    initrd_root.flags = VFS_DIRECTORY;
    initrd_root.size = file_count;
    initrd_root.inode = 0;
    initrd_root.read = NULL;
    initrd_root.write = NULL;
    initrd_root.open = NULL;
    initrd_root.close = NULL;
    initrd_root.readdir = initrd_readdir;
    initrd_root.finddir = initrd_finddir;
    initrd_root.device = NULL;

    kprintf("[INITRD] In-memory Ramdisk mounted. Total Payload Files: %u\n", (uint32_t)file_count);

    return &initrd_root;
}
