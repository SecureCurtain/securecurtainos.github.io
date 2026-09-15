// jb7572_2026-08-27: SecureCurtain Core Architecture - Diamond-Grade Multi-Monitor Display Topology, Resolution & Refresh Rate Manager
import React, { useState } from 'react';
import {
  Monitor,
  Tv,
  Maximize2,
  RotateCw,
  Sliders,
  CheckCircle2,
  Copy,
  Terminal,
  Settings,
  Layers,
  Sparkles,
  Zap,
  Grid,
  Plus,
  Trash2,
  Move
} from 'lucide-react';

export interface DisplayMonitorConfig {
  id: string;
  connector: string;
  name: string;
  isPrimary: boolean;
  resolution: string; // e.g. "3840x2160"
  width: number;
  height: number;
  refreshRate: number; // e.g. 144
  availableRefreshRates: number[];
  scaling: number; // e.g. 1.25 (125%)
  orientation: 'normal' | 'left' | 'right' | 'inverted';
  hdrEnabled: boolean;
  colorDepth: '8-bit' | '10-bit' | '12-bit Deep Color';
  posX: number;
  posY: number;
}

const DEFAULT_MONITORS: DisplayMonitorConfig[] = [
  {
    id: 'disp-1',
    connector: 'eDP-1',
    name: 'Primary Command Center (4K OLED)',
    isPrimary: true,
    resolution: '3840x2160',
    width: 3840,
    height: 2160,
    refreshRate: 144,
    availableRefreshRates: [60, 120, 144, 240],
    scaling: 1.5,
    orientation: 'normal',
    hdrEnabled: true,
    colorDepth: '10-bit',
    posX: 0,
    posY: 0
  },
  {
    id: 'disp-2',
    connector: 'DP-1',
    name: 'Tactical Ultrawide 34" (UWQHD)',
    isPrimary: false,
    resolution: '3440x1440',
    width: 3440,
    height: 1440,
    refreshRate: 165,
    availableRefreshRates: [60, 100, 144, 165],
    scaling: 1.0,
    orientation: 'normal',
    hdrEnabled: true,
    colorDepth: '10-bit',
    posX: 3840,
    posY: 0
  },
  {
    id: 'disp-3',
    connector: 'HDMI-A-1',
    name: 'Forensic Triage Tablet (Portrait)',
    isPrimary: false,
    resolution: '1920x1080',
    width: 1080,
    height: 1920,
    refreshRate: 60,
    availableRefreshRates: [60, 75],
    scaling: 1.0,
    orientation: 'left',
    hdrEnabled: false,
    colorDepth: '8-bit',
    posX: -1080,
    posY: 0
  }
];

const RESOLUTION_PRESETS = [
  { label: '3840x2160 (4K UHD 16:9)', res: '3840x2160', w: 3840, h: 2160 },
  { label: '3440x1440 (UWQHD 21:9)', res: '3440x1440', w: 3440, h: 1440 },
  { label: '2560x1440 (QHD 2K 16:9)', res: '2560x1440', w: 2560, h: 1440 },
  { label: '1920x1080 (FHD 1080p)', res: '1920x1080', w: 1920, h: 1080 },
  { label: '1280x800 (Forensic Field Handheld)', res: '1280x800', w: 1280, h: 800 }
];

