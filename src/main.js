// Điểm khởi động: vòng lặp bước cố định 60Hz, dựng hình pixel, điều phối màn hình
import { Input } from './core/input.js';
import { AudioSys } from './core/audio.js';
import { VIEW_W, VIEW_H } from './core/camera.js';
import { UI } from './ui/ui.js';
import { Run } from './game/run.js';
import { Play } from './game/play.js';
import { buildTileCache, buildBackground, drawBackground, AshFall } from './render/world.js';
import { drawPlayer, drawEnemy, drawBoss, drawProjectile, drawObject } from './render/sprites.js';
import { PROLOGUE, FRAGMENTS, EPILOGUE } from './data/story.js';
import { rollDie } from './data/dice.js';
import { WEAPONS } from './data/weapons.js';

const STEP = 1 / 60;
const UI_W = 960, UI_H = 540;

class Game {
  constructor() {
    this.canvas = document.getElementById('screen');
    this.ctx = this.canvas.getContext('2d');
    this.buf = document.createElement('canvas'); this.buf.width = VIEW_W; this.buf.height = VIEW_H;
    this.b = this.buf.getContext('2d');
    this.uiRoot = document.getElementById('ui');
    this.input = new Input(this.canvas);
    this.audio = new AudioSys();
    this.ui = new UI(this.uiRoot, this);
    this.mode = 'title';
    this.play = null;
    this.ash = new AshFall(80);
    this.bgCache = {};
    this.time = 0;
    this.glow = this.makeGlow();
    this.vignette = this.makeVignette();
    this.input.onAny(() => this.audio.unlock());
    window.addEventListener('resize', () => this.resize());
    this.resize();
    this.titleBg = buildBackground('field');
    this.showTitle();
    this.last = performance.now(); this.acc = 0;
    requestAnimationFrame((t) => this.frame(t));
    window.__game = this; // phục vụ kiểm thử tự động
  }

  resize() {
    const ww = window.innerWidth, wh = window.innerHeight;
    let s = Math.min(ww / VIEW_W, wh / VIEW_H);
    if (s >= 2) s = Math.floor(s * 2) / 2; // ưu tiên tỉ lệ đẹp
    const cw = Math.floor(VIEW_W * s), ch = Math.floor(VIEW_H * s);
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    this.canvas.style.width = cw + 'px'; this.canvas.style.height = ch + 'px';
    this.canvas.width = Math.floor(cw * dpr); this.canvas.height = Math.floor(ch * dpr);
    this.scale = s * dpr; this.dpr = dpr;
    Object.assign(this.uiRoot.style, { width: UI_W + 'px', height: UI_H + 'px', transform: `scale(${cw / UI_W})`, transformOrigin: 'center center', left: `calc(50% - ${UI_W / 2}px)`, top: `calc(50% - ${UI_H / 2}px)` });
    this.ctx.imageSmoothingEnabled = false;
  }

  makeGlow() {
    const c = document.createElement('canvas'); c.width = c.height = 64;
    const g = c.getContext('2d'); const gr = g.createRadialGradient(32, 32, 0, 32, 32, 32);
    gr.addColorStop(0, 'rgba(255,170,90,0.55)'); gr.addColorStop(0.4, 'rgba(255,120,50,0.18)'); gr.addColorStop(1, 'rgba(255,90,40,0)');
    g.fillStyle = gr; g.fillRect(0, 0, 64, 64); return c;
  }
  makeVignette() {
    const c = document.createElement('canvas'); c.width = VIEW_W; c.height = VIEW_H;
    const g = c.getContext('2d'); const gr = g.createRadialGradient(VIEW_W / 2, VIEW_H / 2, VIEW_H * 0.35, VIEW_W / 2, VIEW_H / 2, VIEW_W * 0.62);
    gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(1, 'rgba(8,2,6,0.62)');
    g.fillStyle = gr; g.fillRect(0, 0, VIEW_W, VIEW_H); return c;
  }

  // ---------- Luồng màn hình ----------
  best() { try { return localStorage.getItem('ttmg_best') || ''; } catch { return ''; } }
  saveBest(win, run) {
    try {
      const prev = JSON.parse(localStorage.getItem('ttmg_best_raw') || 'null');
      const score = (win ? 1000 : 0) + run.roomIndex * 10;
      if (!prev || score > prev.score || (score === prev.score && run.time < prev.time)) {
        localStorage.setItem('ttmg_best_raw', JSON.stringify({ score, time: run.time }));
        const t = Math.floor(run.time);
        localStorage.setItem('ttmg_best', win ? `Phá đảo chương I trong ${Math.floor(t / 60)}:${String(t % 60).padStart(2, '0')}` : `Tới phòng ${run.roomIndex + 1}/${run.sequence.length}`);
      }
    } catch { /* bỏ qua */ }
  }

