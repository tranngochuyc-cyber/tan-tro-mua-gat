// ============================================================
// GameData — all item/upgrade/enemy/stage definitions
// ============================================================

// ---- ARTIFACTS (attack items) ----
export const ARTIFACTS = {
  fire_staff: {
    id: 'fire_staff', name: 'Hỏa Trượng', icon: 'fire_staff', branch: 'fire',
    type: 'artifact', maxLevel: 5,
    desc: 'Đòn đánh: Cầu lửa thiêu đốt 3s · [Q]: Bão Lửa 360°',
    projectile: { type: 'fire', speed: 180, radius: 5, color: '#ff6622', life: 1.6 },
    skill: { name: 'Bão Lửa', type: 'fire_nova', dmg: 16, count: 12, speed: 110, burnDmg: 3, desc: 'Tỏa 12 cầu lửa 360° thiêu đốt xung quanh' },
    stats: [
      { dmg: 8,  cd: 1.8, burnDmg: 2,  burnDur: 3, projectiles: 1 },
      { dmg: 11, cd: 1.6, burnDmg: 3,  burnDur: 3, projectiles: 1 },
      { dmg: 14, cd: 1.4, burnDmg: 4,  burnDur: 3, projectiles: 2 },
      { dmg: 18, cd: 1.2, burnDmg: 5,  burnDur: 3, projectiles: 2 },
      { dmg: 22, cd: 1.0, burnDmg: 6,  burnDur: 3, projectiles: 3 },
    ],
    evolution: { requires: 'mana_flask', requiredLevel: 3, result: 'inferno_staff' },
  },
  inferno_staff: {
    id: 'inferno_staff', name: 'Hỏa Ngục Trượng', icon: 'inferno_staff', branch: 'fire',
    type: 'artifact', maxLevel: 5, evolved: true,
    desc: 'Đòn đánh: Cầu lửa bùng nổ diện rộng · [Q]: Địa Ngục Bộc',
    projectile: { type: 'fire', speed: 200, radius: 6, color: '#ff4400', life: 1.8, explodeOnBurnKill: true },
    skill: { name: 'Địa Ngục Bộc', type: 'fire_nova', dmg: 26, count: 16, speed: 130, burnDmg: 6, desc: 'Tỏa 16 cầu lửa bùng nổ sát thương cực lớn' },
    stats: [
      { dmg: 25, cd: 0.9, burnDmg: 7, burnDur: 3, projectiles: 3, explodeOnBurnKill: true },
      { dmg: 28, cd: 0.85, burnDmg: 8, burnDur: 3, projectiles: 3, explodeOnBurnKill: true },
      { dmg: 32, cd: 0.8, burnDmg: 9, burnDur: 3, projectiles: 4, explodeOnBurnKill: true },
      { dmg: 36, cd: 0.75, burnDmg: 10, burnDur: 3, projectiles: 4, explodeOnBurnKill: true },
      { dmg: 40, cd: 0.7, burnDmg: 12, burnDur: 3, projectiles: 5, explodeOnBurnKill: true },
    ],
  },
  frost_staff: {
    id: 'frost_staff', name: 'Băng Trượng', icon: 'frost_staff', branch: 'ice',
    type: 'artifact', maxLevel: 5,
    desc: 'Đòn đánh: Tia băng xuyên thấu làm chậm 20-40% · [Q]: Băng Phong',
    projectile: { type: 'ice', speed: 210, radius: 4.5, color: '#88ccff', life: 1.8, pierce: true },
    skill: { name: 'Băng Phong', type: 'ice_blast', dmg: 12, count: 10, speed: 95, slow: 0.5, slowDur: 3.5, desc: 'Tỏa gai băng 360° làm chậm 50% kẻ địch' },
    stats: [
      { dmg: 6,  cd: 1.5, slow: 0.20, slowDur: 2, projectiles: 1 },
      { dmg: 9,  cd: 1.3, slow: 0.25, slowDur: 2, projectiles: 1 },
      { dmg: 12, cd: 1.2, slow: 0.30, slowDur: 2.5, projectiles: 2 },
      { dmg: 15, cd: 1.0, slow: 0.35, slowDur: 2.5, projectiles: 2 },
      { dmg: 18, cd: 0.9, slow: 0.40, slowDur: 3, projectiles: 3 },
    ],
    evolution: { requires: 'arcane_tome', requiredLevel: 3, result: 'blizzard_staff' },
  },
  blizzard_staff: {
    id: 'blizzard_staff', name: 'Bão Tuyết Trượng', icon: 'blizzard_staff', branch: 'ice',
    type: 'artifact', maxLevel: 5, evolved: true,
    desc: 'Đòn đánh: Bão tuyết xuyên thấu cực hàn · [Q]: Bão Tuyết Cực Hàn',
    projectile: { type: 'ice', speed: 220, radius: 5, color: '#aaeeff', life: 2.0, pierce: true },
    skill: { name: 'Bão Tuyết Cực Hàn', type: 'ice_blast', dmg: 22, count: 14, speed: 110, slow: 0.6, slowDur: 4.5, desc: 'Bão tuyết diện rộng đóng băng sâu kẻ thù' },
    stats: [
      { dmg: 20, cd: 0.85, slow: 0.40, slowDur: 3, projectiles: 3, blizzardAoE: true },
      { dmg: 23, cd: 0.80, slow: 0.40, slowDur: 3, projectiles: 3, blizzardAoE: true },
      { dmg: 26, cd: 0.75, slow: 0.40, slowDur: 3, projectiles: 4, blizzardAoE: true },
      { dmg: 30, cd: 0.70, slow: 0.40, slowDur: 3.5, projectiles: 4, blizzardAoE: true },
      { dmg: 35, cd: 0.65, slow: 0.40, slowDur: 4, projectiles: 5, blizzardAoE: true },
    ],
  },
  thunder_scepter: {
    id: 'thunder_scepter', name: 'Lôi Trượng', icon: 'thunder_scepter', branch: 'thunder',
    type: 'artifact', maxLevel: 5,
    desc: 'Đòn đánh: Tia sét giật lan 2-3 mục tiêu · [Q]: Thiên Lôi Giáng',
    projectile: { type: 'lightning', speed: 240, radius: 5, color: '#ffff44', life: 1.5 },
    skill: { name: 'Thiên Lôi Giáng', type: 'lightning_storm', dmg: 22, bolts: 6, desc: 'Sấm sét từ trời giáng xuống kẻ địch trên sân' },
    stats: [
      { dmg: 10, cd: 2.0, chains: 2, chainRange: 60 },
      { dmg: 13, cd: 1.8, chains: 2, chainRange: 65 },
      { dmg: 16, cd: 1.6, chains: 3, chainRange: 70 },
      { dmg: 20, cd: 1.4, chains: 3, chainRange: 80 },
      { dmg: 24, cd: 1.2, chains: 3, chainRange: 90 },
    ],
    evolution: { requires: 'power_surge_gem', requiredLevel: 3, result: 'thunder_scepter_evo' },
  },
  thunder_scepter_evo: {
    id: 'thunder_scepter_evo', name: 'Vương Trượng Sấm', icon: 'thunder_scepter', branch: 'thunder',
    type: 'artifact', maxLevel: 5, evolved: true,
    desc: 'Đòn đánh: Sét lan uy lực 4-6 mục tiêu · [Q]: Cuồng Nộ Thiên Lôi',
    projectile: { type: 'lightning', speed: 260, radius: 6, color: '#ffee00', life: 1.6 },
    skill: { name: 'Cuồng Nộ Thiên Lôi', type: 'lightning_storm', dmg: 35, bolts: 10, desc: 'Bão sấm sét oanh tạc liên hoàn toàn sân' },
    stats: [
      { dmg: 28, cd: 1.1, chains: 4, chainRange: 95 },
      { dmg: 32, cd: 1.0, chains: 4, chainRange: 100 },
      { dmg: 36, cd: 0.9, chains: 5, chainRange: 105 },
      { dmg: 40, cd: 0.85, chains: 5, chainRange: 110 },
      { dmg: 45, cd: 0.8, chains: 6, chainRange: 120 },
    ],
  },
  blood_spear: {
    id: 'blood_spear', name: 'Huyết Thương', icon: 'blood_spear', branch: 'blood',
    type: 'artifact', maxLevel: 5,
    desc: 'Đòn đánh: Đâm thương xuyên thấu hút máu · [Q]: Huyết Bộc hồi HP',
    projectile: { type: 'blood', speed: 220, radius: 5, color: '#ee2222', life: 1.5, pierce: true },
    skill: { name: 'Huyết Bộc', type: 'blood_burst', dmg: 14, heal: 15, count: 8, speed: 100, desc: 'Hút máu diện rộng xung quanh hồi HP tức thì' },
    stats: [
      { dmg: 14, cd: 1.6, pierce: true, lifesteal: 0.08 },
      { dmg: 18, cd: 1.4, pierce: true, lifesteal: 0.10 },
      { dmg: 22, cd: 1.3, pierce: true, lifesteal: 0.12 },
      { dmg: 26, cd: 1.1, pierce: true, lifesteal: 0.14 },
      { dmg: 30, cd: 1.0, pierce: true, lifesteal: 0.16 },
    ],
    evolution: { requires: 'blood_catalyst', requiredLevel: 3, result: 'blood_spear_evo' },
  },
  blood_spear_evo: {
    id: 'blood_spear_evo', name: 'Huyết Vực Thương', icon: 'blood_spear', branch: 'blood',
    type: 'artifact', maxLevel: 5, evolved: true,
    desc: 'Đòn đánh: Thương vệt máu xuyên thấu hút máu · [Q]: Huyết Hải Cuồng Triều',
    projectile: { type: 'blood', speed: 240, radius: 6, color: '#ff1111', life: 1.6, pierce: true, bloodTrail: true },
    skill: { name: 'Huyết Hải Cuồng Triều', type: 'blood_burst', dmg: 24, heal: 25, count: 12, speed: 120, desc: 'Giải phóng sóng máu cuồng bạo hồi 25 HP' },
    stats: [
      { dmg: 34, cd: 0.9, pierce: true, lifesteal: 0.18, bloodTrail: true },
      { dmg: 38, cd: 0.85, pierce: true, lifesteal: 0.20, bloodTrail: true },
      { dmg: 42, cd: 0.8, pierce: true, lifesteal: 0.22, bloodTrail: true },
      { dmg: 46, cd: 0.75, pierce: true, lifesteal: 0.24, bloodTrail: true },
      { dmg: 50, cd: 0.7, pierce: true, lifesteal: 0.26, bloodTrail: true },
    ],
  },
  composite_bow: {
    id: 'composite_bow', name: 'Cung Hồn', icon: 'composite_bow', branch: 'soul',
    type: 'artifact', maxLevel: 5,
    desc: 'Đòn đánh: Tên linh hồn tự tìm mục tiêu · [Q]: Mưa Tên Hồn',
    projectile: { type: 'arrow', speed: 220, radius: 4, color: '#ddbb77', life: 2.0, homing: 0.4 },
    skill: { name: 'Mưa Tên Hồn', type: 'arrow_rain', dmg: 10, count: 14, desc: 'Mưa tên linh hồn trút xuống từ trên không' },
    stats: [
      { dmg: 7,  cd: 0.8, homing: 0.3, projectileSpeed: 200 },
      { dmg: 9,  cd: 0.7, homing: 0.4, projectileSpeed: 210 },
      { dmg: 11, cd: 0.6, homing: 0.5, projectileSpeed: 220 },
      { dmg: 14, cd: 0.5, homing: 0.6, projectileSpeed: 230 },
      { dmg: 17, cd: 0.45, homing: 0.7, projectileSpeed: 240 },
    ],
    evolution: { requires: 'berserk_rune', requiredLevel: 3, result: 'soul_bow' },
  },
  soul_bow: {
    id: 'soul_bow', name: 'Linh Hồn Cung', icon: 'soul_bow', branch: 'soul',
    type: 'artifact', maxLevel: 5, evolved: true,
    desc: 'Đòn đánh: Tên tự tìm và xuyên thấu · [Q]: Vạn Tiễn Linh Hồn',
    projectile: { type: 'arrow', speed: 260, radius: 4.5, color: '#fef08a', life: 2.2, homing: 0.8, pierce: true },
    skill: { name: 'Vạn Tiễn Linh Hồn', type: 'arrow_rain', dmg: 16, count: 20, desc: 'Bão tiễn xuyên phá hủy diệt toàn bộ khu vực' },
    stats: [
      { dmg: 20, cd: 0.4, homing: 0.8, projectileSpeed: 250, pierce: true },
      { dmg: 23, cd: 0.38, homing: 0.8, projectileSpeed: 260, pierce: true },
      { dmg: 26, cd: 0.35, homing: 0.85, projectileSpeed: 270, pierce: true },
      { dmg: 29, cd: 0.33, homing: 0.85, projectileSpeed: 280, pierce: true },
      { dmg: 32, cd: 0.3, homing: 0.9, projectileSpeed: 300, pierce: true },
    ],
  },
  void_wand: {
    id: 'void_wand', name: 'Hư Vô Trượng', icon: 'void_wand', branch: 'void',
    type: 'artifact', maxLevel: 5,
    desc: 'Đòn đánh: Cầu hư vô xuyên thấu hút nhẹ · [Q]: Xoáy Hư Không',
    projectile: { type: 'void', speed: 170, radius: 6, color: '#a040c0', life: 1.5, pierce: true },
    skill: { name: 'Xoáy Hư Không', type: 'void_pull', dmg: 8, radius: 65, force: 90, duration: 3.0, desc: 'Tạo hố đen hút quái gom lại một điểm' },
    stats: [
      { dmg: 5, cd: 3.0, pullRadius: 50, pullForce: 30, duration: 2.0 },
      { dmg: 7, cd: 2.8, pullRadius: 55, pullForce: 35, duration: 2.2 },
      { dmg: 9, cd: 2.5, pullRadius: 60, pullForce: 40, duration: 2.5 },
      { dmg: 12, cd: 2.2, pullRadius: 70, pullForce: 45, duration: 2.8 },
      { dmg: 15, cd: 2.0, pullRadius: 80, pullForce: 50, duration: 3.0 },
    ],
    evolution: { requires: 'arcane_tome', requiredLevel: 3, result: 'void_wand_evo' },
  },
  void_wand_evo: {
    id: 'void_wand_evo', name: 'Hư Không Trượng', icon: 'void_wand', branch: 'void',
    type: 'artifact', maxLevel: 5, evolved: true,
    desc: 'Đòn đánh: Cầu hư vô phát nổ khi kết thúc · [Q]: Hư Không Bộc Diệt',
    projectile: { type: 'void', speed: 190, radius: 7, color: '#c050e0', life: 1.8, pierce: true, explodeOnEnd: true },
    skill: { name: 'Hư Không Bộc Diệt', type: 'void_pull', dmg: 16, radius: 90, force: 120, duration: 3.5, explodeOnEnd: true, desc: 'Hố đen cực lớn hút toàn bộ quái và phát nổ cực mạnh' },
    stats: [
      { dmg: 18, cd: 1.8, pullRadius: 85, pullForce: 55, duration: 3.0, explodeOnEnd: true },
      { dmg: 22, cd: 1.6, pullRadius: 90, pullForce: 60, duration: 3.2, explodeOnEnd: true },
      { dmg: 26, cd: 1.4, pullRadius: 95, pullForce: 65, duration: 3.5, explodeOnEnd: true },
      { dmg: 30, cd: 1.2, pullRadius: 100, pullForce: 70, duration: 3.8, explodeOnEnd: true },
      { dmg: 35, cd: 1.0, pullRadius: 110, pullForce: 80, duration: 4.0, explodeOnEnd: true },
    ],
  },
};

