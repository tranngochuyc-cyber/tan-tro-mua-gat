// ============================================================
// UpgradeScene — 3-card level-up selection modal
// Strict (X, Y) bounds check on mouse click, no accidental clicks outside,
// Before/After stat previews, tactical reasons, and crisp pixel icons.
// ============================================================
import * as C from '../engine/Constants.js';
import { UPGRADES, ARTIFACTS, CHARMS } from '../data/GameData.js';
import { getClassUpgrades } from '../data/ClassData.js';
import { PixelIcons } from '../engine/PixelIcons.js';
import { UIHelper, UI_FONT, UI_HEADING_FONT } from '../engine/UIHelper.js';

export class UpgradeScene {
  constructor(game) {
    this.game = game;
    this.active = false;
    this.choices = [];
    this.selected = 0;
    this.canReroll = false;
    this.hoveredCard = -1;
    this.pressedCard = -1;
    this.hoveredReroll = false;
    this.pressedReroll = false;
    this.classSkillMode = false; // true when showing class skill choices
    this.classSkillChoice = null;
  }

  /** Alias for `choices` for external inspection */
  get options() {
    return this.choices;
  }

  /** Alias for _applyChoice — accepts an option object from `options` or an index */
  _selectCard(optionOrIndex) {
    if (typeof optionOrIndex === 'number') {
      this._applyChoice(optionOrIndex);
    } else {
      const idx = this.choices.indexOf(optionOrIndex);
      this._applyChoice(idx >= 0 ? idx : 0);
    }
  }

  show(player) {
    this.active = true;
    this.classSkillMode = false;
    this.classSkillChoice = null;
    this.choices = this._rollChoices(player);
    this.selected = 0;
    this.canReroll = (player.rerolls || 0) > 0;
    this.hoveredCard = -1;
    this.hoveredReroll = false;
  }

  /** Show class skill choice (2 options) */
  showClassSkillChoice(player, classChoice) {
    this.active = true;
    this.classSkillMode = true;
    this.classSkillChoice = classChoice;
    this.choices = classChoice.options.map(opt => ({
      type: 'class_skill',
      data: opt,
    }));
    this.selected = 0;
    this.canReroll = false;
    this.hoveredCard = -1;
    this.hoveredReroll = false;
  }

  _rollChoices(player) {
    const pool = [];

    // 1. Available evolutions first (high priority)
    // Evolution condition: artifact reached required level, has required charm, and after boss
    const bossDefeated = Boolean(
      (this.game?.meta?.unlocks?.bossLog && this.game.meta.unlocks.bossLog.length > 0) ||
      (this.game?.runState && this.game.runState.currentStage >= 3) ||
      (this.game?.combatScene?.boss?._deathProcessed)
    );

    for (const art of player.artifacts) {
      const def = ARTIFACTS[art.id];
      if (def?.evolution && art.level >= (def.evolution.requiredLevel || 3)) {
        const reqCharm = def.evolution.requires;
        const charm = player.charms.find(c => c.id === reqCharm);
        const reqCharmLevel = def.evolution.requiredCharmLevel || 1;
        if (charm && charm.level >= reqCharmLevel && bossDefeated) {
          const evoResultId = def.evolution.result || def.evolution.evolvesTo;
          const evoDef = ARTIFACTS[evoResultId];
          if (evoDef && !player.artifacts.some(a => a.id === evoResultId)) {
            pool.push({
              type: 'evolution',
              data: evoDef,
              replacesId: art.id,
            });
          }
        }
      }
    }

    // 2. Existing artifact upgrades (level < 5)
    for (const art of player.artifacts) {
      const def = ARTIFACTS[art.id];
      if (def && art.level < (def.maxLevel || 5)) {
        pool.push({
          type: 'artifact_up',
          data: { ...def, currentLevel: art.level },
        });
      }
    }

    // 3. Existing charm upgrades (level < 5)
    for (const ch of player.charms) {
      const def = CHARMS[ch.id];
      if (def && ch.level < (def.maxLevel || 5)) {
        pool.push({
          type: 'charm_up',
          data: { ...def, currentLevel: ch.level },
        });
      }
    }

    // 4. New artifacts if slot available (respect meta unlock status)
    if (player.artifacts.length < player.maxArtifacts) {
      const unlocked = this.game?.meta?.unlocks?.artifacts || ['fire_staff'];
      for (const [id, def] of Object.entries(ARTIFACTS)) {
        if (def.evolved) continue;
        if (!unlocked.includes(id)) continue;
        if (!player.artifacts.some(a => a.id === id)) {
          pool.push({ type: 'new_artifact', data: def });
        }
      }
    }

    // 5. New charms if slot available
    if (player.charms.length < player.maxCharms) {
      for (const [id, def] of Object.entries(CHARMS)) {
        if (!player.charms.some(c => c.id === id)) {
          pool.push({ type: 'new_charm', data: def });
        }
      }
    }

    // 6. Tailored class upgrades (provides distinct build paths per class)
    const classUps = getClassUpgrades(player.classId);
    if (classUps && classUps.length > 0) {
      for (const up of classUps) {
        pool.push({ type: 'class_upgrade', data: up });
      }
    }

    // 7. General stat upgrades (always available fallback)
    for (const up of UPGRADES) {
      pool.push({ type: 'upgrade', data: up });
    }

    // Shuffle and pick 3
    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [pool[i], pool[j]] = [pool[j], pool[i]];
    }
    return pool.slice(0, 3);
  }

  _getCardLayout() {
    const W = C.INTERNAL_W;
    const numCards = Math.max(1, this.choices.length);
    const cardW = numCards === 2 ? 160 : 140;
    const cardH = 180;
    const gap = numCards === 2 ? 24 : 16;
    const totalW = numCards * cardW + (numCards - 1) * gap;
    const startX = (W - totalW) / 2;
    const startY = 70;
    const rects = [];
    for (let i = 0; i < numCards; i++) {
      rects.push({
        x: startX + i * (cardW + gap),
        y: startY,
        w: cardW,
        h: cardH,
      });
    }
    const rerollRect = {
      x: W / 2 - 80,
      y: startY + cardH + 14,
      w: 160,
      h: 24,
    };
    return { rects, rerollRect };
  }

  update(dt, input) {
    if (!this.active) return;
    const { rects, rerollRect } = this._getCardLayout();

    // Check card interaction
    this.hoveredCard = -1;
    this.pressedCard = -1;
    for (let i = 0; i < this.choices.length; i++) {
      const check = UIHelper.checkButton(rects[i], input);
      if (check.hovered) {
        this.hoveredCard = i;
        this.selected = i;
      }
      if (check.pressed) {
        this.pressedCard = i;
      }
      if (check.clicked) {
        this._applyChoice(i);
        return;
      }
    }

    // Check reroll interaction
    const rerollCheck = UIHelper.checkButton(rerollRect, input);
    this.hoveredReroll = rerollCheck.hovered;
    this.pressedReroll = rerollCheck.pressed;
    if (rerollCheck.clicked && this.canReroll) {
      this._doReroll();
      return;
    }

    // Keyboard selection
    if (input.justPressed('Digit1') && this.choices.length > 0) this.selected = 0;
    if (input.justPressed('Digit2') && this.choices.length > 1) this.selected = 1;
    if (input.justPressed('Digit3') && this.choices.length > 2) this.selected = 2;
    if (input.justPressed('ArrowLeft') || input.justPressed('KeyA')) {
      this.selected = (this.selected + this.choices.length - 1) % this.choices.length;
    }
    if (input.justPressed('ArrowRight') || input.justPressed('KeyD')) {
      this.selected = (this.selected + 1) % this.choices.length;
    }

    // Keyboard confirm
    if (input.justPressed('Enter') || input.justPressed('Space')) {
      this._applyChoice(this.selected);
      return;
    }

    // Keyboard Reroll
    if (input.justPressed('KeyR') && this.canReroll) {
      this._doReroll();
    }
  }

  _doReroll() {
    const player = this.game.runState.player;
    if (!player || player.rerolls <= 0) return;
    player.rerolls--;
    this.choices = this._rollChoices(player);
    this.canReroll = player.rerolls > 0;
    this.selected = 0;
    this.game.audio.playSfx('gate');
  }

  _applyChoice(index) {
    if (index < 0 || index >= this.choices.length) return;
    const choice = this.choices[index];
    const player = this.game.runState.player;
    this.game.audio.playSfx('levelup');

    switch (choice.type) {
      case 'upgrade':
      case 'class_upgrade':
        player.applyUpgrade(choice.data);
        break;
      case 'artifact_up': {
        const art = player.artifacts.find(a => a.id === choice.data.id);
        if (art) art.level = Math.min(art.level + 1, choice.data.maxLevel);
        break;
      }
      case 'charm_up': {
        const ch = player.charms.find(c => c.id === choice.data.id);
        if (ch) ch.level = Math.min(ch.level + 1, choice.data.maxLevel);
        break;
      }
      case 'new_artifact':
        player.artifacts.push({ id: choice.data.id, level: 1 });
        break;
      case 'new_charm':
        player.charms.push({ id: choice.data.id, level: 1 });
        break;
      case 'evolution': {
        const idx = player.artifacts.findIndex(a => a.id === choice.replacesId);
        if (idx >= 0) {
          player.artifacts[idx] = { id: choice.data.id, level: 1 };
        }
        break;
      }
      case 'class_skill':
        player.applyClassSkill(choice.data.id);
        break;
    }
    player.recalcStats();
    this.active = false;
    this.game.resumeFromUpgrade();
  }

  /** Get before/after stats and strategic reason */
  _getChoiceDetails(c, player) {
    let statPreview = '';
    let reason = '';

    if (c.type === 'upgrade') {
      const up = c.data;
      switch (up.id) {
        case 'max_hp':
          statPreview = `HP: ${player.maxHp} → ${player.maxHp + 10}`;
          reason = 'Tăng sức chống chịu';
          break;
        case 'damage':
          statPreview = `Sát thương: ${player.baseDmg} → ${player.baseDmg + 3}`;
          reason = 'Hạ gục quái nhanh hơn';
          break;
        case 'attack_speed':
          statPreview = `Hồi đòn: ${player.attackCd.toFixed(2)}s → ${(player.attackCd - 0.05).toFixed(2)}s`;
          reason = 'Vung kiếm dồn dập';
          break;
        case 'move_speed':
          statPreview = `Tốc chạy: ${player.moveSpeed} → ${player.moveSpeed + 8}`;
          reason = 'Cơ động né chiêu quái';
          break;
        case 'crit_chance':
          statPreview = `Chí mạng: ${(player.critChance * 100).toFixed(0)}% → ${((player.critChance + 0.05) * 100).toFixed(0)}%`;
          reason = 'Tăng tần suất đòn bộc phát';
          break;
        case 'crit_mult':
          statPreview = `Hệ số chí: ${player.critMult.toFixed(1)}x → ${(player.critMult + 0.2).toFixed(1)}x`;
          reason = 'Đòn chí mạng cực mạnh';
          break;
        case 'dash_cd':
          statPreview = `Hồi lướt: ${player.dashCd.toFixed(1)}s → ${(player.dashCd - 0.3).toFixed(1)}s`;
          reason = 'Lướt né đòn thường xuyên';
          break;
        case 'pickup_range':
          statPreview = `Hút XP: ${player.pickupRange} → ${player.pickupRange + 15}`;
          reason = 'Thu thập tài nguyên từ xa';
          break;
        case 'regen':
          statPreview = `Hồi: ${player.regen} HP/3s → ${player.regen + 1} HP/3s`;
          reason = 'Hồi phục sinh mệnh lâu dài';
          break;
        case 'armor':
          statPreview = `Giáp: ${player.armor} → ${player.armor + 1}`;
          reason = 'Giảm sát thương mỗi đòn nhận';
          break;
        case 'heal_now':
          statPreview = `Hồi phục: +${Math.floor(player.maxHp * 0.25)} HP ngay`;
          reason = 'Cấp cứu sinh lực nguy cấp';
          break;
        case 'xp_mult':
          statPreview = `XP: +${((player.xpMult - 1) * 100).toFixed(0)}% → +${((player.xpMult - 0.9) * 100).toFixed(0)}%`;
          reason = 'Thăng cấp nhanh hơn';
          break;
        default:
          statPreview = up.desc;
          reason = 'Tăng cường thuộc tính';
      }
    } else if (c.type === 'artifact_up') {
      const curLvl = c.data.currentLevel;
      const cur = c.data.stats?.[curLvl - 1];
      const next = c.data.stats?.[curLvl];
      if (cur && next) {
        if (next.dmg !== undefined && next.dmg !== cur.dmg) {
          statPreview = `Sát thương: ${cur.dmg} → ${next.dmg}`;
        } else if (next.count !== undefined && next.count !== cur.count) {
          statPreview = `Số đạn: ${cur.count} → ${next.count}`;
        } else if (next.cd !== undefined && next.cd !== cur.cd) {
          statPreview = `Hồi đòn: ${cur.cd}s → ${next.cd}s`;
        } else if (next.burnDmg !== undefined && next.burnDmg !== cur.burnDmg) {
          statPreview = `Thiêu đốt: ${cur.burnDmg}/s → ${next.burnDmg}/s`;
        } else {
          statPreview = `Cấp độ: Lv${curLvl} → Lv${curLvl + 1}`;
        }
      } else {
        statPreview = `Cấp độ: Lv${curLvl} → Lv${curLvl + 1}`;
      }
      reason = 'Tăng uy lực đòn phép thực chiến';
    } else if (c.type === 'charm_up') {
      const curLvl = c.data.currentLevel;
      const cur = c.data.stats?.[curLvl - 1];
      const next = c.data.stats?.[curLvl];
      if (cur && next) {
        if (next.cdReduction !== undefined) {
          statPreview = `Giảm hồi: ${Math.round(cur.cdReduction * 100)}% → ${Math.round(next.cdReduction * 100)}%`;
        } else if (next.spellDmgMult !== undefined) {
          statPreview = `Sát thương phép: +${Math.round((cur.spellDmgMult - 1) * 100)}% → +${Math.round((next.spellDmgMult - 1) * 100)}%`;
        } else if (next.attackSpeedMult !== undefined) {
          statPreview = `Tốc đánh: +${Math.round((cur.attackSpeedMult - 1) * 100)}% → +${Math.round((next.attackSpeedMult - 1) * 100)}%`;
        } else if (next.aoeRadiusMult !== undefined) {
          statPreview = `Phạm vi: +${Math.round((cur.aoeRadiusMult - 1) * 100)}% → +${Math.round((next.aoeRadiusMult - 1) * 100)}%`;
        } else if (next.lifestealBonus !== undefined) {
          statPreview = `Hút máu: ${Math.round(cur.lifestealBonus * 100)}% → ${Math.round(next.lifestealBonus * 100)}%`;
        } else {
          statPreview = `Cấp độ: Lv${curLvl} → Lv${curLvl + 1}`;
        }
      } else {
        statPreview = `Cấp độ: Lv${curLvl} → Lv${curLvl + 1}`;
      }
      reason = 'Cường hóa hiệu lực bùa hỗ trợ';
    } else if (c.type === 'new_artifact') {
      statPreview = 'Nhận pháp bảo chiến đấu mới';
      reason = 'Mở thêm loại đòn tấn công';
    } else if (c.type === 'new_charm') {
      statPreview = 'Kích hoạt bùa hỗ trợ nội tại';
      reason = 'Củng cố năng lực sinh tồn';
    } else if (c.type === 'evolution') {
      statPreview = 'Đột phá thần khí tối thượng!';
      reason = 'Biến hóa vũ khí thành dạng thần thoại';
    } else if (c.type === 'class_upgrade') {
      const up = c.data;
      const sc = up.statChanges || {};
      const parts = [];
      if (sc.armor) parts.push(`Giáp: ${player.armor} → ${player.armor + sc.armor}`);
      if (sc.maxHp) parts.push(`HP: ${player.maxHp} → ${player.maxHp + sc.maxHp}`);
      if (sc.baseDmg) parts.push(`Sát thương: ${player.baseDmg} → ${player.baseDmg + sc.baseDmg}`);
      if (sc.moveSpeed) parts.push(`Tốc chạy: ${player.moveSpeed} → ${player.moveSpeed + sc.moveSpeed}`);
      if (sc.critChance) parts.push(`Chí mạng: ${(player.critChance * 100).toFixed(0)}% → ${((player.critChance + sc.critChance) * 100).toFixed(0)}%`);
      if (sc.attackCd) parts.push(`Hồi đòn: ${player.attackCd.toFixed(2)}s → ${(player.attackCd + sc.attackCd).toFixed(2)}s`);
      statPreview = parts.length > 0 ? parts.join(' | ') : (up.desc || 'Tăng cường thuộc tính');
      reason = up.branch ? `Nhánh: ${up.branch}` : 'Nâng cấp chuyên sâu';
    }

    return { statPreview, reason };
  }

  draw(ctx) {
    if (!this.active) return;
    const W = C.INTERNAL_W, H = C.INTERNAL_H;
    const player = this.game.runState?.player;
    const { rects, rerollRect } = this._getCardLayout();

    // Dark backdrop with subtle blur/tint
    ctx.fillStyle = 'rgba(8, 10, 18, 0.88)';
    ctx.fillRect(0, 0, W, H);

    // Title header
    ctx.fillStyle = this.classSkillMode ? '#facc15' : '#f59e0b';
    ctx.font = `bold 16px ${UI_HEADING_FONT}`;
    ctx.textAlign = 'center';
    if (this.classSkillMode) {
      const clsName = player?.classDef?.name || 'CLASS';
      ctx.fillText(`KỸ NĂNG ${clsName.toUpperCase()} — CẤP ${this.classSkillChoice?.level || player?.level || 3}`, W / 2, 34);
    } else {
      ctx.fillText('CHỌN NÂNG CẤP', W / 2, 34);
    }

    ctx.fillStyle = '#94a3b8';
    ctx.font = `9px ${UI_FONT}`;
    if (this.classSkillMode) {
      ctx.fillText('Chọn 1 trong 2 kỹ năng đặc trưng để hoàn thiện bộ chiêu thức', W / 2, 49);
    } else {
      ctx.fillText('Dùng phím 1/2/3 hoặc Click chuột vào thẻ bài', W / 2, 49);
    }

    // Draw cards
    for (let i = 0; i < this.choices.length; i++) {
      const c = this.choices[i];
      const r = rects[i];
      const sel = i === this.selected;
      const hov = i === this.hoveredCard;
      const isPress = i === this.pressedCard;
      const isEvolution = c.type === 'evolution';

      // Card container
      ctx.save();
      const ox = isPress ? 1 : 0;
      const oy = isPress ? 1 : 0;
      const rx = r.x + ox;
      const ry = r.y + oy;

      // Card background
      let cardBg = 'rgba(18, 22, 35, 0.95)';
      let borderCol = isEvolution ? '#eab308' : (sel ? '#f59e0b' : 'rgba(90, 100, 125, 0.45)');
      if (sel || hov) {
        cardBg = isEvolution ? 'rgba(50, 40, 15, 0.98)' : 'rgba(28, 34, 54, 0.98)';
      }

      ctx.fillStyle = cardBg;
      ctx.fillRect(rx, ry, r.w, r.h);

      // Card shadow
      if (!isPress) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
        ctx.fillRect(rx + 1, ry + r.h, r.w - 1, 2);
      }

      // Border outline
      ctx.strokeStyle = borderCol;
      ctx.lineWidth = sel ? 2 : 1;
      ctx.strokeRect(rx + 0.5, ry + 0.5, r.w - 1, r.h - 1);

      // Keyboard focus indicator corners
      if (sel) {
        ctx.fillStyle = isEvolution ? '#eab308' : '#f59e0b';
        ctx.fillRect(rx - 2, ry - 2, 4, 4);
        ctx.fillRect(rx + r.w - 2, ry - 2, 4, 4);
        ctx.fillRect(rx - 2, ry + r.h - 2, 4, 4);
        ctx.fillRect(rx + r.w - 2, ry + r.h - 2, 4, 4);
      }

      // Top number badge
      ctx.fillStyle = sel ? '#f59e0b' : '#64748b';
      ctx.font = `bold 10px ${UI_FONT}`;
      ctx.fillText(`[ ${i + 1} ]`, rx + r.w / 2, ry + 16);

      // Icon container box
      const iconBoxSize = 36;
      const iconBoxX = rx + r.w / 2 - iconBoxSize / 2;
      const iconBoxY = ry + 24;

      ctx.fillStyle = isEvolution ? 'rgba(234, 179, 8, 0.15)' : 'rgba(15, 20, 32, 0.8)';
      ctx.fillRect(iconBoxX, iconBoxY, iconBoxSize, iconBoxSize);
      ctx.strokeStyle = isEvolution ? '#eab308' : 'rgba(100, 116, 139, 0.4)';
      ctx.lineWidth = 1;
      ctx.strokeRect(iconBoxX + 0.5, iconBoxY + 0.5, iconBoxSize - 1, iconBoxSize - 1);

      // Render Icon (image asset or custom pixel art)
      const iconKey = c.data.icon || c.data.id;
      const assetImg = this.game.assets.getImage(iconKey);
      if (assetImg && assetImg.width > 0) {
        ctx.drawImage(assetImg, iconBoxX + 4, iconBoxY + 4, 28, 28);
      } else {
        PixelIcons.draw(ctx, iconKey, iconBoxX + 8, iconBoxY + 8, 20);
      }

      // Name
      ctx.fillStyle = isEvolution ? '#fef08a' : (sel ? '#ffffff' : '#f1f5f9');
      ctx.font = `bold 12px ${UI_HEADING_FONT}`;
      ctx.fillText(c.data.name, rx + r.w / 2, ry + 73);

      // Type Badge
      let typeLabel = '';
      let typeColor = '#94a3b8';
      switch (c.type) {
        case 'upgrade': typeLabel = '◆ CHỈ SỐ ◆'; typeColor = '#4ade80'; break;
        case 'artifact_up': typeLabel = `▲ DI VẬT Lv${c.data.currentLevel}→${c.data.currentLevel + 1} ▲`; typeColor = '#fb923c'; break;
        case 'charm_up': typeLabel = `● BÙA Lv${c.data.currentLevel}→${c.data.currentLevel + 1} ●`; typeColor = '#c084fc'; break;
        case 'new_artifact': typeLabel = '★ DI VẬT MỚI ★'; typeColor = '#f97316'; break;
        case 'new_charm': typeLabel = '★ BÙA MỚI ★'; typeColor = '#818cf8'; break;
        case 'evolution': typeLabel = '★ TIẾN HÓA THẦN KHÍ ★'; typeColor = '#eab308'; break;
        case 'class_skill': typeLabel = '✦ KỸ NĂNG CLASS ✦'; typeColor = '#facc15'; break;
        case 'class_upgrade': typeLabel = `✦ ${c.data.branch || 'CHUYÊN SÂU'} ✦`; typeColor = '#f59e0b'; break;
      }
      ctx.fillStyle = typeColor;
      ctx.font = `bold 8.5px ${UI_FONT}`;
      ctx.fillText(typeLabel, rx + r.w / 2, ry + 88);

      // Before/After Stat Preview in dedicated high-contrast badge box
      const { statPreview, reason } = this._getChoiceDetails(c, player);
      const statBoxY = ry + 98;
      ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
      ctx.fillRect(rx + 6, statBoxY, r.w - 12, 18);
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.45)';
      ctx.lineWidth = 1;
      ctx.strokeRect(rx + 6.5, statBoxY + 0.5, r.w - 13, 17);

      ctx.fillStyle = '#38bdf8';
      ctx.font = `bold 8.5px ${UI_FONT}`;
      ctx.fillText(statPreview, rx + r.w / 2, statBoxY + 12);

      // Strategic reason / branch
      ctx.fillStyle = '#cbd5e1';
      ctx.font = `italic 8px ${UI_FONT}`;
      ctx.fillText(reason, rx + r.w / 2, ry + 126);

      // Description wrap
      ctx.fillStyle = '#94a3b8';
      ctx.font = `8px ${UI_FONT}`;
      let desc = c.data.desc || '';
      if (c.data.evolution) {
        const reqCharm = CHARMS[c.data.evolution.requires]?.name || c.data.evolution.requires;
        desc += ` [Ghép: ${reqCharm} Lv${c.data.evolution.requiredLevel}]`;
      }
      const words = desc.split(' ');
      let line = '', ly = ry + 138;
      for (const w of words) {
        const test = line + w + ' ';
        if (ctx.measureText(test).width > r.w - 16) {
          ctx.fillText(line.trim(), rx + r.w / 2, ly);
          line = w + ' ';
          ly += 10;
        } else {
          line = test;
        }
      }
      if (line.trim()) ctx.fillText(line.trim(), rx + r.w / 2, ly);

      // Trade-off cost & Next milestone
      if (c.data.cost && c.data.cost !== 'Không có') {
        ctx.fillStyle = '#f87171';
        ctx.font = `italic 7.5px ${UI_FONT}`;
        ctx.fillText(`Giá: ${c.data.cost}`, rx + r.w / 2, ly + 9);
        ly += 9;
      }
      if (c.data.nextMilestone) {
        ctx.fillStyle = '#fde047';
        ctx.font = `6.5px ${UI_FONT}`;
        ctx.fillText(c.data.nextMilestone, rx + r.w / 2, ly + 8);
      }

      // Bottom select prompt
      ctx.fillStyle = sel ? '#f59e0b' : '#64748b';
      ctx.font = `bold 9px ${UI_FONT}`;
      ctx.fillText(sel ? '▶ CHỌN THẺ NÀY ◀' : 'Click để chọn', rx + r.w / 2, ry + r.h - 10);

      ctx.restore();
    }

    // Reroll button at bottom (only in normal upgrade mode)
    if (!this.classSkillMode) {
      const remainingRerolls = player?.rerolls || 0;
      UIHelper.drawButton(ctx, {
        x: rerollRect.x,
        y: rerollRect.y,
        w: rerollRect.w,
        h: rerollRect.h,
        label: `[R] Đổi Lại (còn ${remainingRerolls})`,
        icon: 'dice',
        disabled: remainingRerolls <= 0,
        hovered: this.hoveredReroll && remainingRerolls > 0,
        pressed: this.pressedReroll && remainingRerolls > 0,
        variant: remainingRerolls > 0 ? 'default' : 'subtle',
      });
    }
  }
}
