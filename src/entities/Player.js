// ============================================================
// Player — the Soldier character
// Vigor and meta bonuses are stored in _metaBonuses and
// reapplied on every recalcStats() call.
// ============================================================
import { SpriteSheet, Animator } from '../engine/SpriteSheet.js';
import * as C from '../engine/Constants.js';
import { CLASSES } from '../data/ClassData.js';

export class Player {
  get attackDmg() { return this.baseDmg; }

  constructor(assets, x, y) {
    this.x = x;
    this.y = y;
    this.vx = 0;
    this.vy = 0;

    // Stats
    this.maxHp = C.PLAYER_BASE_HP;
    this.hp = this.maxHp;
    this.baseDmg = C.PLAYER_BASE_DMG;
    this.attackCd = C.PLAYER_ATTACK_CD;
    this.critChance = C.PLAYER_CRIT_CHANCE;
    this.critMult = C.PLAYER_CRIT_MULT;
    this.speed = C.PLAYER_SPEED;
    this.dashCd = C.PLAYER_DASH_CD;
    this.dashDuration = C.PLAYER_DASH_DURATION;
    this.dashSpeed = C.PLAYER_DASH_SPEED;
    this.pickupRange = 30;
    this.armor = 0;
    this.regen = 0;
    this.xpMult = 1.0;

    // State
    this.attackTimer = 0;
    this.attackVisualTimer = 0;
    this.lastAttackAngle = 0;
    this.dashTimer = 0;
    this.dashCdTimer = 0;
    this.iframeTimer = 0;
    this.invulnerableTimer = 0;
    this.spawnProtection = 0;
    this.regenTimer = 0;
    this.isDashing = false;
    this.dashDirX = 0;
    this.dashDirY = 0;
    this.isAttacking = false;
    this.attackFrame = 0;
    this.isDead = false;
    this.deathTimer = 0;
    this.facingRight = true;
    this.aimAngle = 0;

    // Level/XP
    this.level = 1;
    this.xp = 0;
    this.xpToLevel = C.XP_BASE;

    // Inventory
    this.artifacts = []; // {id, level}
    this.charms = [];    // {id, level}
    this.gold = 0;
    this.rerolls = 1;
    this.freeRerolls = 1;

    // Active skill
    this.skillCd = 0;
    this.skillMaxCd = 10;
    this.activeSkill = null;

    // Class system
    this.classId = null;
    this.classDef = null;
    this.classPassive = null;
    this.classSkills = []; // chosen class skills
    this.pendingSkillChoice = null; // set when level triggers a class skill choice
    this.comboCounter = 0; // for combo-based passives
    this.safeTimer = 0; // time since last hit
    this.stillTimer = 0; // time standing still
    this.postDashTimer = 0; // time since last dash ended
    this.secondWindUsed = false;
    this.divineShieldUsed = false;
    this.reviveUsed = false;

    // Classic Classes Specific State
    this.aliceForm = 'small'; // 'small' | 'giant'
    this.wukongTempo = 0; // 0 to 5 stacks
    this.wukongTempoDecay = 0;
    this.draculaBatSwarmTimer = 0;
    this.piperRats = [];
    this.invulnerableTimer = 0;

    // Hitbox & Render size
    this.hitboxW = 16;
    this.hitboxH = 20;
    this.drawW = 32;
    this.drawH = 32;

    // Animation
    this.animator = new Animator();
    this._setupAnimations(assets);

    // Computed stats cache
    this._attackSpeedMult = 1;
    this._spellDmgMult = 1;
    this._cdReduction = 0;
    this._aoeRadiusMult = 1;
    this._extraProjectiles = 0;
    this._lifestealBonus = 0;
    this._maxHpMult = 1;

    // Meta bonuses — applied by startNewRun, persisted through recalcStats
    this._metaBonuses = { maxHp: 0, pickupRange: 0, freeRerolls: 0 };
  }

  _setupAnimations(assets) {
    const crop = { x: 34, y: 31, w: 40, h: 34 };
    const idle = assets.getImage('soldier_idle');
    const walk = assets.getImage('soldier_walk');
    const attack = assets.getImage('soldier_attack');
    const hurt = assets.getImage('soldier_hurt');
    const death = assets.getImage('soldier_death');

    if (idle) this.animator.addAnimation('idle', new SpriteSheet(idle, 100, 100, 6, 8, crop));
    if (walk) this.animator.addAnimation('walk', new SpriteSheet(walk, 100, 100, 8, 10, crop));
    if (attack) this.animator.addAnimation('attack', new SpriteSheet(attack, 100, 100, 6, 14, crop));
    if (hurt) this.animator.addAnimation('hurt', new SpriteSheet(hurt, 100, 100, 4, 8, crop));
    if (death) this.animator.addAnimation('death', new SpriteSheet(death, 100, 100, 4, 6, crop));

    this.animator.play('idle');
  }

  /** Apply meta unlocks — call once at run start before recalcStats */
  applyMetaUnlocks(unlocks) {
    if (!unlocks) return;
    let bonusHp = 0;
    let bonusPickup = 0;
    let bonusRerolls = 0;
    if (unlocks.vigor1) bonusHp += 5;
    if (unlocks.vigor2) bonusHp += 10;
    if (unlocks.magnet1) bonusPickup += 3;
    if (unlocks.magnet2) bonusPickup += 6;
    if (unlocks.bagSlot) bonusRerolls += 1;
    this._metaBonuses = { maxHp: bonusHp, pickupRange: bonusPickup, freeRerolls: bonusRerolls };
  }

  /** Recalculate stats from charms + meta bonuses.
   *  Vigor bonuses survive because _metaBonuses is persistent. */
  recalcStats() {
    this._attackSpeedMult = 1;
    this._spellDmgMult = 1;
    this._cdReduction = 0;
    this._aoeRadiusMult = 1;
    this._extraProjectiles = 0;
    this._lifestealBonus = 0;
    this._maxHpMult = 1;

    for (const charm of this.charms) {
      const data = this._getCharmData(charm);
      if (!data) continue;
      const s = data.stats[charm.level - 1];
      if (s.attackSpeedMult) this._attackSpeedMult *= s.attackSpeedMult;
      if (s.spellDmgMult) this._spellDmgMult *= s.spellDmgMult;
      if (s.cdReduction) this._cdReduction += s.cdReduction;
      if (s.aoeRadiusMult) this._aoeRadiusMult *= s.aoeRadiusMult;
      if (s.extraProjectiles) this._extraProjectiles += s.extraProjectiles;
      if (s.lifestealBonus) this._lifestealBonus += s.lifestealBonus;
      if (s.maxHpMult) this._maxHpMult *= s.maxHpMult;
    }

    // Recompute max HP: base + level + upgrade bonuses + meta bonuses
    const classBaseHp = this.classDef?.baseStats?.hp || C.PLAYER_BASE_HP;
    const baseMax = classBaseHp + (this.level - 1) * C.HP_PER_LEVEL;
    let bonusHp = 0;
    if (this._upgradeStats) bonusHp = this._upgradeStats.maxHp || 0;
    bonusHp += this._metaBonuses.maxHp; // Vigor I/II
    this.maxHp = Math.floor((baseMax + bonusHp) * this._maxHpMult);

    // Recompute pickup range: base + upgrade + meta
    const basePickup = 30;
    let pickupBonus = 0;
    if (this._upgradeStats) pickupBonus = this._upgradeStats.pickupRange || 0;
    pickupBonus += this._metaBonuses.pickupRange; // Magnet I/II
    this.pickupRange = basePickup + pickupBonus;

    if (this.hp > this.maxHp) this.hp = this.maxHp;
  }

  _getCharmData(charm) {
    return Player._charmData?.[charm.id];
  }

  static setCharmData(data) {
    Player._charmData = data;
  }

  static setAutoAttack(enabled) {
    Player._autoAttack = !!enabled;
  }

  get moveSpeed() { return this.speed; }
  set moveSpeed(v) { this.speed = v; }

  triggerDash(moveVec = null) {
    if (this.dashCdTimer <= 0 && !this.isDashing) {
      this.isDashing = true;
      let duration = this.dashDuration;
      let cd = this.dashCd;

      // Class mobility specifics
      if (this.classId === 'alice') {
        if (this.aliceForm === 'small') {
          duration = 0.20;
          cd = 0.9; // Alice small form: nimble rabbit dash
        } else {
          duration = 0.28;
          cd = 2.2; // Giant form: heavier leap
        }
      } else if (this.classId === 'wukong') {
        duration = 0.24;
        cd = 1.2; // Somersault cloud leap
      } else if (this.classId === 'dracula') {
        duration = 0.22;
        cd = 1.3; // Mist/bat flash
      } else if (this.classId === 'piper') {
        duration = 0.24;
        cd = 1.4; // Melodic step
      } else if (this.classId === 'assassin') {
        duration = 0.22;
        cd = Math.min(cd, 1.2);
        this.postDashTimer = 2.0; // Bóng Tối passive
        this.isShadowDash = true;
      } else if (this.classId === 'warrior') {
        duration = 0.24;
        cd = Math.min(cd, 2.0);
        this.isShieldBash = true;
      }

      this.dashTimer = duration;
      this.dashCdTimer = cd;
      this.iframeTimer = duration + 0.08;
      const move = moveVec || this._lastMoveVector || { x: 0, y: 0 };
      if (Math.hypot(move.x, move.y) > 0.1) {
        const len = Math.hypot(move.x, move.y);
        this.dashDirX = move.x / len;
        this.dashDirY = move.y / len;
      } else {
        // Stationary: dash in aim direction
        this.dashDirX = Math.cos(this.aimAngle);
        this.dashDirY = Math.sin(this.aimAngle);
      }
      return true;
    }
    return false;
  }

  update(dt, input, mapRenderer, options = {}) {
    if (this.isDead) {
      this.deathTimer += dt;
      this.animator.update(dt);
      return;
    }

    // Timers
    if (this.iframeTimer > 0) this.iframeTimer -= dt;
    if (this.invulnerableTimer > 0) this.invulnerableTimer = Math.max(0, this.invulnerableTimer - dt);
    if (this.spawnProtection > 0) this.spawnProtection = Math.max(0, this.spawnProtection - dt);
    if (this.dashCdTimer > 0) this.dashCdTimer -= dt;
    if (this.attackTimer > 0) this.attackTimer -= dt;
    if (this.attackVisualTimer > 0) this.attackVisualTimer -= dt;
    if (this.skillCd > 0) this.skillCd -= dt;
    if (this.postDashTimer > 0) this.postDashTimer -= dt;

    // Wukong tempo decay: if no attacks for 3.5s, decay tempo by 1
    if (this.classId === 'wukong' && this.wukongTempo > 0) {
      this.wukongTempoDecay = (this.wukongTempoDecay || 0) + dt;
      if (this.wukongTempoDecay >= 3.5) {
        this.wukongTempo = Math.max(0, this.wukongTempo - 1);
        this.wukongTempoDecay = 0;
      }
    }

    // Dracula Bat Swarm state (invulnerable + rapid speed)
    if (this.draculaBatSwarmTimer > 0) {
      this.draculaBatSwarmTimer -= dt;
      this.iframeTimer = Math.max(this.iframeTimer, 0.2);
    }

    // Alice Form dynamics
    if (this.classId === 'alice') {
      if (this.aliceForm === 'giant') {
        this.drawW = 44;
        this.drawH = 44;
        this.hitboxW = 20;
        this.hitboxH = 24;
      } else {
        this.drawW = 26;
        this.drawH = 26;
        this.hitboxW = 12;
        this.hitboxH = 14;
      }
    }

    // Regen
    if (this.regen > 0) {
      this.regenTimer += dt;
      if (this.regenTimer >= 3) {
        this.regenTimer -= 3;
        this.heal(this.regen);
      }
    }

    // Aim angle from mouse
    const mouse = input.getMousePos();
    if (options?.camera) {
      const wm = options.camera.screenToWorld(mouse.x, mouse.y);
      this.aimAngle = Math.atan2(wm.y - this.y, wm.x - this.x);
    } else {
      const screenX = options?.playerScreenX !== undefined ? options.playerScreenX : 320;
      const screenY = options?.playerScreenY !== undefined ? options.playerScreenY : 180;
      this.aimAngle = Math.atan2(mouse.y - screenY, mouse.x - screenX);
    }

    // Movement vector
    const move = input.getMoveVector();
    this._lastMoveVector = move;

    // Dash
    if (input.justPressed('Space')) {
      this.triggerDash(move);
    }

    // Movement
    if (this.isDashing) {
      this.dashTimer -= dt;
      this.vx = this.dashDirX * this.dashSpeed;
      this.vy = this.dashDirY * this.dashSpeed;
      if (this.dashTimer <= 0) {
        this.isDashing = false;
        this.postDashTimer = 2.0;
      }
    } else {
      this.vx = move.x * this.speed;
      this.vy = move.y * this.speed;
      if (Math.abs(this.vx) > 1 || Math.abs(this.vy) > 1) {
        this.stillTimer = 0;
      } else {
        this.stillTimer += dt;
      }
    }

    // Apply velocity with sliding collision so player never gets stuck
    const stepX = this.vx * dt;
    const stepY = this.vy * dt;
    const hw = this.hitboxW / 2;
    const hh = this.hitboxH / 2;

    if (!mapRenderer.isRectBlocked(this.x + stepX - hw, this.y - hh, this.hitboxW, this.hitboxH)) {
      this.x += stepX;
    }
    if (!mapRenderer.isRectBlocked(this.x - hw, this.y + stepY - hh, this.hitboxW, this.hitboxH)) {
      this.y += stepY;
    }

    // Clamp to arena
    const arena = mapRenderer.getArenaPixelSize();
    this.x = Math.max(hw + 16, Math.min(arena.w - hw - 16, this.x));
    this.y = Math.max(hh + 16, Math.min(arena.h - hh - 16, this.y));

    // Facing direction: prioritize aim direction when attacking or aiming
    if (Math.abs(Math.cos(this.aimAngle)) > 0.08) {
      this.facingRight = Math.cos(this.aimAngle) > 0;
    } else if (this.vx > 0) {
      this.facingRight = true;
    } else if (this.vx < 0) {
      this.facingRight = false;
    }

    // Attack (suppressed if clicking HUD action buttons)
    this.isAttacking = false;
    const effectiveAttackCd = Math.max(0.15, this.attackCd / this._attackSpeedMult);
    const wantsAttack = !options?.suppressAttack && (
      input.isMouseDown?.() ||
      input.mouseClicked?.() ||
      Boolean(input.isDown?.('KeyJ')) ||
      Boolean(input.isDown?.('KeyF')) ||
      Boolean(input.keys?.KeyJ) ||
      Boolean(input.keys?.KeyF) ||
      Player._autoAttack
    );
    if (wantsAttack && this.attackTimer <= 0 && !this.isDashing) {
      this.isAttacking = true;
      this.attackTimer = effectiveAttackCd;
      this.attackVisualTimer = 0.16;
      this.lastAttackAngle = this.aimAngle;
      this.attackFrame = 0;
      this.animator.play('attack', false);
    }

    // Animation state machine
    if (this.isDashing) {
      // Keep current anim during dash
    } else if (this.isAttacking && !this.animator.isFinished()) {
      // Playing attack animation
    } else if (this.iframeTimer > 0 && !this.isAttacking) {
      // Hurt flash
    } else if (Math.abs(this.vx) > 1 || Math.abs(this.vy) > 1) {
      this.animator.play('walk');
    } else {
      this.animator.play('idle');
    }

    this.animator.flip = !this.facingRight;
    this.animator.update(dt);
  }

  /** Take damage with i-frame protection */
  takeDamage(amount) {
    if (this.isDead || this.iframeTimer > 0 || this.invulnerableTimer > 0 || this.spawnProtection > 0) return false;

    // Dodge chance (skills + Alice small form)
    if (this.classId === 'alice' && this.aliceForm === 'small') {
      const dodgeChance = 0.20 + (this.classSkills.some(s => s.effect?.dodgeChance) ? 0.15 : 0);
      if (Math.random() < dodgeChance) return false;
    }
    for (const s of this.classSkills || []) {
      if (s.effect?.dodgeChance && Math.random() < s.effect.dodgeChance) {
        return false;
      }
    }

    // Wukong loses tempo rhythm when taking damage!
    if (this.classId === 'wukong') {
      this.wukongTempo = 0;
      this.wukongTempoDecay = 0;
    }

    let effectiveArmor = this.armor;
    if (this.stillTimer >= 1.5 && this.classPassive?.effect?.armorWhenStill) {
      effectiveArmor = Math.floor(effectiveArmor * (1 + this.classPassive.effect.armorWhenStill));
    }

    let dmg = Math.max(1, amount - effectiveArmor);

    // Warrior passive: 15% damage reduction if HP < 40%
    if (this.classPassive?.effect?.lowHpDmgReduction && (this.hp / this.maxHp) < (this.classPassive.effect.lowHpThreshold || 0.4)) {
      dmg = Math.max(1, Math.floor(dmg * (1 - this.classPassive.effect.lowHpDmgReduction)));
    }

    this.hp -= dmg;
    this.iframeTimer = C.PLAYER_IFRAME;

    // Second Wind skill (Warrior Lv5: Heal 30% HP when HP < 25%, 1/stage)
    if (this.hp > 0 && this.hp < this.maxHp * 0.25 && !this.secondWindUsed) {
      if (this.classSkills.some(s => s.effect?.secondWind)) {
        this.secondWindUsed = true;
        this.heal(Math.floor(this.maxHp * 0.3));
      }
    }

    // Divine Shield skill (Paladin Lv8: 3s invulnerability when HP < 15%, 1/stage)
    if (this.hp > 0 && this.hp < this.maxHp * 0.15 && !this.divineShieldUsed) {
      if (this.classSkills.some(s => s.effect?.divineShield)) {
        this.divineShieldUsed = true;
        this.iframeTimer = 3.0;
      }
    }

    if (this.hp <= 0) {
      // Undying skill (Necromancer Lv8: Revive 1/stage with 50% HP)
      if (!this.reviveUsed && this.classSkills.some(s => s.effect?.revive)) {
        this.reviveUsed = true;
        this.hp = Math.floor(this.maxHp * 0.5);
        this.iframeTimer = 1.5;
        this.animator.play('hurt', false);
        return false;
      }

      this.hp = 0;
      this.isDead = true;
      this.animator.play('death', false);
      return true; // died
    }
    this.animator.play('hurt', false);
    return false;
  }

  heal(amount) {
    this.hp = Math.min(this.maxHp, this.hp + amount);
  }

  /** Apply a character class to this player */
  applyClass(classId) {
    const cls = CLASSES[classId];
    if (!cls) return;
    this.classId = classId;
    this.classDef = cls;
    this.classPassive = cls.passive;
    this.attackStyle = cls.attackStyle;
    this.classActiveSkill = cls.activeSkill;
    this.classColor = cls.color;
    this.classSkills = [];
    this.secondWindUsed = false;
    this.divineShieldUsed = false;
    this.reviveUsed = false;
    this.comboCounter = 0;

    // Reset classic class specific state
    this.aliceForm = 'small';
    this.wukongTempo = 0;
    this.wukongTempoDecay = 0;
    this.draculaBatSwarmTimer = 0;
    this.piperRats = [];

    // Apply base stats from class
    this.maxHp = cls.baseStats.hp;
    this.hp = this.maxHp;
    this.baseDmg = cls.baseStats.dmg;
    this.speed = cls.baseStats.speed;
    this.attackCd = cls.baseStats.attackCd;
    this.critChance = cls.baseStats.critChance;
    this.critMult = cls.baseStats.critMult;
    this.armor = cls.baseStats.armor;
    this.dashCd = cls.baseStats.dashCd;
    this.skillMaxCd = cls.activeSkill?.cd || 8;
    this.skillCd = 0;

    // Apply passive effects that are stat-based
    const pe = cls.passive?.effect || {};
    if (pe.regen) this.regen = pe.regen;
    if (pe.lifestealBase) this._lifestealBonus += pe.lifestealBase;
    if (pe.cdReduction) this._cdReduction += pe.cdReduction;
    if (pe.dashCdOverride) this.dashCd = pe.dashCdOverride;
    if (pe.speedMult) this.speed = Math.floor(this.speed * pe.speedMult);
  }

  /** Apply class growth when leveling up */
  _applyClassGrowth() {
    if (!this.classDef) return;
    const g = this.classDef.growth;
    if (g.hp) this.maxHp += Math.floor(g.hp);
    if (g.dmg) this.baseDmg += g.dmg;
    if (g.armor) this.armor += g.armor;
    if (g.speed) this.speed += g.speed;
    if (g.critChance) this.critChance = Math.min(0.6, this.critChance + g.critChance);
    if (g.critMult) this.critMult += g.critMult;
    if (g.lifesteal) this._lifestealBonus += g.lifesteal;
    if (g.spellDmg) this._spellDmgMult += g.spellDmg * 0.01;
    if (g.cdReduction) this._cdReduction = Math.min(0.5, this._cdReduction + g.cdReduction);
    if (g.regen) this.regen += g.regen;
  }

  /** Check if this level has a class skill choice */
  getClassSkillChoice() {
    if (!this.classDef?.skillChoices) return null;
    return this.classDef.skillChoices.find(sc => sc.level <= this.level &&
      !this.classSkills.some(chosen => sc.options.some(option => option.id === chosen.id)));
  }

  /** Apply a chosen class skill */
  applyClassSkill(skillId) {
    if (!this.classDef?.skillChoices) return;
    for (const sc of this.classDef.skillChoices) {
      for (const opt of sc.options) {
        if (opt.id === skillId) {
          this.classSkills.push(opt);
          const e = opt.effect;
          if (e.armor) this.armor += e.armor;
          if (e.maxHp) { this.maxHp += e.maxHp; if (e.maxHp > 0) this.hp += e.maxHp; }
          if (e.baseDmg) this.baseDmg += e.baseDmg;
          if (e.moveSpeed) this.speed += e.moveSpeed;
          if (e.critChance) this.critChance = Math.min(0.6, this.critChance + e.critChance);
          if (e.critMult) this.critMult += e.critMult;
          if (e.attackCd) this.attackCd = Math.max(0.15, this.attackCd + e.attackCd);
          if (e.dashCd) this.dashCd = Math.max(0.5, this.dashCd + e.dashCd);
          if (e.regen) this.regen += e.regen;
          if (e.extraProjectiles) this._extraProjectiles += e.extraProjectiles;
          if (e.spellDmgMult) this._spellDmgMult += e.spellDmgMult;
          if (e.lifestealBonus) this._lifestealBonus += e.lifestealBonus;
          if (e.attackSpeedBonus) this._attackSpeedMult += e.attackSpeedBonus;
          if (e.cdReduction) this._cdReduction = Math.min(0.5, this._cdReduction + e.cdReduction);
          return;
        }
      }
    }
  }

  addXp(amount) {
    this.xp += Math.floor(amount * this.xpMult);
    const levelsGained = [];
    while (this.xp >= this.xpToLevel && this.level < C.LEVEL_CAP) {
      this.xp -= this.xpToLevel;
      this.level++;
      this.xpToLevel = C.XP_BASE + C.XP_PER_LEVEL * (this.level - 1);
      // Class growth per level
      this._applyClassGrowth();
      this.maxHp += C.HP_PER_LEVEL;
      // FULL HEAL on level up!
      this.hp = this.maxHp;
      levelsGained.push(this.level);
    }
    if (this.level >= C.LEVEL_CAP && this.xp >= this.xpToLevel) {
      this.xp = 0;
      this.hp = this.maxHp; // full heal at cap too
      this.gold += 5;
    }
    return levelsGained;
  }

