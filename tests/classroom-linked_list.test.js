// tests/classroom-linked_list.test.js（node --test）：小教室 Linked List 頁的沙盒與分格圖
const test = require('node:test'); const assert = require('node:assert');
const CR = require('../classroom.js');
const page = CR.PAGES.linked_list;

test('鏈結串列沙盒：插到頭不用走、接到尾要走過前面每一個節點；空的刪頭是 underflow；畫面放滿 6 個再放有錯誤、狀態不變', () => {
  const box = page.sandbox;
  let s = box.init();
  assert.strictEqual(box.apply(s, 'removeHead').error, 'underflow');
  s = box.apply(s, 'insertHead');
  assert.deepStrictEqual(s.items, [0]); assert.strictEqual(s.walked, 0); assert.strictEqual(s.fresh, 0);
  for (let before = 1; before < box.capacity; before++) {
    s = box.apply(s, 'append');
    assert.strictEqual(s.walked, before, `接之前有 ${before} 個節點，要走 ${before} 步`);
    assert.strictEqual(s.fresh, before);
  }
  assert.deepStrictEqual(s.items, [0, 1, 2, 3, 4, 5]);
  for (const op of ['insertHead', 'append']) {
    const full = box.apply(s, op);
    assert.strictEqual(full.error, 'overflow');
    assert.deepStrictEqual(full.items, s.items); assert.strictEqual(full.nextHead, s.nextHead); assert.strictEqual(full.nextTail, s.nextTail);
  }
  assert.ok(!box.errors.overflow.includes('overflow'), '鏈結串列沒有容量上限，放不下的提示不說 overflow');
  s = box.apply(s, 'removeHead');
  assert.strictEqual(s.got, 0); assert.deepStrictEqual(s.items, [1, 2, 3, 4, 5]); assert.strictEqual(s.fresh, null);
  s = box.apply(s, 'insertHead');
  assert.deepStrictEqual(s.items, [-1, 1, 2, 3, 4, 5], '插到頭放 0、−1、−2…往前長');
});

test('鏈結串列分格圖：接 1、接 2 走 1 步、頭插 0、刪頭拿到 0、接 3 走 2 步', () => {
  const frames = CR.replay('linked_list', page.frames);
  assert.deepStrictEqual(frames.map(f => f.label), ['append(1)', 'append(2)：走 1 步', 'insertHead(0)', 'removeHead() → 0', 'append(3)：走 2 步']);
  assert.ok(frames.every(f => !f.state.error));
  assert.deepStrictEqual(frames.at(-1).state.items, [1, 2, 3]);
});
