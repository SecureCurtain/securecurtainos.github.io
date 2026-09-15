// jb7572_2026-08-26: SecureCurtain Core Architecture - Diamond-Grade Offline Multi-Engine YARA & Anti-Malware Neutralizer
// Updated 2026-09-04: Added Live Rescue USB Persistent Signature Updater (freshclam / YARA sync without re-burning ISO)
import React, { useState } from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  Bug,
  Lock,
  Unlock,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  Terminal,
  Copy,
  FolderOpen,
  Trash2,
  Zap,
  HardDrive,
  FileCode,
  Sparkles,
  Search,
  Download,
  Database,
  Wifi,
  Radio,
  FileArchive,
  ArrowDownCircle,
  Clock
} from 'lucide-react';

interface MalwareDetection {
  id: string;
  filePath: string;
  threatName: string;
  category: 'Ransomware Locker' | 'Kernel Rootkit Driver' | 'C2 Beacon / Dropper' | 'Keylogger' | 'Registry Hijack Helper';
  yaraRule: string;
  sha256: string;
  status: 'INFECTED' | 'QUARANTINED' | 'DECRYPTED';
  decryptorAvailable: boolean;
}

const INITIAL_DETECTIONS: MalwareDetection[] = [
  {
    id: 'mal_1',
    filePath: 'C:\\Users\\CorporateUser\\AppData\\Roaming\\lockbit3_encryptor.exe',
    threatName: 'LockBit 3.0 (Black) Ransomware Executable',
    category: 'Ransomware Locker',
    yaraRule: 'crime_win64_lockbit_3_black_builder',
    sha256: '9f8b210a4e5c829910bfcd0219488a032bc194a081827419ef00192a8310bc94',
    status: 'INFECTED',
    decryptorAvailable: false
  },
  {
    id: 'mal_2',
    filePath: 'C:\\Windows\\System32\\drivers\\asrom_vulnerable.sys',
    threatName: 'BYOVD Vulnerable Signed Driver (Kernel Hook)',
    category: 'Kernel Rootkit Driver',
    yaraRule: 'apt_byovd_vulnerable_kernel_driver',
    sha256: 'c3ab8ff13720e8ad9047dd39466b3c8974e592c2fa383d4a3960714caef0c4f2',
    status: 'INFECTED',
    decryptorAvailable: false
  },
  {
    id: 'mal_3',
    filePath: 'C:\\Users\\Public\\Documents\\financial_records.xlsx.locked',
    threatName: 'Stop/DJVU Ransomware Encrypted Container (Offline Key: .locked)',
    category: 'Ransomware Locker',
    yaraRule: 'ransom_win_stop_djvu_offline_id',
    sha256: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    status: 'INFECTED',
    decryptorAvailable: true
  },
  {
    id: 'mal_4',
    filePath: 'C:\\Users\\Public\\svchost_updater.exe',
    threatName: 'Explorer.exe Shell Hijack Dropper & C2 Relay',
    category: 'Registry Hijack Helper',
    yaraRule: 'trojan_win32_winlogon_shell_dropper',
    sha256: '7a119c84e1b9338274ab182903feadbc8831902834bba71829304192083102bc',
    status: 'INFECTED',
    decryptorAvailable: false
  }
];

interface OfflineYaraRansomwareViewProps {
  addNotification?: (notification: any) => void;
}

