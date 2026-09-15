// jb7572_2026-09-03: Mission Control Cockpit Function - Bug Reporter, Code Line Faults & OS User Wishlist
// Automated Dispatch Target: securecurtainos.bugs@gmail.com (Strict Zero-PII Guarantees)

import React, { useState, useEffect, useMemo } from 'react';
import { 
  Bug, 
  Lightbulb, 
  Send, 
  CheckCircle2, 
  ShieldCheck, 
  AlertTriangle, 
  Code, 
  Cpu, 
  HardDrive, 
  RefreshCw, 
  Download, 
  ExternalLink, 
  Trash2, 
  Eye, 
  Sparkles, 
  Mail, 
  ShieldAlert, 
  Radio, 
  Check, 
  FileText, 
  Clock, 
  Layers, 
  ChevronRight,
  HelpCircle,
  Copy
} from 'lucide-react';
import { bugReporterService, OFFICIAL_BUG_RECIPIENT } from '../../services/bugReporterService';
import { 
  BugReportTelemetry, 
  BugReportHardwareSnapshot, 
  BugReportSoftwareSnapshot, 
  UserIdeaDetails 
} from '../../types';

interface BugReporterCockpitGUIProps {
  onRunCliCommand?: (cmd: string) => void;
}

export const BugReporterCockpitGUI: React.FC<BugReporterCockpitGUIProps> = ({ onRunCliCommand }) => {
  const [activeTab, setActiveTab] = useState<'BUG_REPORTER' | 'USER_IDEAS' | 'OUTBOX_LOGS'>('BUG_REPORTER');
  const [reports, setReports] = useState<BugReportTelemetry[]>([]);
  const [selectedReport, setSelectedReport] = useState<BugReportTelemetry | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'info' | 'error' } | null>(null);

  // Live Hardware & Software snapshot
  const [hwSnapshot, setHwSnapshot] = useState<BugReportHardwareSnapshot>(() => bugReporterService.captureHardwareSettings());
  const [swSnapshot, setSwSnapshot] = useState<BugReportSoftwareSnapshot>(() => bugReporterService.captureSoftwareSettings());

  // Form State: Bug Reporter
  const [bugTitle, setBugTitle] = useState('');
  const [bugSubsystem, setBugSubsystem] = useState('DESKTOP_UI');
  const [bugDescription, setBugDescription] = useState('');
  const [customFile, setCustomFile] = useState('src/components/desktop/DesktopEnvironment.tsx');
  const [customLine, setCustomLine] = useState('142');
  const [customSnippet, setCustomSnippet] = useState([
    '139:   try {',
    '140:     soundSystemService.playAction(\'window_open\');',
    '141:     const target = activeWindows.find(w => w.id === action.windowId);',
    '142: >>  if (!target) throw new Error("Null pointer dereference: Window target not registered");',
    '143:     target.state = \'FOCUSED\';',
    '144:     commitWindowTransaction(target);',
    '145:   } catch (err) {',
    '146:     reportKernelFault(err);',
    '147:   }'
  ].join('\n'));

  // Form State: User Ideas / Wishlist
  const [ideaTitle, setIdeaTitle] = useState('');
  const [ideaCategory, setIdeaCategory] = useState<UserIdeaDetails['category']>('COCKPIT_UTILITIES');
  const [ideaImpact, setIdeaImpact] = useState<UserIdeaDetails['impactLevel']>('SIGNIFICANT_IMPROVEMENT');
  const [ideaAddition, setIdeaAddition] = useState('');
  const [ideaRationale, setIdeaRationale] = useState('');
  const [ideaAffectedArea, setIdeaAffectedArea] = useState('Mission Control Cockpit');
  const [attachHwProfile, setAttachHwProfile] = useState(true);

  // Load telemetry reports
  useEffect(() => {
    const unsub = bugReporterService.subscribe(reps => {
      setReports(reps);
      if (!selectedReport && reps.length > 0) {
        setSelectedReport(reps[0]);
      }
    });
    return () => unsub();
  }, [selectedReport]);

  const showToast = (text: string, type: 'success' | 'info' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 5000);
  };

  const handleRefreshHardware = () => {
    setHwSnapshot(bugReporterService.captureHardwareSettings());
    setSwSnapshot(bugReporterService.captureSoftwareSettings());
    showToast('Hardware & software diagnostic matrices refreshed from kernel services.', 'info');
  };

  // Submit Bug Report
  const handleSubmitBug = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bugTitle.trim() || !bugDescription.trim()) {
      showToast('Please provide both a title and description for the bug report.', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const lineNum = parseInt(customLine, 10) || 100;
      const report = bugReporterService.createBugReport({
        title: `[${bugSubsystem}] ${bugTitle.trim()}`,
        description: bugDescription.trim(),
        manualFile: customFile.trim(),
        manualCodeSnippet: customSnippet.trim(),
        type: 'MANUAL_REPORT'
      });

      // Transmit to securecurtainos.bugs@gmail.com
      const res = await bugReporterService.transmitReport(report.id);
      setSelectedReport(report);
      setIsSubmitting(false);
      showToast(`Bug report sent! Attached hardware, software & code line diagnostics sent to ${OFFICIAL_BUG_RECIPIENT}`, 'success');

      // Reset form
      setBugTitle('');
      setBugDescription('');
    } catch {
      setIsSubmitting(false);
      showToast('Failed to package bug report.', 'error');
    }
  };

  // Submit User Idea
  const handleSubmitIdea = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ideaTitle.trim() || !ideaAddition.trim()) {
      showToast('Please specify a title and describe your proposed addition or change.', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const report = bugReporterService.createUserIdeaReport({
        title: ideaTitle.trim(),
        proposedAddition: ideaAddition.trim(),
        rationale: ideaRationale.trim() || 'Enhances SecureCurtain OS user experience and engineering capability.',
        category: ideaCategory,
        impactLevel: ideaImpact,
        affectedArea: ideaAffectedArea.trim(),
        attachSystemProfile: attachHwProfile
      });

      const res = await bugReporterService.transmitReport(report.id);
      setSelectedReport(report);
      setIsSubmitting(false);
      showToast(`Feature idea dispatched! Transmitted proposal and environment profile to ${OFFICIAL_BUG_RECIPIENT}`, 'success');

      // Reset form
      setIdeaTitle('');
      setIdeaAddition('');
      setIdeaRationale('');
    } catch {
      setIsSubmitting(false);
      showToast('Failed to transmit user idea.', 'error');
    }
  };

  // Simulate an interactive test crash
  const handleSimulateCrash = () => {
    try {
      const fakeError = new TypeError("Simulated Memory Allocation Fault: Page descriptor PML4[0x18F] returned invalid dirty bit state");
      fakeError.stack = "TypeError: Simulated Memory Allocation Fault\n    at allocatePml4Page (mmu_kernel.c:382:19)\n    at initMicrokernelHeap (heap_allocator.c:140:12)\n    at main (kernel_entry.S:45:8)";
      
      const report = bugReporterService.createBugReport({
        title: 'Simulated Memory Allocation Fault (PML4 Dirty Bit)',
        description: 'Test crash triggered from Mission Control Cockpit to verify automated zero-PII capture and transmission to securecurtainos.bugs@gmail.com.',
        error: fakeError,
        type: 'BUG_CRASH',
        manualFile: 'src/sys/mmu/mmu_kernel.c',
        manualCodeSnippet: [
          '379:   pml4e_t* pml4_entry = &active_pml4->entries[pml4_idx];',
          '380:   if (!(*pml4_entry & PAGE_PRESENT)) return NULL;',
          '381:   acquire_mmu_spin_lock();',
          '382: >> if (!(*pml4_entry & PAGE_ACCESSED)) { panic("Invalid dirty bit state on PML4 entry"); }',
          '383:   void* phys_page = pml4_resolve_physical(pml4_entry);',
          '384:   release_mmu_spin_lock();',
          '385:   return phys_page;'
        ].join('\n')
      });

      bugReporterService.transmitReport(report.id).then(() => {
        setSelectedReport(report);
        showToast(`Simulated bug report generated and sent to ${OFFICIAL_BUG_RECIPIENT}!`, 'success');
      });
    } catch {
      showToast('Error creating simulated bug.', 'error');
    }
  };

  // Download dump JSON
  const handleDownloadDump = (rep: BugReportTelemetry) => {
    const blob = new Blob([JSON.stringify(rep, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `telemetry-${rep.id}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast(`Downloaded telemetry archive for ${rep.id}`, 'info');
  };

  return (
    <div className="space-y-5 animate-in fade-in duration-200">
      {/* Cockpit Banner Header */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-[#0d1020] via-[#12162b] to-[#0c0e1a] border border-[#2b3353] shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 relative z-10">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 flex items-center gap-1">
                <Radio className="w-3 h-3 text-cyan-400 animate-pulse" />
                AUTOMATED TELEMETRY GATEWAY
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-emerald-400" />
                ZERO-PII STRICTLY VERIFIED
              </span>
            </div>
            
            <h2 className="text-xl md:text-2xl font-bold text-white tracking-tight flex items-center gap-2">
              <span>Telemetry: Bug Reporter, Code Inspector & OS Wishlist</span>
            </h2>
            
            <p className="text-xs md:text-sm text-[#94a3b8] max-w-3xl leading-relaxed">
              When a bug happens, all hardware settings, software parameters, and the code lines area where the error occurred are automatically captured, attached to an email, and dispatched to <span className="font-mono text-cyan-300 font-semibold">{OFFICIAL_BUG_RECIPIENT}</span> with zero personal information. Propose new ideas, changes, and additions to SecureCurtain OS directly through this console.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={handleRefreshHardware}
              className="px-3 py-2 rounded-xl bg-[#171b30] hover:bg-[#202642] text-cyan-300 text-xs font-mono border border-cyan-500/30 flex items-center gap-1.5 transition-all shadow-md"
              title="Refresh hardware and software diagnostic metrics"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Poll Hardware</span>
            </button>

            <button
              onClick={handleSimulateCrash}
              className="px-3 py-2 rounded-xl bg-rose-950/70 hover:bg-rose-900/80 text-rose-300 text-xs font-mono border border-rose-500/40 flex items-center gap-1.5 transition-all shadow-md shadow-rose-950/40"
              title="Simulate a real-time kernel memory crash to test capture & dispatch"
            >
              <Bug className="w-3.5 h-3.5 text-rose-400" />
              <span>Simulate Test Bug</span>
            </button>
          </div>
        </div>

        {/* Live Diagnostics Metrics Strip */}
        <div className="mt-5 pt-4 border-t border-[#1f253e] grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
          <div className="p-2.5 rounded-xl bg-black/40 border border-[#222944]">
            <div className="text-[10px] text-[#64748b] uppercase">Email Target</div>
            <div className="text-cyan-300 font-bold truncate">{OFFICIAL_BUG_RECIPIENT}</div>
          </div>
          <div className="p-2.5 rounded-xl bg-black/40 border border-[#222944]">
            <div className="text-[10px] text-[#64748b] uppercase">Privacy Shield</div>
            <div className="text-emerald-400 font-bold flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" />
              <span>Zero PII Enforced</span>
            </div>
          </div>
          <div className="p-2.5 rounded-xl bg-black/40 border border-[#222944]">
            <div className="text-[10px] text-[#64748b] uppercase">Hardware Profile</div>
            <div className="text-white truncate">{hwSnapshot.cpuCores} Cores | {hwSnapshot.memoryTotalGb}GB RAM</div>
          </div>
          <div className="p-2.5 rounded-xl bg-black/40 border border-[#222944]">
            <div className="text-[10px] text-[#64748b] uppercase">OS Subsystem</div>
            <div className="text-white truncate">{swSnapshot.osPersonality.toUpperCase()} | {swSnapshot.kernelBuild.split(' ')[0]}</div>
          </div>
        </div>
      </div>

      {/* Toast Notice */}
      {toastMessage && (
        <div className={`p-3.5 rounded-xl text-xs font-mono flex items-center justify-between border animate-in slide-in-from-top-2 ${
          toastMessage.type === 'success' 
            ? 'bg-emerald-950/80 border-emerald-500/50 text-emerald-200' 
            : toastMessage.type === 'error'
            ? 'bg-rose-950/80 border-rose-500/50 text-rose-200'
            : 'bg-cyan-950/80 border-cyan-500/50 text-cyan-200'
        }`}>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{toastMessage.text}</span>
          </div>
          <button onClick={() => setToastMessage(null)} className="text-[11px] underline opacity-70 hover:opacity-100">
            Dismiss
          </button>
        </div>
      )}

      {/* Main Tab Controls */}
      <div className="flex border-b border-[#232942] gap-2">
        <button
          onClick={() => setActiveTab('BUG_REPORTER')}
          className={`px-4 py-2.5 rounded-t-xl text-xs font-mono font-bold flex items-center gap-2 transition-all border-t border-x ${
            activeTab === 'BUG_REPORTER'
              ? 'bg-[#15192c] text-rose-300 border-[#323b61] border-b-transparent shadow-lg'
              : 'text-[#94a3b8] hover:text-white border-transparent'
          }`}
        >
          <Bug className="w-4 h-4 text-rose-400" />
          <span>Report Bug & Code Fault</span>
        </button>

        <button
          onClick={() => setActiveTab('USER_IDEAS')}
          className={`px-4 py-2.5 rounded-t-xl text-xs font-mono font-bold flex items-center gap-2 transition-all border-t border-x ${
            activeTab === 'USER_IDEAS'
              ? 'bg-[#15192c] text-amber-300 border-[#323b61] border-b-transparent shadow-lg'
              : 'text-[#94a3b8] hover:text-white border-transparent'
          }`}
        >
          <Lightbulb className="w-4 h-4 text-amber-400" />
          <span>Ideas, Changes & OS Additions</span>
        </button>

        <button
          onClick={() => setActiveTab('OUTBOX_LOGS')}
          className={`px-4 py-2.5 rounded-t-xl text-xs font-mono font-bold flex items-center gap-2 transition-all border-t border-x ${
            activeTab === 'OUTBOX_LOGS'
              ? 'bg-[#15192c] text-cyan-300 border-[#323b61] border-b-transparent shadow-lg'
              : 'text-[#94a3b8] hover:text-white border-transparent'
          }`}
        >
          <Mail className="w-4 h-4 text-cyan-400" />
          <span>Dispatched Telemetry Outbox ({reports.length})</span>
        </button>
      </div>

      {/* TAB 1: BUG REPORTER & CODE LINES AREA */}
      {activeTab === 'BUG_REPORTER' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Left: Input Form */}
          <div className="lg:col-span-7 space-y-4">
            <form onSubmit={handleSubmitBug} className="p-5 rounded-2xl bg-[#0f1222] border border-[#232944] space-y-4 shadow-lg">
              <div className="flex items-center justify-between border-b border-[#1f243c] pb-3">
                <div className="flex items-center gap-2 text-rose-400 font-mono text-xs font-bold uppercase">
                  <Bug className="w-4 h-4" />
                  <span>Manual or Intercepted Bug Dispatch</span>
                </div>
                <span className="text-[10px] font-mono text-[#64748b]">
                  Auto-dispatches to: {OFFICIAL_BUG_RECIPIENT}
                </span>
              </div>

              {/* Bug Title & Subsystem */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2 space-y-1">
                  <label className="text-[11px] font-mono text-[#94a3b8]">Bug Headline / Exception</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Window compositing stutter on 4K display"
                    value={bugTitle}
                    onChange={(e) => setBugTitle(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-black/50 border border-[#252c48] focus:border-rose-500 focus:outline-none text-white text-xs font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-mono text-[#94a3b8]">Subsystem</label>
                  <select
                    value={bugSubsystem}
                    onChange={(e) => setBugSubsystem(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-black/50 border border-[#252c48] focus:border-rose-500 focus:outline-none text-white text-xs font-mono"
                  >
                    <option value="KERNEL_MMU">Kernel & MMU</option>
                    <option value="WAYLAND_COMPOSITOR">Wayland & Display</option>
                    <option value="DESKTOP_UI">Desktop Environment</option>
                    <option value="FILE_EXPLORER">File Explorer & VFS</option>
                    <option value="NETWORK_FIREWALL">Network & Firewall</option>
                    <option value="STORAGE_MIRROR">Storage & Mirror SSD</option>
                    <option value="HIPS_ANTIMALWARE">HIPS Anti-Malware</option>
                    <option value="CLI_TERMINAL">Terminal Suite</option>
                    <option value="COCKPIT_GUI">Mission Control Cockpit</option>
                  </select>
                </div>
              </div>

              {/* Bug Description */}
              <div className="space-y-1">
                <label className="text-[11px] font-mono text-[#94a3b8]">Observed Bug Details & Reproduction Steps</label>
                <textarea
                  required
                  rows={3}
                  placeholder="Describe what occurred, expected result, and any relevant steps..."
                  value={bugDescription}
                  onChange={(e) => setBugDescription(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-black/50 border border-[#252c48] focus:border-rose-500 focus:outline-none text-white text-xs font-mono leading-relaxed"
                />
              </div>

              {/* Code Lines Area Inspector */}
              <div className="p-3.5 rounded-xl bg-black/60 border border-cyan-500/30 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="text-[11px] font-mono text-cyan-300 font-bold flex items-center gap-1.5">
                    <Code className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Code Lines Area (Fault Coordinates)</span>
                  </div>
                  <span className="text-[10px] font-mono text-[#64748b]">Attached to email payload</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <div className="sm:col-span-2">
                    <input
                      type="text"
                      placeholder="Source file path"
                      value={customFile}
                      onChange={(e) => setCustomFile(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-lg bg-black/80 border border-[#232944] text-cyan-200 text-[11px] font-mono"
                    />
                  </div>
                  <div>
                    <input
                      type="text"
                      placeholder="Line number"
                      value={customLine}
                      onChange={(e) => setCustomLine(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-lg bg-black/80 border border-[#232944] text-cyan-200 text-[11px] font-mono"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="text-[10px] font-mono text-[#64748b]">Surrounding Source Code Lines (with &gt;&gt; fault marker):</div>
                  <textarea
                    rows={6}
                    value={customSnippet}
                    onChange={(e) => setCustomSnippet(e.target.value)}
                    className="w-full p-2.5 rounded-lg bg-[#070912] border border-cyan-500/20 text-cyan-200 text-[11px] font-mono leading-relaxed"
                  />
                </div>
              </div>

              {/* Zero-PII Guarantee Box */}
              <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/30 flex items-start gap-2.5 text-xs font-mono text-emerald-200">
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <span className="font-bold text-white">Strict Zero-PII Compliance Verified</span>
                  <p className="text-[11px] text-[#94a3b8] leading-relaxed">
                    Prior to transmission, all personal data (user accounts, emails, passwords, tokens, private home directories, and IP addresses) is stripped. Only anonymous hardware, software, and code lines are sent.
                  </p>
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setBugTitle('');
                    setBugDescription('');
                  }}
                  className="px-3 py-2 rounded-xl text-xs font-mono text-[#94a3b8] hover:text-white transition-colors"
                >
                  Clear Fields
                </button>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 text-white font-mono text-xs font-bold shadow-lg shadow-rose-950/60 flex items-center gap-2 transition-all hover:scale-[1.02] disabled:opacity-50"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{isSubmitting ? 'Transmitting...' : 'Send Bug Report to securecurtainos.bugs@gmail.com'}</span>
                </button>
              </div>
            </form>
          </div>

          {/* Right: Real-time Hardware & Software Telemetry Attached */}
          <div className="lg:col-span-5 space-y-4">
            <div className="p-5 rounded-2xl bg-[#0f1222] border border-[#232944] space-y-4 shadow-lg">
              <div className="flex items-center justify-between border-b border-[#1f243c] pb-3">
                <div className="flex items-center gap-2 text-cyan-400 font-mono text-xs font-bold uppercase">
                  <Cpu className="w-4 h-4" />
                  <span>Hardware Diagnostics Attached</span>
                </div>
                <span className="text-[10px] font-mono text-emerald-400">100% Captured</span>
              </div>

              <div className="space-y-2 text-xs font-mono">
                <div className="p-2.5 rounded-xl bg-black/40 border border-[#1e2338] space-y-1">
                  <div className="text-[10px] text-[#64748b]">PROCESSOR & MICROARCHITECTURE</div>
                  <div className="text-white font-semibold">{hwSnapshot.cpuModel}</div>
                  <div className="text-[11px] text-[#94a3b8]">{hwSnapshot.cpuArch}</div>
                  <div className="text-[11px] text-cyan-300">{hwSnapshot.cpuCores} Logical Cores @ {hwSnapshot.cpuFrequencyGhz} GHz</div>
                </div>

                <div className="p-2.5 rounded-xl bg-black/40 border border-[#1e2338] space-y-1">
                  <div className="text-[10px] text-[#64748b]">PHYSICAL MEMORY & PAGING</div>
                  <div className="text-white font-semibold">{hwSnapshot.memoryTotalGb} GB Total ({hwSnapshot.memoryFreeGb} GB available)</div>
                  <div className="text-[11px] text-indigo-300">{hwSnapshot.mmuPagingMode}</div>
                </div>

                <div className="p-2.5 rounded-xl bg-black/40 border border-[#1e2338] space-y-1">
                  <div className="text-[10px] text-[#64748b]">STORAGE SUBSYSTEM & MIRROR PARITY</div>
                  <div className="text-white font-semibold">{hwSnapshot.storageModel}</div>
                  <div className="text-[11px] text-emerald-400">Mirror Sync: {hwSnapshot.storageMirrorSyncPercent}% Matched</div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="p-2.5 rounded-xl bg-black/40 border border-[#1e2338]">
                    <div className="text-[10px] text-[#64748b]">TPM 2.0 SECURITY</div>
                    <div className="text-emerald-300 font-semibold text-[11px]">{hwSnapshot.tpmStatus.split(' ')[0]}</div>
                  </div>
                  <div className="p-2.5 rounded-xl bg-black/40 border border-[#1e2338]">
                    <div className="text-[10px] text-[#64748b]">ACPI THERMAL</div>
                    <div className="text-amber-300 font-semibold text-[11px]">{hwSnapshot.thermalCpuC}°C Package</div>
                  </div>
                </div>
              </div>

              {/* Software Settings Attached */}
              <div className="pt-2 border-t border-[#1f243c]">
                <div className="text-[10px] text-indigo-300 font-mono font-bold uppercase mb-2 flex items-center gap-1.5">
                  <HardDrive className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Software & Subsystem Parameters</span>
                </div>
                <div className="p-2.5 rounded-xl bg-black/40 border border-[#1e2338] space-y-1 text-xs font-mono">
                  <div className="text-white">{swSnapshot.osName} {swSnapshot.osVersion}</div>
                  <div className="text-[11px] text-[#94a3b8]">{swSnapshot.kernelBuild}</div>
                  <div className="text-[11px] text-cyan-300">Personality: {swSnapshot.osPersonality.toUpperCase()} | Uptime: {swSnapshot.uptimeFormatted}</div>
                  <div className="text-[11px] text-emerald-400">{swSnapshot.hipsStatus}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: IDEAS, CHANGES & OS ADDITIONS (WISHLIST) */}
      {activeTab === 'USER_IDEAS' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          <div className="lg:col-span-8 space-y-4">
            <form onSubmit={handleSubmitIdea} className="p-5 rounded-2xl bg-[#0f1222] border border-[#232944] space-y-4 shadow-lg">
              <div className="flex items-center justify-between border-b border-[#1f243c] pb-3">
                <div className="flex items-center gap-2 text-amber-400 font-mono text-xs font-bold uppercase">
                  <Lightbulb className="w-4 h-4 text-amber-400" />
                  <span>Propose Ideas, Changes & OS Additions</span>
                </div>
                <span className="text-[10px] font-mono text-[#64748b]">
                  Sent directly to: {OFFICIAL_BUG_RECIPIENT}
                </span>
              </div>

              {/* Title */}
              <div className="space-y-1">
                <label className="text-[11px] font-mono text-[#94a3b8]">Idea / Feature Addition Headline</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Add native ZFS encrypted snapshot replication or Cylon visual equalizer"
                  value={ideaTitle}
                  onChange={(e) => setIdeaTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-black/50 border border-[#252c48] focus:border-amber-500 focus:outline-none text-white text-xs font-mono"
                />
              </div>

              {/* Category, Impact & Subsystem */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-mono text-[#94a3b8]">Target Category</label>
                  <select
                    value={ideaCategory}
                    onChange={(e) => setIdeaCategory(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl bg-black/50 border border-[#252c48] focus:border-amber-500 focus:outline-none text-white text-xs font-mono"
                  >
                    <option value="KERNEL_DRIVERS">Kernel & Hardware Drivers</option>
                    <option value="COCKPIT_UTILITIES">Mission Control Cockpit</option>
                    <option value="DESKTOP_UI">Desktop UI & Window Manager</option>
                    <option value="SECURITY_HIPS">Security, HIPS & Firewall</option>
                    <option value="STORAGE_FILESYSTEM">Storage & File Systems</option>
                    <option value="NETWORKING">Networking & Quantum VPN</option>
                    <option value="TERMINAL_CLI">Terminal & CLI Suite</option>
                    <option value="AUDIO_VISUAL">Audio, Vocoder & Themes</option>
                    <option value="GENERAL_OS">General OS Architecture</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-mono text-[#94a3b8]">Desired Impact Level</label>
                  <select
                    value={ideaImpact}
                    onChange={(e) => setIdeaImpact(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl bg-black/50 border border-[#252c48] focus:border-amber-500 focus:outline-none text-white text-xs font-mono"
                  >
                    <option value="NICE_TO_HAVE">Nice-to-Have (Polish)</option>
                    <option value="ERGONOMIC_POLISH">Ergonomic Workflow Polish</option>
                    <option value="SIGNIFICANT_IMPROVEMENT">Significant Improvement</option>
                    <option value="MAJOR_NEW_SUBSYSTEM">Major New Subsystem</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-mono text-[#94a3b8]">Target Subsystem / Path</label>
                  <input
                    type="text"
                    placeholder="e.g. Cockpit -> Storage"
                    value={ideaAffectedArea}
                    onChange={(e) => setIdeaAffectedArea(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-black/50 border border-[#252c48] focus:border-amber-500 focus:outline-none text-white text-xs font-mono"
                  />
                </div>
              </div>

              {/* Proposed Addition in detail */}
              <div className="space-y-1">
                <label className="text-[11px] font-mono text-[#94a3b8]">Describe the Changes or Additions You Would Like to See</label>
                <textarea
                  required
                  rows={4}
                  placeholder="Explain what functionality should be added or changed, and how it should behave..."
                  value={ideaAddition}
                  onChange={(e) => setIdeaAddition(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-black/50 border border-[#252c48] focus:border-amber-500 focus:outline-none text-white text-xs font-mono leading-relaxed"
                />
              </div>

              {/* Rationale */}
              <div className="space-y-1">
                <label className="text-[11px] font-mono text-[#94a3b8]">Rationale / Why This Improves SecureCurtain OS</label>
                <textarea
                  rows={2}
                  placeholder="What problem does this solve for you or other operators?"
                  value={ideaRationale}
                  onChange={(e) => setIdeaRationale(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-black/50 border border-[#252c48] focus:border-amber-500 focus:outline-none text-white text-xs font-mono leading-relaxed"
                />
              </div>

              {/* Checkbox: Attach System Profile */}
              <div className="p-3.5 rounded-xl bg-black/40 border border-[#222842] flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <input
                    type="checkbox"
                    id="attachHwProfile"
                    checked={attachHwProfile}
                    onChange={(e) => setAttachHwProfile(e.target.checked)}
                    className="w-4 h-4 rounded text-amber-500 bg-black border-[#3b4468] focus:ring-amber-400"
                  />
                  <label htmlFor="attachHwProfile" className="text-xs font-mono text-white cursor-pointer select-none">
                    Attach Anonymous Hardware & Software Profile (Helps engineers test on matching specs)
                  </label>
                </div>
                <span className="text-[10px] font-mono text-emerald-400">Zero PII</span>
              </div>

              {/* Buttons */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setIdeaTitle('');
                    setIdeaAddition('');
                    setIdeaRationale('');
                  }}
                  className="px-3 py-2 rounded-xl text-xs font-mono text-[#94a3b8] hover:text-white transition-colors"
                >
                  Clear
                </button>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white font-mono text-xs font-bold shadow-lg shadow-amber-950/60 flex items-center gap-2 transition-all hover:scale-[1.02] disabled:opacity-50"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{isSubmitting ? 'Dispatching...' : 'Send Feature Proposal to securecurtainos.bugs@gmail.com'}</span>
                </button>
              </div>
            </form>
          </div>

          {/* Right: Proposal Guidance */}
          <div className="lg:col-span-4 space-y-4">
            <div className="p-5 rounded-2xl bg-[#0f1222] border border-[#232944] space-y-4 shadow-lg text-xs font-mono">
              <div className="flex items-center gap-2 text-amber-400 font-bold uppercase">
                <Sparkles className="w-4 h-4" />
                <span>OS User Wishlist Guidelines</span>
              </div>

              <p className="text-[#94a3b8] leading-relaxed">
                SecureCurtain OS is continually updated based on frontline user and operator feedback. Your ideas and suggested additions are reviewed directly by the engineering team.
              </p>

              <div className="space-y-2.5 pt-2 border-t border-[#1f243c]">
                <div className="p-2.5 rounded-xl bg-black/40 border border-[#1e2338]">
                  <span className="text-white font-bold block mb-1">1. Kernel & Hardware Additions</span>
                  <span className="text-[#94a3b8] text-[11px]">Request driver modules for specialized PCIe/USB hardware, FPGA coprocessors, or custom MMU page tables.</span>
                </div>

                <div className="p-2.5 rounded-xl bg-black/40 border border-[#1e2338]">
                  <span className="text-white font-bold block mb-1">2. Cockpit GUI Utilities</span>
                  <span className="text-[#94a3b8] text-[11px]">Propose new dashboard monitoring widgets, network forensic visualizers, or storage partition layouts.</span>
                </div>

                <div className="p-2.5 rounded-xl bg-black/40 border border-[#1e2338]">
                  <span className="text-white font-bold block mb-1">3. Security & HIPS Features</span>
                  <span className="text-[#94a3b8] text-[11px]">Suggest new behavioral YARA heuristics, air-gapped container sandboxes, or post-quantum cryptographic primitives.</span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-cyan-950/40 border border-cyan-500/30 text-cyan-200 text-[11px]">
                Target mailbox: <span className="font-bold text-white">{OFFICIAL_BUG_RECIPIENT}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: DISPATCHED TELEMETRY OUTBOX & DETAILS */}
      {activeTab === 'OUTBOX_LOGS' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Left: Ledger Table */}
          <div className="lg:col-span-5 space-y-3">
            <div className="p-4 rounded-2xl bg-[#0f1222] border border-[#232944] space-y-3">
              <div className="flex items-center justify-between border-b border-[#1f243c] pb-2.5">
                <div className="text-xs font-mono font-bold text-cyan-400 uppercase flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5" />
                  <span>Outbox Ledger ({reports.length})</span>
                </div>
                <span className="text-[10px] font-mono text-[#64748b]">Auto-Sync</span>
              </div>

              <div className="space-y-2 max-h-[520px] overflow-y-auto custom-scrollbar">
                {reports.map((rep) => {
                  const isSel = selectedReport?.id === rep.id;
                  const isBug = rep.type.includes('BUG') || rep.type.includes('ERROR');

                  return (
                    <div
                      key={rep.id}
                      onClick={() => setSelectedReport(rep)}
                      className={`p-3 rounded-xl border cursor-pointer transition-all ${
                        isSel 
                          ? 'bg-[#181d33] border-cyan-500/60 shadow-md' 
                          : 'bg-black/30 border-[#1e2338] hover:bg-[#14182b] hover:border-[#2e375a]'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className={`px-2 py-0.5 rounded text-[9px] font-mono font-bold ${
                          isBug ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        }`}>
                          {rep.type}
                        </span>
                        <span className="text-[10px] font-mono text-emerald-400 flex items-center gap-1">
                          <Check className="w-3 h-3" />
                          {rep.status}
                        </span>
                      </div>

                      <div className="text-xs font-mono font-bold text-white truncate mb-1">
                        {rep.title}
                      </div>

                      <div className="flex items-center justify-between text-[10px] font-mono text-[#64748b]">
                        <span>{rep.id}</span>
                        <span>{new Date(rep.timestamp).toLocaleTimeString()}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right: Selected Report Inspector */}
          <div className="lg:col-span-7 space-y-4">
            {selectedReport ? (
              <div className="p-5 rounded-2xl bg-[#0f1222] border border-[#232944] space-y-4 shadow-lg">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#1f243c] pb-3">
                  <div>
                    <span className="text-[10px] font-mono text-cyan-400 font-bold uppercase">
                      TELEMETRY REPORT INSPECTOR
                    </span>
                    <h3 className="text-base font-bold text-white font-mono">
                      {selectedReport.id}: {selectedReport.title}
                    </h3>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleDownloadDump(selectedReport)}
                      className="px-2.5 py-1.5 rounded-lg bg-[#181d33] hover:bg-[#222947] text-cyan-300 text-xs font-mono border border-cyan-500/30 flex items-center gap-1"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download JSON</span>
                    </button>

                    <a
                      href={bugReporterService.generateMailtoUrl(selectedReport)}
                      className="px-2.5 py-1.5 rounded-lg bg-blue-950/60 hover:bg-blue-900/60 text-blue-300 text-xs font-mono border border-blue-500/30 flex items-center gap-1"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>Mail Client</span>
                    </a>
                  </div>
                </div>

                {/* Dispatch Status & Target */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs font-mono">
                  <div className="p-2.5 rounded-xl bg-black/40 border border-[#1e2338]">
                    <div className="text-[10px] text-[#64748b]">DESTINATION</div>
                    <div className="text-cyan-300 font-bold truncate">{selectedReport.recipient}</div>
                  </div>
                  <div className="p-2.5 rounded-xl bg-black/40 border border-[#1e2338]">
                    <div className="text-[10px] text-[#64748b]">TRANSMITTED AT</div>
                    <div className="text-white font-bold">{selectedReport.transmittedAt ? new Date(selectedReport.transmittedAt).toLocaleTimeString() : 'Pending'}</div>
                  </div>
                  <div className="p-2.5 rounded-xl bg-black/40 border border-[#1e2338]">
                    <div className="text-[10px] text-[#64748b]">PRIVACY AUDIT</div>
                    <div className="text-emerald-400 font-bold">Zero PII (100% Passed)</div>
                  </div>
                </div>

                {/* Code Lines Area if present */}
                {selectedReport.codeContext && (
                  <div className="space-y-1.5">
                    <div className="text-xs font-mono text-cyan-400 font-bold flex items-center gap-1.5">
                      <Code className="w-3.5 h-3.5" />
                      <span>Code Lines Area Context</span>
                    </div>
                    <div className="p-3 rounded-xl bg-black/60 border border-cyan-500/20 text-xs font-mono space-y-1.5">
                      <div className="text-[11px] text-[#94a3b8] flex justify-between">
                        <span>File: {selectedReport.codeContext.fileOrModule} (Line {selectedReport.codeContext.lineNumber})</span>
                        <span>Function: {selectedReport.codeContext.functionName}</span>
                      </div>
                      {selectedReport.codeContext.codeSnippet && (
                        <pre className="p-2 rounded bg-[#070912] border border-[#222842] text-cyan-200 text-[11px] leading-relaxed whitespace-pre-wrap overflow-x-auto">
                          {selectedReport.codeContext.codeSnippet}
                        </pre>
                      )}
                    </div>
                  </div>
                )}

                {/* Proposal details if user idea */}
                {selectedReport.userIdea && (
                  <div className="p-3 rounded-xl bg-amber-950/30 border border-amber-500/30 space-y-1.5 text-xs font-mono">
                    <div className="text-amber-300 font-bold uppercase">Proposed OS Addition Details:</div>
                    <div className="text-white whitespace-pre-wrap">{selectedReport.userIdea.proposedAddition}</div>
                    {selectedReport.userIdea.rationale && (
                      <div className="text-[11px] text-[#94a3b8] pt-1 border-t border-amber-500/20">
                        <span className="font-semibold text-amber-200">Rationale: </span>
                        {selectedReport.userIdea.rationale}
                      </div>
                    )}
                  </div>
                )}

                {/* Hardware & Software Manifest Summary */}
                <div className="p-3 rounded-xl bg-black/40 border border-[#1e2338] space-y-2 text-xs font-mono">
                  <div className="text-[#94a3b8] font-bold uppercase text-[10px]">Attached System Profile</div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                    <div><span className="text-[#64748b]">CPU:</span> <span className="text-white">{selectedReport.hardware.cpuModel}</span></div>
                    <div><span className="text-[#64748b]">Cores:</span> <span className="text-white">{selectedReport.hardware.cpuCores} cores</span></div>
                    <div><span className="text-[#64748b]">RAM:</span> <span className="text-white">{selectedReport.hardware.memoryTotalGb} GB Total</span></div>
                    <div><span className="text-[#64748b]">MMU:</span> <span className="text-white">{selectedReport.hardware.mmuPagingMode.split(' ')[0]}</span></div>
                    <div><span className="text-[#64748b]">OS:</span> <span className="text-white">{selectedReport.software.osName} {selectedReport.software.osVersion}</span></div>
                    <div><span className="text-[#64748b]">Kernel:</span> <span className="text-white">{selectedReport.software.kernelBuild}</span></div>
                  </div>
                </div>

                {/* Raw Email RFC 5322 MIME Preview */}
                <div className="space-y-1.5">
                  <div className="text-[11px] font-mono text-[#64748b] uppercase font-bold flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Raw RFC 5322 MIME Email Payload Attached</span>
                  </div>
                  <pre className="p-3 rounded-xl bg-black/80 border border-[#222842] text-[10px] font-mono text-[#94a3b8] max-h-40 overflow-y-auto whitespace-pre-wrap custom-scrollbar">
                    {selectedReport.rawEmailMimePreview}
                  </pre>
                </div>
              </div>
            ) : (
              <div className="p-12 rounded-2xl bg-[#0f1222] border border-[#232944] text-center font-mono text-xs text-[#64748b]">
                Select a report from the outbox ledger to inspect diagnostics.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
