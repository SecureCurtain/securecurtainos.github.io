// jb7572_2026-08-25: Fully Customizable Multi-Dock & Taskbar Component
// Supports Top, Bottom, Left, Right & Floating Placements, Dynamic Dimensions & Auto-Synced App Catalog

import React, { useState, useEffect } from 'react';
import { useDesktop } from '../../context/DesktopContext';
import { DockConfig, AppId } from '../../types/desktop';
import { DesktopIconRenderer } from './DesktopIconRenderer';
import { StartButtonContextMenu } from './StartButtonContextMenu';
import { 
  Terminal, 
  Zap, 
  Layers, 
  Grid2X2, 
  Wifi, 
  Volume2, 
  Battery, 
  Bell, 
  Settings, 
  Cpu, 
  Activity, 
  Sliders, 
  Plus, 
  Maximize2,
  Minimize2,
  X,
  Sparkles,
  ChevronRight,
  Trash2,
  Pin,
  PinOff,
  Play
} from 'lucide-react';

interface DesktopDockProps {
  dock: DockConfig;
}

export const DesktopDock: React.FC<DesktopDockProps> = ({ dock }) => {
  const {
    personality,
    themeConfig,
    windows,
    activeWindowId,
    workspaces,
    activeWorkspaceId,
    switchWorkspace,
    focusWindow,
    minimizeWindow,
    openApp,
    toggleStartMenu,
    isStartMenuOpen,
    toggleQuickSettings,
    isQuickSettingsOpen,
    toggleExpose,
    unreadNotificationsCount,
    minimizeAllWindows,
    appCatalog,
    updateDock,
    addDesktopIcon,
    removeDesktopIcon,
    isAppOnDesktop,
    togglePinToTaskbar,
    closeWindow
  } = useDesktop();

  const [timeStr, setTimeStr] = useState<string>('');
  const [dateStr, setDateStr] = useState<string>('');
  const [cpuUsage, setCpuUsage] = useState<number>(14);
  const [memUsage, setMemUsage] = useState<number>(42);
  const [hoveredAppId, setHoveredAppId] = useState<string | null>(null);
  const [startContextMenuPos, setStartContextMenuPos] = useState<{ x: number; y: number } | null>(null);
  const [dockAppContextMenu, setDockAppContextMenu] = useState<{ appId: AppId; x: number; y: number } | null>(null);

  // Live telemetry and time
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeStr(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
      setDateStr(now.toLocaleDateString([], { month: 'short', day: 'numeric' }));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);

    const metricsInterval = setInterval(() => {
      setCpuUsage(Math.floor(12 + Math.random() * 16));
      setMemUsage(Math.floor(41 + Math.random() * 4));
    }, 3000);

    return () => {
      clearInterval(interval);
      clearInterval(metricsInterval);
    };
  }, []);

  if (!dock.enabled) return null;

  const isVertical = dock.placement === 'left' || dock.placement === 'right';
  const isFloating = dock.placement === 'floating-bottom' || dock.placement === 'floating-top';

  // Windows in current workspace
  const currentWorkspaceWindows = windows.filter(
    w => w.workspaceId === activeWorkspaceId || w.isPinned
  );

  // Determine positioning classes
  let positionClasses = '';
  let styleProps: React.CSSProperties = {
    padding: `${dock.padding}px`,
    borderRadius: `${dock.borderRadius}px`,
    backgroundColor: dock.customBg || (
      dock.translucency === 'solid' ? themeConfig.taskbarBg.replace(/[\d\.]+\)$/, '0.98)') :
      dock.translucency === 'acrylic' ? 'rgba(15, 17, 26, 0.72)' :
      themeConfig.taskbarBg
    ),
    borderColor: dock.customBorder || themeConfig.windowBorder
  };

  if (dock.placement === 'bottom') {
    positionClasses = 'fixed bottom-0 left-0 right-0 z-40 border-t flex items-center';
    styleProps.height = `${dock.thickness}px`;
    if (dock.lengthPercent < 100) {
      positionClasses = 'fixed bottom-0 z-40 border-t flex items-center';
      styleProps.width = `${dock.lengthPercent}%`;
      if (dock.alignment === 'center') {
        positionClasses += ' left-1/2 -translate-x-1/2 rounded-t-2xl';
      } else if (dock.alignment === 'start') {
        positionClasses += ' left-0 rounded-tr-2xl';
      } else {
        positionClasses += ' right-0 rounded-tl-2xl';
      }
    }
  } else if (dock.placement === 'top') {
    positionClasses = 'fixed top-0 left-0 right-0 z-40 border-b flex items-center';
    styleProps.height = `${dock.thickness}px`;
    if (dock.lengthPercent < 100) {
      positionClasses = 'fixed top-0 z-40 border-b flex items-center';
      styleProps.width = `${dock.lengthPercent}%`;
      if (dock.alignment === 'center') {
        positionClasses += ' left-1/2 -translate-x-1/2 rounded-b-2xl';
      } else if (dock.alignment === 'start') {
        positionClasses += ' left-0 rounded-br-2xl';
      } else {
        positionClasses += ' right-0 rounded-bl-2xl';
      }
    }
  } else if (dock.placement === 'left') {
    positionClasses = 'fixed top-0 bottom-0 left-0 z-40 border-r flex flex-col items-center';
    styleProps.width = `${dock.thickness}px`;
    if (dock.lengthPercent < 100) {
      positionClasses = 'fixed left-0 z-40 border-r flex flex-col items-center';
      styleProps.height = `${dock.lengthPercent}%`;
      if (dock.alignment === 'center') {
        positionClasses += ' top-1/2 -translate-y-1/2 rounded-r-2xl';
      } else if (dock.alignment === 'start') {
        positionClasses += ' top-0 rounded-br-2xl';
      } else {
        positionClasses += ' bottom-0 rounded-tr-2xl';
      }
    }
  } else if (dock.placement === 'right') {
    positionClasses = 'fixed top-0 bottom-0 right-0 z-40 border-l flex flex-col items-center';
    styleProps.width = `${dock.thickness}px`;
    if (dock.lengthPercent < 100) {
      positionClasses = 'fixed right-0 z-40 border-l flex flex-col items-center';
      styleProps.height = `${dock.lengthPercent}%`;
      if (dock.alignment === 'center') {
        positionClasses += ' top-1/2 -translate-y-1/2 rounded-l-2xl';
      } else if (dock.alignment === 'start') {
        positionClasses += ' top-0 rounded-bl-2xl';
      } else {
        positionClasses += ' bottom-0 rounded-tl-2xl';
      }
    }
  } else if (dock.placement === 'floating-bottom') {
    positionClasses = 'fixed bottom-3 z-40 border flex items-center shadow-2xl';
    styleProps.height = `${dock.thickness}px`;
    styleProps.width = `${dock.lengthPercent}%`;
    if (dock.alignment === 'center') {
      positionClasses += ' left-1/2 -translate-x-1/2';
    } else if (dock.alignment === 'start') {
      positionClasses += ' left-4';
    } else {
      positionClasses += ' right-4';
    }
  } else if (dock.placement === 'floating-top') {
    positionClasses = 'fixed top-3 z-40 border flex items-center shadow-2xl';
    styleProps.height = `${dock.thickness}px`;
    styleProps.width = `${dock.lengthPercent}%`;
    if (dock.alignment === 'center') {
      positionClasses += ' left-1/2 -translate-x-1/2';
    } else if (dock.alignment === 'start') {
      positionClasses += ' left-4';
    } else {
      positionClasses += ' right-4';
    }
  }

  // Alignment within dock
  const justifyClass = dock.alignment === 'center' ? 'justify-center' :
                       dock.alignment === 'start' ? 'justify-start' : 'justify-end';

  return (
    <div
      id={dock.id}
      onClick={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.stopPropagation()}
      className={`${positionClasses} select-none backdrop-blur-2xl transition-all duration-200 gap-2 px-3 ${
        dock.translucency === 'acrylic' ? 'shadow-[0_8px_32px_rgba(0,0,0,0.6)]' : 'shadow-lg'
      }`}
      style={styleProps}
    >
      {/* 1. Start Menu Button */}
      {dock.showStartButton && (
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            toggleStartMenu();
          }}
          onMouseDown={(e) => {
            e.stopPropagation();
          }}
          onContextMenu={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setStartContextMenuPos({ x: e.clientX, y: e.clientY });
          }}
          title="Open Start Menu (Left Click) | Power Context Menu & Cockpit (Right Click)"
          className={`shrink-0 rounded-xl flex items-center justify-center gap-1.5 font-semibold text-xs transition-all duration-150 active:scale-95 ${
            isVertical ? 'w-full py-2 px-1' : 'h-full px-2.5'
          } ${
            isStartMenuOpen
              ? 'bg-purple-600 text-white shadow-[0_0_15px_rgba(168,85,247,0.5)] scale-95'
              : 'bg-[#181a24] text-white hover:bg-[#232736] border border-[#2b3145]'
          }`}
          style={{ minHeight: `${Math.min(dock.thickness - 12, 38)}px` }}
        >
          {personality === 'linux' ? (
            <Terminal className="text-sky-400 shrink-0" size={Math.min(dock.iconSize, 20)} />
          ) : personality === 'windows' ? (
            <div className="grid grid-cols-2 gap-0.5 shrink-0" style={{ width: `${Math.min(dock.iconSize, 16)}px`, height: `${Math.min(dock.iconSize, 16)}px` }}>
              <div className="bg-sky-400 rounded-xs" />
              <div className="bg-sky-400 rounded-xs" />
              <div className="bg-sky-400 rounded-xs" />
              <div className="bg-sky-400 rounded-xs" />
            </div>
          ) : (
            <Zap className="text-purple-400 shrink-0" size={Math.min(dock.iconSize, 20)} />
          )}
          {!isVertical && dock.thickness >= 44 && (
            <span className="font-mono uppercase tracking-wider text-[11px] hidden md:inline">
              {personality === 'linux' ? 'Application' : personality === 'windows' ? 'Start' : 'SecureCurtain'}
            </span>
          )}
        </button>
      )}

      {/* 2. Virtual Workspaces Pager */}
      {dock.showWorkspaces && (
        <div className={`flex ${isVertical ? 'flex-col' : 'flex-row'} items-center bg-[#0d0f16]/90 p-1 rounded-xl border border-[#202538] gap-1 shrink-0`}>
          {workspaces.map((ws) => {
            const isActive = activeWorkspaceId === ws.id;
            const wsWinCount = windows.filter(w => w.workspaceId === ws.id).length;

            return (
              <button
                key={ws.id}
                onClick={() => switchWorkspace(ws.id)}
                className={`px-2 py-0.5 rounded-lg text-[11px] font-mono font-semibold transition-all relative ${
                  isActive
                    ? 'bg-purple-600 text-white shadow-sm'
                    : 'text-[#64748b] hover:text-[#e2e8f0] hover:bg-[#1a1e2e]'
                }`}
                title={`${ws.name} (${wsWinCount} active windows)`}
              >
                <span>{ws.id}</span>
                {wsWinCount > 0 && !isActive && (
                  <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-sky-400" />
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* Divider if preceding items */}
      {(dock.showStartButton || dock.showWorkspaces) && (dock.showPinnedApps || dock.showOpenTasks) && (
        <div className={`${isVertical ? 'w-full h-px my-1' : 'h-2/3 w-px mx-1'} bg-white/10 shrink-0`} />
      )}

      {/* 3. Center Section: Pinned Launchers + Open Window Task Tabs */}
      <div className={`flex-1 flex ${isVertical ? 'flex-col' : 'flex-row'} items-center gap-1.5 overflow-x-auto overflow-y-auto no-scrollbar ${justifyClass}`}>
        {/* Pinned Quick Launch Apps (Dynamically synced with reactive appCatalog) */}
        {dock.showPinnedApps && dock.pinnedAppIds.map((appId) => {
          const appMeta = appCatalog[appId];
          if (!appMeta) return null;

          const isRunning = windows.some(w => w.appId === appId);
          const isCurrentActive = activeWindowId && windows.find(w => w.id === activeWindowId)?.appId === appId;
          const label = personality === 'linux' ? appMeta.linuxName : 
                        personality === 'windows' ? appMeta.windowsName : 
                        appMeta.title;

          return (
            <div key={appId} className="relative group shrink-0">
              <button
                onClick={() => openApp(appId)}
                onContextMenu={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setDockAppContextMenu({ appId, x: e.clientX, y: e.clientY });
                }}
                onMouseEnter={() => setHoveredAppId(appId)}
                onMouseLeave={() => setHoveredAppId(null)}
                className={`relative flex items-center justify-center p-1.5 rounded-xl transition-all duration-200 ${
                  isCurrentActive
                    ? 'bg-white/20 border border-white/30 shadow-md scale-105'
                    : isRunning
                    ? 'bg-white/10 hover:bg-white/15'
                    : 'hover:bg-white/10'
                }`}
                style={{
                  width: `${Math.max(dock.iconSize + 12, 34)}px`,
                  height: `${Math.max(dock.iconSize + 12, 34)}px`
                }}
                title={`${label} (${appMeta.category}) - Right-click for options`}
              >
                <DesktopIconRenderer
                  iconName={appMeta.iconName}
                  size={dock.iconSize}
                  highlight={isCurrentActive}
                />

                {/* Running status indicator dot */}
                {isRunning && (
                  <span
                    className={`absolute ${
                      isVertical ? 'right-0.5 top-1/2 -translate-y-1/2 w-1 h-3 rounded-full' : 'bottom-0.5 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full'
                    } ${isCurrentActive ? 'bg-purple-400 shadow-[0_0_8px_#a855f7]' : 'bg-white/60'}`}
                  />
                )}

                {/* Badge if present */}
                {appMeta.badge && (
                  <span className="absolute -top-1 -right-1 text-[8px] font-mono px-1 rounded-full bg-purple-500 text-white font-bold animate-pulse">
                    {appMeta.badge}
                  </span>
                )}
              </button>

              {/* Hover Tooltip */}
              {hoveredAppId === appId && !dockAppContextMenu && (
                <div className={`absolute pointer-events-none z-50 px-2.5 py-1 rounded-lg bg-[#090a10] border border-[#33394d] text-white text-[11px] font-mono shadow-2xl whitespace-nowrap animate-in fade-in zoom-in-95 duration-150 ${
                  dock.placement === 'top' || dock.placement === 'floating-top' ? 'top-full mt-2 left-1/2 -translate-x-1/2' :
                  dock.placement === 'left' ? 'left-full ml-2 top-1/2 -translate-y-1/2' :
                  dock.placement === 'right' ? 'right-full mr-2 top-1/2 -translate-y-1/2' :
                  'bottom-full mb-2 left-1/2 -translate-x-1/2'
                }`}>
                  <div className="font-semibold text-purple-300">{label}</div>
                  <div className="text-[9px] text-[#94a3b8]">{appMeta.description.slice(0, 45)}...</div>
                </div>
              )}
            </div>
          );
        })}

        {/* Separator between pinned and open tasks */}
        {dock.showPinnedApps && dock.showOpenTasks && currentWorkspaceWindows.length > 0 && (
          <div className={`${isVertical ? 'w-full h-px my-1' : 'h-1/2 w-px mx-1'} bg-white/10 shrink-0`} />
        )}

        {/* Open Running Window Task List */}
        {dock.showOpenTasks && currentWorkspaceWindows.map((win) => {
          const isActive = activeWindowId === win.id && !win.isMinimized;
          const meta = appCatalog[win.appId];
          const iconName = meta?.iconName || win.iconName;

          return (
            <button
              key={win.id}
              onClick={() => {
                if (isActive) {
                  minimizeWindow(win.id);
                } else {
                  focusWindow(win.id);
                }
              }}
              className={`flex items-center gap-2 rounded-xl transition-all duration-150 shrink-0 ${
                isVertical ? 'w-full p-2 justify-center' : 'h-8 px-2.5 max-w-[170px]'
              } ${
                isActive
                  ? 'bg-purple-600/30 text-white border border-purple-500/60 shadow-[0_0_12px_rgba(168,85,247,0.3)]'
                  : win.isMinimized
                  ? 'bg-[#12141c]/60 text-[#64748b] hover:bg-[#1a1d29] hover:text-[#94a3b8] border border-transparent'
                  : 'bg-[#181a24]/80 text-[#cbd5e1] hover:bg-[#222533] border border-[#2c3245]'
              }`}
              title={win.title}
            >
              <DesktopIconRenderer iconName={iconName} size={Math.min(dock.iconSize, 18)} highlight={isActive} />
              
              {!isVertical && (
                <span className="text-xs truncate font-medium flex-1 text-left hidden sm:inline">
                  {win.title}
                </span>
              )}

              {/* Minimized Indicator dot */}
              {win.isMinimized && (
                <span className="w-1.5 h-1.5 rounded-full bg-[#64748b] shrink-0" />
              )}
            </button>
          );
        })}
      </div>

      {/* Divider before system tray */}
      {(dock.showSystemTray || dock.showClock || dock.showQuickSettings) && (
        <div className={`${isVertical ? 'w-full h-px my-1' : 'h-2/3 w-px mx-1'} bg-white/10 shrink-0`} />
      )}

      {/* 4. Right/Bottom Section: System Tray, Telemetry & Clock */}
      <div className={`flex ${isVertical ? 'flex-col' : 'flex-row'} items-center gap-2 shrink-0`}>
        {/* Telemetry Tray (CPU & RAM) */}
        {dock.showSystemTray && (
          <div className="flex items-center gap-2 bg-[#0c0e14]/90 px-2 py-1 rounded-xl border border-[#202538] text-[10px] font-mono">
            <div className="flex items-center gap-1 text-emerald-400" title={`Virtual CPU: ${cpuUsage}%`}>
              <Cpu className="w-3 h-3" />
              {!isVertical && <span>{cpuUsage}%</span>}
            </div>
            {!isVertical && <span className="text-white/20">|</span>}
            <div className="flex items-center gap-1 text-sky-400" title={`Virtual RAM: ${memUsage}%`}>
              <Activity className="w-3 h-3" />
              {!isVertical && <span>{memUsage}%</span>}
            </div>
          </div>
        )}

        {/* Quick Settings Action Center Button */}
        {dock.showQuickSettings && (
          <button
            onClick={() => toggleQuickSettings()}
            className={`p-1.5 rounded-xl transition-all relative ${
              isQuickSettingsOpen
                ? 'bg-purple-600 text-white shadow-md'
                : 'bg-[#181a24] text-[#94a3b8] hover:text-white hover:bg-[#222533] border border-[#2b3145]'
            }`}
            title="Quick Settings & Notifications"
          >
            <div className="flex items-center gap-1.5">
              <Wifi className="w-3.5 h-3.5" />
              <Volume2 className="w-3.5 h-3.5" />
              <div className="relative">
                <Bell className="w-3.5 h-3.5" />
                {unreadNotificationsCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-purple-500 animate-pulse" />
                )}
              </div>
            </div>
          </button>
        )}

        {/* Live Clock & Date */}
        {dock.showClock && (
          <button
            onClick={() => toggleQuickSettings()}
            className={`flex flex-col items-end text-right px-2 py-0.5 rounded-xl hover:bg-white/5 transition-colors font-mono ${
              isVertical ? 'text-[9px] items-center' : 'text-xs'
            }`}
            title={dateStr}
          >
            <span className="font-semibold text-[#f1f5f9] leading-tight text-[11px]">{timeStr}</span>
            {!isVertical && <span className="text-[9px] text-[#64748b] leading-tight">{dateStr}</span>}
          </button>
        )}

        {/* Quick Dock Customizer Launcher Button */}
        <button
          onClick={() => openApp('theme-studio')}
          className="p-1.5 rounded-xl bg-purple-950/40 border border-purple-500/30 text-purple-300 hover:bg-purple-900/60 hover:text-white transition-all shadow-xs"
          title="Customize Docks, Placements, Sizes & App Catalog in Theme Studio"
        >
          <Sliders className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Start Button Right-Click Power Context Menu */}
      {startContextMenuPos && (
        <StartButtonContextMenu
          x={startContextMenuPos.x}
          y={startContextMenuPos.y}
          onClose={() => setStartContextMenuPos(null)}
        />
      )}

      {/* Dock App Context Menu */}
      {dockAppContextMenu && (
        <div
          onClick={(e) => e.stopPropagation()}
          style={{
            left: `${Math.min(dockAppContextMenu.x - 20, window.innerWidth - 220)}px`,
            top: `${Math.max(dockAppContextMenu.y - 140, 20)}px`,
            backgroundColor: themeConfig.windowBg,
            borderColor: themeConfig.accentHex
          }}
          className="fixed z-50 w-52 rounded-2xl border shadow-2xl p-1.5 backdrop-blur-2xl text-xs font-sans select-none animate-in fade-in zoom-in-95 duration-100 space-y-1"
        >
          {appCatalog[dockAppContextMenu.appId] && (
            <div className="px-2.5 py-1 text-[11px] font-bold text-white border-b border-white/10 flex items-center gap-1.5">
              <DesktopIconRenderer iconName={appCatalog[dockAppContextMenu.appId].iconName} size={14} />
              <span className="truncate">{appCatalog[dockAppContextMenu.appId].title}</span>
            </div>
          )}

          <button
            onClick={() => {
              openApp(dockAppContextMenu.appId);
              setDockAppContextMenu(null);
            }}
            className="w-full px-2 py-1.5 rounded-xl hover:bg-purple-600/20 text-purple-300 flex items-center gap-2 text-left transition-colors font-medium"
          >
            <Play className="w-3.5 h-3.5 text-purple-400 fill-purple-400/40" />
            <span>Launch App</span>
          </button>

          {/* Add / Remove from Desktop */}
          <button
            onClick={() => {
              if (isAppOnDesktop(dockAppContextMenu.appId)) {
                removeDesktopIcon(dockAppContextMenu.appId);
              } else {
                addDesktopIcon(dockAppContextMenu.appId);
              }
              setDockAppContextMenu(null);
            }}
            className="w-full px-2 py-1.5 rounded-xl hover:bg-white/10 text-white flex items-center gap-2 text-left transition-colors font-medium"
          >
            {isAppOnDesktop(dockAppContextMenu.appId) ? (
              <>
                <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                <span className="text-rose-300">Remove from Desktop</span>
              </>
            ) : (
              <>
                <Plus className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-300">Add to Desktop</span>
              </>
            )}
          </button>

          {/* Pin / Unpin from Taskbar */}
          <button
            onClick={() => {
              togglePinToTaskbar(dockAppContextMenu.appId);
              setDockAppContextMenu(null);
            }}
            className="w-full px-2 py-1.5 rounded-xl hover:bg-white/10 text-white flex items-center gap-2 text-left transition-colors font-medium"
          >
            {dock.pinnedAppIds.includes(dockAppContextMenu.appId) ? (
              <>
                <PinOff className="w-3.5 h-3.5 text-amber-400" />
                <span>Unpin from Taskbar</span>
              </>
            ) : (
              <>
                <Pin className="w-3.5 h-3.5 text-sky-400" />
                <span>Pin to Taskbar</span>
              </>
            )}
          </button>

          {/* Close Window if running */}
          {windows.some(w => w.appId === dockAppContextMenu.appId) && (
            <button
              onClick={() => {
                const targetWin = windows.find(w => w.appId === dockAppContextMenu.appId);
                if (targetWin) closeWindow(targetWin.id);
                setDockAppContextMenu(null);
              }}
              className="w-full px-2 py-1.5 rounded-xl hover:bg-rose-500/20 text-rose-300 flex items-center gap-2 text-left transition-colors font-medium border-t border-white/5 pt-1.5"
            >
              <X className="w-3.5 h-3.5 text-rose-400" />
              <span>Close Window</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
};
