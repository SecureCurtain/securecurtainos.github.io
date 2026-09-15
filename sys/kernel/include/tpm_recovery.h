#pragma once
#include <stdint.h>
#include <stdbool.h>

#define TPM_RECOVERY_MAGIC_TAG  0x54504D52 // "TPMR" binary tracking token
#define RECOVERY_KEY_LEN        32         // 256-bit raw cryptographic bypass key

typedef struct {
    uint32_t magic;
    uint32_t failed_recovery_attempts;
    bool     is_hardware_tpm_present;
    bool     system_unlocked_via_kek;
    uint8_t  sealed_kek_hash[32]; // SHA-256 validation marker of the backup KEK
} TpmRecoveryRegistry;

void init_tpm_recovery_subsystem(void);
bool sys_verify_hardware_tpm_health(void);
bool sys_bypass_tpm_with_recovery_kek(uint32_t calling_pid, const uint8_t* input_kek_bytes);
