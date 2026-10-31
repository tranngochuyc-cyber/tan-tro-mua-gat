// Giao diện DOM: HUD, lời nhắc, menu, thẻ phúc lành, xúc xắc 3D, lò rèn, cửa hàng
import { WEAPONS, TIERS, TRAITS, weaponDps, weaponLabel } from '../data/weapons.js';
import { BUFFS, RARITY } from '../data/buffs.js';
import { weaponIcon } from '../render/sprites.js';

const h = (html) => { const t = document.createElement('template'); t.innerHTML = html.trim(); return t.content.firstElementChild; };
const esc = (s) => String(s).replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));

export class UI {
  constructor(root, game) {
    this.root = root; this.game = game;
    root.innerHTML = '';
    this.hud = h(`<div class="hud">
      <div class="hud-tl">
        <div class="hp"><b></b><i></i><em></em></div>
        <div class="row"><div class="flasks"></div><div class="gold">0</div></div>
        <div class="fate"><div class="bar"><i></i></div><span class="lbl">VẬN MỆNH</span><span class="face"></span></div>
      </div>
      <div class="hud-tr"><div class="room"></div><div class="prog"></div><div class="buffs"></div></div>
      <div class="slots"></div>
      <div class="keys">J/K đánh · Shift lướt · Q xúc xắc · F bình máu · Esc tạm dừng</div>
    </div>`);
    this.prm = h('<div class="prompt"><kbd></kbd><span></span></div>');
    this.cmp = h('<div class="compare"></div>');
    this.toasts = h('<div class="toasts"></div>');
    this.banner = h('<div class="banner"><small></small><h2></h2></div>');
    this.boss = h('<div class="bossbar"><div class="nm"></div><div class="bar"><i></i><span class="half"></span></div></div>');
    this.overlay = h('<div class="overlay"></div>');
    this.titleEl = null;
    [this.hud, this.prm, this.cmp, this.toasts, this.banner, this.boss, this.overlay].forEach((e) => root.appendChild(e));
    this.focusIdx = 0; this.menuKeys = null;
    this._last = {};
    window.addEventListener('keydown', (e) => this.onKey(e));
  }

  // ---------- điều hướng menu bằng phím ----------
  onKey(e) {
    if (!this.overlay.classList.contains('on') && !this.titleEl) return;
    const scope = this.titleEl || this.overlay;
    const items = [...scope.querySelectorAll('.btn:not([disabled]), .card')];
    if (!items.length) return;
    const k = e.code;
    if (this.menuKeys && this.menuKeys(k)) { e.preventDefault(); return; }
    if (['ArrowDown', 'ArrowRight', 'KeyD', 'KeyS', 'Tab'].includes(k)) { this.focusIdx = (this.focusIdx + 1) % items.length; e.preventDefault(); }
    else if (['ArrowUp', 'ArrowLeft', 'KeyA', 'KeyW'].includes(k)) { this.focusIdx = (this.focusIdx - 1 + items.length) % items.length; e.preventDefault(); }
    else if (['Enter', 'Space', 'KeyJ', 'KeyE'].includes(k)) { e.preventDefault(); const it = items[this.focusIdx] || items[0]; it.click(); return; }
    else if (/^Digit[1-9]$/.test(k)) { const i = +k.slice(5) - 1; const cards = [...scope.querySelectorAll('.card')]; if (cards[i]) { cards[i].click(); e.preventDefault(); } return; }
    else return;
    items.forEach((it, i) => it.classList.toggle('focus', i === this.focusIdx));
    this.game.audio.play('menu');
  }
  setFocus(scope, idx = 0) {
    this.focusIdx = idx;
    const items = [...scope.querySelectorAll('.btn:not([disabled]), .card')];
    items.forEach((it, i) => it.classList.toggle('focus', i === idx));
  }

  // ---------- HUD ----------
  showHud(on) { this.hud.classList.toggle('on', on); if (!on) { this.prompt(null); this.weaponCompare(null); this.bossBar(null); } }

