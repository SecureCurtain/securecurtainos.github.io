bits 64

global isr_stub_table
extern isr_dispatcher

section .text

align 16
isr_common_stub:
    ; Save all general-purpose registers
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

    ; Set up the arguments for:
    ; void isr_dispatcher(uint8_t vector, uint64_t error_code, void *frame);
    mov rdi, [rsp + 120]        ; Arg 1: Vector (pushed just before jmp)
    mov rsi, [rsp + 128]        ; Arg 2: Error code (pushed before vector)
    mov rdx, rsp                ; Arg 3: Frame pointer (pointer to saved registers)

    call isr_dispatcher

    ; Restore all general-purpose registers
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

    ; Clean up vector and error code
    add rsp, 16

    iretq

; Generate 256 Interrupt Service Routines
%assign i 0
%rep 256
    ; Check if the vector pushes an error code
    %if i == 8 || i == 10 || i == 11 || i == 12 || i == 13 || i == 14 || i == 17 || i == 21 || i == 29 || i == 30
        align 16
        isr%[i]:
            push qword i ; Push vector number (error code is already on stack)
            jmp isr_common_stub
    %else
        align 16
        isr%[i]:
            push qword 0 ; Push dummy error code
            push qword i ; Push vector number
            jmp isr_common_stub
    %endif
%assign i i+1
%endrep

section .data
align 8
isr_stub_table:
%assign i 0
%rep 256
    dq isr%[i]
%assign i i+1
%endrep
