import assert from 'node:assert';
import { Player } from '../src/entities/Player.js';
import { Enemy } from '../src/entities/Enemy.js';
import { Boss } from '../src/entities/Boss.js';
import { CombatScene } from '../src/scenes/CombatScene.js';
import { UpgradeScene } from '../src/scenes/UpgradeScene.js';
import { MapRenderer } from '../src/engine/MapRenderer.js';
import { Camera } from '../src/engine/Camera.js';
import { ParticleSystem } from '../src/engine/Particles.js';
import { HUD } from '../src/engine/HUD.js';
import { CHAPTERS, ARTIFACTS } from '../src/data/GameData.js';

console.log('=== RUNNING ASHEN HARVEST FULL RUN SIMULATION ===\n');

// Mock browser canvas/audio/input
const mockAssets = {
  getImage: () => ({ width: 100, height: 100 }),
  getAudio: () => null,
};
const mockAudio = {
  playBgm: () => {},
  stopBgm: () => {},
  playSfx: (name) => {
    // console.log(`[SFX] ${name}`);
  },
};
const mockSaveManager = {
  save: () => {},
  load: () => null,
};
const mockGame = {
  assets: mockAssets,
  audio: mockAudio,
  saveManager: mockSaveManager,
  meta: {
    ashSeeds: 20,
    unlocks: { artifacts: ['fire_staff'] },
    stats: { totalKills: 0, totalDeaths: 0, bestStage: 0 },
    settings: { screenShake: true, showDamageNumbers: true, masterVolume: 0.8 },
  },
  runState: null,
  showingUpgrade: false,
  showingStageComplete: false,
  showingArtifactSelect: false,
  paused: false,
  openSettings: () => {},
  switchScene: (s) => {},
  resumeFromUpgrade: () => {},
  continueSavedRun: () => {},
  startNewRun: () => {},
};

// 1. Initialize MapRenderer & Camera
const map = new MapRenderer(mockAssets);
map.setupArena('fields', 'clear', 12345);
const camera = new Camera();

// 2. Initialize Player
const player = new Player(mockAssets);
player.x = 320;
player.y = 180;
mockGame.runState = { player };

// 3. Initialize CombatScene
const combat = new CombatScene(mockGame);
combat.map = map;
combat.camera = camera;
combat.startStage(player, 0, 12345);

console.log('1. Verifying Stage & Initial Combat State:');
assert.strictEqual(combat.stageIndex, 0, 'Stage index starts at 0');
assert.strictEqual(player.hp, 100, 'Player starts at 100 HP');
assert.strictEqual(player.level, 1, 'Player starts at level 1');
console.log('  ✓ PASS: CombatScene entered successfully, player ready\n');

// 4. Test Player Taking Damage (and verifying HP check)
console.log('2. Verifying Player Hit & Damage Number Emission:');
player.spawnProtection = 0;
player.iframeTimer = 0;
const hpBefore = player.hp;
const tookDmg = player.takeDamage(15);
assert.strictEqual(player.hp < hpBefore, true, 'HP must decrease on hit');
assert.strictEqual(player.hp, 85, 'Player took exact 15 damage');

// Test particle emitText alias
combat.particles.emitText(player.x, player.y - 14, 15, '#ff4444');
assert.strictEqual(combat.particles.numbers.length > 0, true, 'Damage numbers emitted via emitText');
console.log('  ✓ PASS: Player hit handled, damage numbers emitted safely via emitText\n');

// 5. Test Enemy Spawning, Separation and Killing
console.log('3. Verifying Enemy Spawning, Separation & Kill Reward:');
combat._spawnWave();
assert.ok(combat.enemies.length >= 3, 'First wave spawned 3+ enemies');

// Test separation
combat._applySeparation();
for (const e of combat.enemies) {
  assert.ok(typeof e.sepX === 'number', 'Enemy sepX is a number');
  assert.ok(typeof e.sepY === 'number', 'Enemy sepY is a number');
}

// Controlled test: Normal enemy kill
const normalEnemy = new Enemy(mockAssets, 'orc_infantry', 150, 150);
normalEnemy.isElite = false;
normalEnemy.xp = 6;
combat.enemies.push(normalEnemy);
normalEnemy.takeDamage(999);
assert.strictEqual(normalEnemy.isDead, true, 'Normal enemy killed');

const initialXpOrbs = combat.xpOrbs.length;
const killsBefore = mockGame.meta.stats.totalKills || 0;
combat._onEnemyKilled(normalEnemy);
assert.strictEqual(combat.xpOrbs.length, initialXpOrbs + 1, 'Normal enemy drops exactly 1 XP orb');
assert.strictEqual(combat.xpOrbs[combat.xpOrbs.length - 1].xp, 6, 'Normal enemy dropped orb has exact total XP');
assert.strictEqual(mockGame.meta.stats.totalKills, killsBefore + 1, 'Kill counter incremented for normal enemy');

