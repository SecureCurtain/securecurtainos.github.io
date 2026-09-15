// jb7572_2026-08-25: High-Precision Movable, Resizable, Snappable Desktop Window

import React, { useState, useRef, useEffect } from 'react';
import { WindowItem, SnapState } from '../../types/desktop';
import { useDesktop } from '../../context/DesktopContext';
import { DesktopIconRenderer } from './DesktopIconRenderer';
import { 
  Minus, 
  Square, 
  X, 
  Pin, 
  PinOff, 
  Maximize2, 
  Minimize2, 
  Grid2X2, 
  Columns,
  Sparkles
} from 'lucide-react';

// Cockpit Subsystem Views
import { UtilitiesCockpit } from '../cockpit/UtilitiesCockpit';
import { OverviewHealthHUDGUI } from '../cockpit/OverviewHealthHUDGUI';
import { TaskManagerGUI } from '../cockpit/TaskManagerGUI';
import { MemoryDebuggerGUI } from '../cockpit/MemoryDebuggerGUI';
import { StorageManagementGUI } from '../cockpit/StorageManagementGUI';
import { NetworkSecurityGUI } from '../cockpit/NetworkSecurityGUI';
import { UserManagementGUI } from '../cockpit/UserManagementGUI';
import { SystemConfigGUI } from '../cockpit/SystemConfigGUI';
import { HardwareLogsGUI } from '../cockpit/HardwareLogsGUI';
import { PackageFeaturesGUI } from '../cockpit/PackageFeaturesGUI';
import { SearchIndexerGUI } from '../cockpit/SearchIndexerGUI';
import { CockpitTerminal } from '../cockpit/CockpitTerminal';

// Standalone Desktop App Views
import { ThemeStudioApp } from './apps/ThemeStudioApp';
import { FileExplorerApp } from './apps/FileExplorerApp';
import { NotepadApp } from './apps/NotepadApp';
import { SystemInfoApp } from './apps/SystemInfoApp';
import { IsoBuilderApp } from './apps/IsoBuilderApp';
import { WatchdogRecoveryApp } from './apps/WatchdogRecoveryApp';
import { OsInstallerApp } from './apps/OsInstallerApp';
import { RecycleBinApp } from './apps/RecycleBinApp';
import { ForensicsWorkstationApp } from './ForensicsWorkstationApp';
import { BeginnerGuide } from '../BeginnerGuide';
import { CodeAnalyzer } from '../CodeAnalyzer';
import { TuxScreensaverApp } from './screensaver/TuxScreensaverApp';

interface DesktopWindowProps {
  window: WindowItem;
}

export const DesktopWindow: React.FC<DesktopWindowProps> = ({ window: win }) => {
  const { 
    personality, 
    themeConfig, 
    activeWindowId, 
    focusWindow, 
    closeWindow, 
    minimizeWindow, 
    maximizeWindow, 
    restoreWindow, 
    snapWindow, 
    moveWindow, 
    resizeWindow, 
    togglePinWindow,
    placeFileInTree,
    addNotification,
    openApp
  } = useDesktop();

  const handleRunCliCommand = (cmd: string) => {
    openApp('terminal', 'Terminal', { initialCommand: cmd });
  };

  const handleSelectCockpitCategory = (categoryKey: any) => {
    openApp('health-hud', 'Utilities Cockpit', { initialCategory: categoryKey });
  };

  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isResizing, setIsResizing] = useState<string | null>(null);
  const [resizeStart, setResizeStart] = useState({ x: 0, y: 0, w: 0, h: 0, startX: 0, startY: 0 });
  const [showSnapMenu, setShowSnapMenu] = useState(false);

  const windowRef = useRef<HTMLDivElement | null>(null);
  const isActive = activeWindowId === win.id;

  // Window drag handlers
  const handleMouseDownTitle = (e: React.MouseEvent) => {
    if (win.isMaximized) return;
    focusWindow(win.id);
    setIsDragging(true);
    setDragOffset({
      x: e.clientX - win.position.x,
      y: e.clientY - win.position.y
    });
  };

  // Resize mousedown
  const handleResizeStart = (e: React.MouseEvent, direction: string) => {
    e.stopPropagation();
    focusWindow(win.id);
    setIsResizing(direction);
    setResizeStart({
      x: e.clientX,
      y: e.clientY,
      w: win.size.width,
      h: win.size.height,
      startX: win.position.x,
      startY: win.position.y
    });
  };

  // Mouse move and up global listeners
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        const newX = Math.max(10, Math.min(window.innerWidth - 100, e.clientX - dragOffset.x));
        const newY = Math.max(10, Math.min(window.innerHeight - 80, e.clientY - dragOffset.y));
        moveWindow(win.id, { x: newX, y: newY });
      } else if (isResizing) {
        const deltaX = e.clientX - resizeStart.x;
        const deltaY = e.clientY - resizeStart.y;

        let newW = resizeStart.w;
        let newH = resizeStart.h;
        let newX = resizeStart.startX;
        let newY = resizeStart.startY;

        const minW = 480;
        const minH = 340;

        if (isResizing.includes('e')) newW = Math.max(minW, resizeStart.w + deltaX);
        if (isResizing.includes('s')) newH = Math.max(minH, resizeStart.h + deltaY);
        if (isResizing.includes('w')) {
          const possibleW = resizeStart.w - deltaX;
          if (possibleW >= minW) {
            newW = possibleW;
            newX = resizeStart.startX + deltaX;
          }
        }
        if (isResizing.includes('n')) {
          const possibleH = resizeStart.h - deltaY;
          if (possibleH >= minH) {
            newH = possibleH;
            newY = resizeStart.startY + deltaY;
          }
        }

        resizeWindow(win.id, { width: newW, height: newH }, { x: newX, y: newY });
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      setIsResizing(null);
    };

    if (isDragging || isResizing) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, isResizing, dragOffset, resizeStart, win.id, moveWindow, resizeWindow]);

  if (win.isMinimized) return null;

  // Calculate layout style based on state (Maximized / Snapped / Normal)
  let windowStyle: React.CSSProperties = {
    zIndex: win.zIndex,
  };

  if (win.isMaximized) {
    windowStyle = {
      ...windowStyle,
      position: 'absolute',
      left: 0,
      top: 0,
      width: '100%',
      height: 'calc(100% - 48px)', // Reserve taskbar space
      borderRadius: 0,
    };
  } else if (win.snapState === 'left') {
    windowStyle = {
      ...windowStyle,
      position: 'absolute',
      left: 0,
      top: 0,
      width: '50%',
      height: 'calc(100% - 48px)',
      borderRadius: 0,
    };
  } else if (win.snapState === 'right') {
    windowStyle = {
      ...windowStyle,
      position: 'absolute',
      left: '50%',
      top: 0,
      width: '50%',
      height: 'calc(100% - 48px)',
      borderRadius: 0,
    };
  } else if (win.snapState === 'top-left') {
    windowStyle = {
      ...windowStyle,
      position: 'absolute',
      left: 0,
      top: 0,
      width: '50%',
      height: 'calc(50% - 24px)',
      borderRadius: 0,
    };
  } else if (win.snapState === 'top-right') {
    windowStyle = {
      ...windowStyle,
      position: 'absolute',
      left: '50%',
      top: 0,
      width: '50%',
      height: 'calc(50% - 24px)',
      borderRadius: 0,
    };
  } else if (win.snapState === 'bottom-left') {
    windowStyle = {
      ...windowStyle,
      position: 'absolute',
      left: 0,
      top: 'calc(50% - 24px)',
      width: '50%',
      height: 'calc(50% - 24px)',
      borderRadius: 0,
    };
  } else if (win.snapState === 'bottom-right') {
    windowStyle = {
      ...windowStyle,
      position: 'absolute',
      left: '50%',
      top: 'calc(50% - 24px)',
      width: '50%',
      height: 'calc(50% - 24px)',
      borderRadius: 0,
    };
  } else {
    // Normal Floating
    windowStyle = {
      ...windowStyle,
      position: 'absolute',
      left: `${win.position.x}px`,
      top: `${win.position.y}px`,
      width: `${win.size.width}px`,
      height: `${win.size.height}px`,
    };
  }

  // Render Inner Content
  const renderAppContent = () => {
    switch (win.appId) {
      case 'health-hud':
        return <UtilitiesCockpit initialCategory={win.customProps?.initialCategory} />;
      case 'task-manager':
        return <div className="h-full w-full overflow-y-auto p-4 md:p-5 custom-scrollbar"><TaskManagerGUI /></div>;
      case 'memory-debugger':
        return <div className="h-full w-full overflow-y-auto p-4 md:p-5 custom-scrollbar"><MemoryDebuggerGUI /></div>;
      case 'storage-mgmt':
        return <div className="h-full w-full overflow-y-auto p-4 md:p-5 custom-scrollbar"><StorageManagementGUI /></div>;
      case 'network-security':
        return <div className="h-full w-full overflow-y-auto p-4 md:p-5 custom-scrollbar"><NetworkSecurityGUI onRunCliCommand={handleRunCliCommand} /></div>;
      case 'user-mgmt':
        return <div className="h-full w-full overflow-y-auto p-4 md:p-5 custom-scrollbar"><UserManagementGUI onRunCliCommand={handleRunCliCommand} /></div>;
      case 'system-config':
        return <div className="h-full w-full overflow-y-auto p-4 md:p-5 custom-scrollbar"><SystemConfigGUI onRunCliCommand={handleRunCliCommand} /></div>;
      case 'hardware-logs':
        return <div className="h-full w-full overflow-y-auto p-4 md:p-5 custom-scrollbar"><HardwareLogsGUI /></div>;
      case 'package-features':
        return <div className="h-full w-full overflow-y-auto p-4 md:p-5 custom-scrollbar"><PackageFeaturesGUI initialTab={win.customProps?.initialTab} /></div>;
      case 'search-indexer':
        return <div className="h-full w-full overflow-y-auto p-4 md:p-5 custom-scrollbar"><SearchIndexerGUI /></div>;
      case 'terminal':
        return <div className="h-full w-full overflow-y-auto p-4 md:p-5 custom-scrollbar"><CockpitTerminal externalCommand={win.customProps?.initialCommand} /></div>;
      case 'theme-studio':
        return <ThemeStudioApp />;
      case 'file-explorer':
        return <FileExplorerApp />;
      case 'notepad':
        return <NotepadApp customProps={win.customProps} />;
      case 'system-info':
        return <div className="h-full w-full overflow-y-auto p-4 md:p-5 custom-scrollbar"><SystemInfoApp /></div>;
      case 'iso-builder':
        return <div className="h-full w-full overflow-y-auto p-4 md:p-5 custom-scrollbar"><IsoBuilderApp /></div>;
      case 'watchdog-recovery':
        return <div className="h-full w-full overflow-y-auto p-4 md:p-5 custom-scrollbar"><WatchdogRecoveryApp /></div>;
      case 'os-installer':
        return <div className="h-full w-full overflow-y-auto p-4 md:p-5 custom-scrollbar"><OsInstallerApp /></div>;
      case 'forensics-workstation':
        return <ForensicsWorkstationApp />;
      case 'recycle-bin':
        return <RecycleBinApp />;
      case 'tux-screensaver':
        return <TuxScreensaverApp />;
      case 'guide':
        return <div className="h-full w-full overflow-y-auto p-4 md:p-5 custom-scrollbar"><BeginnerGuide /></div>;
      case 'architect-studio':
        return (
          <CodeAnalyzer 
            initialFilename={win.customProps?.filename}
            initialCode={win.customProps?.code}
            onPlaceFile={(fn, path, content, desc) => {
              placeFileInTree(fn, path, content, desc);
              addNotification({
                title: 'Kernel File Placed',
                message: `Successfully installed ${fn} into /${path}`,
                type: 'success',
                appId: 'architect-studio'
              });
            }} 
          />
        );
      default:
        return <div className="h-full w-full overflow-y-auto p-4 md:p-5 custom-scrollbar"><OverviewHealthHUDGUI onSelectCategory={handleSelectCockpitCategory} /></div>;
    }
  };

  return (
    <div
      ref={windowRef}
      onMouseDown={() => focusWindow(win.id)}
      style={windowStyle}
      className={`flex flex-col shadow-2xl overflow-hidden transition-shadow select-none duration-100 ${
        win.isMaximized || win.snapState !== 'none' ? 'rounded-none' : 'rounded-2xl'
      } ${
        isActive 
          ? 'shadow-[0_20px_60px_rgba(0,0,0,0.85)] ring-1' 
          : 'shadow-[0_10px_30px_rgba(0,0,0,0.5)] opacity-95'
      }`}
    >
      {/* Dynamic Themed Window Frame Background */}
      <div 
        className={`absolute inset-0 pointer-events-none -z-10 ${themeConfig.glassBlur}`}
        style={{
          backgroundColor: themeConfig.windowBg,
          border: `1px solid ${isActive ? themeConfig.accentHex : themeConfig.windowBorder}`
        }}
      />

      {/* Titlebar */}
      <div
        onMouseDown={handleMouseDownTitle}
        onDoubleClick={() => maximizeWindow(win.id)}
        className="h-10 px-3 flex items-center justify-between border-b cursor-grab active:cursor-grabbing shrink-0 select-none backdrop-blur-md"
        style={{
          backgroundColor: themeConfig.titlebarBg,
          borderColor: themeConfig.windowBorder
        }}
      >
        {/* Left Side: Linux Controls OR Windows App Icon + Title */}
        <div className="flex items-center gap-2.5 overflow-hidden">
          {/* Linux Circular Window Buttons (Left Aligned when Linux personality) */}
          {personality === 'linux' && (
            <div className="flex items-center gap-1.5 mr-2">
              <button
                onClick={(e) => { e.stopPropagation(); closeWindow(win.id); }}
                className="w-3 h-3 rounded-full bg-red-500/80 hover:bg-red-500 transition-colors"
                title="Close"
              />
              <button
                onClick={(e) => { e.stopPropagation(); minimizeWindow(win.id); }}
                className="w-3 h-3 rounded-full bg-amber-500/80 hover:bg-amber-500 transition-colors"
                title="Minimize"
              />
              <button
                onClick={(e) => { e.stopPropagation(); maximizeWindow(win.id); }}
                className="w-3 h-3 rounded-full bg-emerald-500/80 hover:bg-emerald-500 transition-colors"
                title="Maximize / Restore"
              />
            </div>
          )}

          {/* App Icon */}
          <div className="shrink-0 scale-75">
            <DesktopIconRenderer iconName={win.iconName} size={18} />
          </div>

          {/* Title */}
          <span className="text-xs font-semibold tracking-wide text-white truncate max-w-[280px] sm:max-w-[450px]">
            {win.title}
          </span>
        </div>

        {/* Right Side Controls */}
        <div className="flex items-center gap-1">
          {/* Pin on top / across workspaces */}
          <button
            onClick={(e) => { e.stopPropagation(); togglePinWindow(win.id); }}
            className={`p-1.5 rounded-md text-xs transition-colors ${
              win.isPinned ? 'text-purple-400 bg-purple-950/60' : 'text-[#888] hover:text-white hover:bg-white/5'
            }`}
            title={win.isPinned ? 'Unpin window' : 'Pin window across workspaces'}
          >
            {win.isPinned ? <Pin className="w-3.5 h-3.5" /> : <PinOff className="w-3.5 h-3.5" />}
          </button>

          {/* Windows / Hybrid Personality Titlebar Controls (Right Aligned) */}
          {personality !== 'linux' && (
            <div className="flex items-center gap-0.5">
              {/* Minimize */}
              <button
                onClick={(e) => { e.stopPropagation(); minimizeWindow(win.id); }}
                className="p-1.5 rounded-md text-[#888] hover:text-white hover:bg-white/10 transition-colors"
                title="Minimize"
              >
                <Minus className="w-3.5 h-3.5" />
              </button>

              {/* Maximize & Snap Layouts */}
              <div className="relative">
                <button
                  onClick={(e) => { e.stopPropagation(); maximizeWindow(win.id); }}
                  onMouseEnter={() => setShowSnapMenu(true)}
                  className="p-1.5 rounded-md text-[#888] hover:text-white hover:bg-white/10 transition-colors"
                  title="Maximize / Snap Layouts"
                >
                  {win.isMaximized ? <Minimize2 className="w-3.5 h-3.5" /> : <Square className="w-3.5 h-3.5" />}
                </button>

                {/* Snap Layouts Flyout Menu (Windows 11 Aero Snap Style) */}
                {showSnapMenu && (
                  <div
                    onMouseLeave={() => setShowSnapMenu(false)}
                    className="absolute top-8 right-0 w-44 p-2 rounded-xl bg-[#141620] border border-[#2d3448] shadow-2xl z-50 space-y-2 text-[10px] font-sans"
                  >
                    <div className="text-[9px] uppercase tracking-wider text-[#888] font-bold px-1">
                      Snap Window Layout
                    </div>
                    <div className="grid grid-cols-2 gap-1.5">
                      {/* Left Half */}
                      <button
                        onClick={(e) => { e.stopPropagation(); snapWindow(win.id, 'left'); setShowSnapMenu(false); }}
                        className="p-1.5 rounded bg-[#1e2233] hover:bg-purple-600 hover:text-white text-center font-mono border border-[#333a52]"
                      >
                        Left 50%
                      </button>
                      {/* Right Half */}
                      <button
                        onClick={(e) => { e.stopPropagation(); snapWindow(win.id, 'right'); setShowSnapMenu(false); }}
                        className="p-1.5 rounded bg-[#1e2233] hover:bg-purple-600 hover:text-white text-center font-mono border border-[#333a52]"
                      >
                        Right 50%
                      </button>
                      {/* Top-Left Quadrant */}
                      <button
                        onClick={(e) => { e.stopPropagation(); snapWindow(win.id, 'top-left'); setShowSnapMenu(false); }}
                        className="p-1.5 rounded bg-[#1e2233] hover:bg-purple-600 hover:text-white text-center font-mono border border-[#333a52]"
                      >
                        Top Left
                      </button>
                      {/* Top-Right Quadrant */}
                      <button
                        onClick={(e) => { e.stopPropagation(); snapWindow(win.id, 'top-right'); setShowSnapMenu(false); }}
                        className="p-1.5 rounded bg-[#1e2233] hover:bg-purple-600 hover:text-white text-center font-mono border border-[#333a52]"
                      >
                        Top Right
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Close */}
              <button
                onClick={(e) => { e.stopPropagation(); closeWindow(win.id); }}
                className="p-1.5 rounded-md text-[#888] hover:text-white hover:bg-red-600 transition-colors"
                title="Close"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Window Body Canvas */}
      <div className="flex-1 overflow-hidden relative bg-[#0b0c10]/90">
        {renderAppContent()}
      </div>

      {/* 8-Directional Resize Handles (Active only when not maximized and not snapped) */}
      {!win.isMaximized && win.snapState === 'none' && (
        <>
          <div onMouseDown={(e) => handleResizeStart(e, 'e')} className="absolute right-0 top-0 bottom-0 w-2 cursor-e-resize" />
          <div onMouseDown={(e) => handleResizeStart(e, 's')} className="absolute left-0 bottom-0 right-0 h-2 cursor-s-resize" />
          <div onMouseDown={(e) => handleResizeStart(e, 'w')} className="absolute left-0 top-0 bottom-0 w-2 cursor-w-resize" />
          <div onMouseDown={(e) => handleResizeStart(e, 'n')} className="absolute left-0 top-0 right-0 h-2 cursor-n-resize" />
          <div onMouseDown={(e) => handleResizeStart(e, 'se')} className="absolute right-0 bottom-0 w-4 h-4 cursor-se-resize" />
          <div onMouseDown={(e) => handleResizeStart(e, 'sw')} className="absolute left-0 bottom-0 w-4 h-4 cursor-sw-resize" />
          <div onMouseDown={(e) => handleResizeStart(e, 'ne')} className="absolute right-0 top-0 w-4 h-4 cursor-ne-resize" />
          <div onMouseDown={(e) => handleResizeStart(e, 'nw')} className="absolute left-0 top-0 w-4 h-4 cursor-nw-resize" />
        </>
      )}
    </div>
  );
};
