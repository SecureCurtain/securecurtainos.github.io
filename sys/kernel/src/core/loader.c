/* SecureCurtain OS - Universal Binary Loader (ELF64 & Windows PE32+) & Ring 3 Privilege Engine
 * Author: Jared Busby (jb7572)
 * Architecture: x86_64 Long Mode (Dual-Persona Linux & Windows Native Execution)
 */

#include "kernel.h"
#include "elf.h"
#include "pe.h"
#include "process.h"
#include "vfs.h"
#include "vmm.h"
#include "pmm.h"
#include "heap.h"
#include "sched.h"
#include "gdt.h"

/* Dropping to Ring 3 via x86_64 iretq
 * Stack layout for iretq:
 *   [RSP + 32] = SS (User Data 0x1B)
 *   [RSP + 24] = RSP (User Stack Pointer)
 *   [RSP + 16] = RFLAGS (0x202 = Interrupts Enabled)
 *   [RSP + 8]  = CS (User Code 0x23)
 *   [RSP + 0]  = RIP (User Entry Point)
 */
__attribute__((noreturn))
void ring3_jump(uint64_t entry_point, uint64_t user_rsp) {
    serial_puts("[RING3] Switching CPU privilege level: Ring 0 -> Ring 3 (Userland)...\n");
    serial_puts("[RING3] Target RIP: 0x");
    // Print entry hex address
    char hex[17];
    for (int i = 15; i >= 0; i--) {
        int nibble = (entry_point >> (i * 4)) & 0xF;
        hex[15 - i] = (nibble < 10) ? ('0' + nibble) : ('a' + nibble - 10);
    }
    hex[16] = '\0';
    serial_puts(hex);
    serial_puts(" | Target User RSP: 0x");
    for (int i = 15; i >= 0; i--) {
        int nibble = (user_rsp >> (i * 4)) & 0xF;
        hex[15 - i] = (nibble < 10) ? ('0' + nibble) : ('a' + nibble - 10);
    }
    serial_puts(hex);
    serial_puts("\n");

    __asm__ volatile (
        "cli\n\t"
        // Load User Data segment into segment registers
        "mov $0x1B, %%ax\n\t"
        "mov %%ax, %%ds\n\t"
        "mov %%ax, %%es\n\t"
        "mov %%ax, %%fs\n\t"
        "mov %%ax, %%gs\n\t"

        // Push iretq stack frame
        "pushq $0x1B\n\t"         // SS = User Data Segment (0x18 | 3)
        "pushq %1\n\t"            // RSP = User Stack Pointer
        "pushfq\n\t"              // Push current RFLAGS
        "popq %%rax\n\t"
        "orq $0x200, %%rax\n\t"   // Ensure IF (Interrupt Flag) is enabled (0x200)
        "pushq %%rax\n\t"         // RFLAGS
        "pushq $0x23\n\t"         // CS = User Code Segment (0x20 | 3)
        "pushq %0\n\t"            // RIP = Userland Entry Point

        "iretq\n\t"
        :
        : "r"(entry_point), "r"(user_rsp)
        : "rax", "memory"
    );

    __builtin_unreachable();
}

/* Allocate and map userland stack */
static bool setup_user_stack(void) {
    size_t num_pages = USER_STACK_SIZE / PAGE_SIZE;
    for (size_t i = 0; i < num_pages; i++) {
        uintptr_t virt = USER_STACK_BOTTOM + (i * PAGE_SIZE);
        uintptr_t phys = pmm_alloc_frame();
        if (!phys) {
            serial_puts("[LOADER] Error: Failed to allocate physical frame for user stack!\n");
            return false;
        }

        // Map with User and Writable permissions
        int ret = vmm_map_page(virt, phys, VMM_PAGE_PRESENT | VMM_PAGE_WRITABLE | VMM_PAGE_USER);
        if (ret != 0) {
            serial_puts("[LOADER] Error: Failed to map user stack page!\n");
            return false;
        }

        // Zero the stack page
        uint8_t *page_ptr = (uint8_t *)(KERNEL_VIRTUAL_BASE + phys);
        for (size_t b = 0; b < PAGE_SIZE; b++) page_ptr[b] = 0;
    }
    return true;
}

/* Parse and map 64-bit ELF executable (Linux Persona) */
static struct load_result load_elf64(const uint8_t *data, size_t size) {
    struct load_result res;
    res.success = false;
    res.personality = PERSONALITY_LINUX;

    if (size < sizeof(Elf64_Ehdr)) {
        serial_puts("[LOADER] ELF header truncated!\n");
        return res;
    }

