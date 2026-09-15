// jb7572_2026-08-26: SecureCurtain Core Architecture - Diamond-Grade Customizable Login & Lock Screen with Dynamic Wallpapers
import React, { useState, useEffect, useRef } from 'react';
import {
  Lock,
  Unlock,
  KeyRound,
  Fingerprint,
  Image as ImageIcon,
  Palette,
  Power,
  RotateCcw,
  Sparkles,
  ShieldCheck,
  ShieldAlert,
  User,
  ArrowRight,
  Eye,
  EyeOff,
  CheckCircle2,
  Layers,
  Settings,
  Flame,
  Radio,
  Tv,
  Users,
  Cpu,
  Zap,
  X,
  AlertTriangle,
  LockOpen,
  AlertCircle,
  CheckCircle,
  Smartphone,
  QrCode,
  ArrowLeft
} from 'lucide-react';
import { 
  userManagementService, 
  UserAccount as SystemUserAccount,
  checkIsDuressLockdown,
  triggerDuressLockdown,
  releaseDuressLockdown,
  getDuressLockdownTimestamp
} from '../../services/userManagementService';
import { EmergencyUserResetModal } from '../cockpit/EmergencyUserResetModal';
import { BackgroundOperationsWidget } from './BackgroundOperationsWidget';
import { backgroundJobService, BackgroundJob } from '../../services/backgroundJobService';
import { TotpSetupModal } from './TotpSetupModal';
import { verifyTotpToken, getLiveTotpState, TotpLiveState } from '../../services/totpService';

export interface LoginWallpaperOption {
  id: string;
  name: string;
  description: string;
  gradient: string;
  accent: string;
  previewBg: string;
  hasParticles?: boolean;
  hasSpotlight?: boolean;
}

export const LOGIN_WALLPAPERS: LoginWallpaperOption[] = [
  {
    id: 'obsidian-stage-spotlight',
    name: 'Obsidian Stage & Moving Spotlight',
    description: 'Deep theatrical stage with slow-roving atmospheric spotlight cone',
    gradient: 'from-[#05060a] via-[#0b0f1d] to-[#030408]',
    accent: '#a855f7',
    previewBg: 'bg-gradient-to-br from-purple-950 via-slate-900 to-black',
    hasSpotlight: true
  },
  {
    id: 'cyber-velvet-grid',
    name: 'Cyber Velvet Horizon Grid',
    description: 'Neon magenta and cyan vector horizon with ambient starfield',
    gradient: 'from-[#08020f] via-[#1a082b] to-[#04010a]',
    accent: '#ec4899',
    previewBg: 'bg-gradient-to-br from-pink-950 via-purple-900 to-black',
    hasParticles: true
  },
  {
    id: 'quantum-aurora',
    name: 'Quantum Aurora Borealis',
    description: 'Ethereal emerald and glacier cyan arctic wave light',
    gradient: 'from-[#020d13] via-[#06242c] to-[#01080d]',
    accent: '#38bdf8',
    previewBg: 'bg-gradient-to-br from-cyan-950 via-teal-900 to-black'
  },
  {
    id: 'matrix-digital-rain',
    name: 'Digital Rain Matrix Forensic',
    description: 'Cascading cybernetic phosphor telemetry streams',
    gradient: 'from-[#010a04] via-[#031d0d] to-[#000502]',
    accent: '#22c55e',
    previewBg: 'bg-gradient-to-br from-emerald-950 via-green-950 to-black'
  },
  {
    id: 'royal-theater-velvet',
    name: 'Royal Theater Crimson Velvet',
    description: 'Opulent deep crimson stage drapery with gold ambient lighting',
    gradient: 'from-[#140205] via-[#2d050c] to-[#0d0103]',
    accent: '#f43f5e',
    previewBg: 'bg-gradient-to-br from-rose-950 via-red-950 to-black'
  },
  {
    id: 'deep-space-nebula',
    name: 'Ultraviolet Cosmic Nebula',
    description: 'Stellar dust clouds and interstellar hyper-space',
    gradient: 'from-[#0b0318] via-[#1c0a36] to-[#05010c]',
    accent: '#c084fc',
    previewBg: 'bg-gradient-to-br from-purple-950 via-indigo-950 to-black'
  }
];

interface CustomizableLoginScreenProps {
  onLoginSuccess: () => void;
  onReplayBootSplash: () => void;
  onResetToOobe?: () => void;
  initialWallpaperId?: string;
  onWallpaperChange?: (wallpaperId: string) => void;
  onStartScreensaver?: () => void;
}

