// tests/classroom-circular_queue.test.js（node --test）：小教室 Circular Queue 頁的沙盒與分格圖
const test = require('node:test'); const assert = require('node:assert');
const CR = require('../classroom.js');
const page = CR.PAGES.ds.circular_queue;

test('環狀佇列沙盒：空的拿是 underflow；6 格空一格、放 5 個就滿，再放是 overflow 且狀態不變；叫號後 rear 繞回 0 號格', () => {
  const box = page.sandbox;
  const unchanged = ({ slots, front, rear, next }) => ({ slots, front, rear, next });
  const empty = box.init();
  const under = box.apply(empty, 'dequeue');
  assert.strictEqual(under.error, 'underflow'); assert.deepStrictEqual(unchanged(under), unchanged(empty));

  let s = empty;
  for (let i = 0; i < 5; i++) s = box.apply(s, 'enqueue');
  assert.deepStrictEqual(s.slots, [null, 1, 2, 3, 4, 5], '0 號格是空著的那一格');
  assert.strictEqual(s.front, 0); assert.strictEqual(s.rear, 5);
  const full = box.apply(s, 'enqueue');
  assert.strictEqual(full.error, 'overflow'); assert.deepStrictEqual(unchanged(full), unchanged(s));
  assert.match(box.errors.overflow, /空一格/);

  s = box.apply(s, 'dequeue');
  assert.strictEqual(s.got, 1); assert.strictEqual(s.front, 1); assert.strictEqual(s.slots[1], null);
  s = box.apply(s, 'enqueue');
  assert.strictEqual(s.rear, 0, 'rear 從 5 號格繞回 0 號格'); assert.deepStrictEqual(s.slots, [6, null, 2, 3, 4, 5]);
  assert.strictEqual(box.apply(s, 'enqueue').error, 'overflow', '繞回之後一樣空一格就算滿');

  for (let i = 0; i < 5; i++) s = box.apply(s, 'dequeue');
  assert.deepStrictEqual([s.front, s.rear, s.got], [0, 0, 6], 'front 也繞回 0 號格，front == rear 又是空的');
  assert.strictEqual(box.apply(s, 'dequeue').error, 'underflow');
});

test('分格靜態圖照操作重播：七格的圖說跟決定表一字不差', () => {
  const frames = CR.replay('ds', 'circular_queue', page.frames);
  assert.deepStrictEqual(frames.map(f => f.label), [
    'enqueue(1)', 'enqueue(2)', 'enqueue(3)', 'enqueue(4)', 'enqueue(5)：滿了', 'dequeue() → 1', 'enqueue(6)：繞回 0 號格，滿了',
  ]);
  assert.ok(frames.every(f => !f.state.error));
  assert.deepStrictEqual(frames.map(f => f.state.touched), [1, 2, 3, 4, 5, 1, 0], '每一步動到的那格');
  assert.deepStrictEqual(frames[4].state.slots, [null, 1, 2, 3, 4, 5], '每一格的狀態各自保留，不會被後面的步驟改掉');
  assert.deepStrictEqual(frames.at(-1).state.slots, [6, null, 2, 3, 4, 5]);
});
