// jb7572_2026-09-01: Plaso Super-Timeline Engine (log2timeline, Volatility Merge, mactime, psort -o l2tcsv)
import React, { useState } from 'react';
import { 
  SuperTimelineEntry, 
  MOCK_SUPER_TIMELINE 
} from '../../../services/forensicsService';
import { 
  Clock, 
  Search, 
  Play, 
  Download, 
  CheckCircle2, 
  FileSpreadsheet, 
  Terminal, 
  Layers, 
  Merge, 
  Zap, 
  ShieldCheck, 
  Copy,
  Sliders
} from 'lucide-react';

interface SuperTimelinePlasoTabProps {
  onNotify: (title: string, message: string) => void;
}

export const SuperTimelinePlasoTab: React.FC<SuperTimelinePlasoTabProps> = ({ onNotify }) => {
  const [timelineEntries, setTimelineEntries] = useState<SuperTimelineEntry[]>(MOCK_SUPER_TIMELINE);
  const [sourceFilter, setSourceFilter] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [isMergingPlaso, setIsMergingPlaso] = useState(false);
  const [mergeProgress, setMergeProgress] = useState(0);

  const handleMergeAndCompile = () => {
    setIsMergingPlaso(true);
    setMergeProgress(10);
    onNotify('Super-Timeline Pipeline Started', 'Running log2timeline on disk.plaso, merging Volatility 3 RAM timeliner events...');

    let prog = 10;
    const interval = setInterval(() => {
      prog += 20;
      if (prog >= 100) {
        prog = 100;
        clearInterval(interval);
        setIsMergingPlaso(false);
        setMergeProgress(100);

        const newEvent: SuperTimelineEntry = {
          index: timelineEntries.length + 1,
          timestamp: '2026-09-01 08:45:10.000 UTC',
          timezone: 'UTC',
          macb: 'M.CB',
          source: 'VOLATILITY_RAM',
          sourceType: 'Volatility 3 Process Exit',
          format: 'l2tcsv',
          description: 'Process terminated: PID 3840 powershell.exe by watchdog thread',
          inodeOrHandle: 'EPROCESS-0xfa8006e89020',
          confidence: 'HIGH'
        };

        setTimelineEntries(prev => [...prev, newEvent]);
        onNotify('Super-Timeline Generated', 'Successfully generated super-timeline.csv using psort -o l2tcsv (84,912 events compiled).');
      } else {
        setMergeProgress(prog);
      }
    }, 400);
  };

  const handleExportCsv = () => {
    const csvContent = [
      'Index,Timestamp (UTC),MACB,Source,Source Type,Format,Description,Inode/Handle,Confidence',
      ...timelineEntries.map(e => `"${e.index}","${e.timestamp}","${e.macb}","${e.source}","${e.sourceType}","${e.format}","${e.description.replace(/"/g, '""')}","${e.inodeOrHandle}","${e.confidence}"`)
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'super-timeline.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    onNotify('Exported CSV', 'Downloaded super-timeline.csv (l2tcsv compliant format)');
  };

  const filteredTimeline = timelineEntries.filter(t => {
    if (sourceFilter !== 'ALL' && t.source !== sourceFilter) return false;
    if (!searchTerm) return true;
    const match = t.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                  t.sourceType.toLowerCase().includes(searchTerm.toLowerCase()) ||
                  t.macb.toLowerCase().includes(searchTerm.toLowerCase()) ||
                  t.timestamp.toLowerCase().includes(searchTerm.toLowerCase());
    return match;
  });

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-lg">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="p-2 bg-emerald-500/20 text-emerald-400 rounded-lg">
                <Clock className="w-5 h-5" />
              </span>
              <h2 className="text-xl font-bold text-slate-100">Super-Timeline Engine (Plaso / psort / mactime)</h2>
              <span className="px-2 py-0.5 text-xs font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-full">
                Unified Disk + Memory Timeline
              </span>
            </div>
            <p className="text-xs text-slate-400 max-w-2xl">
              Extract and merge disk forensic storage (<code className="text-emerald-300 font-mono">disk.plaso</code>) with Volatility 3 volatile memory timelines using <code className="text-emerald-300 font-mono">log2timeline.py</code> and compile the unified court-admissible <code className="text-emerald-300 font-mono">super-timeline.csv</code> using <code className="text-emerald-300 font-mono">psort.py -o l2tcsv</code>.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportCsv}
              className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
              Export super-timeline.csv
            </button>
            <button
              onClick={handleMergeAndCompile}
              disabled={isMergingPlaso}
              className={`px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all shadow-md ${
                isMergingPlaso
                  ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                  : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-500/20'
              }`}
            >
              <Merge className="w-4 h-4" />
              {isMergingPlaso ? 'Compiling Plaso Pipeline...' : 'Run Plaso Merge & psort'}
            </button>
          </div>
        </div>
      </div>

      {/* Progress (if compiling) */}
      {isMergingPlaso && (
        <div className="bg-emerald-950/40 border border-emerald-800/50 rounded-xl p-4 space-y-2">
          <div className="flex justify-between text-xs font-mono text-emerald-300">
            <span>Running log2timeline.py, merging Volatility RAM events & mactime parser...</span>
            <span>{mergeProgress}%</span>
          </div>
          <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
            <div 
              className="bg-emerald-500 h-full transition-all duration-300 ease-out"
              style={{ width: `${mergeProgress}%` }}
            />
          </div>
        </div>
      )}

      {/* Main Timeline Explorer */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 space-y-4">
        {/* Filters & Search */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex flex-wrap gap-1.5">
            {['ALL', 'MFT', 'EVTX', 'REGISTRY', 'VOLATILITY_RAM', 'HIBERNATION', 'LOG2TIMELINE'].map(src => (
              <button
                key={src}
                onClick={() => setSourceFilter(src)}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                  sourceFilter === src
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                {src}
              </button>
            ))}
          </div>

          <div className="relative min-w-[280px]">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search super-timeline events or MACB..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg pl-9 pr-4 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
            />
          </div>
        </div>

        {/* Super Timeline Table */}
        <div className="border border-slate-800 rounded-lg overflow-hidden max-h-[480px] overflow-y-auto custom-scrollbar">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-slate-950 text-slate-400 sticky top-0 border-b border-slate-800">
              <tr>
                <th className="p-3">#</th>
                <th className="p-3">Timestamp (UTC)</th>
                <th className="p-3">MACB</th>
                <th className="p-3">Source</th>
                <th className="p-3">Source Type</th>
                <th className="p-3">Forensic Description & Activity</th>
                <th className="p-3">Confidence</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 bg-slate-900/60">
              {filteredTimeline.map(item => (
                <tr key={item.index} className="hover:bg-slate-800/50 transition-all text-slate-300">
                  <td className="p-3 text-slate-500">{item.index}</td>
                  <td className="p-3 font-semibold text-slate-200 whitespace-nowrap">{item.timestamp}</td>
                  <td className="p-3 font-bold text-amber-400">{item.macb}</td>
                  <td className="p-3">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-emerald-400 border border-emerald-500/20">
                      {item.source}
                    </span>
                  </td>
                  <td className="p-3 text-slate-400 text-[11px] whitespace-nowrap">{item.sourceType}</td>
                  <td className="p-3 text-slate-100 max-w-[380px] truncate">{item.description}</td>
                  <td className="p-3">
                    <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-500/10 text-emerald-400">
                      {item.confidence}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Footer info */}
        <div className="flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-800">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Format: Plaso l2tcsv (Log2Timeline) compatible with Autopsy, Timeline Explorer & Plaso Web UI</span>
          </div>
          <div className="font-mono text-slate-500 mt-1 sm:mt-0">
            Total correlated artifacts: {filteredTimeline.length}
          </div>
        </div>
      </div>
    </div>
  );
};
