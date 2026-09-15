// jb7572_2026-08-28: Admin PIN Sudo / UAC Elevation Modal Dialog Component
// Author: System Administrator - Root / Chief Forensic Architect

import React, { useState, useEffect } from 'react';
import { 
  ShieldAlert, 
  ShieldCheck, 
  Lock, 
  KeyRound, 
  CheckCircle2, 
  AlertCircle, 
  X, 
  Eye, 
  EyeOff, 
  Terminal,
  Usb,
  HardDrive
} from 'lucide-react';
import { adminAuthService } from '../../services/adminAuthService';

interface AdminPinElevationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  actionTitle: string;
  actionDescription: string;
  targetDeviceName?: string;
  requiredForUsbBypass?: boolean;
}

export const AdminPinElevationModal: React.FC<AdminPinElevationModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  actionTitle,
  actionDescription,
  targetDeviceName,
  requiredForUsbBypass = false
}) => {
  const admin = adminAuthService.getAdminAccount();
  const [pin, setPin] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setPin('');
      setError(null);
      setIsVerifying(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setError(null);
    setIsVerifying(true);

    setTimeout(() => {
      const res = adminAuthService.verifyElevatedPin(pin);
      setIsVerifying(false);
      if (res.success) {
        onSuccess();
        onClose();
      } else {
        setError(res.error || 'Authentication failed. Please check your PIN.');
      }
    }, 400);
  };

  const handleQuickFillDefault = () => {
    setPin(admin.elevatedPin);
    setError(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in font-sans">
      <div 
        className="w-full max-w-md bg-[#0e1017] border-2 border-amber-500/40 rounded-2xl shadow-[0_0_50px_rgba(245,158,11,0.25)] overflow-hidden text-[#f5f5f5] animate-scale-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Bar */}
        <div className="bg-gradient-to-r from-amber-950/60 via-[#181a24] to-[#0e1017] px-5 py-4 border-b border-amber-500/30 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-500/20 text-amber-400 rounded-xl border border-amber-500/40 shadow-inner">
              <ShieldAlert className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="text-[10px] font-mono uppercase tracking-widest text-amber-400 font-bold flex items-center gap-1.5">
                <span>SUPERUSER ELEVATION GATEWAY</span>
                <span className="px-1.5 py-0.2 rounded bg-amber-500/20 text-[9px] border border-amber-500/40">SUDO / UAC</span>
              </div>
              <h3 className="text-sm font-bold text-white tracking-wide">
                {actionTitle}
              </h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#888] hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Target details */}
          <div className="bg-[#141722] border border-[#262c3f] rounded-xl p-3.5 space-y-2">
            <p className="text-xs text-[#bbb] leading-relaxed">
              {actionDescription}
            </p>
            {targetDeviceName && (
              <div className="flex items-center gap-2 pt-1 border-t border-[#22283a] text-xs font-mono text-cyan-300">
                {requiredForUsbBypass ? (
                  <Usb className="w-3.5 h-3.5 text-amber-400" />
                ) : (
                  <HardDrive className="w-3.5 h-3.5 text-purple-400" />
                )}
                <span>Target Node: <strong>{targetDeviceName}</strong></span>
              </div>
            )}
            {requiredForUsbBypass && (
              <div className="px-2.5 py-1.5 rounded bg-amber-500/10 border border-amber-500/30 text-[11px] text-amber-300 font-medium flex items-center gap-2">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>Entering your PIN generates a signed hardware whitelist token for this USB device ONLY.</span>
              </div>
            )}
          </div>

          {/* Admin User Badge */}
          <div className="flex items-center justify-between px-3 py-2 bg-[#12141c] rounded-lg border border-[#222]">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-purple-600 to-amber-500 flex items-center justify-center text-xs font-bold text-white shadow-sm">
                JB
              </div>
              <div>
                <div className="text-xs font-bold text-white">{admin.name}</div>
                <div className="text-[10px] font-mono text-[#888]">{admin.role}</div>
              </div>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-950/60 border border-purple-800/50 text-purple-300">
              UID 0 (Root)
            </span>
          </div>

          {/* PIN Input Area */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-[#ddd] flex items-center gap-1.5">
                <KeyRound className="w-3.5 h-3.5 text-amber-400" />
                <span>Elevated Sudo PIN (4 to 10 characters)</span>
              </label>
              <span className="text-[10px] font-mono text-[#777]">
                Alpha-numeric & symbols allowed
              </span>
            </div>

            <div className="relative flex items-center">
              <input
                type={showPin ? 'text' : 'password'}
                autoFocus
                value={pin}
                onChange={(e) => {
                  setPin(e.target.value);
                  setError(null);
                }}
                maxLength={10}
                placeholder="Enter 4-10 char Root PIN..."
                className="w-full bg-[#08090d] border border-[#333a4d] focus:border-amber-400 focus:ring-2 focus:ring-amber-500/30 rounded-xl px-3.5 py-2.5 text-sm font-mono text-white tracking-widest outline-none transition-all placeholder:text-[#555] placeholder:tracking-normal"
              />
              <button
                type="button"
                onClick={() => setShowPin(!showPin)}
                className="absolute right-3 p-1 text-[#888] hover:text-white transition-colors"
                title={showPin ? 'Hide PIN' : 'Show PIN'}
              >
                {showPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            <div className="flex items-center justify-between text-[10px] text-[#777] font-mono pt-0.5">
              <span>Length: {pin.length} / 10 (Min: 4)</span>
              <button
                type="button"
                onClick={handleQuickFillDefault}
                className="text-amber-400 hover:text-amber-300 underline cursor-pointer"
              >
                Auto-Fill Root PIN ({admin.elevatedPin})
              </button>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-2.5 rounded-lg bg-rose-950/50 border border-rose-800/60 text-xs text-rose-300 flex items-center gap-2 animate-shake">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{error}</span>
            </div>
          )}

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-[#222]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-[#171922] hover:bg-[#222736] text-xs font-medium text-[#bbb] hover:text-white transition-colors border border-[#2a3144]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isVerifying || pin.length < 4}
              className={`px-5 py-2 rounded-xl text-xs font-bold font-mono tracking-wider flex items-center gap-2 transition-all shadow-lg ${
                isVerifying || pin.length < 4
                  ? 'bg-[#222] text-[#666] cursor-not-allowed border border-[#333]'
                  : 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black border border-amber-400 shadow-[0_0_20px_rgba(245,158,11,0.4)]'
              }`}
            >
              {isVerifying ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-black border-t-transparent rounded-full animate-spin" />
                  <span>VERIFYING PIN...</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  <span>AUTHORIZE ELEVATION</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
