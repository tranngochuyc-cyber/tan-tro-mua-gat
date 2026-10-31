// Vẽ ô địa hình (có cache), nền parallax, tro rơi
import { TILE, T } from '../world/level.js';
import { VIEW_W, VIEW_H } from '../core/camera.js';

const hash = (x, y) => { let h = (x * 374761393 + y * 668265263) ^ 0x5bd1e995; h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };

function makeCanvas(w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; }

const PALETTES = {
  field: { top: ['#4a5a2e', '#5e6e36', '#3a4a26'], dirt: ['#3b2a22', '#33241e', '#42302a'], deep: '#24181a', stone: '#4a3a32', ash: '#8a8078' },
  boss: { top: ['#4a3a32', '#5a4a3a', '#3a2a26'], dirt: ['#2e2226', '#281e22', '#34262a'], deep: '#1a1216', stone: '#4a3a42', ash: '#9a8a80' },
};

export function buildTileCache(level, kind) {
  const pal = PALETTES[kind === 'boss' ? 'boss' : 'field'];
  const c = makeCanvas(level.pw, level.ph);
  const ctx = c.getContext('2d');
  for (let ty = 0; ty < level.h; ty++) {
    for (let tx = 0; tx < level.w; tx++) {
      const t = level.get(tx, ty);
      const x = tx * TILE, y = ty * TILE;
      if (t === T.SOLID) {
        const above = level.get(tx, ty - 1);
        const exposed = above !== T.SOLID && above !== T.DOOR;
        const depth = (() => { let d = 0; for (let k = 1; k <= 3; k++) { if (level.get(tx, ty - k) === T.SOLID) d++; else break; } return d; })();
        ctx.fillStyle = depth >= 2 ? pal.deep : pal.dirt[(hash(tx, ty) * 3) | 0];
        ctx.fillRect(x, y, TILE, TILE);
        // đá & đốm
        for (let i = 0; i < 6; i++) {
          const r = hash(tx * 7 + i, ty * 13 - i);
          const sx = (r * 14) | 0, sy = (hash(i, tx + ty) * 14) | 0;
          ctx.fillStyle = r < 0.3 ? pal.stone : r < 0.6 ? 'rgba(0,0,0,0.18)' : 'rgba(255,220,180,0.05)';
          ctx.fillRect(x + sx, y + sy, r < 0.2 ? 3 : 2, r < 0.2 ? 2 : 1);
        }
        // viền tối giữa các ô đá ngầm
        if (depth >= 2 && hash(tx, ty) < 0.4) { ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.fillRect(x, y + 7, TILE, 1); }
        if (exposed) {
          // mặt cỏ úa phủ tro
          ctx.fillStyle = pal.top[0]; ctx.fillRect(x, y, TILE, 4);
          ctx.fillStyle = pal.top[1]; ctx.fillRect(x, y, TILE, 1);
          for (let i = 0; i < TILE; i++) {
            const r = hash(tx * 16 + i, ty);
            if (r < 0.45) { ctx.fillStyle = pal.top[(r * 6) | 0 % 3] || pal.top[2]; ctx.fillRect(x + i, y + 4, 1, 1 + ((r * 4) | 0)); }
            if (r > 0.86) { ctx.fillStyle = pal.top[1]; ctx.fillRect(x + i, y - 1 - ((r * 3) | 0), 1, 1 + ((r * 3) | 0)); }
            if (r > 0.93) { ctx.fillStyle = pal.ash; ctx.fillRect(x + i, y, 1, 1); }
          }
        }
        // cạnh bên
        if (level.get(tx - 1, ty) === T.EMPTY || level.get(tx - 1, ty) === T.SPIKE) { ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.fillRect(x, y, 1, TILE); }
        if (level.get(tx + 1, ty) === T.EMPTY || level.get(tx + 1, ty) === T.SPIKE) { ctx.fillStyle = 'rgba(255,230,200,0.06)'; ctx.fillRect(x + TILE - 1, y, 1, TILE); }
      } else if (t === T.ONEWAY) {
        ctx.fillStyle = '#6a4a2e'; ctx.fillRect(x, y, TILE, 4);
        ctx.fillStyle = '#8a6440'; ctx.fillRect(x, y, TILE, 1);
        ctx.fillStyle = '#3a2618'; ctx.fillRect(x, y + 4, TILE, 1);
        ctx.fillStyle = '#4a3220'; if (tx % 2 === 0) ctx.fillRect(x + 2, y + 5, 2, 4);
        ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.fillRect(x + ((hash(tx, ty) * 12) | 0), y + 1, 1, 3);
        // dây thừng nối
        if (level.get(tx - 1, ty) !== T.ONEWAY) { ctx.fillStyle = '#5a3a24'; ctx.fillRect(x, y + 5, 2, 8); }
        if (level.get(tx + 1, ty) !== T.ONEWAY) { ctx.fillStyle = '#5a3a24'; ctx.fillRect(x + TILE - 2, y + 5, 2, 8); }
      } else if (t === T.SPIKE) {
        ctx.fillStyle = '#1a1216'; ctx.fillRect(x, y + 10, TILE, 6);
        for (let i = 0; i < 4; i++) {
          const sx = x + i * 4;
          ctx.fillStyle = '#8a9098'; ctx.fillRect(sx + 1, y + 6, 2, 5); ctx.fillRect(sx + 2, y + 3, 1, 3);
          ctx.fillStyle = '#c8d0d8'; ctx.fillRect(sx + 2, y + 3, 1, 1);
          ctx.fillStyle = '#6a1a1a'; if (hash(tx, i) < 0.4) ctx.fillRect(sx + 1, y + 8, 1, 1);
        }
      } else if (t === T.DOOR) {
        ctx.fillStyle = '#4a3020'; ctx.fillRect(x, y, TILE, TILE);
        ctx.fillStyle = '#6a4428'; ctx.fillRect(x + 2, y, 5, TILE); ctx.fillRect(x + 9, y, 5, TILE);
        ctx.fillStyle = '#8a8a92'; ctx.fillRect(x, y + 3, TILE, 2); ctx.fillRect(x, y + 11, TILE, 2);
        ctx.fillStyle = '#c8c8d0'; ctx.fillRect(x + 3, y + 3, 1, 1); ctx.fillRect(x + 12, y + 11, 1, 1);
      }
    }
  }
  // Trang trí trên mặt đất: hàng rào, bụi cỏ, đá, đống rơm, bí ngô
  for (let ty = 1; ty < level.h; ty++) for (let tx = 1; tx < level.w - 1; tx++) {
    if (level.get(tx, ty) !== T.SOLID || level.get(tx, ty - 1) !== T.EMPTY) continue;
    const r = hash(tx * 31, ty * 17), x = tx * TILE, y = ty * TILE;
    if (r < 0.1 && level.get(tx + 1, ty - 1) === T.EMPTY && level.get(tx + 1, ty) === T.SOLID) { // hàng rào
      ctx.fillStyle = '#4a3220'; ctx.fillRect(x + 2, y - 9, 2, 9); ctx.fillRect(x + 12, y - 9, 2, 9);
      ctx.fillStyle = '#5e4028'; ctx.fillRect(x, y - 7, 16, 2); ctx.fillRect(x, y - 3, 16, 1);
    } else if (r < 0.17) { // bụi khô
      ctx.fillStyle = pal.top[2]; for (let i = 0; i < 9; i++) ctx.fillRect(x + 3 + i, y - 2 - ((Math.sin(i * 1.7) + 1) * 2 | 0), 1, 3 + ((Math.sin(i * 1.7) + 1) * 2 | 0));
    } else if (r < 0.22) { // đá
      ctx.fillStyle = '#4e4650'; ctx.fillRect(x + 4, y - 3, 7, 3); ctx.fillStyle = '#6a6270'; ctx.fillRect(x + 5, y - 4, 4, 1);
    } else if (r < 0.255) { // đống rơm
      ctx.fillStyle = '#8a6a32'; ctx.fillRect(x + 1, y - 7, 14, 7); ctx.fillStyle = '#b8904a'; ctx.fillRect(x + 3, y - 9, 10, 3); ctx.fillStyle = '#d8b46a'; for (let i = 0; i < 5; i++) ctx.fillRect(x + 2 + i * 3, y - 6 + (i % 2), 1, 2);
    } else if (r < 0.28) { // bí ngô tro
      ctx.fillStyle = '#a8501e'; ctx.fillRect(x + 5, y - 5, 7, 5); ctx.fillStyle = '#c8682a'; ctx.fillRect(x + 6, y - 5, 2, 4); ctx.fillStyle = '#3a4a26'; ctx.fillRect(x + 8, y - 7, 1, 2);
    }
  }
  return c;
}

