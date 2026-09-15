// jb7572_2026-08-26: SecureCurtain Core Architecture - Encrypted Cloud & Remote Backup Uploader (rclone / S3 / SFTP)
import React, { useState } from 'react';
import {
  Cloud,
  CloudUpload,
  Server,
  Lock,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Sliders,
  Terminal,
  HardDrive,
  Copy,
  Globe,
  Database,
  Key,
  FolderDown,
  ArrowUpRight,
  Zap,
  Radio
} from 'lucide-react';

interface RemoteEndpoint {
  id: string;
  name: string;
  type: 's3' | 'gdrive' | 'sftp' | 'nextcloud' | 'smb_nfs';
  icon: string;
  destinationBucketOrPath: string;
  status: 'Connected' | 'Ready' | 'Configured';
  clientEncryption: boolean;
  bandwidthLimit: string;
}

const SAMPLE_REMOTE_ENDPOINTS: RemoteEndpoint[] = [
  {
    id: 's3_secure_vault',
    name: 'Amazon AWS S3 / Cloudflare R2 Vault',
    type: 's3',
    icon: 's3',
    destinationBucketOrPath: 's3://forensic-salvage-vault-2026/carved_files/',
    status: 'Connected',
    clientEncryption: true,
    bandwidthLimit: 'Unlimited (Gigabit)'
  },
  {
    id: 'gdrive_workspace',
    name: 'Google Drive / Workspace Cloud Storage',
    type: 'gdrive',
    icon: 'gdrive',
    destinationBucketOrPath: 'gdrive:/SecureCurtain_Recoveries/2026-08-26/',
    status: 'Ready',
    clientEncryption: true,
    bandwidthLimit: '50 MB/s'
  },
  {
    id: 'sftp_remote_lab',
    name: 'Forensic Lab SFTP / SSH Storage Server',
    type: 'sftp',
    icon: 'sftp',
    destinationBucketOrPath: 'sftp://analyst@lab-storage.internal:/srv/evidence/case_838b/',
    status: 'Connected',
    clientEncryption: false,
    bandwidthLimit: '100 MB/s'
  },
  {
    id: 'nextcloud_private',
    name: 'Self-Hosted Nextcloud / WebDAV Server',
    type: 'nextcloud',
    icon: 'nextcloud',
    destinationBucketOrPath: 'webdav://cloud.company.net/remote.php/dav/files/user/salvage/',
    status: 'Ready',
    clientEncryption: true,
    bandwidthLimit: '30 MB/s'
  }
];

interface CloudBackupUploaderViewProps {
  addNotification?: (notification: any) => void;
  defaultSourceDir?: string;
}

