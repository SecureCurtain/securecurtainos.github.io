// jb7572_2026-08-26: SecureCurtain Core Architecture - Flash & SD Card Deep File Retriever
import React, { useState, useEffect } from 'react';
import {
  CreditCard,
  HardDrive,
  Search,
  CheckCircle2,
  AlertTriangle,
  Play,
  Pause,
  RefreshCw,
  FolderDown,
  FileImage,
  FileVideo,
  FileAudio,
  FileText,
  Archive,
  Eye,
  ShieldCheck,
  Zap,
  Sliders,
  Terminal,
  Grid,
  List,
  Sparkles,
  ExternalLink,
  Lock,
  Camera,
  Folder,
  Download,
  CheckSquare,
  Square,
  Filter,
  Key,
  Film,
  CloudUpload,
  Cloud
} from 'lucide-react';
import { BitLockerUnlockerView } from './BitLockerUnlockerView';
import { VideoMoovHealerView } from './VideoMoovHealerView';
import { CloudBackupUploaderView } from './CloudBackupUploaderView';
import { ForensicWriteBlockerView } from './ForensicWriteBlockerView';
import { VolatileMemoryTriageView } from './VolatileMemoryTriageView';
import { HardwareStressDiagnosticsView } from './HardwareStressDiagnosticsView';
import { ForensicReportGeneratorView } from './ForensicReportGeneratorView';
import { WindowsSamChntpwView } from './WindowsSamChntpwView';
import { DataSanitizerWiperView } from './DataSanitizerWiperView';
import { UefiRootkitScannerView } from './UefiRootkitScannerView';
import { ForensicTimelineArtifactsView } from './ForensicTimelineArtifactsView';
import { StealthNetworkTriageView } from './StealthNetworkTriageView';
import { OfflineYaraRansomwareView } from './OfflineYaraRansomwareView';
import {
  Trash2,
  Cpu,
  Clock,
  Radio,
  Bug
} from 'lucide-react';

export interface FlashMediaCard {
  id: string;
  name: string;
  devicePath: string;
  capacity: string;
  fileSystem: 'exFAT' | 'FAT32' | 'NTFS' | 'RAW / Corrupted';
  busType: 'SDIO / UHS-I' | 'UHS-II' | 'USB 3.2 Card Reader' | 'CFast 2.0' | 'NVMe Reader';
  readSpeed: string;
  status: 'Ready' | 'Mounted (RO)' | 'RAW (Unallocated)' | 'Bad Sectors Detected';
  iconType: 'sd' | 'microsd' | 'cf' | 'usb';
  description: string;
}

export interface RecoveredItem {
  id: string;
  filename: string;
  category: 'photo' | 'video' | 'audio' | 'document' | 'archive';
  extension: string;
  sizeBytes: number;
  sizeFormatted: string;
  lbaSector: string;
  integrity: '100% Intact' | '98% High' | 'Reconstructed Header' | 'Fragmented';
  integrityScore: number;
  originalPath: string;
  cameraModel?: string;
  exifDate?: string;
  resolution?: string;
  duration?: string;
  hexHeader: string;
  selected: boolean;
}

const SAMPLE_FLASH_DEVICES: FlashMediaCard[] = [
  {
    id: 'sandisk_extreme_64',
    name: 'SanDisk Extreme PRO 64GB microSDXC V30',
    devicePath: '/dev/mmcblk0',
    capacity: '64.0 GB (59.6 GiB)',
    fileSystem: 'exFAT',
    busType: 'SDIO / UHS-I',
    readSpeed: '170 MB/s',
    status: 'Ready',
    iconType: 'microsd',
    description: 'Accidentally formatted in mirrorless camera (Canon EOS R6). Contains deleted RAW CR3 photos & 4K 60fps clips.'
  },
  {
    id: 'sony_tough_128',
    name: 'Sony TOUGH-G 128GB SDXC UHS-II V90',
    devicePath: '/dev/mmcblk1',
    capacity: '128.0 GB (119.2 GiB)',
    fileSystem: 'RAW / Corrupted',
    busType: 'UHS-II',
    readSpeed: '300 MB/s',
    status: 'RAW (Unallocated)',
    iconType: 'sd',
    description: 'MicroSD partition table wiped. File system unrecognized by Windows/macOS. Requires raw NAND cluster carving.'
  },
  {
    id: 'samsung_evo_256',
    name: 'Samsung EVO Plus 256GB microSDXC',
    devicePath: '/dev/sde',
    capacity: '256.0 GB (238.4 GiB)',
    fileSystem: 'FAT32',
    busType: 'USB 3.2 Card Reader',
    readSpeed: '130 MB/s',
    status: 'Ready',
    iconType: 'microsd',
    description: 'Smartphone memory card with deleted DCIM photo albums, WhatsApp voice notes, and WhatsApp document attachments.'
  },
  {
    id: 'dji_drone_64',
    name: 'DJI Mavic 3 Pro 64GB Extreme Card',
    devicePath: '/dev/mmcblk0p1',
    capacity: '64.0 GB (59.6 GiB)',
    fileSystem: 'exFAT',
    busType: 'SDIO / UHS-I',
    readSpeed: '160 MB/s',
    status: 'Ready',
    iconType: 'microsd',
    description: 'Drone memory card with truncated / unsaved D-Log M MP4 flight video files after premature battery disconnect.'
  },
  {
    id: 'kingston_usb_32',
    name: 'Kingston DataTraveler 32GB Flash Drive',
    devicePath: '/dev/sdf',
    capacity: '32.0 GB (29.8 GiB)',
    fileSystem: 'FAT32',
    busType: 'USB 3.2 Card Reader',
    readSpeed: '90 MB/s',
    status: 'Ready',
    iconType: 'usb',
    description: 'USB flash drive formatted during OS installation. Contains deleted PDF tax returns, Excel sheets, and ZIP archives.'
  }
];

