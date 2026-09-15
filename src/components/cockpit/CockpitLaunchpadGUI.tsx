// jb7572_2026-08-27: SecureCurtain Core Architecture - Mission Control Cockpit Relocated Desktop Launchpad
import React, { useState } from 'react';
import { useDesktop } from '../../context/DesktopContext';
import { AppId, AppMetadata } from '../../types/desktop';
import { DesktopIconRenderer } from '../desktop/DesktopIconRenderer';
import { 
  Search, 
  Play, 
  Terminal, 
  Layers, 
  Zap, 
  Sparkles, 
  ExternalLink, 
  FolderPlus, 
  ShieldCheck, 
  Cpu, 
  HardDrive, 
  Settings, 
  Activity,
  Binary,
  Volume2,
  CheckCircle2,
  Plus,
  Trash2,
  Pin,
  PinOff,
  Check
} from 'lucide-react';

interface CockpitLaunchpadGUIProps {
  onRunCliCommand?: (cmd: string) => void;
}

export const CockpitLaunchpadGUI: React.FC<CockpitLaunchpadGUIProps> = ({ onRunCliCommand }) => {
  const { 
    appCatalog, 
    personality, 
    openApp, 
    addNotification, 
    addDesktopIcon, 
    removeDesktopIcon, 
    isAppOnDesktop, 
    togglePinToTaskbar,
    docks,
    themeConfig 
  } = useDesktop();

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [contextApp, setContextApp] = useState<{ app: AppMetadata; x: number; y: number } | null>(null);

  const allApps = Object.values(appCatalog) as AppMetadata[];
  const primaryDock = docks.find(d => d.placement === 'bottom' || d.placement === 'floating-bottom') || docks[0];

  const filteredApps = allApps.filter((app) => {
    const matchesSearch =
      app.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.linuxName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.windowsName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.cliCommandLinux.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.cliCommandWindows.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory = selectedCategory === 'all' || app.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  const handleLaunch = (appId: AppId) => {
    openApp(appId);
    const meta = appCatalog[appId];
    addNotification({
      title: 'Launched from Cockpit',
      message: `Opened ${meta ? meta.title : appId} window.`,
      type: 'info',
      appId: appId
    });
  };

  return (
    <div 
      onClick={() => setContextApp(null)}
      className="space-y-5 font-sans select-none text-white relative"
    >
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-[#12121e] via-[#161729] to-[#101018] border border-purple-900/40 rounded-2xl p-5 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-full bg-purple-600/5 blur-3xl pointer-events-none" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="p-3 rounded-2xl bg-purple-600/20 border border-purple-500/40 text-purple-300 shadow-inner">
              <Zap className="w-6 h-6 text-purple-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white tracking-wide">
                  Cockpit Applications & Desktop Launchpad
                </h2>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-950 text-purple-300 border border-purple-700/50 font-mono flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-purple-400" />
                  {allApps.length} Apps Centralized
                </span>
              </div>
              <p className="text-xs text-[#94a3b8] mt-0.5">
                All primary OS icons, system utilities, and developer suites — right-click any card to add or dismiss desktop shortcuts
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative w-full md:w-64">
              <Search className="w-4 h-4 text-white/40 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search apps & tools..."
                className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-black/50 border border-white/15 text-xs text-white placeholder-white/40 focus:outline-none focus:border-purple-500 font-mono shadow-inner"
              />
            </div>
          </div>
        </div>

        {/* Category Filters */}
        <div className="flex items-center gap-1.5 mt-4 pt-3 border-t border-white/10 overflow-x-auto text-[11px] font-mono">
          {[
            { id: 'all', label: `All Tools (${allApps.length})` },
            { id: 'core', label: 'Core & Vitals' },
            { id: 'system', label: 'System & Daemons' },
            { id: 'dev', label: 'Kernel & Dev' },
            { id: 'tools', label: 'Utilities & Media' }
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3 py-1 rounded-xl transition-all whitespace-nowrap ${
                selectedCategory === cat.id
                  ? 'bg-purple-600 text-white font-semibold shadow-md shadow-purple-900/30'
                  : 'bg-white/5 hover:bg-white/10 text-white/70 hover:text-white border border-white/5'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Apps Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3.5 relative">
        {filteredApps.length === 0 ? (
          <div className="col-span-full py-16 text-center text-[#94a3b8] text-xs font-mono bg-[#0c0d14] border border-[#202538] rounded-2xl">
            No matching applications found.
          </div>
        ) : (
          filteredApps.map((app) => {
            const displayName =
              personality === 'linux' ? app.linuxName :
              personality === 'windows' ? app.windowsName :
              app.title;
            const cliCmd = personality === 'windows' ? app.cliCommandWindows : app.cliCommandLinux;
            const onDesktop = isAppOnDesktop(app.id);

            return (
              <div
                key={app.id}
                onClick={() => handleLaunch(app.id)}
                onContextMenu={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setContextApp({ app, x: e.clientX, y: e.clientY });
                }}
                className="p-4 rounded-2xl bg-[#0e101a]/90 hover:bg-[#151829] border border-[#20253a] hover:border-purple-500/60 shadow-lg hover:shadow-2xl transition-all duration-200 cursor-pointer flex flex-col justify-between group hover:-translate-y-0.5 relative overflow-hidden"
              >
                {/* Subtle Hover Gradient Accent */}
                <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />

                <div>
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="p-2.5 rounded-xl bg-[#181a2e] border border-[#2b3050] group-hover:scale-105 group-hover:border-purple-500/40 transition-all shadow-md shrink-0">
                      <DesktopIconRenderer iconName={app.iconName} size={28} />
                    </div>

                    <div className="flex flex-col items-end gap-1">
                      <div className="flex items-center gap-1">
                        {onDesktop && (
                          <span className="text-[8px] font-mono px-1.5 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-0.5">
                            <Check className="w-2 h-2" /> Desktop
                          </span>
                        )}
                        <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-purple-950/80 text-purple-300 border border-purple-800/40 uppercase font-semibold">
                          {app.category}
                        </span>
                      </div>
                      {app.badge && (
                        <span className="text-[8px] font-mono px-1.5 py-0.2 rounded-full bg-amber-950/80 text-amber-300 border border-amber-700/40">
                          {app.badge}
                        </span>
                      )}
                    </div>
                  </div>

                  <h3 className="text-xs font-bold text-white group-hover:text-purple-300 transition-colors line-clamp-1">
                    {displayName}
                  </h3>
                  <p className="text-[11px] text-[#94a3b8] line-clamp-2 mt-1 leading-relaxed">
                    {app.description}
                  </p>
                </div>

                <div className="pt-3 mt-3 border-t border-[#1c2035] flex items-center justify-between text-[10px] font-mono">
                  <span className="text-purple-400/80 truncate max-w-[130px]" title={cliCmd}>
                    CLI: {cliCmd}
                  </span>

                  <div className="flex items-center gap-1.5 shrink-0">
                    {/* Quick Desktop Add / Dismiss Button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (onDesktop) {
                          removeDesktopIcon(app.id);
                        } else {
                          addDesktopIcon(app.id);
                        }
                      }}
                      className={`p-1 rounded-md border transition-all ${
                        onDesktop
                          ? 'bg-rose-500/10 hover:bg-rose-500/30 text-rose-300 border-rose-500/30'
                          : 'bg-emerald-500/10 hover:bg-emerald-500/30 text-emerald-300 border-emerald-500/30'
                      }`}
                      title={onDesktop ? 'Dismiss from Desktop Canvas' : 'Add Shortcut to Desktop Canvas'}
                    >
                      {onDesktop ? <Trash2 className="w-3 h-3 text-rose-400" /> : <Plus className="w-3 h-3 text-emerald-400" />}
                    </button>

                    {onRunCliCommand && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onRunCliCommand(cliCmd);
                        }}
                        className="p-1 rounded-md bg-[#1a1d30] hover:bg-purple-600 text-[#94a3b8] hover:text-white transition-colors"
                        title={`Run '${cliCmd}' in Cockpit Terminal`}
                      >
                        <Terminal className="w-3 h-3" />
                      </button>
                    )}

                    <span className="flex items-center gap-1 text-white/80 group-hover:text-purple-300 font-semibold">
                      <span>Launch</span>
                      <ExternalLink className="w-3 h-3 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                    </span>
                  </div>
                </div>
              </div>
            );
          })
        )}

        {/* Cockpit Card Context Menu */}
        {contextApp && (
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              left: `${Math.min(contextApp.x - 40, window.innerWidth - 240)}px`,
              top: `${Math.min(contextApp.y - 100, window.innerHeight - 200)}px`,
              backgroundColor: themeConfig.windowBg,
              borderColor: themeConfig.accentHex
            }}
            className="fixed z-50 w-56 rounded-2xl border shadow-2xl p-1.5 backdrop-blur-2xl text-xs font-sans select-none animate-in fade-in zoom-in-95 duration-100 space-y-1"
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

            {onRunCliCommand && (
              <button
                onClick={() => {
                  const cmd = personality === 'windows' ? contextApp.app.cliCommandWindows : contextApp.app.cliCommandLinux;
                  onRunCliCommand(cmd);
                  setContextApp(null);
                }}
                className="w-full px-2 py-1.5 rounded-xl hover:bg-white/10 text-[#94a3b8] hover:text-white flex items-center gap-2 text-left transition-colors font-medium"
              >
                <Terminal className="w-3.5 h-3.5 text-purple-400" />
                <span>Run in Terminal</span>
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
