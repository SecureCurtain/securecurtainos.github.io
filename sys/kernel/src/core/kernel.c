/* SecureCurtain OS - 64-bit Microkernel Core Entry
 * Author: Jared Busby (jb7572)
 * Target: x86_64 Long Mode (0xFFFFFFFF80000000)
 */

#include "kernel.h"
#include "multiboot2.h"
#include "drivers.h"
#include "pmm.h"
#include "vmm.h"
#include "heap.h"
#include "idt.h"
#include "sched.h"
#include "vfs.h"
#include "initrd.h"
#include "gdt.h"
#include "process.h"
#include "fb.h"

extern void tss_init(uint64_t kernel_stack_top);
extern void apic_init(void);
extern void syscall_init(void);

/* COM1 0x3F8 Serial Port Implementation for QEMU & Real Hardware Terminal */
#define COM1_PORT 0x3F8

void *memcpy(void *dest, const void *src, uint64_t n) {
    uint8_t *d = (uint8_t *)dest;
    const uint8_t *s = (const uint8_t *)src;
    while (n--) *d++ = *s++;
    return dest;
}

void serial_init(void) {
    outb(COM1_PORT + 1, 0x00);    // Disable all interrupts
    outb(COM1_PORT + 3, 0x80);    // Enable DLAB (set baud rate divisor)
    outb(COM1_PORT + 0, 0x01);    // Set divisor to 1 (115200 baud)
    outb(COM1_PORT + 1, 0x00);    // High byte
    outb(COM1_PORT + 3, 0x03);    // 8 bits, no parity, one stop bit (8N1)
    outb(COM1_PORT + 2, 0xC7);    // Enable FIFO, clear them, with 14-byte threshold
    outb(COM1_PORT + 4, 0x0B);    // IRQs enabled, RTS/DSR set
}

static int is_transmit_empty(void) {
    return inb(COM1_PORT + 5) & 0x20;
}

void serial_putc(char c) {
    uint32_t timeout = 10000;
    while (is_transmit_empty() == 0 && --timeout > 0);
    outb(COM1_PORT, c);
}

void serial_puts(const char *str) {
    if (!str) return;
    for (size_t i = 0; str[i] != '\0'; i++) {
        if (str[i] == '\n') {
            serial_putc('\r');
        }
        serial_putc(str[i]);
    }
}

/* VGA Text Mode Console (0xB8000) */
static volatile uint16_t *vga_buffer = (volatile uint16_t*)(KERNEL_VIRTUAL_BASE + 0xB8000);
static size_t vga_row = 0;
static size_t vga_col = 0;

static inline uint16_t vga_entry(unsigned char ch, uint8_t color) {
    return (uint16_t)ch | ((uint16_t)color << 8);
}

void vga_clear(void) {
    for (size_t y = 0; y < 25; y++) {
        for (size_t x = 0; x < 80; x++) {
            vga_buffer[y * 80 + x] = vga_entry(' ', 0x07);
        }
    }
    vga_row = 0;
    vga_col = 0;
}

static void vga_scroll(void) {
    for (size_t y = 0; y < 24; y++) {
        for (size_t x = 0; x < 80; x++) {
            vga_buffer[y * 80 + x] = vga_buffer[(y + 1) * 80 + x];
        }
    }
    for (size_t x = 0; x < 80; x++) {
        vga_buffer[24 * 80 + x] = vga_entry(' ', 0x07);
    }
    vga_row = 24;
}

void vga_putc(char c) {
    if (c == '\n') {
        vga_col = 0;
        if (++vga_row >= 25) {
            vga_scroll();
        }
    } else if (c == '\r') {
        vga_col = 0;
    } else if (c == '\t') {
        vga_col = (vga_col + 4) & ~3;
        if (vga_col >= 80) {
            vga_col = 0;
            if (++vga_row >= 25) vga_scroll();
        }
    } else {
        vga_buffer[vga_row * 80 + vga_col] = vga_entry((unsigned char)c, 0x0A); // Bright Green
        if (++vga_col >= 80) {
            vga_col = 0;
            if (++vga_row >= 25) vga_scroll();
        }
    }
}

