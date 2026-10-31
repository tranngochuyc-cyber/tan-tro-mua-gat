// Cảnh chơi chính: dựng phòng, cập nhật thực thể, combat, xúc xắc, tương tác, chuyển phòng
import { Level, TILE } from '../world/level.js';
import { Player } from '../entities/player.js';
import { Enemy, ENEMY_TYPES, ELITE_AFFIXES } from '../entities/enemy.js';
import { Boss } from '../entities/boss.js';
import { WEAPONS, TIERS, TRAITS, weaponPower, makeWeapon } from '../data/weapons.js';
import { CONDITIONS, COND, lootQuality, rollDie } from '../data/dice.js';
import { SIGNS } from '../data/rooms.js';
import { FRAGMENTS } from '../data/story.js';
import { overlap, rand, randi, pick, clamp, approach } from '../core/util.js';
import { FX } from '../render/fx.js';
import { Camera } from '../core/camera.js';

export class Play {
  constructor(game, run) {
    this.game = game;
    this.run = run;
    this.input = game.input;
    this.audio = game.audio;
    this.ui = game.ui;
    this.fx = new FX();
    this.camera = new Camera();
    this.hitstop = 0;
    this.timeScale = 1; this.slowmo = 0;
    this.cleared = false;
    this.transition = null;
    this.toastQ = [];
    this.loadRoom();
  }

  toast(msg) { this.ui.toast(msg); }

  // ================= DỰNG PHÒNG =================
  loadRoom() {
    const room = this.run.room;
    this.level = new Level(room.tpl);
    this.camera.setBounds(this.level.pw, this.level.ph);
    this.enemies = []; this.projectiles = []; this.objects = []; this.pending = [];
    this.fx.clear();
    this.boss = null;
    this.cleared = room.kind !== 'combat' && room.kind !== 'boss';
    this.waveSpawned = false;
    this.roomTime = 0;
    let signIdx = 0;
    const depth = room.depth;
    const rng = this.run.rng;
    const spawnMarkers = [];
    for (const m of this.level.markers) {
      const fx = m.px + TILE / 2, fy = m.py + TILE; // chân đặt ở đáy ô
      switch (m.ch) {
        case 'P': this.spawn = { x: fx, y: fy }; break;
        case 'X': this.objects.push({ kind: 'gate', x: fx - 10, y: fy - 32, w: 20, h: 32, open: this.cleared, glow: 0 }); break;
        case 'T': this.objects.push({ kind: 'torch', x: fx - 2, y: m.py + 2, w: 4, h: 10, t: Math.random() * 10 }); break;
        case 'i': this.objects.push({ kind: 'sign', x: fx - 8, y: fy - 16, w: 16, h: 16, text: SIGNS[signIdx++] || '' }); break;
        case 'd': this.enemies.push(new Enemy('dummy', fx, fy, 1)); break;
        case 'W': this.objects.push(this.makePedestal(fx, fy, room)); break;
        case 'C': this.objects.push(this.makeChest(fx, fy, room)); break;
        case 'F': this.objects.push({ kind: 'forge', x: fx - 14, y: fy - 26, w: 28, h: 26, t: 0 }); break;
        case 'M': this.objects.push({ kind: 'merchant', x: fx - 8, y: fy - 24, w: 16, h: 24, t: 0, stock: this.makeStock() }); break;
        case 'B': this.bossSpawn = { x: fx, y: fy }; break;
        default: if ('emhacs'.includes(m.ch)) spawnMarkers.push({ ch: m.ch, x: fx, y: fy });
      }
    }
    // Cửa vận mệnh
    if (this.level.doorTiles.length) {
      const xs = this.level.doorTiles.map((d) => d[0]); const ys = this.level.doorTiles.map((d) => d[1]);
      const col = xs[0], bottom = Math.max(...ys);
      this.objects.push({ kind: 'door', x: col * TILE - 6, y: (bottom - 2) * TILE, w: TILE + 12, h: 3 * TILE, cond: rng.pick(CONDITIONS.filter((c) => c.p <= 0.34)), used: false, col });
      // đồ trong hầm thuộc cửa: đánh dấu
      for (const o of this.objects) if ((o.kind === 'chest' || o.kind === 'pedestal') && o.x > col * TILE) { o.vault = true; if (o.kind === 'pedestal') o.weapon = this.run.randomWeapon(2); }
    }
    // Quái: chia 2 đợt cho phòng chiến đấu
    if (room.kind === 'combat') {
      const typesByDepth = depth <= 1 ? [['scarecrow', 5], ['hound', 2], ['archer', 2]]
        : depth <= 3 ? [['scarecrow', 4], ['hound', 3], ['archer', 3], ['cultist', 2], ['shield', 1]]
          : [['scarecrow', 3], ['hound', 3], ['archer', 3], ['cultist', 3], ['shield', 3]];
      const chMap = { m: 'scarecrow', h: 'hound', a: 'archer', c: 'cultist', s: 'shield' };
      // Quái khó (tà đồ, khiên binh) chỉ xuất hiện từ độ sâu 3
      const introduced = { cultist: 3, shield: 3, hound: 1, archer: 1, scarecrow: 1 };
      const list = spawnMarkers.map((sm) => {
        let type = sm.ch === 'e' ? rng.weighted(typesByDepth) : chMap[sm.ch];
        if (depth < introduced[type]) type = rng.weighted(typesByDepth);
        return { ...sm, type };
      });
      // thêm quái theo độ sâu ở các điểm 'e'
      const extra = Math.max(0, depth - 2);
      const eMarks = list.filter((l) => l.ch === 'e');
      for (let i = 0; i < extra && eMarks.length; i++) { const b = rng.pick(eMarks); list.push({ ...b, x: b.x + rand(-30, 30), type: rng.weighted(typesByDepth) }); }
      const shuffled = rng.shuffle(list);
      const half = Math.ceil(shuffled.length * 0.6);
      this.wave1 = shuffled.slice(0, half); this.wave2 = shuffled.slice(half);
      if (room.elite) {
        const elitePick = this.wave2.length ? this.wave2 : this.wave1;
        const tgt = elitePick[elitePick.length - 1]; tgt.elite = rng.pick(Object.keys(ELITE_AFFIXES));
      }
      for (const e of this.wave1) this.spawnEnemy(e, depth, 0.2 + Math.random() * 0.5);
    }
    if (room.kind === 'boss') this.bossPending = true;

    this.player = new Player(this.spawn.x - 5, this.spawn.y - 20);
    this.player.airJumps = this.run.stats.jumps - 1;
    this.camera.snapTo(this.player);
    this.ui.roomTitle(room.title, room.kind);
    const mood = room.kind === 'boss' ? null : room.kind === 'forge' || room.kind === 'dice' || room.kind === 'intro' ? 'rest' : 'field';
    if (mood) this.audio.startMusic(mood); else this.audio.stopMusic();
  }

