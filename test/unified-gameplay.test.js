// ============================================================
// Unified Gameplay & Systems Integration Test
// ============================================================
import assert from 'assert';
import * as C from '../src/engine/Constants.js';
import { ARTIFACTS, CHARMS, ENEMIES, BOSSES } from '../src/data/GameData.js';
import { Player } from '../src/entities/Player.js';
import { Enemy } from '../src/entities/Enemy.js';
import { Boss } from '../src/entities/Boss.js';
import { SaveManager } from '../src/engine/SaveManager.js';
import { AudioManager } from '../src/engine/AudioManager.js';
import { CombatScene } from '../src/scenes/CombatScene.js';
import { Game } from '../src/engine/Game.js';

console.log('=== RUNNING ASHEN HARVEST UNIFIED GAMEPLAY & SYSTEMS VERIFICATION ===\n');

const mockAssets = {
  getImage: () => null,
  getAudio: () => null,
};

// ------------------------------------------------------------
// 1. Unified Enemy Death & Idempotency
// ------------------------------------------------------------
console.log('1. Verifying Unified Enemy Death & Reward Idempotency:');
const dummyGame = {
  assets: mockAssets,
  audio: { playSfx: () => {}, playBgm: () => {} },
  meta: { stats: { totalKills: 0 }, settings: { showDamageNumbers: false, screenShake: false } },
  showStageComplete: () => {},
};

const combat = new CombatScene(dummyGame);
combat.player = new Player(mockAssets, 100, 100);
combat.player.initUpgradeStats();

const enemy = new Enemy(mockAssets, 'orc_infantry', 120, 100);
combat.enemies.push(enemy);

const initialGold = combat.player.gold;
const initialStageGold = combat.stageGold;
const initialTotalKills = dummyGame.meta.stats.totalKills;

// Deal lethal damage
const killedFirst = enemy.takeDamage(enemy.maxHp * 2);
assert.strictEqual(killedFirst, true, 'First lethal damage should report killed');
assert.strictEqual(enemy.isDead, true, 'Enemy should be marked isDead');

// Process kill
combat._onEnemyKilled(enemy);
assert.strictEqual(enemy._deathProcessed, true, '_deathProcessed should be true');
assert.strictEqual(combat.stageGold, initialStageGold + enemy.gold, 'Stage gold should increase by enemy gold');
assert.strictEqual(combat.player.gold, initialGold + enemy.gold, 'Player gold should increase by enemy gold');
assert.strictEqual(dummyGame.meta.stats.totalKills, initialTotalKills + 1, 'Total kills should increment by 1');
assert.strictEqual(combat.xpOrbs.length, 1, '1 XP orb should be spawned');

// Attempt duplicate kill processing
const killedSecond = enemy.takeDamage(50);
assert.strictEqual(killedSecond, false, 'Subsequent damage on dead enemy should return false');
combat._onEnemyKilled(enemy);
assert.strictEqual(combat.stageGold, initialStageGold + enemy.gold, 'Stage gold should NOT increase on duplicate kill');
assert.strictEqual(combat.player.gold, initialGold + enemy.gold, 'Player gold should NOT increase on duplicate kill');
assert.strictEqual(dummyGame.meta.stats.totalKills, initialTotalKills + 1, 'Total kills should NOT increment again');
assert.strictEqual(combat.xpOrbs.length, 1, 'No extra XP orbs should be spawned');

console.log('  ✓ PASS: Enemy kill handler is strictly idempotent (exact 1 reward per kill)\n');

// ------------------------------------------------------------
// 2. Boss Defeat Flow & Idempotency
// ------------------------------------------------------------
console.log('2. Verifying Boss Defeat Flow & Meta Logging:');
dummyGame.meta.stats.bestStage = 0;
dummyGame.meta.unlocks = { bossLog: [] };
const boss = new Boss(mockAssets, 'orc_chief', 200, 200);
combat.boss = boss;
combat.stageIndex = 3; // Stage 4 (boss of Chapter 1)

let stageCompleteShown = false;
dummyGame.showStageComplete = () => { stageCompleteShown = true; };

// First kill call
combat._onBossKilled(boss);
assert.strictEqual(boss._deathProcessed, true, 'Boss _deathProcessed should be true');
assert.strictEqual(dummyGame.meta.stats.bestStage, 4, 'bestStage should update to 4');
assert.ok(dummyGame.meta.unlocks.bossLog.includes('orc_chief'), 'orc_chief should be logged in bossLog');
assert.strictEqual(stageCompleteShown, true, 'Stage complete dialog should be triggered');

// Duplicate call check
stageCompleteShown = false;
combat._onBossKilled(boss);
assert.strictEqual(stageCompleteShown, false, 'Duplicate boss kill should be a no-op');

console.log('  ✓ PASS: Boss kill properly updates meta progression and triggers once\n');

