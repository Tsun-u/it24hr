const test = require('node:test');
const assert = require('node:assert');
const { Ink } = require('../ink-frame.js');

test('同尺寸同 seed 畫出一樣的框，換 seed 就不一樣', () => {
  assert.strictEqual(Ink.shapes(120, 40, 7, false).line, Ink.shapes(120, 40, 7, false).line);
  assert.notStrictEqual(Ink.shapes(120, 40, 7, false).line, Ink.shapes(120, 40, 8, false).line);
});

test('框不會畫出按鈕外太多（四角只微微抖）', () => {
  for (const pill of [false, true]) {
    const nums = Ink.shapes(100, 44, 3, pill).line.match(/-?\d+\.\d+/g).map(Number);
    const xs = nums.filter((_, i) => i % 2 === 0), ys = nums.filter((_, i) => i % 2 === 1);
    assert.ok(Math.min(...xs) > -2 && Math.max(...xs) < 102, `x 在範圍內（${pill ? '膠囊' : '方框'}）`);
    assert.ok(Math.min(...ys) > -2 && Math.max(...ys) < 46, `y 在範圍內（${pill ? '膠囊' : '方框'}）`);
  }
});
