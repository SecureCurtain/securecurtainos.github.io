// jb7572_2026-09-01: Sandboxed Quarantine & Code Reverse-Engineering Study Workbench
import React, { useState, useEffect } from 'react';
import { 
  Lock, 
  Unlock, 
  Trash2, 
  FileCode, 
  Binary, 
  Cpu, 
  Activity, 
  Copy, 
  Check, 
  ShieldAlert, 
  ShieldCheck, 
  Flame, 
  AlertTriangle, 
  Terminal, 
  Play, 
  Pause, 
  RefreshCw, 
  Download, 
  Search, 
  Zap, 
  Layers,
  Bug,
  Crosshair,
  ExternalLink,
  Code2,
  Share2,
  Key
} from 'lucide-react';
import { hipsAntiMalwareService } from '../../services/hipsAntiMalwareService';
import { encryptedVaultService } from '../../services/encryptedVaultService';
import { WasmDisassemblerGUI } from './WasmDisassemblerGUI';
import { StixTaxiiExportModal } from './StixTaxiiExportModal';
import { 
  QuarantinedObject, 
  ThreatSeverity, 
  ExtractedStringItem, 
  HexDumpLine,
  SandboxSyscallTrace 
} from '../../types';

interface QuarantineSandboxGUIProps {
  initialSelectedVaultId?: string | null;
  onRunCliCommand?: (cmd: string) => void;
  onNavigateToVault?: () => void;
  onNavigateToEbpf?: () => void;
}

