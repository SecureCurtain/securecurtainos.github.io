// jb7572_2026-08-24: Category 4 - System Configuration & Automation Subsystem Service
import { 
  ServiceUnit, 
  RegistryEntry, 
  RegistryHive,
  RegistryValueType,
  ScheduledTask, 
  EnvVariable, 
  ServiceStatus, 
  ServiceStartup,
  SysctlParam,
  TimeDateInfo,
  PowerProfileInfo
} from '../types';

const initialServices: ServiceUnit[] = [
  {
    id: 'srv_1',
    name: 'systemd_init',
    displayName: 'System Init & Process Supervisor',
    description: 'PID 1 root userspace manager, cgroup controller, and IPC bus coordinator.',
    status: 'RUNNING',
    startup: 'AUTO',
    pid: 1,
    memoryMb: 8.4,
    cpuPercent: 0.1,
    execPath: '/sbin/init',
    dependencies: ['kthread_root'],
    subsystem: 'CORE'
  },
  {
    id: 'srv_2',
    name: 'e1000_net_stack',
    displayName: 'lwIP Network Daemon & e1000 Driver',
    description: 'Ring 0 lwIP IPv4/IPv6 packet processing engine with DMA ring buffer dispatch.',
    status: 'RUNNING',
    startup: 'AUTO',
    pid: 135,
    memoryMb: 14.8,
    cpuPercent: 0.4,
    execPath: '/usr/libexec/e1000_net_stack',
    dependencies: ['systemd_init'],
    subsystem: 'NETWORK'
  },
  {
    id: 'srv_3',
    name: 'wayland_compositor',
    displayName: 'Wayland Graphics Server & DRM Display',
    description: 'Hardware accelerated DRM/KMS compositor managing surfaces and input dispatch.',
    status: 'RUNNING',
    startup: 'AUTO',
    pid: 310,
    memoryMb: 84.2,
    cpuPercent: 1.8,
    execPath: '/usr/bin/wayland_compositor_server',
    dependencies: ['systemd_init', 'udevd'],
    subsystem: 'DISPLAY'
  },
  {
    id: 'srv_4',
    name: 'cockpit_daemon',
    displayName: 'Cockpit Subsystem Engine & GUI Bridge',
    description: 'Interactive browser-based system administration dashboard and telemetry engine.',
    status: 'RUNNING',
    startup: 'AUTO',
    pid: 620,
    memoryMb: 42.6,
    cpuPercent: 0.8,
    execPath: '/usr/bin/utilities_cockpit.elf',
    dependencies: ['systemd_init', 'e1000_net_stack'],
    subsystem: 'CORE'
  },
  {
    id: 'srv_5',
    name: 'sshd',
    displayName: 'OpenSSH Remote Secure Shell Server',
    description: 'Provides encrypted terminal sessions, SFTP file transfer, and remote debugging.',
    status: 'RUNNING',
    startup: 'AUTO',
    pid: 412,
    memoryMb: 12.1,
    cpuPercent: 0.05,
    execPath: '/usr/sbin/sshd -D',
    dependencies: ['systemd_init', 'e1000_net_stack'],
    subsystem: 'SECURITY'
  },
  {
    id: 'srv_6',
    name: 'cron_daemon',
    displayName: 'Vixie Cron Task Scheduler',
    description: 'Periodic background task execution daemon parsing user crontabs and system jobs.',
    status: 'RUNNING',
    startup: 'AUTO',
    pid: 480,
    memoryMb: 4.8,
    cpuPercent: 0.02,
    execPath: '/usr/sbin/crond -n',
    dependencies: ['systemd_init'],
    subsystem: 'CORE'
  },
  {
    id: 'srv_7',
    name: 'udevd',
    displayName: 'Hardware Device Manager & Hotplug',
    description: 'Dynamically populates /dev nodes and dispatches kernel uevents to userspace.',
    status: 'RUNNING',
    startup: 'AUTO',
    pid: 180,
    memoryMb: 6.4,
    cpuPercent: 0.01,
    execPath: '/lib/systemd/systemd-udevd',
    dependencies: ['systemd_init'],
    subsystem: 'STORAGE'
  },
  {
    id: 'srv_8',
    name: 'syslogd',
    displayName: 'Kernel Ring Buffer & Syslog Collector',
    description: 'Collects dmesg, kmsg, and audit log entries into volatile circular log buffers.',
    status: 'RUNNING',
    startup: 'AUTO',
    pid: 215,
    memoryMb: 5.2,
    cpuPercent: 0.02,
    execPath: '/usr/sbin/syslogd',
    dependencies: ['systemd_init'],
    subsystem: 'CORE'
  },
  {
    id: 'srv_9',
    name: 'acpid',
    displayName: 'ACPI Power & Thermal Manager',
    description: 'Listens for power button events, battery state changes, and thermal throttling.',
    status: 'RUNNING',
    startup: 'AUTO',
    pid: 240,
    memoryMb: 3.8,
    cpuPercent: 0.01,
    execPath: '/usr/sbin/acpid',
    dependencies: ['systemd_init'],
    subsystem: 'CORE'
  },
  {
    id: 'srv_10',
    name: 'bluetoothd',
    displayName: 'BlueZ Bluetooth Subsystem Protocol Stack',
    description: 'Bluetooth HCI driver and protocol daemon for peripheral connectivity.',
    status: 'STOPPED',
    startup: 'MANUAL',
    pid: null,
    memoryMb: 0,
    cpuPercent: 0,
    execPath: '/usr/libexec/bluetooth/bluetoothd',
    dependencies: ['systemd_init', 'udevd'],
    subsystem: 'NETWORK'
  }
];

