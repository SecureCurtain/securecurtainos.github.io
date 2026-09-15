// jb7572_2026-09-02: Intelligent CLI Assistant Service
// Providing intelligent typo detection ("Did you mean?"), fuzzy command matching,
// rich argument/switch explorers, power recipes, and GUI alternative bridges.

import { COMMAND_DOCS } from './commandRegistryService';

export interface CommandSwitch {
  flag: string;
  meaning?: string;          // What the flag letters/words mean (e.g. "Address / All", "Human-readable sizes")
  whatItDoes: string;        // Plain, direct explanation of the action performed
  plainExplanation?: string; // Conversational guidance on why/when to use it
  description: string;       // Concise summary
  example?: string;
  badge?: 'POPULAR' | 'RECOMMENDED' | 'SAFETY' | 'DIAGNOSTIC' | 'ADVANCED' | 'OUTPUT';
}

// Plain-English dictionary for common POSIX and system switches so every argument has a clear explanation
export const COMMON_FLAG_MEANINGS: Record<string, { meaning: string; whatItDoes: string; plainExplanation: string }> = {
  '-a': {
    meaning: 'All / Address',
    whatItDoes: 'Shows all items, hidden entries, or all network interfaces with their assigned IP addresses.',
    plainExplanation: 'Use this to see everything without hidden or default filters (e.g. "ip -a" to view all IPs).'
  },
  '--all': {
    meaning: 'All items',
    whatItDoes: 'Shows every item, active and inactive, without omitting background entries.',
    plainExplanation: 'Shows a complete unconstrained list without hiding system defaults.'
  },
  '-l': {
    meaning: 'Long format',
    whatItDoes: 'Displays detailed metadata columns including permissions, ownership, byte sizes, and timestamps.',
    plainExplanation: 'Use this to inspect file permissions, who owns the file, and when it was modified.'
  },
  '-h': {
    meaning: 'Human-readable units',
    whatItDoes: 'Formats numbers into human-friendly units (such as K, M, G for kilobytes, megabytes, gigabytes).',
    plainExplanation: 'Converts raw byte numbers into easy-to-read units like 4.2 MB instead of 4404019 bytes.'
  },
  '--human-readable': {
    meaning: 'Human-readable units',
    whatItDoes: 'Converts raw byte counts into KB, MB, and GB values.',
    plainExplanation: 'Converts large raw numbers into readable file sizes.'
  },
  '-v': {
    meaning: 'Verbose',
    whatItDoes: 'Outputs detailed step-by-step progress and diagnostic messages while processing.',
    plainExplanation: 'Shows you everything the tool is doing under the hood as it happens.'
  },
  '--verbose': {
    meaning: 'Verbose output',
    whatItDoes: 'Prints comprehensive operation logging to stdout.',
    plainExplanation: 'Provides maximum detail for troubleshooting.'
  },
  '-q': {
    meaning: 'Quiet mode',
    whatItDoes: 'Suppresses informational messages and progress meters, showing only errors or final results.',
    plainExplanation: 'Keeps output clean and silent unless an error occurs.'
  },
  '-s': {
    meaning: 'Silent / Summary / Statistics',
    whatItDoes: 'Silences progress output or prints summarized statistics.',
    plainExplanation: 'Useful for scripts and uncluttered terminal output.'
  },
  '--silent': {
    meaning: 'Silent mode',
    whatItDoes: 'Silences progress meters and transfer gauges, outputting only the payload.',
    plainExplanation: 'Prevents progress bars from messing up terminal output or piped scripts.'
  },
  '-r': {
    meaning: 'Recursive',
    whatItDoes: 'Traverses through all nested directories and subfolders automatically.',
    plainExplanation: 'Applies the operation across the entire folder tree.'
  },
  '-R': {
    meaning: 'Recursive hierarchy',
    whatItDoes: 'Processes every file and folder in the tree downwards.',
    plainExplanation: 'Operates on every file inside all nested folders.'
  },
  '-f': {
    meaning: 'Force / Fast / Filesystem',
    whatItDoes: 'Overrides interactive confirmation prompts or displays filesystem information.',
    plainExplanation: 'Runs without pausing to ask for yes/no confirmation.'
  },
  '--force': {
    meaning: 'Force execution',
    whatItDoes: 'Ignores non-fatal warnings and runs without interactive confirmation.',
    plainExplanation: 'Forces the command to proceed without prompting.'
  },
  '-i': {
    meaning: 'Interactive / Ignore case / Interval',
    whatItDoes: 'Prompts before destructive actions, ignores case sensitivity, or sets time intervals.',
    plainExplanation: 'Prevents accidental deletes by asking first, or ignores uppercase/lowercase.'
  },
  '-p': {
    meaning: 'Process ID / Port / Preserve',
    whatItDoes: 'Specifies a target process ID, network port number, or preserves file timestamps and permissions.',
    plainExplanation: 'Pins the command to a specific port, process, or file attribute set.'
  },
  '-c': {
    meaning: 'Count / Packet limit',
    whatItDoes: 'Limits the number of packets or operations, or outputs a count of occurrences.',
    plainExplanation: 'Stops after a set count (e.g. "ping -c 4" sends 4 pings and stops).'
  },
  '-n': {
    meaning: 'Numeric / Number lines',
    whatItDoes: 'Displays line numbers or treats addresses numerically without DNS lookups.',
    plainExplanation: 'Shows line numbers or speeds up output by skipping slow DNS lookups.'
  },
  '-t': {
    meaning: 'Time sort / TCP protocol',
    whatItDoes: 'Sorts by modification timestamp or filters specifically for TCP connections.',
    plainExplanation: 'Shows newest files first or targets TCP network sockets.'
  },
  '-u': {
    meaning: 'User / UDP protocol',
    whatItDoes: 'Filters by user account or shows UDP socket endpoints.',
    plainExplanation: 'Focuses on a specific user or UDP network traffic.'
  },
  '-I': {
    meaning: 'Information / HTTP Headers',
    whatItDoes: 'Fetches HTTP response headers and status codes only without downloading the page body.',
    plainExplanation: 'Checks in milliseconds if a website or API is online and what server it runs.'
  },
  '-X': {
    meaning: 'eXecute custom HTTP verb',
    whatItDoes: 'Specifies custom request methods like POST, PUT, DELETE, or PATCH.',
    plainExplanation: 'Use this when testing REST APIs that require POST or PUT instead of GET.'
  },
  '--status': {
    meaning: 'Service / Sentinel Status',
    whatItDoes: 'Queries the current running status, health metrics, and uptime.',
    plainExplanation: 'Shows whether the service or daemon is healthy and operating.'
  },
  '--help': {
    meaning: 'Help manual',
    whatItDoes: 'Displays available switches, options, and usage syntax.',
    plainExplanation: 'Shows the official quick-reference guide.'
  },
  '--version': {
    meaning: 'Version number',
    whatItDoes: 'Displays the compiled software version and build date.',
    plainExplanation: 'Checks which version is currently installed.'
  }
};

export interface CommandRecipe {
  title: string;
  command: string;
  description: string;
}

export interface CommandGuide {
  name: string;
  title: string;
  category: string;
  syntax: string;
  summary: string;
  switches: CommandSwitch[];
  recipes: CommandRecipe[];
  proTips: string[];
  guiAlternative?: {
    name: string;
    location: string;
    description: string;
  };
  windowsEquivalent?: string;
  seeAlso: string[];
}

export interface FuzzyMatchResult {
  original: string;
  bestMatch: string | null;
  confidence: 'HIGH' | 'MEDIUM' | 'LOW';
  alternatives: string[];
  explanation?: string;
}

