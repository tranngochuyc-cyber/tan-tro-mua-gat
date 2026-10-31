// Kael — nhân vật chính. Vật lý đi cảnh có coyote time, đệm nhảy, nhảy kép, lướt bất tử, combo vũ khí.
import { approach, clamp } from '../core/util.js';
import { WEAPONS } from '../data/weapons.js';

const P = {
  runSpeed: 138, accelGround: 1900, accelAir: 1250, decelGround: 2300,
  gravity: 1500, fallMul: 1.45, maxFall: 430, jumpVel: 368, djumpVel: 325, jumpCut: 0.42,
  coyote: 0.1, buffer: 0.13, rollTime: 0.3, rollSpeed: 255, rollIframes: 0.27,
  comboWindow: 0.38,
};

export class Player {
  constructor(x, y) {
    this.w = 10; this.h = 20;
    this.x = x; this.y = y;
    this.vx = 0; this.vy = 0;
    this.facing = 1;
    this.onGround = false; this.wasGround = false;
    this.coyote = 0; this.jumpBuf = 0; this.airJumps = 1;
    this.rollT = 0; this.rollCd = 0; this.rollDir = 1; this.rollHit = new Set();
    this.iframes = 0; this.hurtT = 0;
    this.atk = null; // đòn đang ra
    this.comboT = 0; this.lastSlot = -1; this.lastStep = -1;
    this.dropT = 0;
    this.animT = 0; this.landT = 0; this.squash = 0;
    this.fate = null; // { face, hits }
    this.diceAnim = null; // xúc xắc đang lăn trên đầu
    this.flaskCd = 0;
    this.dead = false;
    this.attackSeq = 0;
    this.stepDust = 0;
    this.afterimages = [];
  }

  get cx() { return this.x + this.w / 2; }
  get cy() { return this.y + this.h / 2; }
  get rolling() { return this.rollT > 0; }
  get invulnerable() { return this.iframes > 0 || (this.rollT > 0 && P.rollTime - this.rollT < P.rollIframes); }

