// Command Registry Service: Comprehensive Linux, Modern Unix & Windows Terminal Engine
// Supporting 250+ standard, diagnostic, networking, storage, update, and watchdog commands

export interface CommandDoc {
  name: string;
  category: string;
  syntax: string;
  description: string;
  examples: string[];
  windowsEquivalent?: string;
  seeAlso?: string[];
}

export const COMMAND_DOCS: Record<string, CommandDoc> = {
  // --- File & Directory Operations ---
  ls: {
    name: 'ls',
    category: 'File Operations',
    syntax: 'ls [-l] [-a] [-h] [path]',
    description: 'List directory contents with detailed file attributes, permissions, and size.',
    examples: ['ls', 'ls -la /sys', 'ls -lh /boot'],
    windowsEquivalent: 'dir / Get-ChildItem',
    seeAlso: ['eza', 'tree', 'stat', 'cd']
  },
  dir: {
    name: 'dir',
    category: 'Windows Compatibility',
    syntax: 'dir [/w] [/s] [path]',
    description: 'Windows command prompt alias to list directory contents.',
    examples: ['dir', 'dir /sys/kernel'],
    windowsEquivalent: 'dir',
    seeAlso: ['ls', 'Get-ChildItem']
  },
  cd: {
    name: 'cd',
    category: 'File Operations',
    syntax: 'cd [directory]',
    description: 'Change current working directory in the Virtual File System (VFS).',
    examples: ['cd /sys/kernel', 'cd ..', 'cd ~'],
    windowsEquivalent: 'cd / Set-Location',
    seeAlso: ['pwd', 'zoxide']
  },
  pwd: {
    name: 'pwd',
    category: 'File Operations',
    syntax: 'pwd',
    description: 'Print the full canonical absolute path of the current working directory.',
    examples: ['pwd'],
    windowsEquivalent: 'cd / Get-Location',
    seeAlso: ['cd', 'realpath']
  },
  mkdir: {
    name: 'mkdir',
    category: 'File Operations',
    syntax: 'mkdir [-p] <directory_path>',
    description: 'Create one or more new directories in the file system.',
    examples: ['mkdir /tmp/sandbox', 'mkdir -p /home/user/projects/kernel'],
    windowsEquivalent: 'mkdir / md / New-Item -ItemType Directory',
    seeAlso: ['rmdir', 'touch']
  },
  rm: {
    name: 'rm',
    category: 'File Operations',
    syntax: 'rm [-r] [-f] <target_path>',
    description: 'Remove files or directories permanently from the file system.',
    examples: ['rm /tmp/cache.tmp', 'rm -rf /tmp/build_dir'],
    windowsEquivalent: 'del / rmdir / Remove-Item',
    seeAlso: ['unlink', 'shred']
  },
  cp: {
    name: 'cp',
    category: 'File Operations',
    syntax: 'cp [-r] <source> <destination>',
    description: 'Copy files or directories to a new location in the VFS.',
    examples: ['cp /etc/os-release /tmp/os.bak', 'cp -r /sys/kernel /tmp/backup'],
    windowsEquivalent: 'copy / xcopy / Copy-Item',
    seeAlso: ['mv', 'rsync']
  },
  mv: {
    name: 'mv',
    category: 'File Operations',
    syntax: 'mv <source> <destination>',
    description: 'Move or rename files and directories.',
    examples: ['mv /tmp/test.txt /tmp/test.c', 'mv /home/user/old /home/user/new'],
    windowsEquivalent: 'move / ren / Move-Item',
    seeAlso: ['cp', 'rename']
  },
  touch: {
    name: 'touch',
    category: 'File Operations',
    syntax: 'touch <file_path>',
    description: 'Create an empty file or update access and modification timestamps.',
    examples: ['touch /tmp/heartbeat.lock', 'touch /etc/resolv.conf'],
    windowsEquivalent: 'New-Item -ItemType File',
    seeAlso: ['mkdir', 'stat']
  },
  stat: {
    name: 'stat',
    category: 'File Operations',
    syntax: 'stat <file_path>',
    description: 'Display detailed inode, block allocation, timestamps, and access permissions.',
    examples: ['stat /sys/kernel/core/kmain.c', 'stat /boot/grub/grub.cfg'],
    windowsEquivalent: 'Get-Item | Format-List *',
    seeAlso: ['file', 'lsattr']
  },
  file: {
    name: 'file',
    category: 'File Operations',
    syntax: 'file <file_path>',
    description: 'Determine file type and MIME category using ELF magic numbers and headers.',
    examples: ['file /sys/kernel/core/kmain.c', 'file /boot/vmlinuz-6.10-SecureCurtain'],
    windowsEquivalent: 'Get-Item (Extension inspection)',
    seeAlso: ['stat', 'hexdump']
  },
  tree: {
    name: 'tree',
    category: 'File Operations',
    syntax: 'tree [-L level] [path]',
    description: 'Display an indented, visual ASCII directory tree graph.',
    examples: ['tree /sys', 'tree -L 2 /home'],
    windowsEquivalent: 'tree',
    seeAlso: ['ls', 'find']
  },

  // --- OS Updates & Watchdog Sentinel ---
  'sys-update': {
    name: 'sys-update',
    category: 'OS Architecture & Updates',
    syntax: 'sys-update [--check | --apply <pkg> | --slot-status | --switch-slot]',
    description: 'Manage A/B Dual-Slot Immutable OS updates, verify SHA256 integrity, and stage background slot flashes.',
    examples: [
      'sys-update --check',
      'sys-update --slot-status',
      'sys-update --apply /home/packages/kernel-6.11-rc1.pkg'
    ],
    windowsEquivalent: 'USOClient / WindowsUpdate (WUA)',
    seeAlso: ['watchdog', 'bootctl', 'dracut']
  },
  watchdog: {
    name: 'watchdog',
    category: 'OS Architecture & Updates',
    syntax: 'watchdog [--status | --ping | --arm <ms> | --trip-test | --history]',
    description: 'Inspect Ring 0 hardware watchdog timer, heartbeat telemetry, and automated rollback state.',
    examples: ['watchdog --status', 'watchdog --ping', 'watchdog --history'],
    windowsEquivalent: 'BugCheck / ASR (Automated System Recovery)',
    seeAlso: ['sys-update', 'dmesg', 'systemctl']
  },
  watchdogctl: {
    name: 'watchdogctl',
    category: 'OS Architecture & Updates',
    syntax: 'watchdogctl [status | kick | trip | config]',
    description: 'Systemd watchdog controller daemon interface.',
    examples: ['watchdogctl status', 'watchdogctl kick'],
    seeAlso: ['watchdog', 'systemctl']
  },
  bootctl: {
    name: 'bootctl',
    category: 'System Administration',
    syntax: 'bootctl [status | list | set-default <id>]',
    description: 'Query and configure UEFI firmware boot options and default OS A/B slot.',
    examples: ['bootctl status', 'bootctl list'],
    windowsEquivalent: 'bcdedit / bcdboot',
    seeAlso: ['sys-update', 'grub2-mkconfig']
  },

  // --- Modern Networking ---
  ip: {
    name: 'ip',
    category: 'Networking',
    syntax: 'ip [a | addr | link | route | neigh]',
    description: 'Modern Linux network management interface for interfaces, IPs, routing, and neighbor tables.',
    examples: ['ip a', 'ip link show', 'ip route show', 'ip neigh'],
    windowsEquivalent: 'ipconfig / Get-NetIPAddress / Get-NetRoute',
    seeAlso: ['ss', 'ping', 'traceroute']
  },
  ss: {
    name: 'ss',
    category: 'Networking',
    syntax: 'ss [-tulpn]',
    description: 'Investigate socket statistics and listening TCP/UDP endpoints (modern replacement for netstat).',
    examples: ['ss -tulpn', 'ss -ta', 'ss -s'],
    windowsEquivalent: 'netstat -ano / Get-NetTCPConnection',
    seeAlso: ['ip', 'lsof', 'ping']
  },
  ping: {
    name: 'ping',
    category: 'Networking',
    syntax: 'ping [-c count] <host>',
    description: 'Send ICMP ECHO_REQUEST packets to network hosts to measure latency and packet loss.',
    examples: ['ping 8.8.8.8', 'ping -c 4 1.1.1.1', 'ping localhost'],
    windowsEquivalent: 'ping / Test-Connection',
    seeAlso: ['traceroute', 'mtr', 'curl']
  },
  traceroute: {
    name: 'traceroute',
    category: 'Networking',
    syntax: 'traceroute <host>',
    description: 'Print network hop route trace to destination with latency per router.',
    examples: ['traceroute 8.8.8.8', 'traceroute gateway.local'],
    windowsEquivalent: 'tracert / Test-NetConnection -TraceRoute',
    seeAlso: ['mtr', 'tracepath', 'ping']
  },
  mtr: {
    name: 'mtr',
    category: 'Networking',
    syntax: 'mtr <host>',
    description: 'Interactive real-time diagnostic combining ping and traceroute into a continuous visual monitor.',
    examples: ['mtr 8.8.8.8', 'mtr 1.1.1.1'],
    windowsEquivalent: 'pathping',
    seeAlso: ['traceroute', 'ping']
  },
  curl: {
    name: 'curl',
    category: 'Networking',
    syntax: 'curl [-I] [-s] [-X METHOD] <url>',
    description: 'Transfer data from or to a server using HTTP, HTTPS, FTP, and other protocols.',
    examples: ['curl https://api.kernel.org/health', 'curl -I http://192.168.1.1'],
    windowsEquivalent: 'curl.exe / Invoke-WebRequest / Invoke-RestMethod',
    seeAlso: ['wget', 'nc', 'ss']
  },
  wget: {
    name: 'wget',
    category: 'Networking',
    syntax: 'wget <url>',
    description: 'Non-interactive network downloader for HTTP, HTTPS, and FTP payloads.',
    examples: ['wget https://distfiles.SecureCurtain/firmware.bin'],
    windowsEquivalent: 'Invoke-WebRequest -OutFile',
    seeAlso: ['curl']
  },
  dig: {
    name: 'dig',
    category: 'Networking',
    syntax: 'dig <domain> [A | AAAA | MX | TXT | NS]',
    description: 'Flexible DNS lookup utility for interrogating name servers and query timings.',
    examples: ['dig google.com', 'dig SecureCurtain.internal MX'],
    windowsEquivalent: 'nslookup / Resolve-DnsName',
    seeAlso: ['drill', 'nslookup']
  },
  drill: {
    name: 'drill',
    category: 'Networking',
    syntax: 'drill <domain> [type]',
    description: 'Modern ldns-backed DNS diagnostic lookup tool.',
    examples: ['drill root-servers.net'],
    windowsEquivalent: 'Resolve-DnsName',
    seeAlso: ['dig', 'nslookup']
  },

  // --- Monitoring & Hardware ---
  ps: {
    name: 'ps',
    category: 'Processes',
    syntax: 'ps [aux]',
    description: 'Report current active system processes snapshot with PIDs, CPU%, and memory consumption.',
    examples: ['ps', 'ps aux'],
    windowsEquivalent: 'tasklist / Get-Process',
    seeAlso: ['top', 'btop', 'kill', 'pgrep']
  },
  top: {
    name: 'top',
    category: 'Processes',
    syntax: 'top',
    description: 'Display real-time dynamic view of active tasks, CPU usage, and memory pressure.',
    examples: ['top'],
    windowsEquivalent: 'taskmgr (GUI) / Get-Process',
    seeAlso: ['btop', 'htop', 'ps']
  },
  btop: {
    name: 'btop',
    category: 'Modern Replacements',
    syntax: 'btop',
    description: 'Modern, graphical TUI resource monitor showing CPU gauges, memory graphs, disk I/O, and processes.',
    examples: ['btop'],
    windowsEquivalent: 'taskmgr / Resource Monitor',
    seeAlso: ['top', 'htop', 'glances']
  },
  kill: {
    name: 'kill',
    category: 'Processes',
    syntax: 'kill [-9 | -15] <pid>',
    description: 'Send a terminating or controlling signal (SIGTERM, SIGKILL) to a process ID.',
    examples: ['kill 104', 'kill -9 210'],
    windowsEquivalent: 'taskkill /PID / Stop-Process -Id',
    seeAlso: ['killall', 'pkill', 'ps']
  },
  killall: {
    name: 'killall',
    category: 'Processes',
    syntax: 'killall <process_name>',
    description: 'Kill processes by name rather than PID.',
    examples: ['killall test_daemon'],
    windowsEquivalent: 'taskkill /IM / Stop-Process -Name',
    seeAlso: ['kill', 'pkill']
  },
  pkill: {
    name: 'pkill',
    category: 'Processes',
    syntax: 'pkill <pattern>',
    description: 'Signal processes matching a regex pattern.',
    examples: ['pkill worker'],
    windowsEquivalent: 'Stop-Process -Name',
    seeAlso: ['pgrep', 'kill']
  },
  pgrep: {
    name: 'pgrep',
    category: 'Processes',
    syntax: 'pgrep <pattern>',
    description: 'Look up process IDs matching a name or query.',
    examples: ['pgrep kernel', 'pgrep sh'],
    windowsEquivalent: 'Get-Process | Where-Object',
    seeAlso: ['pidof', 'ps']
  },
  pidof: {
    name: 'pidof',
    category: 'Processes',
    syntax: 'pidof <program_name>',
    description: 'Find process ID of a running program.',
    examples: ['pidof kmain', 'pidof virtio_gpu'],
    windowsEquivalent: '(Get-Process -Name <name>).Id',
    seeAlso: ['pgrep', 'ps']
  },
  free: {
    name: 'free',
    category: 'System Diagnostics',
    syntax: 'free [-h] [-m] [-g]',
    description: 'Display total, used, and available physical memory (RAM) and swap buffers.',
    examples: ['free -h', 'free -m'],
    windowsEquivalent: 'Get-CimInstance Win32_OperatingSystem | Select *Memory*',
    seeAlso: ['vmstat', 'sysinfo']
  },
  uptime: {
    name: 'uptime',
    category: 'System Diagnostics',
    syntax: 'uptime',
    description: 'Tell how long system has been running, user session count, and 1/5/15-min load averages.',
    examples: ['uptime'],
    windowsEquivalent: '(Get-Date) - (Get-CimInstance Win32_OperatingSystem).LastBootUpTime',
    seeAlso: ['sysinfo', 'w']
  },
  lscpu: {
    name: 'lscpu',
    category: 'Hardware Introspection',
    syntax: 'lscpu',
    description: 'Display architecture details: cores, threads, clock frequency, cache sizes, and CPU flags (AVX2, VMX).',
    examples: ['lscpu'],
    windowsEquivalent: 'wmic cpu get / Get-CimInstance Win32_Processor',
    seeAlso: ['lshw', 'lspci']
  },
  lspci: {
    name: 'lspci',
    category: 'Hardware Introspection',
    syntax: 'lspci [-v]',
    description: 'Enumerate all PCI/PCIe devices connected to motherboard buses (NVMe, VirtIO, GPU, Intel HDA).',
    examples: ['lspci', 'lspci -v'],
    windowsEquivalent: 'devmgmt.msc / Get-PnpDevice',
    seeAlso: ['lsusb', 'lshw']
  },
  lsusb: {
    name: 'lsusb',
    category: 'Hardware Introspection',
    syntax: 'lsusb',
    description: 'List USB controllers, root hubs, and connected USB endpoints.',
    examples: ['lsusb'],
    windowsEquivalent: 'Get-PnpDevice -Class USB',
    seeAlso: ['lspci', 'lshw']
  },
  sensors: {
    name: 'sensors',
    category: 'Hardware Introspection',
    syntax: 'sensors',
    description: 'Poll physical motherboard hardware sensors: CPU die temperatures, fan RPM, and voltage rails.',
    examples: ['sensors'],
    windowsEquivalent: 'Get-CimInstance MSAcpi_ThermalZoneTemperature',
    seeAlso: ['turbostat', 'lscpu']
  },
  dmesg: {
    name: 'dmesg',
    category: 'Logs & Ring Buffer',
    syntax: 'dmesg [-H] [-T] [--level=err,warn]',
    description: 'Print or search the kernel ring buffer logs for boot events, ACPI tables, and driver diagnostics.',
    examples: ['dmesg', 'dmesg -T', 'dmesg --level=err'],
    windowsEquivalent: 'Get-WinEvent -ProviderName Microsoft-Windows-Kernel-*',
    seeAlso: ['journalctl', 'syslog']
  },
  journalctl: {
    name: 'journalctl',
    category: 'Logs & Ring Buffer',
    syntax: 'journalctl [-u service] [-f] [-n 50]',
    description: 'Query and filter system logging daemon logs across boot cycles and systemd services.',
    examples: ['journalctl -n 20', 'journalctl -u watchdog'],
    windowsEquivalent: 'wevtutil / Get-WinEvent',
    seeAlso: ['dmesg', 'systemctl']
  },

  // --- Storage & Disks ---
  df: {
    name: 'df',
    category: 'Storage',
    syntax: 'df [-h] [path]',
    description: 'Report file system disk space usage across all mounted volumes and partitions.',
    examples: ['df -h', 'df -h /'],
    windowsEquivalent: 'wmic logicaldisk / Get-Volume',
    seeAlso: ['du', 'lsblk', 'ncdu']
  },
  du: {
    name: 'du',
    category: 'Storage',
    syntax: 'du [-h] [-s] [path]',
    description: 'Estimate file space and directory usage recursively.',
    examples: ['du -sh /sys', 'du -h /boot'],
    windowsEquivalent: 'Get-ChildItem -Recurse | Measure-Object -Property Length -Sum',
    seeAlso: ['df', 'ncdu', 'dust']
  },
  lsblk: {
    name: 'lsblk',
    category: 'Storage',
    syntax: 'lsblk [-f] [-p]',
    description: 'List block storage devices (NVMe drives, flash media, loop devices) with partition hierarchy.',
    examples: ['lsblk', 'lsblk -f'],
    windowsEquivalent: 'diskpart (list disk) / Get-Disk',
    seeAlso: ['fdisk', 'blkid', 'df']
  },
  blkid: {
    name: 'blkid',
    category: 'Storage',
    syntax: 'blkid [device]',
    description: 'Locate and print block device attributes, UUIDs, partition labels, and filesystem formats.',
    examples: ['blkid', 'blkid /dev/nvme0n1p1'],
    windowsEquivalent: 'Get-Volume | Select-Object UniqueId, DriveType',
    seeAlso: ['lsblk', 'mount']
  },
  mount: {
    name: 'mount',
    category: 'Storage',
    syntax: 'mount [-t type] <device> <mount_point>',
    description: 'Attach a storage device partition to a target folder in the VFS.',
    examples: ['mount', 'mount -t ext4 /dev/nvme0n1p2 /data'],
    windowsEquivalent: 'mountvol / New-PSDrive',
    seeAlso: ['umount', 'findmnt', 'df']
  },
  umount: {
    name: 'umount',
    category: 'Storage',
    syntax: 'umount <mount_point_or_device>',
    description: 'Unmount a mounted file system safely flushing pending I/O buffers.',
    examples: ['umount /data', 'umount /mnt/rescue'],
    windowsEquivalent: 'mountvol <drive> /d / Remove-PSDrive',
    seeAlso: ['mount', 'sync']
  },
  fstrim: {
    name: 'fstrim',
    category: 'Storage',
    syntax: 'fstrim [-v] <mount_point>',
    description: 'Issue TRIM discard command to reclaim unused blocks on SSD and NVMe flash drives.',
    examples: ['fstrim -v /'],
    windowsEquivalent: 'defrag /l / Optimize-Volume -ReTrim',
    seeAlso: ['df', 'lsblk']
  },

  // --- Text Processing & Cryptography ---
  grep: {
    name: 'grep',
    category: 'Text Utilities',
    syntax: 'grep [-i] [-r] [-n] <pattern> [files...]',
    description: 'Search text lines matching regular expressions.',
    examples: ['grep -rn "kmain" /sys', 'grep -i "error" /var/log/syslog'],
    windowsEquivalent: 'findstr / Select-String',
    seeAlso: ['ripgrep', 'egrep', 'sed']
  },
  rg: {
    name: 'rg',
    category: 'Modern Replacements',
    syntax: 'rg [-i] [-n] <pattern> [path]',
    description: 'Ultra-fast recursive full-text search engine (ripgrep) respecting ignore rules.',
    examples: ['rg "PAGE_PRESENT" /sys', 'rg "watchdog"'],
    windowsEquivalent: 'Select-String',
    seeAlso: ['grep', 'find']
  },
  ripgrep: {
    name: 'ripgrep',
    category: 'Modern Replacements',
    syntax: 'ripgrep <pattern>',
    description: 'Alias for rg (ultra-fast regex code search).',
    examples: ['ripgrep init_mmu'],
    seeAlso: ['rg', 'grep']
  },
  cat: {
    name: 'cat',
    category: 'Text Utilities',
    syntax: 'cat <file_paths...>',
    description: 'Concatenate and stream file contents directly to standard output.',
    examples: ['cat /etc/os-release', 'cat /proc/version'],
    windowsEquivalent: 'type / Get-Content',
    seeAlso: ['bat', 'head', 'tail', 'less']
  },
  bat: {
    name: 'bat',
    category: 'Modern Replacements',
    syntax: 'bat <file_path>',
    description: 'Modern cat clone with syntax highlighting, line numbers, and Git indicators.',
    examples: ['bat /sys/kernel/core/kmain.c'],
    windowsEquivalent: 'Get-Content (Formatted)',
    seeAlso: ['cat', 'less']
  },
  head: {
    name: 'head',
    category: 'Text Utilities',
    syntax: 'head [-n lines] <file>',
    description: 'Output the first N lines of a file (default 10).',
    examples: ['head -n 5 /etc/hosts', 'head /sys/kernel/include/types.h'],
    windowsEquivalent: 'Get-Content -Head 10',
    seeAlso: ['tail', 'cat']
  },
  tail: {
    name: 'tail',
    category: 'Text Utilities',
    syntax: 'tail [-n lines] [-f] <file>',
    description: 'Output the last N lines of a file or stream updates dynamically.',
    examples: ['tail -n 20 /var/log/syslog', 'tail -f /var/log/watchdog.log'],
    windowsEquivalent: 'Get-Content -Tail 10 -Wait',
    seeAlso: ['head', 'cat']
  },
  wc: {
    name: 'wc',
    category: 'Text Utilities',
    syntax: 'wc [-l] [-w] [-c] <file>',
    description: 'Print newline, word, and byte counts for text files.',
    examples: ['wc -l /sys/kernel/core/kmain.c', 'wc /etc/fstab'],
    windowsEquivalent: 'Measure-Object -Line -Word -Character',
    seeAlso: ['grep', 'sort']
  },
  sha256sum: {
    name: 'sha256sum',
    category: 'Cryptography & Hash',
    syntax: 'sha256sum <file_path>',
    description: 'Compute and verify cryptographic SHA-256 hash digests.',
    examples: ['sha256sum /boot/vmlinuz-6.10-SecureCurtain', 'sha256sum /etc/os-release'],
    windowsEquivalent: 'certutil -hashfile <file> SHA256 / Get-FileHash -Algorithm SHA256',
    seeAlso: ['md5sum', 'sha512sum', 'b2sum']
  },
  md5sum: {
    name: 'md5sum',
    category: 'Cryptography & Hash',
    syntax: 'md5sum <file_path>',
    description: 'Compute MD5 checksum digest for file integrity validation.',
    examples: ['md5sum /etc/passwd'],
    windowsEquivalent: 'certutil -hashfile <file> MD5 / Get-FileHash -Algorithm MD5',
    seeAlso: ['sha256sum']
  },
  base64: {
    name: 'base64',
    category: 'Encoding',
    syntax: 'base64 [-d] <file_or_string>',
    description: 'Encode binary data into Base64 ASCII or decode Base64 strings.',
    examples: ['base64 /etc/hostname', 'echo "test" | base64'],
    windowsEquivalent: '[System.Convert]::ToBase64String(...)',
    seeAlso: ['base32', 'basenc']
  },
  jq: {
    name: 'jq',
    category: 'Data Processing',
    syntax: 'jq <filter> <json_file>',
    description: 'Command-line JSON processor to slice, filter, format, and map structured data.',
    examples: ['jq . /metadata.json', 'jq .name /package.json'],
    windowsEquivalent: 'ConvertFrom-Json / ConvertTo-Json',
    seeAlso: ['yq', 'awk']
  },

  // --- Help & Reference ---
  man: {
    name: 'man',
    category: 'Documentation',
    syntax: 'man <command>',
    description: 'Format and display full manual page documentation for any system utility.',
    examples: ['man sys-update', 'man watchdog', 'man ip', 'man ls'],
    windowsEquivalent: 'help <cmd> / Get-Help <cmd>',
    seeAlso: ['tldr', 'help']
  },
  tldr: {
    name: 'tldr',
    category: 'Modern Documentation',
    syntax: 'tldr <command>',
    description: 'Display practical, community-driven console cheat sheets with copy-ready examples.',
    examples: ['tldr curl', 'tldr sys-update', 'tldr ss'],
    windowsEquivalent: 'Get-Help -Examples',
    seeAlso: ['man', 'help']
  },
  help: {
    name: 'help',
    category: 'Documentation',
    syntax: 'help [--all | category]',
    description: 'Interactive categorized command index and system architecture manual.',
    examples: ['help', 'help --all', 'help network', 'help storage'],
    windowsEquivalent: 'help / Get-Command',
    seeAlso: ['man', 'tldr']
  },

  // --- Extended Commands & Windows Compatibility ---
  basename: {
    name: 'basename',
    category: 'File Operations',
    syntax: 'basename <path> [suffix]',
    description: 'Strip directory and suffix from filenames.',
    examples: ['basename /sys/kernel/core/kmain.c', 'basename /tmp/data.tar.gz .gz'],
    windowsEquivalent: 'Split-Path -Leaf',
    seeAlso: ['dirname', 'realpath']
  },
  dirname: {
    name: 'dirname',
    category: 'File Operations',
    syntax: 'dirname <path>',
    description: 'Strip last component from a file name path.',
    examples: ['dirname /sys/kernel/core/kmain.c'],
    windowsEquivalent: 'Split-Path -Parent',
    seeAlso: ['basename', 'realpath']
  },
  sync: {
    name: 'sync',
    category: 'Storage',
    syntax: 'sync',
    description: 'Flush file system buffers from memory to physical disk storage.',
    examples: ['sync'],
    windowsEquivalent: 'No direct CMD; handled by filesystem flushes',
    seeAlso: ['umount', 'mount']
  },
  shred: {
    name: 'shred',
    category: 'Security',
    syntax: 'shred [-u] [-n passes] <file>',
    description: 'Overwrite a file to hide its contents and securely erase it.',
    examples: ['shred -u /tmp/secret.key'],
    windowsEquivalent: 'cipher /w:<path> (SDelete)',
    seeAlso: ['rm', 'unlink']
  },
  chattr: {
    name: 'chattr',
    category: 'Security & Attributes',
    syntax: 'chattr [+i | -i | +a] <file>',
    description: 'Change special file attributes (such as immutable +i protection) on ext filesystems.',
    examples: ['chattr +i /boot/vmlinuz-6.10-SecureCurtain'],
    windowsEquivalent: 'attrib +r +h / (Get-Item <file>).Attributes',
    seeAlso: ['lsattr', 'chmod']
  },
  lsattr: {
    name: 'lsattr',
    category: 'Security & Attributes',
    syntax: 'lsattr [file]',
    description: 'List special file attributes on a Linux file system.',
    examples: ['lsattr /boot/vmlinuz-6.10-SecureCurtain'],
    windowsEquivalent: 'attrib / (Get-Item <file>).Attributes',
    seeAlso: ['chattr']
  },
  sestatus: {
    name: 'sestatus',
    category: 'Security & SELinux',
    syntax: 'sestatus [-v]',
    description: 'Reports whether SELinux is active, passive, disabled, and its current policy layout.',
    examples: ['sestatus'],
    windowsEquivalent: 'fltmc instances / Get-ExecutionPolicy',
    seeAlso: ['getsebool', 'setsebool']
  },
  modprobe: {
    name: 'modprobe',
    category: 'Kernel & Modules',
    syntax: 'modprobe [-r] <module_name>',
    description: 'Intelligently adds or removes functional device drivers/modules from the Linux Kernel.',
    examples: ['modprobe virtio_gpu', 'modprobe -r legacy_audio'],
    windowsEquivalent: 'pnputil / Enable-PnpDevice',
    seeAlso: ['lsmod', 'insmod', 'rmmod']
  },
  lsmod: {
    name: 'lsmod',
    category: 'Kernel & Modules',
    syntax: 'lsmod',
    description: 'Display active loaded kernel modules in Ring 0.',
    examples: ['lsmod'],
    windowsEquivalent: 'driverquery / Get-PnpDevice',
    seeAlso: ['modprobe', 'insmod']
  },
  sysctl: {
    name: 'sysctl',
    category: 'Kernel Introspection',
    syntax: 'sysctl [-a] [<variable>=<value>]',
    description: 'Configure or read kernel parameters at runtime via the /proc/sys/ interface.',
    examples: ['sysctl -a', 'sysctl kernel.watchdog_thresh=10'],
    windowsEquivalent: 'Set-ItemProperty (Registry system tuning)',
    seeAlso: ['dmesg', 'uname']
  },
  tasklist: {
    name: 'tasklist',
    category: 'Windows Compatibility',
    syntax: 'tasklist [/v] [/fi <filter>]',
    description: 'Windows command prompt utility to display current active tasks and memory consumption.',
    examples: ['tasklist'],
    windowsEquivalent: 'tasklist / Get-Process',
    seeAlso: ['ps', 'top']
  },
  'get-process': {
    name: 'Get-Process',
    category: 'PowerShell Compatibility',
    syntax: 'Get-Process [-Name <name>]',
    description: 'PowerShell cmdlet to retrieve active processes.',
    examples: ['Get-Process'],
    windowsEquivalent: 'Get-Process / tasklist',
    seeAlso: ['ps', 'tasklist']
  },
  ipconfig: {
    name: 'ipconfig',
    category: 'Windows Compatibility',
    syntax: 'ipconfig [/all]',
    description: 'Windows utility to display network adapter IP and gateway settings.',
    examples: ['ipconfig', 'ipconfig /all'],
    windowsEquivalent: 'ipconfig / Get-NetIPAddress',
    seeAlso: ['ip', 'ifconfig']
  },
  dc3dd: {
    name: 'dc3dd',
    category: 'Digital Forensics',
    syntax: 'dc3dd if=<source_device> of=<target_img> hash=sha256 [hash=md5] [log=<logfile>]',
    description: 'Department of Defense Cyber Crime Center enhanced DD imager with on-the-fly dual-pass cryptographic hashing, bad sector counting, and progress verification.',
    examples: ['dc3dd if=/dev/sdb of=/mnt/forensic_vault/evidence.raw hash=sha256', 'dc3dd if=/dev/sdb ofs=/mnt/vault/ev.dd. split=2G hash=md5'],
    windowsEquivalent: 'FTK Imager / FTKImagerCLI.exe',
    seeAlso: ['dcfldd', 'ewfacquire', 'dd']
  },
  ewfacquire: {
    name: 'ewfacquire',
    category: 'Digital Forensics',
    syntax: 'ewfacquire [-u] [-t <target_e01>] [-C <case_no>] [-E <evidence_no>] <source>',
    description: 'Expert Witness Compression Format (E01 / EnCase / FTK) imager with internal per-chunk CRC32/MD5 checksum verification and metadata headers.',
    examples: ['ewfacquire -t /mnt/forensic_vault/case419_sdb -C CASE-419 -E EVD-01 /dev/sdb'],
    windowsEquivalent: 'EnCase Forensic / FTK Imager E01 Exporter',
    seeAlso: ['dc3dd', 'aff4acquire', 'ewfinfo']
  },
  aff4acquire: {
    name: 'aff4acquire',
    category: 'Digital Forensics',
    syntax: 'aff4acquire -i <source> -o <target.aff4> -c snappy',
    description: 'Advanced Forensic Format 4 imager supporting multi-stream compression (ZSTD/Snappy) and sparse hash indexing.',
    examples: ['aff4acquire -i /dev/sdb -o /mnt/vault/case.aff4'],
    windowsEquivalent: 'WinPmem / AFF4 Imager',
    seeAlso: ['dc3dd', 'ewfacquire']
  },
  fls: {
    name: 'fls',
    category: 'Digital Forensics',
    syntax: 'fls [-r] [-p] [-d] <image_file>',
    description: 'The Sleuth Kit (TSK) utility to list file and directory names in an image (including deleted inode records and Alternate Data Streams).',
    examples: ['fls -r -p /mnt/forensic_vault/evidence.E01', 'fls -d /mnt/forensic_vault/evidence.raw'],
    windowsEquivalent: 'Autopsy / TSK fls.exe',
    seeAlso: ['mactime', 'tsk_recover', 'icat', 'blkls']
  },
  blkls: {
    name: 'blkls',
    category: 'Digital Forensics',
    syntax: 'blkls [-s] [-e] <image_file> > slack_space.raw',
    description: 'The Sleuth Kit (TSK) block extraction tool: extracts unallocated space or file slack space (-s) across an NTFS/EXT4 volume.',
    examples: ['blkls -s /mnt/forensic_vault/evidence.raw > /mnt/forensic_vault/slack_data.bin', 'blkls -e /mnt/forensic_vault/evidence.E01 > unallocated.raw'],
    windowsEquivalent: 'FTK Imager / Autopsy Slack Carver',
    seeAlso: ['fls', 'icat', 'scalpel']
  },
  vshadowinfo: {
    name: 'vshadowinfo',
    category: 'Digital Forensics',
    syntax: 'vshadowinfo [-o <offset>] <image_file>',
    description: 'Libvshadow tool to parse Volume Shadow Snapshot headers, GUIDs, and creation timestamps from NTFS storage.',
    examples: ['vshadowinfo /mnt/forensic_vault/evidence.raw', 'vshadowinfo -o 1048576 /dev/sdb'],
    windowsEquivalent: 'vssadmin list shadows',
    seeAlso: ['vshadowmount', 'fls']
  },
  vshadowmount: {
    name: 'vshadowmount',
    category: 'Digital Forensics',
    syntax: 'vshadowmount <image_file> <mount_point>',
    description: 'Mount Volume Shadow Snapshots as read-only virtual block files (/mnt/vss/vss1, vss2) for forensic inspection.',
    examples: ['vshadowmount /mnt/forensic_vault/evidence.raw /mnt/vss', 'vshadowmount /mnt/forensic_vault/evidence.E01 /mnt/vss'],
    windowsEquivalent: 'ShadowCopyView / Arsenal Image Mounter',
    seeAlso: ['vshadowinfo', 'ewfmount']
  },
  streams: {
    name: 'streams',
    category: 'Digital Forensics',
    syntax: 'streams [-s] [-d] <path_or_file>',
    description: 'Sysinternals / NTFS utility to scan, reveal, and extract NTFS Alternate Data Streams (ADS) and Zone.Identifier metadata.',
    examples: ['streams -s C:\\Users\\architect\\Downloads\\', 'streams C:\\Windows\\System32\\calc.exe'],
    windowsEquivalent: 'dir /R / Get-Item -Stream *',
    seeAlso: ['fls', 'icat']
  },
  mactime: {
    name: 'mactime',
    category: 'Digital Forensics',
    syntax: 'mactime -b <body_file> -d [-y]',
    description: 'Generate super-timeline of Modified, Accessed, Changed ($MFT), and Born (Birth) timestamps from extracted bodyfiles.',
    examples: ['mactime -b /tmp/mft_body.txt 2026-08-01..2026-08-31'],
    windowsEquivalent: 'Log2Timeline / Plaso',
    seeAlso: ['fls', 'log2timeline']
  },
  'log2timeline.py': {
    name: 'log2timeline.py',
    category: 'Digital Forensics',
    syntax: 'log2timeline.py [--parsers <list>] <storage.plaso> <image_or_drive>',
    description: 'Plaso super-timeline extractor processing MFT, Event Logs (EVTX), Registry hives, browser histories, and prefetch.',
    examples: ['log2timeline.py /mnt/vault/disk.plaso /mnt/forensic_vault/evidence.E01', 'log2timeline.py --parsers "win7,mft,evtx" /mnt/vault/disk.plaso /dev/sdb'],
    windowsEquivalent: 'log2timeline.exe (Plaso Windows)',
    seeAlso: ['psort.py', 'mactime', 'volatility']
  },
  'psort.py': {
    name: 'psort.py',
    category: 'Digital Forensics',
    syntax: 'psort.py -o l2tcsv -w super-timeline.csv <storage.plaso>',
    description: 'Plaso output processor generating structured CSV super-timelines (l2tcsv format) and correlating memory/disk artifacts.',
    examples: ['psort.py -o l2tcsv -w super-timeline.csv /mnt/vault/disk.plaso', 'psort.py -o dynamic -w timeline.json /mnt/vault/disk.plaso'],
    windowsEquivalent: 'psort.exe',
    seeAlso: ['log2timeline.py', 'mactime']
  },
  volatility: {
    name: 'volatility',
    category: 'Digital Forensics',
    syntax: 'vol.py -f <memory_image> [windows.pslist | windows.malfind | windows.netscan | timeliner.Timeliner]',
    description: 'Volatility 3 advanced memory forensics framework for kernel analysis, process tree extraction, and malware injection detection.',
    examples: ['vol.py -f /mnt/vault/ram.raw windows.pslist', 'vol.py -f /mnt/vault/ram.raw windows.malfind', 'vol.py -f /mnt/vault/ram.raw timeliner.Timeliner --output-format csv'],
    windowsEquivalent: 'volatility.exe / Rekall',
    seeAlso: ['memprocfs', 'arsenal-recon', 'belkasoft-ram']
  },
  memprocfs: {
    name: 'memprocfs',
    category: 'Digital Forensics',
    syntax: 'memprocfs -device <memory_file> -mount <mount_point>',
    description: 'Memory Process File System: Mount physical memory dumps as a navigable virtual filesystem with process trees, VAD maps, and YARA hits.',
    examples: ['memprocfs -device /mnt/vault/ram.raw -mount /mnt/memprocfs', 'memprocfs -device /mnt/vault/hiberfil_decompressed.raw -mount /mnt/memprocfs -forensic 1'],
    windowsEquivalent: 'MemProcFS.exe -device ram.raw -mount M:',
    seeAlso: ['volatility', 'arsenal-recon']
  },
  'arsenal-recon': {
    name: 'arsenal-recon',
    category: 'Digital Forensics',
    syntax: 'hibrecon --decompress --source hiberfil.sys --output <decompressed.raw>',
    description: 'Arsenal Hibernation Recon: Decompress Windows 10/11 multi-phase Xpress/LZNT1 and Fast Startup hibernation files into raw RAM.',
    examples: ['hibrecon --decompress --source /mnt/sdb/hiberfil.sys --output /mnt/vault/ram_hib.raw', 'hibr2bin hiberfil.sys memory.bin'],
    windowsEquivalent: 'Arsenal Hibernation Recon GUI / CLI',
    seeAlso: ['hibr2bin', 'volatility']
  },
  'cfae': {
    name: 'cfae',
    category: 'Digital Forensics',
    syntax: 'cfae -hive <hive_path> [-userassist] [-shellbags] [-shimcache] [-runkeys]',
    description: 'TZWorks Common Forensic Artifact Extractor: Deep registry hive analysis for UserAssist (ROT13), ShellBags, AppCompatCache, and persistence.',
    examples: ['cfae -hive NTUSER.DAT -userassist -csv', 'cfae -hive SYSTEM -shimcache'],
    windowsEquivalent: 'cfae64.exe / Registry Explorer',
    seeAlso: ['registry-explorer', 'regripper']
  },
  'evtx-viewer': {
    name: 'evtx-viewer',
    category: 'Digital Forensics',
    syntax: 'evtx-viewer <event_log.evtx> [--filter-id <id>] [--export-csv <file>]',
    description: 'Windows Event Log (*.evtx) forensics parser & copier extracting Security 4624/4625/4688, PowerShell 4104, and Sysmon events.',
    examples: ['evtx-viewer /mnt/sdb/Windows/System32/winevt/Logs/Security.evtx --filter-id 4624', 'evtx-dump -o json Security.evtx'],
    windowsEquivalent: 'Event Log Explorer / Hayabusa / evtx_dump.exe',
    seeAlso: ['cfae', 'log2timeline.py']
  },
  'hips-scan': {
    name: 'hips-scan',
    category: 'Host Intrusion Prevention',
    syntax: 'hips-scan [--deep] [--memory] [--rootkit] [--path <target>]',
    description: 'Host Intrusion Prevention System (HIPS) deep heuristic scanner with Ring 0 memory and process interception.',
    examples: ['hips-scan --deep', 'hips-scan --memory --rootkit', 'hips-scan --path /home/architect'],
    windowsEquivalent: 'Defender-Scan / Sysmon / SentinelOne CLI',
    seeAlso: ['hips-status', 'quarantine-vault', 'yara', 'clamscan']
  },
  'hips-status': {
    name: 'hips-status',
    category: 'Host Intrusion Prevention',
    syntax: 'hips-status [--json] [--verbose]',
    description: 'Query real-time status of HIPS kernel syscall trap, memory injection shield, and zero-day heuristics.',
    examples: ['hips-status', 'hips-status --verbose'],
    windowsEquivalent: 'Get-MpComputerStatus / sc query hips_driver',
    seeAlso: ['hips-scan', 'quarantine-vault', 'sestatus']
  },
  'quarantine-vault': {
    name: 'quarantine-vault',
    category: 'Host Intrusion Prevention',
    syntax: 'quarantine-vault [list | inspect <id> | decompile <id> | purge <id>]',
    description: 'Manage air-gapped Ring -1 quarantine sandbox for reverse-engineering isolated malware payloads and bytecode.',
    examples: ['quarantine-vault list', 'quarantine-vault inspect QZ-9041', 'quarantine-vault decompile QZ-9041'],
    windowsEquivalent: 'Get-MpThreatDetection / QuarantineManager',
    seeAlso: ['hips-scan', 'yara', 'strings']
  },
  'yara': {
    name: 'yara',
    category: 'Security & Antivirus',
    syntax: 'yara [-r] [-w] <rule_file.yar> <target_directory_or_pid>',
    description: 'Pattern matching tool for malware researchers to identify and classify malware samples.',
    examples: ['yara /etc/yara/rules.yar /tmp', 'yara -r rule_stealer.yar /proc/3840/mem'],
    windowsEquivalent: 'yara64.exe',
    seeAlso: ['hips-scan', 'clamscan', 'strings']
  },
  'clamscan': {
    name: 'clamscan',
    category: 'Security & Antivirus',
    syntax: 'clamscan [-r] [--infected] [--move=<quarantine_dir>] <target>',
    description: 'Open-source antivirus engine for detecting trojans, viruses, malware & other malicious threats.',
    examples: ['clamscan -r /home', 'clamscan --infected --recursive /tmp'],
    windowsEquivalent: 'MpCmdRun.exe -Scan',
    seeAlso: ['hips-scan', 'yara', 'freshclam', 'rkhunter']
  },
  'freshclam': {
    name: 'freshclam',
    category: 'Security & Antivirus',
    syntax: 'freshclam [--datadir=<path>] [--config-file=<path>] [--verbose]',
    description: 'Anti-Malware Signature Updater: Synchronizes virus definition databases (daily.cvd, bytecode.cvd) directly to Live Rescue USB persistent storage (/mnt/live_persistence/signatures).',
    examples: [
      'freshclam',
      'freshclam --datadir=/mnt/live_persistence/signatures',
      'freshclam --verbose'
    ],
    windowsEquivalent: 'MpCmdRun.exe -SignatureUpdate',
    seeAlso: ['clamscan', 'yara', 'hips-scan']
  },
  'hivexregedit': {
    name: 'hivexregedit',
    category: 'Forensics & Carving',
    syntax: 'hivexregedit [--merge --write <hive_file> <patch.reg>] [--export <hive_file> <prefix>]',
    description: 'Offline Windows Registry Editor & Persistence Cleaner: Inspects and modifies offline SAM, SYSTEM, and SOFTWARE hives without booting Windows to eradicate rogue Services, Winlogon Shell hijacks, and IFEO debugger hooks.',
    examples: [
      'hivexregedit --export /mnt/windows_sys/Windows/System32/config/SOFTWARE "Microsoft\\\\Windows NT\\\\CurrentVersion\\\\Winlogon"',
      'hivexregedit --merge --write /mnt/windows_sys/Windows/System32/config/SOFTWARE clean_runkeys.reg'
    ],
    windowsEquivalent: 'reg.exe load / offline regedit.exe',
    seeAlso: ['reg', 'cfae', 'chntpw']
  },
  'rkhunter': {
    name: 'rkhunter',
    category: 'Security & Antivirus',
    syntax: 'rkhunter [--check] [--update] [--cronjob]',
    description: 'Rootkit Hunter scans for rootkits, backdoors, hidden processes, and local exploits.',
    examples: ['rkhunter --check', 'rkhunter --update'],
    windowsEquivalent: 'GMER / RootkitRevealer',
    seeAlso: ['chkrootkit', 'aide', 'hips-scan']
  },
  'chkrootkit': {
    name: 'chkrootkit',
    category: 'Security & Antivirus',
    syntax: 'chkrootkit [-q] [-x]',
    description: 'Locally checks for signs of a rootkit in system binaries and kernel symbols.',
    examples: ['chkrootkit', 'chkrootkit -q'],
    windowsEquivalent: 'RootkitRevealer.exe',
    seeAlso: ['rkhunter', 'aide']
  },
  'aide': {
    name: 'aide',
    category: 'Security & Antivirus',
    syntax: 'aide [--check | --init | --update]',
    description: 'Advanced Intrusion Detection Environment: File and directory integrity checker (FIM).',
    examples: ['aide --check', 'aide --init'],
    windowsEquivalent: 'Tripwire / OSSEC',
    seeAlso: ['rkhunter', 'sha256sum']
  },
  'reg': {
    name: 'reg',
    category: 'Windows & Subsystem',
    syntax: 'reg [ query | add | delete | export | import | reset ] <KeyName> [/v ValueName] [/t Type] [/d Data] [/f]',
    description: 'Windows Registry Console Tool: Query, add, modify, delete, export, and import registry keys and values in HKLM, HKCU, and KCONFIG.',
    examples: [
      'reg query HKCU\\Software\\Microsoft\\Notepad',
      'reg add HKCU\\Software\\Microsoft\\Notepad /v iFontSize /t REG_DWORD /d 16 /f',
      'reg add HKCU\\Software\\Microsoft\\Notepad /v fWrapText /t REG_DWORD /d 0 /f',
      'reg delete HKCU\\Software\\Microsoft\\Notepad /v iFontSize /f',
      'reg export HKCU\\Software\\Microsoft\\Notepad C:\\backup_notepad.reg',
      'reg import C:\\backup_notepad.reg',
      'reg reset'
    ],
    windowsEquivalent: 'reg.exe / regedit.exe',
    seeAlso: ['cfae', 'kconfig', 'services.msc']
  },
  'regedit': {
    name: 'regedit',
    category: 'Windows & Subsystem',
    syntax: 'regedit [/s <file.reg>]',
    description: 'Windows Registry Editor: Graphical & scriptable tool for managing system hives (HKLM, HKCU, KCONFIG) and application configurations.',
    examples: ['regedit', 'regedit /s C:\\app_settings.reg'],
    windowsEquivalent: 'regedit.exe',
    seeAlso: ['reg', 'cfae']
  }
};

export function getCommandList(): CommandDoc[] {
  return Object.values(COMMAND_DOCS);
}
