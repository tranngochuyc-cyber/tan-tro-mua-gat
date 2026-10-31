// Hạt, số sát thương, vệt chém, chữ nổi — vẽ theo pixel
import { rand } from '../core/util.js';

// Font số 3x5 cho số sát thương
const DIGITS = {
  '0': ['111', '101', '101', '101', '111'], '1': ['010', '110', '010', '010', '111'],
  '2': ['111', '001', '111', '100', '111'], '3': ['111', '001', '111', '001', '111'],
  '4': ['101', '101', '111', '001', '001'], '5': ['111', '100', '111', '001', '111'],
  '6': ['111', '100', '111', '101', '111'], '7': ['111', '001', '010', '010', '010'],
  '8': ['111', '101', '111', '101', '111'], '9': ['111', '101', '111', '001', '111'],
  '!': ['1', '1', '1', '0', '1'], '+': ['000', '010', '111', '010', '000'], '-': ['000', '000', '111', '000', '000'],
  'x': ['000', '101', '010', '101', '000'],
};

export function drawDigits(ctx, str, x, y, color, scale = 1, outline = '#120a0a') {
  if (!outline) outline = null;
  let cx = x;
  const glyphs = String(str).split('').map((ch) => DIGITS[ch] || DIGITS['0']);
  const total = glyphs.reduce((s, g) => s + (g[0].length + 1) * scale, -scale);
  cx = Math.round(x - total / 2);
  for (const pass of [0, 1]) {
    let px = cx;
    for (const g of glyphs) {
      for (let r = 0; r < 5; r++) for (let c = 0; c < g[r].length; c++) {
        if (g[r][c] !== '1') continue;
        if (pass === 0) { if (!outline) continue; ctx.fillStyle = outline; ctx.fillRect(px + c * scale - 1, y + r * scale - 1, scale + 2, scale + 2); }
        else { ctx.fillStyle = color; ctx.fillRect(px + c * scale, y + r * scale, scale, scale); }
      }
      px += (g[0].length + 1) * scale;
    }
  }
}

export class FX {
  constructor() {
    this.parts = [];
    this.numbers = [];
    this.slashes = [];
    this.rings = [];
    this.texts = [];
    this.flashes = [];
  }
  clear() { this.parts.length = 0; this.numbers.length = 0; this.slashes.length = 0; this.rings.length = 0; this.texts.length = 0; this.flashes.length = 0; }

