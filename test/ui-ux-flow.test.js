// ============================================================
// Automated Integration & Verification Test for UI/UX & Flow
// ============================================================
import assert from 'assert';
import { Input } from '../src/engine/Input.js';
import { SpriteSheet } from '../src/engine/SpriteSheet.js';
import { Game } from '../src/engine/Game.js';
import { Player } from '../src/entities/Player.js';
import { Enemy } from '../src/entities/Enemy.js';
import { Boss } from '../src/entities/Boss.js';
import { MapRenderer } from '../src/engine/MapRenderer.js';
import { SettingsScene, PauseOverlay } from '../src/scenes/UIScenes.js';
import { HUD } from '../src/engine/HUD.js';
import { CombatScene } from '../src/scenes/CombatScene.js';

console.log('=== RUNNING ASHEN HARVEST UI/UX & FLOW VERIFICATION ===\n');

// ------------------------------------------------------------
// 1. Test Input click detection
// ------------------------------------------------------------
console.log('1. Verifying Input Click Detection:');
global.window = { addEventListener: () => {} };
const mockCanvas = {
  width: 640, height: 360,
  addEventListener: () => {},
  getBoundingClientRect: () => ({ left: 0, top: 0, width: 640, height: 360 }),
};
const input = new Input(mockCanvas);

// Simulate mouse down
input._mouseDownPending = true;
input.mouse.down = true;
input.beginFrame();
assert.strictEqual(input.mouseClicked(), true, 'Input should detect mouse click on first frame');
input.endFrame();
assert.strictEqual(input.mouseClicked(), false, 'Mouse clicked should reset at end of frame');

// Next frame, mouse still held down
input.beginFrame();
assert.strictEqual(input.mouseClicked(), false, 'Holding mouse down should NOT count as a new click');
input.endFrame();

console.log('  ✓ PASS: Single click and hold click detection behave correctly\n');

// ------------------------------------------------------------
// 2. Test Player, Enemy & Boss draw sizes
// ------------------------------------------------------------
console.log('2. Verifying Entity Draw Sizing:');
const mockAssets = {
  getImage: () => null,
  getAudio: () => null,
};
const player = new Player(mockAssets, 100, 100);
assert.strictEqual(player.drawW, 32, 'Player drawW should be 32');
assert.strictEqual(player.drawH, 32, 'Player drawH should be 32');

const orcEnemy = new Enemy(mockAssets, 'orc_infantry', 100, 100);
assert.strictEqual(orcEnemy.drawW, 34, 'Orc enemy drawW should be 34');
assert.strictEqual(orcEnemy.drawH, 30, 'Orc enemy drawH should be 30');

const orcChief = new Boss(mockAssets, 'orc_chief', 100, 100);
assert.strictEqual(orcChief.drawW, 72, 'Boss orc_chief drawW should be 72 (scaled up from 36*1.5=54)');
assert.strictEqual(orcChief.drawH, 72, 'Boss orc_chief drawH should be 72');

console.log('  ✓ PASS: Player (32x32), Enemy (34x30), Boss (72x72) sizes are prominently scaled\n');

// ------------------------------------------------------------
// 3. Test Scene Transitions & Settings Return
// ------------------------------------------------------------
console.log('3. Verifying Scene Flow (Settings -> Pause -> Combat):');
const mockGame = {
  meta: {
    settings: { musicVolume: 0.8, sfxVolume: 0.8, showDamageNumbers: true, screenShake: true, autoAttack: false },
    checkpoint: null,
  },
  saveManager: { save: () => {} },
  audio: {
    setMusicVolume: () => {},
    setSfxVolume: () => {},
    playBgm: () => {},
    playSfx: () => {},
  },
  assets: mockAssets,
  currentScene: 'combat',
  paused: true,
  settingsReturnTo: null,
  pauseOverlay: { selected: 0 },
  openSettings: Game.prototype.openSettings,
  returnFromSettings: Game.prototype.returnFromSettings,
  abandonRun: Game.prototype.abandonRun,
  switchScene: Game.prototype.switchScene,
};

