// tests/group-ai.test.js（node --test）：speedrun 挑模型、整組交給 AI（時間打七折、額度單件加總 −1、做過的跳過）
const test = require('node:test'); const assert = require('node:assert');
const { C } = require('../contract.js');
const { Engine } = require('../engine.js');
const Works = require('../works.js');
const DAY2 = require('../day2.js');

const MODELS = {
  Verse: { label: 'Verse 5', turnaround: [3, 6], accuracy: 0.65, cost: 1 },
  Essay: { label: 'Essay 5', turnaround: [6, 12], accuracy: 0.75, cost: 1 },
  Novel: { label: 'Novel 5', turnaround: [10, 20], accuracy: 0.9, cost: 2 },
};
// 拿第二天的主線卡當實驗台，換成 speedrun 的模型與額度
const speedrun = () => {
  const s = DAY2.make();
  return { ...s, ai: { ...s.ai, models: MODELS, quota: 10, readReqPenalty: 0.15 } };
};
const ready = (e) => { for (let i = 0; i < 31; i++) { if (e.hint) e.dismissHint(); e.tick(C.MS_PER_GAME_MIN); } return e.board.get('asset_platform'); };
const run = (e, n) => { for (let i = 0; i < n; i++) { if (e.hint) e.dismissHint(); e.tick(C.MS_PER_GAME_MIN); } };

test('speedrun 交給 AI 要挑模型：沒挑不給交；額度照模型扣，Novel 一次 2 格', () => {
  const e = new Engine(speedrun()); const card = ready(e);
  assert.strictEqual(e.delegate(card.id, 'estimate'), null);
  e.delegate(card.id, 'estimate', 'Novel'); assert.strictEqual(e.ai.left, 8);
  assert.strictEqual(card.ai.estimate[0].model, 'Novel');
  assert.deepStrictEqual(e.ai.stats.models, { Novel: 1 });
});

test('整理需求交給 AI：正確率照模型再低 15 個百分點；第二天沒有模型照舊', () => {
  const e = new Engine(speedrun());
  assert.strictEqual(e.aiAccuracy('Essay', 'read_req'), 0.6);
  assert.strictEqual(e.aiAccuracy('Essay', 'doc_plan'), 0.75);
  assert.strictEqual(new Engine(DAY2.make()).aiAccuracy(null, 'read_req'), 0.5);
});

test('整組交辦：文件三份 Essay 扣 2 格，依序交件，時間是單件加總打七折', () => {
  const e = new Engine(speedrun()); const card = ready(e);
  const start = e.clock.minute;
  const jobs = e.delegateGroup(card.id, 'docs', 'Essay');
  assert.deepStrictEqual(jobs.map(j => j.group), ['docs', 'docs', 'docs']);
  assert.strictEqual(e.ai.left, 8, '3 份 × 1 格 − 1');
  const single = (w) => e.aiMinutes(card, w, 1, 'Essay');
  const expect = [];
  let at = 0; for (const w of ['doc_plan', 'doc_spec', 'doc_accept']) { at += Math.round(single(w) * C.AI_GROUP_TIME); expect.push(start + at); }
  assert.deepStrictEqual(jobs.map(j => j.doneAt), expect);
  run(e, expect[2] - start + 1);
  assert.deepStrictEqual(['doc_plan', 'doc_spec', 'doc_accept'].map(w => card.ai[w][0].status), ['ready', 'ready', 'ready']);
});

test('整組交辦：規格拿同一組計畫的草稿當帶入（錯的計畫一路帶下去）', () => {
  const e = new Engine(speedrun()); const card = ready(e);
  e.delegateGroup(card.id, 'docs', 'Verse'); run(e, 40);
  const plan = card.ai.doc_plan[0], spec = card.ai.doc_spec[0];
  const specItem = card.subtasks.find(s => s.work === 'doc_spec').question.items[0];
  const given = Works.givenOptions(specItem, { doc_plan: plan.answers }, (w) => w === 'doc_plan');
  for (const o of given) assert.ok([].concat(spec.answers[0]).includes(o), `計畫草稿帶進規格的 ${o}`);
});

test('整組交辦：卡上做過的跳過；只剩一份就照單件價；還沒交到卡上的舊稿作廢', () => {
  const e = new Engine(speedrun()); const card = ready(e);
  e.delegate(card.id, 'doc_accept', 'Essay'); assert.strictEqual(e.ai.left, 9);
  e.doWork(card.id, 'doc_plan', [[0, 4]]);
  const jobs = e.delegateGroup(card.id, 'docs', 'Essay');
  assert.deepStrictEqual(jobs.map(j => card.ai.doc_spec.includes(j) ? 'doc_spec' : 'doc_accept'), ['doc_spec', 'doc_accept'], '計畫在卡上了，跳過');
  assert.strictEqual(e.ai.left, 8, '2 份 × 1 − 1 = 1 格');
  assert.strictEqual(card.ai.doc_accept[0].status, 'expired', '先前單件那份作廢');
  e.doWork(card.id, 'doc_spec', [[0]]);
  const one = e.delegateGroup(card.id, 'docs', 'Novel');
  assert.strictEqual(one.length, 1); assert.strictEqual(e.ai.left, 6, '只剩驗收一份，Novel 照單件扣 2 格');
});

test('額度不夠整組的價就交不出去', () => {
  const e = new Engine(speedrun()); const card = ready(e);
  e.ai.left = 4;
  assert.strictEqual(e.delegateGroup(card.id, 'docs', 'Novel'), null, '3 × 2 − 1 = 5 格');
  assert.strictEqual(e.ai.left, 4);
});
