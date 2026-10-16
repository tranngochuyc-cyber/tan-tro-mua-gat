// ============================================================
// Boss — specialized enemy with phase-based attacks
// Unified kill flow: only CombatScene calls _onBossKilled.
// Sweep telegraph and hitbox use identical geometry.
// ============================================================
import { SpriteSheet, Animator } from '../engine/SpriteSheet.js';
import { BOSSES } from '../data/GameData.js';

const BOSS_STATES = {
  INTRO: 'intro',
  IDLE: 'idle',
  CHOOSING: 'choosing',
  WIND_UP: 'wind_up',
  ATTACK: 'attack',
  REST: 'rest',
  CHARGING: 'charging',
  STUNNED: 'stunned',
  SUMMONING: 'summoning',
  DYING: 'dying',
  DEAD: 'dead',
};

export class Boss {
  constructor(assets, bossId, x, y, scaleMult = 1) {
    const def = BOSSES[bossId];
    if (!def) throw new Error(`Unknown boss: ${bossId}`);
    this.def = def;
    this.id = bossId;
    this.x = x;
    this.y = y;
    this.vx = 0;
    this.vy = 0;

    this.maxHp = Math.floor(def.hp * scaleMult);
    this.hp = this.maxHp;
    this.speed = def.speed;
    this.xp = def.xp;
    this.gold = def.gold;
    this.scale = def.scale || 1.5;

    this.hitboxW = def.hitboxW || 22;
    this.hitboxH = def.hitboxH || 22;
    this.drawW = Math.floor(48 * this.scale);
    this.drawH = Math.floor(48 * this.scale);

    // State
    this.state = BOSS_STATES.INTRO;
    this.stateTimer = 2.0;
    this.isDead = false;
    this._deathProcessed = false;
    this.facingRight = false;
    this.flashTimer = 0;
    this.hitThisSwing = false;

    // Phase tracking
    this.currentPhase = 0;
    this.attackIndex = 0;
    this.currentAttack = null;

    // Sweep direction — stored when wind-up starts, aimed at player
    this.sweepAngle = 0;

    // Summon tracking
    this.summonCdTimers = {};
    this.minionCount = 0;

    // Charge
    this.chargeDirX = 0;
    this.chargeDirY = 0;

    // Bullet ring
    this.pendingBullets = null;

    // Slow/burn
    this.slowAmount = 0;
    this.slowTimer = 0;
    this.burnDmg = 0;
    this.burnTimer = 0;
    this.burnTickTimer = 0;
    this.killedByBurn = false;

    // Animation
    this.animator = new Animator();
    this._setupAnimations(assets, def.sprite);
  }

  _setupAnimations(assets, spriteType) {
    if (spriteType === 'void_beast') {
      const img = assets.getImage('void_beast');
      if (img) {
        const fw = 32, fh = 32;
        const fc = Math.max(1, Math.floor(img.width / fw));
        this.animator.addAnimation('idle', new SpriteSheet(img, fw, fh, Math.min(fc, 4), 4));
        this.animator.addAnimation('walk', new SpriteSheet(img, fw, fh, Math.min(fc, 4), 5));
        this.animator.addAnimation('attack', new SpriteSheet(img, fw, fh, Math.min(fc, 4), 7));
        this.animator.addAnimation('hurt', new SpriteSheet(img, fw, fh, Math.min(fc, 4), 6));
        this.animator.addAnimation('death', new SpriteSheet(img, fw, fh, Math.min(fc, 4), 4));
      }
    } else {
      const crop = { x: 34, y: 31, w: 40, h: 34 };
      const idle = assets.getImage('orc_idle');
      const walk = assets.getImage('orc_walk');
      const atk1 = assets.getImage('orc_attack01');
      const hurt = assets.getImage('orc_hurt');
      const death = assets.getImage('orc_death');
      if (idle) this.animator.addAnimation('idle', new SpriteSheet(idle, 100, 100, Math.floor(idle.width / 100), 6, crop));
      if (walk) this.animator.addAnimation('walk', new SpriteSheet(walk, 100, 100, Math.floor(walk.width / 100), 7, crop));
      if (atk1) this.animator.addAnimation('attack', new SpriteSheet(atk1, 100, 100, Math.floor(atk1.width / 100), 10, crop));
      if (hurt) this.animator.addAnimation('hurt', new SpriteSheet(hurt, 100, 100, Math.floor(hurt.width / 100), 7, crop));
      if (death) this.animator.addAnimation('death', new SpriteSheet(death, 100, 100, Math.floor(death.width / 100), 5, crop));
    }
    this.animator.play('idle');
  }

