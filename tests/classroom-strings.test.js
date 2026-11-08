// tests/classroom-strings.test.js（node --test）：APCS 程式設計「字元與字串」這一頁的追蹤資料、追蹤器的說明、跑幾步、試試看對得起來
const test = require('node:test'); const assert = require('node:assert');
const CR = require('../classroom.js');
const page = CR.PAGES.programming.strings;
const { runs } = page.trace;
const last = (run) => run[run.length - 1];

test('追蹤器：tsunu0824 第一個字是字母、夠長，印 ok；1234567 夠長但第一個字不是字母，印 letter；abc 不到 6 個字，印 length', () => {
  assert.strictEqual(last(runs['"tsunu0824"']).out, 'ok\n');
  assert.strictEqual(last(runs['"1234567"']).out, 'letter\n');
  assert.strictEqual(last(runs['"abc"']).out, 'length\n');
});

test('追蹤器的變數只有字串和整數：name、first 是字串，n 是整數', () => {
  for (const run of Object.values(runs)) {
    const vars = last(run).vars;
    assert.deepStrictEqual(Object.keys(vars), ['name', 'n', 'first']);
    assert.strictEqual(typeof vars.name, 'string'); assert.strictEqual(typeof vars.first, 'string'); assert.strictEqual(typeof vars.n, 'number');
    assert.strictEqual(vars.n, vars.name.length, 'n 就是字串的長度');
    assert.strictEqual(vars.first, vars.name[0], 'first 就是第 0 格');
  }
});

test('追蹤器的說明：長度不在 6～12 的檢查不成立、第一個字落在字母範圍成立、印出 ok；elif 那行自己是一步', () => {
  const notes = [2, 3, 4, 5].map(i => CR.stepNote(page.trace, '"tsunu0824"', i, 'python'));
  assert.deepStrictEqual(notes, [
    'first = "t"',
    'n < 6 or n > 12（9 < 6 or 9 > 12）不成立',
    '\'a\' <= first and first <= \'z\' or \'A\' <= first and first <= \'Z\'（\'a\' <= "t" and "t" <= \'z\' or \'A\' <= "t" and "t" <= \'Z\'）成立',
    '印出 ok',
  ]);
  assert.strictEqual(CR.stepNote(page.trace, '"tsunu0824"', 4, 'c'),
    '\'a\' <= first && first <= \'z\' || \'A\' <= first && first <= \'Z\'（\'a\' <= "t" && "t" <= \'z\' || \'A\' <= "t" && "t" <= \'Z\'）成立',
    'C 的 else if 條件寫在括號裡，取出來不多不少');
  assert.strictEqual(CR.stepNote(page.trace, '"1234567"', 4, 'python').slice(-3), '不成立', '1 不在字母範圍');
  assert.strictEqual(CR.stepNote(page.trace, '"abc"', 3, 'python'), 'n < 6 or n > 12（3 < 6 or 3 > 12）成立');
});

test('跑幾步：取一個字 O(1)、走訪一遍 O(n)，實作數母音時 n = 9、if 檢查 9 次', () => {
  assert.match(page.cost.rows[0][1], /O\(1\)/);
  assert.match(page.cost.rows[3][0], /n = 9，if 檢查 9 次/);
  assert.match(page.cost.rows[3][1], /O\(n\)/);
  assert.strictEqual(page.cost.note.see, 'ds/complexity');
});

test('實作：\'A\' 是 65、t 轉大寫是 T、tsunu0824 長 9、前 5 個字是 tsunu、母音 u、u 兩個', () => {
  assert.strictEqual(page.code.output, '65 T 9 tsunu 2');
});

test('試試看：追蹤題的答案就是程式印出來的；解析題的程式數 HeLLo 的大寫得 3；除錯題的程式印出題目說的 48', () => {
  const [tracing, logic, debug] = page.tryit;
  assert.strictEqual(tracing.kind, '程式運行追蹤'); assert.strictEqual(tracing.options[tracing.answer], tracing.output);
  assert.strictEqual(logic.kind, '解析計算邏輯'); assert.match(logic.options[logic.answer], /大寫/);
  assert.strictEqual(logic.output, String(('HeLLo'.match(/[A-Z]/g) || []).length));
  assert.strictEqual(debug.kind, '程式測試與除錯'); assert.strictEqual(debug.output, '48'); assert.match(debug.prompt, /48/);
});