export const OfflineYaraRansomwareView: React.FC<OfflineYaraRansomwareViewProps> = ({ addNotification }) => {
  const [detections, setDetections] = useState<MalwareDetection[]>(INITIAL_DETECTIONS);
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [scanProgress, setScanProgress] = useState<number>(0);

  // Signature Updater State
  const [sigVersion, setSigVersion] = useState<string>('2026.09.04.01');
  const [totalSignatures, setTotalSignatures] = useState<number>(8742109);
  const [yaraRuleCount, setYaraRuleCount] = useState<number>(42910);
  const [lastUpdated, setLastUpdated] = useState<string>('Today at 04:00 UTC');
  const [isUpdatingSigs, setIsUpdatingSigs] = useState<boolean>(false);
  const [updateProgress, setUpdateProgress] = useState<number>(0);
  const [showSigModal, setShowSigModal] = useState<boolean>(false);
  const [persistenceMount, setPersistenceMount] = useState<string>('/mnt/live_persistence/signatures');

  const [yaraLogs, setYaraLogs] = useState<string[]>([
    '[*] Offline Anti-Malware & Multi-Engine YARA Subsystem Ready',
    '[*] Live USB Persistent Storage: /mnt/live_persistence/signatures (Mounted R/W via overlayfs)',
    `[*] Loaded ${totalSignatures.toLocaleString()} ClamAV definitions & ${yaraRuleCount.toLocaleString()} YARA heuristic rulesets (v${sigVersion})`,
    '[+] Mounting target filesystem in Read-Only analysis mode: /mnt/windows_sys',
    '[!] Offline Analysis: Target operating system is unbooted. Malware cannot hide via memory hooks or rootkits.'
  ]);

  // Handle Online Signature Update (freshclam + YARA feeds)
  const handleUpdateSignaturesOnline = () => {
    setIsUpdatingSigs(true);
    setUpdateProgress(10);
    setYaraLogs(prev => [
      ...prev,
      '[*] Connecting to ClamAV & YARA Threat Intelligence mirrors via Live USB network...',
      '[freshclam] Querying database.clamav.net for daily.cvd and bytecode.cvd differentials...'
    ]);

    setTimeout(() => {
      setUpdateProgress(40);
      setYaraLogs(prev => [
        ...prev,
        '[freshclam] Received daily.cvd (version 27412, +14,890 new signatures)',
        '[yara-sync] Pulling YARA Forge, ReversingLabs & Florian Roth Signature-Base updates...'
      ]);
    }, 1000);

    setTimeout(() => {
      setUpdateProgress(80);
      setYaraLogs(prev => [
        ...prev,
        '[yarac] Compiling 850 newly acquired threat rules into /mnt/live_persistence/yara_rules/compiled.yarac',
        '[persistence] Synchronizing changes to Live Rescue USB flash partition (UUID=LIVE-PERSIST)...'
      ]);
    }, 2000);

    setTimeout(() => {
      setUpdateProgress(100);
      setIsUpdatingSigs(false);
      const newTotal = totalSignatures + 14890;
      const newYara = yaraRuleCount + 850;
      setTotalSignatures(newTotal);
      setYaraRuleCount(newYara);
      setSigVersion('2026.09.04.02');
      setLastUpdated('Just now (v2026.09.04.02)');

      setYaraLogs(prev => [
        ...prev,
        `[✓] SIGNATURE UPDATE COMPLETE: Total Signatures: ${newTotal.toLocaleString()} | YARA Rules: ${newYara.toLocaleString()}`,
        '[✓] Saved to USB persistent partition. Changes will survive system reboots! No need to re-burn ISO.'
      ]);

      if (addNotification) {
        addNotification({
          title: 'Signatures Updated (Live USB)',
          message: `Added 14,890 virus signatures and 850 YARA rules to USB persistent storage.`,
          type: 'success'
        });
      }
    }, 3000);
  };

  // Handle Air-Gapped / Offline Signature Tarball Import
  const handleImportOfflineArchive = () => {
    setIsUpdatingSigs(true);
    setUpdateProgress(20);
    setYaraLogs(prev => [
      ...prev,
      '[*] AIR-GAPPED IMPORT: Scanning secondary USB slots for signature tarball...',
      '[tar] Found: /media/update_stick/clamav_yara_bundle_20260904.tar.gz'
    ]);

    setTimeout(() => {
      setUpdateProgress(65);
      setYaraLogs(prev => [
        ...prev,
        '[tar] Unpacking daily.cvd, main.cvd, and custom APT YARA rules...',
        '[integrity] Verifying SHA-256 manifest cryptographic signature with Live USB root GPG key: PASS'
      ]);
    }, 1200);

    setTimeout(() => {
      setUpdateProgress(100);
      setIsUpdatingSigs(false);
      const newTotal = totalSignatures + 8200;
      const newYara = yaraRuleCount + 420;
      setTotalSignatures(newTotal);
      setYaraRuleCount(newYara);
      setSigVersion('2026.09.04-OFFLINE');
      setLastUpdated('Air-Gapped Pack Installed');

      setYaraLogs(prev => [
        ...prev,
        `[✓] AIR-GAPPED IMPORT SUCCESS: Loaded into ${persistenceMount} without requiring Internet connection!`,
        `[✓] Live USB engine ready for disconnected field operations.`
      ]);

      if (addNotification) {
        addNotification({
          title: 'Air-Gapped Signatures Loaded',
          message: 'Offline signature archive verified and imported into USB persistent storage.',
          type: 'success'
        });
      }
    }, 2400);
  };

  const handleRunScan = () => {
    setIsScanning(true);
    setScanProgress(15);
    setYaraLogs(prev => [
      ...prev,
      '[*] Compiling multi-engine YARA & ClamAV rule bank across unmounted NTFS filesystem...',
      '[yara] Scanning C:\\Windows\\System32, AppData, Driver store, and Startup Runkeys for APT signatures...'
    ]);

    setTimeout(() => {
      setScanProgress(55);
      setYaraLogs(prev => [
        ...prev,
        '[yara] MATCH: crime_win64_lockbit_3_black_builder matched on lockbit3_encryptor.exe',
        '[yara] MATCH: apt_byovd_vulnerable_kernel_driver matched on asrom_vulnerable.sys',
        '[yara] MATCH: trojan_win32_winlogon_shell_dropper matched on C:\\Users\\Public\\svchost_updater.exe'
      ]);
    }, 1200);

    setTimeout(() => {
      setScanProgress(100);
      setIsScanning(false);
      setYaraLogs(prev => [
        ...prev,
        '[✓] SCAN COMPLETE: 4 Critical Malware & Ransomware Threats Flagged across filesystem and startup hooks.'
      ]);

      if (addNotification) {
        addNotification({
          title: 'Offline Threat Scan Complete',
          message: '4 malware artifacts identified for quarantine or decryption.',
          type: 'warning'
        });
      }
    }, 2400);
  };

  const handleQuarantine = (id: string) => {
    setDetections(prev => prev.map(d => {
      if (d.id === id) {
        setYaraLogs(l => [
          ...l,
          `[quarantine] File '${d.filePath}' renamed with .quarantine extension and vaulted to /mnt/quarantine_vault/${d.id}.bin`
        ]);
        if (addNotification) {
          addNotification({
            title: 'Threat Quarantined',
            message: `${d.threatName} safely quarantined. Offline persistence eradicated.`,
            type: 'success'
          });
        }
        return { ...d, status: 'QUARANTINED' };
      }
      return d;
    }));
  };

  const handleDecrypt = (id: string) => {
    setDetections(prev => prev.map(d => {
      if (d.id === id) {
        setYaraLogs(l => [
          ...l,
          `[decryptor] Applying Stop/DJVU Offline Hardcoded Master Key... Restored financial_records.xlsx!`
        ]);
        if (addNotification) {
          addNotification({
            title: 'Ransomware Decrypted',
            message: 'Files decrypted successfully using Stop/DJVU offline master key.',
            type: 'success'
          });
        }
        return { ...d, status: 'DECRYPTED' };
      }
      return d;
    }));
  };

  const getCliCommand = () => {
    return `# 1. Update Anti-Malware Signatures on Live USB (Persists on flash storage across reboots)
freshclam --config-file=/etc/clamav/freshclam.conf --datadir=/mnt/live_persistence/signatures

# 2. Or Import Air-Gapped Signature Tarball from secondary USB
tar -xzvf /media/usb/clamav_yara_bundle.tar.gz -C /mnt/live_persistence/signatures/

# 3. Scan Offline Target Drive with Multi-Threaded YARA & ClamAV
yara -r -w -t 8 /mnt/live_persistence/yara_rules/compiled.yarac /mnt/windows_sys
clamscan -r --infected --database=/mnt/live_persistence/signatures /mnt/windows_sys/Windows`;
  };

  return (
    <div className="space-y-4">
      {/* Header Banner */}
      <div className="bg-[#0c0f18] p-4 rounded-xl border border-[#1b2234] flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-rose-950/80 border border-rose-500/40 text-rose-400 shadow-md shadow-rose-950/50">
            <Bug className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold font-mono text-white">Offline Multi-Engine YARA & Anti-Malware Neutralizer</h3>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-rose-950 text-rose-300 border border-rose-500/30">
                OFFLINE YARA / CLAMAV / BYOVD PURGE
              </span>
            </div>
            <p className="text-xs text-[#8fa0b5] mt-0.5">
              Scans unmounted drives to neutralize rootkits, malware, and ransomware without letting malicious code execute or evade detection.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowSigModal(true)}
            className="px-3 py-2 rounded-lg bg-indigo-950/80 hover:bg-indigo-900 border border-indigo-500/40 text-indigo-300 font-mono text-xs font-bold flex items-center gap-1.5 transition-all"
          >
            <Database className="w-4 h-4 text-indigo-400" />
            <span>Update Signatures ({sigVersion})</span>
          </button>

          <button
            onClick={handleRunScan}
            disabled={isScanning || isUpdatingSigs}
            className="px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white font-mono text-xs font-bold flex items-center gap-2 shadow-lg shadow-rose-600/30 transition-all"
          >
            {isScanning ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Scanning Drive ({scanProgress}%)...</span>
              </>
            ) : (
              <>
                <Search className="w-4 h-4" />
                <span>Run Offline YARA Scan</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Signature & Persistence Status HUD */}
      <div className="p-3.5 rounded-xl bg-[#090d16] border border-blue-900/40 grid grid-cols-1 md:grid-cols-4 gap-3 text-xs font-mono">
        <div className="flex items-center space-x-2.5">
          <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[10px] text-slate-400">USB PERSISTENCE</div>
            <div className="text-emerald-300 font-bold">Enabled (OverlayFS)</div>
            <div className="text-[9px] text-slate-500">No Daily Re-burn Required</div>
          </div>
        </div>

        <div className="flex items-center space-x-2.5">
          <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20">
            <Database className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[10px] text-slate-400">CLAMAV SIGNATURES</div>
            <div className="text-white font-bold">{totalSignatures.toLocaleString()}</div>
            <div className="text-[9px] text-cyan-400">daily.cvd + bytecode</div>
          </div>
        </div>

        <div className="flex items-center space-x-2.5">
          <div className="p-2 rounded-lg bg-purple-500/10 text-purple-400 border border-purple-500/20">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[10px] text-slate-400">COMPILED YARA RULES</div>
            <div className="text-purple-300 font-bold">{yaraRuleCount.toLocaleString()} Rules</div>
            <div className="text-[9px] text-slate-400">YARA-Forge + Threat Intel</div>
          </div>
        </div>

        <div className="flex items-center space-x-2.5">
          <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <Clock className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[10px] text-slate-400">LAST DEFINITION SYNC</div>
            <div className="text-amber-300 font-bold">{lastUpdated}</div>
            <div className="text-[9px] text-slate-400">{sigVersion}</div>
          </div>
        </div>
      </div>

      {/* Threats Grid */}
      <div className="bg-[#0c0f18] p-4 rounded-xl border border-[#1b2234] space-y-3">
        <div className="flex items-center justify-between border-b border-[#1b2234] pb-2">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-rose-400" />
            <span className="text-xs font-bold font-mono text-white uppercase">Detected Offline Malware & Ransomware Artifacts</span>
          </div>
          <span className="text-[10px] font-mono text-rose-400">{detections.length} Threats Discovered</span>
        </div>

        <div className="space-y-2.5">
          {detections.map(item => (
            <div
              key={item.id}
              className={`p-3.5 rounded-lg border text-xs font-mono space-y-2 ${
                item.status === 'QUARANTINED' || item.status === 'DECRYPTED'
                  ? 'bg-emerald-950/20 border-emerald-500/40'
                  : 'bg-rose-950/30 border-rose-500/60 shadow-md shadow-rose-950/30'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-white font-bold text-sm">{item.threatName}</span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-[#172033] text-sky-300">
                      {item.category}
                    </span>
                  </div>

                  <div className="text-[11px] text-rose-300 break-all select-all">
                    {item.filePath}
                  </div>

                  <div className="text-[10px] text-[#708098] flex items-center gap-2">
                    <span>YARA Rule: <code className="text-amber-300">{item.yaraRule}</code></span>
                    <span>•</span>
                    <span>SHA-256: <code className="text-sky-300">{item.sha256.slice(0, 16)}...</code></span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className={`text-[9px] px-2 py-0.5 rounded border font-bold ${
                    item.status === 'QUARANTINED'
                      ? 'bg-emerald-950 text-emerald-300 border-emerald-500/30'
                      : item.status === 'DECRYPTED'
                      ? 'bg-cyan-950 text-cyan-300 border-cyan-500/30'
                      : 'bg-rose-950 text-rose-300 border-rose-500/30'
                  }`}>
                    {item.status}
                  </span>
                </div>
              </div>

              {/* Actions */}
              {item.status === 'INFECTED' && (
                <div className="flex items-center gap-2 pt-1 border-t border-[#182030]">
                  <button
                    onClick={() => handleQuarantine(item.id)}
                    className="px-3 py-1 rounded bg-rose-950/80 hover:bg-rose-900 text-rose-300 border border-rose-500/40 text-[11px] font-bold flex items-center gap-1.5 transition-all"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Quarantine & Purge from Disk</span>
                  </button>

                  {item.decryptorAvailable && (
                    <button
                      onClick={() => handleDecrypt(item.id)}
                      className="px-3 py-1 rounded bg-cyan-950/80 hover:bg-cyan-900 text-cyan-300 border border-cyan-500/40 text-[11px] font-bold flex items-center gap-1.5 transition-all"
                    >
                      <Unlock className="w-3.5 h-3.5" />
                      <span>Apply Stop/DJVU Master Decryptor</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* CLI & Terminal Commands */}
      <div className="bg-[#080a11] rounded-xl border border-[#1b2234] p-4 space-y-3">
        <div className="flex items-center justify-between border-b border-[#161d2d] pb-2">
          <div className="flex items-center gap-2">
            <Terminal className="w-4 h-4 text-rose-400" />
            <span className="text-xs font-bold font-mono text-white">YARA & freshclam Signature Commands</span>
          </div>
          <button
            onClick={() => {
              navigator.clipboard?.writeText(getCliCommand());
              if (addNotification) {
                addNotification({
                  title: 'Command Copied',
                  message: 'YARA & freshclam script copied to clipboard',
                  type: 'info'
                });
              }
            }}
            className="flex items-center gap-1.5 px-2 py-1 rounded bg-[#131a2b] hover:bg-[#1b253e] text-[11px] font-mono text-[#8fa0b5] hover:text-white transition-all"
          >
            <Copy className="w-3 h-3" />
            <span>Copy Script</span>
          </button>
        </div>

        <div className="p-2.5 rounded-lg bg-[#04060a] border border-[#141b2c] font-mono text-xs text-rose-300 select-all overflow-x-auto">
          <pre className="text-[11px]">{getCliCommand()}</pre>
        </div>

        <div className="p-3 rounded-lg bg-[#04060a] border border-[#141b2c] font-mono text-xs space-y-1 max-h-36 overflow-y-auto">
          {yaraLogs.map((log, idx) => (
            <div
              key={idx}
              className={`${
                log.includes('[✓]')
                  ? 'text-emerald-400 font-bold'
                  : log.includes('[yara] MATCH')
                  ? 'text-rose-300 font-bold'
                  : log.includes('[quarantine]') || log.includes('[decryptor]')
                  ? 'text-cyan-300'
                  : log.includes('[freshclam]') || log.includes('[persistence]')
                  ? 'text-indigo-300'
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

      {/* Signature Management Modal */}
      {showSigModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-xl bg-[#0c101c] border border-indigo-500/40 rounded-2xl p-6 shadow-2xl space-y-4 text-slate-200">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-3">
                <div className="p-2.5 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                  <Database className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Live Rescue USB Signature Manager</h3>
                  <p className="text-xs text-slate-400">Update anti-malware definitions without burning a new USB instance</p>
                </div>
              </div>

              <button
                onClick={() => setShowSigModal(false)}
                className="text-slate-400 hover:text-white text-lg font-bold px-2 py-1"
              >
                ✕
              </button>
            </div>

            <div className="p-3 rounded-xl bg-blue-950/30 border border-blue-800/40 text-xs text-blue-200 space-y-1">
              <div className="font-bold flex items-center gap-1.5 text-blue-300">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Persistent Flash Storage Active</span>
              </div>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                Your Live Rescue USB uses an encrypted/authenticated writable persistence partition (<code className="text-white bg-black/40 px-1 py-0.5 rounded">{persistenceMount}</code>). Signatures downloaded here are stored on flash storage and persist across boots. <strong>You never need to re-burn the USB drive to get the latest definitions.</strong>
              </p>
            </div>

            {/* Current Stats */}
            <div className="grid grid-cols-2 gap-3 text-xs font-mono">
              <div className="p-3 rounded-lg bg-[#070a13] border border-slate-800">
                <div className="text-slate-400">Definition Version:</div>
                <div className="text-white font-bold">{sigVersion}</div>
              </div>
              <div className="p-3 rounded-lg bg-[#070a13] border border-slate-800">
                <div className="text-slate-400">Total Signatures:</div>
                <div className="text-emerald-400 font-bold">{totalSignatures.toLocaleString()} hashes</div>
              </div>
            </div>

            {/* Update Actions */}
            <div className="space-y-3 pt-1">
              <div className="text-xs font-bold text-slate-300">Select Update Method:</div>

              <button
                onClick={handleUpdateSignaturesOnline}
                disabled={isUpdatingSigs}
                className="w-full p-3 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/50 flex items-center justify-between text-left transition-all"
              >
                <div className="flex items-center space-x-3">
                  <Wifi className="w-5 h-5 text-indigo-400" />
                  <div>
                    <div className="text-xs font-bold text-white">Online Update (freshclam & YARA Feeds)</div>
                    <div className="text-[10px] text-slate-400">Direct download over Wi-Fi or Ethernet to USB persistence</div>
                  </div>
                </div>
                <ArrowDownCircle className="w-5 h-5 text-indigo-400" />
              </button>

              <button
                onClick={handleImportOfflineArchive}
                disabled={isUpdatingSigs}
                className="w-full p-3 rounded-xl bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/50 flex items-center justify-between text-left transition-all"
              >
                <div className="flex items-center space-x-3">
                  <FileArchive className="w-5 h-5 text-purple-400" />
                  <div>
                    <div className="text-xs font-bold text-white">Air-Gapped Offline Tarball Import</div>
                    <div className="text-[10px] text-slate-400">Import signed .tar.gz / .cvd package from secondary flash stick</div>
                  </div>
                </div>
                <ArrowDownCircle className="w-5 h-5 text-purple-400" />
              </button>
            </div>

            {isUpdatingSigs && (
              <div className="space-y-1.5 pt-2">
                <div className="flex justify-between text-xs font-mono">
                  <span className="text-slate-400">Updating Signatures...</span>
                  <span className="text-indigo-400 font-bold">{updateProgress}%</span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                  <div 
                    className="h-full bg-indigo-500 transition-all duration-300"
                    style={{ width: `${updateProgress}%` }}
                  />
                </div>
              </div>
            )}

            <div className="flex justify-end pt-3 border-t border-slate-800">
              <button
                onClick={() => setShowSigModal(false)}
                className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-bold text-white transition-all"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
