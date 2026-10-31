// Đồ hoạ pixel vẽ bằng code (không dùng ảnh ngoài). Mọi toạ độ làm tròn về pixel.
import { WEAPONS, TIERS } from '../data/weapons.js';
import { ELITE_AFFIXES } from '../entities/enemy.js';

const R = Math.round;
function px(ctx, x, y, w = 1, h = 1, c) { if (c) ctx.fillStyle = c; ctx.fillRect(R(x), R(y), w, h); }

// Vẽ đoạn thẳng pixel theo góc
export function pline(ctx, x, y, ang, len, color, thick = 1, start = 0) {
  ctx.fillStyle = color;
  const cx = Math.cos(ang), cy = Math.sin(ang);
  for (let i = start; i < len; i++) {
    const X = R(x + cx * i), Y = R(y + cy * i);
    ctx.fillRect(X, Y, thick, thick);
  }
}

// ---------------- VŨ KHÍ ----------------
// Vẽ vũ khí từ điểm cầm (hx,hy) theo góc ang (radian, đã tính hướng mặt)
export function drawWeapon(ctx, id, hx, hy, ang, tier = 1, facing = 1, t = 0) {
  const def = WEAPONS[id];
  const col = def.color;
  const tcol = tier === 3 ? '#ffcf6a' : tier === 2 ? '#a8dcff' : null;
  const ca = Math.cos(ang), sa = Math.sin(ang);
  const P = (d, o = 0) => [hx + ca * d - sa * o, hy + sa * d + ca * o];
  switch (def.icon) {
    case 'sword': {
      pline(ctx, hx - ca * 2, hy - sa * 2, ang, 3, '#5a3a24');
      const [gx, gy] = P(1); pline(ctx, gx - sa * 3, gy + ca * 3, ang - Math.PI / 2, 7, '#c8a24a');
      pline(ctx, hx, hy, ang, 15, col, 1, 2); pline(ctx, hx + 0.5, hy + 0.5, ang, 14, tcol || '#ffffff', 1, 3);
      break;
    }
    case 'dagger': {
      pline(ctx, hx, hy, ang, 9, col, 1, 1); pline(ctx, hx, hy, ang, 3, '#3a2a22');
      const [gx, gy] = P(2); px(ctx, gx, gy, 1, 1, '#c8a24a');
      if (tcol) pline(ctx, hx + 0.5, hy, ang, 8, tcol, 1, 4);
      break;
    }
    case 'greatsword': {
      pline(ctx, hx - ca * 3, hy - sa * 3, ang, 4, '#4a3020');
      const [gx, gy] = P(1); pline(ctx, gx - sa * 4, gy + ca * 4, ang - Math.PI / 2, 9, '#8a6a3a');
      pline(ctx, hx, hy, ang, 24, col, 2, 2); pline(ctx, hx, hy, ang, 23, tcol || '#fff6e8', 1, 4);
      break;
    }
    case 'spear': {
      pline(ctx, hx - ca * 10, hy - sa * 10, ang, 32, '#7a5634');
      const [tx, ty] = P(21); pline(ctx, tx, ty, ang, 7, col, 2); px(ctx, tx + ca * 7, ty + sa * 7, 1, 1, tcol || '#fff');
      const [rx, ry] = P(20); px(ctx, rx, ry, 2, 2, '#b3122e');
      break;
    }
    case 'axe': {
      pline(ctx, hx - ca * 3, hy - sa * 3, ang, 17, '#6a4428');
      for (let o = -1; o <= 5; o++) { const [bx, by] = P(12 + Math.abs(o - 2) * 0.4, o * facing); pline(ctx, bx, by, ang, 5 - Math.abs(o - 2) * 0.6, col, 1); }
      const [ex, ey] = P(16, 5 * facing); px(ctx, ex, ey, 1, 1, tcol || '#fff');
      break;
    }
    case 'hammer': {
      pline(ctx, hx - ca * 3, hy - sa * 3, ang, 17, '#5a3a24');
      for (let o = -3; o <= 3; o++) { const [bx, by] = P(12, o); pline(ctx, bx, by, ang, 6, o === -3 || o === 3 ? '#6a7480' : col, 1); }
      if (tcol) { const [bx, by] = P(15, 0); px(ctx, bx, by, 2, 2, tcol); }
      break;
    }
    case 'whip': {
      pline(ctx, hx, hy, ang, 4, '#4a2a1a');
      let x = hx + ca * 4, y = hy + sa * 4;
      for (let i = 0; i < 14; i++) { const w = Math.sin(i * 0.6 + t * 20) * 1.2; px(ctx, x - sa * w, y + ca * w, 1, 1, i > 11 ? (tcol || '#ffd0d8') : col); x += ca * 1.2; y += sa * 1.2; }
      break;
    }
    case 'scythe': {
      pline(ctx, hx - ca * 8, hy - sa * 8, ang, 26, '#4a3a2a');
      const [bx, by] = P(17);
      for (let i = 0; i < 12; i++) { const a2 = ang + facing * (Math.PI / 2 + i * 0.12); px(ctx, bx + Math.cos(a2) * (i * 0.9), by + Math.sin(a2) * (i * 0.9) - sa * i * 0.2, 1, 1, i > 8 ? (tcol || '#e8e0ff') : col); px(ctx, bx + Math.cos(a2) * (i * 0.9) + 1, by + Math.sin(a2) * (i * 0.9), 1, 1, col); }
      break;
    }
    case 'bow': {
      for (let i = -7; i <= 7; i++) { const bend = (1 - (i * i) / 49) * 4; px(ctx, hx + ca * bend - sa * i * 1 * facing * 0 + (facing > 0 ? 0 : 0), hy + i, 1, 1, col); }
      for (let i = -7; i <= 7; i++) px(ctx, hx - facing * 1, hy + i, 1, 1, 'rgba(255,255,255,0.55)');
      if (tcol) { px(ctx, hx + ca * 4, hy - 7, 1, 1, tcol); px(ctx, hx + ca * 4, hy + 7, 1, 1, tcol); }
      break;
    }
    case 'crossbow': {
      pline(ctx, hx - ca * 3, hy - sa * 3, ang, 12, '#6a4a2a', 2);
      const [ex, ey] = P(8); pline(ctx, ex - sa * 5, ey + ca * 5, ang - Math.PI / 2, 11, col);
      if (tcol) px(ctx, ex, ey, 1, 1, tcol);
      break;
    }
    case 'staff': {
      pline(ctx, hx - ca * 6, hy - sa * 6, ang, 20, '#5a3a24');
      const [ox, oy] = P(14);
      const glow = def.color;
      ctx.globalAlpha = 0.35 + 0.2 * Math.sin(t * 8); px(ctx, ox - 2, oy - 2, 5, 5, glow); ctx.globalAlpha = 1;
      px(ctx, ox - 1, oy - 1, 3, 3, glow); px(ctx, ox, oy, 1, 1, '#ffffff');
      if (tcol) px(ctx, ox - 1, oy - 2, 1, 1, tcol);
      break;
    }
    case 'tome': {
      px(ctx, hx - 3, hy - 3, 6, 6, '#3a5a8a'); px(ctx, hx - 2, hy - 2, 4, 4, '#cfe8ff');
      px(ctx, hx - 1, hy - 2, 1, 4, '#3a5a8a');
      ctx.globalAlpha = 0.5 + 0.4 * Math.sin(t * 10); px(ctx, hx - 1 + facing * 4, hy - 1, 2, 2, '#8fe3ff'); ctx.globalAlpha = 1;
      break;
    }
    default: pline(ctx, hx, hy, ang, 12, col);
  }
}

