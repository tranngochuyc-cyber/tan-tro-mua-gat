// Trạng thái một lượt chơi (run): chỉ số, vũ khí, vàng, phúc lành, tiến độ phòng
import { defaultStats, BUFFS } from '../data/buffs.js';
import { makeWeapon, WEAPON_IDS } from '../data/weapons.js';
import { COMBAT_POOL } from '../data/rooms.js';
import { makeRng } from '../core/util.js';

export class Run {
  constructor(seed = (Math.random() * 1e9) | 0) {
    this.seed = seed;
    this.rng = makeRng(seed);
    this.stats = defaultStats();
    this.hp = this.stats.maxHp;
    this.weapons = [makeWeapon('broadsword', 1, 0), null];
    this.gold = 0;
    this.flasks = 2; this.maxFlasks = 2;
    this.fate = 0;
    this.buffs = [];
    this.kills = 0; this.time = 0; this.damageDealt = 0; this.chestsWon = 0; this.chestsLost = 0;
    this.fragments = 0;
    this.roomIndex = 0;
    const combats = this.rng.shuffle(COMBAT_POOL);
    this.sequence = [
      { kind: 'intro', tpl: 'intro', depth: 1, title: 'Bìa Làng Mùa Gặt' },
      { kind: 'combat', tpl: combats[0], depth: 1, title: 'Đồng Cỏ Tro · I' },
      { kind: 'combat', tpl: combats[1], depth: 2, title: 'Đồng Cỏ Tro · II' },
      { kind: 'dice', tpl: 'dice', depth: 3, title: 'Hầm Xúc Xắc Của Bà Thầy Bói' },
      { kind: 'combat', tpl: combats[2], depth: 3, title: 'Rặng Phong Cháy · I' },
      { kind: 'combat', tpl: combats[3], depth: 4, title: 'Rặng Phong Cháy · II', elite: true },
      { kind: 'forge', tpl: 'forge', depth: 5, title: 'Lò Rèn Người Canh Lửa' },
      { kind: 'combat', tpl: combats[4], depth: 5, title: 'Hàng Rào Cuối Đồng · I' },
      { kind: 'combat', tpl: combats[5], depth: 6, title: 'Hàng Rào Cuối Đồng · II', elite: true },
      { kind: 'boss', tpl: 'boss', depth: 8, title: 'Cổng Tháp Chuông' },
    ];
  }

  get room() { return this.sequence[this.roomIndex]; }
  get depth() { return this.room.depth; }
  get combatIndex() { return this.sequence.slice(0, this.roomIndex + 1).filter((r) => r.kind === 'combat').length; }

  heal(n) { this.hp = Math.min(this.stats.maxHp, this.hp + n); }

  addBuff(b) {
    this.buffs.push(b.id);
    b.apply(this.stats, this);
  }

  // Ba lựa chọn phúc lành, độ hiếm tăng theo độ sâu
  buffChoices(n = 3) {
    const d = this.depth;
    const weights = d <= 2 ? [70, 27, 3] : d <= 4 ? [50, 40, 10] : [35, 45, 20];
    const out = [];
    const pool = BUFFS.filter((b) => !this.buffs.includes(b.id) || ['ashblood', 'edge', 'hawk', 'keen', 'fatehand', 'gold', 'soulsip'].includes(b.id));
    let guard = 0;
    while (out.length < n && guard++ < 200) {
      const r = this.rng.weighted([[1, weights[0]], [2, weights[1]], [3, weights[2]]]);
      const cands = pool.filter((b) => b.rarity === r && !out.includes(b));
      if (cands.length) out.push(this.rng.pick(cands));
    }
    return out;
  }

  // Bậc vũ khí rơi ra theo độ sâu (bonus: +1 bậc ưu tiên)
  rollTier(bonus = 0) {
    const d = this.depth;
    const w = d <= 2 ? [78, 20, 2] : d <= 4 ? [40, 50, 10] : [15, 55, 30];
    let t = this.rng.weighted([[1, w[0]], [2, w[1]], [3, w[2]]]);
    return Math.min(3, t + bonus);
  }

  randomWeapon(bonus = 0, exclude = []) {
    const ids = WEAPON_IDS.filter((id) => !exclude.includes(id));
    const id = this.rng.pick(ids);
    const tier = this.rollTier(bonus);
    let trait = null;
    if (tier === 3) trait = this.rng.pick(['burn', 'bleed', 'keen', 'vamp', 'fated']);
    else if (tier === 2 && this.rng.chance(0.4)) trait = this.rng.pick(['keen', 'fated', 'bleed']);
    const w = makeWeapon(id, tier, 0, trait);
    if (!trait && w.trait === null) w.trait = null;
    return w;
  }
}