  spawnEnemy(e, depth, delay = 0) {
    const en = new Enemy(e.type, e.x, e.y, depth, e.elite || null);
    en.t = 0.6 + delay;
    this.enemies.push(en);
    this.fx.burst(e.x, e.y - 10, 14, { colors: ['#3a2a3a', '#6a4a5a', '#ff8a3d'], speed: 60, life: 0.6, grav: -60 });
  }

  makePedestal(x, y, room) {
    const w = room.kind === 'intro' ? makeWeapon('bow', 1, 0) : this.run.randomWeapon(1);
    return { kind: 'pedestal', x: x - 8, y: y - 14, w: 16, h: 14, weapon: w, taken: false, t: Math.random() * 6 };
  }

  makeChest(x, y, room) {
    const rng = this.run.rng;
    let cond;
    if (room.kind === 'intro') cond = { id: 'tut', label: 'Ra từ 2 trở lên', short: '≥ 2', dice: 1, test: (f) => f[0] >= 2, p: 5 / 6 };
    else cond = rng.pick(CONDITIONS);
    return { kind: 'chest', x: x - 9, y: y - 14, w: 18, h: 14, cond, state: 'closed', rerolls: this.run.stats.chestRerolls, t: 0, vault: false };
  }

  makeStock() {
    const r = this.run;
    return [
      { kind: 'weapon', weapon: r.randomWeapon(1), price: 0, sold: false },
      { kind: 'flask', price: 35, sold: false },
      { kind: 'hp', price: 60, sold: false },
    ].map((it) => { if (it.kind === 'weapon') it.price = [0, 70, 120, 190][it.weapon.tier]; return it; });
  }

  // ================= VÒNG LẶP =================
  update(dt) {
    const run = this.run;
    run.time += dt;
    this.roomTime += dt;
    if (this.transition) { this.updateTransition(dt); }
    if (this.hitstop > 0) { this.hitstop -= dt; this.camera.update(dt * 0.2, this.player); this.fx.update(dt * 0.15); return; }
    if (this.slowmo > 0) { this.slowmo -= dt; dt *= 0.35; }

    const p = this.player;
    if (!this.transition) p.update(dt, this);
    this.updateFateDice(dt);

    // Boss xuất hiện khi người chơi bước vào giữa đấu trường
    if (this.bossPending && p.cx > this.level.pw * 0.32) {
      this.bossPending = false;
      this.boss = new Boss(this.bossSpawn.x, this.bossSpawn.y, run.depth);
      this.enemies.push(this.boss);
      this.ui.bossIntro(this.boss);
      this.audio.play('bossRoar'); this.audio.startMusic('boss'); this.camera.shake(0.5);
    }

    for (const e of this.enemies) e.update(dt, this);
    this.enemies = this.enemies.filter((e) => !e.remove);
    for (const pd of this.pending) pd.t -= dt;
    this.pending = this.pending.filter((pd) => { if (pd.t <= 0) { pd.fn(); return false; } return true; });
    this.updateProjectiles(dt);
    this.updateObjects(dt);
    this.fx.update(dt);
    this.camera.update(dt, p);

    // Đợt 2 & dọn phòng
    if (!this.cleared && this.run.room.kind === 'combat') {
      const alive = this.enemies.filter((e) => !e.dead && e.type !== 'dummy');
      if (!this.waveSpawned && this.wave2 && (alive.length <= Math.max(1, Math.floor(this.wave1.length * 0.35)))) {
        this.waveSpawned = true;
        this.wave2.forEach((e, i) => this.spawnEnemy(e, run.depth, i * 0.25));
        if (this.wave2.length) this.toast('Đợt quái thứ hai!');
      }
      if (this.waveSpawned && alive.length === 0) this.onRoomCleared();
    }

    // Tương tác
    this.updateInteraction();
    this.ui.updateHud(this);
  }

  onRoomCleared() {
    this.cleared = true;
    const gate = this.objects.find((o) => o.kind === 'gate');
    if (gate) gate.open = true;
    this.audio.play('gate');
    this.toast('Đã dọn sạch — cổng đã mở');
    // Phần thưởng vũ khí rơi xuống gần người chơi
    const w = this.run.randomWeapon(0);
    this.dropWeapon(w, clamp(this.player.cx + this.player.facing * 40, 40, this.level.pw - 40), this.player.y - 60);
    this.slowmo = 0.5;
  }

  dropWeapon(w, x, y) {
    this.objects.push({ kind: 'drop', weapon: w, x: x - 8, y, w: 16, h: 12, vx: 0, vy: -120, t: 0, onGround: false });
  }

  // ================= XÚC XẮC VẬN MỆNH (combat) =================
  rollFateDice() {
    const p = this.player, run = this.run;
    if (p.diceAnim) return;
    if (p.fate) { this.toast('Kết quả xúc xắc đang chờ đòn kế tiếp'); return; }
    if (run.fate < 100) { this.toast(`Vận Mệnh chưa đầy (${Math.floor(run.fate)}%) — đánh trúng để nạp`); this.audio.play('menu'); return; }
    run.fate = 0;
    p.diceAnim = { t: 0.55, face: 1, flick: 0 };
    this.audio.play('dice');
  }

  updateFateDice(dt) {
    const p = this.player;
    const d = p.diceAnim;
    if (d) {
      d.t -= dt; d.flick -= dt;
      if (d.flick <= 0) { d.flick = 0.06; d.face = randi(1, 6); }
      if (d.t <= 0) {
        const face = rollDie(this.run.stats.diceMin);
        p.diceAnim = null;
        p.fate = { face, hits: this.run.stats.fateHits, t: 7, show: 1.2 };
        this.audio.play('diceLand');
        const crit = face === 6 || (face === 5 && this.run.stats.sixOn5);
        const label = crit ? `${face}! CHÍ MẠNG ĐỊNH MỆNH x${this.run.stats.fateCritMul}` : face >= 4 ? `${face} · ĐÒN MẠNH x2` : face >= 2 ? `${face} · đòn thường` : '1 · HỤT!';
        const col = crit ? '#ff5ad1' : face >= 4 ? '#ffa24a' : face >= 2 ? '#d8d2c4' : '#8a8a9a';
        this.fx.text(p.cx, p.y - 20, label, col, 1.4);
        if (crit) { this.audio.play('fate6'); this.fx.ring(p.cx, p.cy, 4, 40, '#ff5ad1', 0.4); this.camera.shake(0.15); }
        if (face >= 2 && face <= 3 && !crit) { this.run.fate = 35; }
      }
    }
    if (p.fate) { p.fate.t -= dt; p.fate.show = Math.max(0, p.fate.show - dt); if (p.fate.t <= 0) { p.fate = null; this.toast('Vận mệnh đã trôi qua'); } }
  }

