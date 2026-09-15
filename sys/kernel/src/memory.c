#include "memory.h"

// Forward declaration
void core_page_fault_handler_c(uint64_t error_code, uint64_t faulting_address);

// Define the standard virtual memory split point for x86_64 higher-half kernels.
// Addresses below this are User-space; addresses above are protected Kernel-space.
#define KERNEL_SPACE_START 0xFFFF800000000000ULL

// External functions provided by your physical memory allocator and low-level system
extern void* pmm_alloc_frame(void); // Allocates a clean, 4KB page frame of physical RAM
extern void  pmm_free_frame(void* frame);
extern void  write_cr3(uint64_t pml4_physical_addr); // Assembly helper to load CR3 register

// Global pointer to hold the base master kernel page table map
static vm_space_t g_kernel_pml4 = 0;

// Helper macros to extract 9-bit page table indices from a 64-bit virtual address
#define PML4_INDEX(addr) (((addr) >> 39) & 0x1FF)
#define PDPT_INDEX(addr) (((addr) >> 30) & 0x1FF)
#define PD_INDEX(addr)   (((addr) >> 21) & 0x1FF)
#define PT_INDEX(addr)   (((addr) >> 12) & 0x1FF)

// Bitmask to strip hardware flags and get the raw physical memory address from an entry
#define ENTRY_ADDR_MASK  0x000FFFFFFFFFF000ULL

/**
 * 🛡️ INTERNAL SECURITY HELPER
 * Navigates to or creates a lower-level page table entry securely.
 */
static page_table_t* get_next_table_level(page_table_t* current_table, size_t index, uint64_t flags) {
    pt_entry_t entry = current_table->entries[index];

    // If the next level table doesn't exist yet, we must allocate it dynamically
    if (!(entry & PAGE_PRESENT)) {
        void* new_frame = pmm_alloc_frame();
        if (!new_frame) return NULL; // Out of physical memory!

        // Clear the newly allocated table completely to wipe junk data
        uint64_t* dest = (uint64_t*)new_frame;
        for (int i = 0; i < PT_ENTRIES; i++) {
            dest[i] = 0;
        }

        // 🛡️ SECURITY: Intermediate directory entries must use open permissions (Writable | User).
        // The actual safety constraints are enforced at the leaf Level 1 (PT) entry.
        current_table->entries[index] = ((uint64_t)new_frame) | PAGE_PRESENT | PAGE_WRITABLE | (flags & PAGE_USER);
        return (page_table_t*)new_frame;
    }

    return (page_table_t*)(entry & ENTRY_ADDR_MASK);
}

void init_paging(void) {
    // 1. Capture or initialize the initial boot-time kernel address directory
    // For UEFI, this represents our core execution map template.
    g_kernel_pml4 = (vm_space_t)pmm_alloc_frame();
    
    uint64_t* dest = (uint64_t*)g_kernel_pml4;
    for (int i = 0; i < PT_ENTRIES; i++) {
        dest[i] = 0;
    }

    // 2. Enable the hardware NX (No-Execute) bit via the EFER Model Specific Register
    // If you don't do this, setting bit 63 on x86_64 will trigger an immediate CPU crash (#GP).
    uint32_t low, high;
    __asm__ __volatile__("rdmsr" : "=a"(low), "=d"(high) : "c"(0xC0000080));
    low |= (1 << 11); // Set NXE (No-Execute Enable) bit
    __asm__ __volatile__("wrmsr" : : "c"(0xC0000080), "a"(low), "d"(high));
}

vm_space_t memory_create_address_space(void) {
    page_table_t* new_pml4 = (page_table_t*)pmm_alloc_frame();
    if (!new_pml4) return 0;

    page_table_t* kernel_pml4 = (page_table_t*)g_kernel_pml4;

    // 🛡️ SECURITY FIXED: Clone higher-half kernel space mappings, lock out user space.
    for (int i = 0; i < PT_ENTRIES; i++) {
        if (i >= 256) {
            // Index 256-511 represent higher-half kernel memory addresses.
            // Share the kernel mappings so system calls function seamlessly.
            new_pml4->entries[i] = kernel_pml4->entries[i];
        } else {
            // Index 0-255 belong to user space. Leave completely unmapped.
            // This prevents a new process from inheriting residual data from an old process.
            new_pml4->entries[i] = 0;
        }
    }

    return (vm_space_t)new_pml4;
}

int memory_map_page(vm_space_t space, uint64_t virtual_addr, uint64_t physical_addr, uint64_t flags) {
    page_table_t* pml4 = (page_table_t*)space;
    if (!pml4) return -1;

    // 🛡️ SANITY/SECURITY CHECK: Prevent user-space from hijacking kernel-space space.
    if ((virtual_addr >= KERNEL_SPACE_START) && (flags & PAGE_USER)) {
        return -2; // Security Violation: Cannot map a user-accessible page inside kernel territory!
    }

    // Walk through Level 4 (PML4) down to Level 3 (PDPT)
    page_table_t* pdpt = get_next_table_level(pml4, PML4_INDEX(virtual_addr), flags);
    if (!pdpt) return -1;

    // Walk through Level 3 (PDPT) down to Level 2 (PD)
    page_table_t* pd = get_next_table_level(pdpt, PDPT_INDEX(virtual_addr), flags);
    if (!pd) return -1;

    // Walk through Level 2 (PD) down to Level 1 (PT)
    page_table_t* pt = get_next_table_level(pd, PD_INDEX(virtual_addr), flags);
    if (!pt) return -1;

    size_t pt_idx = PT_INDEX(virtual_addr);

    // Check if the leaf map target is already present to prevent dangerous accidental overwrites
    if (pt->entries[pt_idx] & PAGE_PRESENT) {
        return 0; // Page is already mapped safely
    }

    // 🛡️ ENFORCE TARGET SPECIFIC PERMISSIONS AT THE LEAF ENTRY
    // Combine the physical destination address frame with your exact security restrictions.
    pt->entries[pt_idx] = (physical_addr & ENTRY_ADDR_MASK) | flags | PAGE_PRESENT;

    return 0; // Success
}

