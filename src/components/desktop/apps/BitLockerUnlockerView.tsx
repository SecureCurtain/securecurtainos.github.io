// jb7572_2026-08-26: SecureCurtain Core Architecture - BitLocker & LUKS Decryption Assist
import React, { useState } from 'react';
import {
  Lock,
  Unlock,
  Key,
  HardDrive,
  Shield,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Terminal,
  FileKey,
  Cpu,
  FolderDown,
  ArrowRight,
  Eye,
  EyeOff,
  Copy,
  ExternalLink
} from 'lucide-react';

interface EncryptedVolume {
  id: string;
  name: string;
  devicePath: string;
  encryptionType: 'BitLocker (To Go)' | 'BitLocker (OS Drive)' | 'LUKS2' | 'LUKS1 (dm-crypt)';
  cipher: string;
  size: string;
  status: 'Locked' | 'Unlocked' | 'Corrupted Header';
  mountPoint?: string;
  identifierGUID?: string;
}

const SAMPLE_ENCRYPTED_VOLUMES: EncryptedVolume[] = [
  {
    id: 'vol_sd_bitlocker',
    name: 'SanDisk Extreme 64GB (BitLocker To Go)',
    devicePath: '/dev/mmcblk0p1',
    encryptionType: 'BitLocker (To Go)',
    cipher: 'XTS-AES 128-bit',
    size: '59.6 GiB',
    status: 'Locked',
    identifierGUID: '{8A742F19-C03B-49A1-92EE-E8267491AA01}'
  },
  {
    id: 'vol_nvme_win',
    name: 'NVMe OS Drive - Windows 11 BitLocker C:',
    devicePath: '/dev/nvme0n1p3',
    encryptionType: 'BitLocker (OS Drive)',
    cipher: 'XTS-AES 256-bit',
    size: '476.2 GiB',
    status: 'Locked',
    identifierGUID: '{4D36E968-E325-11CE-BFC1-08002BE10318}'
  },
  {
    id: 'vol_luks_sd',
    name: 'Lexar Professional SDXC (LUKS2 Container)',
    devicePath: '/dev/sde1',
    encryptionType: 'LUKS2',
    cipher: 'aes-xts-plain64:sha256',
    size: '119.2 GiB',
    status: 'Locked',
    identifierGUID: 'luks-3bf9a87d-8812-4211-965a-9fa81765c9e2'
  }
];

interface BitLockerUnlockerViewProps {
  addNotification?: (notification: any) => void;
  onUnlockedMount?: (mountPath: string, devPath: string) => void;
}