// Damerau-Levenshtein distance calculation (insertions, deletions, substitutions, and adjacent transpositions)
export function damerauLevenshteinDistance(source: string, target: string): number {
  const s = source.toLowerCase();
  const t = target.toLowerCase();
  const m = s.length;
  const n = t.length;
  if (m === 0) return n;
  if (n === 0) return m;

  const d: number[][] = [];
  for (let i = 0; i <= m; i++) {
    d[i] = [i];
  }
  for (let j = 0; j <= n; j++) {
    d[0][j] = j;
  }

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = s[i - 1] === t[j - 1] ? 0 : 1;
      d[i][j] = Math.min(
        d[i - 1][j] + 1,        // deletion
        d[i][j - 1] + 1,        // insertion
        d[i - 1][j - 1] + cost  // substitution
      );
      if (i > 1 && j > 1 && s[i - 1] === t[j - 2] && s[i - 2] === t[j - 1]) {
        d[i][j] = Math.min(d[i][j], d[i - 2][j - 2] + cost); // transposition
      }
    }
  }
  return d[m][n];
}

// Master list of all recognized CLI commands in SecureCurtain
export const ALL_CLI_COMMANDS: string[] = Array.from(new Set([
  ...Object.keys(COMMAND_DOCS),
  'watchdog', 'watchdogctl', 'virtio', 'virtio-net', 'dhclient', 'dhcp',
  'iso', 'qemu', 'btop', 'top', 'tasklist', 'ps', 'taskkill', 'kill',
  'sysinfo', 'lsblk', 'diskmgmt', 'df', 'ncdu', 'dua', 'eza', 'ls',
  'gparted', 'cleanmgr', 'fstrim', 'fio', 'benchmark', 'fsck', 'e2fsck',
  'chkdsk', 'badblocks', 'smartctl', 'hdparm', 'ip', 'ifconfig', 'firewall-cmd',
  'ufw', 'iptables', 'netsh', 'ss', 'netstat', 'ping', 'traceroute', 'tracert',
  'dig', 'nslookup', 'host', 'tcpdump', 'wireshark', 'whois', 'curl', 'geoip',
  'systemctl', 'service', 'services.msc', 'reg', 'regedit', 'kconfig',
  'crontab', 'schtasks', 'cron', 'sysctl', 'timedatectl', 'date', 'ntpdate',
  'powerprofilesctl', 'cpupower', 'powercfg', 'env', 'export', 'set',
  'journalctl', 'dmesg', 'syslog', 'eventvwr', 'lspci', 'lsusb', 'lshw',
  'devmgmt', 'sensors', 'turbostat', 'systemd-analyze', 'reliability', 'uptime',
  'apt', 'winget', 'pacman', 'pkg', 'dism', 'optionalfeatures', 'features',
  'find', 'fd', 'grep', 'rg', 'ripgrep', 'locate', 'updatedb', 'indexer',
  'hud', 'health', 'healthcheck', 'neofetch', 'fastfetch', 'gdb', 'regs',
  'readelf', 'maps', 'pmap', 'objdump', 'disasm', 'xxd', 'hexdump',
  'man', 'tldr', 'clear', 'cls', 'help', 'decommission', 'dod-wipe', 'sanitize-system',
  'cat', 'head', 'tail', 'less', 'more', 'wc', 'sort', 'uniq', 'diff',
  'pwd', 'cd', 'mkdir', 'rm', 'cp', 'mv', 'touch', 'stat', 'file', 'tree',
  'basename', 'dirname', 'realpath', 'sync', 'shred', 'mktemp', 'nl', 'rev',
  'strings', 'chattr', 'lsattr', 'getfacl', 'setfacl', 'sestatus', 'faillock',
  'mtr', 'drill', 'nc', 'netcat', 'socat', 'lscpu', 'lsmem', 'free', 'vmstat',
  'iostat', 'mpstat', 'sar', 'pidstat', 'strace', 'ltrace', 'perf', 'blkid',
  'parted', 'sfdisk', 'mount', 'umount', 'losetup', 'zfs', 'btrfs', 'mdadm',
  'inxi', 'hwinfo', 'modprobe', 'lsmod', 'rmmod', 'swapon', 'swapoff'
]));

// Common Windows <-> Linux cross-platform aliases and frequent user typings
const COMMON_ALIASES: Record<string, string> = {
  'ipconfig': 'ip',
  'ifconfg': 'ifconfig',
  'netstat': 'ss',
  'dir': 'ls',
  'md': 'mkdir',
  'rd': 'rmdir',
  'del': 'rm',
  'erase': 'rm',
  'ren': 'mv',
  'rename': 'mv',
  'type': 'cat',
  'findstr': 'grep',
  'cls': 'clear',
  'reboot': 'systemctl',
  'shutdown': 'decommission',
  'taskmgr': 'btop',
  'perfmon': 'btop',
  'chattr': 'chattr',
  'wipe': 'decommission',
  'format': 'gparted',
  'fdisk': 'gparted',
  'decomm': 'decommission',
  'wathcdog': 'watchdog',
  'virto': 'virtio',
  'diskmgmt': 'lsblk'
};

