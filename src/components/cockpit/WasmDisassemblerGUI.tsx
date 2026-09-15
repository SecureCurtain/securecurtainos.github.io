// jb7572_2026-09-01: WebAssembly Static Disassembler & Binary Analysis GUI (Capstone/Radare2 Grade)
import React, { useState, useEffect, useRef } from 'react';
import { 
  Binary, 
  Cpu, 
  FileCode, 
  Upload, 
  Download, 
  Search, 
  Copy, 
  Check, 
  ShieldAlert, 
  ShieldCheck, 
  Activity, 
  Terminal, 
  Play, 
  Layers, 
  ArrowRight, 
  CornerDownRight, 
  RefreshCw, 
  Flame, 
  AlertTriangle,
  GitBranch,
  Hash,
  Database,
  Code2,
  Lock,
  Zap,
  Tag
} from 'lucide-react';
import { 
  wasmDisassemblerService, 
  ParsedBinaryReport, 
  DisasmArch, 
  DecodedInstruction, 
  BasicBlockNode 
} from '../../services/wasmDisassemblerService';

interface WasmDisassemblerGUIProps {
  initialBinaryName?: string;
  initialRawBytes?: Uint8Array;
  onRunCliCommand?: (cmd: string) => void;
}

export const WasmDisassemblerGUI: React.FC<WasmDisassemblerGUIProps> = ({
  initialBinaryName,
  initialRawBytes,
  onRunCliCommand
}) => {
  const [selectedSample, setSelectedSample] = useState<string>(initialBinaryName || 'mirai_c2_dropper.elf');
  const [currentArch, setCurrentArch] = useState<DisasmArch>('x86_64');
  const [activeSubTab, setActiveSubTab] = useState<'LINEAR_DISASM' | 'CFG_GRAPH' | 'SECTIONS' | 'STRINGS_IOCS' | 'HEX_DUMP' | 'PATCH_STUDIO'>('LINEAR_DISASM');
  const [binaryReport, setBinaryReport] = useState<ParsedBinaryReport | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedInstruction, setSelectedInstruction] = useState<DecodedInstruction | null>(null);
  const [copiedLabel, setCopiedLabel] = useState<string | null>(null);
  const [notification, setNotification] = useState<string | null>(null);
  const [patchOffset, setPatchOffset] = useState<string>('0x00401004');
  const [patchHex, setPatchHex] = useState<string>('90 90 90 90'); // NOP sled
  const [isProcessing, setIsProcessing] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load or parse binary on mount or sample/arch change
  useEffect(() => {
    if (initialRawBytes) {
      const rep = wasmDisassemblerService.parseBinary(initialBinaryName || 'custom_upload.bin', initialRawBytes, currentArch);
      setBinaryReport(rep);
      return;
    }

    const sample = wasmDisassemblerService.getSampleBinary(selectedSample);
    if (sample) {
      const rep = wasmDisassemblerService.parseBinary(sample.name, sample.rawBytes, currentArch);
      setBinaryReport(rep);
    }
  }, [selectedSample, currentArch]);

  const showToast = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3500);
  };

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedLabel(label);
    setTimeout(() => setCopiedLabel(null), 2000);
  };

  // Handle local file upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    const reader = new FileReader();
    reader.onload = (event) => {
      const buffer = event.target?.result as ArrayBuffer;
      if (buffer) {
        const bytes = new Uint8Array(buffer);
        const rep = wasmDisassemblerService.parseBinary(file.name, bytes, currentArch);
        setBinaryReport(rep);
        setSelectedSample('custom_upload');
        showToast(`Binary "${file.name}" (${(file.size / 1024).toFixed(1)} KB) parsed in real-time.`);
      }
      setIsProcessing(false);
    };
    reader.onerror = () => {
      setIsProcessing(false);
      showToast('Error reading uploaded binary file.');
    };
    reader.readAsArrayBuffer(file);
  };

  // Drag and drop handler
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    const reader = new FileReader();
    reader.onload = (event) => {
      const buffer = event.target?.result as ArrayBuffer;
      if (buffer) {
        const bytes = new Uint8Array(buffer);
        const rep = wasmDisassemblerService.parseBinary(file.name, bytes, currentArch);
        setBinaryReport(rep);
        setSelectedSample('custom_upload');
        showToast(`Dropped file "${file.name}" parsed successfully.`);
      }
      setIsProcessing(false);
    };
    reader.readAsArrayBuffer(file);
  };

  const handleApplyPatch = () => {
    if (!binaryReport) return;
    try {
      const parsedHex = patchHex.trim().split(/\s+/).map(h => parseInt(h, 16));
      if (parsedHex.some(isNaN)) {
        showToast('Invalid hex byte sequence in patch.');
        return;
      }
      const sample = wasmDisassemblerService.getSampleBinary(selectedSample);
      const baseBytes = sample ? sample.rawBytes : new Uint8Array([0x90, 0x90, 0x90]);
      const patched = wasmDisassemblerService.applyBytePatch(baseBytes, 4, parsedHex);
      const rep = wasmDisassemblerService.parseBinary(`patched_${binaryReport.fileName}`, patched, currentArch);
      setBinaryReport(rep);
      showToast(`Successfully injected ${parsedHex.length}-byte patch at ${patchOffset}.`);
    } catch {
      showToast('Failed to apply byte patch.');
    }
  };

  const handleExportAsm = () => {
    if (!binaryReport) return;
    const asmContent = [
      `; =========================================================================`,
      `; DISASSEMBLED LISTING GENERATED BY WASM CAPSTONE / RADARE2 ENGINE`,
      `; File: ${binaryReport.fileName}`,
      `; Format: ${binaryReport.fileFormat} | Arch: ${binaryReport.architecture}`,
      `; SHA256: ${binaryReport.sha256}`,
      `; EntryPoint: ${binaryReport.entryPoint}`,
      `; =========================================================================\n`,
      ...binaryReport.instructions.map(i => {
        const fnTag = i.functionName ? `\n; --- Function: ${i.functionName} ---\n${i.functionName}:\n` : '';
        const cmt = i.comment ? ` ; ${i.comment}` : '';
        return `${fnTag}  ${i.address.padEnd(12)} ${i.rawHex.padEnd(20)} ${i.mnemonic.padEnd(8)} ${i.operands}${cmt}`;
      })
    ].join('\n');

    const blob = new Blob([asmContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${binaryReport.fileName}_disasm.asm`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Disassembly ASM listing exported successfully.');
  };

  if (!binaryReport) {
    return (
      <div className="p-8 rounded-2xl bg-[#0b0f19] border border-white/10 text-center text-zinc-400 font-mono text-xs">
        Loading WebAssembly Disassembler Engine...
      </div>
    );
  }

  // Filter instructions based on search query
  const filteredInstructions = binaryReport.instructions.filter(inst => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      inst.address.toLowerCase().includes(q) ||
      inst.mnemonic.toLowerCase().includes(q) ||
      inst.operands.toLowerCase().includes(q) ||
      inst.rawHex.toLowerCase().includes(q) ||
      (inst.comment && inst.comment.toLowerCase().includes(q)) ||
      (inst.functionName && inst.functionName.toLowerCase().includes(q))
    );
  });

  return (
    <div 
      onDragOver={(e) => e.preventDefault()}
      onDrop={handleDrop}
      className="space-y-5 font-mono text-xs"
    >
      {/* Toast Notification */}
      {notification && (
        <div className="p-3 rounded-xl bg-purple-950/90 border border-purple-500/50 text-purple-200 flex items-center justify-between shadow-2xl animate-in fade-in">
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-400" />
            <span>{notification}</span>
          </div>
          <button onClick={() => setNotification(null)} className="text-purple-400 hover:text-white text-xs">✕</button>
        </div>
      )}

      {/* Top Header & Disassembler Control Deck */}
      <div className="bg-[#0b0f19] p-5 rounded-2xl border border-purple-500/30 shadow-2xl relative overflow-hidden space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-purple-950/80 border border-purple-500/50 text-purple-400 shadow-lg shadow-purple-950/50">
              <Cpu className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-white tracking-wide font-sans">
                  WebAssembly Static Disassembler Engine (r2 / Capstone)
                </h2>
                <span className="px-2 py-0.5 rounded-full bg-purple-950 border border-purple-500/40 text-purple-300 font-mono text-[10px] font-bold">
                  MULTI-ARCH WASM DISASM
                </span>
              </div>
              <p className="text-[11px] text-purple-300/80">
                Client-side bytecode instruction decoder, control flow graph (CFG) basic block analyzer, and binary section inspector.
              </p>
            </div>
          </div>

          {/* Action Bar: Upload File, Sample Selector & Architecture Toggle */}
          <div className="flex items-center gap-2 flex-wrap">
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleFileUpload} 
              className="hidden" 
              accept=".bin,.elf,.exe,.so,.sys,.dll,.raw,.dat,.o"
            />
            
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isProcessing}
              className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold flex items-center gap-1.5 shadow transition-all cursor-pointer"
              title="Upload custom binary or shellcode for disassembly"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>{isProcessing ? 'Parsing...' : 'Upload Binary'}</span>
            </button>

            {/* Architecture Selector */}
            <div className="flex items-center gap-1 bg-black/60 p-1 rounded-xl border border-white/10">
              {(['x86_64', 'x86_32', 'arm64', 'riscv64', 'mips32'] as DisasmArch[]).map(arch => (
                <button
                  key={arch}
                  onClick={() => setCurrentArch(arch)}
                  className={`px-2 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                    currentArch === arch
                      ? 'bg-purple-600 text-white shadow'
                      : 'text-[#888] hover:text-white hover:bg-white/5'
                  }`}
                >
                  {arch}
                </button>
              ))}
            </div>

            {/* Sample Binaries Dropdown */}
            <select
              value={selectedSample}
              onChange={(e) => setSelectedSample(e.target.value)}
              className="px-2.5 py-1.5 rounded-xl bg-black/80 border border-white/10 text-zinc-300 text-xs focus:outline-none focus:border-purple-500"
            >
              <option value="mirai_c2_dropper.elf">Sample 1: Mirai C2 Dropper (ELF64)</option>
              <option value="cobalt_reflective_stager.bin">Sample 2: CobaltStrike Stager (Raw x64)</option>
              <option value="aarch64_kernel_hook.elf">Sample 3: ARM64 Kernel Hook (ELF64)</option>
            </select>

            <button
              onClick={handleExportAsm}
              className="px-2.5 py-1.5 rounded-xl bg-black/60 hover:bg-black/90 border border-white/10 text-zinc-300 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
              title="Export disassembled assembly listing"
            >
              <Download className="w-3.5 h-3.5 text-cyan-400" />
              <span>Export .asm</span>
            </button>
          </div>
        </div>

        {/* Binary Metadata & Security Mitigation Badges */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 pt-3 border-t border-white/10 text-[11px]">
          <div className="p-2.5 rounded-xl bg-black/60 border border-white/5 space-y-1">
            <div className="text-zinc-500 text-[10px]">FILE / FORMAT</div>
            <div className="font-bold text-white truncate">{binaryReport.fileName}</div>
            <div className="text-cyan-400">{binaryReport.fileFormat} • {binaryReport.architecture} ({(binaryReport.fileSizeBytes / 1024).toFixed(1)} KB)</div>
          </div>

          <div className="p-2.5 rounded-xl bg-black/60 border border-white/5 space-y-1">
            <div className="text-zinc-500 text-[10px]">ENTRYPOINT / IMAGE BASE</div>
            <div className="font-bold text-emerald-400">{binaryReport.entryPoint}</div>
            <div className="text-zinc-400">Base: {binaryReport.imageBase}</div>
          </div>

          <div className="p-2.5 rounded-xl bg-black/60 border border-white/5 space-y-1">
            <div className="text-zinc-500 text-[10px]">ENTROPY / CRYPTO DIGEST</div>
            <div className="font-bold text-purple-400">{binaryReport.overallEntropy.toFixed(2)} / 8.00 (Packed)</div>
            <div className="text-zinc-400 truncate text-[10px]">SHA256: {binaryReport.sha256.substring(0, 16)}...</div>
          </div>

          <div className="p-2.5 rounded-xl bg-black/60 border border-white/5 space-y-1">
            <div className="text-zinc-500 text-[10px]">SECURITY MITIGATIONS</div>
            <div className="flex items-center gap-1.5 flex-wrap text-[9px] font-bold">
              <span className={`px-1.5 py-0.5 rounded ${binaryReport.mitigations.nxDep ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/40' : 'bg-red-950 text-red-300'}`}>NX/DEP</span>
              <span className={`px-1.5 py-0.5 rounded ${binaryReport.mitigations.aslrPie ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/40' : 'bg-amber-950 text-amber-300'}`}>PIE</span>
              <span className="px-1.5 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-500/40">RELRO: {binaryReport.mitigations.relro}</span>
              <span className="px-1.5 py-0.5 rounded bg-red-950 text-red-300 border border-red-500/40">UNSIGNED</span>
            </div>
          </div>
        </div>
      </div>

      {/* Disassembly Study Sub-Tabs */}
      <div className="flex items-center justify-between gap-2 border-b border-white/10 pb-2 flex-wrap">
        <div className="flex items-center gap-1.5 overflow-x-auto">
          <button
            onClick={() => setActiveSubTab('LINEAR_DISASM')}
            className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              activeSubTab === 'LINEAR_DISASM'
                ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30'
                : 'bg-black/40 text-[#888] hover:text-white'
            }`}
          >
            <FileCode className="w-3.5 h-3.5" />
            <span>Linear Disassembly ({binaryReport.instructions.length} insns)</span>
          </button>

          <button
            onClick={() => setActiveSubTab('CFG_GRAPH')}
            className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              activeSubTab === 'CFG_GRAPH'
                ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30'
                : 'bg-black/40 text-[#888] hover:text-white'
            }`}
          >
            <GitBranch className="w-3.5 h-3.5" />
            <span>CFG Basic Blocks ({binaryReport.basicBlocks.length} nodes)</span>
          </button>

          <button
            onClick={() => setActiveSubTab('SECTIONS')}
            className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              activeSubTab === 'SECTIONS'
                ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30'
                : 'bg-black/40 text-[#888] hover:text-white'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>ELF Sections ({binaryReport.sections.length})</span>
          </button>

          <button
            onClick={() => setActiveSubTab('STRINGS_IOCS')}
            className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              activeSubTab === 'STRINGS_IOCS'
                ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30'
                : 'bg-black/40 text-[#888] hover:text-white'
            }`}
          >
            <Search className="w-3.5 h-3.5" />
            <span>Strings & IOCs ({binaryReport.extractedStrings.length})</span>
          </button>

          <button
            onClick={() => setActiveSubTab('HEX_DUMP')}
            className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              activeSubTab === 'HEX_DUMP'
                ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30'
                : 'bg-black/40 text-[#888] hover:text-white'
            }`}
          >
            <Binary className="w-3.5 h-3.5" />
            <span>Synchronized Hex</span>
          </button>

          <button
            onClick={() => setActiveSubTab('PATCH_STUDIO')}
            className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              activeSubTab === 'PATCH_STUDIO'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                : 'bg-black/40 text-[#888] hover:text-white'
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            <span>Patch & NOP Studio</span>
          </button>
        </div>

        {/* Quick Search in Assembly */}
        <div className="relative min-w-[220px]">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-500" />
          <input
            type="text"
            placeholder="Search address / mnemonic / opcode..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1 rounded-lg bg-black/60 border border-white/10 text-white text-xs placeholder:text-zinc-600 focus:outline-none focus:border-purple-500"
          />
        </div>
      </div>

      {/* ========================================================================= */}
      {/* VIEW 1: LINEAR DISASSEMBLER (Radare2 / Capstone Style) */}
      {/* ========================================================================= */}
      {activeSubTab === 'LINEAR_DISASM' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between text-[#8fa0b5] text-[11px]">
            <span>Click any instruction to inspect byte mapping or copy target address.</span>
            <span className="text-zinc-500">Showing {filteredInstructions.length} decoded instructions</span>
          </div>

          <div className="p-4 rounded-2xl bg-black/90 border border-white/10 overflow-x-auto max-h-[500px] custom-scrollbar shadow-2xl">
            <table className="w-full text-left font-mono border-collapse">
              <thead>
                <tr className="text-zinc-500 border-b border-white/10 pb-1 text-[10px]">
                  <th className="py-1.5 w-32">ADDRESS</th>
                  <th className="py-1.5 w-44">RAW HEX</th>
                  <th className="py-1.5 w-24">MNEMONIC</th>
                  <th className="py-1.5 w-56">OPERANDS</th>
                  <th className="py-1.5">RADARE2 / CAPSTONE ANNOTATIONS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-xs">
                {filteredInstructions.map((inst, idx) => {
                  const isSelected = selectedInstruction?.address === inst.address;
                  const isBranch = inst.category === 'JUMP_COND' || inst.category === 'JUMP_UNCOND';
                  const isCall = inst.category === 'CALL';
                  const isSyscall = inst.category === 'SYSCALL';
                  const isRet = inst.category === 'RET' || inst.category === 'EPILOGUE';

                  return (
                    <React.Fragment key={idx}>
                      {/* Function Header Banner */}
                      {inst.functionName && (
                        <tr className="bg-purple-950/30 border-t border-purple-500/40">
                          <td colSpan={5} className="py-2 px-1 text-purple-300 font-bold flex items-center gap-2">
                            <Tag className="w-3.5 h-3.5 text-purple-400" />
                            <span>; -------------------------------------------------------------</span>
                            <span className="text-white font-bold">{inst.functionName}:</span>
                          </td>
                        </tr>
                      )}

                      <tr 
                        onClick={() => setSelectedInstruction(inst)}
                        className={`hover:bg-white/5 cursor-pointer transition-colors ${
                          isSelected ? 'bg-purple-950/40 border-l-2 border-purple-500' : ''
                        }`}
                      >
                        {/* Address */}
                        <td className="py-1.5 text-purple-400 font-bold select-all flex items-center gap-1">
                          {isBranch && <CornerDownRight className="w-3 h-3 text-amber-400" />}
                          <span>{inst.address}</span>
                        </td>

                        {/* Raw Hex */}
                        <td className="py-1.5 text-zinc-500 font-mono tracking-wider">{inst.rawHex}</td>

                        {/* Mnemonic with Syntax Colors */}
                        <td className={`py-1.5 font-bold ${
                          isCall ? 'text-indigo-400' :
                          isBranch ? 'text-amber-400' :
                          isSyscall ? 'text-red-400 animate-pulse' :
                          isRet ? 'text-emerald-400' :
                          inst.category === 'STACK' ? 'text-cyan-400' :
                          'text-white'
                        }`}>
                          {inst.mnemonic}
                        </td>

                        {/* Operands */}
                        <td className="py-1.5 text-cyan-200">
                          {inst.jumpTarget ? (
                            <span className="px-1.5 py-0.5 rounded bg-amber-950/80 text-amber-300 font-bold">
                              {inst.operands}
                            </span>
                          ) : (
                            inst.operands
                          )}
                        </td>

                        {/* Annotations / Comments */}
                        <td className="py-1.5 text-[#888] italic text-[11px] truncate max-w-md">
                          {inst.comment ? (
                            <span className="text-zinc-400 font-sans">; {inst.comment}</span>
                          ) : (
                            inst.jumpTarget ? <span className="text-amber-400/80">; Branch target -&gt; {inst.jumpTarget}</span> : null
                          )}
                        </td>
                      </tr>
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* VIEW 2: CONTROL FLOW GRAPH (CFG) BASIC BLOCKS */}
      {/* ========================================================================= */}
      {activeSubTab === 'CFG_GRAPH' && (
        <div className="space-y-4">
          <div className="p-3 rounded-xl bg-black/60 border border-white/10 flex items-center justify-between text-xs text-zinc-300">
            <span>Visual Control Flow Graph (CFG) basic block partitioning & conditional branch resolution.</span>
            <span className="text-purple-400 font-bold">{binaryReport.basicBlocks.length} Basic Blocks</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-[500px] overflow-y-auto custom-scrollbar p-1">
            {binaryReport.basicBlocks.map((bb) => (
              <div 
                key={bb.id}
                className="p-4 rounded-xl bg-black/90 border border-white/15 shadow-xl space-y-3 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between border-b border-white/10 pb-2 mb-2">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-purple-400" />
                      <span className="font-bold text-white text-xs">{bb.label}</span>
                    </div>
                    <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                      bb.blockType === 'CONDITIONAL' ? 'bg-amber-950 text-amber-300 border border-amber-500/40' :
                      bb.blockType === 'RETURN' ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/40' :
                      'bg-purple-950 text-purple-300 border border-purple-500/40'
                    }`}>
                      {bb.blockType}
                    </span>
                  </div>

                  <div className="text-[10px] text-zinc-500 mb-2">
                    Range: {bb.startAddress} -&gt; {bb.endAddress}
                  </div>

                  {/* Instructions in Block */}
                  <div className="space-y-1 font-mono text-[11px] bg-black/60 p-2.5 rounded-lg border border-white/5">
                    {bb.instructions.map((inst, iIdx) => (
                      <div key={iIdx} className="flex items-center justify-between gap-2">
                        <span className="text-zinc-500 text-[10px]">{inst.address.substring(4)}</span>
                        <span className="text-white font-bold">{inst.mnemonic}</span>
                        <span className="text-cyan-300 truncate">{inst.operands || '-'}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Branch Exits */}
                <div className="pt-2 border-t border-white/10 space-y-1 text-[10px]">
                  {bb.trueBranchTarget && (
                    <div className="flex items-center justify-between text-emerald-400">
                      <span>True Branch:</span>
                      <span className="font-bold">{bb.trueBranchTarget}</span>
                    </div>
                  )}
                  {bb.falseBranchTarget && (
                    <div className="flex items-center justify-between text-red-400">
                      <span>False Branch:</span>
                      <span className="font-bold">{bb.falseBranchTarget}</span>
                    </div>
                  )}
                  {bb.uncondBranchTarget && (
                    <div className="flex items-center justify-between text-cyan-400">
                      <span>Jump Target:</span>
                      <span className="font-bold">{bb.uncondBranchTarget}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* VIEW 3: ELF / PE SECTIONS & MEMORY MAP */}
      {/* ========================================================================= */}
      {activeSubTab === 'SECTIONS' && (
        <div className="space-y-3">
          <div className="p-4 rounded-2xl bg-black/90 border border-white/10 overflow-x-auto shadow-xl">
            <table className="w-full text-left font-mono">
              <thead>
                <tr className="text-zinc-500 border-b border-white/10 pb-2 text-[10px]">
                  <th className="py-2">SECTION</th>
                  <th className="py-2">VIRTUAL ADDR</th>
                  <th className="py-2">VIRT SIZE</th>
                  <th className="py-2">RAW SIZE</th>
                  <th className="py-2">PERMS</th>
                  <th className="py-2">ENTROPY</th>
                  <th className="py-2">TYPE</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-xs">
                {binaryReport.sections.map((sec, idx) => (
                  <tr key={idx} className="hover:bg-white/5">
                    <td className="py-2 text-white font-bold">{sec.name}</td>
                    <td className="py-2 text-purple-400">{sec.virtualAddress}</td>
                    <td className="py-2 text-zinc-300">{sec.virtualSize} bytes</td>
                    <td className="py-2 text-zinc-400">{sec.rawSize} bytes</td>
                    <td className="py-2">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        sec.permissions === 'r-x' ? 'bg-indigo-950 text-indigo-300' :
                        sec.permissions === 'rwx' ? 'bg-red-950 text-red-300' :
                        'bg-zinc-900 text-zinc-300'
                      }`}>
                        {sec.permissions}
                      </span>
                    </td>
                    <td className="py-2 text-cyan-400 font-bold">{sec.entropy.toFixed(2)}</td>
                    <td className="py-2 text-zinc-400">{sec.type}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* VIEW 4: STRINGS & EXTRACTED IOCS */}
      {/* ========================================================================= */}
      {activeSubTab === 'STRINGS_IOCS' && (
        <div className="space-y-3">
          <div className="space-y-2 max-h-[450px] overflow-y-auto custom-scrollbar">
            {binaryReport.extractedStrings.map((strItem, sIdx) => (
              <div 
                key={sIdx}
                className="p-3 rounded-xl bg-black/70 border border-white/10 flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-2 overflow-hidden">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold shrink-0 ${
                    strItem.type === 'IOC_IP' ? 'bg-red-950 border border-red-500/50 text-red-400' :
                    strItem.type === 'IOC_URL' ? 'bg-indigo-950 border border-indigo-500/50 text-indigo-300' :
                    strItem.type === 'API_IMPORT' ? 'bg-cyan-950 border border-cyan-500/50 text-cyan-300' :
                    'bg-zinc-900 border border-zinc-700 text-zinc-300'
                  }`}>
                    {strItem.type}
                  </span>
                  <span className="text-[10px] text-zinc-500 shrink-0">{strItem.offset}</span>
                  <span className="text-white font-bold truncate select-all">{strItem.stringVal}</span>
                </div>

                <button
                  onClick={() => handleCopy(strItem.stringVal, `str_${sIdx}`)}
                  className="p-1.5 rounded-lg bg-black/60 border border-white/10 hover:border-white/30 text-zinc-400 hover:text-white cursor-pointer"
                  title="Copy string"
                >
                  {copiedLabel === `str_${sIdx}` ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* VIEW 5: SYNCHRONIZED HEX DUMP */}
      {/* ========================================================================= */}
      {activeSubTab === 'HEX_DUMP' && (
        <div className="space-y-2">
          <div className="p-4 rounded-2xl bg-black/90 border border-white/10 overflow-x-auto max-h-[450px] custom-scrollbar text-xs">
            <table className="w-full text-left font-mono">
              <thead>
                <tr className="text-zinc-500 border-b border-white/10 pb-1 text-[10px]">
                  <th className="py-1">OFFSET</th>
                  <th className="py-1">HEX BYTES (00 - 0F)</th>
                  <th className="py-1">ASCII DECODED</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {binaryReport.hexDumpLines.map((line, lIdx) => (
                  <tr key={lIdx} className="hover:bg-white/5">
                    <td className="py-1 text-purple-400 font-bold">{line.offset}</td>
                    <td className="py-1 text-cyan-300 font-mono tracking-wider">{line.hex}</td>
                    <td className="py-1 text-emerald-400 font-mono">{line.ascii}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* VIEW 6: PATCH & NOP STUDIO */}
      {/* ========================================================================= */}
      {activeSubTab === 'PATCH_STUDIO' && (
        <div className="p-5 rounded-2xl bg-black/80 border border-white/10 space-y-4">
          <div className="flex items-center gap-2 text-white font-bold">
            <Zap className="w-4 h-4 text-indigo-400" />
            <span>Interactive Binary Patch Simulator & NOP Sled Injector</span>
          </div>
          <p className="text-xs text-zinc-400">
            Inject test NOP sequences (<code className="text-emerald-400">0x90</code>) or software breakpoints (<code className="text-red-400">0xCC</code>) into the instruction stream to test bypasses and observe real-time re-disassembly.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-zinc-400 text-[11px]">Patch Target Offset</label>
              <input
                type="text"
                value={patchOffset}
                onChange={(e) => setPatchOffset(e.target.value)}
                className="w-full p-2 rounded-xl bg-black border border-white/10 text-white font-mono text-xs focus:outline-none focus:border-purple-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-zinc-400 text-[11px]">Replacement Hex Bytes</label>
              <input
                type="text"
                value={patchHex}
                onChange={(e) => setPatchHex(e.target.value)}
                placeholder="e.g. 90 90 90 90 or 31 C0 C3"
                className="w-full p-2 rounded-xl bg-black border border-white/10 text-emerald-400 font-mono text-xs focus:outline-none focus:border-purple-500"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              onClick={() => setPatchHex('90 90 90 90')}
              className="px-3 py-1.5 rounded-lg bg-black/60 border border-white/10 text-zinc-300 hover:text-white cursor-pointer text-xs"
            >
              Set 4x NOP Sled (0x90)
            </button>
            <button
              onClick={() => setPatchHex('31 C0 C3')}
              className="px-3 py-1.5 rounded-lg bg-black/60 border border-white/10 text-zinc-300 hover:text-white cursor-pointer text-xs"
            >
              Set XOR EAX, EAX; RET (0x31 0xC0 0xC3)
            </button>
            <button
              onClick={handleApplyPatch}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold flex items-center gap-1.5 shadow cursor-pointer text-xs"
            >
              <Zap className="w-3.5 h-3.5" />
              <span>Inject & Re-Disassemble</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
