// ============================================================
// UIHelper — reusable pixel art buttons and UI drawing helpers
// Handles crisp pixel styling, hover/pressed 1px tactile shift,
// keyboard focus rings, centered icon+label groups without overlap,
// and drag-to-cancel button interaction state machine.
// ============================================================
import { PixelIcons } from './PixelIcons.js';

export const UI_FONT = "'Be Vietnam Pro', sans-serif";
export const UI_HEADING_FONT = "'Phudu', 'Be Vietnam Pro', sans-serif";
export const UI_MONO_FONT = "'JetBrains Mono', monospace";

export class UIHelper {
  /** Check if (mx, my) is strictly inside a bounding box */
  static isInside(rect, mx, my) {
    if (!rect || mx == null || my == null) return false;
    return mx >= rect.x && mx <= rect.x + rect.w &&
           my >= rect.y && my <= rect.y + rect.h;
  }

  /**
   * Check button interaction states: hover, press, and confirm on release.
   * Action confirms only if mouse down originated inside and was released inside!
   * Dragging outside cancels the action.
   */
  static checkButton(rect, input) {
    if (!rect || !input) return { hovered: false, pressed: false, clicked: false };
    const mouse = input.getMousePos();
    const hovered = UIHelper.isInside(rect, mouse.x, mouse.y);
    const isDown = input.isMouseDown ? input.isMouseDown() : false;
    const downPos = input.getMouseDownPos ? input.getMouseDownPos() : mouse;
    const pressedInside = UIHelper.isInside(rect, downPos.x, downPos.y);

    const pressed = isDown && pressedInside && hovered;
    const releasedInside = Boolean(input.mouseReleased && input.mouseReleased() && pressedInside && hovered);
    const clickedInside = Boolean(input.mouseClicked && input.mouseClicked() && hovered);

    const clicked = releasedInside || clickedInside;
    return { hovered, pressed, clicked };
  }

  /**
   * Draw a unified pixel-art frame panel with corner rivets and engraved header
   */
  static drawPanel(ctx, opts) {
    const {
      x, y, w, h,
      title = '',
      subtitle = '',
      variant = 'default', // 'default' | 'danger' | 'gold' | 'wood'
    } = opts;

    ctx.save();
    const rx = Math.floor(x);
    const ry = Math.floor(y);

    // 1. Drop shadow behind the panel
    ctx.fillStyle = 'rgba(0, 0, 0, 0.65)';
    ctx.fillRect(rx + 3, ry + 3, w, h);

    // 2. Base slate frame with subtle wood/earth tint
    let bg = '#101422';
    let outerBorder = '#3a2d26';
    let innerBorder = '#475569';
    let rivetColor = '#d97706';

    if (variant === 'gold') {
      outerBorder = '#b45309';
      innerBorder = '#fbbf24';
      rivetColor = '#fef08a';
    } else if (variant === 'danger') {
      outerBorder = '#7f1d1d';
      innerBorder = '#ef4444';
      rivetColor = '#f87171';
    }

    ctx.fillStyle = bg;
    ctx.fillRect(rx, ry, w, h);

    // Outer thick border
    ctx.strokeStyle = outerBorder;
    ctx.lineWidth = 2;
    ctx.strokeRect(rx + 1, ry + 1, w - 2, h - 2);

    // Inner fine border
    ctx.strokeStyle = innerBorder;
    ctx.lineWidth = 1;
    ctx.strokeRect(rx + 3.5, ry + 3.5, w - 7, h - 7);

    // Brass corner studs (rivets)
    ctx.fillStyle = rivetColor;
    const studOffsets = [
      [rx + 4, ry + 4],
      [rx + w - 7, ry + 4],
      [rx + 4, ry + h - 7],
      [rx + w - 7, ry + h - 7]
    ];
    for (const [sx, sy] of studOffsets) {
      ctx.fillRect(sx, sy, 3, 3);
      ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
      ctx.fillRect(sx + 1, sy + 1, 1, 1);
      ctx.fillStyle = rivetColor;
    }

    // Title bar header (if provided)
    if (title) {
      const headerH = 26;
      ctx.fillStyle = 'rgba(30, 24, 28, 0.9)';
      ctx.fillRect(rx + 4, ry + 4, w - 8, headerH);
      ctx.fillStyle = outerBorder;
      ctx.fillRect(rx + 4, ry + 4 + headerH, w - 8, 1);

      ctx.font = `bold 13px ${UI_HEADING_FONT}`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      // Title shadow
      ctx.fillStyle = '#0a0808';
      ctx.fillText(title, rx + w / 2 + 1, ry + 4 + headerH / 2 + 1);

      // Title text
      ctx.fillStyle = variant === 'gold' ? '#fde047' : (variant === 'danger' ? '#fca5a5' : '#f59e0b');
      ctx.fillText(title, rx + w / 2, ry + 4 + headerH / 2);

      if (subtitle) {
        ctx.font = `9px ${UI_FONT}`;
        ctx.fillStyle = '#94a3b8';
        ctx.fillText(subtitle, rx + w / 2, ry + 4 + headerH + 11);
      }
    }

    ctx.restore();
  }

