// jb7572_2026-08-25: Desktop Themes, Wallpapers, App Catalog, and Default Settings

import {
  AppMetadata,
  DockConfig,
  Workspace,
  VisualTheme,
  IconTheme,
  WallpaperTheme,
  DesktopIcon,
  ThemeConfig,
  AppId
} from '../types/desktop';

export const APP_CATALOG_LIST: AppMetadata[] = [
  {
    id: 'health-hud',
    title: 'System Health HUD',
    linuxName: 'system-monitor',
    windowsName: 'System Health & Metrics',
    description: 'Real-time telemetry, hardware CPU/RAM loads, and subsystem statuses',
    iconName: 'Activity',
    category: 'core',
    defaultSize: { width: 880, height: 560 },
    defaultPos: { x: 80, y: 60 },
    defaultWorkspace: 1,
    cliCommandLinux: 'sc-health',
    cliCommandWindows: 'healthhud.exe',
    badge: 'LIVE'
  },
  {
    id: 'task-manager',
    title: 'Task Manager & Process Ring',
    linuxName: 'ps-top',
    windowsName: 'Task Manager',
    description: 'Preemptive microkernel threads, Ring 0-3 IPC security monitor, and process termination',
    iconName: 'Cpu',
    category: 'system',
    defaultSize: { width: 920, height: 600 },
    defaultPos: { x: 120, y: 90 },
    defaultWorkspace: 1,
    cliCommandLinux: 'top',
    cliCommandWindows: 'taskmgr.exe'
  },
  {
    id: 'memory-debugger',
    title: 'Physical & Virtual Memory Debugger',
    linuxName: 'kmem-inspect',
    windowsName: 'Memory Inspector & PMM',
    description: 'Inspect CR3 page tables, 4KB page frames, SLAB heap caches, and DMA buffers',
    iconName: 'Layers',
    category: 'dev',
    defaultSize: { width: 860, height: 580 },
    defaultPos: { x: 150, y: 110 },
    defaultWorkspace: 2,
    cliCommandLinux: 'sc-vmm',
    cliCommandWindows: 'memdbg.exe'
  },
  {
    id: 'storage-mgmt',
    title: 'Storage & VFS Manager',
    linuxName: 'vfs-disks',
    windowsName: 'Disk Management',
    description: 'NVMe namespaces, AHCI SATA volumes, USTAR ramdisk mount points, and EXT4/FAT32 journals',
    iconName: 'Database',
    category: 'system',
    defaultSize: { width: 840, height: 540 },
    defaultPos: { x: 180, y: 120 },
    defaultWorkspace: 2,
    cliCommandLinux: 'df -h',
    cliCommandWindows: 'diskmgmt.msc'
  },
  {
    id: 'network-security',
    title: 'Network & Firewall Monitor',
    linuxName: 'lwip-firewall',
    windowsName: 'Windows Defender Firewall & Net',
    description: 'lwIP TCP/IP stack, mbedTLS 1.3 cryptographic tunnels, e1000 NIC driver stats, and packet sniffer',
    iconName: 'ShieldAlert',
    category: 'system',
    defaultSize: { width: 900, height: 600 },
    defaultPos: { x: 200, y: 100 },
    defaultWorkspace: 3,
    cliCommandLinux: 'iptables -L',
    cliCommandWindows: 'netsh.exe'
  },
  {
    id: 'user-mgmt',
    title: 'User & Security Management',
    linuxName: 'user-accounts',
    windowsName: 'User Accounts & Roles',
    description: 'Manage root, guest, and admin privileges, TOTP 2FA keys, and elevation tokens',
    iconName: 'Users',
    category: 'system',
    defaultSize: { width: 780, height: 520 },
    defaultPos: { x: 170, y: 110 },
    defaultWorkspace: 3,
    cliCommandLinux: 'passwd',
    cliCommandWindows: 'net accounts'
  },
  {
    id: 'system-config',
    title: 'System & Kernel Configuration',
    linuxName: 'sysctl-config',
    windowsName: 'Control Panel',
    description: 'Microkernel parameters, boot arguments, ACPI power states, and security enforcement',
    iconName: 'Settings',
    category: 'system',
    defaultSize: { width: 840, height: 560 },
    defaultPos: { x: 130, y: 100 },
    defaultWorkspace: 1,
    cliCommandLinux: 'sysctl',
    cliCommandWindows: 'control.exe'
  },
  {
    id: 'hardware-logs',
    title: 'Hardware & Kernel Dmesg Logs',
    linuxName: 'dmesg-viewer',
    windowsName: 'Event Viewer (Kernel)',
    description: 'Ring buffer kernel logging, ACPI DSDT/SSDT table parser, and PCIe enumeration logs',
    iconName: 'ScrollText',
    category: 'dev',
    defaultSize: { width: 860, height: 560 },
    defaultPos: { x: 220, y: 130 },
    defaultWorkspace: 2,
    cliCommandLinux: 'dmesg',
    cliCommandWindows: 'eventvwr.msc'
  },
  {
    id: 'package-features',
    title: 'Package & Component Manager',
    linuxName: 'apt-pkg',
    windowsName: 'Optional Features & Packages',
    description: 'Subsystem module loader, driver packages, and runtime userland binary installation',
    iconName: 'Package',
    category: 'tools',
    defaultSize: { width: 800, height: 520 },
    defaultPos: { x: 160, y: 90 },
    defaultWorkspace: 2,
    cliCommandLinux: 'apt-get',
    cliCommandWindows: 'pkgmgr.exe'
  },
  {
    id: 'search-indexer',
    title: 'Unified Search & Knowledge Indexer',
    linuxName: 'krunner-search',
    windowsName: 'Windows Search & Indexing',
    description: 'Full-text indexed inverted-index search across VFS files, syscalls, and source codes',
    iconName: 'Search',
    category: 'core',
    defaultSize: { width: 820, height: 500 },
    defaultPos: { x: 140, y: 70 },
    defaultWorkspace: 1,
    cliCommandLinux: 'find /',
    cliCommandWindows: 'search.exe'
  },
  {
    id: 'terminal',
    title: 'SecureCurtain Unified Terminal',
    linuxName: 'bash',
    windowsName: 'Command Prompt (PowerShell)',
    description: 'Dual-Persona Shell supporting Linux bash POSIX utilities and Win32 CMD/PowerShell commands',
    iconName: 'Terminal',
    category: 'core',
    defaultSize: { width: 800, height: 500 },
    defaultPos: { x: 100, y: 80 },
    defaultWorkspace: 1,
    cliCommandLinux: 'bash',
    cliCommandWindows: 'cmd.exe',
    badge: 'RING0'
  },
  {
    id: 'architect-studio',
    title: 'Kernel Architecture Studio',
    linuxName: 'arch-designer',
    windowsName: 'Architecture Visualizer',
    description: 'Interactive diagram of microkernel components, Ring levels, IPC channels, and memory maps',
    iconName: 'Binary',
    category: 'dev',
    defaultSize: { width: 920, height: 600 },
    defaultPos: { x: 110, y: 80 },
    defaultWorkspace: 2,
    cliCommandLinux: 'sc-arch',
    cliCommandWindows: 'archview.exe'
  },
  {
    id: 'file-explorer',
    title: 'Virtual File System Explorer',
    linuxName: 'nautilus',
    windowsName: 'File Explorer',
    description: 'Browse microkernel VFS root, `/sys`, `/dev`, `/proc`, and simulated Win32 `C:\\` drive volumes',
    iconName: 'FolderTree',
    category: 'core',
    defaultSize: { width: 860, height: 540 },
    defaultPos: { x: 140, y: 90 },
    defaultWorkspace: 1,
    cliCommandLinux: 'ls -la',
    cliCommandWindows: 'explorer.exe'
  },
  {
    id: 'notepad',
    title: 'System Code & Text Editor',
    linuxName: 'gedit',
    windowsName: 'Notepad',
    description: 'Edit kernel boot scripts, configuration INIs, assembly files, and C headers',
    iconName: 'FileEdit',
    category: 'tools',
    defaultSize: { width: 780, height: 520 },
    defaultPos: { x: 160, y: 130 },
    defaultWorkspace: 2,
    cliCommandLinux: 'nano',
    cliCommandWindows: 'notepad.exe'
  },
  {
    id: 'theme-studio',
    title: 'Theme & Lockscreen Studio',
    linuxName: 'appearance-settings',
    windowsName: 'Personalization & Display',
    description: 'Switch between Linux GNOME/KDE, Windows 11/Classic, Cyberpunk, and Matrix aesthetics',
    iconName: 'Palette',
    category: 'tools',
    defaultSize: { width: 840, height: 560 },
    defaultPos: { x: 190, y: 100 },
    defaultWorkspace: 3,
    cliCommandLinux: 'gnome-tweaks',
    cliCommandWindows: 'desk.cpl'
  },
  {
    id: 'guide',
    title: 'System Manual & Developer Guide',
    linuxName: 'man-pages',
    windowsName: 'Help & Support',
    description: 'Complete architecture specifications, bootloader documentation, and syscall references',
    iconName: 'BookOpen',
    category: 'tools',
    defaultSize: { width: 820, height: 540 },
    defaultPos: { x: 120, y: 80 },
    defaultWorkspace: 4,
    cliCommandLinux: 'man securecurtain',
    cliCommandWindows: 'hh.exe'
  },
  {
    id: 'system-info',
    title: 'System Specifications & Version',
    linuxName: 'uname-info',
    windowsName: 'About SecureCurtain OS',
    description: 'Hardware identification, microkernel build date, git commit hash, and security attestations',
    iconName: 'Info',
    category: 'core',
    defaultSize: { width: 720, height: 480 },
    defaultPos: { x: 150, y: 100 },
    defaultWorkspace: 1,
    cliCommandLinux: 'uname -a',
    cliCommandWindows: 'winver.exe'
  },
  {
    id: 'iso-builder',
    title: 'ISO & Hydrator Packaging Studio',
    linuxName: 'mkisofs-rescue',
    windowsName: 'Bare-Metal Deployment Studio',
    description: 'Package bootable GRUB ISOs, USTAR initramfs images, and verified self-extracting hydrators',
    iconName: 'Disc',
    category: 'tools',
    defaultSize: { width: 880, height: 580 },
    defaultPos: { x: 210, y: 110 },
    defaultWorkspace: 4,
    cliCommandLinux: 'grub-mkrescue',
    cliCommandWindows: 'makewinmedia.exe'
  },
  {
    id: 'watchdog-recovery',
    title: 'Kernel Watchdog & Self-Heal',
    linuxName: 'watchdog-heal',
    windowsName: 'System Recovery & Diagnostics',
    description: 'Hardware panic interceptor, stack unwinder, live kernel reload, and TPM 2.0 integrity audits',
    iconName: 'HeartHandshake',
    category: 'core',
    defaultSize: { width: 820, height: 540 },
    defaultPos: { x: 230, y: 120 },
    defaultWorkspace: 4,
    cliCommandLinux: 'sc-watchdog',
    cliCommandWindows: 'recovery.msc'
  },
  {
    id: 'os-installer',
    title: 'Bare-Metal OS Installer',
    linuxName: 'calamares-sc',
    windowsName: 'SecureCurtain Setup',
    description: 'Interactive bare-metal drive partitioning, UEFI NVRAM enrollment, and kernel deployment wizard',
    iconName: 'HardDrive',
    category: 'tools',
    defaultSize: { width: 840, height: 560 },
    defaultPos: { x: 180, y: 110 },
    defaultWorkspace: 4,
    cliCommandLinux: 'install-os',
    cliCommandWindows: 'setup.exe'
  },
  {
    id: 'forensics-workstation',
    title: 'Forensics & Threat Intel Station',
    linuxName: 'volatility-sec',
    windowsName: 'Forensic Workstation',
    description: 'Memory dumps, syscall behavior graphing, rootkit scanning, and forensic artifact export',
    iconName: 'Crosshair',
    category: 'system',
    defaultSize: { width: 940, height: 620 },
    defaultPos: { x: 110, y: 70 },
    defaultWorkspace: 3,
    cliCommandLinux: 'volatility',
    cliCommandWindows: 'forensics.exe'
  },
  {
    id: 'recycle-bin',
    title: 'Recycle Bin & FreeDesktop Trash',
    linuxName: 'trash-can',
    windowsName: 'Recycle Bin',
    description: 'Zero-loss FreeDesktop.org Trash specification file recovery and purge manager',
    iconName: 'Trash2',
    category: 'core',
    defaultSize: { width: 820, height: 500 },
    defaultPos: { x: 160, y: 100 },
    defaultWorkspace: 1,
    cliCommandLinux: 'trash-list',
    cliCommandWindows: 'recycle.exe'
  },
  {
    id: 'tux-screensaver',
    title: 'Tux Interactive Retro Screensaver',
    linuxName: 'xscreensaver-tux',
    windowsName: 'Tux 3D Animation',
    description: 'Interactive animated screensaver featuring Tux and retro Windows butterfly sprites with audio synth',
    iconName: 'Sparkles',
    category: 'tools',
    defaultSize: { width: 800, height: 520 },
    defaultPos: { x: 140, y: 80 },
    defaultWorkspace: 4,
    cliCommandLinux: 'xscreensaver',
    cliCommandWindows: 'scrnsave.scr'
  }
];