// Deep argument, switch, and recipe catalog
const DEEP_COMMAND_GUIDES: Record<string, CommandGuide> = {
  ip: {
    name: 'ip',
    title: 'Linux Routing, Devices, Policy Routing and Tunnels (iproute2)',
    category: 'Networking',
    syntax: 'ip [-a | a | addr] [link] [route] [neigh] [-s] [-br]',
    summary: 'Modern Linux network management utility for displaying and manipulating network interfaces, IP addresses, routing tables, and neighbor discovery.',
    switches: [
      {
        flag: '-a (or "a" / "addr")',
        meaning: 'Address / All Interfaces',
        whatItDoes: 'Shows all network interfaces and their assigned IPv4 and IPv6 addresses, subnet prefixes, and broadcast addresses.',
        plainExplanation: 'Use "ip -a" when you need to know what your machine\'s local IP address is or check if your network adapter is active.',
        description: 'Shows all network interfaces and their assigned IP addresses.',
        example: 'ip -a',
        badge: 'RECOMMENDED'
      },
      {
        flag: 'link',
        meaning: 'Data Link Layer (MAC / Layer 2)',
        whatItDoes: 'Displays physical network interface states (UP/DOWN), MTU packet sizes, and hardware MAC addresses without IP info.',
        plainExplanation: 'Use "ip link" to verify if the physical Ethernet cable is plugged in or locate your hardware MAC address.',
        description: 'Displays physical network interface states, MTU, and hardware MAC addresses.',
        example: 'ip link',
        badge: 'POPULAR'
      },
      {
        flag: 'route (or "r")',
        meaning: 'Routing Table / Gateway',
        whatItDoes: 'Lists active IP routing pathways, the default internet gateway IP, and interface metric priorities.',
        plainExplanation: 'Use "ip route" to see which router gateway sends your traffic out to the internet or local subnets.',
        description: 'Lists active IP routing pathways and default internet gateway IP.',
        example: 'ip route',
        badge: 'POPULAR'
      },
      {
        flag: 'neigh (or "n")',
        meaning: 'Neighbor / ARP Table',
        whatItDoes: 'Queries the ARP (Address Resolution Protocol) cache of nearby local machines, showing IP-to-MAC address pairings.',
        plainExplanation: 'Use "ip neigh" to discover other connected computers, printers, and phones on your local Wi-Fi or LAN.',
        description: 'Queries the ARP cache of nearby local devices and their MAC addresses.',
        example: 'ip neigh',
        badge: 'DIAGNOSTIC'
      },
      {
        flag: '-s link',
        meaning: 'Statistics / Packet Health',
        whatItDoes: 'Shows live packet counters, megabytes sent/received, CRC errors, frame collisions, and dropped packets.',
        plainExplanation: 'Use "ip -s link" to diagnose bad cables, network packet loss, or saturated connections.',
        description: 'Shows live packet counters, bytes transferred, errors, and dropped frames.',
        example: 'ip -s link',
        badge: 'DIAGNOSTIC'
      },
      {
        flag: '-br a',
        meaning: 'Brief / Clean One-Liner Table',
        whatItDoes: 'Prints a clean, compact one-line-per-interface summary with interface name, UP/DOWN status, and IP address.',
        plainExplanation: 'Use "ip -br a" for a quick, uncluttered snapshot of your IPs without long multi-line dumps.',
        description: 'Prints a clean, concise one-line-per-interface summary table.',
        example: 'ip -br a',
        badge: 'POPULAR'
      }
    ],
    recipes: [
      { title: 'Check Local IP Address', command: 'ip -a', description: 'Shows all network interfaces and their assigned IP addresses (e.g. eth0, wlan0).' },
      { title: 'Find Default Gateway Router', command: 'ip route show', description: 'Finds your router IP address for gateway connectivity.' },
      { title: 'Compact IP Snapshot', command: 'ip -br a', description: 'One-line clean table showing interface names, UP/DOWN status, and IP addresses.' },
      { title: 'Inspect Hardware MAC Address', command: 'ip link', description: 'Display physical MAC address of primary Ethernet interface.' }
    ],
    proTips: [
      'In modern Linux distributions, "ip -a" (or "ip a") replaces the legacy "ifconfig" command.',
      'To filter just IPv4 addresses without IPv6 clutter, you can run "ip -4 a".',
      'Press [Tab] on any switch to auto-complete, or click the switch pills below to run instantly.'
    ],
    guiAlternative: {
      name: 'Cockpit Network Subsystem HUD',
      location: 'Mission Control Cockpit -> Network Subsystem',
      description: 'Visual interface cards with live throughput graphs, MAC viewer, and packet telemetry.'
    },
    windowsEquivalent: 'ipconfig /all / Get-NetIPAddress',
    seeAlso: ['ifconfig', 'ss', 'ping', 'traceroute', 'curl']
  },

  watchdog: {
    name: 'watchdog',
    title: 'Ring 0 Hardware Watchdog Sentinel & Rollback Supervisor',
    category: 'Microkernel & Resilience',
    syntax: 'watchdog [--status | --ping | --arm <ms> | --trip-test | --history]',
    summary: 'Inspects and controls the Ring 0 hardware watchdog timer, heartbeat monitoring, and automated dual-slot A/B crash recovery.',
    switches: [
      {
        flag: '--status',
        meaning: 'Current Sentinel Health',
        whatItDoes: 'Queries the watchdog heartbeat deadline countdown, MTTR failure metrics, and active timer state.',
        plainExplanation: 'Checks whether the hardware watchdog is alive and counting down normally.',
        description: 'Query watchdog heartbeat deadline, MTTR metrics, and timer tick countdown.',
        example: 'watchdog --status',
        badge: 'RECOMMENDED'
      },
      {
        flag: '--ping',
        meaning: 'Manual Heartbeat Kick',
        whatItDoes: 'Transmits a Ring 0 keepalive tick to reset the expiration timer back to its maximum deadline window.',
        plainExplanation: 'Proves the system is alive by resetting the watchdog countdown so it does not trigger a reboot.',
        description: 'Transmit Ring 0 manual heartbeat kick to reset the watchdog expiration timer.',
        example: 'watchdog --ping',
        badge: 'POPULAR'
      },
      {
        flag: '--history',
        meaning: 'Heartbeat Log & Jitter History',
        whatItDoes: 'Displays the last 50 heartbeat tick intervals, microsecond timing variances, and recovery events.',
        plainExplanation: 'Shows if the system was sluggish or if any background tasks delayed the watchdog ticks.',
        description: 'Display recent 50 heartbeat intervals, jitter variance, and recovery events.',
        example: 'watchdog --history',
        badge: 'DIAGNOSTIC'
      },
      {
        flag: '--arm <ms>',
        meaning: 'Program Expiration Window',
        whatItDoes: 'Programs a custom watchdog expiration window in milliseconds (e.g. 5000 = 5 seconds).',
        plainExplanation: 'Changes how many milliseconds the watchdog waits before declaring a kernel freeze and rolling back.',
        description: 'Program custom watchdog expiration window in milliseconds (e.g. 5000).',
        example: 'watchdog --arm 5000',
        badge: 'ADVANCED'
      },
      {
        flag: '--trip-test',
        meaning: 'Synthetic Hang Test',
        whatItDoes: 'Simulates a safe synthetic kernel hang in a sandbox to verify automated rollback triggering.',
        plainExplanation: 'Safely tests that the self-healing rollback mechanism works without causing actual data loss.',
        description: 'Simulate synthetic kernel freeze to verify automated rollback triggering.',
        example: 'watchdog --trip-test',
        badge: 'SAFETY'
      }
    ],
    recipes: [
      { title: 'Full Health Check', command: 'watchdog --status && watchdog --history', description: 'Check current deadline countdown and verify no missed ticks in history.' },
      { title: 'Heartbeat Verification', command: 'watchdog --ping', description: 'Manually send a keepalive tick to Ring 0 supervisor.' },
      { title: 'Automated Recovery Audit', command: 'watchdog --trip-test', description: 'Safe sandbox crash test simulating MTTR fallback triggers.' }
    ],
    proTips: [
      'The hardware watchdog runs at Ring 0, independently of userland processes.',
      'If heartbeat ticks miss 3 consecutive deadlines (3000ms), the kernel initiates fail-safe A/B slot rollback.',
      'Combine with "sysinfo" to observe watchdog supervisor build flags.'
    ],
    guiAlternative: {
      name: 'Mission Control Overview & Watchdog App',
      location: 'Mission Control Cockpit -> Mission HUD or Launchpad -> Watchdog Recovery',
      description: 'Provides live visual heartbeat graphs, MTTR dials, and manual trip switches.'
    },
    windowsEquivalent: 'ASR (Automated System Recovery) / BugCheck dump engine',
    seeAlso: ['watchdogctl', 'virtio', 'sysinfo', 'sys-update']
  },

  virtio: {
    name: 'virtio',
    title: 'VirtIO Paravirtualized High-Throughput Network Engine',
    category: 'Hardware & Networking',
    syntax: 'virtio [--queues | --stats | --status | --rx-ring | --tx-ring]',
    summary: 'Manages VirtIO paravirtualized network descriptor queues, zero-copy packet rings, and TAP hardware offloads.',
    switches: [
      {
        flag: '--queues',
        meaning: 'Multiqueue Descriptor Allocation',
        whatItDoes: 'Enumerates multiqueue descriptor allocation and vCPU core affinity mappings.',
        plainExplanation: 'Shows how network packets are distributed across different processor cores to prevent bottlenecks.',
        description: 'Enumerate multiqueue descriptor allocation and vCPU ring mapping.',
        example: 'virtio --queues',
        badge: 'POPULAR'
      },
      {
        flag: '--stats',
        meaning: 'Throughput & Packet Dropping',
        whatItDoes: 'Inspects real-time RX/TX ring buffer metrics, packet drops, DMA buffer levels, and throughput.',
        plainExplanation: 'Checks if your virtual network adapter is dropping packets or running at high bandwidth.',
        description: 'Inspect real-time RX/TX ring buffer metrics, packet drops, and throughput.',
        example: 'virtio --stats',
        badge: 'DIAGNOSTIC'
      },
      {
        flag: '--status',
        meaning: 'Link State & Speed Negotiation',
        whatItDoes: 'Displays physical link state (UP/DOWN), negotiated line speed (10Gbps/40Gbps), and MTU.',
        plainExplanation: 'Confirms whether the network connection is established and at what speed.',
        description: 'Display link state, negotiation speed (10Gbps/40Gbps), and MTU.',
        example: 'virtio --status',
        badge: 'RECOMMENDED'
      },
      {
        flag: '--rx-ring',
        meaning: 'Receive Circular Ring Buffer',
        whatItDoes: 'Inspects zero-copy receive circular ring buffer occupancy and pending frame descriptors.',
        plainExplanation: 'Shows if incoming network packets are being processed fast enough by the kernel.',
        description: 'Inspect RX zero-copy circular ring buffer occupancy.',
        example: 'virtio --rx-ring',
        badge: 'ADVANCED'
      },
      {
        flag: '--tx-ring',
        meaning: 'Transmit Queue Ring Buffer',
        whatItDoes: 'Inspects transmit queue buffer occupancy, DMA completions, and hardware backpressure.',
        plainExplanation: 'Shows if outgoing traffic is flowing smoothly without buffer overflows.',
        description: 'Inspect TX transmit queue buffer occupancy and DMA completions.',
        example: 'virtio --tx-ring',
        badge: 'ADVANCED'
      }
    ],
    recipes: [
      { title: 'Queue & Buffer Diagnostics', command: 'virtio --queues && virtio --stats', description: 'Inspect full descriptor queue health and DMA ring packet rates.' },
      { title: 'DHCP Lease Handshake', command: 'virtio && dhclient', description: 'Verify physical link status then negotiate fresh IPv4 address lease.' }
    ],
    proTips: [
      'VirtIO bypasses guest kernel packet copy overhead with direct shared-memory DMA rings.',
      'Supports Checksum Offload, TSO (TCP Segmentation Offload), and UFO (UDP Fragmentation Offload).'
    ],
    guiAlternative: {
      name: 'Mission Control Cockpit Network Subsystem',
      location: 'Mission Control Cockpit -> Network Subsystem',
      description: 'Real-time bandwidth meters, link status toggles, and TAP adapter statistics.'
    },
    seeAlso: ['virtio-net', 'dhclient', 'ip', 'ifconfig']
  },

  btop: {
    name: 'btop',
    title: 'Interactive Process & Thread Performance Monitor',
    category: 'Performance & Processes',
    syntax: 'btop [--sort-cpu | --sort-mem | -p <pid> | --tree | --compact]',
    summary: 'ASCII-visual process thread, CPU core frequency, memory utilization, and I/O monitor.',
    switches: [
      {
        flag: '--sort-cpu',
        meaning: 'Sort by CPU Percentage',
        whatItDoes: 'Sorts the active process list in descending order by CPU core percentage.',
        plainExplanation: 'Quickly shows which application is consuming the most processing power and making fans spin.',
        description: 'Sort process list by descending CPU percentage.',
        example: 'btop --sort-cpu',
        badge: 'POPULAR'
      },
      {
        flag: '--sort-mem',
        meaning: 'Sort by Memory / RAM',
        whatItDoes: 'Orders the process list by resident memory consumption (RSS) from highest to lowest.',
        plainExplanation: 'Shows which program is using up the most RAM or causing memory leaks.',
        description: 'Sort process list by resident memory consumption (RSS).',
        example: 'btop --sort-mem',
        badge: 'RECOMMENDED'
      },
      {
        flag: '-p <pid>',
        meaning: 'Process ID Filter',
        whatItDoes: 'Filters the monitoring display strictly to one specific Process ID.',
        plainExplanation: 'Allows you to watch one specific app without all other system processes cluttering the view.',
        description: 'Filter display to single specific Process ID.',
        example: 'btop -p 1',
        badge: 'DIAGNOSTIC'
      },
      {
        flag: '--tree',
        meaning: 'Hierarchical Process Tree',
        whatItDoes: 'Displays running processes organized in parent-child relationship branches.',
        plainExplanation: 'Helps you understand which program launched what sub-tasks.',
        description: 'Display processes in hierarchical parent-child tree view.',
        example: 'btop --tree',
        badge: 'ADVANCED'
      }
    ],
    recipes: [
      { title: 'Find Resource Hogs', command: 'btop --sort-cpu', description: 'Immediately spot which process is consuming core threads.' },
      { title: 'Memory Footprint Audit', command: 'btop --sort-mem', description: 'Order all active daemons by RAM allocation.' }
    ],
    proTips: [
      'You can terminate runaway processes directly from CLI using "kill <pid>" or "taskkill /PID <pid>".',
      'Use "top" or "tasklist" for flat tabular process listings.'
    ],
    guiAlternative: {
      name: 'Desktop Task Manager / Performance App',
      location: 'Desktop Launchpad -> Task Manager',
      description: 'Interactive graphical process list with live CPU/RAM sparkline charts and kill buttons.'
    },
    windowsEquivalent: 'Taskmgr.exe / Get-Process',
    seeAlso: ['top', 'ps', 'tasklist', 'kill', 'taskkill']
  },

  ls: {
    name: 'ls',
    title: 'Directory Contents & File Attribute Lister',
    category: 'File Operations',
    syntax: 'ls [-l] [-a] [-h] [-t] [-R] [path]',
    summary: 'Lists files, folders, inode permissions, owner groups, and modification dates.',
    switches: [
      {
        flag: '-l',
        meaning: 'Long Listing Format',
        whatItDoes: 'Shows full file permissions (rwx), hard links, owner username, group, byte size, and timestamp.',
        plainExplanation: 'Shows full details about files instead of just printing their names.',
        description: 'Long listing format showing permissions, hard links, owner, size, and date.',
        example: 'ls -l',
        badge: 'RECOMMENDED'
      },
      {
        flag: '-a',
        meaning: 'All Files (Include Hidden)',
        whatItDoes: 'Reveals hidden files and dotfiles starting with "." (e.g. .bashrc, .config, .git).',
        plainExplanation: 'Shows hidden configuration files that are normally invisible in folder listings.',
        description: 'Include hidden entries starting with "." (e.g. .bashrc, .config).',
        example: 'ls -a',
        badge: 'POPULAR'
      },
      {
        flag: '-la',
        meaning: 'Long Format + All Hidden Files',
        whatItDoes: 'Combines full metadata listing with hidden dotfiles included.',
        plainExplanation: 'The classic command to see every file in a directory and who owns them.',
        description: 'Combined long listing with all hidden files included.',
        example: 'ls -la',
        badge: 'POPULAR'
      },
      {
        flag: '-lh',
        meaning: 'Long Format + Human Sizes',
        whatItDoes: 'Formats file sizes into human units like KB, MB, and GB instead of raw byte counts.',
        plainExplanation: 'Shows large files with easy-to-read numbers like 14.5M instead of 15204352.',
        description: 'Print file sizes in human-readable units (K, M, G).',
        example: 'ls -lh',
        badge: 'RECOMMENDED'
      },
      {
        flag: '-t',
        meaning: 'Sort by Time',
        whatItDoes: 'Sorts entries by their last modification timestamp with newest files at the top.',
        plainExplanation: 'Helps you immediately spot files that were recently created or changed.',
        description: 'Sort files by modification timestamp, newest first.',
        example: 'ls -lt',
        badge: 'DIAGNOSTIC'
      },
      {
        flag: '-R',
        meaning: 'Recursive Subdirectory Listing',
        whatItDoes: 'Recursively explores every subfolder and lists every file nested inside.',
        plainExplanation: 'Shows everything contained inside this directory and all its subfolders.',
        description: 'Recursively list subdirectories and contents.',
        example: 'ls -R /sys',
        badge: 'ADVANCED'
      }
    ],
    recipes: [
      { title: 'Full Directory Audit', command: 'ls -lah', description: 'View all files, hidden dotfiles, permissions, and human sizes.' },
      { title: 'Recently Modified Files', command: 'ls -lt /tmp', description: 'Find the newest files created in temporary cache.' }
    ],
    proTips: [
      'Try "eza" for colorized modern output with icons and git status indicators.',
      'Try "tree -L 2" to see an indented visual hierarchy of folder branches.'
    ],
    guiAlternative: {
      name: 'File Explorer App',
      location: 'Desktop Launchpad -> File Explorer',
      description: 'Full visual directory browser with breadcrumbs, previews, and drag-and-drop.'
    },
    windowsEquivalent: 'dir / Get-ChildItem',
    seeAlso: ['eza', 'tree', 'stat', 'cd', 'find']
  },

  lsblk: {
    name: 'lsblk',
    title: 'Block Device & Storage Partition Topology',
    category: 'Storage & Disks',
    syntax: 'lsblk [-f] [-m] [-a] [device]',
    summary: 'Displays storage block devices, NVMe controllers, SATA disks, and mounted partitions.',
    switches: [
      {
        flag: '-f',
        meaning: 'Filesystem Information',
        whatItDoes: 'Outputs filesystem formats (ext4, btrfs, vfat, ntfs), volume labels, and UUID identifiers.',
        plainExplanation: 'Use "lsblk -f" to see how partitions are formatted and where they are mounted.',
        description: 'Output filesystem information (ext4, btrfs, vfat, ntfs, UUIDs).',
        example: 'lsblk -f',
        badge: 'RECOMMENDED'
      },
      {
        flag: '-m',
        meaning: 'Permissions & Owner Modes',
        whatItDoes: 'Outputs permissions, read/write/read-only mode flags, and device owner IDs.',
        plainExplanation: 'Checks if you have write permission to a storage drive or if it is mounted read-only.',
        description: 'Output permissions, UID owner, and block device mode flags.',
        example: 'lsblk -m',
        badge: 'DIAGNOSTIC'
      },
      {
        flag: '-a',
        meaning: 'All Devices',
        whatItDoes: 'Lists all devices including empty loopback mounts and RAM ramdisk devices.',
        plainExplanation: 'Shows raw virtual and empty device nodes that are usually hidden.',
        description: 'List all devices including empty loop and RAM ramdisk devices.',
        example: 'lsblk -a',
        badge: 'ADVANCED'
      }
    ],
    recipes: [
      { title: 'Complete Partition Topology', command: 'lsblk -f', description: 'Inspect all partition mount points, labels, and filesystem formats.' },
      { title: 'Disk Usage Check', command: 'df -h && lsblk', description: 'View volume capacities alongside mount targets.' }
    ],
    proTips: [
      'Use "gparted" or "diskmgmt" to review GPT partition alignment and sector boundaries.',
      'Run "fstrim -v /" to trigger flash block discard on all SSD/NVMe partitions.'
    ],
    guiAlternative: {
      name: 'Mission Control Storage Subsystem',
      location: 'Mission Control Cockpit -> Storage Subsystem',
      description: 'Visual drive capacity bars, SMART health gauges, and TRIM triggers.'
    },
    windowsEquivalent: 'diskpart / Get-Disk / Get-Partition',
    seeAlso: ['gparted', 'df', 'ncdu', 'fstrim', 'smartctl']
  },

  gparted: {
    name: 'gparted',
    title: 'Partition Table Alignment & Sector Layout Inspector',
    category: 'Storage & Disks',
    syntax: 'gparted [--scan | --verify-alignment | <device_path>]',
    summary: 'Inspects partition table health, GPT backup headers, sector alignment (4KB/1MB), and partition bounds.',
    switches: [
      {
        flag: '--scan',
        meaning: 'Storage Bus Rescan',
        whatItDoes: 'Forces a fresh hardware probe across PCIe NVMe, SATA, and USB buses for attached storage disks.',
        plainExplanation: 'Use this after plugging in a new drive to detect it without rebooting.',
        description: 'Force re-scan of PCIe NVMe, SATA, and USB buses for storage devices.',
        example: 'gparted --scan',
        badge: 'POPULAR'
      },
      {
        flag: '--verify-alignment',
        meaning: '4KB Flash Sector Alignment',
        whatItDoes: 'Verifies that logical partition start sectors align evenly to 4096-byte flash boundaries.',
        plainExplanation: 'Guarantees your SSD gets maximum speed and does not suffer write amplification.',
        description: 'Check that all logical partitions align to 4096-byte flash boundaries.',
        example: 'gparted --verify-alignment',
        badge: 'RECOMMENDED'
      },
      {
        flag: '<device>',
        meaning: 'Target Disk Device',
        whatItDoes: 'Inspects a specific disk target partition table and sector bounds.',
        plainExplanation: 'Zooms into one physical drive (like /dev/nvme0n1) to inspect its layout.',
        description: 'Inspect specific disk target (e.g. /dev/nvme0n1 or /dev/sda).',
        example: 'gparted /dev/nvme0n1',
        badge: 'DIAGNOSTIC'
      }
    ],
    recipes: [
      { title: 'Storage Sector Audit', command: 'gparted --scan && gparted --verify-alignment', description: 'Ensure storage partitions are aligned for maximum SSD IOPS.' }
    ],
    proTips: [
      'Unaligned partitions can cause a 30-50% performance penalty on modern NVMe SSDs.',
      'Combine with "fio" to benchmark sequential read/write IOPS.'
    ],
    guiAlternative: {
      name: 'Storage Subsystem Disk Manager',
      location: 'Mission Control Cockpit -> Storage Subsystem',
      description: 'Provides partition layout cards, SMART status, and sector layout graphics.'
    },
    seeAlso: ['lsblk', 'df', 'smartctl', 'fio']
  },

  curl: {
    name: 'curl',
    title: 'HTTP/HTTPS/FTP Network Data Transfer & API Client',
    category: 'Networking',
    syntax: 'curl [-I] [-s] [-X <METHOD>] [-H <HEADER>] [-d <DATA>] <url>',
    summary: 'Sends HTTP requests to web endpoints, inspects response headers, and queries REST APIs.',
    switches: [
      {
        flag: '-I',
        meaning: 'Fetch Headers Only (HEAD request)',
        whatItDoes: 'Sends a lightweight HEAD request and prints HTTP status code and response headers without the body.',
        plainExplanation: 'Super fast way to check if a website is up and view its SSL certificates and server headers.',
        description: 'Fetch HTTP response headers only (HEAD request). Fast banner inspection.',
        example: 'curl -I https://api.kernel.org',
        badge: 'POPULAR'
      },
      {
        flag: '-s',
        meaning: 'Silent Mode',
        whatItDoes: 'Suppresses download meters, progress bars, and operational messages.',
        plainExplanation: 'Prevents clutter in your terminal and is ideal when sending output into another tool.',
        description: 'Silent mode. Suppresses progress bar and error messages.',
        example: 'curl -s https://api.kernel.org',
        badge: 'RECOMMENDED'
      },
      {
        flag: '-X <METHOD>',
        meaning: 'Custom HTTP Verb',
        whatItDoes: 'Specifies the HTTP request method such as POST, PUT, DELETE, or PATCH.',
        plainExplanation: 'Use this when testing REST APIs that require actions other than basic GET requests.',
        description: 'Specify custom HTTP request verb (POST, PUT, DELETE, PATCH).',
        example: 'curl -X POST https://api.kernel.org',
        badge: 'ADVANCED'
      },
      {
        flag: '-H <HEADER>',
        meaning: 'Custom HTTP Request Header',
        whatItDoes: 'Appends a custom header such as Authorization bearer tokens or Content-Type definitions.',
        plainExplanation: 'Use this to pass API keys or tell the server you want JSON responses.',
        description: 'Append custom HTTP header (e.g. authorization token).',
        example: 'curl -H "Accept: application/json" https://api.kernel.org',
        badge: 'ADVANCED'
      },
      {
        flag: '-d <DATA>',
        meaning: 'HTTP POST Body Payload',
        whatItDoes: 'Sends raw data or JSON body content in an HTTP POST request to the remote endpoint.',
        plainExplanation: 'Submits form data or API JSON packets to a web server.',
        description: 'Send POST request body payload (e.g. JSON string).',
        example: 'curl -d \'{"ping":"pong"}\' https://api.kernel.org',
        badge: 'ADVANCED'
      },
      {
        flag: '-o <FILE>',
        meaning: 'Output to Local File',
        whatItDoes: 'Writes the remote HTTP response directly to a designated file on disk instead of terminal stdout.',
        plainExplanation: 'Downloads a file from the internet directly to your disk.',
        description: 'Write remote HTTP response body directly to a local file.',
        example: 'curl -o /tmp/manifest.json https://api.kernel.org',
        badge: 'OUTPUT'
      }
    ],
    recipes: [
      { title: 'Check HTTP Status & Headers', command: 'curl -I https://api.kernel.org', description: 'Inspect server headers, HTTP status code (200/404), and SSL certificate.' },
      { title: 'Quiet JSON API Fetch', command: 'curl -s https://api.kernel.org/health', description: 'Retrieve JSON body cleanly without cluttering terminal.' }
    ],
    proTips: [
      'Use "-w \"%{http_code}\\n\"" to print just the numeric status code.',
      'Pipe into "grep" to extract specific header values, e.g. "curl -I https://google.com | grep -i server".'
    ],
    guiAlternative: {
      name: 'Network Engine / Stealth Triage',
      location: 'Desktop Launchpad -> Stealth Network Triage',
      description: 'GUI packet capture, socket viewer, and endpoint ping monitor.'
    },
    windowsEquivalent: 'Invoke-WebRequest / Invoke-RestMethod',
    seeAlso: ['wget', 'ping', 'ss', 'dig']
  },

  ping: {
    name: 'ping',
    title: 'ICMP Echo Latency & Network Reachability Probe',
    category: 'Networking',
    syntax: 'ping [-c <count>] [-i <interval>] [-W <timeout>] <host>',
    summary: 'Sends ICMP ECHO_REQUEST packets to measure round-trip network latency and packet loss.',
    switches: [
      {
        flag: '-c <count>',
        meaning: 'Packet Count Limit',
        whatItDoes: 'Limits transmission to a set number of echo request packets then cleanly stops and prints stats.',
        plainExplanation: 'Prevents ping from running forever (e.g. "ping -c 4" sends 4 pings and gives you average latency).',
        description: 'Stop after transmitting specified number of echo packets (e.g. 4).',
        example: 'ping -c 4 8.8.8.8',
        badge: 'RECOMMENDED'
      },
      {
        flag: '-i <sec>',
        meaning: 'Interval Between Packets',
        whatItDoes: 'Sets the wait time in seconds between each successive ping packet transmission.',
        plainExplanation: 'Use "ping -i 0.2" for fast latency probing or "ping -i 5" for low-overhead background testing.',
        description: 'Wait specified interval in seconds between sending each packet.',
        example: 'ping -c 5 -i 0.2 1.1.1.1',
        badge: 'POPULAR'
      },
      {
        flag: '-W <sec>',
        meaning: 'Response Timeout Window',
        whatItDoes: 'Maximum time in seconds to wait for each individual reply before declaring it a dropped packet.',
        plainExplanation: 'Speeds up tests when a destination host is completely offline by not waiting too long.',
        description: 'Time to wait for a response in seconds before timeout.',
        example: 'ping -c 3 -W 1 8.8.8.8',
        badge: 'ADVANCED'
      },
      {
        flag: '-q',
        meaning: 'Quiet Mode',
        whatItDoes: 'Suppresses individual packet response lines, outputting only the final statistical latency summary.',
        plainExplanation: 'Great for scripts where you only want the average round-trip ping time.',
        description: 'Quiet mode. Only outputs summary lines at startup and completion.',
        example: 'ping -c 5 -q 8.8.8.8',
        badge: 'OUTPUT'
      }
    ],
    recipes: [
      { title: 'Standard Connectivity Test', command: 'ping -c 4 8.8.8.8', description: 'Send 4 packets to Google DNS to verify WAN gateway routing.' },
      { title: 'Local Loopback Test', command: 'ping -c 2 127.0.0.1', description: 'Confirm local TCP/IP networking stack is functioning properly.' }
    ],
    proTips: [
      'In Linux, ping continues infinitely unless "-c" is specified or Ctrl+C is pressed.',
      'Try "traceroute" or "mtr" to trace router latency hops along the path.'
    ],
    guiAlternative: {
      name: 'Cockpit Network Subsystem Ping Tool',
      location: 'Mission Control Cockpit -> Network Subsystem',
      description: 'Interactive latency meter and ping response chart.'
    },
    windowsEquivalent: 'ping.exe -n 4 <host>',
    seeAlso: ['traceroute', 'mtr', 'curl', 'ss']
  },

  sysinfo: {
    name: 'sysinfo',
    title: 'System Architecture, Kernel Build & Health Telemetry',
    category: 'System Information',
    syntax: 'sysinfo [--all | --kernel | --hardware | --security]',
    summary: 'Displays microkernel build release, compiler toolchain, CPU instruction features, and memory pool stats.',
    switches: [
      {
        flag: '--kernel',
        meaning: 'Microkernel Specs & Privileges',
        whatItDoes: 'Outputs the microkernel build git commit, GCC/Clang compiler version, and Ring 0 privilege modes.',
        plainExplanation: 'Checks the exact operating system release version and security build flags.',
        description: 'Show microkernel build commit, compiler version, and ring privileges.',
        example: 'sysinfo --kernel',
        badge: 'POPULAR'
      },
      {
        flag: '--hardware',
        meaning: 'Hardware CPU & Memory Inventory',
        whatItDoes: 'Enumerates processor model, core count, frequency clocking, cache hierarchy, and physical RAM pools.',
        plainExplanation: 'Shows what hardware processor and memory your system is currently running on.',
        description: 'Enumerate CPU model, core frequency, cache hierarchy, and RAM pools.',
        example: 'sysinfo --hardware',
        badge: 'RECOMMENDED'
      },
      {
        flag: '--security',
        meaning: 'Active CPU Security Mitigations',
        whatItDoes: 'Audits hardware mitigation flags including SMEP, SMAP, KASLR, and Secure Boot enforcement.',
        plainExplanation: 'Verifies that modern hardware security protections against memory exploits are active.',
        description: 'Audit active security features (SMEP, SMAP, KASLR, Secure Boot).',
        example: 'sysinfo --security',
        badge: 'DIAGNOSTIC'
      }
    ],
    recipes: [
      { title: 'Quick Diagnostic', command: 'sysinfo && uptime', description: 'Check operating system build and total uptime.' },
      { title: 'Visual ASCII Artwork', command: 'neofetch', description: 'Display colorized OS logo with quick hardware stats.' }
    ],
    proTips: [
      'For quick visual specs with system logo, use "neofetch" or "fastfetch".',
      'For detailed CPU features and topology, run "lscpu".'
    ],
    guiAlternative: {
      name: 'System Information App',
      location: 'Desktop Launchpad -> System Info',
      description: 'Comprehensive hardware inventory, thermal telemetry, and OS build status.'
    },
    seeAlso: ['neofetch', 'uptime', 'lscpu', 'free', 'sensors']
  },

  decommission: {
    name: 'decommission',
    title: 'DoD 5220.22-M 7-Pass Drive Sanitizer & TPM Clear Suite',
    category: 'Decommission & Sanitization',
    syntax: 'decommission [--dry-run | --passes <count> | --isolate-usb | --status]',
    summary: 'Performs irreversible hardware sanitization, DoD 7-pass binary overwrite, TPM 2.0 platform key clear, and ACPI S5 power-off.',
    switches: [
      {
        flag: '--status',
        meaning: 'Sanitization Readiness Audit',
        whatItDoes: 'Inspects sanitization policy readiness and enumerates detected internal storage and connected external drives.',
        plainExplanation: 'Safe way to review what storage drives would be erased before starting an irreversible decommission.',
        description: 'Inspect sanitization readiness and detected internal/external storage drives.',
        example: 'decommission --status',
        badge: 'POPULAR'
      },
      {
        flag: '--dry-run',
        meaning: 'Simulation Mode (Safe)',
        whatItDoes: 'Simulates the entire wipe and rollback sequence in software memory without touching any physical drive sectors.',
        plainExplanation: 'Safe test to see how the sanitization process runs without destroying any real data.',
        description: 'Simulate the decommissioning sequence without altering any drive sectors.',
        example: 'decommission --dry-run',
        badge: 'SAFETY'
      },
      {
        flag: '--isolate-usb',
        meaning: 'Preserve External USB Drives',
        whatItDoes: 'Locks external USB and removable storage into read-only quarantine, sparing them from internal sanitization.',
        plainExplanation: 'Protects your external backup thumb drives from being accidentally formatted.',
        description: 'Enforce external drive allowance to preserve detached USB storage.',
        example: 'decommission --isolate-usb',
        badge: 'RECOMMENDED'
      },
      {
        flag: '--passes 7',
        meaning: 'DoD 5220.22-M 7-Pass Overwrite',
        whatItDoes: 'Executes standard defense-grade 7-pass algorithm with alternating zeros, ones, pseudo-random noise, and read verification.',
        plainExplanation: 'Guarantees that even advanced forensic hardware cannot recover deleted files from the drive.',
        description: 'Specify DoD 5220.22-M 7-pass algorithm (zeros, ones, PRNG, and verification).',
        example: 'decommission --passes 7',
        badge: 'ADVANCED'
      }
    ],
    recipes: [
      { title: 'Inspect Sanitization Policy', command: 'decommission --status', description: 'Review target internal storage drives and external USB allowances.' },
      { title: 'Interactive Decommission GUI', command: 'decommission', description: 'Opens the Cockpit Decommission tab with 3-step PIN verification.' }
    ],
    proTips: [
      'CRITICAL: Decommissioning is final and permanent. It zeroes all partition tables and destroys TPM keys.',
      'Always use the External Drive Allowance feature to preserve backup USB drives before authorizing.'
    ],
    guiAlternative: {
      name: 'Mission Control Decommission Tab',
      location: 'Mission Control Cockpit -> Decommission Tab',
      description: '3-Step verification dialogs, live 7-pass telemetry stream, and solid black screen execution.'
    },
    seeAlso: ['dod-wipe', 'sanitize-system', 'shred', 'wipefs']
  },

  find: {
    name: 'find',
    title: 'Hierarchical Virtual File System Search Engine',
    category: 'File Operations',
    syntax: 'find <path> [-name <pattern>] [-type <f|d>] [-size <+/-size>] [-exec <cmd> {} \\;]',
    summary: 'Searches directory trees recursively matching file names, extensions, types, sizes, or timestamps.',
    switches: [
      {
        flag: '-name <pattern>',
        meaning: 'Filename Glob Pattern',
        whatItDoes: 'Searches for files and folders whose names match the glob expression (e.g. "*.log" or "*config*").',
        plainExplanation: 'Finds files by their name or file extension anywhere inside a folder.',
        description: 'Search for files matching glob pattern (e.g. "*.log" or "*kernel*").',
        example: 'find /sys -name "*.c"',
        badge: 'POPULAR'
      },
      {
        flag: '-iname <pattern>',
        meaning: 'Case-Insensitive Name Search',
        whatItDoes: 'Matches filenames ignoring uppercase and lowercase distinctions (e.g. matches Report.pdf and report.PDF).',
        plainExplanation: 'Use this when you aren\'t sure if the file was saved in capital letters or lowercase.',
        description: 'Case-insensitive name search pattern.',
        example: 'find /home -iname "*.pdf"',
        badge: 'RECOMMENDED'
      },
      {
        flag: '-type f',
        meaning: 'Regular Files Only',
        whatItDoes: 'Restricts the search results strictly to real regular files, excluding folder directories and symlinks.',
        plainExplanation: 'Prevents folders from cluttering up your list of file search results.',
        description: 'Filter search results strictly to regular files.',
        example: 'find /tmp -type f',
        badge: 'POPULAR'
      },
      {
        flag: '-type d',
        meaning: 'Directories Only',
        whatItDoes: 'Filters the search results strictly to folder directories.',
        plainExplanation: 'Use this when you are looking for a specific folder instead of individual files.',
        description: 'Filter search results strictly to directories.',
        example: 'find /etc -type d',
        badge: 'POPULAR'
      },
      {
        flag: '-mtime -7',
        meaning: 'Modified in Last 7 Days',
        whatItDoes: 'Filters strictly to files that were created or modified within the past 7 days.',
        plainExplanation: 'Great for finding recently worked-on files or recent log updates.',
        description: 'Files modified in the last 7 days.',
        example: 'find /var/log -mtime -7',
        badge: 'DIAGNOSTIC'
      }
    ],
    recipes: [
      { title: 'Find Configuration Files', command: 'find /etc -name "*.conf"', description: 'List all system configuration files.' },
      { title: 'Find Large Files (>100MB)', command: 'find / -size +100M', description: 'Identify storage hogs consuming partition space.' }
    ],
    proTips: [
      'Use modern "fd" for faster, colorized syntax without having to specify "-name".',
      'Combine with "grep" or "xargs" to search contents of discovered files.'
    ],
    guiAlternative: {
      name: 'File Explorer Search Bar',
      location: 'Desktop Launchpad -> File Explorer -> Search',
      description: 'Instant multi-threaded indexed search across all volumes.'
    },
    seeAlso: ['fd', 'grep', 'locate', 'which']
  },

  grep: {
    name: 'grep',
    title: 'Regular Expression & Substring Text Searcher',
    category: 'Text Processing',
    syntax: 'grep [-i] [-r] [-n] [-v] [-E] <pattern> [files...]',
    summary: 'Searches input text or files for lines matching regular expressions and prints results.',
    switches: [
      {
        flag: '-i',
        meaning: 'Ignore Case',
        whatItDoes: 'Ignores case distinctions in both the search pattern and the input files (matches both "Error" and "error").',
        plainExplanation: 'Finds matching words whether they are capitalized or lowercase.',
        description: 'Ignore case distinctions in both pattern and input data.',
        example: 'grep -i "error" /var/log/syslog',
        badge: 'POPULAR'
      },
      {
        flag: '-r',
        meaning: 'Recursive Directory Search',
        whatItDoes: 'Searches through every file inside the target directory and all its subfolders.',
        plainExplanation: 'Scans an entire project or folder tree for a word or phrase.',
        description: 'Read all files under each directory recursively.',
        example: 'grep -r "watchdog" /sys',
        badge: 'RECOMMENDED'
      },
      {
        flag: '-n',
        meaning: 'Show Line Numbers',
        whatItDoes: 'Prefixes each matching line of output with its 1-based line number in the source file.',
        plainExplanation: 'Tells you the exact line number in the file where the match was found.',
        description: 'Prefix each line of output with its 1-based line number.',
        example: 'grep -n "main" /sys/kernel/kmain.c',
        badge: 'POPULAR'
      },
      {
        flag: '-v',
        meaning: 'Invert Match',
        whatItDoes: 'Selects only lines that do NOT match the given pattern, filtering out unwanted lines.',
        plainExplanation: 'Useful to filter out comments or blank lines (e.g. "grep -v \'#\' file.conf").',
        description: 'Invert match: select only lines NOT matching the pattern.',
        example: 'grep -v "^#" /etc/hosts',
        badge: 'DIAGNOSTIC'
      },
      {
        flag: '-c',
        meaning: 'Count Matches Only',
        whatItDoes: 'Suppresses normal line printing and prints only the total count of matching lines.',
        plainExplanation: 'Quickly tells you how many times a word or error occurred without filling your screen.',
        description: 'Suppress normal output; print count of matching lines instead.',
        example: 'grep -c "FAIL" /var/log/boot.log',
        badge: 'OUTPUT'
      }
    ],
    recipes: [
      { title: 'Filter Errors from Logs', command: 'dmesg | grep -i "error\\|fail\\|warn"', description: 'Isolate hardware warnings and boot anomalies.' },
      { title: 'Find Active Network Sockets', command: 'ss -tulpn | grep 3000', description: 'Check if port 3000 is listening.' }
    ],
    proTips: [
      'Use modern "rg" (ripgrep) for 10x faster recursive searches across source code trees.',
      'Pipe command outputs into grep, like "ps | grep btop" to filter process rows.'
    ],
    seeAlso: ['rg', 'find', 'awk', 'sed', 'strings']
  }
};