  updateHud(play) {
    const run = play.run, st = run.stats;
    const L = this._last;
    const hpK = `${Math.ceil(run.hp)}/${st.maxHp}`;
    if (L.hp !== hpK) {
      L.hp = hpK;
      const pct = Math.max(0, run.hp / st.maxHp * 100);
      this.hud.querySelector('.hp i').style.width = pct + '%';
      this.hud.querySelector('.hp em').textContent = `${Math.max(0, Math.ceil(run.hp))} / ${st.maxHp}`;
    }
    const fk = `${run.flasks}/${run.maxFlasks}`;
    if (L.fl !== fk) { L.fl = fk; this.hud.querySelector('.flasks').innerHTML = Array.from({ length: Math.max(run.maxFlasks, run.flasks) }, (_, i) => `<span class="${i < run.flasks ? 'full' : ''}"></span>`).join(''); }
    if (L.gold !== run.gold) { L.gold = run.gold; this.hud.querySelector('.gold').textContent = run.gold; }
    const fate = this.hud.querySelector('.fate');
    const fv = Math.floor(run.fate);
    const face = play.player.fate ? play.player.fate.face : 0;
    const fkey = `${fv}|${face}`;
    if (L.fate !== fkey) {
      L.fate = fkey;
      fate.querySelector('.bar i').style.width = fv + '%';
      fate.classList.toggle('full', fv >= 100 && !face);
      fate.classList.toggle('has', !!face);
      fate.querySelector('.lbl').textContent = face ? 'ĐÒN KẾ:' : fv >= 100 ? 'VẬN MỆNH · Q' : 'VẬN MỆNH';
      fate.querySelector('.face').textContent = face ? `⚀ ${face}` : '';
    }
    const wk = run.weapons.map((w) => (w ? `${w.id}${w.tier}${w.level}` : '-')).join('|');
    if (L.w !== wk) {
      L.w = wk;
      const box = this.hud.querySelector('.slots'); box.innerHTML = '';
      run.weapons.forEach((w, i) => {
        const el = h(`<div class="slot ${w ? 't' + w.tier : 'empty'}"><span class="k">${i ? 'K' : 'J'}</span><span class="n"></span></div>`);
        if (w) { el.insertBefore(weaponIcon(w.id, w.tier, 48), el.querySelector('.n')); el.querySelector('.n').textContent = WEAPONS[w.id].short + (w.level ? ' +' + w.level : ''); el.querySelector('.n').style.color = TIERS[w.tier - 1].color; }
        else { const c = document.createElement('canvas'); c.width = c.height = 48; el.insertBefore(c, el.querySelector('.n')); el.querySelector('.n').textContent = 'trống'; }
        box.appendChild(el);
      });
    }
    const bk = run.buffs.join(',');
    if (L.b !== bk) {
      L.b = bk;
      this.hud.querySelector('.buffs').innerHTML = run.buffs.map((id) => { const b = BUFFS.find((x) => x.id === id); return `<span class="r${b.rarity}" title="${esc(b.name)}">${b.icon}</span>`; }).join('');
    }
    if (L.room !== run.roomIndex) {
      L.room = run.roomIndex;
      this.hud.querySelector('.room').textContent = run.room.title;
      this.hud.querySelector('.prog').innerHTML = run.sequence.map((r, i) => `<span class="${i < run.roomIndex ? 'done' : i === run.roomIndex ? 'cur' : ''} ${r.kind === 'boss' ? 'boss' : ''}"></span>`).join('');
    }
    if (play.boss && !play.boss.dead) this.bossBar(play.boss);
  }

  prompt(text, key) {
    if (!text) { if (this._pt) { this._pt = null; this.prm.classList.remove('on'); } return; }
    const k = text + '|' + key;
    if (this._pt === k) return;
    this._pt = k;
    this.prm.querySelector('kbd').style.display = key ? '' : 'none';
    this.prm.querySelector('kbd').textContent = key || '';
    this.prm.querySelector('span').innerHTML = text;
    this.prm.classList.add('on');
  }

  weaponCompare(w, current) {
    if (!w) { if (this._cw) { this._cw = null; this.cmp.classList.remove('on'); } return; }
    const key = `${w.id}${w.tier}${w.level}${w.trait}|${current.map((c) => c && c.id + c.tier + c.level).join()}`;
    if (this._cw === key) return;
    this._cw = key;
    const def = WEAPONS[w.id], tier = TIERS[w.tier - 1], dps = weaponDps(w);
    const rows = current.map((c, i) => {
      if (!c) return `<div class="dps"><span>so với ô ${i + 1} (trống)</span><span class="up">+${dps}</span></div>`;
      const d = dps - weaponDps(c);
      return `<div class="dps"><span>so với ô ${i + 1}: ${esc(WEAPONS[c.id].short)}${c.level ? ' +' + c.level : ''}</span><span class="${d >= 0 ? 'up' : 'down'}">${d >= 0 ? '+' : ''}${d}</span></div>`;
    }).join('');
    this.cmp.innerHTML = `<div class="tier" style="color:${tier.color}">${tier.name.toUpperCase()}</div><h4 style="color:${tier.color}">${esc(weaponLabel(w))}</h4>
      <div class="d">${esc(def.desc)}</div>${w.trait ? `<div class="trait">✦ ${TRAITS[w.trait].name}: ${TRAITS[w.trait].desc}</div>` : ''}
      <div class="dps"><span>Sức mạnh (DPS)</span><b>${dps}</b></div>${rows}`;
    this.cmp.classList.add('on');
  }