  // Tính hệ số của xúc xắc khi đòn trúng; trả về {mult, kind}
  consumeFate(a) {
    const p = this.player;
    if (a.fateResult !== undefined) return a.fateResult;
    if (!p.fate) { a.fateResult = null; return null; }
    const st = this.run.stats;
    const f = p.fate.face;
    let res;
    if (f === 6 || (f === 5 && st.sixOn5)) res = { mult: st.fateCritMul, kind: 'fate', crit: true };
    else if (f >= 4) res = { mult: 2, kind: 'heavy' };
    else if (f >= 2) res = { mult: 1, kind: null };
    else {
      res = { mult: 0.25, kind: 'weak', miss: true };
      if (st.gambler) { this.run.hp = Math.max(1, this.run.hp - 5); this.fx.number(p.cx, p.y - 6, 5, 'player'); }
    }
    p.fate.hits--;
    if (p.fate.hits <= 0) p.fate = null;
    a.fateResult = res;
    return res;
  }

  // ================= COMBAT NGƯỜI CHƠI =================
  spawnSlash(p, a) {
    const arc = a.step.arc; const def = a.def;
    const tier = TIERS[a.w.tier - 1];
    const col = a.w.tier === 3 ? '#ffcf6a' : a.w.tier === 2 ? '#a8dcff' : '#f2ead8';
    const oy = p.y + p.h - 12;
    if (arc.thrust) {
      this.fx.slash({ x: p.cx, y: oy + (arc.a0 + arc.a1) * 0.1, dir: p.facing, r0: arc.r0, r1: arc.r1, a0: -0.05, a1: 0.05, color: col, edge: '#ffffff', life: 0.1, thrust: true });
    } else {
      this.fx.slash({ x: p.cx, y: oy, dir: p.facing, r0: arc.r0, r1: arc.r1, a0: arc.a0 * Math.PI / 180, a1: arc.a1 * Math.PI / 180, color: col, edge: '#ffffff', life: Math.max(0.1, a.step.active + 0.04) });
    }
    void tier; void def;
  }

  meleeCheck(p, a) {
    const box = p.hitbox(a);
    for (const e of this.enemies) {
      if (e.dead || a.hit.has(e) || e.state === 'spawn') continue;
      if (!overlap(box, e)) continue;
      a.hit.add(e);
      this.playerHitEnemy(e, a, a.step.dmg, { melee: true, kb: a.step.kb, fromX: p.cx, dir: p.facing, hitstop: a.step.hitstop, shake: a.step.shake || 0, box });
    }
    // phá cửa gỗ? (không) — chém trúng rương tập: không
  }

  playerHitEnemy(e, a, base, o) {
    const p = this.player, run = this.run, st = run.stats;
    const def = a.def, w = a.w;
    const info = { kb: o.kb || 0, fromX: o.fromX, dir: o.dir, armorBreak: def.armorBreak, stun: def.stun };
    // khiên chặn trước khi tính
    const fate = this.consumeFate(a);
    info.fateCrit = fate && fate.crit;
    if (e.blocks && e.blocks(o.fromX, info)) {
      this.audio.play('block');
      this.fx.burst(e.cx + e.facing * 6, e.cy - 2, 8, { colors: ['#fff', '#ffd23f', '#9fb4c8'], speed: 120, life: 0.25 });
      this.fx.number(e.cx, e.y - 4, 0, 'block');
      e.vx = -Math.sign(o.fromX - e.cx) * 40;
      this.hitstop = Math.max(this.hitstop, 0.04);
      if (o.melee) p.vx = -p.facing * 120;
      return;
    }
    let mult = weaponPower(w) * (o.melee ? st.meleeMul : st.rangedMul);
    if (st.berserk && run.hp < st.maxHp * 0.5) mult *= 1.35;
    if (st.comboStack) mult *= 1 + Math.min(0.4, (this.comboHits || 0) * 0.04);
    if (def.backstab && e.facing === Math.sign(e.cx - p.cx) && !e.isBoss) mult *= def.backstab;
    let kind = o.melee && (o.kb >= 180) ? 'heavy' : 'normal';
    let critChance = st.critChance + (w.trait === 'keen' ? 0.15 : 0) + (def.critBonus || 0);
    if (def.tipCrit && o.box && Math.abs(e.cx - p.cx) > 40) critChance += def.tipCrit;
    let crit = false;
    if (fate) { mult *= fate.mult; if (fate.kind) kind = fate.kind; if (fate.crit) crit = true; }
    else if (Math.random() < critChance) { mult *= st.critMul; kind = 'crit'; crit = true; }
    const dmg = Math.max(1, Math.round(base * mult));
    // Hiệu ứng
    const hs = (o.hitstop || 0.04) * (crit ? 1.8 : 1) * (fate && fate.crit ? 1.6 : 1);
    this.hitstop = Math.max(this.hitstop, hs);
    this.camera.shake((o.shake || 0.06) + (crit ? 0.18 : 0));
    this.audio.play(crit ? 'crit' : kind === 'heavy' ? 'heavyHit' : 'hit');
    if (fate && fate.crit) { this.fx.flash('rgba(255,90,209,0.25)', 0.12); this.slowmo = 0.25; }
    if (fate && fate.miss) this.fx.text(e.cx, e.y - 10, 'HỤT', '#8a8a9a', 0.8);
    const hx = clamp(o.melee ? e.cx - o.dir * e.w * 0.3 : e.cx, e.x, e.x + e.w), hy = e.cy - 2;
    this.fx.burst(hx, hy, crit ? 18 : 9, { colors: crit ? ['#fff', '#ffd23f', '#ff5ad1'] : ['#fff', '#ffe2b0', '#ffb36a'], speed: crit ? 200 : 140, life: 0.25, grav: 200, spread: 1.6, dir: o.dir > 0 ? 0 : Math.PI });
    this.fx.burst(hx, hy, 5, { colors: e.type === 'archer' ? ['#e8e0cc'] : e.type === 'cultist' ? ['#6a3a8a', '#2a1a3a'] : ['#c9a45a', '#8a6a32', '#3a2a22'], speed: 100, life: 0.5, grav: 500, spread: 1.4, dir: o.dir > 0 ? -0.4 : Math.PI + 0.4 });
    this.damageEnemy(e, dmg, { kind, info, crit, weapon: w, melee: o.melee });
    // Nạp vận mệnh
    if (!(fate)) run.fate = Math.min(100, run.fate + 7 * st.fateGain * (w.trait === 'fated' ? 1.5 : 1));
    this.comboHits = (this.comboHits || 0) + 1; this.comboTimer = 1.2;
    // Hiệu ứng trạng thái theo vũ khí/phúc lành
    if (w.trait === 'burn' || (o.melee && st.burnOnHit)) { e.status.burn = 3; e.status.burnDps = Math.max(e.status.burnDps, 4 + run.depth * 1.5); }
    if (w.trait === 'bleed') { e.status.bleed = 4; e.status.bleedStacks = Math.min(6, e.status.bleedStacks + 1); }
    if (w.trait === 'vamp') run.heal(Math.max(1, Math.round(dmg * 0.03)));
    if (st.freezeChance && Math.random() < st.freezeChance && !e.isBoss) { e.status.freeze = 1; this.fx.text(e.cx, e.y - 8, 'ĐÓNG BĂNG', '#9fe8ff', 0.8); }
    if (crit && st.chainOnCrit) this.chainLightning(e.cx, e.cy, Math.round(dmg * 0.4), 3, new Set([e]));
  }

