/* SecureCurtain OS - 4-Level PML4 Virtual Memory Manager (VMM) Header
 * Author: Jared Busby (jb7572)
 * Target: x86_64 Long Mode (48-bit Canonical Virtual Addressing)
 */

#ifndef _SECURECURTAIN_VMM_H
#define _SECURECURTAIN_VMM_H

#include <stdint.h>
#include <stddef.h>
#include <stdbool.h>

#define VMM_PAGE_PRESENT   (1ULL << 0)
#define VMM_PAGE_WRITABLE  (1ULL << 1)
#define VMM_PAGE_USER      (1ULL << 2)
#define VMM_PAGE_NOCACHE   (1ULL << 4)
#define VMM_PAGE_HUGE      (1ULL << 7)
#define VMM_PAGE_NX        (1ULL << 63)

/* Initializes kernel PML4 and page fault handling */
void vmm_init(void);

/* Maps a 4KB virtual address to a physical frame with specified flags */
int vmm_map_page(uintptr_t virt_addr, uintptr_t phys_addr, uint64_t flags);

/* Unmaps a virtual page and flushes the TLB */
void vmm_unmap_page(uintptr_t virt_addr);

/* Resolves physical address from virtual address */
uintptr_t vmm_virt_to_phys(uintptr_t virt_addr);

/* Flushes single TLB entry */
static inline void vmm_invlpg(uintptr_t virt_addr) {
    __asm__ volatile ("invlpg (%0)" : : "r"(virt_addr) : "memory");
}

/* Maps a range of physical MMIO addresses into kernel virtual space */
uintptr_t vmm_map_mmio(uintptr_t phys_addr, size_t size);

/* Page Fault Handler (#PF - Exception 14) */
void page_fault_handler(uint64_t fault_addr, uint64_t error_code);

#endif /* _SECURECURTAIN_VMM_H */
