// tests/works.test.js（node --test）
const test = require('node:test'); const assert = require('node:assert');
const W = require('../works.js');

test('單選題計分：答對 1、答錯 0，回傳花掉的時間與錯的題', () => {
  const q = { work: 'read_req', minutes: 20, items: [{ text: 'q', options: ['a', 'b', 'c'], answer: 1 }] };
  assert.deepStrictEqual(W.grade(q, [1]), { score: 1, max: 1, minutes: 20, wrong: [], violated: [], choices: {}, effects: [] });
  assert.deepStrictEqual(W.grade(q, [0]).wrong, [0]);
});

test('多選題：漏選扣分，多選不加分', () => {
  const q = { work: 'test', minutes: 15, items: [{ text: 'q', options: ['a', 'b', 'c', 'd'], answer: [0, 2] }] };
  assert.strictEqual(W.grade(q, [[0, 2]]).score, 1);
  assert.strictEqual(W.grade(q, [[0]]).score, 0.5);
  assert.strictEqual(W.grade(q, [[0, 1, 2, 3]]).score, 0.5);
  assert.strictEqual(W.grade(q, [[2, 0]]).score, 1);
});

test('排序題：全對才算對', () => {
  const q = { work: 'deploy', minutes: 10, items: [{ text: 'q', type: 'order', options: ['備份', '上傳', '替換', '驗證'], answer: [0, 1, 2, 3] }] };
  assert.strictEqual(W.grade(q, [[0, 1, 2, 3]]).score, 1);
  assert.strictEqual(W.grade(q, [[1, 0, 2, 3]]).score, 0);
});

test('排序題有 before（開發計畫）：挑對步驟照比例算一半、有先後關係的排對幾條算另一半', () => {
  // 0 確認欄位 1 資料表 2 功能 3 匯出 4 手機 5 測試 6 部署 7 登入（不該做）
  const q = { items: [{ text: '步驟', type: 'order', options: ['確認', '資料表', '功能', '匯出', '手機', '測試', '部署', '登入'],
    answer: [0, 1, 2, 3, 4, 5, 6], before: [[0, 1], [1, 2], [2, 3], [2, 4], [3, 6], [4, 6], [5, 6]] }] };
  const score = (a) => W.grade(q, [a]).score;
  assert.strictEqual(score([0, 1, 2, 3, 4, 5, 6]), 1);
  assert.strictEqual(score([0, 1, 2, 4, 3, 5, 6]), 1, '匯出和手機版沒有先後關係，對調也對');
  assert.strictEqual(score([5, 0, 1, 2, 3, 4, 6]), 1, '測試先寫也對，只要在部署前');
  assert.strictEqual(score([0, 2, 1, 3, 4, 5, 6]), (1 + 6 / 7) / 2, '資料表和功能對調：步驟全對、先後錯一條');
  assert.strictEqual(score([0, 1, 2, 3, 4, 6]), (6 / 7 + 6 / 7) / 2, '漏了測試：步驟少一個，測試在部署前那條也不算');
  assert.strictEqual(score([0, 1, 7, 2, 3, 4, 5, 6]), (0.5 + 1) / 2, '多排了登入：步驟那半跟多選題一樣最多一半');
  assert.strictEqual(score([0]), (1 / 7) / 2, '只排一步：沒有一條先後關係成立');
  assert.deepStrictEqual(W.grade(q, [[0, 2, 1, 3, 4, 5, 6]]).wrong, [0]);
});

test('部署題（有 roles）也拆兩半算：先後只看 備份→替換、上傳→替換、替換→驗證（有轉換就加 備份→轉換、轉換→驗證）', () => {
  const q = { roles: { backup: 0, upload: 1, replace: 2, smoke: 3, notify: 4 }, items: [{ text: '步驟', type: 'order', options: ['備份', '上傳', '替換', '驗證', '通知'], answer: [0, 1, 2, 3] }] };
  const score = (a) => W.grade(q, [a]).score;
  assert.strictEqual(score([0, 1, 2, 3]), 1);
  assert.strictEqual(score([1, 0, 2, 3]), 1, '備份在上傳後、替換前也對');
  assert.strictEqual(score([1, 2, 0, 3]), (1 + 2 / 3) / 2, '備份排在替換後面');
  assert.strictEqual(score([0, 1, 2, 3, 4]), (0.5 + 1) / 2, '部署時就通知：多排了不該做的');
  const mig = { roles: { backup: 0, upload: 1, replace: 2, migrate: 3, smoke: 4 }, items: [{ text: '步驟', type: 'order', options: ['備份', '上傳', '替換', '轉換', '驗證'], answer: [0, 1, 2, 3, 4] }] };
  assert.strictEqual(W.grade(mig, [[0, 1, 3, 2, 4]]).score, 1, '轉換和替換誰先都行');
  assert.strictEqual(W.grade(mig, [[1, 3, 0, 2, 4]]).score, (1 + 4 / 5) / 2, '備份排在轉換後面');
  assert.deepStrictEqual(W.deployBefore(q.roles), [[0, 2], [1, 2], [2, 3]]);
});

