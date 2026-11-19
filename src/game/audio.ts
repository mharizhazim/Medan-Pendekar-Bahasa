// Procedural Web Audio API sound & Nusantara pentatonic music engine (Zero 404s)

class NusantaraAudioEngine {
  private ctx: AudioContext | null = null;
  private musicEnabled = true;
  private sfxEnabled = true;
  private bgmTimer: number | null = null;
  private ambientTimer: number | null = null;
  private stepIndex = 0;
  private mode: 'adventure' | 'istana' | 'menu' = 'menu';

  private ensureContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  public unlock(): void {
    this.ensureContext();
  }

  public setMusicEnabled(enabled: boolean): void {
    this.musicEnabled = enabled;
    if (!enabled) {
      this.stopMusic();
    } else {
      this.startMusic(this.mode);
    }
  }

  public setSfxEnabled(enabled: boolean): void {
    this.sfxEnabled = enabled;
  }

  public isMusicEnabled(): boolean {
    return this.musicEnabled;
  }

  public isSfxEnabled(): boolean {
    return this.sfxEnabled;
  }

  public setMode(mode: 'adventure' | 'istana' | 'menu'): void {
    if (this.mode === mode && this.bgmTimer !== null) return;
    this.mode = mode;
    if (this.musicEnabled) {
      this.startMusic(mode);
    }
  }

  private playTone(
    freq: number,
    duration: number,
    type: OscillatorType = 'sine',
    gainPeak = 0.08,
    delay = 0,
  ): void {
    const ctx = this.ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime + delay;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, now);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(gainPeak, now + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + duration + 0.03);
  }

  public startMusic(mode: 'adventure' | 'istana' | 'menu'): void {
    this.mode = mode;
    this.stopMusic();
    if (!this.musicEnabled) return;

    // Malay / Nusantara Slendro-Pelog inspired pentatonic frequencies
    const adventureNotes = [293.66, 329.63, 392.0, 440.0, 523.25, 440.0, 392.0, 329.63];
    const istanaNotes = [261.63, 329.63, 392.0, 493.88, 523.25, 493.88, 392.0, 329.63];
    const menuNotes = [293.66, 392.0, 440.0, 587.33, 523.25, 440.0, 392.0, 329.63];

    const intervalMs = mode === 'istana' ? 460 : 540;
    this.bgmTimer = window.setInterval(() => {
      if (!this.musicEnabled || !this.ctx || this.ctx.state !== 'running') return;
      const scale =
        this.mode === 'istana'
          ? istanaNotes
          : this.mode === 'adventure'
            ? adventureNotes
            : menuNotes;
      const note = scale[this.stepIndex % scale.length];
      // Gamelan-like metallic chime + warm wooden marimba undertone
      this.playTone(note, 0.52, 'triangle', 0.028);
      if (this.stepIndex % 4 === 0) {
        this.playTone(note * 0.5, 0.9, 'sine', 0.032);
      }
      if (this.stepIndex % 8 === 0 && this.mode === 'istana') {
        this.playTone(note * 1.5, 0.45, 'sine', 0.015, 0.12);
      }
      this.stepIndex++;
    }, intervalMs);

    // Gentle nature bird chirps every few seconds in adventure mode
    this.ambientTimer = window.setInterval(() => {
      if (!this.sfxEnabled || this.mode !== 'adventure') return;
      if (!this.ctx || this.ctx.state !== 'running') return;
      if (Math.random() < 0.45) {
        const base = 1550 + Math.random() * 550;
        this.playTone(base, 0.08, 'sine', 0.012, 0);
        this.playTone(base * 1.18, 0.1, 'sine', 0.01, 0.09);
      }
    }, 3400);
  }

  public stopMusic(): void {
    if (this.bgmTimer !== null) {
      clearInterval(this.bgmTimer);
      this.bgmTimer = null;
    }
    if (this.ambientTimer !== null) {
      clearInterval(this.ambientTimer);
      this.ambientTimer = null;
    }
  }

  public playFootstep(isRunning: boolean): void {
    if (!this.sfxEnabled) return;
    const ctx = this.ensureContext();
    if (!ctx) return;
    const freq = isRunning ? 155 + Math.random() * 25 : 120 + Math.random() * 20;
    this.playTone(freq, 0.055, 'triangle', isRunning ? 0.028 : 0.018);
  }

  public playJump(): void {
    if (!this.sfxEnabled) return;
    const ctx = this.ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(220, now);
    osc.frequency.exponentialRampToValueAtTime(480, now + 0.18);
    gain.gain.setValueAtTime(0.06, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.2);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.22);
  }

  public playChestOpen(): void {
    if (!this.sfxEnabled) return;
    [392, 493.88, 587.33, 783.99].forEach((f, idx) => {
      this.playTone(f, 0.35, 'triangle', 0.065, idx * 0.075);
    });
  }

  public playCoin(): void {
    if (!this.sfxEnabled) return;
    this.playTone(987.77, 0.12, 'sine', 0.07, 0);
    this.playTone(1318.51, 0.24, 'sine', 0.07, 0.08);
  }

  public playCorrect(): void {
    if (!this.sfxEnabled) return;
    [523.25, 659.25, 783.99, 1046.5].forEach((f, idx) => {
      this.playTone(f, 0.32, 'triangle', 0.075, idx * 0.09);
    });
  }

  public playWrong(): void {
    if (!this.sfxEnabled) return;
    this.playTone(240, 0.18, 'sawtooth', 0.04, 0);
    this.playTone(196, 0.28, 'sawtooth', 0.04, 0.12);
  }

  public playCombatHit(): void {
    if (!this.sfxEnabled) return;
    this.playTone(180, 0.12, 'square', 0.055, 0);
    this.playTone(110, 0.16, 'triangle', 0.06, 0.04);
  }

  public playShield(): void {
    if (!this.sfxEnabled) return;
    this.playTone(440, 0.22, 'sine', 0.05, 0);
    this.playTone(660, 0.25, 'triangle', 0.045, 0.05);
  }

  public playVictory(): void {
    if (!this.sfxEnabled) return;
    const fanfare = [523.25, 587.33, 659.25, 783.99, 1046.5, 1318.51];
    fanfare.forEach((f, idx) => {
      this.playTone(f, 0.45, 'triangle', 0.085, idx * 0.11);
    });
  }
}

export const audioEngine = new NusantaraAudioEngine();
