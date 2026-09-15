#include "vfs_shredder.h"
#include "sandbox.h"
#include "page_shredder.h"
#include "security_panic.h"
#include "security_audit.h"
#include <string.h>
#include <stdio.h>

static VfsMoveTransaction g_active_move_tx;

// Low-level VFS driver linkage bindings matching your custom storage adapters
extern int32_t vfs_open(const char* path, const char* mode);
extern int32_t vfs_read(int32_t fd, uint8_t* buffer, uint32_t len);
extern int32_t vfs_write(int32_t fd, const uint8_t* buffer, uint32_t len);
extern void    vfs_close(int32_t fd);
extern bool    vfs_delete_file(const char* path);
extern bool    vfs_query_allocation_map(const char* path, DiskAllocationMap* out_map);
extern void    write_block_to_vfs_swap_node(uint32_t sector, const uint8_t* data); // Raw sector writer
extern uint8_t query_true_hardware_random_byte(void);

void init_vfs_shredder_engine(void) {
    memset(&g_active_move_tx, 0, sizeof(VfsMoveTransaction));
    g_active_move_tx.magic = VFS_SHREDDER_MAGIC_TAG;
    g_active_move_tx.is_active_transaction = false;
    
    printf("[Kernel VFS Shredder]: Transactional asset relocation scrubbers operational.\\n");
}

static bool perform_core_file_relocation(uint32_t pid, const char* source_path, const char* dest_path) {
    // 1. Gather disk allocation metrics regarding the target source file component
    if (!vfs_query_allocation_map(source_path, &g_active_move_tx.source_block_map)) {
        return false; // Source file path unavailable
    }

    g_active_move_tx.authorized_operator_pid = pid;
    g_active_move_tx.is_active_transaction = true;
    strncpy(g_active_move_tx.source_vfs_path, source_path, 63);
    strncpy(g_active_move_tx.destination_vfs_path, dest_path, 63);

    // 2. Open and duplicate file payload streams to the target destination
    int32_t src_fd = vfs_open(source_path, "rb");
    int32_t dst_fd = vfs_open(dest_path, "wb");
    
    if (src_fd < 0 || dst_fd < 0) {
        if (src_fd >= 0) vfs_close(src_fd);
        if (dst_fd >= 0) vfs_close(dst_fd);
        g_active_move_tx.is_active_transaction = false;
        return false;
    }

    uint8_t transaction_staging_buffer[4096]; // 4KB stream buffer page frame window
    int32_t read_bytes = 0;
    
    while ((read_bytes = vfs_read(src_fd, transaction_staging_buffer, 4096)) > 0) {
        vfs_write(dst_fd, transaction_staging_buffer, read_bytes);
    }

    vfs_close(src_fd);
    vfs_close(dst_fd);
    return true;
}

bool sys_vfs_execute_cut_paste(uint32_t pid, const char* source_path, const char* dest_path) {
    printf("[VFS Transaction]: Initiating Secure Cut-and-Paste sequence mapping...\\n");
    
    if (!perform_core_file_relocation(pid, source_path, dest_path)) return false;

    // 3. Data replication complete: Delete directory metadata references
    vfs_delete_file(g_active_move_tx.source_vfs_path);

    // 4. HOOK THE SHREDDER: Permanently sanitize the old raw storage blocks
    scrub_obsolete_source_disk_blocks(&g_active_move_tx.source_block_map);

    g_active_move_tx.is_active_transaction = false;
    return true;
}

bool sys_vfs_execute_drag_drop_move(uint32_t pid, const char* source_path, const char* dest_path) {
    printf("[VFS Transaction]: Initiating Drag-and-Drop hardware move trajectory...\\n");
    
    if (!perform_core_file_relocation(pid, source_path, dest_path)) return false;

    // Data replication complete: Delete directory metadata references
    vfs_delete_file(g_active_move_tx.source_vfs_path);

    // HOOK THE SHREDDER: Permanently sanitize the old raw storage blocks
    scrub_obsolete_source_disk_blocks(&g_active_move_tx.source_block_map);

    g_active_move_tx.is_active_transaction = false;
    return true;
}

void scrub_obsolete_source_disk_blocks(const DiskAllocationMap* block_map) {
    if (!block_map->is_valid || block_map->sector_count == 0) return;

    printf("[VFS Shredder]: Wiping obsolete disk blocks starting at sector %d (%d sectors total)\\n", 
           block_map->start_sector, block_map->sector_count);

    uint8_t zero_shred_sector[512]; // Sector clearing block alignment frame
    uint8_t random_shred_sector[512];

    // =========================================================================
    // MULTI-LEVEL STORAGE DEVICE SANITIZATION PASSES (DoD 5220.22-M Standardized)
    // =========================================================================
    
    // Pass 1: Flood sector chunks with high-entropy hardware random data
    for (uint32_t b = 0; b < 512; b++) {
        random_shred_sector[b] = query_true_hardware_random_byte();
    }
    for (uint32_t s = 0; s < block_map->sector_count; s++) {
        write_block_to_vfs_swap_node(block_map->start_sector + s, random_shred_sector);
    }

    // Pass 2: Complement bit flip pass to exhaust capacitive platter storage blocks
    for (uint32_t b = 0; b < 512; b++) {
        random_shred_sector[b] = ~random_shred_sector[b];
    }
    for (uint32_t s = 0; s < block_map->sector_count; s++) {
        write_block_to_vfs_swap_node(block_map->start_sector + s, random_shred_sector);
    }

    // Pass 3: Sterile zero out completion pass to return blank blocks to free queues
    memset(zero_shred_sector, 0, 512);
    for (uint32_t s = 0; s < block_map->sector_count; s++) {
        write_block_to_vfs_swap_node(block_map->start_sector + s, zero_shred_sector);
    }

    // Audit trace commit entry log record updating
    char logs[128];
    snprintf(logs, sizeof(logs), "VFS Shredder: Relocation complete. Sanitized %d raw storage blocks.", block_map->sector_count);
    commit_security_audit_entry(EVENT_POWER_STATE_CHANGE, "VFS_CLEANER", logs);
}
