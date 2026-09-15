// jb7572_2026-09-01: Volatile Drive Encryption Key Extractor (BitLocker FVEK, LUKS2, VeraCrypt, FileVault)
import React, { useState } from 'react';
import { 
  VolatileEncryptionKey, 
  MOCK_ENCRYPTION_KEYS 
} from '../../../services/forensicsService';
import { 
  KeyRound, 
  Lock, 
  Unlock, 
  ShieldAlert, 
  ShieldCheck, 
  Copy, 
  Download, 
  Search, 
  HardDrive, 
  Cpu, 
  FileKey, 
  RefreshCw, 
  CheckCircle2, 
  AlertTriangle,
  FolderLock
} from 'lucide-react';

interface EncryptionKeysTabProps {
  onNotify: (title: string, message: string) => void;
}

export const EncryptionKeysTab: React.FC<EncryptionKeysTabProps> = ({ onNotify }) => {
  const [keys, setKeys] = useState<VolatileEncryptionKey[]>(MOCK_ENCRYPTION_KEYS);
  const [selectedKeyId, setSelectedKeyId] = useState<string>(MOCK_ENCRYPTION_KEYS[0].id);
  const [isScanningMemory, setIsScanningMemory] = useState(false);
  const [filterType, setFilterType] = useState<string>('ALL');

  const selectedKey = keys.find(k => k.id === selectedKeyId) || keys[0];

  const handleScanMemoryForKeys = () => {
    setIsScanningMemory(true);
    onNotify('RAM Encryption Key Scan Initiated', 'Scanning physical memory pool for FVEK, VMK, and LUKS master keys...');

    setTimeout(() => {
      setIsScanningMemory(false);
      onNotify('Key Extraction Complete', 'Found 3 active drive encryption keys in volatile memory pool.');
    }, 1500);
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    onNotify('Copied to Clipboard', `${label} copied successfully.`);
  };

  const exportBekRecoveryKey = (key: VolatileEncryptionKey) => {
    const content = `[BitLocker Recovery File / Forensic BEK Format]
Volume GUID: ${key.volumeGuidOrUuid}
Volume Mount: ${key.volumeMountOrDrive}
Cipher: ${key.cipherAlgorithm}
Full Volume Encryption Key (FVEK): ${key.fvekOrMasterKeyHex}
Volume Master Key (VMK): ${key.vmkOrVolumeHeaderKeyHex || 'N/A'}
Recovery Password: ${key.recoveryPasswordOrBek || 'N/A'}
RAM Physical Offset: ${key.memoryOffsetHex}
Extraction Timestamp: ${new Date().toISOString()}
Extracted By: Forensic Workstation (ISO/IEC 27037 Compliant)
`;
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${key.encryptionType.toLowerCase()}_recovery_${key.id}.bek`;
    a.click();
    URL.revokeObjectURL(url);
    onNotify('Exported BEK Recovery File', `Saved offline decryption payload for ${key.volumeMountOrDrive}`);
  };

  const filteredKeys = filterType === 'ALL' 
    ? keys 
    : keys.filter(k => k.encryptionType === filterType);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-lg relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="p-2 bg-amber-500/20 text-amber-400 rounded-lg">
                <KeyRound className="w-5 h-5" />
              </span>
              <h2 className="text-xl font-bold text-slate-100">Volatile Drive Encryption Key Extractor</h2>
              <span className="px-2 py-0.5 text-xs font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-full">
                FVEK / VMK / LUKS Master Key In-Memory Sniffer
              </span>
            </div>
            <p className="text-xs text-slate-400 max-w-3xl">
              Extract active Full Volume Encryption Keys (FVEK) and LUKS master keys directly from volatile physical RAM pools and decompressed hibernation buffers. Enables offline mounting and bit-stream decryption of BitLocker, LUKS2, and VeraCrypt volumes without the suspect’s password.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleScanMemoryForKeys}
              disabled={isScanningMemory}
              className="flex items-center gap-1.5 px-3 py-2 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white rounded-lg text-xs font-semibold shadow-lg transition-all"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isScanningMemory ? 'animate-spin' : ''}`} />
              {isScanningMemory ? 'Scanning RAM Pools...' : 'Scan Memory for Keys'}
            </button>
          </div>
        </div>
      </div>

      {/* Critical Alert Callout */}
      <div className="bg-amber-950/40 border border-amber-800/50 rounded-xl p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 text-xs text-amber-200">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 bg-amber-500/20 text-amber-300 rounded">
            <ShieldAlert className="w-4 h-4" />
          </div>
          <div>
            <span className="font-semibold text-amber-100">Live Acquisition Rule:</span>{' '}
            <span className="text-amber-200/90">Always extract the FVEK/VMK keys <strong>before powering off or isolating the suspect host</strong>. Shutting down without RAM key extraction leaves BitLocker and LUKS partitions unreadable if TPM PINs or passwords are unknown.</span>
          </div>
        </div>
        <div className="text-[11px] font-mono bg-amber-900/40 px-2.5 py-1 rounded border border-amber-700/50 text-amber-300 shrink-0">
          Mountable via Passware / Dislocker / cryptsetup
        </div>
      </div>

      {/* Main Grid: Keys List & Key Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Discovered Volume Keys List */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-200 uppercase tracking-wider flex items-center gap-2">
                <FolderLock className="w-4 h-4 text-amber-400" />
                Extracted Encryption Keys ({filteredKeys.length})
              </h3>

              {/* Filter Tabs */}
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="bg-slate-800 border border-slate-700 text-xs text-slate-200 rounded px-2 py-1 font-mono focus:outline-none focus:border-amber-500"
              >
                <option value="ALL">All Ciphers</option>
                <option value="BitLocker">BitLocker (FVEK)</option>
                <option value="LUKS2">LUKS2 (Linux)</option>
                <option value="VeraCrypt">VeraCrypt</option>
              </select>
            </div>

            <div className="space-y-2">
              {filteredKeys.map(k => (
                <div
                  key={k.id}
                  onClick={() => setSelectedKeyId(k.id)}
                  className={`p-3.5 rounded-lg border text-xs cursor-pointer transition-all ${
                    selectedKeyId === k.id
                      ? 'bg-slate-800/90 border-amber-500 text-white shadow-[0_0_12px_rgba(245,158,11,0.15)]'
                      : 'bg-slate-800/40 border-slate-700/60 text-slate-300 hover:bg-slate-800/70'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-100 flex items-center gap-2">
                      <Lock className="w-3.5 h-3.5 text-amber-400" />
                      {k.volumeMountOrDrive}
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-900 border border-slate-700 text-amber-300">
                      {k.encryptionType}
                    </span>
                  </div>

                  <div className="mt-2 flex items-center justify-between text-[11px] font-mono text-slate-400">
                    <span className="truncate max-w-[200px]">{k.cipherAlgorithm}</span>
                    <span className="text-emerald-400 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> Ready for Mount
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Key Details & Decryption Tools */}
        <div className="lg:col-span-7 space-y-4">
          {selectedKey && (
            <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div>
                  <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                    <Unlock className="w-4 h-4 text-emerald-400" />
                    {selectedKey.volumeMountOrDrive}
                  </h3>
                  <div className="text-xs font-mono text-slate-400 mt-0.5">
                    UUID: {selectedKey.volumeGuidOrUuid}
                  </div>
                </div>

                <button
                  onClick={() => exportBekRecoveryKey(selectedKey)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-semibold text-amber-300 rounded-lg transition-all"
                >
                  <Download className="w-3.5 h-3.5" />
                  Export .BEK Key File
                </button>
              </div>

              {/* Key Metadata Grid */}
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="bg-slate-950/70 border border-slate-800 p-3 rounded-lg space-y-1">
                  <div className="text-slate-400">Cipher & Mode</div>
                  <div className="font-semibold text-slate-200">{selectedKey.cipherAlgorithm}</div>
                  <div className="text-[11px] text-slate-400">Source: {selectedKey.extractionSource}</div>
                </div>

                <div className="bg-slate-950/70 border border-slate-800 p-3 rounded-lg space-y-1">
                  <div className="text-slate-400">Physical Memory Offset</div>
                  <div className="font-mono font-semibold text-amber-300">{selectedKey.memoryOffsetHex}</div>
                  <div className="text-[11px] text-emerald-400">Direct Page Frame Located</div>
                </div>
              </div>

              {/* Master / FVEK Hex Payload */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs text-slate-300">
                  <span className="font-semibold flex items-center gap-1.5">
                    <FileKey className="w-3.5 h-3.5 text-amber-400" />
                    {selectedKey.encryptionType === 'BitLocker' ? 'Full Volume Encryption Key (FVEK)' : 'LUKS Master Encryption Key'}
                  </span>
                  <button
                    onClick={() => copyToClipboard(selectedKey.fvekOrMasterKeyHex, 'Master Key')}
                    className="flex items-center gap-1 text-[11px] font-mono text-amber-400 hover:text-amber-300"
                  >
                    <Copy className="w-3 h-3" /> Copy Hex
                  </button>
                </div>
                <div className="bg-slate-950 border border-slate-800 rounded-lg p-3 font-mono text-xs text-amber-300 break-all select-all">
                  {selectedKey.fvekOrMasterKeyHex}
                </div>
              </div>

              {/* VMK or Secondary Key (if applicable) */}
              {selectedKey.vmkOrVolumeHeaderKeyHex && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs text-slate-300">
                    <span className="font-semibold flex items-center gap-1.5">
                      <KeyRound className="w-3.5 h-3.5 text-indigo-400" />
                      Volume Master Key (VMK) / Header Payload
                    </span>
                    <button
                      onClick={() => copyToClipboard(selectedKey.vmkOrVolumeHeaderKeyHex!, 'VMK Key')}
                      className="flex items-center gap-1 text-[11px] font-mono text-indigo-400 hover:text-indigo-300"
                    >
                      <Copy className="w-3 h-3" /> Copy Hex
                    </button>
                  </div>
                  <div className="bg-slate-950 border border-slate-800 rounded-lg p-3 font-mono text-xs text-indigo-300 break-all select-all">
                    {selectedKey.vmkOrVolumeHeaderKeyHex}
                  </div>
                </div>
              )}

              {/* Numeric Recovery Password / Formatted Protectors */}
              {selectedKey.recoveryPasswordOrBek && (
                <div className="bg-slate-950/80 border border-slate-800 rounded-lg p-3 space-y-2">
                  <div className="text-xs font-semibold text-slate-300 flex items-center justify-between">
                    <span>48-Digit Numeric Recovery Password / Token</span>
                    <button
                      onClick={() => copyToClipboard(selectedKey.recoveryPasswordOrBek!, 'Recovery Password')}
                      className="text-[11px] font-mono text-emerald-400 hover:text-emerald-300 flex items-center gap-1"
                    >
                      <Copy className="w-3 h-3" /> Copy
                    </button>
                  </div>
                  <div className="font-mono text-xs text-emerald-400 font-bold bg-slate-900 p-2.5 rounded border border-slate-800 select-all">
                    {selectedKey.recoveryPasswordOrBek}
                  </div>
                </div>
              )}

              {/* Offline Decryption Command Guide */}
              <div className="bg-slate-950 border border-slate-800 rounded-lg p-3 space-y-2">
                <div className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                  <Cpu className="w-3.5 h-3.5 text-slate-400" />
                  Offline Forensics Mount Command (Zero Write-Blocked)
                </div>
                <div className="bg-slate-900 p-2.5 rounded border border-slate-800 font-mono text-[11px] text-slate-300 space-y-1">
                  {selectedKey.encryptionType === 'BitLocker' ? (
                    <code>
                      dislocker -V /dev/sdb3 -K {selectedKey.fvekOrMasterKeyHex.slice(0, 16)}... -- /mnt/bitlocker_raw/<br />
                      mount -o ro,loop /mnt/bitlocker_raw/dislocker-file /mnt/forensic_evidence/
                    </code>
                  ) : (
                    <code>
                      cryptsetup luksOpen --master-key-file recovery_key.bin /dev/sdb4 decrypted_luks<br />
                      mount -o ro,noload /dev/mapper/decrypted_luks /mnt/forensic_evidence/
                    </code>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
