// tests/classroom-array.test.js（node --test）：小教室 Array 頁的沙盒與分格圖
const test = require('node:test'); const assert = require('node:assert');
const CR = require('../classroom.js');
const page = CR.PAGES.ds.array;

test('陣列沙盒：讀最後一格直接拿 a[n−1]、插到最前面每一格往後搬；放滿 6 格再放是 overflow，狀態不變', () => {
  const box = page.sandbox;
  let s = box.init();
  assert.deepStrictEqual(s.items, [10, 20, 30]);
  const read = box.apply(s, 'read');
  assert.strictEqual(read.got, 30); assert.strictEqual(read.touched, 2); assert.deepStrictEqual(read.items, s.items);
  s = box.apply(s, 'insertFront');
  assert.deepStrictEqual(s.items, [40, 10, 20, 30]); assert.strictEqual(s.touched, 0); assert.strictEqual(s.moved, 3);
  s = box.apply(s, 'append');
  assert.deepStrictEqual(s.items, [40, 10, 20, 30, 50]); assert.strictEqual(s.touched, 4); assert.strictEqual(s.moved, 0);
  s = box.apply(s, 'append');
  assert.strictEqual(s.items.length, box.capacity);
  for (const op of ['append', 'insertFront']) {
    const full = box.apply(s, op);
    assert.strictEqual(full.error, 'overflow', op);
    assert.deepStrictEqual(full.items, s.items); assert.strictEqual(full.next, s.next);
    assert.strictEqual(full.touched, null, '滿了沒動到任何一格，不留上一步的標色');
  }
});

test('陣列：分格圖依序是讀 a[2]、插到最前面搬 3 格、接到最後、讀 a[4]', () => {
  const frames = CR.replay('ds', 'array', page.frames);
  assert.deepStrictEqual(frames.map(f => f.label), ['a[2] → 30', 'insert(0, 40)：搬 3 格', 'append(50)', 'a[4] → 50']);
  assert.ok(frames.every(f => !f.state.error));
  assert.deepStrictEqual(frames.at(-1).state.items, [40, 10, 20, 30, 50]);
});
