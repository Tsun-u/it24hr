// tests/day2.test.js（node --test）：第二天 hybrid
const test = require('node:test'); const assert = require('node:assert');
const { C } = require('../contract.js');
const { Engine } = require('../engine.js');
const Works = require('../works.js');
const DAY2 = require('../day2.js');

test('劇本裡排序題的先後（開發計畫的 before、部署從 roles 推的）：只列正解有的步驟，劇本寫的正解順序拿滿分', () => {
  const plans = [], deploys = []; const seen = new Set();
  const walk = (o) => {
    if (!o || typeof o !== 'object' || seen.has(o)) return; seen.add(o);
    if (o.type === 'order' && o.before) plans.push({ item: o, before: o.before, question: { items: [o] } });
    if (o.roles && o.items) deploys.push({ item: o.items[0], before: Works.deployBefore(o.roles), question: o });
    Object.values(o).forEach(walk);
  };
  walk(require('../day1.js')); walk(DAY2.make());
  assert.ok(plans.length >= 2, '第一天、第二天的開發計畫都有 before');
  assert.ok(deploys.length >= 7, '兩天的部署題都有 roles');
  for (const { item, before, question } of [...plans, ...deploys]) {
    for (const step of before.flat()) assert.ok(item.answer.includes(step), `${item.options[step]} 不在正解裡`);
    assert.strictEqual(Works.grade(question, [item.answer]).score, 1, item.options.join('／'));
  }
});

test('劇本的 AI 筆記：每個 tags 和補充說明用到的主題，都在 ai.topics 寫了 AI 的口吻', () => {
  const script = DAY2.make(); const topics = script.ai.topics; const seen = new Set(); const used = [];
  const walk = (o) => {
    if (!o || typeof o !== 'object' || seen.has(o)) return; seen.add(o);
    if (o.tags) for (const tag of Object.values(o.tags).flat()) { const [t, ss] = tag.split(':'); for (const s of ss.split(',')) used.push([t, s]); }
    if (Array.isArray(o.fixes)) for (const f of o.fixes) if (f !== 'auto') for (const [t, s] of Object.entries(f.set || {})) used.push([t, s]);
    Object.values(o).forEach(walk);
  };
  walk(script.cards); walk(script.sources);
  assert.ok(used.length > 10);
  for (const [t, s] of used) assert.ok(topics[t] && topics[t][s], `${t}:${s} 沒寫 AI 會怎麼記`);
});

test('矯枉過正的 AI 會問的選項（標了有 ask 做法的主題）都寫了問句，寫了問句的選項都標了那個主題', () => {
  const script = DAY2.make(); const asking = Object.keys(script.ai.topics).filter(t => script.ai.topics[t].ask); const seen = new Set(); let n = 0;
  const walk = (o) => {
    if (!o || typeof o !== 'object' || seen.has(o)) return; seen.add(o);
    if (o.tags && o.options) for (const [opt, tags] of Object.entries(o.tags)) {
      const asks = [].concat(tags).some(tag => asking.includes(tag.split(':')[0]));
      assert.strictEqual(!!(o.askFirst && o.askFirst[opt]), asks, `「${o.options[opt]}」${asks ? '沒寫問句' : '寫了問句但沒標會問的主題'}`);
      if (asks) n++;
    }
    Object.values(o).forEach(walk);
  };
  walk(script.cards); walk(script.sources);
  assert.ok(asking.length && n >= 6);
});

test('照提示走完第二天：交給 AI 兩次、主線交 QC、不是 bad end', () => {
  const e = new Engine(DAY2.make());
  const r = e.autoplay('follow_hints');
  assert.strictEqual(r.badEnd, false, r.reason);
  assert.ok(['to_qc', 'archived'].includes(e.board.get('asset_platform').status), e.board.get('asset_platform').status);
  assert.ok(e.ai.stats.delegated >= 2); assert.strictEqual(e.ai.stats.reviewed, 2);
});

test('第二天差不多五張卡：主線＋四個來源都開得成卡，照正解做完 QC 會結案', () => {
  const carded = DAY2.make().sources.filter(s => s.sentences && s.sentences.length);
  assert.strictEqual(1 + carded.length, 5);
  for (const src of carded) {
    const e = new Engine(DAY2.make()); e.tick(C.MS_PER_GAME_MIN * (src.at + 1));
    if (src.kind === 'boss') e.talkTo(src.id);
    const keep = src.sentences.map((s, i) => (s.keep ? i : -1)).filter(i => i >= 0);
    const card = e.openCardFrom(src.id, { type: src.relatedTo ? 'addon' : 'feature', parent: src.relatedTo || null, module: src.module, assignee: 'me', sentences: keep, attach: true });
    assert.ok(card, src.id);
    for (const s of card.subtasks) {
      const q = s.question;
      e.doWork(card.id, s.work, q.kind === 'manual' ? [{ target: 'tablet' }]
        : q.kind === 'functions' ? q.functions.map(f => Object.fromEntries(Object.entries(f.fields || {}).map(([k, v]) => [k, v.answer])))
        : q.kind === 'discuss' ? { circled: Object.keys(q.asks).map(Number), asks: Object.fromEntries(Object.keys(q.asks).map(i => [i, [].concat(q.asks[i]).map(a => a.answer)])) }
        : q.items.map(i => i.answer));
    }
    e.submit(card.id); e.tick(C.MS_PER_GAME_MIN * (C.QC_TURNAROUND_MIN + 1));
    assert.strictEqual(card.status, 'archived', `${src.id}：${(card.comments.at(-1) || {}).text}`);
  }
});

