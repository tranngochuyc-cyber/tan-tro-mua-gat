// ============================================================
// MenuScene — Title screen with rich pixel art village scenery
// Shows an ashen post-harvest countryside: thatched cottage,
// autumn maple trees swaying in the wind, rustic fences,
// crop furrows, and a flickering bonfire with warm radiant light.
// Right side features a dedicated high-contrast slate menu panel
// with embossed typography and shortened action buttons.
// ============================================================
import * as C from '../engine/Constants.js';
import { UIHelper, UI_FONT, UI_HEADING_FONT } from '../engine/UIHelper.js';
import { SpriteSheet } from '../engine/SpriteSheet.js';

export class MenuScene {
  constructor(game) {
    this.game = game;
    this.selected = 0;
    this.hovered = -1;
    this.pressed = -1;
    this.animTime = 0;
    this.flameFrame = 0;
    this.soldierFrame = 0;
    this.soldierTimer = 0;

    // Drifting background embers (contained away from the text panel)
    this.embers = [];
    for (let i = 0; i < 24; i++) {
      this.embers.push({
        x: 40 + Math.random() * 300, // keep over the village side
        y: Math.random() * C.INTERNAL_H,
        vy: -8 - Math.random() * 16,
        vx: (Math.random() - 0.5) * 6,
        size: 1 + Math.random() * 2,
        alpha: 0.2 + Math.random() * 0.5,
      });
    }

    // Modal state for controls guide
    this.showHelpModal = false;
    this.helpCloseHover = false;
    this.helpClosePress = false;
  }

  /** Expose primary menu options for external testing inspection */
  get buttons() {
    return this._getOptions();
  }

  _getOptions() {
    const opts = [];
    if (this.game.meta?.checkpoint) {
      const stg = (this.game.meta.checkpoint.currentStage || 0) + 1;
      opts.push({ id: 'continue', label: `Tiếp tục (Màn ${stg}/12)`, icon: 'lightning', variant: 'primary' });
    }
    opts.push({ id: 'new_run', label: 'Chơi mới', icon: 'sword', variant: 'primary' });
    opts.push({ id: 'hub', label: 'Làng chiến binh', icon: 'village', variant: 'default' });
    opts.push({ id: 'settings', label: 'Cài đặt', icon: 'gear', variant: 'default' });
    return opts;
  }

  _getPanelRect() {
    return {
      x: 370,
      y: 35,
      w: 245,
      h: 290,
    };
  }

  _getOptionRects(options) {
    const panel = this._getPanelRect();
    const btnW = 210, btnH = options.length > 3 ? 28 : 32, gap = options.length > 3 ? 6 : 8;
    const startY = panel.y + 105;

    return options.map((_, i) => ({
      x: Math.floor(panel.x + (panel.w - btnW) / 2),
      y: startY + i * (btnH + gap),
      w: btnW,
      h: btnH,
    }));
  }

  _getHelpBtnRect() {
    const panel = this._getPanelRect();
    return {
      x: panel.x + 25,
      y: panel.y + panel.h - 38,
      w: panel.w - 50,
      h: 22,
    };
  }

