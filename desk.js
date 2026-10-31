// desk.js — 辦公桌畫面：兩個螢幕的桌面、看板視窗、卡片視窗、桌面上的裝置與便條、提示。
// 只做渲染和事件，規則都在 engine。
(function (root) {
  const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
  const MEETING_HINT_KEY = 'it24hr.meetingHintSeen';
  const VISITOR_HINT_KEY = 'it24hr.visitorHintSeen';
  // 文件／信箱／LIME（遊戲裡的 LINE）三個視窗列的來源；來源鍵 'line' 不改，改的只有玩家看到的名字
  const DOC_APPS = {
    // 信和訊息只在信箱、LIME；有 AI 同事時文件裡多一份 CLAIRE.md，隨時是最新的筆記
    docs: { title: '文件', icon: 'folder', x: 40, origins: ['boss', 'paper'], empty: '還沒有文件。老闆講的話、數位化的紙會收在這裡。' },
    mail: { title: '信箱', icon: 'mail', x: 80, origins: ['mail'], empty: '沒有新信。' },
    line: { title: 'LIME', icon: 'message-circle', x: 120, origins: ['line'], empty: '沒有新訊息。' },
  };
  const DOC_ICON = { boss: 'briefcase', paper: 'file-text', mail: 'mail', line: 'message-circle' };   // Icons 的名字
  const CLAIRE_DOC = 'claire-md';   // 文件裡那份 CLAIRE.md 的 id
  const PERMISSION_MODES = { acceptEdits: 'accept edits on', auto: 'auto mode on' };   // 劇本 ai.permission → 終端機上顯示的模式
  const withIcon = (node, name, text) => { node.append(Icons.el(name, 'ico-sm'), document.createTextNode(text)); return node; };
  const MODULES = { inventory: '資產盤點', users: '人員', reports: '報表' };
  // Tearlol 的欄名：從左到右是卡在誰手上——SA 區、IT 區、QC 區、完成
  const STATUS_ZH = { new: '新需求', rejected_to_sa: '退回 SA', open: 'IT 處理中', to_qc: '交 QC', returned: '退回 IT', archived: '已完成' };
  const BOARD_ORDER = ['new', 'rejected_to_sa', 'open', 'returned', 'to_qc', 'archived'];
  const WALL_CLOCK_HAND = { legacy: '#1f2328', hybrid: '#464a56' };   // 牆上時鐘的指針色，照各自底圖原本畫的
  const h = (tag, cls, text) => { const el = document.createElement(tag); if (cls) el.className = cls; if (text !== undefined) el.textContent = text; return el; };
  const hhmm = (m) => Verdict.hhmm(m);

  class Desk {
    constructor(rootEl, engine, { onOpenWork }) {
      this.root = rootEl; this.engine = engine; this.onOpenWork = onOpenWork;
      this.docsSelected = {};        // 文件視窗各自選到哪一份
      this.terminalLines = [];       // 終端機上已經打出來的行
      this.render();
      this.wm = new WindowManager(this.root.querySelector('.win-layer'), this.taskbar, this.desktop);
      // 術語：視窗裡的字自動畫虛線；點了浮出小卡，開著的時候時鐘暫停，「多知道一點」打開新人手冊
      Handbook.configure({ onCard: (open) => open ? engine.clock.pause('glossary') : engine.clock.resume('glossary'), onMore: (id) => this.openHandbook(id) });
      Handbook.watch(this.root.querySelector('.win-layer'));
      this.bind();
    }

    render() {
      // 電腦的深色／淺色先跟玩家自己的系統一樣，頂欄的鈕可以切
      const theme = matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      this.root.innerHTML = `
        <div class="desk" data-mode="${this.engine.script.mode || 'legacy'}">
          <div class="screens-bg"><canvas class="wall-clock" width="12" height="12" aria-hidden="true"></canvas><div class="screens">
            <div class="screen laptop">
              <div class="laptop-screen" data-theme="${theme}">
                <div class="os-top"><span class="os-clock">09:00</span></div>
                <div class="shortcuts laptop-shortcuts">
                  <button class="shortcut" data-open="terminal"><span class="ico">${Icons.html('square-terminal')}</span>終端機</button>
                </div>
              </div>
              <div class="bezel-label">筆電</div>
            </div>
            <div class="screen monitor">
              <div class="desktop" data-theme="${theme}">
                <div class="os-top"><span class="os-clock">09:00</span><span class="os-day"></span>
                  <span class="os-right"><button class="os-sound"></button><button class="os-theme" title="深色模式">${Icons.html('sun-moon')}</button></span></div>
                <div class="shortcuts">
                  <button class="shortcut" data-open="board"><span class="ico">${Icons.html('square-kanban')}</span>Tearlol</button>
                  <button class="shortcut" data-open="docs"><span class="ico">${Icons.html('folder')}</span>文件</button>
                  <button class="shortcut" data-open="mail"><span class="ico">${Icons.html('mail')}</span>信箱</button>
                  <button class="shortcut" data-open="line"><span class="ico">${Icons.html('message-circle')}</span>LIME</button>
                  <button class="shortcut" data-open="handbook"><span class="ico">${Icons.html('book-open')}</span>新人手冊</button>
                </div>
                <div class="taskbar"><span class="task-windows"></span></div>
              </div>
              <div class="bezel-label">外接螢幕</div>
            </div>
            <div class="win-layer" data-theme="${theme}"></div>
          </div></div>
          <div class="surface">
            <div class="device phone" data-device="phone"><span class="dev-name">開發機 手機</span><span class="battery"></span></div>
            <div class="device tablet" data-device="tablet"><span class="dev-name">開發機 平板</span><span class="battery"></span></div>
            <div class="device private"><span class="dev-name">私人手機</span><span class="private-time">09:00</span></div>
            <div class="strip" title="排插：把插頭拉到裝置上"><span class="strip-label">AC</span><button class="plug" data-outlet="0" title="插頭"></button><button class="plug" data-outlet="1" title="插頭"></button></div>
            <svg class="cables" aria-hidden="true"></svg>
            <div class="papers"></div>
            <div class="visitor" hidden><span class="visitor-face">${Icons.html('boss')}</span><p class="visitor-text"></p><button class="btn visitor-talk">怎麼了？</button></div>
            <button class="coffee" title="暫停">${Icons.html('coffee')} 暫停</button>
            <div class="ai-quota" hidden title="AI 額度：每五小時補滿（09:00、14:00、19:00）"></div>
            <button class="leave" hidden>下班</button>
            <div class="hint" hidden></div>
          </div>
        </div>`;
      this.desktop = this.root.querySelector('.desktop');
      this.wallClock = this.root.querySelector('.wall-clock'); this.wallClockBox = null; this.wallClockMinute = null;
      this.taskbar = this.root.querySelector('.taskbar');
      this.hintEl = this.root.querySelector('.hint');
      this.root.querySelector('.os-day').textContent = this.engine.script.name || '';
      this.updateDevices(); this.renderPapers();
    }

    // ── 桌面實體層：紙、訪客、充電座 ──
    renderPapers() {
      const pile = this.root.querySelector('.papers'); pile.replaceChildren();
      for (const paper of this.engine.papers) {
        const b = h('button', `paper ${paper.origin}`); b.append(Icons.el(paper.origin === 'self' ? 'sticky-note' : 'file-text')); b.title = paper.title;
        b.addEventListener('click', () => this.readPaper(paper));
        pile.append(b);
      }
    }
    // 拿起來看：紙放大在桌面上，不進螢幕
    readPaper(paper) {
      this.engine.readPaper(paper.id);
      const view = h('div', `paper-view ${paper.origin}`);
      const sheet = h('div', 'sheet'); sheet.append(h('h3', '', paper.title), h('p', '', paper.text));
      const actions = h('div', 'sheet-actions');
      const put = h('button', 'btn', '放回去'); put.addEventListener('click', () => view.remove());
      const dig = h('button', 'btn primary', '數位化');
      dig.addEventListener('click', () => { this.engine.digitize(paper.id); view.remove(); this.renderPapers(); this.toast(`「${paper.title}」進電腦的文件了`); });
      actions.append(put, dig); sheet.append(actions); view.append(sheet); this.root.querySelector('.desk').append(view);
    }
    showVisitor(src) {
      const v = this.root.querySelector('.visitor'); v.hidden = false; v.classList.add('arrive');
      v.querySelector('.visitor-text').textContent = `${src.from}站在桌邊，沒有要走的意思。`;
      v.querySelector('.visitor-talk').hidden = false;
      this.firstVisitorHint();
    }
    hideVisitor() { const v = this.root.querySelector('.visitor'); v.hidden = true; v.classList.remove('arrive'); }
    // 點了才開始交辦：一句一句講，講完人走、話進文件
    talkToVisitor() {
      const src = this.engine.visitor; if (!src) return;
      const v = this.root.querySelector('.visitor'); v.querySelector('.visitor-talk').hidden = true;
      const lines = [...(src.lines || [])]; const text = v.querySelector('.visitor-text');
      const next = () => {
        if (!lines.length) { this.engine.talkTo(src.id); this.hideVisitor(); this.toast(`${src.from}講的話在電腦的「文件」裡`); return; }
        text.textContent = `${src.from}：「${lines.shift()}」`; setTimeout(next, 2200);
      };
      next();
    }
    firstVisitorHint() {
      let seen = false;
      try { seen = localStorage.getItem(VISITOR_HINT_KEY) === '1'; } catch (e) { /* 私密視窗沒有儲存空間 */ }
      if (seen) return;
      this.showHint({ text: '有人站在桌邊。點他，聽他要什麼；不點，他會留一張紙在桌上就走。', pause: false });
      try { localStorage.setItem(VISITOR_HINT_KEY, '1'); } catch (e) { /* 同上 */ }
    }
    // ── 手動測試：整張桌子壓暗進測試模式，點手機、平板＝實機測，點電腦螢幕出 devtools 選模擬；「做完了」才記到卡上 ──
    enterTestMode(card) {
      const e = this.engine;
      if (!card.done('code')) {   // 連程式都沒有：Null Exception，記一筆就好
        e.doWork(card.id, 'manual_test', []);
        this.crash('NullReferenceException', ['物件參考未設定為物件的執行個體。', `  at ${e.player.name}.manualTest(${card.title})`, '  at Day.afternoon()', '', '你正在實踐物理意義上的 Null Exception。']);
        return;
      }
      if (this.testing) return;
      if (!card.done('doc_spec') && !card.done('doc_accept')) this.toast('你自己也不知道該從何測起。', '旁白');
      const desk = this.root.querySelector('.desk'); desk.classList.add('testing');
      const ops = []; const bar = h('div', 'test-bar');
      const count = h('span', 'test-count', '還沒做任何操作'); const done = h('button', 'btn primary', '做完了');
      bar.append(h('span', '', `手動測試：${card.title}`), count, done); desk.append(bar);
      const log = (op, text) => { ops.push(op); count.textContent = ops.map(o => o.text).join('、'); this.toast(text, '測試'); };
      const onDevice = (ev) => {
        const d = ev.currentTarget; const name = d.dataset.device; const ok = e.devices[name] > Works.LOW_BATTERY;
        log({ target: name, text: `${name === 'tablet' ? '平板' : '手機'}實機` }, ok ? `拿起${name === 'tablet' ? '平板' : '手機'}開了一遍` : `${name === 'tablet' ? '平板' : '手機'}沒電，開不了`);
        this.preview(card, name, { dead: !ok, label: `${name === 'tablet' ? '平板' : '手機'}實機` });
        if (ok) e.useDevice(name);   // 拿在手上看的時候掉電比較快
      };
      const onScreen = () => this.devtools((sim) => {
        e.putDownDevices();
        if (sim) { log({ target: 'pc', sim, text: `PC 模擬${sim === 'tablet' ? '平板' : '手機'}` }, `devtools 切成${sim === 'tablet' ? '平板' : '手機'}尺寸看了一遍`); this.preview(card, sim, { label: `PC 模擬${sim === 'tablet' ? '平板' : '手機'}` }); }
        else { log({ target: 'pc', text: 'PC' }, '在電腦上開了一遍'); this.preview(card, 'pc', { label: '電腦' }); }
      });
      const devices = [...this.root.querySelectorAll('.device[data-device]')]; const screens = [...this.root.querySelectorAll('.screen')];
      devices.forEach(d => d.addEventListener('click', onDevice)); screens.forEach(s => s.addEventListener('click', onScreen));
      this.testing = { card, ops };
      done.addEventListener('click', () => {
        devices.forEach(d => d.removeEventListener('click', onDevice)); screens.forEach(s => s.removeEventListener('click', onScreen));
        this.root.querySelectorAll('.devtools').forEach(p => p.remove()); bar.remove(); desk.classList.remove('testing'); this.testing = null;
        e.putDownDevices();
        const r = e.doWork(card.id, 'manual_test', ops.map(({ target, sim }) => ({ target, sim })));
        this.refreshCard(card.id); this.refreshBoard();
        this.toast(r && r.ops.length ? `測完了：${r.version}` : '什麼都沒測就收工了', '測試');
      });
    }
    // 成品畫面的預覽：手動測試點了哪個裝置，就用那個尺寸把這張卡做出來的網頁（screen.js）顯示出來；沒電的裝置是黑屏
    preview(card, device, { dead = false, label = '' } = {}) {
      this.root.querySelectorAll('.preview').forEach(p => p.remove());
      const size = { phone: [390, 700], tablet: [820, 600], pc: [960, 600] }[device] || [960, 600];
      const scale = Math.min(1, (window.innerWidth - 80) / size[0], (window.innerHeight - 140) / size[1]);
      const layer = h('div', 'preview'); const frame = h('div', `frame ${device}`);
      frame.style.width = `${size[0] * scale}px`; frame.style.height = `${size[1] * scale}px`;
      const body = h('div', 'frame-body');
      if (dead) body.append(h('div', 'frame-dead', '沒電。'));
      else { const page = Screen.render(Screen.model(card), device); page.style.transformOrigin = '0 0'; page.style.transform = `scale(${scale})`; page.style.width = `${size[0]}px`; body.append(page); }
      frame.append(body);
      // 看完了＝把裝置放下（不再算使用中的耗電）
      const putDown = () => { layer.remove(); this.engine.putDownDevices(); };
      const bar = h('div', 'preview-bar'); const close = h('button', 'btn small', '看完了'); close.addEventListener('click', putDown);
      bar.append(h('span', '', label), close);
      layer.append(frame, bar);
      layer.addEventListener('click', (ev) => { if (ev.target === layer) putDown(); });
      this.root.querySelector('.desk').append(layer);
    }
    // 點電腦螢幕跳出來的 devtools：選要模擬哪個尺寸
    devtools(pick) {
      if (this.root.querySelector('.devtools')) return;
      const panel = h('div', 'devtools');
      panel.append(h('div', 'devtools-bar', 'DevTools — 裝置模擬'));
      const row = h('div', 'devtools-row');
      for (const [sim, icon, label] of [[null, 'monitor', '電腦本身'], ['phone', 'smartphone', '模擬手機 390×844'], ['tablet', 'tablet', '模擬平板 820×1180']]) { const b = withIcon(h('button', 'btn small'), icon, label); b.addEventListener('click', () => { pick(sim); panel.remove(); }); row.append(b); }
      const lh = withIcon(h('button', 'btn small'), 'gauge', 'Lighthouse'); lh.addEventListener('click', () => this.lighthousePanel(panel)); row.append(lh);
      const close = h('button', 'btn small ghost', '關掉'); close.addEventListener('click', () => panel.remove()); row.append(close);
      panel.append(row); this.desktop.append(panel);
    }
    // 簡易 Lighthouse（screen.js 算的）：四個分數圈＋原因，放在同一塊 devtools 面板裡
    lighthousePanel(panel) {
      const card = this.testing && this.testing.card; if (!card) return;
      const r = Screen.lighthouse(Screen.model(card));
      panel.classList.add('tall'); panel.replaceChildren(h('div', 'devtools-bar', 'DevTools — Lighthouse'));
      const scores = h('div', 'lh-scores');
      for (const [label, v] of [['效能', r.performance], ['無障礙', r.accessibility], ['最佳做法', r.bestPractices], ['SEO', r.seo]]) {
        const s = h('div', 'lh-score'); const ring = h('div', `lh-ring ${v >= 90 ? 'good' : v >= 50 ? 'meh' : 'bad'}`, String(v)); s.append(ring, h('span', '', label)); scores.append(s);
      }
      const notes = h('ul', 'lh-notes'); for (const n of r.notes) notes.append(h('li', '', n));
      const close = h('button', 'btn small ghost', '關掉'); close.addEventListener('click', () => panel.remove());
      panel.append(scores, notes, close);
    }
    // 像真的當掉：一個 stack trace 彈窗
    crash(title, lines) {
      const box = h('div', 'crash'); const pre = h('pre', '', `${title}\n${lines.join('\n')}`);
      const ok = h('button', 'btn', '關掉'); ok.addEventListener('click', () => box.remove());
      box.append(pre, ok); this.root.querySelector('.desk').append(box);
    }
    // 排插：從插座拉一條線到裝置上才算插上，再把插頭拉走就是拔掉。裝置本身不動，線畫在 svg 上
    dragDevices() {
      const surface = this.root.querySelector('.surface'); const svg = surface.querySelector('.cables');
      const cables = {};   // outlet → device 名
      const local = (x, y) => { const b = surface.getBoundingClientRect(); return [x - b.left, y - b.top]; };
      const center = (el) => { const b = el.getBoundingClientRect(); return local(b.left + b.width / 2, b.top + b.height / 2); };
      const path = (outlet, cls) => { let p = svg.querySelector(`[data-outlet="${outlet}"]`); if (!p) { p = document.createElementNS('http://www.w3.org/2000/svg', 'path'); p.dataset.outlet = outlet; svg.append(p); } p.setAttribute('class', cls); return p; };
      // 線從插座垂到裝置，中間鬆一點（像真的線）
      const draw = (outlet, [x1, y1], [x2, y2], cls = 'cable') => path(outlet, cls).setAttribute('d', `M${x1},${y1} Q${(x1 + x2) / 2},${Math.max(y1, y2) + 36} ${x2},${y2}`);
      const redraw = () => { for (const [outlet, name] of Object.entries(cables)) { const d = this.root.querySelector(`.device[data-device="${name}"]`); draw(outlet, center(this.root.querySelector(`.plug[data-outlet="${outlet}"]`)), [center(d)[0], d.getBoundingClientRect().bottom - surface.getBoundingClientRect().top]); } };
      new ResizeObserver(redraw).observe(surface);
      const unplug = (outlet) => {
        const name = cables[outlet]; if (!name) return; delete cables[outlet];
        const d = this.root.querySelector(`.device[data-device="${name}"]`); d.classList.remove('plugged');
        const p = svg.querySelector(`[data-outlet="${outlet}"]`); if (p) p.remove();
        this.engine.unplug(name); this.updateDevices();
      };
      for (const plug of this.root.querySelectorAll('.plug')) {
        const outlet = plug.dataset.outlet; let dragging = false;
        plug.addEventListener('pointerdown', (e) => { dragging = true; plug.setPointerCapture(e.pointerId); unplug(outlet); plug.classList.add('dragging'); });
        plug.addEventListener('pointermove', (e) => { if (dragging) draw(outlet, center(plug), local(e.clientX, e.clientY), 'cable loose'); });
        const drop = (e) => {
          if (!dragging) return; dragging = false; plug.classList.remove('dragging');
          const d = [...this.root.querySelectorAll('.device[data-device]')].find(el => { const b = el.getBoundingClientRect(); return e.clientX >= b.left && e.clientX <= b.right && e.clientY >= b.top && e.clientY <= b.bottom && !el.classList.contains('plugged'); });
          if (!d) { const p = svg.querySelector(`[data-outlet="${outlet}"]`); if (p) p.remove(); return; }
          cables[outlet] = d.dataset.device; d.classList.add('plugged'); this.engine.charge(d.dataset.device); this.updateDevices();
          redraw(); this.toast(`${d.querySelector('.dev-name').textContent} 插上充電線`);
        };
        plug.addEventListener('pointerup', drop); plug.addEventListener('pointercancel', drop);
      }
    }

    bind() {
      const e = this.engine;
      this.root.querySelector('[data-open="board"]').addEventListener('click', this.company(() => this.openBoard()));
      this.root.querySelector('[data-open="terminal"]').addEventListener('click', () => this.openTerminal());
      for (const kind of ['docs', 'mail', 'line']) this.root.querySelector(`[data-open="${kind}"]`).addEventListener('click', this.openApp(kind));
      this.root.querySelector('[data-open="handbook"]').addEventListener('click', () => this.openHandbook());
      e.on('doc:arrived', () => this.refreshDocs());
      e.on('doc:forwarded', (doc) => { this.refreshDocs(); this.toast(`「${doc.title}」轉給怡君了，她開好會進 Tearlol`); });
      e.on('card:needs_source', (card) => { this.refreshBoard(); this.refreshCard(card.id); this.toast(`QC 把「${card.title}」退給怡君了——她在 LIME 找你`, 'QC'); });
      e.on('card:source_attached', (card) => { this.refreshBoard(); this.refreshCard(card.id); this.toast(`「${card.title}」補上原文了，可以再交 QC`); });
      this.root.querySelector('.os-theme').addEventListener('click', () => {
        const next = this.desktop.dataset.theme === 'dark' ? 'light' : 'dark';
        for (const el of this.root.querySelectorAll('.desktop, .laptop-screen, .win-layer')) el.dataset.theme = next;
      });
      // 通知音效的開關（記在這台瀏覽器）
      const sound = this.root.querySelector('.os-sound');
      const showSound = () => { sound.innerHTML = Icons.html(Sound.muted ? 'volume-x' : 'volume-2'); sound.title = Sound.muted ? '通知音效：關' : '通知音效：開'; };
      sound.addEventListener('click', () => { Sound.setMuted(!Sound.muted); showSound(); });
      showSound();
      this.root.querySelector('.coffee').addEventListener('click', () => this.togglePause());
      this.root.querySelector('.leave').addEventListener('click', () => e.leave());
      this.root.querySelector('.visitor-talk').addEventListener('click', () => this.talkToVisitor());
      this.dragDevices();
      e.on('visitor:arrived', (src) => this.showVisitor(src));
      e.on('visitor:talked', () => this.hideVisitor());
      e.on('visitor:left', (src) => { this.hideVisitor(); this.toast(`${src.from}放了張紙在桌上就走了`); });
      e.on('paper:arrived', () => this.renderPapers());
      e.on('doc:arrived', (doc) => { if (doc.kind === 'sent') return; ['line', 'mail'].includes(doc.origin) ? this.notify(doc) : this.toast(`新文件：${doc.title}`, doc.from); });
      e.on('device:charging', () => this.updateDevices());
      e.on('device:drained', () => this.updateDevices());

      e.on('card:arrived', (card) => {
        this.refreshBoard();
        if (card.pending) this.toast(`怡君收到了，需求分析中：${card.title}`, card.from);
        else if (card.from !== 'SA 怡君') this.toast(`新卡片：${card.title}`, card.from);   // 怡君開的卡她會傳 LIME
      });
      e.on('card:ready', (card) => { this.refreshBoard(); this.refreshCard(card.id); });   // 怡君開好卡會傳 LIME（engine.saHandsOver）
      e.on('work:done', ({ card }) => { this.refreshBoard(); this.refreshCard(card.id); });
      e.on('card:submitted', (card) => { this.refreshBoard(); this.refreshCard(card.id); });
      e.on('card:to_sa', (card) => { this.refreshBoard(); this.refreshCard(card.id); });
      e.on('card:from_sa', (card) => { this.refreshBoard(); this.refreshCard(card.id); });   // 怡君還卡會傳 LIME
      // QC 結果是阿姿傳 LIME（engine.qcSays），通知從 LIME 來
      e.on('card:returned', (card) => { this.refreshBoard(); this.refreshCard(card.id); });
      e.on('card:closed', (card) => { this.refreshBoard(); this.refreshCard(card.id); });
      e.on('deploy:run', ({ lines }) => this.runTerminal(lines));
      e.on('card:notified', (card) => { this.refreshCard(card.id); this.refreshDocs(); this.toast(`LIME 送給 ${card.requester} 了：#${card.no} 可以用了`); });
      // AI 同事：開工、交件都只寫在終端機（不跳通知、不自動開視窗），沒去看終端機的人就會漏掉
      const aiLines = (lines) => { this.terminalLines.push(...lines); this.refreshTerminal(); };
      e.on('ai:started', ({ card, lines }) => { aiLines(lines); this.refreshCard(card.id); this.updateQuota(); });
      e.on('ai:ready', ({ card, lines }) => { aiLines(lines); this.refreshCard(card.id); });
      e.on('ai:asking', () => this.refreshTerminal());   // 問句帶按鈕顯示在最下面（aiAskingNode），回答了才連同回答寫進紀錄
      e.on('ai:answered', ({ lines }) => aiLines(lines));
      e.on('ai:deploying', ({ card, lines }) => { aiLines(lines); this.refreshCard(card.id); });
      e.on('ai:notes', () => { this.refreshTerminal(); this.refreshDocs(); });
      e.on('ai:quota', () => { this.updateQuota(); aiLines([{ text: '— AI 額度補滿了 —', kind: 'note' }]); });
      this.updateQuota();
      e.on('site:down', (card) => { this.root.querySelector('.desk').classList.add('down'); this.toast(`內網 502 了。替換排在上傳前面，現在站台是空的。`, '部署'); });
      e.on('site:up', (card) => { this.root.querySelector('.desk').classList.remove('down'); this.toast(`內網回來了，掛了 ${e.downMinutes(card)} 分鐘。`, '部署'); });
      e.on('hint', (hint) => this.showHint(hint));
      e.on('hint:cleared', () => this.hideHint());
      e.on('device:charged', () => this.updateDevices());
      e.on('meeting:start', (m) => this.enterMeeting(m));
      e.on('meeting:line', (line) => this.fly(line));
      e.on('meeting:silent', (s) => { if (s.text) this.toast(s.text, '會議'); });
      e.on('meeting:end', () => this.exitMeeting());
      e.on('home:arrived', () => this.enterHome());
      e.on('home:vpn', (hm) => { if (hm.vpn === 'off' && hm.drops > (this.homeDrops || 0)) { this.homeDrops = hm.drops; this.toast('VPN 斷了，要重連。', 'VPN'); } this.refreshHome(); this.refreshTerminal(); });
      e.on('home:files', () => this.refreshHome());
      e.on('home:sleep', () => this.refreshHome());   // 睡覺、接完電話，VPN 都斷了
      e.on('home:call:end', (em) => this.ringOver(em));
      e.on('home:play', () => this.tickFun());
      e.on('home:food', (hm) => { this.renderFood(); if (hm.channel === 'delivery') this.toast(`外送到了：${Home.describe(hm.order)}`, '外送'); });
      e.on('home:call', (em) => this.ring(em));
    }

    // ── 茶几：離開公司就回家。外接螢幕收起來，筆電是唯一一台（桌面搬進筆電），桌上擺下班買的東西 ──
    // 在家要先掛 VPN 才進得了公司的系統
    company(open) { return () => { if (this.engine.online()) open(); else this.toast('要先連 VPN 才進得了公司的系統。', 'VPN'); }; }
    // 文件是公司的系統，在家要連 VPN；LIME、信箱在家不用。從信開卡要進看板，那一步才要 VPN
    openApp(kind) { return kind === 'docs' ? this.company(() => this.openDocs(kind)) : () => this.openDocs(kind); }
    enterHome() {
      this.exitMeeting(); this.hideHint();
      for (const id of [...this.wm.windows.keys()]) this.wm.close(id);   // 公司的視窗留在公司
      this.root.querySelector('.desk').classList.add('at-home');
      this.root.querySelector('.laptop-screen').hidden = true;
      this.root.querySelector('.screen.laptop').prepend(this.desktop);
      const term = h('button', 'shortcut'); term.innerHTML = `<span class="ico">${Icons.html('square-terminal')}</span>終端機`;
      term.addEventListener('click', () => this.openTerminal());
      this.desktop.querySelector('.shortcuts').append(term);
      this.homeBar = h('span', 'home-bar'); this.desktop.querySelector('.os-right').before(this.homeBar);
      this.homeFiles = h('div', 'home-files'); this.desktop.append(this.homeFiles);
      this.homeFood = h('div', 'home-food'); this.homeFun = h('div', 'home-fun');
      const table = h('div', 'home-table'); table.append(this.homeFood, this.homeFun); this.root.querySelector('.surface').append(table);
      // 洗澡睡覺放在公司「下班」鈕的位置：一天要結束的鈕都在同一個地方
      this.sleepBtn = h('button', 'leave sleep'); this.sleepBtn.innerHTML = Icons.html('bed'); this.sleepBtn.append(document.createTextNode('洗澡睡覺'));
      this.sleepBtn.addEventListener('click', () => this.askSleep());
      this.root.querySelector('.leave').after(this.sleepBtn);
      this.wm.fitClip();
      this.renderFood(); this.renderFun(); this.refreshHome();
    }
    // 頂欄：用哪台電腦（有帶公司筆電才能換）、VPN；桌面：私人電腦上留下的機密檔；睡著了就收起洗澡睡覺鈕
    refreshHome() {
      const hm = this.engine.home; if (!this.homeBar || !hm) return;
      const btn = (cls, icon, label, fn) => { const b = h('button', `home-btn ${cls}`); if (icon) b.innerHTML = Icons.html(icon); b.append(document.createTextNode(label)); b.addEventListener('click', fn); return b; };
      const pcs = hm.laptop ? [['company', '公司筆電'], ['personal', '私人電腦']].map(([kind, label]) => btn(hm.computer === kind ? 'on' : '', null, label, () => this.engine.useComputer(kind)))
        : [h('span', 'home-label', '私人電腦')];
      const vpn = btn(`vpn-${hm.vpn}`, 'wifi', { off: '連 VPN', connecting: 'VPN 連線中…', on: 'VPN 已連線' }[hm.vpn], () => this.engine.vpnConnect());
      vpn.disabled = hm.vpn !== 'off';
      this.homeBar.replaceChildren(...pcs, vpn);
      this.sleepBtn.hidden = !!hm.asleep;
      this.homeFiles.replaceChildren(...hm.confidential.map(f => {
        const row = h('div', 'home-file'); row.innerHTML = Icons.html('file-lock'); row.append(h('span', '', f.name));
        const del = h('button', 'home-del', '刪除'); del.addEventListener('click', () => this.engine.deleteConfidential(f.id));
        row.append(del); return row;
      }));
    }
    // 茶几上的東西：同一樣最多疊三份，買更多的寫份數（要把商圈掃光也沒關係）
    renderFood() {
      const hm = this.engine.home; if (!this.homeFood || !hm) return;
      this.homeFood.replaceChildren(...Object.entries(hm.food || {}).filter(([, n]) => n > 0).map(([id, n]) => {
        const pile = h('span', 'food-pile');
        for (let i = 0; i < Math.min(n, 3); i++) pile.append(HomeMenu.foodImg(id));
        if (n > 3) pile.append(h('b', 'food-n', `×${n}`));
        return pile;
      }));
    }
    // 下班休閒：下班時選的擺在茶几上。點一下就開始玩——平板、遊戲機自己的螢幕在播、漫畫在翻頁，
    // 一直播到玩家再點一下關掉；電話來了也不停
    renderFun() {
      const hm = this.engine.home; if (!this.homeFun || !hm) return;
      this.homeFun.replaceChildren(...hm.leisure.map(id => {
        const b = h('button', `fun-btn fun-${id}`); b.dataset.fun = id;
        const stage = h('span', 'fun-stage'); stage.append(HomeMenu.leisureImg(id), h('span', 'fun-screen'));
        if (id === 'manga') stage.append(h('span', 'fun-page'));
        b.append(h('span', 'fun-glow'), stage, h('span', 'fun-label'));
        b.addEventListener('click', () => (hm.playing[id] != null ? this.engine.stopPlay(id) : this.engine.startPlay(id)));
        return b;
      }));
      this.tickFun();
    }
    // 播放中的道具加 playing（動畫在 CSS），標籤換成藍底寫進度（第幾集／關／本）；沒在玩就寫要做什麼
    tickFun() {
      const hm = this.engine.home; if (!this.homeFun || !hm) return;
      for (const b of this.homeFun.querySelectorAll('.fun-btn')) {
        const id = b.dataset.fun, item = Home.LEISURE[id], on = hm.playing[id] != null;
        b.classList.toggle('playing', on);
        b.querySelector('.fun-label').textContent = on ? Home.progress(id, this.engine.playedMinutes(id)) : item.act;
        b.title = on ? `${item.act}中，再點一下停` : item.act;
      }
    }
    // 洗澡睡覺：可以開免打擾（電話不會響，但結算卡會發現漏接）
    askSleep() {
      const shade = h('div', 'home-overlay'); const box = h('div', 'home-box');
      const dnd = h('label', 'home-dnd'); const check = h('input'); check.type = 'checkbox'; dnd.append(check, document.createTextNode('開免打擾'));
      const go = h('button', 'btn primary', '睡覺'), stay = h('button', 'btn', '再等等');
      go.addEventListener('click', () => { shade.remove(); this.engine.sleep({ dnd: check.checked }); });
      stay.addEventListener('click', () => shade.remove());
      const row = h('div', 'home-row'); row.append(stay, go);
      box.append(h('p', '', '洗澡、睡覺，一覺到明天早上。'), dnd, row); shade.append(box); document.body.append(shade);
    }
    // 半夜的電話（接不接是玩家的決策）：私人手機旁邊響，不擋畫面、正在玩的也不停；
    // 接了回到茶几、桌上多一張卡、VPN 要重掛；不理它，響一陣子就斷了，算漏接
    ring(em) {
      const panel = h('div', 'home-ring'); const icon = h('span', 'ringing'); icon.innerHTML = Icons.html('phone');
      const pick = h('button', 'btn primary', '接'), drop = h('button', 'btn', '不接');
      pick.addEventListener('click', () => { this.ringPanel = null; panel.remove(); this.engine.answerCall(true); this.toast(`「${em.text}」`, em.from); });
      drop.addEventListener('click', () => { this.ringPanel = null; panel.remove(); this.engine.answerCall(false); });
      const row = h('div', 'home-row'); row.append(drop, pick);
      panel.append(icon, h('p', '', `${this.engine.clock.label()} ${em.from} 來電`), row);
      this.root.querySelector('.surface').append(panel); this.ringPanel = panel;
    }
    // 電話自己斷了（沒接也沒掛）
    ringOver(em) {
      if (this.ringPanel) { this.ringPanel.remove(); this.ringPanel = null; this.toast(`漏接了${em.from}的電話。`, '手機'); }
      this.refreshHome();
    }

    // ── 會議：外接螢幕收起來，筆電跟桌上一樣大、移到正中間，視窗都還在上面能用；討論像彈幕從筆電上方飄過 ──
    enterMeeting(spec) {
      if (this.meetingRoom) this.closeMeetingRoom();   // 上一場的彈幕還沒飛完就接著開會：先收掉
      const desk = this.root.querySelector('.desk'); desk.classList.add('in-meeting');
      const room = h('div', 'meeting-room');
      room.innerHTML = `<div class="projector"><h2 class="projector-title"></h2></div><div class="danmaku"></div>
        <div class="people"><span></span><span></span><span></span><span></span></div><div class="raise" hidden></div>`;
      room.querySelector('.projector-title').textContent = spec.title;
      room.style.setProperty('--dm-fly', `${C.DANMAKU_FLY_MIN * C.MS_PER_GAME_MIN}ms`);   // 彈幕飛多久跟引擎等散會用同一個數字
      this.root.querySelector('.screens-bg').prepend(room);
      this.root.querySelector('.laptop-screen').hidden = true;
      this.root.querySelector('.screen.laptop').prepend(this.desktop);
      this.meetingRoom = room; this.lane = 0;
      this.wm.fitClip();
      this.firstMeetingHint();
    }
    // 第一次開會才講規則，之後不再講
    firstMeetingHint() {
      let seen = false;
      try { seen = localStorage.getItem(MEETING_HINT_KEY) === '1'; } catch (e) { /* 私密視窗沒有儲存空間 */ }
      if (seen) return;
      this.showHint({ text: '開會了。討論的話會從上面飄過去，跟你有關的那句飄過時點一下＝舉手。飄過去沒點，就錯過了。', pause: false });
      try { localStorage.setItem(MEETING_HINT_KEY, '1'); } catch (e) { /* 同上 */ }
      this.engine.on('meeting:end', () => this.hideHint());
    }
    // 會議結束時還在飛的彈幕讓它飛完再收（tick 看到天空空了才收，收之前不能再舉手）；離席是自己走出去，馬上收
    exitMeeting() {
      if (!this.meetingRoom) return;
      this.engine.clock.resume('raise');
      if (this.leavingMeeting || !this.meetingRoom.querySelector('.dm')) this.closeMeetingRoom();
      else this.meetingRoom.classList.add('ending');
    }
    closeMeetingRoom() {
      this.leavingMeeting = false;
      this.meetingRoom.remove(); this.meetingRoom = null;
      this.root.querySelector('.screen.monitor').prepend(this.desktop);
      this.root.querySelector('.laptop-screen').hidden = false;
      this.root.querySelector('.desk').classList.remove('in-meeting');
      this.wm.fitClip();
      this.engine.emit('meeting:closed');   // 彈幕飛完、會議室真的收掉了；meeting:end 時彈幕可能還在飛，那時暫停時鐘會把它們凍住
    }
    fly(line) {
      if (!this.meetingRoom) return;
      const sky = this.meetingRoom.querySelector('.danmaku'); const raise = this.meetingRoom.querySelector('.raise');
      // 關鍵句是真的按鈕，鍵盤 Tab 得到、Enter 舉手；其他句子只是文字
      const el = h(line.key ? 'button' : 'span', `dm ${line.key ? 'key' : ''}`, line.text);
      if (line.key) el.type = 'button';
      el.style.top = `${[14, 34, 54, 74][this.lane++ % 4]}%`;
      sky.append(el);
      if (!line.key) Handbook.mark(el);
      // 舉手時全場停下來等你：整頁壓暗、時鐘不走（彈幕跟著時鐘停，見 tick），選完才繼續
      if (line.key) el.addEventListener('click', () => {
        if (el.classList.contains('held')) return;
        el.classList.add('held'); this.engine.clock.pause('raise');
        this.root.querySelector('.desk').classList.add('raising');
        const done = () => {
          raise.hidden = true; raise.replaceChildren();
          this.root.querySelector('.desk').classList.remove('raising');
          this.engine.clock.resume('raise');
        };
        raise.hidden = false; raise.replaceChildren(h('p', 'raise-q', line.text), h('span', 'raise-label', '全場看著你'));
        Handbook.mark(raise);
        line.options.forEach((opt, idx) => {
          const b = h('button', 'btn', opt.text);
          b.addEventListener('click', () => { this.engine.raiseHand(idx, line); el.remove(); done(); if (opt.reply) this.fly({ text: opt.reply }); });
          raise.append(b);
        });
        // 或者……不說話的三條退路：文字和同事的反應寫在劇本（meeting.retreat）
        const r = this.engine.meeting && this.engine.meeting.spec.retreat;
        if (r) {
          const alt = h('div', 'raise-alt'); alt.append(h('span', 'raise-label', '或者……'));
          const lower = h('button', 'btn ghost', r.lower.label);
          lower.addEventListener('click', () => { el.classList.remove('held'); done(); this.fly({ text: pick(r.lower.reactions) }); });
          const stretch = h('button', 'btn ghost', r.stretch.label);
          stretch.addEventListener('click', () => { el.classList.remove('held'); done(); this.fly({ text: pick(r.stretch.reactions) }); });
          const leave = h('button', 'btn ghost', r.leave.label);
          leave.addEventListener('click', () => { done(); this.leavingMeeting = true; this.engine.leaveMeeting(); });
          alt.append(lower, stretch, leave); raise.append(alt);
        }
      });
      // 關鍵句有兩個動畫（飄過、進場跳一下），只有「飄完」才算離場；進場跳完不能把它移掉
      el.addEventListener('animationend', (ev) => { if (ev.animationName === 'fly' && !el.classList.contains('held')) el.remove(); });
    }

    // ── 每一幀 ──
    tick() {
      const e = this.engine;
      const label = e.clock.label();
      for (const c of this.root.querySelectorAll('.os-clock')) c.textContent = label;
      this.root.querySelector('.private-time').textContent = label;
      this.root.querySelector('.leave').hidden = !e.canLeave();
      this.root.querySelector('.coffee').classList.toggle('on', e.paused);
      this.desktop.classList.toggle('paused', e.paused);
      this.drawWallClock();
      // 彈幕跟著遊戲時鐘走：時鐘停（暫停、舉手、看術語、會議中翻手冊）彈幕就停；會議結束後天空空了才收會議室
      if (this.meetingRoom) {
        this.meetingRoom.querySelector('.danmaku').classList.toggle('frozen', e.clock.isPaused);
        if (this.meetingRoom.classList.contains('ending') && !this.meetingRoom.querySelector('.dm')) this.closeMeetingRoom();
      }
      // AI 做事中：終端機的進度條每遊戲分鐘重畫一次
      if (e.ai && e.clock.minute !== this.terminalMinute) { this.terminalMinute = e.clock.minute; if (this.aiJobs('running').length) this.refreshTerminal(); }
      if (e.home && e.home.phase === 'table') this.tickFun();
    }
    // 離開桌子一趟（例如去行銷部拍照）：整頁黑掉、一行旁白，過一下回來
    trip(text, done) {
      const shade = h('div', 'trip-screen'); shade.append(h('p', '', text || '你離開了座位一陣子。'));
      document.body.append(shade);
      setTimeout(() => { shade.classList.add('out'); setTimeout(() => { shade.remove(); done(); }, 500); }, 2500);
    }
    updateQuota() {
      const box = this.root.querySelector('.ai-quota'); const ai = this.engine.ai;
      if (!ai) return;
      box.hidden = false;
      box.textContent = `AI 額度 ${'▮'.repeat(ai.left)}${'▯'.repeat(ai.max - ai.left)}`;
      box.classList.toggle('empty', ai.left <= 0);
    }
    // 今天交給 AI、狀態是 status 的那些（{ card, work, job }）
    aiJobs(status) {
      const out = [];
      for (const card of this.engine.board.cards) for (const [work, runs] of Object.entries(card.ai || {})) for (const job of runs) if (job.status === status) out.push({ card, work, job });
      return out;
    }
    // 牆上的時鐘：底圖是畫死的像素畫（legacy、hybrid 牆面都是 192×76 格，鐘框在 (3,6) 12×12、鐘面 (4,7) 10×10、指針交在 (8,12)），
    // 底圖以 cover、貼底置中鋪在 .screens-bg 上。這塊 12×12 的 canvas 對準鐘框蓋上去，照遊戲時間重畫指針；指針顏色照那張底圖
    drawWallClock() {
      const c = this.wallClock; if (!c || !c.offsetParent) return;
      const bg = c.parentElement; const W = bg.clientWidth, H = bg.clientHeight;
      if (!this.wallClockBox || this.wallClockBox.W !== W || this.wallClockBox.H !== H) {
        const s = Math.max(W / 192, H / 76); const x0 = (W - 192 * s) / 2, y0 = H - 76 * s;
        c.style.left = `${x0 + 3 * s}px`; c.style.top = `${y0 + 6 * s}px`; c.style.width = c.style.height = `${12 * s}px`;
        this.wallClockBox = { W, H };
      }
      const m = this.engine.clock.minute; if (m === this.wallClockMinute) return; this.wallClockMinute = m;
      const ctx = c.getContext('2d'); ctx.clearRect(0, 0, 12, 12);
      ctx.fillStyle = '#f6f1e7'; ctx.fillRect(1, 1, 10, 10);
      ctx.fillStyle = WALL_CLOCK_HAND[this.engine.script.mode] || WALL_CLOCK_HAND.legacy;
      const hand = (angle, len) => { for (let t = 0; t <= len; t++) ctx.fillRect(Math.round(5 + Math.sin(angle) * t), Math.round(6 - Math.cos(angle) * t), 1, 1); };
      const h = Math.floor(m / 60) % 12, mm = m % 60;
      hand((h + mm / 60) / 12 * Math.PI * 2, 3); hand(mm / 60 * Math.PI * 2, 4);
    }
    togglePause() { this.engine.paused ? this.engine.resume() : this.engine.pause(); }

    // ── 提示 ──
    showHint(hint) {
      this.hintEl.hidden = false; this.hintEl.textContent = hint.text; this.hintEl.classList.toggle('soft', hint.pause === false);
      Handbook.mark(this.hintEl);
      this.hintEl.classList.remove('pop'); void this.hintEl.offsetWidth; this.hintEl.classList.add('pop');   // 新提示：抖一下
    }
    hideHint() { this.hintEl.hidden = true; }

    toast(text, who) {
      const t = h('div', 'toast'); if (who) t.append(h('b', '', who)); t.append(h('span', '', text));
      this.root.querySelector('.surface').append(t);
      setTimeout(() => t.classList.add('show'), 10); setTimeout(() => t.remove(), 4200);
    }

    updateDevices() {
      for (const d of this.root.querySelectorAll('.device[data-device]')) {
        const v = this.engine.devices[d.dataset.device];
        const b = d.querySelector('.battery'); b.textContent = `${v}%`; b.classList.toggle('low', v <= Works.LOW_BATTERY);
      }
    }

    // 終端機：部署時指令一行一行打出來（engine 的 deploy:run），平常只開著
    openTerminal() {
      // 終端機住筆電：視窗座標以外接螢幕桌面為原點，換算到筆電螢幕內側（開會時筆電變整片，一樣照它的現況算）
      const lap = this.wm.screenRects().laptop, o = this.wm.homeOffset();
      const place = lap ? { x: lap.x - o.x + 12, y: lap.y - o.y + 36, w: lap.w - 24, h: lap.h - 48 } : { x: 60, y: 260, w: 480, h: 220 };
      this.wm.open({ id: 'terminal', title: '終端機', icon: 'square-terminal', ...place, cls: 'win-terminal', content: this.terminalNode() });
    }
    terminalNode() {
      const e = this.engine;
      const pre = h('pre', 'terminal-text');
      if (e.ai) {   // AI 筆記：它每次做事前先讀這份。釘在終端機頂端，終端機捲到底也看得到
        const bar = h('span', 't-bar');
        const notes = h('button', 'tbtn', `CLAIRE.md（${e.aiNotes().length} 條筆記）`); notes.addEventListener('click', this.company(() => this.openNotes()));
        bar.append(notes);
        const mode = PERMISSION_MODES[e.script.ai.permission];   // 彩蛋：Claire Code 現在的權限模式
        if (mode) bar.append(h('span', `t-mode ${e.script.ai.permission}`, `⏵⏵ ${mode}`));
        pre.append(bar);
      }
      // 在家沒連 VPN：終端機打得開，但連不到公司的伺服器；AI 的進度、問句、交件都看不到，提醒做公司的事要連 VPN
      if (!e.online()) {
        for (const line of this.terminalLines) pre.append(h('span', `t-${line.kind}`, line.text + '\n'));
        pre.append(h('span', 't-cmd', `$ ${e.ai ? 'claire --status' : 'ssh dev.corp.local'}\n`),
          h('span', 't-err', 'ssh: Could not resolve hostname dev.corp.local: Name or service not known\n'),
          h('span', 't-out', '（連不到公司的伺服器。要做公司的事，先連 VPN。）\n'), h('span', 't-cmd', '$ _'));
        return pre;
      }
      if (!this.terminalLines.length) { pre.append(e.ai ? `$ _\n\n（AI 同事 ${e.aiName()}在這裡。交給它的工作做好了會停在這裡等你。）` : '$ _\n\n（今天還沒有 AI 同事。這台終端機只是開著。）'); return pre; }
      for (const line of this.terminalLines) pre.append(h('span', `t-${line.kind}`, line.text + '\n'));
      // 做事中：進度條；交件了：停在這裡等你（看一下／直接交）
      for (const { card, work, job } of this.aiJobs('running')) {
        const p = Math.max(0, Math.min(1, (e.clock.minute - job.startedAt) / (job.doneAt - job.startedAt)));
        const n = Math.round(p * 20);
        pre.append(h('span', 't-out', `#${card.no} ${Works.label(work)}（第 ${job.id} 份） [${'#'.repeat(n)}${'.'.repeat(20 - n)}] ${Math.round(p * 100)}%\n`));
      }
      for (const { card, work, job } of this.aiJobs('asking')) pre.append(this.aiAskingNode(card, work, job));
      for (const { card, work, job } of this.aiJobs('ready')) pre.append(this.aiReadyNode(card, work, job));
      pre.append(h('span', 't-cmd', '$ _'));
      return pre;
    }
    // 矯枉過正的 AI 停下來問你（筆記做法是 ask）：不回它就一直停在這裡
    aiAskingNode(card, work, job) {
      const ask = job.asks[job.asked];
      const box = h('span', 'ai-wait');
      box.append(h('span', 't-ai', `? #${card.no} ${Works.label(work)}（第 ${job.id} 份）：${ask.text} `));
      const options = ask.choices ? ask.choices.map(c => [c.label, c.value]) : [[ask.yes, true], [ask.no, false]];
      for (const [label, value] of options) {
        const b = h('button', 'tbtn', label); b.addEventListener('click', () => this.engine.answerAi(card.id, work, job.id, value));
        box.append(b);
      }
      box.append(document.createTextNode('\n'));
      return box;
    }
    // 交件了等你確認的那一行：直接交（沒看）或看一下（沒看怎麼知道要不要退——退回在答案卡裡）
    aiReadyNode(card, work, job) {
      const e = this.engine; const name = `#${card.no} ${Works.label(work)}（第 ${job.id} 份）`;
      const box = h('span', 'ai-wait');
      box.append(h('span', 't-ai', `? ${name} 等你確認 `));
      // 卡上已經有版本（手寫的或之前收下的那份）：直接交就是蓋過去
      const over = card.done(work);
      const look = h('button', 'tbtn', '看一下'); look.addEventListener('click', () => this.onOpenWork(card, work, { fromAi: true, jobId: job.id }));
      const take = h('button', 'tbtn', over ? '直接交（蓋過卡上的版本）' : '直接交');
      take.addEventListener('click', () => { e.acceptAi(card.id, work, job.id); this.terminalLines.push({ text: `✓ ${over ? '蓋過卡上的版本' : '交了'} ${name}（沒看）`, kind: 'out' }); this.refreshTerminal(); });
      box.append(look, take, document.createTextNode('\n'));
      return box;
    }
    // AI 筆記（CLAIRE.md）：AI 用自己的口吻記下你說過的話，之後同主題都照做；說錯了也照做，所以要能刪。住在「文件」裡
    openNotes() {
      this.docsSelected.docs = CLAIRE_DOC;
      this.openDocs('docs'); this.refreshDocs();
    }
    notesNode() {
      const e = this.engine; const wrap = h('div', 'ai-notes');
      wrap.append(h('p', 'muted', 'AI 每次做事前會先讀這裡。你退回時說的話，它用自己的話記下來；說錯的它也照做，錯了就刪掉。'));
      const notes = e.aiNotes();
      if (!notes.length) wrap.append(h('p', 'muted', '還沒有筆記。在 AI 的答案卡按「退回」跟它說要改什麼，講的話會記在這裡。'));
      const list = h('ul', 'note-list');
      for (const n of notes) {
        const li = h('li'); const del = h('button', 'btn small ghost', '刪掉');
        del.addEventListener('click', () => e.deleteNote(n.topic));
        li.append(h('span', '', n.text), del); list.append(li);
      }
      if (notes.length) wrap.append(list);
      // 新增規範（「寫 Skill」）：不用等 AI 做錯才教，先把流程寫進去；寫過的從清單消失（刪掉筆記就回來）
      const skills = e.skills();
      if (skills.length) {
        const box = h('div', 'ai-skills'); box.append(h('h4', '', '新增規範'), h('p', 'muted small', '事先寫進去的規範，AI 之後照著做：部署寫了它就不再每一步停下來問。'));
        for (const s of skills) {
          if (!s.options) { const b = h('button', 'btn small', s.label); b.addEventListener('click', () => e.addSkill(s.id)); box.append(b); continue; }
          const said = s.options.filter(o => o.say); if (!said.length) continue;   // 三派句子還沒寫的先不列
          box.append(h('p', 'small', s.label));
          for (const o of said) { const b = h('button', 'btn small ghost', `「${o.say}」`); b.addEventListener('click', () => e.addSkill(s.id, o.stance)); box.append(b); }
        }
        wrap.append(box);
      }
      return wrap;
    }
    refreshTerminal() {
      if (!this.wm.exists('terminal')) return;
      this.wm.setContent('terminal', this.terminalNode());
      const body = this.wm.get('terminal').body; body.scrollTop = body.scrollHeight;
    }
    runTerminal(lines) {
      this.openTerminal();
      lines.forEach((line, i) => setTimeout(() => { this.terminalLines.push(line); this.refreshTerminal(); }, 350 * i));
    }

    // ── 看板 ──
    // LINE、信有新訊息：私人手機震一下，螢幕右下角冒通知氣泡（點了開對應的視窗，幾秒後自己消失）
    notify(doc) {
      const phone = this.root.querySelector('.device.private');
      phone.classList.remove('buzz'); void phone.offsetWidth; phone.classList.add('buzz');
      const app = doc.origin === 'line' ? 'line' : 'mail';
      Sound.play(app);
      const n = h('button', 'notif');
      n.append(h('b', '', `${app === 'line' ? 'LIME' : '信箱'} ・ ${doc.group ? `${doc.group}（${doc.from}）` : doc.from}`), h('span', '', doc.text.split('\n')[0]));
      // 點哪則通知就選到哪則：信箱選那封信，LIME 選那個聯絡人或群組
      n.addEventListener('click', () => { this.openDocs(app, app === 'line' ? (doc.group || doc.from) : doc.id); n.remove(); });
      n.style.bottom = `${44 + 72 * this.desktop.querySelectorAll('.notif').length}px`;   // 幾則一起來就往上堆
      this.desktop.append(n);
      setTimeout(() => n.classList.add('show'), 10); setTimeout(() => n.remove(), 6500);
    }

    // 新人手冊：術語的完整解釋。上班翻手冊時鐘照走；在家也打得開，不用 VPN
    // 開會時翻手冊，時鐘停到手冊關掉（不然彈幕就飄過去了）；平常翻手冊時間照走
    openHandbook(id) {
      if (this.meetingRoom) this.engine.clock.pause('handbook');
      const win = this.wm.open({ id: 'handbook', title: '新人手冊', icon: 'book-open', x: 200, y: 40, w: 560, h: 440, cls: 'win-handbook', content: Handbook.bookNode(),
        onClose: () => this.engine.clock.resume('handbook') });
      Handbook.focusIn(win.body, id);
    }

    // ── 電腦裡的文件、信箱、LINE：同一個視窗元件，差在列哪些來源 ──
    // selected：要選到哪一則（信、文件是 id，LIME 是聯絡人或群組名）；視窗已經開著就換成那一則再拉到最前面
    openDocs(kind, selected) {
      const { title, icon, x } = DOC_APPS[kind]; const id = `docs:${kind}`;
      if (selected !== undefined && this.wm.exists(id)) this.wm.setContent(id, this.docsNode(kind, selected));
      this.wm.open({ id, title, icon, x, y: 50, w: 640, h: 420, cls: `win-docs win-${kind}`, content: this.docsNode(kind, selected) });
    }
    refreshDocs() { for (const kind of Object.keys(DOC_APPS)) if (this.wm.exists(`docs:${kind}`)) this.wm.setContent(`docs:${kind}`, this.docsNode(kind, this.docsSelected[kind])); }
    // LINE 長得像 LINE：左邊聯絡人、右邊對話泡泡（對方灰色靠左、你回的藍色靠右），跟需求討論結束那頁同一套。
    // 群組（m.group）是一個聯絡人，裡面別人的訊息上面寫是誰說的
    lineNode(selectedFrom) {
      const msgs = this.engine.docs.filter(d => d.origin === 'line');
      const chatOf = (m) => m.group || m.from;
      const wrap = h('div', 'docs line'); const list = h('div', 'doc-list'); const pane = h('div', 'doc-pane chat'); wrap.append(list, pane);
      const contacts = [...new Set(msgs.map(chatOf))];
      if (!contacts.length) { pane.append(h('p', 'muted', DOC_APPS.line.empty)); return wrap; }
      const show = (from) => {
        this.docsSelected.line = from;
        for (const b of list.children) b.classList.toggle('active', b.dataset.from === from);
        const log = h('div', 'discuss-log'); pane.replaceChildren(h('h3', '', from), log);
        // 照時間排（engine.chatLog）：晚回的話排在回的時候，不黏在被回的那則下面；回訊息的鈕留在原本那則下面
        for (const entry of this.engine.chatLog(msgs.filter(x => chatOf(x) === from))) {
          if (entry.mine) {
            const mine = h('p', 'me');
            if (entry.quote) { const q = h('span', 'chat-quote'); q.append(h('b', '', entry.quote.from), h('span', '', entry.quote.text)); mine.append(q); }
            mine.append(entry.mine); log.append(mine); continue;
          }
          const m = entry.msg;
          if (m.group && m.kind !== 'sent') log.append(h('span', 'chat-who', m.from));
          if (m.kind === 'sticker') { const s = h('p', 'them sticker'); s.innerHTML = Stickers.html(m.sticker); log.append(s); continue; }
          log.append(h('p', m.kind === 'sent' ? 'me' : 'them', m.text));
          const row = h('div', 'chat-actions');
          if (m.kind === 'source_request' && !m.carded) {
            const give = h('button', 'btn small primary', '把原文轉給她'); give.addEventListener('click', () => { this.engine.attachSource(m.cardId); m.carded = true; this.refreshDocs(); });
            row.append(give);
          } else {
            if (m.reply && !m.replied) { const reply = h('button', 'btn small', '回訊息'); reply.addEventListener('click', () => Quiz.openReply(this, this.engine, m)); row.append(reply); }
            if (!m.carded && m.sentences && m.sentences.length) { const open = h('button', 'btn small primary', '開卡'); open.addEventListener('click', this.company(() => this.openNewCard(m))); row.append(open); }
          }
          if (row.children.length) log.append(row);
        }
        // 捲到最後一則。對話常常是剛建好、還沒接上視窗（量不到高度），要等下一幀；每次有新訊息、回了訊息都會重畫到這裡
        requestAnimationFrame(() => { log.scrollTop = log.scrollHeight; });
      };
      const groups = new Set(msgs.filter(m => m.group).map(m => m.group));
      for (const from of contacts) {
        const b = withIcon(h('button', 'doc-item'), groups.has(from) ? 'users' : 'message-circle', from); b.dataset.from = from;
        b.addEventListener('click', () => show(from)); list.append(b);
      }
      show(contacts.includes(selectedFrom) ? selectedFrom : contacts.at(-1));
      return wrap;
    }
    docsNode(kind, selectedId) {
      if (kind === 'line') return this.lineNode(selectedId);
      const docs = this.engine.docs.filter(d => DOC_APPS[kind].origins.includes(d.origin) && d.kind !== 'sent');
      const claire = kind === 'docs' && !!this.engine.ai;
      const wrap = h('div', 'docs'); const list = h('div', 'doc-list'); const pane = h('div', 'doc-pane');
      wrap.append(list, pane);
      if (!docs.length && !claire) { pane.append(h('p', 'muted', DOC_APPS[kind].empty)); return wrap; }
      const showClaire = () => {
        this.docsSelected[kind] = CLAIRE_DOC;
        for (const b of list.children) b.classList.toggle('active', b.dataset.id === CLAIRE_DOC);
        // 名字的由來：Claude 曾把檔案寫進 .claire/ 底下
        pane.replaceChildren(h('h3', '', 'CLAIRE.md'), h('p', 'doc-from', '~/.claire/CLAIRE.md'), this.notesNode());
      };
      if (claire) {
        const b = withIcon(h('button', 'doc-item'), 'sticky-note', 'CLAIRE.md'); b.dataset.id = CLAIRE_DOC;
        b.addEventListener('click', showClaire); list.append(b);
      }
      const show = (doc) => {
        this.docsSelected[kind] = doc.id;
        for (const b of list.children) b.classList.toggle('active', b.dataset.id === doc.id);
        pane.replaceChildren(h('h3', '', doc.title), h('p', 'doc-from', `${doc.from}${doc.carded ? ' ・ 已開卡' : ''}`), h('pre', 'doc-text', doc.text));
        if (doc.replied && !doc.replied.seen) pane.append(h('p', 'doc-replied', doc.replied.text));
        else if (doc.reply) {   // 這則訊息可以回
          const reply = h('button', 'btn', '回訊息'); reply.addEventListener('click', () => Quiz.openReply(this, this.engine, doc));
          const actions = h('div', 'doc-actions'); actions.append(reply); pane.append(actions);
        }
        if (doc.kind === 'source_request') {   // SA 在 LINE 要原始來源
          const give = h('button', 'btn primary', '把原文轉給他'); give.addEventListener('click', () => { this.engine.attachSource(doc.cardId); doc.carded = true; this.refreshDocs(); });
          const read = h('button', 'btn ghost', '已讀'); read.addEventListener('click', () => this.toast('已讀。他會再問的。'));
          const actions = h('div', 'doc-actions'); actions.append(give, read); pane.append(actions);
        } else if (!doc.carded && doc.sentences.length) {   // 有需求句的才能開卡；問問題的信、追問、便條都不行
          const open = h('button', 'btn primary', '開卡'); open.addEventListener('click', this.company(() => this.openNewCard(doc)));
          let actions = pane.querySelector('.doc-actions'); if (!actions) { actions = h('div', 'doc-actions'); pane.append(actions); }
          actions.append(open);
        }
      };
      for (const doc of docs) {
        const b = withIcon(h('button', 'doc-item'), DOC_ICON[doc.origin] || 'file-text', doc.title); b.dataset.id = doc.id;
        b.addEventListener('click', () => show(doc)); list.append(b);
      }
      if (selectedId === CLAIRE_DOC || !docs.length) showClaire();
      else show(docs.find(d => d.id === selectedId) || docs.at(-1));
      return wrap;
    }
    // 開卡畫面：類型、影響範圍、指派、優先度（鎖死 Priority）、內文（句子勾選）、附件
    openNewCard(doc) {
      const id = `newcard:${doc.id}`; const e = this.engine;
      const form = h('form', 'newcard');
      const field = (label, node) => { const row = h('label', 'nc-row'); row.append(h('span', '', label), node); return row; };
      const radios = (name, opts) => { const g = h('div', 'seg'); opts.forEach(([v, t], i) => { const l = h('label'); const r = h('input'); r.type = 'radio'; r.name = name; r.value = v; r.checked = i === 0; l.append(r, h('span', '', t)); g.append(l); }); return g; };
      form.append(field('類型', radios('type', [['feature', '需求'], ['addon', '追加需求'], ['bug', 'bug']])));
      const parent = h('select'); parent.name = 'parent'; parent.append(new Option('—', ''));
      // 結案的卡也能掛：追加需求本來就常是東西上線了才冒出來
      for (const k of e.board.cards) parent.append(new Option(`#${k.no} ${k.title}${k.status === 'archived' ? '（已完成）' : ''}`, k.id));
      form.append(field('母議題', parent));
      const mod = h('select'); mod.name = 'module'; mod.append(new Option('—', '')); for (const [k, v] of Object.entries(MODULES)) mod.append(new Option(v, k));
      form.append(field('影響範圍', mod));
      form.append(field('指派', radios('assignee', [['me', `自己（${e.player.name}）`], ['sa', 'SA 怡君']])));
      const pri = h('input'); pri.value = 'Priority'; pri.disabled = true; pri.className = 'priority-locked';
      form.append(field('優先度', pri));
      const body = h('fieldset', 'nc-body'); body.append(h('legend', '', '內文：勾該進卡的句子'));
      doc.sentences.forEach((s, i) => { const l = h('label', 'nc-sentence'); const c = h('input'); c.type = 'checkbox'; c.name = 'sentence'; c.value = String(i); l.append(c, h('span', '', s.text)); body.append(l); });
      if (!doc.sentences.length) body.append(h('p', 'muted', '（這份文件沒有可以整理的句子）'));
      form.append(body);
      const att = h('label', 'nc-attach'); const ac = h('input'); ac.type = 'checkbox'; ac.name = 'attach'; att.append(ac, h('span', '', '附件：掛原文')); form.append(att);
      const submit = h('button', 'btn primary', '送出'); submit.type = 'submit'; form.append(submit);
      form.addEventListener('submit', (ev) => {
        ev.preventDefault(); const f = new FormData(form);
        const draft = { type: f.get('type'), parent: f.get('parent') || null, module: f.get('module'), assignee: f.get('assignee'), sentences: f.getAll('sentence').map(Number), attach: f.get('attach') === 'on' };
        const card = e.openCardFrom(doc.id, draft);
        this.wm.close(id); this.refreshDocs(); this.refreshBoard();
        if (card) this.toast(`開了一張卡：#${card.no} ${card.title}`);
      });
      this.wm.open({ id, title: `開卡 — ${doc.title}`, icon: 'square-kanban', x: 200, y: 80, w: 520, h: 480, cls: 'win-newcard', content: form });
    }

    openBoard() {
      this.wm.open({ id: 'board', title: 'Tearlol（公司開發進度看板）', icon: 'square-kanban', x: 20, y: 40, w: 760, h: 440, content: this.boardNode() });
      this.engine.emit('board:opened');
    }
    refreshBoard() { if (this.wm.exists('board')) this.wm.setContent('board', this.boardNode()); }
    boardNode() {
      const e = this.engine; const cols = e.board.columns();
      const wrap = h('div', 'board');
      for (const status of BOARD_ORDER) {
        const col = h('div', `col col-${status}`); col.append(h('h3', '', `${STATUS_ZH[status]} ${cols[status].length ? cols[status].length : ''}`));
        for (const card of cols[status]) {
          const k = h('button', `kcard ${e.board.canOperate(card) ? '' : 'readonly'}`);
          const meta = h('span', 'kmeta', `${card.assignee}${card.pending ? '（需求分析中）' : ''}${card.parent ? ` ・ ↖ ${e.board.label(card.parent)}` : ''}`);
          if (card.comments.length) meta.append(' ・ ', Icons.el('message-circle', 'ico-xs'), String(card.comments.length));
          k.append(h('span', 'tag', card.tag), h('span', 'ktitle', `#${card.no} ${card.title}`), meta);
          k.addEventListener('click', () => this.openCard(card.id));
          col.append(k);
        }
        wrap.append(col);
      }
      return wrap;
    }

    // ── 卡片 ──
    openCard(id) {
      const card = this.engine.openCard(id); if (!card) return;
      const n = [...this.wm.windows.keys()].filter(k => k.startsWith('card:')).length;
      this.wm.open({ id: `card:${id}`, title: `#${card.no} ${card.title}`, icon: 'square-kanban', x: 120 + n * 24, y: 70 + n * 24, w: 640, h: 520, cls: 'win-card', content: this.cardNode(card) });
    }
    refreshCard(id) { if (this.wm.exists(`card:${id}`)) this.wm.setContent(`card:${id}`, this.cardNode(this.engine.board.get(id))); }
    cardNode(card) {
      const e = this.engine; const mine = e.board.canOperate(card);
      const wrap = h('div', 'card');
      const head = h('div', 'card-head');
      // Priority 徽章只在當天第一張卡點得到解釋：每張卡都一樣，看過一次就懂
      const tag = h('span', 'tag big', card.tag);
      if (card.no !== (e.script.issueBase || 100) + 1) tag.dataset.noTerms = '';
      head.append(tag, h('h2', '', `#${card.no} ${card.title}`), h('span', `status s-${card.status}`, STATUS_ZH[card.status]));
      wrap.append(head);
      const meta = h('dl', 'card-meta');
      const row = (k, v) => { meta.append(h('dt', '', k), h('dd', '', v)); };
      row('來源', card.from || '—'); row('負責人', card.assignee);
      if (card.parent) { const p = e.board.get(card.parent); row('母議題', p ? `#${p.no} ${p.title}（這張是它的追加需求）` : card.parent); }
      row('估時', card.estimate ? `${card.estimate} 小時` : '未估'); row('實際工時', `${card.actualMin} 分鐘`);
      wrap.append(meta);
      // hybrid 的 SA 卡：「和 AI 討論的結果」那句是紅字大標，語氣和格式都突然變了
      const body = h('div', 'card-body'); const text = h('pre', 'body-text');
      for (const line of card.body.split('\n')) text.append(h('span', line.startsWith('・和 AI 討論的結果') || line.startsWith('和 AI 討論的結果') ? 'ai-claim' : '', line + '\n'));
      body.append(text);
      if (card.attachments.length) { const a = h('div', 'attachments'); for (const f of card.attachments) a.append(withIcon(h('span', 'file'), 'paperclip', f)); body.append(a); }
      wrap.append(body);

      const act = h('div', 'card-activity');
      act.append(h('h4', '', '紀錄'));
      // 一行一件事：「誰：進行了什麼」，點了開那個視窗（停在最後一次的樣子）；別人的留言照原文
      // 交給 AI 的那筆也是玩家的名字（送出去就是你的），後面註明是 AI 填的、有沒有看過
      // 交給 AI、交 QC、結案也各一行：最後一行「進已完成」減第一行，就是結算卡上這張卡的實際耗時
      const by = (x) => (x.by === 'ai' ? `（AI 填的${x.reviewed ? '' : '，沒看'}）` : '');
      const me = this.engine.player.name;
      const EVENT_TEXT = { ai: (x) => `${me}：交給 AI 做${Works.label(x.work)}`, submit: () => `${me}：交給 QC`, closed: () => 'QC 阿姿：驗過了，進已完成' };
      const items = card.timeline();
      if (!items.length) act.append(h('p', 'muted', '還沒有人動過這張卡。'));
      for (const it of items) {
        const li = h('div', `act ${it.kind === 'work' ? 'hist' : it.kind === 'comment' ? `cmt ${it.type}` : `evt ${it.type}`}`);
        li.append(h('span', 'at', it.at != null ? hhmm(it.at) : ''));
        if (it.kind === 'work') { const b = h('button', 'act-link', `${me}${by(it)}：進行了${Works.label(it.work)}`); b.addEventListener('click', () => this.onOpenWork(card, it.work)); li.append(b); }
        else li.append(h('span', '', it.kind === 'comment' ? `${it.who}：${it.text}` : EVENT_TEXT[it.type](it)));
        act.append(li);
      }
      wrap.append(act);

      if (mine) {
        wrap.append(this.opsNode(card));
        const foot = h('div', 'card-foot');
        const no = h('button', 'btn danger', '需求不明，退回 SA'); no.addEventListener('click', () => this.onOpenWork(card, 'reject'));
        foot.append(no);
        // Novel 寫的文件還留著廢話：交出去會被退。打開那份文件一行一行刪（或在終端機那份的答案卡退回「用人話寫」）
        for (const work of Object.keys(card.wordy || {}).filter(w => card.wordy[w])) {
          const fix = h('button', 'btn', `${Works.label(work)}還有 ${card.wordy[work].length} 行廢話`); fix.addEventListener('click', () => this.onOpenWork(card, work)); foot.append(fix);
        }
        // 不交 QC 的卡（POC 母議題）：部署完就算完成，沒有「交給 QC」這一步
        if (card.noQC) foot.append(h('span', 'muted', '這張不交 QC：子議題驗過、部署到 POC 就算完成。'));
        else { const ok = h('button', 'btn primary', '完成，交給 QC'); ok.addEventListener('click', () => e.submit(card.id)); foot.append(ok); }
        wrap.append(foot);
      } else if (card.status === 'archived' && card.assignee === e.player.name) {
        // 已完成的卡：QC 驗過了才能通知需求單位（LIME 才發出去）
        const foot = h('div', 'card-foot');
        const btn = h('button', 'btn primary', card.notified ? '已通知需求單位' : '通知需求單位'); btn.disabled = !!card.notified;
        btn.addEventListener('click', () => e.notifyDone(card.id));
        const said = card.notifyGroup
          ? (card.notified ? '上 POC 了，群組裡也說了。' : `上 POC 了。在「${card.notifyGroup}」說一聲他們才知道能登入。`)
          : (card.notified ? '阿姿驗過、也跟需求單位說了。' : '阿姿驗過了。跟需求單位說一聲他們才知道能用。');
        foot.append(h('span', 'muted', said), btn); wrap.append(foot);
      } else {
        // 自己的卡但交出去了：講卡現在在誰那邊
        const away = { to_qc: '交給 QC 了，阿姿驗完會回你。', rejected_to_sa: '退回給怡君了，現在在她那邊。' };
        const note = card.pending ? '怡君還在分析需求，等她寫好會變成你的。'
          : card.assignee === e.player.name && away[card.status] ? away[card.status] : '這是別人的卡，只能看。';
        wrap.append(h('p', 'muted readonly-note', note));
      }
      return wrap;
    }
    // speedrun 交給 AI 時挑模型（Verse 快但錯多、Essay 中間、Novel 慢又吃兩格）
    // 選單展開在「你可以做的事」最底下一排（浮在按鈕旁邊會被卡片視窗的捲動範圍切掉）；再按一次 AI 或按別的地方就收起來
    pickModel(anchor, onPick) {
      const ops = anchor.closest('.ops');
      const old = ops.querySelector('.model-pick'); if (old) old.remove();
      const box = h('div', 'model-pick');
      const who = anchor.querySelector('.op:not(.op-ai)');
      box.append(h('span', 'muted', `${who ? who.textContent.replace(' ▸', '').replace(' ✓', '') : ''}交給哪個模型？`));
      for (const [name, m] of Object.entries(this.engine.script.ai.models)) {
        const b = h('button', 'op', `${m.label}　${m.turnaround[0]}～${m.turnaround[1]} 分鐘・${m.cost} 格`);
        b.addEventListener('click', (ev) => { ev.stopPropagation(); box.remove(); onPick(name); });
        box.append(b);
      }
      ops.append(box);
      this.engine.emit('ai:picking');   // 提示鏈：第一次挑模型時說三個模型的取捨
      const off = (ev) => { if (!box.contains(ev.target)) { box.remove(); document.removeEventListener('click', off, true); } };
      setTimeout(() => document.addEventListener('click', off, true), 0);
    }
    opsNode(card) {
      const bar = h('div', 'ops'); bar.append(h('h4', '', '你可以做的事'));
      const row = h('div', 'ops-row');
      const e = this.engine;
      const btn = (item) => {
        // 交件了不標在卡上：要自己去終端機看。同一件可以叫它跑好幾份（各扣額度）
        const running = ((card.ai && card.ai[item.id]) || []).filter(j => ['running', 'asking'].includes(j.status)).length;
        const b = h('button', `op ${card.done(item.id) ? 'done' : ''}`, (item.label || Works.label(item.id)) + (card.done(item.id) ? ' ✓' : '') + (running ? `（AI 做事中${running > 1 ? ` ×${running}` : ''}）` : ''));
        b.addEventListener('click', () => this.onOpenWork(card, item.id));
        // 部署有門檻的卡（POC 母議題要等三張子議題驗過）：門沒開就反灰，滑上去寫原因
        if (item.id === 'deploy' && card.deployGate && !card.deployGate(e)) { b.disabled = true; b.title = card.gateText || '還不能部署'; return b; }
        if (!e.ai || item.id === 'manual_test') return b;
        const cell = h('span', 'op-cell');
        const ai = h('button', 'op op-ai', 'AI'); ai.title = '交給 AI（可以叫它跑好幾份，每份扣一次額度）';
        const send = (model) => { if (!e.delegate(card.id, item.id, model)) this.toast(e.aiLack(model) || '這件現在交不出去。', 'AI'); };
        ai.addEventListener('click', () => (e.aiPicksModel() ? this.pickModel(cell, send) : send()));
        cell.append(b, ai);
        return cell;
      };
      // 這張卡沒有的工作不列
      const has = (id) => (card.subtasks || []).some(s => s.work === id);
      for (const item of Works.MENU) {
        if (!item.children) { if (has(item.id)) row.append(btn(item)); continue; }
        const children = item.children.filter(c => has(c.id)); if (!children.length) continue;
        const group = h('span', 'op-group');
        const toggle = h('button', 'op has-menu', `${item.label} ▸`);
        const sub = h('span', 'op-sub'); sub.hidden = true;
        for (const c of children) sub.append(btn(c));
        toggle.addEventListener('click', () => { const open = sub.hidden; for (const s of row.querySelectorAll('.op-sub')) s.hidden = true; sub.hidden = !open; });
        group.append(toggle);
        // speedrun 的主按鈕可以整組交給 AI：依序跑、時間打七折、額度少 1 格，做過的跳過
        if (e.ai && e.aiPicksModel() && children.some(c => e.delegable(card, c.id))) {
          const cell = h('span', 'op-cell');
          const all = h('button', 'op op-ai', 'AI'); all.title = `整組交給 AI：${children.map(c => c.label || Works.label(c.id)).join('、')}依序做，比一份一份交快（做過的跳過）`;
          all.addEventListener('click', () => this.pickModel(cell, (model) => {
            if (!e.delegateGroup(card.id, item.id, model)) this.toast(e.ai.left <= 0 ? '這個時段的 AI 額度用完了。' : '額度不夠整組，或這組都做完了。', 'AI');
          }));
          toggle.replaceWith(cell); cell.append(toggle, all);
        }
        group.append(sub); row.append(group);
      }
      // 這張卡特有的工作（不在一般選單裡的，例如寫檢討報告、找舊資料、手動補救）排在後面
      const menuIds = new Set(Works.MENU.flatMap(m => [m.id, ...(m.children || []).map(c => c.id)]));
      for (const s of card.subtasks || []) if (!menuIds.has(s.work)) row.append(btn({ id: s.work }));
      bar.append(row);
      return bar;
    }
  }
  root.Desk = Desk;
})(window);