  update(dt, s) {
    const { input, level, run } = s;
    const st = run.stats;
    const spdMul = st.berserk && run.hp < st.maxHp * 0.5 ? 0.75 : 1; // thời gian đòn nhân hệ số
    this.animT += dt;
    this.iframes = Math.max(0, this.iframes - dt);
    this.hurtT = Math.max(0, this.hurtT - dt);
    this.rollCd = Math.max(0, this.rollCd - dt);
    this.comboT = Math.max(0, this.comboT - dt);
    this.flaskCd = Math.max(0, this.flaskCd - dt);
    this.dropT = Math.max(0, this.dropT - dt);
    this.landT = Math.max(0, this.landT - dt);
    this.squash *= Math.pow(0.0001, dt);
    this.afterimages = this.afterimages.filter((a) => (a.life -= dt) > 0);

    // ---- Nhập hướng ----
    let mx = 0;
    if (!this.dead) {
      if (input.down('left')) mx -= 1;
      if (input.down('right')) mx += 1;
      if (input.axisX) mx = Math.sign(input.axisX);
    }

    // ---- Nhảy (đệm) ----
    if (!this.dead && input.pressed('jump')) this.jumpBuf = P.buffer;
    else this.jumpBuf = Math.max(0, this.jumpBuf - dt);
    this.coyote = this.onGround ? P.coyote : Math.max(0, this.coyote - dt);

    // ---- Lướt ----
    if (!this.dead && input.pressed('roll') && this.rollCd <= 0 && this.rollT <= 0 && (!this.atk || this.atk.phase !== 'active')) {
      this.rollT = P.rollTime;
      this.rollCd = st.rollCd + P.rollTime;
      this.rollDir = mx !== 0 ? mx : this.facing;
      this.facing = this.rollDir;
      this.atk = null;
      this.rollHit.clear();
      s.audio.play('roll');
      s.fx.dust(this.cx, this.y + this.h, 8, -this.rollDir);
      if (this.vy > 0 && !this.onGround) this.vy *= 0.3;
    }

    // ---- Tấn công ----
    if (!this.dead && this.rollT <= 0) {
      for (const slot of [0, 1]) {
        if (input.pressed(slot === 0 ? 'attack1' : 'attack2')) this.requestAttack(slot, mx, s);
      }
    }
    this.updateAttack(dt / spdMul, s);

    // ---- Bình máu ----
    if (!this.dead && input.pressed('flask')) s.useFlask();

    // ---- Xúc xắc vận mệnh ----
    if (!this.dead && input.pressed('dice')) s.rollFateDice();

    // ---- Vận tốc ngang ----
    if (this.rollT > 0) {
      const k = this.rollT / P.rollTime;
      this.vx = this.rollDir * P.rollSpeed * (0.45 + 0.55 * k);
      this.rollT -= dt;
      if (Math.random() < 0.5) this.afterimages.push({ x: this.x, y: this.y, f: this.facing, life: 0.16, roll: true, t: this.animT });
      if (st.rollDamage > 0) s.rollStrike(this);
    } else if (this.atk && this.atk.def.type === 'melee' && this.onGround) {
      // Đang chém trên đất: giảm trượt, cho phép lao tới
      this.vx = approach(this.vx, 0, P.decelGround * 0.9 * dt);
    } else {
      const target = mx * P.runSpeed * (this.atk ? 0.35 : 1);
      const accel = this.onGround ? (mx !== 0 ? P.accelGround : P.decelGround) : P.accelAir;
      this.vx = approach(this.vx, target, accel * dt);
      if (mx !== 0 && !this.atk) this.facing = mx;
    }

    // ---- Nhảy ----
    if (this.jumpBuf > 0 && this.rollT <= 0) {
      if (input.down('down') && this.onGround && this.standingOnOneway(level)) {
        this.dropT = 0.22; this.jumpBuf = 0; this.onGround = false; this.y += 2;
      } else if (this.coyote > 0) {
        this.vy = -P.jumpVel; this.coyote = 0; this.jumpBuf = 0; this.onGround = false;
        this.squash = -0.35; s.audio.play('jump'); s.fx.dust(this.cx, this.y + this.h, 5);
        if (this.atk && this.atk.phase === 'recovery') this.atk = null; // nhảy huỷ hồi chiêu
      } else if (this.airJumps > 0) {
        this.airJumps--; this.vy = -P.djumpVel; this.jumpBuf = 0;
        this.squash = -0.3; s.audio.play('djump');
        s.fx.burst(this.cx, this.y + this.h, 10, { colors: ['#ffd9a0', '#ff9a4a', '#fff'], speed: 70, life: 0.3, grav: 60, spread: Math.PI, dir: Math.PI / 2 });
        s.fx.ring(this.cx, this.y + this.h, 2, 14, '#ffcf8a', 0.25);
        if (this.atk && this.atk.phase === 'recovery') this.atk = null;
      }
    }
    if (!input.down('jump') && this.vy < 0 && !this.dead) this.vy *= Math.pow(P.jumpCut, dt * 60 / 4);

    // ---- Trọng lực ----
    const airAtk = this.atk && this.atk.def.type === 'melee' && this.atk.phase !== 'recovery' && !this.onGround;
    let g = P.gravity * (this.vy > 0 ? P.fallMul : 1);
    if (airAtk && this.vy > -40) g *= 0.35; // lơ lửng nhẹ khi chém trên không
    if (this.rollT > 0 && !this.onGround) g *= 0.4;
    this.vy = Math.min(this.vy + g * dt, P.maxFall);

    // ---- Va chạm ----
    this.wasGround = this.onGround;
    level.moveX(this, this.vx * dt);
    const landed = level.moveY(this, this.vy * dt, this.dropT > 0);
    if (landed && this.vy > 0) {
      if (!this.wasGround && this.vy > 160) {
        this.squash = Math.min(0.4, this.vy / 900); this.landT = 0.12;
        s.audio.play('land'); s.fx.dust(this.cx, this.y + this.h, 6);
      }
      this.vy = 0; this.onGround = true; this.airJumps = st.jumps - 1;
    } else if (landed && this.vy < 0) { this.vy = 0; this.onGround = false; }
    else this.onGround = false;

    // Bụi chân khi chạy
    if (this.onGround && Math.abs(this.vx) > 100 && !this.atk) {
      this.stepDust -= dt;
      if (this.stepDust <= 0) { this.stepDust = 0.18; s.fx.dust(this.cx - this.facing * 3, this.y + this.h, 1); }
    }

    // Gai
    if (level.touchesSpike(this) && !this.dead) s.hurtPlayer(14, this.cx - this.facing * 10, true);
    // Rơi khỏi bản đồ
    if (this.y > level.ph + 40 && !this.dead) { s.hurtPlayer(20, this.cx, true); s.respawnPlayerSafe(); }
  }

