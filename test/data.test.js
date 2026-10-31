// Kiểm thử dữ liệu chạy bằng Node (không cần trình duyệt): node test/data.test.js
import assert from 'node:assert/strict';
import { TEMPLATES, ROOM_H } from '../src/data/rooms.js';
import { Level, T } from '../src/world/level.js';
import { WEAPONS, WEAPON_IDS, weaponDps, makeWeapon, TIERS } from '../src/data/weapons.js';
import { BUFFS, defaultStats } from '../src/data/buffs.js';
import { CONDITIONS } from '../src/data/dice.js';
import { FRAGMENTS } from '../src/data/story.js';
import { ENEMY_TYPES } from '../src/entities/enemy.js';

let n = 0; const ok = (name, fn) => { fn(); n++; console.log('✓', name); };

ok('mọi mẫu phòng dựng được, đúng chiều cao, có điểm xuất phát', () => {
  for (const name of Object.keys(TEMPLATES)) {
    const lv = new Level(name);
    assert.equal(lv.h, ROOM_H, name);
    const P = lv.markers.filter((m) => m.ch === 'P');
    assert.equal(P.length, 1, `${name} cần đúng 1 điểm P`);
    const p = P[0];
    assert.ok(lv.isSolid(p.x, p.y + 1), `${name}: P phải đứng trên đất`);
    if (name !== 'intro') assert.equal(lv.markers.filter((m) => m.ch === 'X').length, 1, `${name} cần 1 cổng X`);
  }
});

ok('cổng X và rương C đặt trên mặt đất', () => {
  for (const name of Object.keys(TEMPLATES)) {
    const lv = new Level(name);
    for (const m of lv.markers.filter((m) => 'XCWFMB'.includes(m.ch))) assert.ok(lv.get(m.x, m.y + 1) === T.SOLID, `${name}: ${m.ch} ở (${m.x},${m.y}) lơ lửng`);
  }
});

ok('phòng chiến đấu có quái, phòng boss có boss', () => {
  for (const name of Object.keys(TEMPLATES).filter((k) => /^c\d/.test(k))) {
    const lv = new Level(name);
    assert.ok(lv.markers.filter((m) => 'emhacs'.includes(m.ch)).length >= 3, name);
  }
  assert.equal(new Level('boss').markers.filter((m) => m.ch === 'B').length, 1);
});

ok('cửa vận mệnh chặn kín tới trần', () => {
  const lv = new Level('dice');
  const col = lv.doorTiles[0][0];
  for (let y = 1; y < lv.h - 3; y++) if (lv.get(col, y) !== T.SOLID) assert.equal(lv.get(col, y) === T.DOOR || lv.get(col, y) === T.SOLID, true, `hở ở hàng ${y}`);
  lv.openDoor();
  assert.equal(lv.doorTiles.length, 0);
});

ok('13 vũ khí, mỗi đòn có dữ liệu hợp lệ, bậc cao mạnh hơn', () => {
  assert.ok(WEAPON_IDS.length >= 13);
  for (const id of WEAPON_IDS) {
    const d = WEAPONS[id];
    assert.ok(d.combo.length >= 1, id);
    for (const s of d.combo) {
      assert.ok(s.startup > 0 && s.recovery > 0, id);
      if (d.type === 'melee') assert.ok(s.box && s.dmg > 0 && s.active > 0 && s.arc, id);
      else assert.ok((s.shots && s.shots.length) || s.chain, id);
    }
    assert.ok(weaponDps(makeWeapon(id, 3)) > weaponDps(makeWeapon(id, 2)) && weaponDps(makeWeapon(id, 2)) > weaponDps(makeWeapon(id, 1)), id);
  }
  assert.equal(TIERS.length, 3);
});

ok('xác suất điều kiện xúc xắc khớp với tính toán', () => {
  for (const c of CONDITIONS) {
    let hit = 0, total = 0;
    if (c.dice === 1) for (let a = 1; a <= 6; a++) { total++; if (c.test([a])) hit++; }
    else for (let a = 1; a <= 6; a++) for (let b = 1; b <= 6; b++) { total++; if (c.test([a, b])) hit++; }
    assert.ok(Math.abs(hit / total - c.p) < 1e-9, `${c.id}: ${hit}/${total} khác ${c.p}`);
  }
});

ok('phúc lành áp dụng được, không trùng id', () => {
  const ids = new Set();
  for (const b of BUFFS) {
    assert.ok(!ids.has(b.id), b.id); ids.add(b.id);
    const st = defaultStats(); const run = { hp: 50, heal(v) { this.hp += v; } };
    b.apply(st, run);
  }
  assert.ok(BUFFS.length >= 20);
});

ok('5 mảnh ký ức + quái có đủ chỉ số', () => {
  assert.equal(FRAGMENTS.length, 5);
  for (const [k, t] of Object.entries(ENEMY_TYPES)) assert.ok(t.hp > 0 && t.w > 0 && t.h > 0, k);
});

console.log(`\n${n} nhóm kiểm thử đạt.`);
