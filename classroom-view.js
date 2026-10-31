// classroom-view.js — 資料結構小教室的畫面：左邊目錄、右邊講義，放在 CSIE 課程頁（csie.html）裡。
// 目錄在 classroom.js、每頁的內容和圖在 classroom/<id>.js；圖用 rough.js 畫成手繪風的 SVG（vendor/rough.js）
(function (root) {
  const h = (tag, cls, text) => { const el = document.createElement(tag); if (cls) el.className = cls; if (text !== undefined) el.textContent = text; return el; };
  const SVG = 'http://www.w3.org/2000/svg';
  const svgEl = (w, hgt) => { const s = document.createElementNS(SVG, 'svg'); s.setAttribute('viewBox', `0 0 ${w} ${hgt}`); s.setAttribute('width', w); s.setAttribute('height', hgt); return s; };
  const svgText = (s, x, y, text, size = 15) => {
    const t = document.createElementNS(SVG, 'text'); t.setAttribute('x', x); t.setAttribute('y', y); t.setAttribute('text-anchor', 'middle');
    t.setAttribute('dominant-baseline', 'central'); t.setAttribute('font-size', size); t.setAttribute('class', 'cr-num'); t.textContent = text; s.append(t); return t;
  };
  // 每頁畫圖用的工具：page.draw(kit, state, { sandbox }) 把沙盒的一個狀態畫成 SVG（分格圖每一步畫一次，沙盒呼叫時 sandbox 是 true，各圖自己決定大小）。
  // 顏色：INK 線、FILL 一般的格子、NEW 這一步動到的
  const kit = { h, svgEl, svgText, rough: root.rough, INK: '#1f2328', FILL: '#9cc3f5', NEW: '#ffd166' };

  function section(title, ...children) { const sec = h('section', 'cr-sec'); sec.append(h('h4', '', title), ...children); return sec; }
  const ul = (arr) => { const l = h('ul'); for (const t of arr) l.append(h('li', '', t)); return l; };

  // 分格靜態圖：照劇本的操作重播，每一步一格，格子下面寫操作
  function framesNode(id, page) {
    const row = h('div', 'cr-frames');
    for (const f of root.Classroom.replay(id, page.frames)) {
      const fig = h('figure', 'cr-frame'); fig.append(page.draw(kit, f.state), h('figcaption', 'mono', f.label)); row.append(fig);
    }
    return row;
  }
  // 自己按的小沙盒：操作鈕＋目前的樣子＋這一步發生什麼；沙盒的 errors 可以換掉或補上錯誤訊息
  function sandboxNode(page) {
    const box = page.sandbox; let s = box.init();
    const wrap = h('div', 'cr-sandbox'); const stage = h('div', 'cr-stage'); const note = h('p', 'cr-note mono', '按下面的鈕試試看。');
    const ops = h('div', 'cr-ops');
    const ERR = { underflow: '空的，沒東西可以拿（underflow）', overflow: `滿了，容量 ${box.capacity}（overflow）`, ...box.errors };
    const draw = () => { stage.replaceChildren(page.draw(kit, s, { sandbox: true })); };
    for (const { op, label } of box.ops) {
      const b = h('button', 'btn', label); b.type = 'button';
      b.addEventListener('click', () => { s = box.apply(s, op); note.textContent = s.error ? ERR[s.error] : box.label(op, s); draw(); });
      ops.append(b);
    }
    const reset = h('button', 'btn ghost', '重來'); reset.type = 'button';
    reset.addEventListener('click', () => { s = box.init(); note.textContent = '回到一開始的樣子。'; draw(); });
    ops.append(reset);
    const side = h('div', 'cr-side'); side.append(ops, note);
    draw(); wrap.append(stage, side);
    return wrap;
  }
  // 實作：四種語言分頁，每種有「內建」「自己刻」兩份
  function codeNode(code) {
    const wrap = h('div', 'cr-code'); const tabs = h('div', 'cr-tabs'); const kinds = h('div', 'cr-kinds');
    const pre = h('pre', 'cr-pre'); const out = h('p', 'cr-out mono', `輸出：${code.output}`);
    let lang = 'python', kind = 'builtin';
    const show = () => {
      pre.textContent = code[lang][kind];
      for (const b of tabs.children) b.classList.toggle('on', b.dataset.v === lang);
      for (const b of kinds.children) b.classList.toggle('on', b.dataset.v === kind);
    };
    for (const [v, label] of root.Classroom.LANGS) { const b = h('button', 'cr-tab', label); b.type = 'button'; b.dataset.v = v; b.addEventListener('click', () => { lang = v; show(); }); tabs.append(b); }
    for (const [v, label] of [['builtin', '用內建的'], ['handmade', '自己刻（考試要手寫）']]) { const b = h('button', 'cr-tab', label); b.type = 'button'; b.dataset.v = v; b.addEventListener('click', () => { kind = v; show(); }); kinds.append(b); }
    show(); wrap.append(tabs, kinds, pre, out);
    return wrap;
  }

  // 「怎麼算」的一個例子：標題、程式片段、怎麼數出來的
  function howtoNode({ title, code, note }) {
    const wrap = h('div', 'cr-howto'); wrap.append(h('p', 'cr-sub', title), h('pre', 'cr-pre', code), h('p', '', note));
    return wrap;
  }
  // 總表：每一頁的時間複雜度照目錄順序排在一起，點頁名翻過去
  function overviewNode() {
    const table = h('table', 'cr-big-o cr-overview');
    for (const g of root.Classroom.complexityTable()) {
      const head = h('tr'); const th = h('th'); th.colSpan = 2;
      const link = h('button', 'cr-link', `${g.name}　${g.zh}`); link.type = 'button'; link.addEventListener('click', () => { select(g.id); window.scrollTo(0, 0); });
      th.append(link); head.append(th); table.append(head);
      for (const [op, o] of g.rows) { const tr = h('tr'); tr.append(h('td', '', op), h('td', 'mono', o)); table.append(tr); }
    }
    return table;
  }
  // 附錄的觀念頁（Big-O）：沒有遊戲那段、實作和自己的複雜度表，換成「怎麼算」和全部頁的總表
  function referenceSections(id, page) {
    return [
      section('生活比喻', h('p', 'cr-hook', page.analogy)),
      section('圖解', framesNode(id, page)),
      section('什麼時候會用到', ul(page.uses)),
      section('核心觀念', ...page.concept.map(t => h('p', '', t))),
      section('怎麼算', ...page.howto.map(howtoNode)),
      section('自己按按看', sandboxNode(page)),
      section('常見誤解', ul(page.traps)),
      section('總表', overviewNode()),
      section('總結', h('p', 'cr-hook', page.summary)),
    ];
  }

  function pageNode(id) {
    const item = root.Classroom.item(id); const page = root.Classroom.PAGES[id];
    const art = h('article', 'cr-page'); art.append(h('h3', 'cr-title', `${item.name}　${item.zh}`));
    if (!page) { art.append(h('p', 'cr-soon', '準備中。')); return art; }
    if (page.layout === 'reference') { art.append(...referenceSections(id, page)); return art; }
    const stamp = page.stamp && root.Verdict && root.Verdict.NAMES[page.stamp];
    const gameSec = page.game && section('你在遊戲裡為什麼是它', ...(stamp ? [h('p', 'stamp', stamp.name), h('p', 'cr-stamp-line', `「${stamp.line}」`)] : []), h('p', '', page.game));
    const table = h('table', 'cr-big-o'); for (const [op, o] of page.complexity) { const tr = h('tr'); tr.append(h('td', '', op), h('td', 'mono', o)); table.append(tr); }
    // 段落順序：一句話 Hook → 看圖 → 有什麼用 → 核心觀念 → 跟遊戲的關係 → 動手 → 常見誤解 → 程式 → 複雜度 → 總結（回扣開頭）
    art.append(
      section('生活比喻', h('p', 'cr-hook', page.analogy)),
      section('圖解', framesNode(id, page)),
      section('什麼時候會用到', ul(page.uses)),
      section('核心觀念', ...page.concept.map(t => h('p', '', t))),
      ...(gameSec ? [gameSec] : []),
      section('自己按按看', sandboxNode(page), ...(page.classic ? [page.classic.node(kit)] : [])),
      section('常見誤解', ul(page.traps)),
      section('實作', codeNode(page.code)),
      section('時間複雜度', table, h('p', 'cr-hint', 'O(1)、O(n) 是什麼意思、怎麼算，見附錄「時間複雜度」。')),
      section('總結', h('p', 'cr-hook', page.summary)),
    );
    return art;
  }

  // 換頁：mount 之後才有，總表的頁名也靠它翻頁
  let select = () => {};
  // 把小教室（左邊目錄、右邊講義）放進 container。id 是一開始翻到哪一頁（沒給或還沒寫就開第一頁寫好的）；
  // 每次換頁呼叫 onSelect(id)，CSIE 課程頁拿來改網址
  function mount(container, { id, onSelect } = {}) {
    const { TOC, PAGES } = root.Classroom;
    const main = h('div', 'cr-main'); const nav = h('nav', 'cr-nav'); const body = h('div', 'cr-body');
    select = (pid) => {
      body.replaceChildren(pageNode(pid));
      for (const b of nav.querySelectorAll('button')) b.classList.toggle('on', b.dataset.id === pid);
      if (onSelect) onSelect(pid);
    };
    for (const g of TOC) {
      nav.append(h('p', 'cr-group', g.group));
      for (const it of g.items) {
        const ready = Boolean(PAGES[it.id]);
        const b = h('button', `cr-item${ready ? '' : ' soon'}`); b.type = 'button'; b.dataset.id = it.id;
        b.append(h('span', 'mono', it.name), h('small', '', ready ? it.zh : `${it.zh}・準備中`));
        b.addEventListener('click', () => { select(it.id); window.scrollTo(0, 0); }); nav.append(b);
      }
    }
    main.append(nav, body); container.replaceChildren(main);
    select(PAGES[id] ? id : TOC.flatMap(g => g.items).find(i => PAGES[i.id]).id);
  }

  root.ClassroomView = { mount };
})(typeof window !== 'undefined' ? window : globalThis);
