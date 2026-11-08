// tests/classroom-loops.test.js（node --test）：APCS 程式設計「迴圈」這一頁的追蹤資料、追蹤器的說明、跑幾步、試試看對得起來
const test = require('node:test'); const assert = require('node:assert');
const CR = require('../classroom.js');
const page = CR.PAGES.programming.loops;
const { runs } = page.trace;
const last = (run) => run[run.length - 1];

test('追蹤器：n = 3 印出 1 + 2 + 3 = 6，n = 0 一圈都不跑、印出 0', () => {
  assert.strictEqual(last(runs['n = 3']).out, '6\n');
  assert.strictEqual(last(runs['n = 0']).out, '0\n');
  assert.ok(!runs['n = 0'].some(s => s.cond), 'n = 0 時條件一次都不成立');
});

test('跑幾步：條件檢查 n + 1 次、本體各跑 n 次，跟追蹤資料一樣', () => {
  for (const [label, n] of [['n = 3', 3], ['n = 0', 0]]) {
    const run = runs[label];
    assert.strictEqual(run.filter(s => 'cond' in s).length, n + 1, label);
    assert.strictEqual(run.filter(s => s.line === 5).length, n, `${label} 的 total += i`);
  }
  assert.match(page.cost.rows[0][0], /n = 3 時檢查 4 次/);
});

test('追蹤器的說明：第一次檢查、加、加一、回到開頭再檢查、最後一次不成立、印出', () => {
  const notes = [3, 4, 5, 6, 12, 13].map(i => CR.stepNote(page.trace, 'n = 3', i, 'python'));
  assert.deepStrictEqual(notes, [
    'i <= n（1 <= 3）成立，進迴圈',
    'total：0 → 1',
    'i：1 → 2',
    'i <= n（2 <= 3）成立，進迴圈',
    'i <= n（4 <= 3）不成立，離開迴圈',
    '印出 6',
  ]);
  assert.strictEqual(CR.stepNote(page.trace, 'n = 3', 3, 'c'), 'i <= n（1 <= 3）成立，進迴圈', 'C 的條件寫在括號裡，取出來一樣');
});

test('實作：1 加到 5 是 15，5 個人兩兩一組是 5 × 4 / 2 = 10 組', () => {
  assert.strictEqual(page.code.output, '15 10');
});

test('試試看：追蹤題和效能題的答案就是程式印出來的；除錯題的程式印出題目說的「只印到 4」', () => {
  for (const q of page.tryit) {
    if (q.kind === '程式測試與除錯') assert.strictEqual(q.output, '1\n2\n3\n4');
    else assert.strictEqual(q.options[q.answer], q.output, q.prompt);
  }
});
