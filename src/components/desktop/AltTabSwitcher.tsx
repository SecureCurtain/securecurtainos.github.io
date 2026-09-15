// jb7572_2026-08-25: Alt+Tab Quick Window Switcher Overlay

import React, { useState } from 'react';
import { useDesktop } from '../../context/DesktopContext';
import { DesktopIconRenderer } from './DesktopIconRenderer';

export const AltTabSwitcher: React.FC = () => {
  const { 
    windows, 
    activeWindowId, 
    activeWorkspaceId, 
    focusWindow, 
    isAltTabOpen, 
    toggleAltTab,
    themeConfig 
  } = useDesktop();

  const [selectedIndex, setSelectedIndex] = useState<number>(0);

  if (!isAltTabOpen) return null;

  const currentWindows = windows.filter(
    w => (w.workspaceId === activeWorkspaceId || w.isPinned)
  );

  if (currentWindows.length === 0) return null;

  const handleSelect = (index: number) => {
    const target = currentWindows[index];
    if (target) {
      focusWindow(target.id);
    }
    toggleAltTab(false);
  };

  return (
    <div
      onClick={() => toggleAltTab(false)}
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-md flex items-center justify-center select-none"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="p-4 rounded-3xl border shadow-2xl backdrop-blur-2xl flex flex-col gap-3 min-w-[320px] max-w-2xl"
        style={{
          backgroundColor: themeConfig.windowBg,
          borderColor: themeConfig.accentHex,
          boxShadow: `0 0 40px ${themeConfig.accentHex}44`
        }}
      >
        <div className="text-[10px] font-mono uppercase tracking-widest text-[#94a3b8] px-1">
          Alt + Tab Task Switcher
        </div>

        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
          {currentWindows.map((win, idx) => {
            const isSelected = activeWindowId === win.id;

            return (
              <button
                key={win.id}
                onClick={() => handleSelect(idx)}
                className={`p-3 rounded-2xl border flex flex-col items-center text-center transition-all ${
                  isSelected
                    ? 'bg-purple-600 border-purple-400 text-white shadow-lg scale-105'
                    : 'bg-white/5 border-white/10 text-[#cbd5e1] hover:bg-white/10'
                }`}
              >
                <div className="mb-2">
                  <DesktopIconRenderer iconName={win.iconName} size={28} />
                </div>
                <span className="text-[11px] font-semibold truncate w-full px-1">
                  {win.title}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
