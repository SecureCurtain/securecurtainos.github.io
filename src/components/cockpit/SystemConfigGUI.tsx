// jb7572_2026-08-24: Category 4 - System Configuration, Services & Cron/Automation Suite
import React, { useState, useEffect } from 'react';
import { 
  Settings, 
  Layers, 
  Clock, 
  Sliders, 
  Play, 
  Square, 
  RotateCw, 
  Plus, 
  Trash2, 
  Search, 
  Edit3, 
  CheckCircle2, 
  AlertCircle, 
  Terminal, 
  Cpu, 
  FolderTree, 
  Zap, 
  Hash, 
  Database,
  Calendar,
  Check,
  Globe,
  BatteryCharging,
  Gauge,
  SlidersHorizontal,
  RefreshCw,
  Power,
  ShieldCheck,
  Activity,
  FileText,
  Radio,
  Timer,
  Volume2,
  Monitor,
  Lock
} from 'lucide-react';
import { systemConfigService } from '../../services/systemConfigService';
import { SoundSystemManagerGUI } from './SoundSystemManagerGUI';
import { DisplayTopologyGUI } from './DisplayTopologyGUI';
import { LockscreenAnimationStudio } from '../desktop/LockscreenAnimationStudio';
import { 
  ServiceUnit, 
  RegistryEntry, 
  ScheduledTask, 
  EnvVariable, 
  ServiceStartup, 
  RegistryHive, 
  RegistryValueType,
  TaskTriggerType,
  SysctlParam,
  TimeDateInfo,
  PowerProfileInfo
} from '../../types';

interface SystemConfigGUIProps {
  onRunCliCommand: (cmd: string) => void;
}

