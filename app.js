// app.js — 三個畫面的切換：識別證 → 辦公桌 → 結算卡／bad end。
(function () {
  const app = document.getElementById('app');
  let engine = null, desk = null, raf = null, last = 0;

  // 識別證頁的背景：所有桌子（不含電腦）輪播，不然沒機會看到背景全貌
  const DESKS = [
    { label: 'legacy ・ 手刻 SVG', cls: 'bg-legacy' },
    { label: 'hybrid ・ 程式畫的（PIL）', cls: 'bg-hybrid' },
    { label: 'speedrun ・ AI 生的', cls: 'bg-speedrun' },
    { label: '下班 ・ 茶几', cls: 'bg-night' },
  ];
  // 存檔備份：面板（匯出、匯入、Google 雲端）是各遊戲共用的 savebox.js；外面的按鈕用字，emoji 在各平台長得不一樣
  SaveBox.init({ game: 'it24hr', keys: C.SAVE_KEYS, clientId: location.origin === C.CLOUD_ORIGIN ? C.GOOGLE_CLIENT_ID : null });
  const saveBoxButton = () => { const b = SaveBox.button(); b.textContent = '存檔備份'; b.className = 'save-open'; return b; };
  // 致敬 fab24hr：名字可以不打，空著就用預設名
  const DEFAULT_NAME = '無名氏';
  // 職稱不影響今天會發生的事（104 上一堆不同職稱都在做一樣的事），結算卡會挑一個當隔壁同事
  const TITLES = ['軟體工程師', '全端工程師', '系統分析師', '軟體開發人員', '程式設計師', 'MIS', '資訊工程師', '系統工程師', '網管', '資訊人員', '演算法工程師', 'AI技術顧問', '「資訊室的」', '「IT部門的」'];
  let carousel = null;
  function startCarousel(host) {
    const slides = DESKS.map((d) => { const s = document.createElement('div'); s.className = `bg-slide ${d.cls}`; host.append(s); return s; });
    const cap = document.createElement('p'); cap.className = 'bg-caption'; host.append(cap);
    let i = 0;
    const show = () => { slides.forEach((s, k) => s.classList.toggle('on', k === i)); cap.textContent = DESKS[i].label; i = (i + 1) % slides.length; };
    show(); carousel = setInterval(show, 6000);
  }
  function stopCarousel() { if (carousel) clearInterval(carousel); carousel = null; }

  // 遊戲外（識別證、選玩法）：小卡的「多知道一點」打開整頁的新人手冊（首頁也看得到手冊）
  const handbookOutside = () => Handbook.configure({ onMore: (id) => Handbook.openOverlay(id) });
  const ghostButton = (cls, text, onClick) => { const b = document.createElement('button'); b.type = 'button'; b.className = `btn ghost ${cls}`; b.textContent = text; b.addEventListener('click', onClick); return b; };
  const handbookButton = (cls) => ghostButton(cls, '新人手冊', () => Handbook.openOverlay());
  // IT 圖鑑（職稱地圖）跟手冊並排放
  const atlasButton = (cls) => ghostButton(cls, 'IT 圖鑑', () => Atlas.openOverlay());
  // 認識軟體工程、CSIE 課程是坐下來慢慢讀的長篇，開新分頁；認識軟體工程還在寫
  const seButton = (cls) => {
    const b = ghostButton(cls, '認識軟體工程', () => {}); b.disabled = true;
    const note = document.createElement('small'); note.textContent = '籌備中'; b.append(note);
    return b;
  };
  const csieButton = (cls) => ghostButton(cls, 'CSIE 課程', () => window.open('csie.html', '_blank', 'noopener'));
  // 首頁四顆鈕，照順序
  const learnButtons = (cls) => [atlasButton(cls), seButton(cls), handbookButton(cls), csieButton(cls)];
  // 結算卡、三天總結算上的印章：點了開 CSIE 課程、直接翻到資料結構小教室的那一頁
  const stampLink = (node, name) => {
    const id = Classroom.pageForStamp(name, Verdict.NAMES); if (!id) return node;
    const go = () => window.open(`csie.html#ds/${id}`, '_blank', 'noopener');
    Object.assign(node, { tabIndex: 0, title: '到 CSIE 課程的資料結構小教室看看這是什麼' }); node.setAttribute('role', 'button'); node.classList.add('stamp-link');
    node.addEventListener('click', go);
    node.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); go(); } });
    return node;
  };

  function badge() {
    stopCarousel(); handbookOutside();
    app.innerHTML = `
      <section class="badge-screen"><div class="bg-carousel"></div>
        <div class="badge-cols">
        <form class="badge">
          <div class="badge-photo"><canvas class="avatar" width="96" height="112" aria-label="識別證頭像"></canvas>
            <button type="button" class="reroll" title="重拍一張">重拍一張</button></div>
          <label>姓名<input name="name" value="" placeholder="不填就叫${DEFAULT_NAME}" maxlength="12"></label>
          <div class="field"><span>性別</span>
            <div class="seg" role="radiogroup" aria-label="性別">
              <label><input type="radio" name="gender" value="女"><span>女</span></label>
              <label><input type="radio" name="gender" value="男"><span>男</span></label>
              <label><input type="radio" name="gender" value="其他" checked><span>其他</span></label>
            </div></div>
          <label>職稱<select name="title">${TITLES.map(t => `<option>${t}</option>`).join('')}</select></label>
          <p class="muted">職稱不影響今天會發生的事。<br>因為對很多人來說，就是公司那群用電腦的人，不用分那麼細。<br>想知道實際上的工作差異，請參考 IT 圖鑑。</p>
          <button class="btn primary" type="submit">上班</button>
        </form>
        <aside class="badge-side">
          <header class="title"><p class="bsod-face" aria-hidden="true">:(</p><h1>IT<span class="n24">24</span>hr</h1><p class="sub">軟體工程師的一天</p></header>
          <p class="tagline">每個人都遞給你被標記為「Priority」的工作，因此沒有任何一件事能被真正優先處理。</p>
          <div class="side-links"><span class="hb-slot"></span></div>
          <p class="credit">靈感來自 <a href="https://fab24hr.com/" target="_blank" rel="noopener">fab24hr</a>（晶圓廠打工人的一天）</p>
          <p class="credit save-slot"></p>
        </aside>
        </div>
      </section>`;
    startCarousel(app.querySelector('.bg-carousel'));
    app.querySelector('.hb-slot').replaceWith(...learnButtons('hb-open'));
    app.querySelector('.save-slot').append(saveBoxButton());   // 換新裝置的玩家第一眼只看得到這頁
    // 上次填的識別證帶回來；職稱清單改過的話，舊職稱選不到，留預設值
    const form = app.querySelector('form'); const titleSelect = app.querySelector('[name=title]'); let salt = 0;
    const last = loadPlayer();
    if (last) {
      form.name.value = last.name; form.gender.value = last.gender; salt = last.avatarSalt || 0;
      if (TITLES.includes(last.title)) titleSelect.value = last.title;
    }
    // 副標跟著職稱走：選什麼就是「○○的一天」
    const sub = app.querySelector('.title p.sub');
    const syncSub = () => { sub.textContent = `${titleSelect.value}的一天`; };
    titleSelect.addEventListener('change', syncSub); syncSub();
    // 頭像：名字和性別當種子，換一張就加鹽
    const canvas = app.querySelector('canvas.avatar');
    const drawAvatar = () => Avatar.draw(canvas, { name: form.name.value.trim() || DEFAULT_NAME, gender: form.gender.value, salt });
    form.name.addEventListener('input', drawAvatar); form.addEventListener('change', (e) => { if (e.target.name === 'gender') drawAvatar(); });
    app.querySelector('.reroll').addEventListener('click', () => { salt++; drawAvatar(); });
    drawAvatar();
    form.addEventListener('submit', (ev) => {
      ev.preventDefault();
      const f = new FormData(ev.target);
      const player = { name: f.get('name').trim() || DEFAULT_NAME, gender: f.get('gender'), title: f.get('title'), avatarSalt: salt };
      writePlayer(player); modes(player);
    });
  }

  // ── 選一種玩法：新人訓練（三天教學關，有存檔就接著上次）、正式上班（沙盒）三個模式。畫面跟識別證頁同一套：桌面輪播、紙色卡片；PC 兩欄 ──
  const MODES = [
    { id: 'legacy', title: 'legacy', desc: '沒有AI的時候，我們都是這樣上班的，那是一個腳踏實地的質樸年代。' },
    { id: 'hybrid', title: 'hybrid', desc: '你開始把部分工作交給 AI，媒體說 vibe code 正夯，同事還沒跟上，你跟 AI 同事還在磨合。' },
    { id: 'speedrun', title: 'speedrun', desc: '公司補助了 AI 服務，現在AI是正式的同事編制了，真好。這個世界正在瘋狂的高效運轉著，而我們就是一台洗衣機。' },
  ];
  const TRAINING_DAYS = [['第一天', 'legacy'], ['第二天', 'hybrid'], ['第三天', 'speedrun']];
  function modes(player) {
    const el = (tag, cls, text) => { const n = document.createElement(tag); if (cls) n.className = cls; if (text !== undefined) n.textContent = text; return n; };
    const btn = (cls, text, onClick) => { const b = el('button', `btn ${cls}`, text); b.type = 'button'; if (onClick) b.addEventListener('click', onClick); else b.disabled = true; return b; };
    stopCarousel(); handbookOutside();
    app.innerHTML = '';
    const screen = el('section', 'mode-screen');
    const bg = el('div', 'bg-carousel');
    const head = el('header', 'mode-head');
    // 簡易版識別證，四顆鈕是員工手冊的索引標籤，夾在識別證旁邊（白字壓在輪播圖上看不清楚）
    const face = el('canvas'); face.setAttribute('aria-label', '識別證頭像');
    Avatar.draw(face, { name: player.name, gender: player.gender, salt: player.avatarSalt || 0 }, 3);
    const who = el('div', 'mode-badge-who'); who.append(el('h2', '', '選一種玩法'), el('p', '', `${player.name}・${player.title}`), saveBoxButton());
    const card = el('div', 'mode-badge'); card.append(face, who);
    const tabs = el('nav', 'mode-tabs'); tabs.setAttribute('aria-label', '查資料'); tabs.append(...learnButtons('index-tab'));
    const pass = el('div', 'mode-pass'); pass.append(card, tabs);
    head.append(btn('mode-back', '‹ 回識別證', badge), pass);
    const cols = el('div', 'mode-cols');

    // 新人訓練：存檔是天與天之間的，有存檔就接著那一天
    const save = loadSave();
    const next = save ? ({ day2: 2, day3: 3, done: 4 })[save.day] || 0 : 0;   // 4：三天都做完了
    const train = el('article', 'mode-card');
    const days = el('ol', 'mode-days');
    TRAINING_DAYS.forEach(([day, mode], i) => {
      const n = i + 1;
      const li = el('li', n < next ? 'done' : n === next ? 'next' : '');
      li.append(el('span', '', day), el('span', 'mono', mode));
      // 做完的天：按「做完了」看那天最後一次的結算卡；也可以重玩，從那天早上重來（第一天跟「從第一天開始」一樣）
      const view = n < next && save.reports && save.reports[`day${n}`];
      if (n < next) li.append(view ? btn('mode-state mode-done', '做完了', () => showReport(view, [{ text: '回選玩法', cls: 'primary', onClick: () => modes(player) }]))
        : el('span', 'mode-state', '做完了'),
        btn('mode-replay', '重玩', () => (n === 1 ? start(player) : playDay(save, `day${n}`))));
      if (n === next) li.append(el('span', 'mode-state', '接著這天'));
      days.append(li);
    });
    train.append(el('h4', '', '三天上手'),
      el('p', 'mode-desc', '用三天的時間做完一個系統，讓你認識基本操作和三個模式，快速理解「IT」在幹嘛。'), days);
    const row = el('div', 'mode-actions');
    if (save) {
      train.append(el('p', 'mode-progress', `存檔：${save.player.name}・${save.player.title}`));
      row.append(btn('', '從第一天開始', () => start(player)));
      if (next <= 3) row.append(btn('primary', `接著第 ${next} 天`, () => playDay(save)));
      if (save.summary) row.append(btn(next > 3 ? 'primary' : '', '三天總結算', () => showSummary(save)));
    } else row.append(btn('primary', '從第一天開始', () => start(player)));
    train.append(row);
    if (save) train.append(btn('mode-clear', '清掉新人訓練的存檔', () => { clearSave(); modes(player); }));
    const trainCol = el('section', 'mode-col');
    trainCol.append(el('h3', 'mode-group', '新人訓練'), train);

    // 沙盒（玩家看到的叫「正式上班」）：新人訓練結業才開放；劇本還在寫，開放了也先是準備中
    const sandboxCol = el('section', 'mode-col');
    sandboxCol.append(el('h3', 'mode-group', '正式上班'));
    for (const m of MODES) {
      const card = el('article', 'mode-card');
      card.append(el('h4', 'mono', m.title), el('p', 'mode-desc', m.desc));
      const r = el('div', 'mode-actions'); r.append(btn('', save && save.graduated ? '準備中' : '完成新人訓練後開放')); card.append(r);
      sandboxCol.append(card);
    }
    cols.append(trainCol, sandboxCol);
    screen.append(bg, head, cols); app.append(screen);
    Handbook.mark(cols);
    startCarousel(bg);
  }

  // ── 存檔：只存天與天之間（一天玩到一半關掉，下次從那天早上重來）──
  const SAVE_KEY = 'it24hr.save';
  function loadSave() { try { const s = JSON.parse(localStorage.getItem(SAVE_KEY)); return s && s.player && s.day ? s : null; } catch { return null; } }
  function writeSave(save) { try { localStorage.setItem(SAVE_KEY, JSON.stringify(save)); } catch { /* 無痕視窗或空間滿了：就不存 */ } }
  function clearSave() { try { localStorage.removeItem(SAVE_KEY); } catch { /* 同上 */ } }
  // 識別證另外存：存檔要做完第一天才有，清掉新人訓練的存檔也不該連識別證一起清；還沒有這個 key 的舊玩家從存檔帶
  const PLAYER_KEY = 'it24hr.player';
  function loadPlayer() { try { return JSON.parse(localStorage.getItem(PLAYER_KEY)) || (loadSave() || {}).player || null; } catch { return null; } }
  function writePlayer(player) { try { localStorage.setItem(PLAYER_KEY, JSON.stringify(player)); } catch { /* 同上 */ } }
  // 那一天開始時帶的東西：存檔每天都留一份（starts），做完的天才能重玩；只有 carry 的舊存檔只有下一天的
  function carryFor(save, day) { return (save.starts && save.starts[day]) || (save.day === day ? save.carry : null); }
  // 照存檔開始那一天：劇本照 carry 產，昨天沒結案的卡（carry.board）放回看板
  function playDay(save, day = save.day) {
    const carry = carryFor(save, day);
    start(save.player, day === 'day2' ? DAY2.make(carry) : DAY3.make(carry), carry && carry.board);
  }

  function start(player, script = DAY1, carried = null) {
    stopCarousel();
    engine = new Engine(script, player, { carried });
    app.innerHTML = '';
    desk = new Desk(app, engine, { onOpenWork: openWork });
    window.__game = { engine, desk };
    // 一天結束就存檔（連同這張結算卡）：之後從選玩法畫面接著玩下一天，或按「做完了」再看一次
    engine.on('day:end', (report) => {
      stop();
      const view = reportView(engine, report); const save = nextSave(engine, view); writeSave(save);
      // 第三天的隔天是結業早會，不是下一天的辦公桌
      const tomorrow = save.day === 'done' ? () => showGraduation(save) : () => playDay(save);
      showReport(view, [{ text: '再過一次', onClick: badge }, { text: '隔天', cls: 'primary', onClick: tomorrow }]);
    });
    // bad end：照樣出結算卡，上面一條 BAD END 和原因；那一天沒過，不存檔、只能重來
    engine.on('bad_end', ({ reason, report }) => {
      stop(); showReport({ ...reportView(engine, report), badEnd: reason }, [{ text: '重來這一天', cls: 'primary', onClick: () => start(player, script, carried) }]);
    });
    engine.on('home:menu', () => HomeMenu.open(app, engine));   // 離開公司：先選吃的、要不要帶公司筆電，再進茶几
    // 還沒做的那一天只有開場的公司早會，開完就是待續
    if (!script.mainCard) engine.on('meeting:end', () => setTimeout(() => { stop(); showToBeContinued(engine.flags); }, 1500));
    last = performance.now();
    const loop = (t) => { engine.tick(t - last); last = t; desk.tick(); raf = requestAnimationFrame(loop); };
    raf = requestAnimationFrame(loop);
  }
  function stop() { if (raf) cancelAnimationFrame(raf); raf = null; }

  function openWork(card, work, opts) { Quiz.open(desk, engine, card, work, opts); }

  // 結算卡要畫的資料：算好的結算＋主線成品縮圖的 model。存檔也存一份，選玩法畫面按「做完了」用目前的版面重畫
  function reportView(e, report) {
    const main = e.script.mainCard && e.board.get(e.script.mainCard);
    return { report, mode: e.script.mode || 'legacy', scriptName: e.script.name,
      shot: main && main.screen ? { model: Screen.model(main), label: `今天交出去的：#${main.no} ${main.title}` } : null };
  }
  // 結算卡：背景是拿掉電腦的桌面；PC 兩欄——左欄放詳細統計，右欄放成就、彙整統計和有評語的
  // （「今天你是 {資料結構}」印章、總評、習慣與成就、同事怎麼說、估時）。actions 是底下的按鈕；badEnd 是 bad end 的原因，卡片上面多一條
  function showReport(view, actions) {
    const { report, mode, scriptName, shot: shotData, badEnd } = view;
    const el = (tag, cls, text) => { const n = document.createElement(tag); if (cls) n.className = cls; if (text !== undefined) n.textContent = text; return n; };
    app.innerHTML = `<section class="report-screen bg-${mode}"><header class="report-bad" hidden><h1>BAD END</h1><p class="reason"></p></header><article class="report">
        <div class="report-left"><div class="report-who"></div><div class="report-tally"></div></div>
        <div class="report-right"><p class="report-you">今天你是</p><p class="stamp"></p><p class="verdict-line"></p><ul class="evidence"></ul>
          <h3 class="peers-title traits-title">習慣與成就</h3><div class="peers traits"></div>
          <h3 class="peers-title">同事怎麼說</h3><div class="peers"></div></div>
      </article>
      <div class="report-actions"></div></section>`;
    if (badEnd) { app.querySelector('.report-bad').hidden = false; app.querySelector('.report-bad .reason').textContent = badEnd; }
    const who = app.querySelector('.report-who');
    const face = document.createElement('canvas'); face.className = 'report-avatar';
    Avatar.draw(face, { name: report.player.name, gender: report.player.gender, salt: report.player.avatarSalt || 0 }, 3);
    // 隔壁同事：職稱跟你不一樣，做的事一樣（「隔壁○○○和你的工作有 87 分像」）；同一個人同一天固定是同一位
    const others = TITLES.filter(t => t !== report.player.title && !t.startsWith('「'));
    const neighbor = others[Math.floor(Works.aiRoll(`${report.player.name}:${scriptName}`) * others.length)];
    const names = el('div');
    names.append(el('b', '', report.player.name), el('span', '', report.player.title), el('span', 'report-neighbor', `隔壁的${neighbor}和你的工作有 87 分像。`));
    who.append(face, names);
    // 成品縮圖：主線那張卡今天做出來的頁面（沒寫程式就是 404）
    if (shotData) {
      const shot = el('div', 'report-shot'); const page = Screen.render(shotData.model, 'pc'); shot.append(page); who.after(shot);
      shot.after(el('p', 'report-shot-label', shotData.label));
      requestAnimationFrame(() => { page.style.transform = `scale(${shot.clientWidth / 960})`; });
    }
    // 左欄：每張卡的分數一組（卡名在前）；AI 同事那幾行收成預設摺起來的區塊
    const tally = app.querySelector('.report-tally'); const groups = {};
    for (const t of report.tally) {
      const line = el('p', t.weight || '', t.text);
      if (!t.group) { tally.append(line); continue; }
      if (!groups[t.group]) { const d = el('details', 'tally-group'); d.append(el('summary', '', t.group)); tally.append(d); groups[t.group] = d; }
      groups[t.group].append(line);
    }
    const traits = app.querySelector('.traits');
    for (const t of report.traits || []) { const row = el('p', 'peer'); row.append(el('b', '', t.title), el('span', '', t.text)); traits.append(row); }
    if (!(report.traits || []).length) { app.querySelector('.traits-title').hidden = true; }
    // 估時沒有對錯：放右欄「同事怎麼說」後面（左欄太長、右欄空著）。
    // 你估的和實際並排，底下是這張卡在現實中大約多久、主管看差多少的那句（主管那句放最後）
    if (report.estimates.length) {
      const right = app.querySelector('.report-right');
      right.append(el('h3', 'peers-title estimates-title', '估時'));
      const table = el('table', 'report-estimates');
      const head = el('tr'); for (const t of ['卡', '你估的', '實際']) head.append(el('th', '', t));
      table.append(head);
      for (const r of report.estimates) {
        const tr = el('tr'); for (const v of [r.card, r.yours, r.actual]) tr.append(el('td', '', v)); table.append(tr);
        if (!r.boss && !r.real) continue;
        const note = el('tr', 'real'); const td = el('td'); td.colSpan = 3;
        if (r.real) td.append(el('p', '', Verdict.realLine(r.real)));
        if (r.boss) { const say = el('p', 'boss-says'); say.append(el('b', '', '主管'), el('span', '', `「${r.boss}」`)); td.append(say); }
        note.append(td); table.append(note);
      }
      right.append(table);
    }
    stampLink(app.querySelector('.stamp'), report.kind).textContent = report.kind;
    app.querySelector('.verdict-line').textContent = report.line;
    const ev = app.querySelector('.evidence'); for (const e of report.evidence) ev.append(el('li', '', e));
    const peers = app.querySelector('.peers:not(.traits)');
    for (const p of report.peers) { const row = el('p', 'peer'); row.append(el('b', '', p.who), el('span', '', p.text)); peers.append(row); }
    if (!report.peers.length) { app.querySelector('.peers-title:not(.traits-title)').hidden = true; }
    const row = app.querySelector('.report-actions');
    row.append(...Share.buttons(view, el));   // 分享結算卡（圖）、分享連結（參考 fab24hr）
    for (const a of actions) { const b = el('button', `btn ${a.cls || ''}`, a.text); b.addEventListener('click', a.onClick); row.append(b); }
  }
  // 隔天：第一天 → 第二天（帶著第一天主卡的選擇、看板號碼、配色）→ 第三天（帶著 AI 筆記）→ 結業；前兩次都帶著沒結案的卡（board）。
  // view 是今天的結算卡，存起來給「做完了」看。結業過一次就一直算結業（graduated），重玩哪一天都不會把正式上班鎖回去；
  // 三天總結算存成一份小快照（summary），重玩第一天清掉後面的結算卡也還看得到上一次的
  function nextSave(e, view) {
    const old = loadSave() || {};
    const kept = old.graduated ? { graduated: true, summary: old.summary } : {};
    if (e.script.mode === 'legacy') {   // 第一天重來：之後的天都要重新走，起點和結算卡只留第一天的
      const main = e.board.get(e.script.mainCard);
      const carry = { picks: (main && main.picks) || {}, lastNo: e.board.nextNo - 1, style: main ? Screen.styleOf(Screen.model(main)) : 'plain', board: e.carryOver() };
      return { day: 'day2', dayName: '第二天', player: e.player, carry, starts: { day2: carry }, reports: { day1: view }, ...kept };
    }
    if (e.script.mode === 'speedrun') {
      const reports = { ...(old.reports || {}), day3: view };
      return { day: 'done', dayName: '結業', player: e.player, carry: null, starts: old.starts || {}, reports, graduated: true, summary: Verdict.summary(reports) };
    }
    const carry = { notes: e.ai ? e.ai.notes : {}, board: e.carryOver() };   // AI 筆記和沒結案的卡帶到隔天
    return { day: 'day3', dayName: '第三天', player: e.player, carry, starts: { ...(old.starts || {}), day3: carry }, reports: { ...(old.reports || {}), day2: view }, ...kept };
  }
  // 結業早會：外框畫面的風格，台詞一句一句出來（點一下就下一句，不點每 1.6 秒自己來），最後「新人訓練結束」
  function showGraduation(save) {
    const g = DAY3.GRADUATION;
    const el = (tag, cls, text) => { const n = document.createElement(tag); if (cls) n.className = cls; if (text !== undefined) n.textContent = text; return n; };
    app.innerHTML = '';
    const screen = el('section', 'report-screen bg-speedrun grad-screen');
    const card = el('article', 'grad-card');
    card.append(el('h2', 'grad-title', g.title));
    const list = el('div', 'grad-lines'); card.append(list);
    const end = el('div', 'grad-end'); end.hidden = true;
    end.append(el('h1', '', g.end), el('button', 'btn primary', '三天總結算'));
    end.querySelector('button').addEventListener('click', () => { clearTimeout(timer); showSummary(save); });
    screen.append(card, end); app.append(screen);
    let i = 0, timer = null;
    const next = () => {
      clearTimeout(timer);
      if (i >= g.lines.length) { end.hidden = false; return; }
      const l = g.lines[i++]; const row = el('p', 'grad-line');
      row.append(el('b', '', l.who), ...(l.aside ? [el('span', 'grad-aside', `（${l.aside}）`)] : []), el('span', '', `「${l.text}」`));
      list.append(row);
      timer = setTimeout(next, 1600);
    };
    card.addEventListener('click', next);
    next();
  }
  // 三天總結算：三個時代各一句總評、三天的印章並排，可以分享
  function showSummary(save) {
    const el = (tag, cls, text) => { const n = document.createElement(tag); if (cls) n.className = cls; if (text !== undefined) n.textContent = text; return n; };
    // 三天的結算卡都還在就照它們重算（舊存檔的快照沒有評語）；重玩第一天清掉後面的，才用結業時存的快照
    const fresh = Verdict.summary(save.reports || {});
    const summary = save.summary && save.summary.days.length > fresh.days.length ? save.summary : fresh;
    app.innerHTML = '';
    const screen = el('section', 'report-screen bg-speedrun summary-screen');
    const card = el('article', 'summary-card');
    // 大頭照和名字（放了才有結業的感覺），跟結算卡左上角同一塊
    const who = el('div', 'report-who summary-who');
    const face = document.createElement('canvas'); face.className = 'report-avatar';
    Avatar.draw(face, { name: save.player.name, gender: save.player.gender, salt: save.player.avatarSalt || 0 }, 3);
    const names = el('div'); names.append(el('b', '', save.player.name), el('span', '', save.player.title || ''));
    who.append(face, names);
    card.append(el('h2', 'summary-title', '新人訓練三天'), who);
    const days = el('div', 'summary-days');
    for (const d of summary.days) {
      const col = el('section', 'summary-day');
      col.append(el('p', 'summary-day-name', `${d.day}・${d.mode}`), stampLink(el('p', 'stamp', d.stamp), d.stamp), el('p', 'summary-line', d.line));
      // 那天結算卡右欄的「習慣與成就」「同事怎麼說」「估時」（評語、成就、估時都要）；估時只列你估的、實際和主管那句
      for (const t of d.traits || []) { const row = el('p', 'peer summary-trait'); row.append(el('b', '', t.title), el('span', '', t.text)); col.append(row); }
      for (const p of d.peers || []) { const row = el('p', 'peer summary-peer'); row.append(el('b', '', p.who), el('span', '', p.text)); col.append(row); }
      for (const r of d.estimates || []) {
        const row = el('p', 'peer summary-est'); row.append(el('b', '', r.card), el('span', '', `你估的 ${r.yours}・實際 ${r.actual}`));
        if (r.boss) row.append(el('span', 'summary-boss', `主管「${r.boss}」`));
        col.append(row);
      }
      days.append(col);
    }
    card.append(days, el('p', 'summary-chain mono', summary.chain));
    const row = el('div', 'report-actions');
    row.append(...Share.buttons({ summary, player: save.player }, el));
    const back = el('button', 'btn primary', '回選玩法'); back.addEventListener('click', () => modes(save.player)); row.append(back);
    screen.append(card, row); app.append(screen);
  }
  function showToBeContinued(flags) {
    app.innerHTML = `<section class="bad-screen tbc"><h1>第三天</h1><p class="reason">還沒做。廠商的 POC 你${flags.volunteered ? '自己接了' : '被指定對接'}。</p><button class="btn primary">回到識別證</button></section>`;
    app.querySelector('button').addEventListener('click', badge);
  }
  // 三天是三堂課：當掉哪一天重來哪一天
  // 瀏覽器要玩家點過畫面或按過鍵才給出聲：每次都確認通知音是開著的
  for (const type of ['pointerdown', 'keydown']) document.addEventListener(type, () => Sound.unlock());
  badge();
})();
