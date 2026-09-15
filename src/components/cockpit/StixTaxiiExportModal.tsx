// jb7572_2026-09-02: STIX 2.1 & TAXII 2.1 Threat Intelligence Feed Export Modal & Live Simulator
import React, { useState, useMemo } from 'react';
import { 
  Radio, 
  Download, 
  Copy, 
  Check, 
  X, 
  Share2, 
  ShieldAlert, 
  ExternalLink, 
  FileText, 
  Terminal, 
  Layers, 
  RefreshCw,
  Code,
  Globe,
  Database,
  Hash,
  Activity,
  AlertCircle
} from 'lucide-react';
import { threatIntelFeedService, StixBundle, TaxiiEnvelope } from '../../services/threatIntelFeedService';
import { DetectedThreatObject, QuarantinedObject } from '../../types';

interface StixTaxiiExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  threats: DetectedThreatObject[];
  quarantinedList?: QuarantinedObject[];
  initialSelectedThreatId?: string;
  onRunCliCommand?: (cmd: string) => void;
}

type ExportFormat = 'STIX_21' | 'TAXII_21' | 'CSV_IOCS' | 'MISP_JSON' | 'TAXII_CURL';
type ScopeFilter = 'ALL' | 'CRITICAL_HIGH' | 'QUARANTINED' | 'TARGETED';

