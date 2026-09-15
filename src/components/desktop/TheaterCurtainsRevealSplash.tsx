// jb7572_2026-08-27: SecureCurtain Core Architecture - Diamond-Grade Royal Purple Theater Curtains Parting Stage Reveal with Deep Gold & Silver Thread Drapery
import React, { useState, useEffect, useRef } from 'react';
import {
  Sparkles,
  Shield,
  Layers,
  ArrowRight,
  Tv,
  Crown,
  Volume2,
  VolumeX,
  Music,
  Clock,
  Play,
  Pause,
  Upload,
  RotateCcw,
  CheckCircle2,
  FileText
} from 'lucide-react';
import { soundSystemService } from '../../services/soundSystemService';

interface TheaterCurtainsRevealSplashProps {
  onRevealComplete: () => void;
}

export const TheaterCurtainsRevealSplash: React.FC<TheaterCurtainsRevealSplashProps> = ({ onRevealComplete }) => {
  const [curtainProgress, setCurtainProgress] = useState<number>(0); // 0 (fully closed) to 100 (fully parted)
  const [stagePhase, setStagePhase] = useState<'stage_reading' | 'parting' | 'revealed'>('stage_reading');
  const [spotlightAngle, setSpotlightAngle] = useState<number>(0);
  const [stageReadingTimeLeft, setStageReadingTimeLeft] = useState<number>(4); // Snappy 4-second initial reading delay
  const [isTimerPaused, setIsTimerPaused] = useState<boolean>(false);
  const [revealHoldTimeLeft, setRevealHoldTimeLeft] = useState<number>(4); // 4 seconds hold after parting completes
  const [isAudioMuted, setIsAudioMuted] = useState<boolean>(soundSystemService.getMasterMute());
  const [audioSource, setAudioSource] = useState<string>('Battlestar Galactica — Cylon Command: "Your system is ready, Imperious leader"');
  const [playbackSeconds, setPlaybackSeconds] = useState<number>(0);
  const maxAudioDuration = 30; // Up to 30 seconds

  // Play audio overture on mount
  useEffect(() => {
    const splashCfg = soundSystemService.getEvent('splash_curtains');
    if (splashCfg) {
      if (splashCfg.customAudioUrl) {
        setAudioSource(splashCfg.customAudioUrl);
      } else if (splashCfg.synthPreset === 'cylon_voice_ready') {
        setAudioSource('BSG Cylon Command: "Your system is ready, Imperious leader"');
      } else if (splashCfg.synthPreset === 'brass_fanfare') {
        setAudioSource('Grand Orchestral Fanfare & Brass Overture');
      }
    }

    if (!isAudioMuted) {
      soundSystemService.play('splash_curtains');
    }

    const playTimer = setInterval(() => {
      setPlaybackSeconds(prev => {
        if (prev >= maxAudioDuration) {
          clearInterval(playTimer);
          return maxAudioDuration;
        }
        return prev + 1;
      });
    }, 1000);

    return () => {
      clearInterval(playTimer);
      soundSystemService.stopAll();
    };
  }, []);

  // Spotlights movement loop
  useEffect(() => {
    const spotTimer = setInterval(() => {
      setSpotlightAngle(prev => (prev + 1.2) % 360);
    }, 30);
    return () => clearInterval(spotTimer);
  }, []);

  // Stage Reading Countdown: Gives operator generous time to read all manifest details before parting
  useEffect(() => {
    if (stagePhase !== 'stage_reading' || isTimerPaused) return;

    if (stageReadingTimeLeft <= 0) {
      setStagePhase('parting');
      return;
    }

    const readTimer = setTimeout(() => {
      setStageReadingTimeLeft(prev => Math.max(0, prev - 1));
    }, 1000);

    return () => clearTimeout(readTimer);
  }, [stagePhase, isTimerPaused, stageReadingTimeLeft]);

  // Smooth curtain parting animation
  useEffect(() => {
    if (stagePhase !== 'parting') return;

    if (curtainProgress >= 100) {
      setStagePhase('revealed');
      return;
    }

    const partingTimer = setInterval(() => {
      setCurtainProgress(prev => {
        if (prev >= 100) {
          clearInterval(partingTimer);
          return 100;
        }
        return prev + 0.9; // Smooth majestic unhurried parting
      });
    }, 35);

    return () => clearInterval(partingTimer);
  }, [stagePhase, curtainProgress]);

  // Hold phase after curtains fully parted to allow reading revealed state
  useEffect(() => {
    if (stagePhase !== 'revealed') return;

    if (revealHoldTimeLeft <= 0) {
      onRevealComplete();
      return;
    }

    const holdTimer = setTimeout(() => {
      setRevealHoldTimeLeft(prev => Math.max(0, prev - 1));
    }, 1000);

    return () => clearTimeout(holdTimer);
  }, [stagePhase, revealHoldTimeLeft, onRevealComplete]);

  // Toggle Mute
  const handleToggleMute = () => {
    const nextMute = !isAudioMuted;
    setIsAudioMuted(nextMute);
    soundSystemService.setEventMute('splash_curtains', nextMute);
    if (!nextMute) {
      soundSystemService.play('splash_curtains');
    } else {
      soundSystemService.stopAll();
    }
  };

  // Spotlight 1 & 2 Math Coordinates
  const spot1X = 50 + Math.sin((spotlightAngle * Math.PI) / 180) * 32;
  const spot1Y = 45 + Math.cos((spotlightAngle * Math.PI) / 180) * 15;

  const spot2X = 50 - Math.sin(((spotlightAngle + 60) * Math.PI) / 180) * 28;
  const spot2Y = 50 + Math.cos(((spotlightAngle + 60) * Math.PI) / 180) * 18;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden select-none pointer-events-auto bg-[#020205] text-white font-sans">
      {/* 1. Stage Floor & Golden Footlights */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom,#1a0914_0%,#050207_70%,#000000_100%)] pointer-events-none" />

      {/* Stage Footlight Glow & Wood Plank Shading */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[#180a11] via-[#291220] to-transparent opacity-85 border-t border-amber-900/30 pointer-events-none" />

      {/* 2. Dual Volumetric Moving Spotlights */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* Spotlight Beam 1 (Warm Amber Gold) */}
        <div
          className="absolute w-[750px] h-[750px] rounded-full pointer-events-none transition-all duration-75 ease-out -translate-x-1/2 -translate-y-1/2 opacity-70"
          style={{
            left: `${spot1X}%`,
            top: `${spot1Y}%`,
            background: 'radial-gradient(circle, rgba(251, 191, 36, 0.38) 0%, rgba(245, 158, 11, 0.16) 45%, transparent 75%)',
            boxShadow: '0 0 160px 50px rgba(245, 158, 11, 0.18)'
          }}
        />

        {/* Spotlight Beam 2 (Royal Violet) */}
        <div
          className="absolute w-[650px] h-[650px] rounded-full pointer-events-none transition-all duration-75 ease-out -translate-x-1/2 -translate-y-1/2 opacity-65"
          style={{
            left: `${spot2X}%`,
            top: `${spot2Y}%`,
            background: 'radial-gradient(circle, rgba(168, 85, 247, 0.32) 0%, rgba(217, 70, 239, 0.14) 40%, transparent 70%)',
            boxShadow: '0 0 140px 45px rgba(168, 85, 247, 0.14)'
          }}
        />

        {/* Overhead Conical Beams */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-35">
          <defs>
            <linearGradient id="goldConeSplash" x1="20%" y1="0%" x2={`${spot1X}%`} y2={`${spot1Y}%`}>
              <stop offset="0%" stopColor="#d97706" stopOpacity="0.75" />
              <stop offset="60%" stopColor="#92400e" stopOpacity="0.22" />
              <stop offset="100%" stopColor="#000" stopOpacity="0" />
            </linearGradient>
            <linearGradient id="violetConeSplash" x1="80%" y1="0%" x2={`${spot2X}%`} y2={`${spot2Y}%`}>
              <stop offset="0%" stopColor="#c084fc" stopOpacity="0.75" />
              <stop offset="60%" stopColor="#7c3aed" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#000" stopOpacity="0" />
            </linearGradient>
          </defs>
          <polygon points={`20%,0 ${spot1X - 16}%,${spot1Y}% ${spot1X + 16}%,${spot1Y}%`} fill="url(#goldConeSplash)" />
          <polygon points={`80%,0 ${spot2X - 16}%,${spot2Y}% ${spot2X + 16}%,${spot2Y}%`} fill="url(#violetConeSplash)" />
        </svg>
      </div>

      {/* 3. Center Stage Manifest & Scrolls (Revealed Behind Parting Curtains) */}
      <div
        className={`absolute inset-0 flex flex-col items-center justify-center text-center px-6 max-w-4xl mx-auto transition-all duration-500 pointer-events-none ${
          stagePhase === 'revealed' ? 'z-40' : 'z-20'
        }`}
        style={{
          opacity: 1, // Keep words 100% visible throughout stage reading, parting, and revealed hold
          transform: `scale(${0.96 + (curtainProgress / 100) * 0.04})`
        }}
      >
        <div className="relative p-3.5 rounded-2xl bg-[#0e0618]/90 backdrop-blur-xl border-2 border-[#d4af37]/80 shadow-2xl shadow-purple-950/90 mb-3 pointer-events-auto">
          {/* Subtle Silver Thread Cross-Accent */}
          <div className="absolute inset-0 rounded-2xl pointer-events-none border border-slate-200/30" />
          <Crown className="w-10 h-10 text-[#f59e0b] animate-pulse drop-shadow-[0_0_12px_rgba(212,175,55,0.8)]" />
        </div>

        <h1 className="text-3xl sm:text-5xl font-extrabold font-serif tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-[#fef08a] via-[#d4af37] to-[#b45309] drop-shadow-2xl">
          SECURECURTAIN OS
        </h1>

        <p className="text-xs sm:text-sm font-mono text-[#fbbf24] tracking-widest mt-2 uppercase font-bold drop-shadow flex items-center justify-center gap-2">
          <span className="h-px w-6 bg-gradient-to-r from-transparent via-[#cbd5e1] to-[#d4af37]" />
          <span>✦ Live Forensic Operating System & Hardware Triage Stage ✦</span>
          <span className="h-px w-6 bg-gradient-to-l from-transparent via-[#cbd5e1] to-[#d4af37]" />
        </p>

        {/* Read-Only Stage Scroll Manifest */}
        <div className="mt-5 p-4 rounded-2xl bg-[#0a0414]/90 backdrop-blur-2xl border border-[#d4af37]/50 text-left max-w-xl w-full shadow-2xl space-y-2 pointer-events-auto relative overflow-hidden">
          {/* Silver Thread Micro-Shimmer Line */}
          <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-[#e2e8f0]/60 to-transparent" />
          <div className="flex items-center justify-between border-b border-[#d4af37]/25 pb-1.5 text-[11px] font-mono text-[#f59e0b]">
            <span className="font-bold flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-[#d4af37]" />
              <span>STAGE MANIFEST & LEGAL CHAIN-OF-CUSTODY</span>
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded bg-purple-950/80 border border-[#d4af37]/40 text-[#fde047] shadow-sm">
              NIST SP 800-88 R1
            </span>
          </div>

          <div className="text-xs text-amber-50 font-mono space-y-1.5">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>x86_64 Hardened Microkernel loaded with zero ring-0 telemetry leaks.</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>Hardware write-block active on all detected rotational & flash media.</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>Air-gapped threat intelligence signature tables verified intact.</span>
            </div>
          </div>

          {/* Interactive Phase Status & Extended Reading Bar */}
          <div className="pt-2 flex flex-wrap items-center justify-between gap-2 text-[11px] font-mono text-[#fbbf24]/90 border-t border-[#d4af37]/20">
            {stagePhase === 'stage_reading' && (
              <>
                <div className="flex items-center gap-2">
                  <Clock className={`w-3.5 h-3.5 ${isTimerPaused ? 'text-[#fde047]' : 'animate-spin text-[#d4af37]'}`} />
                  <span>
                    {isTimerPaused ? (
                      <span className="text-[#fde047] font-bold">Timer Paused ({stageReadingTimeLeft}s remaining)</span>
                    ) : (
                      <span>Curtains parting in <strong className="text-white text-xs">{stageReadingTimeLeft}s</strong>...</span>
                    )}
                  </span>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setIsTimerPaused(!isTimerPaused)}
                    className="px-2 py-0.5 rounded bg-[#1b0a2e] hover:bg-[#2c1348] border border-[#d4af37]/40 text-[#fde047] text-[10px] transition-all flex items-center gap-1"
                    title={isTimerPaused ? 'Resume countdown' : 'Pause timer to read indefinitely'}
                  >
                    {isTimerPaused ? <Play className="w-3 h-3 text-emerald-400" /> : <Pause className="w-3 h-3 text-[#d4af37]" />}
                    <span>{isTimerPaused ? 'Resume' : 'Pause'}</span>
                  </button>

                  <button
                    onClick={() => setStageReadingTimeLeft(prev => prev + 5)}
                    className="px-2 py-0.5 rounded bg-[#1b0a2e] hover:bg-[#2c1348] border border-[#d4af37]/40 text-[#fde047] text-[10px] font-bold transition-all"
                    title="Add 5 more seconds to reading timer"
                  >
                    +5s Read
                  </button>

                  <button
                    onClick={() => setStagePhase('parting')}
                    className="px-2.5 py-0.5 rounded bg-gradient-to-r from-[#d4af37] to-[#b45309] hover:from-[#f59e0b] hover:to-[#d97706] text-black font-bold text-[10px] transition-all flex items-center gap-1 shadow-md shadow-[#d4af37]/30"
                  >
                    <span>Part Now</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </>
            )}

            {stagePhase === 'parting' && (
              <div className="w-full flex items-center justify-between text-[#fde047]">
                <span className="flex items-center gap-2">
                  <Sparkles className="w-3.5 h-3.5 text-[#d4af37] animate-spin" />
                  <span>Parting Royal Purple Velvet Curtains... ({Math.round(curtainProgress)}%)</span>
                </span>
                <span className="text-[10px] text-slate-300">Revealing workspace behind stage...</span>
              </div>
            )}

            {stagePhase === 'revealed' && (
              <>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Curtains parted! Entering desktop in <strong className="text-white text-xs">{revealHoldTimeLeft}s</strong>...</span>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setRevealHoldTimeLeft(prev => prev + 10)}
                    className="px-2.5 py-0.5 rounded bg-[#1b0a2e] hover:bg-[#2c1348] border border-[#d4af37]/40 text-[#fde047] text-[10px] font-bold transition-all"
                  >
                    +10s Read More
                  </button>

                  <button
                    onClick={onRevealComplete}
                    className="px-3 py-0.5 rounded bg-gradient-to-r from-[#d4af37] to-[#b45309] hover:from-[#f59e0b] hover:to-[#d97706] text-black font-bold text-[10px] transition-all flex items-center gap-1 shadow-md shadow-[#d4af37]/40"
                  >
                    <span>Enter Desktop</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* 4. Top Theatrical Valance Drapery & Deep Gold with Silver Thread Fringe */}
      <div className="absolute top-0 left-0 right-0 h-16 sm:h-20 z-40 bg-gradient-to-b from-[#18052e] via-[#3b0764] to-[#240644] border-b-2 border-[#d4af37]/80 shadow-2xl flex items-center justify-around overflow-hidden pointer-events-none">
        {/* Silver thread shimmer pinstripes across top valance */}
        <div className="absolute inset-0 bg-[repeating-linear-gradient(90deg,transparent,transparent_28px,rgba(226,232,240,0.18)_29px,transparent_30px)] pointer-events-none" />
        
        {Array.from({ length: 9 }).map((_, i) => (
          <div
            key={i}
            className="w-32 h-16 rounded-b-full bg-gradient-to-b from-[#581c87] via-[#4c1d95] to-[#1e0538] border-b-2 border-[#d4af37] shadow-lg -mt-6 relative overflow-hidden"
          >
            {/* Woven silver thread highlight */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(248,250,252,0.22)_0%,transparent_65%)]" />
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-[#92400e] via-[#f59e0b] via-[#e2e8f0] to-[#92400e]" />
          </div>
        ))}
      </div>

      {/* 5. Majestic Parting Left Royal Purple Velvet Curtain Panel with Silver Threads */}
      <div
        className="absolute top-0 bottom-0 left-0 z-30 bg-gradient-to-r from-[#120322] via-[#2e0854] via-[#4c1d95] via-[#581c87] to-[#280746] shadow-2xl transition-transform duration-75 ease-out overflow-hidden pointer-events-none"
        style={{
          width: '50%',
          transform: `translateX(-${curtainProgress}%)`,
          boxShadow: '20px 0 60px rgba(0, 0, 0, 0.95)'
        }}
      >
        {/* Fluted Velvet Folds & Pleats */}
        <div className="absolute inset-0 flex justify-between opacity-85">
          {Array.from({ length: 14 }).map((_, i) => (
            <div
              key={i}
              className="h-full flex-1 bg-gradient-to-r from-black/55 via-transparent to-black/40 border-r border-purple-950/40 relative"
            >
              {/* Vertical woven silver thread filament along pleats */}
              {i % 2 === 0 && (
                <div className="absolute top-0 bottom-0 left-1/2 w-[1px] bg-gradient-to-b from-[#cbd5e1]/10 via-[#f8fafc]/35 via-[#e2e8f0]/45 to-[#cbd5e1]/15" />
              )}
            </div>
          ))}
        </div>
        
        {/* Diagonal silver brocade thread shimmer overlay */}
        <div className="absolute inset-0 bg-[repeating-linear-gradient(45deg,transparent,transparent_40px,rgba(226,232,240,0.06)_41px,transparent_42px)] pointer-events-none" />

        {/* Deep Gold Seam Trim with Intertwined Silver Thread Rope */}
        <div className="absolute top-0 bottom-0 right-0 w-4 bg-gradient-to-b from-[#b45309] via-[#d4af37] via-[#f59e0b] to-[#92400e] shadow-md border-l border-[#fde047]/60 flex flex-col justify-between items-center py-2">
          {/* Braided silver thread strand down inner seam edge */}
          <div className="w-[1.5px] h-full bg-gradient-to-b from-slate-200 via-white via-slate-300 to-slate-200 opacity-90" />
        </div>
      </div>

      {/* 6. Majestic Parting Right Royal Purple Velvet Curtain Panel with Silver Threads */}
      <div
        className="absolute top-0 bottom-0 right-0 z-30 bg-gradient-to-l from-[#120322] via-[#2e0854] via-[#4c1d95] via-[#581c87] to-[#280746] shadow-2xl transition-transform duration-75 ease-out overflow-hidden pointer-events-none"
        style={{
          width: '50%',
          transform: `translateX(${curtainProgress}%)`,
          boxShadow: '-20px 0 60px rgba(0, 0, 0, 0.95)'
        }}
      >
        {/* Fluted Velvet Folds & Pleats */}
        <div className="absolute inset-0 flex justify-between opacity-85">
          {Array.from({ length: 14 }).map((_, i) => (
            <div
              key={i}
              className="h-full flex-1 bg-gradient-to-l from-black/55 via-transparent to-black/40 border-l border-purple-950/40 relative"
            >
              {/* Vertical woven silver thread filament along pleats */}
              {i % 2 === 0 && (
                <div className="absolute top-0 bottom-0 left-1/2 w-[1px] bg-gradient-to-b from-[#cbd5e1]/10 via-[#f8fafc]/35 via-[#e2e8f0]/45 to-[#cbd5e1]/15" />
              )}
            </div>
          ))}
        </div>

        {/* Diagonal silver brocade thread shimmer overlay */}
        <div className="absolute inset-0 bg-[repeating-linear-gradient(-45deg,transparent,transparent_40px,rgba(226,232,240,0.06)_41px,transparent_42px)] pointer-events-none" />

        {/* Deep Gold Seam Trim with Intertwined Silver Thread Rope */}
        <div className="absolute top-0 bottom-0 left-0 w-4 bg-gradient-to-b from-[#b45309] via-[#d4af37] via-[#f59e0b] to-[#92400e] shadow-md border-r border-[#fde047]/60 flex flex-col justify-between items-center py-2">
          {/* Braided silver thread strand down inner seam edge */}
          <div className="w-[1.5px] h-full bg-gradient-to-b from-slate-200 via-white via-slate-300 to-slate-200 opacity-90" />
        </div>
      </div>

      {/* 7. Bottom Audio & Stage Controls Bar */}
      <div className="absolute bottom-5 left-6 right-6 z-50 flex items-center justify-between pointer-events-auto">
        {/* Audio Track Info */}
        <div className="relative">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#0b0314]/85 backdrop-blur-md border border-[#d4af37]/45 text-xs font-mono text-amber-100 shadow-xl shadow-purple-950/60">
            <button
              onClick={handleToggleMute}
              title={isAudioMuted ? 'Unmute Curtains Audio' : 'Mute Curtains Audio'}
              className="p-1 rounded hover:bg-white/10 text-[#d4af37] hover:text-white transition-colors"
            >
              {isAudioMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-[#d4af37]" />}
            </button>

            <span className="hidden sm:inline text-[#cbd5e1] truncate max-w-xs">{audioSource}</span>
            <span className="text-[10px] text-[#f59e0b] font-mono">({playbackSeconds}s / {maxAudioDuration}s)</span>

            <span className="text-[10px] px-2 py-0.5 rounded bg-purple-950/90 text-purple-200 border border-purple-500/30">
              Cockpit Sound System
            </span>
          </div>
        </div>

        {/* Enter Desktop Button */}
        <button
          onClick={onRevealComplete}
          className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#d4af37] via-[#f59e0b] to-[#b45309] hover:from-[#fef08a] hover:via-[#f59e0b] hover:to-[#d97706] text-black font-bold text-xs font-mono flex items-center gap-2 transition-all shadow-xl shadow-[#d4af37]/35 group"
        >
          <span>Enter Desktop</span>
          <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
        </button>
      </div>
    </div>
  );
};
