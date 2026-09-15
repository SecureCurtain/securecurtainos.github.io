#pragma once
#include <stdint.h>
#include <stdbool.h>

#define CLIPBOARD_HISTORY_LIMIT  5
#define CLIPBOARD_MAX_DATA_SIZE  256
#define CLIPBOARD_MAGIC_TAG      0x434C4950 // "CLIP" binary structural tracking tag

// Container slot for a single encrypted copy transaction
typedef struct {
    uint32_t slot_id;
    uint32_t source_pid;
    uint32_t timestamp_ms;
    uint32_t data_bytes_len;
    uint8_t  encrypted_payload[CLIPBOARD_MAX_DATA_SIZE];
} ClipboardItemNode;

typedef struct {
    uint32_t          magic;
    ClipboardItemNode history[CLIPBOARD_HISTORY_LIMIT];
    uint32_t          head_index;
    uint32_t          total_stored_actions;
} EncryptedClipboardRegistry;

// Microkernel Secure System Call Mappings
void init_encrypted_clipboard_manager(void);
void sys_clipboard_copy(uint32_t source_pid, const uint8_t* clear_data, uint32_t length);
bool sys_clipboard_paste(uint32_t slot_back_index, uint32_t recipient_pid, uint8_t* out_clear_buffer, uint32_t max_len);
uint32_t query_clipboard_history_manifest(uint32_t* out_lengths, uint32_t* out_pids);