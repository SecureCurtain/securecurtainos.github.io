#pragma once
#include <stdint.h>
#include <stddef.h>

// 🛡️ HARDWARE ENFORCED ARCHITECTURAL FLAGS
#define PAGE_PRESENT   (1ULL << 0)   // Page is loaded in RAM
#define PAGE_WRITABLE  (1ULL << 1)   // Read/Write if set, Read-Only if cleared
#define PAGE_USER      (1ULL << 2)   // Ring 3 User-space access if set, Ring 0 Only if cleared
#define PAGE_PWT       (1ULL << 3)   // Write-Through caching (Critical for hardware drivers)
#define PAGE_PCD       (1ULL << 4)   // Cache-Disable (Critical for direct hardware I/O MMIO)
#define PAGE_NX        (1ULL << 63)  // 🛡️ NO-EXECUTE: Prevents malicious buffer overflow execution

#define PT_ENTRIES     512

typedef uint64_t pt_entry_t;

// Represents a strict 4KB hardware page table structure
typedef struct {
    pt_entry_t entries[PT_ENTRIES];
} __attribute__((aligned(4096))) page_table_t;

// Secure opaque token representing a process's isolated address space root (CR3 value)
typedef uint64_t vm_space_t;

// ------------------------------------------------------------------------------
// Microkernel Memory Isolation Interfaces
// ------------------------------------------------------------------------------

/**
 * Initializes the kernel's core architectural memory manager and activates NX protection.
 */
void init_paging(void);

/**
 * Creates a completely blank, isolated virtual memory space for a new server process.
 * This clones the higher-half kernel space mappings but leaves user-space completely unmapped.
 */
vm_space_t memory_create_address_space(void);

/**
 * 🛡️ CONTEXT-ISOLATED MAPPING FUNCTION
 * Maps a virtual page to a physical address inside a SPECIFIC, isolated address space context.
 * 
 * @param space The destination virtual address space token (PML4 root directory address).
 * @param virtual_addr The target virtual address boundary inside the isolated sandbox.
 * @param physical_addr The source physical RAM frame allocated from pmm.c.
 * @param flags Explicit security protection masks (e.g., PAGE_USER | PAGE_NX).
 */
int memory_map_page(vm_space_t space, uint64_t virtual_addr, uint64_t physical_addr, uint64_t flags);

/**
 * Destroys an isolated address space and frees all associated page tracking structures.
 * Invoked securely by the kernel if a compatibility layer or server crashes.
 */
void memory_destroy_address_space(vm_space_t space);

void core_page_fault_handler_c(uint64_t error_code, uint64_t faulting_address);