  /**
   * Draw a pixel-art button with tactile hover and press states.
   * Icon and label are measured together and centered as a group.
   * Font size stays constant so button layout NEVER jumps!
   */
  static drawButton(ctx, opts) {
    const {
      x, y, w, h,
      label = '',
      sublabel = '',
      icon = null,
      selected = false, // keyboard focus
      hovered = false,  // mouse hover
      pressed = false,  // mouse pressed down
      disabled = false,
      reason = '',
      variant = 'default', // 'default' | 'primary' | 'danger' | 'success' | 'subtle'
      align = 'center',
    } = opts;

    ctx.save();

    // 1px tactile shift when pressed down
    const ox = pressed ? 0 : 0;
    const oy = pressed ? 1 : 0;
    const rx = Math.floor(x + ox);
    const ry = Math.floor(y + oy);

    // Palette per variant
    let bg = 'rgba(20, 24, 38, 0.95)';
    let border = 'rgba(100, 115, 145, 0.45)';
    let textColor = '#e2e8f0';

    if (variant === 'primary') {
      bg = pressed ? 'rgba(180, 83, 9, 0.65)' : (hovered ? 'rgba(217, 119, 6, 0.45)' : 'rgba(180, 83, 9, 0.35)');
      border = hovered ? '#fde047' : '#f59e0b';
      textColor = hovered ? '#ffffff' : '#fef08a';
    } else if (variant === 'danger') {
      bg = pressed ? 'rgba(185, 28, 28, 0.55)' : (hovered ? 'rgba(220, 38, 38, 0.4)' : 'rgba(153, 27, 27, 0.3)');
      border = hovered ? '#fca5a5' : '#ef4444';
      textColor = hovered ? '#ffffff' : '#fecaca';
    } else if (variant === 'success') {
      bg = pressed ? 'rgba(21, 128, 61, 0.55)' : (hovered ? 'rgba(22, 163, 74, 0.4)' : 'rgba(21, 128, 61, 0.3)');
      border = hovered ? '#86efac' : '#22c55e';
      textColor = hovered ? '#ffffff' : '#bbf7d0';
    } else if (variant === 'subtle') {
      bg = pressed ? 'rgba(15, 18, 26, 0.8)' : (hovered ? 'rgba(30, 36, 52, 0.7)' : 'rgba(15, 18, 26, 0.5)');
      border = hovered ? 'rgba(148, 163, 184, 0.6)' : 'rgba(71, 85, 105, 0.4)';
      textColor = hovered ? '#f8fafc' : '#94a3b8';
    } else {
      if (hovered) {
        bg = pressed ? 'rgba(30, 38, 58, 0.98)' : 'rgba(42, 52, 78, 0.96)';
        border = '#f59e0b';
        textColor = '#ffffff';
      }
    }

    if (disabled) {
      bg = 'rgba(15, 17, 24, 0.85)';
      border = 'rgba(60, 65, 80, 0.35)';
      textColor = '#64748b';
    }

    // Shadow underneath (recessed pixel shadow when not pressed)
    if (!pressed) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
      ctx.fillRect(rx + 1, ry + h, w - 1, 2);
    }

