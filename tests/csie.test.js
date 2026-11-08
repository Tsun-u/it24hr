// tests/csie.test.js（node --test）：CSIE 課程頁的課程目錄與網址
const test = require('node:test'); const assert = require('node:assert');
const C = require('../csie.js');

test('CSIE 課程：七門課，APCS 程式設計排第一；目前可以讀的是 APCS 程式設計和資料結構', () => {
  assert.strictEqual(C.COURSES.length, 7);
  assert.strictEqual(C.COURSES[0].id, 'programming');
  assert.deepStrictEqual(C.COURSES.filter(c => c.ready).map(c => c.id), ['programming', 'ds']);
});

test('網址：#課程/頁 拆成課程和頁；沒有 # 是課程目錄', () => {
  assert.deepStrictEqual(C.parseHash('#ds/stack'), { course: 'ds', page: 'stack' });
  assert.deepStrictEqual(C.parseHash('#ds'), { course: 'ds', page: '' });
  assert.deepStrictEqual(C.parseHash(''), { course: '', page: '' });
  assert.strictEqual(C.course('nope'), null);
});
