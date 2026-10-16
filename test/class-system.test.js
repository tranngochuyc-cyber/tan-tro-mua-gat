// ============================================================
// Class System & Progression Verification Suite
// Tests 10 classes (6 standard + 4 folklore), full heal on level-up,
// skill choices at levels 3/5/8, and class passive synergies.
// ============================================================
import assert from 'assert';
import { CLASSES, getClassList, getClassesByCategory } from '../src/data/ClassData.js';
import { Player } from '../src/entities/Player.js';
import * as C from '../src/engine/Constants.js';

console.log('=== RUNNING CLASS SYSTEM & PROGRESSION AUDIT ===\n');

// 1. Audit Class Structure & Quantities
console.log('1. Auditing Class Definitions:');
const classList = getClassList();
assert.strictEqual(classList.length, 10, 'Must have exactly 10 character classes');

const commonClasses = getClassesByCategory('common');
assert.strictEqual(commonClasses.length, 6, 'Must have exactly 6 common classes');

const classicClasses = getClassesByCategory('classic');
assert.strictEqual(classicClasses.length, 4, 'Must have exactly 4 world classic classes');

const requiredCommon = ['warrior', 'mage', 'ranger', 'assassin', 'paladin', 'necromancer'];
for (const cid of requiredCommon) {
  assert.ok(CLASSES[cid], `Common class ${cid} must exist`);
  assert.strictEqual(CLASSES[cid].category, 'common');
}

const requiredClassic = ['alice', 'wukong', 'dracula', 'piper'];
for (const cid of requiredClassic) {
  assert.ok(CLASSES[cid], `World classic class ${cid} must exist`);
  assert.strictEqual(CLASSES[cid].category, 'classic');
  assert.ok(CLASSES[cid].lore, `World classic class ${cid} must have lore backstory`);
}
console.log('  ✓ PASS: Exactly 10 classes verified (6 common, 4 world classic masterpieces)\n');

// 2. Audit Class Stats, Passives, and Milestone Roadmaps
console.log('2. Auditing Class Stats, Passives, and Skill Trees:');
for (const cls of classList) {
  assert.ok(cls.name && cls.name.length > 0, `${cls.id} has valid name`);
  assert.ok(cls.baseStats && cls.baseStats.hp > 0, `${cls.id} has positive base HP`);
  assert.ok(cls.baseStats.dmg > 0, `${cls.id} has positive base damage`);
  assert.ok(cls.growth, `${cls.id} has growth definition`);
  assert.ok(cls.passive && cls.passive.name && cls.passive.desc, `${cls.id} has complete passive`);
  assert.ok(cls.startWeapon, `${cls.id} has a signature starting weapon`);

  // Verify skill choices roadmap (levels 3, 5, 8)
  assert.strictEqual(cls.skillChoices.length, 3, `${cls.id} has exactly 3 milestone skill tiers`);
  const levels = cls.skillChoices.map(sc => sc.level);
  assert.deepStrictEqual(levels, [3, 5, 8], `${cls.id} skill choice levels must be [3, 5, 8]`);
  for (const tier of cls.skillChoices) {
    assert.strictEqual(tier.options.length, 2, `${cls.id} Lv${tier.level} has exactly 2 skill choices`);
    for (const opt of tier.options) {
      assert.ok(opt.id && opt.name && opt.desc && opt.effect, `Skill option in ${cls.id} is fully defined`);
    }
  }
}
console.log('  ✓ PASS: All 10 classes have complete baseStats, growth, passives, and 3-tier skill trees\n');

// 3. Testing Full Heal on Level Up & Class Growth
console.log('3. Testing Level Up Mechanics & Full Heal:');
const mockAssets = { getImage: () => null };
const player = new Player(mockAssets, 0, 0);
player.applyClass('warrior');

assert.strictEqual(player.classId, 'warrior');
assert.strictEqual(player.hp, player.maxHp);
assert.strictEqual(player.maxHp, CLASSES.warrior.baseStats.hp);

// Damage player down to 10 HP
player.hp = 10;
assert.strictEqual(player.hp, 10, 'Player HP reduced to 10');

// Level up to Lv 2
const oldMaxHp = player.maxHp;
const lvGained = player.addXp(12);
assert.deepStrictEqual(lvGained, [2], 'Gained level 2');
assert.strictEqual(player.level, 2, 'Player is now level 2');

// FULL HEAL verification!
assert.strictEqual(player.hp, player.maxHp, 'Player must be FULLY HEALED to maxHp on level-up');
assert.ok(player.maxHp > oldMaxHp, 'Max HP increased from class growth and base level bonus');
console.log(`  ✓ PASS: Player took damage, leveled up, and fully healed to ${player.maxHp} HP\n`);

// 4. Testing Class Skill Choice Milestones (Lv 3, 5, 8)
console.log('4. Testing Class Skill Milestone Unlocks:');
// At Lv 2, no class skill choice
assert.strictEqual(player.getClassSkillChoice(), undefined, 'Lv 2 has no class skill choice');

// Level up to Lv 3
player.hp = 20; // damage player again
player.addXp(player.xpToLevel);
assert.strictEqual(player.level, 3, 'Player reached level 3');
assert.strictEqual(player.hp, player.maxHp, 'Full heal on reaching level 3');