  update(dt, input) {
    this.animTime += dt;

    // Bonfire flame animation cycle
    this.flameFrame = (this.animTime * 6) % 3;

    // Soldier idle sprite cycle
    this.soldierTimer += dt;
    if (this.soldierTimer >= 0.14) {
      this.soldierTimer -= 0.14;
      this.soldierFrame = (this.soldierFrame + 1) % 6;
    }

    // Drifting embers (drift upwards on village side)
    for (const p of this.embers) {
      p.y += p.vy * dt;
      p.x += p.vx * dt;
      if (p.y < -5) {
        p.y = C.INTERNAL_H + 5;
        p.x = 40 + Math.random() * 310;
      }
    }

    // Handle Help modal interaction if active
    if (this.showHelpModal) {
      if (input.justPressed('Escape') || input.justPressed('KeyH') || input.justPressed('Enter') || input.justPressed('Space')) {
        this.showHelpModal = false;
        return;
      }
      const closeBtn = { x: C.INTERNAL_W / 2 - 60, y: 285, w: 120, h: 26 };
      const chk = UIHelper.checkButton(closeBtn, input);
      this.helpCloseHover = chk.hovered;
      this.helpClosePress = chk.pressed;
      if (chk.clicked) {
        this.showHelpModal = false;
      }
      return;
    }

    // Toggle help with 'H'
    if (input.justPressed('KeyH')) {
      this.showHelpModal = true;
      return;
    }

    // Help button click detection
    const helpRect = this._getHelpBtnRect();
    const helpCheck = UIHelper.checkButton(helpRect, input);
    if (helpCheck.clicked) {
      this.showHelpModal = true;
      this.game.audio.playSfx('click');
      return;
    }

    const options = this._getOptions();
    const rects = this._getOptionRects(options);

    // Mouse selection & click with drag-to-cancel
    this.hovered = -1;
    this.pressed = -1;
    for (let i = 0; i < options.length; i++) {
      const check = UIHelper.checkButton(rects[i], input);
      if (check.hovered) {
        this.hovered = i;
        this.selected = i;
      }
      if (check.pressed) {
        this.pressed = i;
      }
      if (check.clicked) {
        this._handleSelect(options, i);
        return;
      }
    }

    // Keyboard navigation
    if (input.justPressed('ArrowDown') || input.justPressed('KeyS')) {
      this.selected = (this.selected + 1) % options.length;
    }
    if (input.justPressed('ArrowUp') || input.justPressed('KeyW')) {
      this.selected = (this.selected + options.length - 1) % options.length;
    }

    // Keyboard confirm
    if (input.justPressed('Enter') || input.justPressed('Space')) {
      this._handleSelect(options, this.selected);
      return;
    }
  }

  _handleSelect(options, index) {
    const opt = options[index] || options[0];
    if (!opt) return;

    switch (opt.id) {
      case 'continue':
        this.game.audio.playSfx('gate');
        this.game.continueSavedRun();
        break;
      case 'new_run':
        this.game.audio.playSfx('gate');
        this.game.startNewRun();
        break;
      case 'hub':
        this.game.audio.playSfx('chest');
        this.game.switchScene('hub');
        break;
      case 'settings':
        this.game.audio.playSfx('xp');
        this.game.openSettings('menu');
        break;
    }
  }

  draw(ctx) {
    const W = C.INTERNAL_W;
    const H = C.INTERNAL_H;
    ctx.imageSmoothingEnabled = false;

    // ============================================================
    // 1. HẬU CẢNH: Bầu trời hoàng hôn tàn tro & dãy núi xa
    // ============================================================
    // Gradient sky: twilight violet down to warm burning ember crimson at horizon
    const skyGrad = ctx.createLinearGradient(0, 0, 0, 140);
    skyGrad.addColorStop(0, '#090a14');
    skyGrad.addColorStop(0.45, '#191024');
    skyGrad.addColorStop(0.75, '#351820');
    skyGrad.addColorStop(1, '#54231b');
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, W, 140);

    // Distant mountain silhouette
    ctx.fillStyle = '#181120';
    ctx.beginPath();
    ctx.moveTo(0, 140);
    ctx.lineTo(0, 105);
    ctx.lineTo(45, 92);
    ctx.lineTo(95, 112);
    ctx.lineTo(150, 85);
    ctx.lineTo(210, 115);
    ctx.lineTo(280, 88);
    ctx.lineTo(350, 110);
    ctx.lineTo(430, 95);
    ctx.lineTo(510, 118);
    ctx.lineTo(580, 98);
    ctx.lineTo(W, 112);
    ctx.lineTo(W, 140);
    ctx.closePath();
    ctx.fill();

    // Secondary closer ridge
    ctx.fillStyle = '#221626';
    ctx.beginPath();
    ctx.moveTo(0, 140);
    ctx.lineTo(0, 120);
    ctx.lineTo(60, 112);
    ctx.lineTo(120, 124);
    ctx.lineTo(180, 110);
    ctx.lineTo(240, 122);
    ctx.lineTo(320, 115);
    ctx.lineTo(400, 126);
    ctx.lineTo(520, 118);
    ctx.lineTo(W, 125);
    ctx.lineTo(W, 140);
    ctx.closePath();
    ctx.fill();

    // Distant pine tree treeline
    ctx.fillStyle = '#150f1c';
    for (let x = 10; x < W - 20; x += 18) {
      const th = 8 + (Math.sin(x * 0.1) * 3);
      ctx.fillRect(x, 122 - th, 2, th);
      ctx.fillRect(x - 1, 122 - th + 2, 4, 3);
      ctx.fillRect(x - 2, 122 - th + 5, 6, 4);
    }