// ------------------------------------------------------------
// 3. SaveManager Migration & Persistence
// ------------------------------------------------------------
console.log('3. Verifying SaveManager Migration & Resilience:');
const mockStorage = {};
global.localStorage = {
  getItem: (k) => mockStorage[k] || null,
  setItem: (k, v) => { mockStorage[k] = v; },
  removeItem: (k) => { delete mockStorage[k]; },
};

const saveMgr = new SaveManager();
assert.strictEqual(saveMgr.available, true, 'Storage should be available');

// Test loading v1 save without artifacts or bossLog
mockStorage['ashen_harvest_save'] = JSON.stringify({
  version: 1,
  ashSeeds: 25,
  unlocks: { vigor1: true, curseLevel: 3 },
  stats: { totalRuns: 5, totalKills: 120 },
});

const migrated = saveMgr.load();
assert.strictEqual(migrated.version, 2, 'Version should migrate to 2');
assert.strictEqual(migrated.ashSeeds, 25, 'Ash seeds preserved');
assert.strictEqual(migrated.unlocks.vigor1, true, 'Unlocks preserved');
assert.strictEqual(migrated.unlocks.curseLevel, undefined, 'Old obsolete fields removed');
assert.deepStrictEqual(migrated.unlocks.artifacts, ['fire_staff'], 'Default artifacts populated');
assert.deepStrictEqual(migrated.unlocks.bossLog, [], 'Default bossLog populated');
assert.strictEqual(migrated.settings.reducedFlash, false, 'New settings defaulted');

console.log('  ✓ PASS: Save migration from v1 to v2 works seamlessly without data loss\n');

// ------------------------------------------------------------
// 4. AudioManager Interaction & Autoplay Queue
// ------------------------------------------------------------
console.log('4. Verifying AudioManager Autoplay Queue:');
const eventListeners = {};
global.window = global.window || {};
global.window.addEventListener = (event, fn) => {
  eventListeners[event] = fn;
};
global.window.removeEventListener = (event) => {
  delete eventListeners[event];
};

const audioMgr = new AudioManager();
audioMgr.init();

let bgmPlayed = false;
const fakeAudioElement = {
  cloneNode: () => ({
    loop: false,
    volume: 1,
    paused: true,
    play: async () => { bgmPlayed = true; },
  }),
};

// Queue BGM before user has interacted
audioMgr.playBgm(fakeAudioElement, 'title_bgm');
assert.strictEqual(bgmPlayed, false, 'BGM should not play before user interaction');
assert.ok(audioMgr.currentBgm, 'BGM should be queued in audioMgr');

// Simulate user click/touch
if (eventListeners['pointerdown']) {
  eventListeners['pointerdown']();
} else if (eventListeners['click']) {
  eventListeners['click']();
}

assert.strictEqual(audioMgr.userInteracted, true, 'userInteracted should be set to true');
assert.strictEqual(bgmPlayed, true, 'Queued BGM should start immediately on user interaction');

console.log('  ✓ PASS: Audio queues safely and starts on first user gesture\n');

// ------------------------------------------------------------
// 5. Artifact Selection Flow for Multiple Unlocks
// ------------------------------------------------------------
console.log('5. Verifying Starter Artifact Selection:');
const mockGameFull = {
  meta: {
    stats: { totalRuns: 0 },
    unlocks: { artifacts: ['fire_staff', 'frost_staff', 'void_wand'] },
  },
  saveManager: {
    clearCheckpoint: () => {},
    save: () => {},
  },
  assets: mockAssets,
  showingArtifactSelect: false,
  artifactSelectScene: {
    show: (list) => { mockGameFull._shownList = list; },
  },
  _startStage: () => {},
};

Game.prototype.startNewRun.call(mockGameFull);
assert.strictEqual(mockGameFull.meta.stats.totalRuns, 1, 'New run increments totalRuns');
assert.strictEqual(mockGameFull.showingArtifactSelect, true, 'Shows artifact select modal when multiple unlocked');
assert.deepStrictEqual(mockGameFull._shownList, ['fire_staff', 'frost_staff', 'void_wand'], 'All unlocked artifacts presented');

// Single unlock case: auto-picks without modal
const mockGameSingle = {
  meta: {
    stats: { totalRuns: 0 },
    unlocks: { artifacts: ['fire_staff'] },
  },
  saveManager: {
    clearCheckpoint: () => {},
    save: () => {},
  },
  assets: mockAssets,
  showingArtifactSelect: false,
  _finishNewRun: (player) => { mockGameSingle._startedPlayer = player; },
  _startStage: () => {},
};
Game.prototype.startNewRun.call(mockGameSingle);
assert.strictEqual(mockGameSingle.showingArtifactSelect, false, 'Auto-selects artifact when only 1 unlocked');
assert.strictEqual(mockGameSingle._startedPlayer.artifacts[0].id, 'fire_staff', 'Auto-assigned starting artifact is fire_staff');

console.log('  ✓ PASS: Starting artifact selection handles both single and multiple unlocks\n');

console.log('=== ALL UNIFIED GAMEPLAY & SYSTEMS CHECKS PASSED (5/5) ===');
