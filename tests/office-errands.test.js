// tests/office-errands.test.js（node --test）：第一關的小事件池——每天從四件抽三件、排在 10:20／14:40／16:20，
// LIME 來；回「好，我過去。」跑一趟（時間過掉、走了 N 趟 +1、回到自己座位），推掉或不回，對方那句進結算卡同事評語
const test = require('node:test');
const assert = require('node:assert');
const { C } = require('../contract.js');
const { Engine } = require('../engine.js');
const { Sandbox } = require('../sandbox.js');
require('../sandbox-blur.js');

const play = () => new Engine(Sandbox.make('blur', 'legacy'), { name: '測試', title: '工程師' });
const tickTo = (e, minute) => { while (e.clock.minute < minute && !e.ended) e.tick(C.MS_PER_GAME_MIN); };
const at = (h, m) => h * 60 + m;
const errandDocs = (e) => e.docs.filter(d => d.errand);
const POOL = ['water', 'aircon', 'font', 'projector'];
const DECLINES = {
  water: { who: '業務 君傑', text: '你們 IT 不是什麼都會？' },
  aircon: { who: '行政 淑芬', text: '冷氣是電器，IT 要負責吧？' },
  font: { who: '老闆', text: '手機不是 IT 要處理嗎？' },
  projector: { who: '財務 美玲', text: 'IT 不幫我們處理投影機我們怎麼開會？' },
};
const peers = (e) => e.script.report(e).peers;

test('每天從四件抽三件，排在 10:20、14:40、16:20，都用 LIME 來', () => {
  const e = play();
  assert.strictEqual(e.errands.length, 3);
  assert.ok(e.errands.every(x => POOL.includes(x.id)));
  assert.strictEqual(new Set(e.errands.map(x => x.id)).size, 3);
  assert.deepStrictEqual(e.errands.map(x => x.at), [80, 340, 440]);
  tickTo(e, at(10, 19));
  assert.strictEqual(errandDocs(e).length, 0);
  tickTo(e, at(10, 21));
  assert.strictEqual(errandDocs(e).length, 1);
  assert.strictEqual(errandDocs(e)[0].origin, 'line');
  tickTo(e, at(16, 21));
  assert.strictEqual(errandDocs(e).length, 3);
});

test('回「好，我過去。」：送出 errand:go；跑完那件的分鐘數過掉、走了 N 趟 +1、回到自己座位、結算卡沒有他那句', () => {
  const e = play();
  tickTo(e, at(10, 21));
  const doc = errandDocs(e)[0]; const errand = e.errands[0];
  let go = null; e.on('errand:go', (x) => { go = x; });
  e.walk('junjie');
  e.replyTo(doc.id, [0]);
  assert.strictEqual(go.id, errand.id);
  assert.ok(go.tripText);
  const before = e.clock.minute; const trips = e.stats.trips;
  e.errandTrip(go.id);
  assert.strictEqual(e.clock.minute, before + errand.trip);
  assert.strictEqual(e.stats.trips, trips + 1);
  assert.strictEqual(e.place, 'desk');
  assert.ok(!peers(e).some(p => p.text === DECLINES[errand.id].text));
  assert.strictEqual(e.errandTrip(go.id), null, '跑過了不再跑');
  tickTo(e, e.clock.minute + 3);
  assert.deepStrictEqual(e.docs.filter(d => d.kind === 'sticker' && d.from === errand.who).map(d => d.sticker), ['thumb'], '跑完回來看到對方回讚');
});

test('回「我現在走不開。」：對方兩分鐘後回推掉那句，結算卡同事評語有那句', () => {
  const e = play();
  tickTo(e, at(10, 21));
  const doc = errandDocs(e)[0]; const { who, text } = DECLINES[e.errands[0].id];
  e.replyTo(doc.id, [1]);
  tickTo(e, e.clock.minute + 2);
  assert.ok(e.docs.some(d => d.from === who && d.text === text));
  assert.ok(peers(e).some(p => p.who === who && p.text === text));
});

test('（已讀）或一直沒回：結算卡一樣出那句；還沒來的不算', () => {
  const e = play();
  tickTo(e, at(10, 21));
  e.replyTo(errandDocs(e)[0].id, [2]);
  tickTo(e, at(14, 41));
  const said = peers(e).map(p => p.text);
  for (const x of e.errands.slice(0, 2)) assert.ok(said.includes(DECLINES[x.id].text), x.id);
  assert.ok(!said.includes(DECLINES[e.errands[2].id].text), '16:20 那件還沒來');
});