  /** Get attack info for the current swing */
  getAttackInfo(targetIsBoss = false) {
    const crit = Math.random() < this.critChance;
    let dmg = this.baseDmg;
    if (crit) dmg = Math.floor(dmg * this.critMult);

    // Wukong tempo combo: consecutive hits increase staff reach & damage!
    let isWukongSlam = false;
    if (this.classId === 'wukong') {
      const nextTempo = Math.min(5, (this.wukongTempo || 0) + 1);
      if (nextTempo >= 5) {
        isWukongSlam = true;
        dmg = Math.floor(dmg * (this.classPassive?.effect?.finisherMult || 2.5));
      } else {
        dmg = Math.floor(dmg * (1 + nextTempo * 0.12));
      }
    }

    // Dracula low HP bonus: under 50% HP deals +25% damage and active lifesteal
    if (this.classId === 'dracula') {
      const missingHpRatio = Math.max(0, 1 - (this.hp / this.maxHp));
      this._lifestealBonus = Math.max(0.15, missingHpRatio * 0.45);
      if (this.hp < this.maxHp * 0.5) {
        dmg = Math.floor(dmg * 1.25);
      }
    }

    // Boss damage bonus
    if (targetIsBoss) {
      let bBonus = this.classPassive?.effect?.bossDmgBonus || 0;
      for (const s of this.classSkills || []) {
        if (s.effect?.bossDmgBonus) bBonus += s.effect.bossDmgBonus;
      }
      if (bBonus > 0) dmg = Math.floor(dmg * (1 + bBonus));
    }

    // Assassin post-dash damage bonus (+30% within 2s after dash)
    if (this.postDashTimer > 0 && this.classPassive?.effect?.postDashDmgBonus) {
      dmg = Math.floor(dmg * (1 + this.classPassive.effect.postDashDmgBonus));
    }

    // Class specific attack parameters
    let range = 28;
    let arc = Math.PI * 0.55;
    let knockback = C.PLAYER_HIT_KNOCKBACK;
    let attackType = 'standard_melee';
    let projectileCount = 0;
    let attackColor = '#ffd700';

    if (this.classId === 'warrior') {
      range = 52;
      arc = Math.PI * 0.75; // 135° broad cleave
      knockback = 65;
      attackType = 'heavy_cleave';
      attackColor = '#ef4444';
      if (this.hp < this.maxHp * 0.5) {
        dmg = Math.floor(dmg * 1.25); // Berserk damage bonus
      }
    } else if (this.classId === 'mage') {
      range = 160;
      arc = Math.PI * 0.35;
      knockback = 14;
      attackType = 'magic_missiles';
      projectileCount = 3 + (this._extraProjectiles || 0);
      attackColor = '#60a5fa';
    } else if (this.classId === 'ranger') {
      range = 220;
      arc = Math.PI * 0.15;
      knockback = 22;
      attackType = 'pierce_arrows';
      projectileCount = 2 + (this._extraProjectiles || 0);
      attackColor = '#4ade80';
    } else if (this.classId === 'assassin') {
      range = 36;
      arc = Math.PI * 0.45;
      knockback = 18;
      attackType = 'shadow_daggers';
      attackColor = '#c084fc';
    } else if (this.classId === 'paladin') {
      range = 48;
      arc = Math.PI * 0.65;
      knockback = 45;
      attackType = 'holy_smite';
      attackColor = '#fde047';
    } else if (this.classId === 'necromancer') {
      range = 85;
      arc = Math.PI * 0.4;
      knockback = -15; // Pull towards player
      attackType = 'soul_siphon';
      attackColor = '#f43f5e';
    } else if (this.classId === 'alice') {
      if (this.aliceForm === 'giant') {
        range = 75;
        arc = Math.PI * 0.90; // broad sweeping stomp
        knockback = 95;
        attackType = 'giant_stomp';
        attackColor = '#f472b6';
        dmg = Math.floor(dmg * 1.4);
      } else {
        range = 44;
        arc = Math.PI * 0.35; // swift needle thrust
        knockback = 18;
        attackType = 'needle_thrust';
        attackColor = '#38bdf8';
      }
    } else if (this.classId === 'wukong') {
      if (isWukongSlam) {
        range = 80;
        arc = Math.PI * 2.0; // 360° celestial slam
        knockback = 110;
        attackType = 'celestial_slam';
        attackColor = '#f59e0b';
      } else {
        range = 46 + (this.wukongTempo || 0) * 8;
        arc = Math.PI * 0.70;
        knockback = 45 + (this.wukongTempo || 0) * 8;
        attackType = 'ruyi_staff';
        attackColor = '#eab308';
      }
    } else if (this.classId === 'dracula') {
      range = 42;
      arc = Math.PI * 0.55;
      knockback = 28;
      attackType = 'vampire_claws';
      attackColor = '#dc2626';
    } else if (this.classId === 'piper') {
      range = 210;
      arc = Math.PI * 0.18;
      knockback = 18;
      attackType = 'flute_notes';
      projectileCount = 1;
      attackColor = '#c084fc';
    }

    return {
      damage: dmg,
      crit,
      angle: this.aimAngle,
      range,
      arc,
      knockback,
      attackType,
      projectileCount,
      attackColor,
      isComboFinisher: Boolean(isWukongSlam),
    };
  }

