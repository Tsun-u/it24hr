// tests/screen.test.js（node --test）
const test = require('node:test'); const assert = require('node:assert');
const Screen = require('../screen.js');
const { makeCard } = require('../cards.js');
const day1 = require('../day1.js');

const card = () => makeCard({ ...day1.cards[0] });
const code = (k, answers) => { k.picks = k.picks || {}; k.record('code', { result: { bugs: answers, max: 1, score: 0 } }); };

test('沒做前端設計：版型 plain、沒有元件；做了就照 keys 讀', () => {
  const k = card();
  const m = Screen.model(k);
  assert.strictEqual(m.designed, false); assert.strictEqual(m.template, 'plain'); assert.deepStrictEqual(m.components, {}); assert.strictEqual(m.built, false);
  k.picks = { ui_design: [0, [0, 2, 5], [0, 1]] };
  const d = Screen.model(k);
  assert.strictEqual(d.template, 'list'); assert.strictEqual(d.components.search, true); assert.strictEqual(d.components.filter, false); assert.strictEqual(d.components.export, true);
  assert.strictEqual(d.validations.serial, true); assert.strictEqual(d.validations.dateFormat, false);
  k.picks = { ui_design: [0, [0], [0, 1, 2, 3, 4, 7]] }; k.record('code', { result: { bugs: [], max: 1, score: 1 } });
  const picker = Screen.model(k); assert.strictEqual(picker.validations.datePicker, true);
  assert.ok(Screen.userVoice(picker).some(s => /點日曆/.test(s))); assert.ok(Screen.lighthouse(picker).notes.some(n => /點日曆/.test(n)));
  k.picks = { ui_design: [0, [0], [0, 1, 3, 4, 8]] };
  assert.ok(Screen.userVoice(Screen.model(k)).some(s => /少打斜線/.test(s)));
  assert.deepStrictEqual(d.fields, day1.cards[0].screen.fields); assert.strictEqual(d.rows.length, 4);
});

test('配色、確認方式、提示方式照選的讀；簡易 Lighthouse：對比低無障礙扣、Toast 確認最佳做法扣、每字存檔效能扣', () => {
  const k = card(); k.picks = { ui_design: [0, [0, 1, 2, 3, 4, 5], [0, 1, 2, 3, 4], 0, 0, 0] }; code(k, []);
  const good = Screen.model(k);
  assert.deepStrictEqual(good.theme, { bg: '#ffffff', fg: '#1f2328', accent: '#2563eb' }); assert.strictEqual(good.confirm, 'dialog'); assert.strictEqual(good.hint, 'inline');
  const lh = Screen.lighthouse(good);
  assert.strictEqual(lh.accessibility, 100); assert.strictEqual(lh.bestPractices, 100); assert.strictEqual(lh.performance, 100); assert.strictEqual(lh.seo, 100);
  assert.ok(Screen.contrast('#1f2328', '#ffffff') > 4.5); assert.ok(Screen.contrast('#b4b8bf', '#f3f4f6') < 3);
  const bad = card(); bad.picks = { ui_design: [0, [0, 1, 2, 3, 4, 5, 7], [0, 1, 2, 3, 4, 6], 1, 1, 1] }; code(bad, []);
  const b = Screen.lighthouse(Screen.model(bad));
  assert.ok(b.accessibility <= 40, String(b.accessibility)); assert.ok(b.bestPractices < 60, String(b.bestPractices)); assert.ok(b.performance < 60, String(b.performance));
  assert.ok(b.notes.some(n => /對比/.test(n))); assert.ok(b.notes.some(n => /Toast/.test(n))); assert.ok(b.notes.some(n => /API/.test(n)));
  const rg = card(); rg.picks = { ui_design: [0, [], [], 2, 0, 0] }; code(rg, []);
  assert.ok(Screen.lighthouse(Screen.model(rg)).notes.some(n => /紅配綠/.test(n)));
  const plain = card(); code(plain, []);
  assert.ok(Screen.lighthouse(Screen.model(plain)).notes.some(n => /沒做前端設計/.test(n)));
});

