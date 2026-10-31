// quiz.js — 核心工作的小關卡視窗：照題型渲染、收答案、交給 engine 計分，然後顯示結果。
// 題目格式見 works.js。開發那題用 VS Code 樣式的視窗。
(function (root) {
  const h = (tag, cls, text) => { const el = document.createElement(tag); if (cls) el.className = cls; if (text !== undefined) el.textContent = text; return el; };

  // 自己做和 AI 做不衝突：從卡片打開的是卡上目前的版本（手寫）；從終端機「看一下」打開的才是 AI 那份（opts.fromAi），
  // 看過送出就蓋過卡上的版本，記成「AI 的、有看過」
  // AI 可以跑好幾份：opts.jobId 指第幾份
  const runsOf = (card, work) => (card.ai && card.ai[work]) || [];
  const aiReady = (card, work, opts = {}) => { const job = opts.fromAi ? runsOf(card, work).find(j => j.id === opts.jobId) : null; return job && job.status === 'ready' ? job : null; };
  const byOf = (card, work, opts) => { const job = aiReady(card, work, opts); return job ? { by: 'ai', reviewed: true, jobId: job.id } : {}; };

  // AI 的主張（judgment）：三種反應——請小潘看（等他 LIME）、自己驗（花時間、當場看到）、憑經驗（不花時間）
  function claimNode(engine, card, f) {
    const node = h('div', 'fn-claim');
    node.append(h('pre', 'fn-code claim', `  // AI 的建議：${f.claim}`));
    const done = card.claims && card.claims[f.name];
    if (done) {
      const NOTE = { test: `  // 自己驗：${done.note}`, ask: '  // 問了小潘，等他 LIME 回你', sa: `  // 怡君問過需求單位：${done.note}`, gut: '  // 憑經驗判斷' };
      node.append(h('pre', 'fn-code note', NOTE[done.how]));
      return node;
    }
    const row = h('div', 'claim-ops');
    const testMin = (f.evidence && f.evidence.testMin) || 30;
    for (const [how, label] of [['ask', '請小潘看看（等他回）'], ['test', `自己驗（花 ${testMin} 分鐘）`], ['gut', '憑經驗']]) {
      const b = h('button', 'btn small', label);
      b.addEventListener('click', () => { if (engine.checkClaim(card.id, f.name, how)) node.replaceWith(claimNode(engine, card, f)); });
      row.append(b);
    }
    node.append(row);
    return node;
  }

  // 開發小關卡：像 IDE，列出這張卡要的 function。卡裡有那句的直接拉進來（灰字、鎖住），沒有的每個欄位自己挑
  function ideForm(engine, card, work, q, wrap, close, opts) {
    const covered = card.draft ? card.draft.covered : 'all';
    const toFill = Works.functionsToFill(q, covered, card.picks);
    if (card.draft && card.draft.noSource) wrap.append(h('p', 'quiz-intro no-source', '這張卡沒附原文。你記得他說什麼嗎？'));
    const job = aiReady(card, work, opts), by = byOf(card, work, opts);
    const prev = job ? job.answers : (card.picks && card.picks[work]) || [];
    const answers = q.functions.map((_, i) => ({ ...(prev[i] || {}) }));   // 上次填的留著
    q.functions.forEach((f, i) => {
      if (!Works.activeFunction(f, card.picks)) return;   // 前面沒勾那個選項，就沒有這個 function（例如報表頁）
      const pulled = !toFill.includes(i);
      const box = h('section', `fn ${pulled ? 'pulled' : 'fill'}`);
      box.append(h('pre', 'fn-head', `function ${f.name}() {`));
      // 註解給非 IT 的玩家看懂這個 function 在做什麼：does 等於把函式名翻成中文，不講正解
      box.append(h('pre', 'fn-code fn-does', pulled ? `  // ${f.does}，已經從規格翻譯成程式語言了\n  ${f.code}` : `  // ${f.does}`));
      // AI 那份照筆記做、沒照它的主張填的話，就沒有主張要判斷（筆記蓋過主張）
      const claimed = !job || Object.entries(f.fields || {}).some(([key, field]) => field.ai && (job.answers[i] || {})[key] === field.ai.pick);
      if (!pulled && f.judgment && claimed) box.append(claimNode(engine, card, f));
      if (!pulled) for (const [key, field] of Object.entries(f.fields || {})) {
        const row = h('label', 'fn-field'); row.append(h('span', '', `${field.label || key}：`));
        const sel = h('select'); sel.append(new Option('—', ''));
        // 選項等事件才解鎖（志豪的 AD 信來之前，登入方式只能選 TODO）：鎖著時只剩那一個選項，旁邊寫在等什麼
        const locked = engine.fieldLocked(field);
        const keys = locked ? [field.lockedTo] : Works.displayOrder(field.options.length, `${engine.shuffleSeed}:${card.id}:${work}:${f.name}:${key}`);
        for (const k of keys) sel.append(new Option(field.options[k], String(k)));
        if (locked) { sel.value = String(field.lockedTo); answers[i][key] = field.lockedTo; row.append(h('small', 'muted', field.lockedText || '等資料來才能選')); }
        if (answers[i][key] !== undefined) sel.value = String(answers[i][key]);
        sel.addEventListener('change', () => { answers[i][key] = sel.value === '' ? undefined : Number(sel.value); });
        row.append(sel); box.append(row);
      }
      box.append(h('pre', 'fn-head', '}')); wrap.append(box);
    });
    const submit = h('button', 'btn primary', '送出');
    submit.addEventListener('click', () => {
      const result = engine.doWork(card.id, work, answers, { version: versionOf(work, card), ...by }); if (!result) return;
      // 對不對不在這裡講：bug 會在 QC 那邊自己冒出來
      wrap.replaceChildren(h('p', '', '寫完了，記在卡上。'), closeBtn(close));
    });
    const back = reviseBtn(engine, card, work, q, job, () => answers, wrap, close);
    const foot = h('div', 'quiz-foot'); if (back) foot.append(back); foot.append(submit);
    wrap.append(foot);
    return wrap;
  }

  // 需求討論兩頁：第一頁在原話上圈出講不清楚的地方，第二頁只對圈起來的選要問什麼。沒圈到的這裡不提
  function discussForm(engine, card, work, q, wrap, close, opts) {
    const job = aiReady(card, work, opts), by = byOf(card, work, opts);
    const prev = job ? job.answers : (card.picks && card.picks[work]) || {};
    const circled = new Set(prev.circled || []);   // 上次圈的留著
    const who = card.requester;   // 去問提需求的人；SA 開的卡 from 是怡君，但原話和回答都是需求單位的
    const page1 = h('div', 'discuss-page');
    page1.append(h('p', 'muted', `${who}的原話。覺得講不清楚的地方，點一下圈起來。`));
    const transcript = h('div', 'transcript');
    q.segments.forEach((text, i) => {
      const seg = h('button', 'seg', text); seg.type = 'button'; seg.classList.toggle('circled', circled.has(i));
      seg.addEventListener('click', () => { circled.has(i) ? circled.delete(i) : circled.add(i); seg.classList.toggle('circled', circled.has(i)); });
      transcript.append(seg);
    });
    page1.append(transcript);
    const next = h('button', 'btn primary', '去找他問'); const foot1 = h('div', 'quiz-foot'); foot1.append(next); page1.append(foot1);
    next.addEventListener('click', () => { wrap.replaceChildren(page2()); });
    const page2 = () => {
      const page = h('div', 'discuss-page'); const asks = { ...(prev.asks || {}) };
      const picked = [...circled].sort((a, b) => a - b);
      if (!picked.length) page.append(h('p', '', '你覺得他都講清楚了，就沒去問。'));
      for (const i of picked) {
        if (q.asks[i]) {   // 標題是你圈的那句原話；他被問到時的回應放在選項前面。一段可以掛好幾題
          const holder = asks[i] = [].concat(asks[i] ?? []);
          [].concat(q.asks[i]).forEach((ask, k) => {
            const fs = itemNode({ ...ask, text: k === 0 ? q.segments[i] : '（接著問）', key: `d${i}_${k}` }, k, holder, work, card, `${engine.shuffleSeed}:${card.id}:${work}`);
            fs.insertBefore(h('p', 'muted reply-line', ask.text), fs.children[1]); page.append(fs);
          });
        }
        else { const fs = h('fieldset', 'item'); fs.append(h('legend', '', q.segments[i]), h('p', 'muted', `${who}：「這個我有講清楚吧？」`)); page.append(fs); }
      }
      const done = h('button', 'btn primary', '問完了'); const foot = h('div', 'quiz-foot');
      const back = reviseBtn(engine, card, work, q, job, () => ({ circled: picked, asks }), wrap, close);
      if (back) foot.append(back); foot.append(done); page.append(foot);
      done.addEventListener('click', () => {
        const result = engine.doWork(card.id, work, { circled: picked, asks }, { version: versionOf(work, card), ...by }); if (!result) return;
        // 問完了要看得到他怎麼回：一頁對話紀錄
        const log = h('div', 'discuss-log');
        for (const i of picked) {
          if (!q.asks[i]) { log.append(h('p', 'muted', `${who}：「這個我有講清楚吧？」`)); continue; }
          [].concat(q.asks[i]).forEach((ask, k) => {
            const j = (asks[i] || [])[k];
            if (j === undefined) { log.append(h('p', 'muted', `（${q.segments[i]}——圈了但沒問）`)); return; }
            const reply = (card.saAsked || []).includes(i) ? '「這個怡君剛剛也問了。」' : (ask.replies && ask.replies[j]) || '「嗯。」';
            log.append(h('p', 'me', `你：${ask.options[j]}`), h('p', 'them', `${who}：${reply}`));
          });
        }
        if (!log.children.length) log.append(h('p', 'muted', '沒問什麼，就回座位了。'));
        wrap.replaceChildren(log, resultNode(q, result), closeBtn(close));
      });
      return page;
    };
    wrap.append(page1);
    return wrap;
  }

  // opts.fromAi：從終端機「看一下」打開 AI 那份（跟卡上的版本是兩個視窗）
  function open(desk, engine, card, work, opts = {}) {
    engine.openWork(card.id, work);   // 按下去視窗一開，提示暫停的時鐘就恢復
    if (work === 'manual_test') return desk.enterTestMode(card);   // 手動測試不是視窗，是整張桌子進測試模式
    // 資料登打之前要先跑一趟（黑畫面、時間過掉、文件多一份照片與清單），回來才開表格
    const pre = engine.subtask(card, work);
    if (pre && pre.question.kind === 'entry' && !card.tripped)
      return desk.trip(pre.question.tripText, () => { engine.restoreTrip(card.id); open(desk, engine, card, work, opts); });
    const aiJob = aiReady(card, work, opts);
    const fromAi = !!aiJob;
    const id = `work:${card.id}:${work}${fromAi ? `:ai${aiJob.id}` : ''}`;
    const cls = work === 'code' ? 'win-code' : work === 'reject' ? 'win-reject' : 'win-work';
    const title = `${work === 'reject' ? '退回 SA' : Works.label(work)}${fromAi ? `（AI 第 ${aiJob.id} 份）` : ''} — ${card.title}`;
    const win = desk.wm.open({ id, title, icon: fromAi ? 'square-terminal' : 'square-kanban', x: fromAi ? 210 : 180, y: fromAi ? 90 : 60, w: 600, h: 480, cls, content: h('div') });
    desk.wm.setContent(id, build(desk, engine, card, work, () => desk.wm.close(id), opts));
    return win;
  }

  // Novel 多寫的廢話：頭尾都有，前半是前言放小遊戲上面、後半是結語放下面；一行一行刪，全部刪完才算精簡。
  // lines 是引擎那份，刪了就地少一行；回傳 [前言, 結語] 兩塊
  function fillerNodes(engine, card, work, jobId, lines, onTrim) {
    const half = Math.ceil(lines.length / 2);
    const parts = [['Claire 寫的前言', lines.slice(0, half)], ['Claire 寫的結語', lines.slice(half)]].map(([title, own]) => {
      const box = h('section', 'ai-filler'); box.dataset.noTerms = '';   // 廢話不用查詞，標了虛線反而花
      return { title, own, box };
    });
    const draw = () => {
      for (const { title, own, box } of parts) {
        box.hidden = !own.length;
        const list = h('ul', 'filler-lines');
        for (const line of own) {
          const row = h('li'); const del = h('button', 'filler-del', '×'); del.type = 'button'; del.title = '刪掉這行';
          del.addEventListener('click', () => { engine.trimFiller(card.id, work, line, jobId); own.splice(own.indexOf(line), 1); draw(); onTrim(); });
          row.append(h('span', '', line), del); list.append(row);
        }
        box.replaceChildren(h('h4', '', `${title}（還有 ${own.length} 行）`), list);
      }
      if (!lines.length) { parts[0].box.hidden = false; parts[0].box.replaceChildren(h('p', 'muted', '廢話都刪掉了。')); }
    };
    draw();
    return parts.map(p => p.box);
  }

  function build(desk, engine, card, work, close, opts = {}) {
    const wrap = h('div', 'quiz');
    if (work === 'reject') return rejectForm(engine, card, wrap, close);
    const sub = engine.subtask(card, work);
    if (!sub) {
      wrap.append(h('p', '', `這張卡沒有「${Works.label(work)}」要做。`), closeBtn(close));
      return wrap;
    }
    if (card.done(work)) wrap.append(h('p', 'muted', `上次：${card.latest(work) || '做過了'}。再做一次會記成新版本。`));
    const runs = runsOf(card, work);
    if (aiReady(card, work, opts)) wrap.append(h('p', 'ai-banner', `${card.done(work) ? 'AI 的版本，完成就會蓋過卡上的版本。' : 'AI 填好了。'}沒問題就完成，不對就退回請它改——送出去寫的是你的名字。`));
    else if (runs.some(j => j.status === 'running')) wrap.append(h('p', 'ai-banner muted-banner', 'AI 也在做這件。你可以自己先寫，它交件後會在終端機等你決定要不要蓋過。'));
    else if (runs.some(j => j.status === 'ready')) wrap.append(h('p', 'ai-banner muted-banner', 'AI 的版本在終端機等你。這裡是卡上的版本。'));
    if (work === 'deploy' && card.aiDeployed && card.aiDeployed.length) {   // AI 中斷前做過的步驟算數，這裡只排剩下的
      const q = engine.subtask(card, work).question;
      wrap.append(h('p', 'ai-banner muted-banner', `${engine.aiName()}中斷前已經做了：${card.aiDeployed.map(r => q.items[0].options[q.roles[r]]).join('、')}。這裡排剩下的步驟。`));
    }
    const q = sub.question;
    const intro = Works.intro(work, q); if (intro) wrap.append(h('p', 'quiz-intro', intro));
    // Novel 寫的廢話：AI 那份看 job 上的，卡上的版本看收下時留下來的
    const fillerJob = aiReady(card, work, opts);
    const filler = fillerJob ? engine.aiFiller(fillerJob, work) : (card.wordy && card.wordy[work]) || [];
    const [fillerHead, fillerTail] = filler.length ? fillerNodes(engine, card, work, fillerJob ? fillerJob.id : null, filler, () => desk.refreshCard(card.id)) : [];
    if (fillerHead) wrap.append(fillerHead);
    if (q.kind === 'device') return deviceForm(engine, card, work, q, wrap, close);
    if (q.kind === 'functions') return ideForm(engine, card, work, q, wrap, close, opts);
    if (q.kind === 'discuss') return discussForm(engine, card, work, q, wrap, close, opts);
    if (q.kind === 'terminal') return terminalForm(desk, engine, card, work, q, wrap, close);
    if (q.kind === 'entry') return entryForm(engine, card, work, q, wrap, close, opts);
    if (q.kind === 'spot') return spotForm(engine, card, work, q, wrap, close, opts);
    if (q.kind === 'diff') return diffForm(engine, card, work, q, wrap, close, opts);
    if (q.points) { const ul = h('ul', 'points'); for (const p of q.points) ul.append(h('li', '', p)); wrap.append(ul); }

    // 寫過的文件再點進來，停在最後一次的樣子（上次的答案記在 card.picks）
    const aiJob = aiReady(card, work, opts), by = byOf(card, work, opts);
    const prev = aiJob ? aiJob.answers : (card.picks && card.picks[work]) || [];
    const answers = q.items.map((_, i) => prev[i]);
    q.items.forEach((item, i) => wrap.append(itemNode(item, i, answers, work, card, `${engine.shuffleSeed}:${card.id}:${work}`)));
    if (fillerTail) wrap.append(fillerTail);
    const foot = h('div', 'quiz-foot');
    const submit = h('button', 'btn primary', '完成');
    submit.addEventListener('click', () => {
      const result = engine.doWork(card.id, work, answers.map(a => a === undefined ? null : a), { version: versionOf(work, card), ...by });
      if (!result) return;
      wrap.replaceChildren(resultNode(q, result), closeBtn(close));
    });
    const back = reviseBtn(engine, card, work, q, aiJob, () => answers.map(a => a === undefined ? null : a), wrap, close);
    if (back) foot.append(back);
    foot.append(submit); wrap.append(foot);
    return wrap;
  }

  // ── 檢閱程式碼的兩款小遊戲：點畫面、不讀選項；點到之後才選原因。提示兩層不扣分，次數跟著答案走 ──
  // 兩款共用：標記表 marks（key → reason）、原因小選單、提示鈕、交出；AI 代做那份先把它的標記放進來
  function reviewState(engine, card, work, q, opts) {
    const aiJob = aiReady(card, work, opts);
    const prev = aiJob ? aiJob.answers : (card.picks && card.picks[work] && card.picks[work].marks ? card.picks[work] : null);
    const marks = new Map(((prev && prev.marks) || []).map(m => [String(m.key), m.reason]));
    return { aiJob, marks, hintsUsed: 0, hint: null, answers: () => ({ marks: [...marks].map(([key, reason]) => ({ key: isNaN(key) ? key : +key, reason })), lgtm: false, hintsUsed: 0 }) };
  }
  function reasonMenu(q, key, state, anchor, redraw) {
    const menu = h('div', 'review-menu');
    for (const r of q.reasons) {
      const b = h('button', `btn small${state.marks.get(String(key)) === r.id ? ' primary' : ''}`, r.text);
      b.addEventListener('click', (ev) => { ev.stopPropagation(); state.marks.set(String(key), r.id); redraw(); });
      menu.append(b);
    }
    const off = h('button', 'btn small ghost', '取消'); off.addEventListener('click', (ev) => { ev.stopPropagation(); state.marks.delete(String(key)); redraw(); });
    menu.append(off); anchor.append(menu);
  }
  function reviewFoot(engine, card, work, q, state, wrap, close, opts, { lgtm = false, redraw }) {
    const foot = h('div', 'quiz-foot review-foot');
    const hintBtn = h('button', 'btn ghost', '提示');
    const hintBox = h('p', 'review-hint'); hintBox.hidden = true;
    hintBtn.addEventListener('click', () => {
      if (state.hintsUsed >= (q.hints || []).length) return;
      state.hint = state.hintsUsed; state.hintsUsed++;
      hintBox.hidden = false; hintBox.textContent = q.hints[state.hint]; redraw();
      if (state.hintsUsed >= q.hints.length) hintBtn.disabled = true;
    });
    const send = (answers) => {
      const result = engine.doWork(card.id, work, answers, { version: versionOf(work, card), ...byOf(card, work, opts) }); if (!result) return;
      wrap.replaceChildren(h('p', '', Works.summarize(q, answers, result)), closeBtn(close));
    };
    const go = h('button', 'btn primary', '交出檢閱'); go.addEventListener('click', () => send({ ...state.answers(), hintsUsed: state.hintsUsed }));
    foot.append(hintBtn);
    if (lgtm) { const ok = h('button', 'btn', 'LGTM'); ok.addEventListener('click', () => send({ marks: [], lgtm: true, hintsUsed: state.hintsUsed })); foot.append(ok); }
    foot.append(go);
    return { foot, hintBox };
  }
  // 前端「三機找碴」：PC、開發平板、開發手機三台並排，畫的是 AI 做出來的版本（含瑕疵）；點區塊畫紅圈、選原因
  function spotForm(engine, card, work, q, wrap, close, opts) {
    const state = reviewState(engine, card, work, q, opts);
    const model = Screen.model({ ...card, screen: { ...(card.screen || {}), campaign: true, defects: Object.fromEntries(q.defects.map(d => [d, null])) }, history: [{ work: 'code', result: { toFill: [], bugs: [] } }] });
    const board = h('div', 'spot-devices');
    const names = { pc: 'PC', tablet: '開發平板', phone: '開發手機' };
    const redraw = () => {
      board.replaceChildren();
      for (const device of q.devices) {
        const frame = h('div', `spot-frame spot-${device}${state.hint === 1 && q.spots.some(s => !s.trap && s.devices.includes(device) && s.devices.length === 1) ? ' spot-lit' : ''}`);
        const page = Screen.render(model, device);
        for (const node of page.querySelectorAll('[data-region]')) {
          const key = node.dataset.region;
          if (state.marks.has(key)) { node.classList.add('spot-hit'); reasonMenu(q, key, state, node, redraw); }
          node.addEventListener('click', (ev) => { ev.stopPropagation(); if (state.marks.has(key)) return; state.marks.set(key, null); redraw(); });
        }
        frame.append(page, h('div', 'spot-name', names[device] || device)); board.append(frame);
      }
    };
    redraw();
    const { foot, hintBox } = reviewFoot(engine, card, work, q, state, wrap, close, opts, { redraw });
    wrap.append(board, hintBox, foot);
    return wrap;
  }
  // 後端「讀 diff 標行」：檔名、行號、+／-、紅減綠加；點行亮起、選原因；LGTM 什麼都不標直接交
  function diffForm(engine, card, work, q, wrap, close, opts) {
    const state = reviewState(engine, card, work, q, opts);
    const box = h('div', 'diff-box');
    const litRange = () => { const m = ((q.hints || [])[1] || '').match(/第 (\d+) 到第 (\d+) 行|看第 (\d+) 行/); return m ? [+(m[1] || m[3]), +(m[2] || m[3])] : null; };
    const redraw = () => {
      box.replaceChildren(h('div', 'diff-file', q.file));
      const range = state.hint === 1 ? litRange() : null;
      for (const line of q.lines) {
        const row = h('div', `diff-line diff-${line.t === '+' ? 'add' : line.t === '-' ? 'del' : 'ctx'}${state.marks.has(String(line.n)) ? ' diff-hit' : ''}${range && line.n >= range[0] && line.n <= range[1] ? ' diff-lit' : ''}`);
        const code = h('code', 'fn-code', line.code || ' ');
        row.append(h('span', 'diff-no', String(line.n)), h('span', 'diff-sign', line.t), code);
        row.addEventListener('click', () => { if (state.marks.has(String(line.n))) return; state.marks.set(String(line.n), null); redraw(); });
        if (state.marks.has(String(line.n))) reasonMenu(q, line.n, state, row, redraw);
        box.append(row);
      }
    };
    redraw();
    const { foot, hintBox } = reviewFoot(engine, card, work, q, state, wrap, close, opts, { lgtm: true, redraw });
    wrap.append(box, hintBox, foot);
    return wrap;
  }

  // 退回＝請 AI 改：圈出它錯的或漏的題目，每題底下選一句補充說明（不選＝只說這題不對，它照原本的正確率重做）。
  // 講的話會寫進 AI 筆記（它自己的口吻），之後同主題的題目它都照這個做。base 是答案卡上現在的樣子（你自己先改的也算）
  function reviseBtn(engine, card, work, q, job, current, wrap, close) {
    if (!job || !Works.aiSpots(q, job.answers, engine.aiCtx(card)).length) return null;   // 不是 AI 那份、或沒得圈（資料登打）
    const b = h('button', 'btn', '退回'); b.type = 'button';
    b.addEventListener('click', () => reviseForm(engine, card, work, q, current(), job, wrap, close));
    return b;
  }
  function reviseForm(engine, card, work, q, base, job, wrap, close) {
    const spots = Works.aiSpots(q, base, engine.aiCtx(card));
    const chosen = new Map();   // 圈的題目 → 第幾句補充說明（null＝只說這題不對）
    const go = h('button', 'btn primary', `請 AI 改（扣 ${engine.aiCost(job.model)} 格額度）`); go.disabled = true;
    const lack = h('p', 'no-source');   // 額度不夠跑這個模型：打開就說，不用按了才知道
    const sync = () => { const short = engine.aiLack(job.model); go.disabled = !chosen.size || !!short; lack.hidden = !short; lack.textContent = short ? `${short}這件只能自己改，或等額度補滿再退回。` : ''; };
    wrap.replaceChildren(h('p', 'ai-banner', '圈出它錯的或漏的，跟它說要怎麼改。你說的話它會記進 AI 筆記，之後同類的題目都照著做。'));
    if (engine.isWordy(job, work)) {   // Novel 寫的太長：不用圈題目也能退，請它用人話寫（記進筆記，之後都短）
      const row = h('fieldset', 'item revise-spot'); const pick = h('label', 'revise-pick'); const cb = h('input'); cb.type = 'checkbox';
      pick.append(cb, h('span', '', '這份太長了，請它用人話寫')); row.append(pick, h('p', 'muted small', '十二頁的文件，八頁在講為什麼要有這份文件。'));
      cb.addEventListener('change', () => { if (cb.checked) chosen.set('style', 'plain'); else chosen.delete('style'); sync(); });
      wrap.append(row);
    }
    for (const spot of spots) {
      const row = h('fieldset', 'item revise-spot');
      const pick = h('label', 'revise-pick'); const cb = h('input'); cb.type = 'checkbox';
      pick.append(cb, h('span', '', spot.label)); row.append(pick, h('p', 'muted small', `它填的：${spot.shown}`));
      const say = h('div', 'revise-say'); say.hidden = true;
      const name = `say-${card.id}-${work}-${job.id}-${spot.key}`;
      let fix = null;   // 這題選的補充說明
      // 補充說明打散（劇本照三派人類的順序寫，不打散的話原則派永遠在同一個位置）
      const said = Works.displayOrder(spot.fixes.length, `${engine.shuffleSeed}:${card.id}:${work}:${spot.key}:fixes`).map(k => [k, `「${spot.fixes[k].say}」`]);
      [[null, '不補充，只說這題不對'], ...said].forEach(([k, text]) => {
        const lab = h('label', 'opt'); const r = h('input'); r.type = 'radio'; r.name = name; r.checked = k === null;
        r.addEventListener('change', () => { fix = k; if (cb.checked) chosen.set(spot.key, fix); });
        lab.append(r, h('span', '', text)); say.append(lab);
      });
      cb.addEventListener('change', () => {
        say.hidden = !cb.checked;
        if (cb.checked) chosen.set(spot.key, fix); else chosen.delete(spot.key);
        sync();
      });
      row.append(say); wrap.append(row);
    }
    const foot = h('div', 'quiz-foot'); const cancel = h('button', 'btn', '算了');
    cancel.addEventListener('click', close);
    go.addEventListener('click', () => {
      const r = engine.reviseAi(card.id, work, job.id, base, [...chosen].map(([key, fix]) => ({ key, fix })));
      if (!r) { sync(); if (lack.hidden) { lack.textContent = '這件現在退不回去。'; lack.hidden = false; } return; }   // 額度以外的原因：在家沒連 VPN、卡已經不能動
      wrap.replaceChildren(h('p', '', '退回去了。它改好會在終端機等你；你剛剛說的話記在 AI 筆記裡。'), closeBtn(close));
    });
    foot.append(cancel, go); wrap.append(lack, foot);
    sync();
    return wrap;
  }

  // 終端機小遊戲：自己點指令，一行一行印出來（也記進筆電的終端機），該查的都查了按「查完了」
  function terminalForm(desk, engine, card, work, q, wrap, close) {
    const ran = new Set([].concat((card.picks && card.picks[work]) || []));
    const pre = h('pre', 'terminal-text term-game');
    const print = (c) => {
      const lines = [{ text: `$ ${c.cmd}`, kind: 'cmd' }, ...c.out.map(t => ({ text: t, kind: 'out' })), ...(c.note ? [{ text: c.note, kind: 'note' }] : [])];
      for (const l of lines) pre.append(h('span', `t-${l.kind}`, l.text + '\n'));
      return lines;
    };
    for (const i of ran) print(q.commands[i]);
    const cmds = h('div', 'term-cmds');
    q.commands.forEach((c, i) => {
      const b = h('button', 'tbtn', c.cmd); b.type = 'button';
      b.addEventListener('click', () => { ran.add(i); desk.terminalLines.push(...print(c)); desk.refreshTerminal(); pre.scrollTop = pre.scrollHeight; });
      cmds.append(b);
    });
    const done = h('button', 'btn primary', '查完了');
    done.addEventListener('click', () => {
      const r = engine.doWork(card.id, work, [...ran], { version: versionOf(work, card) }); if (!r) return;
      wrap.replaceChildren(h('p', '', r.done ? '每個地方都翻過了。舊資料回不來了。' : '還有地方沒翻到。'), closeBtn(close));
    });
    const foot = h('div', 'quiz-foot'); foot.append(done);
    wrap.append(pre, cmds, foot);
    return wrap;
  }

  // 資料登打小遊戲：12 筆的名稱、持有人打進表格，照片從上面拖到對應那一列（也可以先點照片再點格子）
  const PHOTO_ICON = { laptop: 'monitor', monitor: 'monitor', projector: 'monitor', phone: 'smartphone', tablet: 'tablet' };
  function entryForm(engine, card, work, q, wrap, close, opts) {
    const job = aiReady(card, work, opts), by = byOf(card, work, opts);
    const prev = job ? job.answers : (card.picks && card.picks[work]) || [];
    const rows = q.records.map((r, i) => ({ name: '', owner: '', photo: null, ...(prev[i] || {}) }));
    let held = null;
    const tray = h('div', 'photo-tray');
    const photos = new Map();
    for (const k of Works.displayOrder(q.records.length, `${engine.shuffleSeed}:${card.id}:photos`)) {
      const r = q.records[k];
      const p = h('div', 'photo'); p.draggable = true; p.dataset.photo = r.photo; p.title = r.photo;
      p.append(Icons.el(PHOTO_ICON[r.icon] || 'briefcase', 'photo-ico'), h('span', 'photo-tag', r.no), h('span', 'photo-name', r.photo));
      p.addEventListener('dragstart', (ev) => ev.dataTransfer.setData('text/plain', r.photo));
      p.addEventListener('click', () => { held = held === r.photo ? null : r.photo; for (const x of tray.children) x.classList.toggle('held', x.dataset.photo === held); });
      photos.set(r.photo, p); tray.append(p);
    }
    const table = h('table', 'entry-table');
    const head = h('tr'); for (const t of ['編號', '名稱', '持有人', '照片']) head.append(h('th', '', t)); table.append(head);
    const used = () => { const set = new Set(rows.map(r => r.photo).filter(Boolean)); for (const [id, p] of photos) p.classList.toggle('used', set.has(id)); };
    q.records.forEach((r, i) => {
      const tr = h('tr'); tr.append(h('td', 'mono', r.no));
      for (const key of ['name', 'owner']) {
        const td = h('td'); const input = h('input', 'entry-input'); input.value = rows[i][key];
        input.addEventListener('input', () => { rows[i][key] = input.value; }); td.append(input); tr.append(td);
      }
      const cell = h('td', 'photo-drop');
      const show = () => { cell.textContent = rows[i].photo || '拖照片到這裡'; cell.classList.toggle('filled', !!rows[i].photo); used(); };
      const put = (id) => { rows[i].photo = id; held = null; for (const x of tray.children) x.classList.remove('held'); show(); };
      cell.addEventListener('dragover', (ev) => ev.preventDefault());
      cell.addEventListener('drop', (ev) => { ev.preventDefault(); put(ev.dataTransfer.getData('text/plain')); });
      cell.addEventListener('click', () => (held ? put(held) : rows[i].photo && put(null)));
      show(); tr.append(cell); table.append(tr);
    });
    const submit = h('button', 'btn primary', '補完了');
    submit.addEventListener('click', () => {
      const r = engine.doWork(card.id, work, rows.map(x => ({ ...x })), { version: versionOf(work, card), ...by }); if (!r) return;
      wrap.replaceChildren(h('p', '', '補完了，記在卡上。對不對，QC 會對著清單一筆一筆看。'), closeBtn(close));
    });
    const foot = h('div', 'quiz-foot'); foot.append(submit);
    wrap.append(h('p', 'muted', '照片在「文件」裡的「行銷部資料照片與清單」有對照。'), tray, table, foot);
    return wrap;
  }

  function versionOf(work, card) {
    const n = card.history.filter(x => x.work === work).length + 1;
    return work.startsWith('doc_') ? `v${n}` : undefined;
  }

  // seed：這一題選項顯示順序的種子（Works.displayOrder）；有 values 的（估時）照原順序
  function itemNode(item, i, answers, work, card, seed) {
    if (item.type === 'hours') return hoursNode(item, i, answers);
    const box = h('fieldset', 'item');
    const order = Works.displayOrder(item.options.length, `${seed}:${item.key || i}`, item.keepOrder || !!item.values);
    // item.given：前面的文件寫到的選項直接帶進來，勾好鎖住（Works.givenOptions）。
    // 排序題（開發計畫）帶進來的步驟接在清單後面、照畫面上的順序，先後還是玩家自己排（排順序是開發計畫的功課）
    const given = card ? Works.givenOptions(item, card.picks, (w) => card.done(w)) : [];
    const prev = Array.isArray(answers[i]) ? answers[i] : [];
    if (given.length) answers[i] = item.type === 'order' ? [...prev, ...order.filter(j => given.includes(j) && !prev.includes(j))] : [...new Set([...given, ...prev])];
    const init = answers[i];   // 上次選的（或帶入的），重新打開要停在那個樣子
    // 題幹有 ____ 的是填空：選了選項，底線上的字直接換成那個選項（畫重點是自己在寫句子，不是在答題）
    const legend = h('legend'); if (work === 'code') legend.classList.add('code'); box.append(legend);
    const blankAt = item.text.indexOf('____'); let blank = null;
    if (blankAt >= 0) {
      blank = h('span', 'blank', '________');
      legend.append(item.text.slice(0, blankAt), blank, item.text.slice(blankAt + 4));
    } else legend.textContent = item.text;
    const multi = Array.isArray(item.answer) && item.type !== 'order';
    const hidden = Works.hiddenOptions(item, card && card.picks);   // 前面沒問到的（showIf）、怡君已經刪掉的（hideIf），這個選項就不會出現
    if (item.type === 'order') return orderNode(item, i, answers, box, order, given, hidden);
    const name = item.key || `q${i}`;
    order.forEach((j) => {
      if (hidden.includes(j)) return;
      const opt = item.options[j];
      const label = h('label', 'opt');
      const input = h('input'); input.type = multi ? 'checkbox' : 'radio'; input.name = name; input.value = j;
      if (init !== undefined && (Array.isArray(init) ? init.includes(j) : init === j)) { input.checked = true; if (blank) { blank.textContent = opt; blank.classList.add('filled'); } }
      if (given.includes(j)) { input.disabled = true; label.classList.add('given'); label.title = '從前面的文件帶進來的'; }
      input.addEventListener('change', () => {
        if (multi) answers[i] = [...box.querySelectorAll('input:checked')].map(x => Number(x.value));
        else answers[i] = j;
        if (blank) { blank.textContent = opt; blank.classList.add('filled'); }
      });
      label.append(input);
      if (item.swatch) label.append(swatchNode(item.swatch[j]));   // 配色：色票
      if (item.thumb) label.append(thumbNode(item.thumb[j]));      // 提示方式：縮圖
      label.append(h('span', '', opt)); box.append(label);
    });
    if (multi) box.append(h('p', 'muted small', '可複選'));
    return box;
  }
  // 估時：自己填幾小時，沒有對錯；結算卡拿它跟實際花的時間並排
  function hoursNode(item, i, answers) {
    const box = h('fieldset', 'item hours');
    box.append(h('legend', '', item.text));
    const input = h('input'); input.type = 'number'; input.min = '0.5'; input.step = '0.5'; input.inputMode = 'decimal';
    if (answers[i] != null) input.value = answers[i];
    input.addEventListener('input', () => { const v = Number(input.value); answers[i] = input.value && v > 0 ? v : undefined; });
    const row = h('label', 'hours-row'); row.append(input, h('span', '', '小時')); box.append(row);
    return box;
  }
  // 色票：底色上一個「Aa」字樣（字色）和一顆按鈕（按鈕色），看一眼就知道對比怎樣
  function swatchNode([bg, fg, accent]) {
    const sw = h('span', 'swatch', 'Aa'); sw.style.background = bg; sw.style.color = fg;
    const btn = h('i', 'swatch-btn'); btn.style.background = accent; sw.append(btn);
    return sw;
  }
  // 提示方式的縮圖：一小張頁面，上面用 CSS 畫出 dialog／toast／tooltip／inline／alert 長什麼樣
  function thumbNode(kind) {
    const t = h('span', `thumb thumb-${kind}`);
    t.append(h('i', 'tp-line'), h('i', 'tp-line short'), h('i', 'tp-field'));
    if (kind === 'dialog') { const d = h('i', 'tp-dialog'); d.append(h('b'), h('u'), h('u')); t.append(h('i', 'tp-dim'), d); }
    if (kind === 'toast') t.append(h('i', 'tp-toast'));
    if (kind === 'tooltip') t.append(h('i', 'tp-tip'));
    if (kind === 'inline') t.append(h('i', 'tp-err'));
    if (kind === 'alert') { const a = h('i', 'tp-alert'); a.append(h('b', '', '!'), h('u')); t.append(h('i', 'tp-dim'), a); }
    return t;
  }

  // 排序題：還沒排的選項照打散的順序擺（不然原本的順序就是答案）。排好的可以局部改（AI 交的也一樣）：
  // 點步驟退回下面、拖左邊的握把調順序（握把上按 ↑↓ 也行）
  // given：前面的文件帶進來的步驟，鎖住不能退回，按「重排」也留著；拖曳換順序照常
  function orderNode(item, i, answers, box, order, given = [], hidden = []) {
    const picked = Array.isArray(answers[i]) ? answers[i].filter(j => !hidden.includes(j)) : [];   // 上次排過的順序留著；後來藏起來的選項拿掉
    const seq = h('ol', 'order-seq'); const pool = h('div', 'order-pool');
    const commit = (focusAt) => {
      answers[i] = picked.length ? [...picked] : undefined; render();
      if (focusAt !== undefined && seq.children[focusAt]) seq.children[focusAt].querySelector('.order-grip').focus();
    };
    const move = (from, to) => { if (to < 0 || to >= picked.length || to === from) return; picked.splice(to, 0, picked.splice(from, 1)[0]); commit(to); };
    // 拖曳：指標鎖在整個清單上（拖動中那一列會換位置，鎖在列上會掉），放開時照畫面上的順序存
    let drag = null;
    seq.addEventListener('pointermove', (e) => {
      if (!drag) return;
      const rest = [...seq.children].filter(li => li !== drag);
      const before = rest.find(li => { const r = li.getBoundingClientRect(); return e.clientY < r.top + r.height / 2; });
      seq.insertBefore(drag, before || null);
    });
    const drop = () => {
      if (!drag) return;
      const next = [...seq.children].map(li => Number(li.dataset.opt)); const to = next.indexOf(Number(drag.dataset.opt));
      drag = null; picked.splice(0, picked.length, ...next); commit(to);
    };
    seq.addEventListener('pointerup', drop); seq.addEventListener('pointercancel', drop);
    const render = () => {
      seq.replaceChildren(); pool.replaceChildren();
      picked.forEach((j, k) => {
        const li = h('li', 'order-step'); li.dataset.opt = j;
        const grip = h('button', 'order-grip'); grip.type = 'button'; grip.title = '拖曳調整順序（或按 ↑↓）';
        grip.setAttribute('aria-label', `調整「${item.options[j]}」的順序`); grip.append(Icons.el('grip-vertical'));
        grip.addEventListener('pointerdown', (e) => { e.preventDefault(); drag = li; li.classList.add('dragging'); seq.setPointerCapture(e.pointerId); });
        grip.addEventListener('keydown', (e) => {
          if (e.key === 'ArrowUp' || e.key === 'ArrowDown') { e.preventDefault(); move(k, k + (e.key === 'ArrowUp' ? -1 : 1)); }
        });
        const locked = given.includes(j);
        const text = h('button', 'order-text', item.options[j]); text.type = 'button'; text.title = locked ? '從前面的文件帶進來的' : '退回下面';
        if (locked) { text.disabled = true; li.classList.add('given'); }
        else text.addEventListener('click', () => { picked.splice(k, 1); commit(); });
        li.append(grip, h('span', 'order-no', `${k + 1}.`), text); seq.append(li);
      });
      order.forEach((j) => {
        const opt = item.options[j];
        if (picked.includes(j) || hidden.includes(j)) return;
        const b = h('button', 'btn small', opt); b.type = 'button';
        b.addEventListener('click', () => { picked.push(j); commit(); });
        pool.append(b);
      });
      if (picked.some(j => !given.includes(j))) {
        const reset = h('button', 'btn small ghost', '重排'); reset.type = 'button';
        reset.addEventListener('click', () => { picked.splice(0, picked.length, ...picked.filter(j => given.includes(j))); commit(); }); pool.append(reset);
      }
    };
    render();
    box.append(h('p', 'muted small', '照順序點。排好的步驟點一下會退回下面，拖左邊的握把可以調順序。'), seq, pool);
    return box;
  }

  function deviceForm(engine, card, work, q, wrap, close) {
    const opts = Works.deviceTestOptions(engine.devices);
    for (const o of opts) {
      const b = h('button', 'btn block', `${o.label}（約 ${o.minutes} 分鐘）${o.disabled ? `　— ${o.reason}` : ''}`);
      b.disabled = o.disabled;
      b.addEventListener('click', () => {
        engine.doWork(card.id, work, [o.id]);
        wrap.replaceChildren(h('p', '', o.id === 'real' ? '手機和平板都開過了，清單看得到，欄位會擠但看得清楚。' : '用 PC 模擬過了。看起來沒問題。看起來。'), closeBtn(close));
      });
      wrap.append(b);
    }
    return wrap;
  }

  // 退回 SA：自己開的卡只有一個理由；怡君開的卡照分類勾哪裡不清楚（不計分，勾對的她去問、勾錯的她說不合理）
  function rejectForm(engine, card, wrap, close) {
    const self = !!engine.selfOpened(card);
    const groups = self ? [] : (card.saChecks || []);
    const checked = groups.map(() => []);
    const foot = h('div', 'quiz-foot');
    const go = h('button', 'btn danger', '退回 SA');
    if (self) wrap.append(h('p', 'quiz-intro', '這張是你自己開的。'), h('p', '', `「${C.SELF_TO_SA}」`));
    else if (!groups.length) wrap.append(h('p', 'quiz-intro', '卡上看不出哪裡不清楚。真的要退，怡君會原封不動丟回來。'));
    else {
      wrap.append(h('p', 'quiz-intro', '我覺得有些地方不清楚：'));
      go.disabled = true;
      groups.forEach((g, gi) => {
        const fs = h('fieldset', 'item'); fs.append(h('legend', '', g.title));
        Works.displayOrder(g.options.length, `${engine.shuffleSeed}:${card.id}:reject:${gi}`).forEach((oi) => {
          const o = g.options[oi];
          const label = h('label', 'opt'); const input = h('input'); input.type = 'checkbox';
          input.addEventListener('change', () => {
            checked[gi] = input.checked ? [...checked[gi], oi] : checked[gi].filter(x => x !== oi);
            go.disabled = !checked.some(c => c.length);
          });
          label.append(input, h('span', '', o.text)); fs.append(label);
        });
        wrap.append(fs);
      });
    }
    go.addEventListener('click', () => {
      engine.rejectToSA(card.id, checked);
      wrap.replaceChildren(h('p', '', self ? '交給怡君了，她分析完會把卡還你。' : '退回去了。怡君看完會回你。'), closeBtn(close));
    });
    foot.append(go); wrap.append(foot);
    return wrap;
  }

  // 做完就做完，對不對這裡不講：寫錯的東西會在 QC 退件、bug 冒出來的時候自己找上門
  function resultNode(q, result) {
    const box = h('div', 'quiz-result');
    box.append(h('p', '', '做完了，記在卡上。'));
    if (result.minutes) box.append(h('p', 'muted', `花了 ${result.minutes} 分鐘。`));
    return box;
  }

  function closeBtn(close) { const b = h('button', 'btn', '關閉'); b.addEventListener('click', close); const f = h('div', 'quiz-foot'); f.append(b); return f; }

  // 在 LINE／信箱裡回一則訊息：小視窗、一題、回了就記在那則訊息上
  function openReply(desk, engine, doc) {
    const id = `reply:${doc.id}`; const q = doc.reply;
    const wrap = h('div', 'quiz reply-form'); wrap.append(h('p', 'quiz-intro', Works.intro('reply', q)));
    const answers = q.items.map(() => undefined);
    q.items.forEach((item, i) => wrap.append(itemNode(item, i, answers, 'reply', null, `${engine.shuffleSeed}:reply:${doc.id}`)));
    const send = h('button', 'btn primary', '送出'); send.disabled = true;
    const foot = h('div', 'quiz-foot'); foot.append(send); wrap.append(foot);
    wrap.addEventListener('change', () => { send.disabled = !Works.replyAnswered(q, answers); });
    send.addEventListener('click', () => {
      if (!engine.replyTo(doc.id, answers)) return;
      desk.wm.close(id); desk.refreshDocs();
    });
    desk.wm.open({ id, title: `回訊息 — ${doc.group || doc.from}`, icon: doc.origin === 'line' ? 'message-circle' : 'mail', x: 260, y: 120, w: 440, h: 300, cls: 'win-work', content: wrap });
  }

  root.Quiz = { open, openReply };
})(window);
