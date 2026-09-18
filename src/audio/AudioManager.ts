class AudioManager {
  private ctx: AudioContext | null = null;
  private isInitialized = false;
  private masterGain: GainNode | null = null;
  private musicGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;
  
  private masterVol = 0.8;
  private musicVol = 0.6;
  private sfxVol = 0.9;
  private isMuted = false;

  // Engine synth nodes
  private engineOsc1: OscillatorNode | null = null;
  private engineOsc2: OscillatorNode | null = null;
  private engineNoiseNode: AudioBufferSourceNode | null = null;
  private engineGain: GainNode | null = null;
  private engineFilter: BiquadFilterNode | null = null;
  private isEngineRunning = false;

  // Nitro loop
  private nitroGain: GainNode | null = null;
  private nitroNoiseSource: AudioBufferSourceNode | null = null;
  private isNitroPlaying = false;

  // Procedural Music Engine
  private isMusicPlaying = false;
  private musicInterval: number | null = null;
  private musicStep = 0;

  constructor() {
    // Lazy init on first user touch / key
  }

  public init() {
    if (this.isInitialized && this.ctx) {
      if (this.ctx.state === 'suspended') {
        this.ctx.resume().catch(() => {});
      }
      return;
    }

    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      this.ctx = new AudioCtx();

      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : this.masterVol, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);

      this.musicGain = this.ctx.createGain();
      this.musicGain.gain.setValueAtTime(this.musicVol, this.ctx.currentTime);
      this.musicGain.connect(this.masterGain);

      this.sfxGain = this.ctx.createGain();
      this.sfxGain.gain.setValueAtTime(this.sfxVol, this.ctx.currentTime);
      this.sfxGain.connect(this.masterGain);

      this.isInitialized = true;
    } catch (err) {
      console.warn('Web Audio API not supported or blocked:', err);
    }
  }

  public updateSettings(master: number, music: number, sfx: number, muted: boolean) {
    this.masterVol = master;
    this.musicVol = music;
    this.sfxVol = sfx;
    this.isMuted = muted;

    if (!this.ctx || !this.masterGain || !this.musicGain || !this.sfxGain) return;

    const t = this.ctx.currentTime;
    this.masterGain.gain.setTargetAtTime(this.isMuted ? 0 : this.masterVol, t, 0.05);
    this.musicGain.gain.setTargetAtTime(this.musicVol, t, 0.05);
    this.sfxGain.gain.setTargetAtTime(this.sfxVol, t, 0.05);
  }

  // --- ENGINE SYNTHESIS ---
  public startEngine() {
    if (!this.ctx || !this.sfxGain || this.isEngineRunning) return;

    try {
      const t = this.ctx.currentTime;
      
      // Dual oscillator for rich exhaust harmonics
      this.engineOsc1 = this.ctx.createOscillator();
      this.engineOsc1.type = 'sawtooth';
      this.engineOsc1.frequency.setValueAtTime(55, t); // 55Hz base idle

      this.engineOsc2 = this.ctx.createOscillator();
      this.engineOsc2.type = 'triangle';
      this.engineOsc2.frequency.setValueAtTime(110, t);

      this.engineFilter = this.ctx.createBiquadFilter();
      this.engineFilter.type = 'lowpass';
      this.engineFilter.frequency.setValueAtTime(280, t);
      this.engineFilter.Q.setValueAtTime(3.5, t);

      this.engineGain = this.ctx.createGain();
      this.engineGain.gain.setValueAtTime(0.25, t);

      this.engineOsc1.connect(this.engineFilter);
      this.engineOsc2.connect(this.engineFilter);
      this.engineFilter.connect(this.engineGain);
      this.engineGain.connect(this.sfxGain);

      this.engineOsc1.start();
      this.engineOsc2.start();
      this.isEngineRunning = true;
    } catch (e) {
      console.warn('Failed to start engine audio:', e);
    }
  }

  public updateEnginePitch(speedRatio: number, isAccelerating: boolean) {
    if (!this.ctx || !this.isEngineRunning || !this.engineOsc1 || !this.engineOsc2 || !this.engineFilter || !this.engineGain) return;

    const t = this.ctx.currentTime;
    // Map speed ratio 0..1 to pitch 55Hz..240Hz
    const baseFreq = 50 + speedRatio * 180 + (isAccelerating ? 25 : 0);
    const filterFreq = 220 + speedRatio * 900 + (isAccelerating ? 250 : 0);

    this.engineOsc1.frequency.setTargetAtTime(baseFreq, t, 0.08);
    this.engineOsc2.frequency.setTargetAtTime(baseFreq * 1.5, t, 0.08);
    this.engineFilter.frequency.setTargetAtTime(filterFreq, t, 0.08);
    this.engineGain.gain.setTargetAtTime(0.2 + speedRatio * 0.15, t, 0.1);
  }

  public stopEngine() {
    if (!this.isEngineRunning) return;
    try {
      if (this.engineOsc1) {
        this.engineOsc1.stop();
        this.engineOsc1.disconnect();
        this.engineOsc1 = null;
      }
      if (this.engineOsc2) {
        this.engineOsc2.stop();
        this.engineOsc2.disconnect();
        this.engineOsc2 = null;
      }
      if (this.engineGain) {
        this.engineGain.disconnect();
        this.engineGain = null;
      }
      this.isEngineRunning = false;
    } catch (e) {
      this.isEngineRunning = false;
    }
  }

  // --- NITRO SOUND EFFECT ---
  public setNitroActive(active: boolean) {
    if (!this.ctx || !this.sfxGain) return;
    if (active && !this.isNitroPlaying) {
      this.startNitroSound();
    } else if (!active && this.isNitroPlaying) {
      this.stopNitroSound();
    }
  }

  public startNitroSound() {
    if (!this.ctx || !this.sfxGain) return;
    try {
      const bufferSize = this.ctx.sampleRate * 2;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }

      this.nitroNoiseSource = this.ctx.createBufferSource();
      this.nitroNoiseSource.buffer = buffer;
      this.nitroNoiseSource.loop = true;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(1400, this.ctx.currentTime);
      filter.Q.setValueAtTime(2.0, this.ctx.currentTime);

      this.nitroGain = this.ctx.createGain();
      this.nitroGain.gain.setValueAtTime(0.01, this.ctx.currentTime);
      this.nitroGain.gain.exponentialRampToValueAtTime(0.4, this.ctx.currentTime + 0.2);

      this.nitroNoiseSource.connect(filter);
      filter.connect(this.nitroGain);
      this.nitroGain.connect(this.sfxGain);

      this.nitroNoiseSource.start();
      this.isNitroPlaying = true;
    } catch (e) {
      // Ignored
    }
  }

  public stopNitroSound() {
    if (!this.isNitroPlaying || !this.ctx) return;
    try {
      if (this.nitroGain) {
        this.nitroGain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.15);
      }
      setTimeout(() => {
        if (this.nitroNoiseSource) {
          this.nitroNoiseSource.stop();
          this.nitroNoiseSource.disconnect();
          this.nitroNoiseSource = null;
        }
        this.isNitroPlaying = false;
      }, 150);
    } catch (e) {
      this.isNitroPlaying = false;
    }
  }

  // --- SOUND EFFECTS ---
  public playCoin() {
    if (!this.ctx || !this.sfxGain) return;
    try {
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(987.77, t); // B5
      osc.frequency.setValueAtTime(1318.51, t + 0.06); // E6

      gain.gain.setValueAtTime(0.28, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.28);

      osc.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(t);
      osc.stop(t + 0.3);
    } catch (e) {}
  }

  public playPowerUp() {
    if (!this.ctx || !this.sfxGain) return;
    try {
      const t = this.ctx.currentTime;
      const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
      notes.forEach((freq, idx) => {
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, t + idx * 0.05);

        gain.gain.setValueAtTime(0.22, t + idx * 0.05);
        gain.gain.exponentialRampToValueAtTime(0.001, t + idx * 0.05 + 0.2);

        osc.connect(gain);
        gain.connect(this.sfxGain!);

        osc.start(t + idx * 0.05);
        osc.stop(t + idx * 0.05 + 0.22);
      });
    } catch (e) {}
  }

  public playShieldDeflect() {
    if (!this.ctx || !this.sfxGain) return;
    try {
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(440, t);
      osc.frequency.exponentialRampToValueAtTime(160, t + 0.3);

      gain.gain.setValueAtTime(0.5, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.3);

      osc.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(t);
      osc.stop(t + 0.35);
    } catch (e) {}
  }

  public playCrash() {
    if (!this.ctx || !this.sfxGain) return;
    try {
      const t = this.ctx.currentTime;
      
      // Explosion sub thump
      const osc = this.ctx.createOscillator();
      const oscGain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(140, t);
      osc.frequency.exponentialRampToValueAtTime(30, t + 0.6);
      oscGain.gain.setValueAtTime(0.8, t);
      oscGain.gain.exponentialRampToValueAtTime(0.001, t + 0.6);
      osc.connect(oscGain);
      oscGain.connect(this.sfxGain);
      osc.start(t);
      osc.stop(t + 0.65);

      // Crunch noise
      const bufferSize = this.ctx.sampleRate * 0.5;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (this.ctx.sampleRate * 0.15));
      }
      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;
      const noiseFilter = this.ctx.createBiquadFilter();
      noiseFilter.type = 'lowpass';
      noiseFilter.frequency.setValueAtTime(1000, t);
      noiseFilter.frequency.exponentialRampToValueAtTime(120, t + 0.5);

      const noiseGain = this.ctx.createGain();
      noiseGain.gain.setValueAtTime(0.7, t);
      noiseGain.gain.exponentialRampToValueAtTime(0.01, t + 0.5);

      noise.connect(noiseFilter);
      noiseFilter.connect(noiseGain);
      noiseGain.connect(this.sfxGain);

      noise.start(t);
    } catch (e) {}
  }

  public playNearMiss() {
    if (!this.ctx || !this.sfxGain) return;
    try {
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(600, t);
      osc.frequency.exponentialRampToValueAtTime(250, t + 0.25);

      gain.gain.setValueAtTime(0.2, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.25);

      osc.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(t);
      osc.stop(t + 0.28);
    } catch (e) {}
  }

  public playClick() {
    if (!this.ctx || !this.sfxGain) return;
    try {
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(800, t);
      osc.frequency.exponentialRampToValueAtTime(400, t + 0.05);

      gain.gain.setValueAtTime(0.15, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.05);

      osc.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(t);
      osc.stop(t + 0.06);
    } catch (e) {}
  }

  public playUnlock() {
    if (!this.ctx || !this.sfxGain) return;
    try {
      const t = this.ctx.currentTime;
      const notes = [440, 554.37, 659.25, 880];
      notes.forEach((freq, idx) => {
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, t + idx * 0.08);

        gain.gain.setValueAtTime(0.3, t + idx * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.001, t + idx * 0.08 + 0.35);

        osc.connect(gain);
        gain.connect(this.sfxGain!);

        osc.start(t + idx * 0.08);
        osc.stop(t + idx * 0.08 + 0.38);
      });
    } catch (e) {}
  }

  // --- PROCEDURAL SYNTHWAVE RACING MUSIC ---
  public startMusic() {
    if (this.isMusicPlaying || !this.ctx) return;
    this.isMusicPlaying = true;
    this.musicStep = 0;

    const tempo = 128; // BPM
    const stepIntervalMs = (60 / tempo / 4) * 1000; // 16th notes

    // Bassline note progression (Cyber synthwave in D Minor / F Major)
    const basslineProgression = [
      73.42, 73.42, 0, 73.42, 82.41, 73.42, 98.0, 73.42, // D2, D2, _, D2, E2, D2, G2, D2
      65.41, 65.41, 0, 65.41, 73.42, 65.41, 87.31, 65.41, // C2, C2, _, C2, D2, C2, F2, C2
      55.00, 55.00, 0, 55.00, 65.41, 55.00, 73.42, 55.00, // A1, A1, _, A1, C2, A1, D2, A1
      58.27, 58.27, 0, 58.27, 65.41, 73.42, 87.31, 110.0, // Bb1, Bb1, _, Bb1, C2, D2, F2, A2
    ];

    const leadProgression = [
      293.66, 0, 349.23, 0, 440.0, 0, 392.0, 349.23,
      293.66, 0, 261.63, 0, 293.66, 349.23, 440.0, 523.25,
      440.0, 0, 392.0, 0, 349.23, 0, 293.66, 0,
      349.23, 392.0, 440.0, 523.25, 587.33, 523.25, 440.0, 349.23,
    ];

    this.musicInterval = window.setInterval(() => {
      if (!this.isMusicPlaying || !this.ctx || !this.musicGain) return;

      const t = this.ctx.currentTime;
      const step = this.musicStep % 32;

      // 1. Synth Bass Note
      const bassFreq = basslineProgression[step];
      if (bassFreq > 0) {
        const osc = this.ctx.createOscillator();
        const filter = this.ctx.createBiquadFilter();
        const gain = this.ctx.createGain();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(bassFreq, t);

        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(500, t);
        filter.frequency.exponentialRampToValueAtTime(140, t + 0.12);

        gain.gain.setValueAtTime(0.18, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.14);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.musicGain);

        osc.start(t);
        osc.stop(t + 0.15);
      }

      // 2. Synth Arp Lead (on every 2nd or 4th step)
      if (step % 2 === 0) {
        const leadFreq = leadProgression[step];
        if (leadFreq > 0) {
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(leadFreq, t);

          gain.gain.setValueAtTime(0.08, t);
          gain.gain.exponentialRampToValueAtTime(0.001, t + 0.22);

          osc.connect(gain);
          gain.connect(this.musicGain);

          osc.start(t);
          osc.stop(t + 0.25);
        }
      }

      // 3. Cyber Hi-Hat / Snare Rhythm
      if (step % 4 === 2) {
        // Snare / clap
        this.playDrumSnare(t);
      } else if (step % 2 === 0) {
        // Kick on 0, 8, 16, 24
        if (step % 8 === 0) {
          this.playDrumKick(t);
        } else {
          // Closed Hat
          this.playDrumHiHat(t);
        }
      }

      this.musicStep++;
    }, stepIntervalMs);
  }

  private playDrumKick(t: number) {
    if (!this.ctx || !this.musicGain) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.frequency.setValueAtTime(130, t);
      osc.frequency.exponentialRampToValueAtTime(35, t + 0.08);

      gain.gain.setValueAtTime(0.25, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.1);

      osc.connect(gain);
      gain.connect(this.musicGain);

      osc.start(t);
      osc.stop(t + 0.12);
    } catch (e) {}
  }

  private playDrumSnare(t: number) {
    if (!this.ctx || !this.musicGain) return;
    try {
      const bufferSize = this.ctx.sampleRate * 0.08;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (this.ctx.sampleRate * 0.02));
      }
      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'highpass';
      filter.frequency.setValueAtTime(1000, t);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.12, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.08);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(this.musicGain);

      noise.start(t);
    } catch (e) {}
  }

  private playDrumHiHat(t: number) {
    if (!this.ctx || !this.musicGain) return;
    try {
      const bufferSize = this.ctx.sampleRate * 0.03;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }
      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'highpass';
      filter.frequency.setValueAtTime(6000, t);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.05, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.03);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(this.musicGain);

      noise.start(t);
    } catch (e) {}
  }

  public stopMusic() {
    this.isMusicPlaying = false;
    if (this.musicInterval !== null) {
      clearInterval(this.musicInterval);
      this.musicInterval = null;
    }
  }

  public stopAll() {
    this.stopEngine();
    this.stopNitroSound();
    this.stopMusic();
  }
}

export const audioManager = new AudioManager();
