// jb7572_2026-08-28: Storage, Internal Mirror SSD & Partition Management Engine
// Author: System Administrator - Root / Chief Forensic Architect

export interface StoragePartition {
  id: string;
  device: string; // e.g. /dev/nvme0n1p1
  name: string;
  mountPoint: string;
  fileSystem: 'ext4' | 'ext2' | 'vfat' | 'ntfs' | 'swap' | 'btrfs' | 'xfs' | 'zfs' | 'exfat';
  totalBytes: number;
  usedBytes: number;
  freeBytes: number;
  totalFormatted: string;
  usedFormatted: string;
  freeFormatted: string;
  usagePercent: number;
  type: 'EFI System' | 'Linux Root Filesystem' | 'Linux Home & Data' | 'Win32 NTFS Layer' | 'Swap Partition' | 'Protected Recovery Partition' | 'User Custom Volume' | 'External Backup Store';
  status: 'HEALTHY' | 'OPTIMAL' | 'DEGRADED' | 'UNFORMATTED';
  isMounted: boolean;
  isReadOnly?: boolean;
  isProtected?: boolean;
  color: string;
}

export interface PhysicalDisk {
  id: string;
  devicePath: string; // e.g. /dev/nvme0n1, /dev/nvme1n1, /dev/sda, /dev/sdb
  model: string;
  type: 'NVMe SSD' | 'Internal Mirror SSD' | 'SATA SSD' | 'External USB Storage' | 'VirtIO Virtual Disk' | 'Raw Uninitialized Disk';
  busInterface: 'PCIe 4.0 x4 (NVMe)' | 'PCIe 4.0 x4 Mirror Direct-Bus' | 'SATA 6Gbps' | 'USB 3.2 Gen 2x2' | 'VirtIO-PCI';
  sizeBytes: number;
  sizeFormatted: string;
  partitionTable: 'GPT (GUID Partition Table)' | 'MBR (Master Boot Record)' | 'UNINITIALIZED';
  isInitialized: boolean;
  health: 'GOOD (100% SMART)' | 'OPTIMAL' | 'DEGRADED' | 'MIRROR_SYNCHRONIZED';
  smartScore: number; // 0 - 100%
  temperatureC: number;
  trimSupported: boolean;
  isRemovable?: boolean;
  usbLockedDown?: boolean; // Requires PIN bypass if true
  usbBypassToken?: string;
  hardwareSerial: string;
  vendorId?: string;
  productId?: string;
  partitions: StoragePartition[];
}

export interface InternalMirrorStatus {
  primaryDiskDevice: string;
  mirrorDiskDevice: string;
  primaryDiskModel: string;
  mirrorDiskModel: string;
  syncPercent: number; // 100.0%
  status: 'SYNCHRONIZED_100' | 'SCRUBBING' | 'RESYNCING' | 'REBUILDING';
  replicationEngine: 'Microkernel Live Mirror Sync Engine (Zero-Copy Dual-Write)' | 'Kernel Hardware NVMe RAID-1';
  desyncBlocks: number;
  totalSyncedBlocks: number;
  replicationLatencyMs: number;
  readThroughputMbPerSec: number;
  writeThroughputMbPerSec: number;
  lastScrubTimestamp: string;
  scrubParityMismatches: number;
  scrubRateMbPerSec: number;
  scrubProgressPercent: number;
  autoHealEnabled: boolean;
}

export interface StorageDirectoryNode {
  path: string;
  name: string;
  sizeBytes: number;
  sizeFormatted: string;
  percentOfParent: number;
  itemCount: number;
  category: 'KERNEL_BIN' | 'DRIVERS' | 'SUBSYSTEMS' | 'SYSTEM_LIBS' | 'WIN32_APPS' | 'TEMP_CACHE' | 'LOGS' | 'BACKUPS';
  canClean?: boolean;
}

import { StorageBenchmarkResult, FsckIntegrityReport, FsckBlockSector } from '../types';

