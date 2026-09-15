#include <stddef.h>
#include <string.h>
#include "mmu.h"

// Reference external routines from your basic kernel physical memory manager
extern void* native_pmm_allocate_zeroed_page(void);

/**
 * Traverses and creates entries across the 4-level MMU tree to map a virtual page to physical RAM.
 * 
 * @param pml4_root_virt  Pointer to the active process's top-level PML4 table in virtual memory.
 * @param virt_addr       The destination virtual address being exposed to the software thread.
 * @param phys_addr       The raw target hardware RAM stick physical address.
 * @param mmu_flags       Permissions mask combination (e.g., MMU_PRESENT | MMU_USER | MMU_WRITABLE)
 */
void kernel_mmu_map_page(pt_entry_t* pml4_root_virt, uint64_t virt_addr, uint64_t phys_addr, uint64_t mmu_flags) {
    // 1. Calculate the 9-bit lookup index pointers for each of the 4 table levels
    uint32_t pml4_idx = (virt_addr >> 39) & 0x1FF;
    uint32_t pdpt_idx = (virt_addr >> 30) & 0x1FF;
    uint32_t pd_idx   = (virt_addr >> 21) & 0x1FF;
    uint32_t pt_idx   = (virt_addr >> 12) & 0x1FF;

    // --- LEVEL 4: PML4 Navigation ---
    pt_entry_t* pdpt_table = NULL;
    if (!(pml4_root_virt[pml4_idx] & MMU_PRESENT)) {
        // Table doesn't exist, instantiate a new physical page frame for the child branch
        pdpt_table = (pt_entry_t*)native_pmm_allocate_zeroed_page();
        pml4_root_virt[pml4_idx] = ((uint64_t)pdpt_table) | MMU_PRESENT | MMU_WRITABLE | MMU_USER;
    } else {
        pdpt_table = (pt_entry_t*)(pml4_root_virt[pml4_idx] & PAGE_MASK_4KB);
    }

    // --- LEVEL 3: Page Directory Pointer Table Navigation ---
    pt_entry_t* pd_table = NULL;
    if (!(pdpt_table[pdpt_idx] & MMU_PRESENT)) {
        pd_table = (pt_entry_t*)native_pmm_allocate_zeroed_page();
        pdpt_table[pdpt_idx] = ((uint64_t)pd_table) | MMU_PRESENT | MMU_WRITABLE | MMU_USER;
    } else {
        pd_table = (pt_entry_t*)(pdpt_table[pdpt_idx] & PAGE_MASK_4KB);
    }

    // --- LEVEL 2: Page Directory Table Navigation ---
    pt_entry_t* pt_table = NULL;
    if (!(pd_table[pd_idx] & MMU_PRESENT)) {
        pt_table = (pt_entry_t*)native_pmm_allocate_zeroed_page();
        pd_table[pd_idx] = ((uint64_t)pt_table) | MMU_PRESENT | MMU_WRITABLE | MMU_USER;
    } else {
        pt_table = (pt_entry_t*)(pd_table[pd_idx] & PAGE_MASK_4KB);
    }

    // --- LEVEL 1: Literal Page Table Definition ---
    // Enforce final absolute hardware target constraints and access bit properties
    pt_table[pt_idx] = (phys_addr & PAGE_MASK_4KB) | mmu_flags;

    // 2. CPU INvalidation: Flush the processor's localized Translation Lookaside Buffer (TLB) cache
    // forces the memory unit to re-read the updated page table structure on the next cycle memory access
    __asm__ __volatile__("invlpg (%0)" :: "r"(virt_addr) : "memory");
}

/**
 * Factory routine constructing a brand-new page table system environment layout for a sandboxed process.
 * 
 * @return The base physical memory address pointing to the newly generated PML4 structure root context block.
 */
pt_entry_t* kernel_mmu_create_process_context(void) {
    // 1. Allocate a pristine physical memory page frame to act as the PML4 tracking layer root node
    pt_entry_t* process_pml4_virt = (pt_entry_t*)native_pmm_allocate_zeroed_page();
    
    // Fetch the system's global Master Boot Page Table pointer setup inside main.c
    extern pt_entry_t* kernel_boot_pml4_global;

    // 2. GLOBAL LINKING: Copy the upper half entries (Index 256 to 511) straight from the kernel root page table
    // This allows the microkernel code to be accessible from any thread without tearing down active page structures.
    if (kernel_boot_pml4_global) {
        for (int i = 256; i < 512; i++) {
            process_pml4_virt[i] = kernel_boot_pml4_global[i];
        }
    }

    // 3. SECURE WORKSPACE PROVISIONING: Setup a safe, user-accessible address stack for user execution mapping space
    // Let's provision a baseline 4KB virtual stack arena at address pointer coordinate 0x0000_7FFF_FFFF_F000
    uint64_t user_stack_virtual = 0x00007FFFFFFFF000ULL;
    void*    user_stack_physical = native_pmm_allocate_zeroed_page();

    // Map the stack space with user privileges enabled (MMU_USER)
    kernel_mmu_map_page(
        process_pml4_virt, 
        user_stack_virtual, 
        (uint64_t)user_stack_physical, 
        MMU_PRESENT | MMU_WRITABLE | MMU_USER | MMU_NO_EXECUTE
    );

    // Return the virtual address pointer back to your scheduler task manager framework
    return process_pml4_virt;
}

/**
 * Context Switcher. Invoked by your scheduling loop to cycle active hardware process environments.
 */
void kernel_mmu_switch_context(pt_entry_t* target_pml4_phys_addr) {
    // Write the raw physical page pointer value into the CPU's internal Control Register 3 (CR3)
    // The physical hardware immediately applies the memory table constraints instantly!
    __asm__ __volatile__("mov %0, %%cr3" :: "r"(target_pml4_phys_addr) : "memory");
}
