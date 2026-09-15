#pragma once
#include <stdint.h>
#include <stddef.h>
#include "ipc.h" // Needed to route session states over secure handles

// 🛡️ SECURITY: Standardized SESSION MANAGEMENT IPC Command Identifiers
#define SESSION_CMD_LOGOUT       0xE03
#define SESSION_CMD_REBOOT       0xE04
#define SESSION_CMD_SHUTDOWN     0xE05

// --- Primary API Entry Points ---

/**
 * Initializes the unprivileged user-space session manager state maps.
 */
void init_session_manager(void);

/**
 * 🛡️ SANDBOXED DESKTOP POWER AND SESSION MANAGER
 * This routine runs entirely within the unprivileged user-space 'shell_server.bin' process container.
 * It safely processes desktop power commands, validates administrator tokens, and coordinates handoffs.
 */
int handle_session_power_message(const ipc_message_t* msg, int32_t* return_status);