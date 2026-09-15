// jb7572_2026-08-24: Integrated Interactive CLI Terminal Suite for Cockpit
import React, { useState, useRef, useEffect } from 'react';
import { systemProcessService } from '../../services/systemProcessService';
import { networkSecurityService } from '../../services/networkSecurityService';
import { systemConfigService } from '../../services/systemConfigService';
import { hardwareLogsService } from '../../services/hardwareLogsService';
import { packageManagementService } from '../../services/packageManagementService';
import { searchIndexingService } from '../../services/searchIndexingService';
import { healthHudService } from '../../services/healthHudService';
import { memoryDebuggerService } from '../../services/memoryDebuggerService';
import { storageService } from '../../services/storageService';
import { userManagementService } from '../../services/userManagementService';
import { SecuritySanitizer, ThreatDetectionResult } from '../../utils/securitySanitizer';
import { SecurityThreatBadge } from './SecurityThreatBadge';
import { COMMAND_DOCS } from '../../services/commandRegistryService';
import { CliCommandExecutor } from '../../services/cliCommandExecutor';
import { CliAssistantService, CommandGuide, FuzzyMatchResult, ALL_CLI_COMMANDS } from '../../services/cliAssistantService';
import { CliMistypedSuggestionCard } from './CliMistypedSuggestionCard';
import { CliCommandAssistantCard } from './CliCommandAssistantCard';
import { Terminal, CornerDownLeft, Trash2, Maximize2, Minimize2, ShieldAlert, ShieldCheck, Sparkles, Sliders } from 'lucide-react';
import { RegistryHive, RegistryEntry, RegistryValueType } from '../../types';

interface CockpitTerminalProps {
  externalCommand?: string;
  onClearExternalCommand?: () => void;
}

interface CommandLog {
  id: string;
  command: string;
  output: string;
  isError?: boolean;
  mistypedSuggestion?: FuzzyMatchResult | null;
  guide?: CommandGuide | null;
}

