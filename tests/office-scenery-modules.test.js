// tests/office-scenery-modules.test.js（node --test）：收購以外的模組卡——會議那頁、照正解做得完、三種答法
const test = require('node:test');
const assert = require('node:assert');
const { C, Sandbox, XIUQIN, play, at, tickTo, right, meetAll, skipMeeting, shipped, codeWith, lime } = require('./scenery-helpers.js');
const sub = (e, id, work) => e.board.get(id).subtasks.find(s => s.work === work).question;
const swapped = (q, i, v) => { const a = right(q); a[i] = v; return a; };
const opened = (carry) => { const e = play('legacy', carry); skipMeeting(e); return e; };

test('#402 加工估量與報價：投影幕那頁問原話第 2、3、4 句（段 1、2、3，第 4 句一段兩題）；卡上的需求討論是同一題、唯讀', () => {
  const e = play(); tickTo(e, at(9, 31));
  const page = e.meeting.spec.pages.find(p => p.id === 'yield');
  assert.deepStrictEqual(Object.keys(page.question.asks).map(Number), [1, 2, 3]);
  assert.strictEqual(page.question.asks[3].length, 2);
  skipMeeting(e);
  const y = e.board.get('yield');
  assert.strictEqual(y.no, 402); assert.strictEqual(y.parent, 'erp'); assert.strictEqual(y.requester, XIUQIN);
  assert.strictEqual(sub(e, 'yield', 'discuss').fromMeeting, 'yield');
});
test('#402 照正解做完、交 QC 結案', () => {
  const e = meetAll(play());
  assert.strictEqual(shipped(e, 'yield').status, 'archived');
});
test('#402 估出貨量讓業務自己填：QC 驗不出來（late），上線後少交 120 公斤', () => {
  const e = opened();
  assert.strictEqual(shipped(e, 'yield', { ui_design: swapped(sub(e, 'yield', 'ui_design'), 2, 1) }).status, 'archived');
  assert.strictEqual(e.usageTally().kg.short, 120);
});
test('#402 程式把多的「沒地方記」：上線後去向沒記的 40 公斤', () => {
  const e = opened();
  shipped(e, 'yield', { code: codeWith(e, 'yield', { surplus: 3 }) });
  assert.strictEqual(e.usageTally().kg.untracked, 40);
});
test('#402 得率寫「看師傅」也收：QC 退件', () => {
  const e = opened();
  const y = shipped(e, 'yield', { ui_design: swapped(sub(e, 'yield', 'ui_design'), 1, 2) });
  assert.match(y.comments.at(-1).text, /得率寫『看師傅』也送得出去/);
});
test('#402 處理方式只列當季建議（前端設計也會卡住）：通知後秀琴姐催', () => {
  const e = opened();
  shipped(e, 'yield', { ui_design: swapped(sub(e, 'yield', 'ui_design'), 0, 1) }); e.notifyDone('yield');
  tickTo(e, e.clock.minute + 16);
  assert.ok(lime(e, XIUQIN).includes('客戶就是要整尾的，你不給我選？'));
});

