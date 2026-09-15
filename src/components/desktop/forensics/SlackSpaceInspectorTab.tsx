// jb7572_2026-09-04: Slack Space Inspector (RAM Slack, Cluster Slack, blkls -s, icat -s)
import React, { useState } from 'react';
import { 
  SlackSpaceEntry, 
  SlackSpaceResidualHit,
  MOCK_SLACK_ENTRIES 
} from '../../../services/forensicsService';
import { 
  Layers, 
  Search, 
  AlertTriangle, 
  Binary, 
  FileCode, 
  Download, 
  Terminal, 
  Eye, 
  ShieldAlert, 
  CheckCircle2, 
  Zap, 
  Copy,
  FileSearch,
  Filter
} from 'lucide-react';

interface SlackSpaceInspectorTabProps {
  onNotify: (title: string, message: string) => void;
}

export const SlackSpaceInspectorTab: React.FC<SlackSpaceInspectorTabProps> = ({ onNotify }) => {
  const [entries, setEntries] = useState<SlackSpaceEntry[]>(MOCK_SLACK_ENTRIES);
  const [selectedEntryId, setSelectedEntryId] = useState<string>(MOCK_SLACK_ENTRIES[0].id);
  const [searchFilter, setSearchFilter] = useState('');
  const [isCarving, setIsCarving] = useState(false);
  const [selectedHit, setSelectedHit] = useState<SlackSpaceResidualHit | null>(null);

  const activeEntry = entries.find(e => e.id === selectedEntryId) || entries[0];

  const handleCarveSlackToFile = (entry: SlackSpaceEntry) => {
    setIsCarving(true);
    onNotify('TSK blkls Slack Extraction Started', `Carving ${entry.totalSlackBytes} bytes of slack space from ${entry.filepath}...`);

    setTimeout(() => {
      setIsCarving(false);
      const updated = entries.map(e => e.id === entry.id ? { ...e, status: 'CARVED_TO_FILE' as const } : e);
      setEntries(updated);
      onNotify(
        'Slack Space Carved to Vault',
        `Successfully carved slack stream to /mnt/forensic_vault/SLACK_CARVES/${entry.id}_slack.bin (SHA256 verified)`
      );
    }, 800);
  };

  const filteredEntries = entries.filter(e => 
    e.filepath.toLowerCase().includes(searchFilter.toLowerCase()) ||
    e.discoveredArtifacts.some(a => a.snippet.toLowerCase().includes(searchFilter.toLowerCase()))
  );

  return (
    <div className="space-y-5 text-slate-200">
      {/* Header Banner */}
      <div className="p-4 rounded-xl bg-gradient-to-r from-amber-950/40 via-yellow-950/30 to-slate-900 border border-amber-900/40 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 rounded-lg bg-amber-500/20 border border-amber-400/30 text-amber-400">
            <Binary className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              Slack Space Inspector & RAM/Cluster Slack Carver
              <span className="px-2 py-0.5 text-[10px] rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30">
                TSK blkls -s / icat -s
              </span>
            </h3>
            <p className="text-xs text-slate-300 mt-0.5">
              Inspect unallocated bytes residing between logical End-of-File (EOF) and physical cluster boundaries (4096-byte clusters & 512-byte sector padding) for hidden payloads, credentials, and deleted strings.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="text-right font-mono text-[11px] text-slate-400">
            <div>Sector Size: <strong className="text-white">512 Bytes</strong></div>
            <div>Cluster Size: <strong className="text-amber-400">4,096 Bytes</strong></div>
          </div>
        </div>
      </div>

      {/* Main Grid: File List (Left) and Hex/Slack Analysis (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left Column: Files with Slack Space */}
        <div className="space-y-3">
          <div className="flex items-center justify-between pb-1">
            <div className="flex items-center space-x-2 text-xs font-semibold text-white">
              <FileSearch className="w-4 h-4 text-amber-400" />
              <span>Files with Analyzed Slack</span>
            </div>
            <span className="text-[11px] text-slate-400 font-mono">blkls index</span>
          </div>

          {/* Search Input */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search file path or payload..."
              value={searchFilter}
              onChange={e => setSearchFilter(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-[#0a0e17] border border-slate-700 text-white font-mono text-xs focus:border-amber-500 outline-none"
            />
          </div>

          <div className="space-y-2.5">
            {filteredEntries.map(entry => {
              const isSelected = entry.id === activeEntry.id;
              return (
                <div
                  key={entry.id}
                  onClick={() => {
                    setSelectedEntryId(entry.id);
                    setSelectedHit(null);
                  }}
                  className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-[#181510] border-amber-500/60 shadow-lg shadow-amber-500/10 ring-1 ring-amber-500/40'
                      : 'bg-[#0a0e17] border-slate-800/80 hover:bg-[#12100d] hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="font-bold text-xs text-white truncate max-w-[180px]" title={entry.filepath}>
                      {entry.filepath.split('\\').pop() || entry.filepath}
                    </div>
                    <span className={`text-[10px] px-2 py-0.5 rounded font-mono font-medium ${
                      entry.status === 'TAMPER_FLAGGED'
                        ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                        : entry.status === 'CARVED_TO_FILE'
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                        : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                    }`}>
                      {entry.status}
                    </span>
                  </div>

                  <div className="text-[10px] text-slate-400 font-mono truncate mb-2">
                    {entry.filepath}
                  </div>

                  {/* Math Breakdown Pill */}
                  <div className="p-2 rounded bg-black/40 border border-slate-800 text-[11px] font-mono grid grid-cols-3 gap-1 text-center">
                    <div>
                      <div className="text-[9px] text-slate-500">LOGICAL</div>
                      <div className="text-cyan-400 font-bold">{entry.logicalFileSizeBytes} B</div>
                    </div>
                    <div>
                      <div className="text-[9px] text-slate-500">SLACK</div>
                      <div className="text-amber-400 font-bold">{entry.totalSlackBytes} B</div>
                    </div>
                    <div>
                      <div className="text-[9px] text-slate-500">PHYSICAL</div>
                      <div className="text-slate-300 font-bold">{entry.allocatedPhysicalBytes} B</div>
                    </div>
                  </div>

                  {entry.discoveredArtifacts.length > 0 && (
                    <div className="mt-2 text-[10px] text-rose-400 flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3 shrink-0" />
                      <span>{entry.discoveredArtifacts.length} residual artifacts recovered</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Command Equivalent */}
          <div className="p-3 rounded-lg bg-[#070a12] border border-slate-800/90 text-[11px] font-mono space-y-1.5 text-slate-400">
            <div className="text-slate-300 flex items-center gap-1">
              <Terminal className="w-3.5 h-3.5 text-amber-400" />
              <span>TSK Slack Command:</span>
            </div>
            <code className="text-amber-300 block bg-black/50 p-1.5 rounded break-all select-all">
              blkls -s /mnt/forensic_vault/evidence.raw &gt; /tmp/slack_space.bin
            </code>
            <code className="text-slate-400 block bg-black/50 p-1.5 rounded break-all select-all">
              icat -s /mnt/forensic_vault/evidence.raw 1042 &gt; hosts_slack.bin
            </code>
          </div>
        </div>

        {/* Right 2 Columns: Mathematical Visualization, Hex Viewer, Artifacts */}
        <div className="lg:col-span-2 space-y-4">
          <div className="p-4 rounded-xl bg-[#0a0e17] border border-slate-800/90 space-y-4">
            {/* Header / Active File Info */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-800/80 gap-2">
              <div>
                <h4 className="text-xs font-bold text-white font-mono break-all">
                  {activeEntry.filepath}
                </h4>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Cluster allocation analysis across NTFS blocks
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleCarveSlackToFile(activeEntry)}
                  disabled={isCarving}
                  className="px-3 py-1 text-xs rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-semibold transition-all flex items-center gap-1.5 shadow-sm"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>{isCarving ? 'Carving...' : 'Carve Slack (blkls)'}</span>
                </button>
              </div>
            </div>

            {/* Visual Cluster Bar Diagram */}
            <div className="p-3.5 rounded-lg bg-[#070a12] border border-slate-800 space-y-2">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-slate-400">Sector / Cluster Allocation Layout:</span>
                <span className="text-amber-400">Total Cluster Size: {activeEntry.allocatedPhysicalBytes} Bytes</span>
              </div>

              {/* Graphical representation */}
              <div className="w-full h-8 rounded-lg overflow-hidden flex font-mono text-[10px] font-bold">
                {/* Logical File Area */}
                <div 
                  style={{ width: `${Math.max(15, (activeEntry.logicalFileSizeBytes / activeEntry.allocatedPhysicalBytes) * 100)}%` }}
                  className="bg-blue-600/80 text-white flex items-center justify-center border-r border-cyan-400/80 relative"
                  title={`Logical Data: ${activeEntry.logicalFileSizeBytes} bytes`}
                >
                  <span className="truncate px-1">FILE DATA ({activeEntry.logicalFileSizeBytes}B)</span>
                </div>

                {/* RAM Slack Area (to 512 boundary) */}
                <div 
                  style={{ width: `${Math.max(15, (activeEntry.ramSlackBytes / activeEntry.allocatedPhysicalBytes) * 100)}%` }}
                  className="bg-amber-600/80 text-white flex items-center justify-center border-r border-amber-300"
                  title={`RAM Slack: ${activeEntry.ramSlackBytes} bytes (Padded to 512 sector)`}
                >
                  <span className="truncate px-1">RAM SLACK ({activeEntry.ramSlackBytes}B)</span>
                </div>

                {/* Cluster Slack Area (to 4096 boundary) */}
                <div 
                  className="flex-1 bg-purple-600/80 text-white flex items-center justify-center"
                  title={`Cluster Slack: ${activeEntry.clusterSlackBytes} bytes (Remaining cluster blocks)`}
                >
                  <span className="truncate px-1">CLUSTER SLACK ({activeEntry.clusterSlackBytes}B)</span>
                </div>
              </div>

              <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 pt-1">
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded bg-blue-600 inline-block" />
                  <span>Logical File (0 to EOF)</span>
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded bg-amber-600 inline-block" />
                  <span>RAM Slack (EOF to 512-byte Sector End)</span>
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded bg-purple-600 inline-block" />
                  <span>Cluster Slack (512-byte to 4096 Cluster End)</span>
                </span>
              </div>
            </div>

            {/* Hex & ASCII Slack Inspector Box */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs font-mono text-slate-400">
                <span className="text-white font-semibold flex items-center gap-1.5">
                  <Binary className="w-3.5 h-3.5 text-amber-400" />
                  <span>Slack Boundary Hex & ASCII Dump (Beyond Logical EOF)</span>
                </span>
                <span className="text-slate-500">Offset | Hex Bytes | ASCII Representation</span>
              </div>

              <div className="p-3 rounded-lg bg-[#05070d] border border-slate-800/90 font-mono text-xs overflow-x-auto">
                <pre className="text-amber-300 leading-relaxed select-text">
                  {activeEntry.hexDumpSample}
                </pre>
              </div>
            </div>

            {/* Residual Artifacts Detected Table */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-white flex items-center gap-1.5">
                  <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
                  <span>Recovered Artifacts in Slack Space</span>
                </span>
                <span className="text-[11px] text-slate-400 font-mono">
                  {activeEntry.discoveredArtifacts.length} Hit(s)
                </span>
              </div>

              <div className="overflow-x-auto border border-slate-800/80 rounded-lg">
                <table className="w-full text-left text-xs font-mono">
                  <thead className="bg-[#0e1320] text-slate-400 border-b border-slate-800 text-[11px]">
                    <tr>
                      <th className="p-2.5 font-semibold">Offset</th>
                      <th className="p-2.5 font-semibold">Anomaly Type</th>
                      <th className="p-2.5 font-semibold">Carved Residual Snippet</th>
                      <th className="p-2.5 font-semibold text-right">Confidence</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 text-[11px]">
                    {activeEntry.discoveredArtifacts.map((hit, idx) => (
                      <tr 
                        key={idx}
                        onClick={() => setSelectedHit(hit)}
                        className="hover:bg-slate-800/40 cursor-pointer transition-colors"
                      >
                        <td className="p-2.5 text-amber-400 font-bold">{hit.offsetHex}</td>
                        <td className="p-2.5">
                          <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700 text-[10px]">
                            {hit.type}
                          </span>
                        </td>
                        <td className="p-2.5 text-slate-200 max-w-[340px] truncate" title={hit.snippet}>
                          {hit.snippet}
                        </td>
                        <td className="p-2.5 text-right">
                          <span className="px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30 text-[10px]">
                            {hit.confidence}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Selected Hit Deep-Dive Drawer */}
            {selectedHit && (
              <div className="p-3 rounded-lg bg-[#0f0c08] border border-amber-900/50 text-xs space-y-1.5">
                <div className="flex items-center justify-between text-amber-400 font-bold">
                  <span>Selected Residual Hit: {selectedHit.type}</span>
                  <span className="font-mono text-[11px]">Offset: {selectedHit.offsetHex}</span>
                </div>
                <div className="text-slate-300 font-mono text-[11px] bg-black/40 p-2 rounded border border-slate-800 break-all select-all">
                  {selectedHit.snippet}
                </div>
                <p className="text-[11px] text-slate-400">
                  Forensic Significance: This data exists past the file's logical end of file. It was never cleared by the operating system upon allocation, preserving previous memory or disk contents.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
