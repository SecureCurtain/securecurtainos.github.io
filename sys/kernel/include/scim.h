#pragma once
#include <stdint.h>
#include <stdbool.h>

#define SCIM_MAGIC_TAG       0x5343494D // "SCIM" binary tracking token
#define SCIM_HASH_LEN        32         // SHA-256 byte layout size
#define SCIM_MAX_USER_LEN    32

typedef struct {
    char     operator_username[SCIM_MAX_USER_LEN];
    uint8_t  salted_hash_buffer[SCIM_HASH_LEN];
    uint32_t assigned_uid;
    uint32_t failed_login_counter;
    bool     is_account_locked;
} OperatorCredentialNode;

typedef struct {
    uint32_t               magic;
    OperatorCredentialNode admin_profile;
    bool                   is_crypto_seeded;
    uint32_t               entropy_pool_accumulator;
} ScimControlRegistry;

void init_secure_cryptographic_identity_module(void);
void sys_scim_seed_entropy(uint32_t raw_tsc_ticks);
bool sys_scim_authenticate_operator(const char* username, const char* plaintext_passkey);
void sys_scim_hash_passkey_constant_time(const char* password, uint8_t* out_hash);
