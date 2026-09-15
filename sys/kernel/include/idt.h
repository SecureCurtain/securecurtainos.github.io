/* SecureCurtain OS - 64-bit Interrupt Descriptor Table (IDT) & ISR Header
 * Author: Jared Busby (jb7572)
 */

#ifndef _SECURECURTAIN_IDT_H
#define _SECURECURTAIN_IDT_H

#include <stdint.h>

#define IDT_MAX_ENTRIES 256

/* 64-bit IDT Entry Gate */
struct idt_entry {
    uint16_t isr_low;      // Lower 16 bits of ISR address
    uint16_t kernel_cs;    // Kernel Code Segment Selector (0x08)
    uint8_t  ist;          // Interrupt Stack Table offset (0 for none, 1-7 for IST)
    uint8_t  attributes;   // Type and attributes (Gate Type, DPL, Present)
    uint16_t isr_mid;      // Middle 16 bits of ISR address
    uint32_t isr_high;     // Higher 32 bits of ISR address
    uint32_t reserved;     // Reserved (must be zero)
} __attribute__((packed));

/* IDTR Register Structure */
struct idtr {
    uint16_t limit;
    uint64_t base;
} __attribute__((packed));

/* CPU Interrupt Stack Frame */
struct interrupt_frame {
    uint64_t rip;
    uint64_t cs;
    uint64_t rflags;
    uint64_t rsp;
    uint64_t ss;
};

/* Initializes IDT with 256 gates and exception stubs */
void idt_init(void);

/* Registers a custom interrupt handler callback */
typedef void (*irq_handler_t)(void *frame);
void idt_register_handler(uint8_t vector, irq_handler_t handler);

#endif /* _SECURECURTAIN_IDT_H */
