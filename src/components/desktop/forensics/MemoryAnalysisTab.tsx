// jb7572_2026-09-01: Volatility 3 Memory Forensics & MemProcFS Virtual Filesystem Explorer
import React, { useState } from 'react';
import { 
  VolatilityProcessEntry, 
  MemProcFsNode,
  MOCK_VOLATILITY_PROCESSES, 
  MOCK_MEMPROCFS_NODES 
} from '../../../services/forensicsService';
import { 
  Cpu, 
  FolderTree, 
  Search, 
  ShieldAlert, 
  ShieldCheck, 
  AlertTriangle, 
  Terminal, 
  Network, 
  Layers, 
  FileCode, 
  HardDrive, 
  ExternalLink,
  Code2,
  RefreshCw,
  Folder,
  CheckCircle2
} from 'lucide-react';

interface MemoryAnalysisTabProps {
  onNotify: (title: string, message: string) => void;
}

export const MemoryAnalysisTab: React.FC<MemoryAnalysisTabProps> = ({ onNotify }) => {
  const [activeSubMode, setActiveSubMode] = useState<'VOLATILITY_3' | 'MEMPROCFS_VFS'>('VOLATILITY_3');
  const [selectedPlugin, setSelectedPlugin] = useState<'windows.pslist' | 'windows.malfind' | 'windows.netscan' | 'windows.pstree'>('windows.malfind');
  const [processList, setProcessList] = useState<VolatilityProcessEntry[]>(MOCK_VOLATILITY_PROCESSES);
  const [vfsNodes, setVfsNodes] = useState<MemProcFsNode[]>(MOCK_MEMPROCFS_NODES);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPid, setSelectedPid] = useState<number | null>(3840);
  const [isScanning, setIsScanning] = useState(false);

  const selectedProcess = processList.find(p => p.pid === selectedPid) || processList[0];

  const handleRunPlugin = (plugin: any) => {
    setSelectedPlugin(plugin);
    setIsScanning(true);
    onNotify('Volatility 3 Running', `Executing plugin ${plugin} on physical RAM dump...`);
    setTimeout(() => {
      setIsScanning(false);
      onNotify('Volatility 3 Scan Complete', `Plugin ${plugin} completed successfully.`);
    }, 600);
  };

  const filteredProcesses = processList.filter(p => {
    if (!searchTerm) return true;
    const match = p.imageFileName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                  p.pid.toString().includes(searchTerm) ||
                  p.commandLine.toLowerCase().includes(searchTerm.toLowerCase());
    return match;
  });

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-lg">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="p-2 bg-purple-500/20 text-purple-400 rounded-lg">
                <Cpu className="w-5 h-5" />
              </span>
              <h2 className="text-xl font-bold text-slate-100">Memory Forensics: Volatility 3 & MemProcFS</h2>
              <span className="px-2 py-0.5 text-xs font-semibold bg-purple-500/20 text-purple-400 border border-purple-500/30 rounded-full">
                Kernel Memory Dissector & VFS Mount
              </span>
            </div>
            <p className="text-xs text-slate-400 max-w-2xl">
              Inspect active process hierarchies, unbacked executable VAD allocations, stealth DLL injections (Malfind), established network sockets, and mount volatile memory directly as a virtual POSIX filesystem.
            </p>
          </div>

          {/* Sub-mode Toggle */}
          <div className="flex items-center bg-slate-950 p-1 rounded-lg border border-slate-800">
            <button
              onClick={() => setActiveSubMode('VOLATILITY_3')}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                activeSubMode === 'VOLATILITY_3'
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Volatility 3 Framework
            </button>
            <button
              onClick={() => setActiveSubMode('MEMPROCFS_VFS')}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                activeSubMode === 'MEMPROCFS_VFS'
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              MemProcFS VFS Mount
            </button>
          </div>
        </div>
      </div>

      {activeSubMode === 'VOLATILITY_3' ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Plugin Toolbar & Process Explorer */}
          <div className="lg:col-span-7 space-y-4">
            <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 space-y-4">
              {/* Plugin Select Buttons */}
              <div className="flex flex-wrap gap-2">
                {[
                  { id: 'windows.malfind', label: 'windows.malfind (Injection)', desc: 'Detects stealth hollows & code injection' },
                  { id: 'windows.pslist', label: 'windows.pslist (Processes)', desc: 'Full active process table' },
                  { id: 'windows.pstree', label: 'windows.pstree (Hierarchy)', desc: 'Parent-child process tree' },
                  { id: 'windows.netscan', label: 'windows.netscan (Sockets)', desc: 'Active & closed TCP/UDP connections' }
                ].map(p => (
                  <button
                    key={p.id}
                    onClick={() => handleRunPlugin(p.id)}
                    className={`px-3 py-2 rounded-lg border text-xs font-mono transition-all ${
                      selectedPlugin === p.id
                        ? 'bg-purple-600/30 border-purple-500 text-white'
                        : 'bg-slate-800/60 border-slate-700/60 text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>

              {/* Search Bar */}
              <div className="relative">
                <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Filter by process name, PID, or command line..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg pl-9 pr-4 py-2 text-xs text-slate-200 focus:outline-none focus:border-purple-500"
                />
              </div>

              {/* Process Table */}
              <div className="border border-slate-800 rounded-lg overflow-hidden max-h-[380px] overflow-y-auto custom-scrollbar">
                <table className="w-full text-left text-xs font-mono">
                  <thead className="bg-slate-950 text-slate-400 sticky top-0 border-b border-slate-800">
                    <tr>
                      <th className="p-2.5">PID</th>
                      <th className="p-2.5">PPID</th>
                      <th className="p-2.5">Image File</th>
                      <th className="p-2.5">Threads</th>
                      <th className="p-2.5">Status / Indicators</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 bg-slate-900/60">
                    {filteredProcesses.map(proc => (
                      <tr
                        key={proc.pid}
                        onClick={() => setSelectedPid(proc.pid)}
                        className={`cursor-pointer transition-all ${
                          selectedPid === proc.pid
                            ? 'bg-purple-950/50 text-white'
                            : 'hover:bg-slate-800/50 text-slate-300'
                        }`}
                      >
                        <td className="p-2.5 font-bold text-slate-100">{proc.pid}</td>
                        <td className="p-2.5 text-slate-400">{proc.ppid}</td>
                        <td className="p-2.5 font-semibold flex items-center gap-1.5">
                          {proc.isSuspicious ? (
                            <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                          ) : (
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                          )}
                          <span className={proc.isSuspicious ? 'text-rose-300' : 'text-slate-200'}>
                            {proc.imageFileName}
                          </span>
                        </td>
                        <td className="p-2.5 text-slate-400">{proc.threads}</td>
                        <td className="p-2.5">
                          {proc.isSuspicious ? (
                            <span className="px-2 py-0.5 text-[10px] bg-rose-500/20 text-rose-300 border border-rose-500/30 rounded">
                              Malfind Injected
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 text-[10px] bg-emerald-500/10 text-emerald-400 rounded">
                              Verified Normal
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Right Column: Selected Process Details & Malfind VAD Hex Dump */}
          <div className="lg:col-span-5 space-y-4">
            {selectedProcess && (
              <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <div>
                    <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                      <Code2 className="w-4 h-4 text-purple-400" />
                      PID {selectedProcess.pid}: {selectedProcess.imageFileName}
                    </h3>
                    <div className="text-[11px] font-mono text-slate-400 mt-0.5">Offset: {selectedProcess.offsetHex}</div>
                  </div>
                  {selectedProcess.isSuspicious && (
                    <span className="px-2.5 py-1 text-xs font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40 rounded-full flex items-center gap-1">
                      <ShieldAlert className="w-3.5 h-3.5" /> High Risk
                    </span>
                  )}
                </div>

                <div className="space-y-2 text-xs">
                  <div>
                    <span className="text-slate-400 text-[11px]">Command Line:</span>
                    <code className="block bg-slate-950 p-2.5 rounded font-mono text-[11px] text-amber-300 border border-slate-800 break-all mt-1">
                      {selectedProcess.commandLine}
                    </code>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-2">
                    <div className="bg-slate-950 p-2.5 rounded border border-slate-800 text-[11px]">
                      <div className="text-slate-400">Created Time</div>
                      <div className="font-mono text-slate-200 mt-0.5">{selectedProcess.createTime}</div>
                    </div>
                    <div className="bg-slate-950 p-2.5 rounded border border-slate-800 text-[11px]">
                      <div className="text-slate-400">Handles & Session</div>
                      <div className="font-mono text-slate-200 mt-0.5">{selectedProcess.handles} handles (Sess: {selectedProcess.session})</div>
                    </div>
                  </div>

                  {selectedProcess.malfindIndicator && (
                    <div className="bg-rose-950/30 border border-rose-800/40 p-3 rounded-lg space-y-1.5 mt-2">
                      <div className="text-xs font-bold text-rose-300 flex items-center gap-1.5">
                        <AlertTriangle className="w-4 h-4" />
                        Malfind Code Injection Indicator
                      </div>
                      <div className="text-[11px] font-mono text-rose-200">
                        {selectedProcess.malfindIndicator}
                      </div>
                      <div className="bg-slate-950 p-2 rounded text-[10px] font-mono text-slate-300 border border-slate-800">
                        4d 5a 90 00 03 00 00 00 ... MZ Header & Reflective Shellcode
                      </div>
                    </div>
                  )}

                  {selectedProcess.openSockets && selectedProcess.openSockets.length > 0 && (
                    <div className="bg-slate-950 border border-slate-800 p-3 rounded-lg space-y-1">
                      <div className="text-[11px] font-semibold text-slate-300 flex items-center gap-1.5">
                        <Network className="w-3.5 h-3.5 text-indigo-400" />
                        Active Outbound Sockets (NetScan)
                      </div>
                      {selectedProcess.openSockets.map((sock, i) => (
                        <div key={i} className="font-mono text-[11px] text-amber-400">
                          {sock}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* MemProcFS VFS View */
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
              <FolderTree className="w-4 h-4 text-purple-400" />
              MemProcFS Virtual Filesystem (<code className="text-purple-300 font-mono text-xs">/mnt/memprocfs/</code>)
            </h3>
            <span className="text-xs font-mono text-emerald-400 bg-emerald-950/40 border border-emerald-800/40 px-2.5 py-1 rounded">
              Status: Mounted (Read-Only)
            </span>
          </div>

          <div className="space-y-2">
            {vfsNodes.map(node => (
              <div key={node.path} className="p-3 bg-slate-950 border border-slate-800 rounded-lg flex items-center justify-between text-xs font-mono">
                <div className="flex items-center gap-2">
                  <Folder className="w-4 h-4 text-purple-400" />
                  <span className="text-slate-200">{node.path}</span>
                </div>
                <div className="flex items-center gap-4 text-slate-400 text-[11px]">
                  <span>{node.description}</span>
                  <span className="bg-slate-900 px-2 py-0.5 rounded border border-slate-800 text-indigo-300">
                    {(node.sizeBytes / 1024).toFixed(1)} KB
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
