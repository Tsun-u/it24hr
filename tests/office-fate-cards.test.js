// 正式上班第三關「心領神會」：#502 六大排盤、#503 流年運勢與合婚配對
const test = require('node:test');
const assert = require('node:assert');
const { Engine, Sandbox, meetAll, skipMeeting, shipped, tickTo, right, lime } = require('./scenery-helpers.js');
require('../sandbox-fate.js');
const Works = require('../works.js');

const play = (mode = 'legacy') => new Engine(Sandbox.make('fate', mode), { name: '測試', title: '工程師' });
const sub = (e, id, work) => e.board.get(id).subtasks.find(s => s.work === work).question;
const uiWith = (e, id, swap) => { const a = right(sub(e, id, 'ui_design')); Object.assign(a, swap); return a; };
const YAWEN = '解憂時代 助理 雅雯';

test('散會後怡君開出 #502 六大排盤、#503 流年運勢與合婚配對，都掛在母議題底下', () => {
  const e = play(); skipMeeting(e);
  const chart = e.board.get('chart'), reading = e.board.get('reading');
  assert.equal(chart.no, 502);
  assert.equal(reading.no, 503);
  assert.equal(chart.parent, 'fate');
  assert.equal(reading.parent, 'fate');
});

test('#502、#503 照正解做完交 QC，阿姿驗過結案', () => {
  const e = play(); meetAll(e);
  assert.equal(shipped(e, 'chart').status, 'archived');
  assert.equal(shipped(e, 'reading').status, 'archived');
});

test('#502 前端程式第 1 題照常理做（按下去馬上出結果）：QC 照過，通知後雅雯轉述老師不滿', () => {
  const e = play(); meetAll(e);
  assert.equal(shipped(e, 'chart', { ui_design: uiWith(e, 'chart', { 0: 1 }) }).status, 'archived');
  e.notifyDone('chart'); tickTo(e, e.clock.minute + 3);
  assert.ok(lime(e, YAWEN).includes('老師們看了說：「這麼快，客人會覺得是電腦隨便算的。」'));
});

test('#503 規格第 1 題跨卡帶入：#501 前端程式選了多張資料卡、#503 計畫排了合婚才帶；#501 沒做不帶', () => {
  const e = play(); meetAll(e);
  const card = e.board.get('reading');
  const item = sub(e, 'reading', 'doc_spec').items[0];
  const given = () => Works.givenOptions(item, card.picks, w => card.done(w), 'all', e.otherCard);
  e.doWork('reading', 'doc_plan', right(sub(e, 'reading', 'doc_plan')));
  assert.deepEqual(given(), [], '#501 前端程式還沒做');
  e.doWork('profile', 'ui_design', right(sub(e, 'profile', 'ui_design')));
  assert.deepEqual(given(), [0]);
});

test('#503 規格第 1 題：#501 前端程式「家人」選了只能一張就不帶', () => {
  const e = play(); meetAll(e);
  const card = e.board.get('reading');
  const item = sub(e, 'reading', 'doc_spec').items[0];
  e.doWork('reading', 'doc_plan', right(sub(e, 'reading', 'doc_plan')));
  e.doWork('profile', 'ui_design', uiWith(e, 'profile', { 4: 1 }));
  assert.deepEqual(Works.givenOptions(item, card.picks, w => card.done(w), 'all', e.otherCard), []);
});

test('#503 前端程式：會議問到「解說要全部顯示嗎」兩題都定在只露一部分；沒問不帶', () => {
  const asked = play(); meetAll(asked);
  const skipped = play(); skipMeeting(skipped);
  const given = (e) => { const c = e.board.get('reading'); return sub(e, 'reading', 'ui_design').items.map(item => Works.givenOptions(item, c.picks, w => c.done(w))); };
  assert.deepEqual(given(asked), [[0], [0]]);
  assert.deepEqual(given(skipped), [[], []]);
});

test('#502 規格連動的寫錯：換年共用一個年份 QC 退；生命靈數一路加到個位數只被莉莉絲嫌', () => {
  const year = play(); meetAll(year);
  const yearCode = right(sub(year, 'chart', 'code'));
  yearCode[sub(year, 'chart', 'code').functions.findIndex(f => f.name === 'yearSplit')] = { flow: 1 };
  assert.equal(shipped(year, 'chart', { code: yearCode }).status, 'returned');

  const eleven = play(); meetAll(eleven);
  const elevenCode = right(sub(eleven, 'chart', 'code'));
  elevenCode[sub(eleven, 'chart', 'code').functions.findIndex(f => f.name === 'lifePath')] = { flow: 1 };
  assert.equal(shipped(eleven, 'chart', { code: elevenCode }).status, 'archived');
  eleven.notifyDone('chart'); tickTo(eleven, eleven.clock.minute + 3);
  assert.ok(lime(eleven, YAWEN).some(t => t.includes('莉莉絲老師說：「11 是卓越的數字，被掩蓋在庸碌中了。」')));
});

test('#503 前端程式「沒有解說，只有盤」QC 退', () => {
  const e = play(); meetAll(e);
  assert.equal(shipped(e, 'reading', { ui_design: uiWith(e, 'reading', { 0: 2 }) }).status, 'returned');
});
