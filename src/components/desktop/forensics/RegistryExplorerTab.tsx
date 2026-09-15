// jb7572_2026-09-01: Registry Explorer & TZWorks cfae Forensic Hive Parser
import React, { useState } from 'react';
import { 
  RegistryArtifactEntry, 
  MOCK_REGISTRY_ARTIFACTS 
} from '../../../services/forensicsService';
import { 
  FolderTree, 
  Search, 
  Database, 
  Terminal, 
  CheckCircle2, 
  Clock, 
  Copy, 
  FileText, 
  Layers, 
  Filter,
  HardDrive,
  Hash
} from 'lucide-react';

interface RegistryExplorerTabProps {
  onNotify: (title: string, message: string) => void;
}

export const RegistryExplorerTab: React.FC<RegistryExplorerTabProps> = ({ onNotify }) => {
  const [artifacts, setArtifacts] = useState<RegistryArtifactEntry[]>(MOCK_REGISTRY_ARTIFACTS);
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEntryId, setSelectedEntryId] = useState<string>(MOCK_REGISTRY_ARTIFACTS[0].id);

  const selectedEntry = artifacts.find(a => a.id === selectedEntryId) || artifacts[0];

  const filteredArtifacts = artifacts.filter(a => {
    if (selectedCategory !== 'ALL' && a.category !== selectedCategory) return false;
    if (!searchTerm) return true;
    const match = a.keyPath.toLowerCase().includes(searchTerm.toLowerCase()) ||
                  a.valueName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                  a.decodedValue.toLowerCase().includes(searchTerm.toLowerCase());
    return match;
  });

  const copyText = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    onNotify('Copied', `${label} copied to clipboard`);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-lg">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="p-2 bg-blue-500/20 text-blue-400 rounded-lg">
                <Database className="w-5 h-5" />
              </span>
              <h2 className="text-xl font-bold text-slate-100">Registry Explorer & TZWorks cfae Core</h2>
              <span className="px-2 py-0.5 text-xs font-semibold bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded-full">
                Hive Parser & ROT13 UserAssist Dissector
              </span>
            </div>
            <p className="text-xs text-slate-400 max-w-2xl">
              Inspect Windows registry hives (<code className="text-blue-300 font-mono">NTUSER.DAT</code>, <code className="text-blue-300 font-mono">SYSTEM</code>, <code className="text-blue-300 font-mono">SOFTWARE</code>, <code className="text-blue-300 font-mono">SAM</code>) with automated ROT13 UserAssist decoding, ShellBags folder history, ShimCache / AppCompatCache execution tracks, and USBSTOR device serial numbers.
            </p>
          </div>

          <div className="text-xs font-mono bg-slate-950 p-2.5 rounded-lg border border-slate-800 text-slate-300">
            <span className="text-slate-500">Engines:</span> Zimmerman Registry Explorer & TZWorks cfae
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Filter & Artifact List */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 space-y-4">
            {/* Category Filter Chips */}
            <div className="flex flex-wrap gap-1.5">
              {['ALL', 'UserAssist', 'ShellBags', 'ShimCache', 'USBSTOR', 'Run/RunOnce'].map(cat => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                    selectedCategory === cat
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Search Input */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search registry keys, values, or decoded artifacts..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg pl-9 pr-4 py-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
              />
            </div>

            {/* Artifact Table */}
            <div className="border border-slate-800 rounded-lg overflow-hidden max-h-[380px] overflow-y-auto custom-scrollbar">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-slate-950 text-slate-400 sticky top-0 border-b border-slate-800">
                  <tr>
                    <th className="p-2.5">Category</th>
                    <th className="p-2.5">Hive</th>
                    <th className="p-2.5">Decoded Forensic Value</th>
                    <th className="p-2.5">Last Write Time</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 bg-slate-900/60">
                  {filteredArtifacts.map(art => (
                    <tr
                      key={art.id}
                      onClick={() => setSelectedEntryId(art.id)}
                      className={`cursor-pointer transition-all ${
                        selectedEntryId === art.id
                          ? 'bg-blue-950/50 text-white'
                          : 'hover:bg-slate-800/50 text-slate-300'
                      }`}
                    >
                      <td className="p-2.5 font-bold text-blue-400">{art.category}</td>
                      <td className="p-2.5 text-slate-400">{art.hiveType}</td>
                      <td className="p-2.5 truncate max-w-[240px] text-slate-200">{art.decodedValue}</td>
                      <td className="p-2.5 text-slate-400 text-[11px]">{art.lastWriteTime}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Column: Selected Artifact Dissection */}
        <div className="lg:col-span-5 space-y-4">
          {selectedEntry && (
            <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div>
                  <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                    <Database className="w-4 h-4 text-blue-400" />
                    {selectedEntry.category} Forensic Artifact
                  </h3>
                  <div className="text-[11px] font-mono text-slate-400 mt-0.5">Hive: {selectedEntry.hiveType}</div>
                </div>
                <span className="px-2.5 py-1 text-xs font-mono bg-blue-500/20 text-blue-300 border border-blue-500/30 rounded-full">
                  {selectedEntry.flagsOrConfidence}
                </span>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <span className="text-slate-400 text-[11px]">Key Path:</span>
                  <code className="block bg-slate-950 p-2.5 rounded font-mono text-[11px] text-slate-300 border border-slate-800 break-all mt-1">
                    {selectedEntry.keyPath}
                  </code>
                </div>

                <div>
                  <span className="text-slate-400 text-[11px]">Raw Value Name:</span>
                  <code className="block bg-slate-950 p-2 rounded font-mono text-[11px] text-amber-300 border border-slate-800 break-all mt-1">
                    {selectedEntry.valueName}
                  </code>
                </div>

                {selectedEntry.rot13Decoded && (
                  <div className="bg-emerald-950/30 border border-emerald-800/40 p-3 rounded-lg space-y-1">
                    <div className="text-[11px] font-bold text-emerald-400">ROT13 Execution Analysis:</div>
                    <div className="text-xs font-mono text-emerald-200">{selectedEntry.rot13Decoded}</div>
                    {selectedEntry.executionCount && (
                      <div className="text-[11px] text-slate-400 mt-1">
                        Execution Count: {selectedEntry.executionCount} | Focus Time: {selectedEntry.focusTimeSecs}s
                      </div>
                    )}
                  </div>
                )}

                <div>
                  <span className="text-slate-400 text-[11px]">Decoded Artifact Meaning:</span>
                  <div className="bg-slate-950 p-2.5 rounded text-xs text-slate-200 border border-slate-800 mt-1">
                    {selectedEntry.decodedValue}
                  </div>
                </div>

                <div className="bg-slate-950 p-2.5 rounded border border-slate-800 flex items-center justify-between text-[11px] font-mono">
                  <span className="text-slate-400">Last Write Timestamp:</span>
                  <span className="text-slate-200">{selectedEntry.lastWriteTime}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
