const { test } = require('node:test');
const assert = require('node:assert');
const S = require('../sources.js');

const doc = {
  id: 'd1', title: '資產清單要能匯出', text: '', module: 'inventory',
  sentences: [
    { text: '資產清單要能照狀態篩', keep: true },
    { text: '盡快', keep: false },
    { text: '篩完要能匯出', keep: true },
  ],
  subtasks: [{ work: 'code' }],
};

test('評草稿：全勾對、模組對、有附件，沒有缺口', () => {
  const r = S.gradeDraft(doc, { type: 'feature', module: 'inventory', sentences: [0, 2], attach: true });
  assert.deepStrictEqual(r.missing, []);
  assert.deepStrictEqual(r.covered, [0, 2]);
  assert.strictEqual(r.noSource, false);
});

test('評草稿：什麼都沒填，三個缺口都在、沒有一句需求被卡涵蓋、小關卡沒原文', () => {
  const r = S.gradeDraft(doc, { type: 'feature', module: '', sentences: [], attach: false });
  assert.deepStrictEqual(r.missing, ['module', 'body', 'attach']);
  assert.deepStrictEqual(r.covered, []);
  assert.strictEqual(r.noSource, true);
});

test('評草稿：只勾對一句，covered 只有那句（開發時其他 function 選項全開）', () => {
  const r = S.gradeDraft(doc, { type: 'feature', module: 'inventory', sentences: [0], attach: true });
  assert.deepStrictEqual(r.missing, ['body']);
  assert.deepStrictEqual(r.covered, [0]);
});

test('評草稿：勾到廢話算內文沒填好', () => {
  const r = S.gradeDraft(doc, { type: 'feature', module: 'inventory', sentences: [0, 1, 2], attach: true });
  assert.deepStrictEqual(r.missing, ['body']);
});

test('評草稿：AI 的主張（judgment）勾不勾都不算錯', () => {
  const withAI = { ...doc, sentences: [...doc.sentences, { text: 'AI 建議後端擋', keep: false, judgment: true, claim: 'backend_guard' }] };
  assert.deepStrictEqual(S.gradeDraft(withAI, { module: 'inventory', sentences: [0, 2], attach: true }).missing, []);
  assert.deepStrictEqual(S.gradeDraft(withAI, { module: 'inventory', sentences: [0, 2, 3], attach: true }).missing, []);
});

test('轉 SA 的回卡：三個時代各有自己的痕跡，真正的需求都在', () => {
  const card = (mode) => S.saCard(doc, mode);
  for (const mode of ['legacy', 'hybrid', 'speedrun']) {
    const c = card(mode);
    assert.strictEqual(c.from, 'SA 怡君'); assert.strictEqual(c.attach, true); assert.deepStrictEqual(c.subtasks, doc.subtasks);
    assert.deepStrictEqual(c.sentences.filter((s) => s.keep).map((s) => s.text), ['資產清單要能照狀態篩', '篩完要能匯出']);
  }
  assert.strictEqual(card('legacy').sentences.length, 3);
  assert.strictEqual(card('hybrid').sentences.filter((s) => s.judgment).length, 1);
  assert.strictEqual(card('speedrun').sentences.filter((s) => !s.keep).length, 3);
  assert.ok(card('speedrun').sentences.length > card('hybrid').sentences.length);
});
