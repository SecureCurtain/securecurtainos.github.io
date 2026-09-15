// jb7572_2026-08-24: Windows Task Manager & Resource Monitor GUI Component
import React, { useState, useEffect } from 'react';
import { OSProcess, SystemMetrics, MetricHistoryPoint } from '../../types';
import { systemProcessService } from '../../services/systemProcessService';
import { 
  Activity, 
  Cpu, 
  HardDrive, 
  Wifi, 
  Server, 
  XOctagon, 
  Plus, 
  Search, 
  RefreshCw, 
  Layers, 
  ShieldCheck, 
  Zap, 
  Clock, 
  CheckCircle2, 
  AlertCircle,
  Filter,
  BarChart2,
  Terminal,
  FileCode
} from 'lucide-react';

interface TaskManagerGUIProps {
  onRunCliCommand?: (cmd: string) => void;
}

// jb7572_2026-08-24: Main Task Manager GUI with tabbed real-time performance & process inspector
export const TaskManagerGUI: React.FC<TaskManagerGUIProps> = ({ onRunCliCommand }) => {
  const [processes, setProcesses] = useState<OSProcess[]>([]);
  const [metrics, setMetrics] = useState<SystemMetrics>(systemProcessService.getSystemMetrics());
  const [history, setHistory] = useState<MetricHistoryPoint[]>([]);
  const [activeSubTab, setActiveSubTab] = useState<'processes' | 'performance' | 'resource_monitor'>('processes');
  const [selectedPid, setSelectedPid] = useState<number | null>(620);
  const [searchFilter, setSearchFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<'cpu' | 'mem' | 'pid' | 'name'>('cpu');
  const [sortAsc, setSortAsc] = useState(false);
  const [actionNotice, setActionNotice] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [showRunModal, setShowRunModal] = useState(false);
  const [newProcessName, setNewProcessName] = useState('');

  // jb7572_2026-08-24: Telemetry tick interval
  useEffect(() => {
    setProcesses(systemProcessService.getProcesses());
    setHistory(systemProcessService.getMetricsHistory());

    const interval = setInterval(() => {
      const { metrics: m, history: h } = systemProcessService.tickMetrics();
      setMetrics(m);
      setHistory(h);
      setProcesses(systemProcessService.getProcesses());
    }, 1500);

    return () => clearInterval(interval);
  }, []);

  // jb7572_2026-08-24: Terminate process handler
  const handleEndTask = () => {
    if (selectedPid === null) return;
    const res = systemProcessService.killProcess(selectedPid);
    if (res.success) {
      setActionNotice({ type: 'success', message: res.message });
      setProcesses(systemProcessService.getProcesses());
      setSelectedPid(null);
    } else {
      setActionNotice({ type: 'error', message: res.message });
    }
    setTimeout(() => setActionNotice(null), 4000);
  };

  // jb7572_2026-08-24: Spawn new process handler
  const handleSpawnProcess = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProcessName.trim()) return;
    const proc = systemProcessService.spawnProcess(newProcessName, `/sys/bin/${newProcessName}`);
    setProcesses(systemProcessService.getProcesses());
    setSelectedPid(proc.pid);
    setActionNotice({ type: 'success', message: `Spawned new process "${proc.name}" [PID ${proc.pid}].` });
    setNewProcessName('');
    setShowRunModal(false);
    setTimeout(() => setActionNotice(null), 4000);
  };

  // jb7572_2026-08-24: Process sorting & filtering
  const filteredProcesses = processes
    .filter(p => {
      const matchSearch = p.name.toLowerCase().includes(searchFilter.toLowerCase()) || 
                          p.commandLine.toLowerCase().includes(searchFilter.toLowerCase()) ||
                          p.pid.toString().includes(searchFilter);
      const matchCat = categoryFilter === 'ALL' || p.category === categoryFilter;
      return matchSearch && matchCat;
    })
    .sort((a, b) => {
      let comparison = 0;
      if (sortBy === 'cpu') comparison = b.cpuPercent - a.cpuPercent;
      else if (sortBy === 'mem') comparison = b.memBytes - a.memBytes;
      else if (sortBy === 'pid') comparison = a.pid - b.pid;
      else if (sortBy === 'name') comparison = a.name.localeCompare(b.name);
      return sortAsc ? -comparison : comparison;
    });

  const selectedProcess = processes.find(p => p.pid === selectedPid);

  return (
    <div className="space-y-4">
      {/* Action Notification Banner */}
      {actionNotice && (
        <div className={`p-3 rounded-lg border text-xs flex items-center justify-between transition-all ${
          actionNotice.type === 'success' 
            ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300' 
            : 'bg-rose-950/40 border-rose-500/40 text-rose-300'
        }`}>
          <div className="flex items-center gap-2">
            {actionNotice.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            )}
            <span>{actionNotice.message}</span>
          </div>
          <button 
            onClick={() => setActionNotice(null)}
            className="text-[11px] opacity-70 hover:opacity-100 underline ml-2"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Top Header & Sub-tab navigation */}
      <div className="bg-[#0f0f0f] border border-[#222] rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-[#171717] border border-[#2a2a2a] text-[#c4b5fd] rounded-xl">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-[#f5f5f5]">
                System Performance & Process Monitor (Task Manager)
              </h2>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-950/60 text-emerald-300 border border-emerald-700/40 font-mono">
                Ring 0 Telemetry Active
              </span>
            </div>
            <p className="text-xs text-[#737373]">
              Real-time CPU cores, memory page tables, disk IOPS & thread accounting
            </p>
          </div>
        </div>

        {/* Sub-tab switcher */}
        <div className="flex items-center gap-1.5 bg-[#141414] p-1 rounded-lg border border-[#262626]">
          <button
            onClick={() => setActiveSubTab('processes')}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all flex items-center gap-1.5 ${
              activeSubTab === 'processes'
                ? 'bg-[#262626] text-[#f5f5f5] shadow-xs'
                : 'text-[#888] hover:text-[#ddd]'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Processes ({processes.length})</span>
          </button>

          <button
            onClick={() => setActiveSubTab('performance')}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all flex items-center gap-1.5 ${
              activeSubTab === 'performance'
                ? 'bg-[#262626] text-[#f5f5f5] shadow-xs'
                : 'text-[#888] hover:text-[#ddd]'
            }`}
          >
            <BarChart2 className="w-3.5 h-3.5" />
            <span>Performance Graphs</span>
          </button>

          <button
            onClick={() => setActiveSubTab('resource_monitor')}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all flex items-center gap-1.5 ${
              activeSubTab === 'resource_monitor'
                ? 'bg-[#262626] text-[#f5f5f5] shadow-xs'
                : 'text-[#888] hover:text-[#ddd]'
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            <span>Resource Monitor</span>
          </button>
        </div>
      </div>

      {/* Metric Quick Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {/* CPU */}
        <div className="bg-[#0f0f0f] border border-[#222] rounded-xl p-3.5 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-[#888] mb-1">
            <span className="flex items-center gap-1.5 font-medium">
              <Cpu className="w-3.5 h-3.5 text-blue-400" /> CPU Usage
            </span>
            <span className="font-mono text-[#a3a3a3]">4 Cores (x86_64)</span>
          </div>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-xl font-bold font-mono text-[#f5f5f5]">
              {metrics.cpuTotalPercent.toFixed(1)}%
            </span>
            <span className="text-xs text-[#737373] font-mono">
              {metrics.threadCount} Threads
            </span>
          </div>
          <div className="w-full bg-[#1c1c1c] rounded-full h-1.5 mt-2 overflow-hidden">
            <div 
              className="bg-blue-500 h-full transition-all duration-300"
              style={{ width: `${Math.min(100, metrics.cpuTotalPercent)}%` }}
            />
          </div>
        </div>

        {/* Memory */}
        <div className="bg-[#0f0f0f] border border-[#222] rounded-xl p-3.5 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-[#888] mb-1">
            <span className="flex items-center gap-1.5 font-medium">
              <Server className="w-3.5 h-3.5 text-purple-400" /> Physical Memory
            </span>
            <span className="font-mono text-[#a3a3a3]">16.0 GB Total</span>
          </div>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-xl font-bold font-mono text-[#f5f5f5]">
              {(metrics.memUsedBytes / (1024 * 1024 * 1024)).toFixed(2)} GB
            </span>
            <span className="text-xs text-[#737373] font-mono">
              {((metrics.memUsedBytes / metrics.memTotalBytes) * 100).toFixed(1)}%
            </span>
          </div>
          <div className="w-full bg-[#1c1c1c] rounded-full h-1.5 mt-2 overflow-hidden">
            <div 
              className="bg-purple-500 h-full transition-all duration-300"
              style={{ width: `${(metrics.memUsedBytes / metrics.memTotalBytes) * 100}%` }}
            />
          </div>
        </div>

        {/* Disk NVMe */}
        <div className="bg-[#0f0f0f] border border-[#222] rounded-xl p-3.5 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-[#888] mb-1">
            <span className="flex items-center gap-1.5 font-medium">
              <HardDrive className="w-3.5 h-3.5 text-emerald-400" /> NVMe PCIe Disk
            </span>
            <span className="font-mono text-[#a3a3a3]">Active Time</span>
          </div>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-xl font-bold font-mono text-[#f5f5f5]">
              {metrics.diskActivePercent}%
            </span>
            <span className="text-xs text-[#737373] font-mono">
              R: {metrics.diskReadRateKb} KB/s
            </span>
          </div>
          <div className="w-full bg-[#1c1c1c] rounded-full h-1.5 mt-2 overflow-hidden">
            <div 
              className="bg-emerald-500 h-full transition-all duration-300"
              style={{ width: `${Math.min(100, metrics.diskActivePercent)}%` }}
            />
          </div>
        </div>

        {/* Network lwIP */}
        <div className="bg-[#0f0f0f] border border-[#222] rounded-xl p-3.5 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-[#888] mb-1">
            <span className="flex items-center gap-1.5 font-medium">
              <Wifi className="w-3.5 h-3.5 text-amber-400" /> e1000 Ethernet
            </span>
            <span className="font-mono text-[#a3a3a3]">lwIP Throughput</span>
          </div>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-xl font-bold font-mono text-[#f5f5f5]">
              {(metrics.netRxRateKb + metrics.netTxRateKb)} KB/s
            </span>
            <span className="text-xs text-[#737373] font-mono">
              RX: {metrics.netRxRateKb} KB/s
            </span>
          </div>
          <div className="w-full bg-[#1c1c1c] rounded-full h-1.5 mt-2 overflow-hidden">
            <div 
              className="bg-amber-500 h-full transition-all duration-300"
              style={{ width: `${Math.min(100, (metrics.netRxRateKb + metrics.netTxRateKb) * 0.5)}%` }}
            />
          </div>
        </div>
      </div>

      {/* Tab 1: Processes View (Windows Taskmgr / Tasklist style) */}
      {activeSubTab === 'processes' && (
        <div className="bg-[#0f0f0f] border border-[#222] rounded-xl overflow-hidden shadow-xl">
          {/* Controls bar */}
          <div className="p-3 bg-[#141414] border-b border-[#222] flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 flex-1 min-w-[240px]">
              <div className="relative w-full max-w-xs">
                <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-[#666]" />
                <input
                  type="text"
                  placeholder="Filter process name, PID, command..."
                  value={searchFilter}
                  onChange={(e) => setSearchFilter(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 bg-[#0a0a0a] border border-[#262626] rounded-lg text-xs text-[#e5e5e5] placeholder-[#555] focus:outline-none focus:border-[#c4b5fd]"
                />
              </div>

              {/* Category Filter */}
              <div className="flex items-center gap-1">
                {['ALL', 'KERNEL', 'DRIVER', 'SUBSYSTEM', 'USER_APP'].map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setCategoryFilter(cat)}
                    className={`px-2 py-1 rounded text-[10px] font-mono font-medium transition-all ${
                      categoryFilter === cat
                        ? 'bg-[#2a2a2a] text-[#f5f5f5]'
                        : 'text-[#777] hover:text-[#ccc] hover:bg-[#1a1a1a]'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowRunModal(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-[#1f1f1f] hover:bg-[#2a2a2a] text-[#f5f5f5] rounded-lg text-xs font-medium border border-[#333] transition-all"
              >
                <Plus className="w-3.5 h-3.5 text-emerald-400" />
                <span>Run New Task</span>
              </button>

              <button
                onClick={handleEndTask}
                disabled={selectedPid === null}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/40 rounded-lg text-xs font-medium transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <XOctagon className="w-3.5 h-3.5 text-rose-400" />
                <span>End Task {selectedPid !== null ? `(PID ${selectedPid})` : ''}</span>
              </button>
            </div>
          </div>

          {/* Process Table */}
          <div className="overflow-x-auto max-h-[480px] custom-scrollbar">
            <table className="w-full text-left text-xs border-collapse font-sans">
              <thead className="bg-[#171717] text-[#888] font-mono text-[11px] sticky top-0 z-10 border-b border-[#222]">
                <tr>
                  <th 
                    className="py-2.5 px-4 cursor-pointer hover:text-[#f5f5f5]"
                    onClick={() => { setSortBy('pid'); setSortAsc(!sortAsc); }}
                  >
                    PID {sortBy === 'pid' ? (sortAsc ? '▲' : '▼') : ''}
                  </th>
                  <th 
                    className="py-2.5 px-4 cursor-pointer hover:text-[#f5f5f5]"
                    onClick={() => { setSortBy('name'); setSortAsc(!sortAsc); }}
                  >
                    Process Name & Subsystem {sortBy === 'name' ? (sortAsc ? '▲' : '▼') : ''}
                  </th>
                  <th className="py-2.5 px-4">User</th>
                  <th className="py-2.5 px-4">Status</th>
                  <th 
                    className="py-2.5 px-4 cursor-pointer hover:text-[#f5f5f5] text-right"
                    onClick={() => { setSortBy('cpu'); setSortAsc(!sortAsc); }}
                  >
                    CPU % {sortBy === 'cpu' ? (sortAsc ? '▲' : '▼') : ''}
                  </th>
                  <th 
                    className="py-2.5 px-4 cursor-pointer hover:text-[#f5f5f5] text-right"
                    onClick={() => { setSortBy('mem'); setSortAsc(!sortAsc); }}
                  >
                    Memory {sortBy === 'mem' ? (sortAsc ? '▲' : '▼') : ''}
                  </th>
                  <th className="py-2.5 px-4 text-right">Disk I/O</th>
                  <th className="py-2.5 px-4 text-right">Network</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1a1a1a]">
                {filteredProcesses.map((proc) => {
                  const isSelected = selectedPid === proc.pid;
                  return (
                    <tr
                      key={proc.pid}
                      onClick={() => setSelectedPid(proc.pid)}
                      className={`cursor-pointer transition-colors ${
                        isSelected
                          ? 'bg-[#1c1a24] text-[#f5f5f5]'
                          : 'hover:bg-[#141414] text-[#d4d4d4]'
                      }`}
                    >
                      <td className="py-2.5 px-4 font-mono font-semibold text-[#c4b5fd]">
                        {proc.pid}
                      </td>
                      <td className="py-2.5 px-4">
                        <div className="flex items-center gap-2">
                          <span className={`text-[9px] px-1.5 py-0.5 rounded font-mono uppercase ${
                            proc.category === 'KERNEL' ? 'bg-purple-950/60 text-purple-300 border border-purple-800/40' :
                            proc.category === 'DRIVER' ? 'bg-blue-950/60 text-blue-300 border border-blue-800/40' :
                            proc.category === 'SUBSYSTEM' ? 'bg-amber-950/60 text-amber-300 border border-amber-800/40' :
                            proc.category === 'DAEMON' ? 'bg-cyan-950/60 text-cyan-300 border border-cyan-800/40' :
                            'bg-emerald-950/60 text-emerald-300 border border-emerald-800/40'
                          }`}>
                            {proc.category}
                          </span>
                          <span className="font-medium text-[#f5f5f5]">{proc.name}</span>
                          <span className="text-[11px] text-[#666] font-mono truncate max-w-[180px]">
                            {proc.commandLine}
                          </span>
                        </div>
                      </td>
                      <td className="py-2.5 px-4 font-mono text-[#888]">{proc.user}</td>
                      <td className="py-2.5 px-4">
                        <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${
                          proc.status === 'RUNNING' ? 'text-emerald-400 bg-emerald-950/40' :
                          proc.status === 'SLEEPING' ? 'text-[#888] bg-[#1a1a1a]' :
                          'text-amber-400 bg-amber-950/40'
                        }`}>
                          {proc.status}
                        </span>
                      </td>
                      <td className="py-2.5 px-4 text-right font-mono font-medium">
                        <span className={proc.cpuPercent > 3 ? 'text-amber-400' : 'text-[#bbb]'}>
                          {proc.cpuPercent.toFixed(1)}%
                        </span>
                      </td>
                      <td className="py-2.5 px-4 text-right font-mono text-[#bbb]">
                        {proc.memFormatted}
                      </td>
                      <td className="py-2.5 px-4 text-right font-mono text-[#888]">
                        {(proc.diskReadKb + proc.diskWriteKb)} KB/s
                      </td>
                      <td className="py-2.5 px-4 text-right font-mono text-[#888]">
                        {(proc.netRxKb + proc.netTxKb)} KB/s
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Selected Process Detail Footer */}
          {selectedProcess && (
            <div className="p-3.5 bg-[#121212] border-t border-[#222] flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-[#1c1c1c] rounded-lg border border-[#2a2a2a] text-[#c4b5fd]">
                  <Cpu className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-[#f5f5f5]">{selectedProcess.name}</span>
                    <span className="font-mono text-[#888]">(PID: {selectedProcess.pid})</span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-[#1f1f1f] text-[#aaa] font-mono">
                      Priority: {selectedProcess.priority}
                    </span>
                  </div>
                  <div className="text-[11px] text-[#666] font-mono mt-0.5">
                    Command: {selectedProcess.commandLine}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => onRunCliCommand && onRunCliCommand(`taskkill /PID ${selectedProcess.pid} /F`)}
                  className="px-3 py-1.5 bg-[#1a1a1a] hover:bg-[#252525] text-xs font-mono text-[#ccc] rounded-lg border border-[#333]"
                >
                  CLI: taskkill {selectedProcess.pid}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Performance Graphs */}
      {activeSubTab === 'performance' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="bg-[#0f0f0f] border border-[#222] rounded-xl p-4 shadow-xl space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Cpu className="w-4 h-4 text-blue-400" />
                <h3 className="text-xs font-bold text-[#f5f5f5]">CPU Utilization History (All Cores)</h3>
              </div>
              <span className="font-mono text-xs font-bold text-blue-400">
                {metrics.cpuTotalPercent.toFixed(1)}% Active
              </span>
            </div>

            <div className="h-44 bg-[#0a0a0a] rounded-lg border border-[#1f1f1f] p-3 flex flex-col justify-between">
              <div className="flex justify-between text-[10px] font-mono text-[#555]">
                <span>100%</span>
                <span>Real-time Ring 0 Tick Counter</span>
              </div>

              <div className="h-28 flex items-end gap-1.5 pt-2">
                {history.map((pt, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1 group relative">
                    <div 
                      className="w-full bg-blue-500/30 hover:bg-blue-400 border-t-2 border-blue-400 rounded-t-xs transition-all"
                      style={{ height: `${Math.max(4, pt.cpu)}%` }}
                    />
                  </div>
                ))}
              </div>

              <div className="flex justify-between text-[10px] font-mono text-[#555]">
                <span>60s ago</span>
                <span>0s (Now)</span>
              </div>
            </div>

            <div className="grid grid-cols-4 gap-2 pt-1">
              {metrics.cpuCores.map((val, idx) => (
                <div key={idx} className="p-2 bg-[#141414] rounded-lg border border-[#222] text-center">
                  <div className="text-[10px] text-[#777] font-mono">Core {idx}</div>
                  <div className="text-xs font-bold font-mono text-[#e5e5e5] mt-0.5">{val}%</div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-[#0f0f0f] border border-[#222] rounded-xl p-4 shadow-xl space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Server className="w-4 h-4 text-purple-400" />
                <h3 className="text-xs font-bold text-[#f5f5f5]">Memory Allocation (PMM / VMM)</h3>
              </div>
              <span className="font-mono text-xs font-bold text-purple-400">
                {(metrics.memUsedBytes / (1024 * 1024 * 1024)).toFixed(2)} / 16.00 GB
              </span>
            </div>

            <div className="h-44 bg-[#0a0a0a] rounded-lg border border-[#1f1f1f] p-3 flex flex-col justify-between">
              <div className="flex justify-between text-[10px] font-mono text-[#555]">
                <span>16.0 GB</span>
                <span>Page Frame Allocation</span>
              </div>

              <div className="h-28 flex items-end gap-1.5 pt-2">
                {history.map((pt, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1">
                    <div 
                      className="w-full bg-purple-500/30 hover:bg-purple-400 border-t-2 border-purple-400 rounded-t-xs transition-all"
                      style={{ height: `${Math.max(4, pt.memory)}%` }}
                    />
                  </div>
                ))}
              </div>

              <div className="flex justify-between text-[10px] font-mono text-[#555]">
                <span>60s ago</span>
                <span>0s (Now)</span>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 pt-1 text-center font-mono text-xs">
              <div className="p-2 bg-[#141414] rounded-lg border border-[#222]">
                <div className="text-[10px] text-[#777]">Committed</div>
                <div className="font-bold text-[#e5e5e5] mt-0.5">{(metrics.memUsedBytes / (1024 * 1024)).toFixed(0)} MB</div>
              </div>
              <div className="p-2 bg-[#141414] rounded-lg border border-[#222]">
                <div className="text-[10px] text-[#777]">Cached / VFS</div>
                <div className="font-bold text-[#e5e5e5] mt-0.5">840 MB</div>
              </div>
              <div className="p-2 bg-[#141414] rounded-lg border border-[#222]">
                <div className="text-[10px] text-[#777]">Kernel Heap</div>
                <div className="font-bold text-[#e5e5e5] mt-0.5">128 MB</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Resource Monitor */}
      {activeSubTab === 'resource_monitor' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="bg-[#0f0f0f] border border-[#222] rounded-xl p-4 shadow-xl space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <HardDrive className="w-4 h-4 text-emerald-400" />
                <h3 className="text-xs font-bold text-[#f5f5f5]">Disk I/O By Process (NVMe Queue 0)</h3>
              </div>
              <span className="font-mono text-xs text-emerald-400 font-bold">
                Total: {metrics.diskReadRateKb + metrics.diskWriteRateKb} KB/s
              </span>
            </div>

            <div className="space-y-2">
              {processes.slice(0, 6).map((p) => (
                <div key={p.pid} className="p-2.5 bg-[#141414] rounded-lg border border-[#222] flex items-center justify-between text-xs">
                  <div>
                    <div className="font-medium text-[#f5f5f5] flex items-center gap-2">
                      <span>{p.name}</span>
                      <span className="text-[10px] font-mono text-[#777]">(PID {p.pid})</span>
                    </div>
                    <div className="text-[10px] font-mono text-[#666]">{p.commandLine}</div>
                  </div>
                  <div className="text-right font-mono text-[11px]">
                    <div className="text-emerald-400">R: {p.diskReadKb} KB/s</div>
                    <div className="text-[#888]">W: {p.diskWriteKb} KB/s</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-[#0f0f0f] border border-[#222] rounded-xl p-4 shadow-xl space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Wifi className="w-4 h-4 text-amber-400" />
                <h3 className="text-xs font-bold text-[#f5f5f5]">Network Connections & Socket Activity (lwIP)</h3>
              </div>
              <span className="font-mono text-xs text-amber-400 font-bold">
                Total: {metrics.netRxRateKb + metrics.netTxRateKb} KB/s
              </span>
            </div>

            <div className="space-y-2">
              {processes.filter(p => p.netRxKb > 0 || p.netTxKb > 0 || p.category === 'DRIVER' || p.category === 'USER_APP').slice(0, 6).map((p) => (
                <div key={p.pid} className="p-2.5 bg-[#141414] rounded-lg border border-[#222] flex items-center justify-between text-xs">
                  <div>
                    <div className="font-medium text-[#f5f5f5] flex items-center gap-2">
                      <span>{p.name}</span>
                      <span className="text-[10px] font-mono text-[#777]">(PID {p.pid})</span>
                    </div>
                    <div className="text-[10px] font-mono text-[#666]">e1000 Interface: eth0</div>
                  </div>
                  <div className="text-right font-mono text-[11px]">
                    <div className="text-amber-400">RX: {p.netRxKb} KB/s</div>
                    <div className="text-[#888]">TX: {p.netTxKb} KB/s</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Spawn New Process Modal */}
      {showRunModal && (
        <div className="fixed inset-0 z-50 bg-[#000]/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#0f0f0f] rounded-xl border border-[#333] shadow-2xl max-w-md w-full p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-[#222] pb-3">
              <div className="flex items-center gap-2">
                <Terminal className="w-4 h-4 text-[#c4b5fd]" />
                <h3 className="text-sm font-bold text-[#f5f5f5]">Create New Task</h3>
              </div>
              <button 
                onClick={() => setShowRunModal(false)}
                className="text-[#777] hover:text-[#eee]"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-[#888]">
              Type the name of a program, folder, or document to execute in your x86_64 environment.
            </p>

            <form onSubmit={handleSpawnProcess} className="space-y-4">
              <div>
                <label className="block text-[11px] font-mono text-[#aaa] mb-1.5">
                  Binary Path / Command:
                </label>
                <input
                  type="text"
                  placeholder="e.g. btop, gparted, calc.exe, ncdu"
                  value={newProcessName}
                  onChange={(e) => setNewProcessName(e.target.value)}
                  autoFocus
                  className="w-full px-3 py-2 bg-[#050505] border border-[#2a2a2a] rounded-lg text-xs text-[#f5f5f5] font-mono focus:outline-none focus:border-[#c4b5fd]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowRunModal(false)}
                  className="px-3.5 py-1.5 bg-[#171717] hover:bg-[#222] text-[#ccc] rounded-lg text-xs font-medium border border-[#2a2a2a]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold shadow-lg shadow-blue-500/20"
                >
                  Launch Process
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
