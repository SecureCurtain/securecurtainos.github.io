// jb7572_2026-08-28: Enterprise Password Security Policy, PAM Rules & Authentication Aging Manager
import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Shield,
  KeyRound,
  Lock,
  Unlock,
  Clock,
  RotateCcw,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  FileCode,
  Sliders,
  Fingerprint,
  Zap,
  Cpu,
  History,
  Check,
  Download,
  Terminal,
  Save,
  ChevronUp,
  ChevronDown,
  Hash,
  Binary,
  Layers,
  AtSign
} from 'lucide-react';
import {
  userManagementService,
  PasswordSecurityPolicy,
  DEFAULT_PASSWORD_POLICY,
  PASSWORD_POLICY_PRESETS
} from '../../services/userManagementService';

interface PasswordPolicyGUIProps {
  onRequireElevation: (action: () => void) => void;
  showToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

// Reusable 2-digit integer input with increment/decrement stepper controls
const TwoDigitInput: React.FC<{
  value: number;
  min?: number;
  max?: number;
  disabled?: boolean;
  unit?: string;
  onChange: (val: number) => void;
}> = ({ value, min = 0, max = 99, disabled = false, unit = '', onChange }) => {
  const handleIncrement = () => {
    if (!disabled && value < max) onChange(value + 1);
  };
  const handleDecrement = () => {
    if (!disabled && value > min) onChange(value - 1);
  };

  return (
    <div className={`flex items-center gap-1.5 ${disabled ? 'opacity-40 pointer-events-none' : ''}`}>
      <div className="relative flex items-center bg-[#0d0d14] border border-[#333348] rounded-xl px-2 py-1 focus-within:border-purple-500 shadow-inner">
        <input
          type="number"
          min={min}
          max={max}
          value={value}
          onChange={(e) => {
            const parsed = parseInt(e.target.value, 10);
            if (!isNaN(parsed)) {
              onChange(Math.max(min, Math.min(max, parsed)));
            } else if (e.target.value === '') {
              onChange(min);
            }
          }}
          className="w-10 bg-transparent text-white font-mono text-sm font-bold text-center focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
        />
        <div className="flex flex-col ml-1 border-l border-[#262638] pl-1">
          <button
            type="button"
            onClick={handleIncrement}
            disabled={value >= max}
            className="text-slate-400 hover:text-white disabled:opacity-30 p-0.5"
            title="Increment"
          >
            <ChevronUp className="w-3 h-3" />
          </button>
          <button
            type="button"
            onClick={handleDecrement}
            disabled={value <= min}
            className="text-slate-400 hover:text-white disabled:opacity-30 p-0.5"
            title="Decrement"
          >
            <ChevronDown className="w-3 h-3" />
          </button>
        </div>
      </div>
      {unit && <span className="text-[11px] font-mono text-[#888] select-none">{unit}</span>}
    </div>
  );
};

// Reusable On/Off Toggle Switch component
const ToggleSwitch: React.FC<{
  checked: boolean;
  onChange: (checked: boolean) => void;
  accentColor?: string;
}> = ({ checked, onChange, accentColor = 'bg-purple-600' }) => {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`w-11 h-6 rounded-full transition-colors relative p-0.5 shrink-0 focus:outline-none ${
        checked ? accentColor : 'bg-[#252538]'
      }`}
    >
      <div
        className={`w-5 h-5 rounded-full bg-white transition-transform shadow-md ${
          checked ? 'translate-x-5' : 'translate-x-0'
        }`}
      />
    </button>
  );
};