// Biểu tượng vũ khí cho giao diện (vẽ vào canvas nhỏ)
export function weaponIcon(id, tier, size = 32) {
  const c = document.createElement('canvas'); c.width = size; c.height = size;
  const ctx = c.getContext('2d');
  const def = WEAPONS[id];
  const s = size / 32;
  ctx.save(); ctx.scale(s * 1.4, s * 1.4);
  const ang = def.icon === 'bow' || def.icon === 'tome' ? 0 : -Math.PI / 4;
  const hx = def.icon === 'bow' ? 11 : def.icon === 'tome' ? 11 : 6, hy = def.icon === 'bow' ? 11 : def.icon === 'tome' ? 11 : 17;
  drawWeapon(ctx, id, hx, hy, ang, tier, 1, 0.3);
  ctx.restore();
  return c;
}

// ---------------- NGƯỜI CHƠI ----------------
export function drawPlayer(ctx, p, cx, cy, run) {
  const fx = R(p.cx - cx), fy = R(p.y + p.h - cy); // chân
  const f = p.facing;
  const t = p.animT;
  // bóng mờ khi lướt
  for (const a of p.afterimages) {
    ctx.globalAlpha = a.life / 0.16 * 0.4;
    px(ctx, a.x - cx, a.y - cy + 8, p.w, p.h - 8, '#b8f0d8');
  }
  ctx.globalAlpha = 1;
  if (p.dead) return;
  if (p.iframes > 0 && Math.floor(t * 20) % 2 === 0 && p.hurtT <= 0) ctx.globalAlpha = 0.45;
  const run_ = Math.abs(p.vx) > 20 && p.onGround && !p.atk;
  const sq = p.squash; // + bẹt khi đáp, - dài khi nhảy
  const bodyH = R(13 * (1 - sq * 0.5));
  const bob = run_ ? R(Math.abs(Math.sin(t * 14)) * 1) : 0;

  if (p.rolling) {
    // cuộn tròn
    const ang = (1 - p.rollT / 0.3) * Math.PI * 2 * f;
    ctx.save(); ctx.translate(fx, fy - 7); ctx.rotate(ang);
    px(ctx, -5, -5, 10, 10, '#8e1f1f'); px(ctx, -4, -4, 8, 8, '#6b3a2a'); px(ctx, -3, -5, 6, 3, '#b8c2cc'); px(ctx, 1, -4, 2, 1, '#2a2e38');
    ctx.restore();
    return;
  }

  // Áo choàng
  const capeLen = 9 + Math.min(6, Math.abs(p.vx) / 25);
  const wave = Math.sin(t * 9) * 1.5;
  const lift = p.vy < -50 ? 3 : p.vy > 80 ? -3 : 0;
  for (let i = 0; i < capeLen; i++) {
    const k = i / capeLen;
    const x = fx - f * (2 + i * (0.55 + Math.min(0.5, Math.abs(p.vx) / 300)));
    const y = fy - 18 + bob + i * (0.95 - Math.min(0.6, Math.abs(p.vx) / 250)) + Math.sin(t * 9 + i * 0.5) * k * 1.6 * (Math.abs(p.vx) > 20 ? 1 : 0.4) - lift * k + wave * k * 0.3;
    px(ctx, x, y, 2, 3 + R(k * 2), i % 3 === 0 ? '#a32626' : '#8e1f1f');
  }

  // Chân
  const legY = fy - 6;
  let l1 = 0, l2 = 0;
  if (run_) { l1 = R(Math.sin(t * 14) * 2.5); l2 = -l1; }
  else if (!p.onGround) { l1 = p.vy < 0 ? -1 : 1; l2 = p.vy < 0 ? 2 : -1; }
  px(ctx, fx - 3 + l1 * f * 0.6, legY, 2, 5, '#3d3a44'); px(ctx, fx - 3 + l1 * f, fy - 2, 3, 2, '#2a2018');
  px(ctx, fx + 1 + l2 * f * 0.6, legY, 2, 5, '#34313a'); px(ctx, fx + 1 + l2 * f, fy - 2, 3, 2, '#221a14');

  // Thân
  const by = fy - 6 - bodyH + 7 + bob;
  px(ctx, fx - 4, by, 8, 7, '#6b3a2a');           // áo chẽn
  px(ctx, fx - 4, by, 8, 3, '#9aa4ae');           // giáp ngực
  px(ctx, fx - 4 + (f > 0 ? 5 : 0), by, 3, 1, '#c8d0d8');
  px(ctx, fx - 4, by + 5, 8, 1, '#3a2418');       // thắt lưng
  px(ctx, fx - 1, by + 5, 2, 1, '#c8a24a');

  // Đầu (mũ giáp)
  const hy = by - 7;
  px(ctx, fx - 4, hy, 8, 7, '#b8c2cc');
  px(ctx, fx - 4, hy, 8, 1, '#d8e0e8');
  px(ctx, fx - 4 + (f > 0 ? 3 : 0), hy + 3, 5, 1, '#1a1c24'); // khe mắt
  if (p.fate && p.fate.face) { px(ctx, fx - 4 + (f > 0 ? 5 : 1), hy + 3, 2, 1, p.fate.face >= 5 ? '#ff5ad1' : '#ffb340'); }
  px(ctx, fx - 4, hy + 6, 8, 1, '#7a848e');
  // chùm lông đỏ
  for (let i = 0; i < 6; i++) px(ctx, fx - f * (i * 0.9) - 1, hy - 1 - (i < 3 ? 1 : 0) + R(Math.sin(t * 6 + i) * 0.5), 2, 1, i % 2 ? '#c83a2e' : '#e0503a');

  // Tay + vũ khí
  const a = p.atk;
  let weapon = run.weapons[a ? a.slot : 0] || run.weapons[1];
  let ang = f > 0 ? -0.95 : Math.PI + 0.95; // thế thủ: mũi kiếm chếch lên
  const shx = fx + f * 2, shy = by + 2;
  let hx = shx + f * 3, hy2 = shy + 3;
  if (a && weapon) {
    const st = a.step, arc = st.arc;
    const def = a.def;
    if (def.type === 'melee' && arc) {
      const a0 = arc.a0 * Math.PI / 180, a1 = arc.a1 * Math.PI / 180;
      let k = a.phase === 'startup' ? 0 : a.phase === 'active' ? Math.min(1, a.t / st.active) : 1;
      if (a.phase === 'startup') k = -0.15 * (a.t / st.startup);
      let local = arc.thrust ? 0 : a0 + (a1 - a0) * k;
      if (arc.thrust) { const ext = a.phase === 'active' ? 7 : a.phase === 'startup' ? -3 : 3; hx = shx + f * (3 + ext); hy2 = shy + 3; }
      else { hx = shx + f * Math.cos(local) * 4; hy2 = shy + 2 + Math.sin(local) * 4; }
      ang = f > 0 ? local : Math.PI - local;
    } else if (def.type === 'ranged') {
      ang = f > 0 ? 0 : Math.PI;
      hx = shx + f * (a.phase === 'startup' ? 4 : 6); hy2 = shy + 2;
    }
  } else if (weapon) {
    const d = WEAPONS[weapon.id];
    if (d.icon === 'bow' || d.icon === 'tome' || d.icon === 'crossbow') { ang = f > 0 ? 0.6 : Math.PI - 0.6; }
    if (d.icon === 'spear' || d.icon === 'staff' || d.icon === 'scythe') { ang = f > 0 ? -1.2 : Math.PI + 1.2; hy2 = shy + 5; }
    if (!p.onGround) ang += f * -0.4;
    if (run_) hy2 += R(Math.sin(t * 14) * 1);
  }
  px(ctx, shx - 1, shy, 2, 4, '#7a848e');
  if (weapon) drawWeapon(ctx, weapon.id, hx, hy2, ang, weapon.tier, f, t);
  px(ctx, hx - 1, hy2 - 1, 2, 2, '#e0b090'); // bàn tay
  ctx.globalAlpha = 1;

  // Xúc xắc trên đầu
  if (p.diceAnim) drawDie(ctx, fx - 4, hy - 16 - R(Math.sin(p.diceAnim.t * 20) * 3), p.diceAnim.face, '#fff4e0', 9, (1 - p.diceAnim.t / 0.55) * 8);
  else if (p.fate && p.fate.show > 0) drawDie(ctx, fx - 4, hy - 16, p.fate.face, p.fate.face >= 5 ? '#ffd0f0' : '#fff4e0', 9, 0);
}

