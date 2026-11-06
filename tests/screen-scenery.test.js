// tests/screen-scenery.test.js（node --test）：第二關的成品畫面——欄位照前端設計畫成下拉／紅字／怪東西，劇本寫的 bug 改那一格、使用者講那句
const test = require('node:test');
const assert = require('node:assert');
const Screen = require('../screen.js');
const { play, at, tickTo, skipMeeting, right, doAll } = require('./scenery-helpers.js');
const opened = () => { const e = play(); skipMeeting(e); return e; };
const uiOf = (e) => e.board.get('buy').subtasks.find(s => s.work === 'ui_design').question;
const codeOf = (e) => e.board.get('buy').subtasks.find(s => s.work === 'code').question;
const PRICE = '單價（元／公斤）';

test('正解：欄位畫成下拉，顯示 sample；沒有員工抱怨', () => {
  const e = opened(); doAll(e, 'buy');
  const m = Screen.model(e.board.get('buy'));
  assert.ok(m.form);
  assert.deepStrictEqual(m.fieldLooks[PRICE], { look: 'right', text: '86（前一交易日中價，可改）' });
  assert.deepStrictEqual(m.annoyed, []);
  assert.deepStrictEqual(Screen.userVoice(m), [Screen.PRAISE_LINE]);
});
test('做錯：那一格跳紅字，使用者評語是員工的惱怒', () => {
  const e = opened(); const a = right(uiOf(e)); a[0] = 1; doAll(e, 'buy', { ui_design: a });
  const m = Screen.model(e.board.get('buy'));
  assert.deepStrictEqual(m.fieldLooks[PRICE], { look: 'red', text: '請輸入正確的單價' });
  assert.ok(Screen.userVoice(m).includes('時價哪裡不正確？'));
});
test('漏做：那一格填著怪東西', () => {
  const e = opened(); const a = right(uiOf(e)); a[0] = 2; doAll(e, 'buy', { ui_design: a });
  assert.deepStrictEqual(Screen.model(e.board.get('buy')).fieldLooks[PRICE], { look: 'junk', text: '時價' });
});
test('沒做前端設計：每格照 ifSkipped，畫面上還是有新增表單', () => {
  const e = opened(); doAll(e, 'buy', { ui_design: null });
  const m = Screen.model(e.board.get('buy'));
  assert.ok(m.form && !m.designed);
  assert.deepStrictEqual(m.fieldLooks[PRICE], { look: 'junk', text: '時價' });
  assert.deepStrictEqual(m.fieldLooks['規格'], { look: 'red', text: '規格請填公斤' });
  assert.deepStrictEqual(m.fieldLooks['備註'], { look: 'free', text: '（選填）' });
});
test('備註：選對（選填、什麼都收）是自由填的文字框，不是下拉；選必填照樣跳紅字', () => {
  const e = opened(); doAll(e, 'buy');
  assert.deepStrictEqual(Screen.model(e.board.get('buy')).fieldLooks['備註'], { look: 'free', text: '（選填）' });
  const items = uiOf(e).items; const a = right(uiOf(e)); a[items.findIndex(i => i.field === '備註')] = 1;
  e.doWork('buy', 'ui_design', a);
  assert.deepStrictEqual(Screen.model(e.board.get('buy')).fieldLooks['備註'], { look: 'red', text: '備註為必填' });
});
// render 要 DOM：node 裡給一個只記 className 和子節點的最小 document
const fakeDom = () => {
  global.document = { createElement: (tag) => ({ tag, className: '', children: [], style: { setProperty() {} }, dataset: {}, classList: { add() {} }, append(...c) { this.children.push(...c); } }) };
  global.Option = function (text) { this.text = text; };
};
test('有新增表單的成品畫面多一個 mock-has-form（平板上列表縮字、換行的樣式只套在它身上）；沒有表單的不加', () => {
  fakeDom();
  const e = opened(); doAll(e, 'buy');
  const m = Screen.model(e.board.get('buy'));
  assert.match(Screen.render(m, 'tablet').className, /(^| )mock-has-form( |$)/);
  assert.doesNotMatch(Screen.render({ ...m, form: false }, 'tablet').className, /mock-has-form/);
});
test('劇本寫的 bug：fillPrice 寫錯，待補那列單價變 0，使用者講那句', () => {
  const e = opened(); const code = right(codeOf(e));
  code[codeOf(e).functions.findIndex(f => f.name === 'fillPrice')] = { when: 1 };
  doAll(e, 'buy', { doc_plan: [[0, 1, 2, 3, 4, 6, 7]], code });   // 計畫沒排待補，fillPrice 要自己寫
  const m = Screen.model(e.board.get('buy'));
  assert.strictEqual(Screen.visibleRows(m)[1][m.fields.indexOf(PRICE)], '0');
  assert.ok(Screen.userVoice(m).includes('待補的那批用 0 元算進成本，毛利高得嚇人。'));
});
test('舊存檔的 model 沒有新欄位也畫得出評語', () => {
  assert.deepStrictEqual(Screen.userVoice({ built: true, designed: true, theme: null, components: {}, validations: {}, effects: {} }), [Screen.PRAISE_LINE]);
});
