// =========================================================================
// SecureCurtain OS - Real-Time Syscall Hooking & eBPF Behavioral Sandbox GUI
// Ring-0 kernel probe telemetry, real-time syscall stream, attack simulation lab
// =========================================================================

import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Shield,
  ShieldAlert,
  ShieldCheck,
  Cpu,
  Activity,
  Terminal,
  Play,
  Pause,
  Trash2,
  Filter,
  Download,
  Code2,
  Settings,
  Database,
  Crosshair,
  AlertTriangle,
  FileCode,
  Flame,
  Zap,
  CheckCircle2,
  XCircle,
  ExternalLink,
  ChevronRight,
  ChevronDown,
  Clock,
  Layers,
  Search,
  Lock,
  Radio,
  Eye,
  RefreshCw
} from 'lucide-react';
import { ebpfSyscallService } from '../../services/ebpfSyscallService';
import {
  EbpfProgram,
  SyscallHookPolicy,
  SyscallEvent,
  EbpfMap,
  SandboxSimulationProfile,
  EbpfEngineStats,
  SyscallEnforcementAction
} from '../../types';

interface EbpfSyscallSandboxGUIProps {
  onRunCliCommand?: (cmd: string) => void;
  onNavigateToQuarantine?: () => void;
  onNavigateToVault?: () => void;
}

