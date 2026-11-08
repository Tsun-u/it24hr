// tests/classroom-tree.test.js（node --test）：小教室 Tree 頁的沙盒與分格圖
const test = require('node:test'); const assert = require('node:assert');
const CR = require('../classroom.js');
const page = CR.PAGES.ds.tree;

// 每個節點都比左子樹全部大、比右子樹全部小
const isBST = (node, low = -Infinity, high = Infinity) =>
  !node || (low < node.value && node.value < high && isBST(node.left, low, node.value) && isBST(node.right, node.value, high));

test('二元搜尋樹沙盒：左小右大、圖說寫出一路比過的節點；七個放完再插是錯誤且狀態不變；空的樹走訪是 underflow；中序走訪由小到大', () => {
  const box = page.sandbox;
  let s = box.init();
  const empty = box.apply(s, 'inorder');
  assert.strictEqual(empty.error, 'underflow'); assert.strictEqual(empty.tree, null);

  for (let i = 0; i < 7; i++) { s = box.apply(s, 'insert'); assert.ok(isBST(s.tree), `第 ${i + 1} 個放完還是左小右大`); }
  const { tree } = s;
  assert.deepStrictEqual([tree.value, tree.left.value, tree.right.value], [50, 30, 70]);
  assert.deepStrictEqual([tree.left.left.value, tree.left.right.value, tree.right.left.value, tree.right.right.value], [20, 40, 60, 80]);
  assert.deepStrictEqual(s.path, [50, 70]);
  assert.strictEqual(box.label('insert', s), 'insert(80)：比 50 大往右、比 70 大往右');

  const more = box.apply(s, 'insert');
  assert.strictEqual(more.error, 'allPlanted'); assert.match(box.errors.allPlanted, /七個數都種進去了/);
  assert.strictEqual(more.tree, s.tree); assert.strictEqual(more.size, 7);

  s = box.apply(s, 'inorder');
  assert.deepStrictEqual(s.visited, [20, 30, 40, 50, 60, 70, 80]);
  assert.strictEqual(box.label('inorder', s), 'inorder() → 20 30 40 50 60 70 80');
});

test('分格靜態圖照操作重播：Tree 的六格依序是插入 50、30、70、20、40（寫出一路比過的節點），再中序走訪', () => {
  const frames = CR.replay('ds', 'tree', page.frames);
  assert.deepStrictEqual(frames.map(f => f.label), [
    'insert(50)',
    'insert(30)：比 50 小往左',
    'insert(70)：比 50 大往右',
    'insert(20)：比 50 小往左、比 30 小往左',
    'insert(40)：比 50 小往左、比 30 大往右',
    'inorder() → 20 30 40 50 70',
  ]);
  assert.ok(frames.every(f => !f.state.error));
});
