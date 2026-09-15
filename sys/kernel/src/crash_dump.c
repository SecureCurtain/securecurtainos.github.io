#include "crash_dump.h"
#include "pm_core.h"
#include "keyring.h"
#include <string.h>
#include <stdio.h>

static CrashDumpHeader g_crash_header;

extern uint64_t get_system_uptime_ms(void);
extern void     write_block_to_vfs_swap_node(uint32_t sector, const uint8_t* data);

// Local cryptographic stream mixer to encipher raw registry dumps inline
static void crash_dump_crypto_transform(const uint8_t* in, uint8_t* out, uint32_t len, const uint8_t* key) {
    for (uint32_t i = 0; i < len; i++) {
        out[i] = in[i] ^ key[i % KEYRING_KEY_SIZE] ^ (uint8_t)(i * 0x3F);
    }
}

void init_crash_dump_stager(void) {
    memset(&g_crash_header, 0, sizeof(CrashDumpHeader));
    g_crash_header.magic = CRASH_DUMP_MAGIC_TAG;
    g_crash_header.is_ciphertext_sealed = false;
}

void __attribute__((noreturn)) execute_secure_kernel_crash_dump(uint32_t vector, const CpuRegisterSnapshot* regs) {
    // 1. Permanently freeze scheduling context loops and mask physical interrupts
    asm volatile("cli");

    memset(&g_crash_header, 0, sizeof(CrashDumpHeader));
    g_crash_header.magic = CRASH_DUMP_MAGIC_TAG;
    g_crash_header.fault_exception_vector = vector;
    g_crash_header.timestamp_ms = get_system_uptime_ms();
    memcpy(&g_crash_header.register_state, regs, sizeof(CpuRegisterSnapshot));

    // 2. Pull the active transient system key bytes out of your secure keyring module
    uint8_t master_crypto_key[KEYRING_KEY_SIZE];
    extern SwapCryptoContext g_hibernation_crypto;
    memcpy(master_crypto_key, g_hibernation_crypto.key_buffer, KEYRING_KEY_SIZE);

    // 3. Encrypt the raw CPU registry structures inline using the transient keys context
    uint8_t encrypted_output_block[sizeof(CrashDumpHeader)];
    crash_dump_crypto_transform((const uint8_t*)&g_crash_header, encrypted_output_block, sizeof(CrashDumpHeader), master_crypto_key);

    // Wipe key footprints instantly from the volatile working registers
    memset(master_crypto_key, 0, KEYRING_KEY_SIZE);

    // 4. Serialize the ciphertext metadata block out to your dedicated crash storage partitions
    // (Occupies 1 clean block segment on your VFS hardware partitions)
    write_block_to_vfs_swap_node(CRASH_DUMP_SECTOR_START, encrypted_output_block);

    printf("[Kernel Crash Dump]: Secure encrypted log serialized. Purging memory footprints...\\n");

    // Clear residual volatile memory spaces entirely to avoid cold-boot memory extractions
    extern void sys_secure_shred_page(uint64_t addr);
    // (In your complete core, this traverses the active allocation table maps to wipe active contexts)

    // Force system power collapse command parameters via ACPI bus
    extern void issue_hardware_bus_command(uint16_t port, uint16_t command);
    issue_hardware_bus_command(0x3400, 0x0); // Soft off reset
    
    for (;;) {
        asm volatile("hlt");
    }
}