export const StixTaxiiExportModal: React.FC<StixTaxiiExportModalProps> = ({
  isOpen,
  onClose,
  threats,
  quarantinedList = [],
  initialSelectedThreatId,
  onRunCliCommand
}) => {
  const [selectedFormat, setSelectedFormat] = useState<ExportFormat>('STIX_21');
  const [scopeFilter, setScopeFilter] = useState<ScopeFilter>(initialSelectedThreatId ? 'TARGETED' : 'ALL');
  const [targetedThreatId, setTargetedThreatId] = useState<string>(initialSelectedThreatId || (threats[0]?.id || ''));
  const [copied, setCopied] = useState(false);
  const [isSimulatingApi, setIsSimulatingApi] = useState(false);
  const [apiSimulationResult, setApiSimulationResult] = useState<{
    status: number;
    latencyMs: number;
    headers: Record<string, string>;
  } | null>(null);

  // Filtered threats based on scope
  const targetThreats = useMemo(() => {
    switch (scopeFilter) {
      case 'CRITICAL_HIGH':
        return threats.filter(t => t.severity === 'CRITICAL' || t.severity === 'HIGH');
      case 'QUARANTINED':
        return threats.filter(t => t.currentAction === 'QUARANTINED' || t.quarantinedVaultId);
      case 'TARGETED':
        return threats.filter(t => t.id === targetedThreatId);
      case 'ALL':
      default:
        return threats;
    }
  }, [threats, scopeFilter, targetedThreatId]);

  // Generate artifacts
  const stixBundle: StixBundle = useMemo(() => {
    return threatIntelFeedService.generateStix21Bundle(targetThreats, quarantinedList);
  }, [targetThreats, quarantinedList]);

  const taxiiEnvelope: TaxiiEnvelope = useMemo(() => {
    return threatIntelFeedService.generateTaxiiEnvelope(targetThreats, quarantinedList);
  }, [targetThreats, quarantinedList]);

  const iocCsv = useMemo(() => {
    return threatIntelFeedService.generateIocCsv(targetThreats);
  }, [targetThreats]);

  const mispJson = useMemo(() => {
    return threatIntelFeedService.generateMispEvent(targetThreats, quarantinedList);
  }, [targetThreats, quarantinedList]);

  const taxiiCollectionInfo = useMemo(() => {
    return threatIntelFeedService.getTaxiiCollectionInfo();
  }, []);

  // Generated Text Content
  const generatedContent = useMemo(() => {
    switch (selectedFormat) {
      case 'STIX_21':
        return JSON.stringify(stixBundle, null, 2);
      case 'TAXII_21':
        return JSON.stringify(taxiiEnvelope, null, 2);
      case 'CSV_IOCS':
        return iocCsv;
      case 'MISP_JSON':
        return JSON.stringify(mispJson, null, 2);
      case 'TAXII_CURL':
        return `# TAXII 2.1 Feed Client Ingestion Script (SecureCurtain HIPS)
# 1. Discover TAXII API Root
curl -s -H "Accept: application/taxii+json;version=2.1" \\
     https://os.securecurtain.io/taxii2/ \\
     | jq .

# 2. Query Collection Metadata
curl -s -H "Accept: application/taxii+json;version=2.1" \\
     https://os.securecurtain.io/taxii2/collections/${taxiiCollectionInfo.id}/ \\
     | jq .

# 3. Pull STIX 2.1 Threat Objects (SIEM / SOAR Live Ingestion)
curl -s -H "Accept: application/stix+json;version=2.1" \\
     https://os.securecurtain.io/taxii2/collections/${taxiiCollectionInfo.id}/objects/ \\
     | jq '.objects[] | {type: .type, name: .name, pattern: .pattern}'

# 4. Optional: Stream using Python taxii2-client
python3 -c "
from taxii2client.v21 import Collection
col = Collection('https://os.securecurtain.io/taxii2/collections/${taxiiCollectionInfo.id}/')
bundle = col.get_objects()
print(f'Ingested {len(bundle.get(\"objects\", []))} threat indicators from SecureCurtain HIPS.')
"`;
      default:
        return '';
    }
  }, [selectedFormat, stixBundle, taxiiEnvelope, iocCsv, mispJson, taxiiCollectionInfo]);

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const timestamp = new Date().toISOString().slice(0, 10);
    switch (selectedFormat) {
      case 'STIX_21':
        threatIntelFeedService.downloadFile(generatedContent, `securecurtain_stix21_${timestamp}.json`, 'application/json');
        break;
      case 'TAXII_21':
        threatIntelFeedService.downloadFile(generatedContent, `securecurtain_taxii_envelope_${timestamp}.json`, 'application/json');
        break;
      case 'CSV_IOCS':
        threatIntelFeedService.downloadFile(generatedContent, `securecurtain_iocs_${timestamp}.csv`, 'text/csv');
        break;
      case 'MISP_JSON':
        threatIntelFeedService.downloadFile(generatedContent, `securecurtain_misp_event_${timestamp}.json`, 'application/json');
        break;
      case 'TAXII_CURL':
        threatIntelFeedService.downloadFile(generatedContent, `taxii_sync_client.sh`, 'text/x-shellscript');
        break;
    }
  };

  const handleSimulateApiHandshake = () => {
    setIsSimulatingApi(true);
    setApiSimulationResult(null);
    setTimeout(() => {
      setIsSimulatingApi(false);
      setApiSimulationResult({
        status: 200,
        latencyMs: 38,
        headers: {
          'content-type': selectedFormat === 'TAXII_21' ? 'application/taxii+json;version=2.1' : 'application/stix+json;version=2.1',
          'x-taxii-collection': taxiiCollectionInfo.id,
          'x-stix-spec-version': '2.1',
          'access-control-allow-origin': '*',
          'server': 'SecureCurtain-HIPS-TAXII/2.1'
        }
      });
    }, 450);
  };

  // Metrics calculation
  const indicatorCount = stixBundle.objects.filter(o => o.type === 'indicator').length;
  const malwareCount = stixBundle.objects.filter(o => o.type === 'malware').length;
  const attackPatternCount = stixBundle.objects.filter(o => o.type === 'attack-pattern').length;
  const relationshipCount = stixBundle.objects.filter(o => o.type === 'relationship').length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="bg-[#0b0f19] border border-white/15 rounded-2xl w-full max-w-5xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden font-sans">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-[#121827]">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-purple-500/20 to-indigo-500/20 border border-purple-500/40 text-purple-300">
              <Share2 className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white tracking-wide">
                  STIX 2.1 & TAXII 2.1 Threat Intelligence Export
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-purple-950/80 border border-purple-400/50 text-purple-300">
                  OASIS Open Standard
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-amber-950/80 border border-amber-400/50 text-amber-300">
                  TLP:AMBER+STRICT
                </span>
              </div>
              <p className="text-xs text-[#8fa0b5] font-mono">
                Automated translation of HIPS kernel traps, memory stagers, and BYOVD signatures into interoperable threat feeds.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#8fa0b5] hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          
          {/* Top Controls: Format Selection & Scope */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Format Picker */}
            <div className="bg-black/40 p-3.5 rounded-xl border border-white/10 space-y-2">
              <label className="text-xs font-mono text-[#8fa0b5] block flex items-center justify-between">
                <span>Standard Specification / Feed Format</span>
                <span className="text-[10px] text-purple-400">RFC 2.1 Compliant</span>
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 text-xs font-mono">
                <button
                  onClick={() => setSelectedFormat('STIX_21')}
                  className={`px-3 py-2 rounded-lg border text-left flex flex-col transition-all cursor-pointer ${
                    selectedFormat === 'STIX_21'
                      ? 'bg-purple-950/60 border-purple-400 text-purple-200 shadow-md shadow-purple-950/50'
                      : 'bg-[#151b2b] border-white/10 text-zinc-400 hover:text-white'
                  }`}
                >
                  <span className="font-bold">STIX 2.1</span>
                  <span className="text-[10px] opacity-70">OASIS JSON Bundle</span>
                </button>

                <button
                  onClick={() => setSelectedFormat('TAXII_21')}
                  className={`px-3 py-2 rounded-lg border text-left flex flex-col transition-all cursor-pointer ${
                    selectedFormat === 'TAXII_21'
                      ? 'bg-purple-950/60 border-purple-400 text-purple-200 shadow-md shadow-purple-950/50'
                      : 'bg-[#151b2b] border-white/10 text-zinc-400 hover:text-white'
                  }`}
                >
                  <span className="font-bold">TAXII 2.1</span>
                  <span className="text-[10px] opacity-70">Server Envelope</span>
                </button>

                <button
                  onClick={() => setSelectedFormat('CSV_IOCS')}
                  className={`px-3 py-2 rounded-lg border text-left flex flex-col transition-all cursor-pointer ${
                    selectedFormat === 'CSV_IOCS'
                      ? 'bg-purple-950/60 border-purple-400 text-purple-200 shadow-md shadow-purple-950/50'
                      : 'bg-[#151b2b] border-white/10 text-zinc-400 hover:text-white'
                  }`}
                >
                  <span className="font-bold">SIEM CSV</span>
                  <span className="text-[10px] opacity-70">Splunk / Elastic</span>
                </button>

                <button
                  onClick={() => setSelectedFormat('MISP_JSON')}
                  className={`px-3 py-2 rounded-lg border text-left flex flex-col transition-all cursor-pointer ${
                    selectedFormat === 'MISP_JSON'
                      ? 'bg-purple-950/60 border-purple-400 text-purple-200 shadow-md shadow-purple-950/50'
                      : 'bg-[#151b2b] border-white/10 text-zinc-400 hover:text-white'
                  }`}
                >
                  <span className="font-bold">MISP Feed</span>
                  <span className="text-[10px] opacity-70">Event Attributes</span>
                </button>

                <button
                  onClick={() => setSelectedFormat('TAXII_CURL')}
                  className={`px-3 py-2 rounded-lg border text-left flex flex-col transition-all cursor-pointer col-span-2 sm:col-span-2 ${
                    selectedFormat === 'TAXII_CURL'
                      ? 'bg-purple-950/60 border-purple-400 text-purple-200 shadow-md shadow-purple-950/50'
                      : 'bg-[#151b2b] border-white/10 text-zinc-400 hover:text-white'
                  }`}
                >
                  <span className="font-bold flex items-center gap-1">
                    <Terminal className="w-3 h-3 text-purple-400" />
                    TAXII cURL Client
                  </span>
                  <span className="text-[10px] opacity-70">Automated Pull Script</span>
                </button>
              </div>
            </div>

            {/* Scope Filter */}
            <div className="bg-black/40 p-3.5 rounded-xl border border-white/10 space-y-2">
              <label className="text-xs font-mono text-[#8fa0b5] block flex items-center justify-between">
                <span>Threat Filter & Scope</span>
                <span className="text-[10px] text-emerald-400">{targetThreats.length} Threats Included</span>
              </label>
              
              <div className="grid grid-cols-2 gap-1.5 text-xs font-mono">
                <button
                  onClick={() => setScopeFilter('ALL')}
                  className={`px-2.5 py-1.5 rounded-lg border text-left transition-all ${
                    scopeFilter === 'ALL'
                      ? 'bg-emerald-950/60 border-emerald-400 text-emerald-200'
                      : 'bg-[#151b2b] border-white/10 text-zinc-400 hover:text-white'
                  }`}
                >
                  All Threats ({threats.length})
                </button>

                <button
                  onClick={() => setScopeFilter('CRITICAL_HIGH')}
                  className={`px-2.5 py-1.5 rounded-lg border text-left transition-all ${
                    scopeFilter === 'CRITICAL_HIGH'
                      ? 'bg-red-950/60 border-red-400 text-red-200'
                      : 'bg-[#151b2b] border-white/10 text-zinc-400 hover:text-white'
                  }`}
                >
                  Critical & High Only
                </button>

                <button
                  onClick={() => setScopeFilter('QUARANTINED')}
                  className={`px-2.5 py-1.5 rounded-lg border text-left transition-all ${
                    scopeFilter === 'QUARANTINED'
                      ? 'bg-purple-950/60 border-purple-400 text-purple-200'
                      : 'bg-[#151b2b] border-white/10 text-zinc-400 hover:text-white'
                  }`}
                >
                  Quarantined Only
                </button>

                <button
                  onClick={() => setScopeFilter('TARGETED')}
                  className={`px-2.5 py-1.5 rounded-lg border text-left transition-all ${
                    scopeFilter === 'TARGETED'
                      ? 'bg-cyan-950/60 border-cyan-400 text-cyan-200'
                      : 'bg-[#151b2b] border-white/10 text-zinc-400 hover:text-white'
                  }`}
                >
                  Single Threat Focus
                </button>
              </div>

              {scopeFilter === 'TARGETED' && (
                <div className="pt-2">
                  <select
                    value={targetedThreatId}
                    onChange={(e) => setTargetedThreatId(e.target.value)}
                    className="w-full bg-[#151b2b] border border-white/20 rounded-lg px-2 py-1.5 text-xs text-white font-mono focus:outline-none focus:border-purple-400"
                  >
                    {threats.map(t => (
                      <option key={t.id} value={t.id}>
                        [{t.severity}] {t.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          </div>

          {/* Metrics summary banner */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-[#121827] border border-white/10 p-3 rounded-xl">
              <div className="flex items-center gap-2 text-purple-400 text-xs font-mono mb-1">
                <Layers className="w-3.5 h-3.5" />
                <span>Total STIX Objects</span>
              </div>
              <p className="text-xl font-mono font-bold text-white">{stixBundle.objects.length}</p>
              <p className="text-[10px] text-zinc-500 font-mono">SDOs & SRO relationships</p>
            </div>

            <div className="bg-[#121827] border border-white/10 p-3 rounded-xl">
              <div className="flex items-center gap-2 text-cyan-400 text-xs font-mono mb-1">
                <Hash className="w-3.5 h-3.5" />
                <span>Active Indicators</span>
              </div>
              <p className="text-xl font-mono font-bold text-cyan-300">{indicatorCount}</p>
              <p className="text-[10px] text-zinc-500 font-mono">Hashes, C2s & YARA</p>
            </div>

            <div className="bg-[#121827] border border-white/10 p-3 rounded-xl">
              <div className="flex items-center gap-2 text-red-400 text-xs font-mono mb-1">
                <ShieldAlert className="w-3.5 h-3.5" />
                <span>Malware Entities</span>
              </div>
              <p className="text-xl font-mono font-bold text-red-300">{malwareCount}</p>
              <p className="text-[10px] text-zinc-500 font-mono">Isolated threats</p>
            </div>

            <div className="bg-[#121827] border border-white/10 p-3 rounded-xl">
              <div className="flex items-center gap-2 text-amber-400 text-xs font-mono mb-1">
                <Activity className="w-3.5 h-3.5" />
                <span>ATT&CK Techniques</span>
              </div>
              <p className="text-xl font-mono font-bold text-amber-300">{attackPatternCount}</p>
              <p className="text-[10px] text-zinc-500 font-mono">MITRE mapped</p>
            </div>
          </div>

          {/* TAXII Endpoint Live Simulator */}
          <div className="bg-[#121827] border border-purple-500/20 rounded-xl p-3.5 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Globe className="w-4 h-4 text-purple-400" />
                <span className="text-xs font-bold text-white font-mono">
                  TAXII 2.1 REST Collection Endpoint:
                </span>
                <code className="text-[11px] font-mono bg-black/60 px-2 py-0.5 rounded text-purple-300 border border-purple-500/30">
                  /taxii2/collections/{taxiiCollectionInfo.id}/objects/
                </code>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleSimulateApiHandshake}
                  disabled={isSimulatingApi}
                  className="px-3 py-1 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-xs font-mono font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <RefreshCw className={`w-3 h-3 ${isSimulatingApi ? 'animate-spin' : ''}`} />
                  <span>Test API Handshake</span>
                </button>

                {onRunCliCommand && (
                  <button
                    onClick={() => onRunCliCommand(`curl -s -H "Accept: application/taxii+json;version=2.1" https://os.securecurtain.io/taxii2/collections/${taxiiCollectionInfo.id}/objects/`)}
                    className="px-2.5 py-1 bg-black/40 hover:bg-black/60 border border-white/20 text-zinc-300 rounded-lg text-xs font-mono flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Terminal className="w-3 h-3 text-purple-400" />
                    <span>Run in CLI</span>
                  </button>
                )}
              </div>
            </div>

            {apiSimulationResult && (
              <div className="p-2.5 rounded-lg bg-black/60 border border-emerald-500/40 text-[11px] font-mono text-emerald-300 flex flex-wrap items-center justify-between gap-2 animate-in fade-in">
                <div className="flex items-center gap-2">
                  <span className="px-1.5 py-0.2 rounded bg-emerald-950 border border-emerald-500 font-bold">
                    HTTP/2 {apiSimulationResult.status} OK
                  </span>
                  <span>Latency: {apiSimulationResult.latencyMs}ms</span>
                  <span>Content-Type: {apiSimulationResult.headers['content-type']}</span>
                </div>
                <span className="text-zinc-400 text-[10px]">
                  Collection media: application/stix+json;version=2.1
                </span>
              </div>
            )}
          </div>

          {/* Code Viewer Panel */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-mono text-[#8fa0b5]">
              <div className="flex items-center gap-2">
                <Code className="w-3.5 h-3.5 text-purple-400" />
                <span>Generated Output Preview</span>
                <span className="text-[10px] text-zinc-500 font-mono">
                  ({(generatedContent.length / 1024).toFixed(1)} KB)
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopy}
                  className="px-2.5 py-1 bg-[#151b2b] hover:bg-[#1e273d] border border-white/15 rounded-lg text-xs font-mono text-white flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-emerald-400">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-zinc-400" />
                      <span>Copy Buffer</span>
                    </>
                  )}
                </button>

                <button
                  onClick={handleDownload}
                  className="px-3 py-1 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-lg text-xs font-mono font-bold flex items-center gap-1.5 transition-all shadow-md shadow-purple-600/30 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download File</span>
                </button>
              </div>
            </div>

            <div className="relative">
              <pre className="p-4 rounded-xl bg-black/80 border border-white/15 text-purple-200 font-mono text-xs overflow-x-auto max-h-72 leading-relaxed selection:bg-purple-900 selection:text-white">
                {generatedContent}
              </pre>
            </div>
          </div>

        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between px-6 py-3.5 border-t border-white/10 bg-[#121827] text-xs font-mono text-[#8fa0b5]">
          <div className="flex items-center gap-4">
            <span>Identity: SecureCurtain HIPS Sentinel</span>
            <span>Spec: STIX 2.1 / TAXII 2.1</span>
            <span className="text-emerald-400">Status: Enforcing & Synchronized</span>
          </div>

          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-white/10 hover:bg-white/15 text-white rounded-lg text-xs font-mono transition-colors"
          >
            Close Feed Viewer
          </button>
        </div>

      </div>
    </div>
  );
};
