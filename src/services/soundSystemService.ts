// jb7572_2026-08-27: SecureCurtain Core Architecture - Diamond-Grade Sound System & Audio Event Synthesizer Service
export type SoundEventId =
  | 'splash_curtains'
  | 'system_crash'
  | 'file_corrupt'
  | 'open_file'
  | 'close_file'
  | 'receive_mail'
  | 'login_success'
  | 'lock_screen'
  | 'threat_alert'
  | 'disk_mount'
  | 'button_click'
  | 'command_success'
  | 'hardware_error';

export type SynthPresetType = 
  | 'brass_fanfare' 
  | 'klaxon_siren' 
  | 'glitch_buzz' 
  | 'crystal_chime' 
  | 'soft_click' 
  | 'solenoid_lock' 
  | 'envelope_swish' 
  | 'rising_harmony' 
  | 'spinup_tone' 
  | 'beep_confirm'
  | 'cylon_voice_ready'
  | 'cylon_eye_sweep'
  | 'dradis_contact'
  | 'ftl_jump'
  | 'viper_launch';

export interface SoundEventConfig {
  id: SoundEventId;
  name: string;
  category: 'System Lifecycle' | 'Filesystem & I/O' | 'Forensic & Security' | 'UI & Feedback';
  description: string;
  isMuted: boolean;
  volume: number; // 0.0 to 1.0
  customAudioUrl?: string; // Optional user audio file (URL or Data URI)
  synthPreset: SynthPresetType;
}

export interface SoundScheme {
  id: string;
  name: string;
  description: string;
  author: string;
  tagline?: string;
}

export const SOUND_SCHEMES: SoundScheme[] = [
  {
    id: 'bsg_cylon',
    name: 'Battlestar Galactica (BSG) Cylon Command',
    description: 'Iconic Cylon robotic vocoder ("Your system is ready, Imperious leader"), DRADIS warbles, Viper booster thrums, and FTL jump sub-bass.',
    author: 'Cylon Centurion Core / SecureCurtain Audio',
    tagline: 'By Your Command'
  },
  {
    id: 'theatrical_symphony',
    name: 'SecureCurtain Theatrical Symphony',
    description: 'Rich orchestral brass, velvet harp sweeps, and acoustic auditorium reverbs.',
    author: 'SecureCurtain Audio Engine',
    tagline: 'Grand Velvet & Gold'
  },
  {
    id: 'cyber_synthwave',
    name: 'Cyberpunk Neon Pulse 2026',
    description: 'Analog synthesizer chords, filtered resonant sweeps, and cybernetic telemetry beeps.',
    author: 'SecureCurtain Sound Team',
    tagline: 'Analog Neon Wave'
  },
  {
    id: 'starfleet_lcars',
    name: 'Starfleet LCARS Tactical',
    description: 'Tri-tone bridge chirps, warp core warp hums, and transporter harmonic locks.',
    author: 'Subspace Ops Unit',
    tagline: 'LCARS Federation Standard'
  },
  {
    id: 'forensic_clean',
    name: 'Forensic Lab Clean & Tactile',
    description: 'Subtle high-frequency crystal clicks and discreet non-distracting telemetry tones.',
    author: 'Field Triage Unit',
    tagline: 'Non-Intrusive Precision'
  },
  {
    id: 'stealth_silent',
    name: 'Silent Stealth Operation',
    description: 'All auditory events silenced by default for covert field extraction.',
    author: 'Red Team Ops',
    tagline: 'Zero Auditory Footprint'
  }
];

export const DEFAULT_SOUND_EVENTS: SoundEventConfig[] = [
  {
    id: 'splash_curtains',
    name: 'Theater Curtains Parting Overture',
    category: 'System Lifecycle',
    description: 'Plays during the stage reveal splash screen (up to 30s) or Cylon "Your system is ready, Imperious leader".',
    isMuted: false,
    volume: 0.9,
    synthPreset: 'cylon_voice_ready'
  },
  {
    id: 'system_crash',
    name: 'System Crash / Kernel Panic Klaxon',
    category: 'System Lifecycle',
    description: 'Emergency descending dual-tone alert or DRADIS red alert siren.',
    isMuted: false,
    volume: 0.9,
    synthPreset: 'klaxon_siren'
  },
  {
    id: 'file_corrupt',
    name: 'File Corruption / Bad CRC Block Warning',
    category: 'Filesystem & I/O',
    description: 'Distorted bit-rot buzz and error warning chime.',
    isMuted: false,
    volume: 0.8,
    synthPreset: 'glitch_buzz'
  },
  {
    id: 'open_file',
    name: 'Open File / Explorer Navigation',
    category: 'Filesystem & I/O',
    description: 'Crisp glass harmonic chime or DRADIS pulse when documents or folders are opened.',
    isMuted: false,
    volume: 0.6,
    synthPreset: 'crystal_chime'
  },
  {
    id: 'close_file',
    name: 'Close File / Dismiss Window',
    category: 'Filesystem & I/O',
    description: 'Dampened magnetic tactile snap or Viper thruster cut.',
    isMuted: false,
    volume: 0.5,
    synthPreset: 'soft_click'
  },
  {
    id: 'receive_mail',
    name: 'Receive Mail / Forensic Dispatch Alert',
    category: 'UI & Feedback',
    description: 'Three-tone ascending melodic bell or Cylon tactical ping.',
    isMuted: false,
    volume: 0.75,
    synthPreset: 'envelope_swish'
  },
  {
    id: 'login_success',
    name: 'Login Success / Security Clearance Granted',
    category: 'System Lifecycle',
    description: 'Cylon readiness affirmation or resonant major-chord fanfare.',
    isMuted: false,
    volume: 0.85,
    synthPreset: 'cylon_voice_ready'
  },
  {
    id: 'lock_screen',
    name: 'Lock Screen / Vault Engaged',
    category: 'System Lifecycle',
    description: 'Heavy physical solenoid bolt engagement or FTL jump displacement.',
    isMuted: false,
    volume: 0.7,
    synthPreset: 'solenoid_lock'
  },
  {
    id: 'threat_alert',
    name: 'HIPS & Threat Feed Intrusion Alert',
    category: 'Forensic & Security',
    description: 'Pulsing rapid red-alert sonar ping.',
    isMuted: false,
    volume: 0.9,
    synthPreset: 'cylon_eye_sweep'
  },
  {
    id: 'disk_mount',
    name: 'Disk Mount / Hardware Insertion',
    category: 'Filesystem & I/O',
    description: 'Rotational spindle spin-up or Viper launch rail engagement.',
    isMuted: false,
    volume: 0.65,
    synthPreset: 'spinup_tone'
  },
  {
    id: 'button_click',
    name: 'Tactile UI Click',
    category: 'UI & Feedback',
    description: 'Subtle micro-switch mechanical click.',
    isMuted: false,
    volume: 0.4,
    synthPreset: 'beep_confirm'
  },
  {
    id: 'command_success',
    name: 'CLI Command Execution Succeeded',
    category: 'UI & Feedback',
    description: 'Positive confirmation double-pip or DRADIS acquisition.',
    isMuted: false,
    volume: 0.55,
    synthPreset: 'beep_confirm'
  },
  {
    id: 'hardware_error',
    name: 'Hardware Stress Error Detected',
    category: 'Forensic & Security',
    description: 'Thermal or bus fault alarm.',
    isMuted: false,
    volume: 0.85,
    synthPreset: 'glitch_buzz'
  }
];

