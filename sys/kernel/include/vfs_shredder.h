#pragma once
#include <stdint.h>
#include <stdbool.h>

#define VFS_SHREDDER_MAGIC_TAG 0x56534852 // "VSHR" binary tracking tag
#define MAX_SECTORS_PER_FILE   256

typedef struct {
    uint32_t start_sector;
    uint32_t sector_count;
    uint32_t file_size_bytes;
    bool     is_valid;
} DiskAllocationMap;

typedef struct {
    uint32_t          magic;
    char              source_vfs_path[64];
    char              destination_vfs_path[64];
    DiskAllocationMap source_block_map;
    uint32_t          authorized_operator_pid;
    bool              is_active_transaction;
} VfsMoveTransaction;

// Microkernel Core VFS Extension Mappings
void init_vfs_shredder_engine(void);
bool sys_vfs_execute_cut_paste(uint32_t pid, const char* source_path, const char* dest_path);
bool sys_vfs_execute_drag_drop_move(uint32_t pid, const char* source_path, const char* dest_path);
void scrub_obsolete_source_disk_blocks(const DiskAllocationMap* block_map);