test('#403 加班請假：投影幕那頁三句都有題（秀琴姐轉述雄哥，問的也是她）；照正解做完、交 QC 結案', () => {
  const e = play(); tickTo(e, at(9, 31));
  const asks = e.meeting.spec.pages.find(p => p.id === 'shift').question.asks;
  assert.deepStrictEqual(Object.keys(asks).map(Number), [0, 1, 2]);
  assert.ok(Object.values(asks).every(a => a.text.startsWith('秀琴姐：')));
  skipMeeting(e);
  assert.strictEqual(e.board.get('shift').no, 403);
  assert.strictEqual(shipped(e, 'shift').status, 'archived');
});
test('#403 會議問到的帶進開發計畫（加班登記、請假登記、登記就存、補單）；沒問到的退回 SA 勾對也帶', () => {
  const plan = (card) => card.subtasks.find(s => s.work === 'doc_plan').question.items[0];
  const Works = require('../works.js');
  const given = (card) => Works.givenOptions(plan(card), card.picks, (w) => card.done(w)).filter(o => [1, 2, 3, 4].includes(o)).sort();
  let e = meetAll(play());
  assert.deepStrictEqual(given(e.board.get('shift')), [1, 2, 3, 4]);
  e = opened(); const card = e.board.get('shift');
  assert.deepStrictEqual(given(card), []);
  e.rejectToSA('shift', [[0, 1, 2]]);
  tickTo(e, e.clock.minute + C.SA_RECHECK_MIN + 1);
  assert.deepStrictEqual(given(card), [1, 2, 3, 4]);
});
test('#403 請假做成上午／下午／全天的下拉：QC 不退，員工惱怒「我只請 3 小時，要選上午還是下午？」', () => {
  const e = opened();
  const card = shipped(e, 'shift', { ui_design: swapped(sub(e, 'shift', 'ui_design'), 1, 3) });
  assert.strictEqual(card.status, 'archived');
  assert.ok(e.cardOutcomes(card).some(o => o.kind === 'annoy' && o.say === '我只請 3 小時，要選上午還是下午？'));
});
test('#403 程式寫成副組長代簽才算數：流程卡住，秀琴姐催「副組長也在碼頭跑啊」', () => {
  const e = opened();
  shipped(e, 'shift', { code: codeWith(e, 'shift', { leaderAway: 1 }) }); e.notifyDone('shift');
  tickTo(e, e.clock.minute + 16);
  assert.ok(lime(e, XIUQIN).includes('副組長也在碼頭跑啊'));
});
test('#403 加班時數寫「看漁獲」也收：QC 退件', () => {
  const e = opened();
  assert.match(shipped(e, 'shift', { ui_design: swapped(sub(e, 'shift', 'ui_design'), 0, 2) }).comments.at(-1).text, /看漁獲/);
});
// ── 模組池：#404、#405 從批號追溯、冷凍庫庫存、物流理賠三張抽兩張 ──
test('模組池三抽二：legacy、hybrid 隨機抽兩張不重複；speedrun 一張固定批號追溯', () => {
  const orig = Math.random; const pools = (mode, r) => { Math.random = () => r; return Sandbox.make('scenery', mode).meetings[1].cards.map(c => c.id).filter(id => ['trace', 'stock', 'claim'].includes(id)); };
  const seen = new Set();
  try {
    for (const r of [0, 0.4, 0.8]) for (const mode of ['legacy', 'hybrid']) { const two = pools(mode, r); assert.strictEqual(new Set(two).size, 2); seen.add(two.join()); }
    assert.deepStrictEqual(pools('speedrun', 0), ['trace', 'stock']);
    assert.deepStrictEqual(pools('speedrun', 0.9), ['trace', 'claim']);
  } finally { Math.random = orig; }
  assert.ok(seen.size >= 2, '不同的亂數抽得到不同的兩張');
});
test('drawPool：指定就照指定；speedrun 不管亂數都有批號追溯；抽出來照池子的順序排', () => {
  const { drawPool } = Sandbox.make('scenery', 'legacy', { pool: ['stock', 'trace'] });
  assert.deepStrictEqual(drawPool('legacy', { pool: ['stock', 'trace'] }), ['trace', 'stock']);
  const orig = Math.random;
  try { Math.random = () => 0.99; assert.deepStrictEqual(drawPool('speedrun', {}), ['trace', 'claim']); } finally { Math.random = orig; }
});

