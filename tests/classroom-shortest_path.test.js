// tests/classroom-shortest_path.test.js（node --test）：小教室最短路徑（Dijkstra）頁的沙盒與分格圖
const test = require('node:test'); const assert = require('node:assert');
const CR = require('../classroom.js');
const page = CR.PAGES.shortest_path;

// 決定表那張圖：跟沙盒用的是同一份邊
const EDGES = [['A', 'B', 3], ['A', 'C', 7], ['B', 'C', 2], ['B', 'D', 5], ['C', 'D', 4], ['C', 'E', 8], ['D', 'E', 1], ['D', 'F', 6], ['E', 'F', 9]];
const weight = (a, b) => EDGES.find(([p, q]) => (p === a && q === b) || (p === b && q === a))[2];
const INF = Infinity;

// 從 init 開始按 times 次「確定下一個點」，回傳每一步之後的狀態
const press = (times) => {
  const states = []; let s = page.sandbox.init();
  for (let i = 0; i < times; i++) { s = page.sandbox.apply(s, 'settle'); states.push(s); }
  return states;
};

const LABELS = [
  '確定 A（0）：B 3、C 7',
  '確定 B（3）：C 改成 5、D 8',
  '確定 C（5）：E 13',
  '確定 D（8）：E 改成 9、F 14',
  '確定 E（9）',
  '確定 F（14）',
];

test('一開始只有 A 是 0、其他都是 ∞，還沒有確定的點', () => {
  const s = page.sandbox.init();
  assert.deepStrictEqual(s.dist, { A: 0, B: INF, C: INF, D: INF, E: INF, F: INF });
  assert.deepStrictEqual(s.done, []);
});

test('每一步確定還沒確定、距離最小的點：依序 A B C D E F，確定時的距離 0 3 5 8 9 14', () => {
  const steps = press(6);
  assert.deepStrictEqual(steps.map(s => [s.current, s.dist[s.current]]), [['A', 0], ['B', 3], ['C', 5], ['D', 8], ['E', 9], ['F', 14]]);
  assert.deepStrictEqual(steps.at(-1).done, ['A', 'B', 'C', 'D', 'E', 'F']);
  assert.deepStrictEqual(steps.at(-1).dist, { A: 0, B: 3, C: 5, D: 8, E: 9, F: 14 }, '最後的距離表');
});

test('每一步記下改小了誰、改小前是多少；繞過去比較遠的不改', () => {
  const steps = press(6);
  assert.deepStrictEqual(steps.map(s => s.improved.map(({ v }) => v)), [['B', 'C'], ['C', 'D'], ['E'], ['E', 'F'], [], []]);
  assert.deepStrictEqual(steps[1].improved, [{ v: 'C', was: 7 }, { v: 'D', was: INF }], '確定 B：C 從 7 改成 5、D 從 ∞ 算到 8');
  assert.deepStrictEqual(steps[3].improved, [{ v: 'E', was: 13 }, { v: 'F', was: INF }], '確定 D：E 從 13 改成 9、F 從 ∞ 算到 14');
  assert.strictEqual(steps[2].dist.D, 8, '確定 C 時 A → B → C → D 是 9，比原本的 8 遠，D 不改');
});

test('圖說寫出確定的點和距離，改小的寫「改成」，從 ∞ 第一次算到的直接寫距離', () => {
  assert.deepStrictEqual(press(6).map(s => page.sandbox.label('settle', s)), LABELS);
});

test('六個點都確定了再按是錯誤，距離和確定的順序都不變', () => {
  const last = press(6).at(-1);
  const again = page.sandbox.apply(last, 'settle');
  assert.strictEqual(again.error, 'done');
  assert.deepStrictEqual(again.dist, last.dist);
  assert.deepStrictEqual(again.done, last.done);
  assert.deepStrictEqual(again.improved, []);
  assert.match(page.sandbox.errors.done, /都確定了/);
});

test('分格靜態圖照決定表重播六格', () => {
  const frames = CR.replay('shortest_path', page.frames);
  assert.deepStrictEqual(frames.map(f => f.label), LABELS);
  assert.ok(frames.every(f => !f.state.error));
});

test('常見誤解的對照數字：每個點的最短路只有一條，最短路徑樹總長 17，最小生成樹總長 16', () => {
  const { dist, prev } = press(6).at(-1);
  // 最短路只有一條：除了 A，每個點都剛好只有一個鄰居 u 滿足 dist[u] + 權重 = 自己的距離
  for (const v of 'BCDEF') {
    const via = EDGES.filter(([a, b]) => a === v || b === v).map(([a, b, w]) => [a === v ? b : a, w]).filter(([u, w]) => dist[u] + w === dist[v]);
    assert.strictEqual(via.length, 1, `${v} 的最短路不只一條`);
  }
  assert.deepStrictEqual(prev, { B: 'A', C: 'B', D: 'B', E: 'D', F: 'D' });
  assert.strictEqual(Object.entries(prev).reduce((sum, [v, p]) => sum + weight(v, p), 0), 17);

  // Kruskal：邊從短到長，兩頭已經連通就跳過（會成環），不然就選它、把兩組接起來
  const leader = {}; const find = (v) => (leader[v] ? find(leader[v]) : v);
  const mst = [];
  for (const [a, b, w] of [...EDGES].sort((p, q) => p[2] - q[2])) {
    if (find(a) === find(b)) continue;
    leader[find(a)] = find(b);
    mst.push([a, b, w]);
  }
  assert.deepStrictEqual(mst.map(([a, b]) => `${a}–${b}`).sort(), ['A–B', 'B–C', 'C–D', 'D–E', 'D–F']);
  assert.strictEqual(mst.reduce((sum, [, , w]) => sum + w, 0), 16);

  const trap = page.traps.find(t => /最小生成樹/.test(t.wrong));
  assert.match(trap.right, /總長 17/); assert.match(trap.right, /總長 16/); assert.match(trap.right, /C–D 4/);
});
