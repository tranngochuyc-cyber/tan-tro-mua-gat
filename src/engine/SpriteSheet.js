// ============================================================
// SpriteSheet — handles sprite sheet slicing and animation
// ============================================================
export class SpriteSheet {
  /**
   * @param {HTMLImageElement|HTMLCanvasElement} image
   * @param {number} frameW - width of each frame
   * @param {number} frameH - height of each frame
   * @param {number} frameCount - number of frames in the sheet
   * @param {number} fps - animation speed
   */
  constructor(image, frameW, frameH, frameCount, fps = 10, crop = null) {
    this.image = image;
    this.frameW = frameW;
    this.frameH = frameH;
    this.frameCount = frameCount;
    this.fps = fps;
    this.cols = Math.floor(image.width / frameW);
    this.crop = crop;
  }

  /** Get frame rect {sx, sy, sw, sh} for a given frame index */
  getFrame(index) {
    const col = index % this.cols;
    const row = Math.floor(index / this.cols);
    return {
      sx: col * this.frameW + (this.crop?.x ?? 0),
      sy: row * this.frameH + (this.crop?.y ?? 0),
      sw: this.crop?.w ?? this.frameW,
      sh: this.crop?.h ?? this.frameH
    };
  }

  /** Draw a specific frame, optionally flipped */
  draw(ctx, frameIndex, x, y, w, h, flip = false) {
    const f = this.getFrame(frameIndex % this.frameCount);
    ctx.save();
    if (flip) {
      ctx.translate(x + w, y);
      ctx.scale(-1, 1);
      ctx.drawImage(this.image, f.sx, f.sy, f.sw, f.sh, 0, 0, w, h);
    } else {
      ctx.drawImage(this.image, f.sx, f.sy, f.sw, f.sh, x, y, w, h);
    }
    ctx.restore();
  }
}

// ============================================================
// Animator — manages animation playback for an entity
// ============================================================
export class Animator {
  constructor() {
    /** @type {Object.<string, SpriteSheet>} */
    this.animations = {};
    this.currentAnim = '';
    this.frame = 0;
    this.timer = 0;
    this.loop = true;
    this.finished = false;
    this.flip = false;
  }

  addAnimation(name, sheet) {
    this.animations[name] = sheet;
    if (!this.currentAnim) this.currentAnim = name;
  }

  play(name, loop = true) {
    if (this.currentAnim === name && !this.finished) return;
    if (!this.animations[name]) return;
    this.currentAnim = name;
    this.frame = 0;
    this.timer = 0;
    this.loop = loop;
    this.finished = false;
  }

  update(dt) {
    const sheet = this.animations[this.currentAnim];
    if (!sheet || this.finished) return;
    this.timer += dt;
    const frameDur = 1 / sheet.fps;
    if (this.timer >= frameDur) {
      this.timer -= frameDur;
      this.frame++;
      if (this.frame >= sheet.frameCount) {
        if (this.loop) {
          this.frame = 0;
        } else {
          this.frame = sheet.frameCount - 1;
          this.finished = true;
        }
      }
    }
  }

  draw(ctx, x, y, w, h) {
    const sheet = this.animations[this.currentAnim];
    if (!sheet) return;
    sheet.draw(ctx, this.frame, x, y, w, h, this.flip);
  }

  getCurrentSheet() {
    return this.animations[this.currentAnim];
  }

  isFinished() { return this.finished; }

  getFrame() { return this.frame; }
}
