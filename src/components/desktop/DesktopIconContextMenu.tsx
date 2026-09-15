// jb7572_2026-08-31: SecureCurtain Core Architecture - Desktop Icon & Folder Item Context Menu
import React from 'react';
import { useDesktop } from '../../context/DesktopContext';
import { DesktopIcon, AppId } from '../../types/desktop';
import { DesktopIconRenderer } from './DesktopIconRenderer';
import { 
  Play, 
  Trash2, 
  Pin, 
  PinOff, 
  Info, 
  Folder, 
  Ungroup, 
  Edit3, 
  Boxes,
  ExternalLink,
  Layers,
  Sparkles,
  Lock,
  X
} from 'lucide-react';

interface DesktopIconContextMenuProps {
  x: number;
  y: number;
  icon: DesktopIcon;
  onClose: () => void;
  onOpenFolder?: () => void;
}

export const DesktopIconContextMenu: React.FC<DesktopIconContextMenuProps> = ({
  x,
  y,
  icon,
  onClose,
  onOpenFolder
}) => {
  const {
    openApp,
    removeDesktopIcon,
    togglePinToTaskbar,
    docks,
    dissolveFolder,
    appCatalog,
    personality,
    themeConfig,
    addNotification
  } = useDesktop();

  // Adjust coordinates so the menu remains fully on-screen
  const adjustedX = Math.min(x, window.innerWidth - 240);
  const adjustedY = Math.min(y, window.innerHeight - 300);

  const meta = appCatalog[icon.appId];
  const primaryDock = docks.find(d => d.placement === 'bottom' || d.placement === 'floating-bottom') || docks[0];
  const isPinned = primaryDock ? primaryDock.pinnedAppIds.includes(icon.appId) : false;

  const displayName = icon.isFolder
    ? (icon.folderName || icon.label || 'Folder Box')
    : (personality === 'linux' ? meta?.linuxName : personality === 'windows' ? meta?.windowsName : meta?.title) || icon.label;

  const handleAction = (callback: () => void) => {
    callback();
    onClose();
  };

  return (
    <div
      onClick={(e) => e.stopPropagation()}
      style={{
        left: `${adjustedX}px`,
        top: `${adjustedY}px`,
        backgroundColor: themeConfig.windowBg,
        borderColor: themeConfig.accentHex
      }}
      className="fixed z-50 w-60 rounded-2xl border shadow-2xl p-1.5 backdrop-blur-2xl text-xs font-sans select-none animate-in fade-in zoom-in-95 duration-100 space-y-1"
    >
      {/* Header Info */}
      <div className="px-2.5 py-1.5 border-b border-white/10 flex items-center gap-2 mb-1">
        <div className="shrink-0 p-1 rounded-lg bg-white/10">
          <DesktopIconRenderer iconName={icon.isFolder ? 'Folder' : (meta?.iconName || icon.iconName)} size={16} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-bold text-white truncate">{displayName}</div>
          <div className="text-[10px] text-[#94a3b8] truncate">
            {icon.isFolder ? `${icon.folderAppIds?.length || 0} Apps bundled` : (meta?.category ? `Category: ${meta.category}` : 'Desktop Shortcut')}
          </div>
        </div>
      </div>

      {/* Action: Open / Launch */}
      {icon.isFolder ? (
        <button
          onClick={() => handleAction(() => onOpenFolder ? onOpenFolder() : null)}
          className="w-full px-2.5 py-1.5 rounded-xl bg-purple-600/20 hover:bg-purple-600/30 text-purple-200 border border-purple-500/30 flex items-center gap-2 text-left transition-colors font-semibold"
        >
          <Folder className="w-3.5 h-3.5 text-purple-300" />
          <span className="flex-1">Open Folder</span>
          <span className="text-[10px] text-purple-300/70 font-mono">2x Click</span>
        </button>
      ) : (
        <button
          onClick={() => handleAction(() => {
            if (icon.id === 'icon-launchpad') {
              openApp('health-hud', 'Mission Control: Apps Launchpad', { initialCategory: 'LAUNCHPAD' });
            } else if (icon.id === 'icon-drag-drop-installer') {
              openApp('package-features', 'Drag & Drop Package Installer', { initialTab: 'DRAG_DROP_INSTALLER' });
            } else {
              openApp(icon.appId);
            }
          })}
          className="w-full px-2.5 py-1.5 rounded-xl bg-purple-600/20 hover:bg-purple-600/30 text-purple-200 border border-purple-500/30 flex items-center gap-2 text-left transition-colors font-semibold"
        >
          <Play className="w-3.5 h-3.5 text-purple-300 fill-purple-300/40" />
          <span className="flex-1">Launch Application</span>
          <span className="text-[10px] text-purple-300/70 font-mono">Enter</span>
        </button>
      )}

      {/* Action: Dismiss / Remove from Desktop (or Locked Anchor) */}
      {icon.isPermanent ? (
        <div
          className="w-full px-2.5 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300/80 flex items-center gap-2 text-left font-medium cursor-not-allowed select-none"
          title="This link is permanent and locked to the desktop canvas"
        >
          <Lock className="w-3.5 h-3.5 text-amber-400" />
          <span className="flex-1">Permanent Desktop Link</span>
          <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 uppercase font-mono font-bold tracking-wider">Locked</span>
        </div>
      ) : (
        <button
          onClick={() => handleAction(() => removeDesktopIcon(icon.id))}
          className="w-full px-2.5 py-1.5 rounded-xl hover:bg-rose-500/20 text-rose-300 flex items-center gap-2 text-left transition-colors font-medium group"
        >
          <Trash2 className="w-3.5 h-3.5 text-rose-400 group-hover:scale-110 transition-transform" />
          <span className="flex-1">Remove from Desktop</span>
          <span className="text-[10px] text-rose-400/60 font-mono">Del</span>
        </button>
      )}

      {/* Folder specific actions */}
      {icon.isFolder && (
        <button
          onClick={() => handleAction(() => dissolveFolder(icon.id))}
          className="w-full px-2.5 py-1.5 rounded-xl hover:bg-white/10 text-white flex items-center gap-2 text-left transition-colors"
        >
          <Ungroup className="w-3.5 h-3.5 text-orange-400" />
          <span>Ungroup / Dissolve Folder</span>
        </button>
      )}

      {/* Taskbar pin toggle (for single apps) */}
      {!icon.isFolder && (
        <button
          onClick={() => handleAction(() => togglePinToTaskbar(icon.appId))}
          className="w-full px-2.5 py-1.5 rounded-xl hover:bg-white/10 text-white flex items-center gap-2 text-left transition-colors"
        >
          {isPinned ? (
            <>
              <PinOff className="w-3.5 h-3.5 text-amber-400" />
              <span>Unpin from Taskbar</span>
            </>
          ) : (
            <>
              <Pin className="w-3.5 h-3.5 text-emerald-400" />
              <span>Pin to Taskbar</span>
            </>
          )}
        </button>
      )}

      <div className="h-px bg-white/10 my-1" />

      {/* Properties / Specs info */}
      {!icon.isFolder && meta && (
        <button
          onClick={() => handleAction(() => {
            openApp('system-info', 'System Properties');
            addNotification({
              title: meta.title,
              message: `${meta.description} (CLI: ${personality === 'windows' ? meta.cliCommandWindows : meta.cliCommandLinux})`,
              type: 'info',
              appId: icon.appId
            });
          })}
          className="w-full px-2.5 py-1.5 rounded-xl hover:bg-white/10 text-[#94a3b8] hover:text-white flex items-center gap-2 text-left transition-colors"
        >
          <Info className="w-3.5 h-3.5 text-sky-400" />
          <span>Properties & CLI Info</span>
        </button>
      )}
    </div>
  );
};
