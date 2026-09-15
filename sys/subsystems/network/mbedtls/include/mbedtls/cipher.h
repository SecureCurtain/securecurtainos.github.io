#pragma once
#include <stdint.h>
#include <stddef.h>

typedef enum {
    MBEDTLS_CIPHER_NONE = 0,
    MBEDTLS_CIPHER_AES_128_CBC,
    MBEDTLS_CIPHER_AES_256_CBC,
    MBEDTLS_CIPHER_AES_256_GCM,
    MBEDTLS_CIPHER_CHACHA20_POLY1305
} mbedtls_cipher_type_t;

typedef struct {
    mbedtls_cipher_type_t type;
    int key_bitlen;
    const char* name;
} mbedtls_cipher_info_t;

const mbedtls_cipher_info_t* mbedtls_cipher_info_from_type(const mbedtls_cipher_type_t cipher_type);