void vga_puts(const char *data) {
    if (!data) return;
    for (size_t i = 0; data[i] != '\0'; i++) {
        vga_putc(data[i]);
    }
}

void kprint_char(char c) {
    if (c == '\n') {
        serial_putc('\r');
    }
    serial_putc(c);
    vga_putc(c);
    fb_console_putc(c);
}

static void kprint_str(const char *s) {
    if (!s) s = "(null)";
    while (*s) {
        kprint_char(*s++);
    }
}

static void kprint_hex(uint64_t val, int width, bool prefix) {
    if (prefix) {
        kprint_str("0x");
    }
    char buf[17];
    static const char hex_digits[] = "0123456789abcdef";
    int idx = 0;
    if (val == 0) {
        buf[idx++] = '0';
    } else {
        uint64_t temp = val;
        while (temp > 0 && idx < 16) {
            buf[idx++] = hex_digits[temp & 0xF];
            temp >>= 4;
        }
    }
    while (idx < width && idx < 16) {
        buf[idx++] = '0';
    }
    for (int i = idx - 1; i >= 0; i--) {
        kprint_char(buf[i]);
    }
}

static void kprint_dec(int64_t val) {
    if (val < 0) {
        kprint_char('-');
        val = -val;
    }
    char buf[21];
    int idx = 0;
    if (val == 0) {
        buf[idx++] = '0';
    } else {
        uint64_t temp = (uint64_t)val;
        while (temp > 0 && idx < 20) {
            buf[idx++] = '0' + (temp % 10);
            temp /= 10;
        }
    }
    for (int i = idx - 1; i >= 0; i--) {
        kprint_char(buf[i]);
    }
}

static void kprint_udec(uint64_t val) {
    char buf[21];
    int idx = 0;
    if (val == 0) {
        buf[idx++] = '0';
    } else {
        uint64_t temp = val;
        while (temp > 0 && idx < 20) {
            buf[idx++] = '0' + (temp % 10);
            temp /= 10;
        }
    }
    for (int i = idx - 1; i >= 0; i--) {
        kprint_char(buf[i]);
    }
}

void vkprintf(const char *fmt, va_list args) {
    if (!fmt) return;
    for (size_t i = 0; fmt[i] != '\0'; i++) {
        if (fmt[i] != '%') {
            kprint_char(fmt[i]);
            continue;
        }
        i++;
        if (fmt[i] == '\0') break;

        // Check for padding width like %02x, %08x, %016lx
        int width = 0;
        if (fmt[i] == '0') {
            i++;
        }
        while (fmt[i] >= '0' && fmt[i] <= '9') {
            width = width * 10 + (fmt[i] - '0');
            i++;
        }

        // Check for length modifier e.g. %lx, %lu, %ld, %llx
        bool is_long = false;
        if (fmt[i] == 'l') {
            is_long = true;
            i++;
            if (fmt[i] == 'l') {
                i++;
            }
        }

        switch (fmt[i]) {
            case 's': {
                const char *s = va_arg(args, const char *);
                kprint_str(s);
                break;
            }
            case 'c': {
                char c = (char)va_arg(args, int);
                kprint_char(c);
                break;
            }
            case 'd':
            case 'i': {
                if (is_long) {
                    int64_t d = va_arg(args, int64_t);
                    kprint_dec(d);
                } else {
                    int32_t d = va_arg(args, int32_t);
                    kprint_dec(d);
                }
                break;
            }
            case 'u': {
                if (is_long) {
                    uint64_t u = va_arg(args, uint64_t);
                    kprint_udec(u);
                } else {
                    uint32_t u = va_arg(args, uint32_t);
                    kprint_udec(u);
                }
                break;
            }
            case 'x':
            case 'X': {
                if (is_long) {
                    uint64_t x = va_arg(args, uint64_t);
                    kprint_hex(x, width, false);
                } else {
                    uint32_t x = va_arg(args, uint32_t);
                    kprint_hex(x, width, false);
                }
                break;
            }
            case 'p': {
                uintptr_t p = va_arg(args, uintptr_t);
                kprint_hex(p, 16, true);
                break;
            }
            case '%': {
                kprint_char('%');
                break;
            }
            default: {
                kprint_char('%');
                kprint_char(fmt[i]);
                break;
            }
        }
    }
}