test('#404 批號追溯：照正解做完結案；部位用文字框 QC 退；黑鮪魚論公斤收是 late、照樣結案；程式只能往下查會卡住', () => {
  let e = meetAll(play());
  assert.strictEqual(e.board.get('trace').no, 404);
  assert.strictEqual(shipped(e, 'trace').status, 'archived');
  e = opened();
  assert.match(shipped(e, 'trace', { ui_design: swapped(sub(e, 'trace', 'ui_design'), 1, 1) }).comments.at(-1).text, /肚仔/);
  e = opened();
  shipped(e, 'trace', { ui_design: swapped(sub(e, 'trace', 'ui_design'), 3, 1) });
  assert.deepStrictEqual(e.usageTally().late, ['漁業署來查，這尾的標籤號對不到哪張單']);
  e = opened();
  shipped(e, 'trace', { code: codeWith(e, 'trace', { traceBack: 1 }) }); e.notifyDone('trace');
  tickTo(e, e.clock.minute + 16);
  assert.ok(lime(e, XIUQIN).includes('客人拿著罐頭來問，我要從哪一批原料開始翻？'));
});
test('#404 會議問到配方的比例：開發計畫帶入「配方」；沒問到的退回 SA 勾對也帶', () => {
  const plan = (card) => card.subtasks.find(s => s.work === 'doc_plan').question.items[0];
  const Works = require('../works.js');
  let e = meetAll(play()); let card = e.board.get('trace');
  assert.ok(Works.givenOptions(plan(card), card.picks, (w) => card.done(w)).includes(3));
  e = opened(); card = e.board.get('trace');
  assert.ok(!Works.givenOptions(plan(card), card.picks, (w) => card.done(w)).includes(3));
  e.rejectToSA('trace', [[0]]);
  tickTo(e, e.clock.minute + C.SA_RECHECK_MIN + 1);
  assert.ok(Works.givenOptions(plan(card), card.picks, (w) => card.done(w)).includes(3));
});

test('#405 冷凍庫庫存：照正解結案；程式只記數量不記入庫日（late）上線後 50 公斤變寵物零食；休漁沒提醒會卡住', () => {
  let e = meetAll(play());
  assert.strictEqual(e.board.get('stock').no, 405);
  assert.strictEqual(shipped(e, 'stock').status, 'archived');
  e = opened();
  shipped(e, 'stock', { code: codeWith(e, 'stock', { ageAlert: 1, stockDays: 1 }) }); e.notifyDone('stock');
  assert.strictEqual(e.usageTally().kg.petFood, 50);
  tickTo(e, e.clock.minute + 16);
  assert.ok(lime(e, XIUQIN).includes('六月一到才發現鯖魚只剩三箱，客人的單都接了'));
});
test('#405 冷凍庫：會議頁是雄哥講的；入庫日用文字框 QC 退「上禮拜」', () => {
  const e = play(); tickTo(e, at(9, 31));
  const page = e.meeting.spec.pages.find(p => p.id === 'stock');
  assert.strictEqual(page.who, '源裕 組長 雄哥');
  assert.deepStrictEqual(Object.keys(page.question.asks).map(Number), [0, 1]);
  skipMeeting(e);
  assert.match(shipped(e, 'stock', { ui_design: swapped(sub(e, 'stock', 'ui_design'), 1, 1) }).comments.at(-1).text, /上禮拜/);
});

test('物流理賠：照正解結案；程式寫成理賠核准才能退款會卡住', () => {
  let e = meetAll(play('legacy', { pool: ['stock', 'claim'] }));
  assert.strictEqual(e.board.get('claim').no, 405);
  assert.strictEqual(shipped(e, 'claim').status, 'archived');
  e = opened({ pool: ['stock', 'claim'] });
  shipped(e, 'claim', { code: codeWith(e, 'claim', { refund: 1 }) }); e.notifyDone('claim');
  tickTo(e, e.clock.minute + 16);
  assert.ok(lime(e, XIUQIN).includes('客人等了兩個禮拜，說以後不跟我們買了'));
});
test('物流理賠：會議那頁只有原話、沒有題庫，也沒有退回 SA 的勾選', () => {
  const e = play('legacy', { pool: ['stock', 'claim'] }); tickTo(e, at(9, 31));
  assert.deepStrictEqual(e.meeting.spec.pages.find(p => p.id === 'claim').question.asks, {});
  skipMeeting(e);
  assert.ok(!e.board.get('claim').saChecks);
});
test('#404、#405 是抽到的那兩張，沒抽到的不出現', () => {
  for (const pool of [['trace', 'stock'], ['trace', 'claim'], ['stock', 'claim']]) {
    const e = opened({ pool });
    assert.deepStrictEqual(pool.map(id => e.board.get(id).no), [404, 405]);
    for (const other of ['trace', 'stock', 'claim'].filter(x => !pool.includes(x))) assert.ok(!e.board.get(other));
  }
});

