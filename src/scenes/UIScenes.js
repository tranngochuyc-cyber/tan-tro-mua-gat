// ============================================================
// UIScenes — GameOver, Victory, Hub (Làng), Settings, Pause,
// StageComplete, and ArtifactSelect.
// Tactile button states, strict bounding box checks, pixel icons,
// and full Vietnamese legibility without OS emojis.
// ============================================================
import * as C from '../engine/Constants.js';
import { META_UNLOCKS, ARTIFACTS } from '../data/GameData.js';
import { Player } from '../entities/Player.js';
import { PixelIcons } from '../engine/PixelIcons.js';
import { UIHelper, UI_FONT, UI_HEADING_FONT } from '../engine/UIHelper.js';

// ============================================================
// GameOverScene
// ============================================================
export class GameOverScene {
  constructor(game) {
    this.game = game;
    this.timer = 0;
    this.hoverBtn = false;
    this.pressedBtn = false;
  }

  show(reason, stage, build) {
    this.reason = reason || 'Bạn đã ngã xuống...';
    this.stage = stage;
    this.build = build;
    this.timer = 0;
    this.hoverBtn = false;
    this.pressedBtn = false;
  }

  update(dt, input) {
    this.timer += dt;
    const W = C.INTERNAL_W;
    const btnRect = { x: W / 2 - 90, y: 258, w: 180, h: 30 };
    const check = UIHelper.checkButton(btnRect, input);
    this.hoverBtn = check.hovered;
    this.pressedBtn = check.pressed;

    if (this.timer > 1.2) {
      if (input.justPressed('Enter') || input.justPressed('Space') || check.clicked) {
        this.game.audio.playSfx('gate');
        this.game.switchScene('menu');
        return;
      }
    }
  }

  draw(ctx) {
    const W = C.INTERNAL_W, H = C.INTERNAL_H;
    ctx.fillStyle = '#0e0b12';
    ctx.fillRect(0, 0, W, H);

    const x = W / 2 - 150, y = 40, w = 300, h = 270;
    ctx.fillStyle = 'rgba(24, 20, 32, 0.96)';
    ctx.fillRect(x, y, w, h);
    ctx.strokeStyle = '#dc2626';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(x, y, w, h);

    // Skull icon
    PixelIcons.skull(ctx, W / 2 - 12, y + 16, 24, '#ef4444');

    ctx.textAlign = 'center';
    ctx.fillStyle = '#f87171';
    ctx.font = `bold 18px ${UI_HEADING_FONT}`;
    ctx.fillText('BẠN ĐÃ NGÃ XUỐNG', W / 2, y + 62);

    ctx.fillStyle = '#cbd5e1';
    ctx.font = `10px ${UI_FONT}`;
    ctx.fillText(this.reason, W / 2, y + 82);

    // Stage achieved card
    const cardY = y + 100;
    ctx.fillStyle = 'rgba(15, 23, 42, 0.7)';
    ctx.fillRect(x + 24, cardY, w - 48, 64);
    ctx.strokeStyle = 'rgba(239, 68, 68, 0.3)';
    ctx.strokeRect(x + 24, cardY, w - 48, 64);

    ctx.fillStyle = '#94a3b8';
    ctx.font = `9px ${UI_FONT}`;
    ctx.fillText('TIẾN TRÌNH CAO NHẤT', W / 2, cardY + 20);

    ctx.fillStyle = '#fef08a';
    ctx.font = `bold 16px ${UI_FONT}`;
    ctx.fillText(`Màn ${this.stage || 1} / ${C.TOTAL_STAGES}`, W / 2, cardY + 44);

    // Ash seeds preserved
    const ashSeeds = this.game.meta?.ashSeeds || 0;
    PixelIcons.ashSeed(ctx, W / 2 - 40, y + 182, 14);
    ctx.fillStyle = '#fbbf24';
    ctx.font = `bold 10px ${UI_FONT}`;
    ctx.textAlign = 'left';
    ctx.fillText(`Hạt Tro giữ lại: ${ashSeeds}`, W / 2 - 20, y + 192);

    // Continue button
    if (this.timer > 1.2) {
      UIHelper.drawButton(ctx, {
        x: W / 2 - 90,
        y: 258,
        w: 180,
        h: 30,
        label: 'TRỞ VỀ MENU CHÍNH',
        hovered: this.hoverBtn,
        pressed: this.pressedBtn,
        variant: 'danger',
      });
    }
    ctx.textAlign = 'left';
  }
}

// ============================================================
// VictoryScene
// ============================================================
export class VictoryScene {
  constructor(game) {
    this.game = game;
    this.timer = 0;
    this.hoverBtn = false;
    this.pressedBtn = false;
  }

  show(ashEarned) {
    this.ashEarned = ashEarned || 0;
    this.timer = 0;
    this.hoverBtn = false;
    this.pressedBtn = false;
  }

  update(dt, input) {
    this.timer += dt;
    const W = C.INTERNAL_W;
    const btnRect = { x: W / 2 - 90, y: 240, w: 180, h: 30 };
    const check = UIHelper.checkButton(btnRect, input);
    this.hoverBtn = check.hovered;
    this.pressedBtn = check.pressed;

    if (this.timer > 1.5) {
      if (input.justPressed('Enter') || input.justPressed('Space') || check.clicked) {
        this.game.switchScene('menu');
        return;
      }
    }
  }

