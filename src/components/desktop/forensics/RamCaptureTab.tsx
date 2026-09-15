// jb7572_2026-09-01: Live RAM Capturer Suite with DMA Direct Hardware Support & RFC 3227 / ISO 27037 Compliance Guard
import React, { useState } from 'react';
import { 
  RamCaptureDescriptor, 
  MOCK_RAM_CAPTURES 
} from '../../../services/forensicsService';
import { 
  Cpu, 
  Play, 
  CheckCircle2, 
  ShieldCheck, 
  Clock, 
  Hash, 
  Copy, 
  Terminal, 
  FileCode, 
  Network, 
  Activity, 
  Lock,
  Layers,
  Zap,
  HardDrive,
  Radio,
  AlertTriangle,
  FileCheck2,
  FileText
} from 'lucide-react';

interface RamCaptureTabProps {
  onNotify: (title: string, message: string) => void;
}

type ToolEngine = 
  | 'Belkasoft Live RAM Capturer' 
  | 'Magnet Forensics RAM Capturer' 
  | 'VolatileDataCollector'
  | 'Hardware PCIe DMA (PCILeech / Thunderbolt Direct)'
  | 'WinPmem Direct Kernel Ring 0';

export const RamCaptureTab: React.FC<RamCaptureTabProps> = ({ onNotify }) => {
  const [captures, setCaptures] = useState<RamCaptureDescriptor[]>(MOCK_RAM_CAPTURES);
  const [selectedTool, setSelectedTool] = useState<ToolEngine>('Belkasoft Live RAM Capturer');
  const [includePagefile, setIncludePagefile] = useState(true);
  const [bypassAntiDebug, setBypassAntiDebug] = useState(true);
  const [dmaInterface, setDmaInterface] = useState<'Thunderbolt 3/4' | 'PCIe x4 Leech' | 'ExpressCard DMA'>('Thunderbolt 3/4');
  const [iommuBypass, setIommuBypass] = useState(true);
  const [isCapturing, setIsCapturing] = useState(false);
  const [captureProgress, setCaptureProgress] = useState(0);
  const [selectedCaptureId, setSelectedCaptureId] = useState<string>(MOCK_RAM_CAPTURES[0].id);

  const selectedCapture = captures.find(c => c.id === selectedCaptureId) || captures[0];
  const isDmaMode = selectedTool === 'Hardware PCIe DMA (PCILeech / Thunderbolt Direct)';

  const handleStartCapture = () => {
    setIsCapturing(true);
    setCaptureProgress(5);
    
    if (isDmaMode) {
      onNotify(
        'PCIe DMA Hardware Acquisition Initiated', 
        `Probing physical bus via ${dmaInterface}. Target CPU instructions: 0 altered.`
      );
    } else {
      onNotify(
        'Kernel Ring 0 RAM Acquisition Initiated', 
        `Hooking memory Page Frame Numbers (PFN) via ${selectedTool}...`
      );
    }

    let progress = 5;
    const interval = setInterval(() => {
      progress += Math.floor(Math.random() * 15) + (isDmaMode ? 18 : 10);
      if (progress >= 100) {
        progress = 100;
        clearInterval(interval);
        setIsCapturing(false);
        setCaptureProgress(100);

        const newCap: RamCaptureDescriptor = {
          id: `ram-cap-${Date.now()}`,
          toolUsed: selectedTool,
          acquisitionMethod: isDmaMode ? 'PCIE_DMA_HARDWARE' : 'RING_0_DRIVER',
          dmaConfig: isDmaMode ? {
            interfaceType: dmaInterface,
            cpuInstructionChangesCount: 0,
            targetOsBypassed: true,
            iommuStatus: iommuBypass ? 'Bypassed (VT-d / AMD-Vi Inactive or Direct DMA)' : 'Enforced',
            transferRateMBs: 2600
          } : undefined,
          standardsCompliance: {
            rfc3227Order: 'Volatile Priority 1 (Registers & RAM)',
            iso27037Compliant: true,
            nist80086Verified: true,
            targetDiskWritesBytes: 0,
            auditedSelfFootprintPID: isDmaMode ? 0 : 5348,
            auditedKernelDriverOffset: isDmaMode 
              ? 'NONE (Direct Bus Controller Read - Zero CPU Execution)'
              : '0xFFFFF8014E400000 - 0xFFFFF8014E411000 (68 KB)'
          },
          outputFile: isDmaMode 
            ? `/mnt/forensic_vault/RAM_DUMPS/dma_hw_capture_${Date.now().toString().slice(-4)}.raw`
            : `/mnt/forensic_vault/RAM_DUMPS/live_ram_capture_${Date.now().toString().slice(-4)}.raw`,
          sizeBytes: isDmaMode ? 68719476736 : 34359738368,
          ramType: 'DDR5',
          totalPhysicalMemoryMB: isDmaMode ? 65536 : 32768,
          osArchitecture: 'x86-64 (AMD64)',
          md5: 'e1d2c3b4a5f60718293a4b5c6d7e8f90',
          sha256: '9f83c6b410741f0b0932514f00b0ff01f2d6be9e1c18ce1e81307a541d81f0f7',
          durationSecs: isDmaMode ? 24 : 38,
          bypassAntiDebug,
          includesPagefile: isDmaMode ? false : includePagefile,
          timestamp: new Date().toISOString(),
          triageSummary: {
            activeProcessesCount: isDmaMode ? 168 : 154,
            openSocketsCount: isDmaMode ? 48 : 41,
            loadedDriversCount: isDmaMode ? 238 : 219,
            clipboardTextSnippet: isDmaMode
              ? 'session_key=0x9f83c6b410741f0b0932514f00b0ff01'
              : 'powershell -NoProfile -ExecutionPolicy Bypass -Command "Invoke-Mimikatz"'
          }
        };

        setCaptures(prev => [newCap, ...prev]);
        setSelectedCaptureId(newCap.id);
        onNotify(
          'RAM Acquisition Complete', 
          `Saved uncompressed physical memory dump with ISO/IEC 27037 verification.`
        );
      } else {
        setCaptureProgress(progress);
      }
    }, 350);
  };

  const copyHash = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    onNotify('Copied Hash', `${label} copied to clipboard`);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner & Compliance Badges */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-lg relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="p-2 bg-indigo-500/20 text-indigo-400 rounded-lg">
                <Cpu className="w-5 h-5" />
              </span>
              <h2 className="text-xl font-bold text-slate-100">Live Physical RAM & DMA Acquisition Station</h2>
              <span className="px-2 py-0.5 text-xs font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-full">
                Kernel Ring-0 & Hardware DMA Direct
              </span>
            </div>
            <p className="text-xs text-slate-400 max-w-3xl">
              Extract uncompressed volatile physical memory, CPU register states, and encryption keys from live suspect computers. Fully compliant with <strong>RFC 3227 (Order of Volatility)</strong>, <strong>ISO/IEC 27037</strong>, and <strong>NIST SP 800-86</strong> with zero target disk footprint and audited self-memory logging.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-800/80 border border-emerald-500/30 text-[11px] font-mono text-emerald-300 rounded-lg">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              RFC 3227 & ISO 27037 Locked
            </span>
            <span className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-800/80 border border-indigo-500/30 text-[11px] font-mono text-indigo-300 rounded-lg">
              <Zap className="w-3.5 h-3.5 text-indigo-400" />
              0-Byte Target Disk Write
            </span>
          </div>
        </div>
      </div>

      {/* Compliance Standards Notice Bar */}
      <div className="bg-slate-950/80 border border-indigo-900/40 rounded-xl p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 text-xs text-slate-300">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 bg-indigo-500/10 text-indigo-400 rounded">
            <FileCheck2 className="w-4 h-4" />
          </div>
          <div>
            <span className="font-semibold text-slate-200">Legal Audit Mandate (ACPO Principle 2 / NIST SP 800-86):</span>{' '}
            <span className="text-slate-400">All live captures execute directly from USB memory buffer, streaming uncompressed raw data to external storage with dual cryptographic stream hashing.</span>
          </div>
        </div>
        <div className="flex items-center gap-2 text-[11px] font-mono bg-slate-900 px-2.5 py-1 rounded border border-slate-800 text-emerald-400 shrink-0">
          <CheckCircle2 className="w-3.5 h-3.5" /> Self-Footprint Auto-Logged
        </div>
      </div>

      {/* Main Grid: Control Panel + Live Captures Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Acquisition Config */}
        <div className="lg:col-span-5 space-y-5">
          <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 space-y-4">
            <h3 className="text-sm font-semibold text-slate-200 uppercase tracking-wider flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Terminal className="w-4 h-4 text-indigo-400" />
                Acquisition Engine & Mode
              </span>
              <span className="text-[11px] font-mono text-indigo-400">
                {isDmaMode ? 'Hardware DMA' : 'Ring 0 Driver'}
              </span>
            </h3>

            {/* Select Tool Engine */}
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Forensic Memory Engine</label>
              <div className="grid grid-cols-1 gap-2">
                {[
                  { 
                    id: 'Hardware PCIe DMA (PCILeech / Thunderbolt Direct)', 
                    tag: 'DMA Direct Hardware',
                    desc: 'Zero CPU instructions altered. Direct PCIe/Thunderbolt bus memory read with target OS completely bypassed.' 
                  },
                  { 
                    id: 'Belkasoft Live RAM Capturer', 
                    tag: 'Ring 0 Signed Driver',
                    desc: 'Direct Page Frame Number (PFN) read. Bypasses hypervisors, EDR rootkits, and anti-debugging hooks.' 
                  },
                  { 
                    id: 'Magnet Forensics RAM Capturer', 
                    tag: 'Ring 0 Minimal Footprint',
                    desc: 'Micro-kernel driver (<50 KB). Safely captures memory on encrypted or locked suspect workstations.' 
                  },
                  { 
                    id: 'VolatileDataCollector', 
                    tag: 'Ring 0 + Triage',
                    desc: 'Captures physical RAM stream plus volatile ARP cache, open sockets, and live process tables.' 
                  }
                ].map(tool => (
                  <button
                    key={tool.id}
                    onClick={() => setSelectedTool(tool.id as ToolEngine)}
                    className={`text-left p-3 rounded-lg border text-xs transition-all ${
                      selectedTool === tool.id
                        ? 'bg-indigo-600/20 border-indigo-500/80 text-white shadow-[0_0_12px_rgba(99,102,241,0.25)]'
                        : 'bg-slate-800/60 border-slate-700/60 text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-slate-100">{tool.id}</span>
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-900 text-indigo-300 border border-slate-700">
                        {tool.tag}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-400 mt-1">{tool.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Mode-Specific Settings */}
            {isDmaMode ? (
              <div className="bg-indigo-950/30 border border-indigo-800/50 rounded-lg p-3 space-y-3">
                <div className="text-xs font-semibold text-indigo-300 flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 text-amber-400" />
                  Hardware DMA Direct Configuration
                </div>
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">DMA Physical Interface</label>
                  <select
                    value={dmaInterface}
                    onChange={(e) => setDmaInterface(e.target.value as any)}
                    className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 font-mono"
                  >
                    <option value="Thunderbolt 3/4">Thunderbolt 3 / 4 (USB-C 40 Gbps PCIe Tunnel)</option>
                    <option value="PCIe x4 Leech">PCIe x4 / M.2 Direct Card Leech Interface</option>
                    <option value="ExpressCard DMA">ExpressCard 54/34 Direct DMA Bus</option>
                  </select>
                </div>
                <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer pt-1">
                  <input
                    type="checkbox"
                    checked={iommuBypass}
                    onChange={(e) => setIommuBypass(e.target.checked)}
                    className="rounded bg-slate-800 border-slate-700 text-indigo-600 focus:ring-0"
                  />
                  <span>Bypass Intel VT-d / AMD-Vi IOMMU Page Tables</span>
                </label>
              </div>
            ) : (
              /* Ring 0 Software Driver Options */
              <div className="space-y-2 pt-1 border-t border-slate-800/80">
                <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={bypassAntiDebug}
                    onChange={(e) => setBypassAntiDebug(e.target.checked)}
                    className="rounded bg-slate-800 border-slate-700 text-indigo-600 focus:ring-0"
                  />
                  <span>Bypass Anti-Debugging & EDR Rootkit Detection</span>
                </label>

                <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={includePagefile}
                    onChange={(e) => setIncludePagefile(e.target.checked)}
                    className="rounded bg-slate-800 border-slate-700 text-indigo-600 focus:ring-0"
                  />
                  <span>Include VSS Shadow Copy Pagefile.sys Acquisition</span>
                </label>
              </div>
            )}

            {/* Target Destination & Compliance Info */}
            <div className="bg-slate-950/60 border border-slate-800 rounded-lg p-3 text-xs font-mono space-y-1.5 text-slate-300">
              <div className="flex justify-between text-slate-400">
                <span>Target Output Vault:</span>
                <span className="text-emerald-400">External USB Drive</span>
              </div>
              <div className="text-indigo-400 truncate font-semibold">/mnt/forensic_vault/RAM_DUMPS/</div>
              <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-400 pt-1.5 border-t border-slate-800/60">
                <div>
                  <span className="text-slate-500">Target DiskWrites:</span>{' '}
                  <span className="text-emerald-400 font-bold">0 Bytes</span>
                </div>
                <div>
                  <span className="text-slate-500">Volatile Order:</span>{' '}
                  <span className="text-slate-300">RFC 3227 Step 1</span>
                </div>
              </div>
            </div>

            {/* Progress Bar (if acquiring) */}
            {isCapturing && (
              <div className="space-y-2 bg-indigo-950/40 border border-indigo-800/50 rounded-lg p-3">
                <div className="flex justify-between text-xs font-mono text-indigo-300">
                  <span>{isDmaMode ? 'Streaming DMA Physical Bus...' : 'Dumping Page Frame Numbers (PFN)...'}</span>
                  <span>{captureProgress}%</span>
                </div>
                <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div 
                    className="bg-indigo-500 h-full transition-all duration-300 ease-out"
                    style={{ width: `${captureProgress}%` }}
                  />
                </div>
              </div>
            )}

            {/* Action Trigger */}
            <button
              onClick={handleStartCapture}
              disabled={isCapturing}
              className={`w-full py-3 px-4 rounded-lg font-semibold text-xs flex items-center justify-center gap-2 shadow-lg transition-all ${
                isCapturing
                  ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                  : 'bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white shadow-indigo-500/20'
              }`}
            >
              {isDmaMode ? (
                <>
                  <Zap className="w-4 h-4 text-amber-300 fill-current" />
                  {isCapturing ? 'Acquiring via DMA Hardware...' : 'Initiate Hardware PCIe DMA Capture'}
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-current" />
                  {isCapturing ? 'Acquiring Volatile Memory...' : 'Initiate Kernel Ring 0 RAM Capture'}
                </>
              )}
            </button>
          </div>
        </div>

        {/* Right Column: Captured Evidence & Triage Inspector */}
        <div className="lg:col-span-7 space-y-5">
          {/* Captured Memory Dumps List */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 space-y-4">
            <h3 className="text-sm font-semibold text-slate-200 uppercase tracking-wider flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-emerald-400" />
                Physical Memory Dumps Repository
              </span>
              <span className="text-xs font-normal text-slate-400 font-mono">
                {captures.length} captures verified
              </span>
            </h3>

            <div className="space-y-2">
              {captures.map(cap => (
                <div
                  key={cap.id}
                  onClick={() => setSelectedCaptureId(cap.id)}
                  className={`p-3 rounded-lg border text-xs cursor-pointer transition-all ${
                    selectedCaptureId === cap.id
                      ? 'bg-slate-800/90 border-indigo-500 text-white shadow-sm'
                      : 'bg-slate-800/40 border-slate-700/60 text-slate-300 hover:bg-slate-800/70'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="font-semibold text-slate-100 flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${cap.acquisitionMethod === 'PCIE_DMA_HARDWARE' ? 'bg-amber-400' : 'bg-emerald-400'}`} />
                      {cap.toolUsed}
                      {cap.acquisitionMethod === 'PCIE_DMA_HARDWARE' && (
                        <span className="text-[10px] px-1.5 py-0.2 bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded">
                          DMA Hardware
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] font-mono text-slate-400">
                      {new Date(cap.timestamp).toLocaleString()}
                    </span>
                  </div>

                  <div className="flex items-center justify-between mt-2 text-[11px] font-mono text-slate-400">
                    <span className="truncate max-w-[280px] text-indigo-400">{cap.outputFile}</span>
                    <span>{(cap.sizeBytes / 1073741824).toFixed(1)} GB ({cap.ramType})</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Selected Capture Details & Forensic Audit Log */}
            {selectedCapture && (
              <div className="mt-4 pt-4 border-t border-slate-800 space-y-4">
                {/* Method & Standards Grid */}
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="bg-slate-950/70 border border-slate-800 p-3 rounded-lg space-y-1">
                    <div className="text-slate-400">Acquisition Method</div>
                    <div className="font-semibold text-slate-200">
                      {selectedCapture.acquisitionMethod === 'PCIE_DMA_HARDWARE'
                        ? 'Hardware DMA (Direct Bus Controller)'
                        : 'Signed Ring-0 Kernel Driver'}
                    </div>
                    <div className="text-[11px] text-slate-400">
                      {selectedCapture.dmaConfig 
                        ? `Interface: ${selectedCapture.dmaConfig.interfaceType} (${selectedCapture.dmaConfig.transferRateMBs} MB/s)`
                        : selectedCapture.osArchitecture}
                    </div>
                  </div>

                  <div className="bg-slate-950/70 border border-slate-800 p-3 rounded-lg space-y-1">
                    <div className="text-slate-400">Audit & Disk Footprint</div>
                    <div className="font-semibold text-emerald-400">0 Bytes Written to Target Disk</div>
                    <div className="text-[11px] text-slate-400">
                      Duration: {selectedCapture.durationSecs}s | ISO/IEC 27037 Verified
                    </div>
                  </div>
                </div>

                {/* Forensic Footprint Audit Box (ACPO Principle 2 / NIST Compliance) */}
                <div className="bg-slate-950/90 border border-slate-800 rounded-lg p-3 space-y-2 text-xs">
                  <div className="flex items-center justify-between text-slate-300 font-semibold uppercase tracking-wider text-[11px]">
                    <span className="flex items-center gap-1.5 text-indigo-400">
                      <FileText className="w-3.5 h-3.5" />
                      Self-Footprint Forensic Audit Log (For Court Testimony)
                    </span>
                    <span className="text-[10px] text-emerald-400 font-mono">RFC 3227 COMPLIANT</span>
                  </div>

                  <div className="bg-slate-900/90 p-2.5 rounded border border-slate-800 font-mono text-[11px] space-y-1 text-slate-300">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Tool Process ID (PID):</span>
                      <span className="text-slate-200">
                        {selectedCapture.standardsCompliance?.auditedSelfFootprintPID === 0 
                          ? '0 (Zero PID - External DMA Controller)' 
                          : selectedCapture.standardsCompliance?.auditedSelfFootprintPID || 4928}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Driver Memory Offset:</span>
                      <span className="text-amber-300 truncate max-w-[280px]">
                        {selectedCapture.standardsCompliance?.auditedKernelDriverOffset || '0xFFFFF8014E200000 - 0xFFFFF8014E212000'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Target CPU Register Impact:</span>
                      <span className="text-emerald-400">
                        {selectedCapture.acquisitionMethod === 'PCIE_DMA_HARDWARE' ? '0 Instructions Altered' : 'Audited & Documented'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Hashes */}
                <div className="bg-slate-950/90 border border-slate-800 rounded-lg p-3 space-y-2 text-xs font-mono">
                  <div className="flex items-center justify-between text-slate-400">
                    <span>Cryptographic Stream Verification</span>
                    <span className="text-emerald-400 flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5" /> Chain of Custody Verified
                    </span>
                  </div>

                  <div className="flex items-center justify-between bg-slate-900/80 p-2 rounded border border-slate-800">
                    <div className="truncate mr-2">
                      <span className="text-slate-500">SHA256:</span> {selectedCapture.sha256}
                    </div>
                    <button 
                      onClick={() => copyHash(selectedCapture.sha256, 'SHA-256')}
                      className="p-1 hover:bg-slate-800 text-slate-400 hover:text-slate-200 rounded"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Live Volatile Triage Summary */}
                {selectedCapture.triageSummary && (
                  <div className="bg-slate-950/90 border border-slate-800 rounded-lg p-3 space-y-3">
                    <div className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                      <Activity className="w-4 h-4 text-indigo-400" />
                      Live Volatile Triage Artifacts
                    </div>

                    <div className="grid grid-cols-3 gap-2 text-center text-xs">
                      <div className="bg-slate-900 p-2 rounded border border-slate-800">
                        <div className="text-lg font-bold text-slate-100">{selectedCapture.triageSummary.activeProcessesCount}</div>
                        <div className="text-[10px] text-slate-400">Active Processes</div>
                      </div>
                      <div className="bg-slate-900 p-2 rounded border border-slate-800">
                        <div className="text-lg font-bold text-amber-400">{selectedCapture.triageSummary.openSocketsCount}</div>
                        <div className="text-[10px] text-slate-400">Open Sockets</div>
                      </div>
                      <div className="bg-slate-900 p-2 rounded border border-slate-800">
                        <div className="text-lg font-bold text-slate-100">{selectedCapture.triageSummary.loadedDriversCount}</div>
                        <div className="text-[10px] text-slate-400">Loaded Drivers</div>
                      </div>
                    </div>

                    {selectedCapture.triageSummary.clipboardTextSnippet && (
                      <div className="bg-slate-900/90 p-2.5 rounded border border-slate-800 text-xs">
                        <div className="text-slate-400 text-[11px] mb-1">Volatile Clipboard Sniffed:</div>
                        <code className="text-amber-300 font-mono text-[11px] block bg-slate-950 p-2 rounded break-all border border-slate-800">
                          {selectedCapture.triageSummary.clipboardTextSnippet}
                        </code>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
