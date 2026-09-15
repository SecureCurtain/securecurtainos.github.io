// jb7572_2026-09-02: System Decommission, DoD 5220.22-M Drive Wipe & TPM Clear Suite
// Author: System Administrator - Chief Forensic Architect & SuperAdmin
import React, { useState, useEffect, useRef } from 'react';
import {
  AlertTriangle,
  ShieldAlert,
  Flame,
  PowerOff,
  HardDrive,
  Cpu,
  Usb,
  Unplug,
  Key,
  Lock,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Terminal,
  Shield,
  Trash2,
  Check,
  Eye,
  EyeOff,
  Zap,
  HelpCircle
} from 'lucide-react';
import { storageService, PhysicalDisk } from '../../services/storageService';
import { adminAuthService } from '../../services/adminAuthService';
import { userManagementService, UserAccount } from '../../services/userManagementService';

interface DecommissionGUIProps {
  onRunCliCommand?: (cmd: string) => void;
}

type DecommissionStage = 
  | 'IDLE'
  | 'DIALOG_1_FINAL_WARNING'
  | 'DIALOG_2_ARE_YOU_POSITIVE'
  | 'DIALOG_3_ARE_YOU_REALLY_SURE'
  | 'DECOMMISSIONING_EXECUTION'
  | 'POWERED_OFF';

