; =========================================================================
; SECURE PROTOTYPE OS: BARE-METAL 64-BIT LONG-MODE BOOTLOADER INITIATOR
; =========================================================================
bits 32                         ; Initial entry from stage-1 bootloader in 32-bit protected mode
global boot_entry
extern kernel_init              ; Our native 64-bit C kernel entry path function

section .boot
align 4
multiboot_header:
    dd 0x1BADB002               ; Multiboot magic identifier token
    dd 0x00000003               ; Flags: align modules, provide memory map
    dd -(0x1BADB002 + 0x00000003) ; Checksum verification calculation

boot_entry:
    cli                         ; 1. Disable legacy hardware interrupts immediately
    mov esp, stack_top          ; Establish initial basic boot stack pointer context

    ; 2. Verify CPU long-mode compatibility via extended CPUID feature queries
    mov eax, 0x80000000
    cpuid
    cmp eax, 0x80000001
    jb .no_long_mode            ; Abort if CPU lacks extended function queries
    
    mov eax, 0x80000001
    cpuid
    test edx, 1 << 29           ; Test Bit 29: Long Mode LM-bit indicator flag
    jz .no_long_mode            ; Abort if CPU hardware lacks 64-bit support

    ; 3. Construct Identity-Mapped temporary 4-Level Page Tables in RAM
    ; Zero out the page directories spaces first
    mov edi, boot_p4
    mov ecx, 4096 * 3
    xor eax, eax
    rep stosb

    ; Link PML4 (Level 4) entry 0 directly to the Page Directory Pointer Table (PDPT)
    mov eax, boot_p3
    or eax, 0x3                 ; Present bit + Read/Write bit flags active
    mov [boot_p4], eax

    ; Link PDPT (Level 3) entry 0 directly to the Page Directory Table (PDT)
    mov eax, boot_p2
    or eax, 0x3                 ; Present + Read/Write
    mov [boot_p3], eax

    ; Populate PDT (Level 2) to map the initial 2MB of memory as a massive page block
    mov eax, 0x00000000
    or eax, 0x83                ; Present + Read/Write + Huge Page Bit (Bit 7)
    mov [boot_p2], eax

    ; 4. Load the Level 4 Page Table pointer into the CR3 control register
    mov eax, boot_p4
    mov cr3, eax

    ; 5. Enable Physical Address Extension (PAE) in the CR4 control register
    mov eax, cr4
    or eax, 1 << 5              ; Set Bit 5: PAE operation flag bitmask
    mov cr4, eax

    ; 6. Switch model specific registers to enable long-mode execution paths
    mov ecx, 0xC0000080         ; EFER MSR register tracking index code
    rdmsr
    or eax, 1 << 8              ; Set Bit 8: LME Long Mode Enable flag bitmask
    wrmsr

    ; 7. Enable Paging inside the CR0 control register to finalize transition
    mov eax, cr0
    or eax, 1 << 31             ; Set Bit 31: PG Paging activation bitmask
    mov cr0, eax

    ; 8. Load a temporary 64-bit Global Descriptor Table (GDT) layout matrix
    lgdt [gdt64_pointer]
    jmp 0x08:.long_mode_jump     ; Far jump code segment reload descriptor mapping

bits 64
.long_mode_jump:
    mov ax, 0x10                ; Overwrite data segments tracking registers contexts
    mov ds, ax
    mov es, ax
    mov fs, ax
    mov gs, ax
    mov ss, ax

    ; 9. Transfer complete baseline control straight into your 64-bit microkernel init
    call kernel_init

.halt_loop:
    hlt                         ; Safety fallback loop boundary trap
    jmp .halt_loop

.no_long_mode:
    ; Hardware failsafe: Flash error colors to legacy VGA text memory space and halt
    mov dword [0xB8000], 0x4F524F45 ; Print "ER" red on white string footprints
    hlt
    jmp .no_long_mode

section .gdt
align 8
gdt64_base:
    dq 0x0000000000000000       ; Null descriptor slot
.code_slot:
    dq 0x00209A0000000000       ; 64-bit Kernel Code Segment descriptor (Conforming, Executable)
.data_slot:
    dq 0x0000920000000000       ; 64-bit Data Segment descriptor (Read/Write layout)
gdt64_pointer:
    dw $ - gdt64_base - 1
    dq gdt64_base

section .bss
align 4096
boot_p4: resb 4096
boot_p3: resb 4096
boot_p2: resb 4096
stack_bottom:
    resb 16384                  ; Allocate a distinct 16KB system boot stack workspace
stack_top:
