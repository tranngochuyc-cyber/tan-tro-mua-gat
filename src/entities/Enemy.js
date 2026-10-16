// ============================================================
// Enemy — all enemy types with state machine behaviors
// Unified kill flow: only CombatScene calls _onEnemyKilled.
// isDead guards prevent double-processing.
// ============================================================
import { SpriteSheet, Animator } from '../engine/SpriteSheet.js';
import { ENEMIES } from '../data/GameData.js';

const STATES = {
  SPAWN: 'spawn',
  IDLE: 'idle',
  CHASE: 'chase',
  WIND_UP: 'wind_up',
  ATTACK: 'attack',
  REST: 'rest',
  DASH_WIND: 'dash_wind',
  DASHING: 'dashing',
  CHARGE_WIND: 'charge_wind',
  CHARGING: 'charging',
  STUNNED: 'stunned',
  HURT: 'hurt',
  DYING: 'dying',
  DEAD: 'dead',
};

export class Enemy {
  constructor(assets, defId, x, y, scaleMult = 1) {
    const def = ENEMIES[defId];
    if (!def) throw new Error(`Unknown enemy: ${defId}`);
    this.def = def;
    this.id = def.id;
    this.x = x;
    this.y = y;
    this.vx = 0;
    this.vy = 0;

    // Scaled stats
    this.maxHp = Math.floor(def.hp * scaleMult);
    this.hp = this.maxHp;
    this.dmg = Math.floor(def.dmg * scaleMult);
    this.speed = def.speed;
    this.xp = def.xp;
    this.gold = def.gold;

    // Hitbox
    this.hitboxW = def.hitboxW || 14;
    this.hitboxH = def.hitboxH || 14;
    this.drawW = 32;
    this.drawH = 32;

    // State
    this.state = STATES.SPAWN;
    this.stateTimer = 0.7;
    this.attackCd = 0;
    this.facingRight = true;
    this.isDead = false;
    this._deathProcessed = false; // ensures rewards given exactly once
    this.markedForRemoval = false;
    this.hitThisSwing = false;
    this.flashTimer = 0;
    this.guardPoint = null;

    // Combo tracking for melee_combo
    this.comboCount = 0;
    this.comboCurrent = 0;

    // Charge tracking
    this.chargeTargetX = 0;
    this.chargeTargetY = 0;
    this.chargeDirX = 0;
    this.chargeDirY = 0;

    // Slow effect
    this.slowAmount = 0;
    this.slowTimer = 0;

    // Burn effect
    this.burnDmg = 0;
    this.burnTimer = 0;
    this.burnTickTimer = 0;
    // Flag set when burn kills — CombatScene checks this
    this.killedByBurn = false;

    // Elite modifier
    this.isElite = false;
    this.eliteType = null;

    // Separation steering
    this.sepX = 0;
    this.sepY = 0;

    // Animation
    this.animator = new Animator();
    this._setupAnimations(assets, def.sprite);
  }

