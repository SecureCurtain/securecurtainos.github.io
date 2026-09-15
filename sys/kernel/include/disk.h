#pragma once
#include <stdint.h>
#include <stddef.h>
#include "ipc.h" // Needed to route messages via secure handles

#define SATA_SIG_ATA       0x00000101   

// 🛡️ SECURITY: Standardized DISK IPC Command Identifiers for Driver Isolation
#define DISK_CMD_READ      0x501
#define DISK_CMD_WRITE     0x502
#define DISK_CMD_STATUS    0x503

// Host Bus Adapter (HBA) Port structures are maintained strictly inside the sandboxed driver process
typedef struct {
    uint32_t clb;          
    uint32_t clbu;         
    uint32_t fb;           
    uint32_t fbu;          
    uint32_t is;           
    uint32_t ie;           
    uint32_t cmd;          
    uint32_t reserved0;    
    uint32_t tfd;          
    uint32_t sig;          
    uint32_t ssts;         
    uint32_t sctl;         
    uint32_t serr;         
    uint32_t sact;         
    uint32_t ci;           
} __attribute__((packed)) hba_port_t;

// --- 🛡️ STRUCTURED DISK IPC TRANSACTION PACKETS ---
// These structures encapsulate arguments safely inside standard ipc_message_t envelopes
typedef struct {
    uint64_t start_lba;     // Target logical block address to access on physical media
    uint32_t sector_count;  // Total 512-byte blocks requested for transaction
} __attribute__((packed)) disk_ipc_io_frame_t;

// --- Primary API Entry Points ---

/**
 * Initializes the disk driver infrastructure proxy mapping rules.
 */
void init_disk_driver(void);

/**
 * 🛡️ PROXIED MICROKERNEL DISK INPUT/OUTPUT API
 * These functions no longer run in Ring 0 supervisor mode. They act as safe proxy stubs
 * that marshal arguments into IPC frames and send them to the isolated user-space disk driver.
 */
int disk_read_sectors(ipc_handle_t disk_driver_handle, uint64_t start_lba, uint32_t count, uint8_t* user_space_buffer);
int disk_write_sectors(ipc_handle_t disk_driver_handle, uint64_t start_lba, uint32_t count, const uint8_t* user_space_buffer);