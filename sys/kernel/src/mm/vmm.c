/* SecureCurtain OS - 4-Level PML4 Virtual Memory Manager (VMM)
 * Author: Jared Busby (jb7572)
 * Architecture: x86_64 Long Mode (48-bit Canonical Addressing)
 */

#include "vmm.h"
#include "pmm.h"
#include "kernel.h"

#define PAGE_TABLE_ENTRIES 512
#define PAGE_FRAME_MASK    0x000FFFFFFFFFF000ULL
#define PML4_INDEX(addr) (((addr) >> 39) & 0x1FF)
#define PDPT_INDEX(addr) (((addr) >> 30) & 0x1FF)
#define PD_INDEX(addr)   (((addr) >> 21) & 0x1FF)
#define PT_INDEX(addr)   (((addr) >> 12) & 0x1FF)

static uint64_t *kernel_pml4 = NULL;

static inline uint64_t read_cr2(void) {
    uint64_t cr2;
    __asm__ volatile ("mov %%cr2, %0" : "=r"(cr2));
    return cr2;
}

static inline uint64_t read_cr3(void) {
    uint64_t cr3;
    __asm__ volatile ("mov %%cr3, %0" : "=r"(cr3));
    return cr3;
}

static inline void write_cr3(uint64_t cr3) {
    __asm__ volatile ("mov %0, %%cr3" : : "r"(cr3) : "memory");
}

void vmm_init(void) {
    kprintf("[VMM] Initializing 4-Level Paging Subsystem...\n");

    // Allocate kernel PML4 root table
    uintptr_t pml4_phys = pmm_alloc_frame();
    if (!pml4_phys) {
        kernel_panic("VMM: Out of memory allocating kernel PML4!");
    }
    kernel_pml4 = (uint64_t *)(KERNEL_VIRTUAL_BASE + pml4_phys);

    for (size_t i = 0; i < PAGE_TABLE_ENTRIES; i++) {
        kernel_pml4[i] = 0;
    }

    // 1. Identity-map lower 16MB for BIOS/hardware compatibility (IVT, BDA, VGA buffer)
    for (uintptr_t addr = 0; addr < (16 * 1024 * 1024); addr += PAGE_SIZE) {
        vmm_map_page(addr, addr, VMM_PAGE_PRESENT | VMM_PAGE_WRITABLE);
    }

    // 2. Establish higher-half direct physical mapping window starting at KERNEL_VIRTUAL_BASE (0xFFFFFFFF80000000)
    // Map physical RAM up to 2GB (maximum addressable space in the 2GB higher-half window)
    uint64_t max_phys = pmm_get_max_address();
    uint64_t map_limit = (2ULL * 1024 * 1024 * 1024); // 2 GB Maximum Higher-Half Window
    if (max_phys > 0 && max_phys < map_limit) {
        // Round up to 2MB page directory boundary
        map_limit = (max_phys + (2 * 1024 * 1024 - 1)) & ~(2 * 1024 * 1024 - 1);
        if (map_limit < (256 * 1024 * 1024)) {
            map_limit = (256 * 1024 * 1024); // Minimum 256MB direct map
        }
    }

    kprintf("[VMM] Mapping direct physical higher-half window: 0x0 - 0x%lx (%lu MB)\n",
            map_limit, map_limit / (1024 * 1024));

    for (uintptr_t addr = 0; addr < map_limit; addr += PAGE_SIZE) {
        vmm_map_page(KERNEL_VIRTUAL_BASE + addr, addr, VMM_PAGE_PRESENT | VMM_PAGE_WRITABLE);
    }

    // Switch to new Kernel PML4
    write_cr3(pml4_phys);
    kprintf("[VMM] Kernel PML4 activated (CR3: 0x%lx). Virtual memory initialized.\n", (uint64_t)pml4_phys);
}

