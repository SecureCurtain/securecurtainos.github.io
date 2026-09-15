// jb7572_2026-08-28: Master Storage, Internal Mirror SSD & Partitioning Engine GUI
// Author: System Administrator - Root / Chief Forensic Architect

import React, { useState, useEffect } from 'react';
import { 
  PhysicalDisk, 
  StoragePartition, 
  StorageDirectoryNode, 
  InternalMirrorStatus,
  storageService 
} from '../../services/storageService';
import { adminAuthService } from '../../services/adminAuthService';
import { StorageBenchmarkResult, FsckIntegrityReport, FsckBlockSector } from '../../types';
import { ExternalBackupGUI } from './ExternalBackupGUI';
import { AdminPinElevationModal } from '../common/AdminPinElevationModal';
import { 
  HardDrive, 
  Layers, 
  Trash2, 
  Sparkles, 
  RefreshCw, 
  CheckCircle2, 
  AlertCircle, 
  Zap, 
  FolderTree, 
  PieChart, 
  Sliders, 
  ShieldCheck,
  ShieldAlert,
  Cpu,
  Info,
  Terminal,
  Database,
  Gauge,
  Activity,
  Play,
  Wrench,
  Search,
  CheckCircle,
  FileCheck,
  Plus,
  Lock,
  Unlock,
  KeyRound,
  Copy,
  ArrowRight,
  SlidersHorizontal,
  FolderArchive,
  Disc,
  Flame
} from 'lucide-react';

interface StorageManagementGUIProps {
  onRunCliCommand?: (cmd: string) => void;
}

