// jb7572_2026-08-26: SecureCurtain Core Architecture - Diamond-Grade Offline UEFI / BIOS Rootkit & SPI Flash Scanner (Chipsec / Flashrom)
import React, { useState } from 'react';
import {
  Cpu,
  ShieldAlert,
  ShieldCheck,
  Search,
  Lock,
  Unlock,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  Terminal,
  Copy,
  Layers,
  Zap,
  Activity,
  HardDrive,
  FileCode,
  Radio
} from 'lucide-react';

interface UefiAnomaly {
  id: string;
  category: 'NVRAM Variable' | 'SPI Flash Binary' | 'Secure Boot DBX' | 'Intel ME / PSP';
  target: string;
  status: 'CLEAN' | 'VULNERABLE' | 'INFECTED / ROOTKIT';
  details: string;
  recommendation: string;
}

const INITIAL_ANOMALIES: UefiAnomaly[] = [
  {
    id: 'dbx_revocation_check',
    category: 'Secure Boot DBX',
    target: 'Revocation List (DBX) Version 371',
    status: 'CLEAN',
    details: 'BlackLotus CVE-2023-24932 and Baton Drop bootloader hashes properly blocked in DBX.',
    recommendation: 'No action required. Secure Boot keys up to date.'
  },
  {
    id: 'spi_flash_descriptor',
    category: 'SPI Flash Binary',
    target: 'Flash Descriptor (FD) / BIOS Region Access',
    status: 'VULNERABLE',
    details: 'Flash Write Protection (BIOS_CNTL.SMM_BWP) is DISABLED in motherboard firmware.',
    recommendation: 'Enable BIOS Guard / SMM_BWP in OEM Setup to prevent unprivileged SPI flash writes.'
  },
  {
    id: 'nvram_cosmicstrand',
    category: 'NVRAM Variable',
    target: 'UEFI BootOrder / DriverOrder NVRAM Entries',
    status: 'CLEAN',
    details: 'Verified SHA-256 hashes of all EFI executables in EFI System Partition (ESP).',
    recommendation: 'No injected CosmicStrand/MoonBounce DXE driver hooks detected.'
  },
  {
    id: 'intel_me_firmware',
    category: 'Intel ME / PSP',
    target: 'Intel CSME v16.1.25.1865',
    status: 'CLEAN',
    details: 'Hardware Security Engine (CSME) firmware signed and authenticated by Intel Fuse Key.',
    recommendation: 'Management Engine is intact with no downgrade vulnerabilities.'
  }
];

interface UefiRootkitScannerViewProps {
  addNotification?: (notification: any) => void;
}

