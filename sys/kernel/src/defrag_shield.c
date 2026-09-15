#include "defrag_shield.h"
#include "vfs_shredder.h"
#include "rbac.h"
#include "security_panic.h"
#include "security_audit.h"
#include <string.h>
#include <stdio.h>

static SecureDefragRegistry g_defrag_shield;

extern void read_raw_disk_sector(uint16_t port, uint32_t sector, uint8_t* buffer);
extern void write_raw_disk_sector(uint16_t port, uint32_t sector, const uint8_t* buffer);
extern void scrub_obsolete_source_disk_blocks(const DiskAllocationMap* block_map);

void init_vfs_defragmenter_shield(void) {
    memset(&g_defrag_shield, 0, sizeof(SecureDefragRegistry));
    g_defrag_shield.magic = DEFRAG_MAGIC_TAG;
    g_defrag_shield.queue_head = 0;
    g_defrag_shield.total_optimized_clusters = 0;
    g_defrag_shield.is_shield_active = true;

    printf("[Kernel Defrag Shield]: Secure encrypted sector re-alignment engine online.\\n");
}

bool sys_queue_cluster_optimization(uint32_t calling_pid, uint32_t src_lba, uint32_t dst_lba, uint32_t count) {
    if (!g_defrag_shield.is_shield_active || g_defrag_shield.queue_head >= MAX_DEFRAG_QUEUE) return false;

    // PRIVILEGE BARRIER: Defragmentation scheduling requires explicit System Configuration role rights
    if (!rbac_verify_privilege(calling_pid, 0x00000004 /* PERM_MODIFY_SYSTEM_TIME | REGISTRY mask */)) {
        printf("[Defrag Shield Error]: Denied. Insufficient administrative credentials.\\n");
        return false;
    }

    DefragAllocationTx* tx = &g_defrag_shield.optimization_queue[g_defrag_shield.queue_head];
    tx->source_cluster_lba = src_lba;
    tx->destination_cluster_lba = dst_lba;
    tx->cluster_size_sectors = count;
    tx->is_pending = true;

    g_defrag_shield.queue_head++;
    return true;
}

void execute_secure_defrag_pass(void) {
    if (g_defrag_shield.queue_head == 0) return;

    uint8_t sector_transfer_frame[512];
    printf("[Defrag Shield]: Running secure transactional sector restructuring sweep...\\n");

    for (uint32_t i = 0; i < g_defrag_shield.queue_head; i++) {
        DefragAllocationTx* tx = &g_defrag_shield.optimization_queue[i];
        if (!tx->is_pending) continue;

        // 1. Relocate the raw encrypted sector strings to the new contiguous block boundaries
        for (uint32_t s = 0; s < tx->cluster_size_sectors; s++) {
            read_raw_disk_sector(0x1F0, tx->source_cluster_lba + s, sector_transfer_frame);
            write_raw_disk_sector(0x1F0, tx->destination_cluster_lba + s, sector_transfer_frame);
        }

        // 2. Map and package obsolete sector metadata boundaries into an isolation container
        DiskAllocationMap obsolete_map;
        obsolete_map.start_sector = tx->source_cluster_lba;
        obsolete_map.sector_count = tx->cluster_size_sectors;
        obsolete_map.file_size_bytes = tx->cluster_size_sectors * 512;
        obsolete_map.is_valid = true;

        // 3. HOOK THE SHREDDER: Securely sanitize and destroy data tracks left on old sectors
        // Invokes the 3-pass overwrite loop (random data, bit flips, zero fill) from vfs_shredder.c
        scrub_obsolete_source_disk_blocks(&obsolete_map);

        tx->is_pending = false;
        g_defrag_shield.total_optimized_clusters++;
    }

    g_defrag_shield.queue_head = 0; // Clear execution queue cleanly
}
