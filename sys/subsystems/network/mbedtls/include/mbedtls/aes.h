#pragma once
#include <stdint.h>
#include <stddef.h>

#define MBEDTLS_AES_ENCRYPT     1
#define MBEDTLS_AES_DECRYPT     0

typedef struct {
    int nr;                     // number of rounds
    uint32_t* rk;               // AES round keys
    uint32_t buf[68];           // unaligned data buffer
} mbedtls_aes_context;

void mbedtls_aes_init(mbedtls_aes_context* ctx);
void mbedtls_aes_free(mbedtls_aes_context* ctx);
int  mbedtls_aes_setkey_enc(mbedtls_aes_context* ctx, const unsigned char* key, unsigned int keybits);
int  mbedtls_aes_setkey_dec(mbedtls_aes_context* ctx, const unsigned char* key, unsigned int keybits);
int  mbedtls_aes_crypt_ecb(mbedtls_aes_context* ctx, int mode, const unsigned char input[16], unsigned char output[16]);
int  mbedtls_aes_crypt_cbc(mbedtls_aes_context* ctx, int mode, size_t length, unsigned char iv[16], const unsigned char* input, unsigned char* output);
int  mbedtls_aes_crypt_xts(mbedtls_aes_context* ctx, int mode, size_t length, const unsigned char data_unit[16], const unsigned char* input, unsigned char* output);
