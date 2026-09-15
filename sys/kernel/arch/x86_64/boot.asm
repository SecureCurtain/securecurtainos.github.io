; SecureCurtain OS - 64-bit Multiboot2 Kernel Entry & Long Mode Setup
; Author: Jared Busby (jb7572)
; Target Architecture: x86_64 (Higher-Half Virtual Address: 0xFFFFFFFF80000000)

section .multiboot_header
align 8
multiboot_header_start:
    dd 0xE85250D6                ; Multiboot2 magic number
    dd 0                         ; Architecture 0 (protected mode i386)
    dd multiboot_header_end - multiboot_header_start ; Header length
    ; Checksum: -(magic + architecture + length)
    dd -(0xE85250D6 + 0 + (multiboot_header_end - multiboot_header_start))

    ; Optional Framebuffer Request Tag (Flag = 1: Optional)
    align 8
    dw 5                         ; Type 5: Framebuffer tag
    dw 1                         ; Flags: 1 = Optional (Does NOT fail boot if unsupported)
    dd 20                        ; Size
    dd 0                         ; Preferred Width (0 = console/any)
    dd 0                         ; Preferred Height
    dd 0                         ; Preferred Depth (bpp)

    ; End Tag
    align 8
    dw 0                         ; Type 0: End
    dw 0                         ; Flags
    dd 8                         ; Size
multiboot_header_end:

; -----------------------------------------------------------------------------
; 32-bit Protected Mode Bootstrap
; -----------------------------------------------------------------------------
section .boot
bits 32
global _start
extern kmain

_start:
    cli                          ; Disable interrupts
    cld

    ; Preserve Multiboot2 arguments passed in EAX (magic) and EBX (info structure)
    mov [mb2_magic], eax
    mov [mb2_info], ebx

    ; Set up initial temporary 32-bit stack
    mov esp, initial_stack_top

    ; 1. Verify CPUID support
    call check_cpuid
    ; 2. Verify 64-bit Long Mode support
    call check_long_mode
    ; 3. Setup early 4-level paging tables (Identity 4GB & Higher-Half)
    call setup_page_tables
    ; 4. Enable PAE, Long Mode, and Paging
    call enable_paging

    ; 5. Load 64-bit Global Descriptor Table
    lgdt [gdt64_ptr]

    ; 6. Far return into 64-bit trampoline (reloads CS with 0x08 Code Selector)
    push 0x08
    push start64_bootstrap
    retf

; --- CPUID Verification ---
check_cpuid:
    pushfd
    pop eax
    mov ecx, eax
    xor eax, 1 << 21             ; Flip ID bit in EFLAGS
    push eax
    popfd
    pushfd
    pop eax
    push ecx
    popfd
    xor eax, ecx
    jz .no_cpuid
    ret
.no_cpuid:
    mov al, "1"
    jmp error_hang

; --- Long Mode CPUID Check ---
check_long_mode:
    mov eax, 0x80000000
    cpuid
    cmp eax, 0x80000001
    jb .no_long_mode
    mov eax, 0x80000001
    cpuid
    test edx, 1 << 29            ; LM bit in EDX
    jz .no_long_mode
    ret
.no_long_mode:
    mov al, "2"
    jmp error_hang

; --- Early Paging Setup ---
setup_page_tables:
    ; Zero out pml4_table, pdpt_table, and pd_tables (1 PML4 + 1 PDPT + 4 PDs = 6 * 4096 = 24576 bytes)
    push eax
    push ecx
    push edi
    mov edi, pml4_table
    mov ecx, 6144                ; 24576 / 4 dwords
    xor eax, eax
    rep stosd
    pop edi
    pop ecx
    pop eax

    ; Point PML4[0] (identity lower-half) and PML4[511] (higher-half -512GB) to PDPT
    mov eax, pdpt_table
    or eax, 0x03                 ; Present + Writable
    mov [pml4_table], eax
    mov [pml4_table + 4], dword 0
    mov [pml4_table + 511 * 8], eax
    mov [pml4_table + 511 * 8 + 4], dword 0

    ; Map PDPT[0..3] (identity 0..4GB) to PD Tables
    mov eax, pd_tables
    or eax, 0x03                 ; Present + Writable
    mov [pdpt_table + 0 * 8], eax
    mov [pdpt_table + 0 * 8 + 4], dword 0

    add eax, 4096                ; PD 1 (1GB..2GB)
    mov [pdpt_table + 1 * 8], eax
    mov [pdpt_table + 1 * 8 + 4], dword 0

    add eax, 4096                ; PD 2 (2GB..3GB)
    mov [pdpt_table + 2 * 8], eax
    mov [pdpt_table + 2 * 8 + 4], dword 0

    add eax, 4096                ; PD 3 (3GB..4GB)
    mov [pdpt_table + 3 * 8], eax
    mov [pdpt_table + 3 * 8 + 4], dword 0

    ; Map PDPT[510..511] (higher-half 0xFFFFFFFF80000000 -> physical 0..2GB) to PD 0 and PD 1
    mov eax, pd_tables
    or eax, 0x03                 ; Present + Writable
    mov [pdpt_table + 510 * 8], eax
    mov [pdpt_table + 510 * 8 + 4], dword 0

    add eax, 4096                ; PD 1
    mov [pdpt_table + 511 * 8], eax
    mov [pdpt_table + 511 * 8 + 4], dword 0

    ; Map 4GB of physical address space using 2MB huge pages (2048 entries * 2MB = 4096MB)
    mov ecx, 0