// jb7572_2026-08-24: Interactive CLI Terminal Component with real btop, tasklist, lsblk, ncdu, and gparted support
export const CockpitTerminal: React.FC<CockpitTerminalProps> = ({ externalCommand, onClearExternalCommand }) => {
  const [inputVal, setInputVal] = useState('');
  const [activeThreat, setActiveThreat] = useState<ThreatDetectionResult | null>(null);
  const [isAssistantEnabled, setIsAssistantEnabled] = useState(true);
  const [lastSuggestion, setLastSuggestion] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [history, setHistory] = useState<CommandLog[]>([
    {
      id: 'welcome',
      command: 'sysinfo',
      output: `SecureCurtain x86_64 Self-Healing Microkernel CLI [Version 1.0.4-release]
Type "help" or "help <cmd>" to explore commands, switches & power tips.
Try: watchdog, virtio, ping 8.8.8.8, curl, iso, btop, or gparted.`,
      guide: CliAssistantService.getCommandGuide('sysinfo')
    }
  ]);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);
  const [pastCommands, setPastCommands] = useState<string[]>(['sysinfo']);
  const [isExpanded, setIsExpanded] = useState(false);
  const outputContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (outputContainerRef.current) {
      outputContainerRef.current.scrollTop = outputContainerRef.current.scrollHeight;
    }
  }, [history]);

  useEffect(() => {
    if (externalCommand) {
      executeCommand(externalCommand);
      onClearExternalCommand?.();
    }
  }, [externalCommand]);

  const handleInputChange = (val: string) => {
    setInputVal(val);
    const threat = SecuritySanitizer.detectThreats(val, 'terminalCommand');
    setActiveThreat(!threat.isClean ? threat : null);
  };

  // jb7572_2026-08-24: Command Execution Dispatcher with Input Sanitization & Threat Barrier
  const executeCommand = (rawCmd: string) => {
    const rawTrimmed = rawCmd.trim();
    if (!rawTrimmed) return;

    // Security Analysis & Sanitization
    const threatAnalysis = SecuritySanitizer.detectThreats(rawTrimmed, 'terminalCommand');
    const sanitizedResult = SecuritySanitizer.sanitizeCliCommand(rawTrimmed);

    setPastCommands(prev => [...prev, rawTrimmed]);
    setHistoryIndex(-1);
    setActiveThreat(null);

    // If severe malicious pattern detected, block and log to audit trail
    if (!threatAnalysis.isClean) {
      const actor = userManagementService.getCurrentSessionUser()?.username || 'root';
      const threatDescriptions = threatAnalysis.threats.map(t => `${t.type}: ${t.description}`).join('; ');
      
      userManagementService.recordSecurityThreat(
        actor,
        `Terminal CLI [${rawTrimmed.substring(0, 30)}]`,
        `Blocked malicious command payload: ${threatDescriptions}`
      );

      // Check if command is strictly dangerous (e.g. destructive fs, shell breakout, sql payload)
      const hasSevereExploit = threatAnalysis.threats.some(t => 
        t.type === 'COMMAND_INJECTION' || 
        t.type === 'PATH_TRAVERSAL' || 
        t.type === 'SQL_INJECTION' || 
        t.type === 'XSS_SCRIPT'
      );

      if (hasSevereExploit && (
        rawTrimmed.includes('rm -rf /') ||
        rawTrimmed.includes(':(){ :|:& };:') ||
        rawTrimmed.includes('mkfs') ||
        rawTrimmed.includes('dd if=') ||
        rawTrimmed.includes('/etc/shadow') ||
        rawTrimmed.includes('/etc/passwd') ||
        rawTrimmed.includes('| bash') ||
        rawTrimmed.includes('| sh') ||
        rawTrimmed.toLowerCase().includes('union select') ||
        rawTrimmed.toLowerCase().includes('drop table')
      )) {
        setHistory(prev => [
          ...prev,
          {
            id: `cmd-${Date.now()}`,
            command: rawTrimmed,
            output: `🛑 [SECURECURTAIN KERNEL SECURITY BARRIER]
Action Blocked: Malicious or destructive command execution prohibited.
Threat Detected: ${threatAnalysis.threats.map(t => t.type).join(', ')}
Details: ${threatDescriptions}
Audit Event Logged: Event ID #SC-THREAT-${Date.now().toString(36).toUpperCase()} registered in System Security Audit Trail.`,
            isError: true
          }
        ]);
        return;
      }
    }

    const cmd = sanitizedResult.sanitized;
    const parts = cmd.split(' ').filter(p => p.length > 0);
    const main = parts[0]?.toLowerCase() || '';
    const args = parts.slice(1);

    let output = '';
    let isError = false;
    let mistypedSuggestion: FuzzyMatchResult | null = null;
    let guide: CommandGuide | null = null;

    switch (main) {
      case 'help': {
        const sub = args[0]?.toLowerCase();
        if (sub) {
          const specificGuide = CliAssistantService.getCommandGuide(sub);
          if (specificGuide) {
            guide = specificGuide;
            output = `SecureCurtain CLI Help: ${specificGuide.name.toUpperCase()}
============================================================
${specificGuide.title} [${specificGuide.category}]
Summary: ${specificGuide.summary}
Syntax:  ${specificGuide.syntax}

Available Arguments & Switches:
${specificGuide.switches.map(s => `  ${s.flag.padEnd(18)} ${s.description}${s.example ? ` (e.g. "${s.example}")` : ''}`).join('\n')}

Power Recipes:
${specificGuide.recipes.map(r => `  • ${r.title}: $ ${r.command}\n    ${r.description}`).join('\n')}

${specificGuide.guiAlternative ? `Prefer GUI Interface:
  • ${specificGuide.guiAlternative.name} (${specificGuide.guiAlternative.location})
    ${specificGuide.guiAlternative.description}\n` : ''}
Pro Tips:
${specificGuide.proTips.map(p => `  💡 ${p}`).join('\n')}`;
            break;
          }
        }

        output = `Available SecureCurtain Utilities CLI Commands:
------------------------------------------------------------
🛡️ Microkernel & Watchdog Supervisor:
  • watchdog / watchdogctl - Query Ring 0 heartbeat, crash recovery & MTTR metrics
  • virtio / virtio-net   - Enumerate VirtIO network descriptor queues & RX/TX ring
  • dhclient / dhcp       - Negotiate DHCP IPv4 lease on virtual TAP interface
  • iso / qemu            - Inspect bootable ISO layout & QEMU bare-metal launcher

🎛️ Process & Performance Monitors:
  • btop / top          - Interactive ASCII thread & memory monitor
  • tasklist / ps       - List all active processes and PID allocations
  • taskkill / kill     - Terminate a process (e.g. "taskkill /PID 620" or "kill 620")
  • sysinfo             - Display kernel build flags, arch, and uptime

💾 Storage & File System Engines:
  • lsblk / diskmgmt    - List storage block devices and partition paths
  • gparted             - Inspect partition table alignment & GPT headers
  • df                  - Report file system disk space usage
  • ncdu / dua          - Terminal disk usage analyzer for directories
  • eza / ls            - Colorized directory listing with permissions
  • fstrim / cleanmgr   - Reclaim unallocated SSD flash blocks & cache
  • decommission        - DoD 5220.22-M 7-pass secure drive wipe & TPM sanitization

🛡️ Network & Security Subsystems:
  • ip a / ifconfig     - Display IP addresses, MACs, MTU & interfaces
  • firewall-cmd / ufw  - Stateful firewall status & packet rule chains
  • ss -tulpn / netstat - Inspect active listening TCP/UDP sockets
  • ping <host>         - Send ICMP echo requests (e.g. "ping 8.8.8.8")
  • curl <url>          - Fetch HTTP payload over VirtIO-Net stack
  • traceroute <host>   - Trace packet routing hops across gateways

⚙️ System Configuration & Automation:
  • systemctl / services- Inspect and manage daemons (status, start, stop, restart)
  • reg / regedit       - Query or update registry keys and KConfig tunables
  • crontab / schtasks  - List and trigger scheduled cron background jobs
  • sysctl / env        - Read and configure kernel sysctl parameters and environment vars

📋 Logs, Hardware & Auditing:
  • journalctl / dmesg  - Query system event logs and kernel ring buffers
  • lspci / lsusb / lshw- Enumerate PCI hardware devices, IRQs and bus addresses
  • sensors / turbostat - Poll live CPU core thermals, fan RPM, voltage & power
  • systemd-analyze     - Microkernel boot time breakdown & reliability index

📦 Package Delivery & Features:
  • apt / winget / pacman- Install, upgrade, and list packages (e.g. "apt list", "apt install <pkg>")
  • dism / optionalfeatures- Enable or disable modular kernel and OS subsystem features

🔍 Search & Indexing:
  • find / fd           - Fast recursive filename search across microkernel tree (e.g. "find mmu", "fd asm")
  • grep / rg / ripgrep - High-speed full-text regex source code search (e.g. "rg PAGE_PRESENT", "grep kmain")
  • locate / updatedb   - Query or rebuild system index catalog statistics

🔬 Memory & Low-Level Debugging:
  • gdb / regs <pid>    - Inspect CPU registers (RIP, RSP, RAX..R15, CR3) and stack frame
  • readelf / maps <pid>- Print 4-level page table virtual memory layout & ELF sections
  • objdump <pid>       - Disassemble instruction streams at process entry point
  • xxd / hexdump <addr>- Inspect raw hex byte offset and ASCII memory dump

📊 System Overview & Health HUD:
  • hud / healthcheck   - Aggregate real-time telemetry, incidents & subsystem health
  • neofetch / fastfetch- Display aesthetic ASCII microkernel branding & system summary
  • uptime              - Show total system uptime, load averages & process count

General:
  • clear / cls         - Clear the terminal screen
  • help [command]      - Show this reference manual or deep switch explorer for a command (e.g. "help watchdog")

💡 Pro Tip: After running any command, interactive switches and power recipes will appear below the output!`;
        break;
      }

      case 'clear':
      case 'cls':
        setHistory([]);
        return;

      case 'sysinfo': {
        const metrics = systemProcessService.getSystemMetrics();
        output = `OS Name:        SecureCurtain (x86_64 Long Mode)
Kernel Type:    Ring 0 Microkernel with Modular Subsystems
CPU Cores:      4 Physical Cores @ 3.60 GHz
RAM:            ${(metrics.memUsedBytes / (1024 * 1024 * 1024)).toFixed(2)} GB / 16.00 GB Used
Uptime:         ${metrics.uptimeSeconds}s (${Math.floor(metrics.uptimeSeconds / 60)}m)
Total Tasks:    ${metrics.processCount} processes (${metrics.threadCount} threads)
Active Drivers: PCIe NVMe, VirtIO-GPU, Intel HDA, e1000 lwIP`;
        break;
      }

      case 'tasklist':
      case 'ps': {
        const procs = systemProcessService.getProcesses();
        output = `Image Name                     PID    Session Name     Status       CPU %    Mem Usage
================================================================================
` + procs.map(p => {
          const namePadded = p.name.padEnd(28, ' ');
          const pidPadded = p.pid.toString().padEnd(6, ' ');
          const catPadded = p.category.padEnd(16, ' ');
          const statPadded = p.status.padEnd(12, ' ');
          const cpuPadded = (p.cpuPercent.toFixed(1) + '%').padStart(6, ' ');
          const memPadded = p.memFormatted.padStart(10, ' ');
          return `${namePadded} ${pidPadded} ${catPadded} ${statPadded} ${cpuPadded} ${memPadded}`;
        }).join('\n');
        break;
      }

      case 'btop':
      case 'top': {
        const metrics = systemProcessService.getSystemMetrics();
        const procs = systemProcessService.getProcesses().sort((a, b) => b.cpuPercent - a.cpuPercent).slice(0, 8);
        output = `┌─ btop++ v1.3.0 [SecureCurtain/sys x86_64] ────────────────────────────────────────┐
│ CPU [${'|'.repeat(Math.round(metrics.cpuTotalPercent / 4))}${' '.repeat(25 - Math.round(metrics.cpuTotalPercent / 4))}] ${metrics.cpuTotalPercent.toFixed(1)}%   Freq: 3600MHz   Temp: 42°C  │
│ MEM [${'|'.repeat(Math.round((metrics.memUsedBytes / metrics.memTotalBytes) * 25))}${' '.repeat(25 - Math.round((metrics.memUsedBytes / metrics.memTotalBytes) * 25))}] ${(metrics.memUsedBytes / (1024*1024*1024)).toFixed(2)}G / 16.0G │
│ DISK (NVMe): R:${metrics.diskReadRateKb} KB/s W:${metrics.diskWriteRateKb} KB/s  NET: RX:${metrics.netRxRateKb}K TX:${metrics.netTxRateKb}K │
├───────────────────────────────────────────────────────────────────────────┤
│ PID   USER     THREADS  PRI   STATUS     CPU%    MEM      COMMAND         │
` + procs.map(p => {
          return `│ ${p.pid.toString().padEnd(5)} ${p.user.padEnd(8)} ${p.threads.toString().padEnd(8)} ${p.priority.padEnd(5)} ${p.status.padEnd(10)} ${p.cpuPercent.toFixed(1).padStart(5)}%  ${p.memFormatted.padStart(8)}  ${p.commandLine.slice(0, 16)}│`;
        }).join('\n') + `\n└───────────────────────────────────────────────────────────────────────────┘`;
        break;
      }

      case 'taskkill': {
        let targetPid: number | null = null;
        for (let i = 0; i < args.length; i++) {
          if (args[i].toUpperCase() === '/PID' && args[i + 1]) {
            targetPid = parseInt(args[i + 1], 10);
            break;
          } else if (!isNaN(parseInt(args[i], 10))) {
            targetPid = parseInt(args[i], 10);
            break;
          }
        }

        if (targetPid === null) {
          output = `ERROR: Invalid syntax. Usage: taskkill /PID <process_id> [/F]`;
          isError = true;
        } else {
          const res = systemProcessService.killProcess(targetPid);
          output = res.message;
          isError = !res.success;
        }
        break;
      }

      case 'kill': {
        let targetPid: number | null = null;
        for (const arg of args) {
          if (arg.startsWith('-')) continue;
          const parsed = parseInt(arg, 10);
          if (!isNaN(parsed)) {
            targetPid = parsed;
            break;
          }
        }

        if (targetPid === null) {
          output = `kill: usage: kill [-s sigspec | -n signum | -sigspec] pid | jobspec ...`;
          isError = true;
        } else {
          const res = systemProcessService.killProcess(targetPid);
          output = res.message;
          isError = !res.success;
        }
        break;
      }

      // jb7572_2026-08-24: Storage CLI Commands
      case 'lsblk':
      case 'diskmgmt': {
        output = `NAME            MAJ:MIN RM   SIZE RO TYPE MOUNTPOINTS
nvme0n1         259:0    0  1024G  0 disk 
├─nvme0n1p1     259:1    0   512M  0 part /boot/efi (vfat)
├─nvme0n1p2     259:2    0   256G  0 part / (ext4 root)
├─nvme0n1p3     259:3    0   512G  0 part /home (ext4 user)
├─nvme0n1p4     259:4    0   224G  0 part /mnt/c_drive (ntfs win32)
└─nvme0n1p5     259:5    0    32G  0 part [SWAP] (swap)`;
        break;
      }

      case 'df': {
        output = `Filesystem     1K-blocks      Used Available Use% Mounted on
/dev/nvme0n1p2 268435456  50331648 218103808  19% /
/dev/nvme0n1p1    524288     65536    458752  13% /boot/efi
/dev/nvme0n1p3 536870912 125829120 411041792  24% /home
/dev/nvme0n1p4 234881024  36700160 198180864  16% /mnt/c_drive`;
        break;
      }

      case 'ncdu':
      case 'dua': {
        output = `ncdu 1.19 ~ Use the arrow keys to navigate, press ? for help
--- /sys -----------------------------------------------------------------------
   18.4 GiB [##########] /subsystems (Audio, GUI, Network, Win32)
   12.1 GiB [######    ] /drivers (NVMe, VirtIO-GPU, HDA, e1000)
    8.2 GiB [####      ] /apps/win32 (PE32+ Binaries, DLLs)
    4.5 GiB [##        ] /kernel (Ring 0 ELF image, GDT, IDT, VMM)
    3.2 GiB [#         ] /var/cache/sys_build
    1.6 GiB [          ] /var/log/journal
 Total disk usage: 48.0 GiB Apparent size: 48.0 GiB Items: 1,447`;
        break;
      }

      case 'eza':
      case 'ls': {
        output = `Permissions Size User Group Date Modified Name
drwxr-xr-x     - root root  24 Aug 21:00  📁 boot/ (x86_64 multiboot)
drwxr-xr-x     - root root  24 Aug 21:00  📁 drivers/ (NVMe, VirtIO, HDA, e1000)
drwxr-xr-x     - root root  24 Aug 21:00  📁 kernel/ (kmain, pmm, vmm, scheduler)
drwxr-xr-x     - root root  24 Aug 21:00  📁 subsystems/ (audio, gui, net, win32)
-rwxr-xr-x  4.2M root root  24 Aug 21:00  📜 build_subsystem.py
-rw-r--r--  1.8K root root  24 Aug 21:00  📜 Makefile
-rw-r--r--  2.4K root root  24 Aug 21:00  📜 linker.ld`;
        break;
      }

      case 'gparted': {
        output = `GParted 1.6.0 -- Live Partition Table Inspection (/dev/nvme0n1)
Disk /dev/nvme0n1: 1024 GiB, 1100000000000 bytes, 2147483648 sectors
Disk model: PCIe NVMe Gen4 High-Speed SSD (1024 GB)
Sector size (logical/physical): 512 bytes / 512 bytes
Partition table: GPT (GUID Partition Table)
Status: All 5 partition boundaries aligned to 1 MiB physical sectors.`;
        break;
      }

      case 'cleanmgr':
      case 'fstrim': {
        output = `fstrim / -v: /: 14.8 GiB (15891464192 bytes) trimmed on /dev/nvme0n1p2
fstrim /home -v: /home: 32.1 GiB (34468143104 bytes) trimmed on /dev/nvme0n1p3
Storage Sense: Unallocated SSD NAND flash blocks reclaimed successfully.`;
        break;
      }

      case 'fio':
      case 'benchmark': {
        output = `fio-3.36: (g=0): rw=randread, bs=(R) 4096B-4096B, (W) 4096B-4096B, ioengine=libaio, iodepth=32
Starting 16 processes on /dev/nvme0n1
Jobs: 16 (f=16): [r(16)][100.0%][r=7120MiB/s,w=0KiB/s][r=792k,w=0 IOPS][eta 00m:00s]
read: IOPS=792k, BW=7120MiB/s (7466MB/s)(100GiB/14382msec)
  slat (nsec): min=850, max=14200, avg=1120.45
  clat (usec): min=28, max=320, avg=48.20, stdev=6.12
   lat (usec): min=30, max=324, avg=49.32
  clat percentiles (usec):
   |  1.00th=[   34],  5.00th=[   38], 10.00th=[   40], 20.00th=[   42],
   | 50.00th=[   48], 70.00th=[   52], 90.00th=[   56], 95.00th=[   62],
   | 99.00th=[   82], 99.50th=[   98], 99.90th=[  142], 99.99th=[  240]
Disk stats (read/write):
  nvme0n1: ios=26214400/0, merge=0/0, ticks=1264820/0, in_queue=1264820, util=98.4%
Result: NVMe Gen4 High-Speed Storage Bus Benchmark PASSED (7,120 MB/s Seq Read / 792K Random 4K IOPS).`;
        break;
      }

      case 'fsck':
      case 'e2fsck':
      case 'chkdsk': {
        const target = args[0] || '/dev/nvme0n1p2';
        const isRepair = args.includes('-y') || args.includes('/f') || args.includes('-a');
        if (isRepair) {
          const report = storageService.runFsckCheck(target, true);
          output = `e2fsck 1.47.0 (5-Feb-2026)
${target}: checking ext4 volume metadata...
${report.pass1_inodesStatus}
${report.pass2_dirStructureStatus}
${report.pass3_connectivityStatus}
${report.pass4_refCountsStatus}
${report.pass5_groupSummaryStatus}
${report.journalReplayStatus}

${target}: ***** FILE SYSTEM WAS MODIFIED AND CLEANED *****
${target}: ${report.checkedInodes}/16384000 files (0.1% non-contiguous), ${report.checkedBlocks}/65536000 blocks`;
        } else {
          const report = storageService.getFsckReport(target);
          output = `e2fsck 1.47.0 (5-Feb-2026)
${target}: checking ext4 volume metadata (read-only scan)...
${report.pass1_inodesStatus}
${report.pass2_dirStructureStatus}
${report.pass3_connectivityStatus}
${report.pass4_refCountsStatus}
${report.pass5_groupSummaryStatus}
${report.journalReplayStatus}

${target}: clean, ${report.checkedInodes}/16384000 files, ${report.checkedBlocks}/65536000 blocks`;
        }
        break;
      }

      case 'badblocks': {
        const target = args[0] || '/dev/nvme0n1p2';
        const grid = storageService.getBadBlocksGrid();
        const corrupted = grid.filter(b => b.status === 'CORRUPTED').length;
        output = `Checking blocks on ${target} (pattern 0xaa, 0x55, 0xff, 0x00)...
Testing with random pattern: done                                                 
Pass completed, ${corrupted} bad blocks found. (Block offsets: 27, 53)
Tip: Use 'fsck -y ${target}' or the Storage Cockpit Integrity GUI to remap bad blocks.`;
        break;
      }

      case 'smartctl': {
        output = `smartctl 7.4 2026-02-05 (x86_64) [SecureCurtain/sys]
=== START OF INFORMATION SECTION ===
Model Number:                       PCIe NVMe Gen4 High-Speed SSD (1024 GB)
Serial Number:                      NVME-GEN4-SYS-99420
Firmware Version:                   4B2QEXM7
PCI Vendor/Subsystem ID:            0x144d
IEEE OUI Identifier:                0x002538
Total NVM Capacity:                 1,024,209,543,168 [1.02 TB]
Critical Warning:                   0x00 (HEALTHY)
Temperature:                        38 Celsius
Available Spare:                    100%
Available Spare Threshold:          10%
Percentage Used:                    1%
Data Units Read:                    4,821,940 [2.46 TB]
Data Units Written:                 3,142,880 [1.60 TB]
Host Read Commands:                 48,291,040
Host Write Commands:                32,194,500
Controller Busy Time:               142 minutes
Power Cycles:                       18
Power On Hours:                     340 hours
Unsafe Shutdowns:                   0
Media and Data Integrity Errors:    0
Error Information Log Entries:      0
SMART overall-health self-assessment test result: PASSED`;
        break;
      }

      case 'hdparm': {
        output = `/dev/nvme0n1:
 Timing cached reads:   18420 MB in  2.00 seconds = 9210.00 MB/sec
 Timing buffered disk reads: 21360 MB in  3.00 seconds = 7120.00 MB/sec
 MultCount: 16 sectors | Geometry: 130541/255/63 sectors = 2147483648 | LBA48: supported`;
        break;
      }

      // jb7572_2026-08-24: Network & Security CLI Commands
      case 'ip': {
        const sub = (args[0] || 'a').toLowerCase();
        const secondArg = (args[1] || '').toLowerCase();

        if (sub === 'a' || sub === '-a' || sub === '--all' || sub === 'addr' || sub === 'address' || sub === '-4') {
          const ifaces = networkSecurityService.getInterfaces();
          const lines = [
            '# ip -a: Showing all network interfaces and assigned IPv4/IPv6 addresses',
            '# (Explanation: Use this to see what your machine\'s IP address is on each interface)',
            ''
          ];
          const rendered = ifaces.map((iface, idx) => {
            return `${idx + 1}: ${iface.name}: <BROADCAST,MULTICAST,${iface.state}> mtu ${iface.mtu} qdisc mq state ${iface.state} qlen 1000
    link/ether ${iface.mac} brd ff:ff:ff:ff:ff:ff
    inet ${iface.ipv4}/${iface.netmask === '255.255.255.0' ? '24' : iface.netmask === '255.0.0.0' ? '8' : '16'} brd ${iface.gateway} scope global dynamic ${iface.name}
    inet6 ${iface.ipv6} scope link 
    RX: bytes ${iface.rxBytes} packets ${iface.rxPackets} errors ${iface.rxErrors}
    TX: bytes ${iface.txBytes} packets ${iface.txPackets} errors ${iface.txErrors}`;
          }).join('\n\n');
          output = lines.join('\n') + rendered;
        } else if (sub === '-br' || sub === 'brief' || (sub === '-br' && secondArg === 'a')) {
          const ifaces = networkSecurityService.getInterfaces();
          const lines = [
            '# ip -br a: Brief one-line table of network interfaces and assigned addresses',
            '# (Explanation: Clean, compact summary without multi-line detail)',
            '',
            'INTERFACE        STATE          IPv4 ADDRESS              MAC ADDRESS',
            '--------------------------------------------------------------------------------'
          ];
          ifaces.forEach(i => {
            const padName = i.name.padEnd(16, ' ');
            const padState = i.state.padEnd(14, ' ');
            const padIp = `${i.ipv4}/24`.padEnd(25, ' ');
            lines.push(`${padName} ${padState} ${padIp} ${i.mac}`);
          });
          output = lines.join('\n');
        } else if (sub === 'link' || sub === '-l' || sub === '-link') {
          const ifaces = networkSecurityService.getInterfaces();
          const lines = [
            '# ip link: Hardware MAC & Data Link Layer status',
            '# (Explanation: Verify if physical Ethernet is plugged in or find hardware MAC address)',
            ''
          ];
          output = lines.join('\n') + ifaces.map((i, idx) => `${idx + 1}: ${i.name}: <BROADCAST,MULTICAST,${i.state}> mtu ${i.mtu} state ${i.state} mac ${i.mac}`).join('\n');
        } else if (sub === 'route' || sub === 'r' || sub === '-r' || sub === '-route') {
          output = `# ip route: Active IP routing paths and default gateway
# (Explanation: See which router gateway delivers traffic to external networks)

default via 192.168.1.1 dev eth0 proto dhcp src 192.168.1.140 metric 100
192.168.1.0/24 dev eth0 proto kernel scope link src 192.168.1.140 metric 100
192.168.50.0/24 dev wlan0 proto kernel scope link src 192.168.50.75 metric 600
127.0.0.0/8 dev lo proto kernel scope link src 127.0.0.1`;
        } else if (sub === 'neigh' || sub === 'n' || sub === '-neigh' || sub === 'arp') {
          output = `# ip neigh: Neighbor ARP cache table
# (Explanation: Discovered devices, printers, and router addresses on your local LAN)

192.168.1.1 dev eth0 lladdr 00:1a:2b:3c:4d:5e REACHABLE (Gateway)
192.168.1.50 dev eth0 lladdr 48:d7:05:ea:21:40 STALE (Storage NAS)
192.168.1.88 dev eth0 lladdr 70:85:c2:14:bb:9a REACHABLE (Mission Control Host)`;
        } else if (sub === '-s' || sub === 'stats') {
          const ifaces = networkSecurityService.getInterfaces();
          const lines = [
            '# ip -s link: Interface packet statistics & error counters',
            '# (Explanation: Diagnose network packet loss, bad cables, or dropped frames)',
            ''
          ];
          output = lines.join('\n') + ifaces.map((i, idx) => {
            return `${idx + 1}: ${i.name}: <BROADCAST,MULTICAST,${i.state}> mtu ${i.mtu}
    RX: bytes ${i.rxBytes} packets ${i.rxPackets} errors ${i.rxErrors} dropped 0
    TX: bytes ${i.txBytes} packets ${i.txPackets} errors ${i.txErrors} carrier 0`;
          }).join('\n\n');
        } else {
          output = `SecureCurtain iproute2 Network Management
Usage: ip [-a | link | route | neigh | -br a | -s link]

Switches and Arguments:
  • ip -a (or "ip a"): Shows all network interfaces and assigned IP addresses.
    Plain explanation: "Use this to see what your machine's IP address is."

  • ip -br a: Brief one-line-per-interface status and IP table.
    Plain explanation: "Clean, uncluttered summary of your active network addresses."

  • ip link: Layer-2 data link states and MAC hardware addresses.
    Plain explanation: "Checks if your network cable is connected and reads physical MAC IDs."

  • ip route: Routing table and default gateway IP.
    Plain explanation: "Shows where internet traffic is sent and what your router IP is."

  • ip neigh: Discovered neighbor ARP table.
    Plain explanation: "Finds other computers and devices connected to your local network."

  • ip -s link: Network packet transmission statistics and error counters.
    Plain explanation: "Diagnose dropped packets, bad Ethernet cables, and traffic volume."`;
        }
        break;
      }

      case 'ifconfig': {
        const ifaces = networkSecurityService.getInterfaces();
        output = ifaces.map(i => {
          return `${i.name}: flags=4163<${i.state},BROADCAST,RUNNING,MULTICAST>  mtu ${i.mtu}
        inet ${i.ipv4}  netmask ${i.netmask}  broadcast ${i.gateway}
        inet6 ${i.ipv6}  prefixlen 64  scopeid 0x20<link>
        ether ${i.mac}  txqueuelen 1000  (Ethernet)
        RX packets ${i.rxPackets}  bytes ${i.rxBytes} (${(i.rxBytes / (1024*1024)).toFixed(1)} MB)
        TX packets ${i.txPackets}  bytes ${i.txBytes} (${(i.txBytes / (1024*1024)).toFixed(1)} MB)`;
        }).join('\n\n');
        break;
      }

      case 'firewall-cmd':
      case 'ufw':
      case 'iptables':
      case 'netsh': {
        const active = networkSecurityService.isFirewallActive();
        const zone = networkSecurityService.getCurrentZone();
        const rules = networkSecurityService.getFirewallRules();
        output = `🛡️ SecureCurtain Packet Filter Engine (Stateful Inspection)
Status:          ${active ? 'ACTIVE (running, enforcing policies)' : 'INACTIVE (permissive mode)'}
Active Zone:     ${zone} (interfaces: eth0, wlan0)
Chain Table:     INPUT & OUTPUT [Filter / NAT / Mangle]
Total Rules:     ${rules.length} (${rules.filter(r => r.enabled).length} enabled)

Active Inbound / Outbound Chain:
--------------------------------------------------------------------------------
${rules.map((r, idx) => {
  const num = (idx + 1).toString().padStart(2, '0');
  const dir = r.direction.padEnd(8, ' ');
  const act = r.action.padEnd(6, ' ');
  const proto = r.protocol.padEnd(5, ' ');
  const ports = r.portRange.padEnd(10, ' ');
  const stat = r.enabled ? '[ENABLED]' : '[DISABLED]';
  return `#${num} ${dir} ${act} ${proto} Port:${ports} ${r.source} -> ${r.destination} ${stat}`;
}).join('\n')}`;
        break;
      }

      case 'ss':
      case 'netstat': {
        const sockets = networkSecurityService.getSockets();
        output = `Netid  State        Recv-Q Send-Q  Local Address:Port          Peer Address:Port        Process