  toast(msg) {
    const now = performance.now();
    if (this._lastToast === msg && now - this._lastToastT < 1500) return;
    this._lastToast = msg; this._lastToastT = now;
    const t = h(`<div class="toast">${msg}</div>`);
    this.toasts.appendChild(t);
    while (this.toasts.children.length > 3) this.toasts.firstChild.remove();
    setTimeout(() => t.remove(), 2300);
  }

  roomTitle(title, kind) {
    const sub = { intro: 'Mở đầu', combat: 'Chiến đấu', dice: 'Phòng vận mệnh', forge: 'Nơi nghỉ chân', boss: 'Trận chiến cuối chương' }[kind] || '';
    this.banner.querySelector('small').textContent = sub;
    this.banner.querySelector('h2').textContent = title;
    this.banner.classList.remove('show'); void this.banner.offsetWidth; this.banner.classList.add('show');
  }

  bossIntro(b) {
    this.banner.querySelector('small').textContent = 'Kẻ Gác Cổng Tháp Chuông';
    this.banner.querySelector('h2').textContent = b.name;
    this.banner.classList.remove('show'); void this.banner.offsetWidth; this.banner.classList.add('show');
    this.bossBar(b);
  }

  bossBar(b) {
    if (!b) { this.boss.classList.remove('on'); return; }
    this.boss.classList.add('on');
    this.boss.querySelector('.nm').innerHTML = `${b.name}<small>${b.phase === 2 ? 'Pha II · Bốc cháy' : 'Pha I'}</small>`;
    this.boss.querySelector('.bar i').style.width = Math.max(0, b.hp / b.maxHp * 100) + '%';
  }

  // ---------- Overlay ----------
  open(html, opts = {}) {
    this.overlay.innerHTML = '';
    const el = typeof html === 'string' ? h(html) : html;
    this.overlay.appendChild(el);
    this.overlay.classList.add('on');
    this.menuKeys = opts.keys || null;
    this.setFocus(el, opts.focus || 0);
    return el;
  }
  close() { this.overlay.classList.remove('on'); this.overlay.innerHTML = ''; this.menuKeys = null; }
  get isOpen() { return this.overlay.classList.contains('on'); }

  controlsHtml() {
    return `<div class="controls">
      <kbd>A / D</kbd><span>Di chuyển</span>
      <kbd>Space / W</kbd><span>Nhảy · nhấn lần nữa trên không để nhảy kép · S + Space để rơi khỏi bục</span>
      <kbd>Shift / L</kbd><span>Lướt né — miễn sát thương, xuyên qua kẻ địch</span>
      <kbd>J / K</kbd><span>Đánh bằng vũ khí ô 1 / ô 2 (chuột trái / phải). Bấm liên tiếp ra combo</span>
      <kbd>W / S + bắn</kbd><span>Bắn chéo lên / xuống với vũ khí tầm xa</span>
      <kbd>Q</kbd><span>Tung xúc xắc Vận Mệnh khi thanh đầy: 6 = chí mạng x3, 4–5 = x2, 1 = hụt</span>
      <kbd>E / R</kbd><span>Tương tác · nhặt vũ khí vào ô 1 / ô 2</span>
      <kbd>F</kbd><span>Uống bình máu</span>
      <kbd>Esc</kbd><span>Tạm dừng</span>
    </div>`;
  }

