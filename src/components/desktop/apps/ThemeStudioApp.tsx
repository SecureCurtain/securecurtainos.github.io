// jb7572_2026-08-25: Theme & Multi-Dock Studio with Dynamic App Catalog & Icon Synchronization

import React, { useState } from 'react';
import { useDesktop } from '../../../context/DesktopContext';
import { 
  VISUAL_THEMES, 
  ICON_THEMES, 
  WALLPAPERS,
  APP_CATALOG
} from '../../../data/desktopThemes';
import { 
  VisualTheme, 
  IconTheme, 
  WallpaperTheme, 
  OSPersonality,
  TaskbarPosition,
  DockConfig,
  DockPlacement,
  DockAlignment,
  AppId,
  AppMetadata
} from '../../../types/desktop';
import { 
  Palette, 
  Sparkles, 
  Layers, 
  Image as ImageIcon, 
  Monitor, 
  Check, 
  Terminal, 
  Zap, 
  Plus,
  Trash2,
  Copy,
  Sliders,
  RotateCcw,
  SlidersHorizontal,
  LayoutGrid,
  CheckCircle2,
  ExternalLink,
  Edit3,
  Flame,
  Globe,
  Compass,
  Code,
  HardDrive,
  Cpu,
  Activity,
  ShieldCheck,
  Package,
  Search,
  FolderTree,
  Folder,
  FileText,
  BookOpen,
  Info,
  Disc,
  HeartPulse,
  Wrench,
  FileCode,
  Radio,
  Lock,
  Wifi
} from 'lucide-react';
import { DesktopIconRenderer } from '../DesktopIconRenderer';

type ActiveTab = 'docks' | 'apps' | 'personalities' | 'themes' | 'icons' | 'wallpapers';

const AVAILABLE_ICONS = [
  'Zap', 'Activity', 'Binary', 'HardDrive', 'ShieldCheck', 'Settings', 'Cpu', 'Package', 
  'Search', 'Terminal', 'FolderTree', 'Folder', 'FileText', 'Palette', 'BookOpen', 'Info', 
  'Layers', 'HelpCircle', 'Disc', 'HeartPulse', 'Sparkles', 'Globe', 'Compass', 'Code', 
  'Flame', 'Wrench', 'FileCode', 'Monitor', 'Radio', 'Lock', 'Wifi', 'LayoutGrid'
];

