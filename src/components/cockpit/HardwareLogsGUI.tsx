// jb7572_2026-08-24: Category 5 - Logs, Hardware & Auditing GUI Component
import React, { useState, useEffect } from 'react';
import { 
  SystemLogEntry, 
  HardwareDevice, 
  HardwareSensorData, 
  ReliabilityAuditSummary,
  LogLevel,
  LogSubsystem,
  HardwareCategory
} from '../../types';
import { hardwareLogsService } from '../../services/hardwareLogsService';
import { DeviceManagerGUI } from './DeviceManagerGUI';
import { 
  FileText, 
  Cpu, 
  Thermometer, 
  Activity, 
  Search, 
  Filter, 
  Terminal, 
  AlertTriangle, 
  AlertCircle, 
  Info, 
  ShieldCheck, 
  Trash2, 
  RefreshCw, 
  PlusCircle, 
  Zap, 
  HardDrive, 
  Wifi, 
  Radio, 
  Volume2, 
  Layers, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Gauge, 
  Power,
  BatteryCharging,
  Sliders
} from 'lucide-react';

interface HardwareLogsGUIProps {
  onRunCliCommand?: (cmd: string) => void;
}

type TabType = 'EVENT_VIEWER' | 'DEVICE_MANAGER' | 'SENSORS_THERMALS' | 'RELIABILITY_AUDIT';

