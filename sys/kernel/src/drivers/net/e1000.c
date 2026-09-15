/*
 * SecureCurtain OS - Intel 82540EM / 82545EM / 82574L (e1000) Gigabit NIC Driver
 * Author: Jared Busby (jb7572)
 *
 * Implements Hardware Ethernet Frame Processing:
 * - Direct PCIe MMIO Register Access
 * - DMA Receive (RX) Descriptor Ring Buffer
 * - DMA Transmit (TX) Descriptor Ring Buffer
 * - Hardware MAC Address extraction from EEPROM / RAL/RAH registers
 * - Ring 0 lwIP zero-copy packet ingress/egress handoff
 */

#include <stdint.h>
#include <stdbool.h>
#include <stddef.h>

#define E1000_NUM_RX_DESC 32
#define E1000_NUM_TX_DESC 32
#define E1000_BUFFER_SIZE 2048

/* E1000 MMIO Register Offsets */
#define REG_CTRL     0x0000
#define REG_STATUS   0x0008
#define REG_EEPROM   0x0014
#define REG_IMS      0x00D0
#define REG_RCTL     0x0100
#define REG_TCTL     0x0400
#define REG_RDBAL    0x2800
#define REG_RDBAH    0x2804
#define REG_RDLEN    0x2808
#define REG_RDH      0x2810
#define REG_RDT      0x2818
#define REG_TDBAL    0x3800
#define REG_TDBAH    0x3804
#define REG_TDLEN    0x3808
#define REG_TDH      0x3810
#define REG_TDT      0x3818
#define REG_RAL      0x5400
#define REG_RAH      0x5404

/* Hardware RX Descriptor */
struct __attribute__((packed)) e1000_rx_desc {
    uint64_t buffer_addr;
    uint16_t length;
    uint16_t checksum;
    uint8_t  status;
    uint8_t  errors;
    uint16_t special;
};

/* Hardware TX Descriptor */
struct __attribute__((packed)) e1000_tx_desc {
    uint64_t buffer_addr;
    uint16_t length;
    uint8_t  cso;
    uint8_t  cmd;
    uint8_t  status;
    uint8_t  css;
    uint16_t special;
};

static volatile uint8_t *e1000_mmio_base = NULL;
static struct e1000_rx_desc rx_descs[E1000_NUM_RX_DESC] __attribute__((aligned(16)));
static struct e1000_tx_desc tx_descs[E1000_NUM_TX_DESC] __attribute__((aligned(16)));
static uint8_t rx_buffers[E1000_NUM_RX_DESC][E1000_BUFFER_SIZE] __attribute__((aligned(16)));
static uint8_t tx_buffers[E1000_NUM_TX_DESC][E1000_BUFFER_SIZE] __attribute__((aligned(16)));

static uint8_t mac_address[6];
static uint16_t rx_cur = 0;
static uint16_t tx_cur = 0;

static inline void e1000_write(uint32_t reg, uint32_t val) {
    *((volatile uint32_t *)(e1000_mmio_base + reg)) = val;
}

static inline uint32_t e1000_read(uint32_t reg) {
    return *((volatile uint32_t *)(e1000_mmio_base + reg));
}

/*
 * e1000_read_mac - Extract device MAC address
 */
static void e1000_read_mac(void) {
    uint32_t ral = e1000_read(REG_RAL);
    uint32_t rah = e1000_read(REG_RAH);

    mac_address[0] = (uint8_t)(ral & 0xFF);
    mac_address[1] = (uint8_t)((ral >> 8) & 0xFF);
    mac_address[2] = (uint8_t)((ral >> 16) & 0xFF);
    mac_address[3] = (uint8_t)((ral >> 24) & 0xFF);
    mac_address[4] = (uint8_t)(rah & 0xFF);
    mac_address[5] = (uint8_t)((rah >> 8) & 0xFF);
}

/*
 * e1000_init - Initialize e1000 PCIe device with MMIO BAR
 */
