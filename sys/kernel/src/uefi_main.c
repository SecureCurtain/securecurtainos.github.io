#include <stdint.h>
#include <stddef.h>
#include "scheduler.h"
#include "gdt_idt.h"

extern void init_gdt(void);
extern void init_idt(void);
extern void init_scheduler(void);
extern void init_hardware_interrupts(void);
extern void kernel_init_complete(void);

/**
 * UEFI Main Boot Entry Point for 64-bit Long Mode Microkernel.
 */
int efi_main(void* image_handle, void* system_table) {
    (void)image_handle;
    (void)system_table;

    // 1. Initialize core Ring 0 descriptors and security gates
    init_gdt();
    init_idt();
    init_scheduler();
    init_hardware_interrupts();

    // 2. Transition into Ring 3 execution context
    kernel_init_complete();

    return 0;
}