// Xúc xắc pixel
export function drawDie(ctx, x, y, face, color = '#fff4e0', s = 9, spin = 0) {
  x = R(x); y = R(y);
  ctx.save();
  if (spin) { ctx.translate(x + s / 2, y + s / 2); ctx.rotate(spin); ctx.translate(-x - s / 2, -y - s / 2); }
  px(ctx, x - 1, y - 1, s + 2, s + 2, '#1a1014');
  px(ctx, x, y, s, s, color);
  px(ctx, x, y + s - 1, s, 1, '#c8b8a0');
  const pip = (a, b) => px(ctx, x + a, y + b, 1, 1, face === 6 || face === 5 ? '#b3122e' : '#1a1014');
  const L = 2, M = R(s / 2) - 0, H = s - 3;
  const map = { 1: [[M, M]], 2: [[L, L], [H, H]], 3: [[L, L], [M, M], [H, H]], 4: [[L, L], [H, L], [L, H], [H, H]], 5: [[L, L], [H, L], [M, M], [L, H], [H, H]], 6: [[L, L], [H, L], [L, M], [H, M], [L, H], [H, H]] };
  (map[face] || []).forEach(([a, b]) => pip(a, b));
  ctx.restore();
}

// ---------------- QUÁI ----------------
export function drawEnemy(ctx, e, cx, cy) {
  const fx = R(e.cx - cx), fy = R(e.y + e.h - cy);
  const f = e.facing, t = e.animT;
  if (e.state === 'spawn') {
    const k = 1 - Math.max(0, e.t) / 0.6;
    ctx.globalAlpha = Math.min(1, k);
    px(ctx, fx - 6, fy - 1, 12, 1, '#ff8a3d');
  }
  const flash = e.flash > 0;
  const wind = e.state === 'windup';
  const blink = wind && Math.floor(t * 18) % 2 === 0;
  const frozen = e.status.freeze > 0;
  const sc = e.elite ? 1.2 : 1;
  ctx.save();
  if (e.dead) { ctx.globalAlpha = Math.max(0, 1 - e.deathT / 0.6); }
  // gồng giáp: viền vàng nhấp nháy
  if ((e.armorT || 0) > e.animT && !e.dead) { ctx.globalAlpha = 0.5; px(ctx, fx - e.w / 2 - 1, fy - e.h - 1, e.w + 2, e.h + 1, '#ffb340'); ctx.globalAlpha = 1; }
  // hào quang tinh anh
  if (e.elite && !e.dead) {
    const col = ELITE_AFFIXES[e.elite].color;
    ctx.globalAlpha = 0.25 + 0.15 * Math.sin(t * 6);
    px(ctx, fx - e.w / 2 - 2, fy - e.h - 2, e.w + 4, e.h + 3, col);
    ctx.globalAlpha = e.state === 'spawn' ? ctx.globalAlpha : 1;
  }
  ctx.translate(fx, fy); if (sc !== 1) ctx.scale(sc, sc);
  const C = (c) => (flash ? '#ffffff' : frozen ? '#bfefff' : blink ? lighten(c) : c);
  switch (e.type) {
    case 'scarecrow': case 'dummy': drawScarecrow(ctx, e, f, t, C); break;
    case 'hound': drawHound(ctx, e, f, t, C); break;
    case 'archer': drawArcher(ctx, e, f, t, C); break;
    case 'cultist': drawCultist(ctx, e, f, t, C); break;
    case 'shield': drawShield(ctx, e, f, t, C); break;
  }
  ctx.restore();
  ctx.globalAlpha = 1;
  // báo hiệu đòn
  if (wind && !e.dead) {
    px(ctx, fx - 1, fy - e.h - 9, 2, 5, '#ffd23f'); px(ctx, fx - 1, fy - e.h - 3, 2, 2, '#ffd23f');
    if (e.type === 'archer') {
      ctx.globalAlpha = 0.5 + 0.5 * Math.sin(t * 30);
      const x0 = e.cx - cx, y0 = e.cy - 3 - cy, ang = Math.atan2(e.aimY - e.cy + 3, e.aimX - e.cx);
      for (let i = 6; i < 260; i += 3) px(ctx, x0 + Math.cos(ang) * i, y0 + Math.sin(ang) * i, 1, 1, '#ff4d4d');
      ctx.globalAlpha = 1;
    }
    if (e.type === 'shield') { ctx.globalAlpha = 0.35; for (let i = 0; i < 70; i += 4) px(ctx, fx + f * (10 + i), fy - 2, 2, 1, '#ff4d4d'); ctx.globalAlpha = 1; }
  }
  // thanh máu nhỏ
  if (!e.dead && e.hp < e.maxHp && e.type !== 'dummy') {
    const w = Math.max(14, e.w + 4), x = fx - w / 2, y = fy - e.h * sc - 6;
    px(ctx, x - 1, y - 1, w + 2, 4, '#120a0a'); px(ctx, x, y, w, 2, '#4a1a1a'); px(ctx, x, y, R(w * e.hp / e.maxHp), 2, e.elite ? ELITE_AFFIXES[e.elite].color : '#e04a3a');
  }
  // trạng thái
  if (e.status.burn > 0 && Math.random() < 0.3) { /* hạt lửa vẽ ở fx */ }
  if (e.status.stun > 0) { for (let i = 0; i < 3; i++) { const a = t * 6 + i * 2.1; px(ctx, fx + Math.cos(a) * 6, fy - e.h - 4 + Math.sin(a) * 2, 1, 1, '#ffd23f'); } }
}

