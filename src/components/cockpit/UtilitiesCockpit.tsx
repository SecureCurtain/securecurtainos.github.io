// jb7572_2026-08-24: Master Utilities Cockpit GUI Framework
import React, { useState, useRef, useEffect } from 'react';
import { CockpitCategoryId, CockpitUtilityId } from '../../types';
import { TaskManagerGUI } from './TaskManagerGUI';
import { StorageManagementGUI } from './StorageManagementGUI';
import { NetworkSecurityGUI } from './NetworkSecurityGUI';
import { SystemConfigGUI } from './SystemConfigGUI';
import { HardwareLogsGUI } from './HardwareLogsGUI';
import { DeviceManagerGUI } from './DeviceManagerGUI';
import { PackageFeaturesGUI } from './PackageFeaturesGUI';
import { SearchIndexerGUI } from './SearchIndexerGUI';
import { OverviewHealthHUDGUI } from './OverviewHealthHUDGUI';
import { MemoryDebuggerGUI } from './MemoryDebuggerGUI';
import { UserManagementGUI } from './UserManagementGUI';
import { CockpitTerminal } from './CockpitTerminal';
import { CockpitLaunchpadGUI } from './CockpitLaunchpadGUI';
import { SoundSystemManagerGUI } from './SoundSystemManagerGUI';
import { DecommissionGUI } from './DecommissionGUI';
import { BugReporterCockpitGUI } from './BugReporterCockpitGUI';
import { BeginnerGuide } from '../BeginnerGuide';
import { 
  Activity, 
  HardDrive, 
  Wifi, 
  Settings, 
  ClipboardList, 
  Package, 
  Search, 
  Terminal, 
  ShieldCheck, 
  Cpu, 
  FolderTree, 
  Layers, 
  Clock, 
  CheckCircle2, 
  Sparkles,
  ArrowRight,
  Zap,
  Binary,
  Volume2,
  LayoutGrid,
  ArrowUp,
  Users,
  Flame,
  Bug,
  BookOpen
} from 'lucide-react';

interface CategoryConfig {
  id: CockpitCategoryId;
  title: string;
  subtitle: string;
  icon: React.ComponentType<{ className?: string }>;
  status: 'COMPLETED' | 'IN_PROGRESS' | 'SCHEDULED';
  utilities: {
    id: CockpitUtilityId;
    name: string;
    description: string;
    cliCommand: string;
    isCompleted: boolean;
  }[];
}

