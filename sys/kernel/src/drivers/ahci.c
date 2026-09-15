/*
 * SecureCurtain OS - SATA Advanced Host Controller Interface (AHCI) Driver
 * Author: Jared Busby (jb7572)
 *
 * Implements AHCI 1.3+ Controller:
 * - Generic Host Control & Port Memory Registers
 * - Command List (32 Command Headers per port)
 * - Received FIS (Frame Information Structure) buffers
 * - Command Table with Physical Region Descriptor Table (PRDT)
 * - DMA Read/Write using ATA READ DMA EXT (0x25) and WRITE DMA EXT (0x35)
 */

#include <stdint.h>
#include <stdbool.h>
#include <stddef.h>

#define SATA_SIG_ATA    0x00000101
#define SATA_SIG_ATAPI  0xEB140101

#define AHCI_DEV_BUSY   0x80
#define AHCI_DEV_DRQ    0x08

/* AHCI Port Registers */
typedef volatile struct {
    uint32_t clb;
    uint32_t clbu;
    uint32_t fb;
    uint32_t fbu;
    uint32_t is;
    uint32_t ie;
    uint32_t cmd;
    uint32_t rsv0;
    uint32_t tfd;
    uint32_t sig;
    uint32_t ssts;
    uint32_t sctl;
    uint32_t serr;
    uint32_t sact;
    uint32_t ci;
    uint32_t sntf;
    uint32_t fbs;
    uint32_t rsv1[11];
    uint32_t vendor[4];
} ahci_port_t;

/* AHCI Generic Host Control */
typedef volatile struct {
    uint32_t cap;
    uint32_t ghc;
    uint32_t is;
    uint32_t pi;
    uint32_t vs;
    uint32_t ccc_ctl;
    uint32_t ccc_pts;
    uint32_t em_loc;
    uint32_t em_ctl;
    uint32_t cap2;
    uint32_t bohc;
    uint8_t  rsv[0xA0 - 0x2C];
    uint8_t  vendor[0x100 - 0xA0];
    ahci_port_t ports[32];
} ahci_hba_memory_t;

/* AHCI Command Header */
typedef struct {
    uint8_t  cfl:5;
    uint8_t  a:1;
    uint8_t  w:1;
    uint8_t  p:1;
    uint8_t  r:1;
    uint8_t  b:1;
    uint8_t  c:1;
    uint8_t  rsv0:1;
    uint8_t  pmp:4;
    uint16_t prdtl;
    volatile uint32_t prdbc;
    uint32_t ctba;
    uint32_t ctbau;
    uint32_t rsv1[4];
} ahci_cmd_header_t;

/* Physical Region Descriptor Table (PRDT) Entry */
typedef struct {
    uint32_t dba;
    uint32_t dbau;
    uint32_t rsv0;
    uint32_t dbc:22;
    uint32_t rsv1:9;
    uint32_t i:1;
} ahci_prdt_entry_t;

static ahci_hba_memory_t *g_abar = NULL;

extern void pit_wait_ms(uint32_t ms);

void ahci_start_cmd(ahci_port_t *port) {
    while (port->cmd & (1 << 15)); /* Wait until CR is 0 */
    port->cmd |= (1 << 4);         /* FRE = 1 */
    port->cmd |= (1 << 0);         /* ST = 1 */
}

void ahci_stop_cmd(ahci_port_t *port) {
    port->cmd &= ~(1 << 0);        /* ST = 0 */
    port->cmd &= ~(1 << 4);        /* FRE = 0 */
    while (port->cmd & (1 << 15)); /* Wait until CR is 0 */
    while (port->cmd & (1 << 14)); /* Wait until FR is 0 */
}

int ahci_init(uint64_t abar_physical_base) {
    g_abar = (ahci_hba_memory_t *)abar_physical_base;

    /* Enable AHCI Mode via GHC register */
    g_abar->ghc |= (1U << 31); /* AHCI Enable */

    uint32_t pi = g_abar->pi;
    for (int i = 0; i < 32; ++i) {
        if (pi & (1 << i)) {
            ahci_port_t *port = &g_abar->ports[i];
            uint32_t ssts = port->ssts;
            uint8_t ipm = (uint8_t)((ssts >> 8) & 0x0F);
            uint8_t det = (uint8_t)(ssts & 0x0F);

            if (det == 3 && ipm == 1) {
                /* Active SATA device present */
                if (port->sig == SATA_SIG_ATA) {
                    ahci_stop_cmd(port);
                    ahci_start_cmd(port);
                }
            }
        }
    }

    return 0;
}
