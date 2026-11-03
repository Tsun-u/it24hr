// tests/office-toner.test.js（node --test）：第一關「換碳粉匣」整張卡——淑芬的 LIME、查機型三條路、打電話、到貨、換碳粉、結算卡
const test = require('node:test');
const assert = require('node:assert');
const { C } = require('../contract.js');
const { Engine } = require('../engine.js');
const { Sandbox } = require('../sandbox.js');
require('../sandbox-blur.js');

const SHUFEN = '行政 淑芬';
const play = () => new Engine(Sandbox.make('blur', 'legacy'), { name: '測試', title: '工程師' });
const tickTo = (e, minute) => { while (e.clock.minute < minute && !e.ended) e.tick(C.MS_PER_GAME_MIN); };
const asked = () => { const e = play(); tickTo(e, C.DAY_START_MIN + 50); return e; };
const lines = (e, text) => e.docs.filter(d => d.from === SHUFEN && d.text === text);
const ask = (e, who, text) => { const o = e.contactOptions(who).find(x => x.say.startsWith(text)); e.talk(o.talkId, o.i); };
const connect = (e) => { e.dial('mp'); e.press(2); tickTo(e, e.call.until); e.pickUp(); };
const say = (e, text) => e.answer(e.callAnswers().find(a => a.say.startsWith(text)).i);
const acts = (e, ...actions) => actions.map(a => e.benchAct('toner', a));
const swap = (e, series = 'C') => {
  const cart = e.benchState('toner').carts.find(c => c.series === series).id;
  acts(e, { type: 'open' }, { type: 'pullOld' }, { type: 'peel', cart }, { type: 'insert', cart }, { type: 'close' }, { type: 'print' });
};

test('09:50 淑芬傳 LIME 說碳粉不足；之前通訊錄找不到她、也打不了客服', () => {
  const e = play();
  tickTo(e, C.DAY_START_MIN + 49);
  assert.ok(!e.contacts().some(c => c.who === SHUFEN));
  assert.ok(!e.callContacts().length);
  tickTo(e, C.DAY_START_MIN + 50);
  assert.ok(e.docs.some(d => d.id === 'toner_ask' && d.from === SHUFEN));
  assert.ok(e.contacts().some(c => c.who === SHUFEN));
  assert.deepStrictEqual(e.callContacts().map(c => c.who), ['MP 耗材客服專線']);
});

test('問淑芬：只記得「MP-La……什麼的」，報這個客服會掛掉', () => {
  const e = asked();
  ask(e, SHUFEN, '是哪一台印表機');
  tickTo(e, e.clock.minute + 5);
  assert.ok(e.knows.has('toner:partial'));
  connect(e);
  assert.ok(e.callAnswers().some(a => a.say.startsWith('MP-La')));
  say(e, 'MP-La');
  assert.strictEqual(e.call.reason, 'hangup');
  assert.ok(!e.chores.toner.flags.bought);
});

test('去現場翻：轉到印表機背面看到貼紙，就報得出 C8763', () => {
  const e = asked();
  e.walk('shufen');
  e.benchAct('toner', { type: 'sawBack' });
  e.goBack();
  connect(e);
  assert.ok(e.callAnswers().some(a => a.say === 'MP LazyJet C8763'));
  assert.ok(!e.callAnswers().some(a => a.say === 'MP InkJot D87'));
});

test('問阿賢：15 分鐘後信裡有兩台的型號，C8763 和 D87 都報得出來；D87 是噴墨，客服說沒有碳粉匣', () => {
  const e = asked();
  ask(e, '資產室 阿賢', '可以幫我查淑芬');
  const sent = e.clock.minute;
  tickTo(e, sent + 14);
  assert.ok(!e.knows.has('toner:c8763'));
  tickTo(e, sent + 15);
  assert.ok(e.knows.has('toner:c8763') && e.knows.has('toner:d87'));
  connect(e); say(e, 'MP InkJot D87');
  assert.match(e.call.lines[e.call.lines.length - 1], /噴墨/);
  assert.ok(!e.chores.toner.flags.bought);
});

test('整條路：看貼紙 → 打電話報 C8763 → 150 分鐘後送到淑芬那邊 → 換好印出測試頁 → 回座位淑芬道謝', () => {
  const e = asked();
  e.walk('shufen'); e.benchAct('toner', { type: 'sawBack' }); e.goBack();
  connect(e); say(e, 'MP LazyJet C8763');
  tickTo(e, e.clock.minute + C.TONER_DELIVERY_MIN);
  assert.strictEqual(lines(e, '碳粉匣送到了，放在我這邊。').length, 1);
  e.walk('shufen'); swap(e);
  assert.strictEqual(e.chores.toner.stage, 'done');
  e.goBack();
  tickTo(e, e.clock.minute + 1);
  assert.strictEqual(lines(e, '印出來了！謝謝～').length, 1);
});

test('全都要：五盒送來、成就「耗材霸總」、老闆追問材料費、結算卡寫買了 5 盒；淑芬也問用不用得到', () => {
  const e = asked();
  connect(e); say(e, '小孩子才做選擇');
  tickTo(e, e.clock.minute + C.TONER_DELIVERY_MIN);
  assert.strictEqual(lines(e, '訂這麼多都用得到嗎？用不到的話，美玲可能會要你寫檢討報告。').length, 1);
  const r = e.script.report(e);
  assert.ok(r.traits.some(t => t.title === '耗材霸總'));
  assert.ok(r.peers.some(p => p.who === '老闆' && p.text === '這個月的材料設備費支出特別高，你有什麼頭緒嗎？'));
  assert.ok(r.extra.includes('碳粉匣買了 5 盒'));
});

test('沒買碳粉匣：結算卡沒有那行、沒有耗材霸總', () => {
  const e = play(); const r = e.script.report(e);
  assert.ok(!r.extra.some(x => x.startsWith('碳粉匣')));
  assert.ok(!r.traits.some(t => t.title === '耗材霸總'));
});