  showTitle(best, onStart, onHow) {
    this.showHud(false);
    if (this.titleEl) this.titleEl.remove();
    this.titleEl = h(`<div class="title"><div>
      <h1>Tàn Tro<br/>Mùa Gặt<small>ASHEN HARVEST</small></h1>
      <div class="menu"><button class="btn primary" data-a="start">Bắt đầu hành trình</button><button class="btn" data-a="how">Cách chơi</button></div>
      ${best ? `<div class="best">Kỷ lục: ${esc(best)}</div>` : ''}
      <div class="foot">Bàn phím hoặc tay cầm · Chương I: Đồng Cỏ Tro</div>
    </div></div>`);
    this.root.appendChild(this.titleEl);
    this.titleEl.querySelector('[data-a=start]').onclick = () => onStart();
    this.titleEl.querySelector('[data-a=how]').onclick = () => onHow();
    this.setFocus(this.titleEl, 0);
  }
  hideTitle() { if (this.titleEl) { this.titleEl.remove(); this.titleEl = null; } }

  showHow(onBack) {
    const el = this.open(`<div class="panel"><div class="kick">Cách chơi</div><h2>Điều khiển</h2>${this.controlsHtml()}
      <p style="margin-top:14px">Mỗi màn chiến đấu vượt qua cho bạn chọn 1 trong 3 <b>phúc lành</b> và mở một <b>mảnh ký ức</b> của câu chuyện. Vũ khí có 3 bậc <span style="color:var(--t1)">Thường</span> · <span style="color:var(--t2)">Tinh Xảo</span> · <span style="color:var(--t3)">Huyền Thoại</span> — càng xuống sâu, quái càng mạnh, nên hãy nhặt và rèn vũ khí tốt hơn.</p>
      <div class="btns"><button class="btn primary">Đã hiểu</button></div></div>`);
    el.querySelector('.btn').onclick = () => { this.close(); onBack(); };
  }

  showPause(onResume, onRestart, onQuit, audio) {
    const el = this.open(`<div class="panel"><div class="kick">Tạm dừng</div><h2>Nghỉ một chút</h2>${this.controlsHtml()}
      <div class="row" style="margin-top:14px;gap:16px;font-family:var(--px);font-size:20px">
        <label>Nhạc <input type="range" min="0" max="1" step="0.05" value="${audio.volume.music}" data-v="music"></label>
        <label>Hiệu ứng <input type="range" min="0" max="1" step="0.05" value="${audio.volume.sfx}" data-v="sfx"></label></div>
      <div class="btns"><button class="btn primary" data-a="r">Tiếp tục</button><button class="btn" data-a="re">Chơi lại từ đầu</button><button class="btn" data-a="q">Về màn hình chính</button></div></div>`);
    el.querySelector('[data-a=r]').onclick = onResume;
    el.querySelector('[data-a=re]').onclick = onRestart;
    el.querySelector('[data-a=q]').onclick = onQuit;
    el.querySelectorAll('input[type=range]').forEach((inp) => inp.oninput = () => audio.setVolume(inp.dataset.v, +inp.value));
  }

  showBuffs(choices, onPick, roomNo) {
    const el = this.open(`<div class="panel" style="max-width:820px"><div class="kick">Phúc lành của ngọn lửa · màn ${roomNo}</div><h2>Chọn một phúc lành</h2>
      <div class="cards">${choices.map((b, i) => `<div class="card r${b.rarity}" data-i="${i}"><div class="num">${i + 1}</div><div class="ic" style="color:${RARITY[b.rarity].color}">${b.icon}</div><div class="r" style="color:${RARITY[b.rarity].color}">${RARITY[b.rarity].name.toUpperCase()}</div><h3>${esc(b.name)}</h3><p>${esc(b.desc)}</p></div>`).join('')}</div></div>`);
    el.querySelectorAll('.card').forEach((c) => c.onclick = () => onPick(choices[+c.dataset.i]));
  }

  showStory(frag, onNext, extra = '') {
    const text = Array.isArray(frag.text) ? frag.text.map((t) => `<p>${esc(t)}</p>`).join('') : `<p>${esc(frag.text)}</p>`;
    const el = this.open(`<div class="panel story"><span class="seal">❦</span><div class="kick">${esc(frag.kicker || 'Mảnh ký ức')}</div><h2>${esc(frag.title)}</h2>${text}${extra}<div class="btns"><button class="btn primary">Tiếp tục</button></div></div>`);
    el.querySelector('.btn').onclick = onNext;
  }