  damageEnemy(e, amount, opt = {}) {
    if (e.dead) return;
    const { kind = 'normal', info = {} } = opt;
    let dmg = amount;
    if (e.elite === 'armored') dmg *= 0.6;
    dmg = Math.max(kind === 'dot' ? 1 : 1, Math.round(dmg));
    e.takeHit(dmg, info, this);
    this.run.damageDealt += dmg;
    if (kind !== 'dot') this.fx.number(e.cx, e.y - 6, dmg, kind === 'normal' ? 'normal' : kind);
    else this.fx.number(e.cx, e.y - 6, dmg, 'weak');
    if (e.hp <= 0) this.killEnemy(e);
  }

  killEnemy(e) {
    if (e.dead) return;
    e.dead = true; e.hp = 0;
    const run = this.run, st = run.stats;
    if (e.type === 'dummy') { e.dead = false; e.hp = e.maxHp; return; }
    run.kills++;
    this.audio.play('enemyDie');
    this.fx.burst(e.cx, e.cy, 22, { colors: ['#3a2a22', '#6e6058', '#ff8a3d', '#c9a45a'], speed: 160, life: 0.7, grav: 300 });
    e.vy = -150; e.vx = Math.sign(e.cx - this.player.cx) * 120;
    run.fate = Math.min(100, run.fate + 12 * st.fateGain);
    if (st.lifeOnKill) { run.heal(st.lifeOnKill); this.fx.number(this.player.cx, this.player.y - 8, st.lifeOnKill, 'heal'); }
    // vàng
    if (!e.isBoss) {
      const [g0, g1] = e.T.gold;
      const amount = Math.round(randi(g0, g1) * (1 + run.depth * 0.25) * (e.elite ? 3 : 1));
      const coins = Math.min(8, Math.max(1, Math.ceil(amount / 4)));
      for (let i = 0; i < coins; i++) this.objects.push({ kind: 'coin', x: e.cx, y: e.cy, w: 4, h: 4, vx: rand(-90, 90), vy: rand(-220, -120), value: Math.ceil(amount / coins), t: 0 });
    }
    if (e.elite) {
      this.dropWeapon(run.randomWeapon(1), e.cx, e.y - 20);
      if (e.elite === 'volatile') {
        this.pending.push({ t: 0.35, fn: () => { this.explosion(e.cx, e.cy, 44, 18, 'enemy'); } });
        this.fx.text(e.cx, e.y - 10, 'SẮP NỔ!', '#ffb340', 0.6);
      }
    }
    if (e.isBoss) this.onBossDefeated(e);
  }

  explosion(x, y, r, dmg, owner) {
    this.audio.play('explode'); this.camera.shake(0.35);
    this.fx.burst(x, y, 30, { colors: ['#fff2b0', '#ffb340', '#ff5a3c', '#3a2a22'], speed: 200, life: 0.5, grav: 100, glow: true });
    this.fx.ring(x, y, 4, r, '#ffb340', 0.3);
    if (owner === 'enemy') { const p = this.player; if (Math.hypot(p.cx - x, p.cy - y) < r + 6) this.hurtPlayer(dmg, x); }
  }

  rollStrike(p) {
    const st = this.run.stats;
    for (const e of this.enemies) {
      if (e.dead || p.rollHit.has(e) || !overlap(p, e)) continue;
      p.rollHit.add(e);
      this.damageEnemy(e, st.rollDamage * (1 + 0.15 * this.run.depth), { kind: 'normal', info: { kb: 60, fromX: p.cx } });
      this.fx.burst(e.cx, e.cy, 6, { colors: ['#b8f0d8', '#fff'], speed: 100, life: 0.25 });
    }
  }

  spawnShockwave(p, a) {
    const sw = a.step.shockwave;
    for (const dir of [-1, 1]) {
      this.projectiles.push({ owner: 'player', kind: 'shock', x: p.cx + dir * 10, y: p.y + p.h - 8, vx: dir * sw.speed, vy: 0, grav: 0, dmg: sw.dmg, life: sw.life, r: 7, pierce: true, hit: new Set(), a, ground: true });
    }
    this.fx.dust(p.cx, p.y + p.h, 16);
    this.fx.ring(p.cx, p.y + p.h, 3, 30, '#e8d8b0', 0.3);
  }

