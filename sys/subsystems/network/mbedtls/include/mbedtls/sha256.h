#pragma once
#include <stdint.h>
#include <stddef.h>

typedef struct {
    uint32_t total[2];
    uint32_t state[8];
    unsigned char buffer[64];
    int is224;
} mbedtls_sha256_context;

void mbedtls_sha256_init(mbedtls_sha256_context* ctx);
void mbedtls_sha256_free(mbedtls_sha256_context* ctx);
int  mbedtls_sha256_starts(mbedtls_sha256_context* ctx, int is224);
int  mbedtls_sha256_update(mbedtls_sha256_context* ctx, const unsigned char* input, size_t ilen);
int  mbedtls_sha256_finish(mbedtls_sha256_context* ctx, unsigned char output[32]);
int  mbedtls_sha256(const unsigned char* input, size_t ilen, unsigned char output[32], int is224);