const initialDisks: PhysicalDisk[] = [
  {
    id: 'nvme0',
    devicePath: '/dev/nvme0n1',
    model: 'PCIe NVMe Gen4 High-Speed Primary SSD (1024 GB)',
    type: 'NVMe SSD',
    busInterface: 'PCIe 4.0 x4 (NVMe)',
    sizeBytes: 1024 * 1024 * 1024 * 1024,
    sizeFormatted: '1.00 TB',
    partitionTable: 'GPT (GUID Partition Table)',
    isInitialized: true,
    health: 'GOOD (100% SMART)',
    smartScore: 100,
    temperatureC: 38,
    trimSupported: true,
    hardwareSerial: 'NVME-GEN4-S990P-884920',
    partitions: [
      {
        id: 'p1',
        device: '/dev/nvme0n1p1',
        name: 'ESP (EFI System Partition)',
        mountPoint: '/boot/efi',
        fileSystem: 'vfat',
        totalBytes: 512 * 1024 * 1024,
        usedBytes: 64 * 1024 * 1024,
        freeBytes: 448 * 1024 * 1024,
        totalFormatted: '512 MB',
        usedFormatted: '64 MB',
        freeFormatted: '448 MB',
        usagePercent: 12.5,
        type: 'EFI System',
        status: 'HEALTHY',
        isMounted: true,
        color: '#60a5fa' // blue-400
      },
      {
        id: 'p2',
        device: '/dev/nvme0n1p2',
        name: 'SecureCurtain Root System (/sys)',
        mountPoint: '/',
        fileSystem: 'ext4',
        totalBytes: 256 * 1024 * 1024 * 1024,
        usedBytes: 48 * 1024 * 1024 * 1024,
        freeBytes: 208 * 1024 * 1024 * 1024,
        totalFormatted: '256.0 GB',
        usedFormatted: '48.0 GB',
        freeFormatted: '208.0 GB',
        usagePercent: 18.7,
        type: 'Linux Root Filesystem',
        status: 'HEALTHY',
        isMounted: true,
        color: '#c4b5fd' // purple-300
      },
      {
        id: 'p3',
        device: '/dev/nvme0n1p3',
        name: 'User Projects & Subsystems (/home)',
        mountPoint: '/home',
        fileSystem: 'ext4',
        totalBytes: 512 * 1024 * 1024 * 1024,
        usedBytes: 120 * 1024 * 1024 * 1024,
        freeBytes: 392 * 1024 * 1024 * 1024,
        totalFormatted: '512.0 GB',
        usedFormatted: '120.0 GB',
        freeFormatted: '392.0 GB',
        usagePercent: 23.4,
        type: 'Linux Home & Data',
        status: 'HEALTHY',
        isMounted: true,
        color: '#34d399' // emerald-400
      },
      {
        id: 'p4',
        device: '/dev/nvme0n1p4',
        name: 'Win32 System Drive (C:)',
        mountPoint: '/mnt/c_drive',
        fileSystem: 'ntfs',
        totalBytes: 224 * 1024 * 1024 * 1024,
        usedBytes: 35 * 1024 * 1024 * 1024,
        freeBytes: 189 * 1024 * 1024 * 1024,
        totalFormatted: '224.0 GB',
        usedFormatted: '35.0 GB',
        freeFormatted: '189.0 GB',
        usagePercent: 15.6,
        type: 'Win32 NTFS Layer',
        status: 'HEALTHY',
        isMounted: true,
        color: '#fbbf24' // amber-400
      },
      {
        id: 'p5',
        device: '/dev/nvme0n1p5',
        name: 'Fast Kernel Page Swap',
        mountPoint: '[SWAP]',
        fileSystem: 'swap',
        totalBytes: 32 * 1024 * 1024 * 1024,
        usedBytes: 2 * 1024 * 1024 * 1024,
        freeBytes: 30 * 1024 * 1024 * 1024,
        totalFormatted: '32.0 GB',
        usedFormatted: '2.0 GB',
        freeFormatted: '30.0 GB',
        usagePercent: 6.2,
        type: 'Swap Partition',
        status: 'HEALTHY',
        isMounted: true,
        color: '#f87171' // red-400
      },
      {
        id: 'p6',
        device: '/dev/nvme0n1p6',
        name: 'Golden Image OS Recovery (Protected Read-Only)',
        mountPoint: '/recovery',
        fileSystem: 'btrfs',
        totalBytes: 32 * 1024 * 1024 * 1024,
        usedBytes: 14.2 * 1024 * 1024 * 1024,
        freeBytes: 17.8 * 1024 * 1024 * 1024,
        totalFormatted: '32.0 GB',
        usedFormatted: '14.2 GB',
        freeFormatted: '17.8 GB',
        usagePercent: 44.3,
        type: 'Protected Recovery Partition',
        status: 'OPTIMAL',
        isMounted: true,
        isReadOnly: true,
        isProtected: true,
        color: '#ec4899' // pink-500
      }
    ]
  },
  {
    id: 'nvme1',
    devicePath: '/dev/nvme1n1',
    model: 'PCIe NVMe Gen4 Internal Live Hardware Mirror SSD (1024 GB)',
    type: 'Internal Mirror SSD',
    busInterface: 'PCIe 4.0 x4 Mirror Direct-Bus',
    sizeBytes: 1024 * 1024 * 1024 * 1024,
    sizeFormatted: '1.00 TB',
    partitionTable: 'GPT (GUID Partition Table)',
    isInitialized: true,
    health: 'MIRROR_SYNCHRONIZED',
    smartScore: 100,
    temperatureC: 39,
    trimSupported: true,
    hardwareSerial: 'NVME-GEN4-MIRROR-884921',
    partitions: [
      {
        id: 'm1',
        device: '/dev/nvme1n1p1',
        name: 'Mirror ESP Clone',
        mountPoint: '[MIRROR-SYNC: /boot/efi]',
        fileSystem: 'vfat',
        totalBytes: 512 * 1024 * 1024,
        usedBytes: 64 * 1024 * 1024,
        freeBytes: 448 * 1024 * 1024,
        totalFormatted: '512 MB',
        usedFormatted: '64 MB',
        freeFormatted: '448 MB',
        usagePercent: 12.5,
        type: 'EFI System',
        status: 'OPTIMAL',
        isMounted: true,
        color: '#60a5fa'
      },
      {
        id: 'm2',
        device: '/dev/nvme1n1p2',
        name: 'Mirror Root Clone',
        mountPoint: '[MIRROR-SYNC: /]',
        fileSystem: 'ext4',
        totalBytes: 256 * 1024 * 1024 * 1024,
        usedBytes: 48 * 1024 * 1024 * 1024,
        freeBytes: 208 * 1024 * 1024 * 1024,
        totalFormatted: '256.0 GB',
        usedFormatted: '48.0 GB',
        freeFormatted: '208.0 GB',
        usagePercent: 18.7,
        type: 'Linux Root Filesystem',
        status: 'OPTIMAL',
        isMounted: true,
        color: '#c4b5fd'
      },
      {
        id: 'm3',
        device: '/dev/nvme1n1p3',
        name: 'Mirror User Home Clone',
        mountPoint: '[MIRROR-SYNC: /home]',
        fileSystem: 'ext4',
        totalBytes: 512 * 1024 * 1024 * 1024,
        usedBytes: 120 * 1024 * 1024 * 1024,
        freeBytes: 392 * 1024 * 1024 * 1024,
        totalFormatted: '512.0 GB',
        usedFormatted: '120.0 GB',
        freeFormatted: '392.0 GB',
        usagePercent: 23.4,
        type: 'Linux Home & Data',
        status: 'OPTIMAL',
        isMounted: true,
        color: '#34d399'
      },
      {
        id: 'm4',
        device: '/dev/nvme1n1p4',
        name: 'Mirror Win32 NTFS Clone',
        mountPoint: '[MIRROR-SYNC: /mnt/c_drive]',
        fileSystem: 'ntfs',
        totalBytes: 224 * 1024 * 1024 * 1024,
        usedBytes: 35 * 1024 * 1024 * 1024,
        freeBytes: 189 * 1024 * 1024 * 1024,
        totalFormatted: '224.0 GB',
        usedFormatted: '35.0 GB',
        freeFormatted: '189.0 GB',
        usagePercent: 15.6,
        type: 'Win32 NTFS Layer',
        status: 'OPTIMAL',
        isMounted: true,
        color: '#fbbf24'
      },
      {
        id: 'm5',
        device: '/dev/nvme1n1p5',
        name: 'Mirror Swap Clone',
        mountPoint: '[MIRROR-SYNC: [SWAP]]',
        fileSystem: 'swap',
        totalBytes: 32 * 1024 * 1024 * 1024,
        usedBytes: 2 * 1024 * 1024 * 1024,
        freeBytes: 30 * 1024 * 1024 * 1024,
        totalFormatted: '32.0 GB',
        usedFormatted: '2.0 GB',
        freeFormatted: '30.0 GB',
        usagePercent: 6.2,
        type: 'Swap Partition',
        status: 'OPTIMAL',
        isMounted: true,
        color: '#f87171'
      },
      {
        id: 'm6',
        device: '/dev/nvme1n1p6',
        name: 'Mirror Golden Image Clone',
        mountPoint: '[MIRROR-SYNC: /recovery]',
        fileSystem: 'btrfs',
        totalBytes: 32 * 1024 * 1024 * 1024,
        usedBytes: 14.2 * 1024 * 1024 * 1024,
        freeBytes: 17.8 * 1024 * 1024 * 1024,
        totalFormatted: '32.0 GB',
        usedFormatted: '14.2 GB',
        freeFormatted: '17.8 GB',
        usagePercent: 44.3,
        type: 'Protected Recovery Partition',
        status: 'OPTIMAL',
        isMounted: true,
        isReadOnly: true,
        color: '#ec4899'
      }
    ]
  },
  {
    id: 'sda',
    devicePath: '/dev/sda',
    model: 'Crucial MX500 SATA Secondary Data SSD (2000 GB)',
    type: 'SATA SSD',
    busInterface: 'SATA 6Gbps',
    sizeBytes: 2000 * 1024 * 1024 * 1024,
    sizeFormatted: '2.00 TB',
    partitionTable: 'GPT (GUID Partition Table)',
    isInitialized: true,
    health: 'GOOD (100% SMART)',
    smartScore: 99,
    temperatureC: 34,
    trimSupported: true,
    hardwareSerial: 'SATA-CRUCIAL-MX500-771924',
    partitions: [
      {
        id: 'sda_p1',
        device: '/dev/sda1',
        name: 'Forensic Evidence Cache & Large Datasets',
        mountPoint: '/mnt/storage',
        fileSystem: 'ext4',
        totalBytes: 1500 * 1024 * 1024 * 1024,
        usedBytes: 420 * 1024 * 1024 * 1024,
        freeBytes: 1080 * 1024 * 1024 * 1024,
        totalFormatted: '1.50 TB',
        usedFormatted: '420.0 GB',
        freeFormatted: '1.08 TB',
        usagePercent: 28.0,
        type: 'User Custom Volume',
        status: 'HEALTHY',
        isMounted: true,
        color: '#38bdf8'
      },
      {
        id: 'sda_p2',
        device: '/dev/sda2',
        name: 'Local Backup Repository (Zstd VMSNAP)',
        mountPoint: '/mnt/local_backups',
        fileSystem: 'btrfs',
        totalBytes: 500 * 1024 * 1024 * 1024,
        usedBytes: 203 * 1024 * 1024 * 1024,
        freeBytes: 297 * 1024 * 1024 * 1024,
        totalFormatted: '500.0 GB',
        usedFormatted: '203.0 GB',
        freeFormatted: '297.0 GB',
        usagePercent: 40.6,
        type: 'External Backup Store',
        status: 'HEALTHY',
        isMounted: true,
        color: '#a855f7'
      }
    ]
  },
  {
    id: 'usb_sandisk',
    devicePath: '/dev/sdb',
    model: 'SanDisk Extreme Pro Portable NVMe USB 3.2 SSD (1000 GB)',
    type: 'External USB Storage',
    busInterface: 'USB 3.2 Gen 2x2',
    sizeBytes: 1000 * 1024 * 1024 * 1024,
    sizeFormatted: '1.00 TB',
    partitionTable: 'GPT (GUID Partition Table)',
    isInitialized: true,
    health: 'OPTIMAL',
    smartScore: 100,
    temperatureC: 36,
    trimSupported: true,
    isRemovable: true,
    usbLockedDown: true, // Controlled by Admin Elevated PIN!
    hardwareSerial: 'SN:AA01092847291',
    vendorId: '0781',
    productId: '5583',
    partitions: [
      {
        id: 'sdb_p1',
        device: '/dev/sdb1',
        name: 'Secure Vault External Backup Target',
        mountPoint: '/media/usb_sandisk_extreme/backups',
        fileSystem: 'ext4',
        totalBytes: 1000 * 1024 * 1024 * 1024,
        usedBytes: 323.5 * 1024 * 1024 * 1024,
        freeBytes: 676.5 * 1024 * 1024 * 1024,
        totalFormatted: '1000.0 GB',
        usedFormatted: '323.5 GB',
        freeFormatted: '676.5 GB',
        usagePercent: 32.4,
        type: 'External Backup Store',
        status: 'HEALTHY',
        isMounted: true,
        color: '#f59e0b'
      }
    ]
  }
];

