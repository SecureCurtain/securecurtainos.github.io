bits 64
global flush_gdt
global load_idt
global load_tss
global page_fault_asm_stub

extern core_page_fault_handler_c

; ------------------------------------------------------------------------------
; 🛡️ SECURE GDT FLUSH & Privileged Segment Synchronization
; ------------------------------------------------------------------------------
flush_gdt:
    lgdt [rdi]        ; Load the GDT descriptor layout passed from C

    ; 1. Reset standard supervisor data segment tracking registers
    mov ax, 0x10      ; 0x10 is our Kernel Data Selector (GDT Index 2)
    mov ds, ax
    mov es, ax
    mov ss, ax
    
    ; Clear thread-local block registers to avoid information leaks
    xor ax, ax
    mov fs, ax
    mov gs, ax

    ; 2. HARDWARE ENFORCED: Force execution pipeline reload via a pseudo-Far Return.
    ; This explicitly forces the 'CS' register to update to our 64-bit Kernel Code descriptor.
    mov rax, 0x08     ; 0x08 is our Kernel Code Selector (GDT Index 1)
    push rax          ; Push the target Code Segment selector onto the stack
    lea rax, [rel .reload_cs] ; Load the address of the next sequential instruction
    push rax          ; Push the target instruction pointer onto the stack
    retfq             ; Perform a 64-bit Far Return to update CS and clear execution pipeline

.reload_cs:
    ret

; ------------------------------------------------------------------------------
; 🛡️ SECURE TASK REGISTER BINDING
; ------------------------------------------------------------------------------
load_tss:
    ; RDI contains the TSS GDT byte offset selector (0x28 passed from gdt_idt.c)
    ltr di            ; Load Task Register (Tells CPU where to find the isolation stacks)
    ret

; ------------------------------------------------------------------------------
; 🛡️ SECURE INTERRUPT DESCRIPTOR BINDING
; ------------------------------------------------------------------------------
load_idt:
    lidt [rdi]        ; Load the IDT descriptor layout passed from C
    ; REMOVED 'sti': Let your master main.c daemon decide when it is safe to unmask interrupts.
    ret

; ------------------------------------------------------------------------------
; 🛡️ HARDENED EXCEPTION HANDLING INTERCEPTOR (Exception Vector 14)
; ------------------------------------------------------------------------------
page_fault_asm_stub:
    ; 1. PRESERVE INTEL VOLATILE CONTEXT IMMEDIATELY
    ; When a page fault occurs, the stack layout is currently:
    ; [rsp + 0] = Hardware Error Code (Pushed automatically by CPU)
    ; [rsp + 8] = Faulting RIP
    ; [rsp + 16] = Faulting CS
    ; [rsp + 24] = Faulting RFLAGS
    ; [rsp + 32] = Faulting User RSP (if coming from Ring 3)
    ; [rsp + 40] = Faulting User SS
    
    push rbp
    push rdi
    push rsi
    push rdx
    push rcx
    push rax
    push r8
    push r9
    push r10
    push r11

    ; 2. SECURELY EXTRACT HARDWARE DIAGNOSTIC REGISTER VALUES
    ; Read the exact illegal virtual memory address the process tried to probe
    mov rsi, cr2       ; Argument 2 (RSI) = Faulting Virtual Address
    
    ; Read the error code pushed by the CPU, located just above our saved registers
    mov rdi, [rsp + 80] ; Argument 1 (RDI) = Raw 32-bit hardware error code mask

    ; 3. EXECUTE DEFENSE LOGIC
    ; Call the C memory engine to isolate the rogue Windows/Linux process thread
    call core_page_fault_handler_c

    ; 4. RESTORE AND SANITIZE REGISTERS
    pop r11
    pop r10
    pop r9
    pop r8
    pop rax
    pop rcx
    pop rdx
    pop rsi
    pop rdi
    pop rbp

    ; 5. CLEAN UP HARDWARE ERROR CODE
    add rsp, 8        ; Securely drop the 8-byte error code allocation from stack frame

    iretq             ; Safely restore privilege rings back to execution target
