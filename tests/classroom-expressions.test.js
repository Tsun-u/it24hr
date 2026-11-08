// tests/classroom-expressions.test.js（node --test）：APCS 程式設計「運算式」這一頁的追蹤資料、追蹤器的說明、實作、試試看對得起來
const test = require('node:test'); const assert = require('node:assert');
const CR = require('../classroom.js');
const page = CR.PAGES.programming.expressions;
const { runs } = page.trace;
const last = (run) => run[run.length - 1];

test('追蹤器：cups = 2 印出 2 × 50 + 30 = 130，cups = 3 印出 180；沒有條件判斷的步驟', () => {
  assert.strictEqual(last(runs['cups = 2']).out, '130\n');
  assert.strictEqual(last(runs['cups = 3']).out, '180\n');
  for (const run of Object.values(runs)) assert.ok(!run.some(s => 'cond' in s));
});

test('追蹤器的說明：三個變數先放好，算出 total，最後印出來', () => {
  const notes = [0, 1, 2, 3, 4].map(i => CR.stepNote(page.trace, 'cups = 2', i, 'python'));
  assert.deepStrictEqual(notes, ['milk = 50', 'tea = 30', 'cups = 2', 'total = 130', '印出 130']);
});

test('追蹤器的行號對照：Python 算 total 的那行，在 C、C++、Java 都對到算 total 的那行', () => {
  for (const lang of ['c', 'cpp', 'java']) {
    const src = CR.fill(page.trace.code[lang], { c: 2 }).split('\n');
    assert.match(src[CR.traceLine(page.trace, lang, 4) - 1], /total = cups \* milk \+ tea/, lang);
    assert.match(src[CR.traceLine(page.trace, lang, 5) - 1], /total/, `${lang} 的印出那行`);
  }
});

test('複習：講出運算式核心想法的那句獨立成 quote', () => {
  assert.ok(page.review.some(t => t.quote && t.quote.includes('運算式')));
});

test('實作：1 + 2 * 3、(1 + 2) * 3、7 % 3、5 > 3、6 & 3、6 | 3、6 ^ 3、1 << 3', () => {
  assert.strictEqual(page.code.output, '7 9 1 1 2 7 5 8');
});

test('試試看：追蹤題的答案就是程式印出來的；解析題的程式用偶數印 yes；除錯題的程式印出題目說的 125', () => {
  for (const q of page.tryit) {
    if (q.kind === '程式運行追蹤') assert.strictEqual(q.options[q.answer], q.output, q.prompt);
    else if (q.kind === '解析計算邏輯') { assert.strictEqual(q.output, 'yes'); assert.match(q.options[q.answer], /偶數/); }
    else if (q.kind === '程式測試與除錯') { assert.strictEqual(q.output, '125'); assert.match(q.options[q.answer], /\(a \+ b\) \/ 2/); }
    else assert.fail(`沒想到的題型 ${q.kind}`);
  }
});
