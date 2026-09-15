// jb7572_2026-08-25: SecureCurtain Core Architecture - Bootable ISO, Multi-Tool Live USB & Universal System Fix Studio
import React, { useState } from 'react';
import { useDesktop } from '../../../context/DesktopContext';
import { RESCUE_UTILITIES_SUITE, RescueToolItem } from './rescueToolsData';
import { RescueToolCatalogView } from './RescueToolCatalogView';
import { FlashCardRetrieverView } from './FlashCardRetrieverView';
import { 
  Disc, 
  Play, 
  Terminal, 
  Download, 
  Copy, 
  Check, 
  Cpu, 
  HardDrive, 
  Layers, 
  ShieldCheck, 
  FileCode, 
  Sparkles,
  RefreshCw,
  Wrench,
  Stethoscope,
  Usb,
  LifeBuoy,
  AlertTriangle,
  FolderTree,
  CheckCircle2,
  Sliders,
  Maximize2,
  ExternalLink,
  ChevronRight,
  Database,
  ArrowRight,
  Flame,
  MonitorPlay,
  Lock,
  Shield,
  FileText,
  Binary,
  Zap,
  RotateCcw,
  Search,
  Activity,
  Key,
  Eraser,
  Grid,
  Filter,
  Camera,
  CreditCard,
  Code
} from 'lucide-react';

export interface UsbDevice {
  id: string;
  device: string;
  name: string;
  sizeGb: number;
  speed: string;
  type: string;
}

export interface DiskDevice {
  id: string;
  device: string;
  name: string;
  sizeGb: number;
  tableType: 'MBR' | 'GPT';
  status: string;
  health: string;
  serial: string;
  partitions: { name: string; size: string; fs: string; label: string }[];
}

