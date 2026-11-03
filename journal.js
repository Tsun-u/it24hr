// journal.js — 工作日誌（新人訓練結業後，選玩法畫面新人訓練下面的入口）：浮動視窗五個分頁——
// CLAIRE.md 目前的樣子、拿過的成就、三個時代各一頁（每一關最後一次的結算卡，還沒玩過的是「?」）。
// 資料整理（notes／achievements／levels）是純函式，node 測得到；open 畫浮動視窗（瀏覽器）
(function (root) {
  const ERAS = ['legacy', 'hybrid', 'speedrun'];
  // 每天都會有的習慣紀錄，不算成就（結算卡上「習慣與成就」混在一起）
  const HABITS = new Set(['便條', '平板', '測試', '提示']);
  const DAY_NAMES = { day1: '新人訓練第一天', day2: '新人訓練第二天', day3: '新人訓練第三天' };
  const traitsOf = (view) => (view && view.report && view.report.traits) || [];

  // CLAIRE.md：筆記 { 主題: { stance, text } 或字串 } 攤成一條一條
  function notes(raw) {
    return Object.entries(raw || {}).map(([topic, n]) => ({ topic, text: typeof n === 'string' ? n : n.text }));
  }
  // 拿過的成就：新人訓練每一天、正式上班每一關每個時代最後一次的結算卡，扣掉習慣紀錄；同一個成就只列一次，寫最近在哪拿到
  function achievements(training, office, levelName) {
    const seen = new Map();
    const add = (view, where) => { for (const t of traitsOf(view)) if (!HABITS.has(t.title)) seen.set(t.title, { title: t.title, text: t.text, where }); };
    for (const [day, view] of Object.entries((training && training.reports) || {})) add(view, DAY_NAMES[day] || day);
    for (const [level, eras] of Object.entries((office && office.levels) || {})) {
      for (const [mode, rec] of Object.entries(eras)) add(rec && rec.view, `${levelName(level)}・${mode}`);
    }
    return [...seen.values()];
  }
  // 一個時代的分頁：每一關一列，玩過的帶最後一次的紀錄（{ view, at, plays }），沒玩過的是 null
  function levels(office, mode, ids) {
    return ids.map(id => ({ id, last: (office && office.levels && office.levels[id] && office.levels[id][mode]) || null }));
  }

  // ── 浮動視窗（跟新人手冊、更新履歷同一套浮層）──
  let overlay = null;
  const h = (tag, cls, text) => { const n = document.createElement(tag); if (cls) n.className = cls; if (text !== undefined) n.textContent = text; return n; };
  function close() { if (overlay) { overlay.remove(); overlay = null; } }
  // data：{ training, office, claire, levelIds, levelName }；onReport(view) 打開那一張結算卡
  function open(data, onReport) {
    close();
    overlay = h('div', 'hb-overlay');
    const panel = h('div', 'hb-panel journal'); const head = h('header', 'hb-head');
    const shut = h('button', 'btn ghost', '關閉'); shut.type = 'button'; shut.addEventListener('click', close);
    head.append(h('h2', '', '工作日誌'), shut);
    const tabs = h('div', 'journal-tabs'); tabs.setAttribute('role', 'tablist');
    const body = h('div', 'journal-body');
    const pages = [['claire', 'CLAIRE.md'], ['achievements', '成就'], ...ERAS.map(m => [m, m])];
    const show = (id) => {
      for (const b of tabs.children) b.setAttribute('aria-selected', String(b.dataset.tab === id));
      body.replaceChildren(id === 'claire' ? claireNode(data.claire) : id === 'achievements' ? achievementsNode(data) : eraNode(data, id, onReport));
      Ink.paperize(panel);   // 換頁後新長出來的按鈕
    };
    for (const [id, label] of pages) {
      const b = h('button', `journal-tab${ERAS.includes(id) ? ' mono' : ''}`, label); b.type = 'button'; b.dataset.tab = id; b.setAttribute('role', 'tab');
      b.addEventListener('click', () => show(id)); tabs.append(b);
    }
    panel.append(head, tabs, body); overlay.append(panel);
    overlay.addEventListener('click', (e) => { if (e.target === overlay) close(); });
    document.body.append(overlay);
    show('claire');
  }
  function claireNode(raw) {
    const wrap = h('div', 'journal-page');
    wrap.append(h('h3', '', 'CLAIRE.md'), h('p', 'doc-from', '~/.claire/CLAIRE.md'));
    const list = notes(raw);
    if (!list.length) { wrap.append(h('p', 'muted', '還沒有筆記。')); return wrap; }
    const ul = h('ul', 'journal-notes'); for (const n of list) ul.append(h('li', '', n.text));
    wrap.append(ul); return wrap;
  }
  function achievementsNode(data) {
    const wrap = h('div', 'journal-page');
    const list = achievements(data.training, data.office, data.levelName);
    if (!list.length) { wrap.append(h('p', 'muted', '還沒拿到成就。')); return wrap; }
    for (const a of list) {
      const row = h('div', 'journal-row'); const words = h('div', 'journal-words');
      words.append(h('b', '', a.title), h('span', '', a.text));
      row.append(words, h('span', 'journal-where', a.where)); wrap.append(row);
    }
    return wrap;
  }
  function eraNode(data, mode, onReport) {
    const wrap = h('div', 'journal-page');
    for (const { id, last } of levels(data.office, mode, data.levelIds)) {
      const row = h('div', `journal-row${last ? '' : ' unplayed'}`); const words = h('div', 'journal-words');
      if (!last) { words.append(h('b', '', '?'), h('span', 'muted', '還沒玩過')); row.append(words); wrap.append(row); continue; }
      words.append(h('b', '', data.levelName(id)), h('span', 'muted', `最後一次：${last.at}（玩了 ${last.plays} 次）`));
      const see = h('button', 'btn', '結算卡'); see.type = 'button'; see.addEventListener('click', () => { close(); onReport(last.view); });
      row.append(words, see); wrap.append(row);
    }
    return wrap;
  }
  if (typeof document !== 'undefined') document.addEventListener('keydown', (e) => { if (e.key === 'Escape') close(); });

  const Journal = { ERAS, notes, achievements, levels, open, close };
  if (typeof module !== 'undefined') module.exports = { Journal };
  else root.Journal = Journal;
})(typeof window !== 'undefined' ? window : globalThis);
