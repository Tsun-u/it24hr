// tests/classroom-dp.test.js（node --test）：演算法「動態規劃」這一頁的追蹤資料、內文寫到的數字、跑幾步、試試看對得起來
const test = require('node:test'); const assert = require('node:assert');
const CR = require('../classroom.js');
const page = CR.PAGES.algorithms.dp;
const { runs } = page.trace;
const last = (run) => run[run.length - 1];

// 走到第 n 階的走法數（第 1 階、第 2 階是初始值）和照遞迴直接算要呼叫幾次
const ways = (n, second = 2) => { const w = [0, 1, second]; for (let i = 3; i <= n; i++) w[i] = w[i - 1] + w[i - 2]; return w[n]; };
const calls = (n) => { const c = [0, 1, 1]; for (let i = 3; i <= n; i++) c[i] = 1 + c[i - 1] + c[i - 2]; return c[n]; };
const text = (t) => (typeof t === 'string' ? t : t.text || t.quote);

test('追蹤器：n = 5 從左往右把表填成 1、2、3、5、8，印出 8；n = 1 不進迴圈，印出 1', () => {
  assert.deepStrictEqual(last(runs['n = 5']).vars.ways, [0, 1, 2, 3, 5, 8]);
  assert.strictEqual(last(runs['n = 5']).out, '8\n');
  assert.strictEqual(last(runs['n = 1']).out, '1\n');
  assert.ok(!runs['n = 1'].some(s => s.line === 7), 'n = 1 沒有進到填表那一行');
});

test('追蹤器：兩組輸入執行到的每一行，C／C++／Java 都對得到一行', () => {
  for (const lang of ['c', 'cpp', 'java']) for (const run of Object.values(runs)) {
    for (const s of run) assert.ok(page.trace.lines[lang][s.line], `${lang} 對不到 Python 第 ${s.line} 行`);
  }
});

test('開場和總結：14 階有 610 種走法，每天一種大約一年八個月', () => {
  assert.strictEqual(ways(14), 610);
  assert.match(page.analogy, /14 階/);
  assert.match(page.summary, new RegExp(`${ways(14)} 種走法`));
  assert.strictEqual(Math.floor(ways(14) / 365), 1); assert.strictEqual(Math.round((ways(14) % 365) / 30.4), 8);
});

test('複習：算 14 階時，第 12、11、10 階分別被算了 2、3、5 次', () => {
  const count = {}; const rec = (n) => { count[n] = (count[n] || 0) + 1; if (n > 2) { rec(n - 1); rec(n - 2); } };
  rec(14);
  assert.deepStrictEqual([count[12], count[11], count[10]], [2, 3, 5]);
  assert.match(text(page.review[1]), /第 12 階的走法被算了 2 次、第 11 階 3 次、第 10 階 5 次/);
  assert.ok(page.review.some(t => t.quote), '複習裡有一句標成 quote');
});

test('常見誤解寫到的數字：ways[2] 寫成 1 會變 377；ways[45] 還裝得下 int、ways[46] 就超過', () => {
  const traps = page.traps.map(t => t.right).join('\n');
  assert.ok(traps.includes(`從 ${ways(14)} 變成 ${ways(14, 1)}`));
  const INT_MAX = 2147483647;
  assert.ok(ways(45) <= INT_MAX && ways(46) > INT_MAX);
  assert.ok(traps.includes(`ways[45] 是 ${ways(45)}`) && traps.includes(String(INT_MAX)));
});

test('實作：14 階 610 種、40 階 165580141 種', () => {
  assert.strictEqual(page.code.output, `${ways(14)} ${ways(40)}`);
});

test('跑幾步：照遞迴直接算的呼叫次數跟算出來的一樣', () => {
  assert.match(page.cost.rows[0][0], new RegExp(`ways\\(14\\) 呼叫 ${calls(14)} 次`));
  assert.ok(calls(40) > 2e8 && calls(40) < 3e8, 'ways(40) 呼叫兩億多次');
  assert.strictEqual(page.cost.note.see, 'ds/complexity');
});

test('試試看：追蹤題和效能題的答案就是程式印出來的；除錯題的程式印出題目說的 0', () => {
  for (const q of page.tryit) {
    if (q.kind === '程式測試與除錯') assert.strictEqual(q.output, '0');
    else assert.strictEqual(q.options[q.answer], q.output, q.prompt);
  }
  assert.ok(page.tryit.some(q => q.answer !== 0), '答案不要都在 (A)');
});

test('複習和核心觀念連回 APCS 程式設計的遞迴頁', () => {
  assert.ok([...page.review, ...page.concept].some(t => t.see === 'programming/recursion'));
});
