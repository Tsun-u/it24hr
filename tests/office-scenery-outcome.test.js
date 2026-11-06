// tests/office-scenery-outcome.test.js（node --test）：第二關三種答法——跳紅字照樣結案、什麼都收被退件；規格預填的程式帶著後果；驗收、晚上的抱怨、紅字與紙本的帳
const test = require('node:test');
const assert = require('node:assert');
const Works = require('../works.js');
const { C, XIUQIN, play, at, tickTo, right, meetAll, skipMeeting, doAll, shipped, codeWith, lime } = require('./scenery-helpers.js');
const ui = (e, id) => e.board.get(id).subtasks.find(s => s.work === 'ui_design').question;
const spec = (e, id) => e.board.get(id).subtasks.find(s => s.work === 'doc_spec').question;
// 正解的答案卡，第 i 題換成 v
const swapped = (q, i, v) => { const a = right(q); a[i] = v; return a; };
// 開發照規格預填（玩家沒改）：做到開發那一刻才算，這時規格已經寫了
const followSpec = (e, card) => { const q = card.subtasks.find(s => s.work === 'code').question; return Works.prefill(q, card.picks, right(q)); };

test('cardOutcomes：前端設計和開發都看，沒做的那件照 ifSkipped', () => {
  const e = play(); skipMeeting(e);
  const kinds = e.cardOutcomes(e.board.get('buy')).map(o => `${o.work}:${o.kind}`);
  assert.ok(kinds.includes('ui_design:miss') && kinds.includes('code:stuck'), kinds.join());
});
test('單價選「跳紅字」：會動，QC 驗過結案', () => {
  const e = play(); skipMeeting(e);
  assert.strictEqual(shipped(e, 'buy', { ui_design: swapped(ui(e, 'buy'), 0, 1) }).status, 'archived');
});
test('單價選「什麼都收」：阿姿亂打翻出來退件，理由是劇本那句', () => {
  const e = play(); skipMeeting(e);
  const buy = shipped(e, 'buy', { ui_design: swapped(ui(e, 'buy'), 0, 2) });
  assert.strictEqual(buy.status, 'returned');
  assert.match(buy.comments.at(-1).text, /單價寫『時價』也送得出去，月底算不出成本/);
});
test('沒做前端設計：每個欄位照最直覺的做法，四個欄位收了怪東西一起退', () => {
  const e = play(); skipMeeting(e);
  const buy = shipped(e, 'buy', { ui_design: null });
  assert.match(buy.comments.at(-1).text, /驗到 4 個問題/);
  for (const junk of ['時價', '一簍', '阿伯', '青花魚']) assert.match(buy.comments.at(-1).text, new RegExp(junk));
});
test('熟客改價的程式不留紀錄（late）：QC 驗不出來，照樣結案', () => {
  const e = play(); skipMeeting(e);
  assert.strictEqual(shipped(e, 'buy', { code: codeWith(e, 'buy', { regularPrice: 1 }) }).status, 'archived');
});
test('規格選「一定要填實重才能存」：開發預填卡住的寫法，沒改就卡住；開發時改回正解就沒事', () => {
  let e = meetAll(play());
  shipped(e, 'buy', { doc_spec: swapped(spec(e, 'buy'), 0, 1), code: followSpec });
  assert.ok(e.cardOutcomes(e.board.get('buy')).some(o => o.fn === 'noWeightYet' && o.kind === 'stuck'));
  e = meetAll(play());
  shipped(e, 'buy', { doc_spec: swapped(spec(e, 'buy'), 0, 1) });   // 開發照正解寫，等於把預填的改掉
  assert.ok(!e.cardOutcomes(e.board.get('buy')).some(o => o.kind === 'stuck'));
});

test('通知秀琴姐：成品有跳紅字的欄位，她試完回「這紅字是什麼意思？」，不回讚', () => {
  const e = play(); skipMeeting(e);
  shipped(e, 'buy', { ui_design: swapped(ui(e, 'buy'), 1, 1) });
  e.notifyDone('buy'); tickTo(e, e.clock.minute + 3);
  assert.ok(lime(e, XIUQIN).includes('這紅字是什麼意思？是不是你們的系統壞了？'));
  assert.ok(!e.docs.some(d => d.from === XIUQIN && d.kind === 'sticker'));
});
test('通知秀琴姐：全部做對就回讚', () => {
  const e = play(); skipMeeting(e);
  shipped(e, 'buy'); e.notifyDone('buy'); tickTo(e, e.clock.minute + 3);
  assert.ok(e.docs.some(d => d.from === XIUQIN && d.sticker === 'thumb'));
  assert.ok(!lime(e, XIUQIN).some(t => t.includes('紅字')));
});

test('晚上 20:30、21:30：上線的卡裡員工惱怒的話，秀琴姐一次傳一句', () => {
  const e = play(); skipMeeting(e);
  const a = right(ui(e, 'buy')); a[0] = 1; a[1] = 1;
  shipped(e, 'buy', { ui_design: a });
  tickTo(e, at(20, 31));
  assert.ok(lime(e, XIUQIN).includes('雄哥他們在問：「時價哪裡不正確？」'));
  tickTo(e, at(21, 31));
  assert.ok(lime(e, XIUQIN).includes('雄哥他們在問：「我打『斤』它說單位不正確」'), '21:00 被趕回家，在茶几照樣收得到');
});
test('沒上線（沒結案）的卡，晚上沒人抱怨', () => {
  const e = play(); skipMeeting(e);
  const a = right(ui(e, 'buy')); a[0] = 1; doAll(e, 'buy', { ui_design: a });
  tickTo(e, at(20, 31));
  assert.ok(!lime(e, XIUQIN).some(t => t.startsWith('雄哥他們在問')));
});

test('usageTally：兩題跳紅字的收購上線＝紅字 2 × 24 次、一半的單變回紙本', () => {
  const e = play(); skipMeeting(e);
  const a = right(ui(e, 'buy')); a[0] = 1; a[1] = 1;
  shipped(e, 'buy', { ui_design: a });
  const t = e.usageTally();
  assert.strictEqual(t.red, 48); assert.strictEqual(t.paper, 12); assert.strictEqual(t.stuck, 0);
});
test('usageTally：只有一題跳紅字不回去寫紙本；熟客價的程式不留紀錄記在 late', () => {
  const e = play(); skipMeeting(e);
  shipped(e, 'buy', { ui_design: swapped(ui(e, 'buy'), 0, 1), code: codeWith(e, 'buy', { regularPrice: 1 }) });
  const t = e.usageTally();
  assert.strictEqual(t.red, 24); assert.strictEqual(t.paper, 0);
  assert.deepStrictEqual(t.late, ['月底不知道為什麼這筆比較便宜']);
});
test('usageTally：怪東西是阿姿驗的時候翻出來的，改好再交也留在帳上', () => {
  const e = play(); skipMeeting(e);
  shipped(e, 'buy', { ui_design: swapped(ui(e, 'buy'), 0, 2) });
  e.doWork('buy', 'ui_design', right(ui(e, 'buy')));
  e.submit('buy'); tickTo(e, e.clock.minute + C.QC_TURNAROUND_MIN + 1);
  assert.strictEqual(e.board.get('buy').status, 'archived');
  assert.deepStrictEqual(e.usageTally().junk, ['時價']);
});
