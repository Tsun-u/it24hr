// tests/classroom-b_tree.test.js（node --test）：小教室 B 樹頁的沙盒與分格圖
const test = require('node:test'); const assert = require('node:assert');
const CR = require('../classroom.js');
const page = CR.PAGES.ds.b_tree;

// 中序：左邊的孩子、一個鍵、下一個孩子……一路排下來
const inorder = (node) => (node.kids.length ? node.keys.flatMap((k, i) => [...inorder(node.kids[i]), k]).concat(inorder(node.kids.at(-1))) : node.keys);
const leafDepths = (node, d = 0) => (node.kids.length ? node.kids.flatMap(k => leafDepths(k, d + 1)) : [d]);
const height = (node) => leafDepths(node)[0] + 1;
const nodes = (node) => [node, ...node.kids.flatMap(nodes)];
// 合法的 3 階 B 樹：每個節點 1～2 個鍵、不是葉子的孩子比鍵多一個、葉子都在同一層、中序由小到大
function assertBTree(tree, msg) {
  for (const n of nodes(tree)) {
    assert.ok(n.keys.length >= 1 && n.keys.length <= 2, `${msg}：[${n.keys}] 的鍵數`);
    if (n.kids.length) assert.strictEqual(n.kids.length, n.keys.length + 1, `${msg}：[${n.keys}] 的孩子數`);
  }
  assert.strictEqual(new Set(leafDepths(tree)).size, 1, `${msg}：葉子都在同一層`);
  const seq = inorder(tree);
  assert.ok(seq.every((v, i) => i === 0 || seq[i - 1] < v), `${msg}：鍵由小到大`);
}
// 每一層的節點，寫成鍵的陣列
const levels = (tree) => { const out = []; for (let row = [tree]; row.length; row = row.flatMap(n => n.kids)) out.push(row.map(n => n.keys)); return out; };

const SPEC_LABELS = [
  'insert(10)',
  'insert(20)',
  'insert(30)：[10 20 30] 滿了，20 升上去，樹長高一層',
  'insert(40)',
  'insert(50)：[30 40 50] 滿了，40 升上去',
  'insert(60)',
  'insert(70)：[50 60 70] 滿了，60 升上去；[20 40 60] 也滿了，40 升上去，樹長高一層',
];

test('3 階 B 樹沙盒：每放一個都還是合法的 B 樹、圖說寫出誰滿了誰升上去；七個放完再放是錯誤且狀態不變', () => {
  const box = page.sandbox;
  let s = box.init();
  const labels = [];
  for (let i = 0; i < 7; i++) {
    s = box.apply(s, 'insert');
    assertBTree(s.tree, `第 ${i + 1} 個放完`);
    assert.strictEqual(inorder(s.tree).length, i + 1);
    labels.push(box.label('insert', s));
  }
  assert.deepStrictEqual(labels, SPEC_LABELS);
  assert.deepStrictEqual(levels(s.tree), [[[40]], [[20], [60]], [[10], [30], [50], [70]]]);

  const more = box.apply(s, 'insert');
  assert.strictEqual(more.error, 'allPlaced'); assert.match(box.errors.allPlaced, /找 60/);
  assert.strictEqual(more.tree, s.tree); assert.strictEqual(more.placed, 7);
});

test('拆開時記下塞爆的節點、拆成的兩半和升上去的鍵；根拆了樹長高一層，舊的狀態不被改到', () => {
  const box = page.sandbox;
  const states = [];
  let s = box.init();
  for (let i = 0; i < 7; i++) { s = box.apply(s, 'insert'); states.push(s); }
  assert.deepStrictEqual(states[2].splits, [{ full: [10, 20, 30], up: 20, left: [10], right: [30] }]);
  assert.ok(states[2].grew);
  assert.deepStrictEqual(states[4].splits, [{ full: [30, 40, 50], up: 40, left: [30], right: [50] }]);
  assert.ok(!states[4].grew);
  assert.deepStrictEqual(states[6].splits, [
    { full: [50, 60, 70], up: 60, left: [50], right: [70] },
    { full: [20, 40, 60], up: 40, left: [20], right: [60] },
  ]);
  assert.ok(states[6].grew);
  assert.deepStrictEqual(states.map(st => height(st.tree)), [1, 1, 2, 2, 2, 2, 3]);
  // 分格圖每一格留著自己的狀態：放完 70 之後，放 60 那一步的樹還是兩層
  assert.deepStrictEqual(levels(states[5].tree), [[[20, 40]], [[10], [30], [50, 60]]]);
});

test('找 60：從根往下，圖說列出比過的節點和往哪走；還沒放到 60 就是不在；空的樹是錯誤', () => {
  const box = page.sandbox;
  let s = box.init();
  const empty = box.apply(s, 'search');
  assert.strictEqual(empty.error, 'empty'); assert.match(box.errors.empty, /樹是空的/);

  const labels = [];
  for (let i = 0; i < 7; i++) {
    s = box.apply(s, 'insert');
    const found = box.apply(s, 'search');
    assert.strictEqual(found.tree, s.tree, '找不會改到樹');
    labels.push(box.label('search', found));
  }
  assert.deepStrictEqual(labels, [
    'search(60)：[10] 沒有，不在裡面',
    'search(60)：[10 20] 沒有，不在裡面',
    'search(60)：[20] 往右 → [30] 沒有，不在裡面',
    'search(60)：[20] 往右 → [30 40] 沒有，不在裡面',
    'search(60)：[20 40] 往右 → [50] 沒有，不在裡面',
    'search(60)：[20 40] 往右 → [50 60] 找到了',
    'search(60)：[40] 往右 → [60] 找到了',
  ]);
  const last = box.apply(s, 'search');
  assert.deepStrictEqual(last.path, [[40], [60]]); assert.strictEqual(last.found, true);
  assert.strictEqual(last.added, null); assert.deepStrictEqual(last.splits, []);
});

test('分格靜態圖照操作重播：依序放 10～70，圖說照決定表原文，最後一格兩層連續分裂、樹長高一層', () => {
  const frames = CR.replay('ds', 'b_tree', page.frames);
  assert.deepStrictEqual(frames.map(f => f.label), SPEC_LABELS);
  assert.ok(frames.every(f => !f.state.error));
});

test('常見誤解舉的例子：照 10～70 由小到大插，二元搜尋樹歪成 7 層，B 樹只有 3 層；insert(50) 升上去的是 40', () => {
  const bstHeight = (xs) => { let tree = null, h = 0; const put = (n, x, d) => { if (!n) { h = Math.max(h, d); return { v: x, l: null, r: null }; } return x < n.v ? { ...n, l: put(n.l, x, d + 1) } : { ...n, r: put(n.r, x, d + 1) }; }; for (const x of xs) tree = put(tree, x, 1); return h; };
  assert.strictEqual(bstHeight([10, 20, 30, 40, 50, 60, 70]), 7);
  const frames = CR.replay('ds', 'b_tree', page.frames);
  assert.strictEqual(height(frames.at(-1).state.tree), 3);
  assert.strictEqual(frames[4].state.splits[0].up, 40);
});
