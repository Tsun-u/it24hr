// tests/classroom-null.test.js（node --test）：小教室 null 頁的沙盒與分格圖
const test = require('node:test'); const assert = require('node:assert');
const CR = require('../classroom.js');
const page = CR.PAGES.ds.null;

test('null 沙盒：一開始是 null，push 是錯誤、數字不前進；建立後是空的堆疊；push 照 1、2、3；再建立換成新的空堆疊', () => {
  const box = page.sandbox;
  let s = box.init();
  assert.strictEqual(s.items, null, '一開始 s 是 null');
  const bad = box.apply(s, 'push');
  assert.strictEqual(bad.error, 'null');
  assert.strictEqual(bad.items, null, '對 null push 之後還是 null');
  assert.strictEqual(bad.next, s.next, '出錯不算數');
  s = box.apply(bad, 'create');
  assert.deepStrictEqual(s.items, [], '建立後是空的堆疊，不是 null');
  assert.strictEqual(s.created, 'new'); assert.strictEqual(s.error, null);
  for (let i = 0; i < 3; i++) s = box.apply(s, 'push');
  assert.deepStrictEqual(s.items, [1, 2, 3]);
  s = box.apply(s, 'create');
  assert.deepStrictEqual(s.items, [], '再建立：舊的丟掉，換成新的空堆疊');
  assert.strictEqual(s.created, 'replaced');
  assert.strictEqual(box.label('create', s), 's = new Stack()：舊的丟掉，換成新的空堆疊');
  for (let i = 0; i < box.capacity; i++) s = box.apply(s, 'push');
  const full = box.apply(s, 'push');
  assert.strictEqual(full.error, 'overflow'); assert.deepStrictEqual(full.items, s.items);
});

test('分格靜態圖照操作重播：第一格是錯誤示範（對 null push），接著建立、push 1、push 2', () => {
  const frames = CR.replay('ds', 'null', page.frames);
  assert.deepStrictEqual(frames.map(f => f.label), ['s.push(1) → 錯誤：s 是 null', 's = new Stack()', 's.push(1)', 's.push(2)']);
  assert.strictEqual(frames[0].state.error, 'null'); assert.strictEqual(frames[0].state.items, null);
  assert.ok(frames.slice(1).every(f => !f.state.error));
  assert.deepStrictEqual(frames.at(-1).state.items, [1, 2]);
});