  _setupAnimations(assets, spriteType) {
    switch (spriteType) {
      case 'orc': {
        const crop = { x: 34, y: 31, w: 40, h: 34 };
        const idle = assets.getImage('orc_idle');
        const walk = assets.getImage('orc_walk');
        const atk1 = assets.getImage('orc_attack01');
        const atk2 = assets.getImage('orc_attack02');
        const hurt = assets.getImage('orc_hurt');
        const death = assets.getImage('orc_death');
        if (idle) this.animator.addAnimation('idle', new SpriteSheet(idle, 100, 100, Math.floor(idle.width / 100), 8, crop));
        if (walk) this.animator.addAnimation('walk', new SpriteSheet(walk, 100, 100, Math.floor(walk.width / 100), 8, crop));
        if (atk1) this.animator.addAnimation('attack', new SpriteSheet(atk1, 100, 100, Math.floor(atk1.width / 100), 10, crop));
        if (atk2) this.animator.addAnimation('attack2', new SpriteSheet(atk2, 100, 100, Math.floor(atk2.width / 100), 10, crop));
        if (hurt) this.animator.addAnimation('hurt', new SpriteSheet(hurt, 100, 100, Math.floor(hurt.width / 100), 8, crop));
        if (death) this.animator.addAnimation('death', new SpriteSheet(death, 100, 100, Math.floor(death.width / 100), 6, crop));
        this.drawW = 34;
        this.drawH = 30;
        break;
      }
      case 'shadow_imp': {
        const img = assets.getImage('shadow_imp');
        if (img) {
          // The chicken atlas has four 16px frames per row, not 32px blocks.
          const fw = 16, fh = 16;
          const fc = Math.max(1, Math.floor(img.width / fw));
          this.animator.addAnimation('idle', new SpriteSheet(img, fw, fh, fc, 6));
          this.animator.addAnimation('walk', new SpriteSheet(img, fw, fh, fc, 10));
          this.animator.addAnimation('attack', new SpriteSheet(img, fw, fh, fc, 12));
          this.animator.addAnimation('hurt', new SpriteSheet(img, fw, fh, fc, 8));
          this.animator.addAnimation('death', new SpriteSheet(img, fw, fh, fc, 6));
        }
        this.drawW = 30;
        this.drawH = 30;
        break;
      }
      case 'void_beast': {
        const img = assets.getImage('void_beast');
        if (img) {
          const fw = 32, fh = 32;
          const fc = Math.max(1, Math.floor(img.width / fw));
          this.animator.addAnimation('idle', new SpriteSheet(img, fw, fh, Math.min(fc, 4), 5));
          this.animator.addAnimation('walk', new SpriteSheet(img, fw, fh, Math.min(fc, 4), 6));
          this.animator.addAnimation('attack', new SpriteSheet(img, fw, fh, Math.min(fc, 4), 8));
          this.animator.addAnimation('hurt', new SpriteSheet(img, fw, fh, Math.min(fc, 4), 6));
          this.animator.addAnimation('death', new SpriteSheet(img, fw, fh, Math.min(fc, 4), 5));
        }
        this.drawW = 50;
        this.drawH = 44;
        break;
      }
      case 'dark_cultist': {
        const idle = assets.getImage('dark_cultist_idle');
        const walk = assets.getImage('dark_cultist_walk');
        if (idle) {
          const fw = 32, fh = 32;
          const fc = Math.max(1, Math.floor(idle.width / fw));
          this.animator.addAnimation('idle', new SpriteSheet(idle, fw, fh, Math.min(fc, 4), 6));
          this.animator.addAnimation('hurt', new SpriteSheet(idle, fw, fh, Math.min(fc, 4), 8));
          this.animator.addAnimation('death', new SpriteSheet(idle, fw, fh, Math.min(fc, 4), 5));
        }
        if (walk) {
          const fw = 32, fh = 32;
          const fc = Math.max(1, Math.floor(walk.width / fw));
          this.animator.addAnimation('walk', new SpriteSheet(walk, fw, fh, Math.min(fc, 6), 8));
          this.animator.addAnimation('attack', new SpriteSheet(walk, fw, fh, Math.min(fc, 6), 10));
        }
        this.drawW = 40;
        this.drawH = 40;
        break;
      }
    }
    this.animator.play('idle');
  }

  makeElite(type) {
    this.isElite = true;
    this.eliteType = type;
    this.drawW = Math.floor(this.drawW * 1.2);
    this.drawH = Math.floor(this.drawH * 1.2);
    if (type === 'armored') {
      this.maxHp = Math.floor(this.maxHp * 1.5);
      this.hp = this.maxHp;
      this.speed *= 0.8;
    } else if (type === 'frenzied') {
      this.speed *= 1.15;
    }
    this.xp *= 3;
    this.gold *= 2;
  }

