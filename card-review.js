// card-review.js — 審卡頁：把一關的每張卡攤開看（卡片內容、每件工作的題目與正解、每個選項的後果、帶入條件、
// 成品畫面照正解和每一種做錯的樣子），每張卡連到單卡試玩（index.html?office=關卡&card=卡）。
// 網址 card-review.html?office=關卡&mode=時代，#卡片 id 跳到那張。上半部是純資料（node 測得到），下半部畫畫面
(function (root) {
  const Works = typeof require === 'function' ? require('./works.js') : root.Works;
  const Screen = typeof require === 'function' ? require('./screen.js') : root.Screen;
  const MODES = ['legacy', 'hybrid', 'speedrun'];
  const KIND = { miss: 'QC 會退', late: '上線後才出事', annoy: '用的人惱怒', stuck: '單子卡住', displeased: '業主不滿（QC 不退）', gripe: '阿姿抱怨（QC 不退）' };
  const SOFT = ['displeased', 'gripe'];   // 做對了也會發生、或 QC 不退的
  const subtask = (card, work) => (card.subtasks || []).find(s => s.work === work);

  // 一個後果寫成一句話：種類・誰「說什麼」，再補驗收、無障礙、紅字這些跟著它的東西
  function outcomeText(o) {
    let text = [KIND[o.kind] || o.kind, o.who].filter(Boolean).join('・');
    if (o.say) text += `「${o.say}」`;
    if (o.accept !== undefined) text += `；驗收勾了第 ${o.accept + 1} 條，QC 就會退`;
    if (o.a11y) text += `；無障礙扣 ${o.a11y.minus} 分（${o.a11y.note}）`;
    if (o.red) text += `；跳紅字「${o.red}」`;
    if (o.junk) text += `；收進「${o.junk}」`;
    if (o.wrongChart) text += '；排錯的盤';
    return text;
  }
  const ritualText = (r) => [].concat(r).map(x => (typeof x === 'string' ? x : `${x.kind}「${x.say}」`)).join('＋');

  // 照正解做完每件工作的答案
  const rightPicks = (card) => Object.fromEntries((card.subtasks || []).map(s => [s.work, Works.rightAnswers(s.question)]));
  // 成品畫面要的那張卡：答案、後端程式的評分（每個 function 都算自己寫的，填錯就是 bug）、哪幾件做了
  function previewCard(card, picks) {
    const code = subtask(card, 'code');
    const history = code && picks.code ? [{ work: 'code', result: Works.grade(code.question, picks.code, { covered: [], picks: null }) }] : [];
    return { ...card, picks, history, done: (w) => picks[w] != null };
  }
  // 成品畫面要畫的那一頁和它的母議題。母議題自己沒有頁面（沒有後端程式也沒有 screen）：它的前端程式是整個網站的門面，
  // 套在一張子議題（sample）的正解頁面上看
  function previewPage(card, picks, parent, sample) {
    if (!subtask(card, 'code') && !card.screen && sample) return { page: previewCard(sample, rightPicks(sample)), parent: previewCard(card, picks) };
    return { page: previewCard(card, picks), parent: parent && previewCard(parent, rightPicks(parent)) };
  }
  // 成品畫面的幾種樣子：照正解、前端程式沒做、前端程式每題換一個有後果的選項、後端程式每格填錯會改畫面的
  function shotVariants(card) {
    const base = rightPicks(card);
    const out = [{ title: '照正解做', picks: base, good: true }];
    const ui = subtask(card, 'ui_design');
    if (ui) {
      out.push({ title: '前端程式沒做', picks: { ...base, ui_design: undefined } });
      const withUi = (i, value) => ({ ...base, ui_design: base.ui_design.map((a, j) => (j === i ? value : a)) });
      ui.question.items.forEach((item, i) => {
        if (item.type === 'palette') { if (item.tianshu) out.push({ title: `前端程式「配色」做成天書`, picks: withUi(i, { light: item.tianshu }) }); return; }
        if (Array.isArray(item.answer)) return;
        (item.options || []).forEach((text, k) => {
          const changes = (item.outcome && item.outcome[k]) || (item.ritual && item.ritual[item.answer] != null);
          if (k !== item.answer && changes) out.push({ title: `前端程式「${item.text}」選「${text}」`, picks: withUi(i, k) });
        });
      });
    }
    const code = subtask(card, 'code');
    const bugs = (card.screen && card.screen.bugs) || {};
    if (code) code.question.functions.forEach((f, i) => Object.entries(f.fields || {}).forEach(([key, field]) => field.options.forEach((text, k) => {
      if (k === field.answer) return;
      const o = field.outcome && field.outcome[k];
      const drawn = o ? (o.cells || o.column || o.addRows || o.a11y) : bugs[f.name];
      if (!drawn) return;
      const picks = { ...base, code: base.code.map((a, j) => (j === i ? { ...a, [key]: k } : a)) };
      out.push({ title: `後端程式 ${f.name}「${field.label}」選「${text}」`, picks });
    })));
    return out;
  }

  // 用的人怎麼說，照結算卡（engine.userReview）的規則：劇本自己定了客人的話（userVoice）就看前端、後端有沒有業主不滿挑一句；
  // 沒定的照 Screen.userVoice，母議題有畫面才比風格
  function voiceOf(script, card, picks, parent) {
    const voice = script.userVoice;
    if (voice) {
      const plain = ['ui_design', 'code'].some(w => { const s = subtask(card, w); return s && Works.outcomes(s.question, picks[w], { done: picks[w] != null, picks }).some(o => o.kind === 'displeased'); });
      return [`${voice.who}：「${plain ? voice.plain : voice.ritual}」`];
    }
    const parentCard = parent && previewCard(parent, rightPicks(parent));
    const ref = parent && parent.screen ? Screen.model(parentCard) : null;
    return Screen.userVoice(Screen.model(previewCard(card, picks), parentCard), ref);
  }

  const api = { outcomeText, ritualText, rightPicks, previewCard, previewPage, shotVariants, voiceOf, MODES };
  if (typeof module !== 'undefined') { module.exports = api; return; }
  root.CardReview = api;

  // ── 畫面 ──
  const { Sandbox, CardLinks, Palette } = root;
  const L = Works.label;
  const params = new URLSearchParams(location.search);
  const level = params.get('office') || 'fate';
  const mode = MODES.includes(params.get('mode')) ? params.get('mode') : 'legacy';
  const el = (tag, cls, text) => { const n = document.createElement(tag); if (cls) n.className = cls; if (text != null) n.textContent = text; return n; };
  const link = (href, text) => { const a = el('a', '', text); a.href = href; return a; };
  const meta = (label, text) => { const p = el('p', 'rv-meta'); p.append(el('b', '', label), document.createTextNode(text)); return p; };
  const playUrl = (card, m, extra = '') => `index.html?office=${level}&card=${encodeURIComponent(card)}&mode=${m}${extra}`;

  function marksOf(item) {
    if (item.type === 'order') return new Map([].concat(item.answer || []).map((k, pos) => [k, `第${pos + 1}步`]));
    return new Map([].concat(item.answer ?? []).map(k => [k, '✓']));
  }
  function optionList(item, replies = null) {
    const marks = marksOf(item); const ol = el('ol', 'rv-opts');
    (item.options || []).forEach((text, k) => {
      const li = el('li', marks.has(k) ? 'rv-right' : '');
      li.append(el('span', 'rv-mark', marks.get(k) || ''), el('span', 'rv-text', text));
      const o = item.outcome && item.outcome[k];
      if (o) li.append(el('span', `rv-out${SOFT.includes(o.kind) ? ' rv-soft' : ''}`, `→ ${outcomeText(o)}`));
      if (item.ritual && item.ritual[k] != null) li.append(el('span', 'rv-reply', `儀式畫面：${ritualText(item.ritual[k])}`));
      if (item.ifSkipped === k) li.append(el('span', 'rv-reply', '（這件工作沒做時，成品照這個）'));
      if (item.tags && item.tags[k]) li.append(el('span', 'rv-reply', `標記 ${item.tags[k]}`));
      if (replies && replies[k]) li.append(el('span', 'rv-reply', `回：${replies[k]}`));
      ol.append(li);
    });
    return ol;
  }
  function typeOf(item) {
    if (item.type === 'order') return '排順序';
    if (item.type === 'palette') return '配色';
    if (item.type === 'hours') return '估時';
    if (Array.isArray(item.answer)) return '多選';
    return '';
  }
  function itemNode(item, i) {
    const box = el('div', 'rv-item');
    const q = el('p', 'rv-q', `${i + 1}. ${item.text || item.label || ''}`);
    if (typeOf(item)) q.append(el('span', 'rv-type', typeOf(item)));
    box.append(q);
    if (item.type === 'palette') {
      box.append(el('p', 'rv-note', `正解：${Palette.describe(item, { light: item.right })}`));
      if (item.tianshu) box.append(el('p', 'rv-note', `天書：${Palette.describe(item, { light: item.tianshu })}`));
      box.append(el('p', 'rv-note', `老師的顏色：${Object.entries(item.teacherColors || {}).map(([id, who]) => `${(item.colors.find(c => c.id === id) || {}).name}（${who}）`).join('、')}`));
      return box;
    }
    if (item.type === 'hours') {
      if (item.real) box.append(el('p', 'rv-note', `實際：自己做 ${item.real.manual}、用 AI ${item.real.ai}${item.real.note ? `（${item.real.note}）` : ''}`));
      return box;
    }
    box.append(optionList(item));
    if (item.before) box.append(el('p', 'rv-note', `順序限制：${item.before.map(([a, b]) => `「${item.options[a]}」在「${item.options[b]}」前面`).join('；')}`));
    if (item.toBooking) box.append(el('p', 'rv-note', `照正解做，導去預約的客人 ${item.toBooking} 位`));
    if (item.why) box.append(el('p', 'rv-note', `說明：${item.why}`));
    return box;
  }
  function discussNode(q) {
    const box = el('div');
    (q.segments || []).forEach((seg, i) => {
      const item = el('div', 'rv-item'); item.append(el('p', 'rv-q', `第 ${i + 1} 段：${seg}`));
      for (const ask of [].concat((q.asks || {})[i] || [])) { item.append(el('p', 'rv-note', ask.text || '')); item.append(optionList(ask, ask.replies)); }
      box.append(item);
    });
    return box;
  }
  function functionsNode(q) {
    const box = el('div');
    q.functions.forEach((f) => {
      const item = el('div', 'rv-item'); item.append(el('p', 'rv-q', `${f.name}（${f.does || ''}）`));
      if (f.code) item.append(el('pre', 'rv-code', f.code));
      for (const field of Object.values(f.fields || {})) { item.append(el('p', 'rv-note', field.label || '')); item.append(optionList(field)); }
      box.append(item);
    });
    return box;
  }
  function workNode(s, rows) {
    const d = el('details', 'rv-work'); d.open = true;
    d.append(el('summary', '', `${L(s.work)}${s.question && s.question.fromMeeting ? '（會議帶進來，唯讀）' : ''}`));
    const q = s.question || {};
    if (q.points) { const ul = el('ul', 'rv-links'); q.points.forEach(p => ul.append(el('li', '', p))); d.append(el('p', 'rv-links-title', '卡上的重點'), ul); }
    if (q.kind === 'discuss') d.append(discussNode(q));
    else if (q.kind === 'functions') d.append(functionsNode(q));
    else (q.items || []).forEach((item, i) => d.append(itemNode(item, i)));
    const mine = rows.filter(r => r.work === s.work);
    if (mine.length) { const ul = el('ul', 'rv-links'); mine.forEach(r => ul.append(el('li', '', r.text))); d.append(el('p', 'rv-links-title', '帶入條件'), ul); }
    return d;
  }
  function shotsNode(script, card, parent, sample) {
    if (!card.screen && !subtask(card, 'ui_design')) return null;
    const site = !subtask(card, 'code') && !card.screen && sample;
    const box = el('details', 'rv-work'); box.open = true;
    box.append(el('summary', '', site ? `成品畫面（網站門面，套在「${sample.title}」的頁面上看）` : '成品畫面'));
    const grid = el('div', 'rv-shots');
    for (const v of shotVariants(card)) {
      const shot = el('div', `rv-shot${v.good ? ' rv-good' : ''}`); shot.append(el('h4', '', v.title));
      try {
        const { page, parent: under } = previewPage(card, v.picks, parent, sample);
        const frame = el('div', 'rv-frame'); frame.append(Screen.render(Screen.model(page, under), 'pc'));
        shot.append(frame, el('p', 'rv-voice', `用的人：${voiceOf(script, card, v.picks, parent).join(' ')}`));
      } catch (err) { shot.append(el('p', 'rv-err', String(err && err.stack || err))); }
      grid.append(shot);
    }
    box.append(grid);
    return box;
  }
  function cardNode(script, entry, anchor, parent, sample) {
    const card = entry.card; const sec = el('section', 'rv-card'); sec.id = anchor;
    sec.append(el('h2', '', `${card.title}`), el('p', 'rv-where', `${entry.id}・${entry.where}${card.parent ? `・母議題 ${card.parent}` : ''}`));
    const play = el('div', 'rv-play');
    if (entry.parallel) MODES.forEach(m => play.append(link(playUrl(entry.id, m, '&parallel=1'), `試玩 ${m}（從 ${entry.id} 開出來）`)));
    else MODES.forEach(m => play.append(link(playUrl(entry.id, m), `試玩 ${m}`)));
    sec.append(play);
    if (entry.parallel) sec.append(meta('怎麼開出來', `${entry.parallel.who}「${entry.parallel.say}」`));
    if (card.from || card.requester) sec.append(meta('開卡', [card.from, card.requester && `需求單位 ${card.requester}`].filter(Boolean).join('・')));
    if (card.body) sec.append(el('div', 'rv-body', card.body));
    if (card.attachments) sec.append(meta('附件', card.attachments.join('、')));
    if (card.evening) sec.append(meta('傍晚評語', `都對：「${card.evening.good}」；有錯：「${card.evening.bad}」`));
    for (const check of card.saChecks || []) {
      const box = el('div', 'rv-item'); box.append(el('p', 'rv-q', `退回 SA：${check.title}`));
      const ol = el('ol', 'rv-opts');
      check.options.forEach(o => { const li = el('li', o.right ? 'rv-right' : ''); li.append(el('span', 'rv-mark', o.right ? '✓' : ''), el('span', 'rv-text', o.text)); li.append(el('span', 'rv-reply', o.right ? `怡君問到：${o.adds}` : `丟回來：${o.why}`)); ol.append(li); });
      box.append(ol); sec.append(box);
    }
    const rows = CardLinks.linkRows(entry);
    for (const s of entry.subtasks || []) sec.append(workNode(s, rows));
    const shots = shotsNode(script, card, parent, sample); if (shots) sec.append(shots);
    return sec;
  }

  function boot() {
    const levelSel = document.getElementById('rv-level'), modeSel = document.getElementById('rv-mode');
    for (const id of Sandbox.ids()) { const o = el('option', '', id); o.value = id; levelSel.append(o); }
    levelSel.value = level; modeSel.value = mode;
    const go = () => { location.search = `?office=${levelSel.value}&mode=${modeSel.value}`; };
    levelSel.addEventListener('change', go); modeSel.addEventListener('change', go);
    const rootEl = document.getElementById('rv-root');
    const script = Sandbox.make(level, mode, { pool: 'all' });
    document.title = `IT24hr 審卡：${script.name || level}`;
    const entries = CardLinks.cardsOf(script);
    const byId = Object.fromEntries(entries.filter(e => !e.parallel).map(e => [e.id, e.card]));
    const seen = {};
    const anchors = entries.map(e => { const base = e.parallel ? `parallel-${e.id}` : e.id; seen[base] = (seen[base] || 0) + 1; return seen[base] > 1 ? `${base}-${seen[base]}` : base; });
    const toc = el('ul', 'rv-toc');
    entries.forEach((e, i) => { const li = el('li'); li.append(link(`#${anchors[i]}`, `${e.parallel ? '平行・' : ''}${e.card.title}`)); toc.append(li); });
    rootEl.append(toc);
    entries.forEach((e, i) => {
      // 門面要套的那一頁：第一張有後端程式的子議題
      const sample = (entries.find(c => !c.parallel && c.card.parent === e.id && subtask(c.card, 'code')) || {}).card;
      try { rootEl.append(cardNode(script, e, anchors[i], e.card.parent && byId[e.card.parent], sample)); }
      catch (err) { const sec = el('section', 'rv-card'); sec.append(el('h2', '', e.card.title), el('p', 'rv-err', String(err && err.stack || err))); rootEl.append(sec); }
    });
    if (location.hash) { const target = document.getElementById(location.hash.slice(1)); if (target) target.scrollIntoView(); }
  }
  boot();
})(typeof window !== 'undefined' ? window : globalThis);
