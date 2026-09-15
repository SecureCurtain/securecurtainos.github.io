// jb7572_2026-09-04: Volume Shadow Copy (VSS) Explorer & vshadowmount Parser
import React, { useState } from 'react';
import { 
  VssSnapshotEntry, 
  VssSnapshotFile,
  MOCK_VSS_SNAPSHOTS 
} from '../../../services/forensicsService';
import { 
  History, 
  Layers, 
  HardDrive, 
  FolderCheck, 
  Download, 
  Eye, 
  Terminal, 
  Search, 
  AlertTriangle, 
  ShieldCheck, 
  FileText, 
  Clock, 
  Copy, 
  CheckCircle2, 
  RefreshCw,
  FolderOpen
} from 'lucide-react';

interface VssShadowCopiesTabProps {
  onNotify: (title: string, message: string) => void;
}

export const VssShadowCopiesTab: React.FC<VssShadowCopiesTabProps> = ({ onNotify }) => {
  const [snapshots, setSnapshots] = useState<VssSnapshotEntry[]>(MOCK_VSS_SNAPSHOTS);
  const [selectedSnapshotId, setSelectedSnapshotId] = useState<string>(MOCK_VSS_SNAPSHOTS[0].id);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [isMounting, setIsMounting] = useState(false);
  const [selectedFile, setSelectedFile] = useState<VssSnapshotFile | null>(null);
  const [copiedText, setCopiedText] = useState<string | null>(null);

  const activeSnapshot = snapshots.find(s => s.id === selectedSnapshotId) || snapshots[0];

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(label);
    setTimeout(() => setCopiedText(null), 2000);
    onNotify('Copied to Clipboard', `Copied ${label}: ${text}`);
  };

  const handleToggleMount = (snapshotId: string) => {
    setIsMounting(true);
    const snap = snapshots.find(s => s.id === snapshotId);
    if (!snap) return;

    setTimeout(() => {
      setIsMounting(false);
      const updated = snapshots.map(s => {
        if (s.id === snapshotId) {
          const nextState = !s.isMounted;
          return {
            ...s,
            isMounted: nextState,
            mountPoint: nextState ? `/mnt/vss/vss${s.setIndex}` : undefined
          };
        }
        return s;
      });
      setSnapshots(updated);

      if (!snap.isMounted) {
        onNotify(
          'VSS Virtual Volume Mounted',
          `Successfully mounted ${snap.deviceObject} to /mnt/vss/vss${snap.setIndex} (Read-Only fuse vshadowmount)`
        );
      } else {
        onNotify(
          'VSS Volume Unmounted',
          `Detached virtual mount point for Snapshot ${snap.setIndex}`
        );
      }
    }, 600);
  };

  const handleExportFile = (file: VssSnapshotFile) => {
    const dest = `/mnt/forensic_vault/VSS_EXTRACT/vss${activeSnapshot.setIndex}/${file.name}`;
    const updated = snapshots.map(s => {
      if (s.id === activeSnapshot.id) {
        return {
          ...s,
          files: s.files.map(f => f.relativePath === file.relativePath ? { ...f, extractedToVault: dest } : f)
        };
      }
      return s;
    });
    setSnapshots(updated);
    onNotify('Forensic Artifact Extracted', `Extracted ${file.name} from Volume Shadow Copy into ${dest}`);
  };

  const filteredFiles = activeSnapshot.files.filter(f => {
    const matchesSearch = f.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          f.relativePath.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'ALL' || f.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-5 text-slate-200">
      {/* Header Info Banner */}
      <div className="p-4 rounded-xl bg-gradient-to-r from-blue-950/40 via-indigo-950/30 to-purple-950/20 border border-blue-900/40 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 rounded-lg bg-blue-500/20 border border-blue-400/30 text-blue-400">
            <History className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              Volume Shadow Copy Service (VSS) & vshadowmount Explorer
              <span className="px-2 py-0.5 text-[10px] rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30">
                libvshadow / vssadmin
              </span>
            </h3>
            <p className="text-xs text-slate-300 mt-0.5">
              Mount, inspect, and extract point-in-time differential snapshots (Copy-on-Write) from raw/E01 NTFS images to recover deleted or locked historical files.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="text-right font-mono text-[11px] text-slate-400">
            <div>Target: <strong className="text-white">C: Partition (NTFS)</strong></div>
            <div>Snapshots Discovered: <strong className="text-emerald-400">{snapshots.length} Sets</strong></div>
          </div>
        </div>
      </div>

      {/* Main Grid: Snapshots List (Left) and Files / Diff View (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left Column: Shadow Copy Snapshots */}
        <div className="space-y-3">
          <div className="flex items-center justify-between pb-1">
            <div className="flex items-center space-x-2 text-xs font-semibold text-white">
              <Layers className="w-4 h-4 text-blue-400" />
              <span>Snapshot Sets Available</span>
            </div>
            <span className="text-[11px] text-slate-400 font-mono">vshadowinfo</span>
          </div>

          <div className="space-y-2.5">
            {snapshots.map(snap => {
              const isSelected = snap.id === activeSnapshot.id;
              return (
                <div
                  key={snap.id}
                  onClick={() => setSelectedSnapshotId(snap.id)}
                  className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-[#12192a] border-blue-500/60 shadow-lg shadow-blue-500/10 ring-1 ring-blue-500/40'
                      : 'bg-[#0a0e17] border-slate-800/80 hover:bg-[#0e1422] hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <span className={`w-2 h-2 rounded-full ${snap.isMounted ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'}`} />
                      <span className="text-xs font-bold text-white">Snapshot Set #{snap.setIndex}</span>
                    </div>
                    <span className={`text-[10px] px-2 py-0.5 rounded font-mono font-medium ${
                      snap.isMounted 
                        ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30' 
                        : 'bg-slate-800 text-slate-400 border border-slate-700'
                    }`}>
                      {snap.isMounted ? 'MOUNTED RO' : 'UNMOUNTED'}
                    </span>
                  </div>

                  <div className="text-[11px] space-y-1 font-mono text-slate-400">
                    <div className="flex items-center gap-1.5 text-slate-300">
                      <Clock className="w-3.5 h-3.5 text-blue-400" />
                      <span>{snap.creationTimeUtc}</span>
                    </div>
                    <div className="truncate text-slate-400" title={snap.deviceObject}>
                      {snap.deviceObject}
                    </div>
                    <div className="flex justify-between text-[10px] pt-1 text-slate-400">
                      <span>Diff Size: {(snap.usedSizeBytes / (1024 * 1024 * 1024)).toFixed(1)} GB</span>
                      <span className="text-cyan-400">{snap.files.length} indexed files</span>
                    </div>
                  </div>

                  <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex items-center justify-between">
                    <span className="text-[10px] text-slate-400 font-mono truncate max-w-[140px]">
                      {snap.mountPoint ? snap.mountPoint : 'Ready to mount'}
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToggleMount(snap.id);
                      }}
                      disabled={isMounting}
                      className={`px-2.5 py-1 text-[11px] rounded font-semibold transition-all flex items-center gap-1 ${
                        snap.isMounted
                          ? 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700'
                          : 'bg-blue-600 hover:bg-blue-500 text-white shadow-sm'
                      }`}
                    >
                      {isMounting ? (
                        <RefreshCw className="w-3 h-3 animate-spin" />
                      ) : (
                        <FolderCheck className="w-3 h-3" />
                      )}
                      <span>{snap.isMounted ? 'Unmount' : 'Mount VSS'}</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Quick CLI Equivalent Snippet */}
          <div className="p-3 rounded-lg bg-[#070a12] border border-slate-800/90 text-[11px] font-mono space-y-1.5 text-slate-400">
            <div className="text-slate-300 flex items-center gap-1">
              <Terminal className="w-3.5 h-3.5 text-amber-400" />
              <span>Terminal Syntax:</span>
            </div>
            <code className="text-amber-300 block bg-black/50 p-1.5 rounded break-all select-all">
              vshadowmount /mnt/forensic_vault/evidence.raw /mnt/vss
            </code>
            <code className="text-slate-400 block bg-black/50 p-1.5 rounded break-all select-all">
              vssadmin list shadows /for=C:
            </code>
          </div>
        </div>

        {/* Right 2 Columns: Snapshot Files & Differential Analyzer */}
        <div className="lg:col-span-2 space-y-4">
          <div className="p-4 rounded-xl bg-[#0a0e17] border border-slate-800/90 space-y-3.5">
            {/* Snapshot Metadata Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-800/80 gap-2">
              <div>
                <h4 className="text-xs font-bold text-white flex items-center gap-2">
                  <span>{activeSnapshot.volumeName}</span>
                  <span className="text-[10px] text-slate-400 font-mono">({activeSnapshot.snapshotId})</span>
                </h4>
                <p className="text-[11px] text-slate-400 mt-0.5">{activeSnapshot.notes}</p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleCopy(activeSnapshot.deviceObject, 'Device Object')}
                  className="px-2.5 py-1 text-[11px] rounded bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 font-mono flex items-center gap-1 transition-all"
                >
                  <Copy className="w-3 h-3" />
                  <span>{copiedText === 'Device Object' ? 'Copied!' : 'Copy Path'}</span>
                </button>
              </div>
            </div>

            {/* Filter and Search Bar */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
              <div className="relative w-full sm:w-64">
                <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Filter snapshot files (SAM, logs...)"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-white font-mono text-xs focus:border-blue-500 outline-none"
                />
              </div>

              <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto text-[11px]">
                {['ALL', 'REGISTRY', 'EVENT_LOG', 'DATABASE', 'EXECUTABLE', 'DOCUMENT'].map(cat => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-2.5 py-1 rounded transition-all font-mono whitespace-nowrap ${
                      selectedCategory === cat
                        ? 'bg-blue-600 text-white font-bold'
                        : 'bg-slate-800/80 text-slate-400 hover:text-white'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Files List Table */}
            <div className="overflow-x-auto border border-slate-800/80 rounded-lg">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-[#0e1320] text-slate-400 border-b border-slate-800 text-[11px]">
                  <tr>
                    <th className="p-2.5 font-semibold">Artifact Name & Path</th>
                    <th className="p-2.5 font-semibold">Category</th>
                    <th className="p-2.5 font-semibold">Size</th>
                    <th className="p-2.5 font-semibold">Diff vs Live System</th>
                    <th className="p-2.5 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-[11px]">
                  {filteredFiles.map(file => {
                    const isSelected = selectedFile?.relativePath === file.relativePath;
                    return (
                      <tr 
                        key={file.relativePath}
                        onClick={() => setSelectedFile(file)}
                        className={`hover:bg-slate-800/40 cursor-pointer transition-colors ${
                          isSelected ? 'bg-blue-950/30' : ''
                        }`}
                      >
                        <td className="p-2.5">
                          <div className="flex items-center space-x-2">
                            <FileText className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                            <div>
                              <div className="font-bold text-white">{file.name}</div>
                              <div className="text-[10px] text-slate-400">{file.relativePath}</div>
                            </div>
                          </div>
                        </td>

                        <td className="p-2.5">
                          <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700 text-[10px]">
                            {file.category}
                          </span>
                        </td>

                        <td className="p-2.5 text-slate-300">
                          {(file.sizeBytes / 1024).toFixed(1)} KB
                        </td>

                        <td className="p-2.5">
                          {file.diffStatus === 'DELETED_FROM_LIVE' && (
                            <span className="px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/40 text-[10px] flex items-center gap-1 w-fit">
                              <AlertTriangle className="w-3 h-3 text-rose-400" />
                              <span>DELETED ON LIVE</span>
                            </span>
                          )}
                          {file.diffStatus === 'REVISED_SINCE_SNAPSHOT' && (
                            <span className="px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 text-[10px] flex items-center gap-1 w-fit">
                              <History className="w-3 h-3 text-cyan-400" />
                              <span>HISTORIC REVISION</span>
                            </span>
                          )}
                          {file.diffStatus === 'SUSPICIOUS_MALWARE' && (
                            <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] flex items-center gap-1 w-fit">
                              <AlertTriangle className="w-3 h-3 text-amber-400" />
                              <span>PRESERVED MALWARE</span>
                            </span>
                          )}
                          {file.diffStatus === 'UNMODIFIED' && (
                            <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] flex items-center gap-1 w-fit">
                              <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                              <span>PRISTINE MATCH</span>
                            </span>
                          )}
                        </td>

                        <td className="p-2.5 text-right">
                          {file.extractedToVault ? (
                            <span className="text-[10px] text-emerald-400 font-semibold flex items-center justify-end gap-1">
                              <CheckCircle2 className="w-3 h-3" />
                              <span>Extracted</span>
                            </span>
                          ) : (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleExportFile(file);
                              }}
                              className="px-2 py-0.5 rounded bg-blue-600/80 hover:bg-blue-600 text-white text-[10px] transition-all flex items-center gap-1 ml-auto"
                            >
                              <Download className="w-3 h-3" />
                              <span>Carve to Vault</span>
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Selected File Forensic Breakdown Drawer */}
            {selectedFile && (
              <div className="p-3 rounded-lg bg-[#070a12] border border-slate-800 text-xs space-y-2">
                <div className="flex items-center justify-between text-slate-300 border-b border-slate-800/80 pb-1.5">
                  <span className="font-bold text-white flex items-center gap-1.5">
                    <Eye className="w-3.5 h-3.5 text-blue-400" />
                    <span>Selected Artifact: {selectedFile.name}</span>
                  </span>
                  <span className="text-[10px] text-slate-400">
                    Source: {activeSnapshot.deviceObject}\\{selectedFile.relativePath}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[11px] font-mono text-slate-400">
                  <div>Relative Path: <strong className="text-white">{selectedFile.relativePath}</strong></div>
                  <div>Size: <strong className="text-white">{selectedFile.sizeBytes.toLocaleString()} bytes</strong></div>
                  <div>Diff Anomaly: <strong className="text-amber-400">{selectedFile.diffStatus}</strong></div>
                  <div>
                    Vault Status: {selectedFile.extractedToVault ? (
                      <strong className="text-emerald-400">{selectedFile.extractedToVault}</strong>
                    ) : (
                      <span className="text-slate-500">Not yet carved</span>
                    )}
                  </div>
                </div>

                {selectedFile.diffStatus === 'DELETED_FROM_LIVE' && (
                  <div className="p-2 rounded bg-rose-950/30 border border-rose-900/50 text-[11px] text-rose-300 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    <span>
                      Critical Evidence: This file was intentionally wiped or shredded from the live filesystem during anti-forensics activity, but remains 100% intact in this Volume Shadow Copy snapshot.
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