    Elf64_Ehdr *ehdr = (Elf64_Ehdr *)data;

    // Validate ELF magic: 0x7F 'E' 'L' 'F'
    if (ehdr->e_ident[EI_MAG0] != ELF_MAGIC0 ||
        ehdr->e_ident[EI_MAG1] != ELF_MAGIC1 ||
        ehdr->e_ident[EI_MAG2] != ELF_MAGIC2 ||
        ehdr->e_ident[EI_MAG3] != ELF_MAGIC3) {
        serial_puts("[LOADER] Invalid ELF magic signature!\n");
        return res;
    }

    // Verify 64-bit and x86_64
    if (ehdr->e_ident[EI_CLASS] != ELFCLASS64 || ehdr->e_machine != EM_X86_64) {
        serial_puts("[LOADER] Incompatible ELF architecture (expected x86_64 64-bit)!\n");
        return res;
    }

    serial_puts("[LOADER] Valid ELF64 binary confirmed. Loading PT_LOAD segments...\n");

    // Iterate through Program Headers
    Elf64_Phdr *phdrs = (Elf64_Phdr *)(data + ehdr->e_phoff);
    for (uint16_t i = 0; i < ehdr->e_phnum; i++) {
        Elf64_Phdr *ph = &phdrs[i];
        if (ph->p_type != PT_LOAD) continue;

        uint64_t vaddr = ph->p_vaddr;
        uint64_t memsz = ph->p_memsz;
        uint64_t filesz = ph->p_filesz;
        uint64_t offset = ph->p_offset;

        uint64_t page_start = vaddr & ~(PAGE_SIZE - 1);
        uint64_t page_end = (vaddr + memsz + PAGE_SIZE - 1) & ~(PAGE_SIZE - 1);

        for (uint64_t p = page_start; p < page_end; p += PAGE_SIZE) {
            uintptr_t phys = pmm_alloc_frame();
            if (!phys) {
                serial_puts("[LOADER] Out of memory loading segment!\n");
                return res;
            }

            uint64_t flags = VMM_PAGE_PRESENT | VMM_PAGE_USER;
            if (ph->p_flags & PF_W) flags |= VMM_PAGE_WRITABLE;

            vmm_map_page(p, phys, flags);

            // Copy segment data into newly allocated frame
            uint8_t *frame_virt = (uint8_t *)(KERNEL_VIRTUAL_BASE + phys);
            for (size_t b = 0; b < PAGE_SIZE; b++) frame_virt[b] = 0;

            uint64_t seg_start = vaddr;
            uint64_t seg_end = vaddr + filesz;
            uint64_t page_start_addr = p;
            uint64_t page_end_addr = p + PAGE_SIZE;

            uint64_t intersect_start = (seg_start > page_start_addr) ? seg_start : page_start_addr;
            uint64_t intersect_end = (seg_end < page_end_addr) ? seg_end : page_end_addr;

            if (intersect_start < intersect_end) {
                size_t copy_len = intersect_end - intersect_start;
                size_t dest_offset = intersect_start - page_start_addr;
                size_t src_offset = offset + (intersect_start - seg_start);
                for (size_t b = 0; b < copy_len; b++) {
                    frame_virt[dest_offset + b] = data[src_offset + b];
                }
            }
        }
    }

    // Allocate Userland Stack
    if (!setup_user_stack()) {
        return res;
    }

    res.entry_point = ehdr->e_entry;
    res.user_rsp = USER_STACK_TOP - 16; // 16-byte alignment
    res.personality = PERSONALITY_LINUX;
    res.success = true;

    serial_puts("[LOADER] Linux ELF64 binary mapped successfully.\n");
    return res;
}

/* Parse and map 64-bit Windows PE32+ executable (Windows Persona) */
static struct load_result load_pe32plus(const uint8_t *data, size_t size) {
    struct load_result res;
    res.success = false;
    res.personality = PERSONALITY_WINDOWS;

    if (size < sizeof(IMAGE_DOS_HEADER)) {
        serial_puts("[LOADER] PE image smaller than DOS header!\n");
        return res;
    }

    IMAGE_DOS_HEADER *dos = (IMAGE_DOS_HEADER *)data;
    if (dos->e_magic != IMAGE_DOS_SIGNATURE) {
        serial_puts("[LOADER] Missing DOS 'MZ' signature!\n");
        return res;
    }

    if ((size_t)dos->e_lfanew + sizeof(IMAGE_NT_HEADERS64) > size) {
        serial_puts("[LOADER] Corrupt PE: e_lfanew out of bounds!\n");
        return res;
    }

