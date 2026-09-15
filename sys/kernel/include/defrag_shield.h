#pragma once
#include <stdint.h>
#include <stdbool.h>

#define DEFRAG_MAGIC_TAG     0x44465247 // "DFRG" binary tracking tag
#define MAX_DEFRAG_QUEUE     64

typedef struct {
    uint32_t source_cluster_lba;
    uint32_t destination_cluster_lba;
    uint32_t cluster_size_sectors;
    bool     is_pending;
} DefragAllocationTx;

typedef struct {
    uint32_t           magic;
    DefragAllocationTx optimization_queue[MAX_DEFRAG_QUEUE];
    uint32_t           queue_head;
    uint32_t           total_optimized_clusters;
    bool               is_shield_active;
} SecureDefragRegistry;

void init_vfs_defragmenter_shield(void);
bool sys_queue_cluster_optimization(uint32_t calling_pid, uint32_t src_lba, uint32_t dst_lba, uint32_t count);
void execute_secure_defrag_pass(void);