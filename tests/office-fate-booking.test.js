// 正式上班第三關「心領神會」：#504 預約系統（價格吉數從母議題會議跨卡帶入）
const test = require('node:test');
const assert = require('node:assert');
const { Engine, Sandbox, meetAll, skipMeeting, shipped, tickTo, right, lime } = require('./scenery-helpers.js');
require('../sandbox-fate.js');
const Works = require('../works.js');

const play = (mode = 'legacy') => new Engine(Sandbox.make('fate', mode), { name: '測試', title: '工程師' });
const sub = (e, id, work) => e.board.get(id).subtasks.find(s => s.work === work).question;
const uiWith = (e, swap) => { const a = right(sub(e, 'booking', 'ui_design')); Object.assign(a, swap); return a; };
const codeWith = (e, flows) => {
  const q = sub(e, 'booking', 'code'); const a = right(q);
  q.functions.forEach((f, i) => { if (f.name in flows) a[i] = { flow: flows[f.name] }; });
  return a;
};
// 帶入（含跨卡）：看這張卡和母議題的 picks
const givenOf = (e, work, item) => {
  const card = e.board.get('booking');
  return Works.givenOptions(sub(e, 'booking', work).items[item], card.picks, w => card.done(w), 'all', e.otherCard);
};
const ONLY_JINGXUAN = { fate: { circled: [0], asks: { 0: [1] } } };   // 母議題只請瀞玄排盤
const LUCKY = new Set('245689');
const luckyPrice = (price) => [...price.replace(/,/g, '')].every(d => LUCKY.has(d));
const YAWEN = '解憂時代 助理 雅雯';

test('散會後怡君開出 #504 預約系統，掛在母議題底下', () => {
  const e = play(); skipMeeting(e);
  const booking = e.board.get('booking');
  assert.equal(booking.no, 504);
  assert.equal(booking.parent, 'fate');
});

test('#504 照正解做完交 QC，阿姿驗過結案', () => {
  const e = play(); meetAll(e);
  assert.equal(shipped(e, 'booking').status, 'archived');
});

test('前端程式價格、後台改價跨卡帶入：母議題會議請三位老師排盤才帶正解；只問瀞玄、沒問都不帶', () => {
  const all = play(); meetAll(all);
  const jingxuan = play(); meetAll(jingxuan, ONLY_JINGXUAN);
  const skipped = play(); skipMeeting(skipped);
  assert.deepEqual([givenOf(all, 'ui_design', 1), givenOf(all, 'ui_design', 2)], [[0], [0]]);
  assert.deepEqual([givenOf(jingxuan, 'ui_design', 1), givenOf(jingxuan, 'ui_design', 2)], [[], []]);
  assert.deepEqual([givenOf(skipped, 'ui_design', 1), givenOf(skipped, 'ui_design', 2)], [[], []]);
});

test('開發計畫的「三位老師的價格」也從母議題請三位老師排盤帶', () => {
  const all = play(); meetAll(all);
  const jingxuan = play(); meetAll(jingxuan, ONLY_JINGXUAN);
  assert.ok(givenOf(all, 'doc_plan', 0).includes(2));
  assert.ok(!givenOf(jingxuan, 'doc_plan', 0).includes(2));
});

test('價格正解選項和成品畫面上的價格，每一位數都在吉數聯集 {2, 4, 5, 6, 8, 9} 裡', () => {
  const e = play(); meetAll(e);
  const prices = sub(e, 'booking', 'ui_design').items[1].options[0].match(/\d[\d,]*/g);
  assert.ok(prices.length >= 3);
  for (const p of prices) assert.ok(luckyPrice(p), `${p} 有不在吉數裡的數字`);
  const card = e.board.get('booking');
  const at = card.screen.fields.indexOf('價格');
  for (const row of card.screen.rows) assert.ok(luckyPrice(row[at]), `${row[at]} 有不在吉數裡的數字`);
});

test('價格照常理做成整數價：QC 照過，通知後三位老師一起不滿', () => {
  const e = play(); meetAll(e);
  assert.equal(shipped(e, 'booking', { ui_design: uiWith(e, { 1: 2 }) }).status, 'archived');
  e.notifyDone('booking'); tickTo(e, e.clock.minute + 3);
  assert.ok(lime(e, YAWEN).some(t => t.includes('三位老師說：「零是空亡，一跟三沒人算到，你從哪裡生出來的？」')));
});

test('親算問卷要客人再填一次生辰 QC 退；後台改價什麼都收 QC 驗不出來，上線後才出事', () => {
  const again = play(); meetAll(again);
  assert.equal(shipped(again, 'booking', { ui_design: uiWith(again, { 3: 1 }) }).status, 'returned');
  const anyPrice = play(); meetAll(anyPrice);
  assert.equal(shipped(anyPrice, 'booking', { ui_design: uiWith(anyPrice, { 2: 2 }) }).status, 'archived');
  assert.ok(anyPrice.usageTally().late.includes('雅雯打了 3,600，熙恩教授說他的頻率被干擾'));
});

test('規格「親算的信件」要回信、信件標題兩題都問到才帶；只問一題不帶', () => {
  const both = play(); meetAll(both);
  const one = play(); meetAll(one, { booking: { circled: [1, 2], asks: { 1: [0, 0], 2: [0, 1] } } });   // 「信要怎麼分」那題只回了「好。」
  assert.deepEqual(givenOf(both, 'doc_spec', 1), [0]);
  assert.deepEqual(givenOf(one, 'doc_spec', 1), []);
});

test('後端程式寫錯：同一時段共用一個時段表 QC 退；老師共用待辦清單 QC 驗不出來', () => {
  const shared = play(); meetAll(shared);
  assert.equal(shipped(shared, 'booking', { code: codeWith(shared, { oneSlot: 1 }) }).status, 'returned');
  const queue = play(); meetAll(queue);
  assert.equal(shipped(queue, 'booking', { code: codeWith(queue, { teacherQueue: 1 }) }).status, 'archived');
});

test('好幾個測試寫到同一個後端欄位：有一個寫錯，AI 就照寫錯的那個寫（不會被後面寫對的蓋回去）', () => {
  const W = require('../works.js');
  const check = { assert: { label: '檢查', options: ['對', '錯'], answer: 0 } };
  const q = { kind: 'functions', functions: [
    { name: 'testA', does: 'A', code: '', drives: { fn: 'save', field: 'how', map: { 0: 0, 1: 1 } }, fields: check },
    { name: 'testB', does: 'B', code: '', drives: { fn: 'save', field: 'how', map: { 0: 0, 1: 2 } }, fields: check },
  ] };
  assert.equal(W.testDrives(q, [{ assert: 1 }, { assert: 0 }]).save.how, 1);
  assert.equal(W.testDrives(q, [{ assert: 0 }, { assert: 1 }]).save.how, 2);
  assert.equal(W.testDrives(q, [{ assert: 0 }, { assert: 0 }]).save.how, 0);
});
