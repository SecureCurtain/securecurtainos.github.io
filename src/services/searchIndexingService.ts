// jb7572_2026-08-24: Category 7 - Search & Indexing Service (find, grep, ripgrep, indexer)
import { 
  IndexedFileRecord, 
  SearchResultItem, 
  LineMatch, 
  IndexCatalogStats, 
  FileTypeCategory 
} from '../types';

const defaultFiles: IndexedFileRecord[] = [
  {
    id: 'f_boot_asm',
    path: '/boot/stage1_bootloader.asm',
    name: 'stage1_bootloader.asm',
    fileType: 'SOURCE',
    sizeBytes: 4096,
    modifiedAt: '2026-08-24 14:02:11',
    lineCount: 142,
    permissions: '-rw-r--r--',
    content: `; SecureCurtain Stage 1 16-bit to 64-bit Long Mode Bootloader
[BITS 16]
[ORG 0x7C00]

start:
    cli                         ; Clear interrupts
    xor ax, ax                  ; Zero segment registers
    mov ds, ax
    mov es, ax
    mov ss, ax
    mov sp, 0x7C00              ; Stack grows downwards from 0x7C00

    ; Enable A20 Line via Fast Gate 0x92
    in al, 0x92
    or al, 2
    out 0x92, al

    ; Load GDT Descriptor for Protected Mode Entry
    lgdt [gdt_descriptor]
    mov eax, cr0
    or eax, 1                   ; Set PE (Protection Enable) bit
    mov cr0, eax

    jmp 0x08:init_pm            ; Far jump to 32-bit protected mode code

[BITS 32]
init_pm:
    mov ax, 0x10                ; 0x10 is GDT Data Selector
    mov ds, ax
    mov es, ax
    mov fs, ax
    mov gs, ax
    mov ss, ax

    ; Setup 4-Level Paging for x86_64 Long Mode
    ; PML4 -> PDPT -> Page Directory -> Page Table (Identity mapped 2MB pages)
    call setup_long_mode_paging
    jmp 0x18:kernel_entry_64    ; Jump to 64-bit microkernel entry point`
  },
  {
    id: 'f_kernel_main',
    path: '/kernel/src/kernel_main.c',
    name: 'kernel_main.c',
    fileType: 'SOURCE',
    sizeBytes: 12288,
    modifiedAt: '2026-08-24 18:30:45',
    lineCount: 285,
    permissions: '-rw-r--r--',
    content: `/**
 * SecureCurtain Ring 0 Microkernel Entry Point
 * Architecture: x86_64 SMP
 */
#include <kernel/mmu.h>
#include <kernel/interrupts.h>
#include <kernel/scheduler.h>
#include <kernel/ipc.h>
#include <drivers/serial.h>
#include <drivers/acpi.h>

void kmain(multiboot_info_t* mb_info, uint64_t magic) {
    serial_init(COM1_PORT, 115200);
    kprintf("[KERNEL] SecureCurtain microkernel v2.4.0-smp booting...\\n");

    // Initialize Global Descriptor Table & Interrupt Descriptor Table
    gdt_init();
    idt_init();
    pic_remap();
    kprintf("[KERNEL] GDT & IDT interrupt gates successfully initialized.\\n");

    // Initialize Memory Management Unit (Physical Frame Allocator + Virtual Memory Manager)
    pmm_init(mb_info);
    vmm_init();
    kprintf("[KERNEL] MMU 4-Level Paging and Slab Allocator active.\\n");

    // ACPI & APIC Hardware Discovery
    acpi_init();
    lapic_init();
    ioapic_init();

    // Start Microkernel IPC & Preemptive Task Scheduler
    ipc_subsystem_init();
    scheduler_init();

    kprintf("[KERNEL] Kernel initialization complete. Spawning userspace init_d...\\n");
    scheduler_spawn_process("/bin/init_d", PROC_PRIORITY_NORMAL);
    scheduler_start_timer_tick();

    while(1) {
        __asm__ volatile("hlt");
    }
}`
  },
  {
    id: 'f_mmu_header',
    path: '/usr/include/kernel/mmu.h',
    name: 'mmu.h',
    fileType: 'HEADER',
    sizeBytes: 5120,
    modifiedAt: '2026-08-24 10:15:00',
    lineCount: 110,
    permissions: '-rw-r--r--',
    content: `#ifndef _KERNEL_MMU_H
#define _KERNEL_MMU_H

#include <stdint.h>
#include <stddef.h>

#define PAGE_SIZE           4096
#define PAGE_SIZE_2MB       (2 * 1024 * 1024)
#define PAGE_PRESENT        (1 << 0)
#define PAGE_WRITABLE       (1 << 1)
#define PAGE_USER           (1 << 2)
#define PAGE_WRITE_THROUGH  (1 << 3)
#define PAGE_NO_CACHE       (1 << 4)
#define PAGE_ACCESSED       (1 << 5)
#define PAGE_DIRTY          (1 << 6)
#define PAGE_HUGE           (1 << 7)
#define PAGE_GLOBAL         (1 << 8)
#define PAGE_NO_EXECUTE     (1ULL << 63)

typedef struct {
    uint64_t entries[512];
} __attribute__((aligned(PAGE_SIZE))) page_table_t;

void pmm_init(void* multiboot_ptr);
void* pmm_alloc_frame(void);
void pmm_free_frame(void* frame_addr);

void vmm_init(void);
void vmm_map_page(uint64_t virt_addr, uint64_t phys_addr, uint64_t flags);
void vmm_unmap_page(uint64_t virt_addr);

#endif // _KERNEL_MMU_H`
  },
  {
    id: 'f_acpi_c',
    path: '/drivers/acpi/acpi_parser.c',
    name: 'acpi_parser.c',
    fileType: 'SOURCE',
    sizeBytes: 8192,
    modifiedAt: '2026-08-24 12:44:19',
    lineCount: 198,
    permissions: '-rw-r--r--',
    content: `#include <drivers/acpi.h>
#include <kernel/mmu.h>
#include <lib/string.h>

static rsdp_descriptor_t* rsdp = NULL;
static xsdt_header_t* xsdt = NULL;

rsdp_descriptor_t* acpi_find_rsdp(void) {
    // Search BIOS Extended Memory Area (EBDA) 0x80000 - 0x9FFFF
    uint8_t* ebda = (uint8_t*)0x80000;
    for (size_t i = 0; i < 0x20000; i += 16) {
        if (memcmp(ebda + i, "RSD PTR ", 8) == 0) {
            if (acpi_validate_checksum(ebda + i, sizeof(rsdp_descriptor_t))) {
                return (rsdp_descriptor_t*)(ebda + i);
            }
        }
    }
    return NULL;
}

void acpi_init(void) {
    rsdp = acpi_find_rsdp();
    if (!rsdp) {
        kprintf("[ACPI] Error: ACPI RSDP root table pointer not found.\\n");
        return;
    }
    kprintf("[ACPI] Found ACPI RSDP v%d table at %p\\n", rsdp->revision, rsdp);
}`
  },
  {
    id: 'f_sysctl_conf',
    path: '/etc/sysctl.conf',
    name: 'sysctl.conf',
    fileType: 'CONFIG',
    sizeBytes: 1536,
    modifiedAt: '2026-08-24 16:00:00',
    lineCount: 45,
    permissions: '-rw-r--r--',
    content: `# SecureCurtain Microkernel Runtime Parameters
# Network Stack Configuration
net.ipv4.ip_forward = 0
net.ipv4.tcp_syncookies = 1
net.ipv4.tcp_window_scaling = 1
net.ipv4.tcp_rmem = 4096 87380 6291456
net.ipv4.tcp_wmem = 4096 16384 4194304

# Virtual Memory Management
vm.swappiness = 10
vm.dirty_ratio = 20
vm.dirty_background_ratio = 5
vm.overcommit_memory = 0
vm.vfs_cache_pressure = 50

# Microkernel IPC Buffer Allocations
kernel.ipc.max_message_size = 65536
kernel.ipc.queue_depth = 4096
kernel.sched_latency_ms = 6`
  },
  {
    id: 'f_fstab',
    path: '/etc/fstab',
    name: 'fstab',
    fileType: 'CONFIG',
    sizeBytes: 800,
    modifiedAt: '2026-08-24 11:20:00',
    lineCount: 18,
    permissions: '-rw-r--r--',
    content: `# /etc/fstab: Static file system mount table
# <file system>                             <mount point>   <type>  <options>                  <dump> <pass>
UUID=3a7b9c1d-8e2f-4a0b-9c5d-1e3f5a7b9c01   /               ext4    rw,noatime,discard,errors=remount-ro 0 1
UUID=9b8c7d6e-5f4a-3b2c-1d0e-9f8a7b6c5d4e   /boot/efi       vfat    defaults,umask=0077        0 2
UUID=4e5f6a7b-8c9d-0e1f-2a3b-4c5d6e7f8a9b   /home           ext4    rw,relatime,nodev,nosuid   0 2
tmpfs                                       /tmp            tmpfs   rw,nosuid,nodev,size=4G    0 0
proc                                        /proc           proc    defaults                   0 0
sysfs                                       /sys            sysfs   defaults                   0 0`
  },
  {
    id: 'f_network_interfaces',
    path: '/etc/network/interfaces.json',
    name: 'interfaces.json',
    fileType: 'CONFIG',
    sizeBytes: 2048,
    modifiedAt: '2026-08-24 15:45:00',
    lineCount: 48,
    permissions: '-rw-r--r--',
    content: `{
  "interfaces": [
    {
      "name": "eth0",
      "driver": "e1000",
      "mac": "52:54:00:12:34:56",
      "dhcp": false,
      "ipv4": "192.168.1.100",
      "netmask": "255.255.255.0",
      "gateway": "192.168.1.1",
      "dns": ["1.1.1.1", "8.8.8.8"]
    },
    {
      "name": "wlan0",
      "driver": "iwlwifi",
      "mac": "a0:c5:89:12:44:88",
      "dhcp": true,
      "state": "UP"
    }
  ]
}`
  },
  {
    id: 'f_systemd_journal',
    path: '/var/log/journal/system.journal',
    name: 'system.journal',
    fileType: 'LOG',
    sizeBytes: 262144,
    modifiedAt: '2026-08-24 21:40:00',
    lineCount: 1520,
    permissions: '-rw-r-----',
    content: `[0.000000] microkernel: x86_64 SMP 8-core CPU detected (GenuineIntel Core i7-13700H)
[0.001240] mmu: 4-Level Paging active. 16384 MB physical RAM identity mapped.
[0.004510] pci: Bus 0000:00:02.0 Intel Iris Xe Graphics initialized.
[0.012800] nvme: Samsung SSD 980 PRO 1TB initialized at 0000:01:00.0 (Queue depth 64)
[0.089100] net: e1000 Gigabit Ethernet link UP at 1000 Mbps Full Duplex.
[0.102400] systemd: Target multi-user.target reached.
[1.240000] auth: sshd[1420]: Accepted publickey for root from 192.168.1.50 port 52314 ssh2: ED25519`
  },
  {
    id: 'f_auth_log',
    path: '/var/log/auth.log',
    name: 'auth.log',
    fileType: 'LOG',
    sizeBytes: 32768,
    modifiedAt: '2026-08-24 21:35:10',
    lineCount: 420,
    permissions: '-rw-r-----',
    content: `Aug 24 20:00:15 SecureCurtain sshd[1204]: Server listening on 0.0.0.0 port 22.
Aug 24 20:15:30 SecureCurtain sudo: root : TTY=pts/0 ; PWD=/root ; USER=root ; COMMAND=/bin/dmesg
Aug 24 21:22:01 SecureCurtain CRON[1390]: (root) CMD (/usr/bin/fstrim -v /)
Aug 24 21:35:10 SecureCurtain sshd[1420]: Accepted key SHA256:7c9e0d1... for root from 192.168.1.50`
  },
  {
    id: 'f_readme',
    path: '/README.md',
    name: 'README.md',
    fileType: 'DOCUMENT',
    sizeBytes: 3072,
    modifiedAt: '2026-08-24 09:00:00',
    lineCount: 75,
    permissions: '-rw-r--r--',
    content: `# SecureCurtain x86_64 Microkernel & User Space Suite

A high-performance modern operating system microkernel written in C and assembly for x86_64 architectures.

## Core Features
- **4-Level Paging MMU**: Physical page frame allocator with slab caching and virtual memory protections.
- **Microkernel IPC Architecture**: Fast synchronous and asynchronous message passing between processes.
- **Hardware Abstraction**: PCI Express enumeration, ACPI power tables parsing, and APIC multi-core scheduling.
- **Full CLI & Cockpit Utilities Suite**: Embedded diagnostics tools for network, storage, performance, package delivery, and instant catalog indexing.`
  }
];