.map_pd:
    mov eax, 0x200000            ; 2MB
    mul ecx                      ; EDX:EAX = ecx * 2MB
    or eax, 0x83                 ; Present + Writable + Huge Page (bit 7)
    mov [pd_tables + ecx * 8], eax
    mov [pd_tables + ecx * 8 + 4], edx
    inc ecx
    cmp ecx, 2048
    jne .map_pd
    ret

; --- Enable Long Mode & Paging ---
enable_paging:
    ; Load PML4 address into CR3
    mov eax, pml4_table
    mov cr3, eax

    ; Enable PAE (bit 5), OSFXSR (bit 9), OSXMMEXCPT (bit 10) in CR4
    mov eax, cr4
    or eax, (1 << 5) | (1 << 9) | (1 << 10)
    mov cr4, eax

    ; Enable Long Mode (LME) in EFER MSR (0xC0000080)
    mov ecx, 0xC0000080
    rdmsr
    or eax, 1 << 8
    wrmsr

    ; Enable Paging (PG) and Protected Mode (PE) in CR0, clear EM (bit 2), set MP (bit 1)
    mov eax, cr0
    and eax, ~(1 << 2)            ; Clear EM (Emulation)
    or eax, (1 << 1)              ; Set MP (Monitor Coprocessor)
    or eax, (1 << 31) | (1 << 0)  ; Enable PG and PE
    mov cr0, eax
    ret

error_hang:
    ; Write error code to VGA text buffer
    mov dword [0xb8000], 0x4f524f45 ; "ER" red on white
    mov byte [0xb8004], al
.hang:
    hlt
    jmp .hang

; -----------------------------------------------------------------------------
; 64-bit Identity-Mapped Bootstrap Trampoline (Physical address in .boot)
; -----------------------------------------------------------------------------
bits 64
default rel
start64_bootstrap:
    ; Reload data segments with 64-bit data selector (0x10)
    mov ax, 0x10
    mov ds, ax
    mov es, ax
    mov fs, ax
    mov gs, ax
    mov ss, ax

    ; Reload Multiboot2 parameters into EDI (magic) and ESI (info physical pointer)
    mov edi, [rel mb2_magic]
    mov esi, [rel mb2_info]

    ; Jump to higher-half 64-bit kernel entry point via absolute 64-bit register
    mov rax, long_mode_entry
    jmp rax

; -----------------------------------------------------------------------------
; 64-bit Higher-Half Kernel Entry
; -----------------------------------------------------------------------------
section .text
bits 64
default rel
long_mode_entry:
    ; Setup higher-half stack with 16-byte alignment
    mov rsp, stack_top
    and rsp, -16

    ; Call main kernel entry (RDI = magic, RSI = mb2_info)
    call kmain

.infinite_halt:
    cli
    hlt
    jmp .infinite_halt

; -----------------------------------------------------------------------------
; Early Bootstrap BSS / Page Tables & Stacks (Physical 32-bit Addressable)
; -----------------------------------------------------------------------------
section .boot.bss nobits
align 4096
pml4_table:
    resb 4096
pdpt_table:
    resb 4096
pd_tables:
    resb 16384                   ; 4 Page Directories mapping 4GB physical memory (4 * 4096)

align 16
initial_stack_bottom:
    resb 16384                   ; 16 KB early boot stack
initial_stack_top:

mb2_magic:
    resd 1
mb2_info:
    resd 1

; -----------------------------------------------------------------------------
; 64-bit Global Descriptor Table (Physical 32-bit Addressable during early boot)
; -----------------------------------------------------------------------------
section .boot.rodata
align 8
gdt64:
    dq 0                         ; Null descriptor
.code: equ $ - gdt64
    dq 0x00AF9A000000FFFF        ; 64-bit Kernel Code: Present, Ring 0, Executable, Readable, Long Mode
.data: equ $ - gdt64
    dq 0x00CF92000000FFFF        ; 64-bit Kernel Data: Present, Ring 0, Writable
gdt64_ptr:
    dw $ - gdt64 - 1
    dq gdt64                     ; 64-bit pointer for lgdt in protected/long mode

; -----------------------------------------------------------------------------
; Higher-Half Kernel BSS
; -----------------------------------------------------------------------------
section .bss
align 16
stack_bottom:
    resb 65536                   ; 64 KB main kernel stack
stack_top:
