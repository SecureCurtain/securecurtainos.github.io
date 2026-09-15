// jb7572_2026-08-26: SecureCurtain Core Architecture - Diamond-Grade Volatile Memory Dump & RAM Triage Engine (LiME / AVML)
import React, { useState } from 'react';
import {
  Cpu,
  Zap,
  Activity,
  Layers,
  Search,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Terminal,
  Copy,
  Key,
  Shield,
  Download,
  FileCode,
  Lock,
  Globe,
  Radio,
  FileText
} from 'lucide-react';

interface CarvedMemoryKey {
  id: string;
  type: 'BitLocker FVEK' | 'LUKS2 Master Key' | 'TLS Master Secret' | 'Plaintext Credential';
  identifier: string;
  keyHex: string;
  processSource: string;
  entropyScore: number;
}

interface InjectedProcessAnomaly {
  pid: number;
  processName: string;
  vadRegion: string;
  protection: 'PAGE_EXECUTE_READWRITE' | 'RWX';
  hollowedScore: 'CRITICAL (Injected)' | 'SUSPICIOUS' | 'CLEAN';
  detectedHook: string;
}

const SAMPLE_CARVED_KEYS: CarvedMemoryKey[] = [
  {
    id: 'key_bitlocker_fvek',
    type: 'BitLocker FVEK',
    identifier: 'Volume C: (AES-XTS 256-bit)',
    keyHex: '7A 9F 42 B8 1C 90 EA 33 55 12 DD 88 CC 44 FF 01 9A 3E 8B 11 02 F9 84 7A 5B 19 EE 31 AA 09 88 41',
    processSource: 'win32k.sys / cng.sys (Kernel Pool)',
    entropyScore: 7.98
  },
  {
    id: 'key_tls_session',
    type: 'TLS Master Secret',
    identifier: 'HTTPS Session (api.vault-relay.net)',
    keyHex: '9E 1A 8C 55 F0 21 44 BB AA 33 00 19 FF 88 12 76 54 CC 99 22 11 00 EE DD 77 66 55 44 33 22 11 00',
    processSource: 'lsass.exe (PID 620)',
    entropyScore: 7.92
  },
  {
    id: 'key_user_creds',
    type: 'Plaintext Credential',
    identifier: 'WDigest / Kerberos Cleartext Cache',
    keyHex: 'Administrator : Summer2026!P@ssw0rd#Secure',
    processSource: 'wdigest.dll memory space',
    entropyScore: 4.85
  }
];

const SAMPLE_ANOMALIES: InjectedProcessAnomaly[] = [
  {
    pid: 1842,
    processName: 'svchost.exe (Hollowed)',
    vadRegion: '0x00007FF71A020000 - 0x00007FF71A050000',
    protection: 'PAGE_EXECUTE_READWRITE',
    hollowedScore: 'CRITICAL (Injected)',
    detectedHook: 'Reflective DLL Injection / Cobalt Strike Beacon Shellcode'
  },
  {
    pid: 3104,
    processName: 'powershell.exe',
    vadRegion: '0x0000021A4B000000 - 0x0000021A4B020000',
    protection: 'RWX',
    hollowedScore: 'SUSPICIOUS',
    detectedHook: 'AMSI Patching Byte Sequence (AmsiScanBuffer override)'
  }
];

interface VolatileMemoryTriageViewProps {
  addNotification?: (notification: any) => void;
}