// Nền parallax nhiều lớp (vẽ một lần)
export function buildBackground(kind) {
  const layers = [];
  const W = VIEW_W * 2, H = VIEW_H;
  // bầu trời
  const sky = makeCanvas(VIEW_W, H); const s = sky.getContext('2d');
  const g = s.createLinearGradient(0, 0, 0, H);
  if (kind === 'boss') { g.addColorStop(0, '#120a14'); g.addColorStop(0.45, '#3a1420'); g.addColorStop(0.8, '#8a2a1e'); g.addColorStop(1, '#c8502a'); }
  else if (kind === 'rest') { g.addColorStop(0, '#141428'); g.addColorStop(0.5, '#2a2440'); g.addColorStop(0.85, '#5a3a4a'); g.addColorStop(1, '#8a5a4a'); }
  else { g.addColorStop(0, '#1a1a30'); g.addColorStop(0.45, '#3a2a40'); g.addColorStop(0.78, '#8a4a44'); g.addColorStop(1, '#d8804a'); }
  s.fillStyle = g; s.fillRect(0, 0, VIEW_W, H);
  // dải màu pixel (dither)
  for (let y = 0; y < H; y += 2) for (let x = (y / 2) % 2; x < VIEW_W; x += 4) { if (hash(x, y) < 0.08) { s.fillStyle = 'rgba(255,255,255,0.05)'; s.fillRect(x, y, 1, 1); } }
  // sao
  for (let i = 0; i < 70; i++) { const x = hash(i, 1) * VIEW_W, y = hash(i, 2) * H * 0.45; s.fillStyle = `rgba(255,240,220,${0.3 + hash(i, 3) * 0.6})`; s.fillRect(x | 0, y | 0, 1, 1); }
  // trăng / mặt trời đỏ
  const mx = VIEW_W * 0.72, my = kind === 'boss' ? 70 : 54;
  s.fillStyle = kind === 'boss' ? 'rgba(255,90,60,0.15)' : 'rgba(255,220,180,0.12)'; s.beginPath(); s.arc(mx, my, 34, 0, 7); s.fill();
  s.fillStyle = kind === 'boss' ? '#ff6a3c' : '#f2d8b8'; s.beginPath(); s.arc(mx, my, 18, 0, 7); s.fill();
  s.fillStyle = kind === 'boss' ? '#ff9a5a' : '#fff0dc'; s.beginPath(); s.arc(mx - 4, my - 4, 12, 0, 7); s.fill();
  layers.push({ c: sky, f: 0, fixed: true });

  // núi xa + tháp chuông
  const far = makeCanvas(W, H); const f = far.getContext('2d');
  f.fillStyle = kind === 'boss' ? '#2a1218' : '#2a2236';
  for (let x = 0; x < W; x++) { const h = 120 + Math.sin(x * 0.012) * 26 + Math.sin(x * 0.037 + 1) * 12 + hash(x, 9) * 2; f.fillRect(x, H - h, 1, h); }
  // tháp chuông
  const tx = (W * 0.62) | 0;
  f.fillStyle = kind === 'boss' ? '#1a0a10' : '#1e182a';
  f.fillRect(tx, H - 220, 22, 220); f.fillRect(tx - 4, H - 226, 30, 8); f.fillRect(tx + 4, H - 252, 14, 28);
  for (let i = 0; i < 14; i++) f.fillRect(tx + 11 - i / 2, H - 266 + i, i, 1);
  f.fillStyle = '#ffb36a'; f.fillRect(tx + 8, H - 244, 6, 8); f.fillStyle = '#fff0c0'; f.fillRect(tx + 10, H - 241, 2, 3);
  f.fillStyle = 'rgba(255,180,100,0.12)'; f.fillRect(tx + 2, H - 252, 18, 22);
  layers.push({ c: far, f: 0.12 });

  // đồi + cây chết
  const mid = makeCanvas(W, H); const m = mid.getContext('2d');
  m.fillStyle = kind === 'boss' ? '#1e0e14' : '#211a28';
  for (let x = 0; x < W; x++) { const h = 70 + Math.sin(x * 0.02 + 2) * 16 + Math.sin(x * 0.06) * 6; m.fillRect(x, H - h, 1, h); }
  for (let i = 0; i < 9; i++) {
    const x = (hash(i, 77) * W) | 0, base = H - 70 - Math.sin(x * 0.02 + 2) * 16;
    m.fillRect(x, base - 26, 2, 30);
    for (let b = 0; b < 5; b++) { const by = base - 10 - b * 4, len = 6 + (hash(i, b) * 6) | 0, dir = b % 2 ? 1 : -1; for (let k = 0; k < len; k++) m.fillRect(x + dir * k, by - (k / 2 | 0), 1, 1); }
  }
  // hàng rào + bù nhìn xa
  for (let x = 0; x < W; x += 9) { const y = H - 52 - Math.sin(x * 0.02 + 2) * 8; m.fillRect(x, y, 1, 7); if (x % 18 === 0) m.fillRect(x, y + 2, 9, 1); }
  for (let i = 0; i < 5; i++) { const x = (hash(i, 31) * W) | 0, y = H - 74 - Math.sin(x * 0.02 + 2) * 16; m.fillRect(x, y - 12, 1, 14); m.fillRect(x - 4, y - 9, 9, 1); m.fillRect(x - 2, y - 15, 5, 4); }
  layers.push({ c: mid, f: 0.3 });

  // cánh đồng gần (cỏ cao)
  const near = makeCanvas(W, H); const n = near.getContext('2d');
  n.fillStyle = kind === 'boss' ? '#160a0e' : '#18121c';
  for (let x = 0; x < W; x++) { const h = 30 + Math.sin(x * 0.03) * 8 + hash(x, 3) * 5; n.fillRect(x, H - h, 1, h); }
  layers.push({ c: near, f: 0.5 });
  return layers;
}