test('三張小卡的 AI 典型錯：部門寫死、資料轉換前不備份、jQuery 直接升最新版', () => {
  const src = (id) => DAY2.make().sources.find(s => s.id === id);
  const fn = (s, name) => s.subtasks.find(x => x.work === 'code').question.functions.find(f => f.name === name);
  assert.ok(fn(src('dept_select'), 'deptSelect').judgment); assert.match(src('dept_select').aiTrace.text, /寫死/);
  const deploy = src('dept_select').subtasks.find(x => x.work === 'deploy').question.items[0];
  assert.ok(!deploy.ai.pick.includes(0), 'AI 部署漏了備份');
  assert.ok(fn(src('sec_jquery'), 'upgradeJquery').judgment); assert.match(src('sec_jquery').aiTrace.text, /最新版/);
  assert.strictEqual(src('boss_audit').relatedTo, 'asset_platform', '老闆講的是平台的追加需求');
});

test('劇本裡的 {玩家名稱} 換成玩家取的名字；開場會議沒舉手，老闆點名', () => {
  const e = new Engine(DAY2.make(), { name: '小明', title: '軟體工程師' }); const said = [];
  e.on('meeting:silent', (s) => said.push(s.text));
  e.tick(C.MS_PER_GAME_MIN * 30);
  assert.strictEqual(said[0], '老闆看了你一眼。「那我們就交給原廠維護，小明，就你了。」');
  assert.ok(!JSON.stringify(e.script.meetings).includes('{玩家名稱}'));
});

test('會議舉手後的三條退路寫在劇本裡（放下手、伸展、去廁所），兩場會議都有', () => {
  for (const m of [DAY2.make().meetings[0], DAY2.day3stub.meetings[0]]) {
    assert.deepStrictEqual(Object.keys(m.retreat), ['lower', 'stretch', 'leave']);
    assert.ok(m.retreat.lower.reactions.length && m.retreat.stretch.reactions.length);
    assert.match(m.retreat.leave.label, /廁所/);
  }
});

test('整天不理主線卡 → bad end，隔天 06:00 才判（非 IT 的玩家 18:00 幾乎一定 bad end）', () => {
  assert.strictEqual(DAY2.make().badEnd[0].at, 21 * 60);
  const r = new Engine(DAY2.make()).autoplay('ignore_all');
  assert.strictEqual(r.badEnd, true); assert.match(r.reason, /^06:00 了。.*一台一台/);
});

test('每道題的答案、AI 錯的時候選的，都落在選項範圍內', () => {
  const script = DAY2.make();
  const inRange = (v, n, where) => [].concat(v).forEach(i => assert.ok(i >= 0 && i < n, where));
  for (const card of [...script.cards, ...script.sources]) for (const s of card.subtasks || []) {
    const q = s.question;
    for (const it of (q.items || []).filter(x => !x.free)) { inRange(it.answer, it.options.length, `${card.id}/${s.work}`); if (it.ai) inRange(it.ai.pick, it.options.length, `${card.id}/${s.work} ai`); }   // 估時沒有對錯，不檢查
    for (const f of q.functions || []) for (const [k, fd] of Object.entries(f.fields || {})) {
      inRange(fd.answer, fd.options.length, `${card.id}/${f.name}.${k}`); if (fd.ai) inRange(fd.ai.pick, fd.options.length, `${card.id}/${f.name}.${k} ai`);
    }
  }
});

test('延續第一天：昨天規格寫了編號規則，今天那個 function 直接拉進來；沒寫就要自己填', () => {
  const fnsOf = (script) => script.cards[0].subtasks.find(s => s.work === 'code').question;
  const idx = (q) => q.functions.findIndex(f => f.name === 'serialFromYesterday');
  const withRule = fnsOf(DAY2.make({ picks: { doc_spec: [[0, 1, 2]] } }));
  assert.ok(!Works.functionsToFill(withRule, 'all', {}).includes(idx(withRule)));
  const without = fnsOf(DAY2.make({ picks: { doc_spec: [[0, 2]] } }));
  assert.ok(Works.functionsToFill(without, 'all', {}).includes(idx(without)));
});

