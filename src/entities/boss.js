// Hiệp Sĩ Bù Nhìn — boss chương I. 2 pha, 4 đòn, đòn nào cũng có báo hiệu rõ.
import { approach, rand, clamp } from '../core/util.js';

export class Boss {
  constructor(x, y, depth) {
    this.isBoss = true;
    this.type = 'boss';
    this.name = 'Hiệp Sĩ Bù Nhìn';
    this.w = 24; this.h = 40;
    this.x = x - this.w / 2; this.y = y - this.h;
    this.vx = 0; this.vy = 0; this.facing = -1;
    this.maxHp = Math.round(1500 * (1 + 0.1 * (depth - 8)));
    this.hp = this.maxHp;
    this.dmg = 20;
    this.state = 'intro'; this.t = 1.8;
    this.phase = 1; this.flash = 0; this.onGround = false;
    this.status = { burn: 0, burnDps: 0, bleed: 0, bleedStacks: 0, slow: 0, freeze: 0, stun: 0, ice: 0 };
    this.dead = false; this.remove = false; this.deathT = 0; this.animT = 0;
    this.move = null; this.combo = 0; this.atkHit = false;
    this.lastMoves = [];
    this.poiseDmg = 0;
    this.T = { name: this.name, poise: 99, gold: [0, 0] };
    this.elite = null;
    this.telegraph = null; // vùng cảnh báo để vẽ
  }
  get cx() { return this.x + this.w / 2; }
  get cy() { return this.y + this.h / 2; }

  update(dt, s) {
    this.animT += dt;
    this.flash = Math.max(0, this.flash - dt);
    const st = this.status;
    if (st.burn > 0) { st.burn -= dt; this._tick = (this._tick || 0) + dt; if (this._tick > 0.5) { this._tick = 0; s.damageEnemy(this, st.burnDps * 0.5, { kind: 'dot' }); } }
    if (st.bleed > 0) { st.bleed -= dt; this._bt = (this._bt || 0) + dt; if (this._bt > 0.6) { this._bt = 0; s.damageEnemy(this, 2 * st.bleedStacks, { kind: 'dot' }); } } else st.bleedStacks = 0;
    st.slow = Math.max(0, st.slow - dt); st.stun = Math.max(0, st.stun - dt); st.freeze = Math.max(0, st.freeze - dt);
    if (this.dead) { this.deathT += dt; if (Math.random() < 0.5) s.fx.burst(this.cx + rand(-12, 12), this.cy + rand(-16, 16), 3, { colors: ['#ffb340', '#ff5a3c', '#3a2a22'], speed: 80, life: 0.6, grav: -60 }); return; }

    if (this.phase === 1 && this.hp < this.maxHp * 0.5) {
      this.phase = 2; this.state = 'roar'; this.t = 1.2; this.vx = 0; this.telegraph = null;
      s.audio.play('bossRoar'); s.camera.shake(0.6); s.fx.ring(this.cx, this.cy, 4, 120, '#ff5a3c', 0.8);
      s.toast('Hiệp Sĩ Bù Nhìn bốc cháy!');
    }
    const spd = (this.phase === 2 ? 1.25 : 1) * (st.slow > 0 ? 0.75 : 1);
    const p = s.player;
    const dx = p.cx - this.cx, adx = Math.abs(dx);
    if (st.stun > 0 || st.freeze > 0) { this.vx = approach(this.vx, 0, 900 * dt); }
    else { this.t -= dt * spd; this.think(dt, s, dx, adx, spd); }

    this.vy = Math.min(this.vy + 1400 * dt, 600);
    s.level.moveX(this, this.vx * dt);
    const landed = s.level.moveY(this, this.vy * dt);
    if (landed) {
      if (this.vy > 300 && this.state === 'leap') this.onSlam(s);
      if (this.vy > 0) this.onGround = true; this.vy = 0;
    } else this.onGround = false;
  }

