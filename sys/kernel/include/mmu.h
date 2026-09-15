#pragma once
#include <stdint.h>

// Page Table Entry Flag Attributes (x86_64 architecture specs)
#define MMU_PRESENT    (1ULL << 0)  // Page is loaded in RAM
#define MMU_WRITABLE   (1ULL << 1)  // Page can be written to (otherwise Read-Only)
#define MMU_USER       (1ULL << 2)  // User Space Accessible (if 0, Supervisor Ring 0 Only)
#define MMU_NO_EXECUTE (1ULL << 63) // Disallows code execution (NX bit to block stack attacks)

// Memory Page Alignment Boundaries
#define PAGE_SIZE_4KB  4096
#define PAGE_MASK_4KB  (~0xFFFULL)

// A single 64-bit page table entry container type
typedef uint64_t pt_entry_t;

void kernel_mmu_map_page(pt_entry_t* pml4_root_virt, uint64_t virt_addr, uint64_t phys_addr, uint64_t mmu_flags);
pt_entry_t* kernel_mmu_create_process_context(void);
void kernel_mmu_switch_context(pt_entry_t* target_pml4_phys_addr);