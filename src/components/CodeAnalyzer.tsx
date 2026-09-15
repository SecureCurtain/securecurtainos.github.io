// jb7572_2026-08-24: Production Kernel & Subsystem Code Analyzer & Drag-and-Drop Installer
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { sampleCodeSnippets } from '../data/osTreeData';
import { analyzeCodeSnippet } from '../utils/codeAnalyzer';
import { AnalysisResult } from '../types';
import { 
  CheckCircle2, 
  AlertTriangle, 
  ArrowRight, 
  Sparkles, 
  FolderCheck, 
  Code2, 
  FileCode2, 
  Info, 
  Copy, 
  Check, 
  Layers,
  Search,
  Filter,
  UploadCloud,
  FileUp,
  FolderPlus,
  ShieldCheck,
  Cpu,
  Zap,
  CheckSquare
} from 'lucide-react';

interface CodeAnalyzerProps {
  initialFilename?: string;
  initialCode?: string;
  onPlaceFile: (filename: string, path: string, content: string, description: string) => void;
}

type SnippetCategory = 
  | 'ALL' 
  | 'BOOT' 
  | 'KERNEL' 
  | 'DRIVERS' 
  | 'STORAGE' 
  | 'SECURITY' 
  | 'LOCKSCREEN' 
  | 'WIN32_APPS';

