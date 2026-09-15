#pragma once
#include <stdint.h>
#include <stddef.h>
#include "aes.h"

typedef struct {
    unsigned char counter[16];
    int reseed_counter;
    int prediction_resistance;
    size_t entropy_len;
    mbedtls_aes_context aes_ctx;
} mbedtls_ctr_drbg_context;

void mbedtls_ctr_drbg_init(mbedtls_ctr_drbg_context* ctx);
void mbedtls_ctr_drbg_free(mbedtls_ctr_drbg_context* ctx);
int  mbedtls_ctr_drbg_seed(mbedtls_ctr_drbg_context* ctx, int (*f_entropy)(void*, unsigned char*, size_t), void* p_entropy, const unsigned char* custom, size_t len);
int  mbedtls_ctr_drbg_random(void* p_rng, unsigned char* output, size_t output_len);
