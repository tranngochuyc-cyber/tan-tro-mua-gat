// ============================================================
// ClassSelectScene — Full class selection UI
// Shows all 10 classes in a grid with detailed info panel
// ============================================================
import * as C from '../engine/Constants.js';
import { CLASSES, getClassList } from '../data/ClassData.js';
import { PixelIcons } from '../engine/PixelIcons.js';
import { UIHelper, UI_FONT, UI_HEADING_FONT } from '../engine/UIHelper.js';

export class ClassSelectScene {
  constructor(game) {
    this.game = game;
    this.active = false;
    this.selected = 0;
    this.hovered = -1;
    this.pressed = -1;
    this.confirmHovered = false;
    this.confirmPressed = false;
    this.scrollOffset = 0;
    this.classList = getClassList();
    this.onSelect = null; // callback(classId)
  }

  show(onSelect) {
    this.active = true;
    this.selected = 0;
    this.hovered = -1;
    this.onSelect = onSelect;
  }

  hide() {
    this.active = false;
  }

  _getGridLayout() {
    const W = C.INTERNAL_W;
    const H = C.INTERNAL_H;
    // 2 rows x 5 columns grid
    const cols = 5;
    const rows = 2;
    const cellW = 90;
    const cellH = 52;
    const gapX = 8;
    const gapY = 8;
    const totalW = cols * cellW + (cols - 1) * gapX;
    const startX = (W - totalW) / 2;
    const startY = 52;
    const rects = [];
    for (let i = 0; i < this.classList.length; i++) {
      const col = i % cols;
      const row = Math.floor(i / cols);
      rects.push({
        x: startX + col * (cellW + gapX),
        y: startY + row * (cellH + gapY),
        w: cellW,
        h: cellH,
      });
    }
    return { rects, cols, rows };
  }

  _getConfirmRect() {
    return {
      x: C.INTERNAL_W / 2 - 90,
      y: 305,
      w: 180,
      h: 30,
    };
  }

  update(dt, input) {
    if (!this.active) return;
    const { rects } = this._getGridLayout();
    const confirmRect = this._getConfirmRect();

    // Check class card hover/click
    this.hovered = -1;
    this.pressed = -1;
    for (let i = 0; i < this.classList.length; i++) {
      const check = UIHelper.checkButton(rects[i], input);
      if (check.hovered) {
        this.hovered = i;
      }
      if (check.pressed) {
        this.pressed = i;
      }
      if (check.clicked) {
        this.selected = i;
        this.game.audio.playSfx('xp');
      }
    }

    // Check confirm button
    const confirmCheck = UIHelper.checkButton(confirmRect, input);
    this.confirmHovered = confirmCheck.hovered;
    this.confirmPressed = confirmCheck.pressed;
    if (confirmCheck.clicked) {
      this._confirm();
      return;
    }

    // Keyboard nav
    if (input.justPressed('ArrowRight') || input.justPressed('KeyD')) {
      this.selected = (this.selected + 1) % this.classList.length;
      this.game.audio.playSfx('xp');
    }
    if (input.justPressed('ArrowLeft') || input.justPressed('KeyA')) {
      this.selected = (this.selected + this.classList.length - 1) % this.classList.length;
      this.game.audio.playSfx('xp');
    }
    if (input.justPressed('ArrowDown') || input.justPressed('KeyS')) {
      this.selected = Math.min(this.classList.length - 1, this.selected + 5);
      this.game.audio.playSfx('xp');
    }
    if (input.justPressed('ArrowUp') || input.justPressed('KeyW')) {
      this.selected = Math.max(0, this.selected - 5);
      this.game.audio.playSfx('xp');
    }
    if (input.justPressed('Enter') || input.justPressed('Space')) {
      this._confirm();
    }
  }

  _confirm() {
    const cls = this.classList[this.selected];
    if (!cls) return;
    this.game.audio.playSfx('gate');
    this.active = false;
    if (this.onSelect) {
      this.onSelect(cls.id);
    }
  }

