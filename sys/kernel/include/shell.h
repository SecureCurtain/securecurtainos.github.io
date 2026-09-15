#pragma once
#include <stdint.h>
#include <stddef.h>
#include "ipc.h" // Needed to route command states over secure handles

// 🛡️ SECURITY: Standardized TERMINAL SHELL IPC Command Identifiers
#define SHELL_CMD_EXECUTE_LINE   0xE01
#define SHELL_CMD_PRINT_PROMPT   0xE02
#define SESSION_CMD_LOGOUT       0xE03
#define SESSION_CMD_REBOOT       0xE04
#define SESSION_CMD_SHUTDOWN     0xE05

#define SHELL_INPUT_MAX_LEN      128
#define SHELL_MAX_ARGS           4

// 🛡️ STRUCTURED SHELL COMMAND EXECUTION PACKET
// Encapsulates raw command lines safely inside standard ipc_message_t envelopes
typedef struct {
    char     raw_input_line[SHELL_INPUT_MAX_LEN]; // The unvalidated user text string input
    uint8_t  active_session_token[32];             // The cryptographic token fetched from auth_server.bin
} __attribute__((packed)) shell_ipc_exec_frame_t;

// --- Primary API Entry Points ---

/**
 * Initializes the unprivileged user-space shell terminal and resets line state buffers.
 */
void init_terminal_shell(void);

/**
 * 🛡️ SANDBOXED TERMINAL SHELL SERVER MODULE
 * Executes entirely within the unprivileged user-space 'shell_server.bin' 
 * process container. It safely parses commands, isolates strings, and handles
 * environmental handoffs without touching supervisor memory.
 * 
 * @param msg The incoming IPC packet containing raw user command inputs and session tokens.
 * @param out_response Output response container to route completion states back to the workspace.
 */
int handle_shell_server_message(const ipc_message_t* msg, ipc_message_t* out_response);

int handle_session_power_message(const ipc_message_t* msg, int32_t* return_status);