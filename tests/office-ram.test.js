const test = require('node:test');
const assert = require('node:assert');
const { C } = require('../contract.js');
const { Engine } = require('../engine.js');
const { Sandbox } = require('../sandbox.js');
require('../sandbox-blur.js');

const play = () => new Engine(Sandbox.make('blur', 'legacy'), { name: '測試', title: '工程師' });
const tickTo = (e, minute) => { while (e.clock.minute < minute && !e.ended) e.tick(C.MS_PER_GAME_MIN); };
const acts = (e, ...actions) => actions.map(a => e.benchAct('ram', a));
// 到君傑座位：存檔、關機、拔電、拆側板
const openUp = (e) => {
  e.walk('junjie');
  acts(e, { type: 'screen', target: 'save' }, { type: 'screen', target: 'start' }, { type: 'screen', target: 'shutdown' }, { type: 'shutdownDone' },
    { type: 'plug' }, { type: 'screw', i: 0 }, { type: 'screw', i: 1 }, { type: 'screw', i: 2 }, { type: 'panel', holding: false });
};
// 料箱每輪隨機：找那條君傑能用的 DDR4 8GB 桌機用
const good = (e) => e.benchState('ram').sticks.find(s => s.id !== 'old' && s.gen === 'DDR4' && s.form === 'DIMM' && s.size === 8).id;
const lime = (e, text) => e.docs.filter(d => d.from === '業務 君傑' && d.text === text);

test('工作台狀態第一次打開才建，之後是同一份；料箱照劇本', () => {
  const e = play();
  const s = e.benchState('ram');
  assert.strictEqual(e.benchState('ram'), s);
  const sticks = e.partsBox().sticks;
  assert.ok(sticks.length >= 3 && sticks.length <= 4);
  assert.ok(sticks.some(x => x.gen === 'DDR4' && x.form === 'DIMM' && x.size === 8), '一定有君傑能用的那條');
});

test('雜事階段：動手了是處理中，開機看到 16 GB 是做完了', () => {
  const e = play(); tickTo(e, C.DAY_START_MIN + 30);
  openUp(e);
  assert.strictEqual(e.chores.ram.stage, 'doing');
  e.goBack(); e.takeStick('ram', good(e)); e.walk('junjie');
  acts(e, { type: 'insert', stick: good(e), slot: 'B2', flipped: false }, { type: 'plug' }, { type: 'power' });
  assert.strictEqual(e.chores.ram.stage, 'done');
});

// 裝好、走回自己座位：君傑傳 LIME 問怎麼沒想像中快，玩家回哪句都算結束
const finishAndGoBack = () => {
  const e = play(); tickTo(e, C.DAY_START_MIN + 30);
  openUp(e); e.goBack(); e.takeStick('ram', good(e)); e.walk('junjie');
  acts(e, { type: 'insert', stick: good(e), slot: 'B2', flipped: false }, { type: 'plug' }, { type: 'power' });
  return e;
};
const SLOW = '有了有了，記憶體變大了！可是怎麼沒有想像中的快？';

test('裝好收工時君傑不在旁邊講話；回座位一分鐘後他傳 LIME，只傳一次', () => {
  const e = finishAndGoBack();
  const said = []; e.on('seat:say', (x) => said.push(x.text));
  e.closeBench('ram');
  assert.deepStrictEqual(said, []);
  assert.strictEqual(lime(e, SLOW).length, 0, '人還在他座位不會傳');
  e.goBack(); const at = e.clock.minute;
  tickTo(e, at + 1);
  assert.strictEqual(lime(e, SLOW).length, 1);
  e.walk('junjie'); e.goBack(); tickTo(e, e.clock.minute + 3);
  assert.strictEqual(lime(e, SLOW).length, 1, '再走一趟不會再傳');
});

test('君傑那則可以回兩句，各有各的接話', () => {
  const backFor = (i) => {
    const e = finishAndGoBack(); e.goBack(); tickTo(e, e.clock.minute + 1);
    const msg = lime(e, SLOW)[0];
    assert.ok(e.replyTo(msg.id, [i]));
    tickTo(e, e.clock.minute + 3);
    return e.docs.filter(d => d.from === '業務 君傑' && d.id.startsWith(`${msg.id}:re`)).map(d => d.text);
  };
  assert.deepStrictEqual(backFor(0), ['哭喔']);
  assert.deepStrictEqual(backFor(1), ['美玲姐每次都要我分析換新電腦的效益，很麻煩啦！']);
});

test('報價單沒存就關機：記在雜事上', () => {
  const e = play(); e.walk('junjie');
  acts(e, { type: 'power' });
  assert.strictEqual(e.chores.ram.flags.lostExcel, true);
});

