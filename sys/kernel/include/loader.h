#pragma once
#include <stdint.h>
#include <stddef.h>
#include "memory.h"   // Needed to use vm_space_t token tracking handles
#include "scheduler.h" // Needed to identify PERSONALITY profiles

#define BINARY_UNKNOWN 0
#define BINARY_ELF     1
#define BINARY_PE      2

// --- 🛡️ HARDENED ELF64 STRUCTS ---
#define ELF_MAGIC_0 0x7F
#define ELF_MAGIC_1 'E'
#define ELF_MAGIC_2 'L'
#define ELF_MAGIC_3 'F'

#define PT_LOAD     1 // ELF Program Header type representing a loadable segment

typedef struct {
    uint8_t  e_ident[16];
    uint16_t e_type;
    uint16_t e_machine;
    uint32_t e_version;
    uint64_t e_entry;     // Target execution entry point address
    uint64_t e_phoff;     // Program header table file offset
    uint64_t e_shoff;
    uint32_t e_flags;
    uint16_t e_ehsize;
    uint16_t e_phentsize;
    uint16_t e_phnum;     // Number of program headers to parse
    uint16_t e_shentsize;
    uint16_t e_shnum;
    uint16_t e_shstrndx;
} __attribute__((packed)) elf64_header_t;

typedef struct {
    uint32_t p_type;     // Segment type (e.g., PT_LOAD)
    uint32_t p_flags;    // Execution permissions (1=X, 2=W, 4=R)
    uint64_t p_offset;   // Segment file offset
    uint64_t p_vaddr;    // Target virtual address destination in user space
    uint64_t p_paddr;
    uint64_t p_filesz;   // Size of segment data inside the file
    uint64_t p_memsz;    // Size of segment inside RAM (can be larger for BSS)
    uint64_t p_align;
} __attribute__((packed)) elf64_phdr_t;

// --- 🛡️ HARDENED PE64 STRUCTS ---
#define MZ_MAGIC     0x5A4D     // "MZ"
#define PE_MAGIC     0x00004550 // "PE\\0\\0"

typedef struct {
    uint16_t e_magic;    
    uint8_t  e_res[58];  
    uint32_t e_lfanew;   // File address offset of the true PE header
} __attribute__((packed)) dos_header_t;

typedef struct {
    uint32_t magic;
    uint16_t machine;
    uint16_t number_of_sections; // Number of sections to parse
    uint32_t time_date_stamp;
    uint32_t pointer_to_symbol_table;
    uint32_t number_of_symbols;
    uint16_t size_of_optional_header;
    uint16_t characteristics;
} __attribute__((packed)) pe_file_header_t;

typedef struct {
    uint16_t magic; // 0x20B representing PE32+ (64-bit)
    uint8_t  major_linker_version;
    uint8_t  minor_linker_version;
    uint32_t size_of_code;
    uint32_t size_of_initialized_data;
    uint32_t size_of_uninitialized_data;
    uint32_t address_of_entry_point; // RVA offset of program entry
    uint64_t image_base;              // Preferred loading base address
    uint32_t section_alignment;
    uint32_t file_alignment;
    // Remainder of standard structural attributes omitted for brevity
} __attribute__((packed)) pe64_optional_header_t;

typedef struct {
    uint8_t  name[8];
    uint32_t virtual_size;
    uint32_t virtual_address;     // RVA address of section target
    uint32_t size_of_raw_data;    // Section size in file
    uint32_t pointer_to_raw_data; // Section offset in file
    uint32_t pointer_to_relocations;
    uint32_t pointer_to_linenumbers;
    uint16_t number_of_relocations;
    uint16_t number_of_linenumbers;
    uint32_t characteristics;     // 🛡️ Security flag mappings (e.g., IMAGE_SCN_MEM_EXECUTE)
} __attribute__((packed)) pe64_section_header_t;

typedef struct {
    uint16_t magic;
    uint16_t machine;
} pe_coff_header_t;

typedef struct {
    uint32_t virtual_address;
    uint32_t size;
} pe_data_directory_t;

typedef struct {
    uint32_t signature;
    pe_coff_header_t coff;
    uint16_t magic; // 0x20b for PE32+ (64-bit)
    pe_data_directory_t data_directories[16]; 
} pe_nt_headers64_t;

typedef struct {
    uint32_t import_lookup_table_rva;
    uint32_t time_date_stamp;
    uint32_t forwarder_chain;
    uint32_t name_rva;
    uint32_t import_address_table_rva; // The IAT to patch
} pe_import_descriptor_t;

// --- Primary Loader Core Interfaces ---

void* native_vfs_load_library(const char* path);
void* native_get_symbol_address(void* handle, const char* symbol_name);

/**
 * 🛡️ RUNTIME LOADER REDIRECTION ENGINE
 * Parses a loaded PE image, iterates requested DLL dependencies, and hot-swaps IAT pointers
 * with custom proxy binaries loaded from the sandboxed microkernel VFS.
 */
void parse_and_hook_imports(void* image_base);

/**
 * Parses a buffer's initial magic sequences to identify container type safely.
 * @param buffer Raw pointer to the start of the loaded executable file data.
 * @param size The strict total size limit of the buffer in bytes.
 */
int loader_identify_format(const uint8_t* buffer, size_t size);

/**
 * 🛡️ BOUNDARY SANITIZED BINARY PARSER
 * Reads an untrusted executable buffer, parses headers with rigorous offset validation,
 * allocates memory pages, maps them into an isolated address space with strict W^X permissions,
 * and outputs the verified execution entry point.
 * 
 * @param target_space The isolated destination virtual address space handle (PML4) to map into.
 * @param file_buffer Raw file pointer allocated from disk/VFS layers.
 * @param file_size Absolute byte constraint of the file buffer container.
 * @param out_personality Returns PERSONALITY_LINUX or PERSONALITY_WINDOWS depending on type.
 * @return uint64_t The verified, boundary-checked program entry address. Returns 0 on violation.
 */
uint64_t loader_load_and_map(vm_space_t target_space, const uint8_t* file_buffer, size_t file_size, int* out_personality);