  standingOnOneway(level) {
    const ty = Math.floor((this.y + this.h + 1) / 16);
    const l = level.get(Math.floor(this.x / 16), ty), r = level.get(Math.floor((this.x + this.w - 1) / 16), ty);
    return (l === 2 || l === 0) && (r === 2 || r === 0) && (l === 2 || r === 2);
  }

  requestAttack(slot, mx, s) {
    const w = s.run.weapons[slot];
    if (!w) { s.toast('Ô ' + (slot + 1) + ' chưa có vũ khí'); return; }
    const def = WEAPONS[w.id];
    const a = this.atk;
    if (a) {
      // Đệm lệnh combo nếu đang ra đòn
      if (a.phase === 'startup' || a.phase === 'active') { a.queued = slot; return; }
      if (a.phase === 'recovery' && a.t < a.step.recovery * 0.25) { a.queued = slot; return; }
    }
    let step = 0;
    if (this.lastSlot === slot && this.comboT > 0) step = (this.lastStep + 1) % def.combo.length;
    this.startAttack(slot, step, mx, s);
  }

  startAttack(slot, stepIdx, mx, s) {
    const w = s.run.weapons[slot];
    const def = WEAPONS[w.id];
    const step = def.combo[stepIdx];
    if (mx) this.facing = mx;
    this.atk = { slot, w, def, stepIdx, step, phase: 'startup', t: 0, hit: new Set(), queued: null, id: ++this.attackSeq, shotsFired: 0, lungeDone: false, consumedFate: false };
    this.lastSlot = slot; this.lastStep = stepIdx; this.comboT = 0;
  }

  updateAttack(dt, s) {
    const a = this.atk;
    if (!a) return;
    a.t += dt;
    const st = a.step;
    if (a.phase === 'startup' && a.t >= st.startup) {
      a.phase = 'active'; a.t = 0;
      s.audio.play(st.sfx || 'swing', { pitch: st.pitch || 1 });
      if (a.def.type === 'melee') {
        if (st.lunge && this.rollT <= 0) this.vx = this.facing * st.lunge * (this.onGround ? 1 : 0.6);
        if (st.arc) s.spawnSlash(this, a);
        if (st.shockwave && this.onGround) s.spawnShockwave(this, a);
      }
    }
    if (a.phase === 'active') {
      if (a.def.type === 'melee') {
        s.meleeCheck(this, a);
        if (a.t >= st.active) { a.phase = 'recovery'; a.t = 0; }
      } else {
        // Bắn theo độ trễ từng viên
        const shots = st.shots || [];
        while (a.shotsFired < shots.length && a.t >= shots[a.shotsFired].delay) { s.firePlayerShot(this, a, shots[a.shotsFired]); a.shotsFired++; }
        if (st.chain && a.shotsFired === 0) { s.fireChain(this, a, st.chain); a.shotsFired = 1; }
        const lastDelay = shots.length ? shots[shots.length - 1].delay : 0;
        if (a.t >= lastDelay + 0.02) { a.phase = 'recovery'; a.t = 0; }
      }
    }
    if (a.phase === 'recovery') {
      if (a.queued !== null && a.t >= Math.min(0.06, st.recovery * 0.4)) {
        const slot = a.queued;
        const def = s.run.weapons[slot] ? WEAPONS[s.run.weapons[slot].id] : null;
        if (def) {
          const next = slot === a.slot ? (a.stepIdx + 1) % a.def.combo.length : 0;
          let mx = 0; if (s.input.down('left')) mx -= 1; if (s.input.down('right')) mx += 1;
          this.startAttack(slot, next, mx, s);
          return;
        }
      }
      if (a.t >= st.recovery) { this.atk = null; this.comboT = P.comboWindow; }
    }
  }

  // Hộp sát thương của đòn cận chiến (toạ độ thế giới)
  hitbox(a) {
    const b = a.step.box;
    const ox = this.cx, oy = this.y + this.h - 4;
    const x = this.facing > 0 ? ox + b.x : ox - b.x - b.w;
    return { x, y: oy + b.y, w: b.w, h: b.h };
  }

  onHurt(dmg, fromX, s) {
    this.iframes = 0.9; this.hurtT = 0.25;
    const dir = Math.sign(this.cx - fromX) || -this.facing;
    this.vx = dir * 170; this.vy = -170; this.onGround = false;
    this.atk = null;
  }
}

export const PLAYER_PHYS = P;
export { clamp };
