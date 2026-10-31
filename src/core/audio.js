// Âm thanh tổng hợp bằng Web Audio — không cần file ngoài.
// SFX ngắn + nhạc nền thủ tục (điệu thứ Dorian, đàn lute giả lập).
export class AudioSys {
  constructor() {
    this.ctx = null;
    this.master = null;
    this.sfxGain = null;
    this.musicGain = null;
    this.volume = { master: 0.8, sfx: 0.9, music: 0.45 };
    this.music = null;
    this.noiseBuf = null;
  }

  unlock() {
    if (this.ctx) { if (this.ctx.state === 'suspended') this.ctx.resume(); return; }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    this.ctx = new AC();
    this.master = this.ctx.createGain();
    this.master.gain.value = this.volume.master;
    this.master.connect(this.ctx.destination);
    const comp = this.ctx.createDynamicsCompressor();
    comp.threshold.value = -14; comp.ratio.value = 4;
    comp.connect(this.master);
    this.sfxGain = this.ctx.createGain(); this.sfxGain.gain.value = this.volume.sfx; this.sfxGain.connect(comp);
    this.musicGain = this.ctx.createGain(); this.musicGain.gain.value = this.volume.music; this.musicGain.connect(comp);
    const len = this.ctx.sampleRate;
    this.noiseBuf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
    const d = this.noiseBuf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
  }

  setVolume(kind, v) {
    this.volume[kind] = v;
    if (!this.ctx) return;
    if (kind === 'master') this.master.gain.value = v;
    if (kind === 'sfx') this.sfxGain.gain.value = v;
    if (kind === 'music') this.musicGain.gain.value = v;
  }

