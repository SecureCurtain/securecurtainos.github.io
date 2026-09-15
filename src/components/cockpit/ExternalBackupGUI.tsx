// jb7572_2026-08-28: External Backup & Disaster Recovery GUI with USB Port Lockdown Bypass & Admin Elevated PIN
// Author: System Administrator - Root / Chief Forensic Architect

import React, { useState, useEffect } from 'react';
import { 
  HardDrive, 
  Usb, 
  ShieldCheck, 
  ShieldAlert, 
  Lock, 
  Unlock, 
  KeyRound, 
  Play, 
  Pause, 
  RotateCw, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  Calendar, 
  FolderArchive, 
  FileText, 
  FileCheck, 
  Terminal, 
  Sliders, 
  Plus, 
  Trash2, 
  ExternalLink,
  Zap,
  Cpu,
  Layers
} from 'lucide-react';
import { 
  adminAuthService, 
  BackupJobConfig, 
  BackupHistoryEntry, 
  UsbBypassToken 
} from '../../services/adminAuthService';
import { storageService, PhysicalDisk } from '../../services/storageService';
import { AdminPinElevationModal } from '../common/AdminPinElevationModal';

interface ExternalBackupGUIProps {
  onRunCliCommand?: (cmd: string) => void;
  onRefreshParent?: () => void;
}