const INITIAL_RECOVERED_FILES: RecoveredItem[] = [
  {
    id: 'rec_01',
    filename: 'IMG_4291_Wedding_Ceremony.CR3',
    category: 'photo',
    extension: 'CR3',
    sizeBytes: 36840000,
    sizeFormatted: '35.1 MB',
    lbaSector: '0x004A2800',
    integrity: '100% Intact',
    integrityScore: 100,
    originalPath: '/DCIM/100CANON/IMG_4291.CR3',
    cameraModel: 'Canon EOS R6 Mark II',
    exifDate: '2026-08-20 15:42:19',
    resolution: '6000 x 4000 (24.2 MP)',
    hexHeader: '00 00 00 18 66 74 79 70 63 72 78 20 00 00 00 01',
    selected: true
  },
  {
    id: 'rec_02',
    filename: 'IMG_4292_Bride_Groom_Portrait.CR3',
    category: 'photo',
    extension: 'CR3',
    sizeBytes: 38120000,
    sizeFormatted: '36.3 MB',
    lbaSector: '0x004EE200',
    integrity: '100% Intact',
    integrityScore: 100,
    originalPath: '/DCIM/100CANON/IMG_4292.CR3',
    cameraModel: 'Canon EOS R6 Mark II',
    exifDate: '2026-08-20 15:44:02',
    resolution: '6000 x 4000 (24.2 MP)',
    hexHeader: '00 00 00 18 66 74 79 70 63 72 78 20 00 00 00 01',
    selected: true
  },
  {
    id: 'rec_03',
    filename: 'DSC08412_Sunset_Coastline.ARW',
    category: 'photo',
    extension: 'ARW',
    sizeBytes: 44200000,
    sizeFormatted: '42.1 MB',
    lbaSector: '0x00612000',
    integrity: '100% Intact',
    integrityScore: 100,
    originalPath: '/DCIM/100MSDCF/DSC08412.ARW',
    cameraModel: 'Sony A7 IV',
    exifDate: '2026-08-18 19:15:33',
    resolution: '7008 x 4672 (33.0 MP)',
    hexHeader: '49 49 2A 00 08 00 00 00 12 00 00 01 03 00 01 00',
    selected: true
  },
  {
    id: 'rec_04',
    filename: 'DJI_0194_4K60_GoldenHour.MP4',
    category: 'video',
    extension: 'MP4',
    sizeBytes: 1420000000,
    sizeFormatted: '1.32 GB',
    lbaSector: '0x009F8000',
    integrity: '98% High',
    integrityScore: 98,
    originalPath: '/DCIM/100MEDIA/DJI_0194.MP4',
    cameraModel: 'DJI Mavic 3 Pro',
    exifDate: '2026-08-22 18:30:11',
    resolution: '3840 x 2160 (4K D-Log M)',
    duration: '02:45 (150 Mbps)',
    hexHeader: '00 00 00 20 66 74 79 70 69 73 6F 6D 00 00 02 00',
    selected: true
  },
  {
    id: 'rec_05',
    filename: 'GOPR8819_Action_Downhill.MP4',
    category: 'video',
    extension: 'MP4',
    sizeBytes: 890000000,
    sizeFormatted: '848.7 MB',
    lbaSector: '0x011C4000',
    integrity: '100% Intact',
    integrityScore: 100,
    originalPath: '/DCIM/100GOPRO/GOPR8819.MP4',
    cameraModel: 'GoPro HERO 12 Black',
    exifDate: '2026-08-19 14:02:50',
    resolution: '5312 x 2988 (5.3K 60fps)',
    duration: '01:50 (120 Mbps)',
    hexHeader: '00 00 00 18 66 74 79 70 6D 70 34 32 00 00 00 00',
    selected: true
  },
  {
    id: 'rec_06',
    filename: 'Wedding_Vows_Microphone_Feed.WAV',
    category: 'audio',
    extension: 'WAV',
    sizeBytes: 85200000,
    sizeFormatted: '81.2 MB',
    lbaSector: '0x015A0000',
    integrity: '100% Intact',
    integrityScore: 100,
    originalPath: '/RECORD/ZOOM0001.WAV',
    cameraModel: 'Zoom H6 Field Recorder',
    exifDate: '2026-08-20 16:10:00',
    duration: '42:15 (24-bit 96kHz)',
    hexHeader: '52 49 46 46 04 00 00 00 57 41 56 45 66 6D 74 20',
    selected: true
  },
  {
    id: 'rec_07',
    filename: 'Quarterly_Financial_Report_2026.xlsx',
    category: 'document',
    extension: 'XLSX',
    sizeBytes: 4200000,
    sizeFormatted: '4.0 MB',
    lbaSector: '0x019E2000',
    integrity: '100% Intact',
    integrityScore: 100,
    originalPath: '/Work/Finance/Q3_Audit.xlsx',
    hexHeader: '50 4B 03 04 14 00 06 00 08 00 00 00 21 00 5A 7B',
    selected: false
  },
  {
    id: 'rec_08',
    filename: 'Client_Contract_Signed.pdf',
    category: 'document',
    extension: 'PDF',
    sizeBytes: 8900000,
    sizeFormatted: '8.5 MB',
    lbaSector: '0x01C41000',
    integrity: '100% Intact',
    integrityScore: 100,
    originalPath: '/Contracts/Client_Signed.pdf',
    hexHeader: '25 50 44 46 2D 31 2E 37 0A 25 E2 E3 CF D3 0A 35',
    selected: false
  },
  {
    id: 'rec_09',
    filename: 'Lightroom_Catalog_Backup.zip',
    category: 'archive',
    extension: 'ZIP',
    sizeBytes: 340000000,
    sizeFormatted: '324.2 MB',
    lbaSector: '0x02110000',
    integrity: '98% High',
    integrityScore: 98,
    originalPath: '/Backups/Lightroom_2026.zip',
    hexHeader: '50 4B 03 04 14 00 00 00 08 00 00 00 21 00 A1 B2',
    selected: false
  }
];

interface Props {
  addNotification: (notif: { title: string; message: string; type: 'success' | 'error' | 'info' | 'warning'; appId?: string }) => void;
}

