// jb7572_2026-08-25: Mission Control / Exposé Workspace Grid Overview

import React from 'react';
import { useDesktop } from '../../context/DesktopContext';
import { DesktopIconRenderer } from './DesktopIconRenderer';
import { 
  Grid2X2, 
  Plus, 
  X, 
  Layers, 
  Monitor, 
  Sparkles,
  ArrowRight
} from 'lucide-react';

export const ExposeOverview: React.FC = () => {
  const { 
    workspaces, 
    activeWorkspaceId, 
    switchWorkspace, 
    windows, 
    focusWindow, 
    moveWindowToWorkspace, 
    isExposeOpen, 
    toggleExpose,
    addWorkspace,
    themeConfig
  } = useDesktop();

  if (!isExposeOpen) return null;

  return (
    <div
      onClick={() => toggleExpose(false)}
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-2xl flex flex-col p-6 sm:p-10 select-none overflow-y-auto animate-in fade-in duration-200"
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-purple-500/20 border border-purple-500/40 text-purple-300">
            <Grid2X2 className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
              Mission Control • Virtual Workspaces
            </h2>
            <p className="text-xs text-[#94a3b8]">
              Overview of all active virtual desktops and running application containers.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={(e) => {
              e.stopPropagation();
              addWorkspace();
            }}
            className="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors border border-white/10"
          >
            <Plus className="w-4 h-4 text-purple-400" />
            Add Workspace
          </button>
          <button
            onClick={() => toggleExpose(false)}
            className="p-2 rounded-xl bg-white/10 hover:bg-red-500/20 text-white/70 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* 4-Column / Grid of Workspaces */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 flex-1">
        {workspaces.map((ws) => {
          const isActive = activeWorkspaceId === ws.id;
          const wsWindows = windows.filter(w => w.workspaceId === ws.id);

          return (
            <div
              key={ws.id}
              onClick={(e) => {
                e.stopPropagation();
                switchWorkspace(ws.id);
              }}
              className={`rounded-3xl border p-4 flex flex-col justify-between transition-all duration-200 cursor-pointer relative overflow-hidden group ${
                isActive
                  ? 'bg-purple-950/40 border-purple-500 shadow-[0_0_30px_rgba(168,85,247,0.3)] ring-2 ring-purple-500/50'
                  : 'bg-[#10131d]/90 border-[#23293d] hover:border-[#3b4566] hover:bg-[#161a29]'
              }`}
            >
              {/* Workspace Top Header */}
              <div className="flex items-center justify-between mb-3 border-b border-white/5 pb-2">
                <div className="flex items-center gap-2">
                  <div 
                    className="w-2.5 h-2.5 rounded-full shadow-sm"
                    style={{ backgroundColor: ws.accentColor }}
                  />
                  <span className="font-bold text-xs text-white group-hover:text-purple-300 transition-colors">
                    {ws.name}
                  </span>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-black/40 text-white/70 border border-white/10">
                  {wsWindows.length} {wsWindows.length === 1 ? 'window' : 'windows'}
                </span>
              </div>

              {/* Miniature Workspace Canvas Preview */}
              <div className="flex-1 min-h-[220px] rounded-2xl bg-black/50 border border-white/5 p-3 flex flex-col gap-2 relative overflow-hidden">
                {wsWindows.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-white/30 text-[11px] font-mono">
                    <Layers className="w-8 h-8 stroke-1 mb-1.5 opacity-30" />
                    <span>Empty Workspace</span>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-2">
                    {wsWindows.map((win) => (
                      <div
                        key={win.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          switchWorkspace(ws.id);
                          focusWindow(win.id);
                        }}
                        className="p-2.5 rounded-xl bg-[#1c2233] hover:bg-purple-900/60 border border-white/10 hover:border-purple-400 text-left transition-all group/win"
                      >
                        <div className="flex items-center gap-1.5 mb-1 scale-75 origin-left">
                          <DesktopIconRenderer iconName={win.iconName} size={16} />
                          <span className="font-semibold text-xs text-white truncate w-24">
                            {win.title}
                          </span>
                        </div>
                        <div className="text-[9px] font-mono text-[#94a3b8] truncate">
                          {win.isMinimized ? 'Minimized' : 'Active View'}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Bottom Quick Switch Hint */}
              <div className="mt-3 flex items-center justify-between text-[11px] text-[#94a3b8]">
                <span className="truncate">{ws.description}</span>
                <span className="font-mono text-purple-400 group-hover:translate-x-1 transition-transform flex items-center gap-1">
                  Switch <ArrowRight className="w-3 h-3" />
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
