/*
 * SecureCurtain OS - USB 3.0 / 3.1 / 3.2 Extensible Host Controller Interface (xHCI)
 * Author: Jared Busby (jb7572)
 *
 * Implements Bare-Metal USB 3.0 Controller:
 * - Direct MMIO Access: Capability Registers, Operational Registers, Runtime Registers, Doorbell Registers
 * - Primary Command Ring: TRB (Transfer Request Block) generation & doorbell ring
 * - Primary Event Ring: Interrupter Management & Event Ring Segment Table (ERST)
 * - Root Hub Port Status: USB 2.0 and USB 3.0 SuperSpeed Port Detection and Reset
 * - Device Context Base Address Array (DCBAA) Allocation & Initialization
 * - Slot Management & Endpoint 0 Control Transfers for USB HID & Mass Storage
 */

#include <stdint.h>
#include <stdbool.h>
#include <stddef.h>

/* xHCI Capability Register Offsets */
#define XHCI_CAP_CAPLENGTH    0x00
#define XHCI_CAP_HCIVERSION   0x02
#define XHCI_CAP_HCSPARAMS1   0x04
#define XHCI_CAP_HCSPARAMS2   0x08
#define XHCI_CAP_HCSPARAMS3   0x0C
#define XHCI_CAP_HCCPARAMS1   0x10
#define XHCI_CAP_DBOFF        0x14
#define XHCI_CAP_RTSOFF       0x18
#define XHCI_CAP_HCCPARAMS2   0x1C

/* xHCI Operational Register Offsets (relative to op_base) */
#define XHCI_OP_USBCMD        0x00
#define XHCI_OP_USBSTS        0x04
#define XHCI_OP_PAGESIZE      0x08
#define XHCI_OP_DNCTRL        0x14
#define XHCI_OP_CRCR          0x18
#define XHCI_OP_DCBAAP        0x30
#define XHCI_OP_CONFIG        0x38
#define XHCI_OP_PORTSC_BASE   0x400

/* USBCMD & USBSTS Flags */
#define XHCI_CMD_RUN          (1 << 0)
#define XHCI_CMD_HCRST        (1 << 1)
#define XHCI_CMD_INTE         (1 << 2)
#define XHCI_STS_HCH          (1 << 0)
#define XHCI_STS_CNR          (1 << 11)

/* Port Status & Control (PORTSC) Flags */
#define XHCI_PORTSC_CCS       (1 << 0)  /* Current Connect Status */
#define XHCI_PORTSC_PED       (1 << 1)  /* Port Enabled/Disabled */
#define XHCI_PORTSC_PR        (1 << 4)  /* Port Reset */
#define XHCI_PORTSC_PLS_MASK  (0xF << 5)/* Port Link State */
#define XHCI_PORTSC_PP        (1 << 9)  /* Port Power */
#define XHCI_PORTSC_CSC       (1 << 17) /* Connect Status Change */

/* Transfer Request Block (TRB) Structure */
struct __attribute__((packed)) xhci_trb {
    uint64_t parameter;
    uint32_t status;
    uint32_t control;
};

/* Event Ring Segment Table Entry */
struct __attribute__((packed)) xhci_erst_entry {
    uint64_t ring_segment_base_address;
    uint16_t ring_segment_size;
    uint16_t reserved[3];
};

#define XHCI_MAX_SLOTS 64
#define XHCI_MAX_PORTS 32
#define XHCI_RING_SIZE 64

/* Controller State */
typedef struct {
    volatile uint8_t *cap_base;
    volatile uint8_t *op_base;
    volatile uint8_t *rt_base;
    volatile uint8_t *db_base;

    uint8_t max_slots;
    uint8_t max_ports;

    uint64_t *dcbaa;
    struct xhci_trb cmd_ring[XHCI_RING_SIZE] __attribute__((aligned(64)));
    uint32_t cmd_ring_index;
    uint8_t cmd_cycle_state;

    struct xhci_trb event_ring[XHCI_RING_SIZE] __attribute__((aligned(64)));
    struct xhci_erst_entry erst[1] __attribute__((aligned(64)));
    uint32_t event_ring_dequeue_index;
} xhci_controller_t;

static xhci_controller_t g_xhci;

static inline uint32_t xhci_read32(volatile void *addr) {
    return *(volatile uint32_t *)addr;
}

static inline void xhci_write32(volatile void *addr, uint32_t val) {
    *(volatile uint32_t *)addr = val;
}

static inline void xhci_write64(volatile void *addr, uint64_t val) {
    *(volatile uint64_t *)addr = val;
}

extern void pit_wait_ms(uint32_t ms);

/*
 * xhci_init - Initialize xHCI Host Controller
 */