// ---- CHARMS (passive buffs) ----
export const CHARMS = {
  mana_flask: {
    id: 'mana_flask', name: 'Bình Mana', icon: 'mana_flask', maxLevel: 5,
    type: 'charm',
    desc: 'Giảm hồi chiêu di vật',
    stats: [
      { cdReduction: 0.05 },
      { cdReduction: 0.10 },
      { cdReduction: 0.15 },
      { cdReduction: 0.20 },
      { cdReduction: 0.25 },
    ],
  },
  power_surge_gem: {
    id: 'power_surge_gem', name: 'Ngọc Sức Mạnh', icon: 'power_surge_gem', maxLevel: 5,
    type: 'charm',
    desc: 'Tăng sát thương phép',
    stats: [
      { spellDmgMult: 1.08 },
      { spellDmgMult: 1.15 },
      { spellDmgMult: 1.22 },
      { spellDmgMult: 1.30 },
      { spellDmgMult: 1.40 },
    ],
  },
  berserk_rune: {
    id: 'berserk_rune', name: 'Bùa Cuồng Nộ', icon: 'berserk_rune', maxLevel: 5,
    type: 'charm',
    desc: 'Tăng tốc đánh, giảm HP tối đa',
    stats: [
      { attackSpeedMult: 1.08, maxHpMult: 0.95 },
      { attackSpeedMult: 1.15, maxHpMult: 0.90 },
      { attackSpeedMult: 1.22, maxHpMult: 0.85 },
      { attackSpeedMult: 1.30, maxHpMult: 0.80 },
      { attackSpeedMult: 1.40, maxHpMult: 0.75 },
    ],
  },
  arcane_tome: {
    id: 'arcane_tome', name: 'Sách Ma Thuật', icon: 'arcane_tome', maxLevel: 5,
    type: 'charm',
    desc: 'Tăng bán kính phép và số đạn',
    stats: [
      { aoeRadiusMult: 1.05, extraProjectiles: 0 },
      { aoeRadiusMult: 1.10, extraProjectiles: 0 },
      { aoeRadiusMult: 1.15, extraProjectiles: 1 },
      { aoeRadiusMult: 1.20, extraProjectiles: 1 },
      { aoeRadiusMult: 1.25, extraProjectiles: 2 },
    ],
  },
  blood_catalyst: {
    id: 'blood_catalyst', name: 'Chất Xúc Tác Máu', icon: 'blood_catalyst', maxLevel: 5,
    type: 'charm',
    desc: 'Tăng hồi máu từ sát thương',
    stats: [
      { lifestealBonus: 0.03 },
      { lifestealBonus: 0.05 },
      { lifestealBonus: 0.08 },
      { lifestealBonus: 0.10 },
      { lifestealBonus: 0.13 },
    ],
  },
};