  draw(ctx) {
    const W = C.INTERNAL_W, H = C.INTERNAL_H;
    ctx.fillStyle = 'rgba(6, 12, 8, 0.95)';
    ctx.fillRect(0, 0, W, H);

    const x = W / 2 - 160, y = 35, w = 320, h = 260;
    ctx.fillStyle = 'rgba(16, 28, 20, 0.96)';
    ctx.fillRect(x, y, w, h);
    ctx.strokeStyle = '#22c55e';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(x, y, w, h);

    // Star / Trophy icon
    PixelIcons.star(ctx, W / 2 - 12, y + 16, 24, '#facc15');

    ctx.textAlign = 'center';
    ctx.fillStyle = '#4ade80';
    ctx.font = `bold 18px ${UI_HEADING_FONT}`;
    ctx.fillText('CHIẾN THẮNG QUANG VINH!', W / 2, y + 62);

    ctx.fillStyle = '#cbd5e1';
    ctx.font = `10px ${UI_FONT}`;
    ctx.fillText('Lời nguyền đã bị thanh tẩy hoàn toàn.', W / 2, y + 84);
    ctx.fillText('Ngôi làng được giải thoát khỏi bóng tối!', W / 2, y + 99);

    // Reward Card
    const cardY = y + 116;
    ctx.fillStyle = 'rgba(15, 23, 42, 0.6)';
    ctx.fillRect(x + 24, cardY, w - 48, 54);
    ctx.strokeStyle = 'rgba(34, 197, 94, 0.3)';
    ctx.strokeRect(x + 24, cardY, w - 48, 54);

    PixelIcons.ashSeed(ctx, W / 2 - 50, cardY + 12, 14);
    ctx.fillStyle = '#fde047';
    ctx.font = `bold 11px ${UI_FONT}`;
    ctx.textAlign = 'left';
    ctx.fillText(`Hạt Tro nhận: +${this.ashEarned}`, W / 2 - 28, cardY + 23);

    const totalAsh = this.game.meta?.ashSeeds || 0;
    ctx.fillStyle = '#94a3b8';
    ctx.font = `9px ${UI_FONT}`;
    ctx.fillText(`Tổng Hạt Tro hiện có: ${totalAsh}`, W / 2 - 28, cardY + 39);

    if (this.timer > 1.5) {
      UIHelper.drawButton(ctx, {
        x: W / 2 - 90,
        y: 240,
        w: 180,
        h: 30,
        label: 'TRỞ VỀ MENU CHÍNH',
        hovered: this.hoverBtn,
        pressed: this.pressedBtn,
        variant: 'success',
      });
    }
    ctx.textAlign = 'left';
  }
}

// ============================================================
// HubScene — Làng Chiến Binh (Meta-progression)
// Grouped into 3 tabs: Di vật, Chỉ số, Tiện ích
// Each item clearly shows name, tactical role, cost, and lock status.
// Dedicated lock condition area outside the 90px button.
// Clean vertical centering for few-item groups.
// ============================================================
export class HubScene {
  constructor(game) {
    this.game = game;
    this.currentTab = 0; // 0: Di vật, 1: Chỉ số, 2: Tiện ích
    this.selectedItemIndex = 0;
    this.items = [];
    this.hoverBack = false;
    this.pressedBack = false;
    this.hoverTab = -1;
    this.pressedTab = -1;
    this.hoverBuyItem = -1;
    this.pressedBuyItem = -1;
  }

  /** Expose tab definitions for external inspection */
  get tabs() {
    return [
      { id: 'artifact', label: 'DI VẬT KHỞI ĐẦU' },
      { id: 'stat', label: 'CHỈ SỐ VĨNH VIỄN' },
      { id: 'utility', label: 'TIỆN ÍCH' },
    ];
  }

  show() {
    this.currentTab = 0;
    this.selectedItemIndex = 0;
    this._refreshItems();
  }

  _refreshItems() {
    const meta = this.game.meta;
    this.items = [];

    const tabTypes = ['artifact', 'stat', 'utility'];
    const activeType = tabTypes[this.currentTab];

    for (const [id, unlock] of Object.entries(META_UNLOCKS)) {
      if (unlock.type !== activeType) continue;

      const owned = (unlock.type === 'artifact' && meta.unlocks.artifacts.includes(id)) ||
                    (id === 'bagSlot' && meta.unlocks.bagSlot) ||
                    (id === 'vigor1' && meta.unlocks.vigor1) || (id === 'vigor2' && meta.unlocks.vigor2) ||
                    (id === 'magnet1' && meta.unlocks.magnet1) || (id === 'magnet2' && meta.unlocks.magnet2);

      const reqMet = !unlock.requires || meta.unlocks[unlock.requires];
      const canBuy = !owned && reqMet && meta.ashSeeds >= unlock.cost;

      let lockReason = '';
      if (!reqMet && unlock.requires) {
        const reqDef = META_UNLOCKS[unlock.requires];
        lockReason = `Cần mở: ${reqDef?.name || unlock.requires}`;
      } else if (!owned && meta.ashSeeds < unlock.cost) {
        lockReason = `Thiếu ${unlock.cost - meta.ashSeeds} Tro`;
      }

      this.items.push({
        id,
        ...unlock,
        owned,
        reqMet,
        canBuy,
        lockReason,
      });
    }
  }

  /** Dynamic responsive layout: centers items vertically if fewer items exist */
  _getItemLayout(index, totalCount, W, H) {
    const startYArea = 92;
    const endYArea = H - 32;
    const availableH = endYArea - startYArea;
    let itemH = 34;
    let gap = 5;

    if (totalCount <= 1) {
      itemH = 44;
      gap = 0;
    } else if (totalCount <= 4) {
      itemH = 38;
      gap = 8;
    } else {
      itemH = 33;
      gap = 5;
    }

    const totalContentH = totalCount * itemH + Math.max(0, totalCount - 1) * gap;
    const startY = Math.floor(startYArea + Math.max(0, (availableH - totalContentH) / 2));
    const y = startY + index * (itemH + gap);
    const rowRect = { x: 36, y, w: W - 72, h: itemH };

    const btnW = 90;
    const btnH = 24;
    const btnRect = { x: W - 36 - btnW - 8, y: y + Math.floor((itemH - btnH) / 2), w: btnW, h: btnH };

    return { rowRect, btnRect, itemH, y };
  }

