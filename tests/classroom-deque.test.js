// tests/classroom-deque.test.js（node --test）：小教室 Deque 頁的沙盒與分格圖
const test = require('node:test'); const assert = require('node:assert');
const CR = require('../classroom.js');
const page = CR.PAGES.deque;

test('雙向佇列沙盒：兩頭都能放、都能拿；前面放 0、−1、−2…，空的拿是 underflow，滿了放是 overflow 且狀態不變', () => {
  const box = page.sandbox;
  let s = box.init();
  assert.strictEqual(box.apply(s, 'popFront').error, 'underflow');
  assert.strictEqual(box.apply(s, 'popBack').error, 'underflow');
  for (let i = 0; i < 3; i++) s = box.apply(s, 'pushFront');
  assert.deepStrictEqual(s.items, [-2, -1, 0], '前面放的往前長');
  for (let i = 0; i < 3; i++) s = box.apply(s, 'pushBack');
  assert.deepStrictEqual(s.items, [-2, -1, 0, 1, 2, 3], '後面放的往後長');
  for (const op of ['pushFront', 'pushBack']) {
    const full = box.apply(s, op);
    assert.strictEqual(full.error, 'overflow', `滿了 ${op}`);
    assert.deepStrictEqual(full.items, s.items);
    assert.strictEqual(full.nextFront, s.nextFront); assert.strictEqual(full.nextBack, s.nextBack);
  }
  s = box.apply(s, 'popFront');
  assert.strictEqual(s.got, -2); assert.deepStrictEqual(s.items, [-1, 0, 1, 2, 3]);
  s = box.apply(s, 'popBack');
  assert.strictEqual(s.got, 3); assert.deepStrictEqual(s.items, [-1, 0, 1, 2]);
  s = box.apply(s, 'pushFront');
  assert.deepStrictEqual(s.items, [-3, -1, 0, 1, 2], '拿走之後再放，數字接著往下編');
});

test('分格靜態圖照操作重播：Deque 的五格依序是後放 1、後放 2、前放 0、前面拿到 0、後面拿到 2', () => {
  const frames = CR.replay('deque', page.frames);
  assert.deepStrictEqual(frames.map(f => f.label), ['pushBack(1)', 'pushBack(2)', 'pushFront(0)', 'popFront() → 0', 'popBack() → 2']);
  assert.ok(frames.every(f => !f.state.error));
  assert.deepStrictEqual(frames[2].state.items, [0, 1, 2]);
  assert.deepStrictEqual(frames.at(-1).state.items, [1]);
});
