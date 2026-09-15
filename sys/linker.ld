/* ==============================================================================
 * 🛡️ MASTER MICROKERNEL ARCHITECTURE LINKER SCRIPT
 * Enforces strict 4KB section boundaries for Write XOR Execute (W^X) compatibility
 * ============================================================================== */

OUTPUT_FORMAT("pe-x86-64")
ENTRY(kmain)

SECTIONS
{
    /* --------------------------------------------------------------------------
     * 1. THE CORE MACHINE EXECUTABLE BOUNDARY (Read-Only + Executable)
     * -------------------------------------------------------------------------- */
    /* Establish the base loader alignment offset. 
       We target 2MB to keep code clean of legacy low-memory motherboard mappings */
    . = 0x200000;
    __kernel_start = .;

    /* Isolate your compiled instructions inside a pristine, dedicated boundary */
    .text : ALIGN(4096)
    {
        __text_start = .;
        *(.text.unlikely .text.*_unlikely .text.exit .text.exit.*)
        *(.text .text.*)
        *(.gnu.linkonce.t.*)
        __text_end = .;
    }

    /* --------------------------------------------------------------------------
     * 2. THE STATIC CONSTANT DATA BOUNDARY (Read-Only + Non-Executable)
     * -------------------------------------------------------------------------- */
    /* Force a strict 4KB page break here. 
       Ensures executable logic never shares hardware space with passive constants */
    . = ALIGN(4096);

    .rdata : ALIGN(4096)
    {
        __rdata_start = .;
        *(.rdata .rdata.*)
        *(.rodata .rodata.*)
        *(.gnu.linkonce.r.*)
        __rdata_end = .;
    }

    /* --------------------------------------------------------------------------
     * 3. THE INITIALIZED VOLATILE SYSTEM STATE BOUNDARY (Writable + Non-Executable)
     * -------------------------------------------------------------------------- */
    /* Force a strict 4KB page break here. 
       This isolates write-authorized territories completely from read-only zones */
    . = ALIGN(4096);

    .data : ALIGN(4096)
    {
        __data_start = .;
        *(.data .data.*)
        *(.gnu.linkonce.d.*)
        __data_end = .;
    }

    /* --------------------------------------------------------------------------
     * 4. THE STATIC UNINITIALIZED ALLOCATION MEMORY MAPS (Writable + Non-Executable)
     * -------------------------------------------------------------------------- */
    /* Merged adjacent to data to minimize page permission swapping requirements.
       Houses your critical scheduler thread tracking tables and PMM allocation arrays */
    .bss : ALIGN(4096)
    {
        __bss_start = .;
        *(.bss .bss.*)
        *(COMMON)
        __bss_end = .;
    }

    /* Capture the absolute upper memory limit marker of your compiled image footprint */
    . = ALIGN(4096);
    __kernel_end = .;

    /* --------------------------------------------------------------------------
     * 5. STRIP UNRECOGNIZED Monolithic METADATA DEBUG BLOCKS
     * -------------------------------------------------------------------------- */
    /* Explicitly drop common GNU comment tables to optimize final binary size 
       and prevent binary reverse-engineering metadata leaks back to hackers */
    /DISCARD/ :
    {
        *(.comment)
        *(.note .note.*)
        *(.eh_frame)
    }
}
