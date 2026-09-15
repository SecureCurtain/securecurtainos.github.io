// jb7572_2026-08-26: SecureCurtain Core Architecture - Microkernel System Repair, Boot Recovery & Watchdog Control Studio
import React, { useState, useEffect } from 'react';
import { useDesktop } from '../../../context/DesktopContext';
import { 
  HeartPulse, 
  ShieldCheck, 
  AlertTriangle, 
  RefreshCw, 
  Activity, 
  Zap, 
  RotateCcw, 
  Server, 
  Radio,
  CheckCircle2,
  Bug,
  Flame,
  Clock,
  HardDrive,
  Wrench,
  ShieldAlert,
  FileCheck,
  Check,
  ArrowRight,
  Play,
  Download,
  Lock,
  CheckCircle,
  Shield,
  AlertOctagon,
  Terminal,
  Copy,
  Sparkles,
  FolderArchive,
  Layers,
  Cpu,
  FileText,
  HelpCircle,
  Undo2,
  Fingerprint,
  ToggleLeft,
  ToggleRight,
  History,
  FileCode,
  Sliders,
  CheckCheck
} from 'lucide-react';
import { AdminPinElevationModal } from '../../common/AdminPinElevationModal';

interface SubsystemDaemon {
  id: string;
  name: string;
  ring: 'Ring 3 (Isolated)' | 'Ring 0 (Supervisor)';
  pid: number;
  status: 'healthy' | 'recovering' | 'failed';
  heartbeatMs: number;
  restartCount: number;
  lastFault?: string;
  uptimeSec: number;
}

interface GoldenFileManifest {
  path: string;
  type: 'BOOT_LOADER' | 'RING0_KERNEL' | 'INITRD_ARCHIVE' | 'DRIVER_BUNDLE' | 'SUBSYSTEM_BIN' | 'ROOT_SUPERBLOCK';
  sizeFormatted: string;
  sha256Hash: string;
  lastVerified: string;
  status: 'PROTECTED_IMMUTABLE' | 'VERIFIED_MATCH' | 'CORRUPTION_DETECTED';
}

interface DiagnosticIssue {
  id: string;
  component: string;
  category: 'BOOT_CHAIN' | 'FILESYSTEM' | 'KERNEL_BIN' | 'SUBSYSTEM_DRV';
  severity: 'CRITICAL' | 'WARNING' | 'HEALTHY';
  description: string;
  corruptedPath: string;
  goldenSourcePath: string;
  suggestedFix: string;
  fixed?: boolean;
}

export interface BaselineConfigItem {
  id: string;
  category: 'HARDWARE' | 'SOFTWARE' | 'CONFIG' | 'KERNEL';
  name: string;
  target: string;
  baselineSignature: string;
  currentSignature: string;
  status: 'IN_SPEC' | 'DRIFT_DETECTED' | 'UNAUTHORIZED_MODIFICATION';
  lastAudited: string;
  specDetails: string;
}

export interface BaselineChangeEntry {
  id: string;
  timestamp: string;
  actor: string;
  category: 'HARDWARE' | 'SOFTWARE' | 'CONFIG' | 'SECURITY';
  severity: 'INFO' | 'WARNING' | 'CRITICAL' | 'SUCCESS';
  action: string;
  description: string;
  authorized: boolean;
  pinElevated: boolean;
  diffSummary?: string;
}

type ActiveTab = 'watchdog' | 'golden-partition' | 'auto-repair' | 'tech-wizard' | 'self-audit';