  pickMove(adx) {
    const opts = [];
    if (adx < 90) opts.push(['combo', 3]);
    if (adx > 60) opts.push(['dash', 2]);
    opts.push(['leap', 2]);
    opts.push(['crows', this.phase === 2 ? 2 : 1]);
    if (this.phase === 2) opts.push(['wave', 2]);
    const filtered = opts.filter(([m]) => this.lastMoves.slice(-2).filter((x) => x === m).length < 2);
    const pool = filtered.length ? filtered : opts;
    const total = pool.reduce((a, b) => a + b[1], 0);
    let r = Math.random() * total;
    for (const [m, w] of pool) if ((r -= w) <= 0) return m;
    return pool[0][0];
  }

  think(dt, s, dx, adx, spd) {
    const p = s.player;
    switch (this.state) {
      case 'intro': this.vx = 0; if (this.t <= 0) { this.state = 'idle'; this.t = 0.6; } break;
      case 'roar': this.vx = 0; if (this.t <= 0) { this.state = 'idle'; this.t = 0.3; } break;
      case 'idle': {
        this.facing = Math.sign(dx) || this.facing;
        this.vx = approach(this.vx, adx > 70 ? this.facing * 55 * spd : 0, 500 * dt);
        if (this.t <= 0) {
          const m = this.pickMove(adx); this.lastMoves.push(m);
          this.move = m; this.combo = 0;
          s.audio.play('telegraph');
          if (m === 'combo') { this.state = 'windup'; this.t = 0.5; }
          if (m === 'dash') { this.state = 'windup'; this.t = 0.6; }
          if (m === 'leap') { this.state = 'windup'; this.t = 0.55; }
          if (m === 'crows') { this.state = 'windup'; this.t = 0.5; }
          if (m === 'wave') { this.state = 'windup'; this.t = 0.6; }
        }
        break;
      }
      case 'windup': {
        this.vx = approach(this.vx, 0, 900 * dt);
        if (this.move !== 'crows') this.facing = Math.sign(dx) || this.facing;
        if (this.move === 'dash') this.telegraph = { kind: 'line', x: this.cx, y: this.y + this.h - 6, dir: this.facing, len: 260 };
        if (this.move === 'leap') this.telegraph = { kind: 'circle', x: p.cx, y: this.y + this.h, r: 26 };
        if (this.t <= 0) this.execute(s, dx);
        break;
      }
      case 'swing': {
        this.vx = approach(this.vx, 0, 700 * dt);
        const box = { x: this.facing > 0 ? this.cx : this.cx - 46, y: this.y + 2, w: 46, h: this.h - 2 };
        if (!this.atkHit && this.t < 0.18 && this.t > 0.04 && s.hitPlayerBox(box, this.dmg, this.cx)) this.atkHit = true;
        if (this.t <= 0) {
          this.combo++;
          const max = this.phase === 2 ? 4 : 3;
          if (this.combo < max) { this.state = 'windup2'; this.t = this.phase === 2 ? 0.22 : 0.3; this.facing = Math.sign(dx) || this.facing; s.audio.play('telegraph'); }
          else { this.state = 'recover'; this.t = 0.85; }
        }
        break;
      }
      case 'windup2': this.vx = approach(this.vx, 0, 700 * dt); if (this.t <= 0) this.doSwing(s); break;
      case 'dashing': {
        this.vx = this.facing * 330;
        const box = { x: this.x - 4, y: this.y + 4, w: this.w + 8, h: this.h - 4 };
        if (!this.atkHit && s.hitPlayerBox(box, this.dmg, this.cx)) this.atkHit = true;
        if (Math.random() < 0.7) s.fx.dust(this.cx, this.y + this.h, 1, -this.facing);
        const wall = s.level.pointSolid(this.cx + this.facing * (this.w / 2 + 4), this.cy);
        if (this.t <= 0 || wall) {
          this.telegraph = null;
          if (wall) { s.camera.shake(0.35); s.audio.play('slam'); this.state = 'recover'; this.t = 1.1; this.vx = -this.facing * 80; s.toast('Hắn va vào tường — choáng!'); }
          else { this.state = 'recover'; this.t = 0.6; }
        }
        break;
      }
      case 'leap': if (this.vy < 0) this.vx = approach(this.vx, 0, 50 * dt); break;
      case 'casting': this.vx = 0; if (this.t <= 0) { this.state = 'recover'; this.t = 0.6; } break;
      case 'recover': this.vx = approach(this.vx, 0, 600 * dt); if (this.t <= 0) { this.state = 'idle'; this.t = this.phase === 2 ? 0.35 : 0.65; } break;
    }
  }

