// 有後果的寫法也改成品畫面：outcome 寫了 cells／column／addRows 照畫；帶 a11y 的扣 Lighthouse 無障礙分數
const test = require('node:test');
const assert = require('node:assert');
const Screen = require('../screen.js');

const card = (uiPick, codePick) => ({
  id: 'x', title: '測試', picks: { ui_design: [uiPick], code: [{ how: codePick }] }, history: [],
  done: (w) => ['ui_design', 'code'].includes(w),
  screen: { app: '測試', fields: ['盤', '老師'], rows: [['八字', '瀞玄'], ['星盤', '莉莉絲']] },
  subtasks: [
    { work: 'ui_design', question: { items: [{ text: '選單', options: ['圓盤', '導覽列', '圖沒替代文字'], answer: 0,
      outcome: { 1: { kind: 'displeased', say: '一目了然。', addRows: [['合婚', '72 分']] }, 2: { kind: 'miss', say: '沒替代文字', a11y: { minus: 30, note: '圖片沒有替代文字' } } } }] } },
    { work: 'code', question: { kind: 'functions', functions: [{ name: 'bookTarget', does: '預約帶到誰', code: '', fields: { how: { label: '帶到', options: ['照盤', '一律瀞玄'], answer: 0,
      outcome: { 1: { kind: 'displeased', who: '莉莉絲老師', say: '客人都跑去瀞玄那裡了。', column: { '老師': '瀞玄' } } } } } }] } },
  ],
});
const shown = (c) => Screen.visibleRows ? Screen.visibleRows(Screen.model(c)) : null;

test('後端寫錯（一律帶到瀞玄）：老師那欄整欄變瀞玄', () => {
  const rows = shown(card(0, 1));
  assert.deepEqual(rows.map(r => r[1]), ['瀞玄', '瀞玄']);
});

test('前端照常理做的後果多出一列', () => {
  assert.equal(shown(card(1, 0)).length, 3);
});

test('正解不改畫面；帶 a11y 的寫法扣無障礙分數', () => {
  assert.deepEqual(shown(card(0, 0)), [['八字', '瀞玄'], ['星盤', '莉莉絲']]);
  const ok = Screen.lighthouse(Screen.model(card(0, 0))).accessibility;
  const bad = Screen.lighthouse(Screen.model(card(2, 0)));
  assert.equal(ok - bad.accessibility, 30);
  assert.ok(bad.notes.includes('圖片沒有替代文字'));
});
