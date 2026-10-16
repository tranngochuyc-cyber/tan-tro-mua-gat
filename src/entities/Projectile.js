// ============================================================
// Projectile — player and enemy projectiles, artifact effects
// ============================================================
import { segmentHitsEntity } from '../engine/Hitboxes.js';

export class Projectile {
  constructor(x, y, vx, vy, dmg, owner, opts = {}) {
    this.x = x;
    this.y = y;
    this.previousX = x;
    this.previousY = y;
    this.vx = vx;
    this.vy = vy;
    this.dmg = dmg;
    this.owner = owner; // 'player' or 'enemy' or 'boss'
    this.speed = opts.speed || Math.sqrt(vx * vx + vy * vy);
    this.life = opts.life || 3.0;
    this.maxLife = this.life;
    this.radius = opts.radius || 4;
    this.pierce = opts.pierce || false;
    this.homing = opts.homing || 0;
    this.color = opts.color || '#ffcc44';
    this.type = opts.type || 'normal'; // normal, fire, ice, lightning, blood, arrow, void, boss_bullet
    this.hitEnemies = new Set(); // track already-hit enemies to prevent double-hit
    this.dead = false;

    // Burn/slow on hit
    this.burnDmg = opts.burnDmg || 0;
    this.burnDur = opts.burnDur || 0;
    this.slow = opts.slow || 0;
    this.slowDur = opts.slowDur || 0;

    // Lifesteal
    this.lifesteal = opts.lifesteal || 0;

    // Chain lightning
    this.chains = opts.chains || 0;
    this.chainRange = opts.chainRange || 70;
    this.chainCount = 0;

    // Blood trail
    this.bloodTrail = opts.bloodTrail || false;
    this.trailTimer = 0;

    // Explode on burn kill
    this.explodeOnBurnKill = opts.explodeOnBurnKill || false;
  }

  update(dt, enemies = [], player = null, arena = null) {
    // Homing
    if (this.homing > 0 && this.owner === 'player' && enemies.length > 0) {
      let closest = null;
      let closestDist = Infinity;
      for (const e of enemies) {
        if (e.isDead) continue;
        const d = Math.sqrt((e.x - this.x) ** 2 + (e.y - this.y) ** 2);
        if (d < closestDist && d < 150) {
          closestDist = d;
          closest = e;
        }
      }
      if (closest) {
        const targetAngle = Math.atan2(closest.y - this.y, closest.x - this.x);
        const currentAngle = Math.atan2(this.vy, this.vx);
        let diff = targetAngle - currentAngle;
        while (diff > Math.PI) diff -= Math.PI * 2;
        while (diff < -Math.PI) diff += Math.PI * 2;
        const turn = Math.sign(diff) * Math.min(Math.abs(diff), this.homing * dt * 10);
        const newAngle = currentAngle + turn;
        this.vx = Math.cos(newAngle) * this.speed;
        this.vy = Math.sin(newAngle) * this.speed;
      }
    }

    this.previousX = this.x;
    this.previousY = this.y;
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    this.life -= dt;

    if (this.bloodTrail) {
      this.trailTimer += dt;
    }

    if (this.life <= 0) this.dead = true;
    // Out of bounds
    if (arena && (this.x < -20 || this.x > arena.w + 20 || this.y < -20 || this.y > arena.h + 20)) this.dead = true;
  }

  /** Check if this projectile hits an entity */
  hits(entity) {
    if (this.dead) return false;
    if (this.hitEnemies.has(entity)) return false;
    return segmentHitsEntity(this.previousX, this.previousY, this.x, this.y, this.radius, entity);
  }

  /** Register a hit to prevent double-hit */
  registerHit(entity) {
    this.hitEnemies.add(entity);
    if (!this.pierce) this.dead = true;
  }

  draw(ctx) {
    if (this.dead) return;
    const alpha = Math.min(1, this.life / (this.maxLife * 0.2));
    ctx.globalAlpha = Math.max(0.3, alpha);

    switch (this.type) {
      case 'fire':
        ctx.fillStyle = '#ff6622';
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();
        // Glow
        ctx.fillStyle = 'rgba(255,100,0,0.3)';
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius * 2, 0, Math.PI * 2);
        ctx.fill();
        break;

      case 'ice':
        ctx.fillStyle = '#88ccff';
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = 'rgba(100,180,255,0.3)';
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius * 1.8, 0, Math.PI * 2);
        ctx.fill();
        break;

      case 'lightning':
        ctx.strokeStyle = '#ffff44';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(this.x - 4, this.y - 4);
        ctx.lineTo(this.x + 2, this.y);
        ctx.lineTo(this.x - 2, this.y + 2);
        ctx.lineTo(this.x + 4, this.y + 4);
        ctx.stroke();
        break;

      case 'blood':
        ctx.fillStyle = '#cc2222';
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();
        break;

      case 'arrow':
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(Math.atan2(this.vy, this.vx));
        ctx.fillStyle = '#ddbb77';
        ctx.fillRect(-6, -1, 12, 2);
        ctx.fillStyle = '#887755';
        ctx.fillRect(4, -2, 3, 4);
        ctx.restore();
        break;

      case 'void':
        ctx.fillStyle = 'rgba(160,40,200,0.6)';
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius * 1.5, 0, Math.PI * 2);
        ctx.fill();
        break;

      case 'boss_bullet':
        ctx.fillStyle = '#cc44ff';
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = 'rgba(200,60,255,0.4)';
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius * 2, 0, Math.PI * 2);
        ctx.fill();
        break;

      default:
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();
    }

    ctx.globalAlpha = 1;
  }
}

// ============================================================
// VoidZone — pull effect from void wand
// ============================================================
export class VoidZone {
  constructor(x, y, radius, force, duration, dmg, explodeOnEnd = false) {
    this.x = x; this.y = y;
    this.radius = radius;
    this.force = force;
    this.duration = duration;
    this.maxDuration = duration;
    this.dmg = dmg;
    this.explodeOnEnd = explodeOnEnd;
    this.dead = false;
    this.dmgTimer = 0;
  }

  update(dt) {
    this.duration -= dt;
    this.dmgTimer += dt;
    if (this.duration <= 0) {
      this.dead = true;
    }
  }

  draw(ctx) {
    const alpha = Math.min(1, this.duration / (this.maxDuration * 0.3));
    ctx.globalAlpha = 0.2 * alpha;
    ctx.fillStyle = '#8040c0';
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#a060e0';
    ctx.lineWidth = 1;
    ctx.globalAlpha = 0.4 * alpha;
    ctx.stroke();
    ctx.globalAlpha = 1;
  }
}