    // Main background
    ctx.fillStyle = bg;
    ctx.fillRect(rx, ry, w, h);

    // Bevel highlights (top-left lighter, bottom-right darker)
    if (!disabled && !pressed) {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
      ctx.fillRect(rx, ry, w, 1);
      ctx.fillRect(rx, ry, 1, h);
      ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
      ctx.fillRect(rx, ry + h - 1, w, 1);
      ctx.fillRect(rx + w - 1, ry, 1, h);
    }

    // Outline
    ctx.strokeStyle = border;
    ctx.lineWidth = 1;
    ctx.strokeRect(rx + 0.5, ry + 0.5, w - 1, h - 1);

    // Keyboard selection distinct indicator: Corner brackets & Amber focus accent (distinguished from primary/hover)
    if (selected && !disabled) {
      ctx.fillStyle = '#fbbf24';
      // Corner brackets [ ]
      ctx.fillRect(rx - 3, ry - 3, 4, 2);
      ctx.fillRect(rx - 3, ry - 3, 2, 4);
      ctx.fillRect(rx + w - 1, ry - 3, 4, 2);
      ctx.fillRect(rx + w + 1, ry - 3, 2, 4);
      ctx.fillRect(rx - 3, ry + h + 1, 4, 2);
      ctx.fillRect(rx - 3, ry + h - 1, 2, 4);
      ctx.fillRect(rx + w - 1, ry + h + 1, 4, 2);
      ctx.fillRect(rx + w + 1, ry + h - 1, 2, 4);

      // Inner subtle glow border
      ctx.strokeStyle = 'rgba(251, 191, 36, 0.6)';
      ctx.lineWidth = 1;
      ctx.strokeRect(rx + 2.5, ry + 2.5, w - 5, h - 5);
    }

    // ------------------------------------------------------------
    // Content Layout: Consistent font size so layout NEVER jumps!
    // ------------------------------------------------------------
    const mainFont = `600 11px ${UI_FONT}`;
    ctx.font = mainFont;
    ctx.textBaseline = 'middle';

    const labelMetrics = ctx.measureText ? ctx.measureText(label) : { width: label.length * 6 };
    const labelW = label ? labelMetrics.width : 0;
    const hasSub = Boolean(sublabel || (disabled && reason));
    const textY = hasSub ? Math.floor(ry + h / 2 - 5) : Math.floor(ry + h / 2);

    const iconSize = 12;
    const iconGap = 6;
    const totalGroupW = (icon ? iconSize + (label ? iconGap : 0) : 0) + labelW;

    let iconX = rx + 8;
    let labelX = rx + 8;

    if (align === 'center') {
      const groupStartX = Math.floor(rx + (w - totalGroupW) / 2);
      if (icon) {
        iconX = groupStartX;
        labelX = groupStartX + iconSize + iconGap;
      } else {
        labelX = Math.floor(rx + w / 2);
      }
    } else {
      // align === 'left'
      if (icon) {
        iconX = rx + 8;
        labelX = rx + 8 + iconSize + iconGap;
      } else {
        labelX = rx + 10;
      }
    }

    // Draw icon if present
    if (icon) {
      const iconY = Math.floor(ry + (h - iconSize) / 2);
      PixelIcons.draw(ctx, icon, iconX, iconY, iconSize);
    }

    // Draw label
    ctx.font = mainFont;
    ctx.fillStyle = textColor;
    ctx.textAlign = (align === 'center' && !icon) ? 'center' : 'left';
    ctx.fillText(label, labelX, textY);

    // Draw sublabel or reason
    if (hasSub) {
      const subText = (disabled && reason) ? reason : sublabel;
      ctx.font = `8px ${UI_FONT}`;
      ctx.fillStyle = disabled ? '#ef4444' : '#94a3b8';
      const subX = (align === 'center' && !icon) ? Math.floor(rx + w / 2) : labelX;
      ctx.fillText(subText, subX, Math.floor(ry + h / 2 + 7));
    }

    ctx.restore();
  }
}