test('電腦拆到一半離開：君傑每 10 分鐘催，30 分鐘自己把舊的拔下來；走回去看到「我幫你拆好了！」', () => {
  const e = play(); tickTo(e, C.DAY_START_MIN + 30);
  openUp(e); e.goBack();
  const left = e.clock.minute;
  tickTo(e, left + C.RAM_NAG_MIN);
  assert.strictEqual(lime(e, '好了沒？').length, 1);
  tickTo(e, left + C.RAM_DIY_MIN);
  assert.strictEqual(lime(e, '我幫你拆好了！').length, 1);
  assert.strictEqual(e.benchState('ram').sticks.find(x => x.id === 'old').where, 'desk');
  const said = []; e.on('seat:say', (x) => said.push(x.text));
  e.walk('junjie');
  assert.deepStrictEqual(said, ['我幫你拆好了！']);
  const before = lime(e, '好了沒？').length;
  tickTo(e, e.clock.minute + C.RAM_NAG_MIN * 2);
  assert.strictEqual(lime(e, '好了沒？').length, before, '人回來了就不催');
});

test('電腦還開著就離開：君傑可以工作，不催', () => {
  const e = play(); tickTo(e, C.DAY_START_MIN + 30);
  e.walk('junjie'); e.benchState('ram'); e.goBack();
  tickTo(e, e.clock.minute + C.RAM_DIY_MIN + 5);
  assert.strictEqual(lime(e, '好了沒？').length, 0);
});

test('君傑還沒開口就走過去：他當面問，請求變成口頭的文件，09:20 不再傳 LIME，結算卡拿到「先發制人」', () => {
  const e = play();
  const said = []; e.on('seat:say', (x) => said.push(x.text));
  e.walk('junjie');
  assert.deepStrictEqual(said, ['你會通靈嗎？我正好想換記憶體，你來幫我看看。']);
  const doc = e.docs.find(d => d.id === 'ram_ask');
  assert.strictEqual(doc.origin, 'boss'); assert.strictEqual(doc.chore, 'ram');
  e.goBack(); tickTo(e, C.DAY_START_MIN + 30);
  assert.strictEqual(e.docs.filter(d => d.id === 'ram_ask').length, 1);
  assert.ok(e.script.report(e).traits.some(t => t.title === '先發制人'));
  e.walk('junjie');
  assert.strictEqual(said.length, 1, '只問一次');
});

test('君傑開口之後才走過去：照 LIME 來，沒有先發制人', () => {
  const e = play(); tickTo(e, C.DAY_START_MIN + 25);
  e.walk('junjie');
  assert.strictEqual(e.docs.find(d => d.id === 'ram_ask').origin, 'line');
  assert.ok(!(e.script.report(e).traits || []).some(t => t.title === '先發制人'));
});

test('料箱只在自己座位拿得到', () => {
  const e = play(); e.walk('junjie');
  e.takeStick('ram', good(e));
  assert.strictEqual(e.benchState('ram').sticks.find(x => x.id === good(e)).where, 'box');
});

test('裝好的結果決定結算卡的評語：雙通道小潘、單通道阿明', () => {
  const finish = (slot) => {
    const e = play(); tickTo(e, C.DAY_START_MIN + 30); openUp(e);
    e.goBack(); e.takeStick('ram', good(e)); e.walk('junjie');
    acts(e, { type: 'insert', stick: good(e), slot, flipped: false }, { type: 'plug' }, { type: 'power' });
    return e.script.report(e).peers;
  };
  assert.deepStrictEqual(finish('B2').map(p => p.who), ['同事 小潘']);
  assert.match(finish('A1')[0].text, /32GB/);
});

test('插 4GB 變 12 GB：插在同一組小潘說也是有變多，插錯槽小潘懷疑你看君傑不爽', () => {
  const peerFor = (text) => { const e = play(); e.chores.ram.flags.shown = { size: 12, text }; return e.script.report(e).peers; };
  assert.match(peerFor('12 GB（雙通道）')[0].text, /也是有變多/);
  assert.match(peerFor('12 GB（單通道）')[0].text, /不爽很久/);
});

test('機殼轉了幾圈跨好幾次開工作台累加，結算卡多一行', () => {
  const e = play();
  assert.ok(!e.script.report(e).extra.some(x => x.startsWith('機殼')), '沒轉過不列');
  e.benchTurned('ram'); e.benchTurned('ram'); e.benchTurned('ram');
  assert.strictEqual(e.stats.turns, 3);
  assert.ok(e.script.report(e).extra.includes('機殼轉了 3 圈'));
});