const initialDirectories: StorageDirectoryNode[] = [
  {
    path: '/sys/subsystems',
    name: 'subsystems (Audio, GUI, Network, Win32)',
    sizeBytes: 18.4 * 1024 * 1024 * 1024,
    sizeFormatted: '18.4 GB',
    percentOfParent: 38.3,
    itemCount: 420,
    category: 'SUBSYSTEMS'
  },
  {
    path: '/sys/drivers',
    name: 'drivers (NVMe, VirtIO-GPU, HDA, e1000)',
    sizeBytes: 12.1 * 1024 * 1024 * 1024,
    sizeFormatted: '12.1 GB',
    percentOfParent: 25.2,
    itemCount: 165,
    category: 'DRIVERS'
  },
  {
    path: '/sys/apps/win32',
    name: 'apps/win32 (PE32+ Binaries, DLLs)',
    sizeBytes: 8.2 * 1024 * 1024 * 1024,
    sizeFormatted: '8.2 GB',
    percentOfParent: 17.1,
    itemCount: 88,
    category: 'WIN32_APPS'
  },
  {
    path: '/sys/kernel',
    name: 'kernel (Ring 0 ELF image, GDT, IDT, VMM)',
    sizeBytes: 4.5 * 1024 * 1024 * 1024,
    sizeFormatted: '4.5 GB',
    percentOfParent: 9.4,
    itemCount: 92,
    category: 'KERNEL_BIN'
  },
  {
    path: '/var/cache/sys_build',
    name: 'Temporary Compiler Build Artifacts (.o / .a)',
    sizeBytes: 3.2 * 1024 * 1024 * 1024,
    sizeFormatted: '3.2 GB',
    percentOfParent: 6.7,
    itemCount: 640,
    category: 'TEMP_CACHE',
    canClean: true
  },
  {
    path: '/var/log/journal',
    name: 'Persistent Systemd Journal Logs',
    sizeBytes: 1.6 * 1024 * 1024 * 1024,
    sizeFormatted: '1.6 GB',
    percentOfParent: 3.3,
    itemCount: 42,
    category: 'LOGS',
    canClean: true
  }
];