// Open settings from pause
mockGame.openSettings('pause');
assert.strictEqual(mockGame.currentScene, 'settings', 'Current scene should be settings');
assert.strictEqual(mockGame.settingsReturnTo, 'pause', 'Should remember it came from pause');

// Return from settings
mockGame.returnFromSettings();
assert.strictEqual(mockGame.currentScene, 'combat', 'Returning from settings should restore combat scene');
assert.strictEqual(mockGame.paused, true, 'Game should remain paused');
assert.strictEqual(mockGame.pauseOverlay.selected, 1, 'Pause overlay selection should focus back on Settings option');
assert.strictEqual(mockGame.settingsReturnTo, null, 'settingsReturnTo should be reset');

// Abandon run with confirmation test
const pauseOverlay = new PauseOverlay(mockGame);
assert.strictEqual(pauseOverlay.confirmQuit, false, 'confirmQuit should start false');
// Simulate clicking "✕ Rời về Menu" (option 2)
pauseOverlay.selected = 2;
const mockInputEnter = {
  getMousePos: () => ({ x: 0, y: 0 }),
  justPressed: (k) => k === 'Enter',
  mouseClicked: () => false,
};
pauseOverlay.update(0.016, mockInputEnter);
assert.strictEqual(pauseOverlay.confirmQuit, true, 'Clicking "Về menu" must open confirmation dialog');

// In confirmation dialog: option 0 is "Tiếp tục chơi" (cancel)
pauseOverlay.confirmSelected = 0;
pauseOverlay.update(0.016, mockInputEnter);
assert.strictEqual(pauseOverlay.confirmQuit, false, 'Canceling confirmation should return to pause menu');
assert.strictEqual(mockGame.currentScene, 'combat', 'Canceling should not leave combat');

// In confirmation dialog: option 1 is "Rời về Menu"
pauseOverlay.confirmQuit = true;
pauseOverlay.confirmSelected = 1;
pauseOverlay.update(0.016, mockInputEnter);
assert.strictEqual(mockGame.currentScene, 'menu', 'Confirming quit returns to menu');

console.log('  ✓ PASS: Settings opened from Pause returns to Pause without loss');
console.log('  ✓ PASS: Abandon run confirmation modal protects player session\n');

// ------------------------------------------------------------
// 4. Test Settings Slider & Volume math
// ------------------------------------------------------------
console.log('4. Verifying Graphical Volume Slider logic:');
const settingsScene = new SettingsScene(mockGame);
mockGame.meta.settings.musicVolume = 0.5;

// Right key increases volume by 0.1
const mockInputRight = {
  getMousePos: () => ({ x: 0, y: 0 }),
  justPressed: (k) => k === 'ArrowRight',
  mouseClicked: () => false,
};
settingsScene.selected = 0;
settingsScene.update(0.016, mockInputRight);
assert.strictEqual(mockGame.meta.settings.musicVolume, 0.6, 'Music volume should increase to 0.6');

// Left key decreases volume by 0.1
const mockInputLeft = {
  getMousePos: () => ({ x: 0, y: 0 }),
  justPressed: (k) => k === 'ArrowLeft',
  mouseClicked: () => false,
};
settingsScene.update(0.016, mockInputLeft);
assert.strictEqual(mockGame.meta.settings.musicVolume, 0.5, 'Music volume should decrease back to 0.5');

console.log('  ✓ PASS: Volume adjustments work smoothly without character corruption\n');

// ------------------------------------------------------------
// 5. Test MapRenderer Arena Generation
// ------------------------------------------------------------
console.log('5. Verifying MapRenderer Arena Generation:');
const mapRenderer = new MapRenderer(mockAssets);
const template = mapRenderer.setupArena('fields', 'clear', 42);
assert.ok(template.w >= 40 && template.h >= 23, 'Arena template size valid');
assert.strictEqual(mapRenderer.collisionMap.length, template.h, 'Collision map has valid height');
assert.strictEqual(mapRenderer.collisionMap[0].length, template.w, 'Collision map has valid width');
assert.strictEqual(mapRenderer.isBlocked(0, 0), true, 'Perimeter is wall');