    // ============================================================
    // 2. TRUNG CẢNH: Mặt đất làng quê mùa gặt & các công trình
    // ============================================================
    // Ground base: autumnal scorched earth & dry loam
    const groundGrad = ctx.createLinearGradient(0, 130, 0, H);
    groundGrad.addColorStop(0, '#382a20');
    groundGrad.addColorStop(0.35, '#2e221b');
    groundGrad.addColorStop(1, '#231a15');
    ctx.fillStyle = groundGrad;
    ctx.fillRect(0, 130, W, H - 130);

    // Farmland soil bands / terraced levels
    ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
    ctx.fillRect(0, 150, W, 2);
    ctx.fillRect(0, 195, W, 2);
    ctx.fillRect(0, 255, W, 2);

    // Harvested Crop Field (Ruộng mùa gặt) on upper-center
    this._drawHarvestField(ctx, 160, 142, 170, 48);

    // Dirt road (Đường đất uốn lượn từ làng qua cánh đồng)
    this._drawVillageRoad(ctx);

    // Ruined farmhouse cottage (Ngôi nhà gỗ mái tranh)
    this._drawVillageHouse(ctx, 35, 138);

    // Autumn maple trees (Cây phong lá đỏ/vàng đung đưa theo gió nhẹ)
    this._drawMapleTrees(ctx);

    // Wooden fences (Hàng rào gỗ mộc)
    this._drawWoodenFences(ctx);

    // Hay sheaves and harvest barrels (Bó rơm & thùng gỗ mùa thu)
    this._drawHarvestProps(ctx);

    // ============================================================
    // 3. ĐIỂM SÁNG: Ngọn lửa sưởi ấm & Chiến binh canh gác
    // ============================================================
    const fireX = 180;
    const fireY = 245;
    this._drawBonfire(ctx, fireX, fireY);
    this._drawGuardingSoldier(ctx, fireX - 34, fireY - 10);

    // Drifting embers over village area
    for (const p of this.embers) {
      ctx.globalAlpha = p.alpha;
      ctx.fillStyle = p.size > 2 ? '#ff6622' : '#f59e0b';
      ctx.fillRect(Math.floor(p.x), Math.floor(p.y), p.size, p.size);
    }
    ctx.globalAlpha = 1;

    // ============================================================
    // 4. BẢNG MENU CHÍNH (Đặt tại vùng trống có chủ đích bên phải)
    // ============================================================
    const panel = this._getPanelRect();

    // Draw interface at display resolution, independently of world pixels.
    ctx = this.game.uiCtx || ctx;

    // Slate stone frame with wood border and brass corner studs
    UIHelper.drawPanel(ctx, {
      x: panel.x,
      y: panel.y,
      w: panel.w,
      h: panel.h,
      variant: 'gold',
    });

    // Logo / Title banner
    this._drawTitleBanner(ctx, panel.x + panel.w / 2, panel.y + 42);

    // Shortened menu action buttons
    const options = this._getOptions();
    const rects = this._getOptionRects(options);

    for (let i = 0; i < options.length; i++) {
      const opt = options[i];
      const r = rects[i];
      const isSel = i === this.selected;
      const isHov = i === this.hovered;
      const isPress = i === this.pressed;

      UIHelper.drawButton(ctx, {
        x: r.x,
        y: r.y,
        w: r.w,
        h: r.h,
        label: opt.label,
        icon: opt.icon,
        selected: isSel,
        hovered: isHov,
        pressed: isPress,
        variant: opt.variant,
      });
    }

    // Help Button
    const helpRect = this._getHelpBtnRect();
    const helpCheck = UIHelper.checkButton(helpRect, this.game.input);
    UIHelper.drawButton(ctx, {
      x: helpRect.x,
      y: helpRect.y,
      w: helpRect.w,
      h: helpRect.h,
      label: '[H] Hướng dẫn điều khiển',
      icon: 'gear',
      variant: 'subtle',
      hovered: helpCheck.hovered,
      pressed: helpCheck.pressed,
    });

