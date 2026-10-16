// ============================================================
// HUD — heads-up display rendering with pixel-art aesthetic
// Uses monospace font for crisp small text. No emoji — pixel icons.
// ============================================================
import * as C from './Constants.js';
import { UI_FONT, UI_HEADING_FONT } from './UIHelper.js';
import { ARTIFACTS } from '../data/GameData.js';

// Pixel icon drawing helpers
const ICONS = {
  heart(ctx, x, y, s = 8) {
    ctx.fillStyle = '#e03030';
    // Simple pixel heart: 2 bumps + point
    ctx.fillRect(x + 1, y, 2, 1);
    ctx.fillRect(x + 4, y, 2, 1);
    ctx.fillRect(x, y + 1, 7, 1);
    ctx.fillRect(x, y + 2, 7, 1);
    ctx.fillRect(x + 1, y + 3, 5, 1);
    ctx.fillRect(x + 2, y + 4, 3, 1);
    ctx.fillRect(x + 3, y + 5, 1, 1);
  },
  coin(ctx, x, y) {
    ctx.fillStyle = '#ffd700';
    ctx.fillRect(x + 1, y, 4, 1);
    ctx.fillRect(x, y + 1, 6, 4);
    ctx.fillRect(x + 1, y + 5, 4, 1);
    ctx.fillStyle = '#cc9900';
    ctx.fillRect(x + 3, y + 1, 1, 4);
  },
  xpOrb(ctx, x, y) {
    ctx.fillStyle = '#44ddff';
    ctx.fillRect(x + 1, y, 3, 1);
    ctx.fillRect(x, y + 1, 5, 3);
    ctx.fillRect(x + 1, y + 4, 3, 1);
  },
  skull(ctx, x, y) {
    ctx.fillStyle = '#ff5555';
    ctx.fillRect(x + 1, y, 4, 1);
    ctx.fillRect(x, y + 1, 6, 3);
    ctx.fillRect(x + 1, y + 1, 1, 1);  // eye
    ctx.fillRect(x + 4, y + 1, 1, 1);  // eye
    ctx.fillStyle = '#000';
    ctx.fillRect(x + 1, y + 1, 1, 1);
    ctx.fillRect(x + 4, y + 1, 1, 1);
    ctx.fillStyle = '#ff5555';
    ctx.fillRect(x + 1, y + 4, 4, 1);
    ctx.fillRect(x + 2, y + 5, 2, 1);
  },
  clock(ctx, x, y) {
    ctx.fillStyle = '#f472b6';
    ctx.fillRect(x + 1, y, 3, 1);
    ctx.fillRect(x, y + 1, 5, 3);
    ctx.fillRect(x + 1, y + 4, 3, 1);
    ctx.fillStyle = '#fff';
    ctx.fillRect(x + 2, y + 1, 1, 2);
    ctx.fillRect(x + 3, y + 2, 1, 1);
  },
  sword(ctx, x, y) {
    ctx.fillStyle = '#ccc';
    ctx.fillRect(x + 3, y, 1, 4);
    ctx.fillRect(x + 1, y + 4, 5, 1);
    ctx.fillRect(x + 3, y + 5, 1, 2);
    ctx.fillStyle = '#8b6914';
    ctx.fillRect(x + 2, y + 5, 3, 1);
  },
  dash(ctx, x, y) {
    ctx.fillStyle = '#88ccff';
    ctx.fillRect(x, y + 1, 2, 1);
    ctx.fillRect(x + 1, y + 2, 3, 1);
    ctx.fillRect(x + 3, y + 3, 3, 1);
    ctx.fillRect(x + 5, y + 2, 2, 1);
  },
  bolt(ctx, x, y) {
    ctx.fillStyle = '#ffaa44';
    ctx.fillRect(x + 3, y, 2, 1);
    ctx.fillRect(x + 2, y + 1, 2, 1);
    ctx.fillRect(x + 1, y + 2, 3, 1);
    ctx.fillRect(x + 2, y + 3, 2, 1);
    ctx.fillRect(x + 3, y + 4, 2, 1);
  },
  dice(ctx, x, y) {
    ctx.fillStyle = '#67e8f9';
    ctx.fillRect(x, y, 5, 5);
    ctx.fillStyle = '#000';
    ctx.fillRect(x + 1, y + 1, 1, 1);
    ctx.fillRect(x + 3, y + 3, 1, 1);
  },
};

