// =========================================================================
// ZERO-COPY NVMe PCIe DIRECT MEMORY ACCESS DRIVER HEADER
// =========================================================================
#ifndef SECURECURTAIN_NVME_DIRECT_H
#define SECURECURTAIN_NVME_DIRECT_H

#include <stdint.h>
#include <stdbool.h>
#include <stddef.h>

#define NVME_MAGIC_TAG         0x4E564D45 // "NVME"
#define NVME_MAX_QUEUE_DEPTH   64
#define NVME_BLOCK_SIZE        4096       // Native 4KB sector alignment

// 64-byte NVMe Submission Queue Entry (SQE)
typedef struct __attribute__((packed)) {
    uint8_t  opcode;               // 0x01 = Write, 0x02 = Read, 0x06 = Identify
    uint8_t  flags;
    uint16_t command_id;
    uint32_t nsid;                 // Namespace ID (usually 1)
    uint64_t reserved0;
    uint64_t metadata_ptr;
    uint64_t prp1;                 // Physical RAM Address pointer 1 (4KB page)
    uint64_t prp2;                 // Physical RAM Address pointer 2
    uint64_t starting_lba;         // Destination/Source disk LBA
    uint16_t num_blocks;           // 0-based block count (0 = 1 block of 4096 bytes)
    uint16_t control;
    uint32_t dsmgmt;
    uint32_t reftag;
    uint16_t apptag;
    uint16_t appmask;
} NvmeSubmissionQueueEntry;

// 16-byte NVMe Completion Queue Entry (CQE)
typedef struct __attribute__((packed)) {
    uint32_t command_specific;
    uint32_t reserved;
    uint16_t sq_head_pointer;
    uint16_t sq_id;
    uint16_t command_id;
    uint16_t status_phase;         // Bit 0 = Phase tag, Bits 1-15 = Status code
} NvmeCompletionQueueEntry;

typedef struct {
    uint32_t                 magic;
    uint64_t                 bar0_mmio_base;
    bool                     controller_ready;
    uint32_t                 sq_head;
    uint32_t                 sq_tail;
    uint32_t                 cq_head;
    uint8_t                  cq_phase_bit;
    uint16_t                 next_command_id;
    uint64_t                 total_sectors_read;
    uint64_t                 total_sectors_written;
} NvmeControllerRegistry;

// Core NVMe Driver API
void init_nvme_direct_dma_driver(void);
bool sys_nvme_read_blocks_dma(uint64_t start_lba, uint16_t block_count, void* dest_physical_addr);
bool sys_nvme_write_blocks_dma(uint64_t start_lba, uint16_t block_count, const void* src_physical_addr);
bool sys_nvme_is_ready(void);

#endif // SECURECURTAIN_NVME_DIRECT_H