    IMAGE_NT_HEADERS64 *nt = (IMAGE_NT_HEADERS64 *)(data + dos->e_lfanew);
    if (nt->Signature != IMAGE_NT_SIGNATURE) {
        serial_puts("[LOADER] Missing PE signature!\n");
        return res;
    }

    if (nt->FileHeader.Machine != IMAGE_FILE_MACHINE_AMD64) {
        serial_puts("[LOADER] Incompatible PE architecture (expected AMD64 64-bit)!\n");
        return res;
    }

    serial_puts("[LOADER] Valid Windows PE32+ (AMD64) executable identified!\n");
    serial_puts("[LOADER] Subsystem: ");
    if (nt->OptionalHeader.Subsystem == IMAGE_SUBSYSTEM_WINDOWS_GUI) {
        serial_puts("Windows GUI (Native Desktop Windowing)\n");
    } else {
        serial_puts("Windows CUI (Command-line Console)\n");
    }

    uint64_t image_base = nt->OptionalHeader.ImageBase;
    uint32_t entry_rva = nt->OptionalHeader.AddressOfEntryPoint;
    uint16_t num_sections = nt->FileHeader.NumberOfSections;

    IMAGE_SECTION_HEADER *sections = (IMAGE_SECTION_HEADER *)((uint8_t *)&nt->OptionalHeader + nt->FileHeader.SizeOfOptionalHeader);

    // Map each PE Section (.text, .rdata, .data, etc.)
    for (uint16_t i = 0; i < num_sections; i++) {
        IMAGE_SECTION_HEADER *sec = &sections[i];

        uint64_t sec_vaddr = image_base + sec->VirtualAddress;
        uint32_t sec_vsize = sec->VirtualSize ? sec->VirtualSize : sec->SizeOfRawData;
        uint32_t sec_raw_off = sec->PointerToRawData;
        uint32_t sec_raw_size = sec->SizeOfRawData;

        uint64_t p_start = sec_vaddr & ~(PAGE_SIZE - 1);
        uint64_t p_end = (sec_vaddr + sec_vsize + PAGE_SIZE - 1) & ~(PAGE_SIZE - 1);

        for (uint64_t p = p_start; p < p_end; p += PAGE_SIZE) {
            uintptr_t phys = pmm_alloc_frame();
            if (!phys) {
                serial_puts("[LOADER] Out of memory mapping PE section!\n");
                return res;
            }

            // Map as User page with Write and Present
            vmm_map_page(p, phys, VMM_PAGE_PRESENT | VMM_PAGE_WRITABLE | VMM_PAGE_USER);

            uint8_t *frame_virt = (uint8_t *)(KERNEL_VIRTUAL_BASE + phys);
            for (size_t b = 0; b < PAGE_SIZE; b++) frame_virt[b] = 0;

            uint64_t seg_start = sec_vaddr;
            uint64_t seg_end = sec_vaddr + sec_raw_size;
            uint64_t page_start_addr = p;
            uint64_t page_end_addr = p + PAGE_SIZE;

            uint64_t intersect_start = (seg_start > page_start_addr) ? seg_start : page_start_addr;
            uint64_t intersect_end = (seg_end < page_end_addr) ? seg_end : page_end_addr;

            if (intersect_start < intersect_end) {
                size_t copy_len = intersect_end - intersect_start;
                size_t dest_offset = intersect_start - page_start_addr;
                size_t src_offset = sec_raw_off + (intersect_start - seg_start);
                for (size_t b = 0; b < copy_len; b++) {
                    if (src_offset + b < size) {
                        frame_virt[dest_offset + b] = data[src_offset + b];
                    }
                }
            }
        }
    }

    // Inspect PE Import Directory (IAT) if present
    if (nt->OptionalHeader.NumberOfRvaAndSizes > IMAGE_DIRECTORY_ENTRY_IMPORT) {
        IMAGE_DATA_DIRECTORY *import_dir = &nt->OptionalHeader.DataDirectory[IMAGE_DIRECTORY_ENTRY_IMPORT];
        if (import_dir->VirtualAddress && import_dir->Size) {
            serial_puts("[LOADER:PE] PE Import Directory identified (IAT dynamic linking ready).\n");
        }
    }

    // Allocate Userland Stack
    if (!setup_user_stack()) {
        return res;
    }

    res.entry_point = image_base + entry_rva;
    res.user_rsp = USER_STACK_TOP - 16;
    res.personality = PERSONALITY_WINDOWS;
    res.success = true;

    serial_puts("[LOADER] Windows Persona PE32+ successfully mapped into Ring 3.\n");
    return res;
}