test('前端程式：記下違反了哪幾條 heuristic', () => {
  const q = { work: 'ui_design', minutes: 15, items: [
    { text: 'a', options: ['x', 'y'], answer: 0, heuristic: 3 },
    { text: 'b', options: ['x', 'y'], answer: 1, heuristic: 7 }] };
  const r = W.grade(q, [1, 1]);
  assert.deepStrictEqual(r.violated, [3]); assert.strictEqual(r.score, 1); assert.strictEqual(r.max, 2);
});

test('多選的替代解（alt）：勾替代解算答到那一項，不算多勾', () => {
  const q = { items: [{ text: 'q', options: ['a', 'b', 'c', 'd'], answer: [0, 1], alt: { 3: 1 } }] };
  assert.strictEqual(W.grade(q, [[0, 3]]).score, 1);
  assert.strictEqual(W.grade(q, [[0, 1, 3]]).score, 1);
  assert.strictEqual(W.grade(q, [[0, 2]]).score, 0.5);
});

test('沒答的題算錯', () => {
  const q = { work: 'read_req', minutes: 20, items: [{ text: 'q', options: ['a', 'b'], answer: 0 }, { text: 'r', options: ['a', 'b'], answer: 1 }] };
  const r = W.grade(q, [0]);
  assert.strictEqual(r.score, 1); assert.deepStrictEqual(r.wrong, [1]);
});

test('跨裝置：裝置沒電時「用裝置測」不可選', () => {
  const opts = W.deviceTestOptions({ phone: 3, tablet: 80 });
  assert.strictEqual(opts.find(o => o.id === 'real').disabled, true);
  assert.match(opts.find(o => o.id === 'real').reason, /手機/);
  assert.strictEqual(W.deviceTestOptions({ phone: 50, tablet: 80 }).find(o => o.id === 'real').disabled, false);
  assert.strictEqual(opts.find(o => o.id === 'sim').disabled, false);
});

test('核心工作的中文名與子選單', () => {
  assert.strictEqual(W.label('doc_spec'), '開發規格文件');
  assert.deepStrictEqual(W.MENU.find(m => m.id === 'docs').children.map(c => c.id), ['doc_plan', 'doc_spec', 'doc_accept']);
  assert.deepStrictEqual(W.MENU.find(m => m.id === 'dev').children.map(c => c.id), ['test', 'ui_design', 'code']);
  assert.deepStrictEqual(['ui_design', 'code'].map(W.label), ['前端程式', '後端程式']);
  assert.ok(!W.MENU.some(m => m.id === 'ui_design'), '前端程式在開發底下，不是獨立一顆');
  assert.deepStrictEqual(W.MENU.find(m => m.id === 'reviews').children.map(c => c.id), ['review_front', 'review_back']);
  assert.ok(W.MENU.some(m => m.id === 'manual_test' && !m.children), '手動測試獨立一顆');
});

test('沒有對錯的選擇不計分，但記下選了什麼，時間可以照選擇算', () => {
  const q = { work: 'test', minutes: (c) => c.style === 2 ? 5 : 40, items: [
    { text: '怎麼寫測試？', free: true, key: 'style', options: ['先寫', '邊寫', '不寫'] },
    { text: 'q', options: ['a', 'b'], answer: 0 }] };
  const r = W.grade(q, [2, 0]);
  assert.strictEqual(r.max, 1); assert.strictEqual(r.score, 1);
  assert.deepStrictEqual(r.choices, { style: 2 }); assert.strictEqual(r.minutes, 5);
});

// ── kind:'functions'：開發小關卡 ──
const FQ = { kind: 'functions', minutes: 30, functions: [
  { sentence: 0, name: 'a', code: 'A', fields: { x: { options: ['p', 'q'], answer: 0 } } },
  { name: 'b', fields: { y: { options: ['p', 'q'], answer: 1 } } },
  { judgment: 'guard', name: 'c', fields: { how: { options: ['後端', '前端'], answer: 0 } } },
] };
test('functions：SA 開的卡（covered all）只填沒寫到規格的和 AI 主張的', () => {
  assert.deepStrictEqual(W.functionsToFill(FQ, 'all'), [1, 2]);
  const r = W.grade(FQ, [{}, { y: 1 }, { how: 1 }], { covered: 'all' });
  assert.strictEqual(r.max, 2); assert.strictEqual(r.score, 1); assert.deepStrictEqual(r.bugs, [{ fn: 'c', field: 'how' }]);
});
test('functions：自己開的卡沒勾那句，function 選項全開', () => {
  assert.deepStrictEqual(W.functionsToFill(FQ, []), [0, 1, 2]);
  assert.deepStrictEqual(W.functionsToFill(FQ, [0]), [1, 2]);
  const r = W.grade(FQ, [], { covered: [] });
  assert.strictEqual(r.max, 3); assert.strictEqual(r.score, 0); assert.strictEqual(r.bugs.length, 3);
});

