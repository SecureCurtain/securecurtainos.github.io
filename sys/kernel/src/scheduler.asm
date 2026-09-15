bits 64

; Export our secure initial process launching function
global launch_first_thread_asm

; ------------------------------------------------------------------------------
; 🛡️ SECURE INITIAL THREAD LAUNCH ENGINE
; ------------------------------------------------------------------------------
; Called once by your kernel's initialization code to kick off the very first 
; user-space task (e.g., your initial loader or subsystem binary).
; ------------------------------------------------------------------------------
launch_first_thread_asm:
    ; RDI contains the target thread's initial saved_rsp value from its TCB.
    ; This pointer targets the complete cpu_state_t block we mocked in scheduler.c.

    ; 1. Relocate the CPU stack pointer directly to the target thread's kernel stack frame
    mov rsp, rdi

    ; 2. Pop and restore all general-purpose registers from the mocked structure
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

    ; At this exact moment, the stack pointer (RSP) is perfectly aligned to the 
    ; remaining 5 hardware fields required by the IRETQ execution frame:
    ; [rsp + 0]  = Target RIP (Program Entry Point)
    ; [rsp + 8]  = Target CS  (User Code Segment Selector)
    ; [rsp + 16] = RFLAGS    (System Flags with Interrupts Enabled)
    ; [rsp + 24] = User RSP  (The unprivileged application stack)
    ; [rsp + 32] = User SS   (User Data Segment Selector)

    ; 3. 🛡️ SANITIZE RESIDUAL REGISTERS
    ; Explicitly wipe remaining scratch registers to prevent any core bootloader 
    ; parameters, memory keys, or internal kernel pointers from leaking into Ring 3.
    xor rax, rax
    xor rbx, rbx
    xor rdx, rdx
    xor rsi, rsi
    xor rdi, rdi
    xor r8, r8
    xor r9, r9
    xor r10, r10

    ; 4. 🛡️ PRIVILEGE DROPPING EXCEPTION RETURN
    ; The CPU pops the 5 structural fields, drops the privilege level from Ring 0 
    ; to Ring 3, switches to the unprivileged application stack, and jumps to the entry point.
    iretq