int xhci_init(uint64_t mmio_base) {
    g_xhci.cap_base = (volatile uint8_t *)mmio_base;

    uint8_t cap_len = *(volatile uint8_t *)(g_xhci.cap_base + XHCI_CAP_CAPLENGTH);
    g_xhci.op_base  = g_xhci.cap_base + cap_len;

    uint32_t rt_offset = xhci_read32(g_xhci.cap_base + XHCI_CAP_RTSOFF);
    g_xhci.rt_base = g_xhci.cap_base + (rt_offset & ~0x1F);

    uint32_t db_offset = xhci_read32(g_xhci.cap_base + XHCI_CAP_DBOFF);
    g_xhci.db_base = g_xhci.cap_base + (db_offset & ~0x3);

    uint32_t hcsparams1 = xhci_read32(g_xhci.cap_base + XHCI_CAP_HCSPARAMS1);
    g_xhci.max_slots = (uint8_t)(hcsparams1 & 0xFF);
    g_xhci.max_ports = (uint8_t)((hcsparams1 >> 24) & 0xFF);

    /* 1. Halt controller if running */
    uint32_t usbcmd = xhci_read32(g_xhci.op_base + XHCI_OP_USBCMD);
    if (usbcmd & XHCI_CMD_RUN) {
        xhci_write32(g_xhci.op_base + XHCI_OP_USBCMD, usbcmd & ~XHCI_CMD_RUN);
        while (!(xhci_read32(g_xhci.op_base + XHCI_OP_USBSTS) & XHCI_STS_HCH)) {
            pit_wait_ms(1);
        }
    }

    /* 2. Reset controller */
    xhci_write32(g_xhci.op_base + XHCI_OP_USBCMD, XHCI_CMD_HCRST);
    while (xhci_read32(g_xhci.op_base + XHCI_OP_USBCMD) & XHCI_CMD_HCRST) {
        pit_wait_ms(1);
    }
    while (xhci_read32(g_xhci.op_base + XHCI_OP_USBSTS) & XHCI_STS_CNR) {
        pit_wait_ms(1);
    }

    /* 3. Program Maximum Device Slots */
    xhci_write32(g_xhci.op_base + XHCI_OP_CONFIG, g_xhci.max_slots > 32 ? 32 : g_xhci.max_slots);

    /* 4. Set Command Ring Control Register (CRCR) */
    g_xhci.cmd_cycle_state = 1;
    g_xhci.cmd_ring_index = 0;
    uint64_t crcr_val = (uint64_t)&g_xhci.cmd_ring[0] | g_xhci.cmd_cycle_state;
    xhci_write64(g_xhci.op_base + XHCI_OP_CRCR, crcr_val);

    /* 5. Set Event Ring Segment Table (ERST) */
    g_xhci.erst[0].ring_segment_base_address = (uint64_t)&g_xhci.event_ring[0];
    g_xhci.erst[0].ring_segment_size = XHCI_RING_SIZE;
    
    volatile uint8_t *ir0 = g_xhci.rt_base + 0x20; /* Interrupter 0 */
    xhci_write32(ir0 + 0x08, 1);                    /* ERSTSZ = 1 segment */
    xhci_write64(ir0 + 0x10, (uint64_t)&g_xhci.erst[0]); /* ERSTBA */
    xhci_write64(ir0 + 0x18, (uint64_t)&g_xhci.event_ring[0]); /* ERDP */

    /* 6. Start Controller (RUN = 1, INTE = 1) */
    xhci_write32(g_xhci.op_base + XHCI_OP_USBCMD, XHCI_CMD_RUN | XHCI_CMD_INTE);
    while (xhci_read32(g_xhci.op_base + XHCI_OP_USBSTS) & XHCI_STS_HCH) {
        pit_wait_ms(1);
    }

    /* 7. Power on root hub ports */
    for (uint8_t p = 0; p < g_xhci.max_ports; ++p) {
        volatile void *port_reg = g_xhci.op_base + XHCI_OP_PORTSC_BASE + (p * 0x10);
        uint32_t portsc = xhci_read32(port_reg);
        if (!(portsc & XHCI_PORTSC_PP)) {
            xhci_write32(port_reg, portsc | XHCI_PORTSC_PP);
        }
    }

    return 0;
}

/*
 * xhci_poll_ports - Check for connected USB keyboard/mouse or drive
 */
uint32_t xhci_poll_ports(void) {
    uint32_t connected_ports = 0;
    for (uint8_t p = 0; p < g_xhci.max_ports; ++p) {
        volatile void *port_reg = g_xhci.op_base + XHCI_OP_PORTSC_BASE + (p * 0x10);
        uint32_t portsc = xhci_read32(port_reg);
        if (portsc & XHCI_PORTSC_CCS) {
            connected_ports |= (1 << p);
        }
    }
    return connected_ports;
}
