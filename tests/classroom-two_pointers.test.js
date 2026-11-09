// tests/classroom-two_pointers.test.js（node --test）：雙指標頁講義裡寫到的數字都算得出來
const test = require('node:test'); const assert = require('node:assert');
const page = require('../classroom/algorithms/two_pointers.js');

// 從兩頭往中間收，回傳每一步看的那一對和最後找到的一對（沒有就是 null）
function walk(prices, target) {
  let left = 0, right = prices.length - 1; const seen = [];
  while (left < right) {
    const total = prices[left] + prices[right]; seen.push([left, right, total]);
    if (total === target) return { seen, found: [prices[left], prices[right]] };
    if (total > target) right -= 1; else left += 1;
  }
  return { seen, found: null };
}

test('Hook 和複習的數字：50 樣有 1225 對、一萬樣將近五千萬對、50 樣最多看 49 次', () => {
  assert.strictEqual(50 * 49 / 2, 1225);
  assert.strictEqual(10000 * 9999 / 2, 49995000);
  const all = Array.from({ length: 50 }, (_, i) => i);
  assert.strictEqual(walk(all, 10000).seen.length, 49);
});

test('圖解：150 + 790 = 940、260 + 790 = 1050、260 + 660 = 920、340 + 660 = 1000', () => {
  const { seen, found } = walk([150, 260, 340, 480, 660, 790], 1000);
  assert.deepStrictEqual(seen.map(s => s[2]), [940, 1050, 920, 1000]);
  assert.deepStrictEqual(found, [340, 660]);
});

test('追蹤器：目標 1000 印 340 660、目標 700 印 none', () => {
  assert.strictEqual(page.trace.runs['目標 1000'].at(-1).out, '340 660\n');
  assert.strictEqual(page.trace.runs['目標 700'].at(-1).out, 'none\n');
});

test('試試看第一題：第三步找到 200 550；中間兩樣 310 + 430 = 740', () => {
  const { seen, found } = walk([120, 200, 310, 430, 550, 680], 750);
  assert.deepStrictEqual(seen.map(s => s[2]), [800, 670, 750]);
  assert.deepStrictEqual(found, [200, 550]);
  assert.strictEqual(310 + 430, 740);
});