// ── 14:00 秀琴姐追加 ──
test('14:00 秀琴姐追加：戴手套不能打字，加一句人情味例外；回了她接話；不能開卡', () => {
  const e = opened({ pool: ['trace', 'stock'], exception: 1 });
  tickTo(e, at(13, 59)); assert.ok(!e.docs.some(x => x.id === 'xiuqin_gloves'));
  tickTo(e, at(14, 1));
  const d = e.docs.find(x => x.id === 'xiuqin_gloves');
  assert.strictEqual(d.arrivedAt, at(14, 0));
  assert.match(d.text, /雄哥他們戴手套不能打字，可以不要讓他們打字嗎？/);
  assert.match(d.text, /阿伯的魚都是一簍一簍算的/);
  assert.deepStrictEqual(d.sentences, []);
  assert.strictEqual(e.openCardFrom('xiuqin_gloves', { assignee: 'sa' }), null);
  e.replyTo('xiuqin_gloves', [0]); tickTo(e, e.clock.minute + 3);
  assert.ok(lime(e, XIUQIN).includes('讚啦，雄哥會很高興。'));
});
test('會議開到 14:00 被怡君收尾、卡還沒開：追加不比卡先到，等 #400 開了 30 分鐘才來', () => {
  const e = play('legacy', { pool: ['trace', 'stock'], exception: 0 });
  tickTo(e, at(14, 1));
  assert.strictEqual(e.meeting, null, '14:00 怡君收尾散會');
  assert.ok(!e.docs.some(x => x.id === 'xiuqin_gloves'), '卡還沒開，追加先不來');
  tickTo(e, at(14, 11));
  const cardsAt = e.board.get('erp').arrivedAt;
  tickTo(e, cardsAt + 29); assert.ok(!e.docs.some(x => x.id === 'xiuqin_gloves'));
  tickTo(e, cardsAt + 31);
  const d = e.docs.find(x => x.id === 'xiuqin_gloves');
  assert.strictEqual(d.arrivedAt, cardsAt + 30);
  assert.match(d.text, /熟客的價錢照舊啦/);
});

test('子議題全部結案，母議題才跟著結案', () => {
  const e = opened();
  const children = e.board.cards.filter(c => c.parent === 'erp').map(c => c.id);
  for (const id of children.slice(0, -1)) shipped(e, id);
  assert.notStrictEqual(e.board.get('erp').status, 'archived');
  shipped(e, children.at(-1));
  assert.strictEqual(e.board.get('erp').status, 'archived');
});