export const APP_CATALOG: Record<AppId, AppMetadata> = APP_CATALOG_LIST.reduce((acc, app) => {
  acc[app.id] = app;
  return acc;
}, {} as Record<AppId, AppMetadata>);

export const DEFAULT_WORKSPACES: Workspace[] = [
  { id: 1, name: 'Workspace 1 (Primary)', iconName: 'Terminal', icon: 'Terminal', accentColor: '#06b6d4' },
  { id: 2, name: 'Workspace 2 (Memory & VFS)', iconName: 'Layers', icon: 'Layers', accentColor: '#8b5cf6' },
  { id: 3, name: 'Workspace 3 (Security & Net)', iconName: 'ShieldAlert', icon: 'ShieldAlert', accentColor: '#f43f5e' },
  { id: 4, name: 'Workspace 4 (Tools & ISO)', iconName: 'Disc', icon: 'Disc', accentColor: '#10b981' }
];

export const DEFAULT_DOCKS: DockConfig[] = [
  {
    id: 'primary-dock',
    name: 'Main Taskbar & Dock',
    enabled: true,
    placement: 'bottom',
    alignment: 'center',
    thickness: 48,
    lengthPercent: 100,
    iconSize: 26,
    padding: 6,
    borderRadius: 0,
    translucency: 'glass',
    showStartButton: true,
    showWorkspaces: true,
    showOpenTasks: true,
    showPinnedApps: true,
    showSystemTray: true,
    showClock: true,
    showQuickSettings: true,
    pinnedAppIds: ['terminal', 'file-explorer', 'health-hud', 'task-manager', 'theme-studio', 'iso-builder']
  }
];