int vmm_map_page(uintptr_t virt_addr, uintptr_t phys_addr, uint64_t flags) {
    if (!kernel_pml4) return -1;

    size_t pml4_i = PML4_INDEX(virt_addr);
    size_t pdpt_i = PDPT_INDEX(virt_addr);
    size_t pd_i   = PD_INDEX(virt_addr);
    size_t pt_i   = PT_INDEX(virt_addr);

    // 1. PML4 -> PDPT
    if (!(kernel_pml4[pml4_i] & VMM_PAGE_PRESENT)) {
        uintptr_t new_pdpt = pmm_alloc_frame();
        if (!new_pdpt) return -1;
        kernel_pml4[pml4_i] = new_pdpt | VMM_PAGE_PRESENT | VMM_PAGE_WRITABLE | (flags & VMM_PAGE_USER);
        uint64_t *pdpt_ptr = (uint64_t *)(KERNEL_VIRTUAL_BASE + new_pdpt);
        for (int i = 0; i < PAGE_TABLE_ENTRIES; i++) pdpt_ptr[i] = 0;
    } else if (flags & VMM_PAGE_USER) {
        kernel_pml4[pml4_i] |= VMM_PAGE_USER;
    }

    uint64_t *pdpt = (uint64_t *)(KERNEL_VIRTUAL_BASE + (kernel_pml4[pml4_i] & PAGE_FRAME_MASK));

    // 2. PDPT -> PD
    if (!(pdpt[pdpt_i] & VMM_PAGE_PRESENT)) {
        uintptr_t new_pd = pmm_alloc_frame();
        if (!new_pd) return -1;
        pdpt[pdpt_i] = new_pd | VMM_PAGE_PRESENT | VMM_PAGE_WRITABLE | (flags & VMM_PAGE_USER);
        uint64_t *pd_ptr = (uint64_t *)(KERNEL_VIRTUAL_BASE + new_pd);
        for (int i = 0; i < PAGE_TABLE_ENTRIES; i++) pd_ptr[i] = 0;
    } else if (flags & VMM_PAGE_USER) {
        pdpt[pdpt_i] |= VMM_PAGE_USER;
    }

    uint64_t *pd = (uint64_t *)(KERNEL_VIRTUAL_BASE + (pdpt[pdpt_i] & PAGE_FRAME_MASK));

    // 3. PD -> PT
    if (!(pd[pd_i] & VMM_PAGE_PRESENT)) {
        uintptr_t new_pt = pmm_alloc_frame();
        if (!new_pt) return -1;
        pd[pd_i] = new_pt | VMM_PAGE_PRESENT | VMM_PAGE_WRITABLE | (flags & VMM_PAGE_USER);
        uint64_t *pt_ptr = (uint64_t *)(KERNEL_VIRTUAL_BASE + new_pt);
        for (int i = 0; i < PAGE_TABLE_ENTRIES; i++) pt_ptr[i] = 0;
    } else if (flags & VMM_PAGE_USER) {
        pd[pd_i] |= VMM_PAGE_USER;
    }

    uint64_t *pt = (uint64_t *)(KERNEL_VIRTUAL_BASE + (pd[pd_i] & PAGE_FRAME_MASK));

    // 4. Map PT entry to Physical Address
    pt[pt_i] = (phys_addr & PAGE_FRAME_MASK) | (flags & 0xFFFULL) | VMM_PAGE_PRESENT;

    vmm_invlpg(virt_addr);
    return 0;
}

