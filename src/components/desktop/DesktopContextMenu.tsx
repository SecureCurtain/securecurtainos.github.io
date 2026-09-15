// jb7572_2026-08-25: Desktop Right-Click Context Menu Engine

import React, { useState } from 'react';
import { useDesktop } from '../../context/DesktopContext';
import { AppId, AppMetadata } from '../../types/desktop';
import { DesktopIconRenderer } from './DesktopIconRenderer';
import { 
  Plus, 
  Palette, 
  Terminal, 
  RefreshCw, 
  Grid2X2, 
  Monitor, 
  Zap, 
  FolderPlus, 
  FileText, 
  Layers,
  Sparkles,
  Info,
  Boxes,
  Ungroup,
  Trash2,
  ChevronRight,
  Check,
  Search,
  Lock
} from 'lucide-react';

interface DesktopContextMenuProps {
  x: number;
  y: number;
  onClose: () => void;
}

export const DesktopContextMenu: React.FC<DesktopContextMenuProps> = ({ x, y, onClose }) => {
  const { 
    openApp, 
    toggleExpose, 
    personality, 
    setPersonality, 
    themeConfig,
    autoGroupIconsByCategory,
    ungroupAllFolders,
    addNotification,
    appCatalog,
    addDesktopIcon,
    isAppOnDesktop,
    desktopIcons,
    startScreensaver,
    lockSession,
    screensaverOnLockHotkey
  } = useDesktop();

  const [showAddMenu, setShowAddMenu] = useState(false);
  const [addSearch, setAddSearch] = useState('');

  // Ensure menu stays within screen bounds
  const adjustedX = Math.min(x, window.innerWidth - (showAddMenu ? 480 : 250));
  const adjustedY = Math.min(y, window.innerHeight - 440);

  const handleAction = (callback: () => void) => {
    callback();
    onClose();
  };

  const allApps = Object.values(appCatalog) as AppMetadata[];
  const filteredAddApps = allApps.filter(app => 
    !addSearch || 
    app.title.toLowerCase().includes(addSearch.toLowerCase()) || 
    app.description.toLowerCase().includes(addSearch.toLowerCase())
  );

  return (
    <div
      onClick={(e) => e.stopPropagation()}
      style={{
        left: `${adjustedX}px`,
        top: `${adjustedY}px`,
        backgroundColor: themeConfig.windowBg,
        borderColor: themeConfig.accentHex
      }}
      className="fixed z-50 w-58 rounded-2xl border shadow-2xl p-1.5 backdrop-blur-2xl text-xs font-sans select-none animate-in fade-in zoom-in-95 duration-100 space-y-1 flex"
    >
      <div className="w-full space-y-1">
        {/* Add Shortcut to Desktop item with flyout trigger */}
        <div className="relative">
          <button
            onClick={() => setShowAddMenu(!showAddMenu)}
            onMouseEnter={() => setShowAddMenu(true)}
            className={`w-full px-2.5 py-1.5 rounded-xl border flex items-center justify-between transition-colors font-semibold ${
              showAddMenu 
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' 
                : 'bg-emerald-950/40 hover:bg-emerald-900/50 text-emerald-300 border-emerald-800/40'
            }`}
          >
            <div className="flex items-center gap-2">
              <Plus className="w-3.5 h-3.5 text-emerald-400 font-bold" />
              <span>Add Shortcut to Desktop</span>
            </div>
            <ChevronRight className="w-3.5 h-3.5 text-emerald-400/80" />
          </button>

          {/* Submenu Popout */}
          {showAddMenu && (
            <div
              style={{
                backgroundColor: themeConfig.windowBg,
                borderColor: themeConfig.accentHex
              }}
              className="absolute left-full top-0 ml-1.5 w-64 max-h-[380px] rounded-2xl border shadow-2xl p-2 backdrop-blur-2xl flex flex-col space-y-1.5 z-50 animate-in fade-in zoom-in-95 duration-100"
            >
              <div className="flex items-center justify-between pb-1 border-b border-white/10 text-[11px] font-bold text-white">
                <span>Choose App Shortcut</span>
                <span className="text-[10px] text-[#94a3b8] font-mono">{desktopIcons.length} on Desktop</span>
              </div>

              <div className="relative">
                <input
                  type="text"
                  value={addSearch}
                  onChange={(e) => setAddSearch(e.target.value)}
                  placeholder="Filter apps..."
                  autoFocus
                  className="w-full pl-7 pr-2 py-1 text-[11px] rounded-lg bg-black/40 border border-white/10 text-white placeholder-white/40 focus:outline-none focus:border-emerald-500 font-mono"
                />
                <Search className="w-3 h-3 text-white/40 absolute left-2 top-1.5" />
              </div>

              <div className="overflow-y-auto max-h-[280px] space-y-1 pr-0.5 custom-scrollbar">
                {filteredAddApps.map((app) => {
                  const onDesktop = isAppOnDesktop(app.id);
                  return (
                    <button
                      key={app.id}
                      onClick={() => {
                        addDesktopIcon(app.id);
                        onClose();
                      }}
                      className={`w-full px-2 py-1.5 rounded-lg flex items-center justify-between text-left transition-all ${
                        onDesktop
                          ? 'bg-white/5 text-white/50 hover:bg-white/10 hover:text-white'
                          : 'hover:bg-emerald-500/20 hover:text-emerald-200 text-white'
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <DesktopIconRenderer iconName={app.iconName} size={16} />
                        <span className="truncate text-xs font-medium">{app.title}</span>
                      </div>
                      {onDesktop ? (
                        <span className="text-[9px] font-mono text-emerald-400 flex items-center gap-0.5 shrink-0">
                          <Check className="w-2.5 h-2.5" /> Added
                        </span>
                      ) : (
                        <span className="text-[9px] font-mono text-emerald-400 opacity-0 group-hover:opacity-100 flex items-center gap-0.5 shrink-0">
                          <Plus className="w-2.5 h-2.5" /> Add
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        <button
          onClick={() => handleAction(() => openApp('health-hud', 'Mission Control Cockpit'))}
          className="w-full px-2.5 py-1.5 rounded-xl bg-purple-600/20 hover:bg-purple-600/30 text-purple-200 border border-purple-500/30 flex items-center gap-2 text-left transition-colors font-semibold"
        >
          <Zap className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
          <span>Mission Control Cockpit</span>
        </button>

        <button
          onClick={() => handleAction(() => openApp('recycle-bin', 'Recycle Bin & Trash'))}
          className="w-full px-2.5 py-1.5 rounded-xl hover:bg-rose-500/20 text-rose-300 flex items-center gap-2 text-left transition-colors"
        >
          <Trash2 className="w-3.5 h-3.5 text-rose-400" />
          <span>Open Recycle Bin</span>
        </button>

        <button
          onClick={() => handleAction(() => openApp('terminal'))}
          className="w-full px-2.5 py-1.5 rounded-xl hover:bg-white/10 text-white flex items-center gap-2 text-left transition-colors"
        >
          <Terminal className="w-3.5 h-3.5 text-purple-400" />
          <span>Open Terminal Here</span>
        </button>

        <button
          onClick={() => handleAction(() => openApp('file-explorer'))}
          className="w-full px-2.5 py-1.5 rounded-xl hover:bg-white/10 text-white flex items-center gap-2 text-left transition-colors"
        >
          <FolderPlus className="w-3.5 h-3.5 text-sky-400" />
          <span>Open File Explorer</span>
        </button>

        <button
          onClick={() => handleAction(() => openApp('notepad'))}
          className="w-full px-2.5 py-1.5 rounded-xl hover:bg-white/10 text-white flex items-center gap-2 text-left transition-colors"
        >
          <FileText className="w-3.5 h-3.5 text-amber-400" />
          <span>New Scratchpad Note</span>
        </button>

        <div className="h-px bg-white/10 my-1" />

        {/* Android Folder Localizer Quick Actions */}
        <button
          onClick={() => handleAction(() => {
            autoGroupIconsByCategory();
            addNotification({
              title: 'Desktop Localized',
              message: 'Organized all desktop icons into smart Android-style category folder boxes.',
              type: 'success'
            });
          })}
          className="w-full px-2.5 py-1.5 rounded-xl hover:bg-white/10 text-white flex items-center gap-2 text-left transition-colors"
        >
          <Boxes className="w-3.5 h-3.5 text-pink-400" />
          <span>Auto-Group into Folder Boxes</span>
        </button>

        <button
          onClick={() => handleAction(() => {
            ungroupAllFolders();
            addNotification({
              title: 'Desktop Reset',
              message: 'Unpacked all folder boxes back into individual desktop icons.',
              type: 'info'
            });
          })}
          className="w-full px-2.5 py-1.5 rounded-xl hover:bg-white/10 text-white flex items-center gap-2 text-left transition-colors"
        >
          <Ungroup className="w-3.5 h-3.5 text-orange-400" />
          <span>Ungroup All Folder Boxes</span>
        </button>

        <div className="h-px bg-white/10 my-1" />

        <button
          onClick={() => handleAction(() => toggleExpose(true))}
          className="w-full px-2.5 py-1.5 rounded-xl hover:bg-white/10 text-white flex items-center gap-2 text-left transition-colors"
        >
          <Grid2X2 className="w-3.5 h-3.5 text-emerald-400" />
          <span>Mission Control (Exposé)</span>
        </button>

        <button
          onClick={() => handleAction(() => {
            const next = personality === 'linux' ? 'windows' : personality === 'windows' ? 'hybrid' : 'linux';
            setPersonality(next);
          })}
          className="w-full px-2.5 py-1.5 rounded-xl hover:bg-white/10 text-white flex items-center gap-2 text-left transition-colors"
        >
          <Monitor className="w-3.5 h-3.5 text-cyan-400" />
          <span>Switch Persona: <span className="capitalize font-bold">{personality}</span></span>
        </button>

        <button
          onClick={() => handleAction(() => openApp('theme-studio'))}
          className="w-full px-2.5 py-1.5 rounded-xl hover:bg-white/10 text-white flex items-center gap-2 text-left transition-colors"
        >
          <Palette className="w-3.5 h-3.5 text-purple-400" />
          <span>Customize Docks & Themes</span>
        </button>

        <button
          onClick={() => handleAction(() => startScreensaver())}
          className="w-full px-2.5 py-1.5 rounded-xl hover:bg-emerald-500/20 text-emerald-300 flex items-center gap-2 text-left transition-colors font-semibold"
        >
          <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
          <span>Launch Tux Screensaver</span>
        </button>

        <button
          onClick={() => handleAction(() => {
            lockSession();
            if (screensaverOnLockHotkey) {
              startScreensaver();
            }
          })}
          className="w-full px-2.5 py-1.5 rounded-xl hover:bg-amber-500/20 text-amber-300 flex items-center justify-between text-left transition-colors font-semibold"
        >
          <div className="flex items-center gap-2">
            <Lock className="w-3.5 h-3.5 text-amber-400" />
            <span>Lock Screen</span>
          </div>
          <kbd className="px-1.5 py-0.5 rounded bg-black/40 text-[10px] font-mono text-amber-200 border border-amber-500/30">
            Ctrl+L
          </kbd>
        </button>

        <div className="h-px bg-white/10 my-1" />

        <button
          onClick={() => handleAction(() => openApp('system-info'))}
          className="w-full px-2.5 py-1.5 rounded-xl hover:bg-white/10 text-white flex items-center gap-2 text-left transition-colors"
        >
          <Info className="w-3.5 h-3.5 text-[#94a3b8]" />
          <span>System Properties</span>
        </button>
      </div>
    </div>
  );
};
