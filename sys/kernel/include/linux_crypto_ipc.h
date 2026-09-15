#pragma once
#include <stdint.h>
#include <stddef.h>
#include <stdbool.h>

// 🛡️ COPYLEFT LICENSE ISOLATION & CRYPTO IPC MAGIC IDENTIFIERS
#define LINUX_CRYPTO_IPC_MAGIC        0x4C435250 // "LCRP" Linux Crypto IPC Protocol
#define LINUX_CRYPTO_IPC_VERSION      0x0100     // Version 1.0

// Crypto IPC Command Identifiers
#define CRYPTO_IPC_CMD_CIPHER_INIT    0x3001
#define CRYPTO_IPC_CMD_ENCRYPT        0x3002
#define CRYPTO_IPC_CMD_DECRYPT        0x3003
#define CRYPTO_IPC_CMD_HASH_SHA256    0x3004
#define CRYPTO_IPC_CMD_HMAC_SHA256    0x3005
#define CRYPTO_IPC_CMD_AEAD_ENCRYPT   0x3006
#define CRYPTO_IPC_CMD_AEAD_DECRYPT   0x3007
#define CRYPTO_IPC_CMD_RNG_GENERATE   0x3008
#define CRYPTO_IPC_CMD_SECTOR_CRYPT   0x3009

// Cipher Algorithm Algorithms
#define CRYPTO_ALGO_AES_256_CBC       1
#define CRYPTO_ALGO_AES_256_XTS       2
#define CRYPTO_ALGO_CHACHA20_POLY1305 3
#define CRYPTO_ALGO_SHA256            4
#define CRYPTO_ALGO_HMAC_SHA256       5

// Response Status Codes
#define CRYPTO_IPC_STATUS_SUCCESS          0
#define CRYPTO_IPC_STATUS_INVALID_CMD     -1
#define CRYPTO_IPC_STATUS_INVALID_KEY     -2
#define CRYPTO_IPC_STATUS_AUTH_FAILED     -3
#define CRYPTO_IPC_STATUS_BUFFER_OVERFLOW -4
#define CRYPTO_IPC_STATUS_ENGINE_BUSY     -5

// Maximum Payload Constraints
#define CRYPTO_IPC_MAX_KEY_LEN     64
#define CRYPTO_IPC_MAX_IV_LEN      32
#define CRYPTO_IPC_MAX_PAYLOAD     4096
#define CRYPTO_IPC_MAX_TAG_LEN     32

/**
 * 🛡️ STRICT GPL BOUNDARY CRYPTO ENGINE IPC PACKET
 * Encapsulates cryptographic transformations over neutral Unix domain sockets / IPC channels
 * without referencing Linux kernel symbols in Ring 0 microkernel space.
 */
typedef struct {
    uint32_t magic;                              // LINUX_CRYPTO_IPC_MAGIC (0x4C435250)
    uint16_t version;                            // Protocol version
    uint16_t command_id;                         // CRYPTO_IPC_CMD_*
    int32_t  status_code;                        // Output return code
    uint32_t sequence_num;                       // IPC message transaction counter
    uint32_t algorithm_id;                       // CRYPTO_ALGO_*
    
    uint64_t sector_lba;                         // Optional target LBA for disk tweak ciphers
    uint32_t key_len;                            // Key length in bytes
    uint8_t  key[CRYPTO_IPC_MAX_KEY_LEN];        // Symmetric key bytes
    uint32_t iv_len;                             // IV / Nonce length in bytes
    uint8_t  iv[CRYPTO_IPC_MAX_IV_LEN];          // Initialization vector
    
    uint32_t aad_len;                            // Additional Authenticated Data length
    uint8_t  aad[64];                            // AAD buffer
    uint32_t tag_len;                            // Authentication tag length (HMAC / Poly1305)
    uint8_t  auth_tag[CRYPTO_IPC_MAX_TAG_LEN];   // Output or verification tag buffer
    
    uint32_t input_len;                          // Length of data inside payload to process
    uint32_t output_len;                         // Resulting byte count produced
    uint8_t  payload[CRYPTO_IPC_MAX_PAYLOAD];    // Input / Output data buffer
} __attribute__((packed)) crypto_server_ipc_packet_t;

// Linux Crypto Driver Server Core IPC Processor
int linux_crypto_server_process_ipc(const crypto_server_ipc_packet_t* req, crypto_server_ipc_packet_t* res);

// High-Level Microkernel Client Wrappers
bool sys_linux_crypto_encrypt_sector(uint64_t lba, const uint8_t* in, uint8_t* out, uint32_t len, const uint8_t* key, bool is_encrypt);
bool sys_linux_crypto_sha256(const uint8_t* in, uint32_t len, uint8_t* out_digest);
bool sys_linux_crypto_hmac_sha256(const uint8_t* key, uint32_t key_len, const uint8_t* in, uint32_t len, uint8_t* out_tag);
bool sys_linux_crypto_get_random(uint8_t* out_buf, uint32_t len);