  firePlayerShot(p, a, shot) {
    const dir = p.facing;
    const y = p.y + 8;
    const proj = { owner: 'player', kind: shot.kind, x: p.cx + dir * 8, y, vx: dir * shot.speed, vy: shot.kind === 'arrow' ? -30 : 0, grav: shot.grav || 0, dmg: shot.dmg, life: 1.6, r: shot.kind === 'fireball' ? 5 : 3, pierce: false, hit: new Set(), a, explode: shot.explode, slow: shot.slow, trail: 0 };
    // Bắn hơi chéo lên/xuống nếu giữ W/S
    if (this.input.down('up')) { proj.vy = -shot.speed * 0.45; proj.vx *= 0.9; }
    else if (this.input.down('down') && !p.onGround) { proj.vy = shot.speed * 0.45; proj.vx *= 0.9; }
    this.projectiles.push(proj);
    p.vx -= dir * 25;
    this.fx.burst(proj.x, proj.y, 4, { colors: [WEAPONS[a.w.id].color, '#fff'], speed: 60, life: 0.15, grav: 0, spread: 0.8, dir: dir > 0 ? 0 : Math.PI });
  }

  fireChain(p, a, ch) {
    const st = this.run.stats;
    let targets = this.enemies.filter((e) => !e.dead && e.state !== 'spawn' && Math.abs(e.cx - p.cx) < ch.range && Math.sign(e.cx - p.cx) !== -p.facing && Math.abs(e.cy - p.cy) < 100);
    targets.sort((x, y) => Math.abs(x.cx - p.cx) - Math.abs(y.cx - p.cx));
    let from = { x: p.cx + p.facing * 8, y: p.y + 8 };
    if (!targets.length) {
      this.fx.burst(from.x + p.facing * 30, from.y, 10, { colors: ['#8fe3ff', '#fff'], speed: 80, life: 0.3 });
      this.fx.slash({ x: from.x, y: from.y, dir: p.facing, r0: 2, r1: 46, a0: -0.04, a1: 0.04, color: '#8fe3ff', edge: '#fff', life: 0.08, thrust: true });
      return;
    }
    const hitSet = new Set();
    let cur = targets[0];
    for (let j = 0; j <= ch.jumps && cur; j++) {
      hitSet.add(cur);
      this.fx.bolts = this.fx.bolts || [];
      this.boltFx(from.x, from.y, cur.cx, cur.cy);
      this.playerHitEnemy(cur, a, ch.dmg, { melee: false, kb: 40, fromX: from.x, dir: Math.sign(cur.cx - from.x) || 1, hitstop: 0.03 });
      from = { x: cur.cx, y: cur.cy };
      cur = this.enemies.filter((e) => !e.dead && !hitSet.has(e) && Math.hypot(e.cx - from.x, e.cy - from.y) < 110).sort((x, y) => Math.hypot(x.cx - from.x, x.cy - from.y) - Math.hypot(y.cx - from.x, y.cy - from.y))[0];
    }
    void st;
  }

  chainLightning(x, y, dmg, jumps, hitSet) {
    let from = { x, y };
    for (let j = 0; j < jumps; j++) {
      const cur = this.enemies.filter((e) => !e.dead && !hitSet.has(e) && Math.hypot(e.cx - from.x, e.cy - from.y) < 120)[0];
      if (!cur) break;
      hitSet.add(cur); this.boltFx(from.x, from.y, cur.cx, cur.cy);
      this.damageEnemy(cur, dmg, { kind: 'crit', info: { kb: 30, fromX: from.x } });
      from = { x: cur.cx, y: cur.cy };
    }
    this.audio.play('zap');
  }

  boltFx(x0, y0, x1, y1) {
    const n = Math.max(3, Math.floor(Math.hypot(x1 - x0, y1 - y0) / 6));
    let px = x0, py = y0;
    for (let i = 1; i <= n; i++) {
      const t = i / n;
      const nx = x0 + (x1 - x0) * t + (i < n ? rand(-5, 5) : 0), ny = y0 + (y1 - y0) * t + (i < n ? rand(-5, 5) : 0);
      const steps = Math.ceil(Math.hypot(nx - px, ny - py));
      for (let k = 0; k < steps; k++) this.fx.parts.push({ x: px + (nx - px) * k / steps, y: py + (ny - py) * k / steps, vx: 0, vy: 0, life: 0.14, max: 0.14, color: k % 3 ? '#8fe3ff' : '#ffffff', size: 1, grav: 0, drag: 1 });
      px = nx; py = ny;
    }
  }

  // ================= ĐẠN =================
  spawnEnemyShot(kind, x, y, vx, vy, dmg, o = {}) {
    this.projectiles.push({ owner: 'enemy', kind, x, y, vx, vy, grav: 0, dmg, life: o.life || 2.5, r: kind === 'orb' ? 4 : kind === 'flamewave' ? 8 : 3, homing: o.homing || 0, delay: o.delay || 0, ground: !!o.ground, hit: new Set() });
  }

  spawnCrow(x, delay, dmg) {
    this.projectiles.push({ owner: 'enemy', kind: 'crow', x, y: -10, vx: 0, vy: 0, dmg, life: delay + 2, r: 5, warn: delay, delay, hit: new Set(), tx: x });
  }

