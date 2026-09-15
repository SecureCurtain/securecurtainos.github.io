// jb7572_2026-09-01: Windows Event Log (*.evtx) Viewer & VSS Shadow Log Copier
import React, { useState } from 'react';
import { 
  EventLogEntry, 
  MOCK_EVENT_LOGS 
} from '../../../services/forensicsService';
import { 
  FileText, 
  Search, 
  Copy, 
  Download, 
  CheckCircle2, 
  AlertTriangle, 
  ShieldAlert, 
  ShieldCheck, 
  Terminal, 
  Filter, 
  Layers, 
  Lock,
  Zap
} from 'lucide-react';

interface EventLogViewerTabProps {
  onNotify: (title: string, message: string) => void;
}

export const EventLogViewerTab: React.FC<EventLogViewerTabProps> = ({ onNotify }) => {
  const [logs, setLogs] = useState<EventLogEntry[]>(MOCK_EVENT_LOGS);
  const [selectedChannel, setSelectedChannel] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRecordId, setSelectedRecordId] = useState<number>(489209);
  const [isCopyingLockedLogs, setIsCopyingLockedLogs] = useState(false);

  const selectedLog = logs.find(l => l.recordId === selectedRecordId) || logs[0];

  const handleCopyLockedLogs = () => {
    setIsCopyingLockedLogs(true);
    onNotify('VSS Log Extraction Initiated', 'Mounting Volume Shadow Copy to bypass active kernel locks on *.evtx files...');

    setTimeout(() => {
      setIsCopyingLockedLogs(false);
      onNotify('Event Logs Acquired', 'Extracted Security.evtx, System.evtx, PowerShell.evtx, and Sysmon.evtx to /mnt/forensic_vault/LOGS/');
    }, 800);
  };

  const filteredLogs = logs.filter(l => {
    if (selectedChannel !== 'ALL' && l.channel !== selectedChannel) return false;
    if (!searchTerm) return true;
    const match = l.eventId.toString().includes(searchTerm) ||
                  l.summary.toLowerCase().includes(searchTerm.toLowerCase()) ||
                  l.userSidOrName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                  l.detailsXmlOrJson.toLowerCase().includes(searchTerm.toLowerCase());
    return match;
  });

  const copyDetails = (text: string) => {
    navigator.clipboard.writeText(text);
    onNotify('Copied Details', 'Event Log record XML copied to clipboard');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-lg">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="p-2 bg-teal-500/20 text-teal-400 rounded-lg">
                <FileText className="w-5 h-5" />
              </span>
              <h2 className="text-xl font-bold text-slate-100">Windows Event Log (*.evtx) Viewer & Copier</h2>
              <span className="px-2 py-0.5 text-xs font-semibold bg-teal-500/20 text-teal-400 border border-teal-500/30 rounded-full">
                VSS Direct Raw Block Copier
              </span>
            </div>
            <p className="text-xs text-slate-400 max-w-2xl">
              Extract and analyze live locked Windows Event Log files (<code className="text-teal-300 font-mono">Security.evtx</code>, <code className="text-teal-300 font-mono">System.evtx</code>, <code className="text-teal-300 font-mono">PowerShell 4104</code>, <code className="text-teal-300 font-mono">Sysmon 1/3</code>) using raw NTFS volume shadow parsing to bypass OS file handle locks without system shutdown.
            </p>
          </div>

          <button
            onClick={handleCopyLockedLogs}
            disabled={isCopyingLockedLogs}
            className={`px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all shadow-md ${
              isCopyingLockedLogs
                ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                : 'bg-teal-600 hover:bg-teal-500 text-white shadow-teal-500/20'
            }`}
          >
            <Download className="w-4 h-4" />
            {isCopyingLockedLogs ? 'Copying Locked *.evtx...' : 'VSS Extract Locked Logs'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Filter & Event Log List */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 space-y-4">
            {/* Channel Filters */}
            <div className="flex flex-wrap gap-1.5">
              {['ALL', 'Security', 'System', 'PowerShell/Operational', 'Sysmon/Operational'].map(ch => (
                <button
                  key={ch}
                  onClick={() => setSelectedChannel(ch)}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                    selectedChannel === ch
                      ? 'bg-teal-600 text-white shadow-sm'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  {ch}
                </button>
              ))}
            </div>

            {/* Search Input */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Filter by Event ID (e.g. 4624, 4688, 4104), user, or payload..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg pl-9 pr-4 py-2 text-xs text-slate-200 focus:outline-none focus:border-teal-500"
              />
            </div>

            {/* Event Table */}
            <div className="border border-slate-800 rounded-lg overflow-hidden max-h-[380px] overflow-y-auto custom-scrollbar">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-slate-950 text-slate-400 sticky top-0 border-b border-slate-800">
                  <tr>
                    <th className="p-2.5">Event ID</th>
                    <th className="p-2.5">Channel</th>
                    <th className="p-2.5">Summary / Activity</th>
                    <th className="p-2.5">Timestamp (UTC)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 bg-slate-900/60">
                  {filteredLogs.map(log => (
                    <tr
                      key={log.recordId}
                      onClick={() => setSelectedRecordId(log.recordId)}
                      className={`cursor-pointer transition-all ${
                        selectedRecordId === log.recordId
                          ? 'bg-teal-950/50 text-white'
                          : 'hover:bg-slate-800/50 text-slate-300'
                      }`}
                    >
                      <td className="p-2.5 font-bold text-teal-400">{log.eventId}</td>
                      <td className="p-2.5 text-slate-400">{log.channel}</td>
                      <td className="p-2.5 truncate max-w-[240px] text-slate-200">{log.summary}</td>
                      <td className="p-2.5 text-slate-400 text-[11px]">{log.timestamp}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Column: Selected Event XML / JSON Payload */}
        <div className="lg:col-span-5 space-y-4">
          {selectedLog && (
            <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div>
                  <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-teal-400" />
                    Event ID {selectedLog.eventId} ({selectedLog.channel})
                  </h3>
                  <div className="text-[11px] font-mono text-slate-400 mt-0.5">Record #{selectedLog.recordId}</div>
                </div>
                <button
                  onClick={() => copyDetails(selectedLog.detailsXmlOrJson)}
                  className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-slate-200 rounded text-xs flex items-center gap-1 font-mono"
                >
                  <Copy className="w-3.5 h-3.5" /> Copy
                </button>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <span className="text-slate-400 text-[11px]">Provider:</span>
                  <div className="font-mono text-slate-200 text-xs mt-0.5">{selectedLog.provider}</div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-slate-950 p-2 rounded border border-slate-800 text-[11px]">
                    <div className="text-slate-400">User / SID</div>
                    <div className="font-mono text-slate-200 mt-0.5 truncate">{selectedLog.userSidOrName}</div>
                  </div>
                  <div className="bg-slate-950 p-2 rounded border border-slate-800 text-[11px]">
                    <div className="text-slate-400">Host Computer</div>
                    <div className="font-mono text-slate-200 mt-0.5">{selectedLog.computer}</div>
                  </div>
                </div>

                <div>
                  <span className="text-slate-400 text-[11px]">Summary:</span>
                  <div className="bg-slate-950 p-2.5 rounded text-xs text-slate-200 border border-slate-800 mt-1">
                    {selectedLog.summary}
                  </div>
                </div>

                <div>
                  <span className="text-slate-400 text-[11px]">Parsed XML / Forensic Payload:</span>
                  <pre className="bg-slate-950 p-3 rounded font-mono text-[11px] text-teal-300 border border-slate-800 overflow-x-auto whitespace-pre-wrap mt-1">
                    {selectedLog.detailsXmlOrJson}
                  </pre>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
