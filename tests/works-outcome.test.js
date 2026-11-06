// tests/works-outcome.test.js（node --test）：選了某個寫法，成品上線後會怎樣（outcome）；沒做照 ifSkipped；規格預填開發
const test = require('node:test');
const assert = require('node:assert');
const Works = require('../works.js');
const DAY1 = require('../day1.js');

const q = { items: [
  { field: '單價', options: ['下拉', '紅字', '什麼都收'], answer: 0, ifSkipped: 2,
    outcome: { 1: { kind: 'annoy', say: '時價哪裡不正確？', red: '請輸入正確的單價' }, 2: { kind: 'miss', say: '單價寫『時價』也送得出去', junk: '時價' } } },
  { field: '規格', options: ['照品種', '新增單位', '一個文字框', '青蟳只有大中小'], answer: [0, 1], ifSkipped: [2],
    outcome: { 2: { kind: 'annoy', say: '烏魚子是講兩的' }, 3: { kind: 'late', say: '紅蟳跟沙公算同一個價', kg: { short: 5 } } } },
  { options: ['選填', '必填'], answer: 0, outcome: { 1: { kind: 'annoy', say: '沒什麼好備註的也要寫？' } } },
] };
// 規格連動的 function：規格第 0 題選什麼，開發就預填什麼
const fq = { kind: 'functions', functions: [
  { name: 'toKg', fields: { rate: { options: ['× 0.6', '× 0.5'], answer: 0 } } },
  { name: 'noWeightYet', spec: { item: 0 }, fields: { flow: { options: ['先記估重', '一定要填實重'], answer: 0, ifSkipped: 1,
    outcome: { 1: { kind: 'stuck', say: '船還在路上，我現在哪知道多重？' } } } } },
] };
const brief = (list) => list.map(o => [o.item ?? o.fn, o.opt, o.kind]);

test('選正解沒有後果', () => {
  assert.deepStrictEqual(Works.outcomes(q, [0, [0, 1], 0]), []);
});
test('單選選了跳紅字：annoy，帶欄位名和紅字', () => {
  assert.deepStrictEqual(Works.outcomes(q, [1, [0, 1], 0]), [{ item: 0, opt: 1, field: '單價', kind: 'annoy', say: '時價哪裡不正確？', red: '請輸入正確的單價' }]);
});
test('多選只算勾到的錯選項（正解沒勾不算後果）', () => {
  assert.deepStrictEqual(brief(Works.outcomes(q, [0, [0, 3], 0])), [[1, 3, 'late']]);
});
test('這件工作沒做：每題照 ifSkipped；沒寫 ifSkipped 的題沒有後果', () => {
  assert.deepStrictEqual(brief(Works.outcomes(q, null, { done: false })), [[0, 2, 'miss'], [1, 2, 'annoy']]);
});
test('做了但某題沒選：那題也照 ifSkipped', () => {
  assert.deepStrictEqual(brief(Works.outcomes(q, [undefined, [], 0])), [[0, 2, 'miss'], [1, 2, 'annoy']]);
});
test('新人訓練的題目沒有 outcome，一律沒有後果', () => {
  const ui = DAY1.cards[0].subtasks.find(s => s.work === 'ui_design').question;
  assert.deepStrictEqual(Works.outcomes(ui, null, { done: false }), []);
});
test('開發 function 的欄位也有後果：寫成卡住的寫法就是 stuck；沒寫開發照 ifSkipped', () => {
  assert.deepStrictEqual(Works.outcomes(fq, [{ rate: 0 }, { flow: 1 }]), [{ fn: 'noWeightYet', key: 'flow', field: null, opt: 1, kind: 'stuck', say: '船還在路上，我現在哪知道多重？' }]);
  assert.deepStrictEqual(brief(Works.outcomes(fq, null, { done: false })), [['noWeightYet', 1, 'stuck']]);
});
test('規格預填開發：規格選了第幾個，那個 function 就預填第幾個；規格沒寫就照原本的', () => {
  assert.deepStrictEqual(Works.prefill(fq, { doc_spec: [1] }, [{ rate: 0 }, { flow: 0 }]), [{ rate: 0 }, { flow: 1 }]);
  assert.deepStrictEqual(Works.prefill(fq, {}, [{ rate: 0 }, { flow: 0 }]), [{ rate: 0 }, { flow: 0 }]);
  assert.deepStrictEqual(Works.prefill(fq, undefined), [{}, {}]);
});
// 接手別人做過的版本：題目的 onlyIf 沒成立（檢閱沒挑出來），這題照 inherit（原本那版）
const q3 = { items: [{ field: '批號', options: ['自動編', '自己打跳紅字'], answer: 0, inherit: 1,
  onlyIf: { work: 'review_front', item: 0, picked: 'fixBatchNo' }, outcome: { 1: { kind: 'annoy', say: '這串數字誰記得住？' } } }] };
