#pragma once
#include <stdint.h>

// Unique VFS IPC Command IDs
#define VFS_CMD_OPEN   0x601
#define VFS_CMD_READ   0x602
#define VFS_CMD_WRITE  0x603
#define VFS_CMD_CLOSE  0x604

// Supported File System Magic Types
#define FS_TYPE_NATIVE_EXT2 1
#define FS_TYPE_WIN_FAT32   2
#define FS_TYPE_WIN_NTFS    3

// Structural packet sent by clients to open a file descriptor
typedef struct {
    char     absolute_path[256]; // Normalized UTF-8 string path
    uint32_t access_flags;       // Combined read/write permissions
    uint32_t creation_mode;      // Create new, open existing, etc.
} vfs_open_request_t;

// Structural packet sent by clients to read from a handle
typedef struct {
    uint32_t file_handle;
    uint32_t bytes_requested;
    uint64_t file_offset;
} vfs_read_request_t;