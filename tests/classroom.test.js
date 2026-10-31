// tests/classroom.test.js（node --test）：資料結構小教室的目錄與每頁共通的格式；各頁自己的規則在 classroom-<id>.test.js
const test = require('node:test'); const assert = require('node:assert');
const CR = require('../classroom.js');
const V = require('../verdict.js');

test('目錄：登記的頁都在目錄裡；結算卡每個印章都對得到目錄裡寫好的一頁', () => {
  for (const id of Object.keys(CR.PAGES)) assert.ok(CR.item(id), `classroom/${id}.js 不在目錄裡`);
  for (const [kind, { name }] of Object.entries(V.NAMES)) {
    assert.strictEqual(CR.pageForStamp(name, V.NAMES), CR.STAMP_PAGE[kind]);
    assert.ok(CR.PAGES[CR.STAMP_PAGE[kind]], `印章 ${name} 對到的頁還沒寫`);
  }
  assert.strictEqual(CR.pageForStamp('不存在的印章', V.NAMES), null);
});

// 一般的講義頁十段；觀念頁（附錄 Big-O）沒有實作和自己的複雜度表，換成「怎麼算」
const LESSON = ['analogy', 'frames', 'uses', 'concept', 'traps', 'code', 'complexity', 'summary', 'sandbox'];
const REFERENCE = ['analogy', 'frames', 'uses', 'concept', 'howto', 'traps', 'summary', 'sandbox'];

test('每頁的段落都在；有實作的頁四種語言各有內建和自己刻兩份；每頁都有沙盒、會畫圖', () => {
  for (const [id, p] of Object.entries(CR.PAGES)) {
    for (const k of p.layout === 'reference' ? REFERENCE : LESSON) assert.ok(p[k], `${id} 少了 ${k}`);
    assert.strictEqual(typeof p.draw, 'function', `${id} 少了 draw`);
    if (!p.code) continue;
    for (const [lang] of CR.LANGS) assert.ok(p.code[lang].builtin && p.code[lang].handmade, `${id} ${lang}`);
    assert.ok(p.code.output);
  }
});