const initialRegistry: RegistryEntry[] = [
  // --- Microkernel & Hardware KCONFIG ---
  {
    id: 'reg_1',
    hive: 'KCONFIG',
    keyPath: 'CONFIG_X86_64_MICROKERNEL',
    valueName: 'CONFIG_SMP_CORES',
    valueType: 'REG_DWORD',
    value: 8,
    description: 'Maximum logical symmetric multiprocessing (SMP) CPU core allocation',
    isKernelTunable: true
  },
  {
    id: 'reg_2',
    hive: 'KCONFIG',
    keyPath: 'CONFIG_MEMORY_MANAGEMENT',
    valueName: 'CONFIG_HIGHMEM_PAGING_64',
    valueType: 'BOOL',
    value: true,
    description: 'Enable 4-level and 5-level paging with PAE translation (CR3/CR4)',
    isKernelTunable: true
  },
  {
    id: 'reg_3',
    hive: 'KCONFIG',
    keyPath: 'CONFIG_LWIP_NETWORKING',
    valueName: 'CONFIG_LWIP_TCP_MSS',
    valueType: 'REG_DWORD',
    value: 1460,
    description: 'Maximum Segment Size for TCP connections over e1000 PCIe Ethernet',
    isKernelTunable: true
  },

  // --- Windows Subsystem & Session Manager (HKLM) ---
  {
    id: 'reg_4',
    hive: 'HKLM',
    keyPath: 'SYSTEM\\CurrentControlSet\\Control\\Session Manager',
    valueName: 'BootDriverFlags',
    valueType: 'REG_DWORD',
    value: 2048,
    description: 'Bitmask of early boot driver initialization requirements',
    isKernelTunable: false
  },
  {
    id: 'reg_5',
    hive: 'HKLM',
    keyPath: 'SOFTWARE\\SecureCurtain\\Cockpit',
    valueName: 'TelemetryIntervalMs',
    valueType: 'REG_DWORD',
    value: 1000,
    description: 'Real-time telemetry sampling period for CPU and memory usage graphs',
    isKernelTunable: false
  },
  {
    id: 'reg_6',
    hive: 'HKLM',
    keyPath: 'SOFTWARE\\SecureCurtain\\Security',
    valueName: 'FirewallDefaultDrop',
    valueType: 'BOOL',
    value: true,
    description: 'Stateful firewall drops unsolicited inbound packets by default',
    isKernelTunable: true
  },
  {
    id: 'reg_8',
    hive: 'HKLM',
    keyPath: 'SYSTEM\\CurrentControlSet\\Services\\Tcpip\\Parameters',
    valueName: 'TcpWindowSize',
    valueType: 'REG_DWORD',
    value: 65535,
    description: 'Default sliding window size in bytes for TCP receive buffer',
    isKernelTunable: true
  },
  {
    id: 'reg_win_ver_1',
    hive: 'HKLM',
    keyPath: 'SOFTWARE\\Microsoft\\Windows NT\\CurrentVersion',
    valueName: 'ProductName',
    valueType: 'REG_SZ',
    value: 'SecureCurtain OS Enterprise (Win32 Subsystem)',
    description: 'Operating system product branding for Windows applications',
    isKernelTunable: false
  },
  {
    id: 'reg_win_ver_2',
    hive: 'HKLM',
    keyPath: 'SOFTWARE\\Microsoft\\Windows NT\\CurrentVersion',
    valueName: 'CurrentBuild',
    valueType: 'REG_SZ',
    value: '26090',
    description: 'NT kernel compatibility build identifier',
    isKernelTunable: false
  },
  {
    id: 'reg_win_ver_3',
    hive: 'HKLM',
    keyPath: 'SOFTWARE\\Microsoft\\Windows NT\\CurrentVersion',
    valueName: 'RegisteredOwner',
    valueType: 'REG_SZ',
    value: 'Architect Administrator (admin)',
    description: 'Licensed workstation operator identity',
    isKernelTunable: false
  },
  {
    id: 'reg_def_1',
    hive: 'HKLM',
    keyPath: 'SOFTWARE\\Policies\\Microsoft\\Windows Defender',
    valueName: 'DisableAntiSpyware',
    valueType: 'REG_DWORD',
    value: 0,
    description: '0 = Real-time behavioral and anti-malware HIPS interceptor active',
    isKernelTunable: true
  },
  {
    id: 'reg_def_2',
    hive: 'HKLM',
    keyPath: 'SOFTWARE\\Policies\\Microsoft\\Windows Defender\\Real-Time Protection',
    valueName: 'DisableBehaviorMonitoring',
    valueType: 'REG_DWORD',
    value: 0,
    description: '0 = Zero-day Ring 0 memory and process behavior telemetry active',
    isKernelTunable: true
  },

  // --- Windows Notepad (notepad.exe) App Preferences (HKCU) ---
  {
    id: 'reg_notepad_1',
    hive: 'HKCU',
    keyPath: 'Software\\Microsoft\\Notepad',
    valueName: 'iFontSize',
    valueType: 'REG_DWORD',
    value: 13,
    description: 'Notepad text editor font size in points (10 - 24)',
    isKernelTunable: false
  },
  {
    id: 'reg_notepad_2',
    hive: 'HKCU',
    keyPath: 'Software\\Microsoft\\Notepad',
    valueName: 'lfFaceName',
    valueType: 'REG_SZ',
    value: 'Consolas',
    description: 'Monospace font face typeface family for Notepad',
    isKernelTunable: false
  },
  {
    id: 'reg_notepad_3',
    hive: 'HKCU',
    keyPath: 'Software\\Microsoft\\Notepad',
    valueName: 'fWrapText',
    valueType: 'REG_DWORD',
    value: 1,
    description: '1 = Enable automatic word wrapping at editor window edge, 0 = Disabled',
    isKernelTunable: false
  },
  {
    id: 'reg_notepad_4',
    hive: 'HKCU',
    keyPath: 'Software\\Microsoft\\Notepad',
    valueName: 'fStatusBar',
    valueType: 'REG_DWORD',
    value: 1,
    description: '1 = Render bottom status bar with line numbers and character counts',
    isKernelTunable: false
  },
  {
    id: 'reg_notepad_5',
    hive: 'HKCU',
    keyPath: 'Software\\Microsoft\\Notepad',
    valueName: 'fLineNumbers',
    valueType: 'REG_DWORD',
    value: 1,
    description: '1 = Display vertical line numbering gutter on the left margin',
    isKernelTunable: false
  },

  // --- Windows File Explorer (explorer.exe) Preferences (HKCU) ---
  {
    id: 'reg_explorer_1',
    hive: 'HKCU',
    keyPath: 'Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\Advanced',
    valueName: 'Hidden',
    valueType: 'REG_DWORD',
    value: 1,
    description: '1 = Show hidden and dotfile directories in file browser, 2 = Hide',
    isKernelTunable: false
  },
  {
    id: 'reg_explorer_2',
    hive: 'HKCU',
    keyPath: 'Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\Advanced',
    valueName: 'HideFileExt',
    valueType: 'REG_DWORD',
    value: 0,
    description: '0 = Show known file extensions (.c, .h, .img), 1 = Hide extensions',
    isKernelTunable: false
  },
  {
    id: 'reg_explorer_3',
    hive: 'HKCU',
    keyPath: 'Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\Advanced',
    valueName: 'ShowSuperHidden',
    valueType: 'REG_DWORD',
    value: 0,
    description: '0 = Protect critical microkernel system files, 1 = Show all system files',
    isKernelTunable: false
  },
  {
    id: 'reg_explorer_4',
    hive: 'HKCU',
    keyPath: 'Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\Visual',
    valueName: 'ViewMode',
    valueType: 'REG_SZ',
    value: 'grid',
    description: 'Default directory view mode layout: "grid" or "list"',
    isKernelTunable: false
  },

  // --- Windows Task Manager (taskmgr.exe) Preferences (HKCU) ---
  {
    id: 'reg_taskmgr_1',
    hive: 'HKCU',
    keyPath: 'Software\\Microsoft\\Windows\\CurrentVersion\\TaskManager\\Preferences',
    valueName: 'UpdateSpeed',
    valueType: 'REG_DWORD',
    value: 2,
    description: 'Process refresh rate: 1 = High (500ms), 2 = Normal (1000ms), 3 = Low (2000ms), 0 = Paused',
    isKernelTunable: false
  },
  {
    id: 'reg_taskmgr_2',
    hive: 'HKCU',
    keyPath: 'Software\\Microsoft\\Windows\\CurrentVersion\\TaskManager\\Preferences',
    valueName: 'AlwaysOnTop',
    valueType: 'REG_DWORD',
    value: 0,
    description: '1 = Keep Task Manager window pinned in front of other applications',
    isKernelTunable: false
  },

  // --- Desktop & Personalization (HKCU) ---
  {
    id: 'reg_7',
    hive: 'HKCU',
    keyPath: 'Control Panel\\Desktop',
    valueName: 'WallpaperPath',
    valueType: 'REG_SZ',
    value: '/usr/share/wallpapers/neon_cyber.png',
    description: 'Current desktop background path for the Wayland Compositor',
    isKernelTunable: false
  },
  {
    id: 'reg_desktop_1',
    hive: 'HKCU',
    keyPath: 'Control Panel\\Desktop',
    valueName: 'ScreenSaveActive',
    valueType: 'REG_SZ',
    value: '1',
    description: '1 = Enable retro animated screensaver during idle periods',
    isKernelTunable: false
  },
  {
    id: 'reg_desktop_2',
    hive: 'HKCU',
    keyPath: 'Control Panel\\Desktop',
    valueName: 'ScreenSaveTimeOut',
    valueType: 'REG_SZ',
    value: '120',
    description: 'Screensaver idle activation timeout in seconds',
    isKernelTunable: false
  },
  {
    id: 'reg_theme_1',
    hive: 'HKCU',
    keyPath: 'Software\\Microsoft\\Windows\\CurrentVersion\\Themes\\Personalize',
    valueName: 'AppsUseLightTheme',
    valueType: 'REG_DWORD',
    value: 0,
    description: '0 = Dark theme mode for desktop applications, 1 = Light theme mode',
    isKernelTunable: false
  }
];

