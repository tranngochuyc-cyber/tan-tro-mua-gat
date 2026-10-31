// Phòng chơi: lưới ô, va chạm, đối tượng đặt sẵn từ mẫu ASCII
import { TEMPLATES, ROOM_H } from '../data/rooms.js';

export const TILE = 16;
export const T = { EMPTY: 0, SOLID: 1, ONEWAY: 2, SPIKE: 3, DOOR: 4 };

export function parseTemplate(name) {
  const raw = TEMPLATES[name];
  if (!raw) throw new Error('Không có mẫu phòng ' + name);
  const innerW = Math.max(...raw.map((r) => r.length));
  const rows = raw.map((r) => r.padEnd(innerW, '.'));
  const innerH = ROOM_H - 1;
  while (rows.length < innerH) rows.unshift('.'.repeat(innerW));
  const full = ['#'.repeat(innerW + 2), ...rows.map((r) => '#' + r + '#')];
  return full;
}

export class Level {
  constructor(name) {
    this.name = name;
    const rows = parseTemplate(name);
    this.h = rows.length;
    this.w = rows[0].length;
    this.pw = this.w * TILE;
    this.ph = this.h * TILE;
    this.tiles = new Uint8Array(this.w * this.h);
    this.markers = [];
    this.doorTiles = [];
    for (let y = 0; y < this.h; y++) {
      for (let x = 0; x < this.w; x++) {
        const ch = rows[y][x];
        let t = T.EMPTY;
        if (ch === '#') t = T.SOLID;
        else if (ch === '=') t = T.ONEWAY;
        else if (ch === '^') t = T.SPIKE;
        else if (ch === 'D') { t = T.DOOR; this.doorTiles.push([x, y]); }
        else if (ch !== '.') this.markers.push({ ch, x, y, px: x * TILE, py: y * TILE });
        this.tiles[y * this.w + x] = t;
      }
    }
    // Cửa vận mệnh kéo dài lên tới trần để không nhảy qua được
    if (this.doorTiles.length) {
      const col = this.doorTiles[0][0];
      const top = Math.min(...this.doorTiles.map((d) => d[1]));
      for (let y = 1; y < top; y++) { if (this.get(col, y) === T.EMPTY) { this.set(col, y, T.DOOR); this.doorTiles.push([col, y]); } }
    }
    this.cache = null; // canvas vẽ sẵn ô
  }

  get(tx, ty) {
    if (tx < 0 || tx >= this.w || ty < 0) return T.SOLID;
    if (ty >= this.h) return T.EMPTY;
    return this.tiles[ty * this.w + tx];
  }
  set(tx, ty, v) { if (tx >= 0 && tx < this.w && ty >= 0 && ty < this.h) { this.tiles[ty * this.w + tx] = v; this.cache = null; } }
  isSolid(tx, ty) { const t = this.get(tx, ty); return t === T.SOLID || t === T.DOOR; }

  openDoor() {
    for (const [x, y] of this.doorTiles) this.set(x, y, T.EMPTY);
    const d = this.doorTiles; this.doorTiles = [];
    return d;
  }

  // Có mặt đất bên dưới điểm (px,py)?
  groundAt(px, py) {
    const tx = Math.floor(px / TILE), ty = Math.floor(py / TILE);
    const t = this.get(tx, ty);
    return t === T.SOLID || t === T.ONEWAY || t === T.DOOR;
  }

  // Di chuyển thực thể theo trục X, chặn bởi ô đặc
  moveX(e, dx) {
    if (dx === 0) return false;
    e.x += dx;
    const top = Math.floor(e.y / TILE), bot = Math.floor((e.y + e.h - 0.01) / TILE);
    if (dx > 0) {
      const tx = Math.floor((e.x + e.w) / TILE);
      for (let ty = top; ty <= bot; ty++) if (this.isSolid(tx, ty)) { e.x = tx * TILE - e.w - 0.001; return true; }
    } else {
      const tx = Math.floor(e.x / TILE);
      for (let ty = top; ty <= bot; ty++) if (this.isSolid(tx, ty)) { e.x = (tx + 1) * TILE + 0.001; return true; }
    }
    return false;
  }

  // Di chuyển theo trục Y; bục một chiều chỉ chặn khi rơi xuống từ phía trên
  moveY(e, dy, dropThrough = false) {
    if (dy === 0) return false;
    const prevBottom = e.y + e.h;
    e.y += dy;
    const left = Math.floor(e.x / TILE), right = Math.floor((e.x + e.w - 0.01) / TILE);
    if (dy > 0) {
      const ty = Math.floor((e.y + e.h) / TILE);
      for (let tx = left; tx <= right; tx++) {
        const t = this.get(tx, ty);
        if (t === T.SOLID || t === T.DOOR || (t === T.ONEWAY && !dropThrough && prevBottom <= ty * TILE + 0.5)) {
          e.y = ty * TILE - e.h; return true;
        }
      }
    } else {
      const ty = Math.floor(e.y / TILE);
      for (let tx = left; tx <= right; tx++) if (this.isSolid(tx, ty)) { e.y = (ty + 1) * TILE + 0.001; return true; }
    }
    return false;
  }

  touchesSpike(e) {
    const left = Math.floor((e.x + 2) / TILE), right = Math.floor((e.x + e.w - 2) / TILE);
    const ty = Math.floor((e.y + e.h - 3) / TILE);
    for (let tx = left; tx <= right; tx++) if (this.get(tx, ty) === T.SPIKE) return true;
    return false;
  }

  // Tia nhìn giữa 2 điểm có bị ô đặc chặn không
  lineOfSight(x0, y0, x1, y1) {
    const steps = Math.ceil(Math.hypot(x1 - x0, y1 - y0) / 8);
    for (let i = 1; i < steps; i++) {
      const x = x0 + (x1 - x0) * (i / steps), y = y0 + (y1 - y0) * (i / steps);
      if (this.isSolid(Math.floor(x / TILE), Math.floor(y / TILE))) return false;
    }
    return true;
  }

  pointSolid(px, py) { return this.isSolid(Math.floor(px / TILE), Math.floor(py / TILE)); }
}
