// tests/office-scenery.test.js（node --test）：第二關「最美的風景」骨架與收購計價——登記、早會、廠商需求會議後開卡、照正解走完
const test = require('node:test');
const assert = require('node:assert');
const { C, Sandbox, XIUQIN, JIANHONG, play, at, tickTo, skipMeeting, lime } = require('./scenery-helpers.js');

test('登記成正式上班的一關：三個時代都有名字和說明，有 SA、有 QC，議題從 #400 起', () => {
  for (const mode of ['legacy', 'hybrid', 'speedrun']) {
    const s = Sandbox.make('scenery', mode, { pool: ['trace', 'stock'] });
    assert.strictEqual(s.kind, 'sandbox'); assert.strictEqual(s.level, 'scenery'); assert.strictEqual(s.name, '最美的風景');
    assert.ok(s.brief);
    assert.ok(!s.noSA && !s.noQC);
    assert.strictEqual(s.issueBase, 399);
    assert.deepStrictEqual(s.cards, [], '卡都是廠商需求會議散會後怡君開的');
    assert.strictEqual(!!s.ai, mode !== 'legacy');
  }
});

test('09:00 早會、09:30 廠商需求會議：怡君說「記下來了，IT 有細節想問嗎？」', () => {
  const e = play(); const titles = [];
  e.on('meeting:start', (m) => titles.push(m.title));
  tickTo(e, at(9, 31));
  assert.deepStrictEqual(titles, ['09:00 公司早會', '09:30 廠商需求會議']);
  assert.strictEqual(e.meeting.spec.kind, 'vendor');
  assert.deepStrictEqual(e.meeting.spec.intro.at(-1), { who: 'SA 怡君', text: '記下來了，IT 有細節想問嗎？' });
});

test('會議不走完不散會、不開卡（12:00 還在開）；走完散會 10 分鐘後怡君開 #400 母議題，LIME 說開給你了', () => {
  const e = play();
  tickTo(e, at(12, 0)); assert.strictEqual(e.meeting.spec.kind, 'vendor'); assert.ok(!e.board.get('erp'));
  while (e.vendorNext());
  tickTo(e, e.clock.minute + 9); assert.ok(!e.board.get('erp'));
  tickTo(e, e.clock.minute + 2);
  const erp = e.board.get('erp');
  assert.strictEqual(erp.no, 400); assert.strictEqual(erp.requester, JIANHONG); assert.strictEqual(erp.from, 'SA 怡君');
  assert.ok(lime(e, 'SA 怡君').some(t => t.includes('#400 源裕水產 ERP')));
});

test('會議開到 14:00 還沒散：怡君說大家都沒吃午餐、今天先到這，散會，成就「把客戶關在會議室」', () => {
  const e = play(); tickTo(e, at(9, 31));
  const c = e.meeting.spec.cutoff;
  assert.deepStrictEqual([c.at, c.who, c.text, c.trait.title], [300, 'SA 怡君', '因為大家都沒吃午餐，不如我們今天先到這，之後有需要再電話聯絡。', '把客戶關在會議室']);
  tickTo(e, at(14, 1)); assert.strictEqual(e.meeting, null);
  tickTo(e, at(14, 11)); assert.strictEqual(e.board.get('erp').no, 400);
});

test('母議題：只有估時（整套 ERP，現實參考 6 個月～1.5 年／4～8 個月），不交 QC', () => {
  const e = play(); skipMeeting(e);
  const erp = e.board.get('erp');
  assert.deepStrictEqual(erp.subtasks.map(s => s.work), ['estimate']);
  const item = erp.subtasks[0].question.items[0];
  assert.strictEqual(item.type, 'hours'); assert.ok(item.free);
  assert.deepStrictEqual([item.real.manual, item.real.ai], ['6 個月～1.5 年', '4～8 個月']);
  assert.ok(erp.noQC); assert.strictEqual(erp.closeWith, 'children');
  assert.strictEqual(e.reviewerOf(erp), null);
});

