// Bàn phím + chuột + tay cầm. Mỗi frame: down / pressed (vừa nhấn) / released
const KEYMAP = {
  left: ['KeyA', 'ArrowLeft'],
  right: ['KeyD', 'ArrowRight'],
  up: ['KeyW', 'ArrowUp'],
  down: ['KeyS', 'ArrowDown'],
  jump: ['Space', 'KeyW', 'ArrowUp'],
  attack1: ['KeyJ'],
  attack2: ['KeyK'],
  roll: ['ShiftLeft', 'ShiftRight', 'KeyL'],
  dice: ['KeyQ'],
  interact: ['KeyE'],
  interact2: ['KeyR'],
  flask: ['KeyF'],
  pause: ['Escape', 'KeyP'],
  confirm: ['Enter', 'Space', 'KeyJ'],
  back: ['Escape'],
  menuLeft: ['KeyA', 'ArrowLeft'],
  menuRight: ['KeyD', 'ArrowRight'],
  one: ['Digit1'], two: ['Digit2'], three: ['Digit3'],
};

// Nút tay cầm chuẩn (Standard Gamepad)
const PADMAP = {
  jump: [0], attack1: [2], attack2: [3], roll: [1], dice: [4], interact: [5], flask: [6],
  interact2: [7], pause: [9], confirm: [0], back: [1], left: [14], right: [15], up: [12], down: [13],
  menuLeft: [14], menuRight: [15],
};

export class Input {
  constructor(target) {
    this.keys = new Set();
    this.prev = new Set();
    this.hits = new Set(); // phím được nhấn từ frame trước (kể cả nhấn-nhả rất nhanh)
    this.mouseHits = new Set();
    this.mouse = new Set();
    this.prevMouse = new Set();
    this.pad = new Set();
    this.prevPad = new Set();
    this.axisX = 0;
    this.anyKeyCallbacks = [];
    window.addEventListener('keydown', (e) => {
      if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Tab'].includes(e.code)) e.preventDefault();
      if (!e.repeat) this.hits.add(e.code);
      this.keys.add(e.code);
      this.anyKeyCallbacks.forEach((cb) => cb());
    });
    window.addEventListener('keyup', (e) => this.keys.delete(e.code));
    window.addEventListener('blur', () => { this.keys.clear(); this.mouse.clear(); });
    target.addEventListener('mousedown', (e) => { this.mouse.add(e.button); this.mouseHits.add(e.button); this.anyKeyCallbacks.forEach((cb) => cb()); });
    window.addEventListener('mouseup', (e) => this.mouse.delete(e.button));
    target.addEventListener('contextmenu', (e) => e.preventDefault());
  }

  pollPad() {
    this.prevPad = this.pad;
    this.pad = new Set();
    this.axisX = 0;
    const pads = navigator.getGamepads ? navigator.getGamepads() : [];
    for (const p of pads) {
      if (!p) continue;
      p.buttons.forEach((b, i) => { if (b.pressed) this.pad.add(i); });
      const ax = p.axes[0] || 0;
      if (Math.abs(ax) > 0.35) this.axisX = ax;
      if (ax < -0.5) this.pad.add('L'); if (ax > 0.5) this.pad.add('R');
      const ay = p.axes[1] || 0;
      if (ay > 0.6) this.pad.add('D'); if (ay < -0.6) this.pad.add('U');
      break;
    }
  }

  _padDown(action, set) {
    const btns = PADMAP[action] || [];
    if (btns.some((b) => set.has(b))) return true;
    if (action === 'left' || action === 'menuLeft') return set.has('L');
    if (action === 'right' || action === 'menuRight') return set.has('R');
    if (action === 'down') return set.has('D');
    if (action === 'up') return set.has('U');
    return false;
  }

  _down(action, keys, mouse, pad) {
    if ((KEYMAP[action] || []).some((k) => keys.has(k))) return true;
    if (action === 'attack1' && mouse.has(0)) return true;
    if (action === 'attack2' && mouse.has(2)) return true;
    return this._padDown(action, pad);
  }

  down(a) { return this._down(a, this.keys, this.mouse, this.pad); }
  pressed(a) {
    if ((KEYMAP[a] || []).some((k) => this.hits.has(k))) return true;
    if (a === 'attack1' && this.mouseHits.has(0)) return true;
    if (a === 'attack2' && this.mouseHits.has(2)) return true;
    return this._padDown(a, this.pad) && !this._padDown(a, this.prevPad);
  }
  released(a) { return !this.down(a) && this._down(a, this.prev, this.prevMouse, this.prevPad); }

  endFrame() {
    this.hits.clear(); this.mouseHits.clear();
    this.prev = new Set(this.keys);
    this.prevMouse = new Set(this.mouse);
  }
  onAny(cb) { this.anyKeyCallbacks.push(cb); }
}
