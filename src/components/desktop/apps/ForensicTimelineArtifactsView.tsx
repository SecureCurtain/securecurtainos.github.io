// jb7572_2026-08-26: SecureCurtain Core Architecture - Diamond-Grade Forensic Super-Timeline & Artifact Reconstructor (Plaso / MFT / EVTX)
import React, { useState } from 'react';
import {
  Clock,
  Calendar,
  FileText,
  Search,
  Filter,
  Layers,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Terminal,
  Copy,
  Zap,
  Activity,
  HardDrive,
  Download,
  Share2,
  FolderOpen
} from 'lucide-react';

interface TimelineEvent {
  id: string;
  timestamp: string;
  source: 'NTFS $MFT' | 'Windows EVTX' | 'USB Shellbags' | 'LNK Recent File' | 'Browser History';
  eventType: 'File Created' | 'Logon Success' | 'USB Inserted' | 'PowerShell Exec' | 'Malware Dropped';
  description: string;
  severity: 'CRITICAL' | 'SUSPICIOUS' | 'INFORMATIONAL';
  processUser: string;
}

const INITIAL_TIMELINE_EVENTS: TimelineEvent[] = [
  {
    id: 'evt_1',
    timestamp: '2026-08-26 14:14:02.192 UTC',
    source: 'USB Shellbags',
    eventType: 'USB Inserted',
    description: 'Hardware ID: USBSTOR\\DiskKingstonDataTraveler3.0 (Serial: 001A92B487102941) mounted as E:',
    severity: 'INFORMATIONAL',
    processUser: 'NT AUTHORITY\\SYSTEM'
  },
  {
    id: 'evt_2',
    timestamp: '2026-08-26 14:15:10.840 UTC',
    source: 'NTFS $MFT',
    eventType: 'File Created',
    description: '$MFT Record 84190: C:\\Users\\Public\\updater_payload.exe created (Size: 420 KB, SHA-256: 4f1a...99c2)',
    severity: 'SUSPICIOUS',
    processUser: 'CORP\\CorporateAdmin'
  },
  {
    id: 'evt_3',
    timestamp: '2026-08-26 14:15:14.301 UTC',
    source: 'Windows EVTX',
    eventType: 'PowerShell Exec',
    description: 'Event ID 4104: Script Block Logging captured: "Invoke-Expression (New-Object Net.WebClient).DownloadString(...)"',
    severity: 'CRITICAL',
    processUser: 'CORP\\CorporateAdmin'
  },
  {
    id: 'evt_4',
    timestamp: '2026-08-26 14:15:20.912 UTC',
    source: 'NTFS $MFT',
    eventType: 'Malware Dropped',
    description: '$UsnJrnl USN_REASON_FILE_CREATE: C:\\Windows\\System32\\drivers\\suspicious_rootkit.sys written.',
    severity: 'CRITICAL',
    processUser: 'NT AUTHORITY\\SYSTEM'
  },
  {
    id: 'evt_5',
    timestamp: '2026-08-26 14:16:01.002 UTC',
    source: 'Windows EVTX',
    eventType: 'Logon Success',
    description: 'Event ID 4624: Logon Type 3 (Network) from IP 192.168.1.185 (User: Administrator)',
    severity: 'INFORMATIONAL',
    processUser: 'NT AUTHORITY\\SYSTEM'
  }
];

interface ForensicTimelineArtifactsViewProps {
  addNotification?: (notification: any) => void;
}

