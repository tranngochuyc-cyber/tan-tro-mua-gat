// ============================================================
// Particles — lightweight visual effects
// ============================================================

export class Particle {
  constructor(x, y, vx, vy, life, color, size = 2, gravity = 0) {
    this.x = x; this.y = y;
    this.vx = vx; this.vy = vy;
    this.life = life; this.maxLife = life;
    this.color = color;
    this.size = size;
    this.gravity = gravity;
    this.dead = false;
  }
  update(dt) {
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    this.vy += this.gravity * dt;
    this.life -= dt;
    if (this.life <= 0) this.dead = true;
  }
  draw(ctx) {
    const alpha = Math.max(0, this.life / this.maxLife);
    ctx.globalAlpha = alpha;
    ctx.fillStyle = this.color;
    const px = Math.floor(this.x - this.size / 2);
    const py = Math.floor(this.y - this.size / 2);
    ctx.fillRect(px, py, this.size, this.size);
    ctx.globalAlpha = 1;
  }
}

export class DamageNumber {
  constructor(x, y, text, color = '#fff', big = false) {
    this.x = x; this.y = y;
    this.text = text; this.color = color;
    this.life = 0.8; this.maxLife = 0.8;
    this.vy = -40;
    this.big = big;
    this.dead = false;
  }
  update(dt) {
    this.y += this.vy * dt;
    this.vy += 20 * dt;
    this.life -= dt;
    if (this.life <= 0) this.dead = true;
  }
  draw(ctx) {
    const alpha = Math.max(0, this.life / this.maxLife);
    const scale = this.big ? Math.min(1.3, 0.8 + (1 - this.life / this.maxLife) * 0.5) : 1;
    ctx.globalAlpha = alpha;
    ctx.font = this.big ? `bold ${Math.floor(11 * scale)}px monospace` : '9px monospace';
    ctx.textAlign = 'center';
    // Dark outline for readability against any bg
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.lineWidth = 2.5;
    ctx.lineJoin = 'round';
    ctx.strokeText(this.text, Math.floor(this.x), Math.floor(this.y));
    // Fill
    ctx.fillStyle = this.color;
    ctx.fillText(this.text, Math.floor(this.x), Math.floor(this.y));
    ctx.globalAlpha = 1;
  }
}

export class ParticleSystem {
  constructor() {
    /** @type {Particle[]} */
    this.particles = [];
    /** @type {DamageNumber[]} */
    this.numbers = [];
  }

  emit(x, y, count, color, speed = 50, life = 0.5, size = 2, gravity = 0) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const spd = speed * (0.3 + Math.random() * 0.7);
      this.particles.push(new Particle(
        x, y,
        Math.cos(angle) * spd,
        Math.sin(angle) * spd,
        life * (0.5 + Math.random() * 0.5),
        color, size, gravity
      ));
    }
  }

  emitDirectional(x, y, count, color, angle, spread, speed, life, size = 2) {
    for (let i = 0; i < count; i++) {
      const a = angle + (Math.random() - 0.5) * spread;
      const spd = speed * (0.5 + Math.random() * 0.5);
      this.particles.push(new Particle(
        x, y,
        Math.cos(a) * spd,
        Math.sin(a) * spd,
        life * (0.5 + Math.random() * 0.5),
        color, size
      ));
    }
  }

  addNumber(x, y, text, color = '#fff', big = false) {
    this.numbers.push(new DamageNumber(x, y, text, color, big));
  }

  emitText(x, y, text, color = '#fff', big = false) {
    this.addNumber(x, y, text, color, big);
  }

  update(dt) {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      this.particles[i].update(dt);
      if (this.particles[i].dead) this.particles.splice(i, 1);
    }
    for (let i = this.numbers.length - 1; i >= 0; i--) {
      this.numbers[i].update(dt);
      if (this.numbers[i].dead) this.numbers.splice(i, 1);
    }
  }

  draw(ctx) {
    for (const p of this.particles) p.draw(ctx);
    for (const n of this.numbers) n.draw(ctx);
  }

  clear() {
    this.particles.length = 0;
    this.numbers.length = 0;
  }
}