test('題目的 onlyIf 沒成立：這題照 inherit（原本那版）計分、AI 也照填', () => {
  assert.deepStrictEqual(Works.outcomes(q3, [0], { picks: {} }).map(o => o.kind), ['annoy'], '沒挑出來：玩家選什麼都照原本那版');
  assert.deepStrictEqual(Works.outcomes(q3, [0], { picks: { review_front: [['fixBatchNo']] } }), [], '挑出來了：照玩家選的');
  assert.deepStrictEqual(Works.outcomes(q3, null, { done: false }).map(o => o.kind), ['annoy'], '沒傳 picks、沒做：照原本那版');
  const locked = Works.grade(q3, [0], { picks: {} });
  assert.deepStrictEqual([locked.score, locked.max], [0, 1], '沒挑出來：玩家選正解也照原本那版的錯算');
  const fixed = Works.grade(q3, [0], { picks: { review_front: [['fixBatchNo']] } });
  assert.deepStrictEqual([fixed.score, fixed.max], [1, 1], '挑出來了：照玩家選的算');
  assert.deepStrictEqual(Works.aiAnswers(q3, { accuracy: 1, seed: 's', picks: {} }).answers, [1]);
  assert.deepStrictEqual(Works.aiAnswers(q3, { accuracy: 1, seed: 's', picks: { review_front: [['fixBatchNo']] } }).answers, [0]);
  assert.deepStrictEqual(Works.aiSpots(q3, [1], { picks: {} }), [], '鎖住的題不能圈起來請 AI 改');
});
test('選了有後果的寫法不算 bug（阿姿不會因為它退件），只少那一格的分數', () => {
  const r = Works.grade(fq, [{ rate: 0 }, { flow: 1 }], { covered: 'all', picks: {} });
  assert.deepStrictEqual(r.bugs, []); assert.strictEqual(r.score, 1); assert.strictEqual(r.max, 2);
});
test('交給 AI 開發：規格寫了，它照規格寫（寫成卡住的也照寫）', () => {
  assert.strictEqual(Works.aiAnswers(fq, { picks: { doc_spec: [1] }, accuracy: 1, seed: 's' }).answers[1].flow, 1);
});

