// 第三關「心領神會」母議題的網站門面：配色題（palette.js）、天書／暗藏玄機／倒轉天罡、子議題跟著母議題配色、母議題結案時轉述老師不滿
const test = require('node:test');
const assert = require('node:assert');
const { Palette } = require('../palette.js');
const Works = require('../works.js');
const Screen = require('../screen.js');
const { C, Engine, Sandbox, tickTo, right, meetAll, shipped, lime } = require('./scenery-helpers.js');
require('../sandbox-fate.js');

const play = (mode = 'legacy') => new Engine(Sandbox.make('fate', mode), { name: '測試', title: '工程師' });
const front = Sandbox.make('fate', 'legacy').meetings[1].cards.find(c => c.id === 'fate').subtasks.find(s => s.work === 'ui_design').question;
const PAL = front.items[0];
const set = (bg, fg, deco, accent) => ({ bg, fg, deco, accent });
const RIGHT = set('violet', 'white', 'gold', 'pink'), TIANSHU = set('white', 'pink', 'violet', 'gold');

test('正解：四色用齊、看得清楚，老師沒意見', () => {
  const r = Palette.judge(PAL, { dark: false, light: RIGHT });
  assert.equal(r.ok, true);
  assert.deepEqual(r.outcomes, []);
  assert.deepEqual(r.achievements, []);
});

test('天書：老師的顏色都用到，但看不清楚——老師不嫌，拿成就', () => {
  const r = Palette.judge(PAL, { dark: false, light: TIANSHU });
  assert.equal(r.ok, false);
  assert.deepEqual(r.outcomes, []);
  assert.deepEqual(r.achievements, ['天書']);
});

test('少用一位老師的顏色那位不滿；用到沒人算的顏色三位一起問，挑深藍瀞玄多一句', () => {
  const noPink = Palette.judge(PAL, { dark: false, light: set('violet', 'white', 'gold', 'gold') });
  assert.deepEqual(noPink.outcomes.map(o => o.who), ['莉莉絲老師']);
  const water = Palette.judge(PAL, { dark: false, light: set('navy', 'white', 'gold', 'pink') });
  assert.deepEqual(water.outcomes.map(o => o.say), ['都好，只是頂輪的頻率沒有接上，這個網站的能量傳不出去。', '這個顏色誰算的？', '我有說我要水嗎？']);
});

test('深色主題：八格合起來用齊四色就好；一組天書一組看得清楚是暗藏玄機；底色選反是倒轉天罡', () => {
  const hidden = Palette.judge(PAL, { dark: true, light: TIANSHU, night: RIGHT });
  assert.equal(hidden.ok, true);
  assert.deepEqual(hidden.achievements, ['天書', '暗藏玄機']);
  const flipped = Palette.judge(PAL, { dark: true, light: RIGHT, night: TIANSHU });
  assert.deepEqual(flipped.achievements, ['天書', '暗藏玄機', '倒轉天罡']);
  // 每組各少一色，但八格合起來四色都有：老師沒意見
  const split = Palette.judge(PAL, { dark: true, light: set('white', 'violet', 'gold', 'violet'), night: set('violet', 'white', 'pink', 'pink') });
  assert.deepEqual(split.missing, []);
});

test('沒填完不算：沒有後果、不算對', () => {
  const r = Palette.judge(PAL, { dark: false, light: { bg: 'violet' } });
  assert.equal(r.complete, false);
  assert.equal(Works.outcomes(front, [{ dark: false, light: { bg: 'violet' } }, 0, 0]).filter(o => o.item === 0).length, 0);
});

test('會議問三位標四色、只問瀞玄標白金、沒問不標', () => {
  const hints = (asked) => Works.paletteHints(PAL, asked === null ? {} : { discuss: { circled: [0], asks: { 0: [asked] } } });
  assert.deepEqual(hints(0), ['white', 'gold', 'pink', 'violet']);
  assert.deepEqual(hints(1), ['white', 'gold']);
  assert.deepEqual(hints(null), []);
});

test('子議題的成品畫面照母議題的配色走；母議題還沒做配色就是預設', () => {
  const e = play(); meetAll(e);
  const profile = e.board.get('profile');
  assert.equal(e.screenOf(profile).theme, null);
  e.doWork('fate', 'ui_design', right(front));
  assert.deepEqual(e.screenOf(profile).theme, { bg: '#5B2A86', fg: '#FFFFFF', accent: '#F7A8C8' });
  assert.ok(Screen);
});

test('母議題門面照常理做（一般導覽列）：子議題都結案、母議題跟著結案時，雅雯轉述老師不滿', () => {
  const e = play(); meetAll(e);
  e.doWork('fate', 'ui_design', [{ dark: false, light: RIGHT }, 1, 0]);
  for (const id of e.board.cards.filter(c => c.parent === 'fate').map(c => c.id)) shipped(e, id);
  tickTo(e, e.clock.minute + 3);
  assert.equal(e.board.get('fate').status, 'archived');
  assert.ok(lime(e, '解憂時代 助理 雅雯').includes('老師們看了說：「一目了然，就沒有神祕感了。」'));
});

test('母議題門面的正解（八卦星盤選單）：阿姿驗子議題時也會抱怨', () => {
  const e = play(); meetAll(e);
  e.doWork('fate', 'ui_design', right(front));
  const profile = e.board.get('profile');
  shipped(e, 'profile', { ui_design: (() => { const a = right(profile.subtasks.find(s => s.work === 'ui_design').question); a[0] = 1; return a; })() });
  tickTo(e, e.clock.minute + 2);
  assert.equal(e.stats.gripes, 1);
  assert.equal(e.board.get('fate').griped, true);
});

test('speedrun 把母議題前端程式交給 AI：配色題也產得出答案、收得下來', () => {
  const e = play('speedrun'); meetAll(e);
  const job = e.delegate('fate', 'ui_design', 'Essay');
  assert.ok(job, '交辦成功');
  tickTo(e, e.clock.minute + 40);
  const done = (e.board.get('fate').ai.ui_design || []).find(j => j.status === 'done' || j.status === 'ready');
  assert.ok(done, 'AI 交件');
  assert.equal(typeof done.answers[0], 'object');
  assert.ok(C);
});

test('結算卡：配色做成天書、暗藏玄機、倒轉天罡各有成就', () => {
  const e = play(); meetAll(e);
  e.doWork('fate', 'ui_design', [{ dark: true, light: RIGHT, night: TIANSHU }, 0, 0]);
  const titles = e.script.report(e).traits.map(t => t.title).filter(t => ['天書', '暗藏玄機', '倒轉天罡'].includes(t));
  assert.deepEqual(titles, ['天書', '暗藏玄機', '倒轉天罡']);
});