  getPhase() {
    const hpRatio = this.hp / this.maxHp;
    for (let i = this.def.phases.length - 1; i >= 0; i--) {
      if (hpRatio <= this.def.phases[i].hpThreshold) {
        return i;
      }
    }
    return 0;
  }

  update(dt, playerX, playerY, mapRenderer, onSummon, onBulletRing) {
    if (this.isDead) return;

    // Status effects
    if (this.slowTimer > 0) {
      this.slowTimer -= dt;
      if (this.slowTimer <= 0) this.slowAmount = 0;
    }
    if (this.burnTimer > 0) {
      this.burnTimer -= dt;
      this.burnTickTimer += dt;
      if (this.burnTickTimer >= 0.5) {
        this.burnTickTimer -= 0.5;
        this.hp -= this.burnDmg;
        if (this.hp <= 0) {
          this.hp = 0;
          this.killedByBurn = true;
          this.die();
          return;
        }
      }
    }
    if (this.flashTimer > 0) this.flashTimer -= dt;

    const effectiveSpeed = this.speed * (1 - this.slowAmount * 0.5);
    const dx = playerX - this.x;
    const dy = playerY - this.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const dirX = dist > 0 ? dx / dist : 0;
    const dirY = dist > 0 ? dy / dist : 0;

    if (dx > 0) this.facingRight = true;
    else if (dx < 0) this.facingRight = false;

    this.stateTimer -= dt;

    // Update summon cooldowns
    for (const k of Object.keys(this.summonCdTimers)) {
      if (this.summonCdTimers[k] > 0) this.summonCdTimers[k] -= dt;
    }

    // Check phase transition
    const newPhase = this.getPhase();
    if (newPhase !== this.currentPhase) {
      this.currentPhase = newPhase;
      this.attackIndex = 0;
      this.flashTimer = 0.3;
    }

    switch (this.state) {
      case BOSS_STATES.INTRO:
        if (this.stateTimer <= 0) {
          this.state = BOSS_STATES.IDLE;
          this.stateTimer = 0.5;
        }
        break;

      case BOSS_STATES.IDLE:
        this.animator.play('walk');
        this._moveToward(playerX, playerY, effectiveSpeed, dt, mapRenderer);
        if (this.stateTimer <= 0 && dist < 150) {
          this.state = BOSS_STATES.CHOOSING;
          this.stateTimer = 0.2;
        }
        break;

      case BOSS_STATES.CHOOSING: {
        const phase = this.def.phases[this.currentPhase];
        const attacks = phase.attacks;
        this.currentAttack = attacks[this.attackIndex % attacks.length];
        this.attackIndex++;
        this._startAttack(dirX, dirY, playerX, playerY);
        break;
      }

      case BOSS_STATES.WIND_UP:
        this.animator.play('attack', false);
        if (this.stateTimer <= 0) {
          this._executeAttack(playerX, playerY, onSummon, onBulletRing);
        }
        break;

      case BOSS_STATES.ATTACK:
        if (this.stateTimer <= 0) {
          this.state = BOSS_STATES.REST;
          const phase = this.def.phases[this.currentPhase];
          this.stateTimer = phase.restAfterCombo || 1.2;
        }
        break;

      case BOSS_STATES.CHARGING: {
        const chargeSpd = this.currentAttack?.speed || 180;
        this.x += this.chargeDirX * chargeSpd * dt;
        this.y += this.chargeDirY * chargeSpd * dt;
        if (this._hitWall(mapRenderer)) {
          this.state = BOSS_STATES.STUNNED;
          this.stateTimer = this.currentAttack?.stunOnWall || 1.5;
        } else if (this.stateTimer <= 0) {
          this.state = BOSS_STATES.REST;
          this.stateTimer = 1.0;
        }
        this._clampToArena(mapRenderer);
        break;
      }

      case BOSS_STATES.STUNNED:
        this.animator.play('hurt');
        if (this.stateTimer <= 0) {
          this.state = BOSS_STATES.IDLE;
          this.stateTimer = 0.5;
        }
        break;

      case BOSS_STATES.SUMMONING:
        if (this.stateTimer <= 0) {
          this.state = BOSS_STATES.IDLE;
          this.stateTimer = 0.5;
        }
        break;

      case BOSS_STATES.REST:
        this.animator.play('idle');
        if (this.stateTimer <= 0) {
          this.state = BOSS_STATES.IDLE;
          this.stateTimer = 0.3;
        }
        break;

      case BOSS_STATES.DYING:
        this.animator.play('death', false);
        if (this.stateTimer <= 0 || this.animator.isFinished()) {
          this.state = BOSS_STATES.DEAD;
        }
        break;

      case BOSS_STATES.DEAD:
        break;
    }

    this.animator.flip = !this.facingRight;
    this.animator.update(dt);
  }

