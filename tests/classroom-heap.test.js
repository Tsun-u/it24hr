// tests/classroom-heap.test.js（node --test）：小教室 Heap 頁的沙盒與分格圖
const test = require('node:test'); const assert = require('node:assert');
const CR = require('../classroom.js');
const page = CR.PAGES.ds.heap;

// 每個節點都不比孩子小
const isMaxHeap = (h) => h.every((v, i) => i === 0 || h[Math.floor((i - 1) / 2)] >= v);

test('最大堆積沙盒：每放一個都還是最大堆積、圖說寫出往上換了誰；七個放完再放是錯誤且狀態不變', () => {
  const box = page.sandbox;
  let s = box.init();
  const labels = [];
  for (let i = 0; i < 7; i++) { s = box.apply(s, 'insert'); assert.ok(isMaxHeap(s.heap), `第 ${i + 1} 個放完還是最大堆積`); labels.push(box.label('insert', s)); }
  assert.deepStrictEqual(s.heap, [70, 50, 60, 30, 10, 20, 40]);
  assert.deepStrictEqual(labels, ['insert(30)', 'insert(50)：跟 30 換', 'insert(20)', 'insert(70)：跟 30 換、再跟 50 換', 'insert(10)', 'insert(60)：跟 20 換', 'insert(40)']);

  const more = box.apply(s, 'insert');
  assert.strictEqual(more.error, 'allPlaced'); assert.match(box.errors.allPlaced, /堆積排序/);
  assert.strictEqual(more.heap, s.heap); assert.strictEqual(more.placed, 7);
});

test('一直拿最大就是堆積排序：拿出來由大到小、每拿一次都還是最大堆積；空的再拿是 underflow', () => {
  const box = page.sandbox;
  let s = box.init();
  for (let i = 0; i < 7; i++) s = box.apply(s, 'insert');
  s = box.apply(s, 'extractMax');
  assert.strictEqual(box.label('extractMax', s), 'extractMax() → 70：40 補到頂，跟 60 換');
  for (let i = 0; i < 6; i++) { s = box.apply(s, 'extractMax'); assert.ok(isMaxHeap(s.heap)); }
  assert.deepStrictEqual(s.out, [70, 60, 50, 40, 30, 20, 10]);
  assert.strictEqual(box.label('extractMax', s), 'extractMax() → 10');

  const empty = box.apply(s, 'extractMax');
  assert.strictEqual(empty.error, 'underflow'); assert.deepStrictEqual(empty.heap, []);
});

test('分格靜態圖照操作重播：放 30、50、20、70（寫出往上換了誰），再拿一次最大', () => {
  const frames = CR.replay('ds', 'heap', page.frames);
  assert.deepStrictEqual(frames.map(f => f.label), [
    'insert(30)',
    'insert(50)：跟 30 換',
    'insert(20)',
    'insert(70)：跟 30 換、再跟 50 換',
    'extractMax() → 70：30 補到頂，跟 50 換',
  ]);
  assert.ok(frames.every(f => !f.state.error));
});

test('常見誤解舉的 [70, 50, 20, 30, 10] 真的是最大堆積、也真的沒排好', () => {
  const h = [70, 50, 20, 30, 10];
  assert.ok(isMaxHeap(h));
  assert.notDeepStrictEqual(h, [...h].sort((a, b) => b - a));
});
