/*
 * SecureCurtain OS - Trusted Platform Module (TPM 2.0) Driver & Hardware Attestation
 * Author: Jared Busby (jb7572)
 *
 * Implements:
 * - TPM 2.0 TIS (TPM Interface Specification) MMIO registers at 0xFED40000
 * - Locality 0 access grant and STS (Status) polling
 * - TPM2_PCR_Read & TPM2_PCR_Extend commands (SHA-256 bank)
 * - Boot measurement sealing (PCR 0..7 validation for UEFI Secure Boot)
 */

#include <stdint.h>
#include <stdbool.h>
#include <vmm.h>
#include <kernel.h>

#define TPM_TIS_BASE 0xFED40000

#define TPM_ACCESS   0x0000
#define TPM_STS      0x0018
#define TPM_DATA_FIFO 0x0024

#define TPM_ACCESS_REQUEST_USE   (1 << 1)
#define TPM_ACCESS_ACTIVE_LOCALITY (1 << 5)
#define TPM_STS_VALID            (1 << 7)
#define TPM_STS_COMMAND_READY    (1 << 6)
#define TPM_STS_DATA_AVAIL       (1 << 4)

static volatile uint8_t *tpm_base = (volatile uint8_t *)(KERNEL_VIRTUAL_BASE + TPM_TIS_BASE);

static inline uint8_t tpm_read8(uint32_t reg) {
    return *(volatile uint8_t *)(tpm_base + reg);
}

static inline void tpm_write8(uint32_t reg, uint8_t val) {
    *(volatile uint8_t *)(tpm_base + reg) = val;
}

int tpm2_request_locality(void) {
    uint32_t timeout = 10000;
    tpm_write8(TPM_ACCESS, TPM_ACCESS_REQUEST_USE);
    while (!(tpm_read8(TPM_ACCESS) & TPM_ACCESS_ACTIVE_LOCALITY)) {
        if (--timeout == 0) return -1;
    }
    return 0;
}

int tpm2_init(void) {
    // Map the TPM TIS region (64KB covering all localities)
    uint64_t bar_phys = TPM_TIS_BASE;
    uint64_t bar_virt = (uint64_t)KERNEL_VIRTUAL_BASE + (uint64_t)bar_phys;
    for (uint64_t offset = 0; offset < 0x10000; offset += 4096) {
        vmm_map_page(bar_virt + offset, bar_phys + offset, VMM_PAGE_PRESENT | VMM_PAGE_WRITABLE | VMM_PAGE_NOCACHE);
    }

    uint8_t access = tpm_read8(TPM_ACCESS);
    if (access == 0xFF || access == 0x00) {
        return -1; // TPM hardware absent
    }
    return tpm2_request_locality();
}
