// tests/classroom-hashing.test.js（node --test）：小教室 Hashing 頁的沙盒與分格圖
const test = require('node:test'); const assert = require('node:assert');
const CR = require('../classroom.js');
const page = CR.PAGES.hashing;

const press = (s, op, times) => { for (let i = 0; i < times; i++) s = page.sandbox.apply(s, op); return s; };

test('雜湊的沙盒：k % 7 放進那一格、碰撞接在串列後面；8 比 3 次找到、4 號格空的找不到、找完一輪從頭；插完再按是錯誤、狀態不變', () => {
  const box = page.sandbox;
  const labels = []; let s = box.init();
  for (let i = 0; i < 7; i++) { s = box.apply(s, 'insert'); labels.push(box.label('insert', s)); }
  assert.deepStrictEqual(s.table, [[], [15, 22, 8], [30], [10, 3, 17], [], [], []], '餘數決定格子，撞在同一格的照放進來的順序接在後面');
  assert.strictEqual(labels[4], 'insert(10)：10 % 7 = 3', '3 號格原本空的，不算碰撞');
  assert.strictEqual(labels[6], 'insert(17)：17 % 7 = 3，碰撞，接在後面');

  const notYet = box.apply(press(box.init(), 'insert', 2), 'find');
  assert.strictEqual(box.label('find', notYet), 'find(8)：1 號格，比了 2 次，找不到', '8 還沒放進去：比完 15、22 就到串列底');

  const found = box.apply(s, 'find');
  assert.deepStrictEqual([found.slot, found.compared, found.found], [1, 3, true]);
  const missing = box.apply(found, 'find');
  assert.deepStrictEqual([missing.slot, missing.compared, missing.found], [4, 0, false]);
  assert.strictEqual(box.label('find', missing), 'find(4)：4 號格是空的，找不到');
  assert.strictEqual(box.apply(missing, 'find').key, 8, '找完 8、4 一輪，再按從 8 開始');
  assert.deepStrictEqual(missing.table, s.table, '搜尋不改表');

  const again = box.apply(found, 'insert');
  assert.strictEqual(again.error, 'allInserted');
  for (const k of ['table', 'nextFind']) assert.deepStrictEqual(again[k], found[k], `插完再按，${k} 不變`);
  assert.ok(box.errors.allInserted.startsWith('七個數都插完了'));
});

test('分格靜態圖照操作重播：插入 15、22、30、8，再找 8', () => {
  const frames = CR.replay('hashing', page.frames);
  assert.deepStrictEqual(frames.map(f => f.label), [
    'insert(15)：15 % 7 = 1',
    'insert(22)：22 % 7 = 1，碰撞，接在後面',
    'insert(30)：30 % 7 = 2',
    'insert(8)：8 % 7 = 1，碰撞，接在後面',
    'find(8)：1 號格，比了 3 次找到',
  ]);
  assert.ok(frames.every(f => !f.state.error));
});
