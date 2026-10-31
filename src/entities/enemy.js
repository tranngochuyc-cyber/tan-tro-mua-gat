// Quái thường + tinh anh. Mỗi loại có máy trạng thái riêng, mọi đòn đều có báo hiệu (telegraph).
import { approach, clamp, rand } from '../core/util.js';

export const ENEMY_TYPES = {
  scarecrow: { name: 'Bù Nhìn Tro', hp: 44, w: 12, h: 22, speed: 46, dmg: 12, gold: [3, 6], poise: 1, sight: 200,
    atk: { range: 28, windup: 0.45, active: 0.14, recover: 0.55, box: { x: 2, y: -20, w: 26, h: 22 }, lunge: 140, cd: 0.9 } },
  hound: { name: 'Chó Tro', hp: 28, w: 18, h: 11, speed: 118, dmg: 10, gold: [2, 4], poise: 1, sight: 230,
    atk: { range: 70, windup: 0.38, active: 0.4, recover: 0.6, leap: { vx: 270, vy: -200 }, cd: 1.0 } },
  archer: { name: 'Cung Thủ Xương', hp: 30, w: 10, h: 20, speed: 42, dmg: 9, gold: [3, 6], poise: 1, sight: 300, keep: 110,
    atk: { range: 250, windup: 0.8, active: 0.05, recover: 0.7, shot: { speed: 260, grav: 0 }, cd: 2.3 } },
  cultist: { name: 'Tà Đồ Tro', hp: 36, w: 10, h: 21, speed: 30, dmg: 7, gold: [4, 7], poise: 1, sight: 300, float: true,
    atk: { range: 240, windup: 0.6, active: 0.3, recover: 0.8, orbs: 3, cd: 2.4 } },
  shield: { name: 'Khiên Binh Tro', hp: 64, w: 15, h: 22, speed: 34, dmg: 15, gold: [5, 9], poise: 3, sight: 220, shield: true,
    atk: { range: 70, windup: 0.55, active: 0.36, recover: 0.7, dash: 260, box: { x: 2, y: -20, w: 18, h: 22 }, cd: 1.3 } },
  dummy: { name: 'Bù Nhìn Tập', hp: 60, w: 12, h: 22, speed: 0, dmg: 0, gold: [0, 0], poise: 1, sight: 0, dummy: true },
};

export const ELITE_AFFIXES = {
  fury: { name: 'Cuồng Nộ', color: '#ff5a3c' },
  armored: { name: 'Thiết Giáp', color: '#9fb4c8' },
  volatile: { name: 'Dễ Nổ', color: '#ffb340' },
};

export class Enemy {
  constructor(type, x, y, depth, elite = null) {
    const T = ENEMY_TYPES[type];
    this.type = type; this.T = T;
    this.w = T.w * (elite ? 1.25 : 1) | 0; this.h = T.h * (elite ? 1.2 : 1) | 0;
    this.x = x - this.w / 2; this.y = y - this.h;
    this.vx = 0; this.vy = 0;
    this.facing = -1;
    const scale = 1 + 0.32 * (depth - 1);
    this.maxHp = Math.round(T.hp * scale * (elite ? 2.6 : 1));
    this.hp = this.maxHp;
    this.dmg = Math.round(T.dmg * (1 + 0.14 * (depth - 1)) * (elite ? 1.3 : 1));
    this.elite = elite;
    this.state = 'spawn'; this.t = 0.55; this.cd = rand(0.3, 1.2);
    this.flash = 0; this.onGround = false;
    this.status = { burn: 0, burnDps: 0, bleed: 0, bleedStacks: 0, slow: 0, freeze: 0, stun: 0, ice: 0 };
    this.dead = false; this.remove = false; this.deathT = 0;
    this.hitBy = new Set(); this.animT = Math.random() * 10;
    this.atkHit = false; this.patrolDir = Math.random() < 0.5 ? -1 : 1; this.patrolT = rand(1, 3);
    this.aimX = 0; this.aimY = 0;
    this.speedMul = elite === 'fury' ? 1.45 : 1;
    this.homeY = this.y;
    this.stagger = 0;
  }

  get cx() { return this.x + this.w / 2; }
  get cy() { return this.y + this.h / 2; }
  get alive() { return !this.dead; }

