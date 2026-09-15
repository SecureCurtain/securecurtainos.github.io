// jb7572_2026-08-26: RescueToolCatalogView Component
import React, { useState } from 'react';
import { RESCUE_UTILITIES_SUITE, RescueToolItem } from './rescueToolsData';
import {
  Wrench,
  Search,
  CheckCircle2,
  Terminal,
  RefreshCw,
  Play,
  Shield,
  Key,
  HardDrive,
  Cpu,
  Layers,
  FileCode,
  Zap,
  Activity,
  Filter,
  Sliders,
  ExternalLink,
  ShieldCheck,
  RotateCcw
} from 'lucide-react';

interface Props {
  addNotification: (notif: { title: string; message: string; type: 'success' | 'error' | 'info' | 'warning'; appId?: string }) => void;
}

export const RescueToolCatalogView: React.FC<Props> = ({ addNotification }) => {
  const [filterCategory, setFilterCategory] = useState<'all' | 'windows' | 'linux' | 'baremetal' | 'forensics' | 'disk' | 'diagnostics' | 'repair' | 'network' | 'firmware'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedToolId, setSelectedToolId] = useState<string>('bcdboot_bootrec');
  const [activeLogs, setActiveLogs] = useState<string[]>([]);
  const [isExecuting, setIsExecuting] = useState<boolean>(false);
  const [execProgress, setExecProgress] = useState<number>(0);
  const [execStatus, setExecStatus] = useState<string>('Idle');

  // Filtered tool set
  const filteredTools = RESCUE_UTILITIES_SUITE.filter(tool => {
    const matchesCat = filterCategory === 'all' || tool.category === filterCategory;
    const matchesSearch = 
      tool.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tool.purpose.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tool.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCat && matchesSearch;
  });

  const selectedTool = RESCUE_UTILITIES_SUITE.find(t => t.id === selectedToolId) || RESCUE_UTILITIES_SUITE[0];

  const handleExecuteTool = () => {
    setIsExecuting(true);
    setExecProgress(0);
    setExecStatus(`Initializing ${selectedTool.name}...`);
    setActiveLogs([
      `[*] Initializing live environment sandbox for: ${selectedTool.name}`,
      `[*] Executable: ${selectedTool.executable}`,
      `[*] Category: ${selectedTool.category.toUpperCase()} (${selectedTool.type})`
    ]);

    const toolExecutionSteps: Record<string, { p: number; msg: string }[]> = {
      bcdboot_bootrec: [
        { p: 25, msg: '[BCD] Mounting target Windows NTFS partition: C:\\Windows...' },
        { p: 50, msg: '[BCD] Inspecting EFI System Partition (ESP) at S:\\EFI\\Microsoft\\Boot...' },
        { p: 75, msg: '[BCD] Executing bcdboot C:\\Windows /s S: /f UEFI /v (Rebuilding BCD store)...' },
        { p: 90, msg: '[MBR] Executing bootrec /fixmbr && bootrec /fixboot && bootrec /rebuildbcd...' },
        { p: 100, msg: '[✓] SUCCESS: Windows Boot Configuration Data & EFI loaders rebuilt flawlessly!' }
      ],
      ntpwedit: [
        { p: 20, msg: '[SAM] Locating offline SAM registry hive: C:\\Windows\\System32\\config\\SAM...' },
        { p: 45, msg: '[SAM] Decrypting syskey and reading user RID tables (Administrator, Jared, Guest)...' },
        { p: 75, msg: '[SAM] Modifying account flags: Clearing UserAccountControl lockout (0x0010)...' },
        { p: 90, msg: '[SAM] Resetting password hash to empty (Blank/Unlock password)...' },
        { p: 100, msg: '[✓] SUCCESS: Local Windows Admin account unlocked! Password reset successful.' }
      ],
      offline_regedit: [
        { p: 20, msg: '[REG] Mounting offline hives: C:\\Windows\\System32\\config\\SYSTEM -> HKLM\\OFFLINE_SYSTEM' },
        { p: 50, msg: '[REG] Scanning ControlSet001\\Services for faulty boot drivers and BSOD triggers...' },
        { p: 75, msg: '[REG] Modifying faulty driver Start value from 0 (Boot) to 4 (Disabled)...' },
        { p: 90, msg: '[REG] Unloading hive and flushing transactional logs (reg unload)...' },
        { p: 100, msg: '[✓] SUCCESS: Offline registry fixed! Problematic boot drivers disabled.' }
      ],
      memtest86_plus: [
        { p: 15, msg: '[RAM] Allocating 32GB DRAM physical address map (0x0000000000 - 0x0800000000)...' },
        { p: 40, msg: '[TEST] Pass 1: Moving Inversions test (0s & 1s pattern) - 0 errors found' },
        { p: 70, msg: '[TEST] Pass 2: Block Move & Bit Fade Stress (AVX2 DRAM Controller) - 0 errors' },
        { p: 90, msg: '[TEST] Pass 3: Random Number Sequence & Modulo 20 - 0 bit errors' },
        { p: 100, msg: '[✓] MEMORY AUDIT PASSED: 32 GB DDR5 verified 100% stable without single parity fault.' }
      ],
      prime95_mprime: [
        { p: 20, msg: '[STRESS] Launching mprime Small FFTs across all 16 CPU cores (32 threads)...' },
        { p: 50, msg: '[AVX] AVX-512 & FMA3 execution pipelines loaded at 100% duty cycle (~85°C)...' },
        { p: 80, msg: '[L1/L2/L3] Cache coherency check & round-off error verification: 0 errors detected' },
        { p: 100, msg: '[✓] CPU STABILITY VERIFIED: VRM power delivery, caches & microcode rock solid.' }
      ],
      dban_nwipe: [
        { p: 25, msg: '[SANITIZE] Engaging NIST SP 800-88 Purge / DoD 5220.22-M 3-Pass Overwrite...' },
        { p: 50, msg: '[PASS 1] Writing pseudo-random entropy bitstream to all LBA sectors (0 - Max LBA)...' },
        { p: 75, msg: '[PASS 2] Writing binary compliment 0xFF and zero fill 0x00 to all blocks...' },
        { p: 95, msg: '[VERIFY] Reading back sector sample headers: 100% sanitization verified' },
        { p: 100, msg: '[✓] DRIVE SANITIZED: Cryptographic erasure complete. Zero recoverable data remains.' }
      ],
      rstudio_getdataback: [
        { p: 20, msg: '[MFT] Scanning NTFS Master File Table entries and cluster runs...' },
        { p: 50, msg: '[CARVE] Identified 14,200 recoverable documents, media files, and system registries...' },
        { p: 85, msg: '[EXPORT] Rebuilding virtual folder directory hierarchy in memory...' },
        { p: 100, msg: '[✓] RECOVERY READY: 98.6% of lost files indexed and ready for export to external drive.' }
      ],
      sd_flash_retriever: [
        { p: 20, msg: '[FLASH] Mounting target SD card /dev/mmcblk0 in strict Read-Only write-blocker mode...' },
        { p: 45, msg: '[CARVE] Parsing NAND flash cluster runs for binary signatures (CR3, ARW, MP4, WAV, PDF)...' },
        { p: 75, msg: '[REBUILD] Salvaged 9 deleted camera RAW photos and 4K video clips (1.82 GB)...' },
        { p: 90, msg: '[VERIFY] Calculating SHA-256 stream digests and checking EXIF metadata headers...' },
        { p: 100, msg: '[✓] SD CARD RETRIEVER FINISHED: 100% of deleted flash files salvaged with zero data loss.' }
      ],
      fat_exfat_healer: [
        { p: 20, msg: '[FAT] Reading primary and backup File Allocation Tables on /dev/mmcblk0p1...' },
        { p: 50, msg: '[ORPHAN] Walking unlinked directory chains and resolving corrupted 0xE5 cluster marks...' },
        { p: 80, msg: '[TREE] Rebuilding /DCIM/100CANON and /DCIM/Camera folder directory trees...' },
        { p: 100, msg: '[✓] DIRECTORY RESTORED: All orphaned FAT32/exFAT folders and filenames restored.' }
      ],
      bitlocker_luks_assist: [
        { p: 20, msg: '[DISLOCKER] Initializing offline BitLocker VMK/FVEK key unsealer...' },
        { p: 50, msg: '[AUTH] 48-digit numerical recovery key verified against AES-XTS volume header...' },
        { p: 80, msg: '[FUSE] Mounting cleartext loopback block device to /mnt/dislocker-file...' },
        { p: 100, msg: '[✓] VOLUME UNLOCKED: Read-Only filesystem mounted and ready for data carving.' }
      ],
      raw_video_moov_healer: [
        { p: 20, msg: '[UNTRUNC] Scanning truncated MP4/MOV container for raw MDAT payload...' },
        { p: 50, msg: '[SAMPLE] Extracting SPS/PPS/VPS codec matrices from healthy camera reference file...' },
        { p: 80, msg: '[STBL] Reconstructing STTS, STSZ, and STCO time-to-sample frame index tables...' },
        { p: 100, msg: '[✓] VIDEO REPAIRED: New MOOV atom injected. 100% playable video output synthesized.' }
      ],
      cloud_backup_rclone: [
        { p: 20, msg: '[RCLONE] Initializing TLS 1.3 encrypted handshake with remote S3/SFTP storage...' },
        { p: 50, msg: '[CRYPT] Applying on-the-fly client-side AES-256-GCM zero-knowledge encryption...' },
        { p: 85, msg: '[STREAM] Uploaded 1.82 GB in 8 parallel worker threads at 112 MB/s...' },
        { p: 100, msg: '[✓] CLOUD SYNC COMPLETE: SHA-256 hash manifest validated on remote endpoint.' }
      ],
      forensic_write_blocker: [
        { p: 25, msg: '[KERNEL] Injecting /sys/block/*/ro lockdown rules into active kernel table...' },
        { p: 50, msg: '[UDEV] Applying 99-forensic-writeblock.rules to USB, NVMe, and SATA buses...' },
        { p: 80, msg: '[BLOCKDEV] Forcing blockdev --setro on all attached evidence drives...' },
        { p: 100, msg: '[✓] WRITE-BLOCK ACTIVE: Evidentiary write protection verified with 0 bytes written.' }
      ],
      volatile_memory_triage: [
        { p: 20, msg: '[AVML] Attaching to /dev/crash direct memory driver on 32 GB physical host...' },
        { p: 55, msg: '[DUMP] Streaming raw physical address pages at 850 MB/s to live_ram_dump.raw...' },
        { p: 85, msg: '[VOLATILITY] Carving BitLocker FVEK key expansion tables and scanning for RWX injections...' },
        { p: 100, msg: '[✓] MEMORY TRIAGE COMPLETE: Carved 1 BitLocker FVEK key and neutralized 1 injection.' }
      ],
      hardware_stress_suite: [
        { p: 25, msg: '[MEMTEST] Launching 8-thread multi-core DDR5 walking 1s and Rowhammer memory tests...' },
        { p: 55, msg: '[PRIME95] Small FFT AVX-512 torture test running at 135W TDP on 16 threads...' },
        { p: 85, msg: '[NVME] 4K Random read/write IOPS benchmark validated at 780k IOPS...' },
        { p: 100, msg: '[✓] HARDWARE STRESS PASSED: 0 memory bitflips and 0 thermal throttling faults detected.' }
      ],
      forensic_report_generator: [
        { p: 25, msg: '[INGEST] Compiling evidence case metadata, device serial numbers, and SHA-256 hash chains...' },
        { p: 50, msg: '[CUSTODY] Formatting NIST SP 800-86 compliant chain-of-custody event timeline...' },
        { p: 80, msg: '[SIGN] Affixing SecureCurtain Diamond HSM cryptographic digital certificate seal...' },
        { p: 100, msg: '[✓] REPORT GENERATED: Exported certified courtroom-ready PDF/HTML report.' }
      ],
      windows_sam_chntpw: [
        { p: 25, msg: '[HIVEX] Mounting offline Windows partition and parsing SYSTEM32/CONFIG/SAM hive...' },
        { p: 55, msg: '[CHNTPW] Resetting Administrator password to 0x00 (blank) and clearing lock flags...' },
        { p: 85, msg: '[AUTORUN] Purging malicious Run/RunOnce persistence entries from SOFTWARE hive...' },
        { p: 100, msg: '[✓] ACCESS RESTORED: Windows local Administrator unlocked and malware persistence purged.' }
      ],
      nist_data_sanitizer: [
        { p: 20, msg: '[TARGET] Identifying NVMe namespace and controller cryptographic capabilities...' },
        { p: 50, msg: '[NVME-CLI] Issuing SES=2 Cryptographic Erase command (Hardware MEK key destruction)...' },
        { p: 80, msg: '[VERIFY] Sampling 10,000 sectors for post-wipe Shannon entropy validation (0.000000)...' },
        { p: 100, msg: '[✓] MEDIA PURGED: NIST SP 800-88 Certificate of Destruction generated and signed.' }
      ],
      uefi_rootkit_scanner: [
        { p: 20, msg: '[CHIPSEC] Auditing CPU MSR registers, SMRAM lock bits (D_LCK), and SMRR ranges...' },
        { p: 50, msg: '[FLASHROM] Dumping 16 MB SPI Flash ROM and decompressing NVRAM Volume...' },
        { p: 80, msg: '[DBX] Validating Authenticode PE/COFF signatures against 2026 DBX revocation database...' },
        { p: 100, msg: '[✓] FIRMWARE AUDIT COMPLETE: 0 SMM rootkits detected. BIOS write-protection verified.' }
      ],
      forensic_supertimeline: [
        { p: 20, msg: '[PLASO] Parsing NTFS $MFT, $LogFile, and $UsnJrnl across 1.48M filesystem records...' },
        { p: 50, msg: '[EVTX] Correlating Windows Security Event Logs and PowerShell script block activity...' },
        { p: 80, msg: '[PSORT] Sorting chronological artifact events by microsecond timestamps...' },
        { p: 100, msg: '[✓] TIMELINE RECONSTRUCTED: Super-timeline synthesized for incident reconstruction.' }
      ],
      stealth_network_triage: [
        { p: 25, msg: '[STEALTH] Configuring zero-emission passive TAP interface (ARP/DHCP broadcast blocked)...' },
        { p: 55, msg: '[ZEEK] Analyzing promiscuous PCAP stream for ARP spoofing and rogue DHCP servers...' },
        { p: 85, msg: '[BEACON] Correlating periodic outbound beaconing and C2 heartbeat telemetry...' },
        { p: 100, msg: '[✓] NETWORK TRIAGE COMPLETE: Zero packet emission footprint maintained.' }
      ],
      offline_yara_ransomware: [
        { p: 25, msg: '[YARA] Compiling 4,820 ransomware and APT detection rules against unmounted drive...' },
        { p: 55, msg: '[BYOVD] Scanning Windows/System32/drivers for vulnerable signed kernel modules...' },
        { p: 85, msg: '[DECRYPT] Matching Stop/DJVU and LockBit offline master key tables...' },
        { p: 100, msg: '[✓] THREATS NEUTRALIZED: Malicious driver quarantined and offline recovery completed.' }
      ],
      pacman_pkg_manager: [
        { p: 20, msg: '[PACMAN] Initializing libalpm core backend and checking /etc/pacman.d/mirrorlist...' },
        { p: 50, msg: '[KEYRING] Running pacman-key --init && pacman-key --populate archlinux (GPG TrustDB)...' },
        { p: 75, msg: '[SYNC] Synchronizing package databases: core.db (1.6 MB), extra.db (9.2 MB), multilib.db...' },
        { p: 100, msg: '[✓] PACMAN READY: Package manager synchronized with signed Arch Linux repositories.' }
      ],
      yay_aur_helper: [
        { p: 20, msg: '[YAY] Checking Go compiler toolchain and AUR RPC v5 endpoint connectivity...' },
        { p: 50, msg: '[AUR] Fetching PKGBUILD recipes from aur.archlinux.org (volatility3, pcileech, memprocfs)...' },
        { p: 80, msg: '[MAKEPKG] Compiling source binaries in isolated non-root build container...' },
        { p: 100, msg: '[✓] YAY COMPILATION SUCCESS: AUR binaries installed into /usr/bin/ system PATH.' }
      ],
      multidistro_repo_hook: [
        { p: 20, msg: '[KEYRING] Importing GPG keys: Arch Master (0x97DBFA96), Debian (0xF8D2C770), Kali (0xED444FF0)...' },
        { p: 50, msg: '[MIRRORS] Validating HTTPS endpoints: deb.debian.org, http.kali.org, geo.mirror.pkgbuild.com...' },
        { p: 80, msg: '[TRUSTDB] Exporting armored dearmored *.gpg keyrings into /usr/share/keyrings/...' },
        { p: 100, msg: '[✓] MULTI-REPO HOOK ACTIVE: Unified APT/Pacman/Yay package pool fully unlocked and verified.' }
      ]
    };

    const defaultSteps = [
      { p: 30, msg: `[EXEC] Executing ${selectedTool.executable} with root/admin privileges...` },
      { p: 60, msg: `[PROCESS] Processing target partitions and memory maps...` },
      { p: 85, msg: `[SYNC] Writing changes and verifying integrity...` },
      { p: 100, msg: `[✓] SUCCESS: Operation completed successfully by ${selectedTool.name}!` }
    ];

    const steps = toolExecutionSteps[selectedTool.id] || defaultSteps;

    steps.forEach((step, idx) => {
      setTimeout(() => {
        setExecProgress(step.p);
        setActiveLogs(prev => [...prev, step.msg]);
        if (idx === steps.length - 1) {
          setIsExecuting(false);
          setExecStatus('Operation Succeeded');
          addNotification({
            title: `${selectedTool.name} Finished`,
            message: `Tool completed successfully on target block device/memory.`,
            type: 'success',
            appId: 'iso-builder'
          });
        }
      }, (idx + 1) * 450);
    });
  };

  return (
    <div className="space-y-4">
      {/* Top Filter and Search Bar */}
      <div className="bg-[#0c0f18] p-4 rounded-xl border border-[#1b2234] flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-purple-950/60 border border-purple-500/30 text-purple-400">
            <Wrench className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold font-mono text-white">Universal Diagnostic & Rescue Tool Suite</h3>
            <p className="text-[11px] text-[#8090a8]">
              18+ Windows (WinPE/WinRE), Linux, Forensics & Bare-Metal Hardware Repair Utilities
            </p>
          </div>
        </div>

        {/* Categories Tabs */}
        <div className="flex items-center gap-1 bg-[#07090e] p-1 rounded-lg border border-[#1a2133] overflow-x-auto">
          {(['all', 'windows', 'linux', 'forensics', 'disk', 'firmware', 'network', 'diagnostics', 'repair', 'baremetal'] as const).map(cat => (
            <button
              key={cat}
              onClick={() => setFilterCategory(cat)}
              className={`px-2 py-1 rounded text-xs font-mono capitalize transition-all whitespace-nowrap ${
                filterCategory === cat
                  ? 'bg-purple-950/80 text-purple-200 border border-purple-500/40 font-bold'
                  : 'text-[#708098] hover:text-white'
              }`}
            >
              {cat === 'all' ? `All (${RESCUE_UTILITIES_SUITE.length})` : cat}
            </button>
          ))}
        </div>

        {/* Search input */}
        <div className="relative min-w-[200px]">
          <Search className="w-3.5 h-3.5 text-[#556688] absolute left-2.5 top-2.5" />
          <input
            type="text"
            placeholder="Search utility, command or tag..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#111624] border border-[#1e273e] rounded-lg pl-8 pr-3 py-1.5 text-xs text-white font-mono placeholder-[#556688] focus:outline-none focus:border-purple-500"
          />
        </div>
      </div>

      {/* Main Grid: Catalog List & Interactive Execution Sandbox */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left Column: Tool Cards List */}
        <div className="lg:col-span-6 space-y-2 max-h-[640px] overflow-y-auto pr-1">
          {filteredTools.map(tool => {
            const isSelected = selectedToolId === tool.id;
            return (
              <div
                key={tool.id}
                onClick={() => {
                  setSelectedToolId(tool.id);
                  setActiveLogs([`[*] Selected tool: ${tool.name}`, `[*] Executable: ${tool.executable}`, `[*] Ready for simulated execution.`]);
                  setExecProgress(0);
                  setExecStatus('Ready');
                }}
                className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-purple-950/30 border-purple-500/80 shadow-md shadow-purple-950/30'
                    : 'bg-[#0c0f18] border-[#1b2234] hover:border-[#2e3b5a]'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs text-white font-mono">{tool.name}</span>
                      <span className={`text-[9px] font-mono px-1.5 py-0.2 rounded border ${
                        tool.category === 'windows'
                          ? 'bg-blue-950/60 text-blue-300 border-blue-500/30'
                          : tool.category === 'linux'
                          ? 'bg-amber-950/60 text-amber-300 border-amber-500/30'
                          : tool.category === 'forensics'
                          ? 'bg-emerald-950/60 text-emerald-300 border-emerald-500/30'
                          : 'bg-cyan-950/60 text-cyan-300 border-cyan-500/30'
                      }`}>
                        {tool.type}
                      </span>
                    </div>
                    <p className="text-[11px] text-[#8fa0b5] mt-1 line-clamp-2">
                      {tool.purpose}
                    </p>
                  </div>

                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#131929] text-emerald-300 shrink-0 border border-emerald-500/20">
                    {tool.status}
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-1.5 mt-2.5 pt-2 border-t border-[#161c2c]">
                  <span className="text-[10px] font-mono text-[#556688]">{tool.executable}</span>
                  <div className="flex items-center gap-1 ml-auto">
                    {tool.tags.map((t, idx) => (
                      <span key={idx} className="text-[9px] px-1.5 py-0.2 rounded bg-[#101422] text-[#8899aa]">
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}

          {filteredTools.length === 0 && (
            <div className="p-8 rounded-xl bg-[#0c0f18] border border-[#1b2234] text-center text-xs font-mono text-[#778899]">
              No diagnostic utilities match the selected filter.
            </div>
          )}
        </div>

        {/* Right Column: Selected Tool Detail & Execution Sandbox */}
        <div className="lg:col-span-6 space-y-4">
          <div className="bg-[#0c0f18] p-5 rounded-xl border border-[#1b2234] space-y-4">
            {/* Header */}
            <div className="flex items-start justify-between border-b border-[#1b2234] pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-bold font-mono text-white">{selectedTool.name}</h4>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-950 text-purple-300 border border-purple-500/30">
                    {selectedTool.category.toUpperCase()}
                  </span>
                </div>
                <div className="text-xs font-mono text-sky-400 mt-1">Binary / Command: `{selectedTool.executable}`</div>
              </div>

              <button
                onClick={handleExecuteTool}
                disabled={isExecuting}
                className="px-4 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white font-mono text-xs font-bold flex items-center gap-1.5 transition-all shadow-lg shadow-purple-600/30"
              >
                {isExecuting ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Executing ({execProgress}%)...</span>
                  </>
                ) : (
                  <>
                    <Play className="w-3.5 h-3.5" />
                    <span>Launch & Run</span>
                  </>
                )}
              </button>
            </div>

            {/* Description & Technical Specifications */}
            <div className="space-y-2 text-xs font-mono">
              <div className="p-3 rounded-lg bg-[#111624] border border-[#1e273e] space-y-1">
                <span className="text-[#8899aa] text-[10px] uppercase font-bold">Purpose & Capabilities</span>
                <p className="text-[#cbd5e1] text-[11px] leading-relaxed">
                  {selectedTool.description}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="p-2.5 rounded-lg bg-[#111624] border border-[#1e273e]">
                  <div className="text-[10px] text-[#8899aa]">Environment Type:</div>
                  <div className="text-xs font-bold text-white mt-0.5">{selectedTool.type}</div>
                </div>
                <div className="p-2.5 rounded-lg bg-[#111624] border border-[#1e273e]">
                  <div className="text-[10px] text-[#8899aa]">Live ISO Status:</div>
                  <div className="text-xs font-bold text-emerald-400 mt-0.5">{selectedTool.status} (In RAMDisk)</div>
                </div>
              </div>
            </div>

            {/* Interactive Live Sandbox Execution Console */}
            <div className="bg-[#05060a] p-4 rounded-xl border border-[#1b2030] space-y-2">
              <div className="flex items-center justify-between text-xs font-mono text-purple-400 font-bold border-b border-[#182030] pb-2">
                <span>Rescue Console Execution Stream</span>
                <span>{execStatus}</span>
              </div>

              {isExecuting && (
                <div className="w-full bg-[#111624] h-1.5 rounded-full overflow-hidden">
                  <div 
                    className="bg-purple-500 h-full transition-all duration-300 shadow-[0_0_12px_#a855f7]"
                    style={{ width: `${execProgress}%` }}
                  />
                </div>
              )}

              <div className="font-mono text-[11px] text-[#94a3b8] space-y-1 max-h-[190px] overflow-y-auto bg-[#020305] p-3 rounded-lg border border-[#131826] min-h-[130px]">
                {activeLogs.length === 0 ? (
                  <div className="text-[#556677] italic">Click "Launch & Run" to execute this diagnostic tool against simulated hardware.</div>
                ) : (
                  activeLogs.map((log, idx) => (
                    <div 
                      key={idx} 
                      className={
                        log.includes('SUCCESS') || log.includes('PASSED') 
                          ? 'text-emerald-400 font-bold' 
                          : log.includes('Executing') || log.includes('Inspecting') || log.includes('PASS')
                          ? 'text-sky-300' 
                          : 'text-[#cbd5e1]'
                      }
                    >
                      {log}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
