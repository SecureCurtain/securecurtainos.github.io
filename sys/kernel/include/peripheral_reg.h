#pragma once
#include <stdint.h>
#include <stdbool.h>

#define MAX_PCI_PERIPHERALS   32
#define PERIPHERAL_MAGIC_TAG  0x50434952 // "PCIR" binary tracking tag

typedef struct {
    uint16_t vendor_id;
    uint16_t device_id;
    uint8_t  pci_class_code;
    bool     is_whitelisted;
    char     device_description[32];
} PciPeripheralNode;

typedef struct {
    uint32_t          magic;
    PciPeripheralNode hardware_whitelist[MAX_PCI_PERIPHERALS];
    uint32_t          registered_devices_count;
    bool              strict_hardware_lockdown;
} SecurePeripheralRegistry;

void init_secure_peripheral_registry(void);
void sys_register_authorized_hardware(uint16_t vid, uint16_t did, uint8_t class_code, const char* desc);
void scan_and_verify_hardware_bus_topology(void);
bool sys_pci_has_display_adapter(char* out_desc, size_t max_len);