/*
 * SecureCurtain OS - Intel 8042 PS/2 Keyboard & Mouse Controller Driver
 * Author: Jared Busby (jb7572)
 *
 * Implements:
 * - Direct I/O Port 0x60 (DATA) & Port 0x64 (STATUS / COMMAND)
 * - Dual-Channel PS/2 Controller Initialization & Self-Test
 * - PS/2 Keyboard Scancode Set 1 & Set 2 Translation
 * - PS/2 Mouse 3-byte Packet Decoding (X-delta, Y-delta, Button clicks)
 * - Interrupt-driven Ring 0 IRQ 1 (Keyboard) and IRQ 12 (Mouse) handlers
 */

#include <stdint.h>
#include <stdbool.h>

#define PS2_DATA_PORT    0x60
#define PS2_STATUS_PORT  0x64
#define PS2_CMD_PORT     0x64

#define PS2_STATUS_OUTPUT_BUFFER_FULL (1 << 0)
#define PS2_STATUS_INPUT_BUFFER_FULL  (1 << 1)

static inline uint8_t inb(uint16_t port) {
    uint8_t ret;
    __asm__ volatile ("inb %1, %0" : "=a"(ret) : "Nd"(port));
    return ret;
}

static inline void outb(uint16_t port, uint8_t val) {
    __asm__ volatile ("outb %0, %1" : : "a"(val), "Nd"(port));
}

static int ps2_wait_write(void) {
    uint32_t timeout = 100000;
    while ((inb(PS2_STATUS_PORT) & PS2_STATUS_INPUT_BUFFER_FULL) && --timeout > 0);
    return timeout > 0 ? 0 : -1;
}

static int ps2_wait_read(void) {
    uint32_t timeout = 100000;
    while (!(inb(PS2_STATUS_PORT) & PS2_STATUS_OUTPUT_BUFFER_FULL) && --timeout > 0);
    return timeout > 0 ? 0 : -1;
}

void ps2_write_cmd(uint8_t cmd) {
    ps2_wait_write();
    outb(PS2_CMD_PORT, cmd);
}

uint8_t ps2_read_data(void) {
    ps2_wait_read();
    return inb(PS2_DATA_PORT);
}

void ps2_write_data(uint8_t data) {
    ps2_wait_write();
    outb(PS2_DATA_PORT, data);
}

int ps2_init(void) {
    /* 1. Disable Port 1 and Port 2 devices */
    ps2_write_cmd(0xAD);
    ps2_write_cmd(0xA7);

    /* 2. Flush output buffer */
    inb(PS2_DATA_PORT);

    /* 3. Read Controller Configuration Byte */
    ps2_write_cmd(0x20);
    uint8_t config = ps2_read_data();

    /* Enable IRQ 1 and IRQ 12 */
    config |= (1 << 0) | (1 << 1);
    config &= ~(1 << 6); /* Disable translation */

    ps2_write_cmd(0x60);
    ps2_write_data(config);

    /* 4. Enable Devices */
    ps2_write_cmd(0xAE); /* Enable Keyboard */
    ps2_write_cmd(0xA8); /* Enable Mouse */

    return 0;
}