function lighten(c) { return c.length === 7 ? '#' + c.slice(1).match(/../g).map((h) => Math.min(255, parseInt(h, 16) + 70).toString(16).padStart(2, '0')).join('') : c; }

function drawScarecrow(ctx, e, f, t, C) {
  const walk = Math.abs(e.vx) > 5 ? Math.sin(t * 10) : 0;
  const atk = e.state === 'attack', wind = e.state === 'windup';
  // cọc chân
  px(ctx, -1 + R(walk), -7, 2, 7, C('#6a4a2a'));
  px(ctx, -3 - R(walk), -4, 2, 4, C('#8a6a32'));
  // thân rơm
  px(ctx, -5, -16, 10, 10, C('#8a6a32'));
  px(ctx, -4, -15, 8, 8, C('#b8904a'));
  for (let i = 0; i < 4; i++) px(ctx, -5 + i * 3, -7 + (i % 2), 1, 2, C('#d8b46a'));
  px(ctx, -5, -12, 10, 1, C('#4a3a22')); // dây buộc
  // tay ngang (cọc)
  const armA = wind ? -0.9 : atk ? 0.7 : 0.1 + Math.sin(t * 3) * 0.08;
  pline(ctx, f * -6, -13, f > 0 ? armA : Math.PI - armA, 13, C('#6a4a2a'));
  // liềm
  if (e.type !== 'dummy') {
    const hx = R(f * -6 + Math.cos(f > 0 ? armA : Math.PI - armA) * 12), hy = R(-13 + Math.sin(f > 0 ? armA : Math.PI - armA) * 12);
    for (let i = 0; i < 6; i++) px(ctx, hx + f * (i < 3 ? i : 3), hy - 3 + i, 1, 1, C('#aeb6be'));
  } else { px(ctx, -3, -14, 6, 6, C('#e8e0cc')); px(ctx, -2, -13, 4, 4, '#c83a2e'); px(ctx, -1, -12, 2, 2, '#e8e0cc'); }
  // đầu bao tải
  px(ctx, -4, -23, 8, 7, C('#d8c49a'));
  px(ctx, -4, -17, 8, 1, C('#a8946a'));
  const eye = e.state === 'chase' || wind || atk ? '#ff8a3d' : '#3a2a1a';
  px(ctx, f > 0 ? 0 : -3, -21, 1, 1, eye); px(ctx, f > 0 ? 2 : -1, -21, 1, 1, eye);
  px(ctx, -2, -19, 4, 1, C('#5a4a32'));
  // nón
  px(ctx, -6, -24, 12, 1, C('#3a2a1e')); px(ctx, -3, -27, 6, 3, C('#3a2a1e')); px(ctx, -1 - f, -29, 2, 2, C('#3a2a1e'));
}