int e1000_init(uint64_t mmio_physical_address) {
    e1000_mmio_base = (volatile uint8_t *)mmio_physical_address;

    /* 1. Read MAC Address */
    e1000_read_mac();

    /* 2. Initialize RX Descriptors */
    for (int i = 0; i < E1000_NUM_RX_DESC; ++i) {
        rx_descs[i].buffer_addr = (uint64_t)&rx_buffers[i][0];
        rx_descs[i].status = 0;
    }

    e1000_write(REG_RDBAL, (uint32_t)((uint64_t)&rx_descs[0] & 0xFFFFFFFF));
    e1000_write(REG_RDBAH, (uint32_t)((uint64_t)&rx_descs[0] >> 32));
    e1000_write(REG_RDLEN, E1000_NUM_RX_DESC * sizeof(struct e1000_rx_desc));
    e1000_write(REG_RDH, 0);
    e1000_write(REG_RDT, E1000_NUM_RX_DESC - 1);

    /* Enable RX with Broadcast and 2048 byte buffers */
    e1000_write(REG_RCTL, 0x00008002 | (1 << 15) | (0 << 16));

    /* 3. Initialize TX Descriptors */
    for (int i = 0; i < E1000_NUM_TX_DESC; ++i) {
        tx_descs[i].buffer_addr = (uint64_t)&tx_buffers[i][0];
        tx_descs[i].cmd = 0;
        tx_descs[i].status = 1; /* Descriptor Done */
    }

    e1000_write(REG_TDBAL, (uint32_t)((uint64_t)&tx_descs[0] & 0xFFFFFFFF));
    e1000_write(REG_TDBAH, (uint32_t)((uint64_t)&tx_descs[0] >> 32));
    e1000_write(REG_TDLEN, E1000_NUM_TX_DESC * sizeof(struct e1000_tx_desc));
    e1000_write(REG_TDH, 0);
    e1000_write(REG_TDT, 0);

    /* Enable TX */
    e1000_write(REG_TCTL, 0x00000002 | (1 << 3));

    /* 4. Unmask Link Status & RX Interrupts */
    e1000_write(REG_IMS, 0x04 | 0x80);

    return 0;
}

/*
 * e1000_send_packet - Transmit an Ethernet frame via DMA
 */
int e1000_send_packet(const uint8_t *packet, uint16_t length) {
    if (length > E1000_BUFFER_SIZE) return -1;

    /* Copy payload into current TX buffer */
    uint8_t *dst = &tx_buffers[tx_cur][0];
    for (uint16_t i = 0; i < length; ++i) dst[i] = packet[i];

    tx_descs[tx_cur].length = length;
    tx_descs[tx_cur].cmd = (1 << 0) | (1 << 3); /* EOP (End of Packet) | RS (Report Status) */
    tx_descs[tx_cur].status = 0;

    uint16_t old_cur = tx_cur;
    tx_cur = (tx_cur + 1) % E1000_NUM_TX_DESC;
    e1000_write(REG_TDT, tx_cur);

    /* Wait for hardware transmit completion */
    while (!(tx_descs[old_cur].status & 0x01));

    return 0;
}

/*
 * e1000_receive_packet - Receive incoming Ethernet frame from RX ring
 */
int e1000_receive_packet(uint8_t *buffer, uint16_t max_len) {
    if (!(rx_descs[rx_cur].status & 0x01)) {
        return 0; /* No packet available */
    }

    uint16_t len = rx_descs[rx_cur].length;
    if (len > max_len) len = max_len;

    for (uint16_t i = 0; i < len; ++i) {
        buffer[i] = rx_buffers[rx_cur][i];
    }

    rx_descs[rx_cur].status = 0;
    uint16_t old_cur = rx_cur;
    rx_cur = (rx_cur + 1) % E1000_NUM_RX_DESC;
    e1000_write(REG_RDT, old_cur);

    return (int)len;
}