  update(dt, input) {
    const W = C.INTERNAL_W, H = C.INTERNAL_H;

    // Tabs layout
    const tabs = [
      { id: 'artifact', label: 'DI VẬT KHỞI ĐẦU' },
      { id: 'stat', label: 'CHỈ SỐ VĨNH VIỄN' },
      { id: 'utility', label: 'TIỆN ÍCH' },
    ];
    const tabW = 120, tabH = 24, tabGap = 8;
    const tabsStartX = (W - (tabs.length * tabW + (tabs.length - 1) * tabGap)) / 2;
    const tabsY = 62;

    this.hoverTab = -1;
    this.pressedTab = -1;
    for (let i = 0; i < tabs.length; i++) {
      const tx = tabsStartX + i * (tabW + tabGap);
      const tabRect = { x: tx, y: tabsY, w: tabW, h: tabH };
      const check = UIHelper.checkButton(tabRect, input);
      if (check.hovered) this.hoverTab = i;
      if (check.pressed) this.pressedTab = i;
      if (check.clicked) {
        this.currentTab = i;
        this.selectedItemIndex = 0;
        this._refreshItems();
        this.game.audio.playSfx('gate');
        return;
      }
    }

    // Back button
    const backRect = { x: 30, y: 24, w: 110, h: 24 };
    const backCheck = UIHelper.checkButton(backRect, input);
    this.hoverBack = backCheck.hovered;
    this.pressedBack = backCheck.pressed;
    if (backCheck.clicked) {
      this.game.switchScene('menu');
      return;
    }

    // Items action buttons
    this.hoverBuyItem = -1;
    this.pressedBuyItem = -1;

    for (let i = 0; i < this.items.length; i++) {
      const { btnRect } = this._getItemLayout(i, this.items.length, W, H);
      const buyCheck = UIHelper.checkButton(btnRect, input);
      if (buyCheck.hovered) {
        this.hoverBuyItem = i;
        this.selectedItemIndex = i;
      }
      if (buyCheck.pressed) {
        this.pressedBuyItem = i;
      }
      if (buyCheck.clicked) {
        this._tryPurchase(i);
        return;
      }
    }

    // Keyboard tab switching
    if (input.justPressed('KeyQ') || input.justPressed('KeyA')) {
      this.currentTab = (this.currentTab + 2) % 3;
      this.selectedItemIndex = 0;
      this._refreshItems();
    }
    if (input.justPressed('KeyE') || input.justPressed('KeyD')) {
      this.currentTab = (this.currentTab + 1) % 3;
      this.selectedItemIndex = 0;
      this._refreshItems();
    }

    // Keyboard selection navigation
    if (input.justPressed('ArrowDown') || input.justPressed('KeyS')) {
      if (this.items.length > 0) {
        this.selectedItemIndex = (this.selectedItemIndex + 1) % this.items.length;
      }
    }
    if (input.justPressed('ArrowUp') || input.justPressed('KeyW')) {
      if (this.items.length > 0) {
        this.selectedItemIndex = (this.selectedItemIndex + this.items.length - 1) % this.items.length;
      }
    }

    // Keyboard purchase
    if (input.justPressed('Enter') || input.justPressed('Space')) {
      this._tryPurchase(this.selectedItemIndex);
      return;
    }

    // Escape back
    if (input.justPressed('Escape')) {
      this.game.switchScene('menu');
      return;
    }
  }

  _tryPurchase(index) {
    if (index < 0 || index >= this.items.length) return;
    const item = this.items[index];
    if (item.canBuy && !item.owned) {
      const meta = this.game.meta;
      meta.ashSeeds -= item.cost;
      if (item.type === 'artifact') {
        meta.unlocks.artifacts.push(item.id);
      } else {
        meta.unlocks[item.id] = true;
      }
      this.game.saveManager.save(meta);
      this.game.audio.playSfx('levelup');
      this._refreshItems();
    }
  }

  draw(ctx) {
    const W = C.INTERNAL_W, H = C.INTERNAL_H;
    const meta = this.game.meta;

    // Dark rustic background
    ctx.fillStyle = '#0c0b14';
    ctx.fillRect(0, 0, W, H);

    // Frame
    ctx.fillStyle = 'rgba(20, 18, 30, 0.95)';
    ctx.fillRect(20, 16, W - 40, H - 32);
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 1;
    ctx.strokeRect(20.5, 16.5, W - 41, H - 33);

    // Back button
    UIHelper.drawButton(ctx, {
      x: 30,
      y: 24,
      w: 110,
      h: 24,
      label: '← VỀ MENU',
      hovered: this.hoverBack,
      pressed: this.pressedBack,
      variant: 'default',
    });

    // Title
    ctx.fillStyle = '#f59e0b';
    ctx.font = `bold 15px ${UI_HEADING_FONT}`;
    ctx.textAlign = 'center';
    ctx.fillText('LÀNG CHIẾN BINH — MỞ KHÓA VĨNH VIỄN', W / 2, 34);

    // Current ash seeds
    const ashBoxX = W - 146, ashBoxY = 24, ashBoxW = 116, ashBoxH = 24;
    ctx.fillStyle = 'rgba(15, 23, 42, 0.8)';
    ctx.fillRect(ashBoxX, ashBoxY, ashBoxW, ashBoxH);
    ctx.strokeStyle = '#d97706';
    ctx.strokeRect(ashBoxX + 0.5, ashBoxY + 0.5, ashBoxW - 1, ashBoxH - 1);
    PixelIcons.ashSeed(ctx, ashBoxX + 8, ashBoxY + 5, 14);
    ctx.fillStyle = '#fde047';
    ctx.font = `bold 10px ${UI_FONT}`;
    ctx.textAlign = 'left';
    ctx.fillText(`Tro: ${meta?.ashSeeds || 0}`, ashBoxX + 28, ashBoxY + 16);

    // Tabs
    const tabs = [
      { id: 'artifact', label: 'DI VẬT KHỞI ĐẦU' },
      { id: 'stat', label: 'CHỈ SỐ VĨNH VIỄN' },
      { id: 'utility', label: 'TIỆN ÍCH' },
    ];
    const tabW = 120, tabH = 24, tabGap = 8;
    const tabsStartX = (W - (tabs.length * tabW + (tabs.length - 1) * tabGap)) / 2;
    const tabsY = 62;

    for (let i = 0; i < tabs.length; i++) {
      const tx = tabsStartX + i * (tabW + tabGap);
      const isCurrent = i === this.currentTab;
      UIHelper.drawButton(ctx, {
        x: tx,
        y: tabsY,
        w: tabW,
        h: tabH,
        label: tabs[i].label,
        selected: isCurrent,
        hovered: i === this.hoverTab,
        pressed: i === this.pressedTab,
        variant: isCurrent ? 'primary' : 'default',
      });
    }

    // Items list with vertically centered spacing
    for (let i = 0; i < this.items.length; i++) {
      const item = this.items[i];
      const { rowRect, btnRect, itemH, y } = this._getItemLayout(i, this.items.length, W, H);
      const isSel = i === this.selectedItemIndex;

      // Item Row box
      ctx.fillStyle = isSel ? 'rgba(30, 41, 59, 0.9)' : 'rgba(15, 20, 32, 0.7)';
      ctx.fillRect(rowRect.x, y, rowRect.w, itemH);
      ctx.strokeStyle = isSel ? '#f59e0b' : 'rgba(71, 85, 105, 0.35)';
      ctx.lineWidth = isSel ? 1.5 : 1;
      ctx.strokeRect(rowRect.x + 0.5, y + 0.5, rowRect.w - 1, itemH - 1);

      // Icon container
      const iconX = rowRect.x + 8;
      const iconS = Math.min(24, itemH - 8);
      const iconY = y + Math.floor((itemH - iconS) / 2);

      ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
      ctx.fillRect(iconX, iconY, iconS, iconS);
      const img = this.game.assets.getImage(item.id);
      if (img && img.width > 0) {
        ctx.drawImage(img, iconX + 4, iconY + 4, 16, 16);
      } else {
        PixelIcons.draw(ctx, item.type === 'artifact' ? 'sword' : 'star', iconX + 4, iconY + 4, 14);
      }

      // Name & Description
      ctx.textAlign = 'left';
      ctx.fillStyle = item.owned ? '#4ade80' : '#f8fafc';
      ctx.font = `bold 10px ${UI_FONT}`;
      const nameY = y + (itemH > 36 ? 16 : 14);
      ctx.fillText(item.name, iconX + iconS + 8, nameY);

      ctx.fillStyle = '#94a3b8';
      ctx.font = `9px ${UI_FONT}`;
      const descY = y + (itemH > 36 ? 30 : 25);
      ctx.fillText(item.desc, iconX + iconS + 8, descY);

      // Dedicated Lock / Requirement column outside the button
      if (!item.owned && item.lockReason) {
        ctx.textAlign = 'right';
        ctx.font = `9px ${UI_FONT}`;
        ctx.fillStyle = item.reqMet ? '#fbbf24' : '#f87171';
        ctx.fillText(item.lockReason, btnRect.x - 10, y + Math.floor(itemH / 2) + 3);
      }

      // Action Button: Clean and distinct, never overflowed
      const isHov = i === this.hoverBuyItem;
      const isPress = i === this.pressedBuyItem;

      if (item.owned) {
        UIHelper.drawButton(ctx, {
          x: btnRect.x,
          y: btnRect.y,
          w: btnRect.w,
          h: btnRect.h,
          label: 'ĐÃ MỞ',
          icon: 'check',
          disabled: true,
          variant: 'success',
        });
      } else if (item.canBuy) {
        UIHelper.drawButton(ctx, {
          x: btnRect.x,
          y: btnRect.y,
          w: btnRect.w,
          h: btnRect.h,
          label: `${item.cost} TRO`,
          icon: 'ash',
          hovered: isHov,
          pressed: isPress,
          variant: 'primary',
        });
      } else {
        UIHelper.drawButton(ctx, {
          x: btnRect.x,
          y: btnRect.y,
          w: btnRect.w,
          h: btnRect.h,
          label: `${item.cost} TRO`,
          icon: 'lock',
          disabled: true,
          variant: 'subtle',
        });
      }
    }

    // Help Footer (sufficient padding away from item list)
    ctx.textAlign = 'center';
    ctx.fillStyle = '#64748b';
    ctx.font = `9px ${UI_FONT}`;
    ctx.fillText('A/D hoặc Q/E: Chuyển nhóm · ↑↓ / Chuột: Chọn · Enter/Click nút: Mua', W / 2, H - 22);
    ctx.textAlign = 'left';
  }
}

