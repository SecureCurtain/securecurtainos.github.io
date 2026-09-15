/* SecureCurtain OS - Task State Segment (TSS) & Stack Switching
 * Author: Jared Busby (jb7572)
 * Target: x86_64 Long Mode
 */

#include "kernel.h"

struct tss_entry {
    uint32_t reserved0;
    uint64_t rsp0;       // Ring 0 Stack Pointer
    uint64_t rsp1;
    uint64_t rsp2;
    uint64_t reserved1;
    uint64_t ist1;       // IST 1: Double Fault Stack
    uint64_t ist2;       // IST 2: NMI Stack
    uint64_t ist3;
    uint64_t ist4;
    uint64_t ist5;
    uint64_t ist6;
    uint64_t ist7;
    uint64_t reserved2;
    uint16_t reserved3;
    uint16_t iomap_base;
} __attribute__((packed));

static struct tss_entry kernel_tss;
static uint8_t double_fault_stack[8192];
static uint8_t nmi_stack[8192];

void tss_init(uint64_t kernel_stack_top) {
    serial_puts("[TSS] Configuring Task State Segment (TSS) & IST Stacks...\n");

    for (size_t i = 0; i < sizeof(kernel_tss); i++) {
        ((uint8_t *)&kernel_tss)[i] = 0;
    }

    kernel_tss.rsp0 = kernel_stack_top;
    kernel_tss.ist1 = (uint64_t)&double_fault_stack[8192]; // Top of Double Fault Stack
    kernel_tss.ist2 = (uint64_t)&nmi_stack[8192];          // Top of NMI Stack
    kernel_tss.iomap_base = sizeof(kernel_tss);

    serial_puts("[TSS] IST1 (Double Fault) and IST2 (NMI) memory stacks armed.\n");
}

void *tss_get_address(void) {
    return &kernel_tss;
}

size_t tss_get_size(void) {
    return sizeof(kernel_tss);
}

void tss_set_rsp0(uint64_t rsp0) {
    kernel_tss.rsp0 = rsp0;
}
