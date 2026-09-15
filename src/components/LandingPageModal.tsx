import React, { useState } from 'react';
import { 
  Copy, 
  Check, 
  Download, 
  ExternalLink, 
  FileText, 
  Eye, 
  Code2, 
  BookOpen, 
  X, 
  ShieldCheck, 
  Cpu, 
  Globe, 
  Terminal, 
  FolderGit2
} from 'lucide-react';
import { LANDING_PAGE_MARKDOWN } from '../data/landingPageContent';

interface LandingPageModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const LandingPageModal: React.FC<LandingPageModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'preview' | 'raw' | 'guide'>('preview');
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(LANDING_PAGE_MARKDOWN);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Fallback
      const textArea = document.createElement('textarea');
      textArea.value = LANDING_PAGE_MARKDOWN;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handleDownload = () => {
    const blob = new Blob([LANDING_PAGE_MARKDOWN], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'README.md');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 sm:p-6 animate-in fade-in duration-150">
      <div className="bg-[#0f1117] border border-slate-700/80 rounded-2xl w-full max-w-5xl h-[90vh] flex flex-col shadow-2xl overflow-hidden text-slate-200">
        
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-800 bg-[#161a23] flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-purple-500/20 text-purple-400 border border-purple-500/40">
              <FolderGit2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white tracking-wide">
                  GitHub Landing Page & README Template
                </h2>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 font-semibold">
                  Saved on Disk
                </span>
              </div>
              <p className="text-xs text-slate-400 flex items-center gap-1.5 flex-wrap">
                <span>Repository:</span>
                <span className="text-purple-300 font-mono font-semibold bg-purple-950/60 px-1.5 py-0.5 rounded border border-purple-800/60">
                  SecureCurtain/securecurtainos
                </span>
                <span className="text-slate-600">•</span>
                <span>Disk files: <code className="text-purple-300 font-mono">/README.md</code> & <code className="text-purple-300 font-mono">/docs/LANDING_PAGE.md</code></span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all shadow-md ${
                copied 
                  ? 'bg-emerald-600 text-white shadow-emerald-600/30' 
                  : 'bg-purple-600 hover:bg-purple-500 text-white shadow-purple-600/30'
              }`}
              title="Copy markdown content to clipboard"
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied to Clipboard!' : 'Copy Markdown'}</span>
            </button>

            <button
              onClick={handleDownload}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 border border-slate-700 transition-all"
              title="Download as README.md"
            >
              <Download className="w-3.5 h-3.5 text-slate-300" />
              <span>Download .md</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-all ml-1"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Sub-Navigation Tabs */}
        <div className="px-6 py-2.5 bg-[#12161f] border-b border-slate-800/80 flex items-center justify-between text-xs font-mono">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('preview')}
              className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all ${
                activeTab === 'preview'
                  ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40 font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Formatted Preview</span>
            </button>

            <button
              onClick={() => setActiveTab('raw')}
              className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all ${
                activeTab === 'raw'
                  ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40 font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Code2 className="w-3.5 h-3.5" />
              <span>Raw Markdown Source</span>
            </button>

            <button
              onClick={() => setActiveTab('guide')}
              className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all ${
                activeTab === 'guide'
                  ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40 font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>How to Push to GitHub</span>
            </button>
          </div>

          <div className="hidden sm:flex items-center gap-3 text-slate-400 text-[11px]">
            <span>Length: {LANDING_PAGE_MARKDOWN.split('\n').length} lines</span>
            <span>•</span>
            <span>Size: {(new Blob([LANDING_PAGE_MARKDOWN]).size / 1024).toFixed(1)} KB</span>
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {/* TAB 1: FORMATTED PREVIEW */}
          {activeTab === 'preview' && (
            <div className="max-w-4xl mx-auto space-y-8 text-slate-300 leading-relaxed font-sans">
              {/* Hero Banner */}
              <div className="p-6 rounded-2xl bg-gradient-to-br from-slate-900 to-purple-950/40 border border-purple-500/30 space-y-4">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">🛡️</span>
                  <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                    SecureCurtain OS
                  </h1>
                </div>
                <p className="text-purple-200 font-medium text-sm sm:text-base italic">
                  The Self-Healing, Dual-Persona Microkernel Operating System for Mission-Critical Security, Forensics, and Sovereign Computing
                </p>

                {/* Badges preview */}
                <div className="flex flex-wrap gap-2 pt-2">
                  <span className="px-2.5 py-1 rounded bg-blue-900/60 text-blue-200 border border-blue-500/40 text-[11px] font-mono font-bold">
                    Architecture: x86_64 | AArch64
                  </span>
                  <span className="px-2.5 py-1 rounded bg-emerald-900/60 text-emerald-200 border border-emerald-500/40 text-[11px] font-mono font-bold">
                    Kernel: Microkernel (Fault-Isolated)
                  </span>
                  <span className="px-2.5 py-1 rounded bg-purple-900/60 text-purple-200 border border-purple-500/40 text-[11px] font-mono font-bold">
                    Subsystem: Linux (POSIX) + Windows (Win32)
                  </span>
                  <span className="px-2.5 py-1 rounded bg-indigo-900/60 text-indigo-200 border border-indigo-500/40 text-[11px] font-mono font-bold">
                    Safety Shield: Origin-Locked (Pacman + Apt)
                  </span>
                  <span className="px-2.5 py-1 rounded bg-rose-900/60 text-rose-200 border border-rose-500/40 text-[11px] font-mono font-bold">
                    Telemetry: ZERO (Air-Gapped Verified)
                  </span>
                </div>
              </div>

              {/* Architecture Diagram */}
              <div className="space-y-2">
                <h3 className="text-xs font-mono font-bold uppercase text-purple-400 tracking-wider">
                  System Architecture Virtualization
                </h3>
                <pre className="p-4 rounded-xl bg-slate-950 border border-slate-800 font-mono text-[11px] text-purple-200 overflow-x-auto leading-tight">
{`                  ┌──────────────────────────────────────────┐
                  │      SecureCurtain Cockpit & GUI         │
                  │  (Octopi Package Mgr / Live Forensics)   │
                  └────────────────────┬─────────────────────┘
                                       │
            ┌──────────────────────────┴──────────────────────────┐
            ▼                                                     ▼
┌───────────────────────────────┐             ┌───────────────────────────────┐
│     Linux / POSIX Subsystem   │             │   Windows / Win32 Subsystem   │
│   (pacman, yay/AUR, apt, ELF) │             │ (PE32+, Registry, PowerShell) │
└───────────────┬───────────────┘             └───────────────┬───────────────┘
                │                                             │
                └──────────────────────┬──────────────────────┘
                                       │ System Call Virtualization
                                       ▼
                 ┌───────────────────────────────────────────┐
                 │     Origin-Lock Package Safety Shield     │
                 │   (Prevents glibc / soname corruption)    │
                 └─────────────────────┬─────────────────────┘
                                       │
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                       SecureCurtain Microkernel Core                        │
│    • Hardware Fault Isolation     • Autonomous Watchdog (<15ms recovery)    │
│    • Userspace Drivers (VirtIO)   • Zero-Telemetry Memory Scrubbing         │
└─────────────────────────────────────────────────────────────────────────────┘`}
                </pre>
              </div>

              {/* Core Pillars */}
              <div className="space-y-4">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-emerald-400" />
                  <span>Why Choose SecureCurtain OS?</span>
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2">
                    <div className="font-bold text-emerald-400 text-sm flex items-center gap-1.5">
                      <Cpu className="w-4 h-4" />
                      1. Crash-Proof Microkernel & Auto-Recovery
                    </div>
                    <p className="text-slate-300 leading-relaxed">
                      Drivers and network engines execute in isolated userspace memory domains (Ring 3). If a driver faults, our supervisor restarts the driver in <strong>under 15 milliseconds</strong> without dropping apps or causing a Blue Screen/Kernel Panic.
                    </p>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2">
                    <div className="font-bold text-purple-400 text-sm flex items-center gap-1.5">
                      <Terminal className="w-4 h-4" />
                      2. True Dual-Persona (Linux + Windows)
                    </div>
                    <p className="text-slate-300 leading-relaxed">
                      Run <code className="text-purple-300">bash</code>, <code className="text-purple-300">nmap</code>, and <code className="text-purple-300">gdb</code> alongside Windows PE32+ binaries, Sysinternals, and PowerShell tools with 420+ unified shell commands on a single desktop.
                    </p>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2">
                    <div className="font-bold text-cyan-400 text-sm flex items-center gap-1.5">
                      <Globe className="w-4 h-4" />
                      3. Octopi Package Center & Origin-Lock
                    </div>
                    <p className="text-slate-300 leading-relaxed">
                      Point-and-click mirror configuration without editing config files. Origin-Lock ensures <code className="text-cyan-300">pacman</code>, <code className="text-cyan-300">yay</code>, and <code className="text-cyan-300">apt</code> never cross-mutate or overwrite each other's <code className="text-cyan-300">glibc</code> or shared libraries.
                    </p>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2">
                    <div className="font-bold text-rose-400 text-sm flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4" />
                      4. Triage Rescue USB with Updateable AV
                    </div>
                    <p className="text-slate-300 leading-relaxed">
                      Update anti-malware signatures on your Live Rescue USB without re-burning an ISO. Features an offline Windows registry hive scanner for detecting hidden services and hijacked <code className="text-rose-300">explorer.exe</code> persistence.
                    </p>
                  </div>
                </div>
              </div>

              {/* Comparison Matrix */}
              <div className="space-y-3">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
                  Feature Comparison Matrix
                </h3>
                <div className="border border-slate-800 rounded-xl overflow-hidden text-xs">
                  <table className="w-full text-left font-mono">
                    <thead className="bg-slate-950 border-b border-slate-800 text-slate-400 text-[11px]">
                      <tr>
                        <th className="py-2.5 px-3">Feature</th>
                        <th className="py-2.5 px-3 text-purple-400">SecureCurtain OS</th>
                        <th className="py-2.5 px-3 text-slate-400">Standard Linux</th>
                        <th className="py-2.5 px-3 text-slate-400">Windows 11</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 bg-slate-900/40">
                      <tr>
                        <td className="py-2 px-3 font-semibold text-white">Kernel Architecture</td>
                        <td className="py-2 px-3 text-emerald-400 font-bold">Fault-Isolated Microkernel</td>
                        <td className="py-2 px-3 text-slate-400">Monolithic</td>
                        <td className="py-2 px-3 text-slate-400">Monolithic Hybrid</td>
                      </tr>
                      <tr>
                        <td className="py-2 px-3 font-semibold text-white">Driver Crash Impact</td>
                        <td className="py-2 px-3 text-emerald-400 font-bold">&lt; 15ms Auto-Restart</td>
                        <td className="py-2 px-3 text-rose-400">Kernel Panic</td>
                        <td className="py-2 px-3 text-rose-400">Blue Screen (BSOD)</td>
                      </tr>
                      <tr>
                        <td className="py-2 px-3 font-semibold text-white">Linux + Win32 Native</td>
                        <td className="py-2 px-3 text-emerald-400 font-bold">Native Co-existence</td>
                        <td className="py-2 px-3 text-slate-400">Wine / Emulation</td>
                        <td className="py-2 px-3 text-slate-400">WSL2 Hyper-V VM</td>
                      </tr>
                      <tr>
                        <td className="py-2 px-3 font-semibold text-white">Package Safety</td>
                        <td className="py-2 px-3 text-emerald-400 font-bold">Origin-Lock Shield</td>
                        <td className="py-2 px-3 text-amber-400">Distro Locked</td>
                        <td className="py-2 px-3 text-slate-400">Uncoordinated Installers</td>
                      </tr>
                      <tr>
                        <td className="py-2 px-3 font-semibold text-white">Telemetry & Beacons</td>
                        <td className="py-2 px-3 text-emerald-400 font-bold">100% Zero Telemetry</td>
                        <td className="py-2 px-3 text-slate-400">Variable (Distro)</td>
                        <td className="py-2 px-3 text-rose-400">Extensive Diagnostics</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Hardware Requirements Section */}
              <div className="space-y-3">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono flex items-center gap-2">
                  <Cpu className="w-4 h-4 text-purple-400" />
                  <span>Hardware Requirements (Strictly Enforced)</span>
                </h3>

                <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-start gap-2.5">
                  <div className="font-bold shrink-0 mt-0.5">⚠️ INSTALLER HARD GATE:</div>
                  <div className="leading-relaxed">
                    SecureCurtain OS enforces hardware verification during the pre-boot installation environment. Systems with less than <strong>16 GB of physical RAM</strong> or processors below <strong>AMD 1st Gen Ryzen / equivalent Intel Core</strong> will <strong>refuse to install</strong>.
                  </div>
                </div>

                <div className="border border-slate-800 rounded-xl overflow-hidden text-xs">
                  <table className="w-full text-left font-mono">
                    <thead className="bg-slate-950 border-b border-slate-800 text-slate-400 text-[11px]">
                      <tr>
                        <th className="py-2.5 px-3">Component</th>
                        <th className="py-2.5 px-3 text-amber-400">Minimum Baseline (Enforced)</th>
                        <th className="py-2.5 px-3 text-emerald-400">Recommended Spec</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 bg-slate-900/40 text-[11px]">
                      <tr>
                        <td className="py-2 px-3 font-semibold text-white">Processor (CPU)</td>
                        <td className="py-2 px-3 text-amber-300 font-medium">AMD 1st Gen Ryzen (Zen 14nm) or Equivalent Intel Core (7th/8th Gen+)</td>
                        <td className="py-2 px-3 text-slate-300">AMD Ryzen 7/9 (Zen 3/4/5) or Intel Core i7/i9 (11th Gen+)</td>
                      </tr>
                      <tr>
                        <td className="py-2 px-3 font-semibold text-white">Memory (RAM)</td>
                        <td className="py-2 px-3 text-amber-300 font-bold">16 GB RAM (Hard Gate - installer halts if &lt; 16 GB)</td>
                        <td className="py-2 px-3 text-emerald-400 font-medium">32 GB – 64 GB+ High-Speed RAM</td>
                      </tr>
                      <tr>
                        <td className="py-2 px-3 font-semibold text-white">Storage</td>
                        <td className="py-2 px-3 text-slate-300">64 GB SSD or 32 GB+ USB 3.2 Live Rescue</td>
                        <td className="py-2 px-3 text-slate-300">256 GB+ NVMe PCIe Gen 4 SSD</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: RAW MARKDOWN SOURCE */}
          {activeTab === 'raw' && (
            <div className="space-y-3 font-mono text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Exact contents of /README.md:</span>
                <button
                  onClick={handleCopy}
                  className="text-xs text-purple-400 hover:text-purple-300 flex items-center gap-1 font-semibold"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copied!' : 'Copy to Clipboard'}</span>
                </button>
              </div>

              <textarea
                readOnly
                value={LANDING_PAGE_MARKDOWN}
                rows={25}
                className="w-full p-4 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 font-mono text-xs focus:border-purple-500 outline-none select-all"
                onClick={e => (e.target as HTMLTextAreaElement).select()}
              />
            </div>
          )}

          {/* TAB 3: GITHUB PUBLISHING GUIDE */}
          {activeTab === 'guide' && (
            <div className="max-w-3xl mx-auto space-y-6 text-xs font-mono">
              <div className="p-4 rounded-xl bg-purple-950/40 border border-purple-500/40 space-y-2">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <FolderGit2 className="w-4 h-4 text-purple-400" />
                  <span>How to Place this on GitHub</span>
                </h3>
                <p className="text-slate-300 text-xs leading-relaxed font-sans">
                  GitHub automatically renders whatever is inside <code className="text-purple-300 font-mono">README.md</code> at the root of your repository as the main landing page. Here are two easy ways to publish it:
                </p>
              </div>

              {/* Method A */}
              <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-3">
                <div className="text-white font-bold text-xs uppercase flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded bg-purple-600 text-white text-[10px]">Method 1</span>
                  <span>Direct Web Browser (No Git CLI required)</span>
                </div>
                <ol className="list-decimal list-inside space-y-2 text-slate-300 leading-relaxed font-sans">
                  <li>Click the <strong>"Copy Markdown"</strong> button in the top right of this modal.</li>
                  <li>Go to your GitHub repository in your browser (e.g. <code className="text-purple-300 font-mono">https://github.com/SecureCurtain/securecurtainos</code>).</li>
                  <li>Click <strong>Add file</strong> → <strong>Create new file</strong> (or click the pencil edit icon on an existing <code className="text-purple-300 font-mono">README.md</code>).</li>
                  <li>Set the file name to <code className="text-purple-300 font-mono">README.md</code>.</li>
                  <li>Paste the copied markdown into the editor.</li>
                  <li>Click <strong>Commit changes...</strong> at the bottom! Your landing page is live instantly.</li>
                </ol>
              </div>

              {/* Method B */}
              <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-3">
                <div className="text-white font-bold text-xs uppercase flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded bg-emerald-600 text-white text-[10px]">Method 2</span>
                  <span>Git CLI / Terminal (Already Saved in Repo)</span>
                </div>
                <p className="text-slate-300 font-sans">
                  Since the file is already created as <code className="text-purple-300 font-mono">/README.md</code> in this workspace, simply commit and push:
                </p>
                <pre className="p-3 rounded-lg bg-slate-950 border border-slate-800 text-emerald-400 overflow-x-auto">
{`git remote set-url origin https://github.com/SecureCurtain/securecurtainos.git
git add README.md docs/LANDING_PAGE.md
git commit -m "docs: Update hardware requirements and landing page for SecureCurtain/securecurtainos"
git push origin main`}
                </pre>
              </div>
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 border-t border-slate-800 bg-[#161a23] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-mono">
          <div className="flex items-center gap-2 text-slate-400">
            <Check className="w-4 h-4 text-emerald-400" />
            <span>Files written to: <code className="text-purple-300">/README.md</code> and <code className="text-purple-300">/docs/LANDING_PAGE.md</code></span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="px-4 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-semibold transition-all flex items-center gap-1.5 shadow-md shadow-purple-600/30"
            >
              <Copy className="w-3.5 h-3.5" />
              <span>{copied ? 'Copied!' : 'Copy to Clipboard'}</span>
            </button>
            <button
              onClick={onClose}
              className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold transition-all"
            >
              Close
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