  // Thử thách xúc xắc với xúc xắc 3D
  showDice(cond, rerolls, roller, onDone, audio) {
    const n = cond.dice;
    const faceHtml = (k) => { const pos = { 1: [5], 2: [1, 9], 3: [1, 5, 9], 4: [1, 3, 7, 9], 5: [1, 3, 5, 7, 9], 6: [1, 3, 4, 6, 7, 9] }[k]; return `<div class="f f${k} ${k >= 5 ? 'red' : ''}">${Array.from({ length: 9 }, (_, i) => `<i style="visibility:${pos.includes(i + 1) ? 'visible' : 'hidden'}"></i>`).join('')}</div>`; };
    const dieHtml = `<div class="die3d">${[1, 2, 3, 4, 5, 6].map(faceHtml).join('')}</div>`;
    const el = this.open(`<div class="panel" style="max-width:560px;text-align:center"><div class="kick">Thử thách vận mệnh</div><h2>Tung xúc xắc</h2>
      <div class="cond" style="margin-top:12px">Cần: ${esc(cond.label)}</div><div class="odds">Cơ hội thành công khoảng ${Math.round(cond.p * 100)}%</div>
      <div class="diceArena">${Array.from({ length: n }, () => dieHtml).join('')}</div>
      <div class="result"></div>
      <div class="btns" style="justify-content:center"><button class="btn primary" data-a="roll">Tung!</button><button class="btn" data-a="leave">Để sau</button></div></div>`);
    const dice = [...el.querySelectorAll('.die3d')];
    const res = el.querySelector('.result');
    const btns = el.querySelector('.btns');
    let spins = 0, left = rerolls, rolling = false;
    const rot = { 1: [0, 0], 6: [0, 180], 2: [0, -90], 5: [0, 90], 3: [-90, 0], 4: [90, 0] };
    const doRoll = () => {
      if (rolling) return; rolling = true; btns.style.visibility = 'hidden'; res.textContent = ''; res.className = 'result';
      const faces = roller(n);
      audio.play('dice');
      spins++;
      dice.forEach((d, i) => {
        const [rx, ry] = rot[faces[i]];
        const extraX = 360 * (2 + spins + i), extraY = 360 * (3 + spins);
        d.style.transform = `rotateX(${rx + extraX}deg) rotateY(${ry + extraY}deg)`;
      });
      setTimeout(() => {
        audio.play('diceLand');
        const ok = cond.test(faces);
        res.textContent = `${faces.join(' + ')}${n > 1 ? ' = ' + faces.reduce((a, b) => a + b, 0) : ''} — ${ok ? 'THÀNH CÔNG!' : 'TRƯỢT...'}`;
        res.className = 'result ' + (ok ? 'ok' : 'no');
        btns.style.visibility = 'visible';
        rolling = false;
        if (ok || left <= 0) {
          btns.innerHTML = `<button class="btn primary">${ok ? 'Nhận thưởng' : 'Chấp nhận số phận'}</button>`;
          btns.querySelector('.btn').onclick = () => onDone(ok);
        } else {
          btns.innerHTML = `<button class="btn primary" data-a="rr">Tung lại (còn ${left})</button><button class="btn" data-a="give">Chấp nhận số phận</button>`;
          btns.querySelector('[data-a=rr]').onclick = () => { left--; doRoll(); };
          btns.querySelector('[data-a=give]').onclick = () => onDone(false);
        }
        this.setFocus(el, 0);
      }, 1150);
    };
    el.querySelector('[data-a=roll]').onclick = doRoll;
    el.querySelector('[data-a=leave]').onclick = () => onDone(null);
  }

