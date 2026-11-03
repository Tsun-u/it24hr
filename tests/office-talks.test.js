// tests/office-talks.test.js（node --test）：第一關的主動傳訊跟著雜事收尾——做完就不能再傳，重新打開又回來；沒做完就結案視同沒做完（粉飾太平），沒碰卡（我就爛）
const test = require('node:test');
const assert = require('node:assert');
const { C } = require('../contract.js');
const { Engine } = require('../engine.js');
const { Sandbox } = require('../sandbox.js');
require('../sandbox-blur.js');

const JUNJIE = '業務 君傑';
const MEILING = '財務 美玲';
const PAN = '同事 小潘';
const play = () => new Engine(Sandbox.make('blur', 'legacy'), { name: '測試', title: '工程師' });
const tickTo = (e, minute) => { while (e.clock.minute < minute && !e.ended) e.tick(C.MS_PER_GAME_MIN); };
const at = (h, m) => h * 60 + m;
const topic = (e, who, talkId) => e.contactOptions(who).filter(o => o.talkId === talkId);

test('記憶體做完：君傑、阿賢、小潘的記憶體話題都收掉，小潘別的話題照舊', () => {
  const e = play(); tickTo(e, at(13, 31));
  assert.ok(e.contactOptions(JUNJIE).length > 0);
  assert.ok(topic(e, PAN, 'pan_ram').length > 0 && topic(e, PAN, 'pan_outlook').length > 0);
  e.choreSet('ram', { stage: 'done' });
  assert.deepStrictEqual(e.contactOptions(JUNJIE), []);
  assert.deepStrictEqual(topic(e, PAN, 'pan_ram'), []);
  assert.ok(!e.contacts().some(c => c.ids.includes('axian')));
  assert.ok(topic(e, PAN, 'pan_outlook').length > 0, '信箱還沒處理，小潘那題還能問');
});

test('卡沒做完就結案，視同沒做完：話題照樣開著，結算卡多「粉飾太平」', () => {
  const e = play(); tickTo(e, at(13, 31));
  const ask = e.docs.find(d => d.id === 'outlook_ask');
  const card = e.openCardFrom(ask.id, { assignee: 'me', sentences: [0] });
  e.closeCard(card.id);
  assert.ok(e.contactOptions(MEILING).length > 0, '信箱還是滿的，美玲的話題沒收');
  assert.ok(e.finishDay().traits.some(t => t.title === '粉飾太平'));
});

test('事情做完了才結案：不算粉飾太平', () => {
  const e = play(); tickTo(e, at(13, 31));
  const ask = e.docs.find(d => d.id === 'outlook_ask');
  const card = e.openCardFrom(ask.id, { assignee: 'me', sentences: [0] });
  for (const a of [{ type: 'delete', ids: ['video', 'drafts'] }, { type: 'purge', inPerson: true }]) e.benchAct('outlook', a);
  assert.strictEqual(e.chores.outlook.stage, 'done');
  e.closeCard(card.id);
  assert.ok(!e.finishDay().traits.some(t => t.title === '粉飾太平'));
});

test('我就爛：正式上班一整天一張卡都沒打開，印章 null；打開過卡就不是', () => {
  const lazy = play(); tickTo(lazy, at(10, 0));
  const r = lazy.finishDay();
  assert.strictEqual(r.kind, 'null'); assert.ok(r.traits.some(t => t.title === '我就爛'));
  const busy = play(); tickTo(busy, at(10, 0));
  const card = busy.openCardFrom('ram_ask', { assignee: 'me', sentences: [0] });
  busy.openCard(card.id);
  assert.ok(!busy.finishDay().traits.some(t => t.title === '我就爛'));
});

test('信箱清完收尾；60 分鐘後又爆、雜事重新打開，美玲的話題回來', () => {
  const e = play(); tickTo(e, at(13, 31));
  for (const a of [{ type: 'delete', ids: ['video'] }, { type: 'purge', inPerson: true }]) e.benchAct('outlook', a);
  assert.deepStrictEqual(e.contactOptions(MEILING), []);
  tickTo(e, e.clock.minute + 61);
  assert.strictEqual(e.chores.outlook.stage, 'doing');
  assert.ok(e.contactOptions(MEILING).length > 0);
});

test('已經傳出去的，話題收掉了照樣會回', () => {
  const e = play(); tickTo(e, at(9, 21));
  const o = e.contactOptions(JUNJIE)[0];
  e.talk(o.talkId, o.i);
  assert.strictEqual(e.contactWaiting(JUNJIE), 'line');
  e.choreSet('ram', { stage: 'done' });
  assert.strictEqual(e.contactWaiting(JUNJIE), 'line', '對方輸入中照樣顯示');
  tickTo(e, e.clock.minute + 7);
  assert.ok(e.docs.some(d => d.id === `talk:junjie:1:re`));
});
