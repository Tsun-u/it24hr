// tests/classroom-functions.test.js（node --test）：APCS 程式設計「函式」這一頁的追蹤資料、呼叫堆疊、追蹤器的說明、跑幾步、試試看對得起來
const test = require('node:test'); const assert = require('node:assert');
const CR = require('../classroom.js');
const page = CR.PAGES.programming.functions;
const { runs } = page.trace;
const last = (run) => run[run.length - 1];

test('追蹤器：兩杯會員打九折 90、不是會員 100；三杯是 135、150', () => {
  assert.strictEqual(last(runs['c = 2']).out, '90 100\n');
  assert.strictEqual(last(runs['c = 3']).out, '135 150\n');
});

test('追蹤器：total 呼叫兩次，各有呼叫那一步和回傳那一步；會員那次進 if、不是會員那次不進', () => {
  for (const [label, rets] of [['c = 2', [90, 100]], ['c = 3', [135, 150]]]) {
    const run = runs[label];
    assert.deepStrictEqual(run.filter(s => s.call).map(s => s.call), ['total', 'total'], label);
    assert.deepStrictEqual(run.filter(s => 'ret' in s).map(s => s.ret), rets, label);
    assert.deepStrictEqual(run.filter(s => 'cond' in s).map(s => s.cond), [true, false], label);
  }
});

test('呼叫堆疊：price 只活在 total 那一層，主程式那層從來沒有 price；第二次呼叫的 price 重新開始', () => {
  for (const run of Object.values(runs)) for (const s of run) {
    const main = s.stack ? s.stack[0].vars : s.vars;
    assert.ok(!('price' in main), `第 ${s.line} 行那一步，主程式看得到 price`);
    if (s.stack) assert.strictEqual(s.stack[1].fn, 'total');
  }
  const second = runs['c = 2'].findIndex((s, i) => i > 1 && s.call);
  assert.strictEqual(CR.stepNote(page.trace, 'c = 2', second + 1, 'python'), 'price = 100', '第二次呼叫的 price 是新開的，不是從 90 改過來');
});

test('追蹤器的說明：定義、呼叫帶參數、條件代入值、打九折、回傳、拿到回傳值、印出', () => {
  const notes = runs['c = 2'].map((_, i) => CR.stepNote(page.trace, 'c = 2', i, 'python'));
  assert.deepStrictEqual(notes, [
    '定義函式 total',
    '呼叫 total（cups = 2、member = 1）',
    'price = 100',
    'member == 1（1 == 1）成立',
    'price：100 → 90',
    'total 回傳 90',
    'a = 90',
    '呼叫 total（cups = 2、member = 0）',
    'price = 100',
    'member == 1（0 == 1）不成立',
    'total 回傳 100',
    'b = 100',
    '印出 90 100',
  ]);
  assert.strictEqual(CR.stepNote(page.trace, 'c = 2', 3, 'c'), 'member == 1（1 == 1）成立', 'C 的條件寫在括號裡，取出來一樣');
});

test('追蹤器：兩組輸入執行到的每一行（含 def 那行、函式裡每一行），C／C++／Java 都對得到一行', () => {
  for (const lang of ['c', 'cpp', 'java']) for (const run of Object.values(runs)) {
    for (const s of run) assert.ok(page.trace.lines[lang][s.line], `${lang} 對不到 Python 第 ${s.line} 行`);
  }
});

test('實作：max3 是 8、7 是質數、9 不是、傳值的 x 還是 5、fill 改到外面的陣列 arr[3] = 9', () => {
  assert.strictEqual(page.code.output, '8 1 0 5 9');
});

test('跑幾步：呼叫兩次本體跑兩次（跟追蹤資料一樣）、n·m、is_prime 是 O(√n)', () => {
  const [calls, nested, prime] = page.cost.rows;
  for (const run of Object.values(runs)) assert.strictEqual(run.filter(s => s.line === 2).length, 2);
  assert.match(calls[1], /跑 2 次/);
  assert.match(nested[0], /12 次/); assert.match(nested[1], /O\(n·m\)/);
  assert.match(prime[1], /O\(√n\)/);
  assert.strictEqual(page.cost.note.see, 'ds/complexity');
});

test('試試看：追蹤題和效能題的答案就是程式印出來的；填空題的程式填進正解，印出 8 9', () => {
  for (const q of page.tryit) {
    if (q.kind === '程式填空') { assert.strictEqual(q.options[q.answer], 'b'); assert.strictEqual(q.output, '8 9'); }
    else assert.strictEqual(q.options[q.answer], q.output, q.prompt);
  }
  assert.ok(new Set(page.tryit.map(q => q.answer)).size > 1, '答案位置不要都一樣');
});

test('核心觀念結尾連到資料結構的堆疊頁', () => {
  assert.strictEqual(last(page.concept).see, 'ds/stack');
});