// ── 交給 AI：前面的文件決定了的照文件寫，沒有文件、CLAIRE.md 也沒寫的照模型的正確率每題骰一次 ──
const dq = { kind: 'discuss', segments: ['價錢喔'], asks: { 0: { text: '…', options: ['「看哪裡的行情？」', '「好。」'], answer: 0 } } };
test('需求討論交給 AI：每題照正確率骰，骰錯選最客氣的那句', () => {
  const out = Works.aiAnswers(dq, { accuracy: 0, seed: 's' });
  assert.deepStrictEqual(out.answers.asks, { 0: [1] }); assert.deepStrictEqual(out.errors, ['miss']);
  assert.deepStrictEqual(Works.aiAnswers(dq, { accuracy: 1, seed: 's' }).answers.asks, { 0: [0] });
});
test('需求討論每題各骰一次：同一份答案裡有對有錯', () => {
  const many = { kind: 'discuss', segments: Array(20).fill('…'), asks: Object.fromEntries(Array.from({ length: 20 }, (_, i) => [i, dq.asks[0]])) };
  const picks = Object.values(Works.aiAnswers(many, { accuracy: 0.5, seed: 's' }).answers.asks).flat();
  assert.ok(picks.includes(0) && picks.includes(1));
});
test('欄位的 follows：照前面那份文件那題寫——文件對它就對（正確率再低也對），文件選錯它跟著錯', () => {
  const fq2 = { kind: 'functions', functions: [{ name: 'view', fields: { layout: { options: ['報表版面', '儀表板版面'], answer: 0, ai: { pick: 1 },
    follows: { work: 'ui_design', item: 0, wrong: { 3: 1 } } } } }] };
  assert.strictEqual(Works.aiAnswers(fq2, { accuracy: 0, seed: 's', picks: { ui_design: [[0, 2]] } }).answers[0].layout, 0);
  assert.strictEqual(Works.aiAnswers(fq2, { accuracy: 1, seed: 's', picks: { ui_design: [[0, 2, 3]] } }).answers[0].layout, 1);
});
test('前面文件帶入的選項：來源文件做了、條件沒成立（會議沒問到），AI 也不寫；問到了一定寫；來源還沒做照骰', () => {
  const plan = { items: [{ type: 'order', options: ['資料表', '單價帶行情', '寫測試'], answer: [0, 1, 2], ai: { pick: [0, 2] },
    given: [{ work: 'discuss', options: [1], when: { item: 2, picked: 0 } }, { work: 'reject', options: [1], when: { item: 0, picked: 0 } }] }] };
  const asked = { discuss: { circled: [2], asks: { 2: [0] } } }, notAsked = { discuss: { circled: [], asks: {} } };
  assert.deepStrictEqual(Works.aiAnswers(plan, { accuracy: 1, seed: 's', picks: notAsked, done: ['discuss'] }).answers[0], [0, 2], '會議沒問到，正確率再高也不知道');
  assert.deepStrictEqual(Works.aiAnswers(plan, { accuracy: 0, seed: 's', picks: asked, done: ['discuss'] }).answers[0], [0, 1, 2], '問到了，正確率再低也帶');
  assert.deepStrictEqual(Works.aiAnswers(plan, { accuracy: 1, seed: 's', picks: {}, done: [] }).answers[0], [0, 1, 2], '來源還沒做：沒有文件，照骰');
});
test('rollOnce（Pedia 整張）：整份只骰一次；失誤時從可選的題挑一題錯、其他照正解；前面文件決定的題不會被挑', () => {
  const q = { items: [
    { options: ['a', 'b'], answer: 0, ai: { pick: 1 } },
    { options: ['a', 'b'], answer: 0, ai: { pick: 1 } },
    { type: 'order', options: ['x', 'y'], answer: [0, 1], ai: { pick: [0] }, given: [{ work: 'discuss', options: [1], when: { item: 0, picked: 0 } }] },
  ] };
  const ok = Works.aiAnswers(q, { accuracy: 1, seed: 's', rollOnce: true });
  assert.deepStrictEqual([ok.answers, ok.errors], [[0, 0, [0, 1]], []]);
  const picks = { discuss: { circled: [0], asks: { 0: [0] } } };
  const hit = new Set();
  for (const seed of ['a', 'b', 'c', 'd', 'e', 'f']) {
    const bad = Works.aiAnswers(q, { accuracy: 0, seed, rollOnce: true, picks, done: ['discuss'] });
    const wrong = bad.answers.map((a, i) => JSON.stringify(a) !== JSON.stringify(q.items[i].answer));
    assert.strictEqual(wrong.filter(Boolean).length, 1, seed);
    assert.strictEqual(wrong[2], false, '文件帶入的那題不會被挑');
    hit.add(wrong.indexOf(true));
  }
  assert.deepStrictEqual([...hit].sort(), [0, 1], '挑哪一題照種子，可選的都可能');
});
test('rollOnce 的開發：規格、測試、follows、主張決定的欄位不會被挑，挑的是沒有文件的那格', () => {
  const fq3 = { kind: 'functions', functions: [
    { name: 'free1', fields: { x: { options: ['對', '錯'], answer: 0, ai: { pick: 1 } } } },
    { name: 'bySpec', spec: { item: 0 }, fields: { flow: { options: ['對', '錯'], answer: 0, ai: { pick: 1 } } } },
    { name: 'byDoc', fields: { layout: { options: ['對', '錯'], answer: 0, ai: { pick: 1 }, follows: { work: 'ui_design', item: 0, wrong: { 3: 1 } } } } },
    { name: 'claim', judgment: true, fields: { how: { options: ['對', '錯'], answer: 0, ai: { pick: 1 } } } },
  ] };
  for (const seed of ['a', 'b', 'c']) {
    const out = Works.aiAnswers(fq3, { accuracy: 0, seed, rollOnce: true, picks: { doc_spec: [0], ui_design: [[0]] } });
    assert.deepStrictEqual(out.answers.map(a => Object.values(a)[0]), [1, 0, 0, 1], seed);
  }
});
test('文件沒寫到、但 CLAIRE.md 點名要的選項照寫：筆記一定遵守', () => {
  const multi = { items: [{ options: ['a', 'b', 'c'], answer: [0, 1], ai: { pick: [0] }, tags: { 1: 'auth:api' },
    given: [{ work: 'read_req', options: [1], when: { item: 0, picked: 0 } }] }] };
  const ctx = { accuracy: 1, seed: 's', picks: { read_req: [1] }, done: ['read_req'] };
  assert.deepStrictEqual(Works.aiAnswers(multi, ctx).answers[0], [0], '沒筆記：文件沒寫，它也不寫');
  assert.deepStrictEqual(Works.aiAnswers(multi, { ...ctx, notes: { auth: 'api' } }).answers[0], [0, 1], '筆記寫了，照筆記');
  assert.deepStrictEqual(Works.aiAnswers(multi, { ...ctx, notes: { auth: 'front' } }).answers[0], [0], '筆記是別的做法，照樣不寫');
});
