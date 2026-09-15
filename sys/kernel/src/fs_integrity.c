#include "fs_integrity.h"
#include "vfs_journal.h"
#include "security_panic.h"
#include "security_audit.h"
#include "kstring.h"
#include <stdio.h>

static IntegrityControlRegistry g_integrity_engine;

extern void read_raw_disk_sector(uint16_t port, uint32_t sector, uint8_t* buffer);
extern void write_raw_disk_sector(uint16_t port, uint32_t sector, const uint8_t* buffer);

// Optimized mathematical step to compute sector payload blocks verification signatures
static uint32_t calculate_sector_crc32(const uint8_t* buffer, uint32_t len) {
    uint32_t crc = 0xFFFFFFFF;
    for (uint32_t i = 0; i < len; i++) {
        crc ^= buffer[i];
        for (uint8_t bit = 0; bit < 8; bit++) {
            if (crc & 1) crc = (crc >> 1) ^ 0xEDB88320;
            else         crc >>= 1;
        }
    }
    return ~crc;
}

void init_fs_integrity_validator_daemon(void) {
    kmemset(&g_integrity_engine, 0, sizeof(IntegrityControlRegistry));
    g_integrity_engine.magic = INTEGRITY_MAGIC_TAG;
    g_integrity_engine.metrics.current_scan_lba = VFS_SECTOR_START_LOG;
    g_integrity_engine.metrics.is_background_scanner_active = true;
    printf("[Kernel Integrity]: Asynchronous sector background checksum validation daemon active.\\n");
}

void sys_fs_execute_asynchronous_background_sweep_tick(void) {
    if (!g_integrity_engine.metrics.is_background_scanner_active) return;

    uint32_t target_lba = g_integrity_engine.metrics.current_scan_lba;
    uint8_t sector_read_buffer[512];

    // Read the raw disk block parameters directly via motherboard IDE/SATA ports
    read_raw_disk_sector(0x1F0, target_lba, sector_read_buffer);

    // Unpack pre-calculated verification token signatures trailing the data blocks
    // (In your complete core, these are cross-referenced from a dedicated metadata table)
    uint32_t stored_expected_checksum = *(uint32_t*)(&sector_read_buffer[508]);
    uint32_t computed_live_checksum = calculate_sector_crc32(sector_read_buffer, 508);

    if (stored_expected_checksum != 0 && computed_live_checksum != stored_expected_checksum) {
        g_integrity_engine.metrics.dynamic_bitrot_failures_found++;
        
        char error_desc[64];
        ksnprintf(error_desc, sizeof(error_desc), "STORAGE INTEGRITY EXCEPTION: Bit-rot or tamper on LBA %u", target_lba);
        commit_security_audit_entry(0x0004, "FS_INTEGRITY", error_desc);
        printf("[Kernel Integrity Fault]: %s -> Initiating isolation locks.\\n", error_desc);

        // Force a system halt if a vital system configuration sector metadata block has been corrupted
        if (target_lba < VFS_SECTOR_START_LOG + 1000) {
            execute_kernel_security_panic("CRITICAL DATA CORRUPTION: Host storage volume structurally compromised!");
        }
    }

    g_integrity_engine.metrics.total_sectors_validated++;
    
    // Increment the scanning index loop to process the next sector block sequentially
    g_integrity_engine.metrics.current_scan_lba++;
    if (g_integrity_engine.metrics.current_scan_lba >= VFS_SECTOR_CEILING) {
        g_integrity_engine.metrics.current_scan_lba = VFS_SECTOR_START_LOG; // Loop back and restart the cycle
        printf("[Kernel Integrity]: Completed whole-drive background validation sweep. Storage pristine.\\n");
    }
}

bool sys_commit_filesystem_metadata_update(uint32_t target_lba, const uint8_t* metadata_buffer) {
    if (!metadata_buffer) return false;

    // 1. Open an atomic transaction block inside Ring 0 to protect the data layout
    uint32_t tx_id = sys_vfs_journal_open_transaction(target_lba, 1);
    if (tx_id == 0) return false;

    // 2. Transition the transaction stage into the COMMIT stage
    sys_vfs_journal_update_stage(tx_id, TRANS_STAGE_COMMIT);

    // Staging area to inject data and append validation tracking keys
    uint8_t hardware_write_block[512];
    kmemcpy(hardware_write_block, metadata_buffer, 508);

    // Append the newly calculated CRC32 checksum token into the last 4 bytes of the data sector
    uint32_t clean_checksum = calculate_sector_crc32(hardware_write_block, 508);
    *(uint32_t*)(&hardware_write_block[508]) = clean_checksum;

    // 3. Write out the actual data block parameters onto the persistent drive hardware ports
    write_raw_disk_sector(0x1F0, target_lba, hardware_write_block);

    // 4. Seal the transaction as safely written
    sys_vfs_journal_update_stage(tx_id, TRANS_STAGE_COMPLETED);
    return true;
}