export const DEFAULT_DESKTOP_ICONS: DesktopIcon[] = [
  {
    id: 'icon-term',
    appId: 'terminal',
    label: 'Unified Terminal',
    iconName: 'Terminal',
    gridPosition: { col: 0, row: 0 }
  },
  {
    id: 'icon-files',
    appId: 'file-explorer',
    label: 'VFS Explorer',
    iconName: 'FolderTree',
    gridPosition: { col: 0, row: 1 }
  },
  {
    id: 'icon-hud',
    appId: 'health-hud',
    label: 'Health HUD',
    iconName: 'Activity',
    gridPosition: { col: 0, row: 2 }
  },
  {
    id: 'icon-taskmgr',
    appId: 'task-manager',
    label: 'Task Manager',
    iconName: 'Cpu',
    gridPosition: { col: 0, row: 3 }
  },
  {
    id: 'icon-themes',
    appId: 'theme-studio',
    label: 'Theme Studio',
    iconName: 'Palette',
    gridPosition: { col: 0, row: 4 }
  },
  {
    id: 'icon-isobuild',
    appId: 'iso-builder',
    label: 'ISO Studio',
    iconName: 'Disc',
    gridPosition: { col: 1, row: 0 }
  },
  {
    id: 'icon-forensics',
    appId: 'forensics-workstation',
    label: 'Forensic Lab',
    iconName: 'Crosshair',
    gridPosition: { col: 1, row: 1 }
  },
  {
    id: 'icon-screensaver',
    appId: 'tux-screensaver',
    label: 'Tux Screensaver',
    iconName: 'Sparkles',
    gridPosition: { col: 1, row: 2 }
  }
];

