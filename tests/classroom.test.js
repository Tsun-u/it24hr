// tests/classroom.test.js（node --test）：各門課小教室的目錄與每頁共通的格式；各頁自己的規則在 classroom-<id>.test.js
const test = require('node:test'); const assert = require('node:assert');
const fs = require('fs'); const path = require('path');
const CR = require('../classroom.js');
const V = require('../verdict.js');
const C = require('../csie.js');

// 所有登記好的頁，攤成 [課程, 頁 id, 頁]
const allPages = () => Object.entries(CR.PAGES).flatMap(([course, pages]) => Object.entries(pages).map(([id, p]) => [course, id, p]));

test('目錄：每個放頁的資料夾都是 CSIE 的一門課；登記的頁都在那門課的目錄裡', () => {
  const courses = C.COURSES.map(c => c.id);
  for (const dir of fs.readdirSync(path.join(__dirname, '..', 'classroom'))) assert.ok(courses.includes(dir), `classroom/${dir}/ 不是 CSIE 的課程`);
  for (const [course, id] of allPages()) assert.ok(CR.item(course, id), `classroom/${course}/${id}.js 不在目錄裡`);
});

test('結算卡每個印章都對得到資料結構目錄裡寫好的一頁', () => {
  for (const [kind, { name }] of Object.entries(V.NAMES)) {
    assert.strictEqual(CR.pageForStamp(name, V.NAMES), CR.STAMP_PAGE[kind]);
    assert.ok(CR.PAGES.ds[CR.STAMP_PAGE[kind]], `印章 ${name} 對到的頁還沒寫`);
  }
  assert.strictEqual(CR.pageForStamp('不存在的印章', V.NAMES), null);
});

test('用途、核心觀念、常見誤解、跑幾步裡連到別頁的 see，都是目錄裡有的頁（別門課寫「課程/頁 id」）', () => {
  for (const [course, id, p] of allPages()) for (const t of [...(p.review || []), ...(p.uses || []), ...(p.concept || []), ...(p.cost ? [p.cost.note] : []), ...(p.extra || []), ...p.traps]) {
    if (typeof t === 'string' || t.quote) continue;
    assert.ok(t.text || t.wrong, `${course}/${id} 有一段少了 text`);
    for (const to of [].concat(t.see || [])) {
      const [c, pid] = to.includes('/') ? to.split('/') : [course, to];
      assert.ok(CR.item(c, pid), `${course}/${id} 連到不存在的頁 ${to}`);
    }
  }
});

test('常見誤解：每條都分成誤解和正解，誤解不帶引號', () => {
  for (const [course, id, p] of allPages()) for (const t of p.traps) {
    assert.ok(t.wrong && t.right, `${course}/${id} 有一條少了誤解或正解`);
    assert.ok(!/^「.*」$/.test(t.wrong), `${course}/${id}：${t.wrong}`);
  }
});

// 一般的講義頁十段；觀念頁（附錄 Big-O）沒有實作和自己的複雜度表，換成「怎麼算」
const LESSON = ['analogy', 'frames', 'uses', 'concept', 'traps', 'code', 'complexity', 'summary', 'sandbox'];
const REFERENCE = ['analogy', 'frames', 'uses', 'concept', 'howto', 'traps', 'summary', 'sandbox'];
// 程式設計課：沙盒換成程式追蹤器（trace），多了試試看（tryit）；跑幾步（cost）只有可以估的頁才有
const PROGRAM = ['analogy', 'figure', 'uses', 'concept', 'trace', 'traps', 'code', 'tryit', 'summary'];
const programPages = () => allPages().filter(([, , p]) => p.layout === 'program');

test('每頁的段落都在；資料結構的頁四種語言各有內建和自己刻兩份、有沙盒會畫圖', () => {
  for (const [course, id, p] of allPages()) {
    const fields = { reference: REFERENCE, program: PROGRAM }[p.layout] || LESSON;
    for (const k of fields) assert.ok(p[k], `${course}/${id} 少了 ${k}`);
    if (p.layout === 'program') continue;
    assert.strictEqual(typeof p.draw, 'function', `${course}/${id} 少了 draw`);
    if (!p.code) continue;
    for (const [lang] of CR.LANGS[course]) assert.ok(p.code[lang].builtin && p.code[lang].handmade, `${course}/${id} ${lang}`);
    assert.ok(p.code.output);
  }
});

test('程式設計課：第一課以外每頁都有複習（用前面學過的東西硬做的那段）', () => {
  const first = CR.TOC.programming[0].items[0].id;
  for (const [course, id, p] of programPages()) {
    if (id === first) continue;
    assert.ok(Array.isArray(p.review) && p.review.length, `${course}/${id} 少了複習`);
  }
});

test('程式設計課：實作、追蹤器、試試看的程式四種語言都有；追蹤資料是 build-traces.js 產生的', () => {
  for (const [course, id, p] of programPages()) {
    const where = `${course}/${id}`;
    for (const [lang] of CR.LANGS[course]) {
      assert.strictEqual(typeof p.code[lang], 'string', `${where} 實作少了 ${lang}`);
      assert.strictEqual(typeof p.trace.code[lang], 'string', `${where} 追蹤器少了 ${lang}`);
      p.tryit.forEach((q, k) => assert.ok(q.code[lang] && q.program[lang], `${where} 試試看第 ${k + 1} 題少了 ${lang}`));
      (p.extra || []).forEach((t, k) => assert.ok(!t.code || typeof t.code[lang] === 'string', `${where} 課外補充第 ${k + 1} 段的範例少了 ${lang}`));
    }
    (p.extra || []).forEach((t, k) => assert.ok(!t.code || t.code.output, `${where} 課外補充第 ${k + 1} 段的範例少了 output`));
    assert.ok(p.code.output, `${where} 實作少了 output`);
    for (const { label } of p.trace.inputs) assert.ok(p.trace.runs[label]?.length, `${where} 追蹤器的 ${label} 還沒產生，跑 node scripts/build-traces.js ${where}`);
  }
});

test('程式設計課的圖解是一張概念示意圖：figure(kit) 畫成 SVG；一步一步搭配程式看的是追蹤器', () => {
  for (const [course, id, p] of programPages()) assert.strictEqual(typeof p.figure, 'function', `${course}/${id} 的圖解要寫成 figure(kit)`);
});

test('試試看：四個選項、答案在選項裡；題目上的程式片段每一行都在驗算用的完整程式裡', () => {
  for (const [course, id, p] of programPages()) p.tryit.forEach((q, k) => {
    const where = `${course}/${id} 試試看第 ${k + 1} 題`;
    assert.ok(q.kind && q.prompt && q.why, where);
    assert.strictEqual(q.options.length, 4, where);
    assert.ok(Number.isInteger(q.answer) && q.options[q.answer] !== undefined, where);
    for (const [lang] of CR.LANGS[course]) {
      const program = q.program[lang].split('\n').map(l => l.trim());
      for (const line of q.code[lang].split('\n').map(l => l.trim()).filter(Boolean)) assert.ok(program.includes(line), `${where}（${lang}）的「${line}」不在完整程式裡`);
    }
  });
});
