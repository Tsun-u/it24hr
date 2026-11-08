// tests/classroom-selection.test.js（node --test）：APCS 程式設計「條件判斷」這一頁的追蹤資料、追蹤器的說明、實作、試試看對得起來
const test = require('node:test'); const assert = require('node:assert');
const CR = require('../classroom.js');
const page = CR.PAGES.programming.selection;
const { runs } = page.trace;
const last = (run) => run[run.length - 1];
const conds = (run) => run.filter(s => 'cond' in s).map(s => s.cond);

test('追蹤器：80 印 umbrella、60 印 maybe 再印 check、30 印 no', () => {
  assert.strictEqual(last(runs['p = 80']).out, 'umbrella\n');
  assert.strictEqual(last(runs['p = 60']).out, 'maybe\ncheck\n');
  assert.strictEqual(last(runs['p = 30']).out, 'no\n');
});

test('追蹤器：else if 中了一個就不再比，每組輸入檢查了哪幾個條件', () => {
  assert.deepStrictEqual(conds(runs['p = 80']), [true, false], '80：第一個就中，跳過 elif，最後的多條件不成立');
  assert.deepStrictEqual(conds(runs['p = 60']), [false, true, true], '60：第一個不成立才比第二個，多條件成立');
  assert.deepStrictEqual(conds(runs['p = 30']), [false, false, false], '30：兩個都不成立走 else');
  assert.ok(!runs['p = 30'].some(s => s.line === 6), 'Python 的 else: 那行不會停');
});

test('追蹤器的說明：條件代入值、else if 對到 C 的那一行、多條件照語言寫 and 或 &&', () => {
  assert.strictEqual(CR.stepNote(page.trace, 'p = 60', 1, 'python'), 'rain >= 70（60 >= 70）不成立');
  assert.strictEqual(CR.stepNote(page.trace, 'p = 60', 2, 'python'), 'rain > 50（60 > 50）成立');
  assert.strictEqual(CR.stepNote(page.trace, 'p = 60', 2, 'c'), 'rain > 50（60 > 50）成立', 'C 的 } else if (rain > 50) { 取出條件一樣');
  assert.strictEqual(CR.stepNote(page.trace, 'p = 60', 3, 'python'), '印出 maybe');
  assert.strictEqual(CR.stepNote(page.trace, 'p = 60', 4, 'python'), 'rain > 50 and rain < 70（60 > 50 and 60 < 70）成立');
  assert.strictEqual(CR.stepNote(page.trace, 'p = 60', 4, 'java'), 'rain > 50 && rain < 70（60 > 50 && 60 < 70）成立');
  assert.strictEqual(CR.stepNote(page.trace, 'p = 80', 3, 'c'), 'rain > 50 && rain < 70（80 > 50 && 80 < 70）不成立');
});

test('實作：85 分是 B，及格而且沒遲到是 1', () => {
  assert.strictEqual(page.code.output, 'B 1');
});

test('試試看：追蹤題的答案就是程式印的；填空題的正解填進驗算程式、印出 yes；除錯題的程式印出題目說的 fail', () => {
  const [tracing, blank, debug] = page.tryit;
  assert.strictEqual(tracing.kind, '程式運行追蹤');
  assert.strictEqual(tracing.options[tracing.answer], tracing.output);
  assert.strictEqual(blank.kind, '程式填空');
  assert.strictEqual(blank.output, 'yes');
  const answer = blank.options[blank.answer];
  for (const [lang] of CR.LANGS.programming) {
    const filled = lang === 'python' ? answer.replace('&&', 'and') : answer;
    assert.ok(blank.program[lang].includes(`____ = ${filled}`), `${lang} 的驗算程式要填進正解`);
  }
  assert.strictEqual(debug.kind, '程式測試與除錯');
  assert.strictEqual(debug.output, 'fail');
});