// ---- GENERAL UPGRADES (offered at level up) ----
export const UPGRADES = [
  { id: 'max_hp',      name: 'Tăng HP',           desc: '+10 HP tối đa',             effect: { maxHp: 10 }, icon: 'heart', repeatable: true },
  { id: 'damage',      name: 'Sức Mạnh',          desc: '+3 sát thương cơ bản',      effect: { baseDmg: 3 }, icon: 'sword', repeatable: true },
  { id: 'attack_speed',name: 'Tốc Đánh',          desc: '-0.05s hồi đòn',            effect: { attackCd: -0.05 }, icon: 'dash', repeatable: true, minCd: 0.2 },
  { id: 'move_speed',  name: 'Tốc Chạy',          desc: '+8 tốc độ di chuyển',       effect: { moveSpeed: 8 }, icon: 'boots', repeatable: true },
  { id: 'crit_chance', name: 'Chí Mạng',          desc: '+5% tỉ lệ chí mạng',       effect: { critChance: 0.05 }, icon: 'flame', repeatable: true, maxVal: 0.5 },
  { id: 'crit_mult',   name: 'Sát Thương Chí',    desc: '+0.2 hệ số chí',            effect: { critMult: 0.2 }, icon: 'flame', repeatable: true },
  { id: 'dash_cd',     name: 'Hồi Lướt',          desc: '-0.3s hồi chiêu lướt',      effect: { dashCd: -0.3 }, icon: 'lightning', repeatable: true, minCd: 0.5 },
  { id: 'pickup_range',name: 'Nam Châm',           desc: '+15 bán kính nhặt',         effect: { pickupRange: 15 }, icon: 'magnet', repeatable: true },
  { id: 'regen',       name: 'Tái Tạo',           desc: '+1 HP/3 giây',              effect: { regen: 1 }, icon: 'regen', repeatable: true },
  { id: 'armor',       name: 'Giáp',              desc: '-1 sát thương nhận',         effect: { armor: 1 }, icon: 'shield', repeatable: true },
  { id: 'heal_now',    name: 'Hồi Máu',           desc: 'Hồi 25% HP ngay',          effect: { healPercent: 0.25 }, icon: 'heart', repeatable: true },
  { id: 'xp_mult',     name: 'Kinh Nghiệm',       desc: '+10% XP nhận được',          effect: { xpMult: 0.10 }, icon: 'book', repeatable: true },
];