export const ThemeStudioApp: React.FC = () => {
  const { 
    personality, 
    setPersonality, 
    visualTheme, 
    setVisualTheme, 
    iconTheme, 
    setIconTheme, 
    wallpaper, 
    setWallpaper,
    docks,
    addDock,
    updateDock,
    removeDock,
    duplicateDock,
    resetDocksToDefault,
    appCatalog,
    updateAppMetadata,
    openApp,
    addNotification,
    desktopIcons,
    autoGroupIconsByCategory,
    ungroupAllFolders
  } = useDesktop();

  const [activeTab, setActiveTab] = useState<ActiveTab>('docks');
  const [selectedDockId, setSelectedDockId] = useState<string>(docks[0]?.id || 'dock-primary-bottom');
  const [editingAppId, setEditingAppId] = useState<AppId | null>('terminal');
  const [appSearch, setAppSearch] = useState<string>('');

  const currentDock = docks.find(d => d.id === selectedDockId) || docks[0];
  const currentApp = editingAppId ? appCatalog[editingAppId] : null;

  return (
    <div className="h-full flex flex-col bg-[#090a10] text-[#e2e8f0] select-none font-sans overflow-hidden">
      {/* Header Banner */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-[#1f2438] bg-[#0d0f18] shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-purple-500/10 border border-purple-500/30 rounded-2xl text-purple-400">
            <Sliders className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold tracking-tight text-white flex items-center gap-2">
              SecureCurtain Customization & Dock Studio
              <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-full bg-purple-950/80 text-purple-300 border border-purple-800/60">
                Multi-Dock Engine
              </span>
            </h2>
            <p className="text-xs text-[#8892b0]">
              Create custom docks, adjust thickness & icon sizing, and customize auto-synced application metadata.
            </p>
          </div>
        </div>

        {/* Global Action */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              resetDocksToDefault();
              addNotification({
                title: 'Docks Reset',
                message: 'All taskbars & docks have been restored to default layout.',
                type: 'info',
                appId: 'theme-studio'
              });
            }}
            className="px-3 py-1.5 rounded-xl text-xs font-mono text-[#94a3b8] hover:text-white bg-[#141724] hover:bg-[#1f2438] border border-[#2b314a] flex items-center gap-1.5 transition-all"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset Docks
          </button>
        </div>
      </div>

      {/* Tabs Navigation Bar */}
      <div className="flex items-center gap-1 px-6 border-b border-[#1a1e2e] bg-[#0c0e16] shrink-0 overflow-x-auto no-scrollbar py-2">
        <button
          onClick={() => setActiveTab('docks')}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
            activeTab === 'docks'
              ? 'bg-purple-600 text-white shadow-md'
              : 'text-[#94a3b8] hover:text-white hover:bg-white/5'
          }`}
        >
          <SlidersHorizontal className="w-3.5 h-3.5" />
          Multi-Dock & Taskbars ({docks.length})
        </button>

        <button
          onClick={() => setActiveTab('apps')}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
            activeTab === 'apps'
              ? 'bg-purple-600 text-white shadow-md'
              : 'text-[#94a3b8] hover:text-white hover:bg-white/5'
          }`}
        >
          <LayoutGrid className="w-3.5 h-3.5" />
          App Catalog & Icon Sync
        </button>

        <button
          onClick={() => setActiveTab('personalities')}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
            activeTab === 'personalities'
              ? 'bg-purple-600 text-white shadow-md'
              : 'text-[#94a3b8] hover:text-white hover:bg-white/5'
          }`}
        >
          <Monitor className="w-3.5 h-3.5" />
          OS Personality ({personality})
        </button>

        <button
          onClick={() => setActiveTab('themes')}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
            activeTab === 'themes'
              ? 'bg-purple-600 text-white shadow-md'
              : 'text-[#94a3b8] hover:text-white hover:bg-white/5'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          Visual Themes
        </button>

        <button
          onClick={() => setActiveTab('icons')}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
            activeTab === 'icons'
              ? 'bg-purple-600 text-white shadow-md'
              : 'text-[#94a3b8] hover:text-white hover:bg-white/5'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          Icon Themes
        </button>

        <button
          onClick={() => setActiveTab('wallpapers')}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
            activeTab === 'wallpapers'
              ? 'bg-purple-600 text-white shadow-md'
              : 'text-[#94a3b8] hover:text-white hover:bg-white/5'
          }`}
        >
          <ImageIcon className="w-3.5 h-3.5" />
          Wallpapers
        </button>
      </div>

      {/* Main Tab Content Canvas */}
      <div className="flex-1 overflow-y-auto p-6">
        {/* ========================================================================= */}
        {/* TAB 1: MULTI-DOCK & TASKBAR CUSTOMIZER */}
        {/* ========================================================================= */}
        {activeTab === 'docks' && (
          <div className="space-y-6 max-w-5xl mx-auto">
            {/* Dock Selection & Add Toolbar */}
            <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-2xl bg-[#121420] border border-[#202538]">
              <div className="flex items-center gap-2 overflow-x-auto">
                <span className="text-xs font-mono uppercase text-[#64748b] mr-1">Select Dock:</span>
                {docks.map((dock) => {
                  const isSelected = dock.id === (currentDock?.id || '');
                  return (
                    <button
                      key={dock.id}
                      onClick={() => setSelectedDockId(dock.id)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-mono font-medium transition-all flex items-center gap-2 ${
                        isSelected
                          ? 'bg-purple-600 text-white shadow-md'
                          : 'bg-[#1a1d2e] text-[#94a3b8] hover:text-white hover:bg-[#25293d] border border-[#2d334d]'
                      }`}
                    >
                      <span className={`w-2 h-2 rounded-full ${dock.enabled ? 'bg-emerald-400' : 'bg-rose-500'}`} />
                      {dock.name}
                      <span className="text-[10px] opacity-70">({dock.placement})</span>
                    </button>
                  );
                })}
              </div>

              {/* Add New Dock Button */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    const newDock = addDock({
                      name: `Dock #${docks.length + 1}`,
                      placement: 'floating-bottom',
                      lengthPercent: 60,
                      thickness: 56,
                      iconSize: 28,
                      borderRadius: 20
                    });
                    setSelectedDockId(newDock.id);
                    addNotification({
                      title: 'New Dock Created',
                      message: `Added ${newDock.name} with custom floating placement.`,
                      type: 'success',
                      appId: 'theme-studio'
                    });
                  }}
                  className="px-3.5 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-medium text-xs flex items-center gap-1.5 shadow-md transition-all"
                >
                  <Plus className="w-4 h-4" />
                  Add New Dock
                </button>
              </div>
            </div>

            {currentDock && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left 2 Cols: Main Dock Properties */}
                <div className="lg:col-span-2 space-y-6">
                  {/* Dock General Details & Status */}
                  <div className="p-5 rounded-2xl bg-[#121420] border border-[#202538] space-y-4">
                    <div className="flex items-center justify-between border-b border-[#1f2438] pb-3">
                      <div>
                        <h3 className="text-sm font-bold text-white flex items-center gap-2">
                          <Sliders className="w-4 h-4 text-purple-400" />
                          Editing: {currentDock.name}
                        </h3>
                        <p className="text-xs text-[#64748b]">Configure layout, dimensions, placement, and visibility.</p>
                      </div>

                      <div className="flex items-center gap-2">
                        {/* Enable/Disable Toggle */}
                        <label className="flex items-center gap-2 cursor-pointer text-xs font-mono bg-[#181b2a] px-3 py-1.5 rounded-xl border border-[#292f48]">
                          <input
                            type="checkbox"
                            checked={currentDock.enabled}
                            onChange={(e) => updateDock(currentDock.id, { enabled: e.target.checked })}
                            className="rounded accent-purple-500"
                          />
                          <span className={currentDock.enabled ? 'text-emerald-400 font-bold' : 'text-[#64748b]'}>
                            {currentDock.enabled ? 'Enabled' : 'Disabled'}
                          </span>
                        </label>

                        {/* Duplicate */}
                        <button
                          onClick={() => duplicateDock(currentDock.id)}
                          title="Duplicate Dock"
                          className="p-2 rounded-xl bg-[#181b2a] hover:bg-[#23273c] text-[#94a3b8] hover:text-white border border-[#292f48] transition-all"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>

                        {/* Delete */}
                        <button
                          onClick={() => {
                            removeDock(currentDock.id);
                            if (docks.length > 1) {
                              const remaining = docks.filter(d => d.id !== currentDock.id);
                              setSelectedDockId(remaining[0].id);
                            }
                          }}
                          disabled={docks.length <= 1}
                          title={docks.length <= 1 ? "Cannot delete the last dock" : "Delete Dock"}
                          className="p-2 rounded-xl bg-rose-950/30 hover:bg-rose-900/50 text-rose-300 border border-rose-900/40 disabled:opacity-40 transition-all"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Dock Name & Translucency */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-[#94a3b8] mb-1">Dock Name</label>
                        <input
                          type="text"
                          value={currentDock.name}
                          onChange={(e) => updateDock(currentDock.id, { name: e.target.value })}
                          className="w-full px-3 py-2 rounded-xl bg-[#0a0c14] border border-[#22273d] text-white text-xs font-mono focus:outline-none focus:border-purple-500"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-[#94a3b8] mb-1">Translucency Style</label>
                        <select
                          value={currentDock.translucency}
                          onChange={(e) => updateDock(currentDock.id, { translucency: e.target.value as any })}
                          className="w-full px-3 py-2 rounded-xl bg-[#0a0c14] border border-[#22273d] text-white text-xs font-mono focus:outline-none focus:border-purple-500"
                        >
                          <option value="glass">Glass (Aero Void Blur)</option>
                          <option value="acrylic">Acrylic (Deep Frosted Glow)</option>
                          <option value="solid">Solid (High Contrast Dark)</option>
                        </select>
                      </div>
                    </div>

                    {/* 1. Placement Selection */}
                    <div>
                      <label className="block text-xs font-semibold text-[#94a3b8] mb-2">Screen Placement</label>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                        {[
                          { id: 'bottom', label: 'Bottom Bar', desc: 'Full width taskbar' },
                          { id: 'top', label: 'Top Panel', desc: 'Status menu bar' },
                          { id: 'left', label: 'Left Dock', desc: 'Vertical left strip' },
                          { id: 'right', label: 'Right Dock', desc: 'Vertical right strip' },
                          { id: 'floating-bottom', label: 'Floating Bottom', desc: 'macOS / Cyber pill dock' },
                          { id: 'floating-top', label: 'Floating Top', desc: 'HUD floating bar' },
                        ].map((pl) => {
                          const isSelected = currentDock.placement === pl.id;
                          return (
                            <button
                              key={pl.id}
                              onClick={() => updateDock(currentDock.id, { placement: pl.id as DockPlacement })}
                              className={`p-2.5 rounded-xl border text-left transition-all ${
                                isSelected
                                  ? 'bg-purple-950/40 border-purple-500 text-white shadow-sm ring-1 ring-purple-500/50'
                                  : 'bg-[#0b0d16] border-[#1f2438] text-[#8892b0] hover:text-white hover:border-[#333a56]'
                              }`}
                            >
                              <div className="font-semibold text-xs text-white">{pl.label}</div>
                              <div className="text-[10px] text-[#64748b]">{pl.desc}</div>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* 2. Alignment Selection */}
                    <div>
                      <label className="block text-xs font-semibold text-[#94a3b8] mb-2">Content Alignment</label>
                      <div className="grid grid-cols-3 gap-2.5">
                        {[
                          { id: 'start', label: 'Start (Left / Top)' },
                          { id: 'center', label: 'Center (Balanced)' },
                          { id: 'end', label: 'End (Right / Bottom)' },
                        ].map((al) => {
                          const isSelected = currentDock.alignment === al.id;
                          return (
                            <button
                              key={al.id}
                              onClick={() => updateDock(currentDock.id, { alignment: al.id as DockAlignment })}
                              className={`p-2 rounded-xl border text-center text-xs font-mono transition-all ${
                                isSelected
                                  ? 'bg-purple-600 text-white border-purple-500'
                                  : 'bg-[#0b0d16] border-[#1f2438] text-[#8892b0] hover:text-white'
                              }`}
                            >
                              {al.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Dimension & Sizing Sliders */}
                  <div className="p-5 rounded-2xl bg-[#121420] border border-[#202538] space-y-4">
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <SlidersHorizontal className="w-4 h-4 text-sky-400" />
                      Dimensions & Sizing Adjustments
                    </h3>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                      {/* Thickness (Height or Width) */}
                      <div className="space-y-2">
                        <div className="flex justify-between text-xs">
                          <span className="text-[#94a3b8] font-medium">
                            Dock Thickness ({currentDock.placement === 'left' || currentDock.placement === 'right' ? 'Width' : 'Height'})
                          </span>
                          <span className="font-mono text-purple-400 font-bold">{currentDock.thickness}px</span>
                        </div>
                        <input
                          type="range"
                          min="32"
                          max="90"
                          value={currentDock.thickness}
                          onChange={(e) => updateDock(currentDock.id, { thickness: Number(e.target.value) })}
                          className="w-full accent-purple-500 cursor-pointer"
                        />
                        <div className="flex justify-between text-[10px] font-mono text-[#64748b]">
                          <span>Compact (32px)</span>
                          <span>Spacious (90px)</span>
                        </div>
                      </div>

                      {/* Icon Size */}
                      <div className="space-y-2">
                        <div className="flex justify-between text-xs">
                          <span className="text-[#94a3b8] font-medium">Icon Size</span>
                          <span className="font-mono text-purple-400 font-bold">{currentDock.iconSize}px</span>
                        </div>
                        <input
                          type="range"
                          min="16"
                          max="48"
                          value={currentDock.iconSize}
                          onChange={(e) => updateDock(currentDock.id, { iconSize: Number(e.target.value) })}
                          className="w-full accent-purple-500 cursor-pointer"
                        />
                        <div className="flex justify-between text-[10px] font-mono text-[#64748b]">
                          <span>Small (16px)</span>
                          <span>Large (48px)</span>
                        </div>
                      </div>

                      {/* Length Span % */}
                      <div className="space-y-2">
                        <div className="flex justify-between text-xs">
                          <span className="text-[#94a3b8] font-medium">Length Span Percent</span>
                          <span className="font-mono text-purple-400 font-bold">{currentDock.lengthPercent}%</span>
                        </div>
                        <input
                          type="range"
                          min="30"
                          max="100"
                          value={currentDock.lengthPercent}
                          onChange={(e) => updateDock(currentDock.id, { lengthPercent: Number(e.target.value) })}
                          className="w-full accent-purple-500 cursor-pointer"
                        />
                        <div className="flex justify-between text-[10px] font-mono text-[#64748b]">
                          <span>Partial (30%)</span>
                          <span>Full Screen (100%)</span>
                        </div>
                      </div>

                      {/* Corner Border Radius */}
                      <div className="space-y-2">
                        <div className="flex justify-between text-xs">
                          <span className="text-[#94a3b8] font-medium">Corner Border Radius</span>
                          <span className="font-mono text-purple-400 font-bold">{currentDock.borderRadius}px</span>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="36"
                          value={currentDock.borderRadius}
                          onChange={(e) => updateDock(currentDock.id, { borderRadius: Number(e.target.value) })}
                          className="w-full accent-purple-500 cursor-pointer"
                        />
                        <div className="flex justify-between text-[10px] font-mono text-[#64748b]">
                          <span>Square (0px)</span>
                          <span>Pill Curved (36px)</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right 1 Col: Module Visibility & Pinned Apps */}
                <div className="space-y-6">
                  {/* Module Feature Toggles */}
                  <div className="p-5 rounded-2xl bg-[#121420] border border-[#202538] space-y-3">
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <LayoutGrid className="w-4 h-4 text-emerald-400" />
                      Dock Modules & Visibility
                    </h3>

                    <div className="space-y-2">
                      {[
                        { key: 'showStartButton', label: 'Start Menu Button', desc: 'Launcher button' },
                        { key: 'showWorkspaces', label: 'Workspaces Switcher', desc: '1, 2, 3, 4 virtual switch' },
                        { key: 'showPinnedApps', label: 'Pinned Quick Launch Apps', desc: 'Custom app icons' },
                        { key: 'showOpenTasks', label: 'Running Window Tabs', desc: 'Live window minimize/restore' },
                        { key: 'showSystemTray', label: 'System Telemetry Gauge', desc: 'CPU & Memory load' },
                        { key: 'showClock', label: 'Clock & Date', desc: 'Live system clock' },
                        { key: 'showQuickSettings', label: 'Quick Settings / Action Center', desc: 'Flyout toggles' },
                      ].map((mod) => {
                        const isChecked = (currentDock as any)[mod.key];
                        return (
                          <label
                            key={mod.key}
                            className="flex items-center justify-between p-2.5 rounded-xl bg-[#0c0e16] hover:bg-[#161928] border border-[#1f2438] cursor-pointer transition-all"
                          >
                            <div>
                              <div className="text-xs font-semibold text-white">{mod.label}</div>
                              <div className="text-[10px] text-[#64748b]">{mod.desc}</div>
                            </div>
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={(e) => updateDock(currentDock.id, { [mod.key]: e.target.checked })}
                              className="rounded accent-purple-500 w-4 h-4"
                            />
                          </label>
                        );
                      })}
                    </div>
                  </div>

                  {/* Pinned Applications Selector */}
                  <div className="p-5 rounded-2xl bg-[#121420] border border-[#202538] space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-bold text-white flex items-center gap-2">
                        <Package className="w-4 h-4 text-purple-400" />
                        Pinned Apps on this Dock
                      </h3>
                      <span className="text-[11px] font-mono text-[#64748b]">
                        {currentDock.pinnedAppIds.length} pinned
                      </span>
                    </div>

                    <div className="max-h-60 overflow-y-auto space-y-1.5 pr-1">
                      {(Object.values(appCatalog) as AppMetadata[]).map((app) => {
                        const isPinned = currentDock.pinnedAppIds.includes(app.id);
                        return (
                          <button
                            key={app.id}
                            onClick={() => {
                              const nextPinned = isPinned
                                ? currentDock.pinnedAppIds.filter(id => id !== app.id)
                                : [...currentDock.pinnedAppIds, app.id];
                              updateDock(currentDock.id, { pinnedAppIds: nextPinned });
                            }}
                            className={`w-full p-2 rounded-xl border flex items-center justify-between text-left transition-all ${
                              isPinned
                                ? 'bg-purple-950/40 border-purple-500/80 text-white'
                                : 'bg-[#0c0e16] border-[#1e2338] text-[#8892b0] hover:text-white hover:bg-[#161a29]'
                            }`}
                          >
                            <div className="flex items-center gap-2 truncate">
                              <DesktopIconRenderer iconName={app.iconName} size={18} highlight={isPinned} />
                              <span className="text-xs font-medium truncate">{app.title}</span>
                            </div>
                            <div className={`px-1.5 py-0.5 rounded text-[9px] font-mono ${
                              isPinned ? 'bg-purple-500 text-white' : 'bg-[#181b29] text-[#64748b]'
                            }`}>
                              {isPinned ? 'Pinned' : 'Add'}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 2: DYNAMIC APP CATALOG & AUTO-SYNC STUDIO */}
        {/* ========================================================================= */}
        {activeTab === 'apps' && (
          <div className="space-y-6 max-w-5xl mx-auto">
            <div className="p-4 rounded-2xl bg-[#121420] border border-[#202538] flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <LayoutGrid className="w-4 h-4 text-purple-400" />
                  Dynamic App Catalog & Synchronized Links
                </h3>
                <p className="text-xs text-[#8892b0]">
                  Any change to an application's title, icon, or metadata will immediately synchronize across all docks, taskbars, desktop icons, start menus, and open windows.
                </p>
              </div>

              {/* Search Bar */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#64748b]" />
                <input
                  type="text"
                  placeholder="Filter applications..."
                  value={appSearch}
                  onChange={(e) => setAppSearch(e.target.value)}
                  className="pl-8 pr-3 py-1.5 rounded-xl bg-[#0a0c14] border border-[#22273d] text-white text-xs font-mono focus:outline-none focus:border-purple-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Column: App List */}
              <div className="space-y-2 max-h-[580px] overflow-y-auto pr-1">
                {(Object.values(appCatalog) as AppMetadata[])
                  .filter(app => 
                    app.title.toLowerCase().includes(appSearch.toLowerCase()) ||
                    app.linuxName.toLowerCase().includes(appSearch.toLowerCase()) ||
                    app.windowsName.toLowerCase().includes(appSearch.toLowerCase())
                  )
                  .map((app) => {
                    const isSelected = editingAppId === app.id;
                    return (
                      <button
                        key={app.id}
                        onClick={() => setEditingAppId(app.id)}
                        className={`w-full p-3 rounded-2xl border text-left transition-all flex items-center justify-between ${
                          isSelected
                            ? 'bg-purple-950/40 border-purple-500 text-white shadow-md ring-1 ring-purple-500/40'
                            : 'bg-[#121420] border-[#1e2338] text-[#8892b0] hover:text-white hover:bg-[#181b2a]'
                        }`}
                      >
                        <div className="flex items-center gap-3 truncate">
                          <div className="p-2 rounded-xl bg-[#090a10] border border-white/10 shrink-0">
                            <DesktopIconRenderer iconName={app.iconName} size={22} highlight={isSelected} />
                          </div>
                          <div className="truncate">
                            <div className="font-bold text-xs text-white truncate">{app.title}</div>
                            <div className="text-[10px] text-[#64748b] truncate">{app.category} • {app.id}</div>
                          </div>
                        </div>
                        <Edit3 className={`w-3.5 h-3.5 ${isSelected ? 'text-purple-400' : 'text-[#444c66]'}`} />
                      </button>
                    );
                  })}
              </div>

              {/* Right 2 Columns: App Metadata & Icon Picker Editor */}
              {currentApp && (
                <div className="lg:col-span-2 p-6 rounded-2xl bg-[#121420] border border-[#202538] space-y-6">
                  <div className="flex items-center justify-between border-b border-[#1f2438] pb-4">
                    <div className="flex items-center gap-3">
                      <div className="p-3 rounded-2xl bg-purple-500/10 border border-purple-500/30">
                        <DesktopIconRenderer iconName={currentApp.iconName} size={28} />
                      </div>
                      <div>
                        <h4 className="text-base font-bold text-white">{currentApp.title}</h4>
                        <p className="text-xs font-mono text-[#64748b]">ID: {currentApp.id}</p>
                      </div>
                    </div>

                    <button
                      onClick={() => openApp(currentApp.id)}
                      className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-medium text-xs flex items-center gap-1.5 shadow-md transition-all"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      Test Launch
                    </button>
                  </div>

                  {/* Name Fields */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-[#94a3b8] mb-1">Hybrid Display Title</label>
                      <input
                        type="text"
                        value={currentApp.title}
                        onChange={(e) => updateAppMetadata(currentApp.id, { title: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl bg-[#0a0c14] border border-[#22273d] text-white text-xs font-mono focus:outline-none focus:border-purple-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-[#94a3b8] mb-1">Linux Persona Name</label>
                      <input
                        type="text"
                        value={currentApp.linuxName}
                        onChange={(e) => updateAppMetadata(currentApp.id, { linuxName: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl bg-[#0a0c14] border border-[#22273d] text-white text-xs font-mono focus:outline-none focus:border-purple-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-[#94a3b8] mb-1">Windows Persona Name</label>
                      <input
                        type="text"
                        value={currentApp.windowsName}
                        onChange={(e) => updateAppMetadata(currentApp.id, { windowsName: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl bg-[#0a0c14] border border-[#22273d] text-white text-xs font-mono focus:outline-none focus:border-purple-500"
                      />
                    </div>
                  </div>

                  {/* Description & Badge */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-semibold text-[#94a3b8] mb-1">Description</label>
                      <input
                        type="text"
                        value={currentApp.description}
                        onChange={(e) => updateAppMetadata(currentApp.id, { description: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl bg-[#0a0c14] border border-[#22273d] text-white text-xs font-mono focus:outline-none focus:border-purple-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-[#94a3b8] mb-1">Status Badge (Optional)</label>
                      <input
                        type="text"
                        placeholder="e.g. Ring 0, Live"
                        value={currentApp.badge || ''}
                        onChange={(e) => updateAppMetadata(currentApp.id, { badge: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl bg-[#0a0c14] border border-[#22273d] text-white text-xs font-mono focus:outline-none focus:border-purple-500"
                      />
                    </div>
                  </div>

                  {/* Synchronized Icon Selector */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-semibold text-[#94a3b8]">
                        Select Icon (Automatically updates all Taskbars, Docks & Desktop Launchers)
                      </label>
                      <span className="text-xs font-mono text-purple-400">Current: {currentApp.iconName}</span>
                    </div>

                    <div className="grid grid-cols-6 sm:grid-cols-8 gap-2.5 p-3 rounded-2xl bg-[#090a12] border border-[#1f2438] max-h-48 overflow-y-auto">
                      {AVAILABLE_ICONS.map((iconName) => {
                        const isSelected = currentApp.iconName === iconName;
                        return (
                          <button
                            key={iconName}
                            onClick={() => {
                              updateAppMetadata(currentApp.id, { iconName });
                              addNotification({
                                title: 'App Icon Synchronized',
                                message: `Updated ${currentApp.title} icon to '${iconName}'. Docks & launchers updated immediately.`,
                                type: 'success',
                                appId: 'theme-studio'
                              });
                            }}
                            className={`p-2 rounded-xl border flex flex-col items-center justify-center gap-1 transition-all ${
                              isSelected
                                ? 'bg-purple-600 text-white border-purple-400 shadow-md ring-2 ring-purple-400/50'
                                : 'bg-[#121420] border-[#1e2338] text-[#8892b0] hover:text-white hover:bg-[#1a1e30]'
                            }`}
                            title={iconName}
                          >
                            <DesktopIconRenderer iconName={iconName} size={20} highlight={isSelected} />
                            <span className="text-[9px] font-mono truncate w-full text-center">{iconName}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 3: OS PERSONALITIES */}
        {/* ========================================================================= */}
        {activeTab === 'personalities' && (
          <div className="space-y-6 max-w-5xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {/* Linux */}
              <button
                onClick={() => setPersonality('linux')}
                className={`p-5 rounded-2xl border text-left transition-all relative ${
                  personality === 'linux'
                    ? 'bg-purple-950/30 border-purple-500 shadow-[0_0_15px_rgba(168,85,247,0.25)]'
                    : 'bg-[#12131a] border-[#222430] hover:border-[#383a4d]'
                }`}
              >
                {personality === 'linux' && (
                  <div className="absolute top-4 right-4 p-1 rounded-full bg-purple-500 text-white">
                    <Check className="w-3.5 h-3.5" />
                  </div>
                )}
                <div className="flex items-center gap-2 mb-2 text-sky-400 font-bold text-sm">
                  <Terminal className="w-5 h-5" />
                  Linux Personality
                </div>
                <p className="text-xs text-[#888] leading-relaxed mb-4">
                  POSIX paths (`/home/user/SecureCurtain`), bash prompts (`user@SecureCurtain:~$`), systemd terminology, and KRunner search.
                </p>
                <div className="text-[10px] font-mono px-2.5 py-1.5 rounded-xl bg-[#0a0a0f] text-sky-300 border border-sky-900/40">
                  `~/SecureCurtain/sys` • `systemctl` • `btop`
                </div>
              </button>

              {/* Windows */}
              <button
                onClick={() => setPersonality('windows')}
                className={`p-5 rounded-2xl border text-left transition-all relative ${
                  personality === 'windows'
                    ? 'bg-purple-950/30 border-purple-500 shadow-[0_0_15px_rgba(168,85,247,0.25)]'
                    : 'bg-[#12131a] border-[#222430] hover:border-[#383a4d]'
                }`}
              >
                {personality === 'windows' && (
                  <div className="absolute top-4 right-4 p-1 rounded-full bg-purple-500 text-white">
                    <Check className="w-3.5 h-3.5" />
                  </div>
                )}
                <div className="flex items-center gap-2 mb-2 text-blue-400 font-bold text-sm">
                  <Monitor className="w-5 h-5" />
                  Windows Personality
                </div>
                <p className="text-xs text-[#888] leading-relaxed mb-4">
                  DOS/NT paths (<code>C:\SecureCurtain\sys</code>), PowerShell prompt (<code>PS C:\&gt;</code>), Start menu, and Win32 MMC naming.
                </p>
                <div className="text-[10px] font-mono px-2.5 py-1.5 rounded-xl bg-[#0a0a0f] text-blue-300 border border-blue-900/40">
                  `C:\SecureCurtain` • `taskmgr` • `services.msc`
                </div>
              </button>

              {/* Hybrid */}
              <button
                onClick={() => setPersonality('hybrid')}
                className={`p-5 rounded-2xl border text-left transition-all relative ${
                  personality === 'hybrid'
                    ? 'bg-purple-950/30 border-purple-500 shadow-[0_0_15px_rgba(168,85,247,0.25)]'
                    : 'bg-[#12131a] border-[#222430] hover:border-[#383a4d]'
                }`}
              >
                {personality === 'hybrid' && (
                  <div className="absolute top-4 right-4 p-1 rounded-full bg-purple-500 text-white">
                    <Check className="w-3.5 h-3.5" />
                  </div>
                )}
                <div className="flex items-center gap-2 mb-2 text-purple-400 font-bold text-sm">
                  <Zap className="w-5 h-5" />
                  Cyber Hybrid Fusion
                </div>
                <p className="text-xs text-[#888] leading-relaxed mb-4">
                  Unified cross-platform engine with dual aliases, futuristic sci-fi telemetry, and instant switching.
                </p>
                <div className="text-[10px] font-mono px-2.5 py-1.5 rounded-xl bg-[#0a0a0f] text-purple-300 border border-purple-900/40">
                  Dual POSIX / NT Shell Matrix
                </div>
              </button>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 4: VISUAL THEMES */}
        {/* ========================================================================= */}
        {activeTab === 'themes' && (
          <div className="space-y-6 max-w-5xl mx-auto">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {Object.values(VISUAL_THEMES).map((theme) => {
                const isSelected = visualTheme === theme.id;
                return (
                  <button
                    key={theme.id}
                    onClick={() => setVisualTheme(theme.id)}
                    className={`p-5 rounded-2xl border text-left transition-all relative flex flex-col justify-between space-y-3 ${
                      isSelected
                        ? 'bg-purple-950/30 border-purple-500 shadow-md ring-1 ring-purple-500/50'
                        : 'bg-[#12131a] border-[#222430] hover:border-[#383a4d]'
                    }`}
                  >
                    {isSelected && (
                      <div className="absolute top-4 right-4 p-1 rounded-full bg-purple-500 text-white">
                        <Check className="w-3 h-3" />
                      </div>
                    )}
                    <div>
                      <div className="flex items-center gap-2 mb-1.5">
                        <div 
                          className="w-3.5 h-3.5 rounded-full border border-white/20 shadow-xs"
                          style={{ backgroundColor: theme.accentHex }}
                        />
                        <span className="font-bold text-sm text-white">{theme.name}</span>
                      </div>
                      <p className="text-xs text-[#888] leading-relaxed">{theme.description}</p>
                    </div>

                    <div className="flex items-center gap-1.5 pt-3 border-t border-[#1e202b]">
                      <div className="h-4 flex-1 rounded-lg" style={{ backgroundColor: theme.accentHex }} />
                      <div className="h-4 flex-1 rounded-lg" style={{ backgroundColor: theme.accentSecondaryHex }} />
                      <div className="h-4 flex-2 rounded-lg border border-white/10 bg-[#0d0e14]" />
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 5: ICON THEMES */}
        {/* ========================================================================= */}
        {activeTab === 'icons' && (
          <div className="space-y-6 max-w-5xl mx-auto">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
              {ICON_THEMES.map((theme) => {
                const isSelected = iconTheme === theme.id;
                return (
                  <button
                    key={theme.id}
                    onClick={() => {
                      setIconTheme(theme.id);
                      addNotification({
                        title: 'Icon Theme Changed',
                        message: `Switched icon theme to '${theme.name}'.`,
                        type: 'info',
                        appId: 'theme-studio'
                      });
                    }}
                    className={`p-4 rounded-2xl border text-left transition-all relative flex flex-col justify-between space-y-3 ${
                      isSelected
                        ? 'bg-purple-950/40 border-purple-500 shadow-md ring-1 ring-purple-500/50'
                        : 'bg-[#12131a] border-[#222430] hover:border-[#383a4d]'
                    }`}
                  >
                    {isSelected && (
                      <div className="absolute top-3.5 right-3.5 p-1 rounded-full bg-purple-500 text-white">
                        <Check className="w-3 h-3" />
                      </div>
                    )}
                    <div className="flex items-center gap-1.5 pt-1">
                      <DesktopIconRenderer iconName="Terminal" size={20} highlight={isSelected} />
                      <DesktopIconRenderer iconName="Zap" size={20} highlight={isSelected} />
                      <DesktopIconRenderer iconName="Folder" size={20} highlight={isSelected} />
                    </div>
                    <div>
                      <div className="font-bold text-xs text-white">{theme.name}</div>
                      <p className="text-[10px] text-[#8892b0] mt-1 leading-relaxed">{theme.description}</p>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Android Icon Localizer (Folder Box) Engine Card */}
            <div className="p-6 rounded-3xl bg-[#121420] border border-[#23283e] space-y-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-pink-500/10 border border-pink-500/30 rounded-2xl text-pink-400">
                    <FolderTree className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      Android-Style Desktop Icon Localizer & Folder Box Engine
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-pink-950/80 text-pink-300 border border-pink-800/60 font-semibold">
                        Drag-to-Merge
                      </span>
                    </h3>
                    <p className="text-xs text-[#94a3b8] mt-1">
                      Drag any desktop icon directly onto another icon to group them into a squircle folder box displaying 2x2 mini icons, inline renaming, color accents, and single-click launching.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => {
                      autoGroupIconsByCategory();
                      addNotification({
                        title: 'Desktop Localized',
                        message: 'Organized all desktop icons into smart Android-style category folder boxes.',
                        type: 'success',
                        appId: 'theme-studio'
                      });
                    }}
                    className="px-3.5 py-2 rounded-xl text-xs font-semibold text-white bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 shadow-md flex items-center gap-1.5 transition-all"
                  >
                    <FolderTree className="w-3.5 h-3.5" />
                    Auto-Group into Folders
                  </button>

                  <button
                    onClick={() => {
                      ungroupAllFolders();
                      addNotification({
                        title: 'Desktop Reset',
                        message: 'Unpacked all folder boxes back into individual desktop icons.',
                        type: 'info',
                        appId: 'theme-studio'
                      });
                    }}
                    className="px-3.5 py-2 rounded-xl text-xs font-semibold text-[#94a3b8] hover:text-white bg-[#1a1e2e] hover:bg-[#252b40] border border-[#2b314a] transition-all"
                  >
                    Ungroup All
                  </button>
                </div>
              </div>

              {/* Status summary of current desktop icon layout */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-xs font-mono">
                <div className="p-3 rounded-2xl bg-black/30 border border-white/5 flex items-center justify-between">
                  <span className="text-[#94a3b8]">Total Desktop Items:</span>
                  <span className="font-bold text-white">{desktopIcons.length}</span>
                </div>
                <div className="p-3 rounded-2xl bg-black/30 border border-white/5 flex items-center justify-between">
                  <span className="text-[#94a3b8]">Folder Boxes Active:</span>
                  <span className="font-bold text-pink-400">{desktopIcons.filter(i => i.isFolder).length}</span>
                </div>
                <div className="p-3 rounded-2xl bg-black/30 border border-white/5 flex items-center justify-between">
                  <span className="text-[#94a3b8]">Individual App Icons:</span>
                  <span className="font-bold text-purple-300">{desktopIcons.filter(i => !i.isFolder).length}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 6: WALLPAPERS */}
        {/* ========================================================================= */}
        {activeTab === 'wallpapers' && (
          <div className="space-y-6 max-w-5xl mx-auto">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {WALLPAPERS.map((wp) => {
                const isSelected = wallpaper === wp.id;
                return (
                  <button
                    key={wp.id}
                    onClick={() => setWallpaper(wp.id)}
                    className={`p-3.5 rounded-2xl border text-left transition-all relative overflow-hidden group ${
                      isSelected
                        ? 'border-purple-500 ring-2 ring-purple-500/40 bg-purple-950/20'
                        : 'border-[#222430] hover:border-[#383a4d] bg-[#12131a]'
                    }`}
                  >
                    <div className={`h-28 rounded-xl mb-3 bg-gradient-to-br ${wp.gradient} border border-white/10 flex items-center justify-center relative overflow-hidden`}>
                      <span className="text-[11px] font-mono uppercase tracking-widest text-white/70 bg-black/50 px-2.5 py-1 rounded-lg backdrop-blur-xs">
                        {wp.name}
                      </span>
                      {isSelected && (
                        <div className="absolute top-2.5 right-2.5 p-1 rounded-full bg-purple-500 text-white shadow-lg">
                          <Check className="w-3.5 h-3.5" />
                        </div>
                      )}
                    </div>

                    <div className="font-bold text-xs text-white">{wp.name}</div>
                    <p className="text-[11px] text-[#737373] mt-0.5 truncate">{wp.description}</p>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
