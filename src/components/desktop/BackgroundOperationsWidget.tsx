// jb7572_2026-09-03: Background Operations & System Resilience Widget
// Displays real-time downloads, file copies, moves, transfers, and anti-malware scans running while locked

import React, { useState, useEffect } from 'react';
import { 
  backgroundJobService, 
  BackgroundJob, 
  BackgroundJobType 
} from '../../services/backgroundJobService';
import { 
  Download, 
  Copy, 
  Move, 
  ArrowRightLeft, 
  ShieldAlert, 
  ShieldCheck, 
  Play, 
  Pause, 
  X, 
  RotateCw, 
  CheckCircle2, 
  Clock, 
  HardDrive, 
  Wifi, 
  ChevronDown, 
  ChevronUp, 
  Plus, 
  Layers, 
  Sparkles,
  Lock,
  Radio
} from 'lucide-react';

interface BackgroundOperationsWidgetProps {
  isLockedScreen?: boolean;
  onClose?: () => void;
  compact?: boolean;
}

export const BackgroundOperationsWidget: React.FC<BackgroundOperationsWidgetProps> = ({
  isLockedScreen = false,
  onClose,
  compact = false
}) => {
  const [jobs, setJobs] = useState<BackgroundJob[]>(() => backgroundJobService.getJobs());
  const [selectedFilter, setSelectedFilter] = useState<'ALL' | BackgroundJobType>('ALL');
  const [isExpanded, setIsExpanded] = useState<boolean>(!compact);
  const [showNewTaskDialog, setShowNewTaskDialog] = useState<boolean>(false);

  useEffect(() => {
    const unsubscribe = backgroundJobService.subscribe(updated => {
      setJobs(updated);
    });
    return () => unsubscribe();
  }, []);

  const activeJobs = jobs.filter(j => j.status === 'RUNNING');
  const filteredJobs = jobs.filter(j => {
    if (selectedFilter === 'ALL') return true;
    return j.type === selectedFilter;
  });

  const getJobIcon = (type: BackgroundJobType) => {
    switch (type) {
      case 'DOWNLOAD':
        return <Download className="w-4 h-4 text-cyan-400" />;
      case 'COPY_FILE':
        return <Copy className="w-4 h-4 text-emerald-400" />;
      case 'MOVE_FILE':
        return <Move className="w-4 h-4 text-amber-400" />;
      case 'TRANSFER_FILE':
        return <ArrowRightLeft className="w-4 h-4 text-purple-400" />;
      case 'ANTI_MALWARE_SCAN':
        return <ShieldCheck className="w-4 h-4 text-rose-400" />;
    }
  };

  const getJobBadgeColor = (type: BackgroundJobType) => {
    switch (type) {
      case 'DOWNLOAD':
        return 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30';
      case 'COPY_FILE':
        return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30';
      case 'MOVE_FILE':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/30';
      case 'TRANSFER_FILE':
        return 'bg-purple-500/20 text-purple-300 border-purple-500/30';
      case 'ANTI_MALWARE_SCAN':
        return 'bg-rose-500/20 text-rose-300 border-rose-500/30';
    }
  };

  const handlePause = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    backgroundJobService.pauseJob(id);
  };

  const handleResume = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    backgroundJobService.resumeJob(id);
  };

  const handleCancel = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    backgroundJobService.cancelJob(id);
  };

  const handleRestart = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    backgroundJobService.restartJob(id);
  };

  const handleLaunchPreset = (type: BackgroundJobType) => {
    if (type === 'ANTI_MALWARE_SCAN') {
      backgroundJobService.startAntiMalwareScan('/sys /boot /var/log', 'On-Demand Heuristic Verification');
    } else if (type === 'DOWNLOAD') {
      backgroundJobService.startDownload('YARA_Threat_Ruleset_2026.db', 'https://rules.securecurtain.org/yara-2026.db', 450);
    } else if (type === 'COPY_FILE') {
      backgroundJobService.startCopyFile('/sys/kernel/vmlinuz-hardened', '/backup/sys_image_vmlinuz', 280);
    } else if (type === 'MOVE_FILE') {
      backgroundJobService.startMoveFile('/var/tmp/audit_events.pcap', '/var/log/forensics/audit_events.pcap', 190);
    } else if (type === 'TRANSFER_FILE') {
      backgroundJobService.startTransferFile('/home/projects/SecureCurtain/archive.zip', 'siem.corp.internal:9997', 620);
    }
    setShowNewTaskDialog(false);
  };

  return (
    <div 
      className={`rounded-2xl border backdrop-blur-2xl shadow-2xl transition-all duration-300 flex flex-col font-mono text-xs ${
        isLockedScreen 
          ? 'bg-[#090e1c]/90 border-cyan-500/30 text-slate-200' 
          : 'bg-[#0f1424]/95 border-purple-500/30 text-slate-100'
      }`}
    >
      {/* Header bar */}
      <div 
        onClick={() => setIsExpanded(!isExpanded)}
        className="px-4 py-3 border-b border-white/10 flex items-center justify-between cursor-pointer select-none bg-white/[0.03] hover:bg-white/[0.06] rounded-t-2xl transition-colors"
      >
        <div className="flex items-center gap-2.5">
          <div className="relative">
            <Radio className="w-4 h-4 text-cyan-400 animate-pulse" />
            {activeJobs.length > 0 && (
              <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-white tracking-wide">
                {isLockedScreen ? 'Locked Session Tasks' : 'Active Background Operations'}
              </span>
              <span className="px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-[10px] font-bold">
                {activeJobs.length} Running
              </span>
            </div>
            {isLockedScreen && (
              <p className="text-[10px] text-cyan-200/70 font-sans mt-0.5">
                Workstation is locked • Background operations continue uninterrupted
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {!isLockedScreen && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowNewTaskDialog(!showNewTaskDialog);
              }}
              className="px-2.5 py-1 rounded-lg bg-purple-600/60 hover:bg-purple-600 text-white text-[11px] font-semibold flex items-center gap-1 border border-purple-400/40 shadow-sm"
              title="Start a new background operation"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New Task</span>
            </button>
          )}

          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsExpanded(!isExpanded);
            }}
            className="p-1 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white"
          >
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>

          {onClose && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onClose();
              }}
              className="p-1 rounded-lg hover:bg-red-500/20 text-slate-400 hover:text-red-300"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Expanded body */}
      {isExpanded && (
        <div className="p-3.5 space-y-3 flex-1 flex flex-col min-h-0">
          {/* Quick preset spawn dialog if toggled */}
          {showNewTaskDialog && (
            <div className="p-3 rounded-xl bg-purple-950/40 border border-purple-500/40 space-y-2 animate-in fade-in zoom-in-95 duration-150">
              <div className="text-[11px] font-bold text-purple-200 flex items-center justify-between">
                <span>Start Background Operation:</span>
                <button 
                  onClick={() => setShowNewTaskDialog(false)}
                  className="text-slate-400 hover:text-white text-[10px]"
                >
                  Cancel
                </button>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 text-[11px]">
                <button
                  onClick={() => handleLaunchPreset('ANTI_MALWARE_SCAN')}
                  className="p-2 rounded-lg bg-rose-950/40 hover:bg-rose-900/50 border border-rose-500/30 text-rose-200 text-left flex items-center gap-2"
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                  <div className="truncate">
                    <div className="font-bold">Anti-Malware</div>
                    <div className="text-[9px] text-rose-300/70">Heuristic Deep Scan</div>
                  </div>
                </button>

                <button
                  onClick={() => handleLaunchPreset('DOWNLOAD')}
                  className="p-2 rounded-lg bg-cyan-950/40 hover:bg-cyan-900/50 border border-cyan-500/30 text-cyan-200 text-left flex items-center gap-2"
                >
                  <Download className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                  <div className="truncate">
                    <div className="font-bold">Download File</div>
                    <div className="text-[9px] text-cyan-300/70">YARA Ruleset DB</div>
                  </div>
                </button>

                <button
                  onClick={() => handleLaunchPreset('COPY_FILE')}
                  className="p-2 rounded-lg bg-emerald-950/40 hover:bg-emerald-900/50 border border-emerald-500/30 text-emerald-200 text-left flex items-center gap-2"
                >
                  <Copy className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <div className="truncate">
                    <div className="font-bold">Copy File</div>
                    <div className="text-[9px] text-emerald-300/70">Kernel Image Backup</div>
                  </div>
                </button>

                <button
                  onClick={() => handleLaunchPreset('MOVE_FILE')}
                  className="p-2 rounded-lg bg-amber-950/40 hover:bg-amber-900/50 border border-amber-500/30 text-amber-200 text-left flex items-center gap-2"
                >
                  <Move className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <div className="truncate">
                    <div className="font-bold">Move File</div>
                    <div className="text-[9px] text-amber-300/70">PCAP Trace Log</div>
                  </div>
                </button>

                <button
                  onClick={() => handleLaunchPreset('TRANSFER_FILE')}
                  className="p-2 rounded-lg bg-purple-950/40 hover:bg-purple-900/50 border border-purple-500/30 text-purple-200 text-left flex items-center gap-2"
                >
                  <ArrowRightLeft className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                  <div className="truncate">
                    <div className="font-bold">Transfer File</div>
                    <div className="text-[9px] text-purple-300/70">Remote SIEM Export</div>
                  </div>
                </button>
              </div>
            </div>
          )}

          {/* Filter badges */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-[10px] scrollbar-none">
            {(['ALL', 'ANTI_MALWARE_SCAN', 'DOWNLOAD', 'COPY_FILE', 'MOVE_FILE', 'TRANSFER_FILE'] as const).map(flt => (
              <button
                key={flt}
                onClick={() => setSelectedFilter(flt)}
                className={`px-2 py-0.5 rounded-full border whitespace-nowrap transition-colors ${
                  selectedFilter === flt
                    ? 'bg-white/20 text-white border-white/40 font-bold'
                    : 'bg-white/5 text-slate-400 border-white/10 hover:bg-white/10'
                }`}
              >
                {flt === 'ALL' ? `All (${jobs.length})` : flt.replace('_', ' ')}
              </button>
            ))}
          </div>

          {/* Jobs List */}
          <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
            {filteredJobs.length === 0 ? (
              <div className="text-center py-6 text-slate-500 font-sans">
                No tasks matching the selected filter.
              </div>
            ) : (
              filteredJobs.map(job => (
                <div 
                  key={job.id}
                  className={`p-3 rounded-xl border transition-all ${
                    job.status === 'RUNNING'
                      ? 'bg-slate-900/70 border-white/15 shadow-md'
                      : job.status === 'COMPLETED'
                      ? 'bg-emerald-950/20 border-emerald-500/20'
                      : job.status === 'PAUSED'
                      ? 'bg-amber-950/20 border-amber-500/20 opacity-80'
                      : 'bg-slate-900/40 border-white/5 opacity-60'
                  }`}
                >
                  {/* Title and status row */}
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <div className="flex items-center gap-2 min-w-0">
                      {getJobIcon(job.type)}
                      <span className="font-bold text-white text-[11px] truncate" title={job.name}>
                        {job.name}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold border ${getJobBadgeColor(job.type)}`}>
                        {job.status}
                      </span>
                      
                      {/* Control buttons */}
                      {job.status === 'RUNNING' && job.canPause && (
                        <button
                          onClick={(e) => handlePause(job.id, e)}
                          title="Pause operation"
                          className="p-1 rounded bg-white/5 hover:bg-white/15 text-amber-300"
                        >
                          <Pause className="w-3 h-3" />
                        </button>
                      )}

                      {job.status === 'PAUSED' && (
                        <button
                          onClick={(e) => handleResume(job.id, e)}
                          title="Resume operation"
                          className="p-1 rounded bg-white/5 hover:bg-white/15 text-emerald-400"
                        >
                          <Play className="w-3 h-3" />
                        </button>
                      )}

                      {(job.status === 'RUNNING' || job.status === 'PAUSED') && job.canCancel && (
                        <button
                          onClick={(e) => handleCancel(job.id, e)}
                          title="Cancel operation"
                          className="p-1 rounded bg-white/5 hover:bg-red-500/20 text-slate-400 hover:text-red-300"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      )}

                      {job.status === 'COMPLETED' && (
                        <button
                          onClick={(e) => handleRestart(job.id, e)}
                          title="Restart task"
                          className="p-1 rounded bg-white/5 hover:bg-white/15 text-slate-400 hover:text-white"
                        >
                          <RotateCw className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="w-full bg-black/50 rounded-full h-1.5 overflow-hidden my-1.5">
                    <div 
                      className={`h-full transition-all duration-300 rounded-full ${
                        job.status === 'COMPLETED'
                          ? 'bg-emerald-400'
                          : job.status === 'PAUSED'
                          ? 'bg-amber-400'
                          : job.type === 'ANTI_MALWARE_SCAN'
                          ? 'bg-rose-500'
                          : 'bg-gradient-to-r from-cyan-400 to-purple-500'
                      }`}
                      style={{ width: `${job.progress}%` }}
                    />
                  </div>

                  {/* Details stats row */}
                  <div className="flex items-center justify-between text-[10px] text-slate-400">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-cyan-300">{job.progress.toFixed(0)}%</span>
                      <span>•</span>
                      <span>{job.processedFormatted} / {job.totalFormatted}</span>
                    </div>

                    <div className="flex items-center gap-2 font-mono">
                      {job.status === 'RUNNING' && (
                        <>
                          <span className="text-emerald-300 font-bold">{job.speed}</span>
                          <span>•</span>
                          <span>ETA: {job.estimatedRemainingSeconds}s</span>
                        </>
                      )}
                      {job.status === 'COMPLETED' && (
                        <span className="text-emerald-400 font-bold flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> Done
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Current step string */}
                  <div className="text-[9px] text-slate-400 truncate mt-1 flex items-center gap-1.5 font-sans">
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 shrink-0 animate-pulse" />
                    <span className="truncate">{job.currentStep}</span>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Locked Status Banner */}
          {isLockedScreen && (
            <div className="p-2.5 rounded-xl bg-cyan-950/40 border border-cyan-500/20 text-[10px] text-cyan-200/90 flex items-center gap-2">
              <Lock className="w-4 h-4 text-cyan-400 shrink-0" />
              <span>
                Workstation security lock enforced. File transfers and threat defense are prioritized by the microkernel.
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
