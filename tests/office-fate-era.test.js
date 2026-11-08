// 第三關三個時代的 AI 錯法（劇本「三個時代差在哪」）：AI 前端程式照常理做；每題都有 AI 的答法
const test = require('node:test');
const assert = require('node:assert');
const { Sandbox } = require('../sandbox.js');
require('../sandbox-fate.js');

const cardsOf = (mode) => Sandbox.make('fate', mode, { pool: 'all' }).meetings[1].cards;
const lotUi = (mode) => cardsOf(mode).find(c => c.id === 'lot').subtasks.find(s => s.work === 'ui_design').question.items[0];

test('hybrid、speedrun 的 AI 求籤過程做成「按一下直接出籤」（老師不滿的那個）；legacy 沒有 AI', () => {
  assert.equal(lotUi('hybrid').ai.pick, 1);
  assert.equal(lotUi('speedrun').ai.pick, 1);
  assert.equal(lotUi('legacy').ai, undefined);
});

test('排序題的正解照自己的先後條件排（照正解答就是滿分）', () => {
  const bad = [];
  for (const card of cardsOf('legacy')) for (const s of card.subtasks) for (const item of (s.question || {}).items || []) {
    if (item.type !== 'order') continue;
    for (const [a, b] of item.before || []) if (item.answer.includes(a) && item.answer.includes(b) && item.answer.indexOf(a) > item.answer.indexOf(b)) bad.push(`${card.id} ${s.work}：${a} 要在 ${b} 前面`);
  }
  assert.deepEqual(bad, []);
});

test('有 AI 的時代，每張卡（含平行宇宙的新卡）每一題都有 AI 的答法', () => {
  for (const mode of ['hybrid', 'speedrun']) {
    const script = Sandbox.make('fate', mode, { pool: 'all' });
    const cards = [...cardsOf(mode), ...Object.values(script.parallel.cards).map(p => p.card)];
    const missing = [];
    for (const card of cards) for (const s of card.subtasks) {
      const q = s.question || {};
      (q.items || []).forEach((item, i) => { if (!item.ai && !item.free && item.type !== 'hours' && item.options) missing.push(`${card.id} ${s.work} #${i}`); });
      (q.functions || []).forEach(f => Object.entries(f.fields || {}).forEach(([k, field]) => { if (!field.ai) missing.push(`${card.id} ${f.name}.${k}`); }));
    }
    assert.deepEqual(missing, [], mode);
  }
});
