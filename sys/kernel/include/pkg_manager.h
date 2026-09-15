#pragma once
#include <stdint.h>
#include <stddef.h>
#include "ipc.h" // Needed to route package manager states over secure handles

// 🛡️ SECURITY: Standardized PACKAGE MANAGER IPC Command Identifiers
#define PKG_CMD_INSTALL          0x1601
#define PKG_CMD_VERIFY_SIGNATURE 0x1602
#define PKG_CMD_REMOVE           0x1603
#define PKG_CMD_ADD_REPO         0x1604
#define PKG_CMD_SYNC_REPOS       0x1605

#define PKG_NAME_MAX_LEN         64
#define PKG_SIG_LEN              64 // Standard Ed25519 cryptographic signature size
#define REPO_URL_MAX_LEN         128

// Package manager backend ecosystem format type
typedef enum {
    PKG_TYPE_GENERIC = 0,
    PKG_TYPE_PACMAN  = 1, // Arch Linux pacman (.pkg.tar.zst)
    PKG_TYPE_APT     = 2  // Debian/Ubuntu apt (.deb)
} pkg_format_type_t;

// 🛡️ STRUCTURED PACKAGE INSTALL REQUEST PACKET
// Encapsulates archive properties safely inside standard ipc_message_t envelopes
typedef struct {
    char     package_name[PKG_NAME_MAX_LEN]; // Target application name string (e.g., "vlc", "firefox")
    uint64_t archive_file_size;             // Precise size boundary of the compressed payload
    uint8_t  cryptographic_signature[PKG_SIG_LEN]; // Appended signature verification block
    uint8_t  session_token;             // The current user's token from auth_server.bin to restrict install
    uint8_t  pkg_format;                // 1 = pacman (.pkg.tar.zst), 2 = apt (.deb)
} __attribute__((packed)) pkg_ipc_install_frame_t;

typedef struct {
    char    repo_name[32];
    char    repo_url[REPO_URL_MAX_LEN];
    uint8_t pkg_format;                // PKG_TYPE_PACMAN or PKG_TYPE_APT
    uint8_t session_token;
} __attribute__((packed)) pkg_ipc_repo_config_frame_t;

// --- Primary API Entry Points ---

/**
 * Initializes the unprivileged user-space package manager directory registries.
 */
void init_package_manager_server(void);

/**
 * 🛡️ SANDBOXED PACKAGE MANAGER SERVER MODULE
 * Executes entirely within the unprivileged user-space 'pkg_manager_server.bin' 
 * process container. It safely verifies cryptographic headers, tokenizes names, and 
 * extracts binary streams without touching supervisor memory.
 * 
 * @param msg The incoming IPC packet containing install command frames and session tokens.
 * @param out_response Output response container to route extraction status blocks back to the UI.
 */
int handle_package_manager_message(const ipc_message_t* msg, ipc_message_t* out_response);