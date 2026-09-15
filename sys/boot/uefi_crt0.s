; =========================================================================
; SECURE PROTOTYPE OS: BARE-METAL UEFI C-RUNTIME ENTRY INITIALIZATION STUB
; =========================================================================
bits 64
global _start
extern kernel_main              ; Our native 64-bit C kernel core entry path function

section .text
_start:
    ; 1. UEFI firmware transfers control here in 64-Bit Long Mode.
    ; According to Microsoft x64 MS-ABI conventions:
    ;   %rcx = EFI_HANDLE (ImageHandle)
    ;   %rdx = EFI_SYSTEM_TABLE* (SystemTable)
    
    cli                         ; Disable legacy hardware interrupts immediately
    
    ; 2. Enforce absolute 16-byte stack alignment required by physical x86-64 hardware
    mov rbp, rsp                ; Preserve the firmware stack frame anchor
    and rsp, -16                ; Clear the lower 4 bits to force 16-byte alignment boundaries
    sub rsp, 32                 ; Allocate standard 32-byte MS-ABI "Shadow Space" / scratch pad

    ; 3. Preserve the critical UEFI firmware boot parameters
    ; Move them into non-volatile callee-saved registers so kernel sub-initializers can query them
    mov rbx, rcx                ; rbx = ImageHandle
    mov r12, rdx                ; r12 = SystemTablePointer

    ; 4. Pass the verified parameters directly down to your native C microkernel entry point
    ; Re-populate %rcx and %rdx to match MS-ABI argument expectations for the called C function
    mov rcx, rbx
    mov rdx, r12
    call kernel_main

.efi_halt_trap:
    ; Hardware failsafe fallback loop boundary trap if the kernel returns control
    hlt
    jmp .efi_halt_trap

section .data
align 16
; UEFI-compliant metadata allocations can be stationed here if doing low-level relocations
