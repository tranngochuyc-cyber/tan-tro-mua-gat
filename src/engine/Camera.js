// ============================================================
// Camera — follows player with smooth interpolation
// ============================================================
import { INTERNAL_W, INTERNAL_H } from './Constants.js';

export class Camera {
  constructor() {
    this.x = 0;
    this.y = 0;
    this.targetX = 0;
    this.targetY = 0;
    this.shakeX = 0;
    this.shakeY = 0;
    this.shakeDuration = 0;
    this.shakeIntensity = 0;
    this.enabled = true;
    this.zoom = 1.0; // 1:1 pixel-perfect rendering for crisp, sharp pixel art
  }

  follow(targetX, targetY, arenaW, arenaH) {
    const z = this.zoom || 1;
    const viewW = INTERNAL_W / z;
    const viewH = INTERNAL_H / z;
    this.targetX = targetX - viewW / 2;
    this.targetY = targetY - viewH / 2;
    // Clamp to arena bounds
    const maxClampX = Math.max(0, arenaW - viewW);
    const maxClampY = Math.max(0, arenaH - viewH);
    this.targetX = Math.max(0, Math.min(maxClampX, this.targetX));
    this.targetY = Math.max(0, Math.min(maxClampY, this.targetY));
  }

  shake(intensity = 3, duration = 0.15) {
    if (!this.enabled) return;
    this.shakeIntensity = intensity;
    this.shakeDuration = duration;
  }

  update(dt) {
    // Smooth follow
    const lerp = 1 - Math.pow(0.001, dt);
    this.x += (this.targetX - this.x) * lerp;
    this.y += (this.targetY - this.y) * lerp;

    // Screen shake
    if (this.shakeDuration > 0) {
      this.shakeDuration -= dt;
      this.shakeX = (Math.random() - 0.5) * 2 * this.shakeIntensity;
      this.shakeY = (Math.random() - 0.5) * 2 * this.shakeIntensity;
    } else {
      this.shakeX = 0;
      this.shakeY = 0;
    }
  }

  applyTransform(ctx) {
    if (this.zoom && this.zoom !== 1) {
      ctx.scale(this.zoom, this.zoom);
    }
    ctx.translate(
      -Math.round(this.x) + Math.round(this.shakeX),
      -Math.round(this.y) + Math.round(this.shakeY)
    );
  }

  screenToWorld(sx, sy) {
    const z = this.zoom || 1;
    return {
      x: sx / z + this.x - this.shakeX,
      y: sy / z + this.y - this.shakeY
    };
  }
}
