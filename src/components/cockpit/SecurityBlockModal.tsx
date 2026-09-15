// jb7572_2026-08-28: Security Policy Enforcement Modal
import React from 'react';
import { ShieldAlert, Lock, AlertTriangle, ArrowRight, RotateCcw, X } from 'lucide-react';
import { UserAccount } from '../../services/userManagementService';

interface SecurityBlockModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  reason: string;
  isSelf: boolean;
  isActorAdmin: boolean;
  targetUser?: UserAccount | null;
  onLaunchEmergencyReset?: (user: UserAccount) => void;
}

export const SecurityBlockModal: React.FC<SecurityBlockModalProps> = ({
  isOpen,
  onClose,
  title,
  reason,
  isSelf,
  isActorAdmin,
  targetUser,
  onLaunchEmergencyReset
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-[#121218] border border-amber-500/40 rounded-2xl w-full max-w-lg p-6 shadow-2xl space-y-5 animate-in zoom-in-95 duration-200">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-3 rounded-2xl border ${
              isActorAdmin && isSelf 
                ? 'bg-amber-950/80 border-amber-500/50 text-amber-300' 
                : 'bg-rose-950/80 border-rose-500/50 text-rose-300'
            }`}>
              {isActorAdmin && isSelf ? <ShieldAlert className="w-6 h-6" /> : <Lock className="w-6 h-6" />}
            </div>
            <div>
              <h3 className="text-base font-bold text-white">{title}</h3>
              <p className="text-xs text-[#94a3b8]">Role-Based Access Control (RBAC) & Security Policy Gate</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1 rounded-lg text-[#888] hover:text-white hover:bg-[#20202c] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Reason card */}
        <div className={`p-4 rounded-xl border text-xs font-mono space-y-2 ${
          isActorAdmin && isSelf
            ? 'bg-amber-950/20 border-amber-500/30 text-amber-200'
            : 'bg-rose-950/20 border-rose-500/30 text-rose-200'
        }`}>
          <div className="flex items-center gap-2 font-bold text-[13px]">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{isActorAdmin && isSelf ? 'Admin Self-Modification Restricted' : 'Access Restricted by Security Policy'}</span>
          </div>
          <p className="leading-relaxed font-sans text-xs opacity-90">
            {reason}
          </p>
        </div>

        {/* Context Breakdown */}
        <div className="p-3.5 rounded-xl bg-[#181824] border border-[#2a2a3c] space-y-2 text-xs">
          <div className="text-[11px] font-semibold text-[#888] uppercase tracking-wider">Policy Architecture Rules:</div>
          <ul className="space-y-1.5 text-[#cbd5e1] text-[11px]">
            <li className="flex items-start gap-2">
              <span className="text-rose-400 font-bold">•</span>
              <span><strong>Regular Users:</strong> Blocked from editing their own profile or other user accounts to prevent unauthorized privilege alterations.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-amber-400 font-bold">•</span>
              <span><strong>Admin-Level Users:</strong> Permitted to edit everyone except their own profile via standard edit to preserve audit trails and prevent de-escalation flaws.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-emerald-400 font-bold">•</span>
              <span><strong>Emergency User Reset:</strong> Admin-level users utilize the dedicated Emergency Reset module to recover their own accounts in case of lockout or malfeasance.</span>
            </li>
          </ul>
        </div>

        {/* Action Footer */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#262638]">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-[#1c1c28] hover:bg-[#262636] text-[#ccc] text-xs font-medium transition-colors"
          >
            Acknowledge & Close
          </button>

          {isActorAdmin && isSelf && targetUser && onLaunchEmergencyReset && (
            <button
              type="button"
              onClick={() => {
                onClose();
                onLaunchEmergencyReset(targetUser);
              }}
              className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold shadow-lg shadow-amber-950/50 flex items-center gap-2 transition-all active:scale-95"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Launch Emergency User Reset</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
