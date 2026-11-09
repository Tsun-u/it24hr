// tests/classroom-parameter_passing.test.js（node --test）：傳值與傳參考頁的追蹤器跑出來的，跟圖解、內文講的一樣
const test = require('node:test'); const assert = require('node:assert');
const page = require('../classroom/programming/parameter_passing.js');

test('追蹤器：x 和 arr[0] 從同一個值開始，跑完 x 沒變、arr[0] 加了 1', () => {
  assert.strictEqual(page.trace.runs['v = 5'].at(-1).out, '5 6\n');
  assert.strictEqual(page.trace.runs['v = 10'].at(-1).out, '10 11\n');
});

test('圖解（v = 5）：函式那一層的 x 變成 6、主程式的 x 還是 5；函式改了 arr[0]，主程式那一層看到的是 6', () => {
  const inside = page.trace.runs['v = 5'].filter(s => s.stack && s.stack.length === 2).at(-1);
  assert.deepStrictEqual(inside.stack[1].vars, { x: 6, arr: [6, 5] });
  assert.deepStrictEqual(inside.stack[0].vars, { x: 5, arr: [6, 5] });
});
