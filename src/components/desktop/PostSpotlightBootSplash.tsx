// jb7572_2026-08-26: SecureCurtain Core Architecture - Diamond-Grade Post-POST Boot Spotlight Splash Screen
import React, { useState, useEffect, useRef } from 'react';
import {
  Scroll,
  HardDrive,
  Cpu,
  ShieldCheck,
  FileText,
  Key,
  Terminal,
  Zap,
  CheckCircle2,
  Sparkles,
  Layers,
  Activity,
  ArrowRight,
  Disc
} from 'lucide-react';

interface PostSpotlightBootSplashProps {
  onComplete: () => void;
}

interface ArtifactStation {
  id: string;
  name: string;
  category: string;
  x: number; // percentage of screen width
  y: number; // percentage of screen height
  icon: React.ReactNode;
  subtitle: string;
  details: string[];
  techSpec: string;
  telemetryLog: string;
}

const ARTIFACT_STATIONS: ArtifactStation[] = [
  {
    id: 'scrolls_legal',
    name: 'Evidentiary Chain-of-Custody & Legal Scrolls',
    category: 'Forensic Attestation',
    x: 20,
    y: 35,
    icon: <Scroll className="w-8 h-8 text-amber-400" />,
    subtitle: 'NIST SP 800-88 & Courtroom Cryptographic Manifest',
    details: [
      'Unbroken SHA-256 & Ed25519 legal attestation ledger',
      'Immutable evidentiary custody timestamping',
      'Digital certificate of zero data remanence'
    ],
    techSpec: 'Ed25519 / RFC 8032 Signature Hash Chain',
    telemetryLog: '[+] Verified Chain-of-Custody integrity manifest across all volumes.'
  },
  {
    id: 'hdd_platters',
    name: 'High-Speed Magnetic HDD (Dual Platter)',
    category: 'Physical Magnetic Media',
    x: 40,
    y: 65,
    icon: <Disc className="w-8 h-8 text-cyan-400" />,
    subtitle: '10,000 RPM Rotational Media with Servo Tracks',
    details: [
      'Spinning magnetic platters with micro-actuator positioning',
      'Forensic read-only hardware ring buffer engaged',
      'Hardware write-blocker preventing dirty-bit modifications'
    ],
    techSpec: 'SATA-III 6.0 Gb/s • 512e/4Kn Physical Sectors',
    telemetryLog: '[+] /dev/sda: Rotational media identified. Hardware write-block active.'
  },
  {
    id: 'nvme_ssd',
    name: 'M.2 NVMe PCIe 5.0 High-Density SSD',
    category: 'Solid-State Storage',
    x: 60,
    y: 35,
    icon: <HardDrive className="w-8 h-8 text-emerald-400" />,
    subtitle: '232-Layer 3D TLC NAND & Hardware Crypto Engine',
    details: [
      'Instant Media Encryption Key (MEK) crypto-erase controller',
      '128 Direct NVMe Submission/Completion hardware queues',
      'Wear-leveling and raw sector flash translation layer'
    ],
    techSpec: 'PCIe 5.0 x4 • NVMe 2.0c • 14,500 MB/s Read',
    telemetryLog: '[+] /dev/nvme0n1: NVMe SED namespace loaded. MEK key validated.'
  },
  {
    id: 'spi_microchip',
    name: 'Motherboard SPI Flash ROM & SMM Silicon',
    category: 'Firmware & Ring -2',
    x: 80,
    y: 65,
    icon: <Cpu className="w-8 h-8 text-purple-400" />,
    subtitle: '16 MB Winbond SPI Flash & Intel CSME / AMD PSP',
    details: [
      'Ring -2 System Management Mode (SMM) rootkit scanner',
      'TPM 2.0 PCR measured boot state validation',
      'Secure Boot DBX Revocation List (DBX-v372) verified'
    ],
    techSpec: 'Winbond W25Q128FV • SPI Direct Bus 0xFD000000',
    telemetryLog: '[+] SPI Flash ROM audited. 0 SMM rootkits detected.'
  }
];