  execute(s, dx) {
    const p = s.player;
    this.telegraph = null;
    if (this.move === 'combo') this.doSwing(s);
    if (this.move === 'dash') { this.state = 'dashing'; this.t = 0.85; this.atkHit = false; s.audio.play('heavySwing', { pitch: 0.6 }); }
    if (this.move === 'leap') {
      this.state = 'leap'; this.atkHit = false;
      const tx = clamp(p.cx, 40, s.level.pw - 40);
      const time = 0.8;
      this.vx = (tx - this.cx) / time; this.vy = -560;
      s.audio.play('jump', { pitch: 0.5 });
    }
    if (this.move === 'crows') {
      this.state = 'casting'; this.t = 0.9;
      const n = this.phase === 2 ? 6 : 4;
      const xs = [];
      for (let i = 0; i < n; i++) xs.push(clamp(p.cx + (i - (n - 1) / 2) * 44 + rand(-8, 8), 24, s.level.pw - 24));
      xs.forEach((x, i) => s.spawnCrow(x, 0.75 + i * 0.12, this.dmg - 4));
      s.audio.play('bossRoar', { pitch: 1.5 });
    }
    if (this.move === 'wave') {
      this.state = 'casting'; this.t = 0.8;
      for (const dir of [-1, 1]) s.spawnEnemyShot('flamewave', this.cx + dir * 14, this.y + this.h - 10, dir * 190, 0, this.dmg - 2, { ground: true, life: 2.2 });
      s.audio.play('fire'); s.camera.shake(0.25);
    }
  }

  doSwing(s) {
    this.state = 'swing'; this.t = 0.24; this.atkHit = false;
    this.vx = this.facing * 160;
    s.audio.play('heavySwing', { pitch: 0.7 });
    s.fx.slash({ x: this.cx, y: this.y + 22, dir: this.facing, r0: 14, r1: 46, a0: (this.combo % 2 ? 70 : -150) * Math.PI / 180, a1: (this.combo % 2 ? -150 : 70) * Math.PI / 180, color: this.phase === 2 ? '#ff7a3c' : '#d9c39a', edge: '#fff2d0', life: 0.16 });
  }

  onSlam(s) {
    this.state = 'recover'; this.t = 0.9; this.vx = 0;
    s.audio.play('slam'); s.camera.shake(0.55);
    s.fx.dust(this.cx, this.y + this.h, 20);
    s.fx.ring(this.cx, this.y + this.h, 4, 60, '#e8c79a', 0.4);
    const box = { x: this.cx - 34, y: this.y + this.h - 26, w: 68, h: 26 };
    s.hitPlayerBox(box, this.dmg + 4, this.cx);
    for (const dir of [-1, 1]) s.spawnEnemyShot('shock', this.cx + dir * 20, this.y + this.h - 8, dir * 210, 0, this.dmg - 6, { ground: true, life: 0.9 });
  }

  blocks() { return false; }
  takeHit(amount, info, s) {
    this.hp -= amount; this.flash = 0.08;
    this.poiseDmg += amount;
    // Tích đủ sát thương liên tục thì boss bị choáng ngắn (thưởng cho người chơi dồn đòn)
    if (this.poiseDmg > this.maxHp * 0.12 && (this.state === 'idle' || this.state === 'recover')) {
      this.poiseDmg = 0; this.state = 'recover'; this.t = 0.9; s.toast('Phá thế! Hiệp sĩ loạng choạng');
      s.fx.ring(this.cx, this.cy, 4, 40, '#ffd23f', 0.35);
    }
    if (info.stun && this.status.stun <= 0) this.status.stun = info.stun * 0.4;
  }
}