  showTitle() {
    this.mode = 'title'; this.play = null;
    this.ui.close();
    this.ui.showTitle(this.best(), () => this.startRun(), () => { this.ui.hideTitle(); this.ui.showHow(() => this.showTitle()); });
    this.audio.startMusic('title');
  }

  startRun(seed) {
    this.audio.unlock();
    this.ui.hideTitle();
    this.run = new Run(seed);
    this.mode = 'menu';
    this.ui.showStory(PROLOGUE, () => {
      this.ui.close();
      this.play = new Play(this, this.run);
      this.ui.showHud(true);
      this.mode = 'play';
    });
  }

  afterRoom(play) {
    const room = this.run.room;
    const go = () => { this.ui.close(); this.mode = 'play'; play.nextRoom(); };
    if (room.kind === 'combat') {
      this.mode = 'menu';
      const choices = this.run.buffChoices(3);
      this.audio.play('buff');
      this.ui.showBuffs(choices, (b) => {
        this.run.addBuff(b); this.audio.play('select');
        const frag = FRAGMENTS[this.run.fragments];
        if (frag) {
          this.run.fragments++;
          this.ui.showStory({ ...frag, kicker: `Mảnh ký ức ${this.run.fragments} / 6` }, go);
        } else go();
      }, this.run.combatIndex);
    } else if (room.kind === 'boss') {
      this.mode = 'menu';
      this.run.fragments++;
      this.ui.showStory({ ...EPILOGUE, kicker: 'Mảnh ký ức 6 / 6' }, () => this.onRunEnd(true), `<p style="color:#ffb340;font-family:var(--px);font-size:22px">${EPILOGUE.next}</p>`);
    } else go();
  }

  onRunEnd(win) {
    this.mode = 'menu';
    this.saveBest(win, this.run);
    this.ui.showHud(false);
    if (win) this.audio.startMusic('rest');
    this.ui.showEnd(win, this.run, () => { this.ui.close(); this.startRun(); }, () => this.showTitle());
  }

  pause() {
    if (this.mode !== 'play') return;
    this.mode = 'menu';
    this.ui.showPause(() => this.resume(), () => { this.ui.close(); this.ui.showHud(false); this.startRun(); }, () => this.showTitle(), this.audio);
  }
  resume() { this.ui.close(); this.mode = 'play'; this.input.endFrame(); }

  openDice(play, obj) {
    this.mode = 'menu';
    const min = this.run.stats.diceMin;
    this.ui.showDice(obj.cond, obj.rerolls ?? this.run.stats.chestRerolls, (n) => Array.from({ length: n }, () => rollDie(min)), (ok) => {
      this.ui.close(); this.mode = 'play'; this.input.endFrame();
      if (ok === null) return; // để sau
      play.resolveDice(obj, ok);
    }, this.audio);
  }

  openForge(play) {
    this.mode = 'menu';
    this.audio.play('forge');
    this.ui.showForge(this.run, (i) => { this.run.weapons[i].level++; this.audio.play('forge'); }, () => { this.run.flasks = this.run.maxFlasks; this.audio.play('heal'); }, () => { this.ui.close(); this.mode = 'play'; this.input.endFrame(); });
  }

  openShop(play, merchant) {
    this.mode = 'menu';
    this.ui.showShop(this.run, merchant.stock, (it) => {
      if (this.run.gold < it.price || it.sold) return;
      this.run.gold -= it.price; it.sold = true; this.audio.play('coin');
      if (it.kind === 'weapon') play.dropWeapon(it.weapon, merchant.x - 20, merchant.y - 10);
      if (it.kind === 'flask') this.run.flasks++;
      if (it.kind === 'hp') { this.run.stats.maxHp += 15; this.run.heal(15); }
    }, () => { this.ui.close(); this.mode = 'play'; this.input.endFrame(); });
  }

  // ---------- Vòng lặp ----------
  frame(now) {
    const dt = Math.min(0.1, (now - this.last) / 1000); this.last = now;
    this.acc += dt;
    let steps = 0;
    while (this.acc >= STEP && steps < 5) { this.update(STEP); this.acc -= STEP; steps++; }
    if (steps === 5) this.acc = 0;
    this.render(dt);
    requestAnimationFrame((t) => this.frame(t));
  }

  update(dt) {
    this.time += dt;
    this.input.pollPad();
    if (this.mode === 'play' && this.play) {
      if (this.input.pressed('pause')) this.pause();
      else this.play.update(dt);
    }
    this.input.endFrame();
  }

  render(dt) {
    const b = this.b;
    b.imageSmoothingEnabled = false;
    const play = this.play;
    if (!play) {
      // nền màn hình tiêu đề cuộn chậm
      drawBackground(b, this.titleBg, this.time * 12, 0, VIEW_H);
      this.ash.draw(b, dt, this.time * 12, true);
      b.drawImage(this.vignette, 0, 0);
    } else this.renderPlay(b, play, dt);
    // phóng lên màn hình
    const ctx = this.ctx;
    ctx.imageSmoothingEnabled = false;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.drawImage(this.buf, 0, 0, this.canvas.width, this.canvas.height);
    if (play) this.renderTexts(ctx, play);
  }

