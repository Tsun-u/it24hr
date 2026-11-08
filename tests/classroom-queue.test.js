// tests/classroom-queue.test.js（node --test）：小教室 Queue 頁的沙盒與分格圖
const test = require('node:test'); const assert = require('node:assert');
const CR = require('../classroom.js');
const page = CR.PAGES.ds.queue;

test('佇列：先進先出；分格圖依序是 enqueue 1、2、3、dequeue 拿到 1、enqueue 4、dequeue 拿到 2', () => {
  const box = page.sandbox;
  assert.strictEqual(box.apply(box.init(), 'dequeue').error, 'underflow');
  const frames = CR.replay('ds', 'queue', page.frames);
  assert.deepStrictEqual(frames.map(f => f.label), ['enqueue(1)', 'enqueue(2)', 'enqueue(3)', 'dequeue() → 1', 'enqueue(4)', 'dequeue() → 2']);
  assert.deepStrictEqual(frames.at(-1).state.items, [3, 4]);
});