// ---- ENEMY DEFINITIONS ----
export const ENEMIES = {
  orc_infantry: {
    id: 'orc_infantry', name: 'Orc Bộ Binh',
    sprite: 'orc', hp: 30, dmg: 10, speed: 40,
    xp: 2, gold: 3,
    attackRange: 18, attackWind: 0.45, attackCd: 1.2,
    behavior: 'melee_chase',
    hitboxW: 14, hitboxH: 14,
    chapter: 1,
  },
  orc_warrior: {
    id: 'orc_warrior', name: 'Orc Chiến Binh',
    sprite: 'orc', hp: 65, dmg: 12, speed: 35,
    xp: 4, gold: 5,
    attackRange: 20, attackWind: 0.4, attackCd: 1.0,
    behavior: 'melee_combo', comboHits: 2, comboRest: 1.5,
    hitboxW: 16, hitboxH: 16,
    elite: true,
    chapter: 1,
  },
  cursed_chicken: {
    id: 'cursed_chicken', name: 'Gà Nhiễm Nguyền',
    sprite: 'shadow_imp', hp: 14, dmg: 6, speed: 90,
    xp: 2, gold: 2,
    behavior: 'dash_attack', dashWind: 0.5, dashSpeed: 160, dashDuration: 0.3,
    hitboxW: 10, hitboxH: 10,
    chapter: 1,
  },
  mad_cow: {
    id: 'mad_cow', name: 'Bò Cuồng',
    sprite: 'void_beast', hp: 100, dmg: 18, speed: 30,
    xp: 4, gold: 6,
    behavior: 'charge', chargeWind: 0.9, chargeSpeed: 180, chargeDuration: 0.8,
    hitboxW: 20, hitboxH: 16,
    chapter: 2,
  },
  cursed_villager: {
    id: 'cursed_villager', name: 'Dân Làng Bị Ám',
    sprite: 'dark_cultist', hp: 35, dmg: 8, speed: 35,
    xp: 2, gold: 4,
    behavior: 'ranged', attackRange: 120, attackWind: 0.8, attackCd: 2.0,
    projectileSpeed: 100,
    hitboxW: 12, hitboxH: 14,
    chapter: 2,
  },
  ritual_guard: {
    id: 'ritual_guard', name: 'Hộ Vệ Nghi Lễ',
    sprite: 'orc', hp: 80, dmg: 14, speed: 25,
    xp: 4, gold: 7,
    behavior: 'guard_point', attackRange: 20, attackWind: 0.5, attackCd: 1.5,
    hitboxW: 16, hitboxH: 16,
    chapter: 3,
  },
};