class StorageService {
  private disks: PhysicalDisk[] = JSON.parse(JSON.stringify(initialDisks));
  private directoryNodes: StorageDirectoryNode[] = JSON.parse(JSON.stringify(initialDirectories));

  // 100% In-Sync Internal Mirror Status
  private mirrorStatus: InternalMirrorStatus = {
    primaryDiskDevice: '/dev/nvme0n1',
    mirrorDiskDevice: '/dev/nvme1n1',
    primaryDiskModel: 'Samsung NVMe Gen4 Primary (1024 GB)',
    mirrorDiskModel: 'Internal Match-Paired Mirror SSD (1024 GB)',
    syncPercent: 100.0,
    status: 'SYNCHRONIZED_100',
    replicationEngine: 'Microkernel Live Mirror Sync Engine (Zero-Copy Dual-Write)',
    desyncBlocks: 0,
    totalSyncedBlocks: 268435456, // 1TB / 4KB sectors
    replicationLatencyMs: 0.012,
    readThroughputMbPerSec: 7120.4,
    writeThroughputMbPerSec: 5410.2,
    lastScrubTimestamp: '2026-08-28 18:40 UTC',
    scrubParityMismatches: 0,
    scrubRateMbPerSec: 4200.0,
    scrubProgressPercent: 100.0,
    autoHealEnabled: true
  };

