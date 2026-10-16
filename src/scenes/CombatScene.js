// ============================================================
// CombatScene — the main gameplay scene
// Unified kill flow: _onEnemyKilled handles XP/gold/orbs/particles once.
// Every enemy death path funnels through _onEnemyKilled.
// ============================================================
import * as C from '../engine/Constants.js';
import { Camera } from '../engine/Camera.js';
import { MapRenderer } from '../engine/MapRenderer.js';
import { HUD } from '../engine/HUD.js';
import { ParticleSystem } from '../engine/Particles.js';
import { Enemy } from '../entities/Enemy.js';
import { Boss } from '../entities/Boss.js';
import { Projectile, VoidZone } from '../entities/Projectile.js';
import { CHAPTERS, ARTIFACTS, ENEMIES } from '../data/GameData.js';
import { circleHitsEntity, segmentHitsEntity } from '../engine/Hitboxes.js';
import { UI_FONT } from '../engine/UIHelper.js';

function distToSegment(p, v, w) {
  const l2 = (v.x - w.x) * (v.x - w.x) + (v.y - w.y) * (v.y - w.y);
  if (l2 === 0) return Math.hypot(p.x - v.x, p.y - v.y);
  let t = ((p.x - v.x) * (w.x - v.x) + (p.y - v.y) * (w.y - v.y)) / l2;
  t = Math.max(0, Math.min(1, t));
  return Math.hypot(p.x - (v.x + t * (w.x - v.x)), p.y - (v.y + t * (w.y - v.y)));
}

export class CombatScene {
  constructor(game) {
    this.game = game;
    this.map = new MapRenderer(game.assets);
    this.camera = new Camera();
    this.hud = new HUD(game.assets);
    this.particles = new ParticleSystem();
    this.camera.enabled = game.meta?.settings?.screenShake !== false;
    // State
    this.player = null;
    this.enemies = [];
    this.boss = null;
    this.projectiles = [];
    this.xpOrbs = [];
    this.chests = [];
    this.seals = [];
    this.voidZones = [];
    this.gate = null;
    this.gateOpen = false;
    this.objectiveComplete = false;
    this.combatActive = true;
    this.stageIndex = 0;
    this.chapterIndex = 0;
    this.stageDef = null;
    this.stageGold = 0;
    this.stageAsh = 0;
    this.curseTime = 0;
    this.hpScale = 1;
    this.dmgScale = 1;
    this.spawnScale = 1;
    this.spawnTimer = 0;
    this.wavesRemaining = 0;
    this.surviveTimer = 0;
    this.holdZones = [];
    this.holdProgress = [];
    this.holdTarget = 10;
    this.eliteHuntCount = 0;
    this.eliteHuntTarget = 3;
    this.pendingLevelUps = [];
    this._stageCompletePending = false;
    this._deathSettled = false;
    this.hitDirectionTimer = 0;
    this.hitDirectionAngle = null;
    this.playerHitVignette = 0;
    this.isGreedHarvest = false;
    this.greedTimer = 0;
    this.controlsGuideExpanded = true;
    this.controlsGuideTimer = 8.0;
  }

  startStage(player, stageIdx, seed) {
    this.player = player;
    this.stageIndex = stageIdx;
    this.chapterIndex = Math.floor(stageIdx / C.STAGES_PER_CHAPTER);
    const chapter = CHAPTERS[this.chapterIndex];
    if (!chapter) return;
    const localIdx = stageIdx % C.STAGES_PER_CHAPTER;
    this.stageDef = chapter.stages[localIdx];
    if (!this.stageDef) return;

    // Curse scaling
    const s = stageIdx;
    const t = Math.floor(this.curseTime / 60);
    this.hpScale = 1 + C.CURSE_HP_STAGE * s + C.CURSE_HP_TIME * t;
    this.dmgScale = 1 + C.CURSE_DMG_STAGE * s + C.CURSE_DMG_TIME * t;
    this.spawnScale = Math.min(C.CURSE_SPAWN_CAP, 1 + C.CURSE_SPAWN_TIME * t);

    // Map
    const bg = chapter.background || 'fields';
    this.map.setupArena(bg, this.stageDef.type, seed);
    const startPos = this.map.getPlayerStart();
    player.x = startPos.x;
    player.y = startPos.y;
    player.spawnProtection = 1.5;

    // Reset
    this.enemies = [];
    this.boss = null;
    this.projectiles = [];
    this.xpOrbs = [];
    this.chests = [];
    this.seals = [];
    this.voidZones = [];
    this.objectiveComplete = false;
    this.gateOpen = false;
    this.combatActive = true;
    this.stageGold = 0;
    this.stageAsh = 0;
    this.spawnTimer = 0;
    if (!this.pendingLevelUps) this.pendingLevelUps = [];
    this._stageCompletePending = false;
    this._deathSettled = false;
    this.isGreedHarvest = false;
    this.greedTimer = 0;
    this.controlsGuideExpanded = true;
    this.controlsGuideTimer = 8.0;
    this.hitDirectionTimer = 0;
    this.playerHitVignette = 0;
    this.introBannerTimer = 3.5;
    this.waveTransitionTimer = 0;
    this.waveTransitionMsg = '';
    this.spawnTelegraphs = [];
    this.stuckWaveWatchdog = 0;
    this.allies = [];
    this.sanctuaryZones = [];

    // Gate
    const gatePos = this.map.getGatePosition();
    this.gate = { x: gatePos.x, y: gatePos.y, radius: 14 };

    // Objective setup (unified fields: duration, targets, zones, holdTime)
    switch (this.stageDef.type) {
      case 'clear':
        this.wavesRemaining = this.stageDef.waves || 3;
        this._spawnWave();
        break;
      case 'survive':
        this.surviveTimer = this.stageDef.duration || this.stageDef.time || 60;
        this._spawnWave();
        break;
      case 'destroy': {
        const sealPositions = this.map.getSealPositions();
        const targetCount = this.stageDef.targets || this.stageDef.sealCount || 2;
        this.seals = sealPositions.slice(0, targetCount).map(p => ({
          x: p.x, y: p.y, hp: 3, maxHp: 3,
        }));
        // Fallback if template has fewer seal positions than required
        while (this.seals.length < targetCount) {
          const arena = this.map.getArenaPixelSize();
          const fallbackX = 60 + (this.seals.length * 140) % (arena.w - 120);
          const fallbackY = 60 + (this.seals.length * 70) % (arena.h - 120);
          this.seals.push({ x: fallbackX, y: fallbackY, hp: 3, maxHp: 3 });
        }
        this._spawnWave();
        break;
      }
      case 'hold': {
        const zones = this.map.getHoldZones();
        const zoneCount = this.stageDef.zones || this.stageDef.zoneCount || 2;
        this.holdZones = zones.slice(0, zoneCount);
        while (this.holdZones.length < zoneCount) {
          const arena = this.map.getArenaPixelSize();
          this.holdZones.push({
            x: 80 + this.holdZones.length * 160,
            y: 80,
            w: 128,
            h: 128,
          });
        }
        this.holdProgress = this.holdZones.map(() => 0);
        this.holdTarget = this.stageDef.holdTime || 15;
        this._spawnWave();
        break;
      }
      case 'hunt':
        this.eliteHuntCount = 0;
        this.eliteHuntTarget = this.stageDef.targets || this.stageDef.eliteCount || 3;
        this._spawnWave();
        break;
      case 'boss':
        this._spawnBoss();
        break;
    }

    // BGM
    if (this.stageDef.type === 'boss') {
      this.game.audio.playBgm(this.game.assets.getAudio('bgm_boss'), 'bgm_boss');
    } else {
      this.game.audio.playBgm(this.game.assets.getAudio('bgm_combat'), 'bgm_combat');
    }
  }

  _spawnBoss() {
    const bossId = this.stageDef.bossId;
    if (!bossId) return;
    const arena = this.map.getArenaPixelSize();
    this.boss = new Boss(this.game.assets, bossId, arena.w * 0.75, arena.h / 2, this.hpScale);
  }

  _spawnWave() {
    const types = this.stageDef.enemies || ['orc_infantry'];
    const zones = this.map.getSpawnZones();
    let baseCount = this.stageDef.baseEnemies || this.stageDef.count || 8;
    // Stage 1 Wave 1 should gently introduce with 3-4 enemies
    if (this.stageIndex === 0) {
      const totalWaves = this.stageDef.waves || 3;
      if (this.wavesRemaining === totalWaves) {
        baseCount = 3;
      } else {
        baseCount = Math.min(5, 3 + (totalWaves - this.wavesRemaining));
      }
    }
    const count = Math.max(3, Math.floor(baseCount * this.spawnScale));
    const eliteChance = this.stageDef.eliteChance || 0.05;
    const MIN_ENEMY_SPAWN_DIST = 26;

    for (let i = 0; i < count && this.enemies.length < C.MAX_ENEMIES; i++) {
      const type = types[Math.floor(Math.random() * types.length)];
      let bestX = 0, bestY = 0, foundValid = false;

      // Try up to 12 random positions to find one safe from player and not clumped with other enemies
      for (let attempt = 0; attempt < 12; attempt++) {
        const zone = zones[Math.floor(Math.random() * zones.length)];
        const ex = zone.x + Math.random() * zone.w;
        const ey = zone.y + Math.random() * zone.h;

        // Ensure spawn safe distance from player
        const pdx = this.player.x - ex;
        const pdy = this.player.y - ey;
        const pDist = Math.hypot(pdx, pdy);
        const safeDist = this.stageIndex === 0 ? 100 : C.SPAWN_SAFE_RADIUS;
        if (pDist < safeDist) continue;

        // Ensure not stacked or clumped with other enemies
        let tooClose = false;
        for (const other of this.enemies) {
          if (other.isDead) continue;
          const edx = other.x - ex;
          const edy = other.y - ey;
          if (Math.sqrt(edx * edx + edy * edy) < MIN_ENEMY_SPAWN_DIST) {
            tooClose = true;
            break;
          }
        }
        if (tooClose && attempt < 10) continue;

        bestX = ex;
        bestY = ey;
        foundValid = true;
        break;
      }

      if (!foundValid) continue;

      const e = new Enemy(this.game.assets, type, bestX, bestY, this.hpScale);
      if (Math.random() < eliteChance) {
        e.makeElite(Math.random() < 0.5 ? 'armored' : 'frenzied');
      }
      if (this.stageDef.type === 'hold' && this.holdZones.length > 0) {
        const guardZone = this.holdZones[Math.floor(Math.random() * this.holdZones.length)];
        e.guardPoint = { x: guardZone.x + guardZone.w / 2, y: guardZone.y + guardZone.h / 2 };
      }
      this.enemies.push(e);
    }
  }

  // ============================
  // UNIFIED KILL HANDLER
  // ============================
  _onEnemyKilled(enemy) {
    if (enemy._deathProcessed) return;
    enemy._deathProcessed = true;

    // XP orbs: normal drops 1 orb, elite drops 3 orbs. Total XP strictly matches enemy.xp!
    const orbCount = enemy.isElite ? 3 : 1;
    const basePerOrb = Math.floor(enemy.xp / orbCount);
    let remainder = enemy.xp % orbCount;
    for (let i = 0; i < orbCount; i++) {
      const orbXp = basePerOrb + (remainder > 0 ? 1 : 0);
      if (remainder > 0) remainder--;
      if (orbXp > 0) {
        this.xpOrbs.push({
          x: enemy.x + (Math.random() - 0.5) * 10,
          y: enemy.y + (Math.random() - 0.5) * 10,
          xp: orbXp,
        });
      }
    }
    // Gold
    this.stageGold += enemy.gold;
    this.player.gold += enemy.gold;
    // Particles
    this.particles.emit(enemy.x, enemy.y, 8, '#ff6644', 30, 0.6);
    // SFX
    this.game.audio.playSfx('hit');
    // Stats tracking
    if (this.game.meta?.stats) this.game.meta.stats.totalKills++;
    // Elite hunt tracking
    if (enemy.isElite && this.stageDef?.type === 'hunt') {
      this.eliteHuntCount++;
    }

    // Class kill passives & skills
    if (this.player.classPassive?.effect?.healOnKill) {
      this.player.heal(this.player.classPassive.effect.healOnKill);
    }
    if (this.player.classPassive?.effect?.healOnKillPercent) {
      this.player.heal(Math.ceil(this.player.maxHp * this.player.classPassive.effect.healOnKillPercent));
    }

    // Piper passive: Resonance Echo (Cộng Hưởng Âm Vang)
    if (this.player.classId === 'piper' && (enemy.charmed || this.player.classPassive?.effect?.resonanceEcho)) {
      const radius = 70 + (this.player.classSkills?.find(s => s.effect?.echoRadiusBonus)?.effect?.echoRadiusBonus || 0);
      const dmgMult = 0.30 + (this.player.classSkills?.find(s => s.effect?.echoDmgBonus)?.effect?.echoDmgBonus || 0);
      const echoDmg = Math.max(8, Math.floor(enemy.maxHp * dmgMult));
      this.particles.emit(enemy.x, enemy.y, 18, '#c084fc', 55, 0.45);
      this.camera.shake(3);
      for (const other of this.enemies) {
        if (other.isDead || other === enemy) continue;
        if (Math.hypot(other.x - enemy.x, other.y - enemy.y) <= radius) {
          const k = other.takeDamage(echoDmg);
          if (this.game.meta?.settings?.showDamageNumbers !== false) {
            this.particles.addNumber(other.x, other.y - 12, echoDmg, '#c084fc', true);
          }
          if (k) this._onEnemyKilled(other);
        }
      }
    }

    // Dracula on-kill blood restore
    if (this.player.classId === 'dracula') {
      this.player.heal(Math.ceil(this.player.maxHp * 0.03));
    }
    for (const skill of this.player.classSkills || []) {
      if (skill.effect?.healOnKill) {
        this.player.heal(skill.effect.healOnKill);
      }
      if (skill.effect?.deathExplosion) {
        this.particles.emit(enemy.x, enemy.y, 14, '#9333ea', 45, 0.4);
        for (const other of this.enemies) {
          if (other.isDead || other === enemy) continue;
          if (Math.hypot(other.x - enemy.x, other.y - enemy.y) < 40) {
            const k = other.takeDamage(10);
            if (k) this._onEnemyKilled(other);
          }
        }
      }
    }
    // Burn kill — explosion
    if (enemy.killedByBurn) {
      this.particles.emit(enemy.x, enemy.y, 15, '#ff4400', 40, 0.8);
      this.camera.shake(3, 0.1);
      // Check artifact for explode on burn kill
      for (const art of this.player.artifacts) {
        const def = ARTIFACTS[art.id];
        if (def?.onBurnKill) {
          const aoeRadius = def.onBurnKill.radius || 30;
          const aoeDmg = def.onBurnKill.dmg || 8;
          for (const other of this.enemies) {
            if (other.isDead || other === enemy) continue;
            const dx = other.x - enemy.x;
            const dy = other.y - enemy.y;
            if (Math.sqrt(dx * dx + dy * dy) < aoeRadius) {
              const killed = other.takeDamage(aoeDmg);
              if (killed) this._onEnemyKilled(other);
            }
          }
        }
      }
    }
  }

