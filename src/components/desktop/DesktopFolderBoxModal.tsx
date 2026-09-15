// jb7572_2026-08-25: Android-Style Desktop Folder Box Modal / Expanded Localizer Engine
// Displays high-fidelity app grid with inline renaming, single-click launch, extraction & custom accents

import React, { useState, useRef, useEffect } from 'react';
import { useDesktop } from '../../context/DesktopContext';
import { DesktopIcon, AppId } from '../../types/desktop';
import { DesktopIconRenderer } from './DesktopIconRenderer';
import { 
  X, 
  Trash2, 
  ExternalLink, 
  Plus, 
  FolderMinus, 
  Check, 
  Edit2, 
  Sparkles, 
  Layers, 
  Folder,
  ArrowUpRight
} from 'lucide-react';

interface DesktopFolderBoxModalProps {
  folder: DesktopIcon;
  onClose: () => void;
}

const COLOR_PRESETS = [
  { name: 'Candy Pink', hex: '#ec4899', class: 'bg-pink-500 ring-pink-400' },
  { name: 'Azure Blue', hex: '#3b82f6', class: 'bg-blue-500 ring-blue-400' },
  { name: 'Purple Violet', hex: '#8b5cf6', class: 'bg-purple-500 ring-purple-400' },
  { name: 'Mint Emerald', hex: '#10b981', class: 'bg-emerald-500 ring-emerald-400' },
  { name: 'Amber Orange', hex: '#f59e0b', class: 'bg-amber-500 ring-amber-400' },
  { name: 'Obsidian Slate', hex: '#64748b', class: 'bg-slate-500 ring-slate-400' }
];