  renderPlay(b, play, dt) {
    const lv = play.level;
    const kind = play.run.room.kind === 'boss' ? 'boss' : ['forge', 'dice', 'intro'].includes(play.run.room.kind) ? 'rest' : 'field';
    if (!this.bgCache[kind]) this.bgCache[kind] = buildBackground(kind);
    if (!lv.cache) lv.cache = buildTileCache(lv, kind);
    const cam = play.camera;
    const cx = cam.rx, cy = cam.ry;
    const t = this.time;
    drawBackground(b, this.bgCache[kind], cx, cy, lv.ph);
    // ánh đuốc (sau địa hình)
    b.globalCompositeOperation = 'lighter';
    for (const o of play.objects) {
      if (o.kind === 'torch' || o.kind === 'forge') { const s = (o.kind === 'forge' ? 110 : 70) + Math.sin(t * 9 + (o.t || 0)) * 4; b.globalAlpha = 0.8; b.drawImage(this.glow, Math.round(o.x + o.w / 2 - cx - s / 2), Math.round(o.y + 4 - cy - s / 2), s, s); }
      if (o.kind === 'gate' && o.open) { b.globalAlpha = 0.6; b.drawImage(this.glow, Math.round(o.x + 10 - cx - 40), Math.round(o.y + 16 - cy - 40), 80, 80); }
    }
    b.globalAlpha = 1; b.globalCompositeOperation = 'source-over';
    b.drawImage(lv.cache, -cx, -cy);
    // đối tượng nền
    for (const o of play.objects) if (o.kind !== 'coin' && o.kind !== 'drop') drawObject(b, o, cx, cy, t, play.focus === o);
    // quái
    for (const e of play.enemies) { if (e.isBoss) drawBoss(b, e, cx, cy); else drawEnemy(b, e, cx, cy); }
    drawPlayer(b, play.player, cx, cy, play.run);
    for (const o of play.objects) if (o.kind === 'coin' || o.kind === 'drop') drawObject(b, o, cx, cy, t, play.focus === o);
    for (const p of play.projectiles) drawProjectile(b, p, cx, cy, t);
    play.fx.draw(b, cx, cy);
    // lửa trên quái đang cháy
    for (const e of play.enemies) if (e.status && e.status.burn > 0 && Math.random() < 0.4) play.fx.burst(e.cx + (Math.random() - 0.5) * e.w, e.y + e.h * 0.4, 1, { colors: ['#ff8a3d', '#ffd23f'], speed: 20, life: 0.35, grav: -90 });
    this.ash.draw(b, play.hitstop > 0 ? 0 : dt, cx, kind === 'boss');
    b.drawImage(this.vignette, 0, 0);
    // máu thấp: viền đỏ
    const run = play.run;
    if (run.hp < run.stats.maxHp * 0.3 && !play.player.dead) { b.globalAlpha = 0.18 + 0.12 * Math.sin(t * 5); b.fillStyle = '#8e1f1f'; b.fillRect(0, 0, VIEW_W, 3); b.fillRect(0, VIEW_H - 3, VIEW_W, 3); b.fillRect(0, 0, 3, VIEW_H); b.fillRect(VIEW_W - 3, 0, 3, VIEW_H); b.globalAlpha = 1; }
    for (const f of play.fx.flashes) { b.globalAlpha = f.life / f.max; b.fillStyle = f.color; b.fillRect(0, 0, VIEW_W, VIEW_H); }
    b.globalAlpha = 1;
    const fa = play.fadeAlpha;
    if (fa > 0) { b.fillStyle = `rgba(5,3,4,${fa})`; b.fillRect(0, 0, VIEW_W, VIEW_H); }
  }

  // Chữ nổi tiếng Việt vẽ ở độ phân giải cao cho rõ nét
  renderTexts(ctx, play) {
    const s = this.scale, cam = play.camera;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    for (const tx of play.fx.texts) {
      const a = Math.min(1, tx.life / tx.max * 2.5);
      const x = (tx.x - cam.rx) * s, y = (tx.y - cam.ry) * s;
      const size = Math.round(9 * s);
      ctx.font = `${size}px VT323, monospace`;
      ctx.globalAlpha = a;
      ctx.fillStyle = '#000'; ctx.fillText(tx.str, x + s, y + s);
      ctx.fillStyle = tx.color; ctx.fillText(tx.str, x, y);
    }
    ctx.globalAlpha = 1;
  }
}

window.addEventListener('DOMContentLoaded', () => new Game());
export { WEAPONS };