// ── 三個時代：AI 怎麼錯、現場與行情 ──
const Works = require('../works.js');
const buyUi = (mode) => Sandbox.make('scenery', mode, { pool: ['trace', 'stock'] }).meetings[1].cards.find(c => c.id === 'buy').subtasks.find(s => s.work === 'ui_design').question;
test('legacy 沒有 AI；hybrid、speedrun 照正確率骰，骰錯時 hybrid 錯成自由填（什麼都收）、speedrun 錯成紅字', () => {
  assert.strictEqual(buyUi('legacy').items[0].ai, undefined);
  assert.strictEqual(Works.aiAnswers(buyUi('hybrid'), { accuracy: 0, seed: 's' }).answers[0], 2);
  assert.strictEqual(Works.aiAnswers(buyUi('hybrid'), { accuracy: 1, seed: 's' }).answers[0], 0);
  assert.strictEqual(Works.aiAnswers(buyUi('speedrun'), { accuracy: 0, seed: 's' }).answers[0], 1);
  assert.deepStrictEqual(Works.aiAnswers(buyUi('speedrun'), { accuracy: 0, seed: 's' }).answers[4], [3], '多選題（規格）也錯成一個文字框');
  assert.strictEqual(Works.aiAnswers(buyUi('speedrun'), { accuracy: 1, seed: 's' }).answers[0], 0, '骰對就是正解');
});
test('母議題內文寫出這個時代的現場和行情', () => {
  const body = (mode) => Sandbox.make('scenery', mode, { pool: ['trace', 'stock'] }).meetings[1].cards.find(c => c.id === 'erp').body;
  assert.match(body('legacy'), /磅秤旁一台共用電腦/); assert.match(body('hybrid'), /下載行情表匯入/); assert.match(body('speedrun'), /戴手套點大按鈕/);
});
test('交給 AI 寫前端設計（speedrun、Essay）：單選的欄位不是正解就是這個時代的錯法', () => {
  const e = play('speedrun'); skipMeeting(e);
  const job = e.delegate('buy', 'ui_design', 'Essay');
  tickTo(e, job.doneAt + 1);
  const q = sub(e, 'buy', 'ui_design');
  const fields = q.items.map((it, i) => [it, i]).filter(([it]) => it.role === 'field' && it.ai && !Array.isArray(it.answer));
  assert.ok(fields.length > 0);
  for (const [it, i] of fields) assert.ok([it.answer, it.ai.pick].includes(job.answers[i]), it.field);
});

// 文件往後流（開發計畫 ← 整理需求、需求討論；開發規格 ← 整理需求、需求討論、開發計畫）
const READ_REQ_PLAN = { buy: [1, 3, 5], yield: [2, 3, 4], shift: [1, 2, 3], trace: [1, 2, 4], stock: [0, 2, 3], claim: [1, 2, 3] };
// 會議什麼都沒問，只靠整理需求和開發計畫：規格裡被帶入、鎖住的題
const SPEC_FROM_DOCS = { buy: [0, 1], yield: [1, 2, 4], shift: [0, 1], trace: [0], stock: [0, 1, 2], claim: [0, 1] };
for (const [id, steps] of Object.entries(READ_REQ_PLAN)) {
  test(`文件往後流 ${id}：整理需求答對帶進開發計畫，計畫排了的步驟帶進規格（單選題選好鎖住）`, () => {
    const e = opened(id === 'claim' ? { pool: ['claim', 'stock'] } : undefined); const card = e.board.get(id);
    const q = (w) => card.subtasks.find(s => s.work === w).question;
    const done = (w) => card.done(w);
    e.doWork(id, 'read_req', right(q('read_req')));
    const plan = q('doc_plan').items[0];
    assert.deepStrictEqual(Works.givenOptions(plan, card.picks, done).filter(o => steps.includes(o)).sort(), steps);
    e.doWork(id, 'doc_plan', right(q('doc_plan')));
    const locked = q('doc_spec').items.map((item, i) => (Works.givenOptions(item, card.picks, done).includes(0) ? i : -1)).filter(i => i >= 0);
    assert.deepStrictEqual(locked, SPEC_FROM_DOCS[id]);
  });
}
test('文件往後流：整理需求答錯不帶，開發計畫沒做也不帶進規格', () => {
  const e = opened(); const card = e.board.get('shift');
  const q = (w) => card.subtasks.find(s => s.work === w).question;
  const wrong = right(q('read_req')).map(() => 1);
  e.doWork('shift', 'read_req', wrong);
  assert.deepStrictEqual(Works.givenOptions(q('doc_plan').items[0], card.picks, (w) => card.done(w)), []);
  assert.ok(q('doc_spec').items.every(item => !Works.givenOptions(item, card.picks, (w) => card.done(w)).length));
});
