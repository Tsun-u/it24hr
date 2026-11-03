const test = require('node:test');
const assert = require('node:assert');
const { Sandbox } = require('../sandbox.js');
require('../sandbox-blur.js');

test('第一關照時代產劇本：kind、level、mode、議題從 300 起、有茶几', () => {
  for (const mode of ['legacy', 'hybrid', 'speedrun']) {
    const s = Sandbox.make('blur', mode);
    assert.strictEqual(s.kind, 'sandbox');
    assert.strictEqual(s.level, 'blur');
    assert.strictEqual(s.mode, mode);
    assert.strictEqual(s.issueBase, 300);
    assert.ok(s.home);
  }
});

test('沒登記的關卡要報錯', () => {
  assert.throws(() => Sandbox.make('nope', 'legacy'), /沒有這一關/);
});

// 抽關（設計稿「沙盒模式的劇本制」）：按上班進抽關畫面，抽到的可以重抽；玩過的關可以直接選。
// 「玩過」＝任何一個時代玩完過一次（三個時代問題相同，只換代價）
test('抽關：重抽避開現在這關；只剩這關時照樣抽得到', () => {
  Sandbox.add('test-other', () => ({ name: '測試用的另一關' }));
  try {
    assert.strictEqual(Sandbox.draw(['blur'], () => 0), 'test-other');
    assert.ok(Sandbox.ids().includes(Sandbox.draw(Sandbox.ids(), () => 0)));
  } finally { Sandbox.remove('test-other'); }
});

test('玩過的關卡列得出來（抽關畫面直接選用）', () => {
  assert.deepStrictEqual(Sandbox.opened(null), []);
  const save = Sandbox.record(null, 'blur', 'hybrid', { report: 1 }, '2026-11-03');
  assert.deepStrictEqual(Sandbox.opened(save), ['blur']);
});

test('每一關都有說明', () => {
  for (const id of Sandbox.ids()) assert.ok(Sandbox.make(id, 'legacy').brief, id);
});

test('存檔紀錄照關卡和時代分開，次數往上加，不動到別的關', () => {
  let save = Sandbox.record(null, 'blur', 'legacy', { report: 1 }, '2026-11-03');
  save = Sandbox.record(save, 'blur', 'legacy', { report: 2 }, '2026-11-04');
  save = Sandbox.record(save, 'blur', 'hybrid', { report: 3 }, '2026-11-04');
  assert.deepStrictEqual(Sandbox.last(save, 'blur', 'legacy'), { view: { report: 2 }, at: '2026-11-04', plays: 2 });
  assert.strictEqual(Sandbox.last(save, 'blur', 'hybrid').plays, 1);
  assert.strictEqual(Sandbox.last(save, 'blur', 'speedrun'), null);
});

// ── engine：雜事、走動、結算卡 ──
const { Engine } = require('../engine.js');
const { C } = require('../contract.js');
const tickTo = (e, minute) => { while (e.clock.minute < minute && !e.ended) e.tick(C.MS_PER_GAME_MIN); };
const at = (h, m = 0) => h * 60 + m;
const play = (mode = 'legacy') => new Engine(Sandbox.make('blur', mode), { name: '測試', title: '工程師' });
const draft = { type: 'feature', parent: null, module: null, assignee: 'me', sentences: [0, 2], attach: true };   // 跟開卡畫面送出的欄位一樣

test('09:20 君傑的 LIME 帶著 ram 雜事，雜事一開始是還沒動', () => {
  const e = play();
  tickTo(e, at(9, 21));
  const doc = e.docs.find(d => d.id === 'ram_ask');
  assert.ok(doc); assert.strictEqual(doc.chore, 'ram');
  assert.strictEqual(e.chores.ram.stage, 'new');
});

test('開卡會掛上雜事；卡結案了雜事照樣在、照樣能往下走', () => {
  const e = play();
  tickTo(e, at(9, 21));
  const card = e.openCardFrom('ram_ask', draft);
  assert.strictEqual(card.chore, 'ram');
  assert.ok(card.no >= 301);
  e.closeCard(card.id);
  assert.strictEqual(card.status, 'archived');
  e.choreSet('ram', { stage: 'done' }, '裝好了');
  assert.strictEqual(e.chores.ram.stage, 'done');
  assert.strictEqual(e.chores.ram.log.at(-1).text, '裝好了');
});

// 去程、回程各算一趟：結算卡寫「走了 N 趟」，來回算兩趟才看得出跑腿多累
test('走到座位要花時間、去回各算一趟；人在座位不能下班', () => {
  const e = play();
  tickTo(e, at(18));
  const before = e.clock.minute;
  assert.strictEqual(e.walk('junjie'), true);
  assert.strictEqual(e.place, 'junjie');
  assert.strictEqual(e.clock.minute, before + C.WALK_MIN);
  assert.strictEqual(e.stats.trips, 1);
  assert.strictEqual(e.canLeave(), false);
  assert.strictEqual(e.walk('junjie'), false, '已經不在座位上，不能再走去別的座位');
  e.goBack();
  assert.strictEqual(e.place, 'desk');
  assert.strictEqual(e.stats.trips, 2);
  assert.strictEqual(e.canLeave(), true);
});

test('沒有這個座位就走不過去', () => {
  const e = play();
  assert.strictEqual(e.walk('nobody'), false);
  assert.strictEqual(e.stats.trips, 0);
});

test('結算卡帶上劇本多的行', () => {
  const e = play();
  tickTo(e, at(10));
  e.walk('junjie'); e.goBack();
  const report = e.report();
  assert.ok(report.lines.some(l => l.includes('走了 2 趟')), report.lines.join('\n'));
  assert.ok(report.lines.some(l => l.includes('程式：0 行')));
});

test('人在同事座位時被趕下班：先回到自己座位，畫面跟著換', () => {
  const e = play();
  tickTo(e, at(18));
  e.walk('junjie');
  const places = []; e.on('place:changed', (p) => places.push(p));
  e.leave({ forced: true });
  assert.strictEqual(e.place, 'desk');
  assert.deepStrictEqual(places, ['desk']);
});

test('正式上班整天：早會、開卡、走一趟、結案、下班回家睡到隔天 08:00 結算', () => {
  const e = play('hybrid');
  tickTo(e, at(9, 21));
  const card = e.openCardFrom('ram_ask', draft);
  e.walk('junjie'); e.goBack();
  e.closeCard(card.id);
  tickTo(e, C.OFF_WORK_MIN);
  e.leave();
  let ended = null; e.on('day:end', (r) => { ended = r; });
  e.goHome({ channel: 'pickup', order: { bubble_tea: 1 } });
  e.sleep({ dnd: true });
  assert.ok(ended, '睡到隔天 08:00 有結算');
  assert.ok(ended.lines.some(l => l.includes('走了 2 趟')), ended.lines.join('\n'));
  assert.ok(ended.lines.some(l => l.includes('程式：0 行')));
});
