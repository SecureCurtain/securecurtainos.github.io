// jb7572_2026-08-24: Unified Mission Control Overview & Health HUD Component
import React, { useState, useEffect } from 'react';
import { 
  HealthHUDMetrics, 
  SubsystemHealthBadge, 
  SystemIncident 
} from '../../types';
import { healthHudService } from '../../services/healthHudService';
import { 
  Activity, 
  HardDrive, 
  ShieldCheck, 
  Settings, 
  FileText, 
  Package, 
  Search, 
  Cpu, 
  Thermometer, 
  Zap, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  RefreshCw, 
  Terminal, 
  ArrowRight, 
  Layers, 
  Sliders, 
  Wifi, 
  Sparkles, 
  XCircle,
  PlayCircle,
  Binary,
  LayoutGrid,
  Bug
} from 'lucide-react';

interface OverviewHealthHUDGUIProps {
  onSelectCategory: (categoryKey: string) => void;
  onRunCliCommand?: (cmd: string) => void;
}

export const OverviewHealthHUDGUI: React.FC<OverviewHealthHUDGUIProps> = ({ 
  onSelectCategory, 
  onRunCliCommand 
}) => {
  const [metrics, setMetrics] = useState<HealthHUDMetrics>(healthHudService.getHUDMetrics());
  const [subsystems, setSubsystems] = useState<SubsystemHealthBadge[]>(healthHudService.getSubsystemsStatus());
  const [incidents, setIncidents] = useState<SystemIncident[]>(healthHudService.getIncidents());
  const [showNeofetch, setShowNeofetch] = useState(false);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'info' } | null>(null);

  const showToast = (message: string, type: 'success' | 'info' = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3500);
  };

  const refreshAll = () => {
    setMetrics(healthHudService.getHUDMetrics());
    setSubsystems(healthHudService.getSubsystemsStatus());
    setIncidents(healthHudService.getIncidents());
  };

  useEffect(() => {
    const interval = setInterval(() => {
      refreshAll();
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  const handleQuickAction = (action: 'CLEAN_STORAGE' | 'UPGRADE_PACKAGES' | 'REBUILD_CATALOG' | 'FLUSH_NETWORK') => {
    const res = healthHudService.executeQuickFix(action);
    refreshAll();
    showToast(res.message, res.success ? 'success' : 'info');
  };

  const handleResolveIncident = (id: string) => {
    healthHudService.resolveIncident(id);
    setIncidents(healthHudService.getIncidents());
    showToast('Incident acknowledged and marked as resolved.', 'info');
  };

  const getSubsystemIcon = (catKey: string) => {
    switch (catKey) {
      case 'SYSTEM_PERFORMANCE': return <Activity className="w-4 h-4 text-emerald-400" />;
      case 'MEMORY_DEBUGGER': return <Binary className="w-4 h-4 text-purple-400" />;
      case 'STORAGE_FILESYSTEM': return <HardDrive className="w-4 h-4 text-blue-400" />;
      case 'NETWORK_SECURITY': return <ShieldCheck className="w-4 h-4 text-cyan-400" />;
      case 'SYSTEM_CONFIGURATION':
      case 'SYSTEM_CONFIG': return <Settings className="w-4 h-4 text-amber-400" />;
      case 'AUDITING_LOGS': return <FileText className="w-4 h-4 text-purple-400" />;
      case 'PACKAGE_POOLS': return <Package className="w-4 h-4 text-rose-400" />;
      case 'SEARCH_NAVIGATION': return <Search className="w-4 h-4 text-indigo-400" />;
      default: return <Layers className="w-4 h-4 text-gray-400" />;
    }
  };

  const unresolvedIncidents = incidents.filter(i => !i.resolved);

  return (
    <div className="space-y-6 font-sans text-[#ececf1]">
      
      {/* Top Banner / System Vitals Bar */}
      <div className="bg-[#0e0e11] border border-[#222] rounded-xl p-5 shadow-2xl relative overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-[#1e1e24]">
          <div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center justify-center p-1.5 rounded-lg bg-emerald-950/60 border border-emerald-800/50 text-emerald-400">
                <Zap className="w-4 h-4" />
              </span>
              <h2 className="text-base font-bold text-white tracking-wide">
                Unified Overview & Health HUD
              </h2>
              <span className="px-2 py-0.5 rounded-full bg-emerald-950/80 text-emerald-300 border border-emerald-700/50 text-[10px] font-mono">
                Ring 0 Healthy
              </span>
            </div>
            <p className="text-xs text-[#888] mt-1 font-mono">
              x86_64 Long Mode • Uptime: <span className="text-emerald-300 font-semibold">{metrics.uptimeFormatted}</span> • Boot: <span className="text-blue-300">{metrics.bootTimeSeconds.toFixed(2)}s</span>
            </p>
          </div>

          {/* Top Actions */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              id="btn_open_launchpad_hub"
              onClick={() => onSelectCategory('LAUNCHPAD')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-900/50 hover:bg-purple-800/60 border border-purple-500/50 text-xs text-purple-200 hover:text-white transition-colors font-mono font-semibold shadow-sm"
            >
              <LayoutGrid className="w-3.5 h-3.5 text-purple-400" />
              <span>Apps Launchpad</span>
            </button>

            <button
              id="btn_toggle_neofetch"
              onClick={() => setShowNeofetch(!showNeofetch)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#181820] hover:bg-[#22222c] border border-[#2e2e38] text-xs text-[#ccc] hover:text-white transition-colors font-mono"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>{showNeofetch ? 'Hide System Banner' : 'Fastfetch Info'}</span>
            </button>

            {onRunCliCommand && (
              <button
                id="btn_run_hud_cli"
                onClick={() => onRunCliCommand('hud')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#181820] hover:bg-[#22222c] text-emerald-400 border border-emerald-800/40 text-xs font-mono transition-colors shadow-sm"
              >
                <Terminal className="w-3.5 h-3.5" />
                <span>hud in CLI</span>
              </button>
            )}

            <button
              id="btn_refresh_hud"
              onClick={() => { refreshAll(); showToast('Telemetry metrics refreshed.', 'info'); }}
              className="p-1.5 rounded-lg bg-[#18181c] hover:bg-[#24242c] border border-[#2a2a30] text-[#888] hover:text-white transition-colors"
              title="Refresh telemetry"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Optional Neofetch ASCII Card */}
        {showNeofetch && (
          <div className="mt-4 p-4 rounded-lg bg-[#070709] border border-[#222] font-mono text-xs text-[#bbb] animate-fadeIn flex flex-col md:flex-row gap-6 items-start">
            <pre className="text-emerald-400 text-[11px] leading-tight select-none shrink-0 font-bold">
{`       _             _
 _____| |___________| |
|  _  | |  _  /  _  | |
| | | | | | | | | | | |
| | | |_| |_| | |_| |_|
|_| |_|\\____,_|\\____,_|`}
            </pre>
            <div className="space-y-1 text-xs">
              <div><strong className="text-white">admin@SecureCurtain-station</strong></div>
              <div className="text-[#555]">--------------------------------</div>
              <div><span className="text-[#888]">OS:</span> <span className="text-[#ddd]">SecureCurtain (x86_64 Ring 0 Microkernel)</span></div>
              <div><span className="text-[#888]">Kernel:</span> <span className="text-[#ddd]">1.0.4-microkernel-rel</span></div>
              <div><span className="text-[#888]">Uptime:</span> <span className="text-[#ddd]">{metrics.uptimeFormatted}</span></div>
              <div><span className="text-[#888]">Packages:</span> <span className="text-[#ddd]">9 active pools</span></div>
              <div><span className="text-[#888]">Shell:</span> <span className="text-[#ddd]">ash 1.4.2 Virtual PTY</span></div>
              <div><span className="text-[#888]">Memory:</span> <span className="text-[#ddd]">{metrics.memoryUsedMb} MB / {metrics.memoryTotalMb} MB</span></div>
              <div><span className="text-[#888]">Storage:</span> <span className="text-[#ddd]">{metrics.storageUsedPercent}% capacity (NVMe 980 PRO)</span></div>
            </div>
          </div>
        )}

        {/* 4 Core Vitals Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mt-4">
          
          {/* CPU Vital Card */}
          <div className="bg-[#121216] border border-[#222] rounded-lg p-3.5 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono text-[#888] flex items-center gap-1.5">
                <Cpu className="w-3.5 h-3.5 text-emerald-400" />
                <span>CPU Load</span>
              </span>
              <span className="text-xs font-mono font-bold text-emerald-400">
                {metrics.cpuUsagePercent}%
              </span>
            </div>
            <div className="w-full bg-[#1c1c24] h-2 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, metrics.cpuUsagePercent)}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-[10px] font-mono text-[#666]">
              <span>4 Cores @ 3.6 GHz</span>
              <span>{metrics.activeProcesses} Processes</span>
            </div>
          </div>

          {/* Memory Vital Card */}
          <div className="bg-[#121216] border border-[#222] rounded-lg p-3.5 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono text-[#888] flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5 text-blue-400" />
                <span>Physical RAM</span>
              </span>
              <span className="text-xs font-mono font-bold text-blue-400">
                {metrics.memoryUsedPercent}%
              </span>
            </div>
            <div className="w-full bg-[#1c1c24] h-2 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-blue-500 to-cyan-400 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, metrics.memoryUsedPercent)}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-[10px] font-mono text-[#666]">
              <span>{metrics.memoryUsedMb} MB used</span>
              <span>{(metrics.memoryTotalMb / 1024).toFixed(0)} GB Total</span>
            </div>
          </div>

          {/* Thermals Card */}
          <div className="bg-[#121216] border border-[#222] rounded-lg p-3.5 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono text-[#888] flex items-center gap-1.5">
                <Thermometer className="w-3.5 h-3.5 text-amber-400" />
                <span>Peak Thermals</span>
              </span>
              <span className={`text-xs font-mono font-bold ${metrics.thermalMaxC > 75 ? 'text-rose-400' : metrics.thermalMaxC > 55 ? 'text-amber-400' : 'text-emerald-400'}`}>
                {metrics.thermalMaxC}°C
              </span>
            </div>
            <div className="w-full bg-[#1c1c24] h-2 rounded-full overflow-hidden">
              <div 
                className={`h-full rounded-full transition-all duration-500 ${metrics.thermalMaxC > 75 ? 'bg-rose-500' : metrics.thermalMaxC > 55 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                style={{ width: `${Math.min(100, (metrics.thermalMaxC / 100) * 100)}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-[10px] font-mono text-[#666]">
              <span>Fan: 1,850 RPM</span>
              <span>Tctl Safe</span>
            </div>
          </div>

          {/* Storage & Network Card */}
          <div className="bg-[#121216] border border-[#222] rounded-lg p-3.5 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono text-[#888] flex items-center gap-1.5">
                <HardDrive className="w-3.5 h-3.5 text-purple-400" />
                <span>Storage & I/O</span>
              </span>
              <span className="text-xs font-mono font-bold text-purple-400">
                {metrics.storageUsedPercent}%
              </span>
            </div>
            <div className="w-full bg-[#1c1c24] h-2 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-purple-500 to-indigo-400 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, metrics.storageUsedPercent)}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-[10px] font-mono text-[#666]">
              <span>Net: {metrics.networkThroughputMbps} Mbps</span>
              <span>NVMe 980 PRO</span>
            </div>
          </div>

        </div>
      </div>

      {/* Toast Notification */}
      {notification && (
        <div className={`p-3 rounded-lg border text-xs flex items-center justify-between font-mono animate-fadeIn ${
          notification.type === 'success' ? 'bg-emerald-950/80 border-emerald-700 text-emerald-200' : 'bg-blue-950/80 border-blue-700 text-blue-200'
        }`}>
          <span>{notification.message}</span>
          <button onClick={() => setNotification(null)} className="text-xs opacity-70 hover:opacity-100">✕</button>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SECTION 1: ALL 7 SUBSYSTEMS HEALTH MATRIX                                */}
      {/* ========================================================================= */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider font-mono flex items-center gap-2">
            <Layers className="w-4 h-4 text-emerald-400" />
            <span>Subsystem Health Matrix (All 7 Categories)</span>
          </h3>
          <span className="text-[11px] font-mono text-[#777]">
            Click any subsystem to switch panels
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {subsystems.map((sub) => {
            const isWarning = sub.status === 'WARNING';
            const isAlert = sub.status === 'ALERT';

            return (
              <div
                key={sub.id}
                onClick={() => onSelectCategory(sub.categoryKey)}
                className="bg-[#0e0e12] border border-[#222] hover:border-[#383848] rounded-xl p-4 space-y-3 cursor-pointer transition-all hover:shadow-lg hover:-translate-y-0.5 group"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-lg bg-[#15151c] border border-[#252530] group-hover:border-emerald-500/30 transition-colors">
                      {getSubsystemIcon(sub.categoryKey)}
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-white group-hover:text-emerald-300 transition-colors">
                        {sub.name}
                      </h4>
                      <span className="text-[10px] font-mono text-[#777]">
                        {sub.metric}
                      </span>
                    </div>
                  </div>

                  <span className={`px-2 py-0.5 rounded text-[10px] font-mono border ${
                    isAlert ? 'bg-rose-950/70 border-rose-700 text-rose-300' :
                    isWarning ? 'bg-amber-950/70 border-amber-700 text-amber-300' :
                    'bg-emerald-950/60 border-emerald-800/50 text-emerald-300'
                  }`}>
                    {sub.status}
                  </span>
                </div>

                <p className="text-[11px] text-[#888] font-mono line-clamp-2">
                  {sub.detail}
                </p>

                <div className="flex items-center justify-between pt-2 border-t border-[#1a1a22] text-[11px] font-mono text-[#666] group-hover:text-emerald-400">
                  <span>Open Subsystem</span>
                  <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SECTION 2: RECENT INCIDENTS & QUICK-ACTION PALETTE                       */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        
        {/* Incidents Feed (2 Columns on large) */}
        <div className="lg:col-span-2 bg-[#0e0e12] border border-[#222] rounded-xl p-4 space-y-3 font-mono">
          <div className="flex items-center justify-between pb-2 border-b border-[#1e1e24]">
            <h3 className="text-xs font-bold text-white flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              <span>System Incidents & Alerts Feed</span>
            </h3>
            <span className="text-[11px] text-[#777]">
              {unresolvedIncidents.length} Unresolved
            </span>
          </div>

          <div className="space-y-2 max-h-[280px] overflow-y-auto pr-1">
            {incidents.length === 0 ? (
              <div className="p-6 text-center text-[#555] text-xs">
                No active incidents. System state is pristine.
              </div>
            ) : (
              incidents.map((inc) => (
                <div
                  key={inc.id}
                  className={`p-3 rounded-lg border flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs ${
                    inc.resolved
                      ? 'bg-[#121216]/50 border-[#1f1f26] opacity-60'
                      : inc.level === 'CRITICAL'
                      ? 'bg-rose-950/30 border-rose-800/40 text-rose-200'
                      : inc.level === 'WARNING'
                      ? 'bg-amber-950/30 border-amber-800/40 text-amber-200'
                      : 'bg-[#14141c] border-[#252530] text-[#ccc]'
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-[10px]">
                      <span className={`px-1.5 py-0.2 rounded font-bold ${
                        inc.resolved ? 'bg-gray-800 text-gray-400' :
                        inc.level === 'CRITICAL' ? 'bg-rose-900 text-rose-300' :
                        inc.level === 'WARNING' ? 'bg-amber-900 text-amber-300' :
                        'bg-blue-950 text-blue-300'
                      }`}>
                        {inc.resolved ? 'RESOLVED' : inc.level}
                      </span>
                      <span className="text-[#777]">{inc.timestamp}</span>
                      <span className="text-white font-semibold">{inc.subsystem}</span>
                    </div>
                    <p className="text-xs text-[#bbb]">{inc.message}</p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {inc.actionCommand && onRunCliCommand && !inc.resolved && (
                      <button
                        onClick={() => onRunCliCommand(inc.actionCommand!)}
                        className="px-2.5 py-1 rounded bg-[#1f1f2a] hover:bg-[#2c2c3c] text-emerald-400 border border-emerald-800/30 text-[11px] transition-colors"
                      >
                        {inc.actionCommand}
                      </button>
                    )}
                    {!inc.resolved && (
                      <button
                        onClick={() => handleResolveIncident(inc.id)}
                        className="px-2.5 py-1 rounded bg-[#18181f] hover:bg-[#22222c] text-[#888] hover:text-white text-[11px] transition-colors"
                      >
                        Dismiss
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Quick-Action Maintenance Palette (1 Column) */}
        <div className="bg-[#0e0e12] border border-[#222] rounded-xl p-4 space-y-3 font-mono">
          <div className="pb-2 border-b border-[#1e1e24]">
            <h3 className="text-xs font-bold text-white flex items-center gap-2">
              <Sliders className="w-4 h-4 text-purple-400" />
              <span>Quick Maintenance Palette</span>
            </h3>
          </div>

          <div className="space-y-2">
            <button
              id="btn_quick_clean_storage"
              onClick={() => handleQuickAction('CLEAN_STORAGE')}
              className="w-full flex items-center justify-between p-2.5 rounded-lg bg-[#14141a] hover:bg-[#1e1e28] border border-[#242430] text-xs text-left transition-colors group"
            >
              <div className="flex items-center gap-2">
                <HardDrive className="w-3.5 h-3.5 text-blue-400" />
                <div>
                  <div className="text-white font-semibold group-hover:text-blue-300">Reclaim Storage Cache</div>
                  <div className="text-[10px] text-[#777]">Purge /tmp and journal logs</div>
                </div>
              </div>
              <PlayCircle className="w-4 h-4 text-[#555] group-hover:text-blue-400 shrink-0" />
            </button>

            <button
              id="btn_quick_upgrade_pkgs"
              onClick={() => handleQuickAction('UPGRADE_PACKAGES')}
              className="w-full flex items-center justify-between p-2.5 rounded-lg bg-[#14141a] hover:bg-[#1e1e28] border border-[#242430] text-xs text-left transition-colors group"
            >
              <div className="flex items-center gap-2">
                <Package className="w-3.5 h-3.5 text-rose-400" />
                <div>
                  <div className="text-white font-semibold group-hover:text-rose-300">Upgrade All Packages</div>
                  <div className="text-[10px] text-[#777]">Sync apt/winget pool binaries</div>
                </div>
              </div>
              <PlayCircle className="w-4 h-4 text-[#555] group-hover:text-rose-400 shrink-0" />
            </button>

            <button
              id="btn_quick_reindex"
              onClick={() => handleQuickAction('REBUILD_CATALOG')}
              className="w-full flex items-center justify-between p-2.5 rounded-lg bg-[#14141a] hover:bg-[#1e1e28] border border-[#242430] text-xs text-left transition-colors group"
            >
              <div className="flex items-center gap-2">
                <Search className="w-3.5 h-3.5 text-indigo-400" />
                <div>
                  <div className="text-white font-semibold group-hover:text-indigo-300">Re-index File Catalog</div>
                  <div className="text-[10px] text-[#777]">Fast database update (updatedb)</div>
                </div>
              </div>
              <PlayCircle className="w-4 h-4 text-[#555] group-hover:text-indigo-400 shrink-0" />
            </button>

            <button
              id="btn_quick_flush_net"
              onClick={() => handleQuickAction('FLUSH_NETWORK')}
              className="w-full flex items-center justify-between p-2.5 rounded-lg bg-[#14141a] hover:bg-[#1e1e28] border border-[#242430] text-xs text-left transition-colors group"
            >
              <div className="flex items-center gap-2">
                <Wifi className="w-3.5 h-3.5 text-cyan-400" />
                <div>
                  <div className="text-white font-semibold group-hover:text-cyan-300">Flush Network Sockets</div>
                  <div className="text-[10px] text-[#777]">Clear ARP table & DNS caches</div>
                </div>
              </div>
              <PlayCircle className="w-4 h-4 text-[#555] group-hover:text-cyan-400 shrink-0" />
            </button>

            <button
              id="btn_quick_bug_reporter"
              onClick={() => onSelectCategory('FEEDBACK_BUGS')}
              className="w-full flex items-center justify-between p-2.5 rounded-lg bg-[#191318] hover:bg-[#251b24] border border-rose-500/30 text-xs text-left transition-colors group"
            >
              <div className="flex items-center gap-2">
                <Bug className="w-3.5 h-3.5 text-rose-400" />
                <div>
                  <div className="text-rose-200 font-semibold group-hover:text-rose-100">Report Bug & OS Wishlist</div>
                  <div className="text-[10px] text-[#888]">Zero-PII email to securecurtainos.bugs@gmail.com</div>
                </div>
              </div>
              <PlayCircle className="w-4 h-4 text-rose-400/60 group-hover:text-rose-400 shrink-0" />
            </button>
          </div>
        </div>

      </div>

    </div>
  );
};