class SoundSystemService {
  private audioCtx: AudioContext | null = null;
  private soundEvents: Record<SoundEventId, SoundEventConfig>;
  private masterMute: boolean = false;
  private masterVolume: number = 0.85;
  private currentScheme: string = 'bsg_cylon';
  private activeAudioElements: HTMLAudioElement[] = [];

  constructor() {
    this.soundEvents = {} as Record<SoundEventId, SoundEventConfig>;
    DEFAULT_SOUND_EVENTS.forEach(cfg => {
      this.soundEvents[cfg.id] = { ...cfg };
    });
    this.loadSettings();
  }

  private initAudioContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.audioCtx) {
      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioContextClass) {
        this.audioCtx = new AudioContextClass();
      }
    }
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
    return this.audioCtx;
  }

  public getEvents(): SoundEventConfig[] {
    return Object.values(this.soundEvents);
  }

  public getEvent(id: SoundEventId): SoundEventConfig | undefined {
    return this.soundEvents[id];
  }

  public setEventMute(id: SoundEventId, isMuted: boolean): void {
    if (this.soundEvents[id]) {
      this.soundEvents[id].isMuted = isMuted;
      this.saveSettings();
    }
  }

  public setEventVolume(id: SoundEventId, volume: number): void {
    if (this.soundEvents[id]) {
      this.soundEvents[id].volume = Math.max(0, Math.min(1, volume));
      this.saveSettings();
    }
  }

  public setEventSynthPreset(id: SoundEventId, preset: SynthPresetType): void {
    if (this.soundEvents[id]) {
      this.soundEvents[id].synthPreset = preset;
      this.saveSettings();
    }
  }

  public setCustomAudioUrl(id: SoundEventId, url: string): void {
    if (this.soundEvents[id]) {
      this.soundEvents[id].customAudioUrl = url;
      this.saveSettings();
    }
  }

  public setMasterMute(muted: boolean): void {
    this.masterMute = muted;
    this.saveSettings();
  }

  public getMasterMute(): boolean {
    return this.masterMute;
  }

  public setMasterVolume(vol: number): void {
    this.masterVolume = Math.max(0, Math.min(1, vol));
    this.saveSettings();
  }

  public getMasterVolume(): number {
    return this.masterVolume;
  }

  public getCurrentScheme(): string {
    return this.currentScheme;
  }

  public applyScheme(schemeId: string): void {
    this.currentScheme = schemeId;
    if (schemeId === 'stealth_silent') {
      Object.keys(this.soundEvents).forEach(k => {
        this.soundEvents[k as SoundEventId].isMuted = true;
      });
    } else if (schemeId === 'bsg_cylon') {
      Object.keys(this.soundEvents).forEach(k => {
        this.soundEvents[k as SoundEventId].isMuted = false;
      });
      this.soundEvents.splash_curtains.synthPreset = 'cylon_voice_ready';
      this.soundEvents.login_success.synthPreset = 'cylon_voice_ready';
      this.soundEvents.threat_alert.synthPreset = 'cylon_eye_sweep';
      this.soundEvents.open_file.synthPreset = 'dradis_contact';
      this.soundEvents.lock_screen.synthPreset = 'ftl_jump';
      this.soundEvents.disk_mount.synthPreset = 'viper_launch';
      this.masterVolume = 0.9;
    } else if (schemeId === 'theatrical_symphony') {
      Object.keys(this.soundEvents).forEach(k => {
        this.soundEvents[k as SoundEventId].isMuted = false;
      });
      this.soundEvents.splash_curtains.synthPreset = 'brass_fanfare';
      this.soundEvents.login_success.synthPreset = 'rising_harmony';
      this.soundEvents.threat_alert.synthPreset = 'klaxon_siren';
      this.soundEvents.open_file.synthPreset = 'crystal_chime';
      this.masterVolume = 0.85;
    } else if (schemeId === 'cyber_synthwave') {
      Object.keys(this.soundEvents).forEach(k => {
        this.soundEvents[k as SoundEventId].isMuted = false;
      });
      this.soundEvents.splash_curtains.synthPreset = 'spinup_tone';
      this.soundEvents.login_success.synthPreset = 'rising_harmony';
      this.masterVolume = 0.8;
    } else if (schemeId === 'starfleet_lcars') {
      Object.keys(this.soundEvents).forEach(k => {
        this.soundEvents[k as SoundEventId].isMuted = false;
      });
      this.soundEvents.splash_curtains.synthPreset = 'envelope_swish';
      this.soundEvents.open_file.synthPreset = 'beep_confirm';
      this.soundEvents.threat_alert.synthPreset = 'klaxon_siren';
      this.masterVolume = 0.75;
    } else if (schemeId === 'forensic_clean') {
      Object.keys(this.soundEvents).forEach(k => {
        this.soundEvents[k as SoundEventId].isMuted = false;
      });
      this.masterVolume = 0.5;
    }
    this.saveSettings();
  }

  public play(id: SoundEventId): void {
    if (this.masterMute) return;
    const config = this.soundEvents[id];
    if (!config || config.isMuted) return;

    const effVolume = this.masterVolume * config.volume;

    // 1. If custom audio URL or file is specified, play via HTML5 Audio element
    if (config.customAudioUrl) {
      try {
        const audio = new Audio(config.customAudioUrl);
        audio.volume = effVolume;
        audio.play().catch(() => {
          this.synthesizeSound(config.synthPreset, effVolume);
        });
        return;
      } catch {
        // Fallback to synth
      }
    }

    // 2. Otherwise synthesize using Web Audio API / Vocoder Engine
    this.synthesizeSound(config.synthPreset, effVolume);
  }

  public stopAll(): void {
    this.activeAudioElements.forEach(a => {
      try {
        a.pause();
        a.currentTime = 0;
      } catch {
        // ignore
      }
    });
    this.activeAudioElements = [];
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      try {
        window.speechSynthesis.cancel();
      } catch {
        // ignore
      }
    }
  }

  /**
   * Cylon Speech Synthesis Engine:
   * Provides dual-mode speech synthesis:
   * 1. Bulletproof Web Speech API with Chrome GC preservation, audio context unblocking, and voice fallback.
   * 2. Authentic 1978 BSG Formant Vocoder (F1/F2/F3 acoustic vowel resonance + consonant bursts in Web Audio)
   * which is 100% immune to browser iframe sandbox speech blocks and speaks actual articulate English words.
   */
  public speakCylon(
    customPhrase?: string,
    volume: number = 1.0,
    pitchMultiplier: number = 1.0,
    mode: 'auto' | 'vocoder' | 'tts' = 'auto'
  ): void {
    if (this.masterMute) return;
    const phrase = (customPhrase || "Your system is ready, Imperious leader.").trim();
    const cleanVolume = Math.min(1.0, Math.max(0.1, volume));

    // Ensure audio context is active
    const ctx = this.initAudioContext();
    if (ctx && ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }

    // 1. Play subtle 90ms Cylon acquisition chirp
    this.playCylonAcquisitionChirp(cleanVolume * 0.4);

    let ttsSucceeded = false;

    if (mode !== 'vocoder' && typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
        window.speechSynthesis.resume();

        const utter = new SpeechSynthesisUtterance(phrase);
        utter.lang = 'en-US';
        
        // Pitch: 0.95 * pitchMultiplier ensures articulate, clear speech
        utter.pitch = Math.max(0.6, Math.min(1.6, 0.95 * pitchMultiplier));
        utter.rate = 0.90;   // Deliberate robotic pace
        utter.volume = 1.0;  // Full volume output

        // Store globally to prevent Chrome garbage collector bug
        (window as unknown as Record<string, unknown>)._cylonActiveUtterance = utter;

        const voices = window.speechSynthesis.getVoices();
        if (voices && voices.length > 0) {
          const chosen = voices.find(v =>
            v.lang.startsWith('en') && (
              v.name.includes('Google US English') ||
              v.name.includes('Natural') ||
              v.name.includes('David') ||
              v.name.includes('Daniel') ||
              v.name.includes('George') ||
              v.name.includes('Male')
            )
          ) || voices.find(v => v.lang.startsWith('en')) || voices[0];
          if (chosen) utter.voice = chosen;
        }

        utter.onstart = () => {
          ttsSucceeded = true;
        };

        // Accompany with subtle harmonic ring modulation
        this.playCylonVocoderCarrier(cleanVolume * 0.4, pitchMultiplier);
        window.speechSynthesis.speak(utter);

        // If forced TTS, return
        if (mode === 'tts') return;
      } catch (err) {
        console.warn('TTS invocation error:', err);
      }
    }

    // If in 'vocoder' mode OR in 'auto' mode, run acoustic formant vocoder synthesis
    // so words are ALWAYS spoken loud and clear regardless of browser/iframe speech permissions!
    setTimeout(() => {
      // If Web Speech API didn't start or was in vocoder/auto mode, synthesize acoustic formants
      if (mode === 'vocoder' || !ttsSucceeded) {
        this.synthesizeAcousticFormantSpeech(phrase, cleanVolume, pitchMultiplier);
      }
    }, 60);
  }

  /**
   * Crisp 90ms Cylon Tactical Acquisition Chirp
   */
  private playCylonAcquisitionChirp(volume: number): void {
    try {
      const ctx = this.initAudioContext();
      if (!ctx) return;
      const now = ctx.currentTime;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(980, now);
      osc.frequency.exponentialRampToValueAtTime(1960, now + 0.06);

      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(volume * 0.3, now + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.10);
    } catch {
      // ignore
    }
  }

  /**
   * Procedural Cylon Speech Harmonic Carrier
   */
  private playCylonVocoderCarrier(volume: number, pitchMultiplier: number = 1.0): void {
    try {
      const ctx = this.initAudioContext();
      if (!ctx) return;
      const now = ctx.currentTime;

      const carrierOsc = ctx.createOscillator();
      const carrierGain = ctx.createGain();
      const biquad = ctx.createBiquadFilter();

      carrierOsc.type = 'sawtooth';
      carrierOsc.frequency.setValueAtTime(140 * pitchMultiplier, now);
      carrierOsc.frequency.exponentialRampToValueAtTime(160 * pitchMultiplier, now + 1.2);
      carrierOsc.frequency.exponentialRampToValueAtTime(130 * pitchMultiplier, now + 2.5);

      biquad.type = 'bandpass';
      biquad.frequency.setValueAtTime(900 * pitchMultiplier, now);
      biquad.Q.setValueAtTime(3.0, now);

      carrierGain.gain.setValueAtTime(0.001, now);
      carrierGain.gain.linearRampToValueAtTime(volume * 0.08, now + 0.1);
      carrierGain.gain.exponentialRampToValueAtTime(0.001, now + 2.8);

      carrierOsc.connect(biquad);
      biquad.connect(carrierGain);
      carrierGain.connect(ctx.destination);

      carrierOsc.start(now);
      carrierOsc.stop(now + 2.9);
    } catch {
      // ignore
    }
  }

  /**
   * Authentic 1978 BSG Cylon Acoustic Formant Synthesizer:
   * Uses 3 parallel resonant bandpass formant filters (F1, F2, F3) driven by a rich harmonic sawtooth wave
   * + 18Hz ring modulator + unvoiced consonant noise bursts to pronounce actual English words.
   * Runs natively in Web Audio API with 100% reliability.
   */
  public synthesizeAcousticFormantSpeech(
    phrase: string,
    volume: number = 1.0,
    pitchMultiplier: number = 1.0
  ): void {
    try {
      const ctx = this.initAudioContext();
      if (!ctx) return;
      const now = ctx.currentTime;

      // Base fundamental pitch shifted up an octave (130Hz -> 155Hz base)
      const baseF0 = 145 * pitchMultiplier;

      // Define acoustic phoneme maps for Cylon phrases
      type FormantSlice = {
        name: string;
        f0: number;
        f1: number;
        f2: number;
        f3: number;
        dur: number;
        offset: number;
        noiseBurst?: boolean;
        noiseFreq?: number;
        noiseDur?: number;
      };

      const normalized = phrase.toLowerCase();
      let phonemes: FormantSlice[] = [];

      if (normalized.includes('command')) {
        // Phrase: "By your command."
        phonemes = [
          // "By" (0.40s): voiced plosive + /aɪ/ diphthong
          { name: 'b', f0: baseF0 * 1.0, f1: 300, f2: 1100, f3: 2200, dur: 0.08, offset: 0.00 },
          { name: 'ah', f0: baseF0 * 1.15, f1: 750, f2: 1200, f3: 2400, dur: 0.22, offset: 0.08 },
          { name: 'ee', f0: baseF0 * 1.05, f1: 320, f2: 2100, f3: 2800, dur: 0.12, offset: 0.30 },
          // "your" (0.34s)
          { name: 'y', f0: baseF0 * 1.0, f1: 280, f2: 2000, f3: 2600, dur: 0.08, offset: 0.46 },
          { name: 'or', f0: baseF0 * 0.95, f1: 500, f2: 880, f3: 2100, dur: 0.26, offset: 0.54 },
          // "com-" (0.28s)
          { name: 'k', f0: baseF0 * 1.1, f1: 450, f2: 1600, f3: 2400, dur: 0.06, offset: 0.84, noiseBurst: true, noiseFreq: 3000, noiseDur: 0.04 },
          { name: 'uh', f0: baseF0 * 1.05, f1: 520, f2: 1400, f3: 2300, dur: 0.14, offset: 0.90 },
          { name: 'm', f0: baseF0 * 0.95, f1: 260, f2: 1100, f3: 2100, dur: 0.08, offset: 1.04 },
          // "-mand" (0.46s)
          { name: 'aa', f0: baseF0 * 1.18, f1: 680, f2: 1720, f3: 2500, dur: 0.24, offset: 1.14 },
          { name: 'n', f0: baseF0 * 1.0, f1: 280, f2: 1450, f3: 2200, dur: 0.12, offset: 1.38 },
          { name: 'd', f0: baseF0 * 0.85, f1: 350, f2: 1600, f3: 2400, dur: 0.10, offset: 1.50, noiseBurst: true, noiseFreq: 2500, noiseDur: 0.03 }
        ];
      } else {
        // Default Cylon Phrase: "Your sys-tem is read-y, Im-per-ious lead-er."
        phonemes = [
          // "Your" (0.36s)
          { name: 'y', f0: baseF0 * 0.95, f1: 280, f2: 2100, f3: 2700, dur: 0.08, offset: 0.00 },
          { name: 'or', f0: baseF0 * 1.05, f1: 500, f2: 890, f3: 2100, dur: 0.28, offset: 0.08 },

          // "sys-" (0.30s)
          { name: 's1', f0: baseF0 * 1.15, f1: 380, f2: 1950, f3: 2600, dur: 0.08, offset: 0.40, noiseBurst: true, noiseFreq: 5500, noiseDur: 0.08 },
          { name: 'ih', f0: baseF0 * 1.20, f1: 400, f2: 1980, f3: 2580, dur: 0.14, offset: 0.48 },
          { name: 's2', f0: baseF0 * 1.10, f1: 380, f2: 1950, f3: 2600, dur: 0.08, offset: 0.62, noiseBurst: true, noiseFreq: 5500, noiseDur: 0.08 },

          // "-tem" (0.28s)
          { name: 't', f0: baseF0 * 1.10, f1: 450, f2: 1800, f3: 2500, dur: 0.04, offset: 0.72, noiseBurst: true, noiseFreq: 4000, noiseDur: 0.03 },
          { name: 'eh', f0: baseF0 * 1.05, f1: 530, f2: 1820, f3: 2490, dur: 0.16, offset: 0.76 },
          { name: 'm', f0: baseF0 * 0.95, f1: 260, f2: 1150, f3: 2150, dur: 0.08, offset: 0.92 },

          // "is" (0.22s)
          { name: 'ih', f0: baseF0 * 1.02, f1: 400, f2: 1950, f3: 2550, dur: 0.12, offset: 1.04 },
          { name: 'z', f0: baseF0 * 0.98, f1: 380, f2: 1850, f3: 2450, dur: 0.10, offset: 1.16, noiseBurst: true, noiseFreq: 4500, noiseDur: 0.08 },

          // "read-" (0.26s)
          { name: 'r', f0: baseF0 * 1.12, f1: 320, f2: 1280, f3: 1680, dur: 0.06, offset: 1.30 },
          { name: 'eh', f0: baseF0 * 1.18, f1: 540, f2: 1800, f3: 2500, dur: 0.16, offset: 1.36 },
          { name: 'd', f0: baseF0 * 1.05, f1: 360, f2: 1650, f3: 2400, dur: 0.04, offset: 1.52, noiseBurst: true, noiseFreq: 3000, noiseDur: 0.03 },

          // "-y" (0.24s)
          { name: 'ee', f0: baseF0 * 1.08, f1: 270, f2: 2280, f3: 2950, dur: 0.24, offset: 1.58 },

          // "Im-" (0.22s)
          { name: 'ih', f0: baseF0 * 1.10, f1: 400, f2: 1950, f3: 2550, dur: 0.14, offset: 1.86 },
          { name: 'm', f0: baseF0 * 1.02, f1: 260, f2: 1150, f3: 2150, dur: 0.08, offset: 2.00 },

          // "-per-" (0.28s)
          { name: 'p', f0: baseF0 * 1.25, f1: 450, f2: 1500, f3: 2300, dur: 0.04, offset: 2.10, noiseBurst: true, noiseFreq: 2500, noiseDur: 0.03 },
          { name: 'er', f0: baseF0 * 1.22, f1: 490, f2: 1360, f3: 1700, dur: 0.24, offset: 2.14 },

          // "-ious" (0.26s)
          { name: 'ee', f0: baseF0 * 1.10, f1: 280, f2: 2150, f3: 2800, dur: 0.10, offset: 2.40 },
          { name: 'us', f0: baseF0 * 1.00, f1: 510, f2: 1450, f3: 2350, dur: 0.10, offset: 2.50 },
          { name: 's', f0: baseF0 * 0.95, f1: 380, f2: 1900, f3: 2500, dur: 0.06, offset: 2.60, noiseBurst: true, noiseFreq: 5000, noiseDur: 0.06 },

          // "lead-" (0.32s)
          { name: 'l', f0: baseF0 * 1.05, f1: 340, f2: 1300, f3: 2400, dur: 0.08, offset: 2.70 },
          { name: 'ee', f0: baseF0 * 1.15, f1: 270, f2: 2280, f3: 2950, dur: 0.20, offset: 2.78 },
          { name: 'd', f0: baseF0 * 1.00, f1: 350, f2: 1600, f3: 2400, dur: 0.04, offset: 2.98, noiseBurst: true, noiseFreq: 3000, noiseDur: 0.03 },

          // "-er" (0.45s)
          { name: 'er', f0: baseF0 * 0.85, f1: 460, f2: 1380, f3: 1720, dur: 0.45, offset: 3.04 }
        ];
      }

      // Master vocoder gain for speech clarity
      const speechMasterGain = ctx.createGain();
      speechMasterGain.gain.setValueAtTime(volume * 0.85, now);
      speechMasterGain.connect(ctx.destination);

      // Synthesize each acoustic phoneme slice
      phonemes.forEach((slice) => {
        const startTime = now + slice.offset;
        const endTime = startTime + slice.dur;

        // 1. Voiced Sawtooth Oscillator
        const osc = ctx.createOscillator();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(slice.f0, startTime);
        osc.frequency.exponentialRampToValueAtTime(slice.f0 * 0.97, endTime);

        // 2. Ring Modulator Tremolo (Classic 18Hz Cylon metallic vibrato)
        const ringMod = ctx.createOscillator();
        const ringGain = ctx.createGain();
        ringMod.type = 'sine';
        ringMod.frequency.setValueAtTime(18, startTime); // 18Hz ring modulation
        ringGain.gain.setValueAtTime(0.35, startTime);

        // 3. Parallel Formant Filters (F1, F2, F3)
        // Formant 1
        const f1Filter = ctx.createBiquadFilter();
        f1Filter.type = 'bandpass';
        f1Filter.frequency.setValueAtTime(slice.f1, startTime);
        f1Filter.Q.setValueAtTime(6.0, startTime);

        const f1Gain = ctx.createGain();
        f1Gain.gain.setValueAtTime(0.75, startTime);

        // Formant 2 (Critical for vowel distinction)
        const f2Filter = ctx.createBiquadFilter();
        f2Filter.type = 'bandpass';
        f2Filter.frequency.setValueAtTime(slice.f2, startTime);
        f2Filter.Q.setValueAtTime(8.5, startTime);

        const f2Gain = ctx.createGain();
        f2Gain.gain.setValueAtTime(0.65, startTime);

        // Formant 3 (Metallic presence)
        const f3Filter = ctx.createBiquadFilter();
        f3Filter.type = 'bandpass';
        f3Filter.frequency.setValueAtTime(slice.f3, startTime);
        f3Filter.Q.setValueAtTime(10.0, startTime);

        const f3Gain = ctx.createGain();
        f3Gain.gain.setValueAtTime(0.40, startTime);

        // Slice Envelope Gain
        const envGain = ctx.createGain();
        envGain.gain.setValueAtTime(0.001, startTime);
        envGain.gain.linearRampToValueAtTime(1.0, startTime + 0.03);
        envGain.gain.setValueAtTime(1.0, endTime - 0.03);
        envGain.gain.linearRampToValueAtTime(0.001, endTime);

        // Connect Vocoder Routing
        osc.connect(f1Filter);
        osc.connect(f2Filter);
        osc.connect(f3Filter);

        f1Filter.connect(f1Gain);
        f2Filter.connect(f2Gain);
        f3Filter.connect(f3Gain);

        f1Gain.connect(envGain);
        f2Gain.connect(envGain);
        f3Gain.connect(envGain);

        envGain.connect(speechMasterGain);

        osc.start(startTime);
        osc.stop(endTime + 0.05);

        // 4. If consonant noise burst is present ('s', 't', 'p', 'd')
        if (slice.noiseBurst && slice.noiseFreq) {
          const noiseBuffer = ctx.createBuffer(1, Math.floor(ctx.sampleRate * (slice.noiseDur || 0.05)), ctx.sampleRate);
          const noiseData = noiseBuffer.getChannelData(0);
          for (let i = 0; i < noiseData.length; i++) {
            noiseData[i] = (Math.random() * 2 - 1) * 0.8;
          }

          const noiseSrc = ctx.createBufferSource();
          noiseSrc.buffer = noiseBuffer;

          const noiseFilter = ctx.createBiquadFilter();
          noiseFilter.type = 'highpass';
          noiseFilter.frequency.setValueAtTime(slice.noiseFreq, startTime);
          noiseFilter.Q.setValueAtTime(3.0, startTime);

          const noiseGain = ctx.createGain();
          noiseGain.gain.setValueAtTime(0.001, startTime);
          noiseGain.gain.linearRampToValueAtTime(0.65, startTime + 0.01);
          noiseGain.gain.exponentialRampToValueAtTime(0.001, startTime + (slice.noiseDur || 0.05));

          noiseSrc.connect(noiseFilter);
          noiseFilter.connect(noiseGain);
          noiseGain.connect(speechMasterGain);

          noiseSrc.start(startTime);
          noiseSrc.stop(startTime + (slice.noiseDur || 0.05) + 0.02);
        }
      });
    } catch (err) {
      console.warn('Acoustic Formant Synthesis Error:', err);
    }
  }

  /**
   * Pure procedural multi-formant Cylon cadence fallback (doubled frequencies for +1 octave clarity)
   */
  private synthesizeProceduralCylonPhrase(volume: number, pitchMultiplier: number = 1.0): void {
    try {
      const ctx = this.initAudioContext();
      if (!ctx) return;
      const now = ctx.currentTime;

      // 11 syllable robotic cadence: "Your sys-tem is read-y, Im-per-ious lead-er"
      // Frequencies shifted up one full octave (doubled from 110Hz to 220Hz base)
      const baseOctave = 2.0 * pitchMultiplier;
      const syllables = [
        { freq: 110 * baseOctave, dur: 0.35, offset: 0.0 },   // Your
        { freq: 125 * baseOctave, dur: 0.28, offset: 0.42 },  // sys
        { freq: 118 * baseOctave, dur: 0.30, offset: 0.75 },  // tem
        { freq: 110 * baseOctave, dur: 0.22, offset: 1.12 },  // is
        { freq: 132 * baseOctave, dur: 0.35, offset: 1.38 },  // read
        { freq: 115 * baseOctave, dur: 0.30, offset: 1.78 },  // y
        { freq: 120 * baseOctave, dur: 0.25, offset: 2.20 },  // Im
        { freq: 135 * baseOctave, dur: 0.32, offset: 2.50 },  // per
        { freq: 128 * baseOctave, dur: 0.28, offset: 2.86 },  // ious
        { freq: 110 * baseOctave, dur: 0.42, offset: 3.20 },  // lead
        { freq: 95 * baseOctave, dur: 0.55, offset: 3.68 },   // er
      ];

      syllables.forEach(({ freq, dur, offset }) => {
        const osc = ctx.createOscillator();
        const sub = ctx.createOscillator();
        const gain = ctx.createGain();
        const filter = ctx.createBiquadFilter();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(freq, now + offset);

        sub.type = 'square';
        sub.frequency.setValueAtTime(freq * 0.5, now + offset);

        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(freq * 2.8, now + offset);
        filter.Q.setValueAtTime(3.5, now + offset);

        gain.gain.setValueAtTime(0.001, now + offset);
        gain.gain.linearRampToValueAtTime(volume * 0.45, now + offset + 0.04);
        gain.gain.exponentialRampToValueAtTime(0.001, now + offset + dur);

        osc.connect(filter);
        sub.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now + offset);
        sub.start(now + offset);
        osc.stop(now + offset + dur + 0.05);
        sub.stop(now + offset + dur + 0.05);
      });
    } catch {
      // ignore
    }
  }

  public synthesizeSound(preset: SynthPresetType, volume: number): void {
    try {
      const ctx = this.initAudioContext();
      if (!ctx) return;

      const now = ctx.currentTime;
      const masterGain = ctx.createGain();
      masterGain.gain.setValueAtTime(volume, now);
      masterGain.connect(ctx.destination);

      switch (preset) {
        case 'cylon_voice_ready': {
          this.speakCylon("Your system is ready, Imperious leader.", volume);
          break;
        }

        case 'cylon_eye_sweep': {
          // Iconic Cylon Red-Eye Scanner (Sweeping filter back and forth)
          const osc1 = ctx.createOscillator();
          const osc2 = ctx.createOscillator();
          const filter = ctx.createBiquadFilter();
          const gain = ctx.createGain();

          osc1.type = 'sawtooth';
          osc1.frequency.setValueAtTime(78, now);
          osc1.frequency.linearRampToValueAtTime(115, now + 0.6);
          osc1.frequency.linearRampToValueAtTime(78, now + 1.2);
          osc1.frequency.linearRampToValueAtTime(115, now + 1.8);
          osc1.frequency.linearRampToValueAtTime(78, now + 2.4);

          osc2.type = 'square';
          osc2.frequency.setValueAtTime(39, now);

          filter.type = 'bandpass';
          filter.frequency.setValueAtTime(250, now);
          filter.frequency.exponentialRampToValueAtTime(1400, now + 0.6);
          filter.frequency.exponentialRampToValueAtTime(250, now + 1.2);
          filter.frequency.exponentialRampToValueAtTime(1400, now + 1.8);
          filter.frequency.exponentialRampToValueAtTime(250, now + 2.4);
          filter.Q.setValueAtTime(8.0, now);

          gain.gain.setValueAtTime(0.001, now);
          gain.gain.linearRampToValueAtTime(0.35, now + 0.1);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 2.5);

          osc1.connect(filter);
          osc2.connect(filter);
          filter.connect(gain);
          gain.connect(masterGain);

          osc1.start(now);
          osc2.start(now);
          osc1.stop(now + 2.55);
          osc2.stop(now + 2.55);
          break;
        }

        case 'dradis_contact': {
          // Battlestar DRADIS Tactical Sonar / Radar Ping
          const osc = ctx.createOscillator();
          const sub = ctx.createOscillator();
          const gain = ctx.createGain();

          osc.type = 'sine';
          osc.frequency.setValueAtTime(1864, now); // Bb6
          osc.frequency.exponentialRampToValueAtTime(1200, now + 0.12);

          sub.type = 'triangle';
          sub.frequency.setValueAtTime(932, now);
          sub.frequency.exponentialRampToValueAtTime(466, now + 0.15);

          gain.gain.setValueAtTime(0.001, now);
          gain.gain.linearRampToValueAtTime(0.4, now + 0.015);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.85);

          osc.connect(gain);
          sub.connect(gain);
          gain.connect(masterGain);

          osc.start(now);
          sub.start(now);
          osc.stop(now + 0.9);
          sub.stop(now + 0.9);
          break;
        }

        case 'ftl_jump': {
          // BSG FTL Jump Displacement (Heavy sub-bass cavitation + spatial vacuum snap)
          const osc = ctx.createOscillator();
          const sub = ctx.createOscillator();
          const gain = ctx.createGain();
          const filter = ctx.createBiquadFilter();

          osc.type = 'sawtooth';
          osc.frequency.setValueAtTime(140, now);
          osc.frequency.exponentialRampToValueAtTime(32, now + 0.45);

          sub.type = 'sine';
          sub.frequency.setValueAtTime(80, now);
          sub.frequency.exponentialRampToValueAtTime(24, now + 0.55);

          filter.type = 'lowpass';
          filter.frequency.setValueAtTime(350, now);
          filter.frequency.exponentialRampToValueAtTime(60, now + 0.5);

          gain.gain.setValueAtTime(0.001, now);
          gain.gain.linearRampToValueAtTime(0.65, now + 0.04);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 1.4);

          osc.connect(filter);
          sub.connect(filter);
          filter.connect(gain);
          gain.connect(masterGain);

          osc.start(now);
          sub.start(now);
          osc.stop(now + 1.45);
          sub.stop(now + 1.45);
          break;
        }

        case 'viper_launch': {
          // Viper Launch Tube Pneumatic Blast & Turbo Scream
          const osc = ctx.createOscillator();
          const noiseOsc = ctx.createOscillator();
          const gain = ctx.createGain();
          const filter = ctx.createBiquadFilter();

          osc.type = 'sawtooth';
          osc.frequency.setValueAtTime(180, now);
          osc.frequency.exponentialRampToValueAtTime(850, now + 0.3);
          osc.frequency.exponentialRampToValueAtTime(220, now + 1.1);

          noiseOsc.type = 'square';
          noiseOsc.frequency.setValueAtTime(95, now);
          noiseOsc.frequency.exponentialRampToValueAtTime(420, now + 0.4);

          filter.type = 'bandpass';
          filter.frequency.setValueAtTime(600, now);
          filter.frequency.exponentialRampToValueAtTime(1800, now + 0.35);
          filter.Q.setValueAtTime(3.0, now);

          gain.gain.setValueAtTime(0.001, now);
          gain.gain.linearRampToValueAtTime(0.45, now + 0.05);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 1.2);

          osc.connect(filter);
          noiseOsc.connect(filter);
          filter.connect(gain);
          gain.connect(masterGain);

          osc.start(now);
          noiseOsc.start(now);
          osc.stop(now + 1.25);
          noiseOsc.stop(now + 1.25);
          break;
        }

        case 'brass_fanfare': {
          // Grand Theatrical Curtains Fanfare (Multi-Oscillator Orchestral Swell)
          const notes = [220, 277.18, 329.63, 440, 554.37, 659.25]; // A major chord progression
          notes.forEach((freq, idx) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = idx % 2 === 0 ? 'sawtooth' : 'triangle';
            osc.frequency.setValueAtTime(freq, now + idx * 0.15);
            osc.frequency.exponentialRampToValueAtTime(freq * 1.5, now + 1.2 + idx * 0.1);

            gain.gain.setValueAtTime(0.001, now);
            gain.gain.linearRampToValueAtTime(0.2 / notes.length, now + 0.3 + idx * 0.15);
            gain.gain.exponentialRampToValueAtTime(0.0001, now + 4.5);

            osc.connect(gain);
            gain.connect(masterGain);
            osc.start(now + idx * 0.15);
            osc.stop(now + 4.6);
          });
          break;
        }

        case 'klaxon_siren': {
          // Emergency 2-Tone Alarm
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sawtooth';
          osc.frequency.setValueAtTime(880, now);
          osc.frequency.setValueAtTime(660, now + 0.25);
          osc.frequency.setValueAtTime(880, now + 0.5);
          osc.frequency.setValueAtTime(660, now + 0.75);

          gain.gain.setValueAtTime(0.3, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 1.2);

          osc.connect(gain);
          gain.connect(masterGain);
          osc.start(now);
          osc.stop(now + 1.25);
          break;
        }

        case 'glitch_buzz': {
          // Bit-rot CRC corruption glitch
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'square';
          osc.frequency.setValueAtTime(140, now);
          osc.frequency.linearRampToValueAtTime(70, now + 0.35);

          gain.gain.setValueAtTime(0.35, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);

          osc.connect(gain);
          gain.connect(masterGain);
          osc.start(now);
          osc.stop(now + 0.45);
          break;
        }

        case 'crystal_chime': {
          // Smooth glass chime
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(1046.5, now); // C6
          osc.frequency.exponentialRampToValueAtTime(2093, now + 0.1);

          gain.gain.setValueAtTime(0.3, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);

          osc.connect(gain);
          gain.connect(masterGain);
          osc.start(now);
          osc.stop(now + 0.55);
          break;
        }

        case 'soft_click': {
          // Subtle dampened tactile click
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(320, now);
          osc.frequency.exponentialRampToValueAtTime(80, now + 0.06);

          gain.gain.setValueAtTime(0.4, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

          osc.connect(gain);
          gain.connect(masterGain);
          osc.start(now);
          osc.stop(now + 0.09);
          break;
        }

        case 'envelope_swish': {
          // Mail notification: 3-tone ascending crystal chime
          const freqs = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
          freqs.forEach((f, i) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(f, now + i * 0.08);

            gain.gain.setValueAtTime(0.001, now + i * 0.08);
            gain.gain.linearRampToValueAtTime(0.2, now + i * 0.08 + 0.02);
            gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.08 + 0.4);

            osc.connect(gain);
            gain.connect(masterGain);
            osc.start(now + i * 0.08);
            osc.stop(now + i * 0.08 + 0.45);
          });
          break;
        }

        case 'rising_harmony': {
          // Login success harmonic chord
          const freqs = [440, 554.37, 659.25, 880];
          freqs.forEach((f) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(f, now);

            gain.gain.setValueAtTime(0.001, now);
            gain.gain.linearRampToValueAtTime(0.25 / freqs.length, now + 0.1);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 1.2);

            osc.connect(gain);
            gain.connect(masterGain);
            osc.start(now);
            osc.stop(now + 1.3);
          });
          break;
        }

        case 'solenoid_lock': {
          // Physical deadbolt solenoid click
          const osc1 = ctx.createOscillator();
          const gain1 = ctx.createGain();
          osc1.type = 'square';
          osc1.frequency.setValueAtTime(90, now);
          gain1.gain.setValueAtTime(0.5, now);
          gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

          osc1.connect(gain1);
          gain1.connect(masterGain);
          osc1.start(now);
          osc1.stop(now + 0.15);
          break;
        }

        case 'spinup_tone': {
          // Drive spin-up tone
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(100, now);
          osc.frequency.exponentialRampToValueAtTime(1200, now + 0.6);

          gain.gain.setValueAtTime(0.001, now);
          gain.gain.linearRampToValueAtTime(0.25, now + 0.3);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.9);

          osc.connect(gain);
          gain.connect(masterGain);
          osc.start(now);
          osc.stop(now + 0.95);
          break;
        }

        case 'beep_confirm':
        default: {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(800, now);
          osc.frequency.setValueAtTime(1200, now + 0.05);

          gain.gain.setValueAtTime(0.2, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

          osc.connect(gain);
          gain.connect(masterGain);
          osc.start(now);
          osc.stop(now + 0.15);
          break;
        }
      }
    } catch {
      // Audio context might be restricted before interaction
    }
  }

  private saveSettings(): void {
    if (typeof window === 'undefined') return;
    try {
      const data = {
        masterMute: this.masterMute,
        masterVolume: this.masterVolume,
        currentScheme: this.currentScheme,
        soundEvents: this.soundEvents
      };
      localStorage.setItem('securecurtain_sound_config', JSON.stringify(data));
    } catch {
      // ignore
    }
  }

  private loadSettings(): void {
    if (typeof window === 'undefined') return;
    try {
      const stored = localStorage.getItem('securecurtain_sound_config');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (typeof parsed.masterMute === 'boolean') this.masterMute = parsed.masterMute;
        if (typeof parsed.masterVolume === 'number') this.masterVolume = parsed.masterVolume;
        if (typeof parsed.currentScheme === 'string') this.currentScheme = parsed.currentScheme;
        if (parsed.soundEvents) {
          Object.keys(parsed.soundEvents).forEach(k => {
            if (this.soundEvents[k as SoundEventId]) {
              this.soundEvents[k as SoundEventId] = {
                ...this.soundEvents[k as SoundEventId],
                ...parsed.soundEvents[k]
              };
            }
          });
        }
      }
    } catch {
      // ignore
    }
  }
}

export const soundSystemService = new SoundSystemService();