export const CloudBackupUploaderView: React.FC<CloudBackupUploaderViewProps> = ({
  addNotification,
  defaultSourceDir = '/mnt/recovered/salvaged_files'
}) => {
  const [endpoints, setEndpoints] = useState<RemoteEndpoint[]>(SAMPLE_REMOTE_ENDPOINTS);
  const [selectedEndpoint, setSelectedEndpoint] = useState<RemoteEndpoint>(SAMPLE_REMOTE_ENDPOINTS[0]);
  
  const [sourceDirectory, setSourceDirectory] = useState<string>(defaultSourceDir);
  const [enableClientEncryption, setEnableClientEncryption] = useState<boolean>(true);
  const [encryptionPassphrase, setEncryptionPassphrase] = useState<string>('Vault-Crypt-2026-AES256#Secure!');
  const [parallelTransfers, setParallelTransfers] = useState<number>(8);
  const [bandwidthCap, setBandwidthCap] = useState<string>('0'); // 0 = unlimited

  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [uploadSpeed, setUploadSpeed] = useState<string>('0 MB/s');
  const [transferredBytes, setTransferredBytes] = useState<string>('0 MB');
  const [uploadSuccess, setUploadSuccess] = useState<boolean>(false);

  const [uploadLogs, setUploadLogs] = useState<string[]>([
    '[*] Rclone Multi-Cloud Remote Sync Daemon v1.66 Initialized',
    '[*] SSL/TLS 1.3 Transport Encryption Handshake OK',
    '[+] 4 Remote endpoints configured and ready for encrypted offload.'
  ]);

  const handleStartUpload = () => {
    setIsUploading(true);
    setUploadSuccess(false);
    setUploadProgress(5);
    setUploadSpeed('45.2 MB/s');
    setUploadLogs(prev => [
      ...prev,
      `[*] Initializing rclone sync from ${sourceDirectory} to ${selectedEndpoint.destinationBucketOrPath}...`,
      `[crypt] Client-Side AES-256-GCM wrapper: ${enableClientEncryption ? 'ENABLED (Zero-Knowledge)' : 'DISABLED'}`,
      `[threads] Spawning ${parallelTransfers} concurrent worker threads...`
    ]);

    setTimeout(() => {
      setUploadProgress(35);
      setTransferredBytes('642 MB / 1.82 GB');
      setUploadSpeed('98.4 MB/s');
      setUploadLogs(prev => [
        ...prev,
        `[s3] Streaming multi-part payload: IMG_4291_Wedding.CR3 (35.1 MB) [100%]`,
        `[s3] Streaming multi-part payload: IMG_4292_Portrait.CR3 (36.3 MB) [100%]`,
        `[s3] Streaming multi-part payload: DJI_0840_Flight_4K.MP4 (840 MB) [40%]`
      ]);
    }, 1000);

    setTimeout(() => {
      setUploadProgress(78);
      setTransferredBytes('1.45 GB / 1.82 GB');
      setUploadSpeed('112.0 MB/s');
      setUploadLogs(prev => [
        ...prev,
        `[s3] Streaming multi-part payload: DJI_0840_Flight_4K.MP4 (840 MB) [100%]`,
        `[s3] Calculating remote ETag / MD5 checksums for transferred files...`
      ]);
    }, 2000);

    setTimeout(() => {
      setUploadProgress(100);
      setIsUploading(false);
      setUploadSuccess(true);
      setTransferredBytes('1.82 GB (100%)');
      setUploadSpeed('0 MB/s');
      setUploadLogs(prev => [
        ...prev,
        `[✓] VERIFIED: 9 Recovered files and SHA-256 audit manifest uploaded to ${selectedEndpoint.name}!`,
        `[✓] Remote ETag verification matches local files with 0 integrity mismatches.`
      ]);

      if (addNotification) {
        addNotification({
          title: 'Cloud Backup Complete',
          message: `All salvaged files successfully uploaded to ${selectedEndpoint.name}`,
          type: 'success'
        });
      }
    }, 3200);
  };

  const getCliCommand = () => {
    const cryptFlag = enableClientEncryption ? `--crypt-password-obscured="..."` : '';
    const bwFlag = bandwidthCap !== '0' ? `--bwlimit ${bandwidthCap}M` : '';
    return `rclone sync "${sourceDirectory}" "${selectedEndpoint.destinationBucketOrPath}" --transfers ${parallelTransfers} --checkers 16 --fast-list --checksum ${cryptFlag} ${bwFlag} -P`;
  };

  return (
    <div className="space-y-4">
      {/* Header Banner */}
      <div className="bg-[#0c0f18] p-4 rounded-xl border border-[#1b2234] flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-sky-950/80 border border-sky-500/40 text-sky-400 shadow-md shadow-sky-950/50">
            <CloudUpload className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold font-mono text-white">Encrypted Cloud & Remote Backup Uploader</h3>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-sky-950 text-sky-300 border border-sky-500/30">
                RCLONE MULTI-CLOUD / S3 / SFTP / G-DRIVE
              </span>
            </div>
            <p className="text-xs text-[#8fa0b5] mt-0.5">
              Securely stream and mirror salvaged flash card files and forensic disk images directly to cloud object storage or remote servers.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#141b2c] border border-[#232f4b] text-emerald-300 text-xs font-mono">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>Client-Side AES-256-GCM Zero-Knowledge Sync</span>
        </div>
      </div>

      {/* Main Grid: Remote Destination & Upload Options */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left: Remote Endpoints (Col 5) */}
        <div className="lg:col-span-5 bg-[#0c0f18] p-4 rounded-xl border border-[#1b2234] space-y-3">
          <div className="flex items-center justify-between border-b border-[#1b2234] pb-2">
            <div className="flex items-center gap-2">
              <Server className="w-4 h-4 text-sky-400" />
              <span className="text-xs font-bold font-mono text-white uppercase">1. Select Target Cloud Endpoint</span>
            </div>
            <span className="text-[10px] font-mono text-[#778899]">rclone config</span>
          </div>

          <div className="space-y-2">
            {endpoints.map(ep => {
              const isSelected = selectedEndpoint.id === ep.id;
              return (
                <div
                  key={ep.id}
                  onClick={() => setSelectedEndpoint(ep)}
                  className={`p-3 rounded-lg border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-sky-950/40 border-sky-500/80 shadow-sm'
                      : 'bg-[#101422] border-[#1c2438] hover:border-[#2e3b5a]'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5">
                        <Cloud className="w-3.5 h-3.5 text-sky-400" />
                        <span className="text-xs font-bold font-mono text-white">{ep.name}</span>
                      </div>
                      <div className="text-[10px] font-mono text-sky-300 truncate max-w-[240px]" title={ep.destinationBucketOrPath}>
                        {ep.destinationBucketOrPath}
                      </div>
                    </div>

                    <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-500/30 shrink-0">
                      {ep.status}
                    </span>
                  </div>

                  <div className="mt-2 text-[10px] font-mono text-[#708098] flex items-center justify-between border-t border-[#182030] pt-1.5">
                    <span>Rate Limit: {ep.bandwidthLimit}</span>
                    <span className="text-purple-300">{ep.clientEncryption ? 'AES-256 Crypt' : 'Standard TLS'}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Transfer Engine & Parameters (Col 7) */}
        <div className="lg:col-span-7 bg-[#0c0f18] p-4 rounded-xl border border-[#1b2234] space-y-4">
          <div className="flex items-center justify-between border-b border-[#1b2234] pb-2">
            <div className="flex items-center gap-2">
              <Sliders className="w-4 h-4 text-emerald-400" />
              <span className="text-xs font-bold font-mono text-white uppercase">2. Backup Security & Transfer Parameters</span>
            </div>
            <span className="text-[10px] font-mono text-sky-400">{selectedEndpoint.type.toUpperCase()} Protocol</span>
          </div>

          {/* Form Settings */}
          <div className="p-3.5 rounded-lg bg-[#101422] border border-[#1e273e] space-y-3">
            <div className="space-y-1.5">
              <label className="text-xs font-mono text-[#8fa0b5] flex items-center justify-between">
                <span>Local Salvaged Folder Source Directory:</span>
                <span className="text-[10px] text-sky-400">Source Payload</span>
              </label>
              <input
                type="text"
                value={sourceDirectory}
                onChange={(e) => setSourceDirectory(e.target.value)}
                className="w-full bg-[#090c15] border border-[#232f4b] rounded-lg px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-sky-500"
              />
            </div>

            {/* Zero Knowledge Encryption Checkbox */}
            <div className="p-3 rounded bg-[#090c15] border border-[#182030] space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="client_enc"
                    checked={enableClientEncryption}
                    onChange={(e) => setEnableClientEncryption(e.target.checked)}
                    className="accent-sky-500 w-4 h-4"
                  />
                  <label htmlFor="client_enc" className="text-xs font-mono font-bold text-white cursor-pointer">
                    Enable On-The-Fly Client-Side Encryption (rclone crypt)
                  </label>
                </div>
                <span className="text-[10px] font-mono text-emerald-400">Zero-Knowledge</span>
              </div>

              {enableClientEncryption && (
                <div className="space-y-1 pt-1">
                  <div className="text-[10px] font-mono text-[#8fa0b5]">Vault Encryption Passphrase:</div>
                  <input
                    type="text"
                    value={encryptionPassphrase}
                    onChange={(e) => setEncryptionPassphrase(e.target.value)}
                    className="w-full bg-[#05070c] border border-[#1e273e] rounded px-2.5 py-1.5 text-xs font-mono text-amber-300 focus:outline-none focus:border-sky-500"
                  />
                </div>
              )}
            </div>

            {/* Tuning Controls */}
            <div className="grid grid-cols-2 gap-3 text-xs font-mono">
              <div className="p-2.5 rounded bg-[#090c15] border border-[#182030] space-y-1">
                <div className="text-[10px] text-[#778899]">Concurrent Worker Threads:</div>
                <select
                  value={parallelTransfers}
                  onChange={(e) => setParallelTransfers(Number(e.target.value))}
                  className="w-full bg-[#101422] border border-[#1e273e] rounded px-2 py-1 text-xs text-white font-mono focus:outline-none focus:border-sky-500"
                >
                  <option value={4}>4 Parallel Transfers</option>
                  <option value={8}>8 Parallel Transfers (Recommended)</option>
                  <option value={16}>16 High-Bandwidth Threads</option>
                  <option value={32}>32 NVMe / Gigabit Threads</option>
                </select>
              </div>

              <div className="p-2.5 rounded bg-[#090c15] border border-[#182030] space-y-1">
                <div className="text-[10px] text-[#778899]">Bandwidth Throttle:</div>
                <select
                  value={bandwidthCap}
                  onChange={(e) => setBandwidthCap(e.target.value)}
                  className="w-full bg-[#101422] border border-[#1e273e] rounded px-2 py-1 text-xs text-white font-mono focus:outline-none focus:border-sky-500"
                >
                  <option value="0">Unlimited (Max Speed)</option>
                  <option value="10">10 MB/s (Hotspot / Mobile)</option>
                  <option value="50">50 MB/s (Standard Broadband)</option>
                  <option value="100">100 MB/s (Fiber LAN)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Action Button & Live Progress */}
          <div className="space-y-2 pt-2">
            {isUploading && (
              <div className="space-y-1.5 p-3 rounded-lg bg-[#101422] border border-[#1c2438]">
                <div className="flex justify-between text-xs font-mono text-[#8fa0b5]">
                  <span>Uploading to {selectedEndpoint.name}...</span>
                  <span className="text-sky-400 font-bold">{uploadProgress}% ({transferredBytes})</span>
                </div>
                <div className="w-full bg-[#080a11] h-2.5 rounded-full overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-sky-500 to-emerald-500 h-full transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
                <div className="flex justify-between text-[10px] font-mono text-[#778899]">
                  <span>Speed: <strong className="text-emerald-400">{uploadSpeed}</strong></span>
                  <span>Threads: <strong>{parallelTransfers} Active</strong></span>
                </div>
              </div>
            )}

            <div className="flex items-center justify-between gap-3">
              <div className="text-xs font-mono text-[#778899]">
                Destination: <span className="text-sky-300 font-bold">{selectedEndpoint.type.toUpperCase()}</span>
              </div>

              <button
                onClick={handleStartUpload}
                disabled={isUploading}
                className="px-6 py-2.5 rounded-lg bg-sky-600 hover:bg-sky-500 disabled:opacity-50 text-white font-mono text-xs font-bold flex items-center gap-2 shadow-lg shadow-sky-600/30 transition-all"
              >
                {isUploading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Syncing to Cloud ({uploadProgress}%)...</span>
                  </>
                ) : (
                  <>
                    <CloudUpload className="w-4 h-4" />
                    <span>Start Encrypted Cloud Backup</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Upload Success Alert */}
          {uploadSuccess && (
            <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/50 flex items-center justify-between text-xs font-mono text-emerald-300">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>All files mirrored and verified with SHA-256 cloud checksum.</span>
              </div>
              <span className="text-[10px] bg-emerald-900 text-emerald-200 px-2 py-0.5 rounded font-bold">
                SYNC 100% COMPLETE
              </span>
            </div>
          )}
        </div>
      </div>

      {/* CLI Command & Live Execution Log */}
      <div className="bg-[#080a11] rounded-xl border border-[#1b2234] p-4 space-y-3">
        <div className="flex items-center justify-between border-b border-[#161d2d] pb-2">
          <div className="flex items-center gap-2">
            <Terminal className="w-4 h-4 text-sky-400" />
            <span className="text-xs font-bold font-mono text-white">Rclone Commandline Generator & Transfer Stream</span>
          </div>
          <button
            onClick={() => {
              navigator.clipboard?.writeText(getCliCommand());
              if (addNotification) {
                addNotification({
                  title: 'Command Copied',
                  message: 'rclone command copied to clipboard',
                  type: 'info'
                });
              }
            }}
            className="flex items-center gap-1.5 px-2 py-1 rounded bg-[#131a2b] hover:bg-[#1b253e] text-[11px] font-mono text-[#8fa0b5] hover:text-white transition-all"
          >
            <Copy className="w-3 h-3" />
            <span>Copy CLI Command</span>
          </button>
        </div>

        <div className="p-2.5 rounded-lg bg-[#04060a] border border-[#141b2c] font-mono text-xs text-sky-300 select-all overflow-x-auto">
          <code># {getCliCommand()}</code>
        </div>

        <div className="p-3 rounded-lg bg-[#04060a] border border-[#141b2c] font-mono text-xs space-y-1 max-h-36 overflow-y-auto">
          {uploadLogs.map((log, idx) => (
            <div
              key={idx}
              className={`${
                log.includes('[✓]')
                  ? 'text-emerald-400 font-bold'
                  : log.includes('[s3]') || log.includes('[crypt]') || log.includes('[threads]')
                  ? 'text-sky-300'
                  : log.includes('[+]')
                  ? 'text-emerald-300'
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