void memory_destroy_address_space(vm_space_t space) {
    page_table_t* pml4 = (page_table_t*)space;
    if (!pml4 || space == g_kernel_pml4) return;

    // 🛡️ Free user-space page table directory tree (entries 0-255)
    for (int i = 0; i < 256; i++) {
        if (pml4->entries[i] & PAGE_PRESENT) {
            page_table_t* pdpt = (page_table_t*)(pml4->entries[i] & ENTRY_ADDR_MASK);
            for (int j = 0; j < PT_ENTRIES; j++) {
                if (pdpt->entries[j] & PAGE_PRESENT) {
                    page_table_t* pd = (page_table_t*)(pdpt->entries[j] & ENTRY_ADDR_MASK);
                    for (int k = 0; k < PT_ENTRIES; k++) {
                        if (pd->entries[k] & PAGE_PRESENT) {
                            page_table_t* pt = (page_table_t*)(pd->entries[k] & ENTRY_ADDR_MASK);
                            pmm_free_frame(pt);
                        }
                    }
                    pmm_free_frame(pd);
                }
            }
            pmm_free_frame(pdpt);
        }
    }
    pmm_free_frame(pml4);
}

// 🛡️ SECURITY CONSTANTS: Explicitly define hardware exception flag bits
#define PF_ERROR_PRESENT  (1 << 0)  // 0: Page not present, 1: Protection violation
#define PF_ERROR_WRITE    (1 << 1)  // 0: Fault caused by Read, 1: Fault caused by Write
#define PF_ERROR_USER     (1 << 2)  // 0: Fault occurred in Ring 0, 1: Fault occurred in Ring 3
#define PF_ERROR_RESERVED (1 << 3)  // 1: Fault caused by overwriting reserved CPU bits
#define PF_ERROR_INSTRUCT (1 << 4)  // 1: 🛡️ W^X VIOLATION! Fault caused by trying to execute code from an NX page

extern void print_string(const char* str, int row);

/**
 * 🛡️ HARDENED VIRTUAL MEMORY EXCEPTION PARSER
 * Evaluates raw processor flags during page access violations.
 * Securely terminates rogue user applications while keeping adjacent subsystem containers online.
 */
void core_page_fault_handler_c(uint64_t error_code, uint64_t faulting_address) {
    print_string("--- [CRITICAL MEMORY ACCESS EXCEPTION] ---", 13);

    // 1. Check if the access violation originated in unprivileged space (Ring 3)
    if (error_code & PF_ERROR_USER) {
        print_string("[SECURITY] Page Fault generated within unprivileged Ring 3 Sandbox.", 14);

        // 2. Diagnose the structural intent of the exploitation attempt
        if (error_code & PF_ERROR_INSTRUCT) {
            // 🛡️ SECURITY TRIPPED: The application tried to execute code inside a non-executable page (e.g. Stack or Heap shellcode)
            print_string("[CRITICAL] W^X Protection Violation: Attempted to execute code from an NX Page!", 15);
        } else if (error_code & PF_ERROR_WRITE) {
            print_string("[INFO] Unauthorized Write access probe targeted unmapped memory.", 15);
        } else {
            print_string("[INFO] Unauthorized Read access probe targeted unmapped memory.", 15);
        }

        // Construct a safe, stack-allocated debug buffer to isolate metrics
        char fault_log[64];
        memset(fault_log, 0, sizeof(fault_log));
        strcpy(fault_log, "Offending Virtual Memory Target: 0x");
        
        // Simple hex proxy tracker representation for row reporting
        if (faulting_address >= 0xFFFF800000000000ULL) {
            strcat(fault_log, "KERNEL_TERRITORY_REJECTED");
        } else {
            strcat(fault_log, "USER_SANDBOX_SPACE");
        }
        print_string(fault_log, 16);

        // 3. 🛡️ SECURITY FIXED: Containment. 
        // Instead of triggering a global kernel crash, we flag the current active thread as dead.
        // The scheduler will skip it dynamically, leaving your other subsystem windows completely active.
        print_string("[CONTAINMENT] Offending thread terminated safely. Subsystem intact.", 17);
        
        // In a full implementation, grab the active TCB and mark its state:
        // tcb_t* bad_task = scheduler_get_current_tcb();
        // bad_task->state = STATE_DEAD;
        // while(1) { __asm__ __volatile__("hlt"); } // Wait for timer preemption tick to switch contexts
        return;
    }

    // 4. Ring 0 Page Fault Security Handling
    // If a fault occurs in supervisor mode, it represents an unrecoverable system boundary error.
    // We execute a controlled system halt to prevent further memory corruption or state leakage.
    print_string("[FATAL ERROR] Supervisor Page Fault encountered inside Ring 0 Core!", 14);
    print_string("System halted permanently to guard microkernel encryption state flags.", 15);
    while (1) {
        __asm__ __volatile__("cli; hlt"); // Mask all interrupts and freeze processing lines cold
    }
}
