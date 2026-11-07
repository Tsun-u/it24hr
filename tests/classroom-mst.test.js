// tests/classroom-mst.test.js（node --test）：小教室 MST 頁的沙盒與分格圖
const test = require('node:test'); const assert = require('node:assert');
const CR = require('../classroom.js');
const page = CR.PAGES.mst;

const press = (s, op, times) => { for (let i = 0; i < times; i++) s = page.sandbox.apply(s, op); return s; };
const names = (edges) => edges.map(([a, b, w]) => `${a}–${b} ${w}`);
const total = (edges) => edges.reduce((sum, [, , w]) => sum + w, 0);
const MST = ['A–B 3', 'B–C 2', 'C–D 4', 'D–E 1', 'D–F 6'];

test('Kruskal：邊從短到長，跳過會成環的 B–D 5，選滿五條總長 16；圖說寫出選了或跳過哪條', () => {
  const box = page.sandbox;
  let s = box.init(); const labels = [];
  for (let i = 0; i < 6; i++) { s = box.apply(s, 'kruskal'); labels.push(box.label('kruskal', s)); }
  assert.deepStrictEqual(names(s.chosen), ['D–E 1', 'B–C 2', 'A–B 3', 'C–D 4', 'D–F 6']);
  assert.deepStrictEqual(names(s.skipped), ['B–D 5']);
  assert.deepStrictEqual([...names(s.chosen)].sort(), [...MST].sort());
  assert.strictEqual(total(s.chosen), 16);
  assert.strictEqual(labels[4], '跳過 B–D 5：會成環');
});

test('Prim：從 A 長出去，每次加連到樹外面最短的邊，選到的跟 Kruskal 同一棵、總長 16', () => {
  const box = page.sandbox;
  let s = box.init(); const labels = [];
  for (let i = 0; i < 5; i++) { s = box.apply(s, 'prim'); labels.push(box.label('prim', s)); }
  assert.deepStrictEqual(names(s.chosen), ['A–B 3', 'B–C 2', 'C–D 4', 'D–E 1', 'D–F 6']);
  assert.deepStrictEqual(s.skipped, []);
  assert.strictEqual(total(s.chosen), 16);
  assert.deepStrictEqual(labels, ['加 A–B 3', '加 B–C 2', '加 C–D 4', '加 D–E 1', '加 D–F 6：五條邊，完成']);
});

test('選滿五條再按是錯誤、選的邊不變；按另一種就從頭開始那一種', () => {
  const box = page.sandbox;
  for (const [op, times] of [['prim', 5], ['kruskal', 6]]) {
    const done = press(box.init(), op, times);
    const again = box.apply(done, op);
    assert.strictEqual(again.error, 'done', `${op} 選滿再按`);
    for (const k of ['mode', 'chosen', 'skipped']) assert.deepStrictEqual(again[k], done[k], `${op} 選滿再按，${k} 不變`);
  }
  assert.match(box.errors.done, /五條邊/);

  const switched = box.apply(press(box.init(), 'prim', 3), 'kruskal');
  assert.strictEqual(switched.mode, 'kruskal');
  assert.deepStrictEqual(names(switched.chosen), ['D–E 1'], 'Prim 做到一半按 Kruskal，從最短的邊重新開始');
  const back = box.apply(press(box.init(), 'kruskal', 6), 'prim');
  assert.strictEqual(back.mode, 'prim');
  assert.deepStrictEqual(names(back.chosen), ['A–B 3'], 'Kruskal 做完按 Prim，也從 A 重新開始');
  assert.deepStrictEqual(back.skipped, []);
});

test('分格靜態圖照操作重播：六格 Kruskal，圖說照決定表', () => {
  const frames = CR.replay('mst', page.frames);
  assert.deepStrictEqual(frames.map(f => f.label), [
    '選 D–E 1',
    '選 B–C 2',
    '選 A–B 3',
    '選 C–D 4',
    '跳過 B–D 5：會成環',
    '選 D–F 6：五條邊，完成',
  ]);
  assert.ok(frames.every(f => !f.state.error));
});