function drawHound(ctx, e, f, t, C) {
  const run = Math.abs(e.vx) > 10;
  const g = run ? Math.sin(t * 18) : 0;
  const air = !e.onGround;
  px(ctx, -8, -9, 16, 5, C('#4a4542'));
  px(ctx, -7, -10, 12, 2, C('#5e5854'));
  for (let i = 0; i < 3; i++) px(ctx, -3 + i * 2, -8, 1, 3, C('#2e2a28')); // xương sườn
  // đầu
  px(ctx, f * 6 - 3, -12, 6, 5, C('#5e5854')); px(ctx, f * 9 - 1, -10, 3, 2, C('#4a4542'));
  px(ctx, f * 7, -11, 1, 1, '#ff6a2a'); px(ctx, f * 5 - 1, -14, 2, 2, C('#3a3634'));
  if (e.state === 'windup' || e.state === 'attack') px(ctx, f * 9, -8, 2, 1, '#fff');
  // đuôi
  px(ctx, -f * 9 - 1, -11 + R(Math.sin(t * 10)), 3, 1, C('#4a4542'));
  // chân
  const legs = air ? [[-6, 2], [5, -2]] : [[-6, R(g * 2)], [-3, -R(g * 2)], [3, R(g * 2)], [6, -R(g * 2)]];
  for (const [x, o] of legs) px(ctx, x + o * 0.5, -4, 2, 4, C('#3a3634'));
  // than hồng trên lưng
  if (Math.sin(t * 5) > 0) px(ctx, -2, -11, 1, 1, '#ff8a3d');
}

function drawArcher(ctx, e, f, t, C) {
  const walk = Math.abs(e.vx) > 5 ? Math.sin(t * 10) : 0;
  px(ctx, -3 + R(walk), -7, 1, 7, C('#e8e0cc')); px(ctx, 2 - R(walk), -7, 1, 7, C('#e8e0cc'));
  px(ctx, -3, -8, 6, 1, C('#d8d0bc'));
  for (let i = 0; i < 4; i++) px(ctx, -3, -15 + i * 2, 6, 1, C('#e8e0cc')); // sườn
  px(ctx, 0, -15, 1, 8, C('#c8c0ac'));
  px(ctx, -4, -16, 8, 1, C('#5a4a3a')); // dây đeo
  px(ctx, -3, -22, 6, 6, C('#efe8d8'));
  px(ctx, f > 0 ? 0 : -2, -20, 2, 2, '#1a1014'); px(ctx, f > 0 ? 0 : -2, -20, 1, 1, e.state === 'windup' ? '#ff4d4d' : '#6a1a1a');
  px(ctx, -2, -17, 4, 1, C('#c8c0ac'));
  // cung
  const bx = f * 5;
  for (let i = -6; i <= 6; i++) px(ctx, bx + f * R((1 - i * i / 36) * 3), -12 + i, 1, 1, C('#8a6a3a'));
  px(ctx, bx, -18, 1, 13, 'rgba(255,255,255,0.4)');
  px(ctx, f * 1, -12, f * 4 || 1, 1, C('#e8e0cc'));
}

function drawCultist(ctx, e, f, t, C) {
  const cast = e.state === 'windup' || e.state === 'attack';
  // áo choàng rách
  for (let i = 0; i < 10; i++) {
    const w = 10 - Math.abs(i - 5) * 0.2;
    px(ctx, -w / 2, -21 + i * 2, w, 2, C(i < 2 ? '#2a1636' : '#3a1f4a'));
  }
  for (let i = 0; i < 5; i++) px(ctx, -5 + i * 2, -2 + R(Math.sin(t * 6 + i) * 1.5), 1, 2, C('#2a1636'));
  // mũ trùm
  px(ctx, -4, -24, 8, 6, C('#2a1636')); px(ctx, -2 + f, -21, 4, 3, '#0a0610');
  px(ctx, f > 0 ? 0 : -1, -20, 1, 1, '#d1b3ff'); px(ctx, f > 0 ? 2 : -3, -20, 1, 1, '#d1b3ff');
  // tay phát sáng
  if (cast) {
    ctx.globalAlpha = 0.5 + 0.4 * Math.sin(t * 20); px(ctx, f * 6 - 2, -16, 5, 5, '#8a5cff'); ctx.globalAlpha = 1;
    px(ctx, f * 6 - 1, -15, 3, 3, '#d1b3ff');
  } else px(ctx, f * 5 - 1, -12, 2, 2, C('#c8b8d8'));
  // ký hiệu xúc xắc trên ngực
  px(ctx, -1, -14, 2, 2, C('#8a5cff'));
}

function drawShield(ctx, e, f, t, C) {
  const walk = Math.abs(e.vx) > 5 ? Math.sin(t * 8) : 0;
  const atk = e.state === 'attack';
  px(ctx, -4 + R(walk), -7, 3, 7, C('#4a4e56')); px(ctx, 1 - R(walk), -7, 3, 7, C('#3e424a'));
  px(ctx, -6, -17, 12, 10, C('#5a5f68'));
  px(ctx, -6, -17, 12, 2, C('#7a808a'));
  px(ctx, -6, -10, 12, 1, C('#3a2a22'));
  // mũ
  px(ctx, -5, -24, 10, 7, C('#6a6f78')); px(ctx, -5, -24, 10, 1, C('#8a909a'));
  px(ctx, f > 0 ? -1 : -4, -21, 5, 1, '#0a0a0e'); px(ctx, f > 0 ? 2 : -3, -21, 1, 1, '#ff8a3d');
  px(ctx, -1, -27, 2, 3, C('#8e1f1f'));
  // khiên tháp phía trước
  const sx = f > 0 ? 4 + (atk ? 3 : 0) : -9 - (atk ? 3 : 0);
  px(ctx, sx, -22, 6, 19, C('#6a5a3a'));
  px(ctx, sx, -22, 6, 1, C('#9aa0a8')); px(ctx, sx, -4, 6, 1, C('#9aa0a8'));
  px(ctx, f > 0 ? sx + 5 : sx, -22, 1, 19, C('#9aa0a8'));
  px(ctx, sx + 2, -14, 2, 3, C('#c8a24a'));
  if (e.status.stun > 0 || e.state === 'stagger') px(ctx, sx + 1, -19, 1, 4, '#fff');
}

