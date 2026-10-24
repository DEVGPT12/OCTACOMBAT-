/**
 * Procedural Web Audio Sound Engine for OCTACOMBAT
 * Generates zero-dependency arcade fighting sound effects and dynamic background beats.
 */

class SoundEngine {
  private ctx: AudioContext | null = null;
  private sfxGain: GainNode | null = null;
  private musicGain: GainNode | null = null;
  private masterGain: GainNode | null = null;
  private isMusicPlaying = false;
  private musicInterval: number | null = null;
  private currentBeat = 0;
  private isMuted = false;

  private initContext() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();

      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = 1.0;
      this.masterGain.connect(this.ctx.destination);

      this.sfxGain = this.ctx.createGain();
      this.sfxGain.gain.value = 0.8;
      this.sfxGain.connect(this.masterGain);

      this.musicGain = this.ctx.createGain();
      this.musicGain.gain.value = 0.35;
      this.musicGain.connect(this.masterGain);
    }

    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public setVolumes(sfx: number, music: number) {
    if (!this.ctx) return;
    if (this.sfxGain) this.sfxGain.gain.value = Math.max(0, Math.min(1, sfx));
    if (this.musicGain) this.musicGain.gain.value = Math.max(0, Math.min(1, music));
  }

  public toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    if (this.masterGain) {
      this.masterGain.gain.value = this.isMuted ? 0 : 1;
    }
    return this.isMuted;
  }

  public playWhoosh(type: 'light' | 'heavy' = 'light') {
    this.initContext();
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    osc.type = 'triangle';
    const startFreq = type === 'light' ? 420 : 280;
    const endFreq = type === 'light' ? 120 : 60;
    const duration = type === 'light' ? 0.12 : 0.22;

    osc.frequency.setValueAtTime(startFreq, now);
    osc.frequency.exponentialRampToValueAtTime(endFreq, now + duration);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(800, now);

    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + duration);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(now);
    osc.stop(now + duration);
  }

  public playHit(type: 'light' | 'heavy' | 'kick' | 'air') {
    this.initContext();
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;

    // 1. Thump Oscillator
    const osc = this.ctx.createOscillator();
    const oscGain = this.ctx.createGain();
    osc.type = (type === 'heavy' || type === 'air') ? 'sawtooth' : 'sine';
    
    const startFreq = type === 'heavy' ? 160 : type === 'air' ? 180 : type === 'kick' ? 120 : 220;
    const endFreq = 40;
    const duration = (type === 'heavy' || type === 'air') ? 0.28 : 0.16;

    osc.frequency.setValueAtTime(startFreq, now);
    osc.frequency.exponentialRampToValueAtTime(endFreq, now + duration);

    oscGain.gain.setValueAtTime(type === 'heavy' ? 0.7 : 0.5, now);
    oscGain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    // 2. White noise burst for punch impact
    const bufferSize = Math.floor(this.ctx.sampleRate * duration);
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }
    const whiteNoise = this.ctx.createBufferSource();
    whiteNoise.buffer = noiseBuffer;

    const noiseFilter = this.ctx.createBiquadFilter();
    noiseFilter.type = 'bandpass';
    noiseFilter.frequency.setValueAtTime(type === 'heavy' ? 600 : 1200, now);
    noiseFilter.Q.setValueAtTime(3, now);

    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(type === 'heavy' ? 0.6 : 0.35, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, now + (duration * 0.7));

    osc.connect(oscGain);
    oscGain.connect(this.sfxGain);

    whiteNoise.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(this.sfxGain);

    osc.start(now);
    osc.stop(now + duration);
    whiteNoise.start(now);
    whiteNoise.stop(now + duration);
  }

  public playBlock() {
    this.initContext();
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;

    // Metallic ring / shield block
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(880, now);
    osc.frequency.exponentialRampToValueAtTime(440, now + 0.15);

    gain.gain.setValueAtTime(0.4, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.15);
  }

  public playSpecial(fighterId: string) {
    this.initContext();
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;

    // Heavy charge laser / fire explosion / electric surge
    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    if (fighterId === 'volt') {
      osc1.type = 'sawtooth';
      osc2.type = 'square';
      osc1.frequency.setValueAtTime(120, now);
      osc1.frequency.linearRampToValueAtTime(800, now + 0.3);
      osc2.frequency.setValueAtTime(240, now);
      osc2.frequency.linearRampToValueAtTime(1200, now + 0.3);
    } else {
      osc1.type = 'sawtooth';
      osc2.type = 'triangle';
      osc1.frequency.setValueAtTime(320, now);
      osc1.frequency.exponentialRampToValueAtTime(60, now + 0.5);
      osc2.frequency.setValueAtTime(540, now);
      osc2.frequency.exponentialRampToValueAtTime(90, now + 0.5);
    }

    gain.gain.setValueAtTime(0.6, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(this.sfxGain);

    osc1.start(now);
    osc2.start(now);
    osc1.stop(now + 0.5);
    osc2.stop(now + 0.5);
  }

  public playRoundAnnounce(text: 'round1' | 'round2' | 'final' | 'fight' | 'ko' | 'select' | 'win') {
    this.initContext();
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;

    if (text === 'fight') {
      // Big impact brass hit
      const frequencies = [110, 220, 330, 440];
      frequencies.forEach(f => {
        const osc = this.ctx!.createOscillator();
        const g = this.ctx!.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(f, now);
        osc.frequency.exponentialRampToValueAtTime(f * 0.8, now + 0.4);
        g.gain.setValueAtTime(0.2, now);
        g.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
        osc.connect(g);
        g.connect(this.sfxGain!);
        osc.start(now);
        osc.stop(now + 0.4);
      });
    } else if (text === 'ko') {
      // Dramatic sub-bass shockwave
      const osc = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(140, now);
      osc.frequency.exponentialRampToValueAtTime(30, now + 1.2);
      g.gain.setValueAtTime(0.8, now);
      g.gain.exponentialRampToValueAtTime(0.001, now + 1.2);
      osc.connect(g);
      g.connect(this.sfxGain);
      osc.start(now);
      osc.stop(now + 1.2);
    } else if (text === 'select') {
      // Sci-fi blip
      const osc = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(520, now);
      osc.frequency.exponentialRampToValueAtTime(1040, now + 0.08);
      g.gain.setValueAtTime(0.3, now);
      g.gain.exponentialRampToValueAtTime(0.01, now + 0.08);
      osc.connect(g);
      g.connect(this.sfxGain);
      osc.start(now);
      osc.stop(now + 0.08);
    } else {
      // Gong / Chime
      const osc = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(330, now);
      osc.frequency.exponentialRampToValueAtTime(165, now + 0.6);
      g.gain.setValueAtTime(0.4, now);
      g.gain.exponentialRampToValueAtTime(0.001, now + 0.6);
      osc.connect(g);
      g.connect(this.sfxGain);
      osc.start(now);
      osc.stop(now + 0.6);
    }
  }

  public startArcadeMusic() {
    this.initContext();
    if (this.isMusicPlaying || !this.ctx || !this.musicGain) return;
    this.isMusicPlaying = true;
    this.currentBeat = 0;

    // 130 BPM = ~115ms per 16th note
    const stepDuration = 115;
    const bassNotes = [55, 55, 65.4, 55, 73.4, 55, 49, 55]; // A1, C2, D2, G1

    this.musicInterval = window.setInterval(() => {
      if (!this.ctx || !this.musicGain || this.isMuted) return;
      const now = this.ctx.currentTime;
      const step = this.currentBeat % 16;

      // Kick on beats 0, 4, 8, 12
      if (step % 4 === 0) {
        const kick = this.ctx.createOscillator();
        const kickG = this.ctx.createGain();
        kick.type = 'sine';
        kick.frequency.setValueAtTime(120, now);
        kick.frequency.exponentialRampToValueAtTime(38, now + 0.12);
        kickG.gain.setValueAtTime(0.45, now);
        kickG.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
        kick.connect(kickG);
        kickG.connect(this.musicGain);
        kick.start(now);
        kick.stop(now + 0.12);
      }

      // Snare on beats 4, 12
      if (step === 4 || step === 12) {
        const snareOsc = this.ctx.createOscillator();
        const snareG = this.ctx.createGain();
        snareOsc.type = 'triangle';
        snareOsc.frequency.setValueAtTime(180, now);
        snareOsc.frequency.exponentialRampToValueAtTime(60, now + 0.1);
        snareG.gain.setValueAtTime(0.2, now);
        snareG.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
        snareOsc.connect(snareG);
        snareG.connect(this.musicGain);
        snareOsc.start(now);
        snareOsc.stop(now + 0.1);
      }

      // Cyber Synth Bassline
      if (step % 2 === 0) {
        const noteIdx = Math.floor(step / 2);
        const bassFreq = bassNotes[noteIdx % bassNotes.length];
        const bass = this.ctx.createOscillator();
        const filter = this.ctx.createBiquadFilter();
        const bassG = this.ctx.createGain();

        bass.type = 'sawtooth';
        bass.frequency.setValueAtTime(bassFreq, now);

        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(450, now);
        filter.frequency.exponentialRampToValueAtTime(180, now + 0.18);

        bassG.gain.setValueAtTime(0.22, now);
        bassG.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

        bass.connect(filter);
        filter.connect(bassG);
        bassG.connect(this.musicGain);

        bass.start(now);
        bass.stop(now + 0.18);
      }

      this.currentBeat++;
    }, stepDuration);
  }

  public stopArcadeMusic() {
    if (this.musicInterval !== null) {
      clearInterval(this.musicInterval);
      this.musicInterval = null;
    }
    this.isMusicPlaying = false;
  }
}

export const soundEngine = new SoundEngine();
