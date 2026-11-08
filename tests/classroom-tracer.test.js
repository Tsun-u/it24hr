// tests/classroom-tracer.test.js（node --test）：程式追蹤器（scripts/trace_python.py）遇到函式、讀輸入、自訂資料型態、遞迴時記下的每一步，
// 以及 Classroom.stepNote 寫出來的說明
const test = require('node:test'); const assert = require('node:assert');
const path = require('path');
const { execFileSync } = require('child_process');
const CR = require('../classroom.js');

const trace = (code, stdin) => JSON.parse(execFileSync('python', ['-X', 'utf8', '-I', path.join(__dirname, '..', 'scripts', 'trace_python.py')],
  { input: JSON.stringify({ code, stdin }), encoding: 'utf8' }));
// 只有 Python 一種語言的追蹤器，給 stepNote 用
const page = (code, stdin) => ({ code: { python: code }, lines: {}, inputs: [{ label: 'x', values: {}, stdin }], runs: { x: trace(code, stdin) } });
const notes = (t) => t.runs.x.map((_, i) => CR.stepNote(t, 'x', i, 'python'));

const FUNC = [
  'def total(cups, member):',
  '    price = cups * 50',
  '    if member:',
  '        price = price * 9 // 10',
  '    return price',
  '',
  't = total(2, True)',
  'print(t)',
  '',
].join('\n');

test('函式：呼叫那一步帶著參數進新的一層，回傳那一步記回傳值，回來之後那一行跑完另外是一步', () => {
  const steps = trace(FUNC);
  assert.deepStrictEqual(steps.map(s => s.line), [1, 7, 2, 3, 4, 5, 7, 8]);
  assert.strictEqual(steps[0].def, 'total');
  assert.strictEqual(steps[1].call, 'total');
  assert.deepStrictEqual(steps[1].stack, [{ vars: {} }, { fn: 'total', vars: { cups: 2, member: true } }]);
  assert.strictEqual(steps[3].cond, true, 'member 是 True，進 if');
  assert.strictEqual(steps[5].ret, 90);
  assert.deepStrictEqual(steps[6].vars, { t: 90 }, '回到主程式，t 拿到回傳值');
  assert.strictEqual(steps[6].stack, undefined, '回到主程式就沒有呼叫堆疊了');
});

test('函式的說明：定義、呼叫、條件、回傳、拿到回傳值各一句', () => {
  assert.deepStrictEqual(notes(page(FUNC)), [
    '定義函式 total',
    '呼叫 total（cups = 2、member = true）',
    'price = 100',
    'member（true）成立',
    'price：100 → 90',
    'total 回傳 90',
    't = 90',
    '印出 90',
  ]);
});

test('讀輸入：每一步記讀到第幾個字，說明寫讀進了什麼', () => {
  const code = 'n = int(input())\nnums = input().split()\nprint(n + len(nums))\n';
  const t = page(code, '3\n5 2 8\n');
  assert.deepStrictEqual(t.runs.x.map(s => s.read), [2, 8, 8]);
  assert.deepStrictEqual(notes(t), ['讀進 3；n = 3', '讀進 5 2 8；nums = ["5", "2", "8"]', '印出 6']);
});

const STRUCT = [
  'from dataclasses import dataclass',
  '',
  '@dataclass',
  'class Student:',
  '    name: str',
  '    score: int',
  '',
  'a = Student("Amy", 72)',
  'a.score = a.score + 1',
  'print(a.name)',
  '',
].join('\n');

test('自訂資料型態：@dataclass 的定義併成 class 那行一步，值寫成 { __type, 欄位 }，只改一個欄位就寫那個欄位', () => {
  const t = page(STRUCT);
  assert.deepStrictEqual(t.runs.x.map(s => s.line), [1, 4, 8, 9, 10]);
  assert.deepStrictEqual(t.runs.x[2].vars.a, { __type: 'Student', name: 'Amy', score: 72 });
  assert.deepStrictEqual(notes(t).slice(1), ['定義資料型態 Student', 'a = Student(name: "Amy", score: 72)', 'a.score：72 → 73', '印出 Amy']);
});

test('條件代入值：a.score 這種取欄位的代成那個欄位的值，不是整張卡片', () => {
  const t = page(STRUCT.replace('a.score = a.score + 1', 'if a.score < 80:\n    a.score = a.score + 1'));
  assert.strictEqual(notes(t)[3], 'a.score < 80（72 < 80）成立');
});

test('遞迴：每呼叫一次多一層，最上面那層是正在跑的；最後一層的條件不成立就回去', () => {
  const code = 'def notify(k, n):\n    print(k)\n    if k < n:\n        notify(k + 1, n)\n\nnotify(1, 2)\n';
  const t = page(code); const steps = t.runs.x;
  assert.deepStrictEqual(steps.map(CR.depthOf), [1, 2, 2, 2, 3, 3, 3, 2, 1]);
  assert.deepStrictEqual(steps[4].stack.map(f => f.vars.k), [undefined, 1, 2]);
  assert.deepStrictEqual(notes(t).slice(4), [
    '呼叫 notify（k = 2、n = 2）',
    '印出 2',
    'k < n（2 < 2）不成立；notify 跑完了，回到呼叫它的地方',
    'notify 跑完了，回到呼叫它的地方',
    '',
  ]);
});
