#pragma once
#include <stdint.h>
#include <stddef.h>
#include "ipc.h" // Needed to route encryption parameters over secure handles

// 🛡️ SECURITY: Standardized TPM IPC Command Identifiers
#define TPM_CMD_INIT          0xC01
#define TPM_CMD_SEAL_KEY      0xC02
#define TPM_CMD_UNSEAL_KEY    0xC03

#define TPM_KEY_MAX_LEN       32   // Standard 256-bit AES cryptographic key size
#define TPM_BLOB_MAX_LEN      128  // Encapsulated data blob allocation layout boundary

// 🛡️ STRUCTURED TPM SEAL REQUEST PACKET
// Encapsulates raw cryptographic keys safely inside standard ipc_message_t envelopes
typedef struct {
    uint32_t target_pcr_mask;              // PCR registers to lock against (e.g. Bit 0 for Core Boot)
    uint16_t key_length;                    // Must be strictly <= TPM_KEY_MAX_LEN
    uint8_t  raw_key[TPM_KEY_MAX_LEN];     // The plaintext key to be sealed inside the TPM hardware
} __attribute__((packed)) tpm_ipc_seal_frame_t;

// 🛡️ STRUCTURED TPM UNSEAL RESPONSE PACKET
typedef struct {
    int32_t  status_code;                  // 0 = Success, -4 = Integrity/PCR Authorization Failure
    uint16_t key_length;
    uint8_t  unsealed_key[TPM_KEY_MAX_LEN];// The decrypted key returned upon hardware validation pass
} __attribute__((packed)) tpm_ipc_unreal_frame_t;

// --- Primary API Entry Points ---

/**
 * Initializes the unprivileged user-space TPM register translation mappings.
 */
void init_tpm_lockbox(void);

/**
 * 🛡️ SANDBOXED TPM CONTROL SERVER MODULE
 * Executes entirely within the unprivileged user-space 'tpm_lockbox_server.bin' 
 * process container. It safely formats command buffers, verifies lengths, 
 * and handles hardware register communication loops without touching supervisor memory.
 * 
 * @param msg The incoming IPC packet containing key frames or sealed data blobs.
 * @param out_response Output response container to route hardware status blocks back to the client.
 */
int handle_tpm_server_message(const ipc_message_t* msg, ipc_message_t* out_response);