/* Universal Binary Auto-Detector and Loader */
struct load_result loader_load_binary(const uint8_t *binary_data, size_t binary_size) {
    struct load_result res;
    res.success = false;

    if (!binary_data || binary_size < 4) {
        serial_puts("[LOADER] Error: Binary buffer is empty or null!\n");
        return res;
    }

    // 1. Detect ELF64 (Linux Persona)
    if (binary_data[0] == ELF_MAGIC0 &&
        binary_data[1] == ELF_MAGIC1 &&
        binary_data[2] == ELF_MAGIC2 &&
        binary_data[3] == ELF_MAGIC3) {
        serial_puts("[LOADER] Autodetected: Linux ELF64 Binary Format\n");
        return load_elf64(binary_data, binary_size);
    }

    // 2. Detect Windows PE32+ (Windows Persona)
    if (binary_data[0] == 'M' && binary_data[1] == 'Z') {
        serial_puts("[LOADER] Autodetected: Windows PE/COFF Executable (MZ Signature)\n");
        return load_pe32plus(binary_data, binary_size);
    }

    serial_puts("[LOADER] Error: Unrecognized executable binary format!\n");
    return res;
}

/* Userland Process Trampoline for the Scheduler */
static void userland_task_trampoline(void) {
    struct task *curr = sched_get_current();
    if (curr && curr->is_user_mode) {
        ring3_jump(curr->user_entry_point, curr->user_rsp);
    }
    sched_exit(0);
}

/* High-level Process Spawner from VFS */
struct process *process_spawn(const char *path, os_personality_t persona_hint) {
    (void)persona_hint;
    serial_puts("[PROC] Spawning process from path: ");
    serial_puts(path);
    serial_puts("\n");

    struct vfs_node *node = vfs_open(path, 0);
    if (!node && path && path[0] != '/') {
        char fallback_path[128] = "/initrd/";
        size_t fi = 8;
        for (size_t pi = 0; path[pi] && fi < sizeof(fallback_path) - 1; pi++) {
            fallback_path[fi++] = path[pi];
        }
        fallback_path[fi] = '\0';
        node = vfs_open(fallback_path, 0);
    }

    if (!node) {
        serial_puts("[PROC] Error: Executable file not found in VFS: ");
        serial_puts(path);
        serial_puts("\n");
        return NULL;
    }

    size_t file_size = (size_t)node->size;
    if (file_size == 0) {
        serial_puts("[PROC] Error: Executable file is 0 bytes!\n");
        return NULL;
    }

    uint8_t *buffer = (uint8_t *)kmalloc(file_size);
    if (!buffer) {
        serial_puts("[PROC] Error: Failed to allocate memory to read binary!\n");
        return NULL;
    }

    size_t read_bytes = vfs_read(node, 0, file_size, buffer);
    if (read_bytes < file_size) {
        serial_puts("[PROC] Warning: Partial read of executable binary.\n");
    }

    // Load binary via Universal Loader
    struct load_result lr = loader_load_binary(buffer, read_bytes);
    kfree(buffer);

    if (!lr.success) {
        serial_puts("[PROC] Error: Failed to load binary image into userland!\n");
        return NULL;
    }

    struct process *p = (struct process *)kmalloc(sizeof(struct process));
    if (!p) {
        return NULL;
    }

    p->personality = lr.personality;
    p->entry_point = lr.entry_point;
    p->user_rsp = lr.user_rsp;
    p->heap_start = 0x0000000040000000ULL; // 1 GB mark
    p->heap_brk = p->heap_start;

    // Create a Preemptible Task in the Scheduler
    struct task *t = sched_create_task(node->name, (task_entry_t)userland_task_trampoline, 5);
    if (t) {
        t->personality = lr.personality;
        t->is_user_mode = true;
        t->user_rsp = lr.user_rsp;
        t->user_entry_point = lr.entry_point;
        // Note: t->entry_point intentionally remains userland_task_trampoline so task_trampoline invokes it!
        p->pid = t->pid;
        p->main_thread = t;
    }

    serial_puts("[PROC] Process PID ");
    serial_putc('0' + (p->pid % 10));
    serial_puts(" created. Persona: ");
    if (p->personality == PERSONALITY_WINDOWS) {
        serial_puts("WINDOWS (Win32 / NT Subsystem)\n");
    } else {
        serial_puts("LINUX (POSIX / System V ABI)\n");
    }

    return p;
}

void process_init(void) {
    serial_puts("[PROC] Initializing Process Manager & Dual-Persona Ring 3 Subsystem...\n");
}