// ---------------- BOSS ----------------
export function drawBoss(ctx, b, cx, cy) {
  const fx = R(b.cx - cx), fy = R(b.y + b.h - cy), f = b.facing, t = b.animT;
  const flash = b.flash > 0;
  const C = (c) => (flash ? '#ffffff' : c);
  const p2 = b.phase === 2;
  ctx.save();
  if (b.dead) ctx.globalAlpha = Math.max(0, 1 - b.deathT / 1.5);
  // vùng cảnh báo
  if (b.telegraph && !b.dead) {
    const tg = b.telegraph;
    ctx.globalAlpha = 0.35 + 0.25 * Math.sin(t * 25);
    if (tg.kind === 'line') px(ctx, Math.min(tg.x - cx, tg.x - cx + tg.dir * tg.len), tg.y - cy - 14, tg.len, 18, '#ff3c1e');
    if (tg.kind === 'circle') px(ctx, tg.x - cx - tg.r, tg.y - cy - 3, tg.r * 2, 3, '#ff3c1e');
    ctx.globalAlpha = b.dead ? ctx.globalAlpha : 1;
  }
  const wind = b.state === 'windup' || b.state === 'windup2';
  const step = Math.abs(b.vx) > 20 ? Math.sin(t * 8) : 0;
  // chân
  px(ctx, fx - 7 + R(step * 2), fy - 12, 5, 12, C('#3e424a')); px(ctx, fx + 2 - R(step * 2), fy - 12, 5, 12, C('#34383f'));
  px(ctx, fx - 8 + R(step * 2), fy - 2, 7, 2, C('#2a2018')); px(ctx, fx + 1 - R(step * 2), fy - 2, 7, 2, C('#2a2018'));
  // thân giáp + rơm
  px(ctx, fx - 10, fy - 30, 20, 18, C('#5a5f68'));
  px(ctx, fx - 9, fy - 29, 18, 4, C('#8a909a'));
  for (let i = 0; i < 6; i++) px(ctx, fx - 10 + i * 4 + R(Math.sin(t * 3 + i)), fy - 13 + (i % 2), 2, 3, C('#c9a45a'));
  px(ctx, fx - 2, fy - 24, 4, 5, C(p2 ? '#ff5a3c' : '#c8a24a')); // huy hiệu ngọn lửa
  px(ctx, fx - 1, fy - 26, 2, 2, C(p2 ? '#ffd23f' : '#e8c86a'));
  px(ctx, fx - 10, fy - 17, 20, 2, C('#3a2a22'));
  // áo choàng rách
  for (let i = 0; i < 14; i++) px(ctx, fx - f * (10 + i * 0.6), fy - 30 + i * 1.6 + R(Math.sin(t * 5 + i) * 1), 2, 3, C(i % 2 ? '#5a1414' : '#6a1a1a'));
  // đầu bao tải + mũ giáp vỡ
  px(ctx, fx - 6, fy - 40, 12, 10, C('#d8c49a'));
  px(ctx, fx - 7, fy - 41, 14, 4, C('#6a6f78'));
  px(ctx, fx - 7, fy - 41, 14, 1, C('#9aa0a8'));
  const eye = p2 ? '#ff3c1e' : '#ffb340';
  px(ctx, fx + (f > 0 ? 0 : -4), fy - 35, 2, 2, eye); px(ctx, fx + (f > 0 ? 3 : -1), fy - 35, 2, 2, eye);
  px(ctx, fx - 3, fy - 32, 6, 1, C('#5a4a32'));
  // lưỡi hái khổng lồ
  let ang = wind ? -2.2 : b.state === 'swing' ? 0.9 : b.state === 'dashing' ? 0.2 : -0.6 + Math.sin(t * 2) * 0.1;
  if (b.state === 'casting') ang = -1.57;
  const a2 = f > 0 ? ang : Math.PI - ang;
  const hx = fx + f * 8, hy = fy - 24;
  pline(ctx, hx - Math.cos(a2) * 10, hy - Math.sin(a2) * 10, a2, 40, C('#4a3a2a'), 2);
  const bx = hx + Math.cos(a2) * 28, by = hy + Math.sin(a2) * 28;
  for (let i = 0; i < 18; i++) {
    const aa = a2 + f * (Math.PI / 2 + i * 0.09);
    px(ctx, bx + Math.cos(aa) * i * 1.1, by + Math.sin(aa) * i * 1.1, 2, 2, C(i > 13 ? '#fff2d0' : p2 ? '#ff7a3c' : '#aeb6be'));
  }
  if (p2 && !b.dead) { for (let i = 0; i < 3; i++) if (Math.random() < 0.6) { ctx.globalAlpha = 0.8; px(ctx, fx - 8 + Math.random() * 16, fy - 42 - Math.random() * 6, 1, 2, Math.random() < 0.5 ? '#ffd23f' : '#ff5a3c'); } ctx.globalAlpha = 1; }
  if (b.status.stun > 0 || (b.state === 'recover' && b.t > 0.7)) for (let i = 0; i < 4; i++) { const a = t * 6 + i * 1.6; px(ctx, fx + Math.cos(a) * 9, fy - 46 + Math.sin(a) * 2, 1, 1, '#ffd23f'); }
  ctx.restore();
}