  _tone({ type = 'square', f0 = 440, f1 = null, dur = 0.1, vol = 0.3, attack = 0.002, delay = 0, dest = null, detune = 0 }) {
    const c = this.ctx, t = c.currentTime + delay;
    const o = c.createOscillator(), g = c.createGain();
    o.type = type; o.frequency.setValueAtTime(f0, t); o.detune.value = detune;
    if (f1 != null) o.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t + dur);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(dest || this.sfxGain);
    o.start(t); o.stop(t + dur + 0.02);
  }

  _noise({ dur = 0.15, vol = 0.3, f = 1200, q = 1, type = 'bandpass', f1 = null, delay = 0, dest = null }) {
    const c = this.ctx, t = c.currentTime + delay;
    const s = c.createBufferSource(); s.buffer = this.noiseBuf;
    const fl = c.createBiquadFilter(); fl.type = type; fl.frequency.setValueAtTime(f, t); fl.Q.value = q;
    if (f1) fl.frequency.exponentialRampToValueAtTime(f1, t + dur);
    const g = c.createGain();
    g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    s.connect(fl); fl.connect(g); g.connect(dest || this.sfxGain);
    s.start(t, Math.random() * 0.5); s.stop(t + dur + 0.02);
  }

  play(name, opt = {}) {
    if (!this.ctx) return;
    const p = opt.pitch || 1;
    switch (name) {
      case 'swing': this._noise({ dur: 0.12, vol: 0.22, f: 900 * p, f1: 3000 * p, q: 0.8 }); break;
      case 'heavySwing': this._noise({ dur: 0.22, vol: 0.3, f: 400 * p, f1: 1600, q: 0.7 }); break;
      case 'hit': this._noise({ dur: 0.09, vol: 0.35, f: 1800, q: 2 }); this._tone({ type: 'square', f0: 220 * p, f1: 90, dur: 0.08, vol: 0.18 }); break;
      case 'heavyHit': this._noise({ dur: 0.2, vol: 0.45, f: 600, q: 1, type: 'lowpass' }); this._tone({ type: 'sawtooth', f0: 140, f1: 45, dur: 0.18, vol: 0.3 }); break;
      case 'crit':
        this._noise({ dur: 0.25, vol: 0.45, f: 2500, q: 1.5 });
        this._tone({ type: 'square', f0: 880, f1: 1760, dur: 0.12, vol: 0.18 });
        this._tone({ type: 'sawtooth', f0: 160, f1: 40, dur: 0.3, vol: 0.35 }); break;
      case 'block': this._tone({ type: 'triangle', f0: 1400, f1: 900, dur: 0.12, vol: 0.22 }); this._noise({ dur: 0.06, vol: 0.2, f: 4000, q: 4 }); break;
      case 'jump': this._tone({ type: 'square', f0: 260, f1: 520, dur: 0.09, vol: 0.12 }); break;
      case 'djump': this._tone({ type: 'square', f0: 380, f1: 760, dur: 0.1, vol: 0.12 }); this._noise({ dur: 0.1, vol: 0.1, f: 2400 }); break;
      case 'land': this._noise({ dur: 0.07, vol: 0.18, f: 300, type: 'lowpass' }); break;
      case 'roll': this._noise({ dur: 0.2, vol: 0.18, f: 500, f1: 1500, q: 0.6 }); break;
      case 'hurt': this._tone({ type: 'sawtooth', f0: 300, f1: 80, dur: 0.25, vol: 0.3 }); this._noise({ dur: 0.15, vol: 0.3, f: 800 }); break;
      case 'enemyDie': this._noise({ dur: 0.35, vol: 0.3, f: 700, f1: 150, q: 1 }); this._tone({ type: 'triangle', f0: 200, f1: 60, dur: 0.3, vol: 0.2 }); break;
      case 'coin': this._tone({ type: 'square', f0: 1320 * p, dur: 0.06, vol: 0.1 }); this._tone({ type: 'square', f0: 1760 * p, dur: 0.1, vol: 0.1, delay: 0.05 }); break;
      case 'pickup': [523, 659, 784].forEach((f, i) => this._tone({ type: 'triangle', f0: f, dur: 0.12, vol: 0.18, delay: i * 0.06 })); break;
      case 'dice': for (let i = 0; i < 6; i++) this._noise({ dur: 0.04, vol: 0.18, f: 3000 + Math.random() * 2000, q: 6, delay: i * 0.07 }); break;
      case 'diceLand': this._noise({ dur: 0.06, vol: 0.3, f: 2200, q: 5 }); this._tone({ type: 'triangle', f0: 660, dur: 0.15, vol: 0.15, delay: 0.02 }); break;
      case 'fate6': [523, 659, 784, 1047].forEach((f, i) => this._tone({ type: 'square', f0: f, dur: 0.18, vol: 0.14, delay: i * 0.05 })); break;
      case 'fail': this._tone({ type: 'triangle', f0: 330, f1: 160, dur: 0.4, vol: 0.2 }); this._tone({ type: 'triangle', f0: 247, f1: 120, dur: 0.45, vol: 0.15, delay: 0.12 }); break;
      case 'chest': this._tone({ type: 'square', f0: 196, f1: 392, dur: 0.15, vol: 0.15 }); [784, 988, 1175, 1568].forEach((f, i) => this._tone({ type: 'triangle', f0: f, dur: 0.2, vol: 0.14, delay: 0.12 + i * 0.07 })); break;
      case 'buff': [392, 523, 659, 784, 1047].forEach((f, i) => this._tone({ type: 'triangle', f0: f, dur: 0.3, vol: 0.12, delay: i * 0.05 })); break;
      case 'gate': this._tone({ type: 'sine', f0: 110, f1: 220, dur: 0.8, vol: 0.3 }); this._tone({ type: 'triangle', f0: 440, f1: 880, dur: 0.6, vol: 0.12, delay: 0.2 }); break;
      case 'shoot': this._noise({ dur: 0.08, vol: 0.2, f: 2500, f1: 800, q: 3 }); this._tone({ type: 'triangle', f0: 700, f1: 300, dur: 0.08, vol: 0.12 }); break;
      case 'fire': this._noise({ dur: 0.3, vol: 0.25, f: 600, f1: 200, q: 0.8, type: 'lowpass' }); break;
      case 'explode': this._noise({ dur: 0.45, vol: 0.5, f: 900, f1: 80, q: 0.6, type: 'lowpass' }); this._tone({ type: 'sine', f0: 90, f1: 30, dur: 0.4, vol: 0.4 }); break;
      case 'zap': for (let i = 0; i < 3; i++) this._tone({ type: 'sawtooth', f0: 1400 - i * 300, f1: 200, dur: 0.07, vol: 0.12, delay: i * 0.03 }); this._noise({ dur: 0.12, vol: 0.2, f: 5000, q: 2 }); break;
      case 'ice': this._tone({ type: 'sine', f0: 2200, f1: 1200, dur: 0.15, vol: 0.12 }); this._noise({ dur: 0.1, vol: 0.12, f: 6000, q: 3 }); break;
      case 'telegraph': this._tone({ type: 'square', f0: 990, dur: 0.05, vol: 0.08 }); break;
      case 'bossRoar': this._tone({ type: 'sawtooth', f0: 90, f1: 55, dur: 1.2, vol: 0.4 }); this._noise({ dur: 1.0, vol: 0.3, f: 300, q: 0.5, type: 'lowpass' }); break;
      case 'slam': this._noise({ dur: 0.4, vol: 0.5, f: 200, type: 'lowpass' }); this._tone({ type: 'sine', f0: 70, f1: 30, dur: 0.4, vol: 0.5 }); break;
      case 'heal': [440, 554, 659].forEach((f, i) => this._tone({ type: 'sine', f0: f, dur: 0.35, vol: 0.15, delay: i * 0.08 })); break;
      case 'menu': this._tone({ type: 'square', f0: 660, dur: 0.05, vol: 0.08 }); break;
      case 'select': this._tone({ type: 'square', f0: 880, dur: 0.06, vol: 0.1 }); this._tone({ type: 'square', f0: 1320, dur: 0.08, vol: 0.1, delay: 0.05 }); break;
      case 'forge': this._tone({ type: 'triangle', f0: 1800, f1: 1500, dur: 0.25, vol: 0.2 }); this._tone({ type: 'triangle', f0: 2400, dur: 0.3, vol: 0.1, delay: 0.02 }); this._noise({ dur: 0.08, vol: 0.25, f: 5000, q: 4 }); break;
      case 'death': this._tone({ type: 'sawtooth', f0: 220, f1: 40, dur: 1.4, vol: 0.35 }); this._tone({ type: 'triangle', f0: 330, f1: 55, dur: 1.6, vol: 0.2, delay: 0.1 }); break;
      default: break;
    }
  }

  // ---------------- Nhạc nền thủ tục ----------------
  startMusic(mood = 'field') {
    if (!this.ctx) return;
    if (this.music && this.music.mood === mood) return;
    this.stopMusic();
    const c = this.ctx;
    const out = c.createGain(); out.gain.value = 0; out.connect(this.musicGain);
    out.gain.linearRampToValueAtTime(1, c.currentTime + 2);
    // Âm vang giả bằng delay feedback
    const dl = c.createDelay(); dl.delayTime.value = 0.33;
    const fb = c.createGain(); fb.gain.value = 0.32;
    const lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 2200;
    dl.connect(fb); fb.connect(lp); lp.connect(dl); dl.connect(out);
    const cfg = {
      field: { bpm: 84, root: 146.83, prog: [0, 0, -2, -4, 0, 0, 3, -2], scale: [0, 2, 3, 5, 7, 9, 10, 12, 14, 15], density: 0.55 },
      rest: { bpm: 66, root: 164.81, prog: [0, 5, 3, 0], scale: [0, 2, 4, 7, 9, 12, 14], density: 0.35 },
      boss: { bpm: 132, root: 110, prog: [0, 0, 1, 0, -2, -2, 1, 3], scale: [0, 1, 3, 5, 7, 8, 10, 12], density: 0.75 },
      title: { bpm: 70, root: 146.83, prog: [0, -2, -4, -5], scale: [0, 2, 3, 5, 7, 9, 10, 12], density: 0.4 },
    }[mood] || null;
    if (!cfg) return;
    const step = 60 / cfg.bpm / 2; // nốt móc đơn
    let t = c.currentTime + 0.1, i = 0;
    const st = { mood, out, timer: null, alive: true };
    const semi = (n) => Math.pow(2, n / 12);
    const pluck = (f, when, vol, dur = 0.6) => {
      const o = c.createOscillator(), o2 = c.createOscillator(), g = c.createGain(), f1 = c.createBiquadFilter();
      o.type = 'triangle'; o2.type = 'square'; o.frequency.value = f; o2.frequency.value = f * 2.001;
      f1.type = 'lowpass'; f1.frequency.setValueAtTime(3200, when); f1.frequency.exponentialRampToValueAtTime(500, when + dur);
      const g2 = c.createGain(); g2.gain.value = 0.18;
      g.gain.setValueAtTime(0.0001, when); g.gain.exponentialRampToValueAtTime(vol, when + 0.005); g.gain.exponentialRampToValueAtTime(0.0001, when + dur);
      o.connect(f1); o2.connect(g2); g2.connect(f1); f1.connect(g); g.connect(out); g.connect(dl);
      o.start(when); o2.start(when); o.stop(when + dur + 0.05); o2.stop(when + dur + 0.05);
    };
    const drone = (f, when, dur, vol) => {
      const o = c.createOscillator(), g = c.createGain();
      o.type = 'sawtooth'; o.frequency.value = f;
      const fl = c.createBiquadFilter(); fl.type = 'lowpass'; fl.frequency.value = 380;
      g.gain.setValueAtTime(0.0001, when); g.gain.linearRampToValueAtTime(vol, when + 0.4); g.gain.linearRampToValueAtTime(0.0001, when + dur);
      o.connect(fl); fl.connect(g); g.connect(out); o.start(when); o.stop(when + dur + 0.1);
    };
    const drum = (when, low) => {
      const s = c.createBufferSource(); s.buffer = this.noiseBuf;
      const fl = c.createBiquadFilter(); fl.type = low ? 'lowpass' : 'bandpass'; fl.frequency.value = low ? 160 : 1800;
      const g = c.createGain(); g.gain.setValueAtTime(low ? 0.5 : 0.12, when); g.gain.exponentialRampToValueAtTime(0.0001, when + (low ? 0.25 : 0.07));
      s.connect(fl); fl.connect(g); g.connect(out); s.start(when, Math.random()); s.stop(when + 0.3);
    };
    let lastNote = 4;
    const schedule = () => {
      if (!st.alive) return;
      while (t < c.currentTime + 0.4) {
        const bar = Math.floor(i / 8) % cfg.prog.length;
        const chordRoot = cfg.root * semi(cfg.prog[bar]);
        if (i % 8 === 0) { drone(chordRoot / 2, t, step * 8, 0.09); drone(chordRoot * semi(7) / 2, t, step * 8, 0.05); }
        if (mood === 'boss') { if (i % 4 === 0) drum(t, true); if (i % 2 === 1) drum(t, false); }
        else if (mood === 'field' && i % 8 === 0) drum(t, true);
        if (Math.random() < cfg.density || i % 4 === 0) {
          lastNote = Math.max(0, Math.min(cfg.scale.length - 1, lastNote + Math.round((Math.random() - 0.5) * 3)));
          pluck(chordRoot * semi(cfg.scale[lastNote]), t, 0.11, mood === 'boss' ? 0.35 : 0.7);
        }
        t += step; i++;
      }
      st.timer = setTimeout(schedule, 120);
    };
    schedule();
    this.music = st;
  }

  stopMusic() {
    if (!this.music) return;
    const m = this.music; m.alive = false; clearTimeout(m.timer);
    const c = this.ctx;
    m.out.gain.cancelScheduledValues(c.currentTime);
    m.out.gain.setValueAtTime(m.out.gain.value, c.currentTime);
    m.out.gain.linearRampToValueAtTime(0, c.currentTime + 0.8);
    setTimeout(() => m.out.disconnect(), 1200);
    this.music = null;
  }
}