export class HUD {
  constructor(assets) {
    this.assets = assets;
  }

  getSkillButtonBounds() {
    const W = C.INTERNAL_W;
    const skillBoxW = 148;
    const skillX = Math.floor(W / 2 - skillBoxW - 4);
    const actionY = C.INTERNAL_H - 18;
    return { x: skillX, y: actionY, w: skillBoxW, h: 16 };
  }

  getDashButtonBounds() {
    const W = C.INTERNAL_W;
    const skillBoxW = 80;
    const dashX = Math.floor(W / 2 + 4);
    const actionY = C.INTERNAL_H - 18;
    return { x: dashX, y: actionY, w: skillBoxW, h: 16 };
  }

  getNextStageButtonBounds() {
    const W = C.INTERNAL_W;
    const btnW = 166;
    const btnX = Math.floor((W - btnW) / 2);
    const btnY = C.INTERNAL_H - 38;
    return { x: btnX, y: btnY, w: btnW, h: 18 };
  }

  getControlsGuideButtonBounds(isExpanded = false) {
    if (isExpanded) {
      return { x: 470, y: 236, w: 166, h: 100, toggleX: 620, toggleY: 238, toggleW: 14, toggleH: 14 };
    }
    return { x: 546, y: 338, w: 90, h: 18 };
  }

  isPointInHUD(x, y, player = null, controlsExpanded = false, objectiveComplete = false) {
    if (x == null || y == null) return false;
    const W = C.INTERNAL_W;
    const H = C.INTERNAL_H;

    // Next Stage button (when objective complete)
    if (objectiveComplete) {
      const nsb = this.getNextStageButtonBounds();
      if (x >= nsb.x && x <= nsb.x + nsb.w && y >= nsb.y && y <= nsb.y + nsb.h) return true;
    }

    // Top-left status card
    if (x >= 2 && x <= 2 + 155 && y >= 2 && y <= 2 + 44) return true;

    // Top-right objective card
    const oCardW = 195, oCardH = 38;
    const oCardX = W - oCardW - 3, oCardY = 3;
    if (x >= oCardX && x <= oCardX + oCardW && y >= oCardY && y <= oCardY + oCardH) return true;

    // Skill button
    const sb = this.getSkillButtonBounds();
    if (x >= sb.x && x <= sb.x + sb.w && y >= sb.y && y <= sb.y + sb.h) return true;

    // Dash button
    const db = this.getDashButtonBounds();
    if (x >= db.x && x <= db.x + db.w && y >= db.y && y <= db.y + db.h) return true;

    // Controls guide card / button
    const gb = this.getControlsGuideButtonBounds(controlsExpanded);
    if (x >= gb.x && x <= gb.x + gb.w && y >= gb.y && y <= gb.y + gb.h) return true;

    // Bottom-left item tray
    const itemCount = (player?.artifacts?.length || 0) + (player?.charms?.length || 0);
    if (itemCount > 0) {
      const trayW = itemCount * 24 + 4;
      if (x >= 4 && x <= 4 + trayW && y >= H - 28 && y <= H) return true;
    }

    return false;
  }