export const ForensicTimelineArtifactsView: React.FC<ForensicTimelineArtifactsViewProps> = ({ addNotification }) => {
  const [events, setEvents] = useState<TimelineEvent[]>(INITIAL_TIMELINE_EVENTS);
  const [filterSeverity, setFilterSeverity] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  const [timelineLogs, setTimelineLogs] = useState<string[]>([
    '[*] Plaso / log2timeline Artifact Chrono-Engine Ready',
    '[+] Parsed NTFS $MFT & $LogFile on mounted Windows partition (1,480,210 filesystem records)',
    '[+] Parsed Windows Event Logs (Security.evtx, System.evtx, PowerShell/Operational.evtx)',
    '[✓] Super-timeline generated with microsecond-precision timestamps.'
  ]);

  const filteredEvents = events.filter(e => {
    const matchesSev = filterSeverity === 'ALL' || e.severity === filterSeverity;
    const matchesSearch = e.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          e.eventType.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          e.source.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSev && matchesSearch;
  });

  const handleExportCsv = () => {
    const csvContent = 'data:text/csv;charset=utf-8,' +
      ['Timestamp,Source,EventType,Severity,User,Description'].concat(
        filteredEvents.map(e => `"${e.timestamp}","${e.source}","${e.eventType}","${e.severity}","${e.processUser}","${e.description.replace(/"/g, '""')}"`)
      ).join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Forensic_SuperTimeline_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    if (addNotification) {
      addNotification({
        title: 'Timeline CSV Exported',
        message: 'Super-timeline records exported to CSV for courtroom timeline analysis.',
        type: 'success'
      });
    }
  };

  const getCliCommand = () => {
    return `# 1. Extract super-timeline with Plaso / log2timeline
log2timeline.py --parsers "mft,winevtx,winreg,usnjrnl,shellbags" /mnt/evidence/timeline.plaso /mnt/windows_sys

# 2. Filter and export to high-speed CSV with psort
psort.py -o l2tcsv -w /mnt/evidence/super_timeline.csv /mnt/evidence/timeline.plaso`;
  };

  return (
    <div className="space-y-4">
      {/* Header Banner */}
      <div className="bg-[#0c0f18] p-4 rounded-xl border border-[#1b2234] flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-blue-950/80 border border-blue-500/40 text-blue-400 shadow-md shadow-blue-950/50">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold font-mono text-white">Forensic Super-Timeline & Artifact Reconstructor</h3>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-950 text-blue-300 border border-blue-500/30">
                PLASO / LOG2TIMELINE / MFT & EVTX
              </span>
            </div>
            <p className="text-xs text-[#8fa0b5] mt-0.5">
              Reconstructs second-by-second incident activity from NTFS $MFT, $UsnJrnl, Windows Security .evtx, and USB Shellbags.
            </p>
          </div>
        </div>

        <button
          onClick={handleExportCsv}
          className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-mono text-xs font-bold flex items-center gap-2 shadow-lg shadow-blue-600/30 transition-all"
        >
          <Download className="w-4 h-4" />
          <span>Export Timeline (.CSV)</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="bg-[#0c0f18] p-3 rounded-xl border border-[#1b2234] flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
        <div className="flex items-center gap-2 flex-1 min-w-[240px]">
          <Search className="w-4 h-4 text-[#8fa0b5]" />
          <input
            type="text"
            placeholder="Search timeline events (MFT, hash, powershell, user, IP)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#090c15] border border-[#232f4b] rounded px-3 py-1.5 text-white font-mono focus:border-blue-500 focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-[#8fa0b5]" />
          <select
            value={filterSeverity}
            onChange={(e) => setFilterSeverity(e.target.value)}
            className="bg-[#090c15] border border-[#232f4b] rounded px-3 py-1.5 text-sky-300 font-mono focus:outline-none"
          >
            <option value="ALL">All Severities</option>
            <option value="CRITICAL">Critical Only</option>
            <option value="SUSPICIOUS">Suspicious Only</option>
            <option value="INFORMATIONAL">Informational Only</option>
          </select>
        </div>
      </div>

      {/* Timeline Event Feed */}
      <div className="bg-[#0c0f18] p-4 rounded-xl border border-[#1b2234] space-y-2.5">
        <div className="flex items-center justify-between border-b border-[#1b2234] pb-2">
          <span className="text-xs font-bold font-mono text-white uppercase">Reconstructed Incident Chronology</span>
          <span className="text-[10px] font-mono text-emerald-400">{filteredEvents.length} Correlated Events</span>
        </div>

        <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
          {filteredEvents.map(evt => (
            <div
              key={evt.id}
              className={`p-3 rounded-lg border text-xs font-mono space-y-1.5 ${
                evt.severity === 'CRITICAL'
                  ? 'bg-red-950/30 border-red-500/50 shadow-sm shadow-red-950/20'
                  : evt.severity === 'SUSPICIOUS'
                  ? 'bg-amber-950/30 border-amber-500/50'
                  : 'bg-[#101422] border-[#1e273e]'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#172033] text-sky-300">
                    {evt.timestamp}
                  </span>
                  <span className="text-white font-bold">{evt.eventType}</span>
                  <span className="text-[10px] text-[#708098]">({evt.source})</span>
                </div>

                <span className={`text-[9px] px-2 py-0.5 rounded border font-bold ${
                  evt.severity === 'CRITICAL'
                    ? 'bg-red-950 text-red-300 border-red-500/30'
                    : evt.severity === 'SUSPICIOUS'
                    ? 'bg-amber-950 text-amber-300 border-amber-500/30'
                    : 'bg-[#141b2c] text-[#8fa0b5] border-[#222e49]'
                }`}>
                  {evt.severity}
                </span>
              </div>

              <div className="text-[11px] text-[#8fa0b5] select-all">
                {evt.description}
              </div>

              <div className="text-[10px] text-sky-400">
                User Context: <code className="text-emerald-300">{evt.processUser}</code>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* CLI Script & Plaso Terminal Command */}
      <div className="bg-[#080a11] rounded-xl border border-[#1b2234] p-4 space-y-3">
        <div className="flex items-center justify-between border-b border-[#161d2d] pb-2">
          <div className="flex items-center gap-2">
            <Terminal className="w-4 h-4 text-blue-400" />
            <span className="text-xs font-bold font-mono text-white">Plaso / Log2Timeline Super-Timeline Command</span>
          </div>
          <button
            onClick={() => {
              navigator.clipboard?.writeText(getCliCommand());
              if (addNotification) {
                addNotification({
                  title: 'Command Copied',
                  message: 'Plaso command copied to clipboard',
                  type: 'info'
                });
              }
            }}
            className="flex items-center gap-1.5 px-2 py-1 rounded bg-[#131a2b] hover:bg-[#1b253e] text-[11px] font-mono text-[#8fa0b5] hover:text-white transition-all"
          >
            <Copy className="w-3 h-3" />
            <span>Copy Command</span>
          </button>
        </div>

        <div className="p-2.5 rounded-lg bg-[#04060a] border border-[#141b2c] font-mono text-xs text-blue-300 select-all overflow-x-auto">
          <pre className="text-[11px]">{getCliCommand()}</pre>
        </div>

        <div className="p-3 rounded-lg bg-[#04060a] border border-[#141b2c] font-mono text-xs space-y-1 max-h-36 overflow-y-auto">
          {timelineLogs.map((log, idx) => (
            <div
              key={idx}
              className={`${
                log.includes('[✓]')
                  ? 'text-emerald-400 font-bold'
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
    </div>
  );
};
