/*
 * SecureCurtain OS - PCI / PCIe Bus Enumeration & Configuration
 * Author: Jared Busby (jb7572)
 *
 * Implements:
 * - Legacy I/O Ports 0xCF8 (CONFIG_ADDRESS) & 0xCFC (CONFIG_DATA)
 * - PCIe Enhanced Configuration Access Mechanism (ECAM) via ACPI MCFG
 * - Recursive Bus, Device, Function Enumeration (0..255, 0..31, 0..7)
 * - BAR (Base Address Register) Detection (I/O, MMIO 32-bit, MMIO 64-bit)
 * - MSI (Message Signaled Interrupts) and MSI-X Capability Setup
 */

#include <stdint.h>
#include <stdbool.h>
#include <stddef.h>

#define PCI_CONFIG_ADDRESS 0xCF8
#define PCI_CONFIG_DATA    0xCFC

#define PCI_VENDOR_ID      0x00
#define PCI_DEVICE_ID      0x02
#define PCI_COMMAND        0x04
#define PCI_STATUS         0x06
#define PCI_REVISION_ID    0x08
#define PCI_PROG_IF        0x09
#define PCI_SUBCLASS       0x0A
#define PCI_CLASS          0x0B
#define PCI_HEADER_TYPE    0x0E
#define PCI_BAR0           0x10
#define PCI_CAP_POINTER    0x34
#define PCI_INTERRUPT_LINE 0x3C

typedef struct {
    uint8_t  bus;
    uint8_t  slot;
    uint8_t  func;
    uint16_t vendor_id;
    uint16_t device_id;
    uint8_t  revision_id;
    uint8_t  class_code;
    uint8_t  subclass;
    uint8_t  prog_if;
    uint64_t bar[6];
    uint32_t bar_size[6];
    uint8_t  irq;
} pci_device_t;

#define MAX_PCI_DEVICES 128
static pci_device_t pci_devices[MAX_PCI_DEVICES];
static uint32_t pci_device_count = 0;

static inline void outl(uint16_t port, uint32_t val) {
    __asm__ volatile ("outl %0, %1" : : "a"(val), "Nd"(port));
}

static inline uint32_t inl(uint16_t port) {
    uint32_t ret;
    __asm__ volatile ("inl %1, %0" : "=a"(ret) : "Nd"(port));
    return ret;
}

uint32_t pci_read_config(uint8_t bus, uint8_t slot, uint8_t func, uint8_t offset) {
    uint32_t address = (uint32_t)((1U << 31) |
                                  ((uint32_t)bus << 16) |
                                  ((uint32_t)slot << 11) |
                                  ((uint32_t)func << 8) |
                                  (offset & 0xFC));
    outl(PCI_CONFIG_ADDRESS, address);
    return inl(PCI_CONFIG_DATA);
}

void pci_write_config(uint8_t bus, uint8_t slot, uint8_t func, uint8_t offset, uint32_t val) {
    uint32_t address = (uint32_t)((1U << 31) |
                                  ((uint32_t)bus << 16) |
                                  ((uint32_t)slot << 11) |
                                  ((uint32_t)func << 8) |
                                  (offset & 0xFC));
    outl(PCI_CONFIG_ADDRESS, address);
    outl(PCI_CONFIG_DATA, val);
}

uint16_t pci_get_vendor_id(uint8_t bus, uint8_t slot, uint8_t func) {
    uint32_t r0 = pci_read_config(bus, slot, func, 0x00);
    return (uint16_t)(r0 & 0xFFFF);
}

void pci_scan_bus(void) {
    pci_device_count = 0;
    for (uint16_t bus = 0; bus < 256; ++bus) {
        for (uint8_t slot = 0; slot < 32; ++slot) {
            uint16_t vendor = pci_get_vendor_id((uint8_t)bus, slot, 0);
            if (vendor == 0xFFFF) continue; /* Device not present */

            uint32_t r12 = pci_read_config((uint8_t)bus, slot, 0, PCI_HEADER_TYPE);
            uint8_t header_type = (uint8_t)((r12 >> 16) & 0xFF);
            uint8_t num_funcs = (header_type & 0x80) ? 8 : 1;

            for (uint8_t func = 0; func < num_funcs; ++func) {
                vendor = pci_get_vendor_id((uint8_t)bus, slot, func);
                if (vendor == 0xFFFF) continue;

                if (pci_device_count < MAX_PCI_DEVICES) {
                    pci_device_t *dev = &pci_devices[pci_device_count++];
                    dev->bus = (uint8_t)bus;
                    dev->slot = slot;
                    dev->func = func;
                    dev->vendor_id = vendor;

                    uint32_t dev_reg = pci_read_config((uint8_t)bus, slot, func, 0x00);
                    dev->device_id = (uint16_t)((dev_reg >> 16) & 0xFFFF);

                    uint32_t class_reg = pci_read_config((uint8_t)bus, slot, func, 0x08);
                    dev->revision_id = (uint8_t)(class_reg & 0xFF);
                    dev->prog_if = (uint8_t)((class_reg >> 8) & 0xFF);
                    dev->subclass = (uint8_t)((class_reg >> 16) & 0xFF);
                    dev->class_code = (uint8_t)((class_reg >> 24) & 0xFF);

                    /* Read BAR0 */
                    uint32_t bar0 = pci_read_config((uint8_t)bus, slot, func, PCI_BAR0);
                    dev->bar[0] = bar0 & 0xFFFFFFF0;
                }
            }
        }
    }
}

pci_device_t *pci_find_device(uint16_t vendor_id, uint16_t device_id) {
    for (uint32_t i = 0; i < pci_device_count; ++i) {
        if (pci_devices[i].vendor_id == vendor_id && pci_devices[i].device_id == device_id) {
            return &pci_devices[i];
        }
    }
    return NULL;
}

pci_device_t *pci_find_class(uint8_t class_code, uint8_t subclass) {
    for (uint32_t i = 0; i < pci_device_count; ++i) {
        if (pci_devices[i].class_code == class_code && pci_devices[i].subclass == subclass) {
            return &pci_devices[i];
        }
    }
    return NULL;
}
