import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Smartphone,
  QrCode,
  Copy,
  Check,
  X,
  RotateCcw,
  Sparkles,
  Apple,
  ExternalLink,
  KeyRound,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { UserAccount as SystemUserAccount } from '../../services/userManagementService';
import {
  generateTotpSetup,
  verifyTotpToken,
  getLiveTotpState,
  TotpSetupDetails,
  TotpLiveState
} from '../../services/totpService';

interface TotpSetupModalProps {
  user: SystemUserAccount;
  isOpen: boolean;
  onClose: () => void;
  onSuccessVerified?: () => void;
}

export const TotpSetupModal: React.FC<TotpSetupModalProps> = ({
  user,
  isOpen,
  onClose,
  onSuccessVerified
}) => {
  const [setupDetails, setSetupDetails] = useState<TotpSetupDetails | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [copied, setCopied] = useState<boolean>(false);
  const [activePlatformTab, setActivePlatformTab] = useState<'apple' | 'google' | 'other'>('apple');
  const [testCodeInput, setTestCodeInput] = useState<string>('');
  const [testResult, setTestResult] = useState<{ valid: boolean; message: string } | null>(null);
  const [isVerifying, setIsVerifying] = useState<boolean>(false);

  // Live RFC 6238 counter
  const [liveState, setLiveState] = useState<TotpLiveState>({
    code: '------',
    secondsRemaining: 30,
    period: 30
  });

  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;
    setLoading(true);
    setTestCodeInput('');
    setTestResult(null);

    generateTotpSetup(user.username, user.totpSecret, 'SecureCurtain OS')
      .then(details => {
        if (isMounted) {
          setSetupDetails(details);
          setLoading(false);
        }
      })
      .catch(err => {
        console.error('Failed to generate TOTP setup:', err);
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [isOpen, user.username, user.totpSecret]);

  useEffect(() => {
    if (!isOpen || !setupDetails) return;

    const updateLive = async () => {
      try {
        const state = await getLiveTotpState(setupDetails.secretBase32);
        setLiveState(state);
      } catch (err) {
        console.error(err);
      }
    };

    updateLive();
    const interval = setInterval(updateLive, 1000);
    return () => clearInterval(interval);
  }, [isOpen, setupDetails]);

  if (!isOpen) return null;

  const handleCopySecret = () => {
    if (!setupDetails) return;
    navigator.clipboard.writeText(setupDetails.secretBase32);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleTestVerify = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!setupDetails || !testCodeInput.trim()) return;

    setIsVerifying(true);
    setTestResult(null);

    const res = await verifyTotpToken(testCodeInput, setupDetails.secretBase32);
    setIsVerifying(false);

    if (res.valid) {
      setTestResult({
        valid: true,
        message: 'Sync Verified! Code matches your mobile authenticator.'
      });
      if (onSuccessVerified) {
        onSuccessVerified();
      }
    } else {
      setTestResult({
        valid: false,
        message: res.reason || 'Invalid code. Ensure phone clock is accurate and try again.'
      });
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-[#0e1322] border border-purple-500/40 rounded-2xl w-full max-w-xl max-h-[92vh] overflow-y-auto shadow-2xl shadow-purple-950/40 p-5 sm:p-6 space-y-5 text-white font-sans">
        
        {/* Header */}
        <div className="flex items-start justify-between border-b border-white/10 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-purple-600 to-cyan-500 p-0.5 shadow-lg shadow-purple-900/40 flex items-center justify-center">
              <div className="w-full h-full bg-[#0a0d18] rounded-2xl flex items-center justify-center">
                <Smartphone className="w-5 h-5 text-purple-300" />
              </div>
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <span>Authenticator App Setup</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-medium bg-purple-500/20 text-purple-300 border border-purple-500/30">
                  RFC 6238 TOTP
                </span>
              </h3>
              <p className="text-xs text-[#94a3b8] font-mono">
                Pair with Apple Passwords / Keychain or Google Authenticator
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-[#708098] hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* User Badge */}
        <div className="flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-[#141b2d] border border-white/10 text-xs font-mono">
          <div className="flex items-center gap-2.5">
            <div className={`w-7 h-7 rounded-lg bg-gradient-to-br ${user.avatarGradient} flex items-center justify-center font-bold text-[10px] text-white`}>
              {user.fullName.split(' ').map(n => n[0]).join('').slice(0, 2)}
            </div>
            <div>
              <span className="font-bold text-white">@{user.username}</span>
              <span className="text-[#64748b] ml-1.5">({user.fullName})</span>
            </div>
          </div>
          <span className="text-[11px] text-cyan-400 font-semibold">2FA Enabled</span>
        </div>

        {/* QR Code and Secret Display */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center bg-[#070912] p-4 rounded-2xl border border-white/10">
          {/* QR Code Box */}
          <div className="flex flex-col items-center justify-center space-y-2 text-center">
            <div className="p-3 bg-white rounded-2xl shadow-xl shadow-black/60 relative group">
              {loading ? (
                <div className="w-[180px] h-[180px] flex items-center justify-center bg-gray-100 rounded-xl">
                  <RotateCcw className="w-8 h-8 text-purple-600 animate-spin" />
                </div>
              ) : setupDetails?.qrCodeDataUrl ? (
                <img
                  src={setupDetails.qrCodeDataUrl}
                  alt="MFA QR Code"
                  className="w-[180px] h-[180px] object-contain rounded-lg"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-[180px] h-[180px] flex items-center justify-center text-xs text-gray-500">
                  QR generation error
                </div>
              )}
            </div>
            <span className="text-[11px] text-[#94a3b8] font-mono flex items-center gap-1">
              <QrCode className="w-3.5 h-3.5 text-purple-400" />
              Scan with phone camera or app
            </span>
          </div>

          {/* Manual Entry Details */}
          <div className="space-y-3 font-mono text-xs">
            <div>
              <label className="text-[10px] text-[#64748b] uppercase tracking-wider block mb-1">
                Account Identifier
              </label>
              <div className="px-3 py-1.5 bg-[#121829] rounded-xl border border-white/10 text-cyan-300 font-semibold truncate">
                SecureCurtain:{user.username}
              </div>
            </div>

            <div>
              <label className="text-[10px] text-[#64748b] uppercase tracking-wider block mb-1">
                Manual Base32 Secret Key
              </label>
              <div className="flex items-center gap-2">
                <div className="flex-1 px-3 py-1.5 bg-[#121829] rounded-xl border border-white/10 text-purple-300 font-bold tracking-wider text-xs truncate">
                  {setupDetails?.formattedSecret || 'Loading...'}
                </div>
                <button
                  type="button"
                  onClick={handleCopySecret}
                  className="p-2 rounded-xl bg-purple-600/20 hover:bg-purple-600/40 text-purple-300 border border-purple-500/40 transition-colors shrink-0"
                  title="Copy secret key to clipboard"
                >
                  {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Live Token Helper (For testing or sync check) */}
            <div className="p-2.5 rounded-xl bg-[#101524] border border-cyan-500/30 space-y-1.5">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-cyan-300 flex items-center gap-1.5 font-sans font-semibold">
                  <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                  Live Code Generator
                </span>
                <span className="text-[10px] text-[#64748b]">
                  Refreshes in {liveState.secondsRemaining}s
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-lg font-bold font-mono text-white tracking-[0.25em]">
                  {liveState.code}
                </span>
                <button
                  type="button"
                  onClick={() => setTestCodeInput(liveState.code)}
                  className="px-2 py-1 rounded-lg bg-cyan-950 hover:bg-cyan-900 border border-cyan-500/40 text-[10px] text-cyan-300 transition-colors"
                >
                  Fill Below
                </button>
              </div>
              {/* Progress bar */}
              <div className="w-full bg-[#1b233a] h-1 rounded-full overflow-hidden">
                <div
                  className="bg-gradient-to-r from-purple-500 to-cyan-400 h-full transition-all duration-1000"
                  style={{ width: `${(liveState.secondsRemaining / 30) * 100}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Setup Guide by Platform */}
        <div className="space-y-2">
          <div className="flex gap-2 border-b border-white/10 pb-2">
            <button
              type="button"
              onClick={() => setActivePlatformTab('apple')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                activePlatformTab === 'apple'
                  ? 'bg-white/15 text-white border border-white/30 shadow'
                  : 'text-[#8fa0b5] hover:text-white'
              }`}
            >
              <span>🍎 Apple iOS Passwords & Keychain</span>
            </button>
            <button
              type="button"
              onClick={() => setActivePlatformTab('google')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                activePlatformTab === 'google'
                  ? 'bg-purple-600/30 text-purple-200 border border-purple-500/40 shadow'
                  : 'text-[#8fa0b5] hover:text-white'
              }`}
            >
              <span>Google Authenticator</span>
            </button>
            <button
              type="button"
              onClick={() => setActivePlatformTab('other')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                activePlatformTab === 'other'
                  ? 'bg-cyan-600/30 text-cyan-200 border border-cyan-500/40 shadow'
                  : 'text-[#8fa0b5] hover:text-white'
              }`}
            >
              <span>Other Apps</span>
            </button>
          </div>

          <div className="p-3.5 rounded-xl bg-[#111628] border border-white/10 text-xs text-[#cbd5e1] leading-relaxed">
            {activePlatformTab === 'apple' && (
              <ol className="space-y-1.5 list-decimal list-inside font-sans">
                <li><strong className="text-white">Built-in iOS Authenticator:</strong> Open <span className="text-purple-300 font-mono">Settings &gt; Passwords</span> on your iPhone or iPad.</li>
                <li>Tap <strong className="text-white">+</strong> (or choose an existing entry for <strong className="text-white">SecureCurtain OS</strong>).</li>
                <li>Under Account Options, tap <strong className="text-cyan-300 font-semibold">"Set Up Verification Code..."</strong>.</li>
                <li>Point your camera at the QR code above (or paste the Secret Key).</li>
                <li>Your iPhone will now automatically generate and AutoFill 6-digit TOTP codes with Face ID / Touch ID!</li>
              </ol>
            )}

            {activePlatformTab === 'google' && (
              <ol className="space-y-1.5 list-decimal list-inside font-sans">
                <li>Open the <strong className="text-white">Google Authenticator</strong> app on Android or iPhone.</li>
                <li>Tap the colorful <strong className="text-purple-300 font-bold">+</strong> button in the bottom-right corner.</li>
                <li>Choose <strong className="text-cyan-300 font-semibold">"Scan a QR code"</strong> and aim your phone camera at the QR code above.</li>
                <li>Alternatively, select <strong className="text-white">"Enter a setup key"</strong> and paste the Base32 Secret Key.</li>
                <li>Google Authenticator will display your rotating 6-digit verification code.</li>
              </ol>
            )}

            {activePlatformTab === 'other' && (
              <p className="font-sans">
                SecureCurtain OS strictly implements <strong className="text-white">RFC 6238 TOTP</strong> with SHA-1 and 30-second time intervals. It is universally compatible with <strong className="text-cyan-300">Microsoft Authenticator</strong>, <strong className="text-purple-300">1Password</strong>, <strong className="text-emerald-300">Bitwarden</strong>, <strong className="text-amber-300">Authy</strong>, and hardware <strong className="text-blue-300">YubiKey Authenticator</strong>.
              </p>
            )}
          </div>
        </div>

        {/* Verification Test Form */}
        <form onSubmit={handleTestVerify} className="space-y-2 pt-1 border-t border-white/10">
          <label className="text-xs font-semibold text-white block">
            Test Verification Code:
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              maxLength={6}
              value={testCodeInput}
              onChange={(e) => setTestCodeInput(e.target.value.replace(/\D/g, ''))}
              placeholder="Enter 6-digit code"
              className="flex-1 bg-[#141a2d] border border-white/20 rounded-xl px-3.5 py-2 text-sm text-center font-mono font-bold tracking-[0.3em] text-white focus:outline-none focus:border-purple-400 focus:ring-1 focus:ring-purple-400"
            />
            <button
              type="submit"
              disabled={isVerifying || testCodeInput.length !== 6}
              className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-40 text-white font-bold text-xs transition-colors cursor-pointer"
            >
              {isVerifying ? 'Verifying...' : 'Test Code'}
            </button>
          </div>

          {testResult && (
            <div className={`p-2.5 rounded-xl border text-xs flex items-center gap-2 ${
              testResult.valid
                ? 'bg-emerald-950/80 border-emerald-500/50 text-emerald-300'
                : 'bg-rose-950/80 border-rose-500/50 text-rose-300'
            }`}>
              {testResult.valid ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              )}
              <span>{testResult.message}</span>
            </div>
          )}
        </form>

        {/* Footer */}
        <div className="flex justify-end pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs transition-colors cursor-pointer"
          >
            Done
          </button>
        </div>

      </div>
    </div>
  );
};
