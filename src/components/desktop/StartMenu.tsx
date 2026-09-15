// jb7572_2026-08-25: Multi-Personality Start Menu & Application Launcher

import React, { useState } from 'react';
import { useDesktop } from '../../context/DesktopContext';
import { APP_CATALOG } from '../../data/desktopThemes';
import { DesktopIconRenderer } from './DesktopIconRenderer';
import { AppId, AppMetadata } from '../../types/desktop';
import { 
  Search, 
  Power, 
  RotateCcw, 
  Lock, 
  Settings, 
  User, 
  Terminal, 
  Cpu, 
  ShieldCheck, 
  Folder, 
  Zap,
  Sparkles,
  Layers,
  CheckCircle2,
  LogOut,
  LayoutGrid,
  Plus,
  Trash2,
  Pin,
  PinOff,
  Play,
  Info,
  Check
} from 'lucide-react';

export const StartMenu: React.FC = () => {
  const { 
    personality, 
    setPersonality,
    themeConfig, 
    isStartMenuOpen, 
    toggleStartMenu, 
    openApp,
    appCatalog,
    lockSession,
    rebootOS,
    replayCurtainsReveal,
    addNotification,
    addDesktopIcon,
    removeDesktopIcon,
    isAppOnDesktop,
    togglePinToTaskbar,
    docks
  } = useDesktop();

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [contextApp, setContextApp] = useState<{ app: AppMetadata; x: number; y: number } | null>(null);

  if (!isStartMenuOpen) return null;

  const apps = (Object.values(appCatalog) as AppMetadata[]).filter(app => {
    const matchesSearch = 
      app.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.linuxName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.windowsName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.cliCommandLinux.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory = selectedCategory === 'all' || app.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  const handleLaunch = (appId: AppId) => {
    openApp(appId);
    toggleStartMenu(false);
  };

  const primaryDock = docks.find(d => d.placement === 'bottom' || d.placement === 'floating-bottom') || docks[0];

  return (
    <div
      onClick={(e) => e.stopPropagation()}
      className="absolute bottom-14 left-3 w-[460px] sm:w-[580px] max-h-[620px] rounded-3xl border shadow-2xl z-50 flex flex-col overflow-hidden backdrop-blur-2xl transition-all font-sans select-none animate-in fade-in zoom-in-95 duration-150"
      style={{
        backgroundColor: themeConfig.windowBg,
        borderColor: themeConfig.accentHex,
        boxShadow: `0 25px 50px -12px rgba(0, 0, 0, 0.8), 0 0 30px ${themeConfig.accentHex}33`
      }}
    >
      {/* Search Header */}
      <div className="p-4 border-b border-white/10 bg-black/20">
        <div className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={
              personality === 'linux' ? 'Search applications or run commands (e.g. btop, gdb)...' :
              personality === 'windows' ? 'Type here to search apps, files, settings...' :
              'Type to query system matrix & launch tools...'
            }
            autoFocus
            className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-black/40 border border-white/10 text-white placeholder-white/40 text-xs font-mono focus:outline-none focus:border-purple-500 shadow-inner"
          />
          <Search className="w-4 h-4 text-white/50 absolute left-3.5 top-3" />
        </div>
      </div>

      {/* Category Tabs */}
      <div className="px-4 py-2 flex items-center gap-1.5 border-b border-white/5 bg-black/10 overflow-x-auto text-[11px] font-mono">
        {[
          { id: 'all', label: 'All Apps' },
          { id: 'core', label: 'Core / Vitals' },
          { id: 'system', label: 'System & Daemons' },
          { id: 'dev', label: 'Kernel & Debugger' },
          { id: 'tools', label: 'Tools & Utilities' }
        ].map((cat) => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategory(cat.id)}
            className={`px-3 py-1 rounded-xl transition-all whitespace-nowrap ${
              selectedCategory === cat.id
                ? 'bg-purple-600 text-white font-semibold shadow-xs'
                : 'text-white/60 hover:text-white hover:bg-white/5'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Applications Grid */}
      <div 
        onClick={() => setContextApp(null)}
        className="flex-1 p-4 overflow-y-auto max-h-[380px] grid grid-cols-1 sm:grid-cols-2 gap-2.5 relative"
      >
        {apps.length === 0 ? (
          <div className="col-span-2 py-12 text-center text-white/40 text-xs font-mono">
            No matching applications found.
          </div>
        ) : (
          apps.map((app) => {
            const displayName = 
              personality === 'linux' ? app.linuxName :
              personality === 'windows' ? app.windowsName :
              app.title;

            const onDesktop = isAppOnDesktop(app.id);
            const isPinned = primaryDock?.pinnedAppIds.includes(app.id);

            return (
              <div
                key={app.id}
                onClick={() => handleLaunch(app.id)}
                onContextMenu={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setContextApp({ app, x: e.clientX, y: e.clientY });
                }}
                className="group p-3 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/5 hover:border-purple-500/50 flex items-start gap-3 text-left transition-all cursor-pointer relative select-none"
              >
                <div className="shrink-0 scale-90 group-hover:scale-100 transition-transform mt-0.5">
                  <DesktopIconRenderer iconName={app.iconName} size={22} />
                </div>
                <div className="flex-1 min-w-0 pr-6">
                  <div className="font-semibold text-xs text-white truncate group-hover:text-purple-300 transition-colors flex items-center gap-1.5">
                    <span className="truncate">{displayName}</span>
                    {onDesktop && (
                      <span className="shrink-0 px-1 py-0.2 rounded text-[8px] font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                        Desktop
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-white/60 line-clamp-2 leading-tight mt-0.5">
                    {app.description}
                  </p>
                  <div className="text-[9px] font-mono text-purple-400/80 mt-1">
                    CLI: {personality === 'windows' ? app.cliCommandWindows : app.cliCommandLinux}
                  </div>
                </div>

                {/* Direct 1-Click Desktop Pin / Dismiss Quick Button */}
                <div className="absolute top-2 right-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (onDesktop) {
                        removeDesktopIcon(app.id);
                      } else {
                        addDesktopIcon(app.id);
                      }
                    }}
                    title={onDesktop ? "Dismiss icon from Desktop" : "Add shortcut to Desktop"}
                    className={`p-1.5 rounded-lg border transition-all ${
                      onDesktop
                        ? 'bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border-rose-500/30'
                        : 'bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border-emerald-500/30'
                    }`}
                  >
                    {onDesktop ? <Trash2 className="w-3 h-3 text-rose-400" /> : <Plus className="w-3 h-3 text-emerald-400" />}
                  </button>
                </div>
              </div>
            );
          })
        )}

        {/* Start Menu App Context Menu Popover */}
        {contextApp && (
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              left: `${Math.min(contextApp.x - 20, 260)}px`,
              top: `${Math.min(contextApp.y - 120, 220)}px`,
              backgroundColor: themeConfig.windowBg,
              borderColor: themeConfig.accentHex
            }}
            className="fixed z-50 w-52 rounded-2xl border shadow-2xl p-1.5 backdrop-blur-2xl text-xs font-sans select-none animate-in fade-in zoom-in-95 duration-100 space-y-1"
          >
            <div className="px-2.5 py-1 text-[11px] font-bold text-white border-b border-white/10 flex items-center gap-1.5">
              <DesktopIconRenderer iconName={contextApp.app.iconName} size={14} />
              <span className="truncate">{contextApp.app.title}</span>
            </div>

            <button
              onClick={() => {
                handleLaunch(contextApp.app.id);
                setContextApp(null);
              }}
              className="w-full px-2 py-1.5 rounded-xl hover:bg-purple-600/20 text-purple-300 flex items-center gap-2 text-left transition-colors font-medium"
            >
              <Play className="w-3.5 h-3.5 text-purple-400 fill-purple-400/40" />
              <span>Launch App</span>
            </button>

            {/* Desktop Add / Remove Toggle */}
            <button
              onClick={() => {
                if (isAppOnDesktop(contextApp.app.id)) {
                  removeDesktopIcon(contextApp.app.id);
                } else {
                  addDesktopIcon(contextApp.app.id);
                }
                setContextApp(null);
              }}
              className="w-full px-2 py-1.5 rounded-xl hover:bg-white/10 text-white flex items-center gap-2 text-left transition-colors font-medium"
            >
              {isAppOnDesktop(contextApp.app.id) ? (
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

            {/* Taskbar Pin / Unpin Toggle */}
            <button
              onClick={() => {
                togglePinToTaskbar(contextApp.app.id);
                setContextApp(null);
              }}
              className="w-full px-2 py-1.5 rounded-xl hover:bg-white/10 text-white flex items-center gap-2 text-left transition-colors font-medium"
            >
              {primaryDock?.pinnedAppIds.includes(contextApp.app.id) ? (
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
          </div>
        )}
      </div>

      {/* Footer User Profile & Power Controls */}
      <div className="p-3 border-t border-white/10 bg-black/50 flex flex-wrap items-center justify-between gap-2">
        {/* User Card & Persona Indicator */}
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-sky-500 flex items-center justify-center text-white font-bold text-xs shadow-md shrink-0">
            OS
          </div>
          <div>
            <div className="text-xs font-bold text-white leading-none">Architect Root</div>
            <span className="text-[10px] font-mono text-purple-400 capitalize">
              {personality} Mode
            </span>
          </div>
        </div>

        {/* Pinned Links & Quick Power Actions */}
        <div className="flex items-center gap-1">
          {/* PINNED MISSION CONTROL COCKPIT LINK */}
          <button
            id="btn_start_menu_pinned_cockpit"
            onClick={() => {
              toggleStartMenu(false);
              openApp('health-hud', 'Mission Control Cockpit');
            }}
            className="px-2.5 py-1.5 rounded-xl bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-purple-900/50 border border-purple-400/40 transition-all hover:scale-105 mr-1"
            title="Mission Control Cockpit - All Applications & Telemetry"
          >
            <Zap className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
            <span className="font-mono text-[11px] tracking-wide">Cockpit</span>
          </button>

          {/* Change User / Switch Persona */}
          <button
            onClick={() => {
              const next = personality === 'linux' ? 'windows' : personality === 'windows' ? 'hybrid' : 'linux';
              setPersonality(next);
              addNotification({
                title: 'Persona Changed',
                message: `Active OS persona switched to ${next.toUpperCase()}`,
                type: 'info'
              });
            }}
            className="p-1.5 rounded-xl hover:bg-cyan-500/20 text-cyan-400 hover:text-cyan-300 transition-colors"
            title={`Change User / Switch Persona (Current: ${personality})`}
          >
            <User className="w-4 h-4" />
          </button>

          {/* Settings */}
          <button
            onClick={() => handleLaunch('theme-studio')}
            className="p-1.5 rounded-xl hover:bg-white/10 text-white/70 hover:text-white transition-colors"
            title="Personalization Settings"
          >
            <Settings className="w-4 h-4" />
          </button>

          {/* Terminal */}
          <button
            onClick={() => handleLaunch('terminal')}
            className="p-1.5 rounded-xl hover:bg-white/10 text-white/70 hover:text-white transition-colors"
            title="Open Interactive Shell"
          >
            <Terminal className="w-4 h-4" />
          </button>

          {/* Lock Session */}
          <button
            onClick={() => {
              toggleStartMenu(false);
              lockSession();
            }}
            className="p-1.5 rounded-xl hover:bg-purple-500/20 text-purple-400 hover:text-purple-300 transition-colors"
            title="Lock Session"
          >
            <Lock className="w-4 h-4" />
          </button>

          {/* Log Off */}
          <button
            onClick={() => {
              toggleStartMenu(false);
              lockSession();
              addNotification({
                title: 'Logged Out',
                message: 'Logged off current Architect user session.',
                type: 'info'
              });
            }}
            className="p-1.5 rounded-xl hover:bg-white/10 text-[#94a3b8] hover:text-white transition-colors"
            title="Log Off User"
          >
            <LogOut className="w-4 h-4" />
          </button>

          {/* Restart / Reboot */}
          <button
            onClick={() => {
              toggleStartMenu(false);
              rebootOS();
            }}
            className="p-1.5 rounded-xl hover:bg-amber-500/20 text-amber-400 hover:text-amber-300 transition-colors"
            title="Restart / Reboot OS"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          {/* Power Off / Shutdown */}
          <button
            onClick={() => {
              toggleStartMenu(false);
              addNotification({
                title: 'System Shutting Down',
                message: 'All microkernel daemons dismounting cleanly...',
                type: 'warning'
              });
              setTimeout(() => lockSession(), 800);
            }}
            className="p-1.5 rounded-xl hover:bg-red-500/20 text-red-400 hover:text-red-300 transition-colors"
            title="Power Off / Shutdown"
          >
            <Power className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
