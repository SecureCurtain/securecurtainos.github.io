// jb7572_2026-08-25: Android-Style Desktop Folder Box Grid Item Component
// Renders 2x2 / 3x3 mini icon squircle box preview with drag & drop merging, badge counters & ambient glow

import React, { useState } from 'react';
import { useDesktop } from '../../context/DesktopContext';
import { DesktopIcon, AppId } from '../../types/desktop';
import { DesktopIconRenderer } from './DesktopIconRenderer';
import { Folder } from 'lucide-react';

interface DesktopFolderBoxItemProps {
  folder: DesktopIcon;
  isSelected: boolean;
  onSelect: () => void;
  onOpen: () => void;
  onContextMenu?: (e: React.MouseEvent) => void;
  onDragStart: (e: React.DragEvent, item: DesktopIcon) => void;
  onDragOverTarget: (e: React.DragEvent, item: DesktopIcon) => void;
  onDragLeaveTarget: (e: React.DragEvent) => void;
  onDropOnTarget: (e: React.DragEvent, targetItem: DesktopIcon) => void;
  isDragTarget: boolean;
}

export const DesktopFolderBoxItem: React.FC<DesktopFolderBoxItemProps> = ({
  folder,
  isSelected,
  onSelect,
  onOpen,
  onContextMenu,
  onDragStart,
  onDragOverTarget,
  onDragLeaveTarget,
  onDropOnTarget,
  isDragTarget
}) => {
  const { appCatalog, themeConfig, iconTheme } = useDesktop();
  const appIds = folder.folderAppIds || [folder.appId];
  
  // Show up to 4 preview icons in a 2x2 grid
  const previewAppIds = appIds.slice(0, 4);
  const remainingCount = appIds.length > 4 ? appIds.length - 4 : 0;
  const activeColor = folder.folderColor || themeConfig.accentHex || '#8b5cf6';

  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, folder)}
      onDragOver={(e) => onDragOverTarget(e, folder)}
      onDragLeave={onDragLeaveTarget}
      onDrop={(e) => onDropOnTarget(e, folder)}
      onClick={(e) => {
        e.stopPropagation();
        onSelect();
      }}
      onDoubleClick={(e) => {
        e.stopPropagation();
        onOpen();
      }}
      onContextMenu={(e) => {
        if (onContextMenu) {
          e.preventDefault();
          e.stopPropagation();
          onContextMenu(e);
        }
      }}
      className={`w-24 p-2 rounded-2xl flex flex-col items-center text-center cursor-pointer transition-all duration-200 relative group select-none ${
        isDragTarget
          ? 'scale-110 ring-4 ring-purple-400 bg-purple-500/30 shadow-[0_0_24px_rgba(168,85,247,0.6)] animate-pulse'
          : isSelected
          ? 'bg-white/20 backdrop-blur-md ring-2 ring-purple-400 shadow-xl'
          : 'hover:bg-white/10 hover:backdrop-blur-sm'
      }`}
    >
      {/* Android-Style Frosted Squircle Box Container */}
      <div 
        style={{
          borderColor: isDragTarget ? activeColor : isSelected ? '#c084fc' : 'rgba(255, 255, 255, 0.2)',
          boxShadow: isDragTarget 
            ? `0 0 20px ${activeColor}` 
            : isSelected 
            ? '0 8px 24px rgba(0,0,0,0.5)' 
            : undefined
        }}
        className={`w-14 h-14 rounded-2xl bg-white/10 backdrop-blur-xl border p-1.5 grid grid-cols-2 grid-rows-2 gap-1 items-center justify-items-center relative shadow-lg group-hover:scale-105 group-hover:bg-white/15 transition-all mb-1.5 ${
          iconTheme === 'sweet-candy' 
            ? 'bg-gradient-to-br from-white/20 via-white/10 to-black/30 border-white/30' 
            : iconTheme === 'cyber-matrix'
            ? 'bg-emerald-950/40 border-emerald-500/40'
            : iconTheme === 'neon-glow'
            ? 'bg-[#151226]/80 border-purple-500/40 shadow-[0_0_12px_rgba(168,85,247,0.3)]'
            : ''
        }`}
      >
        {/* Specular gloss top layer */}
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-b from-white/25 via-transparent to-transparent pointer-events-none" />

        {/* 2x2 Mini Icons */}
        {previewAppIds.map((appId, index) => {
          const meta = appCatalog[appId];
          const iconName = meta?.iconName || 'Zap';
          return (
            <div 
              key={`${appId}-${index}`} 
              className="flex items-center justify-center w-5 h-5 transition-transform"
            >
              <DesktopIconRenderer iconName={iconName} size={14} />
            </div>
          );
        })}

        {/* If fewer than 4 apps, pad with subtle folder placeholder dots */}
        {previewAppIds.length < 4 && Array.from({ length: 4 - previewAppIds.length }).map((_, i) => (
          <div key={`dot-${i}`} className="w-1.5 h-1.5 rounded-full bg-white/20" />
        ))}

        {/* "+N" counter tag if more than 4 apps */}
        {remainingCount > 0 && (
          <span className="absolute -bottom-1 -right-1 text-[8px] font-bold px-1 rounded-full bg-purple-600 text-white shadow-md border border-white/30 font-mono">
            +{remainingCount}
          </span>
        )}
      </div>

      {/* Folder Name Label */}
      <span className="text-[11px] font-medium text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)] leading-tight text-center truncate w-full px-1 flex items-center justify-center gap-1">
        <span>{folder.folderName || folder.label || 'App Folder'}</span>
      </span>

      {/* Item Count Badge */}
      <span 
        style={{ backgroundColor: activeColor }}
        className="absolute top-1 right-1 text-[8px] font-mono px-1 rounded-full text-white font-bold shadow-md ring-1 ring-white/40"
      >
        {appIds.length}
      </span>
    </div>
  );
};
