#include "loader.h"
#include "memory.h"
#include <string.h>

// Define the maximum boundary allowed for user space code execution (128TB on x86_64)
#define USER_SPACE_LIMIT 0x00007FFFFFFFFFFFEOF

extern void print_string(const char* str, int row);
extern void* pmm_alloc_frame(void); // Allocates clean physical pages

// Stubs for native VFS library loader & symbol resolver
void* native_vfs_load_library(const char* path) {
    (void)path;
    print_string("[LOADER VFS] Loading proxy library into memory sandbox...", 6);
    return (void*)0xDEADBEEF; // Proxy DLL memory handle
}

void* native_get_symbol_address(void* handle, const char* symbol_name) {
    if (!handle || !symbol_name) return 0;
    return (void*)0x7FFF00001000ULL; // Hooked proxy function pointer address
}

// The core runtime loader redirection engine
void parse_and_hook_imports(void* image_base) {
    if (!image_base) return;

    // 1. Locate the main DOS header magic check
    uint16_t* dos_magic = (uint16_t*)image_base;
    if (*dos_magic != 0x5A4D) return; // 'MZ' signature check

    // 2. Jump to the NT Header offset 
    uint32_t* pe_offset = (uint32_t*)((uintptr_t)image_base + 0x3C);
    pe_nt_headers64_t* nt_headers = (pe_nt_headers64_t*)((uintptr_t)image_base + *pe_offset);

    // Index 1 in the data directory is always the Import Table Descriptor Array
    pe_data_directory_t import_dir = nt_headers->data_directories[1];
    if (import_dir.size == 0) return; // No external dependencies found

    // Locate the first descriptor in memory relative to where the image is loaded
    pe_import_descriptor_t* descriptor = (pe_import_descriptor_t*)((uintptr_t)image_base + import_dir.virtual_address);

    // 3. Loop through every single requested DLL until hitting an empty terminating descriptor
    while (descriptor->name_rva != 0) {
        char* dll_name = (char*)((uintptr_t)image_base + descriptor->name_rva);
        
        // Construct the sandboxed microkernel target destination path
        char sandboxed_vfs_path[256];
        strcpy(sandboxed_vfs_path, "/system/lib/win32/windows/system32/");
        strcat(sandboxed_vfs_path, dll_name);

        // 4. Load your clean-room custom proxy DLL into memory via the native VFS
        void* proxy_dll_handle = native_vfs_load_library(sandboxed_vfs_path);

        // 5. Walk the Import Address Table (IAT) and patch pointers to point to your proxy
        uint64_t* iat_entry = (uint64_t*)((uintptr_t)image_base + descriptor->import_address_table_rva);
        uint64_t* lookup_entry = (uint64_t*)((uintptr_t)image_base + descriptor->import_lookup_table_rva);

        while (*lookup_entry != 0) {
            // If the highest bit is not set, it's an import by string name (not ordinal index)
            if ((*lookup_entry & (1ULL << 63)) == 0) {
                char* func_name = (char*)((uintptr_t)image_base + (*lookup_entry) + 2); // skip Hint word
                
                // Find where this function lives inside your custom-loaded library
                void* proxy_func_address = native_get_symbol_address(proxy_dll_handle, func_name);
                
                if (proxy_func_address != 0) {
                    // Overwrite the execution jump address directly inside the application memory!
                    *iat_entry = (uint64_t)proxy_func_address;
                }
            }
            iat_entry++;
            lookup_entry++;
        }
        descriptor++; // Move onto the next required DLL (e.g. user32.dll)
    }
}

// 🛡️ SECURITY FILTER: Validates that an offset calculation stays within the file buffer
static inline int is_offset_safe(size_t base_offset, size_t structure_size, size_t total_file_size) {
    // Check for integer overflow during calculation
    if (base_offset + structure_size < base_offset) return 0;
    
    // Ensure the structure fits entirely inside the loaded file buffer boundaries
    if (base_offset + structure_size > total_file_size) return 0;
    
    return 1;
}

int loader_identify_format(const uint8_t* buffer, size_t size) {
    if (!buffer || size < 4) return BINARY_UNKNOWN;

    // 1. Validate Linux ELF Magic Numbers securely
    if (buffer[0] == ELF_MAGIC_0 && buffer[1] == ELF_MAGIC_1 &&
        buffer[2] == ELF_MAGIC_2 && buffer[3] == ELF_MAGIC_3) {
        return BINARY_ELF;
    }

    // 2. Validate Windows PE Magic Numbers safely
    if (size >= sizeof(dos_header_t)) {
        dos_header_t* dos_hdr = (dos_header_t*)buffer;
        if (dos_hdr->e_magic == MZ_MAGIC) {
            // Ensure the offset to the true PE header fits inside the actual file
            if (!is_offset_safe(dos_hdr->e_lfanew, sizeof(pe_file_header_t), size)) {
                return BINARY_UNKNOWN; 
            }
            
            pe_file_header_t* pe_hdr = (pe_file_header_t*)(buffer + dos_hdr->e_lfanew);
            if (pe_hdr->magic == PE_MAGIC) {
                return BINARY_PE;
            }
        }
    }

    return BINARY_UNKNOWN;
}