// ---- BOSS DEFINITIONS ----
export const BOSSES = {
  orc_chief: {
    id: 'orc_chief', name: 'Thủ Lĩnh Orc',
    sprite: 'orc', hp: 900, speed: 35,
    xp: 30, gold: 60,
    hitboxW: 22, hitboxH: 22,
    scale: 1.5,
    phases: [
      {
        hpThreshold: 1.0,
        attacks: [
          { type: 'sweep', wind: 0.8, dmg: 20, arc: Math.PI * 0.6, range: 35 },
          { type: 'charge', wind: 0.6, dmg: 25, speed: 160, duration: 0.5 },
          { type: 'summon', count: 2, summonType: 'orc_infantry', cd: 12, maxMinions: 4 },
        ],
        restAfterCombo: 1.2,
      },
      {
        hpThreshold: 0.5,
        attacks: [
          { type: 'sweep', wind: 0.6, dmg: 22, arc: Math.PI * 0.7, range: 38 },
          { type: 'double_sweep', wind: 0.5, dmg: 18, arc: Math.PI * 0.5, range: 35, hits: 2 },
          { type: 'charge', wind: 0.5, dmg: 28, speed: 180, duration: 0.6 },
          { type: 'summon', count: 3, summonType: 'orc_infantry', cd: 10, maxMinions: 4 },
        ],
        restAfterCombo: 1.0,
      },
    ],
    chapter: 1,
  },
  ash_bull: {
    id: 'ash_bull', name: 'Bò Sừng Tro',
    sprite: 'void_beast', hp: 1300, speed: 25,
    xp: 30, gold: 60,
    hitboxW: 28, hitboxH: 22,
    scale: 2.0,
    phases: [
      {
        hpThreshold: 1.0,
        attacks: [
          { type: 'charge', wind: 0.9, dmg: 30, speed: 200, duration: 1.0, stunOnWall: 1.5 },
          { type: 'stomp', wind: 0.6, dmg: 15, radius: 40 },
        ],
        restAfterCombo: 1.5,
      },
      {
        hpThreshold: 0.5,
        attacks: [
          { type: 'double_charge', wind: 0.7, dmg: 28, speed: 220, duration: 0.8 },
          { type: 'stomp', wind: 0.5, dmg: 18, radius: 50 },
          { type: 'summon', count: 2, summonType: 'mad_cow', cd: 15, maxMinions: 2 },
        ],
        restAfterCombo: 1.2,
      },
    ],
    chapter: 2,
  },
  soul_reaper: {
    id: 'soul_reaper', name: 'Kẻ Gặt Hồn',
    sprite: 'orc', hp: 1700, speed: 30,
    xp: 30, gold: 60,
    hitboxW: 24, hitboxH: 24,
    scale: 1.8,
    phases: [
      {
        hpThreshold: 1.0,
        attacks: [
          { type: 'sweep', wind: 0.7, dmg: 22, arc: Math.PI * 0.7, range: 40 },
          { type: 'bullet_ring', wind: 1.0, dmg: 12, count: 8, gap: 1, speed: 80 },
          { type: 'summon', count: 1, summonType: 'ritual_guard', cd: 15, maxMinions: 2 },
        ],
        restAfterCombo: 1.2,
      },
      {
        hpThreshold: 0.6,
        attacks: [
          { type: 'sweep', wind: 0.6, dmg: 25, arc: Math.PI * 0.8, range: 42 },
          { type: 'bullet_ring', wind: 0.8, dmg: 14, count: 12, gap: 2, speed: 90 },
          { type: 'summon', count: 2, summonType: 'ritual_guard', cd: 12, maxMinions: 3 },
        ],
        restAfterCombo: 1.0,
      },
      {
        hpThreshold: 0.3,
        attacks: [
          { type: 'sweep', wind: 0.5, dmg: 28, arc: Math.PI, range: 45 },
          { type: 'bullet_ring', wind: 0.7, dmg: 16, count: 16, gap: 3, speed: 100 },
          { type: 'teleport', wind: 0.3 },
          { type: 'summon', count: 2, summonType: 'orc_warrior', cd: 10, maxMinions: 4 },
        ],
        restAfterCombo: 0.8,
      },
    ],
    chapter: 3,
  },
};