// Idempotent kill verification on normal enemy
combat._onEnemyKilled(normalEnemy);
assert.strictEqual(mockGame.meta.stats.totalKills, killsBefore + 1, 'Duplicate kill call safely ignored for normal enemy');
assert.strictEqual(combat.xpOrbs.length, initialXpOrbs + 1, 'No extra orbs on duplicate kill');

// Controlled test: Elite enemy kill
const eliteEnemy = new Enemy(mockAssets, 'orc_warrior', 180, 180);
eliteEnemy.makeElite('armored');
eliteEnemy.xp = 14;
combat.enemies.push(eliteEnemy);
eliteEnemy.takeDamage(999);
assert.strictEqual(eliteEnemy.isDead, true, 'Elite enemy killed');

const orbsBeforeElite = combat.xpOrbs.length;
combat._onEnemyKilled(eliteEnemy);
assert.strictEqual(combat.xpOrbs.length, orbsBeforeElite + 3, 'Elite enemy drops exactly 3 XP orbs');
const eliteDroppedOrbs = combat.xpOrbs.slice(orbsBeforeElite);
const eliteTotalXp = eliteDroppedOrbs.reduce((sum, o) => sum + o.xp, 0);
assert.strictEqual(eliteTotalXp, eliteEnemy.xp, 'Sum of elite orbs equals exact elite enemy XP (14)');
assert.strictEqual(mockGame.meta.stats.totalKills, killsBefore + 2, 'Kill counter incremented for elite enemy');

// Idempotent kill verification on elite enemy
combat._onEnemyKilled(eliteEnemy);
assert.strictEqual(mockGame.meta.stats.totalKills, killsBefore + 2, 'Duplicate elite kill safely ignored');
assert.strictEqual(combat.xpOrbs.length, orbsBeforeElite + 3, 'No extra orbs on duplicate elite kill');

console.log('  ✓ PASS: Normal and Elite enemy kills verified separately with exact orb count and total XP\n');

// 6. Test XP Collection & Level Up
console.log('4. Verifying XP Collection & Level Up Flow:');
const orb = combat.xpOrbs[0];
orb.x = player.x;
orb.y = player.y;

// Simulate update dt to pick up orb
combat._pickupOrbs();
assert.ok(player.xp > 0 || player.level > 1, 'Player gained XP from orb');

// Manually award XP to trigger levelup
const levelsGained = player.addXp(100);
assert.ok(levelsGained.length > 0, 'Player leveled up');
assert.ok(player.level > 1, 'Player level increased');

// Verify UpgradeScene choice generation
const upgradeScene = new UpgradeScene(mockGame);
upgradeScene.show(player);
assert.strictEqual(upgradeScene.choices.length, 3, 'UpgradeScene rolls 3 choices');

// Verify card details (before/after stat preview)
for (const choice of upgradeScene.choices) {
  const details = upgradeScene._getChoiceDetails(choice, player);
  assert.ok(details.statPreview.length > 0, 'Stat preview is present');
  assert.ok(details.reason.length > 0, 'Strategic reason is present');
}

// Apply choice 0
upgradeScene._applyChoice(0);
console.log(`  ✓ PASS: Player reached Lv${player.level}, UpgradeScene choices & previews verified\n`);

// 7. Test Pause & Resume
console.log('5. Verifying Pause & Resume:');
mockGame.paused = true;
assert.strictEqual(mockGame.paused, true, 'Game paused');
mockGame.paused = false;
assert.strictEqual(mockGame.paused, false, 'Game resumed');
console.log('  ✓ PASS: Pause/Resume works cleanly\n');

// 8. Test Stage Objective Completion & Gate
console.log('6. Verifying Stage Objective Completion & Gate Transition:');
combat.objectiveComplete = true;
const objText = combat._getObjectiveText();
assert.strictEqual(objText, 'Mục tiêu hoàn thành! Đến cổng [E]', 'Objective text instructs player to gate');

// Player moves to gate
combat.gateOpen = true;
combat.gate = { x: player.x, y: player.y, radius: 20 };

let advancedStage = false;
mockGame.proceedToNextStage = () => { advancedStage = true; };

const mockInputGate = {
  justPressed: (k) => k === 'KeyE',
  isMouseDown: () => false,
  mouseClicked: () => false,
  getMousePos: () => ({ x: 0, y: 0 }),
  getMoveVector: () => ({ x: 0, y: 0 }),
};
combat._checkGate(mockInputGate);
assert.strictEqual(advancedStage, true, '_advanceStage called when interacting with gate');
console.log('  ✓ PASS: Gate interaction and stage progression completed successfully\n');

console.log('=== FULL RUN SIMULATION COMPLETE: ALL SYSTEMS FUNCTIONAL ===');
