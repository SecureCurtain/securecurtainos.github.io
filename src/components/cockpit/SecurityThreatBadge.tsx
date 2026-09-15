// jb7572_2026-08-29: Live Security Threat Indicator & Input Shield Component
import React from 'react';
import { ShieldCheck, ShieldAlert, AlertTriangle, Lock } from 'lucide-react';
import { ThreatDetectionResult } from '../../utils/securitySanitizer';

interface SecurityThreatBadgeProps {
  threatReport?: ThreatDetectionResult | null;
  fieldName?: string;
  className?: string;
}

export const SecurityThreatBadge: React.FC<SecurityThreatBadgeProps> = ({
  threatReport,
  fieldName,
  className = ''
}) => {
  if (!threatReport) return null;

  if (threatReport.isClean) {
    return (
      <div className={`flex items-center gap-1.5 text-[10px] text-emerald-400 font-mono ${className}`}>
        <ShieldCheck className="w-3 h-3 text-emerald-400 shrink-0" />
        <span>Validated: No script/injection threats detected</span>
      </div>
    );
  }

  const primaryThreat = threatReport.threats[0];

  return (
    <div className={`p-2 rounded-lg bg-rose-950/80 border border-rose-500/50 space-y-1 ${className}`}>
      <div className="flex items-center gap-1.5 text-[11px] font-bold text-rose-300">
        <ShieldAlert className="w-3.5 h-3.5 text-rose-400 shrink-0 animate-pulse" />
        <span>SECURITY THREAT BLOCKED {fieldName ? `IN [${fieldName.toUpperCase()}]` : ''}</span>
      </div>
      <div className="text-[10px] text-rose-200/90 font-mono">
        {primaryThreat?.description || 'Malicious input sequence detected and neutralized.'}
      </div>
      {primaryThreat?.matchedPattern && (
        <div className="text-[9px] text-rose-400/80 font-mono bg-black/40 px-1.5 py-0.5 rounded border border-rose-800/40 inline-block">
          Pattern: {primaryThreat.matchedPattern}
        </div>
      )}
    </div>
  );
};
