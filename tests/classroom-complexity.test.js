// tests/classroom-complexity.test.js（node --test）：小教室附錄 Big-O 的沙盒、分格圖與總表
const test = require('node:test'); const assert = require('node:assert');
const CR = require('../classroom.js');
const page = CR.PAGES.complexity;

test('Big-O 沙盒：n 加倍時 n² 變四倍、log n 多一；n 在 2～1024 之間，超出是錯誤、n 不變', () => {
  const box = page.sandbox;
  let s = box.init();
  assert.strictEqual(s.n, 8);
  s = box.apply(s, 'double');
  assert.deepStrictEqual([s.n, s.prev], [16, 8]);
  const [one, log, lin, nlog, sq] = box.steps(16).map(r => r.steps);
  assert.deepStrictEqual([one, log, lin, nlog, sq], [1, 4, 16, 64, 256]);
  assert.strictEqual(sq / box.steps(8)[4].steps, 4);
  for (let i = 0; i < 10; i++) s = box.apply(s, 'double');
  assert.strictEqual(s.n, 1024); assert.strictEqual(s.error, 'max');
  let t = box.init();
  for (let i = 0; i < 5; i++) t = box.apply(t, 'half');
  assert.strictEqual(t.n, 2); assert.strictEqual(t.error, 'min');
});

test('Big-O 分格圖：從 8 開始連續加倍四次', () => {
  const frames = CR.replay('complexity', page.frames);
  assert.deepStrictEqual(frames.map(f => f.label), ['n 加倍 → 16', 'n 加倍 → 32', 'n 加倍 → 64', 'n 加倍 → 128']);
});

test('Big-O 總表：照目錄順序收每一頁的時間複雜度，Big-O 自己不在裡面', () => {
  const table = CR.complexityTable();
  const ids = table.map(g => g.id);
  assert.ok(!ids.includes('complexity'));
  for (const id of ['array', 'linked_list', 'stack', 'queue', 'graph', 'null']) assert.ok(ids.includes(id), `總表少了 ${id}`);
  const order = CR.TOC.flatMap(g => g.items).map(i => i.id).filter(id => ids.includes(id));
  assert.deepStrictEqual(ids, order);
  assert.deepStrictEqual(table.find(g => g.id === 'stack').rows, CR.PAGES.stack.complexity);
});
