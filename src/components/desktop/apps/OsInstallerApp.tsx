// jb7572_2026-08-26: SecureCurtain Core Architecture - Graphical Live USB OS Installer & Hardware Pre-Flight Wizard
import React, { useState, useEffect } from 'react';
import { useDesktop } from '../../../context/DesktopContext';
import { 
  ShieldCheck, 
  Cpu, 
  HardDrive, 
  MemoryStick, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  ArrowRight, 
  ArrowLeft, 
  Play, 
  Check, 
  Lock, 
  Terminal, 
  RefreshCw, 
  Sparkles, 
  Laptop, 
  Layers, 
  ShieldAlert, 
  Download, 
  Sliders, 
  FileCheck, 
  HelpCircle,
  FolderLock,
  Zap,
  Radio,
  Eye,
  EyeOff,
  Key,
  KeyRound,
  User,
  UserCheck,
  Shield,
  Briefcase,
  Fingerprint,
  AtSign,
  AlertCircle,
  Monitor,
  Wifi,
  Server,
  Code
} from 'lucide-react';
import { OSPersonality } from '../../../types/desktop';
import { userManagementService } from '../../../services/userManagementService';
import { adminAuthService } from '../../../services/adminAuthService';

interface HardwareProbe {
  id: string;
  name: string;
  category: 'RAM' | 'CPU' | 'TPM' | 'FIRMWARE' | 'DISK' | 'GPU' | 'NET' | 'DRIVERS';
  requiredSpec: string;
  detectedSpec: string;
  status: 'PASS' | 'WARN' | 'FAIL';
  details: string;
  icon: any;
}

interface TargetDrive {
  id: string;
  device: string;
  model: string;
  sizeGb: number;
  type: 'NVMe SSD' | 'SATA SSD' | 'Virtual QEMU Disk';
  existingOs?: string;
  isRecommended?: boolean;
}

type InstallMode = 'clean-golden' | 'dual-boot' | 'custom';

export interface OsInstallerAppProps {
  isOobeMode?: boolean;
  onOobeComplete?: () => void;
  onSkipToLogin?: () => void;
}