export const HardwareLogsGUI: React.FC<HardwareLogsGUIProps> = ({ onRunCliCommand }) => {
  const [activeTab, setActiveTab] = useState<TabType>('EVENT_VIEWER');
  
  // Data States
  const [logs, setLogs] = useState<SystemLogEntry[]>([]);
  const [devices, setDevices] = useState<HardwareDevice[]>([]);
  const [sensors, setSensors] = useState<HardwareSensorData>(hardwareLogsService.getSensors());
  const [audit, setAudit] = useState<ReliabilityAuditSummary>(hardwareLogsService.getAuditSummary());

  // Filters
  const [logSearch, setLogSearch] = useState('');
  const [selectedLogLevel, setSelectedLogLevel] = useState<string>('ALL');
  const [selectedSubsystem, setSelectedSubsystem] = useState<string>('ALL');
  const [deviceCategoryFilter, setDeviceCategoryFilter] = useState<string>('ALL');
  
  // Notice Banner
  const [notification, setNotification] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);

  const showNotification = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 4000);
  };

  const refreshAllData = () => {
    setLogs(hardwareLogsService.getLogs());
    setDevices(hardwareLogsService.getHardwareDevices());
    setSensors(hardwareLogsService.getSensors());
    setAudit(hardwareLogsService.getAuditSummary());
  };

  useEffect(() => {
    refreshAllData();
    const interval = setInterval(() => {
      setSensors(hardwareLogsService.getSensors());
      setAudit(hardwareLogsService.getAuditSummary());
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  const handleInjectTestLog = (level: LogLevel) => {
    const res = hardwareLogsService.generateTestLog(level);
    refreshAllData();
    showNotification(res.message, 'success');
  };

  const handleClearLogs = () => {
    const res = hardwareLogsService.clearLogs();
    refreshAllData();
    showNotification(res.message, 'info');
  };

  const handleToggleDevice = (devId: string) => {
    const res = hardwareLogsService.toggleDeviceStatus(devId);
    refreshAllData();
    showNotification(res.message, res.success ? 'success' : 'error');
  };

  // Filtered Logs
  const filteredLogs = logs.filter(log => {
    const matchesSearch = log.message.toLowerCase().includes(logSearch.toLowerCase()) || 
                          log.source.toLowerCase().includes(logSearch.toLowerCase());
    const matchesLevel = selectedLogLevel === 'ALL' || log.level === selectedLogLevel;
    const matchesSub = selectedSubsystem === 'ALL' || log.subsystem === selectedSubsystem;
    return matchesSearch && matchesLevel && matchesSub;
  });

  // Filtered Devices
  const filteredDevices = devices.filter(dev => {
    return deviceCategoryFilter === 'ALL' || dev.category === deviceCategoryFilter;
  });

  const getLogLevelBadge = (level: LogLevel) => {
    switch (level) {
      case 'CRITICAL':
        return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-rose-950/80 text-rose-300 border border-rose-800"><AlertCircle className="w-3 h-3 text-rose-400" /> CRIT</span>;
      case 'ERROR':
        return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-red-950/60 text-red-300 border border-red-800"><AlertCircle className="w-3 h-3 text-red-400" /> ERR</span>;
      case 'WARN':
        return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-950/60 text-amber-300 border border-amber-800"><AlertTriangle className="w-3 h-3 text-amber-400" /> WARN</span>;
      case 'AUDIT':
        return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-purple-950/60 text-purple-300 border border-purple-800"><ShieldCheck className="w-3 h-3 text-purple-400" /> AUDIT</span>;
      case 'INFO':
      default:
        return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-medium bg-cyan-950/50 text-cyan-300 border border-cyan-800"><Info className="w-3 h-3 text-cyan-400" /> INFO</span>;
    }
  };

  const getCategoryIcon = (cat: HardwareCategory) => {
    switch (cat) {
      case 'CPU': return <Cpu className="w-4 h-4 text-emerald-400" />;
      case 'GPU': return <Layers className="w-4 h-4 text-purple-400" />;
      case 'STORAGE_NVME': return <HardDrive className="w-4 h-4 text-amber-400" />;
      case 'NETWORK_NIC': return <Wifi className="w-4 h-4 text-cyan-400" />;
      case 'AUDIO': return <Volume2 className="w-4 h-4 text-indigo-400" />;
      case 'USB_CONTROLLER': return <Radio className="w-4 h-4 text-blue-400" />;
      case 'MEMORY': return <Sliders className="w-4 h-4 text-teal-400" />;
      default: return <Cpu className="w-4 h-4 text-gray-400" />;
    }
  };

  return (
    <div className="bg-[#0c0c0e] border border-[#222] rounded-xl p-5 shadow-2xl text-[#ececf1] space-y-5 font-sans">
      
      {/* Sub-Header / Tool Tabs Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#222]">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
          <button
            id="tab_btn_event_viewer"
            onClick={() => setActiveTab('EVENT_VIEWER')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${
              activeTab === 'EVENT_VIEWER'
                ? 'bg-gradient-to-r from-cyan-900/60 to-cyan-800/40 text-cyan-200 border border-cyan-500/40 shadow-sm'
                : 'bg-[#141416] text-[#888] hover:text-[#ccc] border border-[#26262b]'
            }`}
          >
            <FileText className="w-3.5 h-3.5 text-cyan-400" />
            <span>Event Viewer & Syslog</span>
            <span className="ml-1 px-1.5 py-0.2 rounded bg-cyan-950 text-cyan-300 font-mono text-[10px]">
              {logs.length}
            </span>
          </button>

          <button
            id="tab_btn_device_mgr"
            onClick={() => setActiveTab('DEVICE_MANAGER')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${
              activeTab === 'DEVICE_MANAGER'
                ? 'bg-gradient-to-r from-purple-900/60 to-purple-800/40 text-purple-200 border border-purple-500/40 shadow-sm'
                : 'bg-[#141416] text-[#888] hover:text-[#ccc] border border-[#26262b]'
            }`}
          >
            <Cpu className="w-3.5 h-3.5 text-purple-400" />
            <span>Device Manager (PCI/USB)</span>
            <span className="ml-1 px-1.5 py-0.2 rounded bg-purple-950 text-purple-300 font-mono text-[10px]">
              {devices.length}
            </span>
          </button>

          <button
            id="tab_btn_sensors"
            onClick={() => setActiveTab('SENSORS_THERMALS')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${
              activeTab === 'SENSORS_THERMALS'
                ? 'bg-gradient-to-r from-amber-900/60 to-amber-800/40 text-amber-200 border border-amber-500/40 shadow-sm'
                : 'bg-[#141416] text-[#888] hover:text-[#ccc] border border-[#26262b]'
            }`}
          >
            <Thermometer className="w-3.5 h-3.5 text-amber-400" />
            <span>Sensors & Thermals</span>
            <span className="ml-1 px-1.5 py-0.2 rounded bg-amber-950 text-amber-300 font-mono text-[10px]">
              {sensors.cpuPackageTempC}°C
            </span>
          </button>

          <button
            id="tab_btn_reliability"
            onClick={() => setActiveTab('RELIABILITY_AUDIT')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${
              activeTab === 'RELIABILITY_AUDIT'
                ? 'bg-gradient-to-r from-emerald-900/60 to-emerald-800/40 text-emerald-200 border border-emerald-500/40 shadow-sm'
                : 'bg-[#141416] text-[#888] hover:text-[#ccc] border border-[#26262b]'
            }`}
          >
            <Activity className="w-3.5 h-3.5 text-emerald-400" />
            <span>Reliability & Audit</span>
            <span className="ml-1 px-1.5 py-0.2 rounded bg-emerald-950 text-emerald-300 font-mono text-[10px]">
              {audit.reliabilityScore}/10
            </span>
          </button>
        </div>

        {/* Global Quick Action */}
        <div className="flex items-center gap-2">
          <button
            id="btn_refresh_logs_hw"
            onClick={refreshAllData}
            title="Refresh logs & telemetry"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#18181b] hover:bg-[#27272a] text-[#aaa] hover:text-white border border-[#333] text-xs transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Poll</span>
          </button>
        </div>
      </div>

      {/* Notification Toast */}
      {notification && (
        <div className={`p-3 rounded-lg border text-xs flex items-center justify-between font-mono animate-fadeIn ${
          notification.type === 'success' 
            ? 'bg-emerald-950/80 border-emerald-700 text-emerald-200' 
            : notification.type === 'error'
            ? 'bg-red-950/80 border-red-700 text-red-200'
            : 'bg-blue-950/80 border-blue-700 text-blue-200'
        }`}>
          <span>{notification.message}</span>
          <button onClick={() => setNotification(null)} className="text-xs opacity-70 hover:opacity-100">✕</button>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 1: EVENT VIEWER & SYSLOG                                              */}
      {/* ========================================================================= */}
      {activeTab === 'EVENT_VIEWER' && (
        <div className="space-y-4">
          {/* Controls Bar */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-[#111114] p-3 rounded-lg border border-[#222]">
            <div className="flex flex-wrap items-center gap-2 flex-1">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#666]" />
                <input
                  id="input_log_search"
                  type="text"
                  placeholder="Filter logs by message or process name..."
                  value={logSearch}
                  onChange={(e) => setLogSearch(e.target.value)}
                  className="w-full bg-[#18181c] border border-[#2a2a30] rounded-lg pl-9 pr-3 py-1.5 text-xs text-[#ddd] placeholder-[#555] focus:outline-none focus:border-cyan-500 font-mono"
                />
              </div>

              {/* Level Filter */}
              <select
                id="select_log_level"
                value={selectedLogLevel}
                onChange={(e) => setSelectedLogLevel(e.target.value)}
                className="bg-[#18181c] border border-[#2a2a30] rounded-lg px-2.5 py-1.5 text-xs text-[#ccc] focus:outline-none focus:border-cyan-500 font-mono"
              >
                <option value="ALL">All Levels</option>
                <option value="INFO">INFO</option>
                <option value="WARN">WARN</option>
                <option value="ERROR">ERROR</option>
                <option value="CRITICAL">CRITICAL</option>
                <option value="AUDIT">AUDIT</option>
              </select>

              {/* Subsystem Filter */}
              <select
                id="select_log_subsystem"
                value={selectedSubsystem}
                onChange={(e) => setSelectedSubsystem(e.target.value)}
                className="bg-[#18181c] border border-[#2a2a30] rounded-lg px-2.5 py-1.5 text-xs text-[#ccc] focus:outline-none focus:border-cyan-500 font-mono"
              >
                <option value="ALL">All Subsystems</option>
                <option value="KERNEL">KERNEL</option>
                <option value="AUTH">AUTH</option>
                <option value="STORAGE">STORAGE</option>
                <option value="NETWORK">NETWORK</option>
                <option value="SYSTEMD">SYSTEMD</option>
                <option value="DRIVERS">DRIVERS</option>
              </select>
            </div>

            {/* Test Event Injection & Clear */}
            <div className="flex items-center gap-2">
              <div className="flex items-center bg-[#18181c] border border-[#2a2a30] rounded-lg p-0.5 text-xs font-mono">
                <span className="px-2 text-[#666] text-[11px]">Inject Event:</span>
                <button
                  id="btn_inject_warn"
                  onClick={() => handleInjectTestLog('WARN')}
                  className="px-2 py-1 hover:bg-amber-950/60 text-amber-400 rounded transition-colors text-[11px]"
                >
                  +WARN
                </button>
                <button
                  id="btn_inject_err"
                  onClick={() => handleInjectTestLog('ERROR')}
                  className="px-2 py-1 hover:bg-red-950/60 text-red-400 rounded transition-colors text-[11px]"
                >
                  +ERR
                </button>
                <button
                  id="btn_inject_crit"
                  onClick={() => handleInjectTestLog('CRITICAL')}
                  className="px-2 py-1 hover:bg-rose-950/60 text-rose-400 rounded transition-colors text-[11px]"
                >
                  +CRIT
                </button>
                <button
                  id="btn_inject_audit"
                  onClick={() => handleInjectTestLog('AUDIT')}
                  className="px-2 py-1 hover:bg-purple-950/60 text-purple-400 rounded transition-colors text-[11px]"
                >
                  +AUDIT
                </button>
              </div>

              <button
                id="btn_clear_logs"
                onClick={handleClearLogs}
                title="Clear in-memory ring buffer"
                className="p-1.5 rounded-lg bg-[#18181c] hover:bg-red-950/40 text-[#777] hover:text-red-400 border border-[#2a2a30] transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>

              {onRunCliCommand && (
                <button
                  id="btn_cli_journalctl"
                  onClick={() => onRunCliCommand('journalctl -n 20')}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-950/50 hover:bg-cyan-900/60 text-cyan-300 border border-cyan-700/50 text-xs font-mono transition-colors"
                >
                  <Terminal className="w-3 h-3" />
                  <span>journalctl</span>
                </button>
              )}
            </div>
          </div>

          {/* Logs Table / Stream View */}
          <div className="bg-[#111114] border border-[#222] rounded-lg overflow-hidden font-mono">
            <div className="max-h-[420px] overflow-y-auto divide-y divide-[#1c1c22]">
              {filteredLogs.length === 0 ? (
                <div className="p-8 text-center text-[#666] text-xs">
                  No log entries matched specified filters. Try changing filter criteria or inject a test event.
                </div>
              ) : (
                filteredLogs.map(entry => (
                  <div key={entry.id} className="p-2.5 hover:bg-[#16161b] transition-colors text-xs flex flex-col md:flex-row md:items-center justify-between gap-2">
                    <div className="flex items-start md:items-center gap-2.5 flex-1 min-w-0">
                      <span className="text-[#666] text-[11px] whitespace-nowrap min-w-[155px]">
                        {entry.timestamp}
                      </span>
                      {getLogLevelBadge(entry.level)}
                      <span className="px-1.5 py-0.5 rounded bg-[#1c1c24] text-[#999] text-[10px] uppercase font-bold tracking-wider">
                        {entry.subsystem}
                      </span>
                      <span className="text-[#ddd] break-all leading-relaxed font-sans text-xs flex-1">
                        {entry.message}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 self-end md:self-auto text-[11px] text-[#666]">
                      <span className="px-1.5 py-0.5 rounded bg-[#18181f] text-[#888]">
                        src: <strong className="text-[#bbb]">{entry.source}</strong>
                        {entry.pid !== null && ` [pid:${entry.pid}]`}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: DEVICE MANAGER (PCI/USB/ACPI)                                      */}
      {/* ========================================================================= */}
      {activeTab === 'DEVICE_MANAGER' && (
        <DeviceManagerGUI onRunCliCommand={onRunCliCommand} />
      )}

      {/* ========================================================================= */}
      {/* TAB 3: HARDWARE SENSORS & THERMALS                                        */}
      {/* ========================================================================= */}
      {activeTab === 'SENSORS_THERMALS' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between bg-[#111114] p-3 rounded-lg border border-[#222]">
            <div className="flex items-center gap-2">
              <Thermometer className="w-4 h-4 text-amber-400" />
              <span className="text-xs font-mono text-[#aaa]">
                Live ACPI & Core Thermal Sensors (Polling every 2s)
              </span>
            </div>
            {onRunCliCommand && (
              <button
                id="btn_cli_sensors"
                onClick={() => onRunCliCommand('sensors')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-950/50 hover:bg-amber-900/60 text-amber-300 border border-amber-700/50 text-xs font-mono transition-colors"
              >
                <Terminal className="w-3 h-3" />
                <span>sensors / turbostat</span>
              </button>
            )}
          </div>

          {/* Main Gauges Grid */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3.5">
            {/* CPU Package Temp */}
            <div className="bg-[#111114] border border-[#26262b] rounded-lg p-4 space-y-2">
              <div className="flex items-center justify-between text-xs text-[#888]">
                <span>CPU Package</span>
                <span className="text-amber-400 font-mono">Tjunction</span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-mono font-bold text-amber-300">
                  {sensors.cpuPackageTempC}°C
                </span>
                <span className="text-xs text-[#666]">/ 100°C Max</span>
              </div>
              <div className="w-full bg-[#181820] rounded-full h-2 overflow-hidden">
                <div 
                  className={`h-full transition-all duration-500 ${
                    sensors.cpuPackageTempC > 70 ? 'bg-red-500' : sensors.cpuPackageTempC > 55 ? 'bg-amber-500' : 'bg-emerald-500'
                  }`}
                  style={{ width: `${(sensors.cpuPackageTempC / 100) * 100}%` }}
                />
              </div>
            </div>

            {/* GPU Junction Temp */}
            <div className="bg-[#111114] border border-[#26262b] rounded-lg p-4 space-y-2">
              <div className="flex items-center justify-between text-xs text-[#888]">
                <span>Iris Xe GPU</span>
                <span className="text-purple-400 font-mono">DRM KMS</span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-mono font-bold text-purple-300">
                  {sensors.gpuTempC}°C
                </span>
                <span className="text-xs text-[#666]">/ 95°C Max</span>
              </div>
              <div className="w-full bg-[#181820] rounded-full h-2 overflow-hidden">
                <div 
                  className="h-full bg-purple-500 transition-all duration-500"
                  style={{ width: `${(sensors.gpuTempC / 95) * 100}%` }}
                />
              </div>
            </div>

            {/* Fan Tachometer */}
            <div className="bg-[#111114] border border-[#26262b] rounded-lg p-4 space-y-2">
              <div className="flex items-center justify-between text-xs text-[#888]">
                <span>Chassis Fan 1</span>
                <span className="text-cyan-400 font-mono">PWM Control</span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-mono font-bold text-cyan-300">
                  {sensors.fanSpeedRpm}
                </span>
                <span className="text-xs text-[#666]">RPM ({sensors.fanSpeedPercent}%)</span>
              </div>
              <div className="w-full bg-[#181820] rounded-full h-2 overflow-hidden">
                <div 
                  className="h-full bg-cyan-500 transition-all duration-500"
                  style={{ width: `${sensors.fanSpeedPercent}%` }}
                />
              </div>
            </div>

            {/* Power & Battery */}
            <div className="bg-[#111114] border border-[#26262b] rounded-lg p-4 space-y-2">
              <div className="flex items-center justify-between text-xs text-[#888]">
                <span>Power Draw</span>
                <span className="text-emerald-400 font-mono flex items-center gap-1">
                  <BatteryCharging className="w-3 h-3" /> {sensors.batteryStatus}
                </span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-mono font-bold text-emerald-300">
                  {sensors.totalSystemWatts}W
                </span>
                <span className="text-xs text-[#666]">Total (CPU: {sensors.cpuPowerWatts}W)</span>
              </div>
              <div className="w-full bg-[#181820] rounded-full h-2 overflow-hidden">
                <div 
                  className="h-full bg-emerald-500 transition-all duration-500"
                  style={{ width: `${(sensors.totalSystemWatts / 120) * 100}%` }}
                />
              </div>
            </div>
          </div>

          {/* 8-Core Per-Core Thermal Matrix & Voltage Rails */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {/* Core Thermal Breakdown */}
            <div className="bg-[#111114] border border-[#222] rounded-lg p-4 space-y-3 font-mono">
              <h4 className="text-xs font-semibold text-[#ddd] flex items-center gap-2">
                <Cpu className="w-4 h-4 text-amber-400" />
                Per-Core Thermal Sensors (APIC Core 0 - 7)
              </h4>
              <div className="grid grid-cols-4 gap-2">
                {sensors.cpuCoresTempC.map((temp, idx) => (
                  <div key={idx} className="bg-[#181820] p-2.5 rounded border border-[#282832] text-center">
                    <span className="text-[10px] text-[#777] block">Core #{idx} ({idx < 4 ? 'P-Core' : 'E-Core'})</span>
                    <span className="text-sm font-bold text-amber-300">+{temp}°C</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Motherboard Voltage Rails */}
            <div className="bg-[#111114] border border-[#222] rounded-lg p-4 space-y-3 font-mono">
              <h4 className="text-xs font-semibold text-[#ddd] flex items-center gap-2">
                <Zap className="w-4 h-4 text-yellow-400" />
                Motherboard VRM & Voltage Rails
              </h4>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="bg-[#181820] p-2.5 rounded border border-[#282832] flex justify-between items-center">
                  <span className="text-[#888]">VCore (CPU):</span>
                  <span className="font-bold text-yellow-300">{sensors.voltageVCore} V</span>
                </div>
                <div className="bg-[#181820] p-2.5 rounded border border-[#282832] flex justify-between items-center">
                  <span className="text-[#888]">+12V Rail (PCIe):</span>
                  <span className="font-bold text-yellow-300">{sensors.voltage12V} V</span>
                </div>
                <div className="bg-[#181820] p-2.5 rounded border border-[#282832] flex justify-between items-center">
                  <span className="text-[#888]">+5V Rail (SATA/USB):</span>
                  <span className="font-bold text-yellow-300">{sensors.voltage5V} V</span>
                </div>
                <div className="bg-[#181820] p-2.5 rounded border border-[#282832] flex justify-between items-center">
                  <span className="text-[#888]">+3.3V Rail (Logic):</span>
                  <span className="font-bold text-yellow-300">{sensors.voltage3V3} V</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: RELIABILITY & AUDIT MONITOR                                        */}
      {/* ========================================================================= */}
      {activeTab === 'RELIABILITY_AUDIT' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between bg-[#111114] p-3 rounded-lg border border-[#222]">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-emerald-400" />
              <span className="text-xs font-mono text-[#aaa]">
                System Reliability Index & Boot Stage Timing Analysis
              </span>
            </div>
            {onRunCliCommand && (
              <button
                id="btn_cli_systemd_analyze"
                onClick={() => onRunCliCommand('systemd-analyze')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-950/50 hover:bg-emerald-900/60 text-emerald-300 border border-emerald-700/50 text-xs font-mono transition-colors"
              >
                <Terminal className="w-3 h-3" />
                <span>systemd-analyze</span>
              </button>
            )}
          </div>

          {/* Reliability Overview Card */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 font-mono">
            <div className="bg-[#111114] border border-[#26262b] rounded-lg p-4 space-y-2">
              <span className="text-xs text-[#888]">Stability Score</span>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold text-emerald-400">{audit.reliabilityScore}</span>
                <span className="text-xs text-[#666]">/ 10.0 (Grade A+)</span>
              </div>
              <p className="text-[11px] text-[#777]">
                Calculated across uptime sessions, panics, and unexpected traps.
              </p>
            </div>

            <div className="bg-[#111114] border border-[#26262b] rounded-lg p-4 space-y-2">
              <span className="text-xs text-[#888]">Current Session Uptime</span>
              <div className="text-2xl font-bold text-cyan-300">
                {Math.floor(audit.systemUptimeSeconds / 3600)}h {Math.floor((audit.systemUptimeSeconds % 3600) / 60)}m {audit.systemUptimeSeconds % 60}s
              </div>
              <p className="text-[11px] text-[#777]">
                Continuous microkernel operation without interruption.
              </p>
            </div>

            <div className="bg-[#111114] border border-[#26262b] rounded-lg p-4 space-y-2">
              <span className="text-xs text-[#888]">Crash / Panic History</span>
              <div className="flex items-center gap-4 text-sm">
                <div>
                  <span className="text-[#666] text-[10px] block">Kernel Panics</span>
                  <span className="font-bold text-emerald-400">{audit.totalKernelPanics}</span>
                </div>
                <div>
                  <span className="text-[#666] text-[10px] block">App Crashes</span>
                  <span className="font-bold text-amber-400">{audit.totalAppCrashes}</span>
                </div>
                <div>
                  <span className="text-[#666] text-[10px] block">Clean Reboots</span>
                  <span className="font-bold text-cyan-400">{audit.cleanReboots}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Boot Stages Waterfall Breakdown */}
          <div className="bg-[#111114] border border-[#222] rounded-lg p-4 space-y-3 font-mono">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-semibold text-[#ddd] flex items-center gap-2">
                <Clock className="w-4 h-4 text-cyan-400" />
                Microkernel Boot Waterfall (Total: {audit.lastBootDurationSec}s)
              </h4>
              <span className="text-[11px] text-emerald-400">Target: graphical.target (READY)</span>
            </div>

            {/* Stacked Progress Bar */}
            <div className="w-full bg-[#181820] rounded-lg h-6 overflow-hidden flex text-[10px] font-bold">
              <div 
                className="bg-purple-600 h-full flex items-center justify-center text-white px-1 truncate"
                style={{ width: `${(audit.microkernelInitTimeMs / (audit.lastBootDurationSec * 1000)) * 100}%` }}
                title="Microkernel Init"
              >
                Kernel ({audit.microkernelInitTimeMs}ms)
              </div>
              <div 
                className="bg-cyan-600 h-full flex items-center justify-center text-white px-1 truncate"
                style={{ width: `${(audit.driversInitTimeMs / (audit.lastBootDurationSec * 1000)) * 100}%` }}
                title="PCI & Drivers Probe"
              >
                Drivers ({audit.driversInitTimeMs}ms)
              </div>
              <div 
                className="bg-emerald-600 h-full flex items-center justify-center text-white px-1 truncate"
                style={{ width: `${(audit.userspaceInitTimeMs / (audit.lastBootDurationSec * 1000)) * 100}%` }}
                title="Userspace & Systemd Daemons"
              >
                Userspace ({audit.userspaceInitTimeMs}ms)
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 text-[11px] text-[#888] pt-2">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded bg-purple-600" />
                <span>1. Kernel Ring 0 MMU & Paging: <strong className="text-purple-300">{audit.microkernelInitTimeMs}ms</strong></span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded bg-cyan-600" />
                <span>2. PCI Bus & Hardware Drivers: <strong className="text-cyan-300">{audit.driversInitTimeMs}ms</strong></span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded bg-emerald-600" />
                <span>3. Systemd Daemons & Wayland: <strong className="text-emerald-300">{audit.userspaceInitTimeMs}ms</strong></span>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
