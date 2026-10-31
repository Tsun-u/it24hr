// tests/classroom-stack.test.js（node --test）：小教室 Stack 頁的沙盒、分格圖、河內塔
const test = require('node:test'); const assert = require('node:assert');
const CR = require('../classroom.js');
const page = CR.PAGES.stack;

test('堆疊沙盒：後進先出；空的拿是 underflow、放滿再放是 overflow，狀態不變', () => {
  const box = page.sandbox;
  let s = box.init();
  assert.strictEqual(box.apply(s, 'pop').error, 'underflow');
  for (let i = 0; i < box.capacity; i++) s = box.apply(s, 'push');
  assert.deepStrictEqual(s.items, [1, 2, 3, 4, 5, 6]);
  const full = box.apply(s, 'push');
  assert.strictEqual(full.error, 'overflow'); assert.deepStrictEqual(full.items, s.items);
  s = box.apply(s, 'pop');
  assert.strictEqual(s.got, 6); assert.deepStrictEqual(s.items, [1, 2, 3, 4, 5]);
});

test('分格靜態圖照操作重播：Stack 的六格依序是 push 1、2、3、pop 拿到 3、push 4、pop 拿到 4', () => {
  const frames = CR.replay('stack', page.frames);
  assert.deepStrictEqual(frames.map(f => f.label), ['push(1)', 'push(2)', 'push(3)', 'pop() → 3', 'push(4)', 'pop() → 4']);
  assert.ok(frames.every(f => !f.state.error));
  assert.deepStrictEqual(frames.at(-1).state.items, [1, 2]);
});

test('河內塔：拿最上面那片、大的不能疊在小的上面、點同一根是放回去；最少步數照著搬就完成', () => {
  const H = page.classic; let s = H.init(3);
  assert.strictEqual(H.apply(s, 1).error, 'empty', '空的柱子拿不起來');
  s = H.apply(s, 0); assert.strictEqual(s.from, 0);
  s = H.apply(s, 0); assert.strictEqual(s.from, null, '點同一根是放回去'); assert.strictEqual(s.moves, 0);
  s = H.apply(H.apply(s, 0), 2);                          // 1 → C
  const bad = H.apply(H.apply(s, 0), 2);                  // 2 疊到 1 上面
  assert.strictEqual(bad.error, 'bigger'); assert.deepStrictEqual(bad.pegs, s.pegs);
  // 三片的最少解：7 步
  let t = H.init(3);
  for (const [a, b] of [[0, 2], [0, 1], [2, 1], [0, 2], [1, 0], [1, 2], [0, 2]]) t = H.apply(H.apply(t, a), b);
  assert.ok(t.done); assert.strictEqual(t.moves, H.min(3)); assert.deepStrictEqual(t.pegs[2], [3, 2, 1]);
  assert.strictEqual(H.min(4), 15);
});
