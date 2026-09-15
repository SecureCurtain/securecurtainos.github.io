#pragma once

// =========================================================================
// FREESTANDING ENGINE ENFORCEMENT CONFIGURATION FOR CUSTOM MICROKERNEL
// =========================================================================
#define MBEDTLS_NO_PLATFORM_ENTROPY   // Turn off host-OS raw noise gatherers
#define MBEDTLS_HAVE_ASM              // Allow optimization via CPU vector extensions
#define MBEDTLS_NO_DEFAULT_ENTROPY_SOURCES

// Turn off standard desktop file and terminal printing dependencies
#define MBEDTLS_PLATFORM_NO_STD_FUNCTIONS
#define MBEDTLS_PLATFORM_C

// Enforce industry-standard secure cryptography engine selections
#define MBEDTLS_AES_C                 // Enable hardware accelerated AES
#define MBEDTLS_CIPHER_C
#define MBEDTLS_SHA256_C              // Enable SHA-256 validation matrices
#define MBEDTLS_MD_C

// Enforce TLS 1.3 protocol stack configurations exclusively
#define MBEDTLS_SSL_TLS_C
#define MBEDTLS_SSL_CLI_C             // Enable outbound secure client handshakes
#define MBEDTLS_SSL_PROTO_TLS1_3      // Enforce strict TLS 1.3 tunnels

// Memory Buffer Tuning Caps matching our unprivileged User Sandboxes
#define MBEDTLS_SSL_IN_CONTENT_LEN    16384
#define MBEDTLS_SSL_OUT_CONTENT_LEN   16384
