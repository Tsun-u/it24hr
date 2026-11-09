// tests/classroom-static.test.js（node --test）：CSIE 課程的靜態頁——每頁寫好的講義都有網址、站內連結都連得到、舊網址轉得對
const test = require('node:test'); const assert = require('node:assert');
const path = require('path');
const { staticPages } = require('../classroom-static.js');
const Classroom = require('../classroom.js');
const Csie = require('../csie.js');

const pages = staticPages();
const paths = new Set(pages.map(p => p.path));

test('開了的課，每一頁寫好的講義都有自己的靜態頁；沒開的課沒有', () => {
  for (const c of Csie.COURSES) {
    for (const id of Object.keys(Classroom.PAGES[c.id] || {})) {
      assert.strictEqual(paths.has(`csie/${c.id}/${id}.html`), Boolean(c.ready), `${c.id}/${id}`);
    }
    assert.strictEqual(paths.has(`csie/${c.id}/index.html`), Boolean(c.ready), `${c.id} 的目錄`);
  }
  assert.ok(paths.has('csie/index.html'));
});

test('頁內每個連結都指到有產生的頁（準備中的頁不會被連到）', () => {
  for (const p of pages) {
    for (const [, href] of p.html.matchAll(/href="([^"]+)"/g)) {
      const target = path.posix.normalize(path.posix.join(path.posix.dirname(p.path), href));
      assert.ok(paths.has(target), `${p.path} 連到 ${href}，沒有這頁`);
    }
  }
});

test('講義頁的內文是預先寫好的：有標題、比喻和總結，沒有漏掉的值', () => {
  for (const p of pages) {
    // 講義本身會講到 JavaScript 的 undefined，所以只抓整格都是 undefined 的
    assert.ok(!/>undefined<|\[object Object\]/.test(p.html), `${p.path} 有沒填到的值`);
    const m = p.path.match(/^csie\/(\w+)\/(\w+)\.html$/);
    if (!m || m[2] === 'index') continue;
    const page = Classroom.PAGES[m[1]][m[2]];
    for (const s of [page.analogy, page.summary]) assert.ok(p.html.includes(s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')), `${p.path}`);
    assert.ok(p.scripts.includes(`classroom/${m[1]}/${m[2]}.js`), `${p.path} 要載自己那頁的 JS`);
  }
});

test('舊網址 csie.html#課/頁 轉到新網址；講義頁的路徑認得出是哪一頁', () => {
  assert.strictEqual(Csie.legacyTarget('#ds/stack'), 'csie/ds/stack.html');
  assert.strictEqual(Csie.legacyTarget('#ds'), 'csie/ds/index.html');
  assert.strictEqual(Csie.legacyTarget(''), 'csie/index.html');
  assert.strictEqual(Csie.legacyTarget('#os'), 'csie/index.html');
  assert.deepStrictEqual(Csie.parsePath('/it24hr/csie/ds/stack.html'), { course: 'ds', page: 'stack' });
  assert.deepStrictEqual(Csie.parsePath('/D:/it24hr/csie/algorithms/dp.html'), { course: 'algorithms', page: 'dp' });
  assert.strictEqual(Csie.parsePath('/it24hr/csie/ds/index.html'), null);
  assert.strictEqual(Csie.parsePath('/it24hr/csie.html'), null);
});
