// tests/office-call.test.js（node --test）：公務手機打電話——語音選單、等候、接通、回答客服、下單、到貨（劇本 calls）
const test = require('node:test');
const assert = require('node:assert');
const { C } = require('../contract.js');
const { Engine } = require('../engine.js');
const { Sandbox } = require('../sandbox.js');
const { BenchPrinter } = require('../bench-printer.js');
require('../sandbox-blur.js');

// 測試用的電話：跟碳粉匣同一套形狀，答案的條件看 e.knows
const CALL = {
  who: '測試客服', chore: 'printer', when: () => true,
  menu: { prompt: '報修請按 1、耗材請按 2、其他請按 3。', right: 2, wrong: '您輸入的號碼有誤，請重新輸入。',
    press: { 1: { say: '這裡是維修部……耗材的話請重撥喔。', hangup: true }, 3: { say: '現在諮詢都在忙線中……若要報修請輸入1，耗材請輸入2' } } },
  hold: [6, 12], answerWithin: 10,
  greet: '您好，請問印表機的機型是？',
  answers: [
    { say: 'C8763', when: (e) => e.knows.has('c8763'), back: '好的，C 系列一盒。', order: ['C'] },
    { say: 'D87', when: (e) => e.knows.has('d87'), back: '這台沒有碳粉匣喔。', hangup: true },
    { say: '我再查一下', back: '查到再打來喔。', hangup: true },
    { say: '全都要', back: '五個系列各一盒。', order: ['A', 'B', 'C', 'D', 'E'], allIn: true },
  ],
  delivered: { from: '行政 淑芬', text: '碳粉匣送到了，放在我這邊。' },
  bulk: { count: 3, from: '行政 淑芬', text: '訂這麼多都用得到嗎？' },
};
const play = () => {
  const script = Sandbox.make('blur', 'legacy');
  script.chores = [...script.chores, { id: 'printer', title: '測試印表機', from: '行政 淑芬', rules: BenchPrinter }];
  script.calls = { ...(script.calls || {}), test: CALL };
  return new Engine(script, { name: '測試', title: '工程師' });
};
const tickTo = (e, minute) => { while (e.clock.minute < minute && !e.ended) e.tick(C.MS_PER_GAME_MIN); };
const connect = (e) => { e.dial('test'); e.press(2); tickTo(e, e.call.until); assert.strictEqual(e.call.stage, 'ringing'); e.pickUp(); };
const say = (e, text) => e.answer(e.callAnswers().find(a => a.say === text).i);
const fromShufen = (e, text) => e.docs.filter(d => d.from === '行政 淑芬' && d.text === text);

test('撥出先聽語音選單；按 1 轉維修部、掛斷', () => {
  const e = play();
  e.dial('test');
  assert.strictEqual(e.call.stage, 'menu');
  e.press(1);
  assert.strictEqual(e.call.stage, 'ended');
  assert.ok(e.call.lines.some(l => l.includes('維修部')));
});

test('按 3 轉總機念一長串，回到選單（拖時間），再按 2 才排隊', () => {
  const e = play();
  e.dial('test'); e.press(3);
  assert.strictEqual(e.call.stage, 'menu');
  assert.ok(e.call.lines.some(l => l.includes('忙線中')));
  e.press(2);
  assert.strictEqual(e.call.stage, 'hold');
});

test('等候 6～12 分鐘後接通響一聲；10 分鐘內沒接就被掛斷', () => {
  const e = play();
  let connected = 0; e.on('call:connected', () => connected++);
  e.dial('test'); e.press(2);
  const waited = e.call.until - e.clock.minute;
  assert.ok(waited >= 6 && waited <= 12, `等了 ${waited} 分鐘`);
  tickTo(e, e.call.until);
  assert.strictEqual(e.call.stage, 'ringing');
  assert.strictEqual(connected, 1);
  tickTo(e, e.clock.minute + CALL.answerWithin);
  assert.strictEqual(e.call.stage, 'ended');
  assert.strictEqual(e.call.reason, 'timeout');
});

test('客服問機型：只列查得到的答案，沒查就只有「我再查一下」和「全都要」', () => {
  const e = play();
  connect(e);
  assert.deepStrictEqual(e.callAnswers().map(a => a.say), ['我再查一下', '全都要']);
  e.hangUp();
  e.know('c8763'); e.know('d87');
  connect(e);
  assert.deepStrictEqual(e.callAnswers().map(a => a.say), ['C8763', 'D87', '我再查一下', '全都要']);
});

