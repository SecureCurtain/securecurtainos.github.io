#include "security_audit.h"
#include "pm_core.h"
#include <string.h>
#include <stdio.h>
#include <stdbool.h>

extern uint64_t get_system_uptime_ms(void);
extern void encrypt_system_ram_image(const uint8_t* source, uint8_t* dest); // Reusing block-scrambler
extern void write_vfs_audit_log_sector(uint32_t byte_offset, const uint8_t* encrypted_data, uint32_t size);
extern uint32_t query_current_audit_log_size(void);
extern void kernel_broadcast_ipc_message(uint32_t channel_id, const void* buffer, uint32_t length);

static uint32_t g_current_log_write_ptr = 0;
static bool g_auditor_active = false;

void init_security_auditor(void) {
    // Sync active write pointer matching file boundary size tracked by vfs.bin
    g_current_log_write_ptr = query_current_audit_log_size();
    g_auditor_active = true;
    
    // Commit system initialization baseline entry
    commit_security_audit_entry(EVENT_LOCKSCREEN_UNLOCKED, "SYSTEM", "Security Auditing Engine successfully active.");
}

void commit_security_audit_entry(uint32_t event_id, const char* user, const char* description) {
    if (!g_auditor_active) return;

    AuditRecord clear_record;
    memset(&clear_record, 0, sizeof(AuditRecord));

    // 1. Populate clear-text metadata block structures
    clear_record.magic = AUDIT_MAGIC_HEADER;
    clear_record.event_id = event_id;
    clear_record.timestamp_ms = get_system_uptime_ms();
    strncpy(clear_record.user_context, user ? user : "UNKNOWN", 31);
    strncpy(clear_record.description, description ? description : "", 63);

    // 2. Prepare staging buffers matching block alignment criteria
    uint8_t encrypted_record_buffer[AUDIT_LOG_RECORD_SIZE];
    memset(encrypted_record_buffer, 0, AUDIT_LOG_RECORD_SIZE);

    // 3. Encipher the raw binary event payload structurally inside kernel memory space
    //    Leverages our 4KB block scrambler adapted to 128-byte layout segments via sub-key loops
    for (uint32_t i = 0; i < AUDIT_LOG_RECORD_SIZE; i++) {
        // Fetch matching byte parameters mapping to the transient key stack directly
        extern SwapCryptoContext g_hibernation_crypto;
        uint8_t key_byte = g_hibernation_crypto.key_buffer[i % SWAP_ENCRYPTION_KEY_SIZE];
        
        uint8_t clear_byte = ((uint8_t*)&clear_record)[i];
        encrypted_record_buffer[i] = clear_byte ^ key_byte;
        
        if (i > 0) {
            encrypted_record_buffer[i] ^= encrypted_record_buffer[i - 1]; // Internal chain logic feedback
        }
    }

    // 4. Secure append execution block passed downward to physical file layers via VFS handlers
    write_vfs_audit_log_sector(g_current_log_write_ptr, encrypted_record_buffer, AUDIT_LOG_RECORD_SIZE);
    
    // Advance internal transaction head position for subsequent event staging
    g_current_log_write_ptr += AUDIT_LOG_RECORD_SIZE;

    // 5. Broadcast a live out-of-band IPC message notification if the event is a security anomaly
    if (event_id == EVENT_AUTH_FAILURE || event_id == EVENT_IPS_PORT_SCAN || event_id == EVENT_IPS_MALFORMED_HEADER) {
        SecurityAlertIpcMsg alert_msg;
        alert_msg.event_id = event_id;
        
        // Map severity levels
        if (event_id == EVENT_AUTH_FAILURE || event_id == EVENT_IPS_MALFORMED_HEADER) {
            alert_msg.severity = 2; // Critical
            strncpy(alert_msg.source_tag, "CRITICAL THREAT", 15);
        } else {
            alert_msg.severity = 1; // Warning
            strncpy(alert_msg.source_tag, "IPS FILTER DROP", 15);
        }
        
        strncpy(alert_msg.alert_text, description ? description : "Threat variant encountered.", 63);

        // Push message to channel 0xDE50 (Desktop Workspace Listening Port Descriptor)
        kernel_broadcast_ipc_message(0xDE50, &alert_msg, sizeof(SecurityAlertIpcMsg));
    }
}