const initialTasks: ScheduledTask[] = [
  {
    id: 'task_1',
    name: 'Weekly SSD Storage Trim (fstrim)',
    command: 'fstrim -v /dev/nvme0n1p2',
    triggerType: 'CRON',
    scheduleExpr: '0 0 * * 0 (Every Sunday at 00:00)',
    nextRun: '2026-08-30 00:00:00',
    lastRun: '2026-08-23 00:00:02',
    lastExitCode: 0,
    status: 'READY',
    enabled: true,
    runCount: 48,
    description: 'Discard unallocated blocks on the NVMe SSD root file system to maintain NAND write speeds.'
  },
  {
    id: 'task_2',
    name: 'Daily System Log Archival & Rotation',
    command: 'logrotate /etc/logrotate.conf',
    triggerType: 'CRON',
    scheduleExpr: '0 4 * * * (Daily at 04:00)',
    nextRun: '2026-08-25 04:00:00',
    lastRun: '2026-08-24 04:00:01',
    lastExitCode: 0,
    status: 'READY',
    enabled: true,
    runCount: 312,
    description: 'Compress and rotate system logs in /var/log/SecureCurtain into gzip archives.'
  },
  {
    id: 'task_3',
    name: 'NTP High-Precision Network Clock Sync',
    command: 'ntpdate -s pool.ntp.org',
    triggerType: 'INTERVAL',
    scheduleExpr: 'Every 30 minutes',
    nextRun: '2026-08-24 22:00:00',
    lastRun: '2026-08-24 21:30:00',
    lastExitCode: 0,
    status: 'READY',
    enabled: true,
    runCount: 1420,
    description: 'Synchronize kernel RTC clock drift via UDP port 123 Network Time Protocol.'
  },
  {
    id: 'task_4',
    name: 'Kernel Rootkit & Integrity Audit',
    command: 'chkrootkit -q --syscheck',
    triggerType: 'CRON',
    scheduleExpr: '0 2 * * * (Daily at 02:00)',
    nextRun: '2026-08-25 02:00:00',
    lastRun: '2026-08-24 02:00:08',
    lastExitCode: 0,
    status: 'READY',
    enabled: true,
    runCount: 156,
    description: 'Audit system binary signatures and kernel syscall table hooking.'
  },
  {
    id: 'task_5',
    name: 'ACPI Thermal & Battery Calibration',
    command: 'acpi -V >> /var/log/power.log',
    triggerType: 'INTERVAL',
    scheduleExpr: 'Every 5 minutes',
    nextRun: '2026-08-24 21:40:00',
    lastRun: '2026-08-24 21:35:00',
    lastExitCode: 0,
    status: 'READY',
    enabled: true,
    runCount: 4890,
    description: 'Poll battery wear leveling and CPU package junction temperature.'
  }
];

