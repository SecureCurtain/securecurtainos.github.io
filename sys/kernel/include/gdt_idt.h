#pragma once
#include <stdint.h>

// --- 🛡️ HARDWARE ENFORCED IDT GATE ATTRIBUTES ---
// 0x8E = 10001110b -> Present, Ring 0 Only, 64-bit Interrupt Gate
#define IDT_GATE_KERNEL  0x8E  

// 0xEE = 11101110b -> Present, Ring 3 User-space accessible, 64-bit Interrupt Gate
// (Only used for explicit user-facing breakpoints like software int 3)
#define IDT_GATE_USER    0xEE  

// --- GDT Structures ---
typedef struct {
    uint16_t limit_low;
    uint16_t base_low;
    uint8_t  base_middle;
    uint8_t  access;
    uint8_t  granularity;
    uint8_t  base_high;
} __attribute__((packed)) gdt_entry_t;

// x86_64 requires a special, wider 16-byte GDT entry specifically for the TSS
typedef struct {
    gdt_entry_t low;
    uint32_t    base_highest;
    uint32_t    reserved;
} __attribute__((packed)) gdt_tss_entry_t;

typedef struct {
    uint16_t limit;
    uint64_t base;
} __attribute__((packed)) gdt_ptr_t;

// --- 🛡️ MANDATORY TASK STATE SEGMENT (TSS) FOR x86_64 ---
typedef struct {
    uint32_t reserved0;
    uint64_t rsp0;      // 🛡️ The secure kernel stack used when transitioning from Ring 3 -> Ring 0
    uint64_t rsp1;
    uint64_t rsp2;
    uint64_t reserved1;
    uint64_t ist[7];    // 🛡️ Interrupt Stack Table: 7 completely isolated alternative hardware stacks
    uint64_t reserved2;
    uint16_t reserved3;
    uint16_t iomap_base;
} __attribute__((packed)) tss_t;

// --- IDT Structures ---
typedef struct {
    uint16_t offset_1;   // offset bits 0..15
    uint16_t selector;   // a code segment selector in GDT
    uint8_t  ist;        // 🛡️ IST Offset (1..7) to assign this interrupt a dedicated safe stack
    uint8_t  type_attributes; 
    uint16_t offset_2;   // offset bits 16..31
    uint32_t offset_3;   // offset bits 32..63
    uint32_t zero;       // reserved, must be 0
} __attribute__((packed)) idt_entry_t;

typedef struct {
    uint16_t limit;
    uint64_t base;
} __attribute__((packed)) idt_ptr_t;

// --- Initialization Functions ---
void init_gdt(void);
void init_idt(void);

/**
 * Configures an IDT route entry securely.
 * @param num The interrupt vector index (0..255).
 * @param base The function memory pointer to your C/Assembly exception handler stub.
 * @param sel The targeted kernel code segment selector.
 * @param flags The security restriction attributes (e.g., IDT_GATE_KERNEL).
 * @param ist_index Hardware stack selection offset (0 = default stack, 1 = safe panic stack).
 */
void set_idt_gate(int num, uint64_t base, uint16_t sel, uint8_t flags, uint8_t ist_index);

// Assembly hooks to push structural changes to the CPU
extern void flush_gdt(uint64_t gdt_ptr_address);
extern void load_idt(uint64_t idt_ptr_address);
extern void load_tss(uint16_t tss_selector); // Loaded via 'ltr' instruction in assembly