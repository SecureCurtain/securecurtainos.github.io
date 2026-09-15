#include <stdint.h>
#include <stdio.h>
#include "../network/fw_ipc.h"

extern void native_ipc_call_with_response(uint32_t target_pid, uint32_t cmd, void* out_buffer);
extern void ui_render_log_table_row(int row_index, const char* text, uint32_t color_hex);

static fw_log_entry_t local_log_cache[512];

/**
 * Enhanced Live GUI Refresh loop with active stealth scan diagnostics.
 */
void update_firewall_logger_view(void) {
    // 1. Bulk-fetch the active logging queue over secure IPC lines from PID 7
    native_ipc_call_with_response(7, FW_CMD_GET_LOGS, local_log_cache);

    // 2. Clear and evaluate up to 20 viewable table rows
    for (int i = 0; i < 20; i++) {
        if (local_log_cache[i].timestamp == 0) continue; 

        char display_line[256];
        uint32_t text_color = 0xFFFFFF; // Default clear white text

        // 3. TARGETED DETECTOR: Check if the entry is an invalid TCP flag drop
        if (local_log_cache[i].action == FW_REASON_BAD_FLAGS) {
            uint8_t flags = local_log_cache[i].tcp_flags;
            const char* scan_type = "Unknown Stealth";
            text_color = 0xFF3333; // Bright Red alert styling for scans

            // Isolate individual combinations to flag the correct Nmap vector
            if (flags == 0) {
                scan_type = "NULL SCAN";
            } 
            else if ((flags & (TCP_FLAG_FIN | TCP_FLAG_PSH | TCP_FLAG_URG)) == (TCP_FLAG_FIN | TCP_FLAG_PSH | TCP_FLAG_URG)) {
                scan_type = "XMAS SCAN";
            } 
            else if ((flags & TCP_FLAG_SYN) && (flags & TCP_FLAG_FIN)) {
                scan_type = "SYN-FIN SCAN";
            } 
            else if ((flags & TCP_FLAG_SYN) && (flags & TCP_FLAG_RST)) {
                scan_type = "SYN-RST SCAN";
            }

            sprintf(display_line, "[ALERT] Drop Malicious %s from Port %d -> Port %d",
                    scan_type,
                    local_log_cache[i].src_port,
                    local_log_cache[i].dest_port);

        } else {
            // 4. FALLBACK: Handle standard connection drops gracefully
            const char* action_text = (local_log_cache[i].action == FW_ACTION_DROP) ? "DROP" : "ALLOW";
            text_color = (local_log_cache[i].action == FW_ACTION_DROP) ? 0xAAAAAA : 0x33FF33; // Gray or Green

            sprintf(display_line, "[LOG] %s policy applied on Port %d",
                    action_text,
                    local_log_cache[i].dest_port);
        }

        // Send both the text and the alert color code out to your graphics interface
        ui_render_log_table_row(i, display_line, text_color);
    }
}