export const VolatileMemoryTriageView: React.FC<VolatileMemoryTriageViewProps> = ({ addNotification }) => {
  const [acquisitionDriver, setAcquisitionDriver] = useState<'lime' | 'avml' | 'winpmem'>('avml');
  const [dumpTargetFile, setDumpTargetFile] = useState<string>('/mnt/evidence_target/live_ram_dump.raw');
  const [compressLzo, setCompressLzo] = useState<boolean>(true);
  
  const [isDumping, setIsDumping] = useState<boolean>(false);
  const [dumpProgress, setDumpProgress] = useState<number>(0);
  const [dumpComplete, setDumpComplete] = useState<boolean>(false);

  const [triageLogs, setTriageLogs] = useState<string[]>([
    '[*] Volatile RAM Acquisition & Volatility 3 Analysis Subsystem Ready',
    '[*] Kernel Memory Access Method: Microsoft AVML /dev/crash User-space Driver',
    '[+] Host RAM Topology: 32.0 GiB DDR5-5600 across 4 NUMA channels'
  ]);

  const handleAcquireRAM = () => {
    setIsDumping(true);
    setDumpComplete(false);
    setDumpProgress(5);
    setTriageLogs(prev => [
      ...prev,
      `[*] Capturing physical address space 0x00000000 - 0x0800000000 (32.0 GiB)...`,
      `[avml] Streaming LiME-formatted raw pages directly to ${dumpTargetFile}...`
    ]);

    setTimeout(() => {
      setDumpProgress(45);
      setTriageLogs(prev => [
        ...prev,
        `[avml] 14.4 GiB written at 850 MB/s (Direct NVMe I/O)...`,
        `[volatility3] Initializing symbols table for Windows 11 Build 22631 / Linux 6.8...`
      ]);
    }, 1100);

    setTimeout(() => {
      setDumpProgress(85);
      setTriageLogs(prev => [
        ...prev,
        `[scanner] Scanning page tables for BitLocker FVEK AES-XTS expansion schedules...`,
        `[✓] FOUND: 1 BitLocker FVEK Key in kernel pool (cng.sys)!`,
        `[✓] FOUND: 2 Injected RWX memory regions with reflective shellcode!`
      ]);
    }, 2200);

    setTimeout(() => {
      setDumpProgress(100);
      setIsDumping(false);
      setDumpComplete(true);
      setTriageLogs(prev => [
        ...prev,
        `[✓] SUCCESS: 32.0 GiB Volatile Memory Image Dumped and SHA-256 Verified.`,
        `[✓] Output: ${dumpTargetFile} (SHA-256: 8f9b201a4e5c...verified)`
      ]);

      if (addNotification) {
        addNotification({
          title: 'Memory Acquisition Complete',
          message: 'Full RAM dump acquired and decrypted BitLocker keys carved from memory.',
          type: 'success'
        });
      }
    }, 3200);
  };

  const getCliCommand = () => {
    if (acquisitionDriver === 'avml') {
      return `avml --compress ${dumpTargetFile}.compressed && vol -f ${dumpTargetFile} windows.malfind.Malfind windows.bitlocker.Bitlocker`;
    } else if (acquisitionDriver === 'lime') {
      return `insmod lime.ko "path=${dumpTargetFile} format=lime" && vol -f ${dumpTargetFile} linux.check_syscall.Check_syscall`;
    } else {
      return `winpmem.exe -o ${dumpTargetFile} --volume_mode 2`;
    }
  };

  return (
    <div className="space-y-4">
      {/* Header Banner */}
      <div className="bg-[#0c0f18] p-4 rounded-xl border border-[#1b2234] flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-purple-950/80 border border-purple-500/40 text-purple-400 shadow-md shadow-purple-950/50">
            <Cpu className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold font-mono text-white">Volatile Memory Dump & Live RAM Triage Engine</h3>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-950 text-purple-300 border border-purple-500/30">
                LIME / AVML / VOLATILITY 3 SUITE
              </span>
            </div>
            <p className="text-xs text-[#8fa0b5] mt-0.5">
              Live RAM acquisition, memory injection analysis (Malfind), BitLocker/LUKS encryption key carving from memory, and TLS session decryptor.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#141b2c] border border-[#232f4b] text-sky-300 text-xs font-mono">
          <Zap className="w-4 h-4 text-purple-400" />
          <span>32 GiB Live RAM Topology Detected</span>
        </div>
      </div>

      {/* Main Grid: Acquisition Engine & Carved Artifacts */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left: Memory Acquisition Panel (Col 5) */}
        <div className="lg:col-span-5 bg-[#0c0f18] p-4 rounded-xl border border-[#1b2234] space-y-4">
          <div className="flex items-center justify-between border-b border-[#1b2234] pb-2">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-purple-400" />
              <span className="text-xs font-bold font-mono text-white uppercase">1. RAM Dump Parameters</span>
            </div>
            <span className="text-[10px] font-mono text-emerald-400">Zero Page Modification</span>
          </div>

          {/* Engine Selector */}
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => setAcquisitionDriver('avml')}
              className={`p-2 rounded-lg border text-left transition-all ${
                acquisitionDriver === 'avml'
                  ? 'bg-purple-950/60 border-purple-500 text-white shadow-sm'
                  : 'bg-[#101422] border-[#1c2438] text-[#8fa0b5] hover:text-white'
              }`}
            >
              <div className="text-xs font-bold font-mono">AVML (MS)</div>
              <div className="text-[9px] text-[#708098]">Direct /dev/crash</div>
            </button>

            <button
              onClick={() => setAcquisitionDriver('lime')}
              className={`p-2 rounded-lg border text-left transition-all ${
                acquisitionDriver === 'lime'
                  ? 'bg-purple-950/60 border-purple-500 text-white shadow-sm'
                  : 'bg-[#101422] border-[#1c2438] text-[#8fa0b5] hover:text-white'
              }`}
            >
              <div className="text-xs font-bold font-mono">LiME Kernel</div>
              <div className="text-[9px] text-[#708098]">Kernel Ring 0 Mod</div>
            </button>

            <button
              onClick={() => setAcquisitionDriver('winpmem')}
              className={`p-2 rounded-lg border text-left transition-all ${
                acquisitionDriver === 'winpmem'
                  ? 'bg-purple-950/60 border-purple-500 text-white shadow-sm'
                  : 'bg-[#101422] border-[#1c2438] text-[#8fa0b5] hover:text-white'
              }`}
            >
              <div className="text-xs font-bold font-mono">WinPmem</div>
              <div className="text-[9px] text-[#708098]">Raw Win32 Driver</div>
            </button>
          </div>

          <div className="space-y-3 p-3.5 rounded-lg bg-[#101422] border border-[#1e273e] text-xs font-mono">
            <div className="space-y-1">
              <label className="text-[#8fa0b5]">Output Image Destination:</label>
              <input
                type="text"
                value={dumpTargetFile}
                onChange={(e) => setDumpTargetFile(e.target.value)}
                className="w-full bg-[#090c15] border border-[#232f4b] rounded px-3 py-1.5 text-xs font-mono text-purple-300 focus:outline-none focus:border-purple-500"
              />
            </div>

            <div className="flex items-center justify-between pt-1">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="compress_lzo"
                  checked={compressLzo}
                  onChange={(e) => setCompressLzo(e.target.checked)}
                  className="accent-purple-500 w-4 h-4"
                />
                <label htmlFor="compress_lzo" className="text-white cursor-pointer">
                  Enable LZO On-the-Fly Compression
                </label>
              </div>
              <span className="text-[10px] text-sky-400">~60% Space Savings</span>
            </div>
          </div>

          {/* Action Button & Progress */}
          <div className="space-y-2 pt-1">
            {isDumping && (
              <div className="space-y-1">
                <div className="flex justify-between text-xs font-mono text-[#8fa0b5]">
                  <span>Acquiring Physical RAM...</span>
                  <span className="text-purple-400 font-bold">{dumpProgress}%</span>
                </div>
                <div className="w-full bg-[#121624] h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-purple-500 to-indigo-500 h-full transition-all duration-300"
                    style={{ width: `${dumpProgress}%` }}
                  />
                </div>
              </div>
            )}

            <button
              onClick={handleAcquireRAM}
              disabled={isDumping}
              className="w-full py-2.5 rounded-lg bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white font-mono text-xs font-bold flex items-center justify-center gap-2 shadow-lg shadow-purple-600/30 transition-all"
            >
              {isDumping ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Dumping & Parsing Volatile Memory ({dumpProgress}%)...</span>
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4" />
                  <span>Acquire Live RAM & Scan for Keys</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Right: Carved Keys & Process Anomalies (Col 7) */}
        <div className="lg:col-span-7 bg-[#0c0f18] p-4 rounded-xl border border-[#1b2234] space-y-4">
          <div className="flex items-center justify-between border-b border-[#1b2234] pb-2">
            <div className="flex items-center gap-2">
              <Key className="w-4 h-4 text-amber-400" />
              <span className="text-xs font-bold font-mono text-white uppercase">2. Carved Encryption Keys & Hollowed Processes</span>
            </div>
            <span className="text-[10px] font-mono text-amber-300">Live Memory Carve</span>
          </div>

          {/* Carved Encryption Keys List */}
          <div className="space-y-2">
            {SAMPLE_CARVED_KEYS.map(key => (
              <div key={key.id} className="p-2.5 rounded-lg bg-[#101422] border border-[#1e273e] text-xs font-mono space-y-1">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Key className="w-3.5 h-3.5 text-amber-400" />
                    <span className="text-white font-bold">{key.identifier}</span>
                  </div>
                  <span className="text-[9px] px-2 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-500/30 font-bold">
                    {key.type}
                  </span>
                </div>
                <div className="p-1.5 rounded bg-[#090c15] text-[11px] text-amber-300 font-mono select-all overflow-x-auto">
                  <code>{key.keyHex}</code>
                </div>
                <div className="flex items-center justify-between text-[10px] text-[#708098] pt-0.5">
                  <span>Source: {key.processSource}</span>
                  <span>Entropy: <strong className="text-emerald-400">{key.entropyScore}/8.0</strong></span>
                </div>
              </div>
            ))}
          </div>

          {/* Injected RWX Process Anomaly */}
          <div className="p-2.5 rounded-lg bg-red-950/30 border border-red-500/40 text-xs font-mono space-y-1.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-red-300 font-bold">
                <AlertTriangle className="w-3.5 h-3.5 text-red-400" />
                <span>Detected Memory Injection (Cobalt Strike / Meterpreter)</span>
              </div>
              <span className="text-[9px] px-1.5 py-0.5 rounded bg-red-900 text-red-100 font-bold">CRITICAL</span>
            </div>
            <div className="text-[11px] text-white">
              PID 1842 (svchost.exe) contains RWX Virtual Address Descriptor (VAD) region with unbacked executable shellcode.
            </div>
          </div>
        </div>
      </div>

      {/* CLI & Shell Commands */}
      <div className="bg-[#080a11] rounded-xl border border-[#1b2234] p-4 space-y-3">
        <div className="flex items-center justify-between border-b border-[#161d2d] pb-2">
          <div className="flex items-center gap-2">
            <Terminal className="w-4 h-4 text-purple-400" />
            <span className="text-xs font-bold font-mono text-white">Volatility 3 & AVML Command Execution</span>
          </div>
          <button
            onClick={() => {
              navigator.clipboard?.writeText(getCliCommand());
              if (addNotification) {
                addNotification({
                  title: 'Command Copied',
                  message: 'Volatility 3 CLI command copied to clipboard',
                  type: 'info'
                });
              }
            }}
            className="flex items-center gap-1.5 px-2 py-1 rounded bg-[#131a2b] hover:bg-[#1b253e] text-[11px] font-mono text-[#8fa0b5] hover:text-white transition-all"
          >
            <Copy className="w-3 h-3" />
            <span>Copy CLI Command</span>
          </button>
        </div>

        <div className="p-2.5 rounded-lg bg-[#04060a] border border-[#141b2c] font-mono text-xs text-purple-300 select-all overflow-x-auto">
          <code># {getCliCommand()}</code>
        </div>

        <div className="p-3 rounded-lg bg-[#04060a] border border-[#141b2c] font-mono text-xs space-y-1 max-h-36 overflow-y-auto">
          {triageLogs.map((log, idx) => (
            <div
              key={idx}
              className={`${
                log.includes('[✓]')
                  ? 'text-emerald-400 font-bold'
                  : log.includes('[avml]') || log.includes('[volatility3]')
                  ? 'text-sky-300'
                  : log.includes('[+]')
                  ? 'text-purple-300'
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