  update(dt, playerX, playerY, mapRenderer) {
    if (this.isDead) return;

    // Update status effects
    if (this.slowTimer > 0) {
      this.slowTimer -= dt;
      if (this.slowTimer <= 0) this.slowAmount = 0;
    }
    // Burn: damage is applied here but death is just flagged—
    // CombatScene will call _onEnemyKilled in its update loop
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

    // A charmed enemy fights for the player and cannot wind up an attack against them.
    if (this.charmed && this.charmedTimer > 0) {
      this.state = STATES.CHASE;
      this.stateTimer = 0;
      this.animator.play('walk');
      this.animator.update(dt);
      return;
    }

    const effectiveSpeed = this.speed * (1 - this.slowAmount);
    const dx = playerX - this.x;
    const dy = playerY - this.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const dirX = dist > 0 ? dx / dist : 0;
    const dirY = dist > 0 ? dy / dist : 0;

    // Facing
    if (dx > 0) this.facingRight = true;
    else if (dx < 0) this.facingRight = false;

    this.stateTimer -= dt;

    switch (this.state) {
      case STATES.SPAWN:
        if (this.stateTimer <= 0) {
          this.state = STATES.CHASE;
          this.animator.play('idle');
        }
        break;

      case STATES.CHASE:
        this._moveToward(playerX, playerY, effectiveSpeed, dt, mapRenderer);
        // Apply separation safely with collision bounds
        const sepXStep = this.sepX * dt;
        const sepYStep = this.sepY * dt;
        const hw = this.hitboxW / 2;
        const hh = this.hitboxH / 2;
        if (!mapRenderer.isRectBlocked(this.x + sepXStep - hw, this.y - hh, this.hitboxW, this.hitboxH)) {
          this.x += sepXStep;
        }
        if (!mapRenderer.isRectBlocked(this.x - hw, this.y + sepYStep - hh, this.hitboxW, this.hitboxH)) {
          this.y += sepYStep;
        }
        this.animator.play('walk');
        if (this._shouldAttack(dist)) {
          this._beginAttack(dirX, dirY, playerX, playerY);
        }
        break;

      case STATES.WIND_UP:
        if (this.stateTimer <= 0) {
          this.state = STATES.ATTACK;
          this.stateTimer = 0.3;
          this.animator.play('attack', false);
        }
        break;

      case STATES.ATTACK:
        if (this.stateTimer <= 0 || this.animator.isFinished()) {
          this.state = STATES.REST;
          this.stateTimer = this.def.attackCd || 1.0;
          this.comboCurrent++;
          if (this.def.behavior === 'melee_combo' && this.comboCurrent < (this.def.comboHits || 2)) {
            this.state = STATES.WIND_UP;
            this.stateTimer = 0.2;
          } else {
            this.comboCurrent = 0;
            if (this.def.behavior === 'melee_combo') {
              this.stateTimer = this.def.comboRest || 1.5;
            }
          }
        }
        break;

      case STATES.REST:
        this.animator.play('idle');
        if (this.stateTimer <= 0) {
          this.state = STATES.CHASE;
        }
        break;

      case STATES.DASH_WIND:
        if (this.stateTimer <= 0) {
          this.state = STATES.DASHING;
          this.stateTimer = this.def.dashDuration || 0.3;
        }
        break;

      case STATES.DASHING:
        this.x += this.chargeDirX * (this.def.dashSpeed || 160) * dt;
        this.y += this.chargeDirY * (this.def.dashSpeed || 160) * dt;
        this._clampToArena(mapRenderer);
        if (this.stateTimer <= 0) {
          this.state = STATES.REST;
          this.stateTimer = 1.0;
        }
        break;

      case STATES.CHARGE_WIND:
        if (this.stateTimer <= 0) {
          this.state = STATES.CHARGING;
          this.stateTimer = this.def.chargeDuration || 0.8;
        }
        break;

      case STATES.CHARGING:
        this.x += this.chargeDirX * (this.def.chargeSpeed || 180) * dt;
        this.y += this.chargeDirY * (this.def.chargeSpeed || 180) * dt;
        if (this._hitWall(mapRenderer)) {
          this.state = STATES.STUNNED;
          this.stateTimer = 1.5;
        } else if (this.stateTimer <= 0) {
          this.state = STATES.REST;
          this.stateTimer = 1.5;
        }
        break;

      case STATES.STUNNED:
        this.animator.play('hurt');
        if (this.stateTimer <= 0) {
          this.state = STATES.CHASE;
        }
        break;

      case STATES.HURT:
        if (this.stateTimer <= 0) {
          this.state = STATES.CHASE;
        }
        break;

      case STATES.DYING:
        if (this.stateTimer <= 0) {
          this.state = STATES.DEAD;
          this.markedForRemoval = true;
        }
        break;

      case STATES.DEAD:
        this.markedForRemoval = true;
        break;
    }

    // Guard point behavior
    if (this.def.behavior === 'guard_point' && this.guardPoint && this.state === STATES.CHASE) {
      const gdx = this.guardPoint.x - this.x;
      const gdy = this.guardPoint.y - this.y;
      const gDist = Math.sqrt(gdx * gdx + gdy * gdy);
      if (gDist > 60 && dist > 40) {
        this._moveToward(this.guardPoint.x, this.guardPoint.y, effectiveSpeed, dt, mapRenderer);
      }
    }

    // Ranged behavior
    if (this.def.behavior === 'ranged' && this.state === STATES.CHASE) {
      if (dist < 60) {
        this._moveToward(this.x - dirX * 40, this.y - dirY * 40, effectiveSpeed, dt, mapRenderer);
      } else if (dist > (this.def.attackRange || 120)) {
        this._moveToward(playerX, playerY, effectiveSpeed, dt, mapRenderer);
      }
    }

    this.animator.flip = !this.facingRight;
    this.animator.update(dt);
  }

