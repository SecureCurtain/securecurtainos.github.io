#include "../../kernel/include/security_audit.h"
#include "../../kernel/include/scim.h"
#include "../../kernel/include/rbac.h"
#include <stdio.h>
#include <string.h>

#define EXPORT_DESTINATION_PATH "/vfs/home/desktop/SecurityReport.dat"

extern void gfx_draw_filled_rect(uint32_t x, uint32_t y, uint32_t w, uint32_t h, uint32_t color);
extern void gfx_draw_string(uint32_t x, uint32_t y, const char* text, uint32_t color);
extern void read_vfs_audit_log_sector(uint32_t byte_offset, uint8_t* dest, uint32_t size);
extern uint32_t query_current_audit_log_size(void);
extern bool rbac_verify_privilege(uint32_t pid, uint32_t required_permission);

extern int32_t vfs_open(const char* path, const char* mode);
extern int32_t vfs_write(int32_t fd, const uint8_t* buffer, uint32_t len);
extern void    vfs_close(int32_t fd);

// Administrative action invoked to bundle and package clear logs safely for physical audits
bool execute_secure_log_export_transaction(const char* admin_user, const char* admin_pass, uint32_t calling_pid) {
    // 1. Strict Authorization Barrier: Route queries directly through SCIM registers
    if (!verify_user_credentials(admin_user, admin_pass)) {
        commit_security_audit_entry(EVENT_AUTH_FAILURE, "LOG_EXPORTER", "Unauthorized attempt to export core audit records.");
        return false;
    }

    // 2. Kernel RBAC Verification Hook: Ensure calling PID holds PERM_READ_AUDIT_LOGS
    if (!rbac_verify_privilege(calling_pid, PERM_READ_AUDIT_LOGS)) {
        commit_security_audit_entry(EVENT_AUTH_FAILURE, "LOG_EXPORTER", "RBAC policy rejected log export: missing PERM_READ_AUDIT_LOGS.");
        printf("[Log Exporter]: Access Denied: PID %d lacks PERM_READ_AUDIT_LOGS.\\n", calling_pid);
        return false;
    }

    uint32_t total_log_bytes = query_current_audit_log_size();
    uint32_t record_count = total_log_bytes / AUDIT_LOG_RECORD_SIZE;

    int32_t out_fd = vfs_open(EXPORT_DESTINATION_PATH, "wb");
    if (out_fd < 0) return false;

    // Write a clean ASCII administrative header tag signature into the file
    const char* file_header_tag = "--- PROTOTYPE OS UNIFIED ADMINISTRATIVE SECURITY EXPORT CONSOLE ---\\n";
    vfs_write(out_fd, (const uint8_t*)file_header_tag, strlen(file_header_tag));

    // 2. Stream, decrypt, and re-serialize the records sequentially
    for (uint32_t i = 0; i < record_count; i++) {
        uint8_t encrypted_block[AUDIT_LOG_RECORD_SIZE];
        AuditRecord clear_record;

        read_vfs_audit_log_sector(i * AUDIT_LOG_RECORD_SIZE, encrypted_block, AUDIT_LOG_RECORD_SIZE);

        // Reverse cryptographic unmasking matrix loop
        for (uint32_t b = 0; b < AUDIT_LOG_RECORD_SIZE; b++) {
            extern SwapCryptoContext g_hibernation_crypto;
            uint8_t key_byte = g_hibernation_crypto.key_buffer[b % SWAP_ENCRYPTION_KEY_SIZE];
            uint8_t cipher_byte = encrypted_block[b];

            if (b > 0) cipher_byte ^= encrypted_block[b - 1]; // Undo feedback links
            ((uint8_t*)&clear_record)[b] = cipher_byte ^ key_byte;
        }

        if (clear_record.magic == AUDIT_MAGIC_HEADER) {
            // Format decrypted data cleanly into a human-readable text block string layout
            char row_string[256];
            snprintf(row_string, sizeof(row_string), 
                     "RECORD [%04d]  TIME:%010lld ms  TAG:%-12s  DESC:%s\\n", 
                     i, (long long)clear_record.timestamp_ms, clear_record.user_context, clear_record.description);
            
            vfs_write(out_fd, (const uint8_t*)row_string, strlen(row_string));
        }
    }

    vfs_close(out_fd);
    commit_security_audit_entry(EVENT_LOCKSCREEN_UNLOCKED, admin_user, "Security logs exported safely for inspection.");
    printf("[Log Exporter]: Successfully compiled security archive file path: %s\\n", EXPORT_DESTINATION_PATH);
    return true;
}

void render_log_exporter_panel_gui(uint32_t wx, uint32_t wy) {
    // Renders administrative tool framework card container boxes on desktop workspace coordinates
    gfx_draw_filled_rect(wx, wy, 400, 160, 0x1D212A);
    gfx_draw_filled_rect(wx, wy, 400, 28, 0x2A313E);
    gfx_draw_string(wx + 12, wy + 8, "Administrative Security Log Export Utility", 0xFFFFFF);
    
    gfx_draw_string(wx + 16, wy + 48, "Target Output Node Matrix Local file point:", 0x8A9FB4);
    gfx_draw_string(wx + 16, wy + 68, EXPORT_DESTINATION_PATH, 0xFFA726); // Alert highlighting path
    gfx_draw_string(wx + 16, wy + 108, "Run this action tool to compile clear-text forensic logs.", 0x777A85);
    
    gfx_draw_filled_rect(wx + 16, wy + 124, 120, 22, 0x3388AA); // Action box button
    gfx_draw_string(wx + 24, wy + 128, "[ EXPORT NOW ]", 0xFFFFFF);
}
