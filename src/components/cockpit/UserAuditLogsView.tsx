// jb7572_2026-08-28: Security Audit & Administrative Action Journal View
import React, { useState } from 'react';
import {
  ShieldAlert,
  Activity,
  History,
  Search,
  Filter,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Terminal,
  UserCheck,
  RotateCcw,
  KeyRound,
  FileCode
} from 'lucide-react';
import { UserAuditLog } from '../../services/userManagementService';

interface UserAuditLogsViewProps {
  logs: UserAuditLog[];
}

export const UserAuditLogsView: React.FC<UserAuditLogsViewProps> = ({ logs }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [severityFilter, setSeverityFilter] = useState('ALL');

  const filteredLogs = logs.filter(log => {
    const matchesSearch =
      log.actorUsername.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.targetUsername.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.details.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.actionType.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSeverity = severityFilter === 'ALL' || log.severity === severityFilter;
    return matchesSearch && matchesSeverity;
  });

  const getActionBadge = (action: UserAuditLog['actionType']) => {
    switch (action) {
      case 'EMERGENCY_RESET':
        return 'bg-rose-950 text-rose-300 border-rose-700/60 font-bold';
      case 'USER_EDITED':
        return 'bg-purple-950 text-purple-300 border-purple-700/60';
      case 'USER_CREATED':
        return 'bg-emerald-950 text-emerald-300 border-emerald-700/60';
      case 'USER_DELETED':
        return 'bg-rose-950 text-rose-300 border-rose-700/60';
      case 'USER_LOCKED':
        return 'bg-amber-950 text-amber-300 border-amber-700/60';
      case 'POLICY_UPDATE':
        return 'bg-cyan-950 text-cyan-300 border-cyan-700/60';
      default:
        return 'bg-slate-900 text-slate-300 border-slate-700';
    }
  };

  const getSeverityBadge = (sev: UserAuditLog['severity']) => {
    switch (sev) {
      case 'SECURITY_EMERGENCY':
        return 'bg-rose-900/80 text-white border-rose-500 animate-pulse';
      case 'CRITICAL':
        return 'bg-rose-950 text-rose-300 border-rose-700';
      case 'WARNING':
        return 'bg-amber-950 text-amber-300 border-amber-700';
      case 'INFO':
      default:
        return 'bg-emerald-950 text-emerald-300 border-emerald-700';
    }
  };

  return (
    <div className="space-y-4">
      {/* Search & Filter Bar */}
      <div className="bg-[#121216] border border-[#262633] rounded-xl p-3 flex flex-col md:flex-row items-center justify-between gap-3 text-xs font-mono">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-[#666] absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search audit trail, actor, target, reason..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#181822] border border-[#2a2a3a] rounded-lg pl-9 pr-3 py-1.5 text-xs text-white focus:outline-none focus:border-purple-500 font-sans"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <span className="text-[#888]">Severity:</span>
          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            className="bg-[#181822] border border-[#2a2a3a] rounded-lg px-2.5 py-1 text-xs text-[#e2e8f0] focus:outline-none"
          >
            <option value="ALL">All Severities ({logs.length})</option>
            <option value="SECURITY_EMERGENCY">Emergency / Override</option>
            <option value="CRITICAL">Critical</option>
            <option value="WARNING">Warning</option>
            <option value="INFO">Info</option>
          </select>
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-[#121216] border border-[#262633] rounded-2xl overflow-hidden shadow-2xl">
        <div className="p-4 border-b border-[#262638] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <History className="w-4 h-4 text-purple-400" />
            <h3 className="text-sm font-bold text-white">Security & Audit Event Journal</h3>
          </div>
          <span className="text-xs font-mono text-[#888]">
            Showing {filteredLogs.length} immutable records
          </span>
        </div>

        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left text-xs font-sans">
            <thead>
              <tr className="bg-[#161622] text-[#888] font-mono border-b border-[#262638]">
                <th className="py-2.5 px-4">Timestamp (UTC)</th>
                <th className="py-2.5 px-4">Action</th>
                <th className="py-2.5 px-4">Severity</th>
                <th className="py-2.5 px-4">Actor</th>
                <th className="py-2.5 px-4">Target User</th>
                <th className="py-2.5 px-4">Details / Remediation Notes</th>
                <th className="py-2.5 px-4">Source</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1e1e28]">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-[#666] font-mono">
                    No matching audit records found.
                  </td>
                </tr>
              ) : (
                filteredLogs.map(log => (
                  <tr key={log.id} className="hover:bg-[#181824] transition-colors">
                    <td className="py-3 px-4 font-mono text-[#a1a1aa] whitespace-nowrap">
                      {log.timestamp}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className={`px-2 py-0.5 rounded-full font-mono text-[10px] border ${getActionBadge(log.actionType)}`}>
                        {log.actionType}
                      </span>
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className={`px-2 py-0.5 rounded font-mono text-[10px] border ${getSeverityBadge(log.severity)}`}>
                        {log.severity}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-semibold text-purple-300 whitespace-nowrap">
                      {log.actorUsername}
                    </td>
                    <td className="py-3 px-4 font-mono text-cyan-300 whitespace-nowrap">
                      @{log.targetUsername}
                    </td>
                    <td className="py-3 px-4 text-[#cbd5e1] max-w-md break-words">
                      {log.details}
                    </td>
                    <td className="py-3 px-4 font-mono text-[#71717a] text-[11px] whitespace-nowrap">
                      {log.ipOrSource}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
