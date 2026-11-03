// tests/office-wifi.test.js（node --test）：第一關「老闆娘的 Wi-Fi」整張卡——11:00 來桌邊、三條路、正解、四個錯誤、催促、結算卡
const test = require('node:test');
const assert = require('node:assert');
const { C } = require('../contract.js');
const { Engine } = require('../engine.js');
const { Sandbox } = require('../sandbox.js');
const { WifiRules: W } = require('../wifi-rules.js');
require('../sandbox-blur.js');

const WIFE = '老闆娘';
const play = () => new Engine(Sandbox.make('blur', 'legacy'), { name: '測試', title: '工程師' });
const tickTo = (e, minute) => { while (e.clock.minute < minute && !e.ended) e.tick(C.MS_PER_GAME_MIN); };
const at = (h, m) => h * 60 + m;
const visited = () => { const e = play(); tickTo(e, at(11, 0)); e.talkTo('wifi_visit'); return e; };
const lines = (e, from) => e.docs.filter(d => d.from === from && d.origin === 'line').map(d => d.text);
const act = (e, ...actions) => actions.map(a => e.benchAct('wifi', a));
const peers = (e) => e.script.report(e).peers.map(p => `${p.who}：${p.text}`);

test('11:00 老闆娘走到桌邊；講完她的話進文件，LIME 找得到她、問得到「換了新手機」', () => {
  const e = play();
  tickTo(e, at(10, 59));
  assert.strictEqual(e.visitor, null);
  tickTo(e, at(11, 0));
  assert.strictEqual(e.visitor && e.visitor.id, 'wifi_visit');
  assert.deepStrictEqual(e.visitor.replies.map(r => r.say), ['「手機給我看看」', '「等等去找你」']);
  e.talkTo('wifi_visit');
  assert.ok(e.docs.some(d => d.id === 'wifi_visit'));
  const right = e.contactOptions(WIFE).find(o => o.say.startsWith('最近有換手機'));
  e.talk(right.talkId, right.i);
  tickTo(e, e.clock.minute + 5);
  assert.ok(lines(e, WIFE).includes('我什麼都沒動，只是換了新手機，舊手機都好好的。'));
});

test('開始聽她講話之後，等你回話等多久都不會留紙走掉；沒理她 15 分鐘就留紙', () => {
  const listened = play();
  tickTo(listened, at(11, 0));
  listened.listenTo('wifi_visit');
  tickTo(listened, at(11, 30));
  assert.strictEqual(listened.visitor && listened.visitor.id, 'wifi_visit');
  assert.ok(!listened.papers.some(p => p.id === 'wifi_visit'));
  const ignored = play();
  tickTo(ignored, at(11, 16));
  assert.strictEqual(ignored.visitor, null);
  assert.ok(ignored.papers.some(p => p.id === 'wifi_visit'));
});

test('正解：在她旁邊關掉私人位址、回座位把真正的 MAC 加進白名單 → 結案，她一分鐘後傳 LIME 道謝', () => {
  const e = visited();
  act(e, { type: 'togglePrivate', inPerson: true });
  assert.notStrictEqual(e.chores.wifi.stage, 'done');
  act(e, { type: 'whitelist', mac: W.REAL_MAC });
  assert.strictEqual(e.chores.wifi.stage, 'done');
  tickTo(e, e.clock.minute + 2);
  assert.ok(lines(e, WIFE).includes('連上了，謝謝！'));
  assert.ok(peers(e).includes(`${WIFE}：還是你們 IT 厲害。`));
});

test('當面弄好（最後一步在她旁邊做）：算當面道謝過了，不再傳 LIME', () => {
  const e = visited();
  act(e, { type: 'whitelist', mac: W.REAL_MAC }, { type: 'togglePrivate', inPerson: true });
  assert.strictEqual(e.chores.wifi.stage, 'done');
  tickTo(e, e.clock.minute + 3);
  assert.ok(!lines(e, WIFE).includes('連上了，謝謝！'));
});

test('只登記私人位址：算結案，結算卡小潘多一句', () => {
  const e = visited();
  act(e, { type: 'whitelist', mac: W.PRIVATE_MAC });
  assert.strictEqual(e.chores.wifi.stage, 'done');
  assert.ok(peers(e).includes('同事 小潘：登記的是私人位址，哪天她重設網路就又連不上了。'));
});

test('重開基地台：君傑、淑芬、美玲接連抱怨，結算卡記次數', () => {
  const e = visited();
  act(e, { type: 'reboot' });
  tickTo(e, e.clock.minute + 4);
  assert.ok(lines(e, '業務 君傑').includes('網路是不是斷了？報價單送不出去。'));
  assert.ok(lines(e, '行政 淑芬').includes('印表機也連不到了耶。'));
  assert.ok(lines(e, '財務 美玲').includes('IT，網路斷了，我報表跑到一半。'));
  assert.ok(e.script.report(e).extra.includes('重開基地台 1 次'));
});

test('關掉過濾：馬上結案，30 分鐘後資安來信', () => {
  const e = visited();
  act(e, { type: 'filter', on: false });
  assert.strictEqual(e.chores.wifi.stage, 'done');
  tickTo(e, e.clock.minute + 29);
  assert.ok(!e.docs.some(d => d.origin === 'mail' && d.from === '資安 畇蓁'));
  tickTo(e, e.clock.minute + 2);
  assert.ok(e.docs.some(d => d.origin === 'mail' && d.from === '資安 畇蓁'));
});

test('訪客網路：先結案，30 分鐘後她說印不到、雜事重新打開；照正解做完再結案', () => {
  const e = visited();
  act(e, { type: 'join', network: 'guest', inPerson: true });
  assert.strictEqual(e.chores.wifi.stage, 'done');
  tickTo(e, e.clock.minute + 31);
  assert.ok(lines(e, WIFE).includes('怎麼印不出來？印表機找不到。'));
  assert.strictEqual(e.chores.wifi.stage, 'doing');
  act(e, { type: 'join', network: 'office', inPerson: true }, { type: 'togglePrivate', inPerson: true }, { type: 'whitelist', mac: W.REAL_MAC });
  assert.strictEqual(e.chores.wifi.stage, 'done');
});

test('13:00 還沒好她會催；已經好了就不催', () => {
  const slow = visited();
  tickTo(slow, at(13, 1));
  assert.ok(lines(slow, WIFE).includes('好了嗎？我下午要開視訊會議。'));
  const fast = visited();
  act(fast, { type: 'filter', on: false });
  tickTo(fast, at(13, 1));
  assert.ok(!lines(fast, WIFE).includes('好了嗎？我下午要開視訊會議。'));
});