// ============================================================
// SettingsScene
// ============================================================
export class SettingsScene {
  constructor(game) {
    this.game = game;
    this.selected = 0;
    this.hoverIndex = -1;
    this.pressedIndex = -1;
  }

  update(dt, input) {
    const settings = this.game.meta.settings;
    const count = 6;
    const W = C.INTERNAL_W;

    this.hoverIndex = -1;
    this.pressedIndex = -1;
    for (let i = 0; i < count; i++) {
      const y = 96 + i * 31;
      const rowRect = { x: W / 2 - 140, y: y - 8, w: 280, h: 24 };
      const check = UIHelper.checkButton(rowRect, input);
      if (check.hovered) {
        this.hoverIndex = i;
        this.selected = i;
      }
      if (check.pressed) {
        this.pressedIndex = i;
      }
    }

    if (input.justPressed('ArrowDown') || input.justPressed('KeyS')) this.selected = (this.selected + 1) % count;
    if (input.justPressed('ArrowUp') || input.justPressed('KeyW')) this.selected = (this.selected + count - 1) % count;

    if (input.justPressed('ArrowRight') || input.justPressed('KeyD')) {
      if (this.selected === 0) {
        settings.musicVolume = Math.min(1, Math.round((settings.musicVolume + 0.1) * 10) / 10);
        this.game.audio.setMusicVolume(settings.musicVolume);
      }
      if (this.selected === 1) {
        settings.sfxVolume = Math.min(1, Math.round((settings.sfxVolume + 0.1) * 10) / 10);
        this.game.audio.setSfxVolume(settings.sfxVolume);
      }
      if (this.selected === 2) settings.showDamageNumbers = !settings.showDamageNumbers;
      if (this.selected === 3) settings.screenShake = !settings.screenShake;
      if (this.selected === 4) { settings.autoAttack = !settings.autoAttack; Player.setAutoAttack(settings.autoAttack); }
    }
    if (input.justPressed('ArrowLeft') || input.justPressed('KeyA')) {
      if (this.selected === 0) {
        settings.musicVolume = Math.max(0, Math.round((settings.musicVolume - 0.1) * 10) / 10);
        this.game.audio.setMusicVolume(settings.musicVolume);
      }
      if (this.selected === 1) {
        settings.sfxVolume = Math.max(0, Math.round((settings.sfxVolume - 0.1) * 10) / 10);
        this.game.audio.setSfxVolume(settings.sfxVolume);
      }
      if (this.selected === 2) settings.showDamageNumbers = !settings.showDamageNumbers;
      if (this.selected === 3) settings.screenShake = !settings.screenShake;
      if (this.selected === 4) { settings.autoAttack = !settings.autoAttack; Player.setAutoAttack(settings.autoAttack); }
    }

    const mousePos = input.getMousePos();
    const mx = mousePos.x;
    const my = mousePos.y;

    if (input.mouseClicked()) {
      const sliderX = W / 2 + 10;
      const sliderW = 80;
      if (this.selected === 0 && my >= 96 - 6 && my <= 96 + 18) {
        if (mx >= sliderX - 16 && mx <= sliderX - 2) {
          settings.musicVolume = Math.max(0, Math.round((settings.musicVolume - 0.1) * 10) / 10);
        } else if (mx >= sliderX + sliderW + 2 && mx <= sliderX + sliderW + 18) {
          settings.musicVolume = Math.min(1, Math.round((settings.musicVolume + 0.1) * 10) / 10);
        } else if (mx >= sliderX && mx <= sliderX + sliderW) {
          settings.musicVolume = Math.round(((mx - sliderX) / sliderW) * 10) / 10;
        }
        this.game.audio.setMusicVolume(settings.musicVolume);
      } else if (this.selected === 1 && my >= 127 - 6 && my <= 127 + 18) {
        if (mx >= sliderX - 16 && mx <= sliderX - 2) {
          settings.sfxVolume = Math.max(0, Math.round((settings.sfxVolume - 0.1) * 10) / 10);
        } else if (mx >= sliderX + sliderW + 2 && mx <= sliderX + sliderW + 18) {
          settings.sfxVolume = Math.min(1, Math.round((settings.sfxVolume + 0.1) * 10) / 10);
        } else if (mx >= sliderX && mx <= sliderX + sliderW) {
          settings.sfxVolume = Math.round(((mx - sliderX) / sliderW) * 10) / 10;
        }
        this.game.audio.setSfxVolume(settings.sfxVolume);
      } else if (this.selected === 2 && this.hoverIndex === 2) {
        settings.showDamageNumbers = !settings.showDamageNumbers;
      } else if (this.selected === 3 && this.hoverIndex === 3) {
        settings.screenShake = !settings.screenShake;
      } else if (this.selected === 4 && this.hoverIndex === 4) {
        settings.autoAttack = !settings.autoAttack;
        Player.setAutoAttack(settings.autoAttack);
      } else if (this.selected === 5 && this.hoverIndex === 5) {
        this.game.returnFromSettings();
        return;
      }
    }

    if (input.justPressed('Enter') || input.justPressed('Space')) {
      if (this.selected === 2) settings.showDamageNumbers = !settings.showDamageNumbers;
      if (this.selected === 3) settings.screenShake = !settings.screenShake;
      if (this.selected === 4) { settings.autoAttack = !settings.autoAttack; Player.setAutoAttack(settings.autoAttack); }
      if (this.selected === 5) { this.game.returnFromSettings(); return; }
    }

    if (input.justPressed('Escape')) {
      this.game.returnFromSettings();
    }
  }

