#pragma once
#include <stdint.h>
#include <stdbool.h>
#include <stddef.h>

#define JOURNAL_MAGIC_TAG     0x4A4E4C44 // "JNLD" binary tracking token
#define JOURNAL_MAX_RECORDS   64
#define JOURNAL_SECTOR_START  8000       // Dedicated secure disk boundary for logging metadata

typedef enum {
    TRANS_STAGE_ALLOCATE = 1,
    TRANS_STAGE_COMMIT,
    TRANS_STAGE_COMPLETED
} JournalTransactionStage;

// Explicit packed byte-level transaction log envelope structure
typedef struct __attribute__((packed)) {
    uint32_t transaction_id;
    uint32_t target_lba_sector;
    uint32_t block_count;
    uint8_t  stage_flag; // Uses JournalTransactionStage maps
    uint32_t crc32_payload_checksum;
} JournalTransactionRecord;

typedef struct {
    uint32_t                 magic;
    JournalTransactionRecord ring_buffer[JOURNAL_MAX_RECORDS];
    uint32_t                 write_head_index;
    bool                     is_journal_enabled;
    uint32_t                 total_committed_transactions;
} SecureJournalRegistry;

// Microkernel Core VFS Protection Mappings
void     init_vfs_virtual_journal_driver(void);
uint32_t sys_vfs_journal_open_transaction(uint32_t target_sector, uint32_t count);
void     sys_vfs_journal_update_stage(uint32_t transaction_id, JournalTransactionStage stage);
void     sys_vfs_execute_early_boot_journal_recovery(void);
bool     sys_commit_filesystem_metadata_update(uint32_t target_lba, const uint8_t* metadata_buffer);
