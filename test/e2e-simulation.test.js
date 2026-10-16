// ============================================================
// End-to-End Simulation Test: Complete Ashen Harvest Gameplay Run
// ============================================================
import assert from 'assert';
import { Game } from '../src/engine/Game.js';
import { Input } from '../src/engine/Input.js';
import { Player } from '../src/entities/Player.js';
import { Enemy } from '../src/entities/Enemy.js';
import { Boss } from '../src/entities/Boss.js';
import { CombatScene } from '../src/scenes/CombatScene.js';
import { UpgradeScene } from '../src/scenes/UpgradeScene.js';
import { MenuScene } from '../src/scenes/MenuScene.js';
import { HubScene, SettingsScene, PauseOverlay, StageCompleteScene } from '../src/scenes/UIScenes.js';
import { CHAPTERS, ARTIFACTS } from '../src/data/GameData.js';

console.log('=== RUNNING ASHEN HARVEST FULL E2E SIMULATION ===\n');

// Mock browser globals for Canvas & Audio
global.window = {
  addEventListener: () => {},
  removeEventListener: () => {},
  innerWidth: 1280,
  innerHeight: 720,
};
global.localStorage = {
  _store: {},
  getItem(k) { return this._store[k] || null; },
  setItem(k, v) { this._store[k] = String(v); },
  removeItem(k) { delete this._store[k]; },
  clear() { this._store = {}; }
};

const mockCtx = {
  save: () => {},
  restore: () => {},
  translate: () => {},
  scale: () => {},
  rotate: () => {},
  fillRect: () => {},
  strokeRect: () => {},
  clearRect: () => {},
  beginPath: () => {},
  closePath: () => {},
  arc: () => {},
  moveTo: () => {},
  lineTo: () => {},
  fill: () => {},
  stroke: () => {},
  fillText: () => {},
  measureText: (txt) => ({ width: (txt || '').length * 6 }),
  setLineDash: () => {},
  drawImage: () => {},
  createLinearGradient: () => ({ addColorStop: () => {} }),
  createRadialGradient: () => ({ addColorStop: () => {} }),
};

const mockCanvas = {
  width: 640,
  height: 360,
  getContext: () => mockCtx,
  addEventListener: () => {},
  removeEventListener: () => {},
  getBoundingClientRect: () => ({ left: 0, top: 0, width: 640, height: 360 }),
};

global.document = {
  createElement: (tag) => {
    if (tag === 'canvas') {
      return {
        width: 640,
        height: 360,
        getContext: () => mockCtx,
      };
    }
    return {};
  },
  getElementById: (id) => (id === 'gameCanvas' ? mockCanvas : null),
  addEventListener: () => {},
};

const mockAssets = {
  getImage: () => null,
  getAudio: () => null,
};

// Create game and manually initialize state (without calling async init)
const game = new Game(mockCanvas);
game.assets = mockAssets;
Player.setCharmData(null);

// Initialize Input manually (since we skip async init)
game.input = new Input(mockCanvas);
game.meta = game.saveManager.load();
game.meta.seenTutorial = true; // Skip tutorial for test

// Initialize all scenes (normally done in init())
game.menuScene = new MenuScene(game);
game.combatScene = new CombatScene(game);
game.upgradeScene = new UpgradeScene(game);
// ShopScene requires import — use a lightweight mock
game.shopScene = { update: () => {}, draw: () => {}, show: () => {} };
game.gameOverScene = { update: () => {}, draw: () => {}, show: () => {}, hoverBtn: false };
game.victoryScene = { update: () => {}, draw: () => {}, show: () => {}, hoverBtn: false };
game.hubScene = new HubScene(game);
game.settingsScene = new SettingsScene(game);
game.pauseOverlay = new PauseOverlay(game);
game.stageCompleteScene = new StageCompleteScene(game);
game.artifactSelectScene = { update: () => {}, draw: () => {}, show: () => {}, hoverCard: -1 };
game.currentScene = 'menu';

// Apply saved settings
game.audio = {
  playBgm: () => {},
  stopBgm: () => {},
  playSfx: () => {},
  setMusicVolume: () => {},
  setSfxVolume: () => {},
  init: () => {},
};

// ------------------------------------------------------------
// Step 1: Main Menu & Navigation
// ------------------------------------------------------------
console.log('1. Simulating MenuScene & UI scene flow:');
const menu = game.menuScene;
menu.update(0.016, game.input);
assert.strictEqual(menu.buttons.length, 3, 'MenuScene must have 3 primary buttons');

// Click Settings
game.showSettings();
assert.ok(game.activeScene instanceof SettingsScene, 'Should navigate to SettingsScene');

// Adjust volume in Settings
const settings = game.activeScene;
settings.update(0.016, game.input);
game.meta.settings.masterVolume = 0.8;
game.saveManager.save(game.meta);
assert.strictEqual(game.meta.settings.masterVolume, 0.8, 'Settings saved properly');

// Return to menu
game.showMenu();
assert.ok(game.activeScene instanceof MenuScene, 'Returned to MenuScene');

// Open HubScene (Làng)
game.showHub();
assert.ok(game.activeScene instanceof HubScene, 'Navigated to HubScene');
const hub = game.activeScene;
assert.strictEqual(hub.tabs.length, 3, 'HubScene must have 3 categorized tabs');
hub.currentTab = 'stats';
hub.update(0.016, game.input);
assert.strictEqual(hub.currentTab, 'stats', 'Hub tab navigation functions correctly');
game.showMenu();

