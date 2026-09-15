            bits 64
global syscall_entry_asm
extern handle_syscall

syscall_entry_asm:
    ; --------------------------------------------------------------------------
    ; 1. SECURE STACK SWITCHING
    ; --------------------------------------------------------------------------
    ; Swap the user base pointer register with the kernel per-CPU data pointer.
    ; This allows us to securely locate and transition to the dedicated Ring 0 stack.
    swapgs                      
    
    ; Save the untrusted user stack pointer temporarily into a kernel scratch location.
    mov [gs:16], rsp            ; Assumes gs:16 is reserved for User RSP tracking
    mov rsp, [gs:8]             ; Assumes gs:8 holds the validated Kernel Stack Pointer

    ; --------------------------------------------------------------------------
    ; 2. ALLOCATE AND POPULATE SECURE CPU STATE CONTAINER
    ; --------------------------------------------------------------------------
    ; Construct the exact cpu_state_t layout within our secure stack
    push qword [gs:16]          ; cpu_state_t->rsp (Untrusted User RSP)
    push r11                    ; cpu_state_t->rflags (Saved User Flags)
    push rcx                    ; cpu_state_t->rip (Saved User Instruction Pointer)
    
    push rbp
    push rdi
    push rsi
    push rdx
    push rcx
    push rbx
    push rax
    push r8
    push r9
    push r10
    push r11
    push r12
    push r13
    push r14
    push r15

    ; --------------------------------------------------------------------------
    ; 3. EXECUTE KERNEL ROUTER
    ; --------------------------------------------------------------------------
    mov rdi, rsp                ; First argument (RDI) = Pointer to our cpu_state_t
    call handle_syscall         ; Safely execute our hardened C validation layer

    ; --------------------------------------------------------------------------
    ; 4. RESTORE AND SANITIZE REGISTERS
    ; --------------------------------------------------------------------------
    pop r15
    pop r14
    pop r13
    pop r12
    pop r11
    pop r10
    pop r9
    pop r8
    pop rax
    pop rbx
    pop rcx
    pop rdx
    pop rsi
    pop rdi
    pop rbp

    ; Extract the saved execution pointers back from our secure structure
    pop rcx                     ; Restore application target RIP
    pop r11                     ; Restore application target RFLAGS
    pop rsp                     ; Restore application target RSP

    ; Clear remaining scratch registers to prevent kernel side-channel data leaks
    xor r8, r8
    xor r9, r9
    xor r10, r10

    ; Swap back to the user context tracking base before exiting
    swapgs                      
    sysretq