void kprintf(const char *fmt, ...) {
    va_list args;
    va_start(args, fmt);
    vkprintf(fmt, args);
    va_end(args);
}

void kernel_panic(const char *reason) {
    kprintf("\n[!!!] KERNEL PANIC: ");
    kprintf(reason);
    kprintf("\nSystem halted.\n");
    while (1) {
        __asm__ volatile ("cli; hlt");
    }
}

/* Stored Multiboot2 Memory Map tag for dynamic PMM initialization */
static struct multiboot_tag_mmap *boot_mmap_tag = NULL;
struct multiboot_tag_module *boot_module_tag = NULL;
static struct multiboot_tag_framebuffer *boot_fb_tag = NULL;

/* Parse Multiboot2 Tags */
static void parse_multiboot2(uint32_t magic, void *mb2_info) {
    kprintf("[*] Validating Multiboot2 bootstrap parameters...\n");
    if (magic != MULTIBOOT2_BOOTLOADER_MAGIC && magic != 0xE85250D6) {
        kprintf("[-] Warning: Unexpected Multiboot2 magic: 0x%x\n", magic);
    } else {
        kprintf("[+] Multiboot2 magic verified: 0x%x\n", magic);
    }

    if (!mb2_info) return;

    uintptr_t mb2_addr = (uintptr_t)mb2_info;
    if (mb2_addr < KERNEL_VIRTUAL_BASE) {
        mb2_addr += KERNEL_VIRTUAL_BASE;
    }

    struct multiboot_tag *tag = (struct multiboot_tag *)(mb2_addr + 8);
    while (tag && tag->type != MULTIBOOT2_TAG_TYPE_END) {
        if (tag->size == 0 || tag->size > 65536) {
            kprintf("[-] Malformed Multiboot2 tag size, terminating tag parsing.\n");
            break;
        }
        switch (tag->type) {
            case MULTIBOOT2_TAG_TYPE_CMDLINE:
                kprintf("[+] Boot Command Line detected.\n");
                break;
            case MULTIBOOT2_TAG_TYPE_BOOT_LOADER_NAME:
                kprintf("[+] Bootloader Name parsed.\n");
                break;
            case MULTIBOOT2_TAG_TYPE_MMAP:
                kprintf("[+] Multiboot2 Physical Memory Map loaded.\n");
                boot_mmap_tag = (struct multiboot_tag_mmap *)tag;
                break;
            case MULTIBOOT2_TAG_TYPE_MODULE:
                boot_module_tag = (struct multiboot_tag_module *)tag;
                kprintf("[+] Multiboot2 Initramfs Module detected (0x%x - 0x%x, %u KB)\n",
                        boot_module_tag->mod_start, boot_module_tag->mod_end,
                        (boot_module_tag->mod_end - boot_module_tag->mod_start) / 1024);
                break;
            case MULTIBOOT2_TAG_TYPE_FRAMEBUFFER:
                boot_fb_tag = (struct multiboot_tag_framebuffer *)tag;
                kprintf("[+] GOP Linear Framebuffer metadata acquired (%ux%u, %u bpp, pitch %u).\n",
                        boot_fb_tag->framebuffer_width, boot_fb_tag->framebuffer_height,
                        boot_fb_tag->framebuffer_bpp, boot_fb_tag->framebuffer_pitch);
                break;
            default:
                break;
        }
        tag = (struct multiboot_tag *)((uint8_t *)tag + ((tag->size + 7) & ~7));
    }
}

static void kernel_heartbeat_task(void) {
    while (1) {
        sched_sleep(50);
    }
}

