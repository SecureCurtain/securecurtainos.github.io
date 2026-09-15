/* SecureCurtain OS - 64-bit Global Descriptor Table & TSS Integration
 * Author: Jared Busby (jb7572)
 * Architecture: x86_64 Long Mode
 */

#include "gdt.h"
#include "kernel.h"

// 7 Entries: 0=Null, 1=Kernel CS, 2=Kernel DS, 3=User DS, 4=User CS, 5+6=TSS (16 bytes)
static uint64_t gdt_entries[7] __attribute__((aligned(16)));
static struct gdt_ptr gdt_descriptor;

extern void *tss_get_address(void);
extern size_t tss_get_size(void);

void gdt_init(void) {
    serial_puts("[GDT] Constructing 64-bit Global Descriptor Table (Ring 0 / Ring 3)...\n");

    // 0: Null Descriptor
    gdt_entries[0] = 0;

    // 1 (0x08): 64-bit Kernel Code Segment (Ring 0)
    // Present (1), Ring 0 (00), System (1), Executable (1), Readable (1), Long Mode (1), Granularity (1)
    gdt_entries[1] = 0x00AF9A000000FFFFULL;

    // 2 (0x10): 64-bit Kernel Data Segment (Ring 0)
    // Present (1), Ring 0 (00), System (1), Writable (1), Granularity (1)
    gdt_entries[2] = 0x00CF92000000FFFFULL;

    // 3 (0x18): 64-bit User Data Segment (Ring 3, Selector 0x1B)
    // Present (1), Ring 3 (11), System (1), Writable (1), Granularity (1)
    gdt_entries[3] = 0x00CFF2000000FFFFULL;

    // 4 (0x20): 64-bit User Code Segment (Ring 3, Selector 0x23)
    // Present (1), Ring 3 (11), System (1), Executable (1), Readable (1), Long Mode (1), Granularity (1)
    gdt_entries[4] = 0x00AFFA000000FFFFULL;

    // 5 & 6 (0x28): 64-bit TSS Descriptor (16 bytes)
    uintptr_t tss_addr = (uintptr_t)tss_get_address();
    uint32_t tss_limit = (uint32_t)(tss_get_size() - 1);

    uint64_t tss_low = (tss_limit & 0xFFFFULL)
                     | ((tss_addr & 0x00FFFFFFULL) << 16)
                     | (0x89ULL << 40) // Present, Ring 0, Type 0x9 (64-bit Available TSS)
                     | (((tss_limit >> 16) & 0x0FULL) << 48)
                     | (((tss_addr >> 24) & 0xFFULL) << 56);

    uint64_t tss_high = (tss_addr >> 32) & 0xFFFFFFFFULL;

    gdt_entries[5] = tss_low;
    gdt_entries[6] = tss_high;

    // Prepare GDTR
    gdt_descriptor.limit = sizeof(gdt_entries) - 1;
    gdt_descriptor.base = (uint64_t)&gdt_entries[0];

    // Load GDT
    __asm__ volatile (
        "lgdt %0\n\t"
        // Reload segment registers
        "mov $0x10, %%ax\n\t"
        "mov %%ax, %%ds\n\t"
        "mov %%ax, %%es\n\t"
        "mov %%ax, %%fs\n\t"
        "mov %%ax, %%gs\n\t"
        "mov %%ax, %%ss\n\t"
        : : "m"(gdt_descriptor) : "rax", "memory"
    );

    // Load Task Register (TR)
    __asm__ volatile (
        "mov $0x28, %%ax\n\t"
        "ltr %%ax\n\t"
        : : : "rax", "memory"
    );

    serial_puts("[GDT] 64-bit GDT & TSS (0x28) reloaded with Ring 3 User Segments active.\n");
}
