/* SecureCurtain OS - Advanced Programmable Interrupt Controller (APIC)
 * Author: Jared Busby (jb7572)
 * Architecture: x86_64 Freestanding
 */

#include "kernel.h"
#include "vmm.h"

#define IA32_APIC_BASE_MSR 0x1B
#define LAPIC_DEFAULT_BASE 0xFEE00000ULL

#define LAPIC_REG_ID          0x020
#define LAPIC_REG_VERSION     0x030
#define LAPIC_REG_TPR         0x080
#define LAPIC_REG_EOI         0x0B0
#define LAPIC_REG_SVR         0x0F0
#define LAPIC_REG_ESR         0x280
#define LAPIC_REG_ICR_LOW     0x300
#define LAPIC_REG_ICR_HIGH    0x310
#define LAPIC_REG_TIMER_LVT   0x320
#define LAPIC_REG_TIMER_INIT  0x380
#define LAPIC_REG_TIMER_CURR  0x390
#define LAPIC_REG_TIMER_DIV   0x3E0

static uintptr_t lapic_base_virt = 0;

static inline uint32_t lapic_read(uint32_t reg) {
    return *(volatile uint32_t *)(lapic_base_virt + reg);
}

static inline void lapic_write(uint32_t reg, uint32_t val) {
    *(volatile uint32_t *)(lapic_base_virt + reg) = val;
}

void apic_send_eoi(void) {
    if (lapic_base_virt) {
        lapic_write(LAPIC_REG_EOI, 0);
    }
}

void apic_init(void) {
    serial_puts("[APIC] Initializing Local APIC (LAPIC)...\n");

    // Read LAPIC Physical Base from MSR
    uint32_t edx, eax;
    __asm__ volatile ("rdmsr" : "=a"(eax), "=d"(edx) : "c"(IA32_APIC_BASE_MSR));
    uintptr_t lapic_phys = ((uint64_t)edx << 32) | (eax & ~0xFFFULL);
    if (!lapic_phys) lapic_phys = LAPIC_DEFAULT_BASE;

    // Map LAPIC MMIO space in VMM
    lapic_base_virt = KERNEL_VIRTUAL_BASE + lapic_phys;
    vmm_map_page(lapic_base_virt, lapic_phys, VMM_PAGE_PRESENT | VMM_PAGE_WRITABLE | VMM_PAGE_NOCACHE);

    // Enable LAPIC via Spurious Interrupt Vector Register (Vector 0xFF + Enable Bit 8)
    lapic_write(LAPIC_REG_SVR, 0x1FF);

    // Clear Task Priority Register to accept all interrupts
    lapic_write(LAPIC_REG_TPR, 0);

    // Configure LAPIC Periodic Timer (Vector 32, Divide by 16)
    lapic_write(LAPIC_REG_TIMER_DIV, 0x03); // Divisor 16
    lapic_write(LAPIC_REG_TIMER_LVT, 32 | 0x20000); // Vector 32, Periodic Mode
    lapic_write(LAPIC_REG_TIMER_INIT, 10000000);    // ~100Hz Tick rate

    serial_puts("[APIC] LAPIC enabled with 100Hz periodic hardware timer.\n");
}

/* Precise timer delay function for hardware initialization */
void pit_wait_ms(uint32_t ms) {
    for (uint32_t i = 0; i < ms; i++) {
        // Channel 0 mode 0, 1ms count = 1193 ticks (1.193182 MHz)
        outb(0x43, 0x30); // channel 0, lobyte/hibyte, mode 0 (interrupt on terminal count)
        outb(0x40, 0xA9); // low byte of 1193 (0x04A9)
        outb(0x40, 0x04); // high byte of 1193
        // Poll status until count completed
        while (1) {
            outb(0x43, 0xE2); // Read-back command for counter 0 status
            uint8_t status = inb(0x40);
            if (status & 0x80) { // Output pin high = timer expired
                break;
            }
        }
    }
}
