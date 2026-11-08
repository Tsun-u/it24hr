// tests/classroom-sorting.test.js（node --test）：小教室 Sorting 頁的沙盒與分格圖
const test = require('node:test'); const assert = require('node:assert');
const CR = require('../classroom.js');
const page = CR.PAGES.ds.sorting;

const ALGOS = ['bubble', 'selection', 'insertion', 'merge', 'quick'];
// 手算的教科書答案：[5, 2, 4, 6, 1, 3] 每一輪之後的陣列、這一輪比了幾次
const ROUNDS = {
  bubble: {
    arrays: [[2, 4, 5, 1, 3, 6], [2, 4, 1, 3, 5, 6], [2, 1, 3, 4, 5, 6], [1, 2, 3, 4, 5, 6], [1, 2, 3, 4, 5, 6]],
    compares: [5, 4, 3, 2, 1],
  },
  selection: {
    arrays: [[1, 2, 4, 6, 5, 3], [1, 2, 4, 6, 5, 3], [1, 2, 3, 6, 5, 4], [1, 2, 3, 4, 5, 6], [1, 2, 3, 4, 5, 6]],
    compares: [5, 4, 3, 2, 1],
  },
  insertion: {
    arrays: [[2, 5, 4, 6, 1, 3], [2, 4, 5, 6, 1, 3], [2, 4, 5, 6, 1, 3], [1, 2, 4, 5, 6, 3], [1, 2, 3, 4, 5, 6]],
    compares: [1, 2, 1, 4, 4],
  },
  merge: {   // 一輪是同一個寬度的相鄰兩段全部合併：寬度 1、2、4
    arrays: [[2, 5, 4, 6, 1, 3], [2, 4, 5, 6, 1, 3], [1, 2, 3, 4, 5, 6]],
    compares: [3, 3, 3],
  },
  quick: {   // 一輪是切一段：拿這段最後一個當 pivot（Lomuto），左邊那段先切
    arrays: [[2, 1, 3, 6, 5, 4], [1, 2, 3, 6, 5, 4], [1, 2, 3, 4, 5, 6], [1, 2, 3, 4, 5, 6]],
    compares: [5, 1, 2, 1],
  },
};

// 從頭按同一顆鈕直到排好，記下每一輪之後的狀態
function runToEnd(op) {
  const box = page.sandbox; let s = box.init(); const states = [];
  while (!s.done) { s = box.apply(s, op); states.push(s); }
  return states;
}

test('排序的沙盒：五種每一輪都跟手算的一樣；換另一種從原陣列重來；排好再按是錯誤、狀態不變', () => {
  const box = page.sandbox;
  assert.deepStrictEqual(box.ops.map(o => o.op), ALGOS);
  for (const algo of ALGOS) {
    const states = runToEnd(algo);
    assert.deepStrictEqual(states.map(s => s.items), ROUNDS[algo].arrays, `${algo} 每一輪之後的陣列`);
    assert.deepStrictEqual(states.map(s => s.compares), ROUNDS[algo].compares, `${algo} 每一輪比幾次`);
    const last = states.at(-1);
    assert.strictEqual(last.total, ROUNDS[algo].compares.reduce((a, b) => a + b), `${algo} 一共比幾次`);
    assert.deepStrictEqual(last.sorted, [0, 1, 2, 3, 4, 5], `${algo} 排完全部標成排好`);
    assert.ok(states.every(s => !s.error), `${algo} 一路上沒有錯誤`);

    const again = box.apply(last, algo);
    assert.strictEqual(again.error, 'done', `${algo} 排好再按`);
    for (const k of ['algo', 'items', 'round', 'total', 'sorted']) assert.deepStrictEqual(again[k], last[k], `${algo} 排好再按，${k} 不變`);
  }
  assert.strictEqual(box.errors.done, '已經排好了，換一種排序從頭比比看。');

  // 合併看得出段、快速看得出 pivot
  assert.deepStrictEqual(runToEnd('merge').map(s => s.runs), [[[0, 1], [2, 3], [4, 5]], [[0, 3], [4, 5]], [[0, 5]]]);
  assert.deepStrictEqual(runToEnd('quick').map(s => [s.key, s.at, s.segment]), [[3, 2, [0, 5]], [1, 0, [0, 1]], [4, 3, [3, 5]], [6, 5, [4, 5]]]);

  // 換另一種：不管前一種做到哪，都從 [5, 2, 4, 6, 1, 3] 重新開始
  let s = box.init();
  for (let i = 0; i < 3; i++) s = box.apply(s, 'bubble');
  s = box.apply(s, 'selection');
  assert.strictEqual(s.algo, 'selection'); assert.strictEqual(s.round, 1); assert.strictEqual(s.total, 5);
  assert.deepStrictEqual(s.items, ROUNDS.selection.arrays[0], '氣泡做到一半按選擇，從原陣列走選擇的第 1 輪');
  const afterMerge = box.apply(runToEnd('merge').at(-1), 'quick');
  assert.deepStrictEqual(afterMerge.items, ROUNDS.quick.arrays[0], '合併排完按快速，從原陣列走快速的第 1 輪');
  assert.strictEqual(afterMerge.error, null);

  // 各種的圖說
  const labels = (op) => runToEnd(op).map(st => box.label(op, st));
  assert.deepStrictEqual(labels('bubble'), [
    '氣泡排序：6 推到 a[5]（比 5 次）', '氣泡排序：5 推到 a[4]（比 4 次）', '氣泡排序：4 推到 a[3]（比 3 次）',
    '氣泡排序：3 推到 a[2]（比 2 次）', '氣泡排序：一次都沒換，排好了（比 1 次）',
  ]);
  assert.deepStrictEqual(labels('selection'), [
    '選擇排序：選出 1，換到 a[0]（比 5 次）', '選擇排序：選出 2，本來就在 a[1]（比 4 次）', '選擇排序：選出 3，換到 a[2]（比 3 次）',
    '選擇排序：選出 4，換到 a[3]（比 2 次）', '選擇排序：選出 5，本來就在 a[4]（比 1 次）',
  ]);
  assert.deepStrictEqual(labels('merge'), [
    '合併排序：寬度 1 的相鄰兩段合併，變成 [2 5] [4 6] [1 3]（比 3 次）',
    '合併排序：寬度 2 的相鄰兩段合併，變成 [2 4 5 6] [1 3]（比 3 次）',
    '合併排序：寬度 4 的相鄰兩段合併，變成 [1 2 3 4 5 6]（比 3 次）',
  ]);
  assert.deepStrictEqual(labels('quick'), [
    '快速排序：pivot 3 放到 a[2]（比 5 次）', '快速排序：pivot 1 放到 a[0]（比 1 次）',
    '快速排序：pivot 4 放到 a[3]（比 2 次）', '快速排序：pivot 6 放到 a[5]（比 1 次）',
  ]);
});

test('分格靜態圖照操作重播：插入排序跑完五輪，每格寫出放好哪個數、比了幾次', () => {
  const frames = CR.replay('ds', 'sorting', page.frames);
  assert.deepStrictEqual(frames.map(f => f.label), [
    '插入排序：放好 2（比 1 次）',
    '插入排序：放好 4（比 2 次）',
    '插入排序：放好 6（比 1 次）',
    '插入排序：放好 1（比 4 次）',
    '插入排序：放好 3（比 4 次）',
  ]);
  assert.ok(frames.every(f => !f.state.error));
  assert.ok(frames.at(-1).state.done);
});
