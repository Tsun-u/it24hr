// tests/classroom-disjoint_set.test.js（node --test）：小教室 Disjoint Set 頁的沙盒與分格圖
const test = require('node:test'); const assert = require('node:assert');
const CR = require('../classroom.js');
const page = CR.PAGES.ds.disjoint_set;

// 一路往上走到上一層是自己的人
const leaderOf = (parent, x) => { while (parent[x] !== x) x = parent[x]; return x; };
const run = (ops) => ops.reduce((s, op) => page.sandbox.apply(s, op), page.sandbox.init());

test('合併照人數：一開始各自一組；一樣大時第二個的組長接到第一個下面，小的那組接到大的下面', () => {
  const box = page.sandbox;
  const start = box.init();
  for (const p of 'ABCDEF') assert.strictEqual(start.parent[p], p);

  let s = run(['union', 'union', 'union']);
  assert.strictEqual(s.parent.B, 'A'); assert.strictEqual(s.parent.D, 'C'); assert.strictEqual(s.parent.C, 'A');
  assert.strictEqual(s.size.A, 4);
  assert.strictEqual(s.merge.small, 'C', 'A、C 一樣大，C（第二個的組長）接到 A 下面');

  s = box.apply(box.apply(s, 'union'), 'union');
  assert.strictEqual(s.parent.F, 'E');
  assert.strictEqual(s.parent.E, 'A', 'E 那組 2 人比 A 那組 4 人小，接到 A 下面');
  assert.strictEqual(s.size.A, 6);
});

test('路徑壓縮：find(D) 走 D → C → A，D 直接接到組長 A，誰跟誰同組不變', () => {
  const before = run(['union', 'union', 'union']);
  const after = page.sandbox.apply(before, 'find');
  assert.strictEqual(before.parent.D, 'C');
  assert.strictEqual(after.found, 'A');
  assert.deepStrictEqual(after.path, ['D', 'C', 'A']);
  assert.strictEqual(after.parent.D, 'A');
  for (const p of 'ABCDEF') assert.strictEqual(leaderOf(after.parent, p), leaderOf(before.parent, p), `${p} 的組長沒變`);
});

test('同組判斷：照範例程式合併 A–B、C–D、B–D、E–F，D 和 A 同組、E 和 A 不同組、A 那組 4 個人，跟 code.output 一樣', () => {
  const s = run(['union', 'union', 'union', 'union']);
  const a = leaderOf(s.parent, 'A');
  const yesNo = (ok) => (ok ? 'yes' : 'no');
  const got = [yesNo(leaderOf(s.parent, 'D') === a), yesNo(leaderOf(s.parent, 'E') === a), s.size[a]].join(' ');
  assert.strictEqual(got, page.code.output);
});

test('五對合完再按 union 是錯誤「六個人都同一組了」，狀態不變', () => {
  const box = page.sandbox;
  const s = run(['union', 'union', 'union', 'union', 'union']);
  for (const p of 'ABCDEF') assert.strictEqual(leaderOf(s.parent, p), 'A');
  const more = box.apply(s, 'union');
  assert.strictEqual(more.error, 'allJoined'); assert.match(box.errors.allJoined, /六個人都同一組了/);
  assert.strictEqual(more.parent, s.parent); assert.strictEqual(more.size, s.size); assert.strictEqual(more.joined, 5);
});

test('沒按 find 就合併 F–D：union 裡找 D 的組長時也會路徑壓縮，圖說寫出來', () => {
  const s = run(['union', 'union', 'union', 'union', 'union']);
  assert.strictEqual(s.parent.D, 'A');
  assert.strictEqual(page.sandbox.label('union', s), 'union(F, D)：E 那組比較小，接到 A 下面；找 D 的組長時路徑壓縮，D 直接接到 A');
});

test('find(D) 的另外兩種圖說：D 自己是組長、D 本來就直接接在組長下面', () => {
  const box = page.sandbox;
  assert.strictEqual(box.label('find', run(['find'])), 'find(D) → D：D 自己就是組長');
  assert.strictEqual(box.label('find', run(['union', 'union', 'find'])), 'find(D) → C：走 D → C，D 本來就直接接在 C 下面');
});

test('分格靜態圖照操作重播，圖說照決定表原文', () => {
  const frames = CR.replay('ds', 'disjoint_set', page.frames);
  assert.deepStrictEqual(frames.map(f => f.label), [
    'union(A, B)：B 接到 A 下面',
    'union(C, D)：D 接到 C 下面',
    'union(B, D)：組長 A、C 一樣大，C 那組接到 A 下面',
    'find(D) → A：走 D → C → A，D 直接接到 A',
    'union(E, F)：F 接到 E 下面',
    'union(F, D)：E 那組比較小，接到 A 下面',
  ]);
  assert.ok(frames.every(f => !f.state.error));
});
