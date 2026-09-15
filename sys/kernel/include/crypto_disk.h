#pragma once
#include <stdint.h>
#include <stddef.h>
#include "ipc.h" // Needed to route encrypted transactions over secure handles

// 🛡️ SECURITY: Standardized CRYPTO DISK IPC Command Identifiers
#define CRYPTO_CMD_MOUNT_BACKING   0xD01
#define CRYPTO_CMD_READ_SECTORS    0xD02
#define CRYPTO_CMD_WRITE_SECTORS   0xD03

#define CRYPTO_SECTOR_SIZE         512
#define CRYPTO_KEY_LEN             32   // Standard 256-bit volume encryption key size

// 🛡️ STRUCTURED CRYPTO SECTOR READ/WRITE PACKET
// Encapsulates disk properties safely inside standard ipc_message_t envelopes
typedef struct {
    uint64_t target_lba;                // Target logical block address to access on the backing file
    uint32_t sector_count;              // Number of 512-byte blocks requested for transaction
    uint32_t payload_offset;            // Boundary validation offset tracker inside the packet
} __attribute__((packed)) crypto_ipc_sector_frame_t;

// --- Primary API Entry Points ---

/**
 * Initializes the unprivileged user-space encrypted disk engine.
 */
void init_crypto_disk_server(void);

/**
 * 🛡️ SANDBOXED ENCRYPTED BLOCK DEVICE SERVER
 * Executes entirely within the unprivileged user-space 'crypto_disk_server.bin' 
 * process container. It safely decrypts/encrypts data sectors, handles backing file 
 * offsets, and communicates with storage servers without touching supervisor memory.
 * 
 * @param msg The incoming IPC packet containing sector write frames or read requests.
 * @param out_response Output response container to route decrypted bytes or execution statuses.
 */
int handle_crypto_disk_message(const ipc_message_t* msg, ipc_message_t* out_response);