  private lastBenchmark: StorageBenchmarkResult = {
    device: '/dev/nvme0n1',
    testProfile: 'PEAK_PERFORMANCE',
    seqReadMbPerSec: 7120.5,
    seqWriteMbPerSec: 5410.2,
    rand4kReadIops: 792000,
    rand4kWriteIops: 654000,
    rand4kReadLatencyMs: 0.048,
    rand4kWriteLatencyMs: 0.065,
    queueDepth: 32,
    testBlockSize: '1 MiB / 4 KiB Q32T16',
    status: 'COMPLETED'
  };

  private fsckReport: FsckIntegrityReport = {
    partitionDevice: '/dev/nvme0n1p2',
    mountPoint: '/',
    fileSystem: 'ext4',
    isClean: true,
    checkedInodes: 124580,
    nonContiguousFiles: 142,
    checkedBlocks: 18459200,
    fragmentationPercent: 0.12,
    pass1_inodesStatus: 'Pass 1: Checking inodes, blocks, and sizes — [OK 124,580 inodes]',
    pass2_dirStructureStatus: 'Pass 2: Checking directory structure — [OK 14,290 directories]',
    pass3_connectivityStatus: 'Pass 3: Checking directory connectivity — [OK No orphaned inodes]',
    pass4_refCountsStatus: 'Pass 4: Checking reference counts — [OK Inode link count match]',
    pass5_groupSummaryStatus: 'Pass 5: Checking group summary information — [OK Block bitmap match]',
    badBlocksFound: 0,
    repairedBlocks: 0,
    journalReplayStatus: 'Journal superblock magic valid (JBD2). 0 uncommitted transactions.',
    lastCheckedDate: '2026-08-28 18:45 UTC'
  };

  private badBlocks: FsckBlockSector[] = Array.from({ length: 64 }, (_, i) => ({
    id: i,
    status: (i === 27 || i === 53) ? 'CORRUPTED' : 'GOOD'
  }));

  // Retrieve all physical block devices
  public getDisks(): PhysicalDisk[] {
    return this.disks;
  }

  public getDiskById(id: string): PhysicalDisk | undefined {
    return this.disks.find(d => d.id === id);
  }

  // Retrieve 100% Mirror SSD Telemetry
  public getInternalMirrorStatus(): InternalMirrorStatus {
    return { ...this.mirrorStatus };
  }