  draw(ctx, asOverlay = false) {
    const W = C.INTERNAL_W, H = C.INTERNAL_H;
    const s = this.game.meta.settings;

    if (!asOverlay) {
      ctx.fillStyle = '#0a0a14';
      ctx.fillRect(0, 0, W, H);
    }

    const panelW = 340, panelH = 260;
    const px = (W - panelW) / 2, py = (H - panelH) / 2;
    ctx.fillStyle = 'rgba(14, 16, 26, 0.95)';
    ctx.fillRect(px, py, panelW, panelH);
    ctx.strokeStyle = '#c2a649';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(px, py, panelW, panelH);

    PixelIcons.gear(ctx, W / 2 - 75, py + 16, 14, '#ffdf88');

    ctx.fillStyle = '#ffdf88';
    ctx.font = `bold 15px ${UI_HEADING_FONT}`;
    ctx.textAlign = 'center';
    ctx.fillText('CÀI ĐẶT HỆ THỐNG', W / 2, py + 28);

    const labels = [
      'Âm lượng Nhạc',
      'Âm lượng SFX',
      'Hiện số sát thương',
      'Rung màn hình',
      'Tự động đánh gần',
      '← Lưu & Quay lại',
    ];

    const sliderX = W / 2 + 10;
    const sliderW = 80;

    for (let i = 0; i < labels.length; i++) {
      const y = 96 + i * 31;
      const sel = i === this.selected;
      const isPress = i === this.pressedIndex;
      const ox = isPress ? 1 : 0;
      const oy = isPress ? 1 : 0;

      ctx.fillStyle = sel ? 'rgba(200, 170, 80, 0.18)' : 'rgba(255, 255, 255, 0.03)';
      ctx.fillRect(W / 2 - 140 + ox, y - 8 + oy, 280, 24);
      if (sel) {
        ctx.strokeStyle = '#d4b45a';
        ctx.lineWidth = 1;
        ctx.strokeRect(W / 2 - 140 + ox, y - 8 + oy, 280, 24);
      }

      ctx.font = sel ? `bold 11px ${UI_FONT}` : `11px ${UI_FONT}`;
      ctx.fillStyle = sel ? '#ffffff' : '#b0b8c8';
      ctx.textAlign = 'left';
      ctx.fillText(labels[i], W / 2 - 130 + ox, y + 8 + oy);

      if (i === 0 || i === 1) {
        const val = i === 0 ? s.musicVolume : s.sfxVolume;
        ctx.fillStyle = sel ? '#ffdf88' : '#778899';
        ctx.font = `bold 11px ${UI_FONT}`;
        ctx.textAlign = 'center';
        ctx.fillText('-', sliderX - 8, y + 8);

        ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
        ctx.fillRect(sliderX, y, sliderW, 8);

        ctx.fillStyle = sel ? '#ffcc44' : '#c2a649';
        ctx.fillRect(sliderX, y, sliderW * val, 8);
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.lineWidth = 1;
        ctx.strokeRect(sliderX, y, sliderW, 8);

        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(sliderX + sliderW * val, y + 4, 5, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = sel ? '#ffdf88' : '#778899';
        ctx.font = `bold 11px ${UI_FONT}`;
        ctx.fillText('+', sliderX + sliderW + 8, y + 8);

        ctx.fillStyle = sel ? '#ffffff' : '#cccccc';
        ctx.font = `10px ${UI_FONT}`;
        ctx.textAlign = 'right';
        ctx.fillText(`${Math.round(val * 100)}%`, W / 2 + 130, y + 8);
      } else if (i === 2 || i === 3 || i === 4) {
        let active = false;
        if (i === 2) active = s.showDamageNumbers;
        if (i === 3) active = s.screenShake;
        if (i === 4) active = s.autoAttack;

        ctx.textAlign = 'right';
        ctx.fillStyle = active ? '#55dd66' : '#888899';
        ctx.font = `bold 10px ${UI_FONT}`;
        ctx.fillText(active ? '● BẬT' : '○ TẮT', W / 2 + 130, y + 8);
      } else if (i === 5) {
        ctx.textAlign = 'center';
      }
    }

    ctx.fillStyle = '#8a94a6';
    ctx.font = `9px ${UI_FONT}`;
    ctx.textAlign = 'center';
    ctx.fillText('← → / Click chuột để chỉnh · Enter/Click chọn · Esc quay lại', W / 2, py + panelH - 12);
    ctx.textAlign = 'left';
  }
}

// ============================================================
// PauseOverlay
// ============================================================
export class PauseOverlay {
  constructor(game) {
    this.game = game;
    this.selected = 0;
    this.confirmQuit = false;
    this.confirmSelected = 0;
    this.hoverIndex = -1;
    this.pressedIndex = -1;
    this.hoverConfirmBtn = -1;
    this.pressedConfirmBtn = -1;
  }