export const DesktopFolderBoxModal: React.FC<DesktopFolderBoxModalProps> = ({ folder, onClose }) => {
  const { 
    appCatalog, 
    openApp, 
    removeAppFromFolder, 
    dissolveFolder, 
    renameFolder, 
    setFolderColor,
    addAppToFolder,
    addNotification,
    themeConfig,
    personality
  } = useDesktop();

  const [isEditingName, setIsEditingName] = useState(false);
  const [folderNameInput, setFolderNameInput] = useState(folder.folderName || folder.label || 'App Folder');
  const [isAddingApps, setIsAddingApps] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditingName && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditingName]);

  const handleNameSave = () => {
    const trimmed = folderNameInput.trim();
    if (trimmed) {
      renameFolder(folder.id, trimmed);
    } else {
      setFolderNameInput(folder.folderName || folder.label || 'App Folder');
    }
    setIsEditingName(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleNameSave();
    } else if (e.key === 'Escape') {
      setFolderNameInput(folder.folderName || folder.label || 'App Folder');
      setIsEditingName(false);
    }
  };

  const appIds = folder.folderAppIds || [folder.appId];

  // List of all catalog apps not currently inside this folder
  const availableAppsToAdd = Object.keys(appCatalog).filter(
    (appId) => !appIds.includes(appId as AppId)
  ) as AppId[];

  const handleLaunchApp = (appId: AppId) => {
    openApp(appId);
    onClose();
  };

  const handleExtractApp = (appId: AppId, e: React.MouseEvent) => {
    e.stopPropagation();
    const meta = appCatalog[appId];
    removeAppFromFolder(folder.id, appId);
    addNotification({
      title: 'App Extracted',
      message: `Extracted '${meta?.title || appId}' back to the desktop grid.`,
      type: 'info',
      appId
    });
  };

  const handleDissolveBox = () => {
    dissolveFolder(folder.id);
    addNotification({
      title: 'Folder Box Dissolved',
      message: `Extracted all ${appIds.length} apps back onto the desktop canvas.`,
      type: 'info'
    });
    onClose();
  };

  const activeColor = folder.folderColor || themeConfig.accentHex || '#8b5cf6';

  return (
    <div 
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-200"
    >
      <div 
        onClick={(e) => e.stopPropagation()}
        style={{
          backgroundColor: themeConfig.windowBg || 'rgba(15, 17, 26, 0.95)',
          borderColor: activeColor
        }}
        className="relative w-full max-w-lg rounded-3xl border shadow-2xl p-6 backdrop-blur-2xl text-white select-none animate-in zoom-in-95 duration-200 flex flex-col space-y-6"
      >
        {/* Top Header with Folder Title & Close Button */}
        <div className="flex items-center justify-between gap-4 border-b border-white/10 pb-4">
          <div className="flex items-center gap-3 flex-1">
            <div 
              style={{ backgroundColor: `${activeColor}25`, borderColor: activeColor }}
              className="p-2.5 rounded-2xl border flex items-center justify-center shadow-lg"
            >
              <Folder className="w-6 h-6" style={{ color: activeColor }} />
            </div>

            <div className="flex-1 min-w-0">
              {isEditingName ? (
                <div className="flex items-center gap-2">
                  <input
                    ref={inputRef}
                    type="text"
                    value={folderNameInput}
                    onChange={(e) => setFolderNameInput(e.target.value)}
                    onBlur={handleNameSave}
                    onKeyDown={handleKeyDown}
                    className="w-full bg-white/10 border border-white/20 rounded-xl px-3 py-1.5 text-base font-bold text-white focus:outline-none focus:ring-2 focus:ring-purple-400"
                  />
                  <button 
                    onClick={handleNameSave}
                    className="p-1.5 rounded-xl bg-purple-500 hover:bg-purple-600 text-white"
                  >
                    <Check className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div 
                  onClick={() => setIsEditingName(true)}
                  className="flex items-center gap-2 cursor-pointer group hover:opacity-90"
                >
                  <h2 className="text-lg font-bold text-white truncate tracking-wide">
                    {folder.folderName || folder.label || 'App Folder'}
                  </h2>
                  <Edit2 className="w-3.5 h-3.5 text-white/40 group-hover:text-white transition-colors" />
                </div>
              )}
              <div className="flex items-center gap-2 mt-0.5 text-xs text-white/50 font-mono">
                <span>{appIds.length} apps localized</span>
                <span>•</span>
                <span>Click app to launch</span>
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-2xl bg-white/5 hover:bg-white/15 text-white/70 hover:text-white transition-all border border-white/10"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Color Customization Swatches */}
        <div className="flex items-center justify-between text-xs text-white/60 bg-white/5 px-3.5 py-2 rounded-2xl border border-white/5">
          <span className="font-medium">Box Accent Color:</span>
          <div className="flex items-center gap-2">
            {COLOR_PRESETS.map((preset) => (
              <button
                key={preset.hex}
                onClick={() => setFolderColor(folder.id, preset.hex)}
                className={`w-5 h-5 rounded-full transition-transform hover:scale-125 flex items-center justify-center ${preset.class} ${
                  activeColor.toLowerCase() === preset.hex.toLowerCase() ? 'ring-2 ring-white scale-110' : 'opacity-70 hover:opacity-100'
                }`}
                title={preset.name}
              >
                {activeColor.toLowerCase() === preset.hex.toLowerCase() && (
                  <Check className="w-3 h-3 text-white" />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Main Grid of Apps in this Box */}
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 max-h-72 overflow-y-auto p-1 pr-2">
          {appIds.map((appId) => {
            const meta = appCatalog[appId];
            if (!meta) return null;

            const appLabel = personality === 'linux' ? meta.linuxName :
              personality === 'windows' ? meta.windowsName :
              meta.title;

            return (
              <div
                key={appId}
                onClick={() => handleLaunchApp(appId)}
                className="group relative p-3 rounded-2xl bg-white/5 hover:bg-white/15 border border-white/5 hover:border-white/20 transition-all flex flex-col items-center text-center cursor-pointer hover:scale-105 hover:shadow-xl"
              >
                {/* Extract button on hover */}
                <button
                  onClick={(e) => handleExtractApp(appId, e)}
                  title="Extract back to desktop"
                  className="absolute top-1.5 right-1.5 p-1 rounded-lg bg-black/50 hover:bg-red-500/80 text-white/50 hover:text-white opacity-0 group-hover:opacity-100 transition-all border border-white/10"
                >
                  <ArrowUpRight className="w-3 h-3" />
                </button>

                <div className="mb-2 transition-transform group-hover:scale-110">
                  <DesktopIconRenderer iconName={meta.iconName} size={36} />
                </div>

                <span className="text-xs font-semibold text-white/90 group-hover:text-white leading-snug line-clamp-2 w-full">
                  {appLabel}
                </span>

                {meta.badge && (
                  <span className="mt-1 text-[9px] font-mono px-1.5 py-0.5 rounded-full bg-purple-500/30 text-purple-300 font-bold border border-purple-400/30">
                    {meta.badge}
                  </span>
                )}
              </div>
            );
          })}
        </div>

        {/* Add App Dropdown Drawer */}
        {isAddingApps && availableAppsToAdd.length > 0 && (
          <div className="p-3 rounded-2xl bg-black/40 border border-white/10 space-y-2 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between text-xs font-bold text-white/80 px-1">
              <span>Select App to Add into Folder:</span>
              <button 
                onClick={() => setIsAddingApps(false)}
                className="text-white/40 hover:text-white text-[11px]"
              >
                Cancel
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto pr-1">
              {availableAppsToAdd.map((appId) => {
                const meta = appCatalog[appId];
                if (!meta) return null;
                return (
                  <button
                    key={appId}
                    onClick={() => {
                      addAppToFolder(folder.id, appId);
                      setIsAddingApps(false);
                      addNotification({
                        title: 'App Added to Folder',
                        message: `Added '${meta.title}' into '${folder.folderName || folder.label}'.`,
                        type: 'success',
                        appId
                      });
                    }}
                    className="flex items-center gap-2 p-2 rounded-xl bg-white/5 hover:bg-white/15 border border-white/5 text-left text-xs text-white/90 hover:text-white transition-colors"
                  >
                    <DesktopIconRenderer iconName={meta.iconName} size={18} />
                    <span className="truncate flex-1 font-medium">{meta.title}</span>
                    <Plus className="w-3 h-3 text-emerald-400" />
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Bottom Action Footer */}
        <div className="flex items-center justify-between gap-3 pt-3 border-t border-white/10 text-xs">
          <button
            onClick={() => setIsAddingApps(!isAddingApps)}
            className="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-medium flex items-center gap-1.5 transition-all border border-white/10"
          >
            <Plus className="w-3.5 h-3.5 text-purple-400" />
            <span>Add App to Box</span>
          </button>

          <button
            onClick={handleDissolveBox}
            className="px-3 py-2 rounded-xl bg-red-500/10 hover:bg-red-500/25 text-red-300 font-medium flex items-center gap-1.5 transition-all border border-red-500/20"
          >
            <FolderMinus className="w-3.5 h-3.5 text-red-400" />
            <span>Ungroup / Dissolve Box</span>
          </button>
        </div>
      </div>
    </div>
  );
};
