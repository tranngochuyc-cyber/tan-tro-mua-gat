// ============================================================
// ShopScene — between-chapter shop with tactile pixel buttons
// Strict mouse bounding box checking, pixel art currency icons,
// and zero OS emojis.
// ============================================================
import * as C from '../engine/Constants.js';
import { PixelIcons } from '../engine/PixelIcons.js';
import { UIHelper, UI_FONT, UI_HEADING_FONT } from '../engine/UIHelper.js';

export class ShopScene {
  constructor(game) {
    this.game = game;
    this.selected = 0;
    this.items = [];
    this.hoverIndex = -1;
  }

  show(player) {
    this.selected = 0;
    this.hoverIndex = -1;
    this.items = [
      {
        id: 'heal',
        name: 'Hồi 30 Điểm HP',
        cost: 40,
        icon: 'heart',
        desc: 'Hồi phục sinh lực lập tức',
        action: () => { player.heal(30); },
      },
      {
        id: 'upgrade_random',
        name: 'Nâng Cấp Di Vật Ngẫu Nhiên',
        cost: 70,
        icon: 'star',
        desc: 'Tăng 1 cấp cho di vật hiện có',
        action: () => {
          if (player.artifacts.length > 0) {
            const art = player.artifacts[Math.floor(Math.random() * player.artifacts.length)];
            art.level = Math.min(art.level + 1, 5);
            player.recalcStats();
          }
        },
      },
      {
        id: 'reroll',
        name: 'Thêm 1 Lượt Đổi Thẻ',
        cost: 20,
        icon: 'lightning',
        desc: '+1 lần đổi khi lên cấp',
        action: () => { player.rerolls++; },
      },
      {
        id: 'leave',
        name: 'Tiếp Tục Cuộc Hành Trình →',
        cost: 0,
        icon: 'sword',
        desc: 'Rời cửa hàng và sang màn tiếp',
        action: null,
      },
    ];
  }

  _getItemRects() {
    const W = C.INTERNAL_W;
    const itemW = 250, itemH = 34, gap = 8;
    const startY = 100;
    return this.items.map((_, i) => ({
      x: (W - itemW) / 2,
      y: startY + i * (itemH + gap),
      w: itemW,
      h: itemH,
    }));
  }

  update(dt, input) {
    const mx = input.getMousePos().x;
    const my = input.getMousePos().y;
    const rects = this._getItemRects();

    // Check hover
    this.hoverIndex = -1;
    for (let i = 0; i < this.items.length; i++) {
      if (UIHelper.isInside(rects[i], mx, my)) {
        this.hoverIndex = i;
        this.selected = i;
      }
    }

    if (input.justPressed('ArrowDown') || input.justPressed('KeyS')) {
      this.selected = (this.selected + 1) % this.items.length;
    }
    if (input.justPressed('ArrowUp') || input.justPressed('KeyW')) {
      this.selected = (this.selected + this.items.length - 1) % this.items.length;
    }

    if (input.justPressed('Enter') || input.justPressed('Space')) {
      this._buyItem(this.selected);
      return;
    }

    // Mouse click — ONLY if mouse is hovering over that specific item row!
    if (input.mouseClicked()) {
      if (this.hoverIndex >= 0) {
        this._buyItem(this.hoverIndex);
      }
      // Clicking empty background does NOTHING!
    }
  }

  _buyItem(idx) {
    if (idx < 0 || idx >= this.items.length) return;
    const item = this.items[idx];
    if (!item) return;

    if (item.id === 'leave') {
      this.game.audio.playSfx('gate');
      this.game.resumeFromShop();
      return;
    }

    const player = this.game.runState?.player;
    if (!player) return;

    if (player.gold >= item.cost) {
      player.gold -= item.cost;
      if (item.action) item.action();
      this.game.audio.playSfx('chest');
    }
  }

  draw(ctx) {
    const W = C.INTERNAL_W, H = C.INTERNAL_H;
    const player = this.game.runState?.player;
    if (!player) return;

    // Dark backdrop
    ctx.fillStyle = '#0a0a14';
    ctx.fillRect(0, 0, W, H);

    // Shop frame
    const frameW = 290, frameH = 265;
    const frameX = (W - frameW) / 2, frameY = 24;
    ctx.fillStyle = 'rgba(22, 18, 28, 0.96)';
    ctx.fillRect(frameX, frameY, frameW, frameH);
    ctx.strokeStyle = '#c2a649';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(frameX, frameY, frameW, frameH);

    // Title
    ctx.fillStyle = '#f59e0b';
    ctx.font = `bold 15px ${UI_HEADING_FONT}`;
    ctx.textAlign = 'center';
    ctx.fillText('CỬA HÀNG VEN ĐƯỜNG', W / 2, frameY + 24);

    // Player Status Pill
    const pillY = frameY + 42;
    PixelIcons.coin(ctx, W / 2 - 80, pillY - 4, 12);
    ctx.fillStyle = '#fde047';
    ctx.font = `bold 10px ${UI_FONT}`;
    ctx.textAlign = 'left';
    ctx.fillText(`Vàng: ${player.gold}`, W / 2 - 64, pillY + 5);

    PixelIcons.heart(ctx, W / 2 + 10, pillY - 3, 11);
    ctx.fillStyle = '#f87171';
    ctx.font = `bold 10px ${UI_FONT}`;
    ctx.fillText(`HP: ${player.hp}/${player.maxHp}`, W / 2 + 25, pillY + 5);

    // Items
    const rects = this._getItemRects();
    for (let i = 0; i < this.items.length; i++) {
      const item = this.items[i];
      const r = rects[i];
      const isSel = i === this.selected;
      const isHov = i === this.hoverIndex;
      const canAfford = player.gold >= item.cost || item.cost === 0;

      UIHelper.drawButton(ctx, {
        x: r.x,
        y: r.y,
        w: r.w,
        h: r.h,
        label: item.cost > 0 ? `${item.name} (${item.cost} Vàng)` : item.name,
        sublabel: item.desc,
        icon: item.icon,
        selected: isSel,
        hovered: isHov,
        disabled: !canAfford,
        reason: !canAfford ? `Thiếu ${item.cost - player.gold} Vàng` : '',
        variant: item.id === 'leave' ? 'primary' : (canAfford ? 'default' : 'subtle'),
        align: 'left',
      });
    }

    // Help Footer
    ctx.textAlign = 'center';
    ctx.fillStyle = '#64748b';
    ctx.font = `9px ${UI_FONT}`;
    ctx.fillText('↑↓ / Chuột: Chọn · Enter / Click để mua đồ', W / 2, frameY + frameH - 12);
    ctx.textAlign = 'left';
  }
}