  update(dt, input) {
    const W = C.INTERNAL_W, H = C.INTERNAL_H;

    if (this.confirmQuit) {
      if (input.justPressed('Escape')) {
        this.confirmQuit = false;
        return;
      }
      const btnY = H / 2 + 18;
      const btn1X = W / 2 - 100, btn2X = W / 2 + 10;
      const bW = 90, bH = 26;

      const check1 = UIHelper.checkButton({ x: btn1X, y: btnY - 8, w: bW, h: bH }, input);
      const check2 = UIHelper.checkButton({ x: btn2X, y: btnY - 8, w: bW, h: bH }, input);

      this.hoverConfirmBtn = -1;
      this.pressedConfirmBtn = -1;
      if (check1.hovered) { this.confirmSelected = 0; this.hoverConfirmBtn = 0; }
      if (check2.hovered) { this.confirmSelected = 1; this.hoverConfirmBtn = 1; }
      if (check1.pressed) this.pressedConfirmBtn = 0;
      if (check2.pressed) this.pressedConfirmBtn = 1;

      if (input.justPressed('ArrowLeft') || input.justPressed('KeyA')) this.confirmSelected = 0;
      if (input.justPressed('ArrowRight') || input.justPressed('KeyD')) this.confirmSelected = 1;

      if (input.justPressed('Enter') || input.justPressed('Space')) {
        if (this.confirmSelected === 0) {
          this.confirmQuit = false;
        } else {
          this.confirmQuit = false;
          this.game.abandonRun();
        }
        return;
      }

      if (check1.clicked) {
        this.confirmQuit = false;
        return;
      }
      if (check2.clicked) {
        this.confirmQuit = false;
        this.game.abandonRun();
        return;
      }
      return;
    }

    if (input.justPressed('Escape')) {
      this.game.resumeFromPause();
      return;
    }

    const optRects = [];
    for (let i = 0; i < 3; i++) {
      const y = H / 2 - 12 + i * 28;
      optRects.push({ x: W / 2 - 85, y: y - 8, w: 170, h: 24 });
    }

    this.hoverIndex = -1;
    this.pressedIndex = -1;
    for (let i = 0; i < 3; i++) {
      const check = UIHelper.checkButton(optRects[i], input);
      if (check.hovered) {
        this.hoverIndex = i;
        this.selected = i;
      }
      if (check.pressed) {
        this.pressedIndex = i;
      }
      if (check.clicked) {
        this._doPauseAction(i);
        return;
      }
    }

    if (input.justPressed('ArrowDown') || input.justPressed('KeyS')) this.selected = (this.selected + 1) % 3;
    if (input.justPressed('ArrowUp') || input.justPressed('KeyW')) this.selected = (this.selected + 2) % 3;

    if (input.justPressed('Enter') || input.justPressed('Space')) {
      this._doPauseAction(this.selected);
      return;
    }
  }

  _doPauseAction(idx) {
    if (idx === 0) {
      this.game.resumeFromPause();
    } else if (idx === 1) {
      this.game.openSettings('pause');
    } else if (idx === 2) {
      this.confirmQuit = true;
      this.confirmSelected = 0;
    }
  }

  draw(ctx) {
    const W = C.INTERNAL_W, H = C.INTERNAL_H;
    ctx.fillStyle = 'rgba(4, 6, 12, 0.82)';
    ctx.fillRect(0, 0, W, H);

    if (this.confirmQuit) {
      const mw = 280, mh = 136;
      const mx = (W - mw) / 2, my = (H - mh) / 2;
      ctx.fillStyle = 'rgba(20, 15, 22, 0.98)';
      ctx.fillRect(mx, my, mw, mh);
      ctx.strokeStyle = '#dc2626';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(mx, my, mw, mh);

      PixelIcons.skull(ctx, W / 2 - 8, my + 14, 16, '#f87171');

      ctx.fillStyle = '#f87171';
      ctx.font = `bold 14px ${UI_HEADING_FONT}`;
      ctx.textAlign = 'center';
      ctx.fillText('RỜI TRẬN ĐẤU?', W / 2, my + 44);

      ctx.fillStyle = '#cbd5e1';
      ctx.font = `9px ${UI_FONT}`;
      ctx.fillText('Tiến trình chưa lưu checkpoint sẽ bị mất!', W / 2, my + 64);

      const btnY = H / 2 + 18;
      const btn1X = W / 2 - 100, btn2X = W / 2 + 10;
      const bW = 90, bH = 26;

      UIHelper.drawButton(ctx, {
        x: btn1X,
        y: btnY - 8,
        w: bW,
        h: bH,
        label: 'TIẾP TỤC',
        selected: this.confirmSelected === 0,
        hovered: this.hoverConfirmBtn === 0,
        pressed: this.pressedConfirmBtn === 0,
        variant: 'success',
      });

      UIHelper.drawButton(ctx, {
        x: btn2X,
        y: btnY - 8,
        w: bW,
        h: bH,
        label: 'RỜI VỀ MENU',
        selected: this.confirmSelected === 1,
        hovered: this.hoverConfirmBtn === 1,
        pressed: this.pressedConfirmBtn === 1,
        variant: 'danger',
      });

      ctx.textAlign = 'left';
      return;
    }

    const pw = 210, ph = 160;
    const px = (W - pw) / 2, py = (H - ph) / 2;
    ctx.fillStyle = 'rgba(15, 18, 30, 0.96)';
    ctx.fillRect(px, py, pw, ph);
    ctx.strokeStyle = '#d4b45a';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(px, py, pw, ph);

    ctx.fillStyle = '#ffdf88';
    ctx.font = `bold 15px ${UI_HEADING_FONT}`;
    ctx.textAlign = 'center';
    ctx.fillText('TẠM DỪNG', W / 2, py + 26);

    const opts = [
      { label: 'TIẾP TỤC CHIẾN ĐẤU', icon: 'sword', variant: 'primary' },
      { label: 'CÀI ĐẶT HỆ THỐNG', icon: 'gear', variant: 'default' },
      { label: 'RỜI VỀ MENU', icon: 'skull', variant: 'danger' },
    ];

    for (let i = 0; i < opts.length; i++) {
      const y = H / 2 - 12 + i * 28;
      UIHelper.drawButton(ctx, {
        x: W / 2 - 85,
        y: y - 8,
        w: 170,
        h: 24,
        label: opts[i].label,
        icon: opts[i].icon,
        selected: i === this.selected,
        hovered: i === this.hoverIndex,
        pressed: i === this.pressedIndex,
        variant: opts[i].variant,
      });
    }
    ctx.textAlign = 'left';
  }
}

// ============================================================
// StageCompleteScene
// ============================================================
export class StageCompleteScene {
  constructor(game) {
    this.game = game;
    this.selected = 0;
    this.timer = 0;
    this.showHarvest = false;
    this.hoverBtn = -1;
    this.pressedBtn = -1;
  }

