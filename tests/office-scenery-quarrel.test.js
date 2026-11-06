// tests/office-scenery-quarrel.test.js（node --test）：相罵本——22:30 從上線的模組挑一件吵架，有記錄一查收工，沒記就找上門
const test = require('node:test');
const assert = require('node:assert');
const { XIUQIN, XIONG, JIANHONG, play, at, tickTo, right, skipMeeting, shipped, codeWith, lime } = require('./scenery-helpers.js');
const opened = () => skipMeeting(play());
const ui = (e, id) => e.board.get(id).subtasks.find(s => s.work === 'ui_design').question;
const BLAME = '這批的單價是誰改的？你們系統沒記，這筆到底算誰的？';

test('只有收購上線、單價有自動記錄：一查收工，建宏說還好系統有記，成就人證物證', () => {
  const e = opened(); shipped(e, 'buy');
  tickTo(e, at(22, 31));
  assert.deepStrictEqual(e.stats.quarrel, { cardId: 'buy', logged: true });
  assert.ok(!lime(e, XIUQIN).includes(BLAME));
  const r = e.report();
  assert.ok(r.peers.some(p => p.who === JIANHONG && p.text === '還好系統有記，不然今天又要吵一整天。'));
  assert.ok(r.traits.some(t => t.title === '人證物證'));
  assert.ok(!r.tally.some(t => t.text.startsWith('被拉進相罵本')));
});
test('單價做成跳紅字（沒有記錄）：秀琴姐找上門，左欄被拉進相罵本 1 次，成就背鍋的開發商', () => {
  const e = opened(); const a = right(ui(e, 'buy')); a[0] = 1;
  shipped(e, 'buy', { ui_design: a });
  tickTo(e, at(22, 31));
  assert.deepStrictEqual(e.stats.quarrel, { cardId: 'buy', logged: false });
  assert.ok(lime(e, XIUQIN).includes(BLAME));
  const r = e.report();
  assert.ok(r.tally.some(t => t.text === '被拉進相罵本：1 次'));
  assert.ok(r.traits.some(t => t.title === '背鍋的開發商'));
  assert.ok(!r.peers.some(p => p.who === JIANHONG && p.text.startsWith('還好系統有記')));
});
test('那件工作還沒做：看的那一格沒有選，照 ifSkipped（最直覺的寫法）算', () => {
  const e = opened(); const card = e.board.get('buy');
  const ui0 = e.quarrelSpot(card, { work: 'ui_design', item: 0 });
  assert.strictEqual(ui0.picked, undefined); assert.strictEqual(ui0.spot.ifSkipped, 2);
  const shift = e.quarrelSpot(e.board.get('shift'), { fn: 'leaderAway' });
  assert.strictEqual(shift.picked, undefined); assert.strictEqual(shift.spot.ifSkipped, 2);
});
test('看開發的 function：加班請假的 leaderAway 寫成等組長簽，雄哥找上門', () => {
  const e = opened(); shipped(e, 'shift', { code: codeWith(e, 'shift', { leaderAway: 2 }) });
  tickTo(e, at(22, 31));
  assert.deepStrictEqual(e.stats.quarrel, { cardId: 'shift', logged: false });
  assert.ok(lime(e, XIONG).includes('那天凌晨到底幾點上工？你們系統沒記，這筆到底算誰的？'));
});
test('看開發的 function：leaderAway 照正解，一查收工', () => {
  const e = opened(); shipped(e, 'shift');
  tickTo(e, at(22, 31));
  assert.deepStrictEqual(e.stats.quarrel, { cardId: 'shift', logged: true });
  assert.ok(!lime(e, XIONG).some(t => t.endsWith('你們系統沒記，這筆到底算誰的？')));
});
test('六件吵架看的那一格都對得到卡上的題目：有正解、沒做時不是正解', () => {
  for (const pool of [['trace', 'stock'], ['trace', 'claim']]) {
    const e = skipMeeting(play('legacy', { pool }));
    for (const [id, c] of Object.entries(e.script.quarrel.cases)) {
      const card = e.board.get(id); if (!card) continue;
      const { spot } = e.quarrelSpot(card, c.logged);
      assert.strictEqual(typeof spot.answer, 'number', id);
      assert.notStrictEqual(spot.ifSkipped, spot.answer, id);
    }
  }
});
test('沒有模組上線就不吵', () => {
  const e = opened(); tickTo(e, at(22, 31));
  assert.strictEqual(e.stats.quarrel, undefined);
  assert.ok(!e.report().traits.some(t => ['人證物證', '背鍋的開發商'].includes(t.title)));
});
test('一天只吵一件：兩個模組都沒記，也只有一個人找上門', () => {
  const e = opened();
  const buy = right(ui(e, 'buy')); buy[0] = 1; shipped(e, 'buy', { ui_design: buy });
  const yieldUi = right(ui(e, 'yield')); yieldUi[1] = 1; shipped(e, 'yield', { ui_design: yieldUi });
  tickTo(e, at(23, 59));
  assert.ok(['buy', 'yield'].includes(e.stats.quarrel.cardId));
  assert.strictEqual(e.docs.filter(d => d.id === 'quarrel:blame').length, 1);
});
