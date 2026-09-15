/* SecureCurtain OS - 64-bit Interrupt Descriptor Table (IDT) & Exception Handling
 * Author: Jared Busby (jb7572)
 * Architecture: x86_64 Freestanding
 */

#include "idt.h"
#include "kernel.h"
#include "vmm.h"

static struct idt_entry idt[IDT_MAX_ENTRIES];
static struct idtr idt_descriptor;
static irq_handler_t irq_routines[IDT_MAX_ENTRIES];

static void default_exception_handler(uint8_t vec, uint64_t error_code) {
    serial_puts("\n[!] CPU EXCEPTION ENCOUNTERED: Vector ");
    serial_putc('0' + (vec / 10));
    serial_putc('0' + (vec % 10));
    serial_puts(" | Error Code: ");
    
    if (vec == 14) {
        page_fault_handler(0, error_code);
        return;
    }

    switch (vec) {
        case 0:  serial_puts("Division by Zero (#DE)\n"); break;
        case 1:  serial_puts("Debug Exception (#DB)\n"); break;
        case 2:  serial_puts("Non-Maskable Interrupt (#NMI)\n"); break;
        case 3:  serial_puts("Breakpoint (#BP)\n"); break;
        case 6:  serial_puts("Invalid Opcode (#UD)\n"); break;
        case 8:  serial_puts("Double Fault (#DF)\n"); break;
        case 13: serial_puts("General Protection Fault (#GP)\n"); break;
        default: serial_puts("Hardware Fault\n"); break;
    }

    kernel_panic("Fatal CPU Exception");
}

void idt_set_gate(uint8_t vector, void *isr, uint8_t attributes, uint8_t ist) {
    uint64_t addr = (uint64_t)isr;
    idt[vector].isr_low = (uint16_t)(addr & 0xFFFF);
    idt[vector].kernel_cs = 0x08; // Kernel Code Segment Selector
    idt[vector].ist = ist;
    idt[vector].attributes = attributes;
    idt[vector].isr_mid = (uint16_t)((addr >> 16) & 0xFFFF);
    idt[vector].isr_high = (uint32_t)((addr >> 32) & 0xFFFFFFFF);
    idt[vector].reserved = 0;
}

void idt_register_handler(uint8_t vector, irq_handler_t handler) {
    irq_routines[vector] = handler;
}

extern void apic_send_eoi(void);

/* Master Interrupt Dispatcher */
void isr_dispatcher(uint8_t vector, uint64_t error_code, void *frame) {
    if (vector < 32) {
        default_exception_handler(vector, error_code);
    } else if (irq_routines[vector] != NULL) {
        irq_routines[vector](frame);
    }

    // Send EOI to PIC/APIC if IRQ 32-47
    if (vector >= 32 && vector <= 47) {
        if (vector >= 40) {
            outb(0xA0, 0x20); // Slave PIC EOI
        }
        outb(0x20, 0x20);     // Master PIC EOI
        apic_send_eoi();
    }
}

/* Remap legacy 8259 PIC to IRQ 32-47 */
static void pic_remap(void) {
    outb(0x20, 0x11); io_wait();
    outb(0xA0, 0x11); io_wait();
    outb(0x21, 0x20); io_wait(); // Master PIC offset = 32
    outb(0xA1, 0x28); io_wait(); // Slave PIC offset = 40
    outb(0x21, 0x04); io_wait();
    outb(0xA1, 0x02); io_wait();
    outb(0x21, 0x01); io_wait();
    outb(0xA1, 0x01); io_wait();
    outb(0x21, 0x00); io_wait(); // Unmask master
    outb(0xA1, 0x00); io_wait(); // Unmask slave
}

extern void *isr_stub_table[256];

void idt_init(void) {
    serial_puts("[IDT] Configuring 256 Interrupt Descriptor Gates & PIC...\n");

    for (int i = 0; i < IDT_MAX_ENTRIES; i++) {
        irq_routines[i] = NULL;
        idt_set_gate(i, isr_stub_table[i], 0x8E, 0); // Present, Ring 0, 64-bit Interrupt Gate
    }

    pic_remap();

    idt_descriptor.limit = sizeof(idt) - 1;
    idt_descriptor.base = (uint64_t)&idt;

    __asm__ volatile ("lidt %0" : : "m"(idt_descriptor));
    serial_puts("[IDT] IDTR loaded. 256 Interrupt Gates Active.\n");
}