  _onBossKilled(boss) {
    if (boss._deathProcessed) return;
    boss._deathProcessed = true;
    this.stageGold += boss.gold;
    this.player.gold += boss.gold;
    const levels = this.player.addXp(C.XP_BOSS);
    this.pendingLevelUps.push(...levels);
    this.stageAsh += C.ASH_PER_BOSS;
    this.particles.emit(boss.x, boss.y, 30, C.COLOR_GOLD, 60, 1.0);
    this.camera.shake(10, 0.5);
    this.game.audio.playSfx('death');
    // Update bestStage (boss stage is the last of the chapter)
    const bossStage = this.stageIndex + 1;
    if (this.game.meta) {
      if (this.game.meta.stats) {
        this.game.meta.stats.bestStage = Math.max(this.game.meta.stats.bestStage || 0, bossStage);
      }
      // Boss log
      if (this.game.meta.unlocks?.bossLog && !this.game.meta.unlocks.bossLog.includes(boss.id)) {
        this.game.meta.unlocks.bossLog.push(boss.id);
      }
    }
    this.objectiveComplete = true;
    this.gateOpen = true;
    this.combatActive = false;
    this._showStageComplete();
  }

  update(dt, input) {
    if (this.player.isDead) {
      this.player.update(dt, input, this.map);
      if (this.player.deathTimer > 2 && (input.justPressed('Enter') || input.justPressed('Space') || input.mouseClicked())) {
        if (!this._deathSettled) {
          this._deathSettled = true;
          const totalAsh = (this.game.runState?.ashEarned || 0) + this.stageAsh;
          if (this.game.meta) {
            if (!this.game.meta.stats) this.game.meta.stats = {};
            this.game.meta.stats.totalDeaths = (this.game.meta.stats.totalDeaths || 0) + 1;
            this.game.meta.stats.bestStage = Math.max(this.game.meta.stats.bestStage || 0, this.stageIndex + 1);
            this.game.meta.ashSeeds = (this.game.meta.ashSeeds || 0) + totalAsh;
            this.game.saveManager?.clearCheckpoint?.(this.game.meta);
            this.game.saveManager?.save?.(this.game.meta);
          }
          if (this.game.runState) {
            this.game.runState.ashEarned = 0;
          }
          this.stageAsh = 0;
        }
        this.game.showGameOver('Bạn đã ngã xuống...', this.stageIndex + 1);
      }
      return;
    }
    // Pause
    if (input.justPressed('Escape')) {
      this.game.showPause();
      return;
    }
    // Level-up overlays (process every pending level up)
    if (this.pendingLevelUps.length > 0) {
      this.pendingLevelUps.shift();
      this.game.showUpgrade(this.player);
      return;
    }

    // Curse time
    this.curseTime += dt;

    // Check HUD action buttons (clickable Q & Space buttons)
    const mouse = input.getMousePos();
    const isMouseDown = input.isMouseDown();
    const skillBounds = this.hud.getSkillButtonBounds();
    const dashBounds = this.hud.getDashButtonBounds();
    const hoverSkill = mouse.x >= skillBounds.x && mouse.x <= skillBounds.x + skillBounds.w &&
                       mouse.y >= skillBounds.y && mouse.y <= skillBounds.y + skillBounds.h;
    const hoverDash = mouse.x >= dashBounds.x && mouse.x <= dashBounds.x + dashBounds.w &&
                      mouse.y >= dashBounds.y && mouse.y <= dashBounds.y + dashBounds.h;

    const overHUD = this.hud.isPointInHUD(mouse.x, mouse.y, this.player, this.controlsGuideExpanded);

    // Controls guide toggle (H key or clicking HUD buttons)
    if (input.justPressed('KeyH')) {
      this.controlsGuideExpanded = !this.controlsGuideExpanded;
      this.controlsGuideTimer = 0;
    }
    if (this.controlsGuideTimer > 0) {
      this.controlsGuideTimer -= dt;
      if (this.controlsGuideTimer <= 0) this.controlsGuideExpanded = false;
    }

    if (input.mouseClicked()) {
      if (hoverSkill) {
        this._useSkill();
      } else if (hoverDash) {
        this.player.triggerDash();
      } else {
        // Toggle controls guide if clicked button or close icon
        const guideBounds = this.hud.getControlsGuideButtonBounds(this.controlsGuideExpanded);
        if (this.controlsGuideExpanded) {
          if (mouse.x >= guideBounds.toggleX - 4 && mouse.x <= guideBounds.toggleX + guideBounds.toggleW + 4 &&
              mouse.y >= guideBounds.toggleY - 4 && mouse.y <= guideBounds.toggleY + guideBounds.toggleH + 4) {
            this.controlsGuideExpanded = false;
            this.controlsGuideTimer = 0;
          }
        } else {
          if (mouse.x >= guideBounds.x && mouse.x <= guideBounds.x + guideBounds.w &&
              mouse.y >= guideBounds.y && mouse.y <= guideBounds.y + guideBounds.h) {
            this.controlsGuideExpanded = true;
            this.controlsGuideTimer = 0;
          }
        }
      }
    }

    // Update player (suppress swing attack if clicking ANY HUD element)
    this.player.update(dt, input, this.map, { suppressAttack: overHUD, camera: this.camera });

    // Camera
    const arena = this.map.getArenaPixelSize();
    this.camera.follow(this.player.x, this.player.y, arena.w, arena.h);
    this.camera.update(dt);
    this.camera.enabled = this.game.meta?.settings?.screenShake !== false;

    // Timers
    if (this.hitDirectionTimer > 0) this.hitDirectionTimer -= dt;
    if (this.playerHitVignette > 0) this.playerHitVignette -= dt;

    // Intro & Wave transition banners
    if (this.introBannerTimer > 0) this.introBannerTimer -= dt;
    if (this.waveTransitionTimer > 0) {
      this.waveTransitionTimer -= dt;
      for (const st of this.spawnTelegraphs) {
        st.progress = Math.min(1, 1 - (this.waveTransitionTimer / 2.4));
      }
      if (this.waveTransitionTimer <= 0) {
        this._spawnWave();
        this.spawnTelegraphs = [];
        this.particles.emit(this.player.x, this.player.y, 10, '#38bdf8', 35, 0.4);
      }
    }

    // Sanctuary zones (Paladin)
    for (let i = this.sanctuaryZones.length - 1; i >= 0; i--) {
      const sz = this.sanctuaryZones[i];
      sz.duration -= dt;
      sz.tickTimer = (sz.tickTimer || 0) + dt;
      if (sz.tickTimer >= 0.5) {
        sz.tickTimer = 0;
        if (Math.hypot(this.player.x - sz.x, this.player.y - sz.y) <= sz.radius) {
          this.player.heal(3);
        }
        for (const e of this.enemies) {
          if (e.isDead) continue;
          if (Math.hypot(e.x - sz.x, e.y - sz.y) <= sz.radius) {
            const k = e.takeDamage(6);
            if (k) this._onEnemyKilled(e);
          }
        }
      }
      if (sz.duration <= 0) this.sanctuaryZones.splice(i, 1);
    }

    // Allies (Wukong shadow clones)
    for (let i = this.allies.length - 1; i >= 0; i--) {
      const ally = this.allies[i];
      ally.duration -= dt;
      ally.attackTimer = (ally.attackTimer || 0) - dt;
      let nearest = null;
      let nearDist = 180;
      for (const e of this.enemies) {
        if (e.isDead) continue;
        const d = Math.hypot(e.x - ally.x, e.y - ally.y);
        if (d < nearDist) {
          nearest = e;
          nearDist = d;
        }
      }
      if (nearest) {
        const angle = Math.atan2(nearest.y - ally.y, nearest.x - ally.x);
        ally.x += Math.cos(angle) * 110 * dt;
        ally.y += Math.sin(angle) * 110 * dt;
        if (nearDist < 30 && ally.attackTimer <= 0) {
          ally.attackTimer = 0.5;
          const killed = nearest.takeDamage(ally.dmg);
          this.particles.emit(nearest.x, nearest.y, 6, '#fbbf24', 30, 0.3);
          if (this.game.meta?.settings?.showDamageNumbers !== false) {
            this.particles.addNumber(nearest.x, nearest.y - 10, ally.dmg, '#fbbf24', false);
          }
          if (killed) this._onEnemyKilled(nearest);
        }
      } else {
        const angle = Math.atan2(this.player.y - ally.y, this.player.x - ally.x);
        if (Math.hypot(this.player.x - ally.x, this.player.y - ally.y) > 40) {
          ally.x += Math.cos(angle) * 90 * dt;
          ally.y += Math.sin(angle) * 90 * dt;
        }
      }
      if (ally.duration <= 0) {
        this.particles.emit(ally.x, ally.y, 8, '#fbbf24', 20, 0.3);
        this.allies.splice(i, 1);
      }
    }

    // Dracula bat swarm touch
    if (this.player.draculaBatSwarmTimer > 0) {
      this.player.draculaBatSwarmTimer -= dt;
      for (const e of this.enemies) {
        if (e.isDead || e.hitByBatSwarm) continue;
        if (Math.hypot(e.x - this.player.x, e.y - this.player.y) <= 32) {
          e.hitByBatSwarm = true;
          const killed = e.takeDamage(12);
          this.player.heal(5);
          this.particles.emit(e.x, e.y, 6, '#f43f5e', 25, 0.3);
          if (this.game.meta?.settings?.showDamageNumbers !== false) {
            this.particles.addNumber(e.x, e.y - 10, 12, '#f43f5e', true);
          }
          if (killed) this._onEnemyKilled(e);
        }
      }
      if (this.player.draculaBatSwarmTimer <= 0) {
        for (const e of this.enemies) e.hitByBatSwarm = false;
      }
    }

    // Charmed enemies
    for (const e of this.enemies) {
      if (e.isDead) continue;
      if (e.charmed && e.charmedTimer > 0) {
        e.charmedTimer -= dt;
        e.charmAttackTimer = Math.max(0, (e.charmAttackTimer || 0) - dt);
        if (Math.random() < 0.05) {
          this.particles.addNumber(e.x, e.y - 14, '♪', '#c084fc', false);
        }
        let otherNear = null, otherDist = 120;
        for (const o of this.enemies) {
          if (o.isDead || o === e || o.charmed) continue;
          const d = Math.hypot(o.x - e.x, o.y - e.y);
          if (d < otherDist) {
            otherNear = o;
            otherDist = d;
          }
        }
        if (otherNear) {
          const a = Math.atan2(otherNear.y - e.y, otherNear.x - e.x);
          const nextX = e.x + Math.cos(a) * e.speed * dt * 0.8;
          const nextY = e.y + Math.sin(a) * e.speed * dt * 0.8;
          const hw = e.hitboxW / 2, hh = e.hitboxH / 2;
          if (!this.map.isRectBlocked(nextX - hw, e.y - hh, e.hitboxW, e.hitboxH)) e.x = nextX;
          if (!this.map.isRectBlocked(e.x - hw, nextY - hh, e.hitboxW, e.hitboxH)) e.y = nextY;
          if (otherDist < 25 && e.charmAttackTimer <= 0) {
            const k = otherNear.takeDamage(8);
            if (k) this._onEnemyKilled(otherNear);
            e.charmAttackTimer = 0.7;
          }
        }
        if (e.charmedTimer <= 0) e.charmed = false;
      }
    }

    // Stuck wave watchdog
    if (this.stageDef?.type === 'clear' && !this.objectiveComplete && this.combatActive) {
      const living = this.enemies.filter(e => !e.isDead);
      if (living.length === 0 && this.waveTransitionTimer <= 0) {
        this.stuckWaveWatchdog += dt;
        if (this.stuckWaveWatchdog >= 1.5) {
          this.stuckWaveWatchdog = 0;
          this._checkObjective();
        }
      } else {
        this.stuckWaveWatchdog = 0;
      }
    }

    // Proceed to next stage on Enter or HUD click when complete
    if (this.objectiveComplete) {
      const nextBtnBounds = this.hud.getNextStageButtonBounds();
      const hoverNextBtn = mouse.x >= nextBtnBounds.x && mouse.x <= nextBtnBounds.x + nextBtnBounds.w &&
                           mouse.y >= nextBtnBounds.y && mouse.y <= nextBtnBounds.y + nextBtnBounds.h;
      if ((hoverNextBtn && input.mouseClicked()) || input.justPressed('Enter')) {
        this.game.audio.playSfx('gate');
        this.game.proceedToNextStage();
        return;
      }
    }

    // Greed harvest timer
    if (this.isGreedHarvest) {
      this.greedTimer -= dt;
    }

    // ---- SEPARATION STEERING ----
    this._applySeparation();

    // ---- ENEMIES ----
    for (const e of this.enemies) {
      if (e.isDead && !e._deathProcessed) {
        this._onEnemyKilled(e);
      }
      e.update(dt, this.player.x, this.player.y, this.map);
    }
    // Clean up dead+removed enemies
    this.enemies = this.enemies.filter(e => !e.markedForRemoval);

    // ---- BOSS ----
    if (this.boss && !this.boss.isDead) {
      this.boss.update(dt, this.player.x, this.player.y, this.map,
        (type, count) => this._bossSpawn(type, count),
        (bx, by, count, dmg, speed, gap) => this._bossBulletRing(bx, by, count, dmg, speed, gap)
      );
    }
    if (this.boss && this.boss.isDead && !this.boss._deathProcessed) {
      this._onBossKilled(this.boss);
    }

    // ---- PLAYER ATTACK ----
    if (this.player.isAttacking) {
      this._handlePlayerAttack();
    }

    // ---- SKILL ----
    if (input.justPressed('KeyQ')) {
      this._useSkill();
    }

    // ---- ENEMY ATTACKS → PLAYER ----
    this._checkEnemyHits();

    // ---- BOSS ATTACKS → PLAYER ----
    if (this.boss && !this.boss.isDead) {
      this._checkBossHits();
    }

    // ---- PROJECTILES ----
    this._updateProjectiles(dt);

    // ---- VOID ZONES ----
    this._updateVoidZones(dt);

    // ---- XP ORB PICKUP ----
    this._pickupOrbs();

    // ---- CHEST INTERACT ----
    this._checkChestInteract(input);

    // ---- SEAL INTERACT ----
    this._checkSealInteract(input);

    // ---- HOLD ZONES ----
    this._updateHoldZones(dt);

    // ---- PARTICLES ----
    this.particles.update(dt);

    // ---- SPAWNING ----
    this._handleSpawning(dt);

    // ---- OBJECTIVES ----
    this._checkObjective();

    // ---- GATE ----
    this._checkGate(input);
  }