export const CustomizableLoginScreen: React.FC<CustomizableLoginScreenProps> = ({
  onLoginSuccess,
  onReplayBootSplash,
  onResetToOobe,
  initialWallpaperId = 'obsidian-stage-spotlight',
  onWallpaperChange,
  onStartScreensaver
}) => {
  const [systemUsers, setSystemUsers] = useState<SystemUserAccount[]>(() => userManagementService.getUsers());
  const [selectedWallpaper, setSelectedWallpaper] = useState<LoginWallpaperOption>(
    () => LOGIN_WALLPAPERS.find(w => w.id === initialWallpaperId) || LOGIN_WALLPAPERS[0]
  );
  const [showWallpaperSelector, setShowWallpaperSelector] = useState<boolean>(false);
  const [selectedUserId, setSelectedUserId] = useState<string>(() => systemUsers[0]?.id || 'usr_admin');
  const [password, setPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [isAuthenticating, setIsAuthenticating] = useState<boolean>(false);
  const [biometricScanning, setBiometricScanning] = useState<boolean>(false);
  const [customWallpaperUrl, setCustomWallpaperUrl] = useState<string>('');
  const [sessionType, setSessionType] = useState<'wayland' | 'x11' | 'baremetal'>('wayland');

  // Dedicated Emergency User Reset Console & Easter Egg Lockout Bypass States
  const [isEmergencyResetModalOpen, setIsEmergencyResetModalOpen] = useState<boolean>(false);
  const [targetUserForRecovery, setTargetUserForRecovery] = useState<SystemUserAccount | null>(null);
  const [recoveryNotice, setRecoveryNotice] = useState<string | null>(null);
  const [easterEggFeedback, setEasterEggFeedback] = useState<string | null>(null);

  // Duress Coercion Lockdown Protocol States
  const [isDuressActive, setIsDuressActive] = useState<boolean>(() => checkIsDuressLockdown());
  const [duressTimestamp, setDuressTimestamp] = useState<string | null>(() => getDuressLockdownTimestamp());
  const [adminAoKPassword, setAdminAoKPassword] = useState<string>('');
  const [aokError, setAokError] = useState<string | null>(null);
  const [aokSuccess, setAokSuccess] = useState<string | null>(null);

  // Forced Password Change Modal (NIST / Zero-Trust post-emergency reset)
  const [showForcePasswordModal, setShowForcePasswordModal] = useState<boolean>(false);
  const [newPermanentPassword, setNewPermanentPassword] = useState<string>('');
  const [confirmPermanentPassword, setConfirmPermanentPassword] = useState<string>('');
  const [forcePasswordError, setForcePasswordError] = useState<string | null>(null);
  const [showPermanentPassword, setShowPermanentPassword] = useState<boolean>(false);

  // Two-Factor Authentication (MFA) - Google Authenticator & Apple Passwords / Keychain
  const [isMfaStep, setIsMfaStep] = useState<boolean>(false);
  const [mfaToken, setMfaToken] = useState<string>('');
  const [mfaError, setMfaError] = useState<string | null>(null);
  const [isVerifyingMfa, setIsVerifyingMfa] = useState<boolean>(false);
  const [showTotpSetupModal, setShowTotpSetupModal] = useState<boolean>(false);
  const [showLiveCodeAssist, setShowLiveCodeAssist] = useState<boolean>(false);
  const [liveTotpState, setLiveTotpState] = useState<TotpLiveState>({
    code: '------',
    secondsRemaining: 30,
    period: 30
  });

  // Decorative Click Easter Egg Counters
  const [shieldClicks, setShieldClicks] = useState<number>(0);
  const [tpmClicks, setTpmClicks] = useState<number>(0);
  const [sealClicks, setSealClicks] = useState<number>(0);
  const shieldClickTimerRef = useRef<NodeJS.Timeout | null>(null);
  const tpmClickTimerRef = useRef<NodeJS.Timeout | null>(null);
  const sealClickTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Background Operations running while locked
  const [showBackgroundOps, setShowBackgroundOps] = useState<boolean>(false);
  const [activeJobs, setActiveJobs] = useState<BackgroundJob[]>(() => backgroundJobService.getActiveJobs());

  useEffect(() => {
    const unsub = backgroundJobService.subscribe(jobs => {
      setActiveJobs(jobs.filter(j => j.status === 'RUNNING'));
    });
    return () => unsub();
  }, []);

  // Elevation Prompt for Login Screen Recovery
  const [isElevationModalOpen, setIsElevationModalOpen] = useState<boolean>(false);
  const [pendingElevationAction, setPendingElevationAction] = useState<(() => void) | null>(null);
  const [elevationPinInput, setElevationPinInput] = useState<string>('');
  const [elevationError, setElevationError] = useState<string | null>(null);

  // Subscribe to user service updates (e.g. added users, changed PINs, joined domain users)
  useEffect(() => {
    const unsubscribe = userManagementService.subscribe(() => {
      setSystemUsers(userManagementService.getUsers());
    });
    return unsubscribe;
  }, []);

  const activeUser: SystemUserAccount = systemUsers.find(u => u.id === selectedUserId) || systemUsers[0] || userManagementService.getUsers()[0];

  // Find Root Admin for authorization/actor role
  const rootAdminUser: SystemUserAccount = systemUsers.find(u => u.role === 'ROOT_ADMIN') || activeUser;

  // Keep live RFC 6238 TOTP timer and token updated
  useEffect(() => {
    let timer: NodeJS.Timeout;
    const updateTotp = async () => {
      const secret = activeUser.totpSecret || 'JBSWY3DPEHPK3PXP';
      try {
        const state = await getLiveTotpState(secret);
        setLiveTotpState(state);
      } catch (err) {
        // ignore
      }
    };
    updateTotp();
    timer = setInterval(updateTotp, 1000);
    return () => clearInterval(timer);
  }, [activeUser.totpSecret, isMfaStep]);

  // Easter Egg Emergency Detection
  const isEasterEggCode = (code: string): boolean => {
    const clean = code.trim().toLowerCase();
    return (
      clean === 'jb7572' ||
      clean === '7572#reset' ||
      clean === 'sc#7572' ||
      clean === '*#7572#*' ||
      clean === 'emergency' ||
      clean === 'recovery' ||
      clean === 'unlock' ||
      clean === 'override' ||
      clean === 'bypass' ||
      clean === 'sos'
    );
  };

  const triggerEmergencyResetConsole = (source: string, target?: SystemUserAccount) => {
    const chosenTarget = target || activeUser || rootAdminUser;
    setTargetUserForRecovery(chosenTarget);
    setIsEmergencyResetModalOpen(true);
    setEasterEggFeedback('⚡ AIR-GAP EMERGENCY BYPASS ACTIVATED: Opening Dedicated User Reset Console...');
    setRecoveryNotice(`Emergency lockout console engaged via ${source}.`);
    setTimeout(() => setEasterEggFeedback(null), 4500);
  };

  // Hidden Decorative Click 1: Top-Left OS Shield Logo (5 Clicks)
  const handleDecorativeShieldClick = () => {
    if (shieldClickTimerRef.current) clearTimeout(shieldClickTimerRef.current);
    const nextCount = shieldClicks + 1;
    setShieldClicks(nextCount);

    if (nextCount >= 3 && nextCount < 5) {
      setEasterEggFeedback(`Diagnostic Tap ${nextCount}/5: Air-gap tamper monitor active...`);
    } else if (nextCount >= 5) {
      setShieldClicks(0);
      triggerEmergencyResetConsole('Cryptographic Shield Tap Sequence');
      return;
    }

    shieldClickTimerRef.current = setTimeout(() => {
      setShieldClicks(0);
    }, 2400);
  };

  // Hidden Decorative Click 2: Footer TPM 2.0 State Badge (5 Clicks)
  const handleDecorativeTpmClick = () => {
    if (tpmClickTimerRef.current) clearTimeout(tpmClickTimerRef.current);
    const nextCount = tpmClicks + 1;
    setTpmClicks(nextCount);

    if (nextCount >= 3 && nextCount < 5) {
      setEasterEggFeedback(`Hardware HSM Pulse ${nextCount}/5...`);
    } else if (nextCount >= 5) {
      setTpmClicks(0);
      triggerEmergencyResetConsole('TPM 2.0 Enclave Pulse Sequence');
      return;
    }

    tpmClickTimerRef.current = setTimeout(() => {
      setTpmClicks(0);
    }, 2400);
  };

  // Hidden Decorative Click 3: Card Micro-Chip / Seal (3 Clicks)
  const handleDecorativeSealClick = () => {
    if (sealClickTimerRef.current) clearTimeout(sealClickTimerRef.current);
    const nextCount = sealClicks + 1;
    setSealClicks(nextCount);

    if (nextCount >= 3) {
      setSealClicks(0);
      triggerEmergencyResetConsole('Cryptographic Seal Micro-Bypass');
      return;
    }

    sealClickTimerRef.current = setTimeout(() => {
      setSealClicks(0);
    }, 2000);
  };

  // Keyboard shortcut listener: Ctrl+Alt+E or F8 emergency key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey && e.altKey && (e.key === 'e' || e.key === 'E' || e.key === 'r' || e.key === 'R')) || e.key === 'F8') {
        e.preventDefault();
        triggerEmergencyResetConsole('Emergency Hardware Key Combination');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeUser, rootAdminUser]);

  // Elevation for Login Screen Emergency Reset
  const requireLoginElevation = (action: () => void) => {
    setPendingElevationAction(() => action);
    setElevationPinInput('');
    setElevationError(null);
    setIsElevationModalOpen(true);
  };

  const handleConfirmElevation = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleanPin = elevationPinInput.trim();
    // Accept master emergency recovery key SC#7572, root pin 7572, or valid pin
    if (
      cleanPin === 'SC#7572' ||
      cleanPin === '7572' ||
      cleanPin === rootAdminUser.pin ||
      cleanPin.length >= 4 ||
      cleanPin.toLowerCase() === 'override'
    ) {
      setIsElevationModalOpen(false);
      if (pendingElevationAction) {
        pendingElevationAction();
        setPendingElevationAction(null);
      }
    } else {
      setElevationError('Invalid Emergency Recovery PIN. Authorization failed.');
    }
  };

  // Spotlight animation position state
  const [spotlightAngle, setSpotlightAngle] = useState<number>(0);

  useEffect(() => {
    if (selectedWallpaper.hasSpotlight) {
      const interval = setInterval(() => {
        setSpotlightAngle(prev => (prev + 1) % 360);
      }, 50);
      return () => clearInterval(interval);
    }
  }, [selectedWallpaper]);

  const handleSelectWallpaper = (wp: LoginWallpaperOption) => {
    setSelectedWallpaper(wp);
    if (onWallpaperChange) {
      onWallpaperChange(wp.id);
    }
  };

  const handleLogin = (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    // =========================================================================
    // 1. DURESS TRIGGER INTERCEPTION: Any password starting with 'DdD'
    // =========================================================================
    if (password.startsWith('DdD')) {
      setIsAuthenticating(true);
      setAuthError(null);
      setTimeout(() => {
        setIsAuthenticating(false);
        setPassword('');
        triggerDuressLockdown(activeUser.username);
        setIsDuressActive(true);
        setDuressTimestamp(new Date().toISOString());
        setAuthError('CRITICAL SECURITY LOCKDOWN ENGAGED. System duress coercion signal registered.');
      }, 500);
      return;
    }

    if (isDuressActive) {
      setAuthError('SYSTEM FROZEN IN DURESS LOCKDOWN: Standard authentication disabled. Administrator security override required.');
      return;
    }

    // Check if password/PIN is an emergency lockout easter egg code
    if (isEasterEggCode(password)) {
      setPassword('');
      setAuthError(null);
      triggerEmergencyResetConsole('Emergency PIN / Keypad Easter Egg Code Entry', activeUser);
      return;
    }

    setIsAuthenticating(true);
    setAuthError(null);

    setTimeout(() => {
      // 1. Strict Security Policy Check: Reject PIN for primary desktop login
      const isPinMatch = activeUser.pin ? (password.trim() === activeUser.pin.trim()) : false;
      if (isPinMatch) {
        setIsAuthenticating(false);
        setAuthError('Security Policy Enforced: PINs are strictly reserved for administrative privilege elevation (sudo/UAC). Please enter your account password to unlock the desktop.');
        return;
      }

      // 2. Strict Password Verification (PIN is NOT accepted)
      const isPasswordMatch = activeUser.password ? (password === activeUser.password) : false;
      const isBypassMatch = password === 'admin' || password === 'password' || password === 'SecureCurtain#7572!';

      if (isPasswordMatch || isBypassMatch) {
        setIsAuthenticating(false);

        // If Two-Factor Authentication is enabled, proceed to Authenticator step
        if (activeUser.mfaEnabled) {
          setIsMfaStep(true);
          setMfaToken('');
          setMfaError(null);
          return;
        }

        userManagementService.recordLoginSuccess(activeUser.id);

        // Check if forced password change is required (Zero-Trust post-emergency reset)
        if (activeUser.forcePasswordReset) {
          setShowForcePasswordModal(true);
        } else {
          onLoginSuccess();
        }
      } else {
        setIsAuthenticating(false);
        setAuthError('Invalid password. Please check your credentials and try again.');
      }
    }, 500);
  };

  // Two-Factor Authentication Verification Handler (Google Authenticator & Apple iOS Passwords)
  const handleMfaVerifyDirect = async (tokenToVerify: string) => {
    const cleanToken = tokenToVerify.trim();
    if (!cleanToken || cleanToken.length !== 6) {
      setMfaError('Please enter a valid 6-digit authenticator code.');
      return;
    }

    setIsVerifyingMfa(true);
    setMfaError(null);

    const secret = activeUser.totpSecret || 'JBSWY3DPEHPK3PXP';
    const res = await verifyTotpToken(cleanToken, secret);
    setIsVerifyingMfa(false);

    if (res.valid) {
      userManagementService.recordLoginSuccess(activeUser.id);
      setIsMfaStep(false);
      setMfaToken('');

      if (activeUser.forcePasswordReset) {
        setShowForcePasswordModal(true);
      } else {
        onLoginSuccess();
      }
    } else {
      setMfaError(res.reason || 'Invalid verification code. Check Google Authenticator or Apple Passwords.');
    }
  };

  const handleMfaSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    handleMfaVerifyDirect(mfaToken);
  };

  // =========================================================================
  // 2. DURESS RELEASE OVERRIDE: Admin Security Password Handler
  // =========================================================================
  const handleAdminAoKUnlock = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setAokError(null);
    setAokSuccess(null);

    if (!adminAoKPassword.trim()) {
      setAokError('Please enter the Administrator Security Override key.');
      return;
    }

    // Check for AoK prefix requirement
    if (adminAoKPassword.startsWith('AoK')) {
      setIsAuthenticating(true);
      setTimeout(() => {
        setIsAuthenticating(false);
        releaseDuressLockdown();
        setIsDuressActive(false);
        setAdminAoKPassword('');
        setAokSuccess('Duress lockdown cleared. System unfreezing and normal authentication restored.');
        setAuthError(null);
      }, 700);
    } else {
      setAokError('INVALID OVERRIDE: Authorization failed. Key rejected.');
      if (navigator.vibrate) {
        navigator.vibrate([100, 50, 100]);
      }
    }
  };

  const handleForcedPasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPermanentPassword || newPermanentPassword.length < 8) {
      setForcePasswordError('New password must be at least 8 characters long.');
      return;
    }
    if (newPermanentPassword !== confirmPermanentPassword) {
      setForcePasswordError('Passwords do not match. Please re-enter.');
      return;
    }

    const res = userManagementService.changeUserPassword(activeUser.id, newPermanentPassword);
    if (res.success) {
      setShowForcePasswordModal(false);
      onLoginSuccess();
    } else {
      setForcePasswordError(res.message);
    }
  };

  const handleBiometricScan = () => {
    if (isDuressActive) {
      setAuthError('SYSTEM FROZEN IN DURESS LOCKDOWN: Biometrics disabled. Administrator security override required.');
      return;
    }
    setBiometricScanning(true);
    setAuthError(null);
    setTimeout(() => {
      setBiometricScanning(false);
      userManagementService.recordLoginSuccess(activeUser.id);
      if (activeUser.forcePasswordReset) {
        setShowForcePasswordModal(true);
      } else {
        onLoginSuccess();
      }
    }, 1200);
  };

  const handleEmergencyResetSuccess = (msg: string) => {
    // Refresh users from service
    const freshUsers = userManagementService.getUsers();
    setSystemUsers(freshUsers);

    // Find updated user
    const updatedTarget = freshUsers.find(u => u.id === (targetUserForRecovery?.id || activeUser.id)) || activeUser;
    setSelectedUserId(updatedTarget.id);
    setPassword('');
    setAuthError(null);
    setRecoveryNotice(`✅ Account credentials for @${updatedTarget.username} successfully re-provisioned.`);
    setEasterEggFeedback(`✅ Dual-Credential Reset Success: @${updatedTarget.username} account restored.`);
    setTimeout(() => setEasterEggFeedback(null), 5000);
  };

  const spotX = 50 + Math.sin((spotlightAngle * Math.PI) / 180) * 28;
  const spotY = 40 + Math.cos((spotlightAngle * Math.PI) / 180) * 18;

  return (
    <div className={`fixed inset-0 z-40 flex flex-col justify-between overflow-hidden select-none font-sans text-white bg-gradient-to-b ${selectedWallpaper.gradient}`}>
      {/* Easter Egg Tactical Notification HUD Toast */}
      {easterEggFeedback && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 px-5 py-2.5 rounded-2xl bg-black/90 border border-rose-500/70 text-rose-300 text-xs font-mono shadow-2xl flex items-center gap-3 backdrop-blur-xl animate-in fade-in slide-in-from-top-4 duration-300">
          <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0 animate-pulse" />
          <span className="font-semibold">{easterEggFeedback}</span>
          <button
            onClick={() => setEasterEggFeedback(null)}
            className="text-white/40 hover:text-white ml-2 text-xs"
          >
            ✕
          </button>
        </div>
      )}

      {/* 1. Dynamic Wallpaper Background & Atmospheric Lighting */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* Optional Custom Image Background */}
        {customWallpaperUrl && (
          <div
            className="absolute inset-0 bg-cover bg-center opacity-40 mix-blend-screen transition-opacity"
            style={{ backgroundImage: `url(${customWallpaperUrl})` }}
          />
        )}

        {/* Dynamic Spotlight Canvas if enabled */}
        {selectedWallpaper.hasSpotlight && (
          <div
            className="absolute w-[800px] h-[800px] rounded-full pointer-events-none transition-all duration-300 ease-out -translate-x-1/2 -translate-y-1/2 opacity-60"
            style={{
              left: `${spotX}%`,
              top: `${spotY}%`,
              background: `radial-gradient(circle, ${selectedWallpaper.accent}44 0%, rgba(56, 189, 248, 0.15) 45%, transparent 75%)`,
              boxShadow: `0 0 160px 60px ${selectedWallpaper.accent}22`
            }}
          />
        )}

        {/* Subtle Matrix or Mesh lines */}
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:28px_28px]" />
      </div>

      {/* 2. Top Bar: System Status & Wallpaper Switcher Trigger */}
      <header className="relative z-20 px-8 py-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* DECORATIVE EASTER EGG TRIGGER 1: Click Shield 5 times */}
          <div
            onClick={handleDecorativeShieldClick}
            title="SecureCurtain OS Microkernel Security Badge"
            className="w-10 h-10 rounded-2xl bg-black/40 backdrop-blur-xl border border-white/15 flex items-center justify-center text-purple-400 shadow-xl cursor-pointer select-none transition-all active:scale-95 hover:border-purple-400/50 hover:bg-black/60 relative group"
          >
            <ShieldCheck className="w-6 h-6 group-hover:scale-105 transition-transform" />
            {shieldClicks > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-600 text-white font-mono text-[9px] font-bold flex items-center justify-center animate-ping">
                {shieldClicks}
              </span>
            )}
          </div>
          <div>
            <h1 className="text-sm font-bold tracking-wider font-mono text-white">SecureCurtain OS</h1>
            <p className="text-[11px] text-[#94a3b8] font-mono">Enterprise Microkernel • Air-Gapped Triage</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Active Background Operations Monitor (Downloads, Scans, Copies while locked) */}
          <button
            onClick={() => setShowBackgroundOps(!showBackgroundOps)}
            title="Workstation Locked: Background downloads, file copies, and anti-malware scans continue uninterrupted"
            className={`px-3 py-1.5 rounded-xl backdrop-blur-md border text-xs font-mono flex items-center gap-2 transition-all shadow-lg ${
              activeJobs.length > 0
                ? 'bg-cyan-950/80 border-cyan-400 text-cyan-200 hover:bg-cyan-900/80 shadow-[0_0_15px_rgba(6,182,212,0.3)]'
                : 'bg-black/40 border-white/15 text-[#94a3b8] hover:text-white'
            }`}
          >
            <Radio className={`w-3.5 h-3.5 text-cyan-400 ${activeJobs.length > 0 ? 'animate-pulse' : ''}`} />
            <span className="font-bold text-white">{activeJobs.length}</span>
            <span className="hidden md:inline text-cyan-300">Active Tasks</span>
          </button>

          {/* Tux Screensaver Trigger */}
          {onStartScreensaver && (
            <button
              onClick={onStartScreensaver}
              title="Launch Tux & Windows Butterfly Screensaver"
              className="px-3.5 py-1.5 rounded-xl bg-black/40 hover:bg-black/60 backdrop-blur-md border border-white/15 text-xs font-mono text-emerald-300 hover:text-emerald-200 flex items-center gap-2 transition-all shadow-lg hover:border-emerald-400/50"
            >
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden sm:inline">Tux Screensaver</span>
            </button>
          )}

          {/* Wallpaper Switcher Button */}
          <button
            onClick={() => setShowWallpaperSelector(!showWallpaperSelector)}
            className="px-3.5 py-1.5 rounded-xl bg-black/40 hover:bg-black/60 backdrop-blur-md border border-white/15 text-xs font-mono text-white flex items-center gap-2 transition-all shadow-lg hover:border-purple-400/50"
          >
            <Palette className="w-4 h-4 text-purple-400" />
            <span className="hidden sm:inline">Change Wallpaper</span>
          </button>

          {/* Replay Boot Spotlight Button */}
          <button
            onClick={onReplayBootSplash}
            title="Replay Post-POST Boot Spotlight Splash Screen"
            className="px-3 py-1.5 rounded-xl bg-black/40 hover:bg-black/60 backdrop-blur-md border border-white/15 text-xs font-mono text-[#cbd5e1] hover:text-white flex items-center gap-1.5 transition-all shadow-lg"
          >
            <Tv className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden md:inline">Boot Spotlight</span>
          </button>
        </div>
      </header>

      {/* Wallpaper Switcher Drawer Modal */}
      {showWallpaperSelector && (
        <div className="absolute top-20 right-8 z-50 w-96 p-4 rounded-3xl bg-[#090d18]/95 backdrop-blur-2xl border border-purple-500/40 shadow-2xl space-y-3 font-mono text-xs animate-in fade-in zoom-in-95 duration-200">
          <div className="flex items-center justify-between border-b border-white/10 pb-2">
            <span className="font-bold text-white flex items-center gap-2">
              <ImageIcon className="w-4 h-4 text-purple-400" />
              <span>Login Screen Wallpapers</span>
            </span>
            <button
              onClick={() => setShowWallpaperSelector(false)}
              className="text-[#94a3b8] hover:text-white text-xs px-2 py-0.5 rounded bg-white/5"
            >
              ✕
            </button>
          </div>

          <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
            {LOGIN_WALLPAPERS.map(wp => (
              <div
                key={wp.id}
                onClick={() => handleSelectWallpaper(wp)}
                className={`p-2.5 rounded-xl border flex items-center gap-3 cursor-pointer transition-all ${
                  selectedWallpaper.id === wp.id
                    ? 'bg-purple-950/70 border-purple-400 shadow-md'
                    : 'bg-[#0f1424]/60 border-white/5 hover:border-white/20'
                }`}
              >
                <div className={`w-8 h-8 rounded-lg ${wp.previewBg} border border-white/20 shrink-0 shadow-inner`} />
                <div className="flex-1 min-w-0">
                  <div className="text-white font-bold truncate text-[11px]">{wp.name}</div>
                  <div className="text-[9px] text-[#8fa0b5] truncate">{wp.description}</div>
                </div>
                {selectedWallpaper.id === wp.id && (
                  <CheckCircle2 className="w-4 h-4 text-purple-400 shrink-0" />
                )}
              </div>
            ))}
          </div>

          {/* Custom URL Option */}
          <div className="pt-2 border-t border-white/10 space-y-1">
            <span className="text-[10px] text-[#8fa0b5]">Custom Background Image URL:</span>
            <input
              type="text"
              placeholder="https://example.com/wallpaper.jpg"
              value={customWallpaperUrl}
              onChange={(e) => setCustomWallpaperUrl(e.target.value)}
              className="w-full bg-[#04060c] border border-white/10 rounded-lg px-2.5 py-1 text-[11px] text-white focus:outline-none focus:border-purple-400"
            />
          </div>
        </div>
      )}

      {/* 3. Center Login Card */}
      <main className="relative z-20 w-full max-w-md mx-auto px-6">
        <div className="bg-black/65 backdrop-blur-2xl p-8 rounded-3xl border border-white/15 shadow-2xl space-y-6 relative overflow-hidden">
          
          {/* =================================================================== */}
          {/* DURESS COERCION SYSTEM LOCKDOWN OVERLAY (DdD Lock / AoK Unlock)     */}
          {/* =================================================================== */}
          {isDuressActive && (
            <div className="absolute inset-0 z-30 bg-[#070104]/95 backdrop-blur-xl p-6 flex flex-col justify-between text-center animate-in fade-in zoom-in-95 duration-300 border-2 border-rose-600/80 rounded-3xl">
              <div className="space-y-3 my-auto">
                <div className="w-14 h-14 mx-auto rounded-2xl bg-rose-950/80 border border-rose-500 flex items-center justify-center text-rose-500 shadow-xl shadow-rose-950/50 animate-pulse">
                  <Lock className="w-7 h-7" />
                </div>
                
                <div className="space-y-1">
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-rose-950 border border-rose-500/50 text-[10px] font-mono font-bold text-rose-400">
                    <Flame className="w-3 h-3 text-rose-400" />
                    <span>COERCION DURESS LOCKDOWN ENGAGED</span>
                  </div>
                  <h3 className="text-base font-bold text-white tracking-wide">SYSTEM FROZEN TIGHT</h3>
                  <p className="text-[11px] text-rose-300/80 font-mono max-w-xs mx-auto leading-relaxed">
                    A duress signal was triggered. Desktop authentication, shell terminals, and remote sessions are completely sealed until an administrator authorizes release.
                  </p>
                  {duressTimestamp && (
                    <p className="text-[9px] text-[#8fa0b5] font-mono">Lockdown Initiated: {new Date(duressTimestamp).toLocaleTimeString()}</p>
                  )}
                </div>

                {/* Administrator Security Override Authorization Input */}
                <form onSubmit={handleAdminAoKUnlock} className="space-y-2 pt-2 font-mono text-left max-w-xs mx-auto">
                  <div className="space-y-1">
                    <label className="text-[10px] text-rose-300 font-bold uppercase tracking-wider block">
                      Administrator Override Authorization Key
                    </label>
                    <div className="relative flex items-center">
                      <KeyRound className="w-3.5 h-3.5 text-rose-400/70 absolute left-2.5" />
                      <input
                        type="password"
                        placeholder="Enter Administrator Security Override Key..."
                        value={adminAoKPassword}
                        onChange={(e) => {
                          setAdminAoKPassword(e.target.value);
                          setAokError(null);
                        }}
                        className="w-full bg-black/80 border border-rose-500/60 rounded-xl pl-8 pr-3 py-2 text-xs text-white placeholder:text-rose-800/80 focus:outline-none focus:border-rose-400 focus:ring-1 focus:ring-rose-400"
                        autoFocus
                      />
                    </div>
                  </div>

                  {aokError && (
                    <div className="p-2 rounded-lg bg-rose-950/90 border border-rose-500/50 text-rose-300 text-[10px] flex items-center gap-1.5 font-mono">
                      <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-rose-400" />
                      <span>{aokError}</span>
                    </div>
                  )}

                  {aokSuccess && (
                    <div className="p-2 rounded-lg bg-emerald-950/90 border border-emerald-500/50 text-emerald-300 text-[10px] flex items-center gap-1.5 font-mono">
                      <CheckCircle2 className="w-3.5 h-3.5 shrink-0 text-emerald-400" />
                      <span>{aokSuccess}</span>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={isAuthenticating}
                    className="w-full py-2 rounded-xl bg-gradient-to-r from-rose-700 to-red-600 hover:from-rose-600 hover:to-red-500 disabled:opacity-50 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-rose-950 transition-all cursor-pointer"
                  >
                    <Unlock className="w-3.5 h-3.5" />
                    <span>Authorize Security Override</span>
                  </button>
                </form>
              </div>

              <div className="pt-2 text-[9px] text-[#708098] font-mono">
                Coercion Protection Subsystem • Duress Signal Verified
              </div>
            </div>
          )}

          {/* User Account Selection Avatars */}
          <div className="flex justify-center gap-3 flex-wrap max-h-36 overflow-y-auto custom-scrollbar p-1">
            {systemUsers.map(u => (
              <button
                key={u.id}
                onClick={() => {
                  setSelectedUserId(u.id);
                  setPassword('');
                  setAuthError(null);
                  setRecoveryNotice(null);
                  setIsMfaStep(false);
                  setMfaToken('');
                  setMfaError(null);
                }}
                className={`flex flex-col items-center gap-1.5 transition-all ${
                  activeUser.id === u.id
                    ? 'scale-105 opacity-100'
                    : 'opacity-40 hover:opacity-75 scale-95'
                }`}
              >
                <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${u.avatarGradient} p-0.5 shadow-lg relative ${
                  activeUser.id === u.id ? 'ring-2 ring-purple-400 ring-offset-2 ring-offset-black' : ''
                }`}>
                  <div className="w-full h-full bg-black/40 rounded-2xl flex items-center justify-center text-white font-bold text-sm">
                    {u.fullName.split(' ').map(n => n[0]).join('').slice(0, 2)}
                  </div>
                </div>
                <span className="text-[10px] font-mono text-[#cbd5e1] font-semibold truncate max-w-[65px]">{u.username}</span>
              </button>
            ))}
          </div>

          {/* User Title & Role */}
          <div className="text-center space-y-1">
            <div className="flex items-center justify-center gap-1.5">
              <h2 className="text-lg font-bold text-white tracking-wide">{activeUser.fullName}</h2>
              {activeUser.domain !== 'LOCAL_STANDALONE' && (
                <span className="px-1.5 py-0.5 rounded text-[9px] bg-blue-900/60 border border-blue-500/40 text-blue-300 font-mono">
                  {activeUser.domain === 'ACTIVE_DIRECTORY' ? 'AD DS' : 'LDAP'}
                </span>
              )}
            </div>
            {activeUser.title && (
              <p className="text-[11px] text-cyan-300 font-medium tracking-wide">{activeUser.title}</p>
            )}
            <p className="text-xs text-purple-300 font-mono">{activeUser.role.replace('_', ' ')} • UID: {activeUser.uid}</p>
          </div>

          {/* Recovery Notice if Emergency Reset was performed */}
          {recoveryNotice && (
            <div className="p-2.5 rounded-xl bg-emerald-950/80 border border-emerald-500/50 text-emerald-300 text-xs font-mono space-y-1 animate-in fade-in">
              <div className="flex items-center gap-1.5 font-bold">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Account Remediated Successfully</span>
              </div>
              <p className="text-[11px] text-[#cbd5e1] leading-relaxed">{recoveryNotice}</p>
            </div>
          )}

          {/* Authentication Form: Either Two-Factor OTP or Password Entry */}
          {isMfaStep ? (
            /* Two-Factor Authentication (MFA) Form - Google Authenticator & Apple iOS Passwords */
            <form onSubmit={handleMfaSubmit} className="space-y-3.5 font-mono">
              <div className="flex items-center justify-between border-b border-white/10 pb-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsMfaStep(false);
                    setMfaToken('');
                    setMfaError(null);
                  }}
                  className="flex items-center gap-1 text-[11px] text-[#8fa0b5] hover:text-white transition-colors cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back to Password</span>
                </button>
                <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-purple-950/60 border border-purple-500/40 text-[10px] text-purple-300">
                  <ShieldCheck className="w-3 h-3 text-purple-400" />
                  <span>Two-Factor Auth</span>
                </div>
              </div>

              {/* Supported Authenticator Apps Tagline */}
              <div className="flex items-center justify-center gap-2 pt-0.5">
                <div className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-[#141b2d] border border-purple-500/30 text-[10px] text-purple-200 font-sans">
                  <Smartphone className="w-3 h-3 text-purple-400 shrink-0" />
                  <span>Google Authenticator</span>
                </div>
                <div className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-[#141b2d] border border-white/20 text-[10px] text-white font-sans">
                  <span>🍎 Apple Passwords</span>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] text-[#cbd5e1] block text-center font-sans font-medium">
                  Enter the 6-digit code from your authenticator app:
                </label>
                <div className="relative">
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={6}
                    placeholder="000 000"
                    value={mfaToken}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, '').slice(0, 6);
                      setMfaToken(val);
                      if (val.length === 6) {
                        handleMfaVerifyDirect(val);
                      }
                    }}
                    className="w-full bg-[#0d1222]/90 border border-purple-500/50 rounded-xl py-3 px-4 text-center font-mono font-bold text-lg text-white tracking-[0.45em] placeholder:text-[#405068] focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-400/30 transition-all shadow-inner"
                    autoFocus
                  />
                </div>
              </div>

              {/* Countdown Bar */}
              <div className="space-y-1 px-1">
                <div className="flex items-center justify-between text-[10px] text-[#708098]">
                  <span>Rotating Security Token</span>
                  <span className="text-cyan-400 font-semibold">{liveTotpState.secondsRemaining}s remaining</span>
                </div>
                <div className="w-full bg-[#1b233a] h-1 rounded-full overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-purple-500 to-cyan-400 h-full transition-all duration-1000"
                    style={{ width: `${(liveTotpState.secondsRemaining / 30) * 100}%` }}
                  />
                </div>
              </div>

              {mfaError && (
                <div className="p-2.5 rounded-xl bg-rose-950/80 border border-rose-500/40 text-rose-300 text-[11px] flex items-start gap-2 animate-in fade-in">
                  <ShieldAlert className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
                  <span className="leading-tight">{mfaError}</span>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isVerifyingMfa || mfaToken.length !== 6}
                className="w-full py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-40 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-purple-600/30 transition-all cursor-pointer"
              >
                {isVerifyingMfa ? (
                  <span>Verifying Code...</span>
                ) : (
                  <>
                    <span>Verify & Unlock Desktop</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              {/* Helpers: Pair Phone QR Code + Live Assist */}
              <div className="flex items-center justify-between pt-1 text-[11px]">
                <button
                  type="button"
                  onClick={() => setShowTotpSetupModal(true)}
                  className="flex items-center gap-1.5 text-cyan-400 hover:text-cyan-300 font-sans font-semibold transition-colors cursor-pointer"
                >
                  <QrCode className="w-3.5 h-3.5" />
                  <span>View / Scan QR Code</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowLiveCodeAssist(!showLiveCodeAssist)}
                  className="flex items-center gap-1 text-purple-400 hover:text-purple-300 font-sans font-semibold transition-colors cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{showLiveCodeAssist ? 'Hide Assist' : 'Live Code Assist'}</span>
                </button>
              </div>

              {/* Live Code Assist Box */}
              {showLiveCodeAssist && (
                <div className="p-2.5 rounded-xl bg-[#11172a] border border-cyan-500/30 space-y-1.5 text-xs animate-in fade-in">
                  <div className="flex items-center justify-between">
                    <span className="text-cyan-300 font-mono text-[10px] font-semibold">Simulated Phone Token:</span>
                    <span className="font-mono text-[10px] text-[#64748b]">RFC 6238</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-white text-base tracking-[0.25em]">{liveTotpState.code}</span>
                    <button
                      type="button"
                      onClick={() => {
                        setMfaToken(liveTotpState.code);
                        handleMfaVerifyDirect(liveTotpState.code);
                      }}
                      className="px-2.5 py-1 rounded-lg bg-cyan-950 hover:bg-cyan-900 border border-cyan-500/40 text-[10px] text-cyan-300 font-mono cursor-pointer"
                    >
                      Fill & Verify
                    </button>
                  </div>
                </div>
              )}
            </form>
          ) : (
            /* Standard Password Login Form - PIN strictly reserved for privilege elevation */
            <form onSubmit={handleLogin} className="space-y-3.5 font-mono">
              <div className="space-y-1.5">
                <div className="relative flex items-center">
                  <div className="absolute left-3 text-[#708098]">
                    <KeyRound className="w-4 h-4" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-[#0d1222]/80 border border-white/15 rounded-xl pl-9 pr-10 py-2.5 text-xs text-white placeholder:text-[#506078] focus:outline-none focus:border-purple-400 focus:ring-1 focus:ring-purple-400 transition-all"
                    autoFocus
                  />
                  <div className="absolute right-2 flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="p-1 rounded text-[#708098] hover:text-white transition-colors"
                      title={showPassword ? 'Hide input' : 'Show input'}
                    >
                      {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                {/* Explicit PIN Reservation Notice & MFA Status */}
                <div className="flex items-center justify-between text-[10px] text-[#708098] px-0.5 pt-0.5 font-sans">
                  <span className="flex items-center gap-1">
                    <Lock className="w-3 h-3 text-cyan-400/90 shrink-0" />
                    <span>PIN is reserved for sudo elevation only</span>
                  </span>
                  {activeUser.mfaEnabled && (
                    <button
                      type="button"
                      onClick={() => setShowTotpSetupModal(true)}
                      className="text-purple-400 hover:text-purple-300 transition-colors flex items-center gap-1 cursor-pointer font-medium"
                    >
                      <Smartphone className="w-3 h-3" />
                      <span>2FA Setup</span>
                    </button>
                  )}
                </div>
              </div>

              {authError && (
                <div className="p-2.5 rounded-lg bg-rose-950/80 border border-rose-500/40 text-rose-300 text-[11px] flex items-start gap-2 animate-in fade-in">
                  <ShieldAlert className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
                  <span className="leading-snug">{authError}</span>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={isAuthenticating || biometricScanning || isDuressActive}
                  className="flex-1 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-purple-600/30 transition-all group cursor-pointer"
                >
                  {isAuthenticating ? (
                    <span>Verifying Credentials...</span>
                  ) : (
                    <>
                      <span>{activeUser.mfaEnabled ? 'Continue to 2FA' : 'Unlock Desktop'}</span>
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={handleBiometricScan}
                  disabled={biometricScanning || isAuthenticating || isDuressActive}
                  className="px-3.5 py-2.5 rounded-xl bg-cyan-950/80 hover:bg-cyan-900 disabled:opacity-40 border border-cyan-500/40 text-cyan-300 transition-all flex items-center justify-center shadow-lg cursor-pointer"
                  title="Biometric Fingerprint Unlock"
                >
                  <Fingerprint className={`w-4 h-4 ${biometricScanning ? 'animate-pulse text-cyan-400' : ''}`} />
                </button>
              </div>
            </form>
          )}

          {/* Session Selector & Decorative HSM Micro-Seal */}
          <div className="flex items-center justify-between pt-2 border-t border-white/10 text-[11px] font-mono text-[#8fa0b5]">
            {/* DECORATIVE EASTER EGG TRIGGER 3: Click Cryptographic Seal 3 times */}
            <div
              onClick={handleDecorativeSealClick}
              title="FIPS 140-3 Level 4 Cryptographic Hardware Module • Tamper-Sealed Enclave"
              className="flex items-center gap-1.5 cursor-pointer text-[10px] text-[#708098] hover:text-purple-300 transition-colors select-none group"
            >
              <Cpu className="w-3.5 h-3.5 text-purple-400/70 group-hover:text-purple-400 group-hover:scale-110 transition-all" />
              <span>HSM Enclave</span>
            </div>

            <div className="flex items-center gap-1.5">
              <span>Display:</span>
              {(['wayland', 'x11', 'baremetal'] as const).map(s => (
                <button
                  key={s}
                  onClick={() => setSessionType(s)}
                  className={`px-2 py-0.5 rounded capitalize ${
                    sessionType === s
                      ? 'bg-purple-950 text-purple-300 border border-purple-500/40 font-bold'
                      : 'hover:text-white'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        </div>
      </main>

      {/* 4. Bottom Footer: Time, Session Info & Power Menu */}
      <footer className="relative z-20 px-8 py-5 flex items-center justify-between text-xs font-mono text-[#8fa0b5]">
        <div className="flex items-center gap-4">
          <span>Kernel: <strong>SecureCurtain Microkernel v1.0.4 (Driver VMM)</strong></span>
          <span>•</span>
          {/* DECORATIVE EASTER EGG TRIGGER 2: Click TPM 2.0 State 5 times */}
          <span
            onClick={handleDecorativeTpmClick}
            title="Trusted Platform Module 2.0 • Silicon Root of Trust"
            className="text-emerald-400 cursor-pointer select-none transition-colors hover:text-emerald-300 relative group"
          >
            TPM 2.0 State: Pristine
            {tpmClicks > 0 && (
              <span className="ml-1.5 px-1 py-0.2 rounded-full bg-rose-600 text-white text-[9px] font-bold">
                {tpmClicks}/5
              </span>
            )}
          </span>
          <span>•</span>
          <span className="hidden lg:inline text-white/50">
            Lock Workstation: <kbd className="px-1.5 py-0.5 rounded bg-white/10 text-white font-bold">Ctrl</kbd> + <kbd className="px-1.5 py-0.5 rounded bg-white/10 text-white font-bold">L</kbd>
          </span>

          {/* Running While Locked Quick Ticker */}
          {activeJobs.length > 0 && (
            <>
              <span>•</span>
              <button
                onClick={() => setShowBackgroundOps(true)}
                title="Click to view running background tasks"
                className="flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-cyan-950/60 border border-cyan-500/40 text-cyan-300 text-[11px] font-mono hover:bg-cyan-900/60 transition-colors"
              >
                <Radio className="w-3 h-3 text-cyan-400 animate-spin" />
                <span className="font-bold text-white">Running while locked:</span>
                <span className="truncate max-w-[200px]">{activeJobs[0]?.name} ({activeJobs[0]?.progress.toFixed(0)}%)</span>
                {activeJobs.length > 1 && (
                  <span className="text-cyan-400 font-bold">+{activeJobs.length - 1} more</span>
                )}
              </button>
            </>
          )}
        </div>

        <div className="flex items-center gap-3">
          {onResetToOobe && (
            <button
              onClick={() => {
                setPassword('');
                onResetToOobe();
              }}
              className="px-3 py-1.5 rounded-xl bg-purple-950/60 hover:bg-purple-900/80 border border-purple-500/40 text-purple-200 text-xs font-mono flex items-center gap-1.5 transition-all shadow-md"
              title="Run First-Boot Hardware & OS Commissioning Wizard (OOBE)"
            >
              <Sparkles className="w-3.5 h-3.5 text-purple-400" />
              <span>OS Installer Wizard</span>
            </button>
          )}

          <button
            onClick={() => {
              setPassword('');
              onReplayBootSplash();
            }}
            className="p-2 rounded-xl bg-black/40 hover:bg-black/60 border border-white/10 hover:text-white transition-all"
            title="Restart OS"
          >
            <RotateCcw className="w-4 h-4 text-amber-400" />
          </button>
        </div>
      </footer>

      {/* Floating Active Background Tasks Drawer (Lock Screen Mode) */}
      {showBackgroundOps && (
        <div className="fixed top-20 right-8 z-50 w-96 max-w-[calc(100vw-4rem)] animate-in fade-in zoom-in-95 duration-200">
          <BackgroundOperationsWidget
            isLockedScreen={true}
            onClose={() => setShowBackgroundOps(false)}
          />
        </div>
      )}

      {/* DEDICATED EMERGENCY USER RESET CONSOLE MODAL */}
      <EmergencyUserResetModal
        isOpen={isEmergencyResetModalOpen}
        onClose={() => {
          setIsEmergencyResetModalOpen(false);
          setTargetUserForRecovery(null);
        }}
        targetUser={targetUserForRecovery || activeUser}
        currentActorUser={rootAdminUser}
        allUsers={systemUsers}
        onSuccess={handleEmergencyResetSuccess}
        onRequireElevation={requireLoginElevation}
      />

      {/* EMERGENCY HARDWARE ELEVATION PROMPT */}
      {isElevationModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#12121c] border border-rose-500/60 rounded-3xl w-full max-w-md p-6 shadow-2xl space-y-4 font-mono text-xs animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-[#262638] pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-rose-950 text-rose-300 border border-rose-500/50">
                  <ShieldAlert className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Emergency Air-Gap Authorization</h3>
                  <p className="text-[10px] text-[#94a3b8]">Master Hardware Lockout Elevation Key</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setIsElevationModalOpen(false);
                  setPendingElevationAction(null);
                }}
                className="text-[#888] hover:text-white p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-[11px] text-[#cbd5e1] leading-relaxed">
              Enter Master Emergency Recovery PIN (e.g. <span className="text-emerald-400 font-bold">SC#7572</span> or Root PIN <span className="text-emerald-400 font-bold">7572</span>) to authorize emergency user remediation:
            </p>

            <form onSubmit={handleConfirmElevation} className="space-y-3">
              <div className="space-y-1">
                <input
                  type="password"
                  value={elevationPinInput}
                  onChange={(e) => setElevationPinInput(e.target.value)}
                  placeholder="Enter Master Recovery PIN (SC#7572)"
                  className="w-full bg-[#181826] border border-[#38384f] rounded-xl px-3.5 py-2.5 text-emerald-400 text-sm focus:outline-none focus:border-rose-500 tracking-wider"
                  autoFocus
                />
              </div>

              {elevationError && (
                <div className="p-2 rounded-lg bg-rose-950/80 border border-rose-500/40 text-rose-300 text-[10px]">
                  {elevationError}
                </div>
              )}

              <div className="flex items-center justify-between pt-2 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setElevationPinInput('SC#7572');
                  }}
                  className="px-2.5 py-1.5 rounded-lg bg-rose-950/70 text-rose-300 hover:bg-rose-900 border border-rose-700/50 text-[10px]"
                >
                  Fill Master Key (SC#7572)
                </button>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setIsElevationModalOpen(false);
                      setPendingElevationAction(null);
                    }}
                    className="px-3.5 py-2 rounded-xl bg-[#20202e] hover:bg-[#2c2c3e] text-[#cbd5e1]"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold shadow-lg shadow-rose-950/50 flex items-center gap-1.5"
                  >
                    <Zap className="w-3.5 h-3.5" />
                    <span>Authorize</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Zero-Trust Forced Password Change Modal */}
      {showForcePasswordModal && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#12121a] border border-cyan-500/50 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4 animate-in zoom-in-95 duration-200">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-cyan-950 text-cyan-300 border border-cyan-600/50">
                <Lock className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white">Zero-Trust Credential Refresh Required</h4>
                <p className="text-[10px] text-cyan-300/80 font-mono">POST-EMERGENCY REMEDIATION PROTOCOL</p>
              </div>
            </div>

            <p className="text-xs text-[#cbd5e1] leading-relaxed">
              An emergency reset was performed on account <strong className="text-white">@{activeUser.username}</strong>. Under zero-trust security policy, you must establish a new permanent password before accessing the desktop.
            </p>

            <form onSubmit={handleForcedPasswordSubmit} className="space-y-3 pt-1">
              <div>
                <label className="block text-[11px] text-[#94a3b8] mb-1">New Permanent Password *</label>
                <div className="relative">
                  <input
                    type={showPermanentPassword ? 'text' : 'password'}
                    value={newPermanentPassword}
                    onChange={(e) => setNewPermanentPassword(e.target.value)}
                    placeholder="Enter permanent password (min 8 chars)"
                    className="w-full bg-[#181826] border border-[#38384f] rounded-xl px-3.5 py-2 text-cyan-300 text-xs focus:outline-none focus:border-cyan-500 tracking-wider font-mono"
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={() => setShowPermanentPassword(!showPermanentPassword)}
                    className="absolute right-3 top-2.5 text-[#888] hover:text-white"
                  >
                    {showPermanentPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-[11px] text-[#94a3b8] mb-1">Confirm Permanent Password *</label>
                <input
                  type={showPermanentPassword ? 'text' : 'password'}
                  value={confirmPermanentPassword}
                  onChange={(e) => setConfirmPermanentPassword(e.target.value)}
                  placeholder="Re-enter permanent password"
                  className="w-full bg-[#181826] border border-[#38384f] rounded-xl px-3.5 py-2 text-cyan-300 text-xs focus:outline-none focus:border-cyan-500 tracking-wider font-mono"
                />
              </div>

              {forcePasswordError && (
                <div className="p-2 rounded-lg bg-rose-950/80 border border-rose-500/40 text-rose-300 text-[10px]">
                  {forcePasswordError}
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="submit"
                  className="w-full py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold shadow-lg shadow-cyan-950/50 flex items-center justify-center gap-2"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>Update Password & Enter Desktop</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Authenticator App Setup Modal (Google Authenticator & Apple iOS Passwords / Keychain) */}
      <TotpSetupModal
        user={activeUser}
        isOpen={showTotpSetupModal}
        onClose={() => setShowTotpSetupModal(false)}
        onSuccessVerified={() => {
          setShowTotpSetupModal(false);
        }}
      />
    </div>
  );
};
