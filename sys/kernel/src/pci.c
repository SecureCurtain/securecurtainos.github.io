#include "pci.h"
#include "ipc.h"
#include <string.h>

// Forward declaration
static void local_scan_pcie_bus(uint64_t ecam_base_vaddr);

// Simulated user-space mapping base for our motherboard's PCIe ECAM memory block.
// The core microkernel maps the actual physical hardware page over this Ring 3 address.
#define USER_SPACE_PCIE_ECAM_ADDR  0x0000500000000000ULL

#define MAX_TRACKED_PCI_DEVICES    64
static pci_device_record_t g_pci_device_table[MAX_TRACKED_PCI_DEVICES];
static size_t              g_pci_device_count = 0;

extern void print_string(const char* str, int row);

void init_pci_manager(void) {
    memset(g_pci_device_table, 0, sizeof(g_pci_device_table));
    g_pci_device_count = 0;

    print_string("[OK] Sandboxed PCI Bus Manager: ECAM Hardware Register Discovery Online.", 27);
}

/**
 * 🛡️ HARDENED ECAM HARDWARE SCANNER CORE
 * Loops through the computed physical matrix offsets to safely probe individual device headers.
 * Executing this memory-mapped hardware discovery loop inside user space shields Ring 0.
 */
static void local_scan_pcie_bus(uint64_t ecam_base_vaddr) {
    // 1. Enforce strict, non-bypassable matrix iteration boundary loops
    for (uint32_t bus = 0; bus < PCI_MAX_BUSES; bus++) {
        for (uint32_t device = 0; device < PCI_MAX_DEVICES; device++) {
            for (uint32_t function = 0; function < PCI_MAX_FUNCTIONS; function++) {
                
                // 2. 🛡️ SECURITY FIXED: Overflow-Resilient Pointer Arithmetic Matrix Formula
                // Computes the absolute target memory-mapped register address for the current device slot
                uint64_t device_offset = ((bus << 20) | (device << 15) | (function << 12));
                uintptr_t target_reg_vaddr = (uintptr_t)(ecam_base_vaddr + device_offset);

                // Fetch Vendor ID from the first 2 bytes of the standard PCI Configuration Space Header
                uint16_t vendor_id = *(volatile uint16_t*)target_reg_vaddr;

                // A Vendor ID value of 0xFFFF indicates no active hardware peripheral is present in this slot
                if (vendor_id == 0xFFFF || vendor_id == 0x0000) {
                    // If function 0 is absent, skip remaining sub-functions to optimize loop performance
                    if (function == 0) break;
                    continue;
                }

                // 3. 🛡️ ALLOCATION OVERFLOW PROTECTION BOUNDARY
                if (g_pci_device_count >= MAX_TRACKED_PCI_DEVICES) {
                    print_string("[WARN] PCI device allocation capacity full. Dropping remainder.", 28);
                    return;
                }

                // Safely read the device metadata from the verified unprivileged memory page
                uint16_t device_id     = *(volatile uint16_t*)(target_reg_vaddr + 2);
                uint8_t  subclass_code = *(volatile uint8_t*)(target_reg_vaddr + 10);
                uint8_t  class_code    = *(volatile uint8_t*)(target_reg_vaddr + 11);
                uint32_t bar0_low      = *(volatile uint32_t*)(target_reg_vaddr + 0x10);

                size_t idx = g_pci_device_count++;
                g_pci_device_table[idx].vendor_id     = vendor_id;
                g_pci_device_table[idx].device_id     = device_id;
                g_pci_device_table[idx].class_code    = class_code;
                g_pci_device_table[idx].subclass_code = subclass_code;
                
                // Clear the lower 4 bits of the BAR register (which contain hardware flag settings)
                g_pci_device_table[idx].physical_bar0 = (uint64_t)(bar0_low & 0xFFFFFFF0);

                if (class_code == 0x02 && subclass_code == 0x00) {
                    print_string("[PCI MGR] Discovered Intel e1000 Network Interface Card.", 28);
                } else if (class_code == 0x01 && subclass_code == 0x06) {
                    print_string("[PCI MGR] Discovered SATA/AHCI Mass Storage Controller.", 28);
                }
            }
        }
    }
}

int handle_pci_manager_message(const ipc_message_t* msg, ipc_message_t* out_response) {
    if (!msg || !out_response) return -1;

    memset(out_response, 0, sizeof(ipc_message_t));
    out_response->message_type = msg->message_type;
    out_response->payload_length = sizeof(int32_t);
    int32_t* return_status = (int32_t*)out_response->payload;

    // --------------------------------------------------------------------------
    // 🛡️ INTERCEPT ROUTE: AUTHORIZED AUTOMATED BUS DISCOVERY SCAN
    // --------------------------------------------------------------------------
    if (msg->message_type == PCI_CMD_SCAN_BUS) {
        // Enforce absolute identity validation checks via Sender PID.
        // The hardware manager cross-checks msg->sender_pid (populated strictly by the kernel).
        // This ensures an unprivileged app can never issue a raw hardware re-scan command.
        if (msg->sender_pid != 1) { // Assuming PID 1 is your system_init daemon (main.c)
            *return_status = -4; // Access Denied: Rogue hardware command blocked!
            return 0;
        }

        // Run the matrix discovery loop safely inside your Ring 3 container
        local_scan_pcie_bus(USER_SPACE_PCIE_ECAM_ADDR);
        
        out_response->payload_length = sizeof(int32_t) + (g_pci_device_count * sizeof(pci_device_record_t));
        uint8_t* table_dest = out_response->payload + sizeof(int32_t);
        memcpy(table_dest, g_pci_device_table, g_pci_device_count * sizeof(pci_device_record_t));

        *return_status = 0; // Success
        return 0;
    }

    return -1;
}
