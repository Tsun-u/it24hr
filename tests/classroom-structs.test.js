// tests/classroom-structs.test.js（node --test）：APCS 程式設計「自訂資料型態」這一頁的追蹤資料、追蹤器的說明、試試看對得起來
const test = require('node:test'); const assert = require('node:assert');
const CR = require('../classroom.js');
const page = CR.PAGES.programming.structs;
const { runs } = page.trace;
const last = (run) => run[run.length - 1];
const student = (name, score) => ({ __type: 'Student', name, score });

test('追蹤器：Amy 72 分比 Ben 低，換位後印 Ben 95；Amy 98 分不用換，印 Amy 98', () => {
  assert.strictEqual(last(runs['Amy 72 分']).out, 'Ben 95\n');
  assert.strictEqual(last(runs['Amy 98 分']).out, 'Amy 98\n');
  assert.deepStrictEqual(runs['Amy 72 分'].filter(s => 'cond' in s).map(s => s.cond), [true]);
  assert.deepStrictEqual(runs['Amy 98 分'].filter(s => 'cond' in s).map(s => s.cond), [false]);
});

test('追蹤器：@dataclass 的定義併成 class 那行一步；變數都是 Student 卡片，換位時整張卡片一起搬，名字和成績不分家', () => {
  const run = runs['Amy 72 分'];
  assert.deepStrictEqual(run.map(s => s.line), [1, 4, 8, 9, 10, 11, 12, 13, 14]);
  assert.strictEqual(run[1].def, 'Student');
  assert.deepStrictEqual(run[2].vars.a, student('Amy', 72));
  assert.deepStrictEqual(last(run).vars, { a: student('Ben', 95), b: student('Amy', 72), t: student('Amy', 72) });
  for (const r of Object.values(runs)) for (const s of r) for (const v of Object.values(s.vars)) {
    assert.strictEqual(v.__type, 'Student');
    assert.ok(['Amy', 'Ben'].includes(v.name));
    assert.strictEqual(v.score, v.name === 'Ben' ? 95 : r === runs['Amy 72 分'] ? 72 : 98, `${v.name} 的成績跟著名字走`);
  }
});

test('追蹤器：Python 執行到的每一行都對得到 C、C++、Java 的一行，class Student: 對到 struct／class 定義那行', () => {
  const executed = [...new Set(Object.values(runs).flat().map(s => s.line))];
  for (const lang of ['c', 'cpp', 'java']) {
    const src = page.trace.code[lang].split('\n');
    for (const line of executed) assert.ok(page.trace.lines[lang][line], `${lang} 少了 Python 第 ${line} 行`);
    assert.match(src[page.trace.lines[lang][4] - 1], /^(struct|class) Student \{$/, lang);
    assert.match(src[page.trace.lines[lang][11] - 1].trim(), /t = a;$/, lang);
  }
});

test('追蹤器的說明：定義資料型態、建立卡片、條件成立、整張卡片換位、印出', () => {
  const notes = [1, 2, 4, 5, 6, 8].map(i => CR.stepNote(page.trace, 'Amy 72 分', i, 'python'));
  assert.strictEqual(notes[0], '定義資料型態 Student');
  assert.strictEqual(notes[1], 'a = Student(name: "Amy", score: 72)');
  assert.match(notes[2], /^a\.score < b\.score（.*）成立$/);
  assert.strictEqual(notes[3], 't = Student(name: "Amy", score: 72)');
  assert.strictEqual(notes[4], 'a：Student(name: "Amy", score: 72) → Student(name: "Ben", score: 95)', '名字和成績一起換，整張卡片寫出來');
  assert.strictEqual(notes[5], '印出 Ben 95');
  assert.match(CR.stepNote(page.trace, 'Amy 98 分', 4, 'c'), /^a\.score < b\.score（.*）不成立$/, 'C 的條件寫在括號裡，取出來一樣');
});

test('實作：三個學生照成績由高到低排，印 Ben Cat Amy', () => {
  assert.strictEqual(page.code.output, 'Ben Cat Amy');
  for (const lang of ['c', 'cpp', 'java', 'python']) assert.match(page.code[lang], /t = cls\[j\]/, `${lang} 交換的是整筆`);
});

test('試試看：追蹤題印出最高分裡先出現的 Ben；填空題的正解是比成績欄位；除錯題的程式印出題目說的 Amy 95', () => {
  const [tracing, blank, debug] = page.tryit;
  assert.strictEqual(tracing.kind, '程式運行追蹤'); assert.strictEqual(tracing.options[tracing.answer], tracing.output);
  assert.strictEqual(blank.kind, '程式填空'); assert.strictEqual(blank.options[blank.answer], 'cls[j].score < cls[j + 1].score');
  assert.strictEqual(blank.output, 'Ben Cat Amy'); assert.match(blank.prompt, /Ben Cat Amy/);
  assert.strictEqual(debug.kind, '程式測試與除錯'); assert.strictEqual(debug.output, 'Amy 95'); assert.match(debug.prompt, /Amy 95/);
  assert.deepStrictEqual(page.tryit.map(q => q.answer), [1, 3, 2], '答案位置不都在 (A)');
});
