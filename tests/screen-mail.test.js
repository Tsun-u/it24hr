// tests/screen-mail.test.js（node --test）：沒有前端程式的信件卡，成品畫面照既有的資產清單畫（手動測試裝置不能沒畫面）
const test = require('node:test'); const assert = require('node:assert');
const Screen = require('../screen.js');
const DAY2 = require('../day2.js');

const source = (id) => DAY2.make().sources.find(s => s.id === id);
// 開成卡的樣子：信件卡沒有前端程式；code 那筆紀錄帶著 bug
const cardOf = (id, bugs = null) => ({ title: source(id).title, screen: source(id).screen, subtasks: source(id).subtasks,
  history: bugs ? [{ work: 'code', result: { bugs } }] : [] });

test('沒有前端程式的信件卡：照既有的資產清單畫，不算沒做設計', () => {
  for (const id of ['dept_select', 'finance_csv', 'sec_jquery']) {
    const m = Screen.model(cardOf(id, []));
    assert.strictEqual(m.designed, true, id); assert.strictEqual(m.template, 'list', id); assert.ok(m.fields.length && m.rows.length, id);
    assert.ok(!Screen.lighthouse(m).notes.some(n => n.includes('沒做前端程式')), id);
  }
});

test('部門下拉：舊資料對回來了就沒有 AMR；沒對回來照舊亂；寫死的話選單是亂打的那些', () => {
  const ok = Screen.model(cardOf('dept_select', []));
  assert.ok(!Screen.visibleRows(ok).flat().includes('AMR'));
  const bad = Screen.model(cardOf('dept_select', [{ fn: 'migrateDept', field: 'how' }, { fn: 'deptSelect', field: 'src' }]));
  assert.ok(Screen.visibleRows(bad).flat().includes('AMR'));
  assert.ok(bad.effects.deptHardcode && bad.deptOptions.hardcode.includes('資產室設備組'));
});

test('財務亂碼、資安 jQuery：bug 變成看得到的效果', () => {
  assert.ok(Screen.model(cardOf('finance_csv', [{ fn: 'exportCsv', field: 'how' }])).effects.csvGarbled);
  assert.ok(Screen.model(cardOf('finance_csv', [])).exportPreview);
  assert.ok(Screen.model(cardOf('sec_jquery', [{ fn: 'upgradeJquery', field: 'how' }])).effects.jqueryBroken);
});
