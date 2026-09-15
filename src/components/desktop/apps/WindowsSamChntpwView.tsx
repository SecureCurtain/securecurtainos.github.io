// jb7572_2026-08-26: SecureCurtain Core Architecture - Diamond-Grade Offline Windows SAM & Registry Editor (chntpw)
// Updated 2026-09-04: Added Offline Registry Persistence Scanner for Malicious Services & explorer.exe Shell Hijacks
import React, { useState } from 'react';
import {
  Key,
  ShieldAlert,
  ShieldCheck,
  UserCheck,
  Lock,
  Unlock,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  Terminal,
  Copy,
  FolderOpen,
  FileCode2,
  Trash2,
  Zap,
  Sliders,
  UserPlus,
  Layers,
  Search,
  Check,
  RotateCcw,
  Cpu,
  Power,
  AppWindow,
  FileText
} from 'lucide-react';

interface WindowsLocalUser {
  rid: string;
  username: string;
  isAdmin: boolean;
  isLocked: boolean;
  isDisabled: boolean;
  passwordStatus: 'Has Password' | 'Blank / Cleared';
}

export type PersistenceCategory = 
  | 'ALL' 
  | 'SERVICES' 
  | 'EXPLORER_SHELL_HIJACK' 
  | 'WINLOGON_USERINIT' 
  | 'IFEO_DEBUGGER' 
  | 'RUN_RUNONCE';

export interface RegistryPersistenceItem {
  id: string;
  category: 'SERVICES' | 'EXPLORER_SHELL_HIJACK' | 'WINLOGON_USERINIT' | 'IFEO_DEBUGGER' | 'RUN_RUNONCE';
  hive: 'SYSTEM' | 'SOFTWARE';
  keyPath: string;
  valueName: string;
  currentValue: string;
  cleanDefaultValue?: string;
  verdict: string;
  mitreTechnique: string;
  isMalicious: boolean;
  serviceMetadata?: {
    serviceName: string;
    startType: string;
    binaryPath: string;
  };
  status: 'FLAGGED' | 'REMEDIATED' | 'DISABLED' | 'SAFE';
}

const SAMPLE_USERS: WindowsLocalUser[] = [
  {
    rid: '0x01f4 (500)',
    username: 'Administrator',
    isAdmin: true,
    isLocked: false,
    isDisabled: true,
    passwordStatus: 'Has Password'
  },
  {
    rid: '0x03e9 (1001)',
    username: 'LockedCorporateUser',
    isAdmin: false,
    isLocked: true,
    isDisabled: false,
    passwordStatus: 'Has Password'
  },
  {
    rid: '0x03ea (1002)',
    username: 'LocalTechAdmin',
    isAdmin: true,
    isLocked: false,
    isDisabled: false,
    passwordStatus: 'Has Password'
  }
];

