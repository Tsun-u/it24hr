// tests/classroom-variables.test.js（node --test）：APCS 程式設計「變數與資料型態」這一頁的追蹤資料、追蹤器的說明、實作、試試看對得起來
const test = require('node:test'); const assert = require('node:assert');
const CR = require('../classroom.js');
const page = CR.PAGES.programming.variables;
const { runs } = page.trace;
const last = (run) => run[run.length - 1];

test('第一課沒有複習；開場和總結照設計稿', () => {
  assert.strictEqual(page.review, undefined);
  assert.match(page.analogy, /兩支隊伍最新的得分/);
  assert.match(page.summary, /home = home \+ 2/);
});

test('追蹤器：計分板一路直線跑完，主隊第一球 2 分印 5 3、3 分印 6 3，沒有條件判斷', () => {
  assert.strictEqual(last(runs['points = 2']).out, '5 3\n');
  assert.strictEqual(last(runs['points = 3']).out, '6 3\n');
  for (const label of ['points = 2', 'points = 3']) {
    assert.strictEqual(runs[label].length, 7, `${label} 七行各跑一次`);
    assert.ok(!runs[label].some(s => 'cond' in s), `${label} 沒有條件那行`);
  }
});

test('追蹤器的說明：開格子、翻牌子（舊值 → 新值）、印出', () => {
  const notes = [0, 2, 3, 4, 5, 6].map(i => CR.stepNote(page.trace, 'points = 2', i, 'python'));
  assert.deepStrictEqual(notes, ['home = 0', 'points = 2', 'home：0 → 2', 'away：0 → 3', 'home：2 → 5', '印出 5 3']);
  assert.strictEqual(CR.stepNote(page.trace, 'points = 3', 3, 'c'), 'home：0 → 3', '換語言不換說明');
});

test('實作：整數除法 3、餘數 1、浮點數 3.5、字元 A 的數字 65', () => {
  assert.strictEqual(page.code.output, '3 1 3.5 65');
});

test('試試看：追蹤題的答案就是程式印的；計算邏輯題印商和餘數 3 2；除錯題的程式印出題目說的 8 8', () => {
  const byKind = Object.fromEntries(page.tryit.map(q => [q.kind, q]));
  const trace = byKind['程式運行追蹤'];
  assert.strictEqual(trace.options[trace.answer], trace.output);
  const logic = byKind['解析計算邏輯'];
  assert.strictEqual(logic.output, '3 2');
  assert.match(logic.options[logic.answer], /商和餘數/);
  assert.strictEqual(byKind['程式測試與除錯'].output, '8 8');
});