export const WatchdogRecoveryApp: React.FC = () => {
  const { addNotification } = useDesktop();

  const [activeTab, setActiveTab] = useState<ActiveTab>('watchdog');

  // ==========================================
  // TAB 1: WATCHDOG & SELF-HEALING DAEMONS
  // ==========================================
  const [daemons, setDaemons] = useState<SubsystemDaemon[]>([
    { id: 'gpu_srv', name: 'virtio_gpu_compositor', ring: 'Ring 3 (Isolated)', pid: 104, status: 'healthy', heartbeatMs: 1, restartCount: 0, uptimeSec: 1420 },
    { id: 'net_srv', name: 'virtio_net_daemon', ring: 'Ring 3 (Isolated)', pid: 105, status: 'healthy', heartbeatMs: 2, restartCount: 0, uptimeSec: 1420 },
    { id: 'audio_srv', name: 'intel_hda_dsp_srv', ring: 'Ring 3 (Isolated)', pid: 106, status: 'healthy', heartbeatMs: 3, restartCount: 0, uptimeSec: 1420 },
    { id: 'posix_srv', name: 'posix_linux_personality', ring: 'Ring 3 (Isolated)', pid: 107, status: 'healthy', heartbeatMs: 1, restartCount: 0, uptimeSec: 1420 },
    { id: 'win32_srv', name: 'win32_nt_subsystem', ring: 'Ring 3 (Isolated)', pid: 108, status: 'healthy', heartbeatMs: 2, restartCount: 0, uptimeSec: 1420 },
    { id: 'vfs_srv', name: 'vfs_ext4_storage_srv', ring: 'Ring 3 (Isolated)', pid: 109, status: 'healthy', heartbeatMs: 1, restartCount: 0, uptimeSec: 1420 },
    { id: 'ipc_srv', name: 'ipc_capability_router', ring: 'Ring 3 (Isolated)', pid: 110, status: 'healthy', heartbeatMs: 1, restartCount: 0, uptimeSec: 1420 },
  ]);

  const [totalRecoveries, setTotalRecoveries] = useState<number>(14);
  const [mttrMs, setMttrMs] = useState<number>(1.4);
  const [logs, setLogs] = useState<string[]>([
    '[WATCHDOG] Supervisor initialized on Core 0. Polling 7 Ring 3 servers at 1000Hz heartbeat.',
    '[WATCHDOG] Hardware page fault isolation verified. Kernel Panic probability: 0.00%.'
  ]);

  // Periodic heartbeat timer
  useEffect(() => {
    const interval = setInterval(() => {
      setDaemons(prev => prev.map(d => ({
        ...d,
        uptimeSec: d.status === 'healthy' ? d.uptimeSec + 1 : d.uptimeSec,
        heartbeatMs: Math.floor(Math.random() * 3) + 1
      })));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Simulate Fault Injection and Self-Healing Recovery
  const handleInjectFault = (targetId: string, faultType: 'segfault' | 'timeout' | 'oom') => {
    const target = daemons.find(d => d.id === targetId);
    if (!target) return;

    const faultDescriptions = {
      segfault: 'SIGSEGV: Null-pointer dereference at 0x00000000',
      timeout: 'WATCHDOG_TIMEOUT: Subsystem missed 3 consecutive heartbeat pings (>15ms)',
      oom: 'OOM_KILLER: Exceeded isolated Ring 3 memory quota (128MB)'
    };

    const faultText = faultDescriptions[faultType];
    const timestamp = new Date().toLocaleTimeString();

    // Mark as recovering
    setDaemons(prev => prev.map(d => {
      if (d.id === targetId) {
        return {
          ...d,
          status: 'recovering',
          lastFault: faultText,
          restartCount: d.restartCount + 1,
        };
      }
      return d;
    }));

    setLogs(prev => [
      `[${timestamp}] ⚠️ FAULT DETECTED in [${target.name}] (PID ${target.pid}): ${faultText}`,
      `[${timestamp}] 🛡️ [Ring 0 Watchdog] Revoking invalid IPC capability handles for PID ${target.pid}...`,
      ...prev
    ]);

    // Simulate instant kernel self-healing in 1.4ms
    setTimeout(() => {
      const newPid = Math.floor(Math.random() * 800) + 200;
      setDaemons(prev => prev.map(d => {
        if (d.id === targetId) {
          return {
            ...d,
            pid: newPid,
            status: 'healthy',
            uptimeSec: 1
          };
        }
        return d;
      }));

      setTotalRecoveries(prev => prev + 1);
      const recoveryTime = (Math.random() * 0.8 + 1.1).toFixed(1);
      setMttrMs(Number(recoveryTime));

      setLogs(prev => [
        `[${timestamp}] ✓ RECOVERY COMPLETE: Spawned new [${target.name}] (New PID ${newPid}) in ${recoveryTime}ms. Zero OS reboot required!`,
        ...prev
      ]);

      addNotification({
        title: `Self-Healing: ${target.name} Recovered`,
        message: `Ring 0 Watchdog recycled crashed server in ${recoveryTime}ms without kernel panic.`,
        type: 'success',
        appId: 'watchdog-recovery'
      });
    }, 1200);
  };

  // ==========================================
  // TAB 2: PROTECTED GOLDEN PARTITION
  // ==========================================
  const [goldenFiles] = useState<GoldenFileManifest[]>([
    {
      path: '/recovery/BOOTX64.EFI',
      type: 'BOOT_LOADER',
      sizeFormatted: '1.2 MB',
      sha256Hash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
      lastVerified: 'Today, 14:12',
      status: 'PROTECTED_IMMUTABLE'
    },
    {
      path: '/recovery/securecurtain_ring0.bin',
      type: 'RING0_KERNEL',
      sizeFormatted: '4.8 MB',
      sha256Hash: '8f434346648f6b96df89dda901c5176b10a6d83961dd3c1ac88b59b2dc327aa4',
      lastVerified: 'Today, 14:12',
      status: 'PROTECTED_IMMUTABLE'
    },
    {
      path: '/recovery/initrd_golden.tar.gz',
      type: 'INITRD_ARCHIVE',
      sizeFormatted: '38.4 MB',
      sha256Hash: '2c26b46b68ffc68ff99b453c1d30413413422d706483bfa0f98a5e886266e7ae',
      lastVerified: 'Today, 14:12',
      status: 'PROTECTED_IMMUTABLE'
    },
    {
      path: '/recovery/subsystems_bundle.img',
      type: 'SUBSYSTEM_BIN',
      sizeFormatted: '18.4 GB',
      sha256Hash: 'fcde2b2edba56bf408601fb721fe9b5c338d10ee429ea04fae5511b68fbf8fb9',
      lastVerified: 'Today, 14:12',
      status: 'PROTECTED_IMMUTABLE'
    },
    {
      path: '/recovery/drivers_virtio_suite.tar',
      type: 'DRIVER_BUNDLE',
      sizeFormatted: '12.1 GB',
      sha256Hash: 'a591a6d40bf420404a011733cfb7b190d62c65bf0bcda32b57b277d9ad9f146e',
      lastVerified: 'Today, 14:12',
      status: 'PROTECTED_IMMUTABLE'
    },
    {
      path: '/recovery/superblock_backup.meta',
      type: 'ROOT_SUPERBLOCK',
      sizeFormatted: '512 KB',
      sha256Hash: '9b71d224bd62f3785d96d46ad3ea3d73319bfbc2890caadae2dff72519673ca7',
      lastVerified: 'Today, 14:12',
      status: 'PROTECTED_IMMUTABLE'
    }
  ]);

  const [isVerifyingGolden, setIsVerifyingGolden] = useState(false);
  const [goldenAuditResult, setGoldenAuditResult] = useState<string | null>(null);

  const handleVerifyGoldenImage = () => {
    setIsVerifyingGolden(true);
    setGoldenAuditResult(null);

    setTimeout(() => {
      setIsVerifyingGolden(false);
      setGoldenAuditResult('ALL 6 GOLDEN ARTIFACTS CRYPTOGRAPHICALLY INTACT (SHA-256 PASS)');
      addNotification({
        title: 'Golden Image Verified',
        message: 'Protected /recovery partition checksums match 100% against OEM hardware signature.',
        type: 'success',
        appId: 'watchdog-recovery'
      });
    }, 1500);
  };

  // ==========================================
  // TAB 3: AUTOMATED 1-CLICK SYSTEM REPAIR
  // ==========================================
  const [isAutoRepairing, setIsAutoRepairing] = useState(false);
  const [autoRepairProgress, setAutoRepairProgress] = useState(0);
  const [autoRepairPhase, setAutoRepairPhase] = useState<string>('Idle');
  const [autoRepairLogs, setAutoRepairLogs] = useState<string[]>([]);
  const [autoRepairDone, setAutoRepairDone] = useState(false);

  const handleRunAutoRepair = () => {
    setIsAutoRepairing(true);
    setAutoRepairProgress(5);
    setAutoRepairPhase('Phase 1: Superblock & Ext4 Inode Scan');
    setAutoRepairDone(false);
    setAutoRepairLogs([
      '[*] Initializing Automated Safe-Recovery Pipeline...',
      '[*] Mounting Read-Only Golden Image Partition from /dev/nvme0n1p6 (ro,nosuid,nodev)...'
    ]);

    const phases = [
      {
        progress: 25,
        phase: 'Phase 1: Filesystem & Superblock Check',
        log: '[fsck.ext4] Scanning /sys inodes (block offset 0x8000)... Cleaned 2 orphaned inodes.'
      },
      {
        progress: 50,
        phase: 'Phase 2: Bootloader & EFI Signature Audit',
        log: '[boot_chk] Auditing /boot/efi/BOOTX64.EFI & GRUB 2.12 stubs... Signatures validated against TPM 2.0.'
      },
      {
        progress: 75,
        phase: 'Phase 3: Microkernel & Subsystem Binary Diff',
        log: '[sha256_diff] Comparing active binaries against /recovery golden image... 100% match restored.'
      },
      {
        progress: 90,
        phase: 'Phase 4: IPC Endpoint & Capability Re-registration',
        log: '[ring0_ipc] Re-syncing Ring 3 capability table router for all isolated subsystem daemons.'
      },
      {
        progress: 100,
        phase: 'Phase 5: Self-Healing Certification',
        log: '[✓] REPAIR COMPLETE: System and boot chain fully restored. Zero data lost in /home!'
      }
    ];

    phases.forEach((step, index) => {
      setTimeout(() => {
        setAutoRepairProgress(step.progress);
        setAutoRepairPhase(step.phase);
        setAutoRepairLogs(prev => [...prev, step.log]);

        if (index === phases.length - 1) {
          setIsAutoRepairing(false);
          setAutoRepairDone(true);
          addNotification({
            title: 'Automated System Repair Complete',
            message: 'OS filesystems, bootloader, and Ring 0 microkernel have been repaired to golden baseline.',
            type: 'success',
            appId: 'watchdog-recovery'
          });
        }
      }, (index + 1) * 800);
    });
  };

  // ==========================================
  // TAB 4: STEP-BY-STEP TECH GUIDED WIZARD
  // ==========================================
  const [wizardStep, setWizardStep] = useState<number>(1);
  const [selectedScenario, setSelectedScenario] = useState<string>('bootloader');
  const [isScanningIssues, setIsScanningIssues] = useState(false);
  const [scanComplete, setScanComplete] = useState(false);

  // ==========================================
  // TAB 5: SELF-AUDIT BASELINE & CHANGE LOG
  // ==========================================
  const [isAuditArmed, setIsAuditArmed] = useState<boolean>(true);
  const [isBaselineAuditing, setIsBaselineAuditing] = useState<boolean>(false);
  const [baselineFilter, setBaselineFilter] = useState<'ALL' | 'HARDWARE' | 'SOFTWARE' | 'CONFIG' | 'KERNEL'>('ALL');
  const [baselineSearchQuery, setBaselineSearchQuery] = useState<string>('');
  
  // Elevation PIN Modal State
  const [isPinModalOpen, setIsPinModalOpen] = useState(false);
  const [pinModalTitle, setPinModalTitle] = useState('');
  const [pinModalDesc, setPinModalDesc] = useState('');
  const [pendingPinAction, setPendingPinAction] = useState<(() => void) | null>(null);

  const [baselineItems, setBaselineItems] = useState<BaselineConfigItem[]>([
    {
      id: 'bl-hw-1',
      category: 'HARDWARE',
      name: 'CPU Microarchitecture & Mitigations',
      target: 'x86-64-v3 / AVX2 / IBRS+SSBD',
      baselineSignature: 'CPU_FAMILY_0x6_MODEL_0x8F_STEPPING_0x1',
      currentSignature: 'CPU_FAMILY_0x6_MODEL_0x8F_STEPPING_0x1',
      status: 'IN_SPEC',
      lastAudited: 'Just now',
      specDetails: 'Hardware Ring 0 page isolation and Spectre/Meltdown hardware mitigations active.'
    },
    {
      id: 'bl-hw-2',
      category: 'HARDWARE',
      name: 'Physical RAM & ECC Bank Topology',
      target: 'Physical Bank DIMM_0..3 (16GB)',
      baselineSignature: 'MEM_TOPOLOGY_0x00000000_0x400000000_ECC_PASS',
      currentSignature: 'MEM_TOPOLOGY_0x00000000_0x400000000_ECC_PASS',
      status: 'IN_SPEC',
      lastAudited: 'Just now',
      specDetails: 'Dual-channel memory layout mapped into unified Ring 0 virtual page table.'
    },
    {
      id: 'bl-hw-3',
      category: 'HARDWARE',
      name: 'Storage Partition Table & NVMe Signature',
      target: '/dev/nvme0n1 [GPT Sealed Table]',
      baselineSignature: 'GUID_E3B0C442_98FC_1C14_9AFB_F4C8996FB924',
      currentSignature: 'GUID_E3B0C442_98FC_1C14_9AFB_F4C8996FB924',
      status: 'IN_SPEC',
      lastAudited: 'Just now',
      specDetails: 'Root partition (/dev/nvme0n1p2) and Golden Recovery (/dev/nvme0n1p6) match sealed UUIDs.'
    },
    {
      id: 'bl-hw-4',
      category: 'HARDWARE',
      name: 'TPM 2.0 PCR-7 Platform Configuration Digest',
      target: 'TPM 2.0 Security Chip (PCR-7)',
      baselineSignature: 'TPM_PCR7_0x9b71d224bd62f3785d96d46a',
      currentSignature: 'TPM_PCR7_0x9b71d224bd62f3785d96d46a',
      status: 'IN_SPEC',
      lastAudited: 'Just now',
      specDetails: 'Secure boot measurement registers confirm pristine UEFI boot chain integrity.'
    },
    {
      id: 'bl-hw-5',
      category: 'HARDWARE',
      name: 'PCIe Bus Device Topology',
      target: 'PCIe Root Complex & VirtIO Bridges',
      baselineSignature: 'PCIE_DEV_00:00.0_00:01.0_00:02.0_00:03.0',
      currentSignature: 'PCIE_DEV_00:00.0_00:01.0_00:02.0_00:03.0',
      status: 'IN_SPEC',
      lastAudited: 'Just now',
      specDetails: 'VirtIO GPU, VirtIO Net, Intel HDA Audio, and NVMe Controller verified at exact bus slots.'
    },
    {
      id: 'bl-sw-1',
      category: 'KERNEL',
      name: 'Ring 0 Supervisor Microkernel Image',
      target: '/sys/kernel/securecurtain.bin',
      baselineSignature: 'SHA256:8f434346648f6b96df89dda901c5176b10a6d83961dd3c1ac88b59b2dc327aa4',
      currentSignature: 'SHA256:8f434346648f6b96df89dda901c5176b10a6d83961dd3c1ac88b59b2dc327aa4',
      status: 'IN_SPEC',
      lastAudited: 'Just now',
      specDetails: 'Core memory scheduler, IPC router, and hardware interruption vector table.'
    },
    {
      id: 'bl-sw-2',
      category: 'SOFTWARE',
      name: 'Ring 3 Isolated Subsystem Daemons',
      target: '/usr/sbin/ [gpu_srv, net_srv, audio_srv, ipc_srv]',
      baselineSignature: 'SHA256:fcde2b2edba56bf408601fb721fe9b5c338d10ee429ea04fae5511b68fbf8fb9',
      currentSignature: 'SHA256:fcde2b2edba56bf408601fb721fe9b5c338d10ee429ea04fae5511b68fbf8fb9',
      status: 'IN_SPEC',
      lastAudited: 'Just now',
      specDetails: 'All 7 user-space subsystem binaries cryptographically match golden bundle manifest.'
    },
    {
      id: 'bl-cfg-1',
      category: 'CONFIG',
      name: 'Security PAM & Sudoers Configurations',
      target: '/etc/pam.d/ & /etc/sudoers',
      baselineSignature: 'SHA256:4a011733cfb7b190d62c65bf0bcda32b57b277d9ad9f146ee3b0c44298fc1c14',
      currentSignature: 'SHA256:4a011733cfb7b190d62c65bf0bcda32b57b277d9ad9f146ee3b0c44298fc1c14',
      status: 'IN_SPEC',
      lastAudited: 'Just now',
      specDetails: 'Authentication policy requires strict PIN/Password dual credential gating for elevation.'
    },
    {
      id: 'bl-cfg-2',
      category: 'CONFIG',
      name: 'Firewall & Network Security Ruleset',
      target: '/etc/nftables.conf & /etc/hosts.allow',
      baselineSignature: 'SHA256:d14a028c2a3a2bc9476102bb288234c415a2b01f828e3bbac26e84d41235b2e9',
      currentSignature: 'SHA256:d14a028c2a3a2bc9476102bb288234c415a2b01f828e3bbac26e84d41235b2e9',
      status: 'IN_SPEC',
      lastAudited: 'Just now',
      specDetails: 'Default DROP policy on all external ingress interfaces; isolated inter-enclave firewall.'
    },
    {
      id: 'bl-sw-3',
      category: 'SOFTWARE',
      name: 'Installed Software Package Catalog',
      target: 'System Binary Database (/var/lib/rpm_manifest.db)',
      baselineSignature: 'MANIFEST_1280_PACKAGES_SHA256_SEALED',
      currentSignature: 'MANIFEST_1280_PACKAGES_SHA256_SEALED',
      status: 'IN_SPEC',
      lastAudited: 'Just now',
      specDetails: '1,280 verified post-setup packages sealed into read-only package verification catalog.'
    }
  ]);

  const [changeLogs, setChangeLogs] = useState<BaselineChangeEntry[]>([
    {
      id: 'chg-1',
      timestamp: '2026-08-31 13:45:00 UTC',
      actor: 'root (Admin System Administrator)',
      category: 'SECURITY',
      severity: 'SUCCESS',
      action: 'BASELINE_ARMED',
      description: 'System setup administrator armed continuous self-audit watchdog after finalizing software stack.',
      authorized: true,
      pinElevated: true,
      diffSummary: 'Self-audit sentinel armed. Continuous polling enabled across 10 hardware/software baseline manifests.'
    },
    {
      id: 'chg-2',
      timestamp: '2026-08-31 13:42:15 UTC',
      actor: 'root (Admin System Administrator)',
      category: 'SOFTWARE',
      severity: 'INFO',
      action: 'RE_BASELINE_COMMITTED',
      description: 'Golden baseline snapshot sealed post-software installation (1,280 packages registered).',
      authorized: true,
      pinElevated: true,
      diffSummary: 'Committed baseline snapshot SHA256:8f43...e41e into protected TPM 2.0 NVRAM memory register.'
    },
    {
      id: 'chg-3',
      timestamp: '2026-08-31 13:30:22 UTC',
      actor: 'root',
      category: 'CONFIG',
      severity: 'INFO',
      action: 'CONFIG_MODIFIED',
      description: 'Configured /etc/nftables.conf security policies and internal RPC ingress filters.',
      authorized: true,
      pinElevated: true,
      diffSummary: '+ rule table inet filter chain input { type filter hook input priority 0; policy drop; }'
    },
    {
      id: 'chg-4',
      timestamp: '2026-08-31 13:15:00 UTC',
      actor: 'installer',
      category: 'HARDWARE',
      severity: 'INFO',
      action: 'HARDWARE_INITIALIZED',
      description: 'Initial bare-metal hardware baseline established during operating system commission.',
      authorized: true,
      pinElevated: false,
      diffSummary: 'CPU: x86-64-v3, RAM: 16GB ECC, NVMe: 512GB GPT, TPM: 2.0 PCR-7 sealed.'
    }
  ]);

  const requestPinElevation = (title: string, desc: string, action: () => void) => {
    setPinModalTitle(title);
    setPinModalDesc(desc);
    setPendingPinAction(() => action);
    setIsPinModalOpen(true);
  };

  const handleToggleAuditArm = () => {
    const nextState = !isAuditArmed;
    const title = nextState 
      ? 'Arm Baseline Self-Audit Sentinel' 
      : 'Disarm Baseline Self-Audit (Enter Setup Commissioning Mode)';
    const desc = nextState
      ? 'Arming will enforce continuous integrity checking and log all hardware/software deviations. Enter your Root Admin PIN.'
      : 'Disarming pauses baseline drift alerts so the administrator can install software or update configurations. Enter your Root Admin PIN.';

    requestPinElevation(title, desc, () => {
      setIsAuditArmed(nextState);
      const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 19) + ' UTC';
      const newEntry: BaselineChangeEntry = {
        id: `chg-${Date.now()}`,
        timestamp,
        actor: 'root (Admin PIN Verified)',
        category: 'SECURITY',
        severity: nextState ? 'SUCCESS' : 'WARNING',
        action: nextState ? 'BASELINE_ARMED' : 'BASELINE_DISARMED',
        description: nextState
          ? 'System setup administrator armed continuous self-audit watchdog after finalizing software stack.'
          : 'Administrator disarmed self-audit sentinel into Setup Commissioning Mode to allow software changes.',
        authorized: true,
        pinElevated: true,
        diffSummary: nextState
          ? 'Continuous baseline drift and file integrity watchdog ENFORCED.'
          : 'Continuous baseline drift alerts PAUSED for maintenance.'
      };
      setChangeLogs(prev => [newEntry, ...prev]);

      addNotification({
        title: nextState ? 'Baseline Self-Audit Armed' : 'Baseline Self-Audit Disarmed',
        message: nextState 
          ? 'Continuous hardware & software configuration integrity is actively enforced.'
          : 'System entered Setup Commissioning Mode. Baseline drift checking paused.',
        type: nextState ? 'success' : 'info',
        appId: 'watchdog-recovery'
      });
    });
  };

  const handleRebaselineSnapshot = () => {
    requestPinElevation(
      'Capture & Seal New Golden Baseline Snapshot',
      'This will capture all current hardware registers, system binaries, daemons, and configs as the new authoritative Golden Baseline. Enter your Root Admin PIN.',
      () => {
        setIsBaselineAuditing(true);
        setTimeout(() => {
          setIsBaselineAuditing(false);
          setIsAuditArmed(true);
          const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 19) + ' UTC';
          
          setBaselineItems(prev => prev.map(item => ({
            ...item,
            status: 'IN_SPEC',
            lastAudited: 'Just now'
          })));

          const newEntry: BaselineChangeEntry = {
            id: `chg-${Date.now()}`,
            timestamp,
            actor: 'root (Admin PIN Verified)',
            category: 'SOFTWARE',
            severity: 'SUCCESS',
            action: 'RE_BASELINE_COMMITTED',
            description: 'New Golden Baseline snapshot captured and cryptographically sealed into TPM 2.0 NVRAM.',
            authorized: true,
            pinElevated: true,
            diffSummary: 'Sealed 10 baseline manifests (Hardware, Microkernel, Daemons, Configs, Package Manifests).'
          };
          setChangeLogs(prev => [newEntry, ...prev]);

          addNotification({
            title: 'Golden Baseline Snapshot Sealed',
            message: 'All current hardware and software configurations are locked in as the new baseline standard.',
            type: 'success',
            appId: 'watchdog-recovery'
          });
        }, 1200);
      }
    );
  };

  const handleRunLiveBaselineAudit = () => {
    setIsBaselineAuditing(true);
    setTimeout(() => {
      setIsBaselineAuditing(false);
      setBaselineItems(prev => prev.map(item => ({
        ...item,
        lastAudited: 'Just now'
      })));
      addNotification({
        title: 'Baseline Self-Audit Complete',
        message: '10 of 10 hardware and software baseline artifacts are 100% in-spec and cryptographically verified.',
        type: 'success',
        appId: 'watchdog-recovery'
      });
    }, 1000);
  };

  const handleExportBaselineLedger = () => {
    const report = `================================================================================
SECURECURTAIN OS - BASELINE INTEGRITY & CHANGE AUDIT LEDGER
Author: System Administrator | Generated: ${new Date().toISOString()}
================================================================================
SELF-AUDIT STATE: ${isAuditArmed ? 'ARMED (CONTINUOUS DRIFT MONITORING ACTIVE)' : 'DISARMED (SETUP COMMISSIONING MODE)'}
ENFORCEMENT ENGINE: Ring 0 Watchdog & Kernel Integrity Sentinel
CRYPTOGRAPHIC SEAL: TPM 2.0 PCR-7 REGISTER MATCH

CURRENT BASELINE CONFIGURATION MANIFEST:
${baselineItems.map((item, idx) => `${idx + 1}. [${item.category}] ${item.name} (${item.target})
   - Status: ${item.status}
   - Baseline Signature: ${item.baselineSignature}
   - Current Signature:  ${item.currentSignature}
   - Details: ${item.specDetails}`).join('\n\n')}

================================================================================
CHRONOLOGICAL CHANGE & AUDIT LEDGER:
${changeLogs.map((log, idx) => `[${log.timestamp}] [${log.severity}] ${log.action}
 - Actor: ${log.actor} (Authorized: ${log.authorized}, Sudo/PIN: ${log.pinElevated})
 - Category: ${log.category}
 - Description: ${log.description}
 - Details: ${log.diffSummary || 'N/A'}`).join('\n\n')}
================================================================================`;

    const blob = new Blob([report], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `SecureCurtain_Baseline_Change_Audit_${Date.now()}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const [diagnosticIssues, setDiagnosticIssues] = useState<DiagnosticIssue[]>([
    {
      id: 'iss-1',
      component: 'EFI Bootloader & GRUB 2.12 Config',
      category: 'BOOT_CHAIN',
      severity: 'CRITICAL',
      description: 'GRUB EFI stub header checksum mismatch detected at sector 0x2000.',
      corruptedPath: '/boot/efi/BOOTX64.EFI',
      goldenSourcePath: '/recovery/BOOTX64.EFI',
      suggestedFix: 'Re-flash clean signed BOOTX64.EFI from Read-Only Golden Partition and re-arm GRUB Multiboot2 entry.',
      fixed: false
    },
    {
      id: 'iss-2',
      component: 'VirtIO GPU Compositor Binary',
      category: 'SUBSYSTEM_DRV',
      severity: 'WARNING',
      description: 'Subsystem memory binary hash drift detected due to unexpected power-cut during live compile.',
      corruptedPath: '/sys/subsystems/virtio_gpu_compositor',
      goldenSourcePath: '/recovery/subsystems_bundle.img:/virtio_gpu_compositor',
      suggestedFix: 'Hot-swap pristine compositor executable from Golden Image into Ring 3 sandbox without reboot.',
      fixed: false
    },
    {
      id: 'iss-3',
      component: 'Root Superblock Metadata Backup',
      category: 'FILESYSTEM',
      severity: 'WARNING',
      description: 'Secondary superblock backup at block group 32 corrupted; primary block group 0 active.',
      corruptedPath: '/dev/nvme0n1p2 [Block 32768]',
      goldenSourcePath: '/recovery/superblock_backup.meta',
      suggestedFix: 'Synchronize backup superblock blocks from immutable /recovery mirror table.',
      fixed: false
    },
    {
      id: 'iss-4',
      component: 'Ring 0 Supervisor Kernel Image',
      category: 'KERNEL_BIN',
      severity: 'HEALTHY',
      description: 'Kernel binary hash matches cryptographic master signature (Passed TPM 2.0).',
      corruptedPath: '/sys/kernel/securecurtain.bin',
      goldenSourcePath: '/recovery/securecurtain_ring0.bin',
      suggestedFix: 'No action required. Core supervisor is in optimal state.',
      fixed: true
    }
  ]);

  const [wizardRepairing, setWizardRepairing] = useState(false);
  const [wizardRepairLog, setWizardRepairLog] = useState<string[]>([]);
  const [wizardSuccess, setWizardSuccess] = useState(false);

  const handleStartScan = () => {
    setIsScanningIssues(true);
    setScanComplete(false);

    setTimeout(() => {
      setIsScanningIssues(false);
      setScanComplete(true);
      setWizardStep(2);
      addNotification({
        title: 'Diagnostic Scan Complete',
        message: 'Identified 2 repairable integrity anomalies against /recovery golden image.',
        type: 'info',
        appId: 'watchdog-recovery'
      });
    }, 1200);
  };

  const handleExecuteWizardRepair = () => {
    setWizardRepairing(true);
    setWizardRepairLog([
      '[*] Initializing Technician Repair Sequence...',
      '[*] Verifying cryptographic authorization key from TPM 2.0...',
      '[*] Target Golden Source: /dev/nvme0n1p6 (/recovery) [READ-ONLY ENFORCED]'
    ]);

    setTimeout(() => {
      setWizardRepairLog(prev => [
        ...prev,
        '[STEP 1/3] Restoring signed BOOTX64.EFI to /boot/efi/ ... Done (0.8ms).',
        '[STEP 2/3] Hot-swapping virtio_gpu_compositor Ring 3 binary ... Done (1.2ms).',
        '[STEP 3/3] Synchronizing secondary superblock at block 32768 ... Done (0.4ms).'
      ]);
    }, 1000);

    setTimeout(() => {
      setWizardRepairLog(prev => [
        ...prev,
        '[✓] All selected components repaired and re-verified against Golden Partition SHA-256 signatures.',
        '[✓] Final Boot Chain Diagnostic Score: 100% HEALTHY'
      ]);
      setDiagnosticIssues(prev => prev.map(iss => ({ ...iss, fixed: true, severity: 'HEALTHY' })));
      setWizardRepairing(false);
      setWizardSuccess(true);
      setWizardStep(4);
      addNotification({
        title: 'Tech Repair Sequence Completed',
        message: 'All system and boot discrepancies have been restored from the Golden Partition.',
        type: 'success',
        appId: 'watchdog-recovery'
      });
    }, 2200);
  };

  const handleExportReport = () => {
    const report = `================================================================================
SECURECURTAIN OS - SYSTEM & BOOT REPAIR DIAGNOSTIC CERTIFICATE
Author: System Administrator | Generated: ${new Date().toISOString()}
================================================================================
GOLDEN RECOVERY PARTITION: /dev/nvme0n1p6 (Mounted at /recovery - READ ONLY)
HARDWARE WRITE-PROTECT STATUS: LOCKED (ro,nosuid,nodev)
CRYPTOGRAPHIC SEAL: TPM 2.0 PCR-7 MATCH

REPAIRED COMPONENTS:
1. /boot/efi/BOOTX64.EFI [BOOT_CHAIN] -> Restored from /recovery/BOOTX64.EFI
2. /sys/subsystems/virtio_gpu_compositor [SUBSYSTEM_DRV] -> Restored from Golden Bundle
3. /dev/nvme0n1p2 Superblock 32768 [FILESYSTEM] -> Re-synced from /recovery/superblock_backup.meta

POST-REPAIR STATUS:
- Watchdog Supervisor: Active (1000Hz Heartbeat)
- Filesystem Integrity: 100% Passed
- Bootloader Multiboot2 Compliance: 100% Passed
- User Data Isolation (/home): Preserved 100% Intact
================================================================================`;

    const blob = new Blob([report], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `SecureCurtain_Repair_Report_${Date.now()}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="h-full flex flex-col bg-[#07090e] text-white select-text overflow-y-auto">
      {/* Top Banner & Tab Navigation */}
      <div className="p-4 border-b border-[#1b2234] bg-[#0c101c] flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-gradient-to-br from-pink-500/20 to-purple-500/20 border border-pink-500/40 text-pink-400 shadow-lg">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-white tracking-wide">
                System Repair, Boot Recovery & Watchdog Control
              </h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-pink-950/80 text-pink-300 border border-pink-500/50 font-semibold flex items-center gap-1">
                <Lock className="w-3 h-3 text-pink-400" />
                Protected Golden Partition
              </span>
            </div>
            <p className="text-xs text-[#7d90a8] mt-0.5">
              Instant microkernel crash isolation, immutable read-only OS recovery, and technician repair wizards.
            </p>
          </div>
        </div>

        {/* Vital Quick Stats & Quick Tab Jumpers */}
        <div className="flex flex-wrap items-center gap-3 text-xs font-mono">
          <button
            onClick={() => setActiveTab('self-audit')}
            className={`px-3 py-1.5 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center justify-center ${
              activeTab === 'self-audit'
                ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300 ring-2 ring-emerald-500/40'
                : 'bg-[#121826] hover:bg-[#1a2336] border-[#212c44] text-[#8a9cb5] hover:text-white'
            }`}
            title="Click to view Self-Audit Baseline & Change Ledger"
          >
            <div className="text-[9px] text-[#6b7c96] uppercase font-bold flex items-center gap-1">
              <Fingerprint className="w-3 h-3 text-emerald-400" />
              Self-Audit Status
            </div>
            <div className={`font-bold flex items-center gap-1 text-xs mt-0.5 ${isAuditArmed ? 'text-emerald-400' : 'text-amber-400'}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${isAuditArmed ? 'bg-emerald-400 animate-ping' : 'bg-amber-400'}`} />
              {isAuditArmed ? 'ARMED' : 'DISARMED'}
            </div>
          </button>

          <div className="px-3 py-1.5 rounded-xl bg-[#121826] border border-[#212c44] text-center">
            <div className="text-[10px] text-[#6b7c96]">Recovery Partition</div>
            <div className="text-pink-400 font-bold flex items-center gap-1 justify-center">
              <Lock className="w-3 h-3" /> /dev/nvme0n1p6 (RO)
            </div>
          </div>
          <div className="px-3 py-1.5 rounded-xl bg-[#121826] border border-[#212c44] text-center">
            <div className="text-[10px] text-[#6b7c96]">Mean Self-Healing</div>
            <div className="text-sky-400 font-bold">{mttrMs} ms</div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs Header - Responsive Wrap (No Horizontal Scroll Slider Hiding) */}
      <div className="flex flex-wrap items-center gap-2 p-3 px-4 border-b border-[#1b2234] bg-[#090d17] text-xs">
        <button
          onClick={() => setActiveTab('watchdog')}
          className={`py-2 px-3.5 rounded-xl font-bold flex items-center gap-2 transition-all cursor-pointer ${
            activeTab === 'watchdog'
              ? 'bg-pink-600 text-white shadow-lg shadow-pink-950/50 ring-2 ring-pink-400'
              : 'text-[#8a9cb5] hover:text-white bg-[#0f1422] hover:bg-[#182136] border border-[#1b2234]'
          }`}
        >
          <HeartPulse className="w-4 h-4 text-pink-300" />
          <span>1. Live Ring 0 Watchdog</span>
        </button>

        <button
          onClick={() => setActiveTab('golden-partition')}
          className={`py-2 px-3.5 rounded-xl font-bold flex items-center gap-2 transition-all cursor-pointer ${
            activeTab === 'golden-partition'
              ? 'bg-pink-600 text-white shadow-lg shadow-pink-950/50 ring-2 ring-pink-400'
              : 'text-[#8a9cb5] hover:text-white bg-[#0f1422] hover:bg-[#182136] border border-[#1b2234]'
          }`}
        >
          <Lock className="w-4 h-4 text-pink-400" />
          <span>2. Read-Only Partition (/recovery)</span>
        </button>

        <button
          onClick={() => setActiveTab('auto-repair')}
          className={`py-2 px-3.5 rounded-xl font-bold flex items-center gap-2 transition-all cursor-pointer ${
            activeTab === 'auto-repair'
              ? 'bg-pink-600 text-white shadow-lg shadow-pink-950/50 ring-2 ring-pink-400'
              : 'text-[#8a9cb5] hover:text-white bg-[#0f1422] hover:bg-[#182136] border border-[#1b2234]'
          }`}
        >
          <Zap className="w-4 h-4 text-amber-400" />
          <span>3. Automated 1-Click Repair</span>
        </button>

        <button
          onClick={() => setActiveTab('tech-wizard')}
          className={`py-2 px-3.5 rounded-xl font-bold flex items-center gap-2 transition-all cursor-pointer ${
            activeTab === 'tech-wizard'
              ? 'bg-pink-600 text-white shadow-lg shadow-pink-950/50 ring-2 ring-pink-400'
              : 'text-[#8a9cb5] hover:text-white bg-[#0f1422] hover:bg-[#182136] border border-[#1b2234]'
          }`}
        >
          <Wrench className="w-4 h-4 text-purple-400" />
          <span>4. Tech Recovery Wizard</span>
        </button>

        <button
          onClick={() => setActiveTab('self-audit')}
          className={`py-2 px-3.5 rounded-xl font-bold flex items-center gap-2 transition-all cursor-pointer ${
            activeTab === 'self-audit'
              ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-950/60 ring-2 ring-emerald-400'
              : 'text-emerald-300 hover:text-white bg-[#081a16] hover:bg-[#0f2e27] border-2 border-emerald-500/60 shadow-md shadow-emerald-950/30'
          }`}
        >
          <Fingerprint className="w-4 h-4 text-emerald-400" />
          <span>5. Self-Audit Baseline & Change Log</span>
          <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold flex items-center gap-1.5 ${
            isAuditArmed 
              ? 'bg-emerald-950 text-emerald-300 border border-emerald-400/80 shadow-sm' 
              : 'bg-amber-950 text-amber-300 border border-amber-400/80 shadow-sm'
          }`}>
            <span className={`w-2 h-2 rounded-full ${isAuditArmed ? 'bg-emerald-400 animate-ping' : 'bg-amber-400'}`} />
            {isAuditArmed ? 'ARMED' : 'DISARMED'}
          </span>
        </button>
      </div>

      {/* Main Tab Content */}
      <div className="p-4 flex-1">
        {/* ========================================================= */}
        {/* TAB 1: WATCHDOG & SELF-HEALING DAEMONS                    */}
        {/* ========================================================= */}
        {activeTab === 'watchdog' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            {/* Left 8 Cols: Subsystem Server Matrix */}
            <div className="lg:col-span-8 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold font-mono text-[#cbd5e1] uppercase flex items-center gap-1.5">
                  <Server className="w-4 h-4 text-sky-400" />
                  <span>Active Ring 3 Subsystem Daemons</span>
                </span>
                <span className="text-[11px] font-mono text-emerald-400 flex items-center gap-1">
                  <Radio className="w-3.5 h-3.5 animate-spin" />
                  <span>1000Hz Supervisor Heartbeat</span>
                </span>
              </div>

              <div className="space-y-2">
                {daemons.map((daemon) => (
                  <div 
                    key={daemon.id}
                    className={`p-3 rounded-2xl border transition-all ${
                      daemon.status === 'healthy' 
                        ? 'bg-[#0d121f] border-[#1e273e]' 
                        : 'bg-[#220d14] border-red-500/50 shadow-lg shadow-red-950/40 animate-pulse'
                    }`}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      {/* Left info */}
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-xl ${daemon.status === 'healthy' ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-600/30' : 'bg-red-950 text-red-400 border border-red-500'}`}>
                          {daemon.status === 'healthy' ? <CheckCircle2 className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
                        </div>

                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold font-mono text-white">{daemon.name}</span>
                            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#182138] text-purple-300 border border-[#2a3656]">
                              PID {daemon.pid}
                            </span>
                            <span className="text-[10px] font-mono text-[#6c7d99]">
                              {daemon.ring}
                            </span>
                          </div>
                          <div className="text-[11px] font-mono text-[#8a9cb5] flex items-center gap-3 mt-0.5">
                            <span>Ping: <strong className="text-emerald-400">{daemon.heartbeatMs}ms</strong></span>
                            <span>Restarts: <strong className="text-sky-300">{daemon.restartCount}</strong></span>
                            <span>Uptime: <strong className="text-[#cbd5e1]">{daemon.uptimeSec}s</strong></span>
                          </div>
                        </div>
                      </div>

                      {/* Fault Injection Simulator Trigger */}
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => handleInjectFault(daemon.id, 'segfault')}
                          disabled={daemon.status === 'recovering'}
                          className="px-2.5 py-1.5 rounded-xl bg-red-950/40 hover:bg-red-900/70 border border-red-600/40 text-red-300 text-[10px] font-mono font-bold flex items-center gap-1 transition-all disabled:opacity-40"
                          title="Simulate Null-Pointer Crash (SIGSEGV)"
                        >
                          <Flame className="w-3 h-3 text-red-400" />
                          <span>Crash (Segfault)</span>
                        </button>

                        <button
                          onClick={() => handleInjectFault(daemon.id, 'timeout')}
                          disabled={daemon.status === 'recovering'}
                          className="px-2.5 py-1.5 rounded-xl bg-amber-950/40 hover:bg-amber-900/70 border border-amber-600/40 text-amber-300 text-[10px] font-mono font-bold flex items-center gap-1 transition-all disabled:opacity-40"
                          title="Simulate Deadlock / Watchdog Timeout"
                        >
                          <Clock className="w-3 h-3 text-amber-400" />
                          <span>Timeout</span>
                        </button>
                      </div>
                    </div>

                    {daemon.lastFault && (
                      <div className="mt-2 text-[10px] font-mono text-red-300 bg-black/40 px-2.5 py-1 rounded-lg border border-red-900/30">
                        Latest Incident: {daemon.lastFault}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Right 4 Cols: Live Supervisor Recovery Log */}
            <div className="lg:col-span-4 flex flex-col space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold font-mono text-[#cbd5e1] uppercase flex items-center gap-1.5">
                  <Activity className="w-4 h-4 text-purple-400" />
                  <span>Watchdog Event Audit Log</span>
                </span>
                <button
                  onClick={() => setLogs(['[WATCHDOG] Audit log cleared. Supervisor monitoring active.'])}
                  className="text-[10px] font-mono text-[#7888a0] hover:text-white"
                >
                  Clear
                </button>
              </div>

              <div className="flex-1 bg-[#05060b] p-3 rounded-2xl border border-[#1b2234] font-mono text-[10px] text-[#93a4bc] space-y-1.5 overflow-y-auto max-h-[520px]">
                {logs.map((log, idx) => (
                  <div 
                    key={idx}
                    className={
                      log.includes('RECOVERY COMPLETE') 
                        ? 'text-emerald-400 font-bold bg-emerald-950/30 p-1.5 rounded-lg border border-emerald-800/40' 
                        : log.includes('FAULT DETECTED') 
                        ? 'text-red-400 font-bold bg-red-950/30 p-1.5 rounded-lg border border-red-800/40'
                        : 'text-[#8292a8]'
                    }
                  >
                    {log}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 2: PROTECTED READ-ONLY PARTITION (/recovery)          */}
        {/* ========================================================= */}
        {activeTab === 'golden-partition' && (
          <div className="space-y-4">
            {/* Top Partition Specs Card */}
            <div className="p-5 rounded-3xl bg-gradient-to-r from-[#121727] via-[#101320] to-[#171024] border border-pink-500/30 space-y-4 shadow-xl">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-2xl bg-pink-500/20 border border-pink-500/40 text-pink-400">
                    <Lock className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      Immutable OS Golden Image Partition
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-pink-950 text-pink-300 border border-pink-500/40 font-semibold">
                        Hardware Write-Protected
                      </span>
                    </h3>
                    <p className="text-xs text-[#94a3b8] mt-0.5">
                      Mounted at <strong className="text-white font-mono">/recovery</strong> on <strong className="text-white font-mono">/dev/nvme0n1p6</strong> (Flags: <span className="text-emerald-400 font-mono">ro,nosuid,nodev</span>). Stores pristine cryptographic copies of the kernel, bootloader, drivers, and filesystem superblocks.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleVerifyGoldenImage}
                    disabled={isVerifyingGolden}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 shadow-lg flex items-center gap-2 transition-all disabled:opacity-50"
                  >
                    <FileCheck className="w-4 h-4" />
                    {isVerifyingGolden ? 'Verifying Hashes...' : 'Verify Cryptographic Integrity'}
                  </button>
                </div>
              </div>

              {/* Partition Metric Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 text-xs font-mono">
                <div className="p-3 rounded-2xl bg-black/40 border border-white/5">
                  <div className="text-[#94a3b8] text-[10px]">Partition Size</div>
                  <div className="text-white font-bold text-sm">32.0 GB (14.2 GB Used)</div>
                </div>
                <div className="p-3 rounded-2xl bg-black/40 border border-white/5">
                  <div className="text-[#94a3b8] text-[10px]">Filesystem Format</div>
                  <div className="text-sky-300 font-bold text-sm">Btrfs (CoW Snapshots)</div>
                </div>
                <div className="p-3 rounded-2xl bg-black/40 border border-white/5">
                  <div className="text-[#94a3b8] text-[10px]">Write-Protect State</div>
                  <div className="text-emerald-400 font-bold text-sm flex items-center gap-1">
                    <Lock className="w-3.5 h-3.5" /> HARDWARE LOCKED
                  </div>
                </div>
                <div className="p-3 rounded-2xl bg-black/40 border border-white/5">
                  <div className="text-[#94a3b8] text-[10px]">TPM 2.0 PCR-7 Status</div>
                  <div className="text-purple-300 font-bold text-sm">SEALED & SIGNED</div>
                </div>
              </div>

              {goldenAuditResult && (
                <div className="p-3 rounded-2xl bg-emerald-950/40 border border-emerald-500/50 text-emerald-300 font-mono text-xs flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>{goldenAuditResult}</span>
                </div>
              )}
            </div>

            {/* List of Immutable Master Files */}
            <div className="p-5 rounded-3xl bg-[#0b0e18] border border-[#1b2234] space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold font-mono text-[#cbd5e1] uppercase flex items-center gap-2">
                  <FolderArchive className="w-4 h-4 text-pink-400" />
                  Protected Master Golden Image Manifest
                </span>
                <span className="text-xs text-[#8a9cb5] font-mono">
                  6 Master Image Components Synchronized
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left font-mono text-xs">
                  <thead>
                    <tr className="border-b border-[#1f283e] text-[#6e809c] text-[11px]">
                      <th className="py-2.5 px-3">Path & Artifact</th>
                      <th className="py-2.5 px-3">Component Type</th>
                      <th className="py-2.5 px-3">Size</th>
                      <th className="py-2.5 px-3">SHA-256 Checksum Signature</th>
                      <th className="py-2.5 px-3 text-right">Lock Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#171f30]">
                    {goldenFiles.map((file, idx) => (
                      <tr key={idx} className="hover:bg-white/5 transition-colors">
                        <td className="py-3 px-3 font-bold text-white flex items-center gap-2">
                          <Lock className="w-3.5 h-3.5 text-pink-400 shrink-0" />
                          <span>{file.path}</span>
                        </td>
                        <td className="py-3 px-3">
                          <span className="px-2 py-0.5 rounded text-[10px] bg-[#182236] text-sky-300 border border-[#2b3956]">
                            {file.type}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-[#cbd5e1]">{file.sizeFormatted}</td>
                        <td className="py-3 px-3 text-[#94a3b8] text-[10px] truncate max-w-xs" title={file.sha256Hash}>
                          {file.sha256Hash.substring(0, 24)}...
                        </td>
                        <td className="py-3 px-3 text-right">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-950/80 text-emerald-300 border border-emerald-600/40">
                            IMMUTABLE
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 3: AUTOMATED 1-CLICK SYSTEM REPAIR                    */}
        {/* ========================================================= */}
        {activeTab === 'auto-repair' && (
          <div className="space-y-4">
            {/* Action Card */}
            <div className="p-6 rounded-3xl bg-gradient-to-br from-[#131024] via-[#101422] to-[#0d121c] border border-amber-500/30 space-y-4 shadow-xl">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="p-3.5 rounded-2xl bg-amber-500/20 border border-amber-500/40 text-amber-400">
                    <Zap className="w-7 h-7" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white flex items-center gap-2">
                      Automated 1-Click System & Boot Repair
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-950 text-amber-300 border border-amber-500/40 font-semibold">
                        Zero-Touch
                      </span>
                    </h3>
                    <p className="text-xs text-[#94a3b8] mt-1 max-w-2xl">
                      Performs an instant 5-stage automated healing process: scans filesystem superblocks, verifies GRUB 2.12 EFI bootloaders, diffs kernel/subsystem binaries against the <strong>Protected /recovery Golden Partition</strong>, and hot-patches discrepancies without affecting your personal files in <code>/home</code>.
                    </p>
                  </div>
                </div>

                <button
                  onClick={handleRunAutoRepair}
                  disabled={isAutoRepairing}
                  className="px-5 py-3 rounded-2xl text-xs font-bold text-white bg-gradient-to-r from-amber-500 via-orange-500 to-pink-600 hover:from-amber-400 hover:to-pink-500 shadow-xl flex items-center gap-2 transition-all disabled:opacity-50"
                >
                  <Play className="w-4 h-4 fill-current" />
                  {isAutoRepairing ? 'Repairing System...' : 'Start 1-Click Automated Repair'}
                </button>
              </div>

              {/* Live Repair Progress Bar */}
              {(isAutoRepairing || autoRepairDone) && (
                <div className="space-y-2 pt-2 animate-in fade-in duration-300">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="text-amber-300 font-bold">{autoRepairPhase}</span>
                    <span className="text-white font-bold">{autoRepairProgress}%</span>
                  </div>
                  <div className="w-full h-3 rounded-full bg-black/50 border border-white/10 overflow-hidden p-0.5">
                    <div 
                      style={{ width: `${autoRepairProgress}%` }}
                      className="h-full rounded-full bg-gradient-to-r from-amber-500 via-orange-500 to-pink-500 transition-all duration-500 shadow-lg shadow-amber-500/50"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Repair Console Logs */}
            <div className="p-5 rounded-3xl bg-[#080a10] border border-[#1b2234] space-y-2 font-mono text-xs">
              <div className="flex items-center justify-between border-b border-white/10 pb-2">
                <span className="text-xs font-bold text-[#cbd5e1] uppercase flex items-center gap-2">
                  <Terminal className="w-4 h-4 text-amber-400" />
                  Automated Repair Diagnostic Console
                </span>
                <span className="text-[11px] text-[#6b7c96]">
                  Golden Partition Engine v2.12
                </span>
              </div>

              <div className="p-3 bg-black/60 rounded-2xl border border-white/5 space-y-1.5 max-h-64 overflow-y-auto text-[11px]">
                {autoRepairLogs.length === 0 ? (
                  <div className="text-[#64748b] italic">
                    Click 'Start 1-Click Automated Repair' above to run the automated diagnostic and recovery pipeline.
                  </div>
                ) : (
                  autoRepairLogs.map((log, idx) => (
                    <div 
                      key={idx} 
                      className={log.includes('REPAIR COMPLETE') ? 'text-emerald-400 font-bold bg-emerald-950/40 p-2 rounded-xl border border-emerald-500/30' : 'text-[#a0b0c6]'}
                    >
                      {log}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 4: STEP-BY-STEP TECH GUIDED WIZARD                    */}
        {/* ========================================================= */}
        {activeTab === 'tech-wizard' && (
          <div className="space-y-4">
            {/* Step Stepper Header */}
            <div className="grid grid-cols-4 gap-2 p-3 rounded-2xl bg-[#0e121e] border border-[#1e263c] text-xs font-medium">
              <div className={`p-2 rounded-xl text-center flex items-center justify-center gap-2 ${wizardStep >= 1 ? 'bg-purple-500/20 text-purple-300 font-bold border border-purple-500/40' : 'text-[#64748b]'}`}>
                <span>1. Select Scenario</span>
              </div>
              <div className={`p-2 rounded-xl text-center flex items-center justify-center gap-2 ${wizardStep >= 2 ? 'bg-purple-500/20 text-purple-300 font-bold border border-purple-500/40' : 'text-[#64748b]'}`}>
                <span>2. Diagnostic Audit</span>
              </div>
              <div className={`p-2 rounded-xl text-center flex items-center justify-center gap-2 ${wizardStep >= 3 ? 'bg-purple-500/20 text-purple-300 font-bold border border-purple-500/40' : 'text-[#64748b]'}`}>
                <span>3. Review & Restore</span>
              </div>
              <div className={`p-2 rounded-xl text-center flex items-center justify-center gap-2 ${wizardStep >= 4 ? 'bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/40' : 'text-[#64748b]'}`}>
                <span>4. Certificate</span>
              </div>
            </div>

            {/* STEP 1: Select Repair Scenario */}
            {wizardStep === 1 && (
              <div className="p-6 rounded-3xl bg-[#0c101c] border border-[#1e273e] space-y-5 animate-in fade-in duration-200">
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <Wrench className="w-5 h-5 text-purple-400" />
                    Step 1: Choose Repair Target & Diagnostic Scope
                  </h3>
                  <p className="text-xs text-[#8a9cb5] mt-1">
                    Select the specific failure mode or component you wish to diagnose against the Read-Only Golden Partition.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[
                    {
                      id: 'bootloader',
                      title: 'Bootloader & EFI Chain Repair',
                      desc: 'Fix corrupted GRUB 2.12 headers, reconstruct BOOTX64.EFI stubs, and restore Multiboot2 entry parameters.',
                      icon: Cpu
                    },
                    {
                      id: 'filesystem',
                      title: 'Filesystem Superblock & Inode Audit',
                      desc: 'Run deep ext4/btrfs metadata integrity scan, rebuild corrupted backup superblocks from /recovery partition.',
                      icon: HardDrive
                    },
                    {
                      id: 'subsystems',
                      title: 'Ring 3 Subsystems & Drivers Hot-Patch',
                      desc: 'Compare virtio drivers, GPU compositor, POSIX and Win32 binaries against golden cryptographic hashes.',
                      icon: Layers
                    },
                    {
                      id: 'factory_clean',
                      title: 'Full Clean OS Re-Image (Preserve /home)',
                      desc: 'Completely re-flash Ring 0 microkernel and core subsystems from golden snapshot while leaving user files intact.',
                      icon: Sparkles
                    }
                  ].map((scen) => {
                    const Icon = scen.icon;
                    return (
                      <div
                        key={scen.id}
                        onClick={() => setSelectedScenario(scen.id)}
                        className={`p-4 rounded-2xl border cursor-pointer transition-all flex flex-col justify-between ${
                          selectedScenario === scen.id
                            ? 'bg-purple-950/40 border-purple-500 shadow-lg shadow-purple-950/50 scale-[1.02]'
                            : 'bg-white/5 border-white/10 hover:bg-white/10'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div className={`p-2.5 rounded-xl ${selectedScenario === scen.id ? 'bg-purple-500 text-white' : 'bg-white/10 text-white/70'}`}>
                            <Icon className="w-5 h-5" />
                          </div>
                          <div>
                            <div className="text-sm font-bold text-white">{scen.title}</div>
                            <div className="text-xs text-[#8a9cb5] mt-1 leading-relaxed">{scen.desc}</div>
                          </div>
                        </div>

                        <div className="mt-3 flex items-center justify-end">
                          <span className={`text-[11px] font-bold ${selectedScenario === scen.id ? 'text-purple-300' : 'text-white/40'}`}>
                            {selectedScenario === scen.id ? '✓ Selected' : 'Select'}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    onClick={handleStartScan}
                    disabled={isScanningIssues}
                    className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-purple-600 hover:bg-purple-500 shadow-lg flex items-center gap-2 transition-all disabled:opacity-50"
                  >
                    <span>{isScanningIssues ? 'Running Deep Scan...' : 'Next: Scan Target Components'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 2: Diagnostic Audit Results */}
            {wizardStep === 2 && (
              <div className="p-6 rounded-3xl bg-[#0c101c] border border-[#1e273e] space-y-5 animate-in fade-in duration-200">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-base font-bold text-white flex items-center gap-2">
                      <ShieldAlert className="w-5 h-5 text-amber-400" />
                      Step 2: Diagnostic Inspection Findings
                    </h3>
                    <p className="text-xs text-[#8a9cb5] mt-1">
                      Target components audited against the <strong>Read-Only Golden Image Partition</strong>. Review anomalies before applying repairs.
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  {diagnosticIssues.map((iss) => (
                    <div 
                      key={iss.id}
                      className={`p-4 rounded-2xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${
                        iss.severity === 'CRITICAL' 
                          ? 'bg-red-950/30 border-red-500/40' 
                          : iss.severity === 'WARNING'
                          ? 'bg-amber-950/30 border-amber-500/40'
                          : 'bg-emerald-950/20 border-emerald-500/30'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`p-2 rounded-xl shrink-0 mt-0.5 ${
                          iss.severity === 'CRITICAL' ? 'bg-red-500 text-white' :
                          iss.severity === 'WARNING' ? 'bg-amber-500 text-black' :
                          'bg-emerald-500 text-white'
                        }`}>
                          {iss.severity === 'HEALTHY' ? <Check className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-white">{iss.component}</span>
                            <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${
                              iss.severity === 'CRITICAL' ? 'bg-red-950 text-red-300 border border-red-500/40' :
                              iss.severity === 'WARNING' ? 'bg-amber-950 text-amber-300 border border-amber-500/40' :
                              'bg-emerald-950 text-emerald-300 border border-emerald-500/40'
                            }`}>
                              {iss.severity}
                            </span>
                          </div>
                          <p className="text-xs text-[#94a3b8] mt-1">{iss.description}</p>
                          <div className="text-[11px] font-mono text-[#cbd5e1] mt-1.5 space-x-2">
                            <span>Target: <code className="text-amber-300">{iss.corruptedPath}</code></span>
                            <span>→</span>
                            <span>Golden Source: <code className="text-pink-300">{iss.goldenSourcePath}</code></span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex items-center justify-between pt-2">
                  <button
                    onClick={() => setWizardStep(1)}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-[#8a9cb5] hover:text-white bg-white/5 hover:bg-white/10 transition-all flex items-center gap-1.5"
                  >
                    <Undo2 className="w-4 h-4" />
                    Back
                  </button>

                  <button
                    onClick={() => setWizardStep(3)}
                    className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-purple-600 hover:bg-purple-500 shadow-lg flex items-center gap-2 transition-all"
                  >
                    <span>Next: Review Repair Strategy</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 3: Review & Apply Repair */}
            {wizardStep === 3 && (
              <div className="p-6 rounded-3xl bg-[#0c101c] border border-[#1e273e] space-y-5 animate-in fade-in duration-200">
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-pink-400" />
                    Step 3: Confirm Restoration Strategy from /recovery
                  </h3>
                  <p className="text-xs text-[#8a9cb5] mt-1">
                    The wizard will surgically restore pristine binaries from the <strong>Protected Read-Only Partition</strong> and re-synchronize cryptographic signatures.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-black/40 border border-white/10 space-y-3 font-mono text-xs">
                  <div className="text-xs font-bold text-white flex items-center gap-2">
                    <Lock className="w-4 h-4 text-pink-400" />
                    Actions Scheduled for Execution:
                  </div>
                  <div className="space-y-1.5 text-[#94a3b8] pl-2 border-l-2 border-pink-500/40">
                    <div>1. Flash signed <code>BOOTX64.EFI</code> to <code>/boot/efi/</code> (Restores GRUB 2.12 multiboot)</div>
                    <div>2. Hot-swap <code>virtio_gpu_compositor</code> into Ring 3 daemon pool</div>
                    <div>3. Overwrite corrupted superblock backup at Block 32768 from <code>/recovery/superblock_backup.meta</code></div>
                    <div>4. Re-calculate SHA-256 integrity tree and certify TPM 2.0 PCR-7 boot measurements</div>
                  </div>
                </div>

                {wizardRepairing && (
                  <div className="p-4 rounded-2xl bg-black/60 border border-purple-500/40 font-mono text-xs space-y-1.5">
                    {wizardRepairLog.map((log, idx) => (
                      <div key={idx} className="text-purple-300">{log}</div>
                    ))}
                  </div>
                )}

                <div className="flex items-center justify-between pt-2">
                  <button
                    onClick={() => setWizardStep(2)}
                    disabled={wizardRepairing}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-[#8a9cb5] hover:text-white bg-white/5 hover:bg-white/10 transition-all flex items-center gap-1.5 disabled:opacity-50"
                  >
                    <Undo2 className="w-4 h-4" />
                    Back
                  </button>

                  <button
                    onClick={handleExecuteWizardRepair}
                    disabled={wizardRepairing}
                    className="px-6 py-2.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 shadow-xl flex items-center gap-2 transition-all disabled:opacity-50"
                  >
                    <Play className="w-4 h-4 fill-current" />
                    {wizardRepairing ? 'Executing Repair...' : 'Execute Restoration & Hot-Patch'}
                  </button>
                </div>
              </div>
            )}

            {/* STEP 4: Completion Certificate */}
            {wizardStep === 4 && (
              <div className="p-6 rounded-3xl bg-gradient-to-br from-[#0c1815] via-[#09141b] to-[#120d1c] border border-emerald-500/40 space-y-5 animate-in fade-in duration-300">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-2xl bg-emerald-500/20 border border-emerald-500/50 text-emerald-400">
                    <CheckCircle className="w-7 h-7" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white flex items-center gap-2">
                      System & Boot Recovery Certificate Issued
                    </h3>
                    <p className="text-xs text-emerald-300/80 mt-0.5">
                      All system files, bootloaders, and filesystems have been successfully restored and cryptographically signed.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 font-mono text-xs">
                  <div className="p-3 rounded-2xl bg-black/40 border border-emerald-500/20">
                    <div className="text-[#8a9cb5] text-[10px]">Restored Components</div>
                    <div className="text-white font-bold text-sm">3 of 3 Restored (100%)</div>
                  </div>
                  <div className="p-3 rounded-2xl bg-black/40 border border-emerald-500/20">
                    <div className="text-[#8a9cb5] text-[10px]">Golden Hash Match</div>
                    <div className="text-emerald-400 font-bold text-sm">SHA-256 VERIFIED</div>
                  </div>
                  <div className="p-3 rounded-2xl bg-black/40 border border-emerald-500/20">
                    <div className="text-[#8a9cb5] text-[10px]">Boot Readiness</div>
                    <div className="text-sky-300 font-bold text-sm">READY FOR REBOOT</div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <button
                    onClick={() => {
                      setWizardStep(1);
                      setWizardSuccess(false);
                    }}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-[#8a9cb5] hover:text-white bg-white/5 hover:bg-white/10 transition-all"
                  >
                    Start New Diagnostic Session
                  </button>

                  <button
                    onClick={handleExportReport}
                    className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 shadow-lg flex items-center gap-2 transition-all"
                  >
                    <Download className="w-4 h-4" />
                    Download Diagnostic Certificate (.txt)
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 5: SELF-AUDIT BASELINE & CHANGE AUDIT LEDGER          */}
        {/* ========================================================= */}
        {activeTab === 'self-audit' && (
          <div className="space-y-6">
            {/* Top Armed State Banner */}
            <div className={`p-5 rounded-3xl border transition-all ${
              isAuditArmed 
                ? 'bg-gradient-to-r from-[#0a1815] via-[#091b22] to-[#121020] border-emerald-500/40 shadow-xl shadow-emerald-950/20' 
                : 'bg-gradient-to-r from-[#1f1608] via-[#1c1214] to-[#14121c] border-amber-500/40 shadow-xl shadow-amber-950/20'
            }`}>
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className={`p-3.5 rounded-2xl border ${
                    isAuditArmed 
                      ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400' 
                      : 'bg-amber-500/20 border-amber-500/50 text-amber-400'
                  }`}>
                    {isAuditArmed ? <ShieldCheck className="w-8 h-8" /> : <ShieldAlert className="w-8 h-8" />}
                  </div>

                  <div>
                    <div className="flex items-center gap-3">
                      <h3 className="text-base font-bold text-white flex items-center gap-2">
                        {isAuditArmed ? 'Baseline Self-Audit Sentinel: ARMED' : 'Baseline Self-Audit: SETUP COMMISSIONING MODE (DISARMED)'}
                      </h3>
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-mono font-bold flex items-center gap-1.5 ${
                        isAuditArmed 
                          ? 'bg-emerald-950/90 text-emerald-300 border border-emerald-500/60' 
                          : 'bg-amber-950/90 text-amber-300 border border-amber-500/60'
                      }`}>
                        <span className={`w-2 h-2 rounded-full ${isAuditArmed ? 'bg-emerald-400 animate-ping' : 'bg-amber-400'}`} />
                        {isAuditArmed ? 'ACTIVE CONTINUOUS ENFORCEMENT' : 'PAUSED FOR SOFTWARE LOADING'}
                      </span>
                    </div>
                    <p className="text-xs text-[#94a3b8] mt-1 max-w-2xl leading-relaxed">
                      {isAuditArmed
                        ? 'The system setup administrator has locked in the golden baseline. All hardware registers, microkernel binaries, isolated daemons, and system security configs are continuously verified against the cryptographic snapshot. Any unauthorized drifts are intercepted.'
                        : 'Self-audit enforcement is temporarily disarmed. The administrator may freely install software packages, update drivers, and configure policies. Once setup is finalized, capture a new baseline snapshot and arm the sentinel.'}
                    </p>
                  </div>
                </div>

                {/* Right Action Controls */}
                <div className="flex flex-wrap items-center gap-2.5">
                  <button
                    onClick={handleToggleAuditArm}
                    className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition-all shadow-lg flex items-center gap-2 border ${
                      isAuditArmed
                        ? 'bg-amber-950/80 hover:bg-amber-900/90 text-amber-200 border-amber-500/50 hover:border-amber-400'
                        : 'bg-emerald-600 hover:bg-emerald-500 text-white border-emerald-400 shadow-emerald-950/50'
                    }`}
                  >
                    <Lock className="w-3.5 h-3.5" />
                    <span>{isAuditArmed ? 'Disarm to Load Software' : 'ARM Self-Audit Sentinel'}</span>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-black/40 text-white/80">SUDO PIN</span>
                  </button>

                  <button
                    onClick={handleRebaselineSnapshot}
                    disabled={isBaselineAuditing}
                    className="px-4 py-2.5 rounded-2xl text-xs font-bold text-white bg-[#1e2538] hover:bg-[#28324c] border border-[#3b486c] transition-all shadow flex items-center gap-2"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-pink-400" />
                    <span>Seal Golden Baseline</span>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-black/40 text-pink-300">SUDO PIN</span>
                  </button>

                  <button
                    onClick={handleRunLiveBaselineAudit}
                    disabled={isBaselineAuditing}
                    className="px-3.5 py-2.5 rounded-2xl text-xs font-semibold text-[#cbd5e1] hover:text-white bg-black/40 hover:bg-black/60 border border-white/10 transition-all flex items-center gap-1.5"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isBaselineAuditing ? 'animate-spin text-sky-400' : ''}`} />
                    <span>{isBaselineAuditing ? 'Auditing...' : 'Verify Now'}</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Quick Metrics Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 font-mono text-xs">
              <div className="p-3.5 rounded-2xl bg-[#0c101c] border border-[#1b2234] flex items-center justify-between">
                <div>
                  <div className="text-[10px] text-[#6b7c96] uppercase font-bold">Monitored Baseline Assets</div>
                  <div className="text-white font-bold text-sm mt-0.5">10 Artifacts (100% In-Spec)</div>
                </div>
                <div className="p-2 rounded-xl bg-sky-950/60 text-sky-400 border border-sky-500/30">
                  <Layers className="w-4 h-4" />
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-[#0c101c] border border-[#1b2234] flex items-center justify-between">
                <div>
                  <div className="text-[10px] text-[#6b7c96] uppercase font-bold">Hardware & Kernel Seal</div>
                  <div className="text-emerald-400 font-bold text-sm mt-0.5">TPM 2.0 PCR-7 MATCH</div>
                </div>
                <div className="p-2 rounded-xl bg-emerald-950/60 text-emerald-400 border border-emerald-500/30">
                  <Fingerprint className="w-4 h-4" />
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-[#0c101c] border border-[#1b2234] flex items-center justify-between">
                <div>
                  <div className="text-[10px] text-[#6b7c96] uppercase font-bold">Post-Setup Software Manifest</div>
                  <div className="text-purple-300 font-bold text-sm mt-0.5">1,280 Sealed Packages</div>
                </div>
                <div className="p-2 rounded-xl bg-purple-950/60 text-purple-400 border border-purple-500/30">
                  <FileCode className="w-4 h-4" />
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-[#0c101c] border border-[#1b2234] flex items-center justify-between">
                <div>
                  <div className="text-[10px] text-[#6b7c96] uppercase font-bold">Change Ledger Entries</div>
                  <div className="text-pink-300 font-bold text-sm mt-0.5">{changeLogs.length} Events Logged</div>
                </div>
                <div className="p-2 rounded-xl bg-pink-950/60 text-pink-400 border border-pink-500/30">
                  <History className="w-4 h-4" />
                </div>
              </div>
            </div>

            {/* Split View: Baseline Configuration Manifest & Change Ledger */}
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
              {/* Left 7 Columns: Baseline Configuration Manifest */}
              <div className="xl:col-span-7 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <Sliders className="w-4 h-4 text-sky-400" />
                    <h4 className="text-xs font-bold font-mono text-white uppercase tracking-wider">
                      Hardware & Software Baseline Manifest
                    </h4>
                  </div>

                  {/* Filter Pills */}
                  <div className="flex items-center gap-1 bg-[#0c101c] p-1 rounded-xl border border-[#1b2234] text-[11px] font-mono">
                    {(['ALL', 'HARDWARE', 'SOFTWARE', 'CONFIG', 'KERNEL'] as const).map(cat => (
                      <button
                        key={cat}
                        onClick={() => setBaselineFilter(cat)}
                        className={`px-2.5 py-1 rounded-lg font-semibold transition-all ${
                          baselineFilter === cat
                            ? 'bg-pink-500/20 text-pink-300 border border-pink-500/40'
                            : 'text-[#6b7c96] hover:text-white'
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Items List */}
                <div className="space-y-2.5 max-h-[480px] overflow-y-auto pr-1">
                  {baselineItems
                    .filter(item => baselineFilter === 'ALL' || item.category === baselineFilter)
                    .map(item => (
                      <div 
                        key={item.id}
                        className="p-3.5 rounded-2xl bg-[#0b0e18] border border-[#1b2234] hover:border-[#2a3755] transition-all space-y-2"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="flex items-center gap-2.5">
                            <span className={`px-2 py-0.5 rounded text-[9px] font-mono font-bold uppercase border ${
                              item.category === 'HARDWARE' ? 'bg-amber-950/80 text-amber-300 border-amber-500/40' :
                              item.category === 'KERNEL' ? 'bg-rose-950/80 text-rose-300 border-rose-500/40' :
                              item.category === 'SOFTWARE' ? 'bg-purple-950/80 text-purple-300 border-purple-500/40' :
                              'bg-sky-950/80 text-sky-300 border-sky-500/40'
                            }`}>
                              {item.category}
                            </span>
                            <span className="text-xs font-bold text-white font-mono">{item.name}</span>
                          </div>

                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded-full border border-emerald-500/40 flex items-center gap-1 font-semibold">
                              <CheckCheck className="w-3 h-3" />
                              <span>IN SPEC</span>
                            </span>
                            <span className="text-[10px] font-mono text-[#6b7c96]">{item.lastAudited}</span>
                          </div>
                        </div>

                        <div className="text-[11px] text-[#94a3b8] font-sans">
                          {item.specDetails}
                        </div>

                        <div className="p-2 rounded-xl bg-black/60 border border-white/5 font-mono text-[10px] text-[#7d90a8] flex flex-col gap-1">
                          <div className="flex items-center justify-between">
                            <span className="text-[#64748b]">Target:</span>
                            <span className="text-white truncate max-w-[280px]">{item.target}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-[#64748b]">Baseline Signature:</span>
                            <span className="text-emerald-300 truncate max-w-[280px]">{item.baselineSignature}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              </div>

              {/* Right 5 Columns: Chronological Change & Audit Ledger */}
              <div className="xl:col-span-5 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <History className="w-4 h-4 text-pink-400" />
                    <h4 className="text-xs font-bold font-mono text-white uppercase tracking-wider">
                      Tamper-Evident Change Ledger
                    </h4>
                  </div>

                  <button
                    onClick={handleExportBaselineLedger}
                    className="px-3 py-1.5 rounded-xl bg-[#141b2a] hover:bg-[#1f2a42] text-xs font-semibold text-pink-300 border border-pink-500/30 transition-all flex items-center gap-1.5 shadow"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Export Ledger</span>
                  </button>
                </div>

                <div className="p-4 rounded-3xl bg-[#080b12] border border-[#1b2234] space-y-3 max-h-[480px] overflow-y-auto font-mono text-xs">
                  {changeLogs.map((log) => (
                    <div 
                      key={log.id} 
                      className="p-3 rounded-2xl bg-[#0e1322] border border-[#1f283e] space-y-1.5"
                    >
                      <div className="flex items-center justify-between text-[10px]">
                        <span className={`px-2 py-0.5 rounded font-bold uppercase border ${
                          log.severity === 'SUCCESS' ? 'bg-emerald-950 text-emerald-300 border-emerald-500/40' :
                          log.severity === 'WARNING' ? 'bg-amber-950 text-amber-300 border-amber-500/40' :
                          log.severity === 'CRITICAL' ? 'bg-rose-950 text-rose-300 border-rose-500/40' :
                          'bg-sky-950 text-sky-300 border-sky-500/40'
                        }`}>
                          {log.action}
                        </span>
                        <span className="text-[#64748b]">{log.timestamp}</span>
                      </div>

                      <div className="text-white font-sans text-xs font-medium">
                        {log.description}
                      </div>

                      <div className="flex items-center justify-between text-[10px] text-[#7d90a8] pt-0.5">
                        <span>Actor: <strong className="text-purple-300">{log.actor}</strong></span>
                        {log.pinElevated && (
                          <span className="text-emerald-400 flex items-center gap-0.5">
                            <Lock className="w-2.5 h-2.5" /> PIN Verified
                          </span>
                        )}
                      </div>

                      {log.diffSummary && (
                        <div className="p-2 rounded-xl bg-black/70 border border-white/5 text-[10px] text-pink-300/90 whitespace-pre-wrap">
                          {log.diffSummary}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Admin Sudo/SU PIN Elevation Modal for Arming/Rebaselining */}
      <AdminPinElevationModal
        isOpen={isPinModalOpen}
        onClose={() => setIsPinModalOpen(false)}
        onSuccess={() => {
          setIsPinModalOpen(false);
          if (pendingPinAction) {
            pendingPinAction();
            setPendingPinAction(null);
          }
        }}
        actionTitle={pinModalTitle}
        actionDescription={pinModalDesc}
      />
    </div>
  );
};