const INITIAL_PERSISTENCE_ITEMS: RegistryPersistenceItem[] = [
  // 1. explorer.exe Shell Hijack (Winlogon\Shell)
  {
    id: 'shell_hijack_1',
    category: 'EXPLORER_SHELL_HIJACK',
    hive: 'SOFTWARE',
    keyPath: 'HKLM\\SOFTWARE\\Microsoft\\Windows NT\\CurrentVersion\\Winlogon',
    valueName: 'Shell',
    currentValue: 'explorer.exe, C:\\Users\\Public\\svchost_updater.exe',
    cleanDefaultValue: 'explorer.exe',
    verdict: 'Malicious secondary binary appended to default explorer.exe desktop shell launcher.',
    mitreTechnique: 'T1547.001 (Logon Script / Shell Launcher Hijack)',
    isMalicious: true,
    status: 'FLAGGED'
  },
  // 2. Winlogon Userinit Hijack
  {
    id: 'userinit_hijack_2',
    category: 'WINLOGON_USERINIT',
    hive: 'SOFTWARE',
    keyPath: 'HKLM\\SOFTWARE\\Microsoft\\Windows NT\\CurrentVersion\\Winlogon',
    valueName: 'Userinit',
    currentValue: 'C:\\Windows\\system32\\userinit.exe, C:\\ProgramData\\Telemetry\\beacon.exe',
    cleanDefaultValue: 'C:\\Windows\\system32\\userinit.exe,',
    verdict: 'C2 beacon appended to Userinit logon process; runs before Windows desktop shell initializes.',
    mitreTechnique: 'T1547.004 (Winlogon Helper DLL & Userinit Hijack)',
    isMalicious: true,
    status: 'FLAGGED'
  },
  // 3. Image File Execution Options (IFEO) explorer.exe Debugger Interception
  {
    id: 'ifeo_debugger_3',
    category: 'IFEO_DEBUGGER',
    hive: 'SOFTWARE',
    keyPath: 'HKLM\\SOFTWARE\\Microsoft\\Windows NT\\CurrentVersion\\Image File Execution Options\\explorer.exe',
    valueName: 'Debugger',
    currentValue: 'C:\\Windows\\Temp\\debugger_proxy.exe',
    cleanDefaultValue: '<None / Key Deleted>',
    verdict: 'IFEO Debugger Hook: Diverts every execution of explorer.exe into malicious proxy wrapper.',
    mitreTechnique: 'T1546.012 (Image File Execution Options Hijacking)',
    isMalicious: true,
    status: 'FLAGGED'
  },
  // 4. Malicious Windows Service: Disguised Miner
  {
    id: 'service_miner_4',
    category: 'SERVICES',
    hive: 'SYSTEM',
    keyPath: 'HKLM\\SYSTEM\\CurrentControlSet\\Services\\WinDefSvcHelper',
    valueName: 'ImagePath',
    currentValue: 'C:\\Users\\Public\\svchost_miner.exe',
    verdict: 'Rogue Service: Masquerading service configured to launch cryptocurrency miner on system boot.',
    mitreTechnique: 'T1543.003 (Windows Service Creation / Execution)',
    isMalicious: true,
    serviceMetadata: {
      serviceName: 'WinDefSvcHelper',
      startType: 'Automatic (Start=2)',
      binaryPath: 'C:\\Users\\Public\\svchost_miner.exe'
    },
    status: 'FLAGGED'
  },
  // 5. Malicious Windows Service: BYOVD Rootkit Driver
  {
    id: 'service_byovd_5',
    category: 'SERVICES',
    hive: 'SYSTEM',
    keyPath: 'HKLM\\SYSTEM\\CurrentControlSet\\Services\\KProcFilterDriver',
    valueName: 'ImagePath',
    currentValue: '\\??\\C:\\Windows\\Temp\\rootkit_x64.sys',
    verdict: 'Kernel Rootkit Service: Loads vulnerable signed kernel driver (BYOVD) during early OS boot.',
    mitreTechnique: 'T1068 / T1543.003 (Kernel Driver Service Persistence)',
    isMalicious: true,
    serviceMetadata: {
      serviceName: 'KProcFilterDriver',
      startType: 'System Boot (Start=1)',
      binaryPath: 'C:\\Windows\\Temp\\rootkit_x64.sys'
    },
    status: 'FLAGGED'
  },
  // 6. Malicious Windows Service: Svchost DLL Hijack (ServiceDll)
  {
    id: 'service_svchost_dll_6',
    category: 'SERVICES',
    hive: 'SYSTEM',
    keyPath: 'HKLM\\SYSTEM\\CurrentControlSet\\Services\\RpcNetBroker\\Parameters',
    valueName: 'ServiceDll',
    currentValue: 'C:\\ProgramData\\AppUpdate\\payload.dll',
    verdict: 'Shared Service DLL Hijack: Loaded by svchost.exe -k netsvcs with SYSTEM privileges.',
    mitreTechnique: 'T1543.003 (Shared Service DLL Hijacking)',
    isMalicious: true,
    serviceMetadata: {
      serviceName: 'RpcNetBroker',
      startType: 'Automatic (Start=2)',
      binaryPath: 'svchost.exe -k netsvcs'
    },
    status: 'FLAGGED'
  },
  // 7. Classic Run Key Malware
  {
    id: 'run_malware_7',
    category: 'RUN_RUNONCE',
    hive: 'SOFTWARE',
    keyPath: 'HKLM\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Run',
    valueName: 'CryptoMinerWatchdog',
    currentValue: 'C:\\Users\\Public\\miner_watchdog.vbs',
    cleanDefaultValue: '<Deleted>',
    verdict: 'VBScript watchdog re-spawning terminated malware payloads upon every user logon.',
    mitreTechnique: 'T1547.001 (Registry Run / Startup Folder)',
    isMalicious: true,
    status: 'FLAGGED'
  },
  // 8. Safe Legitimate Audio Driver (Benchmark)
  {
    id: 'run_legit_8',
    category: 'RUN_RUNONCE',
    hive: 'SOFTWARE',
    keyPath: 'HKLM\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Run',
    valueName: 'RealtekAudioService',
    currentValue: 'C:\\Program Files\\Realtek\\Audio\\RtkAudioService64.exe',
    verdict: 'Legitimate OEM Audio Driver Control Panel.',
    mitreTechnique: 'None (Safe OEM Binary)',
    isMalicious: false,
    status: 'SAFE'
  }
];

