// jb7572_2026-08-26: Rescue & Diagnostic Tools Suite Definitions
export interface RescueToolItem {
  id: string;
  name: string;
  category: 'windows' | 'linux' | 'baremetal' | 'forensics' | 'disk' | 'diagnostics' | 'repair' | 'network' | 'firmware';
  type: 'GUI' | 'CLI' | 'Standalone Kernel' | 'WinPE / WinRE';
  description: string;
  executable: string;
  purpose: string;
  included: boolean;
  status: 'Ready' | 'Installed' | 'Integrated' | 'Kernel Module';
  tags: string[];
}

export const RESCUE_UTILITIES_SUITE: RescueToolItem[] = [
  // ==========================================
  // Windows Environment (WinPE / WinRE / Offline NTFS)
  // ==========================================
  {
    id: 'bcdboot_bootrec',
    name: 'BCDBoot & Bootrec (CLI)',
    category: 'windows',
    type: 'WinPE / WinRE',
    executable: 'bcdboot.exe / bootrec.exe',
    purpose: 'Native Windows BCD & MBR/PBR rebuilder; repairs EFI NVRAM entries and offline Windows Bootloader files.',
    description: 'Manually reconstructs Boot Configuration Data (BCD) stores and Master Boot Records for non-booting Windows 10/11 installations.',
    included: true,
    status: 'Integrated',
    tags: ['BCD', 'Bootrec', 'EFI', 'Windows 11', 'MBR Fix']
  },
  {
    id: 'easybcd',
    name: 'EasyBCD & Dual-Boot Repair (GUI)',
    category: 'windows',
    type: 'GUI',
    executable: 'easybcd.exe / efibootmgr',
    purpose: 'Visual utility to modify Windows Boot Manager firmware and resolve multi-boot conflicts with Linux/GRUB.',
    description: 'Edits the Windows boot configuration visually, allows adding Linux/VHD chainloaders, and fixes broken dual-boot menus.',
    included: true,
    status: 'Integrated',
    tags: ['Dual-Boot', 'BCD Visual', 'NVRAM']
  },
  {
    id: 'ntpwedit',
    name: 'NTPWEdit & Offline SAM Password Reset',
    category: 'windows',
    type: 'GUI',
    executable: 'ntpwedit64.exe / chntpw',
    purpose: 'Directly unlocks, resets, or clears local Windows accounts by editing the offline SAM (Security Accounts Manager) database.',
    description: 'Modifies C:\\Windows\\System32\\config\\SAM offline without running the target OS, clearing forgotten admin passwords or unlocking disabled accounts.',
    included: true,
    status: 'Ready',
    tags: ['Password Reset', 'SAM Hive', 'Account Unlock']
  },
  {
    id: 'offline_regedit',
    name: 'Offline Registry Persistence & Service Hijack Scanner (hivex / chntpw)',
    category: 'windows',
    type: 'WinPE / WinRE',
    executable: 'hivexregedit / chntpw / hivexsh',
    purpose: 'Inspects offline SYSTEM & SOFTWARE hives for rogue Windows Services, Winlogon explorer.exe shell hijacks, IFEO debugger interception, and startup persistence.',
    description: 'Loads offline registry hives without booting the infected host to neutralize malicious services (Start=4), restore legitimate explorer.exe desktop shell paths, and purge stealth persistence hooks.',
    included: true,
    status: 'Integrated',
    tags: ['Registry Scanner', 'Service Hijack', 'Explorer Shell', 'Winlogon', 'IFEO Debugger', 'hivex']
  },
  {
    id: 'rstudio_getdataback',
    name: 'R-Studio & GetDataBack Pro (Data Recovery)',
    category: 'windows',
    type: 'GUI',
    executable: 'rstudio.exe / gdbpro.exe',
    purpose: 'Industrial-grade raw NTFS/FAT/ReFS data carving and recovery even when partition structures are completely destroyed.',
    description: 'Scans sector-by-sector for file headers and MFT records, reconstructing folder hierarchies from damaged or reformatted drives.',
    included: true,
    status: 'Ready',
    tags: ['NTFS Recovery', 'MFT Parsing', 'Raw Carving']
  },
  {
    id: 'minitool_aomei',
    name: 'MiniTool Partition Wizard & AOMEI Assistant',
    category: 'windows',
    type: 'GUI',
    executable: 'partitionwizard.exe / aomei.exe',
    purpose: 'Windows GUI partition manager for complex resizing, moving, alignment (4K SSD), and MBR/GPT table rebuilding.',
    description: 'Performs non-destructive Windows partition resizing, BitLocker volume migration, and partition alignment.',
    included: true,
    status: 'Integrated',
    tags: ['Partition GUI', '4K Align', 'SSD Optimizer']
  },
  {
    id: 'dism_sfc_offline',
    name: 'DISM & SFC Offline System File Healer',
    category: 'windows',
    type: 'WinPE / WinRE',
    executable: 'dism.exe / sfc.exe',
    purpose: 'Repairs corrupted Windows Component Store (WinSxS) and system files offline using `/image:C:\\ /cleanup-image /restorehealth`.',
    description: 'Restores missing or damaged DLLs, drivers, and core Windows system files directly against an unbootable offline Windows installation.',
    included: true,
    status: 'Integrated',
    tags: ['DISM', 'SFC', 'WinSxS', 'System Integrity']
  },

  // ==========================================
  // Linux Environment (Live Root & Forensics)
  // ==========================================
  {
    id: 'boot_repair_gui',
    name: 'Universal Boot-Repair (GUI / CLI)',
    category: 'linux',
    type: 'GUI',
    executable: 'boot-repair / update-grub',
    purpose: '1-Click automatic healer for GRUB 2, EFI NVRAM entries, secure boot signatures, and multi-distro kernel rollbacks.',
    description: 'Scans for all installed Linux distributions and Windows bootloaders, reinstalling the correct GRUB EFI binaries and rebuilding grub.cfg.',
    included: true,
    status: 'Integrated',
    tags: ['GRUB 2', 'EFI NVRAM', 'Ubuntu/Debian/Fedora/Arch']
  },
  {
    id: 'gparted_progs',
    name: 'GParted & e2fsprogs / btrfs-progs / xfsprogs',
    category: 'linux',
    type: 'GUI',
    executable: 'gparted / e2fsck / btrfs check',
    purpose: 'Gold-standard partition management, block filesystem healing, and UUID collision resolution for all Linux/Windows filesystems.',
    description: 'Resizes, moves, copies, and checks partitions across ext2/3/4, btrfs, xfs, f2fs, ntfs, and fat32 with non-destructive guarantees.',
    included: true,
    status: 'Integrated',
    tags: ['GParted', 'ext4', 'btrfs', 'xfs', 'ntfs-3g']
  },
  {
    id: 'clonezilla_partclone',
    name: 'Clonezilla & Partclone (Bare-Metal Backup)',
    category: 'linux',
    type: 'CLI',
    executable: 'clonezilla / ocs-sr / partclone',
    purpose: 'High-speed smart block imaging that only copies used blocks, supporting compressed image backups to network shares or external drives.',
    description: 'Creates bare-metal system drive images, supports multicasting for mass deployments, and restores entire disk architectures.',
    included: true,
    status: 'Ready',
    tags: ['Clonezilla', 'Partclone', 'Network Backup', 'Image Backup']
  },
  {
    id: 'guymager_forensic',
    name: 'Guymager (Forensic E01 / Raw Imaging GUI)',
    category: 'forensics',
    type: 'GUI',
    executable: 'guymager',
    purpose: 'Forensic-grade disk imager with built-in hardware write-blocker integration and real-time SHA-256 / MD5 hashing.',
    description: 'Creates industry-standard Expert Witness Format (E01) and raw DD bitstream forensic clones with cryptographic verification.',
    included: true,
    status: 'Ready',
    tags: ['Forensics', 'E01', 'Write-Blocker', 'SHA-256 Hash']
  },
  {
    id: 'ddrescue_gui',
    name: 'GNU ddrescue & DDRescue-GUI',
    category: 'linux',
    type: 'CLI',
    executable: 'ddrescue / ddrescue-gui',
    purpose: 'Advanced data salvaging tool that copies data from failing hard drives or flash memory without aborting on read errors.',
    description: 'Uses a multi-pass logfile mechanism to scrape good sectors first, then split damaged sectors to rescue maximal data from dying storage.',
    included: true,
    status: 'Integrated',
    tags: ['Data Rescue', 'Bad Sector Scraping', 'Mapfile']
  },
  {
    id: 'sd_flash_retriever',
    name: 'SD & MicroSD Deep File Retriever (QPhotoRec / Scalpel)',
    category: 'forensics',
    type: 'GUI',
    executable: 'sd-retriever / qphotorec / scalpel',
    purpose: 'Specialized deep file salvaging engine for mistakenly deleted photos, 4K videos, audio, and documents from SD/microSD/CF flash cards.',
    description: 'Bypasses damaged FAT32/exFAT allocation tables, performing raw NAND flash cluster carving with signature matching for JPG, CR2/CR3, NEF, ARW, MP4, MOV, and 480+ file types.',
    included: true,
    status: 'Integrated',
    tags: ['SD Card', 'MicroSD', 'RAW Photo', 'Video Salvage', 'exFAT', 'FAT32']
  },
  {
    id: 'fat_exfat_healer',
    name: 'FAT32 & exFAT Directory Table Healer (fatcat / dosfsck)',
    category: 'linux',
    type: 'CLI',
    executable: 'fatcat / fsck.vfat / fsck.exfat',
    purpose: 'Recovers deleted files with original directory hierarchy and filenames by parsing unlinked FAT directory entries and orphan cluster chains.',
    description: 'Walks orphaned cluster chains, repairs corrupted Boot Sectors, reconstructs broken /DCIM folder trees, and restores deleted file metadata.',
    included: true,
    status: 'Integrated',
    tags: ['FAT32', 'exFAT', 'Orphan Clusters', 'Directory Recovery']
  },
  {
    id: 'testdisk_photorec',
    name: 'TestDisk & QPhotoRec (Partition & File Carving)',
    category: 'linux',
    type: 'GUI',
    executable: 'testdisk / qphotorec',
    purpose: 'Reconstructs lost partition tables (MBR/GPT) and carves deleted raw photos, videos, documents, and archives.',
    description: 'Finds lost ext4, NTFS, FAT, and exFAT partitions, restores corrupted boot sectors, and carves over 480 file formats safely.',
    included: true,
    status: 'Integrated',
    tags: ['Partition Undelete', 'File Carving', 'PhotoRec']
  },
  {
    id: 'chroot_doctor',
    name: 'Auto-Chroot Shell & Dracut / Initramfs Rebuilder',
    category: 'linux',
    type: 'CLI',
    executable: 'securecurtain-chroot / chroot',
    purpose: 'Auto-detects and mounts root, EFI, and virtual filesystems (/dev, /proc, /sys) to provide an instant maintenance shell.',
    description: 'Permits running native package managers (apt, dnf, pacman), resetting forgotten root passwords, and compiling kernel modules inside the broken OS.',
    included: true,
    status: 'Integrated',
    tags: ['Chroot', 'Initramfs', 'Dracut', 'Root Reset']
  },

  // ==========================================
  // System-Agnostic / Bare-Metal Hardware & Sanitization
  // ==========================================
  {
    id: 'memtest86_plus',
    name: 'MemTest86+ v7.20 (Bare-Metal DRAM Audit)',
    category: 'baremetal',
    type: 'Standalone Kernel',
    executable: 'memtest86+.bin / memtest86.efi',
    purpose: 'Independent bare-metal memory diagnostic tool capable of testing DDR3, DDR4, and DDR5 RAM topologies without an OS.',
    description: 'Identifies faulty memory sticks, bad trace connections, memory controller glitches, and address line errors with stress algorithms.',
    included: true,
    status: 'Integrated',
    tags: ['MemTest86+', 'DDR5 Stress', 'UEFI Bare-Metal']
  },
  {
    id: 'prime95_mprime',
    name: 'Prime95 / mprime & Stress-NG (CPU / Thermal Test)',
    category: 'baremetal',
    type: 'CLI',
    executable: 'mprime / stress-ng',
    purpose: 'Hardware stress testing and stability verification for CPU caches, AVX-512 execution units, and thermal throttling.',
    description: 'Runs Small FFTs to test CPU core stability, power delivery (VRM), and thermal thresholds, proving hardware readiness.',
    included: true,
    status: 'Ready',
    tags: ['Stress Test', 'AVX2/512', 'Thermal Check', 'Stability']
  },
  {
    id: 'dban_nwipe',
    name: 'NWipe / DBAN (NIST 800-88 & DoD 5220.22-M Wipe)',
    category: 'baremetal',
    type: 'CLI',
    executable: 'nwipe / blkdiscard / hdparm',
    purpose: 'Military-grade, verifiable disk sanitization and secure cryptographic erasure for drives prior to decommissioning or resale.',
    description: 'Executes DoD 5220.22-M, Gutmann, and NIST SP 800-88 Clear/Purge methods, including NVMe Sanitize and ATA Secure Erase.',
    included: true,
    status: 'Ready',
    tags: ['DoD Wipe', 'NIST 800-88', 'NVMe Sanitize', 'Data Destruction']
  },
  {
    id: 'super_grub2_disk',
    name: 'Super GRUB2 Disk & EFI Boot Searcher',
    category: 'baremetal',
    type: 'Standalone Kernel',
    executable: 'super_grub2_disk.iso',
    purpose: 'Boots any unbootable operating system (Linux, Windows, BSD) even when its own bootloader is destroyed or missing.',
    description: 'Scans all connected disks and partitions for installed OS kernels, EFI loaders, and BCD files, providing immediate boot bypass.',
    included: true,
    status: 'Ready',
    tags: ['Boot Bypass', 'GRUB Rescue', 'EFI Search']
  },

  // ==========================================
  // Advanced Decryption, Media Healing & Cloud Offload
  // ==========================================
  {
    id: 'bitlocker_luks_assist',
    name: 'BitLocker To Go & LUKS Offline Decryption Assist',
    category: 'forensics',
    type: 'GUI',
    executable: 'dislocker / cryptsetup',
    purpose: 'Unlocks BitLocker-encrypted USB/SD cards and LUKS2 containers offline via 48-digit recovery keys or passphrases.',
    description: 'Provides FUSE-level cleartext virtual block access to encrypted volumes for forensic scanning, file extraction, and carving.',
    included: true,
    status: 'Integrated',
    tags: ['BitLocker', 'LUKS2', 'dislocker', 'Recovery Key', 'FUSE']
  },
  {
    id: 'raw_video_moov_healer',
    name: 'Automated RAW Video Hex Healer (MOOV Atom Rebuilder)',
    category: 'forensics',
    type: 'GUI',
    executable: 'untrunc / ffmpeg / mp4box',
    purpose: 'Reconstructs missing MOOV atom headers for truncated MP4/MOV/4K drone and camera files cut short by power failure.',
    description: 'Synthesizes STTS/STSZ/STCO time-to-sample matrices from reference footage, rebuilding 100% playable H.264/H.265 video files.',
    included: true,
    status: 'Integrated',
    tags: ['Untrunc', 'MOOV Atom', 'DJI Repair', 'GoPro Fix', 'H.265']
  },
  {
    id: 'cloud_backup_rclone',
    name: 'Encrypted Cloud & Remote Backup Uploader (rclone / S3 / SFTP)',
    category: 'forensics',
    type: 'GUI',
    executable: 'rclone sync',
    purpose: 'Streams salvaged photos, documents, and disk images directly to Amazon S3, Google Drive, SFTP, or Nextcloud with client encryption.',
    description: 'Features client-side AES-256-GCM zero-knowledge encryption, SHA-256 cloud checksum auditing, and parallel multi-part transfers.',
    included: true,
    status: 'Integrated',
    tags: ['Rclone', 'AWS S3', 'Google Drive', 'SFTP', 'AES-256 Crypt']
  },

  // ==========================================
  // Diamond-Grade Forensic & Diagnostic Suite
  // ==========================================
  {
    id: 'forensic_write_blocker',
    name: 'Forensic Hardware-Level Software Write-Blocker',
    category: 'forensics',
    type: 'GUI',
    executable: 'blockdev / udev-ro',
    purpose: 'Guarantees 100% evidentiary integrity by enforcing kernel /sys/block/*/ro lockdown and blocking all write/dirty-bit modifications.',
    description: 'NIST SP 800-86 compliant write-blocker intercepting raw disk writes, journaling commits, and inode atime updates during evidence ingestion.',
    included: true,
    status: 'Integrated',
    tags: ['Write-Blocker', 'NIST 800-86', 'Kernel RO', 'Evidence Integrity', 'Safe Carve']
  },
  {
    id: 'volatile_memory_triage',
    name: 'Live Volatile Memory Dump & RAM Triage (LiME / AVML)',
    category: 'forensics',
    type: 'GUI',
    executable: 'avml / lime / volatility3',
    purpose: 'Dumps active physical RAM to disk and carves BitLocker FVEKs, TLS master secrets, plaintext credentials, and injected RWX malware.',
    description: 'Direct /dev/crash memory acquisition with real-time Volatility 3 malfind analysis and cryptographic AES-XTS expansion key unsealing.',
    included: true,
    status: 'Integrated',
    tags: ['Live RAM', 'AVML', 'Volatility 3', 'Key Carving', 'Malfind', 'LiME']
  },
  {
    id: 'hardware_stress_suite',
    name: 'OEM Hardware Stress & Diagnostic Suite (MemTest / AVX / SMART)',
    category: 'diagnostics',
    type: 'GUI',
    executable: 'memtester / prime95 / smartctl',
    purpose: 'Exhaustive multi-core DDR4/DDR5 bitflip testing, CPU AVX-512 thermal torture, NVMe 4K random IOPS benchmarks, and GPU VRAM scanner.',
    description: 'Pinpoints failing memory sticks, cracked BGA solder joints, power delivery VRM throttling, and storage wear without boot dependencies.',
    included: true,
    status: 'Integrated',
    tags: ['MemTest86+', 'Prime95', 'DDR5 Stress', 'SMART IOPS', 'VRAM Scan']
  },
  {
    id: 'forensic_report_generator',
    name: 'Automated Forensic Audit & Chain-of-Custody Report Generator',
    category: 'forensics',
    type: 'GUI',
    executable: 'forensic-report-gen',
    purpose: 'Produces courtroom-ready certified PDF/HTML incident reports with SHA-256 evidence hashes, event timeline, and digital signature seals.',
    description: 'Tracks full chain of custody across ingestion, write-blocking, decryption, and carving with tamper-evident digital certificate seals.',
    included: true,
    status: 'Integrated',
    tags: ['Chain of Custody', 'Forensic PDF', 'SHA-256 Audit', 'Courtroom Ready', 'NIST']
  },
  {
    id: 'windows_sam_chntpw',
    name: 'Offline Windows SAM & Registry Password Assist (chntpw / hivex)',
    category: 'repair',
    type: 'GUI',
    executable: 'chntpw / hivexregedit',
    purpose: 'Blanks/resets Windows user & Admin passwords, unlocks disabled accounts, and purges offline registry Run/RunOnce malware persistence.',
    description: 'Direct offline manipulation of SAM and SOFTWARE hives, allowing instant access recovery and rootkit persistence neutralization.',
    included: true,
    status: 'Integrated',
    tags: ['chntpw', 'SAM Hive', 'Password Reset', 'Admin Unlock', 'Registry Cleaner']
  },
  {
    id: 'nist_data_sanitizer',
    name: 'Air-Gapped Certified Data Sanitizer & NVMe Crypto-Erase (NIST SP 800-88 / DoD)',
    category: 'disk',
    type: 'GUI',
    executable: 'nvme format --ses=2 / nwipe',
    purpose: 'Purges NVMe media encryption keys (instant hardware crypto-erase) and executes DoD 5220.22-M multi-pass overwrites with entropy validation.',
    description: 'Generates digitally signed Certificates of Destruction verifying 0.00 data remanence for compliant decommission.',
    included: true,
    status: 'Integrated',
    tags: ['NIST 800-88', 'Crypto-Erase', 'DoD 5220.22-M', 'Entropy Verification', 'Certificate']
  },
  {
    id: 'uefi_rootkit_scanner',
    name: 'Offline UEFI / BIOS Rootkit & SPI Flash Scanner (Chipsec / Flashrom)',
    category: 'firmware',
    type: 'GUI',
    executable: 'chipsec_main / flashrom',
    purpose: 'Inspects SPI flash ROM, audits SMM (Ring -2) rootkits (MoonBounce/BlackLotus), and validates Secure Boot DBX revoked keys.',
    description: 'Hardware-level SPI bus inspector and NVRAM DXE driver validator for APT firmware persistence elimination.',
    included: true,
    status: 'Integrated',
    tags: ['Chipsec', 'Flashrom', 'UEFI Rootkit', 'SMM Audit', 'DBX Revocation']
  },
  {
    id: 'forensic_supertimeline',
    name: 'Forensic Super-Timeline & Artifact Reconstructor (Plaso / MFT / EVTX)',
    category: 'forensics',
    type: 'GUI',
    executable: 'log2timeline.py / psort.py',
    purpose: 'Reconstructs microsecond incident timelines from NTFS $MFT, $LogFile, $UsnJrnl, Windows Security .evtx, and USB Shellbags.',
    description: 'Chronologically correlates file creation, process launches, logon activity, and USB insertions into courtroom CSV/timeline views.',
    included: true,
    status: 'Integrated',
    tags: ['Plaso', 'log2timeline', '$MFT', 'EVTX Parser', 'Super-Timeline']
  },
  {
    id: 'stealth_network_triage',
    name: 'Air-Gapped Stealth Network Triage & Rogue Hunter (Zeek / Passive TAP)',
    category: 'network',
    type: 'GUI',
    executable: 'zeek / bettercap / tcpdump',
    purpose: 'Captures promiscuous PCAP in zero-emission silent mode (no ARP/DHCP broadcasts) while flagging ARP poisoning, rogue DHCP, and C2 beacons.',
    description: 'Passive IDS engine inspecting enterprise/SCADA subnets with zero packet footprint.',
    included: true,
    status: 'Integrated',
    tags: ['Passive TAP', 'Zeek IDS', 'Zero-Emission', 'Rogue DHCP', 'C2 Detection']
  },
  {
    id: 'offline_yara_ransomware',
    name: 'Offline Multi-Engine YARA & Anti-Malware Neutralizer',
    category: 'forensics',
    type: 'GUI',
    executable: 'yara -r / clamscan / freshclam',
    purpose: 'Scans unmounted NTFS/ext4 drives with updateable threat rulesets (persistent on USB), quarantines vulnerable kernel drivers (BYOVD), and applies offline decryptors.',
    description: 'Eradicates rootkits and malware persistence without letting malicious code execute. Features live and air-gapped signature updating saved directly to USB persistent storage—no daily ISO re-burning required.',
    included: true,
    status: 'Integrated',
    tags: ['YARA Engine', 'ClamAV', 'Persistent Signatures', 'freshclam', 'BYOVD Quarantine', 'Offline Scan']
  },
  {
    id: 'pacman_pkg_manager',
    name: 'Pacman Package Manager & Arch Keyrings (libalpm)',
    category: 'linux',
    type: 'CLI',
    executable: 'pacman / pacman-key',
    purpose: 'Arch Linux native package manager and cryptographic GPG keyring manager (pacman-key --init / --populate archlinux).',
    description: 'Resolves dependencies, verifies GPG package signatures, and installs native rolling-release binaries.',
    included: true,
    status: 'Integrated',
    tags: ['pacman', 'Arch Linux', 'GPG Keyrings', 'libalpm', 'Package Manager']
  },
  {
    id: 'yay_aur_helper',
    name: 'Yay (Yet Another Yogurt) AUR Helper & Go Compiler',
    category: 'linux',
    type: 'CLI',
    executable: 'yay / makepkg',
    purpose: 'Automated Arch User Repository (AUR) helper and PKGBUILD compiler for building bleeding-edge forensic and kernel tools.',
    description: 'Compiles and installs software directly from the AUR with automated git cloning, dependency resolution, and sandbox builds.',
    included: true,
    status: 'Integrated',
    tags: ['yay', 'AUR', 'PKGBUILD', 'Go Binary', 'Arch Helper']
  },
  {
    id: 'multidistro_repo_hook',
    name: 'Multi-Distro Repository & GPG Keyring Hook (Debian, Arch, Kali)',
    category: 'linux',
    type: 'GUI',
    executable: 'apt-key / pacman-key / gpg --recv-keys',
    purpose: 'Cryptographic repository bridge hooking into Debian 13 (Trixie), Arch Linux (Core/Extra), and Kali Linux (Rolling DFIR).',
    description: 'Imports and manages GPG Web-of-Trust keyrings, synchronizes upstream mirrors, and cross-installs security packages.',
    included: true,
    status: 'Integrated',
    tags: ['Debian', 'Kali Linux', 'Arch', 'GPG Web of Trust', 'APT / Pacman Bridge']
  }
];