export const SystemConfigGUI: React.FC<SystemConfigGUIProps> = ({ onRunCliCommand }) => {
  // Navigation tabs for Category 4 / Item 5 + Sound, Displays & Lockscreen Studio
  const [activeTab, setActiveTab] = useState<'services' | 'sysctl' | 'timedate' | 'power' | 'tasks' | 'environment' | 'registry' | 'sounds' | 'monitors' | 'lockscreen'>('services');

  // Services state
  const [services, setServices] = useState<ServiceUnit[]>([]);
  const [serviceFilterSubsystem, setServiceFilterSubsystem] = useState<string>('ALL');
  const [serviceSearch, setServiceSearch] = useState('');
  const [viewingLogsService, setViewingLogsService] = useState<ServiceUnit | null>(null);

  // Sysctl state
  const [sysctlParams, setSysctlParams] = useState<SysctlParam[]>([]);
  const [sysctlCategoryFilter, setSysctlCategoryFilter] = useState<'ALL' | 'VM' | 'NET' | 'FS' | 'KERNEL'>('ALL');
  const [sysctlSearch, setSysctlSearch] = useState('');
  const [tempSysctlValues, setTempSysctlValues] = useState<Record<string, number | boolean | string>>({});

  // Time & Date state
  const [timeDateInfo, setTimeDateInfo] = useState<TimeDateInfo>(systemConfigService.getTimeDateInfo());
  const [isSyncingNtp, setIsSyncingNtp] = useState(false);
  const [currentSeconds, setCurrentSeconds] = useState<string>(new Date().toLocaleTimeString());

  // Power Profiles state
  const [powerInfo, setPowerInfo] = useState<PowerProfileInfo>(systemConfigService.getPowerProfileInfo());

  // Registry state
  const [registryEntries, setRegistryEntries] = useState<RegistryEntry[]>([]);
  const [selectedHive, setSelectedHive] = useState<RegistryHive | 'ALL'>('ALL');
  const [registrySearch, setRegistrySearch] = useState('');
  const [editingRegistryEntry, setEditingRegistryEntry] = useState<RegistryEntry | null>(null);
  const [editRegistryValue, setEditRegistryValue] = useState<string>('');
  const [isAddingRegistry, setIsAddingRegistry] = useState(false);
  const [newRegHive, setNewRegHive] = useState<RegistryHive>('KCONFIG');
  const [newRegPath, setNewRegPath] = useState('CONFIG_SCHEDULER');
  const [newRegName, setNewRegName] = useState('CONFIG_RR_TIMESLICE_MS');
  const [newRegType, setNewRegType] = useState<RegistryValueType>('REG_DWORD');
  const [newRegValue, setNewRegValue] = useState('10');
  const [newRegDesc, setNewRegDesc] = useState('');
  const [newRegTunable, setNewRegTunable] = useState(true);

  // Scheduled tasks state
  const [tasks, setTasks] = useState<ScheduledTask[]>([]);
  const [taskSearch, setTaskSearch] = useState('');
  const [isAddingTask, setIsAddingTask] = useState(false);
  const [newTaskName, setNewTaskName] = useState('');
  const [newTaskCmd, setNewTaskCmd] = useState('');
  const [newTaskTrigger, setNewTaskTrigger] = useState<TaskTriggerType>('CRON');
  const [newTaskSchedule, setNewTaskSchedule] = useState('0 */4 * * *');
  const [newTaskDesc, setNewTaskDesc] = useState('');

  // Environment state
  const [envVars, setEnvVars] = useState<EnvVariable[]>([]);
  const [envScopeFilter, setEnvScopeFilter] = useState<'ALL' | 'KERNEL_SYSCTL' | 'SYSTEM' | 'USER'>('ALL');
  const [envSearch, setEnvSearch] = useState('');
  const [editingEnv, setEditingEnv] = useState<EnvVariable | null>(null);
  const [editEnvValue, setEditEnvValue] = useState('');
  const [isAddingEnv, setIsAddingEnv] = useState(false);
  const [newEnvKey, setNewEnvKey] = useState('');
  const [newEnvVal, setNewEnvVal] = useState('');
  const [newEnvScope, setNewEnvScope] = useState<'SYSTEM' | 'USER' | 'KERNEL_SYSCTL'>('KERNEL_SYSCTL');
  const [newEnvDesc, setNewEnvDesc] = useState('');

  // Floating feedback banner
  const [bannerMsg, setBannerMsg] = useState<string | null>(null);

  const showBanner = (msg: string) => {
    setBannerMsg(msg);
    setTimeout(() => setBannerMsg(null), 3500);
  };

  const refreshAll = () => {
    setServices(systemConfigService.getServices());
    setSysctlParams(systemConfigService.getSysctlParams());
    setTimeDateInfo(systemConfigService.getTimeDateInfo());
    setPowerInfo(systemConfigService.getPowerProfileInfo());
    setRegistryEntries(systemConfigService.getRegistryEntries());
    setTasks(systemConfigService.getScheduledTasks());
    setEnvVars(systemConfigService.getEnvVariables());
  };

  useEffect(() => {
    refreshAll();
    const interval = setInterval(() => {
      refreshAll();
      setCurrentSeconds(new Date().toLocaleTimeString());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Services Handlers
  const handleStartService = (name: string) => {
    const res = systemConfigService.startService(name);
    refreshAll();
    showBanner(res.message);
    onRunCliCommand(`systemctl start ${name}.service`);
  };

  const handleStopService = (name: string) => {
    const res = systemConfigService.stopService(name);
    refreshAll();
    showBanner(res.message);
    onRunCliCommand(`systemctl stop ${name}.service`);
  };

  const handleRestartService = (name: string) => {
    const res = systemConfigService.restartService(name);
    refreshAll();
    showBanner(res.message);
    onRunCliCommand(`systemctl restart ${name}.service`);
  };

  const handleChangeStartup = (name: string, startup: ServiceStartup) => {
    const res = systemConfigService.setServiceStartup(name, startup);
    refreshAll();
    showBanner(res.message);
    onRunCliCommand(`systemctl set-startup ${name}.service ${startup}`);
  };

  // Sysctl Handlers
  const handleSysctlSliderChange = (key: string, val: number | boolean | string) => {
    setTempSysctlValues(prev => ({ ...prev, [key]: val }));
  };

  const handleApplySysctl = (key: string) => {
    const val = tempSysctlValues[key];
    if (val === undefined) return;
    const res = systemConfigService.updateSysctlParam(key, val);
    refreshAll();
    showBanner(res.message);
    onRunCliCommand(`sysctl -w ${key}=${val}`);
  };

  const handleResetSysctl = (key: string) => {
    const res = systemConfigService.resetSysctlParam(key);
    setTempSysctlValues(prev => {
      const copy = { ...prev };
      delete copy[key];
      return copy;
    });
    refreshAll();
    showBanner(res.message);
    onRunCliCommand(`sysctl --reset ${key}`);
  };

  // TimeDate Handlers
  const handleTimezoneChange = (tz: string) => {
    const res = systemConfigService.setTimeZone(tz);
    refreshAll();
    showBanner(res.message);
    onRunCliCommand(`timedatectl set-timezone "${tz.split(' ')[0]}"`);
  };

  const handleToggleNtp = () => {
    const res = systemConfigService.setNtpActive(!timeDateInfo.ntpActive);
    refreshAll();
    showBanner(res.message);
    onRunCliCommand(`timedatectl set-ntp ${!timeDateInfo.ntpActive ? '1' : '0'}`);
  };

  const handleSyncNtp = () => {
    setIsSyncingNtp(true);
    setTimeout(() => {
      const res = systemConfigService.syncNtpNow();
      refreshAll();
      setIsSyncingNtp(false);
      showBanner(res.message);
      onRunCliCommand('timedatectl sync');
    }, 600);
  };

  const handleToggleRtcInLocalTz = () => {
    const res = systemConfigService.setRtcInLocalTz(!timeDateInfo.rtcInLocalTz);
    refreshAll();
    showBanner(res.message);
    onRunCliCommand(`timedatectl set-local-rtc ${!timeDateInfo.rtcInLocalTz ? '1' : '0'}`);
  };

  // Power Profiles Handlers
  const handleSelectPowerProfile = (profile: 'performance' | 'balanced' | 'power-saver') => {
    const res = systemConfigService.setPowerProfile(profile);
    refreshAll();
    showBanner(res.message);
    onRunCliCommand(`powerprofilesctl set ${profile}`);
  };

  const handleSelectCpuGovernor = (gov: 'performance' | 'powersave' | 'schedutil' | 'ondemand') => {
    const res = systemConfigService.setCpuGovernor(gov);
    refreshAll();
    showBanner(res.message);
    onRunCliCommand(`cpupower frequency-set -g ${gov}`);
  };

  const handleToggleTurboBoost = () => {
    const res = systemConfigService.toggleTurboBoost();
    refreshAll();
    showBanner(res.message);
    onRunCliCommand(`cpupower set --turbo ${res.state ? '1' : '0'}`);
  };

  // Registry Handlers
  const handleOpenEditRegistry = (entry: RegistryEntry) => {
    setEditingRegistryEntry(entry);
    setEditRegistryValue(String(entry.value));
  };

  const handleSaveRegistryValue = () => {
    if (!editingRegistryEntry) return;
    let parsedVal: string | number | boolean = editRegistryValue;
    if (editingRegistryEntry.valueType === 'REG_DWORD') {
      parsedVal = parseInt(editRegistryValue, 10) || 0;
    } else if (editingRegistryEntry.valueType === 'BOOL') {
      parsedVal = editRegistryValue === 'true' || editRegistryValue === '1';
    }

    const res = systemConfigService.updateRegistryValue(editingRegistryEntry.id, parsedVal);
    setEditingRegistryEntry(null);
    refreshAll();
    showBanner(res.message);
    onRunCliCommand(`reg add "${editingRegistryEntry.hive}\\${editingRegistryEntry.keyPath}" /v "${editingRegistryEntry.valueName}" /d "${parsedVal}" /f`);
  };

  const handleAddRegistryEntry = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRegName.trim()) return;

    let parsedVal: string | number | boolean = newRegValue;
    if (newRegType === 'REG_DWORD') {
      parsedVal = parseInt(newRegValue, 10) || 0;
    } else if (newRegType === 'BOOL') {
      parsedVal = newRegValue === 'true' || newRegValue === '1';
    }

    const res = systemConfigService.addRegistryEntry({
      hive: newRegHive,
      keyPath: newRegPath,
      valueName: newRegName,
      valueType: newRegType,
      value: parsedVal,
      description: newRegDesc || 'Custom configured system variable',
      isKernelTunable: newRegTunable
    });

    setIsAddingRegistry(false);
    setNewRegName('');
    setNewRegDesc('');
    refreshAll();
    showBanner(res.message);
    onRunCliCommand(`reg add "${res.entry.hive}\\${res.entry.keyPath}" /v "${res.entry.valueName}" /t ${res.entry.valueType} /d "${res.entry.value}"`);
  };

  const handleDeleteRegistry = (id: string, name: string) => {
    const res = systemConfigService.deleteRegistryEntry(id);
    refreshAll();
    showBanner(res.message);
    onRunCliCommand(`reg delete /v "${name}" /f`);
  };

  // Task Scheduler Handlers
  const handleToggleTask = (id: string) => {
    const res = systemConfigService.toggleTask(id);
    refreshAll();
    showBanner(res.message);
    onRunCliCommand(`schtasks /change /tn "${id}" /status ${res.enabled ? 'ENABLE' : 'DISABLE'}`);
  };

  const handleRunTaskNow = (id: string, name: string) => {
    const res = systemConfigService.runTaskNow(id);
    refreshAll();
    showBanner(res.message);
    onRunCliCommand(`crontab run ${name}`);
  };

  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskName.trim() || !newTaskCmd.trim()) return;

    const res = systemConfigService.addScheduledTask({
      name: newTaskName,
      command: newTaskCmd,
      triggerType: newTaskTrigger,
      scheduleExpr: newTaskSchedule,
      nextRun: 'Calculated at next cron interval',
      lastRun: 'Never',
      enabled: true,
      description: newTaskDesc || 'User configured automation task'
    });

    setIsAddingTask(false);
    setNewTaskName('');
    setNewTaskCmd('');
    setNewTaskDesc('');
    refreshAll();
    showBanner(res.message);
    onRunCliCommand(`crontab -e >> "${res.task.command}"`);
  };

  const handleDeleteTask = (id: string, name: string) => {
    const res = systemConfigService.deleteTask(id);
    refreshAll();
    showBanner(res.message);
    onRunCliCommand(`schtasks /delete /tn "${name}" /f`);
  };

  // Environment Handlers
  const handleOpenEditEnv = (item: EnvVariable) => {
    setEditingEnv(item);
    setEditEnvValue(item.value);
  };

  const handleSaveEnv = () => {
    if (!editingEnv) return;
    const res = systemConfigService.updateEnvVariable(editingEnv.key, editEnvValue);
    setEditingEnv(null);
    refreshAll();
    showBanner(res.message);
    if (editingEnv.scope === 'KERNEL_SYSCTL') {
      onRunCliCommand(`sysctl -w ${editingEnv.key}=${editEnvValue}`);
    } else {
      onRunCliCommand(`export ${editingEnv.key}="${editEnvValue}"`);
    }
  };

  const handleAddEnv = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEnvKey.trim()) return;

    const res = systemConfigService.addEnvVariable({
      key: newEnvKey,
      value: newEnvVal,
      scope: newEnvScope,
      isReadOnly: false,
      description: newEnvDesc || 'System environment parameter'
    });

    setIsAddingEnv(false);
    setNewEnvKey('');
    setNewEnvVal('');
    setNewEnvDesc('');
    refreshAll();
    showBanner(res.message);
    if (newEnvScope === 'KERNEL_SYSCTL') {
      onRunCliCommand(`sysctl -w ${newEnvKey}=${newEnvVal}`);
    } else {
      onRunCliCommand(`export ${newEnvKey}="${newEnvVal}"`);
    }
  };

  const handleDeleteEnv = (key: string) => {
    const res = systemConfigService.deleteEnvVariable(key);
    refreshAll();
    showBanner(res.message);
    onRunCliCommand(`unset ${key}`);
  };

  // Filtered lists
  const filteredServices = services.filter(s => {
    if (serviceFilterSubsystem !== 'ALL' && s.subsystem !== serviceFilterSubsystem) return false;
    if (!serviceSearch) return true;
    const term = serviceSearch.toLowerCase();
    return (
      s.name.toLowerCase().includes(term) ||
      s.displayName.toLowerCase().includes(term) ||
      s.description.toLowerCase().includes(term) ||
      (s.pid && s.pid.toString().includes(term))
    );
  });

  const filteredSysctl = sysctlParams.filter(p => {
    if (sysctlCategoryFilter !== 'ALL' && p.category !== sysctlCategoryFilter) return false;
    if (!sysctlSearch) return true;
    const term = sysctlSearch.toLowerCase();
    return (
      p.key.toLowerCase().includes(term) ||
      p.description.toLowerCase().includes(term)
    );
  });

  const filteredRegistry = registryEntries.filter(r => {
    if (selectedHive !== 'ALL' && r.hive !== selectedHive) return false;
    if (!registrySearch) return true;
    const term = registrySearch.toLowerCase();
    return (
      r.valueName.toLowerCase().includes(term) ||
      r.keyPath.toLowerCase().includes(term) ||
      r.description.toLowerCase().includes(term)
    );
  });

  const filteredTasks = tasks.filter(t => {
    if (!taskSearch) return true;
    const term = taskSearch.toLowerCase();
    return (
      t.name.toLowerCase().includes(term) ||
      t.command.toLowerCase().includes(term) ||
      t.description.toLowerCase().includes(term)
    );
  });

  const filteredEnvVars = envVars.filter(e => {
    if (envScopeFilter !== 'ALL' && e.scope !== envScopeFilter) return false;
    if (!envSearch) return true;
    const term = envSearch.toLowerCase();
    return (
      e.key.toLowerCase().includes(term) ||
      e.value.toLowerCase().includes(term) ||
      e.description.toLowerCase().includes(term)
    );
  });

  const runningServicesCount = services.filter(s => s.status === 'RUNNING').length;

  const timezonesList = [
    'America/New_York (EDT, UTC-4)',
    'America/Chicago (CDT, UTC-5)',
    'America/Denver (MDT, UTC-6)',
    'America/Los_Angeles (PDT, UTC-7)',
    'Europe/London (BST, UTC+1)',
    'Europe/Paris (CEST, UTC+2)',
    'Europe/Berlin (CEST, UTC+2)',
    'Asia/Tokyo (JST, UTC+9)',
    'Asia/Singapore (SGT, UTC+8)',
    'Australia/Sydney (AEST, UTC+10)',
    'UTC (Universal Coordinated Time)'
  ];

  return (
    <div className="space-y-6 text-[#f5f5f5]">
      {/* Category Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#111] p-5 rounded-2xl border border-[#222] shadow-xl">
        <div className="flex items-center gap-3.5">
          <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-400 shadow-inner">
            <Settings className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold tracking-tight text-white">
                System Configuration, Services & Automation Suite
              </h2>
              <span className="px-2 py-0.5 text-[11px] font-semibold bg-amber-950/80 text-amber-300 border border-amber-800/60 rounded-full font-mono">
                systemd & sysctl Ring 0
              </span>
            </div>
            <p className="text-xs text-[#888] mt-0.5">
              PID 1 supervisor (systemctl), live kernel parameters (sysctl), high-precision NTP (timedatectl), CPU power profiles & crontab automation.
            </p>
          </div>
        </div>

        {/* Global Status Pill & CLI Quick Action */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="px-3 py-1.5 rounded-lg border bg-amber-950/40 border-amber-800/60 text-amber-300 text-xs font-semibold flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            <span>{runningServicesCount} / {services.length} Services Active</span>
          </div>

          <div className="px-3 py-1.5 rounded-lg border bg-[#181818] border-[#333] text-[#aaa] text-xs font-mono flex items-center gap-2">
            <Clock className="w-3.5 h-3.5 text-amber-400" />
            <span>{currentSeconds}</span>
          </div>

          <button
            onClick={() => onRunCliCommand('systemctl status')}
            className="px-3 py-1.5 bg-[#181818] hover:bg-[#222] border border-[#333] hover:border-amber-500/40 rounded-lg text-xs text-[#ccc] hover:text-white flex items-center gap-1.5 transition-colors"
          >
            <Terminal className="w-3.5 h-3.5 text-amber-400" />
            <span>CLI systemctl</span>
          </button>
        </div>
      </div>

      {/* Action / Result Feedback Banner */}
      {bannerMsg && (
        <div className="bg-amber-950/90 border border-amber-500/40 px-4 py-2.5 rounded-xl text-xs text-amber-200 flex items-center gap-2 animate-fadeIn shadow-lg shadow-amber-950/30">
          <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />
          <span>{bannerMsg}</span>
        </div>
      )}

      {/* Sub-Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-[#222] pb-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab('services')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 whitespace-nowrap transition-all ${
            activeTab === 'services'
              ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30 shadow-sm'
              : 'text-[#888] hover:text-[#ddd] hover:bg-[#161616]'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Services & Daemons</span>
          <span className="px-1.5 py-0.2 bg-[#222] text-[10px] rounded-full text-[#aaa]">
            {services.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('sysctl')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 whitespace-nowrap transition-all ${
            activeTab === 'sysctl'
              ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30 shadow-sm'
              : 'text-[#888] hover:text-[#ddd] hover:bg-[#161616]'
          }`}
        >
          <SlidersHorizontal className="w-4 h-4" />
          <span>Kernel Tuner (sysctl)</span>
          <span className="px-1.5 py-0.2 bg-[#222] text-[10px] rounded-full text-[#aaa]">
            {sysctlParams.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('timedate')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 whitespace-nowrap transition-all ${
            activeTab === 'timedate'
              ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30 shadow-sm'
              : 'text-[#888] hover:text-[#ddd] hover:bg-[#161616]'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>Time & Date (NTP)</span>
          <span className="px-1.5 py-0.2 bg-emerald-950/60 text-emerald-400 text-[10px] rounded-full border border-emerald-800/40">
            SYNCED
          </span>
        </button>

        <button
          onClick={() => setActiveTab('power')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 whitespace-nowrap transition-all ${
            activeTab === 'power'
              ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30 shadow-sm'
              : 'text-[#888] hover:text-[#ddd] hover:bg-[#161616]'
          }`}
        >
          <Power className="w-4 h-4" />
          <span>Power & Governor</span>
          <span className="px-1.5 py-0.2 bg-amber-950/80 text-amber-300 text-[10px] rounded-full border border-amber-800/50 uppercase font-mono">
            {powerInfo.activeProfile}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('tasks')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 whitespace-nowrap transition-all ${
            activeTab === 'tasks'
              ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30 shadow-sm'
              : 'text-[#888] hover:text-[#ddd] hover:bg-[#161616]'
          }`}
        >
          <Calendar className="w-4 h-4" />
          <span>Crontab Scheduler</span>
          <span className="px-1.5 py-0.2 bg-[#222] text-[10px] rounded-full text-[#aaa]">
            {tasks.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('environment')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 whitespace-nowrap transition-all ${
            activeTab === 'environment'
              ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30 shadow-sm'
              : 'text-[#888] hover:text-[#ddd] hover:bg-[#161616]'
          }`}
        >
          <Sliders className="w-4 h-4" />
          <span>Environment Vars</span>
          <span className="px-1.5 py-0.2 bg-[#222] text-[10px] rounded-full text-[#aaa]">
            {envVars.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('registry')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 whitespace-nowrap transition-all ${
            activeTab === 'registry'
              ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30 shadow-sm'
              : 'text-[#888] hover:text-[#ddd] hover:bg-[#161616]'
          }`}
        >
          <Database className="w-4 h-4" />
          <span>Registry & KConfig</span>
          <span className="px-1.5 py-0.2 bg-[#222] text-[10px] rounded-full text-[#aaa]">
            {registryEntries.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('sounds')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 whitespace-nowrap transition-all ${
            activeTab === 'sounds'
              ? 'bg-purple-500/20 text-purple-300 border border-purple-500/50 shadow-sm'
              : 'text-[#888] hover:text-[#ddd] hover:bg-[#161616]'
          }`}
        >
          <Volume2 className="w-4 h-4 text-purple-400" />
          <span>Sound System & Alerts</span>
          <span className="px-1.5 py-0.2 bg-purple-950/80 text-purple-300 text-[10px] rounded-full border border-purple-500/40">
            PIPEWIRE
          </span>
        </button>

        <button
          onClick={() => setActiveTab('monitors')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 whitespace-nowrap transition-all ${
            activeTab === 'monitors'
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/50 shadow-sm'
              : 'text-[#888] hover:text-[#ddd] hover:bg-[#161616]'
          }`}
        >
          <Monitor className="w-4 h-4 text-cyan-400" />
          <span>Display Topology & Monitors</span>
          <span className="px-1.5 py-0.2 bg-cyan-950/80 text-cyan-300 text-[10px] rounded-full border border-cyan-500/40">
            XRANDR
          </span>
        </button>

        <button
          onClick={() => setActiveTab('lockscreen')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 whitespace-nowrap transition-all ${
            activeTab === 'lockscreen'
              ? 'bg-pink-500/20 text-pink-300 border border-pink-500/50 shadow-sm'
              : 'text-[#888] hover:text-[#ddd] hover:bg-[#161616]'
          }`}
        >
          <Lock className="w-4 h-4 text-pink-400" />
          <span>Lockscreen Studio (Linux)</span>
          <span className="px-1.5 py-0.2 bg-pink-950/80 text-pink-300 text-[10px] rounded-full border border-pink-500/40">
            HYPRLOCK
          </span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: SERVICES & DAEMONS (systemctl / services.msc) */}
      {/* ========================================================================= */}
      {activeTab === 'services' && (
        <div className="space-y-4">
          {/* Controls Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-[#131313] p-4 rounded-xl border border-[#222]">
            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-[#666] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Filter daemons by name or PID..."
                  value={serviceSearch}
                  onChange={(e) => setServiceSearch(e.target.value)}
                  className="bg-[#0a0a0a] border border-[#333] rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder-[#555] focus:outline-none focus:border-amber-500 w-56"
                />
              </div>

              <div className="flex items-center gap-1 bg-[#0a0a0a] p-1 rounded-lg border border-[#222] text-xs">
                {['ALL', 'CORE', 'NETWORK', 'DISPLAY', 'SECURITY', 'STORAGE'].map((sub) => (
                  <button
                    key={sub}
                    onClick={() => setServiceFilterSubsystem(sub)}
                    className={`px-2.5 py-1 rounded-md transition-colors ${
                      serviceFilterSubsystem === sub
                        ? 'bg-[#252525] text-amber-400 font-semibold'
                        : 'text-[#777] hover:text-[#ccc]'
                    }`}
                  >
                    {sub}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => onRunCliCommand('systemctl list-units --type=service')}
                className="px-3 py-1.5 bg-[#181818] hover:bg-[#222] border border-[#333] rounded-lg text-xs text-[#ccc] hover:text-white flex items-center gap-1.5"
              >
                <Terminal className="w-3.5 h-3.5 text-amber-400" />
                <span>systemctl list-units</span>
              </button>
            </div>
          </div>

          {/* Services Table */}
          <div className="bg-[#0e0e0e] border border-[#222] rounded-xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-sans">
                <thead className="bg-[#161616] text-[#888] uppercase text-[10px] tracking-wider border-b border-[#222]">
                  <tr>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Service Name</th>
                    <th className="py-3 px-4">Subsystem</th>
                    <th className="py-3 px-4">Startup</th>
                    <th className="py-3 px-4">PID</th>
                    <th className="py-3 px-4">RAM / CPU</th>
                    <th className="py-3 px-4">Executable Path</th>
                    <th className="py-3 px-4 text-center">Service Control</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1c1c1c]">
                  {filteredServices.map((srv) => {
                    const isRunning = srv.status === 'RUNNING';
                    return (
                      <tr key={srv.id} className="hover:bg-[#151515] transition-colors">
                        {/* Status Badge */}
                        <td className="py-3 px-4">
                          <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            isRunning 
                              ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-800/60' 
                              : 'bg-red-950/80 text-red-300 border border-red-800/60'
                          }`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${isRunning ? 'bg-emerald-400' : 'bg-red-400'}`} />
                            {srv.status}
                          </span>
                        </td>

                        {/* Service Title */}
                        <td className="py-3 px-4">
                          <div className="font-semibold text-white font-mono text-xs flex items-center gap-1.5">
                            <span>{srv.name}.service</span>
                          </div>
                          <div className="text-[11px] text-[#777] truncate max-w-xs">{srv.displayName}</div>
                        </td>

                        {/* Subsystem */}
                        <td className="py-3 px-4">
                          <span className="px-2 py-0.5 bg-[#1e1e1e] border border-[#333] text-[#aaa] rounded text-[10px] font-mono">
                            {srv.subsystem}
                          </span>
                        </td>

                        {/* Startup Type */}
                        <td className="py-3 px-4">
                          <select
                            value={srv.startup}
                            onChange={(e) => handleChangeStartup(srv.name, e.target.value as ServiceStartup)}
                            className="bg-[#141414] border border-[#333] text-[#ccc] rounded px-2 py-1 text-[11px] focus:outline-none focus:border-amber-500"
                          >
                            <option value="AUTO">AUTO (Boot)</option>
                            <option value="MANUAL">MANUAL (Demand)</option>
                            <option value="DISABLED">DISABLED</option>
                          </select>
                        </td>

                        {/* PID */}
                        <td className="py-3 px-4 font-mono text-amber-300">
                          {srv.pid ? (
                            <button
                              onClick={() => onRunCliCommand(`ps -p ${srv.pid}`)}
                              className="hover:underline hover:text-amber-200"
                              title="Inspect PID in terminal"
                            >
                              {srv.pid}
                            </button>
                          ) : (
                            <span className="text-[#555]">—</span>
                          )}
                        </td>

                        {/* Resources */}
                        <td className="py-3 px-4 font-mono text-[#aaa]">
                          {isRunning ? (
                            <div>
                              <span>{srv.memoryMb} MB</span>
                              <span className="text-[#666] ml-1.5 text-[10px]">({srv.cpuPercent}%)</span>
                            </div>
                          ) : (
                            <span className="text-[#555]">0 MB</span>
                          )}
                        </td>

                        {/* Exec Path */}
                        <td className="py-3 px-4 font-mono text-[#777] text-[11px] truncate max-w-xs">
                          {srv.execPath}
                        </td>

                        {/* Action Buttons */}
                        <td className="py-3 px-4 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            {isRunning ? (
                              <>
                                <button
                                  onClick={() => handleStopService(srv.name)}
                                  disabled={srv.name === 'systemd_init'}
                                  className="p-1.5 bg-red-950/40 hover:bg-red-900/60 border border-red-800/40 hover:border-red-600 rounded text-red-300 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                                  title="Stop Service Unit"
                                >
                                  <Square className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => handleRestartService(srv.name)}
                                  className="p-1.5 bg-amber-950/40 hover:bg-amber-900/60 border border-amber-800/40 hover:border-amber-600 rounded text-amber-300 transition-colors"
                                  title="Restart Service Unit"
                                >
                                  <RotateCw className="w-3.5 h-3.5" />
                                </button>
                              </>
                            ) : (
                              <button
                                onClick={() => handleStartService(srv.name)}
                                className="p-1.5 bg-emerald-950/40 hover:bg-emerald-900/60 border border-emerald-800/40 hover:border-emerald-600 rounded text-emerald-300 transition-colors"
                                title="Start Service Unit"
                              >
                                <Play className="w-3.5 h-3.5" />
                              </button>
                            )}

                            {/* Journalctl Logs Modal Trigger */}
                            <button
                              onClick={() => setViewingLogsService(srv)}
                              className="p-1.5 bg-[#1e1e1e] hover:bg-[#282828] border border-[#333] rounded text-[#ccc] hover:text-white transition-colors"
                              title="View journalctl -u logs"
                            >
                              <FileText className="w-3.5 h-3.5 text-amber-400" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Service Journalctl Modal */}
          {viewingLogsService && (
            <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <div className="bg-[#121212] border border-[#2a2a2a] rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl animate-scaleUp">
                <div className="bg-[#181818] px-5 py-3.5 border-b border-[#222] flex items-center justify-between">
                  <div className="flex items-center gap-2 font-mono">
                    <FileText className="w-4 h-4 text-amber-400" />
                    <h3 className="text-sm font-bold text-white">
                      journalctl -u {viewingLogsService.name}.service
                    </h3>
                  </div>
                  <button
                    onClick={() => setViewingLogsService(null)}
                    className="text-[#777] hover:text-white"
                  >
                    ✕
                  </button>
                </div>

                <div className="p-5 space-y-3 font-mono text-xs bg-[#090909]">
                  <div className="text-[#888]">
                    -- Logs begin at {new Date().toLocaleDateString()}, end at {new Date().toLocaleDateString()} --
                  </div>
                  <div className="space-y-1.5 text-[#ccc] bg-[#000] p-4 rounded-xl border border-[#222] max-h-72 overflow-y-auto">
                    <p className="text-emerald-400">[  0.001] systemd[1]: Starting {viewingLogsService.displayName}...</p>
                    <p className="text-[#aaa]">[  0.012] systemd[1]: Executing {viewingLogsService.execPath}</p>
                    {viewingLogsService.pid ? (
                      <>
                        <p className="text-[#aaa]">[  0.034] {viewingLogsService.name}[{viewingLogsService.pid}]: Daemon initialized in ring 0 userspace bridge.</p>
                        <p className="text-[#aaa]">[  0.045] {viewingLogsService.name}[{viewingLogsService.pid}]: Socket listener bound on /run/systemd/{viewingLogsService.name}.sock.</p>
                        <p className="text-emerald-400">[  0.052] systemd[1]: Started {viewingLogsService.displayName} (PID {viewingLogsService.pid}).</p>
                        <p className="text-[#777]">[ +0.120] {viewingLogsService.name}[{viewingLogsService.pid}]: Healthcheck OK. Resident memory: {viewingLogsService.memoryMb} MB.</p>
                      </>
                    ) : (
                      <p className="text-red-400">[  0.040] systemd[1]: Unit {viewingLogsService.name}.service is currently stopped (state: dead).</p>
                    )}
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-[#222]">
                    <span className="text-[11px] text-[#666]">
                      Dependencies: {viewingLogsService.dependencies.join(', ')}
                    </span>
                    <button
                      onClick={() => {
                        onRunCliCommand(`journalctl -u ${viewingLogsService.name}.service -n 50`);
                        setViewingLogsService(null);
                      }}
                      className="px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded-lg font-semibold flex items-center gap-1.5"
                    >
                      <Terminal className="w-3.5 h-3.5" />
                      <span>Stream in CLI</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: KERNEL PARAMETER TUNER (sysctl / /proc/sys) */}
      {/* ========================================================================= */}
      {activeTab === 'sysctl' && (
        <div className="space-y-5">
          {/* Controls Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-[#131313] p-4 rounded-xl border border-[#222]">
            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-[#666] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search sysctl tunables (e.g. swappiness, somaxconn)..."
                  value={sysctlSearch}
                  onChange={(e) => setSysctlSearch(e.target.value)}
                  className="bg-[#0a0a0a] border border-[#333] rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder-[#555] focus:outline-none focus:border-amber-500 w-64"
                />
              </div>

              <div className="flex items-center gap-1 bg-[#0a0a0a] p-1 rounded-lg border border-[#222] text-xs">
                {(['ALL', 'VM', 'NET', 'FS', 'KERNEL'] as const).map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSysctlCategoryFilter(cat)}
                    className={`px-3 py-1 rounded-md transition-colors font-mono ${
                      sysctlCategoryFilter === cat
                        ? 'bg-[#252525] text-amber-400 font-semibold'
                        : 'text-[#777] hover:text-[#ccc]'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => onRunCliCommand('sysctl -a')}
                className="px-3 py-1.5 bg-[#181818] hover:bg-[#222] border border-[#333] rounded-lg text-xs text-[#ccc] hover:text-white flex items-center gap-1.5"
              >
                <Terminal className="w-3.5 h-3.5 text-amber-400" />
                <span>sysctl -a</span>
              </button>
            </div>
          </div>

          {/* Sysctl Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredSysctl.map((param) => {
              const activeVal = tempSysctlValues[param.key] !== undefined ? tempSysctlValues[param.key] : param.currentValue;
              const hasChanged = tempSysctlValues[param.key] !== undefined && tempSysctlValues[param.key] !== param.currentValue;
              const isDefault = param.currentValue === param.defaultValue;

              return (
                <div key={param.key} className="bg-[#111] border border-[#222] hover:border-[#333] p-4 rounded-xl space-y-3 transition-colors shadow-md">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm font-bold text-amber-300">{param.key}</span>
                        <span className="px-1.5 py-0.2 bg-[#222] border border-[#333] text-[#aaa] text-[9px] font-mono rounded uppercase">
                          {param.category}
                        </span>
                      </div>
                      <p className="text-[11px] text-[#888] mt-1 leading-relaxed">{param.description}</p>
                    </div>

                    <div className="text-right shrink-0">
                      <div className="text-sm font-mono font-bold text-white bg-[#0a0a0a] px-2.5 py-1 rounded border border-[#333]">
                        {String(activeVal)} {param.unit || ''}
                      </div>
                      <div className="text-[10px] text-[#666] mt-0.5">
                        default: {String(param.defaultValue)}
                      </div>
                    </div>
                  </div>

                  {/* Interactive Slider / Input */}
                  {param.type === 'number' && param.min !== undefined && param.max !== undefined && (
                    <div className="space-y-1.5 pt-1">
                      <input
                        type="range"
                        min={param.min}
                        max={param.max}
                        value={Number(activeVal)}
                        onChange={(e) => handleSysctlSliderChange(param.key, Number(e.target.value))}
                        className="w-full h-1.5 bg-[#252525] rounded-lg appearance-none cursor-pointer accent-amber-500"
                      />
                      <div className="flex justify-between text-[10px] text-[#555] font-mono">
                        <span>{param.min} {param.unit || ''}</span>
                        <span>{param.max} {param.unit || ''}</span>
                      </div>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex items-center justify-between pt-2 border-t border-[#1c1c1c] text-xs">
                    <span className={`text-[10px] font-mono ${isDefault ? 'text-emerald-400' : 'text-amber-400'}`}>
                      {isDefault ? '✓ Kernel Default' : '⚡ Custom Tuned'}
                    </span>

                    <div className="flex items-center gap-2">
                      {!isDefault && (
                        <button
                          onClick={() => handleResetSysctl(param.key)}
                          className="px-2.5 py-1 bg-[#1a1a1a] hover:bg-[#252525] border border-[#333] text-[#888] hover:text-[#ccc] rounded text-[11px] transition-colors"
                        >
                          Reset Default
                        </button>
                      )}

                      <button
                        onClick={() => handleApplySysctl(param.key)}
                        disabled={!hasChanged}
                        className={`px-3 py-1 rounded text-[11px] font-semibold transition-all ${
                          hasChanged
                            ? 'bg-amber-600 hover:bg-amber-500 text-white shadow-md'
                            : 'bg-[#181818] text-[#555] cursor-not-allowed border border-[#262626]'
                        }`}
                      >
                        Apply sysctl -w
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: TIME & DATE SYNCHRONIZATION (timedatectl / NTP) */}
      {/* ========================================================================= */}
      {activeTab === 'timedate' && (
        <div className="space-y-5">
          {/* Digital Clocks Banner */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-[#111] border border-[#222] p-5 rounded-2xl shadow-lg space-y-1">
              <div className="flex items-center justify-between text-xs text-[#888]">
                <span>Local System Clock</span>
                <Clock className="w-4 h-4 text-amber-400" />
              </div>
              <div className="text-xl font-bold font-mono text-white tracking-wider">
                {timeDateInfo.localTime.split(',')[1]?.trim() || currentSeconds}
              </div>
              <div className="text-[11px] text-[#666] font-mono truncate">
                {timeDateInfo.localTime.split(',')[0]}
              </div>
            </div>

            <div className="bg-[#111] border border-[#222] p-5 rounded-2xl shadow-lg space-y-1">
              <div className="flex items-center justify-between text-xs text-[#888]">
                <span>Universal Coordinated (UTC)</span>
                <Globe className="w-4 h-4 text-cyan-400" />
              </div>
              <div className="text-xl font-bold font-mono text-cyan-300 tracking-wider">
                {timeDateInfo.utcTime.split(' ').slice(4, 5).join('')}
              </div>
              <div className="text-[11px] text-[#666] font-mono truncate">
                {timeDateInfo.utcTime.split(' ').slice(0, 4).join(' ')}
              </div>
            </div>

            <div className="bg-[#111] border border-[#222] p-5 rounded-2xl shadow-lg space-y-1">
              <div className="flex items-center justify-between text-xs text-[#888]">
                <span>Hardware Clock (RTC)</span>
                <Timer className="w-4 h-4 text-purple-400" />
              </div>
              <div className="text-xl font-bold font-mono text-purple-300 tracking-wider">
                {timeDateInfo.rtcTime.split(' ').slice(4, 5).join('')}
              </div>
              <div className="text-[11px] text-[#666] font-mono truncate">
                RTC in {timeDateInfo.rtcInLocalTz ? 'Local Time' : 'UTC Mode'}
              </div>
            </div>
          </div>

          {/* Configuration & NTP Controls */}
          <div className="bg-[#111] border border-[#222] p-6 rounded-2xl space-y-5 shadow-xl">
            <div className="flex items-center justify-between border-b border-[#222] pb-4">
              <div>
                <h3 className="text-base font-bold text-white">System Timezone & NTP Subsystem</h3>
                <p className="text-xs text-[#888] mt-0.5">
                  Manage timezone mappings (/etc/localtime), systemd-timesyncd daemon, and Stratum 2 NTP servers.
                </p>
              </div>

              <button
                onClick={handleSyncNtp}
                disabled={isSyncingNtp}
                className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-semibold flex items-center gap-2 shadow-lg disabled:opacity-50 transition-all"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isSyncingNtp ? 'animate-spin' : ''}`} />
                <span>{isSyncingNtp ? 'Polling NTP Pool...' : 'Sync NTP Clock Now'}</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Timezone Selector */}
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-[#ccc]">Target Timezone (/etc/localtime)</label>
                <select
                  value={timeDateInfo.timeZone}
                  onChange={(e) => handleTimezoneChange(e.target.value)}
                  className="w-full bg-[#0a0a0a] border border-[#333] rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500 font-sans"
                >
                  {timezonesList.map((tz) => (
                    <option key={tz} value={tz}>{tz}</option>
                  ))}
                </select>
                <p className="text-[11px] text-[#666]">
                  Current active timezone: <span className="text-amber-300 font-mono">{timeDateInfo.timeZone}</span>
                </p>
              </div>

              {/* NTP Synchronization Status */}
              <div className="space-y-2 bg-[#0a0a0a] p-4 rounded-xl border border-[#222]">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-[#aaa]">NTP Synchronized</span>
                  <span className="px-2 py-0.5 bg-emerald-950/80 text-emerald-300 border border-emerald-800/60 rounded text-[10px] font-bold">
                    YES (Stratum 2)
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[#666]">Upstream Pool</span>
                  <span className="font-mono text-[#ccc]">{timeDateInfo.ntpServer}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[#666]">Estimated Clock Drift</span>
                  <span className="font-mono text-amber-300">±{timeDateInfo.driftPpm} PPM</span>
                </div>
              </div>
            </div>

            {/* Toggle Switches */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <div className="flex items-center justify-between p-4 bg-[#161616] border border-[#262626] rounded-xl">
                <div>
                  <div className="text-xs font-semibold text-white">NTP Service (systemd-timesyncd)</div>
                  <div className="text-[11px] text-[#777]">Automate background drift compensation via UDP 123</div>
                </div>
                <button
                  onClick={handleToggleNtp}
                  className={`w-12 h-6 rounded-full transition-colors relative ${
                    timeDateInfo.ntpActive ? 'bg-emerald-600' : 'bg-[#333]'
                  }`}
                >
                  <span className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-transform ${
                    timeDateInfo.ntpActive ? 'left-7' : 'left-1'
                  }`} />
                </button>
              </div>

              <div className="flex items-center justify-between p-4 bg-[#161616] border border-[#262626] rounded-xl">
                <div>
                  <div className="text-xs font-semibold text-white">RTC in Local Timezone</div>
                  <div className="text-[11px] text-[#777]">Maintain hardware clock in local time (Windows dual-boot mode)</div>
                </div>
                <button
                  onClick={handleToggleRtcInLocalTz}
                  className={`w-12 h-6 rounded-full transition-colors relative ${
                    timeDateInfo.rtcInLocalTz ? 'bg-amber-600' : 'bg-[#333]'
                  }`}
                >
                  <span className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-transform ${
                    timeDateInfo.rtcInLocalTz ? 'left-7' : 'left-1'
                  }`} />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: POWER GOVERNOR & PROFILES (powerprofilesctl / cpupower) */}
      {/* ========================================================================= */}
      {activeTab === 'power' && (
        <div className="space-y-5">
          {/* Active Power Profiles Selector */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Performance Card */}
            <div 
              onClick={() => handleSelectPowerProfile('performance')}
              className={`p-5 rounded-2xl border cursor-pointer transition-all ${
                powerInfo.activeProfile === 'performance'
                  ? 'bg-amber-950/30 border-amber-500 shadow-xl shadow-amber-950/30'
                  : 'bg-[#111] border-[#222] hover:border-[#333]'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <span className="p-2 bg-amber-500/10 text-amber-400 rounded-xl border border-amber-500/20">
                  <Zap className="w-5 h-5" />
                </span>
                {powerInfo.activeProfile === 'performance' && (
                  <span className="px-2 py-0.5 bg-amber-500 text-black text-[10px] font-bold rounded-full uppercase">
                    ACTIVE
                  </span>
                )}
              </div>
              <h4 className="text-sm font-bold text-white">Performance</h4>
              <p className="text-xs text-[#888] mt-1">
                Maximizes clock frequency (up to 4.85 GHz) and minimizes latency. Ideal for compilation and heavy tasks.
              </p>
              <div className="mt-3 pt-3 border-t border-[#222] flex items-center justify-between text-xs font-mono text-[#aaa]">
                <span>Draw: ~82.4W</span>
                <span>Governor: performance</span>
              </div>
            </div>

            {/* Balanced Card */}
            <div 
              onClick={() => handleSelectPowerProfile('balanced')}
              className={`p-5 rounded-2xl border cursor-pointer transition-all ${
                powerInfo.activeProfile === 'balanced'
                  ? 'bg-cyan-950/30 border-cyan-500 shadow-xl shadow-cyan-950/30'
                  : 'bg-[#111] border-[#222] hover:border-[#333]'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <span className="p-2 bg-cyan-500/10 text-cyan-400 rounded-xl border border-cyan-500/20">
                  <Gauge className="w-5 h-5" />
                </span>
                {powerInfo.activeProfile === 'balanced' && (
                  <span className="px-2 py-0.5 bg-cyan-500 text-black text-[10px] font-bold rounded-full uppercase">
                    ACTIVE
                  </span>
                )}
              </div>
              <h4 className="text-sm font-bold text-white">Balanced</h4>
              <p className="text-xs text-[#888] mt-1">
                Dynamic frequency scaling using schedutil kernel governor. Optimizes power vs thermals.
              </p>
              <div className="mt-3 pt-3 border-t border-[#222] flex items-center justify-between text-xs font-mono text-[#aaa]">
                <span>Draw: ~45.1W</span>
                <span>Governor: schedutil</span>
              </div>
            </div>

            {/* Power Saver Card */}
            <div 
              onClick={() => handleSelectPowerProfile('power-saver')}
              className={`p-5 rounded-2xl border cursor-pointer transition-all ${
                powerInfo.activeProfile === 'power-saver'
                  ? 'bg-emerald-950/30 border-emerald-500 shadow-xl shadow-emerald-950/30'
                  : 'bg-[#111] border-[#222] hover:border-[#333]'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <span className="p-2 bg-emerald-500/10 text-emerald-400 rounded-xl border border-emerald-500/20">
                  <BatteryCharging className="w-5 h-5" />
                </span>
                {powerInfo.activeProfile === 'power-saver' && (
                  <span className="px-2 py-0.5 bg-emerald-500 text-black text-[10px] font-bold rounded-full uppercase">
                    ACTIVE
                  </span>
                )}
              </div>
              <h4 className="text-sm font-bold text-white">Power Saver</h4>
              <p className="text-xs text-[#888] mt-1">
                Caps CPU frequency at 2.10 GHz and disables boost clocks to maximize battery endurance.
              </p>
              <div className="mt-3 pt-3 border-t border-[#222] flex items-center justify-between text-xs font-mono text-[#aaa]">
                <span>Draw: ~18.2W</span>
                <span>Governor: powersave</span>
              </div>
            </div>
          </div>

          {/* CPU Frequency & Turbo Boost Telemetry Box */}
          <div className="bg-[#111] border border-[#222] p-6 rounded-2xl space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-[#222] pb-4">
              <div>
                <h3 className="text-base font-bold text-white">CPU Frequency Scaling & Hardware Governors</h3>
                <p className="text-xs text-[#888] mt-0.5">
                  Intel P-State / AMD Precision Boost driver telemetry and SMP core frequency control.
                </p>
              </div>

              <button
                onClick={() => onRunCliCommand('cpupower frequency-info')}
                className="px-3 py-1.5 bg-[#181818] hover:bg-[#222] border border-[#333] rounded-lg text-xs text-[#ccc] hover:text-white flex items-center gap-1.5"
              >
                <Terminal className="w-3.5 h-3.5 text-amber-400" />
                <span>cpupower frequency-info</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-[#0a0a0a] p-4 rounded-xl border border-[#222] space-y-1">
                <span className="text-xs text-[#777]">Current Clock Speed</span>
                <div className="text-xl font-bold font-mono text-amber-300">{powerInfo.currentFreqGhz} GHz</div>
                <span className="text-[10px] text-[#555]">Hardware Max: {powerInfo.maxFreqGhz} GHz</span>
              </div>

              <div className="bg-[#0a0a0a] p-4 rounded-xl border border-[#222] space-y-1">
                <span className="text-xs text-[#777]">Instant Package Power</span>
                <div className="text-xl font-bold font-mono text-cyan-300">{powerInfo.powerDrawWatts} Watts</div>
                <span className="text-[10px] text-[#555]">Battery Health: {powerInfo.batteryHealthPercent}%</span>
              </div>

              <div className="bg-[#0a0a0a] p-4 rounded-xl border border-[#222] space-y-1">
                <span className="text-xs text-[#777]">Active Governor</span>
                <div className="text-xl font-bold font-mono text-emerald-300 uppercase">{powerInfo.cpuGovernor}</div>
                <span className="text-[10px] text-[#555]">SMP Policy: All 8 Cores</span>
              </div>
            </div>

            {/* Turbo Boost & Governor Switcher */}
            <div className="flex flex-wrap items-center justify-between gap-4 pt-3 border-t border-[#1c1c1c]">
              <div className="flex items-center gap-3">
                <span className="text-xs font-semibold text-[#ccc]">Governor Override:</span>
                <div className="flex items-center gap-1 bg-[#0a0a0a] p-1 rounded-lg border border-[#333] text-xs">
                  {(['performance', 'schedutil', 'powersave', 'ondemand'] as const).map((gov) => (
                    <button
                      key={gov}
                      onClick={() => handleSelectCpuGovernor(gov)}
                      className={`px-3 py-1 rounded font-mono transition-colors ${
                        powerInfo.cpuGovernor === gov
                          ? 'bg-[#252525] text-amber-400 font-semibold'
                          : 'text-[#777] hover:text-[#ccc]'
                      }`}
                    >
                      {gov}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-xs font-semibold text-[#ccc]">Intel Turbo Boost / AMD Core Boost:</span>
                <button
                  onClick={handleToggleTurboBoost}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold font-mono border transition-colors ${
                    powerInfo.turboBoost
                      ? 'bg-amber-950/60 text-amber-300 border-amber-600'
                      : 'bg-[#181818] text-[#777] border-[#333]'
                  }`}
                >
                  {powerInfo.turboBoost ? 'ENABLED' : 'DISABLED'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 5: TASK SCHEDULER & CRONTAB AUTOMATION */}
      {/* ========================================================================= */}
      {activeTab === 'tasks' && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 bg-[#131313] p-4 rounded-xl border border-[#222]">
            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-[#666] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search cron tasks..."
                  value={taskSearch}
                  onChange={(e) => setTaskSearch(e.target.value)}
                  className="bg-[#0a0a0a] border border-[#333] rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder-[#555] focus:outline-none focus:border-amber-500 w-56"
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => onRunCliCommand('crontab -l')}
                className="px-3 py-1.5 bg-[#181818] hover:bg-[#222] border border-[#333] rounded-lg text-xs text-[#ccc] hover:text-white flex items-center gap-1.5"
              >
                <Terminal className="w-3.5 h-3.5 text-amber-400" />
                <span>crontab -l</span>
              </button>

              <button
                onClick={() => setIsAddingTask(true)}
                className="px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Scheduled Task</span>
              </button>
            </div>
          </div>

          <div className="bg-[#0e0e0e] border border-[#222] rounded-xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-sans">
                <thead className="bg-[#161616] text-[#888] uppercase text-[10px] tracking-wider border-b border-[#222]">
                  <tr>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Task Name & Command</th>
                    <th className="py-3 px-4">Schedule Expression</th>
                    <th className="py-3 px-4">Next Run</th>
                    <th className="py-3 px-4">Last Run / Exit</th>
                    <th className="py-3 px-4 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1c1c1c]">
                  {filteredTasks.map((t) => (
                    <tr key={t.id} className="hover:bg-[#151515] transition-colors">
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          t.enabled 
                            ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-800/60' 
                            : 'bg-[#222] text-[#777] border border-[#333]'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${t.enabled ? 'bg-emerald-400' : 'bg-[#555]'}`} />
                          {t.enabled ? 'READY' : 'DISABLED'}
                        </span>
                      </td>

                      <td className="py-3 px-4">
                        <div className="font-semibold text-white text-xs">{t.name}</div>
                        <div className="font-mono text-[11px] text-amber-300 truncate max-w-sm mt-0.5">{t.command}</div>
                        <div className="text-[10px] text-[#666] truncate max-w-xs">{t.description}</div>
                      </td>

                      <td className="py-3 px-4 font-mono text-[#aaa]">
                        <span className="px-2 py-0.5 bg-[#181818] border border-[#333] rounded text-[10px]">
                          {t.scheduleExpr}
                        </span>
                      </td>

                      <td className="py-3 px-4 font-mono text-[#888] text-[11px]">
                        {t.nextRun}
                      </td>

                      <td className="py-3 px-4 font-mono text-xs">
                        <div className="text-[#ccc] text-[11px]">{t.lastRun}</div>
                        <div className="text-[10px] text-[#666]">
                          Runs: {t.runCount} | Exit: <span className={t.lastExitCode === 0 ? 'text-emerald-400' : 'text-red-400'}>{t.lastExitCode}</span>
                        </div>
                      </td>

                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => handleRunTaskNow(t.id, t.name)}
                            className="p-1.5 bg-amber-950/40 hover:bg-amber-900/60 border border-amber-800/40 text-amber-300 rounded transition-colors"
                            title="Run task immediately"
                          >
                            <Play className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => handleToggleTask(t.id)}
                            className="p-1.5 bg-[#1e1e1e] hover:bg-[#2a2a2a] border border-[#333] text-[#aaa] rounded transition-colors"
                            title={t.enabled ? 'Disable task' : 'Enable task'}
                          >
                            <RotateCw className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => handleDeleteTask(t.id, t.name)}
                            className="p-1.5 bg-red-950/30 hover:bg-red-900/50 border border-red-900/40 text-red-400 rounded transition-colors"
                            title="Delete task"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Add Task Modal */}
          {isAddingTask && (
            <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <div className="bg-[#121212] border border-[#2a2a2a] rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl animate-scaleUp">
                <div className="bg-[#181818] px-5 py-3.5 border-b border-[#222] flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-amber-400" />
                    <h3 className="text-sm font-bold text-white">Register Scheduled Cron Task</h3>
                  </div>
                  <button onClick={() => setIsAddingTask(false)} className="text-[#777] hover:text-white">✕</button>
                </div>

                <form onSubmit={handleAddTask} className="p-5 space-y-4 text-xs font-sans">
                  <div>
                    <label className="block text-[#aaa] font-semibold mb-1">Task Title</label>
                    <input
                      type="text"
                      value={newTaskName}
                      onChange={(e) => setNewTaskName(e.target.value)}
                      placeholder="e.g. Daily NVMe SSD Trim"
                      className="w-full bg-[#0a0a0a] border border-[#333] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-[#aaa] font-semibold mb-1">Command Line String</label>
                    <input
                      type="text"
                      value={newTaskCmd}
                      onChange={(e) => setNewTaskCmd(e.target.value)}
                      placeholder="e.g. fstrim -v /dev/nvme0n1p2"
                      className="w-full bg-[#0a0a0a] border border-[#333] rounded-lg px-3 py-2 text-white font-mono focus:outline-none focus:border-amber-500"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[#aaa] font-semibold mb-1">Trigger Type</label>
                      <select
                        value={newTaskTrigger}
                        onChange={(e) => setNewTaskTrigger(e.target.value as TaskTriggerType)}
                        className="w-full bg-[#0a0a0a] border border-[#333] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                      >
                        <option value="CRON">CRON (m h dom mon dow)</option>
                        <option value="INTERVAL">INTERVAL (Periodic)</option>
                        <option value="ON_BOOT">ON_BOOT (System Startup)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[#aaa] font-semibold mb-1">Schedule Expression</label>
                      <input
                        type="text"
                        value={newTaskSchedule}
                        onChange={(e) => setNewTaskSchedule(e.target.value)}
                        placeholder="0 */4 * * *"
                        className="w-full bg-[#0a0a0a] border border-[#333] rounded-lg px-3 py-2 text-white font-mono focus:outline-none focus:border-amber-500"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[#aaa] font-semibold mb-1">Description</label>
                    <input
                      type="text"
                      value={newTaskDesc}
                      onChange={(e) => setNewTaskDesc(e.target.value)}
                      placeholder="Explanation of purpose..."
                      className="w-full bg-[#0a0a0a] border border-[#333] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#222]">
                    <button
                      type="button"
                      onClick={() => setIsAddingTask(false)}
                      className="px-4 py-2 bg-[#222] hover:bg-[#333] rounded-lg text-[#aaa] hover:text-white"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-lg font-semibold"
                    >
                      Register Task
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 6: ENVIRONMENT VARIABLES */}
      {/* ========================================================================= */}
      {activeTab === 'environment' && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 bg-[#131313] p-4 rounded-xl border border-[#222]">
            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-[#666] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Filter variables by key or value..."
                  value={envSearch}
                  onChange={(e) => setEnvSearch(e.target.value)}
                  className="bg-[#0a0a0a] border border-[#333] rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder-[#555] focus:outline-none focus:border-amber-500 w-56"
                />
              </div>

              <div className="flex items-center gap-1 bg-[#0a0a0a] p-1 rounded-lg border border-[#222] text-xs">
                {(['ALL', 'KERNEL_SYSCTL', 'SYSTEM', 'USER'] as const).map((scope) => (
                  <button
                    key={scope}
                    onClick={() => setEnvScopeFilter(scope)}
                    className={`px-2.5 py-1 rounded-md transition-colors ${
                      envScopeFilter === scope
                        ? 'bg-[#252525] text-amber-400 font-semibold'
                        : 'text-[#777] hover:text-[#ccc]'
                    }`}
                  >
                    {scope}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => onRunCliCommand('env')}
                className="px-3 py-1.5 bg-[#181818] hover:bg-[#222] border border-[#333] rounded-lg text-xs text-[#ccc] hover:text-white flex items-center gap-1.5"
              >
                <Terminal className="w-3.5 h-3.5 text-amber-400" />
                <span>CLI env</span>
              </button>

              <button
                onClick={() => setIsAddingEnv(true)}
                className="px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Export Variable</span>
              </button>
            </div>
          </div>

          <div className="bg-[#0e0e0e] border border-[#222] rounded-xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-sans">
                <thead className="bg-[#161616] text-[#888] uppercase text-[10px] tracking-wider border-b border-[#222]">
                  <tr>
                    <th className="py-3 px-4">Scope</th>
                    <th className="py-3 px-4">Key / Node</th>
                    <th className="py-3 px-4">Value Data</th>
                    <th className="py-3 px-4">Description</th>
                    <th className="py-3 px-4 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1c1c1c]">
                  {filteredEnvVars.map((v) => (
                    <tr key={v.key} className="hover:bg-[#151515] transition-colors">
                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-mono ${
                          v.scope === 'KERNEL_SYSCTL'
                            ? 'bg-amber-950/80 text-amber-300 border border-amber-800/60'
                            : v.scope === 'SYSTEM'
                            ? 'bg-blue-950/80 text-blue-300 border border-blue-800/60'
                            : 'bg-purple-950/80 text-purple-300 border border-purple-800/60'
                        }`}>
                          {v.scope}
                        </span>
                      </td>

                      <td className="py-3 px-4 font-mono font-bold text-white text-xs">
                        {v.key}
                      </td>

                      <td className="py-3 px-4 font-mono text-amber-300 max-w-xs truncate">
                        {v.value}
                      </td>

                      <td className="py-3 px-4 text-[#888] text-[11px] max-w-xs truncate">
                        {v.description}
                      </td>

                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => handleOpenEditEnv(v)}
                            className="p-1.5 bg-[#1e1e1e] hover:bg-[#282828] border border-[#333] rounded text-[#ccc] hover:text-white transition-colors"
                            title="Edit parameter"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>

                          {!v.isReadOnly && (
                            <button
                              onClick={() => handleDeleteEnv(v.key)}
                              className="p-1.5 bg-red-950/30 hover:bg-red-900/50 border border-red-900/40 rounded text-red-400 transition-colors"
                              title="Unset variable"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Edit Env Modal */}
          {editingEnv && (
            <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <div className="bg-[#121212] border border-[#2a2a2a] rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-scaleUp">
                <div className="bg-[#181818] px-5 py-3.5 border-b border-[#222] flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Edit3 className="w-4 h-4 text-amber-400" />
                    <h3 className="text-sm font-bold text-white">Edit Parameter: {editingEnv.key}</h3>
                  </div>
                  <button onClick={() => setEditingEnv(null)} className="text-[#777] hover:text-white">✕</button>
                </div>

                <div className="p-5 space-y-4 text-xs font-sans">
                  <div>
                    <label className="block text-[#aaa] font-semibold mb-1">Value Data</label>
                    <input
                      type="text"
                      value={editEnvValue}
                      onChange={(e) => setEditEnvValue(e.target.value)}
                      className="w-full bg-[#0a0a0a] border border-[#333] rounded-lg px-3 py-2 text-white font-mono focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#222]">
                    <button
                      type="button"
                      onClick={() => setEditingEnv(null)}
                      className="px-4 py-2 bg-[#222] hover:bg-[#333] rounded-lg text-[#aaa] hover:text-white"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleSaveEnv}
                      className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-lg font-semibold"
                    >
                      Save Changes
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Add Env Modal */}
          {isAddingEnv && (
            <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <div className="bg-[#121212] border border-[#2a2a2a] rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl animate-scaleUp">
                <div className="bg-[#181818] px-5 py-3.5 border-b border-[#222] flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sliders className="w-4 h-4 text-amber-400" />
                    <h3 className="text-sm font-bold text-white">Create Environment Variable or sysctl</h3>
                  </div>
                  <button onClick={() => setIsAddingEnv(false)} className="text-[#777] hover:text-white">✕</button>
                </div>

                <form onSubmit={handleAddEnv} className="p-5 space-y-4 text-xs font-sans">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[#aaa] font-semibold mb-1">Target Scope</label>
                      <select
                        value={newEnvScope}
                        onChange={(e) => setNewEnvScope(e.target.value as 'SYSTEM' | 'USER' | 'KERNEL_SYSCTL')}
                        className="w-full bg-[#0a0a0a] border border-[#333] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                      >
                        <option value="KERNEL_SYSCTL">KERNEL_SYSCTL (/proc/sys node)</option>
                        <option value="SYSTEM">SYSTEM (All Users)</option>
                        <option value="USER">USER (Session Scope)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[#aaa] font-semibold mb-1">Variable Key / Node</label>
                      <input
                        type="text"
                        value={newEnvKey}
                        onChange={(e) => setNewEnvKey(e.target.value)}
                        placeholder="e.g. vm.dirty_ratio or JAVA_HOME"
                        className="w-full bg-[#0a0a0a] border border-[#333] rounded-lg px-3 py-2 text-white font-mono focus:outline-none focus:border-amber-500"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[#aaa] font-semibold mb-1">Value</label>
                    <input
                      type="text"
                      value={newEnvVal}
                      onChange={(e) => setNewEnvVal(e.target.value)}
                      placeholder="e.g. 20"
                      className="w-full bg-[#0a0a0a] border border-[#333] rounded-lg px-3 py-2 text-white font-mono focus:outline-none focus:border-amber-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-[#aaa] font-semibold mb-1">Description</label>
                    <input
                      type="text"
                      value={newEnvDesc}
                      onChange={(e) => setNewEnvDesc(e.target.value)}
                      placeholder="Explanation of purpose..."
                      className="w-full bg-[#0a0a0a] border border-[#333] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#222]">
                    <button
                      type="button"
                      onClick={() => setIsAddingEnv(false)}
                      className="px-4 py-2 bg-[#222] hover:bg-[#333] rounded-lg text-[#aaa] hover:text-white"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-lg font-semibold"
                    >
                      Export Variable
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 7: REGISTRY & KCONFIG (regedit / HKLM / KCONFIG) */}
      {/* ========================================================================= */}
      {activeTab === 'registry' && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 bg-[#131313] p-4 rounded-xl border border-[#222]">
            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-[#666] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Filter keys or values..."
                  value={registrySearch}
                  onChange={(e) => setRegistrySearch(e.target.value)}
                  className="bg-[#0a0a0a] border border-[#333] rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder-[#555] focus:outline-none focus:border-amber-500 w-56"
                />
              </div>

              <div className="flex items-center gap-1 bg-[#0a0a0a] p-1 rounded-lg border border-[#222] text-xs">
                {(['ALL', 'KCONFIG', 'HKLM', 'HKCU'] as const).map((hive) => (
                  <button
                    key={hive}
                    onClick={() => setSelectedHive(hive)}
                    className={`px-2.5 py-1 rounded-md transition-colors ${
                      selectedHive === hive
                        ? 'bg-[#252525] text-amber-400 font-semibold'
                        : 'text-[#777] hover:text-[#ccc]'
                    }`}
                  >
                    {hive}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => onRunCliCommand('reg query')}
                className="px-3 py-1.5 bg-[#181818] hover:bg-[#222] border border-[#333] rounded-lg text-xs text-[#ccc] hover:text-white flex items-center gap-1.5"
              >
                <Terminal className="w-3.5 h-3.5 text-amber-400" />
                <span>reg query</span>
              </button>

              <button
                onClick={() => setIsAddingRegistry(true)}
                className="px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Create Key</span>
              </button>
            </div>
          </div>

          <div className="bg-[#0e0e0e] border border-[#222] rounded-xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-sans">
                <thead className="bg-[#161616] text-[#888] uppercase text-[10px] tracking-wider border-b border-[#222]">
                  <tr>
                    <th className="py-3 px-4">Hive</th>
                    <th className="py-3 px-4">Key Path & Value Name</th>
                    <th className="py-3 px-4">Type</th>
                    <th className="py-3 px-4">Value Data</th>
                    <th className="py-3 px-4">Description</th>
                    <th className="py-3 px-4 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1c1c1c]">
                  {filteredRegistry.map((r) => (
                    <tr key={r.id} className="hover:bg-[#151515] transition-colors">
                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-mono ${
                          r.hive === 'KCONFIG'
                            ? 'bg-amber-950/80 text-amber-300 border border-amber-800/60'
                            : r.hive === 'HKLM'
                            ? 'bg-blue-950/80 text-blue-300 border border-blue-800/60'
                            : 'bg-purple-950/80 text-purple-300 border border-purple-800/60'
                        }`}>
                          {r.hive}
                        </span>
                      </td>

                      <td className="py-3 px-4">
                        <div className="font-semibold text-white font-mono text-xs">{r.valueName}</div>
                        <div className="text-[11px] text-[#777] font-mono truncate max-w-xs">{r.keyPath}</div>
                      </td>

                      <td className="py-3 px-4 font-mono text-[#aaa]">
                        <span className="px-2 py-0.5 bg-[#181818] border border-[#333] rounded text-[10px]">
                          {r.valueType}
                        </span>
                      </td>

                      <td className="py-3 px-4 font-mono text-amber-300 max-w-xs truncate">
                        {String(r.value)}
                      </td>

                      <td className="py-3 px-4 text-[#888] text-[11px] max-w-xs truncate">
                        {r.description}
                      </td>

                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => handleOpenEditRegistry(r)}
                            className="p-1.5 bg-[#1e1e1e] hover:bg-[#282828] border border-[#333] rounded text-[#ccc] hover:text-white transition-colors"
                            title="Edit registry value"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => handleDeleteRegistry(r.id, r.valueName)}
                            className="p-1.5 bg-red-950/30 hover:bg-red-900/50 border border-red-900/40 rounded text-red-400 transition-colors"
                            title="Delete key"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Edit Registry Modal */}
          {editingRegistryEntry && (
            <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <div className="bg-[#121212] border border-[#2a2a2a] rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-scaleUp">
                <div className="bg-[#181818] px-5 py-3.5 border-b border-[#222] flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Edit3 className="w-4 h-4 text-amber-400" />
                    <h3 className="text-sm font-bold text-white">Edit Registry: {editingRegistryEntry.valueName}</h3>
                  </div>
                  <button onClick={() => setEditingRegistryEntry(null)} className="text-[#777] hover:text-white">✕</button>
                </div>

                <div className="p-5 space-y-4 text-xs font-sans">
                  <div>
                    <span className="text-[#777] block text-[11px]">Path: {editingRegistryEntry.hive}\{editingRegistryEntry.keyPath}</span>
                    <span className="text-[#777] block text-[11px]">Type: {editingRegistryEntry.valueType}</span>
                  </div>

                  <div>
                    <label className="block text-[#aaa] font-semibold mb-1">Value Data</label>
                    <input
                      type="text"
                      value={editRegistryValue}
                      onChange={(e) => setEditRegistryValue(e.target.value)}
                      className="w-full bg-[#0a0a0a] border border-[#333] rounded-lg px-3 py-2 text-white font-mono focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#222]">
                    <button
                      type="button"
                      onClick={() => setEditingRegistryEntry(null)}
                      className="px-4 py-2 bg-[#222] hover:bg-[#333] rounded-lg text-[#aaa] hover:text-white"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleSaveRegistryValue}
                      className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-lg font-semibold"
                    >
                      Save Changes
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Add Registry Key Modal */}
          {isAddingRegistry && (
            <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <div className="bg-[#121212] border border-[#2a2a2a] rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl animate-scaleUp">
                <div className="bg-[#181818] px-5 py-3.5 border-b border-[#222] flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Database className="w-4 h-4 text-amber-400" />
                    <h3 className="text-sm font-bold text-white">Create Registry / KConfig Key</h3>
                  </div>
                  <button onClick={() => setIsAddingRegistry(false)} className="text-[#777] hover:text-white">✕</button>
                </div>

                <form onSubmit={handleAddRegistryEntry} className="p-5 space-y-4 text-xs font-sans">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[#aaa] font-semibold mb-1">Target Hive</label>
                      <select
                        value={newRegHive}
                        onChange={(e) => setNewRegHive(e.target.value as RegistryHive)}
                        className="w-full bg-[#0a0a0a] border border-[#333] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                      >
                        <option value="KCONFIG">KCONFIG (Ring 0 Kernel)</option>
                        <option value="HKLM">HKEY_LOCAL_MACHINE</option>
                        <option value="HKCU">HKEY_CURRENT_USER</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[#aaa] font-semibold mb-1">Value Type</label>
                      <select
                        value={newRegType}
                        onChange={(e) => setNewRegType(e.target.value as RegistryValueType)}
                        className="w-full bg-[#0a0a0a] border border-[#333] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                      >
                        <option value="REG_DWORD">REG_DWORD (32-bit Integer)</option>
                        <option value="REG_SZ">REG_SZ (String)</option>
                        <option value="BOOL">BOOL (Boolean Flag)</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[#aaa] font-semibold mb-1">Key Path</label>
                    <input
                      type="text"
                      value={newRegPath}
                      onChange={(e) => setNewRegPath(e.target.value)}
                      placeholder="e.g. CONFIG_SCHEDULER"
                      className="w-full bg-[#0a0a0a] border border-[#333] rounded-lg px-3 py-2 text-white font-mono focus:outline-none focus:border-amber-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-[#aaa] font-semibold mb-1">Value Name</label>
                    <input
                      type="text"
                      value={newRegName}
                      onChange={(e) => setNewRegName(e.target.value)}
                      placeholder="e.g. CONFIG_RR_TIMESLICE_MS"
                      className="w-full bg-[#0a0a0a] border border-[#333] rounded-lg px-3 py-2 text-white font-mono focus:outline-none focus:border-amber-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-[#aaa] font-semibold mb-1">Initial Data Value</label>
                    <input
                      type="text"
                      value={newRegValue}
                      onChange={(e) => setNewRegValue(e.target.value)}
                      placeholder="e.g. 10"
                      className="w-full bg-[#0a0a0a] border border-[#333] rounded-lg px-3 py-2 text-white font-mono focus:outline-none focus:border-amber-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-[#aaa] font-semibold mb-1">Description</label>
                    <input
                      type="text"
                      value={newRegDesc}
                      onChange={(e) => setNewRegDesc(e.target.value)}
                      placeholder="Explanation of purpose..."
                      className="w-full bg-[#0a0a0a] border border-[#333] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#222]">
                    <button
                      type="button"
                      onClick={() => setIsAddingRegistry(false)}
                      className="px-4 py-2 bg-[#222] hover:bg-[#333] rounded-lg text-[#aaa] hover:text-white"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-lg font-semibold"
                    >
                      Create Key
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 8: SOUND SYSTEM & EVENT ALERTS (PipeWire / WebAudio) */}
      {/* ========================================================================= */}
      {activeTab === 'sounds' && (
        <SoundSystemManagerGUI onRunCliCommand={onRunCliCommand} />
      )}

      {/* ========================================================================= */}
      {/* TAB 9: MULTI-MONITOR DISPLAY TOPOLOGY & RESOLUTIONS (xrandr / Wayland) */}
      {/* ========================================================================= */}
      {activeTab === 'monitors' && (
        <DisplayTopologyGUI onRunCliCommand={onRunCliCommand} />
      )}

      {/* ========================================================================= */}
      {/* TAB 10: LOCKSCREEN ANIMATION STUDIO & LINUX EXPORTER (Hyprlock / Swaylock) */}
      {/* ========================================================================= */}
      {activeTab === 'lockscreen' && (
        <LockscreenAnimationStudio onRunCliCommand={onRunCliCommand} />
      )}
    </div>
  );
};