  // Trigger real-time mirror scrub & parity verification
  public triggerMirrorScrub(): { success: boolean; message: string; mismatches: number } {
    this.mirrorStatus.status = 'SCRUBBING';
    this.mirrorStatus.scrubProgressPercent = 100.0;
    this.mirrorStatus.scrubParityMismatches = 0;
    this.mirrorStatus.lastScrubTimestamp = new Date().toISOString().replace('T', ' ').substring(0, 19) + ' UTC';
    this.mirrorStatus.status = 'SYNCHRONIZED_100';
    return {
      success: true,
      message: `Mirror scrub completed across /dev/nvme0n1 <-> /dev/nvme1n1. Bit-for-bit SHA-256 verification passed with 0 parity mismatches.`,
      mismatches: 0
    };
  }

  // Simulate hot-plugging a brand new raw disk
  public addNewRawDisk(modelName?: string, sizeGb: number = 500): PhysicalDisk {
    const nextIdx = this.disks.filter(d => d.id.startsWith('new_drive')).length + 1;
    const deviceNode = `/dev/nvme${nextIdx + 1}n1`;
    const newDisk: PhysicalDisk = {
      id: `new_drive_${Date.now()}`,
      devicePath: deviceNode,
      model: modelName || `High-Speed Raw SSD Drive (${sizeGb} GB)`,
      type: 'Raw Uninitialized Disk',
      busInterface: 'PCIe 4.0 x4 (NVMe)',
      sizeBytes: sizeGb * 1024 * 1024 * 1024,
      sizeFormatted: `${sizeGb}.0 GB`,
      partitionTable: 'UNINITIALIZED',
      isInitialized: false,
      health: 'OPTIMAL',
      smartScore: 100,
      temperatureC: 32,
      trimSupported: true,
      hardwareSerial: `SN:RAW-BLK-${Math.random().toString(36).substring(2, 9).toUpperCase()}`,
      partitions: []
    };
    this.disks.push(newDisk);
    return newDisk;
  }

  // Initialize raw disk with partition table (GPT or MBR)
  public initializeDisk(diskId: string, tableType: 'GPT' | 'MBR'): { success: boolean; message: string } {
    const disk = this.disks.find(d => d.id === diskId);
    if (!disk) return { success: false, message: `Disk ${diskId} not found.` };

    disk.isInitialized = true;
    disk.partitionTable = tableType === 'GPT' ? 'GPT (GUID Partition Table)' : 'MBR (Master Boot Record)';
    disk.type = disk.devicePath.includes('nvme') ? 'NVMe SSD' : 'SATA SSD';
    disk.partitions = [];

    return {
      success: true,
      message: `SUCCESS: Initialized disk ${disk.devicePath} with ${disk.partitionTable} and wrote fresh disk signature.`
    };
  }

  // Partition a disk by creating a new volume slice
  public createPartition(
    diskId: string,
    params: {
      name: string;
      sizeGb: number;
      mountPoint: string;
      fileSystem: StoragePartition['fileSystem'];
      type?: StoragePartition['type'];
    }
  ): { success: boolean; message: string; partition?: StoragePartition } {
    const disk = this.disks.find(d => d.id === diskId);
    if (!disk) return { success: false, message: `Disk ${diskId} not found.` };
    if (!disk.isInitialized) return { success: false, message: `Disk ${disk.devicePath} must be initialized before partitioning.` };

    const partNum = disk.partitions.length + 1;
    const partDevice = disk.devicePath.includes('nvme') 
      ? `${disk.devicePath}p${partNum}` 
      : `${disk.devicePath}${partNum}`;

    const totalBytes = params.sizeGb * 1024 * 1024 * 1024;
    const usedBytes = 64 * 1024 * 1024; // minimal filesystem superblock
    const freeBytes = totalBytes - usedBytes;

    const colors = ['#38bdf8', '#34d399', '#c4b5fd', '#fbbf24', '#f87171', '#a855f7'];
    const chosenColor = colors[partNum % colors.length];

    const newPartition: StoragePartition = {
      id: `p_${Date.now()}_${partNum}`,
      device: partDevice,
      name: params.name || `Volume ${partNum}`,
      mountPoint: params.mountPoint || `/mnt/vol_${partNum}`,
      fileSystem: params.fileSystem || 'ext4',
      totalBytes,
      usedBytes,
      freeBytes,
      totalFormatted: `${params.sizeGb}.0 GB`,
      usedFormatted: '64 MB',
      freeFormatted: `${(freeBytes / (1024 * 1024 * 1024)).toFixed(1)} GB`,
      usagePercent: +( (usedBytes / totalBytes) * 100 ).toFixed(1),
      type: params.type || 'User Custom Volume',
      status: 'HEALTHY',
      isMounted: true,
      color: chosenColor
    };

    disk.partitions.push(newPartition);

    return {
      success: true,
      message: `SUCCESS: Created partition ${partDevice} (${params.sizeGb} GB ${params.fileSystem.toUpperCase()}) mounted at ${newPartition.mountPoint}.`,
      partition: newPartition
    };
  }