// ---------------- ĐẠN ----------------
export function drawProjectile(ctx, p, cx, cy, t) {
  const x = R(p.x - cx), y = R(p.y - cy);
  if (p.delay > 0 && p.kind !== 'crow') return;
  switch (p.kind) {
    case 'arrow': case 'bolt': {
      const ang = Math.atan2(p.vy, p.vx);
      pline(ctx, x - Math.cos(ang) * 8, y - Math.sin(ang) * 8, ang, 9, p.owner === 'enemy' ? '#d8d0bc' : '#c8a46a');
      px(ctx, x, y, 2, 1, p.owner === 'enemy' ? '#ff4d4d' : '#ffffff');
      px(ctx, x - Math.cos(ang) * 8, y - Math.sin(ang) * 8 - 1, 1, 3, '#e8e0cc');
      break;
    }
    case 'fireball': px(ctx, x - 4, y - 4, 8, 8, 'rgba(255,90,40,0.45)'); px(ctx, x - 3, y - 3, 6, 6, '#ff8a3d'); px(ctx, x - 2, y - 2, 4, 4, '#ffd23f'); px(ctx, x - 1, y - 1, 2, 2, '#fff'); break;
    case 'ice': { const ang = Math.atan2(p.vy, p.vx); pline(ctx, x - Math.cos(ang) * 6, y - Math.sin(ang) * 6, ang, 7, '#9fe8ff', 2); px(ctx, x, y, 2, 2, '#ffffff'); break; }
    case 'shock': px(ctx, x - 6, y - 4, 12, 8, 'rgba(232,216,176,0.35)'); for (let i = 0; i < 4; i++) px(ctx, x - 5 + i * 3, y + 4 - (i % 2 ? 6 : 3), 2, i % 2 ? 6 : 3, p.owner === 'enemy' ? '#ff9a5a' : '#e8d8b0'); break;
    case 'orb': px(ctx, x - 4, y - 4, 8, 8, 'rgba(138,92,255,0.4)'); px(ctx, x - 3, y - 3, 6, 6, '#8a5cff'); px(ctx, x - 1, y - 1, 2, 2, '#ffffff'); break;
    case 'flamewave': for (let i = 0; i < 4; i++) { const h = 6 + R(Math.sin(t * 25 + i) * 3); px(ctx, x - 6 + i * 3, y + 6 - h, 3, h, i % 2 ? '#ff5a3c' : '#ffb340'); } px(ctx, x - 6, y + 5, 12, 2, '#ffd23f'); break;
    case 'crow': {
      if (p.delay > 0) {
        // cột cảnh báo
        ctx.globalAlpha = 0.25 + 0.3 * Math.sin(t * 30);
        px(ctx, x - 5, 0, 10, 270, '#ff3c1e');
        ctx.globalAlpha = 1;
        break;
      }
      const flap = Math.sin(t * 40) > 0 ? -2 : 1;
      px(ctx, x - 2, y - 3, 4, 6, '#1a1418'); px(ctx, x - 6, y - 2 + flap, 4, 2, '#2a2228'); px(ctx, x + 2, y - 2 + flap, 4, 2, '#2a2228');
      px(ctx, x - 1, y + 3, 2, 2, '#c8a24a'); px(ctx, x - 1, y - 2, 1, 1, '#ff3c1e');
      break;
    }
  }
}

