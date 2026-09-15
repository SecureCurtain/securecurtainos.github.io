#include "gdt_idt.h"

// 🛡️ SECURITY FIXED: Expand GDT table allocation space to fit the 16-byte wider TSS entry
// Index 0: Null, 1: K-Code, 2: K-Data, 3: U-Data, 4: U-Code, 5-6: TSS (takes two slots)
#define GDT_TOTAL_ENTRIES 7
uint64_t gdt[GDT_TOTAL_ENTRIES]; 
gdt_ptr_t gp;

idt_entry_t idt[256];
idt_ptr_t   ip;

// Securely allocate a dedicated, isolated physical stack for Double Faults and Kernel transitions
static uint8_t g_emergency_stack_ist1[4096] __attribute__((aligned(16)));
static uint8_t g_kernel_privilege_stack[4096] __attribute__((aligned(16)));

// Allocate instance of our Task State Segment structure
static tss_t g_tss;

extern void print_string(const char* str, int row);
extern void page_fault_asm_stub(void); // Secure assembly wrapper (handles the CPU error code)
extern void irq1_keyboard_stub(void);
extern void irq12_mouse_stub(void);

// Refactored helper to safely manipulate 64-bit descriptor entry configurations
void set_gdt_gate(int num, uint32_t access, uint32_t gran) {
    uint64_t entry = 0;
    
    // Encode access byte and limit granularity properties into standard x86 formats
    entry |= ((uint64_t)(access & 0xFF) << 40);
    entry |= ((uint64_t)(gran & 0xFF) << 48);
    
    gdt[num] = entry;
}

void init_gdt(void) {
    // Calculate precise limits for the dynamic descriptor structures
    gp.limit = (sizeof(uint64_t) * GDT_TOTAL_ENTRIES) - 1;
    gp.base  = (uint64_t)&gdt;

    // --------------------------------------------------------------------------
    // 🛡️ HARDWARE ENFORCED GDT SELECTOR ORDERING FOR SYSRETQ
    // --------------------------------------------------------------------------
    set_gdt_gate(0, 0, 0);                 // 0x00: Null Descriptor
    set_gdt_gate(1, 0x9A, 0x20);           // 0x08: Kernel Code (Ring 0)
    set_gdt_gate(2, 0x92, 0x00);           // 0x10: Kernel Data (Ring 0)
    set_gdt_gate(3, 0xF2, 0x00);           // 0x18: User Data   (Ring 3 - Must precede User Code!)
    set_gdt_gate(4, 0xFA, 0x20);           // 0x20: User Code   (Ring 3)

    // --------------------------------------------------------------------------
    // 🛡️ CONFIGURING THE HARDWARE TASK STATE SEGMENT (TSS)
    // --------------------------------------------------------------------------
    // Establish a verified stack for standard Ring 3 -> Ring 0 kernel privilege transitions
    g_tss.rsp0 = (uint64_t)&g_kernel_privilege_stack[4096];
    
    // Assign our emergency alternative stack to Interrupt Stack Table index 1
    g_tss.ist[0] = (uint64_t)&g_emergency_stack_ist1[4096];
    g_tss.iomap_base = sizeof(tss_t); // Prevent application I/O blocking bypasses

    uint64_t tss_base = (uint64_t)&g_tss;
    uint32_t tss_limit = sizeof(tss_t) - 1;

    // A TSS entry in 64-bit mode spans 16 bytes across two slots in the GDT array
    gdt[5] = (tss_limit & 0xFFFF) |
             ((tss_base & 0xFFFF) << 16) |
             (((tss_base >> 16) & 0xFF) << 32) |
             ((uint64_t)0x89 << 40) |          // Present, Type 0x9 (Available 64-bit TSS)
             (((tss_limit >> 16) & 0xF) << 48) |
             (((tss_base >> 24) & 0xFF) << 56);
             
    gdt[6] = (tss_base >> 32) & 0xFFFFFFFF;    // Highest 32 bits of our 64-bit pointer address

    flush_gdt((uint64_t)&gp);
    load_tss(0x28); // 0x28 is the GDT byte offset selector targeting slot index 5 (5 * 8 = 40 = 0x28)

    print_string("[OK] GDT Secure Ring Segmentation & TSS Hardware Stacks Active.", 11);
}

void set_idt_gate(int num, uint64_t base, uint16_t sel, uint8_t flags, uint8_t ist_index) {
    idt[num].offset_1        = base & 0xFFFF;
    idt[num].selector        = sel;
    idt[num].ist             = ist_index & 0x7; // Track targeted stack index (0=default, 1=IST emergency)
    idt[num].type_attributes = flags;
    idt[num].offset_2        = (base >> 16) & 0xFFFF;
    idt[num].offset_3        = (base >> 32) & 0xFFFFFFFF;
    idt[num].zero            = 0;
}

void init_idt(void) {
    ip.limit = (sizeof(idt_entry_t) * 256) - 1;
    ip.base  = (uint64_t)&idt;

    for(int i = 0; i < 256; i++) {
        set_idt_gate(i, 0, 0, 0, 0);
    }

    // 🛡️ SECURITY FIXED: Map the IDT gate to the assembly stub, NOT directly to the C handler.
    // We also set the IST index parameter to '1' to enforce an isolated emergency stack execution environment.
    set_idt_gate(14, (uint64_t)page_fault_asm_stub, 0x08, 0x8E, 1);

    // Map Keyboard (IRQ 1 -> standard x86 master PIC offset maps this to Vector 33)
    set_idt_gate(33, (uint64_t)irq1_keyboard_stub, 0x08, 0x8E, 1);

    // Map Mouse (IRQ 12 -> standard x86 slave PIC offset maps this to Vector 44)
    set_idt_gate(44, (uint64_t)irq12_mouse_stub, 0x08, 0x8E, 1);

    load_idt((uint64_t)&ip);
    print_string("[OK] IDT System Interception Tables Armed.", 12);
}

// Target C handler executed securely AFTER the assembly stub neutralizes the stack error code
void core_page_fault_handler_c(uint64_t error_code, uint64_t faulting_address) {
    print_string("[SECURITY EXCEPTION] Memory Access Violation Encountered!", 13);
    
    // In your final implementation, look up the active PID, isolate it, and schedule a clean kill.
    while(1) { __asm__ __volatile__("hlt"); }
}
