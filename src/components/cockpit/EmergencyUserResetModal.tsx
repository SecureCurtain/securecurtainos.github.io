// jb7572_2026-08-28: Emergency User Reset & Master Recovery Console Modal
import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  RotateCcw,
  KeyRound,
  Lock,
  Unlock,
  AlertTriangle,
  CheckCircle2,
  X,
  UserCheck,
  Zap,
  Activity,
  ShieldCheck,
  Eye,
  EyeOff,
  Sparkles,
  RefreshCw
} from 'lucide-react';
import {
  UserAccount,
  userManagementService
} from '../../services/userManagementService';
import { SecuritySanitizer, ThreatDetectionResult } from '../../utils/securitySanitizer';
import { SecurityThreatBadge } from './SecurityThreatBadge';

interface EmergencyUserResetModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetUser: UserAccount | null;
  currentActorUser: UserAccount;
  onSuccess: (msg: string) => void;
  onRequireElevation: (action: () => void) => void;
  allUsers?: UserAccount[];
}

export const EmergencyUserResetModal: React.FC<EmergencyUserResetModalProps> = ({
  isOpen,
  onClose,
  targetUser: initialTargetUser,
  currentActorUser,
  onSuccess,
  onRequireElevation,
  allUsers
}) => {
  const usersList = allUsers || userManagementService.getUsers();
  const [selectedTargetId, setSelectedTargetId] = useState<string>(initialTargetUser?.id || usersList[0]?.id || 'usr_admin');

  useEffect(() => {
    if (initialTargetUser) {
      setSelectedTargetId(initialTargetUser.id);
    }
  }, [initialTargetUser]);

  const targetUser = usersList.find(u => u.id === selectedTargetId) || initialTargetUser || usersList[0];

  const isSelfReset = targetUser ? targetUser.id === currentActorUser.id : false;
  const [unlockAccount, setUnlockAccount] = useState<boolean>(true);
  
  // Dual Credential Reset Options
  const [resetPassword, setResetPassword] = useState<boolean>(true);
  const [newPassword, setNewPassword] = useState<string>('SecureCurtain#7572!');
  const [showPassword, setShowPassword] = useState<boolean>(false);

  const [resetPin, setResetPin] = useState<boolean>(true);
  const [newPin, setNewPin] = useState<string>('SC#7572');
  const [showPin, setShowPin] = useState<boolean>(false);

  const [forcePasswordReset, setForcePasswordReset] = useState<boolean>(true);

  const [restoreAdminRole, setRestoreAdminRole] = useState<boolean>(true);
  const [resetFailedAttempts, setResetFailedAttempts] = useState<boolean>(true);
  const [emergencyReason, setEmergencyReason] = useState<string>(
    'Administrator self-lockout recovery & dual-credential restoration override'
  );
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  // Live Threat States
  const [passwordThreat, setPasswordThreat] = useState<ThreatDetectionResult | null>(null);
  const [pinThreat, setPinThreat] = useState<ThreatDetectionResult | null>(null);
  const [reasonThreat, setReasonThreat] = useState<ThreatDetectionResult | null>(null);

  // Synchronize target-specific defaults when targetUser changes
  useEffect(() => {
    if (targetUser) {
      const isSelf = targetUser.id === currentActorUser.id;
      setRestoreAdminRole(targetUser.role === 'ROOT_ADMIN' || targetUser.role === 'SECURITY_OPERATOR');
      setEmergencyReason(
        isSelf
          ? 'Administrator self-lockout recovery & dual-credential restoration override'
          : 'Emergency administrator remediation & dual-credential reset due to lockout/compromise'
      );
    }
  }, [targetUser, currentActorUser.id]);

  const handlePasswordChange = (val: string) => {
    setNewPassword(val);
    const threat = SecuritySanitizer.detectThreats(val, 'emergency_password');
    setPasswordThreat(!threat.isClean ? threat : null);
  };

  const handlePinChange = (val: string) => {
    setNewPin(val);
    const threat = SecuritySanitizer.detectThreats(val, 'emergency_pin');
    setPinThreat(!threat.isClean ? threat : null);
  };

  const handleReasonChange = (val: string) => {
    setEmergencyReason(val);
    const threat = SecuritySanitizer.detectThreats(val, 'emergency_reason');
    setReasonThreat(!threat.isClean ? threat : null);
  };

  const generateHighEntropyPassword = () => {
    const specials = ['!', '@', '#', '$', '%', '&', '*'];
    const randomSpecial = specials[Math.floor(Math.random() * specials.length)];
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    const pwd = `SC#${randomNum}${randomSpecial}AirGap`;
    setNewPassword(pwd);
    setPasswordThreat(null);
  };

  const generateNewPin = () => {
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    setNewPin(`SC#${randomNum}`);
    setPinThreat(null);
  };

  const syncBothCredentials = () => {
    const code = 'SC#7572';
    setNewPin(code);
    setNewPassword('SecureCurtain#7572!');
    setResetPin(true);
    setResetPassword(true);
    setPinThreat(null);
    setPasswordThreat(null);
  };

  const handleExecuteEmergencyReset = () => {
    if (!targetUser) return;

    // Check for critical active injection threats
    const threats = [
      resetPassword ? SecuritySanitizer.detectThreats(newPassword, 'emergency_password') : { isClean: true, threats: [] },
      resetPin ? SecuritySanitizer.detectThreats(newPin, 'emergency_pin') : { isClean: true, threats: [] },
      SecuritySanitizer.detectThreats(emergencyReason, 'emergency_reason')
    ].filter(t => !t.isClean);

    if (threats.length > 0) {
      const threatTypes = threats.flatMap(t => t.threats.map(th => th.type)).join(', ');
      userManagementService.recordSecurityThreat(
        currentActorUser.username,
        `EmergencyUserResetModal (@${targetUser.username})`,
        `Blocked attempt to inject payload in emergency reset: [${threatTypes}]`
      );
    }

    const safePin = resetPin ? SecuritySanitizer.sanitizePin(newPin).sanitized : undefined;
    const safePassword = resetPassword ? SecuritySanitizer.sanitizePassword(newPassword).sanitized : undefined;
    const safeReason = SecuritySanitizer.sanitizeGenericText(emergencyReason);

    onRequireElevation(() => {
      setIsProcessing(true);
      const result = userManagementService.emergencyUserReset(
        currentActorUser.id,
        targetUser.id,
        {
          newPin: safePin,
          newPassword: safePassword,
          forcePasswordReset: forcePasswordReset,
          unlockAccount,
          restoreAdminRole,
          resetFailedAttempts,
          reason: safeReason
        }
      );

      setIsProcessing(false);
      if (result.success) {
        onSuccess(result.message);
        onClose();
      } else {
        alert(result.message);
      }
    });
  };

  if (!isOpen || !targetUser) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-[#121218] border border-rose-500/50 rounded-2xl w-full max-w-xl max-h-[92vh] overflow-y-auto p-6 shadow-2xl space-y-5 animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-[#262638] pb-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-rose-950 border border-rose-500/60 text-rose-300 shadow-lg shadow-rose-950/60">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white">Emergency Dual-Credential Reset Console</h3>
                <span className="text-[10px] px-2 py-0.5 rounded-full font-mono font-bold bg-rose-900/60 text-rose-300 border border-rose-700/50">
                  AIR-GAP OVERRIDE
                </span>
              </div>
              <p className="text-xs text-[#94a3b8]">
                {isSelfReset 
                  ? 'Administrator Self-Lockout & Full Credential (Password + PIN) Restoration Protocol' 
                  : `Remediate account lockout & enforce dual credential reset for @${targetUser.username}`}
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1 rounded-lg text-[#888] hover:text-white hover:bg-[#20202c] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Target Profile Card */}
        <div className="p-3.5 rounded-xl bg-[#161622] border border-[#2a2a3e] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl bg-gradient-to-tr ${targetUser.avatarGradient} flex items-center justify-center font-bold text-white shadow-md border border-white/20 shrink-0`}>
              {targetUser.fullName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-bold text-white">{targetUser.fullName}</span>
                <span className="text-[10px] font-mono text-purple-300 bg-purple-950/80 px-1.5 py-0.5 rounded border border-purple-800/50">
                  {targetUser.role}
                </span>
                {usersList.length > 1 && (
                  <select
                    value={targetUser.id}
                    onChange={(e) => setSelectedTargetId(e.target.value)}
                    className="bg-[#101018] border border-[#38384f] text-[11px] text-cyan-300 rounded px-2 py-0.5 ml-1 focus:outline-none focus:border-rose-500 font-sans cursor-pointer"
                  >
                    {usersList.map(u => (
                      <option key={u.id} value={u.id}>
                        Switch: {u.fullName} (@{u.username})
                      </option>
                    ))}
                  </select>
                )}
              </div>
              <div className="text-[11px] text-[#888] font-mono">@{targetUser.username} • UID {targetUser.uid}</div>
            </div>
          </div>

          <div className="sm:text-right flex sm:flex-col items-center sm:items-end justify-between gap-1">
            <span className={`text-[10px] px-2 py-0.5 rounded font-mono font-bold border ${
              targetUser.status === 'LOCKED'
                ? 'bg-rose-950 text-rose-300 border-rose-700'
                : 'bg-emerald-950 text-emerald-300 border-emerald-700'
            }`}>
              {targetUser.status}
            </span>
            <div className="text-[10px] text-[#888] font-mono">Failed attempts: {targetUser.failedLoginsCount}</div>
          </div>
        </div>

        {/* Quick Sync Helper */}
        <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-purple-950/40 border border-purple-800/40 text-xs">
          <div className="flex items-center gap-2 text-purple-200">
            <Sparkles className="w-4 h-4 text-purple-400" />
            <span>High-Assurance Remediation: Reset both credentials simultaneously</span>
          </div>
          <button
            type="button"
            onClick={syncBothCredentials}
            className="px-2.5 py-1 rounded-lg bg-purple-900 hover:bg-purple-800 text-purple-200 text-[11px] font-mono flex items-center gap-1 border border-purple-700/60"
          >
            <RefreshCw className="w-3 h-3" />
            <span>Defaults (SC#7572)</span>
          </button>
        </div>

        {/* Recovery Action Checklist */}
        <div className="space-y-3">
          <div className="text-xs font-bold text-[#e2e8f0] flex items-center gap-2">
            <Zap className="w-4 h-4 text-amber-400" />
            <span>Select Emergency Remediation Actions:</span>
          </div>

          <div className="space-y-2.5">
            {/* 1. Unlock Account */}
            <label className="flex items-center justify-between p-3 rounded-xl bg-[#181824] border border-[#2c2c40] hover:border-[#444] cursor-pointer transition-colors">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-emerald-950 text-emerald-300 border border-emerald-800/40">
                  <Unlock className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-white">Unlock User Account Immediately</div>
                  <div className="text-[11px] text-[#888]">Clears LOCKED/SUSPENDED status and restores account state to ACTIVE</div>
                </div>
              </div>
              <input
                type="checkbox"
                checked={unlockAccount}
                onChange={(e) => setUnlockAccount(e.target.checked)}
                className="w-4 h-4 rounded border-gray-600 text-rose-600 focus:ring-rose-500"
              />
            </label>

            {/* 2. Reset Primary Login Password */}
            <div className="p-3 rounded-xl bg-[#181824] border border-[#2c2c40] space-y-3">
              <div className="flex items-center justify-between cursor-pointer" onClick={() => setResetPassword(!resetPassword)}>
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-cyan-950 text-cyan-300 border border-cyan-800/40">
                    <Lock className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white">Reset Primary Login / PAM System Password</div>
                    <div className="text-[11px] text-[#888]">Replaces user's primary password used for graphical and SSH/TTY login</div>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={resetPassword}
                  onChange={(e) => setResetPassword(e.target.checked)}
                  onClick={(e) => e.stopPropagation()}
                  className="w-4 h-4 rounded border-gray-600 text-cyan-600 focus:ring-cyan-500"
                />
              </div>

              {resetPassword && (
                <div className="pt-2 border-t border-[#262638] space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="relative flex-1">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={newPassword}
                        onChange={(e) => handlePasswordChange(e.target.value)}
                        placeholder="Enter new emergency password"
                        className={`w-full bg-[#121218] border rounded-lg px-3 py-1.5 text-xs text-cyan-300 font-mono tracking-wider focus:outline-none ${
                          passwordThreat ? 'border-rose-500' : 'border-[#33334a] focus:border-cyan-500'
                        }`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-2.5 top-2 text-[#888] hover:text-white"
                      >
                        {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                    <button
                      type="button"
                      onClick={generateHighEntropyPassword}
                      className="px-2 py-1.5 rounded-lg bg-cyan-950 text-cyan-300 hover:bg-cyan-900 border border-cyan-800/60 text-[10px] font-mono shrink-0 flex items-center gap-1"
                    >
                      <Sparkles className="w-3 h-3" />
                      <span>Randomize</span>
                    </button>
                  </div>
                  <SecurityThreatBadge threatReport={passwordThreat} fieldName="Emergency Password" />
                  <div className="text-[10px] text-[#718096] font-mono">
                    Complexity: Length {newPassword.length} • Mixed Alpha, Numeric & Symbol characters
                  </div>
                </div>
              )}
            </div>

            {/* 3. Reset Sudo / Elevation Security PIN */}
            <div className="p-3 rounded-xl bg-[#181824] border border-[#2c2c40] space-y-3">
              <div className="flex items-center justify-between cursor-pointer" onClick={() => setResetPin(!resetPin)}>
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-purple-950 text-purple-300 border border-purple-800/40">
                    <KeyRound className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white">Reset Sudo / Elevation Security PIN</div>
                    <div className="text-[11px] text-[#888]">Replaces root elevation, quick-unlock, and privilege escalation PIN</div>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={resetPin}
                  onChange={(e) => setResetPin(e.target.checked)}
                  onClick={(e) => e.stopPropagation()}
                  className="w-4 h-4 rounded border-gray-600 text-rose-600 focus:ring-rose-500"
                />
              </div>

              {resetPin && (
                <div className="pt-2 border-t border-[#262638] space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="relative flex-1">
                      <input
                        type={showPin ? 'text' : 'password'}
                        value={newPin}
                        onChange={(e) => handlePinChange(e.target.value)}
                        placeholder="Enter new emergency PIN (e.g. SC#7572)"
                        className={`w-full bg-[#121218] border rounded-lg px-3 py-1.5 text-xs text-emerald-400 font-mono tracking-wider focus:outline-none ${
                          pinThreat ? 'border-rose-500' : 'border-[#33334a] focus:border-rose-500'
                        }`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPin(!showPin)}
                        className="absolute right-2.5 top-2 text-[#888] hover:text-white"
                      >
                        {showPin ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                    <button
                      type="button"
                      onClick={generateNewPin}
                      className="px-2 py-1.5 rounded-lg bg-purple-950 text-purple-300 hover:bg-purple-900 border border-purple-800/60 text-[10px] font-mono shrink-0 flex items-center gap-1"
                    >
                      <Sparkles className="w-3 h-3" />
                      <span>Randomize</span>
                    </button>
                  </div>
                  <SecurityThreatBadge threatReport={pinThreat} fieldName="Emergency PIN" />
                </div>
              )}
            </div>

            {/* 4. Force Password Change at Next Logon */}
            <label className="flex items-center justify-between p-3 rounded-xl bg-[#181824] border border-[#2c2c40] hover:border-[#444] cursor-pointer transition-colors">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-rose-950 text-rose-300 border border-rose-800/40">
                  <AlertTriangle className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-white">Force Password Change on Next Logon (Zero-Trust)</div>
                  <div className="text-[11px] text-[#888]">User will be required to establish a fresh permanent password upon logging in</div>
                </div>
              </div>
              <input
                type="checkbox"
                checked={forcePasswordReset}
                onChange={(e) => setForcePasswordReset(e.target.checked)}
                className="w-4 h-4 rounded border-gray-600 text-rose-600 focus:ring-rose-500"
              />
            </label>

            {/* 5. Restore Admin Role & Privileged Groups */}
            <label className="flex items-center justify-between p-3 rounded-xl bg-[#181824] border border-[#2c2c40] hover:border-[#444] cursor-pointer transition-colors">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-amber-950 text-amber-300 border border-amber-800/40">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-white">Restore Root & Superuser Privileges</div>
                  <div className="text-[11px] text-[#888]">Re-attaches wheel, sudoers, and secops group memberships</div>
                </div>
              </div>
              <input
                type="checkbox"
                checked={restoreAdminRole}
                onChange={(e) => setRestoreAdminRole(e.target.checked)}
                className="w-4 h-4 rounded border-gray-600 text-amber-600 focus:ring-amber-500"
              />
            </label>

            {/* 6. Reset Failed Logins Counter */}
            <label className="flex items-center justify-between p-3 rounded-xl bg-[#181824] border border-[#2c2c40] hover:border-[#444] cursor-pointer transition-colors">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-cyan-950 text-cyan-300 border border-cyan-800/40">
                  <Activity className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-white">Reset Failed Attempt History & Extend Expiration</div>
                  <div className="text-[11px] text-[#888]">Clears PAM faillock counters and extends password lifetime to policy maximum</div>
                </div>
              </div>
              <input
                type="checkbox"
                checked={resetFailedAttempts}
                onChange={(e) => setResetFailedAttempts(e.target.checked)}
                className="w-4 h-4 rounded border-gray-600 text-cyan-600 focus:ring-cyan-500"
              />
            </label>
          </div>
        </div>

        {/* Reason for Audit Log */}
        <div className="space-y-1 text-xs">
          <label className="block font-semibold text-[#aaa]">Reason for Emergency Reset (Mandatory Audit Entry) *</label>
          <textarea
            rows={2}
            value={emergencyReason}
            onChange={(e) => handleReasonChange(e.target.value)}
            placeholder="Document reason for emergency reset (lockout recovery, tampering remediation, etc.)"
            className={`w-full bg-[#181824] border rounded-xl p-2.5 text-xs text-white focus:outline-none font-sans ${
              reasonThreat ? 'border-rose-500' : 'border-[#2e2e42] focus:border-rose-500'
            }`}
          />
          <SecurityThreatBadge threatReport={reasonThreat} fieldName="Emergency Reset Reason" />
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-4 border-t border-[#262638]">
          <div className="text-[11px] text-[#888] font-mono">
            Actor: <span className="text-white">@{currentActorUser.username}</span>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-[#1c1c28] hover:bg-[#262636] text-[#ccc] text-xs font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={isProcessing || !emergencyReason.trim()}
              onClick={handleExecuteEmergencyReset}
              className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white text-xs font-semibold shadow-lg shadow-rose-950/50 flex items-center gap-2 transition-all active:scale-95"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Execute Emergency Reset</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