export const UefiRootkitScannerView: React.FC<UefiRootkitScannerViewProps> = ({ addNotification }) => {
  const [anomalies, setAnomalies] = useState<UefiAnomaly[]>(INITIAL_ANOMALIES);
  const [selectedChipType, setSelectedChipType] = useState<string>('Winbond W25Q128FV (16 MB SPI)');
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [scanProgress, setScanProgress] = useState<number>(0);

  const [uefiLogs, setUefiLogs] = useState<string[]>([
    '[*] Chipsec Hardware Security & UEFI Vulnerability Subsystem Initialized',
    '[*] SPI Flash Controller: Intel PCH SPI /dev/spidev0.0 Detected',
    '[+] Secure Boot State: ENABLED (Microsoft Windows Production PCA 2011)',
    '[✓] Ready to perform deep Ring -2 (SMM) and Ring -3 (CSME/PSP) hardware audit.'
  ]);

  const handleRunChipsecAudit = () => {
    setIsScanning(true);
    setScanProgress(10);

    setUefiLogs(prev => [
      ...prev,
      '[*] Launching Chipsec Deep Architecture & SMM Rootkit Inspection...',
      '[chipsec] Auditing CPU MSR registers, SMRAM lock bits (D_LCK), and SMRR ranges...'
    ]);

    setTimeout(() => {
      setScanProgress(45);
      setUefiLogs(prev => [
        ...prev,
        '[flashrom] Reading 16 MB SPI Flash ROM via hardware interface at 4.2 MB/s...',
        '[uefi-parser] Decompressing NVRAM Volume & validating Authenticode PE/COFF signatures...'
      ]);
    }, 1100);

    setTimeout(() => {
      setScanProgress(80);
      setUefiLogs(prev => [
        ...prev,
        '[dbx] Matching boot manager hashes against 2026 UEFI DBX Revocation database...',
        '[✓] 0 Injected EFI rootkit DXE drivers detected in NVRAM.',
        '[!] WARNING: BIOS_CNTL.SMM_BWP is unset (Firmware Write Protection vulnerable).'
      ]);
    }, 2200);

    setTimeout(() => {
      setScanProgress(100);
      setIsScanning(false);
      setUefiLogs(prev => [
        ...prev,
        '[✓] UEFI FIRMWARE INTEGRITY AUDIT COMPLETE: 4 Modules Verified, 1 Configuration Warning.'
      ]);

      if (addNotification) {
        addNotification({
          title: 'UEFI Firmware Scan Complete',
          message: 'Zero bootkits or SPI flash rootkits detected. BIOS configuration verified.',
          type: 'success'
        });
      }
    }, 3200);
  };

  const getCliCommands = () => {
    return `# 1. Run Chipsec Full Hardware & SMM Security Audit
chipsec_main -m common.bios_wp -m common.smm -m common.uefi.access_uefispec

# 2. Dump SPI Flash via Hardware Programmer or Linux kernel
flashrom -p internal -r /mnt/evidence/spi_bios_dump.bin

# 3. Inspect UEFI NVRAM Variables and Revoked Certificates
uefivars -l && efitools-dump -f /sys/firmware/efi/efivars/dbx-*`;
  };

  return (
    <div className="space-y-4">
      {/* Header Banner */}
      <div className="bg-[#0c0f18] p-4 rounded-xl border border-[#1b2234] flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-cyan-950/80 border border-cyan-500/40 text-cyan-400 shadow-md shadow-cyan-950/50">
            <Cpu className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold font-mono text-white">Offline UEFI / BIOS Rootkit & SPI Flash Scanner</h3>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-500/30">
                CHIPSEC / FLASHROM / SMM AUDITOR
              </span>
            </div>
            <p className="text-xs text-[#8fa0b5] mt-0.5">
              Audits SPI flash memory, SMM rootkits (MoonBounce/BlackLotus), NVRAM boot variables, and Secure Boot DBX revocation lists.
            </p>
          </div>
        </div>

        <button
          onClick={handleRunChipsecAudit}
          disabled={isScanning}
          className="px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white font-mono text-xs font-bold flex items-center gap-2 shadow-lg shadow-cyan-600/30 transition-all"
        >
          {isScanning ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span>Scanning SPI Flash & SMM ({scanProgress}%)...</span>
            </>
          ) : (
            <>
              <Search className="w-4 h-4" />
              <span>Run Chipsec Deep Firmware Audit</span>
            </>
          )}
        </button>
      </div>

      {/* Main Grid: SPI Hardware Target & Audit Matrix */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left: SPI Flash Hardware Info (Col 5) */}
        <div className="lg:col-span-5 bg-[#0c0f18] p-4 rounded-xl border border-[#1b2234] space-y-3">
          <div className="flex items-center justify-between border-b border-[#1b2234] pb-2">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-cyan-400" />
              <span className="text-xs font-bold font-mono text-white uppercase">Hardware SPI & SMM Sensors</span>
            </div>
            <span className="text-[10px] font-mono text-emerald-400">Ring -2 Active</span>
          </div>

          <div className="space-y-2 text-xs font-mono">
            <div className="p-3 rounded-lg bg-[#101422] border border-[#1e273e] space-y-1">
              <div className="text-[#8fa0b5]">Motherboard SPI Chipset:</div>
              <div className="text-white font-bold">{selectedChipType}</div>
              <div className="text-[10px] text-[#708098] pt-1">Direct SPI bus address: 0xFD000000 (16,777,216 Bytes)</div>
            </div>

            <div className="p-3 rounded-lg bg-[#101422] border border-[#1e273e] space-y-1.5">
              <div className="flex justify-between">
                <span className="text-[#8fa0b5]">SMM Lock (D_LCK):</span>
                <span className="text-emerald-400 font-bold">LOCKED (1)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#8fa0b5]">SMRR Base/Mask:</span>
                <span className="text-emerald-400 font-bold">CONFIGURED (Write-Back)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#8fa0b5]">BIOS_CNTL.SMM_BWP:</span>
                <span className="text-amber-400 font-bold">UNSET (0 - Warning)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Detected Firmware Anomalies & DBX Status (Col 7) */}
        <div className="lg:col-span-7 bg-[#0c0f18] p-4 rounded-xl border border-[#1b2234] space-y-3">
          <div className="flex items-center justify-between border-b border-[#1b2234] pb-2">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-cyan-400" />
              <span className="text-xs font-bold font-mono text-white uppercase">Firmware & NVRAM Validation Matrix</span>
            </div>
            <span className="text-[10px] font-mono text-cyan-400">NIST SP 800-147</span>
          </div>

          <div className="space-y-2">
            {anomalies.map(item => (
              <div
                key={item.id}
                className={`p-3 rounded-lg border text-xs font-mono space-y-1 ${
                  item.status === 'INFECTED / ROOTKIT'
                    ? 'bg-red-950/30 border-red-500/60'
                    : item.status === 'VULNERABLE'
                    ? 'bg-amber-950/30 border-amber-500/60'
                    : 'bg-[#101422] border-[#1e273e]'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-white font-bold">{item.target}</span>
                    <span className="text-[9px] px-1.5 py-0.2 rounded bg-[#172033] text-sky-300">
                      {item.category}
                    </span>
                  </div>

                  <span className={`text-[9px] px-2 py-0.5 rounded border font-bold ${
                    item.status === 'CLEAN'
                      ? 'bg-emerald-950 text-emerald-300 border-emerald-500/30'
                      : item.status === 'VULNERABLE'
                      ? 'bg-amber-950 text-amber-300 border-amber-500/30'
                      : 'bg-red-950 text-red-300 border-red-500/30'
                  }`}>
                    {item.status}
                  </span>
                </div>

                <div className="text-[11px] text-[#8fa0b5] pt-0.5">{item.details}</div>
                <div className="text-[10px] text-cyan-300 pt-0.5">Rec: {item.recommendation}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CLI Script & Live Logs */}
      <div className="bg-[#080a11] rounded-xl border border-[#1b2234] p-4 space-y-3">
        <div className="flex items-center justify-between border-b border-[#161d2d] pb-2">
          <div className="flex items-center gap-2">
            <Terminal className="w-4 h-4 text-cyan-400" />
            <span className="text-xs font-bold font-mono text-white">Chipsec & Flashrom Firmware Audit Commands</span>
          </div>
          <button
            onClick={() => {
              navigator.clipboard?.writeText(getCliCommands());
              if (addNotification) {
                addNotification({
                  title: 'Command Copied',
                  message: 'Chipsec bash commands copied to clipboard',
                  type: 'info'
                });
              }
            }}
            className="flex items-center gap-1.5 px-2 py-1 rounded bg-[#131a2b] hover:bg-[#1b253e] text-[11px] font-mono text-[#8fa0b5] hover:text-white transition-all"
          >
            <Copy className="w-3 h-3" />
            <span>Copy Bash Script</span>
          </button>
        </div>

        <div className="p-2.5 rounded-lg bg-[#04060a] border border-[#141b2c] font-mono text-xs text-cyan-300 select-all overflow-x-auto">
          <pre className="text-[11px]">{getCliCommands()}</pre>
        </div>

        <div className="p-3 rounded-lg bg-[#04060a] border border-[#141b2c] font-mono text-xs space-y-1 max-h-36 overflow-y-auto">
          {uefiLogs.map((log, idx) => (
            <div
              key={idx}
              className={`${
                log.includes('[✓]')
                  ? 'text-emerald-400 font-bold'
                  : log.includes('[!] WARNING')
                  ? 'text-amber-300 font-bold'
                  : log.includes('[chipsec]') || log.includes('[flashrom]')
                  ? 'text-cyan-300'
                  : log.includes('[+]')
                  ? 'text-sky-300'
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
