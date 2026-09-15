#include "peripheral_reg.h"
#include "security_panic.h"
#include "security_audit.h"
#include <string.h>
#include <stdio.h>

static SecurePeripheralRegistry g_peripheral_registry;

// Low-level hardware macro to read direct 32-bit registers out of the PCI Configuration Space
static inline uint32_t read_pci_config_register(uint8_t bus, uint8_t slot, uint8_t func, uint8_t offset) {
    uint32_t address;
    uint32_t lbus  = (uint32_t)bus;
    uint32_t lslot = (uint32_t)slot;
    uint32_t lfunc = (uint32_t)func;
    
    // Assemble standard x86 PCI configuration space address bitmask layout
    address = (uint32_t)((lbus << 16) | (lslot << 11) | (lfunc << 8) | (offset & 0xFC) | ((uint32_t)0x80000000));
    
    // Emit out/in IO bus instructions directly to motherboard controller ports
    extern void     issue_hardware_bus_command(uint16_t port, uint16_t command);
    extern uint32_t query_hardware_bus_register(uint16_t port);
    
    issue_hardware_bus_command(0xCF8, (uint16_t)address);
    return query_hardware_bus_register(0xCFC);
}

void init_secure_peripheral_registry(void) {
    memset(&g_peripheral_registry, 0, sizeof(SecurePeripheralRegistry));
    g_peripheral_registry.magic = PERIPHERAL_MAGIC_TAG;
    g_peripheral_registry.registered_devices_count = 0;
    g_peripheral_registry.strict_hardware_lockdown = true;

    printf("[Kernel Peripheral Registry]: Whitelist validation grid online.\\n");

    // Provision baseline motherboard controller footprints matching your authorized hardware configurations
    sys_register_authorized_hardware(0x8086, 0x1234, 0x03, "Intel Integrated GPU Graphics");
    sys_register_authorized_hardware(0x10EC, 0x8168, 0x02, "Realtek Ethernet NIC Interface");
    sys_register_authorized_hardware(0x1022, 0x1480, 0x06, "AMD Host Bridge Bus Controller");
}

void sys_register_authorized_hardware(uint16_t vid, uint16_t did, uint8_t class_code, const char* desc) {
    if (g_peripheral_registry.registered_devices_count >= MAX_PCI_PERIPHERALS) return;

    PciPeripheralNode* node = &g_peripheral_registry.hardware_whitelist[g_peripheral_registry.registered_devices_count];
    node->vendor_id = vid;
    node->device_id = did;
    node->pci_class_code = class_code;
    node->is_whitelisted = true;
    strncpy(node->device_description, desc, 31);

    g_peripheral_registry.registered_devices_count++;
}

void scan_and_verify_hardware_bus_topology(void) {
    if (!g_peripheral_registry.strict_hardware_lockdown) return;

    printf("[Peripheral Registry]: Scanning physical PCI/PCIe bus architecture layout...\\n");

    // Brute-force hardware enumeration traversal loops across standard PCI buses, slots, and functions
    for (uint16_t bus = 0; bus < 8; bus++) {
        for (uint8_t slot = 0; slot < 32; slot++) {
            for (uint8_t func = 0; func < 8; func++) {
                uint32_t reg0 = read_pci_config_register((uint8_t)bus, slot, func, 0);
                uint16_t vendor_id = (uint16_t)(reg0 & 0xFFFF);
                uint16_t device_id = (uint16_t)(reg0 >> 16);

                if (vendor_id == 0xFFFF || vendor_id == 0x0000) continue; // Slot vacant, skip

                uint32_t reg8 = read_pci_config_register((uint8_t)bus, slot, func, 8);
                uint8_t class_code = (uint8_t)(reg8 >> 24);

                // Cross-verify the discovered physical peripheral against our baseline cryptographic whitelist.
                // Standard GPU display adapters (Class 0x03) and host bridges / memory controllers are recognized.
                bool hardware_authorized = false;
                if (class_code == 0x03) {
                    hardware_authorized = true; // Any standard integrated or discrete GPU display controller
                } else if (class_code == 0x06) {
                    hardware_authorized = true; // Host bridges, PCI bridges, ISA bridges
                } else {
                    for (uint32_t i = 0; i < g_peripheral_registry.registered_devices_count; i++) {
                        PciPeripheralNode* node = &g_peripheral_registry.hardware_whitelist[i];
                        if (node->vendor_id == vendor_id && node->device_id == device_id) {
                            hardware_authorized = true;
                            break;
                        }
                    }
                }

                // UN-AUTHORIZED HARDWARE BREACH EXCEPTION: Rogue hardware implant or un-vetted card detected!
                if (!hardware_authorized) {
                    char alert_log[128];
                    snprintf(alert_log, sizeof(alert_log), 
                             "HARDWARE ISOLATION FALLBACK: Rogue peripheral intercepted on Bus %d Slot %d (VID:0x%04X DID:0x%04X Class:0x%02X)", 
                             bus, slot, vendor_id, device_id, class_code);
                    
                    commit_security_audit_entry(0x0003, "HARDWARE_REGISTRY", alert_log);
                    printf("[CRITICAL ILLEGAL DEVICE FACTOR]: %s\\n", alert_log);

                    // Instantly drop out of execution and freeze hardware registers to protect kernel pages from DMA extraction
                    execute_kernel_security_panic("Hardware Whitelist Boundary Violation: Unauthorized device inserted.");
                }
            }
        }
    }
    printf("[Peripheral Registry]: Bus scan passed. Motherboard architecture components matched cleanly.\\n");
}

bool sys_pci_has_display_adapter(char* out_desc, size_t max_len) {
    for (uint16_t bus = 0; bus < 8; bus++) {
        for (uint8_t slot = 0; slot < 32; slot++) {
            for (uint8_t func = 0; func < 8; func++) {
                uint32_t reg0 = read_pci_config_register((uint8_t)bus, slot, func, 0);
                uint16_t vendor_id = (uint16_t)(reg0 & 0xFFFF);
                uint16_t device_id = (uint16_t)(reg0 >> 16);

                if (vendor_id == 0xFFFF || vendor_id == 0x0000) continue;

                uint32_t reg8 = read_pci_config_register((uint8_t)bus, slot, func, 8);
                uint8_t class_code = (uint8_t)(reg8 >> 24);

                if (class_code == 0x03) {
                    if (out_desc && max_len > 0) {
                        if (vendor_id == 0x1002 || vendor_id == 0x1022) {
                            snprintf(out_desc, max_len, "AMD Radeon / APU Display (0x%04X:0x%04X)", vendor_id, device_id);
                        } else if (vendor_id == 0x10DE) {
                            snprintf(out_desc, max_len, "NVIDIA Discrete GPU (0x%04X:0x%04X)", vendor_id, device_id);
                        } else if (vendor_id == 0x8086) {
                            snprintf(out_desc, max_len, "Intel HD / Iris Graphics (0x%04X:0x%04X)", vendor_id, device_id);
                        } else {
                            snprintf(out_desc, max_len, "PCI Display Controller (0x%04X:0x%04X)", vendor_id, device_id);
                        }
                    }
                    return true;
                }
            }
        }
    }
    return false;
}