  drawCombatHUD(ctx, player, stageInfo, curseTime, mousePos = null, isMouseDown = false) {
    const W = C.INTERNAL_W;
    const H = C.INTERNAL_H;
    const FONT = UI_FONT;
    // ------------------------------------------------------------
    // 1. TOP-LEFT: High-Contrast Player Status Card
    // ------------------------------------------------------------
    const pCardX = 3, pCardY = 3, pCardW = 152, pCardH = 53;
    ctx.save();
    ctx.fillStyle = 'rgba(10, 12, 20, 0.94)';
    ctx.fillRect(pCardX, pCardY, pCardW, pCardH);
    ctx.strokeStyle = 'rgba(217, 119, 6, 0.55)';
    ctx.lineWidth = 1;
    ctx.strokeRect(pCardX + 0.5, pCardY + 0.5, pCardW - 1, pCardH - 1);

    // HP bar (Thanh HP dày dặn, dễ đọc)
    const hpBarX = pCardX + 13, hpBarY = pCardY + 5, hpBarW = 132, hpBarH = 10;
    ICONS.heart(ctx, pCardX + 3, pCardY + 7);
    this._drawBar(ctx, hpBarX, hpBarY, hpBarW, hpBarH, player.hp, player.maxHp, '#dc2626', '#1e0505', '#f87171');
    ctx.fillStyle = '#ffffff';
    ctx.font = `bold 8px ${FONT}`;
    ctx.textAlign = 'center';
    ctx.shadowColor = 'rgba(0, 0, 0, 0.9)';
    ctx.shadowBlur = 3;
    ctx.fillText(`${player.hp}/${player.maxHp}`, hpBarX + hpBarW / 2, hpBarY + 8);
    ctx.shadowBlur = 0;

    // XP bar
    const xpBarX = pCardX + 13, xpBarY = pCardY + 18, xpBarW = 92, xpBarH = 5;
    ICONS.xpOrb(ctx, pCardX + 4, pCardY + 18);
    this._drawBar(ctx, xpBarX, xpBarY, xpBarW, xpBarH, player.xp, player.xpToLevel, '#0284c7', '#081726', '#38bdf8');
    ctx.fillStyle = '#e0f2fe';
    ctx.font = `bold 7.5px ${FONT}`;
    ctx.textAlign = 'left';
    ctx.fillText(`Lv${player.level}`, xpBarX + xpBarW + 4, xpBarY + 5);

    // Gold & Rerolls
    ICONS.coin(ctx, pCardX + 5, pCardY + 28);
    ctx.fillStyle = '#fde047';
    ctx.font = `bold 8px ${FONT}`;
    ctx.textAlign = 'left';
    ctx.fillText(`${player.gold}`, pCardX + 14, pCardY + 35);

    let classStartX = pCardX + 46;
    if (player.rerolls > 0) {
      ICONS.dice(ctx, pCardX + 44, pCardY + 29);
      ctx.fillStyle = '#67e8f9';
      ctx.font = `bold 7.5px ${FONT}`;
      ctx.fillText(`x${player.rerolls}`, pCardX + 52, pCardY + 35);
      classStartX = pCardX + 74;
    }

    // Class Name & Skill Milestone Roadmap
    if (player.classDef) {
      const cls = player.classDef;
      ctx.fillStyle = cls.color || '#f59e0b';
      ctx.font = `bold 7.5px ${FONT}`;
      ctx.textAlign = 'left';
      ctx.fillText(cls.name, classStartX, pCardY + 35, pCardW - (classStartX - pCardX) - 6);

      let nextMilestone = null;
      if (player.level < 3) nextMilestone = 3;
      else if (player.level < 5) nextMilestone = 5;
      else if (player.level < 8) nextMilestone = 8;

      if (nextMilestone) {
        ctx.fillStyle = '#94a3b8';
        ctx.font = `6.5px ${FONT}`;
        const nameW = ctx.measureText(cls.name).width;
        ctx.fillText(`Kỹ năng: cấp ${nextMilestone}`, pCardX + 7, pCardY + 47);
      }
    }
    ctx.restore();

    // ------------------------------------------------------------
    // 2. TOP-RIGHT: Clear Stage Objective Card (Chữ to, tương phản cao)
    // ------------------------------------------------------------
    const oCardW = 195, oCardH = 38;
    const oCardX = W - oCardW - 3, oCardY = 3;
    ctx.save();
    ctx.fillStyle = 'rgba(10, 12, 20, 0.94)';
    ctx.fillRect(oCardX, oCardY, oCardW, oCardH);
    ctx.strokeStyle = 'rgba(217, 119, 6, 0.55)';
    ctx.lineWidth = 1;
    ctx.strokeRect(oCardX + 0.5, oCardY + 0.5, oCardW - 1, oCardH - 1);

    ctx.textAlign = 'right';
    if (stageInfo) {
      ctx.fillStyle = '#fde047';
      ctx.font = `bold 8.5px ${FONT}`;
      ctx.shadowColor = 'rgba(0, 0, 0, 0.9)';
      ctx.shadowBlur = 2;
      ctx.fillText(`VIỆC CẦN LÀM (Màn ${stageInfo.stageNum || '?'}/12)`, oCardX + oCardW - 6, oCardY + 12);
      ctx.fillStyle = '#ffffff';
      ctx.font = `bold 8px ${FONT}`;
      ctx.fillText(stageInfo.objective || '', oCardX + oCardW - 6, oCardY + 25);
      ctx.shadowBlur = 0;
    }

    // Curse timer (inline with objective card)
    if (curseTime >= 0) {
      const mins = Math.floor(curseTime / 60);
      const secs = String(Math.floor(curseTime % 60)).padStart(2, '0');
      ICONS.clock(ctx, oCardX + 6, oCardY + 22);
      ctx.fillStyle = '#f472b6';
      ctx.font = `bold 8px ${FONT}`;
      ctx.textAlign = 'left';
      ctx.fillText(`${mins}:${secs}`, oCardX + 15, oCardY + 29);
    }
    ctx.restore();

    // ------------------------------------------------------------
    // 3. BOTTOM-CENTER: Actions & Cooldowns (Clickable with hover & press)
    // ------------------------------------------------------------
    const dashReady = player.dashCdTimer <= 0;
    const skillReady = (player.skillCd || 0) <= 0;
    const skillBounds = this.getSkillButtonBounds();
    const dashBounds = this.getDashButtonBounds();

    // Next Stage Prompt / Button (When Objective Completed)
    if (stageInfo?.objectiveComplete) {
      const nsb = this.getNextStageButtonBounds();
      const isHoverNext = mousePos && mousePos.x >= nsb.x && mousePos.x <= nsb.x + nsb.w &&
                          mousePos.y >= nsb.y && mousePos.y <= nsb.y + nsb.h;
      const nextPressed = isHoverNext && isMouseDown;
      const off = nextPressed ? 1 : 0;
      ctx.fillStyle = isHoverNext ? 'rgba(34, 197, 94, 0.95)' : 'rgba(21, 128, 61, 0.88)';
      ctx.fillRect(nsb.x + off, nsb.y + off, nsb.w, nsb.h);
      ctx.strokeStyle = '#fef08a';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(nsb.x + off + 0.5, nsb.y + off + 0.5, nsb.w - 1, nsb.h - 1);
      ctx.fillStyle = '#ffffff';
      ctx.font = `bold 8px ${FONT}`;
      ctx.textAlign = 'center';
      ctx.fillText('▶ MÀN TIẾP THEO (Enter / Click) ◀', nsb.x + nsb.w / 2 + off, nsb.y + 12 + off);
    }

    const isHoverSkill = mousePos && mousePos.x >= skillBounds.x && mousePos.x <= skillBounds.x + skillBounds.w &&
                         mousePos.y >= skillBounds.y && mousePos.y <= skillBounds.y + skillBounds.h;
    const isHoverDash = mousePos && mousePos.x >= dashBounds.x && mousePos.x <= dashBounds.x + dashBounds.w &&
                        mousePos.y >= dashBounds.y && mousePos.y <= dashBounds.y + dashBounds.h;

    const skillPressed = isHoverSkill && isMouseDown;
    const dashPressed = isHoverDash && isMouseDown;

    // Skill [Q]
    const sOff = skillPressed ? 1 : 0;
    const sx = skillBounds.x + sOff;
    const sy = skillBounds.y + sOff;
    ctx.fillStyle = skillReady
      ? (isHoverSkill ? 'rgba(234, 88, 12, 0.75)' : 'rgba(217, 119, 6, 0.55)')
      : 'rgba(20, 20, 30, 0.88)';
    ctx.fillRect(sx, sy, skillBounds.w, skillBounds.h);
    ctx.strokeStyle = skillReady
      ? (isHoverSkill ? '#fde047' : '#f59e0b')
      : (isHoverSkill ? '#6b7280' : '#4b5563');
    ctx.lineWidth = 1;
    ctx.strokeRect(sx + 0.5, sy + 0.5, skillBounds.w - 1, skillBounds.h - 1);

    // Prioritize player's class active skill name!
    const firstArt = player?.artifacts?.[0];
    const artDef = firstArt ? ARTIFACTS[firstArt.id] : null;
    const skillName = player?.classActiveSkill?.name || artDef?.skill?.name || 'Chiến Hống';

    ICONS.bolt(ctx, sx + 4, sy + 3);
    ctx.textAlign = 'center';
    ctx.fillStyle = skillReady ? '#ffffff' : '#9ca3af';
    ctx.font = `bold 7.5px ${FONT}`;
    ctx.fillText(skillReady ? `[Q] ${skillName}` : `${skillName}: ${player.skillCd.toFixed(1)}s`, sx + skillBounds.w / 2 + 2, sy + 11, skillBounds.w - 18);

    // Dash [Space]
    const dOff = dashPressed ? 1 : 0;
    const dx = dashBounds.x + dOff;
    const dy = dashBounds.y + dOff;
    ctx.fillStyle = dashReady
      ? (isHoverDash ? 'rgba(14, 165, 233, 0.75)' : 'rgba(2, 132, 199, 0.55)')
      : 'rgba(20, 20, 30, 0.88)';
    ctx.fillRect(dx, dy, dashBounds.w, dashBounds.h);
    ctx.strokeStyle = dashReady
      ? (isHoverDash ? '#bae6fd' : '#38bdf8')
      : (isHoverDash ? '#6b7280' : '#4b5563');
    ctx.lineWidth = 1;
    ctx.strokeRect(dx + 0.5, dy + 0.5, dashBounds.w - 1, dashBounds.h - 1);
    ICONS.dash(ctx, dx + 4, dy + 3);
    ctx.fillStyle = dashReady ? '#ffffff' : '#9ca3af';
    ctx.font = `bold 8px ${FONT}`;
    ctx.fillText(dashReady ? '[SPC] LƯỚT' : `Lướt: ${player.dashCdTimer.toFixed(1)}s`, dx + dashBounds.w / 2 + 2, dy + 11);

    // ------------------------------------------------------------
    // 4. BOTTOM-LEFT: Artifacts & Charms tray
    // ------------------------------------------------------------
    ctx.textAlign = 'left';
    let itemX = 4;
    const itemY = C.INTERNAL_H - 28;

    for (const art of player.artifacts) {
      ctx.fillStyle = 'rgba(10, 12, 22, 0.88)';
      ctx.fillRect(itemX, itemY, 20, 20);
      ctx.strokeStyle = '#a08530';
      ctx.lineWidth = 1;
      ctx.strokeRect(itemX + 0.5, itemY + 0.5, 19, 19);

      const icon = this.assets.getImage(art.id);
      if (icon) {
        ctx.drawImage(icon, itemX + 2, itemY + 2, 16, 16);
      } else {
        ctx.fillStyle = '#554433';
        ctx.fillRect(itemX + 2, itemY + 2, 16, 16);
      }

      // Level pill
      ctx.fillStyle = '#1a1a2a';
      ctx.fillRect(itemX + 12, itemY - 2, 10, 7);
      ctx.fillStyle = '#fef08a';
      ctx.font = `bold 6px ${FONT}`;
      ctx.textAlign = 'center';
      ctx.fillText(`${art.level}`, itemX + 17, itemY + 4);
      ctx.textAlign = 'left';

      itemX += 24;
    }

    for (const ch of player.charms) {
      ctx.fillStyle = 'rgba(10, 12, 22, 0.88)';
      ctx.fillRect(itemX, itemY, 20, 20);
      ctx.strokeStyle = '#4080d0';
      ctx.lineWidth = 1;
      ctx.strokeRect(itemX + 0.5, itemY + 0.5, 19, 19);

      const icon = this.assets.getImage(ch.id);
      if (icon) {
        ctx.drawImage(icon, itemX + 2, itemY + 2, 16, 16);
      } else {
        ctx.fillStyle = '#223344';
        ctx.fillRect(itemX + 2, itemY + 2, 16, 16);
      }

      ctx.fillStyle = '#1a1a2a';
      ctx.fillRect(itemX + 12, itemY - 2, 10, 7);
      ctx.fillStyle = '#88bbff';
      ctx.font = `bold 6px ${FONT}`;
      ctx.textAlign = 'center';
      ctx.fillText(`${ch.level}`, itemX + 17, itemY + 4);
      ctx.textAlign = 'left';

      itemX += 24;
    }
  }

