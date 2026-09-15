#include <stdint.h>
#include <stdbool.h>
#include <stddef.h>
#include <string.h>
#include "ntfs_structures.h"

/**
 * Decodes compressed NTFS Data Runs into sequential absolute disk clusters.
 * 
 * @param run_stream       Pointer to the start of the byte array encoding the data runs.
 * @param stream_limit     Max boundary checkpoint to prevent memory runaway.
 * @param out_start_lcn    Output table to store decoded absolute starting clusters.
 * @param out_run_length   Output table to store decoded run lengths.
 * @return                 The total count of fragmented data segments parsed.
 */
size_t ntfs_decode_data_runs(const uint8_t* run_stream, size_t stream_limit, uint64_t* out_start_lcn, uint64_t* out_run_length) {
    size_t stream_idx = 0;
    size_t segment_count = 0;
    int64_t current_lcn = 0; // Accumulates relative cluster offsets over time

    while (stream_idx < stream_limit) {
        uint8_t header = run_stream[stream_idx++];
        
        // A header byte of 0x00 marks the end of the Data Run list
        if (header == 0x00) {
            break;
        }

        uint8_t length_bytes = header & 0x0F;        // Low 4 bits
        uint8_t offset_bytes = (header >> 4) & 0x0F; // High 4 bits

        // Safety verification bounds check
        if (stream_idx + length_bytes + offset_bytes > stream_limit) {
            break;
        }

        // 1. Extract the variable-length Cluster Length variable
        uint64_t run_length = 0;
        for (int i = 0; i < length_bytes; i++) {
            run_length |= ((uint64_t)run_stream[stream_idx++]) << (i * 8);
        }

        // 2. Extract the variable-length signed Cluster Offset (LCN)
        int64_t relative_lcn_offset = 0;
        for (int i = 0; i < offset_bytes; i++) {
            relative_lcn_offset |= ((int64_t)run_stream[stream_idx++]) << (i * 8);
        }

        // Sign-extend the relative LCN if the highest bit of the extracted offset is negative
        if (offset_bytes > 0 && (relative_lcn_offset & (1ULL << ((offset_bytes * 8) - 1)))) {
            for (int i = offset_bytes; i < 8; i++) {
                relative_lcn_offset |= (0xFFULL << (i * 8));
            }
        }

        // 3. Accumulate absolute tracking vector (Offsets are relative to the previous run)
        current_lcn += relative_lcn_offset;

        // 4. Save the calculated segment details into the VFS lookup table
        out_start_lcn[segment_count]  = (uint64_t)current_lcn;
        out_run_length[segment_count] = run_length;
        segment_count++;
    }

    return segment_count;
}

/**
 * Upgraded MFT Record Dissector. Seamlessly handles both Resident and Non-Resident $DATA.
 */
size_t ntfs_read_file_data(const uint8_t* mft_buffer, uint64_t* out_clusters, uint64_t* out_lengths, bool* is_non_resident) {
    const ntfs_mft_record_header_t* record = (const ntfs_mft_record_header_t*)mft_buffer;
    if (record->magic != 0x454C4946) return 0;

    uintptr_t current_attr_offset = (uintptr_t)mft_buffer + record->attrs_offset;
    size_t processed_bytes = record->attrs_offset;

    while (processed_bytes < record->bytes_in_use) {
        const ntfs_attr_header_t* attr = (const ntfs_attr_header_t*)current_attr_offset;
        if (attr->type == NTFS_ATTR_TERMINATOR || attr->length == 0) break;

        if (attr->type == NTFS_ATTR_DATA) {
            if (attr->non_resident == 0) {
                // Handle Resident Data (Small files mapped inside previous step)
                *is_non_resident = false;
                return attr->length;
            } 
            else {
                // Handle Non-Resident Data (Large Files split across clusters)
                *is_non_resident = true;
                const ntfs_attr_non_resident_t* non_res_attr = (const ntfs_attr_non_resident_t*)attr;
                
                // Point directly to where the encoded Data Run byte stream begins
                const uint8_t* run_stream_start = (const uint8_t*)((uintptr_t)non_res_attr + non_res_attr->run_offset);
                size_t stream_limit_size = non_res_attr->header.length - non_res_attr->run_offset;

                // Fire the data run decompressor engine
                return ntfs_decode_data_runs(run_stream_start, stream_limit_size, out_clusters, out_lengths);
            }
        }
        processed_bytes     += attr->length;
        current_attr_offset += attr->length;
    }
    return 0;
}

/**
 * Parses a single 1024-byte raw MFT record buffer to extract resident file data.
 */
size_t ntfs_parse_mft_resident_data(const uint8_t* mft_buffer, uint8_t* out_data, size_t max_size) {
    if (!mft_buffer || !out_data) return 0;

    const ntfs_mft_record_header_t* record = (const ntfs_mft_record_header_t*)mft_buffer;
    if (record->magic != 0x454C4946) {
        return 0;
    }

    uintptr_t current_attr_offset = (uintptr_t)mft_buffer + record->attrs_offset;
    size_t processed_bytes = record->attrs_offset;

    while (processed_bytes < record->bytes_in_use) {
        const ntfs_attr_header_t* attr = (const ntfs_attr_header_t*)current_attr_offset;

        if (attr->type == NTFS_ATTR_TERMINATOR || attr->length == 0) {
            break;
        }

        if (attr->type == NTFS_ATTR_DATA) {
            if (attr->non_resident == 0) {
                const ntfs_attr_resident_t* resident_attr = (const ntfs_attr_resident_t*)attr;
                const uint8_t* raw_payload_ptr = (const uint8_t*)((uintptr_t)resident_attr + resident_attr->value_offset);
                
                size_t bytes_to_copy = resident_attr->value_length;
                if (bytes_to_copy > max_size) {
                    bytes_to_copy = max_size;
                }

                memcpy(out_data, raw_payload_ptr, bytes_to_copy);
                return bytes_to_copy;
            } 
            else {
                return 0; 
            }
        }

        processed_bytes      += attr->length;
        current_attr_offset += attr->length;
    }

    return 0;
}