// ---- STAGE DEFINITIONS ----
export const CHAPTERS = [
  {
    id: 1, name: 'Chương I — Đồng Cỏ Thất Thủ',
    background: 'fields',
    stages: [
      { type: 'clear', waves: 3, desc: 'Dọn 3 đợt quái', enemies: ['orc_infantry', 'cursed_chicken'], baseEnemies: 3 },
      { type: 'survive', duration: 75, desc: 'Sống sót 75 giây', enemies: ['orc_infantry', 'cursed_chicken', 'orc_warrior'], spawnRate: 2.5 },
      { type: 'destroy', targets: 2, desc: 'Phá 2 ấn phong', enemies: ['orc_infantry', 'orc_warrior'], baseEnemies: 4 },
      { type: 'boss', bossId: 'orc_chief', desc: 'Đánh bại Thủ Lĩnh Orc' },
    ],
  },
  {
    id: 2, name: 'Chương II — Sân Trại Cuồng Nộ',
    background: 'farm',
    stages: [
      { type: 'clear', waves: 4, desc: 'Dọn đợt hỗn hợp', enemies: ['orc_infantry', 'mad_cow', 'cursed_chicken'], baseEnemies: 6 },
      { type: 'hold', zones: 2, holdTime: 15, desc: 'Giữ 2 khu vực (15s mỗi khu)', enemies: ['orc_infantry', 'cursed_villager', 'mad_cow'], spawnRate: 2.0 },
      { type: 'hunt', targets: 3, desc: 'Săn 3 quái tinh anh', enemies: ['orc_warrior', 'cursed_villager'], eliteType: 'orc_warrior', baseEnemies: 4 },
      { type: 'boss', bossId: 'ash_bull', desc: 'Đánh bại Bò Sừng Tro' },
    ],
  },
  {
    id: 3, name: 'Chương III — Vườn Phong Tàn Úa',
    background: 'garden',
    stages: [
      { type: 'destroy', targets: 3, desc: 'Phá 3 ấn phong', enemies: ['orc_warrior', 'cursed_villager', 'ritual_guard'], baseEnemies: 5 },
      { type: 'survive', duration: 90, desc: 'Sống sót 90 giây', enemies: ['orc_infantry', 'cursed_chicken', 'mad_cow', 'cursed_villager'], spawnRate: 1.8 },
      { type: 'clear', waves: 5, desc: 'Dọn hộ vệ', enemies: ['ritual_guard', 'orc_warrior', 'cursed_villager'], baseEnemies: 5 },
      { type: 'boss', bossId: 'soul_reaper', desc: 'Đánh bại Kẻ Gặt Hồn' },
    ],
  },
];

