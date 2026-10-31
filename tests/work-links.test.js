// tests/work-links.test.js（node --test）：工作間原則——卡上的準備工作都有意義，文件越詳細，開發就越容易
const test = require('node:test'); const assert = require('node:assert');
const W = require('../works.js');
const DAY1 = require('../day1.js');
const DAY2 = require('../day2.js');

const sub = (card, work) => card.subtasks.find(s => s.work === work).question;
const crud = DAY1.cards[0], platform = DAY2.make().cards[0];
const doneIn = (picks) => (w) => w in picks;

test('開發預填：卡上有寫，加上開發計畫或開發規格其中一份寫到', () => {
  const q = { kind: 'functions', functions: [{ sentence: 0, needs: { work: 'doc_plan', picked: 2 }, spec: 1, name: 'a', fields: { x: { options: ['p'], answer: 0 } } }] };
  assert.deepStrictEqual(W.functionsToFill(q, 'all', {}), [0], '兩份都沒寫');
  assert.deepStrictEqual(W.functionsToFill(q, 'all', { doc_plan: [[2]] }), [], '計畫排了');
  assert.deepStrictEqual(W.functionsToFill(q, 'all', { doc_spec: [[1]] }), [], '規格寫了');
  assert.deepStrictEqual(W.functionsToFill(q, [], { doc_spec: [[1]] }), [0], '卡上沒寫，IT 不會通靈');
});

test('第一天：計畫排了「做新增／查詢／修改／報廢」，四個 function 都預填', () => {
  assert.deepStrictEqual(W.functionsToFill(sub(crud, 'code'), 'all', { doc_plan: [[0, 1, 2]] }), []);
  assert.deepStrictEqual(W.functionsToFill(sub(crud, 'code'), 'all', { doc_spec: [[0]] }).map(i => sub(crud, 'code').functions[i].name), ['createAsset', 'scrapAsset']);
});

test('整理需求答對才帶（進規格、進開發計畫都一樣）', () => {
  const spec = sub(crud, 'doc_spec').items[0], plan = sub(crud, 'doc_plan').items[0];
  const right = { read_req: [1, 1, 0] }, wrong = { read_req: [0, 0, 1] };
  assert.deepStrictEqual(W.givenOptions(spec, right, doneIn(right)).sort(), [2, 6]);
  assert.deepStrictEqual(W.givenOptions(spec, wrong, doneIn(wrong)), []);
  assert.deepStrictEqual(W.givenOptions(plan, right, doneIn(right)).sort(), [0, 2, 4]);
  assert.deepStrictEqual(W.givenOptions(plan, wrong, doneIn(wrong)), []);
});

test('第一天：開發計畫 ← 需求討論；驗收 ← 開發計畫', () => {
  const asked = { discuss: { circled: [3, 6, 8], asks: { 3: 0, 6: 0, 8: [0, 0] } } };
  assert.deepStrictEqual(W.givenOptions(sub(crud, 'doc_plan').items[0], asked, doneIn(asked)).sort(), [0, 1, 3]);
  const planned = { doc_plan: [[0, 1, 2, 3, 4, 5, 6]] };
  assert.deepStrictEqual(W.givenOptions(sub(crud, 'doc_accept').items[0], planned, doneIn(planned)).sort(), [0, 1, 2, 3, 4, 5]);
});

test('第二天：整理需求不帶「盤點狀態與原因」「簽核流程」（要問了才知道），問了需求討論才帶', () => {
  const spec = sub(platform, 'doc_spec').items[0];
  const read = { read_req: [0, 0, 0] };
  assert.deepStrictEqual(W.givenOptions(spec, read, doneIn(read)), [0]);
  const asked = { discuss: { circled: [3, 6], asks: { 3: 0, 6: 0 } } };
  assert.deepStrictEqual(W.givenOptions(spec, asked, doneIn(asked)).sort(), [1, 2]);
});

test('第二天：計畫排了「後端每支 API 檢查角色」→ 規格帶「權限在後端每支 API 檢查」→ 驗收帶 403 那個案例', () => {
  const planned = { doc_plan: [[0, 5]] };
  assert.ok(W.givenOptions(sub(platform, 'doc_spec').items[0], planned, doneIn(planned)).includes(4));
  assert.ok(W.givenOptions(sub(platform, 'doc_accept').items[0], planned, doneIn(planned)).includes(3));
  const specced = { doc_spec: [[4]] };
  assert.ok(W.givenOptions(sub(platform, 'doc_accept').items[0], specced, doneIn(specced)).includes(3));
});

test('第二天：今天規格寫了「資產編號沿用昨天的規則」，編號 function 也預填（不用等前一天）', () => {
  const code = sub(platform, 'code'), at = code.functions.findIndex(f => f.name === 'serialFromYesterday');
  assert.ok(W.functionsToFill(code, 'all', {}).includes(at));
  assert.ok(!W.functionsToFill(code, 'all', { doc_spec: [[7]] }).includes(at));
});

