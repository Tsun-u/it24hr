// tests/office-scenery-stuck.test.js（node --test）：流程卡住——通知後秀琴姐一試就卡住、每 15 分鐘催一張；追問的排程沒變
const test = require('node:test');
const assert = require('node:assert');
const { C, Engine, XIUQIN, play, at, tickTo, skipMeeting, shipped, codeWith, lime } = require('./scenery-helpers.js');
const DAY1 = require('../day1.js');

test('收購的程式寫成「一定要填實重才能存」：通知秀琴姐 15 分鐘後她催', () => {
  const e = play(); skipMeeting(e);
  shipped(e, 'buy', { code: codeWith(e, 'buy', { noWeightYet: 1 }) });
  e.notifyDone('buy');
  tickTo(e, e.clock.minute + 14); assert.ok(!lime(e, XIUQIN).includes('船還在路上，我現在哪知道多重？'));
  tickTo(e, e.clock.minute + 2);  assert.ok(lime(e, XIUQIN).includes('船還在路上，我現在哪知道多重？'));
});
test('兩個卡住的寫法：一張一張催，間隔 15 分鐘', () => {
  const e = play(); skipMeeting(e);
  shipped(e, 'buy', { code: codeWith(e, 'buy', { noWeightYet: 1, pendingPrice: 1 }) }); e.notifyDone('buy');
  const t0 = e.clock.minute;
  tickTo(e, t0 + 31);
  const docs = e.docs.filter(d => d.id.startsWith('buy:stuck:'));
  assert.deepStrictEqual(docs.map(d => d.arrivedAt - t0), [15, 30]);
});
test('下班了就不催（跟追問一樣）', () => {
  const e = play(); skipMeeting(e);
  shipped(e, 'buy', { code: codeWith(e, 'buy', { noWeightYet: 1 }) });
  tickTo(e, at(20, 50)); e.notifyDone('buy');   // 15 分鐘後是 21:05，已經被趕回家了
  tickTo(e, at(21, 20));
  assert.ok(!e.docs.some(d => d.id.startsWith('buy:stuck:')));
});
test('第一天阿賢的追問照舊：到卡 240 分鐘後、卡還在手上才問', () => {
  const e = new Engine({ ...DAY1, hints: [] });
  tickTo(e, C.DAY_START_MIN + 10 + 241);
  assert.ok(e.docs.some(d => d.id === 'asset_crud:nag:0'));
});
