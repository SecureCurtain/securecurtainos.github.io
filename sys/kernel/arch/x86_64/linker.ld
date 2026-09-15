/* SecureCurtain OS Higher-Half x86_64 Linker Script
 * Author: Jared Busby (jb7572)
 * Target Architecture: ELF64 x86_64
 * Physical Entry: 1 MB (0x00100000)
 * Higher-Half Virtual Base: 0xFFFFFFFF80000000
 */

OUTPUT_FORMAT("elf64-x86-64")
OUTPUT_ARCH(i386:x86-64)
ENTRY(_start)

KERNEL_VIRTUAL_BASE = 0xFFFFFFFF80000000;
KERNEL_PHYSICAL_BASE = 0x00100000;

PHDRS
{
    boot PT_LOAD FLAGS(5);       /* Read + Execute */
    boot_data PT_LOAD FLAGS(6);  /* Read + Write */
    text PT_LOAD FLAGS(5);       /* Read + Execute */
    rodata PT_LOAD FLAGS(4);     /* Read-Only */
    data PT_LOAD FLAGS(6);       /* Read + Write */
}

SECTIONS
{
    /* Physical load address starting at 1 MB */
    . = KERNEL_PHYSICAL_BASE;

    /* Early 32-bit Multiboot2 & page table bootstrap section (Physical address) */
    .boot ALIGN(4K) :
    {
        KEEP(*(.multiboot_header))
        *(.boot)
    } :boot

    .boot.data ALIGN(4K) :
    {
        *(.boot.rodata)
        *(.boot.data)
        *(.boot.bss)
    } :boot_data

    /* Transition to Higher-Half Virtual Address Space */
    . += KERNEL_VIRTUAL_BASE;

    /* 64-bit Kernel Code Section */
    .text ALIGN(4K) : AT(ADDR(.text) - KERNEL_VIRTUAL_BASE)
    {
        _text_start = .;
        *(.text .text.*)
        _text_end = .;
    } :text

    /* Read-Only Data Section */
    .rodata ALIGN(4K) : AT(ADDR(.rodata) - KERNEL_VIRTUAL_BASE)
    {
        _rodata_start = .;
        *(.rodata .rodata.*)
        _rodata_end = .;
    } :rodata

    /* Read-Write Initialized Data Section */
    .data ALIGN(4K) : AT(ADDR(.data) - KERNEL_VIRTUAL_BASE)
    {
        _data_start = .;
        *(.data .data.*)
        _data_end = .;
    } :data

    /* Uninitialized Data & Kernel Stack Section */
    .bss ALIGN(4K) : AT(ADDR(.bss) - KERNEL_VIRTUAL_BASE)
    {
        _bss_start = .;
        *(COMMON)
        *(.bss .bss.*)
        _bss_end = .;
    } :data

    _kernel_end = .;

    /DISCARD/ :
    {
        *(.comment)
        *(.note*)
        *(.eh_frame)
    }
}