  update(dt, s) {
    this.animT += dt;
    this.flash = Math.max(0, this.flash - dt);
    const st = this.status;
    // Hiệu ứng trạng thái
    if (st.burn > 0) { st.burn -= dt; this._tick = (this._tick || 0) + dt; if (this._tick > 0.5) { this._tick = 0; s.damageEnemy(this, st.burnDps * 0.5, { kind: 'dot', color: '#ff8a3d' }); if (Math.random() < 0.8) s.fx.burst(this.cx, this.y + 4, 2, { colors: ['#ff8a3d', '#ffd23f'], speed: 30, life: 0.4, grav: -80 }); } }
    if (st.bleed > 0) { st.bleed -= dt; this._btick = (this._btick || 0) + dt; if (this._btick > 0.6) { this._btick = 0; s.damageEnemy(this, 2 * st.bleedStacks, { kind: 'dot' }); s.fx.burst(this.cx, this.cy, 2, { colors: ['#b3122e', '#7a0c1e'], speed: 30, life: 0.4 }); } } else st.bleedStacks = 0;
    st.slow = Math.max(0, st.slow - dt); st.freeze = Math.max(0, st.freeze - dt); st.stun = Math.max(0, st.stun - dt);
    if (this.dead) { this.deathT += dt; this.vy += 900 * dt; s.level.moveX(this, this.vx * dt); if (s.level.moveY(this, this.vy * dt)) this.vy = 0; this.vx *= 0.9; if (this.deathT > 0.6) this.remove = true; return; }

    const frozen = st.freeze > 0 || st.stun > 0;
    const spd = (st.slow > 0 ? 0.5 : 1) * this.speedMul;
    const p = s.player;
    const dx = p.cx - this.cx, dy = p.cy - this.cy;
    const adx = Math.abs(dx);
    const sees = !p.dead && adx < this.T.sight && Math.abs(dy) < 120 && s.level.lineOfSight(this.cx, this.cy - 4, p.cx, p.cy - 4);

    if (!frozen) {
      this.t -= dt * (st.slow > 0 ? 0.6 : 1);
      this.cd -= dt * this.speedMul;
      this.think(dt, s, { dx, dy, adx, sees, spd });
    } else { this.vx = approach(this.vx, 0, 600 * dt); }

    // Đẩy nhẹ để quái không chồng lên nhau
    if (!this.T.dummy) for (const o of s.enemies) {
      if (o === this || o.dead || o.isBoss || o.T.float) continue;
      const d = this.cx - o.cx;
      if (Math.abs(d) < (this.w + o.w) * 0.45 && Math.abs(this.cy - o.cy) < 12) this.vx += (Math.sign(d) || 1) * 160 * dt;
    }
    // Vật lý
    if (!this.T.float) this.vy = Math.min(this.vy + 1300 * dt, 420);
    s.level.moveX(this, this.vx * dt);
    if (!this.T.float) {
      const landed = s.level.moveY(this, this.vy * dt);
      if (landed) { if (this.vy > 0) this.onGround = true; this.vy = 0; } else this.onGround = false;
    } else {
      this.vy = approach(this.vy, 0, 200 * dt);
      s.level.moveY(this, this.vy * dt);
      this.y += Math.sin(this.animT * 2.5) * 0.15;
    }
    this.spikeT = Math.max(0, (this.spikeT || 0) - dt);
    if (s.level.touchesSpike(this) && this.type !== 'cultist' && this.spikeT <= 0) { this.spikeT = 0.5; this.vy = -220; s.damageEnemy(this, 10 + this.maxHp * 0.15, { kind: 'normal' }); }
    if (this.y > s.level.ph + 30) { this.hp = 0; s.killEnemy(this); }
  }

  // Có đất phía trước không (tránh tự lao xuống hố)
  safeAhead(s, dir) {
    const fx = dir > 0 ? this.x + this.w + 3 : this.x - 3;
    return s.level.groundAt(fx, this.y + this.h + 4) && !s.level.pointSolid(fx, this.y + this.h - 4);
  }

  setState(name, t) { this.state = name; this.t = t; this.atkHit = false; }

