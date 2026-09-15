// jb7572_2026-08-25: Quick Settings & Action Center Flyout

import React, { useState, useEffect } from 'react';
import { useDesktop } from '../../context/DesktopContext';
import { VISUAL_THEMES } from '../../data/desktopThemes';
import { soundSystemService } from '../../services/soundSystemService';
import { 
  Wifi, 
  Volume2, 
  Bluetooth, 
  Moon, 
  Sun, 
  Zap, 
  ShieldCheck, 
  Sliders, 
  Bell, 
  Trash2, 
  CheckCircle2, 
  AlertTriangle,
  Info,
  Palette,
  Monitor
} from 'lucide-react';

export const QuickSettingsFlyout: React.FC = () => {
  const { 
    personality, 
    setPersonality, 
    visualTheme, 
    setVisualTheme, 
    themeConfig, 
    isQuickSettingsOpen, 
    toggleQuickSettings,
    notifications,
    clearAllNotifications,
    openApp,
    screenBrightness,
    setScreenBrightness
  } = useDesktop();

  const [volume, setVolume] = useState<number>(() => Math.round(soundSystemService.getMasterVolume() * 100));
  const [wifiEnabled, setWifiEnabled] = useState<boolean>(true);
  const [bluetoothEnabled, setBluetoothEnabled] = useState<boolean>(true);
  const [powerMode, setPowerMode] = useState<'perf' | 'balanced' | 'eco'>('perf');

  useEffect(() => {
    setVolume(Math.round(soundSystemService.getMasterVolume() * 100));
  }, [isQuickSettingsOpen]);

  const handleVolumeChange = (newVolPercent: number) => {
    setVolume(newVolPercent);
    soundSystemService.setMasterVolume(newVolPercent / 100);
  };

  if (!isQuickSettingsOpen) return null;

  return (
    <div
      onClick={(e) => e.stopPropagation()}
      className="absolute bottom-14 right-3 w-[380px] sm:w-[420px] rounded-3xl border shadow-2xl z-50 flex flex-col overflow-hidden backdrop-blur-2xl transition-all font-sans select-none animate-in fade-in zoom-in-95 duration-150 p-4 space-y-4"
      style={{
        backgroundColor: themeConfig.windowBg,
        borderColor: themeConfig.accentHex,
        boxShadow: `0 25px 50px -12px rgba(0, 0, 0, 0.8), 0 0 30px ${themeConfig.accentHex}33`
      }}
    >
      {/* Quick Action Tiles */}
      <div className="grid grid-cols-3 gap-2">
        {/* Wi-Fi */}
        <button
          onClick={() => setWifiEnabled(prev => !prev)}
          className={`p-3 rounded-2xl border text-left transition-all ${
            wifiEnabled
              ? 'bg-sky-600 border-sky-400 text-white shadow-md'
              : 'bg-white/5 border-white/10 text-white/50'
          }`}
        >
          <Wifi className="w-5 h-5 mb-1.5" />
          <div className="font-semibold text-xs leading-none">Wi-Fi</div>
          <span className="text-[10px] opacity-80">{wifiEnabled ? 'e1000-vlan' : 'Disabled'}</span>
        </button>

        {/* Bluetooth */}
        <button
          onClick={() => setBluetoothEnabled(prev => !prev)}
          className={`p-3 rounded-2xl border text-left transition-all ${
            bluetoothEnabled
              ? 'bg-indigo-600 border-indigo-400 text-white shadow-md'
              : 'bg-white/5 border-white/10 text-white/50'
          }`}
        >
          <Bluetooth className="w-5 h-5 mb-1.5" />
          <div className="font-semibold text-xs leading-none">Bluetooth</div>
          <span className="text-[10px] opacity-80">{bluetoothEnabled ? 'HCI Active' : 'Off'}</span>
        </button>

        {/* Power Profile */}
        <button
          onClick={() => {
            const next = powerMode === 'perf' ? 'balanced' : powerMode === 'balanced' ? 'eco' : 'perf';
            setPowerMode(next);
          }}
          className="p-3 rounded-2xl bg-purple-600 border border-purple-400 text-white shadow-md text-left transition-all"
        >
          <Zap className="w-5 h-5 mb-1.5" />
          <div className="font-semibold text-xs leading-none">Governor</div>
          <span className="text-[10px] opacity-80 uppercase">{powerMode}</span>
        </button>
      </div>

      {/* Sliders: Volume & Brightness */}
      <div className="p-3.5 rounded-2xl bg-black/30 border border-white/5 space-y-3">
        {/* Volume */}
        <div className="flex items-center gap-3">
          <Volume2 className="w-4 h-4 text-white/70 shrink-0" />
          <input
            type="range"
            min="0"
            max="100"
            value={volume}
            onChange={(e) => handleVolumeChange(Number(e.target.value))}
            className="flex-1 accent-purple-500 cursor-pointer h-1.5 bg-white/20 rounded-lg"
          />
          <span className="text-xs font-mono text-white/80 w-8 text-right">{volume}%</span>
        </div>

        {/* Brightness */}
        <div className="flex items-center gap-3">
          <Sun className="w-4 h-4 text-white/70 shrink-0" />
          <input
            type="range"
            min="10"
            max="100"
            value={screenBrightness}
            onChange={(e) => setScreenBrightness(Number(e.target.value))}
            className="flex-1 accent-sky-500 cursor-pointer h-1.5 bg-white/20 rounded-lg"
          />
          <span className="text-xs font-mono text-white/80 w-8 text-right">{screenBrightness}%</span>
        </div>
      </div>

      {/* OS Personality & Theme Quick Switches */}
      <div className="grid grid-cols-2 gap-2">
        <button
          onClick={() => {
            const next = personality === 'linux' ? 'windows' : personality === 'windows' ? 'hybrid' : 'linux';
            setPersonality(next);
          }}
          className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-between text-left transition-all"
        >
          <div>
            <span className="text-[9px] uppercase tracking-widest text-white/50 block">OS PERSONA</span>
            <span className="font-bold text-xs text-white capitalize">{personality} Mode</span>
          </div>
          <Monitor className="w-4 h-4 text-purple-400" />
        </button>

        <button
          onClick={() => {
            openApp('theme-studio');
            toggleQuickSettings(false);
          }}
          className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-between text-left transition-all"
        >
          <div>
            <span className="text-[9px] uppercase tracking-widest text-white/50 block">VISUAL THEME</span>
            <span className="font-bold text-xs text-white truncate max-w-[100px] block">{themeConfig.name}</span>
          </div>
          <Palette className="w-4 h-4 text-sky-400" />
        </button>
      </div>

      {/* Notifications Drawer */}
      <div className="space-y-2 border-t border-white/10 pt-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-white">
            <Bell className="w-3.5 h-3.5 text-purple-400" />
            <span>Subsystem Notifications</span>
          </div>
          {notifications.length > 0 && (
            <button
              onClick={clearAllNotifications}
              className="text-[10px] font-mono text-white/50 hover:text-red-400 flex items-center gap-1 transition-colors"
            >
              <Trash2 className="w-3 h-3" />
              Clear
            </button>
          )}
        </div>

        <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
          {notifications.length === 0 ? (
            <div className="py-4 text-center text-white/40 text-[11px] font-mono">
              No new alerts. All systems nominal.
            </div>
          ) : (
            notifications.map((notif) => (
              <div
                key={notif.id}
                className="p-2.5 rounded-xl bg-white/5 border border-white/5 space-y-1 text-xs"
              >
                <div className="flex items-center justify-between font-semibold text-white">
                  <span className="truncate">{notif.title}</span>
                  <span className="text-[9px] font-mono text-white/40">{notif.timestamp}</span>
                </div>
                <p className="text-[11px] text-white/70 leading-tight">{notif.message}</p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
