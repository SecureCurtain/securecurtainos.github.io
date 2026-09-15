#pragma once
#include <stdint.h>
#include <stddef.h>

/**
 * Translates a Windows UTF-16 wide-character string into a native UTF-8 string.
 * This implementation includes full variable-length surrogate pair decoding.
 * 
 * @param utf16_src   Pointer to the incoming Windows UTF-16 raw data array.
 * @param utf8_dest   Pointer to the pre-allocated buffer where UTF-8 text will be written.
 * @param max_bytes   The maximum boundary size of the destination buffer to prevent overflows.
 * @return            The absolute number of bytes written to the destination buffer.
 */
static inline size_t convert_utf16_to_utf8(const uint16_t* utf16_src, char* utf8_dest, size_t max_bytes) {
    if (!utf16_src || !utf8_dest || max_bytes == 0) return 0;

    size_t src_index = 0;
    size_t dest_index = 0;

    // Process characters sequentially until hitting a null terminator (0x0000)
    while (utf16_src[src_index] != 0) {
        uint32_t code_point = utf16_src[src_index++];

        // 1. Handle Windows UTF-16 Surrogate Pair Decoding
        // Checks if the character falls within the high surrogate range (0xD800 - 0xDBFF)
        if (code_point >= 0xD800 && code_point <= 0xDBFF) {
            uint32_t low_surrogate = utf16_src[src_index];
            
            // Validate that the matching next word is a valid low surrogate (0xDC00 - 0xDFFF)
            if (low_surrogate >= 0xDC00 && low_surrogate <= 0xDFFF) {
                src_index++; // Consume the low surrogate word
                // Calculate the final 32-bit scalar unicode value
                code_point = ((code_point - 0xD800) << 10) + (low_surrogate - 0xDC00) + 0x10000;
            }
        }

        // 2. Encode the resulting 32-bit Code Point into standard UTF-8 bytes
        if (code_point <= 0x7F) {
            // Standard 1-byte ASCII Character
            if (dest_index + 1 >= max_bytes) break;
            utf8_dest[dest_index++] = (char)code_point;
        } 
        else if (code_point <= 0x7FF) {
            // 2-byte UTF-8 sequence
            if (dest_index + 2 >= max_bytes) break;
            utf8_dest[dest_index++] = (char)(0xC0 | ((code_point >> 6) & 0x1F));
            utf8_dest[dest_index++] = (char)(0x80 | (code_point & 0x3F));
        } 
        else if (code_point <= 0xFFFF) {
            // 3-byte UTF-8 sequence
            if (dest_index + 3 >= max_bytes) break;
            utf8_dest[dest_index++] = (char)(0xE0 | ((code_point >> 12) & 0x0F));
            utf8_dest[dest_index++] = (char)(0x80 | ((code_point >> 6) & 0x3F));
            utf8_dest[dest_index++] = (char)(0x80 | (code_point & 0x3F));
        } 
        else if (code_point <= 0x10FFFF) {
            // 4-byte UTF-8 sequence (Emoji, advanced historical symbols, etc.)
            if (dest_index + 4 >= max_bytes) break;
            utf8_dest[dest_index++] = (char)(0xF0 | ((code_point >> 18) & 0x07));
            utf8_dest[dest_index++] = (char)(0x80 | ((code_point >> 12) & 0x3F));
            utf8_dest[dest_index++] = (char)(0x80 | ((code_point >> 6) & 0x3F));
            utf8_dest[dest_index++] = (char)(0x80 | (code_point & 0x3F));
        }
    }

    // Securely null-terminate the final native string array
    utf8_dest[dest_index] = '\0';
    return dest_index;
}