interface WindowsSamChntpwViewProps {
  addNotification?: (notification: any) => void;
}

export const WindowsSamChntpwView: React.FC<WindowsSamChntpwViewProps> = ({ addNotification }) => {
  const [activeMainTab, setActiveMainTab] = useState<'USERS_SAM' | 'PERSISTENCE_SCAN'>('PERSISTENCE_SCAN');
  const [windowsMountPath, setWindowsMountPath] = useState<string>('/mnt/windows_sys/Windows/System32/config');
  const [users, setUsers] = useState<WindowsLocalUser[]>(SAMPLE_USERS);
  const [persistenceItems, setPersistenceItems] = useState<RegistryPersistenceItem[]>(INITIAL_PERSISTENCE_ITEMS);
  const [selectedCategory, setSelectedCategory] = useState<PersistenceCategory>('ALL');
  const [searchFilter, setSearchFilter] = useState('');
  const [isScanningHives, setIsScanningHives] = useState(false);
  const [selectedItemId, setSelectedItemId] = useState<string>(INITIAL_PERSISTENCE_ITEMS[0].id);

  const [chntpwLogs, setChntpwLogs] = useState<string[]>([
    '[*] Windows Offline Registry Hive Subsystem Initialized (chntpw v0.99.8 & hivex v1.3.23)',
    '[+] Target Mounted Partition: /mnt/windows_sys (Read-Write Safe Overlay)',
    '[+] Loaded SAM Hive: /mnt/windows_sys/Windows/System32/config/SAM (64 KB)',
    '[+] Loaded SYSTEM Hive: /mnt/windows_sys/Windows/System32/config/SYSTEM (18.4 MB)',
    '[+] Loaded SOFTWARE Hive: /mnt/windows_sys/Windows/System32/config/SOFTWARE (54.2 MB)',
    '[!] Registry Anomaly Scanner: Evaluated Winlogon, IFEO, ShellServiceObjects, and Services trees.'
  ]);

  const activeSelectedItem = persistenceItems.find(i => i.id === selectedItemId) || persistenceItems[0];

  // User Actions
  const handleBlankPassword = (rid: string) => {
    setUsers(prev => prev.map(u => {
      if (u.rid === rid) {
        const updated = {
          ...u,
          passwordStatus: 'Blank / Cleared' as const,
          isLocked: false,
          isDisabled: false
        };
        setChntpwLogs(l => [
          ...l,
          `[chntpw] User '${u.username}' (${u.rid}) password BLANKED (0x00 bytes). Account UNLOCKED and ENABLED.`
        ]);
        if (addNotification) {
          addNotification({
            title: 'Windows Password Cleared',
            message: `User '${u.username}' password was successfully reset to empty. Account unlocked.`,
            type: 'success'
          });
        }
        return updated;
      }
      return u;
    }));
  };

  const handlePromoteAdmin = (rid: string) => {
    setUsers(prev => prev.map(u => {
      if (u.rid === rid) {
        const updated = {
          ...u,
          isAdmin: true
        };
        setChntpwLogs(l => [
          ...l,
          `[chntpw] User '${u.username}' (${u.rid}) added to RID 0x220 (Builtin\\Administrators Group).`
        ]);
        if (addNotification) {
          addNotification({
            title: 'Promoted to Administrator',
            message: `User '${u.username}' now has full local administrator privileges.`,
            type: 'success'
          });
        }
        return updated;
      }
      return u;
    }));
  };

  // Persistence Remediation Handlers
  const handleRestoreDefault = (item: RegistryPersistenceItem) => {
    setPersistenceItems(prev => prev.map(p => {
      if (p.id === item.id) {
        return {
          ...p,
          currentValue: p.cleanDefaultValue || 'explorer.exe',
          status: 'REMEDIATED'
        };
      }
      return p;
    }));

    setChntpwLogs(l => [
      ...l,
      `[hivex] Restored '${item.valueName}' in '${item.keyPath}' back to default '${item.cleanDefaultValue}'`,
      `[✓] Explorer shell launch hijack neutralized.`
    ]);

    if (addNotification) {
      addNotification({
        title: 'Explorer Shell Hijack Neutralized',
        message: `Restored ${item.valueName} to clean Windows default (${item.cleanDefaultValue}).`,
        type: 'success'
      });
    }
  };

  const handleDisableService = (item: RegistryPersistenceItem) => {
    setPersistenceItems(prev => prev.map(p => {
      if (p.id === item.id) {
        return {
          ...p,
          status: 'DISABLED',
          serviceMetadata: p.serviceMetadata ? {
            ...p.serviceMetadata,
            startType: 'Disabled (Start=4)'
          } : undefined
        };
      }
      return p;
    }));

    setChntpwLogs(l => [
      ...l,
      `[hivex] Modified Service '${item.serviceMetadata?.serviceName}': Start value changed from 2 to 4 (Disabled).`,
      `[✓] Malicious service disabled from booting with Windows.`
    ]);

    if (addNotification) {
      addNotification({
        title: 'Malicious Service Disabled',
        message: `Service ${item.serviceMetadata?.serviceName} disabled (Start=4 in SYSTEM hive).`,
        type: 'success'
      });
    }
  };

  const handleDeleteEntry = (item: RegistryPersistenceItem) => {
    setPersistenceItems(prev => prev.map(p => {
      if (p.id === item.id) {
        return {
          ...p,
          currentValue: '<DELETED BY RESCUE USB>',
          status: 'REMEDIATED'
        };
      }
      return p;
    }));

    setChntpwLogs(l => [
      ...l,
      `[hivex] Deleted registry key / value '${item.valueName}' from '${item.keyPath}'.`,
      `[✓] Offline persistence vector completely eradicated.`
    ]);

    if (addNotification) {
      addNotification({
        title: 'Persistence Key Purged',
        message: `Purged ${item.valueName} from offline registry.`,
        type: 'success'
      });
    }
  };

  const handleScanOfflineHives = () => {
    setIsScanningHives(true);
    setChntpwLogs(l => [
      ...l,
      '[*] INITIATING OFFLINE REGISTRY PERSISTENCE SCAN...',
      '[hivex] Scanning SYSTEM\\CurrentControlSet\\Services for rogue ImagePath and ServiceDll values...',
      '[hivex] Inspecting SOFTWARE\\Microsoft\\Windows NT\\CurrentVersion\\Winlogon (Shell, Userinit)...',
      '[hivex] Checking Image File Execution Options (IFEO) for Debugger redirection...'
    ]);

    setTimeout(() => {
      setIsScanningHives(false);
      setChntpwLogs(l => [
        ...l,
        '[!] SCAN RESULTS: 6 Active Persistence Hijacks Flagged across SYSTEM & SOFTWARE hives!',
        '[!] Flagged: Winlogon Shell Hijack, IFEO Debugger Hook, 3 Malicious Services (Miner, BYOVD Rootkit, SvcHost DLL).'
      ]);

      if (addNotification) {
        addNotification({
          title: 'Offline Registry Scan Complete',
          message: 'Found 6 persistence vectors including explorer.exe shell hijack and rogue services.',
          type: 'warning'
        });
      }
    }, 1500);
  };

  const filteredPersistenceItems = persistenceItems.filter(item => {
    const matchesCategory = selectedCategory === 'ALL' || item.category === selectedCategory;
    const matchesSearch = item.valueName.toLowerCase().includes(searchFilter.toLowerCase()) ||
                          item.currentValue.toLowerCase().includes(searchFilter.toLowerCase()) ||
                          item.keyPath.toLowerCase().includes(searchFilter.toLowerCase()) ||
                          item.verdict.toLowerCase().includes(searchFilter.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const activeThreatsCount = persistenceItems.filter(i => i.isMalicious && i.status === 'FLAGGED').length;

  const getCliCommand = () => {
    return `# 1. Scan and Fix Explorer.exe Shell Launch Hijack (Winlogon\\Shell)
hivexsh /mnt/windows_sys/Windows/System32/config/SOFTWARE
cd Microsoft\\Windows NT\\CurrentVersion\\Winlogon
setval Shell string:explorer.exe
commit

# 2. Disable Malicious Windows Service (WinDefSvcHelper -> Start=4)
hivexsh /mnt/windows_sys/Windows/System32/config/SYSTEM
cd ControlSet001\\Services\\WinDefSvcHelper
setval Start dword:4
commit

# 3. Purge IFEO explorer.exe Debugger Interception
hivexregedit --merge --write /mnt/windows_sys/Windows/System32/config/SOFTWARE clean_ifeo.reg`;
  };

  return (
    <div className="space-y-4">
      {/* Header Banner */}
      <div className="bg-[#0c0f18] p-4 rounded-xl border border-[#1b2234] flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-indigo-950/80 border border-indigo-500/40 text-indigo-400 shadow-md shadow-indigo-950/50">
            <Key className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold font-mono text-white">Offline Windows SAM & Registry Persistence Cleaner</h3>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-500/30">
                CHNTPW / HIVEX OFFLINE DISINFECTOR
              </span>
            </div>
            <p className="text-xs text-[#8fa0b5] mt-0.5">
              Reset SAM passwords, eradicate malicious Windows Services, and neutralize explorer.exe shell launches / IFEO debugger hijacks without booting the OS.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleScanOfflineHives}
            disabled={isScanningHives}
            className="px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-mono text-xs font-bold flex items-center gap-1.5 transition-all shadow-md shadow-indigo-600/20"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isScanningHives ? 'animate-spin' : ''}`} />
            <span>{isScanningHives ? 'Scanning Hives...' : 'Scan Registry Hives'}</span>
          </button>
        </div>
      </div>

      {/* Main Mode Tabs */}
      <div className="flex items-center space-x-2 border-b border-slate-800 pb-2">
        <button
          onClick={() => setActiveMainTab('PERSISTENCE_SCAN')}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold font-mono transition-all flex items-center gap-2 ${
            activeMainTab === 'PERSISTENCE_SCAN'
              ? 'bg-rose-600 text-white shadow-md shadow-rose-600/20'
              : 'bg-slate-900 text-slate-400 hover:text-white'
          }`}
        >
          <ShieldAlert className="w-3.5 h-3.5" />
          <span>Services & Explorer.exe Launch Hijacks</span>
          {activeThreatsCount > 0 && (
            <span className="px-1.5 py-0.2 rounded-full bg-black/40 text-[10px] text-rose-200 border border-rose-400/40">
              {activeThreatsCount} Threats
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveMainTab('USERS_SAM')}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold font-mono transition-all flex items-center gap-2 ${
            activeMainTab === 'USERS_SAM'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
              : 'bg-slate-900 text-slate-400 hover:text-white'
          }`}
        >
          <UserCheck className="w-3.5 h-3.5" />
          <span>SAM Local User Accounts ({users.length})</span>
        </button>
      </div>

      {/* TAB 1: REGISTRY PERSISTENCE SCANNER (Services & Explorer Launch Hijacks) */}
      {activeMainTab === 'PERSISTENCE_SCAN' && (
        <div className="space-y-4">
          {/* Quick HUD Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs font-mono">
            <div className="p-3 rounded-lg bg-[#070a13] border border-slate-800">
              <div className="text-slate-400">Total Scanned Vectors:</div>
              <div className="text-white font-bold">{persistenceItems.length} Registry Keys</div>
            </div>
            <div className="p-3 rounded-lg bg-[#070a13] border border-slate-800">
              <div className="text-slate-400">Active Threats Flagged:</div>
              <div className="text-rose-400 font-bold">{activeThreatsCount} Hijacks</div>
            </div>
            <div className="p-3 rounded-lg bg-[#070a13] border border-slate-800">
              <div className="text-slate-400">Remediated / Cleaned:</div>
              <div className="text-emerald-400 font-bold">
                {persistenceItems.filter(i => i.status === 'REMEDIATED' || i.status === 'DISABLED').length} Restored
              </div>
            </div>
            <div className="p-3 rounded-lg bg-[#070a13] border border-slate-800">
              <div className="text-slate-400">Target Hives:</div>
              <div className="text-sky-300 font-bold">SYSTEM & SOFTWARE</div>
            </div>
          </div>

          {/* Filter Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <div className="relative w-full sm:w-72">
              <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Filter services, explorer hijacks, keys..."
                value={searchFilter}
                onChange={e => setSearchFilter(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-[#0a0e17] border border-slate-700 text-white font-mono text-xs focus:border-indigo-500 outline-none"
              />
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto text-[10px] font-mono">
              {(['ALL', 'SERVICES', 'EXPLORER_SHELL_HIJACK', 'WINLOGON_USERINIT', 'IFEO_DEBUGGER', 'RUN_RUNONCE'] as PersistenceCategory[]).map(cat => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-2.5 py-1 rounded transition-all whitespace-nowrap ${
                    selectedCategory === cat
                      ? 'bg-rose-600 text-white font-bold'
                      : 'bg-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  {cat.replace(/_/g, ' ')}
                </button>
              ))}
            </div>
          </div>

          {/* Master-Detail Split Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            {/* Left 7 Columns: Persistence Items List */}
            <div className="lg:col-span-7 space-y-2.5">
              {filteredPersistenceItems.map(item => {
                const isSelected = item.id === activeSelectedItem.id;
                return (
                  <div
                    key={item.id}
                    onClick={() => setSelectedItemId(item.id)}
                    className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-[#191218] border-rose-500/60 shadow-lg shadow-rose-500/10 ring-1 ring-rose-500/30'
                        : item.isMalicious && item.status === 'FLAGGED'
                        ? 'bg-[#120a10] border-rose-900/60 hover:bg-[#180e15]'
                        : item.status === 'REMEDIATED' || item.status === 'DISABLED'
                        ? 'bg-[#08130d] border-emerald-900/50'
                        : 'bg-[#0a0e17] border-slate-800 hover:bg-[#0f1422]'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center space-x-2">
                        {item.category === 'SERVICES' ? (
                          <Cpu className="w-4 h-4 text-purple-400 shrink-0" />
                        ) : item.category === 'EXPLORER_SHELL_HIJACK' ? (
                          <AppWindow className="w-4 h-4 text-rose-400 shrink-0" />
                        ) : (
                          <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                        )}
                        <span className="font-bold text-xs text-white truncate max-w-[240px]">
                          {item.valueName} ({item.hive} Hive)
                        </span>
                      </div>

                      <span className={`text-[10px] px-2 py-0.5 rounded font-mono font-bold ${
                        item.status === 'FLAGGED'
                          ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                          : item.status === 'REMEDIATED'
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                          : item.status === 'DISABLED'
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                          : 'bg-slate-800 text-slate-300 border border-slate-700'
                      }`}>
                        {item.status}
                      </span>
                    </div>

                    <div className="text-[10px] text-slate-400 font-mono truncate mb-1">
                      {item.keyPath}
                    </div>

                    <div className="p-1.5 rounded bg-black/50 text-[11px] font-mono text-amber-300 break-all select-all border border-slate-800/80">
                      {item.currentValue}
                    </div>

                    <div className="flex items-center justify-between text-[10px] text-slate-400 pt-2">
                      <span className="text-slate-300">{item.verdict}</span>
                      <span className="text-purple-300 font-mono font-semibold">{item.category.replace(/_/g, ' ')}</span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Right 5 Columns: Selected Threat Deep-Dive & Remediation */}
            <div className="lg:col-span-5 bg-[#0a0e17] p-4 rounded-xl border border-slate-800 space-y-4">
              <div className="border-b border-slate-800 pb-2.5">
                <div className="text-[10px] text-slate-400 uppercase font-mono">Persistence Vector Dissection</div>
                <h4 className="text-sm font-bold text-white font-mono flex items-center gap-2">
                  <span>{activeSelectedItem.valueName}</span>
                  <span className="text-xs px-2 py-0.5 rounded bg-purple-950 text-purple-300 border border-purple-800 font-normal">
                    {activeSelectedItem.hive} Hive
                  </span>
                </h4>
              </div>

              <div className="space-y-2.5 text-xs font-mono">
                <div className="p-2.5 rounded-lg bg-[#05070d] border border-slate-800 space-y-1">
                  <div className="text-slate-400 text-[10px]">FULL REGISTRY HIVE PATH:</div>
                  <div className="text-white text-[11px] break-all select-all">{activeSelectedItem.keyPath}</div>
                </div>

                <div className="p-2.5 rounded-lg bg-[#05070d] border border-slate-800 space-y-1">
                  <div className="text-slate-400 text-[10px]">CURRENT ASSIGNED VALUE:</div>
                  <div className="text-amber-300 text-[11px] break-all select-all font-bold">{activeSelectedItem.currentValue}</div>
                </div>

                {activeSelectedItem.cleanDefaultValue && (
                  <div className="p-2.5 rounded-lg bg-emerald-950/20 border border-emerald-900/40 space-y-1">
                    <div className="text-emerald-400 text-[10px] font-bold">EXPECTED CLEAN WINDOWS DEFAULT:</div>
                    <div className="text-emerald-300 text-[11px] font-bold">{activeSelectedItem.cleanDefaultValue}</div>
                  </div>
                )}

                {activeSelectedItem.serviceMetadata && (
                  <div className="p-2.5 rounded-lg bg-[#080d1a] border border-blue-900/40 space-y-1">
                    <div className="text-blue-400 text-[10px] font-bold">SERVICE PARAMETERS (SYSTEM HIVE):</div>
                    <div className="text-slate-300 text-[11px]">Service Name: <strong className="text-white">{activeSelectedItem.serviceMetadata.serviceName}</strong></div>
                    <div className="text-slate-300 text-[11px]">Start Type: <strong className="text-amber-300">{activeSelectedItem.serviceMetadata.startType}</strong></div>
                    <div className="text-slate-300 text-[11px] truncate">Binary: <strong className="text-white">{activeSelectedItem.serviceMetadata.binaryPath}</strong></div>
                  </div>
                )}

                <div className="p-2.5 rounded-lg bg-rose-950/20 border border-rose-900/40 text-[11px] text-rose-300 space-y-1">
                  <div className="font-bold flex items-center gap-1 text-rose-400">
                    <ShieldAlert className="w-3.5 h-3.5" />
                    <span>MITRE ATT&CK Correlation</span>
                  </div>
                  <div>{activeSelectedItem.mitreTechnique}</div>
                  <div className="text-slate-300 text-[10px]">{activeSelectedItem.verdict}</div>
                </div>
              </div>

              {/* Remediation Action Buttons */}
              <div className="pt-2 border-t border-slate-800 space-y-2">
                <div className="text-xs font-bold text-white">Live Rescue USB Remediation:</div>

                {activeSelectedItem.category === 'EXPLORER_SHELL_HIJACK' || activeSelectedItem.category === 'WINLOGON_USERINIT' ? (
                  <button
                    onClick={() => handleRestoreDefault(activeSelectedItem)}
                    disabled={activeSelectedItem.status === 'REMEDIATED'}
                    className="w-full py-2 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-mono text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-md shadow-emerald-600/20"
                  >
                    <RotateCcw className="w-4 h-4" />
                    <span>Restore Safe Default ({activeSelectedItem.cleanDefaultValue})</span>
                  </button>
                ) : activeSelectedItem.category === 'SERVICES' ? (
                  <div className="space-y-2">
                    <button
                      onClick={() => handleDisableService(activeSelectedItem)}
                      disabled={activeSelectedItem.status === 'DISABLED'}
                      className="w-full py-2 px-3 rounded-lg bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white font-mono text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-md shadow-amber-600/20"
                    >
                      <Power className="w-4 h-4" />
                      <span>Disable Service (Set Start=4 in SYSTEM hive)</span>
                    </button>

                    <button
                      onClick={() => handleDeleteEntry(activeSelectedItem)}
                      disabled={activeSelectedItem.status === 'REMEDIATED'}
                      className="w-full py-1.5 px-3 rounded-lg bg-rose-900 hover:bg-rose-800 disabled:opacity-50 text-white font-mono text-xs font-bold flex items-center justify-center gap-2 transition-all"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Delete Service Subkey Completely</span>
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => handleDeleteEntry(activeSelectedItem)}
                    disabled={activeSelectedItem.status === 'REMEDIATED'}
                    className="w-full py-2 px-3 rounded-lg bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white font-mono text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-md shadow-rose-600/20"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>Purge Rogue Persistence Key</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: LOCAL USERS (SAM HIVE) */}
      {activeMainTab === 'USERS_SAM' && (
        <div className="bg-[#0c0f18] p-4 rounded-xl border border-[#1b2234] space-y-3">
          <div className="flex items-center justify-between border-b border-[#1b2234] pb-2">
            <div className="flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-indigo-400" />
              <span className="text-xs font-bold font-mono text-white uppercase">Local Windows Users in Offline SAM Hive</span>
            </div>
            <span className="text-[10px] font-mono text-emerald-400">{users.length} Accounts Found</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {users.map(u => (
              <div
                key={u.rid}
                className="p-3.5 rounded-lg bg-[#101422] border border-[#1e273e] space-y-2.5 text-xs font-mono"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-white font-bold text-sm">{u.username}</span>
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-[#172033] text-sky-300">
                        RID: {u.rid}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-[10px] text-[#8fa0b5] pt-1">
                      <span className={u.isAdmin ? 'text-amber-300 font-bold' : ''}>
                        {u.isAdmin ? '★ Administrator' : 'Standard User'}
                      </span>
                      <span>•</span>
                      <span className={u.passwordStatus === 'Blank / Cleared' ? 'text-emerald-400 font-bold' : ''}>
                        {u.passwordStatus}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {u.isLocked && (
                      <span className="text-[10px] px-2 py-0.5 rounded bg-red-950 text-red-300 border border-red-500/30 font-bold">
                        LOCKED
                      </span>
                    )}
                    {u.isDisabled && (
                      <span className="text-[10px] px-2 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-500/30 font-bold">
                        DISABLED
                      </span>
                    )}
                  </div>
                </div>

                {/* Quick Action Buttons */}
                <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-[#182030]">
                  <button
                    onClick={() => handleBlankPassword(u.rid)}
                    className="px-2.5 py-1 rounded bg-emerald-950/80 hover:bg-emerald-900 text-emerald-300 border border-emerald-500/40 text-[11px] font-bold flex items-center gap-1 transition-all"
                  >
                    <Unlock className="w-3 h-3" />
                    <span>Clear (Blank) Password & Unlock</span>
                  </button>

                  {!u.isAdmin && (
                    <button
                      onClick={() => handlePromoteAdmin(u.rid)}
                      className="px-2.5 py-1 rounded bg-amber-950/80 hover:bg-amber-900 text-amber-300 border border-amber-500/40 text-[11px] font-bold flex items-center gap-1 transition-all"
                    >
                      <UserPlus className="w-3 h-3" />
                      <span>Promote to Admin</span>
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Terminal Command Output & Script Box */}
      <div className="bg-[#080a11] rounded-xl border border-[#1b2234] p-4 space-y-3">
        <div className="flex items-center justify-between border-b border-[#161d2d] pb-2">
          <div className="flex items-center gap-2">
            <Terminal className="w-4 h-4 text-indigo-400" />
            <span className="text-xs font-bold font-mono text-white">Chntpw & Hivex Offline Disinfection Syntax</span>
          </div>
          <button
            onClick={() => {
              navigator.clipboard?.writeText(getCliCommand());
              if (addNotification) {
                addNotification({
                  title: 'Command Copied',
                  message: 'Chntpw & Hivex CLI script copied to clipboard',
                  type: 'info'
                });
              }
            }}
            className="flex items-center gap-1.5 px-2 py-1 rounded bg-[#131a2b] hover:bg-[#1b253e] text-[11px] font-mono text-[#8fa0b5] hover:text-white transition-all"
          >
            <Copy className="w-3 h-3" />
            <span>Copy Script</span>
          </button>
        </div>

        <div className="p-2.5 rounded-lg bg-[#04060a] border border-[#141b2c] font-mono text-xs text-indigo-300 select-all overflow-x-auto">
          <pre className="text-[11px]">{getCliCommand()}</pre>
        </div>

        <div className="p-3 rounded-lg bg-[#04060a] border border-[#141b2c] font-mono text-xs space-y-1 max-h-36 overflow-y-auto">
          {chntpwLogs.map((log, idx) => (
            <div
              key={idx}
              className={`${
                log.includes('[✓]')
                  ? 'text-emerald-400 font-bold'
                  : log.includes('[chntpw]')
                  ? 'text-amber-300 font-bold'
                  : log.includes('[hivex]')
                  ? 'text-purple-300'
                  : log.includes('[!]')
                  ? 'text-rose-300 font-bold'
                  : log.includes('[+]')
                  ? 'text-sky-300'
                  : 'text-[#708098]'
              }`}
            >
              {log}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