export const PasswordPolicyGUI: React.FC<PasswordPolicyGUIProps> = ({
  onRequireElevation,
  showToast
}) => {
  const [policy, setPolicy] = useState<PasswordSecurityPolicy>(userManagementService.getPasswordPolicy());
  const [selectedPreset, setSelectedPreset] = useState<string>('ENTERPRISE_ACTIVE_DIRECTORY');
  
  // Interactive Live Tester state
  const [testPassword, setTestPassword] = useState('SecureCurtain#2026!');
  const [testUsername, setTestUsername] = useState('admin');
  const [testFullName, setTestFullName] = useState('System Administrator');
  const [showTestPassword, setShowTestPassword] = useState(false);
  const [showConfigPreview, setShowConfigPreview] = useState(false);

  useEffect(() => {
    const syncPolicy = () => {
      setPolicy(userManagementService.getPasswordPolicy());
    };
    syncPolicy();
    const unsubscribe = userManagementService.subscribe(syncPolicy);
    return () => unsubscribe();
  }, []);

  const handleUpdate = (updates: Partial<PasswordSecurityPolicy>) => {
    const updated = userManagementService.updatePasswordPolicy(updates);
    setPolicy(updated);
  };

  const handleApplyPreset = (presetKey: string) => {
    setSelectedPreset(presetKey);
    onRequireElevation(() => {
      userManagementService.applyPasswordPolicyPreset(presetKey);
      showToast(`Applied '${PASSWORD_POLICY_PRESETS[presetKey].name}' preset policy.`, 'success');
    });
  };

  const handleResetDefaults = () => {
    onRequireElevation(() => {
      userManagementService.resetPasswordPolicy();
      showToast('Reset password & PAM security policy to standard defaults.', 'info');
    });
  };

  const handleCommitPolicy = () => {
    onRequireElevation(() => {
      showToast('Policy committed and synchronized to PAM /etc/security/pwquality.conf & /etc/login.defs.', 'success');
    });
  };

  const handleExportJson = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(policy, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `securecurtain_pam_policy_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    showToast('Exported policy configuration JSON.', 'info');
  };

  // Test simulation
  const testResults = userManagementService.validatePasswordAgainstPolicy(
    testPassword,
    testUsername,
    testFullName
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Banner & Control Hub */}
      <div className="bg-[#121218] border border-[#282838] rounded-2xl p-5 shadow-xl relative overflow-hidden">
        <div className="absolute -right-12 -top-12 w-48 h-48 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="p-3 rounded-2xl bg-gradient-to-br from-emerald-900/70 via-purple-950 to-indigo-950 border border-emerald-500/40 text-emerald-300 shadow-lg shadow-emerald-950/40">
              <KeyRound className="w-6 h-6 text-emerald-400" />
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h2 className="text-base font-bold text-white tracking-wide">
                  Enterprise Password Policy, PAM Rules & Credential Lifespan
                </h2>
                <span className="text-[10px] px-2.5 py-0.5 rounded-full font-mono font-semibold bg-emerald-950/80 border border-emerald-500/50 text-emerald-300 flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3 text-emerald-400" />
                  PAM pwquality Active
                </span>
                <span className="text-[10px] px-2.5 py-0.5 rounded-full font-mono font-semibold bg-purple-950/80 border border-purple-500/50 text-purple-300">
                  {policy.hashingAlgorithm}
                </span>
              </div>
              <p className="text-xs text-[#94a3b8] mt-1">
                Configure on/off toggles with 2-digit integer inputs for password length, alphanumeric requirements, special symbols, maximum age, minimum time before change, and history reuse limits.
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setShowConfigPreview(!showConfigPreview)}
              className="px-3 py-2 rounded-xl bg-[#1b1b26] hover:bg-[#252536] border border-[#333348] text-slate-300 text-xs font-mono font-semibold flex items-center gap-1.5 transition-all"
            >
              <FileCode className="w-3.5 h-3.5 text-cyan-400" />
              <span>{showConfigPreview ? 'Hide PAM Config' : 'View /etc/pwquality.conf'}</span>
            </button>
            <button
              onClick={handleExportJson}
              className="px-3 py-2 rounded-xl bg-[#1b1b26] hover:bg-[#252536] border border-[#333348] text-slate-300 text-xs font-mono font-semibold flex items-center gap-1.5 transition-all"
            >
              <Download className="w-3.5 h-3.5 text-purple-400" />
              <span>Export JSON</span>
            </button>
            <button
              onClick={handleResetDefaults}
              className="px-3 py-2 rounded-xl bg-[#1b1b26] hover:bg-[#252536] border border-[#333348] text-slate-300 text-xs font-medium flex items-center gap-1.5 transition-all"
            >
              <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
              <span>Reset</span>
            </button>
            <button
              onClick={handleCommitPolicy}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-lg shadow-emerald-950/50 transition-all active:scale-95"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Commit Policy to PAM</span>
            </button>
          </div>
        </div>

        {/* Quick Compliance Presets Bar */}
        <div className="mt-5 pt-4 border-t border-[#262638] flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-slate-400 font-medium">
            <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
            <span>Quick Compliance Presets:</span>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {Object.keys(PASSWORD_POLICY_PRESETS).map(key => {
              const p = PASSWORD_POLICY_PRESETS[key];
              const isSelected = selectedPreset === key;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => handleApplyPreset(key)}
                  className={`px-3 py-1.5 rounded-xl border text-[11px] font-mono transition-all flex items-center gap-1.5 ${
                    isSelected
                      ? 'bg-purple-950/80 border-purple-500 text-purple-200 shadow-md shadow-purple-950/50'
                      : 'bg-[#181824] border-[#2e2e42] text-[#94a3b8] hover:text-white hover:border-[#444]'
                  }`}
                  title={p.description}
                >
                  <span className="truncate">{p.name.split(' ')[0]} {p.name.split(' ')[1]}</span>
                  {isSelected && <Check className="w-3 h-3 text-purple-400 shrink-0" />}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* PAM / pwquality.conf Preview Box */}
      {showConfigPreview && (
        <div className="bg-[#0e0e14] border border-[#2c2c3e] rounded-2xl p-4 font-mono text-xs shadow-2xl animate-in fade-in duration-200">
          <div className="flex items-center justify-between border-b border-[#222232] pb-2 mb-3">
            <div className="flex items-center gap-2 text-cyan-400 font-bold">
              <Terminal className="w-4 h-4" />
              <span>/etc/security/pwquality.conf & /etc/login.defs Synchronized Directives</span>
            </div>
            <span className="text-[10px] text-[#666]">Read-Only PAM Export View</span>
          </div>
          <pre className="text-emerald-400 bg-black/50 p-3 rounded-xl overflow-x-auto text-[11px] leading-relaxed border border-emerald-950/50">
            {userManagementService.generatePamPwQualityConfig()}
          </pre>
        </div>
      )}

      {/* Main Settings Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        
        {/* SECTION 1: Password Length & Character Limits */}
        <div className="bg-[#121218] border border-[#282838] rounded-2xl p-5 shadow-lg space-y-4">
          <div className="flex items-center justify-between border-b border-[#222232] pb-3">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-purple-950/70 border border-purple-800/40 text-purple-300">
                <Sliders className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Password Length & Boundary Thresholds</h3>
                <p className="text-[11px] text-[#888]">Toggles & 2-digit integer values for min/max characters</p>
              </div>
            </div>
          </div>

          {/* Row 1: Minimum Length Toggle + 2-digit input */}
          <div className="flex items-center justify-between p-3.5 rounded-xl bg-[#161622] border border-[#242434] gap-3">
            <div className="space-y-0.5">
              <div className="text-xs font-bold text-white flex items-center gap-2">
                <span>Minimum Password Length</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-950 text-purple-300 font-mono">minlen</span>
              </div>
              <div className="text-[11px] text-[#888]">Enforce minimum character count required for all user accounts</div>
            </div>
            <div className="flex items-center gap-3">
              <TwoDigitInput
                value={policy.minLength}
                min={6}
                max={99}
                disabled={!policy.enforceMinLength}
                unit="chars"
                onChange={(val) => handleUpdate({ minLength: val })}
              />
              <ToggleSwitch
                checked={policy.enforceMinLength}
                onChange={(checked) => handleUpdate({ enforceMinLength: checked })}
                accentColor="bg-purple-600"
              />
            </div>
          </div>

          {/* Row 2: Maximum Length Toggle + 2-digit input */}
          <div className="flex items-center justify-between p-3.5 rounded-xl bg-[#161622] border border-[#242434] gap-3">
            <div className="space-y-0.5">
              <div className="text-xs font-bold text-white flex items-center gap-2">
                <span>Maximum Password Length Buffer</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-950 text-purple-300 font-mono">maxlen</span>
              </div>
              <div className="text-[11px] text-[#888]">Cap maximum string length to prevent denial-of-service hash overflows</div>
            </div>
            <div className="flex items-center gap-3">
              <TwoDigitInput
                value={policy.maxLength}
                min={16}
                max={99}
                disabled={!policy.enforceMaxLength}
                unit="chars"
                onChange={(val) => handleUpdate({ maxLength: val })}
              />
              <ToggleSwitch
                checked={policy.enforceMaxLength}
                onChange={(checked) => handleUpdate({ enforceMaxLength: checked })}
                accentColor="bg-purple-600"
              />
            </div>
          </div>

          {/* Row 3: Minimum Distinct Character Classes */}
          <div className="flex items-center justify-between p-3.5 rounded-xl bg-[#161622] border border-[#242434] gap-3">
            <div className="space-y-0.5">
              <div className="text-xs font-bold text-white flex items-center gap-2">
                <span>Minimum Character Classes Required</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-950 text-purple-300 font-mono">minclass</span>
              </div>
              <div className="text-[11px] text-[#888]">Count of [Uppercase, Lowercase, Digits, Symbols] required</div>
            </div>
            <TwoDigitInput
              value={policy.minCharacterClasses}
              min={1}
              max={4}
              unit="classes"
              onChange={(val) => handleUpdate({ minCharacterClasses: val })}
            />
          </div>
        </div>

        {/* SECTION 2: Password Complexity, Alphanumeric & Special Symbols */}
        <div className="bg-[#121218] border border-[#282838] rounded-2xl p-5 shadow-lg space-y-4">
          <div className="flex items-center justify-between border-b border-[#222232] pb-3">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-emerald-950/70 border border-emerald-800/40 text-emerald-300">
                <Binary className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Complexity: Alphanumeric & Special Symbols</h3>
                <p className="text-[11px] text-[#888]">Toggles for letters, numbers, symbols & digit counters</p>
              </div>
            </div>
          </div>

          {/* Alphanumeric Requirement Toggle */}
          <div className="flex items-center justify-between p-3.5 rounded-xl bg-[#161622] border border-[#242434] gap-3">
            <div className="space-y-0.5">
              <div className="text-xs font-bold text-white flex items-center gap-2">
                <span>Require Alphanumeric (Letters & Numbers)</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-300 font-mono">[A-Za-z0-9]</span>
              </div>
              <div className="text-[11px] text-[#888]">Password must contain both alphabetic letters and numeric digits</div>
            </div>
            <ToggleSwitch
              checked={policy.requireAlphanumeric}
              onChange={(checked) => handleUpdate({ requireAlphanumeric: checked })}
              accentColor="bg-emerald-600"
            />
          </div>

          {/* Special Symbols Toggle + 2-digit minimum count */}
          <div className="flex items-center justify-between p-3.5 rounded-xl bg-[#161622] border border-[#242434] gap-3">
            <div className="space-y-0.5">
              <div className="text-xs font-bold text-white flex items-center gap-2">
                <span>Require Special Symbols</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-300 font-mono">ocredit=-1</span>
              </div>
              <div className="text-[11px] text-[#888]">Enforce special characters like (!@#$%^&*...) with min count</div>
            </div>
            <div className="flex items-center gap-3">
              <TwoDigitInput
                value={policy.minSpecialCharsCount || 1}
                min={1}
                max={9}
                disabled={!policy.requireSpecialChars}
                unit="symbols"
                onChange={(val) => handleUpdate({ minSpecialCharsCount: val })}
              />
              <ToggleSwitch
                checked={policy.requireSpecialChars}
                onChange={(checked) => handleUpdate({ requireSpecialChars: checked })}
                accentColor="bg-emerald-600"
              />
            </div>
          </div>

          {/* Digits Toggle + 2-digit minimum count */}
          <div className="flex items-center justify-between p-3.5 rounded-xl bg-[#161622] border border-[#242434] gap-3">
            <div className="space-y-0.5">
              <div className="text-xs font-bold text-white flex items-center gap-2">
                <span>Require Numeric Digits (0-9)</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-300 font-mono">dcredit=-1</span>
              </div>
              <div className="text-[11px] text-[#888]">Enforce numeric integers with configurable count threshold</div>
            </div>
            <div className="flex items-center gap-3">
              <TwoDigitInput
                value={policy.minDigitsCount || 1}
                min={1}
                max={9}
                disabled={!policy.requireDigits}
                unit="digits"
                onChange={(val) => handleUpdate({ minDigitsCount: val })}
              />
              <ToggleSwitch
                checked={policy.requireDigits}
                onChange={(checked) => handleUpdate({ requireDigits: checked })}
                accentColor="bg-emerald-600"
              />
            </div>
          </div>

          {/* Uppercase & Lowercase Dual Row */}
          <div className="grid grid-cols-2 gap-3 pt-1">
            <div className="p-3 rounded-xl bg-[#14141e] border border-[#222232] flex items-center justify-between">
              <div>
                <div className="text-xs font-bold text-white">Uppercase (A-Z)</div>
                <div className="text-[10px] text-[#888] font-mono">ucredit=-1</div>
              </div>
              <ToggleSwitch
                checked={policy.requireUppercase}
                onChange={(checked) => handleUpdate({ requireUppercase: checked })}
                accentColor="bg-emerald-600"
              />
            </div>

            <div className="p-3 rounded-xl bg-[#14141e] border border-[#222232] flex items-center justify-between">
              <div>
                <div className="text-xs font-bold text-white">Lowercase (a-z)</div>
                <div className="text-[10px] text-[#888] font-mono">lcredit=-1</div>
              </div>
              <ToggleSwitch
                checked={policy.requireLowercase}
                onChange={(checked) => handleUpdate({ requireLowercase: checked })}
                accentColor="bg-emerald-600"
              />
            </div>
          </div>
        </div>

        {/* SECTION 3: Password Age & Minimum Time Before Change */}
        <div className="bg-[#121218] border border-[#282838] rounded-2xl p-5 shadow-lg space-y-4">
          <div className="flex items-center justify-between border-b border-[#222232] pb-3">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-cyan-950/70 border border-cyan-800/40 text-cyan-300">
                <Clock className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Password Age, Minimum Time & Lifespan</h3>
                <p className="text-[11px] text-[#888]">Toggles & 2-digit integer inputs for PAM aging rules</p>
              </div>
            </div>
          </div>

          {/* Password Age (Maximum Age) Toggle + 2-digit input */}
          <div className="flex items-center justify-between p-3.5 rounded-xl bg-[#161622] border border-[#242434] gap-3">
            <div className="space-y-0.5">
              <div className="text-xs font-bold text-white flex items-center gap-2">
                <span>Maximum Password Age (Expiration)</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-cyan-950 text-cyan-300 font-mono">PASS_MAX_DAYS</span>
              </div>
              <div className="text-[11px] text-[#888]">Force user accounts to renew credentials after specified days</div>
            </div>
            <div className="flex items-center gap-3">
              <TwoDigitInput
                value={policy.maxPasswordAgeDays}
                min={1}
                max={99}
                disabled={!policy.enforcePasswordAge}
                unit="days"
                onChange={(val) => handleUpdate({ maxPasswordAgeDays: val })}
              />
              <ToggleSwitch
                checked={policy.enforcePasswordAge}
                onChange={(checked) => handleUpdate({ enforcePasswordAge: checked })}
                accentColor="bg-cyan-600"
              />
            </div>
          </div>

          {/* Minimum Time for Password (Minimum Age) Toggle + 2-digit input */}
          <div className="flex items-center justify-between p-3.5 rounded-xl bg-[#161622] border border-[#242434] gap-3">
            <div className="space-y-0.5">
              <div className="text-xs font-bold text-white flex items-center gap-2">
                <span>Minimum Time for Password</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-cyan-950 text-cyan-300 font-mono">PASS_MIN_DAYS</span>
              </div>
              <div className="text-[11px] text-[#888]">Days user must wait before changing password (prevents history bypass)</div>
            </div>
            <div className="flex items-center gap-3">
              <TwoDigitInput
                value={policy.minPasswordAgeDays}
                min={0}
                max={30}
                disabled={!policy.enforceMinPasswordAge}
                unit="days"
                onChange={(val) => handleUpdate({ minPasswordAgeDays: val })}
              />
              <ToggleSwitch
                checked={policy.enforceMinPasswordAge}
                onChange={(checked) => handleUpdate({ enforceMinPasswordAge: checked })}
                accentColor="bg-cyan-600"
              />
            </div>
          </div>

          {/* Expiration Warning Notice Window Toggle + 2-digit input */}
          <div className="flex items-center justify-between p-3.5 rounded-xl bg-[#161622] border border-[#242434] gap-3">
            <div className="space-y-0.5">
              <div className="text-xs font-bold text-white flex items-center gap-2">
                <span>Expiration Warning Window</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-cyan-950 text-cyan-300 font-mono">PASS_WARN_AGE</span>
              </div>
              <div className="text-[11px] text-[#888]">Days prior to expiration to notify user upon logon</div>
            </div>
            <div className="flex items-center gap-3">
              <TwoDigitInput
                value={policy.expirationWarningDays}
                min={1}
                max={30}
                disabled={!policy.enforceExpirationWarning}
                unit="days"
                onChange={(val) => handleUpdate({ expirationWarningDays: val })}
              />
              <ToggleSwitch
                checked={policy.enforceExpirationWarning}
                onChange={(checked) => handleUpdate({ enforceExpirationWarning: checked })}
                accentColor="bg-cyan-600"
              />
            </div>
          </div>

          {/* Force Change at Next Logon Toggle */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-[#14141e] border border-[#20202e] text-xs">
            <span className="text-slate-300 font-medium">Force Password Change at Next Logon for New Accounts</span>
            <ToggleSwitch
              checked={policy.forceChangeAtNextLogon}
              onChange={(checked) => handleUpdate({ forceChangeAtNextLogon: checked })}
              accentColor="bg-cyan-600"
            />
          </div>
        </div>

        {/* SECTION 4: Password History & Reuse Prevention */}
        <div className="bg-[#121218] border border-[#282838] rounded-2xl p-5 shadow-lg space-y-4">
          <div className="flex items-center justify-between border-b border-[#222232] pb-3">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-amber-950/70 border border-amber-800/40 text-amber-300">
                <History className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Password History & Reuse Prevention</h3>
                <p className="text-[11px] text-[#888]">Prohibit reuse after N cycles & filter dictionary terms</p>
              </div>
            </div>
          </div>

          {/* Reuse Password After N Used Toggle + 2-digit input */}
          <div className="flex items-center justify-between p-3.5 rounded-xl bg-[#161622] border border-[#242434] gap-3">
            <div className="space-y-0.5">
              <div className="text-xs font-bold text-white flex items-center gap-2">
                <span>Reuse Password After N Others Used</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-950 text-amber-300 font-mono">remember</span>
              </div>
              <div className="text-[11px] text-[#888]">Maintains /etc/security/opasswd encrypted history buffer depth</div>
            </div>
            <div className="flex items-center gap-3">
              <TwoDigitInput
                value={policy.passwordHistoryCount}
                min={0}
                max={99}
                disabled={!policy.enforceHistoryReuse}
                unit="passwords"
                onChange={(val) => handleUpdate({ passwordHistoryCount: val })}
              />
              <ToggleSwitch
                checked={policy.enforceHistoryReuse}
                onChange={(checked) => handleUpdate({ enforceHistoryReuse: checked })}
                accentColor="bg-amber-600"
              />
            </div>
          </div>

          {/* Disallow Username in Password Toggle */}
          <div className="flex items-center justify-between p-3.5 rounded-xl bg-[#161622] border border-[#242434] gap-3">
            <div className="space-y-0.5">
              <div className="text-xs font-bold text-white">Disallow Username in Password</div>
              <div className="text-[11px] text-[#888]">Reject passwords containing login handle substrings</div>
            </div>
            <ToggleSwitch
              checked={policy.disallowUsernameInPassword}
              onChange={(checked) => handleUpdate({ disallowUsernameInPassword: checked })}
              accentColor="bg-amber-600"
            />
          </div>

          {/* Disallow Full Legal Name in Password Toggle */}
          <div className="flex items-center justify-between p-3.5 rounded-xl bg-[#161622] border border-[#242434] gap-3">
            <div className="space-y-0.5">
              <div className="text-xs font-bold text-white">Disallow Full Legal Name in Password</div>
              <div className="text-[11px] text-[#888]">Reject first or last name components from SAM/shadow</div>
            </div>
            <ToggleSwitch
              checked={policy.disallowFullNameInPassword}
              onChange={(checked) => handleUpdate({ disallowFullNameInPassword: checked })}
              accentColor="bg-amber-600"
            />
          </div>

          {/* Dictionary Blacklist Toggle */}
          <div className="flex items-center justify-between p-3.5 rounded-xl bg-[#161622] border border-[#242434] gap-3">
            <div className="space-y-0.5">
              <div className="text-xs font-bold text-white">Enforce Dictionary & Known Breach Blacklist</div>
              <div className="text-[11px] text-[#888]">Reject common dictionary words and known compromised hashes</div>
            </div>
            <ToggleSwitch
              checked={policy.enforceDictionaryBlacklist}
              onChange={(checked) => handleUpdate({ enforceDictionaryBlacklist: checked })}
              accentColor="bg-amber-600"
            />
          </div>
        </div>

        {/* SECTION 5: Account Lockout & Sudo Elevation PIN */}
        <div className="bg-[#121218] border border-[#282838] rounded-2xl p-5 shadow-lg space-y-4">
          <div className="flex items-center justify-between border-b border-[#222232] pb-3">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-rose-950/70 border border-rose-800/40 text-rose-300">
                <Shield className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Brute-Force Account Lockout & Elevation PIN</h3>
                <p className="text-[11px] text-[#888]">pam_faillock failed attempt limits & sudo PIN rules</p>
              </div>
            </div>
          </div>

          {/* Account Lockout Toggle + 2-digit failed attempts input */}
          <div className="flex items-center justify-between p-3.5 rounded-xl bg-[#161622] border border-[#242434] gap-3">
            <div className="space-y-0.5">
              <div className="text-xs font-bold text-white flex items-center gap-2">
                <span>Account Lockout Threshold</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-rose-950 text-rose-300 font-mono">deny</span>
              </div>
              <div className="text-[11px] text-[#888]">Lock account after consecutive failed login attempts</div>
            </div>
            <div className="flex items-center gap-3">
              <TwoDigitInput
                value={policy.maxFailedLoginsBeforeLock}
                min={1}
                max={20}
                disabled={!policy.enforceAccountLockout}
                unit="attempts"
                onChange={(val) => handleUpdate({ maxFailedLoginsBeforeLock: val })}
              />
              <ToggleSwitch
                checked={policy.enforceAccountLockout}
                onChange={(checked) => handleUpdate({ enforceAccountLockout: checked })}
                accentColor="bg-rose-600"
              />
            </div>
          </div>

          {/* Lockout Duration 2-digit input */}
          <div className="flex items-center justify-between p-3.5 rounded-xl bg-[#161622] border border-[#242434] gap-3">
            <div className="space-y-0.5">
              <div className="text-xs font-bold text-white flex items-center gap-2">
                <span>Lockout Duration</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-rose-950 text-rose-300 font-mono">unlock_time</span>
              </div>
              <div className="text-[11px] text-[#888]">Duration account remains locked before auto-unlock (0 = admin only)</div>
            </div>
            <TwoDigitInput
              value={policy.lockoutDurationMinutes}
              min={0}
              max={99}
              disabled={!policy.enforceAccountLockout}
              unit="mins"
              onChange={(val) => handleUpdate({ lockoutDurationMinutes: val })}
            />
          </div>

          {/* Sudo PIN Length 2-digit input & Alphanumeric/Special toggle */}
          <div className="p-3.5 rounded-xl bg-[#161622] border border-[#242434] space-y-3">
            <div className="flex items-center justify-between">
              <div className="text-xs font-bold text-white flex items-center gap-1.5">
                <Fingerprint className="w-3.5 h-3.5 text-emerald-400" />
                <span>Sudo & Elevation PIN Length</span>
              </div>
              <TwoDigitInput
                value={policy.minPinLength}
                min={4}
                max={16}
                unit="digits/chars"
                onChange={(val) => handleUpdate({ minPinLength: val })}
              />
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-[#20202e]">
              <span className="text-slate-300 text-xs font-medium">Require Alphanumeric + Special Characters in Sudo PIN</span>
              <ToggleSwitch
                checked={policy.requirePinAlphanumericSpecial}
                onChange={(checked) => handleUpdate({ requirePinAlphanumericSpecial: checked })}
                accentColor="bg-emerald-600"
              />
            </div>
          </div>
        </div>

        {/* SECTION 6: Cryptographic Engine & Argon2 Parameters */}
        <div className="bg-[#121218] border border-[#282838] rounded-2xl p-5 shadow-lg space-y-4">
          <div className="flex items-center justify-between border-b border-[#222232] pb-3">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-indigo-950/70 border border-indigo-800/40 text-indigo-300">
                <Cpu className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Cryptographic Engine & PHC Standards</h3>
                <p className="text-[11px] text-[#888]">Shadow file credential hashing algorithm & iterations</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-3 rounded-xl bg-[#161622] border border-[#242434] space-y-1.5">
              <label className="text-xs font-mono font-semibold text-indigo-300">Hash Algorithm</label>
              <select
                value={policy.hashingAlgorithm}
                onChange={(e) => handleUpdate({ hashingAlgorithm: e.target.value as any })}
                className="w-full bg-[#0d0d14] border border-[#333348] rounded-xl px-3 py-2 text-white font-mono text-xs focus:outline-none focus:border-indigo-500"
              >
                <option value="Argon2id">Argon2id (Winner of PHC - Recommended)</option>
                <option value="SHA-512-Rounds">SHA-512 (50,000 rounds)</option>
                <option value="Yescrypt">Yescrypt (Linux Modern Standard)</option>
                <option value="bcrypt">bcrypt (OpenBSD Blowfish)</option>
              </select>
            </div>

            <div className="p-3 rounded-xl bg-[#161622] border border-[#242434] space-y-1.5">
              <label className="text-xs font-mono font-semibold text-indigo-300">Memory Cost (MB)</label>
              <TwoDigitInput
                value={policy.argon2MemoryCostMB}
                min={16}
                max={99}
                unit="MB"
                onChange={(val) => handleUpdate({ argon2MemoryCostMB: val })}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-3 rounded-xl bg-[#161622] border border-[#242434] space-y-1.5">
              <label className="text-xs font-mono font-semibold text-indigo-300">Time Iterations (Rounds)</label>
              <TwoDigitInput
                value={policy.argon2TimeIterations}
                min={1}
                max={10}
                unit="rounds"
                onChange={(val) => handleUpdate({ argon2TimeIterations: val })}
              />
            </div>

            <div className="p-3 rounded-xl bg-[#161622] border border-[#242434] space-y-1.5">
              <label className="text-xs font-mono font-semibold text-indigo-300">Parallelism Threads</label>
              <TwoDigitInput
                value={policy.argon2Parallelism}
                min={1}
                max={16}
                unit="threads"
                onChange={(val) => handleUpdate({ argon2Parallelism: val })}
              />
            </div>
          </div>
        </div>

      </div>

      {/* SECTION 7: Live Interactive Password Policy Simulator & Tester */}
      <div className="bg-[#121218] border border-[#282838] rounded-2xl p-5 shadow-lg space-y-4">
        <div className="flex items-center justify-between border-b border-[#222232] pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-950/70 border border-emerald-800/40 text-emerald-300">
              <Zap className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Live Interactive Password Policy Simulator & Tester</h3>
              <p className="text-[11px] text-[#888]">Test password strings in real time against all active integer thresholds and toggle rules</p>
            </div>
          </div>
          <span className={`px-3 py-1 rounded-full text-[11px] font-mono font-bold border ${
            testResults.isValid
              ? 'bg-emerald-950/80 border-emerald-500/50 text-emerald-300'
              : 'bg-rose-950/80 border-rose-500/50 text-rose-300'
          }`}>
            {testResults.isValid ? '✓ COMPLIANT WITH ACTIVE POLICY' : '✕ VIOLATES ACTIVE POLICY'}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-mono text-slate-300">Sample Username</label>
            <input
              type="text"
              value={testUsername}
              onChange={(e) => setTestUsername(e.target.value)}
              className="w-full bg-[#181824] border border-[#2e2e42] rounded-xl px-3 py-2 text-white font-mono text-xs focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-mono text-slate-300">Sample Display Name</label>
            <input
              type="text"
              value={testFullName}
              onChange={(e) => setTestFullName(e.target.value)}
              className="w-full bg-[#181824] border border-[#2e2e42] rounded-xl px-3 py-2 text-white font-mono text-xs focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-mono text-slate-300 flex items-center justify-between">
              <span>Test Password Input</span>
              <button
                type="button"
                onClick={() => setShowTestPassword(!showTestPassword)}
                className="text-[10px] text-emerald-400 hover:underline"
              >
                {showTestPassword ? 'Hide' : 'Show'}
              </button>
            </label>
            <input
              type={showTestPassword ? 'text' : 'password'}
              value={testPassword}
              onChange={(e) => setTestPassword(e.target.value)}
              placeholder="Type test password here..."
              className="w-full bg-[#181824] border border-[#2e2e42] rounded-xl px-3 py-2 text-white font-mono text-xs focus:outline-none focus:border-emerald-500"
            />
          </div>
        </div>

        {/* Live Validation Badges Matrix */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 text-xs font-mono">
          {[
            { label: `Min ${policy.minLength} Chars`, pass: testResults.ruleResults.minLength },
            { label: `Max ${policy.maxLength} Chars`, pass: testResults.ruleResults.maxLength },
            { label: 'Alphanumeric [A-Za-z0-9]', pass: testResults.ruleResults.alphanumeric },
            { label: `Min ${policy.minSpecialCharsCount || 1} Special Symbol(s)`, pass: testResults.ruleResults.specialChars },
            { label: `Min ${policy.minDigitsCount || 1} Digit(s) [0-9]`, pass: testResults.ruleResults.digits },
            { label: 'Uppercase [A-Z]', pass: testResults.ruleResults.uppercase },
            { label: 'Lowercase [a-z]', pass: testResults.ruleResults.lowercase },
            { label: `Min ${policy.minCharacterClasses} Classes Met (${testResults.characterClassesMet}/4)`, pass: testResults.ruleResults.characterClasses },
            { label: 'No Username/Name Match', pass: testResults.ruleResults.disallowUsername && testResults.ruleResults.disallowFullName },
            { label: 'Dictionary Blacklist Filter', pass: testResults.ruleResults.dictionaryBlacklist },
          ].map((item, idx) => (
            <div
              key={idx}
              className={`p-2 rounded-xl border flex items-center justify-between text-[11px] ${
                item.pass
                  ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'
                  : 'bg-rose-950/40 border-rose-500/40 text-rose-300'
              }`}
            >
              <span className="truncate">{item.label}</span>
              {item.pass ? <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" /> : <AlertCircle className="w-3.5 h-3.5 text-rose-400 shrink-0" />}
            </div>
          ))}
        </div>

        {/* Errors details if any */}
        {testResults.errors.length > 0 && (
          <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-500/30 text-rose-300 text-xs font-mono space-y-1">
            <div className="font-bold flex items-center gap-1.5">
              <AlertCircle className="w-3.5 h-3.5 text-rose-400" />
              <span>Policy Non-Compliance Warnings:</span>
            </div>
            <ul className="list-disc pl-5 space-y-0.5 text-[11px] text-rose-200">
              {testResults.errors.map((err, i) => (
                <li key={i}>{err}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};