  updateProjectiles(dt) {
    const lv = this.level, p = this.player;
    for (const pr of this.projectiles) {
      if (pr.delay > 0) { pr.delay -= dt; if (pr.kind === 'crow') pr.warn = pr.delay; continue; }
      pr.life -= dt;
      if (pr.kind === 'crow' && pr.vy === 0) { pr.vy = 380; pr.y = this.camera.y - 10; this.audio.play('swing', { pitch: 2 }); }
      if (pr.homing && pr.owner === 'enemy') {
        const ang = Math.atan2(p.cy - pr.y, p.cx - pr.x);
        const sp = Math.hypot(pr.vx, pr.vy);
        pr.vx += Math.cos(ang) * pr.homing * 60 * dt; pr.vy += Math.sin(ang) * pr.homing * 60 * dt;
        const nsp = Math.hypot(pr.vx, pr.vy); pr.vx *= sp / nsp; pr.vy *= sp / nsp;
      }
      pr.vy += (pr.grav || 0) * dt;
      pr.x += pr.vx * dt; pr.y += pr.vy * dt;
      // vệt
      if (pr.kind === 'fireball' && Math.random() < 0.8) this.fx.burst(pr.x, pr.y, 1, { colors: ['#ff8a3d', '#ffd23f', '#ff5a3c'], speed: 20, life: 0.3, grav: -40 });
      if (pr.kind === 'orb' && Math.random() < 0.5) this.fx.burst(pr.x, pr.y, 1, { colors: ['#b38aff', '#5a2a8a'], speed: 10, life: 0.3, grav: 0 });
      if (pr.kind === 'ice' && Math.random() < 0.5) this.fx.burst(pr.x, pr.y, 1, { colors: ['#dff8ff', '#9fe8ff'], speed: 10, life: 0.25, grav: 0 });
      if ((pr.kind === 'flamewave') && Math.random() < 0.9) this.fx.burst(pr.x, pr.y + 4, 2, { colors: ['#ff8a3d', '#ffd23f', '#ff3c1e'], speed: 40, life: 0.4, grav: -120 });
      if (pr.kind === 'shock' && Math.random() < 0.7) this.fx.dust(pr.x, pr.y + 7, 1);
      // va địa hình
      if (pr.ground) {
        const below = lv.groundAt(pr.x, pr.y + 12);
        if (!below || lv.pointSolid(pr.x + Math.sign(pr.vx) * 4, pr.y)) pr.life = 0;
      } else if (pr.kind !== 'crow' && lv.pointSolid(pr.x, pr.y)) {
        pr.life = 0;
        if (pr.explode) this.playerExplosion(pr);
        else this.fx.burst(pr.x, pr.y, 5, { colors: ['#d8c49a', '#fff'], speed: 60, life: 0.2 });
      }
      if (pr.kind === 'crow' && pr.vy > 0 && lv.groundAt(pr.x, pr.y + 4)) { pr.life = 0; this.fx.burst(pr.x, pr.y, 8, { colors: ['#1a1418', '#3a2a3a', '#ff8a3d'], speed: 80, life: 0.3 }); }
      if (pr.life <= 0) continue;
      // va chạm mục tiêu
      const hb = { x: pr.x - pr.r, y: pr.y - pr.r, w: pr.r * 2, h: pr.r * 2 };
      if (pr.owner === 'player') {
        for (const e of this.enemies) {
          if (e.dead || pr.hit.has(e) || e.state === 'spawn' || !overlap(hb, e)) continue;
          pr.hit.add(e);
          this.playerHitEnemy(e, pr.a, pr.dmg, { melee: false, kb: pr.kind === 'shock' ? 120 : 70, fromX: pr.x - pr.vx * 0.05, dir: Math.sign(pr.vx) || 1, hitstop: pr.kind === 'shock' ? 0.06 : 0.035, shake: 0.05 });
          if (pr.slow) { e.status.slow = Math.max(e.status.slow, pr.slow); e.status.ice = (e.status.ice || 0) + 1; if (e.status.ice >= 3 && !e.isBoss) { e.status.ice = 0; e.status.freeze = 1.5; this.fx.text(e.cx, e.y - 8, 'ĐÓNG BĂNG', '#9fe8ff', 0.8); } }
          if (pr.explode) { this.playerExplosion(pr); pr.life = 0; break; }
          if (!pr.pierce) { pr.life = 0; break; }
        }
      } else if (!p.dead) {
        if (overlap(hb, p)) {
          if (this.hurtPlayer(pr.dmg, pr.x)) { if (pr.kind !== 'flamewave') pr.life = 0; }
        }
      }
    }
    this.projectiles = this.projectiles.filter((pr) => pr.life > 0 && pr.x > -50 && pr.x < this.level.pw + 50 && pr.y < this.level.ph + 50);
  }

  playerExplosion(pr) {
    const ex = pr.explode;
    this.audio.play('explode'); this.camera.shake(0.18);
    this.fx.burst(pr.x, pr.y, 22, { colors: ['#fff2b0', '#ffb340', '#ff5a3c'], speed: 150, life: 0.4, grav: 50, glow: true });
    this.fx.ring(pr.x, pr.y, 3, ex.r, '#ffb340', 0.25);
    for (const e of this.enemies) {
      if (e.dead || Math.hypot(e.cx - pr.x, e.cy - pr.y) > ex.r + e.w / 2) continue;
      if (pr.hit.has(e)) continue;
      pr.hit.add(e);
      this.playerHitEnemy(e, pr.a, ex.dmg, { melee: false, kb: 120, fromX: pr.x, dir: Math.sign(e.cx - pr.x) || 1, hitstop: 0.03 });
    }
  }

  // ================= NGƯỜI CHƠI BỊ ĐÁNH =================
  hitPlayerBox(box, dmg, fromX) {
    const p = this.player;
    if (p.dead || p.invulnerable || !overlap(box, p)) {
      // né trong gang tấc khi đang lướt: thưởng vận mệnh
      if (!p.dead && p.rolling && overlap(box, p) && !this._perfectT) { this._perfectT = 0.4; this.run.fate = Math.min(100, this.run.fate + 10); this.fx.text(p.cx, p.y - 12, 'NÉ HOÀN HẢO', '#b8f0d8', 0.7); this.slowmo = 0.15; setTimeout(() => { this._perfectT = 0; }, 400); }
      return false;
    }
    return this.hurtPlayer(dmg, fromX);
  }

  hurtPlayer(dmg, fromX, environmental = false) {
    const p = this.player, run = this.run;
    if (p.dead || p.invulnerable) return false;
    run.hp -= dmg;
    this.comboHits = 0;
    this.audio.play('hurt');
    this.camera.shake(0.35);
    this.hitstop = Math.max(this.hitstop, 0.07);
    this.fx.number(p.cx, p.y - 4, dmg, 'player');
    this.fx.flash('rgba(255,40,40,0.14)', 0.14);
    this.fx.burst(p.cx, p.cy, 10, { colors: ['#ff4d4d', '#8e1f1f', '#fff'], speed: 120, life: 0.4 });
    p.onHurt(dmg, fromX, this);
    if (!environmental && run.stats.thorns) {
      const near = this.enemies.filter((e) => !e.dead && Math.hypot(e.cx - p.cx, e.cy - p.cy) < 70)[0];
      if (near) this.damageEnemy(near, run.stats.thorns, { kind: 'normal', info: { kb: 80, fromX: p.cx } });
    }
    if (run.hp <= 0) {
      if (run.stats.revives > 0) {
        run.stats.revives--; run.hp = Math.round(run.stats.maxHp * 0.5); p.iframes = 2;
        this.fx.ring(p.cx, p.cy, 4, 80, '#ffb340', 0.8); this.fx.burst(p.cx, p.cy, 40, { colors: ['#ffb340', '#ff5a3c', '#fff2b0'], speed: 160, life: 0.8, grav: -80, glow: true });
        this.toast('Tro Tàn Tái Sinh — Kael đứng dậy!'); this.audio.play('buff'); this.slowmo = 0.8;
      } else this.onPlayerDeath();
    }
    return true;
  }