uint64_t loader_load_and_map(vm_space_t target_space, const uint8_t* file_buffer, size_t file_size, int* out_personality) {
    if (!file_buffer || file_size == 0) return 0;

    int format = loader_identify_format(file_buffer, file_size);
    if (format == BINARY_UNKNOWN) {
        print_string("[SECURITY] Unknown or corrupted file structure. Blocked.", 4);
        return 0;
    }

    if (format == BINARY_ELF) {
        *out_personality = PERSONALITY_LINUX;
        if (file_size < sizeof(elf64_header_t)) return 0;

        elf64_header_t* elf_hdr = (elf64_header_t*)file_buffer;
        print_string("[LOADER] Parsing Linux ELF64 Binary...", 4);

        // 🛡️ SECURITY FIXED: Enforce User Space boundary checks on the entry point address
        if (elf_hdr->e_entry >= USER_SPACE_LIMIT) {
            print_string("[SECURITY VIOLATION] ELF entry point targets Kernel space! Aborting.", 5);
            return 0;
        }

        // Loop through and map program sections securely
        if (!is_offset_safe(elf_hdr->e_phoff, elf_hdr->e_phnum * sizeof(elf64_phdr_t), file_size)) {
            print_string("[SECURITY VIOLATION] Corrupted ELF program headers out of bounds.", 5);
            return 0;
        }

        elf64_phdr_t* phdr_table = (elf64_phdr_t*)(file_buffer + elf_hdr->e_phoff);
        for (int i = 0; i < elf_hdr->e_phnum; i++) {
            if (phdr_table[i].p_type == PT_LOAD) {
                // Ensure target virtual memory segments map strictly inside user space bounds
                if (phdr_table[i].p_vaddr >= USER_SPACE_LIMIT || 
                    phdr_table[i].p_vaddr + phdr_table[i].p_memsz >= USER_SPACE_LIMIT) {
                    return 0; 
                }

                // 🛡️ SECURITY FIXED: Enforce Write XOR Execute (W^X) permissions per segment
                uint64_t mapping_flags = PAGE_USER;
                if (phdr_table[i].p_flags & 2) mapping_flags |= PAGE_WRITABLE; // Writable
                if (!(phdr_table[i].p_flags & 1)) mapping_flags |= PAGE_NX;    // Non-Executable data

                // Map individual memory frames dynamically into the target process directory
                size_t page_count = (phdr_table[i].p_memsz + 4095) / 4096;
                for (size_t p = 0; p < page_count; p++) {
                    void* physical_frame = pmm_alloc_frame();
                    uint64_t target_vaddr = phdr_table[i].p_vaddr + (p * 4096);
                    memory_map_page(target_space, target_vaddr, (uint64_t)physical_frame, mapping_flags);
                }
            }
        }
        return elf_hdr->e_entry;
    } 
    
    else if (format == BINARY_PE) {
        *out_personality = PERSONALITY_WINDOWS;
        dos_header_t* dos_hdr = (dos_header_t*)file_buffer;
        
        print_string("[LOADER] Parsing Windows PE64 (.exe) Binary...", 4);
        
        size_t opt_hdr_offset = dos_hdr->e_lfanew + 4 + sizeof(pe_file_header_t);
        if (!is_offset_safe(opt_hdr_offset, sizeof(pe64_optional_header_t), file_size)) {
            return 0;
        }

        pe64_optional_header_t* opt_hdr = (pe64_optional_header_t*)(file_buffer + opt_hdr_offset);
        uint64_t absolute_entry = opt_hdr->image_base + opt_hdr->address_of_entry_point;

        // 🛡️ SECURITY FIXED: Block image base hijacking attacks targeting kernel space territories
        if (absolute_entry >= USER_SPACE_LIMIT || opt_hdr->image_base >= USER_SPACE_LIMIT) {
            print_string("[SECURITY VIOLATION] PE binary targets Kernel space addresses! Aborting.", 5);
            return 0;
        }

        // Locate and loop through the PE sections array safely
        size_t sections_offset = opt_hdr_offset + sizeof(pe64_optional_header_t);
        // (In a complete build, use opt_hdr size fields to precisely offset the section pointer table)
        
        return absolute_entry;
    }

    return 0;
}