const initialEnvVars: EnvVariable[] = [
  {
    key: 'PATH',
    value: '/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin:/opt/SecureCurtain/bin',
    scope: 'SYSTEM',
    isReadOnly: false,
    description: 'Executable search paths for user shells and automation scripts'
  },
  {
    key: 'OS_KERNEL_VERSION',
    value: 'SecureCurtain 1.4.2-x86_64-smp',
    scope: 'SYSTEM',
    isReadOnly: true,
    description: 'Kernel semantic release version and target microarchitecture'
  },
  {
    key: 'ARCH',
    value: 'x86_64',
    scope: 'SYSTEM',
    isReadOnly: true,
    description: 'Target hardware instruction set architecture (64-bit AMD64/Intel64)'
  },
  {
    key: 'SHELL',
    value: '/bin/bash',
    scope: 'USER',
    isReadOnly: false,
    description: 'Default interactive command interpreter for user sessions'
  },
  {
    key: 'DISPLAY',
    value: ':0 (Wayland DRM Socket /run/user/1000/wayland-0)',
    scope: 'SYSTEM',
    isReadOnly: false,
    description: 'Active Wayland / X11 display socket endpoint'
  },
  {
    key: 'LANG',
    value: 'en_US.UTF-8',
    scope: 'SYSTEM',
    isReadOnly: false,
    description: 'System locale, character encoding, and collation formatting'
  },
  {
    key: 'net.ipv4.ip_forward',
    value: '0',
    scope: 'KERNEL_SYSCTL',
    isReadOnly: false,
    description: 'Kernel IP packet forwarding between network interfaces (0=disabled)'
  },
  {
    key: 'vm.swappiness',
    value: '10',
    scope: 'KERNEL_SYSCTL',
    isReadOnly: false,
    description: 'Kernel virtual memory aggressive paging bias (0-100 scale)'
  },
  {
    key: 'kernel.pid_max',
    value: '32768',
    scope: 'KERNEL_SYSCTL',
    isReadOnly: false,
    description: 'Maximum allowable process thread IDs allocated in kernel tables'
  },
  {
    key: 'fs.file-max',
    value: '2097152',
    scope: 'KERNEL_SYSCTL',
    isReadOnly: false,
    description: 'System-wide maximum file descriptor allocation limit'
  }
];

const STORAGE_KEY_REGISTRY = 'securecurtain_system_registry_v2';

class SystemConfigService {
  private services: ServiceUnit[] = JSON.parse(JSON.stringify(initialServices));
  private registryEntries: RegistryEntry[] = [];
  private scheduledTasks: ScheduledTask[] = JSON.parse(JSON.stringify(initialTasks));
  private envVariables: EnvVariable[] = JSON.parse(JSON.stringify(initialEnvVars));
  private registrySubscribers: Set<(entries: RegistryEntry[]) => void> = new Set();

  constructor() {
    this.registryEntries = this.loadRegistryFromStorage();
  }