// jb7572_2026-08-24: Category Definitions with Graphic Icons and Completion Tracking
const CATEGORIES: CategoryConfig[] = [
  {
    id: 'OVERVIEW_HUD',
    title: 'Mission Control: Overview & Health HUD',
    subtitle: 'Live vitals, subsystem health matrix, incident alert feed & quick actions',
    icon: Zap,
    status: 'COMPLETED',
    utilities: [
      {
        id: 'resource_monitor',
        name: 'Health HUD (GUI)',
        description: 'Comprehensive vital cards, 7-subsystem status grid, and incident feed.',
        cliCommand: 'hud',
        isCompleted: true
      },
      {
        id: 'perf_monitor',
        name: 'neofetch & fastfetch (CLI)',
        description: 'ASCII branding, kernel architecture summary, and subsystem diagnostics.',
        cliCommand: 'neofetch',
        isCompleted: true
      }
    ]
  },
  {
    id: 'DEVICE_MANAGER',
    title: 'Hardware: Device & Driver Manager',
    subtitle: 'PCIe/USB hardware tree, deep specs & live driver switcher',
    icon: Cpu,
    status: 'COMPLETED',
    utilities: [
      {
        id: 'device_manager',
        name: 'Device & Driver Manager (GUI)',
        description: 'Comprehensive hardware specifications, MMIO/BAR maps, and live kernel driver rebind authority.',
        cliCommand: 'lspci -v',
        isCompleted: true
      }
    ]
  },
  {
    id: 'LAUNCHPAD',
    title: 'Desktop Launchpad',
    subtitle: 'All desktop icons and applications centralized in Mission Control',
    icon: LayoutGrid,
    status: 'COMPLETED',
    utilities: [
      {
        id: 'resource_monitor',
        name: 'Desktop Apps Hub',
        description: 'One-click launchpad for all desktop applications and developer tools.',
        cliCommand: 'launchpad',
        isCompleted: true
      }
    ]
  },
  {
    id: 'SYSTEM_PERFORMANCE',
    title: 'Category 1: Performance & Processes',
    subtitle: 'Task Manager, btop, Resource Monitor & thread auditing',
    icon: Activity,
    status: 'COMPLETED',
    utilities: [
      {
        id: 'task_manager',
        name: 'Task Manager (GUI)',
        description: 'Multi-tabbed process manager mapping CPU, memory, disk throughput, and PID controls.',
        cliCommand: 'tasklist',
        isCompleted: true
      },
      {
        id: 'btop_tui',
        name: 'btop / htop (CLI/TUI)',
        description: 'Interactive terminal monitor for live CPU cores, page frame allocations, and network rates.',
        cliCommand: 'btop',
        isCompleted: true
      },
      {
        id: 'resource_monitor',
        name: 'Resource Monitor (GUI)',
        description: 'Granular per-process NVMe disk read/writes and e1000 socket bandwidth consumption.',
        cliCommand: 'ps',
        isCompleted: true
      },
      {
        id: 'perf_monitor',
        name: 'Performance Monitor (GUI)',
        description: 'Historical sparkline performance counter logs.',
        cliCommand: 'sysinfo',
        isCompleted: true
      }
    ]
  },
  {
    id: 'MEMORY_DEBUGGER',
    title: 'Memory & Disassembler Debugger',
    subtitle: 'Page tables, GDB register snapshots, x86_64 disasm & raw hex dumps',
    icon: Binary,
    status: 'COMPLETED',
    utilities: [
      {
        id: 'memory_inspector',
        name: 'Virtual Memory & Hex Dumper (GUI)',
        description: 'PML4 page tables, CR3 roots, ELF segments and real-time ASCII/hex byte viewer.',
        cliCommand: 'maps',
        isCompleted: true
      },
      {
        id: 'disassembler_gdb',
        name: 'x86_64 GDB Disassembler (GUI/CLI)',
        description: 'Register telemetry (RIP, RSP, RFLAGS, CR0..CR4) and .text instruction decoding.',
        cliCommand: 'objdump',
        isCompleted: true
      }
    ]
  },
  {
    id: 'STORAGE_FILESYSTEM',
    title: 'Category 2: Storage & File Systems',
    subtitle: 'Internal Mirror SSD (100% Sync), Disk Specs, All Drives Partitioning & External USB Backup',
    icon: HardDrive,
    status: 'COMPLETED',
    utilities: [
      {
        id: 'diskmgmt',
        name: 'Internal Mirror SSD & Disk Specs (GUI)',
        description: 'Real-time % full gauges, 100% match-paired SSD mirror sync telemetry, and parity verification.',
        cliCommand: 'lsblk',
        isCompleted: true
      },
      {
        id: 'gparted',
        name: 'All Connected Drives & Partition Engine (GUI)',
        description: 'Initialize raw disks (GPT/MBR), partition volumes, and format ext4/ntfs/btrfs/xfs with Sudo PIN elevation.',
        cliCommand: 'gparted',
        isCompleted: true
      },
      {
        id: 'backup_recovery' as any,
        name: 'External Drive Backup & Disaster Recovery (GUI)',
        description: 'Hardware USB port lockdown bypass with Admin 4-10 char Root PIN, Kyber-1024 encryption, and automated snapshots.',
        cliCommand: 'backup',
        isCompleted: true
      },
      {
        id: 'storage_sense',
        name: 'Modern Storage Sense (GUI)',
        description: 'Automated disk cache cleanup and temporary build file pruning.',
        cliCommand: 'cleanmgr',
        isCompleted: true
      },
      {
        id: 'ncdu',
        name: 'ncdu / dua (CLI/TUI)',
        description: 'Terminal disk analyzer identifying space-hogging directory structures.',
        cliCommand: 'ncdu',
        isCompleted: true
      }
    ]
  },
  {
    id: 'NETWORK_SECURITY',
    title: 'Category 3: Network & Security',
    subtitle: 'HIPS & Anti-Malware engine, Sandboxed Quarantine study, Firewall rules, Wi-Fi & Quantum VPN',
    icon: Wifi,
    status: 'COMPLETED',
    utilities: [
      {
        id: 'firewall',
        name: 'HIPS & Anti-Malware Defense Suite (GUI)',
        description: 'Real-time behavioral interception, kernel syscall trap, deep heuristic scanning & threat forensics.',
        cliCommand: 'hips-scan',
        isCompleted: true
      },
      {
        id: 'quarantine' as any,
        name: 'Quarantine & Sandbox Reverse-Engineering (GUI)',
        description: 'Air-gapped Ring -1 container stripping malware to bytecode, ASM opcodes, hex dumps, and YARA rules.',
        cliCommand: 'quarantine-vault',
        isCompleted: true
      },
      {
        id: 'net_connections',
        name: 'Stateful Firewall & Connections (GUI)',
        description: 'Inbound/outbound packet filter rules, network interfaces, and socket listener telemetry.',
        cliCommand: 'firewall-cmd',
        isCompleted: true
      },
      {
        id: 'socket_inspector',
        name: 'ss / netstat Socket Inspector (CLI/GUI)',
        description: 'Live TCP/UDP listener investigation and active connection sockets.',
        cliCommand: 'ss -tulpn',
        isCompleted: true
      }
    ]
  },
  {
    id: 'USER_MANAGEMENT',
    title: 'Accounts: Users, Groups & Domain Directory',
    subtitle: 'Local SAM Users & Groups, Sudoers PIN Elevation, RBAC Matrix & Active Directory / FreeIPA DC',
    icon: Users,
    status: 'COMPLETED',
    utilities: [
      {
        id: 'user_accounts',
        name: 'Users, Groups & Active Directory (GUI)',
        description: 'Manage local and domain users, assign granular RBAC roles, reset elevation PINs, and join Windows AD / Linux FreeIPA DCs.',
        cliCommand: 'useradd',
        isCompleted: true
      }
    ]
  },
  {
    id: 'SYSTEM_CONFIGURATION',
    title: 'Category 4: Config & Automation',
    subtitle: 'Registry Editor, Services engine (systemctl) & Cron scheduler',
    icon: Settings,
    status: 'COMPLETED',
    utilities: [
      {
        id: 'regedit',
        name: 'Registry Editor / System Hive (GUI)',
        description: 'Hierarchical low-level database mapping OS flags and software keys.',
        cliCommand: 'reg query',
        isCompleted: true
      },
      {
        id: 'services',
        name: 'Services & Daemons Controller (GUI)',
        description: 'Unified daemon manager to start, stop, and enable background routines.',
        cliCommand: 'systemctl status',
        isCompleted: true
      },
      {
        id: 'task_scheduler',
        name: 'Task Scheduler & Cron (GUI)',
        description: 'Automated routine triggers based on timetables and system events.',
        cliCommand: 'crontab -l',
        isCompleted: true
      },
      {
        id: 'env_vars',
        name: 'Environment Variables & sysctl (GUI)',
        description: 'Kernel sysctl parameters, PATH, and system-wide environment manager.',
        cliCommand: 'sysctl -a',
        isCompleted: true
      }
    ]
  },
  {
    id: 'AUDITING_LOGS',
    title: 'Category 5: Logs & Hardware',
    subtitle: 'Event Viewer, Device Manager, Sensors & journalctl kernel logs',
    icon: ClipboardList,
    status: 'COMPLETED',
    utilities: [
      {
        id: 'device_manager',
        name: 'Device Manager (GUI)',
        description: 'Hardware tree mapping PCI devices, vendor IDs, BARs, and driver states.',
        cliCommand: 'lspci -v',
        isCompleted: true
      },
      {
        id: 'event_viewer',
        name: 'Event Viewer & Kernel Journal (GUI)',
        description: 'Structured logging database tracking system warnings, PANICs, and events.',
        cliCommand: 'journalctl -xe',
        isCompleted: true
      },
      {
        id: 'resource_monitor',
        name: 'Hardware Sensors & Thermals (GUI)',
        description: 'ACPI sensor polling for core temperatures, fan RPM, and voltage rails.',
        cliCommand: 'sensors',
        isCompleted: true
      },
      {
        id: 'reliability_monitor',
        name: 'Reliability Monitor & Boot Analyzer (GUI)',
        description: 'Boot sequence waterfall timing breakdown and system uptime stability audit.',
        cliCommand: 'systemd-analyze',
        isCompleted: true
      }
    ]
  },
  {
    id: 'PACKAGE_POOLS',
    title: 'Category 6: Package Delivery',
    subtitle: 'apt / winget binary repository pool & Optional OS Features',
    icon: Package,
    status: 'COMPLETED',
    utilities: [
      {
        id: 'package_pool',
        name: 'Package Manager & Repository Pool (GUI)',
        description: 'Deploy, verify checksums, and update OS binaries and compilers.',
        cliCommand: 'apt list',
        isCompleted: true
      },
      {
        id: 'optional_features',
        name: 'Optional OS Features & Subsystems (GUI)',
        description: 'Toggle modular subsystems like KVM virtualization and Linux ABI layer.',
        cliCommand: 'dism list',
        isCompleted: true
      }
    ]
  },
  {
    id: 'SEARCH_NAVIGATION',
    title: 'Category 7: Search & Indexing',
    subtitle: 'Universal indexing search, ripgrep (rg) & fd',
    icon: Search,
    status: 'COMPLETED',
    utilities: [
      {
        id: 'indexer_search',
        name: 'Universal Search & Indexing (GUI)',
        description: 'Fast background search catalog and file content previews.',
        cliCommand: 'find /boot',
        isCompleted: true
      },
      {
        id: 'ripgrep',
        name: 'ripgrep (rg) & fd (CLI)',
        description: 'Blazing fast regex text scanner across all system directories.',
        cliCommand: 'rg "PAGE_PRESENT" /kernel',
        isCompleted: true
      }
    ]
  },
  {
    id: 'SOUND_SYSTEM',
    title: 'Audio: Sound Authority & Cylon Vocoder',
    subtitle: '1978 BSG Formant Synthesizer & Desktop Sound Scheme Authority',
    icon: Volume2,
    status: 'COMPLETED',
    utilities: [
      {
        id: 'resource_monitor',
        name: 'Sound Engine Authority',
        description: 'Multi-mode acoustic formant vocoder and audio events mixer.',
        cliCommand: 'speaker-test',
        isCompleted: true
      }
    ]
  },
  {
    id: 'ARCHITECTURE_HANDBOOK',
    title: 'Documentation: OS Architecture Handbook',
    subtitle: 'Kernel directory semantics, x86_64 long mode, GDT/IDT, paging, and architectural guidelines',
    icon: BookOpen,
    status: 'COMPLETED',
    utilities: [
      {
        id: 'architecture_guide',
        name: 'OS Architecture Handbook (GUI)',
        description: 'Comprehensive guidelines and directory semantics for building x86_64 microkernels from scratch.',
        cliCommand: 'man 7 SecureCurtain',
        isCompleted: true
      }
    ]
  },
  {
    id: 'DECOMMISSION',
    title: 'Decommission: DoD 5220.22-M System Sanitize & Power-Off',
    subtitle: 'Irreversible hardware sanitization, DOD drive wiping, TPM 2.0 clear & cryptographic purge',
    icon: Flame,
    status: 'COMPLETED',
    utilities: [
      {
        id: 'decommission',
        name: 'System Decommission & DoD Wipe (GUI)',
        description: 'SuperAdmin multi-pass cryptographic wipe, external drive safeguard, TPM 2.0 clear & ACPI S5 power-off.',
        cliCommand: 'decommission',
        isCompleted: true
      }
    ]
  },
  {
    id: 'FEEDBACK_BUGS',
    title: 'Bug Reporter & OS User Wishlist',
    subtitle: 'Zero-PII crash capture, hardware/software telemetry, code line inspection & feature proposals to securecurtainos.bugs@gmail.com',
    icon: Bug,
    status: 'COMPLETED',
    utilities: [
      {
        id: 'bug_reporter',
        name: 'Automated Bug Reporter & Code Lines Area (GUI)',
        description: 'Captures full hardware & software settings and code line fault coordinates, dispatched to securecurtainos.bugs@gmail.com.',
        cliCommand: 'report-bug',
        isCompleted: true
      },
      {
        id: 'user_ideas',
        name: 'OS Ideas, Changes & Additions Wishlist (GUI)',
        description: 'Propose new capabilities, ergonomic polish, and kernel/GUI additions directly to developers.',
        cliCommand: 'wishlist',
        isCompleted: true
      }
    ]
  }
];