  _shouldAttack(dist) {
    switch (this.def.behavior) {
      case 'melee_chase':
      case 'melee_combo':
      case 'guard_point':
        return dist < (this.def.attackRange || 18) && this.state === STATES.CHASE;
      case 'dash_attack':
        return dist < 80 && this.state === STATES.CHASE;
      case 'charge':
        return dist < 120 && this.state === STATES.CHASE;
      case 'ranged':
        return dist < (this.def.attackRange || 120) && dist > 30 && this.state === STATES.CHASE;
      default:
        return dist < 20 && this.state === STATES.CHASE;
    }
  }

  _beginAttack(dirX, dirY, playerX, playerY) {
    switch (this.def.behavior) {
      case 'melee_chase':
      case 'melee_combo':
      case 'guard_point':
        this.state = STATES.WIND_UP;
        this.stateTimer = this.def.attackWind || 0.45;
        this.animator.play('attack', false);
        break;
      case 'dash_attack':
        this.state = STATES.DASH_WIND;
        this.stateTimer = this.def.dashWind || 0.5;
        this.chargeDirX = dirX;
        this.chargeDirY = dirY;
        break;
      case 'charge':
        this.state = STATES.CHARGE_WIND;
        this.stateTimer = this.def.chargeWind || 0.9;
        this.chargeDirX = dirX;
        this.chargeDirY = dirY;
        this.chargeTargetX = playerX;
        this.chargeTargetY = playerY;
        break;
      case 'ranged':
        this.state = STATES.WIND_UP;
        this.stateTimer = this.def.attackWind || 0.8;
        break;
    }
  }

