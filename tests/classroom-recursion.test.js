// tests/classroom-recursion.test.js（node --test）：APCS 程式設計「遞迴」這一頁的追蹤資料、呼叫堆疊、追蹤器的說明、跑幾步、試試看對得起來
const test = require('node:test'); const assert = require('node:assert');
const CR = require('../classroom.js');
const page = CR.PAGES.programming.recursion;
const { runs } = page.trace;
const last = (run) => run[run.length - 1];

test('追蹤器：n = 3 依序通知 1、2、3 號，數回來是 3 個人；n = 1 只通知 1 號', () => {
  assert.strictEqual(last(runs['n = 3']).out, '1\n2\n3\n3\n');
  assert.strictEqual(last(runs['n = 1']).out, '1\n1\n');
});

test('呼叫堆疊：n = 3 最多三層加主程式，每一層有自己的 k；回傳時 1、2、3 一層一層加回來', () => {
  const run = runs['n = 3'];
  assert.strictEqual(Math.max(...run.map(CR.depthOf)), 4);
  assert.strictEqual(Math.max(...runs['n = 1'].map(CR.depthOf)), 2);
  const deepest = run.find(s => CR.depthOf(s) === 4);
  assert.deepStrictEqual(deepest.stack.map(f => f.vars.k), [undefined, 1, 2, 3]);
  assert.deepStrictEqual(run.filter(s => 'ret' in s).map(s => s.ret), [1, 2, 3]);
  assert.deepStrictEqual(last(run).vars, { count: 3 }, '回到主程式，count 拿到 3');
});

test('追蹤器的說明：呼叫、條件代入值、最後一層成立、一層一層回傳', () => {
  const notes = runs['n = 3'].map((_, i) => CR.stepNote(page.trace, 'n = 3', i, 'python'));
  assert.deepStrictEqual(notes.slice(1, 5), ['呼叫 notify（k = 1、n = 3）', '印出 1', 'k == n（1 == 3）不成立', '呼叫 notify（k = 2、n = 3）']);
  assert.deepStrictEqual(notes.slice(9), ['k == n（3 == 3）成立', 'notify 回傳 1', 'notify 回傳 2', 'notify 回傳 3', 'count = 3', '印出 3']);
  assert.strictEqual(CR.stepNote(page.trace, 'n = 3', 3, 'c'), 'k == n（1 == 3）不成立', 'C 的條件寫在括號裡，取出來一樣');
});

test('追蹤器：兩組輸入執行到的每一行（含 def 那行和函式裡每一行），C／C++／Java 都對得到一行', () => {
  for (const lang of ['c', 'cpp', 'java']) for (const run of Object.values(runs)) {
    for (const s of run) assert.ok(page.trace.lines[lang][s.line], `${lang} 對不到 Python 第 ${s.line} 行`);
  }
});

test('實作：5! = 120、fib(10) = 55、gcd(48, 18) = 6', () => {
  assert.strictEqual(page.code.output, '120 55 6');
});

test('跑幾步：notify(1, n) 呼叫 n 次，跟追蹤資料的呼叫次數一樣；fib(5) 呼叫 15 次', () => {
  for (const [label, n] of [['n = 3', 3], ['n = 1', 1]]) assert.strictEqual(runs[label].filter(s => s.call).length, n, label);
  const [notify, , fib] = page.cost.rows;
  assert.match(notify[0], /n = 3 時呼叫 3 次/); assert.match(notify[1], /O\(n\)/);
  assert.match(fib[0], /fib\(5\) 呼叫 15 次/);
  assert.strictEqual(page.cost.note.see, 'ds/complexity');
});

test('試試看：追蹤題和效能題的答案就是程式印出來的；除錯題的程式印出題目說的 0', () => {
  for (const q of page.tryit) {
    if (q.kind === '程式測試與除錯') assert.strictEqual(q.output, '0');
    else assert.strictEqual(q.options[q.answer], q.output, q.prompt);
  }
  assert.ok(page.tryit.some(q => q.answer !== 0), '答案不要都在 (A)');
});

test('核心觀念講到呼叫堆疊的那段連到資料結構的堆疊頁', () => {
  assert.ok(page.concept.some(t => t.see === 'ds/stack'));
});