test('廠商需求會議最後怡君問時程：回答的直接填進 #400 的估時，卡上已完成', () => {
  const e = play(); tickTo(e, at(9, 31));
  const s = e.meeting.spec.schedule;
  assert.deepStrictEqual([s.card, s.who], ['erp', 'SA 怡君']);
  assert.match(s.text, /時程/);
  while (e.vendorStep().page) e.vendorNext();   // 模組都沒問，直接講到時程
  e.vendorEstimate(2000); e.vendorNext(); tickTo(e, e.clock.minute + 11);
  const erp = e.board.get('erp');
  assert.strictEqual(erp.no, 400); assert.ok(erp.done('estimate')); assert.strictEqual(erp.estimate, 2000);
  assert.strictEqual(e.doWork('erp', 'estimate', [8]), null);
});

test('時程在會議上說「回去估好再說」、之後也沒在卡上估：結算卡估時表還是列 #400，寫沒估、主管說那句', () => {
  const e = play(); tickTo(e, at(9, 31));
  while (e.vendorNext());   // 模組都沒問、時程也不回答
  tickTo(e, e.clock.minute + 11);
  const row = e.estimates().find(r => r.card === '#400 源裕水產 ERP');
  assert.deepStrictEqual([row.yours, row.missed, row.actual], ['沒估', true, '還沒完成']);
  assert.strictEqual(row.boss, '沒估時，要我怎麼排時程？通靈嗎？', '各關共用的主管那句，不寫哪個客戶');
  assert.deepStrictEqual(row.real, e.board.get('erp').subtasks[0].question.items[0].real);
  const Verdict = require('../verdict.js');
  const text = Verdict.report({ player: { name: '測試', title: '工程師' }, verdict: { kind: 'queue', evidence: [] }, handled: 0, works: [], estimates: [row], unlabeled: {} }).lines;
  assert.ok(text.some(l => l.startsWith('估時 #400 源裕水產 ERP：沒估，實際 還沒完成')));
});
test('估了的卡照舊：沒標 mustEstimate 的卡沒估就不列', () => {
  const e = play(); tickTo(e, at(9, 31)); while (e.vendorNext()); tickTo(e, e.clock.minute + 11);
  assert.ok(e.doWork('erp', 'estimate', [1200]));
  assert.strictEqual(e.estimates().find(r => r.card === '#400 源裕水產 ERP').yours, '1200 小時');
  assert.ok(!e.estimates().some(r => r.card.includes('收購計價')), '模組卡沒估、也沒標 mustEstimate');
});

const { right, meetAll, doAll, shipped } = require('./scenery-helpers.js');
const Works = require('../works.js');
const plan = (card) => card.subtasks.find(s => s.work === 'doc_plan').question.items[0];

test('#401 收購計價是 #400 的子議題，需求單位是秀琴姐，內文有需求句和會議原話；需求討論已經做完', () => {
  const e = play(); skipMeeting(e);
  const buy = e.board.get('buy');
  assert.strictEqual(buy.no, 401); assert.strictEqual(buy.parent, 'erp'); assert.strictEqual(buy.type, 'sub');
  assert.strictEqual(buy.requester, XIUQIN);
  assert.match(buy.body, /・記每一筆收購：來源、品種、重量、單價/);
  assert.match(buy.body, /需求會議原話：[\s\S]*我們很有人情味/);
  assert.deepStrictEqual(buy.subtasks.map(s => s.work),
    ['read_req', 'discuss', 'estimate', 'doc_plan', 'doc_spec', 'ui_design', 'doc_accept', 'code', 'test', 'manual_test', 'deploy']);
  assert.ok(buy.done('discuss'));
});

test('投影幕收購那頁問的是原話第 2、3 句（0 起算的段 1、2）；卡上的需求討論是同一題、唯讀', () => {
  const e = play(); tickTo(e, at(9, 31));
  const page = e.meeting.spec.pages.find(p => p.id === 'buy');
  assert.strictEqual(page.who, XIUQIN);
  assert.deepStrictEqual(Object.keys(page.question.asks).map(Number), [1, 2]);
  assert.match(page.question.segments[2], /^價錢喔/);
  assert.strictEqual(page.question.asks[2].options.at(-1), '「好。」', '交給 Verse、Essay 問時選的最客氣那句放最後');
  skipMeeting(e);
  assert.strictEqual(e.board.get('buy').subtasks.find(s => s.work === 'discuss').question.fromMeeting, 'buy');
});

