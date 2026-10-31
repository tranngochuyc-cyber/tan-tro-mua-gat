// Kho vũ khí. Thời gian tính bằng giây. hitbox tính từ tâm người chơi theo hướng mặt (x dương = phía trước).
// arc: vệt chém {r0, r1, a0, a1} (độ; 0 = phía trước, âm = hướng lên).
export const TIERS = [
  { id: 1, name: 'Thường', mult: 1.0, color: '#d8d2c4', glow: 'rgba(216,210,196,0.0)' },
  { id: 2, name: 'Tinh Xảo', mult: 1.55, color: '#5fb8ff', glow: 'rgba(95,184,255,0.35)' },
  { id: 3, name: 'Huyền Thoại', mult: 2.3, color: '#ffb340', glow: 'rgba(255,179,64,0.45)' },
];

export const TRAITS = {
  burn: { name: 'Thiêu Đốt', desc: 'Đòn đánh gây cháy 3 giây' },
  bleed: { name: 'Xé Thịt', desc: 'Đòn đánh gây chảy máu cộng dồn' },
  keen: { name: 'Sắc Bén', desc: '+15% tỉ lệ chí mạng' },
  vamp: { name: 'Hút Hồn', desc: 'Hồi 3% sát thương gây ra' },
  fated: { name: 'Định Mệnh', desc: 'Nạp Vận Mệnh nhanh hơn 50%' },
};

const M = (o) => ({ type: 'melee', ...o });
const R = (o) => ({ type: 'ranged', ...o });

