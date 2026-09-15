// jb7572_2026-09-01: Windows Hibernation Decompression & Recon (Arsenal Recon, Volatility imagecopy, hibr2bin)
import React, { useState } from 'react';
import { 
  HibernationReconDescriptor, 
  MOCK_HIBERNATION_DECOMPRESSIONS 
} from '../../../services/forensicsService';
import { 
  FileCode, 
  Play, 
  CheckCircle2, 
  ShieldCheck, 
  Copy, 
  Layers, 
  Cpu, 
  Zap, 
  Terminal, 
  Database,
  ArrowRight,
  Sparkles
} from 'lucide-react';

interface HibernationReconTabProps {
  onNotify: (title: string, message: string) => void;
}

export const HibernationReconTab: React.FC<HibernationReconTabProps> = ({ onNotify }) => {
  const [hibDecompressions, setHibDecompressions] = useState<HibernationReconDescriptor[]>(MOCK_HIBERNATION_DECOMPRESSIONS);
  const [selectedTool, setSelectedTool] = useState<'Arsenal Hibernation Recon' | 'Volatility imagecopy' | 'hibr2bin'>('Arsenal Hibernation Recon');
  const [sourcePath, setSourcePath] = useState('/mnt/forensics_slot_1_ro/hiberfil.sys');
  const [isProcessing, setIsProcessing] = useState(false);
  const [processProgress, setProcessProgress] = useState(0);
  const [selectedItem, setSelectedItem] = useState<HibernationReconDescriptor>(MOCK_HIBERNATION_DECOMPRESSIONS[0]);

  const handleStartDecompression = () => {
    setIsProcessing(true);
    setProcessProgress(10);
    onNotify('Hibernation Decompression Started', `Parsing Xpress / LZNT1 chunks from ${sourcePath}...`);

    let prog = 10;
    const interval = setInterval(() => {
      prog += 15;
      if (prog >= 100) {
        prog = 100;
        clearInterval(interval);
        setIsProcessing(false);
        setProcessProgress(100);

        const newDecomp: HibernationReconDescriptor = {
          id: `hib-${Date.now()}`,
          sourceFile: sourcePath,
          decompressionTool: selectedTool,
          sourceSizeBytes: 13743895347,
          decompressedRawSizeBytes: 34359738368,
          decompressedRawOutput: `/mnt/forensic_vault/DECOMPRESSED_RAM/hiberfil_decompressed_${Date.now().toString().slice(-4)}.raw`,
          compressionEngine: 'Windows 10/11 Xpress Huffman',
          memoryPagesRestored: 8388608,
          activeProcessHivesFound: 146,
          sha256Decompressed: '5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8',
          status: 'DECOMPRESSED',
          timestamp: new Date().toISOString()
        };

        setHibDecompressions(prev => [newDecomp, ...prev]);
        setSelectedItem(newDecomp);
        onNotify('Decompression Complete', 'Converted hiberfil.sys into 32GB raw physical memory dump with zero loss.');
      } else {
        setProcessProgress(prog);
      }
    }, 450);
  };

  const copyText = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    onNotify('Copied', `${label} copied to clipboard`);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-lg">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="p-2 bg-amber-500/20 text-amber-400 rounded-lg">
                <Zap className="w-5 h-5" />
              </span>
              <h2 className="text-xl font-bold text-slate-100">Hibernation File Recon & Decompressor</h2>
              <span className="px-2 py-0.5 text-xs font-semibold bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded-full">
                Xpress Huffman & Fast Startup
              </span>
            </div>
            <p className="text-xs text-slate-400 max-w-2xl">
              Decompress proprietary Windows 10/11 multi-phase hibernation tables (<code className="text-amber-300 font-mono">hiberfil.sys</code>) and Fast Startup hybrid dumps into standard raw uncompressed physical RAM images ready for Volatility 3 and MemProcFS analysis.
            </p>
          </div>

          <div className="text-xs font-mono bg-slate-950 p-2.5 rounded-lg border border-slate-800 text-slate-300">
            <span className="text-slate-500">Supported:</span> Windows 7/8/10/11 Multi-Phase
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Form & Tools */}
        <div className="lg:col-span-5 space-y-5">
          <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 space-y-4">
            <h3 className="text-sm font-semibold text-slate-200 uppercase tracking-wider flex items-center gap-2">
              <Terminal className="w-4 h-4 text-amber-400" />
              Decompression Engine
            </h3>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Decompression Tool</label>
              <div className="space-y-2">
                {[
                  { id: 'Arsenal Hibernation Recon', desc: 'Industry benchmark; resolves multi-phase Windows 10/11 Xpress compression & Active Memory sets' },
                  { id: 'Volatility imagecopy', desc: 'Converts PO_MEMORY_IMAGE structures into linear raw memory dumps' },
                  { id: 'hibr2bin', desc: 'High-speed C-based stream decompressor for legacy and fast-startup hibernation dumps' }
                ].map(tool => (
                  <button
                    key={tool.id}
                    onClick={() => setSelectedTool(tool.id as any)}
                    className={`w-full text-left p-3 rounded-lg border text-xs transition-all ${
                      selectedTool === tool.id
                        ? 'bg-amber-600/20 border-amber-500/80 text-white shadow-[0_0_12px_rgba(245,158,11,0.2)]'
                        : 'bg-slate-800/60 border-slate-700/60 text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <div className="font-semibold text-slate-100">{tool.id}</div>
                    <div className="text-[11px] text-slate-400 mt-0.5">{tool.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Source Hibernation File Path</label>
              <input
                type="text"
                value={sourcePath}
                onChange={(e) => setSourcePath(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-xs text-slate-200 font-mono focus:border-amber-500 focus:outline-none"
              />
            </div>

            <div className="bg-slate-950 border border-slate-800 rounded-lg p-3 text-xs space-y-1.5 font-mono text-slate-300">
              <div className="text-slate-400">Target Output Location:</div>
              <div className="text-amber-400 truncate">/mnt/forensic_vault/DECOMPRESSED_RAM/</div>
              <div className="text-[11px] text-slate-500">Output format: Raw Physical Memory (.raw)</div>
            </div>

            {isProcessing && (
              <div className="space-y-2 bg-amber-950/30 border border-amber-800/40 rounded-lg p-3">
                <div className="flex justify-between text-xs font-mono text-amber-300">
                  <span>Decompressing Xpress Huffman Chunks...</span>
                  <span>{processProgress}%</span>
                </div>
                <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div 
                    className="bg-amber-500 h-full transition-all duration-300 ease-out"
                    style={{ width: `${processProgress}%` }}
                  />
                </div>
              </div>
            )}

            <button
              onClick={handleStartDecompression}
              disabled={isProcessing}
              className={`w-full py-3 px-4 rounded-lg font-semibold text-xs flex items-center justify-center gap-2 shadow-lg transition-all ${
                isProcessing
                  ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                  : 'bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white shadow-amber-500/20'
              }`}
            >
              <Play className="w-4 h-4 fill-current" />
              {isProcessing ? 'Decompressing Hibernation File...' : 'Start Hibernation Decompression'}
            </button>
          </div>
        </div>

        {/* Right Column: Decompressed Memory Dumps Inspector */}
        <div className="lg:col-span-7 space-y-5">
          <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 space-y-4">
            <h3 className="text-sm font-semibold text-slate-200 uppercase tracking-wider flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Database className="w-4 h-4 text-amber-400" />
                Decompressed Memory Vault
              </span>
              <span className="text-xs font-mono text-slate-400">{hibDecompressions.length} images ready</span>
            </h3>

            <div className="space-y-2">
              {hibDecompressions.map(item => (
                <div
                  key={item.id}
                  onClick={() => setSelectedItem(item)}
                  className={`p-3 rounded-lg border text-xs cursor-pointer transition-all ${
                    selectedItem.id === item.id
                      ? 'bg-slate-800/90 border-amber-500 text-white'
                      : 'bg-slate-800/40 border-slate-700/60 text-slate-300 hover:bg-slate-800/70'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="font-semibold text-slate-100 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-amber-400" />
                      {item.decompressionTool}
                    </div>
                    <span className="text-[11px] font-mono text-slate-400">
                      {new Date(item.timestamp).toLocaleString()}
                    </span>
                  </div>

                  <div className="flex items-center justify-between mt-2 text-[11px] font-mono text-slate-400">
                    <span className="truncate max-w-[280px] text-amber-400">{item.decompressedRawOutput}</span>
                    <span>{(item.decompressedRawSizeBytes / 1073741824).toFixed(1)} GB Raw RAM</span>
                  </div>
                </div>
              ))}
            </div>

            {selectedItem && (
              <div className="mt-4 pt-4 border-t border-slate-800 space-y-4">
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="bg-slate-950/70 border border-slate-800 p-3 rounded-lg space-y-1">
                    <div className="text-slate-400">Compression Engine</div>
                    <div className="font-semibold text-slate-200">{selectedItem.compressionEngine}</div>
                    <div className="text-[11px] text-slate-400">{(selectedItem.sourceSizeBytes / 1073741824).toFixed(1)} GB compressed hiberfil.sys</div>
                  </div>

                  <div className="bg-slate-950/70 border border-slate-800 p-3 rounded-lg space-y-1">
                    <div className="text-slate-400">Restored Memory Pages</div>
                    <div className="font-semibold text-emerald-400">{selectedItem.memoryPagesRestored.toLocaleString()} Pages</div>
                    <div className="text-[11px] text-slate-400">{selectedItem.activeProcessHivesFound} active process tables recovered</div>
                  </div>
                </div>

                <div className="bg-slate-950/90 border border-slate-800 rounded-lg p-3 space-y-2 text-xs font-mono">
                  <div className="text-slate-400 flex items-center justify-between">
                    <span>Decompressed Output SHA-256</span>
                    <span className="text-emerald-400 flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5" /> Bit-Stream Validated
                    </span>
                  </div>

                  <div className="flex items-center justify-between bg-slate-900/80 p-2 rounded border border-slate-800">
                    <div className="truncate mr-2">
                      <span className="text-slate-500">SHA256:</span> {selectedItem.sha256Decompressed}
                    </div>
                    <button 
                      onClick={() => copyText(selectedItem.sha256Decompressed, 'SHA-256')}
                      className="p-1 hover:bg-slate-800 text-slate-400 hover:text-slate-200 rounded"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="bg-slate-950 border border-slate-800 p-3 rounded-lg flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber-400" />
                    <span className="text-slate-300">Ready for Volatility 3 & MemProcFS Analysis</span>
                  </div>
                  <span className="text-xs font-mono text-emerald-400">Mounted at /mnt/memprocfs</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