// ---- META UNLOCKS ----
export const META_UNLOCKS = {
  fire_staff:      { cost: 0,  name: 'Hỏa Trượng', desc: 'Phóng cầu lửa thiêu đốt diện rộng · Kỹ năng [Q]: Bão lửa · Vai trò dọn lính', type: 'artifact' },
  frost_staff:     { cost: 10, name: 'Băng Trượng', desc: 'Bắn tia băng xuyên thấu và làm chậm · Kỹ năng [Q]: Băng phong khống chế', type: 'artifact' },
  thunder_scepter: { cost: 15, name: 'Lôi Trượng', desc: 'Tia sét giật lan chuyền nhiều mục tiêu · Kỹ năng [Q]: Giông sét áp đảo', type: 'artifact' },
  blood_spear:     { cost: 15, name: 'Huyết Thương', desc: 'Đâm thương tầm trung hút máu kẻ địch · Kỹ năng [Q]: Huyết bộc hồi sinh lực', type: 'artifact' },
  composite_bow:   { cost: 10, name: 'Cung Hồn', desc: 'Bắn chuỗi tên linh hồn tầm xa xuyên giáp · Kỹ năng [Q]: Mưa tên công phá', type: 'artifact' },
  void_wand:       { cost: 20, name: 'Hư Vô Trượng', desc: 'Tạo hố đen hút quái và phát nổ · Kỹ năng [Q]: Xoáy hư không gom quái', type: 'artifact' },
  bagSlot:         { cost: 15, name: 'Túi Dự Phòng', desc: '+1 lượt đổi bài nâng cấp mỗi ván', type: 'utility' },
  vigor1:          { cost: 10, name: 'Sức Bền I', desc: '+5 Máu tối đa vĩnh viễn đầu lượt', type: 'stat' },
  vigor2:          { cost: 20, name: 'Sức Bền II', desc: '+10 Máu tối đa vĩnh viễn (cộng dồn +15 HP)', type: 'stat', requires: 'vigor1' },
  magnet1:         { cost: 10, name: 'Nam Châm I', desc: '+10% bán kính hút Tro & XP', type: 'stat' },
  magnet2:         { cost: 20, name: 'Nam Châm II', desc: '+20% bán kính hút Tro & XP (cộng dồn +30%)', type: 'stat', requires: 'magnet1' },
};
