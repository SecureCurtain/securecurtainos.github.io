// jb7572_2026-08-25: Desktop Environment, Window Manager & Theme System Types

export type AppId =
  | 'health-hud'
  | 'task-manager'
  | 'memory-debugger'
  | 'storage-mgmt'
  | 'network-security'
  | 'user-mgmt'
  | 'system-config'
  | 'hardware-logs'
  | 'package-features'
  | 'search-indexer'
  | 'terminal'
  | 'architect-studio'
  | 'file-explorer'
  | 'notepad'
  | 'theme-studio'
  | 'guide'
  | 'system-info'
  | 'iso-builder'
  | 'watchdog-recovery'
  | 'os-installer'
  | 'forensics-workstation'
  | 'recycle-bin'
  | 'tux-screensaver';

export interface AppMetadata {
  id: AppId;
  title: string;
  linuxName: string;
  windowsName: string;
  description: string;
  iconName: string;
  category: 'core' | 'system' | 'dev' | 'tools';
  defaultSize: { width: number; height: number };
  defaultPos: { x: number; y: number };
  defaultWorkspace: number;
  cliCommandLinux: string;
  cliCommandWindows: string;
  badge?: string;
}

export type DockPlacement = 
  | 'bottom' 
  | 'top' 
  | 'left' 
  | 'right' 
  | 'floating-bottom' 
  | 'floating-top';

export type DockAlignment = 'center' | 'start' | 'end';

export interface DockConfig {
  id: string;
  name: string;
  enabled: boolean;
  placement: DockPlacement;
  alignment: DockAlignment;
  thickness: number; // in px: height if horizontal, width if vertical (36px - 96px)
  lengthPercent: number; // in %: 20% - 100%
  iconSize: number; // in px: 16px - 48px
  padding: number; // in px: 4px - 16px
  borderRadius: number; // in px: 0px - 32px
  translucency: 'glass' | 'solid' | 'acrylic';
  showStartButton: boolean;
  showWorkspaces: boolean;
  showOpenTasks: boolean;
  showPinnedApps: boolean;
  showSystemTray: boolean;
  showClock: boolean;
  showQuickSettings: boolean;
  pinnedAppIds: AppId[];
  customBg?: string;
  customBorder?: string;
}

export type SnapState = 
  | 'none' 
  | 'left' 
  | 'right' 
  | 'top' 
  | 'bottom' 
  | 'top-left' 
  | 'top-right' 
  | 'bottom-left' 
  | 'bottom-right';

export interface WindowItem {
  id: string;
  appId: AppId;
  title: string;
  iconName: string;
  position: { x: number; y: number };
  size: { width: number; height: number };
  isMinimized: boolean;
  isMaximized: boolean;
  isPinned: boolean;
  zIndex: number;
  workspaceId: number;
  snapState: SnapState;
  prevRect?: { x: number; y: number; width: number; height: number };
  customProps?: Record<string, any>;
}

export interface Workspace {
  id: number;
  name: string;
  description?: string;
  iconName?: string;
  icon?: string;
  accentColor?: string;
}

export type OSPersonality = 'linux' | 'windows' | 'hybrid';

export type VisualTheme = 
  | 'cyber-obsidian'
  | 'fluent-glass'
  | 'nord-aurora'
  | 'catppuccin-mocha'
  | 'win11-mica'
  | 'retro-amber';

export type IconTheme = 
  | 'sweet-candy'
  | 'neon-glow'
  | 'minimal-mono'
  | 'fluent-color'
  | 'cyber-matrix';

export type WallpaperTheme = 
  | 'animated-grid'
  | 'aurora-mesh'
  | 'deep-nebula'
  | 'cyber-topography'
  | 'obsidian-glow'
  | 'matrix-code';

export type TaskbarPosition = 'bottom' | 'top' | 'dock-floating';

export interface DesktopIcon {
  id: string;
  label: string;
  iconName: string;
  appId: AppId;
  x?: number;
  y?: number;
  gridPosition?: { col: number; row: number };
  badge?: string;
  category?: 'core' | 'system' | 'dev' | 'tools';
  isPermanent?: boolean; // If true, cannot be deleted or dismissed from desktop canvas
  // Android-style Icon Box / Group Folder Support (Desktop Localizer)
  isFolder?: boolean;
  folderName?: string;
  folderAppIds?: AppId[];
  folderColor?: string;
}

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  timestamp: string;
  read: boolean;
  appId?: AppId;
}

export interface ThemeConfig {
  id: VisualTheme;
  name: string;
  description: string;
  accentHex: string;
  accentSecondaryHex: string;
  windowBg: string;
  windowBorder: string;
  taskbarBg: string;
  titlebarBg: string;
  fontFamily: string;
  glassBlur: string;
  isDark: boolean;
  theme?: string;
  accentColor?: string;
  textColor?: string;
  dockBg?: string;
}

// jb7572_2026-08-27: Linux FreeDesktop.org compliant Trash & Recycle Bin item representation
export interface TrashItem {
  id: string;
  name: string;
  originalPath: string; // Full exact original path with 0 loss e.g. "home/projects/SecureCurtain/sys/subsystems/legacy_driver.c"
  type: 'file' | 'folder';
  deletionDate: string; // ISO timestamp
  sizeBytes: number;
  content?: string;
  language?: string;
  description?: string;
  children?: any[]; // For recursively deleted directory structures
  trashInfo: {
    specVersion: string; // "FreeDesktop.org 1.0"
    path: string;
    deletionDate: string;
    permissions: string;
    mimeType: string;
    deletedBy: string;
    hash: string;
  };
}

