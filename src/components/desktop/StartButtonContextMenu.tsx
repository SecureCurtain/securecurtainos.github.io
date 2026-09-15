// jb7572_2026-08-27: SecureCurtain Core Architecture - Start Menu Right-Click Power Context Menu
import React, { useEffect, useRef } from 'react';
import { useDesktop } from '../../context/DesktopContext';
import { AppId } from '../../types/desktop';
import { 
  Zap, 
  Activity, 
  Cpu, 
  HardDrive, 
  ShieldCheck, 
  Settings, 
  Terminal, 
  Folder, 
  Palette, 
  Binary, 
  Package, 
  Search, 
  Lock, 
  Power, 
  RotateCcw, 
  User, 
  LogOut, 
  Trash2
} from 'lucide-react';

interface StartButtonContextMenuProps {
  x: number;
  y: number;
  onClose: () => void;
}

export const StartButtonContextMenu: React.FC<StartButtonContextMenuProps> = ({ x, y, onClose }) => {
  const { 
    openApp, 
    personality, 
    setPersonality, 
    themeConfig, 
    lockSession, 
    rebootOS, 
    addNotification,
    toggleStartMenu,
  } = useDesktop();

  const menuRef = useRef<HTMLDivElement | null>(null);

  // Close on outside click with safe delay so initial contextmenu event doesn't immediately dismiss
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    const handleDown = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    
    timeoutId = setTimeout(() => {
      window.addEventListener('mousedown', handleDown);
    }, 100);

    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener('mousedown', handleDown);
    };
  }, [onClose]);

  // Ensure menu stays on screen
  const menuWidth = 280;
  const isBottom = y > window.innerHeight / 2;
  const adjustedX = Math.max(12, Math.min(x, window.innerWidth - menuWidth - 12));

  const handleAction = (callback: () => void) => {
    callback();
    onClose();
  };

  const handleLaunch = (appId: AppId, title?: string) => {
    toggleStartMenu(false);
    openApp(appId, title);
    onClose();
  };

  return (
    <div
      ref={menuRef}
      onClick={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.stopPropagation()}
      onContextMenu={(e) => { e.preventDefault(); e.stopPropagation(); }}
      style={{
        left: `${adjustedX}px`,
        ...(isBottom ? { bottom: '56px' } : { top: '56px' }),
        backgroundColor: 'rgba(12, 14, 22, 0.96)',
        borderColor: themeConfig.accentHex,
        boxShadow: `0 20px 50px rgba(0, 0, 0, 0.85), 0 0 25px ${themeConfig.accentHex}40`
      }}
      className="fixed z-[9999] w-[280px] rounded-2xl border shadow-2xl p-1.5 backdrop-blur-2xl text-xs font-sans select-none animate-in fade-in zoom-in-95 duration-150 space-y-0.5 overflow-y-auto max-h-[calc(100vh-70px)]"
    >
      {/* 1. TOP PROMINENT MISSION CONTROL COCKPIT LINK */}
      <button
        onClick={() => handleLaunch('health-hud', 'Mission Control Cockpit')}
        className="w-full px-3 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold flex items-center justify-between shadow-md transition-all group"
      >
        <div className="flex items-center gap-2.5">
          <Zap className="w-4 h-4 text-amber-300 animate-pulse" />
          <span className="text-xs tracking-wide">Mission Control Cockpit</span>
        </div>
        <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-white/20 text-white uppercase font-bold">
          All Apps
        </span>
      </button>

      <div className="h-px bg-white/10 my-1" />

      {/* 2. System Utilities & Subsystems */}
      <div className="text-[9px] uppercase tracking-wider text-purple-400/80 font-bold px-2 py-0.5">
        Subsystem Utilities
      </div>

      <button
        onClick={() => handleLaunch('recycle-bin', 'Recycle Bin & Trash')}
        className="w-full px-2.5 py-1.5 rounded-xl hover:bg-rose-500/20 text-rose-300 flex items-center gap-2 text-left transition-colors font-semibold"
      >
        <Trash2 className="w-3.5 h-3.5 text-rose-400" />
        <span>Recycle Bin (~/.local/share/Trash)</span>
      </button>

      <button
        onClick={() => handleLaunch('task-manager')}
        className="w-full px-2.5 py-1.5 rounded-xl hover:bg-white/10 text-white flex items-center gap-2 text-left transition-colors"
      >
        <Activity className="w-3.5 h-3.5 text-emerald-400" />
        <span>Task Manager & Processes</span>
      </button>

      <button
        onClick={() => handleLaunch('memory-debugger')}
        className="w-full px-2.5 py-1.5 rounded-xl hover:bg-white/10 text-white flex items-center gap-2 text-left transition-colors"
      >
        <Binary className="w-3.5 h-3.5 text-purple-400" />
        <span>Memory & GDB Debugger</span>
      </button>

      <button
        onClick={() => handleLaunch('storage-mgmt')}
        className="w-full px-2.5 py-1.5 rounded-xl hover:bg-white/10 text-white flex items-center gap-2 text-left transition-colors"
      >
        <HardDrive className="w-3.5 h-3.5 text-blue-400" />
        <span>Disk & Storage Management</span>
      </button>

      <button
        onClick={() => handleLaunch('network-security')}
        className="w-full px-2.5 py-1.5 rounded-xl hover:bg-white/10 text-white flex items-center gap-2 text-left transition-colors"
      >
        <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
        <span>Network & Firewall Matrix</span>
      </button>

      <button
        onClick={() => handleLaunch('system-config')}
        className="w-full px-2.5 py-1.5 rounded-xl hover:bg-white/10 text-white flex items-center gap-2 text-left transition-colors"
      >
        <Settings className="w-3.5 h-3.5 text-amber-400" />
        <span>Services, sysctl & Config</span>
      </button>

      <button
        onClick={() => handleLaunch('hardware-logs')}
        className="w-full px-2.5 py-1.5 rounded-xl hover:bg-white/10 text-white flex items-center gap-2 text-left transition-colors"
      >
        <Cpu className="w-3.5 h-3.5 text-rose-400" />
        <span>Devices & Kernel Journal</span>
      </button>

      <button
        onClick={() => handleLaunch('package-features')}
        className="w-full px-2.5 py-1.5 rounded-xl hover:bg-white/10 text-white flex items-center gap-2 text-left transition-colors"
      >
        <Package className="w-3.5 h-3.5 text-indigo-400" />
        <span>App & Package Hub</span>
      </button>

      <button
        onClick={() => handleLaunch('terminal')}
        className="w-full px-2.5 py-1.5 rounded-xl hover:bg-white/10 text-white flex items-center gap-2 text-left transition-colors"
      >
        <Terminal className="w-3.5 h-3.5 text-sky-400" />
        <span>Terminal (Admin Shell)</span>
      </button>

      <button
        onClick={() => handleLaunch('file-explorer')}
        className="w-full px-2.5 py-1.5 rounded-xl hover:bg-white/10 text-white flex items-center gap-2 text-left transition-colors"
      >
        <Folder className="w-3.5 h-3.5 text-yellow-400" />
        <span>File Explorer (/sys)</span>
      </button>

      <button
        onClick={() => handleLaunch('theme-studio')}
        className="w-full px-2.5 py-1.5 rounded-xl hover:bg-white/10 text-white flex items-center gap-2 text-left transition-colors"
      >
        <Palette className="w-3.5 h-3.5 text-pink-400" />
        <span>Theme Studio & Docks</span>
      </button>

      <div className="h-px bg-white/10 my-1" />

      {/* 3. Session & Power Actions */}
      <div className="text-[9px] uppercase tracking-wider text-[#888] font-bold px-2 py-0.5">
        Session & Power
      </div>

      <button
        onClick={() => handleAction(() => {
          const next = personality === 'linux' ? 'windows' : personality === 'windows' ? 'hybrid' : 'linux';
          setPersonality(next);
          addNotification({
            title: 'Persona Switched',
            message: `Active persona changed to ${next.toUpperCase()}`,
            type: 'info'
          });
        })}
        className="w-full px-2.5 py-1.5 rounded-xl hover:bg-white/10 text-white flex items-center gap-2 text-left transition-colors"
      >
        <User className="w-3.5 h-3.5 text-cyan-400" />
        <span>Change User / Persona ({personality})</span>
      </button>

      <button
        onClick={() => handleAction(() => {
          lockSession();
          addNotification({
            title: 'Session Locked',
            message: 'Screen locked. Authenticate to return.',
            type: 'info'
          });
        })}
        className="w-full px-2.5 py-1.5 rounded-xl hover:bg-white/10 text-white flex items-center gap-2 text-left transition-colors"
      >
        <Lock className="w-3.5 h-3.5 text-purple-400" />
        <span>Lock Session</span>
      </button>

      <button
        onClick={() => handleAction(() => {
          rebootOS();
        })}
        className="w-full px-2.5 py-1.5 rounded-xl hover:bg-amber-500/20 text-amber-300 flex items-center gap-2 text-left transition-colors"
      >
        <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
        <span>Restart / Reboot OS</span>
      </button>

      <button
        onClick={() => handleAction(() => {
          addNotification({
            title: 'System Shutting Down',
            message: 'All Ring 0 subsystems safely unmounted.',
            type: 'warning'
          });
          setTimeout(() => lockSession(), 1000);
        })}
        className="w-full px-2.5 py-1.5 rounded-xl hover:bg-red-500/20 text-red-300 flex items-center gap-2 text-left transition-colors"
      >
        <Power className="w-3.5 h-3.5 text-red-400" />
        <span>Power Off / Shutdown</span>
      </button>

      <button
        onClick={() => handleAction(() => {
          lockSession();
          addNotification({
            title: 'Logged Out',
            message: 'Logged out from Architect Root account.',
            type: 'info'
          });
        })}
        className="w-full px-2.5 py-1.5 rounded-xl hover:bg-white/10 text-[#94a3b8] hover:text-white flex items-center gap-2 text-left transition-colors"
      >
        <LogOut className="w-3.5 h-3.5 text-[#94a3b8]" />
        <span>Log Off</span>
      </button>
    </div>
  );
};
