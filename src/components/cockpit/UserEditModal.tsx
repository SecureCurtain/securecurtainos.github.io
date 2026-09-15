// jb7572_2026-08-28: User Profile Edit Dialog Modal
import React, { useState, useEffect } from 'react';
import {
  Edit3,
  UserCheck,
  Shield,
  KeyRound,
  CheckCircle2,
  AlertCircle,
  X,
  Layers,
  Terminal,
  FolderTree,
  Eye,
  EyeOff,
  Sparkles,
  Save,
  Check,
  ShieldAlert
} from 'lucide-react';
import {
  UserAccount,
  UserGroup,
  RoleLevel,
  SecurityRole,
  UserStatus,
  userManagementService
} from '../../services/userManagementService';
import { SecuritySanitizer, ThreatDetectionResult } from '../../utils/securitySanitizer';
import { SecurityThreatBadge } from './SecurityThreatBadge';

interface UserEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetUser: UserAccount | null;
  currentActorUser: UserAccount;
  groups: UserGroup[];
  roles: Record<RoleLevel, SecurityRole>;
  onSuccess: (msg: string) => void;
  onRequireElevation: (action: () => void) => void;
}

export const UserEditModal: React.FC<UserEditModalProps> = ({
  isOpen,
  onClose,
  targetUser,
  currentActorUser,
  groups,
  roles,
  onSuccess,
  onRequireElevation
}) => {
  const [fullName, setFullName] = useState(targetUser?.fullName || '');
  const [title, setTitle] = useState(targetUser?.title || '');
  const [email, setEmail] = useState(targetUser?.email || '');
  const [role, setRole] = useState<RoleLevel>(targetUser?.role || 'STANDARD_USER');
  const [userGroups, setUserGroups] = useState<string[]>(targetUser ? [...targetUser.groups] : ['users']);
  const [homeDir, setHomeDir] = useState(targetUser?.homeDirectory || '/home/user');
  const [shell, setShell] = useState(targetUser?.shell || '/bin/bash');
  const [pin, setPin] = useState(targetUser?.pin || '7572');
  const [showPin, setShowPin] = useState(false);
  const [password, setPassword] = useState(targetUser?.password || '');
  const [showPassword, setShowPassword] = useState(false);
  const [forcePasswordReset, setForcePasswordReset] = useState(targetUser?.forcePasswordReset || false);
  const [status, setStatus] = useState<UserStatus>(targetUser?.status || 'ACTIVE');
  const [mfaEnabled, setMfaEnabled] = useState(targetUser?.mfaEnabled || false);
  const [mfaMethod, setMfaMethod] = useState<'TOTP_AUTH' | 'HARDWARE_FIDO2' | 'PIN_AIRGAP'>(targetUser?.mfaMethod || 'TOTP_AUTH');
  const [passwordExpiresDays, setPasswordExpiresDays] = useState(targetUser?.passwordExpiresDays || 90);

  // Live Threat Detection State
  const [nameThreat, setNameThreat] = useState<ThreatDetectionResult | null>(null);
  const [emailThreat, setEmailThreat] = useState<ThreatDetectionResult | null>(null);
  const [homeDirThreat, setHomeDirThreat] = useState<ThreatDetectionResult | null>(null);
  const [pinThreat, setPinThreat] = useState<ThreatDetectionResult | null>(null);
  const [passwordThreat, setPasswordThreat] = useState<ThreatDetectionResult | null>(null);

  useEffect(() => {
    if (targetUser) {
      setFullName(targetUser.fullName);
      setTitle(targetUser.title || '');
      setEmail(targetUser.email);
      setRole(targetUser.role);
      setUserGroups([...targetUser.groups]);
      setHomeDir(targetUser.homeDirectory);
      setShell(targetUser.shell);
      setPin(targetUser.pin);
      setPassword(targetUser.password || '');
      setForcePasswordReset(targetUser.forcePasswordReset || false);
      setStatus(targetUser.status);
      setMfaEnabled(targetUser.mfaEnabled);
      setMfaMethod(targetUser.mfaMethod);
      setPasswordExpiresDays(targetUser.passwordExpiresDays);
    }
  }, [targetUser]);

  const handleFullNameChange = (val: string) => {
    setFullName(val);
    const threat = SecuritySanitizer.detectThreats(val, 'fullName');
    setNameThreat(!threat.isClean ? threat : null);
  };

  const handleEmailChange = (val: string) => {
    setEmail(val);
    const threat = SecuritySanitizer.detectThreats(val, 'email');
    setEmailThreat(!threat.isClean ? threat : null);
  };

  const handleHomeDirChange = (val: string) => {
    setHomeDir(val);
    const threat = SecuritySanitizer.detectThreats(val, 'homeDirectory');
    setHomeDirThreat(!threat.isClean ? threat : null);
  };

  const handlePinChange = (val: string) => {
    setPin(val);
    const threat = SecuritySanitizer.detectThreats(val, 'pin');
    setPinThreat(!threat.isClean ? threat : null);
  };

  const handlePasswordChange = (val: string) => {
    setPassword(val);
    const threat = SecuritySanitizer.detectThreats(val, 'password');
    setPasswordThreat(!threat.isClean ? threat : null);
  };

  const handleSave = () => {
    if (!targetUser) return;
    if (!fullName.trim()) {
      alert('Full Name cannot be blank.');
      return;
    }

    // Check for critical active injection threats
    const threats = [
      SecuritySanitizer.detectThreats(fullName, 'fullName'),
      SecuritySanitizer.detectThreats(email, 'email'),
      SecuritySanitizer.detectThreats(homeDir, 'homeDirectory'),
      SecuritySanitizer.detectThreats(pin, 'pin'),
      SecuritySanitizer.detectThreats(password, 'password')
    ].filter(t => !t.isClean);

    if (threats.length > 0) {
      const threatTypes = threats.flatMap(t => t.threats.map(th => th.type)).join(', ');
      userManagementService.recordSecurityThreat(
        currentActorUser.username,
        `UserEditModal (@${targetUser.username})`,
        `Blocked attempt to save malicious payload: [${threatTypes}]`
      );
    }

    // Sanitize all values
    const safeFullName = SecuritySanitizer.sanitizeGenericText(fullName);
    const safeTitle = SecuritySanitizer.sanitizeGenericText(title);
    const safeEmail = SecuritySanitizer.sanitizeEmail(email).sanitized;
    const safeHomeDir = SecuritySanitizer.sanitizePath(homeDir).sanitized;
    const safeShell = SecuritySanitizer.sanitizeShell(shell).sanitized;
    const safePin = SecuritySanitizer.sanitizePin(pin).sanitized;
    const safePassword = password ? SecuritySanitizer.sanitizePassword(password).sanitized : undefined;

    onRequireElevation(() => {
      const result = userManagementService.updateUserProfile(
        currentActorUser.id,
        targetUser.id,
        {
          fullName: safeFullName,
          title: safeTitle,
          email: safeEmail,
          role,
          groups: userGroups,
          homeDirectory: safeHomeDir,
          shell: safeShell,
          pin: safePin,
          password: safePassword,
          forcePasswordReset,
          status,
          mfaEnabled,
          mfaMethod,
          passwordExpiresDays: Number(passwordExpiresDays)
        }
      );

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
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-[#121218] border border-[#333348] rounded-2xl w-full max-w-2xl max-h-[92vh] overflow-y-auto p-6 shadow-2xl space-y-5 animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#262638] pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-purple-950 border border-purple-500/50 text-purple-300">
              <Edit3 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white">Edit User Profile</h3>
                <span className="text-xs font-mono text-purple-300 bg-purple-950/80 px-2 py-0.5 rounded border border-purple-800/50">
                  @{targetUser.username}
                </span>
              </div>
              <p className="text-xs text-[#888]">Modify RBAC privileges, credentials, group memberships, and environment shell</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1 rounded-lg text-[#888] hover:text-white hover:bg-[#20202c] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Fields Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-sans">
          <div>
            <label className="block text-[#aaa] mb-1">Full Display Name *</label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => handleFullNameChange(e.target.value)}
              className={`w-full bg-[#181824] border rounded-xl px-3 py-2 text-white focus:outline-none font-sans ${
                nameThreat ? 'border-rose-500' : 'border-[#2e2e42] focus:border-purple-500'
              }`}
            />
            <SecurityThreatBadge threatReport={nameThreat} fieldName="Full Name" className="mt-1" />
          </div>

          <div>
            <label className="block text-[#aaa] mb-1">Title / Designation</label>
            <input
              type="text"
              placeholder="e.g. Lead Security Architect"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-[#181824] border border-[#2e2e42] rounded-xl px-3 py-2 text-white focus:outline-none focus:border-purple-500"
            />
          </div>

          <div>
            <label className="block text-[#aaa] mb-1">Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => handleEmailChange(e.target.value)}
              className={`w-full bg-[#181824] border rounded-xl px-3 py-2 text-white focus:outline-none ${
                emailThreat ? 'border-rose-500' : 'border-[#2e2e42] focus:border-purple-500'
              }`}
            />
            <SecurityThreatBadge threatReport={emailThreat} fieldName="Email" className="mt-1" />
          </div>

          <div>
            <label className="block text-[#aaa] mb-1">Account State / Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as UserStatus)}
              className="w-full bg-[#181824] border border-[#2e2e42] rounded-xl px-3 py-2 text-white focus:outline-none focus:border-purple-500"
            >
              <option value="ACTIVE">ACTIVE (Normal Operating Status)</option>
              <option value="LOCKED">LOCKED (Locked Out by PAM Faillock)</option>
              <option value="SUSPENDED">SUSPENDED (Administratively Suspended)</option>
              <option value="EXPIRED">EXPIRED (Password Aging Exceeded)</option>
              <option value="PENDING_MFA">PENDING_MFA (Awaiting 2FA Enrollment)</option>
            </select>
          </div>

          <div>
            <label className="block text-[#aaa] mb-1">Security Role (RBAC Level) *</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as RoleLevel)}
              className="w-full bg-[#181824] border border-[#2e2e42] rounded-xl px-3 py-2 text-white focus:outline-none focus:border-purple-500"
            >
              {Object.keys(roles).map(rKey => (
                <option key={rKey} value={rKey}>{roles[rKey as RoleLevel].name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[#aaa] mb-1 font-mono">Password Expiration (Days)</label>
            <input
              type="number"
              min={1}
              max={365}
              value={passwordExpiresDays}
              onChange={(e) => setPasswordExpiresDays(Math.max(1, parseInt(e.target.value) || 30))}
              className="w-full bg-[#181824] border border-[#2e2e42] rounded-xl px-3 py-2 text-emerald-400 font-mono focus:outline-none focus:border-purple-500"
            />
          </div>

          <div>
            <label className="block text-[#aaa] mb-1 font-mono">Home Directory Path</label>
            <input
              type="text"
              value={homeDir}
              onChange={(e) => handleHomeDirChange(e.target.value)}
              className={`w-full bg-[#181824] border rounded-xl px-3 py-2 text-cyan-300 font-mono focus:outline-none ${
                homeDirThreat ? 'border-rose-500' : 'border-[#2e2e42] focus:border-purple-500'
              }`}
            />
            <SecurityThreatBadge threatReport={homeDirThreat} fieldName="Home Directory" className="mt-1" />
          </div>

          <div>
            <label className="block text-[#aaa] mb-1 font-mono">Default Shell</label>
            <select
              value={shell}
              onChange={(e) => setShell(e.target.value)}
              className="w-full bg-[#181824] border border-[#2e2e42] rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-purple-500"
            >
              <option value="/bin/bash">/bin/bash (Default GNU Bash)</option>
              <option value="/bin/zsh">/bin/zsh (Z-Shell Powerline)</option>
              <option value="/bin/sh">/bin/sh (POSIX Minimal)</option>
              <option value="/bin/rbash">/bin/rbash (Restricted Jail)</option>
            </select>
          </div>

          <div>
            <label className="block text-[#aaa] mb-1 font-mono">Elevation / Sudo PIN</label>
            <div className="relative">
              <input
                type={showPin ? 'text' : 'password'}
                value={pin}
                onChange={(e) => handlePinChange(e.target.value)}
                placeholder="PIN"
                className={`w-full bg-[#181824] border rounded-xl px-3 py-2 text-emerald-400 font-mono focus:outline-none ${
                  pinThreat ? 'border-rose-500' : 'border-[#2e2e42] focus:border-purple-500'
                }`}
              />
              <button
                type="button"
                onClick={() => setShowPin(!showPin)}
                className="absolute right-3 top-2.5 text-[#888] hover:text-white"
              >
                {showPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <SecurityThreatBadge threatReport={pinThreat} fieldName="Elevation PIN" className="mt-1" />
          </div>

          <div>
            <label className="block text-[#aaa] mb-1 font-mono">Primary Login Password</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => handlePasswordChange(e.target.value)}
                placeholder="Primary PAM Password"
                className={`w-full bg-[#181824] border rounded-xl px-3 py-2 text-cyan-300 font-mono focus:outline-none ${
                  passwordThreat ? 'border-rose-500' : 'border-[#2e2e42] focus:border-purple-500'
                }`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-2.5 text-[#888] hover:text-white"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <SecurityThreatBadge threatReport={passwordThreat} fieldName="Primary Password" className="mt-1" />
          </div>

          <div className="sm:col-span-2 flex items-center justify-between p-3 rounded-xl bg-[#181824] border border-[#2e2e42]">
            <div>
              <div className="text-xs font-semibold text-white">Force Password Change at Next Logon</div>
              <div className="text-[11px] text-[#888]">Requires user to create a new compliant password upon next graphical/SSH login</div>
            </div>
            <input
              type="checkbox"
              checked={forcePasswordReset}
              onChange={(e) => setForcePasswordReset(e.target.checked)}
              className="w-4 h-4 rounded border-gray-600 text-purple-600 focus:ring-purple-500"
            />
          </div>

          <div>
            <label className="block text-[#aaa] mb-1">MFA Security Method</label>
            <select
              value={mfaMethod}
              onChange={(e) => setMfaMethod(e.target.value as any)}
              className="w-full bg-[#181824] border border-[#2e2e42] rounded-xl px-3 py-2 text-white focus:outline-none focus:border-purple-500"
            >
              <option value="TOTP_AUTH">Time-Based OTP (Google Authenticator & Apple iOS Passwords)</option>
              <option value="HARDWARE_FIDO2">Hardware FIDO2 Security Key</option>
              <option value="PIN_AIRGAP">PIN-Only Air-Gap Elevation</option>
            </select>
          </div>
        </div>

        {/* Group Memberships */}
        <div>
          <label className="block text-xs font-semibold text-white mb-2">Group Memberships & Access Delegation:</label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {groups.map(g => {
              const isChecked = userGroups.includes(g.id);
              return (
                <button
                  key={g.id}
                  type="button"
                  onClick={() => {
                    if (isChecked) {
                      setUserGroups(userGroups.filter(id => id !== g.id));
                    } else {
                      setUserGroups([...userGroups, g.id]);
                    }
                  }}
                  className={`p-2 rounded-xl border text-left text-xs font-mono transition-all flex items-center justify-between ${
                    isChecked
                      ? 'bg-purple-950/60 border-purple-500/60 text-purple-300'
                      : 'bg-[#181824] border-[#2e2e42] text-[#888] hover:border-[#444]'
                  }`}
                >
                  <span className="truncate">{g.name}</span>
                  {isChecked && <CheckCircle2 className="w-3.5 h-3.5 text-purple-400 shrink-0" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* Modal Buttons */}
        <div className="flex items-center justify-between pt-4 border-t border-[#262638]">
          <div className="text-[11px] text-[#888] font-mono">
            Elevated Actor: <span className="text-white">@{currentActorUser.username}</span>
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
              onClick={handleSave}
              className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold shadow-lg shadow-purple-950/50 flex items-center gap-1.5 transition-all active:scale-95"
            >
              <Save className="w-4 h-4" />
              <span>Save Changes (Requires Elevation)</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