  show(stageResult) {
    this.stageResult = stageResult;
    this.timer = 0;
    this.selected = 0;
    this.showHarvest = stageResult.canHarvest || false;
    this.hoverBtn = -1;
    this.pressedBtn = -1;
  }

  update(dt, input) {
    this.timer += dt;
    if (this.timer < 0.4) return;

    const W = C.INTERNAL_W;

    if (this.showHarvest) {
      const btnW = 240, btnH = 28;
      const b0 = { x: (W - btnW) / 2, y: 172, w: btnW, h: btnH };
      const b1 = { x: (W - btnW) / 2, y: 208, w: btnW, h: btnH };

      const c0 = UIHelper.checkButton(b0, input);
      const c1 = UIHelper.checkButton(b1, input);

      this.hoverBtn = -1;
      this.pressedBtn = -1;
      if (c0.hovered) { this.hoverBtn = 0; this.selected = 0; }
      else if (c1.hovered) { this.hoverBtn = 1; this.selected = 1; }
      if (c0.pressed) this.pressedBtn = 0;
      else if (c1.pressed) this.pressedBtn = 1;

      if (input.justPressed('ArrowRight') || input.justPressed('KeyD') || input.justPressed('ArrowDown') || input.justPressed('KeyS')) {
        this.selected = 1;
      }
      if (input.justPressed('ArrowLeft') || input.justPressed('KeyA') || input.justPressed('ArrowUp') || input.justPressed('KeyW')) {
        this.selected = 0;
      }

      if (input.justPressed('Enter') || input.justPressed('Space')) {
        this._confirm(this.selected);
        return;
      }

      if (c0.clicked) {
        this._confirm(0);
        return;
      }
      if (c1.clicked) {
        this._confirm(1);
        return;
      }
    } else {
      const contBtn = { x: W / 2 - 80, y: 180, w: 160, h: 28 };
      const check = UIHelper.checkButton(contBtn, input);
      this.hoverBtn = check.hovered ? 0 : -1;
      this.pressedBtn = check.pressed ? 0 : -1;

      if (input.justPressed('Enter') || input.justPressed('Space') || check.clicked) {
        this._confirm(0);
        return;
      }
    }
  }

  _confirm(idx) {
    if (this.showHarvest && idx === 1) {
      this.game.audio.playSfx('boss_warn');
      this.game.startGreedHarvest();
    } else {
      this.game.audio.playSfx('gate');
      this.game.proceedToNextStage();
    }
  }

  draw(ctx) {
    const W = C.INTERNAL_W, H = C.INTERNAL_H;
    ctx.fillStyle = 'rgba(6, 10, 16, 0.92)';
    ctx.fillRect(0, 0, W, H);

    const x = W / 2 - 140, y = 30, w = 280, h = 260;
    ctx.fillStyle = 'rgba(16, 22, 36, 0.96)';
    ctx.fillRect(x, y, w, h);
    ctx.strokeStyle = '#4ade80';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(x, y, w, h);

    PixelIcons.check(ctx, W / 2 - 8, y + 16, 16, '#4ade80');

    ctx.fillStyle = '#4ade80';
    ctx.font = `bold 16px ${UI_HEADING_FONT}`;
    ctx.textAlign = 'center';
    ctx.fillText('MÀN HOÀN THÀNH!', W / 2, y + 46);

    const r = this.stageResult || {};
    ctx.fillStyle = '#f1f5f9';
    ctx.font = `10px ${UI_FONT}`;
    ctx.fillText(r.objective || 'Mục tiêu hoàn tất', W / 2, y + 68);

    // Rewards box
    const rwY = y + 84;
    ctx.fillStyle = 'rgba(15, 23, 42, 0.7)';
    ctx.fillRect(x + 24, rwY, w - 48, 48);
    ctx.strokeStyle = 'rgba(74, 222, 128, 0.25)';
    ctx.strokeRect(x + 24, rwY, w - 48, 48);

    PixelIcons.coin(ctx, x + 40, rwY + 10, 12);
    ctx.fillStyle = '#fde047';
    ctx.font = `bold 10px ${UI_FONT}`;
    ctx.textAlign = 'left';
    ctx.fillText(`Vàng thu được: +${r.goldEarned || 0}`, x + 58, rwY + 19);

    PixelIcons.ashSeed(ctx, x + 40, rwY + 28, 12);
    ctx.fillStyle = '#fbbf24';
    ctx.fillText(`Hạt Tro nhận: +${r.ashEarned || 0}`, x + 58, rwY + 37);

    ctx.textAlign = 'center';
    if (this.showHarvest) {
      const btnW = 240, btnH = 28;
      UIHelper.drawButton(ctx, {
        x: (W - btnW) / 2,
        y: 172,
        w: btnW,
        h: btnH,
        label: 'MÀN TIẾP THEO [ENTER / CLICK]',
        selected: this.selected === 0,
        hovered: this.hoverBtn === 0,
        pressed: this.pressedBtn === 0,
        variant: 'success',
      });

      UIHelper.drawButton(ctx, {
        x: (W - btnW) / 2,
        y: 208,
        w: btnW,
        h: btnH,
        label: 'GẶT THAM (Thêm Quái & Thưởng Lớn)',
        icon: 'sword',
        selected: this.selected === 1,
        hovered: this.hoverBtn === 1,
        pressed: this.pressedBtn === 1,
        variant: 'primary',
      });
    } else {
      if (this.timer > 0.4) {
        UIHelper.drawButton(ctx, {
          x: W / 2 - 90,
          y: 180,
          w: 180,
          h: 28,
          label: 'MÀN TIẾP THEO [ENTER / CLICK]',
          hovered: this.hoverBtn === 0,
          pressed: this.pressedBtn === 0,
          variant: 'success',
        });
      }
    }
    ctx.textAlign = 'left';
  }
}

// ============================================================
// ArtifactSelectScene — pick starting artifact for new run
// ============================================================
export class ArtifactSelectScene {
  constructor(game) {
    this.game = game;
    this.selected = 0;
    this.artifacts = [];
    this.hoverCard = -1;
    this.pressedCard = -1;
  }