  respawnPlayerSafe() {
    const p = this.player;
    p.x = this.spawn.x - 5; p.y = this.spawn.y - 22; p.vx = 0; p.vy = 0;
    // tìm chỗ đứng gần nhất phía trước điểm xuất phát nếu người chơi đã đi xa
  }

  onPlayerDeath() {
    const p = this.player;
    p.dead = true; this.run.hp = 0;
    this.audio.play('death'); this.audio.stopMusic();
    this.slowmo = 1.5; this.camera.shake(0.5);
    this.fx.burst(p.cx, p.cy, 40, { colors: ['#8e1f1f', '#3a2a22', '#c83a2e', '#9aa4ae'], speed: 180, life: 1, grav: 300 });
    this.pending.push({ t: 1.2, fn: () => this.game.onRunEnd(false) });
  }

  onBossDefeated(b) {
    this.audio.stopMusic(); this.audio.play('bossRoar', { pitch: 0.7 });
    this.slowmo = 2; this.camera.shake(0.8);
    this.ui.bossBar(null);
    this.toast('Hiệp Sĩ Bù Nhìn đã gục ngã');
    this.cleared = true;
    const gate = this.objects.find((o) => o.kind === 'gate'); if (gate) gate.open = true;
    for (let i = 0; i < 20; i++) this.objects.push({ kind: 'coin', x: b.cx, y: b.cy, w: 4, h: 4, vx: rand(-140, 140), vy: rand(-300, -150), value: 6, t: 0 });
    this.pending.push({ t: 1.5, fn: () => { b.remove = true; this.fx.burst(b.cx, b.cy, 60, { colors: ['#ffb340', '#c9a45a', '#3a2a22', '#9aa4ae'], speed: 220, life: 1.2, grav: 200 }); } });
  }

  // ================= ĐỐI TƯỢNG & TƯƠNG TÁC =================
  updateObjects(dt) {
    const p = this.player, run = this.run, lv = this.level;
    for (const o of this.objects) {
      o.t = (o.t || 0) + dt;
      if (o.kind === 'coin') {
        const d = Math.hypot(p.cx - o.x, p.cy - o.y);
        if (o.t > 0.35 && d < 60) { const k = 600 * dt / Math.max(8, d); o.vx += (p.cx - o.x) * k * 6; o.vy += (p.cy - o.y) * k * 6; o.vx *= 0.9; o.vy *= 0.9; }
        else { o.vy += 700 * dt; }
        o.x += o.vx * dt;
        const oy = o.y; o.y += o.vy * dt;
        if (lv.groundAt(o.x, o.y + 2) && o.vy > 0 && !(o.t > 0.35 && d < 60)) { o.y = oy; o.vy *= -0.35; o.vx *= 0.7; }
        if (lv.pointSolid(o.x, o.y)) { o.x -= o.vx * dt; o.vx *= -0.5; }
        if (d < 10 && o.t > 0.2) { o.dead = true; const v = Math.round(o.value * run.stats.goldMul); run.gold += v; this.audio.play('coin', { pitch: 0.9 + Math.random() * 0.3 }); }
      }
      if (o.kind === 'drop') {
        o.vy = Math.min(o.vy + 700 * dt, 400);
        const e = { x: o.x, y: o.y, w: o.w, h: o.h };
        lv.moveX(e, (o.vx || 0) * dt);
        if (lv.moveY(e, o.vy * dt)) { if (!o.onGround && o.vy > 100) { this.fx.dust(o.x + 8, o.y + 12, 6); this.audio.play('land'); } o.vy = 0; o.onGround = true; }
        o.x = e.x; o.y = e.y;
      }
      if (o.kind === 'gate' && o.open) o.glow = Math.min(1, o.glow + dt * 2);
    }
    this.objects = this.objects.filter((o) => !o.dead);
    if (this.comboTimer > 0) { this.comboTimer -= dt; if (this.comboTimer <= 0) this.comboHits = 0; }
  }

  nearestInteractable() {
    const p = this.player;
    const zone = { x: p.x - 10, y: p.y - 6, w: p.w + 20, h: p.h + 12 };
    let best = null, bd = 1e9;
    for (const o of this.objects) {
      if (!['chest', 'pedestal', 'drop', 'gate', 'sign', 'forge', 'merchant', 'door'].includes(o.kind)) continue;
      if (o.kind === 'chest' && o.state !== 'closed') continue;
      if (o.kind === 'pedestal' && o.taken) continue;
      if (o.kind === 'door' && o.used) continue;
      const box = o.kind === 'door' ? { x: o.x - 10, y: o.y, w: o.w + 4, h: o.h } : o;
      if (!overlap(zone, box)) continue;
      const d = Math.abs(o.x + o.w / 2 - p.cx);
      if (d < bd) { bd = d; best = o; }
    }
    return best;
  }

  updateInteraction() {
    const p = this.player;
    if (p.dead || this.transition) { this.ui.prompt(null); return; }
    const o = this.nearestInteractable();
    this.focus = o;
    if (!o) { this.ui.prompt(null); this.ui.weaponCompare(null); return; }
    const inp = this.input;
    switch (o.kind) {
      case 'sign': this.ui.prompt(o.text, null); break;
      case 'gate':
        if (!o.open) this.ui.prompt('Cổng bị phong ấn — hạ hết kẻ địch để mở', null);
        else { this.ui.prompt('Đi tiếp', 'E'); if (inp.pressed('interact')) this.exitRoom(); }
        break;
      case 'chest':
        this.ui.prompt(`Rương xúc xắc · cần: <b>${o.cond.label}</b>${o.vault ? ' · (trong hầm)' : ''}`, 'E');
        if (inp.pressed('interact')) this.openDiceChallenge(o);
        break;
      case 'door':
        this.ui.prompt(`Cửa Vận Mệnh · cần: <b>${o.cond.label}</b> — trượt thì kho báu trong hầm hoá tro`, 'E');
        if (inp.pressed('interact')) this.openDiceChallenge(o);
        break;
      case 'pedestal':
      case 'drop': {
        const w = o.weapon;
        this.ui.weaponCompare(w, this.run.weapons);
        this.ui.prompt(`Nhặt <b style="color:${TIERS[w.tier - 1].color}">${WEAPONS[w.id].name}</b>`, 'E: ô 1 · R: ô 2');
        if (inp.pressed('interact')) this.takeWeapon(o, 0);
        else if (inp.pressed('interact2')) this.takeWeapon(o, 1);
        break;
      }
      case 'forge':
        this.ui.prompt('Lò rèn — nâng cấp vũ khí, nạp lại bình máu', 'E');
        if (inp.pressed('interact')) this.game.openForge(this);
        break;
      case 'merchant':
        this.ui.prompt('Thương nhân lang thang', 'E');
        if (inp.pressed('interact')) this.game.openShop(this, o);
        break;
    }
    if (o.kind !== 'pedestal' && o.kind !== 'drop') this.ui.weaponCompare(null);
  }