export const DecommissionGUI: React.FC<DecommissionGUIProps> = ({ onRunCliCommand }) => {
  // Current SuperAdmin / User
  const [currentUser, setCurrentUser] = useState<UserAccount>(() => userManagementService.getCurrentSessionUser());
  const [isSuperAdminElevated, setIsSuperAdminElevated] = useState<boolean>(() => {
    const u = userManagementService.getCurrentSessionUser();
    return u.role === 'ROOT_ADMIN' || adminAuthService.isElevatedSessionActive();
  });

  // Disks detected in system
  const [physicalDisks, setPhysicalDisks] = useState<PhysicalDisk[]>(() => storageService.getDisks());
  const [externalDrivesDetached, setExternalDrivesDetached] = useState<boolean>(false);
  const [detachedDriveNames, setDetachedDriveNames] = useState<string[]>([]);

  // Dialog & Decommission flow states
  const [stage, setStage] = useState<DecommissionStage>('IDLE');
  const [dialog1Checkbox, setDialog1Checkbox] = useState<boolean>(false);
  const [pinInput1, setPinInput1] = useState<string>('');
  const [pinInput2, setPinInput2] = useState<string>('');
  const [showPin, setShowPin] = useState<boolean>(false);
  const [pinError, setPinError] = useState<string | null>(null);

  // Elevation Prompt for Non-SuperAdmins
  const [elevationPin, setElevationPin] = useState<string>('');
  const [elevationError, setElevationError] = useState<string | null>(null);

  // Execution Telemetry Logs
  const [executionProgress, setExecutionProgress] = useState<number>(0);
  const [executionLogs, setExecutionLogs] = useState<string[]>([]);
  const [currentWipePass, setCurrentWipePass] = useState<number>(1);
  const [wipeSpeedMbps, setWipeSpeedMbps] = useState<number>(540);
  const [sectorsWiped, setSectorsWiped] = useState<number>(0);
  const logTerminalRef = useRef<HTMLDivElement>(null);
  const executionTimerRef = useRef<any>(null);

  // Filter external drives
  const externalDisks = physicalDisks.filter((d) => d.type === 'External USB Storage' || d.isRemovable);
  const internalDisks = physicalDisks.filter((d) => d.type !== 'External USB Storage' && !d.isRemovable);

  // Subscribe to user changes and fetch disks
  useEffect(() => {
    setPhysicalDisks(storageService.getDisks());

    const unsubUsers = userManagementService.subscribe(() => {
      const u = userManagementService.getCurrentSessionUser();
      setCurrentUser(u);
      if (u.role === 'ROOT_ADMIN') {
        setIsSuperAdminElevated(true);
      }
    });
    return () => {
      unsubUsers();
      if (executionTimerRef.current) clearInterval(executionTimerRef.current);
    };
  }, []);

  // Auto-scroll execution logs
  useEffect(() => {
    if (logTerminalRef.current) {
      logTerminalRef.current.scrollTop = logTerminalRef.current.scrollHeight;
    }
  }, [executionLogs]);

  // Handle Unhooking / Ejecting External Drives
  const handleUnhookExternalDrives = () => {
    const names = externalDisks.map((d) => `${d.model} (${d.devicePath})`);
    setDetachedDriveNames(names);
    setExternalDrivesDetached(true);
  };

  // Re-attach external drives (simulator)
  const handleReattachExternalDrives = () => {
    setDetachedDriveNames([]);
    setExternalDrivesDetached(false);
  };

  // Handle SuperAdmin Elevation Login if non-admin
  const handleElevateSuperAdmin = (e: React.FormEvent) => {
    e.preventDefault();
    const verify = adminAuthService.verifyElevatedPin(elevationPin);
    if (verify.success) {
      setIsSuperAdminElevated(true);
      setElevationError(null);
      setElevationPin('');
    } else {
      setElevationError(verify.error || 'Invalid SuperAdmin Elevation PIN. (Default: 7572)');
    }
  };

  // Start the Decommission Sequence -> Open Dialog 1
  const handleInitiateDecommissionClick = () => {
    setDialog1Checkbox(false);
    setPinInput1('');
    setPinInput2('');
    setPinError(null);
    setStage('DIALOG_1_FINAL_WARNING');
  };

  // Dialog 1 confirmed -> Advance to Dialog 2 ("Are you positive?")
  const handleConfirmDialog1 = () => {
    if (!dialog1Checkbox) return;
    setPinInput1('');
    setPinError(null);
    setStage('DIALOG_2_ARE_YOU_POSITIVE');
  };

  // Dialog 2: Verify Sudo PIN -> Advance to Dialog 3 ("Are you really really sure?")
  const handleVerifyDialog2 = (e: React.FormEvent) => {
    e.preventDefault();
    const verify = adminAuthService.verifyElevatedPin(pinInput1);
    if (verify.success) {
      setPinError(null);
      setPinInput2('');
      setStage('DIALOG_3_ARE_YOU_REALLY_SURE');
    } else {
      setPinError('Invalid SUDO PIN. Elevation denied.');
    }
  };

  // Dialog 3: Verify Sudo PIN second time -> Trigger Solid Black Screen with Bright Red Letters!
  const handleVerifyDialog3 = (e: React.FormEvent) => {
    e.preventDefault();
    const verify = adminAuthService.verifyElevatedPin(pinInput2);
    if (verify.success) {
      setPinError(null);
      startDecommissioningProcess();
    } else {
      setPinError('Invalid SUDO PIN. Final authorization denied.');
    }
  };

  // Solid Black Screen + Bright Red Letters Decommissioning Execution
  const startDecommissioningProcess = () => {
    setStage('DECOMMISSIONING_EXECUTION');
    setExecutionProgress(0);
    setCurrentWipePass(1);
    setSectorsWiped(0);

    const steps = [
      { progress: 5, pass: 1, text: '[KERNEL] Hardware decommission request received from SuperAdmin (@admin / UID 0).' },
      { progress: 10, pass: 1, text: '[FS] Broadcasting SIGTERM to all userland processes and daemons...' },
      { progress: 15, pass: 1, text: '[FS] Unmounting /home, /sys, /proc, /dev, /boot, and all mounted ext4/btrfs volumes...' },
      { progress: 20, pass: 1, text: '[WIPE] Initializing DoD 5220.22-M (E) & (ECE) 7-Pass Binary Sanitizer...' },
      { progress: 25, pass: 1, text: '[WIPE] Target Drives: /dev/nvme0n1 (512GB), /dev/nvme1n1 (512GB), /dev/sda (1000GB)...' },
      { progress: 32, pass: 1, text: '[PASS 1/7] Writing 0x00 binary zeros across all logical blocks (LBA 0 to 4,194,304,000)...' },
      { progress: 42, pass: 2, text: '[PASS 2/7] Writing 0xFF binary ones across all physical NAND flash sectors...' },
      { progress: 52, pass: 3, text: '[PASS 3/7] Writing cryptographic pseudo-random noise pattern (PRNG CSPRNG stream)...' },
      { progress: 62, pass: 4, text: '[PASS 4/7] Writing bitwise complement pseudo-random sequence across all sectors...' },
      { progress: 70, pass: 5, text: '[PASS 5/7] Overwriting with alternating 0xAA / 0x55 bitmask patterns...' },
      { progress: 78, pass: 6, text: '[PASS 6/7] Applying NIST SP 800-88 Rev. 1 Cryptographic Erase (Purge) & ATA/NVMe Sanitize...' },
      { progress: 85, pass: 7, text: '[PASS 7/7] Executing readback zero-verification test. Entropy verified: 0.00000 bits/byte.' },
      { progress: 90, pass: 7, text: '[TPM 2.0] Transmitting TPM2_Clear command with Platform Hierarchy Auth...' },
      { progress: 93, pass: 7, text: '[TPM 2.0] Storage Root Key (SRK), Endorsement Key (EK) & PCR Registers 0-23 zeroed.' },
      { progress: 96, pass: 7, text: '[FIRMWARE] Zeroing UEFI NVRAM variables, Secure Boot Platform Keys (PK, KEK, db, dbx)...' },
      { progress: 98, pass: 7, text: '[POWER] Broadcasting ACPI S5 Soft-Off hardware power down signal to motherboard...' },
      { progress: 100, pass: 7, text: '[HALT] CPU cores offline. Memory controllers discharged. System fully sanitized.' }
    ];

    let currentStep = 0;
    setExecutionLogs([steps[0].text]);

    executionTimerRef.current = setInterval(() => {
      currentStep++;
      if (currentStep < steps.length) {
        const item = steps[currentStep];
        setExecutionProgress(item.progress);
        setCurrentWipePass(item.pass);
        setExecutionLogs((prev) => [...prev, item.text]);
        setSectorsWiped((prev) => prev + Math.floor(Math.random() * 250000 + 400000));
        setWipeSpeedMbps(Math.floor(520 + Math.random() * 80));
      } else {
        clearInterval(executionTimerRef.current);
        executionTimerRef.current = null;
        // After final step, pause 2 seconds then transition to POWERED_OFF
        setTimeout(() => {
          setStage('POWERED_OFF');
        }, 2000);
      }
    }, 1100);
  };

  // Simulate Cold Reboot / Reset
  const handleColdPowerOn = () => {
    setStage('IDLE');
    setExecutionLogs([]);
    setExecutionProgress(0);
    setDialog1Checkbox(false);
    setPinInput1('');
    setPinInput2('');
  };

  // =========================================================================
  // VIEW: IF SCREEN IS FULL BLACK WITH BRIGHT RED LETTERS (DECOMMISSIONING IN PROCESS)
  // =========================================================================
  if (stage === 'DECOMMISSIONING_EXECUTION') {
    return (
      <div 
        id="decommission-full-screen-black"
        className="fixed inset-0 z-[999999] bg-black text-red-600 font-mono flex flex-col justify-between p-6 sm:p-12 select-none overflow-hidden"
        style={{ backgroundColor: '#000000' }}
      >
        {/* Top Header Banner */}
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b-2 border-red-800 pb-4">
            <div className="flex items-center gap-3">
              <Flame className="w-10 h-10 text-red-500 animate-pulse" />
              <div>
                <span className="text-xs uppercase tracking-widest text-red-500 font-bold block">
                  DO NOT POWER OFF OR INTERRUPT POWER SUPPLY
                </span>
                <span className="text-[11px] text-red-400">
                  CRITICAL HARDWARE SANITIZATION IN PROGRESS // ZERO-FILL PROTOCOL
                </span>
              </div>
            </div>
            <div className="text-right">
              <span className="text-xs text-red-500 font-bold block">DOD 5220.22-M 7-PASS</span>
              <span className="text-sm font-bold text-red-400">PASS {currentWipePass} OF 7</span>
            </div>
          </div>

          {/* Glowing Massive Bright Red Title */}
          <div className="text-center py-6">
            <h1 
              className="text-4xl sm:text-6xl md:text-7xl font-black tracking-wider uppercase animate-pulse text-red-500"
              style={{
                color: '#ff0000',
                textShadow: '0 0 25px #ff0000, 0 0 50px #cc0000, 0 0 100px #990000'
              }}
            >
              Decommissioning in process!
            </h1>
            <p className="text-sm sm:text-lg text-red-400 font-bold tracking-widest uppercase mt-3">
              All hard drives, TPM will be cleaned and the machine finally powers off.
            </p>
          </div>
        </div>

        {/* Center: Live Real-Time DoD Wipe Progress and Telemetry */}
        <div className="max-w-4xl w-full mx-auto space-y-6">
          {/* Progress Bar in Bright Red */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs sm:text-sm font-bold text-red-400">
              <span>OVERALL DESTRUCTION PROGRESS</span>
              <span className="text-red-500 text-lg font-black">{executionProgress}%</span>
            </div>
            <div className="w-full h-5 bg-neutral-950 border-2 border-red-600 rounded-sm p-0.5 overflow-hidden">
              <div 
                className="h-full bg-red-600 transition-all duration-700 ease-out shadow-[0_0_15px_#ff0000]"
                style={{ width: `${executionProgress}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-[11px] text-red-400/80 font-mono">
              <span>Throughput: {wipeSpeedMbps} MB/s (Direct DMA)</span>
              <span>Sectors Sanitized: {sectorsWiped.toLocaleString()} LBA</span>
              <span>Target: All Internal NVMe & Attached Drives</span>
            </div>
          </div>

          {/* Scrolling Terminal Telemetry Log */}
          <div 
            ref={logTerminalRef}
            className="h-64 sm:h-72 bg-black border border-red-900/80 rounded p-4 font-mono text-xs overflow-y-auto space-y-1.5 custom-scrollbar shadow-inner"
            style={{ backgroundColor: '#050000' }}
          >
            {executionLogs.map((log, idx) => (
              <div key={idx} className="flex items-start gap-2 text-red-400">
                <span className="text-red-700 select-none">&gt;&gt;</span>
                <span className={idx === executionLogs.length - 1 ? 'text-red-300 font-bold' : ''}>
                  {log}
                </span>
              </div>
            ))}
            <div className="flex items-center gap-2 text-red-500 animate-pulse pt-1">
              <span className="w-2 h-4 bg-red-500 inline-block" />
              <span className="text-[11px]">Wiping physical storage sectors & zeroing TPM platform keys...</span>
            </div>
          </div>
        </div>

        {/* Bottom Hardware Spec Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 border-t border-red-900 pt-4 text-[11px] text-red-400">
          <div>
            <span className="text-red-600 block font-bold">PRIMARY STORAGE</span>
            <span>/dev/nvme0n1 (Samsung 980 PRO)</span>
          </div>
          <div>
            <span className="text-red-600 block font-bold">MIRROR SSD</span>
            <span>/dev/nvme1n1 (Samsung 980 PRO)</span>
          </div>
          <div>
            <span className="text-red-600 block font-bold">TPM 2.0 CHIPSET</span>
            <span>Infineon OPTIGA SLB9670 (PURGING)</span>
          </div>
          <div>
            <span className="text-red-600 block font-bold">FINAL ACTION</span>
            <span>ACPI S5 Soft-Off Power Down</span>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // VIEW: IF MACHINE HAS POWERED OFF
  // =========================================================================
  if (stage === 'POWERED_OFF') {
    return (
      <div 
        id="decommission-powered-off-screen"
        className="fixed inset-0 z-[999999] bg-black text-neutral-500 font-mono flex flex-col items-center justify-center p-8 select-none"
        style={{ backgroundColor: '#000000' }}
      >
        <div className="max-w-md w-full text-center space-y-6">
          <div className="w-20 h-20 mx-auto rounded-full bg-neutral-950 border border-neutral-800 flex items-center justify-center shadow-inner">
            <PowerOff className="w-10 h-10 text-neutral-700" />
          </div>

          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-neutral-300 tracking-wider">
              [ SYSTEM HALTED - POWER OFF ]
            </h1>
            <p className="text-xs text-neutral-500 leading-relaxed">
              All hard drives have been DoD 5220.22-M wiped. The TPM 2.0 chip has been purged, and the machine has cold-shutdown.
            </p>
          </div>

          <div className="p-4 rounded-lg bg-neutral-950 border border-neutral-900 text-left text-xs space-y-1.5 text-neutral-400">
            <div className="flex justify-between">
              <span>Drive Sanitization:</span>
              <span className="text-emerald-500 font-bold">VERIFIED 7-PASS DOD</span>
            </div>
            <div className="flex justify-between">
              <span>TPM 2.0 Hierarchy:</span>
              <span className="text-emerald-500 font-bold">PURGED & ZEROED</span>
            </div>
            <div className="flex justify-between">
              <span>NVRAM Boot Keys:</span>
              <span className="text-emerald-500 font-bold">DESTROYED</span>
            </div>
            <div className="flex justify-between">
              <span>Hardware Power State:</span>
              <span className="text-neutral-500 font-bold">ACPI S5 (Cold Off)</span>
            </div>
          </div>

          <div className="pt-4">
            <button
              onClick={handleColdPowerOn}
              className="px-6 py-3 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-neutral-300 hover:text-white text-xs font-bold transition-all flex items-center gap-2 mx-auto cursor-pointer shadow-lg"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Simulate Cold Power On / System Reboot</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // VIEW: MAIN DECOMMISSION DASHBOARD (SUPERADMIN ACCESSIBLE)
  // =========================================================================
  return (
    <div className="space-y-6 font-sans text-neutral-200 select-none relative">
      {/* Top Banner Alert */}
      <div className="bg-gradient-to-r from-red-950/80 via-[#1c0808] to-neutral-950 border border-red-600/40 rounded-2xl p-6 shadow-2xl relative overflow-hidden">
        <div className="absolute -top-10 -right-10 w-96 h-96 bg-red-600/10 blur-3xl pointer-events-none" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-5 relative z-10">
          <div className="flex items-center gap-4">
            <div className="p-4 rounded-2xl bg-red-600/20 border border-red-500/50 text-red-400 shadow-inner">
              <Flame className="w-8 h-8 text-red-500 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h2 className="text-xl font-bold text-white tracking-wide">
                  System Decommission & Hardware Sanitization Suite
                </h2>
                <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-red-950 border border-red-600/60 text-red-300 font-mono font-bold flex items-center gap-1">
                  <ShieldAlert className="w-3 h-3 text-red-400" />
                  SUPERADMIN RESTRICTED
                </span>
              </div>
              <p className="text-xs text-neutral-400 mt-1 max-w-2xl">
                DoD 5220.22-M (7-Pass Overwrite) & NIST SP 800-88 Cryptographic Erase engine. Permanent hardware retirement, TPM 2.0 platform clear, and UEFI NVRAM platform key destruction.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <span className="text-[11px] text-neutral-400 block">Operator Authority</span>
              <span className="text-xs font-mono font-bold text-red-400">
                {currentUser.fullName} (@{currentUser.username})
              </span>
            </div>
            <div className="p-2.5 rounded-xl bg-neutral-900/80 border border-red-900/50 text-red-400">
              <Lock className="w-5 h-5" />
            </div>
          </div>
        </div>
      </div>

      {/* Non-SuperAdmin Lockout Banner if not elevated */}
      {!isSuperAdminElevated && (
        <div className="bg-amber-950/40 border border-amber-500/50 rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex items-center gap-3 text-amber-400">
            <ShieldAlert className="w-6 h-6" />
            <h3 className="text-sm font-bold uppercase tracking-wider">
              SuperAdmin Privilege Elevation Required
            </h3>
          </div>
          <p className="text-xs text-neutral-300">
            Decommissioning is restricted to SuperAdmins (<code className="text-amber-300">ROOT_ADMIN</code> / Wheel Group). To unlock this terminal, enter the elevated SuperAdmin PIN.
          </p>
          <form onSubmit={handleElevateSuperAdmin} className="flex items-center gap-3 max-w-md">
            <input
              type="password"
              placeholder="Enter SuperAdmin PIN (e.g. 7572)"
              value={elevationPin}
              onChange={(e) => setElevationPin(e.target.value)}
              className="flex-1 px-3.5 py-2 rounded-xl bg-black/60 border border-amber-500/40 text-xs font-mono text-white placeholder-neutral-500 focus:outline-none focus:border-amber-400"
            />
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-black font-bold text-xs transition-colors cursor-pointer"
            >
              Elevate
            </button>
          </form>
          {elevationError && (
            <p className="text-xs text-red-400 font-mono flex items-center gap-1.5">
              <XCircle className="w-3.5 h-3.5" />
              {elevationError}
            </p>
          )}
        </div>
      )}

      {/* External Storage Safeguard & Allowance (Requested specifically) */}
      <div className="bg-[#121218] border border-[#2a2a38] rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#222] pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-indigo-950/60 border border-indigo-500/40 text-indigo-300">
              <Usb className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <span>External Drive Safeguard & Allowance</span>
                {externalDisks.length > 0 && !externalDrivesDetached ? (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-950 border border-amber-600 text-amber-300 font-mono">
                    {externalDisks.length} External Drive Connected
                  </span>
                ) : (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-950 border border-emerald-600 text-emerald-300 font-mono">
                    Safe: All External Drives Detached
                  </span>
                )}
              </h3>
              <p className="text-xs text-neutral-400 mt-0.5">
                Ensure all backup drives, USB sticks, or forensic targets you wish to preserve are safely unhooked prior to sanitization.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {!externalDrivesDetached && externalDisks.length > 0 ? (
              <button
                onClick={handleUnhookExternalDrives}
                className="px-4 py-2 rounded-xl bg-amber-950 hover:bg-amber-900 border border-amber-600/50 text-amber-300 text-xs font-bold flex items-center gap-2 transition-all cursor-pointer shadow-md"
                title="Safely unmount and isolate external storage drives"
              >
                <Unplug className="w-4 h-4 text-amber-400" />
                <span>Safely Unhook All External Drives</span>
              </button>
            ) : (
              <button
                onClick={handleReattachExternalDrives}
                className="px-3.5 py-1.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-neutral-400 text-xs font-mono flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Re-Scan Attached USB Storage</span>
              </button>
            )}
          </div>
        </div>

        {/* External Drive Status Cards */}
        {externalDisks.length > 0 && !externalDrivesDetached ? (
          <div className="p-4 rounded-xl bg-amber-950/20 border border-amber-600/40 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <span className="text-xs font-bold text-amber-300 block">
                Warning: External Storage Connected ({externalDisks.map((d) => d.devicePath).join(', ')})
              </span>
              <p className="text-xs text-neutral-300 leading-relaxed">
                The decommission process will wipe <strong>all storage devices</strong> connected to the bus. If you do not want your external backup drives sanitized, click &quot;Safely Unhook All External Drives&quot; above or physically unplug them now.
              </p>
            </div>
          </div>
        ) : (
          <div className="p-4 rounded-xl bg-emerald-950/20 border border-emerald-600/30 flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <div className="text-xs text-neutral-300">
              <span className="font-bold text-emerald-300">External Drive Allowance Acknowledged: </span>
              {detachedDriveNames.length > 0 ? (
                <span>Isolated: {detachedDriveNames.join(', ')}. These will NOT be wiped.</span>
              ) : (
                <span>No external storage detected or all external drives have been safely disconnected.</span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Target Storage & Firmware Devices to be Destroyed */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Physical Storage Drives */}
        <div className="bg-[#121218] border border-[#2a2a38] rounded-2xl p-5 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-[#222] pb-3">
            <div className="flex items-center gap-2">
              <HardDrive className="w-4 h-4 text-red-400" />
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                Physical Storage Targets (DOD Wiped)
              </h3>
            </div>
            <span className="text-[10px] text-red-400 font-mono font-bold">
              {internalDisks.length} Internal Disks
            </span>
          </div>

          <div className="space-y-2.5">
            {internalDisks.map((disk) => (
              <div 
                key={disk.id}
                className="p-3 rounded-xl bg-black/40 border border-neutral-800 flex items-center justify-between"
              >
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-white">{disk.devicePath}</span>
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-red-950 text-red-300 border border-red-800/40">
                      7-PASS WIPE
                    </span>
                  </div>
                  <div className="text-[11px] text-neutral-400 line-clamp-1">{disk.model}</div>
                </div>
                <div className="text-right">
                  <div className="text-xs font-mono font-bold text-neutral-300">{disk.sizeFormatted}</div>
                  <div className="text-[10px] text-neutral-500">{disk.busInterface}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* TPM 2.0 & Motherboard Firmware Keys */}
        <div className="bg-[#121218] border border-[#2a2a38] rounded-2xl p-5 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-[#222] pb-3">
            <div className="flex items-center gap-2">
              <Cpu className="w-4 h-4 text-amber-400" />
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                TPM 2.0 & Cryptographic Key Targets
              </h3>
            </div>
            <span className="text-[10px] text-amber-400 font-mono font-bold">
              Full Purge
            </span>
          </div>

          <div className="space-y-2.5 text-xs">
            <div className="p-3 rounded-xl bg-black/40 border border-neutral-800 space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-mono font-bold text-white">TPM 2.0 Hierarchy (PlatformAuth)</span>
                <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-800/40 font-mono">
                  TPM2_Clear
                </span>
              </div>
              <p className="text-[11px] text-neutral-400">
                Purges Storage Root Key (SRK), Endorsement Key (EK) certificates, and resets all PCR 0-23 registers.
              </p>
            </div>

            <div className="p-3 rounded-xl bg-black/40 border border-neutral-800 space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-mono font-bold text-white">UEFI NVRAM & Secure Boot PK</span>
                <span className="text-[9px] px-1.5 py-0.5 rounded bg-red-950 text-red-300 border border-red-800/40 font-mono">
                  ZEROIZED
                </span>
              </div>
              <p className="text-[11px] text-neutral-400">
                Zeroes Platform Keys (PK), Key Exchange Keys (KEK), and signature databases (db/dbx).
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Compliance Standards Matrix */}
      <div className="bg-[#0f0f14] border border-[#222] rounded-2xl p-5 shadow-xl">
        <div className="flex items-center gap-2 mb-3">
          <Shield className="w-4 h-4 text-neutral-400" />
          <h3 className="text-xs font-bold text-neutral-300 uppercase tracking-wider">
            Sanitization Standards Enforced
          </h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div className="p-3 rounded-xl bg-neutral-950 border border-neutral-800">
            <span className="font-bold text-white block">DoD 5220.22-M (ECE)</span>
            <span className="text-[11px] text-neutral-400 mt-0.5 block">
              7-pass overwrite with binary zeroes, ones, pseudorandom noise, and readback validation.
            </span>
          </div>
          <div className="p-3 rounded-xl bg-neutral-950 border border-neutral-800">
            <span className="font-bold text-white block">NIST SP 800-88 Rev. 1</span>
            <span className="text-[11px] text-neutral-400 mt-0.5 block">
              Guidelines for Media Sanitization (Purge level with Cryptographic Erase).
            </span>
          </div>
          <div className="p-3 rounded-xl bg-neutral-950 border border-neutral-800">
            <span className="font-bold text-white block">TCG Storage Opal 2.0</span>
            <span className="text-[11px] text-neutral-400 mt-0.5 block">
              Hardware Media Encryption Key (MEK) destruction rendered unrecoverable.
            </span>
          </div>
        </div>
      </div>

      {/* Main Execution Trigger Card */}
      <div className="bg-gradient-to-b from-red-950/30 to-black border-2 border-red-600/60 rounded-2xl p-6 shadow-2xl space-y-4 text-center">
        <div className="max-w-xl mx-auto space-y-2">
          <h3 className="text-lg font-bold text-white tracking-wide">
            Ready to Decommission This Machine?
          </h3>
          <p className="text-xs text-neutral-400 leading-relaxed">
            Pressing the button below initiates the multi-step verification safeguards. You will be prompted to verify external drive allowances, confirm your intentions, and provide elevated SUDO PIN authentication before execution.
          </p>
        </div>

        <button
          onClick={handleInitiateDecommissionClick}
          disabled={!isSuperAdminElevated}
          className={`px-8 py-4 rounded-xl font-mono text-sm font-black tracking-wider uppercase transition-all flex items-center gap-3 mx-auto cursor-pointer shadow-2xl ${
            isSuperAdminElevated
              ? 'bg-gradient-to-r from-red-600 via-rose-600 to-red-700 hover:from-red-500 hover:to-rose-500 text-white shadow-red-950/80 hover:scale-105 active:scale-95'
              : 'bg-neutral-800 text-neutral-500 border border-neutral-700 cursor-not-allowed'
          }`}
        >
          <Flame className="w-5 h-5 text-red-200 animate-pulse" />
          <span>DECOMMISSION SYSTEM &amp; DOD WIPE</span>
          <PowerOff className="w-5 h-5 text-red-200" />
        </button>
      </div>

      {/* ========================================================================= */}
      {/* DIALOG 1: FINAL WARNING & EXTERNAL DRIVE ALLOWANCE                         */}
      {/* ========================================================================= */}
      {stage === 'DIALOG_1_FINAL_WARNING' && (
        <div className="fixed inset-0 z-[99999] bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="max-w-xl w-full bg-[#141012] border-2 border-red-600/80 rounded-2xl p-6 shadow-2xl shadow-red-950 space-y-5 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-2xl bg-red-600/20 border border-red-500/50 text-red-400 shrink-0">
                <AlertTriangle className="w-7 h-7 text-red-500" />
              </div>
              <div className="space-y-1">
                <span className="text-[10px] font-mono font-bold tracking-widest text-red-500 uppercase block">
                  SAFEGUARD STEP 1 OF 3 // FINAL NOTICE
                </span>
                <h3 className="text-lg font-bold text-white">
                  This Action Is Final &amp; Irreversible
                </h3>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-red-950/30 border border-red-800/40 text-xs text-neutral-200 space-y-2 leading-relaxed">
              <p>
                <strong>Warning:</strong> All drives attached to this system will be completely destroyed using <strong>DoD 5220.22-M 7-pass binary overwriting</strong> and <strong>NIST SP 800-88 cryptographic key destruction</strong>.
              </p>
              <p className="text-neutral-400">
                Once confirmed, all user data, operating system installations, partition tables, and TPM 2.0 hardware security keys will be permanently eliminated with zero possibility of recovery.
              </p>
            </div>

            {/* External Drive Allowance Notice */}
            <div className="p-4 rounded-xl bg-neutral-900 border border-neutral-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white flex items-center gap-2">
                  <Usb className="w-4 h-4 text-indigo-400" />
                  <span>External Drive Allowance</span>
                </span>
                {externalDrivesDetached ? (
                  <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-950 border border-emerald-700 text-emerald-300 font-mono">
                    External Drives Unhooked
                  </span>
                ) : (
                  <span className="text-[10px] px-2 py-0.5 rounded bg-amber-950 border border-amber-700 text-amber-300 font-mono">
                    {externalDisks.length} Attached
                  </span>
                )}
              </div>
              <p className="text-[11px] text-neutral-400 leading-normal">
                If you have external USB backup drives or flash memory attached that you wish to preserve, unhook them now before proceeding.
              </p>
              {!externalDrivesDetached && externalDisks.length > 0 && (
                <button
                  onClick={handleUnhookExternalDrives}
                  className="w-full py-2 rounded-lg bg-indigo-950 hover:bg-indigo-900 border border-indigo-600/50 text-indigo-300 text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  <Unplug className="w-4 h-4" />
                  <span>Unhook &amp; Eject External Drives Now</span>
                </button>
              )}
            </div>

            {/* Acknowledgment Checkbox */}
            <label className="flex items-start gap-3 p-3 rounded-xl bg-black/40 border border-neutral-800 cursor-pointer hover:border-neutral-700 transition-colors">
              <input
                type="checkbox"
                checked={dialog1Checkbox}
                onChange={(e) => setDialog1Checkbox(e.target.checked)}
                className="w-4 h-4 mt-0.5 accent-red-600 rounded cursor-pointer"
              />
              <span className="text-xs text-neutral-300 leading-normal">
                I understand that this process is final and that all currently attached internal storage drives and unremoved media will be DOD wiped.
              </span>
            </label>

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setStage('IDLE')}
                className="px-4 py-2.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-neutral-300 text-xs font-bold transition-colors cursor-pointer"
              >
                Abort &amp; Cancel
              </button>
              <button
                onClick={handleConfirmDialog1}
                disabled={!dialog1Checkbox}
                className={`px-5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
                  dialog1Checkbox
                    ? 'bg-red-600 hover:bg-red-500 text-white shadow-lg shadow-red-950'
                    : 'bg-neutral-800 text-neutral-500 border border-neutral-700 cursor-not-allowed'
                }`}
              >
                <span>OK, The Process Is Still A Go</span>
                <Check className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* DIALOG 2: "ARE YOU POSITIVE?" + ENTER SUDO PIN                             */}
      {/* ========================================================================= */}
      {stage === 'DIALOG_2_ARE_YOU_POSITIVE' && (
        <div className="fixed inset-0 z-[99999] bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-[#160e10] border-2 border-red-600 rounded-2xl p-6 shadow-2xl shadow-red-950 space-y-5 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-2xl bg-red-600/20 border border-red-500/50 text-red-400">
                <AlertTriangle className="w-6 h-6 text-red-500" />
              </div>
              <div>
                <span className="text-[10px] font-mono font-bold tracking-widest text-red-500 uppercase block">
                  SAFEGUARD STEP 2 OF 3
                </span>
                <h3 className="text-xl font-black text-white">
                  Are you positive?
                </h3>
              </div>
            </div>

            <p className="text-xs text-neutral-300 leading-relaxed">
              You are about to initiate total machine sanitization. Enter your SUDO PIN to confirm authorization.
            </p>

            <form onSubmit={handleVerifyDialog2} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[11px] font-mono text-neutral-400 flex items-center justify-between">
                  <span>ENTER SUDO PIN TO PROCEED</span>
                  <span className="text-neutral-500 text-[10px]">Default PIN: 7572</span>
                </label>
                <div className="relative">
                  <input
                    type={showPin ? 'text' : 'password'}
                    autoFocus
                    value={pinInput1}
                    onChange={(e) => {
                      setPinInput1(e.target.value);
                      if (pinError) setPinError(null);
                    }}
                    placeholder="Enter 4-10 char SUDO PIN"
                    className="w-full px-4 py-3 rounded-xl bg-black/60 border border-red-600/60 text-white font-mono text-sm tracking-widest focus:outline-none focus:border-red-400"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPin(!showPin)}
                    className="absolute right-3 top-3 text-neutral-400 hover:text-white cursor-pointer"
                  >
                    {showPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {pinError && (
                  <p className="text-xs text-red-400 font-mono flex items-center gap-1.5 pt-1">
                    <XCircle className="w-3.5 h-3.5" />
                    {pinError}
                  </p>
                )}
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setStage('IDLE')}
                  className="px-4 py-2.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-neutral-300 text-xs font-bold transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!pinInput1}
                  className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    pinInput1
                      ? 'bg-red-600 hover:bg-red-500 text-white shadow-lg shadow-red-950'
                      : 'bg-neutral-800 text-neutral-500 border border-neutral-700 cursor-not-allowed'
                  }`}
                >
                  Verify &amp; Proceed
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* DIALOG 3: "ARE YOU REALLY REALLY SURE?" + ENTER SUDO PIN                   */}
      {/* ========================================================================= */}
      {stage === 'DIALOG_3_ARE_YOU_REALLY_SURE' && (
        <div className="fixed inset-0 z-[99999] bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-[#18080a] border-2 border-red-500 rounded-2xl p-6 shadow-2xl shadow-red-950 space-y-5 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-2xl bg-red-600/30 border border-red-500 text-red-400 animate-pulse">
                <Flame className="w-7 h-7 text-red-500" />
              </div>
              <div>
                <span className="text-[10px] font-mono font-bold tracking-widest text-red-400 uppercase block">
                  FINAL SAFEGUARD STEP 3 OF 3 // POINT OF NO RETURN
                </span>
                <h3 className="text-xl font-black text-white">
                  Are you really really sure?
                </h3>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-red-950/40 border border-red-700/60 text-xs text-red-200 leading-relaxed font-mono">
              [CRITICAL FINAL WARNING]: Re-entering your SUDO PIN here will immediately turn the screen black, begin 7-pass DOD drive wiping, clear TPM 2.0 cryptographic storage, and power the machine off.
            </div>

            <form onSubmit={handleVerifyDialog3} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[11px] font-mono text-neutral-400 flex items-center justify-between">
                  <span>RE-ENTER SUDO PIN TO PROCEED</span>
                  <span className="text-neutral-500 text-[10px]">Default PIN: 7572</span>
                </label>
                <div className="relative">
                  <input
                    type={showPin ? 'text' : 'password'}
                    autoFocus
                    value={pinInput2}
                    onChange={(e) => {
                      setPinInput2(e.target.value);
                      if (pinError) setPinError(null);
                    }}
                    placeholder="Enter SUDO PIN again"
                    className="w-full px-4 py-3 rounded-xl bg-black/70 border-2 border-red-500 text-white font-mono text-sm tracking-widest focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPin(!showPin)}
                    className="absolute right-3 top-3 text-neutral-400 hover:text-white cursor-pointer"
                  >
                    {showPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {pinError && (
                  <p className="text-xs text-red-400 font-mono flex items-center gap-1.5 pt-1">
                    <XCircle className="w-3.5 h-3.5" />
                    {pinError}
                  </p>
                )}
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setStage('IDLE')}
                  className="px-4 py-2.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-neutral-300 text-xs font-bold transition-colors cursor-pointer"
                >
                  Cancel &amp; Abort
                </button>
                <button
                  type="submit"
                  disabled={!pinInput2}
                  className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer ${
                    pinInput2
                      ? 'bg-red-600 hover:bg-red-500 text-white shadow-xl shadow-red-950 animate-pulse'
                      : 'bg-neutral-800 text-neutral-500 border border-neutral-700 cursor-not-allowed'
                  }`}
                >
                  <PowerOff className="w-4 h-4" />
                  <span>Execute Decommission</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
