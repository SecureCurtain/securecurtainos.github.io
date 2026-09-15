#pragma once
#include <stdint.h>
#include <stddef.h>
#include <stdbool.h>

#define MBED_CRYPTO_MAGIC 0x4D424544 // "MBED"

// Supported Encryption Suites
#define MBED_CIPHER_AES_256_GCM      1
#define MBED_CIPHER_AES_256_CBC      2
#define MBED_CIPHER_CHACHA20_POLY1305 3

// TLS Protocols
#define MBED_TLS_1_3                 0x0304

typedef struct {
    uint32_t magic;
    uint32_t suite_id;
    uint32_t session_id;
    uint8_t  session_key[32];
    bool     is_established;
} MbedSessionContext;

void init_mbed_crypto_subsystem(void);
bool mbed_tls_handshake_session(MbedSessionContext* ctx, uint32_t target_ip, uint16_t port);
bool mbed_encrypt_payload(MbedSessionContext* ctx, const uint8_t* in, uint32_t in_len, uint8_t* out, uint32_t* out_len);
bool mbed_decrypt_payload(MbedSessionContext* ctx, const uint8_t* in, uint32_t in_len, uint8_t* out, uint32_t* out_len);