export const IsoBuilderApp: React.FC = () => {
  const { treeData, addNotification } = useDesktop();
  
  // Active Tab
  const [activeTab, setActiveTab] = useState<'config' | 'live_usb' | 'disk_doctor' | 'forensic_clone' | 'repair_suite' | 'flash_retriever' | 'tool_catalog' | 'sys_test' | 'scripts' | 'bare_metal_roadmap'>('config');

  // Rescue Tools & Diagnostic Suite Filter & Selection State
  const [toolCategoryFilter, setToolCategoryFilter] = useState<'all' | 'windows' | 'linux' | 'baremetal' | 'forensics'>('all');
  const [toolSearchQuery, setToolSearchQuery] = useState<string>('');
  const [selectedToolId, setSelectedToolId] = useState<string>('bcdboot_bootrec');
  const [activeToolActionLog, setActiveToolActionLog] = useState<string[]>([]);
  const [isExecutingTool, setIsExecutingTool] = useState<boolean>(false);
  const [toolExecProgress, setToolExecProgress] = useState<number>(0);

  // Build Configuration State
  const [isoProfile, setIsoProfile] = useState<'all_in_one' | 'installer_only' | 'rescue_fix_disk' | 'minimal'>('all_in_one');
  const [bootMode, setBootMode] = useState<'uefi' | 'hybrid' | 'bios'>('hybrid');
  const [includeGparted, setIncludeGparted] = useState<boolean>(true);
  const [includeLinuxBootRepair, setIncludeLinuxBootRepair] = useState<boolean>(true);
  const [includeMbrToGptConverter, setIncludeMbrToGptConverter] = useState<boolean>(true);
  const [includeForensicWriteBlocker, setIncludeForensicWriteBlocker] = useState<boolean>(true);
  const [includeBitToBitCloner, setIncludeBitToBitCloner] = useState<boolean>(true);
  const [includeWindowsBcdFix, setIncludeWindowsBcdFix] = useState<boolean>(true);
  const [includeChrootRescue, setIncludeChrootRescue] = useState<boolean>(true);
  const [includeDdrescueTestdisk, setIncludeDdrescueTestdisk] = useState<boolean>(true);
  const [includeMemtest86, setIncludeMemtest86] = useState<boolean>(true);
  const [includeSysRequirementsTest, setIncludeSysRequirementsTest] = useState<boolean>(true);
  const [enablePersistence, setEnablePersistence] = useState<boolean>(true);
  const [persistenceSizeGb, setPersistenceSizeGb] = useState<number>(8);

  // QEMU Virtual Machine Configuration
  const [qemuMem, setQemuMem] = useState<string>('4G');
  const [qemuCores, setQemuCores] = useState<number>(4);
  const [enableKvm, setEnableKvm] = useState<boolean>(true);
  const [enableVirtIoGpu, setEnableVirtIoGpu] = useState<boolean>(true);
  const [enableVirtIoNet, setEnableVirtIoNet] = useState<boolean>(true);
  const [enableSerialLog, setEnableSerialLog] = useState<boolean>(true);

  // Live USB Burning State
  const [selectedUsb, setSelectedUsb] = useState<string>('/dev/sdb');
  const [isFlashing, setIsFlashing] = useState<boolean>(false);
  const [flashProgress, setFlashProgress] = useState<number>(0);
  const [flashLog, setFlashLog] = useState<string[]>([]);
  const [flashComplete, setFlashComplete] = useState<boolean>(false);

  // Build State
  const [isBuilding, setIsBuilding] = useState<boolean>(false);
  const [buildProgress, setBuildProgress] = useState<number>(0);
  const [buildLogs, setBuildLogs] = useState<string[]>([
    'System ready. Configured toolchain: x86_64-elf-gcc 13.2.0 & NASM 2.16.01',
    'Live USB modules initialized: GParted, MBR->GPT Converter, Forensic Write-Blocker Cloner, Boot Repair, Hardware Benchmark Suite'
  ]);
  const [isIsoReady, setIsIsoReady] = useState<boolean>(true);
  const [copiedScript, setCopiedScript] = useState<boolean>(false);
  const [copiedDd, setCopiedDd] = useState<boolean>(false);
  const [copiedCloneCmd, setCopiedCloneCmd] = useState<boolean>(false);
  const [copiedMbr2GptCmd, setCopiedMbr2GptCmd] = useState<boolean>(false);

  // MBR to GPT Converter State
  const [selectedMbrDisk, setSelectedMbrDisk] = useState<string>('/dev/sdd');
  const [isConvertingMbr, setIsConvertingMbr] = useState<boolean>(false);
  const [mbrConvertProgress, setMbrConvertProgress] = useState<number>(0);
  const [mbrConvertLogs, setMbrConvertLogs] = useState<string[]>([]);
  const [mbrConvertDone, setMbrConvertDone] = useState<boolean>(false);

  // Forensic Bit-to-Bit Clone State
  const [cloneSourceDisk, setCloneSourceDisk] = useState<string>('/dev/nvme0n1');
  const [cloneTargetDisk, setCloneTargetDisk] = useState<string>('/dev/sda');
  const [writeBlockerEngaged, setWriteBlockerEngaged] = useState<boolean>(true);
  const [verifyChecksumSha256, setVerifyChecksumSha256] = useState<boolean>(true);
  const [isCloning, setIsCloning] = useState<boolean>(false);
  const [cloneProgress, setCloneProgress] = useState<number>(0);
  const [cloneSpeed, setCloneSpeed] = useState<string>('420 MB/s');
  const [clonedBytes, setClonedBytes] = useState<string>('0 GB / 1000 GB');
  const [cloneLogs, setCloneLogs] = useState<string[]>([]);
  const [cloneHashMatch, setCloneHashMatch] = useState<boolean | null>(null);
  const [sourceSha256, setSourceSha256] = useState<string>('');
  const [targetSha256, setTargetSha256] = useState<string>('');

  // Interactive Boot Repair Simulation State
  const [selectedDistroToRepair, setSelectedDistroToRepair] = useState<string>('ubuntu');
  const [isRepairingBoot, setIsRepairingBoot] = useState<boolean>(false);
  const [repairLogs, setRepairLogs] = useState<string[]>([]);
  const [repairDone, setRepairDone] = useState<boolean>(false);

  // Interactive System Benchmark State
  const [isRunningSysTest, setIsRunningSysTest] = useState<boolean>(false);
  const [sysTestProgress, setSysTestProgress] = useState<number>(0);
  const [sysTestResults, setSysTestResults] = useState<{
    cpu: { passed: boolean; score: string; details: string };
    ram: { passed: boolean; score: string; details: string };
    disk: { passed: boolean; score: string; details: string };
    uefi: { passed: boolean; score: string; details: string };
  } | null>(null);

  // Available USB flash drives
  const usbDrives: UsbDevice[] = [
    {
      id: 'usb-sandisk',
      device: '/dev/sdb',
      name: 'SanDisk Ultra Luxe 64GB USB 3.1',
      sizeGb: 64,
      speed: '150 MB/s Read',
      type: 'Removable USB Flash'
    },
    {
      id: 'usb-samsung',
      device: '/dev/sdc',
      name: 'Samsung BAR Plus 128GB USB 3.1 Gen 1',
      sizeGb: 128,
      speed: '400 MB/s Read',
      type: 'Removable USB Flash'
    },
    {
      id: 'usb-kingston',
      device: '/dev/sdd',
      name: 'Kingston DataTraveler Max 256GB USB-C',
      sizeGb: 256,
      speed: '1,000 MB/s Read',
      type: 'High-Speed Type-C Flash'
    }
  ];

  // Available System Disks for Diagnostics / Conversion / Cloning
  const systemDisks: DiskDevice[] = [
    {
      id: 'disk-nvme0',
      device: '/dev/nvme0n1',
      name: 'Samsung 990 PRO NVMe SSD 1TB (PCIe 4.0)',
      sizeGb: 1000,
      tableType: 'GPT',
      status: 'Clean / Healthy',
      health: '100% S.M.A.R.T. Good (0 Bad Blocks)',
      serial: 'S75SNX0T104892K',
      partitions: [
        { name: '/dev/nvme0n1p1', size: '512 MB', fs: 'FAT32', label: 'EFI System Partition' },
        { name: '/dev/nvme0n1p2', size: '480 GB', fs: 'Ext4', label: 'SecureCurtain Root /' },
        { name: '/dev/nvme0n1p3', size: '450 GB', fs: 'NTFS', label: 'Windows 11 OS' },
        { name: '/dev/nvme0n1p4', size: '32 GB', fs: 'Ext4', label: 'Golden Recovery /recovery' }
      ]
    },
    {
      id: 'disk-sda',
      device: '/dev/sda',
      name: 'Crucial MX500 1TB SATA III SSD',
      sizeGb: 1000,
      tableType: 'GPT',
      status: 'Target Storage / Idle',
      health: '100% S.M.A.R.T. Good',
      serial: 'CT1000MX500SSD1-2394',
      partitions: [
        { name: '/dev/sda1', size: '1000 GB', fs: 'RAW / Unallocated', label: 'Backup / Clone Target' }
      ]
    },
    {
      id: 'disk-sdd',
      device: '/dev/sdd',
      name: 'Western Digital Blue 500GB (Legacy MBR Drive)',
      sizeGb: 500,
      tableType: 'MBR',
      status: 'Legacy BIOS / Needs GPT Migration',
      health: '98% S.M.A.R.T. Normal (0 Reallocated Sectors)',
      serial: 'WDC-WD5000AAKX-001CA0',
      partitions: [
        { name: '/dev/sdd1', size: '100 MB', fs: 'NTFS', label: 'System Reserved (MBR)' },
        { name: '/dev/sdd2', size: '499.9 GB', fs: 'NTFS', label: 'Windows 10 Legacy' }
      ]
    }
  ];

  // Generate real QEMU launch script
  const generateQemuScript = () => {
    return `#!/usr/bin/env bash
# ==============================================================================
# SecureCurtain OS - Multi-Tool Live USB & QEMU Launcher
# Author: SecureCurtain Engineering Team
# Includes: Live Installer, Hardware Benchmark, Linux Boot Repair & GParted
# Includes: MBR->GPT Non-Destructive Converter & Forensic Write-Blocked Cloner
# ==============================================================================
set -e

ISO_FILE="SecureCurtain-MultiTool-LiveUSB-x86_64.iso"
OVMF_PATH="/usr/share/OVMF/OVMF_CODE.fd"

echo "🛡️  Booting SecureCurtain Multi-Tool Live Environment [x86_64 Long Mode]..."

qemu-system-x86_64 \\
  -name "SecureCurtain-MultiTool-Live" \\
  ${enableKvm ? '-enable-kvm -cpu host \\' : '-cpu qemu64,+smep,+smap,+syscall,+avx2 \\'}
  -m ${qemuMem} \\
  -smp cores=${qemuCores},threads=1,sockets=1 \\
  -drive file="\${ISO_FILE}",format=raw,media=cdrom \\
  ${bootMode === 'uefi' || bootMode === 'hybrid' ? '-drive if=pflash,format=raw,readonly=on,file="${OVMF_PATH}" \\' : ''}
  ${enableVirtIoNet ? '-device virtio-net-pci,netdev=net0 -netdev user,id=net0,hostfwd=tcp::2222-:22 \\' : ''}
  ${enableVirtIoGpu ? '-device virtio-gpu-pci,xres=1920,yres=1080 -display default,show-cursor=on \\' : '-vga std \\'}
  ${enableSerialLog ? '-serial stdio \\' : ''}
  -no-reboot \\
  -d cpu_reset,guest_errors
`;
  };

  // Generate Flash DD Command
  const generateDdCommand = () => {
    return `# Flash Hybrid Live USB directly to target block device
sudo dd if=SecureCurtain-MultiTool-LiveUSB-x86_64.iso of=${selectedUsb} bs=4M status=progress oflag=direct conv=fsync`;
  };

  // Generate MBR to GPT Command
  const generateMbr2GptCommand = () => {
    return `# Non-destructive MBR to GPT in-place conversion
# Step 1: Backup original MBR partition table
sudo sgdisk --backup=mbr_backup_${selectedMbrDisk.replace('/dev/', '')}.bin ${selectedMbrDisk}

# Step 2: Convert MBR to GPT data structures preserving sector offsets
sudo gdisk ${selectedMbrDisk} << 'EOF'
r
g
w
Y
EOF

# Step 3: Verify and sync partition kernel geometry
sudo partprobe ${selectedMbrDisk}
sudo gdisk -l ${selectedMbrDisk}`;
  };

  // Generate Forensic Clone with Write Blocker Command
  const generateCloneCommand = () => {
    return `# ==============================================================================
# Forensic Bit-to-Bit Raw Disk Clone with Mandatory Source Write Blocker
# ==============================================================================

# 1. Engage Absolute Source Drive Write Blocker at Linux Kernel Block Layer
sudo blockdev --setro ${cloneSourceDisk}
sudo hdparm -r1 ${cloneSourceDisk}
echo "1" | sudo tee /sys/block/${cloneSourceDisk.replace('/dev/', '')}/ro

# 2. Verify write blocker status (MUST return 1 for Read-Only)
blockdev --getro ${cloneSourceDisk}

# 3. Execute Bit-to-Bit Direct Raw Stream Clone with ddrescue / dcfldd
sudo ddrescue --direct --retry-passes=3 --sector-size=4096 --status-interval=2s \\
  ${cloneSourceDisk} ${cloneTargetDisk} clone_${cloneSourceDisk.replace('/dev/', '')}_to_${cloneTargetDisk.replace('/dev/', '')}.map

# 4. Cryptographic Forensic Verification (SHA-256 Bitstream Hash Match)
sha256sum ${cloneSourceDisk}
sha256sum ${cloneTargetDisk}`;
  };

  // Generate Multi-Boot GRUB configuration
  const generateGrubCfg = () => {
    return `# SecureCurtain OS - Multi-Tool Live USB & Universal System Fix GRUB 2.12 Config
set timeout=10
set default=0

insmod efi_gop
insmod font
insmod gfxterm
set gfxmode=1920x1080x32,auto
terminal_output gfxterm

menuentry "1. SecureCurtain OS 1.0 (Live Desktop Session & Installer)" {
    multiboot2 /boot/securecurtain.bin console=ttyS0 quiet live=1 personality=modern_hybrid
    module2 /boot/initrd_live.tar initrd
    boot
}

menuentry "2. Launch SecureCurtain Bare-Metal OS Installation Wizard" {
    multiboot2 /boot/securecurtain.bin console=ttyS0 autoinstall=wizard target_disk=auto
    module2 /boot/initrd_installer.tar initrd
    boot
}

menuentry "3. Hardware Pre-Flight & System Requirements Benchmark" {
    multiboot2 /boot/securecurtain.bin selftest=full_benchmark ram_check=16gb nvme_dma_test=1
    module2 /boot/initrd_diag.tar initrd
    boot
}

menuentry "4. MBR to GPT In-Place Non-Destructive Converter (gdisk / sgdisk)" {
    multiboot2 /boot/securecurtain.bin rescue_mode=mbr2gpt auto_backup=1
    module2 /rescue/initrd_mbr2gpt.tar initrd
    boot
}

menuentry "5. Forensic Bit-to-Bit Raw Cloner (Absolute Source Write-Blocker Mode)" {
    multiboot2 /boot/securecurtain.bin rescue_mode=forensic_clone write_block_source=1 sha256_verify=1
    module2 /rescue/initrd_cloner.tar initrd
    boot
}

menuentry "6. Universal Linux Boot Repair (GRUB 2 / EFI NVRAM / Initramfs Auto-Healer)" {
    multiboot2 /boot/securecurtain.bin rescue_mode=boot_repair scan_foreign_distros=1
    module2 /rescue/initrd_bootrepair.tar initrd
    boot
}

menuentry "7. GParted Partition Manager & File System Doctor (ext4/btrfs/xfs/ntfs)" {
    multiboot2 /boot/securecurtain.bin rescue_mode=gparted vfs_scan=all
    module2 /rescue/initrd_gparted.tar initrd
    boot
}

menuentry "8. Windows WinPE/WinRE BCD & Bootrec Repair (Native Offline BCD/MBR Fix)" {
    multiboot2 /boot/securecurtain.bin rescue_mode=win_bcd_repair scan_ntfs=1
    module2 /rescue/initrd_winrepair.tar initrd
    boot
}

menuentry "9. Windows Offline SAM Password Reset & Unlock (NTPWEdit / chntpw)" {
    multiboot2 /boot/securecurtain.bin rescue_mode=ntpwedit target_sam=auto
    module2 /rescue/initrd_ntpwedit.tar initrd
    boot
}

menuentry "10. Offline Windows Registry Hive Editor (regedit / hivex BSOD Healer)" {
    multiboot2 /boot/securecurtain.bin rescue_mode=offline_regedit
    module2 /rescue/initrd_regedit.tar initrd
    boot
}

menuentry "11. R-Studio / GetDataBack & TestDisk (Raw NTFS/FAT Carving)" {
    multiboot2 /boot/securecurtain.bin rescue_mode=data_recovery_suite
    module2 /rescue/initrd_recovery.tar initrd
    boot
}

menuentry "12. Clonezilla & Guymager (Forensic E01 & Multicast Disk Imaging)" {
    multiboot2 /boot/securecurtain.bin rescue_mode=clonezilla_guymager
    module2 /rescue/initrd_clonezilla.tar initrd
    boot
}

menuentry "13. SD & MicroSD Flash Deep File Retriever (QPhotoRec / Scalpel / RAW Carve)" {
    multiboot2 /boot/securecurtain.bin rescue_mode=sd_flash_retriever scan_sd=all
    module2 /rescue/initrd_photorec.tar initrd
    boot
}

menuentry "14. FAT32 & exFAT Directory Table Healer (fatcat / fsck.vfat / fsck.exfat)" {
    multiboot2 /boot/securecurtain.bin rescue_mode=fat_exfat_healer
    module2 /rescue/initrd_fatcat.tar initrd
    boot
}

menuentry "15. GNU ddrescue & QPhotoRec (Damaged Sector Scraper & File Undelete)" {
    multiboot2 /boot/securecurtain.bin rescue_mode=ddrescue_testdisk
    module2 /rescue/initrd_testdisk.tar initrd
    boot
}

menuentry "16. Foreign Linux System Chroot Shell & Kernel Rollback Wizard" {
    multiboot2 /boot/securecurtain.bin rescue_mode=chroot_shell auto_mount_root=1
    module2 /rescue/initrd_chroot.tar initrd
    boot
}

menuentry "17. MemTest86+ v7.20 (Bare-Metal DRAM Audit & DDR5 Stress Test)" {
    linux16 /boot/memtest86+.bin
    boot
}

menuentry "18. Prime95 / mprime (CPU Stability, AVX-512 & Thermal Stress)" {
    multiboot2 /boot/securecurtain.bin rescue_mode=prime95_stress
    module2 /rescue/initrd_prime95.tar initrd
    boot
}

menuentry "19. NWipe / DBAN (NIST SP 800-88 & DoD 5220.22-M Secure Disk Wipe)" {
    multiboot2 /boot/securecurtain.bin rescue_mode=nwipe_dban
    module2 /rescue/initrd_nwipe.tar initrd
    boot
}

menuentry "20. Super GRUB2 Disk (Universal EFI / MBR Multi-OS Boot Bypass)" {
    multiboot2 /boot/securecurtain.bin rescue_mode=super_grub2
    module2 /rescue/initrd_supergrub2.tar initrd
    boot
}

menuentry "21. BitLocker To Go & LUKS Offline Decryption Assist (dislocker / cryptsetup)" {
    multiboot2 /boot/securecurtain.bin rescue_mode=bitlocker_luks_assist
    module2 /rescue/initrd_dislocker.tar initrd
    boot
}

menuentry "22. RAW Video Hex Healer & MOOV Atom Rebuilder (untrunc / ffmpeg)" {
    multiboot2 /boot/securecurtain.bin rescue_mode=video_moov_healer
    module2 /rescue/initrd_untrunc.tar initrd
    boot
}

menuentry "23. Encrypted Cloud Backup & Remote Mirror (rclone / AWS S3 / SFTP)" {
    multiboot2 /boot/securecurtain.bin rescue_mode=cloud_backup_rclone
    module2 /rescue/initrd_rclone.tar initrd
    boot
}

menuentry "24. Forensic Kernel Write-Blocker Enforcement (NIST SP 800-86 /sys/block/*/ro)" {
    multiboot2 /boot/securecurtain.bin rescue_mode=forensic_writeblocker enforce_ro=all
    module2 /rescue/initrd_writeblock.tar initrd
    boot
}

menuentry "25. Volatile Memory Dump & Live RAM Triage (LiME / AVML / Volatility 3)" {
    multiboot2 /boot/securecurtain.bin rescue_mode=volatile_memory_triage acquire_ram=direct
    module2 /rescue/initrd_avml.tar initrd
    boot
}

menuentry "26. OEM Hardware Stress & Diagnostic Suite (MemTest86+ / Prime95 / SMART IOPS)" {
    multiboot2 /boot/securecurtain.bin rescue_mode=hardware_stress_suite torture=all
    module2 /rescue/initrd_stress.tar initrd
    boot
}

menuentry "27. Automated Forensic Audit & Chain-of-Custody Report Generator (PDF / Manifest)" {
    multiboot2 /boot/securecurtain.bin rescue_mode=forensic_report_gen sign_hsm=1
    module2 /rescue/initrd_report.tar initrd
    boot
}

menuentry "28. Offline Windows SAM & Registry Password Assist (chntpw / hivex / RID 500)" {
    multiboot2 /boot/securecurtain.bin rescue_mode=windows_sam_chntpw unlock_admin=1
    module2 /rescue/initrd_chntpw.tar initrd
    boot
}

menuentry "29. Air-Gapped Certified Data Sanitizer & NVMe Crypto-Erase (NIST SP 800-88 / DoD)" {
    multiboot2 /boot/securecurtain.bin rescue_mode=data_sanitizer crypto_erase=all
    module2 /rescue/initrd_sanitizer.tar initrd
    boot
}

menuentry "30. Offline UEFI / BIOS Rootkit & SPI Flash Scanner (Chipsec / Flashrom / SMM)" {
    multiboot2 /boot/securecurtain.bin rescue_mode=uefi_rootkit_scan audit_smm=1
    module2 /rescue/initrd_chipsec.tar initrd
    boot
}

menuentry "31. Forensic Super-Timeline & Artifact Reconstructor (Plaso / MFT / EVTX)" {
    multiboot2 /boot/securecurtain.bin rescue_mode=supertimeline parse_all=1
    module2 /rescue/initrd_plaso.tar initrd
    boot
}

menuentry "32. Air-Gapped Stealth Network Triage & Rogue Hunter (Zeek / Zero-Emission TAP)" {
    multiboot2 /boot/securecurtain.bin rescue_mode=stealth_network zero_emission=1
    module2 /rescue/initrd_zeek.tar initrd
    boot
}

menuentry "33. Offline Multi-Engine YARA & Ransomware Neutralizer (BYOVD Purge / Decryptor)" {
    multiboot2 /boot/securecurtain.bin rescue_mode=offline_yara sanitize_byovd=1
    module2 /rescue/initrd_yara.tar initrd
    boot
}

menuentry "34. Arch Pacman & Yay AUR Package Manager (GPG Keyrings & Binary Pool)" {
    multiboot2 /boot/securecurtain.bin rescue_mode=pacman_yay_pool init_keyrings=1
    module2 /rescue/initrd_pacman.tar initrd
    boot
}

menuentry "35. Multi-Distro Repository Hook (Debian Trixie, Kali Rolling & Arch Mirrors)" {
    multiboot2 /boot/securecurtain.bin rescue_mode=multidistro_repos auto_sync=1
    module2 /rescue/initrd_multirepo.tar initrd
    boot
}
`;
  };

  // Handle Build Simulation
  const handleStartBuild = () => {
    setIsBuilding(true);
    setBuildProgress(5);
    setBuildLogs([
      '[*] Initializing SecureCurtain Multi-Tool Live USB pipeline...',
      '[*] Profile: ' + isoProfile.toUpperCase() + ' (UEFI + BIOS Hybrid Boot)'
    ]);

    const steps = [
      { p: 8, msg: '[AS] Compiling /sys/boot/boot.asm -> boot.o (PML4 paging & EFER setup)' },
      { p: 16, msg: '[CC] Compiling /sys/kernel/kernel.c -> kernel.o (Watchdog supervisor init)' },
      { p: 24, msg: '[MOD] Integrating Hardware Pre-Flight & Requirement Benchmark Suite' },
      { p: 32, msg: '[GPT] Bundling MBR to GPT in-place lossless conversion engine (gdisk / sgdisk)' },
      { p: 40, msg: '[CLONE] Packing Forensic Bit-to-Bit Cloner & Kernel Write-Blocker module' },
      { p: 48, msg: '[REP] Packing Universal Linux Boot Repair (GRUB 2 EFI / NVRAM / Chroot)' },
      { p: 56, msg: '[WIN] Packing Windows Offline Suite: BCDBoot, NTPWEdit SAM Unlocker, RegEdit & DISM' },
      { p: 65, msg: '[FS] Bundling GParted, e2fsprogs, btrfs-progs, ntfs-3g, badblocks doctor' },
      { p: 74, msg: '[REC] Packing R-Studio, GetDataBack, ddrescue, TestDisk & QPhotoRec Carvers' },
      { p: 82, msg: '[IMG] Embedding Clonezilla, Partclone & Guymager E01 Forensic Streamer' },
      { p: 90, msg: '[HW] Packaging MemTest86+ v7.20, Prime95 mprime & NWipe/DBAN DoD Wiper' },
      { p: 100, msg: '[✓] SUCCESS: SecureCurtain-MultiTool-LiveUSB-x86_64.iso compiled with 18+ Industrial Rescue Tools!' }
    ];

    steps.forEach((step, idx) => {
      setTimeout(() => {
        setBuildProgress(step.p);
        setBuildLogs(prev => [...prev, step.msg]);
        if (idx === steps.length - 1) {
          setIsBuilding(false);
          setIsIsoReady(true);
          addNotification({
            title: 'Live USB Image Packaged',
            message: 'Bootable Live USB & Rescue ISO is ready with MBR->GPT and Forensic Write-Blocker Cloner.',
            type: 'success',
            appId: 'iso-builder'
          });
        }
      }, (idx + 1) * 320);
    });
  };

  // Handle Live USB Flashing Simulation
  const handleStartFlashing = () => {
    setIsFlashing(true);
    setFlashProgress(0);
    setFlashComplete(false);
    setFlashLog([
      `[>] Unmounting target partitions on ${selectedUsb}...`,
      `[>] Target drive: ${usbDrives.find(d => d.device === selectedUsb)?.name || selectedUsb}`,
      `[>] Writing SecureCurtain Multi-Tool Hybrid Live ISO (Direct I/O block stream)...`
    ]);

    const flashSteps = [
      { p: 15, msg: `[DD] Writing MBR & GPT partition tables (ESP + Root + Recovery + Persistence)...` },
      { p: 35, msg: `[DD] Writing Microkernel Core & Ring 3 Subsystems (540 MB / ~400 MB/s)...` },
      { p: 55, msg: `[DD] Writing GParted, MBR2GPT, Cloner, Boot Repair & Diagnostic Ramdisks...` },
      { p: 75, msg: `[DD] Creating ${persistenceSizeGb}GB Ext4 Persistent Writable Storage Partition (/casper-rw)...` },
      { p: 90, msg: `[SYNC] Flushing write buffers and syncing dirty kernel pages (fsync)...` },
      { p: 100, msg: `[✓] SUCCESS: Live USB successfully created on ${selectedUsb}! Safe to unplug and boot.` }
    ];

    flashSteps.forEach((step, idx) => {
      setTimeout(() => {
        setFlashProgress(step.p);
        setFlashLog(prev => [...prev, step.msg]);
        if (idx === flashSteps.length - 1) {
          setIsFlashing(false);
          setFlashComplete(true);
          addNotification({
            title: 'Live USB Created Successfully',
            message: `Your bootable repair & installation USB on ${selectedUsb} is ready.`,
            type: 'success',
            appId: 'iso-builder'
          });
        }
      }, (idx + 1) * 400);
    });
  };

  // Handle MBR to GPT In-Place Conversion Simulation
  const handleRunMbrToGpt = () => {
    setIsConvertingMbr(true);
    setMbrConvertProgress(0);
    setMbrConvertDone(false);
    setMbrConvertLogs([
      `[*] Auditing target drive ${selectedMbrDisk} for MBR to GPT conversion...`,
      `[*] Checking partition alignment and end-of-disk 33-sector reserve space...`
    ]);

    const steps = [
      { p: 20, msg: `[BACKUP] Backing up MBR sector 0 and partition table to /root/mbr_backup_${selectedMbrDisk.replace('/dev/', '')}.bin` },
      { p: 40, msg: `[SCAN] Reading MBR primary & logical partition entries (Offsets verified safe)` },
      { p: 65, msg: `[GPT] Writing Primary GPT Header (LBA 1) and GUID Partition Entry Arrays (LBA 2-33)` },
      { p: 85, msg: `[GPT] Writing Backup Secondary GPT Header at disk termination (LBA 976,773,134)` },
      { p: 95, msg: `[KERNEL] Notifying kernel of new partition table geometry via partprobe ${selectedMbrDisk}` },
      { p: 100, msg: `[✓] SUCCESS: ${selectedMbrDisk} converted from MBR to GPT without any data loss! Ready for pure UEFI booting.` }
    ];

    steps.forEach((step, idx) => {
      setTimeout(() => {
        setMbrConvertProgress(step.p);
        setMbrConvertLogs(prev => [...prev, step.msg]);
        if (idx === steps.length - 1) {
          setIsConvertingMbr(false);
          setMbrConvertDone(true);
          addNotification({
            title: 'MBR to GPT Converted',
            message: `Drive ${selectedMbrDisk} successfully converted to GPT without data loss.`,
            type: 'success',
            appId: 'iso-builder'
          });
        }
      }, (idx + 1) * 420);
    });
  };

  // Handle Bit-to-Bit Raw Clone with Write Blocker Simulation
  const handleRunBitToBitClone = () => {
    if (cloneSourceDisk === cloneTargetDisk) {
      addNotification({
        title: 'Cloning Error',
        message: 'Source and Target disk cannot be the same physical block device.',
        type: 'error',
        appId: 'iso-builder'
      });
      return;
    }

    setIsCloning(true);
    setCloneProgress(0);
    setCloneHashMatch(null);
    setSourceSha256('');
    setTargetSha256('');
    setCloneLogs([
      `[🔒 WRITE-BLOCKER] Engaging kernel read-only lock: blockdev --setro ${cloneSourceDisk}`,
      `[🔒 WRITE-BLOCKER] Hardware write-protection flag enabled: /sys/block/${cloneSourceDisk.replace('/dev/', '')}/ro = 1`,
      `[🔒 WRITE-BLOCKER] Absolute Source Drive Write Blocker verified. Source is mathematically immune to writes.`,
      `[RAW CLONE] Initializing direct DMA sector stream from ${cloneSourceDisk} to ${cloneTargetDisk}...`
    ]);

    const generatedSha256 = 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855';

    const steps = [
      { p: 20, bytes: '200 GB / 1000 GB', speed: '440 MB/s', msg: `[STREAM] Cloned 200 GB (Sectors 0 - 419,430,400) - Error rate: 0 bad blocks` },
      { p: 45, bytes: '450 GB / 1000 GB', speed: '435 MB/s', msg: `[STREAM] Cloned 450 GB (Sectors 419,430,401 - 943,718,400) - Pass 1 Complete` },
      { p: 70, bytes: '700 GB / 1000 GB', speed: '425 MB/s', msg: `[STREAM] Cloned 700 GB (Sectors 943,718,401 - 1,468,006,400) - Transferring NVMe direct DMA` },
      { p: 90, bytes: '900 GB / 1000 GB', speed: '415 MB/s', msg: `[STREAM] Cloned 900 GB - Flushing buffer cache on target drive ${cloneTargetDisk}...` },
      { p: 98, bytes: '1000 GB / 1000 GB', speed: '400 MB/s', msg: `[FORENSIC] Computing bitstream SHA-256 cryptographic hashes for Source & Target...` },
      { p: 100, bytes: '1000 GB / 1000 GB', speed: '0 MB/s', msg: `[✓] BITSTREAM VERIFIED: SHA-256 MATCH: ${generatedSha256}` }
    ];

    steps.forEach((step, idx) => {
      setTimeout(() => {
        setCloneProgress(step.p);
        setClonedBytes(step.bytes);
        setCloneSpeed(step.speed);
        setCloneLogs(prev => [...prev, step.msg]);

        if (idx === steps.length - 1) {
          setIsCloning(false);
          setCloneHashMatch(true);
          setSourceSha256(generatedSha256);
          setTargetSha256(generatedSha256);
          addNotification({
            title: 'Forensic Bit-to-Bit Clone Complete',
            message: `100% Bit-for-bit exact copy created. Source drive write-blocker remained engaged throughout.`,
            type: 'success',
            appId: 'iso-builder'
          });
        }
      }, (idx + 1) * 500);
    });
  };

  // Handle Boot Repair Simulation
  const handleRunBootRepair = () => {
    setIsRepairingBoot(true);
    setRepairDone(false);
    setRepairLogs([
      `[*] Scanning all connected block devices for foreign Linux root partitions...`,
      `[*] Detected target: /dev/nvme0n1p2 (${selectedDistroToRepair.toUpperCase()} on Ext4 / Btrfs)`
    ]);

    const steps = [
      { msg: `[*] Auto-mounting /dev/nvme0n1p2 to /mnt/broken_system...` },
      { msg: `[*] Mounting virtual filesystems: /dev, /proc, /sys, /run -> /mnt/broken_system` },
      { msg: `[*] Inspecting EFI System Partition (/boot/efi on /dev/nvme0n1p1)...` },
      { msg: `[REPAIR] Executing chroot /mnt/broken_system grub-install --target=x86_64-efi --recheck` },
      { msg: `[REPAIR] Updating GRUB boot menu: chroot /mnt/broken_system update-grub2` },
      { msg: `[REPAIR] Re-generating initramfs image: update-initramfs -u -k all` },
      { msg: `[NVRAM] Adding fresh UEFI NVRAM bootloader entry via efibootmgr --create` },
      { msg: `[✓] REPAIR COMPLETE: Target Linux distribution repaired! System will now boot normally.` }
    ];

    steps.forEach((step, idx) => {
      setTimeout(() => {
        setRepairLogs(prev => [...prev, step.msg]);
        if (idx === steps.length - 1) {
          setIsRepairingBoot(false);
          setRepairDone(true);
          addNotification({
            title: 'Linux Bootloader Repaired',
            message: `Successfully fixed GRUB, EFI NVRAM, and initramfs for ${selectedDistroToRepair.toUpperCase()}.`,
            type: 'success',
            appId: 'iso-builder'
          });
        }
      }, (idx + 1) * 400);
    });
  };

  // Handle Hardware Requirements Benchmark Simulation
  const handleRunSysTest = () => {
    setIsRunningSysTest(true);
    setSysTestProgress(0);
    setSysTestResults(null);

    const progressTimer = setInterval(() => {
      setSysTestProgress(prev => {
        if (prev >= 100) {
          clearInterval(progressTimer);
          setIsRunningSysTest(false);
          setSysTestResults({
            cpu: {
              passed: true,
              score: 'Intel Core i9-14900K / Ryzen 9 (16 Cores / 32 Threads)',
              details: 'x86_64 Long Mode, AVX2, SSE4.2, SMEP, SMAP, and hardware virtualization (VT-x/AMD-V) verified.'
            },
            ram: {
              passed: true,
              score: '32 GB DDR5-6000 MHz (Passed 16 GB Threshold)',
              details: 'Physical memory topology verified. Full Ring 0 identity page tables mapped without fragmentation.'
            },
            disk: {
              passed: true,
              score: 'Samsung 970 EVO Plus / 990 PRO NVMe (PCIe 3.0 / 4.0 x4)',
              details: 'High-speed DMA bandwidth: 3,500+ MB/s sequential read. GPT partition structure supported.'
            },
            uefi: {
              passed: true,
              score: 'UEFI 2.80 + Secure Boot Capable',
              details: 'GOP framebuffer 1920x1080x32 supported. NVRAM variable storage operational.'
            }
          });
          addNotification({
            title: 'System Requirements Benchmark Complete',
            message: 'Target hardware meets 100% of SecureCurtain OS production requirements.',
            type: 'success',
            appId: 'iso-builder'
          });
          return 100;
        }
        return prev + 20;
      });
    }, 300);
  };

  const handleCopyScript = () => {
    navigator.clipboard.writeText(generateQemuScript());
    setCopiedScript(true);
    setTimeout(() => setCopiedScript(false), 2000);
  };

  const handleCopyDd = () => {
    navigator.clipboard.writeText(generateDdCommand());
    setCopiedDd(true);
    setTimeout(() => setCopiedDd(false), 2000);
  };

  const handleCopyMbr2Gpt = () => {
    navigator.clipboard.writeText(generateMbr2GptCommand());
    setCopiedMbr2GptCmd(true);
    setTimeout(() => setCopiedMbr2GptCmd(false), 2000);
  };

  const handleCopyCloneCmd = () => {
    navigator.clipboard.writeText(generateCloneCommand());
    setCopiedCloneCmd(true);
    setTimeout(() => setCopiedCloneCmd(false), 2000);
  };

  const handleDownloadFile = (filename: string, content: string) => {
    const element = document.createElement('a');
    const file = new Blob([content], { type: 'text/plain;charset=utf-8' });
    element.href = URL.createObjectURL(file);
    element.download = filename;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const handleDownloadIso = () => {
    const dummyIsoContent = `SecureCurtain OS 1.0 All-In-One Multi-Tool Live USB & Rescue ISO Image
Author: SecureCurtain Engineering Team
Features Included:
- SecureCurtain OS Live Desktop & Installer
- Hardware Pre-Flight & Requirement Benchmark
- In-Place Lossless MBR to GPT Converter (gdisk/mbr2gpt)
- Forensic Bit-to-Bit Raw Disk Cloner (Write-Blocked Source Read-Only Mode)
- Universal Linux Boot Repair (GRUB 2 / EFI NVRAM / Initramfs)
- GParted & File System Healer (ext4, btrfs, xfs, ntfs)
- Deep Bad Sector Scanner & S.M.A.R.T. Drive Doctor
- Foreign Distro Chroot Rescue Shell
- Windows Boot Manager & BCD Rebuilder
- MemTest86+ DRAM Stress Test
- Protected 32GB Golden Recovery Partition Snapshot

Write to USB via:
sudo dd if=SecureCurtain-MultiTool-LiveUSB-x86_64.iso of=${selectedUsb} bs=4M status=progress oflag=direct`;
    handleDownloadFile('SecureCurtain-MultiTool-LiveUSB-x86_64.iso', dummyIsoContent);
  };

  const handleDownloadSourceBundle = () => {
    const manifest = {
      project: "SecureCurtain OS Bare-Metal Kernel & Toolchain",
      author: "SecureCurtain Engineering Team",
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
          "sys/kernel/src/mm/pmm.c (Physical Memory Bitmap Allocator)",
          "sys/kernel/src/mm/vmm.c (4-level PML4 Paging & #PF Handler)",
          "sys/kernel/src/mm/heap.c (kmalloc/kfree Slab Allocator)",
          "sys/kernel/src/core/idt.c (256 Interrupt Gates & ISR Stubs)",
          "sys/kernel/src/core/tss.c (TSS Stack Switching IST1/IST2)",
          "sys/kernel/src/core/apic.c (LAPIC/IOAPIC & Timers)",
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
    handleDownloadFile('SecureCurtain-OS-Source-Manifest.json', JSON.stringify(manifest, null, 2));
  };

  return (
    <div className="h-full flex flex-col bg-[#07080d] text-white select-text overflow-hidden">
      {/* Top Banner Header */}
      <div className="p-3.5 border-b border-[#1b2030] bg-[#0c0f1a] flex flex-wrap items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-purple-950/60 border border-purple-500/30 text-purple-400">
            <Usb className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-white tracking-wide">
                Live USB, System Fix & Forensic Disk Studio
              </h2>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-purple-900/60 text-purple-200 border border-purple-500/40">
                SecureCurtain OS Core
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-950/60 text-emerald-300 border border-emerald-500/30">
                Multi-Tool / Rescue v2.5
              </span>
            </div>
            <p className="text-xs text-[#8090a8]">
              Create bootable Live USBs with OS Installer, MBR to GPT Converter, Write-Blocked Bit Cloner, GParted, and Boot Repair.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleDownloadSourceBundle}
            className="px-3 py-1.5 rounded-xl bg-[#121e1e] hover:bg-[#182b2b] text-emerald-300 border border-emerald-500/30 text-xs font-mono font-semibold flex items-center gap-1.5 transition-all shadow-sm"
            title="Export complete kernel C/ASM source manifest and build instructions"
          >
            <Code className="w-3.5 h-3.5" />
            <span>Export OS Sources</span>
          </button>

          <button
            onClick={handleStartBuild}
            disabled={isBuilding}
            className="px-3.5 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white font-mono text-xs font-bold flex items-center gap-2 transition-all shadow-lg shadow-purple-600/30"
          >
            {isBuilding ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Compiling ({buildProgress}%)...</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5" />
                <span>Build Hybrid ISO</span>
              </>
            )}
          </button>

          <button
            onClick={handleDownloadIso}
            disabled={!isIsoReady}
            className="px-3 py-1.5 rounded-xl bg-[#141b2b] hover:bg-[#1f2b45] text-sky-300 border border-sky-500/30 text-xs font-mono font-semibold flex items-center gap-1.5 transition-all"
            title="Download compiled .iso"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download .iso</span>
          </button>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="px-4 border-b border-[#1b2030] bg-[#090c14] flex items-center gap-1 shrink-0 overflow-x-auto py-1.5">
        <button
          onClick={() => setActiveTab('config')}
          className={`px-3 py-1.5 rounded-lg text-xs font-mono font-medium flex items-center gap-1.5 transition-all whitespace-nowrap ${
            activeTab === 'config'
              ? 'bg-purple-950/60 text-purple-200 border border-purple-500/40 shadow-sm'
              : 'text-[#8899aa] hover:text-white hover:bg-[#121624]'
          }`}
        >
          <Sliders className="w-3.5 h-3.5 text-purple-400" />
          <span>1. ISO & Features Config</span>
        </button>

        <button
          onClick={() => setActiveTab('live_usb')}
          className={`px-3 py-1.5 rounded-lg text-xs font-mono font-medium flex items-center gap-1.5 transition-all whitespace-nowrap ${
            activeTab === 'live_usb'
              ? 'bg-purple-950/60 text-purple-200 border border-purple-500/40 shadow-sm'
              : 'text-[#8899aa] hover:text-white hover:bg-[#121624]'
          }`}
        >
          <Flame className="w-3.5 h-3.5 text-amber-400" />
          <span>2. Live USB Writer (Burn)</span>
        </button>

        <button
          onClick={() => setActiveTab('disk_doctor')}
          className={`px-3 py-1.5 rounded-lg text-xs font-mono font-medium flex items-center gap-1.5 transition-all whitespace-nowrap ${
            activeTab === 'disk_doctor'
              ? 'bg-purple-950/60 text-purple-200 border border-purple-500/40 shadow-sm'
              : 'text-[#8899aa] hover:text-white hover:bg-[#121624]'
          }`}
        >
          <Database className="w-3.5 h-3.5 text-sky-400" />
          <span>3. MBR to GPT & Disk Doctor</span>
        </button>

        <button
          onClick={() => setActiveTab('forensic_clone')}
          className={`px-3 py-1.5 rounded-lg text-xs font-mono font-medium flex items-center gap-1.5 transition-all whitespace-nowrap ${
            activeTab === 'forensic_clone'
              ? 'bg-purple-950/60 text-purple-200 border border-purple-500/40 shadow-sm'
              : 'text-[#8899aa] hover:text-white hover:bg-[#121624]'
          }`}
        >
          <Lock className="w-3.5 h-3.5 text-emerald-400" />
          <span>4. Bit-to-Bit Clone & Write Blocker</span>
        </button>

        <button
          onClick={() => setActiveTab('repair_suite')}
          className={`px-3 py-1.5 rounded-lg text-xs font-mono font-medium flex items-center gap-1.5 transition-all whitespace-nowrap ${
            activeTab === 'repair_suite'
              ? 'bg-purple-950/60 text-purple-200 border border-purple-500/40 shadow-sm'
              : 'text-[#8899aa] hover:text-white hover:bg-[#121624]'
          }`}
        >
          <Wrench className="w-3.5 h-3.5 text-amber-400" />
          <span>5. Linux Boot Repair & GParted</span>
        </button>

        <button
          onClick={() => setActiveTab('flash_retriever')}
          className={`px-3 py-1.5 rounded-lg text-xs font-mono font-medium flex items-center gap-1.5 transition-all whitespace-nowrap ${
            activeTab === 'flash_retriever'
              ? 'bg-purple-950/80 text-purple-200 border border-purple-500/60 shadow-md shadow-purple-950/50'
              : 'text-[#8899aa] hover:text-white hover:bg-[#121624]'
          }`}
        >
          <Camera className="w-3.5 h-3.5 text-pink-400" />
          <span>6. SD & Flash Card Retriever</span>
        </button>

        <button
          onClick={() => setActiveTab('tool_catalog')}
          className={`px-3 py-1.5 rounded-lg text-xs font-mono font-medium flex items-center gap-1.5 transition-all whitespace-nowrap ${
            activeTab === 'tool_catalog'
              ? 'bg-purple-950/60 text-purple-200 border border-purple-500/40 shadow-sm'
              : 'text-[#8899aa] hover:text-white hover:bg-[#121624]'
          }`}
        >
          <Grid className="w-3.5 h-3.5 text-purple-400" />
          <span>7. WinPE, Forensics & HW Suite (23+)</span>
        </button>

        <button
          onClick={() => setActiveTab('sys_test')}
          className={`px-3 py-1.5 rounded-lg text-xs font-mono font-medium flex items-center gap-1.5 transition-all whitespace-nowrap ${
            activeTab === 'sys_test'
              ? 'bg-purple-950/60 text-purple-200 border border-purple-500/40 shadow-sm'
              : 'text-[#8899aa] hover:text-white hover:bg-[#121624]'
          }`}
        >
          <Stethoscope className="w-3.5 h-3.5 text-cyan-400" />
          <span>8. System Requirements Test</span>
        </button>

        <button
          onClick={() => setActiveTab('scripts')}
          className={`px-3 py-1.5 rounded-lg text-xs font-mono font-medium flex items-center gap-1.5 transition-all whitespace-nowrap ${
            activeTab === 'scripts'
              ? 'bg-purple-950/60 text-purple-200 border border-purple-500/40 shadow-sm'
              : 'text-[#8899aa] hover:text-white hover:bg-[#121624]'
          }`}
        >
          <FileCode className="w-3.5 h-3.5 text-indigo-400" />
          <span>9. GRUB & QEMU Scripts</span>
        </button>

        <button
          onClick={() => setActiveTab('bare_metal_roadmap')}
          className={`px-3 py-1.5 rounded-lg text-xs font-mono font-medium flex items-center gap-1.5 transition-all whitespace-nowrap ${
            activeTab === 'bare_metal_roadmap'
              ? 'bg-emerald-950/80 text-emerald-200 border border-emerald-500/60 shadow-md shadow-emerald-950/50'
              : 'text-[#8899aa] hover:text-white hover:bg-[#121624]'
          }`}
        >
          <Cpu className="w-3.5 h-3.5 text-emerald-400" />
          <span>10. Bare-Metal OS Roadmap</span>
        </button>
      </div>

      {/* Main Tab Viewport */}
      <div className="flex-1 overflow-y-auto p-4">
        {/* TAB 1: BUILD CONFIGURATION */}
        {activeTab === 'config' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            {/* Left Column: Image Profile & Rescue Modules */}
            <div className="lg:col-span-6 space-y-4">
              {/* Image Target Profile */}
              <div className="bg-[#0c0f18] p-4 rounded-xl border border-[#1b2234] space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold font-mono text-[#cbd5e1] uppercase">
                  <Layers className="w-4 h-4 text-purple-400" />
                  <span>Target Image Profile</span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <button
                    onClick={() => setIsoProfile('all_in_one')}
                    className={`p-3 rounded-lg border text-left font-mono transition-all ${
                      isoProfile === 'all_in_one'
                        ? 'bg-purple-950/60 border-purple-500 text-white shadow-sm'
                        : 'bg-[#101422] border-[#222b40] text-[#708098] hover:text-white'
                    }`}
                  >
                    <div className="font-bold flex items-center justify-between">
                      <span>Multi-Tool Live USB</span>
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-purple-900 text-purple-200">Recommended</span>
                    </div>
                    <div className="text-[11px] text-[#8fa0b5] mt-1">
                      OS Installer + MBR-to-GPT + Write-Blocked Bit Cloner + Boot Repair + GParted.
                    </div>
                  </button>

                  <button
                    onClick={() => setIsoProfile('rescue_fix_disk')}
                    className={`p-3 rounded-lg border text-left font-mono transition-all ${
                      isoProfile === 'rescue_fix_disk'
                        ? 'bg-purple-950/60 border-purple-500 text-white shadow-sm'
                        : 'bg-[#101422] border-[#222b40] text-[#708098] hover:text-white'
                    }`}
                  >
                    <div className="font-bold">System Fix & Rescue Disk</div>
                    <div className="text-[11px] text-[#8fa0b5] mt-1">
                      Dedicated diagnostic utility for repairing broken Linux/Windows unbootable systems.
                    </div>
                  </button>

                  <button
                    onClick={() => setIsoProfile('installer_only')}
                    className={`p-3 rounded-lg border text-left font-mono transition-all ${
                      isoProfile === 'installer_only'
                        ? 'bg-purple-950/60 border-purple-500 text-white shadow-sm'
                        : 'bg-[#101422] border-[#222b40] text-[#708098] hover:text-white'
                    }`}
                  >
                    <div className="font-bold">Clean Production Installer</div>
                    <div className="text-[11px] text-[#8fa0b5] mt-1">
                      Bare-metal installation wizard with 32GB Golden Partition provisioning.
                    </div>
                  </button>

                  <button
                    onClick={() => setIsoProfile('minimal')}
                    className={`p-3 rounded-lg border text-left font-mono transition-all ${
                      isoProfile === 'minimal'
                        ? 'bg-purple-950/60 border-purple-500 text-white shadow-sm'
                        : 'bg-[#101422] border-[#222b40] text-[#708098] hover:text-white'
                    }`}
                  >
                    <div className="font-bold">Minimal Microkernel VM</div>
                    <div className="text-[11px] text-[#8fa0b5] mt-1">
                      Ultra-compact core kernel image with QEMU VirtIO drivers.
                    </div>
                  </button>
                </div>
              </div>

              {/* Embedded Rescue & Fix Utilities */}
              <div className="bg-[#0c0f18] p-4 rounded-xl border border-[#1b2234] space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-bold font-mono text-[#cbd5e1] uppercase">
                    <Wrench className="w-4 h-4 text-emerald-400" />
                    <span>Embedded Rescue & System Fix Suite</span>
                  </div>
                  <span className="text-[10px] font-mono text-emerald-400">All Modules Integrated</span>
                </div>

                <div className="space-y-2 text-xs">
                  {/* MBR to GPT Converter Toggle */}
                  <label className="flex items-start gap-2.5 p-2.5 rounded-lg bg-[#111624] border border-[#1d263b] cursor-pointer hover:border-sky-500/40 transition-all">
                    <input
                      type="checkbox"
                      checked={includeMbrToGptConverter}
                      onChange={(e) => setIncludeMbrToGptConverter(e.target.checked)}
                      className="mt-0.5 rounded border-[#334155] bg-[#1a2234] text-purple-600 focus:ring-0"
                    />
                    <div>
                      <div className="font-bold text-white font-mono flex items-center gap-2">
                        <span>MBR to GPT In-Place Lossless Converter</span>
                        <span className="text-[9px] px-1.5 py-0.2 rounded bg-sky-950 text-sky-300 border border-sky-500/30">Zero Data Loss</span>
                      </div>
                      <p className="text-[11px] text-[#8899aa]">
                        Converts legacy MBR drives to modern UEFI GPT partition tables without deleting user files, preserving partition sector alignment.
                      </p>
                    </div>
                  </label>

                  {/* Forensic Bit-to-Bit Cloner Toggle */}
                  <label className="flex items-start gap-2.5 p-2.5 rounded-lg bg-[#111624] border border-[#1d263b] cursor-pointer hover:border-emerald-500/40 transition-all">
                    <input
                      type="checkbox"
                      checked={includeBitToBitCloner}
                      onChange={(e) => setIncludeBitToBitCloner(e.target.checked)}
                      className="mt-0.5 rounded border-[#334155] bg-[#1a2234] text-purple-600 focus:ring-0"
                    />
                    <div>
                      <div className="font-bold text-white font-mono flex items-center gap-2">
                        <span>Bit-to-Bit Raw Disk Cloner with Source Write Blocker</span>
                        <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-950 text-emerald-300 border border-emerald-500/30">Read-Only Guard</span>
                      </div>
                      <p className="text-[11px] text-[#8899aa]">
                        Forensic sector-by-sector clone engine that enforces an absolute kernel write-blocker on the source drive (`blockdev --setro`), verifying bitstream with SHA-256.
                      </p>
                    </div>
                  </label>

                  {/* Universal Linux Boot Repair */}
                  <label className="flex items-start gap-2.5 p-2.5 rounded-lg bg-[#111624] border border-[#1d263b] cursor-pointer hover:border-amber-500/40 transition-all">
                    <input
                      type="checkbox"
                      checked={includeLinuxBootRepair}
                      onChange={(e) => setIncludeLinuxBootRepair(e.target.checked)}
                      className="mt-0.5 rounded border-[#334155] bg-[#1a2234] text-purple-600 focus:ring-0"
                    />
                    <div>
                      <div className="font-bold text-white font-mono flex items-center gap-2">
                        <span>Universal Linux Boot Repair</span>
                        <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-950 text-amber-300 border border-amber-500/30">Auto GRUB/EFI</span>
                      </div>
                      <p className="text-[11px] text-[#8899aa]">
                        Fixes unbootable Linux systems (Ubuntu, Debian, Fedora, Arch, RHEL). Rebuilds GRUB 2, EFI NVRAM entries, and corrupted initramfs.
                      </p>
                    </div>
                  </label>

                  {/* GParted Partition Manager */}
                  <label className="flex items-start gap-2.5 p-2.5 rounded-lg bg-[#111624] border border-[#1d263b] cursor-pointer hover:border-purple-500/40 transition-all">
                    <input
                      type="checkbox"
                      checked={includeGparted}
                      onChange={(e) => setIncludeGparted(e.target.checked)}
                      className="mt-0.5 rounded border-[#334155] bg-[#1a2234] text-purple-600 focus:ring-0"
                    />
                    <div>
                      <div className="font-bold text-white font-mono flex items-center gap-2">
                        <span>GParted Partition Doctor & Bad Sector Scanner</span>
                        <span className="text-[9px] px-1.5 py-0.2 rounded bg-purple-950 text-purple-300 border border-purple-500/30">Ext4/Btrfs/XFS/NTFS</span>
                      </div>
                      <p className="text-[11px] text-[#8899aa]">
                        Non-destructive partition resizing, UUID regeneration, GPT table repair, badblocks mapping, and filesystem consistency checks.
                      </p>
                    </div>
                  </label>
                </div>
              </div>
            </div>

            {/* Right Column: Bootloader, Persistence & Build Console */}
            <div className="lg:col-span-6 space-y-4">
              {/* Bootloader & Writable Persistence Settings */}
              <div className="bg-[#0c0f18] p-4 rounded-xl border border-[#1b2234] space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold font-mono text-[#cbd5e1] uppercase">
                  <Usb className="w-4 h-4 text-sky-400" />
                  <span>Bootloader & Live USB Persistence</span>
                </div>

                <div className="grid grid-cols-3 gap-2 text-xs">
                  <button
                    onClick={() => setBootMode('hybrid')}
                    className={`p-2.5 rounded-lg border text-center font-mono transition-all ${
                      bootMode === 'hybrid'
                        ? 'bg-purple-950/60 border-purple-500 text-white shadow-sm'
                        : 'bg-[#101422] border-[#222b40] text-[#708098] hover:text-white'
                    }`}
                  >
                    <div className="font-bold">Dual Hybrid</div>
                    <div className="text-[10px] text-purple-300">UEFI + BIOS MBR</div>
                  </button>

                  <button
                    onClick={() => setBootMode('uefi')}
                    className={`p-2.5 rounded-lg border text-center font-mono transition-all ${
                      bootMode === 'uefi'
                        ? 'bg-purple-950/60 border-purple-500 text-white shadow-sm'
                        : 'bg-[#101422] border-[#222b40] text-[#708098] hover:text-white'
                    }`}
                  >
                    <div className="font-bold">Pure UEFI</div>
                    <div className="text-[10px] text-purple-300">GPT / BOOTX64</div>
                  </button>

                  <button
                    onClick={() => setBootMode('bios')}
                    className={`p-2.5 rounded-lg border text-center font-mono transition-all ${
                      bootMode === 'bios'
                        ? 'bg-purple-950/60 border-purple-500 text-white shadow-sm'
                        : 'bg-[#101422] border-[#222b40] text-[#708098] hover:text-white'
                    }`}
                  >
                    <div className="font-bold">Legacy BIOS</div>
                    <div className="text-[10px] text-purple-300">El Torito MBR</div>
                  </button>
                </div>

                <div className="pt-2 border-t border-[#1c2438] space-y-2">
                  <label className="flex items-center justify-between text-xs text-[#cbd5e1] cursor-pointer">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={enablePersistence}
                        onChange={(e) => setEnablePersistence(e.target.checked)}
                        className="rounded border-[#334155] bg-[#1a2234] text-purple-600 focus:ring-0"
                      />
                      <span>Enable Persistent Live Storage (`/casper-rw` ext4 overlay)</span>
                    </div>
                    <span className="text-[10px] font-mono text-purple-400">Saves Diagnostics & Tool State</span>
                  </label>

                  {enablePersistence && (
                    <div className="pl-6 flex items-center gap-3">
                      <span className="text-[11px] font-mono text-[#8899aa]">Overlay Size:</span>
                      <select
                        value={persistenceSizeGb}
                        onChange={(e) => setPersistenceSizeGb(Number(e.target.value))}
                        className="bg-[#121624] border border-[#232d46] rounded-lg px-2.5 py-1 text-white font-mono text-xs focus:outline-none focus:border-purple-500"
                      >
                        <option value={4}>4 GB Persistent Cache</option>
                        <option value={8}>8 GB Persistent Overlay (Recommended)</option>
                        <option value={16}>16 GB Full Workstation Overlay</option>
                        <option value={32}>32 GB Maximum Storage</option>
                      </select>
                    </div>
                  )}
                </div>
              </div>

              {/* Build Execution Terminal */}
              <div className="bg-[#05060a] p-4 rounded-xl border border-[#1b2030] flex flex-col space-y-2 min-h-[260px]">
                <div className="flex items-center justify-between border-b border-[#191f30] pb-2">
                  <div className="flex items-center gap-2 text-xs font-mono text-purple-400 font-bold">
                    <Terminal className="w-4 h-4" />
                    <span>Compiler & Multi-Tool ISO Linker</span>
                  </div>
                  <span className="text-[10px] font-mono text-[#667799]">
                    SecureCurtain-MultiTool-LiveUSB.iso
                  </span>
                </div>

                {/* Progress Bar */}
                {isBuilding && (
                  <div className="w-full bg-[#111624] h-1.5 rounded-full overflow-hidden">
                    <div 
                      className="bg-purple-500 h-full transition-all duration-300 shadow-[0_0_12px_#a855f7]"
                      style={{ width: `${buildProgress}%` }}
                    />
                  </div>
                )}

                {/* Log Stream */}
                <div className="flex-1 font-mono text-[11px] text-[#94a3b8] space-y-1 overflow-y-auto max-h-[200px] bg-[#020305] p-3 rounded-lg border border-[#131826]">
                  {buildLogs.map((log, idx) => (
                    <div 
                      key={idx} 
                      className={
                        log.includes('SUCCESS') 
                          ? 'text-emerald-400 font-bold' 
                          : log.includes('Compiling') || log.includes('Packing') || log.includes('GPT')
                          ? 'text-sky-300' 
                          : 'text-[#8899aa]'
                      }
                    >
                      {log}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: LIVE USB FLASH WRITER */}
        {activeTab === 'live_usb' && (
          <div className="max-w-4xl mx-auto space-y-4">
            <div className="bg-[#0c0f18] p-5 rounded-xl border border-[#1b2234] space-y-4">
              <div className="flex items-center justify-between border-b border-[#1b2234] pb-3">
                <div className="flex items-center gap-2.5">
                  <Flame className="w-5 h-5 text-amber-400" />
                  <div>
                    <h3 className="text-sm font-bold text-white font-mono">Live USB Flasher (Bare-Metal Writer)</h3>
                    <p className="text-xs text-[#8090a8]">Write the multi-tool hybrid live image directly to a connected USB flash drive</p>
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded text-xs font-mono bg-amber-950/60 text-amber-300 border border-amber-500/40">
                  Direct I/O Mode
                </span>
              </div>

              {/* USB Drive Selector */}
              <div className="space-y-2">
                <label className="text-xs font-mono text-[#cbd5e1] block">Select Target USB Flash Device:</label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {usbDrives.map((usb) => (
                    <button
                      key={usb.id}
                      onClick={() => setSelectedUsb(usb.device)}
                      className={`p-3.5 rounded-xl border text-left font-mono transition-all ${
                        selectedUsb === usb.device
                          ? 'bg-amber-950/40 border-amber-500 text-white shadow-md shadow-amber-950/30'
                          : 'bg-[#101422] border-[#222b40] text-[#708098] hover:text-white'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs text-white">{usb.device}</span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#1e273d] text-sky-300">{usb.sizeGb} GB</span>
                      </div>
                      <div className="text-xs font-semibold text-[#cbd5e1] mt-1 truncate">{usb.name}</div>
                      <div className="text-[10px] text-amber-400/80 mt-1">{usb.speed}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="p-4 rounded-xl bg-[#080b12] border border-[#1b2234] flex flex-wrap items-center justify-between gap-3">
                <div className="text-xs font-mono text-[#94a3b8]">
                  Target: <span className="text-amber-300 font-bold">{selectedUsb}</span> • ISO: <span className="text-purple-300 font-bold">SecureCurtain-MultiTool-LiveUSB.iso</span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleCopyDd}
                    className="px-3 py-1.5 rounded-lg bg-[#141b2b] hover:bg-[#1f2b45] text-xs font-mono text-sky-300 border border-sky-500/30 flex items-center gap-1.5"
                  >
                    {copiedDd ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedDd ? 'Copied dd Command' : 'Copy dd Command'}</span>
                  </button>

                  <button
                    onClick={handleStartFlashing}
                    disabled={isFlashing}
                    className="px-4 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white font-mono text-xs font-bold flex items-center gap-2 transition-all shadow-lg shadow-amber-600/30"
                  >
                    {isFlashing ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Flashing ({flashProgress}%)...</span>
                      </>
                    ) : (
                      <>
                        <Flame className="w-3.5 h-3.5" />
                        <span>Flash to USB Drive</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Flash Execution Console */}
              {(isFlashing || flashLog.length > 0) && (
                <div className="bg-[#05060a] p-4 rounded-xl border border-[#1b2030] space-y-2">
                  <div className="flex items-center justify-between text-xs font-mono text-amber-400 font-bold border-b border-[#182030] pb-2">
                    <span>Block Write & Verification Progress</span>
                    <span>{flashProgress}%</span>
                  </div>

                  <div className="w-full bg-[#111624] h-2 rounded-full overflow-hidden">
                    <div 
                      className="bg-amber-500 h-full transition-all duration-300 shadow-[0_0_12px_#f59e0b]"
                      style={{ width: `${flashProgress}%` }}
                    />
                  </div>

                  <div className="font-mono text-[11px] text-[#94a3b8] space-y-1 max-h-[160px] overflow-y-auto bg-[#020305] p-3 rounded-lg border border-[#131826]">
                    {flashLog.map((log, idx) => (
                      <div key={idx} className={log.includes('SUCCESS') ? 'text-emerald-400 font-bold' : 'text-[#cbd5e1]'}>
                        {log}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 3: MBR TO GPT CONVERTER & DISK DOCTOR */}
        {activeTab === 'disk_doctor' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            {/* Left Column: MBR to GPT In-Place Converter */}
            <div className="lg:col-span-7 space-y-4">
              <div className="bg-[#0c0f18] p-5 rounded-xl border border-[#1b2234] space-y-4">
                <div className="flex items-center justify-between border-b border-[#1b2234] pb-3">
                  <div className="flex items-center gap-2.5">
                    <Database className="w-5 h-5 text-sky-400" />
                    <div>
                      <h3 className="text-sm font-bold text-white font-mono">Non-Destructive MBR to GPT Converter</h3>
                      <p className="text-xs text-[#8090a8]">Convert legacy BIOS MBR disks to UEFI GPT partition tables without losing any data</p>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-sky-950 text-sky-300 border border-sky-500/30">
                    gdisk / sgdisk Engine
                  </span>
                </div>

                {/* Target Drive Selector */}
                <div className="space-y-2">
                  <label className="text-xs font-mono text-[#cbd5e1] block">Select Disk to Convert to GPT:</label>
                  <div className="space-y-2">
                    {systemDisks.map((disk) => (
                      <button
                        key={disk.id}
                        onClick={() => setSelectedMbrDisk(disk.device)}
                        className={`w-full p-3.5 rounded-xl border text-left font-mono transition-all flex flex-col md:flex-row md:items-center justify-between gap-2 ${
                          selectedMbrDisk === disk.device
                            ? 'bg-sky-950/40 border-sky-500 text-white shadow-sm'
                            : 'bg-[#101422] border-[#222b40] text-[#708098] hover:text-white'
                        }`}
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-xs text-white">{disk.device}</span>
                            <span className={`text-[10px] px-1.5 py-0.2 rounded ${disk.tableType === 'MBR' ? 'bg-amber-950 text-amber-300 border border-amber-500/30' : 'bg-emerald-950 text-emerald-300 border border-emerald-500/30'}`}>
                              {disk.tableType} Table
                            </span>
                            <span className="text-xs text-sky-300 font-semibold">{disk.sizeGb} GB</span>
                          </div>
                          <div className="text-[11px] text-[#8fa0b5] mt-1">{disk.name} ({disk.serial})</div>
                        </div>

                        <div className="text-[11px] font-mono text-[#8fa0b5] text-right">
                          <span className={disk.tableType === 'MBR' ? 'text-amber-400 font-bold' : 'text-emerald-400'}>
                            {disk.status}
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Partition Layout Preview of Selected Disk */}
                <div className="p-3.5 rounded-xl bg-[#080b12] border border-[#1b2234] space-y-2">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="text-[#cbd5e1]">Partition Structure & Offset Alignment:</span>
                    <span className="text-sky-300 font-bold">{selectedMbrDisk}</span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
                    {systemDisks.find(d => d.device === selectedMbrDisk)?.partitions.map((p, idx) => (
                      <div key={idx} className="p-2 rounded bg-[#111624] border border-[#1e273e] flex items-center justify-between">
                        <div>
                          <div className="text-white font-bold">{p.name}</div>
                          <div className="text-[#8899aa] text-[10px]">{p.label}</div>
                        </div>
                        <div className="text-right">
                          <div className="text-sky-300">{p.size}</div>
                          <div className="text-emerald-400 text-[10px]">{p.fs}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-wrap items-center justify-between p-3.5 rounded-xl bg-[#111624] border border-[#1e273e] gap-3">
                  <button
                    onClick={handleCopyMbr2Gpt}
                    className="px-3 py-1.5 rounded-lg bg-[#141b2b] hover:bg-[#1f2b45] text-xs font-mono text-sky-300 border border-sky-500/30 flex items-center gap-1.5"
                  >
                    {copiedMbr2GptCmd ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedMbr2GptCmd ? 'Copied gdisk Command' : 'Copy gdisk Commands'}</span>
                  </button>

                  <button
                    onClick={handleRunMbrToGpt}
                    disabled={isConvertingMbr}
                    className="px-4 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 disabled:opacity-50 text-white font-mono text-xs font-bold flex items-center gap-2 transition-all shadow-lg shadow-sky-600/30"
                  >
                    {isConvertingMbr ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Converting MBR to GPT ({mbrConvertProgress}%)...</span>
                      </>
                    ) : (
                      <>
                        <Zap className="w-3.5 h-3.5" />
                        <span>Convert {selectedMbrDisk} to GPT</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Conversion Console Logs */}
                {(isConvertingMbr || mbrConvertLogs.length > 0) && (
                  <div className="bg-[#05060a] p-4 rounded-xl border border-[#1b2030] space-y-2">
                    <div className="flex items-center justify-between text-xs font-mono text-sky-400 font-bold border-b border-[#182030] pb-2">
                      <span>MBR to GPT In-Place Conversion Stream</span>
                      {mbrConvertDone && <span className="text-emerald-400">Completed Without Data Loss</span>}
                    </div>

                    <div className="font-mono text-[11px] text-[#94a3b8] space-y-1 max-h-[160px] overflow-y-auto bg-[#020305] p-3 rounded-lg border border-[#131826]">
                      {mbrConvertLogs.map((log, idx) => (
                        <div key={idx} className={log.includes('SUCCESS') ? 'text-emerald-400 font-bold' : log.includes('GPT') ? 'text-sky-300' : 'text-[#cbd5e1]'}>
                          {log}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Right Column: Other Disk Fix Utilities */}
            <div className="lg:col-span-5 space-y-4">
              <div className="bg-[#0c0f18] p-5 rounded-xl border border-[#1b2234] space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold font-mono text-[#cbd5e1] uppercase">
                  <Wrench className="w-4 h-4 text-emerald-400" />
                  <span>Deep Disk Fix & Repair Doctor</span>
                </div>

                <div className="space-y-2 text-xs font-mono">
                  <div className="p-3 rounded-lg bg-[#111624] border border-[#1e273e] space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-white flex items-center gap-1.5">
                        <Activity className="w-3.5 h-3.5 text-sky-400" />
                        <span>Bad Sector Doctor (badblocks / smartctl)</span>
                      </span>
                      <span className="text-[9px] px-1.5 py-0.2 rounded bg-sky-950 text-sky-300">Non-Destructive</span>
                    </div>
                    <p className="text-[11px] text-[#8899aa]">
                      Scans raw sectors for unreadable blocks and passes defective sector lists to `e2fsck -l` to prevent filesystem corruption.
                    </p>
                  </div>

                  <div className="p-3 rounded-lg bg-[#111624] border border-[#1e273e] space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-white flex items-center gap-1.5">
                        <ShieldCheck className="w-3.5 h-3.5 text-purple-400" />
                        <span>GPT Header & Backup Restoration</span>
                      </span>
                      <span className="text-[9px] px-1.5 py-0.2 rounded bg-purple-950 text-purple-300">Automated</span>
                    </div>
                    <p className="text-[11px] text-[#8899aa]">
                      Reconstructs corrupted primary GPT header from the backup GPT partition table stored at the end of the disk.
                    </p>
                  </div>

                  <div className="p-3 rounded-lg bg-[#111624] border border-[#1e273e] space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-white flex items-center gap-1.5">
                        <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
                        <span>UUID Collision & /etc/fstab Synchronizer</span>
                      </span>
                      <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-950 text-amber-300">Live Auto-Heal</span>
                    </div>
                    <p className="text-[11px] text-[#8899aa]">
                      Regenerates duplicate filesystem UUIDs (`tune2fs -U random`) after cloning and automatically updates boot mount entries.
                    </p>
                  </div>
                </div>
              </div>

              {/* Forensic Partition Recovery */}
              <div className="bg-[#0c0f18] p-5 rounded-xl border border-[#1b2234] space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold font-mono text-[#cbd5e1] uppercase">
                  <Shield className="w-4 h-4 text-sky-400" />
                  <span>Data Carving & Recovery</span>
                </div>
                <div className="p-3 rounded-lg bg-[#111624] border border-[#1d263b] flex items-center justify-between text-xs font-mono">
                  <div>
                    <div className="text-white font-bold">GNU ddrescue & TestDisk</div>
                    <div className="text-[10px] text-[#8899aa]">Carves lost partitions and salvage data from physically failing drives</div>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-[#1b2438] text-emerald-300">Available on Live USB</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: FORENSIC BIT-TO-BIT CLONER WITH SOURCE WRITE BLOCKER */}
        {activeTab === 'forensic_clone' && (
          <div className="max-w-4xl mx-auto space-y-4">
            <div className="bg-[#0c0f18] p-5 rounded-xl border border-[#1b2234] space-y-4">
              <div className="flex items-center justify-between border-b border-[#1b2234] pb-3">
                <div className="flex items-center gap-2.5">
                  <Lock className="w-5 h-5 text-emerald-400" />
                  <div>
                    <h3 className="text-sm font-bold text-white font-mono">Forensic Bit-to-Bit Raw Disk Cloner</h3>
                    <p className="text-xs text-[#8090a8]">
                      Exact sector-by-sector drive clone with an absolute hardware/kernel write blocker on the source drive
                    </p>
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded text-xs font-mono bg-emerald-950/60 text-emerald-300 border border-emerald-500/40 flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Write-Blocker Enforced</span>
                </span>
              </div>

              {/* Source & Target Drive Selection */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Source Drive */}
                <div className="p-4 rounded-xl bg-[#080b12] border border-emerald-500/40 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-mono font-bold text-emerald-300 flex items-center gap-1.5">
                      <Lock className="w-3.5 h-3.5 text-emerald-400" />
                      <span>SOURCE DISK (WRITE-PROTECTED):</span>
                    </label>
                    <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-emerald-950 text-emerald-300">
                      READ-ONLY (`--setro`)
                    </span>
                  </div>

                  <select
                    value={cloneSourceDisk}
                    onChange={(e) => setCloneSourceDisk(e.target.value)}
                    className="w-full bg-[#121624] border border-[#232d46] rounded-lg px-3 py-2 text-white font-mono text-xs focus:outline-none focus:border-emerald-500"
                  >
                    {systemDisks.map(d => (
                      <option key={d.id} value={d.device}>
                        {d.device} - {d.name} ({d.sizeGb} GB)
                      </option>
                    ))}
                  </select>

                  <p className="text-[11px] text-[#8fa0b5]">
                    The source drive is completely locked at the block device layer (`blockdev --setro`). No writes or modifications can occur.
                  </p>
                </div>

                {/* Target Drive */}
                <div className="p-4 rounded-xl bg-[#080b12] border border-amber-500/40 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-mono font-bold text-amber-300 flex items-center gap-1.5">
                      <HardDrive className="w-3.5 h-3.5 text-amber-400" />
                      <span>TARGET DISK (DESTINATION):</span>
                    </label>
                    <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-amber-950 text-amber-300">
                      OVERWRITING
                    </span>
                  </div>

                  <select
                    value={cloneTargetDisk}
                    onChange={(e) => setCloneTargetDisk(e.target.value)}
                    className="w-full bg-[#121624] border border-[#232d46] rounded-lg px-3 py-2 text-white font-mono text-xs focus:outline-none focus:border-amber-500"
                  >
                    {systemDisks.map(d => (
                      <option key={d.id} value={d.device} disabled={d.device === cloneSourceDisk}>
                        {d.device} - {d.name} ({d.sizeGb} GB) {d.device === cloneSourceDisk ? '(Source Drive)' : ''}
                      </option>
                    ))}
                  </select>

                  <p className="text-[11px] text-[#8fa0b5]">
                    Target drive will receive an exact bit-for-bit mirror of the source drive, including boot sectors, partition tables, and hidden recovery partitions.
                  </p>
                </div>
              </div>

              {/* Safety & Cryptographic Hash Toggles */}
              <div className="p-3.5 rounded-xl bg-[#101524] border border-[#1e273e] flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2 cursor-pointer text-[#cbd5e1]">
                    <input
                      type="checkbox"
                      checked={writeBlockerEngaged}
                      onChange={(e) => setWriteBlockerEngaged(e.target.checked)}
                      className="rounded border-[#334155] bg-[#1a2234] text-emerald-600 focus:ring-0"
                    />
                    <span className="text-emerald-300 font-bold">Enforce Source Write-Blocker (Blockdev Read-Only)</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer text-[#cbd5e1]">
                    <input
                      type="checkbox"
                      checked={verifyChecksumSha256}
                      onChange={(e) => setVerifyChecksumSha256(e.target.checked)}
                      className="rounded border-[#334155] bg-[#1a2234] text-sky-600 focus:ring-0"
                    />
                    <span>Verify SHA-256 Bitstream Hash Match</span>
                  </label>
                </div>

                <button
                  onClick={handleCopyCloneCmd}
                  className="px-3 py-1.5 rounded-lg bg-[#141b2b] hover:bg-[#1f2b45] text-xs font-mono text-sky-300 border border-sky-500/30 flex items-center gap-1.5"
                >
                  {copiedCloneCmd ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedCloneCmd ? 'Copied Clone Command' : 'Copy Clone Command'}</span>
                </button>
              </div>

              {/* Action Trigger */}
              <div className="flex items-center justify-between p-4 rounded-xl bg-[#080b12] border border-[#1b2234]">
                <div className="text-xs font-mono text-[#94a3b8]">
                  Clone: <span className="text-emerald-300 font-bold">{cloneSourceDisk} [RO]</span> → <span className="text-amber-300 font-bold">{cloneTargetDisk}</span>
                </div>

                <button
                  onClick={handleRunBitToBitClone}
                  disabled={isCloning}
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-mono text-xs font-bold flex items-center gap-2 transition-all shadow-lg shadow-emerald-600/30"
                >
                  {isCloning ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Cloning Bitstream ({cloneProgress}%)...</span>
                    </>
                  ) : (
                    <>
                      <Lock className="w-3.5 h-3.5" />
                      <span>Start Forensic Bit-to-Bit Clone</span>
                    </>
                  )}
                </button>
              </div>

              {/* Live Streaming Metrics & Logs */}
              {(isCloning || cloneLogs.length > 0) && (
                <div className="bg-[#05060a] p-4 rounded-xl border border-[#1b2030] space-y-3">
                  <div className="grid grid-cols-3 gap-2 text-xs font-mono border-b border-[#182030] pb-2">
                    <div>
                      <span className="text-[#8899aa]">Progress: </span>
                      <span className="text-emerald-400 font-bold">{cloneProgress}%</span>
                    </div>
                    <div>
                      <span className="text-[#8899aa]">Throughput: </span>
                      <span className="text-sky-300 font-bold">{cloneSpeed}</span>
                    </div>
                    <div>
                      <span className="text-[#8899aa]">Transferred: </span>
                      <span className="text-amber-300 font-bold">{clonedBytes}</span>
                    </div>
                  </div>

                  <div className="w-full bg-[#111624] h-2 rounded-full overflow-hidden">
                    <div 
                      className="bg-emerald-500 h-full transition-all duration-300 shadow-[0_0_12px_#10b981]"
                      style={{ width: `${cloneProgress}%` }}
                    />
                  </div>

                  <div className="font-mono text-[11px] text-[#94a3b8] space-y-1 max-h-[160px] overflow-y-auto bg-[#020305] p-3 rounded-lg border border-[#131826]">
                    {cloneLogs.map((log, idx) => (
                      <div key={idx} className={log.includes('VERIFIED') ? 'text-emerald-400 font-bold' : log.includes('WRITE-BLOCKER') ? 'text-sky-300' : 'text-[#cbd5e1]'}>
                        {log}
                      </div>
                    ))}
                  </div>

                  {cloneHashMatch && (
                    <div className="p-3 rounded-lg bg-emerald-950/50 border border-emerald-500/40 text-xs font-mono space-y-1">
                      <div className="text-emerald-300 font-bold flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        <span>Cryptographic Hash Integrity Verification Passed (100% Exact Match)</span>
                      </div>
                      <div className="text-[10px] text-[#8899aa] break-all">
                        SHA-256: <span className="text-white">{sourceSha256}</span>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 5: SYSTEM FIX & LINUX BOOT REPAIR SUITE */}
        {activeTab === 'repair_suite' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            {/* Left Column: Linux & Windows Boot Repair Simulator */}
            <div className="lg:col-span-7 space-y-4">
              <div className="bg-[#0c0f18] p-5 rounded-xl border border-[#1b2234] space-y-4">
                <div className="flex items-center justify-between border-b border-[#1b2234] pb-3">
                  <div className="flex items-center gap-2.5">
                    <Wrench className="w-5 h-5 text-amber-400" />
                    <div>
                      <h3 className="text-sm font-bold text-white font-mono">Universal Linux & Windows Boot Repair</h3>
                      <p className="text-xs text-[#8090a8]">Fix broken GRUB, EFI NVRAM entries, corrupt initramfs, and Windows BCD</p>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-amber-950 text-amber-300 border border-amber-500/30">
                    Live Rescue Daemon
                  </span>
                </div>

                {/* Target OS Selector to Repair */}
                <div className="space-y-2">
                  <label className="text-xs font-mono text-[#cbd5e1] block">Detected Foreign Operating Systems on Disk:</label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: 'ubuntu', name: 'Ubuntu 24.04 LTS', disk: '/dev/nvme0n1p2', status: 'Corrupted GRUB EFI' },
                      { id: 'fedora', name: 'Fedora 40 Workstation', disk: '/dev/nvme0n1p4', status: 'Broken Initramfs / Dracut' },
                      { id: 'windows', name: 'Windows 11 Pro', disk: '/dev/nvme0n1p3', status: 'Damaged BCD Store' }
                    ].map(distro => (
                      <button
                        key={distro.id}
                        onClick={() => setSelectedDistroToRepair(distro.id)}
                        className={`p-3 rounded-lg border text-left font-mono transition-all ${
                          selectedDistroToRepair === distro.id
                            ? 'bg-amber-950/50 border-amber-500 text-white shadow-sm'
                            : 'bg-[#101422] border-[#222b40] text-[#708098] hover:text-white'
                        }`}
                      >
                        <div className="font-bold text-xs text-white">{distro.name}</div>
                        <div className="text-[10px] text-sky-300 font-mono mt-0.5">{distro.disk}</div>
                        <div className="text-[9px] text-amber-400 mt-1">{distro.status}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Repair Actions */}
                <div className="flex items-center justify-between p-3 rounded-lg bg-[#111624] border border-[#1e273e]">
                  <div className="text-xs font-mono text-[#94a3b8]">
                    Selected Target: <span className="text-amber-300 font-bold">{selectedDistroToRepair.toUpperCase()}</span>
                  </div>
                  <button
                    onClick={handleRunBootRepair}
                    disabled={isRepairingBoot}
                    className="px-4 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white font-mono text-xs font-bold flex items-center gap-2 transition-all shadow-lg shadow-amber-600/30"
                  >
                    {isRepairingBoot ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Repairing EFI & GRUB...</span>
                      </>
                    ) : (
                      <>
                        <Wrench className="w-3.5 h-3.5" />
                        <span>Run 1-Click Boot Repair</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Repair Log Stream */}
                {(isRepairingBoot || repairLogs.length > 0) && (
                  <div className="bg-[#05060a] p-4 rounded-xl border border-[#1b2030] space-y-2">
                    <div className="flex items-center justify-between text-xs font-mono text-amber-400 font-bold border-b border-[#182030] pb-2">
                      <span>Boot Repair Output Execution Log</span>
                      {repairDone && <span className="text-emerald-400">Fixed</span>}
                    </div>

                    <div className="font-mono text-[11px] text-[#94a3b8] space-y-1 max-h-[160px] overflow-y-auto bg-[#020305] p-3 rounded-lg border border-[#131826]">
                      {repairLogs.map((log, idx) => (
                        <div key={idx} className={log.includes('COMPLETE') ? 'text-emerald-400 font-bold' : log.includes('REPAIR') ? 'text-sky-300' : 'text-[#cbd5e1]'}>
                          {log}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Right Column: GParted & Data Rescue Modules */}
            <div className="lg:col-span-5 space-y-4">
              <div className="bg-[#0c0f18] p-5 rounded-xl border border-[#1b2234] space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold font-mono text-[#cbd5e1] uppercase">
                  <Database className="w-4 h-4 text-sky-400" />
                  <span>GParted & Disk Partition Doctor</span>
                </div>

                <div className="p-3 rounded-lg bg-[#111624] border border-[#1e273e] space-y-2 text-xs">
                  <div className="flex items-center justify-between font-mono">
                    <span className="font-bold text-white">/dev/nvme0n1 (1.0 TB NVMe Gen3/4)</span>
                    <span className="text-emerald-400 text-[10px]">GPT Clean</span>
                  </div>
                  {/* Partition Visual Bar */}
                  <div className="w-full h-5 rounded-lg overflow-hidden flex text-[9px] font-mono text-center font-bold">
                    <div className="bg-sky-600 text-white flex items-center justify-center" style={{ width: '5%' }}>ESP</div>
                    <div className="bg-purple-600 text-white flex items-center justify-center" style={{ width: '45%' }}>Ext4 /</div>
                    <div className="bg-blue-600 text-white flex items-center justify-center" style={{ width: '25%' }}>NTFS</div>
                    <div className="bg-amber-600 text-white flex items-center justify-center" style={{ width: '15%' }}>Recovery (32G)</div>
                    <div className="bg-slate-700 text-slate-300 flex items-center justify-center" style={{ width: '10%' }}>Free</div>
                  </div>

                  <div className="grid grid-cols-2 gap-1.5 pt-2 text-[11px] font-mono">
                    <button className="p-1.5 rounded bg-[#192135] hover:bg-[#253250] text-sky-300 text-left">
                      • Check & Fix Filesystem
                    </button>
                    <button className="p-1.5 rounded bg-[#192135] hover:bg-[#253250] text-purple-300 text-left">
                      • Resize / Move Partition
                    </button>
                    <button className="p-1.5 rounded bg-[#192135] hover:bg-[#253250] text-amber-300 text-left">
                      • Fix UUID Collisions
                    </button>
                    <button className="p-1.5 rounded bg-[#192135] hover:bg-[#253250] text-emerald-300 text-left">
                      • Rebuild GPT Header
                    </button>
                  </div>
                </div>
              </div>

              {/* Data Recovery Tools */}
              <div className="bg-[#0c0f18] p-5 rounded-xl border border-[#1b2234] space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold font-mono text-[#cbd5e1] uppercase">
                  <ShieldCheck className="w-4 h-4 text-purple-400" />
                  <span>Forensic & Emergency Rescue Utilities</span>
                </div>

                <div className="space-y-2 text-xs font-mono">
                  <div className="p-2.5 rounded-lg bg-[#111624] border border-[#1d263b] flex items-center justify-between">
                    <div>
                      <div className="text-white font-bold">GNU ddrescue</div>
                      <div className="text-[10px] text-[#8899aa]">Data recovery from damaged drives with bad blocks</div>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-[#1b2438] text-sky-300">Ready</span>
                  </div>

                  <div className="p-2.5 rounded-lg bg-[#111624] border border-[#1d263b] flex items-center justify-between">
                    <div>
                      <div className="text-white font-bold">TestDisk & PhotoRec</div>
                      <div className="text-[10px] text-[#8899aa]">Recover deleted partitions and raw file carving</div>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-[#1b2438] text-sky-300">Ready</span>
                  </div>

                  <div className="p-2.5 rounded-lg bg-[#111624] border border-[#1d263b] flex items-center justify-between">
                    <div>
                      <div className="text-white font-bold">Chroot Rescue Terminal</div>
                      <div className="text-[10px] text-[#8899aa]">Full root terminal inside foreign Linux OS</div>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-[#1b2438] text-emerald-300">Active</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 6: SD & FLASH CARD DEEP FILE RETRIEVER */}
        {activeTab === 'flash_retriever' && (
          <FlashCardRetrieverView addNotification={addNotification} />
        )}

        {/* TAB 7: FULL RESCUE & DIAGNOSTIC TOOLS CATALOG */}
        {activeTab === 'tool_catalog' && (
          <RescueToolCatalogView addNotification={addNotification} />
        )}

        {/* TAB 6: SYSTEM REQUIREMENTS & HARDWARE BENCHMARK */}
        {activeTab === 'sys_test' && (
          <div className="max-w-4xl mx-auto space-y-4">
            <div className="bg-[#0c0f18] p-5 rounded-xl border border-[#1b2234] space-y-4">
              <div className="flex items-center justify-between border-b border-[#1b2234] pb-3">
                <div className="flex items-center gap-2.5">
                  <Stethoscope className="w-5 h-5 text-cyan-400" />
                  <div>
                    <h3 className="text-sm font-bold text-white font-mono">Bare-Metal System Requirements Benchmark</h3>
                    <p className="text-xs text-[#8090a8]">
                      Verify CPU instruction sets, 16GB memory threshold, PCIe 3.0/4.0/5.0 NVMe speed, and UEFI integrity
                    </p>
                  </div>
                </div>

                <button
                  onClick={handleRunSysTest}
                  disabled={isRunningSysTest}
                  className="px-4 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white font-mono text-xs font-bold flex items-center gap-2 transition-all shadow-lg shadow-cyan-600/30"
                >
                  {isRunningSysTest ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Auditing Hardware ({sysTestProgress}%)...</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-3.5 h-3.5" />
                      <span>Run System Requirements Test</span>
                    </>
                  )}
                </button>
              </div>

              {/* Benchmark Results Cards */}
              {sysTestResults ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {/* CPU Card */}
                  <div className="p-4 rounded-xl bg-[#111624] border border-emerald-500/40 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 font-mono font-bold text-xs text-white">
                        <Cpu className="w-4 h-4 text-emerald-400" />
                        <span>CPU Architecture Audit</span>
                      </div>
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-950 text-emerald-300 border border-emerald-500/40">
                        PASSED
                      </span>
                    </div>
                    <div className="text-xs font-semibold text-sky-300 font-mono">{sysTestResults.cpu.score}</div>
                    <p className="text-[11px] text-[#94a3b8]">{sysTestResults.cpu.details}</p>
                  </div>

                  {/* RAM Card */}
                  <div className="p-4 rounded-xl bg-[#111624] border border-emerald-500/40 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 font-mono font-bold text-xs text-white">
                        <Layers className="w-4 h-4 text-emerald-400" />
                        <span>Memory Topology (16 GB Threshold)</span>
                      </div>
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-950 text-emerald-300 border border-emerald-500/40">
                        PASSED
                      </span>
                    </div>
                    <div className="text-xs font-semibold text-sky-300 font-mono">{sysTestResults.ram.score}</div>
                    <p className="text-[11px] text-[#94a3b8]">{sysTestResults.ram.details}</p>
                  </div>

                  {/* Storage Card */}
                  <div className="p-4 rounded-xl bg-[#111624] border border-emerald-500/40 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 font-mono font-bold text-xs text-white">
                        <HardDrive className="w-4 h-4 text-emerald-400" />
                        <span>NVMe / SATA Storage Controller</span>
                      </div>
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-950 text-emerald-300 border border-emerald-500/40">
                        PASSED
                      </span>
                    </div>
                    <div className="text-xs font-semibold text-sky-300 font-mono">{sysTestResults.disk.score}</div>
                    <p className="text-[11px] text-[#94a3b8]">{sysTestResults.disk.details}</p>
                  </div>

                  {/* UEFI Card */}
                  <div className="p-4 rounded-xl bg-[#111624] border border-emerald-500/40 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 font-mono font-bold text-xs text-white">
                        <ShieldCheck className="w-4 h-4 text-emerald-400" />
                        <span>Firmware & Secure Boot</span>
                      </div>
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-950 text-emerald-300 border border-emerald-500/40">
                        PASSED
                      </span>
                    </div>
                    <div className="text-xs font-semibold text-sky-300 font-mono">{sysTestResults.uefi.score}</div>
                    <p className="text-[11px] text-[#94a3b8]">{sysTestResults.uefi.details}</p>
                  </div>
                </div>
              ) : (
                <div className="p-8 rounded-xl bg-[#080b12] border border-[#1b2234] text-center space-y-3">
                  <Stethoscope className="w-8 h-8 text-cyan-400 mx-auto" />
                  <div className="font-mono text-xs text-[#cbd5e1]">
                    Click "Run System Requirements Test" to evaluate bare-metal specifications before OS installation.
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 7: GRUB & QEMU SCRIPTS */}
        {activeTab === 'scripts' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* GRUB Multi-Boot Config */}
            <div className="bg-[#0c0f18] p-4 rounded-xl border border-[#1b2234] space-y-2 flex flex-col">
              <div className="flex items-center justify-between border-b border-[#1b2234] pb-2">
                <div className="flex items-center gap-2 text-xs font-mono text-purple-400 font-bold">
                  <FileCode className="w-4 h-4" />
                  <span>grub.cfg (Multi-Tool Live Boot Menu)</span>
                </div>
                <button
                  onClick={() => handleDownloadFile('grub.cfg', generateGrubCfg())}
                  className="text-[10px] font-mono text-purple-300 hover:text-purple-200 underline"
                >
                  Download grub.cfg
                </button>
              </div>

              <pre className="p-3 bg-[#020305] rounded-lg border border-[#131826] font-mono text-[11px] text-[#cbd5e1] overflow-x-auto max-h-[300px] leading-relaxed">
                {generateGrubCfg()}
              </pre>
            </div>

            {/* QEMU Launcher Script */}
            <div className="bg-[#0c0f18] p-4 rounded-xl border border-[#1b2234] space-y-2 flex flex-col">
              <div className="flex items-center justify-between border-b border-[#1b2234] pb-2">
                <div className="flex items-center gap-2 text-xs font-mono text-sky-400 font-bold">
                  <Terminal className="w-4 h-4" />
                  <span>run_qemu.sh (Virtual Testing Script)</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleCopyScript}
                    className="text-[10px] font-mono text-sky-300 hover:text-sky-200"
                  >
                    {copiedScript ? 'Copied!' : 'Copy'}
                  </button>
                  <button
                    onClick={() => handleDownloadFile('run_qemu.sh', generateQemuScript())}
                    className="text-[10px] font-mono text-sky-300 hover:text-sky-200 underline"
                  >
                    Download .sh
                  </button>
                </div>
              </div>

              <pre className="p-3 bg-[#020305] rounded-lg border border-[#131826] font-mono text-[11px] text-[#cbd5e1] overflow-x-auto max-h-[300px] leading-relaxed">
                {generateQemuScript()}
              </pre>
            </div>
          </div>
        )}

        {/* TAB 10: BARE-METAL OS ROADMAP & OBJECTIVE COMPILATION MATRIX */}
        {activeTab === 'bare_metal_roadmap' && (
          <div className="space-y-4">
            {/* Header Banner */}
            <div className="bg-gradient-to-r from-emerald-950/50 via-[#0c121e] to-[#0c0f18] p-4 rounded-xl border border-emerald-500/40 shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold uppercase">
                    Binding Target
                  </span>
                  <span className="text-xs font-mono text-[#8899aa]">Document: BARE_METAL_ROADMAP.md</span>
                </div>
                <h3 className="text-base font-bold font-mono text-emerald-200 flex items-center gap-2">
                  <Cpu className="w-5 h-5 text-emerald-400" />
                  <span>Bare-Metal x86_64 OS Execution & Compilation Blueprint</span>
                </h3>
                <p className="text-xs text-[#94a3b8] max-w-3xl leading-relaxed">
                  Engineered to compile into raw 64-bit ELF kernel binaries, package into a bootable hybrid ISO (UEFI + BIOS), install on blank SSD/NVMe bare-metal computers, dual-boot safely alongside Windows 10/11 or Linux, and run with full acceleration in QEMU/KVM.
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={handleDownloadSourceBundle}
                  className="px-3 py-2 bg-[#121e1e] hover:bg-[#182b2b] text-emerald-300 border border-emerald-500/40 rounded-lg text-xs font-mono font-bold flex items-center gap-1.5 transition-all shadow-md shadow-emerald-950/50"
                  title="Export complete kernel C/ASM source manifest and toolchain configuration"
                >
                  <Code className="w-3.5 h-3.5" />
                  <span>Export OS Sources</span>
                </button>
                <button
                  onClick={() => {
                    const bashScript = `#!/usr/bin/env bash\n# SecureCurtain OS Build Script\nchmod +x scripts/build_kernel.sh\n./scripts/build_kernel.sh\n`;
                    handleDownloadFile('build_kernel.sh', bashScript);
                  }}
                  className="px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-mono font-bold flex items-center gap-1.5 transition-all shadow-md shadow-emerald-950/50"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download Build Script</span>
                </button>
              </div>
            </div>

            {/* 6 Architectural Pillars Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {/* Pillar 1 */}
              <div className="bg-[#0c0f18] p-3.5 rounded-xl border border-[#1b2234] space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold font-mono text-emerald-400">Pillar 1: Bootstrapping</span>
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-emerald-500/10 text-emerald-300 border border-emerald-500/30">
                    Ready
                  </span>
                </div>
                <p className="text-xs text-[#cbd5e1] font-medium">Multiboot2 & 64-bit Long Mode</p>
                <p className="text-[11px] text-[#8899aa] leading-relaxed">
                  Compliant Multiboot2 header tags, GDT64, PAE/LME initialization, and higher-half mapping at <code className="text-purple-300">0xFFFFFFFF80000000</code>.
                </p>
                <div className="text-[10px] font-mono text-[#64748b]">Source: sys/kernel/arch/x86_64/boot.asm</div>
              </div>

              {/* Pillar 2 */}
              <div className="bg-[#0c0f18] p-3.5 rounded-xl border border-[#1b2234] space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold font-mono text-emerald-400">Pillar 2: Kernel Core</span>
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-emerald-500/10 text-emerald-300 border border-emerald-500/30">
                    Ready
                  </span>
                </div>
                <p className="text-xs text-[#cbd5e1] font-medium">PMM, VMM Paging & IDT Gates</p>
                <p className="text-[11px] text-[#8899aa] leading-relaxed">
                  4-level PML4 page tables, Physical Memory Bitmap allocator, slab <code className="text-purple-300">kmalloc</code> heap, and 256-entry IDT with IST stack switching.
                </p>
                <div className="text-[10px] font-mono text-[#64748b]">Source: sys/kernel/src/mm/, idt.c, apic.c</div>
              </div>

              {/* Pillar 3 */}
              <div className="bg-[#0c0f18] p-3.5 rounded-xl border border-[#1b2234] space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold font-mono text-emerald-400">Pillar 3: Device Drivers</span>
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-emerald-500/10 text-emerald-300 border border-emerald-500/30">
                    Ready
                  </span>
                </div>
                <p className="text-xs text-[#cbd5e1] font-medium">AHCI SATA, NVMe, PCIe & GOP</p>
                <p className="text-[11px] text-[#8899aa] leading-relaxed">
                  PCIe ECAM configuration space, AHCI FIS command tables, NVMe Submission/Completion queues, linear GOP framebuffer, and TPM 2.0.
                </p>
                <div className="text-[10px] font-mono text-[#64748b]">Source: sys/kernel/src/drivers/</div>
              </div>

              {/* Pillar 4 */}
              <div className="bg-[#0c0f18] p-3.5 rounded-xl border border-[#1b2234] space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold font-mono text-emerald-400">Pillar 4: Dual-Boot & Install</span>
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-emerald-500/10 text-emerald-300 border border-emerald-500/30">
                    Ready
                  </span>
                </div>
                <p className="text-xs text-[#cbd5e1] font-medium">GPT, ESP & Windows Chainloader</p>
                <p className="text-[11px] text-[#8899aa] leading-relaxed">
                  Non-destructive partition shrinker, standalone blank SSD wiper, and EFI System Partition sharing with Windows Boot Manager (<code className="text-purple-300">bootmgfw.efi</code>).
                </p>
                <div className="text-[10px] font-mono text-[#64748b]">App: OsInstallerApp.tsx</div>
              </div>

              {/* Pillar 5 */}
              <div className="bg-[#0c0f18] p-3.5 rounded-xl border border-[#1b2234] space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold font-mono text-emerald-400">Pillar 5: Hybrid ISO Pipeline</span>
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-emerald-500/10 text-emerald-300 border border-emerald-500/30">
                    Ready
                  </span>
                </div>
                <p className="text-xs text-[#cbd5e1] font-medium">El Torito UEFI + BIOS Boot</p>
                <p className="text-[11px] text-[#8899aa] leading-relaxed">
                  Automated ISO generation using <code className="text-purple-300">grub-mkrescue</code> and <code className="text-purple-300">xorriso</code> for USB boot and live VM testing.
                </p>
                <div className="text-[10px] font-mono text-[#64748b]">Script: scripts/build_kernel.sh</div>
              </div>

              {/* Pillar 6 */}
              <div className="bg-[#0c0f18] p-3.5 rounded-xl border border-[#1b2234] space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold font-mono text-emerald-400">Pillar 6: Shell & Userland</span>
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-emerald-500/10 text-emerald-300 border border-emerald-500/30">
                    Ready
                  </span>
                </div>
                <p className="text-xs text-[#cbd5e1] font-medium">420+ POSIX Commands & Desktop</p>
                <p className="text-[11px] text-[#8899aa] leading-relaxed">
                  Integrated POSIX command executor, virtual filesystem, multi-window desktop manager, and system introspection tools.
                </p>
                <div className="text-[10px] font-mono text-[#64748b]">Docs: COMMANDS_ROADMAP.md</div>
              </div>
            </div>

            {/* Direct Compilation Commands Box */}
            <div className="bg-[#0c0f18] p-4 rounded-xl border border-[#1b2234] space-y-3">
              <div className="flex items-center justify-between border-b border-[#1b2234] pb-2">
                <div className="flex items-center gap-2 text-xs font-mono text-emerald-400 font-bold">
                  <Terminal className="w-4 h-4" />
                  <span>Bare-Metal Build Commands (Run on Linux Host or Docker)</span>
                </div>
                <span className="text-[11px] font-mono text-[#64748b]">x86_64 Freestanding Toolchain</span>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 font-mono text-xs">
                <div className="bg-[#020305] p-3 rounded-lg border border-[#131826] space-y-2">
                  <div className="text-emerald-400 text-[11px] font-bold">1. Compile Kernel & Assemble Bootloader:</div>
                  <pre className="text-[#cbd5e1] text-[11px] overflow-x-auto leading-relaxed">
{`# Install build prerequisites
sudo apt-get install -y build-essential nasm xorriso \\
    grub-pc-bin grub-efi-amd64-bin mtools qemu-system-x86

# Run automated build script
chmod +x scripts/build_kernel.sh
./scripts/build_kernel.sh`}
                  </pre>
                </div>

                <div className="bg-[#020305] p-3 rounded-lg border border-[#131826] space-y-2">
                  <div className="text-emerald-400 text-[11px] font-bold">2. Test in QEMU VM & Burn to USB:</div>
                  <pre className="text-[#cbd5e1] text-[11px] overflow-x-auto leading-relaxed">
{`# Boot in QEMU with UEFI (OVMF)
qemu-system-x86_64 -cdrom securecurtain-os-v1.0.iso \\
    -m 4G -smp 4 -vga std

# Burn to USB for Physical Bare-Metal Install
sudo dd if=securecurtain-os-v1.0.iso of=/dev/sdX \\
    bs=4M status=progress conv=fdatasync`}
                  </pre>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
