// se.js — 認識軟體工程頁（se.html）的畫面：內容在 se-content.js，圖用 rough.js 畫成手繪風的 SVG
(function (root) {
  const SE = root.SE_CONTENT;
  const SVG = 'http://www.w3.org/2000/svg';
  const INK = '#1f2328', FILL = '#9cc3f5', NEW = '#ffd166', PLAIN = '#fffdf8';
  const CHAPTERS = [['sdlc', 'SDLC'], ['walk', '一起走一次'], ['models', '開發模型'], ['ai', 'AI 開發'], ['chat', '最後聊一題']];
  const NARROW = root.matchMedia('(max-width: 699px)');

  const h = (tag, cls, text) => { const el = document.createElement(tag); if (cls) el.className = cls; if (text !== undefined) el.textContent = text; return el; };
  const svgEl = (w, hgt, label) => {
    const s = document.createElementNS(SVG, 'svg'); s.setAttribute('viewBox', `0 0 ${w} ${hgt}`); s.setAttribute('width', w); s.setAttribute('height', hgt);
    s.setAttribute('role', 'img'); if (label) s.setAttribute('aria-label', label);
    return s;
  };
  const svgText = (s, x, y, text, size = 13, anchor = 'middle') => {
    const t = document.createElementNS(SVG, 'text'); t.setAttribute('x', x); t.setAttribute('y', y); t.setAttribute('text-anchor', anchor);
    t.setAttribute('dominant-baseline', 'central'); t.setAttribute('font-size', size); t.setAttribute('class', 'cr-num'); t.textContent = text; s.append(t); return t;
  };
  const box = (rc, s, x, y, w, hgt, seed, fill = PLAIN) => s.append(rc.rectangle(x, y, w, hgt, { stroke: INK, strokeWidth: 1.4, fill, fillStyle: 'solid', roughness: 1, seed }));
  // 箭頭：一條線加兩撇箭頭，from、to 是 [x, y]
  function arrow(rc, s, from, to, seed, opts = {}) {
    const style = { stroke: INK, strokeWidth: 1.4, roughness: 0.8, seed, ...opts };
    s.append(rc.line(...from, ...to, style));
    const angle = Math.atan2(to[1] - from[1], to[0] - from[0]);
    for (const turn of [0.5, -0.5]) s.append(rc.line(...to, to[0] - 9 * Math.cos(angle + turn), to[1] - 9 * Math.sin(angle + turn), { ...style, strokeLineDash: undefined, seed: seed + 1 }));
  }

  // ── 內文 ──
  const INLINE = /(\*\*.+?\*\*|\[[^\]]+\]\([^)]+\)|`[^`]+`)/;
  function inline(text) {
    const frag = document.createDocumentFragment();
    for (const part of text.split(INLINE)) {
      const link = /^\[([^\]]+)\]\(([^)]+)\)$/.exec(part);
      if (link && link[2].startsWith('#t')) frag.append(templateLink(link[1], link[2].slice(1)));
      else if (link && link[2].startsWith('#s')) frag.append(stationLink(link[1], Number(link[2].slice(2))));
      else if (link) { const a = h('a', '', link[1]); a.href = link[2]; a.target = '_blank'; a.rel = 'noopener'; frag.append(a); }
      else if (part.startsWith('**')) frag.append(h('strong', '', part.slice(2, -2)));
      else if (part.startsWith('`')) frag.append(h('code', '', part.slice(1, -1)));
      else if (part) frag.append(part);
    }
    return frag;
  }
  const withInline = (tag, cls, text) => { const el = h(tag, cls); el.append(inline(text)); return el; };

  // 常見誤解：跟小教室同一種排版，誤解一行、正解一行
  function trapNode(wrong, right) {
    const line = (kind, icon, label, text) => {
      const p = h('p', `cr-trap-line ${kind}`);
      const span = h('span'); span.append(inline(text));
      p.append(root.Icons.el(icon, 'cr-trap-icon'), h('span', 'cr-sr', label), span);
      return p;
    };
    const item = h('div', 'cr-trap');
    item.append(line('wrong', 'circle-x', '誤解：', wrong), line('right', 'circle-check', '正解：', right));
    return item;
  }
  function tableNode({ head, rows }) {
    const wrap = h('div', 'se-table'); const table = h('table'); const thead = h('tr');
    for (const cell of head) thead.append(withInline('th', '', cell));
    table.append(thead);
    for (const row of rows) { const tr = h('tr'); for (const cell of row) tr.append(withInline('td', '', cell)); table.append(tr); }
    wrap.append(table);
    return wrap;
  }
  function fieldNode(block) {
    const wrap = h('div', `se-field${block.label === '新人訓練裡' ? ' se-game' : ''}`);
    wrap.append(h('h4', 'se-label', block.label));
    if (block.text) wrap.append(withInline('p', '', block.text));
    if (block.quote) { const q = h('blockquote', 'se-manifesto'); for (const line of block.quote) q.append(h('p', '', line)); wrap.append(q); }
    if (block.wrong) wrap.append(trapNode(block.wrong, block.right));
    return wrap;
  }
  function blockNode(block) {
    switch (block.t) {
      case 'h': return h('h3', 'se-sub', block.text);
      case 'p': return withInline('p', '', block.text);
      case 'quote': return withInline('p', 'se-note', block.text);
      case 'code': return h('pre', 'cr-pre', block.text);
      case 'table': return tableNode(block);
      case 'field': return fieldNode(block);
      case 'list': { const ul = h('ul'); for (const item of block.items) ul.append(withInline('li', '', item)); return ul; }
      default: return h('p', '', block.text);
    }
  }
  const blocksNode = (blocks) => blocks.map(blockNode);

  // ── 小範本：浮動視窗 ──
  const dialog = h('dialog', 'se-dialog');
  const sheet = h('div', 'se-sheet');
  dialog.append(sheet);
  dialog.addEventListener('click', (e) => { if (e.target === dialog) dialog.close(); });
  function openTemplate(id) {
    const tpl = SE.templates[id];
    const head = h('header', 'se-sheet-head'); const shut = h('button', 'btn small', '關閉'); shut.type = 'button';
    shut.addEventListener('click', () => dialog.close());
    head.append(h('h3', '', tpl.title), shut);
    const body = h('div', 'se-sheet-body');
    body.append(...(DRAWINGS[id] ? [DRAWINGS[id]()] : blocksNode(tpl.blocks)));
    sheet.replaceChildren(head, body);
    dialog.showModal(); body.scrollTop = 0;
  }
  function templateLink(label, id) {
    const b = h('button', 'se-tpl', label); b.type = 'button';
    b.addEventListener('click', () => openTemplate(id));
    return b;
  }
  // 開場的問題：點了跳到答案在的那一站
  let openStation = () => {};
  function stationLink(label, no) {
    const b = h('button', 'se-hook', label); b.type = 'button';
    b.addEventListener('click', () => openStation(no));
    return b;
  }

  // ── 手繪圖 ──
  // 開場：店員猛按 POS 機，確認視窗一層又一層
  function drawBusyClerk() {
    const s = svgEl(520, 300, '手繪插圖：手搖飲店員滿頭大汗猛按 POS 機，螢幕跳出一層又一層的確認視窗，收據長長垂到地上，牆上貼著第二杯半價的海報'); const rc = root.rough.svg(s);
    const SKIN = '#ffe3c8', TEA = '#e3bd8e', SCREEN = '#e8f1fb', BEZEL = '#3a4150', STAND = '#c9ced6', CAP = '#8fd1b0';
    const solid = (fill, seed) => ({ stroke: INK, strokeWidth: 1.4, roughness: 1, fill, fillStyle: 'solid', seed });
    const faded = (node, opacity) => { node.setAttribute('opacity', opacity); s.append(node); };
    const scribble = (x1, x2, y, seed) => s.append(rc.line(x1, y, x2, y, { stroke: INK, strokeWidth: 1, roughness: 1.2, seed }));
    const sweat = (x, y, seed) => s.append(rc.path(`M${x} ${y} q7 10 0 15 q-7 -5 0 -15 z`, { stroke: INK, strokeWidth: 1, roughness: 0.4, fill: FILL, fillStyle: 'solid', seed }));
    function cup(x, base, seed) {
      s.append(rc.line(x + 3, base - 46, x + 8, base - 70, { stroke: INK, strokeWidth: 2.4, roughness: 0.6, seed }));
      s.append(rc.polygon([[x - 15, base - 48], [x + 15, base - 48], [x + 11, base], [x - 11, base]], solid(PLAIN, seed + 1)));
      s.append(rc.polygon([[x - 14, base - 36], [x + 14, base - 36], [x + 11, base - 1], [x - 11, base - 1]], solid(TEA, seed + 2)));
      s.append(rc.line(x - 17, base - 48, x + 17, base - 48, { stroke: INK, strokeWidth: 2.2, roughness: 0.6, seed: seed + 3 }));
      [[-6, 7], [1, 6], [7, 8], [-2, 13], [5, 14]].forEach(([dx, dy], i) => s.append(rc.circle(x + dx, base - dy, 6, solid(INK, seed + 4 + i))));
    }

    box(rc, s, 16, 18, 112, 92, 301); svgText(s, 72, 38, '菜單', 16);
    [58, 72, 86, 98].forEach((y, i) => scribble(32, 112 - i * 6, y, 303 + i));
    box(rc, s, 346, 12, 158, 46, 308, NEW); svgText(s, 425, 35, '第二杯半價', 21);

    s.append(rc.polygon([[168, 150], [242, 150], [256, 222], [154, 222]], solid(FILL, 311)));
    s.append(rc.polygon([[184, 164], [226, 164], [236, 222], [174, 222]], solid(PLAIN, 312)));
    s.append(rc.circle(205, 112, 70, solid(SKIN, 313)));
    s.append(rc.path('M172 106 C172 62 238 62 238 106 Z', solid(CAP, 314)));
    s.append(rc.ellipse(205, 106, 84, 11, solid(CAP, 315)));
    s.append(rc.circle(205, 88, 15, solid(PLAIN, 325)));
    s.append(rc.line(185, 122, 198, 116, { stroke: INK, strokeWidth: 2.4, roughness: 0.5, seed: 316 }));
    s.append(rc.line(225, 122, 212, 116, { stroke: INK, strokeWidth: 2.4, roughness: 0.5, seed: 317 }));
    s.append(rc.circle(192, 127, 5, solid(INK, 318))); s.append(rc.circle(218, 127, 5, solid(INK, 319)));
    s.append(rc.rectangle(193, 134, 24, 10, solid(PLAIN, 320)));
    [199, 205, 211].forEach((x, i) => s.append(rc.line(x, 134, x, 144, { stroke: INK, strokeWidth: 1, roughness: 0.3, seed: 326 + i })));
    sweat(150, 92, 321); sweat(248, 76, 322); sweat(258, 112, 323); sweat(140, 124, 324);

    s.append(rc.rectangle(8, 224, 504, 62, solid(FILL, 331)));
    s.append(rc.rectangle(4, 216, 512, 10, solid(PLAIN, 332)));
    cup(32, 216, 340); cup(72, 216, 350);

    s.append(rc.polygon([[362, 206], [414, 206], [426, 218], [350, 218]], solid(STAND, 361)));
    s.append(rc.rectangle(290, 70, 196, 136, solid(BEZEL, 362)));
    s.append(rc.rectangle(298, 78, 180, 120, solid(SCREEN, 363)));
    box(rc, s, 304, 84, 130, 76, 364); box(rc, s, 315, 92, 136, 84, 365); box(rc, s, 326, 100, 146, 92, 366);
    svgText(s, 399, 116, '第 5／7 步', 13);
    svgText(s, 399, 138, '真的要打折嗎？', 15);
    box(rc, s, 354, 157, 54, 26, 367, NEW); svgText(s, 385, 170, '確定', 14);
    box(rc, s, 414, 157, 50, 26, 368); svgText(s, 439, 170, '取消', 14);
    s.append(rc.polygon([[438, 204], [458, 204], [463, 246], [451, 268], [472, 298], [444, 298], [431, 268], [443, 246]], solid(PLAIN, 371)));
    [[446, 456, 216], [447, 457, 230], [443, 453, 256], [442, 450, 272], [450, 462, 288]].forEach(([x1, x2, y], i) => scribble(x1, x2, y, 372 + i));

    s.append(rc.polygon([[170, 156], [184, 184], [130, 198], [122, 180]], solid(FILL, 381)));
    cup(112, 196, 382);
    s.append(rc.circle(122, 188, 22, solid(SKIN, 392)));
    s.append(rc.polygon([[238, 156], [336, 170], [336, 186], [242, 188]], solid(FILL, 393)));
    faded(rc.circle(336, 152, 24, solid(SKIN, 394)), 0.55);
    faded(rc.circle(332, 196, 24, solid(SKIN, 395)), 0.7);
    s.append(rc.circle(346, 178, 24, solid(SKIN, 396)));
    s.append(rc.line(318, 140, 310, 130, { stroke: INK, strokeWidth: 1.6, roughness: 0.6, seed: 397 }));

    s.append(rc.ellipse(238, 30, 196, 50, solid(PLAIN, 401)));
    s.append(rc.polygon([[212, 50], [234, 52], [216, 72]], solid(PLAIN, 402)));
    s.append(rc.line(215, 50, 232, 51, { stroke: PLAIN, strokeWidth: 4, roughness: 0, seed: 403 }));
    svgText(s, 238, 30, '這個折扣要按七步……', 14);
    svgText(s, 300, 256, '噠噠噠噠！', 26).setAttribute('transform', 'rotate(-3 300 256)');
    return s;
  }
  // 第 6 站：系統架構
  function drawArchitecture() {
    const s = svgEl(330, 200, '系統架構圖：客人手機、店員平板、總部後台連到後端服務，後端連到資料庫、訂單佇列和金流業者，訂單佇列再送到店員平板'); const rc = root.rough.svg(s);
    const left = [['客人手機', 10], ['店員平板', 76], ['總部後台', 142]]; const right = [['資料庫', 10], ['訂單佇列', 76], ['金流業者', 142]];
    left.forEach(([name, y], i) => { box(rc, s, 6, y, 84, 42, 11 + i); svgText(s, 48, y + 21, name); arrow(rc, s, [90, y + 21], [122, 97], 21 + i * 2); });
    box(rc, s, 122, 76, 84, 42, 15, FILL); svgText(s, 164, 97, '後端服務');
    right.forEach(([name, y], i) => { box(rc, s, 240, y, 84, 42, 31 + i, name === '訂單佇列' ? NEW : PLAIN); svgText(s, 282, y + 21, name); arrow(rc, s, [206, 97], [240, y + 21], 41 + i * 2); });
    s.append(rc.curve([[262, 118], [200, 136], [120, 134], [90, 106]], { stroke: INK, strokeWidth: 1.4, strokeLineDash: [6, 5], roughness: 0.6, seed: 51 }));
    arrow(rc, s, [104, 122], [90, 106], 53, { strokeLineDash: [6, 5] });
    svgText(s, 176, 150, '訂單排隊，先來先做', 11);
    return s;
  }
  // 第 7 站：客人手機的線框圖
  function drawWireframe() {
    const s = svgEl(240, 340, '手機線框圖：標題列、兩項飲料、甜度與冰塊選項、加入購物車按鈕'); const rc = root.rough.svg(s);
    box(rc, s, 20, 8, 200, 324, 3);
    svgText(s, 34, 34, '下課鐘 港邊店', 14, 'start'); svgText(s, 208, 34, 'EN ▾', 12, 'end');
    s.append(rc.line(20, 54, 220, 54, { stroke: INK, roughness: 0.8, seed: 4 }));
    [['招牌奶茶', '$55', 66], ['海鹽烏龍', '$65', 120]].forEach(([name, price, y], i) => {
      box(rc, s, 32, y, 40, 40, 5 + i, FILL); svgText(s, 82, y + 20, name, 13, 'start'); svgText(s, 208, y + 20, price, 13, 'end');
    });
    box(rc, s, 80, 150, 56, 18, 8, NEW); svgText(s, 108, 159, '在地限定', 10);
    s.append(rc.line(20, 180, 220, 180, { stroke: INK, roughness: 0.8, seed: 9 }));
    [['甜度', ['全糖', '半糖', '無糖'], 192], ['冰塊', ['正常', '少冰', '去冰'], 228]].forEach(([name, options, y], row) => {
      svgText(s, 32, y + 12, name, 12, 'start');
      options.forEach((o, i) => { box(rc, s, 66 + i * 50, y, 44, 24, 12 + row * 3 + i); svgText(s, 88 + i * 50, y + 12, o, 11); });
    });
    box(rc, s, 42, 276, 156, 38, 21, FILL); svgText(s, 120, 295, '加入購物車', 14);
    return s;
  }
  const DRAWINGS = { 't6-1': drawArchitecture, 't7-1': drawWireframe };

  // 三種開發模型的小圖
  function drawWaterfall() {
    const s = svgEl(320, 132, '瀑布模型：六個階段像階梯一樣一路往下'); const rc = root.rough.svg(s);
    for (let i = 0; i < 6; i++) box(rc, s, 8 + i * 48, 8 + i * 20, 58, 18, 3 + i, i === 5 ? NEW : FILL);
    return s;
  }
  function drawIterative() {
    const s = svgEl(320, 132, '迭代式開發：同一個圈繞三次，每圈多一塊成品'); const rc = root.rough.svg(s);
    [55, 160, 265].forEach((x, i) => {
      s.append(rc.circle(x, 56, 88, { stroke: INK, strokeWidth: 1.4, roughness: 1, seed: 3 + i }));
      for (let n = 0; n <= i; n++) box(rc, s, x - 16, 70 - n * 15, 32, 13, 7 + n + i * 3, n === i ? NEW : FILL);
      svgText(s, x, 118, `第 ${i + 1} 輪`, 12);
      if (i < 2) arrow(rc, s, [x + 46, 56], [x + 59, 56], 21 + i * 2);
    });
    return s;
  }
  function drawAgile() {
    const s = svgEl(320, 132, '敏捷式開發：很多個小圈，每一圈都有客人在旁邊'); const rc = root.rough.svg(s);
    for (let i = 0; i < 6; i++) {
      const x = 30 + i * 52;
      s.append(rc.circle(x, 40, 40, { stroke: INK, strokeWidth: 1.4, fill: i === 5 ? NEW : FILL, fillStyle: 'hachure', hachureGap: 5, roughness: 1, seed: 3 + i }));
      s.append(rc.circle(x, 84, 13, { stroke: INK, strokeWidth: 1.2, roughness: 0.6, seed: 11 + i }));
      s.append(rc.line(x, 91, x, 112, { stroke: INK, strokeWidth: 1.2, roughness: 0.6, seed: 21 + i }));
      s.append(rc.line(x - 8, 98, x + 8, 98, { stroke: INK, strokeWidth: 1.2, roughness: 0.6, seed: 31 + i }));
      if (i < 5) arrow(rc, s, [x + 21, 40], [x + 31, 40], 41 + i * 2);
    }
    svgText(s, 160, 124, '每一圈都有客人', 11);
    return s;
  }
  const MODEL_DRAWINGS = [drawWaterfall, drawIterative, drawAgile];
  // AI 開發的三種用法：人和 AI 的位置一路換過來
  function drawRoles() {
    const s = svgEl(320, 112, '三種用法：人寫 AI 看、AI 寫人看、AI 寫沒人看'); const rc = root.rough.svg(s);
    [['人寫', 'AI 看'], ['AI 寫', '人看'], ['AI 寫', '沒人看']].forEach(([top, bottom], i) => {
      const x = 6 + i * 106;
      box(rc, s, x, 8, 96, 44, 3 + i * 2, i === 0 ? FILL : NEW); svgText(s, x + 48, 30, top, 14);
      box(rc, s, x, 58, 96, 44, 4 + i * 2, i === 0 ? NEW : i === 1 ? FILL : PLAIN); svgText(s, x + 48, 80, bottom, 14);
    });
    return s;
  }

  // ── 12 站流程圖：蛇形排列，點一站看下面的說明 ──
  function flowLayout() {
    const narrow = NARROW.matches;
    const cols = narrow ? 3 : 6; const w = narrow ? 96 : 118; const hgt = 56; const gapX = narrow ? 18 : 24; const gapY = 46; const gutter = narrow ? 26 : 34;
    const place = (i) => {
      const row = Math.floor(i / cols); const col = row % 2 ? cols - 1 - (i % cols) : i % cols;
      return { x: gutter + col * (w + gapX), y: 8 + row * (hgt + gapY), row };
    };
    const rows = Math.ceil(12 / cols);
    return { w, hgt, place, gutter, gapY, width: gutter + cols * w + (cols - 1) * gapX + 8, height: 8 + rows * hgt + (rows - 1) * gapY + 40 };
  }
  function flowchart(selected, onPick) {
    const { w, hgt, place, gutter, gapY, width, height } = flowLayout();
    const s = svgEl(width, height, '軟體開發的 12 站流程圖'); s.removeAttribute('role');
    const rc = root.rough.svg(s);
    SE.walk.stations.forEach((station, i) => {
      if (i === 11) return;
      const a = place(i); const b = place(i + 1);
      const from = a.row === b.row ? [b.x > a.x ? a.x + w : a.x, a.y + hgt / 2] : [a.x + w / 2, a.y + hgt];
      const to = a.row === b.row ? [b.x > a.x ? b.x : b.x + w, b.y + hgt / 2] : [b.x + w / 2, b.y];
      arrow(rc, s, from, to, 100 + i * 2);
    });
    // 兩條回頭的路：測試沒過回開發、有變更回需求
    const dev = place(7); const qa = place(8);
    const drop = qa.y + hgt + 22;
    s.append(rc.curve([[qa.x + w / 2 - 18, qa.y + hgt], [(qa.x + dev.x + w) / 2, drop], [dev.x + w / 2 + 18, dev.y + hgt]], { stroke: INK, strokeWidth: 1.4, strokeLineDash: [6, 5], roughness: 0.6, seed: 71 }));
    arrow(rc, s, [dev.x + w / 2 + 30, dev.y + hgt + 13], [dev.x + w / 2 + 18, dev.y + hgt], 75, { strokeLineDash: [6, 5] });
    svgText(s, (qa.x + dev.x + w) / 2, drop + 8, '測試沒過', 12);
    const start = place(0); const end = place(11); const lane = gutter - 14;
    s.append(rc.linearPath([[end.x, end.y + hgt / 2], [lane, end.y + hgt / 2], [lane, start.y + hgt / 2]], { stroke: INK, strokeWidth: 1.4, strokeLineDash: [6, 5], roughness: 0.6, seed: 72 }));
    arrow(rc, s, [lane, start.y + hgt / 2], [start.x, start.y + hgt / 2], 73, { strokeLineDash: [6, 5] });
    const mid = (start.y + end.y + hgt) / 2;
    [...'有變更'].forEach((char, i) => svgText(s, lane - 7, mid + (i - 1) * 13, char, 12));

    SE.walk.stations.forEach((station, i) => {
      const { x, y } = place(i);
      const g = document.createElementNS(SVG, 'g');
      g.setAttribute('class', 'se-stop'); g.setAttribute('role', 'button'); g.setAttribute('tabindex', '0'); g.dataset.no = station.no;
      g.setAttribute('aria-label', `第 ${station.no} 站：${station.short}`); g.setAttribute('aria-pressed', station.no === selected);
      g.append(rc.rectangle(x, y, w, hgt, { stroke: INK, strokeWidth: station.no === selected ? 2.2 : 1.4, fill: station.no === selected ? NEW : PLAIN, fillStyle: 'solid', roughness: 1, seed: 200 + i }));
      svgText(g, x + w / 2, y + 17, `第 ${station.no} 站`, 11); svgText(g, x + w / 2, y + 37, station.short, 14);
      g.addEventListener('click', () => onPick(station.no));
      g.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onPick(station.no); } });
      s.append(g);
    });
    return s;
  }
  function walkNode() {
    const wrap = h('div', 'se-walk');
    const flow = h('div', 'se-flow'); const panel = h('article', 'se-station');
    let selected = 1;
    const show = (no, { scroll = false } = {}) => {
      selected = no;
      const station = SE.walk.stations[no - 1];
      flow.replaceChildren(flowchart(no, (n) => show(n)));
      const nav = h('div', 'se-station-nav');
      const go = (text, target, cls) => {
        const b = h('button', `btn ${cls}`, text); b.type = 'button'; b.disabled = !SE.walk.stations[target - 1];
        b.addEventListener('click', () => show(target, { scroll: true }));
        return b;
      };
      nav.append(go('上一站', no - 1, ''), go('下一站', no + 1, 'primary'));
      panel.replaceChildren(h('h3', 'se-station-title', `第 ${no} 站：${station.title}`), ...blocksNode(station.blocks));
      if (no === 12) panel.append(withInline('p', 'se-closing', SE.walk.closing.text));
      panel.append(nav);
      if (scroll) panel.scrollIntoView({ block: 'start' });
    };
    NARROW.addEventListener('change', () => show(selected));
    openStation = (no) => { show(no); flow.scrollIntoView({ block: 'start' }); };
    show(1);
    wrap.append(flow, panel);
    return wrap;
  }

  function section(id, title, ...children) {
    const sec = h('section', 'se-sec'); sec.id = id;
    sec.append(h('h2', '', title), ...children);
    return sec;
  }
  function modelsNode() {
    return SE.models.items.map((model, i) => {
      const card = h('article', 'se-model');
      card.append(h('h3', 'se-sub', model.title), MODEL_DRAWINGS[i](), ...blocksNode(model.blocks));
      return card;
    });
  }
  // AI 這章：時效提醒旁標最後更新日期，「幾種用法」放一張小圖
  function aiNode() {
    const nodes = [];
    for (const block of SE.ai.blocks) {
      nodes.push(blockNode(block));
      if (block.t === 'quote') nodes.push(h('p', 'se-updated', `最後更新：${SE.updated}`));
      if (block.t === 'h' && block.text === '幾種用法') nodes.push(drawRoles());
    }
    return nodes;
  }
  function questionNode() {
    const wrap = h('div', 'se-question'); const choices = h('div', 'se-choices'); const answer = h('div', 'se-answer'); answer.setAttribute('aria-live', 'polite');
    SE.question.options.forEach((option) => {
      const b = h('button', 'se-choice', option.label); b.type = 'button';
      b.addEventListener('click', () => {
        for (const other of choices.children) other.classList.toggle('on', other === b);
        answer.replaceChildren(...blocksNode(option.blocks));
      });
      choices.append(b);
    });
    wrap.append(choices, answer);
    return wrap;
  }
  function sourcesNode() {
    const box = h('details', 'se-sources');
    box.append(h('summary', '', '查證來源'), ...blocksNode(SE.sources));
    return box;
  }

  function boot() {
    const main = document.getElementById('se');
    const nav = h('nav', 'se-nav'); nav.setAttribute('aria-label', '章節');
    for (const [id, name] of CHAPTERS) { const a = h('a', '', name); a.href = `#${id}`; nav.append(a); }
    const [title, ...lead] = SE.hero;
    const hero = h('header', 'se-hero');
    hero.append(h('h2', '', title.text), drawBusyClerk(), ...blocksNode(lead));
    const outro = h('div', 'se-outro');
    outro.append(...blocksNode(SE.summary));
    main.append(hero, nav,
      section('sdlc', SE.sdlc.title, ...blocksNode(SE.sdlc.blocks)),
      section('walk', SE.walk.title, ...blocksNode(SE.walk.lead), ...blocksNode(SE.walk.setting), walkNode()),
      section('models', SE.models.title, ...blocksNode(SE.models.lead), ...modelsNode()),
      section('ai', SE.ai.title, ...aiNode()),
      section('chat', SE.question.title, ...blocksNode(SE.question.lead), questionNode()),
      outro, sourcesNode(), dialog);
  }
  boot();
})(window);
