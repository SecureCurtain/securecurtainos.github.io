// jb7572_2026-09-02: Encrypted IndexedDB Persistent Vault GUI
// Client-side AES-GCM-256 authenticated encryption workbench for quarantined threats, memory dumps & STIX intel

import React, { useState, useEffect, useId } from 'react';
import { 
  Lock, 
  Unlock, 
  Key, 
  Shield, 
  ShieldCheck, 
  ShieldAlert, 
  Database, 
  RefreshCw, 
  Download, 
  Upload, 
  Trash2, 
  Eye, 
  EyeOff, 
  FileText, 
  Check, 
  Copy, 
  Search, 
  Filter, 
  Sparkles, 
  Cpu, 
  AlertTriangle, 
  Layers,
  Bug,
  Binary,
  Code2,
  Share2,
  HardDrive
} from 'lucide-react';
import { 
  encryptedVaultService, 
  DEFAULT_VAULT_PASSPHRASE 
} from '../../services/encryptedVaultService';
import { 
  EncryptedVaultRecord, 
  DecryptedVaultRecord, 
  VaultEngineStatus, 
  VaultRecordType 
} from '../../types';

interface EncryptedVaultGUIProps {
  onRunCliCommand?: (cmd: string) => void;
  onNavigateToQuarantine?: () => void;
}