  think(dt, s, { dx, adx, sees, spd }) {
    const T = this.T, A = T.atk;
    if (this.state === 'spawn') { if (this.t <= 0) this.setState('idle', 0); if (T.dummy) return; }
    if (T.dummy) { this.vx = approach(this.vx, 0, 500 * dt); if (this.hp < this.maxHp && this.flash <= 0) this.hp = Math.min(this.maxHp, this.hp + 20 * dt); return; }
    switch (this.state) {
      case 'spawn': if (this.t <= 0) this.setState('idle', 0); break;
      case 'stagger': this.vx = approach(this.vx, 0, 700 * dt); if (this.t <= 0) this.setState('idle', 0); break;
      case 'idle':
      case 'patrol': {
        if (sees) { this.state = 'chase'; s.fx.text(this.cx, this.y - 6, '!', '#ffd23f', 0.6); break; }
        this.patrolT -= dt;
        if (this.patrolT <= 0) { this.patrolT = rand(1.5, 3.5); this.patrolDir *= -1; this.state = this.state === 'idle' ? 'patrol' : 'idle'; }
        if (this.state === 'patrol' && !T.float) {
          if (!this.safeAhead(s, this.patrolDir)) this.patrolDir *= -1;
          this.facing = this.patrolDir; this.vx = approach(this.vx, this.patrolDir * T.speed * 0.4 * spd, 400 * dt);
        } else this.vx = approach(this.vx, 0, 400 * dt);
        break;
      }
      case 'chase': {
        if (!sees && Math.random() < dt * 0.5) { this.state = 'patrol'; break; }
        this.facing = Math.sign(dx) || this.facing;
        if (this.type === 'archer') {
          // giữ khoảng cách
          let want = 0;
          if (adx < T.keep - 20) want = -this.facing; else if (adx > A.range * 0.8) want = this.facing;
          if (want && !this.safeAhead(s, want)) want = 0;
          this.vx = approach(this.vx, want * T.speed * spd, 500 * dt);
          if (this.cd <= 0 && adx < A.range && sees) this.beginAttack(s);
        } else if (this.type === 'cultist') {
          this.vx = approach(this.vx, 0, 300 * dt);
          if (this.cd <= 0 && sees) { if (adx < 50 || Math.random() < 0.35) this.teleport(s); else this.beginAttack(s); }
        } else {
          const close = adx < A.range;
          let dir = this.facing;
          if (!this.safeAhead(s, dir)) dir = 0;
          this.vx = approach(this.vx, close ? 0 : dir * T.speed * spd, 600 * dt);
          if (close && this.cd <= 0 && this.onGround) this.beginAttack(s);
        }
        break;
      }
      case 'windup': {
        this.vx = approach(this.vx, 0, 800 * dt);
        if (this.type === 'archer') { this.aimX = s.player.cx; this.aimY = s.player.cy - 2; }
        if (this.t <= 0) this.doAttack(s);
        break;
      }
      case 'attack': {
        if (this.type === 'scarecrow' || this.type === 'shield') {
          if (this.type === 'shield') this.vx = this.facing * A.dash * Math.min(1, this.t / A.active + 0.2) * spd;
          else this.vx = approach(this.vx, 0, 500 * dt);
          if (!this.safeAhead(s, this.facing)) this.vx = 0;
          const b = A.box;
          const box = { x: this.facing > 0 ? this.cx + b.x : this.cx - b.x - b.w, y: this.y + this.h - 2 + b.y, w: b.w, h: b.h };
          if (!this.atkHit && s.hitPlayerBox(box, this.dmg, this.cx)) this.atkHit = true;
        } else if (this.type === 'hound') {
          if (!this.atkHit && s.hitPlayerBox({ x: this.x, y: this.y, w: this.w, h: this.h }, this.dmg, this.cx)) this.atkHit = true;
          if (this.onGround && this.t < A.active - 0.1) this.vx = approach(this.vx, 0, 900 * dt);
        }
        if (this.t <= 0) { this.setState('recover', A.recover); }
        break;
      }
      case 'recover': this.vx = approach(this.vx, 0, 700 * dt); if (this.t <= 0) { this.state = 'chase'; this.cd = A.cd * rand(0.8, 1.3); } break;
    }
  }

  beginAttack(s) {
    const A = this.T.atk;
    this.setState('windup', A.windup / this.speedMul);
    s.audio.play('telegraph');
    if (this.type === 'archer') { this.aimX = s.player.cx; this.aimY = s.player.cy; }
  }

