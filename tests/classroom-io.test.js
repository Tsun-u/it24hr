// tests/classroom-io.test.js（node --test）：APCS 程式設計「輸入與輸出」這一頁的追蹤資料、追蹤器的說明、實作、試試看對得起來
const test = require('node:test'); const assert = require('node:assert');
const CR = require('../classroom.js');
const page = CR.PAGES.programming.io;
const { runs } = page.trace;
const last = (run) => run[run.length - 1];

test('追蹤器：鮮奶 2、麵包 1 印出 2 × 45 + 30 = 120，鮮奶 0、麵包 3 印出 90；整行輸入在第一步就讀完', () => {
  assert.strictEqual(last(runs['鮮奶 2、麵包 1']).out, '120\n');
  assert.strictEqual(last(runs['鮮奶 0、麵包 3']).out, '90\n');
  for (const { label, stdin, values } of page.trace.inputs) {
    assert.strictEqual(values, undefined, `${label} 讀的是 stdin，沒有 values`);
    assert.ok(runs[label].every(s => s.read === stdin.length), label);
    assert.ok(!runs[label].some(s => 'cond' in s), `${label} 沒有條件判斷的步驟`);
  }
});

test('追蹤器的說明：讀進一行兩個數、算出 total、印出來', () => {
  const notes = [0, 1, 2].map(i => CR.stepNote(page.trace, '鮮奶 2、麵包 1', i, 'python'));
  assert.deepStrictEqual(notes, ['讀進 2 1；milk = 2；bread = 1', 'total = 120', '印出 120']);
});

test('追蹤器的行號對照：Python 讀輸入、算 total、印出的那三行，在 C、C++、Java 都對到做同一件事的那行', () => {
  for (const lang of ['c', 'cpp', 'java']) {
    const src = page.trace.code[lang].split('\n');
    const at = (py) => src[CR.traceLine(page.trace, lang, py) - 1];
    assert.match(at(1), /scanf|std::cin|nextInt/, `${lang} 的讀輸入那行`);
    assert.match(at(2), /total = milk \* 45 \+ bread \* 30/, lang);
    assert.match(at(3), /printf|std::cout|println/, `${lang} 的印出那行`);
  }
});

test('這頁排在條件判斷前面：追蹤器、實作、試試看的程式都沒有 if 和迴圈', () => {
  const sources = [page.trace.code, page.code, ...page.tryit.map(q => q.program)]
    .flatMap(code => CR.LANGS.programming.map(([lang]) => code[lang]));
  for (const src of sources) assert.doesNotMatch(src, /\b(if|else|while|for|switch)\b/);
});

test('複習：講出輸入與輸出核心想法的那句獨立成 quote', () => {
  assert.ok(page.review.some(t => t.quote && t.quote.includes('輸入與輸出')));
});

test('實作：讀兩行 3 4、5，印出和 12、乘積 60、平均 4.00', () => {
  assert.strictEqual(page.code.stdin, '3 4\n5\n');
  assert.strictEqual(page.code.output, '12 60 4.00');
});

test('試試看：每題都讀輸入；追蹤題的答案就是程式印出來的；填空題照順序讀進 a、b；除錯題的程式印出題目說的 -35', () => {
  for (const q of page.tryit) {
    assert.ok(q.stdin, `${q.kind} 要寫餵給程式的輸入`);
    if (q.kind === '程式運行追蹤') assert.strictEqual(q.options[q.answer], q.output, q.prompt);
    else if (q.kind === '程式填空') { assert.strictEqual(q.output, '17'); assert.match(q.options[q.answer], /第一個放進 a/); }
    else if (q.kind === '程式測試與除錯') { assert.strictEqual(q.output, '-35'); assert.match(q.options[q.answer], /先 paid/); }
    else assert.fail(`沒想到的題型 ${q.kind}`);
  }
  assert.notDeepStrictEqual(page.tryit.map(q => q.answer), [0, 0, 0], '答案位置不要都在 (A)');
});
