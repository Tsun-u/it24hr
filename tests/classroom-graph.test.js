// tests/classroom-graph.test.js（node --test）：小教室 Graph 頁的沙盒與分格圖
const test = require('node:test'); const assert = require('node:assert');
const CR = require('../classroom.js');
const page = CR.PAGES.graph;

const press = (s, op, times) => { for (let i = 0; i < times; i++) s = page.sandbox.apply(s, op); return s; };

test('圖的沙盒：BFS 走 A B C D E F、DFS 走 A B D E C F；換另一種從 A 重來；走完再按是錯誤、狀態不變', () => {
  const box = page.sandbox;
  const bfs = press(box.init(), 'bfs', 6);
  assert.deepStrictEqual(bfs.visited, ['A', 'B', 'C', 'D', 'E', 'F']);
  assert.deepStrictEqual(bfs.queue, []);

  let s = box.init(); const dfsLabels = [];
  for (let i = 0; i < 6; i++) { s = box.apply(s, 'dfs'); dfsLabels.push(box.label('dfs', s)); }
  assert.deepStrictEqual(s.visited, ['A', 'B', 'D', 'E', 'C', 'F']);
  assert.strictEqual(dfsLabels[3], 'DFS：拜訪 E，堆疊 A B E', 'D 走不下去，退回 B 再走 E');

  const switched = box.apply(press(box.init(), 'bfs', 3), 'dfs');
  assert.deepStrictEqual(switched.visited, ['A'], 'BFS 走到一半按 DFS，從 A 重新開始');
  assert.deepStrictEqual(switched.stack, ['A']); assert.deepStrictEqual(switched.queue, []);
  assert.deepStrictEqual(box.apply(press(box.init(), 'dfs', 6), 'bfs').visited, ['A'], 'DFS 走完按 BFS，也從 A 重新開始');

  for (const [op, done] of [['bfs', bfs], ['dfs', s]]) {
    const again = box.apply(done, op);
    assert.strictEqual(again.error, 'done', `${op} 走完再按`);
    for (const k of ['mode', 'visited', 'queue', 'stack']) assert.deepStrictEqual(again[k], done[k], `${op} 走完再按，${k} 不變`);
  }
  assert.strictEqual(box.errors.done, '六個站都走過了');
});

test('分格靜態圖照操作重播：六格 BFS，每格寫出拜訪的點和目前的佇列', () => {
  const frames = CR.replay('graph', page.frames);
  assert.deepStrictEqual(frames.map(f => f.label), [
    'BFS：拜訪 A，佇列 B C',
    'BFS：拜訪 B，佇列 C D E',
    'BFS：拜訪 C，佇列 D E F',
    'BFS：拜訪 D，佇列 E F',
    'BFS：拜訪 E，佇列 F',
    'BFS：拜訪 F，佇列空了',
  ]);
  assert.ok(frames.every(f => !f.state.error));
});