export const DisplayTopologyGUI: React.FC<{ onRunCliCommand?: (cmd: string) => void }> = ({ onRunCliCommand }) => {
  const [monitors, setMonitors] = useState<DisplayMonitorConfig[]>(DEFAULT_MONITORS);
  const [selectedMonitorId, setSelectedMonitorId] = useState<string>('disp-1');
  const [testPatternActive, setTestPatternActive] = useState<boolean>(false);
  const [copiedCmd, setCopiedCmd] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const selectedMonitor = monitors.find(m => m.id === selectedMonitorId) || monitors[0];

  const updateMonitor = (id: string, updates: Partial<DisplayMonitorConfig>) => {
    setMonitors(prev =>
      prev.map(m => (m.id === id ? { ...m, ...updates } : m))
    );
    setStatusMessage(`Display parameters updated for ${monitors.find(m => m.id === id)?.connector}.`);
  };

  const setAsPrimary = (id: string) => {
    setMonitors(prev =>
      prev.map(m => ({
        ...m,
        isPrimary: m.id === id
      }))
    );
    setStatusMessage(`Primary display topology set to ${monitors.find(m => m.id === id)?.connector}.`);
  };

  const generateXrandrCommand = () => {
    const parts = monitors.map(m => {
      const rot = m.orientation === 'normal' ? 'normal' : m.orientation === 'left' ? 'left' : m.orientation === 'right' ? 'right' : 'inverted';
      const prim = m.isPrimary ? '--primary' : '';
      return `--output ${m.connector} --mode ${m.resolution} --rate ${m.refreshRate} --scale ${m.scaling}x${m.scaling} --rotate ${rot} --pos ${m.posX}x${m.posY} ${prim}`;
    });
    return `xrandr ${parts.join(' ')}`;
  };

  const generateWaylandCommand = () => {
    const lines = monitors.map(m => {
      const transform = m.orientation === 'left' ? '1' : m.orientation === 'right' ? '3' : m.orientation === 'inverted' ? '2' : '0';
      return `wlr-randr --output ${m.connector} --mode ${m.resolution}@${m.refreshRate}Hz --scale ${m.scaling} --transform ${transform} --pos ${m.posX},${m.posY}`;
    });
    return lines.join('\n');
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCmd(true);
    setTimeout(() => setCopiedCmd(false), 2000);
  };

  return (
    <div className="space-y-4 font-mono text-xs text-[#cbd5e1]">
      {/* 1. Header Banner */}
      <div className="p-4 rounded-xl bg-[#0c0f18] border border-[#1b2234] flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-cyan-950/80 border border-cyan-500/40 text-cyan-300 shadow-md">
            <Monitor className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-white">Multi-Monitor Display Topology & Resolution Manager</h3>
              <span className="text-[10px] px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-500/30">
                XRANDR & WAYLAND DRIVER
              </span>
            </div>
            <p className="text-[11px] text-[#8fa0b5] mt-0.5">
              Rearrange multiple displays, adjust resolutions, refresh rates, DPI scaling, HDR 10-bit color, and export configuration.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setTestPatternActive(!testPatternActive)}
            className={`px-3 py-1.5 rounded-lg border font-bold flex items-center gap-1.5 transition-all ${
              testPatternActive
                ? 'bg-amber-950 text-amber-300 border-amber-500/40 animate-pulse'
                : 'bg-[#121929] hover:bg-[#1a253d] text-white border-[#22314e]'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>{testPatternActive ? 'TEST PATTERN ACTIVE' : 'RUN TEST PATTERN'}</span>
          </button>
        </div>
      </div>

      {statusMessage && (
        <div className="p-2.5 rounded-xl bg-cyan-950/80 border border-cyan-500/40 text-cyan-200 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" />
            <span>{statusMessage}</span>
          </div>
          <button onClick={() => setStatusMessage(null)} className="text-[#8fa0b5] hover:text-white text-xs">
            ✕
          </button>
        </div>
      )}

      {/* 2. Interactive Spatial Display Arrangement Stage */}
      <div className="p-4 rounded-xl bg-[#0c0f18] border border-[#1b2234] space-y-3">
        <div className="flex items-center justify-between border-b border-[#1b2234] pb-2">
          <span className="font-bold text-white flex items-center gap-2">
            <Layers className="w-4 h-4 text-cyan-400" />
            <span>Spatial Display Arrangement & Topology Map</span>
          </span>
          <span className="text-[10px] text-[#8fa0b5]">Click monitor box to select & modify parameters</span>
        </div>

        {/* Spatial Virtual Canvas */}
        <div className="relative h-64 sm:h-72 w-full bg-[#06080e] rounded-xl border border-[#151d30] overflow-hidden flex items-center justify-center p-6 select-none">
          {/* Grid lines background */}
          <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:16px_16px] opacity-40 pointer-events-none" />

          {/* Test Pattern Overlay */}
          {testPatternActive && (
            <div className="absolute inset-0 z-20 bg-gradient-to-r from-red-600 via-yellow-400 via-green-600 via-cyan-500 via-blue-600 to-purple-600 opacity-80 flex items-center justify-center">
              <div className="bg-black/90 p-4 rounded-xl text-center text-white border border-white/20">
                <span className="text-sm font-bold">SMPTE COLOR BAR & ALIGNMENT TEST ACTIVE</span>
                <p className="text-xs text-[#cbd5e1] mt-1">All {monitors.length} outputs calibrated to native color gamuts.</p>
              </div>
            </div>
          )}

          {/* Render Spatial Monitor Boxes */}
          <div className="flex items-center justify-center gap-4 flex-wrap z-10">
            {monitors.map(m => {
              const isSelected = m.id === selectedMonitorId;
              const isPortrait = m.orientation === 'left' || m.orientation === 'right';
              return (
                <div
                  key={m.id}
                  onClick={() => setSelectedMonitorId(m.id)}
                  style={{
                    width: isPortrait ? '90px' : '150px',
                    height: isPortrait ? '140px' : '95px'
                  }}
                  className={`relative p-2.5 rounded-xl border-2 cursor-pointer transition-all flex flex-col justify-between shadow-xl ${
                    isSelected
                      ? 'bg-cyan-950/90 border-cyan-400 shadow-cyan-950/80 scale-105'
                      : 'bg-[#101524] border-[#22304d] hover:border-cyan-500/40 opacity-80'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-white truncate max-w-[80px]">{m.connector}</span>
                    {m.isPrimary && (
                      <span className="text-[8px] px-1 py-0.2 rounded bg-amber-500 text-black font-extrabold">
                        PRIMARY
                      </span>
                    )}
                  </div>

                  <div className="text-center my-auto">
                    <span className="text-[10px] text-cyan-300 font-bold block">{m.resolution}</span>
                    <span className="text-[9px] text-[#8fa0b5]">{m.refreshRate} Hz • {Math.round(m.scaling * 100)}%</span>
                  </div>

                  <div className="text-[8px] text-[#8fa0b5] flex justify-between">
                    <span>{m.colorDepth}</span>
                    <span>{m.hdrEnabled ? 'HDR' : 'SDR'}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* 3. Selected Display Configuration Matrix */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Monitor Parameters (2 Columns) */}
        <div className="lg:col-span-2 p-4 rounded-xl bg-[#0c0f18] border border-[#1b2234] space-y-4">
          <div className="flex items-center justify-between border-b border-[#1b2234] pb-2">
            <span className="font-bold text-white flex items-center gap-2">
              <Settings className="w-4 h-4 text-cyan-400" />
              <span>Configuring: {selectedMonitor.name} ({selectedMonitor.connector})</span>
            </span>

            {!selectedMonitor.isPrimary && (
              <button
                onClick={() => setAsPrimary(selectedMonitor.id)}
                className="px-2.5 py-1 rounded bg-amber-500 hover:bg-amber-400 text-black font-bold text-[10px] transition-all"
              >
                Make Primary Display
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Resolution Selector */}
            <div className="space-y-1.5">
              <label className="text-[11px] text-[#8fa0b5]">Resolution Preset:</label>
              <select
                value={selectedMonitor.resolution}
                onChange={(e) => {
                  const preset = RESOLUTION_PRESETS.find(p => p.res === e.target.value);
                  if (preset) {
                    updateMonitor(selectedMonitor.id, {
                      resolution: preset.res,
                      width: preset.w,
                      height: preset.h
                    });
                  }
                }}
                className="w-full bg-[#121929] border border-[#22314e] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-400"
              >
                {RESOLUTION_PRESETS.map(p => (
                  <option key={p.res} value={p.res}>{p.label}</option>
                ))}
              </select>
            </div>

            {/* Refresh Rate Selector */}
            <div className="space-y-1.5">
              <label className="text-[11px] text-[#8fa0b5]">Refresh Rate (Hz):</label>
              <select
                value={selectedMonitor.refreshRate}
                onChange={(e) => updateMonitor(selectedMonitor.id, { refreshRate: parseInt(e.target.value) })}
                className="w-full bg-[#121929] border border-[#22314e] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-400"
              >
                {selectedMonitor.availableRefreshRates.map(rate => (
                  <option key={rate} value={rate}>{rate} Hz {rate >= 144 ? '★ High Refresh' : ''}</option>
                ))}
              </select>
            </div>

            {/* Display Scaling */}
            <div className="space-y-1.5">
              <label className="text-[11px] text-[#8fa0b5]">DPI UI Scaling:</label>
              <div className="flex items-center gap-2">
                {[1.0, 1.25, 1.5, 1.75, 2.0].map(s => (
                  <button
                    key={s}
                    onClick={() => updateMonitor(selectedMonitor.id, { scaling: s })}
                    className={`flex-1 py-1.5 rounded-lg border text-xs font-bold transition-all ${
                      selectedMonitor.scaling === s
                        ? 'bg-cyan-950 text-cyan-200 border-cyan-400'
                        : 'bg-[#121929] text-[#8fa0b5] border-[#22314e] hover:text-white'
                    }`}
                  >
                    {Math.round(s * 100)}%
                  </button>
                ))}
              </div>
            </div>

            {/* Orientation */}
            <div className="space-y-1.5">
              <label className="text-[11px] text-[#8fa0b5]">Rotation & Orientation:</label>
              <div className="flex items-center gap-2">
                {[
                  { key: 'normal', label: 'Landscape' },
                  { key: 'left', label: 'Portrait 90°' },
                  { key: 'inverted', label: 'Flipped 180°' },
                  { key: 'right', label: 'Portrait 270°' }
                ].map(o => (
                  <button
                    key={o.key}
                    onClick={() => updateMonitor(selectedMonitor.id, { orientation: o.key as DisplayMonitorConfig['orientation'] })}
                    className={`flex-1 py-1.5 rounded-lg border text-[11px] font-bold transition-all ${
                      selectedMonitor.orientation === o.key
                        ? 'bg-cyan-950 text-cyan-200 border-cyan-400'
                        : 'bg-[#121929] text-[#8fa0b5] border-[#22314e] hover:text-white'
                    }`}
                  >
                    {o.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Color Depth & HDR */}
            <div className="space-y-1.5">
              <label className="text-[11px] text-[#8fa0b5]">Color Gamut & Depth:</label>
              <div className="flex items-center gap-2">
                {['8-bit', '10-bit', '12-bit Deep Color'].map(cd => (
                  <button
                    key={cd}
                    onClick={() => updateMonitor(selectedMonitor.id, { colorDepth: cd as DisplayMonitorConfig['colorDepth'] })}
                    className={`flex-1 py-1.5 rounded-lg border text-[11px] font-bold transition-all ${
                      selectedMonitor.colorDepth === cd
                        ? 'bg-cyan-950 text-cyan-200 border-cyan-400'
                        : 'bg-[#121929] text-[#8fa0b5] border-[#22314e] hover:text-white'
                    }`}
                  >
                    {cd}
                  </button>
                ))}
              </div>
            </div>

            {/* HDR Toggle */}
            <div className="space-y-1.5 flex flex-col justify-end">
              <button
                onClick={() => updateMonitor(selectedMonitor.id, { hdrEnabled: !selectedMonitor.hdrEnabled })}
                className={`w-full py-2 rounded-lg border font-bold flex items-center justify-center gap-2 transition-all ${
                  selectedMonitor.hdrEnabled
                    ? 'bg-purple-950 text-purple-200 border-purple-400'
                    : 'bg-[#121929] text-[#8fa0b5] border-[#22314e] hover:text-white'
                }`}
              >
                <Zap className="w-3.5 h-3.5" />
                <span>{selectedMonitor.hdrEnabled ? 'HDR HIGH DYNAMIC RANGE: ENABLED' : 'ENABLE HDR (REC.2020)'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Export Linux Config & CLI Shell Output (1 Column) */}
        <div className="p-4 rounded-xl bg-[#0c0f18] border border-[#1b2234] space-y-3 flex flex-col justify-between">
          <div className="space-y-2">
            <div className="flex items-center justify-between border-b border-[#1b2234] pb-2">
              <span className="font-bold text-white flex items-center gap-2">
                <Terminal className="w-4 h-4 text-cyan-400" />
                <span>Linux Display Driver Exporter</span>
              </span>
            </div>

            <div className="space-y-2">
              <span className="text-[10px] text-[#8fa0b5]">X11 xrandr Command:</span>
              <pre className="p-2.5 rounded-lg bg-[#070a10] border border-[#1b253b] text-[10px] text-cyan-300 font-mono overflow-x-auto whitespace-pre-wrap">
                {generateXrandrCommand()}
              </pre>

              <button
                onClick={() => copyToClipboard(generateXrandrCommand())}
                className="w-full py-1.5 rounded-lg bg-[#141b2c] hover:bg-[#1e273e] border border-[#24314c] text-white text-[11px] flex items-center justify-center gap-1.5 transition-all"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>{copiedCmd ? 'Copied xrandr Command!' : 'Copy xrandr Command'}</span>
              </button>
            </div>

            <div className="space-y-1.5 pt-2 border-t border-[#1b2234]">
              <span className="text-[10px] text-[#8fa0b5]">Wayland wlr-randr Configuration:</span>
              <pre className="p-2.5 rounded-lg bg-[#070a10] border border-[#1b253b] text-[10px] text-purple-300 font-mono overflow-x-auto whitespace-pre-wrap">
                {generateWaylandCommand()}
              </pre>
            </div>
          </div>

          <div className="pt-3 border-t border-[#1b2234]">
            <button
              onClick={() => onRunCliCommand?.(generateXrandrCommand())}
              className="w-full py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-black font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-md shadow-cyan-600/30"
            >
              <Terminal className="w-3.5 h-3.5" />
              <span>Apply Driver Commands Now</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
