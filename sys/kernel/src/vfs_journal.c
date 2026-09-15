#include "vfs_journal.h"
#include "security_panic.h"
#include "security_audit.h"
#include <string.h>
#include <stdio.h>

static SecureJournalRegistry g_vfs_journal;

extern void write_raw_disk_sector(uint16_t port, uint32_t sector, const uint8_t* buffer);
extern void read_raw_disk_sector(uint16_t port, uint32_t sector, uint8_t* buffer);

// Low-overhead cyclic polynomial step to compute transaction metadata integrity signatures
static uint32_t calculate_journal_crc32_stub(const JournalTransactionRecord* rec) {
    uint32_t crc = 0xFFFFFFFF;
    const uint8_t* bytes = (const uint8_t*)rec;
    for (size_t i = 0; i < sizeof(JournalTransactionRecord) - 4; i++) {
        crc ^= bytes[i];
        for (uint8_t bit = 0; bit < 8; bit++) {
            if (crc & 1) crc = (crc >> 1) ^ 0xEDB88320;
            else         crc >>= 1;
        }
    }
    return ~crc;
}

void init_vfs_virtual_journal_driver(void) {
    memset(&g_vfs_journal, 0, sizeof(SecureJournalRegistry));
    g_vfs_journal.magic = JOURNAL_MAGIC_TAG;
    g_vfs_journal.write_head_index = 0;
    g_vfs_journal.total_committed_transactions = 0;
    g_vfs_journal.is_journal_enabled = true;

    printf("[Kernel VFS Journal]: Atomic filesystem transaction shield active.\\n");
}

uint32_t sys_vfs_journal_open_transaction(uint32_t target_sector, uint32_t count) {
    if (!g_vfs_journal.is_journal_enabled) return 0;

    uint32_t idx = g_vfs_journal.write_head_index;
    JournalTransactionRecord* rec = &g_vfs_journal.ring_buffer[idx];

    static uint32_t atomic_transaction_counter = 5500;
    rec->transaction_id = atomic_transaction_counter++;
    rec->target_lba_sector = target_sector;
    rec->block_count = count;
    rec->stage_flag = TRANS_STAGE_ALLOCATE;
    rec->crc32_payload_checksum = calculate_journal_crc32_stub(rec);

    // Force an immediate out-of-band write to the dedicated physical journal partition blocks
    uint8_t journal_sector_block[512];
    memset(journal_sector_block, 0, 512);
    memcpy(journal_sector_block, rec, sizeof(JournalTransactionRecord));
    
    // Write out straight to the hardware logging allocation channels
    write_raw_disk_sector(0x1F0, JOURNAL_SECTOR_START + idx, journal_sector_block);

    g_vfs_journal.write_head_index = (g_vfs_journal.write_head_index + 1) % JOURNAL_MAX_RECORDS;
    return rec->transaction_id;
}

void sys_vfs_journal_update_stage(uint32_t transaction_id, JournalTransactionStage stage) {
    for (uint32_t i = 0; i < JOURNAL_MAX_RECORDS; i++) {
        JournalTransactionRecord* rec = &g_vfs_journal.ring_buffer[i];
        if (rec->transaction_id == transaction_id) {
            rec->stage_flag = (uint8_t)stage;
            rec->crc32_payload_checksum = calculate_journal_crc32_stub(rec);

            uint8_t journal_sector_block[512];
            memset(journal_sector_block, 0, 512);
            memcpy(journal_sector_block, rec, sizeof(JournalTransactionRecord));
            write_raw_disk_sector(0x1F0, JOURNAL_SECTOR_START + i, journal_sector_block);

            if (stage == TRANS_STAGE_COMPLETED) {
                g_vfs_journal.total_committed_transactions++;
            }
            return;
        }
    }
}

void sys_vfs_execute_early_boot_journal_recovery(void) {
    printf("[VFS Recovery]: Scanning journal partition for interrupted transactions...\\n");
    uint8_t recovery_buffer[512];

    for (uint32_t i = 0; i < JOURNAL_MAX_RECORDS; i++) {
        read_raw_disk_sector(0x1F0, JOURNAL_SECTOR_START + i, recovery_buffer);
        JournalTransactionRecord rec;
        memcpy(&rec, recovery_buffer, sizeof(JournalTransactionRecord));

        if (rec.transaction_id != 0) {
            uint32_t check = calculate_journal_crc32_stub(&rec);
            if (check != rec.crc32_payload_checksum) {
                continue; // Malformed entry or unwritten slot, skip
            }

            // CRASH DETECTION: If a transaction remains stuck in the COMMIT stage, a power failure occurred
            if (rec.stage_flag == TRANS_STAGE_COMMIT) {
                char alert[128];
                snprintf(alert, sizeof(alert), "VFS Recovery: Uncommitted transaction ID %d intercepted on LBA %d.", 
                         rec.transaction_id, rec.target_lba_sector);
                commit_security_audit_entry(0x0004, "JOURNAL_RECOVERY", alert);
                printf("[VFS Recovery Alert]: %s Rollback enforced.\\n", alert);

                // Zero out the corrupted sector block target to maintain metadata consistency
                uint8_t sterile_block[512];
                memset(sterile_block, 0, 512);
                write_raw_disk_sector(0x1F0, rec.target_lba_sector, sterile_block);
            }
        }
    }
    printf("[VFS Recovery]: Journal audit pass complete. Storage partition stabilized.\\n");
}

bool sys_commit_filesystem_metadata_update(uint32_t target_lba, const uint8_t* metadata_buffer) {
    if (!metadata_buffer) return false;

    // 1. Open an atomic transaction block inside Ring 0 to protect the data layout
    uint32_t tx_id = sys_vfs_journal_open_transaction(target_lba, 1);
    if (tx_id == 0) return false;

    // 2. Transition the transaction state into the COMMIT stage
    sys_vfs_journal_update_stage(tx_id, TRANS_STAGE_COMMIT);

    // 3. Write out the actual data block parameters onto the persistent drive hardware ports
    write_raw_disk_sector(0x1F0, target_lba, metadata_buffer);

    // 4. Seal the transaction as safely written
    sys_vfs_journal_update_stage(tx_id, TRANS_STAGE_COMPLETED);
    return true;
}