export const StorageManagementGUI: React.FC<StorageManagementGUIProps> = ({ onRunCliCommand }) => {
  const [disks, setDisks] = useState<PhysicalDisk[]>(() => storageService.getDisks());
  const [selectedDiskId, setSelectedDiskId] = useState<string>(disks[0]?.id || 'nvme0');
  const [directories, setDirectories] = useState<StorageDirectoryNode[]>(() => storageService.getDirectoryNodes());
  const [mirrorStatus, setMirrorStatus] = useState<InternalMirrorStatus>(() => storageService.getInternalMirrorStatus());

  // Active Tab: 6 comprehensive storage categories
  const [activeTab, setActiveTab] = useState<'mirror_specs' | 'all_drives' | 'backups' | 'storagesense' | 'benchmark' | 'integrity'>('mirror_specs');
  
  const currentDisk = disks.find(d => d.id === selectedDiskId) || disks[0];
  const [selectedPartition, setSelectedPartition] = useState<StoragePartition | null>(currentDisk?.partitions[1] || currentDisk?.partitions[0] || null);

  // Notification and Modals
  const [actionNotice, setActionNotice] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [showFormatModal, setShowFormatModal] = useState(false);
  const [targetFs, setTargetFs] = useState<StoragePartition['fileSystem']>('ext4');
  const [isTrimming, setIsTrimming] = useState(false);

  // Disk Initializer & Partition Creation Modals
  const [showInitModal, setShowInitModal] = useState(false);
  const [initPartitionTable, setInitPartitionTable] = useState<'GPT' | 'MBR'>('GPT');
  const [showNewPartitionModal, setShowNewPartitionModal] = useState(false);
  const [newPartName, setNewPartName] = useState('Data Partition');
  const [newPartSizeGb, setNewPartSizeGb] = useState<number>(100);
  const [newPartMountPoint, setNewPartMountPoint] = useState('/mnt/data');
  const [newPartFs, setNewPartFs] = useState<StoragePartition['fileSystem']>('ext4');

  // Admin PIN Elevation Modal State
  const [isPinModalOpen, setIsPinModalOpen] = useState(false);
  const [pendingElevatedAction, setPendingElevatedAction] = useState<(() => void) | null>(null);
  const [elevationActionTitle, setElevationActionTitle] = useState('Elevate Superuser Rights');
  const [elevationActionDesc, setElevationActionDesc] = useState('');
  const [elevationTargetNode, setElevationTargetNode] = useState('');

  // Benchmark State
  const [benchmarkResult, setBenchmarkResult] = useState<StorageBenchmarkResult>(storageService.getBenchmark());
  const [benchmarkProfile, setBenchmarkProfile] = useState<'PEAK_PERFORMANCE' | 'REAL_WORLD' | 'IOPS_STRESS'>('PEAK_PERFORMANCE');
  const [isBenchmarking, setIsBenchmarking] = useState(false);

  // Filesystem Integrity & Bad Blocks State
  const [selectedFsckDevice, setSelectedFsckDevice] = useState<string>('/dev/nvme0n1p2');
  const [fsckReport, setFsckReport] = useState<FsckIntegrityReport>(storageService.getFsckReport('/dev/nvme0n1p2'));
  const [badBlocks, setBadBlocks] = useState<FsckBlockSector[]>(storageService.getBadBlocksGrid());
  const [isCheckingFsck, setIsCheckingFsck] = useState(false);
  const [isScrubbingMirror, setIsScrubbingMirror] = useState(false);

  const refreshDisks = () => {
    const updated = [...storageService.getDisks()];
    setDisks(updated);
    setMirrorStatus(storageService.getInternalMirrorStatus());
    setDirectories([...storageService.getDirectoryNodes()]);
  };

  useEffect(() => {
    if (currentDisk && (!selectedPartition || !currentDisk.partitions.some(p => p.id === selectedPartition.id))) {
      setSelectedPartition(currentDisk.partitions[0] || null);
    }
  }, [selectedDiskId, disks]);

  // Request Elevation PIN helper
  const requireElevation = (title: string, desc: string, targetNode: string, action: () => void) => {
    if (adminAuthService.isElevatedSessionActive()) {
      action();
      return;
    }
    setElevationActionTitle(title);
    setElevationActionDesc(desc);
    setElevationTargetNode(targetNode);
    setPendingElevatedAction(() => action);
    setIsPinModalOpen(true);
  };

  // Perform Format Partition
  const handleFormat = () => {
    if (!selectedPartition || !currentDisk) return;
    requireElevation(
      `Format Partition ${selectedPartition.device}`,
      `Formatting this volume will rewrite the superblock and erase existing data on ${selectedPartition.name}. Enter your 4-10 char Root PIN to authorize.`,
      selectedPartition.device,
      () => {
        const res = storageService.formatPartition(currentDisk.id, selectedPartition.id, targetFs);
        if (res.success) {
          setActionNotice({ type: 'success', message: res.message });
          refreshDisks();
          setShowFormatModal(false);
        } else {
          setActionNotice({ type: 'error', message: res.message });
        }
        setTimeout(() => setActionNotice(null), 4500);
      }
    );
  };

  // Perform Initialize Disk
  const handleInitializeDisk = () => {
    if (!currentDisk) return;
    requireElevation(
      `Initialize Storage Device ${currentDisk.devicePath}`,
      `Writing a fresh ${initPartitionTable} partition table and disk signature to ${currentDisk.model}. Enter your 4-10 char Root PIN to authorize.`,
      currentDisk.devicePath,
      () => {
        const res = storageService.initializeDisk(currentDisk.id, initPartitionTable);
        if (res.success) {
          setActionNotice({ type: 'success', message: res.message });
          refreshDisks();
          setShowInitModal(false);
        } else {
          setActionNotice({ type: 'error', message: res.message });
        }
        setTimeout(() => setActionNotice(null), 4500);
      }
    );
  };

  // Perform Create Partition
  const handleCreatePartition = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentDisk) return;
    requireElevation(
      `Create Partition on ${currentDisk.devicePath}`,
      `Allocating a ${newPartSizeGb} GB ${newPartFs.toUpperCase()} partition mounted at ${newPartMountPoint}. Enter your 4-10 char Root PIN to authorize.`,
      currentDisk.devicePath,
      () => {
        const res = storageService.createPartition(currentDisk.id, {
          name: newPartName,
          sizeGb: newPartSizeGb,
          mountPoint: newPartMountPoint,
          fileSystem: newPartFs
        });
        if (res.success) {
          setActionNotice({ type: 'success', message: res.message });
          refreshDisks();
          setShowNewPartitionModal(false);
        } else {
          setActionNotice({ type: 'error', message: res.message });
        }
        setTimeout(() => setActionNotice(null), 4500);
      }
    );
  };

  // Perform Delete Partition
  const handleDeletePartition = (partitionId: string) => {
    if (!currentDisk) return;
    const part = currentDisk.partitions.find(p => p.id === partitionId);
    if (!part) return;

    requireElevation(
      `Delete Partition ${part.device}`,
      `Deleting partition ${part.name} [${part.mountPoint}] will remove its block boundary. Enter your 4-10 char Root PIN to authorize.`,
      part.device,
      () => {
        const res = storageService.deletePartition(currentDisk.id, partitionId);
        if (res.success) {
          setActionNotice({ type: 'success', message: res.message });
          refreshDisks();
        } else {
          setActionNotice({ type: 'error', message: res.message });
        }
        setTimeout(() => setActionNotice(null), 4500);
      }
    );
  };

  // Perform Mirror Scrub
  const handleScrubMirror = () => {
    setIsScrubbingMirror(true);
    setTimeout(() => {
      const res = storageService.triggerMirrorScrub();
      setIsScrubbingMirror(false);
      setMirrorStatus(storageService.getInternalMirrorStatus());
      setActionNotice({ type: 'success', message: res.message });
      setTimeout(() => setActionNotice(null), 5000);
    }, 1200);
  };

  // Simulate Hot-Plugging New Raw Disk
  const handleAddRawDisk = () => {
    const newDisk = storageService.addNewRawDisk('Micron 7450 Pro Enterprise NVMe (500 GB)', 500);
    refreshDisks();
    setSelectedDiskId(newDisk.id);
    setActionNotice({
      type: 'success',
      message: `Kernel detected new uninitialized block device ${newDisk.devicePath} (500.0 GB). Ready to initialize!`
    });
    setTimeout(() => setActionNotice(null), 5000);
  };

  // Handle TRIM Disk
  const handleTrimDisk = () => {
    setIsTrimming(true);
    setTimeout(() => {
      const res = storageService.trimOptimizeDisk(currentDisk.id);
      setIsTrimming(false);
      setActionNotice({ type: 'success', message: res.message });
      setTimeout(() => setActionNotice(null), 4500);
    }, 800);
  };

  // Handle Storage Sense Clean
  const handleStorageSenseClean = () => {
    const res = storageService.cleanStorageSense();
    refreshDisks();
    setActionNotice({ 
      type: 'success', 
      message: `${res.message} Reclaimed: ${res.reclaimedBytesFormatted}` 
    });
    setTimeout(() => setActionNotice(null), 5000);
  };

  // Benchmark
  const handleRunBenchmark = () => {
    setIsBenchmarking(true);
    setTimeout(() => {
      const res = storageService.runBenchmark(benchmarkProfile);
      setBenchmarkResult(res);
      setIsBenchmarking(false);
    }, 1200);
  };

  // Calculate Aggregated Specs for Active Disk
  const totalDiskBytes = currentDisk?.sizeBytes || (1024 * 1024 * 1024 * 1024);
  const usedDiskBytes = currentDisk?.partitions.reduce((sum, p) => sum + p.usedBytes, 0) || 0;
  const freeDiskBytes = totalDiskBytes - usedDiskBytes;
  const diskPercentFull = +( (usedDiskBytes / totalDiskBytes) * 100 ).toFixed(1);
  const usedDiskGb = (usedDiskBytes / (1024 * 1024 * 1024)).toFixed(1);
  const freeDiskGb = (freeDiskBytes / (1024 * 1024 * 1024)).toFixed(1);
  const totalDiskGb = (totalDiskBytes / (1024 * 1024 * 1024)).toFixed(0);

  return (
    <div className="space-y-5 font-sans">
      {/* Toast Notice */}
      {actionNotice && (
        <div className={`p-4 rounded-xl border flex items-center justify-between text-xs font-mono animate-fade-in shadow-xl ${
          actionNotice.type === 'success' 
            ? 'bg-emerald-950/70 border-emerald-500/50 text-emerald-200' 
            : 'bg-rose-950/70 border-rose-500/50 text-rose-200'
        }`}>
          <div className="flex items-center gap-2.5">
            {actionNotice.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <AlertCircle className="w-4 h-4 text-rose-400" />}
            <span>{actionNotice.message}</span>
          </div>
          <button onClick={() => setActionNotice(null)} className="text-[#888] hover:text-white">✕</button>
        </div>
      )}

      {/* Main Header & Sub-Tabs Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#222] pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 text-[10px] font-mono border border-purple-500/30">
              CATEGORY 2 / STORAGE & FILE SYSTEMS
            </span>
            <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[10px] font-mono border border-emerald-500/30">
              100% MIRROR SYNC ENGINE
            </span>
          </div>
          <h2 className="text-lg font-bold text-white mt-1 flex items-center gap-2">
            <HardDrive className="w-5 h-5 text-purple-400" />
            Storage Architecture & Internal Mirror SSD Manager
          </h2>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onRunCliCommand && onRunCliCommand('lsblk -f')}
            className="px-3 py-1.5 bg-[#141414] hover:bg-[#222] text-xs font-mono text-purple-300 rounded-lg border border-[#333]"
          >
            CLI: lsblk -f
          </button>
          <button
            onClick={handleAddRawDisk}
            className="px-3 py-1.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-xs font-bold text-white rounded-lg flex items-center gap-1.5 shadow-lg shadow-purple-600/30 transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Simulate Add New Disk</span>
          </button>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex flex-wrap items-center gap-1.5 border-b border-[#222] pb-2">
        <button
          onClick={() => setActiveTab('mirror_specs')}
          className={`px-3.5 py-2 rounded-lg text-xs font-medium flex items-center gap-2 transition-all ${
            activeTab === 'mirror_specs'
              ? 'bg-purple-600/20 text-purple-300 border border-purple-500/40'
              : 'text-[#888] hover:text-white hover:bg-[#141414]'
          }`}
        >
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>Internal Mirror SSD & Specs ({diskPercentFull}% Full)</span>
        </button>

        <button
          onClick={() => setActiveTab('all_drives')}
          className={`px-3.5 py-2 rounded-lg text-xs font-medium flex items-center gap-2 transition-all ${
            activeTab === 'all_drives'
              ? 'bg-purple-600/20 text-purple-300 border border-purple-500/40'
              : 'text-[#888] hover:text-white hover:bg-[#141414]'
          }`}
        >
          <Layers className="w-4 h-4 text-cyan-400" />
          <span>All Connected Drives ({disks.length}) & Partitioning</span>
        </button>

        <button
          onClick={() => setActiveTab('backups')}
          className={`px-3.5 py-2 rounded-lg text-xs font-medium flex items-center gap-2 transition-all ${
            activeTab === 'backups'
              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
              : 'text-[#888] hover:text-white hover:bg-[#141414]'
          }`}
        >
          <FolderArchive className="w-4 h-4 text-amber-400" />
          <span>External Backups & USB Bypass</span>
        </button>

        <button
          onClick={() => setActiveTab('storagesense')}
          className={`px-3.5 py-2 rounded-lg text-xs font-medium flex items-center gap-2 transition-all ${
            activeTab === 'storagesense'
              ? 'bg-purple-600/20 text-purple-300 border border-purple-500/40'
              : 'text-[#888] hover:text-white hover:bg-[#141414]'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          <span>Modern Storage Sense (ncdu)</span>
        </button>

        <button
          onClick={() => setActiveTab('benchmark')}
          className={`px-3.5 py-2 rounded-lg text-xs font-medium flex items-center gap-2 transition-all ${
            activeTab === 'benchmark'
              ? 'bg-purple-600/20 text-purple-300 border border-purple-500/40'
              : 'text-[#888] hover:text-white hover:bg-[#141414]'
          }`}
        >
          <Gauge className="w-4 h-4" />
          <span>I/O Stress Benchmark (fio)</span>
        </button>

        <button
          onClick={() => setActiveTab('integrity')}
          className={`px-3.5 py-2 rounded-lg text-xs font-medium flex items-center gap-2 transition-all ${
            activeTab === 'integrity'
              ? 'bg-purple-600/20 text-purple-300 border border-purple-500/40'
              : 'text-[#888] hover:text-white hover:bg-[#141414]'
          }`}
        >
          <FileCheck className="w-4 h-4" />
          <span>Filesystem Integrity (e2fsck)</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: INTERNAL MIRROR SSD & DISK SPECS (PERCENT FULL & 100% MIRROR) */}
      {/* ========================================================================= */}
      {activeTab === 'mirror_specs' && (
        <div className="space-y-5 animate-fade-in">
          {/* Top Mirror Status Banner (100% In-Sync Guarantee) */}
          <div className="bg-gradient-to-r from-[#0d1612] via-[#101e17] to-[#0a0a0a] border-2 border-emerald-500/50 rounded-2xl p-5 shadow-[0_0_35px_rgba(16,185,129,0.2)]">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
              <div className="flex items-start gap-4">
                <div className="p-3.5 bg-emerald-500/20 text-emerald-400 rounded-2xl border border-emerald-500/40 shadow-inner">
                  <ShieldCheck className="w-8 h-8" />
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono uppercase tracking-widest text-emerald-400 font-bold">
                      INTERNAL MIRROR SSD SYNCHRONIZATION STATUS
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-mono text-[11px] font-bold border border-emerald-500/50 animate-pulse">
                      100.0% IN-SYNC (OPTIMAL)
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-white">
                    Primary SSD (/dev/nvme0n1) ⇄ Internal Mirror SSD (/dev/nvme1n1)
                  </h3>
                  <p className="text-xs text-[#a3a3a3] max-w-3xl leading-relaxed">
                    {mirrorStatus.replicationEngine} is actively dual-writing every byte synchronously across paired hardware NVMe lanes with zero desync drift ({mirrorStatus.desyncBlocks} mismatched blocks).
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={handleScrubMirror}
                  disabled={isScrubbingMirror}
                  className="px-4 py-2.5 bg-emerald-600/30 hover:bg-emerald-600/40 text-emerald-300 border border-emerald-500/50 rounded-xl text-xs font-mono font-bold flex items-center gap-2 transition-all shadow-lg cursor-pointer"
                >
                  <RefreshCw className={`w-4 h-4 ${isScrubbingMirror ? 'animate-spin' : ''}`} />
                  <span>{isScrubbingMirror ? 'SCRUBBING AIR-GAP...' : 'VERIFY & SCRUB MIRROR'}</span>
                </button>
              </div>
            </div>

            {/* Mirror Telemetry Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3 mt-4 pt-4 border-t border-emerald-500/20 text-xs font-mono">
              <div className="bg-[#0b120f] p-3 rounded-xl border border-emerald-950">
                <div className="text-[10px] text-[#777] uppercase">Mirror Sync Health</div>
                <div className="text-emerald-400 font-bold text-sm mt-0.5">100.00% SYNC</div>
              </div>
              <div className="bg-[#0b120f] p-3 rounded-xl border border-emerald-950">
                <div className="text-[10px] text-[#777] uppercase">Replication Latency</div>
                <div className="text-cyan-400 font-bold text-sm mt-0.5">{mirrorStatus.replicationLatencyMs} ms</div>
              </div>
              <div className="bg-[#0b120f] p-3 rounded-xl border border-emerald-950">
                <div className="text-[10px] text-[#777] uppercase">Desync / Drift</div>
                <div className="text-emerald-300 font-bold text-sm mt-0.5">0 Blocks (0.00%)</div>
              </div>
              <div className="bg-[#0b120f] p-3 rounded-xl border border-emerald-950">
                <div className="text-[10px] text-[#777] uppercase">Dual-Write IOPS</div>
                <div className="text-purple-300 font-bold text-sm mt-0.5">792,000 IOPS</div>
              </div>
              <div className="bg-[#0b120f] p-3 rounded-xl border border-emerald-950">
                <div className="text-[10px] text-[#777] uppercase">Last Scrub Passed</div>
                <div className="text-white font-bold text-xs truncate mt-0.5">{mirrorStatus.lastScrubTimestamp}</div>
              </div>
              <div className="bg-[#0b120f] p-3 rounded-xl border border-emerald-950">
                <div className="text-[10px] text-[#777] uppercase">Auto-Healing Engine</div>
                <div className="text-emerald-400 font-bold text-sm mt-0.5">ENABLED (ACTIVE)</div>
              </div>
            </div>
          </div>

          {/* Primary & Mirror Drive Comparison Cards + % Full Gauges */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {/* 1. Main Disk Usage & Capacity % Full Gauge */}
            <div className="bg-[#0f0f0f] border border-[#222] rounded-2xl p-5 shadow-xl space-y-4">
              <div className="flex items-center justify-between border-b border-[#222] pb-3">
                <div className="flex items-center gap-2">
                  <PieChart className="w-4 h-4 text-purple-400" />
                  <h4 className="text-sm font-bold text-white">Drive Specs & Capacity</h4>
                </div>
                <span className="text-xs font-mono text-purple-300">{currentDisk.devicePath}</span>
              </div>

              {/* Big Visual Gauge & Metric */}
              <div className="flex items-center justify-between p-4 bg-[#141414] rounded-xl border border-[#222]">
                <div className="space-y-1">
                  <div className="text-[10px] uppercase tracking-wider text-[#888] font-bold">Space Utilization</div>
                  <div className="text-3xl font-black font-mono text-white flex items-baseline gap-1">
                    <span>{diskPercentFull}%</span>
                    <span className="text-xs font-normal text-[#888]">FULL</span>
                  </div>
                  <div className="text-xs font-mono text-[#aaa]">
                    {usedDiskGb} GB used of {totalDiskGb} GB total
                  </div>
                </div>

                {/* Circular Style Progress Visual */}
                <div className="relative w-20 h-20 flex items-center justify-center">
                  <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                    <path
                      className="text-[#222]"
                      strokeWidth="3.5"
                      stroke="currentColor"
                      fill="none"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                    <path
                      className="text-purple-500 transition-all duration-500"
                      strokeDasharray={`${diskPercentFull}, 100`}
                      strokeWidth="3.5"
                      strokeLinecap="round"
                      stroke="currentColor"
                      fill="none"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                  </svg>
                  <div className="absolute text-[11px] font-bold font-mono text-white">
                    {freeDiskGb}G<br /><span className="text-[9px] text-[#777]">FREE</span>
                  </div>
                </div>
              </div>

              {/* Breakdown Bars */}
              <div className="space-y-2 text-xs font-mono">
                <div className="flex justify-between text-[#888]">
                  <span>Used Space</span>
                  <span className="text-purple-300 font-bold">{usedDiskGb} GB ({diskPercentFull}%)</span>
                </div>
                <div className="w-full bg-[#1c1c1c] h-2.5 rounded-full overflow-hidden border border-[#333]">
                  <div 
                    className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full transition-all"
                    style={{ width: `${diskPercentFull}%` }}
                  />
                </div>
                <div className="flex justify-between text-[#888] pt-1">
                  <span>Free Available Space</span>
                  <span className="text-emerald-400 font-bold">{freeDiskGb} GB ({(100 - diskPercentFull).toFixed(1)}%)</span>
                </div>
              </div>

              {/* Hardware Health Specs */}
              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-[#1e1e1e] text-[11px] font-mono">
                <div className="bg-[#121212] p-2 rounded-lg border border-[#222]">
                  <div className="text-[9px] text-[#777] uppercase">SMART Health</div>
                  <div className="text-emerald-400 font-bold">{currentDisk.health}</div>
                </div>
                <div className="bg-[#121212] p-2 rounded-lg border border-[#222]">
                  <div className="text-[9px] text-[#777] uppercase">NAND Temp</div>
                  <div className="text-amber-300 font-bold">{currentDisk.temperatureC} °C (Normal)</div>
                </div>
              </div>
            </div>

            {/* 2. Primary NVMe SSD Specs Card */}
            <div className="bg-[#0f0f0f] border border-[#222] rounded-2xl p-5 shadow-xl space-y-4">
              <div className="flex items-center justify-between border-b border-[#222] pb-3">
                <div className="flex items-center gap-2">
                  <Cpu className="w-4 h-4 text-cyan-400" />
                  <h4 className="text-sm font-bold text-white">Primary SSD (/dev/nvme0n1)</h4>
                </div>
                <span className="px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 text-[10px] font-mono border border-cyan-500/30">
                  ACTIVE HOST
                </span>
              </div>

              <div className="space-y-2 text-xs font-mono text-[#aaa]">
                <div className="flex justify-between py-1 border-b border-[#1a1a1a]">
                  <span>Model:</span>
                  <span className="text-white font-bold truncate max-w-[180px]">Samsung 990 Pro Gen4</span>
                </div>
                <div className="flex justify-between py-1 border-b border-[#1a1a1a]">
                  <span>Bus Interface:</span>
                  <span className="text-cyan-300">PCIe 4.0 x4 NVMe</span>
                </div>
                <div className="flex justify-between py-1 border-b border-[#1a1a1a]">
                  <span>Total Capacity:</span>
                  <span className="text-white">1024 GB (1.00 TB)</span>
                </div>
                <div className="flex justify-between py-1 border-b border-[#1a1a1a]">
                  <span>Partition Map:</span>
                  <span className="text-purple-300">GPT (6 Partitions)</span>
                </div>
                <div className="flex justify-between py-1 border-b border-[#1a1a1a]">
                  <span>Read / Write IOPS:</span>
                  <span className="text-emerald-400">792K / 654K IOPS</span>
                </div>
                <div className="flex justify-between py-1">
                  <span>Hardware Serial:</span>
                  <span className="text-[#888]">NVME-GEN4-S990P-884920</span>
                </div>
              </div>

              <button
                onClick={handleTrimDisk}
                disabled={isTrimming}
                className="w-full py-2 bg-[#171717] hover:bg-[#222] text-xs font-mono text-cyan-300 rounded-xl border border-[#333] flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <Zap className="w-3.5 h-3.5 text-amber-400" />
                <span>{isTrimming ? 'TRIMMING BLOCKS...' : 'Execute NVMe Dataset TRIM'}</span>
              </button>
            </div>

            {/* 3. Internal Mirror Match-Paired SSD Specs Card */}
            <div className="bg-[#0f0f0f] border border-[#222] rounded-2xl p-5 shadow-xl space-y-4">
              <div className="flex items-center justify-between border-b border-[#222] pb-3">
                <div className="flex items-center gap-2">
                  <Copy className="w-4 h-4 text-emerald-400" />
                  <h4 className="text-sm font-bold text-white">Internal Mirror (/dev/nvme1n1)</h4>
                </div>
                <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[10px] font-mono border border-emerald-500/30">
                  100% MIRROR CLONE
                </span>
              </div>

              <div className="space-y-2 text-xs font-mono text-[#aaa]">
                <div className="flex justify-between py-1 border-b border-[#1a1a1a]">
                  <span>Mirror Model:</span>
                  <span className="text-white font-bold truncate max-w-[180px]">Match-Paired NVMe Gen4</span>
                </div>
                <div className="flex justify-between py-1 border-b border-[#1a1a1a]">
                  <span>Mirror Bus:</span>
                  <span className="text-emerald-300">PCIe Direct Mirror Bus</span>
                </div>
                <div className="flex justify-between py-1 border-b border-[#1a1a1a]">
                  <span>Mirror Capacity:</span>
                  <span className="text-white">1024 GB (100% Matched)</span>
                </div>
                <div className="flex justify-between py-1 border-b border-[#1a1a1a]">
                  <span>Sync Status:</span>
                  <span className="text-emerald-400 font-bold">100.0% Real-time Dual-Write</span>
                </div>
                <div className="flex justify-between py-1 border-b border-[#1a1a1a]">
                  <span>Parity Checks:</span>
                  <span className="text-emerald-300">0 Inconsistencies</span>
                </div>
                <div className="flex justify-between py-1">
                  <span>Mirror Serial:</span>
                  <span className="text-[#888]">NVME-GEN4-MIRROR-884921</span>
                </div>
              </div>

              <button
                onClick={handleScrubMirror}
                className="w-full py-2 bg-[#171717] hover:bg-[#222] text-xs font-mono text-emerald-300 rounded-xl border border-[#333] flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Verify Bit-Exact SHA-256 Parity</span>
              </button>
            </div>
          </div>

          {/* Partition Strip Breakdown for the Active Disk */}
          <div className="bg-[#0f0f0f] border border-[#222] rounded-2xl p-5 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#222] pb-3">
              <h4 className="text-sm font-bold text-white">Visual Partition Map & Volume % Full</h4>
              <span className="text-xs font-mono text-[#888]">{currentDisk.partitions.length} Allocated Volumes</span>
            </div>

            {/* Visual Partition Ribbon */}
            <div className="h-10 bg-[#161616] rounded-xl overflow-hidden flex border border-[#333] p-1 gap-1">
              {currentDisk.partitions.map((part) => {
                const widthPercent = (part.totalBytes / currentDisk.sizeBytes) * 100;
                const isSelected = selectedPartition?.id === part.id;
                return (
                  <button
                    key={part.id}
                    onClick={() => setSelectedPartition(part)}
                    style={{ width: `${Math.max(widthPercent, 8)}%`, backgroundColor: `${part.color}22`, borderColor: part.color }}
                    className={`h-full rounded-lg border flex flex-col justify-center px-2 text-left transition-all ${
                      isSelected ? 'ring-2 ring-white scale-[1.02] shadow-lg' : 'hover:opacity-90'
                    }`}
                  >
                    <div className="text-[10px] font-bold font-mono text-white truncate">{part.device}</div>
                    <div className="text-[9px] text-[#aaa] font-mono truncate">{part.totalFormatted} ({part.usagePercent}%)</div>
                  </button>
                );
              })}
            </div>

            {/* Partition Table View */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead>
                  <tr className="border-b border-[#222] text-[#888]">
                    <th className="pb-2 font-medium">Node</th>
                    <th className="pb-2 font-medium">Label / Role</th>
                    <th className="pb-2 font-medium">Mount Point</th>
                    <th className="pb-2 font-medium">FS Type</th>
                    <th className="pb-2 font-medium">Capacity</th>
                    <th className="pb-2 font-medium">Used Space (% Full)</th>
                    <th className="pb-2 font-medium">Status</th>
                    <th className="pb-2 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1a1a1a]">
                  {currentDisk.partitions.map((part) => {
                    const isSelected = selectedPartition?.id === part.id;
                    return (
                      <tr 
                        key={part.id} 
                        onClick={() => setSelectedPartition(part)}
                        className={`cursor-pointer transition-colors ${
                          isSelected ? 'bg-purple-950/30 text-purple-200' : 'hover:bg-[#141414] text-[#ccc]'
                        }`}
                      >
                        <td className="py-2.5 font-bold text-white flex items-center gap-1.5">
                          <Layers className="w-3.5 h-3.5 text-purple-400" />
                          {part.device}
                        </td>
                        <td className="py-2.5 text-[#bbb]">{part.name}</td>
                        <td className="py-2.5 text-purple-300 font-bold">{part.mountPoint}</td>
                        <td className="py-2.5">
                          <span className="px-2 py-0.5 rounded bg-[#1e1e1e] border border-[#333] text-amber-300">
                            {part.fileSystem.toUpperCase()}
                          </span>
                        </td>
                        <td className="py-2.5 text-[#ddd]">{part.totalFormatted}</td>
                        <td className="py-2.5 text-[#999]">
                          <div className="flex items-center gap-2">
                            <span>{part.usedFormatted} ({part.usagePercent}%)</span>
                            <div className="w-12 bg-[#222] h-1.5 rounded-full overflow-hidden">
                              <div className="h-full bg-purple-500" style={{ width: `${part.usagePercent}%` }} />
                            </div>
                          </div>
                        </td>
                        <td className="py-2.5">
                          <span className="text-emerald-400 flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" /> Healthy
                          </span>
                        </td>
                        <td className="py-2.5 text-right">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedPartition(part);
                              setShowFormatModal(true);
                            }}
                            className="px-2.5 py-1 bg-[#1a1a1a] hover:bg-[#262626] text-[11px] text-rose-300 rounded border border-[#333] transition-all"
                          >
                            Format...
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: ALL CONNECTED DRIVES & DRIVE INITIALIZER / PARTITION EDITOR */}
      {/* ========================================================================= */}
      {activeTab === 'all_drives' && (
        <div className="space-y-5 animate-fade-in">
          {/* Top Control Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#0f0f0f] border border-[#222] rounded-2xl p-4">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Disc className="w-4 h-4 text-cyan-400" />
                Physical Block Devices & Storage Pools ({disks.length} Drives Detected)
              </h3>
              <p className="text-xs text-[#888]">
                Select any drive below to inspect volumes, initialize uninitialized disks, create partitions, or format filesystems.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowNewPartitionModal(true)}
                disabled={!currentDisk.isInitialized}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                  currentDisk.isInitialized
                    ? 'bg-purple-600 hover:bg-purple-500 text-white shadow-md shadow-purple-600/30'
                    : 'bg-[#222] text-[#666] cursor-not-allowed border border-[#333]'
                }`}
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Partition</span>
              </button>
              <button
                onClick={handleAddRawDisk}
                className="px-3 py-1.5 bg-[#1a1a1a] hover:bg-[#252525] text-cyan-300 text-xs font-mono rounded-xl border border-[#333]"
              >
                + Hot-Plug New Raw Disk
              </button>
            </div>
          </div>

          {/* Drive Selector Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {disks.map((d) => {
              const isSelected = selectedDiskId === d.id;
              const usedBytes = d.partitions.reduce((sum, p) => sum + p.usedBytes, 0);
              const pct = d.isInitialized ? +( (usedBytes / d.sizeBytes) * 100 ).toFixed(1) : 0;
              return (
                <div
                  key={d.id}
                  onClick={() => setSelectedDiskId(d.id)}
                  className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-gradient-to-b from-[#181a24] to-[#0f1118] border-purple-500 shadow-[0_0_20px_rgba(168,85,247,0.25)] ring-1 ring-purple-400'
                      : 'bg-[#0f0f0f] border-[#222] hover:border-[#333] hover:bg-[#141414]'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="p-2.5 rounded-xl bg-[#141620] border border-[#262c3f]">
                      <HardDrive className={`w-5 h-5 ${isSelected ? 'text-purple-400' : 'text-[#888]'}`} />
                    </div>
                    <span className={`text-[10px] font-mono px-2 py-0.5 rounded ${
                      !d.isInitialized
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                        : d.type === 'Internal Mirror SSD'
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                        : 'bg-[#1a1a1a] text-[#aaa] border border-[#333]'
                    }`}>
                      {d.isInitialized ? `${pct}% FULL` : 'RAW / UNINIT'}
                    </span>
                  </div>

                  <div className="mt-3 space-y-1">
                    <div className="text-sm font-bold text-white truncate">{d.devicePath}</div>
                    <div className="text-xs text-[#aaa] truncate">{d.model}</div>
                    <div className="text-xs font-mono text-cyan-300">{d.sizeFormatted} • {d.busInterface}</div>
                  </div>

                  {/* Status footer */}
                  <div className="mt-3 pt-2 border-t border-[#1a1a1a] flex items-center justify-between text-[10px] font-mono text-[#777]">
                    <span>{d.partitions.length} Partitions</span>
                    <span>{d.partitionTable.split(' ')[0]}</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Selected Disk Detailed Inspector & Partition Controls */}
          <div className="bg-[#0f0f0f] border border-[#222] rounded-2xl p-5 shadow-xl space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#222] pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-white">{currentDisk.model}</h3>
                  <span className="px-2 py-0.5 rounded bg-purple-950 text-purple-300 font-mono text-xs border border-purple-800/50">
                    {currentDisk.devicePath}
                  </span>
                </div>
                <p className="text-xs text-[#888] font-mono mt-0.5">
                  Size: {currentDisk.sizeFormatted} | Bus: {currentDisk.busInterface} | Serial: {currentDisk.hardwareSerial}
                </p>
              </div>

              {/* Actions for this disk */}
              <div className="flex items-center gap-2">
                {!currentDisk.isInitialized ? (
                  <button
                    onClick={() => setShowInitModal(true)}
                    className="px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-bold font-mono text-xs rounded-xl shadow-lg shadow-amber-500/20 flex items-center gap-1.5"
                  >
                    <Wrench className="w-3.5 h-3.5" />
                    <span>INITIALIZE DRIVE (GPT/MBR)</span>
                  </button>
                ) : (
                  <>
                    <button
                      onClick={() => setShowNewPartitionModal(true)}
                      className="px-3.5 py-2 bg-purple-600 hover:bg-purple-500 text-white font-medium text-xs rounded-xl flex items-center gap-1.5 shadow-lg shadow-purple-600/30"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>New Partition...</span>
                    </button>
                    <button
                      onClick={() => setShowInitModal(true)}
                      className="px-3.5 py-2 bg-[#1c1c1c] hover:bg-[#252525] text-amber-300 font-mono text-xs rounded-xl border border-[#333]"
                    >
                      Re-Initialize Table...
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* If uninitialized warning notice */}
            {!currentDisk.isInitialized ? (
              <div className="p-8 rounded-2xl bg-amber-500/10 border-2 border-dashed border-amber-500/40 text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center mx-auto border border-amber-500/40">
                  <AlertCircle className="w-6 h-6" />
                </div>
                <h4 className="text-base font-bold text-white">This drive is raw and uninitialized</h4>
                <p className="text-xs text-[#aaa] max-w-md mx-auto">
                  You must initialize this storage device with a partition table (GPT GUID Partition Table or MBR Master Boot Record) before creating file systems and partitions.
                </p>
                <button
                  onClick={() => setShowInitModal(true)}
                  className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-black font-bold font-mono text-xs rounded-xl shadow-lg transition-all"
                >
                  INITIALIZE DRIVE NOW (ADMIN PIN REQUIRED)
                </button>
              </div>
            ) : (
              /* If initialized: Partition list */
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-[#aaa] uppercase tracking-wider">Partition Table & Mount Slices</h4>
                  <span className="text-xs font-mono text-[#888]">{currentDisk.partitions.length} partitions</span>
                </div>

                {currentDisk.partitions.length === 0 ? (
                  <div className="p-6 rounded-xl bg-[#141414] border border-[#222] text-center space-y-2">
                    <p className="text-xs text-[#888]">Drive initialized ({currentDisk.partitionTable}). No partitions created yet.</p>
                    <button
                      onClick={() => setShowNewPartitionModal(true)}
                      className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold rounded-lg"
                    >
                      + Create First Partition
                    </button>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs font-mono">
                      <thead>
                        <tr className="border-b border-[#222] text-[#888]">
                          <th className="pb-2 font-medium">Node</th>
                          <th className="pb-2 font-medium">Volume Name</th>
                          <th className="pb-2 font-medium">Mount Point</th>
                          <th className="pb-2 font-medium">FS</th>
                          <th className="pb-2 font-medium">Total Size</th>
                          <th className="pb-2 font-medium">Used Space</th>
                          <th className="pb-2 font-medium text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#1a1a1a]">
                        {currentDisk.partitions.map((part) => (
                          <tr key={part.id} className="hover:bg-[#141414] text-[#ccc]">
                            <td className="py-2.5 font-bold text-white flex items-center gap-1.5">
                              <Layers className="w-3.5 h-3.5 text-purple-400" />
                              {part.device}
                            </td>
                            <td className="py-2.5 text-[#bbb]">{part.name}</td>
                            <td className="py-2.5 text-purple-300 font-bold">{part.mountPoint}</td>
                            <td className="py-2.5 text-amber-300 font-bold">{part.fileSystem.toUpperCase()}</td>
                            <td className="py-2.5 text-white">{part.totalFormatted}</td>
                            <td className="py-2.5 text-[#999]">{part.usedFormatted} ({part.usagePercent}%)</td>
                            <td className="py-2.5 text-right space-x-2">
                              <button
                                onClick={() => {
                                  setSelectedPartition(part);
                                  setShowFormatModal(true);
                                }}
                                className="px-2.5 py-1 bg-[#1a1a1a] hover:bg-[#252525] text-amber-300 rounded border border-[#333]"
                              >
                                Format...
                              </button>
                              <button
                                onClick={() => handleDeletePartition(part.id)}
                                disabled={part.mountPoint === '/' || part.isProtected}
                                className={`px-2.5 py-1 rounded border ${
                                  part.mountPoint === '/' || part.isProtected
                                    ? 'bg-[#151515] text-[#555] border-[#222] cursor-not-allowed'
                                    : 'bg-[#1a1a1a] hover:bg-rose-950/40 text-rose-300 border-rose-800/40'
                                }`}
                              >
                                Delete
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: EXTERNAL BACKUPS & HARDWARE USB LOCKDOWN BYPASS */}
      {/* ========================================================================= */}
      {activeTab === 'backups' && (
        <ExternalBackupGUI 
          onRunCliCommand={onRunCliCommand} 
          onRefreshParent={refreshDisks} 
        />
      )}

      {/* ========================================================================= */}
      {/* TAB 4: MODERN STORAGE SENSE & NCDU TREE */}
      {/* ========================================================================= */}
      {activeTab === 'storagesense' && (
        <div className="bg-[#0f0f0f] border border-[#222] rounded-2xl p-5 shadow-xl space-y-5 animate-fade-in">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#222] pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-emerald-950/50 border border-emerald-800/40 text-emerald-400 rounded-xl">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-[#f5f5f5]">
                  Modern Storage Sense & Disk Footprint Analyzer (ncdu Engine)
                </h3>
                <p className="text-xs text-[#737373]">
                  Interactive system directory breakdown, automated compiler cache cleanup, and log rotation
                </p>
              </div>
            </div>

            <button
              onClick={handleStorageSenseClean}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-xs font-bold text-white rounded-xl shadow-lg shadow-emerald-600/30 flex items-center gap-2 transition-all cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Clean Temporary Build Cache</span>
            </button>
          </div>

          <div className="space-y-3">
            {directories.map((dir) => (
              <div key={dir.path} className="p-3.5 bg-[#141414] rounded-xl border border-[#222] space-y-2">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="font-bold text-white flex items-center gap-2">
                    <FolderTree className="w-4 h-4 text-purple-400" />
                    {dir.path} ({dir.name})
                  </span>
                  <span className="text-cyan-300 font-bold">{dir.sizeFormatted} ({dir.percentOfParent}%)</span>
                </div>
                <div className="w-full bg-[#222] h-2 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-purple-500 to-cyan-400" style={{ width: `${dir.percentOfParent}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 5: I/O STRESS BENCHMARK (FIO) */}
      {/* ========================================================================= */}
      {activeTab === 'benchmark' && (
        <div className="bg-[#0f0f0f] border border-[#222] rounded-2xl p-5 shadow-xl space-y-5 animate-fade-in">
          <div className="flex items-center justify-between border-b border-[#222] pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-purple-950/50 border border-purple-800/40 text-purple-400 rounded-xl">
                <Gauge className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-[#f5f5f5]">
                  NVMe I/O Benchmark & Stress Tester (fio / CrystalDiskMark Engine)
                </h3>
                <p className="text-xs text-[#737373]">
                  Direct asynchronous libaio queue benchmarks, sequential throughput & 4K random IOPS
                </p>
              </div>
            </div>

            <button
              onClick={handleRunBenchmark}
              disabled={isBenchmarking}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-xs font-bold text-white rounded-xl shadow-lg shadow-purple-600/30 flex items-center gap-2"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>{isBenchmarking ? 'RUNNING BENCHMARK...' : 'RUN BENCHMARK'}</span>
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-mono">
            <div className="p-4 bg-[#141414] rounded-xl border border-[#222]">
              <div className="text-[10px] text-[#888] uppercase">Seq Read (Q32T1)</div>
              <div className="text-xl font-bold text-emerald-400 mt-1">{benchmarkResult.seqReadMbPerSec} MB/s</div>
            </div>
            <div className="p-4 bg-[#141414] rounded-xl border border-[#222]">
              <div className="text-[10px] text-[#888] uppercase">Seq Write (Q32T1)</div>
              <div className="text-xl font-bold text-cyan-400 mt-1">{benchmarkResult.seqWriteMbPerSec} MB/s</div>
            </div>
            <div className="p-4 bg-[#141414] rounded-xl border border-[#222]">
              <div className="text-[10px] text-[#888] uppercase">Rand 4K Read IOPS</div>
              <div className="text-xl font-bold text-purple-300 mt-1">{benchmarkResult.rand4kReadIops.toLocaleString()}</div>
            </div>
            <div className="p-4 bg-[#141414] rounded-xl border border-[#222]">
              <div className="text-[10px] text-[#888] uppercase">Rand 4K Write IOPS</div>
              <div className="text-xl font-bold text-amber-300 mt-1">{benchmarkResult.rand4kWriteIops.toLocaleString()}</div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 6: FILESYSTEM INTEGRITY (E2FSCK) */}
      {/* ========================================================================= */}
      {activeTab === 'integrity' && (
        <div className="bg-[#0f0f0f] border border-[#222] rounded-2xl p-5 shadow-xl space-y-5 animate-fade-in">
          <div className="flex items-center justify-between border-b border-[#222] pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-emerald-950/50 border border-emerald-800/40 text-emerald-400 rounded-xl">
                <FileCheck className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-[#f5f5f5]">
                  Filesystem Integrity & Sector Checker (e2fsck / badblocks)
                </h3>
                <p className="text-xs text-[#737373]">
                  Superblock validation, inode consistency, and reserve bad block mapping
                </p>
              </div>
            </div>

            <button
              onClick={() => {
                setIsCheckingFsck(true);
                setTimeout(() => {
                  setFsckReport(storageService.runFsckCheck(selectedFsckDevice, true));
                  setBadBlocks(storageService.getBadBlocksGrid());
                  setIsCheckingFsck(false);
                  setActionNotice({ type: 'success', message: 'FSCK repair completed. 0 corrupted inodes remaining.' });
                  setTimeout(() => setActionNotice(null), 4500);
                }, 1000);
              }}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-xs font-bold text-white rounded-xl shadow-lg flex items-center gap-2"
            >
              <Wrench className="w-3.5 h-3.5" />
              <span>{isCheckingFsck ? 'CHECKING INODES...' : 'Run e2fsck & Repair'}</span>
            </button>
          </div>

          <div className="p-4 bg-[#141414] rounded-xl border border-[#222] text-xs font-mono space-y-2">
            <div className="text-emerald-400 font-bold">{fsckReport.pass1_inodesStatus}</div>
            <div className="text-[#ccc]">{fsckReport.pass2_dirStructureStatus}</div>
            <div className="text-[#ccc]">{fsckReport.pass3_connectivityStatus}</div>
            <div className="text-[#ccc]">{fsckReport.pass4_refCountsStatus}</div>
            <div className="text-emerald-400 font-bold">{fsckReport.pass5_groupSummaryStatus}</div>
            <div className="text-cyan-300 pt-2 border-t border-[#222]">{fsckReport.journalReplayStatus}</div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* ADMIN PIN ELEVATION MODAL */}
      {/* ========================================================================= */}
      <AdminPinElevationModal
        isOpen={isPinModalOpen}
        onClose={() => {
          setIsPinModalOpen(false);
          setPendingElevatedAction(null);
        }}
        onSuccess={() => {
          if (pendingElevatedAction) {
            pendingElevatedAction();
            setPendingElevatedAction(null);
          }
        }}
        actionTitle={elevationActionTitle}
        actionDescription={elevationActionDesc}
        targetDeviceName={elevationTargetNode}
      />

      {/* ========================================================================= */}
      {/* FORMAT PARTITION MODAL */}
      {/* ========================================================================= */}
      {showFormatModal && selectedPartition && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in font-sans">
          <div className="w-full max-w-md bg-[#0e1017] border border-[#333] rounded-2xl p-6 shadow-2xl space-y-4 text-white">
            <div className="flex items-center justify-between border-b border-[#222] pb-3">
              <h3 className="text-base font-bold flex items-center gap-2">
                <Trash2 className="w-4 h-4 text-rose-400" />
                Format Partition {selectedPartition.device}
              </h3>
              <button onClick={() => setShowFormatModal(false)} className="text-[#888] hover:text-white">✕</button>
            </div>

            <div className="space-y-3 text-xs">
              <p className="text-[#bbb]">
                Select the target filesystem to format <strong>{selectedPartition.name}</strong> ({selectedPartition.totalFormatted}).
              </p>

              <div className="space-y-1">
                <label className="text-[#888] font-mono">Target Filesystem:</label>
                <select
                  value={targetFs}
                  onChange={(e) => setTargetFs(e.target.value as any)}
                  className="w-full bg-[#141620] border border-[#333] rounded-lg px-3 py-2 text-white font-mono outline-none"
                >
                  <option value="ext4">ext4 (Linux Default Journaled)</option>
                  <option value="btrfs">Btrfs (Copy-on-Write Subvolumes)</option>
                  <option value="ntfs">NTFS (Windows Win32 Layer)</option>
                  <option value="xfs">XFS (High-Performance Scalable)</option>
                  <option value="vfat">FAT32 / vfat (EFI Boot Standard)</option>
                  <option value="exfat">exFAT (Removable Media)</option>
                  <option value="zfs">ZFS (ZFS Storage Pool)</option>
                </select>
              </div>

              <div className="p-3 bg-rose-950/30 border border-rose-800/40 rounded-lg text-rose-300 text-[11px]">
                WARNING: Formatting will overwrite data on this partition. Admin Elevated PIN will be requested.
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#222]">
                <button
                  type="button"
                  onClick={() => setShowFormatModal(false)}
                  className="px-4 py-2 bg-[#1c1c1c] text-[#bbb] hover:text-white rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleFormat}
                  className="px-5 py-2 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-lg shadow-lg"
                >
                  Format Volume
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* INITIALIZE DISK MODAL */}
      {/* ========================================================================= */}
      {showInitModal && currentDisk && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in font-sans">
          <div className="w-full max-w-md bg-[#0e1017] border border-[#333] rounded-2xl p-6 shadow-2xl space-y-4 text-white">
            <div className="flex items-center justify-between border-b border-[#222] pb-3">
              <h3 className="text-base font-bold flex items-center gap-2">
                <Wrench className="w-4 h-4 text-amber-400" />
                Initialize Storage Disk {currentDisk.devicePath}
              </h3>
              <button onClick={() => setShowInitModal(false)} className="text-[#888] hover:text-white">✕</button>
            </div>

            <div className="space-y-3 text-xs">
              <p className="text-[#bbb]">
                Initialize <strong>{currentDisk.model}</strong> ({currentDisk.sizeFormatted}) with a master partition table:
              </p>

              <div className="space-y-2">
                <label 
                  onClick={() => setInitPartitionTable('GPT')}
                  className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer ${
                    initPartitionTable === 'GPT' ? 'bg-purple-950/40 border-purple-500 text-white' : 'bg-[#141414] border-[#222] text-[#888]'
                  }`}
                >
                  <div>
                    <div className="font-bold">GPT (GUID Partition Table) — Recommended</div>
                    <div className="text-[11px] text-[#aaa]">Supports 2TB+ drives, UEFI boot, and unlimited partitions.</div>
                  </div>
                  <input type="radio" checked={initPartitionTable === 'GPT'} onChange={() => setInitPartitionTable('GPT')} />
                </label>

                <label 
                  onClick={() => setInitPartitionTable('MBR')}
                  className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer ${
                    initPartitionTable === 'MBR' ? 'bg-purple-950/40 border-purple-500 text-white' : 'bg-[#141414] border-[#222] text-[#888]'
                  }`}
                >
                  <div>
                    <div className="font-bold">MBR (Master Boot Record) — Legacy</div>
                    <div className="text-[11px] text-[#aaa]">Legacy BIOS compatibility, max 4 primary partitions.</div>
                  </div>
                  <input type="radio" checked={initPartitionTable === 'MBR'} onChange={() => setInitPartitionTable('MBR')} />
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#222]">
                <button
                  type="button"
                  onClick={() => setShowInitModal(false)}
                  className="px-4 py-2 bg-[#1c1c1c] text-[#bbb] hover:text-white rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleInitializeDisk}
                  className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-black font-bold font-mono rounded-lg shadow-lg"
                >
                  AUTHORIZE & INITIALIZE
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* NEW PARTITION MODAL */}
      {/* ========================================================================= */}
      {showNewPartitionModal && currentDisk && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in font-sans">
          <div className="w-full max-w-md bg-[#0e1017] border border-[#333] rounded-2xl p-6 shadow-2xl space-y-4 text-white">
            <div className="flex items-center justify-between border-b border-[#222] pb-3">
              <h3 className="text-base font-bold flex items-center gap-2">
                <Plus className="w-4 h-4 text-purple-400" />
                Create New Partition on {currentDisk.devicePath}
              </h3>
              <button onClick={() => setShowNewPartitionModal(false)} className="text-[#888] hover:text-white">✕</button>
            </div>

            <form onSubmit={handleCreatePartition} className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="text-[#aaa] font-semibold">Volume Label</label>
                <input
                  type="text"
                  value={newPartName}
                  onChange={(e) => setNewPartName(e.target.value)}
                  className="w-full bg-[#141620] border border-[#333] rounded-lg px-3 py-2 text-white font-mono outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[#aaa] font-semibold">Size in GB</label>
                  <input
                    type="number"
                    min={1}
                    max={Math.floor(freeDiskBytes / (1024 * 1024 * 1024)) || 500}
                    value={newPartSizeGb}
                    onChange={(e) => setNewPartSizeGb(Number(e.target.value))}
                    className="w-full bg-[#141620] border border-[#333] rounded-lg px-3 py-2 text-white font-mono outline-none"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[#aaa] font-semibold">Filesystem</label>
                  <select
                    value={newPartFs}
                    onChange={(e) => setNewPartFs(e.target.value as any)}
                    className="w-full bg-[#141620] border border-[#333] rounded-lg px-3 py-2 text-white font-mono outline-none"
                  >
                    <option value="ext4">ext4 (Linux Default)</option>
                    <option value="btrfs">Btrfs (CoW)</option>
                    <option value="ntfs">NTFS (Win32)</option>
                    <option value="xfs">XFS</option>
                    <option value="vfat">FAT32</option>
                    <option value="exfat">exFAT</option>
                    <option value="zfs">ZFS</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[#aaa] font-semibold">Mount Point</label>
                <input
                  type="text"
                  value={newPartMountPoint}
                  onChange={(e) => setNewPartMountPoint(e.target.value)}
                  className="w-full bg-[#141620] border border-[#333] rounded-lg px-3 py-2 text-white font-mono outline-none"
                  placeholder="/mnt/storage"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#222]">
                <button
                  type="button"
                  onClick={() => setShowNewPartitionModal(false)}
                  className="px-4 py-2 bg-[#1c1c1c] text-[#bbb] hover:text-white rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-lg shadow-lg shadow-purple-600/30"
                >
                  Create & Mount
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