const choiceLv3 = player.getClassSkillChoice();
assert.ok(choiceLv3, 'Level 3 triggers class skill choice');
assert.strictEqual(choiceLv3.level, 3);
assert.strictEqual(choiceLv3.options.length, 2);

// Pick option 1 (first branch option)
const chosen = choiceLv3.options[0];
const hpBeforeSkill = player.maxHp;
player.applyClassSkill(chosen.id);
assert.strictEqual(player.classSkills.length, 1);
assert.strictEqual(player.classSkills[0].id, chosen.id);
const expectedHpBoost = chosen.effect.maxHp || 0;
assert.strictEqual(player.maxHp, hpBeforeSkill + expectedHpBoost, 'Milestone increased max HP by skill definition amount');
console.log('  ✓ PASS: Level 3 class skill choice unlocked and applied correctly\n');

// 5. Testing World Classic Masterpiece Mechanics:
console.log('5. Testing World Classic Class Mechanics & Synergies:');

// 5A: Alice Form Shifting (Small agile vs Giant heavy stomp)
const alicePlayer = new Player(mockAssets, 0, 0);
alicePlayer.applyClass('alice');
alicePlayer.critChance = 0; // Compare base mechanics without random critical hits.
assert.strictEqual(alicePlayer.classId, 'alice');
assert.strictEqual(alicePlayer.aliceForm, 'small');

const smallAtk = alicePlayer.getAttackInfo(false);
alicePlayer.aliceForm = 'giant';
const giantAtk = alicePlayer.getAttackInfo(false);
assert.ok(giantAtk.damage > smallAtk.damage, 'Giant form deals significantly more damage');
assert.ok(giantAtk.range > smallAtk.range, 'Giant form has much wider attack reach');
console.log(`  ✓ Alice verified: Small form fast needle (${smallAtk.damage} dmg) vs Giant form stomp (${giantAtk.damage} dmg, ${giantAtk.range} range)`);

// 5B: Wukong Tempo Meter & Golden Staff (scales 0-5, drops on hit)
const wukongPlayer = new Player(mockAssets, 0, 0);
wukongPlayer.applyClass('wukong');
wukongPlayer.critChance = 0; // Compare base mechanics without random critical hits.
assert.strictEqual(wukongPlayer.classId, 'wukong');
assert.strictEqual(wukongPlayer.wukongTempo, 0);

const baseWukongAtk = wukongPlayer.getAttackInfo(false);
wukongPlayer.wukongTempo = 5;
const maxTempoAtk = wukongPlayer.getAttackInfo(false);
assert.ok(maxTempoAtk.damage > baseWukongAtk.damage, 'Max tempo increases staff damage');
assert.ok(maxTempoAtk.range > baseWukongAtk.range, 'Max tempo extends Ruyi Jingu Bang staff reach');

// Getting hit resets tempo
wukongPlayer.takeDamage(10);
assert.strictEqual(wukongPlayer.wukongTempo, 0, 'Wukong tempo resets upon taking damage');
console.log(`  ✓ Wukong verified: Tempo 0 (${baseWukongAtk.damage} dmg) vs Tempo 5 (${maxTempoAtk.damage} dmg, ${maxTempoAtk.range} reach), resets on hit`);

// 5C: Dracula Blood Sacrifice & Low HP Lifesteal Scaling
const dracPlayer = new Player(mockAssets, 0, 0);
dracPlayer.applyClass('dracula');
dracPlayer.critChance = 0; // Compare base mechanics without random critical hits.
assert.strictEqual(dracPlayer.classId, 'dracula');

const fullHpAtk = dracPlayer.getAttackInfo(false);
dracPlayer.hp = Math.floor(dracPlayer.maxHp * 0.35); // below 50% HP
const lowHpAtk = dracPlayer.getAttackInfo(false);
assert.ok(lowHpAtk.damage > fullHpAtk.damage, 'Dracula gains desperation damage when low on HP');
console.log(`  ✓ Dracula verified: High HP (${fullHpAtk.damage} dmg) vs Low HP frenzy (${lowHpAtk.damage} dmg)`);

// 5D: Piper Piercing Flute Notes & Resonance Echo
const piperPlayer = new Player(mockAssets, 0, 0);
piperPlayer.applyClass('piper');
assert.strictEqual(piperPlayer.classId, 'piper');
assert.strictEqual(piperPlayer.classPassive.id, 'piper_echo');
const piperAtk = piperPlayer.getAttackInfo(false);
assert.ok(piperAtk.range >= 85, 'Piper flute melodies have long piercing reach');
console.log(`  ✓ Piper verified: Long range sonic melody (${piperAtk.range} range) with resonance echo passive\n`);

console.log('=== ALL CLASS SYSTEM & PROGRESSION CHECKS PASSED PERFECTLY ===\n');

// Large XP rewards must not skip unclaimed class milestones.
const jumper = new Player(mockAssets, 0, 0);
jumper.applyClass('warrior');
jumper.addXp(250);
assert.equal(jumper.getClassSkillChoice().level, 3);
jumper.applyClassSkill(jumper.getClassSkillChoice().options[0].id);
assert.equal(jumper.getClassSkillChoice().level, 5);
