import { clamp, lerp } from './util.js';

export const VIEW_W = 384;
export const VIEW_H = 216;

// Camera bám mục tiêu có nhìn trước theo hướng mặt, vùng chết dọc, và rung (trauma)
export class Camera {
  constructor() {
    this.x = 0; this.y = 0;
    this.trauma = 0;
    this.ox = 0; this.oy = 0;
    this.look = 0;
    this.bounds = { w: VIEW_W, h: VIEW_H };
    this.zoomPunch = 0;
  }
  setBounds(w, h) { this.bounds = { w, h }; }

  snapTo(t) {
    this.x = clamp(t.x + t.w / 2 - VIEW_W / 2, 0, Math.max(0, this.bounds.w - VIEW_W));
    this.y = clamp(t.y + t.h / 2 - VIEW_H / 2 - 20, 0, Math.max(0, this.bounds.h - VIEW_H));
  }

  update(dt, t) {
    const targetLook = t.facing * 36 + t.vx * 0.12;
    this.look = lerp(this.look, targetLook, 1 - Math.exp(-dt * 2.2));
    const tx = t.x + t.w / 2 - VIEW_W / 2 + this.look;
    const ty = t.y + t.h / 2 - VIEW_H / 2 - 18 + (t.vy > 200 ? 30 : 0);
    this.x = lerp(this.x, tx, 1 - Math.exp(-dt * 7));
    this.y = lerp(this.y, ty, 1 - Math.exp(-dt * (t.onGround ? 5 : 3)));
    this.x = clamp(this.x, 0, Math.max(0, this.bounds.w - VIEW_W));
    this.y = clamp(this.y, 0, Math.max(0, this.bounds.h - VIEW_H));
    this.trauma = Math.max(0, this.trauma - dt * 1.8);
    const s = this.trauma * this.trauma;
    this.ox = (Math.random() * 2 - 1) * 7 * s;
    this.oy = (Math.random() * 2 - 1) * 5 * s;
  }

  shake(amount) { this.trauma = Math.min(1, this.trauma + amount); }
  get rx() { return Math.round(this.x + this.ox); }
  get ry() { return Math.round(this.y + this.oy); }
}
