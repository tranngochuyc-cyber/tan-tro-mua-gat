// ============================================================
// Automated Game Audit & Mechanics Verification Test Suite
// ============================================================
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

// Import game data and logic
import * as C from '../src/engine/Constants.js';
import { ARTIFACTS, CHARMS, UPGRADES, ENEMIES, BOSSES, CHAPTERS, META_UNLOCKS } from '../src/data/GameData.js';
import { Player } from '../src/entities/Player.js';

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  ✓ PASS: ${message}`);
    passed++;
  } else {
    console.error(`  ✗ FAIL: ${message}`);
    failed++;
  }
}

console.log('=== RUNNING ASHEN HARVEST GAME SUITE AUDIT ===\n');

// 1. Asset File Existence Audit
console.log('1. Auditing Asset Files on Disk:');
const assetManifest = [
  'assets/player/soldier_idle.png',
  'assets/player/soldier_walk.png',
  'assets/player/soldier_attack.png',
  'assets/player/soldier_hurt.png',
  'assets/player/soldier_death.png',
  'assets/enemies/orc_idle.png',
  'assets/enemies/orc_walk.png',
  'assets/enemies/orc_attack01.png',
  'assets/enemies/orc_attack02.png',
  'assets/enemies/orc_hurt.png',
  'assets/enemies/orc_death.png',
  'assets/enemies/shadow_imp.png',
  'assets/enemies/void_beast.png',
  'assets/enemies/dark_cultist_idle.png',
  'assets/enemies/dark_cultist_walk.png',
  'assets/tiles/tileset_spring.png',
  'assets/tiles/chest.png',
  'assets/tiles/house.png',
  'assets/tiles/maple_tree.png',
  'assets/tiles/crops.png',
  'assets/weapons/fire_staff.png',
  'assets/weapons/inferno_staff.png',
  'assets/weapons/frost_staff.png',
  'assets/weapons/blizzard_staff.png',
  'assets/weapons/thunder_scepter.png',
  'assets/weapons/power_surge_gem.png',
  'assets/weapons/blood_spear.png',
  'assets/weapons/blood_catalyst.png',
  'assets/weapons/composite_bow.png',
  'assets/weapons/soul_bow.png',
  'assets/weapons/void_wand.png',
  'assets/weapons/arcane_tome.png',
  'assets/weapons/mana_flask.png',
  'assets/weapons/berserk_rune.png',
  'assets/weapons/katana.png',
  'assets/weapons/arrow.png',
  'assets/music/bgm_title.ogg',
  'assets/music/bgm_combat.ogg',
  'assets/music/bgm_shop.ogg',
  'assets/music/bgm_boss.ogg',
];

let missingAssets = 0;
for (const rel of assetManifest) {
  const fullPath = path.join(rootDir, rel);
  if (!fs.existsSync(fullPath)) {
    console.error(`    Missing asset: ${rel}`);
    missingAssets++;
  }
}
assert(missingAssets === 0, `All ${assetManifest.length} critical game assets exist on disk`);

// 2. Stage and Chapter Structure Audit
console.log('\n2. Auditing Stage Structure (12 Stages, 3 Chapters, 3 Bosses):');
assert(CHAPTERS.length === 3, 'Game has exactly 3 chapters');
let totalStages = 0;
let bossStages = 0;
CHAPTERS.forEach((ch, ci) => {
  assert(ch.stages.length === 4, `Chapter ${ci + 1} (${ch.name}) has exactly 4 stages`);
  totalStages += ch.stages.length;
  const lastStage = ch.stages[3];
  if (lastStage.type === 'boss') {
    bossStages++;
    assert(BOSSES[lastStage.bossId] !== undefined, `Boss ID '${lastStage.bossId}' in chapter ${ci + 1} exists in BOSSES`);
  }
});
assert(totalStages === 12, 'Game has exactly 12 total stages');
assert(bossStages === 3, 'Game has exactly 3 boss encounters at stages 4, 8, 12');

// 3. Artifacts & Evolution Audit
console.log('\n3. Auditing Artifacts & Evolutions:');
const baseArtifacts = Object.values(ARTIFACTS).filter(a => !a.evolved);
const evolvedArtifacts = Object.values(ARTIFACTS).filter(a => a.evolved);
assert(baseArtifacts.length === 6, `Exactly 6 base attack artifacts (got ${baseArtifacts.length})`);
assert(evolvedArtifacts.length === 6, `Exactly 6 evolved artifacts (got ${evolvedArtifacts.length})`);

for (const art of baseArtifacts) {
  assert(art.maxLevel === 5, `${art.name} has max level 5`);
  assert(art.evolution !== undefined, `${art.name} has an evolution definition`);
  const evo = art.evolution;
  assert(CHARMS[evo.requires] !== undefined, `${art.name} requires valid charm '${evo.requires}'`);
  assert(ARTIFACTS[evo.result] !== undefined, `${art.name} evolves into valid '${evo.result}'`);
  assert(ARTIFACTS[evo.result].evolved === true, `Result '${evo.result}' has evolved flag`);
}

// 4. Charms and Upgrades Audit
console.log('\n4. Auditing Charms & Upgrades:');
const charmList = Object.values(CHARMS);
assert(charmList.length === 5, `Exactly 5 passive charms (got ${charmList.length})`);
for (const ch of charmList) {
  assert(ch.maxLevel === 5, `Charm ${ch.name} has max level 5`);
  assert(ch.stats.length === 5, `Charm ${ch.name} has 5 level stat tiers`);
}
assert(UPGRADES.length >= 12, `At least 12 general upgrade options available (got ${UPGRADES.length})`);

// 5. Enemies and Bosses Audit
console.log('\n5. Auditing Enemies & Bosses:');
const enemyIds = Object.keys(ENEMIES);
assert(enemyIds.length === 6, `Exactly 6 enemy roles defined (got ${enemyIds.length})`);
for (const [id, def] of Object.entries(ENEMIES)) {
  assert(def.hp > 0 && def.dmg > 0 && def.speed > 0, `Enemy ${def.name} has valid base stats`);
}
for (const [id, boss] of Object.entries(BOSSES)) {
  assert(boss.phases && boss.phases.length >= 2, `Boss ${boss.name} has multi-phase structure (${boss.phases.length} phases)`);
}

// 6. Player Mechanics, XP, Level-Up, Serialization
console.log('\n6. Auditing Player Mechanics & Save/Load Checkpoints:');
Player.setCharmData(CHARMS);
const dummyAssets = { getImage: () => null };
const player = new Player(dummyAssets, 100, 100);
player.initUpgradeStats();
assert(player.hp === C.PLAYER_BASE_HP, `Player starts at ${C.PLAYER_BASE_HP} HP`);
assert(player.level === 1, 'Player starts at level 1');

// Test XP gain and multi-level up
const levelUps = player.addXp(40); // 12 + 16 = 28 (Level 3), leftover 12
assert(player.level === 3, `Player leveled up to 3 with 40 XP (current level: ${player.level})`);
assert(levelUps.length === 2, `Triggered 2 level up events (got ${levelUps.length})`);

// Test Charms stats recalc
player.charms.push({ id: 'mana_flask', level: 3 }); // 15% cd reduction
player.recalcStats();
assert(Math.abs(player._cdReduction - 0.15) < 0.001, `Charm Mana Flask gives 15% cd reduction (got ${player._cdReduction})`);

// Test Serialization & Deserialization
player.gold = 150;
player.rerolls = 2;
player.artifacts.push({ id: 'fire_staff', level: 5 });
const serialized = player.serialize();
assert(serialized.level === 3 && serialized.gold === 150, 'Player serialized correctly');

const player2 = new Player(dummyAssets, 0, 0);
player2.initUpgradeStats();
player2.deserialize(serialized);
player2.recalcStats();
assert(player2.level === 3 && player2.gold === 150 && player2.artifacts[0].level === 5, 'Player deserialized checkpoint correctly');

// 7. Curse Time Scaling Math Audit
console.log('\n7. Auditing Curse Clock Scaling Formulas:');
// Stage 9 at minute 15:
const s = 9;
const t = 15;
const hpScale = 1 + C.CURSE_HP_STAGE * (s - 1) + C.CURSE_HP_TIME * t;
const dmgScale = 1 + C.CURSE_DMG_STAGE * (s - 1) + C.CURSE_DMG_TIME * t;
const spawnScale = Math.min(C.CURSE_SPAWN_CAP, 1 + C.CURSE_SPAWN_TIME * t);
// Expected from THIET_KE_GAME.md line 133: HP x1.82, dmg x1.45, spawn x1.60
assert(Math.abs(hpScale - 1.82) < 0.01, `Stage 9, min 15 HP scale = ${hpScale.toFixed(2)} (expected ~1.82)`);
assert(Math.abs(dmgScale - 1.45) < 0.01, `Stage 9, min 15 DMG scale = ${dmgScale.toFixed(2)} (expected ~1.45)`);
assert(Math.abs(spawnScale - 1.60) < 0.01, `Stage 9, min 15 Spawn scale = ${spawnScale.toFixed(2)} (expected ~1.60)`);

// 8. Meta Unlocks Audit
console.log('\n8. Auditing Meta Progression Unlocks:');
const unlockIds = Object.keys(META_UNLOCKS);
assert(unlockIds.includes('fire_staff') && unlockIds.includes('bagSlot') && unlockIds.includes('vigor1'), 'Meta unlocks include starter artifacts, extra bag, vigor');

console.log(`\n=== AUDIT COMPLETE: ${passed} PASSED, ${failed} FAILED ===\n`);
if (failed > 0) process.exit(1);