  doAttack(s) {
    const A = this.T.atk;
    this.setState('attack', A.active);
    if (this.type === 'scarecrow') { this.vx = this.facing * A.lunge; s.audio.play('swing', { pitch: 0.8 }); s.spawnEnemySlash(this); }
    if (this.type === 'hound') { this.vx = this.facing * A.leap.vx; this.vy = A.leap.vy; this.onGround = false; s.audio.play('swing', { pitch: 0.7 }); }
    if (this.type === 'shield') s.audio.play('heavySwing', { pitch: 0.8 });
    if (this.type === 'archer') {
      const ang = Math.atan2(this.aimY - (this.cy - 3), this.aimX - this.cx);
      s.spawnEnemyShot('arrow', this.cx, this.cy - 3, Math.cos(ang) * A.shot.speed, Math.sin(ang) * A.shot.speed, this.dmg);
      s.audio.play('shoot');
    }
    if (this.type === 'cultist') {
      for (let i = 0; i < A.orbs; i++) {
        const ang = Math.atan2(s.player.cy - this.cy, s.player.cx - this.cx) + (i - 1) * 0.45;
        s.spawnEnemyShot('orb', this.cx, this.cy - 4, Math.cos(ang) * 90, Math.sin(ang) * 90, this.dmg, { homing: 1.1, life: 3.0, delay: i * 0.12 });
      }
      s.audio.play('fire');
    }
  }

  teleport(s) {
    const p = s.player;
    for (let tries = 0; tries < 12; tries++) {
      const nx = p.cx + (Math.random() < 0.5 ? -1 : 1) * rand(110, 180);
      const ny = p.cy - rand(10, 60);
      if (nx < 24 || nx > s.level.pw - 24) continue;
      if (s.level.pointSolid(nx, ny) || s.level.pointSolid(nx, ny - 20) || s.level.pointSolid(nx, ny + 10)) continue;
      s.fx.burst(this.cx, this.cy, 14, { colors: ['#8a5cff', '#2b1a4a', '#d1b3ff'], speed: 90, life: 0.4, grav: -40 });
      this.x = nx - this.w / 2; this.y = ny - this.h / 2;
      s.fx.burst(this.cx, this.cy, 14, { colors: ['#8a5cff', '#2b1a4a', '#d1b3ff'], speed: 90, life: 0.4, grav: -40 });
      this.cd = 0.5; this.setState('chase', 0);
      return;
    }
    this.beginAttack(s);
  }

  // Trả về true nếu khiên chặn đòn
  blocks(fromX, info) {
    if (!this.T.shield || this.dead) return false;
    if (info.armorBreak || info.fateCrit) return false;
    if (this.state === 'stagger' || this.status.stun > 0 || this.status.freeze > 0) return false;
    const fromFront = Math.sign(fromX - this.cx) === this.facing;
    return fromFront && this.state !== 'attack';
  }

  takeHit(amount, info, s) {
    this.hp -= amount; this.flash = 0.1;
    const dir = info.dir || Math.sign(this.cx - (info.fromX ?? this.cx)) || 1;
    const kb = this.T.dummy ? 0 : (info.kb || 0) * (this.elite ? 0.5 : 1) * (this.T.poise > 1 ? 0.5 : 1);
    if (kb) { this.vx = dir * kb; if (this.onGround && kb > 120) this.vy = -Math.min(160, kb * 0.5); }
    const heavy = (info.kb || 0) >= 180 || info.fateCrit || info.armorBreak;
    const now = this.animT;
    if (now - (this.stgWin || 0) > 1.6) { this.stgWin = now; this.stgCount = 0; }
    const armored = (this.armorT || 0) > now;
    if (!this.T.dummy && !armored && (this.T.poise <= 1 || heavy) && !(this.elite && !heavy) && this.state !== 'spawn') {
      // Đòn trúng ngắt đòn của quái thường; bị ngắt 3 lần liên tiếp thì quái gồng giáp 1.2 giây
      if (this.state !== 'attack' || heavy) {
        this.setState('stagger', heavy ? 0.42 : 0.24);
        this.stgCount = (this.stgCount || 0) + 1;
        if (this.stgCount >= 3) { this.armorT = now + 1.4; this.stgCount = 0; this.stgWin = now; s.fx.text(this.cx, this.y - 8, 'GỒNG!', '#ffb340', 0.6); }
      }
    }
    if (info.stun) this.status.stun = Math.max(this.status.stun, info.stun);
  }
}