======================================================================================================
` + sockets.map(s => {
          const proto = s.proto.toLowerCase().padEnd(6, ' ');
          const state = s.state.padEnd(12, ' ');
          const local = `${s.localAddress}:${s.localPort}`.padEnd(27, ' ');
          const peer = (s.foreignPort ? `${s.foreignAddress}:${s.foreignPort}` : `${s.foreignAddress}:*`).padEnd(24, ' ');
          const proc = `users:(("${s.processName}",pid=${s.pid},fd=3))`;
          return `${proto} ${state} 0      0       ${local} ${peer} ${proc}`;
        }).join('\n');
        break;
      }

      case 'ping': {
        const target = args[0] || '1.1.1.1';
        const res = networkSecurityService.runPing(target);
        output = res.logs.join('\n');
        break;
      }

      case 'traceroute':
      case 'tracert': {
        const target = args[0] || '1.1.1.1';
        const res = networkSecurityService.runTraceroute(target);
        output = res.logs.join('\n');
        break;
      }

      // jb7572_2026-08-24: DNS, Packet Capture & Network Analysis CLI Commands
      case 'dig':
      case 'nslookup':
      case 'host': {
        const target = args[0] || 'google.com';
        const res = networkSecurityService.resolveDns(target);
        output = `; <<>> DiG 9.18.18-SecureCurtain <<>> ${res.domain}
