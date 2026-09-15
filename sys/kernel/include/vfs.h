#pragma once
#include <stdint.h>
#include <stddef.h>
#include <stdbool.h>

#define VFS_MAX_PATH 256
#define VFS_MAX_NAME 128

#define VFS_FILE        0x01
#define VFS_DIRECTORY   0x02
#define VFS_CHARDEVICE  0x03
#define VFS_BLOCKDEVICE 0x04
#define VFS_PIPE        0x05
#define VFS_SYMLINK     0x06
#define VFS_MOUNTPOINT  0x08

// Standardized VFS Command Identifiers
#define VFS_CMD_OPEN   0x201
#define VFS_CMD_CLOSE  0x202
#define VFS_CMD_READ   0x203
#define VFS_CMD_WRITE  0x204

struct vfs_node;

typedef size_t (*vfs_read_t)(struct vfs_node *, uint64_t, size_t, uint8_t *);
typedef size_t (*vfs_write_t)(struct vfs_node *, uint64_t, size_t, const uint8_t *);
typedef void (*vfs_open_t)(struct vfs_node *, int);
typedef void (*vfs_close_t)(struct vfs_node *);
typedef struct vfs_dirent *(*vfs_readdir_t)(struct vfs_node *, uint32_t);
typedef struct vfs_node *(*vfs_finddir_t)(struct vfs_node *, const char *);

struct vfs_dirent {
    char name[VFS_MAX_NAME];
    uint32_t inode;
    uint32_t type;
};

typedef struct vfs_node {
    char           name[VFS_MAX_NAME];
    uint32_t       flags;
    uint64_t       size;
    uint32_t       inode;
    vfs_read_t     read;
    vfs_write_t    write;
    vfs_open_t     open;
    vfs_close_t    close;
    vfs_readdir_t  readdir;
    vfs_finddir_t  finddir;
    struct vfs_node *ptr;
    void           *device;
} vfs_node_t;

// Primary API Entry Points
void            vfs_init(void);
void            init_vfs(void);
int             vfs_mount(const char *path, struct vfs_node *fs_root);
vfs_node_t*     vfs_get_root(void);
size_t          vfs_read(struct vfs_node *node, uint64_t offset, size_t size, uint8_t *buffer);
size_t          vfs_write(struct vfs_node *node, uint64_t offset, size_t size, const uint8_t *buffer);
void            vfs_close(struct vfs_node *node);
struct vfs_dirent *vfs_readdir(struct vfs_node *node, uint32_t index);
struct vfs_node *vfs_finddir(struct vfs_node *node, const char *name);
struct vfs_node *vfs_open(const char *path, int flags);
vfs_node_t*     vfs_lookup_path(vfs_node_t* start_node, const char* path);
