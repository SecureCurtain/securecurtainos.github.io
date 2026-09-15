// jb7572_2026-09-04: Alternate Data Streams (ADS) Explorer & Extractor (fls -r, dir /R, streams)
import React, { useState } from 'react';
import { 
  AlternateDataStreamEntry, 
  MOCK_ADS_ENTRIES 
} from '../../../services/forensicsService';
import { 
  Paperclip, 
  Search, 
  ShieldAlert, 
  Download, 
  Terminal, 
  Copy, 
  CheckCircle2, 
  AlertTriangle, 
  Eye, 
  FileCode, 
  RefreshCw, 
  Globe, 
  ExternalLink,
  Lock
} from 'lucide-react';

interface AlternateDataStreamsTabProps {
  onNotify: (title: string, message: string) => void;
}

export const AlternateDataStreamsTab: React.FC<AlternateDataStreamsTabProps> = ({ onNotify }) => {
  const [adsEntries, setAdsEntries] = useState<AlternateDataStreamEntry[]>(MOCK_ADS_ENTRIES);
  const [selectedEntryId, setSelectedEntryId] = useState<string>(MOCK_ADS_ENTRIES[0].id);
  const [filterQuery, setFilterQuery] = useState('');
  const [classificationFilter, setClassificationFilter] = useState<string>('ALL');
  const [isScanning, setIsScanning] = useState(false);
  const [copiedLabel, setCopiedLabel] = useState<string | null>(null);

  const activeEntry = adsEntries.find(e => e.id === selectedEntryId) || adsEntries[0];

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedLabel(label);
    setTimeout(() => setCopiedLabel(null), 2000);
    onNotify('Copied to Clipboard', `Copied ${label}`);
  };

  const handleScanForStreams = () => {
    setIsScanning(true);
    onNotify('NTFS Alternate Data Stream Scan', 'Scanning MFT attributes across mounted partition for secondary $DATA streams...');

    setTimeout(() => {
      setIsScanning(false);
      onNotify('ADS Scan Completed', `Discovered ${adsEntries.length} Alternate Data Streams attached to host files.`);
    }, 700);
  };

  const handleExtractStream = (entry: AlternateDataStreamEntry) => {
    const dest = `/mnt/forensic_vault/EXTRACTED_STREAMS/${entry.id}_${entry.streamName.replace(':', '')}`;
    const updated = adsEntries.map(e => e.id === entry.id ? { ...e, extractedPath: dest } : e);
    setAdsEntries(updated);
    onNotify(
      'ADS Extracted to Vault',
      `Carved stream payload "${entry.streamName}" into ${dest}`
    );
  };

  const filteredEntries = adsEntries.filter(e => {
    const matchesQuery = e.parentFilePath.toLowerCase().includes(filterQuery.toLowerCase()) ||
                         e.streamName.toLowerCase().includes(filterQuery.toLowerCase()) ||
                         e.sha256.toLowerCase().includes(filterQuery.toLowerCase());
    const matchesClassification = classificationFilter === 'ALL' || e.detectionClassification === classificationFilter;
    return matchesQuery && matchesClassification;
  });

  return (
    <div className="space-y-5 text-slate-200">
      {/* Header Banner */}
      <div className="p-4 rounded-xl bg-gradient-to-r from-purple-950/40 via-violet-950/30 to-slate-900 border border-purple-900/40 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 rounded-lg bg-purple-500/20 border border-purple-400/30 text-purple-400">
            <Paperclip className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              NTFS Alternate Data Streams (ADS) Explorer & Extractor
              <span className="px-2 py-0.5 text-[10px] rounded-full bg-purple-500/20 text-purple-400 border border-purple-500/30">
                fls -r / streams / dir :*
              </span>
            </h3>
            <p className="text-xs text-slate-300 mt-0.5">
              Uncover hidden secondary streams attached to files that standard file managers fail to display, including Mark-of-the-Web (Zone.Identifier) and stealth malware stages.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleScanForStreams}
            disabled={isScanning}
            className="px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs transition-all flex items-center gap-1.5 shadow-sm"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isScanning ? 'animate-spin' : ''}`} />
            <span>{isScanning ? 'Scanning MFT...' : 'Re-Scan Partition'}</span>
          </button>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left Column: Discovered Streams List */}
        <div className="space-y-3">
          <div className="flex items-center justify-between pb-1">
            <div className="flex items-center space-x-2 text-xs font-semibold text-white">
              <Paperclip className="w-4 h-4 text-purple-400" />
              <span>Detected Streams ({filteredEntries.length})</span>
            </div>
            <span className="text-[11px] text-slate-400 font-mono">TSK fls</span>
          </div>

          {/* Search Input */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search file, stream name, hash..."
              value={filterQuery}
              onChange={e => setFilterQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-[#0a0e17] border border-slate-700 text-white font-mono text-xs focus:border-purple-500 outline-none"
            />
          </div>

          {/* Classification Filters */}
          <div className="flex items-center gap-1 overflow-x-auto pb-1 text-[10px] font-mono">
            {['ALL', 'SUSPICIOUS_PAYLOAD', 'COVERT_STORAGE', 'BENIGN_MOTW', 'OBFUSCATED_SCRIPT'].map(cat => (
              <button
                key={cat}
                onClick={() => setClassificationFilter(cat)}
                className={`px-2 py-0.5 rounded whitespace-nowrap transition-all ${
                  classificationFilter === cat
                    ? 'bg-purple-600 text-white font-bold'
                    : 'bg-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                {cat.replace('_', ' ')}
              </button>
            ))}
          </div>

          {/* Stream Cards */}
          <div className="space-y-2.5">
            {filteredEntries.map(entry => {
              const isSelected = entry.id === activeEntry.id;
              return (
                <div
                  key={entry.id}
                  onClick={() => setSelectedEntryId(entry.id)}
                  className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-[#191424] border-purple-500/60 shadow-lg shadow-purple-500/10 ring-1 ring-purple-500/40'
                      : 'bg-[#0a0e17] border-slate-800/80 hover:bg-[#120e1a] hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="font-bold text-xs text-white truncate max-w-[170px]" title={entry.streamName}>
                      <span className="text-purple-400">{entry.streamName}</span>
                    </div>
                    <span className={`text-[10px] px-2 py-0.5 rounded font-mono font-medium ${
                      entry.detectionClassification === 'SUSPICIOUS_PAYLOAD'
                        ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                        : entry.detectionClassification === 'COVERT_STORAGE'
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                        : entry.detectionClassification === 'OBFUSCATED_SCRIPT'
                        ? 'bg-orange-500/20 text-orange-300 border border-orange-500/40'
                        : 'bg-blue-500/20 text-blue-300 border border-blue-500/40'
                    }`}>
                      {entry.detectionClassification.replace('_', ' ')}
                    </span>
                  </div>

                  <div className="text-[10px] text-slate-400 font-mono truncate mb-2">
                    Host: {entry.parentFilePath.split('\\').pop()}
                  </div>

                  <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 pt-1 border-t border-slate-800/80">
                    <span>Stream: {entry.streamSizeBytes} bytes</span>
                    <span>Host: {(entry.parentFileSizeBytes / 1024).toFixed(1)} KB</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Terminal Syntax Reference */}
          <div className="p-3 rounded-lg bg-[#070a12] border border-slate-800/90 text-[11px] font-mono space-y-1.5 text-slate-400">
            <div className="text-slate-300 flex items-center gap-1">
              <Terminal className="w-3.5 h-3.5 text-purple-400" />
              <span>TSK & Windows Syntax:</span>
            </div>
            <code className="text-purple-300 block bg-black/50 p-1.5 rounded break-all select-all">
              fls -r -p /mnt/forensic_vault/evidence.raw | grep ":"
            </code>
            <code className="text-slate-400 block bg-black/50 p-1.5 rounded break-all select-all">
              dir /R C:\Users\Downloads\
            </code>
            <code className="text-slate-400 block bg-black/50 p-1.5 rounded break-all select-all">
              Get-Item C:\Temp\* -Stream *
            </code>
          </div>
        </div>

        {/* Right 2 Columns: Stream Deep-Dive Inspector */}
        <div className="lg:col-span-2 space-y-4">
          <div className="p-4 rounded-xl bg-[#0a0e17] border border-slate-800/90 space-y-4">
            {/* Active Stream Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-800/80 gap-2">
              <div>
                <h4 className="text-xs font-bold text-white font-mono flex items-center gap-2">
                  <span className="text-purple-400">{activeEntry.streamName}</span>
                  <span className="text-[10px] text-slate-400">attached to</span>
                  <span className="text-slate-300 truncate max-w-[240px]" title={activeEntry.parentFilePath}>
                    {activeEntry.parentFilePath.split('\\').pop()}
                  </span>
                </h4>
                <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                  Full ADS Pointer: {activeEntry.fullStreamPath}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleCopy(activeEntry.fullStreamPath, 'Full Stream Path')}
                  className="px-2.5 py-1 text-xs rounded bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 font-mono flex items-center gap-1 transition-all"
                >
                  <Copy className="w-3 h-3" />
                  <span>{copiedLabel === 'Full Stream Path' ? 'Copied!' : 'Copy Pointer'}</span>
                </button>

                <button
                  onClick={() => handleExtractStream(activeEntry)}
                  className="px-3 py-1 text-xs rounded bg-purple-600 hover:bg-purple-500 text-white font-semibold transition-all flex items-center gap-1.5 shadow-sm"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Extract to Vault</span>
                </button>
              </div>
            </div>

            {/* Stream Attributes Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-mono">
              <div className="p-3 rounded-lg bg-[#070a12] border border-slate-800 space-y-1.5">
                <div className="text-slate-400">Stream Size: <strong className="text-white">{activeEntry.streamSizeBytes} Bytes</strong></div>
                <div className="text-slate-400">Host File Size: <strong className="text-white">{activeEntry.parentFileSizeBytes.toLocaleString()} Bytes</strong></div>
                <div className="text-slate-400">Created: <strong className="text-slate-300">{activeEntry.createdUtc}</strong></div>
                <div className="text-slate-400">Classification: <strong className="text-amber-400">{activeEntry.detectionClassification}</strong></div>
              </div>

              <div className="p-3 rounded-lg bg-[#070a12] border border-slate-800 space-y-1.5">
                <div className="text-slate-400 truncate" title={activeEntry.sha256}>
                  SHA-256: <strong className="text-cyan-400">{activeEntry.sha256}</strong>
                </div>
                <div className="text-slate-400">
                  Vault Extraction: {activeEntry.extractedPath ? (
                    <strong className="text-emerald-400">{activeEntry.extractedPath}</strong>
                  ) : (
                    <span className="text-slate-500">Not yet carved</span>
                  )}
                </div>
                <div className="text-slate-400">
                  MFT Stream Attribute: <strong className="text-purple-400">$DATA "{activeEntry.streamName.replace(':', '')}"</strong>
                </div>
              </div>
            </div>

            {/* MOTW Metadata Banner (if Zone.Identifier) */}
            {activeEntry.motwMetadata && (
              <div className="p-3.5 rounded-lg bg-blue-950/20 border border-blue-900/40 space-y-2 text-xs">
                <div className="flex items-center gap-2 text-blue-400 font-bold">
                  <Globe className="w-4 h-4" />
                  <span>Mark-of-the-Web (Zone.Identifier) Decoded Evidence</span>
                </div>
                <div className="grid grid-cols-1 gap-1.5 font-mono text-[11px] text-slate-300">
                  <div>
                    Security Zone: <span className="px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 font-bold">ZoneId={activeEntry.motwMetadata.zoneId} (Internet Zone)</span>
                  </div>
                  {activeEntry.motwMetadata.hostUrl && (
                    <div className="truncate">
                      Host URL: <span className="text-cyan-400">{activeEntry.motwMetadata.hostUrl}</span>
                    </div>
                  )}
                  {activeEntry.motwMetadata.referrerUrl && (
                    <div className="truncate">
                      Referrer URL: <span className="text-slate-400">{activeEntry.motwMetadata.referrerUrl}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Payload Preview */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs font-mono text-slate-400">
                <span className="text-white font-semibold flex items-center gap-1.5">
                  <FileCode className="w-3.5 h-3.5 text-purple-400" />
                  <span>Stream Payload Content Preview</span>
                </span>
                <span className="text-slate-500">ASCII / Disassembly View</span>
              </div>

              <div className="p-3 rounded-lg bg-[#05070d] border border-slate-800/90 font-mono text-xs overflow-x-auto">
                <pre className="text-purple-300 leading-relaxed select-text whitespace-pre-wrap">
                  {activeEntry.previewSnippet}
                </pre>
              </div>
            </div>

            {activeEntry.detectionClassification === 'SUSPICIOUS_PAYLOAD' && (
              <div className="p-3 rounded-lg bg-rose-950/30 border border-rose-900/50 text-xs text-rose-300 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
                <span>
                  Evasion Technique (MITRE ATT&CK T1564.004): An executable PowerShell script was hidden inside an innocent Microsoft Word document stream to bypass endpoint file-extension monitors.
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