  burst(x, y, n, opt = {}) {
    const { colors = ['#fff'], speed = 120, life = 0.4, grav = 400, size = 1, spread = Math.PI * 2, dir = 0, drag = 0.9, glow = false } = opt;
    for (let i = 0; i < n; i++) {
      const a = dir + (Math.random() - 0.5) * spread;
      const s = speed * (0.35 + Math.random() * 0.65);
      this.parts.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, life: life * (0.6 + Math.random() * 0.6), max: life, color: colors[(Math.random() * colors.length) | 0], size: size + (Math.random() < 0.3 ? 1 : 0), grav, drag, glow });
    }
  }
  dust(x, y, n = 6, dir = 0) {
    this.burst(x, y, n, { colors: ['#9b8a7a', '#6e6058', '#c2b2a0'], speed: 50, life: 0.35, grav: -20, spread: dir ? 1.2 : Math.PI, dir: dir ? (dir > 0 ? 0 : Math.PI) : -Math.PI / 2, drag: 0.85 });
  }
  number(x, y, val, kind = 'normal') {
    const col = { normal: '#fff4e0', crit: '#ffd23f', fate: '#ff5ad1', heavy: '#ffa24a', player: '#ff4d4d', heal: '#7dff8a', block: '#9fb4c8', weak: '#9aa' }[kind] || '#fff';
    this.numbers.push({ weak: kind === 'weak', x: x + rand(-4, 4), y, vy: -70, life: kind === 'crit' || kind === 'fate' ? 1.0 : 0.7, val, col, scale: kind === 'crit' || kind === 'fate' ? 2 : 1 });
  }
  text(x, y, str, color = '#fff', life = 1.1) { this.texts.push({ x, y, str, color, life, max: life }); }
  slash(s) { this.slashes.push({ ...s, life: s.life || 0.12, max: s.life || 0.12 }); }
  ring(x, y, r0, r1, color, life = 0.3) { this.rings.push({ x, y, r0, r1, color, life, max: life }); }
  flash(color, life = 0.12) { this.flashes.push({ color, life, max: life }); }

  update(dt) {
    for (const p of this.parts) {
      p.life -= dt; p.vy += p.grav * dt; p.vx *= Math.pow(p.drag, dt * 60); p.vy *= Math.pow(0.99, dt * 60);
      p.x += p.vx * dt; p.y += p.vy * dt;
    }
    this.parts = this.parts.filter((p) => p.life > 0);
    for (const n of this.numbers) { n.life -= dt; n.y += n.vy * dt; n.vy *= Math.pow(0.9, dt * 60); }
    this.numbers = this.numbers.filter((n) => n.life > 0);
    for (const s of this.slashes) s.life -= dt;
    this.slashes = this.slashes.filter((s) => s.life > 0);
    for (const r of this.rings) r.life -= dt;
    this.rings = this.rings.filter((r) => r.life > 0);
    for (const t of this.texts) { t.life -= dt; t.y -= 14 * dt; }
    this.texts = this.texts.filter((t) => t.life > 0);
    for (const f of this.flashes) f.life -= dt;
    this.flashes = this.flashes.filter((f) => f.life > 0);
  }

  // Vệt chém hình lưỡi liềm — vẽ từng pixel để giữ nét pixel, đầu vệt dày, đuôi mảnh
  drawSlash(ctx, s, cx, cy) {
    const life = s.life / s.max, t = 1 - life;
    ctx.globalAlpha = Math.min(1, life * 2.2);
    if (s.thrust) {
      const len = s.r1 - s.r0, head = s.r0 + len * Math.min(1, 0.3 + t * 2);
      const y0 = Math.round(s.y - cy);
      for (let r = s.r0; r < head; r++) {
        const k = (r - s.r0) / len, th = Math.max(1, Math.round(3 * Math.sin(Math.PI * Math.min(1, k * 1.1))));
        const x = Math.round(s.x - cx + r * s.dir);
        ctx.fillStyle = k > 0.85 ? (s.edge || '#fff') : s.color;
        ctx.fillRect(x, y0 - (th >> 1), 1, th);
      }
      ctx.globalAlpha = 1; return;
    }
    const span = s.a1 - s.a0, dirA = Math.sign(span) || 1;
    const headK = Math.min(1, 0.25 + t * 1.6), tailK = Math.max(0, t * 1.5 - 0.35);
    const maxTh = Math.max(3, Math.min(7, (s.r1 - s.r0) * 0.32));
    const steps = Math.ceil(Math.abs(span) * s.r1 * 1.2);
    for (let i = 0; i <= steps; i++) {
      const k = i / steps;
      if (k < tailK || k > headK) continue;
      const rel = (k - tailK) / Math.max(0.001, headK - tailK); // 0 đuôi → 1 đầu
      const a = s.a0 + span * k;
      const th = Math.max(1, Math.round(maxTh * Math.pow(rel, 0.8)));
      const ca = Math.cos(a) * s.dir, sa = Math.sin(a);
      for (let d = 0; d < th; d++) {
        const r = s.r1 - d;
        ctx.fillStyle = d === 0 ? (s.edge || '#fff') : d < 2 ? s.color : 'rgba(255,240,220,0.35)';
        ctx.fillRect(Math.round(s.x - cx + ca * r), Math.round(s.y - cy + sa * r), 1, 1);
      }
    }
    ctx.globalAlpha = 1;
    void dirA;
  }

  draw(ctx, cx, cy) {
    for (const s of this.slashes) this.drawSlash(ctx, s, cx, cy);
    for (const r of this.rings) {
      const t = 1 - r.life / r.max, rad = r.r0 + (r.r1 - r.r0) * t;
      ctx.globalAlpha = 1 - t; ctx.strokeStyle = r.color; ctx.lineWidth = Math.max(1, 3 * (1 - t));
      ctx.beginPath(); ctx.arc(Math.round(r.x - cx), Math.round(r.y - cy), rad, 0, Math.PI * 2); ctx.stroke(); ctx.globalAlpha = 1;
    }
    for (const p of this.parts) {
      ctx.globalAlpha = Math.min(1, p.life / p.max * 1.5);
      ctx.fillStyle = p.color;
      ctx.fillRect(Math.round(p.x - cx), Math.round(p.y - cy), p.size, p.size);
      if (p.glow) { ctx.globalAlpha *= 0.25; ctx.fillRect(Math.round(p.x - cx) - 1, Math.round(p.y - cy) - 1, p.size + 2, p.size + 2); }
    }
    ctx.globalAlpha = 1;
    for (const n of this.numbers) {
      ctx.globalAlpha = Math.min(1, n.life * 3);
      drawDigits(ctx, n.val, Math.round(n.x - cx), Math.round(n.y - cy), n.col, n.scale, n.weak ? null : '#120a0a');
    }
    ctx.globalAlpha = 1;
  }
}