export const ICON_THEMES: { id: IconTheme; name: string; description: string }[] = [
  { id: 'sweet-candy', name: 'Sweet Candy', description: 'Vibrant rounded icons with modern saturated gradients' },
  { id: 'neon-glow', name: 'Neon Cyber Glow', description: 'High contrast electric neon cyan & violet outlines' },
  { id: 'minimal-mono', name: 'Minimal Mono', description: 'Clean wireframe monochrome icons with precise geometry' },
  { id: 'fluent-color', name: 'Fluent Modern', description: 'Soft depth 3D-styled icons inspired by Fluent UI' },
  { id: 'cyber-matrix', name: 'Matrix Phosphor', description: 'Terminal-style amber & emerald phosphor glyphs' }
];

export const WALLPAPERS: { id: WallpaperTheme; name: string; description: string; gradient: string }[] = [
  { id: 'animated-grid', name: 'Cyber Grid Matrix', description: 'Perspective neon grid with animated scanlines', gradient: 'from-slate-950 via-purple-950/40 to-cyan-950/30' },
  { id: 'aurora-mesh', name: 'Nordic Aurora', description: 'Soft luminous gradients resembling polar lights', gradient: 'from-sky-950 via-teal-950/50 to-indigo-950' },
  { id: 'deep-nebula', name: 'Deep Space Nebula', description: 'Cosmic particle cloud with deep violet and magenta stars', gradient: 'from-purple-950 via-slate-950 to-pink-950/40' },
  { id: 'cyber-topography', name: 'Topographic Contours', description: 'Mathematical elevation lines with cyan phosphor accents', gradient: 'from-slate-950 via-emerald-950/30 to-black' },
  { id: 'obsidian-glow', name: 'Obsidian Velvet', description: 'Minimalist pitch-black canvas with subtle edge glow', gradient: 'from-black via-zinc-950 to-neutral-900' },
  { id: 'matrix-code', name: 'Digital Rain Phosphor', description: 'Cascading binary streams on dark phosphor background', gradient: 'from-emerald-950 via-black to-green-950/40' }
];

