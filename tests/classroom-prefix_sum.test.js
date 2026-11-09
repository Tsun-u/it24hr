// tests/classroom-prefix_sum.test.js（node --test）：前綴和頁講義裡寫到的數字都算得出來
const test = require('node:test'); const assert = require('node:assert');
const page = require('../classroom/algorithms/prefix_sum.js');

const prefix = (xs) => xs.reduce((pre, x) => [...pre, pre[pre.length - 1] + x], [0]);
const STEPS = [3, 1, 4, 1, 5, 9, 2];

test('七天的前綴和是 0、3、4、8、9、14、23、25，第 3 到第 5 天是 14 − 4 = 10', () => {
  const pre = prefix(STEPS);
  assert.deepStrictEqual(pre, [0, 3, 4, 8, 9, 14, 23, 25]);
  assert.strictEqual(pre[5] - pre[2], 10);
  assert.ok(page.concept[0].includes('0、3、4、8、9、14、23、25'));
});

test('追蹤器的兩組輸入：第 3～5 天印 10、第 1～7 天印 25', () => {
  assert.strictEqual(page.trace.runs['第 3～5 天'].at(-1).out, '10\n');
  assert.strictEqual(page.trace.runs['第 1～7 天'].at(-1).out, '25\n');
});

test('常見誤解的最大值例子：前 5 天最大 5、前 2 天最大 3，第 3 到第 5 天最大 5', () => {
  assert.strictEqual(Math.max(...STEPS.slice(0, 5)), 5);
  assert.strictEqual(Math.max(...STEPS.slice(0, 2)), 3);
  assert.strictEqual(Math.max(...STEPS.slice(2, 5)), 5);
});

test('試試看第一題的錯誤選項各對到一種算錯的方法', () => {
  const pre = prefix([2, 7, 1, 8, 2, 8]);
  assert.deepStrictEqual(pre, [0, 2, 9, 10, 18, 20, 28]);
  assert.strictEqual(pre[5] - pre[1], 18);   // 第 2 到第 5 天
  assert.strictEqual(pre[5], 20);
  assert.strictEqual(pre[6] - pre[2], 19);   // 第 3 到第 6 天
});

test('試試看第二題：填 a、a + 1、b − a 各得到解析裡寫的數', () => {
  const pre = prefix(STEPS);
  assert.strictEqual(pre[5] - pre[3], 6);
  assert.strictEqual(pre[5] - pre[4], 5);
  assert.strictEqual(pre[7] - pre[7 - 1], 2);
});