test('報對型號下單，150 分鐘後送到淑芬那邊，工作台桌上多一盒', () => {
  const e = play();
  e.know('c8763'); connect(e); say(e, 'C8763');
  assert.strictEqual(e.call.stage, 'ended');
  const ordered = e.clock.minute;
  tickTo(e, ordered + C.TONER_DELIVERY_MIN - 1);
  assert.strictEqual(fromShufen(e, CALL.delivered.text).length, 0);
  tickTo(e, ordered + C.TONER_DELIVERY_MIN);
  assert.strictEqual(fromShufen(e, CALL.delivered.text).length, 1);
  assert.deepStrictEqual(e.benchState('printer').carts.map(c => c.series), ['C']);
  assert.strictEqual(e.chores.printer.flags.bought, 1);
});

test('可以重複訂：每次各自送到；碳粉匣總數到三盒時淑芬說一聲（只說一次）', () => {
  const e = play();
  e.know('c8763');
  connect(e); say(e, 'C8763');
  tickTo(e, e.clock.minute + 20);
  connect(e); say(e, 'C8763');
  tickTo(e, e.clock.minute + C.TONER_DELIVERY_MIN + 1);
  assert.strictEqual(e.benchState('printer').carts.length, 2);
  assert.strictEqual(fromShufen(e, CALL.bulk.text).length, 0);
  connect(e); say(e, 'C8763');
  tickTo(e, e.clock.minute + C.TONER_DELIVERY_MIN + 1);
  assert.strictEqual(e.benchState('printer').carts.length, 3);
  assert.strictEqual(fromShufen(e, CALL.bulk.text).length, 1);
  assert.strictEqual(e.chores.printer.flags.bought, 3);
});

test('全都要：五盒一起送到、記 allIn；總數超過三盒淑芬也會說', () => {
  const e = play();
  connect(e); say(e, '全都要');
  tickTo(e, e.clock.minute + C.TONER_DELIVERY_MIN + 1);
  assert.deepStrictEqual(e.benchState('printer').carts.map(c => c.series), ['A', 'B', 'C', 'D', 'E']);
  assert.ok(e.chores.printer.flags.allIn);
  assert.strictEqual(fromShufen(e, CALL.bulk.text).length, 1);
});

test('報噴墨那台：客服掛掉、不下單', () => {
  const e = play();
  e.know('d87'); connect(e); say(e, 'D87');
  assert.strictEqual(e.call.stage, 'ended');
  assert.ok(!e.chores.printer.flags.bought);
});

test('通話中不能再撥；掛斷後可以重撥', () => {
  const e = play();
  e.dial('test');
  assert.strictEqual(e.dial('test'), false);
  e.hangUp();
  assert.notStrictEqual(e.dial('test'), false);
});

test('撥號鍵盤：按過的鍵記在 call.keys；選單沒有的鍵（含 * #）念 wrong，不掛斷也不排隊', () => {
  const e = play();
  e.dial('test');
  e.press('7'); e.press('#');
  assert.strictEqual(e.call.stage, 'menu');
  assert.strictEqual(e.call.keys, '7#');
  assert.deepStrictEqual(e.call.lines.slice(-2), [CALL.menu.wrong, CALL.menu.wrong]);
  e.press('2');
  assert.strictEqual(e.call.stage, 'hold', '數字鍵用字串按也接得上 right: 2');
});

test('正式上班桌上有自己寫的便條，沒有寫程式用的 HTTP 對照表', () => {
  const e = new Engine(Sandbox.make('blur', 'legacy'), { name: '測試', title: '工程師' });
  const note = e.papers.find(p => p.id === 'note');
  assert.match(note.text, /LIME/);
  assert.match(note.text, /公務手機/);
  assert.ok(!e.papers.some(p => p.id === 'http_note'));
});

test('公務手機有電量：一早四成，閒置幾乎不掉，通話中（含等候）每分鐘掉比較快', () => {
  const e = play();
  assert.strictEqual(e.devices.work, 40);
  tickTo(e, C.DAY_START_MIN + 10);
  const idle = e.devices.work;
  assert.ok(idle >= 39, `閒置十分鐘只掉一點（剩 ${idle}）`);
  e.dial('test'); e.press(2);
  tickTo(e, C.DAY_START_MIN + 15);
  assert.ok(e.devices.work <= idle - 4, `通話五分鐘掉比較多（${idle} → ${e.devices.work}）`);
});

test('公務手機講到沒電：電話直接斷，沒充電前撥不出去；插上排插充回來就能打', () => {
  const e = play();
  e.devices.work = 2;
  e.dial('test'); e.press(2);
  tickTo(e, C.DAY_START_MIN + 4);
  assert.strictEqual(e.call.stage, 'ended');
  assert.strictEqual(e.call.reason, 'dead');
  assert.strictEqual(e.call.lines.at(-1), '……手機沒電了。');
  assert.ok(e.workPhoneDead());
  assert.strictEqual(e.dial('test'), false);
  e.charge('work');
  tickTo(e, e.clock.minute + 2);
  assert.ok(!e.workPhoneDead());
  assert.ok(e.dial('test'));
});