;; global options: +cmd
;; Got answer:
;; ->>HEADER<<- opcode: QUERY, status: ${res.status}, id: ${Math.floor(Math.random() * 50000 + 1000)}
;; flags: qr rd ra; QUERY: 1, ANSWER: ${res.records.length}, AUTHORITY: 0, ADDITIONAL: 1

;; QUESTION SECTION:
;${res.domain}.\t\t\tIN\tA

;; ANSWER SECTION:
${res.records.map(r => `${r.name}.\t\t${r.ttl}\tIN\t${r.type}\t${r.priority ? `${r.priority} ` : ''}${r.value}`).join('\n')}

;; Query time: ${res.queryTimeMs} msec
;; SERVER: ${res.serverUsed}#53(${res.serverUsed.split(' ')[0]})
;; WHEN: ${new Date().toUTCString()}
;; MSG SIZE  rcvd: ${120 + res.records.length * 16}`;
        break;
      }

      case 'tcpdump':
      case 'wireshark': {
        const packets = networkSecurityService.getCapturedPackets();
        output = `tcpdump: verbose output suppressed, use -v[v]... for full protocol decode
listening on eth0, link-type EN10MB (Ethernet), snapshot length 262144 bytes
--------------------------------------------------------------------------------
` + packets.map(p => {
          return `${p.timestamp} IP ${p.src}${p.srcPort ? `.${p.srcPort}` : ''} > ${p.dst}${p.dstPort ? `.${p.dstPort}` : ''}: ${p.protocol} ${p.info} (length ${p.lengthBytes})`;
        }).join('\n');
        break;
      }

      case 'whois': {
        const target = (args[0] || '1.1.1.1').toLowerCase();
        output = `% IANA WHOIS server
% Query: ${target}

Domain / IP:     ${target}
Organization:    ${target.includes('google') ? 'Google LLC' : target.includes('cloudflare') || target === '1.1.1.1' ? 'Cloudflare, Inc.' : target.includes('github') ? 'GitHub, Inc.' : 'APNIC / ARIN Delegated Network'}
ASN:             ${target.includes('google') ? 'AS15169' : target.includes('cloudflare') || target === '1.1.1.1' ? 'AS13335' : 'AS36459'}
Registration:    2010-04-12
Updated:         2025-11-20
Status:          clientTransferProhibited, clientUpdateProhibited
Name Servers:    ns1.${target}, ns2.${target}
DNSSEC:          signedDelegation (Valid)`;
        break;
      }

      case 'curl': {
        const target = args[0] || 'https://api.securecurtain.os/status';
        output = `*   Trying 192.168.1.140:443 via VirtIO-Net zero-copy TAP...
