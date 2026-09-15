#include <stddef.h>
#include <stdbool.h>
#include <string.h>
#include "ntfs_structures.h"
#include "../win32/win32_string.h" // Holds your convert_utf16_to_utf8 string utility

/**
 * Traverses an $INDEX_ROOT attribute block to resolve a target filename to its MFT record index.
 * 
 * @param index_root_attr  Pointer to the start of the resident $INDEX_ROOT attribute.
 * @param target_name      The standard null-terminated UTF-8 name string you are looking for.
 * @return                 The 64-bit target MFT Record Index identifier, or 0 if not found.
 */
uint64_t ntfs_resolve_directory_entry(const uint8_t* index_root_attr, const char* target_name) {
    if (!index_root_attr || !target_name) return 0;

    const ntfs_attr_header_t* attr = (const ntfs_attr_header_t*)index_root_attr;
    if (attr->type != NTFS_ATTR_INDEX_ROOT || attr->non_resident != 0) {
        return 0; // Guard clause: Must be a resident Index Root structural layout
    }

    // Advance past the standard Resident Attribute header to reach the internal values
    uintptr_t value_start = (uintptr_t)index_root_attr + ((const ntfs_attr_resident_t*)attr)->value_offset;
    
    // Jump past the root header block to land on the sub-index header block
    const ntfs_index_header_t* index_hdr = (const ntfs_index_header_t*)(value_start + sizeof(ntfs_index_root_header_t));
    
    // Locate the first index entry item using the offset parameter
    uintptr_t current_entry_ptr = (uintptr_t)index_hdr + index_hdr->entries_offset;
    size_t scanned_bytes = index_hdr->entries_offset;

    // Iterate through the index entry array
    while (scanned_bytes < index_hdr->index_length) {
        const ntfs_index_entry_t* entry = (const ntfs_index_entry_t*)current_entry_ptr;

        // Break if we reach the end of the entry table descriptor block
        if (entry->entry_length == 0 || (entry->flags & 0x02)) {
            break; 
        }

        // Parse filename string metadata if the block contains valid data streams
        if (entry->stream_length > 0 && entry->name_length > 0) {
            char current_utf8_filename[256];
            
            // Translate the NTFS target directory UTF-16 wide string entry into native UTF-8
            convert_utf16_to_utf8(entry->file_name, current_utf8_filename, entry->name_length);

            // Compare entry name against our desired VFS path string asset target
            if (strcmp(current_utf8_filename, target_name) == 0) {
                return entry->indexed_file_mft; // Success: Found matching MFT path node reference!
            }
        }

        // If the B-Tree entry points to a sub-node child cluster and target isn't here,
        // a production driver would extract the child cluster VCN value from the trailing bytes
        // of this entry block and recursively search the $INDEX_ALLOCATION cluster list.

        // Advance loop pointers forward to the next index segment
        scanned_bytes     += entry->entry_length;
        current_entry_ptr += entry->entry_length;
    }

    return 0; // The requested filename asset does not exist inside this directory root node
}