  show(artifactIds) {
    this.selected = 0;
    this.hoverCard = -1;
    this.pressedCard = -1;
    this.artifacts = artifactIds.map(id => {
      const def = ARTIFACTS[id];
      return { id, name: def?.name || id, desc: def?.desc || '', icon: def?.icon || id };
    });
  }

  _getCardLayout() {
    const W = C.INTERNAL_W;
    const cardW = 120, gap = 16;
    const totalW = this.artifacts.length * cardW + (this.artifacts.length - 1) * gap;
    const startX = (W - totalW) / 2;
    const startY = 88;
    const cardH = 160;
    return this.artifacts.map((_, i) => ({
      x: startX + i * (cardW + gap),
      y: startY,
      w: cardW,
      h: cardH,
    }));
  }

  update(dt, input) {
    if (this.artifacts.length === 0) return;
    const rects = this._getCardLayout();

    this.hoverCard = -1;
    this.pressedCard = -1;
    for (let i = 0; i < rects.length; i++) {
      const check = UIHelper.checkButton(rects[i], input);
      if (check.hovered) {
        this.hoverCard = i;
        this.selected = i;
      }
      if (check.pressed) {
        this.pressedCard = i;
      }
      if (check.clicked) {
        this._selectArtifact(i);
        return;
      }
    }

    if (input.justPressed('ArrowLeft') || input.justPressed('KeyA')) {
      this.selected = (this.selected + this.artifacts.length - 1) % this.artifacts.length;
    }
    if (input.justPressed('ArrowRight') || input.justPressed('KeyD')) {
      this.selected = (this.selected + 1) % this.artifacts.length;
    }
    if (input.justPressed('Digit1') && this.artifacts.length > 0) this.selected = 0;
    if (input.justPressed('Digit2') && this.artifacts.length > 1) this.selected = 1;
    if (input.justPressed('Digit3') && this.artifacts.length > 2) this.selected = 2;

    if (input.justPressed('Enter') || input.justPressed('Space')) {
      this._selectArtifact(this.selected);
      return;
    }
  }

  _selectArtifact(idx) {
    if (idx >= 0 && idx < this.artifacts.length) {
      this.game.audio.playSfx('levelup');
      this.game.onArtifactSelected(this.artifacts[idx].id);
    }
  }

  draw(ctx) {
    const W = C.INTERNAL_W, H = C.INTERNAL_H;
    ctx.fillStyle = 'rgba(8, 7, 18, 0.94)';
    ctx.fillRect(0, 0, W, H);

    ctx.fillStyle = '#f59e0b';
    ctx.font = `bold 16px ${UI_HEADING_FONT}`;
    ctx.textAlign = 'center';
    ctx.fillText('CHỌN DI VẬT KHỞI ĐẦU', W / 2, 42);

    ctx.fillStyle = '#94a3b8';
    ctx.font = `9px ${UI_FONT}`;
    ctx.fillText('Phím 1/2/3 hoặc Click chuột vào thẻ bài', W / 2, 60);

    const rects = this._getCardLayout();

    for (let i = 0; i < this.artifacts.length; i++) {
      const art = this.artifacts[i];
      const r = rects[i];
      const sel = i === this.selected;
      const isPress = i === this.pressedCard;

      ctx.save();
      const ox = isPress ? 1 : 0;
      const oy = isPress ? 1 : 0;
      const rx = r.x + ox;
      const ry = r.y + oy;

      ctx.fillStyle = sel ? 'rgba(30, 41, 59, 0.98)' : 'rgba(15, 20, 32, 0.9)';
      ctx.fillRect(rx, ry, r.w, r.h);

      if (!isPress) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
        ctx.fillRect(rx + 1, ry + r.h, r.w - 1, 2);
      }

      ctx.strokeStyle = sel ? '#f59e0b' : 'rgba(100, 116, 139, 0.4)';
      ctx.lineWidth = sel ? 2 : 1;
      ctx.strokeRect(rx + 0.5, ry + 0.5, r.w - 1, r.h - 1);

      if (sel) {
        ctx.fillStyle = '#f59e0b';
        ctx.fillRect(rx - 2, ry - 2, 3, 3);
        ctx.fillRect(rx + r.w - 1, ry - 2, 3, 3);
        ctx.fillRect(rx - 2, ry + r.h - 1, 3, 3);
        ctx.fillRect(rx + r.w - 1, ry + r.h - 1, 3, 3);
      }

      // Number badge
      ctx.fillStyle = sel ? '#f59e0b' : '#64748b';
      ctx.font = `bold 10px ${UI_FONT}`;
      ctx.fillText(`[ ${i + 1} ]`, rx + r.w / 2, ry + 16);

      // Icon box
      const iconBoxSize = 36;
      const iconBoxX = rx + r.w / 2 - iconBoxSize / 2;
      const iconBoxY = ry + 24;
      ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
      ctx.fillRect(iconBoxX, iconBoxY, iconBoxSize, iconBoxSize);
      ctx.strokeStyle = sel ? '#f59e0b' : 'rgba(71, 85, 105, 0.5)';
      ctx.strokeRect(iconBoxX + 0.5, iconBoxY + 0.5, iconBoxSize - 1, iconBoxSize - 1);

      const icon = this.game.assets.getImage(art.icon);
      if (icon && icon.width > 0) {
        ctx.drawImage(icon, iconBoxX + 2, iconBoxY + 2, 32, 32);
      } else {
        PixelIcons.sword(ctx, iconBoxX + 10, iconBoxY + 8, 16);
      }

      // Name
      ctx.fillStyle = sel ? '#ffffff' : '#f1f5f9';
      ctx.font = `bold 10px ${UI_FONT}`;
      ctx.fillText(art.name, rx + r.w / 2, ry + 74);

      // Description wrap
      ctx.fillStyle = '#94a3b8';
      ctx.font = `9px ${UI_FONT}`;
      const words = art.desc.split(' ');
      let line = '', ly = ry + 94;
      for (const w of words) {
        const test = line + w + ' ';
        if (ctx.measureText(test).width > r.w - 16) {
          ctx.fillText(line.trim(), rx + r.w / 2, ly);
          line = w + ' ';
          ly += 11;
        } else {
          line = test;
        }
      }
      if (line.trim()) ctx.fillText(line.trim(), rx + r.w / 2, ly);

      // Prompt
      ctx.fillStyle = sel ? '#f59e0b' : '#64748b';
      ctx.font = `bold 9px ${UI_FONT}`;
      ctx.fillText(sel ? '▶ CHỌN ◀' : 'Click chọn', rx + r.w / 2, ry + r.h - 10);

      ctx.restore();
    }
    ctx.textAlign = 'left';
  }
}