test('同一家公司的隔天：議題編號接著昨天的往下發', () => {
  const e = new Engine(DAY2.make({ lastNo: 124 })); e.tick(C.MS_PER_GAME_MIN * 31);
  assert.strictEqual(e.board.get('asset_platform').no, 125);
});

test('怡君的卡帶著那句錯的 AI 主張；財務那封轉給 SA，卡上是它自己的 AI 痕跡', () => {
  const e = new Engine(DAY2.make()); e.tick(C.MS_PER_GAME_MIN * 121);
  assert.ok(e.board.get('asset_platform').body.includes(DAY2.AI_CLAIM));
  e.openCardFrom('finance_csv', { assignee: 'sa' }); e.tick(C.MS_PER_GAME_MIN * (C.SA_TURNAROUND_MIN + 1));
  assert.match(e.board.get('finance_csv:sa').body, /檔名改英文/);
});

test('結算卡的 AI 段：交給它幾次、沒看就收下幾次、AI 的主張怎麼判斷、有沒有照做', () => {
  const e = new Engine(DAY2.make()); const r = e.autoplay('follow_hints');
  assert.ok(r.report.lines.includes('交給 AI：2 次')); assert.ok(r.report.lines.includes('沒看就收下：0 次'));
  assert.ok(r.report.lines.some(l => /^AI 說「權限在前端.*」：沒查證，沒照做$/.test(l)), r.report.lines.join('\n'));
  const e2 = new Engine(DAY2.make()); e2.tick(C.MS_PER_GAME_MIN * 31);
  e2.delegate('asset_platform', 'code'); e2.checkClaim('asset_platform', 'guardApi', 'test'); e2.tick(C.MS_PER_GAME_MIN * 30);
  e2.acceptAi('asset_platform', 'code');
  const lines = e2.report().lines;
  assert.ok(lines.includes('沒看就收下：1 次')); assert.ok(lines.some(l => /自己驗了，照做了/.test(l)), '驗了還照收，結算卡照實寫');
});

test('整理需求、開發都自己做（不交給 AI）：提示不會卡住，一路接到下一步', () => {
  const e = new Engine(DAY2.make()); const step = (n) => { for (let i = 0; i < n; i++) { if (e.hint) e.dismissHint(); e.tick(C.MS_PER_GAME_MIN); } };
  step(31); assert.match(e.hint.text, /交給 AI 試試/);
  const card = e.board.get('asset_platform');
  e.doWork('asset_platform', 'read_req', e.subtask(card, 'read_req').question.items.map(i => i.answer));
  assert.match(e.hint.text, /需求討論自己來/);
  for (const w of ['discuss', 'estimate', 'doc_plan', 'doc_spec', 'ui_design', 'doc_accept', 'test']) e.follow(e.hint);
  assert.match(e.hint.text, /開發交給 AI/);
  e.doWork('asset_platform', 'code', e.subtask(card, 'code').question.functions.map(f => Object.fromEntries(Object.entries(f.fields).map(([k, v]) => [k, v.answer]))));
  assert.match(e.hint.text, /手動測試/);
});

test('轉給 SA 的卡，通知找的是原本提需求的人', () => {
  const e = new Engine(DAY2.make()); e.tick(C.MS_PER_GAME_MIN * 121);
  e.openCardFrom('finance_csv', { assignee: 'sa' }); e.tick(C.MS_PER_GAME_MIN * (C.SA_TURNAROUND_MIN + 1));
  assert.strictEqual(e.board.get('finance_csv:sa').requester, '財務 美玲');
});

test('SA 開的卡，通知與追問找的是需求單位（阿賢），不是怡君', () => {
  const e = new Engine(DAY2.make());
  e.autoplay('follow_hints');
  const sent = e.docs.find(d => d.id === 'asset_platform:notified');
  assert.ok(sent, '有通知'); assert.strictEqual(sent.from, '資產室 阿賢');
});

test('18:30 還在辦公室，人資張姐寄加班提醒；先下班就不會收到；21:00 照樣被警衛趕回家', () => {
  const evening = (leaveAt) => {
    const s = DAY2.make(); s.hints = []; s.meetings = [];
    const e = new Engine(s); let menuAt = null; e.on('home:menu', () => { menuAt ??= e.clock.minute; });
    if (leaveAt) { e.tick(C.MS_PER_GAME_MIN * leaveAt); e.leave(); }
    e.tick(C.MS_PER_GAME_MIN * 721);
    return { e, menuAt };
  };
  const stay = evening(0), mail = stay.e.docs.find(d => d.id === 'hr_overtime');
  assert.strictEqual(mail.from, '人資助理 張姐'); assert.strictEqual(mail.title, '請注意本月份加班時數'); assert.match(mail.text, /46小時/);
  assert.strictEqual(stay.menuAt, C.DAY_START_MIN + 720, '21:00 警衛照樣趕人');
  assert.ok(!evening(540).e.docs.some(d => d.id === 'hr_overtime'), '18:00 就走的不會收到');
});