export const PostSpotlightBootSplash: React.FC<PostSpotlightBootSplashProps> = ({ onComplete }) => {
  const [currentStationIndex, setCurrentStationIndex] = useState<number>(0);
  const [progress, setProgress] = useState<number>(5);
  const [bootLogs, setBootLogs] = useState<string[]>([
    '[  0.000000] POST (Power-On Self-Test) Completed Successfully (Passed 100%).',
    '[  0.118942] SecureCurtain Microkernel Initialized (x86_64 Long Mode).',
    '[  0.341029] Initializing hardware spotlight discovery subsystem...'
  ]);

  // Spotlight Coordinates (Percentage based, smooth interpolation)
  const [spotlightPos, setSpotlightPos] = useState<{ x: number; y: number }>({ x: 20, y: 35 });
  const [isPaused, setIsPaused] = useState<boolean>(false);

  // Auto-cycle through artifact stations during boot
  useEffect(() => {
    const totalDuration = 6000; // 6 seconds boot animation
    const intervalMs = 1500;

    const progressTimer = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(progressTimer);
          return 100;
        }
        return prev + 1;
      });
    }, totalDuration / 100);

    const stationCycle = setInterval(() => {
      setCurrentStationIndex(prev => {
        const next = (prev + 1) % ARTIFACT_STATIONS.length;
        const station = ARTIFACT_STATIONS[next];
        setSpotlightPos({ x: station.x, y: station.y });
        setBootLogs(logs => [...logs.slice(-6), station.telemetryLog]);
        return next;
      });
    }, intervalMs);

    const endTimer = setTimeout(() => {
      onComplete();
    }, totalDuration + 400);

    return () => {
      clearInterval(progressTimer);
      clearInterval(stationCycle);
      clearTimeout(endTimer);
    };
  }, [onComplete]);

  // Handle keyboard Escape or Enter to skip
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key === 'Enter' || e.key === ' ') {
        onComplete();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onComplete]);

  const activeStation = ARTIFACT_STATIONS[currentStationIndex];

  return (
    <div className="fixed inset-0 z-50 bg-[#030407] text-white flex flex-col justify-between overflow-hidden select-none font-mono">
      {/* 1. Dynamic Canvas / SVG Stage with Spotlight Beam */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Subtle Background Circuit & Grid Lines */}
        <div className="absolute inset-0 opacity-15 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:24px_24px]" />

        {/* Ambient Darkened Stage Gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#020306]/90 via-[#04060d]/80 to-[#020204]" />

        {/* Dynamic Weaving Spotlight Beam Overlay */}
        <div
          className="absolute w-[600px] h-[600px] rounded-full pointer-events-none transition-all duration-1000 ease-out -translate-x-1/2 -translate-y-1/2"
          style={{
            left: `${spotlightPos.x}%`,
            top: `${spotlightPos.y}%`,
            background: 'radial-gradient(circle, rgba(168, 85, 247, 0.28) 0%, rgba(56, 189, 248, 0.16) 40%, rgba(3, 4, 7, 0) 70%)',
            boxShadow: '0 0 120px 40px rgba(168, 85, 247, 0.12)'
          }}
        />

        {/* Spotlight Source Beam Cone from Top Center */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-40">
          <defs>
            <linearGradient id="spotlightBeamGrad" x1="50%" y1="0%" x2={`${spotlightPos.x}%`} y2={`${spotlightPos.y}%`}>
              <stop offset="0%" stopColor="#c084fc" stopOpacity="0.6" />
              <stop offset="50%" stopColor="#38bdf8" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#030407" stopOpacity="0" />
            </linearGradient>
          </defs>
          <polygon
            points={`50%,0 ${spotlightPos.x - 12}%,${spotlightPos.y}% ${spotlightPos.x + 12}%,${spotlightPos.y}%`}
            fill="url(#spotlightBeamGrad)"
            className="transition-all duration-1000 ease-out"
          />
        </svg>
      </div>

      {/* 2. Top Header Telemetry Bar */}
      <div className="relative z-20 px-8 py-5 flex items-center justify-between border-b border-white/10 bg-black/40 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-purple-950/80 border border-purple-500/40 text-purple-300 shadow-lg shadow-purple-950/60">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-white tracking-wider">SecureCurtain OS v2026.08</span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-purple-950 text-purple-300 border border-purple-500/30">
                POST-BOOT DISCOVERY STAGE
              </span>
            </div>
            <p className="text-[11px] text-[#8fa0b5]">
              Auditing hardware storage, NVMe cryptographic modules, legal scrolls, and SPI flash controllers.
            </p>
          </div>
        </div>

        <button
          onClick={onComplete}
          className="px-4 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs flex items-center gap-2 border border-white/20 transition-all shadow-md group"
        >
          <span>Skip to Login</span>
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-black/50 text-[#c4b5fd]">Esc</span>
          <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
        </button>
      </div>

      {/* 3. Center Stage: Interactive Artifact Station Targets */}
      <div className="relative z-20 flex-1 w-full max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
        {/* Left Side: All 4 Hardware & Legal Stations */}
        <div className="grid grid-cols-2 gap-4">
          {ARTIFACT_STATIONS.map((station, idx) => {
            const isHighlighted = idx === currentStationIndex;
            return (
              <div
                key={station.id}
                onClick={() => {
                  setCurrentStationIndex(idx);
                  setSpotlightPos({ x: station.x, y: station.y });
                }}
                className={`p-4 rounded-2xl border transition-all duration-500 cursor-pointer relative overflow-hidden ${
                  isHighlighted
                    ? 'bg-[#121626]/90 border-purple-500/80 shadow-2xl shadow-purple-900/50 scale-[1.03]'
                    : 'bg-[#090c15]/60 border-white/5 opacity-50 hover:opacity-80'
                }`}
              >
                {/* Spotlight Ambient Glow on Card */}
                {isHighlighted && (
                  <div className="absolute inset-0 bg-gradient-to-br from-purple-500/15 via-cyan-500/10 to-transparent pointer-events-none" />
                )}

                <div className="flex items-center justify-between mb-2.5">
                  <div className={`p-2.5 rounded-xl border ${
                    isHighlighted ? 'bg-purple-950/80 border-purple-500/50' : 'bg-black/40 border-white/10'
                  }`}>
                    {station.icon}
                  </div>
                  {isHighlighted && (
                    <span className="flex h-2 w-2 relative">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-purple-500"></span>
                    </span>
                  )}
                </div>

                <div className="text-xs font-bold text-white mb-1 line-clamp-1">{station.name}</div>
                <div className="text-[10px] text-[#8fa0b5] mb-2">{station.category}</div>
                <div className="text-[9px] text-[#708098] font-mono truncate">{station.techSpec}</div>
              </div>
            );
          })}
        </div>

        {/* Right Side: Active Highlighted Station Inspector */}
        <div className="bg-[#0b0e1a]/90 backdrop-blur-xl p-6 rounded-3xl border border-purple-500/40 shadow-2xl space-y-4">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-purple-400 animate-pulse" />
              <span className="text-xs font-bold uppercase tracking-wider text-purple-300">Spotlight Target Focused</span>
            </div>
            <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-500/30">
              HARDWARE AUDIT PASSED
            </span>
          </div>

          <div>
            <h3 className="text-lg font-bold text-white">{activeStation.name}</h3>
            <p className="text-xs text-purple-200/80 mt-0.5">{activeStation.subtitle}</p>
          </div>

          <div className="space-y-2 py-1">
            {activeStation.details.map((detail, dIdx) => (
              <div key={dIdx} className="flex items-start gap-2 text-xs text-[#cbd5e1]">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 mt-0.5 shrink-0" />
                <span>{detail}</span>
              </div>
            ))}
          </div>

          <div className="p-3 rounded-xl bg-[#05070e] border border-white/10 text-[11px] space-y-1">
            <div className="text-[#8fa0b5]">Bus Telemetry & Crypto Anchor:</div>
            <div className="text-cyan-300 font-mono select-all break-all">{activeStation.techSpec}</div>
          </div>
        </div>
      </div>

      {/* 4. Bottom Boot Logs & Progress Ribbon */}
      <div className="relative z-20 px-8 py-4 bg-black/60 backdrop-blur-md border-t border-white/10 space-y-3">
        {/* Live Kernel Logs Ticker */}
        <div className="p-2.5 rounded-xl bg-[#04060c] border border-white/10 font-mono text-[11px] text-[#8fa0b5] h-14 overflow-hidden flex flex-col justify-end space-y-0.5">
          {bootLogs.map((log, lIdx) => (
            <div
              key={lIdx}
              className={`${
                log.includes('[+]')
                  ? 'text-emerald-400 font-bold'
                  : log.includes('POST')
                  ? 'text-purple-300 font-bold'
                  : 'text-[#8fa0b5]'
              }`}
            >
              {log}
            </div>
          ))}
        </div>

        {/* Progress Bar & Status */}
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs font-mono">
            <span className="text-[#8fa0b5] flex items-center gap-2">
              <Activity className="w-3.5 h-3.5 text-purple-400 animate-pulse" />
              <span>Scanning hardware topology & preparing Login Session...</span>
            </span>
            <span className="text-purple-300 font-bold">{progress}%</span>
          </div>

          <div className="w-full bg-[#121626] h-2 rounded-full overflow-hidden border border-white/10">
            <div
              className="bg-gradient-to-r from-purple-500 via-cyan-400 to-emerald-400 h-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
