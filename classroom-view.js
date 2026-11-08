// classroom-view.js — 小教室的畫面：左邊目錄、右邊講義，放在 CSIE 課程頁（csie.html）裡，一次顯示一門課。
// 目錄在 classroom.js、每頁的內容和圖在 classroom/<課程>/<id>.js；圖用 rough.js 畫成手繪風的 SVG（vendor/rough.js）
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
  // 一段文字；寫成 { text, see } 時後面多幾個翻到別頁的連結。see 是一個或一串頁 id；
  // 同一門課寫頁 id，別門課寫「課程/頁 id」（例：ds/stack），點了改網址、換那門課
  function prose(tag, t) {
    if (typeof t === 'string') return h(tag, '', t);
    const el = h(tag, '', `${t.text} `);
    for (const to of [].concat(t.see)) {
      const [c, id] = to.includes('/') ? to.split('/') : [course, to];
      const link = h('button', 'cr-link cr-see', `→ ${root.Classroom.item(c, id).zh}`); link.type = 'button';
      link.addEventListener('click', () => {
        if (c === course) { select(id); window.scrollTo(0, 0); } else location.hash = `#${c}/${id}`;
      });
      el.append(link);
    }
    return el;
  }
  const ul = (arr) => { const l = h('ul'); for (const t of arr) l.append(prose('li', t)); return l; };

  // 常見誤解：一條一張小卡，上面是誤解、下面是正解
  function trapsNode(traps) {
    const line = (kind, icon, label, text) => {
      const p = h('p', `cr-trap-line ${kind}`);
      p.append(root.Icons.el(icon, 'cr-trap-icon'), h('span', 'cr-sr', label), h('span', '', text));
      return p;
    };
    const list = h('div', 'cr-traps');
    for (const { wrong, right } of traps) {
      const item = h('div', 'cr-trap');
      item.append(line('wrong', 'circle-x', '誤解：', wrong), line('right', 'circle-check', '正解：', right));
      list.append(item);
    }
    return list;
  }

  // 分格靜態圖：照劇本的操作重播，每一步一格，格子下面寫操作
  function framesNode(id, page) {
    const row = h('div', 'cr-frames');
    for (const f of root.Classroom.replay(course, id, page.frames)) {
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
    for (const [v, label] of root.Classroom.LANGS[course]) { const b = h('button', 'cr-tab', label); b.type = 'button'; b.dataset.v = v; b.addEventListener('click', () => { lang = v; show(); }); tabs.append(b); }
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
    for (const g of root.Classroom.complexityTable(course)) {
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
      section('核心觀念', ...page.concept.map(t => prose('p', t))),
      section('怎麼算', ...page.howto.map(howtoNode)),
      section('自己按按看', sandboxNode(page)),
      section('常見誤解', trapsNode(page.traps)),
      section('總表', overviewNode()),
      section('總結', h('p', 'cr-hook', page.summary)),
    ];
  }

  // ── 程式設計課（layout: 'program'）：一段程式四種語言，頁上每一排語言鈕連動，換語言時追蹤器停在同一步 ──
  // 頁上目前的語言：on(fn) 登記換語言時要重畫的段落（登記時先畫一次），tabs() 是一排語言鈕
  function langSwitch() {
    const langs = root.Classroom.LANGS[course]; const subs = []; const rows = [];
    const ui = { lang: progLang || langs[0][0] };
    const mark = () => { for (const row of rows) for (const b of row.children) b.classList.toggle('on', b.dataset.v === ui.lang); };
    ui.set = (v) => { ui.lang = progLang = v; mark(); for (const fn of subs) fn(v); };
    ui.on = (fn) => { subs.push(fn); fn(ui.lang); };
    ui.tabs = () => {
      const row = h('div', 'cr-tabs');
      for (const [v, label] of langs) { const b = h('button', 'cr-tab', label); b.type = 'button'; b.dataset.v = v; b.addEventListener('click', () => ui.set(v)); row.append(b); }
      rows.push(row); mark(); return row;
    };
    return ui;
  }
  // 追蹤器那段程式（換好那組輸入）一行一個字串
  const traceSource = (trace, lang, label) => root.Classroom.fill(trace.code[lang], trace.inputs.find(x => x.label === label).values).replace(/\n$/, '').split('\n');
  const { INK, FILL, NEW } = kit;
  // 變數畫成一排手繪的盒子，名字在上、值在裡面；這一步改到的上黃色。
  // 自訂資料型態的值畫成一張卡片（型態名、一個欄位一行），一串卡片的陣列每格一張、名字寫 cls[0]
  function varsNode(vars, changed) {
    const { showValue, isRecord, fieldsOf } = root.Classroom;
    const names = Object.keys(vars);
    if (!names.length) return h('p', 'cr-tr-empty', '還沒有變數');
    const H = 40, top = 18, gap = 12, size = 18, row = 22, small = 14;
    const textWidth = (t, px) => t.length * px * 0.62;
    const cells = names.flatMap((k) => {
      const v = vars[k], on = changed.includes(k);
      const card = (name, rec) => {
        const lines = fieldsOf(rec).map(f => `${f}: ${showValue(rec[f])}`);
        return { name, on, title: rec.__type, lines, w: Math.max(80, 20 + Math.max(...lines.map(l => textWidth(l, small)), textWidth(rec.__type, 12))), hgt: 26 + row * lines.length };
      };
      if (isRecord(v)) return [card(k, v)];
      if (Array.isArray(v) && v.length && v.every(isRecord)) return v.map((rec, i) => card(`${k}[${i}]`, rec));
      const text = showValue(v);
      return [{ name: k, on, text, w: Math.max(60, 16 + textWidth(text, size)), hgt: H }];
    });
    const s = svgEl(cells.reduce((a, c) => a + c.w + gap, 8 - gap), top + Math.max(...cells.map(c => c.hgt)) + 6); const rc = root.rough.svg(s);
    let x = 4;
    cells.forEach((c, i) => {
      s.append(rc.rectangle(x, top, c.w, c.hgt, { stroke: INK, fill: c.on ? NEW : FILL, fillStyle: 'solid', roughness: 1.1, seed: 11 + i }));
      svgText(s, x + c.w / 2, 8, c.name, 13);
      if (c.lines) {
        svgText(s, x + c.w / 2, top + 13, c.title, 12);
        c.lines.forEach((l, j) => svgText(s, x + c.w / 2, top + 26 + row * j + row / 2, l, small));
      } else svgText(s, x + c.w / 2, top + H / 2, c.text, size);
      x += c.w + gap;
    });
    return s;
  }
  // 這一步每一層的變數：不在函式裡就只有一排；在函式裡的時候，正在跑的那一層在最上面，主程式在最下面（呼叫堆疊）
  function stackNode(run, i) {
    const { frameVars, depthOf, changedVars } = root.Classroom;
    const step = run[i], prev = run[i - 1];
    if (!step) return [h('p', 'cr-tr-label', '變數'), varsNode({}, [])];
    if (!step.stack) return [h('p', 'cr-tr-label', '變數'), varsNode(step.vars, changedVars(prev, step))];
    const top = depthOf(step);
    const nodes = [h('p', 'cr-tr-label', '呼叫堆疊（最上面是正在跑的那一層）')];
    for (let d = top; d >= 1; d -= 1) {
      const frame = step.stack[d - 1];
      const before = prev && !(step.call && d === top) ? frameVars(prev, d) : undefined;
      const changed = Object.keys(frame.vars).filter(k => !before || root.Classroom.showValue(before[k]) !== root.Classroom.showValue(frame.vars[k]));
      const box = h('div', `cr-tr-frame${d === top ? ' on' : ''}`);
      box.append(h('p', 'cr-tr-fn mono', frame.fn || '主程式'), varsNode(frame.vars, changed));
      nodes.push(box);
    }
    return nodes;
  }
  // 程式讀的輸入：讀掉的部分變淡，還沒讀的照常
  function stdinNode(stdin, read) {
    const pre = h('pre', 'cr-tr-stdin');
    pre.append(h('span', 'used', stdin.slice(0, read)), document.createTextNode(stdin.slice(read)));
    return pre;
  }
  // 程式追蹤器：挑一組輸入，按「下一步」一次跑一行；亮起來的是剛跑完的那一行，旁邊是跑完之後的變數和輸出
  function tracerNode(page, ui) {
    const t = page.trace; let label = t.inputs[0].label, i = -1;
    const wrap = h('div', 'cr-tracer');
    const inputs = h('div', 'cr-tr-inputs'); inputs.append(h('span', 'cr-tr-label', '輸入'));
    const code = h('pre', 'cr-pre cr-tr-code'); const note = h('p', 'cr-note');
    const vars = h('div', 'cr-tr-vars'); const out = h('pre', 'cr-tr-out');
    const ops = h('div', 'cr-ops');
    const btn = (text, cls, fn) => { const b = h('button', cls, text); b.type = 'button'; b.addEventListener('click', () => { fn(); draw(); }); ops.append(b); return b; };
    const next = btn('下一步', 'btn', () => { i += 1; });
    const back = btn('上一步', 'btn ghost', () => { i -= 1; });
    btn('重來', 'btn ghost', () => { i = -1; });
    const chips = t.inputs.map(({ label: l }) => {
      const b = h('button', 'cr-tab', l); b.type = 'button';
      b.addEventListener('click', () => { label = l; i = -1; draw(); }); inputs.append(b); return b;
    });
    function draw() {
      const run = t.runs[label], step = run[i], lang = ui.lang;
      const on = step ? root.Classroom.traceLine(t, lang, step.line) : 0;
      code.replaceChildren(...traceSource(t, lang, label).map((text, k) => {
        const ln = h('span', `cr-tr-ln${k + 1 === on ? ' on' : ''}`); ln.append(h('span', 'cr-tr-no', String(k + 1)), document.createTextNode(text || ' '));
        return ln;
      }));
      const stdin = t.inputs.find(x => x.label === label).stdin;
      vars.replaceChildren(...(stdin === undefined ? [] : [h('p', 'cr-tr-label', '輸入的資料（讀過的變淡）'), stdinNode(stdin, step ? step.read : 0)]), ...stackNode(run, i));
      out.textContent = step ? step.out : '';
      if (!step) note.textContent = '按「下一步」開始，一次跑一行。';
      else {
        const what = root.Classroom.stepNote(t, label, i, lang);
        const where = step.call ? `第 ${on} 行` : `剛跑完第 ${on} 行`;
        note.textContent = `第 ${i + 1} 步／共 ${run.length} 步：${where}${what ? `，${what}` : ''}${i === run.length - 1 ? '。程式跑完了。' : '。'}`;
      }
      next.disabled = i >= run.length - 1; back.disabled = i < 0;
      for (const c of chips) c.classList.toggle('on', c.textContent === label);
    }
    const state = h('div', 'cr-tr-state'); state.append(vars, h('p', 'cr-tr-label', '輸出'), out);
    const side = h('div', 'cr-tr-side'); side.append(note, state, ops);
    const body = h('div', 'cr-tr-body'); body.append(code, side);
    wrap.append(inputs, body);
    ui.on(draw);
    return wrap;
  }
  // 餵給程式的輸入（實作、試試看讀 stdin 的才有）
  const stdinBlock = (stdin) => (stdin === undefined ? [] : [h('p', 'cr-tr-label', '輸入'), h('pre', 'cr-tr-stdin', stdin.replace(/\n$/, ''))]);
  // 實作：每種語言一份完整程式
  function programCodeNode(code, ui) {
    const pre = h('pre', 'cr-pre');
    ui.on((lang) => { pre.textContent = code[lang]; });
    const wrap = h('div', 'cr-code'); wrap.append(pre, ...stdinBlock(code.stdin), h('p', 'cr-out mono', `輸出：${code.output}`));
    return wrap;
  }
  // 跑幾步：每一段跑幾次，Big-O 的定義連到資料結構的附錄
  function costNode(cost) {
    const table = h('table', 'cr-big-o'); for (const [what, n] of cost.rows) { const tr = h('tr'); tr.append(h('td', '', what), h('td', 'mono', n)); table.append(tr); }
    return [table, prose('p', cost.note)];
  }
  // 試試看：一題一張小卡，選了就標出答案、顯示解析
  function tryNode(q, n, ui) {
    const card = h('div', 'cr-try');
    const head = h('p', 'cr-try-q'); head.append(h('span', 'cr-try-kind', q.kind), h('span', '', `${n}. ${q.prompt}`));
    const pre = h('pre', 'cr-pre'); ui.on((lang) => { pre.textContent = q.code[lang]; });
    const opts = h('div', 'cr-try-opts'); const why = h('div', 'cr-try-why'); why.hidden = true;
    const letter = (k) => `(${'ABCD'[k]})`;
    q.options.forEach((text, k) => {
      const b = h('button', 'cr-try-opt'); b.type = 'button'; b.append(h('span', 'mono', letter(k)), h('span', '', text));
      b.addEventListener('click', () => {
        [...opts.children].forEach((o, j) => {
          o.disabled = true;
          if (j === q.answer) { o.classList.add('answer'); o.prepend(root.Icons.el('circle-check', 'cr-trap-icon')); }
          else if (j === k) { o.classList.add('picked'); o.prepend(root.Icons.el('circle-x', 'cr-trap-icon')); }
        });
        why.replaceChildren(h('p', 'cr-try-answer', `答案是 ${letter(q.answer)} ${q.options[q.answer]}。`), h('p', '', q.why)); why.hidden = false;
      });
      opts.append(b);
    });
    card.append(head, pre, ...stdinBlock(q.stdin), opts, why);
    return card;
  }
  // 段落順序：生活應用（Hook）→（複習：用學過的東西硬做到懷疑人生；第一課沒有）→ 概念示意圖 → 核心觀念 → 有什麼用 → 追蹤器 → 常見誤解 → 程式 →（跑幾步）→ 試試看 → 總結（回答 Hook）→（課外補充：考試範圍外、有就放）
  function programSections(page) {
    const ui = langSwitch();
    return [
      section('生活應用', h('p', 'cr-hook', page.analogy)),
      ...(page.review ? [section('複習', ...page.review.map(t => (t.quote ? h('blockquote', 'cr-quote', t.quote) : prose('p', t))))] : []),
      section('圖解', page.figure(kit)),
      section('核心觀念', ...page.concept.map(t => prose('p', t))),
      section('什麼時候會用到', ul(page.uses)),
      section('自己按按看', ui.tabs(), tracerNode(page, ui)),
      section('常見誤解', trapsNode(page.traps)),
      section('實作', ui.tabs(), programCodeNode(page.code, ui)),
      ...(page.cost ? [section('跑幾步', ...costNode(page.cost))] : []),
      section('試試看', h('p', 'cr-hint', '選一個，就會看到答案和解析。'), ui.tabs(), ...page.tryit.map((q, k) => tryNode(q, k + 1, ui))),
      section('總結', h('p', 'cr-hook', page.summary)),
      ...(page.extra ? [section('課外補充', ...page.extra.map(t => prose('p', t)))] : []),
    ];
  }

  function pageNode(id) {
    const item = root.Classroom.item(course, id); const page = root.Classroom.PAGES[course]?.[id];
    const art = h('article', 'cr-page'); art.append(h('h3', 'cr-title', `${item.name}　${item.zh}`));
    if (!page) { art.append(h('p', 'cr-soon', '準備中。')); return art; }
    if (page.layout === 'reference') { art.append(...referenceSections(id, page)); return art; }
    if (page.layout === 'program') { art.append(...programSections(page)); return art; }
    const stamp = page.stamp && root.Verdict && root.Verdict.NAMES[page.stamp];
    const gameSec = page.game && section('你在遊戲裡為什麼是它', ...(stamp ? [h('p', 'stamp', stamp.name), h('p', 'cr-stamp-line', `「${stamp.line}」`)] : []), h('p', '', page.game));
    const table = h('table', 'cr-big-o'); for (const [op, o] of page.complexity) { const tr = h('tr'); tr.append(h('td', '', op), h('td', 'mono', o)); table.append(tr); }
    // 段落順序：一句話 Hook → 看圖 → 有什麼用 → 核心觀念 → 跟遊戲的關係 → 動手 → 常見誤解 → 程式 → 複雜度 → 總結（回扣開頭）
    art.append(
      section('生活比喻', h('p', 'cr-hook', page.analogy)),
      section('圖解', framesNode(id, page)),
      section('什麼時候會用到', ul(page.uses)),
      section('核心觀念', ...page.concept.map(t => prose('p', t))),
      ...(gameSec ? [gameSec] : []),
      section('自己按按看', sandboxNode(page), ...(page.classic ? [page.classic.node(kit)] : [])),
      section('常見誤解', trapsNode(page.traps)),
      section('實作', codeNode(page.code)),
      section('時間複雜度', table, h('p', 'cr-hint', 'O(1)、O(n) 是什麼意思、怎麼算，見附錄「時間複雜度」。')),
      section('總結', h('p', 'cr-hook', page.summary)),
    );
    return art;
  }

  // 現在顯示的課程和換頁：mount 之後才有，總表的頁名、連結也靠它翻頁
  let course = 'ds';
  let select = () => {};
  // 程式設計課選的語言：換頁也留著（還沒選過就是那門課的第一種）
  let progLang = null;
  // 把一門課的小教室（左邊目錄、右邊講義）放進 container。id 是一開始翻到哪一頁（沒給或還沒寫就開第一頁寫好的）；
  // 每次換頁呼叫 onSelect(id)，CSIE 課程頁拿來改網址
  function mount(container, { course: c = 'ds', id, onSelect } = {}) {
    course = c;
    const TOC = root.Classroom.TOC[course]; const PAGES = root.Classroom.PAGES[course] || {};
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