export class CliAssistantService {
  /**
   * Find closest command when a user mistypes something
   */
  static findClosestCommand(input: string): FuzzyMatchResult {
    const raw = input.trim();
    if (!raw) {
      return { original: '', bestMatch: null, confidence: 'LOW', alternatives: [] };
    }

    const firstToken = raw.split(' ')[0].toLowerCase();

    // Check direct alias mapping first
    if (COMMON_ALIASES[firstToken]) {
      const target = COMMON_ALIASES[firstToken];
      return {
        original: firstToken,
        bestMatch: target,
        confidence: 'HIGH',
        alternatives: [target],
        explanation: `Common command alias for "${firstToken}"`
      };
    }

    // Score all known CLI commands
    const candidates: { cmd: string; distance: number; score: number }[] = [];

    for (const cmd of ALL_CLI_COMMANDS) {
      const target = cmd.toLowerCase();
      if (target === firstToken) {
        // Exact match
        return {
          original: firstToken,
          bestMatch: target,
          confidence: 'HIGH',
          alternatives: []
        };
      }

      let score = 0;
      const distance = damerauLevenshteinDistance(firstToken, target);

      // Prefix match bonus (e.g. "decomm" -> "decommission")
      if (target.startsWith(firstToken) && firstToken.length >= 3) {
        score += 8;
      }
      // Substring match bonus
      if (target.includes(firstToken) && firstToken.length >= 3) {
        score += 4;
      }

      // Proximity score based on Levenshtein distance
      if (distance === 1) score += 10;
      else if (distance === 2) score += 6;
      else if (distance === 3 && target.length > 5) score += 3;

      if (score > 0 || distance <= 2) {
        candidates.push({ cmd, distance, score });
      }
    }

    // Sort candidates by highest score then lowest distance
    candidates.sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return a.distance - b.distance;
    });

    if (candidates.length === 0) {
      return {
        original: firstToken,
        bestMatch: null,
        confidence: 'LOW',
        alternatives: []
      };
    }

    const best = candidates[0];
    const confidence = best.score >= 8 || best.distance <= 1 ? 'HIGH' : best.score >= 4 ? 'MEDIUM' : 'LOW';
    const alternatives = candidates.slice(0, 4).map(c => c.cmd);

    return {
      original: firstToken,
      bestMatch: best.cmd,
      confidence,
      alternatives,
      explanation: `Closest match by spelling similarity (distance: ${best.distance})`
    };
  }

  /**
   * Get rich arguments, switches, pro tips, and GUI alternatives for a fulfilled command
   */
  static getCommandGuide(cmdName: string): CommandGuide | null {
    const normalized = cmdName.trim().toLowerCase();
    
    // Check deep guide catalog
    if (DEEP_COMMAND_GUIDES[normalized]) {
      return DEEP_COMMAND_GUIDES[normalized];
    }

    // Check alias
    if (COMMON_ALIASES[normalized] && DEEP_COMMAND_GUIDES[COMMON_ALIASES[normalized]]) {
      return DEEP_COMMAND_GUIDES[COMMON_ALIASES[normalized]];
    }

    // Dynamically build a guide from COMMAND_DOCS if available
    if (COMMAND_DOCS[normalized]) {
      const doc = COMMAND_DOCS[normalized];
      
      // Extract switches from syntax or examples
      const switches: CommandSwitch[] = [];
      const parts = doc.syntax.match(/-[-a-zA-Z0-9]+/g) || [];
      const uniqueFlags = Array.from(new Set(parts));

      for (const flag of uniqueFlags.slice(0, 6)) {
        const flagInfo = COMMON_FLAG_MEANINGS[flag] || COMMON_FLAG_MEANINGS[flag.toLowerCase()];
        const meaning = flagInfo?.meaning || 'Operational Option';
        const whatItDoes = flagInfo?.whatItDoes || `Modifies ${doc.name} behavior using switch option ${flag}.`;
        const plainExplanation = flagInfo?.plainExplanation || `Applies option ${flag} to customize ${doc.name} output or mode.`;

        switches.push({
          flag,
          meaning,
          whatItDoes,
          plainExplanation,
          description: whatItDoes,
          example: `${doc.name} ${flag}`,
          badge: 'RECOMMENDED'
        });
      }

      if (switches.length === 0) {
        switches.push({
          flag: '--help',
          meaning: 'Help Manual',
          whatItDoes: 'Displays available switches, options, and usage syntax.',
          plainExplanation: 'Shows the official quick-reference guide and all supported options.',
          description: 'Display quick reference manual with all supported flags.',
          example: `${doc.name} --help`,
          badge: 'POPULAR'
        });
      }

      const recipes: CommandRecipe[] = (doc.examples || []).map((ex, idx) => ({
        title: idx === 0 ? 'Basic Usage' : `Example ${idx + 1}`,
        command: ex,
        description: `Run ${ex} in SecureCurtain terminal.`
      }));

      return {
        name: doc.name,
        title: `${doc.name} — ${doc.category}`,
        category: doc.category,
        syntax: doc.syntax,
        summary: doc.description,
        switches,
        recipes,
        proTips: [
          `Type "man ${doc.name}" or "${doc.name} --help" for detailed documentation.`,
          doc.windowsEquivalent ? `Windows Equivalent: ${doc.windowsEquivalent}` : 'Native POSIX/Linux standard utility.'
        ],
        windowsEquivalent: doc.windowsEquivalent,
        seeAlso: doc.seeAlso || ['help', 'man']
      };
    }

    return null;
  }
}