  drawBossHUD(ctx, boss) {
    if (!boss || boss.isDead) return;
    const W = C.INTERNAL_W;
    const FONT = "'JetBrains Mono', monospace";
    const barW = 240;
    const barH = 11;
    const barX = (W - barW) / 2;
    const barY = 8;

    // Background container
    ctx.save();
    ctx.fillStyle = 'rgba(10, 8, 16, 0.95)';
    ctx.fillRect(barX - 8, barY - 4, barW + 16, barH + 20);
    ctx.strokeStyle = '#dc2626';
    ctx.lineWidth = 1.2;
    ctx.strokeRect(barX - 7.5, barY - 3.5, barW + 15, barH + 19);

    // Boss Name
    ICONS.skull(ctx, barX - 2, barY + 1);
    ctx.fillStyle = '#ef4444';
    ctx.font = `bold 9.5px ${FONT}`;
    ctx.textAlign = 'center';
    ctx.shadowColor = 'rgba(0, 0, 0, 0.9)';
    ctx.shadowBlur = 2;
    ctx.fillText(boss.def.name.toUpperCase(), W / 2, barY + 8);

    // Boss HP bar
    this._drawBar(ctx, barX, barY + 11, barW, barH, boss.hp, boss.maxHp, '#dc2626', '#2a0510', '#f87171');

    ctx.fillStyle = '#ffffff';
    ctx.font = `bold 8px ${FONT}`;
    ctx.textAlign = 'center';
    ctx.fillText(`${boss.hp}/${boss.maxHp}`, W / 2, barY + 19);

    ctx.textAlign = 'left';
    ctx.restore();
  }