  draw(ctx) {
    if (!this.active) return;
    const W = C.INTERNAL_W;
    const H = C.INTERNAL_H;

    // Full dark background
    ctx.fillStyle = '#080810';
    ctx.fillRect(0, 0, W, H);

    // Atmospheric gradient overlay
    const grad = ctx.createLinearGradient(0, 0, 0, H);
    grad.addColorStop(0, 'rgba(15, 10, 25, 0.9)');
    grad.addColorStop(0.5, 'rgba(20, 12, 30, 0.8)');
    grad.addColorStop(1, 'rgba(10, 8, 18, 0.95)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);

    // Title
    ctx.textAlign = 'center';
    ctx.fillStyle = '#f59e0b';
    ctx.font = `bold 16px ${UI_HEADING_FONT}`;
    ctx.fillText('CHỌN HỆ PHÁI', W / 2, 22);
    ctx.fillStyle = '#94a3b8';
    ctx.font = `9px ${UI_FONT}`;
    ctx.fillText('6 Class Kinh Điển  ·  4 Class Danh Tác Thế Giới', W / 2, 36);

    // Category labels
    const { rects } = this._getGridLayout();

    // Draw class cards
    for (let i = 0; i < this.classList.length; i++) {
      const cls = this.classList[i];
      const r = rects[i];
      const isSel = i === this.selected;
      const isHov = i === this.hovered;
      const isPress = i === this.pressed;

      const ox = isPress ? 1 : 0;
      const oy = isPress ? 1 : 0;
      const rx = r.x + ox;
      const ry = r.y + oy;

      // Card bg
      let bg = isSel ? 'rgba(30, 25, 45, 0.98)' : 'rgba(18, 16, 28, 0.9)';
      if (isHov) bg = 'rgba(28, 22, 42, 0.98)';
      ctx.fillStyle = bg;
      ctx.fillRect(rx, ry, r.w, r.h);

      // Border
      ctx.strokeStyle = isSel ? (cls.color || '#f59e0b') : 'rgba(80, 80, 100, 0.4)';
      ctx.lineWidth = isSel ? 2 : 1;
      ctx.strokeRect(rx + 0.5, ry + 0.5, r.w - 1, r.h - 1);

      // Selection corners
      if (isSel) {
        ctx.fillStyle = cls.color || '#f59e0b';
        ctx.fillRect(rx - 2, ry - 2, 4, 4);
        ctx.fillRect(rx + r.w - 2, ry - 2, 4, 4);
        ctx.fillRect(rx - 2, ry + r.h - 2, 4, 4);
        ctx.fillRect(rx + r.w - 2, ry + r.h - 2, 4, 4);
      }

      // Category tag
      const isWorldClassic = cls.category === 'world_classic';
      if (isWorldClassic) {
        ctx.fillStyle = 'rgba(236, 72, 153, 0.25)';
        ctx.fillRect(rx + 1, ry + 1, r.w - 2, 10);
        ctx.fillStyle = '#f472b6';
        ctx.font = `bold 6.5px ${UI_FONT}`;
        ctx.textAlign = 'center';
        ctx.fillText('DANH TÁC', rx + r.w / 2, ry + 8);
      }

      // Icon
      const iconY = isWorldClassic ? ry + 16 : ry + 10;
      const assetImg = this.game.assets.getImage(cls.icon);
      if (assetImg && assetImg.width > 0) {
        ctx.drawImage(assetImg, rx + r.w / 2 - 10, iconY, 20, 20);
      } else {
        PixelIcons.draw(ctx, cls.icon, rx + r.w / 2 - 8, iconY + 2, 16);
      }

      // Class name
      ctx.fillStyle = isSel ? '#ffffff' : '#cbd5e1';
      ctx.font = `bold 9px ${UI_HEADING_FONT}`;
      ctx.textAlign = 'center';
      ctx.fillText(cls.name, rx + r.w / 2, ry + r.h - 6);
    }

    // ---- DETAIL PANEL for selected class ----
    const selCls = this.classList[this.selected];
    if (selCls) {
      const panelX = 24;
      const panelY = 168;
      const panelW = W - 48;
      const panelH = 132;

      // Panel bg
      ctx.fillStyle = 'rgba(12, 14, 24, 0.96)';
      ctx.fillRect(panelX, panelY, panelW, panelH);
      ctx.strokeStyle = selCls.color || '#f59e0b';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(panelX + 0.5, panelY + 0.5, panelW - 1, panelH - 1);

      // Class name + title
      ctx.fillStyle = selCls.color || '#f59e0b';
      ctx.font = `bold 12px ${UI_HEADING_FONT}`;
      ctx.textAlign = 'left';
      ctx.fillText(`${selCls.name}  —  ${selCls.title}`, panelX + 10, panelY + 16);

      // Lore
      if (selCls.lore) {
        ctx.fillStyle = '#c084fc';
        ctx.font = `italic 7.5px ${UI_FONT}`;
        ctx.fillText(`"${selCls.lore}"`, panelX + 10, panelY + 28);
      }

      // 3 Essential evaluation lines: Mạnh ở, Yếu khi, Phù hợp
      const evalY = panelY + (selCls.lore ? 41 : 32);
      ctx.font = `8px ${UI_FONT}`;
      ctx.fillStyle = '#4ade80';
      ctx.fillText(`✔ Mạnh ở: `, panelX + 10, evalY);
      ctx.fillStyle = '#f1f5f9';
      ctx.fillText(selCls.strength || 'Sát thương ổn định', panelX + 54, evalY);

      ctx.fillStyle = '#f87171';
      ctx.fillText(`✖ Yếu khi: `, panelX + 10, evalY + 13);
      ctx.fillStyle = '#f1f5f9';
      ctx.fillText(selCls.weakness || 'Cần căn vị trí cẩn thận', panelX + 54, evalY + 13);

      ctx.fillStyle = '#38bdf8';
      ctx.fillText(`★ Phù hợp: `, panelX + 10, evalY + 26);
      ctx.fillStyle = '#f1f5f9';
      ctx.fillText(selCls.playstyle || 'Mọi người chơi', panelX + 54, evalY + 26);

      // Skills: [Q] Active & [Passive]
      const skillBoxY = evalY + 39;
      ctx.fillStyle = 'rgba(25, 28, 45, 0.75)';
      ctx.fillRect(panelX + 10, skillBoxY, panelW - 20, 32);
      ctx.strokeStyle = 'rgba(100, 116, 139, 0.3)';
      ctx.strokeRect(panelX + 10.5, skillBoxY + 0.5, panelW - 21, 31);

      // [Q] Skill
      ctx.fillStyle = '#fde047';
      ctx.font = `bold 7.5px ${UI_FONT}`;
      ctx.fillText(`[Phím Q] ${selCls.activeSkill?.name || 'Kỹ Năng'}: `, panelX + 14, skillBoxY + 11);
      const qPrefixW = ctx.measureText(`[Phím Q] ${selCls.activeSkill?.name || 'Kỹ Năng'}: `).width;
      ctx.fillStyle = '#e2e8f0';
      ctx.font = `7px ${UI_FONT}`;
      ctx.fillText(selCls.activeSkill?.desc || '', panelX + 14 + qPrefixW, skillBoxY + 11);

      // Passive
      ctx.fillStyle = '#fbbf24';
      ctx.font = `bold 7.5px ${UI_FONT}`;
      ctx.fillText(`[Nội tại] ${selCls.passive?.name || 'Nội Tại'}: `, panelX + 14, skillBoxY + 24);
      const pPrefixW = ctx.measureText(`[Nội tại] ${selCls.passive?.name || 'Nội Tại'}: `).width;
      ctx.fillStyle = '#cbd5e1';
      ctx.font = `7px ${UI_FONT}`;
      ctx.fillText(selCls.passive?.desc || '', panelX + 14 + pPrefixW, skillBoxY + 24);
    }

    // Confirm button
    const confirmRect = this._getConfirmRect();
    UIHelper.drawButton(ctx, {
      x: confirmRect.x,
      y: confirmRect.y,
      w: confirmRect.w,
      h: confirmRect.h,
      label: `▶ XÁC NHẬN: ${selCls?.name || ''} ◀`,
      hovered: this.confirmHovered,
      pressed: this.confirmPressed,
      variant: 'primary',
    });

    // Footer hint
    ctx.fillStyle = '#64748b';
    ctx.font = `8px ${UI_FONT}`;
    ctx.textAlign = 'center';
    ctx.fillText('[←/→/↑/↓] Chọn  ·  [Enter] Xác nhận', W / 2, H - 10);
  }
}