test('交給 AI 寫的文件也帶入前面的內容：多選併進去，排序題照正解先後插進去', () => {
  const multi = { items: [{ text: 'm', options: ['a', 'b', 'c'], answer: [0, 1], ai: { pick: [2], kind: 'miss' }, given: [{ work: 'read_req', options: [1] }] }] };
  assert.deepStrictEqual(W.aiAnswers(multi, { accuracy: 0, seed: 's', done: ['read_req'] }).answers[0].sort(), [1, 2]);
  assert.deepStrictEqual(W.aiAnswers(multi, { accuracy: 0, seed: 's', done: [] }).answers[0], [2], '前面沒做就沒得帶');
  const order = { items: [{ text: 'o', type: 'order', options: ['a', 'b', 'c', 'd'], answer: [0, 1, 2, 3], ai: { pick: [0, 3], kind: 'miss' }, given: [{ work: 'read_req', options: [1] }] }] };
  assert.deepStrictEqual(W.aiAnswers(order, { accuracy: 0, seed: 's', done: ['read_req'] }).answers[0], [0, 1, 3]);
});

test('AI 照先寫好的測試開發：測試 ＞ AI 筆記 ＞ AI 主張；測試太鬆不約束', () => {
  const code = sub(platform, 'code'), tests = sub(platform, 'test');
  const fn = (name) => code.functions.findIndex(f => f.name === name);
  const testAt = (name) => tests.functions.findIndex(f => f.name === name);
  const answers = []; answers[testAt('testApiRejectsWrongRole')] = { assert: 0 }; answers[testAt('testOwnerSeesOnlyOwn')] = { assert: 1 };
  const drives = W.testDrives(tests, answers, { covered: 'all', picks: {} });
  assert.deepStrictEqual(drives.guardApi, { how: 0 });
  assert.strictEqual(drives.listMine, undefined, '「至少有一筆」太鬆，不約束');
  const ai = W.aiAnswers(code, { accuracy: 0, seed: 's', notes: { auth: 'front' }, drives }).answers;
  assert.strictEqual(ai[fn('guardApi')].how, 0, '測試寫 403：主張和筆記都蓋過');
  assert.strictEqual(ai[fn('listMine')].rows, 1, '沒約束的照它自己錯');
  const wrong = []; wrong[testAt('testApiRejectsWrongRole')] = { assert: 1 };
  const ai2 = W.aiAnswers(code, { accuracy: 1, seed: 's', notes: { auth: 'api' }, drives: W.testDrives(tests, wrong, { covered: 'all', picks: {} }) }).answers;
  assert.strictEqual(ai2[fn('guardApi')].how, 1, '測試寫錯，AI 跟著錯');
});

test('預填的測試算選正解，一樣管得到開發', () => {
  const tests = sub(platform, 'test');
  const drives = W.testDrives(tests, [], { covered: 'all', picks: { doc_accept: [[3]] } });
  assert.deepStrictEqual(drives.guardApi, { how: 0 });
});

test('沒有驗收的卡，測試程式照卡片帶：卡上有「舊的那些也要對回來」就預填', () => {
  const dept = DAY2.make().sources.find(s => s.id === 'dept_select');
  const tests = sub(dept, 'test'), at = tests.functions.findIndex(f => f.name === 'testOldDeptMigrated');
  assert.ok(!W.functionsToFill(tests, [0, 1]).includes(at));
  assert.ok(W.functionsToFill(tests, [0]).includes(at));
});

test('引擎：交給 AI 開發那一刻卡上已經有測試，AI 照測試寫（只管開發）', () => {
  const { Engine } = require('../engine.js'); const { C } = require('../contract.js');
  const e = new Engine(DAY2.make()); e.tick(C.MS_PER_GAME_MIN * 31);
  const card = e.board.get('asset_platform'), tests = sub(card, 'test'), code = sub(card, 'code');
  const answers = []; answers[tests.functions.findIndex(f => f.name === 'testApiRejectsWrongRole')] = { assert: 0 };
  e.doWork(card.id, 'test', answers);
  assert.deepStrictEqual(e.testDrives(card, 'doc_spec'), {});
  const job = e.delegate(card.id, 'code'); e.tick(C.MS_PER_GAME_MIN * 30);
  assert.strictEqual(job.answers[code.functions.findIndex(f => f.name === 'guardApi')].how, 0, 'AI 主張前端擋，測試寫 403 就照測試');
});

test('看不到的選項（showIf）不算正解：AI 答對、退回時自動那句、照說法重做，都不會把它塞回去', () => {
  const q = sub(platform, 'doc_spec'), FIN = q.items[0].options.indexOf('財務的唯讀頁只看得到簽核同意的');
  const right = W.aiAnswers(q, { accuracy: 1, seed: 's', picks: {} }).answers[0];
  assert.ok(!right.includes(FIN)); assert.strictEqual(W.grade(q, [right], { picks: {} }).score, 1);
  const auto = W.aiSpots(q, [[0, 1, 2, 3, 6]], { picks: {} })[0].fixes.find(f => f.auto);
  assert.doesNotMatch(auto.say, /財務/, '自動那句不提還看不到的選項');
  const revised = W.reviseAnswers(q, [[0, 1, 2, 3, 6]], [{ key: 'i0', fix: auto }], { picks: {} });
  assert.strictEqual(W.grade(q, revised, { picks: {} }).score, 1);
  const asked = { discuss: { circled: [5], asks: { 5: [0] } } };
  assert.ok(W.aiSpots(q, [[0]], { picks: asked })[0].fixes.find(f => f.auto).pick.includes(FIN), '問到了就看得到');
});
