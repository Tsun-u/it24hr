// tests/office-scenery-parallel.test.js（node --test）：平行宇宙——成品跟需求對不上過半，交 QC 時 10% 開出那個模組的新卡
const test = require('node:test');
const assert = require('node:assert');
const { C, JIANHONG, XIUQIN, play, tickTo, meetAll, skipMeeting, doAll, shipped, lime } = require('./scenery-helpers.js');
const opened = () => skipMeeting(play());
// 只部署就交 QC：前端程式、規格、開發都沒做
const ONLY_DEPLOY = { read_req: null, discuss: null, estimate: null, doc_plan: null, doc_spec: null, ui_design: null, doc_accept: null, code: null, test: null, manual_test: null };

test('mismatch：全部做對是 0；前端程式、開發都沒做是 1；卡上沒有這兩件的（母議題）是 0', () => {
  let e = opened(); doAll(e, 'buy'); assert.strictEqual(e.mismatch(e.board.get('buy')), 0);
  e = opened(); doAll(e, 'buy', ONLY_DEPLOY); assert.strictEqual(e.mismatch(e.board.get('buy')), 1);
  assert.strictEqual(e.mismatch(e.board.get('erp')), 0);
});
test('mismatch：只看成品（前端程式＋後端程式）——前端程式沒做、開發照正解是 1/2；規格沒做不算', () => {
  let e = opened(); doAll(e, 'buy', { ui_design: null });
  assert.ok(Math.abs(e.mismatch(e.board.get('buy')) - 1 / 2) < 1e-9);
  e = opened(); doAll(e, 'buy', { doc_spec: null });
  assert.strictEqual(e.mismatch(e.board.get('buy')), 0);
});

test('對不上過半、骰到 10% 以內：阿姿照樣驗（這張被退），建宏說能改成員工內購，怡君開 #406 給你、當天就能做', () => {
  const e = opened(); e.random = () => 0;
  const buy = shipped(e, 'buy', ONLY_DEPLOY);
  assert.strictEqual(buy.status, 'returned');
  assert.ok(lime(e, JIANHONG).some(t => t.includes('可以改成員工內購嗎？')));
  const fresh = e.board.get('staff_buy');
  assert.strictEqual(fresh.no, 406); assert.ok(!fresh.nextRound); assert.strictEqual(fresh.assignee, '測試');
  assert.strictEqual(fresh.requester, JIANHONG); assert.ok(!fresh.parent);
  assert.deepStrictEqual(fresh.attachments, ['參考文件：#401 收購計價']);
  assert.deepStrictEqual(fresh.subtasks.map(s => s.work), ['ui_design', 'code', 'manual_test', 'deploy']);
  assert.ok(lime(e, 'SA 怡君').some(t => t.includes('#406 員工內購')));
  assert.ok(e.parallelUniverse());
  assert.ok(e.report().traits.some(t => t.title === '成功製造需求'));
});
test('新卡做得完：照正解做、交 QC、結案；不做也不擋結算', () => {
  const e = opened(); e.random = () => 0; shipped(e, 'buy', ONLY_DEPLOY);
  assert.strictEqual(shipped(e, 'staff_buy').status, 'archived');
  assert.doesNotThrow(() => e.report());
});
test('骰到 10% 以外不會；成品做對了骰到也不會', () => {
  let e = opened(); e.random = () => 0.5; shipped(e, 'buy', ONLY_DEPLOY);
  assert.ok(!e.board.get('staff_buy')); assert.ok(!e.parallelUniverse());
  e = meetAll(play()); e.random = () => 0; shipped(e, 'buy');
  assert.ok(!e.board.get('staff_buy'));
});
test('每交一次擲一次；同一張卡最多開一張新卡', () => {
  const e = opened(); e.random = () => 0.5; shipped(e, 'buy', ONLY_DEPLOY);
  e.random = () => 0; e.submit('buy'); tickTo(e, e.clock.minute + C.QC_TURNAROUND_MIN + 1);
  assert.ok(e.board.get('staff_buy'));
  e.submit('buy'); tickTo(e, e.clock.minute + C.QC_TURNAROUND_MIN + 1);
  assert.strictEqual(e.board.cards.filter(c => c.id === 'staff_buy').length, 1);
});
test('依做歪的模組不同：加班請假做歪是秀琴姐要排班表，議題編號接著發', () => {
  const e = opened(); e.random = () => 0;
  shipped(e, 'buy', ONLY_DEPLOY); shipped(e, 'shift', ONLY_DEPLOY);
  assert.ok(lime(e, XIUQIN).some(t => t.includes('可以改成排班表嗎？')));
  assert.deepStrictEqual([e.board.get('staff_buy').no, e.board.get('roster').no], [406, 407]);
});
test('六張新卡都開得出來、照正解做完會結案；成品畫面兩個欄位都畫成正解的樣子；沒做前端程式兩個欄位都收了怪東西', () => {
  const Screen = require('../screen.js');
  const NEW = { buy: 'staff_buy', yield: 'staff_meal', shift: 'roster', trace: 'regulars', stock: 'gifts', claim: 'gear_loan' };
  for (const pool of [['trace', 'stock'], ['stock', 'claim']]) {
    const e = skipMeeting(play('legacy', { pool })); e.random = () => 0;
    for (const id of ['buy', 'yield', 'shift', ...pool]) shipped(e, id, ONLY_DEPLOY);
    for (const id of ['buy', 'yield', 'shift', ...pool]) {
      const fresh = e.board.get(NEW[id]); assert.ok(fresh, NEW[id]);
      const ui = fresh.subtasks.find(s => s.work === 'ui_design').question.items.map(i => i.field);
      assert.ok(ui.every(f => fresh.screen.fields.includes(f)), `${NEW[id]} 的欄位題要對得到成品畫面的欄位`);
      assert.strictEqual(shipped(e, NEW[id]).status, 'archived', NEW[id]);
      const m = Screen.model(fresh);
      assert.ok(ui.every(f => m.fieldLooks[f].look === 'right'), NEW[id]);
    }
    const skipped = skipMeeting(play('legacy', { pool })); skipped.random = () => 0;
    shipped(skipped, 'buy', ONLY_DEPLOY);
    const card = shipped(skipped, 'staff_buy', { ui_design: null });
    assert.strictEqual(card.status, 'returned');
    assert.match(card.comments.at(-1).text, /驗到 2 個問題/);
  }
});