  // Delete a partition
  public deletePartition(diskId: string, partitionId: string): { success: boolean; message: string } {
    const disk = this.disks.find(d => d.id === diskId);
    if (!disk) return { success: false, message: `Disk ${diskId} not found.` };

    const part = disk.partitions.find(p => p.id === partitionId);
    if (!part) return { success: false, message: `Partition not found.` };

    if (part.mountPoint === '/' || part.isProtected) {
      return { success: false, message: `Cannot delete protected or active root system partition (${part.device}).` };
    }

    disk.partitions = disk.partitions.filter(p => p.id !== partitionId);
    return {
      success: true,
      message: `SUCCESS: Deleted partition ${part.device} [${part.name}]. Space returned to unallocated pool.`
    };
  }

  // Format partition with target filesystem
  public formatPartition(
    diskId: string, 
    partitionId: string, 
    newFs: StoragePartition['fileSystem']
  ): { success: boolean; message: string } {
    const disk = this.disks.find(d => d.id === diskId);
    if (!disk) return { success: false, message: `Disk ${diskId} not found.` };

    const part = disk.partitions.find(p => p.id === partitionId);
    if (!part) return { success: false, message: `Partition ${partitionId} not found.` };

    if (part.mountPoint === '/') {
      return { success: false, message: 'ERROR: Cannot format the active root filesystem (/) while in use.' };
    }

    part.fileSystem = newFs;
    part.usedBytes = 64 * 1024 * 1024; // reset with minimal superblock
    part.usedFormatted = '64 MB';
    part.freeBytes = part.totalBytes - part.usedBytes;
    part.freeFormatted = `${(part.freeBytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
    part.usagePercent = +( (part.usedBytes / part.totalBytes) * 100 ).toFixed(1);

    return {
      success: true,
      message: `SUCCESS: Formatted ${part.device} [${part.name}] with ${newFs.toUpperCase()} filesystem.`
    };
  }

  // Format entire disk (wipes all partitions and creates 1 single full-volume partition)
  public formatEntireDisk(
    diskId: string,
    fileSystem: StoragePartition['fileSystem'],
    volumeLabel: string = 'Primary Volume'
  ): { success: boolean; message: string } {
    const disk = this.disks.find(d => d.id === diskId);
    if (!disk) return { success: false, message: `Disk ${diskId} not found.` };

    // Check if root is on this disk
    if (disk.partitions.some(p => p.mountPoint === '/')) {
      return { success: false, message: 'ERROR: Cannot wipe disk containing active root system (/dev/nvme0n1p2).' };
    }

    const totalGb = Math.floor(disk.sizeBytes / (1024 * 1024 * 1024));
    disk.partitions = [];
    return this.createPartition(diskId, {
      name: volumeLabel,
      sizeGb: totalGb,
      mountPoint: `/mnt/${disk.devicePath.replace('/dev/', '')}_vol`,
      fileSystem,
      type: 'User Custom Volume'
    });
  }

  // Retrieve disk usage directory breakdown for ncdu / Storage Sense
  public getDirectoryNodes(): StorageDirectoryNode[] {
    return this.directoryNodes;
  }

  public getBenchmark(): StorageBenchmarkResult {
    return this.lastBenchmark;
  }

  public runBenchmark(profile: 'PEAK_PERFORMANCE' | 'REAL_WORLD' | 'IOPS_STRESS'): StorageBenchmarkResult {
    if (profile === 'PEAK_PERFORMANCE') {
      this.lastBenchmark = {
        device: '/dev/nvme0n1',
        testProfile: 'PEAK_PERFORMANCE',
        seqReadMbPerSec: +(7000 + Math.random() * 250).toFixed(1),
        seqWriteMbPerSec: +(5300 + Math.random() * 200).toFixed(1),
        rand4kReadIops: Math.floor(780000 + Math.random() * 25000),
        rand4kWriteIops: Math.floor(645000 + Math.random() * 20000),
        rand4kReadLatencyMs: 0.046,
        rand4kWriteLatencyMs: 0.062,
        queueDepth: 32,
        testBlockSize: '1 MiB / 4 KiB Q32T16',
        status: 'COMPLETED'
      };
    } else if (profile === 'REAL_WORLD') {
      this.lastBenchmark = {
        device: '/dev/nvme0n1',
        testProfile: 'REAL_WORLD',
        seqReadMbPerSec: +(3850 + Math.random() * 150).toFixed(1),
        seqWriteMbPerSec: +(3100 + Math.random() * 120).toFixed(1),
        rand4kReadIops: Math.floor(410000 + Math.random() * 15000),
        rand4kWriteIops: Math.floor(360000 + Math.random() * 12000),
        rand4kReadLatencyMs: 0.082,
        rand4kWriteLatencyMs: 0.095,
        queueDepth: 1,
        testBlockSize: '128 KiB / 4 KiB Q1T1',
        status: 'COMPLETED'
      };
    } else {
      this.lastBenchmark = {
        device: '/dev/nvme0n1',
        testProfile: 'IOPS_STRESS',
        seqReadMbPerSec: +(4200 + Math.random() * 180).toFixed(1),
        seqWriteMbPerSec: +(3900 + Math.random() * 150).toFixed(1),
        rand4kReadIops: Math.floor(920000 + Math.random() * 35000),
        rand4kWriteIops: Math.floor(810000 + Math.random() * 25000),
        rand4kReadLatencyMs: 0.038,
        rand4kWriteLatencyMs: 0.049,
        queueDepth: 64,
        testBlockSize: '4 KiB Random Q64T32 (Extreme FIO Stress)',
        status: 'COMPLETED'
      };
    }
    return this.lastBenchmark;
  }

  public getFsckReport(partitionDevice?: string): FsckIntegrityReport {
    if (partitionDevice) {
      this.fsckReport.partitionDevice = partitionDevice;
    }
    return this.fsckReport;
  }

  public runFsckCheck(partitionDevice: string, repairMode: boolean = false): FsckIntegrityReport {
    const corruptCount = this.badBlocks.filter(b => b.status === 'CORRUPTED').length;
    
    if (repairMode) {
      this.badBlocks = this.badBlocks.map(b => b.status === 'CORRUPTED' ? { ...b, status: 'REPAIRED' } : b);
      this.fsckReport = {
        ...this.fsckReport,
        partitionDevice,
        isClean: true,
        badBlocksFound: 0,
        repairedBlocks: corruptCount,
        pass1_inodesStatus: 'Pass 1: Checking inodes, blocks, and sizes — [REPAIRED 2 bad sector pointers]',
        pass5_groupSummaryStatus: 'Pass 5: Checking group summary — [REPAIRED Inode bitmap & block descriptor table]',
        lastCheckedDate: new Date().toISOString().replace('T', ' ').substring(0, 19) + ' UTC'
      };
    } else {
      this.fsckReport = {
        ...this.fsckReport,
        partitionDevice,
        isClean: corruptCount === 0,
        badBlocksFound: corruptCount,
        lastCheckedDate: new Date().toISOString().replace('T', ' ').substring(0, 19) + ' UTC'
      };
    }
    return this.fsckReport;
  }

  public getBadBlocksGrid(): FsckBlockSector[] {
    return this.badBlocks;
  }

  public repairBadBlocks(): { success: boolean; message: string; repairedCount: number } {
    const count = this.badBlocks.filter(b => b.status === 'CORRUPTED').length;
    this.badBlocks = this.badBlocks.map(b => b.status === 'CORRUPTED' ? { ...b, status: 'REPAIRED' } : b);
    this.fsckReport.isClean = true;
    this.fsckReport.badBlocksFound = 0;
    this.fsckReport.repairedBlocks += count;
    return {
      success: true,
      message: `e2fsck / badblocks successfully re-allocated and marked ${count} weak sectors to reserve spare NAND blocks.`,
      repairedCount: count
    };
  }

  // Optimize / TRIM Solid State Drive blocks
  public trimOptimizeDisk(diskId: string): { success: boolean; message: string; trimmedGb: number } {
    const disk = this.disks.find(d => d.id === diskId);
    if (!disk) return { success: false, message: `Disk ${diskId} not found.`, trimmedGb: 0 };

    return {
      success: true,
      message: `SUCCESS: Issued NVMe Dataset Management TRIM command across ${disk.devicePath}. Reclaimed 14.8 GB of unallocated NAND blocks.`,
      trimmedGb: 14.8
    };
  }

  // Clean up temporary cache and build artifacts
  public cleanStorageSense(): { success: boolean; message: string; reclaimedBytesFormatted: string } {
    let reclaimed = 0;
    this.directoryNodes = this.directoryNodes.filter(d => {
      if (d.canClean) {
        reclaimed += d.sizeBytes;
        return false;
      }
      return true;
    });

    return {
      success: true,
      message: `Storage Sense cleanup finished. Removed temporary compiler caches and rotated journal logs.`,
      reclaimedBytesFormatted: `${(reclaimed / (1024 * 1024 * 1024)).toFixed(1)} GB`
    };
  }
}

export const storageService = new StorageService();
