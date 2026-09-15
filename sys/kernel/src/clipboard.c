#include "clipboard.h"
#include "sandbox.h"
#include "mouse_tracker.h"
#include "pm_core.h"
#include <string.h>
#include <stdio.h>

static EncryptedClipboardRegistry g_clipboard_manager;

extern SwapCryptoContext g_hibernation_crypto;
extern uint64_t get_system_uptime_ms(void);
extern uint32_t query_active_focused_window_pid(void);

// Block-mixing helper to cipher clipboard parameters securely within protected Ring 0 pages
static void clipboard_crypto_transform(uint32_t salt, const uint8_t* input, uint8_t* output, uint32_t length) {
    for (uint32_t i = 0; i < length; i++) {
        uint8_t master_key_byte = g_hibernation_crypto.key_buffer[i % SWAP_ENCRYPTION_KEY_SIZE];
        uint8_t salt_byte = (uint8_t)((salt >> (i % 4 * 8)) & 0xFF);
        
        output[i] = input[i] ^ master_key_byte ^ salt_byte;
    }
}

void init_encrypted_clipboard_manager(void) {
    memset(&g_clipboard_manager, 0, sizeof(EncryptedClipboardRegistry));
    g_clipboard_manager.magic = CLIPBOARD_MAGIC_TAG;
    g_clipboard_manager.head_index = 0;
    g_clipboard_manager.total_stored_actions = 0;

    printf("[Kernel Clipboard]: Encrypted history manager online (Tracking 5-action history ring).\\n");
}

void sys_clipboard_copy(uint32_t source_pid, const uint8_t* clear_data, uint32_t length) {
    if (length > CLIPBOARD_MAX_DATA_SIZE || length == 0) return;

    // Enforce a strict sandbox safety scan before copying bytes out of application space
    if (!validate_memory_access_bounds(source_pid, (uint64_t)clear_data, length, false)) {
        return; 
    }

    // Determine target location in the circular ring history array tracking maps
    uint32_t target_idx = g_clipboard_manager.head_index;
    ClipboardItemNode* node = &g_clipboard_manager.history[target_idx];

    node->slot_id = target_idx + 800;
    node->source_pid = source_pid;
    node->timestamp_ms = (uint32_t)get_system_uptime_ms();
    node->data_bytes_len = length;

    // Encrypt the cleartext string directly into our Ring 0 storage shelf cache
    clipboard_crypto_transform(source_pid ^ node->timestamp_ms, clear_data, node->encrypted_payload, length);

    // Advance head index pointer, wrapping seamlessly at the 5-item boundary limit
    g_clipboard_manager.head_index = (g_clipboard_manager.head_index + 1) % CLIPBOARD_HISTORY_LIMIT;
    if (g_clipboard_manager.total_stored_actions < CLIPBOARD_HISTORY_LIMIT) {
        g_clipboard_manager.total_stored_actions++;
    }

    printf("[Clipboard Core]: Encrypted data transaction committed to slot entry index %d.\\n", node->slot_id);
}

bool sys_clipboard_paste(uint32_t slot_back_index, uint32_t recipient_pid, uint8_t* out_clear_buffer, uint32_t max_len) {
    if (slot_back_index >= g_clipboard_manager.total_stored_actions) return false;

    // PRIVILEGE ISOLATION BARRIER: Block data skimming from hidden/background software tasks
    // Sandboxed processes can only pull paste streams if they currently hold topmost window focus
    uint32_t active_ui_pid = query_active_focused_window_pid();
    if (recipient_pid != active_ui_pid) {
        memset(out_clear_buffer, 0, max_len); // Return zeroed bits to background intruders
        return true; 
    }

    // Locate requested item backward from head index positions
    int32_t lookup_idx = (int32_t)g_clipboard_manager.head_index - 1 - (int32_t)slot_back_index;
    if (lookup_idx < 0) {
        lookup_idx += CLIPBOARD_HISTORY_LIMIT; // Wrap index boundaries cleanly
    }

    ClipboardItemNode* node = &g_clipboard_manager.history[lookup_idx];
    uint32_t bytes_to_copy = (node->data_bytes_len > max_len) ? max_len : node->data_bytes_len;

    // Enforce write destination validation check parameters before transferring bytes
    if (!validate_memory_access_bounds(recipient_pid, (uint64_t)out_clear_buffer, bytes_to_copy, true)) {
        return false;
    }

    // Decrypt the raw stored cipher block on the fly directly into the authorized recipient window
    clipboard_crypto_transform(node->source_pid ^ node->timestamp_ms, node->encrypted_payload, out_clear_buffer, bytes_to_copy);
    return true;
}

uint32_t query_clipboard_history_manifest(uint32_t* out_lengths, uint32_t* out_pids) {
    // Allows focus-holding utilities to securely enumerate metadata layouts of the last 5 transactions
    uint32_t active_count = g_clipboard_manager.total_stored_actions;

    for (uint32_t i = 0; i < active_count; i++) {
        int32_t idx = (int32_t)g_clipboard_manager.head_index - 1 - (int32_t)i;
        if (idx < 0) idx += CLIPBOARD_HISTORY_LIMIT;

        out_lengths[i] = g_clipboard_manager.history[idx].data_bytes_len;
        out_pids[i] = g_clipboard_manager.history[idx].source_pid;
    }
    return active_count;
}
