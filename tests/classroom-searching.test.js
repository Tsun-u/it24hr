// tests/classroom-searching.test.js（node --test）：小教室 Searching 頁的沙盒與分格圖
const test = require('node:test'); const assert = require('node:assert');
const CR = require('../classroom.js');
const page = CR.PAGES.searching;

const press = (s, op, times) => { for (let i = 0; i < times; i++) s = page.sandbox.apply(s, op); return s; };

test('搜尋的沙盒：找 96 線性比 15 次、二分比 4 次；換另一種從頭開始；找到後再按是錯誤、狀態不變', () => {
  const box = page.sandbox;
  let s = box.init(); const linearLabels = [];
  for (let i = 0; i < 15; i++) { s = box.apply(s, 'linear'); linearLabels.push(box.label('linear', s)); }
  const linear = s;
  assert.strictEqual(linearLabels[0], '線性：看 a[0] = 2，不是');
  assert.strictEqual(linearLabels[14], '線性：看 a[14] = 96，找到了（比 15 次）');
  assert.ok(linearLabels.slice(0, 14).every(t => t.endsWith('，不是')), '前 14 次都不是');
  assert.deepStrictEqual([linear.probe, linear.count, linear.lo], [14, 15, 14], '線性每比一次排除一格');

  const binary = press(box.init(), 'binary', 4);
  assert.deepStrictEqual([binary.probe, binary.count, binary.lo, binary.hi], [14, 4, 14, 15]);

  const switched = box.apply(press(box.init(), 'linear', 3), 'binary');
  assert.deepStrictEqual([switched.mode, switched.probe, switched.count, switched.lo, switched.hi], ['binary', 7, 1, 0, 15], '線性比到一半按二分，從頭開始');
  const back = box.apply(binary, 'linear');
  assert.deepStrictEqual([back.mode, back.probe, back.count], ['linear', 0, 1], '二分找到後按線性，也從頭開始');

  for (const [op, done] of [['linear', linear], ['binary', binary]]) {
    const again = box.apply(done, op);
    assert.strictEqual(again.error, 'done', `${op} 找到後再按`);
    assert.deepStrictEqual({ ...again, error: null }, done, `${op} 找到後再按，狀態不變`);
    assert.strictEqual(box.apply(again, op).error, 'done', `${op} 一直按都是錯誤`);
  }
  assert.strictEqual(box.errors.done, '找到了，96 在 a[14]。按另一種搜尋，比比看要比幾次');
});

test('分格靜態圖照操作重播：四格二分，每格寫出看了哪格、往哪邊', () => {
  const frames = CR.replay('searching', page.frames);
  assert.deepStrictEqual(frames.map(f => f.label), [
    '二分：看 a[7] = 45，96 比較大，往右',
    '二分：看 a[11] = 81，96 比較大，往右',
    '二分：看 a[13] = 91，96 比較大，往右',
    '二分：看 a[14] = 96，找到了（比 4 次）',
  ]);
  assert.deepStrictEqual(frames.map(f => [f.state.lo, f.state.probe, f.state.hi]), [[0, 7, 15], [8, 11, 15], [12, 13, 15], [14, 14, 15]], 'mid 落在比它那時的 lo～hi 裡面');
  assert.ok(frames.every(f => !f.state.error));
});
