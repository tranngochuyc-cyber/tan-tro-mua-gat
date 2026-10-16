import { INTERNAL_W, INTERNAL_H } from './Constants.js';

export class Input {
  constructor(canvas) {
    this.canvas = canvas;
    this.keys = {};
    this.keysJustPressed = {};
    this.mouse = { x: 0, y: 0, down: false, clicked: false, released: false, downX: 0, downY: 0 };
    this._prevKeys = {};
    this._mouseWasDown = false;
    this._mouseDownPending = false;
    this._mouseUpPending = false;
    // Event queue for keydown — prevents missed fast presses between frames
    this._keyDownQueue = new Set();

    // Touch state
    this.touch = {
      joystick: { active: false, id: null, startX: 0, startY: 0, dx: 0, dy: 0 },
      attack: false,
      dash: false,
      skill: false,
      interact: false,
    };
    this._touchAttackPending = false;
    this._touchDashPending = false;
    this._touchSkillPending = false;
    this._touchInteractPending = false;
    this.isTouchDevice = false;
    this._touches = new Map();

    // Keyboard
    window.addEventListener('keydown', (e) => {
      this.keys[e.code] = true;
      this._keyDownQueue.add(e.code);
      // Prevent default for game keys including arrows
      if (['Space', 'KeyW', 'KeyA', 'KeyS', 'KeyD', 'KeyQ', 'KeyE',
           'Escape', 'Digit1', 'Digit2', 'Digit3',
           'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) {
        e.preventDefault();
      }
    });
    window.addEventListener('keyup', (e) => {
      this.keys[e.code] = false;
    });

    // Mouse
    canvas.addEventListener('mousemove', (e) => {
      const rect = canvas.getBoundingClientRect();
      this.mouse.x = rect.width ? (e.clientX - rect.left) * (INTERNAL_W / rect.width) : 0;
      this.mouse.y = rect.height ? (e.clientY - rect.top) * (INTERNAL_H / rect.height) : 0;
    });
    canvas.addEventListener('mousedown', (e) => {
      if (e.button === 0) {
        this.mouse.down = true;
        this._mouseDownPending = true;
        this.mouse.downX = this.mouse.x;
        this.mouse.downY = this.mouse.y;
      }
    });
    // Listen on window to catch mouseup outside canvas
    window.addEventListener('mouseup', (e) => {
      if (e.button === 0) {
        if (this.mouse.down) this._mouseUpPending = true;
        this.mouse.down = false;
      }
    });
    window.addEventListener('pointerup', (e) => {
      if (e.button === 0) {
        if (this.mouse.down) this._mouseUpPending = true;
        this.mouse.down = false;
      }
    });
    window.addEventListener('pointercancel', () => {
      this.mouse.down = false;
    });
    canvas.addEventListener('contextmenu', (e) => e.preventDefault());
    window.addEventListener('blur', () => this.clearHeld());

    // Touch controls
    canvas.addEventListener('touchstart', (e) => this._onTouchStart(e), { passive: false });
    canvas.addEventListener('touchmove', (e) => this._onTouchMove(e), { passive: false });
    canvas.addEventListener('touchend', (e) => this._onTouchEnd(e), { passive: false });
    canvas.addEventListener('touchcancel', (e) => this._onTouchEnd(e), { passive: false });
  }

  // ---- Touch handling ----
  _getCanvasCoords(touch) {
    const rect = this.canvas.getBoundingClientRect();
    return {
      x: rect.width ? (touch.clientX - rect.left) * (INTERNAL_W / rect.width) : 0,
      y: rect.height ? (touch.clientY - rect.top) * (INTERNAL_H / rect.height) : 0,
    };
  }

  _onTouchStart(e) {
    e.preventDefault();
    this.isTouchDevice = true;
    for (const t of e.changedTouches) {
      const pos = this._getCanvasCoords(t);
      let touchRole = 'aim';

      const W = INTERNAL_W;
      const H = INTERNAL_H;

      if (this._isOverTouchButton(pos, 'attack')) {
        touchRole = 'attack';
        this._touchAttackPending = true;
        this.touch.attack = true;
      } else if (this._isOverTouchButton(pos, 'dash')) {
        touchRole = 'dash';
        this._touchDashPending = true;
        this.touch.dash = true;
      } else if (this._isOverTouchButton(pos, 'skill')) {
        touchRole = 'skill';
        this._touchSkillPending = true;
        this.touch.skill = true;
      } else if (this._isOverTouchButton(pos, 'interact')) {
        touchRole = 'interact';
        this._touchInteractPending = true;
        this.touch.interact = true;
      } else if (pos.x < W * 0.4 && pos.y > H * 0.35) {
        // Left side = virtual joystick
        touchRole = 'joystick';
        this.touch.joystick.active = true;
        this.touch.joystick.id = t.identifier;
        this.touch.joystick.startX = pos.x;
        this.touch.joystick.startY = pos.y;
        this.touch.joystick.dx = 0;
        this.touch.joystick.dy = 0;
      } else {
        // UI click or aim/attack
        touchRole = 'mouse';
        this._touchAttackPending = true;
        this.touch.attack = true;
        this.mouse.x = pos.x;
        this.mouse.y = pos.y;
        this._mouseDownPending = true;
        this.mouse.down = true;
      }

      this._touches.set(t.identifier, { ...pos, startX: pos.x, startY: pos.y, role: touchRole });
    }
  }

  _onTouchMove(e) {
    e.preventDefault();
    for (const t of e.changedTouches) {
      const pos = this._getCanvasCoords(t);
      const existing = this._touches.get(t.identifier);
      if (existing) {
        existing.x = pos.x;
        existing.y = pos.y;
      }

      if (this.touch.joystick.active && t.identifier === this.touch.joystick.id) {
        this.touch.joystick.dx = pos.x - this.touch.joystick.startX;
        this.touch.joystick.dy = pos.y - this.touch.joystick.startY;
      } else {
        // Update mouse position for aiming
        this.mouse.x = pos.x;
        this.mouse.y = pos.y;
      }
    }
  }

  _onTouchEnd(e) {
    e.preventDefault();
    for (const t of e.changedTouches) {
      const existing = this._touches.get(t.identifier);
      const role = existing ? existing.role : null;
      this._touches.delete(t.identifier);

      if (this.touch.joystick.active && t.identifier === this.touch.joystick.id) {
        this.touch.joystick.active = false;
        this.touch.joystick.id = null;
        this.touch.joystick.dx = 0;
        this.touch.joystick.dy = 0;
      }

      // Check if any other touch is still holding this role
      let otherHasAttack = false;
      let otherHasDash = false;
      let otherHasSkill = false;
      let otherHasInteract = false;
      let otherHasMouse = false;

      for (const other of this._touches.values()) {
        if (other.role === 'attack') otherHasAttack = true;
        if (other.role === 'dash') otherHasDash = true;
        if (other.role === 'skill') otherHasSkill = true;
        if (other.role === 'interact') otherHasInteract = true;
        if (other.role === 'mouse') otherHasMouse = true;
      }

      this.touch.attack = otherHasAttack;
      this.touch.dash = otherHasDash;
      this.touch.skill = otherHasSkill;
      this.touch.interact = otherHasInteract;
      if (!otherHasMouse) {
        this.mouse.down = false;
      }
    }
  }

  /** Check if position is over a touch button */
  _isOverTouchButton(pos, btnName) {
    const W = this.canvas.width;
    const H = this.canvas.height;
    const btnSize = 48;
    const margin = 12;
    const rightX = W - margin - btnSize;
    const bottomY = H - margin - btnSize;
    switch (btnName) {
      case 'attack':
        return pos.x >= rightX && pos.x <= rightX + btnSize &&
               pos.y >= bottomY - 56 && pos.y <= bottomY - 56 + btnSize;
      case 'dash':
        return pos.x >= rightX - 56 && pos.x <= rightX - 56 + btnSize &&
               pos.y >= bottomY && pos.y <= bottomY + btnSize;
      case 'skill':
        return pos.x >= rightX - 56 && pos.x <= rightX - 56 + btnSize &&
               pos.y >= bottomY - 56 && pos.y <= bottomY - 56 + btnSize;
      case 'interact':
        return pos.x >= rightX && pos.x <= rightX + btnSize &&
               pos.y >= bottomY && pos.y <= bottomY + btnSize;
    }
    return false;
  }

  /** Get touch button layout for HUD drawing */
  getTouchButtons() {
    if (!this.isTouchDevice) return null;
    const W = this.canvas.width;
    const H = this.canvas.height;
    const btnSize = 48;
    const margin = 12;
    const rightX = W - margin - btnSize;
    const bottomY = H - margin - btnSize;
    return {
      attack:   { x: rightX, y: bottomY - 56, w: btnSize, h: btnSize, label: 'CHÉM', icon: 'sword' },
      dash:     { x: rightX - 56, y: bottomY, w: btnSize, h: btnSize, label: 'LƯỚT', icon: 'dash' },
      skill:    { x: rightX - 56, y: bottomY - 56, w: btnSize, h: btnSize, label: 'PHÉP', icon: 'skill' },
      interact: { x: rightX, y: bottomY, w: btnSize, h: btnSize, label: 'DÙNG', icon: 'hand' },
    };
  }

  clearHeld() {
    this.keys = {};
    this.keysJustPressed = {};
    this._prevKeys = {};
    this._keyDownQueue.clear();
    this.mouse.down = false;
    this.mouse.clicked = false;
    this._mouseWasDown = false;
    this._mouseDownPending = false;
    this.touch.joystick.active = false;
    this.touch.joystick.dx = 0;
    this.touch.joystick.dy = 0;
    this.touch.attack = false;
    this.touch.dash = false;
    this.touch.skill = false;
    this.touch.interact = false;
    this._touchAttackPending = false;
    this._touchDashPending = false;
    this._touchSkillPending = false;
    this._touchInteractPending = false;
  }

  /** Call once per frame at end of update */
  endFrame() {
    this.mouse.clicked = false;
    this.mouse.released = false;
    this._prevKeys = { ...this.keys };
    this._mouseWasDown = this.mouse.down;
    this._touchAttackPending = false;
    this._touchDashPending = false;
    this._touchSkillPending = false;
    this._touchInteractPending = false;
  }

  /** Pre-frame: compute just-pressed states from event queue */
  beginFrame() {
    // Merge queued key presses into justPressed
    this.keysJustPressed = {};
    for (const k of this._keyDownQueue) {
      if (!this._prevKeys[k]) {
        this.keysJustPressed[k] = true;
      }
    }
    // Also check current state vs prev for sustained keys
    for (const k of Object.keys(this.keys)) {
      if (this.keys[k] && !this._prevKeys[k]) {
        this.keysJustPressed[k] = true;
      }
    }
    this._keyDownQueue.clear();
    this.mouse.clicked = this._mouseDownPending || (this.mouse.down && !this._mouseWasDown);
    this._mouseDownPending = false;
    this.mouse.released = this._mouseUpPending || (!this.mouse.down && this._mouseWasDown);
    this._mouseUpPending = false;
  }

  isDown(code) { return !!this.keys[code]; }
  justPressed(code) {
    // Map touch buttons to key codes
    if (code === 'Space' && this._touchDashPending) return true;
    if (code === 'KeyQ' && this._touchSkillPending) return true;
    if (code === 'KeyE' && this._touchInteractPending) return true;
    return !!this.keysJustPressed[code];
  }
  isMouseDown() {
    return this.mouse.down || this.touch.attack;
  }
  mouseClicked() {
    return this.mouse.clicked || this._touchAttackPending;
  }
  mouseReleased() {
    return this.mouse.released;
  }
  isMouseReleased() {
    return this.mouse.released;
  }
  getMousePos() { return { x: this.mouse.x, y: this.mouse.y }; }
  getMouseDownPos() { return { x: this.mouse.downX, y: this.mouse.downY }; }

  // Movement vector normalized — includes touch joystick
  getMoveVector() {
    let dx = 0, dy = 0;

    // Keyboard
    if (this.isDown('KeyW') || this.isDown('ArrowUp')) dy = -1;
    if (this.isDown('KeyS') || this.isDown('ArrowDown')) dy = 1;
    if (this.isDown('KeyA') || this.isDown('ArrowLeft')) dx = -1;
    if (this.isDown('KeyD') || this.isDown('ArrowRight')) dx = 1;

    // Touch joystick
    if (this.touch.joystick.active) {
      const jdx = this.touch.joystick.dx;
      const jdy = this.touch.joystick.dy;
      const deadzone = 10;
      const maxDist = 40;
      const dist = Math.sqrt(jdx * jdx + jdy * jdy);
      if (dist > deadzone) {
        dx = jdx / Math.max(dist, maxDist);
        dy = jdy / Math.max(dist, maxDist);
      }
    }

    // Normalize diagonal
    const len = Math.sqrt(dx * dx + dy * dy);
    if (len > 1) {
      dx /= len;
      dy /= len;
    }
    return { x: dx, y: dy };
  }
}