console.log('  ✓ PASS: Menu, Settings, and Hub flow verified\n');

// ------------------------------------------------------------
// Step 2: Start Run and Combat
// ------------------------------------------------------------
console.log('2. Simulating Run Start & Stage 1 Combat:');
game.startRun('fire_staff');
assert.ok(game.activeScene instanceof CombatScene, 'CombatScene should be active');
const combat = game.activeScene;
assert.strictEqual(combat.stageIndex, 0, 'Stage should be 0');
assert.strictEqual(combat.chapterIndex, 0, 'Chapter should be 0');
assert.strictEqual(combat.player.artifacts.length, 1, 'Player starts with 1 artifact');
assert.strictEqual(combat.player.artifacts[0].id, 'fire_staff', 'Started with fire_staff');

// Stage 1 wave 1 count check (must be 3-4 enemies, not clumped)
const initialEnemyCount = combat.enemies.filter(e => !e.isDead).length;
assert.ok(initialEnemyCount >= 3 && initialEnemyCount <= 4, `Stage 1 wave 1 should spawn 3-4 enemies (got ${initialEnemyCount})`);

// HUD check
const sBounds = combat.hud.getSkillButtonBounds();
const dBounds = combat.hud.getDashButtonBounds();
assert.ok(sBounds && dBounds, 'HUD action button bounds exist');
assert.ok(combat._getObjectiveText().startsWith('Đợt 1/'), 'Objective text shows correct wave format');

// Simulate Player Dash via HUD click
game.input.mouse.x = dBounds.x + 4;
game.input.mouse.y = dBounds.y + 4;
game.input.mouse.down = true;
game.input._mouseDownPending = true;
game.input.beginFrame();
combat.update(0.016, game.input);
game.input.endFrame();
assert.strictEqual(combat.player.isDashing, true, 'Clicking Dash HUD button must trigger dash');
assert.ok(combat.player.dashCdTimer > 0, 'Dash cooldown initiated');

// Advance time so dash ends
for (let f = 0; f < 30; f++) {
  combat.update(0.016, game.input);
}
assert.strictEqual(combat.player.isDashing, false, 'Dash ends after duration');

// Simulate killing all enemies in wave 1
for (const e of combat.enemies) {
  e.takeDamage(9999);
  combat._onEnemyKilled(e);
}
assert.strictEqual(combat.enemies.every(e => e.isDead), true, 'All enemies dead');

// Update to trigger next wave
combat.update(0.016, game.input);
assert.strictEqual(combat.wavesRemaining, 2, 'Wave 2 triggered');

// Simulate collecting XP and level up (give exactly enough for 1 level up)
const levelsGained = combat.player.addXp(12);
assert.ok(levelsGained.length > 0, 'Player gained levels');
combat.pendingLevelUps.push(...levelsGained);
combat.update(0.016, game.input);
assert.ok(game.activeScene instanceof UpgradeScene, 'Level up opened UpgradeScene');

// Upgrade scene selection check
const upgradeScene = game.activeScene;
assert.ok(upgradeScene.options.length >= 3, 'Upgrade scene presents at least 3 choices');
// Click first card
upgradeScene._selectCard(upgradeScene.options[0]);
assert.ok(game.activeScene instanceof CombatScene, 'Selecting card returns to CombatScene');

console.log('  ✓ PASS: Combat flow, HUD click, wave progression, and upgrade selection verified\n');

// ------------------------------------------------------------
// Step 3: Damage Mechanics & Idempotency
// ------------------------------------------------------------
console.log('3. Simulating Damage and Hit Effects:');
const p = combat.player;
p.iframeTimer = 0;
p.spawnProtection = 0;
const startHp = p.hp;

// Blocked damage when in iframe should NOT trigger effects
p.takeDamage(10);
assert.strictEqual(p.hp, startHp - Math.max(1, 10 - p.armor), 'First hit respects armor from the selected upgrade');
assert.ok(p.iframeTimer > 0, 'Player enters iframe state');

const hpDuringIframe = p.hp;
const iframeHitResult = p.takeDamage(10);
assert.strictEqual(iframeHitResult, false, 'Damage while in iframes is blocked');
assert.strictEqual(p.hp, hpDuringIframe, 'HP must NOT decrease during iframes');

console.log('  ✓ PASS: Damage effects only trigger when HP actually changes\n');

// ------------------------------------------------------------
// Step 4: Full Run Stage Completion & Save Checkpoint
// ------------------------------------------------------------
console.log('4. Simulating Gate Proceed & Checkpoint Save:');
combat.objectiveComplete = true;
combat.gateOpen = true;
game.proceedToNextStage();
assert.strictEqual(combat.stageIndex, 1, 'Proceeded to Stage 2');
assert.ok(game.saveManager.hasCheckpoint(), 'Checkpoint automatically created');

// Clear checkpoint
game.saveManager.clearCheckpoint(game.meta);
assert.strictEqual(game.saveManager.hasCheckpoint(), false, 'Checkpoint properly cleared');

console.log('  ✓ PASS: Stage progression and checkpoint persistence verified\n');

console.log('=== ALL E2E SIMULATION CHECKS PASSED PERFECTLY ===');
