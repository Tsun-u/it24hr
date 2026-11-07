// tests/classroom-topological_sort.test.js（node --test）：小教室拓樸排序頁的沙盒、分格圖、常見誤解裡的數字
const test = require('node:test'); const assert = require('node:assert');
const CR = require('../classroom.js');
const page = CR.PAGES.topological_sort;

// 設計稿的七門課和八條先修 [先修, 後修]
const COURSES = ['CS101', 'CS102', 'CS103', 'CS201', 'CS202', 'CS301', 'CS302'];
const PREREQS = [
  ['CS101', 'CS102'], ['CS101', 'CS201'], ['CS102', 'CS202'], ['CS103', 'CS202'],
  ['CS103', 'CS302'], ['CS202', 'CS302'], ['CS202', 'CS301'], ['CS201', 'CS301'],
];
// 每條先修都排在後修前面
const respectsPrereqs = (order) => PREREQS.every(([u, v]) => order.indexOf(u) < order.indexOf(v));

test('拓樸排序沙盒：一開始佇列是 CS101、CS103；修完七門的順序每條先修都在前面、跟程式印的一樣', () => {
  const box = page.sandbox;
  let s = box.init();
  assert.deepStrictEqual(s.queue, ['CS101', 'CS103']);
  assert.deepStrictEqual(s.indegree, { CS101: 0, CS102: 1, CS103: 0, CS201: 1, CS202: 2, CS301: 2, CS302: 2 });
  for (let i = 0; i < 7; i++) s = box.apply(s, 'take');
  assert.deepStrictEqual(s.taken, ['CS101', 'CS103', 'CS102', 'CS201', 'CS202', 'CS302', 'CS301']);
  assert.ok(respectsPrereqs(s.taken));
  assert.strictEqual(s.taken.join(' '), page.code.output);
  assert.deepStrictEqual(s.queue, []);
  assert.ok(COURSES.every(c => s.indegree[c] === 0));
});

test('入度的變化：修 CS101 後程設、計組變 0 排進佇列；修 CS103 後資結、演算法只少 1、不排進佇列', () => {
  const box = page.sandbox;
  const s1 = box.apply(box.init(), 'take');
  assert.strictEqual(s1.current, 'CS101');
  assert.deepStrictEqual(s1.lowered, ['CS102', 'CS201']);
  assert.strictEqual(s1.indegree.CS102, 0); assert.strictEqual(s1.indegree.CS201, 0);
  assert.deepStrictEqual(s1.queue, ['CS103', 'CS102', 'CS201']);

  const s2 = box.apply(s1, 'take');
  assert.strictEqual(s2.current, 'CS103');
  assert.deepStrictEqual(s2.lowered, ['CS202', 'CS302']);
  assert.strictEqual(s2.indegree.CS202, 1); assert.strictEqual(s2.indegree.CS302, 1);
  assert.deepStrictEqual(s2.unlocked, []);
  assert.deepStrictEqual(s2.queue, ['CS102', 'CS201']);
});

test('七門修完再按是錯誤「七門課都修完了」，佇列、修過的課、入度都不變', () => {
  const box = page.sandbox;
  let s = box.init();
  for (let i = 0; i < 7; i++) s = box.apply(s, 'take');
  const again = box.apply(s, 'take');
  assert.strictEqual(again.error, 'done');
  assert.strictEqual(box.errors.done, '七門課都修完了');
  assert.strictEqual(again.current, null);
  for (const k of ['taken', 'queue', 'indegree']) assert.deepStrictEqual(again[k], s[k], `${k} 不變`);
});

test('分格靜態圖照操作重播：七格，每格寫出修哪門課、哪些課可以修了', () => {
  const frames = CR.replay('topological_sort', page.frames);
  assert.deepStrictEqual(frames.map(f => f.label), [
    '修 CS101 計算機概論：程式設計、計算機組織可以修了',
    '修 CS103 離散數學',
    '修 CS102 程式設計：資料結構可以修了',
    '修 CS201 計算機組織',
    '修 CS202 資料結構：演算法、作業系統可以修了',
    '修 CS302 演算法',
    '修 CS301 作業系統',
  ]);
  assert.ok(frames.every(f => !f.state.error));
});

test('常見誤解裡的數字：七門課一共有 25 種排法；從 CS101 照箭頭 DFS 的拜訪順序違反先修，走完的順序倒過來才對', () => {
  let count = 0;
  (function place(order) {
    if (order.length === COURSES.length) { assert.ok(respectsPrereqs(order)); count++; return; }
    for (const c of COURSES) if (!order.includes(c) && PREREQS.every(([u, v]) => v !== c || order.includes(u))) place([...order, c]);
  })([]);
  assert.strictEqual(count, 25);

  const next = (c) => PREREQS.filter(([u]) => u === c).map(([, v]) => v);
  const visited = [], finished = [];
  const dfs = (c) => { visited.push(c); for (const d of next(c)) if (!visited.includes(d)) dfs(d); finished.push(c); };
  dfs('CS101');
  assert.deepStrictEqual(visited, ['CS101', 'CS102', 'CS202', 'CS302', 'CS301', 'CS201']);
  assert.ok(visited.indexOf('CS201') > visited.indexOf('CS301'), '計算機組織排到了作業系統後面');
  for (const c of COURSES) if (!visited.includes(c)) dfs(c);
  assert.ok(respectsPrereqs([...finished].reverse()));
});