export function drawBackground(ctx, layers, camX, camY, levelH) {
  for (const L of layers) {
    if (L.fixed) { ctx.drawImage(L.c, 0, 0); continue; }
    const W = L.c.width;
    const ox = -((camX * L.f) % W);
    const oy = Math.round((levelH - VIEW_H - camY) * L.f * 0.6);
    ctx.drawImage(L.c, Math.round(ox), oy);
    ctx.drawImage(L.c, Math.round(ox) + W, oy);
  }
}

// Tro bay (không gian màn hình)
export class AshFall {
  constructor(n = 70) { this.p = []; for (let i = 0; i < n; i++) this.p.push({ x: Math.random() * VIEW_W, y: Math.random() * VIEW_H, s: Math.random(), ph: Math.random() * 6 }); }
  draw(ctx, dt, camX, ember) {
    for (const a of this.p) {
      a.y += (8 + a.s * 16) * dt; a.x += (Math.sin(a.ph += dt * 1.3) * 6 - 4 - a.s * 4) * dt;
      if (a.y > VIEW_H) { a.y = -2; a.x = Math.random() * VIEW_W; }
      if (a.x < -2) a.x = VIEW_W + 2;
      const px = ((a.x - camX * (0.2 + a.s * 0.5)) % VIEW_W + VIEW_W) % VIEW_W;
      ctx.fillStyle = ember && a.s > 0.85 ? '#ff8a3d' : a.s > 0.6 ? 'rgba(220,210,200,0.7)' : 'rgba(180,170,165,0.45)';
      ctx.fillRect(px | 0, a.y | 0, a.s > 0.7 ? 2 : 1, 1);
    }
  }
}
