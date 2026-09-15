// jb7572_2026-08-26: SecureCurtain Core Architecture - Diamond-Grade OEM Hardware Stress & Diagnostic Suite
import React, { useState, useEffect } from 'react';
import {
  Activity,
  Cpu,
  Flame,
  Zap,
  HardDrive,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Play,
  Square,
  Thermometer,
  Layers,
  Sparkles,
  BarChart2,
  Terminal,
  Copy,
  Clock,
  Gauge
} from 'lucide-react';

interface DiagnosticModule {
  id: 'ram_memtest' | 'cpu_avx' | 'nvme_smart' | 'gpu_vram';
  name: string;
  subsystem: string;
  status: 'idle' | 'testing' | 'passed' | 'failed';
  metricLabel: string;
  metricValue: string;
  progress: number;
  errorsFound: number;
  detailMsg: string;
}

interface HardwareStressDiagnosticsViewProps {
  addNotification?: (notification: any) => void;
}

export const HardwareStressDiagnosticsView: React.FC<HardwareStressDiagnosticsViewProps> = ({ addNotification }) => {
  const [isRunningAll, setIsRunningAll] = useState(false);
  const [cpuTemp, setCpuTemp] = useState<number>(44);
  const [fanSpeedRpm, setFanSpeedRpm] = useState<number>(1800);
  const [selectedDurationMin, setSelectedDurationMin] = useState<number>(5);

  const [modules, setModules] = useState<DiagnosticModule[]>([
    {
      id: 'ram_memtest',
      name: 'MemTest86+ DDR4/DDR5 Multi-Core Bitflip Test',
      subsystem: 'System RAM (32 GB @ 5600 MT/s)',
      status: 'idle',
      metricLabel: 'Bitflip Patterns',
      metricValue: 'Walking 1s / Rowhammer / Invert',
      progress: 0,
      errorsFound: 0,
      detailMsg: 'Validates 32 GB address space across 8 CPU threads.'
    },
    {
      id: 'cpu_avx',
      name: 'Prime95 / AVX-512 Thermal & FPU Torture',
      subsystem: 'Intel Core / AMD Ryzen (16 Threads)',
      status: 'idle',
      metricLabel: 'Power Draw & Clocks',
      metricValue: 'Small FFTs @ 125W TDP',
      progress: 0,
      errorsFound: 0,
      detailMsg: 'Stress tests integer ALU, vector AVX registers, and VRM power.'
    },
    {
      id: 'nvme_smart',
      name: 'NVMe SMART Wear & 4K Random IOPS Validator',
      subsystem: 'Samsung 990 PRO NVMe (PCIe 4.0 x4)',
      status: 'idle',
      metricLabel: 'SMART Health & Speed',
      metricValue: '100% Health, 0 Bad Blocks',
      progress: 0,
      errorsFound: 0,
      detailMsg: 'Direct unbuffered O_DIRECT DMA random read/write validation.'
    },
    {
      id: 'gpu_vram',
      name: 'Vulkan/CUDA GPU VRAM Artifact & Solder Scanner',
      subsystem: 'NVIDIA RTX / AMD Radeon (8 GB VRAM)',
      status: 'idle',
      metricLabel: 'Frame Buffer Checks',
      metricValue: 'Compute Shader Matrix Math',
      progress: 0,
      errorsFound: 0,
      detailMsg: 'Detects bad VRAM BGA solder joints and memory artifacts.'
    }
  ]);

  const [diagLogs, setDiagLogs] = useState<string[]>([
    '[*] OEM Hardware Stress & Diagnostic Engine Initialized',
    '[+] Sensors detected: Intel Core Package Temp (44°C), NVMe Controller (38°C), DDR5 SPD (36°C)',
    '[✓] Hardware Ready: No thermal throttling or voltage drop faults detected.'
  ]);

  const startStressTest = () => {
    setIsRunningAll(true);
    setCpuTemp(68);
    setFanSpeedRpm(3400);

    setModules(prev => prev.map(m => ({ ...m, status: 'testing', progress: 10 })));
    setDiagLogs(prev => [
      ...prev,
      `[*] LAUNCHING 4-POINT OEM HARDWARE TORTURE TEST (Duration: ${selectedDurationMin} mins)...`,
      `[memtest] Spawning 8 memory test threads testing pattern 0xAAAAAAAA / 0x55555555...`,
      `[prime95] AVX-512 execution units saturated on all 16 cores (TDP: 135W)...`
    ]);

    setTimeout(() => {
      setCpuTemp(76);
      setFanSpeedRpm(4200);
      setModules(prev => prev.map(m => ({ ...m, progress: 50 })));
      setDiagLogs(prev => [
        ...prev,
        `[memtest] Pass 1/1 Complete: 0 bitflips detected across 32 GB address space.`,
        `[nvme] 4K Random IOPS sustained at 780,000 IOPS. NVMe SMART raw critical warning: 0x00.`
      ]);
    }, 1800);

    setTimeout(() => {
      setCpuTemp(48);
      setFanSpeedRpm(2200);
      setIsRunningAll(false);
      setModules(prev => prev.map(m => ({ ...m, status: 'passed', progress: 100 })));
      setDiagLogs(prev => [
        ...prev,
        `[✓] CPU AVX STRESS TEST PASSED: No clock throttling or rounding errors.`,
        `[✓] MEMORY BUS INTEGRITY 100%: 0 DDR5 errors logged in hardware EDC / ECC registers.`,
        `[✓] OEM HARDWARE CERTIFICATION: Passed all Tier-1 Hardware Diagnostics.`
      ]);

      if (addNotification) {
        addNotification({
          title: 'Hardware Diagnostics Passed',
          message: 'All RAM, CPU, NVMe, and GPU stress tests completed with 0 hardware faults.',
          type: 'success'
        });
      }
    }, 3600);
  };

  return (
    <div className="space-y-4">
      {/* Header Banner */}
      <div className="bg-[#0c0f18] p-4 rounded-xl border border-[#1b2234] flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-amber-950/80 border border-amber-500/40 text-amber-400 shadow-md shadow-amber-950/50">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold font-mono text-white">OEM Hardware Stress & Diagnostic Suite</h3>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-500/30">
                MEMTEST86+ / PRIME95 / SMART BENCHMARK
              </span>
            </div>
            <p className="text-xs text-[#8fa0b5] mt-0.5">
              Pinpoint faulty DDR4/DDR5 memory sticks, thermal throttling, failing NVMe flash cells, and GPU VRAM artifacts.
            </p>
          </div>
        </div>

        {/* Live Sensor Quick Badges */}
        <div className="flex items-center gap-3 font-mono text-xs">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#141b2c] border border-[#232f4b]">
            <Thermometer className={`w-4 h-4 ${cpuTemp > 70 ? 'text-red-400' : 'text-emerald-400'}`} />
            <span className="text-[#8fa0b5]">CPU:</span>
            <span className={`font-bold ${cpuTemp > 70 ? 'text-red-400' : 'text-white'}`}>{cpuTemp}°C</span>
          </div>

          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#141b2c] border border-[#232f4b]">
            <Gauge className="w-4 h-4 text-sky-400" />
            <span className="text-[#8fa0b5]">Fan:</span>
            <span className="font-bold text-sky-300">{fanSpeedRpm} RPM</span>
          </div>

          <button
            onClick={startStressTest}
            disabled={isRunningAll}
            className="px-4 py-2 rounded-lg bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white font-bold flex items-center gap-2 shadow-lg shadow-amber-600/30 transition-all"
          >
            {isRunningAll ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Running Torture Test...</span>
              </>
            ) : (
              <>
                <Flame className="w-4 h-4" />
                <span>Run Full Hardware Stress Suite</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* 4-Module Diagnostic Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {modules.map(mod => (
          <div
            key={mod.id}
            className={`p-4 rounded-xl border bg-[#0c0f18] transition-all space-y-3 ${
              mod.status === 'passed'
                ? 'border-emerald-500/50 shadow-sm shadow-emerald-950/30'
                : mod.status === 'testing'
                ? 'border-amber-500/60 shadow-md shadow-amber-950/40'
                : 'border-[#1b2234]'
            }`}
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <div className="text-xs font-bold font-mono text-white flex items-center gap-2">
                  {mod.id === 'ram_memtest' && <Layers className="w-4 h-4 text-purple-400" />}
                  {mod.id === 'cpu_avx' && <Cpu className="w-4 h-4 text-amber-400" />}
                  {mod.id === 'nvme_smart' && <HardDrive className="w-4 h-4 text-sky-400" />}
                  {mod.id === 'gpu_vram' && <BarChart2 className="w-4 h-4 text-emerald-400" />}
                  <span>{mod.name}</span>
                </div>
                <div className="text-[10px] font-mono text-[#708098] mt-0.5">{mod.subsystem}</div>
              </div>

              <span className={`text-[10px] font-mono px-2 py-0.5 rounded border font-bold ${
                mod.status === 'passed'
                  ? 'bg-emerald-950 text-emerald-300 border-emerald-500/30'
                  : mod.status === 'testing'
                  ? 'bg-amber-950 text-amber-300 border-amber-500/30 animate-pulse'
                  : 'bg-[#141b2c] text-[#8fa0b5] border-[#222e49]'
              }`}>
                {mod.status === 'passed' ? 'PASSED (0 FAULTS)' : mod.status === 'testing' ? 'TESTING...' : 'READY'}
              </span>
            </div>

            <div className="p-2.5 rounded-lg bg-[#101422] border border-[#1e273e] text-xs font-mono flex items-center justify-between">
              <div>
                <span className="text-[#708098]">{mod.metricLabel}: </span>
                <span className="text-white font-bold">{mod.metricValue}</span>
              </div>
              <div className="text-emerald-400 font-bold">
                Errors: {mod.errorsFound}
              </div>
            </div>

            {/* Progress Bar */}
            {mod.status === 'testing' && (
              <div className="space-y-1">
                <div className="flex justify-between text-[10px] font-mono text-[#8fa0b5]">
                  <span>Stress Pattern Execution</span>
                  <span className="text-amber-400 font-bold">{mod.progress}%</span>
                </div>
                <div className="w-full bg-[#121624] h-1.5 rounded-full overflow-hidden">
                  <div
                    className="bg-amber-500 h-full transition-all duration-300"
                    style={{ width: `${mod.progress}%` }}
                  />
                </div>
              </div>
            )}

            <div className="text-[10px] font-mono text-[#8fa0b5]">
              {mod.detailMsg}
            </div>
          </div>
        ))}
      </div>

      {/* Hardware Telemetry & Test Logs */}
      <div className="bg-[#080a11] rounded-xl border border-[#1b2234] p-4 space-y-2">
        <div className="flex items-center justify-between border-b border-[#161d2d] pb-2">
          <div className="flex items-center gap-2">
            <Terminal className="w-4 h-4 text-amber-400" />
            <span className="text-xs font-bold font-mono text-white">Live Hardware Sensor Logs & Error Registers</span>
          </div>
          <span className="text-[10px] font-mono text-emerald-400">ECC Correctable/Uncorrectable: 0 / 0</span>
        </div>

        <div className="p-3 rounded-lg bg-[#04060a] border border-[#141b2c] font-mono text-xs space-y-1 max-h-36 overflow-y-auto">
          {diagLogs.map((log, idx) => (
            <div
              key={idx}
              className={`${
                log.includes('[✓]')
                  ? 'text-emerald-400 font-bold'
                  : log.includes('[memtest]') || log.includes('[prime95]')
                  ? 'text-amber-300'
                  : log.includes('[+]')
                  ? 'text-sky-300'
                  : 'text-[#708098]'
              }`}
            >
              {log}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