* Connected to ${target} port 443 (#0)
* TLS 1.3 connection using TLS_AES_256_GCM_SHA384
* Server certificate: CN=securecurtain.os, O=SecureCurtain Microkernel Authority
> GET / HTTP/2
> Host: ${target.replace('https://', '').replace('http://', '').split('/')[0]}
> User-Agent: SecureCurtain-Curl/1.0.4 libcurl/8.5.0
> Accept: */*
> 
< HTTP/2 200 OK
< server: SecureCurtain-Kernel-HTTP/1.0
< date: ${new Date().toUTCString()}
< content-type: application/json; charset=utf-8
< x-kernel-ring: Ring 3 Isolated
< x-watchdog-mttr: 1.4ms
< content-length: 184
< 
{
  "system": "SecureCurtain OS",
  "author": "SecureCurtain Core Architecture Team",
  "architecture": "x86_64 Long Mode",
  "status": "HEALTHY",
  "virtio_net": "ONLINE",
  "active_daemons": 7,
  "mttr_ms": 1.4
}`;
        break;
      }

      case 'virtio':
      case 'virtio-net': {
        output = `VirtIO Device Descriptor Table [PCI 0000:00:03.0]:
================================================================================
Device Name:      VirtIO Network Adapter (virtio-net-pci)
Subsystem ID:     0x1af4:0x1000 (Red Hat VirtIO PCI)
Driver Status:    DRV_OK | ACKNOWLEDGE | DRIVER | FEATURES_OK (Status: 0x0f)
VirtQueue Config: 
  • RX Queue (0): Size=256 descriptors, Ring Buffer=0x00000000_10402000
  • TX Queue (1): Size=256 descriptors, Ring Buffer=0x00000000_10404000
  • Ctrl Queue (2): Size=64 descriptors, Ring Buffer=0x00000000_10406000
Features Active:  VIRTIO_NET_F_CSUM, VIRTIO_NET_F_GUEST_CSUM, VIRTIO_NET_F_MAC,
                  VIRTIO_NET_F_STATUS, VIRTIO_F_VERSION_1, VIRTIO_F_RING_PACKED
Hardware MAC:     52:54:00:12:34:56
Link Speed:       10,000 Mbps (Full Duplex VirtIO TAP)
Hardware Rx/Tx:   Packets Rx: 28,492 | Tx: 14,920 | Zero-Copy DMA: ACTIVE`;
        break;
      }

      case 'dhclient':
      case 'dhcp': {
        const dev = args[0] || 'virtio0';
        output = `Internet Systems Consortium DHCP Client 4.4.3-P1 (SecureCurtain Microkernel)
Listening on LPF/${dev}/52:54:00:12:34:56
Sending on   LPF/${dev}/52:54:00:12:34:56
Sending on   Socket/fallback
DHCPDISCOVER on ${dev} to 255.255.255.255 port 67 interval 3 (xid=0x794a2b10)
DHCPOFFER of 192.168.1.140 from 192.168.1.1
DHCPREQUEST for 192.168.1.140 on ${dev} to 255.255.255.255 port 67 (xid=0x794a2b10)
DHCPACK of 192.168.1.140 from 192.168.1.1 (xid=0x794a2b10)
bound to 192.168.1.140 -- renewal in 43200 seconds.
Gateway: 192.168.1.1 | Subnet Mask: 255.255.255.0 | DNS: 1.1.1.1, 8.8.8.8`;
        break;
      }

      case 'watchdog':
      case 'watchdogctl': {
        output = `🛡️ SecureCurtain Ring 0 Supervisor Watchdog Monitor
================================================================================
Supervisor Status:  ONLINE (Core 0 APIC Timer Interrupt: 1000 Hz)
Subsystem Policy:   ISOLATE_AND_RESTART (Zero Host OS Kernel Panic)
Uptime Reliability: 99.999%
Mean Recovery (MTTR): 1.4 ms

Monitored Ring 3 Daemons:
  [PID 104] virtio_gpu_compositor      - Status: HEALTHY | Heartbeat: 1ms
  [PID 105] virtio_net_daemon          - Status: HEALTHY | Heartbeat: 2ms
  [PID 106] intel_hda_dsp_srv          - Status: HEALTHY | Heartbeat: 3ms
  [PID 107] posix_linux_personality    - Status: HEALTHY | Heartbeat: 1ms
  [PID 108] win32_nt_subsystem         - Status: HEALTHY | Heartbeat: 2ms
  [PID 109] vfs_ext4_storage_srv       - Status: HEALTHY | Heartbeat: 1ms
  [PID 110] ipc_capability_router      - Status: HEALTHY | Heartbeat: 1ms

Tip: Open the "Self-Healing Watchdog" GUI from the Start Menu to inject crash faults and observe instant recovery.`;
        break;
      }

      case 'iso':
      case 'qemu': {
        output = `📀 SecureCurtain Bootable ISO & QEMU Engine:
================================================================================
Image Target:   SecureCurtain-x86_64-v1.0.iso (Hybrid EFI / BIOS MBR)
Kernel Binary:  /boot/securecurtain.bin (x86_64 Freestanding ELF64)
Initrd Disk:    /boot/initrd.tar (VFS tree packaging)
GRUB 2.12 Config: /boot/grub/grub.cfg (multiboot2 protocol)

Quick Launch Command:
  qemu-system-x86_64 -name "SecureCurtain-OS" -enable-kvm -cpu host -m 4G -smp 4 \\
    -drive file=SecureCurtain-x86_64.iso,format=raw,media=cdrom \\
    -device virtio-net-pci,netdev=net0 -netdev user,id=net0 \\
    -device virtio-gpu-pci -serial stdio

Tip: Launch the "ISO & QEMU Build" app from the desktop to customize RAM, cores, and export scripts.`;
        break;
      }

      case 'geoip': {
        const nodes = networkSecurityService.getGeoIpNodes();
        output = `IP ADDRESS       CITY / COUNTRY              ASN / ORG                     BW (Kbps)  STATUS
========================================================================================================
` + nodes.map(n => {
          const ip = n.ip.padEnd(16, ' ');
          const loc = `${n.city}, ${n.countryCode}`.padEnd(27, ' ');
          const org = n.org.slice(0, 28).padEnd(29, ' ');
          const bw = `${n.bandwidthKbps.toFixed(1)}`.padEnd(10, ' ');
          return `${ip} ${loc} ${org} ${bw} ${n.threatLevel === 'BLOCKED' ? '🛑 BLOCKED' : '🟢 ACTIVE'}`;
        }).join('\n');
        break;
      }


      // jb7572_2026-08-24: Category 4 - System Configuration & Automation CLI Commands
      case 'systemctl':
      case 'service':
      case 'services.msc': {
        const sub = args[0] || 'status';
        const targetSrv = args[1];

        if (sub === 'status' && !targetSrv) {
          const srvs = systemConfigService.getServices();
          output = `UNIT                                   LOAD   ACTIVE  SUB     DESCRIPTION
========================================================================================================
` + srvs.map(s => {
            const name = (s.name + '.service').padEnd(38, ' ');
            const load = 'loaded'.padEnd(7, ' ');
            const active = (s.status === 'RUNNING' ? 'active' : 'inactive').padEnd(8, ' ');
            const substate = (s.status === 'RUNNING' ? 'running' : 'dead').padEnd(8, ' ');
            return `${name} ${load} ${active} ${substate} ${s.displayName} (PID: ${s.pid || '-'})`;
          }).join('\n');
        } else if (sub === 'status' && targetSrv) {
          const srvs = systemConfigService.getServices();
          const found = srvs.find(s => s.name === targetSrv || s.name === targetSrv.replace('.service', ''));
          if (!found) {
            output = `Unit ${targetSrv}.service could not be found.`;
            isError = true;
          } else {
            output = `● ${found.name}.service - ${found.displayName}
   Loaded: loaded (${found.execPath}; ${found.startup.toLowerCase()})
   Active: ${found.status === 'RUNNING' ? 'active (running)' : 'inactive (dead)'}
  Process: ${found.pid ? `${found.pid} (${found.name})` : 'none'}
   Memory: ${found.memoryMb}M (CPU: ${found.cpuPercent}%)
 CGroup: /system.slice/${found.name}.service
           ${found.pid ? `└─${found.pid} ${found.execPath}` : ''}`;
          }
        } else if (sub === 'start' && targetSrv) {
          const res = systemConfigService.startService(targetSrv.replace('.service', ''));
          output = res.message;
          isError = !res.success;
        } else if (sub === 'stop' && targetSrv) {
          const res = systemConfigService.stopService(targetSrv.replace('.service', ''));
          output = res.message;
          isError = !res.success;
        } else if (sub === 'restart' && targetSrv) {
          const res = systemConfigService.restartService(targetSrv.replace('.service', ''));
          output = res.message;
          isError = !res.success;
        } else {
          output = `Usage: systemctl [ status | start | stop | restart ] <unit.service>`;
        }
        break;
      }

      case 'reg':
      case 'regedit':
      case 'kconfig': {
        const sub = (args[0] || 'query').toLowerCase();
        
        // Helper to parse key identifier e.g. "HKCU\Software\Microsoft\Notepad" or "HKEY_LOCAL_MACHINE\SYSTEM"
        const parseKeyTarget = (rawKey?: string): { hive: RegistryHive; keyPath: string } | null => {
          if (!rawKey) return null;
          const cleaned = rawKey.replace(/^\[|\]$/g, '').replace(/\//g, '\\');
          const firstSlash = cleaned.indexOf('\\');
          let hiveStr = firstSlash === -1 ? cleaned : cleaned.substring(0, firstSlash);
          const pathStr = firstSlash === -1 ? '' : cleaned.substring(firstSlash + 1);

          hiveStr = hiveStr.toUpperCase();
          let hive: RegistryHive = 'HKLM';
          if (hiveStr === 'HKCU' || hiveStr === 'HKEY_CURRENT_USER') hive = 'HKCU';
          else if (hiveStr === 'HKLM' || hiveStr === 'HKEY_LOCAL_MACHINE') hive = 'HKLM';
          else if (hiveStr === 'KCONFIG') hive = 'KCONFIG';
          else if (hiveStr === 'HKCR' || hiveStr === 'HKEY_CLASSES_ROOT') hive = 'HKCR';
          else if (hiveStr === 'HKU' || hiveStr === 'HKEY_USERS') hive = 'HKU';
          else if (['HKLM', 'HKCU', 'KCONFIG', 'HKCR', 'HKU'].includes(hiveStr as any)) hive = hiveStr as RegistryHive;

          return { hive, keyPath: pathStr };
        };

        if (sub === '/?' || sub === '-h' || sub === '--help' || sub === 'help') {
          output = `REG.EXE: Windows Registry Console Tool (SecureCurtain Microkernel Subsystem)

Syntax:
  REG [ Operation ] [ Parameter List ]

Operations:
  REG QUERY  [KeyName] [/v ValueName | /s] [/f SearchString]
  REG ADD    [KeyName] [/v ValueName] [/t Type] [/d Data] [/f]
  REG DELETE [KeyName] [/v ValueName | /va] [/f]
  REG EXPORT [KeyName] [FileName.reg]
  REG IMPORT [FileName.reg]
  REG RESET  [/f]

Supported Hives:
  HKCU    (HKEY_CURRENT_USER - Per-user app settings: Notepad, Explorer, Taskmgr)
  HKLM    (HKEY_LOCAL_MACHINE - Subsystem security, policies, Windows NT specs)
  KCONFIG (Ring 0 Microkernel live tunables, SMP, TCP window, memory paging)

Examples:
  reg query HKCU\\Software\\Microsoft\\Notepad
  reg add HKCU\\Software\\Microsoft\\Notepad /v iFontSize /t REG_DWORD /d 16 /f
  reg add HKCU\\Software\\Microsoft\\Notepad /v fWrapText /t REG_DWORD /d 0 /f
  reg delete HKCU\\Software\\Microsoft\\Notepad /v iFontSize /f
  reg export HKCU\\Software\\Microsoft\\Notepad backup.reg
  reg import backup.reg`;
        } else if (sub === 'query' || sub === 'list') {
          const rawTarget = args[1] && !args[1].startsWith('/') ? args[1] : undefined;
          let filterValueName: string | undefined;
          let filterSearch: string | undefined;

          for (let i = 1; i < args.length; i++) {
            if (args[i].toLowerCase() === '/v' && args[i + 1]) {
              filterValueName = args[i + 1];
              i++;
            } else if (args[i].toLowerCase() === '/f' && args[i + 1]) {
              filterSearch = args[i + 1];
              i++;
            }
          }

          let hiveFilter: string | undefined;
          let pathFilter: string | undefined;
          if (rawTarget) {
            const parsed = parseKeyTarget(rawTarget);
            if (parsed) {
              hiveFilter = parsed.hive;
              pathFilter = parsed.keyPath;
            }
          }

          const results = systemConfigService.queryRegistry(hiveFilter, pathFilter, filterSearch || filterValueName);

          if (results.length === 0) {
            output = `ERROR: The system was unable to find the specified registry key or value.`;
            isError = true;
          } else {
            // Group by Key
            const groups: { [k: string]: RegistryEntry[] } = {};
            for (const r of results) {
              const fullKey = `${r.hive}\\${r.keyPath}`;
              if (!groups[fullKey]) groups[fullKey] = [];
              groups[fullKey].push(r);
            }

            const sections: string[] = [];
            for (const [keyHeader, keyEntries] of Object.entries(groups)) {
              let sec = `${keyHeader}\n`;
              for (const e of keyEntries) {
                const namePadded = `    ${e.valueName}`.padEnd(28, ' ');
                const typePadded = `${e.valueType}`.padEnd(16, ' ');
                let displayVal = String(e.value);
                if (e.valueType === 'REG_DWORD') {
                  const num = Number(e.value) || 0;
                  displayVal = `0x${num.toString(16)} (${num})`;
                }
                sec += `${namePadded} ${typePadded} ${displayVal}\n`;
              }
              sections.push(sec.trimEnd());
            }

            output = sections.join('\n\n') + `\n\nEnd of search: ${results.length} match(es) found.`;
          }
        } else if (sub === 'add') {
          const rawTarget = args[1] && !args[1].startsWith('/') ? args[1] : undefined;
          if (!rawTarget) {
            output = `ERROR: Key name is missing.\nType "REG ADD /?" for usage syntax.`;
            isError = true;
            break;
          }

          const parsed = parseKeyTarget(rawTarget);
          if (!parsed) {
            output = `ERROR: Invalid registry key specified "${rawTarget}".`;
            isError = true;
            break;
          }

          let valueName = '@'; // Default value
          let valueType: RegistryValueType = 'REG_SZ';
          let valueData: any = '';

          for (let i = 2; i < args.length; i++) {
            const flag = args[i].toLowerCase();
            if (flag === '/v' && args[i + 1]) {
              valueName = args[i + 1];
              i++;
            } else if (flag === '/t' && args[i + 1]) {
              const t = args[i + 1].toUpperCase();
              if (['REG_SZ', 'REG_DWORD', 'BOOL', 'REG_BINARY', 'REG_MULTI_SZ'].includes(t)) {
                valueType = t as RegistryValueType;
              }
              i++;
            } else if (flag === '/d' && args[i + 1] !== undefined) {
              valueData = args[i + 1];
              i++;
            }
          }

          if (valueType === 'REG_DWORD') {
            valueData = parseInt(String(valueData), 10);
            if (isNaN(valueData)) valueData = 0;
          } else if (valueType === 'BOOL') {
            valueData = valueData === 'true' || valueData === '1' || valueData === 1;
          }

          const res = systemConfigService.setRegistryValue(
            parsed.hive,
            parsed.keyPath,
            valueName,
            valueData,
            valueType
          );

          if (res.success) {
            output = `The operation completed successfully.\n[${parsed.hive}\\${parsed.keyPath}] "${valueName}" [${valueType}] = ${valueData}`;
          } else {
            output = `ERROR: ${res.message}`;
            isError = true;
          }
        } else if (sub === 'delete') {
          const rawTarget = args[1] && !args[1].startsWith('/') ? args[1] : undefined;
          if (!rawTarget) {
            output = `ERROR: Key name is missing.\nType "REG DELETE /?" for usage syntax.`;
            isError = true;
            break;
          }

          const parsed = parseKeyTarget(rawTarget);
          if (!parsed) {
            output = `ERROR: Invalid registry key specified "${rawTarget}".`;
            isError = true;
            break;
          }

          let valueName: string | undefined;
          for (let i = 2; i < args.length; i++) {
            const flag = args[i].toLowerCase();
            if (flag === '/v' && args[i + 1]) {
              valueName = args[i + 1];
              i++;
            } else if (flag === '/va') {
              valueName = undefined; // delete all values
            }
          }

          const res = systemConfigService.deleteRegistryValue(parsed.hive, parsed.keyPath, valueName);
          if (res.success) {
            output = `The operation completed successfully. ${res.message}`;
          } else {
            output = `ERROR: ${res.message}`;
            isError = true;
          }
        } else if (sub === 'export') {
          const rawTarget = args[1] && !args[1].startsWith('/') ? args[1] : undefined;
          const fileName = args[2] || (rawTarget ? 'registry_export.reg' : 'full_system_registry.reg');

          let hiveFilter: RegistryHive | 'ALL' = 'ALL';
          let pathFilter: string | undefined;

          if (rawTarget) {
            const parsed = parseKeyTarget(rawTarget);
            if (parsed) {
              hiveFilter = parsed.hive;
              pathFilter = parsed.keyPath;
            }
          }

          const regContent = systemConfigService.exportRegistryHive(hiveFilter, pathFilter);

          output = `The operation completed successfully.\nRegistry hive [${rawTarget || 'ALL'}] exported to "${fileName}".\n` +
                   `----------------------------------------------------------------------\n` +
                   regContent.split('\n').slice(0, 25).join('\n') +
                   (regContent.split('\n').length > 25 ? `\n... [${regContent.split('\n').length - 25} more lines omitted for display]` : '');
        } else if (sub === 'import') {
          const targetFile = args[1];
          if (!targetFile) {
            output = `ERROR: Registry script file or content parameter missing.\nUsage: reg import <FileName.reg>`;
            isError = true;
            break;
          }

          // Sample or simulate file import
          const res = systemConfigService.importRegistryContent(targetFile);
          if (res.success) {
            output = `The operation completed successfully. Imported ${res.importedCount} registry parameter(s).`;
          } else {
            output = `ERROR: Failed to import registry script. No valid entries were parsed.`;
            isError = true;
          }
        } else if (sub === 'reset') {
          const res = systemConfigService.resetRegistryToDefaults();
          output = `The operation completed successfully.\n${res.message}`;
        } else if (sub === 'get' && args[1]) {
          const target = args[1];
          const entries = systemConfigService.getRegistryEntries();
          const found = entries.find(e => e.valueName.toLowerCase() === target.toLowerCase() || e.keyPath.includes(target));
          if (!found) {
            output = `ERROR: The system was unable to find the specified registry key or value "${target}".`;
            isError = true;
          } else {
            output = `Hive:        ${found.hive}
Key:         ${found.keyPath}
Name:        ${found.valueName}
Type:        ${found.valueType}
Data:        ${found.value}
Tunable:     ${found.isKernelTunable ? 'YES (Ring 0 Live Sysctl)' : 'NO (Persisted Setting)'}
Description: ${found.description}`;
          }
        } else {
          output = `Usage: reg [ query | add | delete | export | import | reset | get <name> ]\nType "reg /?" for syntax help.`;
        }
        break;
      }

      case 'crontab':
      case 'schtasks':
      case 'cron': {
        const sub = args[0] || '-l';
        const tasks = systemConfigService.getScheduledTasks();

        if (sub === '-l' || sub === 'list' || sub === '/query') {
          output = `# Scheduled Cron Table & Automation Tasks (/etc/crontab)
# m h dom mon dow   command
# ======================================================================
` + tasks.map(t => {
            const expr = t.scheduleExpr.padEnd(38, ' ');
            const status = t.enabled ? '[ENABLED]' : '[DISABLED]';
            return `${expr} ${t.command.padEnd(32, ' ')} ${status} (runs: ${t.runCount})`;
          }).join('\n');
        } else if ((sub === 'run' || sub === '/run') && args[1]) {
          const res = systemConfigService.runTaskNow(args[1]);
          output = res.message;
          isError = !res.success;
        } else {
          output = `Usage: crontab [ -l | list | run <taskId> ]`;
        }
        break;
      }

      case 'sysctl': {
        const sub = args[0] || '-a';
        const params = systemConfigService.getSysctlParams();

        if (sub === '-a' || sub === '-p') {
          output = params.map(p => `${p.key} = ${p.currentValue}  (${p.description})`).join('\n');
        } else if (sub === '-w' && args[1]) {
          const pair = args[1];
          const [k, v] = pair.split('=');
          const res = systemConfigService.updateSysctlParam(k.trim(), isNaN(Number(v)) ? v : Number(v));
          output = res.message;
          isError = !res.success;
        } else if (sub.includes('=')) {
          const [k, v] = sub.split('=');
          const res = systemConfigService.updateSysctlParam(k.trim(), isNaN(Number(v)) ? v : Number(v));
          output = res.message;
          isError = !res.success;
        } else {
          const found = params.find(p => p.key === sub);
          if (found) {
            output = `${found.key} = ${found.currentValue}  [default: ${found.defaultValue}, range: ${found.min ?? 0} - ${found.max ?? 'N/A'}]`;
          } else {
            output = `sysctl: cannot stat /proc/sys/${sub.replace(/\./g, '/')}: No such file or directory`;
            isError = true;
          }
        }
        break;
      }

      case 'timedatectl':
      case 'date':
      case 'ntpdate': {
        const sub = args[0];
        const tInfo = systemConfigService.getTimeDateInfo();

        if (!sub || sub === 'status') {
          output = `               Local time: ${tInfo.localTime}
           Universal time: ${tInfo.utcTime}
                 RTC time: ${tInfo.rtcTime}
                Time zone: ${tInfo.timeZone}
System clock synchronized: ${tInfo.ntpSynchronized ? 'yes' : 'no'}
              NTP service: ${tInfo.ntpActive ? 'active' : 'inactive'}
          RTC in local TZ: ${tInfo.rtcInLocalTz ? 'yes' : 'no'}
               NTP Server: ${tInfo.ntpServer}
          Estimated Drift: ${tInfo.driftPpm} PPM`;
        } else if (sub === 'set-timezone' && args[1]) {
          const res = systemConfigService.setTimeZone(args[1]);
          output = res.message;
        } else if (sub === 'set-ntp' && args[1]) {
          const enable = args[1] === 'true' || args[1] === '1' || args[1] === 'yes';
          const res = systemConfigService.setNtpActive(enable);
          output = res.message;
        } else if (sub === 'sync' || sub === 'ntp-sync') {
          const res = systemConfigService.syncNtpNow();
          output = res.message;
        } else {
          output = `Usage: timedatectl [ status | set-timezone <tz> | set-ntp <0|1> | sync ]`;
        }
        break;
      }

      case 'powerprofilesctl':
      case 'cpupower':
      case 'powercfg': {
        const sub = args[0] || 'status';
        const pInfo = systemConfigService.getPowerProfileInfo();

        if (sub === 'get' || sub === 'status' || sub === 'frequency-info') {
          output = `Active Power Profile:  [${pInfo.activeProfile.toUpperCase()}]
CPU Scaling Governor:  ${pInfo.cpuGovernor}
Turbo Boost Status:    ${pInfo.turboBoost ? 'ENABLED' : 'DISABLED'}
Current Frequency:     ${pInfo.currentFreqGhz} GHz (Max: ${pInfo.maxFreqGhz} GHz)
Power Consumption:     ${pInfo.powerDrawWatts} W
Battery Health:        ${pInfo.batteryHealthPercent}%
Available Profiles:    performance, balanced, power-saver`;
        } else if (sub === 'set' && args[1]) {
          const prof = args[1] as 'performance' | 'balanced' | 'power-saver';
          const res = systemConfigService.setPowerProfile(prof);
          output = res.message;
        } else if (sub === 'frequency-set' && args[1] === '-g' && args[2]) {
          const gov = args[2] as any;
          const res = systemConfigService.setCpuGovernor(gov);
          output = res.message;
        } else {
          output = `Usage: powerprofilesctl [ get | set <performance|balanced|power-saver> ]`;
        }
        break;
      }

      case 'env':
      case 'export':
      case 'set': {
        const envs = systemConfigService.getEnvVariables().filter(e => e.scope !== 'KERNEL_SYSCTL');
        output = envs.map(e => `${e.key}=${e.value}`).join('\n');
        break;
      }

      // jb7572_2026-08-24: Category 5 - Logs, Hardware & Auditing CLI Handlers
      case 'journalctl':
      case 'dmesg':
      case 'syslog':
      case 'eventvwr': {
        const logs = hardwareLogsService.getLogs();
        const flag = args[0] || '';
        
        let filtered = logs;
        if (flag === '-p' && args[1]) {
          const targetLevel = args[1].toUpperCase();
          filtered = logs.filter(l => l.level === targetLevel);
        } else if (flag === '-u' && args[1]) {
          const targetSub = args[1].toUpperCase();
          filtered = logs.filter(l => l.subsystem.includes(targetSub) || l.source.includes(args[1]));
        } else if (flag === '-k') {
          filtered = logs.filter(l => l.subsystem === 'KERNEL' || l.source === 'kernel');
        } else if (flag === '-e' || flag === '-n') {
          const n = parseInt(args[1] || '10', 10);
          filtered = logs.slice(0, n);
        }

        output = filtered.map(l => {
          const badge = `[${l.level.padEnd(5)}]`;
          return `${l.timestamp} [${l.subsystem}] ${badge} ${l.message}`;
        }).join('\n');
        if (!output) output = 'No log entries matched specified criteria.';
        break;
      }

      case 'lspci':
      case 'lsusb':
      case 'lshw':
      case 'devmgmt': {
        const devices = hardwareLogsService.getHardwareDevices();
        const isVerbose = args.includes('-v') || args.includes('-vv');
        
        output = `=== Enumerate Hardware Bus Devices (${devices.length} nodes) ===\n` + 
          devices.map(d => {
            if (isVerbose) {
              return `${d.busAddress} ${d.name} (${d.status})\n  Vendor: ${d.vendor} | Device: ${d.deviceModel}\n  Driver: ${d.driver} | IRQ: ${d.irq} | Memory: ${d.memoryRange}`;
            }
            return `${d.busAddress.padEnd(20)} [${d.category.padEnd(14)}] ${d.name} (${d.driver})`;
          }).join('\n');
        break;
      }

      case 'sensors':
      case 'turbostat': {
        const s = hardwareLogsService.getSensors();
        output = `Core Temperatures & System Hardware Sensors:
  Package id 0:        +${s.cpuPackageTempC}°C  (crit = +100.0°C)
  Core 0..7 (P/E):     ${s.cpuCoresTempC.map((c, i) => `C${i}: +${c}°C`).join(', ')}
  GPU Junction:        +${s.gpuTempC}°C
  NVMe SSD:            +${s.nvmeTempC}°C
  Chassis Fan 1:       ${s.fanSpeedRpm} RPM (${s.fanSpeedPercent}%)
  CPU Package Power:   ${s.cpuPowerWatts} W (System: ${s.totalSystemWatts} W)
  Voltages:            Vcore: ${s.voltageVCore}V | +12V: ${s.voltage12V}V | +5V: ${s.voltage5V}V | +3.3V: ${s.voltage3V3}V
  Battery:             ${s.batteryPercent}% (${s.batteryStatus}, Health: ${s.batteryHealthPercent}%)`;
        break;
      }

      case 'systemd-analyze':
      case 'reliability':
      case 'uptime': {
        const audit = hardwareLogsService.getAuditSummary();
        const hrs = Math.floor(audit.systemUptimeSeconds / 3600);
        const mins = Math.floor((audit.systemUptimeSeconds % 3600) / 60);
        const secs = audit.systemUptimeSeconds % 60;

        output = `Startup finished in ${audit.microkernelInitTimeMs}ms (kernel) + ${audit.driversInitTimeMs}ms (drivers) + ${audit.userspaceInitTimeMs}ms (userspace) = ${(audit.lastBootDurationSec).toFixed(2)}s total
graphical.target reached after ${(audit.lastBootDurationSec).toFixed(2)}s in userspace.

System Reliability Index:
  • Overall Stability Score:  ${audit.reliabilityScore} / 10.0 (Optimal)
  • System Uptime:            ${hrs}h ${mins}m ${secs}s (${audit.systemUptimeSeconds} seconds)
  • Kernel Panics:            ${audit.totalKernelPanics}
  • Application Segfaults:    ${audit.totalAppCrashes}
  • Clean Reboots:            ${audit.cleanReboots}
  • Unclean Shutdowns:        ${audit.uncleanShutdowns}`;
        break;
      }

      // jb7572_2026-08-24: Category 6 - Package Delivery & Features CLI Handlers
      case 'apt':
      case 'winget':
      case 'pacman':
      case 'pkg': {
        const sub = args[0] || 'list';
        const target = args[1];

        if (sub === 'list') {
          const pkgs = packageManagementService.getPackages();
          output = `=== SecureCurtain Package Pool Repositories (${pkgs.length} packages) ===\n` +
            pkgs.map(p => {
              const statusTag = p.status === 'INSTALLED' ? '[INSTALLED]' : p.status === 'UPGRADABLE' ? '[UPGRADABLE]' : '[AVAILABLE] ';
              const sizeMb = (p.sizeBytes / (1024 * 1024)).toFixed(1);
              return `${statusTag} ${p.name.padEnd(24)} v${p.version.padEnd(10)} (${sizeMb} MB) [${p.repoSource}]\n    ${p.description}`;
            }).join('\n');
        } else if (sub === 'install') {
          if (!target) {
            output = 'Usage: apt install <package-name>';
            isError = true;
          } else {
            const res = packageManagementService.installPackage(target);
            output = res.message;
            if (!res.success) isError = true;
          }
        } else if (sub === 'upgrade' || sub === 'update') {
          if (target) {
            const res = packageManagementService.upgradePackage(target);
            output = res.message;
            if (!res.success) isError = true;
          } else {
            const res = packageManagementService.upgradeAll();
            output = res.message;
          }
        } else if (sub === 'remove' || sub === 'uninstall') {
          if (!target) {
            output = 'Usage: apt remove <package-name>';
            isError = true;
          } else {
            const res = packageManagementService.removePackage(target);
            output = res.message;
            if (!res.success) isError = true;
          }
        } else {
          output = `Unknown action: ${sub}. Supported: list, install <pkg>, upgrade [pkg], remove <pkg>`;
          isError = true;
        }
        break;
      }

      case 'dism':
      case 'optionalfeatures':
      case 'features': {
        const sub = args[0] || 'list';
        const target = args[1];

        if (sub === 'list' || sub === '/get-features') {
          const feats = packageManagementService.getFeatures();
          output = `=== Optional Microkernel & OS Subsystem Features ===\n` +
            feats.map(f => {
              const state = f.enabled ? '[ENABLED] ' : '[DISABLED]';
              const reboot = f.requiresReboot ? ' (Reboot required)' : '';
              return `${state} ${f.name} [${f.category}]${reboot}\n    ${f.description}`;
            }).join('\n');
        } else if (sub === 'toggle' || sub === '/enable-feature' || sub === '/disable-feature') {
          if (!target) {
            output = 'Usage: dism toggle <featureId>';
            isError = true;
          } else {
            const res = packageManagementService.toggleFeature(target);
            output = res.message;
            if (!res.success) isError = true;
          }
        } else {
          output = 'Usage: dism list | dism toggle <featureId>';
        }
        break;
      }

      // jb7572_2026-08-24: Category 7 - Search & Indexing CLI Handlers
      case 'find':
      case 'fd': {
        const query = args.join(' ').replace(/^-name\s+/, '').replace(/^['"]|['"]$/g, '');
        const results = searchIndexingService.findFiles({ query });
        if (results.length === 0) {
          output = `find: No files matched query "${query}"`;
        } else {
          output = `=== Found ${results.length} files matching "${query}" ===\n` +
            results.map(r => {
              const sizeKb = (r.file.sizeBytes / 1024).toFixed(1);
              return `${r.file.permissions} ${sizeKb.padStart(6)} KB  ${r.file.path} (${r.file.lineCount} lines)`;
            }).join('\n');
        }
        break;
      }

      case 'grep':
      case 'rg':
      case 'ripgrep': {
        if (args.length === 0) {
          output = 'Usage: rg <search-term> [-i] [--regex]';
          isError = true;
        } else {
          const caseSensitive = !args.includes('-i');
          const cleanArgs = args.filter(a => a !== '-i' && a !== '-n');
          const term = cleanArgs.join(' ');
          const results = searchIndexingService.grepContent({ 
            query: term, 
            caseSensitive 
          });

          if (results.length === 0) {
            output = `rg: No occurrences found for "${term}"`;
          } else {
            const totalMatches = results.reduce((sum, r) => sum + r.matches.length, 0);
            output = `=== ripgrep: ${totalMatches} matches in ${results.length} files for "${term}" ===\n` +
              results.map(r => {
                const header = `\n📄 ${r.file.path}:`;
                const matchLines = r.matches.map(m => `  line ${m.lineNumber.toString().padEnd(4)}: ${m.lineContent.trim()}`).join('\n');
                return `${header}\n${matchLines}`;
              }).join('\n');
          }
        }
        break;
      }

      case 'locate':
      case 'updatedb':
      case 'indexer': {
        if (main === 'updatedb' || args[0] === 'rebuild') {
          const stats = searchIndexingService.rebuildIndex();
          output = `[INDEXER] System file catalog rebuild complete.\n  Indexed Files: ${stats.totalFiles}\n  Total Bytes:   ${(stats.totalSizeBytes / 1024).toFixed(1)} KB\n  Total Lines:   ${stats.totalLines}\n  Catalog Time:  ${stats.lastRebuilt}`;
        } else {
          const stats = searchIndexingService.getStats();
          output = `=== SecureCurtain Search Indexer Status ===\n  Catalog Status: ${stats.status}\n  Indexed Files:  ${stats.totalFiles}\n  Total Size:     ${(stats.totalSizeBytes / 1024).toFixed(1)} KB\n  Source Lines:   ${stats.totalLines}\n  Last Rebuilt:   ${stats.lastRebuilt}\n  Monitored Trees:\n    ${stats.indexedPaths.join('\n    ')}`;
        }
        break;
      }

      // jb7572_2026-08-24: Unified Overview & Health HUD CLI Handlers
      case 'hud':
      case 'health':
      case 'healthcheck': {
        const hud = healthHudService.getHUDMetrics();
        const subsystems = healthHudService.getSubsystemsStatus();
        const incidents = healthHudService.getIncidents();
        
        output = `================================================================================
                    SecureCurtain UNIFIED SYSTEM HEALTH HUD & TELEMETRY
================================================================================
  Uptime:       ${hud.uptimeFormatted}        Boot Time:    ${hud.bootTimeSeconds.toFixed(2)}s
  CPU Load:     ${hud.cpuUsagePercent}% (4 Cores)        Peak Thermal: ${hud.thermalMaxC}°C
  Memory:       ${hud.memoryUsedMb} MB / ${hud.memoryTotalMb} MB (${hud.memoryUsedPercent}% Used)
  Storage:      ${hud.storageUsedPercent}% Capacity Used        Net I/O:      ${hud.networkThroughputMbps} Mbps
  Tasks:        ${hud.activeProcesses} Active Procs        Daemons:      ${hud.runningDaemons} Systemd Units
  Catalog:      ${hud.indexedFilesCount} Indexed Files       Firewall:     ${hud.firewallBlockedCount} Packets Filtered

--- Subsystem Status Grid ---
` + subsystems.map(s => {
          const statusTag = s.status === 'HEALTHY' ? '[  OK  ]' : s.status === 'WARNING' ? '[ WARN ]' : '[ALERT ]';
          return `  ${statusTag} ${s.name.padEnd(28)} | ${s.metric.padEnd(14)} | ${s.detail}`;
        }).join('\n') + `\n\n--- Active Incidents (${incidents.filter(i => !i.resolved).length} unresolved) ---\n` +
        incidents.map(i => {
          const res = i.resolved ? '[RESOLVED]' : `[${i.level}]`;
          return `  ${res.padEnd(11)} ${i.timestamp.padEnd(12)} ${i.subsystem}: ${i.message}`;
        }).join('\n');
        break;
      }

      case 'neofetch':
      case 'fastfetch': {
        const hud = healthHudService.getHUDMetrics();
        output = `
       _             _     admin@SecureCurtain-station
 _____| |___________| |    -------------------
|  _  | |  _  /  _  | |    OS: SecureCurtain (x86_64 Long Mode Ring 0)
| | | | | | | | | | | |    Kernel: 1.0.4-microkernel-rel
| | | |_| |_| | |_| |_|    Uptime: ${hud.uptimeFormatted}
|_| |_|\\____,_|\\____,_|    Packages: 9 (apt/winget pool)
                           Shell: SecureCurtain ash 1.4.2
                           Terminal: Cockpit Virtual PTY
                           CPU: Intel Core i9-13900K (4 vCPUs active)
                           GPU: VirtIO-GPU 3D (Mesa Vulkan)
                           Memory: ${hud.memoryUsedMb}MiB / ${hud.memoryTotalMb}MiB
                           Thermal: ${hud.thermalMaxC}°C (Optimal)
                           Disk: ${hud.storageUsedPercent}% NVMe 980 PRO
`;
        break;
      }

      // jb7572_2026-08-24: Category / Item 2 - Process Virtual Memory & Disassembler CLI Handlers
      case 'gdb':
      case 'regs': {
        const pid = parseInt(args[0]) || 1;
        const mem = memoryDebuggerService.getProcessMemoryDetail(pid);
        const r = mem.registers;
        output = `=== GDB Registers Snapshot [PID ${mem.pid} (${mem.name})] ===
RIP: ${r.rip}   RSP: ${r.rsp}   RBP: ${r.rbp}
RAX: ${r.rax}   RBX: ${r.rbx}   RCX: ${r.rcx}
RDX: ${r.rdx}   RSI: ${r.rsi}   RDI: ${r.rdi}
R8:  ${r.r8}   R9:  ${r.r9}   R10: ${r.r10}
R11: ${r.r11}   R12: ${r.r12}   R13: ${r.r13}
R14: ${r.r14}   R15: ${r.r15}
RFLAGS: ${r.rflags}
CR0: ${r.cr0}
CR3: ${r.cr3} (Page Table Root)
CR4: ${r.cr4}`;
        break;
      }

      case 'readelf':
      case 'maps':
      case 'pmap': {
        const pid = parseInt(args[0]) || 1;
        const mem = memoryDebuggerService.getProcessMemoryDetail(pid);
        output = `=== Virtual Memory Map [PID ${mem.pid} (${mem.name})] (PML4: ${mem.pageTableRootCR3}) ===\n` +
          'START ADDR           END ADDR             SIZE (KB)   PERMS  SECTION / MAPPING\n' +
          '--------------------------------------------------------------------------------\n' +
          mem.sections.map(s => {
            const kb = (s.sizeBytes / 1024).toFixed(0).padStart(7);
            const map = s.mappingFile ? ` -> ${s.mappingFile}` : '';
            return `${s.startAddr}  ${s.endAddr}  ${kb} KB    ${s.permissions}   ${s.name.padEnd(16)}${map}`;
          }).join('\n');
        break;
      }

      case 'objdump':
      case 'disasm': {
        const pid = parseInt(args[0]) || 1;
        const mem = memoryDebuggerService.getProcessMemoryDetail(pid);
        output = `=== Disassembly of Section .text [PID ${mem.pid} (${mem.name})] ===\n` +
          mem.instructions.map(ins => {
            const commentStr = ins.comment ? `  ; ${ins.comment}` : '';
            return `${ins.address}:  ${ins.rawHex.padEnd(20)}  ${ins.mnemonic.padEnd(7)} ${ins.operands}${commentStr}`;
          }).join('\n');
        break;
      }

      case 'xxd':
      case 'hexdump': {
        const addr = args[0] || '0x0000000000401000';
        const dump = memoryDebuggerService.readRawMemoryHex(addr, 8);
        output = `=== Hex Memory Dump at ${addr} ===\n` +
          dump.map(line => {
            const hexFormatted = line.hexBytes.slice(0, 8).join(' ') + '  ' + line.hexBytes.slice(8).join(' ');
            return `${line.offset}:  ${hexFormatted.padEnd(48)}  |${line.ascii}|`;
          }).join('\n');
        break;
      }

      case 'man': {
        const target = args[0]?.toLowerCase();
        if (!target) {
          output = 'What manual page do you want? (e.g. "man sys-update", "man watchdog", "man ip", "man ls")';
          isError = true;
          break;
        }
        const doc = COMMAND_DOCS[target];
        if (doc) {
          output = `NAME
    ${doc.name} - ${doc.description}

CATEGORY
    ${doc.category}

SYNOPSIS
    ${doc.syntax}

EXAMPLES
    ${doc.examples.join('\n    ')}

${doc.windowsEquivalent ? `WINDOWS / POWERSHELL EQUIVALENT\n    ${doc.windowsEquivalent}\n` : ''}${doc.seeAlso ? `SEE ALSO\n    ${doc.seeAlso.join(', ')}` : ''}`;
        } else {
          output = `No manual entry for ${target}. Type "help" or "tldr ${target}" for available utilities.`;
          isError = true;
        }
        break;
      }

      case 'tldr': {
        const target = args[0]?.toLowerCase();
        if (!target) {
          output = 'Usage: tldr <command> (e.g. "tldr curl", "tldr sys-update", "tldr btop")';
          isError = true;
          break;
        }
        const doc = COMMAND_DOCS[target];
        if (doc) {
          output = `┌─ ${doc.name} (${doc.category}) ────────────────────────────────
│ ${doc.description}
│
│ • Typical command usage:
${doc.examples.map(ex => `│   $ ${ex}`).join('\n')}
${doc.windowsEquivalent ? `│\n│ • Windows / PowerShell counterpart:\n│   ${doc.windowsEquivalent}` : ''}
└─────────────────────────────────────────────────────────`;
        } else {
          output = `No quick cheat sheet found for "${target}". Try "man ${target}" or "help".`;
          isError = true;
        }
        break;
      }

      default:
        // Check extended multi-domain command executor (Linux, POSIX, Hardware, Windows/PowerShell)
        const extResult = CliCommandExecutor.execute(main, args, '/');
        if (extResult) {
          output = extResult.output;
          isError = !!extResult.isError;
        } else {
          isError = true;
          const fuzzy = CliAssistantService.findClosestCommand(main);
          if (fuzzy.bestMatch && fuzzy.bestMatch.toLowerCase() !== main) {
            mistypedSuggestion = fuzzy;
            setLastSuggestion(fuzzy.bestMatch);
            let suggestionText = `\n\n💡 Did you mean: "${fuzzy.bestMatch}"?`;
            suggestionText += `\n   • Press [Tab] to auto-fill or click below to run.`;
            if (fuzzy.alternatives.length > 1) {
              const others = fuzzy.alternatives.filter(a => a.toLowerCase() !== fuzzy.bestMatch?.toLowerCase()).slice(0, 3);
              if (others.length > 0) {
                suggestionText += `\n   • Other possibilities: ${others.join(', ')}`;
              }
            }
            output = `sh: command not found: "${main}".${suggestionText}\n\nType "help" to see available utilities or press [Tab] to accept suggestion.`;
          } else {
            output = `sh: command not found: "${main}". Type "help" or "help --all" to explore available SecureCurtain utilities.`;
          }
        }
        break;
    }

    // If the command fulfilled successfully, provide pro tips, switches & arguments
    if (!isError && main !== 'clear' && main !== 'cls') {
      if (!guide) {
        guide = CliAssistantService.getCommandGuide(main);
      }
      setLastSuggestion(null);
    }

    setHistory(prev => [
      ...prev,
      {
        id: `cmd_${Date.now()}`,
        command: rawCmd,
        output,
        isError,
        mistypedSuggestion,
        guide
      }
    ]);
  };

  const handleApplyCommand = (cmd: string, autoRun: boolean = false) => {
    if (autoRun) {
      executeCommand(cmd);
      setInputVal('');
      setLastSuggestion(null);
    } else {
      setInputVal(cmd);
      inputRef.current?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const trimmed = inputVal.trim();
      
      // If prompt is empty or just 'y' and we have a mistyped suggestion pending:
      if ((!trimmed || trimmed === 'y') && lastSuggestion) {
        setInputVal(lastSuggestion + ' ');
        setLastSuggestion(null);
        return;
      }

      if (!trimmed) return;

      const tokens = trimmed.split(' ');
      const firstToken = tokens[0].toLowerCase();

      // If user typed a command and is typing a switch (e.g. "watchdog --")
      if (tokens.length > 1) {
        const partialSwitch = tokens[tokens.length - 1];
        const cmdGuide = CliAssistantService.getCommandGuide(firstToken);
        if (cmdGuide && partialSwitch.startsWith('-')) {
          const matchingSwitches = cmdGuide.switches.filter(s => 
            s.flag.toLowerCase().startsWith(partialSwitch.toLowerCase())
          );
          if (matchingSwitches.length === 1) {
            const baseTokens = tokens.slice(0, -1);
            setInputVal([...baseTokens, matchingSwitches[0].flag].join(' ') + ' ');
            return;
          } else if (matchingSwitches.length > 1) {
            setHistory(prev => [
              ...prev,
              {
                id: `autocomplete_${Date.now()}`,
                command: inputVal,
                output: `Available Switches for "${firstToken}":\n  ${matchingSwitches.map(s => `${s.flag} (${s.description})`).join('\n  ')}`
              }
            ]);
            return;
          }
        }
      }

      // Autocomplete command name from master dictionary
      const matches = ALL_CLI_COMMANDS.filter(c => c.toLowerCase().startsWith(trimmed.toLowerCase()));
      if (matches.length === 1) {
        setInputVal(matches[0] + ' ');
      } else if (matches.length > 1) {
        setHistory(prev => [
          ...prev,
          {
            id: `autocomplete_${Date.now()}`,
            command: inputVal,
            output: `Suggestions:\n  ${matches.slice(0, 16).join('   ')}${matches.length > 16 ? ` ... (+${matches.length - 16} more)` : ''}`
          }
        ]);
      } else {
        // Check if there's a close fuzzy match for what they typed so far
        const fuzzy = CliAssistantService.findClosestCommand(trimmed);
        if (fuzzy.bestMatch && fuzzy.bestMatch !== trimmed) {
          setInputVal(fuzzy.bestMatch + ' ');
        }
      }
    } else if (e.key === 'Enter') {
      executeCommand(inputVal);
      setInputVal('');
    } else if (e.key === 'ArrowUp') {
      if (pastCommands.length > 0) {
        const nextIdx = historyIndex + 1 < pastCommands.length ? historyIndex + 1 : historyIndex;
        setHistoryIndex(nextIdx);
        setInputVal(pastCommands[pastCommands.length - 1 - nextIdx] || '');
      }
    } else if (e.key === 'ArrowDown') {
      if (historyIndex > 0) {
        const nextIdx = historyIndex - 1;
        setHistoryIndex(nextIdx);
        setInputVal(pastCommands[pastCommands.length - 1 - nextIdx] || '');
      } else if (historyIndex === 0) {
        setHistoryIndex(-1);
        setInputVal('');
      }
    }
  };

  return (
    <div className={`bg-[#080808] border border-[#222] rounded-xl overflow-hidden shadow-2xl flex flex-col transition-all ${
      isExpanded ? 'h-[580px]' : 'h-[360px]'
    }`}>
      {/* Terminal Title Bar */}
      <div className="bg-[#111] px-4 py-2 border-b border-[#222] flex items-center justify-between select-none">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-rose-500/80" />
            <div className="w-2.5 h-2.5 rounded-full bg-amber-500/80" />
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
          </div>
          <span className="text-xs font-mono text-[#a3a3a3] font-semibold ml-2 flex items-center gap-1.5">
            <Terminal className="w-3.5 h-3.5 text-[#c4b5fd]" />
            SecureCurtain Terminal Console [sys/bin/sh]
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* CLI Assistant Pro Tips Toggle */}
          <button
            onClick={() => setIsAssistantEnabled(!isAssistantEnabled)}
            className={`px-2 py-0.5 rounded text-[10px] font-mono font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
              isAssistantEnabled 
                ? 'bg-indigo-950/70 text-indigo-300 border border-indigo-700/50 hover:bg-indigo-900/60' 
                : 'bg-[#222] text-zinc-400 border border-zinc-700/40 hover:text-zinc-200'
            }`}
            title="Toggle interactive Pro Tips & Switches explorer after commands"
          >
            <Sparkles className="w-3 h-3 text-indigo-400" />
            <span>Assistant: {isAssistantEnabled ? 'ON' : 'OFF'}</span>
          </button>

          <button
            onClick={() => setHistory([])}
            className="p-1 hover:bg-[#222] rounded text-[#777] hover:text-[#ddd] cursor-pointer"
            title="Clear Screen"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1 hover:bg-[#222] rounded text-[#777] hover:text-[#ddd] cursor-pointer"
            title={isExpanded ? 'Collapse' : 'Expand'}
          >
            {isExpanded ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Terminal Output Stream */}
      <div 
        ref={outputContainerRef}
        className="flex-1 p-4 font-mono text-xs overflow-y-auto space-y-3.5 custom-scrollbar text-[#e5e5e5]"
      >
        {history.map((item) => (
          <div key={item.id} className="space-y-1.5">
            <div className="flex items-center gap-2 text-[#a3a3a3]">
              <span className="text-emerald-400 font-bold">root@SecureCurtain:sys#</span>
              <span className="text-[#f5f5f5] font-semibold">{item.command}</span>
            </div>
            <pre className={`whitespace-pre-wrap leading-relaxed font-mono ${
              item.isError ? 'text-rose-400' : 'text-[#bbb]'
            }`}>
              {item.output}
            </pre>

            {/* Interactive Mistyped Command Suggestion */}
            {item.mistypedSuggestion && (
              <CliMistypedSuggestionCard
                suggestion={item.mistypedSuggestion}
                onRunSuggestion={(cmd) => handleApplyCommand(cmd, true)}
                onFillSuggestion={(cmd) => handleApplyCommand(cmd, false)}
              />
            )}

            {/* Interactive Arguments, Switches & Power Tips Explorer */}
            {item.guide && isAssistantEnabled && !item.isError && (
              <CliCommandAssistantCard
                guide={item.guide}
                onApplyCommand={handleApplyCommand}
                defaultExpanded={true}
              />
            )}
          </div>
        ))}
      </div>

      {/* Terminal Threat Alert Preview */}
      {activeThreat && (
        <div className="px-3 py-1.5 bg-rose-950/40 border-t border-rose-800/40 flex items-center justify-between">
          <SecurityThreatBadge threatReport={activeThreat} fieldName="CLI Input" />
          <span className="text-[10px] text-rose-400 font-mono">Kernel Security Gateway Active</span>
        </div>
      )}

      {/* Live Argument & Switch Suggestion Strip */}
      {(() => {
        const trimmed = inputVal.trim();
        const mainToken = trimmed.split(' ')[0]?.toLowerCase();
        const activeGuide = mainToken ? CliAssistantService.getCommandGuide(mainToken) : null;
        
        if (activeGuide && trimmed.includes(' ')) {
          return (
            <div className="px-3 py-1.5 bg-[#0a0b14] border-t border-indigo-950/70 flex items-center gap-2 font-mono text-[11px] overflow-x-auto custom-scrollbar select-none">
              <span className="text-indigo-400 text-[10px] font-semibold shrink-0 flex items-center gap-1">
                <Sliders className="w-3 h-3" />
                Switches:
              </span>
              <div className="flex items-center gap-1.5 shrink-0">
                {activeGuide.switches.map((sw, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      const base = trimmed.split(' ')[0];
                      setInputVal(`${base} ${sw.flag.split(' ')[0]} `);
                      inputRef.current?.focus();
                    }}
                    className="px-2 py-0.5 rounded bg-indigo-950/60 hover:bg-indigo-900/90 text-indigo-200 border border-indigo-800/60 text-[10px] transition-colors cursor-pointer flex items-center gap-1.5 group"
                    title={`${sw.flag}${sw.meaning ? ` ("${sw.meaning}")` : ''}: ${sw.plainExplanation || sw.whatItDoes || sw.description}`}
                  >
                    <span className="font-bold text-amber-300 group-hover:text-amber-200">{sw.flag}</span>
                    {sw.meaning && <span className="text-zinc-400 text-[9px] hidden sm:inline font-sans">({sw.meaning})</span>}
                  </button>
                ))}
              </div>
            </div>
          );
        }

        if (lastSuggestion && !trimmed) {
          return (
            <div className="px-3 py-1 bg-amber-950/30 border-t border-amber-900/30 flex items-center justify-between font-mono text-[10px] text-amber-300 select-none">
              <span className="flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-amber-400" />
                Press <kbd className="px-1 py-0.2 bg-[#222] rounded border border-[#333] text-white">Tab</kbd> to auto-fill: <strong>"{lastSuggestion}"</strong>
              </span>
              <button
                type="button"
                onClick={() => handleApplyCommand(lastSuggestion, false)}
                className="underline hover:text-white cursor-pointer"
              >
                Auto-fill now
              </button>
            </div>
          );
        }

        return null;
      })()}

      {/* Terminal Prompt Input */}
      <div className="p-3 bg-[#0c0c0c] border-t border-[#1f1f1f] flex items-center gap-2 font-mono text-xs">
        <span className="text-emerald-400 font-bold shrink-0">root@SecureCurtain:sys#</span>
        <input
          ref={inputRef}
          type="text"
          value={inputVal}
          onChange={(e) => handleInputChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder='Type "watchdog", "virtio", "curl", "iso", or "help"...'
          className={`w-full bg-transparent placeholder-[#555] focus:outline-none ${
            activeThreat ? 'text-rose-300' : 'text-[#f5f5f5]'
          }`}
        />
        <CornerDownLeft className="w-3.5 h-3.5 text-[#555] shrink-0" />
      </div>
    </div>
  );
};
