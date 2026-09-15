#include <stddef.h>
#include <stdbool.h>
#include <string.h>
#include "ntfs_structures.h"
#include "../win32/win32_string.h" // Holds your convert_utf16_to_utf8 string utility

/**
 * Parses an external 4096-byte Index Allocation Buffer block to locate a filename.
 * 
 * @param buffer          Pointer to the 4096-byte raw buffer read from the disk partition.
 * @param target_name     The standard null-terminated UTF-8 filename target string.
 * @param out_next_vcn    Output variable populated with the next child cluster VCN if a B-Tree traversal is required.
 * @param is_child_node   Output flag set to true if the search hit a sub-node branching vector.
 * @return                The 64-bit target MFT Record Index identifier, or 0 if not found/needs traversal.
 */
uint64_t ntfs_parse_index_allocation_block(const uint8_t* buffer, const char* target_name, uint64_t* out_next_vcn, bool* is_child_node) {
    if (!buffer || !target_name || !out_next_vcn || !is_child_node) return 0;

    *is_child_node = false;

    // 1. Verify structural layout validity via Magic Check
    const ntfs_index_buffer_t* idx_block = (const ntfs_index_buffer_t*)buffer;
    if (idx_block->magic != 0x58444E49) { // Compares against "INDX" ASCII encoding
        return 0; // Invalid or corrupt index allocation cluster payload
    }

    // 2. Identify the absolute baseline pointer to the first index entry structure
    // We add the offset parameters directly relative to the inner structural header block position
    uintptr_t current_entry_ptr = (uintptr_t)&idx_block->header + idx_block->header.entries_offset;
    size_t scanned_bytes = idx_block->header.entries_offset;

    // 3. Scan entries sequentially up to the length boundary declared by the index block header
    while (scanned_bytes < idx_block->header.index_length) {
        const ntfs_index_entry_t* entry = (const ntfs_index_entry_t*)current_entry_ptr;

        // Check if we hit the terminating structural padding entry token of the array list
        if (entry->entry_length == 0 || (entry->flags & 0x02)) {
            // 4. B-TREE ENTRY EVALUATION: Does this terminal boundary point to an internal sub-node branch?
            if (entry->flags & 0x01) {
                // The 64-bit Virtual Cluster Number (VCN) of the child node is stored at the absolute end of the entry block
                *out_next_vcn = *(uint64_t*)((uintptr_t)entry + entry->entry_length - 8);
                *is_child_node = true;
            }
            break;
        }

        // 5. NAME MATCH ROUTINE: Dissect entry strings if metadata streams are populated
        if (entry->stream_length > 0 && entry->name_length > 0) {
            char current_utf8_filename[256];
            
            // Translate the NTFS target multi-byte UTF-16 wide string entry into native UTF-8
            convert_utf16_to_utf8(entry->file_name, current_utf8_filename, entry->name_length);

            // Compare entry name against our desired path target string asset
            int cmp_result = strcmp(target_name, current_utf8_filename);
            if (cmp_result == 0) {
                return entry->indexed_file_mft; // Success: Found matching MFT path node reference!
            }
            
            // Optimization Check: Since the entries are sorted alphabetically inside the B-Tree,
            // if our target string sorts *before* the current entry name string, we know our asset
            // cannot exist further down this array line. It must reside in a lower sub-node branch.
            if (cmp_result < 0 && (entry->flags & 0x01)) {
                *out_next_vcn = *(uint64_t*)((uintptr_t)entry + entry->entry_length - 8);
                *is_child_node = true;
                break;
            }
        }

        // Advance loop pointers forward to the next index segment boundary position
        scanned_bytes     += entry->entry_length;
        current_entry_ptr += entry->entry_length;
    }

    return 0; // Not found on this block page layer
}
