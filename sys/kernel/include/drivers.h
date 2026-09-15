/* SecureCurtain OS - Native Hardware Drivers Header
 * Author: Jared Busby (jb7572)
 */

#ifndef _SECURECURTAIN_DRIVERS_H
#define _SECURECURTAIN_DRIVERS_H

#include <stdint.h>
#include <stdbool.h>

/* PCI / PCIe Bus */
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

void pci_scan_bus(void);
pci_device_t *pci_find_device(uint16_t vendor_id, uint16_t device_id);
pci_device_t *pci_find_class(uint8_t class_code, uint8_t subclass);

/* NVMe Storage */
int nvme_init(uint64_t mmio_physical_base);

/* SATA AHCI */
int ahci_init(uint64_t abar_physical_base);

/* USB 3.0 xHCI */
int xhci_init(uint64_t mmio_base);

/* PS/2 Keyboard & Mouse */
int ps2_init(void);

/* Network (Intel Gigabit e1000) */
int e1000_init(uint64_t mmio_physical_address);

/* Security TPM 2.0 */
int tpm2_init(void);

/* Symmetric Multiprocessing */
void smp_init(void);

#endif /* _SECURECURTAIN_DRIVERS_H */

