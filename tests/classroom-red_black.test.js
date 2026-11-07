// tests/classroom-red_black.test.js（node --test）：小教室紅黑樹頁的沙盒與分格圖
const test = require('node:test'); const assert = require('node:assert');
const CR = require('../classroom.js');
const page = CR.PAGES.red_black;

const inorder = (n) => (n ? [...inorder(n.left), n.value, ...inorder(n.right)] : []);
const isBST = (n) => inorder(n).every((v, i, a) => i === 0 || a[i - 1] < v);
// 紅節點的孩子都是黑的（空的 NIL 算黑）
const noRedRed = (n) => !n || (!(n.red && ((n.left && n.left.red) || (n.right && n.right.red))) && noRedRed(n.left) && noRedRed(n.right));
// 每條往下走到 NIL 的路黑節點一樣多就回傳那個數（NIL 算一個），對不上回傳 -1
function blackHeight(n) {
  if (!n) return 1;
  const l = blackHeight(n.left), r = blackHeight(n.right);
  return l < 0 || l !== r ? -1 : l + (n.red ? 0 : 1);
}
// 從根走到每個 NIL 的路上有幾個節點
const pathLengths = (n) => (n ? [...pathLengths(n.left), ...pathLengths(n.right)].map(d => d + 1) : [0]);
const isRedBlack = (t) => !t || (!t.red && noRedRed(t) && blackHeight(t) > 0);
const height = (n) => (n ? 1 + Math.max(height(n.left), height(n.right)) : 0);
const shape = (n) => (n ? `${n.value}${n.red ? 'R' : 'B'}(${shape(n.left)},${shape(n.right)})` : '.');

const insertAll = () => {
  const box = page.sandbox; let s = box.init(); const steps = [];
  for (let i = 0; i < 7; i++) { s = box.apply(s, 'insert'); steps.push({ s, label: box.label('insert', s) }); }
  return steps;
};

test('每插一個都還是紅黑樹：根是黑的、沒有連著兩個紅、每條路黑節點一樣多，也還是二元搜尋樹；最長的路不超過最短的兩倍', () => {
  for (const { s } of insertAll()) {
    const at = `insert(${s.added}) 之後`;
    assert.strictEqual(s.tree.red, false, `${at}根是黑的`);
    assert.ok(noRedRed(s.tree), `${at}沒有連著兩個紅`);
    assert.ok(blackHeight(s.tree) > 0, `${at}每條路的黑節點一樣多`);
    assert.ok(isBST(s.tree), `${at}還是二元搜尋樹`);
    const lens = pathLengths(s.tree);
    assert.ok(Math.max(...lens) <= 2 * Math.min(...lens), `${at}最長的路不超過最短的兩倍`);
  }
});

test('插入的四種情況都出現：根變黑、叔叔是紅的要變色、叔叔是黑的一直線轉一次、拐彎轉兩次', () => {
  const steps = insertAll();
  assert.deepStrictEqual(steps.map(x => x.label), [
    'insert(10)：根變黑',
    'insert(20)',
    'insert(30)：連兩個紅，叔叔是黑的，對 10 左旋、換顏色',
    'insert(15)：叔叔 30 是紅的，10、30 變黑、20 變紅，根再變回黑',
    'insert(25)',
    'insert(28)：拐彎了，先對 25 左旋、再對 30 右旋、換顏色',
    'insert(5)',
  ]);
  assert.strictEqual(shape(steps[6].s.tree), '20B(10B(5R(.,.),15R(.,.)),28B(25R(.,.),30R(.,.)))');
});

test('黃色外框標這一步新放的、變色的、轉過的節點', () => {
  const touched = insertAll().map(({ s }) => [...s.touched].sort((a, b) => a - b));
  assert.deepStrictEqual(touched, [[10], [20], [10, 20, 30], [10, 15, 20, 30], [25], [25, 28, 30], [5]]);
});

test('常見誤解舉的數字：只有放 30、28 時轉；放完根 20 的兩個孩子都是黑的', () => {
  const steps = insertAll();
  const rotated = steps.filter(({ s }) => s.fixes.some(f => f.kind === 'line' || f.kind === 'bend')).map(({ s }) => s.added);
  assert.deepStrictEqual(rotated, [30, 28]);
  assert.deepStrictEqual(steps.find(({ s }) => s.added === 15).s.fixes.map(f => f.kind), ['uncleRed', 'root']);
  const { tree } = steps[6].s;
  assert.strictEqual(tree.value, 20);
  assert.ok(!tree.left.red && !tree.right.red);
});

test('常見誤解「左右可以差不只一層」：這棵樹守五條規則，但根的左右子樹高度差 2', () => {
  const N = (value, red, left = null, right = null) => ({ value, red, left, right });
  const t = N(10, false, N(5, false), N(20, true, N(15, false), N(30, false, null, N(40, true))));
  assert.ok(isRedBlack(t) && isBST(t));
  assert.strictEqual(height(t.right) - height(t.left), 2);
});

test('七個放完再放是錯誤且狀態不變；中序走訪由小到大、跟範例程式的輸出一樣；空的樹走訪是 underflow', () => {
  const box = page.sandbox;
  const s = insertAll()[6].s;
  const more = box.apply(s, 'insert');
  assert.strictEqual(more.error, 'allPlaced'); assert.match(box.errors.allPlaced, /重來/);
  assert.strictEqual(more.tree, s.tree); assert.strictEqual(more.placed, 7);

  const walked = box.apply(s, 'inorder');
  assert.strictEqual(box.label('inorder', walked), 'inorder() → 5 10 15 20 25 28 30');
  assert.strictEqual(walked.visited.join(' '), page.code.output);
  assert.strictEqual(walked.tree, s.tree);

  const empty = box.apply(box.init(), 'inorder');
  assert.strictEqual(empty.error, 'underflow'); assert.strictEqual(empty.tree, null);
});

test('分格靜態圖照操作重播：七次插入，圖說照決定表', () => {
  const frames = CR.replay('red_black', page.frames);
  assert.deepStrictEqual(frames.map(f => f.label), [
    'insert(10)：根變黑',
    'insert(20)',
    'insert(30)：連兩個紅，叔叔是黑的，對 10 左旋、換顏色',
    'insert(15)：叔叔 30 是紅的，10、30 變黑、20 變紅，根再變回黑',
    'insert(25)',
    'insert(28)：拐彎了，先對 25 左旋、再對 30 右旋、換顏色',
    'insert(5)',
  ]);
  assert.ok(frames.every(f => !f.state.error));
  assert.ok(frames.every(f => isRedBlack(f.state.tree)));
});