export const FlashCardRetrieverView: React.FC<Props> = ({ addNotification }) => {
  // Active Sub-Tool
  const [activeSubTool, setActiveSubTool] = useState<
    'carver' | 'writeblocker' | 'bitlocker' | 'sam_chntpw' | 'memory_triage' | 'video_moov' | 'hardware_stress' | 'forensic_report' | 'sanitizer' | 'uefi_rootkit' | 'timeline' | 'stealth_net' | 'offline_yara' | 'cloud_backup'
  >('carver');

  // Selected Media Device
  const [selectedDevice, setSelectedDevice] = useState<FlashMediaCard>(SAMPLE_FLASH_DEVICES[0]);
  const [customDevicePath, setCustomDevicePath] = useState<string>('');

  // Scan Mode
  const [scanMode, setScanMode] = useState<'quick_fat' | 'deep_carve' | 'damaged_nand'>('deep_carve');
  
  // Signature Filters
  const [signatures, setSignatures] = useState({
    rawPhotos: true,
    jpgPng: true,
    videos: true,
    audio: true,
    documents: true,
    archives: true
  });

  // Safe Hardware Write-Block Protection
  const [writeBlockEnabled, setWriteBlockEnabled] = useState<boolean>(true);
  const [destinationFolder, setDestinationFolder] = useState<string>('/home/user/Recovered_Flash_Media_2026');

  // Scanning State & Telemetry
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [scanProgress, setScanProgress] = useState<number>(0);
  const [currentLba, setCurrentLba] = useState<string>('0x00000000');
  const [scanSpeed, setScanSpeed] = useState<string>('168.4 MB/s');
  const [processedBytes, setProcessedBytes] = useState<string>('0.0 GB');
  const [scanLogs, setScanLogs] = useState<string[]>([]);
  const [flashBlocks, setFlashBlocks] = useState<('idle' | 'scanning' | 'found' | 'bad')[]>(
    Array(64).fill('idle')
  );

  // Recovered Items Table & Viewer
  const [recoveredItems, setRecoveredItems] = useState<RecoveredItem[]>(INITIAL_RECOVERED_FILES);
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<'all' | 'photo' | 'video' | 'audio' | 'document' | 'archive'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activePreviewItem, setActivePreviewItem] = useState<RecoveredItem | null>(INITIAL_RECOVERED_FILES[0]);
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  // Export State
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [exportProgress, setExportProgress] = useState<number>(0);

  // Handle Scan Simulation
  const handleStartScan = () => {
    setIsScanning(true);
    setScanProgress(0);
    setProcessedBytes('0.0 GB');
    setScanLogs([
      `[*] Initializing SecureCurtain Flash & SD Memory Retriever Engine v4.8`,
      `[*] Target Device: ${selectedDevice.name} (${selectedDevice.devicePath})`,
      `[*] Hardware Write-Blocker: ${writeBlockEnabled ? 'ENFORCED (Kernel blockdev --setro)' : 'DISABLED'}`,
      `[*] Recovery Mode: ${scanMode === 'quick_fat' ? 'Fast FAT32/exFAT Directory Parser' : scanMode === 'deep_carve' ? 'Deep PhotoRec / Scalpel NAND Cluster Carver' : 'Damaged Controller Salvage (ddrescue image)'}`,
      `[*] Active File Filters: RAW Photos, 4K MP4/MOV, WAV, Office Documents`
    ]);

    // Reset Flash Block Grid
    const newBlocks: ('idle' | 'scanning' | 'found' | 'bad')[] = Array(64).fill('idle');
    setFlashBlocks(newBlocks);

    const totalSteps = 20;
    let step = 0;

    const interval = setInterval(() => {
      step++;
      const pct = Math.min(100, Math.round((step / totalSteps) * 100));
      setScanProgress(pct);

      // Random Hex LBA
      const lbaHex = '0x' + (step * 0x00180000).toString(16).toUpperCase().padStart(8, '0');
      setCurrentLba(lbaHex);
      setProcessedBytes(((step / totalSteps) * 59.6).toFixed(1) + ' GB');
      setScanSpeed((160 + (Math.sin(step) * 20)).toFixed(1) + ' MB/s');

      // Update Flash Block Visualizer
      setFlashBlocks(prev => {
        const next = [...prev];
        const blockIdx = Math.min(63, Math.floor((step / totalSteps) * 64));
        for (let i = 0; i <= blockIdx; i++) {
          if (i === 12 || i === 24 || i === 38 || i === 52) {
            next[i] = 'found';
          } else if (i === blockIdx) {
            next[i] = 'scanning';
          } else if (next[i] === 'scanning') {
            next[i] = 'idle';
          }
        }
        return next;
      });

      // Periodic Log Messages
      if (step === 3) {
        setScanLogs(prev => [...prev, `[+] Carving Cluster 0x004A2800: Match found -> Canon CR3 RAW Header (IMG_4291.CR3, 35.1MB)`]);
      } else if (step === 7) {
        setScanLogs(prev => [...prev, `[+] Carving Cluster 0x00612000: Match found -> Sony ARW RAW Header (DSC08412.ARW, 42.1MB)`]);
      } else if (step === 12) {
        setScanLogs(prev => [...prev, `[+] Carving Cluster 0x009F8000: Match found -> DJI D-Log 4K Video Stream (DJI_0194.MP4, 1.32GB)`]);
      } else if (step === 16) {
        setScanLogs(prev => [...prev, `[+] Carving Cluster 0x015A0000: Match found -> 24-bit 96kHz PCM Wave Audio (ZOOM0001.WAV, 81.2MB)`]);
      }

      if (step >= totalSteps) {
        clearInterval(interval);
        setIsScanning(false);
        setScanLogs(prev => [
          ...prev,
          `[✓] DEEP SCAN COMPLETED: 100% of NAND flash clusters analyzed.`,
          `[✓] Identified 9 deleted files (1.82 GB recoverable data) with 99.4% average integrity.`
        ]);
        addNotification({
          title: 'SD Card Scan Complete',
          message: `Identified 9 recoverable files (1.82 GB) on ${selectedDevice.devicePath}`,
          type: 'success',
          appId: 'iso-builder'
        });
      }
    }, 350);
  };

  // Toggle Selection
  const toggleSelectAll = (checked: boolean) => {
    setRecoveredItems(prev => prev.map(item => ({ ...item, selected: checked })));
  };

  const toggleSelectItem = (id: string) => {
    setRecoveredItems(prev => prev.map(item => item.id === id ? { ...item, selected: !item.selected } : item));
  };

  // Export Selected Files
  const handleExportFiles = () => {
    const selectedCount = recoveredItems.filter(i => i.selected).length;
    if (selectedCount === 0) {
      addNotification({
        title: 'No Files Selected',
        message: 'Please check at least one recovered file to export.',
        type: 'warning',
        appId: 'iso-builder'
      });
      return;
    }

    setIsExporting(true);
    setExportProgress(0);

    const interval = setInterval(() => {
      setExportProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsExporting(false);
          addNotification({
            title: 'Files Salvaged Successfully!',
            message: `Exported ${selectedCount} recovered files to ${destinationFolder}`,
            type: 'success',
            appId: 'iso-builder'
          });
          return 100;
        }
        return prev + 25;
      });
    }, 300);
  };

  // Filtered Items
  const filteredRecoveredItems = recoveredItems.filter(item => {
    const matchesCategory = selectedCategoryFilter === 'all' || item.category === selectedCategoryFilter;
    const matchesSearch = 
      item.filename.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.extension.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.cameraModel && item.cameraModel.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  const selectedCount = recoveredItems.filter(i => i.selected).length;
  const totalSelectedBytes = recoveredItems
    .filter(i => i.selected)
    .reduce((acc, i) => acc + i.sizeBytes, 0);
  const totalSelectedFormatted = (totalSelectedBytes / (1024 * 1024)).toFixed(1) + ' MB';

  return (
    <div className="space-y-4">
      {/* Header Banner */}
      <div className="bg-[#0c0f18] p-4 rounded-xl border border-[#1b2234] flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-purple-950/80 border border-purple-500/40 text-purple-400 shadow-md shadow-purple-950/50">
            <Camera className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold font-mono text-white">SD & Flash Memory Deep File Retriever</h3>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-950 text-purple-300 border border-purple-500/30">
                FAT32 / exFAT / RAW NAND CARVER & FORENSIC SUITE
              </span>
            </div>
            <p className="text-xs text-[#8fa0b5] mt-0.5">
              Specialized salvager for deleted photos (CR3, ARW, NEF), 4K videos, corrupted MP4/MOV headers, BitLocker SD cards, and encrypted cloud offload.
            </p>
          </div>
        </div>

        {/* Read-Only Safety Pill */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-950/40 border border-emerald-500/40 text-emerald-300 text-xs font-mono">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>Zero-Wear Read-Only Write-Blocker Active</span>
        </div>
      </div>

      {/* Sub-Tools Navigation Bar */}
      <div className="flex items-center gap-2 p-1.5 bg-[#0a0d16] rounded-xl border border-[#1b2234] overflow-x-auto">
        <button
          onClick={() => setActiveSubTool('carver')}
          className={`px-3 py-1.5 rounded-lg text-xs font-mono font-medium flex items-center gap-1.5 transition-all whitespace-nowrap ${
            activeSubTool === 'carver'
              ? 'bg-purple-950/90 text-purple-200 border border-purple-500/60 shadow-md shadow-purple-950/50'
              : 'text-[#8899aa] hover:text-white hover:bg-[#121624]'
          }`}
        >
          <Camera className="w-3.5 h-3.5 text-purple-400" />
          <span>1. Raw Carver</span>
        </button>

        <button
          onClick={() => setActiveSubTool('writeblocker')}
          className={`px-3 py-1.5 rounded-lg text-xs font-mono font-medium flex items-center gap-1.5 transition-all whitespace-nowrap ${
            activeSubTool === 'writeblocker'
              ? 'bg-emerald-950/90 text-emerald-200 border border-emerald-500/60 shadow-md shadow-emerald-950/50'
              : 'text-[#8899aa] hover:text-white hover:bg-[#121624]'
          }`}
        >
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>2. Write-Blocker</span>
        </button>

        <button
          onClick={() => setActiveSubTool('bitlocker')}
          className={`px-3 py-1.5 rounded-lg text-xs font-mono font-medium flex items-center gap-1.5 transition-all whitespace-nowrap ${
            activeSubTool === 'bitlocker'
              ? 'bg-amber-950/90 text-amber-200 border border-amber-500/60 shadow-md shadow-amber-950/50'
              : 'text-[#8899aa] hover:text-white hover:bg-[#121624]'
          }`}
        >
          <Lock className="w-3.5 h-3.5 text-amber-400" />
          <span>3. BitLocker/LUKS</span>
        </button>

        <button
          onClick={() => setActiveSubTool('sam_chntpw')}
          className={`px-3 py-1.5 rounded-lg text-xs font-mono font-medium flex items-center gap-1.5 transition-all whitespace-nowrap ${
            activeSubTool === 'sam_chntpw'
              ? 'bg-indigo-950/90 text-indigo-200 border border-indigo-500/60 shadow-md shadow-indigo-950/50'
              : 'text-[#8899aa] hover:text-white hover:bg-[#121624]'
          }`}
        >
          <Key className="w-3.5 h-3.5 text-indigo-400" />
          <span>4. SAM Password Reset</span>
        </button>

        <button
          onClick={() => setActiveSubTool('memory_triage')}
          className={`px-3 py-1.5 rounded-lg text-xs font-mono font-medium flex items-center gap-1.5 transition-all whitespace-nowrap ${
            activeSubTool === 'memory_triage'
              ? 'bg-fuchsia-950/90 text-fuchsia-200 border border-fuchsia-500/60 shadow-md shadow-fuchsia-950/50'
              : 'text-[#8899aa] hover:text-white hover:bg-[#121624]'
          }`}
        >
          <Zap className="w-3.5 h-3.5 text-fuchsia-400" />
          <span>5. RAM Live Triage</span>
        </button>

        <button
          onClick={() => setActiveSubTool('video_moov')}
          className={`px-3 py-1.5 rounded-lg text-xs font-mono font-medium flex items-center gap-1.5 transition-all whitespace-nowrap ${
            activeSubTool === 'video_moov'
              ? 'bg-pink-950/90 text-pink-200 border border-pink-500/60 shadow-md shadow-pink-950/50'
              : 'text-[#8899aa] hover:text-white hover:bg-[#121624]'
          }`}
        >
          <Film className="w-3.5 h-3.5 text-pink-400" />
          <span>6. Video Hex Healer</span>
        </button>

        <button
          onClick={() => setActiveSubTool('hardware_stress')}
          className={`px-3 py-1.5 rounded-lg text-xs font-mono font-medium flex items-center gap-1.5 transition-all whitespace-nowrap ${
            activeSubTool === 'hardware_stress'
              ? 'bg-orange-950/90 text-orange-200 border border-orange-500/60 shadow-md shadow-orange-950/50'
              : 'text-[#8899aa] hover:text-white hover:bg-[#121624]'
          }`}
        >
          <Sliders className="w-3.5 h-3.5 text-orange-400" />
          <span>7. Hardware Stress (MemTest)</span>
        </button>

        <button
          onClick={() => setActiveSubTool('forensic_report')}
          className={`px-3 py-1.5 rounded-lg text-xs font-mono font-medium flex items-center gap-1.5 transition-all whitespace-nowrap ${
            activeSubTool === 'forensic_report'
              ? 'bg-teal-950/90 text-teal-200 border border-teal-500/60 shadow-md shadow-teal-950/50'
              : 'text-[#8899aa] hover:text-white hover:bg-[#121624]'
          }`}
        >
          <FileText className="w-3.5 h-3.5 text-teal-400" />
          <span>8. Forensic PDF Report</span>
        </button>

        <button
          onClick={() => setActiveSubTool('sanitizer')}
          className={`px-3 py-1.5 rounded-lg text-xs font-mono font-medium flex items-center gap-1.5 transition-all whitespace-nowrap ${
            activeSubTool === 'sanitizer'
              ? 'bg-red-950/90 text-red-200 border border-red-500/60 shadow-md shadow-red-950/50'
              : 'text-[#8899aa] hover:text-white hover:bg-[#121624]'
          }`}
        >
          <Trash2 className="w-3.5 h-3.5 text-red-400" />
          <span>9. NIST Data Wiper</span>
        </button>

        <button
          onClick={() => setActiveSubTool('uefi_rootkit')}
          className={`px-3 py-1.5 rounded-lg text-xs font-mono font-medium flex items-center gap-1.5 transition-all whitespace-nowrap ${
            activeSubTool === 'uefi_rootkit'
              ? 'bg-cyan-950/90 text-cyan-200 border border-cyan-500/60 shadow-md shadow-cyan-950/50'
              : 'text-[#8899aa] hover:text-white hover:bg-[#121624]'
          }`}
        >
          <Cpu className="w-3.5 h-3.5 text-cyan-400" />
          <span>10. UEFI / SPI Scanner</span>
        </button>

        <button
          onClick={() => setActiveSubTool('timeline')}
          className={`px-3 py-1.5 rounded-lg text-xs font-mono font-medium flex items-center gap-1.5 transition-all whitespace-nowrap ${
            activeSubTool === 'timeline'
              ? 'bg-blue-950/90 text-blue-200 border border-blue-500/60 shadow-md shadow-blue-950/50'
              : 'text-[#8899aa] hover:text-white hover:bg-[#121624]'
          }`}
        >
          <Clock className="w-3.5 h-3.5 text-blue-400" />
          <span>11. Super-Timeline</span>
        </button>

        <button
          onClick={() => setActiveSubTool('stealth_net')}
          className={`px-3 py-1.5 rounded-lg text-xs font-mono font-medium flex items-center gap-1.5 transition-all whitespace-nowrap ${
            activeSubTool === 'stealth_net'
              ? 'bg-violet-950/90 text-violet-200 border border-violet-500/60 shadow-md shadow-violet-950/50'
              : 'text-[#8899aa] hover:text-white hover:bg-[#121624]'
          }`}
        >
          <Radio className="w-3.5 h-3.5 text-violet-400" />
          <span>12. Stealth Network TAP</span>
        </button>

        <button
          onClick={() => setActiveSubTool('offline_yara')}
          className={`px-3 py-1.5 rounded-lg text-xs font-mono font-medium flex items-center gap-1.5 transition-all whitespace-nowrap ${
            activeSubTool === 'offline_yara'
              ? 'bg-rose-950/90 text-rose-200 border border-rose-500/60 shadow-md shadow-rose-950/50'
              : 'text-[#8899aa] hover:text-white hover:bg-[#121624]'
          }`}
        >
          <Bug className="w-3.5 h-3.5 text-rose-400" />
          <span>13. Offline YARA / Ransomware</span>
        </button>

        <button
          onClick={() => setActiveSubTool('cloud_backup')}
          className={`px-3 py-1.5 rounded-lg text-xs font-mono font-medium flex items-center gap-1.5 transition-all whitespace-nowrap ${
            activeSubTool === 'cloud_backup'
              ? 'bg-sky-950/90 text-sky-200 border border-sky-500/60 shadow-md shadow-sky-950/50'
              : 'text-[#8899aa] hover:text-white hover:bg-[#121624]'
          }`}
        >
          <CloudUpload className="w-3.5 h-3.5 text-sky-400" />
          <span>14. Cloud Backup (S3)</span>
        </button>
      </div>

      {/* SUB-VIEW: Forensic Write-Blocker */}
      {activeSubTool === 'writeblocker' && (
        <ForensicWriteBlockerView addNotification={addNotification} />
      )}

      {/* SUB-VIEW: BitLocker & LUKS Decryption Assist */}
      {activeSubTool === 'bitlocker' && (
        <BitLockerUnlockerView
          addNotification={addNotification}
          onUnlockedMount={(mountPath) => {
            setCustomDevicePath(mountPath);
            addNotification({
              title: 'Handoff to File Carver Ready',
              message: `Decrypted virtual drive mounted at ${mountPath}. You can switch to Tab 1 to carve!`,
              type: 'info'
            });
          }}
        />
      )}

      {/* SUB-VIEW: Offline Windows SAM & Password Reset */}
      {activeSubTool === 'sam_chntpw' && (
        <WindowsSamChntpwView addNotification={addNotification} />
      )}

      {/* SUB-VIEW: Live Volatile Memory & RAM Triage */}
      {activeSubTool === 'memory_triage' && (
        <VolatileMemoryTriageView addNotification={addNotification} />
      )}

      {/* SUB-VIEW: RAW Video Hex Healer */}
      {activeSubTool === 'video_moov' && (
        <VideoMoovHealerView addNotification={addNotification} />
      )}

      {/* SUB-VIEW: OEM Hardware Stress Diagnostics */}
      {activeSubTool === 'hardware_stress' && (
        <HardwareStressDiagnosticsView addNotification={addNotification} />
      )}

      {/* SUB-VIEW: Forensic Audit Report Generator */}
      {activeSubTool === 'forensic_report' && (
        <ForensicReportGeneratorView addNotification={addNotification} />
      )}

      {/* SUB-VIEW: NIST Certified Data Wiper */}
      {activeSubTool === 'sanitizer' && (
        <DataSanitizerWiperView addNotification={addNotification} />
      )}

      {/* SUB-VIEW: UEFI / SPI Scanner */}
      {activeSubTool === 'uefi_rootkit' && (
        <UefiRootkitScannerView addNotification={addNotification} />
      )}

      {/* SUB-VIEW: Super-Timeline */}
      {activeSubTool === 'timeline' && (
        <ForensicTimelineArtifactsView addNotification={addNotification} />
      )}

      {/* SUB-VIEW: Stealth Network TAP */}
      {activeSubTool === 'stealth_net' && (
        <StealthNetworkTriageView addNotification={addNotification} />
      )}

      {/* SUB-VIEW: Offline YARA / Ransomware */}
      {activeSubTool === 'offline_yara' && (
        <OfflineYaraRansomwareView addNotification={addNotification} />
      )}

      {/* SUB-VIEW: Encrypted Cloud Backup */}
      {activeSubTool === 'cloud_backup' && (
        <CloudBackupUploaderView
          addNotification={addNotification}
          defaultSourceDir={destinationFolder}
        />
      )}

      {/* SUB-VIEW 1: Primary SD & Flash Raw Carver */}
      {activeSubTool === 'carver' && (
        <div className="space-y-4">
          {/* Main Top Grid: Media Selector & Scan Engine Parameters */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Step 1: Select Flash Media Device (Col 5) */}
        <div className="lg:col-span-5 bg-[#0c0f18] p-4 rounded-xl border border-[#1b2234] space-y-3">
          <div className="flex items-center justify-between border-b border-[#1b2234] pb-2">
            <div className="flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-purple-400" />
              <span className="text-xs font-bold font-mono text-white uppercase">1. Select Target Flash Card</span>
            </div>
            <span className="text-[10px] font-mono text-[#778899]">Detected Card Readers</span>
          </div>

          {/* Flash Cards List */}
          <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
            {SAMPLE_FLASH_DEVICES.map(dev => {
              const isSelected = selectedDevice.id === dev.id;
              return (
                <div
                  key={dev.id}
                  onClick={() => setSelectedDevice(dev)}
                  className={`p-2.5 rounded-lg border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-purple-950/40 border-purple-500/80 shadow-sm'
                      : 'bg-[#101422] border-[#1c2438] hover:border-[#2e3b5a]'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold font-mono text-white">{dev.name}</span>
                      </div>
                      <div className="flex items-center gap-2 mt-1 text-[10px] font-mono text-[#8fa0b5]">
                        <span className="text-sky-400 font-bold">{dev.devicePath}</span>
                        <span>•</span>
                        <span>{dev.capacity}</span>
                        <span>•</span>
                        <span className="text-purple-300 font-bold">{dev.fileSystem}</span>
                      </div>
                    </div>

                    <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-[#151c2e] text-emerald-300 border border-emerald-500/20 shrink-0">
                      {dev.busType}
                    </span>
                  </div>
                  <p className="text-[10px] text-[#708098] mt-1.5 line-clamp-1">
                    {dev.description}
                  </p>
                </div>
              );
            })}
          </div>

          {/* Custom Path Input */}
          <div className="pt-2 border-t border-[#161c2c] flex items-center gap-2">
            <span className="text-[11px] font-mono text-[#778899]">Custom / Raw Image:</span>
            <input
              type="text"
              placeholder="/dev/mmcblk0 or /backup/card.raw"
              value={customDevicePath}
              onChange={(e) => setCustomDevicePath(e.target.value)}
              className="flex-1 bg-[#101422] border border-[#1e273e] rounded px-2 py-1 text-xs text-white font-mono placeholder-[#556677] focus:outline-none focus:border-purple-500"
            />
          </div>
        </div>

        {/* Step 2: Configure Recovery Engine (Col 7) */}
        <div className="lg:col-span-7 bg-[#0c0f18] p-4 rounded-xl border border-[#1b2234] space-y-3">
          <div className="flex items-center justify-between border-b border-[#1b2234] pb-2">
            <div className="flex items-center gap-2">
              <Sliders className="w-4 h-4 text-sky-400" />
              <span className="text-xs font-bold font-mono text-white uppercase">2. Carving Engine & Signatures</span>
            </div>
            <span className="text-[10px] font-mono text-emerald-400">PhotoRec + Scalpel Core</span>
          </div>

          {/* Mode Selector */}
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => setScanMode('quick_fat')}
              className={`p-2.5 rounded-lg border text-left transition-all ${
                scanMode === 'quick_fat'
                  ? 'bg-purple-950/60 border-purple-500 text-white shadow-sm'
                  : 'bg-[#101422] border-[#1c2438] text-[#8fa0b5] hover:text-white'
              }`}
            >
              <div className="text-xs font-bold font-mono">1. Fast Undelete</div>
              <div className="text-[10px] text-[#708098] mt-0.5">FAT/exFAT Table parser. Restores filenames.</div>
            </button>

            <button
              onClick={() => setScanMode('deep_carve')}
              className={`p-2.5 rounded-lg border text-left transition-all ${
                scanMode === 'deep_carve'
                  ? 'bg-purple-950/60 border-purple-500 text-white shadow-sm'
                  : 'bg-[#101422] border-[#1c2438] text-[#8fa0b5] hover:text-white'
              }`}
            >
              <div className="text-xs font-bold font-mono">2. Deep Raw Carve</div>
              <div className="text-[10px] text-[#708098] mt-0.5">Scans 100% NAND flash for binary signatures.</div>
            </button>

            <button
              onClick={() => setScanMode('damaged_nand')}
              className={`p-2.5 rounded-lg border text-left transition-all ${
                scanMode === 'damaged_nand'
                  ? 'bg-purple-950/60 border-purple-500 text-white shadow-sm'
                  : 'bg-[#101422] border-[#1c2438] text-[#8fa0b5] hover:text-white'
              }`}
            >
              <div className="text-xs font-bold font-mono">3. Failing Card Salvage</div>
              <div className="text-[10px] text-[#708098] mt-0.5">ddrescue clone first to prevent card death.</div>
            </button>
          </div>

          {/* File Signature Checkboxes */}
          <div className="space-y-1.5 pt-1">
            <span className="text-[10px] font-mono text-[#8fa0b5] uppercase font-bold">Target File Signatures</span>
            <div className="grid grid-cols-3 gap-2">
              <label className="flex items-center gap-2 p-1.5 rounded bg-[#101422] border border-[#1a2133] text-xs font-mono text-white cursor-pointer">
                <input
                  type="checkbox"
                  checked={signatures.rawPhotos}
                  onChange={(e) => setSignatures({ ...signatures, rawPhotos: e.target.checked })}
                  className="rounded border-[#334466] text-purple-600 focus:ring-0"
                />
                <span>RAW (CR3, ARW, NEF)</span>
              </label>

              <label className="flex items-center gap-2 p-1.5 rounded bg-[#101422] border border-[#1a2133] text-xs font-mono text-white cursor-pointer">
                <input
                  type="checkbox"
                  checked={signatures.jpgPng}
                  onChange={(e) => setSignatures({ ...signatures, jpgPng: e.target.checked })}
                  className="rounded border-[#334466] text-purple-600 focus:ring-0"
                />
                <span>Photos (JPG, PNG)</span>
              </label>

              <label className="flex items-center gap-2 p-1.5 rounded bg-[#101422] border border-[#1a2133] text-xs font-mono text-white cursor-pointer">
                <input
                  type="checkbox"
                  checked={signatures.videos}
                  onChange={(e) => setSignatures({ ...signatures, videos: e.target.checked })}
                  className="rounded border-[#334466] text-purple-600 focus:ring-0"
                />
                <span>4K Videos (MP4, MOV)</span>
              </label>

              <label className="flex items-center gap-2 p-1.5 rounded bg-[#101422] border border-[#1a2133] text-xs font-mono text-white cursor-pointer">
                <input
                  type="checkbox"
                  checked={signatures.audio}
                  onChange={(e) => setSignatures({ ...signatures, audio: e.target.checked })}
                  className="rounded border-[#334466] text-purple-600 focus:ring-0"
                />
                <span>Audio (WAV, MP3, FLAC)</span>
              </label>

              <label className="flex items-center gap-2 p-1.5 rounded bg-[#101422] border border-[#1a2133] text-xs font-mono text-white cursor-pointer">
                <input
                  type="checkbox"
                  checked={signatures.documents}
                  onChange={(e) => setSignatures({ ...signatures, documents: e.target.checked })}
                  className="rounded border-[#334466] text-purple-600 focus:ring-0"
                />
                <span>Documents (PDF, DOCX)</span>
              </label>

              <label className="flex items-center gap-2 p-1.5 rounded bg-[#101422] border border-[#1a2133] text-xs font-mono text-white cursor-pointer">
                <input
                  type="checkbox"
                  checked={signatures.archives}
                  onChange={(e) => setSignatures({ ...signatures, archives: e.target.checked })}
                  className="rounded border-[#334466] text-purple-600 focus:ring-0"
                />
                <span>Archives (ZIP, 7Z)</span>
              </label>
            </div>
          </div>

          {/* Action Trigger */}
          <div className="pt-2 border-t border-[#161c2c] flex items-center justify-between">
            <div className="text-[11px] font-mono text-[#8fa0b5]">
              Target: <span className="text-white font-bold">{selectedDevice.devicePath}</span> ({selectedDevice.capacity})
            </div>

            <button
              onClick={handleStartScan}
              disabled={isScanning}
              className="px-5 py-2 rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 disabled:opacity-50 text-white font-mono text-xs font-bold flex items-center gap-2 shadow-lg shadow-purple-600/30 transition-all"
            >
              {isScanning ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Scanning Flash ({scanProgress}%)...</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4" />
                  <span>Start Deep Scan & File Carve</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Interactive Scan Telemetry & Flash Block Map (If scanning or scanned) */}
      <div className="bg-[#0c0f18] p-4 rounded-xl border border-[#1b2234] space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#1b2234] pb-2">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-amber-400" />
            <span className="text-xs font-bold font-mono text-white uppercase">Live NAND Flash Telemetry & Cluster Map</span>
          </div>

          <div className="flex items-center gap-4 text-xs font-mono">
            <div>
              <span className="text-[#778899]">Current LBA: </span>
              <span className="text-sky-300 font-bold">{currentLba}</span>
            </div>
            <div>
              <span className="text-[#778899]">Throughput: </span>
              <span className="text-emerald-300 font-bold">{scanSpeed}</span>
            </div>
            <div>
              <span className="text-[#778899]">Processed: </span>
              <span className="text-purple-300 font-bold">{processedBytes} / {selectedDevice.capacity.split(' ')[0]} GB</span>
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-[#111624] h-2 rounded-full overflow-hidden">
          <div
            className="bg-gradient-to-r from-purple-500 via-indigo-500 to-sky-400 h-full transition-all duration-300 shadow-[0_0_12px_#a855f7]"
            style={{ width: `${scanProgress}%` }}
          />
        </div>

        {/* Real-time 64-Block NAND Flash Map Visualizer */}
        <div className="space-y-1">
          <div className="flex items-center justify-between text-[10px] font-mono text-[#778899]">
            <span>NAND Flash Block Allocation Grid (0x00000000 → Max LBA)</span>
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-[#1e273e]" /> Idle
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-sky-400 animate-pulse" /> Scanning
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-purple-500 shadow-[0_0_8px_#a855f7]" /> File Signature Found
              </span>
            </div>
          </div>

          <div className="grid grid-cols-16 sm:grid-cols-32 gap-1 p-2 rounded-lg bg-[#07090e] border border-[#161c2c]">
            {flashBlocks.map((blk, idx) => (
              <div
                key={idx}
                className={`h-3 rounded-sm transition-all duration-200 ${
                  blk === 'scanning'
                    ? 'bg-sky-400 shadow-[0_0_8px_#38bdf8] scale-110'
                    : blk === 'found'
                    ? 'bg-purple-500 shadow-[0_0_6px_#a855f7]'
                    : blk === 'bad'
                    ? 'bg-rose-500'
                    : 'bg-[#182030]'
                }`}
                title={`Block #${idx} (${(idx * 0.93).toFixed(1)} GB)`}
              />
            ))}
          </div>
        </div>

        {/* Live Terminal Log */}
        <div className="font-mono text-[11px] text-[#8fa0b5] bg-[#05070c] p-2.5 rounded-lg border border-[#141a29] max-h-[90px] overflow-y-auto space-y-0.5">
          {scanLogs.length === 0 ? (
            <div className="text-[#556677] italic">Ready to scan. Click "Start Deep Scan & File Carve" to begin salvaging files.</div>
          ) : (
            scanLogs.map((log, idx) => (
              <div 
                key={idx} 
                className={
                  log.includes('COMPLETED') || log.includes('Identified') 
                    ? 'text-emerald-400 font-bold' 
                    : log.includes('Carving') || log.includes('Match') 
                    ? 'text-purple-300 font-bold' 
                    : 'text-[#cbd5e1]'
                }
              >
                {log}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Recovered Items & Gallery Explorer */}
      <div className="bg-[#0c0f18] p-4 rounded-xl border border-[#1b2234] space-y-4">
        {/* Controls Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#1b2234] pb-3">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => toggleSelectAll(selectedCount !== recoveredItems.length)}
                className="flex items-center gap-1 text-xs font-mono text-purple-400 hover:text-purple-300"
              >
                {selectedCount === recoveredItems.length ? (
                  <CheckSquare className="w-4 h-4 text-purple-400" />
                ) : (
                  <Square className="w-4 h-4 text-[#556677]" />
                )}
                <span>Select All ({recoveredItems.length})</span>
              </button>
            </div>

            <span className="text-[#556677]">|</span>

            {/* Category Filter Pills */}
            <div className="flex items-center gap-1 bg-[#07090e] p-1 rounded-lg border border-[#1a2133]">
              {(['all', 'photo', 'video', 'audio', 'document', 'archive'] as const).map(cat => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategoryFilter(cat)}
                  className={`px-2 py-0.5 rounded text-xs font-mono capitalize transition-all ${
                    selectedCategoryFilter === cat
                      ? 'bg-purple-950 text-purple-200 border border-purple-500/40 font-bold'
                      : 'text-[#708098] hover:text-white'
                  }`}
                >
                  {cat === 'all' ? 'All (9)' : cat}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Search */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-[#556688] absolute left-2.5 top-2" />
              <input
                type="text"
                placeholder="Search file name, camera..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-[#101422] border border-[#1e273e] rounded-lg pl-8 pr-2.5 py-1 text-xs text-white font-mono placeholder-[#556688] focus:outline-none focus:border-purple-500 w-44"
              />
            </div>

            {/* View Mode Toggle */}
            <div className="flex items-center gap-1 bg-[#07090e] p-1 rounded-lg border border-[#1a2133]">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1 rounded ${viewMode === 'grid' ? 'bg-[#1c2438] text-white' : 'text-[#778899]'}`}
                title="Grid View"
              >
                <Grid className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`p-1 rounded ${viewMode === 'table' ? 'bg-[#1c2438] text-white' : 'text-[#778899]'}`}
                title="Table View"
              >
                <List className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Viewport: Recovered Files Grid or Table */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* Main List / Grid (Col 8) */}
          <div className="lg:col-span-8 space-y-2 max-h-[380px] overflow-y-auto pr-1">
            {viewMode === 'grid' ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {filteredRecoveredItems.map(item => {
                  const isSelected = item.selected;
                  const isPreview = activePreviewItem?.id === item.id;
                  return (
                    <div
                      key={item.id}
                      onClick={() => setActivePreviewItem(item)}
                      className={`p-3 rounded-xl border transition-all cursor-pointer relative ${
                        isPreview
                          ? 'bg-purple-950/40 border-purple-500 shadow-md shadow-purple-950/40'
                          : 'bg-[#101422] border-[#1c2438] hover:border-[#2e3b5a]'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleSelectItem(item.id);
                            }}
                            className="text-purple-400 hover:text-purple-300"
                          >
                            {item.selected ? (
                              <CheckSquare className="w-4 h-4 text-purple-400" />
                            ) : (
                              <Square className="w-4 h-4 text-[#556677]" />
                            )}
                          </button>

                          <div className={`p-2 rounded-lg ${
                            item.category === 'photo' 
                              ? 'bg-pink-950/50 text-pink-400 border border-pink-500/30' 
                              : item.category === 'video'
                              ? 'bg-sky-950/50 text-sky-400 border border-sky-500/30'
                              : item.category === 'audio'
                              ? 'bg-amber-950/50 text-amber-400 border border-amber-500/30'
                              : 'bg-emerald-950/50 text-emerald-400 border border-emerald-500/30'
                          }`}>
                            {item.category === 'photo' ? <FileImage className="w-4 h-4" /> :
                             item.category === 'video' ? <FileVideo className="w-4 h-4" /> :
                             item.category === 'audio' ? <FileAudio className="w-4 h-4" /> :
                             item.category === 'document' ? <FileText className="w-4 h-4" /> :
                             <Archive className="w-4 h-4" />}
                          </div>

                          <div>
                            <div className="font-mono text-xs font-bold text-white truncate max-w-[170px]" title={item.filename}>
                              {item.filename}
                            </div>
                            <div className="text-[10px] font-mono text-[#8fa0b5]">
                              {item.sizeFormatted} • <span className="text-purple-300">{item.extension}</span>
                            </div>
                          </div>
                        </div>

                        <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded ${
                          item.integrityScore === 100 
                            ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-500/30' 
                            : 'bg-amber-950/80 text-amber-300 border border-amber-500/30'
                        }`}>
                          {item.integrity}
                        </span>
                      </div>

                      {item.cameraModel && (
                        <div className="mt-2 text-[10px] font-mono text-[#778899] flex items-center justify-between border-t border-[#182030] pt-1.5">
                          <span>{item.cameraModel}</span>
                          <span className="text-[#556677]">{item.resolution || item.duration}</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              /* Detailed Table View */
              <div className="space-y-1">
                {filteredRecoveredItems.map(item => (
                  <div
                    key={item.id}
                    onClick={() => setActivePreviewItem(item)}
                    className={`p-2 rounded-lg border transition-all cursor-pointer flex items-center justify-between text-xs font-mono ${
                      activePreviewItem?.id === item.id
                        ? 'bg-purple-950/40 border-purple-500 text-white'
                        : 'bg-[#101422] border-[#1c2438] text-[#8fa0b5] hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleSelectItem(item.id);
                        }}
                      >
                        {item.selected ? (
                          <CheckSquare className="w-4 h-4 text-purple-400" />
                        ) : (
                          <Square className="w-4 h-4 text-[#556677]" />
                        )}
                      </button>
                      <span className="font-bold text-white truncate max-w-[200px]">{item.filename}</span>
                    </div>

                    <div className="flex items-center gap-4 text-[11px]">
                      <span className="text-[#778899]">{item.sizeFormatted}</span>
                      <span className="text-sky-400">{item.lbaSector}</span>
                      <span className="text-emerald-400">{item.integrity}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {filteredRecoveredItems.length === 0 && (
              <div className="p-8 rounded-xl bg-[#101422] border border-[#1c2438] text-center text-xs font-mono text-[#778899]">
                No recovered files match the selected filter or search query.
              </div>
            )}
          </div>

          {/* Right Column: Selected File Inspector & Hex Preview (Col 4) */}
          <div className="lg:col-span-4 bg-[#101422] p-3.5 rounded-xl border border-[#1c2438] space-y-3">
            <div className="flex items-center justify-between border-b border-[#1c2438] pb-2">
              <div className="flex items-center gap-1.5">
                <Eye className="w-4 h-4 text-purple-400" />
                <span className="text-xs font-bold font-mono text-white">Carved File Inspector</span>
              </div>
              {activePreviewItem && (
                <span className="text-[10px] font-mono text-emerald-400">Validated</span>
              )}
            </div>

            {activePreviewItem ? (
              <div className="space-y-2.5 text-xs font-mono">
                <div>
                  <div className="text-[10px] text-[#778899]">File Name:</div>
                  <div className="text-white font-bold truncate" title={activePreviewItem.filename}>
                    {activePreviewItem.filename}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="p-2 rounded bg-[#0b0e17] border border-[#171d2e]">
                    <div className="text-[10px] text-[#778899]">File Size:</div>
                    <div className="text-white font-bold mt-0.5">{activePreviewItem.sizeFormatted}</div>
                  </div>
                  <div className="p-2 rounded bg-[#0b0e17] border border-[#171d2e]">
                    <div className="text-[10px] text-[#778899]">LBA Sector:</div>
                    <div className="text-sky-300 font-bold mt-0.5">{activePreviewItem.lbaSector}</div>
                  </div>
                </div>

                {activePreviewItem.cameraModel && (
                  <div className="p-2 rounded bg-[#0b0e17] border border-[#171d2e] space-y-1">
                    <div className="text-[10px] text-[#778899]">EXIF Camera Metadata:</div>
                    <div className="text-white font-bold">{activePreviewItem.cameraModel}</div>
                    <div className="text-[10px] text-[#8fa0b5]">{activePreviewItem.resolution || activePreviewItem.duration}</div>
                    {activePreviewItem.exifDate && (
                      <div className="text-[10px] text-[#667788]">Date Taken: {activePreviewItem.exifDate}</div>
                    )}
                  </div>
                )}

                {/* Hex Header Dump */}
                <div className="space-y-1">
                  <div className="text-[10px] text-[#778899]">Binary Magic Signature (Hex):</div>
                  <div className="p-2 rounded bg-[#05070c] border border-[#141a29] font-mono text-[10px] text-purple-300 tracking-wider">
                    {activePreviewItem.hexHeader}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-[#556677] text-xs font-mono py-8 text-center">
                Select a recovered file to inspect metadata.
              </div>
            )}
          </div>
        </div>
      </div>

        {/* Step 3: Safe Export to Hard Drive / Destination */}
        <div className="p-4 rounded-xl bg-gradient-to-r from-purple-950/40 via-indigo-950/30 to-[#0c0f18] border border-purple-500/30 flex flex-wrap items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <FolderDown className="w-4 h-4 text-purple-400" />
              <span className="text-xs font-bold font-mono text-white">
                3. Save Salvaged Files to Safe Destination
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs font-mono text-[#8fa0b5]">
              <span>Destination:</span>
              <input
                type="text"
                value={destinationFolder}
                onChange={(e) => setDestinationFolder(e.target.value)}
                className="bg-[#101422] border border-[#1e273e] rounded px-2 py-0.5 text-xs text-white font-mono focus:outline-none focus:border-purple-500 w-64"
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right text-xs font-mono">
              <div className="text-white font-bold">{selectedCount} files selected</div>
              <div className="text-[#8fa0b5] text-[11px]">Total: {totalSelectedFormatted}</div>
            </div>

            <button
              onClick={handleExportFiles}
              disabled={isExporting || selectedCount === 0}
              className="px-6 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-mono text-xs font-bold flex items-center gap-2 shadow-lg shadow-emerald-600/30 transition-all"
            >
              {isExporting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Extracting Files ({exportProgress}%)...</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  <span>Recover & Export Selected ({selectedCount})</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
      )}
    </div>
  );
};
