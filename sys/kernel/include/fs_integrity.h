#pragma once
#include <stdint.h>
#include <stdbool.h>

#define INTEGRITY_MAGIC_TAG   0x46534947 // "FSIG" binary tracking token
#define VFS_SECTOR_START_LOG  100000     // Primary boundary where user file blocks sit
#define VFS_SECTOR_CEILING    500000

typedef struct {
    uint32_t current_scan_lba;
    uint64_t total_sectors_validated;
    uint32_t dynamic_bitrot_failures_found;
    bool     is_background_scanner_active;
} IntegrityStatsRegistry;

typedef struct {
    uint32_t               magic;
    IntegrityStatsRegistry metrics;
} IntegrityControlRegistry;

void init_fs_integrity_validator_daemon(void);
void sys_fs_execute_asynchronous_background_sweep_tick(void);
bool sys_commit_filesystem_metadata_update(uint32_t target_lba, const uint8_t* metadata_buffer);
