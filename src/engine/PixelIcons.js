// ============================================================
// PixelIcons — Custom pixel art icons drawn on canvas
// Unified 8x8, 12x12, and 16x16 pixel icons with consistent palette.
// Guarantees 100% identical cross-platform rendering (no OS emojis).
// ============================================================

export const PixelIcons = {
  /** Draw a pixel heart */
  heart(ctx, x, y, size = 10, color = '#e03030') {
    ctx.save();
    ctx.fillStyle = color;
    // 8x7 pixel heart
    const s = size / 8;
    ctx.fillRect(x + 1 * s, y, 2 * s, 1 * s);
    ctx.fillRect(x + 5 * s, y, 2 * s, 1 * s);
    ctx.fillRect(x, y + 1 * s, 8 * s, 2 * s);
    ctx.fillRect(x + 1 * s, y + 3 * s, 6 * s, 1 * s);
    ctx.fillRect(x + 2 * s, y + 4 * s, 4 * s, 1 * s);
    ctx.fillRect(x + 3 * s, y + 5 * s, 2 * s, 1 * s);
    // Specular shine
    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.fillRect(x + 1 * s, y + 1 * s, 1 * s, 1 * s);
    ctx.restore();
  },

  /** Draw a pixel gold coin */
  coin(ctx, x, y, size = 10) {
    ctx.save();
    const s = size / 8;
    // Rim
    ctx.fillStyle = '#b3820a';
    ctx.fillRect(x + 2 * s, y, 4 * s, 1 * s);
    ctx.fillRect(x + 1 * s, y + 1 * s, 6 * s, 1 * s);
    ctx.fillRect(x, y + 2 * s, 8 * s, 4 * s);
    ctx.fillRect(x + 1 * s, y + 6 * s, 6 * s, 1 * s);
    ctx.fillRect(x + 2 * s, y + 7 * s, 4 * s, 1 * s);
    // Body
    ctx.fillStyle = '#ffd700';
    ctx.fillRect(x + 2 * s, y + 1 * s, 4 * s, 1 * s);
    ctx.fillRect(x + 1 * s, y + 2 * s, 6 * s, 4 * s);
    ctx.fillRect(x + 2 * s, y + 6 * s, 4 * s, 1 * s);
    // Inner G / emblem
    ctx.fillStyle = '#cc9900';
    ctx.fillRect(x + 3 * s, y + 3 * s, 2 * s, 2 * s);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.fillRect(x + 2 * s, y + 2 * s, 1 * s, 1 * s);
    ctx.restore();
  },

  /** Draw a pixel ash seed */
  ashSeed(ctx, x, y, size = 10) {
    ctx.save();
    const s = size / 8;
    ctx.fillStyle = '#6e5a70';
    ctx.fillRect(x + 3 * s, y, 2 * s, 1 * s);
    ctx.fillRect(x + 2 * s, y + 1 * s, 4 * s, 2 * s);
    ctx.fillRect(x + 1 * s, y + 3 * s, 6 * s, 3 * s);
    ctx.fillRect(x + 2 * s, y + 6 * s, 4 * s, 1 * s);
    ctx.fillRect(x + 3 * s, y + 7 * s, 2 * s, 1 * s);
    // Glowing ember core
    ctx.fillStyle = '#ff8844';
    ctx.fillRect(x + 3 * s, y + 3 * s, 2 * s, 2 * s);
    ctx.fillStyle = '#ffcc66';
    ctx.fillRect(x + 3 * s, y + 2 * s, 1 * s, 1 * s);
    ctx.restore();
  },

  /** Draw a pixel sword */
  sword(ctx, x, y, size = 12, color = '#e2e8f0') {
    ctx.save();
    const s = size / 10;
    // Blade
    ctx.fillStyle = color;
    ctx.fillRect(x + 6 * s, y, 2 * s, 5 * s);
    ctx.fillRect(x + 7 * s, y - 1 * s, 1 * s, 1 * s); // tip
    // Blade highlight
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(x + 6 * s, y, 1 * s, 5 * s);
    // Crossguard
    ctx.fillStyle = '#c89230';
    ctx.fillRect(x + 3 * s, y + 5 * s, 8 * s, 1.5 * s);
    // Hilt
    ctx.fillStyle = '#78350f';
    ctx.fillRect(x + 6.5 * s, y + 6.5 * s, 1.5 * s, 3 * s);
    // Pommel
    ctx.fillStyle = '#c89230';
    ctx.fillRect(x + 6 * s, y + 9.5 * s, 2.5 * s, 1.5 * s);
    ctx.restore();
  },

  /** Draw a pixel shield */
  shield(ctx, x, y, size = 10, color = '#38bdf8') {
    ctx.save();
    const s = size / 8;
    // Rim
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(x + 1 * s, y, 6 * s, 2 * s);
    ctx.fillRect(x, y + 2 * s, 8 * s, 3 * s);
    ctx.fillRect(x + 1 * s, y + 5 * s, 6 * s, 2 * s);
    ctx.fillRect(x + 2 * s, y + 7 * s, 4 * s, 1 * s);
    ctx.fillRect(x + 3 * s, y + 8 * s, 2 * s, 1 * s);
    // Fill
    ctx.fillStyle = color;
    ctx.fillRect(x + 2 * s, y + 1 * s, 4 * s, 1 * s);
    ctx.fillRect(x + 1 * s, y + 2 * s, 6 * s, 3 * s);
    ctx.fillRect(x + 2 * s, y + 5 * s, 4 * s, 1 * s);
    ctx.fillRect(x + 3 * s, y + 6 * s, 2 * s, 1 * s);
    // Center emblem
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(x + 3.5 * s, y + 2.5 * s, 1 * s, 2 * s);
    ctx.restore();
  },

  /** Draw a pixel boots / move speed */
  boots(ctx, x, y, size = 10, color = '#4ade80') {
    ctx.save();
    const s = size / 8;
    ctx.fillStyle = color;
    ctx.fillRect(x + 2 * s, y, 3 * s, 4 * s);
    ctx.fillRect(x + 2 * s, y + 4 * s, 6 * s, 3 * s);
    ctx.fillStyle = '#1e3a1e';
    ctx.fillRect(x + 2 * s, y + 7 * s, 6 * s, 1 * s);
    // Wing streak
    ctx.fillStyle = '#bbf7d0';
    ctx.fillRect(x + 1 * s, y + 2 * s, 1 * s, 1 * s);
    ctx.fillRect(x, y + 1 * s, 1 * s, 1 * s);
    ctx.restore();
  },

  /** Draw a pixel lightning bolt */
  lightning(ctx, x, y, size = 10, color = '#facc15') {
    ctx.save();
    const s = size / 8;
    ctx.fillStyle = color;
    ctx.fillRect(x + 4 * s, y, 3 * s, 2 * s);
    ctx.fillRect(x + 3 * s, y + 2 * s, 3 * s, 2 * s);
    ctx.fillRect(x + 1 * s, y + 4 * s, 6 * s, 1 * s);
    ctx.fillRect(x + 2 * s, y + 5 * s, 3 * s, 2 * s);
    ctx.fillRect(x + 3 * s, y + 7 * s, 1 * s, 2 * s);
    ctx.restore();
  },

  /** Draw a pixel flame / crit */
  flame(ctx, x, y, size = 10, color = '#f97316') {
    ctx.save();
    const s = size / 8;
    ctx.fillStyle = color;
    ctx.fillRect(x + 3 * s, y, 2 * s, 2 * s);
    ctx.fillRect(x + 2 * s, y + 2 * s, 4 * s, 3 * s);
    ctx.fillRect(x + 1 * s, y + 4 * s, 6 * s, 3 * s);
    ctx.fillRect(x + 2 * s, y + 7 * s, 4 * s, 1 * s);
    // Inner hot yellow
    ctx.fillStyle = '#fef08a';
    ctx.fillRect(x + 3 * s, y + 4 * s, 2 * s, 3 * s);
    ctx.restore();
  },

  /** Draw a pixel dash / wind */
  dash(ctx, x, y, size = 10, color = '#38bdf8') {
    ctx.save();
    const s = size / 8;
    ctx.fillStyle = color;
    ctx.fillRect(x, y + 2 * s, 3 * s, 1 * s);
    ctx.fillRect(x + 2 * s, y + 3 * s, 4 * s, 1 * s);
    ctx.fillRect(x + 4 * s, y + 4 * s, 4 * s, 1 * s);
    ctx.fillRect(x + 1 * s, y + 5 * s, 4 * s, 1 * s);
    ctx.restore();
  },

  /** Draw a pixel skull */
  skull(ctx, x, y, size = 10, color = '#ef4444') {
    ctx.save();
    const s = size / 8;
    ctx.fillStyle = color;
    ctx.fillRect(x + 2 * s, y, 4 * s, 1 * s);
    ctx.fillRect(x + 1 * s, y + 1 * s, 6 * s, 4 * s);
    ctx.fillRect(x + 2 * s, y + 5 * s, 4 * s, 2 * s);
    // Eyes & teeth
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(x + 2 * s, y + 2 * s, 1 * s, 2 * s);
    ctx.fillRect(x + 5 * s, y + 2 * s, 1 * s, 2 * s);
    ctx.fillRect(x + 3 * s, y + 6 * s, 1 * s, 1 * s);
    ctx.restore();
  },

  /** Draw a pixel checkmark */
  check(ctx, x, y, size = 10, color = '#4ade80') {
    ctx.save();
    const s = size / 8;
    ctx.fillStyle = color;
    ctx.fillRect(x + 1 * s, y + 4 * s, 2 * s, 2 * s);
    ctx.fillRect(x + 3 * s, y + 6 * s, 2 * s, 2 * s);
    ctx.fillRect(x + 5 * s, y + 4 * s, 2 * s, 2 * s);
    ctx.fillRect(x + 7 * s, y + 2 * s, 2 * s, 2 * s);
    ctx.restore();
  },

  /** Draw a pixel lock */
  lock(ctx, x, y, size = 10, color = '#94a3b8') {
    ctx.save();
    const s = size / 8;
    // Shackle
    ctx.fillStyle = color;
    ctx.fillRect(x + 2 * s, y, 4 * s, 1 * s);
    ctx.fillRect(x + 1 * s, y + 1 * s, 2 * s, 3 * s);
    ctx.fillRect(x + 5 * s, y + 1 * s, 2 * s, 3 * s);
    // Body
    ctx.fillStyle = '#475569';
    ctx.fillRect(x, y + 3 * s, 8 * s, 5 * s);
    // Keyhole
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(x + 3.5 * s, y + 4.5 * s, 1 * s, 2 * s);
    ctx.restore();
  },

  /** Draw a pixel star */
  star(ctx, x, y, size = 10, color = '#facc15') {
    ctx.save();
    const s = size / 8;
    ctx.fillStyle = color;
    ctx.fillRect(x + 3 * s, y, 2 * s, 1 * s);
    ctx.fillRect(x + 2 * s, y + 1 * s, 4 * s, 1 * s);
    ctx.fillRect(x, y + 2 * s, 8 * s, 2 * s);
    ctx.fillRect(x + 1 * s, y + 4 * s, 6 * s, 2 * s);
    ctx.fillRect(x + 2 * s, y + 6 * s, 4 * s, 1 * s);
    ctx.fillRect(x + 1 * s, y + 7 * s, 2 * s, 1 * s);
    ctx.fillRect(x + 5 * s, y + 7 * s, 2 * s, 1 * s);
    ctx.restore();
  },

  /** Draw a pixel gear / settings */
  gear(ctx, x, y, size = 10, color = '#94a3b8') {
    ctx.save();
    const s = size / 8;
    ctx.fillStyle = color;
    // Teeth
    ctx.fillRect(x + 3 * s, y, 2 * s, 8 * s);
    ctx.fillRect(x, y + 3 * s, 8 * s, 2 * s);
    ctx.fillRect(x + 1 * s, y + 1 * s, 6 * s, 6 * s);
    // Hole
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(x + 3 * s, y + 3 * s, 2 * s, 2 * s);
    ctx.restore();
  },

  /** Draw a pixel village / cottage */
  village(ctx, x, y, size = 12, color = '#fb923c') {
    ctx.save();
    const s = size / 10;
    // Roof triangle
    ctx.fillStyle = '#b45309';
    ctx.fillRect(x + 4 * s, y, 2 * s, 1 * s);
    ctx.fillRect(x + 3 * s, y + 1 * s, 4 * s, 1 * s);
    ctx.fillRect(x + 2 * s, y + 2 * s, 6 * s, 1 * s);
    ctx.fillRect(x + 1 * s, y + 3 * s, 8 * s, 1 * s);
    ctx.fillRect(x, y + 4 * s, 10 * s, 1 * s);
    // Walls
    ctx.fillStyle = color;
    ctx.fillRect(x + 1 * s, y + 5 * s, 8 * s, 4 * s);
    // Door
    ctx.fillStyle = '#451a03';
    ctx.fillRect(x + 4 * s, y + 6 * s, 2 * s, 3 * s);
    ctx.restore();
  },

  /** Draw a pixel Alice ribbon / bow */
  aliceRibbon(ctx, x, y, size = 12, color = '#38bdf8') {
    ctx.save();
    const s = size / 10;
    ctx.fillStyle = color;
    ctx.fillRect(x + 1 * s, y + 2 * s, 3 * s, 3 * s);
    ctx.fillRect(x + 6 * s, y + 2 * s, 3 * s, 3 * s);
    ctx.fillRect(x + 2 * s, y + 1 * s, 2 * s, 1 * s);
    ctx.fillRect(x + 6 * s, y + 1 * s, 2 * s, 1 * s);
    ctx.fillStyle = '#f472b6';
    ctx.fillRect(x + 4 * s, y + 2.5 * s, 2 * s, 2 * s);
    ctx.fillStyle = '#7dd3fc';
    ctx.fillRect(x + 2 * s, y + 5 * s, 2 * s, 3 * s);
    ctx.fillRect(x + 6 * s, y + 5 * s, 2 * s, 3 * s);
    ctx.restore();
  },

  /** Draw a pixel Wukong golden staff */
  wukongStaff(ctx, x, y, size = 12, color = '#eab308') {
    ctx.save();
    const s = size / 10;
    ctx.fillStyle = color;
    for (let i = 1; i <= 8; i++) {
      ctx.fillRect(x + (9 - i) * s, y + i * s, 1.8 * s, 1.8 * s);
    }
    ctx.fillStyle = '#ef4444';
    ctx.fillRect(x + 7.5 * s, y + 1.5 * s, 1.8 * s, 1.8 * s);
    ctx.fillRect(x + 1.5 * s, y + 7.5 * s, 1.8 * s, 1.8 * s);
    ctx.fillStyle = '#fef08a';
    ctx.fillRect(x + 8.5 * s, y + 0.5 * s, 1.5 * s, 1.5 * s);
    ctx.fillRect(x + 0.5 * s, y + 8.5 * s, 1.5 * s, 1.5 * s);
    ctx.restore();
  },

  /** Draw a pixel Dracula vampire bat */
  draculaBat(ctx, x, y, size = 12, color = '#dc2626') {
    ctx.save();
    const s = size / 10;
    ctx.fillStyle = '#1e1b4b';
    ctx.fillRect(x, y + 2 * s, 2 * s, 2 * s);
    ctx.fillRect(x + 8 * s, y + 2 * s, 2 * s, 2 * s);
    ctx.fillRect(x + 1 * s, y + 4 * s, 3 * s, 2 * s);
    ctx.fillRect(x + 6 * s, y + 4 * s, 3 * s, 2 * s);
    ctx.fillStyle = color;
    ctx.fillRect(x + 3.5 * s, y + 1 * s, 1 * s, 2 * s);
    ctx.fillRect(x + 5.5 * s, y + 1 * s, 1 * s, 2 * s);
    ctx.fillRect(x + 3.5 * s, y + 3 * s, 3 * s, 4 * s);
    ctx.fillStyle = '#f87171';
    ctx.fillRect(x + 4 * s, y + 4 * s, 1 * s, 1 * s);
    ctx.fillRect(x + 5 * s, y + 4 * s, 1 * s, 1 * s);
    ctx.restore();
  },

  /** Draw a pixel Pied Piper flute with notes */
  piperFlute(ctx, x, y, size = 12, color = '#10b981') {
    ctx.save();
    const s = size / 10;
    ctx.fillStyle = '#f59e0b';
    ctx.fillRect(x + 1 * s, y + 5 * s, 8 * s, 2 * s);
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(x + 3 * s, y + 5.5 * s, 1 * s, 1 * s);
    ctx.fillRect(x + 5 * s, y + 5.5 * s, 1 * s, 1 * s);
    ctx.fillRect(x + 7 * s, y + 5.5 * s, 1 * s, 1 * s);
    ctx.fillStyle = color;
    ctx.fillRect(x + 6 * s, y + 1 * s, 1.5 * s, 3 * s);
    ctx.fillRect(x + 7.5 * s, y + 1 * s, 1.5 * s, 1 * s);
    ctx.fillRect(x + 5 * s, y + 3 * s, 2.5 * s, 1.5 * s);
    ctx.restore();
  },

  /** General icon dispatcher */
  draw(ctx, iconName, x, y, size = 10, color) {
    switch (iconName) {
      case 'heart':
      case 'max_hp':
      case 'heal_now':
      case 'regen':
        this.heart(ctx, x, y, size, color || '#e03030');
        break;
      case 'coin':
      case 'gold':
        this.coin(ctx, x, y, size);
        break;
      case 'ashSeed':
      case 'ash':
        this.ashSeed(ctx, x, y, size);
        break;
      case 'sword':
      case 'damage':
      case 'attack':
        this.sword(ctx, x, y, size, color || '#e2e8f0');
        break;
      case 'shield':
      case 'armor':
        this.shield(ctx, x, y, size, color || '#38bdf8');
        break;
      case 'boots':
      case 'move_speed':
        this.boots(ctx, x, y, size, color || '#4ade80');
        break;
      case 'lightning':
      case 'dash_cd':
      case 'skill':
        this.lightning(ctx, x, y, size, color || '#facc15');
        break;
      case 'flame':
      case 'crit_mult':
      case 'crit_chance':
        this.flame(ctx, x, y, size, color || '#f97316');
        break;
      case 'dash':
      case 'attack_speed':
        this.dash(ctx, x, y, size, color || '#38bdf8');
        break;
      case 'skull':
      case 'boss':
        this.skull(ctx, x, y, size, color || '#ef4444');
        break;
      case 'check':
      case 'owned':
        this.check(ctx, x, y, size, color || '#4ade80');
        break;
      case 'lock':
        this.lock(ctx, x, y, size, color || '#94a3b8');
        break;
      case 'star':
      case 'evolution':
        this.star(ctx, x, y, size, color || '#facc15');
        break;
      case 'gear':
      case 'settings':
        this.gear(ctx, x, y, size, color || '#94a3b8');
        break;
      case 'village':
      case 'hub':
        this.village(ctx, x, y, size, color || '#fb923c');
        break;
      case 'alice_ribbon':
      case 'ribbon':
        this.aliceRibbon(ctx, x, y, size, color || '#38bdf8');
        break;
      case 'wukong_staff':
      case 'staff':
        this.wukongStaff(ctx, x, y, size, color || '#eab308');
        break;
      case 'dracula_bat':
      case 'bat':
        this.draculaBat(ctx, x, y, size, color || '#dc2626');
        break;
      case 'piper_flute':
      case 'flute':
        this.piperFlute(ctx, x, y, size, color || '#10b981');
        break;
      case 'bow':
        this.sword(ctx, x, y, size, color || '#4ade80');
        break;
      default:
        // Default diamond badge
        ctx.save();
        ctx.fillStyle = color || '#a855f7';
        ctx.fillRect(x + size / 4, y, size / 2, size);
        ctx.fillRect(x, y + size / 4, size, size / 2);
        ctx.restore();
        break;
    }
  }
};
