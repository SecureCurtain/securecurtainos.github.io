#pragma once
#include <stdint.h>
#include <stddef.h>
#include "ipc.h" // Needed to route peripheral states over secure handles

// 🛡️ SECURITY: Standardized PCI MANAGER IPC Command Identifiers
#define PCI_CMD_SCAN_BUS         0x1001
#define PCI_CMD_GET_DEVICE       0x1002

// Strict structural boundaries for the standard PCI Configuration Space Matrix
#define PCI_MAX_BUSES            256
#define PCI_MAX_DEVICES          32
#define PCI_MAX_FUNCTIONS        8

// 🛡️ STRUCTURED PCI PERIPHERAL DESCRIPTION BLOCK
// Encapsulates verified hardware properties safely inside user-space tracking arrays
typedef struct {
    uint16_t vendor_id;          // Hardware manufacturer identifier token (e.g., 0x8086 for Intel)
    uint16_t device_id;          // Device specific hardware model token (e.g., 0x100E for e1000)
    uint8_t  class_code;         // Device class (0x02 = Network Controller, 0x01 = Storage)
    uint8_t  subclass_code;      // Subclass (0x00 = Ethernet, 0x06 = SATA)
    uint64_t physical_bar0;      // Base Address Register 0 (The card's physical MMIO base address)
} __attribute__((packed)) pci_device_record_t;

// --- Primary API Entry Points ---

/**
 * Initializes the unprivileged user-space PCI configuration space tracking matrices.
 */
void init_pci_manager(void);

/**
 * 🛡️ SANDBOXED PCI BUS MANAGER SERVICE
 * Executes entirely within the unprivileged user-space 'pci_bus_manager.elf' 
 * process container. It safely maps the ECAM segment, probes buses, and builds
 * peripheral registries without touching supervisor memory.
 * 
 * @param msg The incoming IPC packet containing scan commands or device queries.
 * @param out_response Output response container to route hardware descriptions back to the caller.
 */
int handle_pci_manager_message(const ipc_message_t* msg, ipc_message_t* out_response);