interface UtilitiesCockpitProps {
  initialCategory?: CockpitCategoryId;
}

// jb7572_2026-08-24: Master Cockpit Component
export const UtilitiesCockpit: React.FC<UtilitiesCockpitProps> = ({ initialCategory = 'OVERVIEW_HUD' }) => {
  const [selectedCategory, setSelectedCategory] = useState<CockpitCategoryId>(initialCategory);
  const [activeCliCommand, setActiveCliCommand] = useState<string | undefined>(undefined);
  const [showScrollTop, setShowScrollTop] = useState<boolean>(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (initialCategory) {
      setSelectedCategory(initialCategory);
    }
  }, [initialCategory]);

  const currentCategoryConfig = CATEGORIES.find(c => c.id === selectedCategory) || CATEGORIES[0];

  // Track vertical scroll position
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const handleScroll = () => {
      setShowScrollTop(el.scrollTop > 180);
    };

    el.addEventListener('scroll', handleScroll, { passive: true });
    return () => el.removeEventListener('scroll', handleScroll);
  }, []);

  const handleSelectCategory = (catId: CockpitCategoryId) => {
    setSelectedCategory(catId);
    // Smoothly scroll back to top of the cockpit window when category changes
    containerRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const scrollToTop = () => {
    containerRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const scrollToTerminal = () => {
    const el = document.getElementById('cockpit-terminal-section');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div 
      ref={containerRef}
      className="h-full w-full overflow-y-auto overflow-x-hidden p-4 md:p-6 space-y-6 custom-scrollbar scroll-smooth relative"
    >
      {/* Cockpit Overview & Category Grid Banner */}
      <div className="bg-[#0f0f0f] border border-[#222] rounded-xl p-5 shadow-2xl space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#222] pb-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-[#171717] rounded-xl border border-[#2a2a2a] text-emerald-400">
              <Zap className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-[#f5f5f5]">
                  Utilities Cockpit GUI & Terminal Suite
                </h2>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-950/70 text-emerald-300 border border-emerald-800/50 font-mono flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                  All Subsystems + Desktop Launchpad Active
                </span>
              </div>
              <p className="text-xs text-[#737373]">
                Mission control cockpit bridging Windows & Linux power tools into your x86_64 microkernel
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs font-mono">
            <button
              onClick={scrollToTerminal}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#141414] hover:bg-[#1f1f1f] border border-[#262626] text-emerald-400 hover:text-emerald-300 transition-colors"
              title="Jump to Integrated CLI Terminal"
            >
              <Terminal className="w-3.5 h-3.5" />
              <span>Terminal CLI</span>
            </button>
            <span className="px-2.5 py-1 rounded-lg bg-[#141414] border border-[#262626] text-[#bbb]">
              Subsystems: <strong className="text-emerald-400">12 Modules Active</strong>
            </span>
            <span className="px-2.5 py-1 rounded-lg bg-[#141414] border border-[#262626] text-[#bbb]">
              Health: <strong className="text-emerald-400">100% Operational</strong>
            </span>
          </div>
        </div>

        {/* Category Selector Tabs with Graphic Icons (12 items) */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-12 gap-2">
          {CATEGORIES.map((cat) => {
            const Icon = cat.icon;
            const isSelected = selectedCategory === cat.id;
            const isHUD = cat.id === 'OVERVIEW_HUD';
            const isLaunchpad = cat.id === 'LAUNCHPAD';
            const isHandbook = cat.id === 'ARCHITECTURE_HANDBOOK';
            const isDecommission = cat.id === 'DECOMMISSION';

            return (
              <button
                key={cat.id}
                onClick={() => handleSelectCategory(cat.id)}
                className={`p-3 rounded-xl border text-left transition-all flex flex-col justify-between ${
                  isSelected
                    ? isHUD
                      ? 'bg-gradient-to-b from-emerald-950/60 to-[#121216] border-emerald-500/60 shadow-md shadow-emerald-950/30'
                      : isLaunchpad
                      ? 'bg-gradient-to-b from-purple-950/80 to-[#141220] border-purple-500/60 shadow-md shadow-purple-950/30'
                      : isHandbook
                      ? 'bg-gradient-to-b from-indigo-950/80 to-[#121422] border-indigo-500/60 shadow-md shadow-indigo-950/30'
                      : isDecommission
                      ? 'bg-gradient-to-b from-red-950/90 to-[#1c0808] border-red-500/70 shadow-md shadow-red-950/50'
                      : 'bg-[#1c1a24] border-[#c4b5fd]/50 shadow-md shadow-purple-950/30'
                    : isDecommission
                    ? 'bg-[#160b0b] border-red-900/40 hover:bg-[#200f0f] hover:border-red-700/60'
                    : 'bg-[#121212] border-[#222] hover:bg-[#181818] hover:border-[#333]'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className={`p-1.5 rounded-lg ${
                    isSelected 
                      ? isHUD 
                        ? 'bg-emerald-400 text-black' 
                        : isLaunchpad 
                        ? 'bg-purple-400 text-black' 
                        : isHandbook
                        ? 'bg-indigo-400 text-black'
                        : isDecommission
                        ? 'bg-red-500 text-white shadow-[0_0_10px_#ef4444]'
                        : 'bg-[#c4b5fd] text-[#0f0f0f]' 
                      : isDecommission
                      ? 'bg-red-950/80 text-red-400'
                      : 'bg-[#1c1c1c] text-[#888]'
                  }`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <span className={`text-[9px] px-1.5 py-0.5 rounded font-mono font-semibold ${
                    isHUD 
                      ? 'bg-emerald-950 text-emerald-300 border border-emerald-700/50'
                      : isLaunchpad
                      ? 'bg-purple-950 text-purple-300 border border-purple-700/50'
                      : isHandbook
                      ? 'bg-indigo-950 text-indigo-300 border border-indigo-700/50'
                      : isDecommission
                      ? 'bg-red-950 text-red-300 border border-red-700/60'
                      : 'bg-emerald-950/80 text-emerald-300 border border-emerald-700/40'
                  }`}>
                    {isHUD ? 'HUD' : isLaunchpad ? 'APPS' : isHandbook ? 'DOCS' : isDecommission ? 'DOD' : 'READY'}
                  </span>
                </div>
                <div>
                  <div className={`text-xs font-semibold leading-tight line-clamp-1 ${
                    isSelected 
                      ? isHUD 
                        ? 'text-emerald-300' 
                        : isLaunchpad 
                        ? 'text-purple-300' 
                        : isHandbook
                        ? 'text-indigo-300'
                        : isDecommission
                        ? 'text-red-400 font-bold'
                        : 'text-[#f5f5f5]' 
                      : isDecommission
                      ? 'text-red-300/80'
                      : 'text-[#aaa]'
                  }`}>
                    {cat.id === 'OVERVIEW_HUD' ? 'Mission HUD' : cat.id === 'LAUNCHPAD' ? 'Launchpad' : cat.id === 'ARCHITECTURE_HANDBOOK' ? 'OS Architecture Handbook' : cat.id === 'DECOMMISSION' ? 'Decommission' : (cat.title.split(':')[1] || cat.title)}
                  </div>
                  <div className="text-[10px] text-[#666] line-clamp-1 mt-0.5">
                    {cat.id === 'OVERVIEW_HUD' ? 'Overview' : cat.id === 'LAUNCHPAD' ? 'Desktop Apps' : cat.id === 'ARCHITECTURE_HANDBOOK' ? 'Guidelines & Specs' : cat.id === 'DECOMMISSION' ? 'DoD & TPM' : `${cat.utilities.length} Utils`}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Center Area: Active Category GUI */}
      {selectedCategory === 'OVERVIEW_HUD' && (
        <OverviewHealthHUDGUI 
          onSelectCategory={(catKey) => handleSelectCategory(catKey as CockpitCategoryId)}
          onRunCliCommand={(cmd) => setActiveCliCommand(cmd)}
        />
      )}

      {selectedCategory === 'DEVICE_MANAGER' && (
        <DeviceManagerGUI 
          onRunCliCommand={(cmd) => setActiveCliCommand(cmd)}
        />
      )}

      {selectedCategory === 'LAUNCHPAD' && (
        <CockpitLaunchpadGUI 
          onRunCliCommand={(cmd) => setActiveCliCommand(cmd)}
        />
      )}

      {selectedCategory === 'SYSTEM_PERFORMANCE' && (
        <TaskManagerGUI 
          onRunCliCommand={(cmd) => setActiveCliCommand(cmd)}
        />
      )}

      {selectedCategory === 'MEMORY_DEBUGGER' && (
        <MemoryDebuggerGUI 
          onRunCliCommand={(cmd) => setActiveCliCommand(cmd)}
        />
      )}

      {selectedCategory === 'STORAGE_FILESYSTEM' && (
        <StorageManagementGUI 
          onRunCliCommand={(cmd) => setActiveCliCommand(cmd)}
        />
      )}

      {selectedCategory === 'NETWORK_SECURITY' && (
        <NetworkSecurityGUI 
          onRunCliCommand={(cmd) => setActiveCliCommand(cmd)}
        />
      )}

      {selectedCategory === 'USER_MANAGEMENT' && (
        <UserManagementGUI 
          onRunCliCommand={(cmd) => setActiveCliCommand(cmd)}
        />
      )}

      {selectedCategory === 'SYSTEM_CONFIGURATION' && (
        <SystemConfigGUI 
          onRunCliCommand={(cmd) => setActiveCliCommand(cmd)}
        />
      )}

      {selectedCategory === 'AUDITING_LOGS' && (
        <HardwareLogsGUI 
          onRunCliCommand={(cmd) => setActiveCliCommand(cmd)}
        />
      )}

      {selectedCategory === 'PACKAGE_POOLS' && (
        <PackageFeaturesGUI 
          onRunCliCommand={(cmd) => setActiveCliCommand(cmd)}
        />
      )}

      {selectedCategory === 'SEARCH_NAVIGATION' && (
        <SearchIndexerGUI 
          onRunCliCommand={(cmd) => setActiveCliCommand(cmd)}
        />
      )}

      {selectedCategory === 'SOUND_SYSTEM' && (
        <SoundSystemManagerGUI 
          onRunCliCommand={(cmd) => setActiveCliCommand(cmd)}
        />
      )}

      {selectedCategory === 'ARCHITECTURE_HANDBOOK' && (
        <div className="bg-[#0c0c10] border border-[#222] rounded-2xl p-5 shadow-xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#222]">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                <BookOpen className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <span>OS Architecture Handbook & Directory Semantics</span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-indigo-950/80 text-indigo-300 border border-indigo-700/50">
                    man 7
                  </span>
                </h3>
                <p className="text-xs text-[#888]">
                  Complete architectural blueprint, code organization rules, and execution stages for x86_64 Long Mode.
                </p>
              </div>
            </div>
            <button
              onClick={() => setActiveCliCommand('man 7 SecureCurtain')}
              className="px-3 py-1.5 rounded-lg bg-[#16161f] hover:bg-[#20202e] border border-[#2d2d42] text-xs font-mono text-indigo-300 flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Execute manual page in integrated terminal"
            >
              <Terminal className="w-3.5 h-3.5" />
              <span>man 7</span>
            </button>
          </div>
          <BeginnerGuide />
        </div>
      )}

      {selectedCategory === 'DECOMMISSION' && (
        <DecommissionGUI 
          onRunCliCommand={(cmd) => setActiveCliCommand(cmd)}
        />
      )}

      {selectedCategory === 'FEEDBACK_BUGS' && (
        <BugReporterCockpitGUI 
          onRunCliCommand={(cmd) => setActiveCliCommand(cmd)}
        />
      )}

      {/* Integrated Terminal Suite (CLI) */}
      <div id="cockpit-terminal-section" className="space-y-2 pt-2">
        <div className="flex items-center justify-between px-1 text-xs text-[#888]">
          <span className="font-mono flex items-center gap-1.5">
            <Terminal className="w-3.5 h-3.5 text-emerald-400" />
            Integrated System Terminal & CLI Execution
          </span>
          <span className="text-[11px] text-[#666]">
            Try: <code className="text-[#c4b5fd]">journalctl -n 10</code>, <code className="text-[#c4b5fd]">lspci -v</code>, <code className="text-[#c4b5fd]">sensors</code>, <code className="text-[#c4b5fd]">systemd-analyze</code>
          </span>
        </div>
        <CockpitTerminal 
          externalCommand={activeCliCommand}
          onClearExternalCommand={() => setActiveCliCommand(undefined)}
        />
      </div>

      {/* Floating Scroll to Top Button */}
      {showScrollTop && (
        <button
          onClick={scrollToTop}
          className="sticky bottom-4 float-right z-30 p-2.5 rounded-full bg-purple-600/90 hover:bg-purple-500 text-white shadow-xl shadow-purple-950/60 border border-purple-400/30 backdrop-blur-sm transition-all hover:scale-110 flex items-center gap-1 text-xs font-mono"
          title="Scroll back to top"
        >
          <ArrowUp className="w-4 h-4" />
          <span className="hidden sm:inline pr-1">Top</span>
        </button>
      )}
    </div>
  );
};