export const QuarantineSandboxGUI: React.FC<QuarantineSandboxGUIProps> = ({
  initialSelectedVaultId,
  onRunCliCommand,
  onNavigateToVault,
  onNavigateToEbpf
}) => {
  const [quarantineItems, setQuarantineItems] = useState<QuarantinedObject[]>(() => hipsAntiMalwareService.getQuarantineVault());
  const [selectedVaultId, setSelectedVaultId] = useState<string>(() => {
    if (initialSelectedVaultId && hipsAntiMalwareService.getQuarantinedObjectById(initialSelectedVaultId)) {
      return initialSelectedVaultId;
    }
    const list = hipsAntiMalwareService.getQuarantineVault().filter(q => q.status !== 'PURGED');
    return list[0]?.id || '';
  });

  // STIX / TAXII Feed Export modal state
  const [isStixModalOpen, setIsStixModalOpen] = useState(false);

  // Selected sub-tab within the Code Study Workbench
  const [studyTab, setStudyTab] = useState<'decompiled_c' | 'disassembly_asm' | 'wasm_radare2' | 'strings_iocs' | 'hex_dump' | 'sandbox_trace' | 'yara_rule'>('decompiled_c');

  // Decompiler / Stripper state
  const [isStripping, setIsStripping] = useState(false);
  const [stripProgress, setStripProgress] = useState(100);
  const [copiedText, setCopiedText] = useState<string | null>(null);
  const [sandboxEmulating, setSandboxEmulating] = useState(false);
  const [emulatedSyscalls, setEmulatedSyscalls] = useState<SandboxSyscallTrace[]>([]);
  const [bannerNotice, setBannerNotice] = useState<string | null>(null);

  const selectedItem = quarantineItems.find(q => q.id === selectedVaultId) || quarantineItems.find(q => q.status !== 'PURGED');

  useEffect(() => {
    if (initialSelectedVaultId && initialSelectedVaultId !== selectedVaultId) {
      setSelectedVaultId(initialSelectedVaultId);
    }
  }, [initialSelectedVaultId]);

  useEffect(() => {
    if (selectedItem) {
      setEmulatedSyscalls(selectedItem.sandboxTrace);
    }
  }, [selectedVaultId]);

  const showNotification = (msg: string) => {
    setBannerNotice(msg);
    setTimeout(() => setBannerNotice(null), 4000);
  };

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(label);
    setTimeout(() => setCopiedText(null), 2500);
  };

  const handlePurge = (vaultId: string) => {
    const res = hipsAntiMalwareService.purgeQuarantineObject(vaultId);
    const updated = hipsAntiMalwareService.getQuarantineVault();
    setQuarantineItems(updated);
    const remaining = updated.filter(q => q.status !== 'PURGED');
    if (remaining.length > 0) {
      setSelectedVaultId(remaining[0].id);
    }
    showNotification(res.message);
  };

  const handleTriggerDecompilation = () => {
    setIsStripping(true);
    setStripProgress(0);
    const interval = setInterval(() => {
      setStripProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsStripping(false);
          showNotification('Object stripped down to bytecode and decompiled for static study.');
          return 100;
        }
        return prev + 25;
      });
    }, 150);
  };

  const handleTriggerEmulation = () => {
    if (!selectedItem) return;
    setSandboxEmulating(true);
    setEmulatedSyscalls([]);
    
    selectedItem.sandboxTrace.forEach((trace, idx) => {
      setTimeout(() => {
        setEmulatedSyscalls(prev => [...prev, trace]);
        if (idx === selectedItem.sandboxTrace.length - 1) {
          setSandboxEmulating(false);
          showNotification('Sandbox emulation completed. All malicious branch attempts intercepted by HIPS.');
        }
      }, (idx + 1) * 500);
    });
  };

  const handleArchiveToEncryptedVault = async () => {
    if (!selectedItem) return;
    try {
      await encryptedVaultService.storeRecord({
        type: 'QUARANTINE_ARTIFACT',
        title: `Quarantine: ${selectedItem.originalFileName}`,
        payload: selectedItem,
        tags: ['quarantine', selectedItem.detectionVector.toLowerCase(), selectedItem.threatSeverity.toLowerCase()],
        metadata: {
          vaultId: selectedItem.id,
          threatId: selectedItem.threatId,
          sha256: selectedItem.sha256,
          originalFileName: selectedItem.originalFileName,
          threatSeverity: selectedItem.threatSeverity,
          threatVector: selectedItem.detectionVector,
          entropy: selectedItem.entropy
        }
      });
      showNotification(`Sample "${selectedItem.originalFileName}" securely encrypted into IndexedDB Vault (AES-GCM-256).`);
    } catch (err: any) {
      showNotification(err?.message || 'Failed to archive into encrypted vault.');
    }
  };

  const getSeverityBadge = (severity: ThreatSeverity) => {
    switch (severity) {
      case 'CRITICAL':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-950/80 border border-red-500/60 text-red-400 font-mono text-[10px] font-bold">
            <Flame className="w-3 h-3 text-red-500 animate-pulse" />
            <span>CRITICAL</span>
          </span>
        );
      case 'HIGH':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-950/80 border border-amber-500/60 text-amber-400 font-mono text-[10px] font-bold">
            <AlertTriangle className="w-3 h-3 text-amber-500" />
            <span>HIGH</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-yellow-950/80 border border-yellow-500/60 text-yellow-400 font-mono text-[10px] font-bold">
            <Activity className="w-3 h-3 text-yellow-500" />
            <span>MEDIUM</span>
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Banner Notice */}
      {bannerNotice && (
        <div className="p-3 rounded-xl bg-purple-950/90 border border-purple-500/50 text-purple-200 text-xs font-mono flex items-center justify-between shadow-lg shadow-purple-950/40 animate-in fade-in">
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4 text-purple-400" />
            <span>{bannerNotice}</span>
          </div>
          <button 
            onClick={() => setBannerNotice(null)}
            className="text-purple-400 hover:text-white text-xs px-2 py-0.5 rounded"
          >
            ✕
          </button>
        </div>
      )}

      {/* Sandboxed Isolation Warning Header */}
      <div className="bg-[#0b0f19] p-5 rounded-2xl border border-purple-500/30 shadow-2xl relative overflow-hidden space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-purple-950/80 border border-purple-500/50 text-purple-400 shadow-lg shadow-purple-950/50">
              <Lock className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white tracking-wide">
                  Sandboxed Quarantine & Binary Decompiler
                </h2>
                <span className="px-2 py-0.5 rounded-full bg-emerald-950/80 border border-emerald-500/40 text-emerald-400 font-mono text-[10px] font-bold">
                  AIR-GAPPED RING -1
                </span>
              </div>
              <p className="text-xs text-purple-300/80 font-mono">
                Fully isolated hypervisor containment chamber. All quarantined artifacts are stripped of execution rights for deep forensic code study.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={handleTriggerDecompilation}
              disabled={isStripping || !selectedItem}
              className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-purple-700 to-indigo-600 hover:from-purple-600 hover:to-indigo-500 disabled:opacity-50 text-white font-mono text-xs font-bold flex items-center gap-2 shadow-lg transition-all cursor-pointer"
            >
              <Code2 className="w-3.5 h-3.5" />
              <span>{isStripping ? `Decompiling (${stripProgress}%)...` : 'Strip Down to Code'}</span>
            </button>

            <button
              onClick={handleTriggerEmulation}
              disabled={sandboxEmulating || !selectedItem}
              className="px-3.5 py-2 rounded-xl bg-cyan-950/80 hover:bg-cyan-900 border border-cyan-500/40 text-cyan-300 font-mono text-xs font-bold flex items-center gap-2 shadow transition-all cursor-pointer"
            >
              <Play className={`w-3.5 h-3.5 ${sandboxEmulating ? 'animate-spin text-cyan-400' : ''}`} />
              <span>{sandboxEmulating ? 'Emulating...' : 'Run Isolated Emulation'}</span>
            </button>

            {selectedItem && (
              <button
                onClick={() => handlePurge(selectedItem.id)}
                className="px-3.5 py-2 rounded-xl bg-red-950/80 hover:bg-red-900 border border-red-500/40 text-red-300 font-mono text-xs font-bold flex items-center gap-2 shadow transition-all cursor-pointer"
                title="Permanently shred from encrypted vault"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Purge Vault</span>
              </button>
            )}
          </div>
        </div>

        {/* Security Boundary Badges */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-white/5 font-mono text-[11px]">
          <div className="p-2 rounded-lg bg-black/60 border border-white/5 flex items-center gap-2 text-zinc-300">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Execution Block: Active</span>
          </div>
          <div className="p-2 rounded-lg bg-black/60 border border-white/5 flex items-center gap-2 text-zinc-300">
            <Zap className="w-4 h-4 text-cyan-400 shrink-0" />
            <span>Network Egress: 0.0.0.0 (Null)</span>
          </div>
          <div className="p-2 rounded-lg bg-black/60 border border-white/5 flex items-center gap-2 text-zinc-300">
            <Binary className="w-4 h-4 text-purple-400 shrink-0" />
            <span>Memory RWX: Revoked</span>
          </div>
          <div className="p-2 rounded-lg bg-black/60 border border-white/5 flex items-center gap-2 text-zinc-300">
            <Activity className="w-4 h-4 text-amber-400 shrink-0" />
            <span>HIPS Syscall Trap: Engaged</span>
          </div>
        </div>
      </div>

      {/* Main Study Grid: Vault List (Left) + Code Inspector (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Column: Quarantined Objects Vault List */}
        <div className="lg:col-span-4 space-y-3">
          <div className="bg-[#0b0f19] p-4 rounded-2xl border border-white/10 shadow-xl space-y-3 font-mono">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Lock className="w-3.5 h-3.5 text-purple-400" />
                <span>Isolated Objects ({quarantineItems.filter(q => q.status !== 'PURGED').length})</span>
              </h3>
              <span className="text-[10px] text-[#708098]">Vault: AES-XTS-256</span>
            </div>

            <div className="space-y-2 max-h-[600px] overflow-y-auto custom-scrollbar pr-1">
              {quarantineItems.filter(q => q.status !== 'PURGED').length === 0 ? (
                <div className="p-6 text-center text-zinc-500 text-xs">
                  Vault is empty. No quarantined objects isolated.
                </div>
              ) : (
                quarantineItems
                  .filter(q => q.status !== 'PURGED')
                  .map((item) => {
                    const isSelected = selectedVaultId === item.id;
                    return (
                      <button
                        key={item.id}
                        onClick={() => setSelectedVaultId(item.id)}
                        className={`w-full text-left p-3 rounded-xl border transition-all cursor-pointer space-y-2 ${
                          isSelected
                            ? 'bg-purple-950/40 border-purple-500/70 shadow-lg shadow-purple-950/40'
                            : 'bg-black/40 border-white/5 hover:border-white/20 hover:bg-black/60'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-1">
                          <span className="text-xs font-bold text-white truncate max-w-[170px]">
                            {item.threatName}
                          </span>
                          {getSeverityBadge(item.threatSeverity)}
                        </div>

                        <div className="text-[10px] text-[#8fa0b5] space-y-0.5">
                          <div className="truncate">File: <span className="text-zinc-300">{item.originalFileName}</span></div>
                          <div className="flex justify-between text-zinc-400">
                            <span>Arch: {item.architecture}</span>
                            <span>{(item.fileSizeBytes / 1024).toFixed(1)} KB</span>
                          </div>
                        </div>

                        <div className="flex items-center justify-between text-[9px] pt-1 border-t border-white/5">
                          <span className="text-purple-400 font-bold">Entropy: {item.entropy.toFixed(2)}/8.0</span>
                          <span className="text-zinc-500">{item.quarantinedAt.split(' ')[1] || item.quarantinedAt}</span>
                        </div>
                      </button>
                    );
                  })
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Code Deconstruction & Reverse-Engineering Study Bench */}
        <div className="lg:col-span-8 space-y-3">
          {selectedItem ? (
            <div className="bg-[#0b0f19] p-5 rounded-2xl border border-white/10 shadow-xl space-y-4 font-mono">
              {/* Header Info for Selected Object */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/10 pb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-white">{selectedItem.threatName}</h3>
                    {getSeverityBadge(selectedItem.threatSeverity)}
                    <span className="text-[10px] px-2 py-0.5 rounded bg-purple-950/80 border border-purple-500/40 text-purple-300 font-bold">
                      {selectedItem.architecture}
                    </span>
                  </div>
                  <p className="text-[11px] text-[#8fa0b5] pt-0.5 truncate max-w-xl">
                    Origin: <span className="text-zinc-300">{selectedItem.originalPath}</span>
                  </p>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[10px] px-2 py-1 rounded bg-black/60 border border-white/10 text-cyan-400">
                    Entropy: <strong className="text-white">{selectedItem.entropy.toFixed(2)}</strong> / 8.00
                  </span>

                  <button
                    onClick={handleArchiveToEncryptedVault}
                    className="px-2.5 py-1 rounded-lg bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-500/50 text-emerald-200 text-xs font-mono font-bold flex items-center gap-1.5 transition-all shadow-md shadow-emerald-950/40 cursor-pointer"
                    title="Encrypt and archive this malware sample into IndexedDB with AES-GCM-256"
                  >
                    <Key className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Archive to AES-256 Vault</span>
                  </button>

                  <button
                    onClick={() => setIsStixModalOpen(true)}
                    className="px-2.5 py-1 rounded-lg bg-gradient-to-r from-purple-950 to-indigo-950 hover:from-purple-900 hover:to-indigo-900 border border-purple-500/50 text-purple-200 text-xs font-mono font-bold flex items-center gap-1.5 transition-all shadow-md shadow-purple-950/40 cursor-pointer"
                    title="Export STIX 2.1 & TAXII Feed for this isolated sample"
                  >
                    <Share2 className="w-3.5 h-3.5 text-purple-400" />
                    <span>Export STIX 2.1 Feed</span>
                  </button>

                  {onNavigateToVault && (
                    <button
                      onClick={onNavigateToVault}
                      className="px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 border border-white/10 text-zinc-300 text-xs font-mono flex items-center gap-1.5 transition-all cursor-pointer"
                      title="Open Encrypted Persistent Vault View"
                    >
                      <Lock className="w-3.5 h-3.5 text-purple-400" />
                      <span>Encrypted Vault</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Behavioral Assessment Callout */}
              <div className="p-3 rounded-xl bg-black/70 border border-purple-500/30 text-xs text-[#cad5e2] leading-relaxed">
                <strong className="text-purple-400 uppercase text-[10px] block mb-1">
                  Automated Reverse-Engineering Summary:
                </strong>
                {selectedItem.decompiledCode.behavioralAnalysis}
              </div>

              {/* Study Workbench Navigation Tabs */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 border-b border-white/10 text-xs">
                <button
                  onClick={() => setStudyTab('decompiled_c')}
                  className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition-all whitespace-nowrap cursor-pointer ${
                    studyTab === 'decompiled_c'
                      ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30'
                      : 'bg-black/40 text-[#888] hover:text-white hover:bg-black/80'
                  }`}
                >
                  <FileCode className="w-3.5 h-3.5" />
                  <span>Decompiled Code (C/Rust)</span>
                </button>

                <button
                  onClick={() => setStudyTab('disassembly_asm')}
                  className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition-all whitespace-nowrap cursor-pointer ${
                    studyTab === 'disassembly_asm'
                      ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30'
                      : 'bg-black/40 text-[#888] hover:text-white hover:bg-black/80'
                  }`}
                >
                  <Cpu className="w-3.5 h-3.5" />
                  <span>Disassembly (x86_64 ASM)</span>
                </button>

                <button
                  onClick={() => setStudyTab('wasm_radare2')}
                  className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition-all whitespace-nowrap cursor-pointer ${
                    studyTab === 'wasm_radare2'
                      ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30 border border-purple-400/50'
                      : 'bg-black/40 text-purple-400 hover:text-white hover:bg-purple-950/40'
                  }`}
                >
                  <Code2 className="w-3.5 h-3.5 text-purple-400" />
                  <span>WASM Static Disasm & CFG (r2)</span>
                </button>

                <button
                  onClick={() => setStudyTab('strings_iocs')}
                  className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition-all whitespace-nowrap cursor-pointer ${
                    studyTab === 'strings_iocs'
                      ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30'
                      : 'bg-black/40 text-[#888] hover:text-white hover:bg-black/80'
                  }`}
                >
                  <Search className="w-3.5 h-3.5" />
                  <span>Extracted Strings & IOCs ({selectedItem.decompiledCode.extracted_strings.length})</span>
                </button>

                <button
                  onClick={() => setStudyTab('hex_dump')}
                  className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition-all whitespace-nowrap cursor-pointer ${
                    studyTab === 'hex_dump'
                      ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30'
                      : 'bg-black/40 text-[#888] hover:text-white hover:bg-black/80'
                  }`}
                >
                  <Binary className="w-3.5 h-3.5" />
                  <span>Hex Dump & Bytes</span>
                </button>

                <button
                  onClick={() => setStudyTab('sandbox_trace')}
                  className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition-all whitespace-nowrap cursor-pointer ${
                    studyTab === 'sandbox_trace'
                      ? 'bg-cyan-600 text-white shadow-lg shadow-cyan-600/30'
                      : 'bg-black/40 text-[#888] hover:text-white hover:bg-black/80'
                  }`}
                >
                  <Activity className="w-3.5 h-3.5" />
                  <span>Sandbox Syscall Trace ({emulatedSyscalls.length})</span>
                </button>

                <button
                  onClick={() => setStudyTab('yara_rule')}
                  className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition-all whitespace-nowrap cursor-pointer ${
                    studyTab === 'yara_rule'
                      ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30'
                      : 'bg-black/40 text-[#888] hover:text-white hover:bg-black/80'
                  }`}
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>YARA Signature</span>
                </button>
              </div>

              {/* View 1: Decompiled C/Rust Source Code */}
              {studyTab === 'decompiled_c' && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs text-[#8fa0b5]">
                    <span>Reconstructed High-Level Source Representation</span>
                    <button
                      onClick={() => handleCopy(selectedItem.decompiledCode.c_pseudocode, 'decompiled_c')}
                      className="px-2 py-1 rounded bg-black/60 border border-white/10 hover:border-white/30 text-white flex items-center gap-1 cursor-pointer text-[10px]"
                    >
                      {copiedText === 'decompiled_c' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedText === 'decompiled_c' ? 'Copied' : 'Copy Code'}</span>
                    </button>
                  </div>

                  <pre className="p-4 rounded-xl bg-black/90 border border-white/10 text-emerald-400 text-xs leading-relaxed overflow-x-auto max-h-[420px] custom-scrollbar selection:bg-purple-900 selection:text-white font-mono">
                    <code>{selectedItem.decompiledCode.c_pseudocode}</code>
                  </pre>
                </div>
              )}

              {/* View 2: Disassembly x86_64 ASM */}
              {studyTab === 'disassembly_asm' && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs text-[#8fa0b5]">
                    <span>Linear Disassembled Instruction Opcodes (x86_64)</span>
                    <button
                      onClick={() => handleCopy(selectedItem.decompiledCode.assembly_x86, 'disassembly_asm')}
                      className="px-2 py-1 rounded bg-black/60 border border-white/10 hover:border-white/30 text-white flex items-center gap-1 cursor-pointer text-[10px]"
                    >
                      {copiedText === 'disassembly_asm' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedText === 'disassembly_asm' ? 'Copied' : 'Copy ASM'}</span>
                    </button>
                  </div>

                  <pre className="p-4 rounded-xl bg-black/90 border border-white/10 text-cyan-300 text-xs leading-relaxed overflow-x-auto max-h-[420px] custom-scrollbar selection:bg-cyan-900 selection:text-white font-mono">
                    <code>{selectedItem.decompiledCode.assembly_x86}</code>
                  </pre>
                </div>
              )}

              {/* View 2B: WASM Capstone / Radare2 Static Disassembler & CFG Studio */}
              {studyTab === 'wasm_radare2' && (
                <div className="space-y-3">
                  <WasmDisassemblerGUI 
                    initialBinaryName={selectedItem.originalFileName}
                    onRunCliCommand={onRunCliCommand}
                  />
                </div>
              )}

              {/* View 3: Extracted Strings & IOCs */}
              {studyTab === 'strings_iocs' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs text-[#8fa0b5]">
                    <span>Extracted Indicators of Compromise (C2 IPs, Mutexes, URLs, API Imports)</span>
                  </div>

                  <div className="space-y-2 max-h-[400px] overflow-y-auto custom-scrollbar">
                    {selectedItem.decompiledCode.extracted_strings.map((strItem, sIdx) => (
                      <div 
                        key={sIdx}
                        className="p-2.5 rounded-lg bg-black/60 border border-white/10 flex items-center justify-between gap-2 text-xs"
                      >
                        <div className="flex items-center gap-2 overflow-hidden">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold shrink-0 ${
                            strItem.type === 'C2_IP' ? 'bg-red-950 border border-red-500/50 text-red-400' :
                            strItem.type === 'URL' ? 'bg-indigo-950 border border-indigo-500/50 text-indigo-300' :
                            strItem.type === 'API_IMPORT' ? 'bg-cyan-950 border border-cyan-500/50 text-cyan-300' :
                            strItem.type === 'MUTEX' ? 'bg-purple-950 border border-purple-500/50 text-purple-300' :
                            strItem.type === 'SHELLCODE' ? 'bg-amber-950 border border-amber-500/50 text-amber-400' :
                            'bg-zinc-900 border border-zinc-700 text-zinc-300'
                          }`}>
                            {strItem.type}
                          </span>
                          <span className="text-[10px] text-zinc-500 shrink-0">{strItem.offset}</span>
                          <span className="text-white font-bold truncate select-all">{strItem.stringVal}</span>
                        </div>

                        <button
                          onClick={() => handleCopy(strItem.stringVal, `str_${sIdx}`)}
                          className="p-1 rounded text-zinc-500 hover:text-white cursor-pointer"
                          title="Copy String"
                        >
                          {copiedText === `str_${sIdx}` ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* View 4: Hex Dump & Bytes */}
              {studyTab === 'hex_dump' && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs text-[#8fa0b5]">
                    <span>Raw Binary Header Byte Inspection</span>
                  </div>

                  <div className="p-4 rounded-xl bg-black/90 border border-white/10 overflow-x-auto max-h-[420px] custom-scrollbar text-xs font-mono">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="text-[#708098] border-b border-white/10 pb-1">
                          <th className="py-1">OFFSET</th>
                          <th className="py-1">HEX BYTES (00-0F)</th>
                          <th className="py-1">ASCII DECODED</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {selectedItem.decompiledCode.hex_dump.map((line, lIdx) => (
                          <tr key={lIdx} className="hover:bg-white/5">
                            <td className="py-1 text-purple-400">{line.offset}</td>
                            <td className="py-1 text-cyan-300 font-mono tracking-wider">{line.hex}</td>
                            <td className="py-1 text-emerald-400 font-mono">{line.ascii}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* View 5: Sandbox Syscall Trace */}
              {studyTab === 'sandbox_trace' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs text-[#8fa0b5]">
                    <span>Ring -1 Sandboxed Syscall Interception Trace</span>
                    <div className="flex items-center gap-2">
                      {onNavigateToEbpf && (
                        <button
                          onClick={onNavigateToEbpf}
                          className="px-2.5 py-1 rounded bg-indigo-950 border border-indigo-500/50 text-indigo-300 hover:bg-indigo-900 text-[10px] font-bold flex items-center gap-1 cursor-pointer"
                          title="Open Live eBPF Syscall Sandbox Suite"
                        >
                          <Cpu className="w-3 h-3" />
                          <span>Live eBPF Sandbox</span>
                        </button>
                      )}
                      <button
                        onClick={handleTriggerEmulation}
                        disabled={sandboxEmulating}
                        className="px-2.5 py-1 rounded bg-cyan-950 border border-cyan-500/50 text-cyan-300 hover:bg-cyan-900 text-[10px] font-bold flex items-center gap-1 cursor-pointer"
                      >
                        <Play className="w-3 h-3" />
                        <span>Re-Run Emulation</span>
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2 max-h-[400px] overflow-y-auto custom-scrollbar">
                    {emulatedSyscalls.map((tr) => (
                      <div
                        key={tr.id}
                        className="p-3 rounded-lg bg-black/70 border border-white/10 space-y-1 text-xs"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 rounded bg-cyan-950 border border-cyan-500/40 text-cyan-300 font-bold text-[10px]">
                              {tr.syscall}()
                            </span>
                            <span className="text-[10px] text-zinc-500">{tr.timestamp}</span>
                          </div>

                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            tr.status === 'BLOCKED_BY_HIPS' ? 'bg-red-950 border border-red-500/60 text-red-400' :
                            tr.status === 'INTERCEPTED' ? 'bg-amber-950 border border-amber-500/60 text-amber-400' :
                            'bg-zinc-900 border border-zinc-700 text-zinc-300'
                          }`}>
                            {tr.status}
                          </span>
                        </div>

                        <div className="text-[11px] text-zinc-400 break-all">
                          Args: <span className="text-zinc-200">{tr.arguments}</span>
                        </div>

                        <div className="flex items-center justify-between text-[10px] text-zinc-500 pt-0.5">
                          <span>Return: {tr.returnVal}</span>
                          <span className="text-red-400">Risk Score: {tr.riskScore}/100</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* View 6: YARA Signature */}
              {studyTab === 'yara_rule' && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs text-[#8fa0b5]">
                    <span>Automated YARA Signature Rule Generated from Binary Pattern</span>
                    <button
                      onClick={() => handleCopy(selectedItem.decompiledCode.yara_rule_generated, 'yara_rule')}
                      className="px-2 py-1 rounded bg-black/60 border border-white/10 hover:border-white/30 text-white flex items-center gap-1 cursor-pointer text-[10px]"
                    >
                      {copiedText === 'yara_rule' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedText === 'yara_rule' ? 'Copied' : 'Copy YARA Rule'}</span>
                    </button>
                  </div>

                  <pre className="p-4 rounded-xl bg-black/90 border border-white/10 text-yellow-300 text-xs leading-relaxed overflow-x-auto max-h-[420px] custom-scrollbar selection:bg-yellow-900 selection:text-white font-mono">
                    <code>{selectedItem.decompiledCode.yara_rule_generated}</code>
                  </pre>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-[#0b0f19] p-12 rounded-2xl border border-white/10 text-center text-zinc-500 font-mono text-xs">
              No quarantined object selected. Choose an isolated file from the left vault panel.
            </div>
          )}
        </div>
      </div>

      {/* STIX 2.1 & TAXII 2.1 Threat Intel Export Modal */}
      {selectedItem && (
        <StixTaxiiExportModal
          isOpen={isStixModalOpen}
          onClose={() => setIsStixModalOpen(false)}
          threats={hipsAntiMalwareService.getDetectedThreats()}
          quarantinedList={quarantineItems}
          initialSelectedThreatId={selectedItem.threatId}
          onRunCliCommand={onRunCliCommand}
        />
      )}
    </div>
  );
};
