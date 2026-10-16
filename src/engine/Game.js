// ============================================================
// Game — main coordinator, game loop, scene management
// ============================================================
import { INTERNAL_W, INTERNAL_H, TOTAL_STAGES, STAGES_PER_CHAPTER, ASH_WIN_BONUS } from './Constants.js';
import { AssetLoader } from './AssetLoader.js';
import { Input } from './Input.js';
import { AudioManager } from './AudioManager.js';
import { SaveManager } from './SaveManager.js';
import { CHARMS } from '../data/GameData.js';
import { Player } from '../entities/Player.js';
import { MenuScene } from '../scenes/MenuScene.js';
import { CombatScene } from '../scenes/CombatScene.js';
import { UpgradeScene } from '../scenes/UpgradeScene.js';
import { ShopScene } from '../scenes/ShopScene.js';
import { GameOverScene, VictoryScene, HubScene, SettingsScene, PauseOverlay, StageCompleteScene, ArtifactSelectScene } from '../scenes/UIScenes.js';
import { ClassSelectScene } from '../scenes/ClassSelectScene.js';
import { UIHelper, UI_FONT } from './UIHelper.js';
import { CLASSES } from '../data/ClassData.js';

export class Game {
  constructor(canvasParam = null) {
    this.canvas = canvasParam || document.getElementById('gameCanvas');
    this.ctx = this.canvas.getContext('2d');
    this.canvas.width = INTERNAL_W;
    this.canvas.height = INTERNAL_H;
    this.uiCanvas = null;
    this.uiCtx = null;
    if (this.canvas.parentElement && document.createElement) {
      this.uiCanvas = document.createElement('canvas');
      this.uiCanvas.id = 'uiCanvas';
      this.uiCanvas.setAttribute('aria-hidden', 'true');
      this.canvas.parentElement.appendChild(this.uiCanvas);
      this.uiCtx = this.uiCanvas.getContext('2d');
    }
    this.assets = new AssetLoader();
    this.input = null;
    this.audio = new AudioManager();
    this.saveManager = new SaveManager();
    this.meta = null;
    this.tutorialDummy = null;
    this.tutorialHoverSkip = false;
    this.tutorialPressedSkip = false;
    // Scenes
    this.menuScene = null;
    this.combatScene = null;
    this.upgradeScene = null;
    this.shopScene = null;
    this.gameOverScene = null;
    this.victoryScene = null;
    this.hubScene = null;
    this.settingsScene = null;
    this.pauseOverlay = null;
    this.stageCompleteScene = null;
    this.artifactSelectScene = null;
    this.classSelectScene = null;
    this.showingClassSelect = false;
    // State
    this.currentScene = 'loading';
    this.paused = false;
    this.showingUpgrade = false;
    this.showingStageComplete = false;
    this.showingArtifactSelect = false;
    this.lastTime = 0;
    this.runState = null;
    this.showingTutorial = false;
    this.tutorialStep = 0;
    this.tutorialMoved = false;
    this.tutorialAttacked = false;
    this.tutorialDashed = false;
    this.running = false;
    this.settingsReturnTo = null;
  }

