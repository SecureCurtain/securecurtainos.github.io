#include <stdint.h>
#include <stddef.h>
#include <string.h>
#include <stdlib.h>
#include "../network/hips_ipc.h"

// System proxy links for user-space UI events (user32.dll style mechanics)
extern void ui_create_window(const char* title, int w, int h);
extern void ui_draw_drop_box(int x, int y, int w, int h, const char* label);
extern void native_vfs_read_file(const char* path, char* out_buf, size_t max_len);
extern void native_ipc_send(uint32_t target_pid, uint32_t cmd, const void* payload, size_t size);

static hips_rule_t compiled_rules[MAX_HIPS_RULES];
static uint32_t    compiled_count = 0;

/**
 * Text parsing helper: Transforms text lines into a binary hips_rule_t packet array
 */
void parse_signature_file_contents(const char* text_buffer) {
    compiled_count = 0;
    const char* line = text_buffer;

    while (line && *line != '\0' && compiled_count < MAX_HIPS_RULES) {
        hips_rule_t* rule = &compiled_rules[compiled_count];
        
        // Parse comma-delimited signatures formatted as: ID,SEVERITY,PATTERN
        rule->signature_id = (uint32_t)atoi(line);
        
        const char* comma1 = strchr(line, ',');
        if (!comma1) break;
        rule->severity = (uint32_t)atoi(comma1 + 1);

        const char* comma2 = strchr(comma1 + 1, ',');
        if (!comma2) break;
        
        // Extract pattern string up to the trailing newline character
        const char* pattern_start = comma2 + 1;
        const char* newline = strchr(pattern_start, '\n');
        size_t len = newline ? (size_t)(newline - pattern_start) : strlen(pattern_start);
        
        if (len >= MAX_SIGNATURE_LEN) len = MAX_SIGNATURE_LEN - 1;
        memcpy(rule->pattern, pattern_start, len);
        rule->pattern[len] = '\0';
        rule->pattern_len = (uint8_t)len;

        compiled_count++;
        line = newline ? newline + 1 : NULL; // Advance to the next line string block
    }
}

/**
 * CRITICAL INTERCEPTION: Fired by your window manager loop when a user drops 
 * a file asset directly onto the screen's drop-box coordinates.
 */
void on_file_dropped_on_gui(const char* dropped_file_vfs_path) {
    static char file_read_staging_buffer[4096];

    // 1. Fetch raw text data contents out of the dropped file via the VFS server (PID 8)
    native_vfs_read_file(dropped_file_vfs_path, file_read_staging_buffer, sizeof(file_read_staging_buffer));

    // 2. Parse raw text strings down into binary signature arrays
    parse_signature_file_contents(file_read_staging_buffer);

    if (compiled_count > 0) {
        // 3. SECURE HIPS STREAM UPDATE: Deploy binary array directly over to network.bin (PID 7)
        size_t total_payload_bytes = compiled_count * sizeof(hips_rule_t);
        native_ipc_send(7, HIPS_CMD_UPDATE_SIGNATURES, compiled_rules, total_payload_bytes);
    }
}

void main_draw_hips_window(void) {
    ui_create_window("HIPS Control & Live Alert Monitor", 500, 300);
    // Draw visual drop zone element box on the application frame
    ui_draw_drop_box(50, 50, 400, 150, "DROP RULES.TXT FILE HERE TO UPDATE SIGNATURES");
}