export const OsInstallerApp: React.FC<OsInstallerAppProps> = ({
  isOobeMode = false,
  onOobeComplete,
  onSkipToLogin
}) => {
  const { addNotification, setPersonality, personality } = useDesktop();

  // Wizard Step Navigation: 1 (Hardware Check), 2 (Target & Partitioning), 3 (User & Subsystems), 4 (Installing), 5 (Finished)
  const [currentStep, setCurrentStep] = useState<number>(1);

  // ==========================================
  // STEP 1: HARDWARE PRE-FLIGHT VERIFICATION
  // ==========================================
  const [ramSimulationGb, setRamSimulationGb] = useState<number>(32);
  const [cpuSimulationGen, setCpuSimulationGen] = useState<'x86-64-v3-modern' | 'x86-64-v1-legacy'>('x86-64-v3-modern');
  const [tpmSimulationState, setTpmSimulationState] = useState<'tpm2-ready' | 'tpm-missing'>('tpm2-ready');
  const [isProbingHardware, setIsProbingHardware] = useState(false);

  const getHardwareProbes = (): HardwareProbe[] => [
    {
      id: 'probe-ram',
      name: 'Physical RAM Allocation',
      category: 'RAM',
      requiredSpec: '≥ 16.0 GB (16,384 MB)',
      detectedSpec: `${ramSimulationGb}.0 GB (${ramSimulationGb * 1024} MB DDR5)`,
      status: ramSimulationGb >= 16 ? 'PASS' : 'FAIL',
      details: ramSimulationGb >= 16 
        ? 'Satisfies Ring 0 memory map barrier. Sufficient headroom for isolated Ring 3 subsystem sandboxes.'
        : 'CRITICAL: Microkernel bootloader halts if physical RAM is below 16GB. Upgrade physical RAM before proceeding.',
      icon: MemoryStick
    },
    {
      id: 'probe-cpu',
      name: 'CPU Instruction Architecture',
      category: 'CPU',
      requiredSpec: 'x86-64-v3 (AVX2, FMA3, BMI2, SMEP/SMAP)',
      detectedSpec: cpuSimulationGen === 'x86-64-v3-modern' 
        ? 'Intel Core i9-14900K / AMD Ryzen 9 (x86-64-v3 Compliant)' 
        : 'Legacy x86-64-v1 (Missing AVX2/BMI2 & SMEP security flags)',
      status: cpuSimulationGen === 'x86-64-v3-modern' ? 'PASS' : 'FAIL',
      details: cpuSimulationGen === 'x86-64-v3-modern'
        ? 'Passed all Ring 0 supervisor instruction audits. Hardware Supervisor Mode Execution Prevention enabled.'
        : 'CRITICAL: CPU is older than the microarchitecture generational baseline. Ring 0 hardware mitigations unavailable.',
      icon: Cpu
    },
    {
      id: 'probe-tpm',
      name: 'TPM 2.0 & Cryptographic PCR-7',
      category: 'TPM',
      requiredSpec: 'TPM 2.0 Cryptoprocessor Active',
      detectedSpec: tpmSimulationState === 'tpm2-ready' ? 'Discrete TPM 2.0 Module (PCR 0/2/7 Sealed)' : 'No Hardware TPM Detected',
      status: tpmSimulationState === 'tpm2-ready' ? 'PASS' : 'WARN',
      details: tpmSimulationState === 'tpm2-ready'
        ? 'Golden recovery partition and bootloader hashes will be sealed with hardware TPM keys.'
        : 'WARNING: Hardware tamper sealing unavailable. System will fall back to software HMAC authentication.',
      icon: ShieldCheck
    },
    {
      id: 'probe-firmware',
      name: 'UEFI 64-Bit Firmware & ESP',
      category: 'FIRMWARE',
      requiredSpec: 'UEFI v2.8+ 64-bit (GPT Partitioning)',
      detectedSpec: 'UEFI 64-bit Mode with GOP Graphics Driver',
      status: 'PASS',
      details: 'GRUB 2.12 Multiboot2 chainloader and EFI System Partition (ESP) ready for deployment.',
      icon: Laptop
    },
    {
      id: 'probe-disk',
      name: 'Primary Storage Controller',
      category: 'DISK',
      requiredSpec: 'High-speed NVMe PCIe 3.0 / PCIe 4.0 / PCIe 5.0 / SATA (≥ 128 GB)',
      detectedSpec: 'Samsung 970 EVO Plus / 990 PRO NVMe (/dev/nvme0n1)',
      status: 'PASS',
      details: '[Native Ring 0]: Bound to sys/kernel/src/drivers/nvme.c. Direct PCIe DMA queues provide ultra-responsive microkernel I/O.',
      icon: HardDrive
    },
    {
      id: 'probe-gpu',
      name: 'GPU & Display Acceleration',
      category: 'GPU',
      requiredSpec: 'UEFI GOP Linear Framebuffer (1080p/1440p/4K) + DRM/KMS',
      detectedSpec: 'Discrete GPU (NVIDIA RTX / AMD Radeon / Intel Arc) & UEFI GOP Linear FB',
      status: 'PASS',
      details: '[Hybrid Tier]: Native UEFI GOP provides immediate unaccelerated 4K/60Hz display. Ring 3 Linux Driver Server (LDS) handles DRM/KMS & Vulkan hardware acceleration.',
      icon: Monitor
    },
    {
      id: 'probe-net',
      name: 'Network & Wireless Controllers',
      category: 'NET',
      requiredSpec: 'PCIe Gigabit/Multi-Gigabit Ethernet or 802.11ax/be Wi-Fi',
      detectedSpec: 'Intel I225-V 2.5GbE (Native e1000) & Intel Wi-Fi 7 BE200 / Realtek RTL8125',
      status: 'PASS',
      details: '[Dual Architecture]: Intel NIC uses native Ring 0 DMA (sys/kernel/src/drivers/net/e1000.c). Wi-Fi 7 and Realtek NICs use the Linux Driver Server.',
      icon: Wifi
    },
    {
      id: 'probe-drivers',
      name: 'Linux Driver Server (LDS Hardware Compatibility)',
      category: 'DRIVERS',
      requiredSpec: 'Dynamic PCI/USB Device ID Matching & Linux Kernel Modprobe',
      detectedSpec: 'Linux Driver Server Subsystem 6.10.10 (DDE User-Space Sandbox)',
      status: 'PASS',
      details: '[Auto-Matching]: Scans PCI Vendor/Device IDs during install. Native drivers claim storage and display; all other peripherals auto-bind through the Linux driver tree.',
      icon: Server
    }
  ];

  const probes = getHardwareProbes();
  const hasHardwareFailure = probes.some(p => p.status === 'FAIL');

  const handleReRunProbes = () => {
    setIsProbingHardware(true);
    setTimeout(() => {
      setIsProbingHardware(false);
      addNotification({
        title: 'Hardware Audit Refreshed',
        message: 'Pre-flight check completed across physical RAM, CPUID, and TPM sensors.',
        type: 'info',
        appId: 'os-installer'
      });
    }, 800);
  };

  // ==========================================
  // STEP 2: TARGET DRIVE & PARTITIONING
  // ==========================================
  const [drives] = useState<TargetDrive[]>([
    {
      id: 'drv-nvme0',
      device: '/dev/nvme0n1',
      model: 'Samsung 970 EVO Plus 1TB (NVMe PCIe 3.0 x4 - 3,500 MB/s)',
      sizeGb: 1000,
      type: 'NVMe SSD',
      isRecommended: true
    },
    {
      id: 'drv-nvme1',
      device: '/dev/nvme1n1',
      model: 'Samsung 990 PRO 2TB (NVMe PCIe 4.0 x4 - 7,450 MB/s)',
      sizeGb: 2000,
      type: 'NVMe SSD'
    },
    {
      id: 'drv-sata1',
      device: '/dev/sda',
      model: 'Crucial MX500 SATA 500GB SSD (SATA III 6Gbps - 560 MB/s)',
      sizeGb: 500,
      type: 'SATA SSD'
    }
  ]);

  const [selectedDriveId, setSelectedDriveId] = useState<string>('drv-nvme0');
  const [installMode, setInstallMode] = useState<InstallMode>('clean-golden');
  const [enableLuksEncryption, setEnableLuksEncryption] = useState<boolean>(true);
  const [encryptionPassphrase, setEncryptionPassphrase] = useState<string>('secure-curtain-2026');

  // =================================================================
  // STEP 3: USER ACCOUNT, NAME, TITLE, PASSWORD & SUDO/SO PIN CONFIG
  // =================================================================
  const [username, setUsername] = useState('admin');
  const [fullName, setFullName] = useState('System Administrator');
  const [title, setTitle] = useState('Chief Information Security Officer & Root Admin');
  const [email, setEmail] = useState('admin@securecurtain.local');
  const [hostname, setHostname] = useState('securecurtain-workstation');
  const [defaultShell, setDefaultShell] = useState('/bin/zsh');

  // Password & Confirmation
  const [password, setPassword] = useState('SecureCurtain#2026!');
  const [confirmPassword, setConfirmPassword] = useState('SecureCurtain#2026!');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Sudo / Security Officer (SO) Elevation PIN (Alphanumeric with Special Characters)
  const [pin, setPin] = useState('SC#7572');
  const [confirmPin, setConfirmPin] = useState('SC#7572');
  const [showPin, setShowPin] = useState(false);
  const [showConfirmPin, setShowConfirmPin] = useState(false);

  const [selectedPersonality, setSelectedPersonality] = useState<OSPersonality>('hybrid');

  const [enabledSubsystems, setEnabledSubsystems] = useState({
    posix: true,
    win32: true,
    virtioGpu: true,
    virtioNet: true,
    watchdogRecycle: true,
    goldenRecovery: true
  });

  // Strict Password Rules
  const passRules = {
    minLength: password.length >= 10,
    hasUpper: /[A-Z]/.test(password),
    hasLower: /[a-z]/.test(password),
    hasNumber: /[0-9]/.test(password),
    hasSpecial: /[!@#$%^&*()_+\-=\[\]{}|;:,.<>?~`'"]/.test(password),
    matchesConfirm: password.length > 0 && password === confirmPassword
  };

  const isPasswordValid = 
    passRules.minLength && 
    passRules.hasUpper && 
    passRules.hasLower && 
    passRules.hasNumber && 
    passRules.hasSpecial && 
    passRules.matchesConfirm;

  // Password Strength Calculation (0 - 100)
  const calculatePasswordScore = () => {
    let score = 0;
    if (password.length >= 10) score += 20;
    if (password.length >= 14) score += 15;
    if (passRules.hasUpper) score += 15;
    if (passRules.hasLower) score += 15;
    if (passRules.hasNumber) score += 15;
    if (passRules.hasSpecial) score += 20;
    return Math.min(score, 100);
  };

  const passwordScore = calculatePasswordScore();
  const getPasswordStrengthLabel = () => {
    if (passwordScore < 50) return { label: 'Weak (Fails Security Policy)', color: 'text-red-400 bg-red-950/60 border-red-500/50' };
    if (passwordScore < 80) return { label: 'Moderate', color: 'text-amber-400 bg-amber-950/60 border-amber-500/50' };
    if (passwordScore < 95) return { label: 'Strong (Policy Compliant)', color: 'text-cyan-400 bg-cyan-950/60 border-cyan-500/50' };
    return { label: 'Cryptographically Armored (Enterprise Baseline)', color: 'text-emerald-400 bg-emerald-950/60 border-emerald-500/50' };
  };

  // Sudo / SO PIN Rules (Alphanumeric with Special Characters)
  const pinRules = {
    validLength: pin.length >= 4 && pin.length <= 12,
    hasAlphaNum: /[a-zA-Z0-9]/.test(pin),
    hasSpecial: /[!@#$%^&*()_+\-=\[\]{}|;:,.<>?~`'"]/.test(pin),
    matchesConfirm: pin.length > 0 && pin === confirmPin
  };

  const isPinValid = pinRules.validLength && pinRules.hasAlphaNum && pinRules.hasSpecial && pinRules.matchesConfirm;

  // Step 3 Overall Validity
  const isStep3Valid = 
    fullName.trim().length > 0 && 
    title.trim().length > 0 && 
    username.trim().length >= 2 && 
    isPasswordValid && 
    isPinValid;

  // Utilities to generate secure random credentials
  const handleGenerateSecurePassword = () => {
    const charsUpper = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
    const charsLower = 'abcdefghijkmnopqrstuvwxyz';
    const charsNums = '23456789';
    const charsSpec = '!@#$%^&*_-+=';
    
    let generated = '';
    generated += charsUpper[Math.floor(Math.random() * charsUpper.length)];
    generated += charsLower[Math.floor(Math.random() * charsLower.length)];
    generated += charsNums[Math.floor(Math.random() * charsNums.length)];
    generated += charsSpec[Math.floor(Math.random() * charsSpec.length)];
    
    const allChars = charsUpper + charsLower + charsNums + charsSpec;
    for (let i = 0; i < 12; i++) {
      generated += allChars[Math.floor(Math.random() * allChars.length)];
    }
    
    setPassword(generated);
    setConfirmPassword(generated);
    addNotification({
      title: 'Cryptographic Password Generated',
      message: 'Generated a 16-character high-entropy password meeting all enterprise requirements.',
      type: 'success',
      appId: 'os-installer'
    });
  };

  const handleGenerateSecurePin = () => {
    const charsLettersUpper = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
    const charsLettersLower = 'abcdefghijkmnopqrstuvwxyz';
    const charsNumbers = '23456789';
    const charsSymbols = '!@#$%&*_-+=';
    
    let newPin = '';
    newPin += charsLettersUpper[Math.floor(Math.random() * charsLettersUpper.length)];
    newPin += charsLettersLower[Math.floor(Math.random() * charsLettersLower.length)];
    newPin += charsNumbers[Math.floor(Math.random() * charsNumbers.length)];
    newPin += charsSymbols[Math.floor(Math.random() * charsSymbols.length)];
    
    const pool = charsLettersUpper + charsLettersLower + charsNumbers + charsSymbols;
    for (let i = 0; i < 4; i++) {
      newPin += pool[Math.floor(Math.random() * pool.length)];
    }
    
    setPin(newPin);
    setConfirmPin(newPin);
    addNotification({
      title: 'Alphanumeric Air-Gap Sudo/SO PIN Generated',
      message: `Generated an 8-character high-assurance Alphanumeric + Special Sudo / SO Elevation PIN (${newPin}).`,
      type: 'info',
      appId: 'os-installer'
    });
  };

  // ==========================================
  // STEP 4: LIVE INSTALLATION ENGINE
  // ==========================================
  const [installProgress, setInstallProgress] = useState(0);
  const [installStageTitle, setInstallStageTitle] = useState('Preparing Disk Layout...');
  const [installLogs, setInstallLogs] = useState<string[]>([]);
  const [isInstalling, setIsInstalling] = useState(false);
  const [installFinished, setInstallFinished] = useState(false);

  const handleStartInstallation = () => {
    setCurrentStep(4);
    setIsInstalling(true);
    setInstallProgress(2);
    setInstallStageTitle('Stage 1: Partitioning Disk & Formatting Filesystems');
    setInstallLogs([
      '[*] Initializing SecureCurtain OS Bare-Metal Deployment Engine...',
      `[*] Target Disk: ${selectedDriveId === 'drv-nvme0' ? '/dev/nvme0n1' : '/dev/sda'} (GPT Table)`
    ]);

    // Persist Administrator and SO PIN directly to the OS database immediately
    userManagementService.provisionPrimaryAdminUser({
      username: username.toLowerCase().trim(),
      fullName: fullName.trim(),
      title: title.trim(),
      email: email.trim(),
      pin: pin.trim(),
      password: password,
      shell: defaultShell,
      role: 'ROOT_ADMIN'
    });

    const installSteps = [
      {
        progress: 14,
        title: 'Stage 1: Creating GPT Partition Table & EFI Bootloader ESP',
        log: '[parted] Creating /dev/nvme0n1p1 (1GB FAT32 -> /boot/efi)... Initialized EFI System Partition.'
      },
      {
        progress: 28,
        title: 'Stage 2: Provisioning Protected Read-Only Golden Image Partition',
        log: '[recovery] Creating /dev/nvme0n1p6 (32GB Btrfs -> /recovery)... Writing immutable OS golden snapshot with hardware RO flags.'
      },
      {
        progress: 46,
        title: 'Stage 3: Extracting Ring 0 Microkernel & Ring 3 Subsystems',
        log: '[deploy] Unpacking securecurtain_ring0.bin, POSIX translation server, and Win32 NT layer to /sys (64GB Btrfs).'
      },
      {
        progress: 58,
        title: 'Stage 4: Hardware Discovery & Linux Driver Server Auto-Binding',
        log: '[hw_detect] Scanning PCI Bus 0-255: NVMe (Native ring0 bound), SATA (Native AHCI bound), GPU (LDS DRM bound), Wi-Fi (LDS iwlwifi bound). Generated /etc/modprobe.d/securecurtain-drivers.conf.'
      },
      {
        progress: 70,
        title: 'Stage 5: Configuring User Space (/home) with LUKS2 Encryption',
        log: `[luks] Formatting /dev/nvme0n1p3 with Argon2id encryption for user "${username}"... Mounted at /home.`
      },
      {
        progress: 82,
        title: 'Stage 6: Provisioning Root/Admin Credentials, SAM Database & Sudo/SO PIN',
        log: `[auth] Saving Administrator "${fullName}" (${title}) to OS: PAM /etc/shadow updated with Argon2id hash. Registered ${pin.length}-character Alphanumeric+Special Air-Gap Sudo/SO PIN (${pin}) for Ring 0 escalation.`
      },
      {
        progress: 92,
        title: 'Stage 7: Installing GRUB 2.12 Multiboot2 & TPM 2.0 PCR-7 Sealing',
        log: '[grub] Generating /boot/efi/EFI/BOOT/grub.cfg with 16GB RAM barrier and hardware tamper audit hooks.'
      },
      {
        progress: 100,
        title: 'Stage 8: System Installation & Integrity Certification Complete',
        log: `[✓] INSTALLATION SUCCESSFUL: SecureCurtain OS is fully installed! Root Admin "${username}" is active and saved to OS.`
      }
    ];

    installSteps.forEach((step, idx) => {
      setTimeout(() => {
        setInstallProgress(step.progress);
        setInstallStageTitle(step.title);
        setInstallLogs(prev => [...prev, step.log]);

        if (idx === installSteps.length - 1) {
          setIsInstalling(false);
          setInstallFinished(true);
          setCurrentStep(5);
          setPersonality(selectedPersonality);

          // Persist newly commissioned Root Admin into userManagementService
          const adminUser = userManagementService.getUsers().find(u => u.id === 'usr_admin');
          if (adminUser) {
            userManagementService.updateUser('usr_admin', {
              username: username.trim() || 'admin',
              fullName: fullName.trim() || 'System Administrator',
              title: title.trim() || 'Chief Information Security Officer & Root Admin',
              email: email.trim() || 'admin@securecurtain.local',
              password: password || 'SecureCurtain#2026!',
              pin: pin || 'SC#7572'
            });
          }

          // Sync into adminAuthService
          adminAuthService.setAdminProfile({
            name: fullName.trim() || 'System Administrator',
            role: title.trim() || 'Root / Chief Forensic Architect',
            email: email.trim() || 'admin@securecurtain.local',
            loginPassword: password || 'SecureCurtain#2026!',
            elevatedPin: pin || 'SC#7572'
          });

          if (typeof window !== 'undefined') {
            localStorage.setItem('securecurtain_oobe_completed', 'true');
          }

          addNotification({
            title: 'SecureCurtain OS Installed & User Saved',
            message: `Root Administrator "${fullName}" (${title}) successfully saved with active Sudo/SO PIN.`,
            type: 'success',
            appId: 'os-installer'
          });
        }
      }, (idx + 1) * 850);
    });
  };

  const handleDownloadProof = () => {
    const text = `================================================================================
SECURECURTAIN OS - PRODUCTION INSTALLATION & SECURITY CERTIFICATE
Date: ${new Date().toISOString()} | Target Hostname: ${hostname}
================================================================================
HARDWARE PRE-FLIGHT BENCHMARKS:
- Physical RAM: ${ramSimulationGb} GB (Passed ≥ 16GB Ring 0 Memory Barrier)
- CPU Instruction Set: ${cpuSimulationGen} (Passed x86-64-v3 Baseline)
- TPM 2.0 Security: Sealed PCR-7 Hardware Signatures
- Boot Mode: UEFI 64-Bit with GRUB 2.12 Multiboot2

STORAGE & PARTITION MAPPING:
1. /dev/nvme0n1p1 [FAT32] -> /boot/efi (1.0 GB ESP)
2. /dev/nvme0n1p2 [Btrfs] -> /sys (64.0 GB Microkernel Root)
3. /dev/nvme0n1p6 [Btrfs] -> /recovery (32.0 GB IMMUTABLE READ-ONLY GOLDEN IMAGE)
4. /dev/nvme0n1p4 [Swap]  -> /swap (16.0 GB)
5. /dev/nvme0n1p3 [LUKS2] -> /home (Remainder GB Argon2id Encrypted)

ROOT ADMINISTRATOR & SECURITY CREDENTIALS (SAVED TO OS):
- Full Name: ${fullName}
- Title: ${title}
- Username: ${username} (UID: 1000, GID: 1000)
- Email / Contact: ${email}
- Default Shell: ${defaultShell}
- Group Memberships: wheel, sudo, secops, diskops, adm
- Password Policy: STRICT ENTERPRISE BASELINE SATISFIED (Argon2id Hash Sealed)
- Sudo / SO Elevation PIN: ACTIVE (${pin.length}-Character Alphanumeric + Special Air-Gap PIN Configured)
- Local SAM & PAM /etc/shadow Status: SYNCHRONIZED AND PERSISTED

DESKTOP SUBSYSTEMS & RUNTIME:
- Default Desktop Personality: ${selectedPersonality}
- Ring 3 POSIX Linux Layer: Active
- Ring 3 Win32 NT Subsystem: Active
- Self-Healing Watchdog: Active (1000Hz Supervisor)
================================================================================`;

    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `SecureCurtain_Install_Certificate_${Date.now()}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDownloadSourceManifest = () => {
    const manifest = {
      project: "SecureCurtain OS Bare-Metal Kernel & Toolchain",
      author: "System Administrator",
      version: "1.0.0-PROD",
      targetArchitecture: "x86_64 (Freestanding / Long Mode)",
      kernelEntry: "0xFFFFFFFF80000000",
      pillars: {
        bootstrapping: [
          "sys/kernel/arch/x86_64/boot.asm (Multiboot2 + Long Mode)",
          "sys/kernel/arch/x86_64/linker.ld (Higher-half ELF64)",
          "sys/boot/uefi/bootx64.c (UEFI GOP PE32+ Loader)"
        ],
        core: [
          "sys/kernel/src/mm/pmm.c (Physical Memory Bitmap Allocator)",
          "sys/kernel/src/mm/vmm.c (4-level PML4 Paging & #PF Handler)",
          "sys/kernel/src/mm/heap.c (kmalloc/kfree Slab Allocator)",
          "sys/kernel/src/core/idt.c (256 Interrupt Gates & ISR Stubs)",
          "sys/kernel/src/core/tss.c (TSS Stack Switching IST1/IST2)",
          "sys/kernel/src/core/apic.c (LAPIC/IOAPIC & Timers)",
          "sys/kernel/src/core/smp.c (SMP Multi-Core Bringup & IPIs)",
          "sys/kernel/src/core/syscall.c (x86_64 Syscall ABI IA32_LSTAR)"
        ],
        drivers: [
          "sys/kernel/src/drivers/pci.c (PCIe ECAM & 0xCF8/0xCFC)",
          "sys/kernel/src/drivers/nvme.c (NVMe Admin/IO Queues & DMA)",
          "sys/kernel/src/drivers/ahci.c (SATA AHCI HBA Controller)",
          "sys/kernel/src/drivers/xhci.c (USB 3.0 Host Controller Interface)",
          "sys/kernel/src/drivers/ps2.c (Intel 8042 PS/2 Keyboard/Mouse)",
          "sys/kernel/src/drivers/net/e1000.c (Intel Gigabit e1000 PCIe NIC)",
          "sys/kernel/src/linux/ (Linux Driver Server Subsystem)",
          "sys/kernel/src/security/tpm2.c (TPM 2.0 TIS MMIO & PCR-7 Sealing)"
        ],
        toolchain: [
          "Makefile (Kernel & ISO Build System)",
          "scripts/build_kernel.sh (Automated Compilation Harness)",
          "scripts/fetch_system_dependencies.py (lwIP, mbedTLS, Kernel Source)",
          "scripts/Dockerfile.builder (Self-Contained Hermetic Build Container)"
        ]
      },
      compileInstructions: [
        "1. sudo apt-get install -y gcc-x86-64-linux-gnu nasm xorriso grub-pc-bin grub-efi-amd64-bin qemu-system-x86 ovmf",
        "2. make all",
        "3. make iso",
        "4. qemu-system-x86_64 -cdrom SecureCurtain-MultiTool-LiveUSB-x86_64.iso -m 4G -smp 4 -enable-kvm"
      ]
    };
    const element = document.createElement('a');
    const file = new Blob([JSON.stringify(manifest, null, 2)], { type: 'application/json' });
    element.href = URL.createObjectURL(file);
    element.download = 'SecureCurtain-OS-Source-Manifest.json';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  return (
    <div className="h-full flex flex-col bg-[#07090e] text-white select-text overflow-y-auto font-sans">
      {/* OOBE Commissioning Header Ribbon */}
      {isOobeMode && (
        <div className="bg-gradient-to-r from-purple-950/90 via-indigo-950/90 to-black px-6 py-3 border-b border-purple-500/40 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2.5 text-xs">
            <span className="px-2.5 py-0.5 rounded-full bg-purple-900/90 text-purple-200 border border-purple-400/50 font-mono font-bold">
              FIRST-BOOT OOBE
            </span>
            <span className="text-[#cbd5e1] font-medium">
              SecureCurtain OS Commissioning & Cryptographic Enclave Provisioning
            </span>
          </div>
          {onSkipToLogin && (
            <button
              onClick={onSkipToLogin}
              className="text-xs text-[#cbd5e1] hover:text-white flex items-center gap-1.5 px-3 py-1 rounded-lg bg-white/10 hover:bg-white/15 border border-white/20 transition-all font-mono shadow-sm cursor-pointer"
            >
              <span>Skip to Login Screen</span>
              <ArrowRight className="w-3.5 h-3.5 text-purple-300" />
            </button>
          )}
        </div>
      )}

      {/* Top Header Banner */}
      <div className="p-4 border-b border-[#1b2234] bg-[#0c101c] flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-indigo-500/40 text-indigo-400 shadow-lg">
            <Laptop className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-white tracking-wide">
                SecureCurtain OS Live Installer
              </h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-indigo-950/80 text-indigo-300 border border-indigo-500/50 font-semibold flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-indigo-400" />
                Production Deployment Wizard
              </span>
            </div>
            <p className="text-xs text-[#7d90a8] mt-0.5">
              Automated hardware validation, 16GB RAM enforcement, and Protected Golden Partition deployment.
            </p>
          </div>
        </div>

        {/* Action Button & Step Indicator Badges */}
        <div className="flex items-center gap-3">
          <button
            onClick={handleDownloadSourceManifest}
            className="px-3 py-1.5 rounded-xl bg-[#132224] hover:bg-[#1a3336] text-emerald-300 border border-emerald-500/40 text-xs font-mono font-semibold flex items-center gap-1.5 transition-all shadow-sm"
            title="Export complete kernel C/ASM source manifest and compilation instructions"
          >
            <Code className="w-3.5 h-3.5" />
            <span>Export OS Sources</span>
          </button>

          <div className="flex items-center gap-1.5 text-xs font-mono">
            {[
              { num: 1, label: 'Hardware Check' },
              { num: 2, label: 'Partitioning' },
              { num: 3, label: 'Account & Subsystems' },
              { num: 4, label: 'Install' },
              { num: 5, label: 'Complete' },
            ].map(s => (
              <div 
                key={s.num}
                className={`px-2.5 py-1 rounded-xl border flex items-center gap-1.5 transition-all ${
                  currentStep === s.num
                    ? 'bg-indigo-600 text-white border-indigo-400 font-bold shadow-md shadow-indigo-600/40'
                    : currentStep > s.num
                    ? 'bg-emerald-950/60 text-emerald-300 border-emerald-600/40'
                    : 'bg-[#121826] text-[#64748b] border-[#1e273e]'
                }`}
              >
                <span className="text-[10px]">{currentStep > s.num ? '✓' : s.num}.</span>
                <span className="hidden sm:inline text-[11px]">{s.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Wizard Body Content */}
      <div className="p-5 flex-1 max-w-5xl mx-auto w-full space-y-5">
        {/* ========================================================= */}
        {/* STEP 1: HARDWARE PRE-FLIGHT VERIFICATION                  */}
        {/* ========================================================= */}
        {currentStep === 1 && (
          <div className="space-y-4 animate-in fade-in duration-200">
            {/* Top Overview Box */}
            <div className="p-5 rounded-3xl bg-[#0c101c] border border-[#1e273e] space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-indigo-400" />
                    Step 1: Hardware Pre-Flight & Requirement Audit
                  </h3>
                  <p className="text-xs text-[#8a9cb5] mt-1">
                    SecureCurtain OS enforces strict production hardware baselines (minimum 16GB RAM, x86-64-v3 microarchitecture, and UEFI 64-bit).
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleReRunProbes}
                    disabled={isProbingHardware}
                    className="px-3.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-mono text-[#cbd5e1] flex items-center gap-1.5 transition-all"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isProbingHardware ? 'animate-spin' : ''}`} />
                    <span>Re-Probe Sensors</span>
                  </button>
                </div>
              </div>

              {/* Interactive Simulation Controls to Test Different Hardware Configurations */}
              <div className="p-3.5 rounded-2xl bg-black/40 border border-white/5 flex flex-wrap items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2 text-indigo-300 font-mono">
                  <Sliders className="w-4 h-4" />
                  <span className="font-bold">Hardware Simulator:</span>
                </div>

                <div className="flex flex-wrap items-center gap-3 font-mono text-[11px]">
                  {/* RAM Selector */}
                  <div className="flex items-center gap-1.5">
                    <span className="text-[#64748b]">RAM:</span>
                    {[8, 16, 32, 64].map((gb) => (
                      <button
                        key={gb}
                        onClick={() => setRamSimulationGb(gb)}
                        className={`px-2 py-0.5 rounded-lg border transition-all ${
                          ramSimulationGb === gb
                            ? gb >= 16 
                              ? 'bg-indigo-600 border-indigo-400 text-white font-bold' 
                              : 'bg-red-600 border-red-400 text-white font-bold'
                            : 'bg-white/5 border-white/10 text-[#94a3b8] hover:bg-white/10'
                        }`}
                      >
                        {gb}GB
                      </button>
                    ))}
                  </div>

                  {/* CPU Gen */}
                  <div className="flex items-center gap-1.5">
                    <span className="text-[#64748b]">CPU:</span>
                    <button
                      onClick={() => setCpuSimulationGen('x86-64-v3-modern')}
                      className={`px-2 py-0.5 rounded-lg border transition-all ${
                        cpuSimulationGen === 'x86-64-v3-modern'
                          ? 'bg-indigo-600 border-indigo-400 text-white font-bold'
                          : 'bg-white/5 border-white/10 text-[#94a3b8]'
                      }`}
                    >
                      Modern v3 (AVX2)
                    </button>
                    <button
                      onClick={() => setCpuSimulationGen('x86-64-v1-legacy')}
                      className={`px-2 py-0.5 rounded-lg border transition-all ${
                        cpuSimulationGen === 'x86-64-v1-legacy'
                          ? 'bg-red-600 border-red-400 text-white font-bold'
                          : 'bg-white/5 border-white/10 text-[#94a3b8]'
                      }`}
                    >
                      Legacy v1
                    </button>
                  </div>

                  {/* TPM Toggle */}
                  <div className="flex items-center gap-1.5">
                    <span className="text-[#64748b]">TPM:</span>
                    <button
                      onClick={() => setTpmSimulationState(tpmSimulationState === 'tpm2-ready' ? 'tpm-missing' : 'tpm2-ready')}
                      className={`px-2 py-0.5 rounded-lg border transition-all ${
                        tpmSimulationState === 'tpm2-ready'
                          ? 'bg-indigo-600 border-indigo-400 text-white font-bold'
                          : 'bg-amber-600 border-amber-400 text-black font-bold'
                      }`}
                    >
                      {tpmSimulationState === 'tpm2-ready' ? 'TPM 2.0 (Active)' : 'Missing TPM'}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Probe Checklist */}
            <div className="space-y-2.5">
              {probes.map((probe) => {
                const Icon = probe.icon;
                return (
                  <div 
                    key={probe.id}
                    className={`p-4 rounded-2xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 transition-all ${
                      probe.status === 'PASS' 
                        ? 'bg-[#0d121f] border-[#1e283e]' 
                        : probe.status === 'WARN'
                        ? 'bg-amber-950/20 border-amber-500/40'
                        : 'bg-red-950/30 border-red-500/50'
                    }`}
                  >
                    <div className="flex items-start gap-3.5">
                      <div className={`p-2.5 rounded-xl shrink-0 ${
                        probe.status === 'PASS' 
                          ? 'bg-emerald-950 text-emerald-400 border border-emerald-500/40' 
                          : probe.status === 'WARN'
                          ? 'bg-amber-950 text-amber-400 border border-amber-500/40'
                          : 'bg-red-950 text-red-400 border border-red-500/50'
                      }`}>
                        <Icon className="w-5 h-5" />
                      </div>

                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-white">{probe.name}</span>
                          <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${
                            probe.status === 'PASS' 
                              ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/40' 
                              : probe.status === 'WARN'
                              ? 'bg-amber-950 text-amber-300 border border-amber-500/40'
                              : 'bg-red-950 text-red-300 border border-red-500/50'
                          }`}>
                            {probe.status === 'PASS' ? 'PASSED' : probe.status === 'WARN' ? 'WARNING' : 'FAILED'}
                          </span>
                        </div>
                        <div className="text-xs font-mono text-[#7d90a8] mt-0.5">
                          Detected: <span className="text-[#cbd5e1] font-semibold">{probe.detectedSpec}</span> (Required: {probe.requiredSpec})
                        </div>
                        <p className="text-xs text-[#94a3b8] mt-1 leading-relaxed">
                          {probe.details}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Bottom Action Footer */}
            <div className="p-4 rounded-2xl bg-[#0c101c] border border-[#1e273e] flex items-center justify-between">
              <div>
                {hasHardwareFailure ? (
                  <div className="text-xs text-red-400 font-bold flex items-center gap-1.5">
                    <XCircle className="w-4 h-4" />
                    <span>Cannot continue: Target machine does not meet 16GB RAM or CPU requirements.</span>
                  </div>
                ) : (
                  <div className="text-xs text-emerald-400 font-bold flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Hardware baseline verified. Ready to configure storage partitions.</span>
                  </div>
                )}
              </div>

              <button
                onClick={() => setCurrentStep(2)}
                disabled={hasHardwareFailure}
                className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 shadow-lg flex items-center gap-2 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <span>Next: Partitioning Strategy</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* STEP 2: TARGET DRIVE & PARTITIONING STRATEGY              */}
        {/* ========================================================= */}
        {currentStep === 2 && (
          <div className="space-y-4 animate-in fade-in duration-200">
            {/* Target Storage Device Selection */}
            <div className="p-5 rounded-3xl bg-[#0c101c] border border-[#1e273e] space-y-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <HardDrive className="w-5 h-5 text-indigo-400" />
                Step 2: Select Target Storage Disk
              </h3>
              <p className="text-xs text-[#8a9cb5]">
                Choose the physical NVMe or SSD drive where SecureCurtain OS and the Protected Golden Partition will be created.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                {drives.map((drv) => (
                  <div
                    key={drv.id}
                    onClick={() => setSelectedDriveId(drv.id)}
                    className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                      selectedDriveId === drv.id
                        ? 'bg-indigo-950/40 border-indigo-500 shadow-lg shadow-indigo-950/40 ring-1 ring-indigo-400'
                        : 'bg-white/5 border-white/10 hover:bg-white/10'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2.5">
                        <HardDrive className="w-5 h-5 text-indigo-400" />
                        <div>
                          <div className="text-sm font-bold text-white">{drv.model}</div>
                          <div className="text-xs font-mono text-[#7d90a8]">{drv.device} • {drv.sizeGb} GB ({drv.type})</div>
                        </div>
                      </div>
                      {drv.isRecommended && (
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-mono bg-indigo-600 text-white font-bold">
                          Recommended
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Partitioning Strategy Selection */}
            <div className="p-5 rounded-3xl bg-[#0c101c] border border-[#1e273e] space-y-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Layers className="w-5 h-5 text-purple-400" />
                Installation Mode & Golden Partition Strategy
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {[
                  {
                    id: 'clean-golden' as InstallMode,
                    title: 'Clean Install + Protected Golden Partition',
                    badge: 'Recommended',
                    badgeColor: 'bg-indigo-600 text-white',
                    desc: 'Wipes drive and creates the full 5-partition architecture including the 32GB Read-Only /recovery partition.'
                  },
                  {
                    id: 'dual-boot' as InstallMode,
                    title: 'Dual-Boot Alongside Windows 11 / Linux',
                    badge: 'Non-Destructive',
                    badgeColor: 'bg-emerald-700 text-white',
                    desc: 'Shrinks existing OS partitions safely and adds SecureCurtain GRUB 2.12 Multiboot2 entry alongside Windows Boot Manager.'
                  },
                  {
                    id: 'custom' as InstallMode,
                    title: 'Custom Advanced Partition Layout',
                    badge: 'Expert Sysadmin',
                    badgeColor: 'bg-purple-700 text-white',
                    desc: 'Manually specify mount points, custom Btrfs subvolumes, and external recovery partition mounts.'
                  }
                ].map((mode) => (
                  <div
                    key={mode.id}
                    onClick={() => setInstallMode(mode.id)}
                    className={`p-4 rounded-2xl border cursor-pointer transition-all flex flex-col justify-between ${
                      installMode === mode.id
                        ? 'bg-indigo-950/40 border-indigo-500 shadow-lg shadow-indigo-950/40 ring-1 ring-indigo-400'
                        : 'bg-white/5 border-white/10 hover:bg-white/10'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${mode.badgeColor}`}>
                          {mode.badge}
                        </span>
                        {installMode === mode.id && <Check className="w-4 h-4 text-indigo-400" />}
                      </div>
                      <div className="text-sm font-bold text-white leading-tight">{mode.title}</div>
                      <p className="text-xs text-[#8a9cb5] mt-1.5 leading-relaxed">{mode.desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Live Partition Layout Visualizer */}
              <div className="p-4 rounded-2xl bg-black/50 border border-white/10 space-y-3">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-[#cbd5e1] font-bold">Planned Partition Layout on {selectedDriveId === 'drv-nvme0' ? '/dev/nvme0n1' : '/dev/sda'}:</span>
                  <span className="text-pink-400 font-bold flex items-center gap-1">
                    <Lock className="w-3.5 h-3.5" /> Includes 32GB Protected Recovery Partition
                  </span>
                </div>

                {/* Visual Partition Bar */}
                <div className="w-full h-8 rounded-xl bg-black/60 border border-white/10 flex overflow-hidden text-[10px] font-mono text-center font-bold">
                  <div style={{ width: '5%' }} className="bg-sky-600 flex items-center justify-center text-white px-1 truncate" title="/boot/efi (1GB)">
                    ESP
                  </div>
                  <div style={{ width: '25%' }} className="bg-indigo-600 flex items-center justify-center text-white px-1 truncate" title="/sys Root (64GB)">
                    /sys (64GB)
                  </div>
                  <div style={{ width: '15%' }} className="bg-pink-600 flex items-center justify-center text-white px-1 truncate" title="/recovery (32GB Immutable Protected)">
                    🔒 /recovery (32GB)
                  </div>
                  <div style={{ width: '8%' }} className="bg-red-600 flex items-center justify-center text-white px-1 truncate" title="/swap (16GB)">
                    swap
                  </div>
                  <div style={{ width: '47%' }} className="bg-emerald-700 flex items-center justify-center text-white px-1 truncate" title="/home (Encrypted LUKS2 Remainder)">
                    /home (Encrypted User Data)
                  </div>
                </div>

                {/* Legend */}
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-[11px] font-mono pt-1">
                  <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-sky-500" /><span>/boot/efi (1GB)</span></div>
                  <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-indigo-500" /><span>/sys Root (64GB)</span></div>
                  <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-pink-500" /><span>/recovery (32GB RO)</span></div>
                  <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-red-500" /><span>/swap (16GB)</span></div>
                  <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /><span>/home (Encrypted)</span></div>
                </div>
              </div>

              {/* LUKS2 Encryption Toggle */}
              <div className="p-3.5 rounded-2xl bg-black/40 border border-white/5 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <FolderLock className="w-5 h-5 text-emerald-400" />
                  <div>
                    <div className="text-xs font-bold text-white">Full-Disk Encryption (LUKS2 + Argon2id)</div>
                    <div className="text-[11px] text-[#7d90a8]">Protects /home personal files at rest against physical extraction.</div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={enableLuksEncryption} 
                      onChange={(e) => setEnableLuksEncryption(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-[#1f293d] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                  </label>
                </div>
              </div>
            </div>

            {/* Step Navigation Footer */}
            <div className="p-4 rounded-2xl bg-[#0c101c] border border-[#1e273e] flex items-center justify-between">
              <button
                onClick={() => setCurrentStep(1)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-[#8a9cb5] hover:text-white bg-white/5 hover:bg-white/10 flex items-center gap-1.5 transition-all"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back</span>
              </button>

              <button
                onClick={() => setCurrentStep(3)}
                className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 shadow-lg flex items-center gap-2 transition-all"
              >
                <span>Next: User Account & Subsystems</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* ================================================================= */}
        {/* STEP 3: ROOT ADMIN IDENTITY, STRICT PASSWORD & SUDO/SO PIN SETUP */}
        {/* ================================================================= */}
        {currentStep === 3 && (
          <div className="space-y-4 animate-in fade-in duration-200">
            {/* Administrator Identity & Official Title */}
            <div className="p-5 rounded-3xl bg-[#0c101c] border border-[#1e273e] space-y-4 shadow-lg">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/5 pb-3">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <UserCheck className="w-5 h-5 text-indigo-400" />
                  <span>Step 3: Root Administrator & Identity Setup</span>
                </h3>
                <span className="text-[11px] font-mono px-2.5 py-0.5 rounded-full bg-indigo-950/60 text-indigo-300 border border-indigo-500/30">
                  UID 1000 • Primary SO Security Principal
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs font-mono">
                <div>
                  <label className="text-[#8a9cb5] block mb-1 font-semibold flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-indigo-400" />
                    Full Legal / Administrator Name
                  </label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => {
                      setFullName(e.target.value);
                      if (username === 'developer' || username === 'admin' || username === '') {
                        const sanitized = e.target.value.toLowerCase().replace(/[^a-z0-9]/g, '');
                        if (sanitized) setUsername(sanitized);
                      }
                    }}
                    placeholder="e.g. System Administrator"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-black/60 border border-white/10 text-white focus:outline-none focus:border-indigo-400 transition-colors"
                  />
                </div>

                <div>
                  <label className="text-[#8a9cb5] block mb-1 font-semibold flex items-center gap-1.5">
                    <Briefcase className="w-3.5 h-3.5 text-purple-400" />
                    Official Professional Title / Role
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Chief Information Security Officer & Root Admin"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-black/60 border border-white/10 text-white focus:outline-none focus:border-purple-400 transition-colors"
                  />
                  {/* Preset Title Suggestions */}
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {[
                      'CISO & Root Admin',
                      'Lead Systems Architect',
                      'Principal Kernel Engineer',
                      'SecOps Director'
                    ].map((presetTitle) => (
                      <button
                        key={presetTitle}
                        type="button"
                        onClick={() => setTitle(presetTitle)}
                        className="px-2 py-0.5 text-[10px] rounded-md bg-white/5 hover:bg-purple-900/40 text-[#94a3b8] hover:text-purple-300 border border-white/5 transition-all"
                      >
                        + {presetTitle}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-[#8a9cb5] block mb-1 font-semibold flex items-center gap-1.5">
                    <AtSign className="w-3.5 h-3.5 text-sky-400" />
                    POSIX Login Account Username
                  </label>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, ''))}
                    placeholder="e.g. admin"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-black/60 border border-white/10 text-white focus:outline-none focus:border-sky-400 transition-colors"
                  />
                  <span className="text-[10px] text-[#64748b] mt-1 block">
                    Assigned to <code className="text-sky-300">/home/{username || 'user'}</code> and wheel/sudoers
                  </span>
                </div>

                <div>
                  <label className="text-[#8a9cb5] block mb-1 font-semibold flex items-center gap-1.5">
                    <AtSign className="w-3.5 h-3.5 text-cyan-400" />
                    Work / Alert Notification Email
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="e.g. admin@securecurtain.local"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-black/60 border border-white/10 text-white focus:outline-none focus:border-cyan-400 transition-colors"
                  />
                </div>

                <div>
                  <label className="text-[#8a9cb5] block mb-1 font-semibold flex items-center gap-1.5">
                    <Laptop className="w-3.5 h-3.5 text-emerald-400" />
                    Computer Hostname
                  </label>
                  <input
                    type="text"
                    value={hostname}
                    onChange={(e) => setHostname(e.target.value)}
                    placeholder="securecurtain-workstation"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-black/60 border border-white/10 text-white focus:outline-none focus:border-emerald-400 transition-colors"
                  />
                </div>

                <div>
                  <label className="text-[#8a9cb5] block mb-1 font-semibold flex items-center gap-1.5">
                    <Terminal className="w-3.5 h-3.5 text-amber-400" />
                    Default Interactive POSIX Shell
                  </label>
                  <select
                    value={defaultShell}
                    onChange={(e) => setDefaultShell(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-black/60 border border-white/10 text-white focus:outline-none focus:border-amber-400 transition-colors"
                  >
                    <option value="/bin/zsh">/bin/zsh (Z-Shell with Oh-My-Zsh & Powerlevel10k)</option>
                    <option value="/bin/bash">/bin/bash (GNU Bourne-Again Shell 5.2)</option>
                    <option value="/bin/sh">/bin/sh (POSIX Minimal Shell)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Strict Enterprise Password Policy Section */}
            <div className="p-5 rounded-3xl bg-[#0c101c] border border-[#1e273e] space-y-4 shadow-lg">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/5 pb-3">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-emerald-400" />
                  <div>
                    <h3 className="text-base font-bold text-white">
                      Strict Master Password Policy
                    </h3>
                    <p className="text-[11px] text-[#8a9cb5]">
                      Hardware-enforced Argon2id encryption for user vault and disk root
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className={`text-[10px] font-mono font-bold px-2.5 py-1 rounded-lg border ${getPasswordStrengthLabel().color}`}>
                    {getPasswordStrengthLabel().label}
                  </span>
                  <button
                    type="button"
                    onClick={handleGenerateSecurePassword}
                    className="px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold text-indigo-300 hover:text-white bg-indigo-950/60 hover:bg-indigo-900 border border-indigo-500/40 flex items-center gap-1 transition-all"
                  >
                    <Sparkles className="w-3 h-3 text-indigo-400" />
                    Generate High-Entropy
                  </button>
                </div>
              </div>

              {/* Password Inputs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs font-mono">
                <div>
                  <label className="text-[#8a9cb5] block mb-1 font-semibold">Master Administrator Password</label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter strong password..."
                      className="w-full pl-3.5 pr-10 py-2.5 rounded-xl bg-black/60 border border-white/10 text-white focus:outline-none focus:border-emerald-400 transition-colors"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8a9cb5] hover:text-white"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="text-[#8a9cb5] block mb-1 font-semibold">Confirm Master Password</label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Re-enter password to verify..."
                      className={`w-full pl-3.5 pr-10 py-2.5 rounded-xl bg-black/60 border ${
                        confirmPassword.length > 0
                          ? passRules.matchesConfirm
                            ? 'border-emerald-500/50 text-white'
                            : 'border-red-500/50 text-red-200'
                          : 'border-white/10 text-white'
                      } focus:outline-none focus:border-emerald-400 transition-colors`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8a9cb5] hover:text-white"
                    >
                      {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Password Strength Meter Bar */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-[11px] font-mono text-[#8a9cb5]">
                  <span>Argon2id Cryptographic Strength Score:</span>
                  <span className="font-bold text-white">{passwordScore}%</span>
                </div>
                <div className="w-full h-2 rounded-full bg-black/70 border border-white/10 overflow-hidden">
                  <div
                    style={{ width: `${passwordScore}%` }}
                    className={`h-full transition-all duration-300 ${
                      passwordScore < 50
                        ? 'bg-red-500'
                        : passwordScore < 80
                        ? 'bg-amber-500'
                        : passwordScore < 95
                        ? 'bg-cyan-500'
                        : 'bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-400 shadow-md shadow-emerald-500/50'
                    }`}
                  />
                </div>
              </div>

              {/* Strict Requirement Validation Matrix */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-[11px] font-mono">
                {[
                  { valid: passRules.minLength, label: 'Minimum 10 Characters' },
                  { valid: passRules.hasUpper, label: 'Uppercase Letter (A-Z)' },
                  { valid: passRules.hasLower, label: 'Lowercase Letter (a-z)' },
                  { valid: passRules.hasNumber, label: 'Numeric Digit (0-9)' },
                  { valid: passRules.hasSpecial, label: 'Special Symbol (!@#$...)' },
                  { valid: passRules.matchesConfirm, label: 'Passwords Match' },
                ].map((req, idx) => (
                  <div
                    key={idx}
                    className={`px-3 py-1.5 rounded-xl border flex items-center gap-2 transition-all ${
                      req.valid
                        ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'
                        : 'bg-red-950/20 border-red-500/20 text-[#8a9cb5]'
                    }`}
                  >
                    {req.valid ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    ) : (
                      <XCircle className="w-3.5 h-3.5 text-red-400/60 shrink-0" />
                    )}
                    <span className="truncate">{req.label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Sudo / Security Officer (SO) Elevation PIN Section */}
            <div className="p-5 rounded-3xl bg-[#0c101c] border border-[#1e273e] space-y-4 shadow-lg">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/5 pb-3">
                <div className="flex items-center gap-2">
                  <KeyRound className="w-5 h-5 text-amber-400" />
                  <div>
                    <h3 className="text-base font-bold text-white">
                      Sudo & Security Officer (SO) Elevation PIN
                    </h3>
                    <p className="text-[11px] text-[#8a9cb5]">
                      Air-gapped PAM hardware PIN (alphanumeric with special characters) for Ring 0 privilege elevation & disk overrides
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleGenerateSecurePin}
                  className="px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold text-amber-300 hover:text-white bg-amber-950/60 hover:bg-amber-900 border border-amber-500/40 flex items-center gap-1 transition-all"
                >
                  <Sparkles className="w-3 h-3 text-amber-400" />
                  Generate Alphanumeric + Special PIN
                </button>
              </div>

              {/* PIN Inputs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs font-mono">
                <div>
                  <label className="text-[#8a9cb5] block mb-1 font-semibold flex items-center gap-1.5">
                    <Fingerprint className="w-3.5 h-3.5 text-amber-400" />
                    Sudo / SO Elevation PIN (4-12 Alphanumeric + Special)
                  </label>
                  <div className="relative">
                    <input
                      type={showPin ? 'text' : 'password'}
                      maxLength={12}
                      value={pin}
                      onChange={(e) => setPin(e.target.value.replace(/\s/g, ''))}
                      placeholder="e.g. SC#7572"
                      className="w-full pl-3.5 pr-10 py-2.5 rounded-xl bg-black/60 border border-white/10 text-white font-mono tracking-widest text-sm focus:outline-none focus:border-amber-400 transition-colors"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPin(!showPin)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8a9cb5] hover:text-white"
                    >
                      {showPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="text-[#8a9cb5] block mb-1 font-semibold flex items-center gap-1.5">
                    <Fingerprint className="w-3.5 h-3.5 text-amber-400" />
                    Confirm Sudo / SO PIN
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirmPin ? 'text' : 'password'}
                      maxLength={12}
                      value={confirmPin}
                      onChange={(e) => setConfirmPin(e.target.value.replace(/\s/g, ''))}
                      placeholder="Re-enter PIN to verify..."
                      className={`w-full pl-3.5 pr-10 py-2.5 rounded-xl bg-black/60 border ${
                        confirmPin.length > 0
                          ? pinRules.matchesConfirm
                            ? 'border-emerald-500/50 text-white'
                            : 'border-red-500/50 text-red-200'
                          : 'border-white/10 text-white'
                      } font-mono tracking-widest text-sm focus:outline-none focus:border-amber-400 transition-colors`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPin(!showConfirmPin)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8a9cb5] hover:text-white"
                    >
                      {showConfirmPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>

              {/* PIN Requirements Matrix */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] font-mono">
                {[
                  { valid: pinRules.validLength, label: '4 to 12 Characters' },
                  { valid: pinRules.hasAlphaNum, label: 'Alphanumeric (A-Z, 0-9)' },
                  { valid: pinRules.hasSpecial, label: 'Special Character (!@#$...)' },
                  { valid: pinRules.matchesConfirm, label: 'Elevation PINs Match' },
                ].map((req, idx) => (
                  <div
                    key={idx}
                    className={`px-3 py-1.5 rounded-xl border flex items-center gap-2 transition-all ${
                      req.valid
                        ? 'bg-amber-950/40 border-amber-500/40 text-amber-300'
                        : 'bg-red-950/20 border-red-500/20 text-[#8a9cb5]'
                    }`}
                  >
                    {req.valid ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    ) : (
                      <XCircle className="w-3.5 h-3.5 text-red-400/60 shrink-0" />
                    )}
                    <span className="truncate">{req.label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Desktop Personality Selector */}
            <div className="p-5 rounded-3xl bg-[#0c101c] border border-[#1e273e] space-y-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-purple-400" />
                Default Desktop Look & Personality Preset
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[
                  {
                    id: 'hybrid' as OSPersonality,
                    title: 'Modern Hybrid (Recommended)',
                    desc: 'Balances Linux multi-workspace tiling with Windows 11 Aero Snap flyouts and universal file drag-drop.'
                  },
                  {
                    id: 'linux' as OSPersonality,
                    title: 'Pure Linux Personality',
                    desc: 'Left-aligned circular window controls, native Bash/Zsh terminals, and POSIX path conventions.'
                  },
                  {
                    id: 'windows' as OSPersonality,
                    title: 'Windows 11 Mica Personality',
                    desc: 'Right-aligned window controls, PowerShell CLI aliases, and Win32 application launcher integration.'
                  }
                ].map((p) => (
                  <div
                    key={p.id}
                    onClick={() => setSelectedPersonality(p.id)}
                    className={`p-4 rounded-2xl border cursor-pointer transition-all flex flex-col justify-between ${
                      selectedPersonality === p.id
                        ? 'bg-purple-950/40 border-purple-500 shadow-lg shadow-purple-950/40 ring-1 ring-purple-400'
                        : 'bg-white/5 border-white/10 hover:bg-white/10'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-sm font-bold text-white">{p.title}</span>
                        {selectedPersonality === p.id && <Check className="w-4 h-4 text-purple-400" />}
                      </div>
                      <p className="text-xs text-[#8a9cb5] leading-relaxed">{p.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Ring 3 Subsystems Activation Checklist */}
            <div className="p-5 rounded-3xl bg-[#0c101c] border border-[#1e273e] space-y-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Zap className="w-5 h-5 text-amber-400" />
                Microkernel Subsystem Services & Capabilities
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs font-mono">
                {[
                  { key: 'posix', label: 'Ring 3 POSIX Linux Layer (ELF Binaries)', desc: 'Provides Linux syscall translation table' },
                  { key: 'win32', label: 'Ring 3 Win32 NT Subsystem (PE/EXE Binaries)', desc: 'Executes Windows NT binaries natively' },
                  { key: 'virtioGpu', label: 'Hardware-Accelerated DRM/KMS Compositor', desc: 'Zero-copy 60FPS surface rendering' },
                  { key: 'watchdogRecycle', label: 'Ring 0 Self-Healing Watchdog (1000Hz)', desc: 'Recycles crashed drivers in 1.4ms' },
                ].map(item => (
                  <div key={item.key} className="p-3 rounded-xl bg-black/40 border border-white/5 flex items-center justify-between">
                    <div>
                      <div className="font-bold text-white">{item.label}</div>
                      <div className="text-[10px] text-[#7d90a8]">{item.desc}</div>
                    </div>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-500/40">
                      ENABLED
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Step 3 Validation Alert if requirements unmet */}
            {!isStep3Valid && (
              <div className="p-4 rounded-2xl bg-amber-950/30 border border-amber-500/40 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                <div className="text-xs space-y-1">
                  <div className="font-bold text-amber-300">Identity & Security Requirements Incomplete:</div>
                  <ul className="list-disc list-inside text-[#94a3b8] space-y-0.5 font-mono text-[11px]">
                    {fullName.trim().length === 0 && <li>Full Name is required</li>}
                    {title.trim().length === 0 && <li>Official Professional Title is required</li>}
                    {username.trim().length < 2 && <li>POSIX Username must be at least 2 characters</li>}
                    {!isPasswordValid && <li>Master Password must meet all 6 strict policy requirements above</li>}
                    {!isPinValid && <li>Sudo/SO Elevation PIN must be 4-12 alphanumeric characters with a special symbol and confirmed</li>}
                  </ul>
                </div>
              </div>
            )}

            {/* Step Navigation Footer */}
            <div className="p-4 rounded-2xl bg-[#0c101c] border border-[#1e273e] flex items-center justify-between">
              <button
                onClick={() => setCurrentStep(2)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-[#8a9cb5] hover:text-white bg-white/5 hover:bg-white/10 flex items-center gap-1.5 transition-all"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back</span>
              </button>

              <button
                onClick={handleStartInstallation}
                disabled={!isStep3Valid}
                className={`px-6 py-2.5 rounded-xl text-xs font-bold text-white flex items-center gap-2 transition-all shadow-xl ${
                  isStep3Valid
                    ? 'bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-500 hover:to-pink-500 cursor-pointer shadow-indigo-500/25'
                    : 'bg-white/10 text-white/40 cursor-not-allowed border border-white/5'
                }`}
              >
                <Play className="w-4 h-4 fill-current" />
                <span>Begin Installation & Save to OS</span>
              </button>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* STEP 4: LIVE INSTALLATION PROGRESS & LOG STREAM           */}
        {/* ========================================================= */}
        {currentStep === 4 && (
          <div className="space-y-4 animate-in fade-in duration-200">
            <div className="p-6 rounded-3xl bg-gradient-to-br from-[#12182b] via-[#101424] to-[#181126] border border-indigo-500/40 space-y-4 shadow-2xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-2xl bg-indigo-500/20 border border-indigo-500/40 text-indigo-400">
                    <Laptop className="w-6 h-6 animate-pulse" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white">
                      Installing SecureCurtain OS to {selectedDriveId === 'drv-nvme0' ? '/dev/nvme0n1' : '/dev/sda'}
                    </h3>
                    <p className="text-xs text-[#8a9cb5] mt-0.5">
                      {installStageTitle}
                    </p>
                  </div>
                </div>

                <div className="text-right font-mono">
                  <div className="text-2xl font-bold text-indigo-300">{installProgress}%</div>
                  <div className="text-[10px] text-[#7d90a8]">Estimated remaining: 3s</div>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="w-full h-3 rounded-full bg-black/60 border border-white/10 overflow-hidden p-0.5">
                <div 
                  style={{ width: `${installProgress}%` }}
                  className="h-full rounded-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 transition-all duration-300 shadow-lg shadow-indigo-500/50"
                />
              </div>
            </div>

            {/* Live Terminal Output Console */}
            <div className="p-5 rounded-3xl bg-[#080a10] border border-[#1b2234] space-y-2 font-mono text-xs">
              <div className="flex items-center justify-between border-b border-white/10 pb-2">
                <span className="text-xs font-bold text-[#cbd5e1] uppercase flex items-center gap-2">
                  <Terminal className="w-4 h-4 text-indigo-400" />
                  Live Disk Deployment Console Output
                </span>
                <span className="text-[10px] text-emerald-400 flex items-center gap-1">
                  <Radio className="w-3 h-3 animate-spin" />
                  <span>NVMe DMA Active</span>
                </span>
              </div>

              <div className="p-3 bg-black/70 rounded-2xl border border-white/5 space-y-1.5 max-h-72 overflow-y-auto text-[11px]">
                {installLogs.map((log, idx) => (
                  <div 
                    key={idx}
                    className={
                      log.includes('SUCCESSFUL') 
                        ? 'text-emerald-400 font-bold bg-emerald-950/40 p-2 rounded-xl border border-emerald-500/30'
                        : log.includes('STAGE') || log.includes('Stage') || log.includes('[auth]')
                        ? 'text-indigo-300 font-bold'
                        : 'text-[#94a3b8]'
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
        {/* STEP 5: INSTALLATION COMPLETE & OS CREDENTIALS PROOF      */}
        {/* ========================================================= */}
        {currentStep === 5 && (
          <div className="space-y-4 animate-in fade-in duration-200">
            <div className="p-8 rounded-3xl bg-gradient-to-br from-emerald-950/40 via-[#0d1522] to-[#120f24] border border-emerald-500/50 text-center space-y-5 shadow-2xl">
              <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center mx-auto shadow-xl">
                <CheckCircle2 className="w-8 h-8" />
              </div>

              <div>
                <h3 className="text-xl font-bold text-white">
                  SecureCurtain OS is Ready for Production Use!
                </h3>
                <p className="text-xs text-[#94a3b8] mt-1 max-w-lg mx-auto">
                  The operating system, GRUB 2.12 Multiboot2 bootloader, Ring 0 microkernel, and the <strong>Protected Read-Only /recovery Golden Partition</strong> have been successfully installed on your hardware.
                </p>
              </div>

              {/* Saved Root Administrator Credentials Card */}
              <div className="p-5 rounded-2xl bg-black/60 border border-emerald-500/40 text-left space-y-3 max-w-2xl mx-auto">
                <div className="flex items-center justify-between border-b border-white/10 pb-2">
                  <div className="flex items-center gap-2">
                    <UserCheck className="w-4 h-4 text-emerald-400" />
                    <span className="text-xs font-bold text-white">Administrator Credentials Saved to OS Database</span>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-500/40 font-bold">
                    PERSISTED IN /etc/shadow
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-mono">
                  <div>
                    <span className="text-[#8a9cb5] text-[10px] block">Administrator & Official Title:</span>
                    <span className="text-white font-bold">{fullName}</span>
                    <span className="text-purple-300 text-[11px] block">{title}</span>
                  </div>

                  <div>
                    <span className="text-[#8a9cb5] text-[10px] block">POSIX Login Account:</span>
                    <span className="text-sky-300 font-bold">@{username} (UID 1000)</span>
                    <span className="text-[#7d90a8] text-[11px] block">Shell: {defaultShell}</span>
                  </div>

                  <div>
                    <span className="text-[#8a9cb5] text-[10px] block">Password Security Policy:</span>
                    <span className="text-emerald-400 font-bold flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5" /> Strict Argon2id Cryptographic Hash
                    </span>
                  </div>

                  <div>
                    <span className="text-[#8a9cb5] text-[10px] block">Sudo / SO Ring 0 Elevation PIN:</span>
                    <span className="text-amber-300 font-bold flex items-center gap-1">
                      <KeyRound className="w-3.5 h-3.5" /> Active ({pin.length}-Char Alphanumeric+Special PIN: •••••••)
                    </span>
                  </div>
                </div>

                <div className="text-[11px] text-[#94a3b8] bg-white/5 p-2.5 rounded-xl border border-white/5">
                  💡 <strong>Instant Authentication:</strong> You can now log into the Customizable Login Screen as <strong className="text-white">{fullName}</strong> with your configured password, and elevate to root in any terminal with your Sudo PIN.
                </div>
              </div>

              {/* Quick Hardware & Partition Badges */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-2xl mx-auto pt-1 text-xs font-mono">
                <div className="p-3 rounded-2xl bg-black/40 border border-white/5">
                  <div className="text-[#94a3b8] text-[10px]">Target Disk</div>
                  <div className="text-white font-bold">/dev/nvme0n1</div>
                </div>
                <div className="p-3 rounded-2xl bg-black/40 border border-white/5">
                  <div className="text-[#94a3b8] text-[10px]">Recovery Partition</div>
                  <div className="text-pink-400 font-bold flex items-center justify-center gap-1">
                    <Lock className="w-3 h-3" /> 32GB (RO)
                  </div>
                </div>
                <div className="p-3 rounded-2xl bg-black/40 border border-white/5">
                  <div className="text-[#94a3b8] text-[10px]">Primary Group</div>
                  <div className="text-indigo-300 font-bold">wheel / sudo</div>
                </div>
                <div className="p-3 rounded-2xl bg-black/40 border border-white/5">
                  <div className="text-[#94a3b8] text-[10px]">TPM Status</div>
                  <div className="text-emerald-400 font-bold">PCR-7 SEALED</div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center justify-center gap-3 pt-3">
                <button
                  onClick={handleDownloadProof}
                  className="px-4 py-2.5 rounded-xl text-xs font-semibold text-[#cbd5e1] hover:text-white bg-white/10 hover:bg-white/15 border border-white/15 flex items-center gap-2 transition-all shadow-md"
                >
                  <Download className="w-4 h-4" />
                  <span>Download Installation Certificate (.txt)</span>
                </button>

                <button
                  onClick={() => {
                    if (onOobeComplete) {
                      onOobeComplete();
                    } else {
                      addNotification({
                        title: 'Live Environment Active',
                        message: `Root Administrator "${fullName}" (${title}) is fully active. You can test Cockpit user management or the login screen.`,
                        type: 'info',
                        appId: 'os-installer'
                      });
                    }
                  }}
                  className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-emerald-600 to-indigo-600 hover:from-emerald-500 hover:to-indigo-500 shadow-xl flex items-center gap-2 transition-all cursor-pointer"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>{isOobeMode ? 'Commission System & Launch Desktop' : 'Continue in Live Desktop'}</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
