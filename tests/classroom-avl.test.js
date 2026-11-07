// tests/classroom-avl.test.js（node --test）：小教室 AVL 樹頁的沙盒與分格圖
const test = require('node:test'); const assert = require('node:assert');
const CR = require('../classroom.js');
const page = CR.PAGES.avl;

const inorder = (n) => (n ? [...inorder(n.left), n.value, ...inorder(n.right)] : []);
// 高度自己從頭數，不看節點上存的 height
const height = (n) => (n ? 1 + Math.max(height(n.left), height(n.right)) : 0);
const isBST = (n) => inorder(n).every((v, i, a) => i === 0 || a[i - 1] < v);
// 每個節點左右子樹的高度差都不超過 1
const isBalanced = (n) => !n || (Math.abs(height(n.left) - height(n.right)) <= 1 && isBalanced(n.left) && isBalanced(n.right));
const storedHeightsRight = (n) => !n || (n.height === height(n) && storedHeightsRight(n.left) && storedHeightsRight(n.right));
// 樹寫成一行：值(左,右)，樹葉只寫值
const shape = (n) => (!n ? '' : n.left || n.right ? `${n.value}(${shape(n.left)},${shape(n.right)})` : String(n.value));
// 測試自己建樹用：不平衡也不轉
const T = (value, left = null, right = null) => ({ value, left, right });

test('AVL 沙盒：每插一個都還是二元搜尋樹、每個節點左右高度差不超過 1、最多三層', () => {
  const box = page.sandbox;
  let s = box.init();
  for (let i = 0; i < 7; i++) {
    s = box.apply(s, 'insert');
    assert.ok(isBST(s.tree), `第 ${i + 1} 個放完還是二元搜尋樹`);
    assert.ok(isBalanced(s.tree), `第 ${i + 1} 個放完高度差都不超過 1`);
    assert.ok(storedHeightsRight(s.tree), `第 ${i + 1} 個放完節點記的高度都對`);
    assert.ok(height(s.tree) <= 3, `第 ${i + 1} 個放完最多三層`);
  }
  assert.strictEqual(shape(s.tree), '35(10(5,20),65(50,70))');
});

test('四種旋轉各一次：圖說寫出誰失衡、哪一種、怎麼轉；另外三次不用轉', () => {
  const box = page.sandbox;
  let s = box.init();
  const steps = [];
  for (let i = 0; i < 7; i++) { s = box.apply(s, 'insert'); steps.push({ kind: s.fix && s.fix.kind, label: box.label('insert', s), shape: shape(s.tree) }); }
  assert.deepStrictEqual(steps.map(t => t.kind), [null, null, 'LL', null, 'RR', 'LR', 'RL']);
  assert.deepStrictEqual(steps[2], { kind: 'LL', label: 'insert(5)：70 左邊太重（LL），右旋', shape: '50(5,70)' });
  assert.deepStrictEqual(steps[4], { kind: 'RR', label: 'insert(35)：5 右邊太重（RR），左旋', shape: '50(10(5,35),70)' });
  assert.deepStrictEqual(steps[5], { kind: 'LR', label: 'insert(20)：50 左邊太重（LR），先對 10 左旋、再對 50 右旋', shape: '35(10(5,20),50(,70))' });
  assert.deepStrictEqual(steps[6], { kind: 'RL', label: 'insert(65)：50 右邊太重（RL），先對 70 右旋、再對 50 左旋', shape: '35(10(5,20),65(50,70))' });
});

test('七個放完再放是錯誤且樹不變；中序走訪由小到大；空的樹走訪是 underflow', () => {
  const box = page.sandbox;
  const empty = box.apply(box.init(), 'inorder');
  assert.strictEqual(empty.error, 'underflow'); assert.strictEqual(empty.tree, null);

  let s = box.init();
  for (let i = 0; i < 7; i++) s = box.apply(s, 'insert');
  const more = box.apply(s, 'insert');
  assert.strictEqual(more.error, 'allPlaced'); assert.match(box.errors.allPlaced, /中序走訪/);
  assert.strictEqual(more.tree, s.tree); assert.strictEqual(more.placed, 7);

  const walked = box.apply(s, 'inorder');
  assert.deepStrictEqual(walked.visited, [5, 10, 20, 35, 50, 65, 70]);
  assert.strictEqual(box.label('inorder', walked), 'inorder() → 5 10 20 35 50 65 70：由小到大，還是二元搜尋樹');
  assert.strictEqual(walked.visited.join(' '), page.code.output);
});

test('分格靜態圖照操作重播：插入七個數，圖說照決定表', () => {
  const frames = CR.replay('avl', page.frames);
  assert.deepStrictEqual(frames.map(f => f.label), [
    'insert(70)',
    'insert(50)',
    'insert(5)：70 左邊太重（LL），右旋',
    'insert(10)',
    'insert(35)：5 右邊太重（RR），左旋',
    'insert(20)：50 左邊太重（LR），先對 10 左旋、再對 50 右旋',
    'insert(65)：50 右邊太重（RL），先對 70 右旋、再對 50 左旋',
  ]);
  assert.ok(frames.every(f => !f.state.error));
});

test('常見誤解舉的例子：插入 35 還沒轉時 5 和 50 都失衡；LR 只右旋一次還是差 2；節點數不同也可以平衡', () => {
  const bf = (n) => height(n.left) - height(n.right);
  // 50(5(,10),70) 照一般二元搜尋樹放進 35，還沒轉
  const five = T(5, null, T(10, null, T(35))), before = T(50, five, T(70));
  assert.strictEqual(bf(five), -2); assert.strictEqual(bf(before), 2);

  // 50(10(5,35(20,)),70) 直接對 50 右旋：10 升上去，左邊一層、右邊三層
  const once = T(10, T(5), T(50, T(35, T(20)), T(70)));
  assert.deepStrictEqual([height(once.left), height(once.right)], [1, 3]);
  assert.ok(isBST(once)); assert.ok(!isBalanced(once));

  // 左子樹滿的三層（7 個）、右子樹兩層（2 個）
  const full = T(4, T(2, T(1), T(3)), T(6, T(5), T(7))), lopsided = T(8, full, T(9, null, T(10)));
  assert.deepStrictEqual([inorder(lopsided.left).length, inorder(lopsided.right).length], [7, 2]);
  assert.ok(isBST(lopsided)); assert.ok(isBalanced(lopsided));
});

test('一百萬個節點的 AVL 樹最多 28 層：h 層最少要 F(h+2) − 1 個節點', () => {
  const fewest = [0, 1];   // 高度 h 的 AVL 樹最少幾個節點：一邊 h − 1 層、另一邊 h − 2 層，再加自己
  while (fewest[fewest.length - 1] <= 1e6) fewest.push(fewest[fewest.length - 1] + fewest[fewest.length - 2] + 1);
  assert.strictEqual(fewest.length - 2, 28);
  assert.ok(Math.abs(1.44 * Math.log2(1e6) - 28) < 1);
});