console.log('  ✓ PASS: Map arena structure & collision properly initialized\n');

console.log('6. Verifying Sprite Cropping, Focus Reset & Spawn Protection:');
const sheet = new SpriteSheet({ width: 400, height: 100 }, 100, 100, 4, 10, { x: 34, y: 31, w: 40, h: 34 });
assert.deepStrictEqual(sheet.getFrame(2), { sx: 234, sy: 31, sw: 40, sh: 34 });
input.keys.KeyW = true;
input.mouse.down = true;
input.clearHeld();
assert.strictEqual(input.isDown('KeyW'), false, 'Focus loss must release held movement');
assert.strictEqual(input.isMouseDown(), false, 'Focus loss must release held attack');
player.spawnProtection = 3;
assert.strictEqual(player.takeDamage(10), false, 'Spawn protection must block early damage');
assert.strictEqual(player.hp, 100, 'Spawn protection must preserve HP');
player.update(3.1, {
  getMousePos: () => ({ x: 320, y: 180 }),
  getMoveVector: () => ({ x: 0, y: 0 }),
  justPressed: () => false,
  isMouseDown: () => false,
  mouseClicked: () => false,
}, mapRenderer);
assert.strictEqual(player.spawnProtection, 0, 'Spawn protection must expire');
player.takeDamage(10);
assert.strictEqual(player.hp, 90, 'Damage must apply after spawn protection');
console.log('  ✓ PASS: Cropped sprite frames, focus reset and short protection behave correctly\n');

// ------------------------------------------------------------
// 7. Test HUD Action Buttons & Wave Text Format
// ------------------------------------------------------------
console.log('7. Verifying HUD Action Buttons & Wave Text Format:');

const testHud = new HUD(mockAssets);
const sBounds = testHud.getSkillButtonBounds();
const dBounds = testHud.getDashButtonBounds();

assert.ok(sBounds && sBounds.w === 148 && sBounds.h === 16, 'Skill button has space for full skill names');
assert.ok(dBounds && dBounds.w === 80 && dBounds.h === 16, 'Dash button has 80x16 bounds');
assert.ok(sBounds.x + sBounds.w < dBounds.x, 'Skill button is on left of Dash button');

// Test Player Dash triggering
player.dashCdTimer = 0;
player.isDashing = false;
const dashSuccess = player.triggerDash({ x: 1, y: 0 });
assert.strictEqual(dashSuccess, true, 'triggerDash should succeed when ready');
assert.strictEqual(player.isDashing, true, 'Player should enter dashing state');
assert.ok(player.iframeTimer > 0, 'Player should get iframes on dash');
assert.ok(player.dashCdTimer > 0, 'Dash cooldown should start');
assert.strictEqual(player.dashDirX, 1, 'Dash direction X should match input vector');

// Test CombatScene objective text format
const combatMockGame = {
  assets: mockAssets,
  audio: { playBgm: () => {}, playSfx: () => {} },
  meta: { settings: {} },
};
const testCombat = new CombatScene(combatMockGame);
testCombat.stageDef = { type: 'clear', waves: 3, enemies: ['orc_infantry'] };
testCombat.wavesRemaining = 3;
testCombat.enemies = [
  { isDead: false },
  { isDead: false },
  { isDead: true },
];
const objText = testCombat._getObjectiveText();
assert.strictEqual(objText, 'Đợt 1/3 — Quái còn: 2', 'Clear stage text must be "Đợt X/Y — Quái còn: Z"');
assert.ok(!objText.includes('✅') && !objText.includes('⚔'), 'Objective text must not contain OS emojis');

console.log('  ✓ PASS: HUD action bounds, triggerDash, and wave text format verified\n');

console.log('=== ALL UI/UX & FLOW CHECKS PASSED (7/7) ===');