export const VISUAL_THEMES: Record<VisualTheme, ThemeConfig> = {
  'cyber-obsidian': {
    id: 'cyber-obsidian',
    name: 'Cyber Obsidian',
    description: 'High-contrast dark obsidian glass with neon cyan and purple glowing accents',
    accentHex: '#06b6d4',
    accentSecondaryHex: '#a855f7',
    windowBg: 'bg-[#0b0f19]/95',
    windowBorder: 'border-cyan-500/30',
    taskbarBg: 'bg-[#090d16]/90 backdrop-blur-xl border-cyan-500/20',
    titlebarBg: 'bg-[#080b12]/90',
    fontFamily: 'font-mono',
    glassBlur: 'backdrop-blur-2xl',
    isDark: true,
    theme: 'cyber-obsidian',
    accentColor: '#06b6d4',
    textColor: 'text-slate-100',
    dockBg: 'bg-[#090d16]/90 backdrop-blur-xl border-cyan-500/20'
  },
  'fluent-glass': {
    id: 'fluent-glass',
    name: 'Fluent Glass Acrylic',
    description: 'Frosted acrylic glass with vibrant blue accents and soft blurred translucency',
    accentHex: '#2563eb',
    accentSecondaryHex: '#60a5fa',
    windowBg: 'bg-slate-900/80',
    windowBorder: 'border-blue-500/30',
    taskbarBg: 'bg-slate-950/70 backdrop-blur-xl border-blue-500/20',
    titlebarBg: 'bg-slate-900/60',
    fontFamily: 'font-sans',
    glassBlur: 'backdrop-blur-xl',
    isDark: true,
    theme: 'fluent-glass',
    accentColor: '#2563eb',
    textColor: 'text-slate-100',
    dockBg: 'bg-slate-950/70 backdrop-blur-xl border-blue-500/20'
  },
  'nord-aurora': {
    id: 'nord-aurora',
    name: 'Nord Aurora',
    description: 'Arctic arctic-blue palette inspired by Nordic winter skies and cool slate geometry',
    accentHex: '#38bdf8',
    accentSecondaryHex: '#818cf8',
    windowBg: 'bg-[#0f172a]/95',
    windowBorder: 'border-sky-400/30',
    taskbarBg: 'bg-[#0a0f1d]/90 backdrop-blur-xl border-sky-400/20',
    titlebarBg: 'bg-[#0c1322]/90',
    fontFamily: 'font-sans',
    glassBlur: 'backdrop-blur-xl',
    isDark: true,
    theme: 'nord-aurora',
    accentColor: '#38bdf8',
    textColor: 'text-sky-100',
    dockBg: 'bg-[#0a0f1d]/90 backdrop-blur-xl border-sky-400/20'
  },
  'catppuccin-mocha': {
    id: 'catppuccin-mocha',
    name: 'Catppuccin Mocha',
    description: 'Soothing pastel twilight theme with mauve, lavender, and sapphire highlights',
    accentHex: '#cba6f7',
    accentSecondaryHex: '#f38ba8',
    windowBg: 'bg-[#181825]/95',
    windowBorder: 'border-purple-400/30',
    taskbarBg: 'bg-[#11111b]/90 backdrop-blur-xl border-purple-400/20',
    titlebarBg: 'bg-[#14141e]/90',
    fontFamily: 'font-sans',
    glassBlur: 'backdrop-blur-xl',
    isDark: true,
    theme: 'catppuccin-mocha',
    accentColor: '#cba6f7',
    textColor: 'text-slate-100',
    dockBg: 'bg-[#11111b]/90 backdrop-blur-xl border-purple-400/20'
  },
  'win11-mica': {
    id: 'win11-mica',
    name: 'Windows 11 Mica Pro',
    description: 'Authentic Windows Mica material styling with refined typography and soft borders',
    accentHex: '#0078d4',
    accentSecondaryHex: '#2b88d8',
    windowBg: 'bg-[#202020]/95',
    windowBorder: 'border-white/10',
    taskbarBg: 'bg-[#1c1c1c]/90 backdrop-blur-xl border-white/10',
    titlebarBg: 'bg-[#181818]/90',
    fontFamily: 'font-sans',
    glassBlur: 'backdrop-blur-2xl',
    isDark: true,
    theme: 'win11-mica',
    accentColor: '#0078d4',
    textColor: 'text-slate-100',
    dockBg: 'bg-[#1c1c1c]/90 backdrop-blur-xl border-white/10'
  },
  'retro-amber': {
    id: 'retro-amber',
    name: 'Amber CRT Terminal',
    description: 'Vintage 1980s monochrome phosphor amber glow with classic CRT curvature vibes',
    accentHex: '#f59e0b',
    accentSecondaryHex: '#fbbf24',
    windowBg: 'bg-[#140e05]/95',
    windowBorder: 'border-amber-500/40',
    taskbarBg: 'bg-[#0c0803]/90 backdrop-blur-xl border-amber-500/30',
    titlebarBg: 'bg-[#0a0702]/90',
    fontFamily: 'font-mono',
    glassBlur: 'backdrop-blur-xl',
    isDark: true,
    theme: 'retro-amber',
    accentColor: '#f59e0b',
    textColor: 'text-amber-400',
    dockBg: 'bg-[#0c0803]/90 backdrop-blur-xl border-amber-500/30'
  }
};

