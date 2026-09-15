// jb7572_2026-08-25: Master Desktop Environment & Window Management Container

import React, { useState, useEffect } from 'react';
import { useDesktop } from '../../context/DesktopContext';
import { DEFAULT_DESKTOP_ICONS } from '../../data/desktopThemes';
import { DesktopIconRenderer } from './DesktopIconRenderer';
import { DesktopFolderBoxItem } from './DesktopFolderBoxItem';
import { DesktopFolderBoxModal } from './DesktopFolderBoxModal';
import { DesktopWallpaper } from './DesktopWallpaper';
import { DesktopWindow } from './DesktopWindow';
import { DesktopDock } from './DesktopDock';
import { StartMenu } from './StartMenu';
import { QuickSettingsFlyout } from './QuickSettingsFlyout';
import { ExposeOverview } from './ExposeOverview';
import { AltTabSwitcher } from './AltTabSwitcher';
import { DesktopContextMenu } from './DesktopContextMenu';
import { DesktopIconContextMenu } from './DesktopIconContextMenu';
import { PostSpotlightBootSplash } from './PostSpotlightBootSplash';
import { CustomizableLoginScreen } from './CustomizableLoginScreen';
import { TheaterCurtainsRevealSplash } from './TheaterCurtainsRevealSplash';
import { TuxScreensaverOverlay } from './screensaver/TuxScreensaverOverlay';
import { OsInstallerApp } from './apps/OsInstallerApp';
import { AppId, DesktopIcon } from '../../types/desktop';
import { 
  Terminal, 
  Cpu, 
  Layers, 
  FolderTree, 
  Activity, 
  Zap, 
  Sparkles,
  Maximize2,
  UploadCloud,
  FileCode2,
  Lock,
  Tv,
  Crown,
  RotateCcw,
  Radio
} from 'lucide-react';
import { BackgroundOperationsWidget } from './BackgroundOperationsWidget';
import { backgroundJobService } from '../../services/backgroundJobService';