  _startAttack(dirX, dirY, playerX, playerY) {
    const atk = this.currentAttack;
    if (!atk) { this.state = BOSS_STATES.IDLE; this.stateTimer = 1; return; }

    // Store sweep angle aimed at player position when wind-up starts
    this.sweepAngle = Math.atan2(playerY - this.y, playerX - this.x);

    switch (atk.type) {
      case 'sweep':
      case 'double_sweep':
        this.state = BOSS_STATES.WIND_UP;
        this.stateTimer = atk.wind || 0.8;
        break;
      case 'charge':
      case 'double_charge':
        this.state = BOSS_STATES.WIND_UP;
        this.stateTimer = atk.wind || 0.6;
        this.chargeDirX = dirX;
        this.chargeDirY = dirY;
        break;
      case 'summon':
        if (this.minionCount < (atk.maxMinions || 4)) {
          const cdKey = atk.type + atk.summonType;
          if (!this.summonCdTimers[cdKey] || this.summonCdTimers[cdKey] <= 0) {
            this.state = BOSS_STATES.WIND_UP;
            this.stateTimer = 0.8;
            this.summonCdTimers[cdKey] = atk.cd || 12;
          } else {
            this.state = BOSS_STATES.IDLE;
            this.stateTimer = 0.5;
          }
        } else {
          this.state = BOSS_STATES.IDLE;
          this.stateTimer = 0.5;
        }
        break;
      case 'stomp':
        this.state = BOSS_STATES.WIND_UP;
        this.stateTimer = atk.wind || 0.6;
        break;
      case 'bullet_ring':
        this.state = BOSS_STATES.WIND_UP;
        this.stateTimer = atk.wind || 1.0;
        break;
      case 'teleport':
        this.state = BOSS_STATES.WIND_UP;
        this.stateTimer = atk.wind || 0.3;
        break;
      default:
        this.state = BOSS_STATES.IDLE;
        this.stateTimer = 1;
    }
  }

  _executeAttack(playerX, playerY, onSummon, onBulletRing) {
    const atk = this.currentAttack;
    if (!atk) { this.state = BOSS_STATES.IDLE; return; }

    switch (atk.type) {
      case 'sweep':
        this.state = BOSS_STATES.ATTACK;
        this.stateTimer = 0.4;
        break;
      case 'double_sweep':
        this.state = BOSS_STATES.ATTACK;
        this.stateTimer = 0.6;
        break;
      case 'charge':
      case 'double_charge':
        this.state = BOSS_STATES.CHARGING;
        this.stateTimer = atk.duration || 0.5;
        break;
      case 'summon':
        if (onSummon) {
          onSummon(atk.summonType, atk.count || 2);
        }
        this.state = BOSS_STATES.SUMMONING;
        this.stateTimer = 1.0;
        break;
      case 'stomp':
        this.state = BOSS_STATES.ATTACK;
        this.stateTimer = 0.3;
        break;
      case 'bullet_ring':
        if (onBulletRing) {
          onBulletRing(this.x, this.y, atk.count || 8, atk.dmg || 12, atk.speed || 80, atk.gap || 1);
        }
        this.state = BOSS_STATES.REST;
        this.stateTimer = 1.0;
        break;
      case 'teleport':
        this.x = 100 + Math.random() * 400;
        this.y = 60 + Math.random() * 200;
        this.state = BOSS_STATES.IDLE;
        this.stateTimer = 0.5;
        break;
      default:
        this.state = BOSS_STATES.IDLE;
        this.stateTimer = 1;
    }
  }

