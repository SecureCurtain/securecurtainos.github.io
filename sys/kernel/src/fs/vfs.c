/* SecureCurtain OS - Virtual File System (VFS) Dispatcher & Mount Engine
 * Author: Jared Busby (jb7572)
 * Architecture: x86_64 Freestanding
 */

#include "vfs.h"
#include "kernel.h"
#include "heap.h"

#define MAX_MOUNTS 16

struct mount_entry {
    char path[VFS_MAX_PATH];
    struct vfs_node *fs_root;
};

static struct vfs_node *vfs_root = NULL;
static struct mount_entry mount_table[MAX_MOUNTS];
static size_t mount_count = 0;

static struct vfs_dirent global_dirent;

static size_t root_read(struct vfs_node *node, uint64_t offset, size_t size, uint8_t *buffer) {
    (void)node; (void)offset; (void)size; (void)buffer;
    return 0;
}

static size_t root_write(struct vfs_node *node, uint64_t offset, size_t size, const uint8_t *buffer) {
    (void)node; (void)offset; (void)size; (void)buffer;
    return 0;
}

static struct vfs_dirent *root_readdir(struct vfs_node *node, uint32_t index) {
    (void)node;
    if (index >= mount_count) return NULL;

    const char *p = mount_table[index].path;
    if (p[0] == '/' && p[1] != '\0') p++; // Strip leading slash

    size_t i = 0;
    while (p[i] && i < VFS_MAX_NAME - 1) {
        global_dirent.name[i] = p[i];
        i++;
    }
    global_dirent.name[i] = '\0';
    global_dirent.inode = index + 1;
    global_dirent.type = VFS_DIRECTORY;
    return &global_dirent;
}

static struct vfs_node *root_finddir(struct vfs_node *node, const char *name) {
    (void)node;
    for (size_t i = 0; i < mount_count; i++) {
        const char *p = mount_table[i].path;
        if (p[0] == '/' && p[1] != '\0') p++;
        
        // Match name
        bool match = true;
        size_t j = 0;
        while (name[j] != '\0' || p[j] != '\0') {
            if (name[j] != p[j]) { match = false; break; }
            j++;
        }
        if (match) {
            return mount_table[i].fs_root;
        }
    }
    return NULL;
}

void vfs_init(void) {
    kprintf("[VFS] Initializing Virtual File System & Root Namespace...\n");

    vfs_root = (struct vfs_node *)kmalloc(sizeof(struct vfs_node));
    if (!vfs_root) {
        kernel_panic("VFS: Failed to allocate root node!");
        return;
    }

    vfs_root->name[0] = '/';
    vfs_root->name[1] = '\0';
    vfs_root->flags = VFS_DIRECTORY;
    vfs_root->size = 0;
    vfs_root->inode = 0;
    vfs_root->read = root_read;
    vfs_root->write = root_write;
    vfs_root->open = NULL;
    vfs_root->close = NULL;
    vfs_root->readdir = root_readdir;
    vfs_root->finddir = root_finddir;
    vfs_root->ptr = NULL;
    vfs_root->device = NULL;

    mount_count = 0;
    kprintf("[VFS] Root node mounted (/).\n");
}

int vfs_mount(const char *path, struct vfs_node *fs_root) {
    if (!path || !fs_root || mount_count >= MAX_MOUNTS) return -1;

    size_t i = 0;
    while (path[i] && i < VFS_MAX_PATH - 1) {
        mount_table[mount_count].path[i] = path[i];
        i++;
    }
    mount_table[mount_count].path[i] = '\0';
    mount_table[mount_count].fs_root = fs_root;
    mount_count++;

    kprintf("[VFS] Mounted filesystem at: %s\n", path);
    return 0;
}

size_t vfs_read(struct vfs_node *node, uint64_t offset, size_t size, uint8_t *buffer) {
    if (node && node->read) {
        return node->read(node, offset, size, buffer);
    }
    return 0;
}

size_t vfs_write(struct vfs_node *node, uint64_t offset, size_t size, const uint8_t *buffer) {
    if (node && node->write) {
        return node->write(node, offset, size, buffer);
    }
    return 0;
}

void vfs_close(struct vfs_node *node) {
    if (node && node->close) {
        node->close(node);
    }
}

struct vfs_dirent *vfs_readdir(struct vfs_node *node, uint32_t index) {
    if (node && (node->flags & VFS_DIRECTORY) && node->readdir) {
        return node->readdir(node, index);
    }
    return NULL;
}

struct vfs_node *vfs_finddir(struct vfs_node *node, const char *name) {
    if (node && (node->flags & VFS_DIRECTORY) && node->finddir) {
        return node->finddir(node, name);
    }
    return NULL;
}

/* Recursive Path Resolver */
struct vfs_node *vfs_open(const char *path, int flags) {
    (void)flags;
    if (!path || path[0] == '\0') return NULL;

    // Check direct mount matching first
    for (size_t i = 0; i < mount_count; i++) {
        bool match = true;
        size_t j = 0;
        while (path[j] != '\0' || mount_table[i].path[j] != '\0') {
            if (path[j] != mount_table[i].path[j]) { match = false; break; }
            j++;
        }
        if (match) return mount_table[i].fs_root;
    }

    // Traverse directory tree from root
    struct vfs_node *current = vfs_root;
    const char *p = path;
    if (*p == '/') p++;

    char token[VFS_MAX_NAME];
    while (*p != '\0') {
        size_t t_idx = 0;
        while (*p != '/' && *p != '\0' && t_idx < VFS_MAX_NAME - 1) {
            token[t_idx++] = *p++;
        }
        token[t_idx] = '\0';
        if (*p == '/') p++;

        struct vfs_node *next = vfs_finddir(current, token);
        if (!next) return NULL;
        current = next;
    }

    if (current && current->open) {
        current->open(current, flags);
    }

    return current;
}
