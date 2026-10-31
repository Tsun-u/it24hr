// handbook.js — 新人手冊的畫面：畫面上的術語畫虛線底線、點了浮出小卡，以及整本手冊的列表。詞條和切法在 glossary.js。
(function (root) {
  const h = (tag, cls, text) => { const el = document.createElement(tag); if (cls) el.className = cls; if (text !== undefined) el.textContent = text; return el; };
  // 不標的地方：能點的東西（按鈕、連結、輸入框、選項的 label——點字要能勾選）、程式碼、視窗標題列、小卡和手冊自己
  const SKIP = 'button, a, input, textarea, select, label, code, .fn-code, .fn-head, .terminal-text, .win-bar, .term-pop, [data-no-terms]';
  // 「同一段只標第一次」的段落
  const BLOCK = 'p, pre, li, dd, dt, legend, h2, h3, h4, td, figcaption';

  let onCard = null;   // 小卡打開／收起時呼叫，參數是 true／false（辦公桌拿來暫停時鐘）
  let onMore = null;   // 小卡的「多知道一點」：打開手冊、跳到那一條
  let pop = null, current = null;

  function configure(opts) { close(); onCard = opts.onCard || null; onMore = opts.onMore || null; }

  function blockOf(text, rootEl) { const el = text.parentElement.closest(BLOCK); return el && rootEl.contains(el) ? el : rootEl; }
  function termButton({ text, term }) { const b = h('button', 'term', text); b.type = 'button'; b.dataset.term = term; return b; }

  // 把 rootEl 底下文字裡的術語換成小按鈕；已經標過的段落再跑一次不會重複標
  function mark(rootEl) {
    if (!rootEl || rootEl.nodeType !== 1 || rootEl.closest(SKIP)) return;
    const walker = document.createTreeWalker(rootEl, NodeFilter.SHOW_TEXT, {
      acceptNode: (n) => n.nodeValue.trim() && !n.parentElement.closest(SKIP) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT,
    });
    const texts = []; while (walker.nextNode()) texts.push(walker.currentNode);
    const seen = new Map();   // 段落 → 這一段標過的詞
    for (const text of texts) {
      const block = blockOf(text, rootEl);
      if (!seen.has(block)) seen.set(block, new Set([...block.querySelectorAll('.term')].map(b => b.dataset.term)));
      const parts = Glossary.segments(text.nodeValue, seen.get(block));
      if (!parts.some(p => p.term)) continue;
      const frag = document.createDocumentFragment();
      for (const p of parts) frag.append(p.term ? termButton(p) : document.createTextNode(p.text));
      text.replaceWith(frag);
    }
  }

  // 自動標：el 底下新長出來的字都標（視窗層用這個，新的視窗不用另外接）
  function watch(el) {
    const observer = new MutationObserver((records) => {
      for (const r of records) for (const n of r.addedNodes) mark(n.nodeType === 1 ? n : n.parentElement);
      observer.takeRecords();   // 丟掉標記自己造成的變動
    });
    observer.observe(el, { childList: true, subtree: true });
    return observer;
  }

  // ── 小卡 ──
  function show(btn) {
    const t = Glossary.get(btn.dataset.term); if (!t) return;
    close();
    pop = h('div', 'term-pop'); pop.setAttribute('role', 'dialog'); pop.setAttribute('aria-label', t.word);
    pop.append(h('p', 'term-pop-title', Glossary.title(t)), h('p', 'term-pop-text', t.short));
    if (onMore) {
      const more = h('button', 'term-pop-more', '多知道一點 ›'); more.type = 'button';
      more.addEventListener('click', () => { const go = onMore; close(); go(t.id); });
      pop.append(more);
    }
    document.body.append(pop);
    place(pop, btn.getBoundingClientRect());
    current = btn; btn.classList.add('open');
    if (onCard) onCard(true);
  }
  // 貼在術語下面，下面放不下就放上面，左右不超出視窗
  function place(el, r) {
    const gap = 6, edge = 8;
    const left = Math.min(Math.max(edge, r.left), innerWidth - el.offsetWidth - edge);
    let top = r.bottom + gap;
    if (top + el.offsetHeight > innerHeight - edge) top = Math.max(edge, r.top - gap - el.offsetHeight);
    el.style.left = `${left}px`; el.style.top = `${top}px`;
  }
  function close() {
    if (!pop) return;
    pop.remove(); pop = null;
    if (current) current.classList.remove('open'); current = null;
    if (onCard) onCard(false);
  }

  // ── 整本手冊 ──
  // 「多知道一點」裡的網址變成連結（Claire 那條放了產品名稱的靈感來源）
  function moreNode(text) {
    const p = h('p', '');
    for (const part of String(text).split(/(https?:\/\/\S+)/)) {
      if (/^https?:\/\//.test(part)) { const a = document.createElement('a'); a.href = part; a.target = '_blank'; a.rel = 'noopener'; a.textContent = part; p.append(a); }
      else if (part) p.append(document.createTextNode(part));
    }
    return p;
  }
  function bookNode() {
    const wrap = h('div', 'handbook'); wrap.dataset.noTerms = '';
    wrap.append(h('p', 'hb-intro', '新進同仁請先讀完本手冊。畫面上有虛線的詞，點一下也查得到。'));
    const nav = h('nav', 'hb-nav');
    wrap.append(nav);
    for (const group of Glossary.GROUPS) {
      const section = h('section', 'hb-group'); section.append(h('h3', '', group));
      const jump = h('button', 'hb-jump', group); jump.type = 'button';
      jump.addEventListener('click', () => section.scrollIntoView({ block: 'start', behavior: 'smooth' }));
      nav.append(jump);
      const list = h('dl', 'hb-list');
      for (const t of Glossary.TERMS.filter(x => x.group === group)) {
        const item = h('div', 'hb-item'); item.dataset.term = t.id;
        const more = h('details', 'hb-more'); more.append(h('summary', '', '多知道一點'), moreNode(t.more));
        const dd = h('dd', '', t.short); dd.append(more);
        item.append(h('dt', '', Glossary.title(t)), dd);
        list.append(item);
      }
      section.append(list); wrap.append(section);
    }
    return wrap;
  }
  // 跳到某一條：展開它的「多知道一點」、捲到眼前、亮一下
  function focusIn(container, id) {
    for (const old of container.querySelectorAll('.hb-focus')) old.classList.remove('hb-focus');
    const item = id && container.querySelector(`.hb-item[data-term="${id}"]`); if (!item) return;
    item.querySelector('details').open = true;
    item.classList.add('hb-focus');
    item.scrollIntoView({ block: 'center' });
  }

  // 遊戲外（識別證頁）看手冊：整頁浮層
  let overlay = null;
  function openOverlay(id) {
    if (!overlay) {
      overlay = h('div', 'hb-overlay');
      const panel = h('div', 'hb-panel'); const head = h('header', 'hb-head');
      const shut = h('button', 'btn ghost', '關閉'); shut.type = 'button'; shut.addEventListener('click', closeOverlay);
      head.append(h('h2', '', '新人手冊'), shut);
      panel.append(head, bookNode()); overlay.append(panel);
      overlay.addEventListener('click', (e) => { if (e.target === overlay) closeOverlay(); });
      document.body.append(overlay);
    }
    focusIn(overlay, id);
  }
  function closeOverlay() { if (overlay) overlay.remove(); overlay = null; }

  // 點術語開小卡（先攔下來，不讓它觸發底下的 label、清單項目）；點別的地方、捲動、按 Esc 收起
  document.addEventListener('click', (e) => {
    const btn = e.target.closest && e.target.closest('.term');
    if (btn) { e.preventDefault(); e.stopPropagation(); if (btn === current) close(); else show(btn); return; }
    if (pop && !pop.contains(e.target)) close();
  }, true);
  document.addEventListener('scroll', (e) => { if (pop && !pop.contains(e.target)) close(); }, true);
  document.addEventListener('keydown', (e) => { if (e.key !== 'Escape') return; if (pop) close(); else closeOverlay(); });

  root.Handbook = { configure, mark, watch, bookNode, focusIn, openOverlay, closeOverlay, close };
})(window);