export const EncryptedVaultGUI: React.FC<EncryptedVaultGUIProps> = ({ 
  onRunCliCommand,
  onNavigateToQuarantine
}) => {
  const [status, setStatus] = useState<VaultEngineStatus>(() => encryptedVaultService.getStatus());
  const [records, setRecords] = useState<EncryptedVaultRecord[]>(() => encryptedVaultService.getAllRecords());
  const [selectedRecord, setSelectedRecord] = useState<EncryptedVaultRecord | null>(null);
  const [decryptedRecord, setDecryptedRecord] = useState<DecryptedVaultRecord | null>(null);
  const [isDecrypting, setIsDecrypting] = useState(false);

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('ALL');

  // Modals & Passphrase states
  const [showUnlockModal, setShowUnlockModal] = useState(false);
  const [unlockPassphrase, setUnlockPassphrase] = useState('');
  const [showPassphraseText, setShowPassphraseText] = useState(false);
  const [unlockError, setUnlockError] = useState<string | null>(null);

  const [showReKeyModal, setShowReKeyModal] = useState(false);
  const [oldPassphrase, setOldPassphrase] = useState('');
  const [newPassphrase, setNewPassphrase] = useState('');
  const [reKeyError, setReKeyError] = useState<string | null>(null);

  const [showRestoreModal, setShowRestoreModal] = useState(false);
  const [restoreJsonInput, setRestoreJsonInput] = useState('');
  const [restoreError, setRestoreError] = useState<string | null>(null);

  // Notifications
  const [bannerNotice, setBannerNotice] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isAuditing, setIsAuditing] = useState(false);

  // Unique IDs for accessibility
  const searchInputId = useId();
  const filterSelectId = useId();
  const unlockPassphraseId = useId();
  const oldPassphraseId = useId();
  const newPassphraseId = useId();
  const restoreJsonId = useId();

  const refreshState = () => {
    setStatus(encryptedVaultService.getStatus());
    setRecords(encryptedVaultService.getAllRecords());
  };

  useEffect(() => {
    // Wait for service initial bootstrap
    encryptedVaultService.waitUntilReady().then(() => {
      refreshState();
    });
  }, []);

  const notify = (message: string, type: 'success' | 'error' = 'success') => {
    setBannerNotice({ message, type });
    setTimeout(() => setBannerNotice(null), 4000);
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Lock Vault
  const handleLock = () => {
    encryptedVaultService.lockVault();
    setSelectedRecord(null);
    setDecryptedRecord(null);
    refreshState();
    notify('Encrypted Vault locked. Active cryptographic key cleared from volatile memory.');
  };

  // Unlock Vault
  const handleUnlock = async () => {
    if (!unlockPassphrase.trim()) {
      setUnlockError('Master passphrase cannot be empty.');
      return;
    }
    setUnlockError(null);
    try {
      await encryptedVaultService.unlockVault(unlockPassphrase);
      setShowUnlockModal(false);
      setUnlockPassphrase('');
      refreshState();
      notify('Vault unlocked successfully. Cryptographic session established.');
    } catch (err: any) {
      setUnlockError(err?.message || 'Decryption failed. Invalid passphrase.');
    }
  };

  // Re-Key Vault
  const handleReKey = async () => {
    if (!oldPassphrase || !newPassphrase) {
      setReKeyError('Both current and new passphrases are required.');
      return;
    }
    if (newPassphrase.length < 8) {
      setReKeyError('New passphrase must be at least 8 characters long.');
      return;
    }
    setReKeyError(null);
    try {
      await encryptedVaultService.changePassphrase(oldPassphrase, newPassphrase);
      setShowReKeyModal(false);
      setOldPassphrase('');
      setNewPassphrase('');
      refreshState();
      notify('Master key rotated successfully. All vault records re-encrypted.');
    } catch (err: any) {
      setReKeyError(err?.message || 'Failed to re-key vault. Check your old passphrase.');
    }
  };

  // Sync Quarantine Vault
  const handleSyncQuarantine = async () => {
    if (status.state !== 'UNLOCKED') {
      setShowUnlockModal(true);
      return;
    }
    try {
      const res = await encryptedVaultService.syncQuarantineVault();
      refreshState();
      notify(`Sync complete: ${res.synced} new artifacts encrypted into IndexedDB (${res.skipped} already archived).`);
    } catch (err: any) {
      notify(err?.message || 'Sync failed.', 'error');
    }
  };

  // Audit Integrity
  const handleAuditIntegrity = async () => {
    if (status.state !== 'UNLOCKED') {
      setShowUnlockModal(true);
      return;
    }
    setIsAuditing(true);
    try {
      const res = await encryptedVaultService.auditIntegrity();
      refreshState();
      if (res.status === 'VERIFIED') {
        notify(`Integrity Audit Passed: ${res.verified} of ${records.length} records cryptographically intact.`);
      } else {
        notify(`Integrity Alert: ${res.corrupted.length} corrupted records detected!`, 'error');
      }
    } catch (err: any) {
      notify(err?.message || 'Integrity audit failed.', 'error');
    } finally {
      setIsAuditing(false);
    }
  };

  // Decrypt Record for Inspection
  const handleInspectRecord = async (record: EncryptedVaultRecord) => {
    if (status.state !== 'UNLOCKED') {
      setShowUnlockModal(true);
      return;
    }
    setSelectedRecord(record);
    setIsDecrypting(true);
    try {
      const dec = await encryptedVaultService.decryptRecord(record.id);
      setDecryptedRecord(dec);
    } catch (err: any) {
      notify(err?.message || 'Decryption failed for this record.', 'error');
    } finally {
      setIsDecrypting(false);
    }
  };

  // Delete Record
  const handleDeleteRecord = async (id: string, title: string) => {
    if (!confirm(`Are you sure you want to permanently purge "${title}" from the encrypted vault?`)) {
      return;
    }
    try {
      await encryptedVaultService.deleteRecord(id);
      if (selectedRecord?.id === id) {
        setSelectedRecord(null);
        setDecryptedRecord(null);
      }
      refreshState();
      notify(`Record purged from encrypted storage.`);
    } catch (err: any) {
      notify(err?.message || 'Failed to delete record.', 'error');
    }
  };

  // Export Vault Backup
  const handleExportBackup = async () => {
    try {
      const backupJson = await encryptedVaultService.exportVaultBackup();
      const blob = new Blob([backupJson], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `securecurtain_vault_backup_${new Date().toISOString().split('T')[0]}.scvault`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      notify('Encrypted vault archive (.scvault) exported successfully.');
    } catch (err: any) {
      notify(err?.message || 'Failed to export backup.', 'error');
    }
  };

  // Restore Backup
  const handleRestoreBackup = async () => {
    if (!restoreJsonInput.trim()) {
      setRestoreError('Please paste valid vault backup JSON content.');
      return;
    }
    setRestoreError(null);
    try {
      const res = await encryptedVaultService.importVaultBackup(restoreJsonInput);
      setShowRestoreModal(false);
      setRestoreJsonInput('');
      refreshState();
      notify(`Vault restored: ${res.importedCount} encrypted records successfully imported into IndexedDB.`);
    } catch (err: any) {
      setRestoreError(err?.message || 'Restore failed. Invalid backup format.');
    }
  };

  // Filtered records
  const filteredRecords = records.filter(r => {
    const matchesQuery = !searchQuery || 
      r.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.sha256Hash.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (r.metadata.originalFileName && r.metadata.originalFileName.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesType = filterType === 'ALL' || r.type === filterType;
    return matchesQuery && matchesType;
  });

  const getTypeIcon = (type: VaultRecordType) => {
    switch (type) {
      case 'QUARANTINE_ARTIFACT':
        return <Bug className="w-4 h-4 text-red-400" />;
      case 'MEMORY_DUMP':
        return <Cpu className="w-4 h-4 text-amber-400" />;
      case 'WASM_DISASSEMBLY':
        return <Binary className="w-4 h-4 text-cyan-400" />;
      case 'YARA_RULESET':
        return <Code2 className="w-4 h-4 text-emerald-400" />;
      case 'STIX_THREAT_INTEL':
        return <Share2 className="w-4 h-4 text-purple-400" />;
      default:
        return <FileText className="w-4 h-4 text-zinc-400" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Banner Notice */}
      {bannerNotice && (
        <div className={`p-3 rounded-xl border flex items-center justify-between transition-all ${
          bannerNotice.type === 'error'
            ? 'bg-red-950/80 border-red-500/50 text-red-200'
            : 'bg-emerald-950/80 border-emerald-500/50 text-emerald-200'
        }`}>
          <div className="flex items-center gap-2 text-xs font-mono">
            {bannerNotice.type === 'error' ? <AlertTriangle className="w-4 h-4 text-red-400" /> : <Check className="w-4 h-4 text-emerald-400" />}
            <span>{bannerNotice.message}</span>
          </div>
          <button 
            onClick={() => setBannerNotice(null)}
            className="text-xs text-zinc-400 hover:text-white px-2 py-0.5 rounded"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Security Status Card & Engine Specs */}
      <div className="bg-zinc-900/90 border border-white/10 rounded-2xl p-5 shadow-2xl relative overflow-hidden backdrop-blur-md">
        <div className="absolute -right-16 -top-16 w-64 h-64 bg-purple-500/5 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-white/10">
          <div className="flex items-center gap-3.5">
            <div className={`p-3 rounded-xl border shadow-inner ${
              status.state === 'UNLOCKED'
                ? 'bg-emerald-950/60 border-emerald-500/50 text-emerald-400 shadow-emerald-950/50'
                : 'bg-red-950/60 border-red-500/50 text-red-400 shadow-red-950/50'
            }`}>
              {status.state === 'UNLOCKED' ? <Unlock className="w-6 h-6" /> : <Lock className="w-6 h-6" />}
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h3 className="text-base font-bold text-white font-mono tracking-tight">
                  IndexedDB Encrypted Vault
                </h3>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono border ${
                  status.state === 'UNLOCKED'
                    ? 'bg-emerald-950/80 text-emerald-300 border-emerald-500/50'
                    : 'bg-red-950/80 text-red-300 border-red-500/50'
                }`}>
                  {status.state}
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-purple-950/80 text-purple-300 border border-purple-500/40">
                  AES-GCM-256
                </span>
              </div>
              <p className="text-xs text-zinc-400 mt-0.5">
                Client-side zero-knowledge encrypted repository for quarantined binaries, memory dumps, and STIX threat feeds.
              </p>
            </div>
          </div>

          {/* Master Lock / Unlock / Actions */}
          <div className="flex items-center gap-2 flex-wrap">
            {status.state === 'UNLOCKED' ? (
              <>
                <button
                  onClick={handleLock}
                  className="px-3 py-1.5 rounded-xl bg-red-950/80 hover:bg-red-900 border border-red-500/50 text-red-200 text-xs font-mono font-bold flex items-center gap-2 transition-all shadow-md shadow-red-950/40 cursor-pointer"
                  title="Zero out active key and lock vault"
                >
                  <Lock className="w-3.5 h-3.5 text-red-400" />
                  <span>Lock Vault</span>
                </button>
                <button
                  onClick={() => setShowReKeyModal(true)}
                  className="px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 border border-white/10 text-zinc-200 text-xs font-mono flex items-center gap-2 transition-all cursor-pointer"
                  title="Rotate master passphrase"
                >
                  <Key className="w-3.5 h-3.5 text-amber-400" />
                  <span>Rotate Master Key</span>
                </button>
              </>
            ) : (
              <button
                onClick={() => setShowUnlockModal(true)}
                className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-emerald-950 to-teal-950 hover:from-emerald-900 hover:to-teal-900 border border-emerald-500/50 text-emerald-200 text-xs font-mono font-bold flex items-center gap-2 transition-all shadow-lg shadow-emerald-950/50 cursor-pointer"
              >
                <Unlock className="w-3.5 h-3.5 text-emerald-400" />
                <span>Unlock Vault</span>
              </button>
            )}

            <button
              onClick={handleAuditIntegrity}
              disabled={isAuditing}
              className="px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 border border-white/10 text-zinc-200 text-xs font-mono flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50"
              title="Cryptographically verify SHA-256 hashes and AES-GCM auth tags across all records"
            >
              <ShieldCheck className={`w-3.5 h-3.5 ${isAuditing ? 'animate-spin text-cyan-400' : 'text-emerald-400'}`} />
              <span>{isAuditing ? 'Auditing...' : 'Audit Integrity'}</span>
            </button>
          </div>
        </div>

        {/* Cryptographic Telemetry Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3 mt-4 pt-1">
          <div className="bg-black/40 border border-white/5 rounded-xl p-2.5">
            <span className="text-[10px] text-zinc-500 font-mono uppercase block">Total Records</span>
            <span className="text-sm font-bold text-white font-mono">{status.totalRecords} Items</span>
          </div>

          <div className="bg-black/40 border border-white/5 rounded-xl p-2.5">
            <span className="text-[10px] text-zinc-500 font-mono uppercase block">Encrypted Storage</span>
            <span className="text-sm font-bold text-cyan-400 font-mono">
              {(status.totalStorageBytes / 1024).toFixed(1)} KB
            </span>
          </div>

          <div className="bg-black/40 border border-white/5 rounded-xl p-2.5">
            <span className="text-[10px] text-zinc-500 font-mono uppercase block">Key Derivation</span>
            <span className="text-sm font-bold text-purple-400 font-mono">PBKDF2-100k</span>
          </div>

          <div className="bg-black/40 border border-white/5 rounded-xl p-2.5">
            <span className="text-[10px] text-zinc-500 font-mono uppercase block">Storage Engine</span>
            <span className="text-sm font-bold text-emerald-400 font-mono">IndexedDB v1</span>
          </div>

          <div className="bg-black/40 border border-white/5 rounded-xl p-2.5">
            <span className="text-[10px] text-zinc-500 font-mono uppercase block">Integrity Status</span>
            <span className={`text-sm font-bold font-mono ${
              status.integrityReport.status === 'VERIFIED' ? 'text-emerald-400' :
              status.integrityReport.status === 'TAMPER_DETECTED' ? 'text-red-400' : 'text-zinc-400'
            }`}>
              {status.integrityReport.status}
            </span>
          </div>

          <div className="bg-black/40 border border-white/5 rounded-xl p-2.5">
            <span className="text-[10px] text-zinc-500 font-mono uppercase block">Last Synced</span>
            <span className="text-xs font-mono text-zinc-300">
              {status.lastSyncedAt ? new Date(status.lastSyncedAt).toLocaleTimeString() : 'Never'}
            </span>
          </div>
        </div>

        {/* Action Toolbar */}
        <div className="flex items-center justify-between gap-3 mt-4 pt-3 border-t border-white/10 flex-wrap">
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={handleSyncQuarantine}
              className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 border border-white/10 text-cyan-300 text-xs font-mono flex items-center gap-2 transition-all cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Sync HIPS Quarantine</span>
            </button>

            {onNavigateToQuarantine && (
              <button
                onClick={onNavigateToQuarantine}
                className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 border border-white/10 text-zinc-300 text-xs font-mono flex items-center gap-2 transition-all cursor-pointer"
              >
                <Layers className="w-3.5 h-3.5 text-zinc-400" />
                <span>Open Quarantine Sandbox</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={handleExportBackup}
              className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 border border-white/10 text-zinc-300 text-xs font-mono flex items-center gap-2 transition-all cursor-pointer"
              title="Download encrypted .scvault backup"
            >
              <Download className="w-3.5 h-3.5 text-emerald-400" />
              <span>Export .scvault Backup</span>
            </button>

            <button
              onClick={() => setShowRestoreModal(true)}
              className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 border border-white/10 text-zinc-300 text-xs font-mono flex items-center gap-2 transition-all cursor-pointer"
              title="Restore vault archive"
            >
              <Upload className="w-3.5 h-3.5 text-amber-400" />
              <span>Restore Backup</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Records Explorer & Inspector Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Records List (7 Cols) */}
        <div className="lg:col-span-7 space-y-3">
          {/* Filter and Search Bar */}
          <div className="bg-zinc-900/90 border border-white/10 rounded-2xl p-3.5 shadow-xl flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
            <div className="relative flex-1">
              <label htmlFor={searchInputId} className="sr-only">Search encrypted records</label>
              <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                id={searchInputId}
                type="text"
                placeholder="Search encrypted records, tags, SHA-256..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-black/60 border border-white/10 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:border-purple-400 font-mono"
              />
            </div>

            <div className="flex items-center gap-2">
              <label htmlFor={filterSelectId} className="sr-only">Filter by record type</label>
              <Filter className="w-3.5 h-3.5 text-zinc-500" />
              <select
                id={filterSelectId}
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="bg-black/60 border border-white/10 rounded-xl px-2.5 py-1.5 text-xs text-white font-mono focus:outline-none focus:border-purple-400 cursor-pointer"
              >
                <option value="ALL">All Artifact Types</option>
                <option value="QUARANTINE_ARTIFACT">Quarantine Binaries</option>
                <option value="MEMORY_DUMP">Memory Dumps</option>
                <option value="WASM_DISASSEMBLY">WASM Disassembly</option>
                <option value="YARA_RULESET">YARA Rulesets</option>
                <option value="STIX_THREAT_INTEL">STIX Threat Intel</option>
              </select>
            </div>
          </div>

          {/* Records Table / Cards */}
          <div className="space-y-2 max-h-[560px] overflow-y-auto pr-1">
            {filteredRecords.length === 0 ? (
              <div className="bg-zinc-900/50 border border-dashed border-white/10 rounded-2xl p-8 text-center text-zinc-500 text-xs font-mono">
                No encrypted records matching filters. Click "Sync HIPS Quarantine" to archive isolated threat samples.
              </div>
            ) : (
              filteredRecords.map(record => {
                const isSelected = selectedRecord?.id === record.id;
                return (
                  <div
                    key={record.id}
                    className={`bg-zinc-900/80 border rounded-xl p-3.5 transition-all flex items-start justify-between gap-3 ${
                      isSelected 
                        ? 'border-purple-500/70 bg-purple-950/20 shadow-md shadow-purple-950/30' 
                        : 'border-white/10 hover:border-white/20 hover:bg-zinc-900'
                    }`}
                  >
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <div className="p-2 rounded-lg bg-black/50 border border-white/10 mt-0.5 shrink-0">
                        {getTypeIcon(record.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="text-xs font-bold text-white font-mono truncate max-w-[280px]">
                            {record.title}
                          </h4>
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-black/60 text-zinc-400 font-mono border border-white/5">
                            {record.type.replace('_', ' ')}
                          </span>
                        </div>

                        <div className="flex items-center gap-3 text-[11px] text-zinc-500 font-mono mt-1 flex-wrap">
                          <span>Size: <strong className="text-zinc-300">{(record.sizeBytes / 1024).toFixed(1)} KB</strong></span>
                          <span>•</span>
                          <span className="truncate max-w-[180px]">
                            SHA256: <code className="text-zinc-400">{record.sha256Hash.substring(0, 12)}...</code>
                          </span>
                          <span>•</span>
                          <span>{new Date(record.createdAt).toLocaleDateString()}</span>
                        </div>

                        {/* Tags */}
                        {record.tags && record.tags.length > 0 && (
                          <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                            {record.tags.map((tag, idx) => (
                              <span key={idx} className="text-[9px] px-1.5 py-0.2 rounded bg-purple-950/40 text-purple-300 border border-purple-500/30 font-mono">
                                #{tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        onClick={() => handleInspectRecord(record)}
                        className={`px-2.5 py-1.5 rounded-lg text-xs font-mono font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-purple-600 text-white shadow'
                            : 'bg-zinc-800 hover:bg-zinc-700 text-purple-300 border border-white/10'
                        }`}
                        title="Decrypt and inspect artifact contents"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Inspect</span>
                      </button>

                      <button
                        onClick={() => handleDeleteRecord(record.id, record.title)}
                        className="p-1.5 rounded-lg bg-zinc-800/80 hover:bg-red-950/80 text-zinc-400 hover:text-red-300 border border-white/10 transition-all cursor-pointer"
                        title="Purge record permanently from encrypted vault"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Decrypted Record Inspector (5 Cols) */}
        <div className="lg:col-span-5">
          <div className="bg-zinc-900/90 border border-white/10 rounded-2xl p-4 shadow-2xl h-full flex flex-col backdrop-blur-md">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-purple-400" />
                <h4 className="text-xs font-bold text-white font-mono uppercase tracking-wider">
                  Decrypted Inspector
                </h4>
              </div>

              {selectedRecord && (
                <button
                  onClick={() => {
                    setSelectedRecord(null);
                    setDecryptedRecord(null);
                  }}
                  className="text-[11px] text-zinc-500 hover:text-zinc-300 font-mono"
                >
                  Clear
                </button>
              )}
            </div>

            {!selectedRecord ? (
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-zinc-500 text-xs font-mono space-y-2">
                <Lock className="w-8 h-8 text-zinc-600 mb-2" />
                <p>Select any encrypted artifact from the repository to perform authenticated AES-GCM-256 decryption and inspect its payload.</p>
              </div>
            ) : isDecrypting ? (
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-zinc-400 text-xs font-mono space-y-2">
                <RefreshCw className="w-6 h-6 text-purple-400 animate-spin mb-2" />
                <p>Deriving authentication tag and decrypting AES ciphertext...</p>
              </div>
            ) : decryptedRecord ? (
              <div className="space-y-3.5 flex-1 flex flex-col mt-3">
                {/* Record Metadata summary */}
                <div className="bg-black/50 border border-white/10 rounded-xl p-3 space-y-2 text-xs font-mono">
                  <div className="flex items-center justify-between">
                    <span className="text-zinc-500">Record ID:</span>
                    <span className="text-zinc-300 font-bold">{decryptedRecord.id}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-zinc-500">Integrity Digest:</span>
                    <span className="text-emerald-400 flex items-center gap-1">
                      <Check className="w-3 h-3" />
                      <span>SHA-256 Verified</span>
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-zinc-500">Plaintext Size:</span>
                    <span className="text-cyan-400 font-bold">
                      {JSON.stringify(decryptedRecord.payload).length} bytes
                    </span>
                  </div>
                </div>

                {/* Plaintext JSON Payload Viewer */}
                <div className="flex-1 flex flex-col min-h-[300px]">
                  <div className="flex items-center justify-between text-[11px] text-zinc-400 font-mono mb-1.5">
                    <span>Decrypted Payload (JSON / Disassembly):</span>
                    <button
                      onClick={() => handleCopy(JSON.stringify(decryptedRecord.payload, null, 2), decryptedRecord.id)}
                      className="text-purple-300 hover:text-white flex items-center gap-1 cursor-pointer"
                    >
                      {copiedId === decryptedRecord.id ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedId === decryptedRecord.id ? 'Copied' : 'Copy Plaintext'}</span>
                    </button>
                  </div>
                  <div className="flex-1 bg-black/80 border border-white/10 rounded-xl p-3 overflow-auto max-h-[380px] font-mono text-[11px] text-emerald-400 select-text">
                    <pre>{JSON.stringify(decryptedRecord.payload, null, 2)}</pre>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-4 text-center text-red-400 text-xs font-mono">
                Decryption failed. Ensure the vault is unlocked with the valid master passphrase.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal: Unlock Vault */}
      {showUnlockModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-white/15 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-emerald-950 border border-emerald-500/50 text-emerald-400">
                <Key className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white font-mono">Unlock Encrypted Vault</h3>
                <p className="text-xs text-zinc-400">Enter master passphrase to derive AES-256 session key</p>
              </div>
            </div>

            {unlockError && (
              <div className="p-2.5 rounded-lg bg-red-950/80 border border-red-500/50 text-red-300 text-xs font-mono flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{unlockError}</span>
              </div>
            )}

            <div className="space-y-1.5">
              <label htmlFor={unlockPassphraseId} className="text-xs font-mono text-zinc-400">Master Passphrase:</label>
              <div className="relative">
                <input
                  id={unlockPassphraseId}
                  type={showPassphraseText ? 'text' : 'password'}
                  value={unlockPassphrase}
                  onChange={(e) => setUnlockPassphrase(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleUnlock()}
                  placeholder="Enter passphrase..."
                  className="w-full bg-black/60 border border-white/15 rounded-xl px-3 py-2 text-sm text-white font-mono focus:outline-none focus:border-emerald-400 pr-10"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => setShowPassphraseText(!showPassphraseText)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white"
                >
                  {showPassphraseText ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Quick Demo Helper Button */}
            <div className="pt-1">
              <button
                type="button"
                onClick={() => setUnlockPassphrase(DEFAULT_VAULT_PASSPHRASE)}
                className="text-[11px] text-cyan-400 hover:underline font-mono flex items-center gap-1 cursor-pointer"
              >
                <span>Use default cockpit credential (demo convenience)</span>
              </button>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-white/10">
              <button
                onClick={() => setShowUnlockModal(false)}
                className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs font-mono text-zinc-300 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleUnlock}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs font-mono flex items-center gap-2 cursor-pointer"
              >
                <Unlock className="w-3.5 h-3.5" />
                <span>Unlock Vault</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Rotate Master Key */}
      {showReKeyModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-white/15 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-amber-950 border border-amber-500/50 text-amber-400">
                <Key className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white font-mono">Rotate Master Passphrase</h3>
                <p className="text-xs text-zinc-400">Re-derives key and re-encrypts all records in storage</p>
              </div>
            </div>

            {reKeyError && (
              <div className="p-2.5 rounded-lg bg-red-950/80 border border-red-500/50 text-red-300 text-xs font-mono flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{reKeyError}</span>
              </div>
            )}

            <div className="space-y-3">
              <div className="space-y-1">
                <label htmlFor={oldPassphraseId} className="text-xs font-mono text-zinc-400">Current Passphrase:</label>
                <input
                  id={oldPassphraseId}
                  type="password"
                  value={oldPassphrase}
                  onChange={(e) => setOldPassphrase(e.target.value)}
                  placeholder="Old passphrase..."
                  className="w-full bg-black/60 border border-white/15 rounded-xl px-3 py-2 text-sm text-white font-mono focus:outline-none focus:border-amber-400"
                />
              </div>

              <div className="space-y-1">
                <label htmlFor={newPassphraseId} className="text-xs font-mono text-zinc-400">New Passphrase (min 8 chars):</label>
                <input
                  id={newPassphraseId}
                  type="password"
                  value={newPassphrase}
                  onChange={(e) => setNewPassphrase(e.target.value)}
                  placeholder="New passphrase..."
                  className="w-full bg-black/60 border border-white/15 rounded-xl px-3 py-2 text-sm text-white font-mono focus:outline-none focus:border-amber-400"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-white/10">
              <button
                onClick={() => setShowReKeyModal(false)}
                className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs font-mono text-zinc-300 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleReKey}
                className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs font-mono flex items-center gap-2 cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Re-Key Vault</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Restore Vault Backup */}
      {showRestoreModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-white/15 rounded-2xl w-full max-w-lg p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-cyan-950 border border-cyan-500/50 text-cyan-400">
                <Upload className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white font-mono">Restore Encrypted Backup (.scvault)</h3>
                <p className="text-xs text-zinc-400">Paste raw backup archive JSON to import into IndexedDB</p>
              </div>
            </div>

            {restoreError && (
              <div className="p-2.5 rounded-lg bg-red-950/80 border border-red-500/50 text-red-300 text-xs font-mono flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{restoreError}</span>
              </div>
            )}

            <div className="space-y-1">
              <label htmlFor={restoreJsonId} className="text-xs font-mono text-zinc-400">Backup JSON Data:</label>
              <textarea
                id={restoreJsonId}
                rows={7}
                value={restoreJsonInput}
                onChange={(e) => setRestoreJsonInput(e.target.value)}
                placeholder="Paste .scvault backup JSON payload here..."
                className="w-full bg-black/70 border border-white/15 rounded-xl p-3 text-xs text-white font-mono focus:outline-none focus:border-cyan-400 select-text"
              />
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-white/10">
              <button
                onClick={() => setShowRestoreModal(false)}
                className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs font-mono text-zinc-300 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleRestoreBackup}
                className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs font-mono flex items-center gap-2 cursor-pointer"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Import & Restore</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