  takeWeapon(o, slot) {
    const old = this.run.weapons[slot];
    this.run.weapons[slot] = o.weapon;
    this.audio.play('pickup');
    this.fx.burst(o.x + 8, o.y, 14, { colors: [TIERS[o.weapon.tier - 1].color, '#fff'], speed: 90, life: 0.4, grav: -50 });
    this.toast(`Ô ${slot + 1}: ${WEAPONS[o.weapon.id].name}`);
    if (o.kind === 'pedestal') o.taken = true; else o.dead = true;
    if (old) this.dropWeapon(old, o.x + 8, o.y - 10);
    this.player.atk = null;
  }

  openDiceChallenge(o) {
    this.game.openDice(this, o);
  }

  // Kết quả của thử thách xúc xắc
  resolveDice(o, success) {
    const run = this.run;
    if (o.kind === 'chest') {
      o.state = success ? 'open' : 'empty';
      if (success) {
        run.chestsWon++;
        this.audio.play('chest');
        const q = lootQuality(o.cond) + (o.vault ? 1 : 0);
        this.chestLoot(o, q);
      } else {
        run.chestsLost++;
        this.audio.play('fail');
        this.fx.burst(o.x + 9, o.y, 16, { colors: ['#6e6058', '#9b8a7a', '#3a2a22'], speed: 50, life: 0.8, grav: -30 });
        this.fx.text(o.x + 9, o.y - 8, 'Trống rỗng...', '#9b8a7a', 1.4);
      }
    }
    if (o.kind === 'door') {
      o.used = true;
      this.level.openDoor();
      this.audio.play('gate'); this.camera.shake(0.3);
      for (let y = o.y; y < o.y + o.h; y += 6) this.fx.dust(o.x + o.w / 2, y, 2);
      if (!success) {
        this.audio.play('fail');
        for (const v of this.objects.filter((x) => x.vault)) {
          if (v.kind === 'pedestal') v.taken = true;
          if (v.kind === 'chest') v.state = 'empty';
          this.fx.burst(v.x + 8, v.y, 24, { colors: ['#6e6058', '#9b8a7a', '#3a2a22', '#ff8a3d'], speed: 70, life: 1, grav: -40 });
        }
        this.toast('Cửa mở, nhưng kho báu bên trong đã hoá thành tro...');
      } else this.toast('Cửa Vận Mệnh mở ra — kho báu đang chờ!');
    }
  }

  chestLoot(o, q) {
    const run = this.run;
    const cx = o.x + 9, cy = o.y - 4;
    const roll = Math.random();
    if (q >= 3) {
      // vũ khí huyền thoại hoặc tinh xảo +1
      const w = run.randomWeapon(2); if (w.tier < 3) w.level += 1;
      this.dropWeapon(w, cx, cy);
      this.burstGold(cx, cy, 30);
      this.fx.text(cx, cy - 10, 'KHO BÁU!', '#ffb340', 1.2);
    } else if (q === 2) {
      if (roll < 0.6) this.dropWeapon(run.randomWeapon(1), cx, cy); else { run.flasks = Math.min(run.maxFlasks + 1, run.flasks + 1); this.fx.text(cx, cy - 10, '+1 BÌNH MÁU', '#7dff8a', 1.2); }
      this.burstGold(cx, cy, 20);
    } else {
      if (roll < 0.4) this.dropWeapon(run.randomWeapon(0), cx, cy);
      else if (roll < 0.7) { run.heal(30); this.fx.text(cx, cy - 10, '+30 MÁU', '#7dff8a', 1.2); this.audio.play('heal'); }
      this.burstGold(cx, cy, 14 + run.depth * 3);
    }
  }

  burstGold(x, y, amount) {
    const n = Math.min(12, Math.ceil(amount / 4));
    for (let i = 0; i < n; i++) this.objects.push({ kind: 'coin', x, y, w: 4, h: 4, vx: rand(-110, 110), vy: rand(-260, -140), value: Math.ceil(amount / n), t: 0 });
  }

  useFlask() {
    const run = this.run, p = this.player;
    if (p.flaskCd > 0) return;
    if (run.flasks <= 0) { this.toast('Hết bình máu — tìm lò rèn để nạp lại'); return; }
    if (run.hp >= run.stats.maxHp) { this.toast('Máu đang đầy'); return; }
    run.flasks--; p.flaskCd = 0.8;
    const amt = Math.round(run.stats.maxHp * 0.45);
    run.heal(amt);
    this.audio.play('heal');
    this.fx.number(p.cx, p.y - 6, amt, 'heal');
    this.fx.burst(p.cx, p.cy, 16, { colors: ['#7dff8a', '#c8ffd0', '#fff'], speed: 60, life: 0.7, grav: -90 });
  }

  // ================= CHUYỂN PHÒNG =================
  exitRoom() {
    if (this.transition) return;
    this.audio.play('gate');
    this.transition = { t: 0, dur: 0.45, phase: 'out' };
  }

  updateTransition(dt) {
    const tr = this.transition;
    tr.t += dt;
    if (tr.phase === 'out' && tr.t >= tr.dur) {
      tr.phase = 'wait';
      this.game.afterRoom(this);
    }
    if (tr.phase === 'in' && tr.t >= tr.dur) this.transition = null;
  }

  nextRoom() {
    this.run.roomIndex++;
    this.loadRoom();
    this.transition = { t: 0, dur: 0.45, phase: 'in' };
  }

  get fadeAlpha() {
    const tr = this.transition;
    if (!tr) return 0;
    if (tr.phase === 'out') return clamp(tr.t / tr.dur, 0, 1);
    if (tr.phase === 'wait') return 1;
    return 1 - clamp(tr.t / tr.dur, 0, 1);
  }

  spawnEnemySlash(e) {
    this.fx.slash({ x: e.cx, y: e.y + e.h - 10, dir: e.facing, r0: 6, r1: 24, a0: -2.4, a1: 0.6, color: e.elite ? ELITE_AFFIXES[e.elite].color : '#c8b07a', edge: '#ffe8c0', life: 0.14 });
  }
}

export { FRAGMENTS, COND, ENEMY_TYPES, TRAITS, approach, pick };
