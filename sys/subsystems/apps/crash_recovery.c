#include "../../kernel/include/crash_dump.h"
#include "../../kernel/include/scim.h"
#include "../../kernel/include/rbac.h"
#include <stdio.h>
#include <string.h>

#define RECOVERY_WINDOW_X   100
#define RECOVERY_WINDOW_Y   100
#define RECOVERY_WINDOW_W   600
#define RECOVERY_WINDOW_H   400

extern void gfx_draw_filled_rect(uint32_t x, uint32_t y, uint32_t w, uint32_t h, uint32_t color);
extern void gfx_draw_string(uint32_t x, uint32_t y, const char* text, uint32_t color);
extern void read_block_from_vfs_swap_node(uint32_t sector, uint8_t* destination);
extern uint32_t query_active_focused_window_pid(void);

static CrashDumpHeader g_recovered_panic_log;
static bool            g_is_log_decrypted = false;

// Low-overhead cryptographic stream mixer to reverse the crash-dump cipher block data paths
static void decrypt_crash_dump_payload(const uint8_t* cipher, uint8_t* plain, uint32_t len, const uint8_t* key) {
    for (uint32_t i = 0; i < len; i++) {
        plain[i] = cipher[i] ^ key[i % 32] ^ (uint8_t)(i * 0x3F);
    }
}

bool execute_secure_crash_log_parse(const char* admin_user, const char* admin_pass, uint32_t calling_pid) {
    // 1. Strict SCIM verification pass
    if (!verify_user_credentials(admin_user, admin_pass)) {
        return false;
    }

    // 2. Strict RBAC privilege verification pass
    if (!rbac_verify_privilege(calling_pid, PERM_READ_AUDIT_LOGS)) {
        return false;
    }

    // 3. Read raw encrypted crash payload from dedicated sector
    uint8_t cipher_buffer[sizeof(CrashDumpHeader)];
    read_block_from_vfs_swap_node(CRASH_DUMP_SECTOR_START, cipher_buffer);

    // 4. Retrieve key from hibernation context
    extern SwapCryptoContext g_hibernation_crypto;
    decrypt_crash_dump_payload(cipher_buffer, (uint8_t*)&g_recovered_panic_log, sizeof(CrashDumpHeader), g_hibernation_crypto.key_buffer);

    if (g_recovered_panic_log.magic == CRASH_DUMP_MAGIC_TAG) {
        g_is_log_decrypted = true;
        return true;
    }

    return false;
}

void render_crash_recovery_panel(void) {
    gfx_draw_filled_rect(RECOVERY_WINDOW_X, RECOVERY_WINDOW_Y, RECOVERY_WINDOW_W, RECOVERY_WINDOW_H, 0x0E1117);
    gfx_draw_filled_rect(RECOVERY_WINDOW_X, RECOVERY_WINDOW_Y, RECOVERY_WINDOW_W, 28, 0x1F2430);
    gfx_draw_string(RECOVERY_WINDOW_X + 12, RECOVERY_WINDOW_Y + 8, "Administrative Encrypted Crash-Dump Recovery Forensics Shell", 0xFFFFFF);

    if (!g_is_log_decrypted) {
        gfx_draw_string(RECOVERY_WINDOW_X + 24, RECOVERY_WINDOW_Y + 60, "Status: Encrypted crash dump sealed on sector 6000. Authentication required.", 0x8A9FB4);
        gfx_draw_filled_rect(RECOVERY_WINDOW_X + 24, RECOVERY_WINDOW_Y + 100, 160, 26, 0x2A5298);
        gfx_draw_string(RECOVERY_WINDOW_X + 34, RECOVERY_WINDOW_Y + 106, "[ AUTH & PARSE DUMP ]", 0xFFFFFF);
        return;
    }

    char header_info[128];
    snprintf(header_info, sizeof(header_info), "CRASH CAPTURED | VECTOR: 0x%02X | TIMESTAMP: %llu ms", 
             g_recovered_panic_log.fault_exception_vector, (unsigned long long)g_recovered_panic_log.timestamp_ms);
    gfx_draw_string(RECOVERY_WINDOW_X + 24, RECOVERY_WINDOW_Y + 48, header_info, 0xFFA726);

    const CpuRegisterSnapshot* r = &g_recovered_panic_log.register_state;
    char line1[128], line2[128], line3[128], line4[128];
    snprintf(line1, sizeof(line1), "RAX: 0x%016llX   RBX: 0x%016llX   RCX: 0x%016llX", (unsigned long long)r->rax, (unsigned long long)r->rbx, (unsigned long long)r->rcx);
    snprintf(line2, sizeof(line2), "RDX: 0x%016llX   RSI: 0x%016llX   RDI: 0x%016llX", (unsigned long long)r->rdx, (unsigned long long)r->rsi, (unsigned long long)r->rdi);
    snprintf(line3, sizeof(line3), "RBP: 0x%016llX   RSP: 0x%016llX   RIP: 0x%016llX", (unsigned long long)r->rbp, (unsigned long long)r->rsp, (unsigned long long)r->rip);
    snprintf(line4, sizeof(line4), "CR3: 0x%016llX   RFLAGS: 0x%016llX", (unsigned long long)r->cr3, (unsigned long long)r->rflags);
    
    uint32_t text_y = RECOVERY_WINDOW_Y + 90;
    gfx_draw_string(RECOVERY_WINDOW_X + 32, text_y,       "--- BARE METAL CORE HARDWARE EXCEPTION REGISTERS SNAPSHOT ---", 0x8A9FB4);
    gfx_draw_string(RECOVERY_WINDOW_X + 32, text_y + 26,  line1, 0xEEEEEE);
    gfx_draw_string(RECOVERY_WINDOW_X + 32, text_y + 52,  line2, 0xEEEEEE);
    gfx_draw_string(RECOVERY_WINDOW_X + 32, text_y + 78,  line3, 0xEEEEEE);
    gfx_draw_string(RECOVERY_WINDOW_X + 32, text_y + 104, line4, 0xEEEEEE);
    
    gfx_draw_string(RECOVERY_WINDOW_X + 32, text_y + 150, "Forensics verification passed. Code base execution fault traced to active instruction segment.", 0x3CD070);
}
