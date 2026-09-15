// jb7572_2026-09-01: Execution Artifacts & Timestomp Delta Analyzer (Prefetch, Amcache, BAM, SRUM, $MFT Timestomp)
import React, { useState } from 'react';
import { 
  PrefetchArtifact, 
  AmcacheArtifact, 
  BamDamArtifact, 
  SrumArtifact, 
  TimestompAnomalyEntry,
  MOCK_PREFETCH_ARTIFACTS,
  MOCK_AMCACHE_ARTIFACTS,
  MOCK_BAM_ARTIFACTS,
  MOCK_SRUM_ARTIFACTS,
  MOCK_TIMESTOMP_ANOMALIES
} from '../../../services/forensicsService';
import { 
  History, 
  Cpu, 
  Terminal, 
  Layers, 
  FileCode, 
  AlertTriangle, 
  Clock, 
  ShieldAlert, 
  ShieldCheck, 
  Activity, 
  Search, 
  FileText, 
  Hash, 
  Copy, 
  Zap, 
  Flame, 
  BarChart3,
  Calendar,
  CheckCircle2
} from 'lucide-react';

interface ExecutionArtifactsTabProps {
  onNotify: (title: string, message: string) => void;
}

type ArtifactCategory = 'PREFETCH' | 'AMCACHE' | 'BAM_DAM' | 'SRUM' | 'TIMESTOMP_ANALYSIS';