  showForge(run, onUpgrade, onRefill, onClose) {
    const cost = (w) => 30 + w.level * 28 + (w.tier - 1) * 15;
    const render = () => {
      const items = run.weapons.map((w, i) => {
        if (!w) return '';
        const c = cost(w), max = w.level >= 5;
        return `<div class="item"><span data-ic="${i}"></span><div><h4 style="color:${TIERS[w.tier - 1].color}">${esc(weaponLabel(w))}</h4><p>Rèn lên +${w.level + 1}: sát thương +14% · hiện ${weaponDps(w)} DPS</p></div><button class="btn" data-up="${i}" ${max || run.gold < c ? 'disabled' : ''}>${max ? 'Tối đa' : '◉ ' + c}</button></div>`;
      }).join('');
      const el = this.open(`<div class="panel"><div class="kick">Lò rèn người canh lửa</div><h2>Rèn vũ khí</h2><div class="gold-line">◉ ${run.gold}</div>
        <div class="list">${items}
        <div class="item"><span></span><div><h4>Nạp lại bình máu</h4><p>Ngọn lửa lò rèn làm đầy toàn bộ bình máu (${run.flasks}/${run.maxFlasks}).</p></div><button class="btn" data-a="refill" ${run.flasks >= run.maxFlasks ? 'disabled' : ''}>Miễn phí</button></div></div>
        <div class="btns"><button class="btn primary" data-a="close">Rời lò rèn</button></div></div>`);
      el.querySelectorAll('[data-ic]').forEach((s) => { const w = run.weapons[+s.dataset.ic]; s.replaceWith(weaponIcon(w.id, w.tier, 48)); });
      el.querySelectorAll('[data-up]').forEach((b) => b.onclick = () => { const i = +b.dataset.up; const w = run.weapons[i]; run.gold -= cost(w); onUpgrade(i); render(); });
      el.querySelector('[data-a=refill]').onclick = () => { onRefill(); render(); };
      el.querySelector('[data-a=close]').onclick = onClose;
    };
    render();
  }

  showShop(run, stock, onBuy, onClose) {
    const render = () => {
      const rows = stock.map((it, i) => {
        let title = '', desc = '';
        if (it.kind === 'weapon') { title = `<span style="color:${TIERS[it.weapon.tier - 1].color}">${esc(weaponLabel(it.weapon))}</span>`; desc = `${TIERS[it.weapon.tier - 1].name} · ${weaponDps(it.weapon)} DPS · rơi xuống đất để bạn nhặt vào ô mong muốn`; }
        if (it.kind === 'flask') { title = 'Bình máu thêm'; desc = '+1 bình máu (vượt giới hạn 1 lần)'; }
        if (it.kind === 'hp') { title = 'Bánh mì lúa mạch'; desc = '+15 máu tối đa vĩnh viễn trong lượt này'; }
        return `<div class="item"><span data-ic="${i}"></span><div><h4>${title}</h4><p>${desc}</p></div><button class="btn" data-b="${i}" ${it.sold || run.gold < it.price ? 'disabled' : ''}>${it.sold ? 'Đã mua' : '◉ ' + it.price}</button></div>`;
      }).join('');
      const el = this.open(`<div class="panel"><div class="kick">Thương nhân lang thang</div><h2>"Vàng đổi lấy số phận"</h2><div class="gold-line">◉ ${run.gold}</div><div class="list">${rows}</div><div class="btns"><button class="btn primary" data-a="close">Tạm biệt</button></div></div>`);
      el.querySelectorAll('[data-ic]').forEach((s) => { const it = stock[+s.dataset.ic]; if (it.kind === 'weapon') s.replaceWith(weaponIcon(it.weapon.id, it.weapon.tier, 48)); });
      el.querySelectorAll('[data-b]').forEach((b) => b.onclick = () => { onBuy(stock[+b.dataset.b]); render(); });
      el.querySelector('[data-a=close]').onclick = onClose;
    };
    render();
  }

  showEnd(win, run, onAgain, onMenu, epilogueHtml = '') {
    const t = Math.floor(run.time);
    const el = this.open(`<div class="panel" style="max-width:640px"><div class="kick">${win ? 'Chương I hoàn thành' : 'Kael đã gục ngã'}</div><h2>${win ? 'Cổng tháp đã mở' : 'Tro tàn lại phủ cánh đồng'}</h2>
      ${epilogueHtml}
      <div class="stats">
        <div><small>Thời gian</small><b>${Math.floor(t / 60)}:${String(t % 60).padStart(2, '0')}</b></div>
        <div><small>Kẻ địch hạ gục</small><b>${run.kills}</b></div>
        <div><small>Tiến độ</small><b>${run.roomIndex + 1}/${run.sequence.length}</b></div>
        <div><small>Sát thương gây ra</small><b>${run.damageDealt}</b></div>
        <div><small>Rương xúc xắc</small><b>${run.chestsWon} thắng · ${run.chestsLost} trượt</b></div>
        <div><small>Mảnh ký ức</small><b>${run.fragments}/6</b></div>
      </div>
      <div class="btns"><button class="btn primary" data-a="again">Hành trình mới</button><button class="btn" data-a="menu">Màn hình chính</button></div></div>`);
    el.querySelector('[data-a=again]').onclick = onAgain;
    el.querySelector('[data-a=menu]').onclick = onMenu;
  }
}