test('老闆的唯讀頁：欄位和資料跟阿賢那頁同一份；寫成能改的頁、或自己加了修改按鈕，財務會講', () => {
  const boss = () => makeCard({ id: 'boss:card', title: '老闆：財務也要看', screen: day1.sources[0].screen, subtasks: day1.sources[0].subtasks });
  const k = boss(); k.picks = { ui_design: [0, [0, 1, 2], 0] }; code(k, []);
  const m = Screen.model(k);
  assert.strictEqual(m.readOnly, true); assert.deepStrictEqual(m.fields, day1.cards[0].screen.fields); assert.strictEqual(m.rows.length, 4);
  assert.ok(!Screen.userVoice(m).some(s => /只要看/.test(s)));
  const editable = boss(); editable.picks = { ui_design: [0, [0, 1, 2], 0] }; code(editable, [{ fn: 'readOnlyView', field: 'scope' }]);
  assert.ok(Screen.userVoice(Screen.model(editable)).some(s => /只要看/.test(s)));
  const buttons = boss(); buttons.picks = { ui_design: [0, [0, 1, 2, 4], 0] }; code(buttons, []);
  assert.ok(Screen.userVoice(Screen.model(buttons)).some(s => /只要看/.test(s)));
});

test('追加需求的配色跟母議題不一樣：不管評價好壞，都多一句「風格能夠一致會更好」', () => {
  const parent = card(); parent.picks = { ui_design: [0, [0, 1, 2, 3, 4, 5], [0, 1, 2, 3, 4], 0, 0, 0] };
  const boss = (palette) => { const k = makeCard({ id: 'boss:card', screen: day1.sources[0].screen, subtasks: day1.sources[0].subtasks }); k.picks = { ui_design: [0, [0, 1, 2], palette] }; code(k, []); return Screen.model(k); };
  const same = Screen.userVoice(boss(0), Screen.model(parent));
  assert.ok(!same.includes(Screen.STYLE_LINE)); assert.ok(same.some(s => /不用教/.test(s)));
  const darker = Screen.userVoice(boss(4), Screen.model(parent));   // 深色預設本身對比沒問題
  assert.ok(darker.some(s => /不用教/.test(s))); assert.strictEqual(darker.at(-1), Screen.STYLE_LINE);
  const plainParent = card();   // 母議題沒做前端設計，子議題做了：一樣不一致
  assert.ok(Screen.userVoice(boss(0), Screen.model(plainParent)).includes(Screen.STYLE_LINE));
  const k = makeCard({ id: 'boss:card', screen: day1.sources[0].screen, subtasks: day1.sources[0].subtasks });   // 版型照需求走：配色一樣、版型不同不算不一致
  k.picks = { ui_design: [2, [0, 1, 2], 0] }; code(k, []);
  assert.ok(!Screen.userVoice(Screen.model(k), Screen.model(parent)).includes(Screen.STYLE_LINE));
});

test('開發的 bug 變成看得見的效果：報廢寫成刪除那列就不見、編號格式錯', () => {
  const k = card(); k.picks = { ui_design: [0, [0, 1, 2, 3, 4, 5], [0, 1, 2, 3, 4]] };
  code(k, [{ fn: 'scrapAsset', field: 'how' }, { fn: 'createAsset', field: 'no' }]);
  const m = Screen.model(k);
  assert.strictEqual(m.built, true); assert.deepStrictEqual(m.effects, { scrapGone: true, serialWrong: true });
  const rows = Screen.visibleRows(m);
  assert.strictEqual(rows.length, 3); assert.ok(rows.every(r => !r.includes('報廢'))); assert.strictEqual(rows[0][0], '2024-IT-31');
  code(card(), []);
  const clean = card(); code(clean, []); assert.strictEqual(Screen.visibleRows(Screen.model(clean)).length, 4);
});
