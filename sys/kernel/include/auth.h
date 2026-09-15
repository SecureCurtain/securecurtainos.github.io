#pragma once
#include <stdint.h>
#include <stddef.h>
#include "ipc.h" // Needed to route authentication states over secure handles

// 🛡️ SECURITY: Standardized AUTHENTICATION IPC Command Identifiers
#define AUTH_CMD_LOGIN          0xB01
#define AUTH_CMD_LOGOUT         0xB02
#define AUTH_CMD_VALIDATE_TOKEN 0xB03

#define AUTH_USER_MAX_LEN       32
#define AUTH_PASS_MAX_LEN       64
#define AUTH_TOKEN_MAX_LEN      32

// 🛡️ STRUCTURED USER LOGIN REQUEST PACKET
// Encapsulates authentication credentials safely inside standard ipc_message_t envelopes
typedef struct {
    char username[AUTH_USER_MAX_LEN];  // Target username string
    char password[AUTH_PASS_MAX_LEN];  // Raw input password string to be securely hashed
} __attribute__((packed)) auth_ipc_login_frame_t;

// 🛡️ STRUCTURED SESSION TOKEN RESPONSE PACKET
typedef struct {
    int32_t  status_code;              // 0 = Success, -4 = Access Denied
    uint32_t authorized_uid;           // Kernel-tracked User ID (e.g., 1000)
    uint8_t  session_token[AUTH_TOKEN_MAX_LEN]; // Cryptographic token returned to the shell
} __attribute__((packed)) auth_ipc_response_frame_t;

// --- Primary API Entry Points ---

/**
 * Initializes the unprivileged user-space authentication database tracking structures.
 */
void init_auth_system(void);

/**
 * 🛡️ SANDBOXED AUTHENTICATION SERVER MODULE
 * Executes entirely within the unprivileged user-space 'auth_server.bin' 
 * process container. It safely parses logins, executes crypto hashes, 
 * and handles session validation loops without touching supervisor memory.
 * 
 * @param msg The incoming IPC packet containing login credentials or session tokens.
 * @param out_response Output response container to route authentication states back to the client.
 */
int handle_auth_server_message(const ipc_message_t* msg, ipc_message_t* out_response);