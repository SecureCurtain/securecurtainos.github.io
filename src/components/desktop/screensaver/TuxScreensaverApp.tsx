// jb7572_2026-09-03: Tux & Windows Butterfly Cartoon Screensaver Studio Application
// Interactive OS App allowing users to configure tools (Fly Swatter / Net on Pole), scenery, speed, and test cartoon antics

import React, { useState } from 'react';
import { 
  TuxChaseCanvas, 
  SceneryTheme, 
  ToolSelectionMode 
} from './TuxChaseCanvas';
import { 
  Tv, 
  Volume2, 
  VolumeX, 
  Gauge, 
  Sparkles, 
  Play, 
  RefreshCw, 
  Maximize2, 
  Info,
  Layers,
  Wand2,
  Lock,
  Timer,
  ShieldCheck,
  Keyboard,
  Clock
} from 'lucide-react';
import { useDesktop } from '../../../context/DesktopContext';

export const TuxScreensaverApp: React.FC = () => {
  const { 
    startScreensaver,
    lockSession,
    screensaverIdleTimeout,
    setScreensaverIdleTimeout,
    lockOnTimeout,
    setLockOnTimeout,
    screensaverOnLockHotkey,
    setScreensaverOnLockHotkey,
    idleSecondsRemaining,
    resetIdleTimer
  } = useDesktop();

  // Configuration States
  const [scenery, setScenery] = useState<SceneryTheme>('bliss');
  const [toolMode, setToolMode] = useState<ToolSelectionMode>('auto');
  const [speedMultiplier, setSpeedMultiplier] = useState<number>(1.0);
  const [butterflyCount, setButterflyCount] = useState<number>(1);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);

  // Live Stats from Canvas
  const [stats, setStats] = useState({
    catches: 0,
    swats: 0,
    netScoops: 0,
    currentTool: 'Fly Swatter'
  });

  // Manual Trigger Helpers
  const handleForceSwat = () => {
    if ((window as any).__tuxScreensaver) {
      (window as any).__tuxScreensaver.triggerSwat();
    }
  };

  const handleForceNet = () => {
    if ((window as any).__tuxScreensaver) {
      (window as any).__tuxScreensaver.triggerNet();
    }
  };

  const handleForceTrip = () => {
    if ((window as any).__tuxScreensaver) {
      (window as any).__tuxScreensaver.triggerTrip();
    }
  };

  const handleToolSwitch = () => {
    if ((window as any).__tuxScreensaver) {
      (window as any).__tuxScreensaver.triggerToolSwitch();
    }
  };

  return (
    <div className="h-full w-full flex flex-col bg-slate-950 text-slate-100 font-sans select-none overflow-hidden">
      {/* Top App Control Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-2.5 bg-slate-900/90 border-b border-slate-800 shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-lg shadow-inner">
            🐧
          </div>
          <div>
            <h2 className="text-sm font-bold text-white flex items-center gap-2 tracking-wide">
              Tux & Windows Butterfly Screensaver
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-mono border border-emerald-500/30">
                Cartoon Edition
              </span>
            </h2>
            <p className="text-[11px] text-slate-400 font-mono">
              Linux Penguin chasing the 4-Squares Windows Butterfly with Fly Swatter & Net
            </p>
          </div>
        </div>

        {/* Launch Fullscreen Screensaver Action Button */}
        <div className="flex items-center gap-2">
          {/* Lock Session Now Button */}
          <button
            onClick={() => {
              lockSession();
              if (screensaverOnLockHotkey) {
                startScreensaver();
              }
            }}
            className="px-3 py-1.5 rounded-lg bg-amber-600/90 hover:bg-amber-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-lg border border-amber-400/40 transition-all hover:scale-[1.02] active:scale-[0.98]"
            title="Lock screen immediately with hotkey <Ctrl> + L"
          >
            <Lock className="w-3.5 h-3.5" />
            <span>Lock Screen (Ctrl+L)</span>
          </button>

          <button
            onClick={() => {
              if (startScreensaver) {
                startScreensaver();
              }
            }}
            className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-lg shadow-emerald-950/50 border border-emerald-400/30 transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <Maximize2 className="w-3.5 h-3.5" />
            <span>Launch Full Screensaver</span>
          </button>

          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`p-1.5 rounded-lg border text-xs transition-colors ${
              soundEnabled
                ? 'bg-amber-500/20 border-amber-500/40 text-amber-300 hover:bg-amber-500/30'
                : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700'
            }`}
            title={soundEnabled ? 'Mute cartoon sounds' : 'Enable cartoon sounds'}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Main Content Area: Stage Canvas + Control Sidebar / Dock */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* Cartoon Animation Stage Canvas */}
        <div className="flex-1 relative bg-black flex flex-col overflow-hidden min-h-[280px]">
          <TuxChaseCanvas
            scenery={scenery}
            toolMode={toolMode}
            speedMultiplier={speedMultiplier}
            butterflyCount={butterflyCount}
            soundEnabled={soundEnabled}
            interactive={true}
            onStatsUpdate={setStats}
            className="w-full h-full"
          />

          {/* Quick Action Floating Bar at Canvas Bottom */}
          <div className="absolute top-3 left-3 flex items-center gap-2 bg-black/60 backdrop-blur-md px-3 py-1 rounded-full border border-white/10 text-xs font-mono text-slate-300 shadow-xl">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-semibold text-white">{stats.currentTool}</span>
            <span className="text-slate-500">•</span>
            <span>Swats: <strong className="text-cyan-400">{stats.swats}</strong></span>
            <span className="text-slate-500">•</span>
            <span>Net Scoops: <strong className="text-amber-400">{stats.netScoops}</strong></span>
          </div>
        </div>

        {/* Configuration & Fun Controls Panel */}
        <div className="w-full lg:w-80 bg-slate-900 border-t lg:border-t-0 lg:border-l border-slate-800 flex flex-col overflow-y-auto custom-scrollbar p-4 gap-4 shrink-0">
          
          {/* Section 1: Tool Selection */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Wand2 className="w-3.5 h-3.5 text-cyan-400" />
              Chasing Tool Mode
            </label>
            <div className="grid grid-cols-2 gap-1.5">
              <button
                onClick={() => setToolMode('auto')}
                className={`px-2.5 py-1.5 rounded-md text-xs font-medium text-left border transition-all ${
                  toolMode === 'auto'
                    ? 'bg-cyan-500/20 border-cyan-500 text-cyan-300 shadow-sm'
                    : 'bg-slate-800/60 border-slate-700/60 text-slate-300 hover:bg-slate-800'
                }`}
              >
                🔄 Auto Switch
                <span className="block text-[10px] text-slate-400">Swatter ⇄ Net</span>
              </button>

              <button
                onClick={() => setToolMode('swatter')}
                className={`px-2.5 py-1.5 rounded-md text-xs font-medium text-left border transition-all ${
                  toolMode === 'swatter'
                    ? 'bg-red-500/20 border-red-500 text-red-300 shadow-sm'
                    : 'bg-slate-800/60 border-slate-700/60 text-slate-300 hover:bg-slate-800'
                }`}
              >
                🪰 Fly Swatter
                <span className="block text-[10px] text-slate-400">Spring wire mesh</span>
              </button>

              <button
                onClick={() => setToolMode('net')}
                className={`px-2.5 py-1.5 rounded-md text-xs font-medium text-left border transition-all ${
                  toolMode === 'net'
                    ? 'bg-amber-500/20 border-amber-500 text-amber-300 shadow-sm'
                    : 'bg-slate-800/60 border-slate-700/60 text-slate-300 hover:bg-slate-800'
                }`}
              >
                🕸️ Net on Pole
                <span className="block text-[10px] text-slate-400">Long bamboo pole</span>
              </button>

              <button
                onClick={() => setToolMode('both')}
                className={`px-2.5 py-1.5 rounded-md text-xs font-medium text-left border transition-all ${
                  toolMode === 'both'
                    ? 'bg-purple-500/20 border-purple-500 text-purple-300 shadow-sm'
                    : 'bg-slate-800/60 border-slate-700/60 text-slate-300 hover:bg-slate-800'
                }`}
              >
                ⚔️ Dual Wield
                <span className="block text-[10px] text-slate-400">Swatter & Net</span>
              </button>
            </div>
          </div>

          {/* Section 2: Scenery Background */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-emerald-400" />
              Scenery Background
            </label>
            <div className="grid grid-cols-2 gap-1.5 text-xs">
              {[
                { id: 'bliss', label: 'Rolling Bliss Hills', icon: '🌿' },
                { id: 'night', label: 'Starry Night Meadow', icon: '🌙' },
                { id: 'matrix', label: 'Cyber Kernel Grid', icon: '💻' },
                { id: 'transparent', label: 'Transparent Desktop', icon: '🪟' },
              ].map(s => (
                <button
                  key={s.id}
                  onClick={() => setScenery(s.id as SceneryTheme)}
                  className={`p-2 rounded-md border text-left flex items-center gap-2 transition-all ${
                    scenery === s.id
                      ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300 font-semibold'
                      : 'bg-slate-800/60 border-slate-700/60 text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  <span>{s.icon}</span>
                  <span className="truncate">{s.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Section 3: Cartoon Speed & Butterfly Swarm */}
          <div className="space-y-3 p-3 rounded-lg bg-slate-800/50 border border-slate-700/60">
            <div>
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-slate-300 flex items-center gap-1">
                  <Gauge className="w-3 h-3 text-amber-400" />
                  Chase Pace
                </span>
                <span className="font-mono text-amber-400">
                  {speedMultiplier <= 0.7 ? 'Waddle' : speedMultiplier <= 1.2 ? 'Sprint' : 'Turbo Dash'} ({speedMultiplier.toFixed(1)}x)
                </span>
              </div>
              <input
                type="range"
                min="0.5"
                max="1.8"
                step="0.1"
                value={speedMultiplier}
                onChange={e => setSpeedMultiplier(parseFloat(e.target.value))}
                className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-amber-500"
              />
            </div>

            <div>
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-slate-300 flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-cyan-400" />
                  Windows Butterflies
                </span>
                <span className="font-mono text-cyan-400">{butterflyCount}</span>
              </div>
              <div className="flex gap-1">
                {[1, 2, 3, 5].map(n => (
                  <button
                    key={n}
                    onClick={() => setButterflyCount(n)}
                    className={`flex-1 py-1 rounded text-xs font-mono font-bold transition-colors ${
                      butterflyCount === n
                        ? 'bg-cyan-500 text-slate-950 shadow-sm'
                        : 'bg-slate-700/60 text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Section 4: Trigger Cartoon Antics */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Play className="w-3.5 h-3.5 text-purple-400" />
              Manual Cartoon Antics
            </label>
            <div className="grid grid-cols-2 gap-1.5 text-xs">
              <button
                onClick={handleForceSwat}
                className="px-2.5 py-2 rounded-md bg-red-500/20 hover:bg-red-500/30 border border-red-500/40 text-red-300 font-medium text-left flex items-center gap-1.5 transition-colors"
              >
                <span>💥</span>
                <span>Whack Swatter!</span>
              </button>

              <button
                onClick={handleForceNet}
                className="px-2.5 py-2 rounded-md bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 font-medium text-left flex items-center gap-1.5 transition-colors"
              >
                <span>🕸️</span>
                <span>Scoop Net Arc!</span>
              </button>

              <button
                onClick={handleForceTrip}
                className="px-2.5 py-2 rounded-md bg-yellow-500/20 hover:bg-yellow-500/30 border border-yellow-500/40 text-yellow-300 font-medium text-left flex items-center gap-1.5 transition-colors"
              >
                <span>💨</span>
                <span>Skid & Brake!</span>
              </button>

              <button
                onClick={handleToolSwitch}
                className="px-2.5 py-2 rounded-md bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/40 text-cyan-300 font-medium text-left flex items-center gap-1.5 transition-colors"
              >
                <span>🔄</span>
                <span>Switch Tool</span>
              </button>
            </div>
          </div>

          {/* Section 5: System Idle Timeout & Lock Hotkey Engine */}
          <div className="space-y-3 p-3 rounded-lg bg-slate-800/60 border border-slate-700">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                <Timer className="w-3.5 h-3.5 text-amber-400" />
                System Idle Timeout & Lock
              </label>
              {screensaverIdleTimeout > 0 && (
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                  <Clock className="w-2.5 h-2.5 animate-spin" />
                  {Math.floor(idleSecondsRemaining / 60)}m {idleSecondsRemaining % 60}s
                </span>
              )}
            </div>

            {/* Timeout duration selector */}
            <div className="space-y-1">
              <div className="text-[11px] text-slate-400 flex items-center justify-between">
                <span>Inactivity Trigger:</span>
                <span className="font-mono text-emerald-400">
                  {screensaverIdleTimeout === 0 ? 'Disabled' : `${screensaverIdleTimeout}s (${(screensaverIdleTimeout / 60).toFixed(1)}m)`}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-1">
                {[
                  { label: '15s (Test)', sec: 15 },
                  { label: '30s', sec: 30 },
                  { label: '1 min', sec: 60 },
                  { label: '2 min', sec: 120 },
                  { label: '5 min', sec: 300 },
                  { label: 'Off', sec: 0 }
                ].map(opt => (
                  <button
                    key={opt.sec}
                    onClick={() => setScreensaverIdleTimeout(opt.sec)}
                    className={`py-1 px-1.5 rounded text-[11px] font-mono font-medium transition-colors ${
                      screensaverIdleTimeout === opt.sec
                        ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
                        : 'bg-slate-700/60 text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Lock session on timeout toggle */}
            <label className="flex items-center gap-2 cursor-pointer pt-1 border-t border-slate-700/60">
              <input
                type="checkbox"
                checked={lockOnTimeout}
                onChange={e => setLockOnTimeout(e.target.checked)}
                className="rounded bg-slate-700 border-slate-600 text-emerald-500 focus:ring-emerald-500 w-3.5 h-3.5"
              />
              <span className="text-xs text-slate-300 select-none">
                Lock screen on timeout
              </span>
            </label>

            {/* Launch screensaver on Ctrl+L toggle */}
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={screensaverOnLockHotkey}
                onChange={e => setScreensaverOnLockHotkey(e.target.checked)}
                className="rounded bg-slate-700 border-slate-600 text-emerald-500 focus:ring-emerald-500 w-3.5 h-3.5"
              />
              <span className="text-xs text-slate-300 select-none">
                Start screensaver on <kbd className="px-1 py-0.2 rounded bg-slate-900 text-white font-mono font-bold text-[10px]">Ctrl+L</kbd>
              </span>
            </label>

            {/* Hotkey Info Banner */}
            <div className="p-2 rounded bg-slate-900/80 border border-slate-700/70 flex items-center justify-between text-[11px]">
              <div className="flex items-center gap-1.5 text-slate-300">
                <Keyboard className="w-3.5 h-3.5 text-cyan-400" />
                <span>Global Hotkey:</span>
              </div>
              <span className="font-mono text-cyan-300 font-bold bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-800/50">
                Ctrl + L
              </span>
            </div>
          </div>

          {/* Lore / Story description */}
          <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800 text-[11px] text-slate-400 space-y-1.5">
            <div className="font-semibold text-slate-300 flex items-center gap-1.5">
              <Info className="w-3.5 h-3.5 text-emerald-400" />
              Tux vs. Windows Four Squares
            </div>
            <p className="leading-relaxed">
              Tux is in relentless pursuit of the cheeky 4-colored Windows logo butterfly! When he gets close, he swings his mesh fly swatter or leaps with his bamboo-handled butterfly net, while the butterfly does loop-de-loops leaving rainbow sparkle trails.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
