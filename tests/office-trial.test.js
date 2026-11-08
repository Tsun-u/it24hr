// 單卡試玩（審卡頁的連結）：Sandbox.make 的 carry.only 只留那張卡和母議題，carry.parallel 讓平行宇宙一定擲中
const test = require('node:test');
const assert = require('node:assert');
const { Engine, Sandbox, meetAll, shipped } = require('./scenery-helpers.js');
require('../sandbox-fate.js');

const meetingOf = (s) => s.meetings.find(m => m.kind === 'vendor');
const ids = (list) => list.map(x => x.id);

test('只玩每日一籤：會議只講網站整體和每日一籤兩頁，散會後只開母議題和它，母議題寫這期做 1 個功能', () => {
  const s = Sandbox.make('fate', 'legacy', { only: 'lot' });
  assert.equal(s.trial, 'lot');
  assert.deepEqual(ids(meetingOf(s).pages), ['fate', 'lot']);
  assert.deepEqual(ids(meetingOf(s).cards), ['fate', 'lot']);
  assert.match(meetingOf(s).cards[0].body, /這期做 1 個功能/);
  const e = meetAll(new Engine(s, { name: '測試', title: '工程師' }));
  assert.deepEqual(ids(e.board.cards).sort(), ['fate', 'lot']);
});

test('必出的子議題也能單獨玩；只玩母議題就一張子議題都不開', () => {
  assert.deepEqual(ids(meetingOf(Sandbox.make('fate', 'legacy', { only: 'booking' })).cards), ['fate', 'booking']);
  assert.deepEqual(ids(meetingOf(Sandbox.make('fate', 'speedrun', { only: 'fate' })).pages), ['fate']);
});

test('沒有這張卡就講清楚有哪些卡', () => {
  assert.throws(() => Sandbox.make('fate', 'legacy', { only: 'nope' }), /這一關沒有這張卡：nope（有 fate/);
});

test('照正解做完交 QC，阿姿驗過結案，跟整關玩的時候一樣', () => {
  const e = meetAll(new Engine(Sandbox.make('fate', 'legacy', { only: 'lot' }), { name: '測試', title: '工程師' }));
  assert.equal(shipped(e, 'lot').status, 'archived');
});

test('carry.parallel：平行宇宙的機率變成一定，對不上過半的條件照舊', () => {
  const s = Sandbox.make('fate', 'legacy', { only: 'lot', parallel: true });
  assert.equal(s.parallel.chance, 1);
  assert.equal(s.parallel.over, 0.5);
  assert.equal(Sandbox.make('fate', 'legacy', { only: 'lot' }).parallel.chance, 0.1);
  const e = meetAll(new Engine(s, { name: '測試', title: '工程師' }));
  shipped(e, 'lot', { ui_design: null, code: null });
  assert.ok(['rolled', 'spawned'].includes(e.board.get('lot').parallel), '前端、後端都沒做＝全部對不上，一定擲中');
});