  async init() {
    // Responsive canvas sizing
    this._resizeCanvas();
    window.addEventListener('resize', () => this._resizeCanvas());
    // Load assets
    const progressFill = document.getElementById('progress-fill');
    const loadingText = document.getElementById('loading-text');
    const retryBtn = document.getElementById('retry-btn');
    try {
      await this.assets.loadAll((loaded, total, key) => {
        const pct = (loaded / total) * 100;
        if (progressFill) progressFill.style.width = pct + '%';
        if (loadingText) loadingText.textContent = `Đang tải: ${key} (${loaded}/${total})`;
      });
    } catch (err) {
      if (loadingText) loadingText.textContent = `Lỗi tải tài nguyên: ${err.message}`;
      if (retryBtn) {
        retryBtn.style.display = 'inline-block';
        retryBtn.onclick = () => location.reload();
      }
      return;
    }
    // Hide loading screen
    const loadScreen = document.getElementById('loading-screen');
    if (loadScreen) {
      loadScreen.style.display = 'none';
    }
    // Setup
    this.input = new Input(this.canvas);
    this.audio.init();
    this.meta = this.saveManager.load();
    Player.setCharmData(CHARMS);
    Player.setAutoAttack(this.meta.settings.autoAttack);
    // Apply saved settings
    this.audio.setMusicVolume(this.meta.settings.musicVolume);
    this.audio.setSfxVolume(this.meta.settings.sfxVolume);
    // Create scenes
    this.menuScene = new MenuScene(this);
    this.combatScene = new CombatScene(this);
    this.upgradeScene = new UpgradeScene(this);
    this.shopScene = new ShopScene(this);
    this.gameOverScene = new GameOverScene(this);
    this.victoryScene = new VictoryScene(this);
    this.hubScene = new HubScene(this);
    this.settingsScene = new SettingsScene(this);
    this.pauseOverlay = new PauseOverlay(this);
    this.stageCompleteScene = new StageCompleteScene(this);
    this.artifactSelectScene = new ArtifactSelectScene(this);
    this.classSelectScene = new ClassSelectScene(this);
    const pauseOnFocusLoss = () => {
      if (this.currentScene === 'combat' && !this.paused && !this.showingTutorial &&
          !this.showingUpgrade && !this.showingStageComplete) this.showPause();
      this.input?.clearHeld();
    };
    window.addEventListener('blur', pauseOnFocusLoss);
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) pauseOnFocusLoss();
    });
    // Go to menu
    this.switchScene('menu');
    // Start loop
    this.running = true;
    this.lastTime = performance.now();
    requestAnimationFrame((t) => this._loop(t));
  }

  _resizeCanvas() {
    const container = document.getElementById('game-container');
    if (!container) return;
    const cw = container.clientWidth || (typeof window !== 'undefined' ? window.innerWidth : INTERNAL_W);
    const ch = container.clientHeight || (typeof window !== 'undefined' ? window.innerHeight : INTERNAL_H);
    if (cw <= 0 || ch <= 0) return;

    const scale = Math.min(cw / INTERNAL_W, ch / INTERNAL_H);
    const targetW = Math.max(1, Math.floor(INTERNAL_W * scale));
    const targetH = Math.max(1, Math.floor(INTERNAL_H * scale));

    this.canvas.style.width = `${targetW}px`;
    this.canvas.style.height = `${targetH}px`;
    this.canvas.width = INTERNAL_W;
    this.canvas.height = INTERNAL_H;
    this.scaleX = 1;
    this.scaleY = 1;
    this._currentScale = scale;
    if (this.uiCanvas) {
      const dpr = Math.min(window.devicePixelRatio || 1, 3);
      this.uiCanvas.style.width = targetW + 'px';
      this.uiCanvas.style.height = targetH + 'px';
      this.uiCanvas.width = Math.round(targetW * dpr);
      this.uiCanvas.height = Math.round(targetH * dpr);
    }
  }

  _loop(now) {
    if (!this.running) return;
    const dt = Math.min(0.05, (now - this.lastTime) / 1000);
    this.lastTime = now;
    this.input.beginFrame();
    this._update(dt);
    this._draw();
    this.input.endFrame();
    requestAnimationFrame((t) => this._loop(t));
  }

  _update(dt) {
    if (this.showingTutorial) {
      this._updateTutorial(dt);
      return;
    }
    if (this.showingClassSelect) {
      this.classSelectScene.update(dt, this.input);
      return;
    }
    if (this.showingArtifactSelect) {
      this.artifactSelectScene.update(dt, this.input);
      return;
    }
    if (this.paused) {
      this.pauseOverlay.update(dt, this.input);
      return;
    }
    if (this.showingUpgrade) {
      this.upgradeScene.update(dt, this.input);
      return;
    }
    if (this.showingStageComplete) {
      this.stageCompleteScene.update(dt, this.input);
      return;
    }
    switch (this.currentScene) {
      case 'menu': this.menuScene.update(dt, this.input); break;
      case 'combat': this.combatScene.update(dt, this.input); break;
      case 'shop': this.shopScene.update(dt, this.input); break;
      case 'gameover': this.gameOverScene.update(dt, this.input); break;
      case 'victory': this.victoryScene.update(dt, this.input); break;
      case 'hub': this.hubScene.update(dt, this.input); break;
      case 'settings': this.settingsScene.update(dt, this.input); break;
    }
  }

  _draw() {
    const ctx = this.ctx;
    const ui = this.uiCtx || ctx;
    if (this.uiCtx) {
      ui.setTransform(1, 0, 0, 1, 0, 0);
      ui.clearRect(0, 0, this.uiCanvas.width, this.uiCanvas.height);
      ui.setTransform(this.uiCanvas.width / INTERNAL_W, 0, 0, this.uiCanvas.height / INTERNAL_H, 0, 0);
      ui.imageSmoothingEnabled = false;
      ui.save();
    }
    ctx.save();
    if (this.scaleX && this.scaleY && (this.scaleX !== 1 || this.scaleY !== 1)) {
      ctx.scale(this.scaleX, this.scaleY);
    }
    ctx.imageSmoothingEnabled = false;
    ctx.clearRect(0, 0, INTERNAL_W, INTERNAL_H);
    if (this.currentScene === 'settings' && this.settingsReturnTo === 'pause') {
      this.combatScene.draw(ctx);
      ui.fillStyle = 'rgba(5, 5, 15, 0.75)';
      ui.fillRect(0, 0, INTERNAL_W, INTERNAL_H);
      this.settingsScene.draw(ui, true);
    } else {
      switch (this.currentScene) {
        case 'menu': this.menuScene.draw(ctx); break;
        case 'combat': this.combatScene.draw(ctx); break;
        case 'shop': this.shopScene.draw(ui); break;
        case 'gameover': this.gameOverScene.draw(ui); break;
        case 'victory': this.victoryScene.draw(ui); break;
        case 'hub': this.hubScene.draw(ui); break;
        case 'settings': this.settingsScene.draw(ui); break;
      }
    }
    if (this.showingStageComplete) this.stageCompleteScene.draw(ui);
    if (this.showingUpgrade) this.upgradeScene.draw(ui);
    if (this.showingArtifactSelect) this.artifactSelectScene.draw(ui);
    if (this.showingClassSelect) this.classSelectScene.draw(ui);
    if (this.paused) this.pauseOverlay.draw(ui);
    if (this.showingTutorial) this._drawTutorial(ui);
    ctx.restore();

    if (this.uiCtx) ui.restore();

    // Cursor management
    this._updateCursor();
  }

  _updateCursor() {
    const fullscreenButton = document.getElementById('fullscreen-btn');
    if (fullscreenButton) fullscreenButton.style.display = this.currentScene === 'combat' && !this.paused ? 'none' : 'flex';
    const isUI = this.currentScene !== 'combat' ||
      this.paused || this.showingUpgrade || this.showingStageComplete || this.showingArtifactSelect;

    if (isUI) {
      // In UI scenes, show pointer when hovering buttons
      let hasHover = false;
      if (this.paused && this.pauseOverlay.hoverIndex >= 0) hasHover = true;
      if (this.showingUpgrade && (this.upgradeScene.hoveredCard >= 0 || this.upgradeScene.hoveredReroll)) hasHover = true;
      if (this.showingStageComplete && this.stageCompleteScene.hoverBtn >= 0) hasHover = true;
      if (this.showingArtifactSelect && this.artifactSelectScene.hoverCard >= 0) hasHover = true;
      if (this.currentScene === 'menu' && this.menuScene.hovered >= 0) hasHover = true;
      if (this.currentScene === 'hub' && (this.hubScene.hoverBack || this.hubScene.hoverTab >= 0 || this.hubScene.hoverBuyItem >= 0)) hasHover = true;
      if (this.currentScene === 'shop' && this.shopScene.hoverIndex >= 0) hasHover = true;
      if (this.currentScene === 'settings' && this.settingsScene.hoverIndex >= 0) hasHover = true;
      if (this.currentScene === 'gameover' && this.gameOverScene.hoverBtn) hasHover = true;
      if (this.currentScene === 'victory' && this.victoryScene.hoverBtn) hasHover = true;

      this.canvas.className = hasHover ? 'cursor-pointer' : 'cursor-default';
    } else {
      // In combat, crosshair default (from CSS), pointer on HUD buttons
      const mouse = this.input?.getMousePos?.() || { x: 0, y: 0 };
      const skillBounds = this.combatScene.hud.getSkillButtonBounds();
      const dashBounds = this.combatScene.hud.getDashButtonBounds();
      const hoverSkill = mouse.x >= skillBounds.x && mouse.x <= skillBounds.x + skillBounds.w &&
                         mouse.y >= skillBounds.y && mouse.y <= skillBounds.y + skillBounds.h;
      const hoverDash = mouse.x >= dashBounds.x && mouse.x <= dashBounds.x + dashBounds.w &&
                        mouse.y >= dashBounds.y && mouse.y <= dashBounds.y + dashBounds.h;
      this.canvas.className = (hoverSkill || hoverDash) ? 'cursor-pointer' : '';
    }
  }

  // ---- In-World Progressive Tutorial with Real Practice Dummy ----
  _initTutorial() {
    this.showingTutorial = true;
    this.tutorialStep = 0;
    this.tutorialMoved = false;
    this.tutorialAttacked = false;
    this.tutorialDashed = false;
    this.tutorialHoverSkip = false;
    this.tutorialPressedSkip = false;

    const px = this.combatScene?.player?.x || 320;
    const py = this.combatScene?.player?.y || 180;
    this.tutorialDummy = {
      x: px + 44,
      y: py,
      hitboxW: 24,
      hitboxH: 24,
      hp: 20,
      maxHp: 20,
      hitTimer: 0,
      isDead: false,
      hitThisSwing: false,
    };
  }

  _endTutorial() {
    this.showingTutorial = false;
    this.meta.seenTutorial = true;
    this.saveManager.save(this.meta);
    this.tutorialDummy = null;
    this.audio.playSfx('gate');
    if (this.combatScene) {
      this.combatScene.startNormalCombatAfterTutorial();
    }
  }

  _updateTutorial(dt) {
    const input = this.input;
    const W = INTERNAL_W;

    // Clickable Skip button placed below tutorial banner, or Escape key
    const skipBtn = { x: Math.floor(W / 2 - 36), y: 96, w: 72, h: 18 };
    const skipCheck = UIHelper.checkButton(skipBtn, input);
    this.tutorialHoverSkip = skipCheck.hovered;
    this.tutorialPressedSkip = skipCheck.pressed;
    if (skipCheck.clicked || input.justPressed('Escape')) {
      this._endTutorial();
      return;
    }

    if (!this.tutorialDummy) {
      this._initTutorial();
    }

    // Keep live world updating with accurate camera screenToWorld transform
    this.combatScene.player.update(dt, input, this.combatScene.map, { camera: this.combatScene.camera });
    this.combatScene.particles.update(dt);
    this.combatScene._fireArtifactProjectiles(dt);
    this.combatScene._updateProjectiles(dt);

    const arena = this.combatScene.map.getArenaPixelSize();
    this.combatScene.camera.follow(this.combatScene.player.x, this.combatScene.player.y, arena.w, arena.h);
    this.combatScene.camera.update(dt);

    if (this.tutorialDummy.hitTimer > 0) {
      this.tutorialDummy.hitTimer -= dt;
    }

    // Player melee attack on dummy
    if (this.combatScene.player.isAttacking) {
      this.combatScene._handlePlayerAttack();
    }
    // Ranged class attacks must reach the practice target in the tutorial too.
    this.combatScene._updateProjectiles(dt);

    // Player skill on dummy
    if (input.justPressed('KeyQ')) {
      this.combatScene._useSkill();
    }

    // Magnet and pickup XP orbs
    this.combatScene._pickupOrbs();

    const move = input.getMoveVector();

    // Step 0: Move towards dummy
    if (this.tutorialStep === 0) {
      const dist = Math.hypot(this.combatScene.player.x - this.tutorialDummy.x, this.combatScene.player.y - this.tutorialDummy.y);
      if (dist < 46 || (Math.abs(move.x) > 0.1 || Math.abs(move.y) > 0.1)) {
        this.tutorialMoved = true;
        this.tutorialStep = 1;
        this.audio.playSfx('levelup');
      }
      return;
    }

    // Step 1: Hit dummy
    if (this.tutorialStep === 1) {
      if (this.tutorialDummy.isDead) {
        this.tutorialAttacked = true;
        this.tutorialStep = 2;
        this.audio.playSfx('levelup');
      }
      return;
    }

    // Step 2: Dash
    if (this.tutorialStep === 2) {
      if (this.combatScene.player.isDashing) {
        this.tutorialDashed = true;
        this.tutorialStep = 3;
        this.audio.playSfx('levelup');
      }
      return;
    }

    // Step 3: Pick up dropped XP orb
    if (this.tutorialStep === 3) {
      if (this.combatScene.pendingLevelUps.length > 0 || this.combatScene.player.level > 1) {
        this.tutorialStep = 4;
        if (this.combatScene.pendingLevelUps.length > 0) {
          this.combatScene.pendingLevelUps.shift();
        }
        this.showUpgrade(this.combatScene.player);
      }
      return;
    }

    // Step 4: Pick upgrade (handled upon return in resumeFromUpgrade)
  }

  _drawTutorial(ctx) {
    const W = INTERNAL_W;
    const bannerW = 320, bannerH = 44;
    const bx = (W - bannerW) / 2, by = 48;
    const isTouch = this.input?.isTouchDevice || false;

    ctx.save();
    // Sleek dark banner with amber outline placed cleanly below top HUD
    ctx.fillStyle = 'rgba(12, 16, 28, 0.94)';
    ctx.fillRect(bx, by, bannerW, bannerH);
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(bx + 0.5, by + 0.5, bannerW - 1, bannerH - 1);

    // Accent corners
    ctx.fillStyle = '#f59e0b';
    ctx.fillRect(bx - 2, by - 2, 4, 4);
    ctx.fillRect(bx + bannerW - 2, by - 2, 4, 4);
    ctx.fillRect(bx - 2, by + bannerH - 2, 4, 4);
    ctx.fillRect(bx + bannerW - 2, by + bannerH - 2, 4, 4);

    ctx.textAlign = 'center';
    let stepTitle = '';
    let stepDesc = '';

    if (this.tutorialStep === 0) {
      stepTitle = 'HƯỚNG DẪN [1/4] — DI CHUYỂN';
      stepDesc = isTouch
        ? 'Dùng cần gạt ảo (bên trái) để di chuyển lại gần Bù nhìn'
        : 'Dùng WASD / Phím mũi tên để di chuyển lại gần Bù nhìn';
    } else if (this.tutorialStep === 1) {
      stepTitle = 'HƯỚNG DẪN [2/4] — TẤN CÔNG ĐÁNH TRÚNG';
      stepDesc = isTouch
        ? 'Chạm nút CHÉM hướng vào Bù nhìn để tấn công mục tiêu!'
        : 'Giữ Chuột Trái (hoặc phím J/F) hướng vào Bù nhìn để đánh liên tục!';
    } else if (this.tutorialStep === 2) {
      stepTitle = 'HƯỚNG DẪN [3/4] — LƯỚT NÉ ĐÒN';
      stepDesc = isTouch
        ? 'Chạm nút LƯỚT để lướt nhanh và bất tử tạm thời'
        : 'Nhấn phím SPACE để lướt né đòn và bất tử tạm thời';
    } else if (this.tutorialStep === 3) {
      stepTitle = 'HƯỚNG DẪN [4/4] — THU THẬP KINH NGHIỆM';
      stepDesc = 'Di chuyển lại gần để hút và nhặt Hạt Kinh Nghiệm [XP]!';
    } else {
      stepTitle = '★ CHỌN NÂNG CẤP CHIẾN BINH ★';
      stepDesc = 'Hãy chọn 1 nâng cấp sức mạnh để sẵn sàng chiến đấu!';
    }

    ctx.fillStyle = '#f59e0b';
    ctx.font = `bold 10px ${UI_FONT}`;
    ctx.fillText(stepTitle, W / 2, by + 16);

    ctx.fillStyle = '#f1f5f9';
    ctx.font = `8.5px ${UI_FONT}`;
    ctx.fillText(stepDesc, W / 2, by + 31);

    // On-screen skip button placed right below banner
    UIHelper.drawButton(ctx, {
      x: W / 2 - 36,
      y: by + bannerH + 4,
      w: 72,
      h: 18,
      label: 'BỎ QUA',
      hovered: this.tutorialHoverSkip,
      pressed: this.tutorialPressedSkip,
      variant: 'subtle',
    });

    ctx.restore();
  }

  // ---- Scene Management ----

  /** Returns the currently active scene instance for external inspection. */
  get activeScene() {
    if (this.showingUpgrade) return this.upgradeScene;
    if (this.showingStageComplete) return this.stageCompleteScene;
    if (this.showingArtifactSelect) return this.artifactSelectScene;
    if (this.paused) return this.pauseOverlay;
    switch (this.currentScene) {
      case 'menu': return this.menuScene;
      case 'combat': return this.combatScene;
      case 'shop': return this.shopScene;
      case 'gameover': return this.gameOverScene;
      case 'victory': return this.victoryScene;
      case 'hub': return this.hubScene;
      case 'settings': return this.settingsScene;
      default: return null;
    }
  }

  /** Convenience: navigate to SettingsScene (from menu by default). */
  showSettings(returnTo = 'menu') {
    this.openSettings(returnTo);
  }

  /** Convenience: navigate to MenuScene. */
  showMenu() {
    this.switchScene('menu');
  }

  /** Convenience: navigate to HubScene. */
  showHub() {
    this.switchScene('hub');
  }

  /** Convenience: show ClassSelectScene modal overlay. */
  showClassSelect(cb) {
    this.showingClassSelect = true;
    this.classSelectScene.show(cb || ((classId) => this.startRun(classId)));
  }

  /** Convenience: alias for startNewRun(artifactId). */
  startRun(artifactId) {
    this.startNewRun(artifactId);
  }

  switchScene(name) {
    this.currentScene = name;
    this.paused = false;
    this.showingUpgrade = false;
    this.showingStageComplete = false;
    this.showingArtifactSelect = false;
    this.showingClassSelect = false;
    this.settingsReturnTo = null;
    switch (name) {
      case 'menu':
        this.audio.playBgm(this.assets.getAudio('bgm_title'), 'bgm_title');
        break;
      case 'hub':
        this.hubScene.show();
        this.audio.playBgm(this.assets.getAudio('bgm_shop'), 'bgm_shop');
        break;
      case 'settings':
        break;
    }
  }

  openSettings(returnTo = 'menu') {
    this.settingsReturnTo = returnTo;
    this.currentScene = 'settings';
    this.paused = false;
  }

  returnFromSettings() {
    this.saveManager.save(this.meta);
    if (this.settingsReturnTo === 'pause') {
      this.currentScene = 'combat';
      this.paused = true;
      this.pauseOverlay.selected = 1;
    } else {
      this.switchScene(this.settingsReturnTo || 'menu');
    }
    this.settingsReturnTo = null;
  }

  abandonRun() {
    this.paused = false;
    this.switchScene('menu');
  }

  // ---- Run Management ----
  continueSavedRun() {
    const cp = this.meta?.checkpoint;
    if (!cp) return this.startNewRun();
    // Continue does NOT increment totalRuns
    const player = new Player(this.assets, 0, 0);
    player.initUpgradeStats();
    player.deserialize(cp.player);
    player.recalcStats();
    this.runState = {
      player,
      currentStage: cp.currentStage,
      seed: cp.seed,
      curseTime: cp.curseTime || 0,
      ashEarned: cp.ashEarned || 0,
    };
    this._startStage(cp.currentStage);
  }

  startNewRun(chosenArtifactId, chosenClassId) {
    // New Run: increment totalRuns and save immediately
    this.meta.stats.totalRuns++;
    // Clear old checkpoint immediately
    this.saveManager.clearCheckpoint(this.meta);
    this.saveManager.save(this.meta);

    const player = new Player(this.assets, 0, 0);
    player.initUpgradeStats();
    // Apply meta unlocks
    player.applyMetaUnlocks(this.meta.unlocks);
    player.freeRerolls = 1 + (this.meta.unlocks.bagSlot ? 1 : 0);
    player.rerolls = player.freeRerolls;

    this.runState = { player, currentStage: 0, seed: Math.floor(Math.random() * 99999), curseTime: 0, ashEarned: 0 };

    // Step 1: Class selection (if no class chosen yet)
    if (!chosenClassId) {
      if (this.classSelectScene) {
        this.showingClassSelect = true;
        this.classSelectScene.show((classId) => {
          this.showingClassSelect = false;
          (this._onClassChosen || Game.prototype._onClassChosen).call(this, classId, chosenArtifactId);
        });
        return;
      }
    }

    (this._onClassChosen || Game.prototype._onClassChosen).call(this, chosenClassId, chosenArtifactId);
  }

  _onClassChosen(classId, chosenArtifactId) {
    const player = this.runState.player;
    // Apply chosen class if provided
    if (classId) {
      player.applyClass(classId);
    }
    player.recalcStats();
    player.hp = player.maxHp;

    // Step 2: Weapon selection
    const classDef = CLASSES[classId];
    const classWeapon = classDef?.startWeapon;

    if (chosenArtifactId) {
      player.artifacts.push({ id: chosenArtifactId, level: 1 });
      this._finishNewRun(player);
      return;
    }

    if (classWeapon) {
      player.artifacts.push({ id: classWeapon, level: 1 });
      this._finishNewRun(player);
      return;
    }

    const unlocked = this.meta?.unlocks?.artifacts;
    if (unlocked && unlocked.length > 1 && this.artifactSelectScene) {
      this.showingArtifactSelect = true;
      this.artifactSelectScene.show(unlocked);
    } else if (unlocked && unlocked.length === 1) {
      player.artifacts.push({ id: unlocked[0], level: 1 });
      this._finishNewRun(player);
    } else {
      player.artifacts.push({ id: 'fire_staff', level: 1 });
      this._finishNewRun(player);
    }
  }

  onArtifactSelected(artifactId) {
    this.showingArtifactSelect = false;
    this.runState.player.artifacts.push({ id: artifactId, level: 1 });
    this._finishNewRun(this.runState.player);
  }

  _finishNewRun(player) {
    this.runState = {
      player,
      currentStage: 0,
      seed: this.runState?.seed || Math.floor(Math.random() * 99999),
      curseTime: 0,
      ashEarned: 0,
    };
    this._startStage(0);
    if (!this.meta.seenTutorial) {
      this._initTutorial();
    } else {
      this.showingTutorial = false;
    }
  }

  _startStage(stageIdx) {
    this.runState.currentStage = stageIdx;
    this.combatScene.curseTime = this.runState.curseTime;
    this.combatScene.startStage(this.runState.player, stageIdx, this.runState.seed + stageIdx);
    this.currentScene = 'combat';
    this.paused = false;
    this.showingUpgrade = false;
    this.showingStageComplete = false;
    this.showingClassSelect = false;
  }

  proceedToNextStage() {
    this.showingStageComplete = false;

    // Award all pending level ups before transitioning to next stage or shop
    if (this.combatScene?.pendingLevelUps?.length > 0) {
      this._advanceAfterUpgrades = true;
      this.combatScene.pendingLevelUps.shift();
      this.showUpgrade(this.runState.player);
      return;
    }

    const nextStage = this.runState.currentStage + 1;
    this.runState.curseTime = this.combatScene.curseTime;
    this.runState.ashEarned += this.combatScene.stageAsh;
    // Save checkpoint with all upgrades processed
    this.saveManager.saveCheckpoint(this.meta, {
      player: this.runState.player.serialize(),
      currentStage: nextStage,
      seed: this.runState.seed,
      curseTime: this.runState.curseTime,
      ashEarned: this.runState.ashEarned,
    });
    // Check if run complete
    if (nextStage >= TOTAL_STAGES) {
      this._onRunWin();
      return;
    }
    // Shop between chapters
    const prevChapter = Math.floor(this.runState.currentStage / STAGES_PER_CHAPTER);
    const nextChapter = Math.floor(nextStage / STAGES_PER_CHAPTER);
    if (nextChapter > prevChapter && nextStage < TOTAL_STAGES) {
      this.shopScene.show(this.runState.player);
      this.currentScene = 'shop';
      this.audio.playBgm(this.assets.getAudio('bgm_shop'), 'bgm_shop');
      return;
    }
    this._startStage(nextStage);
  }

  resumeFromShop() {
    this._startStage(this.runState.currentStage + 1);
  }

  _onRunWin() {
    const ash = this.runState.ashEarned + ASH_WIN_BONUS;
    this.meta.ashSeeds += ash;
    this.meta.stats.wins++;
    this.meta.stats.bestStage = Math.max(this.meta.stats.bestStage, TOTAL_STAGES);
    this.saveManager.clearCheckpoint(this.meta);
    this.saveManager.save(this.meta);
    this.victoryScene.show(ash);
    this.switchScene('victory');
  }

  // ---- Overlays ----
  showUpgrade(player) {
    // Check if this level triggers a class skill choice
    const classChoice = player.getClassSkillChoice();
    if (classChoice && !player.classSkills.some(s => classChoice.options.some(o => o.id === s.id))) {
      // Show class skill choice instead of normal upgrade
      this.showingUpgrade = true;
      this.upgradeScene.showClassSkillChoice(player, classChoice);
      return;
    }
    this.showingUpgrade = true;
    this.upgradeScene.show(player);
  }

  resumeFromUpgrade() {
    this.showingUpgrade = false;
    if (this.showingTutorial) {
      this._endTutorial();
      return;
    }
    // If more pending level ups remain, show them in sequence
    if (this.combatScene?.pendingLevelUps?.length > 0) {
      this.combatScene.pendingLevelUps.shift();
      this.showUpgrade(this.runState.player);
      return;
    }
    // If waiting to advance to next stage/shop after level ups
    if (this._advanceAfterUpgrades) {
      this._advanceAfterUpgrades = false;
      this.proceedToNextStage();
    }
  }

  showPause() {
    this.paused = true;
    this.pauseOverlay.selected = 0;
  }

  resumeFromPause() {
    this.paused = false;
  }

  showGameOver(reason, stage) {
    this.gameOverScene.show(reason, stage);
    this.switchScene('gameover');
  }

  showStageComplete(result) {
    this.showingStageComplete = true;
    this.stageCompleteScene.show(result);
  }

  startGreedHarvest() {
    this.showingStageComplete = false;
    this.combatScene.startGreedHarvest();
  }
}