    // Clean subtle footer shortcut
    ctx.fillStyle = '#94a3b8';
    ctx.font = `8px ${UI_FONT}`;
    ctx.textAlign = 'center';
    ctx.fillText('↑↓ Chọn  ·  Enter Xác nhận  ·  F Toàn màn hình', panel.x + panel.w / 2, panel.y + panel.h + 16, panel.w);

    // ============================================================
    // 5. MODAL HƯỚNG DẪN ĐIỀU KHIỂN (Khi mở)
    // ============================================================
    if (this.showHelpModal) {
      this._drawHelpModal(ctx);
    }
  }

  _drawTitleBanner(ctx, cx, cy) {
    ctx.save();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // 1. Main Title: "TÀN TRO MÙA GẶT" with pixel 3D relief shadow
    ctx.font = `900 22px ${UI_HEADING_FONT}`;

    // Deep cast shadow
    ctx.fillStyle = '#100604';
    ctx.fillText('TÀN TRO MÙA GẶT', cx + 1, cy + 2);
    ctx.fillText('TÀN TRO MÙA GẶT', cx + 2, cy + 3);

    // Amber-bronze rim bevel
    ctx.fillStyle = '#b45309';
    ctx.fillText('TÀN TRO MÙA GẶT', cx, cy + 1);

    // Vibrant golden face
    ctx.fillStyle = '#fbbf24';
    ctx.fillText('TÀN TRO MÙA GẶT', cx, cy);

    // 2. English Subtitle: "ASHEN HARVEST"
    ctx.font = `bold 10px ${UI_FONT}`;
    ctx.fillStyle = '#0a0808';
    ctx.fillText('ASHEN HARVEST', cx + 1, cy + 22);
    ctx.fillStyle = '#fde68a';
    ctx.fillText('ASHEN HARVEST', cx, cy + 21);

    // 3. Decorative pixel filigree line
    ctx.fillStyle = '#ca8a04';
    ctx.fillRect(cx - 60, cy + 33, 48, 1);
    ctx.fillRect(cx + 12, cy + 33, 48, 1);
    // Center diamond
    ctx.fillStyle = '#f59e0b';
    ctx.fillRect(cx - 2, cy + 32, 4, 3);
    ctx.fillRect(cx - 1, cy + 31, 2, 5);

    ctx.restore();
  }

  _drawVillageRoad(ctx) {
    ctx.save();
    // Trodden cart path from bottom left toward the village center
    ctx.fillStyle = '#4a3a2d';
    ctx.beginPath();
    ctx.moveTo(0, 275);
    ctx.bezierCurveTo(90, 260, 130, 230, 210, 225);
    ctx.bezierCurveTo(270, 220, 320, 240, 360, 270);
    ctx.lineTo(360, 315);
    ctx.bezierCurveTo(310, 275, 250, 255, 190, 258);
    ctx.bezierCurveTo(120, 265, 70, 295, 0, 320);
    ctx.closePath();
    ctx.fill();

    // Wheel ruts
    ctx.strokeStyle = 'rgba(28, 20, 16, 0.45)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, 288);
    ctx.bezierCurveTo(100, 270, 160, 240, 230, 238);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(0, 305);
    ctx.bezierCurveTo(90, 285, 170, 252, 245, 248);
    ctx.stroke();

    // Road pebble specks
    ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.fillRect(60, 280, 2, 1);
    ctx.fillRect(110, 265, 2, 1);
    ctx.fillRect(160, 248, 2, 1);
    ctx.fillRect(230, 242, 2, 1);
    ctx.restore();
  }

  _drawHarvestField(ctx, fx, fy, fw, fh) {
    ctx.save();
    // Furrow base
    ctx.fillStyle = '#261b14';
    ctx.fillRect(fx, fy, fw, fh);

    // Furrow lines & wheat stubble
    const cropsImg = this.game.assets.getImage('crops');
    if (cropsImg && cropsImg.complete) {
      for (let y = fy; y < fy + fh - 12; y += 14) {
        for (let x = fx; x < fx + fw - 16; x += 16) {
          ctx.drawImage(cropsImg, 32, 16, 16, 16, x, y, 16, 16);
        }
      }
    } else {
      // High detail fallback
      for (let y = fy + 2; y < fy + fh; y += 8) {
        ctx.fillStyle = '#1c130d';
        ctx.fillRect(fx, y, fw, 2);
        // Golden straw stubble
        ctx.fillStyle = '#a16207';
        for (let x = fx + 4; x < fx + fw - 4; x += 10) {
          ctx.fillRect(x, y - 3, 2, 4);
          ctx.fillRect(x + 3, y - 2, 1, 3);
        }
      }
    }

    // Border ditch
    ctx.strokeStyle = '#18110b';
    ctx.lineWidth = 1;
    ctx.strokeRect(fx, fy, fw, fh);
    ctx.restore();
  }

  _drawVillageHouse(ctx, hx, hy) {
    ctx.save();
    const houseImg = this.game.assets.getImage('house');
    if (houseImg && houseImg.complete && houseImg.width > 0) {
      // Cast drop shadow
      ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
      ctx.fillRect(hx + 4, hy + 64, 88, 8);
      // Draw rustic cottage from sheet
      ctx.drawImage(houseImg, 0, 0, 80, 80, hx, hy - 4, 88, 76);

      // Warm candle light through the cottage window!
      const windowX = hx + 52;
      const windowY = hy + 38;
      const glow = ctx.createRadialGradient(windowX, windowY, 1, windowX, windowY, 12);
      glow.addColorStop(0, 'rgba(253, 224, 71, 0.85)');
      glow.addColorStop(0.5, 'rgba(245, 158, 11, 0.35)');
      glow.addColorStop(1, 'rgba(245, 158, 11, 0)');
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(windowX, windowY, 12, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#fef08a';
      ctx.fillRect(windowX - 3, windowY - 4, 6, 8);
      return;
    }

    // Procedural pixel-art cottage fallback
    const pw = 86, ph = 64;
    // Ground shadow
    ctx.fillStyle = 'rgba(0,0,0,0.45)';
    ctx.fillRect(hx, hy + ph, pw, 6);

    // Thatched Roof
    ctx.fillStyle = '#5c3a21';
    ctx.beginPath();
    ctx.moveTo(hx + pw / 2, hy);
    ctx.lineTo(hx - 4, hy + 30);
    ctx.lineTo(hx + pw + 4, hy + 30);
    ctx.closePath();
    ctx.fill();

    // Thatch ridges
    ctx.fillStyle = '#784d2d';
    for (let r = 8; r < 28; r += 5) {
      ctx.fillRect(hx + r, hy + r, pw - r * 2, 2);
    }

    // Timber walls
    ctx.fillStyle = '#3f322b';
    ctx.fillRect(hx + 6, hy + 30, pw - 12, ph - 30);

    // Timber studs
    ctx.fillStyle = '#261c17';
    ctx.fillRect(hx + 6, hy + 30, 4, ph - 30);
    ctx.fillRect(hx + pw - 10, hy + 30, 4, ph - 30);
    ctx.fillRect(hx + 30, hy + 30, 4, ph - 30);

    // Doorway
    ctx.fillStyle = '#18120e';
    ctx.fillRect(hx + 14, hy + 40, 12, 24);

    // Stone chimney with subtle smoke
    ctx.fillStyle = '#2b262d';
    ctx.fillRect(hx + pw - 18, hy + 4, 10, 18);
    ctx.restore();
  }

  _drawMapleTrees(ctx) {
    ctx.save();
    const treeImg = this.game.assets.getImage('maple_tree');
    const trees = [
      { x: 18, y: 110, frame: 0, scale: 1.1 },
      { x: 118, y: 118, frame: 1, scale: 1.0 },
      { x: 260, y: 128, frame: 2, scale: 1.05 },
      { x: 340, y: 142, frame: 3, scale: 0.95 }
    ];

    trees.forEach((tr, i) => {
      // Wind sway offset (sinusoidal)
      const sway = Math.sin(this.animTime * 1.8 + i * 1.5) * 1.5;
      const tw = Math.floor(32 * tr.scale);
      const th = Math.floor(48 * tr.scale);
      const dx = Math.floor(tr.x + sway);
      const dy = Math.floor(tr.y);

      // Tree drop shadow
      ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
      ctx.beginPath();
      ctx.ellipse(tr.x + tw / 2, tr.y + th - 4, tw * 0.45, 6, 0, 0, Math.PI * 2);
      ctx.fill();

      if (treeImg && treeImg.complete && treeImg.width > 0) {
        const sx = (tr.frame % 5) * 32;
        ctx.drawImage(treeImg, sx, 0, 32, 48, dx, dy, tw, th);
      } else {
        // Fallback pixel tree
        ctx.fillStyle = '#3a2517';
        ctx.fillRect(dx + tw / 2 - 2, dy + 20, 5, th - 20);
        // Autumn canopy
        ctx.fillStyle = i % 2 === 0 ? '#b45309' : '#c2410c';
        ctx.beginPath();
        ctx.arc(dx + tw / 2, dy + 18, tw / 2, 0, Math.PI * 2);
        ctx.fill();
      }
    });
    ctx.restore();
  }

  _drawWoodenFences(ctx) {
    ctx.save();
    const fenceImg = this.game.assets.getImage('fence');

    // Horizontal fence line enclosing harvest field
    for (let x = 150; x <= 320; x += 16) {
      if (fenceImg && fenceImg.complete) {
        ctx.drawImage(fenceImg, 0, 0, 16, 16, x, 192, 16, 16);
      } else {
        ctx.fillStyle = '#453223';
        ctx.fillRect(x, 194, 16, 2);
        ctx.fillRect(x, 202, 16, 2);
        ctx.fillStyle = '#2d1f15';
        ctx.fillRect(x + 2, 190, 3, 16);
      }
    }
    ctx.restore();
  }

  _drawHarvestProps(ctx) {
    ctx.save();
    // Hay sheaves near the road
    const hayProps = [
      { x: 130, y: 248, w: 16, h: 12 },
      { x: 142, y: 252, w: 14, h: 10 },
      { x: 285, y: 242, w: 16, h: 12 }
    ];
    for (const h of hayProps) {
      ctx.fillStyle = 'rgba(0,0,0,0.35)';
      ctx.fillRect(h.x, h.y + h.h - 2, h.w, 4);

      ctx.fillStyle = '#ca8a04';
      ctx.fillRect(h.x, h.y, h.w, h.h);
      ctx.fillStyle = '#eab308';
      ctx.fillRect(h.x + 2, h.y + 2, h.w - 4, h.h - 4);
      // Hay binding rope
      ctx.fillStyle = '#713f12';
      ctx.fillRect(h.x + 5, h.y, 2, h.h);
      ctx.fillRect(h.x + h.w - 7, h.y, 2, h.h);
    }
    ctx.restore();
  }

  _drawBonfire(ctx, x, y) {
    ctx.save();

    // 1. Warm radial illumination on the earth
    const pulse = 1.0 + Math.sin(this.animTime * 12) * 0.08;
    const radius = 65 * pulse;
    const glow = ctx.createRadialGradient(x, y + 4, 3, x, y + 4, radius);
    glow.addColorStop(0, 'rgba(251, 146, 60, 0.42)');
    glow.addColorStop(0.4, 'rgba(234, 88, 12, 0.22)');
    glow.addColorStop(0.8, 'rgba(180, 83, 9, 0.08)');
    glow.addColorStop(1, 'rgba(180, 83, 9, 0)');

    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(x, y + 4, radius, 0, Math.PI * 2);
    ctx.fill();

    // 2. Hearth stones ring
    ctx.fillStyle = '#1c1619';
    ctx.fillRect(x - 12, y + 2, 24, 6);
    ctx.fillStyle = '#342a30';
    for (let sx = x - 10; sx <= x + 8; sx += 5) {
      ctx.fillRect(sx, y + 2, 4, 5);
    }

    // 3. Crossed firewood logs
    ctx.fillStyle = '#382216';
    ctx.fillRect(x - 9, y - 1, 18, 4);
    ctx.fillStyle = '#22150e';
    ctx.fillRect(x - 7, y - 3, 14, 3);

    // 4. Multi-layered pixel fire flame
    const fH = Math.floor(10 + Math.sin(this.animTime * 15) * 3);
    // Outer flame: crimson-orange
    ctx.fillStyle = '#ea580c';
    ctx.beginPath();
    ctx.moveTo(x - 6, y);
    ctx.lineTo(x, y - fH - 2);
    ctx.lineTo(x + 6, y);
    ctx.closePath();
    ctx.fill();

    // Mid flame: bright amber
    ctx.fillStyle = '#f59e0b';
    ctx.beginPath();
    ctx.moveTo(x - 4, y);
    ctx.lineTo(x, y - fH + 2);
    ctx.lineTo(x + 4, y);
    ctx.closePath();
    ctx.fill();

    // Flame core: white-hot yellow
    ctx.fillStyle = '#fef08a';
    ctx.beginPath();
    ctx.moveTo(x - 2, y);
    ctx.lineTo(x, y - fH + 6);
    ctx.lineTo(x + 2, y);
    ctx.closePath();
    ctx.fill();

    ctx.restore();
  }

  _drawGuardingSoldier(ctx, x, y) {
    ctx.save();
    const soldierImg = this.game.assets.getImage('soldier_idle');

    // Soldier drop shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
    ctx.beginPath();
    ctx.ellipse(x + 16, y + 28, 9, 3.5, 0, 0, Math.PI * 2);
    ctx.fill();

    if (soldierImg && soldierImg.complete) {
      // soldier_idle has 6 frames, each 100x100, character is centered at (34, 31, 40, 34)
      const frameX = this.soldierFrame * 100 + 34;
      const frameY = 31;
      ctx.drawImage(soldierImg, frameX, frameY, 40, 34, x, y, 32, 28);
    } else {
      // Fallback pixel soldier
      ctx.fillStyle = '#94a3b8';
      ctx.fillRect(x + 10, y + 6, 12, 16);
      ctx.fillStyle = '#3b82f6';
      ctx.fillRect(x + 6, y + 10, 6, 12);
    }
    ctx.restore();
  }

  _drawHelpModal(ctx) {
    const W = C.INTERNAL_W;
    const H = C.INTERNAL_H;
    ctx.save();

    // Dark backdrop overlay
    ctx.fillStyle = 'rgba(6, 8, 14, 0.88)';
    ctx.fillRect(0, 0, W, H);

    // Modal frame
    const mw = 420;
    const mh = 270;
    const mx = Math.floor((W - mw) / 2);
    const my = Math.floor((H - mh) / 2);

    UIHelper.drawPanel(ctx, {
      x: mx,
      y: my,
      w: mw,
      h: mh,
      title: 'HƯỚNG DẪN ĐIỀU KHIỂN & SINH TỒN',
      subtitle: 'Chiến thuật phòng ngự trong Tàn Tro Mùa Gặt',
      variant: 'gold',
    });

    const rows = [
      { key: 'W, A, S, D  /  Phím Mũi Tên', desc: 'Di chuyển chiến binh' },
      { key: 'Chuột Trái (Giữ hoặc Click)', desc: 'Tự động ngắm & tung đòn tấn công' },
      { key: 'Phím Space (Cách) / Nút Lướt', desc: 'Lướt né đòn (Bất tử trong 0.18 giây)' },
      { key: 'Phím Q  /  Nút Kỹ Năng', desc: 'Kích hoạt Tuyệt chiêu Di vật đặc biệt' },
      { key: 'Phím E', desc: 'Mở rương báu & bước qua Cổng phong ấn' },
      { key: 'Phím ESC  /  P', desc: 'Tạm dừng trận đánh & mở Thiết lập' },
      { key: 'Phím F', desc: 'Bật / Tắt chế độ Toàn màn hình' }
    ];

    let rowY = my + 54;
    for (const r of rows) {
      // Key badge box
      ctx.fillStyle = 'rgba(30, 41, 59, 0.85)';
      ctx.fillRect(mx + 20, rowY, 145, 18);
      ctx.strokeStyle = '#475569';
      ctx.lineWidth = 1;
      ctx.strokeRect(mx + 20.5, rowY + 0.5, 144, 17);

      ctx.fillStyle = '#fde047';
      ctx.font = `bold 9px ${UI_FONT}`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(r.key, mx + 20 + 72, rowY + 9);

      // Description text
      ctx.fillStyle = '#e2e8f0';
      ctx.font = `10px ${UI_FONT}`;
      ctx.textAlign = 'left';
      ctx.fillText(r.desc, mx + 175, rowY + 9);

      rowY += 23;
    }

    // Close button
    const closeBtn = { x: Math.floor(W / 2 - 60), y: my + mh - 36, w: 120, h: 26 };
    UIHelper.drawButton(ctx, {
      x: closeBtn.x,
      y: closeBtn.y,
      w: closeBtn.w,
      h: closeBtn.h,
      label: 'ĐÃ HIỂU [ESC]',
      variant: 'primary',
      hovered: this.helpCloseHover,
      pressed: this.helpClosePress,
    });

    ctx.restore();
  }
}
