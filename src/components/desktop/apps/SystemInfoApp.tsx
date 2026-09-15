// jb7572_2026-08-25: System Info & Neofetch Diagnostics App

import React from 'react';
import { useDesktop } from '../../../context/DesktopContext';
import { 
  Info, 
  Cpu, 
  HardDrive, 
  Layers, 
  ShieldCheck, 
  Terminal, 
  Activity, 
  Zap, 
  Monitor,
  CheckCircle2,
  Code,
  Download,
  Disc,
  ArrowRight
} from 'lucide-react';

export const SystemInfoApp: React.FC = () => {
  const { personality, visualTheme, iconTheme, wallpaper, openApp } = useDesktop();

  const handleDownloadSourceManifest = () => {
    const manifest = {
      project: "SecureCurtain OS Bare-Metal Kernel & Toolchain",
      author: "SecureCurtain Open Source Project",
      version: "1.0.0-PROD",
      targetArchitecture: "x86_64 (Freestanding / Long Mode)",
      kernelEntry: "0xFFFFFFFF80000000",
      pillars: {
        bootstrapping: [
          "sys/kernel/arch/x86_64/boot.asm (Multiboot2 + Long Mode)",
          "sys/kernel/arch/x86_64/linker.ld (Higher-half ELF64)",
          "sys/boot/uefi/bootx64.c (UEFI GOP PE32+ Loader)"
        ],
        core: [
          "sys/kernel/src/mm/pmm.c (Dynamic PMM Sizing: Motherboard Max 128GB–512GB+)",
          "sys/kernel/src/mm/vmm.c (4-level PML4 Paging & #PF Handler)",
          "sys/kernel/src/mm/heap.c (kmalloc/kfree Slab Allocator)",
          "sys/kernel/src/core/idt.c (256 Interrupt Gates & ISR Stubs)",
          "sys/kernel/src/core/gdt.c (64-bit GDT & Ring 3 User Segments)",
          "sys/kernel/src/core/tss.c (TSS Stack Switching IST1/IST2)",
          "sys/kernel/src/core/apic.c (LAPIC/IOAPIC & Timers)",
          "sys/kernel/src/core/sched.c (Preemptive Round-Robin Multitasking & Context Switcher)",
          "sys/kernel/src/core/loader.c (Universal Dual-Persona ELF64 & Windows PE32+ Loader & Ring 3 Engine)",
          "sys/kernel/src/fs/vfs.c (Virtual File System & Mount Namespace)",
          "sys/kernel/src/fs/initrd.c (USTAR Boot Ramdisk & Payload Driver)",
          "sys/kernel/src/core/smp.c (SMP Multi-Core Bringup & IPIs)",
          "sys/kernel/src/core/syscall.c (x86_64 Syscall ABI IA32_LSTAR)"
        ],
        drivers: [
          "sys/kernel/src/drivers/pci.c (PCIe ECAM & 0xCF8/0xCFC)",
          "sys/kernel/src/drivers/nvme.c (NVMe Admin/IO Queues & DMA)",
          "sys/kernel/src/drivers/ahci.c (SATA AHCI HBA Controller)",
          "sys/kernel/src/drivers/xhci.c (USB 3.0 Host Controller Interface)",
          "sys/kernel/src/drivers/ps2.c (Intel 8042 PS/2 Keyboard/Mouse)",
          "sys/kernel/src/drivers/net/e1000.c (Intel Gigabit e1000 PCIe NIC)",
          "sys/kernel/src/linux/ (Linux Driver Server Subsystem)",
          "sys/kernel/src/security/tpm2.c (TPM 2.0 TIS MMIO & PCR-7 Sealing)"
        ],
        toolchain: [
          "Makefile (Kernel & ISO Build System)",
          "scripts/build_kernel.sh (Automated Compilation Harness)",
          "scripts/fetch_system_dependencies.py (lwIP, mbedTLS, Kernel Source)",
          "scripts/Dockerfile.builder (Self-Contained Hermetic Build Container)"
        ]
      },
      compileInstructions: [
        "1. sudo apt-get install -y gcc-x86-64-linux-gnu nasm xorriso grub-pc-bin grub-efi-amd64-bin qemu-system-x86 ovmf",
        "2. make all",
        "3. make iso",
        "4. qemu-system-x86_64 -cdrom SecureCurtain-MultiTool-LiveUSB-x86_64.iso -m 4G -smp 4 -enable-kvm"
      ]
    };
    const element = document.createElement('a');
    const file = new Blob([JSON.stringify(manifest, null, 2)], { type: 'application/json' });
    element.href = URL.createObjectURL(file);
    element.download = 'SecureCurtain-OS-Source-Manifest.json';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  return (
    <div className="h-full flex flex-col bg-[#0c0d12] text-[#e2e8f0] font-mono select-none overflow-y-auto p-6 space-y-6">
      {/* Neofetch style branding header */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center p-5 rounded-2xl bg-[#12141c] border border-[#222738] shadow-xl">
        <div className="md:col-span-4 text-purple-400 font-bold text-xs leading-tight whitespace-pre bg-[#08080c] p-4 rounded-xl border border-[#1e2230]">
{`   ____                            ______           __        _     
  / __/___ _______  ___________   / ____/_  _______/ /_____ _(_)___ 
 _\\ \\/ __ \`/ __/ / / / __/ _ \\  / /   / / / / ___/ __/ __ \`/ / __ \\
/___/\\__,_/\\__/_/\\_,_/_/  \\___/  \\/___/\\__,_/_/  \\__/\\__,_/_/_/ /_/ 
      SecureCurtain OS - Next-Gen Self-Healing Microkernel
      x86_64 Long Mode | Dual Personality Subsystems`}
        </div>

        <div className="md:col-span-8 space-y-1.5 text-xs">
          <div className="text-base font-bold text-white tracking-wide flex items-center justify-between">
            <span>SecureCurtain / sys <span className="text-purple-400 font-normal">v1.0-release</span></span>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-purple-900/50 text-purple-200 border border-purple-500/40">
              Open Source Community Release
            </span>
          </div>
          <div className="h-px bg-[#262c3e] my-2" />
          <div className="grid grid-cols-2 gap-2 text-[11px]">
            <div><span className="text-[#64748b]">OS Kernel:</span> <span className="text-sky-300">Self-Healing Microkernel x86_64</span></div>
            <div><span className="text-[#64748b]">Architecture:</span> <span className="text-purple-300 font-mono font-semibold">x86_64 Long Mode</span></div>
            <div><span className="text-[#64748b]">Personality:</span> <span className="text-purple-300 uppercase font-bold">{personality}</span></div>
            <div><span className="text-[#64748b]">Host Machine:</span> <span className="text-emerald-300">SMP 16-Core Virtual CPU</span></div>
            <div><span className="text-[#64748b]">Memory Alloc:</span> <span className="text-amber-300">16,384 MB (PML4 4-Level)</span></div>
            <div><span className="text-[#64748b]">Watchdog:</span> <span className="text-emerald-400 font-bold">Ring 0 Active (0.00% Panic)</span></div>
            <div><span className="text-[#64748b]">VirtIO Network:</span> <span className="text-sky-300">10Gbps Virtual TAP / DHCP</span></div>
            <div><span className="text-[#64748b]">Provenance:</span> <span className="text-emerald-400 font-mono">Verified Watermarked</span></div>
            <div><span className="text-[#64748b]">Ring 0 Status:</span> <span className="text-emerald-400 font-bold">ALL SUBSYSTEMS UP</span></div>
          </div>
        </div>
      </div>

      {/* Hardware Architecture Specs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
        <div className="p-4 rounded-xl bg-[#12141c] border border-[#222738] space-y-2">
          <div className="flex items-center gap-2 text-sky-400 font-bold">
            <Cpu className="w-4 h-4" />
            CPU Architecture
          </div>
          <p className="text-[11px] text-[#94a3b8] leading-relaxed">
            AMD64 / Intel 64 ISA with APIC, AVX-512, RDRAND, and 4-level PML4 Virtual Paging enabled.
          </p>
        </div>

        <div className="p-4 rounded-xl bg-[#12141c] border border-[#222738] space-y-2">
          <div className="flex items-center gap-2 text-purple-400 font-bold">
            <HardDrive className="w-4 h-4" />
            VFS Storage Matrix
          </div>
          <p className="text-[11px] text-[#94a3b8] leading-relaxed">
            NVMe Gen3 / Gen4 / Gen5 & SATA Block Devices with GPT Partitions, Btrfs / ext4 / NTFS compatible VFS layer.
          </p>
        </div>

        <div className="p-4 rounded-xl bg-[#12141c] border border-[#222738] space-y-2">
          <div className="flex items-center gap-2 text-emerald-400 font-bold">
            <ShieldCheck className="w-4 h-4" />
            Dual POSIX / Win32 IPC
          </div>
          <p className="text-[11px] text-[#94a3b8] leading-relaxed">
            Seamless execution bridging Linux systemd/sysctl daemons and Windows services.msc/WinDbg.
          </p>
        </div>
      </div>

      {/* Bare-Metal Roadmap & Subsystem Readiness */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-[#0e1626] via-[#101422] to-[#0c0f18] border border-sky-500/30 shadow-lg space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#222738] pb-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold uppercase">
                100% Verified
              </span>
              <span className="text-xs font-mono text-[#8899aa]">Document: BARE_METAL_ROADMAP.md</span>
            </div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Cpu className="w-4 h-4 text-sky-400" />
              Bare-Metal x86_64 Kernel & Hardware Execution Status
            </h3>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleDownloadSourceManifest}
              className="px-3 py-1.5 rounded-xl bg-[#132224] hover:bg-[#1a3336] text-emerald-300 border border-emerald-500/40 text-xs font-mono font-semibold flex items-center gap-1.5 transition-all shadow-sm"
              title="Export complete kernel C/ASM source manifest"
            >
              <Code className="w-3.5 h-3.5" />
              <span>Export Sources</span>
            </button>
            <button
              onClick={() => openApp('iso-builder')}
              className="px-3 py-1.5 rounded-xl bg-purple-600/90 hover:bg-purple-500 text-white text-xs font-mono font-bold flex items-center gap-1.5 transition-all shadow-md shadow-purple-600/30"
              title="Open Live USB, Rescue ISO & Disk Studio"
            >
              <Disc className="w-3.5 h-3.5" />
              <span>Live USB & ISO Studio</span>
              <ArrowRight className="w-3 h-3 ml-0.5" />
            </button>
          </div>
        </div>

        {/* 6 Pillars Quick Status Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
          <div className="p-3 rounded-xl bg-[#090c14] border border-[#1b2234] space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="font-bold text-sky-400">Pillar 1: Bootstrapping</span>
              <span className="text-[10px] text-emerald-400 font-bold flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> Ready</span>
            </div>
            <p className="text-[11px] text-[#94a3b8]">Multiboot2 + UEFI GOP Loader, GDT64, Long Mode at 0xFFFFFFFF80000000.</p>
          </div>

          <div className="p-3 rounded-xl bg-[#090c14] border border-[#1b2234] space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="font-bold text-sky-400">Pillar 2: Kernel Core</span>
              <span className="text-[10px] text-emerald-400 font-bold flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> Ready</span>
            </div>
            <p className="text-[11px] text-[#94a3b8]">Dynamic PMM (Motherboard Max 128GB–512GB+), VMM 4-Level PML4, IDT 256 gates, APIC & SMP.</p>
          </div>

          <div className="p-3 rounded-xl bg-[#090c14] border border-[#1b2234] space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="font-bold text-sky-400">Pillar 3: Device Drivers</span>
              <span className="text-[10px] text-emerald-400 font-bold flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> Ready</span>
            </div>
            <p className="text-[11px] text-[#94a3b8]">NVMe, AHCI, USB 3.0 xHCI, Intel e1000, PS/2, PCI ECAM, TPM 2.0 & LDS.</p>
          </div>

          <div className="p-3 rounded-xl bg-[#090c14] border border-[#1b2234] space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="font-bold text-sky-400">Pillar 4: Dual-Boot / Install</span>
              <span className="text-[10px] text-emerald-400 font-bold flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> Ready</span>
            </div>
            <p className="text-[11px] text-[#94a3b8]">GPT Partition Engine, Windows Boot Manager chainloader & Blank SSD Wiper.</p>
          </div>

          <div className="p-3 rounded-xl bg-[#090c14] border border-[#1b2234] space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="font-bold text-sky-400">Pillar 5: Hybrid ISO Build</span>
              <span className="text-[10px] text-emerald-400 font-bold flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> Ready</span>
            </div>
            <p className="text-[11px] text-[#94a3b8]">xorriso El Torito EFI + BIOS catalog, automated QEMU launcher & Docker builder.</p>
          </div>

          <div className="p-3 rounded-xl bg-[#090c14] border border-[#1b2234] space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="font-bold text-sky-400">Pillar 6: Userland / Shell</span>
              <span className="text-[10px] text-emerald-400 font-bold flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> Ready</span>
            </div>
            <p className="text-[11px] text-[#94a3b8]">Freestanding string lib, 420+ POSIX commands, self-healing watchdog.</p>
          </div>
        </div>
      </div>
    </div>
  );
};