void vmm_unmap_page(uintptr_t virt_addr) {
    if (!kernel_pml4) return;

    size_t pml4_i = PML4_INDEX(virt_addr);
    size_t pdpt_i = PDPT_INDEX(virt_addr);
    size_t pd_i   = PD_INDEX(virt_addr);
    size_t pt_i   = PT_INDEX(virt_addr);

    if (!(kernel_pml4[pml4_i] & VMM_PAGE_PRESENT)) return;
    uint64_t *pdpt = (uint64_t *)(KERNEL_VIRTUAL_BASE + (kernel_pml4[pml4_i] & PAGE_FRAME_MASK));

    if (!(pdpt[pdpt_i] & VMM_PAGE_PRESENT)) return;
    uint64_t *pd = (uint64_t *)(KERNEL_VIRTUAL_BASE + (pdpt[pdpt_i] & PAGE_FRAME_MASK));

    if (!(pd[pd_i] & VMM_PAGE_PRESENT)) return;
    uint64_t *pt = (uint64_t *)(KERNEL_VIRTUAL_BASE + (pd[pd_i] & PAGE_FRAME_MASK));

    pt[pt_i] = 0;
    vmm_invlpg(virt_addr);
}

uintptr_t vmm_virt_to_phys(uintptr_t virt_addr) {
    if (!kernel_pml4) return 0;

    size_t pml4_i = PML4_INDEX(virt_addr);
    size_t pdpt_i = PDPT_INDEX(virt_addr);
    size_t pd_i   = PD_INDEX(virt_addr);
    size_t pt_i   = PT_INDEX(virt_addr);

    if (!(kernel_pml4[pml4_i] & VMM_PAGE_PRESENT)) return 0;
    uint64_t *pdpt = (uint64_t *)(KERNEL_VIRTUAL_BASE + (kernel_pml4[pml4_i] & PAGE_FRAME_MASK));

    if (!(pdpt[pdpt_i] & VMM_PAGE_PRESENT)) return 0;
    uint64_t *pd = (uint64_t *)(KERNEL_VIRTUAL_BASE + (pdpt[pdpt_i] & PAGE_FRAME_MASK));

    if (!(pd[pd_i] & VMM_PAGE_PRESENT)) return 0;
    uint64_t *pt = (uint64_t *)(KERNEL_VIRTUAL_BASE + (pd[pd_i] & PAGE_FRAME_MASK));

    if (!(pt[pt_i] & VMM_PAGE_PRESENT)) return 0;
    return (pt[pt_i] & PAGE_FRAME_MASK) | (virt_addr & 0xFFF);
}

static uintptr_t next_mmio_virt = 0xFFFFFFFFC0000000ULL;

uintptr_t vmm_map_mmio(uintptr_t phys_addr, size_t size) {
    if (size == 0) size = PAGE_SIZE;
    uintptr_t phys_aligned = phys_addr & ~(PAGE_SIZE - 1);
    size_t offset = phys_addr & (PAGE_SIZE - 1);
    size_t total_size = (size + offset + PAGE_SIZE - 1) & ~(PAGE_SIZE - 1);

    uintptr_t virt = next_mmio_virt;
    next_mmio_virt += total_size;

    for (size_t i = 0; i < total_size; i += PAGE_SIZE) {
        vmm_map_page(virt + i, phys_aligned + i, VMM_PAGE_PRESENT | VMM_PAGE_WRITABLE | VMM_PAGE_NOCACHE);
    }

    return virt + offset;
}

void page_fault_handler(uint64_t fault_addr, uint64_t error_code) {
    uint64_t cr2 = read_cr2();
    kprintf("\n[!] EXCEPTION 14: PAGE FAULT (#PF)\n");
    kprintf("  Fault Virtual Address: 0x%016lx (CR2: 0x%016lx)\n", fault_addr, cr2);
    kprintf("  Error Code: 0x%lx [ ", error_code);
    if (error_code & 1) kprintf("PROTECTION_VIOLATION ");
    else kprintf("NON_PRESENT_PAGE ");
    if (error_code & 2) kprintf("WRITE ");
    else kprintf("READ ");
    if (error_code & 4) kprintf("USER_MODE ");
    else kprintf("KERNEL_MODE ");
    if (error_code & 8) kprintf("RESERVED_BIT ");
    if (error_code & 16) kprintf("INSTRUCTION_FETCH ");
    kprintf("]\n");

    kernel_panic("Unrecoverable Page Fault");
}