export const BitLockerUnlockerView: React.FC<BitLockerUnlockerViewProps> = ({
  addNotification,
  onUnlockedMount
}) => {
  const [volumes, setVolumes] = useState<EncryptedVolume[]>(SAMPLE_ENCRYPTED_VOLUMES);
  const [selectedVolume, setSelectedVolume] = useState<EncryptedVolume>(SAMPLE_ENCRYPTED_VOLUMES[0]);
  const [authMethod, setAuthMethod] = useState<'recovery_key' | 'password' | 'keyfile' | 'tpm'>('recovery_key');
  
  const [recoveryKey, setRecoveryKey] = useState<string>('419280-128491-039482-192840-592817-482910-184920-582910');
  const [password, setPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [keyfilePath, setKeyfilePath] = useState<string>('/mnt/usb_keys/F4B192A0.BEK');
  const [targetMountDir, setTargetMountDir] = useState<string>('/mnt/decrypted_vol');
  
  const [isUnlocking, setIsUnlocking] = useState<boolean>(false);
  const [unlockLogs, setUnlockLogs] = useState<string[]>([
    '[*] Dislocker & Cryptsetup Decryption Assist Daemon v2.12 Initialized',
    '[*] Scanning PCI/USB buses for encrypted BitLocker and LUKS volume headers...',
    '[+] Detected 3 encrypted partitions ready for offline authentication.'
  ]);

  const handleUnlock = () => {
    setIsUnlocking(true);
    setUnlockLogs(prev => [
      ...prev,
      `[*] Authenticating ${selectedVolume.devicePath} using method: ${authMethod.toUpperCase()}...`
    ]);

    setTimeout(() => {
      setUnlockLogs(prev => [
        ...prev,
        `[dislocker] Parsing Volume Master Key (VMK) and Full Volume Encryption Key (FVEK)...`,
        `[dislocker] Cipher verified: ${selectedVolume.cipher} with authenticated SHA-256 header hash.`,
        `[FUSE] Creating virtual cleartext block device: /mnt/dislocker/dislocker-file`,
        `[mount] Mounting NTFS/exFAT filesystem on ${targetMountDir} in Read-Only mode...`,
        `[✓] SUCCESS: Partition ${selectedVolume.devicePath} is now decrypted and mounted at ${targetMountDir}!`
      ]);
      
      setIsUnlocking(false);
      setVolumes(prev => prev.map(v => v.id === selectedVolume.id ? { ...v, status: 'Unlocked', mountPoint: targetMountDir } : v));
      setSelectedVolume(prev => ({ ...prev, status: 'Unlocked', mountPoint: targetMountDir }));

      if (addNotification) {
        addNotification({
          title: 'Volume Decrypted & Mounted',
          message: `${selectedVolume.name} successfully unlocked at ${targetMountDir}`,
          type: 'success'
        });
      }

      if (onUnlockedMount) {
        onUnlockedMount(targetMountDir, selectedVolume.devicePath);
      }
    }, 1800);
  };

  const getCliCommand = () => {
    if (selectedVolume.encryptionType.includes('BitLocker')) {
      if (authMethod === 'recovery_key') {
        return `dislocker -v -V ${selectedVolume.devicePath} -p"${recoveryKey.replace(/-/g, '')}" -- /mnt/dislocker && mount -o loop,ro /mnt/dislocker/dislocker-file ${targetMountDir}`;
      } else if (authMethod === 'password') {
        return `dislocker -v -V ${selectedVolume.devicePath} -u"${password || 'YOUR_PASSWORD'}" -- /mnt/dislocker && mount -o loop,ro /mnt/dislocker/dislocker-file ${targetMountDir}`;
      } else if (authMethod === 'keyfile') {
        return `dislocker -v -V ${selectedVolume.devicePath} -K "${keyfilePath}" -- /mnt/dislocker && mount -o loop,ro /mnt/dislocker/dislocker-file ${targetMountDir}`;
      } else {
        return `dislocker -v -V ${selectedVolume.devicePath} --tpm2-auto -- /mnt/dislocker && mount -o loop,ro /mnt/dislocker/dislocker-file ${targetMountDir}`;
      }
    } else {
      // LUKS
      return `cryptsetup luksOpen ${selectedVolume.devicePath} decrypted_vol && mount -o ro /dev/mapper/decrypted_vol ${targetMountDir}`;
    }
  };

  return (
    <div className="space-y-4">
      {/* Header Banner */}
      <div className="bg-[#0c0f18] p-4 rounded-xl border border-[#1b2234] flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-amber-950/80 border border-amber-500/40 text-amber-400 shadow-md shadow-amber-950/50">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold font-mono text-white">BitLocker To Go & LUKS Decryption Assist</h3>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-500/30">
                OFFLINE FUSE UNLOCKER
              </span>
            </div>
            <p className="text-xs text-[#8fa0b5] mt-0.5">
              Unlock BitLocker-encrypted USB drives, SD cards, and Windows system partitions offline to allow data salvage and RAW file carving.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#141b2c] border border-[#232f4b] text-sky-300 text-xs font-mono">
          <Key className="w-4 h-4 text-amber-400" />
          <span>dislocker 0.7.3 & cryptsetup 2.6.1</span>
        </div>
      </div>

      {/* Main Grid: Device Selector & Key Form */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left: Volume List (Col 5) */}
        <div className="lg:col-span-5 bg-[#0c0f18] p-4 rounded-xl border border-[#1b2234] space-y-3">
          <div className="flex items-center justify-between border-b border-[#1b2234] pb-2">
            <div className="flex items-center gap-2">
              <HardDrive className="w-4 h-4 text-amber-400" />
              <span className="text-xs font-bold font-mono text-white uppercase">1. Select Encrypted Volume</span>
            </div>
            <span className="text-[10px] font-mono text-[#778899]">{volumes.length} Drives Detected</span>
          </div>

          <div className="space-y-2">
            {volumes.map(vol => {
              const isSelected = selectedVolume.id === vol.id;
              const isUnlocked = vol.status === 'Unlocked';
              return (
                <div
                  key={vol.id}
                  onClick={() => setSelectedVolume(vol)}
                  className={`p-3 rounded-lg border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-amber-950/40 border-amber-500/80 shadow-sm'
                      : 'bg-[#101422] border-[#1c2438] hover:border-[#2e3b5a]'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5">
                        {isUnlocked ? (
                          <Unlock className="w-3.5 h-3.5 text-emerald-400" />
                        ) : (
                          <Lock className="w-3.5 h-3.5 text-amber-400" />
                        )}
                        <span className="text-xs font-bold font-mono text-white">{vol.name}</span>
                      </div>
                      <div className="flex items-center gap-2 text-[10px] font-mono text-[#8fa0b5]">
                        <span className="text-sky-400 font-bold">{vol.devicePath}</span>
                        <span>•</span>
                        <span>{vol.size}</span>
                        <span>•</span>
                        <span className="text-amber-300">{vol.cipher}</span>
                      </div>
                    </div>

                    <span className={`text-[9px] font-mono px-2 py-0.5 rounded border shrink-0 ${
                      isUnlocked
                        ? 'bg-emerald-950 text-emerald-300 border-emerald-500/30'
                        : 'bg-amber-950 text-amber-300 border-amber-500/30'
                    }`}>
                      {vol.status}
                    </span>
                  </div>

                  {vol.mountPoint && (
                    <div className="mt-2 text-[10px] font-mono text-emerald-300 bg-emerald-950/30 p-1.5 rounded border border-emerald-500/20 flex items-center justify-between">
                      <span>Mount: {vol.mountPoint}</span>
                      <span className="text-emerald-400 font-bold">READY FOR CARVE</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Decryption Credentials (Col 7) */}
        <div className="lg:col-span-7 bg-[#0c0f18] p-4 rounded-xl border border-[#1b2234] space-y-4">
          <div className="flex items-center justify-between border-b border-[#1b2234] pb-2">
            <div className="flex items-center gap-2">
              <Key className="w-4 h-4 text-sky-400" />
              <span className="text-xs font-bold font-mono text-white uppercase">2. Decryption Key & Credentials</span>
            </div>
            <span className="text-[10px] font-mono text-amber-400">{selectedVolume.encryptionType}</span>
          </div>

          {/* Auth Method Selector */}
          <div className="grid grid-cols-4 gap-2">
            <button
              onClick={() => setAuthMethod('recovery_key')}
              className={`p-2 rounded-lg border text-center transition-all ${
                authMethod === 'recovery_key'
                  ? 'bg-amber-950/60 border-amber-500 text-white'
                  : 'bg-[#101422] border-[#1c2438] text-[#8fa0b5] hover:text-white'
              }`}
            >
              <div className="text-[11px] font-bold font-mono">48-Digit Key</div>
              <div className="text-[9px] text-[#708098]">Recovery Password</div>
            </button>

            <button
              onClick={() => setAuthMethod('password')}
              className={`p-2 rounded-lg border text-center transition-all ${
                authMethod === 'password'
                  ? 'bg-amber-950/60 border-amber-500 text-white'
                  : 'bg-[#101422] border-[#1c2438] text-[#8fa0b5] hover:text-white'
              }`}
            >
              <div className="text-[11px] font-bold font-mono">Passphrase</div>
              <div className="text-[9px] text-[#708098]">User PIN / Pass</div>
            </button>

            <button
              onClick={() => setAuthMethod('keyfile')}
              className={`p-2 rounded-lg border text-center transition-all ${
                authMethod === 'keyfile'
                  ? 'bg-amber-950/60 border-amber-500 text-white'
                  : 'bg-[#101422] border-[#1c2438] text-[#8fa0b5] hover:text-white'
              }`}
            >
              <div className="text-[11px] font-bold font-mono">.BEK File</div>
              <div className="text-[9px] text-[#708098]">USB Flash Key</div>
            </button>

            <button
              onClick={() => setAuthMethod('tpm')}
              className={`p-2 rounded-lg border text-center transition-all ${
                authMethod === 'tpm'
                  ? 'bg-amber-950/60 border-amber-500 text-white'
                  : 'bg-[#101422] border-[#1c2438] text-[#8fa0b5] hover:text-white'
              }`}
            >
              <div className="text-[11px] font-bold font-mono">TPM 2.0</div>
              <div className="text-[9px] text-[#708098]">Hardware PCR Seal</div>
            </button>
          </div>

          {/* Dynamic Credential Input Field */}
          <div className="space-y-3 p-3.5 rounded-lg bg-[#101422] border border-[#1e273e]">
            {authMethod === 'recovery_key' && (
              <div className="space-y-1.5">
                <label className="text-xs font-mono text-[#8fa0b5] flex items-center justify-between">
                  <span>Enter 48-Digit Numerical BitLocker Recovery Key:</span>
                  <span className="text-[10px] text-amber-400">8 groups of 6 digits</span>
                </label>
                <input
                  type="text"
                  value={recoveryKey}
                  onChange={(e) => setRecoveryKey(e.target.value)}
                  placeholder="123456-789012-345678-901234-567890-123456-789012-345678"
                  className="w-full bg-[#090c15] border border-[#232f4b] rounded-lg px-3 py-2 text-xs font-mono text-amber-300 focus:outline-none focus:border-amber-500"
                />
              </div>
            )}

            {authMethod === 'password' && (
              <div className="space-y-1.5">
                <label className="text-xs font-mono text-[#8fa0b5]">
                  Enter BitLocker / LUKS User Passphrase:
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter passphrase..."
                    className="w-full bg-[#090c15] border border-[#232f4b] rounded-lg px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-amber-500 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-2.5 text-[#778899] hover:text-white"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            )}

            {authMethod === 'keyfile' && (
              <div className="space-y-1.5">
                <label className="text-xs font-mono text-[#8fa0b5]">
                  Select External .BEK Key File / Binary Key:
                </label>
                <input
                  type="text"
                  value={keyfilePath}
                  onChange={(e) => setKeyfilePath(e.target.value)}
                  className="w-full bg-[#090c15] border border-[#232f4b] rounded-lg px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-amber-500"
                />
              </div>
            )}

            {authMethod === 'tpm' && (
              <div className="p-3 rounded bg-sky-950/30 border border-sky-500/20 text-xs font-mono text-sky-200 flex items-start gap-2">
                <Cpu className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold text-white">TPM 2.0 Chip Extraction Mode</div>
                  <div className="text-[11px] text-[#8fa0b5] mt-0.5">
                    Will query the local motherboard TPM 2.0 registers via /dev/tpmrm0 with PCR registers [0, 2, 4, 7, 11] to unseal the FVEK.
                  </div>
                </div>
              </div>
            )}

            {/* Mount Point Destination */}
            <div className="flex items-center gap-2 pt-2 border-t border-[#182030] text-xs font-mono text-[#8fa0b5]">
              <span>Mount Target:</span>
              <input
                type="text"
                value={targetMountDir}
                onChange={(e) => setTargetMountDir(e.target.value)}
                className="bg-[#090c15] border border-[#232f4b] rounded px-2 py-1 text-xs font-mono text-white focus:outline-none focus:border-amber-500 w-52"
              />
              <span className="text-[10px] text-emerald-400">(Read-Only Loop)</span>
            </div>
          </div>

          {/* Action Unlock Button */}
          <div className="flex items-center justify-between gap-3 pt-2">
            <div className="text-xs font-mono text-[#778899]">
              Status: <span className={selectedVolume.status === 'Unlocked' ? 'text-emerald-400 font-bold' : 'text-amber-400'}>{selectedVolume.status}</span>
            </div>

            <button
              onClick={handleUnlock}
              disabled={isUnlocking || selectedVolume.status === 'Unlocked'}
              className="px-6 py-2.5 rounded-lg bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white font-mono text-xs font-bold flex items-center gap-2 shadow-lg shadow-amber-600/30 transition-all"
            >
              {isUnlocking ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Unlocking Crypto Container...</span>
                </>
              ) : selectedVolume.status === 'Unlocked' ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                  <span>Volume Unlocked & Ready</span>
                </>
              ) : (
                <>
                  <Unlock className="w-4 h-4" />
                  <span>Authenticate & Mount Volume</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Terminal Command Output & Live Logs */}
      <div className="bg-[#080a11] rounded-xl border border-[#1b2234] p-4 space-y-3">
        <div className="flex items-center justify-between border-b border-[#161d2d] pb-2">
          <div className="flex items-center gap-2">
            <Terminal className="w-4 h-4 text-amber-400" />
            <span className="text-xs font-bold font-mono text-white">Native CLI Execution & Kernel Dislocker Log</span>
          </div>
          <button
            onClick={() => {
              navigator.clipboard?.writeText(getCliCommand());
              if (addNotification) {
                addNotification({
                  title: 'Command Copied',
                  message: 'dislocker unlock command copied to clipboard',
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

        {/* CLI Preview */}
        <div className="p-2.5 rounded-lg bg-[#04060a] border border-[#141b2c] font-mono text-xs text-amber-300 select-all overflow-x-auto">
          <code># {getCliCommand()}</code>
        </div>

        {/* Live Logs */}
        <div className="p-3 rounded-lg bg-[#04060a] border border-[#141b2c] font-mono text-xs space-y-1 max-h-36 overflow-y-auto">
          {unlockLogs.map((log, idx) => (
            <div
              key={idx}
              className={`${
                log.includes('[✓]')
                  ? 'text-emerald-400 font-bold'
                  : log.includes('[dislocker]') || log.includes('[mount]')
                  ? 'text-sky-300'
                  : log.includes('[+]')
                  ? 'text-amber-300'
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