  _drawBar(ctx, x, y, w, h, current, max, color, bgColor, highlightColor) {
    ctx.fillStyle = bgColor;
    ctx.fillRect(x, y, w, h);

    const pct = Math.max(0, Math.min(1, current / max));
    const fillW = Math.floor(w * pct);
    if (fillW > 0) {
      ctx.fillStyle = color;
      ctx.fillRect(x, y, fillW, h);
      if (highlightColor) {
        ctx.fillStyle = highlightColor;
        ctx.fillRect(x, y, fillW, 1);
      }
    }

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.lineWidth = 1;
    ctx.strokeRect(x, y, w, h);
  }

  /** Render in-game quick controls guide panel (Expanded card or Collapsed button) */
  drawControlsGuide(ctx, options = {}) {
    const { isExpanded = false, isTouch = false, mousePos = null, isMouseDown = false } = options;
    const FONT = UI_FONT;

    if (!isExpanded) {
      // Collapsed Pill Button in bottom-right corner
      const btn = this.getControlsGuideButtonBounds(false);
      const isHover = mousePos && mousePos.x >= btn.x && mousePos.x <= btn.x + btn.w &&
                                mousePos.y >= btn.y && mousePos.y <= btn.y + btn.h;
      const isPress = isHover && isMouseDown;
      const ox = isPress ? 1 : 0;
      const oy = isPress ? 1 : 0;

      ctx.save();
      ctx.fillStyle = isHover ? 'rgba(30, 41, 59, 0.96)' : 'rgba(15, 23, 42, 0.92)';
      ctx.fillRect(btn.x + ox, btn.y + oy, btn.w, btn.h);
      ctx.strokeStyle = isHover ? '#f59e0b' : 'rgba(245, 158, 11, 0.5)';
      ctx.lineWidth = 1;
      ctx.strokeRect(btn.x + ox + 0.5, btn.y + oy + 0.5, btn.w - 1, btn.h - 1);

      ctx.fillStyle = isHover ? '#fef08a' : '#f1f5f9';
      ctx.font = `bold 7.5px ${FONT}`;
      ctx.textAlign = 'center';
      ctx.fillText(isTouch ? '🎮 ĐIỀU KHIỂN' : '[H] ? ĐIỀU KHIỂN', btn.x + ox + btn.w / 2, btn.y + oy + 12);
      ctx.restore();
      return;
    }

    // Expanded Controls Card in bottom-right corner
    const card = this.getControlsGuideButtonBounds(true);
    ctx.save();
    // Backdrop
    ctx.fillStyle = 'rgba(10, 14, 26, 0.95)';
    ctx.fillRect(card.x, card.y, card.w, card.h);
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 1.2;
    ctx.strokeRect(card.x + 0.5, card.y + 0.5, card.w - 1, card.h - 1);

    // Decorative corner markers
    ctx.fillStyle = '#f59e0b';
    ctx.fillRect(card.x - 1, card.y - 1, 3, 3);
    ctx.fillRect(card.x + card.w - 2, card.y - 1, 3, 3);
    ctx.fillRect(card.x - 1, card.y + card.h - 2, 3, 3);
    ctx.fillRect(card.x + card.w - 2, card.y + card.h - 2, 3, 3);

    // Header
    ctx.fillStyle = '#f59e0b';
    ctx.font = `bold 8px ${FONT}`;
    ctx.textAlign = 'left';
    ctx.fillText('HƯỚNG DẪN ĐIỀU KHIỂN', card.x + 8, card.y + 13);

    // Close button [x]
    const hoverClose = mousePos && mousePos.x >= card.toggleX && mousePos.x <= card.toggleX + card.toggleW &&
                                  mousePos.y >= card.toggleY && mousePos.y <= card.toggleY + card.toggleH;
    ctx.fillStyle = hoverClose ? '#f87171' : '#94a3b8';
    ctx.font = `bold 9px ${FONT}`;
    ctx.textAlign = 'center';
    ctx.fillText('✕', card.toggleX + card.toggleW / 2, card.toggleY + 10);

    // Control rows
    const rows = isTouch ? [
      { key: 'Cần gạt (trái)', desc: 'Di chuyển tự do' },
      { key: 'Nút CHÉM',      desc: 'Đánh liên tục' },
      { key: 'Nút LƯỚT',      desc: 'Lướt né chiêu' },
      { key: 'Nút PHÉP',      desc: 'Dùng kỹ năng [Q]' },
      { key: 'Nút DÙNG',      desc: 'Tương tác [E]' },
    ] : [
      { key: 'WASD / ↑↓←→', desc: 'Di chuyển' },
      { key: 'Chuột trái / J', desc: 'Đánh liên tục' },
      { key: 'Space',       desc: 'Lướt né đòn' },
      { key: 'Q',           desc: 'Kỹ năng vũ khí' },
      { key: 'E / Esc',     desc: 'Tương tác / Dừng' },
    ];

    let rowY = card.y + 26;
    ctx.textAlign = 'left';
    for (const r of rows) {
      // Key tag
      ctx.fillStyle = '#38bdf8';
      ctx.font = `bold 7px ${FONT}`;
      ctx.fillText(r.key, card.x + 8, rowY);

      // Description
      ctx.fillStyle = '#e2e8f0';
      ctx.font = `7px ${FONT}`;
      ctx.fillText(`: ${r.desc}`, card.x + 72, rowY);

      rowY += 12;
    }

    // Footer hint
    ctx.fillStyle = '#64748b';
    ctx.font = `6.5px ${FONT}`;
    ctx.textAlign = 'center';
    ctx.fillText(isTouch ? 'Chạm ✕ để thu nhỏ' : 'Phím [H] để ẩn/hiện bảng', card.x + card.w / 2, card.y + card.h - 5);

    ctx.restore();
  }
}