export const EbpfSyscallSandboxGUI: React.FC<EbpfSyscallSandboxGUIProps> = ({
  onRunCliCommand,
  onNavigateToQuarantine,
  onNavigateToVault
}) => {
  // Navigation tabs within the eBPF Sandbox Suite
  const [activeTab, setActiveTab] = useState<'stream' | 'simulation' | 'probes' | 'policies' | 'maps'>('stream');

  // Live Service State
  const [events, setEvents] = useState<SyscallEvent[]>(() => ebpfSyscallService.getRecentEvents());
  const [stats, setStats] = useState<EbpfEngineStats>(() => ebpfSyscallService.getStats());
  const [programs, setPrograms] = useState<EbpfProgram[]>(() => ebpfSyscallService.getPrograms());
  const [policies, setPolicies] = useState<SyscallHookPolicy[]>(() => ebpfSyscallService.getPolicies());
  const [maps, setMaps] = useState<EbpfMap[]>(() => ebpfSyscallService.getMaps());
  const [simulationProfiles] = useState<SandboxSimulationProfile[]>(() => ebpfSyscallService.getSimulationProfiles());

  const [isPaused, setIsPaused] = useState<boolean>(() => ebpfSyscallService.isPaused());
  const [selectedEvent, setSelectedEvent] = useState<SyscallEvent | null>(null);
  const [selectedProgram, setSelectedProgram] = useState<EbpfProgram | null>(() => ebpfSyscallService.getPrograms()[0] || null);
  const [selectedMap, setSelectedMap] = useState<EbpfMap | null>(() => ebpfSyscallService.getMaps()[0] || null);

  // Filters for Live Stream
  const [searchFilter, setSearchFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<'ALL' | 'BLOCKED_ONLY' | 'MEMORY' | 'PROCESS' | 'NETWORK' | 'DRIVER'>('ALL');

  // Simulation Lab State
  const [activeSimProfileId, setActiveSimProfileId] = useState<string>('sim_lockbit3');
  const [isSimulating, setIsSimulating] = useState<boolean>(false);
  const [simStepIndex, setSimStepIndex] = useState<number>(-1);
  const [simLog, setSimLog] = useState<SyscallEvent[]>([]);

  // Custom Syscall Injector Form State
  const [customComm, setCustomComm] = useState('exploit_tester');
  const [customPid, setCustomPid] = useState(6540);
  const [customSyscall, setCustomSyscall] = useState('sys_mprotect');
  const [customArgs, setCustomArgs] = useState('addr=0x7fff92a00000, len=65536, prot=PROT_READ|PROT_WRITE|PROT_EXEC');
  const [customRwx, setCustomRwx] = useState(true);
  const [customC2Ip, setCustomC2Ip] = useState('185.220.101.44');

  // Notification Banner
  const [bannerNotice, setBannerNotice] = useState<string | null>(null);
  const bannerTimerRef = useRef<any>(null);
  const isMountedRef = useRef(true);

  const showBanner = (msg: string) => {
    if (!isMountedRef.current) return;
    if (bannerTimerRef.current) clearTimeout(bannerTimerRef.current);
    setBannerNotice(msg);
    bannerTimerRef.current = setTimeout(() => {
      if (isMountedRef.current) setBannerNotice(null);
    }, 4000);
  };

  // Subscriptions to live eBPF telemetry
  useEffect(() => {
    isMountedRef.current = true;

    const unsubEvents = ebpfSyscallService.subscribeEvents((newEvt) => {
      if (isMountedRef.current) {
        setEvents((prev) => [newEvt, ...prev.slice(0, 299)]);
      }
    });

    const unsubStats = ebpfSyscallService.subscribeStats((newStats) => {
      if (isMountedRef.current) {
        setStats(newStats);
      }
    });

    return () => {
      isMountedRef.current = false;
      ebpfSyscallService.abortSimulation();
      if (bannerTimerRef.current) clearTimeout(bannerTimerRef.current);
      unsubEvents();
      unsubStats();
    };
  }, []);

  // Filtered Events
  const filteredEvents = useMemo(() => {
    return events.filter((e) => {
      if (searchFilter) {
        const query = searchFilter.toLowerCase();
        const matches =
          e.syscall.toLowerCase().includes(query) ||
          e.comm.toLowerCase().includes(query) ||
          e.arguments.toLowerCase().includes(query) ||
          String(e.pid).includes(query) ||
          (e.signature && e.signature.toLowerCase().includes(query)) ||
          (e.mitreTechnique && e.mitreTechnique.toLowerCase().includes(query));
        if (!matches) return false;
      }

      if (categoryFilter === 'BLOCKED_ONLY') {
        return e.actionTaken === 'BLOCKED_EPERM' || e.actionTaken === 'KILLED_SIGKILL' || e.actionTaken === 'INTERCEPTED';
      }
      if (categoryFilter === 'MEMORY') {
        return e.syscall.includes('mprotect') || e.syscall.includes('mmap') || e.syscall.includes('memfd');
      }
      if (categoryFilter === 'PROCESS') {
        return e.syscall.includes('ptrace') || e.syscall.includes('execve') || e.syscall.includes('clone');
      }
      if (categoryFilter === 'NETWORK') {
        return e.syscall.includes('connect') || e.syscall.includes('socket') || e.syscall.includes('accept');
      }
      if (categoryFilter === 'DRIVER') {
        return e.syscall.includes('init_module') || e.syscall.includes('ioctl');
      }

      return true;
    });
  }, [events, searchFilter, categoryFilter]);

  const handleToggleStream = () => {
    const paused = ebpfSyscallService.toggleStreamPause();
    setIsPaused(paused);
    showBanner(paused ? 'Ring buffer event stream PAUSED' : 'Ring buffer event stream RESUMED');
  };

  const handleClearStream = () => {
    ebpfSyscallService.clearEvents();
    setEvents([]);
    setSelectedEvent(null);
    showBanner('Kernel ring buffer event backlog cleared');
  };

  const handleExportTraceJson = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(events, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `securecurtain_ebpf_trace_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    showBanner('eBPF trace logs exported to JSON');
  };

  const handleToggleProbe = (progId: string) => {
    ebpfSyscallService.toggleProbe(progId);
    setPrograms(ebpfSyscallService.getPrograms());
    setStats(ebpfSyscallService.getStats());
  };

  const handleUpdatePolicyAction = (polId: string, action: SyscallEnforcementAction) => {
    ebpfSyscallService.updatePolicyAction(polId, action);
    setPolicies(ebpfSyscallService.getPolicies());
    showBanner(`Policy "${polId}" updated to ${action}`);
  };

  const handleTogglePolicy = (polId: string) => {
    ebpfSyscallService.togglePolicyEnabled(polId);
    setPolicies(ebpfSyscallService.getPolicies());
  };

  const handleClearMap = (mapId: string) => {
    ebpfSyscallService.clearMapEntries(mapId);
    setMaps(ebpfSyscallService.getMaps());
    if (selectedMap && selectedMap.id === mapId) {
      setSelectedMap({ ...selectedMap, entries: [], currentEntries: 0 });
    }
    showBanner(`BPF Map "${mapId}" flushed`);
  };

  // Abort running simulation
  const handleAbortSimulation = () => {
    ebpfSyscallService.abortSimulation();
    setIsSimulating(false);
    showBanner('Attack simulation aborted by operator');
  };

  // Run Attack Simulation Profile
  const handleStartSimulation = async (profileId: string) => {
    if (isSimulating) return;
    setIsSimulating(true);
    setSimStepIndex(0);
    setSimLog([]);

    const profile = simulationProfiles.find((p) => p.id === profileId);
    if (!profile) {
      setIsSimulating(false);
      return;
    }

    showBanner(`Starting behavioral simulation: "${profile.name}"...`);

    try {
      await ebpfSyscallService.runSimulation(profileId, (idx, evt) => {
        if (!isMountedRef.current) return;
        setSimStepIndex(idx);
        setSimLog((prev) => [...prev, evt]);
      });
      if (isMountedRef.current) {
        showBanner(`Simulation "${profile.name}" execution complete. Kernel mitigations verified.`);
      }
    } catch (err: any) {
      if (isMountedRef.current) {
        showBanner(`Simulation error: ${err?.message || 'Unknown error'}`);
      }
    } finally {
      if (isMountedRef.current) {
        setIsSimulating(false);
      }
    }
  };

  // Inject Custom Syscall Event
  const handleInjectCustomSyscall = () => {
    const evt = ebpfSyscallService.injectCustomSyscall({
      comm: customComm,
      pid: customPid,
      syscall: customSyscall,
      syscallNr: customSyscall === 'sys_mprotect' ? 10 : customSyscall === 'sys_ptrace' ? 101 : 42,
      arguments: customArgs,
      isMemoryRwx: customRwx,
      destinationIp: customC2Ip
    });

    showBanner(`Syscall ${customSyscall}() dispatched. Result: ${evt.actionTaken} (${evt.returnVal})`);
    setSelectedEvent(evt);
    setActiveTab('stream');
  };

  return (
    <div className="space-y-4">
      {/* Banner Notice */}
      {bannerNotice && (
        <div className="p-3 rounded-lg bg-cyan-950/80 border border-cyan-500/50 text-cyan-200 text-xs font-mono flex items-center justify-between shadow-lg shadow-cyan-950/30">
          <div className="flex items-center gap-2">
            <Radio className="w-4 h-4 text-cyan-400 animate-pulse" />
            <span>{bannerNotice}</span>
          </div>
          <button
            onClick={() => setBannerNotice(null)}
            className="text-cyan-400 hover:text-white text-xs cursor-pointer font-bold"
          >
            ✕
          </button>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TOP HUD: KERNEL eBPF JIT & RING BUFFER TELEMETRY */}
      {/* ========================================================================= */}
      <div className="p-4 rounded-xl bg-gradient-to-br from-[#0c1424] via-[#09101d] to-[#060a14] border border-cyan-500/30 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 relative z-10">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-cyan-950/70 border border-cyan-500/40 text-cyan-400 shadow-inner">
              <Cpu className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h2 className="text-base font-bold text-white tracking-wide">
                  Real-Time Syscall Hooking & eBPF Sandbox Suite
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-950 border border-emerald-500/50 text-emerald-300 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                  RING-0 HOOKS ENGAGED
                </span>
              </div>
              <p className="text-xs text-[#8fa0b5] mt-0.5 font-mono">
                {stats.kernelVersion} • {stats.jitCompiler}
              </p>
            </div>
          </div>

          {/* Key Metric Gauges */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <div className="px-3 py-2 rounded-lg bg-black/50 border border-white/10 text-left">
              <div className="text-[10px] font-mono text-zinc-400 flex items-center gap-1">
                <Activity className="w-3 h-3 text-cyan-400" />
                <span>Throughput</span>
              </div>
              <div className="text-sm font-mono font-bold text-white mt-0.5">
                {stats.ringBufferThroughputMsgSec} <span className="text-[10px] font-normal text-cyan-400">evt/s</span>
              </div>
            </div>

            <div className="px-3 py-2 rounded-lg bg-black/50 border border-white/10 text-left">
              <div className="text-[10px] font-mono text-zinc-400 flex items-center gap-1">
                <Clock className="w-3 h-3 text-indigo-400" />
                <span>Interception Latency</span>
              </div>
              <div className="text-sm font-mono font-bold text-white mt-0.5">
                {stats.averageLatencyUs} <span className="text-[10px] font-normal text-indigo-400">μs</span>
              </div>
            </div>

            <div className="px-3 py-2 rounded-lg bg-black/50 border border-white/10 text-left">
              <div className="text-[10px] font-mono text-zinc-400 flex items-center gap-1">
                <Layers className="w-3 h-3 text-emerald-400" />
                <span>Active Probes</span>
              </div>
              <div className="text-sm font-mono font-bold text-emerald-300 mt-0.5">
                {stats.activeProbesCount} / {programs.length} <span className="text-[10px] font-normal text-zinc-400">JITed</span>
              </div>
            </div>

            <div className="px-3 py-2 rounded-lg bg-black/50 border border-white/10 text-left">
              <div className="text-[10px] font-mono text-zinc-400 flex items-center gap-1">
                <ShieldAlert className="w-3 h-3 text-red-400" />
                <span>Blocked / Killed</span>
              </div>
              <div className="text-sm font-mono font-bold text-red-400 mt-0.5">
                {stats.totalBlocksKills} <span className="text-[10px] font-normal text-zinc-400">mitigated</span>
              </div>
            </div>
          </div>
        </div>

        {/* Global Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-3 mt-4 pt-3 border-t border-white/10 text-xs font-mono">
          <div className="flex items-center gap-2">
            <button
              onClick={handleToggleStream}
              className={`px-3 py-1.5 rounded-lg border text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                isPaused
                  ? 'bg-amber-950/80 hover:bg-amber-900 border-amber-500/50 text-amber-300'
                  : 'bg-zinc-800 hover:bg-zinc-700 border-white/10 text-zinc-300'
              }`}
            >
              {isPaused ? <Play className="w-3.5 h-3.5 text-amber-400" /> : <Pause className="w-3.5 h-3.5 text-cyan-400" />}
              <span>{isPaused ? 'Resume Stream' : 'Pause Stream'}</span>
            </button>

            <button
              onClick={handleClearStream}
              className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 border border-white/10 text-zinc-300 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5 text-zinc-400" />
              <span>Clear Buffer</span>
            </button>

            <button
              onClick={handleExportTraceJson}
              className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 border border-white/10 text-zinc-300 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-indigo-400" />
              <span>Export Trace (.json)</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            {onNavigateToQuarantine && (
              <button
                onClick={onNavigateToQuarantine}
                className="px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-white/10 text-cyan-300 text-xs font-mono flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <Shield className="w-3.5 h-3.5 text-cyan-400" />
                <span>Quarantine Vault</span>
              </button>
            )}

            {onNavigateToVault && (
              <button
                onClick={onNavigateToVault}
                className="px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-white/10 text-purple-300 text-xs font-mono flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <Lock className="w-3.5 h-3.5 text-purple-400" />
                <span>Encrypted Store</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* INTERNAL NAVIGATION TABS */}
      {/* ========================================================================= */}
      <div className="flex flex-wrap items-center gap-2 border-b border-white/10 pb-2">
        <button
          onClick={() => setActiveTab('stream')}
          className={`px-3.5 py-2 rounded-lg text-xs font-mono font-bold flex items-center gap-2 transition-all cursor-pointer ${
            activeTab === 'stream'
              ? 'bg-cyan-600 text-white shadow-lg shadow-cyan-950/60'
              : 'bg-zinc-900 text-zinc-400 hover:bg-zinc-800 hover:text-white'
          }`}
        >
          <Activity className="w-4 h-4 text-cyan-300" />
          <span>Live Syscall Stream</span>
          <span className="px-1.5 py-0.2 rounded bg-black/40 text-[10px]">{events.length}</span>
        </button>

        <button
          onClick={() => setActiveTab('simulation')}
          className={`px-3.5 py-2 rounded-lg text-xs font-mono font-bold flex items-center gap-2 transition-all cursor-pointer ${
            activeTab === 'simulation'
              ? 'bg-amber-600 text-white shadow-lg shadow-amber-950/60'
              : 'bg-zinc-900 text-zinc-400 hover:bg-zinc-800 hover:text-white'
          }`}
        >
          <Flame className="w-4 h-4 text-amber-300" />
          <span>Sandbox Simulation Lab</span>
          {isSimulating && <span className="w-2 h-2 rounded-full bg-red-400 animate-ping" />}
        </button>

        <button
          onClick={() => setActiveTab('probes')}
          className={`px-3.5 py-2 rounded-lg text-xs font-mono font-bold flex items-center gap-2 transition-all cursor-pointer ${
            activeTab === 'probes'
              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-950/60'
              : 'bg-zinc-900 text-zinc-400 hover:bg-zinc-800 hover:text-white'
          }`}
        >
          <Code2 className="w-4 h-4 text-indigo-300" />
          <span>Kernel eBPF Probes (JIT)</span>
          <span className="px-1.5 py-0.2 rounded bg-black/40 text-[10px]">{programs.length}</span>
        </button>

        <button
          onClick={() => setActiveTab('policies')}
          className={`px-3.5 py-2 rounded-lg text-xs font-mono font-bold flex items-center gap-2 transition-all cursor-pointer ${
            activeTab === 'policies'
              ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-950/60'
              : 'bg-zinc-900 text-zinc-400 hover:bg-zinc-800 hover:text-white'
          }`}
        >
          <Settings className="w-4 h-4 text-emerald-300" />
          <span>Interception Policies</span>
          <span className="px-1.5 py-0.2 rounded bg-black/40 text-[10px]">{policies.length}</span>
        </button>

        <button
          onClick={() => setActiveTab('maps')}
          className={`px-3.5 py-2 rounded-lg text-xs font-mono font-bold flex items-center gap-2 transition-all cursor-pointer ${
            activeTab === 'maps'
              ? 'bg-purple-600 text-white shadow-lg shadow-purple-950/60'
              : 'bg-zinc-900 text-zinc-400 hover:bg-zinc-800 hover:text-white'
          }`}
        >
          <Database className="w-4 h-4 text-purple-300" />
          <span>eBPF Maps Explorer</span>
          <span className="px-1.5 py-0.2 rounded bg-black/40 text-[10px]">{maps.length}</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: LIVE SYSCALL STREAM & INTERCEPTION MONITOR */}
      {/* ========================================================================= */}
      {activeTab === 'stream' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Main Stream Feed */}
          <div className="lg:col-span-2 space-y-3">
            {/* Filter Bar */}
            <div className="p-3 rounded-xl bg-zinc-900/90 border border-white/10 flex flex-col sm:flex-row items-center gap-3">
              <div className="relative flex-1 w-full">
                <Search className="w-4 h-4 absolute left-3 top-2.5 text-zinc-500" />
                <input
                  type="text"
                  placeholder="Filter by syscall, comm, PID, MITRE technique, or signature..."
                  value={searchFilter}
                  onChange={(e) => setSearchFilter(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-black/60 border border-white/10 text-xs font-mono text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-cyan-500/50"
                />
              </div>

              <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
                {(['ALL', 'BLOCKED_ONLY', 'MEMORY', 'PROCESS', 'NETWORK', 'DRIVER'] as const).map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setCategoryFilter(cat)}
                    className={`px-2.5 py-1 rounded-md text-[11px] font-mono whitespace-nowrap transition-all cursor-pointer ${
                      categoryFilter === cat
                        ? 'bg-cyan-950 border border-cyan-500/60 text-cyan-300 font-bold'
                        : 'bg-zinc-800 text-zinc-400 hover:text-white'
                    }`}
                  >
                    {cat.replace('_', ' ')}
                  </button>
                ))}
              </div>
            </div>

            {/* Event List */}
            <div className="space-y-2 max-h-[560px] overflow-y-auto custom-scrollbar pr-1">
              {filteredEvents.length === 0 ? (
                <div className="p-8 rounded-xl bg-black/40 border border-white/10 text-center text-zinc-500 text-xs font-mono">
                  No kernel syscall events matched current filter parameters.
                </div>
              ) : (
                filteredEvents.map((evt) => {
                  const isSelected = selectedEvent?.id === evt.id;
                  const isCritical = evt.actionTaken === 'KILLED_SIGKILL' || evt.actionTaken === 'BLOCKED_EPERM';
                  const isIntercepted = evt.actionTaken === 'INTERCEPTED' || evt.actionTaken === 'ISOLATED';

                  return (
                    <div
                      key={evt.id}
                      onClick={() => setSelectedEvent(evt)}
                      className={`p-3 rounded-lg border transition-all cursor-pointer text-xs font-mono space-y-1.5 ${
                        isSelected
                          ? 'bg-cyan-950/40 border-cyan-500 shadow-md shadow-cyan-950/30'
                          : isCritical
                          ? 'bg-red-950/20 border-red-500/30 hover:bg-red-950/40'
                          : isIntercepted
                          ? 'bg-amber-950/20 border-amber-500/30 hover:bg-amber-950/40'
                          : 'bg-black/50 border-white/5 hover:bg-zinc-900/60'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            isCritical ? 'bg-red-950 border border-red-500/50 text-red-300' :
                            isIntercepted ? 'bg-amber-950 border border-amber-500/50 text-amber-300' :
                            'bg-cyan-950 border border-cyan-500/30 text-cyan-300'
                          }`}>
                            {evt.syscall}()
                          </span>
                          <span className="text-zinc-400 font-bold">[{evt.comm}]</span>
                          <span className="text-[10px] text-zinc-500">PID {evt.pid}</span>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-zinc-500">{evt.timestamp}</span>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            evt.actionTaken === 'KILLED_SIGKILL' ? 'bg-red-600 text-white' :
                            evt.actionTaken === 'BLOCKED_EPERM' ? 'bg-red-950 border border-red-500 text-red-400' :
                            evt.actionTaken === 'INTERCEPTED' ? 'bg-amber-950 border border-amber-500 text-amber-400' :
                            evt.actionTaken === 'ISOLATED' ? 'bg-purple-950 border border-purple-500 text-purple-300' :
                            'bg-zinc-800 text-zinc-400'
                          }`}>
                            {evt.actionTaken}
                          </span>
                        </div>
                      </div>

                      <div className="text-[11px] text-zinc-300 truncate">
                        Args: <span className="text-zinc-400">{evt.arguments}</span>
                      </div>

                      <div className="flex items-center justify-between text-[10px] text-zinc-500 pt-1 border-t border-white/5">
                        <span>Return: <code className="text-zinc-300">{evt.returnVal}</code> ({evt.durationUs}μs)</span>
                        {evt.signature && (
                          <span className="text-amber-400 font-bold flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3" />
                            {evt.signature}
                          </span>
                        )}
                        {evt.mitreTechnique && (
                          <span className="text-indigo-400">MITRE {evt.mitreTechnique}</span>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Event Inspector Sidebar */}
          <div className="space-y-3">
            <div className="p-4 rounded-xl bg-zinc-900/90 border border-white/10 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold font-mono text-white flex items-center gap-2">
                  <Eye className="w-4 h-4 text-cyan-400" />
                  <span>Syscall Event Inspector</span>
                </h3>
                {selectedEvent && (
                  <span className="text-[10px] font-mono text-zinc-500">{selectedEvent.id}</span>
                )}
              </div>

              {selectedEvent ? (
                <div className="space-y-3 text-xs font-mono">
                  <div className="p-3 rounded-lg bg-black/60 border border-white/10 space-y-2">
                    <div className="flex justify-between items-center text-[11px]">
                      <span className="text-zinc-500">Target Syscall:</span>
                      <span className="text-cyan-300 font-bold">{selectedEvent.syscall}() [__NR_{selectedEvent.syscallNr}]</span>
                    </div>

                    <div className="flex justify-between items-center text-[11px]">
                      <span className="text-zinc-500">Caller Process:</span>
                      <span className="text-zinc-200">{selectedEvent.comm} (PID {selectedEvent.pid}, PPID {selectedEvent.ppid})</span>
                    </div>

                    <div className="flex justify-between items-center text-[11px]">
                      <span className="text-zinc-500">CPU Core:</span>
                      <span className="text-zinc-300">Core #{selectedEvent.cpu}</span>
                    </div>

                    <div className="flex justify-between items-center text-[11px]">
                      <span className="text-zinc-500">Execution Latency:</span>
                      <span className="text-zinc-300">{selectedEvent.durationUs} μs</span>
                    </div>

                    <div className="flex justify-between items-center text-[11px]">
                      <span className="text-zinc-500">Return Code:</span>
                      <span className="text-zinc-300">{selectedEvent.returnVal}</span>
                    </div>

                    <div className="flex justify-between items-center text-[11px]">
                      <span className="text-zinc-500">Threat Score:</span>
                      <span className={`font-bold ${
                        selectedEvent.threatScore >= 80 ? 'text-red-400' :
                        selectedEvent.threatScore >= 40 ? 'text-amber-400' :
                        'text-emerald-400'
                      }`}>
                        {selectedEvent.threatScore} / 100
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] text-zinc-400 block mb-1">Raw Arguments Payload</label>
                    <div className="p-2.5 rounded-lg bg-black border border-white/10 text-zinc-300 text-[11px] font-mono break-all max-h-32 overflow-y-auto">
                      {selectedEvent.arguments}
                    </div>
                  </div>

                  {selectedEvent.signature && (
                    <div className="p-2.5 rounded-lg bg-amber-950/40 border border-amber-500/40 text-amber-200 text-[11px] space-y-1">
                      <div className="font-bold flex items-center gap-1.5 text-amber-400">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        <span>Heuristic Signature Triggered</span>
                      </div>
                      <p>{selectedEvent.signature}</p>
                      {selectedEvent.ruleMatched && (
                        <div className="text-[10px] text-zinc-400">
                          Matched Policy: <span className="text-amber-300">{selectedEvent.ruleMatched}</span>
                        </div>
                      )}
                    </div>
                  )}

                  {selectedEvent.mitreTechnique && (
                    <div className="p-2.5 rounded-lg bg-indigo-950/40 border border-indigo-500/40 text-indigo-200 text-[11px]">
                      <div className="font-bold text-indigo-300">MITRE ATT&CK Mapping</div>
                      <div>Technique ID: {selectedEvent.mitreTechnique}</div>
                    </div>
                  )}

                  {onRunCliCommand && (
                    <button
                      onClick={() => onRunCliCommand(`kill -9 ${selectedEvent.pid}`)}
                      className="w-full py-2 rounded-lg bg-red-950 hover:bg-red-900 border border-red-500/50 text-red-300 text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer"
                    >
                      <Zap className="w-3.5 h-3.5" />
                      <span>Send SIGKILL to PID {selectedEvent.pid}</span>
                    </button>
                  )}
                </div>
              ) : (
                <div className="p-8 rounded-lg bg-black/40 border border-white/5 text-center text-zinc-500 text-xs font-mono">
                  Select an event from the stream to view kernel stack registers, memory args, and policy mitigation trace.
                </div>
              )}
            </div>

            {/* Quick Injector Form */}
            <div className="p-4 rounded-xl bg-zinc-900/90 border border-white/10 space-y-2.5">
              <h3 className="text-xs font-bold font-mono text-white flex items-center gap-2">
                <Terminal className="w-4 h-4 text-indigo-400" />
                <span>Ad-Hoc Syscall Dispatcher</span>
              </h3>
              <p className="text-[11px] text-zinc-400">
                Dispatch an ad-hoc syscall event directly into the eBPF kernel pipeline to test filter traps.
              </p>

              <div className="space-y-2 text-xs font-mono">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] text-zinc-400">Syscall</label>
                    <select
                      value={customSyscall}
                      onChange={(e) => {
                        setCustomSyscall(e.target.value);
                        if (e.target.value === 'sys_mprotect') {
                          setCustomArgs('addr=0x7fff92a00000, len=65536, prot=PROT_READ|PROT_WRITE|PROT_EXEC');
                          setCustomRwx(true);
                        } else if (e.target.value === 'sys_ptrace') {
                          setCustomArgs('request=PTRACE_POKETEXT, pid=844 (lsass), addr=0x7fff92a00040');
                          setCustomRwx(false);
                        } else if (e.target.value === 'sys_connect') {
                          setCustomArgs('sockfd=4, addr=185.220.101.44:8443 (C2 TeamServer)');
                          setCustomRwx(false);
                        }
                      }}
                      className="w-full p-1.5 rounded bg-black border border-white/10 text-zinc-200 text-xs"
                    >
                      <option value="sys_mprotect">sys_mprotect</option>
                      <option value="sys_ptrace">sys_ptrace</option>
                      <option value="sys_connect">sys_connect</option>
                      <option value="sys_memfd_create">sys_memfd_create</option>
                      <option value="sys_init_module">sys_init_module</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] text-zinc-400">Process Name</label>
                    <input
                      type="text"
                      value={customComm}
                      onChange={(e) => setCustomComm(e.target.value)}
                      className="w-full p-1.5 rounded bg-black border border-white/10 text-zinc-200 text-xs"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] text-zinc-400">Arguments</label>
                  <input
                    type="text"
                    value={customArgs}
                    onChange={(e) => setCustomArgs(e.target.value)}
                    className="w-full p-1.5 rounded bg-black border border-white/10 text-zinc-200 text-xs"
                  />
                </div>

                <button
                  onClick={handleInjectCustomSyscall}
                  className="w-full py-1.5 rounded-lg bg-cyan-950 hover:bg-cyan-900 border border-cyan-500/50 text-cyan-200 text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-md shadow-cyan-950/30"
                >
                  <Zap className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Inject Syscall into Kernel Trap</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: SANDBOX BEHAVIORAL SIMULATION LAB */}
      {/* ========================================================================= */}
      {activeTab === 'simulation' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Profile Selector */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold font-mono text-zinc-300 flex items-center gap-2">
              <Crosshair className="w-4 h-4 text-amber-400" />
              <span>Attack Simulation Campaigns</span>
            </h3>

            <div className="space-y-2">
              {simulationProfiles.map((p) => {
                const isSelected = activeSimProfileId === p.id;
                return (
                  <div
                    key={p.id}
                    onClick={() => {
                      setActiveSimProfileId(p.id);
                      setSimStepIndex(-1);
                      setSimLog([]);
                    }}
                    className={`p-3 rounded-xl border transition-all cursor-pointer space-y-1.5 ${
                      isSelected
                        ? 'bg-amber-950/40 border-amber-500 shadow-md shadow-amber-950/40'
                        : 'bg-zinc-900/80 border-white/5 hover:bg-zinc-800/80'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-white font-mono">{p.name}</span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                        p.category === 'RANSOMWARE' ? 'bg-red-950 border border-red-500 text-red-300' :
                        p.category === 'ROOTKIT' ? 'bg-purple-950 border border-purple-500 text-purple-300' :
                        p.category === 'EXPLOIT' ? 'bg-amber-950 border border-amber-500 text-amber-300' :
                        p.category === 'MALWARE' ? 'bg-pink-950 border border-pink-500 text-pink-300' :
                        'bg-emerald-950 border border-emerald-500 text-emerald-300'
                      }`}>
                        {p.category}
                      </span>
                    </div>

                    <p className="text-[11px] text-zinc-400">{p.description}</p>

                    <div className="text-[10px] font-mono text-zinc-500 pt-1 border-t border-white/5 flex items-center justify-between">
                      <span>Process: <code className="text-zinc-300">{p.processName}</code></span>
                      <span>{p.steps.length} Syscall Steps</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Simulation Stage & Step Trace */}
          <div className="lg:col-span-2 space-y-3">
            {(() => {
              const profile = simulationProfiles.find((p) => p.id === activeSimProfileId);
              if (!profile) return null;

              return (
                <div className="p-4 rounded-xl bg-zinc-900/90 border border-white/10 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/10">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-bold text-white font-mono">{profile.name}</h3>
                        <span className="text-xs font-mono text-zinc-500">[{profile.processName}]</span>
                      </div>
                      <p className="text-xs text-[#8fa0b5] font-mono mt-0.5">
                        Expected MITRE: <span className="text-indigo-400">{profile.expectedMitre}</span>
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      {isSimulating && (
                        <button
                          onClick={handleAbortSimulation}
                          className="px-3 py-2 rounded-lg font-mono font-bold text-xs flex items-center gap-1.5 bg-red-950 hover:bg-red-900 border border-red-500/50 text-red-300 transition-all cursor-pointer shadow-md"
                        >
                          <XCircle className="w-4 h-4 text-red-400" />
                          <span>Abort</span>
                        </button>
                      )}

                      <button
                        onClick={() => handleStartSimulation(profile.id)}
                        disabled={isSimulating}
                        className={`px-4 py-2 rounded-lg font-mono font-bold text-xs flex items-center gap-2 transition-all shadow-lg cursor-pointer ${
                          isSimulating
                            ? 'bg-zinc-800 text-zinc-500 border border-white/5 cursor-not-allowed'
                            : 'bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white shadow-amber-950/50'
                        }`}
                      >
                        {isSimulating ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                        <span>{isSimulating ? 'Executing Simulation...' : 'Execute In Sandbox'}</span>
                      </button>
                    </div>
                  </div>

                  {/* Planned Syscall Flow */}
                  <div className="space-y-2">
                    <h4 className="text-xs font-mono font-bold text-zinc-400">Execution Syscall Chain</h4>
                    <div className="space-y-2">
                      {profile.steps.map((step, idx) => {
                        const isExecuted = simStepIndex >= idx;
                        const isCurrent = simStepIndex === idx && isSimulating;

                        return (
                          <div
                            key={idx}
                            className={`p-3 rounded-lg border transition-all text-xs font-mono ${
                              isCurrent
                                ? 'bg-amber-950/50 border-amber-400 shadow-md animate-pulse'
                                : isExecuted
                                ? 'bg-black/80 border-cyan-500/40'
                                : 'bg-black/30 border-white/5 text-zinc-500'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                                  isExecuted ? 'bg-cyan-600 text-white' : 'bg-zinc-800 text-zinc-400'
                                }`}>
                                  {idx + 1}
                                </span>
                                <span className="font-bold text-zinc-200">{step.syscall}()</span>
                                <span className="text-[10px] text-zinc-500">[__NR_{step.syscallNr}]</span>
                              </div>

                              <div className="flex items-center gap-2">
                                {step.riskScore >= 80 && (
                                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-950 border border-red-500/50 text-red-300">
                                    THREAT: {step.riskScore}/100
                                  </span>
                                )}
                                <span className="text-[10px] text-zinc-400">Expected: {step.simulatedReturn}</span>
                              </div>
                            </div>

                            <div className="mt-1 text-[11px] text-zinc-400 truncate">
                              Args: <span className="text-zinc-300">{step.args}</span>
                            </div>

                            {step.triggerHeuristic && (
                              <div className="mt-1 text-[10px] text-amber-400 flex items-center gap-1 font-bold">
                                <AlertTriangle className="w-3 h-3" />
                                <span>{step.triggerHeuristic}</span>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Real-time Execution Logs from Simulation */}
                  {simLog.length > 0 && (
                    <div className="p-3 rounded-xl bg-black border border-cyan-500/30 space-y-2">
                      <div className="flex items-center justify-between text-xs font-mono text-cyan-400 font-bold">
                        <span className="flex items-center gap-1.5">
                          <Terminal className="w-3.5 h-3.5" />
                          Kernel Interception Log ({simLog.length} events caught)
                        </span>
                        <span className="text-[10px] text-zinc-500">Live Ring Buffer</span>
                      </div>

                      <div className="space-y-1.5 max-h-40 overflow-y-auto custom-scrollbar text-[11px] font-mono">
                        {simLog.map((log) => (
                          <div key={log.id} className="p-2 rounded bg-zinc-900/90 border border-white/5 flex items-center justify-between">
                            <span className="text-cyan-300">{log.timestamp} - {log.syscall}()</span>
                            <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                              log.actionTaken === 'KILLED_SIGKILL' || log.actionTaken === 'BLOCKED_EPERM'
                                ? 'bg-red-950 border border-red-500 text-red-300'
                                : 'bg-zinc-800 text-zinc-400'
                            }`}>
                              {log.actionTaken}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: KERNEL eBPF PROBES (JIT COMPILER & C SOURCE) */}
      {/* ========================================================================= */}
      {activeTab === 'probes' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Probe Programs List */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold font-mono text-zinc-300 flex items-center gap-2">
              <Code2 className="w-4 h-4 text-indigo-400" />
              <span>Loaded eBPF Kernel Probes</span>
            </h3>

            <div className="space-y-2">
              {programs.map((prog) => {
                const isSelected = selectedProgram?.id === prog.id;
                return (
                  <div
                    key={prog.id}
                    onClick={() => setSelectedProgram(prog)}
                    className={`p-3 rounded-xl border transition-all cursor-pointer space-y-1.5 ${
                      isSelected
                        ? 'bg-indigo-950/40 border-indigo-500 shadow-md shadow-indigo-950/40'
                        : 'bg-zinc-900/80 border-white/5 hover:bg-zinc-800/80'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold font-mono text-white">{prog.name}</span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                        prog.status === 'ACTIVE'
                          ? 'bg-emerald-950 border border-emerald-500/50 text-emerald-300'
                          : 'bg-zinc-800 text-zinc-500'
                      }`}>
                        {prog.status}
                      </span>
                    </div>

                    <p className="text-[11px] text-zinc-400 font-mono truncate">{prog.section}</p>

                    <div className="flex items-center justify-between text-[10px] font-mono text-zinc-500 pt-1 border-t border-white/5">
                      <span>Target: <code className="text-cyan-400">{prog.targetSyscall}</code></span>
                      <span>{prog.jitedInstructions} JIT instrs</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* C Source Code Inspector */}
          <div className="lg:col-span-2 space-y-3">
            {selectedProgram ? (
              <div className="p-4 rounded-xl bg-zinc-900/90 border border-white/10 space-y-3 font-mono">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/10">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-bold text-white">{selectedProgram.name}</h3>
                      <span className="px-2 py-0.5 rounded bg-indigo-950 border border-indigo-500/50 text-indigo-300 text-[10px]">
                        {selectedProgram.type.toUpperCase()}
                      </span>
                    </div>
                    <p className="text-xs text-[#8fa0b5] mt-0.5">{selectedProgram.description}</p>
                  </div>

                  <button
                    onClick={() => handleToggleProbe(selectedProgram.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      selectedProgram.status === 'ACTIVE'
                        ? 'bg-amber-950 hover:bg-amber-900 border border-amber-500/50 text-amber-300'
                        : 'bg-emerald-950 hover:bg-emerald-900 border border-emerald-500/50 text-emerald-300'
                    }`}
                  >
                    {selectedProgram.status === 'ACTIVE' ? 'Suspend Probe' : 'Activate Probe'}
                  </button>
                </div>

                {/* JIT Telemetry Bar */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                  <div className="p-2 rounded bg-black/60 border border-white/10">
                    <span className="text-[10px] text-zinc-500 block">JIT Instructions</span>
                    <span className="font-bold text-white">{selectedProgram.jitedInstructions}</span>
                  </div>
                  <div className="p-2 rounded bg-black/60 border border-white/10">
                    <span className="text-[10px] text-zinc-500 block">Verifier Complexity</span>
                    <span className="font-bold text-indigo-300">{selectedProgram.complexity} passes</span>
                  </div>
                  <div className="p-2 rounded bg-black/60 border border-white/10">
                    <span className="text-[10px] text-zinc-500 block">Stack Depth</span>
                    <span className="font-bold text-cyan-300">{selectedProgram.stackDepthBytes} bytes</span>
                  </div>
                  <div className="p-2 rounded bg-black/60 border border-white/10">
                    <span className="text-[10px] text-zinc-500 block">Total Events Intercepted</span>
                    <span className="font-bold text-emerald-400">{selectedProgram.eventsCount.toLocaleString()}</span>
                  </div>
                </div>

                {/* C Kernel Source Code Block */}
                <div>
                  <div className="flex items-center justify-between text-xs text-zinc-400 mb-1.5">
                    <span className="flex items-center gap-1.5 text-zinc-300">
                      <FileCode className="w-3.5 h-3.5 text-indigo-400" />
                      eBPF C Source Code [Clang/LLVM target=bpf]
                    </span>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(selectedProgram.cSource);
                        showBanner('eBPF C source copied to clipboard');
                      }}
                      className="text-[11px] text-cyan-400 hover:text-white cursor-pointer"
                    >
                      Copy Source
                    </button>
                  </div>

                  <pre className="p-3.5 rounded-xl bg-black border border-white/10 text-xs text-emerald-400 overflow-x-auto custom-scrollbar font-mono leading-relaxed">
                    <code>{selectedProgram.cSource}</code>
                  </pre>
                </div>
              </div>
            ) : (
              <div className="p-8 rounded-xl bg-black/40 border border-white/10 text-center text-zinc-500 text-xs font-mono">
                Select an eBPF program from the left column to view its JIT bytecode verification and C source.
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: INTERCEPTION POLICIES & ENFORCEMENT RULES */}
      {/* ========================================================================= */}
      {activeTab === 'policies' && (
        <div className="p-4 rounded-xl bg-zinc-900/90 border border-white/10 space-y-4 font-mono">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/10">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Settings className="w-4 h-4 text-emerald-400" />
                <span>Syscall Interception Enforcement Matrix</span>
              </h3>
              <p className="text-xs text-[#8fa0b5] mt-0.5">
                Defines runtime kernel responses (ALLOW, AUDIT, BLOCK_EPERM, KILL_SIGKILL, ISOLATE) per syscall category.
              </p>
            </div>
            <div className="text-xs text-zinc-400">
              {policies.filter((p) => p.enabled).length} of {policies.length} Policies Active
            </div>
          </div>

          <div className="space-y-2.5">
            {policies.map((pol) => {
              return (
                <div
                  key={pol.id}
                  className="p-3.5 rounded-xl bg-black/60 border border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs"
                >
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center gap-2.5">
                      <button
                        onClick={() => handleTogglePolicy(pol.id)}
                        className={`w-4 h-4 rounded flex items-center justify-center border transition-all cursor-pointer ${
                          pol.enabled
                            ? 'bg-emerald-600 border-emerald-500 text-white'
                            : 'bg-zinc-800 border-zinc-700 text-transparent'
                        }`}
                      >
                        ✓
                      </button>

                      <span className="font-bold text-white text-sm">{pol.syscall}()</span>
                      <span className="text-[10px] text-zinc-500">[__NR_{pol.syscallNr}]</span>

                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        pol.threatSeverity === 'CRITICAL' ? 'bg-red-950 border border-red-500/50 text-red-300' :
                        pol.threatSeverity === 'HIGH' ? 'bg-amber-950 border border-amber-500/50 text-amber-300' :
                        pol.threatSeverity === 'MEDIUM' ? 'bg-yellow-950 border border-yellow-500/50 text-yellow-300' :
                        'bg-zinc-800 text-zinc-400'
                      }`}>
                        {pol.threatSeverity}
                      </span>

                      <span className="px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 text-[10px]">
                        {pol.category.replace('_', ' ')}
                      </span>
                    </div>

                    <p className="text-[11px] text-zinc-400">{pol.description}</p>
                    <div className="text-[10px] text-zinc-500">
                      Condition: <code className="text-zinc-300">{pol.triggerCondition}</code>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <label className="text-[10px] text-zinc-400 block mb-1">Enforcement Action</label>
                      <select
                        value={pol.action}
                        onChange={(e) => handleUpdatePolicyAction(pol.id, e.target.value as SyscallEnforcementAction)}
                        className={`px-3 py-1.5 rounded-lg border text-xs font-bold cursor-pointer ${
                          pol.action === 'KILL_SIGKILL' ? 'bg-red-950 border-red-500 text-red-300' :
                          pol.action === 'BLOCK_EPERM' ? 'bg-amber-950 border-amber-500 text-amber-300' :
                          pol.action === 'ISOLATE_SANDBOX' ? 'bg-purple-950 border-purple-500 text-purple-300' :
                          'bg-zinc-900 border-white/10 text-zinc-300'
                        }`}
                      >
                        <option value="ALLOW">ALLOW (Bypass)</option>
                        <option value="AUDIT">AUDIT (Log Only)</option>
                        <option value="BLOCK_EPERM">BLOCK (Return -EPERM)</option>
                        <option value="KILL_SIGKILL">KILL (Send SIGKILL)</option>
                        <option value="ISOLATE_SANDBOX">ISOLATE (Divert to Sandbox)</option>
                      </select>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 5: eBPF KERNEL MAPS EXPLORER */}
      {/* ========================================================================= */}
      {activeTab === 'maps' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 font-mono">
          {/* Map List */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-zinc-300 flex items-center gap-2">
              <Database className="w-4 h-4 text-purple-400" />
              <span>Kernel BPF Maps</span>
            </h3>

            <div className="space-y-2">
              {maps.map((map) => {
                const isSelected = selectedMap?.id === map.id;
                return (
                  <div
                    key={map.id}
                    onClick={() => setSelectedMap(map)}
                    className={`p-3 rounded-xl border transition-all cursor-pointer space-y-1.5 ${
                      isSelected
                        ? 'bg-purple-950/40 border-purple-500 shadow-md shadow-purple-950/40'
                        : 'bg-zinc-900/80 border-white/5 hover:bg-zinc-800/80'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-white">{map.name}</span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-zinc-800 text-purple-300">
                        {map.currentEntries} / {map.maxEntries}
                      </span>
                    </div>

                    <p className="text-[11px] text-zinc-400 truncate">{map.description}</p>

                    <div className="flex items-center justify-between text-[10px] text-zinc-500 pt-1 border-t border-white/5">
                      <span>Type: <code className="text-zinc-300">{map.type}</code></span>
                      <span>Val: {map.valueSize}B</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Map Key/Value Table */}
          <div className="lg:col-span-2 space-y-3">
            {selectedMap ? (
              <div className="p-4 rounded-xl bg-zinc-900/90 border border-white/10 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/10">
                  <div>
                    <h3 className="text-sm font-bold text-white">{selectedMap.name}</h3>
                    <p className="text-xs text-[#8fa0b5] mt-0.5">{selectedMap.description}</p>
                  </div>

                  <button
                    onClick={() => handleClearMap(selectedMap.id)}
                    className="px-3 py-1.5 rounded-lg bg-red-950/80 hover:bg-red-900 border border-red-500/50 text-red-300 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Flush Map Entries</span>
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-white/10 text-[11px] text-zinc-400">
                        <th className="py-2 px-3">Map Key</th>
                        <th className="py-2 px-3">Stored Value / Descriptor</th>
                        <th className="py-2 px-3 text-right">Last Updated</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {selectedMap.entries.length === 0 ? (
                        <tr>
                          <td colSpan={3} className="py-6 text-center text-zinc-500 text-xs">
                            Map is currently empty.
                          </td>
                        </tr>
                      ) : (
                        selectedMap.entries.map((entry, idx) => (
                          <tr key={idx} className="hover:bg-white/5 transition-all">
                            <td className="py-2.5 px-3 text-cyan-300 font-bold whitespace-nowrap">
                              {entry.key}
                            </td>
                            <td className="py-2.5 px-3 text-zinc-300">
                              {entry.value}
                            </td>
                            <td className="py-2.5 px-3 text-right text-zinc-500 text-[11px] whitespace-nowrap">
                              {entry.lastUpdated}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div className="p-8 rounded-xl bg-black/40 border border-white/10 text-center text-zinc-500 text-xs">
                Select a BPF map to inspect its real-time kernel memory keys and values.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