/* Master 64-bit Kernel Main Entry */
void kmain(uint32_t magic, void *mb2_info) {
    serial_init();
    vga_clear();

    /* Step 1: Initialize IDT & CPU Exception Handling first for early diagnostic safety */
    idt_init();

    kprintf("======================================================================\n");
    kprintf("  SECURECURTAIN OS - RING 0 NATIVE 64-BIT MICROKERNEL (v%s)\n", KERNEL_VERSION);
    kprintf("  Author: Jared Busby (jb7572) | Arch: x86_64 Long Mode\n");
    kprintf("======================================================================\n");

    /* Step 2: Parse Bootloader Information */
    parse_multiboot2(magic, mb2_info);

    /* Step 3: Initialize Core Memory Management (PMM, VMM, Heap) */
    kprintf("[*] Initializing Physical Memory Manager (Dynamic PMM Sizing)...\n");
    pmm_init((uint64_t)boot_mmap_tag, boot_mmap_tag ? boot_mmap_tag->size : 0);

    kprintf("[*] Initializing 4-Level Virtual Memory Manager (VMM PML4)...\n");
    vmm_init();

    kprintf("[*] Initializing Dynamic Kernel Heap & Slab Allocator...\n");
    heap_init();

    kprintf("[*] Initializing GOP Linear Framebuffer Graphics Driver...\n");
    if (boot_fb_tag) {
        fb_init(boot_fb_tag->framebuffer_addr,
                boot_fb_tag->framebuffer_width,
                boot_fb_tag->framebuffer_height,
                boot_fb_tag->framebuffer_pitch,
                boot_fb_tag->framebuffer_bpp);
    } else {
        kprintf("[-] No Multiboot2 GOP framebuffer tag detected. Falling back to VGA text mode.\n");
    }

    /* Step 4: Configure Stacks, APIC, and Syscalls */

    kprintf("[*] Configuring TSS Ring 0 Stack & IST...\n");
    tss_init(KERNEL_VIRTUAL_BASE + 0x100000);

    kprintf("[*] Initializing 64-bit GDT (Kernel & Ring 3 User Segments)...\n");
    gdt_init();

    kprintf("[*] Initializing Local APIC & Hardware Timers...\n");
    apic_init();

    kprintf("[*] Initializing Fast Syscall (LSTAR) Extensions...\n");
    syscall_init();

    /* Step 4: Initialize Hardware Bus & Peripherals */
    kprintf("[*] Enumerating PCIe / PCI buses...\n");
    pci_scan_bus();

    kprintf("[*] Initializing High-Performance Storage Subsystems...\n");
    pci_device_t *nvme_dev = pci_find_class(0x01, 0x08);
    if (nvme_dev && nvme_dev->bar[0]) {
        uint64_t bar_phys = nvme_dev->bar[0] & ~0xFULL;
        uint64_t bar_virt = vmm_map_mmio(bar_phys, 0x20000);
        kprintf("    [NVMe] Mapping MMIO BAR: phys=0x%lx, virt=0x%lx\n", bar_phys, bar_virt);
        nvme_init(bar_virt);
    } else {
        kprintf("    [NVMe] No NVMe storage controller detected on PCI bus.\n");
    }

    pci_device_t *ahci_dev = pci_find_class(0x01, 0x06);
    if (ahci_dev && ahci_dev->bar[0]) {
        uint64_t bar_phys = ahci_dev->bar[0] & ~0xFULL;
        uint64_t bar_virt = vmm_map_mmio(bar_phys, 0x20000);
        kprintf("    [AHCI] Mapping MMIO BAR: phys=0x%lx, virt=0x%lx\n", bar_phys, bar_virt);
        ahci_init(bar_virt);
    } else {
        kprintf("    [AHCI] No AHCI SATA controller detected on PCI bus.\n");
    }

    kprintf("[*] Initializing USB 3.0 xHCI & PS/2 Controllers...\n");
    pci_device_t *xhci_dev = pci_find_class(0x0C, 0x03);
    if (xhci_dev && xhci_dev->bar[0]) {
        uint64_t bar_phys = xhci_dev->bar[0] & ~0xFULL;
        uint64_t bar_virt = vmm_map_mmio(bar_phys, 0x20000);
        kprintf("    [xHCI] Mapping MMIO BAR: phys=0x%lx, virt=0x%lx\n", bar_phys, bar_virt);
        xhci_init(bar_virt);
    } else {
        kprintf("    [xHCI] No xHCI USB controller detected on PCI bus.\n");
    }
    ps2_init();

    kprintf("[*] Initializing Network Interfaces (Intel e1000 + LDS Bridge)...\n");
    pci_device_t *e1000_dev = pci_find_class(0x02, 0x00);
    if (!e1000_dev) e1000_dev = pci_find_device(0x8086, 0x100E);
    if (e1000_dev && e1000_dev->bar[0]) {
        uint64_t bar_phys = e1000_dev->bar[0] & ~0xFULL;
        uint64_t bar_virt = vmm_map_mmio(bar_phys, 0x20000);
        kprintf("    [e1000] Mapping MMIO BAR: phys=0x%lx, virt=0x%lx\n", bar_phys, bar_virt);
        e1000_init(bar_virt);
    } else {
        kprintf("    [e1000] No Intel e1000 network card detected on PCI bus.\n");
    }

    kprintf("[*] Initializing Hardware Security & TPM 2.0 Attestation...\n");
    tpm2_init();

    kprintf("[*] Bringing up Application Processors (SMP Multi-Core)...\n");
    smp_init();

    /* Step 5: Initialize Preemptive Multitasking & Kernel Threads */
    kprintf("[*] Initializing Preemptive Round-Robin Multitasking & Context Switcher...\n");
    sched_init();

    /* Step 6: Initialize Virtual File System & Boot Ramdisk */
    kprintf("[*] Initializing Virtual File System (VFS Namespace)...\n");
    vfs_init();

    if (boot_module_tag) {
        // Map initrd pages in virtual address space
        uint64_t start_phys = boot_module_tag->mod_start;
        uint64_t end_phys = boot_module_tag->mod_end;
        uint64_t start_aligned = start_phys & ~4095ULL;
        uint64_t end_aligned = (end_phys + 4095ULL) & ~4095ULL;
        for (uint64_t phys = start_aligned; phys < end_aligned; phys += 4096) {
            uint64_t virt = (uint64_t)KERNEL_VIRTUAL_BASE + phys;
            vmm_map_page(virt, phys, VMM_PAGE_PRESENT | VMM_PAGE_WRITABLE);
        }

        uintptr_t initrd_virt = KERNEL_VIRTUAL_BASE + boot_module_tag->mod_start;
        size_t initrd_len = (size_t)(boot_module_tag->mod_end - boot_module_tag->mod_start);
        struct vfs_node *initrd_node = initrd_init(initrd_virt, initrd_len);
        if (initrd_node) {
            vfs_mount("/initrd", initrd_node);
        }
    }

    /* Step 7: Initialize Process Manager & Dual-Persona Ring 3 Subsystem */
    kprintf("[*] Initializing Process Manager & Dual-Persona Ring 3 Subsystem...\n");
    process_init();

    /* Check for init executable payload in boot ramdisk (ELF or Windows PE) */
    const char *init_target = NULL;
    if (vfs_open("/initrd/init.elf", 0)) {
        init_target = "/initrd/init.elf";
    } else if (vfs_open("/initrd/init.exe", 0)) {
        init_target = "/initrd/init.exe";
    }

    if (init_target) {
        kprintf("[*] Found boot init payload: %s, launching Ring 3 task...\n", init_target);
        process_spawn(init_target, PERSONALITY_NATIVE);
    } else {
        kprintf("[-] Warning: No boot init payload found in /initrd.\n");
    }

    /* Spawn background kernel heartbeat thread */
    sched_create_task("heartbeat", (task_entry_t)kernel_heartbeat_task, 5);

    kprintf("\n[✓] SecureCurtain OS Microkernel Core is 100%% Operational.\n");
    kprintf("[✓] Preemptive Multitasking armed. Ready for userland payloads.\n\n");

    /* Enable Interrupts and Enter Scheduler Dispatch Loop */
    __asm__ volatile ("sti");

    while (1) {
        sched_yield();
        __asm__ volatile ("hlt");
    }
}
