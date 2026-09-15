// jb7572_2026-08-25: Desktop Environment State Engine & Window Manager Context

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { TreeNode } from '../types';
import { initialOSTree } from '../data/osTreeData';
import { findTreeNode } from '../utils/vfsUtils';
import { 
  WindowItem, 
  Workspace, 
  OSPersonality, 
  VisualTheme, 
  IconTheme, 
  WallpaperTheme, 
  TaskbarPosition, 
  AppId, 
  SnapState, 
  NotificationItem,
  ThemeConfig,
  DockConfig,
  AppMetadata,
  DesktopIcon,
  TrashItem
} from '../types/desktop';
import { 
  DEFAULT_WORKSPACES, 
  APP_CATALOG, 
  VISUAL_THEMES,
  DEFAULT_DOCKS,
  DEFAULT_DESKTOP_ICONS
} from '../data/desktopThemes';
import { soundSystemService } from '../services/soundSystemService';
import { backgroundJobService } from '../services/backgroundJobService';
import { userManagementService } from '../services/userManagementService';

interface DesktopContextType {
  windows: WindowItem[];
  activeWindowId: string | null;
  workspaces: Workspace[];
  activeWorkspaceId: number;
  personality: OSPersonality;
  visualTheme: VisualTheme;
  themeConfig: ThemeConfig;
  iconTheme: IconTheme;
  wallpaper: WallpaperTheme;
  taskbarPosition: TaskbarPosition;
  isStartMenuOpen: boolean;
  isQuickSettingsOpen: boolean;
  isExposeOpen: boolean;
  isAltTabOpen: boolean;
  notifications: NotificationItem[];
  unreadNotificationsCount: number;

  // Multi-Dock & Taskbar System
  docks: DockConfig[];
  addDock: (dock?: Partial<DockConfig>) => DockConfig;
  updateDock: (dockId: string, updates: Partial<DockConfig>) => void;
  removeDock: (dockId: string) => void;
  duplicateDock: (dockId: string) => void;
  resetDocksToDefault: () => void;

  // Dynamic Reactive App Catalog & Icon Metadata Sync
  appCatalog: Record<AppId, AppMetadata>;
  updateAppMetadata: (appId: AppId, updates: Partial<AppMetadata>) => void;
  getAppMetadata: (appId: AppId) => AppMetadata;

  // Desktop Icons & Folder Box Engine
  desktopIcons: DesktopIcon[];
  setDesktopIcons: React.Dispatch<React.SetStateAction<DesktopIcon[]>>;
  addDesktopIcon: (appId: AppId, customProps?: Partial<DesktopIcon>) => boolean;
  removeDesktopIcon: (iconIdOrAppId: string) => void;
  isAppOnDesktop: (appId: AppId) => boolean;
  togglePinToTaskbar: (appId: AppId) => void;
  createIconFolder: (targetIconId: string, draggedIconId: string, customName?: string) => void;
  addAppToFolder: (folderId: string, appId: AppId) => void;
  removeAppFromFolder: (folderId: string, appId: AppId) => void;
  dissolveFolder: (folderId: string) => void;
  renameFolder: (folderId: string, newName: string) => void;
  setFolderColor: (folderId: string, color: string) => void;
  autoGroupIconsByCategory: () => void;
  ungroupAllFolders: () => void;

  // OS Tree & Drag-and-Drop Installation
  treeData: TreeNode;
  placeFileInTree: (filename: string, targetPath: string, content: string, description: string) => void;
  deleteFileFromTree: (nodeId: string) => void;
  
  // Linux FreeDesktop.org Trash & 0-Loss Recycle Bin Engine
  trashItems: TrashItem[];
  moveToTrash: (nodeOrId: string | TreeNode) => void;
  restoreTrashItem: (trashId: string) => void;
  restoreAllTrashItems: () => void;
  emptyTrash: () => void;
  deletePermanently: (trashId: string) => void;
  
  // Window Operations
  openApp: (appId: AppId, title?: string, customProps?: any) => WindowItem;
  closeWindow: (id: string) => void;
  minimizeWindow: (id: string) => void;
  maximizeWindow: (id: string) => void;
  restoreWindow: (id: string) => void;
  snapWindow: (id: string, snapState: SnapState) => void;
  focusWindow: (id: string) => void;
  moveWindow: (id: string, pos: { x: number; y: number }) => void;
  resizeWindow: (id: string, size: { width: number; height: number }, pos?: { x: number; y: number }) => void;
  togglePinWindow: (id: string) => void;
  moveWindowToWorkspace: (id: string, workspaceId: number) => void;
  switchWorkspace: (workspaceId: number) => void;
  addWorkspace: (name?: string) => void;
  minimizeAllWindows: () => void;

  // Customization
  setPersonality: (p: OSPersonality) => void;
  setVisualTheme: (theme: VisualTheme) => void;
  setIconTheme: (theme: IconTheme) => void;
  setWallpaper: (wp: WallpaperTheme) => void;
  setTaskbarPosition: (pos: TaskbarPosition) => void;
  
  // UI Flyout Toggles
  toggleStartMenu: (force?: boolean) => void;
  toggleQuickSettings: (force?: boolean) => void;
  toggleExpose: (force?: boolean) => void;
  toggleAltTab: (force?: boolean) => void;
  
  // Notifications
  addNotification: (notif: Omit<NotificationItem, 'id' | 'timestamp' | 'read'>) => void;
  dismissNotification: (id: string) => void;
  clearAllNotifications: () => void;

  // Boot, Post-Spotlight, Login & Theater Curtains Stage Engine
  bootSessionState: 'boot_spotlight' | 'oobe' | 'login' | 'theater_curtains' | 'desktop';
  setBootSessionState: (state: 'boot_spotlight' | 'oobe' | 'login' | 'theater_curtains' | 'desktop') => void;
  loginWallpaperId: string;
  setLoginWallpaperId: (id: string) => void;
  rebootOS: () => void;
  lockSession: () => void;
  replayCurtainsReveal: () => void;
  unlockToDesktop: () => void;
  resetToOobe: () => void;

  // Tux Cartoon Screensaver & Idle Lock Engine
  isScreensaverActive: boolean;
  startScreensaver: () => void;
  stopScreensaver: () => void;
  screensaverIdleTimeout: number;
  setScreensaverIdleTimeout: (seconds: number) => void;
  lockOnTimeout: boolean;
  setLockOnTimeout: (lock: boolean) => void;
  screensaverOnLockHotkey: boolean;
  setScreensaverOnLockHotkey: (enable: boolean) => void;
  idleSecondsRemaining: number;
  resetIdleTimer: () => void;

  // Display & Brightness Controls
  screenBrightness: number;
  setScreenBrightness: (val: number) => void;
}

const DesktopContext = createContext<DesktopContextType | undefined>(undefined);