// ── kind:'discuss'：需求討論 ──
const DQ = { kind: 'discuss', segments: ['a', 'b', 'c', 'd'], asks: { 1: { options: ['x', 'y'], answer: 0 }, 3: { options: ['x', 'y'], answer: 1 } } };
test('discuss：圈對、問對才得分；沒圈到的記在 missed、圈錯的記在 overAsked', () => {
  const full = W.grade(DQ, { circled: [1, 3], asks: { 1: 0, 3: 1 } });
  assert.strictEqual(full.score, 2); assert.deepStrictEqual(full.missed, []); assert.deepStrictEqual(full.overAsked, []);
  const half = W.grade(DQ, { circled: [0, 1], asks: { 1: 1 } });
  assert.strictEqual(half.score, 0); assert.deepStrictEqual(half.missed, [3]); assert.deepStrictEqual(half.overAsked, [0]); assert.deepStrictEqual(half.wrong, [1, 3]);
  const none = W.grade(DQ, {});
  assert.deepStrictEqual(none.missed, [1, 3]);
});

test('functions：標 plan 的 function，開發計畫沒排那一步就要自己填', () => {
  const PQ = { kind: 'functions', functions: [{ sentence: 0, needs: { work: 'doc_plan', picked: 2 }, name: 'a', code: 'A', fields: { x: { options: ['p'], answer: 0 } } }, { sentence: 1, name: 'b', code: 'B' }] };
  assert.deepStrictEqual(W.functionsToFill(PQ, 'all', null), [0]);
  assert.deepStrictEqual(W.functionsToFill(PQ, 'all', { doc_plan: [[1, 2, 3]] }), []);
  assert.deepStrictEqual(W.functionsToFill(PQ, 'all', { doc_plan: [[1, 3]] }), [0]);
});

test('做完的筆記寫成人話', () => {
  const q = { items: [{ text: '報廢的資產要____', options: ['刪', '留'], answer: 1 }, { text: '步驟', type: 'order', options: ['a', 'b'], answer: [0, 1] }, { text: '案例', options: ['x', 'y'], answer: [0, 1] }] };
  assert.strictEqual(W.summarize(q, [1, [1, 0], [0, 1]]), '報廢的資產要［留］；步驟：b → a；案例：x、y。');
  assert.strictEqual(W.summarize(DQ, { circled: [0, 1], asks: { 1: 0 } }), '圈了 2 處。問了：x');
  assert.match(W.summarize(FQ, [], { toFill: [1, 2] }), /^寫了 b、c；a 從文件拉進來。$/);
});

test('discuss：一段掛好幾題時，每題各算一分，答案是一串索引', () => {
  const MQ = { kind: 'discuss', segments: ['a', 'b'], asks: { 1: [{ options: ['x', 'y'], answer: 0, replies: ['X', 'Y'] }, { options: ['x', 'y'], answer: 1, replies: ['X', 'Y'] }] } };
  const r = W.grade(MQ, { circled: [1], asks: { 1: [0, 1] } }); assert.strictEqual(r.max, 2); assert.strictEqual(r.score, 2);
  const half = W.grade(MQ, { circled: [1], asks: { 1: [0] } }); assert.strictEqual(half.score, 1); assert.deepStrictEqual(half.wrong, [1]);
  assert.strictEqual(W.summarize(MQ, { circled: [1], asks: { 1: [0, 1] } }), '圈了 1 處。問了：x→X；y→Y');
});

test('選項顯示順序打散（正解都放在第一個）：同一個種子順序固定、是完整的排列；有大小順序的（估時）不打散', () => {
  const a = W.displayOrder(5, 'run1:k:read_req:0'), b = W.displayOrder(5, 'run1:k:read_req:0');
  assert.deepStrictEqual(a, b); assert.deepStrictEqual([...a].sort(), [0, 1, 2, 3, 4]);
  assert.deepStrictEqual(W.displayOrder(4, 'x', true), [0, 1, 2, 3], 'keepOrder');
  // 兩百個種子裡，原本排第一個的選項還在第一個的比例要接近 1/5，不能是全部
  let first = 0; for (let s = 0; s < 200; s++) if (W.displayOrder(5, `seed${s}`)[0] === 0) first++;
  assert.ok(first > 10 && first < 80, String(first));
});