  _applySeparation() {
    const SEP_RADIUS = 28;
    const SEP_FORCE = 150;
    for (let i = 0; i < this.enemies.length; i++) {
      const a = this.enemies[i];
      if (a.isDead) continue;
      let sx = 0, sy = 0;
      for (let j = 0; j < this.enemies.length; j++) {
        if (i === j) continue;
        const b = this.enemies[j];
        if (b.isDead) continue;
        const dx = a.x - b.x;
        const dy = a.y - b.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < SEP_RADIUS && dist > 0) {
          const factor = Math.pow((SEP_RADIUS - dist) / SEP_RADIUS, 1.2);
          sx += (dx / dist) * SEP_FORCE * factor;
          sy += (dy / dist) * SEP_FORCE * factor;
          // Hard anti-stack push if dangerously overlapping
          if (dist < 18) {
            const push = (18 - dist) * 0.35;
            a.x += (dx / dist) * push;
            a.y += (dy / dist) * push;
          }
        } else if (dist === 0) {
          // If perfectly overlapping, push in random direction
          const randAngle = Math.random() * Math.PI * 2;
          a.x += Math.cos(randAngle) * 4;
          a.y += Math.sin(randAngle) * 4;
        }
      }
      a.sepX = sx;
      a.sepY = sy;
    }
  }

  _handlePlayerAttack() {
    const info = this.player.getAttackInfo();
    const rangedAttack = ['magic_missiles', 'pierce_arrows', 'soul_siphon', 'flute_notes'].includes(info.attackType);
    let landed = false;
    // Attack flags belong to this swing, not to a timer that may fire during a later stage.
    for (const enemy of this.enemies) enemy.hitThisSwing = false;
    if (this.boss) this.boss.hitThisSwing = false;
    if (this.game?.tutorialDummy) this.game.tutorialDummy.hitThisSwing = false;
    // Melee swing
    for (const e of rangedAttack ? [] : this.enemies) {
      if (e.isDead || e.hitThisSwing) continue;
      const dx = e.x - this.player.x;
      const dy = e.y - this.player.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (!circleHitsEntity(this.player.x, this.player.y, info.range, e)) continue;
      const angle = Math.atan2(dy, dx);
      let angleDiff = Math.abs(angle - info.angle);
      if (angleDiff > Math.PI) angleDiff = Math.PI * 2 - angleDiff;
      if (angleDiff > info.arc / 2) continue;
      // Hit!
      e.hitThisSwing = true;
      landed = true;
      const kbDist = info.knockback || 4;
      const kbX = dist > 0 ? (dx / dist) * kbDist : 0;
      const kbY = dist > 0 ? (dy / dist) * kbDist : 0;
      const killed = e.takeDamage(info.damage, kbX, kbY);
      if (killed) this._onEnemyKilled(e);
      this.game.audio.playSfx('slash');
      this.particles.emit(e.x, e.y, info.crit ? 6 : 3, info.crit ? C.COLOR_CRIT : '#fff', 20, 0.3);
      // Damage number
      if (this.game.meta?.settings?.showDamageNumbers !== false) {
        this.particles.addNumber(e.x, e.y - 10, info.damage, info.crit ? C.COLOR_CRIT : '#fff', info.crit);
      }
      this.camera.shake(info.crit ? 3 : 1.5);
      // Apply artifact effects on hit
      this._applyArtifactOnHit(e, info);
    }
    // Boss melee
    if (!rangedAttack && this.boss && !this.boss.isDead && !this.boss.hitThisSwing) {
      const dx = this.boss.x - this.player.x;
      const dy = this.boss.y - this.player.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (circleHitsEntity(this.player.x, this.player.y, info.range, this.boss)) {
        const angle = Math.atan2(dy, dx);
        let angleDiff = Math.abs(angle - info.angle);
        if (angleDiff > Math.PI) angleDiff = Math.PI * 2 - angleDiff;
        if (angleDiff <= info.arc / 2) {
          this.boss.hitThisSwing = true;
          landed = true;
          const killed = this.boss.takeDamage(info.damage);
          if (killed) this._onBossKilled(this.boss);
          this.game.audio.playSfx('hit');
          this.particles.emit(this.boss.x, this.boss.y, info.crit ? 8 : 4, info.crit ? C.COLOR_CRIT : '#fff', 20, 0.3);
          if (this.game.meta?.settings?.showDamageNumbers !== false) {
            this.particles.addNumber(this.boss.x, this.boss.y - 15, info.damage, info.crit ? C.COLOR_CRIT : '#fff', info.crit);
          }
          this.camera.shake(info.crit ? 4 : 2);
          this._applyArtifactOnHit(this.boss, info, true);
        }
      }
    }

    // Practice Dummy melee (Tutorial)
    if (!rangedAttack && this.game?.tutorialDummy && !this.game.tutorialDummy.isDead && !this.game.tutorialDummy.hitThisSwing) {
      const dummy = this.game.tutorialDummy;
      const dx = dummy.x - this.player.x;
      const dy = dummy.y - this.player.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const dummyHitRadius = dummy.hitboxW || 24;
      if (circleHitsEntity(this.player.x, this.player.y, info.range + 8, { ...dummy, hitboxW: dummyHitRadius, hitboxH: dummy.hitboxH || dummyHitRadius })) {
        const angle = Math.atan2(dy, dx);
        let angleDiff = Math.abs(angle - info.angle);
        if (angleDiff > Math.PI) angleDiff = Math.PI * 2 - angleDiff;
        if (angleDiff <= info.arc / 2 + 0.45) {
          dummy.hitThisSwing = true;
          landed = true;
          dummy.hitTimer = 0.2;
          const dmg = info.damage;
          dummy.hp -= dmg;
          this.game.audio.playSfx('hit');
          this.particles.emit(dummy.x, dummy.y, info.crit ? 8 : 4, '#ffd700', 25, 0.3);
          if (this.game.meta?.settings?.showDamageNumbers !== false) {
            this.particles.addNumber(dummy.x, dummy.y - 12, dmg, info.crit ? C.COLOR_CRIT : '#ffffff', info.crit);
          }
          this.camera.shake(info.crit ? 3 : 1.5);
          if (dummy.hp <= 0 && !dummy.isDead) {
            dummy.isDead = true;
            this.particles.emit(dummy.x, dummy.y, 16, '#fbbf24', 40, 0.5);
            this.game.audio.playSfx('levelup');
            // Drop enough XP for level up to Lv2
            this.xpOrbs.push({ x: dummy.x, y: dummy.y, xp: 20 });
          }
        }
      }
    }

    if (landed && this.player.classId === 'wukong') {
      this.player.wukongTempo = Math.min(5, this.player.wukongTempo + 1);
      this.player.wukongTempoDecay = 0;
    } else if (!landed && this.player.classId === 'wukong') {
      this.player.wukongTempo = 0;
      this.player.wukongTempoDecay = 0;
    }

    // Spawn characteristic artifact projectiles
    this._fireArtifactProjectiles(info);
  }

  _applyArtifactOnHit(target, info, isBoss = false) {
    for (const art of this.player.artifacts) {
      const def = ARTIFACTS[art.id];
      if (!def) continue;
      const s = def.stats?.[Math.min(art.level - 1, (def.stats?.length || 1) - 1)] || {};

      // Burn on hit
      if (s.burnDmg) {
        const burnDmg = Math.floor(s.burnDmg * this.player._spellDmgMult);
        target.applyBurn(burnDmg, s.burnDur || 3);
      }
      // Slow on hit
      if (s.slow) {
        target.applySlow(s.slow, s.slowDur || 2);
      }
      // Lifesteal on hit
      if (s.lifesteal) {
        const heal = Math.max(1, Math.floor(info.damage * s.lifesteal));
        this.player.heal(heal);
      }
    }
  }

  _fireArtifactProjectiles(info) {
    for (const art of this.player.artifacts) {
      const def = ARTIFACTS[art.id];
      if (!def) continue;
      const s = def.stats?.[Math.min(art.level - 1, (def.stats?.length || 1) - 1)] || {};
      const proj = def.projectile || {};
      const count = (s.projectiles || proj.count || 1) + this.player._extraProjectiles;
      const baseDmg = Math.floor((s.dmg || proj.dmg || 8) * this.player._spellDmgMult);
      const speed = s.projectileSpeed || proj.speed || 180;

      const baseAngle = (info && typeof info.angle === 'number') ? info.angle : (this.player.aimAngle || 0);
      for (let i = 0; i < count; i++) {
        const spreadAngle = count > 1
          ? baseAngle + (i - (count - 1) / 2) * 0.16
          : baseAngle;
        const p = new Projectile(
          this.player.x, this.player.y,
          Math.cos(spreadAngle) * speed,
          Math.sin(spreadAngle) * speed,
          baseDmg, 'player', {
            type: proj.type || 'normal',
            life: proj.life || 1.8,
            radius: proj.radius || 5,
            pierce: s.pierce !== undefined ? s.pierce : (proj.pierce || false),
            homing: s.homing !== undefined ? s.homing : (proj.homing || 0),
            burnDmg: s.burnDmg ? Math.floor(s.burnDmg * this.player._spellDmgMult) : 0,
            burnDur: s.burnDur || 0,
            slow: s.slow || 0,
            slowDur: s.slowDur || 0,
            lifesteal: s.lifesteal || 0,
            chains: s.chains || 0,
            chainRange: s.chainRange || 70,
            color: proj.color || '#ffcc44',
            bloodTrail: s.bloodTrail || false,
            explodeOnBurnKill: s.explodeOnBurnKill || def.evolved || false,
          }
        );
        this.projectiles.push(p);
      }

      // Play weapon attack sound
      if (proj.type === 'fire') this.game.audio.playSfx('fire');
      else if (proj.type === 'ice') this.game.audio.playSfx('ice');
      else if (proj.type === 'lightning') this.game.audio.playSfx('lightning');
      else if (proj.type === 'arrow') this.game.audio.playSfx('slash');
      else if (proj.type === 'blood') this.game.audio.playSfx('slash');
      else if (proj.type === 'void') this.game.audio.playSfx('fire');
    }
  }

  _checkEnemyHits() {
    for (const e of this.enemies) {
      if (e.isDead) continue;
      if (!e.isDealingDamage()) continue;
      const dx = this.player.x - e.x;
      const dy = this.player.y - e.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const hitRange = e.def.attackRange || 18;
      if (circleHitsEntity(e.x, e.y, hitRange, this.player)) {
        const dmg = Math.floor(e.dmg * this.dmgScale);
        // takeDamage returns false if blocked by iframe/spawnProtection, true if died
        // It returns false for both "survived hit" and "blocked" cases.
        // We check if HP actually changed by recording it before.
        const hpBefore = this.player.hp;
        const died = this.player.takeDamage(dmg);
        const wasHit = this.player.hp < hpBefore || died;
        if (wasHit) {
          // Knockback player
          const kbDist = C.PLAYER_HIT_KNOCKBACK;
          if (dist > 0) {
            this.player.x += (dx / dist) * kbDist;
            this.player.y += (dy / dist) * kbDist;
          }
          this.hitDirectionAngle = Math.atan2(-dy, -dx);
          this.hitDirectionTimer = 0.5;
          this.playerHitVignette = 0.5;
          this.camera.shake(4);
          this.game.audio.playSfx('hit');
          if (this.game.meta?.settings?.showDamageNumbers !== false) {
            this.particles.addNumber(this.player.x, this.player.y - 14, dmg, '#ff4444');
          }
        }
        if (died) {
          this.game.audio.playSfx('death');
        }
      }
    }
  }

  _checkBossHits() {
    if (!this.boss.isDealingDamage()) return;
    const atk = this.boss.currentAttack;
    if (!atk) return;

    let hit = false;
    if (atk.type === 'sweep' || atk.type === 'double_sweep') {
      hit = this.boss.isPointInSweep(this.player.x, this.player.y);
    } else if (atk.type === 'stomp') {
      hit = this.boss.isPointInStomp(this.player.x, this.player.y);
    } else if (atk.type === 'charge' || atk.type === 'double_charge') {
      const dx = this.player.x - this.boss.x;
      const dy = this.player.y - this.boss.y;
      hit = Math.sqrt(dx * dx + dy * dy) < this.boss.hitboxW + this.player.hitboxW / 2;
    }

    if (hit) {
      const dmg = Math.floor(this.boss.getCurrentAttackDmg() * this.dmgScale);
      const hpBefore = this.player.hp;
      const died = this.player.takeDamage(dmg);
      const wasHit = this.player.hp < hpBefore || died;
      if (wasHit) {
        const dx = this.player.x - this.boss.x;
        const dy = this.player.y - this.boss.y;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;
        this.player.x += (dx / dist) * C.PLAYER_HIT_KNOCKBACK * 1.5;
        this.player.y += (dy / dist) * C.PLAYER_HIT_KNOCKBACK * 1.5;
        this.hitDirectionAngle = Math.atan2(-dy, -dx);
        this.hitDirectionTimer = 0.5;
        this.playerHitVignette = 0.6;
        this.camera.shake(6);
        this.game.audio.playSfx('hit');
        if (this.game.meta?.settings?.showDamageNumbers !== false) {
          this.particles.addNumber(this.player.x, this.player.y - 14, dmg, '#ff4444');
        }
      }
      if (died) this.game.audio.playSfx('death');
    }
  }

  _updateProjectiles(dt) {
    for (const p of this.projectiles) {
      p.update(dt, this.enemies, this.player, this.map.getArenaPixelSize());
      if (p.dead) continue;

      if (p.owner === 'player') {
        // Hit enemies
        for (const e of this.enemies) {
          if (e.isDead) continue;
          if (p.hits(e)) {
            p.registerHit(e);
            const killed = e.takeDamage(p.dmg);
            if (killed) this._onEnemyKilled(e);
            // Burn
            if (p.burnDmg > 0) e.applyBurn(p.burnDmg, p.burnDur || 3);
            // Slow
            if (p.slow > 0) e.applySlow(p.slow, p.slowDur || 2);
            // Lifesteal
            if (p.lifesteal > 0) {
              this.player.heal(Math.max(1, Math.floor(p.dmg * p.lifesteal * 0.01)));
            }
            // Chain Lightning
            if (p.chains > 0 && p.chainCount < p.chains) {
              this._chainLightning(e, p);
            }
            // Damage number
            if (this.game.meta?.settings?.showDamageNumbers !== false) {
              this.particles.addNumber(e.x, e.y - 10, p.dmg, p.type === 'fire' ? '#ff6622' : '#fff');
            }
            this.particles.emit(e.x, e.y, 3, p.color || '#fff', 15, 0.2);
          }
        }
        // Hit boss
        if (this.boss && !this.boss.isDead && p.hits(this.boss)) {
          p.registerHit(this.boss);
          const killed = this.boss.takeDamage(p.dmg);
          if (killed) this._onBossKilled(this.boss);
          if (p.burnDmg > 0) this.boss.applyBurn(p.burnDmg, p.burnDur || 3);
          if (p.slow > 0) this.boss.applySlow(p.slow, p.slowDur || 2);
          if (p.lifesteal > 0) {
            this.player.heal(Math.max(1, Math.floor(p.dmg * p.lifesteal * 0.01)));
          }
          if (this.game.meta?.settings?.showDamageNumbers !== false) {
            this.particles.addNumber(this.boss.x, this.boss.y - 15, p.dmg, p.type === 'fire' ? '#ff6622' : '#fff');
          }
        }

        // Hit practice dummy in tutorial
        if (this.game?.tutorialDummy && !this.game.tutorialDummy.isDead && p.hits(this.game.tutorialDummy)) {
          p.registerHit(this.game.tutorialDummy);
          const dummy = this.game.tutorialDummy;
          dummy.hitTimer = 0.2;
          dummy.hp -= p.dmg;
          this.game.audio.playSfx('hit');
          this.particles.emit(dummy.x, dummy.y, 6, p.color || '#ffd700', 25, 0.3);
          if (this.game.meta?.settings?.showDamageNumbers !== false) {
            this.particles.addNumber(dummy.x, dummy.y - 12, p.dmg, p.color || '#ffffff');
          }
          this.camera.shake(2);
          if (dummy.hp <= 0 && !dummy.isDead) {
            dummy.isDead = true;
            this.particles.emit(dummy.x, dummy.y, 16, '#fbbf24', 40, 0.5);
            this.game.audio.playSfx('levelup');
            this.xpOrbs.push({ x: dummy.x, y: dummy.y, xp: 20 });
          }
        }
      } else {
        // Enemy/boss projectile → player
        const dx = this.player.x - p.x;
        const dy = this.player.y - p.y;
        if (segmentHitsEntity(p.previousX, p.previousY, p.x, p.y, p.radius, this.player)) {
          const hpBefore = this.player.hp;
          const died = this.player.takeDamage(p.dmg);
          const wasHit = this.player.hp < hpBefore || died;
          p.dead = true;
          if (wasHit) {
            this.hitDirectionAngle = Math.atan2(-dy, -dx);
            this.hitDirectionTimer = 0.4;
            this.playerHitVignette = 0.4;
            this.camera.shake(3);
            this.game.audio.playSfx('hit');
            if (this.game.meta?.settings?.showDamageNumbers !== false) {
              this.particles.addNumber(this.player.x, this.player.y - 14, p.dmg, '#ff4444');
            }
          }
          if (died) this.game.audio.playSfx('death');
        }
      }
    }
    this.projectiles = this.projectiles.filter(p => !p.dead);
    if (this.projectiles.length > C.MAX_PROJECTILES) {
      this.projectiles = this.projectiles.slice(-C.MAX_PROJECTILES);
    }
  }

  /** Chain Lightning — finds next alive enemy within range, skipping already-hit */
  _chainLightning(sourceEnemy, sourceProj) {
    let closest = null;
    let closestDist = Infinity;
    for (const e of this.enemies) {
      if (e.isDead || e === sourceEnemy || sourceProj.hitEnemies.has(e)) continue;
      const dx = e.x - sourceEnemy.x;
      const dy = e.y - sourceEnemy.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < sourceProj.chainRange && dist < closestDist) {
        closest = e;
        closestDist = dist;
      }
    }
    if (closest) {
      const chainDmg = Math.floor(sourceProj.dmg * 0.7);
      const killed = closest.takeDamage(chainDmg);
      if (killed) this._onEnemyKilled(closest);
      // Register to prevent re-chain
      sourceProj.hitEnemies.add(closest);
      sourceProj.chainCount++;
      // Visual
      this.particles.emit(closest.x, closest.y, 4, '#ffff44', 20, 0.3);
      this.game.audio.playSfx('lightning');
      if (this.game.meta?.settings?.showDamageNumbers !== false) {
        this.particles.addNumber(closest.x, closest.y - 10, chainDmg, '#ffff44');
      }
      // Continue chain?
      if (sourceProj.chainCount < sourceProj.chains) {
        this._chainLightning(closest, sourceProj);
      }
    }
  }

  _updateVoidZones(dt) {
    for (const vz of this.voidZones) {
      vz.update(dt);
      if (vz.dead) {
        if (vz.explodeOnEnd) {
          for (const e of this.enemies) {
            if (e.isDead) continue;
            const dx = e.x - vz.x;
            const dy = e.y - vz.y;
            if (Math.sqrt(dx * dx + dy * dy) < vz.radius + 10) {
              const killed = e.takeDamage(vz.dmg * 2);
              if (killed) this._onEnemyKilled(e);
            }
          }
          this.particles.emit(vz.x, vz.y, 15, '#a060e0', 40, 0.5);
        }
        continue;
      }
      // Pull enemies
      for (const e of this.enemies) {
        if (e.isDead) continue;
        const dx = vz.x - e.x;
        const dy = vz.y - e.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < vz.radius && dist > 0) {
          const pull = vz.force * dt;
          e.x += (dx / dist) * pull;
          e.y += (dy / dist) * pull;
        }
      }
      // Tick damage
      if (vz.dmgTimer >= 0.5) {
        vz.dmgTimer -= 0.5;
        for (const e of this.enemies) {
          if (e.isDead) continue;
          const dx = vz.x - e.x;
          const dy = vz.y - e.y;
          if (Math.sqrt(dx * dx + dy * dy) < vz.radius) {
            const killed = e.takeDamage(vz.dmg);
            if (killed) this._onEnemyKilled(e);
          }
        }
      }
    }
    this.voidZones = this.voidZones.filter(v => !v.dead);
  }

  _pickupOrbs() {
    const pr = this.player.pickupRange;
    for (let i = this.xpOrbs.length - 1; i >= 0; i--) {
      const orb = this.xpOrbs[i];
      const dx = this.player.x - orb.x;
      const dy = this.player.y - orb.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < pr) {
        // Magnet towards player
        const pull = Math.min(200, 100 + (pr - dist) * 5);
        orb.x += (dx / dist) * pull * 0.016;
        orb.y += (dy / dist) * pull * 0.016;
        if (dist < 8) {
          const levels = this.player.addXp(orb.xp);
          this.pendingLevelUps.push(...levels);
          if (levels.length > 0) {
            this.particles.emit(this.player.x, this.player.y, 25, '#22c55e', 40, 0.6);
            this.particles.addNumber(this.player.x, this.player.y - 20, `+FULL HP! CẤP ${levels[levels.length - 1]}!`, '#4ade80', true);
            this.game.audio.playSfx('levelup');
          }
          this.xpOrbs.splice(i, 1);
          this.game.audio.playSfx('xp');
        }
      }
    }
  }

  _checkChestInteract(input) {
    for (let i = this.chests.length - 1; i >= 0; i--) {
      const chest = this.chests[i];
      const dx = this.player.x - chest.x;
      const dy = this.player.y - chest.y;
      if (Math.sqrt(dx * dx + dy * dy) < 25 && input.justPressed('KeyE')) {
        this.game.audio.playSfx('chest');
        if (chest.enhanced) {
          this.player.gold += 30;
          this.stageGold += 30;
        } else {
          this.player.gold += 15;
          this.stageGold += 15;
        }
        this.particles.emit(chest.x, chest.y, 10, C.COLOR_GOLD, 40, 0.5);
        this.chests.splice(i, 1);
      }
    }
  }

  _checkSealInteract(input) {
    for (let i = this.seals.length - 1; i >= 0; i--) {
      const seal = this.seals[i];
      const dx = this.player.x - seal.x;
      const dy = this.player.y - seal.y;
      if (Math.sqrt(dx * dx + dy * dy) < 20 && input.justPressed('KeyE')) {
        seal.hp--;
        this.particles.emit(seal.x, seal.y, 5, '#cc66ff', 20, 0.3);
        if (seal.hp <= 0) {
          this.game.audio.playSfx('levelup');
          this.particles.emit(seal.x, seal.y, 15, '#ff66ff', 40, 0.6);
          this.seals.splice(i, 1);
        }
      }
    }
  }

  _updateHoldZones(dt) {
    if (this.stageDef?.type !== 'hold') return;
    for (let i = 0; i < this.holdZones.length; i++) {
      const z = this.holdZones[i];
      if (this.holdProgress[i] >= this.holdTarget) continue;
      const px = this.player.x;
      const py = this.player.y;
      if (px >= z.x && px <= z.x + z.w && py >= z.y && py <= z.y + z.h) {
        this.holdProgress[i] += dt;
      }
    }
  }

  _useSkill() {
    if (this.player.isDead) return false;

    // Check cooldown
    if (this.player.skillCd > 0) {
      this.particles.addNumber(
        this.player.x,
        this.player.y - 18,
        `Hồi: ${this.player.skillCd.toFixed(1)}s`,
        '#f87171',
        false
      );
      this.game.audio.playSfx('dash');
      return false;
    }

    // Identify class active skill, weapon skill, or default fallback
    const classSk = this.player.classActiveSkill;
    const art = this.player.artifacts[0];
    const def = art ? ARTIFACTS[art.id] : null;
    const artLevel = art?.level || 1;
    const sk = classSk || def?.skill || {
      name: 'Chiến Hống',
      type: 'battle_cry',
      cd: 8,
      dmg: 18,
      desc: 'Sóng xung kích đẩy lùi kẻ địch xung quanh'
    };

    const maxCd = sk.cd || this.player.skillMaxCd || 10;
    const actualCd = Math.max(1.5, maxCd * (1 - (this.player._cdReduction || 0)));
    const skillKey = sk.id || sk.type;

    switch (skillKey) {
      case 'warrior_charge': {
        this.player.skillCd = actualCd;
        this.particles.addNumber(this.player.x, this.player.y - 20, sk.name, '#f59e0b', true);
        this.game.audio.playSfx('dash');
        const dashDist = 110;
        const angle = this.player.aimAngle;
        const tx = this.player.x + Math.cos(angle) * dashDist;
        const ty = this.player.y + Math.sin(angle) * dashDist;
        const arena = this.map.getArenaPixelSize();
        this.player.x = Math.max(20, Math.min(arena.w - 20, tx));
        this.player.y = Math.max(20, Math.min(arena.h - 20, ty));
        this.player.invulnerableTimer = 0.4;
        this.camera.shake(5);
        this.game.audio.playSfx('slash');
        this.particles.emit(this.player.x, this.player.y, 22, '#f59e0b', 65, 0.4);
        const chargeDmg = Math.floor(this.player.attackDmg * 1.5);
        for (const e of this.enemies) {
          if (e.isDead) continue;
          if (Math.hypot(e.x - this.player.x, e.y - this.player.y) <= 65) {
            e.stunTimer = 1.2;
            const killed = e.takeDamage(chargeDmg, Math.cos(angle) * 30, Math.sin(angle) * 30);
            if (killed) this._onEnemyKilled(e);
            if (this.game.meta?.settings?.showDamageNumbers !== false) {
              this.particles.addNumber(e.x, e.y - 12, chargeDmg, '#f59e0b', true);
            }
          }
        }
        if (this.boss && !this.boss.isDead && Math.hypot(this.boss.x - this.player.x, this.boss.y - this.player.y) <= 65 + this.boss.hitboxW) {
          const killed = this.boss.takeDamage(chargeDmg);
          if (killed) this._onBossKilled(this.boss);
        }
        break;
      }

      case 'mage_vortex': {
        this.player.skillCd = actualCd;
        this.particles.addNumber(this.player.x, this.player.y - 20, sk.name, '#38bdf8', true);
        const aimDist = 75;
        const vx = this.player.x + Math.cos(this.player.aimAngle) * aimDist;
        const vy = this.player.y + Math.sin(this.player.aimAngle) * aimDist;
        const vDmg = Math.floor(this.player.attackDmg * 0.7);
        this.voidZones.push(new VoidZone(vx, vy, 75, 120, 2.5, vDmg, true));
        this.game.audio.playSfx('fire');
        this.camera.shake(3.5);
        this.particles.emit(vx, vy, 18, '#38bdf8', 50, 0.5);
        break;
      }

      case 'ranger_storm': {
        this.player.skillCd = actualCd;
        this.particles.addNumber(this.player.x, this.player.y - 20, sk.name, '#4ade80', true);
        const count = 8;
        const baseAngle = this.player.aimAngle;
        const dmg = Math.floor(this.player.attackDmg * 0.85);
        for (let i = 0; i < count; i++) {
          const spread = baseAngle + (i - (count - 1) / 2) * 0.12;
          this.projectiles.push(new Projectile(
            this.player.x, this.player.y,
            Math.cos(spread) * 260, Math.sin(spread) * 260,
            dmg, 'player',
            { type: 'arrow', life: 1.5, radius: 4, pierce: true }
          ));
        }
        this.game.audio.playSfx('slash');
        this.camera.shake(3);
        break;
      }

      case 'assassin_dance': {
        this.player.skillCd = actualCd;
        this.particles.addNumber(this.player.x, this.player.y - 20, sk.name, '#c084fc', true);
        const dashDist = 130;
        const angle = this.player.aimAngle;
        const origX = this.player.x, origY = this.player.y;
        const tx = this.player.x + Math.cos(angle) * dashDist;
        const ty = this.player.y + Math.sin(angle) * dashDist;
        const arena = this.map.getArenaPixelSize();
        this.player.x = Math.max(20, Math.min(arena.w - 20, tx));
        this.player.y = Math.max(20, Math.min(arena.h - 20, ty));
        this.player.stealthTimer = 1.8;
        this.player.invulnerableTimer = 0.5;
        this.game.audio.playSfx('dash');
        this.camera.shake(3);
        const dDmg = Math.floor(this.player.attackDmg * 1.8);
        for (const e of this.enemies) {
          if (e.isDead) continue;
          const d = distToSegment({ x: e.x, y: e.y }, { x: origX, y: origY }, { x: this.player.x, y: this.player.y });
          if (d <= 35) {
            const killed = e.takeDamage(dDmg, Math.cos(angle) * 15, Math.sin(angle) * 15);
            if (killed) this._onEnemyKilled(e);
            this.particles.emit(e.x, e.y, 10, '#c084fc', 35, 0.35);
            if (this.game.meta?.settings?.showDamageNumbers !== false) {
              this.particles.addNumber(e.x, e.y - 12, dDmg, '#c084fc', true);
            }
          }
        }
        break;
      }

      case 'paladin_consecrate': {
        this.player.skillCd = actualCd;
        this.particles.addNumber(this.player.x, this.player.y - 20, sk.name, '#fbbf24', true);
        this.sanctuaryZones.push({
          x: this.player.x,
          y: this.player.y,
          radius: 90,
          duration: 5.5,
          tickTimer: 0
        });
        this.player.heal(15);
        this.game.audio.playSfx('levelup');
        this.camera.shake(3);
        this.particles.emit(this.player.x, this.player.y, 25, '#fbbf24', 60, 0.5);
        break;
      }

      case 'necro_nova': {
        this.player.skillCd = actualCd;
        this.particles.addNumber(this.player.x, this.player.y - 20, sk.name, '#a855f7', true);
        const novaRadius = 130;
        const dmg = Math.floor(this.player.attackDmg * 1.4);
        for (const e of this.enemies) {
          if (e.isDead) continue;
          if (Math.hypot(e.x - this.player.x, e.y - this.player.y) <= novaRadius) {
            e.applyBurn(5, 3.5);
            const killed = e.takeDamage(dmg);
            if (killed) this._onEnemyKilled(e);
            if (this.game.meta?.settings?.showDamageNumbers !== false) {
              this.particles.addNumber(e.x, e.y - 10, dmg, '#a855f7', true);
            }
          }
        }
        if (this.boss && !this.boss.isDead && Math.hypot(this.boss.x - this.player.x, this.boss.y - this.player.y) <= novaRadius + this.boss.hitboxW) {
          const killed = this.boss.takeDamage(dmg);
          if (killed) this._onBossKilled(this.boss);
        }
        this.game.audio.playSfx('fire');
        this.camera.shake(4);
        this.particles.emit(this.player.x, this.player.y, 25, '#a855f7', 65, 0.5);
        break;
      }

      case 'alice_shift': {
        this.player.skillCd = actualCd;
        const oldForm = this.player.aliceForm || 'small';
        const newForm = oldForm === 'small' ? 'giant' : 'small';
        this.player.aliceForm = newForm;
        if (newForm === 'giant') {
          this.particles.addNumber(this.player.x, this.player.y - 20, 'DẠNG KHỔNG LỒ! ĐẬP ĐẤT!', '#38bdf8', true);
          this.camera.shake(6);
          this.game.audio.playSfx('hit');
          this.particles.emit(this.player.x, this.player.y, 30, '#38bdf8', 75, 0.55);
          const stompDmg = Math.floor(this.player.attackDmg * 1.6);
          for (const e of this.enemies) {
            if (e.isDead) continue;
            const dist = Math.hypot(e.x - this.player.x, e.y - this.player.y);
            if (dist <= 100) {
              e.stunTimer = 1.0;
              const kx = dist > 0 ? ((e.x - this.player.x) / dist) * 35 : 0;
              const ky = dist > 0 ? ((e.y - this.player.y) / dist) * 35 : 0;
              const killed = e.takeDamage(stompDmg, kx, ky);
              if (killed) this._onEnemyKilled(e);
              if (this.game.meta?.settings?.showDamageNumbers !== false) {
                this.particles.addNumber(e.x, e.y - 12, stompDmg, '#38bdf8', true);
              }
            }
          }
          if (this.boss && !this.boss.isDead && Math.hypot(this.boss.x - this.player.x, this.boss.y - this.player.y) <= 100 + this.boss.hitboxW) {
            const killed = this.boss.takeDamage(stompDmg);
            if (killed) this._onBossKilled(this.boss);
          }
        } else {
          this.particles.addNumber(this.player.x, this.player.y - 20, 'DẠNG TÍ HON! CƠ ĐỘNG!', '#fbbf24', true);
          this.game.audio.playSfx('dash');
          this.player.invulnerableTimer = 0.8;
          this.particles.emit(this.player.x, this.player.y, 20, '#fbbf24', 50, 0.4);
        }
        break;
      }

      case 'wukong_clone': {
        this.player.skillCd = actualCd;
        this.player.wukongTempo = 5;
        this.player.wukongTempoDecay = 6.0;
        this.particles.addNumber(this.player.x, this.player.y - 20, 'PHÂN THÂN TỐI ĐA NHỊP!', '#fbbf24', true);
        this.game.audio.playSfx('levelup');
        this.camera.shake(4);
        this.particles.emit(this.player.x, this.player.y, 25, '#fbbf24', 60, 0.5);
        for (let i = 0; i < 2; i++) {
          const a = (i * Math.PI) + (Math.random() - 0.5);
          this.allies.push({
            type: 'wukong_clone',
            x: this.player.x + Math.cos(a) * 30,
            y: this.player.y + Math.sin(a) * 30,
            duration: 6.5,
            attackTimer: 0,
            dmg: Math.floor(this.player.attackDmg * 0.55),
          });
        }
        break;
      }

      case 'dracula_bat_swarm': {
        this.player.skillCd = actualCd;
        const hpCost = 10;
        this.player.hp = Math.max(1, this.player.hp - hpCost);
        this.player.draculaBatSwarmTimer = 2.0;
        this.player.invulnerableTimer = 2.0;
        this.particles.addNumber(this.player.x, this.player.y - 20, 'ĐÀN DƠI QUỶ! (-10 HP)', '#f43f5e', true);
        this.game.audio.playSfx('fire');
        this.camera.shake(3.5);
        this.particles.emit(this.player.x, this.player.y, 25, '#f43f5e', 55, 0.5);
        break;
      }

      case 'piper_hypnosis': {
        this.player.skillCd = actualCd;
        this.particles.addNumber(this.player.x, this.player.y - 20, sk.name, '#c084fc', true);
        this.game.audio.playSfx('levelup');
        this.camera.shake(3);
        this.particles.emit(this.player.x, this.player.y, 25, '#c084fc', 60, 0.5);
        const hypnoRadius = 160;
        for (const e of this.enemies) {
          if (e.isDead) continue;
          if (Math.hypot(e.x - this.player.x, e.y - this.player.y) <= hypnoRadius) {
            e.charmed = true;
            e.charmedTimer = 4.0;
            this.particles.addNumber(e.x, e.y - 14, '♪ THÔI MIÊN ♪', '#c084fc', false);
          }
        }
        break;
      }

      case 'lightning_storm': {
        // Collect viable targets within storm range (280px)
        const stormTargets = [];
        for (const e of this.enemies) {
          if (!e.isDead && Math.hypot(e.x - this.player.x, e.y - this.player.y) <= 280) {
            stormTargets.push(e);
          }
        }
        if (this.boss && !this.boss.isDead && Math.hypot(this.boss.x - this.player.x, this.boss.y - this.player.y) <= 320) {
          stormTargets.push(this.boss);
        }
        if (this.game?.tutorialDummy && !this.game.tutorialDummy.isDead && Math.hypot(this.game.tutorialDummy.x - this.player.x, this.game.tutorialDummy.y - this.player.y) <= 280) {
          stormTargets.push(this.game.tutorialDummy);
        }

        if (stormTargets.length === 0) {
          this.particles.addNumber(this.player.x, this.player.y - 18, 'Không có mục tiêu trong tầm!', '#fbbf24', false);
          return false;
        }

        // Successfully executing!
        this.player.skillCd = actualCd;
        this.particles.addNumber(this.player.x, this.player.y - 20, sk.name, '#fef08a', true);
        this.game.audio.playSfx('lightning');
        this.camera.shake(4);

        const bolts = Math.min(sk.bolts || 6, stormTargets.length * 2);
        const spellDmgMult = this.player._spellDmgMult || 1;
        const dmg = Math.floor((sk.dmg || 22) * artLevel * spellDmgMult);

        for (let i = 0; i < bolts; i++) {
          const target = stormTargets[Math.floor(Math.random() * stormTargets.length)];
          if (!target) continue;

          // Strike primary target
          this.particles.emit(target.x, target.y, 8, '#fef08a', 45, 0.4);
          this.particles.emit(target.x, target.y - 12, 6, '#38bdf8', 35, 0.3);

          if (target === this.game?.tutorialDummy) {
            target.hp -= dmg;
            target.hitTimer = 0.2;
            if (this.game.meta?.settings?.showDamageNumbers !== false) {
              this.particles.addNumber(target.x, target.y - 10, dmg, '#fef08a', true);
            }
            if (target.hp <= 0) target.isDead = true;
          } else if (target === this.boss) {
            const killed = target.takeDamage(dmg);
            if (this.game.meta?.settings?.showDamageNumbers !== false) {
              this.particles.addNumber(target.x, target.y - 15, dmg, '#fef08a', true);
            }
            if (killed) this._onBossKilled(target);
          } else {
            const killed = target.takeDamage(dmg, 0, 0);
            if (this.game.meta?.settings?.showDamageNumbers !== false) {
              this.particles.addNumber(target.x, target.y - 10, dmg, '#fef08a', true);
            }
            if (killed) this._onEnemyKilled(target);
          }

          // Chain secondary spark to nearby foes
          for (const other of stormTargets) {
            if (other === target) continue;
            const distToOther = Math.hypot(other.x - target.x, other.y - target.y);
            if (distToOther < 70) {
              const chainDmg = Math.floor(dmg * 0.6);
              this.particles.emit(other.x, other.y, 4, '#fef08a', 25, 0.2);
              if (other === this.boss) {
                const k = other.takeDamage(chainDmg);
                if (k) this._onBossKilled(other);
              } else if (other === this.game?.tutorialDummy) {
                other.hp -= chainDmg;
                if (other.hp <= 0) other.isDead = true;
              } else {
                const k = other.takeDamage(chainDmg, 0, 0);
                if (k) this._onEnemyKilled(other);
              }
            }
          }
        }
        break;
      }

      case 'blood_burst': {
        // Needs injury OR nearby target within 180px
        const hasInjury = this.player.hp < this.player.maxHp;
        let nearbyEnemy = false;
        for (const e of this.enemies) {
          if (!e.isDead && Math.hypot(e.x - this.player.x, e.y - this.player.y) <= 180) {
            nearbyEnemy = true;
            break;
          }
        }
        if (!nearbyEnemy && this.boss && !this.boss.isDead && Math.hypot(this.boss.x - this.player.x, this.boss.y - this.player.y) <= 200) {
          nearbyEnemy = true;
        }
        if (!nearbyEnemy && this.game?.tutorialDummy && !this.game.tutorialDummy.isDead && Math.hypot(this.game.tutorialDummy.x - this.player.x, this.game.tutorialDummy.y - this.player.y) <= 180) {
          nearbyEnemy = true;
        }

        if (!hasInjury && !nearbyEnemy) {
          this.particles.addNumber(this.player.x, this.player.y - 18, 'Máu đầy, không có địch gần!', '#fbbf24', false);
          return false;
        }

        // Successfully executing!
        this.player.skillCd = actualCd;
        this.particles.addNumber(this.player.x, this.player.y - 20, sk.name, '#f43f5e', true);

        const heal = Math.floor((sk.heal || 15) * artLevel);
        this.player.heal(heal);
        this.particles.emit(this.player.x, this.player.y, 16, '#f43f5e', 45, 0.5);
        this.game.audio.playSfx('fire');
        this.camera.shake(3);

        const count = sk.count || 10;
        const dmg = Math.floor((sk.dmg || 14) * artLevel * (this.player._spellDmgMult || 1));
        for (let i = 0; i < count; i++) {
          const a = (i / count) * Math.PI * 2;
          this.projectiles.push(new Projectile(
            this.player.x, this.player.y,
            Math.cos(a) * 110, Math.sin(a) * 110,
            dmg, 'player',
            { type: 'blood', life: 1.6, radius: 5, lifesteal: 4 * artLevel, pierce: true }
          ));
        }
        break;
      }

      case 'fire_nova': {
        this.player.skillCd = actualCd;
        this.particles.addNumber(this.player.x, this.player.y - 20, sk.name, '#f97316', true);
        const count = sk.count || 12;
        const spd = sk.speed || 115;
        const dmg = Math.floor((sk.dmg || 16) * artLevel * (this.player._spellDmgMult || 1));
        for (let i = 0; i < count; i++) {
          const a = (i / count) * Math.PI * 2;
          this.projectiles.push(new Projectile(
            this.player.x, this.player.y,
            Math.cos(a) * spd, Math.sin(a) * spd,
            dmg, 'player',
            { type: 'fire', life: 1.6, radius: 5.5, burnDmg: sk.burnDmg || 4, burnDur: 3.5, pierce: false }
          ));
        }
        this.game.audio.playSfx('fire');
        this.particles.emit(this.player.x, this.player.y, 18, '#ff6622', 50, 0.45);
        this.camera.shake(4);
        break;
      }

      case 'ice_blast': {
        this.player.skillCd = actualCd;
        this.particles.addNumber(this.player.x, this.player.y - 20, sk.name, '#38bdf8', true);
        const count = sk.count || 10;
        const spd = sk.speed || 95;
        const dmg = Math.floor((sk.dmg || 12) * artLevel * (this.player._spellDmgMult || 1));
        for (let i = 0; i < count; i++) {
          const a = (i / count) * Math.PI * 2;
          this.projectiles.push(new Projectile(
            this.player.x, this.player.y,
            Math.cos(a) * spd, Math.sin(a) * spd,
            dmg, 'player',
            { type: 'ice', life: 2.0, radius: 5.5, slow: 0.5, slowDur: 3.5, pierce: true }
          ));
        }
        this.game.audio.playSfx('ice');
        this.particles.emit(this.player.x, this.player.y, 14, '#67e8f9', 40, 0.4);
        this.camera.shake(2.5);
        break;
      }

      case 'void_pull': {
        this.player.skillCd = actualCd;
        this.particles.addNumber(this.player.x, this.player.y - 20, sk.name, '#c084fc', true);
        const aimDist = 65;
        const vx = this.player.x + Math.cos(this.player.aimAngle) * aimDist;
        const vy = this.player.y + Math.sin(this.player.aimAngle) * aimDist;
        this.voidZones.push(new VoidZone(
          vx, vy,
          sk.radius || 55, sk.force || 90, sk.duration || 3.2,
          Math.floor((sk.dmg || 6) * artLevel * (this.player._spellDmgMult || 1)),
          sk.explodeOnEnd !== false
        ));
        this.game.audio.playSfx('fire');
        this.particles.emit(vx, vy, 16, '#a855f7', 45, 0.5);
        this.camera.shake(3);
        break;
      }

      case 'arrow_rain': {
        this.player.skillCd = actualCd;
        this.particles.addNumber(this.player.x, this.player.y - 20, sk.name, '#a3e635', true);
        const aimDist = 70;
        const cx = this.player.x + Math.cos(this.player.aimAngle) * aimDist;
        const cy = this.player.y + Math.sin(this.player.aimAngle) * aimDist;
        const count = sk.count || 14;
        const dmg = Math.floor((sk.dmg || 9) * artLevel * (this.player._spellDmgMult || 1));
        for (let i = 0; i < count; i++) {
          const ox = (Math.random() - 0.5) * 85;
          const oy = (Math.random() - 0.5) * 85;
          this.projectiles.push(new Projectile(
            cx + ox, cy - 80 + oy,
            (Math.random() - 0.5) * 20, 160 + Math.random() * 40,
            dmg, 'player',
            { type: 'arrow', life: 0.9, radius: 3.5, pierce: true }
          ));
        }
        this.game.audio.playSfx('slash');
        this.particles.emit(cx, cy, 14, '#84cc16', 35, 0.4);
        this.camera.shake(3);
        break;
      }

      case 'battle_cry':
      default: {
        // Fallback default active skill: Battle Cry
        this.player.skillCd = actualCd;
        this.particles.addNumber(this.player.x, this.player.y - 20, 'CHIẾN HỐNG!', '#f59e0b', true);
        this.game.audio.playSfx('hit');
        this.camera.shake(4);
        this.particles.emit(this.player.x, this.player.y, 22, '#f59e0b', 70, 0.45);

        // Knock back and damage all surrounding enemies within 125px
        const shockRadius = 125;
        const dmg = 18 * artLevel;
        for (const e of this.enemies) {
          if (e.isDead) continue;
          const dx = e.x - this.player.x;
          const dy = e.y - this.player.y;
          const dist = Math.hypot(dx, dy);
          if (dist <= shockRadius) {
            const kbDist = 32;
            const kx = dist > 0 ? (dx / dist) * kbDist : kbDist;
            const ky = dist > 0 ? (dy / dist) * kbDist : 0;
            const killed = e.takeDamage(dmg, kx, ky);
            if (killed) this._onEnemyKilled(e);
            if (this.game.meta?.settings?.showDamageNumbers !== false) {
              this.particles.addNumber(e.x, e.y - 10, dmg, '#f59e0b', true);
            }
          }
        }
        if (this.boss && !this.boss.isDead) {
          const dist = Math.hypot(this.boss.x - this.player.x, this.boss.y - this.player.y);
          if (dist <= shockRadius + this.boss.hitboxW) {
            const killed = this.boss.takeDamage(dmg);
            if (killed) this._onBossKilled(this.boss);
            if (this.game.meta?.settings?.showDamageNumbers !== false) {
              this.particles.addNumber(this.boss.x, this.boss.y - 15, dmg, '#f59e0b', true);
            }
          }
        }
        if (this.game?.tutorialDummy && !this.game.tutorialDummy.isDead) {
          const dist = Math.hypot(this.game.tutorialDummy.x - this.player.x, this.game.tutorialDummy.y - this.player.y);
          if (dist <= shockRadius + 24) {
            this.game.tutorialDummy.hp -= dmg;
            this.game.tutorialDummy.hitTimer = 0.2;
            if (this.game.meta?.settings?.showDamageNumbers !== false) {
              this.particles.addNumber(this.game.tutorialDummy.x, this.game.tutorialDummy.y - 10, dmg, '#f59e0b', true);
            }
            if (this.game.tutorialDummy.hp <= 0) this.game.tutorialDummy.isDead = true;
          }
        }
        break;
      }
    }

    return true;
  }

  _handleSpawning(dt) {
    if (!this.combatActive || this.objectiveComplete) return;
    if (this.isGreedHarvest) {
      this.spawnTimer += dt;
      if (this.spawnTimer >= 4 && this.enemies.filter(e => !e.isDead).length < 15) {
        this.spawnTimer = 0;
        this._spawnWave();
      }
      return;
    }
    if (this.stageDef?.type === 'survive' || this.stageDef?.type === 'hold' || this.stageDef?.type === 'hunt') {
      this.spawnTimer += dt;
      const spawnInterval = Math.max(3, 8 - this.spawnScale);
      if (this.spawnTimer >= spawnInterval && this.enemies.filter(e => !e.isDead).length < C.MAX_ENEMIES * 0.6) {
        this.spawnTimer = 0;
        this._spawnWave();
      }
    }
    // Survive timer
    if (this.stageDef.type === 'survive') {
      this.surviveTimer -= dt;
    }
  }

  _checkObjective() {
    if (this.objectiveComplete) return;
    let complete = false;
    if (this.isGreedHarvest) {
      const activeEnemies = this.enemies.filter(e => !e.isDead).length;
      if (this.greedTimer <= 0 || (this.greedTimer < 18 && activeEnemies === 0)) {
        complete = true;
      }
    } else {
      switch (this.stageDef?.type) {
        case 'clear': {
          const living = this.enemies.filter(e => !e.isDead);
          if (living.length === 0 && this.wavesRemaining > 0 && this.waveTransitionTimer <= 0) {
            const totalWaves = this.stageDef.waves || 3;
            this.wavesRemaining--;
            if (this.wavesRemaining <= 0) {
              complete = true;
            } else {
              const finishedWave = totalWaves - this.wavesRemaining;
              const nextWave = finishedWave + 1;
              this.waveTransitionTimer = 2.4;
              this.waveTransitionMsg = `Đợt ${finishedWave}/${totalWaves} hoàn tất — Đợt ${nextWave} sắp tới!`;
              this.game.audio.playSfx('levelup');
              this.spawnTelegraphs = [];
              const zones = this.map.getSpawnZones();
              const count = Math.max(3, Math.floor((this.stageDef.baseEnemies || 6) * this.spawnScale));
              for (let i = 0; i < count; i++) {
                const z = zones[Math.floor(Math.random() * zones.length)];
                this.spawnTelegraphs.push({
                  x: z.x + Math.random() * z.w,
                  y: z.y + Math.random() * z.h,
                  radius: 20,
                  progress: 0,
                });
              }
            }
          }
          break;
        }
        case 'survive':
          if (this.surviveTimer <= 0) complete = true;
          break;
        case 'destroy':
          if (this.seals.length === 0) complete = true;
          break;
        case 'hold':
          if (this.holdProgress.every(p => p >= this.holdTarget)) complete = true;
          break;
        case 'hunt':
          if (this.eliteHuntCount >= this.eliteHuntTarget) complete = true;
          break;
      }
    }
    if (complete) {
      this.objectiveComplete = true;
      this.gateOpen = true;
      this.combatActive = false;
      const gatePos = this.map.getGatePosition();
      if (this.isGreedHarvest) {
        this.isGreedHarvest = false;
        this.game.audio.playSfx('levelup');
        this.camera.shake(6);
        const levels = this.player.addXp(C.XP_OBJECTIVE * 2);
        this.pendingLevelUps.push(...levels);
        this.stageAsh += C.ASH_PER_STAGE * 2;
        this.chests.push({ x: gatePos.x - 24, y: gatePos.y, enhanced: true });
        this.particles.emit(gatePos.x - 24, gatePos.y, 25, C.COLOR_GOLD, 60, 0.6);
      } else {
        const levels = this.player.addXp(C.XP_OBJECTIVE);
        this.pendingLevelUps.push(...levels);
        this.stageAsh += C.ASH_PER_STAGE;
        this.chests.push({ x: gatePos.x - 20, y: gatePos.y });
        this._showStageComplete();
      }
    }
  }

  _showStageComplete() {
    const canHarvest = this.stageDef?.type !== 'boss' && !this.isGreedHarvest && this.stageIndex < 11;
    this.game.showStageComplete({
      objective: this.stageDef?.desc || '',
      goldEarned: this.stageGold,
      ashEarned: this.stageAsh,
      canHarvest,
    });
  }

  _checkGate(input) {
    if (!this.gateOpen || !this.gate) return;
    const dx = this.player.x - this.gate.x, dy = this.player.y - this.gate.y;
    if (Math.sqrt(dx*dx+dy*dy) < this.gate.radius + 10 && input.justPressed('KeyE')) {
      this.game.audio.playSfx('gate');
      this.game.proceedToNextStage();
    }
  }

  _bossSpawn(type, count) {
    const zones = this.map.getSpawnZones();
    for (let i = 0; i < count; i++) {
      if (this.enemies.length >= C.MAX_ENEMIES) break;
      const zone = zones[Math.floor(Math.random() * zones.length)];
      const e = new Enemy(this.game.assets, type, zone.x + Math.random() * zone.w, zone.y + Math.random() * zone.h, this.hpScale);
      this.enemies.push(e);
    }
    if (this.boss) this.boss.minionCount = this.enemies.filter(e => !e.isDead).length;
  }

  _bossBulletRing(bx, by, count, dmg, speed, gap) {
    for (let i = 0; i < count; i++) {
      const a = (i / count) * Math.PI * 2 + (gap > 0 ? (Math.random() * 0.1) : 0);
      this.projectiles.push(new Projectile(bx, by,
        Math.cos(a) * speed, Math.sin(a) * speed,
        dmg, 'boss', { type: 'boss_bullet', life: 3, radius: 4 }));
    }
  }

  startGreedHarvest() {
    this.isGreedHarvest = true;
    this.greedTimer = 20;
    this.objectiveComplete = false;
    this.gateOpen = false;
    this.combatActive = true;
    // Spawn elite wave
    const types = this.stageDef.enemies || ['orc_infantry'];
    const zones = this.map.getSpawnZones();
    const count = 6 + Math.floor(this.spawnScale * 3);
    for (let i = 0; i < count; i++) {
      const type = types[Math.floor(Math.random() * types.length)];
      const zone = zones[Math.floor(Math.random() * zones.length)];
      const e = new Enemy(this.game.assets, type, zone.x + Math.random() * zone.w, zone.y + Math.random() * zone.h, this.hpScale * 1.2);
      if (i < 2) e.makeElite(Math.random() < 0.5 ? 'armored' : 'frenzied');
      this.enemies.push(e);
    }
  }

  draw(ctx) {
    ctx.save();
    this.camera.applyTransform(ctx);
    // Map
    const chapter = CHAPTERS[this.chapterIndex];
    this.map.draw(ctx, chapter?.background || 'fields');
    // Seals (Cursed Mystic Purple Altar)
    for (const seal of this.seals) {
      ctx.fillStyle = 'rgba(168, 85, 247, 0.45)';
      ctx.beginPath();
      ctx.arc(seal.x, seal.y, 12, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#c084fc';
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 8px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(`${seal.hp}/${seal.maxHp} HP`, seal.x, seal.y - 14);
      ctx.fillStyle = '#e9d5ff';
      ctx.fillText('[E PHONG ẤN]', seal.x, seal.y + 18);
    }
    // Hold zones (Clear Sky-Blue / Emerald Objective Zone - NOT ambiguous orange)
    if (this.stageDef?.type === 'hold') {
      for (let i = 0; i < this.holdZones.length; i++) {
        const z = this.holdZones[i];
        const done = this.holdProgress[i] >= this.holdTarget;
        ctx.strokeStyle = done ? '#22c55e' : '#38bdf8';
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]);
        ctx.strokeRect(z.x, z.y, z.w, z.h);
        ctx.setLineDash([]);
        ctx.fillStyle = done ? 'rgba(34, 197, 94, 0.15)' : 'rgba(56, 189, 248, 0.12)';
        ctx.fillRect(z.x, z.y, z.w, z.h);
        ctx.fillStyle = done ? '#4ade80' : '#ffffff';
        ctx.font = 'bold 8.5px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(done ? '✓ ĐÃ HOÀN THÀNH' : `GIỮ ĐIỂM: ${Math.floor(this.holdProgress[i])}/${this.holdTarget}s`, z.x + z.w / 2, z.y + z.h / 2);
      }
    }
    // Void zones
    for (const vz of this.voidZones) vz.draw(ctx);

    // Sanctuary zones (Paladin)
    for (const sz of this.sanctuaryZones) {
      const pulse = Math.sin(Date.now() / 150) * 0.15 + 0.85;
      ctx.fillStyle = `rgba(251, 191, 36, ${0.16 * pulse})`;
      ctx.beginPath();
      ctx.arc(sz.x, sz.y, sz.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = `rgba(251, 191, 36, ${0.75 * pulse})`;
      ctx.lineWidth = 1.5;
      ctx.setLineDash([5, 4]);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = '#fef08a';
      ctx.font = 'bold 7.5px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('✚ THÁNH VỰC (HỒI MÁU & ĐỐT QUÁI)', sz.x, sz.y - sz.radius - 3);
    }

    // Spawn telegraphs (Incoming wave)
    for (const st of this.spawnTelegraphs) {
      const alpha = Math.min(0.85, st.progress * 0.95);
      ctx.fillStyle = `rgba(239, 68, 68, ${alpha * 0.28})`;
      ctx.beginPath();
      ctx.arc(st.x, st.y, st.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = `rgba(239, 68, 68, ${alpha})`;
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.fillStyle = '#f87171';
      ctx.font = 'bold 7px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('⚠ QUÁI XUẤT HIỆN', st.x, st.y - st.radius - 2);
    }

    // Allies (Wukong shadow clones)
    for (const ally of this.allies) {
      ctx.save();
      ctx.translate(ally.x, ally.y);
      ctx.fillStyle = 'rgba(251, 191, 36, 0.7)';
      ctx.beginPath();
      ctx.arc(0, 0, 8, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#ffd700';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(-10, 6);
      ctx.lineTo(10, -6);
      ctx.stroke();
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 7px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('PHÂN THÂN', 0, -11);
      ctx.restore();
    }

    // XP orbs — distinct cyan with glow ring
    for (const orb of this.xpOrbs) {
      const pulse = Math.sin(Date.now() / 100 + orb.x) * 0.3 + 0.7;
      // Outer glow
      ctx.globalAlpha = pulse * 0.25;
      ctx.fillStyle = '#44ddff';
      ctx.beginPath();
      ctx.arc(orb.x, orb.y, 6, 0, Math.PI * 2);
      ctx.fill();
      // Inner bright core
      ctx.globalAlpha = pulse;
      ctx.fillStyle = '#88eeff';
      ctx.fillRect(Math.floor(orb.x) - 2, Math.floor(orb.y) - 2, 4, 4);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(Math.floor(orb.x) - 1, Math.floor(orb.y) - 1, 2, 2);
      ctx.globalAlpha = 1;
    }
    // Chests
    for (const chest of this.chests) {
      if (chest.enhanced) {
        ctx.fillStyle = 'rgba(255,215,0,0.3)';
        ctx.beginPath();
        ctx.arc(chest.x, chest.y, 14, 0, Math.PI * 2);
        ctx.fill();
      }
      const chestImg = this.game.assets.getImage('chest');
      if (chestImg) {
        ctx.drawImage(chestImg, 0, 0, 32, 32, chest.x - 8, chest.y - 8, 16, 16);
      } else {
        ctx.fillStyle = chest.enhanced ? '#ffcc00' : '#aa8844';
        ctx.fillRect(chest.x - 6, chest.y - 6, 12, 12);
      }
      const dx = this.player.x - chest.x, dy = this.player.y - chest.y;
      if (Math.sqrt(dx*dx+dy*dy) < 25) {
        ctx.fillStyle = chest.enhanced ? '#ffdd44' : '#ffcc88';
        ctx.font = '6px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(chest.enhanced ? '[E] Rương Vàng' : '[E] Mở', chest.x, chest.y - 12);
      }
    }
    // Gate & Objective Exit Beacon
    if (this.gate) {
      ctx.fillStyle = this.gateOpen ? 'rgba(34, 197, 94, 0.35)' : 'rgba(100, 100, 100, 0.15)';
      ctx.beginPath();
      ctx.arc(this.gate.x, this.gate.y, this.gate.radius, 0, Math.PI * 2);
      ctx.fill();

      if (this.gateOpen) {
        const pulse = Math.sin(Date.now() / 180) * 0.25 + 0.75;
        // Outer pulsing energy rings
        ctx.strokeStyle = `rgba(74, 222, 128, ${pulse * 0.85})`;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(this.gate.x, this.gate.y, this.gate.radius + 6 * pulse, 0, Math.PI * 2);
        ctx.stroke();

        ctx.strokeStyle = `rgba(34, 197, 94, ${pulse * 0.4})`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(this.gate.x, this.gate.y, this.gate.radius + 12 * pulse, 0, Math.PI * 2);
        ctx.stroke();

        // Pillar of light beam rising upward
        const grad = ctx.createLinearGradient(this.gate.x, this.gate.y, this.gate.x, this.gate.y - 40);
        grad.addColorStop(0, 'rgba(74, 222, 128, 0.5)');
        grad.addColorStop(1, 'rgba(74, 222, 128, 0)');
        ctx.fillStyle = grad;
        ctx.fillRect(this.gate.x - 14, this.gate.y - 40, 28, 40);

        // Prominent in-world beacon text
        ctx.fillStyle = '#4ade80';
        ctx.font = 'bold 8.5px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('CỔNG TIẾP THEO', this.gate.x, this.gate.y - 24);
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 8px monospace';
        ctx.fillText('[E] TIẾN VÀO', this.gate.x, this.gate.y - 14);

        // Directional Guide Arrow pointing from Player to Gate when not immediately next to it
        if (this.player) {
          const gdx = this.gate.x - this.player.x;
          const gdy = this.gate.y - this.player.y;
          const gDist = Math.hypot(gdx, gdy);
          if (gDist > 45) {
            const gAngle = Math.atan2(gdy, gdx);
            const arrowRadius = 32;
            const ax = this.player.x + Math.cos(gAngle) * arrowRadius;
            const ay = this.player.y + Math.sin(gAngle) * arrowRadius;

            ctx.save();
            ctx.translate(ax, ay);
            ctx.rotate(gAngle);
            ctx.fillStyle = '#4ade80';
            ctx.beginPath();
            ctx.moveTo(9, 0);
            ctx.lineTo(-4, -5);
            ctx.lineTo(-2, 0);
            ctx.lineTo(-4, 5);
            ctx.closePath();
            ctx.fill();
            ctx.restore();
          }
        }
      }
    }

    // ---- Y-SORTED ENTITIES ----
    // Collect all drawable entities with their y positions for sorting
    const drawables = [];
    for (const e of this.enemies) {
      if (e.state !== 'dead' && e.state !== 'spawn') {
        drawables.push({ type: 'enemy', obj: e, y: e.y });
      } else if (e.state === 'spawn') {
        drawables.push({ type: 'enemy', obj: e, y: e.y });
      }
    }
    if (this.boss && this.boss.state !== 'dead') {
      drawables.push({ type: 'boss', obj: this.boss, y: this.boss.y });
    }
    if (this.game?.tutorialDummy && !this.game.tutorialDummy.isDead) {
      drawables.push({ type: 'dummy', obj: this.game.tutorialDummy, y: this.game.tutorialDummy.y });
    }
    drawables.push({ type: 'player', obj: this.player, y: this.player.y });

    // Sort by Y position (entities closer to top drawn first)
    drawables.sort((a, b) => a.y - b.y);

    for (const d of drawables) {
      if (d.type === 'player') {
        d.obj.drawShadow(ctx);
        d.obj.draw(ctx);
      } else if (d.type === 'boss') {
        d.obj.draw(ctx);
      } else if (d.type === 'dummy') {
        this._drawTutorialDummy(ctx, d.obj);
      } else {
        d.obj.draw(ctx);
      }
    }

    // Projectiles
    for (const p of this.projectiles) p.draw(ctx);
    // Particles
    this.particles.draw(ctx);

    // Damage direction indicator (pointing toward threat)
    if (this.hitDirectionTimer > 0 && this.hitDirectionAngle !== null) {
      ctx.save();
      ctx.translate(this.player.x, this.player.y);
      ctx.rotate(this.hitDirectionAngle);
      const alpha = Math.min(1, this.hitDirectionTimer * 2.2);
      ctx.fillStyle = `rgba(255, 30, 30, ${alpha * 0.75})`;
      ctx.beginPath();
      ctx.arc(0, 0, 28, -Math.PI * 0.2, Math.PI * 0.2);
      ctx.lineTo(38, 0);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = `rgba(255, 120, 120, ${alpha * 0.9})`;
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.restore();
    }

    ctx.restore();

    // Red screen edge vignette on taking damage
    if (this.playerHitVignette > 0) {
      const vAlpha = Math.min(0.5, this.playerHitVignette * 1.1);
      const grad = ctx.createRadialGradient(
        C.INTERNAL_W / 2, C.INTERNAL_H / 2, C.INTERNAL_W * 0.35,
        C.INTERNAL_W / 2, C.INTERNAL_H / 2, C.INTERNAL_W * 0.65
      );
      grad.addColorStop(0, 'rgba(255, 0, 0, 0)');
      grad.addColorStop(1, `rgba(220, 20, 20, ${vAlpha})`);
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, C.INTERNAL_W, C.INTERNAL_H);
    }

    // Permanent subtle depth vignette (always visible, very subtle)
    if (!this._vignetteGrad) {
      this._vignetteGrad = ctx.createRadialGradient(
        C.INTERNAL_W / 2, C.INTERNAL_H / 2, C.INTERNAL_W * 0.32,
        C.INTERNAL_W / 2, C.INTERNAL_H / 2, C.INTERNAL_W * 0.7
      );
      this._vignetteGrad.addColorStop(0, 'rgba(0, 0, 0, 0)');
      this._vignetteGrad.addColorStop(0.7, 'rgba(0, 0, 0, 0.04)');
      this._vignetteGrad.addColorStop(1, 'rgba(0, 0, 0, 0.12)');
    }
    ctx.fillStyle = this._vignetteGrad;
    ctx.fillRect(0, 0, C.INTERNAL_W, C.INTERNAL_H);

    // Draw interface at display resolution, independently of world pixels.
    ctx = this.game.uiCtx || ctx;

    // HUD (screen space)
    const stageInfo = {
      chapterName: CHAPTERS[this.chapterIndex]?.name || '',
      stageNum: this.stageIndex + 1,
      objective: this._getObjectiveText(),
      objectiveComplete: this.objectiveComplete,
    };
    const mouse = this.game.input?.getMousePos?.() || null;
    const isMouseDown = this.game.input?.isMouseDown?.() || false;
    this.hud.drawCombatHUD(ctx, this.player, stageInfo, this.curseTime, mouse, isMouseDown);
    if (this.boss) this.hud.drawBossHUD(ctx, this.boss);

    // Compass pointers to off-screen / important objectives
    this._drawCompassPointers(ctx);

    // Intro objective banner
    if (this.introBannerTimer > 0) {
      this._drawIntroObjectiveBanner(ctx);
    }

    // Wave transition countdown banner
    if (this.waveTransitionTimer > 0) {
      this._drawWaveTransitionBanner(ctx);
    }

    // In-game compact controls guide
    this.hud.drawControlsGuide(ctx, {
      isExpanded: this.controlsGuideExpanded,
      isTouch: this.game.input?.isTouchDevice,
      mousePos: mouse,
      isMouseDown: isMouseDown,
    });

    // Greed harvest timer
    if (this.isGreedHarvest && !this.objectiveComplete) {
      ctx.fillStyle = '#ff8844';
      ctx.font = 'bold 10px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(`GẶT THAM: ${Math.ceil(this.greedTimer)}s`, C.INTERNAL_W / 2, 20);
      ctx.textAlign = 'left';
    }

    // Touch controls
    if (this.game.input?.isTouchDevice) {
      this._drawTouchControls(ctx);
    }
  }

  _drawTouchControls(ctx) {
    const btns = this.game.input.getTouchButtons();
    if (!btns) return;

    // Virtual joystick
    if (this.game.input.touch.joystick.active) {
      const j = this.game.input.touch.joystick;
      ctx.globalAlpha = 0.3;
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(j.startX, j.startY, 40, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 0.5;
      ctx.fillStyle = '#ffffff';
      const jdx = Math.max(-30, Math.min(30, j.dx));
      const jdy = Math.max(-30, Math.min(30, j.dy));
      ctx.beginPath();
      ctx.arc(j.startX + jdx, j.startY + jdy, 15, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
    }

    // Action buttons
    for (const [, btn] of Object.entries(btns)) {
      ctx.globalAlpha = 0.4;
      ctx.fillStyle = '#222';
      ctx.beginPath();
      ctx.arc(btn.x + btn.w / 2, btn.y + btn.h / 2, btn.w / 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#888';
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.globalAlpha = 0.8;
      ctx.fillStyle = '#fff';
      ctx.font = '14px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(btn.label, btn.x + btn.w / 2, btn.y + btn.h / 2 + 5);
    }
    ctx.globalAlpha = 1;
    ctx.textAlign = 'left';
  }

  _getObjectiveText() {
    if (this.isGreedHarvest) return `Gặt Tham: Sống sót ${Math.ceil(this.greedTimer)}s`;
    if (this.objectiveComplete) return 'Mục tiêu hoàn thành! Đến cổng [E]';
    switch (this.stageDef?.type) {
      case 'clear': {
        const totalWaves = this.stageDef?.waves || 3;
        const currentWave = Math.min(totalWaves, Math.max(1, totalWaves - this.wavesRemaining + 1));
        const aliveCount = this.enemies.filter(e => !e.isDead).length;
        if (this.waveTransitionTimer > 0) {
          return `Đợt ${currentWave}/${totalWaves} xong — Đợt ${currentWave + 1} tới: ${this.waveTransitionTimer.toFixed(1)}s`;
        }
        return `Đợt ${currentWave}/${totalWaves} — Quái còn: ${aliveCount}`;
      }
      case 'survive': return `Sống sót: ${Math.max(0, Math.ceil(this.surviveTimer))}s`;
      case 'destroy': return `Phá ấn: ${this.seals.length} còn lại [E]`;
      case 'hold': {
        const done = this.holdProgress.filter(p => p >= this.holdTarget).length;
        return `Giữ khu vực: ${done}/${this.holdZones.length}`;
      }
      case 'hunt': {
        const aliveElites = this.enemies.filter(e => !e.isDead && e.isElite).length;
        return `Săn tinh anh: ${this.eliteHuntCount}/${this.eliteHuntTarget} (Còn: ${aliveElites})`;
      }
      case 'boss': return this.boss?.isDead ? 'Boss đã gục! Đến cổng [E]' : `Đánh bại: ${this.boss?.def?.name || 'Trùm Cuối'}`;
      default: return '';
    }
  }

  _drawIntroObjectiveBanner(ctx) {
    const W = C.INTERNAL_W;
    const alpha = Math.min(1, this.introBannerTimer < 0.6 ? this.introBannerTimer / 0.6 : 1);
    ctx.save();
    ctx.globalAlpha = alpha;
    const boxW = 280, boxH = 34;
    const bx = (W - boxW) / 2, by = 18;
    ctx.fillStyle = 'rgba(15, 23, 42, 0.94)';
    ctx.fillRect(bx, by, boxW, boxH);
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(bx, by, boxW, boxH);

    ctx.fillStyle = '#38bdf8';
    ctx.font = `bold 9px ${UI_FONT}`;
    ctx.textAlign = 'center';
    ctx.fillText(`⚔ VIỆC CẦN LÀM (MÀN ${this.stageIndex + 1}/12) ⚔`, W / 2, by + 12);

    ctx.fillStyle = '#ffffff';
    ctx.font = `bold 10px ${UI_FONT}`;
    ctx.fillText(this._getObjectiveText(), W / 2, by + 26);
    ctx.restore();
  }

  _drawWaveTransitionBanner(ctx) {
    const W = C.INTERNAL_W;
    ctx.save();
    const boxW = 290, boxH = 36;
    const bx = (W - boxW) / 2, by = 20;
    const pulse = Math.sin(Date.now() / 120) * 0.15 + 0.85;
    ctx.fillStyle = 'rgba(15, 23, 42, 0.96)';
    ctx.fillRect(bx, by, boxW, boxH);
    ctx.strokeStyle = `rgba(245, 158, 11, ${pulse})`;
    ctx.lineWidth = 1.5;
    ctx.strokeRect(bx, by, boxW, boxH);

    ctx.fillStyle = '#fde047';
    ctx.font = `bold 10.5px ${UI_FONT}`;
    ctx.textAlign = 'center';
    ctx.fillText(this.waveTransitionMsg, W / 2, by + 14);

    ctx.fillStyle = '#ffffff';
    ctx.font = `bold 9.5px ${UI_FONT}`;
    ctx.fillText(`Quái xuất hiện sau: ${this.waveTransitionTimer.toFixed(1)}s (Chuẩn bị!)`, W / 2, by + 28);
    ctx.restore();
  }

  _drawCompassPointers(ctx) {
    const W = C.INTERNAL_W;
    const H = C.INTERNAL_H;
    let target = null;

    if (this.objectiveComplete && this.gate) {
      target = { x: this.gate.x, y: this.gate.y, label: 'CỔNG [E]', color: '#4ade80' };
    } else if (this.stageDef?.type === 'destroy' && this.seals.length > 0) {
      target = { x: this.seals[0].x, y: this.seals[0].y, label: 'ẤN PHONG [E]', color: '#c084fc' };
    } else if (this.stageDef?.type === 'hold') {
      const idx = this.holdProgress.findIndex(p => p < this.holdTarget);
      if (idx >= 0 && this.holdZones[idx]) {
        const z = this.holdZones[idx];
        target = { x: z.x + z.w / 2, y: z.y + z.h / 2, label: 'KHU GIỮ', color: '#38bdf8' };
      }
    } else if (this.stageDef?.type === 'hunt') {
      const elite = this.enemies.find(e => !e.isDead && e.isElite);
      if (elite) target = { x: elite.x, y: elite.y, label: 'TINH ANH', color: '#f59e0b' };
    } else if (this.stageDef?.type === 'clear') {
      const alive = this.enemies.filter(e => !e.isDead);
      if (alive.length > 0 && alive.length <= 3) {
        target = { x: alive[0].x, y: alive[0].y, label: 'QUÁI CÒN', color: '#fb923c' };
      }
    } else if (this.stageDef?.type === 'boss' && this.boss && !this.boss.isDead) {
      target = { x: this.boss.x, y: this.boss.y, label: 'TRÙM CUỐI', color: '#ef4444' };
    }

    if (!target) return;

    // Convert target to screen coordinates
    const sx = target.x - this.camera.x;
    const sy = target.y - this.camera.y;

    // If target is offscreen or near screen edge, draw compass indicator
    const margin = 26;
    const isOffscreen = sx < margin || sx > W - margin || sy < margin + 18 || sy > H - margin;
    if (isOffscreen) {
      const cx = W / 2, cy = H / 2;
      const angle = Math.atan2(sy - cy, sx - cx);
      const px = Math.max(margin, Math.min(W - margin, cx + Math.cos(angle) * (W * 0.44)));
      const py = Math.max(margin + 18, Math.min(H - margin, cy + Math.sin(angle) * (H * 0.42)));
      const dist = Math.round(Math.hypot(target.x - this.player.x, target.y - this.player.y));

      ctx.save();
      ctx.translate(px, py);
      // Arrow pointing towards target
      ctx.rotate(angle);
      ctx.fillStyle = target.color;
      ctx.beginPath();
      ctx.moveTo(10, 0);
      ctx.lineTo(-4, -5);
      ctx.lineTo(-1, 0);
      ctx.lineTo(-4, 5);
      ctx.closePath();
      ctx.fill();
      ctx.restore();

      // Label & distance
      ctx.save();
      ctx.font = `bold 7.5px ${UI_FONT}`;
      ctx.textAlign = 'center';
      ctx.fillStyle = 'rgba(15, 23, 42, 0.88)';
      ctx.fillRect(px - 26, py + (py > H - 35 ? -22 : 8), 52, 14);
      ctx.strokeStyle = target.color;
      ctx.lineWidth = 1;
      ctx.strokeRect(px - 26, py + (py > H - 35 ? -22 : 8), 52, 14);
      ctx.fillStyle = target.color;
      ctx.fillText(`${target.label} ${dist}px`, px, py + (py > H - 35 ? -12 : 18));
      ctx.restore();
    }
  }

  _drawTutorialDummy(ctx, dummy) {
    const isHit = dummy.hitTimer > 0;
    ctx.save();
    ctx.translate(dummy.x, dummy.y);

    // Ground shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
    ctx.beginPath();
    ctx.ellipse(0, 8, 12, 5, 0, 0, Math.PI * 2);
    ctx.fill();

    // Wooden post
    ctx.fillStyle = isHit ? '#ffffff' : '#5c3a21';
    ctx.fillRect(-2, -18, 4, 26);
    // Crossbar arms
    ctx.fillStyle = isHit ? '#ffffff' : '#784c28';
    ctx.fillRect(-12, -12, 24, 4);

    // Straw body
    ctx.fillStyle = isHit ? '#fef08a' : '#d97706';
    ctx.fillRect(-8, -14, 16, 16);
    ctx.fillStyle = isHit ? '#ffffff' : '#b45309';
    ctx.fillRect(-7, -8, 14, 2);

    // Target bullseye on chest
    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.arc(0, -6, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(0, -6, 2.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.arc(0, -6, 1, 0, Math.PI * 2);
    ctx.fill();

    // Straw head & hat
    ctx.fillStyle = isHit ? '#ffffff' : '#d97706';
    ctx.fillRect(-5, -22, 10, 8);
    ctx.fillStyle = isHit ? '#ffffff' : '#78350f';
    ctx.fillRect(-10, -23, 20, 3);
    ctx.fillRect(-6, -27, 12, 4);

    // HP Bar overhead
    const hpW = 24, hpH = 3;
    const hpPct = Math.max(0, dummy.hp / dummy.maxHp);
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(-hpW / 2 - 1, -34, hpW + 2, hpH + 2);
    ctx.fillStyle = '#ef4444';
    ctx.fillRect(-hpW / 2, -33, hpW * hpPct, hpH);

    // Bouncing target indicator overhead
    const bob = Math.round(Math.sin(Date.now() * 0.008) * 3);
    ctx.fillStyle = '#fbbf24';
    ctx.font = `bold 8px ${UI_FONT}`;
    ctx.textAlign = 'center';
    ctx.fillText('MỤC TIÊU', 0, -42 + bob);
    ctx.fillText('▼', 0, -35 + bob);

    ctx.restore();
  }

  startNormalCombatAfterTutorial() {
    this.combatActive = true;
    if (this.enemies.length === 0) {
      this._spawnWave();
    }
  }
}