test('會議問到的帶進開發計畫：問到行情帶「單價」、問到公斤帶「重量」', () => {
  const e = meetAll(play());
  const buy = e.board.get('buy');
  assert.deepStrictEqual(Works.givenOptions(plan(buy), buy.picks, (w) => buy.done(w)).filter(o => [3, 4].includes(o)).sort(), [3, 4]);
});

test('會議什麼都沒問：計畫不帶；退回 SA 勾對兩項，怡君 60 分鐘後補在卡上，計畫一樣帶入', () => {
  const e = play(); skipMeeting(e);
  const buy = e.board.get('buy');
  assert.deepStrictEqual(Works.givenOptions(plan(buy), buy.picks, (w) => buy.done(w)).filter(o => [3, 4].includes(o)), []);
  e.rejectToSA('buy', [[0, 1]]);
  tickTo(e, e.clock.minute + C.SA_RECHECK_MIN + 1);
  assert.match(buy.body, /照漁業署行情的中價/);
  assert.deepStrictEqual(Works.givenOptions(plan(buy), buy.picks, (w) => buy.done(w)).filter(o => [3, 4].includes(o)).sort(), [3, 4]);
});

test('收購計價：照正解做完、交 QC，30 分鐘後結案；通知秀琴姐，她回讚', () => {
  const e = meetAll(play());
  const buy = shipped(e, 'buy');
  assert.strictEqual(buy.status, 'archived', buy.comments.map(c => c.text).join('\n'));
  assert.ok(e.notifyDone('buy'));
  tickTo(e, e.clock.minute + 3);
  assert.ok(e.docs.some(d => d.from === XIUQIN && d.kind === 'sticker' && d.sticker === 'thumb'));
});

test('收購計價：文件往後流——計畫排了四步，計畫撐著的四個 function 拉進來；規格連動的五個留在 IDE 給你看（預填在計畫 2）', () => {
  const e = meetAll(play());
  doAll(e, 'buy');
  const buy = e.board.get('buy'); const q = buy.subtasks.find(s => s.work === 'code').question;
  assert.deepStrictEqual(Works.functionsToFill(q, 'all', buy.picks).map(i => q.functions[i].name),
    ['noWeightYet', 'pendingPrice', 'regularPrice', 'closedSeason', 'smallFish']);
});

test('收購計價：toKg 寫成 × 0.5、自己沒手動測，QC 翻出來退件', () => {
  const e = meetAll(play());
  const q = e.board.get('buy').subtasks.find(s => s.work === 'code').question;
  const code = right(q); code[q.functions.findIndex(f => f.name === 'toKg')] = { rate: 1 };
  // 計畫沒排重量那步，toKg 要自己寫；手動測試跳過（自己測出來的 bug QC 不會再退）
  const buy = shipped(e, 'buy', { code, doc_plan: [[0, 1, 2, 6, 7]], manual_test: null });
  assert.strictEqual(buy.status, 'returned');
});

test('子議題都結案，母議題 #400 跟著結案，可以通知建宏', () => {
  const e = play(); skipMeeting(e);
  const children = e.board.cards.filter(c => c.parent === 'erp');
  for (const c of children.slice(0, -1)) shipped(e, c.id);
  assert.notStrictEqual(e.board.get('erp').status, 'archived', '還有一張沒結案');
  shipped(e, children.at(-1).id);
  assert.strictEqual(e.board.get('erp').status, 'archived');
  assert.ok(e.notifyDone('erp'));
});
test('小事件池每關各自一套：第二關不抽第一關的飲水機、投影機那些', () => {
  for (const mode of ['legacy', 'hybrid', 'speedrun']) {
    assert.strictEqual(Sandbox.make('scenery', mode, { pool: ['trace', 'stock'] }).errands, undefined, mode);
    const e = skipMeeting(play(mode)); tickTo(e, at(17, 0));
    assert.ok(!e.docs.some(d => d.errand), mode);
  }
});
