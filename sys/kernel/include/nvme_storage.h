#pragma once
#include <stdint.h>
#include <stdbool.h>
#include <stddef.h>

#define NVME_MAGIC_TAG           0x4E564D45 // "NVME" binary tracking token
#define NVME_SECTOR_SIZE         512
#define NVME_MAX_QUEUE_ENTRIES   64
#define NVME_CACHE_LINES         64         // 64 cache lines x 64KB = 4MB High-Speed LRU Cache
#define NVME_CACHE_BLOCK_SIZE    (64 * 1024)

// NVMe Submission Queue Entry (64 bytes)
typedef struct __attribute__((packed)) {
    uint8_t  opcode;
    uint8_t  flags;
    uint16_t command_id;
    uint32_t namespace_id;
    uint64_t reserved;
    uint64_t metadata_ptr;
    uint64_t prp1;
    uint64_t prp2;
    uint32_t cdw10; // Starting LBA low
    uint32_t cdw11; // Starting LBA high
    uint32_t cdw12; // Number of Logical Blocks (0-based)
    uint32_t cdw13;
    uint32_t cdw14;
    uint32_t cdw15;
} NvmeSqEntry;

// NVMe Completion Queue Entry (16 bytes)
typedef struct __attribute__((packed)) {
    uint32_t command_specific;
    uint32_t reserved;
    uint16_t sq_head;
    uint16_t sq_id;
    uint16_t command_id;
    uint16_t status; // Phase bit at bit 0
} NvmeCqEntry;

// NVMe LRU Block Cache Line
typedef struct {
    uint64_t starting_lba;
    uint8_t  data_block[NVME_CACHE_BLOCK_SIZE];
    uint64_t last_access_timestamp;
    bool     is_valid;
    bool     is_dirty;
} NvmeCacheLine;

// Master NVMe Controller Context
typedef struct {
    uint32_t      magic;
    uint64_t      bar0_phys_base;
    uint32_t      admin_sq_tail;
    uint32_t      admin_cq_head;
    uint32_t      io_sq_tail;
    uint32_t      io_cq_head;
    uint16_t      next_cmd_id;
    uint64_t      total_sectors_read;
    uint64_t      total_sectors_written;
    uint64_t      cache_hits;
    uint64_t      cache_misses;
    NvmeCacheLine lru_cache[NVME_CACHE_LINES];
} NvmeControllerRegistry;

// Primary NVMe Driver & Cache APIs
void init_nvme_storage_subsystem(void);
bool nvme_read_sectors_cached(uint64_t lba, uint32_t sector_count, uint8_t* out_buffer);
bool nvme_write_sectors_cached(uint64_t lba, uint32_t sector_count, const uint8_t* in_buffer);
void nvme_flush_dirty_cache_lines(void);
void nvme_get_performance_telemetry(uint64_t* reads, uint64_t* writes, uint64_t* hits, uint64_t* misses);