  // ==========================================
  // Storage & Reactive Subscription Engine
  // ==========================================
  private loadRegistryFromStorage(): RegistryEntry[] {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const raw = localStorage.getItem(STORAGE_KEY_REGISTRY);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed) && parsed.length > 0) {
            // Merge with any missing initial entries to ensure new schema additions exist
            const existingKeys = new Set(parsed.map(e => `${e.hive}\\${e.keyPath}\\${e.valueName}`.toLowerCase()));
            const merged = [...parsed];
            for (const init of initialRegistry) {
              const signature = `${init.hive}\\${init.keyPath}\\${init.valueName}`.toLowerCase();
              if (!existingKeys.has(signature)) {
                merged.push({ ...init });
              }
            }
            return merged;
          }
        }
      }
    } catch (err) {
      console.warn('[SystemConfigService] Failed to load registry from localStorage, falling back to defaults', err);
    }
    return JSON.parse(JSON.stringify(initialRegistry));
  }

  private saveRegistryToStorage(): void {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.setItem(STORAGE_KEY_REGISTRY, JSON.stringify(this.registryEntries));
      }
    } catch (err) {
      console.warn('[SystemConfigService] Failed to persist registry to localStorage', err);
    }
    this.notifyRegistrySubscribers();
  }

  private notifyRegistrySubscribers(): void {
    const clone = [...this.registryEntries];
    this.registrySubscribers.forEach(cb => {
      try {
        cb(clone);
      } catch (err) {
        console.error('[SystemConfigService] Subscriber error:', err);
      }
    });
  }

  public subscribeToRegistry(callback: (entries: RegistryEntry[]) => void): () => void {
    this.registrySubscribers.add(callback);
    // Emit current state immediately
    callback([...this.registryEntries]);
    return () => {
      this.registrySubscribers.delete(callback);
    };
  }

  public resetRegistryToDefaults(): { success: boolean; message: string } {
    this.registryEntries = JSON.parse(JSON.stringify(initialRegistry));
    this.saveRegistryToStorage();
    return {
      success: true,
      message: `System registry restored to pristine factory defaults (${this.registryEntries.length} keys loaded).`
    };
  }

  // ==========================================
  // 1. Services Management (systemctl / services.msc)
  // ==========================================
  public getServices(): ServiceUnit[] {
    return [...this.services];
  }

  public startService(name: string): { success: boolean; message: string } {
    const srv = this.services.find(s => s.name === name || s.id === name);
    if (!srv) return { success: false, message: `Service "${name}" not found.` };
    if (srv.status === 'RUNNING') return { success: false, message: `Service "${srv.name}" is already running (PID ${srv.pid}).` };

    srv.status = 'RUNNING';
    srv.pid = Math.floor(Math.random() * 800) + 100;
    srv.memoryMb = +(Math.random() * 20 + 8).toFixed(1);
    srv.cpuPercent = +(Math.random() * 0.5 + 0.05).toFixed(2);
    return { success: true, message: `Service "${srv.displayName}" started successfully (PID ${srv.pid}).` };
  }

  public stopService(name: string): { success: boolean; message: string } {
    const srv = this.services.find(s => s.name === name || s.id === name);
    if (!srv) return { success: false, message: `Service "${name}" not found.` };
    if (srv.name === 'systemd_init') return { success: false, message: `CRITICAL: Refusing to stop PID 1 root supervisor (systemd_init).` };
    if (srv.status === 'STOPPED') return { success: false, message: `Service "${srv.name}" is already stopped.` };

    srv.status = 'STOPPED';
    srv.pid = null;
    srv.memoryMb = 0;
    srv.cpuPercent = 0;
    return { success: true, message: `Service "${srv.displayName}" stopped.` };
  }

  public restartService(name: string): { success: boolean; message: string } {
    const srv = this.services.find(s => s.name === name || s.id === name);
    if (!srv) return { success: false, message: `Service "${name}" not found.` };

    srv.status = 'RUNNING';
    srv.pid = Math.floor(Math.random() * 800) + 100;
    srv.memoryMb = +(Math.random() * 20 + 8).toFixed(1);
    srv.cpuPercent = +(Math.random() * 0.5 + 0.05).toFixed(2);
    return { success: true, message: `Service "${srv.displayName}" restarted cleanly (PID ${srv.pid}).` };
  }

  public setServiceStartup(name: string, startup: ServiceStartup): { success: boolean; message: string } {
    const srv = this.services.find(s => s.name === name || s.id === name);
    if (!srv) return { success: false, message: `Service "${name}" not found.` };

    srv.startup = startup;
    return { success: true, message: `Service "${srv.name}" startup type configured to ${startup}.` };
  }

  // ==========================================
  // 2. Registry & KConfig (regedit / kconfig)
  // ==========================================
  public getRegistryEntries(): RegistryEntry[] {
    return [...this.registryEntries];
  }

  public updateRegistryValue(id: string, newValue: string | number | boolean): { success: boolean; message: string } {
    const entry = this.registryEntries.find(e => e.id === id);
    if (!entry) return { success: false, message: `Registry entry #${id} not found.` };

    entry.value = newValue;
    this.saveRegistryToStorage();
    return { 
      success: true, 
      message: `Updated [${entry.hive}\\${entry.keyPath}] "${entry.valueName}" = "${newValue}".` 
    };
  }

  public addRegistryEntry(entry: Omit<RegistryEntry, 'id'>): { success: boolean; message: string; entry: RegistryEntry } {
    const newEntry: RegistryEntry = {
      ...entry,
      id: `reg_${Date.now()}_${Math.floor(Math.random() * 1000)}`
    };
    this.registryEntries.push(newEntry);
    this.saveRegistryToStorage();
    return {
      success: true,
      message: `Created registry key [${newEntry.hive}\\${newEntry.keyPath}] "${newEntry.valueName}".`,
      entry: newEntry
    };
  }

  public deleteRegistryEntry(id: string): { success: boolean; message: string } {
    const idx = this.registryEntries.findIndex(e => e.id === id);
    if (idx === -1) return { success: false, message: `Registry entry #${id} not found.` };

    const removed = this.registryEntries.splice(idx, 1)[0];
    this.saveRegistryToStorage();
    return {
      success: true,
      message: `Deleted key [${removed.hive}\\${removed.keyPath}] "${removed.valueName}".`
    };
  }

  /**
   * Retrieves a registry value with fallback.
   * Matches hive and keyPath case-insensitively.
   */
  public getRegistryValue<T = any>(
    hive: RegistryHive,
    keyPath: string,
    valueName: string,
    defaultValue: T
  ): T {
    const normHive = hive.toUpperCase();
    const normPath = keyPath.replace(/\//g, '\\').toLowerCase();
    const normName = valueName.toLowerCase();

    const found = this.registryEntries.find(e => 
      e.hive.toUpperCase() === normHive &&
      e.keyPath.replace(/\//g, '\\').toLowerCase() === normPath &&
      e.valueName.toLowerCase() === normName
    );

    if (!found) return defaultValue;
    return found.value as unknown as T;
  }

  /**
   * Sets or creates a registry value, persisting and notifying subscribers.
   */
  public setRegistryValue(
    hive: RegistryHive,
    keyPath: string,
    valueName: string,
    value: string | number | boolean,
    valueType?: RegistryValueType,
    description?: string
  ): { success: boolean; message: string; entry: RegistryEntry } {
    const normHive = hive.toUpperCase() as RegistryHive;
    const normPath = keyPath.replace(/\//g, '\\');
    const normName = valueName;

    let inferredType: RegistryValueType = valueType || 'REG_SZ';
    if (!valueType) {
      if (typeof value === 'number') inferredType = 'REG_DWORD';
      else if (typeof value === 'boolean') inferredType = 'BOOL';
      else inferredType = 'REG_SZ';
    }

    const existing = this.registryEntries.find(e => 
      e.hive.toUpperCase() === normHive &&
      e.keyPath.replace(/\//g, '\\').toLowerCase() === normPath.toLowerCase() &&
      e.valueName.toLowerCase() === normName.toLowerCase()
    );

    if (existing) {
      existing.value = value;
      if (valueType) existing.valueType = valueType;
      if (description) existing.description = description;
      this.saveRegistryToStorage();
      return {
        success: true,
        message: `Updated [${existing.hive}\\${existing.keyPath}] "${existing.valueName}" = "${value}".`,
        entry: existing
      };
    }

    const newEntry: RegistryEntry = {
      id: `reg_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      hive: normHive,
      keyPath: normPath,
      valueName: normName,
      valueType: inferredType,
      value: value,
      description: description || `Registry parameter for ${normName}`,
      isKernelTunable: normHive === 'KCONFIG'
    };

    this.registryEntries.push(newEntry);
    this.saveRegistryToStorage();
    return {
      success: true,
      message: `Created [${newEntry.hive}\\${newEntry.keyPath}] "${newEntry.valueName}" = "${value}".`,
      entry: newEntry
    };
  }

  /**
   * Deletes a specific value or an entire key path.
   */
  public deleteRegistryValue(
    hive: RegistryHive,
    keyPath: string,
    valueName?: string
  ): { success: boolean; message: string; deletedCount: number } {
    const normHive = hive.toUpperCase();
    const normPath = keyPath.replace(/\//g, '\\').toLowerCase();
    const normName = valueName ? valueName.toLowerCase() : null;

    let deletedCount = 0;
    this.registryEntries = this.registryEntries.filter(e => {
      const matchHive = e.hive.toUpperCase() === normHive;
      const matchPath = e.keyPath.replace(/\//g, '\\').toLowerCase() === normPath;
      if (matchHive && matchPath) {
        if (!normName || e.valueName.toLowerCase() === normName) {
          deletedCount++;
          return false;
        }
      }
      return true;
    });

    if (deletedCount > 0) {
      this.saveRegistryToStorage();
      return {
        success: true,
        message: `Deleted ${deletedCount} registry value(s) in [${hive}\\${keyPath}].`,
        deletedCount
      };
    }

    return {
      success: false,
      message: `Specified key or value not found in [${hive}\\${keyPath}].`,
      deletedCount: 0
    };
  }

  /**
   * Search / query registry keys and values.
   */
  public queryRegistry(hive?: string, keyPathPrefix?: string, valueNameFilter?: string): RegistryEntry[] {
    return this.registryEntries.filter(e => {
      if (hive && hive !== 'ALL') {
        const h = hive.toUpperCase();
        const entryH = e.hive.toUpperCase();
        if (h === 'HKLM' && entryH !== 'HKLM') return false;
        if (h === 'HKCU' && entryH !== 'HKCU') return false;
        if (h === 'KCONFIG' && entryH !== 'KCONFIG') return false;
        if (h !== 'HKLM' && h !== 'HKCU' && h !== 'KCONFIG' && entryH !== h) return false;
      }
      if (keyPathPrefix) {
        const prefix = keyPathPrefix.replace(/\//g, '\\').toLowerCase();
        const current = e.keyPath.replace(/\//g, '\\').toLowerCase();
        if (!current.includes(prefix)) return false;
      }
      if (valueNameFilter) {
        const needle = valueNameFilter.toLowerCase();
        const nameMatch = e.valueName.toLowerCase().includes(needle);
        const valMatch = String(e.value).toLowerCase().includes(needle);
        const descMatch = e.description.toLowerCase().includes(needle);
        if (!nameMatch && !valMatch && !descMatch) return false;
      }
      return true;
    });
  }

  /**
   * Generates Windows Registry standard .reg file text.
   */
  public exportRegistryHive(hive?: RegistryHive | 'ALL', keyPathPrefix?: string): string {
    const entries = this.queryRegistry(hive === 'ALL' ? undefined : hive, keyPathPrefix);
    
    // Group entries by FullKey: HKEY_LOCAL_MACHINE\... or HKEY_CURRENT_USER\...
    const groups: { [key: string]: RegistryEntry[] } = {};
    for (const e of entries) {
      let fullHive = e.hive as string;
      if (e.hive === 'HKLM') fullHive = 'HKEY_LOCAL_MACHINE';
      else if (e.hive === 'HKCU') fullHive = 'HKEY_CURRENT_USER';
      else if (e.hive === 'HKCR') fullHive = 'HKEY_CLASSES_ROOT';
      else if (e.hive === 'HKU') fullHive = 'HKEY_USERS';
      else if (e.hive === 'KCONFIG') fullHive = 'HKEY_LOCAL_MACHINE\\HARDWARE\\KCONFIG';

      const fullKey = `[${fullHive}\\${e.keyPath}]`;
      if (!groups[fullKey]) groups[fullKey] = [];
      groups[fullKey].push(e);
    }

    let out = `Windows Registry Editor Version 5.00\r\n\r\n`;
    out += `; SecureCurtain OS Windows Subsystem Registry Export\r\n`;
    out += `; Timestamp: ${new Date().toISOString()}\r\n`;
    out += `; Total Keys Exported: ${entries.length}\r\n\r\n`;

    for (const [keyHeader, keyEntries] of Object.entries(groups)) {
      out += `${keyHeader}\r\n`;
      for (const ent of keyEntries) {
        if (ent.valueType === 'REG_DWORD') {
          const num = typeof ent.value === 'number' ? ent.value : parseInt(String(ent.value), 10) || 0;
          const hex = Math.max(0, num).toString(16).padStart(8, '0');
          out += `"${ent.valueName}"=dword:${hex}\r\n`;
        } else if (ent.valueType === 'BOOL') {
          const val = ent.value ? 1 : 0;
          out += `"${ent.valueName}"=dword:0000000${val}\r\n`;
        } else if (ent.valueType === 'REG_BINARY') {
          out += `"${ent.valueName}"=hex:${String(ent.value)}\r\n`;
        } else {
          // REG_SZ
          const escaped = String(ent.value).replace(/\\/g, '\\\\').replace(/"/g, '\\"');
          out += `"${ent.valueName}"="${escaped}"\r\n`;
        }
      }
      out += `\r\n`;
    }

    return out;
  }

  /**
   * Imports standard Windows .reg file format into the system registry.
   */
  public importRegistryContent(content: string): { success: boolean; importedCount: number; errors: string[] } {
    const lines = content.split(/\r?\n/);
    let currentHive: RegistryHive | null = null;
    let currentKeyPath: string = '';
    let importedCount = 0;
    const errors: string[] = [];

    for (let i = 0; i < lines.length; i++) {
      const rawLine = lines[i].trim();
      if (!rawLine || rawLine.startsWith(';') || rawLine.startsWith('#')) continue;
      if (rawLine.startsWith('Windows Registry Editor')) continue;

      // Section header: [HKEY_...]
      if (rawLine.startsWith('[') && rawLine.endsWith(']')) {
        const keyInside = rawLine.substring(1, rawLine.length - 1).trim();
        const slashIdx = keyInside.indexOf('\\');
        if (slashIdx === -1) {
          errors.push(`Line ${i + 1}: Invalid registry key format "${rawLine}"`);
          continue;
        }

        const hiveStr = keyInside.substring(0, slashIdx).toUpperCase();
        currentKeyPath = keyInside.substring(slashIdx + 1);

        if (hiveStr === 'HKEY_LOCAL_MACHINE' || hiveStr === 'HKLM') currentHive = 'HKLM';
        else if (hiveStr === 'HKEY_CURRENT_USER' || hiveStr === 'HKCU') currentHive = 'HKCU';
        else if (hiveStr === 'KCONFIG') currentHive = 'KCONFIG';
        else if (hiveStr === 'HKEY_CLASSES_ROOT' || hiveStr === 'HKCR') currentHive = 'HKCR';
        else if (hiveStr === 'HKEY_USERS' || hiveStr === 'HKU') currentHive = 'HKU';
        else currentHive = 'HKLM';

        continue;
      }

      if (!currentHive || !currentKeyPath) continue;

      // Value line: "Name"=dword:00000001 or "Name"="value"
      const eqIdx = rawLine.indexOf('=');
      if (eqIdx !== -1) {
        const rawName = rawLine.substring(0, eqIdx).trim();
        const rawVal = rawLine.substring(eqIdx + 1).trim();

        const vName = rawName.replace(/^"|"$/g, '');

        if (rawVal.startsWith('dword:')) {
          const hexStr = rawVal.replace('dword:', '').trim();
          const parsedNum = parseInt(hexStr, 16);
          this.setRegistryValue(currentHive, currentKeyPath, vName, isNaN(parsedNum) ? 0 : parsedNum, 'REG_DWORD');
          importedCount++;
        } else if (rawVal.startsWith('"') && rawVal.endsWith('"')) {
          const strVal = rawVal.substring(1, rawVal.length - 1).replace(/\\\\/g, '\\').replace(/\\"/g, '"');
          this.setRegistryValue(currentHive, currentKeyPath, vName, strVal, 'REG_SZ');
          importedCount++;
        } else {
          this.setRegistryValue(currentHive, currentKeyPath, vName, rawVal, 'REG_SZ');
          importedCount++;
        }
      }
    }

    return {
      success: importedCount > 0,
      importedCount,
      errors
    };
  }

  // ==========================================
  // 3. Task Scheduler & Automation (crontab / schtasks)
  // ==========================================
  public getScheduledTasks(): ScheduledTask[] {
    return [...this.scheduledTasks];
  }

  public toggleTask(id: string): { success: boolean; message: string; enabled?: boolean } {
    const task = this.scheduledTasks.find(t => t.id === id);
    if (!task) return { success: false, message: `Task #${id} not found.` };

    task.enabled = !task.enabled;
    task.status = task.enabled ? 'READY' : 'DISABLED';
    return {
      success: true,
      message: `Task "${task.name}" is now ${task.enabled ? 'ENABLED' : 'DISABLED'}.`,
      enabled: task.enabled
    };
  }

  public runTaskNow(id: string): { success: boolean; message: string; exitCode: number } {
    const task = this.scheduledTasks.find(t => t.id === id);
    if (!task) return { success: false, message: `Task #${id} not found.`, exitCode: 1 };

    task.runCount += 1;
    task.lastRun = new Date().toISOString().replace('T', ' ').slice(0, 19);
    task.lastExitCode = 0;
    return {
      success: true,
      message: `Manual dispatch completed: "${task.command}" executed with exit code 0.`,
      exitCode: 0
    };
  }

  public addScheduledTask(task: Omit<ScheduledTask, 'id' | 'runCount' | 'lastExitCode' | 'status'>): { success: boolean; message: string; task: ScheduledTask } {
    const newTask: ScheduledTask = {
      ...task,
      id: `task_${Date.now()}`,
      runCount: 0,
      lastExitCode: 0,
      status: task.enabled ? 'READY' : 'DISABLED'
    };
    this.scheduledTasks.push(newTask);
    return {
      success: true,
      message: `Scheduled task "${newTask.name}" registered into cron queue.`,
      task: newTask
    };
  }

  public deleteTask(id: string): { success: boolean; message: string } {
    const idx = this.scheduledTasks.findIndex(t => t.id === id);
    if (idx === -1) return { success: false, message: `Task #${id} not found.` };

    const removed = this.scheduledTasks.splice(idx, 1)[0];
    return { success: true, message: `Removed scheduled task "${removed.name}".` };
  }

  // ==========================================
  // 4. Environment Variables & sysctl Tunables (env / sysctl)
  // ==========================================
  public getEnvVariables(): EnvVariable[] {
    return [...this.envVariables];
  }

  public updateEnvVariable(key: string, value: string): { success: boolean; message: string } {
    const v = this.envVariables.find(e => e.key === key);
    if (!v) return { success: false, message: `Variable "${key}" not found.` };
    if (v.isReadOnly) return { success: false, message: `Variable "${key}" is read-only in this kernel build.` };

    v.value = value;
    return {
      success: true,
      message: `Environment parameter "${key}" updated.`
    };
  }

  public addEnvVariable(item: EnvVariable): { success: boolean; message: string } {
    const existing = this.envVariables.find(e => e.key === item.key);
    if (existing) {
      existing.value = item.value;
      existing.description = item.description;
      return { success: true, message: `Updated existing environment variable "${item.key}".` };
    }
    this.envVariables.push(item);
    return { success: true, message: `Exported new variable "${item.key}".` };
  }

  public deleteEnvVariable(key: string): { success: boolean; message: string } {
    const idx = this.envVariables.findIndex(e => e.key === key);
    if (idx === -1) return { success: false, message: `Variable "${key}" not found.` };
    if (this.envVariables[idx].isReadOnly) return { success: false, message: `Cannot delete read-only variable "${key}".` };

    this.envVariables.splice(idx, 1);
    return { success: true, message: `Unset environment variable "${key}".` };
  }

  // ==========================================
  // 5. jb7572_2026-08-24: Category / Item 5 - Sysctl Kernel Parameter Tuner
  // ==========================================
  private sysctlParams: SysctlParam[] = [
    {
      key: 'vm.swappiness',
      currentValue: 10,
      defaultValue: 60,
      type: 'number',
      min: 0,
      max: 100,
      unit: '%',
      category: 'VM',
      description: 'Controls relative balance between page cache memory reclaiming vs anonymous memory paging.'
    },
    {
      key: 'vm.dirty_ratio',
      currentValue: 20,
      defaultValue: 20,
      type: 'number',
      min: 1,
      max: 80,
      unit: '%',
      category: 'VM',
      description: 'Maximum percentage of total system memory containing unwritten dirty pages before writers block.'
    },
    {
      key: 'vm.dirty_background_ratio',
      currentValue: 10,
      defaultValue: 10,
      type: 'number',
      min: 1,
      max: 50,
      unit: '%',
      category: 'VM',
      description: 'Percentage of system memory filled with dirty pages at which background flusher threads start writing.'
    },
    {
      key: 'vm.vfs_cache_pressure',
      currentValue: 50,
      defaultValue: 100,
      type: 'number',
      min: 0,
      max: 500,
      category: 'VM',
      description: 'Tendency of the kernel to reclaim memory used for caching directory and inode objects.'
    },
    {
      key: 'net.ipv4.tcp_fastopen',
      currentValue: 3,
      defaultValue: 1,
      type: 'number',
      min: 0,
      max: 3,
      category: 'NET',
      description: 'Enables TCP Fast Open for clients and servers without 3-way handshake round-trip latency.'
    },
    {
      key: 'net.ipv4.ip_forward',
      currentValue: 0,
      defaultValue: 0,
      type: 'number',
      min: 0,
      max: 1,
      category: 'NET',
      description: 'Controls IP packet routing and transit forwarding between separate network interfaces.'
    },
    {
      key: 'net.core.somaxconn',
      currentValue: 4096,
      defaultValue: 128,
      type: 'number',
      min: 128,
      max: 65535,
      category: 'NET',
      description: 'Maximum socket listen backlog queue size for high-throughput socket listeners.'
    },
    {
      key: 'fs.file-max',
      currentValue: 2097152,
      defaultValue: 1048576,
      type: 'number',
      min: 65536,
      max: 16777216,
      category: 'FS',
      description: 'System-wide maximum file descriptor allocation limit enforced by VFS layer.'
    },
    {
      key: 'fs.inotify.max_user_watches',
      currentValue: 524288,
      defaultValue: 8192,
      type: 'number',
      min: 8192,
      max: 1048576,
      category: 'FS',
      description: 'Maximum file system inodes monitored by userspace inotify file change watchers.'
    },
    {
      key: 'kernel.pid_max',
      currentValue: 32768,
      defaultValue: 32768,
      type: 'number',
      min: 1024,
      max: 4194304,
      category: 'KERNEL',
      description: 'Maximum allowable process thread IDs allocated in kernel tables.'
    },
    {
      key: 'kernel.panic_on_oops',
      currentValue: 1,
      defaultValue: 1,
      type: 'number',
      min: 0,
      max: 1,
      category: 'KERNEL',
      description: 'Halts kernel immediately upon encountering null-pointer dereference or ring-0 oops.'
    },
    {
      key: 'kernel.randomize_va_space',
      currentValue: 2,
      defaultValue: 2,
      type: 'number',
      min: 0,
      max: 2,
      category: 'KERNEL',
      description: 'Address Space Layout Randomization (ASLR mode: 2 = full stack/heap/VDSO randomization).'
    }
  ];

  public getSysctlParams(): SysctlParam[] {
    return [...this.sysctlParams];
  }

  public updateSysctlParam(key: string, value: number | boolean | string): { success: boolean; message: string } {
    const param = this.sysctlParams.find(p => p.key === key);
    if (!param) return { success: false, message: `Sysctl parameter "${key}" not found.` };

    param.currentValue = value;
    // Also sync to env vars if present
    const matchingEnv = this.envVariables.find(e => e.key === key);
    if (matchingEnv) matchingEnv.value = String(value);

    return {
      success: true,
      message: `Kernel parameter "${key}" tuned to ${value}. (Wrote to /proc/sys/${key.replace(/\./g, '/')})`
    };
  }

  public resetSysctlParam(key: string): { success: boolean; message: string } {
    const param = this.sysctlParams.find(p => p.key === key);
    if (!param) return { success: false, message: `Sysctl parameter "${key}" not found.` };

    param.currentValue = param.defaultValue;
    const matchingEnv = this.envVariables.find(e => e.key === key);
    if (matchingEnv) matchingEnv.value = String(param.defaultValue);

    return {
      success: true,
      message: `Reset "${key}" to kernel default value: ${param.defaultValue}.`
    };
  }

  // ==========================================
  // 6. jb7572_2026-08-24: Category / Item 5 - Time & Date Clock Synchronization (timedatectl / NTP)
  // ==========================================
  private timeZone: string = 'America/New_York (EDT, -0400)';
  private ntpActive: boolean = true;
  private ntpSynchronized: boolean = true;
  private rtcInLocalTz: boolean = false;
  private ntpServer: string = 'pool.ntp.org (Stratum 2, UDP 123)';
  private driftPpm: number = 0.014;

  public getTimeDateInfo(): TimeDateInfo {
    const now = new Date();
    const utcTime = now.toUTCString();
    const localTime = now.toLocaleString();
    const rtcTime = new Date(now.getTime() - 20).toUTCString();

    return {
      localTime,
      utcTime,
      rtcTime,
      timeZone: this.timeZone,
      ntpActive: this.ntpActive,
      ntpSynchronized: this.ntpSynchronized,
      rtcInLocalTz: this.rtcInLocalTz,
      ntpServer: this.ntpServer,
      driftPpm: this.driftPpm
    };
  }

  public setTimeZone(tz: string): { success: boolean; message: string } {
    this.timeZone = tz;
    return {
      success: true,
      message: `System timezone updated to "${tz}". Linked /etc/localtime -> /usr/share/zoneinfo/${tz.split(' ')[0]}.`
    };
  }

  public setNtpActive(active: boolean): { success: boolean; message: string } {
    this.ntpActive = active;
    if (!active) this.ntpSynchronized = false;
    return {
      success: true,
      message: `systemd-timesyncd NTP client service ${active ? 'started and enabled' : 'stopped'}.`
    };
  }

  public syncNtpNow(): { success: boolean; message: string } {
    this.ntpSynchronized = true;
    this.driftPpm = +(Math.random() * 0.02 + 0.005).toFixed(4);
    return {
      success: true,
      message: `Polled NTP pool server "${this.ntpServer}". Clock drift adjusted by ${this.driftPpm} PPM.`
    };
  }

  public setRtcInLocalTz(val: boolean): { success: boolean; message: string } {
    this.rtcInLocalTz = val;
    return {
      success: true,
      message: `RTC hardware clock configured to store ${val ? 'LOCAL time' : 'UTC time'}.`
    };
  }

  // ==========================================
  // 7. jb7572_2026-08-24: Category / Item 5 - Power Governor & Energy Profiles (powerprofilesctl / cpupower)
  // ==========================================
  private powerProfile: 'performance' | 'balanced' | 'power-saver' = 'performance';
  private cpuGovernor: 'performance' | 'powersave' | 'schedutil' | 'ondemand' = 'performance';
  private turboBoost: boolean = true;

  public getPowerProfileInfo(): PowerProfileInfo {
    const profileFreqMap = {
      'performance': { cur: 4.85, watts: 82.4 },
      'balanced': { cur: 3.60, watts: 45.1 },
      'power-saver': { cur: 2.10, watts: 18.2 }
    };
    const curStats = profileFreqMap[this.powerProfile];

    return {
      activeProfile: this.powerProfile,
      cpuGovernor: this.cpuGovernor,
      turboBoost: this.turboBoost,
      currentFreqGhz: curStats.cur,
      maxFreqGhz: 5.20,
      batteryHealthPercent: 98,
      powerDrawWatts: curStats.watts
    };
  }

  public setPowerProfile(profile: 'performance' | 'balanced' | 'power-saver'): { success: boolean; message: string } {
    this.powerProfile = profile;
    if (profile === 'performance') {
      this.cpuGovernor = 'performance';
      this.turboBoost = true;
    } else if (profile === 'power-saver') {
      this.cpuGovernor = 'powersave';
      this.turboBoost = false;
    } else {
      this.cpuGovernor = 'schedutil';
      this.turboBoost = true;
    }
    return {
      success: true,
      message: `Activated power profile: [${profile.toUpperCase()}]. Applied CPU scaling governor "${this.cpuGovernor}".`
    };
  }

  public setCpuGovernor(gov: 'performance' | 'powersave' | 'schedutil' | 'ondemand'): { success: boolean; message: string } {
    this.cpuGovernor = gov;
    return {
      success: true,
      message: `CPU frequency scaling governor set to "${gov}" across all SMP cores.`
    };
  }

  public toggleTurboBoost(): { success: boolean; message: string; state: boolean } {
    this.turboBoost = !this.turboBoost;
    return {
      success: true,
      message: `Intel/AMD Turbo Boost / Precision Boost ${this.turboBoost ? 'ENABLED (x86_energy_perf_bias=0)' : 'DISABLED (no_turbo=1)'}.`,
      state: this.turboBoost
    };
  }
}

export const systemConfigService = new SystemConfigService();