  _moveToward(tx, ty, speed, dt, mapRenderer) {
    const dx = tx - this.x;
    const dy = ty - this.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < 2) return;
    const nx = dx / dist;
    const ny = dy / dist;
    const newX = this.x + nx * speed * dt;
    const newY = this.y + ny * speed * dt;
    const hw = this.hitboxW / 2;
    const hh = this.hitboxH / 2;
    if (!mapRenderer.isRectBlocked(newX - hw, this.y - hh, this.hitboxW, this.hitboxH)) {
      this.x = newX;
    }
    if (!mapRenderer.isRectBlocked(this.x - hw, newY - hh, this.hitboxW, this.hitboxH)) {
      this.y = newY;
    }
  }

  _clampToArena(mapRenderer) {
    const arena = mapRenderer.getArenaPixelSize();
    this.x = Math.max(16, Math.min(arena.w - 16, this.x));
    this.y = Math.max(16, Math.min(arena.h - 16, this.y));
  }

  _hitWall(mapRenderer) {
    const hw = this.hitboxW / 2;
    const hh = this.hitboxH / 2;
    return mapRenderer.isRectBlocked(this.x - hw, this.y - hh, this.hitboxW, this.hitboxH);
  }

  /**
   * Take damage from any source. Returns true if this hit killed the enemy.
   * Sets isDead and transitions to DYING state.
   * Multiple calls after death are no-ops (returns false).
   */
  takeDamage(dmg, knockbackX = 0, knockbackY = 0) {
    if (this.isDead) return false;
    this.hp -= dmg;
    this.flashTimer = 0.1;

    // Knockback
    this.x += knockbackX;
    this.y += knockbackY;

    if (this.hp <= 0) {
      this.hp = 0;
      this.die();
      return true; // killed
    }
    return false;
  }

  applyBurn(dmgPerTick, duration) {
    this.burnDmg = Math.max(this.burnDmg, dmgPerTick);
    this.burnTimer = Math.min(this.burnTimer + duration, 9);
  }

  applySlow(amount, duration) {
    this.slowAmount = Math.min(0.4, Math.max(this.slowAmount, amount));
    this.slowTimer = Math.max(this.slowTimer, duration);
  }

  /** Transition to dying state. Idempotent — only first call has effect. */
  die() {
    if (this.isDead) return;
    this.isDead = true;
    this.state = STATES.DYING;
    this.deathDuration = 0.22;
    this.stateTimer = this.deathDuration;
    this.sepX = 0;
    this.sepY = 0;
    if (this.animator.animations['death']) {
      this.animator.play('death', false);
    } else if (this.animator.animations['hurt']) {
      this.animator.play('hurt', false);
    }
  }

  /** Is this enemy currently dealing damage? */
  isDealingDamage() {
    if (this.charmed && this.charmedTimer > 0) return false;
    return this.state === STATES.ATTACK ||
           this.state === STATES.DASHING ||
           this.state === STATES.CHARGING;
  }

  /** Is winding up (for telegraph drawing)? */
  isWindingUp() {
    return this.state === STATES.WIND_UP ||
           this.state === STATES.DASH_WIND ||
           this.state === STATES.CHARGE_WIND;
  }

  draw(ctx) {
    // Spawn warning (Demonic summoning rift with clear danger tag)
    if (this.state === STATES.SPAWN) {
      const pulse = Math.sin(this.stateTimer * 16) * 0.3 + 0.7;
      ctx.save();
      ctx.globalAlpha = pulse;
      // Ground summoning ellipse
      ctx.fillStyle = 'rgba(220, 38, 38, 0.25)';
      ctx.beginPath();
      ctx.ellipse(this.x, this.y + 2, 14, 6, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Warning indicator tag
      ctx.fillStyle = 'rgba(15, 10, 18, 0.88)';
      ctx.fillRect(this.x - 22, this.y - 18, 44, 13);
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 1;
      ctx.strokeRect(this.x - 21.5, this.y - 17.5, 43, 12);
      ctx.fillStyle = '#fca5a5';
      ctx.font = 'bold 7px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('! XUẤT HIỆN', this.x, this.y - 9);
      ctx.restore();
      return;
    }
    if (this.state === STATES.DEAD) return;

    // Hit flash
    if (this.flashTimer > 0) {
      ctx.globalAlpha = 0.7;
    }

    // Shadow
    ctx.fillStyle = 'rgba(0,0,0,0.25)';
    ctx.beginPath();
    ctx.ellipse(this.x, this.y + 2, this.drawW * 0.25, 4, 0, 0, Math.PI * 2);
    ctx.fill();

    // Wind-up danger telegraph (Clear Crimson Red hazard zone)
    if (this.isWindingUp()) {
      if (this.def.behavior === 'charge') {
        ctx.strokeStyle = 'rgba(239, 68, 68, 0.9)';
        ctx.lineWidth = 2.5;
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.moveTo(this.x, this.y);
        ctx.lineTo(this.x + this.chargeDirX * 100, this.y + this.chargeDirY * 100);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.fillStyle = 'rgba(239, 68, 68, 0.25)';
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.drawW * 0.45, 0, Math.PI * 2);
        ctx.fill();
      } else if (this.def.behavior === 'dash_attack') {
        ctx.strokeStyle = 'rgba(239, 68, 68, 0.85)';
        ctx.lineWidth = 2;
        ctx.setLineDash([3, 3]);
        ctx.beginPath();
        ctx.moveTo(this.x, this.y);
        ctx.lineTo(this.x + this.chargeDirX * 60, this.y + this.chargeDirY * 60);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.fillStyle = 'rgba(239, 68, 68, 0.22)';
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.drawW * 0.4, 0, Math.PI * 2);
        ctx.fill();
      } else {
        const range = (this.def.attackRange || 20) + 6;
        ctx.fillStyle = 'rgba(239, 68, 68, 0.25)';
        ctx.beginPath();
        ctx.arc(this.x, this.y, range, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#ef4444';
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }
    }

    // Burn effect
    if (this.burnTimer > 0) {
      ctx.fillStyle = 'rgba(255,80,0,0.3)';
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.drawW / 2, 0, Math.PI * 2);
      ctx.fill();
    }

    // Slow effect
    if (this.slowTimer > 0) {
      ctx.fillStyle = 'rgba(80,180,255,0.3)';
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.drawW / 2, 0, Math.PI * 2);
      ctx.fill();
    }

    // Dying dissolve effect
    const isDying = (this.state === STATES.DYING);
    let deathAlpha = 1;
    let deathSink = 0;
    if (isDying) {
      const p = Math.max(0, this.stateTimer / (this.deathDuration || 0.22));
      deathAlpha = p;
      deathSink = (1 - p) * 6;
    }

    // Draw sprite (with hit jerk and white flash when damaged)
    const joltX = this.flashTimer > 0 ? Math.sin(this.flashTimer * 60) * 3 : 0;
    const joltY = this.flashTimer > 0 ? Math.cos(this.flashTimer * 60) * 2 : 0;
    const drawX = Math.round(this.x - this.drawW / 2 + joltX);
    const drawY = Math.round((this.def.sprite === 'orc' ? this.y - this.drawH * 0.86 : this.y - this.drawH / 2 + 2) + joltY + deathSink);

    ctx.save();
    if (isDying) {
      ctx.globalAlpha = deathAlpha;
    }
    this.animator.draw(ctx, drawX, drawY, this.drawW, this.drawH);

    if (this.flashTimer > 0 || isDying) {
      ctx.globalAlpha = isDying ? (1 - deathAlpha) * 0.75 : 0.55;
      ctx.fillStyle = isDying ? '#ef4444' : '#ffffff';
      ctx.fillRect(drawX + 4, drawY + 4, this.drawW - 8, this.drawH - 8);
    }
    ctx.restore();

    // Elite indicator — pixel art, no emojis
    if (this.isElite) {
      const eiX = this.x, eiY = this.y - this.drawH / 2 - 8;
      if (this.eliteType === 'armored') {
        // Pixel shield
        ctx.fillStyle = '#88aacc';
        ctx.fillRect(eiX - 3, eiY, 6, 2);
        ctx.fillRect(eiX - 4, eiY + 2, 8, 3);
        ctx.fillRect(eiX - 3, eiY + 5, 6, 1);
        ctx.fillRect(eiX - 2, eiY + 6, 4, 1);
        ctx.fillRect(eiX - 1, eiY + 7, 2, 1);
        ctx.fillStyle = '#ccddf0';
        ctx.fillRect(eiX - 2, eiY + 2, 1, 2);
      } else {
        // Pixel lightning bolt
        ctx.fillStyle = '#ff6644';
        ctx.fillRect(eiX + 1, eiY, 2, 2);
        ctx.fillRect(eiX, eiY + 2, 2, 1);
        ctx.fillRect(eiX - 2, eiY + 3, 4, 1);
        ctx.fillRect(eiX - 1, eiY + 4, 2, 2);
        ctx.fillRect(eiX, eiY + 6, 1, 2);
      }
    }

    // HP bar (only if damaged)
    if (this.hp < this.maxHp && !this.isDead) {
      const barW = this.drawW;
      const barH = 3;
      const barX = this.x - barW / 2;
      const barY = this.y - this.drawH / 2 - 10;
      // Background
      ctx.fillStyle = '#1a0808';
      ctx.fillRect(barX - 1, barY - 1, barW + 2, barH + 2);
      // Empty bar
      ctx.fillStyle = '#401010';
      ctx.fillRect(barX, barY, barW, barH);
      // Fill bar
      const hpPct = this.hp / this.maxHp;
      ctx.fillStyle = hpPct > 0.5 ? '#e03030' : (hpPct > 0.25 ? '#ff6030' : '#ff2020');
      ctx.fillRect(barX, barY, barW * hpPct, barH);
      // Highlight
      ctx.fillStyle = 'rgba(255, 150, 150, 0.4)';
      ctx.fillRect(barX, barY, barW * hpPct, 1);
    }
  }
}
