// jb7572_2026-09-03: Fullscreen Tux & Windows Butterfly Cartoon Screensaver Overlay
// Immersive screensaver with auto-hiding floating HUD, wake-up detection, and ambient digital clock

import React, { useState, useEffect, useRef } from 'react';
import { TuxChaseCanvas, SceneryTheme, ToolSelectionMode } from './TuxChaseCanvas';
import { 
  X, 
  Volume2, 
  VolumeX, 
  Sparkles, 
  Layers, 
  Settings2,
  Clock,
  Lock,
  ShieldCheck,
  Radio
} from 'lucide-react';
import { backgroundJobService, BackgroundJob } from '../../../services/backgroundJobService';

interface TuxScreensaverOverlayProps {
  onExit: () => void;
  initialScenery?: SceneryTheme;
  isLocked?: boolean;
}

export const TuxScreensaverOverlay: React.FC<TuxScreensaverOverlayProps> = ({
  onExit,
  initialScenery = 'bliss',
  isLocked = false
}) => {
  const [scenery, setScenery] = useState<SceneryTheme>(initialScenery);
  const [toolMode, setToolMode] = useState<ToolSelectionMode>('auto');
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [showHud, setShowHud] = useState<boolean>(true);
  const hudTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Live Clock
  const [timeStr, setTimeStr] = useState('');
  const [dateStr, setDateStr] = useState('');

  // Active Background Operations running while screensaver plays
  const [activeJobs, setActiveJobs] = useState<BackgroundJob[]>(() => backgroundJobService.getActiveJobs());

  useEffect(() => {
    const unsub = backgroundJobService.subscribe(jobs => {
      setActiveJobs(jobs.filter(j => j.status === 'RUNNING'));
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeStr(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
      setDateStr(now.toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' }));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Auto-hide HUD on idle mouse
  const handleMouseMove = () => {
    setShowHud(true);
    if (hudTimeoutRef.current) clearTimeout(hudTimeoutRef.current);
    hudTimeoutRef.current = setTimeout(() => {
      setShowHud(false);
    }, 3500);
  };

  useEffect(() => {
    hudTimeoutRef.current = setTimeout(() => setShowHud(false), 3500);
    return () => {
      if (hudTimeoutRef.current) clearTimeout(hudTimeoutRef.current);
    };
  }, []);

  // Exit on Escape key or any key when locked
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key === 'Enter' || e.key === ' ' || isLocked) {
        onExit();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onExit, isLocked]);

  return (
    <div
      onMouseMove={handleMouseMove}
      className="fixed inset-0 z-[9999] bg-black select-none overflow-hidden cursor-default transition-opacity duration-300"
    >
      {/* Fullscreen Master Cartoon Stage */}
      <TuxChaseCanvas
        scenery={scenery}
        toolMode={toolMode}
        speedMultiplier={1.05}
        butterflyCount={1}
        soundEnabled={soundEnabled}
        interactive={true}
        className="w-full h-full"
      />

      {/* Floating Ambient Time & Date Banner (Top-Left) */}
      <div 
        className={`absolute top-6 left-8 pointer-events-none transition-opacity duration-500 ${
          showHud ? 'opacity-90' : 'opacity-30'
        }`}
      >
        <div className="flex items-center gap-2 text-white/70 text-xs font-mono mb-0.5">
          <Clock className="w-3.5 h-3.5 text-amber-400" />
          <span>SecureCurtain Screensaver</span>
          {isLocked && (
            <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center gap-1 font-sans text-[10px] font-bold">
              <Lock className="w-3 h-3 text-amber-400" />
              Locked
            </span>
          )}
        </div>
        <div className="text-4xl font-extrabold tracking-tight text-white drop-shadow-[0_2px_10px_rgba(0,0,0,0.8)] font-mono">
          {timeStr}
        </div>
        <div className="text-xs font-medium text-white/80 drop-shadow-md">
          {dateStr}
        </div>

        {/* Active Background Operations Ticker while Screensaver is running */}
        {activeJobs.length > 0 && (
          <div className="mt-3 px-3 py-1.5 rounded-xl bg-black/60 backdrop-blur-md border border-cyan-500/40 text-cyan-200 text-xs font-mono flex items-center gap-2 max-w-sm shadow-2xl">
            <Radio className="w-3.5 h-3.5 text-cyan-400 animate-pulse shrink-0" />
            <div className="truncate">
              <span className="font-bold text-white">{activeJobs.length} Active Task{activeJobs.length > 1 ? 's' : ''}:</span>{' '}
              <span className="text-cyan-300">{activeJobs[0]?.name} ({activeJobs[0]?.progress.toFixed(0)}%)</span>
            </div>
          </div>
        )}
      </div>

      {/* Floating Screensaver Quick Controls (Top-Right) */}
      <div
        className={`absolute top-6 right-8 flex items-center gap-2 transition-all duration-300 ${
          showHud ? 'opacity-100 translate-y-0 pointer-events-auto' : 'opacity-0 -translate-y-2 pointer-events-none'
        }`}
      >
        {/* Scenery Selector */}
        <div className="flex items-center bg-black/60 backdrop-blur-md rounded-full p-1 border border-white/10 shadow-2xl">
          {(['bliss', 'night', 'matrix'] as SceneryTheme[]).map((s) => (
            <button
              key={s}
              onClick={() => setScenery(s)}
              className={`px-2.5 py-1 rounded-full text-xs font-medium capitalize transition-all ${
                scenery === s
                  ? 'bg-emerald-500 text-slate-950 font-bold shadow-md'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              {s}
            </button>
          ))}
        </div>

        {/* Tool Mode Selector */}
        <div className="flex items-center bg-black/60 backdrop-blur-md rounded-full p-1 border border-white/10 shadow-2xl">
          <button
            onClick={() => setToolMode('auto')}
            className={`px-2.5 py-1 rounded-full text-xs font-medium transition-all ${
              toolMode === 'auto'
                ? 'bg-cyan-500 text-slate-950 font-bold shadow-md'
                : 'text-slate-300 hover:text-white'
            }`}
            title="Auto-switch between Swatter & Net"
          >
            Auto
          </button>
          <button
            onClick={() => setToolMode('swatter')}
            className={`px-2 py-1 rounded-full text-xs font-medium transition-all ${
              toolMode === 'swatter'
                ? 'bg-red-500 text-white font-bold shadow-md'
                : 'text-slate-300 hover:text-white'
            }`}
            title="Fly Swatter Only"
          >
            🪰
          </button>
          <button
            onClick={() => setToolMode('net')}
            className={`px-2 py-1 rounded-full text-xs font-medium transition-all ${
              toolMode === 'net'
                ? 'bg-amber-500 text-slate-950 font-bold shadow-md'
                : 'text-slate-300 hover:text-white'
            }`}
            title="Net on Pole Only"
          >
            🕸️
          </button>
        </div>

        {/* Audio Toggle */}
        <button
          onClick={() => setSoundEnabled(!soundEnabled)}
          className={`p-2 rounded-full border backdrop-blur-md transition-all ${
            soundEnabled
              ? 'bg-amber-500/20 border-amber-500/40 text-amber-300 hover:bg-amber-500/30'
              : 'bg-black/60 border-white/10 text-slate-400 hover:text-white'
          }`}
          title={soundEnabled ? 'Mute sound' : 'Unmute sound'}
        >
          {soundEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
        </button>

        {/* Exit Screensaver / Unlock Button */}
        <button
          onClick={onExit}
          className={`px-3.5 py-1.5 rounded-full text-white text-xs font-bold flex items-center gap-1.5 shadow-xl transition-all hover:scale-105 active:scale-95 border ${
            isLocked
              ? 'bg-amber-600/95 hover:bg-amber-500 border-amber-400/50 shadow-amber-950/50'
              : 'bg-red-600/90 hover:bg-red-500 border-red-400/40 shadow-red-950/50'
          }`}
          title={isLocked ? 'Unlock Workstation' : 'Exit screensaver and wake desktop'}
        >
          {isLocked ? <Lock className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5" />}
          <span>{isLocked ? 'Unlock Workstation' : 'Wake Desktop (Esc)'}</span>
        </button>
      </div>

      {/* Bottom Wake Prompt */}
      <div 
        className={`absolute bottom-6 inset-x-0 flex justify-center pointer-events-none transition-opacity duration-300 ${
          showHud ? 'opacity-90' : 'opacity-0'
        }`}
      >
        <div className="px-4 py-1.5 rounded-full bg-black/60 backdrop-blur-md border border-white/10 text-xs font-mono text-slate-300 shadow-xl flex items-center gap-2">
          {isLocked ? (
            <span>
              <strong className="text-amber-300">🔒 Workstation Locked:</strong> Press any key, <kbd className="px-1.5 py-0.5 rounded bg-white/20 text-white font-bold">Esc</kbd>, or click <strong>Unlock</strong> to authenticate
            </span>
          ) : (
            <span>
              Press <kbd className="px-1.5 py-0.5 rounded bg-white/20 text-white font-bold">Esc</kbd> or click <strong>Wake Desktop</strong> to return to SecureCurtain
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
