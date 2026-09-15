import React, { ErrorInfo, ReactNode } from 'react';
import { 
  ShieldAlert, 
  RotateCcw, 
  AlertTriangle, 
  Terminal, 
  Mail, 
  CheckCircle2, 
  Cpu, 
  HardDrive, 
  Code, 
  ShieldCheck, 
  Download, 
  ExternalLink 
} from 'lucide-react';
import { bugReporterService } from '../../services/bugReporterService';
import { BugReportTelemetry } from '../../types';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  report: BugReportTelemetry | null;
  activeTab: 'CODE' | 'HARDWARE' | 'SOFTWARE' | 'PRIVACY';
  isTransmitting: boolean;
  transmittedNotice: string | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      report: null,
      activeTab: 'CODE',
      isTransmitting: false,
      transmittedNotice: null
    };
  }

  public static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('SecureCurtain Kernel Crash intercepted by ErrorBoundary:', error, errorInfo);
    
    // Automatically capture bug with hardware, software, code lines area, and zero-PII guarantee
    const report = bugReporterService.createBugReport({
      title: `${error.name || 'Kernel Exception'}: ${error.message || 'Render Pipeline Crash'}`,
      description: `Intercepted runtime crash in React render pipeline. Stack frame and component hierarchy attached.`,
      error,
      errorInfo,
      type: 'BUG_CRASH'
    });

    this.setState({ errorInfo, report, isTransmitting: true });

    // Automatically send to securecurtainos.bugs@gmail.com
    bugReporterService.transmitReport(report.id).then(res => {
      this.setState({ 
        isTransmitting: false, 
        transmittedNotice: res.message 
      });
    }).catch(() => {
      this.setState({ isTransmitting: false });
    });
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleResetState = () => {
    try {
      localStorage.removeItem('securecurtain_user_registry_v1');
      localStorage.removeItem('securecurtain_desktop_state');
    } catch {
      // ignore
    }
    window.location.reload();
  };

  private handleDownloadDump = () => {
    if (!this.state.report) return;
    const blob = new Blob([JSON.stringify(this.state.report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `crash-dump-${this.state.report.id}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  public render() {
    if (this.state.hasError) {
      const { report, activeTab, transmittedNotice } = this.state;
      const code = report?.codeContext;
      const hw = report?.hardware;
      const sw = report?.software;
      const priv = report?.privacy;

      return (
        <div className="fixed inset-0 z-[9999] bg-[#07080f] text-[#e2e8f0] flex flex-col items-center justify-center p-4 md:p-6 font-sans select-none overflow-y-auto">
          <div className="bg-[#0f111d] border border-rose-500/50 rounded-2xl md:rounded-3xl p-6 md:p-8 max-w-3xl w-full shadow-2xl shadow-rose-950/60 space-y-5 animate-in zoom-in-95 duration-200">
            
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#1f2438] pb-4">
              <div className="flex items-center gap-3.5">
                <div className="p-3 rounded-2xl bg-rose-950/80 border border-rose-500/60 text-rose-300">
                  <ShieldAlert className="w-7 h-7 animate-pulse" />
                </div>
                <div>
                  <h1 className="text-lg md:text-xl font-bold text-white flex items-center gap-2">
                    <span>Kernel Exception Intercepted</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-rose-500/20 text-rose-300 border border-rose-500/30">
                      BUG REPORTER ACTIVE
                    </span>
                  </h1>
                  <p className="text-xs text-rose-300 font-mono">
                    SECURECURTAIN DESKTOP SAFE-MODE DIAGNOSTICS & TELEMETRY
                  </p>
                </div>
              </div>

              {/* Zero-PII Badge */}
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-950/70 border border-emerald-500/40 text-emerald-300 text-xs font-mono shrink-0">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Zero PII Guaranteed</span>
              </div>
            </div>

            {/* Auto-Dispatch Notice to securecurtainos.bugs@gmail.com */}
            <div className="p-3.5 rounded-xl bg-gradient-to-r from-blue-950/70 to-indigo-950/70 border border-blue-500/40 text-xs font-mono space-y-1.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-blue-300 font-bold">
                  <Mail className="w-4 h-4 text-blue-400" />
                  <span>Automated Crash Dispatch to: securecurtainos.bugs@gmail.com</span>
                </div>
                <span className="text-[10px] text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" />
                  {report?.status === 'TRANSMITTED' ? 'TRANSMITTED' : 'DISPATCHING...'}
                </span>
              </div>
              <p className="text-[11px] text-[#94a3b8]">
                All hardware settings, software parameters, and code line fault coordinates have been captured and automatically queued to the official bug recipient with zero personal information.
              </p>
            </div>

            {/* Error Message Summary */}
            <div className="p-3 rounded-xl bg-black/60 border border-rose-900/40 font-mono text-xs text-rose-200 flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <div className="space-y-0.5 overflow-hidden">
                <span className="font-bold text-rose-300">{this.state.error?.name || 'Error'}: </span>
                <span className="text-white break-all">{this.state.error?.message || 'Unknown runtime exception'}</span>
                {code?.fileOrModule && (
                  <div className="text-[10px] text-[#94a3b8] truncate">
                    Fault Location: {code.fileOrModule}:{code.lineNumber || '0'}:{code.columnNumber || '0'}
                  </div>
                )}
              </div>
            </div>

            {/* Diagnostic Inspector Tabs */}
            <div className="space-y-2">
              <div className="flex border-b border-[#222738] gap-1 text-xs font-mono">
                <button
                  onClick={() => this.setState({ activeTab: 'CODE' })}
                  className={`px-3 py-1.5 rounded-t-lg transition-colors flex items-center gap-1.5 ${
                    activeTab === 'CODE' 
                      ? 'bg-[#1a1e30] text-cyan-300 border-b-2 border-cyan-400 font-bold' 
                      : 'text-[#94a3b8] hover:text-white'
                  }`}
                >
                  <Code className="w-3.5 h-3.5" />
                  <span>Code Lines Area</span>
                </button>

                <button
                  onClick={() => this.setState({ activeTab: 'HARDWARE' })}
                  className={`px-3 py-1.5 rounded-t-lg transition-colors flex items-center gap-1.5 ${
                    activeTab === 'HARDWARE' 
                      ? 'bg-[#1a1e30] text-cyan-300 border-b-2 border-cyan-400 font-bold' 
                      : 'text-[#94a3b8] hover:text-white'
                  }`}
                >
                  <Cpu className="w-3.5 h-3.5" />
                  <span>Hardware Settings</span>
                </button>

                <button
                  onClick={() => this.setState({ activeTab: 'SOFTWARE' })}
                  className={`px-3 py-1.5 rounded-t-lg transition-colors flex items-center gap-1.5 ${
                    activeTab === 'SOFTWARE' 
                      ? 'bg-[#1a1e30] text-cyan-300 border-b-2 border-cyan-400 font-bold' 
                      : 'text-[#94a3b8] hover:text-white'
                  }`}
                >
                  <HardDrive className="w-3.5 h-3.5" />
                  <span>Software Settings</span>
                </button>

                <button
                  onClick={() => this.setState({ activeTab: 'PRIVACY' })}
                  className={`px-3 py-1.5 rounded-t-lg transition-colors flex items-center gap-1.5 ${
                    activeTab === 'PRIVACY' 
                      ? 'bg-[#1a1e30] text-cyan-300 border-b-2 border-cyan-400 font-bold' 
                      : 'text-[#94a3b8] hover:text-white'
                  }`}
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Privacy Audit</span>
                </button>
              </div>

              {/* Tab Panel Content */}
              <div className="p-3.5 rounded-xl bg-black/50 border border-[#1e2338] font-mono text-xs max-h-48 overflow-y-auto custom-scrollbar">
                {activeTab === 'CODE' && (
                  <div className="space-y-2">
                    <div className="text-[11px] text-cyan-400 font-bold flex items-center justify-between">
                      <span>Module: {code?.fileOrModule || 'Unknown'} (Line {code?.lineNumber}:{code?.columnNumber})</span>
                      <span className="text-[#64748b]">Function: {code?.functionName || 'anonymous'}</span>
                    </div>
                    {code?.codeSnippet && (
                      <pre className="p-2.5 rounded-lg bg-[#07080f] border border-cyan-500/20 text-cyan-200 text-[11px] leading-relaxed whitespace-pre-wrap overflow-x-auto">
                        {code.codeSnippet}
                      </pre>
                    )}
                    {this.state.errorInfo?.componentStack && (
                      <div>
                        <div className="text-[10px] text-[#94a3b8] font-bold mb-1">Component Hierarchy:</div>
                        <pre className="text-[10px] text-[#64748b] whitespace-pre-wrap bg-black/40 p-2 rounded border border-[#222738]">
                          {this.state.errorInfo.componentStack}
                        </pre>
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'HARDWARE' && hw && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                    <div><span className="text-[#64748b]">CPU Model:</span> <span className="text-white">{hw.cpuModel}</span></div>
                    <div><span className="text-[#64748b]">Architecture:</span> <span className="text-white">{hw.cpuArch}</span></div>
                    <div><span className="text-[#64748b]">Logical Cores:</span> <span className="text-white">{hw.cpuCores} cores @ {hw.cpuFrequencyGhz} GHz</span></div>
                    <div><span className="text-[#64748b]">Physical RAM:</span> <span className="text-white">{hw.memoryTotalGb} GB Total ({hw.memoryUsagePercent}% utilized)</span></div>
                    <div><span className="text-[#64748b]">MMU Paging:</span> <span className="text-white">{hw.mmuPagingMode}</span></div>
                    <div><span className="text-[#64748b]">Display / GPU:</span> <span className="text-white">{hw.gpuModel}</span></div>
                    <div><span className="text-[#64748b]">Resolution:</span> <span className="text-white">{hw.screenResolution} ({hw.pixelRatio}x DPR)</span></div>
                    <div><span className="text-[#64748b]">Storage:</span> <span className="text-white">{hw.storageModel}</span></div>
                    <div><span className="text-[#64748b]">Mirror SSD Parity:</span> <span className="text-white">{hw.storageMirrorSyncPercent}% Synced</span></div>
                    <div><span className="text-[#64748b]">TPM 2.0 Security:</span> <span className="text-white">{hw.tpmVersion} - {hw.tpmStatus}</span></div>
                    <div><span className="text-[#64748b]">Thermal Sensor:</span> <span className="text-white">{hw.thermalCpuC}°C</span></div>
                    <div><span className="text-[#64748b]">Power Profile:</span> <span className="text-white">{hw.powerProfile}</span></div>
                  </div>
                )}

                {activeTab === 'SOFTWARE' && sw && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                    <div><span className="text-[#64748b]">OS Version:</span> <span className="text-white">{sw.osName} {sw.osVersion}</span></div>
                    <div><span className="text-[#64748b]">Microkernel:</span> <span className="text-white">{sw.kernelBuild}</span></div>
                    <div><span className="text-[#64748b]">Personality:</span> <span className="text-white">{sw.osPersonality.toUpperCase()}</span></div>
                    <div><span className="text-[#64748b]">Theme:</span> <span className="text-white">{sw.activeTheme}</span></div>
                    <div><span className="text-[#64748b]">Uptime:</span> <span className="text-white">{sw.uptimeFormatted}</span></div>
                    <div><span className="text-[#64748b]">HIPS Shields:</span> <span className="text-white">{sw.hipsStatus} ({sw.activeShieldsCount} armed)</span></div>
                    <div><span className="text-[#64748b]">Active Services:</span> <span className="text-white">{sw.activeServicesCount} systemd daemons</span></div>
                    <div><span className="text-[#64748b]">Background Jobs:</span> <span className="text-white">{sw.backgroundJobsCount} tasks active</span></div>
                    <div className="col-span-1 sm:col-span-2"><span className="text-[#64748b]">Browser Runtime:</span> <span className="text-[#94a3b8] break-all">{sw.browserRuntime}</span></div>
                  </div>
                )}

                {activeTab === 'PRIVACY' && priv && (
                  <div className="space-y-2 text-[11px]">
                    <div className="p-2 rounded bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 font-bold flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      <span>Zero Personal Information Verified</span>
                    </div>
                    <div className="space-y-1 text-[#94a3b8]">
                      <div>✓ All email addresses scrubbed (Target: securecurtainos.bugs@gmail.com preserved)</div>
                      <div>✓ Usernames, passwords, PINs and authentication tokens purged</div>
                      <div>✓ Local system paths (/home/user/) normalized</div>
                      <div>✓ Network IP addresses masked to anonymous subnet</div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Actions Footer */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-[#1f2438]">
              <div className="flex items-center gap-2">
                {report && (
                  <button
                    onClick={this.handleDownloadDump}
                    className="px-3 py-2 rounded-xl bg-[#181c2e] hover:bg-[#222842] text-cyan-300 text-xs font-mono border border-cyan-500/30 flex items-center gap-1.5 transition-colors"
                    title="Download raw JSON bug report"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download Dump</span>
                  </button>
                )}

                {report && (
                  <a
                    href={bugReporterService.generateMailtoUrl(report)}
                    className="px-3 py-2 rounded-xl bg-blue-950/60 hover:bg-blue-900/60 text-blue-300 text-xs font-mono border border-blue-500/30 flex items-center gap-1.5 transition-colors"
                    title="Open in your default email client as fallback"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Mail Client Fallback</span>
                  </a>
                )}
              </div>

              <div className="flex items-center gap-2.5">
                <button
                  onClick={this.handleResetState}
                  className="px-4 py-2 rounded-xl bg-[#1e2235] hover:bg-[#282d47] text-amber-300 text-xs font-semibold border border-amber-500/30 transition-all flex items-center gap-1.5"
                >
                  <Terminal className="w-3.5 h-3.5" />
                  <span>Reset Cache & Restart</span>
                </button>

                <button
                  onClick={this.handleReload}
                  className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-lg shadow-rose-950/50 transition-all flex items-center gap-1.5"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reload Session</span>
                </button>
              </div>
            </div>

          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