export const ExecutionArtifactsTab: React.FC<ExecutionArtifactsTabProps> = ({ onNotify }) => {
  const [activeCategory, setActiveCategory] = useState<ArtifactCategory>('PREFETCH');
  const [searchFilter, setSearchFilter] = useState('');
  const [selectedPrefetchId, setSelectedPrefetchId] = useState<string>(MOCK_PREFETCH_ARTIFACTS[0].id);
  const [selectedTimestompId, setSelectedTimestompId] = useState<string>(MOCK_TIMESTOMP_ANOMALIES[0].id);

  const selectedPrefetch = MOCK_PREFETCH_ARTIFACTS.find(p => p.id === selectedPrefetchId) || MOCK_PREFETCH_ARTIFACTS[0];
  const selectedTimestomp = MOCK_TIMESTOMP_ANOMALIES.find(t => t.id === selectedTimestompId) || MOCK_TIMESTOMP_ANOMALIES[0];

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    onNotify('Copied to Clipboard', `${label} copied.`);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-lg relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="p-2 bg-rose-500/20 text-rose-400 rounded-lg">
                <History className="w-5 h-5" />
              </span>
              <h2 className="text-xl font-bold text-slate-100">Windows Execution Artifacts & Timestomp Analyzer</h2>
              <span className="px-2 py-0.5 text-xs font-semibold bg-rose-500/20 text-rose-400 border border-rose-500/30 rounded-full">
                Prefetch (MAM) • Amcache • BAM • SRUM • $MFT Delta
              </span>
            </div>
            <p className="text-xs text-slate-400 max-w-3xl">
              Reconstruct precise evidence of binary execution, deleted malware payloads, and anti-forensics timestamp manipulation. Compares <strong>$STANDARD_INFORMATION</strong> against <strong>$FILE_NAME</strong> attributes to expose timestomped malware.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1 px-2.5 py-1 bg-slate-800 border border-rose-500/30 text-[11px] font-mono text-rose-300 rounded-lg">
              <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
              Anti-Forensics Detector Active
            </span>
          </div>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-800 pb-3">
        {[
          { id: 'PREFETCH', label: 'Windows Prefetch (*.pf)', icon: Cpu, count: MOCK_PREFETCH_ARTIFACTS.length },
          { id: 'TIMESTOMP_ANALYSIS', label: 'Anti-Forensics Timestomp ($MFT)', icon: Flame, count: MOCK_TIMESTOMP_ANOMALIES.length },
          { id: 'AMCACHE', label: 'Amcache.hve (Deleted Binaries)', icon: FileCode, count: MOCK_AMCACHE_ARTIFACTS.length },
          { id: 'BAM_DAM', label: 'BAM / DAM Activity Moderator', icon: Activity, count: MOCK_BAM_ARTIFACTS.length },
          { id: 'SRUM', label: 'SRUM Network/CPU Metrics', icon: BarChart3, count: MOCK_SRUM_ARTIFACTS.length }
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeCategory === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveCategory(tab.id as ArtifactCategory)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all ${
                isActive
                  ? 'bg-rose-600/20 text-rose-200 border border-rose-500/80 shadow-[0_0_12px_rgba(244,63,94,0.25)]'
                  : 'bg-slate-800/60 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-700/60'
              }`}
            >
              <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-rose-400' : 'text-slate-400'}`} />
              <span>{tab.label}</span>
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-900 text-slate-300 border border-slate-700">
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: PREFETCH */}
      {activeCategory === 'PREFETCH' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-5 space-y-4">
            <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 space-y-3">
              <h3 className="text-sm font-semibold text-slate-200 uppercase tracking-wider flex items-center justify-between">
                <span>Prefetch Directory Entries</span>
                <span className="text-xs font-mono text-slate-400">C:\Windows\Prefetch</span>
              </h3>

              <div className="space-y-2">
                {MOCK_PREFETCH_ARTIFACTS.map(pf => (
                  <div
                    key={pf.id}
                    onClick={() => setSelectedPrefetchId(pf.id)}
                    className={`p-3 rounded-lg border text-xs cursor-pointer transition-all ${
                      selectedPrefetchId === pf.id
                        ? 'bg-slate-800/90 border-rose-500 text-white shadow-sm'
                        : 'bg-slate-800/40 border-slate-700/60 text-slate-300 hover:bg-slate-800/70'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-slate-100 flex items-center gap-1.5">
                        <Terminal className="w-3.5 h-3.5 text-rose-400" />
                        {pf.executableName}
                      </span>
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-900 border border-slate-700 text-rose-300">
                        Run Count: {pf.runCount}
                      </span>
                    </div>

                    <div className="mt-2 flex items-center justify-between text-[11px] font-mono text-slate-400">
                      <span className="truncate max-w-[220px] text-slate-400">{pf.prefetchFilename}</span>
                      <span className="text-slate-300">{pf.lastRunUtc.slice(0, 16)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="lg:col-span-7 space-y-4">
            {selectedPrefetch && (
              <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <div>
                    <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                      <Cpu className="w-4 h-4 text-rose-400" />
                      {selectedPrefetch.executableName}
                    </h3>
                    <div className="text-xs font-mono text-slate-400 mt-0.5">
                      {selectedPrefetch.fullPath}
                    </div>
                  </div>

                  <span className="text-[11px] font-mono px-2 py-1 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded">
                    MAM Decompressed
                  </span>
                </div>

                {/* Execution Stats Grid */}
                <div className="grid grid-cols-3 gap-3 text-center text-xs">
                  <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                    <div className="text-lg font-bold text-rose-400">{selectedPrefetch.runCount}</div>
                    <div className="text-[10px] text-slate-400">Total Run Count</div>
                  </div>
                  <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                    <div className="text-lg font-bold text-slate-100">{selectedPrefetch.loadedDllsCount}</div>
                    <div className="text-[10px] text-slate-400">Loaded DLL Modules</div>
                  </div>
                  <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                    <div className="text-lg font-bold text-indigo-400">{selectedPrefetch.hash}</div>
                    <div className="text-[10px] text-slate-400">Path Hash</div>
                  </div>
                </div>

                {/* Execution Timestamps History (Last 8 Execution Run Times) */}
                <div className="bg-slate-950/90 border border-slate-800 rounded-lg p-3 space-y-2">
                  <div className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-rose-400" />
                    Last Execution Timestamps (Windows 10/11 8-Slot History)
                  </div>
                  <div className="space-y-1 font-mono text-xs text-slate-300">
                    <div className="p-2 bg-slate-900 rounded border border-slate-800 flex justify-between">
                      <span className="text-rose-400 font-bold">1. (Most Recent):</span>
                      <span>{selectedPrefetch.lastRunUtc}</span>
                    </div>
                    {selectedPrefetch.previousRunTimesUtc.map((t, idx) => (
                      <div key={idx} className="p-2 bg-slate-900/60 rounded border border-slate-800/80 flex justify-between text-slate-400">
                        <span>{idx + 2}. (Previous):</span>
                        <span>{t}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Suspicious Findings */}
                {selectedPrefetch.suspiciousIndicators.length > 0 && (
                  <div className="bg-rose-950/30 border border-rose-800/50 rounded-lg p-3 space-y-2">
                    <div className="text-xs font-semibold text-rose-300 flex items-center gap-1.5">
                      <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                      Forensic Behavioral Flags
                    </div>
                    <ul className="space-y-1 text-xs text-rose-200">
                      {selectedPrefetch.suspiciousIndicators.map((ind, i) => (
                        <li key={i} className="flex items-start gap-1.5">
                          <span className="text-rose-400">•</span>
                          <span>{ind}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: ANTI-FORENSICS TIMESTOMP ($MFT DELTA) */}
      {activeCategory === 'TIMESTOMP_ANALYSIS' && (
        <div className="space-y-5">
          <div className="bg-slate-950/80 border border-rose-900/40 rounded-xl p-4 flex items-center justify-between text-xs text-slate-300">
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 bg-rose-500/20 text-rose-400 rounded">
                <Flame className="w-4 h-4" />
              </div>
              <div>
                <span className="font-semibold text-rose-200">Timestomp Mathematical Proof ($SI vs $FN):</span>{' '}
                <span className="text-slate-400">Windows APIs (like SetFileTime) alter the <strong>$STANDARD_INFORMATION ($SI)</strong> attribute, but the kernel-protected <strong>$FILE_NAME ($FN)</strong> attribute can only be altered via low-level disk tampering. When $SI is older than $FN, or nanoseconds are zeroed out (0000000), timestomping is mathematically proven.</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-5 space-y-3">
              <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 space-y-3">
                <h3 className="text-sm font-semibold text-slate-200 uppercase tracking-wider flex items-center justify-between">
                  <span>Detected Timestomp Anomalies</span>
                  <span className="text-xs font-mono text-rose-400">{MOCK_TIMESTOMP_ANOMALIES.length} Flagged</span>
                </h3>

                <div className="space-y-2">
                  {MOCK_TIMESTOMP_ANOMALIES.map(ts => (
                    <div
                      key={ts.id}
                      onClick={() => setSelectedTimestompId(ts.id)}
                      className={`p-3 rounded-lg border text-xs cursor-pointer transition-all ${
                        selectedTimestompId === ts.id
                          ? 'bg-slate-800/90 border-rose-500 text-white shadow-sm'
                          : 'bg-slate-800/40 border-slate-700/60 text-slate-300 hover:bg-slate-800/70'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-slate-100 truncate max-w-[200px]">
                          {ts.filepath.split('\\').pop()}
                        </span>
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-rose-950 text-rose-300 border border-rose-800">
                          {ts.confidenceScore}
                        </span>
                      </div>

                      <div className="mt-2 text-[11px] font-mono text-slate-400 truncate">
                        {ts.filepath}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="lg:col-span-7 space-y-4">
              {selectedTimestomp && (
                <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                    <div>
                      <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                        <ShieldAlert className="w-4 h-4 text-rose-400" />
                        Timestomp Forensic Dissection
                      </h3>
                      <div className="text-xs font-mono text-slate-400 mt-0.5">
                        MFT Record #{selectedTimestomp.mftRecordNumber} • {selectedTimestomp.filepath}
                      </div>
                    </div>

                    <span className="text-xs font-mono px-2 py-1 bg-rose-500/20 text-rose-300 border border-rose-500/40 rounded">
                      Delta: {(selectedTimestomp.deltaSeconds / 86400).toFixed(1)} Days Falsified
                    </span>
                  </div>

                  {/* Attribute Comparison Grid */}
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div className="bg-slate-950/80 border border-slate-800 p-3 rounded-lg space-y-1.5">
                      <div className="text-rose-400 font-semibold flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" />
                        $STANDARD_INFORMATION (SI)
                      </div>
                      <div className="text-[11px] text-slate-400">Spoofed / User-Accessible Timestamp</div>
                      <div className="font-mono text-xs text-rose-300 bg-slate-900 p-2 rounded border border-slate-800">
                        {selectedTimestomp.standardInfoCreated}
                      </div>
                    </div>

                    <div className="bg-slate-950/80 border border-slate-800 p-3 rounded-lg space-y-1.5">
                      <div className="text-emerald-400 font-semibold flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        $FILE_NAME (FN)
                      </div>
                      <div className="text-[11px] text-slate-400">True Kernel-Protected Timestamp</div>
                      <div className="font-mono text-xs text-emerald-300 bg-slate-900 p-2 rounded border border-slate-800">
                        {selectedTimestomp.fileNameCreated}
                      </div>
                    </div>
                  </div>

                  {/* Forensic Proof Summary Box */}
                  <div className="bg-rose-950/20 border border-rose-800/40 rounded-lg p-4 space-y-2 text-xs">
                    <div className="font-semibold text-rose-300 flex items-center gap-1.5">
                      <Flame className="w-3.5 h-3.5 text-rose-400" />
                      Court-Admissible Evidence of Intentional Tampering
                    </div>
                    <p className="text-slate-300 leading-relaxed font-mono text-[11px]">
                      {selectedTimestomp.forensicProof}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: AMCACHE */}
      {activeCategory === 'AMCACHE' && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div>
              <h3 className="text-sm font-semibold text-slate-200 uppercase tracking-wider flex items-center gap-2">
                <FileCode className="w-4 h-4 text-indigo-400" />
                Amcache.hve Registry Hive (Historical Deleted Binaries)
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Records cryptographic SHA-1 hashes and PE headers of all executed binaries, even after the suspect deleted the file from disk.
              </p>
            </div>
          </div>

          <div className="space-y-3">
            {MOCK_AMCACHE_ARTIFACTS.map(amc => (
              <div key={amc.id} className="bg-slate-950/80 border border-slate-800 rounded-lg p-4 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-100 text-sm">{amc.fileDescription}</span>
                  {amc.isDeletedFromDisk && (
                    <span className="text-[10px] font-mono px-2 py-0.5 bg-rose-500/20 text-rose-400 border border-rose-500/30 rounded">
                      DELETED FROM DISK (Recovered via Amcache)
                    </span>
                  )}
                </div>

                <div className="font-mono text-xs text-slate-400">{amc.filePath}</div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-2 pt-2 border-t border-slate-800/80 font-mono text-[11px]">
                  <div>
                    <span className="text-slate-500">SHA1 Hash:</span>{' '}
                    <span className="text-amber-300">{amc.sha1Hash}</span>
                  </div>
                  <div>
                    <span className="text-slate-500">Compiled:</span>{' '}
                    <span className="text-slate-300">{amc.compilationTimestampUtc}</span>
                  </div>
                  <div>
                    <span className="text-slate-500">Publisher:</span>{' '}
                    <span className="text-rose-400">{amc.publisher}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: BAM / DAM */}
      {activeCategory === 'BAM_DAM' && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div>
              <h3 className="text-sm font-semibold text-slate-200 uppercase tracking-wider flex items-center gap-2">
                <Activity className="w-4 h-4 text-emerald-400" />
                Background Activity Moderator (BAM / DAM)
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Windows kernel driver tracking user SID execution records located in SYSTEM\CurrentControlSet\Services\bam\State\UserSettings.
              </p>
            </div>
          </div>

          <div className="space-y-3">
            {MOCK_BAM_ARTIFACTS.map(bam => (
              <div key={bam.id} className="bg-slate-950/80 border border-slate-800 rounded-lg p-4 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-200 font-mono text-xs">{bam.binaryPath}</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded">
                    User: {bam.username}
                  </span>
                </div>
                <div className="flex justify-between font-mono text-[11px] text-slate-400 pt-1 border-t border-slate-800">
                  <span>User SID: {bam.userSid}</span>
                  <span className="text-emerald-300 font-bold">{bam.lastExecutionUtc}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 5: SRUM */}
      {activeCategory === 'SRUM' && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div>
              <h3 className="text-sm font-semibold text-slate-200 uppercase tracking-wider flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-indigo-400" />
                System Resource Usage Monitor (SRUM - SRUDB.dat)
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Tracks exfiltrated network bytes and CPU execution cycles per application over the past 30 days.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {MOCK_SRUM_ARTIFACTS.map(srum => (
              <div key={srum.id} className="bg-slate-950/80 border border-slate-800 rounded-lg p-4 space-y-3 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-100 text-sm font-mono">{srum.appId}</span>
                  <span className="text-[11px] font-mono text-slate-400">User: {srum.userId.slice(-4)}</span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-center">
                  <div className="bg-slate-900 p-2 rounded border border-slate-800">
                    <div className="text-base font-bold text-rose-400">
                      {(srum.bytesSent / 1048576).toFixed(2)} MB
                    </div>
                    <div className="text-[10px] text-slate-400">Network Bytes Sent (Exfil)</div>
                  </div>

                  <div className="bg-slate-900 p-2 rounded border border-slate-800">
                    <div className="text-base font-bold text-indigo-400">
                      {(srum.foregroundCpuMs / 1000).toFixed(1)}s
                    </div>
                    <div className="text-[10px] text-slate-400">Foreground CPU Runtime</div>
                  </div>
                </div>

                <div className="text-[11px] font-mono text-slate-500 text-right">
                  Last Activity: {srum.lastObservedUtc}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
