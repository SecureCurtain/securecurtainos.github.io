#pragma once
#include <stdint.h>

// MFT Attribute Identifiers
#define NTFS_ATTR_STANDARD_INFO 0x10
#define NTFS_ATTR_FILE_NAME     0x30
#define NTFS_ATTR_DATA          0x80
#define NTFS_ATTR_TERMINATOR    0xFFFFFFFF

// The 1024-byte primary MFT Record Header block definition
typedef struct {
    uint32_t magic;                  // Layout must equal "FILE" (0x454C4946)
    uint16_t usa_offset;             // Update Sequence Array layout offset
    uint16_t usa_count;              // Size of Update Sequence Array
    uint64_t lsn;                    // Log File Sequence Number
    uint16_t sequence_number;        // Record generation counter index
    uint16_t hard_link_count;        // Directory link tracking tally
    uint16_t attrs_offset;           // Absolute byte offset to the first attribute
    uint16_t flags;                  // 0x01 = Record In Use, 0x02 = Directory
    uint32_t bytes_in_use;           // True byte length used by the structure
    uint32_t bytes_allocated;         // Always 1024 bytes per standard MFT block
    uint64_t base_mft_record;        // Reference handle linkage if split
    uint16_t next_attr_id;           // Identifier for next allocation tag
} __attribute__((packed)) ntfs_mft_record_header_t;

// Unified Header prefixed onto every sub-attribute block inside an MFT record
typedef struct {
    uint32_t type;                   // e.g., NTFS_ATTR_DATA (0x80)
    uint32_t length;                 // Total byte length of this attribute block
    uint8_t  non_resident;           // 0 = Resident (In MFT), 1 = Non-Resident (On Disk)
    uint8_t  name_length;            // Length of optional attribute name string
    uint16_t name_offset;            // Offset byte array marker to the name string
    uint16_t flags;                  // Compression or Encryption tokens
    uint16_t attribute_id;           // Tracking index signature
} __attribute__((packed)) ntfs_attr_header_t;

// Layout details if the data is small enough to stay inside the 1024-byte MFT record
typedef struct {
    ntfs_attr_header_t header;
    uint32_t value_length;           // Exact size of raw data payload content
    uint16_t value_offset;           // Absolute byte offset marker to the payload data
    uint8_t  resident_flags;         // Indexed buffer markers
    uint8_t  reserved;
} __attribute__((packed)) ntfs_attr_resident_t;

// Layout details used when file data is pushed out onto external disk clusters
typedef struct {
    ntfs_attr_header_t header;
    uint64_t starting_vcn;           // Starting Virtual Cluster Number (VCN)
    uint64_t ending_vcn;             // Ending VCN for this attribute stream
    uint16_t run_offset;             // Byte offset from attr head to the Data Runs
    uint16_t compression_unit_size;  // 0 means uncompressed
    uint32_t padding;
    uint64_t allocated_size;         // Total allocated size on disk
    uint64_t data_size;              // True file byte size 
    uint64_t initialized_size;       // Initialized stream data length
} __attribute__((packed)) ntfs_attr_non_resident_t;

#define NTFS_ATTR_INDEX_ROOT       0x90
#define NTFS_ATTR_INDEX_ALLOCATION 0xA0

// Primary layout block inside an $INDEX_ROOT attribute
typedef struct {
    uint32_t attribute_type;      // Always 0x30 ($FILE_NAME) for directories
    uint32_t collation_rule;       // Sorting behavior (usually case-insensitive)
    uint32_t index_block_size;     // Size of allocated index blocks (usually 4096 bytes)
    uint8_t  clusters_per_block;   // Size in clusters
    uint8_t  padding[3];
} __attribute__((packed)) ntfs_index_root_header_t;

// Standard Header for an Index Header block (found in both Root and Allocation records)
typedef struct {
    uint32_t entries_offset;       // Byte offset from this header to the first index entry
    uint32_t index_length;         // Total size of entries in bytes
    uint32_t allocated_size;       // Allocated tracking envelope size
    uint8_t  flags;                // 0x01 = Has sub-nodes (Large directory B-Tree)
    uint8_t  padding[3];
} __attribute__((packed)) ntfs_index_header_t;

// The actual entry containing individual filename metadata
typedef struct {
    uint64_t indexed_file_mft;     // The MFT record index mapping to this file/folder
    uint16_t entry_length;         // Size of this individual index entry block
    uint16_t stream_length;        // Size of the internal filename attribute
    uint16_t flags;                // 0x01 = Points to a sub-node child cluster
    uint16_t padding;
    // --- Stream Content (Only present if entry_length > 16) ---
    uint64_t parent_mft_record;    // Parent folder MFT reference
    uint64_t creation_time;
    uint64_t altered_time;
    uint64_t mft_changed_time;
    uint64_t read_time;
    uint64_t allocated_size;
    uint64_t real_size;
    uint32_t file_flags;
    uint8_t  name_length;          // Character length of the filename
    uint8_t  name_type;            // POSIX, Win32, or DOS namespace
    uint16_t file_name[1];         // UTF-16 variable-length filename string buffer
} __attribute__((packed)) ntfs_index_entry_t;

// The 4096-byte external Index Buffer primary block definition
typedef struct {
    uint32_t magic;               // Layout must equal "INDX" (0x58444E49)
    uint16_t usa_offset;          // Update Sequence Array layout offset
    uint16_t usa_count;           // Size of Update Sequence Array
    uint64_t lsn;                 // Log File Sequence Number
    uint64_t index_vcn;           // Virtual Cluster Number (VCN) of this block inside the allocation stream
    ntfs_index_header_t header;   // Standard index header (exposes entries_offset and index_length)
} __attribute__((packed)) ntfs_index_buffer_t;