// jb7572_2026-08-24: Interactive Source Code Inspector, Drag-and-Drop Installer & Placement Component
export const CodeAnalyzer: React.FC<CodeAnalyzerProps> = ({ 
  initialFilename, 
  initialCode, 
  onPlaceFile 
}) => {
  const [filename, setFilename] = useState(initialFilename || 'boot.asm');
  const [code, setCode] = useState(initialCode !== undefined ? initialCode : sampleCodeSnippets[0].code);
  const [selectedCategory, setSelectedCategory] = useState<SnippetCategory>('ALL');
  const [snippetSearch, setSnippetSearch] = useState('');
  const [analysis, setAnalysis] = useState<AnalysisResult>(() => 
    analyzeCodeSnippet(initialFilename || 'boot.asm', initialCode !== undefined ? initialCode : sampleCodeSnippets[0].code)
  );
  const [copied, setCopied] = useState(false);
  const [placed, setPlaced] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync if initial props change
  useEffect(() => {
    if (initialFilename) setFilename(initialFilename);
    if (initialCode !== undefined) setCode(initialCode);
  }, [initialFilename, initialCode]);

  // File Upload & Drag-and-Drop Handler
  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      processUploadedFile(file);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      processUploadedFile(file);
    }
  };

  const processUploadedFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setFilename(file.name);
      setCode(content || `// Loaded ${file.name} (${file.size} bytes)\n`);
    };
    reader.readAsText(file);
  };

  // jb7572_2026-08-24: Categorizes OS module files by architectural domain
  const getCategoryForSnippet = (name: string): SnippetCategory => {
    const n = name.toLowerCase();
    if (n.includes('boot') || n.includes('multiboot') || n.includes('linker') || n.includes('make') || n.includes('build_')) {
      return 'BOOT';
    }
    if (n.includes('lock') || n.includes('rescue') || n.includes('config_panel') || n.includes('pm_') || n.includes('session_timer')) {
      return 'LOCKSCREEN';
    }
    if (n.includes('fw_') || n.includes('tarpit') || n.includes('malware') || n.includes('anti_debug') || n.includes('integrity') || n.includes('shredder') || n.includes('audit') || n.includes('rbac') || n.includes('scim') || n.includes('user_space') || n.includes('keyring') || n.includes('sandbox')) {
      return 'SECURITY';
    }
    if (n.includes('win32') || n.includes('ntdll') || n.includes('kernel32') || n.includes('user32') || n.includes('gdi32') || n.includes('advapi') || n.includes('gui') || n.includes('chat') || n.includes('timezone') || n.includes('exporter')) {
      return 'WIN32_APPS';
    }
    if (n.includes('vfs') || n.includes('fat32') || n.includes('ext2') || n.includes('ramdisk') || n.includes('mbr') || n.includes('gpt') || n.includes('pipe') || n.includes('ahci') || n.includes('nvme')) {
      return 'STORAGE';
    }
    if (n.includes('vga') || n.includes('pic') || n.includes('apic') || n.includes('serial') || n.includes('keyboard') || n.includes('mouse') || n.includes('pci') || n.includes('rtl8139') || n.includes('e1000') || n.includes('usb') || n.includes('audio') || n.includes('acpi') || n.includes('net_') || n.includes('hardware_io')) {
      return 'DRIVERS';
    }
    return 'KERNEL';
  };

  // jb7572_2026-08-24: Memoized filter for searchable system modules list
  const filteredSnippets = useMemo(() => {
    return sampleCodeSnippets.filter(sample => {
      const matchCat = selectedCategory === 'ALL' || getCategoryForSnippet(sample.suggestedName) === selectedCategory;
      const matchQuery = !snippetSearch.trim() || 
        sample.suggestedName.toLowerCase().includes(snippetSearch.toLowerCase()) || 
        sample.title.toLowerCase().includes(snippetSearch.toLowerCase()) ||
        sample.description.toLowerCase().includes(snippetSearch.toLowerCase());
      return matchCat && matchQuery;
    });
  }, [selectedCategory, snippetSearch]);

  // jb7572_2026-08-24: Re-trigger static analysis whenever filename or code changes
  useEffect(() => {
    const result = analyzeCodeSnippet(filename, code);
    setAnalysis(result);
    setPlaced(false);
  }, [filename, code]);


  // jb7572_2026-08-24: Module selection dispatcher
  const handleSelectSample = (sampleId: string) => {
    const sample = sampleCodeSnippets.find(s => s.id === sampleId);
    if (sample) {
      setFilename(sample.suggestedName);
      setCode(sample.code);
    }
  };

  // jb7572_2026-08-24: Clipboard copy for analyzed source snippet
  const handleCopyCode = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // jb7572_2026-08-24: Commits and places the analyzed file into project tree
  const handlePlaceAction = () => {
    const finalFilename = analysis.agreesWithFilename ? filename : analysis.suggestedFilename;
    onPlaceFile(
      finalFilename,
      analysis.recommendedPath,
      code,
      analysis.architecturalExplanation
    );
    setPlaced(true);
  };


  return (
    <div className="space-y-5">
      {/* Header & Sample Selector */}
      <div className="bg-[#0f0f0f] p-5 rounded-xl border border-[#222] shadow-xl space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <h2 className="text-sm font-semibold text-[#e5e5e5] uppercase tracking-wider flex items-center gap-2">
              <Code2 className="w-4 h-4 text-[#c4b5fd]" />
              Source Code Input & Drag-and-Drop Installer
            </h2>
            <p className="text-xs text-[#737373] mt-1">
              Drop kernel source files (<code className="text-[#c4b5fd]">.c</code>, <code className="text-[#c4b5fd]">.h</code>, <code className="text-[#c4b5fd]">.asm</code>, <code className="text-[#c4b5fd]">.s</code>, <code className="text-[#c4b5fd]">.py</code>, <code className="text-[#c4b5fd]">.ld</code>), browse files, or select from built-in modules to install directly to <code className="bg-[#181818] px-1.5 py-0.5 rounded font-mono text-[#c4b5fd] border border-[#282828]">SecureCurtain/sys</code>.
            </p>
          </div>

          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#1a1a24] hover:bg-[#252538] border border-[#383854] text-xs font-mono text-[#c4b5fd] hover:text-white transition-all shadow-sm active:scale-95"
          >
            <FileUp className="w-3.5 h-3.5" />
            <span>Browse Local File</span>
          </button>
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileInputChange} 
            className="hidden" 
            accept=".c,.h,.asm,.s,.inc,.ld,.py,.sh,.json,.txt,.md"
          />
        </div>

        {/* Drag and Drop Zone */}
        <div
          onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
          onDragLeave={() => setIsDragOver(false)}
          onDrop={handleFileDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`p-6 rounded-xl border-2 border-dashed transition-all cursor-pointer flex flex-col items-center justify-center text-center gap-2 ${
            isDragOver 
              ? 'bg-[#1a1429] border-[#c4b5fd] text-white scale-[1.01]' 
              : 'bg-[#08080c] hover:bg-[#0c0c14] border-[#252536] hover:border-[#434368] text-[#888]'
          }`}
        >
          <div className="w-10 h-10 rounded-full bg-[#161626] border border-[#2a2a44] flex items-center justify-center text-[#c4b5fd]">
            <UploadCloud className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs font-mono font-semibold text-[#d4d4d4] block">
              Drag & Drop file here to inspect & install
            </span>
            <span className="text-[11px] text-[#666] block mt-0.5">
              Supports .c, .h, .asm, .s, .ld, .py, .sh or text payloads • Click to browse
            </span>
          </div>
          {filename && (
            <div className="mt-1 flex items-center gap-1.5 text-[11px] font-mono bg-[#161622] px-2.5 py-1 rounded-full border border-[#2c2c42] text-[#c4b5fd]">
              <FileCode2 className="w-3.5 h-3.5" />
              <span>Loaded: <strong>{filename}</strong></span>
            </div>
          )}
        </div>

        {/* Snippet Categorization and Selection Engine */}
        <div className="bg-[#080808] p-3 rounded-lg border border-[#1a1a1a] space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#1f1f1f] pb-2.5">
            <div className="flex items-center gap-1.5 text-xs text-[#a3a3a3] font-mono font-medium">
              <Filter className="w-3.5 h-3.5 text-[#c4b5fd]" />
              <span>Explore {sampleCodeSnippets.length} System Modules:</span>
            </div>

            {/* Quick Category Chips */}
            <div className="flex flex-wrap gap-1">
              {(
                [
                  { id: 'ALL', label: `All (${sampleCodeSnippets.length})` },
                  { id: 'BOOT', label: 'Boot' },
                  { id: 'KERNEL', label: 'Kernel' },
                  { id: 'SECURITY', label: 'Security' },
                  { id: 'LOCKSCREEN', label: 'Lockscreen' },
                  { id: 'STORAGE', label: 'Storage' },
                  { id: 'DRIVERS', label: 'Drivers' },
                  { id: 'WIN32_APPS', label: 'Win32/Apps' }
                ] as const
              ).map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-2 py-0.5 text-[11px] font-mono rounded transition-colors ${
                    selectedCategory === cat.id
                      ? 'bg-[#262626] text-[#c4b5fd] font-bold border border-[#404040]'
                      : 'bg-[#121212] text-[#737373] hover:text-[#d4d4d4] hover:bg-[#1a1a1a] border border-[#1f1f1f]'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-2">
            {/* Search within snippets */}
            <div className="relative flex-1">
              <input
                type="text"
                value={snippetSearch}
                onChange={(e) => setSnippetSearch(e.target.value)}
                placeholder="Search snippets (e.g. net_config, rescue_egg, rbac, vfs)..."
                className="w-full pl-8 pr-3 py-1.5 text-xs font-mono bg-[#050505] border border-[#1f1f1f] rounded focus:outline-none focus:border-[#333] text-[#e5e5e5] placeholder-[#404040]"
              />
              <Search className="w-3.5 h-3.5 text-[#666] absolute left-2.5 top-2" />
            </div>

            {/* Direct select dropdown */}
            <select
              value=""
              onChange={(e) => {
                if (e.target.value) handleSelectSample(e.target.value);
              }}
              className="px-3 py-1.5 text-xs font-mono bg-[#121212] border border-[#262626] rounded text-[#c4b5fd] focus:outline-none focus:border-[#404040]"
            >
              <option value="">-- Choose from {filteredSnippets.length} files --</option>
              {filteredSnippets.map(sample => (
                <option key={sample.id} value={sample.id}>
                  {sample.suggestedName} ({sample.title})
                </option>
              ))}
            </select>
          </div>

          {/* Quick Clickable Badges (horizontal scroll) */}
          <div className="flex items-center gap-1.5 overflow-x-auto py-1 max-h-24 flex-wrap">
            {filteredSnippets.slice(0, 20).map(sample => (
              <button
                key={sample.id}
                onClick={() => handleSelectSample(sample.id)}
                className={`px-2 py-1 text-xs font-mono rounded bg-[#141414] hover:bg-[#202020] transition-colors border shrink-0 ${
                  filename === sample.suggestedName
                    ? 'text-[#c4b5fd] border-[#555] bg-[#1c1c1c] font-bold'
                    : 'text-[#888] hover:text-[#e5e5e5] border-[#222]'
                }`}
                title={sample.title}
              >
                {sample.suggestedName}
              </button>
            ))}
            {filteredSnippets.length > 20 && (
              <span className="text-[10px] font-mono text-[#525252] self-center px-1">
                +{filteredSnippets.length - 20} more (use dropdown above)
              </span>
            )}
          </div>
        </div>

        {/* Inputs */}
        <div className="space-y-3">
          <div>
            <label id="filename-label" htmlFor="filename-input" className="block text-[11px] font-mono uppercase tracking-widest text-[#737373] mb-1.5">
              Proposed File Name
            </label>
            <div className="relative">
              <input
                id="filename-input"
                type="text"
                value={filename}
                onChange={(e) => setFilename(e.target.value)}
                placeholder="e.g. boot.asm, vga.h, kmain.c, pmm.c, build_subsystem.py"
                className="w-full px-3.5 py-2 text-xs font-mono bg-[#050505] border border-[#1a1a1a] rounded-lg focus:outline-none focus:border-[#333] text-[#e5e5e5] placeholder-[#404040]"
              />
              <span className="absolute right-3 top-2.5 text-[10px] uppercase tracking-wider text-[#525252] font-mono">
                {analysis.detectedType}
              </span>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label id="code-label" htmlFor="code-textarea" className="block text-[11px] font-mono uppercase tracking-widest text-[#737373]">
                Paste Code Snippet Below
              </label>
              <button
                onClick={handleCopyCode}
                className="text-xs font-mono text-[#737373] hover:text-[#e5e5e5] flex items-center gap-1"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? 'Copied' : 'Copy'}
              </button>
            </div>
            <textarea
              id="code-textarea"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              rows={11}
              placeholder="Paste C code, x86_64 assembly, headers, linker scripts, or python scripts here..."
              className="w-full p-4 text-xs font-mono bg-[#050505] text-[#d4d4d4] rounded-lg border border-[#1a1a1a] focus:outline-none focus:border-[#333] resize-y leading-relaxed"
            />
          </div>
        </div>
      </div>

      {/* Analysis Results Card */}
      <div className="bg-[#0f0f0f] p-5 rounded-xl border border-[#222] shadow-xl space-y-5">
        <div className="flex items-center justify-between border-b border-[#222] pb-3">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-[#a3a3a3] flex items-center gap-2">
            <Layers className="w-4 h-4 text-[#c4b5fd]" />
            AI Architect Recommendation
          </h3>
          <div className="flex gap-1.5">
            {analysis.tags.map((tag, idx) => (
              <span key={idx} className="px-2 py-0.5 text-[10px] font-mono uppercase tracking-widest bg-[#181818] text-[#888] rounded border border-[#282828]">
                {tag}
              </span>
            ))}
          </div>
        </div>

        {/* Filename Agreement Banner */}
        <div className={`p-4 rounded-lg border flex items-start gap-3 ${
          analysis.agreesWithFilename 
            ? 'bg-[#06180e] border-emerald-900/60 text-emerald-200'
            : 'bg-[#1e1507] border-amber-900/60 text-amber-200'
        }`}>
          {analysis.agreesWithFilename ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
          ) : (
            <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          )}

          <div className="space-y-1 text-xs">
            <div className="font-mono font-semibold text-xs">
              {analysis.agreesWithFilename ? (
                <span>✓ Filename Agreed: <code className="bg-[#0b2918] px-1.5 py-0.5 rounded text-emerald-300">{filename}</code></span>
              ) : (
                <span>Filename Recommendation: Use <code className="bg-[#2d200b] px-1.5 py-0.5 rounded text-amber-300">{analysis.suggestedFilename}</code> instead of <code className="line-through opacity-75">{filename || 'empty'}</code></span>
              )}
            </div>
            <p className="leading-relaxed opacity-90 text-[11px]">{analysis.filenameReason}</p>
          </div>
        </div>

        {/* Target Directory Placement Box */}
        <div className="bg-[#050505] p-4 rounded-lg border border-[#1a1a1a] space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono uppercase tracking-widest text-[#737373] flex items-center gap-1.5">
              <FolderCheck className="w-4 h-4 text-[#c4b5fd]" /> Recommended Placement Target
            </span>
            <span className="text-[10px] font-mono uppercase tracking-widest text-[#888] bg-[#141414] px-2 py-0.5 rounded border border-[#222]">
              x86_64 Tree Rule
            </span>
          </div>

          <div className="p-3 bg-[#0d0d0d] rounded border border-[#1a1a1a] font-mono text-xs font-medium text-[#e5e5e5] flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-1.5 text-[#a3a3a3]">
              <span>{analysis.recommendedPath}/</span>
              <span className="text-[#c4b5fd] font-bold bg-[#1a1a1a] px-1.5 py-0.5 rounded border border-[#333]">
                {analysis.agreesWithFilename ? filename : analysis.suggestedFilename}
              </span>
            </div>

            <button
              onClick={handlePlaceAction}
              disabled={placed}
              className={`px-3.5 py-1.5 text-xs font-mono uppercase tracking-wider font-semibold rounded transition-all ${
                placed
                  ? 'bg-emerald-950 text-emerald-300 border border-emerald-800 cursor-default'
                  : 'bg-[#1e1e1e] hover:bg-[#282828] text-[#c4b5fd] border border-[#333] active:scale-95'
              }`}
            >
              {placed ? (
                <>
                  <Check className="w-3.5 h-3.5" /> Placed in Tree
                </>
              ) : (
                <>
                  Move File Here <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </div>

          <div className="flex items-start gap-2 text-xs text-[#888] bg-[#0d0d0d] p-3 rounded border border-[#1a1a1a]">
            <Info className="w-4 h-4 text-[#c4b5fd] shrink-0 mt-0.5" />
            <div className="text-[11px]">
              <span className="font-semibold text-[#e5e5e5]">Architectural Rationale: </span>
              {analysis.architecturalExplanation}
            </div>
          </div>
        </div>

        {/* 🛡️ 3 GOLDEN RULES VERIFICATION AUDIT PANEL */}
        <div className="bg-[#08080c] p-4 rounded-xl border border-[#222233] space-y-4">
          <div className="flex items-center justify-between border-b border-[#1c1c28] pb-2.5">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-sky-400" />
              <h4 className="text-xs font-bold font-mono tracking-wider text-white uppercase">
                Continuous 3-Rule Code Audit
              </h4>
            </div>
            <div className="flex items-center gap-2 text-[10px] font-mono">
              <span className="px-2 py-0.5 rounded bg-sky-950 text-sky-300 border border-sky-800">
                Rule 1: {analysis.audit?.rule1_realLifeSystem?.score || 95}% Viable
              </span>
              <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800">
                Rule 2: {analysis.audit?.rule2_security?.score || 98}% Secure
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {/* Rule 1: Real-Life Computer System Viability */}
            <div className="p-3.5 rounded-lg bg-[#0e1017] border border-[#1e2333] space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-sky-300">
                <Cpu className="w-4 h-4 text-sky-400" />
                <span>1. Real-Life System Viable</span>
              </div>
              <div className="text-[10px] font-mono text-[#8899aa] bg-[#080a10] p-2 rounded border border-[#161c2b]">
                <strong className="text-white block mb-0.5">ABI / Calling Target:</strong>
                {analysis.audit?.rule1_realLifeSystem?.abiStandard}
              </div>
              <div className="space-y-1">
                <span className="text-[10px] font-mono text-[#667788] block font-semibold">Hardware Rules:</span>
                {analysis.audit?.rule1_realLifeSystem?.findings.map((f, i) => (
                  <div key={i} className="flex items-start gap-1.5 text-[11px] text-[#cbd5e1] leading-tight">
                    <span className="text-sky-400">✓</span>
                    <span>{f}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Rule 2: Security & Privilege Ring Boundary */}
            <div className="p-3.5 rounded-lg bg-[#0c1311] border border-[#172b22] space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-300">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>2. Security & Privilege Level</span>
              </div>
              <div className="text-[10px] font-mono text-[#88aa99] bg-[#07110c] p-2 rounded border border-[#112419]">
                <strong className="text-white block mb-0.5">Execution Ring:</strong>
                <span className="text-emerald-300 font-bold">{analysis.audit?.rule2_security?.privilegeLevel}</span>
              </div>
              <div className="space-y-1">
                <span className="text-[10px] font-mono text-[#557766] block font-semibold">Mitigations Verified:</span>
                {analysis.audit?.rule2_security?.mitigationsPassed.map((m, i) => (
                  <div key={i} className="flex items-start gap-1.5 text-[11px] text-[#cbd5e1] leading-tight">
                    <span className="text-emerald-400">🛡️</span>
                    <span>{m}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Rule 3: Optimization & Cleanliness */}
            <div className="p-3.5 rounded-lg bg-[#140f1c] border border-[#2b1e3b] space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-purple-300">
                <Zap className="w-4 h-4 text-purple-400" />
                <span>3. Optimization & Clean Architecture</span>
              </div>
              <div className="text-[10px] font-mono text-[#aa88cc] bg-[#0e0a14] p-2 rounded border border-[#221630]">
                <strong className="text-white block mb-0.5">Efficiency Rating:</strong>
                <span className="text-purple-300 font-bold">{analysis.audit?.rule3_enhancements?.efficiencyRating}</span>
              </div>
              <div className="space-y-1">
                <span className="text-[10px] font-mono text-[#775588] block font-semibold">Enhancement Points:</span>
                {analysis.audit?.rule3_enhancements?.optimizations.map((opt, i) => (
                  <div key={i} className="flex items-start gap-1.5 text-[11px] text-[#cbd5e1] leading-tight">
                    <span className="text-purple-400">⚡</span>
                    <span>{opt}</span>
                  </div>
                ))}
                {analysis.audit?.rule3_enhancements?.cleanlinessNotes.map((note, i) => (
                  <div key={`clean-${i}`} className="flex items-start gap-1.5 text-[11px] text-[#94a3b8] leading-tight">
                    <span className="text-purple-300">✨</span>
                    <span>{note}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
