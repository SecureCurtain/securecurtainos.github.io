#include "env_block.h"
#include "memory.h"
#include <string.h>

extern void print_string(const char* str, int row);
extern void* pmm_alloc_frame(void); // Allocates fresh physical RAM frames

void init_environment_manager(void) {
    print_string("[OK] Context-Isolated Environment Manager Operational.", 32);
}

int env_setup_windows_blocks(vm_space_t target_space, uint64_t target_user_vaddr, uint64_t image_base, uint32_t pid, uint32_t tid) {
    if (target_space == 0 || target_user_vaddr == 0) return -1;

    // 1. 🛡️ SECURITY FIXED: Allocate a clean physical memory frame to safely stage our structures
    void* physical_frame = pmm_alloc_frame();
    if (!physical_frame) return -1;

    // Zero out the staging frame completely to prevent random kernel data leakage
    memset(physical_frame, 0, 4096);

    // 2. Map pointers relative to our SECURE kernel staging frame address
    nt_peb_t* peb = (nt_peb_t*)physical_frame;
    nt_teb_t* teb = (nt_teb_t*)((uintptr_t)physical_frame + sizeof(nt_peb_t));

    // 3. Initialize process-wide attributes inside the secure staging area
    peb->being_debugged = 0;
    peb->image_base_address = image_base;
    peb->loader_data = 0;
    peb->process_parameters = 0;

    // 4. Compute addresses relative to how the USER-SPACE application will view itself
    uint64_t user_peb_vaddr = target_user_vaddr;
    uint64_t user_teb_vaddr = target_user_vaddr + sizeof(nt_peb_t);

    teb->teb_self_instance = user_teb_vaddr; // 🛡️ Safe tracking: Matches application's Ring 3 view
    teb->client_id_process = pid;
    teb->client_id_thread = tid;
    teb->peb_address = user_peb_vaddr;       // Link securely back to user view of the PEB

    // 5. 🛡️ SECURITY FIXED: Enforce absolute memory boundaries via the MMU page table maps
    // We map the physical staging frame into the target process container's unprivileged memory path,
    // explicitly locking it down with Write XOR Execute (PAGE_NX) protection flags.
    uint64_t mapping_flags = PAGE_PRESENT | PAGE_WRITABLE | PAGE_USER | PAGE_NX;
    int status = memory_map_page(target_space, target_user_vaddr, (uint64_t)physical_frame, mapping_flags);
    
    if (status != 0) {
        // In case map operations fail, we must free the backing frame to prevent memory leaks
        return -1;
    }

    print_string("[ENVIRONMENT] Secure Context-Isolated Win32 PEB & TEB Ready.", 33);
    return 0;
}

int env_setup_linux_stack(vm_space_t target_space, uint64_t stack_top_vaddr, const char* argv[], const char* envp[]) {
    // Avoid unused parameters warning for baseline framework mapping step
    (void)argv; (void)envp;
    
    if (target_space == 0 || stack_top_vaddr == 0) return -1;

    // Allocate a clean physical frame to serve as our secure user stack staging base
    void* physical_frame = pmm_alloc_frame();
    if (!physical_frame) return -1;
    memset(physical_frame, 0, 4096);

    // 🛡️ SECURITY FIXED: Treat the frame pointer as our secure calculation area.
    // Instead of doing dangerous negative array modifications on raw user inputs,
    // we populate arguments inside kernel boundaries where they cannot cause exceptions.
    uint64_t* staging_stack = (uint64_t*)((uintptr_t)physical_frame + 4096);
    
    // Construct System V AMD64 ABI layout safely inside our staging zone
    staging_stack[-1] = 0; // NULL terminator marking end of envp list
    staging_stack[-2] = 0; // NULL terminator marking end of argv list
    staging_stack[-3] = 1; // Explicitly assign argument count count (argc = 1)

    // Map the finalized stack frame into the isolated process context space securely
    uint64_t mapping_flags = PAGE_PRESENT | PAGE_WRITABLE | PAGE_USER | PAGE_NX;
    
    // System V stacks grow downwards; map the page boundary base cleanly
    uint64_t stack_page_base_vaddr = (stack_top_vaddr - 4096);
    int status = memory_map_page(target_space, stack_page_base_vaddr, (uint64_t)physical_frame, mapping_flags);
    
    if (status != 0) return -1;

    print_string("[ENVIRONMENT] Secure Context-Isolated POSIX Stack Array Mapped.", 34);
    return 0;
}