export const WEAPONS = {
  broadsword: M({
    name: 'Kiếm Hiệp Sĩ', short: 'Kiếm', desc: 'Combo 3 nhát cân bằng, nhát cuối bổ mạnh.', color: '#cfd8e3', icon: 'sword',
    combo: [
      { startup: 0.07, active: 0.08, recovery: 0.16, dmg: 12, box: { x: 4, y: -16, w: 26, h: 24 }, kb: 90, lunge: 70, arc: { r0: 8, r1: 24, a0: -115, a1: 45 }, hitstop: 0.045, sfx: 'swing' },
      { startup: 0.06, active: 0.08, recovery: 0.16, dmg: 13, box: { x: 4, y: -14, w: 26, h: 22 }, kb: 90, lunge: 70, arc: { r0: 8, r1: 24, a0: 55, a1: -85 }, hitstop: 0.045, sfx: 'swing' },
      { startup: 0.13, active: 0.1, recovery: 0.28, dmg: 22, box: { x: 2, y: -24, w: 32, h: 32 }, kb: 210, lunge: 150, arc: { r0: 6, r1: 30, a0: -160, a1: 70 }, hitstop: 0.09, shake: 0.22, sfx: 'heavySwing' },
    ],
  }),
  daggers: M({
    name: 'Song Dao Gió', short: 'Song dao', desc: 'Cực nhanh, 4 nhát. Đâm sau lưng gây x1.5 sát thương.', color: '#b8f0d8', icon: 'dagger', backstab: 1.5,
    combo: [
      { startup: 0.03, active: 0.05, recovery: 0.07, dmg: 6, box: { x: 2, y: -12, w: 19, h: 16 }, kb: 30, lunge: 60, arc: { r0: 6, r1: 17, a0: -60, a1: 30 }, hitstop: 0.03, sfx: 'swing', pitch: 1.4 },
      { startup: 0.03, active: 0.05, recovery: 0.07, dmg: 6, box: { x: 2, y: -12, w: 19, h: 16 }, kb: 30, lunge: 60, arc: { r0: 6, r1: 17, a0: 40, a1: -50 }, hitstop: 0.03, sfx: 'swing', pitch: 1.5 },
      { startup: 0.03, active: 0.05, recovery: 0.08, dmg: 7, box: { x: 2, y: -12, w: 20, h: 16 }, kb: 30, lunge: 60, arc: { r0: 6, r1: 18, a0: -70, a1: 20 }, hitstop: 0.03, sfx: 'swing', pitch: 1.6 },
      { startup: 0.06, active: 0.07, recovery: 0.2, dmg: 13, box: { x: 2, y: -14, w: 24, h: 20 }, kb: 140, lunge: 160, arc: { r0: 4, r1: 22, a0: -10, a1: 10, thrust: true }, hitstop: 0.07, shake: 0.12, sfx: 'swing', pitch: 1.2 },
    ],
  }),
  greatsword: M({
    name: 'Đại Kiếm Tro', short: 'Đại kiếm', desc: 'Chậm nhưng cực nặng. Phá được khiên, đẩy lùi xa.', color: '#e0c8b0', icon: 'greatsword', armorBreak: true,
    combo: [
      { startup: 0.24, active: 0.12, recovery: 0.34, dmg: 34, box: { x: 0, y: -28, w: 38, h: 38 }, kb: 260, lunge: 90, arc: { r0: 6, r1: 36, a0: -170, a1: 60 }, hitstop: 0.11, shake: 0.32, sfx: 'heavySwing' },
      { startup: 0.2, active: 0.12, recovery: 0.42, dmg: 46, box: { x: -6, y: -22, w: 44, h: 34 }, kb: 320, lunge: 140, arc: { r0: 6, r1: 38, a0: 70, a1: -150 }, hitstop: 0.13, shake: 0.4, sfx: 'heavySwing' },
    ],
  }),
  spear: M({
    name: 'Giáo Kỵ Sĩ', short: 'Giáo', desc: 'Tầm đâm rất xa, xuyên nhiều kẻ địch.', color: '#d9c48a', icon: 'spear',
    combo: [
      { startup: 0.09, active: 0.09, recovery: 0.18, dmg: 11, box: { x: 4, y: -9, w: 44, h: 9 }, kb: 80, lunge: 50, arc: { r0: 6, r1: 46, a0: -4, a1: 4, thrust: true }, hitstop: 0.04, sfx: 'swing', pitch: 1.2 },
      { startup: 0.08, active: 0.09, recovery: 0.18, dmg: 11, box: { x: 4, y: -9, w: 44, h: 9 }, kb: 80, lunge: 50, arc: { r0: 6, r1: 46, a0: 4, a1: -4, thrust: true }, hitstop: 0.04, sfx: 'swing', pitch: 1.25 },
      { startup: 0.14, active: 0.12, recovery: 0.3, dmg: 22, box: { x: 4, y: -10, w: 54, h: 11 }, kb: 220, lunge: 210, arc: { r0: 6, r1: 56, a0: -3, a1: 3, thrust: true }, hitstop: 0.08, shake: 0.18, sfx: 'heavySwing' },
    ],
  }),
  axe: M({
    name: 'Rìu Chiến Bắc', short: 'Rìu', desc: 'Vung rộng, chém trúng cả phía sau. Gây chảy máu.', color: '#c9a07a', icon: 'axe', innate: 'bleed',
    combo: [
      { startup: 0.15, active: 0.1, recovery: 0.24, dmg: 19, box: { x: -12, y: -20, w: 44, h: 28 }, kb: 150, lunge: 60, arc: { r0: 8, r1: 30, a0: -150, a1: 80 }, hitstop: 0.07, shake: 0.15, sfx: 'heavySwing' },
      { startup: 0.14, active: 0.1, recovery: 0.3, dmg: 27, box: { x: -14, y: -20, w: 48, h: 28 }, kb: 200, lunge: 80, arc: { r0: 8, r1: 32, a0: 90, a1: -160 }, hitstop: 0.09, shake: 0.22, sfx: 'heavySwing' },
    ],
  }),
  hammer: M({
    name: 'Búa Sấm Thép', short: 'Búa', desc: 'Nện xuống đất tạo sóng chấn động hai bên. Phá khiên, làm choáng.', color: '#a8b4c8', icon: 'hammer', armorBreak: true, stun: 0.7,
    combo: [
      { startup: 0.3, active: 0.1, recovery: 0.42, dmg: 38, box: { x: -2, y: -20, w: 34, h: 30 }, kb: 120, lunge: 40, arc: { r0: 4, r1: 30, a0: -160, a1: 90 }, hitstop: 0.13, shake: 0.45, sfx: 'slam', shockwave: { dmg: 14, speed: 230, life: 0.5 } },
    ],
  }),
  whip: M({
    name: 'Roi Gai Hồng', short: 'Roi', desc: 'Quất rất xa và nhanh. Đầu roi gây chí mạng cao hơn.', color: '#e07a8a', icon: 'whip', tipCrit: 0.25,
    combo: [
      { startup: 0.1, active: 0.07, recovery: 0.2, dmg: 10, box: { x: 6, y: -12, w: 58, h: 12 }, kb: 60, lunge: 0, arc: { r0: 6, r1: 62, a0: -8, a1: 6, thrust: true, wave: true }, hitstop: 0.04, sfx: 'swing', pitch: 1.6 },
      { startup: 0.09, active: 0.07, recovery: 0.24, dmg: 14, box: { x: 6, y: -16, w: 60, h: 16 }, kb: 120, lunge: 0, arc: { r0: 6, r1: 64, a0: 6, a1: -10, thrust: true, wave: true }, hitstop: 0.06, sfx: 'swing', pitch: 1.8 },
    ],
  }),
  scythe: M({
    name: 'Lưỡi Hái Mùa Gặt', short: 'Lưỡi hái', desc: 'Quét vòng tròn cả hai phía. Hút máu nhẹ.', color: '#b9a6ff', icon: 'scythe', innate: 'vamp',
    combo: [
      { startup: 0.16, active: 0.14, recovery: 0.24, dmg: 17, box: { x: -32, y: -22, w: 64, h: 30 }, kb: 130, lunge: 40, arc: { r0: 10, r1: 32, a0: -180, a1: 180 }, hitstop: 0.06, shake: 0.12, sfx: 'heavySwing', pitch: 1.2 },
      { startup: 0.14, active: 0.14, recovery: 0.3, dmg: 24, box: { x: -34, y: -24, w: 68, h: 32 }, kb: 200, lunge: 60, arc: { r0: 10, r1: 34, a0: 180, a1: -180 }, hitstop: 0.08, shake: 0.2, sfx: 'heavySwing' },
    ],
  }),
  bow: R({
    name: 'Cung Săn Rừng Tro', short: 'Cung', desc: 'Bắn tên tầm xa. Trúng điểm yếu dễ chí mạng.', color: '#c8a46a', icon: 'bow', critBonus: 0.12,
    combo: [{ startup: 0.11, recovery: 0.2, shots: [{ kind: 'arrow', speed: 430, dmg: 14, grav: 90, delay: 0 }], sfx: 'shoot' }],
  }),
  crossbow: R({
    name: 'Nỏ Lặp Thủ Thành', short: 'Nỏ', desc: 'Bắn liền 3 mũi tên nỏ thẳng tắp.', color: '#9aa7b0', icon: 'crossbow',
    combo: [{ startup: 0.09, recovery: 0.36, shots: [0, 0.07, 0.14].map((d) => ({ kind: 'bolt', speed: 520, dmg: 7, grav: 0, delay: d })), sfx: 'shoot' }],
  }),
  firestaff: R({
    name: 'Trượng Hỏa Ngục', short: 'Trượng lửa', desc: 'Cầu lửa nổ lan, đốt cháy kẻ địch.', color: '#ff8a3d', icon: 'staff', innate: 'burn', magic: true,
    combo: [{ startup: 0.18, recovery: 0.34, shots: [{ kind: 'fireball', speed: 230, dmg: 16, grav: 0, delay: 0, explode: { r: 30, dmg: 12 } }], sfx: 'fire' }],
  }),
  tome: R({
    name: 'Sách Lôi Thần', short: 'Sách sét', desc: 'Sét tự tìm mục tiêu, chuyền qua 3 kẻ địch.', color: '#8fe3ff', icon: 'tome', magic: true,
    combo: [{ startup: 0.14, recovery: 0.3, chain: { dmg: 13, range: 150, jumps: 3 }, sfx: 'zap' }],
  }),
  froststaff: R({
    name: 'Trượng Băng Sương', short: 'Trượng băng', desc: 'Mảnh băng làm chậm. Trúng 3 lần liên tiếp sẽ đóng băng.', color: '#9fe8ff', icon: 'staff', magic: true,
    combo: [{ startup: 0.11, recovery: 0.26, shots: [{ kind: 'ice', speed: 320, dmg: 11, grav: 0, delay: 0, slow: 2 }], sfx: 'ice' }],
  }),
};

export const WEAPON_IDS = Object.keys(WEAPONS);

export function makeWeapon(id, tier = 1, level = 0, trait = null) {
  const def = WEAPONS[id];
  return { id, tier, level, trait: trait || def.innate || null };
}

export function weaponPower(w) {
  return TIERS[w.tier - 1].mult * (1 + 0.14 * w.level);
}

export function weaponLabel(w) {
  return `${WEAPONS[w.id].name}${w.level ? ' +' + w.level : ''}`;
}

// Sát thương trung bình mỗi giây (để so sánh khi nhặt)
export function weaponDps(w) {
  const def = WEAPONS[w.id];
  let dmg = 0, time = 0;
  for (const s of def.combo) {
    let d = s.dmg || 0;
    if (s.shots) d = s.shots.reduce((a, b) => a + b.dmg + (b.explode ? b.explode.dmg : 0), 0);
    if (s.chain) d = s.chain.dmg * 2;
    if (s.shockwave) d += s.shockwave.dmg;
    dmg += d; time += (s.startup || 0) + (s.active || 0.02) + (s.recovery || 0);
  }
  return Math.round((dmg / time) * weaponPower(w));
}