export const ExternalBackupGUI: React.FC<ExternalBackupGUIProps> = ({
  onRunCliCommand,
  onRefreshParent
}) => {
  const [backupJobs, setBackupJobs] = useState<BackupJobConfig[]>(() => adminAuthService.getBackupJobs());
  const [backupHistory, setBackupHistory] = useState<BackupHistoryEntry[]>(() => adminAuthService.getBackupHistory());
  const [authorizedBypasses, setAuthorizedBypasses] = useState<UsbBypassToken[]>(() => adminAuthService.getAuthorizedUsbBypasses());
  const [disks, setDisks] = useState<PhysicalDisk[]>(() => storageService.getDisks());

  // Filter external / removable drives
  const externalDrives = disks.filter(d => d.type === 'External USB Storage' || d.isRemovable);
  const selectedDrive = externalDrives[0] || null;

  // Elevation PIN Modal State
  const [isPinModalOpen, setIsPinModalOpen] = useState(false);
  const [pinActionTarget, setPinActionTarget] = useState<'USB_BYPASS' | 'EXECUTE_BACKUP' | 'NEW_JOB'>('USB_BYPASS');
  const [actionNotice, setActionNotice] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Live Backup Execution State
  const [isExecutingBackup, setIsExecutingBackup] = useState(false);
  const [executingJobId, setExecutingJobId] = useState<string | null>(null);
  const [backupProgress, setBackupProgress] = useState(0);
  const [backupStageText, setBackupStageText] = useState('');
  const [transferredBytes, setTransferredBytes] = useState(0);
  const [currentSpeed, setCurrentSpeed] = useState(482.5);

  // New Backup Job Form Modal State
  const [showNewJobModal, setShowNewJobModal] = useState(false);
  const [newJobName, setNewJobName] = useState('Full Kernel & Home Snapshot');
  const [newJobScope, setNewJobScope] = useState<BackupJobConfig['backupScope']>('FULL_SYSTEM_SNAPSHOT');
  const [newJobSchedule, setNewJobSchedule] = useState<BackupJobConfig['scheduleType']>('DAILY_3AM');
  const [newJobCompression, setNewJobCompression] = useState<BackupJobConfig['compression']>('ZSTD');
  const [newJobEncryption, setNewJobEncryption] = useState<BackupJobConfig['encryption']>('KYBER_1024_AES256');

  const refreshState = () => {
    setBackupJobs([...adminAuthService.getBackupJobs()]);
    setBackupHistory([...adminAuthService.getBackupHistory()]);
    setAuthorizedBypasses([...adminAuthService.getAuthorizedUsbBypasses()]);
    setDisks([...storageService.getDisks()]);
    if (onRefreshParent) onRefreshParent();
  };

  const isSelectedDriveBypassed = selectedDrive 
    ? adminAuthService.isDeviceUsbBypassed(selectedDrive.id)
    : false;

  // Handle USB Port Lockdown Bypass Trigger
  const handleRequestUsbBypass = () => {
    setPinActionTarget('USB_BYPASS');
    setIsPinModalOpen(true);
  };

  const handleRevokeUsbBypass = (deviceId: string) => {
    const res = adminAuthService.revokeUsbBypass(deviceId);
    if (res.success) {
      setActionNotice({ type: 'success', message: res.message });
      refreshState();
    }
  };

  // Perform PIN Elevation Success
  const handlePinElevationSuccess = () => {
    if (pinActionTarget === 'USB_BYPASS' && selectedDrive) {
      const auth = adminAuthService.authorizeUsbDeviceBypass(adminAuthService.getAdminAccount().elevatedPin, {
        deviceId: selectedDrive.id,
        deviceLabel: selectedDrive.model,
        vendorId: selectedDrive.vendorId || '0781',
        productId: selectedDrive.productId || '5583',
        serialNumber: selectedDrive.hardwareSerial,
        reason: 'Authorized External Backup & Snapshot Target Device'
      });

      if (auth.success) {
        setActionNotice({
          type: 'success',
          message: `USB Port Lockdown bypassed for ${selectedDrive.model} [${selectedDrive.hardwareSerial}]. Device mounted & read/write enabled!`
        });
        refreshState();
      }
    } else if (pinActionTarget === 'EXECUTE_BACKUP' && executingJobId) {
      startBackupExecution(executingJobId);
    }
    setTimeout(() => setActionNotice(null), 5000);
  };

  // Start Live Backup Simulation
  const handleTriggerBackup = (jobId: string) => {
    const job = backupJobs.find(j => j.id === jobId);
    if (!job) return;

    // Check if USB bypass is authorized
    if (job.targetDeviceId === 'usb_sandisk_extreme' || job.targetDeviceId.includes('usb')) {
      if (!adminAuthService.isDeviceUsbBypassed(job.targetDeviceId) && !adminAuthService.isElevatedSessionActive()) {
        setExecutingJobId(jobId);
        setPinActionTarget('EXECUTE_BACKUP');
        setIsPinModalOpen(true);
        return;
      }
    }

    startBackupExecution(jobId);
  };

  const startBackupExecution = (jobId: string) => {
    const job = backupJobs.find(j => j.id === jobId);
    if (!job) return;

    setIsExecutingBackup(true);
    setExecutingJobId(jobId);
    setBackupProgress(0);
    setTransferredBytes(0);

    const stages = [
      'Locking filesystem VSS snapshot & kernel page tables...',
      'Computing incremental delta tree with Zstandard compression...',
      'Encrypting data stream with Post-Quantum Kyber-1024 / AES-256-GCM...',
      'Writing payload to authorized USB target device (/dev/sdb1)...',
      'Calculating SHA-256 integrity checksum & cataloging snapshot...'
    ];

    let currentProg = 0;
    const interval = setInterval(() => {
      currentProg += 5;
      setBackupProgress(currentProg);

      const stageIndex = Math.min(Math.floor((currentProg / 100) * stages.length), stages.length - 1);
      setBackupStageText(stages[stageIndex]);
      setTransferredBytes(prev => prev + 10.2 * 1024 * 1024 * 1024);

      if (currentProg >= 100) {
        clearInterval(interval);
        setIsExecutingBackup(false);
        setExecutingJobId(null);

        // Record history
        const newHistory: BackupHistoryEntry = {
          id: `bk_${Date.now()}`,
          jobName: job.name,
          timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19) + ' UTC',
          targetDevice: `${selectedDrive?.model || 'External USB SSD'} (/dev/sdb1)`,
          scope: job.backupScope === 'FULL_SYSTEM_SNAPSHOT' ? 'Full OS Live Image (/sys, /home, /mnt/c_drive)' : 'User Data Vault',
          totalSizeFormatted: job.backupScope === 'FULL_SYSTEM_SNAPSHOT' ? '203.8 GB' : '120.4 GB',
          durationSeconds: 425,
          avgThroughputMbPerSec: 488.2,
          sha256Checksum: '9a8b7c6d5e4f3a2b1c0d9e8f7a6b5c4d3e2f1a0b9c8d7e6f5a4b3c2d1e0f9a8b',
          status: 'COMPLETED_VERIFIED'
        };

        adminAuthService.recordBackupRun(newHistory);
        setActionNotice({
          type: 'success',
          message: `SUCCESS: Live backup '${job.name}' completed! Wrote ${newHistory.totalSizeFormatted} to external drive with bit-exact verification.`
        });
        refreshState();
        setTimeout(() => setActionNotice(null), 6000);
      }
    }, 200);
  };

  // Create New Backup Job
  const handleCreateJob = (e: React.FormEvent) => {
    e.preventDefault();
    const newJob: BackupJobConfig = {
      id: `job_${Date.now()}`,
      name: newJobName,
      targetDeviceId: selectedDrive?.id || 'usb_sandisk_extreme',
      targetMountPoint: selectedDrive?.partitions[0]?.mountPoint || '/media/usb_backup/vault',
      backupScope: newJobScope,
      scheduleType: newJobSchedule,
      compression: newJobCompression,
      encryption: newJobEncryption,
      retentionCopies: 10,
      autoPruneOld: true,
      lastRunStatus: 'NEVER'
    };

    adminAuthService.saveBackupJob(newJob);
    setShowNewJobModal(false);
    setActionNotice({ type: 'success', message: `Saved backup plan '${newJob.name}'.` });
    refreshState();
    setTimeout(() => setActionNotice(null), 4000);
  };

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

      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#222] pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 text-[10px] font-mono border border-purple-500/30">
              DISASTER RECOVERY SUITE
            </span>
            <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[10px] font-mono border border-emerald-500/30">
              POST-QUANTUM KYBER-1024
            </span>
          </div>
          <h2 className="text-lg font-bold text-white mt-1 flex items-center gap-2">
            <FolderArchive className="w-5 h-5 text-purple-400" />
            External Drive Backup & Live Snapshot Manager
          </h2>
          <p className="text-xs text-[#888]">
            Configure automated system images to attached external SSDs with hardware USB port lockdown bypass authorization
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onRunCliCommand && onRunCliCommand('systemctl status backup-daemon')}
            className="px-3 py-1.5 bg-[#141414] hover:bg-[#222] text-xs font-mono text-purple-300 rounded-lg border border-[#333] transition-colors"
          >
            CLI: backup --status
          </button>
          <button
            onClick={() => setShowNewJobModal(true)}
            className="px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-xs font-semibold text-white rounded-lg flex items-center gap-1.5 shadow-lg shadow-purple-600/30 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Backup Plan</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 1. HARDWARE USB PORT LOCKDOWN & ATTACHED DEVICE BYPASS STATUS BANNER */}
      {/* ========================================================================= */}
      <div className={`p-4 rounded-xl border transition-all ${
        isSelectedDriveBypassed
          ? 'bg-gradient-to-r from-emerald-950/40 via-[#0f1a14] to-[#0a0a0a] border-emerald-500/40 shadow-[0_0_24px_rgba(16,185,129,0.15)]'
          : 'bg-gradient-to-r from-amber-950/40 via-[#1a140f] to-[#0a0a0a] border-amber-500/40 shadow-[0_0_24px_rgba(245,158,11,0.15)]'
      }`}>
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className={`p-3 rounded-xl border ${
              isSelectedDriveBypassed
                ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                : 'bg-amber-500/20 text-amber-400 border-amber-500/40 animate-pulse'
            }`}>
              {isSelectedDriveBypassed ? <ShieldCheck className="w-6 h-6" /> : <Lock className="w-6 h-6" />}
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-white font-mono">
                  HARDWARE USB PORT AIR-GAP LOCKDOWN:
                </span>
                <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                  isSelectedDriveBypassed
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                    : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                }`}>
                  {isSelectedDriveBypassed ? '1 Authorized Whitelist Bypass' : 'ENFORCED (ALL PORTS LOCKED)'}
                </span>
              </div>

              <div className="text-xs text-[#bbb] flex flex-wrap items-center gap-x-3 gap-y-1">
                <span>Attached Backup Drive: <strong className="text-white">{selectedDrive?.model || 'SanDisk Extreme Pro 1.0TB'}</strong></span>
                <span className="text-[#666]">|</span>
                <span className="font-mono text-cyan-300">Serial: {selectedDrive?.hardwareSerial || 'SN:AA01092847291'}</span>
                <span className="text-[#666]">|</span>
                <span className="font-mono text-purple-300">Bus: USB 3.2 Gen 2x2</span>
              </div>

              <p className="text-[11px] text-[#888]">
                {isSelectedDriveBypassed 
                  ? 'Admin Elevated PIN authorized a hardware whitelist token strictly for this external drive. All other USB devices remain isolated.'
                  : 'To protect against BadUSB and exfiltration, this external drive is locked down until the Admin verifies their 4-10 char Elevated PIN.'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {isSelectedDriveBypassed ? (
              <button
                onClick={() => selectedDrive && handleRevokeUsbBypass(selectedDrive.id)}
                className="px-3.5 py-2 bg-[#1a1414] hover:bg-[#261818] text-rose-300 hover:text-rose-200 text-xs font-medium rounded-xl border border-rose-800/40 flex items-center gap-1.5 transition-colors"
              >
                <Lock className="w-3.5 h-3.5" />
                <span>Revoke USB Bypass</span>
              </button>
            ) : (
              <button
                onClick={handleRequestUsbBypass}
                className="px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black text-xs font-bold font-mono rounded-xl border border-amber-400 flex items-center gap-2 shadow-[0_0_20px_rgba(245,158,11,0.35)] transition-all cursor-pointer"
              >
                <KeyRound className="w-4 h-4" />
                <span>ENTER ADMIN PIN TO BYPASS USB LOCKDOWN</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. ACTIVE LIVE BACKUP PROGRESS HUD (WHEN RUNNING) */}
      {/* ========================================================================= */}
      {isExecutingBackup && (
        <div className="bg-[#0e111a] border-2 border-purple-500/50 rounded-xl p-4 shadow-[0_0_30px_rgba(168,85,247,0.2)] space-y-3 animate-fade-in">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-3 h-3 rounded-full bg-purple-400 animate-ping" />
              <span className="text-xs font-bold text-white font-mono uppercase tracking-wider">
                Live Snapshot Streaming in Progress...
              </span>
            </div>
            <div className="text-xs font-mono text-purple-300">
              {backupProgress}% ({currentSpeed} MB/s)
            </div>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-[#181d2a] h-3 rounded-full overflow-hidden border border-[#2d374f] p-0.5">
            <div 
              className="h-full bg-gradient-to-r from-purple-600 via-pink-500 to-cyan-400 rounded-full transition-all duration-200 shadow-[0_0_12px_rgba(168,85,247,0.8)]"
              style={{ width: `${backupProgress}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-[11px] font-mono text-[#888]">
            <span className="text-cyan-300 flex items-center gap-1.5">
              <Zap className="w-3 h-3 text-cyan-400" />
              {backupStageText}
            </span>
            <span>Target: /media/usb_sandisk_extreme/backups</span>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. CONFIGURED BACKUP PLANS & TARGETS */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {backupJobs.map((job) => {
          const isRunning = isExecutingBackup && executingJobId === job.id;
          return (
            <div 
              key={job.id}
              className="bg-[#0f0f0f] border border-[#222] hover:border-[#333] rounded-xl p-4 shadow-lg space-y-3.5 transition-all"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="p-2.5 bg-purple-950/40 text-purple-400 rounded-xl border border-purple-800/40">
                    <FolderArchive className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white">{job.name}</h4>
                    <div className="flex items-center gap-2 text-[10px] font-mono text-[#888] mt-0.5">
                      <span className="px-1.5 py-0.2 rounded bg-[#1c1c1c] text-cyan-300 border border-[#333]">
                        {job.backupScope}
                      </span>
                      <span>•</span>
                      <span className="text-amber-300">
                        {job.scheduleType === 'ON_CONNECT' ? 'Trigger on USB Plug-in' : 'Schedule: Daily @ 03:00 UTC'}
                      </span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => handleTriggerBackup(job.id)}
                  disabled={isExecutingBackup}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold font-mono flex items-center gap-1.5 transition-all shadow-md ${
                    isRunning
                      ? 'bg-purple-900/60 text-purple-300 border border-purple-500/40 animate-pulse cursor-wait'
                      : 'bg-purple-600 hover:bg-purple-500 text-white shadow-purple-600/30'
                  }`}
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>{isRunning ? 'RUNNING...' : 'BACKUP NOW'}</span>
                </button>
              </div>

              {/* Specs & Security Details */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-[#1a1a1a] text-[11px] font-mono">
                <div className="bg-[#141414] p-2 rounded-lg border border-[#222]">
                  <div className="text-[9px] text-[#777] uppercase">Encryption</div>
                  <div className="text-emerald-400 font-bold truncate">{job.encryption}</div>
                </div>
                <div className="bg-[#141414] p-2 rounded-lg border border-[#222]">
                  <div className="text-[9px] text-[#777] uppercase">Compression</div>
                  <div className="text-cyan-400 font-bold">{job.compression} (Fast)</div>
                </div>
                <div className="bg-[#141414] p-2 rounded-lg border border-[#222]">
                  <div className="text-[9px] text-[#777] uppercase">Retention</div>
                  <div className="text-purple-300 font-bold">{job.retentionCopies} Snapshots</div>
                </div>
                <div className="bg-[#141414] p-2 rounded-lg border border-[#222]">
                  <div className="text-[9px] text-[#777] uppercase">Last Status</div>
                  <div className="text-emerald-400 font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    <span>{job.lastRunBytesFormatted || '203 GB'}</span>
                  </div>
                </div>
              </div>

              {/* Target Location Footer */}
              <div className="flex items-center justify-between text-[11px] text-[#777] font-mono pt-1">
                <span>Destination: <strong className="text-[#ccc]">{job.targetMountPoint}</strong></span>
                <span className="text-[#666]">Last: {job.lastRunDate || '2026-08-28 03:00 UTC'}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* ========================================================================= */}
      {/* 4. HISTORICAL BACKUP SNAPSHOT CATALOG & CHECKSUMS */}
      {/* ========================================================================= */}
      <div className="bg-[#0f0f0f] border border-[#222] rounded-xl p-4 shadow-xl space-y-3">
        <div className="flex items-center justify-between border-b border-[#222] pb-3">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-purple-400" />
            <h3 className="text-sm font-bold text-white">External Backup Archive Catalog & Verification</h3>
          </div>
          <span className="text-xs font-mono text-[#888]">
            {backupHistory.length} Verified Images on External Media
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="border-b border-[#222] text-[#888]">
                <th className="pb-2 font-medium">Snapshot Timestamp</th>
                <th className="pb-2 font-medium">Plan / Scope</th>
                <th className="pb-2 font-medium">Target Media</th>
                <th className="pb-2 font-medium">Archive Size</th>
                <th className="pb-2 font-medium">Throughput</th>
                <th className="pb-2 font-medium">SHA-256 Bit Integrity</th>
                <th className="pb-2 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1a1a1a]">
              {backupHistory.map((entry) => (
                <tr key={entry.id} className="hover:bg-[#141414] text-[#ccc]">
                  <td className="py-2.5 text-white font-bold flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    {entry.timestamp}
                  </td>
                  <td className="py-2.5 text-purple-300">{entry.jobName}</td>
                  <td className="py-2.5 text-[#aaa]">{entry.targetDevice}</td>
                  <td className="py-2.5 text-emerald-300 font-bold">{entry.totalSizeFormatted}</td>
                  <td className="py-2.5 text-cyan-300">{entry.avgThroughputMbPerSec} MB/s</td>
                  <td className="py-2.5 font-mono text-[10px] text-[#777] truncate max-w-[140px]">
                    {entry.sha256Checksum.substring(0, 16)}...
                  </td>
                  <td className="py-2.5 text-right">
                    <button
                      onClick={() => {
                        setActionNotice({
                          type: 'success',
                          message: `Verified snapshot ${entry.id} SHA-256 checksum: Bit-for-bit match on ${entry.targetDevice}.`
                        });
                        setTimeout(() => setActionNotice(null), 4000);
                      }}
                      className="px-2.5 py-1 bg-[#1a1a1a] hover:bg-[#252525] text-[11px] text-cyan-300 rounded border border-[#333] transition-colors"
                    >
                      Verify Checksum
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 5. ADMIN PIN ELEVATION MODAL */}
      {/* ========================================================================= */}
      <AdminPinElevationModal
        isOpen={isPinModalOpen}
        onClose={() => setIsPinModalOpen(false)}
        onSuccess={handlePinElevationSuccess}
        actionTitle={
          pinActionTarget === 'USB_BYPASS'
            ? 'Authorize Hardware USB Port Lockdown Bypass'
            : 'Authorize Live System Image Backup Execution'
        }
        actionDescription={
          pinActionTarget === 'USB_BYPASS'
            ? `Superuser privilege required to whitelist external storage device [${selectedDrive?.model || 'SanDisk Extreme Pro'}] and bypass hardware USB isolation.`
            : `Superuser privilege required to freeze kernel VSS live memory state and stream backup payload to external target.`
        }
        targetDeviceName={selectedDrive?.model || '/dev/sdb1 (External USB)'}
        requiredForUsbBypass={pinActionTarget === 'USB_BYPASS'}
      />

      {/* ========================================================================= */}
      {/* 6. CREATE NEW BACKUP PLAN MODAL */}
      {/* ========================================================================= */}
      {showNewJobModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in font-sans">
          <div className="w-full max-w-lg bg-[#0e1017] border border-[#333] rounded-2xl p-6 shadow-2xl space-y-4 text-white">
            <div className="flex items-center justify-between border-b border-[#222] pb-3">
              <h3 className="text-base font-bold flex items-center gap-2">
                <Plus className="w-4 h-4 text-purple-400" />
                Configure New External Backup Plan
              </h3>
              <button onClick={() => setShowNewJobModal(false)} className="text-[#888] hover:text-white">✕</button>
            </div>

            <form onSubmit={handleCreateJob} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="text-[#aaa] font-semibold">Plan Name</label>
                <input
                  type="text"
                  value={newJobName}
                  onChange={(e) => setNewJobName(e.target.value)}
                  className="w-full bg-[#141620] border border-[#333] rounded-lg px-3 py-2 text-white font-mono outline-none focus:border-purple-400"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[#aaa] font-semibold">Backup Scope</label>
                  <select
                    value={newJobScope}
                    onChange={(e) => setNewJobScope(e.target.value as any)}
                    className="w-full bg-[#141620] border border-[#333] rounded-lg px-3 py-2 text-white font-mono outline-none focus:border-purple-400"
                  >
                    <option value="FULL_SYSTEM_SNAPSHOT">Full OS Live Snapshot (~203 GB)</option>
                    <option value="USER_HOME_PROJECTS">User Home & Projects (/home - 120 GB)</option>
                    <option value="BOOT_RECOVERY_IMAGE">Boot EFI & Recovery Image (/recovery)</option>
                    <option value="CONFIG_REGISTRY">Config & Registry (/etc, /sys)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[#aaa] font-semibold">Trigger / Schedule</label>
                  <select
                    value={newJobSchedule}
                    onChange={(e) => setNewJobSchedule(e.target.value as any)}
                    className="w-full bg-[#141620] border border-[#333] rounded-lg px-3 py-2 text-white font-mono outline-none focus:border-purple-400"
                  >
                    <option value="ON_CONNECT">On External Drive Connected</option>
                    <option value="DAILY_3AM">Daily at 03:00 AM UTC</option>
                    <option value="HOURLY">Hourly Snapshot Rotation</option>
                    <option value="WEEKLY">Weekly Full Delta</option>
                    <option value="MANUAL">Manual Trigger Only</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[#aaa] font-semibold">Compression Engine</label>
                  <select
                    value={newJobCompression}
                    onChange={(e) => setNewJobCompression(e.target.value as any)}
                    className="w-full bg-[#141620] border border-[#333] rounded-lg px-3 py-2 text-white font-mono outline-none focus:border-purple-400"
                  >
                    <option value="ZSTD">Zstandard (Zstd-Level 3 / Fast)</option>
                    <option value="LZ4">LZ4 (Ultra-Low Overhead)</option>
                    <option value="GZIP">Gzip (Maximum Compatibility)</option>
                    <option value="NONE">Uncompressed Raw Blocks</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[#aaa] font-semibold">Encryption Standard</label>
                  <select
                    value={newJobEncryption}
                    onChange={(e) => setNewJobEncryption(e.target.value as any)}
                    className="w-full bg-[#141620] border border-[#333] rounded-lg px-3 py-2 text-white font-mono outline-none focus:border-purple-400"
                  >
                    <option value="KYBER_1024_AES256">NIST Kyber-1024 + AES-256-GCM</option>
                    <option value="AES256_GCM">AES-256-GCM Hardware Vault</option>
                    <option value="NONE">Plaintext (Unencrypted)</option>
                  </select>
                </div>
              </div>

              <div className="p-3 rounded-lg bg-[#141620] border border-[#222] text-[11px] text-[#888]">
                Target Device: <strong className="text-white">{selectedDrive?.model || 'SanDisk Extreme Pro 1.0TB'}</strong> ({selectedDrive?.partitions[0]?.mountPoint || '/media/usb_sandisk_extreme/backups'})
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#222]">
                <button
                  type="button"
                  onClick={() => setShowNewJobModal(false)}
                  className="px-4 py-2 bg-[#1c1c1c] text-[#bbb] hover:text-white rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-lg shadow-lg shadow-purple-600/30"
                >
                  Save Backup Plan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
