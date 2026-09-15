// jb7572_2026-08-27: SecureCurtain Core Architecture - Diamond-Grade System Cockpit Sound System Authority & BSG Cylon Sound Engine
import React, { useState, useEffect } from 'react';
import {
  Volume2,
  VolumeX,
  Volume1,
  Music,
  Play,
  Square,
  Upload,
  RotateCcw,
  Sliders,
  CheckCircle2,
  AlertTriangle,
  Flame,
  FileCode,
  Layers,
  Sparkles,
  Terminal,
  Radio,
  Bell,
  Mail,
  HardDrive,
  Cpu,
  Lock,
  Unlock,
  FolderOpen,
  Mic,
  Eye,
  Radar,
  Rocket,
  Compass,
  Wand2
} from 'lucide-react';
import {
  soundSystemService,
  SoundEventConfig,
  SoundEventId,
  SynthPresetType,
  SOUND_SCHEMES,
  SoundScheme
} from '../../services/soundSystemService';

interface SoundSystemManagerGUIProps {
  onRunCliCommand?: (cmd: string) => void;
}

export const SoundSystemManagerGUI: React.FC<SoundSystemManagerGUIProps> = ({ onRunCliCommand }) => {
  const [events, setEvents] = useState<SoundEventConfig[]>(soundSystemService.getEvents());
  const [masterMute, setMasterMute] = useState<boolean>(soundSystemService.getMasterMute());
  const [masterVolume, setMasterVolume] = useState<number>(soundSystemService.getMasterVolume());
  const [currentScheme, setCurrentScheme] = useState<string>(soundSystemService.getCurrentScheme());
  const [activeCategory, setActiveCategory] = useState<string>('ALL');
  const [testingEventId, setTestingEventId] = useState<string | null>(null);
  const [editingCustomUrlEventId, setEditingCustomUrlEventId] = useState<string | null>(null);
  const [customUrlInput, setCustomUrlInput] = useState<string>('');
  const [bannerNotice, setBannerNotice] = useState<string | null>(null);

  // Cylon Vocoder Voice state
  const [cylonPhrase, setCylonPhrase] = useState<string>("Your system is ready, Imperious leader.");
  const [isCylonSpeaking, setIsCylonSpeaking] = useState<boolean>(false);
  const [cylonVisorStep, setCylonVisorStep] = useState<number>(0);
  const [cylonPitchMultiplier, setCylonPitchMultiplier] = useState<number>(1.0); // 1.0 = +1 Octave crisp articulation baseline
  const [cylonVolumeBoost, setCylonVolumeBoost] = useState<number>(1.35); // Boosted volume
  const [cylonEngineMode, setCylonEngineMode] = useState<'auto' | 'vocoder' | 'tts'>('auto');

  // Visor animation tick when speaking or testing
  useEffect(() => {
    let timer: NodeJS.Timeout | null = null;
    if (isCylonSpeaking) {
      timer = setInterval(() => {
        setCylonVisorStep(prev => (prev + 1) % 16);
      }, 90);
    } else {
      setCylonVisorStep(0);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isCylonSpeaking]);

  const refreshEvents = () => {
    setEvents([...soundSystemService.getEvents()]);
    setMasterMute(soundSystemService.getMasterMute());
    setMasterVolume(soundSystemService.getMasterVolume());
    setCurrentScheme(soundSystemService.getCurrentScheme());
  };

  const handleToggleMasterMute = () => {
    const next = !masterMute;
    soundSystemService.setMasterMute(next);
    setMasterMute(next);
    setBannerNotice(next ? 'All system auditory output muted (Silent Stealth Mode).' : 'Master auditory output unmuted.');
  };

  const handleMasterVolumeChange = (vol: number) => {
    soundSystemService.setMasterVolume(vol);
    setMasterVolume(vol);
  };

  const handleToggleEventMute = (id: SoundEventId) => {
    const ev = soundSystemService.getEvent(id);
    if (ev) {
      const nextState = !ev.isMuted;
      soundSystemService.setEventMute(id, nextState);
      refreshEvents();
    }
  };

  const handleEventVolumeChange = (id: SoundEventId, vol: number) => {
    soundSystemService.setEventVolume(id, vol);
    refreshEvents();
  };

  const handleEventPresetChange = (id: SoundEventId, preset: SynthPresetType) => {
    soundSystemService.setEventSynthPreset(id, preset);
    refreshEvents();
    soundSystemService.play(id);
    setBannerNotice(`Event '${id}' preset changed to '${preset}'.`);
  };

  const handleTestSound = (id: SoundEventId) => {
    setTestingEventId(id);
    soundSystemService.play(id);
    setTimeout(() => setTestingEventId(null), 1200);
  };

  const handleApplyScheme = (schemeId: string) => {
    soundSystemService.applyScheme(schemeId);
    refreshEvents();
    const scheme = SOUND_SCHEMES.find(s => s.id === schemeId);
    setBannerNotice(`Sound Scheme '${scheme?.name}' applied across all system modules.`);
    if (schemeId === 'bsg_cylon') {
      handleTriggerCylonVoice();
    }
  };

  const handleTriggerCylonVoice = (overridePhrase?: string, explicitMode?: 'auto' | 'vocoder' | 'tts') => {
    setIsCylonSpeaking(true);
    const phraseToSpeak = overridePhrase || cylonPhrase;
    const modeToUse = explicitMode || cylonEngineMode;
    soundSystemService.speakCylon(phraseToSpeak, masterVolume * cylonVolumeBoost, cylonPitchMultiplier, modeToUse);
    setTimeout(() => {
      setIsCylonSpeaking(false);
    }, 3800);
  };

  const handleTestBSGSFX = (preset: SynthPresetType, label: string) => {
    soundSystemService.synthesizeSound(preset, masterVolume);
    setBannerNotice(`BSG Tactical SFX: ${label} triggered.`);
  };

  const handleSaveCustomAudio = (id: SoundEventId) => {
    soundSystemService.setCustomAudioUrl(id, customUrlInput.trim());
    setEditingCustomUrlEventId(null);
    setCustomUrlInput('');
    refreshEvents();
    soundSystemService.play(id);
    setBannerNotice(`Custom audio source attached to '${id}'.`);
  };

  const handleFileUpload = (id: SoundEventId, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const dataUrl = event.target?.result as string;
        if (dataUrl) {
          soundSystemService.setCustomAudioUrl(id, dataUrl);
          refreshEvents();
          soundSystemService.play(id);
          setBannerNotice(`Custom audio file '${file.name}' attached to '${id}' (${(file.size / 1024).toFixed(1)} KB).`);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleResetEventAudio = (id: SoundEventId) => {
    soundSystemService.setCustomAudioUrl(id, '');
    refreshEvents();
    setBannerNotice(`Event '${id}' reset to native synthesizer engine.`);
  };

  const filteredEvents = activeCategory === 'ALL'
    ? events
    : events.filter(e => e.category === activeCategory);

  const getEventIcon = (id: SoundEventId) => {
    switch (id) {
      case 'splash_curtains': return <Sparkles className="w-4 h-4 text-[#d4af37]" />;
      case 'system_crash': return <Flame className="w-4 h-4 text-rose-500" />;
      case 'file_corrupt': return <AlertTriangle className="w-4 h-4 text-amber-400" />;
      case 'open_file': return <FolderOpen className="w-4 h-4 text-cyan-400" />;
      case 'close_file': return <Square className="w-4 h-4 text-[#8fa0b5]" />;
      case 'receive_mail': return <Mail className="w-4 h-4 text-purple-400" />;
      case 'login_success': return <Unlock className="w-4 h-4 text-emerald-400" />;
      case 'lock_screen': return <Lock className="w-4 h-4 text-sky-400" />;
      case 'threat_alert': return <Radio className="w-4 h-4 text-rose-400" />;
      case 'disk_mount': return <HardDrive className="w-4 h-4 text-emerald-400" />;
      case 'hardware_error': return <Cpu className="w-4 h-4 text-rose-400" />;
      default: return <Bell className="w-4 h-4 text-amber-400" />;
    }
  };

  const splashEvent = soundSystemService.getEvent('splash_curtains');

  return (
    <div className="space-y-4 font-mono text-xs text-[#cbd5e1]">
      {/* 1. Header Banner & Master Sound Controls */}
      <div className="p-4 rounded-xl bg-[#0c0f18] border border-[#1b2234] flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-purple-950/80 border border-purple-500/40 text-purple-300 shadow-md">
            <Volume2 className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-white">System Sound Server & Auditory Command</h3>
              <span className="text-[10px] px-2 py-0.5 rounded bg-purple-950 text-purple-300 border border-purple-500/30">
                CYLON VOCODER + WEBAUDIO MATRIX
              </span>
            </div>
            <p className="text-[11px] text-[#8fa0b5] mt-0.5">
              Centralized audio authority for stage curtain overtures, Cylon vocoder voices, emergency klaxons, and custom sound files.
            </p>
          </div>
        </div>

        {/* Master Controls */}
        <div className="flex items-center gap-3 bg-[#080b12] p-2 rounded-xl border border-[#1b2234]">
          <button
            onClick={handleToggleMasterMute}
            className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 font-bold transition-all ${
              masterMute
                ? 'bg-rose-950 text-rose-300 border border-rose-500/40'
                : 'bg-emerald-950 text-emerald-300 border border-emerald-500/40'
            }`}
          >
            {masterMute ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            <span>{masterMute ? 'ALL SOUNDS MUTED' : 'AUDIO ACTIVE'}</span>
          </button>

          <div className="flex items-center gap-2 px-2">
            <span className="text-[10px] text-[#8fa0b5]">Master:</span>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={masterVolume}
              onChange={(e) => handleMasterVolumeChange(parseFloat(e.target.value))}
              disabled={masterMute}
              className="accent-purple-500 w-24 h-1.5 bg-[#1a233a] rounded-lg cursor-pointer"
            />
            <span className="text-white font-bold text-[11px] w-8">
              {Math.round(masterVolume * 100)}%
            </span>
          </div>
        </div>
      </div>

      {bannerNotice && (
        <div className="p-2.5 rounded-xl bg-purple-950/80 border border-purple-500/40 text-purple-200 text-xs flex items-center justify-between animate-in fade-in duration-200">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-purple-400 shrink-0" />
            <span>{bannerNotice}</span>
          </div>
          <button onClick={() => setBannerNotice(null)} className="text-[#8fa0b5] hover:text-white text-xs">
            ✕
          </button>
        </div>
      )}

      {/* 2. Battlestar Galactica (BSG) Cylon Command Vocoder Station */}
      <div className="p-4 rounded-xl bg-gradient-to-r from-[#12081c] via-[#0d0f1a] to-[#12081c] border-2 border-red-900/60 shadow-xl space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-red-900/30 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-red-950/90 border border-red-500/50 text-red-400">
              <Eye className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-white text-sm">Battlestar Galactica (BSG) Cylon Command</span>
                <span className="text-[10px] px-2 py-0.2 rounded bg-red-950 text-red-300 border border-red-500/40 animate-pulse">
                  BY YOUR COMMAND
                </span>
              </div>
              <p className="text-[11px] text-[#a0aec0] mt-0.5">
                Cylon Centurion vocoder voice synthesis engine with resonant ring modulation and tactical BSG audio effects.
              </p>
            </div>
          </div>

          <button
            onClick={() => handleApplyScheme('bsg_cylon')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              currentScheme === 'bsg_cylon'
                ? 'bg-red-600 text-white shadow-lg shadow-red-600/40 border border-red-400'
                : 'bg-red-950/80 hover:bg-red-900 text-red-200 border border-red-500/40'
            }`}
          >
            <Wand2 className="w-3.5 h-3.5" />
            <span>{currentScheme === 'bsg_cylon' ? 'Active System Scheme' : 'Set as System Scheme'}</span>
          </button>
        </div>

        {/* Animated Cylon Red Eye Scanner Visor */}
        <div className="p-3 rounded-xl bg-[#06080e] border border-red-950 flex flex-col gap-2">
          <div className="flex items-center justify-between text-[10px] text-[#8fa0b5]">
            <span className="text-red-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
              <Eye className="w-3 h-3 text-red-500" />
              <span>Cylon Centurion Optical Scanner Matrix</span>
            </span>
            <span>{isCylonSpeaking ? 'VOCODER TRANSMITTING' : 'STANDBY SCAN'}</span>
          </div>

          <div className="h-6 w-full bg-black rounded-lg border border-red-900/50 flex items-center px-1 overflow-hidden relative">
            {/* 16 LED bar sweep */}
            <div className="grid grid-cols-16 w-full h-3 gap-1">
              {Array.from({ length: 16 }).map((_, idx) => {
                const activeIndex = isCylonSpeaking
                  ? (cylonVisorStep <= 8 ? cylonVisorStep * 2 : (16 - cylonVisorStep) * 2)
                  : 8;
                const distance = Math.abs(idx - activeIndex);
                const isLit = distance <= 1;
                const isTrail = distance === 2;

                return (
                  <div
                    key={idx}
                    className={`h-full rounded-sm transition-all duration-75 ${
                      isLit
                        ? 'bg-red-500 shadow-[0_0_12px_#ef4444]'
                        : isTrail
                        ? 'bg-red-900/70 shadow-[0_0_6px_#991b1b]'
                        : 'bg-red-950/20'
                    }`}
                  />
                );
              })}
            </div>
          </div>

          {/* Live Verbal Transcript Banner */}
          {isCylonSpeaking && (
            <div className="px-3 py-1.5 rounded-lg bg-red-950/90 border border-red-500/60 text-white font-mono text-[11px] flex items-center justify-between animate-pulse">
              <span className="flex items-center gap-2">
                <Mic className="w-3.5 h-3.5 text-red-400 animate-bounce" />
                <span className="text-red-300 font-bold uppercase">Transmitting Vocoder:</span>
                <span className="text-white font-bold">"{cylonPhrase}"</span>
              </span>
              <span className="text-[9px] px-1.5 py-0.2 rounded bg-red-800 text-white font-bold">
                SPEECH ACTIVE
              </span>
            </div>
          )}
        </div>

        {/* Voice Phrase Tester & Trigger Controls */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 pt-1">
          {/* Main Phrase Card */}
          <div className="lg:col-span-2 p-3 rounded-xl bg-[#0c0f18] border border-red-900/40 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-red-200 flex items-center gap-1.5">
                <Mic className="w-3.5 h-3.5 text-red-400" />
                <span>Cylon Speech Synthesizer Prompt:</span>
              </span>
              <button
                onClick={() => setCylonPhrase("Your system is ready, Imperious leader.")}
                className="text-[10px] text-[#8fa0b5] hover:text-red-300 underline"
              >
                Reset Default
              </button>
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                value={cylonPhrase}
                onChange={(e) => setCylonPhrase(e.target.value)}
                placeholder="Enter phrase for Cylon vocoder..."
                className="flex-1 bg-[#06080e] border border-red-900/60 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-red-500"
              />
              <button
                onClick={() => handleTriggerCylonVoice()}
                disabled={masterMute}
                className="px-4 py-1.5 rounded-lg bg-gradient-to-r from-red-700 to-red-900 hover:from-red-600 hover:to-red-800 disabled:opacity-40 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-red-950 transition-all shrink-0"
              >
                <Play className="w-3.5 h-3.5" />
                <span>Speak Cylon Voice</span>
              </button>
            </div>

            <div className="flex items-center gap-2 pt-1 flex-wrap">
              <span className="text-[10px] text-[#708098]">Quick Prompts:</span>
              {[
                "Your system is ready, Imperious leader.",
                "By your command.",
                "SecureCurtain operational. Threat feed active.",
                "All systems nominal, Imperious leader."
              ].map((p, i) => (
                <button
                  key={i}
                  onClick={() => {
                    setCylonPhrase(p);
                    handleTriggerCylonVoice(p);
                  }}
                  className="px-2 py-0.5 rounded bg-red-950/40 hover:bg-red-950 border border-red-900/40 text-[10px] text-red-300"
                >
                  "{p.length > 25 ? p.substring(0, 25) + '...' : p}"
                </button>
              ))}
            </div>

            {/* Voice Mode Selector & Octave Shift & Volume Boost Fine-Tuning */}
            <div className="pt-2 border-t border-red-900/30 grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Engine Mode */}
              <div className="flex flex-col gap-1">
                <div className="flex justify-between items-center text-[10px] text-red-300">
                  <span className="font-bold flex items-center gap-1">
                    <Radio className="w-3 h-3 text-red-400" />
                    <span>Vocoder Engine:</span>
                  </span>
                  <span className="font-mono text-[9px] text-red-400">
                    {cylonEngineMode === 'vocoder' ? '1978 Formant Vocoder' : cylonEngineMode === 'tts' ? 'Web Speech TTS' : 'Smart Auto/Dual'}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setCylonEngineMode('vocoder')}
                    className={`flex-1 py-1 rounded text-[10px] font-bold border transition-all text-center ${
                      cylonEngineMode === 'vocoder'
                        ? 'bg-red-600 text-white border-red-400 shadow-sm'
                        : 'bg-red-950/50 text-red-300 border-red-900/40 hover:bg-red-950'
                    }`}
                    title="Authentic 1978 BSG Formant Vocoder - Speaks real words via WebAudio resonant filters (100% reliable)"
                  >
                    1978 Vocoder
                  </button>
                  <button
                    onClick={() => setCylonEngineMode('auto')}
                    className={`flex-1 py-1 rounded text-[10px] font-bold border transition-all text-center ${
                      cylonEngineMode === 'auto'
                        ? 'bg-red-600 text-white border-red-400 shadow-sm'
                        : 'bg-red-950/50 text-red-300 border-red-900/40 hover:bg-red-950'
                    }`}
                    title="Auto Hybrid: Tries browser speech and falls back to WebAudio acoustic formant speech"
                  >
                    Auto Dual
                  </button>
                  <button
                    onClick={() => setCylonEngineMode('tts')}
                    className={`flex-1 py-1 rounded text-[10px] font-bold border transition-all text-center ${
                      cylonEngineMode === 'tts'
                        ? 'bg-red-600 text-white border-red-400 shadow-sm'
                        : 'bg-red-950/50 text-red-300 border-red-900/40 hover:bg-red-950'
                    }`}
                    title="Web Speech API TTS"
                  >
                    Speech TTS
                  </button>
                </div>
              </div>

              {/* Voice Octave / Pitch */}
              <div className="flex flex-col gap-1">
                <div className="flex justify-between items-center text-[10px] text-red-300">
                  <span className="font-bold flex items-center gap-1">
                    <Sliders className="w-3 h-3 text-red-400" />
                    <span>Pitch Octave:</span>
                  </span>
                  <span className="font-mono font-bold text-white">
                    {cylonPitchMultiplier === 1.0 ? '+1 Octave (Crisp)' : cylonPitchMultiplier > 1 ? `+${(cylonPitchMultiplier).toFixed(1)}x Pitch` : 'Deep Drone'}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setCylonPitchMultiplier(1.0)}
                    className={`flex-1 py-1 rounded text-[10px] font-bold border transition-all ${
                      cylonPitchMultiplier === 1.0
                        ? 'bg-red-600 text-white border-red-400 shadow-sm'
                        : 'bg-red-950/50 text-red-300 border-red-900/40 hover:bg-red-950'
                    }`}
                  >
                    +1 Octave
                  </button>
                  <button
                    onClick={() => setCylonPitchMultiplier(1.35)}
                    className={`flex-1 py-1 rounded text-[10px] font-bold border transition-all ${
                      cylonPitchMultiplier === 1.35
                        ? 'bg-red-600 text-white border-red-400 shadow-sm'
                        : 'bg-red-950/50 text-red-300 border-red-900/40 hover:bg-red-950'
                    }`}
                  >
                    +2 Octaves
                  </button>
                  <button
                    onClick={() => setCylonPitchMultiplier(0.55)}
                    className={`flex-1 py-1 rounded text-[10px] font-bold border transition-all ${
                      cylonPitchMultiplier === 0.55
                        ? 'bg-red-600 text-white border-red-400 shadow-sm'
                        : 'bg-red-950/50 text-red-300 border-red-900/40 hover:bg-red-950'
                    }`}
                  >
                    Deep Base
                  </button>
                </div>
              </div>

              {/* Volume Boost */}
              <div className="flex flex-col gap-1 justify-center">
                <div className="flex justify-between items-center text-[10px] text-red-300">
                  <span className="font-bold flex items-center gap-1">
                    <Volume2 className="w-3 h-3 text-red-400" />
                    <span>Voice Output Volume:</span>
                  </span>
                  <span className="font-mono font-bold text-white">{Math.round(cylonVolumeBoost * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0.5"
                  max="1.5"
                  step="0.05"
                  value={cylonVolumeBoost}
                  onChange={(e) => setCylonVolumeBoost(parseFloat(e.target.value))}
                  className="accent-red-500 w-full h-1.5 bg-[#1a0e1c] rounded-lg cursor-pointer"
                />
              </div>
            </div>
          </div>

          {/* BSG SFX Tactical Grid */}
          <div className="p-3 rounded-xl bg-[#0c0f18] border border-red-900/40 space-y-2">
            <span className="text-xs font-bold text-red-200 flex items-center gap-1.5">
              <Radar className="w-3.5 h-3.5 text-red-400" />
              <span>BSG Tactical SFX Bank:</span>
            </span>

            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => handleTestBSGSFX('cylon_eye_sweep', 'Cylon Scanner Sweep')}
                className="p-2 rounded-lg bg-[#140b1a] hover:bg-red-950 border border-red-900/50 text-left text-[11px] text-red-200 transition-all"
              >
                <div className="font-bold flex items-center gap-1">
                  <Eye className="w-3 h-3 text-red-400" />
                  <span>Scanner Sweep</span>
                </div>
                <div className="text-[9px] text-[#8fa0b5]">Visor carrier wa-wo</div>
              </button>

              <button
                onClick={() => handleTestBSGSFX('dradis_contact', 'DRADIS Sonar Contact')}
                className="p-2 rounded-lg bg-[#140b1a] hover:bg-red-950 border border-red-900/50 text-left text-[11px] text-cyan-200 transition-all"
              >
                <div className="font-bold flex items-center gap-1">
                  <Radar className="w-3 h-3 text-cyan-400" />
                  <span>DRADIS Contact</span>
                </div>
                <div className="text-[9px] text-[#8fa0b5]">Tactical sonar pip</div>
              </button>

              <button
                onClick={() => handleTestBSGSFX('ftl_jump', 'FTL Jump Displacement')}
                className="p-2 rounded-lg bg-[#140b1a] hover:bg-red-950 border border-red-900/50 text-left text-[11px] text-purple-200 transition-all"
              >
                <div className="font-bold flex items-center gap-1">
                  <Compass className="w-3 h-3 text-purple-400" />
                  <span>FTL Jump</span>
                </div>
                <div className="text-[9px] text-[#8fa0b5]">Sub-bass cavitation</div>
              </button>

              <button
                onClick={() => handleTestBSGSFX('viper_launch', 'Viper Launch Thruster')}
                className="p-2 rounded-lg bg-[#140b1a] hover:bg-red-950 border border-red-900/50 text-left text-[11px] text-amber-200 transition-all"
              >
                <div className="font-bold flex items-center gap-1">
                  <Rocket className="w-3 h-3 text-amber-400" />
                  <span>Viper Launch</span>
                </div>
                <div className="text-[9px] text-[#8fa0b5]">Catapult turbo blast</div>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Curtains Splash & Boot Overture Manager Card */}
      {splashEvent && (
        <div className="p-4 rounded-xl bg-[#0c0f18] border border-amber-500/30 shadow-lg space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#1b2234] pb-2">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-amber-950/80 border border-amber-500/40 text-amber-400">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <span className="font-bold text-white text-xs">Stage Curtain Reveal Splash & Overture Sound</span>
                <p className="text-[10px] text-[#8fa0b5]">
                  Sound played as the royal purple velvet & gold curtains part upon desktop load (up to 30s).
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => handleTestSound('splash_curtains')}
                disabled={masterMute || splashEvent.isMuted}
                className="px-3 py-1 rounded-lg bg-amber-600 hover:bg-amber-500 text-black font-bold text-xs flex items-center gap-1.5 shadow-md transition-all"
              >
                <Play className="w-3 h-3" />
                <span>Test Overture</span>
              </button>

              <button
                onClick={() => handleToggleEventMute('splash_curtains')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold border transition-all ${
                  splashEvent.isMuted
                    ? 'bg-rose-950 text-rose-300 border-rose-500/40'
                    : 'bg-[#161d2d] text-[#8fa0b5] border-[#243048]'
                }`}
              >
                {splashEvent.isMuted ? 'MUTED' : 'UNMUTED'}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-center">
            {/* Preset Selector */}
            <div>
              <span className="text-[10px] text-[#8fa0b5] block mb-1">Synthesizer Preset:</span>
              <select
                value={splashEvent.synthPreset}
                onChange={(e) => handleEventPresetChange('splash_curtains', e.target.value as SynthPresetType)}
                className="w-full bg-[#080b12] border border-[#232f4b] rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-amber-400"
              >
                <option value="cylon_voice_ready">BSG Cylon: "Your system is ready, Imperious leader"</option>
                <option value="brass_fanfare">Grand Theatrical Brass & Orchestral Fanfare</option>
                <option value="cylon_eye_sweep">BSG Cylon Red-Eye Scanner Sweep</option>
                <option value="ftl_jump">BSG FTL Jump Displacement</option>
                <option value="spinup_tone">Cyberpunk Neon Analog Spinup</option>
                <option value="rising_harmony">Starfleet Harmonic Chime</option>
              </select>
            </div>

            {/* Custom Audio Attached or Upload */}
            <div>
              <span className="text-[10px] text-[#8fa0b5] block mb-1">Custom File (URL or Upload):</span>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setEditingCustomUrlEventId(editingCustomUrlEventId === 'splash_curtains' ? null : 'splash_curtains');
                    setCustomUrlInput(splashEvent.customAudioUrl || '');
                  }}
                  className="flex-1 px-3 py-1.5 rounded-lg bg-[#141b2c] hover:bg-[#1e273e] border border-[#232f48] text-xs text-amber-300 font-bold truncate text-left"
                >
                  {splashEvent.customAudioUrl ? 'Edit Custom Audio File' : '+ Attach Custom MP3 / WAV'}
                </button>
              </div>
            </div>

            {/* Volume */}
            <div>
              <div className="flex justify-between text-[10px] text-[#8fa0b5] mb-1">
                <span>Overture Volume:</span>
                <span className="text-white font-bold">{Math.round(splashEvent.volume * 100)}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={splashEvent.volume}
                disabled={splashEvent.isMuted}
                onChange={(e) => handleEventVolumeChange('splash_curtains', parseFloat(e.target.value))}
                className="w-full accent-amber-500 h-1.5 bg-[#1a233a] rounded-lg cursor-pointer"
              />
            </div>
          </div>

          {/* Drawer for Custom Splash URL */}
          {editingCustomUrlEventId === 'splash_curtains' && (
            <div className="p-3 rounded-xl bg-[#080b12] border border-[#232f4b] space-y-2 mt-2">
              <div className="flex justify-between text-[11px]">
                <span className="text-[#8fa0b5]">Provide MP3/WAV URL or Upload Local Audio File:</span>
                {splashEvent.customAudioUrl && (
                  <button
                    onClick={() => handleResetEventAudio('splash_curtains')}
                    className="text-amber-400 hover:underline text-[10px] flex items-center gap-1"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Reset to Built-In Sound</span>
                  </button>
                )}
              </div>

              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="https://cdn.example.com/curtains-overture.mp3"
                  value={customUrlInput}
                  onChange={(e) => setCustomUrlInput(e.target.value)}
                  className="flex-1 bg-[#05070d] border border-[#232f4b] rounded-lg px-2.5 py-1 text-xs text-white focus:outline-none focus:border-amber-400"
                />
                <button
                  onClick={() => handleSaveCustomAudio('splash_curtains')}
                  className="px-3 py-1 bg-amber-600 hover:bg-amber-500 text-black font-bold rounded-lg text-xs"
                >
                  Save URL
                </button>
              </div>

              <div className="flex items-center gap-3 pt-1">
                <span className="text-[10px] text-[#708098]">Or Upload File:</span>
                <label className="px-3 py-1 rounded bg-[#172033] hover:bg-[#202c46] border border-[#2a3a5c] text-amber-300 text-[10px] cursor-pointer flex items-center gap-1.5">
                  <Upload className="w-3 h-3" />
                  <span>Choose Audio File (Max 30s)</span>
                  <input
                    type="file"
                    accept="audio/*"
                    onChange={(e) => handleFileUpload('splash_curtains', e)}
                    className="hidden"
                  />
                </label>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 4. Sound Schemes Preset Switching */}
      <div className="p-4 rounded-xl bg-[#0c0f18] border border-[#1b2234] space-y-3">
        <div className="flex items-center justify-between border-b border-[#1b2234] pb-2">
          <span className="font-bold text-white flex items-center gap-2">
            <Music className="w-4 h-4 text-purple-400" />
            <span>Auditory Themes & Sound Schemes</span>
          </span>
          <span className="text-[10px] text-[#8fa0b5]">Global System Profiles</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {SOUND_SCHEMES.map(scheme => (
            <div
              key={scheme.id}
              onClick={() => handleApplyScheme(scheme.id)}
              className={`p-3 rounded-xl border cursor-pointer transition-all ${
                currentScheme === scheme.id
                  ? scheme.id === 'bsg_cylon'
                    ? 'bg-red-950/80 border-red-500 shadow-lg shadow-red-950/50'
                    : 'bg-purple-950/80 border-purple-400 shadow-lg shadow-purple-950/50'
                  : 'bg-[#101422] border-[#1e273e] hover:border-purple-500/40'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-white font-bold text-xs">{scheme.name}</span>
                {currentScheme === scheme.id && (
                  <span className={`text-[9px] px-1.5 py-0.2 rounded text-white font-bold ${
                    scheme.id === 'bsg_cylon' ? 'bg-red-600' : 'bg-purple-600'
                  }`}>
                    ACTIVE
                  </span>
                )}
              </div>
              <p className="text-[10px] text-[#8fa0b5] leading-relaxed">{scheme.description}</p>
              {scheme.tagline && (
                <div className="mt-2 text-[9px] text-[#708098] font-bold uppercase tracking-wider">
                  [{scheme.tagline}]
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* 5. Category Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {['ALL', 'System Lifecycle', 'Filesystem & I/O', 'Forensic & Security', 'UI & Feedback'].map(cat => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-all ${
              activeCategory === cat
                ? 'bg-purple-950 text-purple-200 border border-purple-500/50 font-bold'
                : 'bg-[#0f1424] text-[#8fa0b5] hover:text-white border border-[#1e273e]'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* 6. Sound Events Table & Mixer Matrix */}
      <div className="p-4 rounded-xl bg-[#0c0f18] border border-[#1b2234] space-y-3">
        <div className="flex items-center justify-between border-b border-[#1b2234] pb-2 text-[11px] text-[#708098]">
          <span>EVENT & DESCRIPTOR</span>
          <span>PRESET, CONTROLS & CUSTOM AUDIO</span>
        </div>

        <div className="space-y-2.5">
          {filteredEvents.map(event => (
            <div
              key={event.id}
              className={`p-3.5 rounded-xl border transition-all ${
                event.isMuted
                  ? 'bg-[#080b12] border-[#151c2c] opacity-60'
                  : 'bg-[#101424] border-[#1e273e]'
              }`}
            >
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                {/* Left Event Info */}
                <div className="flex items-start gap-3 min-w-0">
                  <div className="p-2 rounded-lg bg-[#080b12] border border-[#1b2234] shrink-0 mt-0.5">
                    {getEventIcon(event.id)}
                  </div>
                  <div className="space-y-0.5 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-white font-bold text-xs">{event.name}</span>
                      <span className="text-[10px] px-2 py-0.2 rounded bg-[#172033] text-purple-300">
                        {event.category}
                      </span>
                      {event.customAudioUrl && (
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-950 text-amber-300 border border-amber-500/30">
                          Custom Audio Attached
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] text-[#8fa0b5]">{event.description}</p>
                  </div>
                </div>

                {/* Right Controls */}
                <div className="flex items-center gap-2.5 flex-wrap shrink-0">
                  {/* Preset Dropdown */}
                  <select
                    value={event.synthPreset}
                    onChange={(e) => handleEventPresetChange(event.id, e.target.value as SynthPresetType)}
                    className="bg-[#090d18] border border-[#232f4b] rounded-lg px-2 py-1 text-[11px] text-[#cbd5e1] focus:outline-none focus:border-purple-400"
                  >
                    <option value="cylon_voice_ready">Cylon Voice Ready</option>
                    <option value="cylon_eye_sweep">Cylon Scanner Sweep</option>
                    <option value="dradis_contact">DRADIS Contact Ping</option>
                    <option value="ftl_jump">FTL Jump Sub-Bass</option>
                    <option value="viper_launch">Viper Launch Tube</option>
                    <option value="brass_fanfare">Brass Fanfare</option>
                    <option value="klaxon_siren">Klaxon Siren</option>
                    <option value="glitch_buzz">Glitch CRC Buzz</option>
                    <option value="crystal_chime">Crystal Glass Chime</option>
                    <option value="soft_click">Soft Click</option>
                    <option value="solenoid_lock">Solenoid Bolt</option>
                    <option value="envelope_swish">Envelope Swish</option>
                    <option value="rising_harmony">Rising Harmony</option>
                    <option value="spinup_tone">Drive Spinup Tone</option>
                    <option value="beep_confirm">Beep Confirm</option>
                  </select>

                  {/* Volume Slider */}
                  <div className="flex items-center gap-1.5">
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.05"
                      value={event.volume}
                      disabled={event.isMuted}
                      onChange={(e) => handleEventVolumeChange(event.id, parseFloat(e.target.value))}
                      className="accent-purple-500 w-16 sm:w-20 h-1.5 bg-[#1a233a] rounded-lg cursor-pointer"
                    />
                    <span className="text-[10px] text-[#8fa0b5] w-6">{Math.round(event.volume * 100)}%</span>
                  </div>

                  {/* Play / Test Button */}
                  <button
                    onClick={() => handleTestSound(event.id)}
                    disabled={masterMute || event.isMuted}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
                      testingEventId === event.id
                        ? 'bg-emerald-500 text-black shadow-lg shadow-emerald-500/40'
                        : 'bg-purple-600 hover:bg-purple-500 disabled:opacity-40 text-white'
                    }`}
                  >
                    <Play className="w-3 h-3" />
                    <span>Test</span>
                  </button>

                  {/* Individual Mute Toggle */}
                  <button
                    onClick={() => handleToggleEventMute(event.id)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-all ${
                      event.isMuted
                        ? 'bg-rose-950 text-rose-300 border-rose-500/40'
                        : 'bg-[#161d2d] text-[#8fa0b5] hover:text-white border-[#243048]'
                    }`}
                  >
                    {event.isMuted ? 'MUTED' : 'UNMUTED'}
                  </button>

                  {/* Change Audio File */}
                  <button
                    onClick={() => {
                      if (editingCustomUrlEventId === event.id) {
                        setEditingCustomUrlEventId(null);
                      } else {
                        setEditingCustomUrlEventId(event.id);
                        setCustomUrlInput(event.customAudioUrl || '');
                      }
                    }}
                    className="px-2 py-1 rounded-lg bg-[#141b2c] hover:bg-[#1e273e] text-[10px] text-sky-300 border border-[#232f48]"
                  >
                    {event.customAudioUrl ? 'Edit File' : 'Attach File'}
                  </button>
                </div>
              </div>

              {/* Edit Custom URL Drawer */}
              {editingCustomUrlEventId === event.id && (
                <div className="mt-3 pt-3 border-t border-[#1e273e] space-y-2 animate-in fade-in duration-150">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-[#8fa0b5]">Custom MP3 / WAV URL for {event.name}:</span>
                    {event.customAudioUrl && (
                      <button
                        onClick={() => handleResetEventAudio(event.id)}
                        className="text-amber-400 hover:underline text-[10px] flex items-center gap-1"
                      >
                        <RotateCcw className="w-3 h-3" />
                        <span>Reset to Synth Default</span>
                      </button>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="https://example.com/audio.mp3"
                      value={customUrlInput}
                      onChange={(e) => setCustomUrlInput(e.target.value)}
                      className="flex-1 bg-[#090c15] border border-[#232f4b] rounded-lg px-2.5 py-1 text-xs text-white focus:outline-none focus:border-purple-400"
                    />
                    <button
                      onClick={() => handleSaveCustomAudio(event.id)}
                      className="px-3 py-1 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-lg text-xs"
                    >
                      Save
                    </button>
                  </div>

                  <div className="pt-1 flex items-center gap-3">
                    <span className="text-[10px] text-[#708098]">Or Upload Local File:</span>
                    <label className="px-2.5 py-1 rounded bg-[#172033] hover:bg-[#202c46] border border-[#2a3a5c] text-sky-300 text-[10px] cursor-pointer flex items-center gap-1.5">
                      <Upload className="w-3 h-3" />
                      <span>Choose File (Max 30s)</span>
                      <input
                        type="file"
                        accept="audio/*"
                        onChange={(e) => handleFileUpload(event.id, e)}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