class SearchIndexingService {
  private files: IndexedFileRecord[] = JSON.parse(JSON.stringify(defaultFiles));
  private stats: IndexCatalogStats = {
    totalFiles: defaultFiles.length,
    totalSizeBytes: defaultFiles.reduce((acc, f) => acc + f.sizeBytes, 0),
    totalLines: defaultFiles.reduce((acc, f) => acc + f.lineCount, 0),
    lastRebuilt: new Date().toLocaleString(),
    status: 'ACTIVE',
    indexedPaths: ['/boot', '/kernel', '/usr/include', '/drivers', '/etc', '/var/log', '/README.md']
  };

  public getStats(): IndexCatalogStats {
    return { ...this.stats };
  }

  public getFiles(): IndexedFileRecord[] {
    return [...this.files];
  }

  public toggleIndexerStatus(): IndexCatalogStats {
    this.stats.status = this.stats.status === 'ACTIVE' ? 'PAUSED' : 'ACTIVE';
    return { ...this.stats };
  }

  public rebuildIndex(): IndexCatalogStats {
    this.stats.status = 'ACTIVE';
    this.stats.lastRebuilt = new Date().toLocaleString();
    this.stats.totalFiles = this.files.length;
    this.stats.totalSizeBytes = this.files.reduce((acc, f) => acc + f.sizeBytes, 0);
    this.stats.totalLines = this.files.reduce((acc, f) => acc + f.lineCount, 0);
    return { ...this.stats };
  }