  _moveToward(tx, ty, speed, dt, mapRenderer) {
    const dx = tx - this.x;
    const dy = ty - this.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < 30) return;
    const nx = dx / dist;
    const ny = dy / dist;
    this.x += nx * speed * dt;
    this.y += ny * speed * dt;
    this._clampToArena(mapRenderer);
  }

  _clampToArena(mapRenderer) {
    const arena = mapRenderer.getArenaPixelSize();
    this.x = Math.max(20, Math.min(arena.w - 20, this.x));
    this.y = Math.max(20, Math.min(arena.h - 20, this.y));
  }

  _hitWall(mapRenderer) {
    return mapRenderer.isBlocked(this.x, this.y);
  }

  takeDamage(dmg) {
    if (this.isDead) return false;
    this.hp -= dmg;
    this.flashTimer = 0.08;
    if (this.hp <= 0) {
      this.hp = 0;
      this.die();
      return true;
    }
    return false;
  }

  applyBurn(dmgPerTick, duration) {
    this.burnDmg = Math.max(this.burnDmg, dmgPerTick);
    this.burnTimer = Math.min(this.burnTimer + duration, 9);
  }

  applySlow(amount, duration) {
    this.slowAmount = Math.min(0.2, Math.max(this.slowAmount, amount * 0.5));
    this.slowTimer = Math.max(this.slowTimer, duration * 0.5);
  }

  /** Idempotent die — only first call transitions state */
  die() {
    if (this.isDead) return;
    this.isDead = true;
    this.state = BOSS_STATES.DYING;
    this.stateTimer = 1.5;
    this.animator.play('death', false);
  }

  isDealingDamage() {
    return this.state === BOSS_STATES.ATTACK || this.state === BOSS_STATES.CHARGING;
  }

  getCurrentAttackDmg() {
    return this.currentAttack?.dmg || 20;
  }

  getCurrentAttackRange() {
    return this.currentAttack?.range || 30;
  }

  getCurrentAttackArc() {
    return this.currentAttack?.arc || Math.PI * 0.6;
  }

  /** Get the sweep geometry — used for BOTH drawing AND hit detection */
  getSweepGeometry() {
    const atk = this.currentAttack;
    if (!atk) return null;
    return {
      angle: this.sweepAngle,
      arc: atk.arc || Math.PI * 0.6,
      range: atk.range || 35,
    };
  }

  /** Get stomp geometry — used for BOTH drawing AND hit detection */
  getStompGeometry() {
    const atk = this.currentAttack;
    if (!atk) return null;
    return {
      radius: atk.radius || 40,
    };
  }

  /** Check if a point (px, py) is within current sweep attack */
  isPointInSweep(px, py) {
    const geo = this.getSweepGeometry();
    if (!geo) return false;
    const dx = px - this.x;
    const dy = py - this.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist > geo.range) return false;
    const angle = Math.atan2(dy, dx);
    let angleDiff = Math.abs(angle - geo.angle);
    if (angleDiff > Math.PI) angleDiff = Math.PI * 2 - angleDiff;
    return angleDiff <= geo.arc / 2;
  }

  /** Check if a point (px, py) is within current stomp attack */
  isPointInStomp(px, py) {
    const geo = this.getStompGeometry();
    if (!geo) return false;
    const dx = px - this.x;
    const dy = py - this.y;
    return Math.sqrt(dx * dx + dy * dy) <= geo.radius;
  }

  draw(ctx) {
    if (this.state === BOSS_STATES.DEAD) return;

    // Shadow
    ctx.fillStyle = 'rgba(0,0,0,0.25)';
    ctx.beginPath();
    ctx.ellipse(this.x, this.y + this.drawH / 2 - 2, this.drawW / 2.5, 5, 0, 0, Math.PI * 2);
    ctx.fill();

    // Intro animation
    if (this.state === BOSS_STATES.INTRO) {
      const pulse = Math.sin(this.stateTimer * 8) * 0.3 + 0.7;
      ctx.globalAlpha = pulse;
      // Chapter-specific aura colors
      const auraColor = this.def.chapter === 1 ? 'rgba(180,80,40,0.3)' :
                         this.def.chapter === 2 ? 'rgba(120,80,40,0.3)' :
                         'rgba(120,40,160,0.3)';
      ctx.fillStyle = auraColor;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.drawW, 0, Math.PI * 2);
      ctx.fill();
    }

    // Wind-up telegraph — uses same geometry as hit detection
    if (this.state === BOSS_STATES.WIND_UP && this.currentAttack) {
      ctx.globalAlpha = 0.25;
      const atk = this.currentAttack;
      if (atk.type === 'sweep' || atk.type === 'double_sweep') {
        const geo = this.getSweepGeometry();
        if (geo) {
          ctx.fillStyle = '#ff4444';
          ctx.beginPath();
          ctx.arc(this.x, this.y, geo.range, geo.angle - geo.arc / 2, geo.angle + geo.arc / 2);
          ctx.lineTo(this.x, this.y);
          ctx.fill();
        }
      } else if (atk.type === 'charge' || atk.type === 'double_charge') {
        ctx.strokeStyle = '#ff6622';
        ctx.lineWidth = 3;
        ctx.setLineDash([6, 4]);
        ctx.beginPath();
        ctx.moveTo(this.x, this.y);
        ctx.lineTo(this.x + this.chargeDirX * 100, this.y + this.chargeDirY * 100);
        ctx.stroke();
        ctx.setLineDash([]);
      } else if (atk.type === 'stomp') {
        const geo = this.getStompGeometry();
        if (geo) {
          ctx.fillStyle = '#ff8844';
          ctx.beginPath();
          ctx.arc(this.x, this.y, geo.radius, 0, Math.PI * 2);
          ctx.fill();
        }
      } else if (atk.type === 'bullet_ring') {
        ctx.strokeStyle = '#cc44ff';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(this.x, this.y, 20, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
    }

    // Stunned stars
    if (this.state === BOSS_STATES.STUNNED) {
      const t = Date.now() / 200;
      for (let i = 0; i < 3; i++) {
        const a = t + i * Math.PI * 2 / 3;
        ctx.fillStyle = '#ffcc00';
        ctx.font = '8px serif';
        ctx.fillText('★', this.x + Math.cos(a) * 15, this.y - this.drawH / 2 + Math.sin(a) * 5);
      }
    }

    // Burn effect
    if (this.burnTimer > 0) {
      ctx.fillStyle = 'rgba(255,80,0,0.2)';
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.drawW / 2 + 4, 0, Math.PI * 2);
      ctx.fill();
    }

    // Flash & hit jolt
    const joltX = this.flashTimer > 0 ? Math.sin(this.flashTimer * 60) * 3 : 0;
    const joltY = this.flashTimer > 0 ? Math.cos(this.flashTimer * 60) * 2 : 0;

    // Draw sprite
    const drawX = this.x - this.drawW / 2 + joltX;
    const drawY = (this.def.sprite === 'void_beast' ? this.y - this.drawH / 2 + 4 : this.y - this.drawH * 0.86) + joltY;
    this.animator.draw(ctx, drawX, drawY, this.drawW, this.drawH);

    if (this.flashTimer > 0) {
      ctx.save();
      ctx.globalAlpha = 0.55;
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(drawX + 6, drawY + 6, this.drawW - 12, this.drawH - 12);
      ctx.restore();
    }
    ctx.globalAlpha = 1;
  }
}
