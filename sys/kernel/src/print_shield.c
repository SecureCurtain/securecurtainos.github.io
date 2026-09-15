#include "print_shield.h"
#include "rbac.h"
#include "keyring.h"
#include "sandbox.h"
#include "security_audit.h"
#include <string.h>
#include <stdio.h>

static SecurePrintRegistry g_print_shield;

extern void issue_hardware_bus_command(uint16_t port, uint16_t command);

void init_secure_print_subsystem(void) {
    memset(&g_print_shield, 0, sizeof(SecurePrintRegistry));
    g_print_shield.magic = PRINT_MAGIC_TAG;
    g_print_shield.is_queue_locked = false;
    printf("[Kernel Print Shield]: Isolated physical hardware printing channels active.\\n");
}

bool sys_submit_print_spool_job(uint32_t pid, const uint8_t* document_payload, uint32_t length) {
    if (g_print_shield.is_queue_locked || length > PRINT_SPOOL_MAX_LEN || length == 0) return false;

    // PRIVILEGE BARRIER: Printing system access requires explicit user context role rights
    // (Checked natively against the active session permissions matrix built in rbac.c)
    if (!rbac_verify_privilege(pid, 0x00000010 /* PERM_ACCESS_REGISTRY equivalent access */)) {
        printf("[Print Shield Error]: Unauthorized spool request rejected for PID %d.\\n", pid);
        return false;
    }

    // Verify sandbox address boundaries before loading parameters
    if (!validate_memory_access_bounds(pid, (uint64_t)document_payload, length, false)) {
        return false;
    }

    g_print_shield.is_queue_locked = true;
    g_print_shield.calling_pid = pid;
    g_print_shield.total_document_bytes = length;

    // Retrieve system encryption keys under root privilege to shield document data frames
    uint8_t print_crypto_key[KEYRING_KEY_SIZE];
    retrieve_sealed_key_bytes(0, 0, print_crypto_key);

    // Encrypt document frames inline within the kernel spool memory boundary shelves
    for (uint32_t i = 0; i < length; i++) {
        g_print_shield.encrypted_spool_buffer[i] = document_payload[i] ^ print_crypto_key[i % KEYRING_KEY_SIZE] ^ 0x3C;
    }
    memset(print_crypto_key, 0, KEYRING_KEY_SIZE); // Instantly erase transient key footprint from registers

    printf("[Print Shield]: Encrypted document job successfully spooled for PID %d (%d bytes).\\n", pid, length);
    return true;
}

void execute_secure_hardware_print_flush(void) {
    if (!g_print_shield.is_queue_locked) return;

    printf("[Print Shield]: Dispatching encrypted spool data to hardware controller ports...\\n");

    // Decrypt parameters on the fly directly inside the Ring 0 out-of-band port dispatch loop
    uint8_t print_crypto_key[KEYRING_KEY_SIZE];
    retrieve_sealed_key_bytes(0, 0, print_crypto_key);

    for (uint32_t i = 0; i < g_print_shield.total_document_bytes; i++) {
        uint8_t clear_char = g_print_shield.encrypted_spool_buffer[i] ^ 0x3C ^ print_crypto_key[i % KEYRING_KEY_SIZE];
        
        // Output character data directly to physical parallel port registers
        issue_hardware_bus_command(0x378 /* LPT1 Data Register Port */, clear_char);
        issue_hardware_bus_command(0x37A /* Strobe pulse control register command */, 0x0D);
        issue_hardware_bus_command(0x37A, 0x0C);
    }
    memset(print_crypto_key, 0, KEYRING_KEY_SIZE);

    // Flush and reset spool buffers cleanly
    memset(&g_print_shield, 0, sizeof(SecurePrintRegistry));
    g_print_shield.magic = PRINT_MAGIC_TAG;
    g_print_shield.is_queue_locked = false;
}
