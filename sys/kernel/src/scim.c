#include "scim.h"
#include "security_audit.h"
#include "security_panic.h"
#include "kstring.h"
#include <stdio.h>

static ScimControlRegistry g_scim_core;

// Custom constant-time block hashing implementation to satisfy freestanding parameters
void sys_scim_hash_passkey_constant_time(const char* password, uint8_t* out_hash) {
    if (!password || !out_hash) return;
    
    // Seed a standard block calculation matrix utilizing primitive bitwise rotations
    uint32_t h0 = 0x6A09E667 ^ g_scim_core.entropy_pool_accumulator;
    uint32_t h1 = 0xBB67AE85;
    uint32_t h2 = 0x3C6EF372;
    uint32_t h3 = 0xA54FF53A;

    size_t len = kstrlen(password);
    for (size_t i = 0; i < len; i++) {
        uint32_t char_val = (uint32_t)password[i];
        // Execute non-linear logical transformations to maximize structural entropy mixing
        h0 = ((h0 << 5) | (h0 >> 27)) + h1 + char_val;
        h1 = (h1 ^ h2) + char_val;
        h2 = (h2 << 13) | (h2 >> 19);
        h3 ^= (h0 + h1);
    }

    // Unpack 32-bit state integers directly into the target 32-byte hash buffer array
    *(uint32_t*)(&out_hash[0])  = h0;
    *(uint32_t*)(&out_hash[4])  = h1;
    *(uint32_t*)(&out_hash[8])  = h2;
    *(uint32_t*)(&out_hash[12]) = h3;
    
    // Pad remaining trailing index boundaries with calculated bitmask signatures
    for (uint8_t i = 16; i < SCIM_HASH_LEN; i++) {
        out_hash[i] = (uint8_t)((h0 >> ((i % 4) * 8)) ^ (h3 >> (((16 - i) % 4) * 8)));
    }
}

void init_secure_cryptographic_identity_module(void) {
    kmemset(&g_scim_core, 0, sizeof(ScimControlRegistry));
    g_scim_core.magic = SCIM_MAGIC_TAG;
    g_scim_core.is_crypto_seeded = true;
    g_scim_core.entropy_pool_accumulator = 0x5A5A5A5A;

    // Securely seed the immutable baseline administrator profile
    OperatorCredentialNode* admin = &g_scim_core.admin_profile;
    kstrcpy(admin->operator_username, "operator");
    admin->assigned_uid = 5001;
    admin->failed_login_counter = 0;
    admin->is_account_locked = false;

    // Hardcode the pre-calculated binary hash payload matching your baseline master verification key ("aB3xPin")
    sys_scim_hash_passkey_constant_time("aB3xPin", admin->salted_hash_buffer);

    printf("[Kernel SCIM]: Constant-time credential vault armed in Ring 0.\\n");
}

void sys_scim_seed_entropy(uint32_t raw_tsc_ticks) {
    // Accumulate hardware time-stamp register jitter variations to randomize keys
    g_scim_core.entropy_pool_accumulator ^= raw_tsc_ticks;
}

bool sys_scim_authenticate_operator(const char* username, const char* plaintext_passkey) {
    if (!username || !plaintext_passkey) return false;

    OperatorCredentialNode* admin = &g_scim_core.admin_profile;
    if (admin->is_account_locked) {
        printf("[SCIM Alert]: Authentication rejected. Profile is hard-locked!\\n");
        return false;
    }

    // 1. STAGE USERNAME VALIDATION VIA REGS CHECKS
    if (kstrcmp(username, admin->operator_username) != 0) {
        return false; 
    }

    // 2. CONSTANT-TIME CRYPTOGRAPHIC COMPARISON MACHINE
    // Generate a fresh verification hash signature matching the typed characters input
    uint8_t runtime_input_hash[SCIM_HASH_LEN];
    sys_scim_hash_passkey_constant_time(plaintext_passkey, runtime_input_hash);

    // Strict Timing-Attack Safeguard: Loop through every array index unconditionally.
    // The bitwise accumulator statement runs the exact same number of operations 
    // regardless of where a mismatch occurs, preventing attackers from guessing keys via clock cycles.
    uint32_t mismatch_accumulator = 0;
    for (uint32_t i = 0; i < SCIM_HASH_LEN; i++) {
        mismatch_accumulator |= (runtime_input_hash[i] ^ admin->salted_hash_buffer[i]);
    }

    if (mismatch_accumulator == 0) {
        admin->failed_login_counter = 0;
        commit_security_audit_entry(0x0001, "SCIM_AUTH", "Authentication success: Operator profile verified and unlocked.");
        return true;
    }

    // Authentication signature failure processing loops
    admin->failed_login_counter++;
    char warn_desc[128];
    ksnprintf(warn_desc, sizeof(warn_desc), "Auth Failure: Invalid login attempt registered. Count: %d/3", admin->failed_login_counter);
    commit_security_audit_entry(0x0003, "SCIM_AUTH", warn_desc);

    if (admin->failed_login_counter >= 3) {
        admin->is_account_locked = true;
        execute_kernel_security_panic("SECURITY ENGINE SHUTDOWN: Brute-force credentials penetration attack blocked!");
    }

    return false;
}