  // =========================================================================
  // 1. File Name Finder (find / fd)
  // =========================================================================
  public findFiles(params: {
    query: string;
    pathPrefix?: string;
    fileType?: string;
    caseSensitive?: boolean;
  }): SearchResultItem[] {
    const { query, pathPrefix = '/', fileType = 'ALL', caseSensitive = false } = params;
    const q = caseSensitive ? query.trim() : query.trim().toLowerCase();

    const results: SearchResultItem[] = [];

    for (const file of this.files) {
      if (pathPrefix && !file.path.startsWith(pathPrefix)) continue;
      if (fileType !== 'ALL' && file.fileType !== fileType) continue;

      const targetName = caseSensitive ? file.name : file.name.toLowerCase();
      const targetPath = caseSensitive ? file.path : file.path.toLowerCase();

      if (!q || targetName.includes(q) || targetPath.includes(q)) {
        results.push({
          file,
          matches: [],
          matchType: 'FILENAME',
          score: targetName.startsWith(q) ? 100 : targetName.includes(q) ? 75 : 50
        });
      }
    }

    return results.sort((a, b) => b.score - a.score);
  }

  // =========================================================================
  // 2. Full-Text Content Search (grep / ripgrep rg)
  // =========================================================================
  public grepContent(params: {
    query: string;
    pathPrefix?: string;
    fileType?: string;
    caseSensitive?: boolean;
    useRegex?: boolean;
    maxResults?: number;
  }): SearchResultItem[] {
    const { 
      query, 
      pathPrefix = '/', 
      fileType = 'ALL', 
      caseSensitive = false, 
      useRegex = false,
      maxResults = 50 
    } = params;

    if (!query.trim()) {
      return this.findFiles({ query: '', pathPrefix, fileType, caseSensitive });
    }

    const results: SearchResultItem[] = [];
    let regex: RegExp | null = null;

    if (useRegex) {
      try {
        regex = new RegExp(query, caseSensitive ? 'g' : 'gi');
      } catch {
        // Fallback to literal search if regex is invalid
        regex = null;
      }
    }

    const lowerQuery = query.toLowerCase();

    for (const file of this.files) {
      if (pathPrefix && !file.path.startsWith(pathPrefix)) continue;
      if (fileType !== 'ALL' && file.fileType !== fileType) continue;

      const lines = file.content.split('\n');
      const fileMatches: LineMatch[] = [];

      lines.forEach((line, idx) => {
        const lineNum = idx + 1;

        if (regex) {
          let match: RegExpExecArray | null;
          regex.lastIndex = 0;
          while ((match = regex.exec(line)) !== null) {
            fileMatches.push({
              lineNumber: lineNum,
              lineContent: line,
              highlightStart: match.index,
              highlightEnd: match.index + match[0].length
            });
            if (!regex.global) break;
          }
        } else {
          const compLine = caseSensitive ? line : line.toLowerCase();
          const target = caseSensitive ? query : lowerQuery;
          const pos = compLine.indexOf(target);
          if (pos !== -1) {
            fileMatches.push({
              lineNumber: lineNum,
              lineContent: line,
              highlightStart: pos,
              highlightEnd: pos + target.length
            });
          }
        }
      });

      if (fileMatches.length > 0) {
        results.push({
          file,
          matches: fileMatches,
          matchType: 'CONTENT',
          score: fileMatches.length * 10
        });
      }

      if (results.length >= maxResults) break;
    }

    return results.sort((a, b) => b.matches.length - a.matches.length);
  }
}

export const searchIndexingService = new SearchIndexingService();
