#pragma once
#include <stdint.h>
#include <stddef.h>
#include "ipc.h" // Needed to route file browser states over secure handles

// 🛡️ SECURITY: Standardized FILE MANAGER IPC Command Identifiers
#define FM_CMD_LIST_DIRECTORY    0x1401
#define FM_CMD_GET_FILE_ATTR     0x1402

#define FM_MAX_ENTRIES           64
#define FM_NAME_MAX_LEN          64

// Individual file/folder node attribute description descriptor
typedef struct {
    char     name[FM_NAME_MAX_LEN];     // File or directory descriptor name
    uint32_t type_flags;                 // Type definition (1 = File, 2 = Directory)
    size_t   file_size;                  // Total file size in bytes
} __attribute__((packed)) fm_directory_entry_t;

// 🛡️ STRUCTURED DIRECTORY LIST REQUEST PACKET
// Encapsulates directory queries safely inside standard ipc_message_t envelopes
typedef struct {
    char     target_path[256];           // Absolute directory path to browse (e.g., /home/aaa/documents)
    uint8_t  session_token;          // The current user's token from auth_server.bin to restrict read
} __attribute__((packed)) fm_ipc_browse_frame_t;

// --- Primary API Entry Points ---

/**
 * Initializes the unprivileged user-space file browser memory states.
 */
void init_file_manager_server(void);

/**
 * 🛡️ SANDBOXED FILE BROWSER SERVER MODULE
 * Executes entirely within the unprivileged user-space 'file_manager_server.bin' 
 * process container. It safely tokenizes paths, parses folder listings, and handles
 * directory layout queries without touching supervisor memory.
 * 
 * @param msg The incoming IPC packet containing path requests and user session tokens.
 * @param out_response Output response container to route directory entries back to the UI shell.
 */
int handle_file_manager_message(const ipc_message_t* msg, ipc_message_t* out_response);