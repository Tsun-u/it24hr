// tests/office-bench.test.js（node --test）：工作台的通用接口——完成、記旗標、手上拿的東西、轉圈，都問各張卡自己的規則
const test = require('node:test');
const assert = require('node:assert');
const { C } = require('../contract.js');
const { Engine } = require('../engine.js');
const { Sandbox } = require('../sandbox.js');
require('../sandbox-blur.js');

// 測試用的另一張帶工作台的雜事：狀態裡沒有記憶體條，按 fix 就修好
const FakeRules = {
  init: () => ({ ok: false, holding: 0 }),
  apply: (prev, action) => {
    const state = { ...prev }; const out = { state, say: '', events: [] };
    if (action.type === 'fix') { state.ok = true; out.done = true; out.say = '修好了。'; }
    if (action.type === 'note') out.flags = { noted: action.text };
    if (action.type === 'grab') state.holding += 1;
    return out;
  },
  carrying: (state) => ({ items: [], heavy: state.holding >= 2 }),
};
const play = () => {
  const script = Sandbox.make('blur', 'legacy');
  script.chores = [...script.chores, { id: 'fake', title: '測試用', from: '行政 淑芬', rules: FakeRules }];
  return new Engine(script, { name: '測試', title: '工程師' });
};

test('規則回 done 就結案，別張卡不受影響', () => {
  const e = play();
  e.benchAct('fake', { type: 'fix' });
  assert.strictEqual(e.chores.fake.stage, 'done');
  assert.strictEqual(e.chores.ram.stage, 'new');
});

test('規則回的 flags 併進雜事的旗標', () => {
  const e = play();
  e.benchAct('fake', { type: 'note', text: '貼紙' });
  assert.strictEqual(e.chores.fake.flags.noted, '貼紙');
  assert.notStrictEqual(e.chores.fake.stage, 'done');
});

test('狀態裡沒有記憶體條的工作台，走路照樣算得出分鐘；手上拿重的才多走', () => {
  const e = play();
  e.benchState('fake');
  assert.strictEqual(e.walkMinutes(), C.WALK_MIN);
  e.benchAct('fake', { type: 'grab' }); e.benchAct('fake', { type: 'grab' });
  assert.strictEqual(e.walkMinutes(), C.WALK_MIN + C.BOX_WALK_EXTRA_MIN);
});

test('轉圈只算宣告 countsTurns 的工作台（記憶體的機殼）', () => {
  const e = play();
  e.benchTurned('fake');
  assert.strictEqual(e.stats.turns, 0);
  e.benchTurned('ram');
  assert.strictEqual(e.stats.turns, 1);
});