export const DesktopProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // OS File Tree State & File Installation
  const [treeData, setTreeData] = useState<TreeNode>(initialOSTree);

  const placeFileInTree = useCallback((
    filename: string,
    targetPath: string,
    content: string,
    description: string
  ) => {
    setTreeData(prevTree => {
      const updated = JSON.parse(JSON.stringify(prevTree)) as TreeNode;
      const cleanPath = `${targetPath}/${filename}`;

      // Ensure jb7572 author provenance watermark header is present
      let finalizedContent = content;
      const todayStr = '2026-08-25';
      const ext = filename.split('.').pop()?.toLowerCase() || '';
      
      if (!finalizedContent.includes('jb7572_')) {
        if (ext === 'c' || ext === 'h' || ext === 'cpp' || ext === 'hpp') {
          finalizedContent = `// SecureCurtain OS - ${filename}\n` + finalizedContent;
        } else if (ext === 'asm' || ext === 's' || ext === 'inc') {
          finalizedContent = `; SecureCurtain OS - ${filename}\n` + finalizedContent;
        } else if (ext === 'py' || ext === 'sh' || ext === 'ld' || ext === 'mk' || filename.toLowerCase().includes('makefile')) {
          finalizedContent = `# SecureCurtain OS - ${filename}\n` + finalizedContent;
        }
      }

      const newFileNode: TreeNode = {
        id: `file-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
        name: filename,
        type: 'file',
        path: cleanPath,
        content: finalizedContent,
        description: description,
        isCustom: true
      };

      const addNodeToPath = (current: TreeNode, path: string): boolean => {
        if (current.path === path) {
          if (!current.children) current.children = [];
          const existingIndex = current.children.findIndex(c => c.name === filename);
          if (existingIndex >= 0) {
            current.children[existingIndex] = newFileNode;
          } else {
            current.children.push(newFileNode);
          }
          return true;
        }

        if (current.children) {
          for (const child of current.children) {
            if (child.type === 'folder' && addNodeToPath(child, path)) {
              return true;
            }
          }
        }
        return false;
      };

      const success = addNodeToPath(updated, targetPath);
      if (!success) {
        if (updated.children) {
          const kernelFolder = updated.children.find(c => c.name === 'kernel');
          if (kernelFolder && kernelFolder.children) {
            kernelFolder.children.push(newFileNode);
          }
        }
      }
      return updated;
    });
  }, []);

  const deleteFileFromTree = useCallback((nodeId: string) => {
    setTreeData(prevTree => {
      const updated = JSON.parse(JSON.stringify(prevTree)) as TreeNode;
      const removeNode = (current: TreeNode): boolean => {
        if (!current.children) return false;
        const index = current.children.findIndex(c => c.id === nodeId);
        if (index >= 0) {
          current.children.splice(index, 1);
          return true;
        }
        for (const child of current.children) {
          if (child.type === 'folder' && removeNode(child)) {
            return true;
          }
        }
        return false;
      };
      removeNode(updated);
      return updated;
    });
  }, []);

  // Notifications state & dispatchers
  const [notifications, setNotifications] = useState<NotificationItem[]>([
    {
      id: 'notif-1',
      title: 'Hybrid Microkernel Active',
      message: 'x86_64 Long Mode loaded with 7 core subsystems and dual Linux/Windows personality engine.',
      type: 'success',
      timestamp: 'Just now',
      read: false,
      appId: 'health-hud'
    },
    {
      id: 'notif-2',
      title: 'Memory Allocator Initialized',
      message: 'PML4 root at 0x1000 with 16GB virtual address space mapped.',
      type: 'info',
      timestamp: '1m ago',
      read: false,
      appId: 'memory-debugger'
    }
  ]);

  const addNotification = useCallback((notif: Omit<NotificationItem, 'id' | 'timestamp' | 'read'>) => {
    const newNotif: NotificationItem = {
      id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      ...notif,
      timestamp: 'Just now',
      read: false
    };
    setNotifications(prev => [newNotif, ...prev.slice(0, 19)]);
    if (notif.type === 'error') {
      soundSystemService.play('threat_alert');
    } else {
      soundSystemService.play('receive_mail');
    }
  }, []);

  const dismissNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  const clearAllNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  // jb7572_2026-09-03: Resilient background operations notifications (Runs while workstation is locked)
  useEffect(() => {
    const unsub = backgroundJobService.onJobCompleted((job) => {
      addNotification({
        title: `Task Completed: ${job.name}`,
        message: job.currentStep || `Background operation completed successfully.`,
        type: 'success',
        appId: 'system-info'
      });
    });
    return () => unsub();
  }, [addNotification]);

  // jb7572_2026-08-27: Linux FreeDesktop.org Trash & 0-Loss Recycle Bin Engine State
  const [trashItems, setTrashItems] = useState<TrashItem[]>([
    {
      id: 'trash-legacy-sound-1',
      name: 'old_sound_driver_legacy.c',
      originalPath: 'home/projects/SecureCurtain/sys/subsystems/old_sound_driver_legacy.c',
      type: 'file',
      deletionDate: new Date(Date.now() - 3600000 * 4).toISOString(),
      sizeBytes: 4120,
      language: 'c',
      description: 'Deprecated SoundBlaster 16 legacy port I/O driver',
      content: `// SecureCurtain OS - old_sound_driver_legacy.c
#include <stdint.h>

void sb16_legacy_init(void) {
    // Legacy DSP reset (0x226)
    outb(0x226, 1);
    io_wait();
    outb(0x226, 0);
}`,
      trashInfo: {
        specVersion: 'FreeDesktop.org 1.0',
        path: '/home/projects/SecureCurtain/sys/subsystems/old_sound_driver_legacy.c',
        deletionDate: new Date(Date.now() - 3600000 * 4).toISOString(),
        permissions: '-rw-r--r--',
        mimeType: 'text/x-csrc',
        deletedBy: 'architect',
        hash: 'sha256:4a8b7c9e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c'
      }
    },
    {
      id: 'trash-deprecated-trace-2',
      name: 'debug_trace_deprecated.asm',
      originalPath: 'home/projects/SecureCurtain/sys/kernel/debug_trace_deprecated.asm',
      type: 'file',
      deletionDate: new Date(Date.now() - 3600000 * 12).toISOString(),
      sizeBytes: 1840,
      language: 'asm',
      description: 'Raw COM1 polling debug tracer replaced by Lockless Ring Buffer',
      content: `; SecureCurtain OS - debug_trace_deprecated.asm
[bits 64]
global debug_putc_raw
debug_putc_raw:
    mov dx, 0x3F8 + 5
.wait:
    in al, dx
    test al, 0x20
    jz .wait
    mov dx, 0x3F8
    mov al, dil
    out dx, al
    ret`,
      trashInfo: {
        specVersion: 'FreeDesktop.org 1.0',
        path: '/home/projects/SecureCurtain/sys/kernel/debug_trace_deprecated.asm',
        deletionDate: new Date(Date.now() - 3600000 * 12).toISOString(),
        permissions: '-rw-r--r--',
        mimeType: 'text/x-asm',
        deletedBy: 'architect',
        hash: 'sha256:7c9e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e'
      }
    }
  ]);

  // Melded canonical helper using unified findTreeNode
  const findNodeById = useCallback((root: TreeNode, id: string): TreeNode | null => {
    return findTreeNode(root, { query: id, by: 'id' });
  }, []);

  // Melded canonical helper using unified findTreeNode
  const findNodeByPath = useCallback((root: TreeNode, path: string): TreeNode | null => {
    return findTreeNode(root, { query: path, by: 'path' });
  }, []);

  // Move a file or folder from treeData to Linux FreeDesktop Trash with 0 loss of metadata
  const moveToTrash = useCallback((nodeOrId: string | TreeNode) => {
    let targetNode: TreeNode | null = null;
    if (typeof nodeOrId === 'string') {
      targetNode = findTreeNode(treeData, nodeOrId);
    } else {
      targetNode = nodeOrId;
    }

    if (!targetNode) return;

    // Calculate approximate size
    const contentLen = targetNode.content ? new Blob([targetNode.content]).size : 1024;
    const nowIso = new Date().toISOString();
    const ext = targetNode.name.split('.').pop()?.toLowerCase() || '';
    const mimeMap: Record<string, string> = {
      c: 'text/x-csrc',
      h: 'text/x-chdr',
      asm: 'text/x-asm',
      s: 'text/x-asm',
      py: 'text/x-python',
      sh: 'application/x-sh',
      txt: 'text/plain',
      json: 'application/json',
      md: 'text/markdown',
      iso: 'application/x-iso9660-image'
    };

    const newTrashItem: TrashItem = {
      id: `trash-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      name: targetNode.name,
      originalPath: targetNode.path,
      type: targetNode.type,
      deletionDate: nowIso,
      sizeBytes: contentLen,
      content: targetNode.content,
      language: targetNode.language || ext,
      description: targetNode.description,
      children: targetNode.children,
      trashInfo: {
        specVersion: 'FreeDesktop.org 1.0',
        path: targetNode.path.startsWith('/') ? targetNode.path : `/${targetNode.path}`,
        deletionDate: nowIso,
        permissions: targetNode.type === 'folder' ? 'drwxr-xr-x' : '-rw-r--r--',
        mimeType: mimeMap[ext] || (targetNode.type === 'folder' ? 'inode/directory' : 'application/octet-stream'),
        deletedBy: 'architect',
        hash: `sha256:${Math.random().toString(36).substring(2)}${Math.random().toString(36).substring(2)}`
      }
    };

    // Remove from active treeData
    deleteFileFromTree(targetNode.id);

    // Add to trash list
    setTrashItems(prev => [newTrashItem, ...prev]);

    soundSystemService.play('close_file');
    addNotification({
      title: 'Moved to Recycle Bin',
      message: `Preserved full path: /${targetNode.path} in Linux Trash`,
      type: 'info',
      appId: 'recycle-bin'
    });
  }, [treeData, findNodeById, findNodeByPath, deleteFileFromTree, addNotification]);

  // Restore an item from Trash back to its exact original path with 0 loss of filename or directory paths
  const restoreTrashItem = useCallback((trashId: string) => {
    const item = trashItems.find(t => t.id === trashId);
    if (!item) return;

    setTreeData(prevTree => {
      const updated = JSON.parse(JSON.stringify(prevTree)) as TreeNode;
      const cleanPath = item.originalPath.replace(/^\//, '');
      const pathParts = cleanPath.split('/');
      const fileName = pathParts[pathParts.length - 1];
      const parentDirParts = pathParts.slice(0, -1);

      let currentDir = updated;
      let accumulatedPath = '';

      for (let i = 0; i < parentDirParts.length; i++) {
        const part = parentDirParts[i];
        accumulatedPath = accumulatedPath ? `${accumulatedPath}/${part}` : part;

        if (!currentDir.children) currentDir.children = [];
        let nextDir = currentDir.children.find(c => c.name === part && c.type === 'folder');
        if (!nextDir) {
          nextDir = {
            id: `folder-${Date.now()}-${i}-${Math.random().toString(36).substr(2, 4)}`,
            name: part,
            type: 'folder',
            path: accumulatedPath,
            children: []
          };
          currentDir.children.push(nextDir);
        }
        currentDir = nextDir;
      }

      if (!currentDir.children) currentDir.children = [];
      const restoredNode: TreeNode = {
        id: item.id.replace(/^trash-/, 'restored-'),
        name: item.name,
        type: item.type,
        path: cleanPath,
        content: item.content,
        language: item.language,
        description: item.description,
        children: item.children,
        isCustom: true
      };

      const existingIdx = currentDir.children.findIndex(c => c.name === fileName);
      if (existingIdx >= 0) {
        currentDir.children[existingIdx] = restoredNode;
      } else {
        currentDir.children.push(restoredNode);
      }

      return updated;
    });

    setTrashItems(prev => prev.filter(t => t.id !== trashId));
    soundSystemService.play('command_success');
    addNotification({
      title: 'Restored from Recycle Bin',
      message: `Restored ${item.name} to exact original path: /${item.originalPath}`,
      type: 'success',
      appId: 'recycle-bin'
    });
  }, [trashItems, addNotification]);

  // Restore all items from Trash
  const restoreAllTrashItems = useCallback(() => {
    if (trashItems.length === 0) return;

    trashItems.forEach(item => {
      restoreTrashItem(item.id);
    });

    soundSystemService.play('command_success');
    addNotification({
      title: 'Recycle Bin Emptied to Original Paths',
      message: `Successfully restored ${trashItems.length} items to original directories`,
      type: 'success',
      appId: 'recycle-bin'
    });
  }, [trashItems, restoreTrashItem, addNotification]);

  // Empty Trash permanently
  const emptyTrash = useCallback(() => {
    const count = trashItems.length;
    setTrashItems([]);
    soundSystemService.play('threat_alert');
    addNotification({
      title: 'Recycle Bin Emptied',
      message: `Permanently purged ${count} items from ~/.local/share/Trash`,
      type: 'warning',
      appId: 'recycle-bin'
    });
  }, [trashItems.length, addNotification]);

  // Permanently delete single item
  const deletePermanently = useCallback((trashId: string) => {
    const item = trashItems.find(t => t.id === trashId);
    setTrashItems(prev => prev.filter(t => t.id !== trashId));
    soundSystemService.play('threat_alert');
    if (item) {
      addNotification({
        title: 'Permanently Deleted',
        message: `Purged ${item.name} from storage`,
        type: 'warning',
        appId: 'recycle-bin'
      });
    }
  }, [trashItems, addNotification]);

  // Desktop configuration state
  const [personality, setPersonality] = useState<OSPersonality>('hybrid');
  const [visualTheme, setVisualTheme] = useState<VisualTheme>('cyber-obsidian');
  const [iconTheme, setIconTheme] = useState<IconTheme>('neon-glow');
  const [wallpaper, setWallpaper] = useState<WallpaperTheme>('animated-grid');
  const [taskbarPosition, setTaskbarPosition] = useState<TaskbarPosition>('bottom');

  // Boot, Post-Spotlight, Login & Theater Curtains Stage Session State
  const [bootSessionState, setBootSessionState] = useState<'boot_spotlight' | 'oobe' | 'login' | 'theater_curtains' | 'desktop'>('boot_spotlight');
  const [loginWallpaperId, setLoginWallpaperId] = useState<string>('obsidian-stage-spotlight');

  const rebootOS = useCallback(() => {
    soundSystemService.play('hardware_error');
    setBootSessionState('boot_spotlight');
  }, []);

  const lockSession = useCallback(() => {
    soundSystemService.play('lock_screen');
    setBootSessionState('login');
  }, []);

  const replayCurtainsReveal = useCallback(() => {
    soundSystemService.play('splash_curtains');
    setBootSessionState('theater_curtains');
  }, []);

  const unlockToDesktop = useCallback(() => {
    soundSystemService.play('login_success');
    setBootSessionState('theater_curtains');
  }, []);

  const resetToOobe = useCallback(() => {
    soundSystemService.play('splash_curtains');
    if (typeof window !== 'undefined') {
      localStorage.removeItem('securecurtain_oobe_completed');
    }
    userManagementService.resetToFactoryFirstBoot();
    setBootSessionState('oobe');
  }, []);

  // Cartoon Screensaver State & Methods
  const [isScreensaverActive, setIsScreensaverActive] = useState<boolean>(false);
  
  // Default to 120 seconds (2 minutes), persisted in localStorage
  const [screensaverIdleTimeout, setScreensaverIdleTimeoutState] = useState<number>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('securecurtain_screensaver_idle_timeout');
      if (saved !== null) {
        const val = parseInt(saved, 10);
        if (!isNaN(val)) return val;
      }
    }
    return 120; // 2 minutes default
  });

  const [lockOnTimeout, setLockOnTimeoutState] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('securecurtain_screensaver_lock_on_timeout');
      if (saved !== null) return saved === 'true';
    }
    return true; // Default: lock screen when idle timeout triggers
  });

  const [screensaverOnLockHotkey, setScreensaverOnLockHotkeyState] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('securecurtain_screensaver_on_lock_hotkey');
      if (saved !== null) return saved === 'true';
    }
    return true; // Default: launch screensaver on Ctrl+L
  });

  const setScreensaverIdleTimeout = useCallback((seconds: number) => {
    setScreensaverIdleTimeoutState(seconds);
    if (typeof window !== 'undefined') {
      localStorage.setItem('securecurtain_screensaver_idle_timeout', seconds.toString());
    }
  }, []);

  const setLockOnTimeout = useCallback((lock: boolean) => {
    setLockOnTimeoutState(lock);
    if (typeof window !== 'undefined') {
      localStorage.setItem('securecurtain_screensaver_lock_on_timeout', lock ? 'true' : 'false');
    }
  }, []);

  const setScreensaverOnLockHotkey = useCallback((enable: boolean) => {
    setScreensaverOnLockHotkeyState(enable);
    if (typeof window !== 'undefined') {
      localStorage.setItem('securecurtain_screensaver_on_lock_hotkey', enable ? 'true' : 'false');
    }
  }, []);

  const lastActivityRef = useRef<number>(Date.now());
  const [idleSecondsRemaining, setIdleSecondsRemaining] = useState<number>(120);

  const [screenBrightness, setScreenBrightnessState] = useState<number>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('securecurtain_screen_brightness');
      if (saved !== null) {
        const val = parseInt(saved, 10);
        if (!isNaN(val)) return val;
      }
    }
    return 90; // 90% default brightness
  });

  const setScreenBrightness = useCallback((val: number) => {
    const clamped = Math.max(10, Math.min(100, val));
    setScreenBrightnessState(clamped);
    if (typeof window !== 'undefined') {
      localStorage.setItem('securecurtain_screen_brightness', clamped.toString());
    }
  }, []);

  const resetIdleTimer = useCallback(() => {
    lastActivityRef.current = Date.now();
    setIdleSecondsRemaining(screensaverIdleTimeout);
  }, [screensaverIdleTimeout]);

  const startScreensaver = useCallback(() => {
    soundSystemService.play('splash_curtains');
    setIsScreensaverActive(true);
  }, []);

  const stopScreensaver = useCallback(() => {
    lastActivityRef.current = Date.now();
    setIsScreensaverActive(false);
  }, []);

  // System Inactivity Tracker for Screensaver & Automatic Screen Locking
  useEffect(() => {
    const handleUserActivity = () => {
      lastActivityRef.current = Date.now();
    };

    const activityEvents = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'pointerdown', 'wheel', 'scroll'];
    activityEvents.forEach(evt => window.addEventListener(evt, handleUserActivity, { passive: true }));

    const intervalTimer = setInterval(() => {
      // If timeout is set to 0, automatic screensaver/lock is disabled
      if (screensaverIdleTimeout <= 0) {
        setIdleSecondsRemaining(0);
        return;
      }

      // If in initial boot splash, do not trigger
      if (bootSessionState === 'boot_spotlight') {
        lastActivityRef.current = Date.now();
        return;
      }

      // If screensaver is already running, skip countdown
      if (isScreensaverActive) {
        return;
      }

      const elapsedSec = Math.floor((Date.now() - lastActivityRef.current) / 1000);
      const remaining = Math.max(0, screensaverIdleTimeout - elapsedSec);
      setIdleSecondsRemaining(remaining);

      if (elapsedSec >= screensaverIdleTimeout) {
        // Idle timeout reached!
        if (lockOnTimeout && bootSessionState !== 'login') {
          soundSystemService.play('lock_screen');
          setBootSessionState('login');
        }
        soundSystemService.play('splash_curtains');
        setIsScreensaverActive(true);
      }
    }, 1000);

    return () => {
      activityEvents.forEach(evt => window.removeEventListener(evt, handleUserActivity));
      clearInterval(intervalTimer);
    };
  }, [screensaverIdleTimeout, lockOnTimeout, bootSessionState, isScreensaverActive]);
  
  // Dynamic App Catalog State
  const [appCatalog, setAppCatalog] = useState<Record<AppId, AppMetadata>>(APP_CATALOG);

  // Desktop Icons State
  const [desktopIcons, setDesktopIcons] = useState<DesktopIcon[]>(DEFAULT_DESKTOP_ICONS);

  // Multi-Dock & Taskbars State
  const [docks, setDocks] = useState<DockConfig[]>(DEFAULT_DOCKS);

  // Workspaces
  const [workspaces, setWorkspaces] = useState<Workspace[]>(DEFAULT_WORKSPACES);
  const [activeWorkspaceId, setActiveWorkspaceId] = useState<number>(1);
  
  // Windows state
  const [windows, setWindows] = useState<WindowItem[]>([
    {
      id: 'win-hud-default',
      appId: 'health-hud',
      title: 'Mission Control: Overview & Health HUD',
      iconName: 'Zap',
      position: { x: 60, y: 40 },
      size: { width: 1040, height: 680 },
      isMinimized: false,
      isMaximized: false,
      isPinned: false,
      zIndex: 10,
      workspaceId: 1,
      snapState: 'none'
    }
  ]);
  const [activeWindowId, setActiveWindowId] = useState<string | null>('win-hud-default');
  const [highestZIndex, setHighestZIndex] = useState<number>(11);

  // UI overlays
  const [isStartMenuOpen, setIsStartMenuOpen] = useState<boolean>(false);
  const [isQuickSettingsOpen, setIsQuickSettingsOpen] = useState<boolean>(false);
  const [isExposeOpen, setIsExposeOpen] = useState<boolean>(false);
  const [isAltTabOpen, setIsAltTabOpen] = useState<boolean>(false);

  const themeConfig = VISUAL_THEMES[visualTheme] || VISUAL_THEMES['cyber-obsidian'];

  // Bring a window to top
  const focusWindow = useCallback((id: string) => {
    setHighestZIndex(prev => {
      const nextZ = prev + 1;
      setWindows(prevWindows => 
        prevWindows.map(w => w.id === id ? { ...w, zIndex: nextZ, isMinimized: false } : w)
      );
      return nextZ;
    });
    setActiveWindowId(id);
    setIsStartMenuOpen(false);
    setIsQuickSettingsOpen(false);
  }, []);

  // App Catalog & Icon Metadata Update Handler
  const updateAppMetadata = useCallback((appId: AppId, updates: Partial<AppMetadata>) => {
    setAppCatalog(prev => {
      const existing = prev[appId];
      if (!existing) return prev;
      const updated = { ...existing, ...updates };
      return { ...prev, [appId]: updated };
    });

    // Automatically sync existing open windows with new title/icon
    setWindows(prev => prev.map(w => {
      if (w.appId === appId) {
        return {
          ...w,
          title: updates.title || (personality === 'linux' ? updates.linuxName : updates.windowsName) || w.title,
          iconName: updates.iconName || w.iconName
        };
      }
      return w;
    }));

    // Automatically sync desktop icons with new label/icon/badge
    setDesktopIcons(prev => prev.map(icon => {
      if (icon.appId === appId) {
        return {
          ...icon,
          label: updates.title || icon.label,
          iconName: updates.iconName || icon.iconName,
          badge: updates.badge !== undefined ? updates.badge : icon.badge
        };
      }
      return icon;
    }));
  }, [personality]);

  const getAppMetadata = useCallback((appId: AppId): AppMetadata => {
    return appCatalog[appId] || APP_CATALOG[appId];
  }, [appCatalog]);

  // Multi-Dock Management Handlers
  const addDock = useCallback((dockProps?: Partial<DockConfig>): DockConfig => {
    const newDock: DockConfig = {
      id: `dock-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      name: dockProps?.name || `Custom Dock ${docks.length + 1}`,
      enabled: dockProps?.enabled ?? true,
      placement: dockProps?.placement || 'bottom',
      alignment: dockProps?.alignment || 'center',
      thickness: dockProps?.thickness || 52,
      lengthPercent: dockProps?.lengthPercent || 70,
      iconSize: dockProps?.iconSize || 26,
      padding: dockProps?.padding || 6,
      borderRadius: dockProps?.borderRadius ?? 16,
      translucency: dockProps?.translucency || 'glass',
      showStartButton: dockProps?.showStartButton ?? false,
      showWorkspaces: dockProps?.showWorkspaces ?? false,
      showOpenTasks: dockProps?.showOpenTasks ?? true,
      showPinnedApps: dockProps?.showPinnedApps ?? true,
      showSystemTray: dockProps?.showSystemTray ?? false,
      showClock: dockProps?.showClock ?? false,
      showQuickSettings: dockProps?.showQuickSettings ?? false,
      pinnedAppIds: dockProps?.pinnedAppIds || ['terminal', 'file-explorer', 'health-hud', 'task-manager', 'theme-studio'],
      ...dockProps
    };
    setDocks(prev => [...prev, newDock]);
    return newDock;
  }, [docks.length]);

  const updateDock = useCallback((dockId: string, updates: Partial<DockConfig>) => {
    setDocks(prev => prev.map(d => d.id === dockId ? { ...d, ...updates } : d));
  }, []);

  const removeDock = useCallback((dockId: string) => {
    setDocks(prev => {
      if (prev.length <= 1) {
        return prev;
      }
      return prev.filter(d => d.id !== dockId);
    });
  }, []);

  const duplicateDock = useCallback((dockId: string) => {
    setDocks(prev => {
      const existing = prev.find(d => d.id === dockId);
      if (!existing) return prev;
      const duplicated: DockConfig = {
        ...existing,
        id: `dock-${Date.now()}`,
        name: `${existing.name} (Copy)`
      };
      return [...prev, duplicated];
    });
  }, []);

  const resetDocksToDefault = useCallback(() => {
    setDocks(DEFAULT_DOCKS);
  }, []);

  // Desktop Icon Box / Folder Localizer Engine Handlers
  const createIconFolder = useCallback((targetIconId: string, draggedIconId: string, customName?: string) => {
    if (targetIconId === draggedIconId) return;

    setDesktopIcons(prev => {
      const target = prev.find(i => i.id === targetIconId);
      const dragged = prev.find(i => i.id === draggedIconId);
      if (!target || !dragged) return prev;

      // Extract appIds from dragged
      const draggedApps: AppId[] = dragged.isFolder && dragged.folderAppIds 
        ? dragged.folderAppIds 
        : [dragged.appId];

      if (target.isFolder) {
        // Target is already a folder, merge dragged apps into it
        const currentApps = target.folderAppIds || [target.appId];
        const combined = Array.from(new Set([...currentApps, ...draggedApps]));
        
        return prev
          .filter(i => i.id !== draggedIconId)
          .map(i => i.id === targetIconId ? {
            ...i,
            folderAppIds: combined,
            badge: `${combined.length}`
          } : i);
      } else {
        // Both are single icons, create a new folder box at target's location
        const targetApps: AppId[] = [target.appId];
        const combined = Array.from(new Set([...targetApps, ...draggedApps]));
        
        // Smart folder naming
        let smartName = customName;
        if (!smartName) {
          const targetMeta = appCatalog[target.appId];
          const draggedMeta = appCatalog[dragged.appId];
          if (targetMeta && draggedMeta && targetMeta.category === draggedMeta.category) {
            const catNames: Record<string, string> = {
              core: 'Core Subsystems',
              system: 'System Utilities',
              dev: 'Dev & Kernel Tools',
              tools: 'OS Tools & Media'
            };
            smartName = catNames[targetMeta.category] || 'App Group';
          } else {
            smartName = `${target.label} & More`;
          }
        }

        const newFolderIcon: DesktopIcon = {
          id: `folder-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
          label: smartName,
          folderName: smartName,
          iconName: 'Folder',
          appId: target.appId,
          isFolder: true,
          folderAppIds: combined,
          badge: `${combined.length}`,
          x: target.x,
          y: target.y,
          category: target.category
        };

        return prev
          .filter(i => i.id !== targetIconId && i.id !== draggedIconId)
          .concat(newFolderIcon);
      }
    });
  }, [appCatalog]);

  const addAppToFolder = useCallback((folderId: string, appId: AppId) => {
    setDesktopIcons(prev => {
      const folder = prev.find(i => i.id === folderId);
      if (!folder || !folder.isFolder) return prev;
      
      const current = folder.folderAppIds || [folder.appId];
      if (current.includes(appId)) return prev;
      
      const updated = [...current, appId];
      return prev
        .filter(i => !(i.id !== folderId && !i.isFolder && i.appId === appId))
        .map(i => i.id === folderId ? {
          ...i,
          folderAppIds: updated,
          badge: `${updated.length}`
        } : i);
    });
  }, []);

  const removeAppFromFolder = useCallback((folderId: string, appId: AppId) => {
    setDesktopIcons(prev => {
      const folder = prev.find(i => i.id === folderId);
      if (!folder || !folder.isFolder) return prev;
      
      const current = folder.folderAppIds || [];
      const filtered = current.filter(id => id !== appId);
      
      const appMeta = appCatalog[appId] || APP_CATALOG[appId];
      const newStandaloneIcon: DesktopIcon = {
        id: `icon-${appId}-${Date.now()}`,
        label: appMeta?.title || appId,
        iconName: appMeta?.iconName || 'Zap',
        appId,
        x: folder.x + 100,
        y: folder.y,
        category: appMeta?.category || 'tools'
      };

      if (filtered.length <= 1) {
        if (filtered.length === 1) {
          const remainingAppId = filtered[0];
          const remainingMeta = appCatalog[remainingAppId] || APP_CATALOG[remainingAppId];
          const unwrapIcon: DesktopIcon = {
            id: `icon-${remainingAppId}-${Date.now()}`,
            label: remainingMeta?.title || remainingAppId,
            iconName: remainingMeta?.iconName || 'Zap',
            appId: remainingAppId,
            x: folder.x,
            y: folder.y,
            category: remainingMeta?.category || 'tools'
          };
          return prev.filter(i => i.id !== folderId).concat([unwrapIcon, newStandaloneIcon]);
        }
        return prev.filter(i => i.id !== folderId).concat(newStandaloneIcon);
      }

      return prev
        .map(i => i.id === folderId ? {
          ...i,
          folderAppIds: filtered,
          badge: `${filtered.length}`
        } : i)
        .concat(newStandaloneIcon);
    });
  }, [appCatalog]);

  const dissolveFolder = useCallback((folderId: string) => {
    setDesktopIcons(prev => {
      const folder = prev.find(i => i.id === folderId);
      if (!folder || !folder.isFolder) return prev;

      const appIds = folder.folderAppIds || [folder.appId];
      const newIcons: DesktopIcon[] = appIds.map((appId, index) => {
        const meta = appCatalog[appId] || APP_CATALOG[appId];
        return {
          id: `icon-${appId}-${Date.now()}-${index}`,
          label: meta?.title || appId,
          iconName: meta?.iconName || 'Zap',
          appId,
          x: folder.x + (index % 3) * 100,
          y: folder.y + Math.floor(index / 3) * 90,
          category: meta?.category || 'tools',
          badge: meta?.badge
        };
      });

      return prev.filter(i => i.id !== folderId).concat(newIcons);
    });
  }, [appCatalog]);

  const renameFolder = useCallback((folderId: string, newName: string) => {
    setDesktopIcons(prev => prev.map(i => i.id === folderId ? {
      ...i,
      label: newName,
      folderName: newName
    } : i));
  }, []);

  const setFolderColor = useCallback((folderId: string, color: string) => {
    setDesktopIcons(prev => prev.map(i => i.id === folderId ? {
      ...i,
      folderColor: color
    } : i));
  }, []);

  const autoGroupIconsByCategory = useCallback(() => {
    const coreApps: AppId[] = ['health-hud', 'watchdog-recovery', 'terminal', 'file-explorer'];
    const sysApps: AppId[] = ['task-manager', 'storage-mgmt', 'network-security', 'system-config', 'hardware-logs', 'package-features'];
    const devApps: AppId[] = ['memory-debugger', 'architect-studio', 'search-indexer'];
    const toolApps: AppId[] = ['theme-studio', 'notepad', 'iso-builder', 'guide', 'system-info'];

    const newFolders: DesktopIcon[] = [
      {
        id: 'folder-core',
        label: 'Core Subsystems',
        folderName: 'Core Subsystems',
        iconName: 'Zap',
        appId: 'health-hud',
        isFolder: true,
        folderAppIds: coreApps,
        folderColor: '#ec4899',
        badge: `${coreApps.length}`,
        x: 20,
        y: 20,
        category: 'core'
      },
      {
        id: 'folder-system',
        label: 'System & Hardware',
        folderName: 'System & Hardware',
        iconName: 'Settings',
        appId: 'system-config',
        isFolder: true,
        folderAppIds: sysApps,
        folderColor: '#3b82f6',
        badge: `${sysApps.length}`,
        x: 20,
        y: 120,
        category: 'system'
      },
      {
        id: 'folder-dev',
        label: 'Kernel & Dev Studio',
        folderName: 'Kernel & Dev Studio',
        iconName: 'Binary',
        appId: 'memory-debugger',
        isFolder: true,
        folderAppIds: devApps,
        folderColor: '#8b5cf6',
        badge: `${devApps.length}`,
        x: 20,
        y: 220,
        category: 'dev'
      },
      {
        id: 'folder-tools',
        label: 'OS Tools & Theme',
        folderName: 'OS Tools & Theme',
        iconName: 'Palette',
        appId: 'theme-studio',
        isFolder: true,
        folderAppIds: toolApps,
        folderColor: '#10b981',
        badge: `${toolApps.length}`,
        x: 20,
        y: 320,
        category: 'tools'
      }
    ];

    setDesktopIcons(newFolders);
  }, []);

  const ungroupAllFolders = useCallback(() => {
    setDesktopIcons(DEFAULT_DESKTOP_ICONS);
  }, []);

  // Check if an app is currently on the desktop canvas (standalone or inside a folder)
  const isAppOnDesktop = useCallback((appId: AppId): boolean => {
    return desktopIcons.some(icon => 
      (icon.appId === appId && !icon.isFolder) || 
      (icon.isFolder && icon.folderAppIds?.includes(appId))
    );
  }, [desktopIcons]);

  // Add an app icon shortcut to the desktop canvas
  const addDesktopIcon = useCallback((appId: AppId, customProps?: Partial<DesktopIcon>): boolean => {
    const meta = appCatalog[appId] || APP_CATALOG[appId];
    if (!meta) return false;

    // Check if already on desktop
    const existing = desktopIcons.find(icon => 
      (icon.appId === appId && !icon.isFolder) || 
      (icon.isFolder && icon.folderAppIds?.includes(appId))
    );

    if (existing) {
      soundSystemService.play('button_click');
      addNotification({
        title: 'Already on Desktop',
        message: `${meta.title} shortcut is already present on the desktop canvas.`,
        type: 'info',
        appId
      });
      return false;
    }

    // Determine smart grid coordinates (auto find next free slot)
    const occupiedCoords = new Set(desktopIcons.map(i => `${i.x},${i.y}`));
    let targetX = 24;
    let targetY = 24;
    const startX = 24;
    const startY = 24;
    const stepX = 100;
    const stepY = 90;
    const maxRows = 6;

    let found = false;
    for (let col = 0; col < 14; col++) {
      for (let row = 0; row < maxRows; row++) {
        const x = startX + col * stepX;
        const y = startY + row * stepY;
        if (!occupiedCoords.has(`${x},${y}`)) {
          targetX = x;
          targetY = y;
          found = true;
          break;
        }
      }
      if (found) break;
    }

    const newIcon: DesktopIcon = {
      id: `icon-${appId}-${Date.now()}`,
      label: personality === 'linux' ? meta.linuxName : personality === 'windows' ? meta.windowsName : meta.title,
      iconName: meta.iconName,
      appId,
      x: customProps?.x ?? targetX,
      y: customProps?.y ?? targetY,
      category: meta.category,
      badge: meta.badge,
      ...customProps
    };

    setDesktopIcons(prev => [...prev, newIcon]);
    soundSystemService.play('command_success');
    addNotification({
      title: 'Shortcut Added to Desktop',
      message: `Created desktop shortcut for ${meta.title}.`,
      type: 'success',
      appId
    });

    return true;
  }, [appCatalog, desktopIcons, personality, addNotification]);

  // Dismiss / Remove an icon or folder from the desktop canvas
  const removeDesktopIcon = useCallback((iconIdOrAppId: string): void => {
    setDesktopIcons(prev => {
      const target = prev.find(i => i.id === iconIdOrAppId || i.appId === iconIdOrAppId);
      if (!target) return prev;

      if (target.isPermanent) {
        soundSystemService.play('threat_alert');
        const meta = appCatalog[target.appId] || APP_CATALOG[target.appId];
        const displayName = target.isFolder ? (target.folderName || 'Folder Box') : (meta?.title || target.label);
        addNotification({
          title: 'Permanent System Icon',
          message: `${displayName} is a permanent core desktop anchor and cannot be removed.`,
          type: 'warning'
        });
        return prev;
      }

      soundSystemService.play('close_file');
      const meta = appCatalog[target.appId] || APP_CATALOG[target.appId];
      const displayName = target.isFolder ? (target.folderName || 'Folder Box') : (meta?.title || target.label);

      addNotification({
        title: 'Shortcut Dismissed',
        message: `Dismissed ${displayName} from desktop canvas.`,
        type: 'info'
      });

      return prev.filter(i => i.id !== target.id);
    });
  }, [appCatalog, addNotification]);

  // Toggle pinning an app to the primary taskbar dock
  const togglePinToTaskbar = useCallback((appId: AppId) => {
    setDocks(prev => {
      const mainDock = prev.find(d => d.placement === 'bottom' || d.placement === 'floating-bottom') || prev[0];
      if (!mainDock) return prev;

      const isPinned = mainDock.pinnedAppIds.includes(appId);
      const updatedPinned = isPinned
        ? mainDock.pinnedAppIds.filter(id => id !== appId)
        : [...mainDock.pinnedAppIds, appId];

      const meta = appCatalog[appId] || APP_CATALOG[appId];
      soundSystemService.play('button_click');
      addNotification({
        title: isPinned ? 'Unpinned from Taskbar' : 'Pinned to Taskbar',
        message: isPinned 
          ? `Removed ${meta?.title || appId} from taskbar dock.`
          : `Pinned ${meta?.title || appId} to taskbar for quick 1-click launch.`,
        type: 'info',
        appId
      });

      return prev.map(d => d.id === mainDock.id ? { ...d, pinnedAppIds: updatedPinned } : d);
    });
  }, [appCatalog, addNotification]);

  // Open an app (or restore if already open)
  const openApp = useCallback((appId: AppId, title?: string, customProps?: any): WindowItem => {
    const meta = appCatalog[appId] || APP_CATALOG[appId];
    
    // Check if an instance already exists in the current workspace or any workspace
    const existing = windows.find(w => w.appId === appId && (w.workspaceId === activeWorkspaceId || w.isPinned));
    if (existing) {
      setWindows(prev => prev.map(w => {
        if (w.id === existing.id) {
          return {
            ...w,
            isMinimized: false,
            customProps: customProps ? { ...w.customProps, ...customProps } : w.customProps
          };
        }
        return w;
      }));
      focusWindow(existing.id);
      return existing;
    }

    const nextZ = highestZIndex + 1;
    setHighestZIndex(nextZ);

    const windowTitle = title || (
      personality === 'linux' ? meta.linuxName : 
      personality === 'windows' ? meta.windowsName : 
      meta.title
    );

    // Stagger placement
    const offset = (windows.length % 6) * 30;
    const initialPos = {
      x: Math.min(window.innerWidth - meta.defaultSize.width - 40, Math.max(40, meta.defaultPos.x + offset)),
      y: Math.min(window.innerHeight - meta.defaultSize.height - 80, Math.max(30, meta.defaultPos.y + offset))
    };

    const newWindow: WindowItem = {
      id: `win-${appId}-${Date.now()}`,
      appId,
      title: windowTitle,
      iconName: meta.iconName,
      position: initialPos,
      size: { ...meta.defaultSize },
      isMinimized: false,
      isMaximized: false,
      isPinned: false,
      zIndex: nextZ,
      workspaceId: activeWorkspaceId,
      snapState: 'none',
      customProps
    };

    setWindows(prev => [...prev, newWindow]);
    setActiveWindowId(newWindow.id);
    setIsStartMenuOpen(false);
    setIsExposeOpen(false);
    soundSystemService.play('open_file');

    return newWindow;
  }, [appCatalog, windows, activeWorkspaceId, highestZIndex, personality, focusWindow]);

  // Close window
  const closeWindow = useCallback((id: string) => {
    setWindows(prev => prev.filter(w => w.id !== id));
    soundSystemService.play('close_file');
    if (activeWindowId === id) {
      // Focus next top window in current workspace
      const remaining = windows.filter(w => w.id !== id && (w.workspaceId === activeWorkspaceId || w.isPinned) && !w.isMinimized);
      if (remaining.length > 0) {
        const top = remaining.reduce((prev, curr) => curr.zIndex > prev.zIndex ? curr : prev, remaining[0]);
        setActiveWindowId(top.id);
      } else {
        setActiveWindowId(null);
      }
    }
  }, [windows, activeWindowId, activeWorkspaceId]);

  // Minimize window
  const minimizeWindow = useCallback((id: string) => {
    setWindows(prev => prev.map(w => w.id === id ? { ...w, isMinimized: true } : w));
    if (activeWindowId === id) {
      const remaining = windows.filter(w => w.id !== id && (w.workspaceId === activeWorkspaceId || w.isPinned) && !w.isMinimized);
      if (remaining.length > 0) {
        const top = remaining.reduce((prev, curr) => curr.zIndex > prev.zIndex ? curr : prev, remaining[0]);
        setActiveWindowId(top.id);
      } else {
        setActiveWindowId(null);
      }
    }
  }, [windows, activeWindowId, activeWorkspaceId]);

  // Maximize / Toggle maximize
  const maximizeWindow = useCallback((id: string) => {
    setWindows(prev => prev.map(w => {
      if (w.id !== id) return w;
      if (w.isMaximized) {
        // Restore
        return {
          ...w,
          isMaximized: false,
          snapState: 'none',
          position: w.prevRect ? { x: w.prevRect.x, y: w.prevRect.y } : w.position,
          size: w.prevRect ? { width: w.prevRect.width, height: w.prevRect.height } : w.size
        };
      } else {
        // Maximize
        return {
          ...w,
          prevRect: { ...w.position, ...w.size },
          isMaximized: true,
          snapState: 'none'
        };
      }
    }));
    focusWindow(id);
  }, [focusWindow]);

  // Restore window from minimized or snapped
  const restoreWindow = useCallback((id: string) => {
    setWindows(prev => prev.map(w => {
      if (w.id !== id) return w;
      return {
        ...w,
        isMinimized: false,
        isMaximized: false,
        snapState: 'none',
        position: w.prevRect ? { x: w.prevRect.x, y: w.prevRect.y } : w.position,
        size: w.prevRect ? { width: w.prevRect.width, height: w.prevRect.height } : w.size
      };
    }));
    focusWindow(id);
  }, [focusWindow]);

  // Snap Window to Left/Right/Quadrants
  const snapWindow = useCallback((id: string, snapState: SnapState) => {
    setWindows(prev => prev.map(w => {
      if (w.id !== id) return w;
      const prevRect = w.prevRect || { ...w.position, ...w.size };
      return {
        ...w,
        prevRect,
        isMaximized: false,
        snapState,
        isMinimized: false
      };
    }));
    focusWindow(id);
  }, [focusWindow]);

  // Move window
  const moveWindow = useCallback((id: string, pos: { x: number; y: number }) => {
    setWindows(prev => prev.map(w => {
      if (w.id !== id) return w;
      return {
        ...w,
        position: pos,
        snapState: 'none',
        isMaximized: false
      };
    }));
  }, []);

  // Resize window
  const resizeWindow = useCallback((id: string, size: { width: number; height: number }, pos?: { x: number; y: number }) => {
    setWindows(prev => prev.map(w => {
      if (w.id !== id) return w;
      return {
        ...w,
        size,
        ...(pos ? { position: pos } : {}),
        snapState: 'none',
        isMaximized: false
      };
    }));
  }, []);

  // Toggle Pin on Top / Across Workspaces
  const togglePinWindow = useCallback((id: string) => {
    setWindows(prev => prev.map(w => w.id === id ? { ...w, isPinned: !w.isPinned } : w));
  }, []);

  // Move window to specific workspace
  const moveWindowToWorkspace = useCallback((id: string, workspaceId: number) => {
    setWindows(prev => prev.map(w => w.id === id ? { ...w, workspaceId } : w));
  }, []);

  // Switch Active Workspace
  const switchWorkspace = useCallback((workspaceId: number) => {
    setActiveWorkspaceId(workspaceId);
    setIsExposeOpen(false);
    
    // Focus top window in the newly selected workspace
    const workspaceWindows = windows.filter(w => (w.workspaceId === workspaceId || w.isPinned) && !w.isMinimized);
    if (workspaceWindows.length > 0) {
      const top = workspaceWindows.reduce((prev, curr) => curr.zIndex > prev.zIndex ? curr : prev, workspaceWindows[0]);
      setActiveWindowId(top.id);
    } else {
      setActiveWindowId(null);
    }
  }, [windows]);

  // Add new workspace
  const addWorkspace = useCallback((name?: string) => {
    setWorkspaces(prev => {
      const nextId = prev.length + 1;
      const newWs: Workspace = {
        id: nextId,
        name: name || `Workspace ${nextId}: Custom`,
        description: 'User workspace container',
        iconName: 'Layers',
        accentColor: '#38bdf8'
      };
      return [...prev, newWs];
    });
  }, []);

  // Minimize all windows (Show Desktop)
  const minimizeAllWindows = useCallback(() => {
    setWindows(prev => prev.map(w => w.workspaceId === activeWorkspaceId ? { ...w, isMinimized: true } : w));
    setActiveWindowId(null);
    setIsStartMenuOpen(false);
    setIsQuickSettingsOpen(false);
  }, [activeWorkspaceId]);

  // UI Toggles
  const toggleStartMenu = useCallback((force?: boolean) => {
    setIsStartMenuOpen(prev => {
      const next = force !== undefined ? force : !prev;
      if (next) {
        setIsQuickSettingsOpen(false);
        setIsExposeOpen(false);
      }
      return next;
    });
  }, []);

  const toggleQuickSettings = useCallback((force?: boolean) => {
    setIsQuickSettingsOpen(prev => {
      const next = force !== undefined ? force : !prev;
      if (next) {
        setIsStartMenuOpen(false);
        setIsExposeOpen(false);
      }
      return next;
    });
  }, []);

  const toggleExpose = useCallback((force?: boolean) => {
    setIsExposeOpen(prev => {
      const next = force !== undefined ? force : !prev;
      if (next) {
        setIsStartMenuOpen(false);
        setIsQuickSettingsOpen(false);
      }
      return next;
    });
  }, []);

  const toggleAltTab = useCallback((force?: boolean) => {
    setIsAltTabOpen(prev => force !== undefined ? force : !prev);
  }, []);

  // Global Keyboard shortcuts (Alt+Tab, Super/Meta for start menu, Super+Tab for Exposé)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Escape closes flyouts
      if (e.key === 'Escape') {
        setIsStartMenuOpen(false);
        setIsQuickSettingsOpen(false);
        setIsExposeOpen(false);
        setIsAltTabOpen(false);
      }

      // Alt + Tab
      if (e.altKey && e.key === 'Tab') {
        e.preventDefault();
        setIsAltTabOpen(prev => !prev);
      }

      // If workstation is locked, prevent unauthorized desktop hotkeys from opening apps
      if (bootSessionState === 'login') {
        return;
      }

      // Super / Win / Meta + D (Minimize all)
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'd') {
        e.preventDefault();
        minimizeAllWindows();
      }

      // Super + E (Open File Explorer)
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'e') {
        e.preventDefault();
        openApp('file-explorer');
      }

      // Ctrl + Alt + T (Open Terminal)
      if (e.ctrlKey && e.altKey && e.key.toLowerCase() === 't') {
        e.preventDefault();
        openApp('terminal');
      }

      // Ctrl + L or Super + L or Ctrl + Alt + L (Lock Screen & Screensaver)
      if (
        ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'l') ||
        (e.ctrlKey && e.altKey && e.key.toLowerCase() === 'l')
      ) {
        e.preventDefault();
        e.stopPropagation();
        lockSession();
        if (screensaverOnLockHotkey) {
          startScreensaver();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [minimizeAllWindows, openApp, lockSession, screensaverOnLockHotkey, startScreensaver]);

  const unreadNotificationsCount = notifications.filter(n => !n.read).length;

  return (
    <DesktopContext.Provider
      value={{
        windows,
        activeWindowId,
        workspaces,
        activeWorkspaceId,
        personality,
        visualTheme,
        themeConfig,
        iconTheme,
        wallpaper,
        taskbarPosition,
        isStartMenuOpen,
        isQuickSettingsOpen,
        isExposeOpen,
        isAltTabOpen,
        notifications,
        unreadNotificationsCount,

        // Multi-Dock & Taskbar System
        docks,
        addDock,
        updateDock,
        removeDock,
        duplicateDock,
        resetDocksToDefault,

        // Dynamic Reactive App Catalog & Icon Metadata Sync
        appCatalog,
        updateAppMetadata,
        getAppMetadata,

        // Desktop Icons & Folder Box Engine
        desktopIcons,
        setDesktopIcons,
        addDesktopIcon,
        removeDesktopIcon,
        isAppOnDesktop,
        togglePinToTaskbar,
        createIconFolder,
        addAppToFolder,
        removeAppFromFolder,
        dissolveFolder,
        renameFolder,
        setFolderColor,
        autoGroupIconsByCategory,
        ungroupAllFolders,

        treeData,
        placeFileInTree,
        deleteFileFromTree,

        // Linux FreeDesktop Trash Engine
        trashItems,
        moveToTrash,
        restoreTrashItem,
        restoreAllTrashItems,
        emptyTrash,
        deletePermanently,

        openApp,
        closeWindow,
        minimizeWindow,
        maximizeWindow,
        restoreWindow,
        snapWindow,
        focusWindow,
        moveWindow,
        resizeWindow,
        togglePinWindow,
        moveWindowToWorkspace,
        switchWorkspace,
        addWorkspace,
        minimizeAllWindows,

        setPersonality,
        setVisualTheme,
        setIconTheme,
        setWallpaper,
        setTaskbarPosition,

        toggleStartMenu,
        toggleQuickSettings,
        toggleExpose,
        toggleAltTab,

        addNotification,
        dismissNotification,
        clearAllNotifications,

        // Boot, Post-Spotlight, Login & Theater Curtains Stage Engine
        bootSessionState,
        setBootSessionState,
        loginWallpaperId,
        setLoginWallpaperId,
        rebootOS,
        lockSession,
        replayCurtainsReveal,
        unlockToDesktop,
        resetToOobe,

        // Cartoon Screensaver Engine
        isScreensaverActive,
        startScreensaver,
        stopScreensaver,
        screensaverIdleTimeout,
        setScreensaverIdleTimeout,
        lockOnTimeout,
        setLockOnTimeout,
        screensaverOnLockHotkey,
        setScreensaverOnLockHotkey,
        idleSecondsRemaining,
        resetIdleTimer,
        screenBrightness,
        setScreenBrightness
      }}
    >
      {children}
    </DesktopContext.Provider>
  );
};

export const useDesktop = () => {
  const context = useContext(DesktopContext);
  if (!context) {
    throw new Error('useDesktop must be used within a DesktopProvider');
  }
  return context;
};