export const DesktopEnvironment: React.FC = () => {
  const { 
    windows, 
    activeWorkspaceId, 
    openApp, 
    toggleStartMenu, 
    toggleQuickSettings, 
    personality, 
    themeConfig,
    taskbarPosition,
    addNotification,
    docks,
    desktopIcons,
    appCatalog,
    removeDesktopIcon,
    createIconFolder,
    bootSessionState,
    setBootSessionState,
    loginWallpaperId,
    setLoginWallpaperId,
    rebootOS,
    lockSession,
    replayCurtainsReveal,
    unlockToDesktop,
    resetToOobe,
    isScreensaverActive,
    startScreensaver,
    stopScreensaver,
    screensaverOnLockHotkey,
    screenBrightness
  } = useDesktop();

  const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null);
  const [iconContextMenu, setIconContextMenu] = useState<{ x: number; y: number; icon: DesktopIcon } | null>(null);
  const [selectedIconId, setSelectedIconId] = useState<string | null>(null);
  const [activeFolderModal, setActiveFolderModal] = useState<DesktopIcon | null>(null);
  const [isDraggingFileOverDesktop, setIsDraggingFileOverDesktop] = useState(false);

  // Icon Drag & Drop Merging (Android Localizer) State
  const [draggedIconId, setDraggedIconId] = useState<string | null>(null);
  const [dragOverTargetId, setDragOverTargetId] = useState<string | null>(null);
  const [showOperationsWidget, setShowOperationsWidget] = useState<boolean>(false);
  const [activeJobsCount, setActiveJobsCount] = useState<number>(() => backgroundJobService.getActiveJobs().length);

  useEffect(() => {
    const unsub = backgroundJobService.subscribe(jobs => {
      setActiveJobsCount(jobs.filter(j => j.status === 'RUNNING').length);
    });
    return () => unsub();
  }, []);

  // Listen for Delete / Backspace key when an icon is selected on the desktop
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedIconId) {
        // Only if target is not an input/textarea
        const tag = (e.target as HTMLElement)?.tagName?.toLowerCase();
        if (tag !== 'input' && tag !== 'textarea') {
          e.preventDefault();
          removeDesktopIcon(selectedIconId);
          setSelectedIconId(null);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedIconId, removeDesktopIcon]);

  // Listen for CLI or system triggers to launch the screensaver or lock screen
  useEffect(() => {
    const handleLaunchScreensaver = () => {
      startScreensaver();
    };
    const handleLockSessionEvent = () => {
      lockSession();
      startScreensaver();
    };
    window.addEventListener('launch-screensaver', handleLaunchScreensaver);
    window.addEventListener('lock-session-event', handleLockSessionEvent);
    return () => {
      window.removeEventListener('launch-screensaver', handleLaunchScreensaver);
      window.removeEventListener('lock-session-event', handleLockSessionEvent);
    };
  }, [startScreensaver, lockSession]);

  // Desktop right-click context menu handler
  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    setIconContextMenu(null);
    setContextMenu({ x: e.clientX, y: e.clientY });
  };

  // Close context menu and flyouts when clicking empty desktop
  const handleDesktopClick = () => {
    if (contextMenu) setContextMenu(null);
    if (iconContextMenu) setIconContextMenu(null);
    setSelectedIconId(null);
    toggleStartMenu(false);
    toggleQuickSettings(false);
  };

  const handleIconDoubleClick = (icon: DesktopIcon) => {
    if (icon.id === 'icon-launchpad') {
      openApp('health-hud', 'Mission Control: Apps Launchpad', { initialCategory: 'LAUNCHPAD' });
    } else if (icon.id === 'icon-drag-drop-installer') {
      openApp('package-features', 'Drag & Drop Package Installer', { initialTab: 'DRAG_DROP_INSTALLER' });
    } else {
      openApp(icon.appId);
    }
    setSelectedIconId(null);
  };

  // Drag & Drop Icon-on-Icon Combining (Android-style localizer)
  const handleIconDragStart = (e: React.DragEvent, icon: DesktopIcon) => {
    setDraggedIconId(icon.id);
    e.dataTransfer.setData('text/plain', icon.id);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleIconDragOverTarget = (e: React.DragEvent, targetIcon: DesktopIcon) => {
    if (draggedIconId && draggedIconId !== targetIcon.id) {
      e.preventDefault();
      e.stopPropagation();
      e.dataTransfer.dropEffect = 'move';
      if (dragOverTargetId !== targetIcon.id) {
        setDragOverTargetId(targetIcon.id);
      }
    }
  };

  const handleIconDragLeaveTarget = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOverTargetId(null);
  };

  const handleIconDropOnTarget = (e: React.DragEvent, targetIcon: DesktopIcon) => {
    e.preventDefault();
    e.stopPropagation();
    const sourceIconId = e.dataTransfer.getData('text/plain') || draggedIconId;
    
    if (sourceIconId && sourceIconId !== targetIcon.id) {
      createIconFolder(targetIcon.id, sourceIconId);
      const targetName = targetIcon.folderName || targetIcon.label;
      addNotification({
        title: targetIcon.isFolder ? 'Added to Folder' : 'Created App Folder Box',
        message: targetIcon.isFolder 
          ? `Added application into '${targetName}'.` 
          : `Grouped into a new Android-style Folder Box on desktop.`,
        type: 'success'
      });
    }

    setDraggedIconId(null);
    setDragOverTargetId(null);
  };

  // Drag-and-Drop file handling onto desktop
  const handleDesktopDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.types && Array.from(e.dataTransfer.types).includes('Files')) {
      setIsDraggingFileOverDesktop(true);
    }
  };

  const handleDesktopDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingFileOverDesktop(false);
  };

  const handleDesktopDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingFileOverDesktop(false);
    setDraggedIconId(null);
    setDragOverTargetId(null);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      const ext = file.name.split('.').pop()?.toLowerCase();
      const isPkg = ['deb', 'rpm', 'msi', 'exe', 'appimage', 'pkg', 'zip', 'tar', 'gz', 'iso'].includes(ext || '');

      if (isPkg) {
        openApp('package-features', `Package Installer: ${file.name}`, {
          initialTab: 'DRAG_DROP_INSTALLER',
          droppedFileName: file.name,
          droppedFileSize: file.size
        });
        addNotification({
          title: 'Package Dropped on Desktop',
          message: `Loaded binary package ${file.name} (${(file.size / 1024).toFixed(1)} KB) into Drag & Drop Installer.`,
          type: 'success',
          appId: 'package-features'
        });
      } else {
        const reader = new FileReader();
        reader.onload = (event) => {
          const fileContent = event.target?.result as string;
          openApp('architect-studio', `Installer: ${file.name}`, {
            filename: file.name,
            code: fileContent
          });
          addNotification({
            title: 'File Dropped on Desktop',
            message: `Loaded ${file.name} into Code Analyzer & Installer for placement into /SecureCurtain/sys`,
            type: 'info',
            appId: 'architect-studio'
          });
        };
        reader.readAsText(file);
      }
    }
  };

  // Visible windows for the active workspace (or sticky pinned windows)
  const visibleWindows = windows.filter(
    w => w.workspaceId === activeWorkspaceId || w.isPinned
  );

  // Sync active folder modal data if desktopIcons update
  const currentModalFolder = activeFolderModal 
    ? desktopIcons.find(i => i.id === activeFolderModal.id) || null
    : null;

  // If in Post-POST Boot Spotlight Phase:
  if (bootSessionState === 'boot_spotlight') {
    return (
      <PostSpotlightBootSplash
        onComplete={() => {
          const isOobe = typeof window !== 'undefined' && localStorage.getItem('securecurtain_oobe_completed') !== 'true';
          if (isOobe) {
            setBootSessionState('oobe');
          } else {
            setBootSessionState('login');
          }
        }}
      />
    );
  }

  return (
    <div
      onContextMenu={handleContextMenu}
      onClick={handleDesktopClick}
      onDragOver={handleDesktopDragOver}
      onDragLeave={handleDesktopDragLeave}
      onDrop={handleDesktopDrop}
      className="relative w-full h-screen overflow-hidden flex flex-col font-sans select-none bg-[#07080c] text-white transition-[filter] duration-150"
      style={{
        filter: `brightness(${Math.max(0.1, screenBrightness / 100)})`
      }}
    >
      {/* Grand Theater Curtains Parting Splash Overlay */}
      {bootSessionState === 'theater_curtains' && (
        <TheaterCurtainsRevealSplash onRevealComplete={() => setBootSessionState('desktop')} />
      )}

      {/* OOBE First-Boot Commissioning Wizard Overlay */}
      {bootSessionState === 'oobe' && (
        <div className="fixed inset-0 z-[9992] w-full h-screen overflow-hidden pointer-events-auto select-none bg-[#07090e]">
          <OsInstallerApp
            isOobeMode={true}
            onOobeComplete={() => {
              unlockToDesktop();
            }}
            onSkipToLogin={() => {
              setBootSessionState('login');
            }}
          />
        </div>
      )}

      {/* Drag & Drop File Overlay */}
      {isDraggingFileOverDesktop && (
        <div className="absolute inset-0 z-50 bg-[#0c0d18]/85 backdrop-blur-md border-4 border-dashed border-[#c4b5fd] m-4 rounded-3xl flex flex-col items-center justify-center text-center pointer-events-none animate-in fade-in zoom-in-95 duration-200">
          <div className="w-20 h-20 rounded-full bg-[#1b1c32] border border-[#434674] flex items-center justify-center text-[#c4b5fd] shadow-2xl mb-4 animate-bounce">
            <UploadCloud className="w-10 h-10" />
          </div>
          <h2 className="text-xl font-bold text-white tracking-wide">
            Drop File to Install into <span className="font-mono text-[#c4b5fd]">SecureCurtain / sys</span>
          </h2>
          <p className="text-sm text-[#94a3b8] mt-2 max-w-md">
            Source code, assembly, headers, or module archives will automatically open in the Code Analyzer & Installer.
          </p>
        </div>
      )}

      {/* 1. Dynamic Themed Wallpaper */}
      <DesktopWallpaper />

      {/* 2. Top Header / Status Strip (When Taskbar is bottom or floating) */}
      <div className="absolute top-2 left-4 right-4 z-10 flex items-center justify-between pointer-events-none">
        <div className="flex items-center gap-2 pointer-events-auto bg-black/40 backdrop-blur-md px-3 py-1 rounded-full border border-white/10 text-[11px] font-mono text-white/80 shadow-md">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="font-bold tracking-wide text-[#c4b5fd]">SecureCurtain / sys</span>
          <span className="text-white/40">|</span>
          <span className="capitalize text-purple-300 font-semibold">{personality} Persona</span>
          <span className="text-white/40">|</span>
          <span className="text-[#94a3b8]">Workspace {activeWorkspaceId}</span>
        </div>

        {/* Quick Stage Controls (Curtains Replay / Lock / Reboot / Screensaver) */}
        <div className="flex items-center gap-1.5 pointer-events-auto bg-black/40 backdrop-blur-md px-2 py-0.5 rounded-full border border-white/10 text-[11px] font-mono shadow-md">
          {/* Active Background Operations Monitor (Downloads, Copies, Scans) */}
          <button
            onClick={() => setShowOperationsWidget(prev => !prev)}
            title="Active Background Operations (Downloads, Copies, Anti-Malware Scans)"
            className="px-2 py-0.5 rounded-full hover:bg-cyan-500/20 text-cyan-300 flex items-center gap-1 transition-all border border-cyan-500/30 bg-cyan-950/40"
          >
            <Radio className="w-3 h-3 text-cyan-400 animate-pulse" />
            <span className="hidden sm:inline text-[10px] font-bold">{activeJobsCount} Tasks</span>
          </button>

          <button
            onClick={startScreensaver}
            title="Launch Tux & Windows Butterfly Screensaver"
            className="px-2 py-0.5 rounded-full hover:bg-emerald-500/20 text-emerald-300 flex items-center gap-1 transition-all"
          >
            <Sparkles className="w-3 h-3 text-emerald-400" />
            <span className="hidden sm:inline text-[10px]">Screensaver</span>
          </button>

          <button
            onClick={replayCurtainsReveal}
            title="Replay Theater Curtains Grand Entrance"
            className="px-2 py-0.5 rounded-full hover:bg-amber-500/20 text-amber-300 flex items-center gap-1 transition-all"
          >
            <Crown className="w-3 h-3 text-amber-400" />
            <span className="hidden sm:inline text-[10px]">Curtains</span>
          </button>

          <button
            onClick={() => {
              lockSession();
              if (screensaverOnLockHotkey) {
                startScreensaver();
              }
            }}
            title="Lock Desktop Workstation (Hotkey: Ctrl + L)"
            className="px-2 py-0.5 rounded-full hover:bg-purple-500/20 text-purple-300 flex items-center gap-1 transition-all"
          >
            <Lock className="w-3 h-3 text-purple-400" />
            <span className="hidden sm:inline text-[10px]">Lock (Ctrl+L)</span>
          </button>

          <button
            onClick={rebootOS}
            title="Reboot into Hardware Boot Spotlight"
            className="px-2 py-0.5 rounded-full hover:bg-cyan-500/20 text-cyan-300 flex items-center gap-1 transition-all"
          >
            <Tv className="w-3 h-3 text-cyan-400" />
            <span className="hidden sm:inline text-[10px]">Boot Splash</span>
          </button>
        </div>
      </div>

      {/* 3. Interactive Desktop Canvas & Grid of Desktop Icons / Folder Boxes */}
      <div className="relative flex-1 p-6 z-10 overflow-hidden">
        {/* Desktop Icons Container */}
        <div className="absolute inset-0 p-6 pointer-events-auto grid grid-flow-col grid-rows-6 auto-cols-max gap-4 z-0 w-fit">
          {desktopIcons.map((icon) => {
            const isSelected = selectedIconId === icon.id;
            const isDragTarget = dragOverTargetId === icon.id;

            // Render as an Android-Style Folder Box
            if (icon.isFolder) {
              return (
                <DesktopFolderBoxItem
                  key={icon.id}
                  folder={icon}
                  isSelected={isSelected}
                  isDragTarget={isDragTarget}
                  onSelect={() => setSelectedIconId(icon.id)}
                  onOpen={() => setActiveFolderModal(icon)}
                  onContextMenu={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setContextMenu(null);
                    setIconContextMenu({ x: e.clientX, y: e.clientY, icon });
                  }}
                  onDragStart={handleIconDragStart}
                  onDragOverTarget={handleIconDragOverTarget}
                  onDragLeaveTarget={handleIconDragLeaveTarget}
                  onDropOnTarget={handleIconDropOnTarget}
                />
              );
            }

            // Render as a Standard Standalone Desktop Icon
            const meta = appCatalog[icon.appId];
            const currentIconName = meta?.iconName || icon.iconName;
            const currentLabel = meta ? (
              personality === 'linux' ? meta.linuxName :
              personality === 'windows' ? meta.windowsName :
              meta.title
            ) : icon.label;

            return (
              <div
                key={icon.id}
                draggable
                onDragStart={(e) => handleIconDragStart(e, icon)}
                onDragOver={(e) => handleIconDragOverTarget(e, icon)}
                onDragLeave={handleIconDragLeaveTarget}
                onDrop={(e) => handleIconDropOnTarget(e, icon)}
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedIconId(icon.id);
                }}
                onDoubleClick={(e) => {
                  e.stopPropagation();
                  handleIconDoubleClick(icon);
                }}
                onContextMenu={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setContextMenu(null);
                  setSelectedIconId(icon.id);
                  setIconContextMenu({ x: e.clientX, y: e.clientY, icon });
                }}
                className={`w-24 p-2 rounded-2xl flex flex-col items-center text-center cursor-pointer transition-all duration-200 relative group select-none ${
                  isDragTarget
                    ? 'scale-110 ring-4 ring-purple-400 bg-purple-500/30 shadow-[0_0_24px_rgba(168,85,247,0.6)] animate-pulse'
                    : isSelected
                    ? 'bg-white/20 backdrop-blur-md ring-2 ring-purple-400 shadow-xl'
                    : 'hover:bg-white/10 hover:backdrop-blur-sm'
                }`}
              >
                {/* Drag Target Cue Indicator */}
                {isDragTarget && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-md bg-purple-600 text-white text-[9px] font-bold shadow-lg whitespace-nowrap z-20 animate-bounce">
                    Drop to Combine
                  </div>
                )}

                {/* Icon Renderer */}
                <div className="mb-1.5 group-hover:scale-105 transition-transform">
                  <DesktopIconRenderer iconName={currentIconName} size={28} highlight={isSelected} />
                </div>

                {/* Label */}
                <span className="text-[11px] font-medium text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)] leading-tight text-center truncate w-full px-1">
                  {currentLabel}
                </span>

                {/* Permanent Anchor or Feature Badge */}
                {icon.isPermanent ? (
                  <span 
                    className="absolute top-1 right-1 p-0.5 rounded-full bg-amber-500/30 border border-amber-400/40 text-amber-300 shadow-sm"
                    title="Permanent Desktop Link"
                  >
                    <Lock className="w-2.5 h-2.5" />
                  </span>
                ) : (meta?.badge || icon.badge) ? (
                  <span className="absolute top-1 right-1 text-[8px] font-mono px-1 rounded-full bg-purple-500 text-white font-bold animate-pulse">
                    {meta?.badge || icon.badge}
                  </span>
                ) : null}
              </div>
            );
          })}
        </div>

        {/* 4. Active Windows Stack Container */}
        {visibleWindows.map((win) => (
          <DesktopWindow key={win.id} window={win} />
        ))}

        {/* Drag & Drop File Upload Overlay */}
        {isDraggingFileOverDesktop && (
          <div className="absolute inset-4 rounded-3xl border-2 border-dashed border-purple-400/80 bg-purple-950/70 backdrop-blur-md z-40 flex flex-col items-center justify-center pointer-events-none animate-in fade-in zoom-in-95 duration-150">
            <div className="p-4 rounded-2xl bg-purple-600/30 border border-purple-400/50 mb-3 animate-bounce">
              <UploadCloud className="w-12 h-12 text-purple-200" />
            </div>
            <h3 className="text-xl font-bold text-white mb-1">Drop Files to Install or Mount</h3>
            <p className="text-xs text-purple-200/80 max-w-md text-center font-mono">
              Packages (.deb, .rpm, .msi, .exe, .tar.gz, .iso, .zip) will open in the Binary Package Installer. Source code (.c, .h, .asm) will open in Architect Studio.
            </p>
          </div>
        )}
      </div>

      {/* 5. Android-Style Folder Box Expanded Modal */}
      {currentModalFolder && (
        <DesktopFolderBoxModal 
          folder={currentModalFolder}
          onClose={() => setActiveFolderModal(null)}
        />
      )}

      {/* 5. Configurable Multi-Dock & Taskbar Ecosystem */}
      {docks.map((dock) => (
        <DesktopDock key={dock.id} dock={dock} />
      ))}

      {/* 6. Start Menu Application Launcher */}
      <StartMenu />

      {/* 7. Quick Settings / Action Center Flyout */}
      <QuickSettingsFlyout />

      {/* 8. Exposé / Mission Control Workspace Overview */}
      <ExposeOverview />

      {/* 9. Alt + Tab Task Switcher */}
      <AltTabSwitcher />

      {/* 10. Desktop Right-Click Context Menu */}
      {contextMenu && (
        <DesktopContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          onClose={() => setContextMenu(null)}
        />
      )}

      {/* 11. Desktop Icon / Folder Item Right-Click Context Menu */}
      {iconContextMenu && (
        <DesktopIconContextMenu
          x={iconContextMenu.x}
          y={iconContextMenu.y}
          icon={iconContextMenu.icon}
          onClose={() => setIconContextMenu(null)}
          onOpenFolder={() => {
            setActiveFolderModal(iconContextMenu.icon);
            setIconContextMenu(null);
          }}
        />
      )}

      {/* 12. Active Background Operations Flyout Modal */}
      {showOperationsWidget && (
        <div className="fixed top-12 right-6 z-50 w-96 max-w-[calc(100vw-3rem)]">
          <BackgroundOperationsWidget onClose={() => setShowOperationsWidget(false)} />
        </div>
      )}

      {/* 13. Secure Workstation Lock / Login Screen Overlay (Desktop & background processes continue running) */}
      {bootSessionState === 'login' && (
        <div className="fixed inset-0 z-[9990] w-full h-screen overflow-hidden pointer-events-auto select-none bg-black">
          <CustomizableLoginScreen
            onLoginSuccess={unlockToDesktop}
            onReplayBootSplash={rebootOS}
            onResetToOobe={resetToOobe}
            initialWallpaperId={loginWallpaperId}
            onWallpaperChange={setLoginWallpaperId}
            onStartScreensaver={startScreensaver}
          />
        </div>
      )}

      {/* 14. Fullscreen Tux & Windows Butterfly Cartoon Screensaver Overlay */}
      {isScreensaverActive && (
        <div className="fixed inset-0 z-[9995] w-full h-screen overflow-hidden pointer-events-auto select-none bg-black">
          <TuxScreensaverOverlay 
            onExit={stopScreensaver} 
            isLocked={bootSessionState === 'login'} 
          />
        </div>
      )}
    </div>
  );
};
