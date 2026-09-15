// jb7572_2026-08-25: Desktop Taskbar, Dock & System Tray Engine

import React, { useState, useEffect } from 'react';
import { useDesktop } from '../../context/DesktopContext';
import { DesktopIconRenderer } from './DesktopIconRenderer';
import { StartButtonContextMenu } from './StartButtonContextMenu';
import { APP_CATALOG } from '../../data/desktopThemes';
import { 
  Layers, 
  Grid2X2, 
  Wifi, 
  Volume2, 
  Battery, 
  Bell, 
  Settings, 
  Terminal, 
  Cpu, 
  Activity, 
  Monitor, 
  Zap,
  Sparkles,
  CheckCircle2
} from 'lucide-react';

export const DesktopTaskbar: React.FC = () => {
  const { 
    personality, 
    themeConfig, 
    taskbarPosition, 
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
    minimizeAllWindows
  } = useDesktop();

  const [timeStr, setTimeStr] = useState<string>('');
  const [dateStr, setDateStr] = useState<string>('');
  const [cpuUsage, setCpuUsage] = useState<number>(14);
  const [memUsage, setMemUsage] = useState<number>(42);
  const [startContextMenuPos, setStartContextMenuPos] = useState<{ x: number; y: number } | null>(null);

  // Live clock and simulated CPU/RAM telemetry
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeStr(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
      setDateStr(now.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' }));
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

  // Filter windows in current workspace or pinned
  const currentWorkspaceWindows = windows.filter(
    w => w.workspaceId === activeWorkspaceId || w.isPinned
  );

  return (
    <header
      onClick={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.stopPropagation()}
      className={`h-12 w-full px-3 flex items-center justify-between border-t z-40 select-none backdrop-blur-2xl transition-all duration-300 ${
        taskbarPosition === 'top' ? 'order-first border-b border-t-0' : 'order-last'
      }`}
      style={{
        backgroundColor: themeConfig.taskbarBg,
        borderColor: themeConfig.windowBorder
      }}
    >
      {/* Left Section: Start Menu Button + Workspaces Pager + Exposé */}
      <div className="flex items-center gap-2">
        {/* Start Button */}
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
          className={`h-9 px-3 rounded-xl flex items-center gap-2 font-semibold text-xs transition-all duration-200 ${
            isStartMenuOpen
              ? 'bg-purple-600 text-white shadow-[0_0_15px_rgba(168,85,247,0.5)] scale-95'
              : 'bg-[#181a24] text-white hover:bg-[#232736] border border-[#2b3145]'
          }`}
        >
          {personality === 'linux' ? (
            <Terminal className="w-4 h-4 text-sky-400" />
          ) : personality === 'windows' ? (
            <div className="grid grid-cols-2 gap-0.5 w-3.5 h-3.5">
              <div className="bg-sky-400 rounded-xs" />
              <div className="bg-sky-400 rounded-xs" />
              <div className="bg-sky-400 rounded-xs" />
              <div className="bg-sky-400 rounded-xs" />
            </div>
          ) : (
            <Zap className="w-4 h-4 text-purple-400" />
          )}
          <span className="font-mono uppercase tracking-wider text-[11px] hidden sm:inline">
            {personality === 'linux' ? 'Application' : personality === 'windows' ? 'Start' : 'Matrix'}
          </span>
        </button>

        {/* Virtual Workspaces Pager (1, 2, 3, 4) */}
        <div className="flex items-center bg-[#0d0f16] p-1 rounded-xl border border-[#202538] gap-1">
          {workspaces.map((ws) => {
            const isActive = activeWorkspaceId === ws.id;
            const wsWinCount = windows.filter(w => w.workspaceId === ws.id).length;

            return (
              <button
                key={ws.id}
                onClick={() => switchWorkspace(ws.id)}
                className={`px-2.5 py-1 rounded-lg text-xs font-mono font-semibold transition-all relative ${
                  isActive
                    ? 'bg-purple-600 text-white shadow-sm'
                    : 'text-[#64748b] hover:text-[#e2e8f0] hover:bg-[#1a1e2e]'
                }`}
                title={`${ws.name} (${wsWinCount} open windows)`}
              >
                <span>{ws.id}</span>
                {wsWinCount > 0 && !isActive && (
                  <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-sky-400" />
                )}
              </button>
            );
          })}
        </div>

        {/* Exposé / Mission Control Overview Button */}
        <button
          onClick={() => toggleExpose()}
          className="p-2 rounded-xl bg-[#141722] hover:bg-[#202538] text-[#94a3b8] hover:text-white border border-[#23283c] transition-colors"
          title="Exposé / Mission Control (View all workspaces)"
        >
          <Grid2X2 className="w-4 h-4" />
        </button>
      </div>

      {/* Middle Section: Active Window Taskbar Buttons */}
      <div className="flex-1 flex items-center justify-center gap-1.5 px-4 overflow-x-auto max-w-2xl">
        {currentWorkspaceWindows.map((win) => {
          const isActive = activeWindowId === win.id && !win.isMinimized;
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
              className={`h-9 px-3 rounded-xl flex items-center gap-2 text-xs font-medium max-w-[160px] truncate transition-all duration-150 border ${
                isActive
                  ? 'bg-purple-950/70 border-purple-500 text-white shadow-[0_0_10px_rgba(168,85,247,0.3)]'
                  : win.isMinimized
                  ? 'bg-[#0f1118]/60 border-[#202538] text-[#64748b] hover:text-white'
                  : 'bg-[#151824] border-[#252b3e] text-[#cbd5e1] hover:bg-[#1e2335]'
              }`}
              title={win.title}
            >
              <div className="scale-75 shrink-0">
                <DesktopIconRenderer iconName={win.iconName} size={16} />
              </div>
              <span className="truncate font-mono text-[11px]">{win.title}</span>
            </button>
          );
        })}
      </div>

      {/* Right Section: System Telemetry, Tray & Clock */}
      <div className="flex items-center gap-2 font-mono">
        {/* Live Mini Hardware Meters */}
        <div className="hidden md:flex items-center gap-2 px-2.5 py-1 rounded-xl bg-[#0c0e15] border border-[#202538] text-[10px]">
          <div className="flex items-center gap-1">
            <Cpu className="w-3 h-3 text-purple-400" />
            <span className="text-white font-bold">{cpuUsage}%</span>
          </div>
          <div className="w-px h-3 bg-[#262d40]" />
          <div className="flex items-center gap-1">
            <Activity className="w-3 h-3 text-sky-400" />
            <span className="text-white font-bold">{memUsage}%</span>
          </div>
        </div>

        {/* Quick Settings Action Center Flyout Trigger */}
        <button
          onClick={() => toggleQuickSettings()}
          className={`h-9 px-2.5 rounded-xl flex items-center gap-2 border transition-all ${
            isQuickSettingsOpen
              ? 'bg-purple-600 text-white border-purple-400 shadow-md'
              : 'bg-[#141722] border-[#23283c] text-[#94a3b8] hover:text-white hover:bg-[#1e2335]'
          }`}
          title="Quick Settings (Wi-Fi, Volume, Power, Themes)"
        >
          <Wifi className="w-3.5 h-3.5 text-emerald-400" />
          <Volume2 className="w-3.5 h-3.5 text-sky-400" />
          <Settings className="w-3.5 h-3.5 text-purple-400" />
          {unreadNotificationsCount > 0 && (
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
          )}
        </button>

        {/* Date & Time */}
        <div
          onClick={() => openApp('system-config')}
          className="px-2.5 py-1 rounded-xl bg-[#141722] hover:bg-[#1e2335] border border-[#23283c] flex flex-col items-end text-right cursor-pointer transition-colors"
          title="Open Clock & Time Settings"
        >
          <span className="text-xs font-bold text-white tracking-wider leading-none">{timeStr}</span>
          <span className="text-[9px] text-[#64748b] leading-none mt-0.5">{dateStr}</span>
        </div>

        {/* Show Desktop Peek Strip */}
        <button
          onClick={minimizeAllWindows}
          className="w-2.5 h-8 rounded-r-md bg-[#1f2436] hover:bg-purple-500 transition-colors ml-0.5"
          title="Show Desktop (Minimize All)"
        />
      </div>

      {/* Start Button Right-Click Power Context Menu */}
      {startContextMenuPos && (
        <StartButtonContextMenu
          x={startContextMenuPos.x}
          y={startContextMenuPos.y}
          onClose={() => setStartContextMenuPos(null)}
        />
      )}
    </header>
  );
};