// ---------------- ĐỐI TƯỢNG ----------------
export function drawObject(ctx, o, cx, cy, t, focus) {
  const x = R(o.x - cx), y = R(o.y - cy);
  switch (o.kind) {
    case 'coin': px(ctx, x - 1, y - 1, 3, 3, '#ffd23f'); px(ctx, x, y - 1, 1, 1, '#fff6c0'); break;
    case 'torch': {
      px(ctx, x + 1, y + 4, 2, 8, '#5a3a24'); px(ctx, x, y + 3, 4, 2, '#3a2a1a');
      const fl = Math.sin(t * 13 + o.t) + Math.sin(t * 7.3);
      px(ctx, x, y - 1 + R(fl * 0.5), 4, 4, '#ff8a3d'); px(ctx, x + 1, y - 3 + R(fl), 2, 4, '#ffd23f'); px(ctx, x + 1, y, 2, 2, '#fff6c0');
      break;
    }
    case 'sign': px(ctx, x + 7, y + 6, 2, 10, '#5a3a24'); px(ctx, x + 1, y, 14, 9, '#8a6a42'); px(ctx, x + 2, y + 1, 12, 7, '#a8844e'); for (let i = 0; i < 3; i++) px(ctx, x + 4, y + 2 + i * 2, 8 - i * 2, 1, '#5a3a24'); if (focus) bob(ctx, x + 8, y - 6, t); break;
    case 'gate': {
      const open = o.open;
      px(ctx, x - 2, y - 2, 4, o.h + 2, '#3a3238'); px(ctx, x + o.w - 2, y - 2, 4, o.h + 2, '#3a3238');
      px(ctx, x - 2, y - 4, o.w + 4, 4, '#4a424a');
      if (open) {
        ctx.globalAlpha = 0.5 + 0.3 * Math.sin(t * 4);
        px(ctx, x + 2, y, o.w - 4, o.h, '#ffb36a');
        ctx.globalAlpha = 0.9; px(ctx, x + 5, y + 3, o.w - 10, o.h - 3, '#fff2d0'); ctx.globalAlpha = 1;
        for (let i = 0; i < 3; i++) px(ctx, x + 3 + ((t * 20 + i * 7) % (o.w - 6)), y + o.h - ((t * 30 + i * 11) % o.h), 1, 1, '#fff');
      } else {
        px(ctx, x + 2, y, o.w - 4, o.h, '#1a1418');
        for (let i = 0; i < 4; i++) px(ctx, x + 3 + i * 4, y, 1, o.h, '#4a424a');
        for (let i = 0; i < 3; i++) px(ctx, x + 2, y + 6 + i * 9, o.w - 4, 1, '#4a424a');
        ctx.globalAlpha = 0.4 + 0.3 * Math.sin(t * 3); px(ctx, x + o.w / 2 - 2, y + o.h / 2 - 3, 4, 6, '#ff3c1e'); ctx.globalAlpha = 1;
      }
      if (focus && open) bob(ctx, x + o.w / 2, y - 10, t);
      break;
    }
    case 'chest': {
      const st = o.state;
      const base = st === 'empty' ? '#4a4040' : '#6a4428';
      px(ctx, x, y + 4, 18, 10, base); px(ctx, x, y + 4, 18, 1, '#8a5a34');
      px(ctx, x, y + 8, 18, 1, '#3a2418');
      px(ctx, x + 2, y + 4, 2, 10, '#a8a0a0'); px(ctx, x + 14, y + 4, 2, 10, '#a8a0a0');
      if (st === 'closed') {
        px(ctx, x, y, 18, 5, '#7a4e2e'); px(ctx, x, y, 18, 1, '#9a6a3e');
        px(ctx, x + 2, y, 2, 5, '#a8a0a0'); px(ctx, x + 14, y, 2, 5, '#a8a0a0');
        // biểu tượng xúc xắc trên nắp
        drawDie(ctx, x + 6, y + 3, o.cond.id === 'six' ? 6 : o.cond.dice === 2 ? 2 : 5, o.vault ? '#ffcf6a' : '#fff4e0', 6);
        ctx.globalAlpha = 0.3 + 0.25 * Math.sin(t * 3 + o.x); px(ctx, x - 1, y - 1, 20, 16, o.vault ? '#ffb340' : '#ffe8b0'); ctx.globalAlpha = 1;
        if (focus) bob(ctx, x + 9, y - 10, t);
      } else {
        px(ctx, x, y - 3, 18, 3, st === 'empty' ? '#3a3232' : '#7a4e2e');
        if (st === 'open') { ctx.globalAlpha = 0.6; px(ctx, x + 3, y + 3, 12, 2, '#ffd23f'); ctx.globalAlpha = 1; }
        else for (let i = 0; i < 3; i++) px(ctx, x + 4 + i * 4, y + 3, 2, 1, '#8a8080');
      }
      break;
    }
    case 'door': {
      if (o.used) break;
      const tx = x, h = o.h;
      ctx.globalAlpha = 0.5 + 0.3 * Math.sin(t * 2.5);
      px(ctx, tx + 4, y - 8, o.w - 8, h + 8, '#ffb340'); ctx.globalAlpha = 1;
      drawDie(ctx, tx + o.w / 2 - 5, y + h / 2 - 5, o.cond.id === 'six' ? 6 : 3, '#ffcf6a', 10);
      if (focus) bob(ctx, tx + o.w / 2, y - 18, t);
      break;
    }
    case 'pedestal': {
      px(ctx, x, y + 8, 16, 6, '#5a5260'); px(ctx, x + 2, y + 6, 12, 2, '#7a7280'); px(ctx, x, y + 8, 16, 1, '#8a8290');
      if (!o.taken) {
        const w = o.weapon, tier = TIERS[w.tier - 1];
        const fl = R(Math.sin(t * 3 + o.t) * 2);
        ctx.globalAlpha = 0.35; px(ctx, x + 2, y - 14 + fl, 12, 16, tier.color); ctx.globalAlpha = 1;
        drawWeapon(ctx, w.id, x + 4, y - 2 + fl, -Math.PI / 3, w.tier, 1, t);
        if (focus) bob(ctx, x + 8, y - 22, t);
      }
      break;
    }
    case 'drop': {
      const w = o.weapon, tier = TIERS[w.tier - 1];
      const fl = o.onGround ? R(Math.sin(t * 3) * 1) : 0;
      ctx.globalAlpha = 0.3 + 0.15 * Math.sin(t * 5); px(ctx, x + 1, y - 6 + fl, 14, 18, tier.color); ctx.globalAlpha = 1;
      if (w.tier >= 2) { px(ctx, x + 7, y - 30, 2, 24, tier.color); ctx.globalAlpha = 0.25; px(ctx, x + 5, y - 40, 6, 34, tier.color); ctx.globalAlpha = 1; }
      drawWeapon(ctx, w.id, x + 3, y + 8 + fl, -Math.PI / 4, w.tier, 1, t);
      if (focus) bob(ctx, x + 8, y - 14, t);
      break;
    }
    case 'forge': {
      px(ctx, x, y + 8, 28, 18, '#3a3238'); px(ctx, x + 2, y + 6, 24, 4, '#4a424a');
      px(ctx, x + 8, y + 12, 12, 10, '#1a1014');
      const fl = Math.sin(t * 9);
      px(ctx, x + 9, y + 15 + R(fl), 10, 7, '#ff5a3c'); px(ctx, x + 11, y + 17, 6, 5, '#ffb340'); px(ctx, x + 13, y + 19, 2, 3, '#fff2b0');
      px(ctx, x + 22, y - 6, 5, 14, '#2a2428');
      ctx.globalAlpha = 0.15 + 0.1 * fl; px(ctx, x - 10, y - 10, 48, 40, '#ff8a3d'); ctx.globalAlpha = 1;
      // đe
      px(ctx, x - 12, y + 16, 10, 4, '#6a6f78'); px(ctx, x - 10, y + 20, 6, 6, '#4a4e56');
      if (focus) bob(ctx, x + 14, y - 8, t);
      break;
    }
    case 'merchant': {
      // thương nhân trùm áo, đèn lồng
      px(ctx, x + 2, y + 6, 12, 18, '#4a3a5a'); px(ctx, x + 3, y + 2, 10, 8, '#3a2a4a');
      px(ctx, x + 6, y + 5, 4, 3, '#0a0610'); px(ctx, x + 7, y + 6, 1, 1, '#ffd23f'); px(ctx, x + 9, y + 6, 1, 1, '#ffd23f');
      px(ctx, x + 12, y + 2, 1, 12, '#5a3a24');
      const fl = 0.6 + 0.3 * Math.sin(t * 6);
      ctx.globalAlpha = fl * 0.4; px(ctx, x + 9, y + 12, 8, 8, '#ffd23f'); ctx.globalAlpha = 1;
      px(ctx, x + 11, y + 14, 4, 4, '#ffb340');
      px(ctx, x - 14, y + 16, 12, 8, '#6a4428'); px(ctx, x - 13, y + 14, 10, 2, '#8a5a34');
      if (focus) bob(ctx, x + 8, y - 8, t);
      break;
    }
  }
}

function bob(ctx, x, y, t) {
  const o = R(Math.sin(t * 5) * 1.5);
  px(ctx, x - 3, y + o, 7, 7, '#1a1014'); px(ctx, x - 2, y + 1 + o, 5, 5, '#fff4e0');
  px(ctx, x - 1, y + 2 + o, 3, 1, '#1a1014'); px(ctx, x - 1, y + 3 + o, 1, 1, '#1a1014'); px(ctx, x - 1, y + 4 + o, 3, 1, '#1a1014'); px(ctx, x, y + 3 + o, 1, 1, '#1a1014');
}
