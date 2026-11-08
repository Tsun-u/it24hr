// tests/classroom-arrays.test.js（node --test）：APCS 程式設計「陣列與串列」這一頁的追蹤資料、追蹤器的說明、跑幾步、試試看對得起來
const test = require('node:test'); const assert = require('node:assert');
const CR = require('../classroom.js');
const page = CR.PAGES.programming.arrays;
const { runs } = page.trace;
const last = (run) => run[run.length - 1];

test('追蹤器：座號 3 拿到 score[2] = 90 及格，座號 4 拿到 score[3] = 45 不及格', () => {
  assert.strictEqual(last(runs['k = 3']).out, '3 90 pass\n');
  assert.strictEqual(last(runs['k = 4']).out, '4 45 fail\n');
  assert.strictEqual(runs['k = 3'].find(s => 'cond' in s).cond, true);
  assert.strictEqual(runs['k = 4'].find(s => 'cond' in s).cond, false);
  assert.strictEqual(last(runs['k = 3']).line, 5, '及格走 if 那行的 print');
  assert.strictEqual(last(runs['k = 4']).line, 7, '不及格走 else 那行的 print');
});

test('追蹤器的說明：整個陣列、座號、拿到的成績、條件代入值、印出', () => {
  const notes = [0, 1, 2, 3, 4].map(i => CR.stepNote(page.trace, 'k = 3', i, 'python'));
  assert.deepStrictEqual(notes, [
    'score = [72, 58, 90, 45, 88]',
    'k = 3',
    's = 90',
    's >= 60（90 >= 60）成立',
    '印出 3 90 pass',
  ]);
  assert.strictEqual(CR.stepNote(page.trace, 'k = 4', 3, 'python'), 's >= 60（45 >= 60）不成立');
  assert.strictEqual(CR.stepNote(page.trace, 'k = 4', 4, 'python'), '印出 4 45 fail');
  assert.strictEqual(CR.stepNote(page.trace, 'k = 3', 3, 'c'), 's >= 60（90 >= 60）成立', 'C 的條件寫在括號裡，取出來一樣');
});

test('追蹤器：兩組輸入執行到的每一行，C／C++／Java 都對得到一行', () => {
  for (const lang of ['c', 'cpp', 'java']) for (const run of Object.values(runs)) {
    for (const s of run) assert.ok(page.trace.lines[lang][s.line], `${lang} 對不到 Python 第 ${s.line} 行`);
  }
});

test('實作：353 / 5 整數除法是 70，低於 70 的有 58、45 兩個，三個人的總分 240、220、275', () => {
  assert.strictEqual(page.code.output, '70 2 240 220 275');
});

test('跑幾步：拿一格 O(1)、走訪 5 格跑 5 次、3 × 3 的表跑 9 次', () => {
  const [one, walk, grid] = page.cost.rows;
  assert.match(one[1], /O\(1\)/);
  assert.match(walk[0], /跑 5 次/); assert.match(walk[1], /O\(n\)/);
  assert.match(grid[0], /跑 9 次/); assert.match(grid[1], /O\(n·m\)/);
  assert.strictEqual(page.cost.note.see, 'ds/complexity');
});

test('試試看：追蹤題和效能題的答案就是程式印出來的；除錯題的程式印出題目說的 281', () => {
  for (const q of page.tryit) {
    if (q.kind === '程式測試與除錯') assert.strictEqual(q.output, '281');
    else assert.strictEqual(q.options[q.answer], q.output, q.prompt);
  }
});

test('核心觀念結尾連到資料結構的陣列頁', () => {
  assert.strictEqual(last(page.concept).see, 'ds/array');
});