  draw(ctx) {
    if (this.spawnProtection > 0 && !this.isDead) {
      ctx.save();
      ctx.strokeStyle = 'rgba(144, 238, 183, 0.8)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(this.x, this.y - 9, 18, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }
    // Red hurt aura and flash when in i-frames
    if (this.iframeTimer > 0 && !this.isDead) {
      ctx.save();
      ctx.fillStyle = 'rgba(255, 60, 60, 0.45)';
      ctx.beginPath();
      ctx.arc(this.x, this.y, 20, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      if (Math.floor(this.iframeTimer * 20) % 2 === 0) {
        ctx.globalAlpha = 0.5;
      }
    }

    // Dash trail effect (Invulnerable dodge indicator with class-specific colors)
    if (this.isDashing) {
      ctx.save();
      const trailColor = this.classColor || '#38bdf8';
      // Ghost after-images
      ctx.globalAlpha = 0.45;
      ctx.fillStyle = trailColor;
      ctx.fillRect(
        Math.floor(this.x - this.drawW / 2 - this.dashDirX * 14),
        Math.floor(this.y - this.drawH / 2 + 4 - this.dashDirY * 14),
        this.drawW, this.drawH - 4
      );
      ctx.globalAlpha = 0.25;
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(
        Math.floor(this.x - this.drawW / 2 - this.dashDirX * 24),
        Math.floor(this.y - this.drawH / 2 + 4 - this.dashDirY * 24),
        this.drawW, this.drawH - 4
      );
      // Wind speedlines around player
      ctx.strokeStyle = trailColor;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(this.x - this.dashDirX * 18, this.y - 10 - this.dashDirY * 18);
      ctx.lineTo(this.x + this.dashDirX * 12, this.y - 10 + this.dashDirY * 12);
      ctx.stroke();
      ctx.restore();
    }

    // Contrast rim / hero silhouette glow
    ctx.save();
    ctx.fillStyle = 'rgba(255, 245, 200, 0.22)';
    ctx.beginPath();
    ctx.arc(this.x, this.y - 12, 14, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Draw sprite or Bat Swarm form
    if (this.draculaBatSwarmTimer > 0) {
      ctx.save();
      const time = Date.now() / 120;
      for (let i = 0; i < 7; i++) {
        const angle = time + (i * Math.PI * 2 / 7);
        const r = 14 + Math.sin(time * 2 + i) * 6;
        const bx = this.x + Math.cos(angle) * r;
        const by = this.y - 12 + Math.sin(angle) * (r * 0.6);
        ctx.fillStyle = i % 2 === 0 ? '#dc2626' : '#881337';
        ctx.beginPath();
        ctx.ellipse(bx, by, 5, 2.5, angle, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#fca5a5';
        ctx.fillRect(bx - 1, by - 1, 2, 2);
      }
      ctx.restore();
    } else {
      const drawX = Math.floor(this.x - this.drawW / 2);
      const drawY = Math.floor(this.y - 28);
      this.animator.draw(ctx, drawX, drawY, this.drawW, this.drawH);
    }

    ctx.globalAlpha = 1;

    // Overhead Hero Beacon (Dấu hiệu nhận diện nhân vật theo hệ phái)
    if (!this.isDead) {
      const hoverOffset = Math.sin(Date.now() / 200) * 1.8;
      const hy = this.y - 34 + hoverOffset;
      const beaconColor = this.classColor || '#fbbf24';
      ctx.save();
      // Glowing aura for marker
      ctx.fillStyle = beaconColor + '55'; // 33% alpha
      ctx.beginPath();
      ctx.arc(this.x, hy + 2, 7, 0, Math.PI * 2);
      ctx.fill();
      // Class chevron marker
      ctx.fillStyle = beaconColor;
      ctx.beginPath();
      ctx.moveTo(this.x, hy + 4);
      ctx.lineTo(this.x - 3.5, hy);
      ctx.lineTo(this.x + 3.5, hy);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 0.8;
      ctx.stroke();

      // Wukong Tempo combo indicator
      if (this.classId === 'wukong' && this.wukongTempo > 0) {
        ctx.fillStyle = '#fef08a';
        ctx.font = 'bold 7px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(`x${this.wukongTempo}`, this.x, hy - 4);
      }
      ctx.restore();
    }

    // Dynamic Attack Visual Slash / Blast / Arc (Distinct for every class!)
    if (this.attackVisualTimer > 0) {
      const slashAlpha = Math.max(0, this.attackVisualTimer / 0.16);
      const angle = this.lastAttackAngle;
      const classId = this.classId;

      ctx.save();
      ctx.translate(Math.floor(this.x), Math.floor(this.y));
      ctx.rotate(angle);

      if (classId === 'warrior') {
        // Giant Greatsword Cleave (135° sweep, blood-red)
        const sweepRange = 48;
        ctx.globalAlpha = 0.45 * slashAlpha;
        ctx.fillStyle = '#ef4444';
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.arc(0, 0, sweepRange, -Math.PI * 0.38, Math.PI * 0.38);
        ctx.closePath();
        ctx.fill();

        ctx.globalAlpha = 0.9 * slashAlpha;
        ctx.strokeStyle = '#fca5a5';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.arc(0, 0, sweepRange - 1, -Math.PI * 0.36, Math.PI * 0.36);
        ctx.stroke();
      } else if (classId === 'mage') {
        // Arcane Casting Starburst & Concentrated Blast Ring
        ctx.globalAlpha = 0.8 * slashAlpha;
        ctx.strokeStyle = '#60a5fa';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(28, 0, 16 * (1 - slashAlpha * 0.5), 0, Math.PI * 2);
        ctx.stroke();
        ctx.fillStyle = '#93c5fd';
        ctx.beginPath();
        ctx.arc(28, 0, 8 * (1 - slashAlpha * 0.5), 0, Math.PI * 2);
        ctx.fill();
      } else if (classId === 'ranger') {
        // Wind Gale Arrow Beam
        ctx.globalAlpha = 0.9 * slashAlpha;
        ctx.strokeStyle = '#4ade80';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(8, 0);
        ctx.lineTo(60, 0);
        ctx.stroke();
        // Speed chevron
        ctx.strokeStyle = '#bbf7d0';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(50, -6);
        ctx.lineTo(60, 0);
        ctx.lineTo(50, 6);
        ctx.stroke();
      } else if (classId === 'assassin') {
        // Twin Crossed Shadow Daggers (Dual X-Slash)
        ctx.globalAlpha = 0.85 * slashAlpha;
        ctx.strokeStyle = '#c084fc';
        ctx.lineWidth = 2;
        // Slash 1: top-left to bottom-right
        ctx.beginPath();
        ctx.arc(10, 0, 28, -Math.PI * 0.28, Math.PI * 0.15);
        ctx.stroke();
        // Slash 2: bottom-left to top-right
        ctx.strokeStyle = '#e9d5ff';
        ctx.beginPath();
        ctx.arc(10, 0, 28, -Math.PI * 0.15, Math.PI * 0.28);
        ctx.stroke();
      } else if (classId === 'paladin') {
        // Radiant Holy Hammer Shockwave & Light Rays
        const sweepRange = 42;
        ctx.globalAlpha = 0.5 * slashAlpha;
        ctx.fillStyle = '#fde047';
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.arc(0, 0, sweepRange, -Math.PI * 0.32, Math.PI * 0.32);
        ctx.closePath();
        ctx.fill();

        ctx.globalAlpha = 0.9 * slashAlpha;
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.arc(0, 0, sweepRange - 1, -Math.PI * 0.3, Math.PI * 0.3);
        ctx.stroke();
      } else if (classId === 'necromancer') {
        // Crimson Blood Siphon Whip Tendril
        ctx.globalAlpha = 0.85 * slashAlpha;
        ctx.strokeStyle = '#f43f5e';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(5, 0);
        ctx.quadraticCurveTo(35, Math.sin(Date.now() / 50) * 12, 65, 0);
        ctx.stroke();
      } else if (classId === 'alice') {
        if (this.aliceForm === 'giant') {
          // Alice Giant Stomp / Shockwave Slam
          const stompR = 64;
          ctx.globalAlpha = 0.45 * slashAlpha;
          ctx.fillStyle = '#f472b6';
          ctx.beginPath();
          ctx.moveTo(0, 0);
          ctx.arc(0, 0, stompR, -Math.PI * 0.45, Math.PI * 0.45);
          ctx.closePath();
          ctx.fill();

          ctx.globalAlpha = 0.9 * slashAlpha;
          ctx.strokeStyle = '#fda4af';
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.arc(0, 0, stompR - 2, -Math.PI * 0.42, Math.PI * 0.42);
          ctx.stroke();
        } else {
          // Alice Vorpal Needle Piercing Thrust
          ctx.globalAlpha = 0.9 * slashAlpha;
          ctx.strokeStyle = '#38bdf8';
          ctx.lineWidth = 2.5;
          ctx.beginPath();
          ctx.moveTo(6, 0);
          ctx.lineTo(46, 0);
          ctx.stroke();
          // Sparkling needle tip
          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          ctx.arc(46, 0, 3, 0, Math.PI * 2);
          ctx.fill();
        }
      } else if (classId === 'wukong') {
        // Tôn Ngộ Không Ruyi Golden Staff Strike
        if (this.wukongTempo >= 5) {
          // 360° Celestial Whirlwind Slam
          const slamR = 62;
          ctx.globalAlpha = 0.55 * slashAlpha;
          ctx.fillStyle = '#f59e0b';
          ctx.beginPath();
          ctx.arc(0, 0, slamR, 0, Math.PI * 2);
          ctx.fill();

          ctx.globalAlpha = 0.95 * slashAlpha;
          ctx.strokeStyle = '#fef08a';
          ctx.lineWidth = 3.5;
          ctx.beginPath();
          ctx.arc(0, 0, slamR - 2, 0, Math.PI * 2);
          ctx.stroke();
        } else {
          // Extended Golden Staff Arc
          const reach = 42 + (this.wukongTempo || 0) * 8;
          ctx.globalAlpha = 0.85 * slashAlpha;
          ctx.strokeStyle = '#eab308';
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.moveTo(8, 0);
          ctx.lineTo(reach, 0);
          ctx.stroke();

          // Golden staff glowing tip
          ctx.fillStyle = '#fef08a';
          ctx.fillRect(reach - 6, -3, 8, 6);
        }
      } else if (classId === 'dracula') {
        // Dracula Crimson Triple Vampire Claws
        ctx.globalAlpha = 0.85 * slashAlpha;
        ctx.strokeStyle = '#dc2626';
        ctx.lineWidth = 2.5;
        for (let i = -1; i <= 1; i++) {
          ctx.beginPath();
          ctx.arc(10, i * 6, 28, -Math.PI * 0.22, Math.PI * 0.22);
          ctx.stroke();
        }
        // Crimson blood glint
        ctx.fillStyle = '#fca5a5';
        ctx.beginPath();
        ctx.arc(32, 0, 2.5, 0, Math.PI * 2);
        ctx.fill();
      } else if (classId === 'piper') {
        // Pied Piper Concentric Flute Acoustic Wave Pulses
        ctx.globalAlpha = 0.8 * slashAlpha;
        ctx.strokeStyle = '#c084fc';
        ctx.lineWidth = 2;
        for (let i = 1; i <= 3; i++) {
          ctx.beginPath();
          ctx.arc(0, 0, i * 22, -Math.PI * 0.22, Math.PI * 0.22);
          ctx.stroke();
        }
        // Sonic notes
        ctx.fillStyle = '#e9d5ff';
        ctx.beginPath();
        ctx.arc(45, -8, 2.5, 0, Math.PI * 2);
        ctx.arc(58, 6, 2.5, 0, Math.PI * 2);
        ctx.fill();
      } else {
        // Default Weapon Arc
        const art = this.artifacts[0];
        let bladeColor = '#ffd700';
        let edgeColor = '#ffffff';
        if (art?.id?.includes('fire')) { bladeColor = '#ff6622'; edgeColor = '#fef08a'; }
        else if (art?.id?.includes('frost')) { bladeColor = '#38bdf8'; edgeColor = '#e0f2fe'; }
        else if (art?.id?.includes('thunder')) { bladeColor = '#fde047'; edgeColor = '#ffffff'; }
        else if (art?.id?.includes('blood')) { bladeColor = '#ef4444'; edgeColor = '#fca5a5'; }
        else if (art?.id?.includes('bow')) { bladeColor = '#6ee7b7'; edgeColor = '#fef08a'; }
        else if (art?.id?.includes('void')) { bladeColor = '#c084fc'; edgeColor = '#f3e8ff'; }

        const sweepRange = 32;
        ctx.globalAlpha = 0.35 * slashAlpha;
        ctx.fillStyle = bladeColor;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.arc(0, 0, sweepRange, -Math.PI * 0.3, Math.PI * 0.3);
        ctx.closePath();
        ctx.fill();

        ctx.globalAlpha = 0.85 * slashAlpha;
        ctx.strokeStyle = edgeColor;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(0, 0, sweepRange - 1, -Math.PI * 0.28, Math.PI * 0.28);
        ctx.stroke();
      }

      ctx.restore();
    }
  }

  drawShadow(ctx) {
    const classId = this.classId;
    const t = Date.now() / 1000;

    // Distinct Class Ground Signatures / Auras
    if (classId === 'warrior') {
      ctx.save();
      ctx.strokeStyle = 'rgba(239, 68, 68, 0.75)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.ellipse(this.x, this.y + 2, 16, 7, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = 'rgba(239, 68, 68, 0.2)';
      ctx.fill();
      ctx.restore();
    } else if (classId === 'mage') {
      ctx.save();
      ctx.strokeStyle = 'rgba(59, 130, 246, 0.8)';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.ellipse(this.x, this.y + 2, 15, 6, 0, 0, Math.PI * 2);
      ctx.stroke();
      for (let i = 0; i < 3; i++) {
        const ang = t * 2.5 + (i * Math.PI * 2) / 3;
        const ox = this.x + Math.cos(ang) * 15;
        const oy = this.y + 2 + Math.sin(ang) * 6;
        ctx.fillStyle = '#60a5fa';
        ctx.beginPath();
        ctx.arc(ox, oy, 1.8, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    } else if (classId === 'ranger') {
      ctx.save();
      ctx.strokeStyle = 'rgba(34, 197, 94, 0.75)';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.ellipse(this.x, this.y + 2, 15, 6, t * 1.5, 0, Math.PI * 1.6);
      ctx.stroke();
      ctx.fillStyle = 'rgba(34, 197, 94, 0.18)';
      ctx.fill();
      ctx.restore();
    } else if (classId === 'assassin') {
      ctx.save();
      ctx.fillStyle = 'rgba(168, 85, 247, 0.35)';
      ctx.beginPath();
      ctx.ellipse(this.x, this.y + 2, 16, 6.5, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = 'rgba(192, 132, 252, 0.6)';
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.restore();
    } else if (classId === 'paladin') {
      ctx.save();
      ctx.fillStyle = 'rgba(234, 179, 8, 0.28)';
      ctx.beginPath();
      ctx.ellipse(this.x, this.y + 2, 17, 7, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = 'rgba(254, 240, 138, 0.85)';
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.restore();
    } else if (classId === 'necromancer') {
      ctx.save();
      ctx.fillStyle = 'rgba(244, 63, 94, 0.25)';
      ctx.beginPath();
      ctx.ellipse(this.x, this.y + 2, 15, 6, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = 'rgba(99, 102, 241, 0.8)';
      ctx.lineWidth = 1.2;
      ctx.stroke();
      ctx.restore();
    } else if (classId === 'son_tinh') {
      ctx.save();
      ctx.fillStyle = 'rgba(120, 113, 108, 0.4)';
      ctx.beginPath();
      ctx.ellipse(this.x, this.y + 2, 18, 7.5, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = 'rgba(214, 211, 209, 0.7)';
      ctx.lineWidth = 1.8;
      ctx.stroke();
      ctx.restore();
    } else if (classId === 'thach_sanh') {
      ctx.save();
      ctx.fillStyle = 'rgba(249, 115, 22, 0.3)';
      ctx.beginPath();
      ctx.ellipse(this.x, this.y + 2, 16, 6.5, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = 'rgba(251, 146, 60, 0.9)';
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.restore();
    } else if (classId === 'tien_nu') {
      ctx.save();
      ctx.fillStyle = 'rgba(236, 72, 153, 0.35)';
      ctx.beginPath();
      ctx.ellipse(this.x, this.y + 2, 16, 7, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = 'rgba(244, 114, 182, 0.8)';
      ctx.lineWidth = 1.2;
      ctx.stroke();
      ctx.restore();
    } else if (classId === 'coc_tinh') {
      ctx.save();
      ctx.fillStyle = 'rgba(16, 185, 129, 0.35)';
      ctx.beginPath();
      ctx.ellipse(this.x, this.y + 2, 16, 6.5, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = 'rgba(52, 211, 153, 0.8)';
      ctx.lineWidth = 1.2;
      ctx.stroke();
      ctx.restore();
    } else {
      // Default hero ground spotlight
      const glow = ctx.createRadialGradient(this.x, this.y + 1, 2, this.x, this.y + 1, 18);
      glow.addColorStop(0, 'rgba(251, 191, 36, 0.42)');
      glow.addColorStop(0.6, 'rgba(245, 158, 11, 0.16)');
      glow.addColorStop(1, 'rgba(245, 158, 11, 0)');
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(this.x, this.y + 1, 18, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = 'rgba(254, 240, 138, 0.65)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.ellipse(this.x, this.y + 2, 13, 5, 0, 0, Math.PI * 2);
      ctx.stroke();
    }

    // Crisp ground contact shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
    ctx.beginPath();
    ctx.ellipse(this.x, this.y + 2, 10, 4, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  /** Initialize upgrade stats tracker */
  initUpgradeStats() {
    this._upgradeStats = {
      maxHp: 0, baseDmg: 0, attackCd: 0, moveSpeed: 0,
      critChance: 0, critMult: 0, dashCd: 0, pickupRange: 0,
      regen: 0, armor: 0, xpMult: 0,
    };
  }

  applyUpgrade(upgrade) {
    if (!this._upgradeStats) this.initUpgradeStats();
    const e = upgrade.statChanges || upgrade.effect || {};
    const t = upgrade.tradeOff || {};
    if (e.maxHp) {
      this._upgradeStats.maxHp = (this._upgradeStats.maxHp || 0) + e.maxHp;
      this.maxHp += e.maxHp;
      this.hp += e.maxHp;
    }
    if (e.baseDmg) { this._upgradeStats.baseDmg = (this._upgradeStats.baseDmg || 0) + e.baseDmg; this.baseDmg += e.baseDmg; }
    if (e.attackCd) { this._upgradeStats.attackCd = (this._upgradeStats.attackCd || 0) + e.attackCd; this.attackCd = Math.max(0.15, this.attackCd + e.attackCd); }
    if (e.moveSpeed) { this._upgradeStats.moveSpeed = (this._upgradeStats.moveSpeed || 0) + e.moveSpeed; this.speed += e.moveSpeed; }
    if (e.critChance) { this._upgradeStats.critChance = (this._upgradeStats.critChance || 0) + e.critChance; this.critChance = Math.min(0.5, this.critChance + e.critChance); }
    if (e.critMult) { this._upgradeStats.critMult = (this._upgradeStats.critMult || 0) + e.critMult; this.critMult += e.critMult; }
    if (e.dashCd) { this._upgradeStats.dashCd = (this._upgradeStats.dashCd || 0) + e.dashCd; this.dashCd = Math.max(0.5, this.dashCd + e.dashCd); }
    if (e.pickupRange) { this._upgradeStats.pickupRange = (this._upgradeStats.pickupRange || 0) + e.pickupRange; this.pickupRange += e.pickupRange; }
    if (e.regen) { this._upgradeStats.regen = (this._upgradeStats.regen || 0) + e.regen; this.regen += e.regen; }
    if (e.armor) { this._upgradeStats.armor = (this._upgradeStats.armor || 0) + e.armor; this.armor += e.armor; }
    if (e.xpMult) { this._upgradeStats.xpMult = (this._upgradeStats.xpMult || 0) + e.xpMult; this.xpMult += e.xpMult; }
    if (e.healPercent) { this.heal(Math.floor(this.maxHp * e.healPercent)); }

    // Trade-offs from class upgrades
    if (t.moveSpeed) { this._upgradeStats.moveSpeed = (this._upgradeStats.moveSpeed || 0) + t.moveSpeed; this.speed = Math.max(40, this.speed + t.moveSpeed); }
    if (t.armor) { this._upgradeStats.armor = (this._upgradeStats.armor || 0) + t.armor; this.armor = Math.max(0, this.armor + t.armor); }
    if (t.maxHp) { this._upgradeStats.maxHp = (this._upgradeStats.maxHp || 0) + t.maxHp; this.maxHp = Math.max(20, this.maxHp + t.maxHp); this.hp = Math.min(this.hp, this.maxHp); }
  }

  /** Serialize for save checkpoint */
  serialize() {
    return {
      x: this.x, y: this.y, hp: this.hp, maxHp: this.maxHp,
      level: this.level, xp: this.xp, xpToLevel: this.xpToLevel,
      baseDmg: this.baseDmg, attackCd: this.attackCd,
      critChance: this.critChance, critMult: this.critMult,
      speed: this.speed, dashCd: this.dashCd,
      pickupRange: this.pickupRange, armor: this.armor,
      regen: this.regen, xpMult: this.xpMult,
      gold: this.gold, rerolls: this.rerolls,
      artifacts: this.artifacts,
      charms: this.charms,
      _upgradeStats: this._upgradeStats,
      _metaBonuses: this._metaBonuses,
      classId: this.classId,
      classSkills: this.classSkills,
    };
  }

  /** Restore from save */
  deserialize(data) {
    Object.assign(this, data);
  }
}
