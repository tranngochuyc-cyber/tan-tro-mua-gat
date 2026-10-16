// ============================================================
// AudioManager — music and SFX with volume control
// ============================================================
export class AudioManager {
  constructor() {
    this.musicVolume = 0;
    this.sfxVolume = 0;
    this.currentBgm = null;
    this.currentBgmKey = null;
    this.audioCtx = null;
    this.userInteracted = false;
    this.sfxPool = {};
  }

  init() {
    // Audio context will be created on first user interaction
    const handler = () => {
      this.userInteracted = true;
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!this.audioCtx && AudioCtx) {
        this.audioCtx = new AudioCtx();
      }
      if (this.audioCtx && this.audioCtx.state === 'suspended') {
        this.audioCtx.resume();
      }
      if (this.currentBgm && this.currentBgm.paused) {
        this.currentBgm.play().catch(() => {});
      }
      window.removeEventListener('click', handler);
      window.removeEventListener('keydown', handler);
      window.removeEventListener('pointerdown', handler);
      window.removeEventListener('touchstart', handler);
    };
    window.addEventListener('click', handler);
    window.addEventListener('keydown', handler);
    window.addEventListener('pointerdown', handler);
    window.addEventListener('touchstart', handler, { passive: true });
  }

  playBgm(audioElement, key) {
    if (!audioElement || this.currentBgmKey === key) return;
    this.stopBgm();
    this.currentBgm = audioElement.cloneNode();
    this.currentBgm.loop = true;
    this.currentBgm.volume = this.musicVolume;
    this.currentBgmKey = key;
    if (this.userInteracted) {
      this.currentBgm.play().catch(() => {});
    }
  }

  stopBgm() {
    if (this.currentBgm) {
      this.currentBgm.pause();
      this.currentBgm.currentTime = 0;
      this.currentBgm = null;
      this.currentBgmKey = null;
    }
  }

  setMusicVolume(v) {
    this.musicVolume = Math.max(0, Math.min(1, v));
    if (this.currentBgm) this.currentBgm.volume = this.musicVolume;
  }

  setSfxVolume(v) {
    this.sfxVolume = Math.max(0, Math.min(1, v));
  }

  /** Play a procedurally generated SFX */
  playSfx(type) {
    if (!this.userInteracted || !this.audioCtx) return;
    const ctx = this.audioCtx;
    const now = ctx.currentTime;
    const gain = ctx.createGain();
    gain.connect(ctx.destination);
    gain.gain.value = this.sfxVolume * 0.3;

    switch (type) {
      case 'slash': {
        const osc = ctx.createOscillator();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(200, now);
        osc.frequency.exponentialRampToValueAtTime(80, now + 0.1);
        gain.gain.setValueAtTime(this.sfxVolume * 0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
        osc.connect(gain);
        osc.start(now);
        osc.stop(now + 0.15);
        break;
      }
      case 'hit': {
        const osc = ctx.createOscillator();
        osc.type = 'square';
        osc.frequency.setValueAtTime(150, now);
        osc.frequency.exponentialRampToValueAtTime(50, now + 0.08);
        gain.gain.setValueAtTime(this.sfxVolume * 0.25, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
        osc.connect(gain);
        osc.start(now);
        osc.stop(now + 0.1);
        break;
      }
      case 'dash': {
        const osc = ctx.createOscillator();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(400, now);
        osc.frequency.exponentialRampToValueAtTime(800, now + 0.15);
        gain.gain.setValueAtTime(this.sfxVolume * 0.15, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
        osc.connect(gain);
        osc.start(now);
        osc.stop(now + 0.2);
        break;
      }
      case 'xp': {
        const osc = ctx.createOscillator();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(600, now);
        osc.frequency.exponentialRampToValueAtTime(1200, now + 0.08);
        gain.gain.setValueAtTime(this.sfxVolume * 0.1, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
        osc.connect(gain);
        osc.start(now);
        osc.stop(now + 0.1);
        break;
      }
      case 'levelup': {
        [0, 0.1, 0.2].forEach((delay, i) => {
          const osc = ctx.createOscillator();
          const g = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.value = 500 + i * 200;
          g.gain.setValueAtTime(this.sfxVolume * 0.15, now + delay);
          g.gain.exponentialRampToValueAtTime(0.001, now + delay + 0.15);
          osc.connect(g);
          g.connect(ctx.destination);
          osc.start(now + delay);
          osc.stop(now + delay + 0.15);
        });
        break;
      }
      case 'chest': {
        const osc = ctx.createOscillator();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(300, now);
        osc.frequency.exponentialRampToValueAtTime(900, now + 0.3);
        gain.gain.setValueAtTime(this.sfxVolume * 0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
        osc.connect(gain);
        osc.start(now);
        osc.stop(now + 0.35);
        break;
      }
      case 'death': {
        const osc = ctx.createOscillator();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(200, now);
        osc.frequency.exponentialRampToValueAtTime(30, now + 0.5);
        gain.gain.setValueAtTime(this.sfxVolume * 0.3, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);
        osc.connect(gain);
        osc.start(now);
        osc.stop(now + 0.6);
        break;
      }
      case 'boss_warn': {
        [0, 0.15, 0.3].forEach((delay) => {
          const osc = ctx.createOscillator();
          const g = ctx.createGain();
          osc.type = 'square';
          osc.frequency.value = 100;
          g.gain.setValueAtTime(this.sfxVolume * 0.2, now + delay);
          g.gain.exponentialRampToValueAtTime(0.001, now + delay + 0.12);
          osc.connect(g);
          g.connect(ctx.destination);
          osc.start(now + delay);
          osc.stop(now + delay + 0.12);
        });
        break;
      }
      case 'fire': {
        const noise = ctx.createOscillator();
        noise.type = 'sawtooth';
        noise.frequency.setValueAtTime(100, now);
        noise.frequency.exponentialRampToValueAtTime(300, now + 0.12);
        gain.gain.setValueAtTime(this.sfxVolume * 0.15, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
        noise.connect(gain);
        noise.start(now);
        noise.stop(now + 0.15);
        break;
      }
      case 'ice': {
        const osc = ctx.createOscillator();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(1200, now);
        osc.frequency.exponentialRampToValueAtTime(600, now + 0.15);
        gain.gain.setValueAtTime(this.sfxVolume * 0.12, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
        osc.connect(gain);
        osc.start(now);
        osc.stop(now + 0.18);
        break;
      }
      case 'lightning': {
        const osc = ctx.createOscillator();
        osc.type = 'square';
        osc.frequency.setValueAtTime(800, now);
        osc.frequency.exponentialRampToValueAtTime(100, now + 0.08);
        gain.gain.setValueAtTime(this.sfxVolume * 0.25, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
        osc.connect(gain);
        osc.start(now);
        osc.stop(now + 0.1);
        break;
      }
      case 'gate': {
        [0, 0.08, 0.16, 0.24].forEach((delay, i) => {
          const osc = ctx.createOscillator();
          const g = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.value = 400 + i * 100;
          g.gain.setValueAtTime(this.sfxVolume * 0.12, now + delay);
          g.gain.exponentialRampToValueAtTime(0.001, now + delay + 0.12);
          osc.connect(g);
          g.connect(ctx.destination);
          osc.start(now + delay);
          osc.stop(now + delay + 0.12);
        });
        break;
      }
    }
  }
}
