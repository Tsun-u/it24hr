// tests/ai.test.js（node --test）：交給 AI、額度、請 AI 改、AI 筆記
const test = require('node:test'); const assert = require('node:assert');
const { C } = require('../contract.js');
const { Engine } = require('../engine.js');
const Works = require('../works.js');
const day1 = require('../day1.js');

const estimate = { work: 'estimate', question: { items: [{ type: 'hours', free: true, text: '估', ai: { pick: 2 } }] } };
const code = { work: 'code', question: { kind: 'functions', functions: [
  { name: 'listMine', fields: { rows: { label: '篩', options: ['只看自己的', '全部'], answer: 0, ai: { pick: 1, kind: 'miss' } } } },
  { name: 'guardApi', judgment: true, claim: '前端藏按鈕就好', fields: { how: { label: '權限', options: ['後端也擋', '前端藏按鈕'], answer: 0, ai: { pick: 1 } } } },
] } };
const discuss = { work: 'discuss', question: { kind: 'discuss', segments: ['a', 'b'], asks: { 1: { text: '?', options: ['好問題', '好。'], answer: 0 } } } };
const script = (quota = 2) => ({ mode: 'hybrid', ai: { quota, turnaround: [10, 10] },
  cards: [{ at: 0, id: 'k', title: '平台', from: 'SA 怡君', assignee: '玩家', subtasks: [estimate, code, discuss] }] });
const start = (quota) => { const e = new Engine(script(quota)); e.tick(C.MS_PER_GAME_MIN); return e; };

test('AI 的答案照種子固定；judgment 一律填它自己的主張；正確率 1 時其他都對、0 時都照劇本寫的錯法', () => {
  const a = Works.aiAnswers(code.question, { accuracy: 0.5, seed: 's' }), b = Works.aiAnswers(code.question, { accuracy: 0.5, seed: 's' });
  assert.deepStrictEqual(a, b);
  const right = Works.aiAnswers(code.question, { accuracy: 1, seed: 's' });
  assert.deepStrictEqual(right.answers, [{ rows: 0 }, { how: 1 }]); assert.deepStrictEqual(right.errors, ['claim']);
  const wrong = Works.aiAnswers(code.question, { accuracy: 0, seed: 's' });
  assert.deepStrictEqual(wrong.answers, [{ rows: 1 }, { how: 1 }]); assert.deepStrictEqual(wrong.errors.sort(), ['claim', 'miss']);
  const est = Works.aiAnswers(estimate.question, { accuracy: 1, seed: 's' });
  assert.deepStrictEqual([est.answers, est.errors], [[2], []], '估時沒有對錯：AI 照它樂觀的估，不算錯');
  assert.deepStrictEqual(Works.aiSpots(estimate.question, [2]), [], '沒有對錯的題沒得圈');
  // 需求討論它全圈，每題照正確率骰，骰錯才很有禮貌地答應
  assert.deepStrictEqual(Works.aiAnswers(discuss.question, { accuracy: 1, seed: 's' }).answers, { circled: [1], asks: { 1: [0] } });
  const polite = Works.aiAnswers(discuss.question, { accuracy: 0, seed: 's' });
  assert.deepStrictEqual(polite.answers, { circled: [1], asks: { 1: [1] } }); assert.deepStrictEqual(polite.errors, ['miss']);
  assert.strictEqual(Works.aiAnswers({ kind: 'manual' }, { accuracy: 1, seed: 's' }), null);
});

test('交給 AI：扣額度、時間到才交件（只有事件，不進卡），額度用完不能再交，14:00 重置', () => {
  const e = start(2); const ready = [];
  e.on('ai:ready', (x) => ready.push(x.work));
  assert.ok(e.delegate('k', 'estimate')); assert.strictEqual(e.ai.left, 1);
  assert.strictEqual(e.board.get('k').ai.estimate[0].status, 'running');
  e.tick(C.MS_PER_GAME_MIN * 9); assert.deepStrictEqual(ready, []);
  e.tick(C.MS_PER_GAME_MIN * 2); assert.deepStrictEqual(ready, ['estimate']);
  assert.strictEqual(e.board.get('k').ai.estimate[0].status, 'ready'); assert.strictEqual(e.board.get('k').done('estimate'), false);
  assert.ok(e.delegate('k', 'code')); assert.strictEqual(e.ai.left, 0);
  assert.strictEqual(e.delegate('k', 'discuss'), null, '額度用完');
  e.tick(C.MS_PER_GAME_MIN * (14 * 60 - e.clock.minute)); assert.strictEqual(e.ai.left, 2);
  assert.strictEqual(new Engine(day1).delegate('asset_crud', 'estimate'), null, 'legacy 沒有 AI 同事');
});

test('叫 AI 跑好幾次：每次一份、各扣額度、可以同時跑；交件後每份都留著，挑哪份蓋到卡上都行', () => {
  const e = start(4); const card = e.board.get('k');
  const a = e.delegate('k', 'estimate'), b = e.delegate('k', 'estimate');   // 第一份還在跑就叫第二份（玩家要浪費額度也沒差）
  assert.strictEqual(a.attempt, 1); assert.strictEqual(b.attempt, 2); assert.strictEqual(e.ai.left, 2);
  e.tick(C.MS_PER_GAME_MIN * 11);
  assert.deepStrictEqual(card.ai.estimate.map(j => j.status), ['ready', 'ready']);
  e.acceptAi('k', 'estimate', a.id); assert.deepStrictEqual(card.picks.estimate, a.answers);
  assert.strictEqual(b.status, 'ready', '收下第一份，第二份還在');
  e.acceptAi('k', 'estimate', b.id); assert.deepStrictEqual(card.picks.estimate, b.answers);
  const c = e.delegate('k', 'estimate'); assert.strictEqual(c.attempt, 3, '交件後再交一次也可以');
});

test('直接交：AI 填錯的照樣進卡、記成沒看過；看一下再送出記成有看', () => {
  const e = start(3);
  e.delegate('k', 'code'); e.tick(C.MS_PER_GAME_MIN * 11);
  const r = e.acceptAi('k', 'code');
  assert.ok(r.bugs.some(b => b.fn === 'guardApi'), '主張照收就是 bug');
  const h = e.board.get('k').history.at(-1); assert.strictEqual(h.by, 'ai'); assert.strictEqual(h.reviewed, false);
  assert.strictEqual(e.board.get('k').ai.code[0].status, 'taken'); assert.strictEqual(e.ai.stats.unreviewed, 1);
  e.delegate('k', 'estimate'); e.tick(C.MS_PER_GAME_MIN * 11);
  e.doWork('k', 'estimate', [1], { by: 'ai', reviewed: true });
  assert.strictEqual(e.board.get('k').history.at(-1).reviewed, true); assert.strictEqual(e.ai.stats.reviewed, 1);
});

test('自己做和 AI 做不衝突：AI 在跑時可以手寫；交件後從終端機蓋過手寫，或回卡上再蓋過 AI 的', () => {
  const e = start(3); const card = e.board.get('k');
  e.delegate('k', 'estimate');
  e.doWork('k', 'estimate', [1]);   // AI 還在跑，自己先寫一份
  e.tick(C.MS_PER_GAME_MIN * 11);
  const job = card.ai.estimate[0]; assert.strictEqual(job.status, 'ready', '手寫不會把 AI 那份丟掉');
  e.doWork('k', 'estimate', [1]); assert.strictEqual(job.status, 'ready', '交件後再手寫一次，AI 那份還在終端機等');
  e.acceptAi('k', 'estimate');      // 從終端機蓋過卡上的手寫
  assert.deepStrictEqual(card.picks.estimate, job.answers); assert.strictEqual(card.history.at(-1).by, 'ai'); assert.strictEqual(job.status, 'taken');
  e.doWork('k', 'estimate', [1]);   // 回卡上手寫，蓋過 AI 的
  assert.deepStrictEqual(card.picks.estimate, [1]); assert.strictEqual(card.history.at(-1).by, 'self');
});

test('AI 的主張三種反應：請小潘＝等 LIME、自己驗＝花時間、憑經驗＝不花時間；同一個主張只判斷一次', () => {
  code.question.functions[1].evidence = { ask: '直接打 API 就繞過了。', test: '你用 curl 打 /api/approve，沒登入也成功了。', testMin: 30 };
  const e = start(); const t0 = e.clock.minute;
  assert.strictEqual(e.checkClaim('k', 'listMine', 'gut'), null, '不是主張的 function 不用判斷');
  assert.strictEqual(e.checkClaim('k', 'guardApi', 'ask').note, null);
  assert.strictEqual(e.checkClaim('k', 'guardApi', 'test'), null, '判斷過了');
  e.tick(C.MS_PER_GAME_MIN * 21);
  const msg = e.docs.find(d => d.id === 'k:claim:guardApi'); assert.match(msg.text, /繞過/); assert.strictEqual(msg.from, '同事 小潘');
  const e2 = start(); const before = e2.clock.minute;
  assert.match(e2.checkClaim('k', 'guardApi', 'test').note, /curl/); assert.strictEqual(e2.clock.minute - before, 30);
  const e3 = start(); const b3 = e3.clock.minute; e3.checkClaim('k', 'guardApi', 'gut'); assert.strictEqual(e3.clock.minute, b3);
  assert.strictEqual(e3.board.get('k').claims.guardApi.how, 'gut'); assert.ok(t0 >= 0);
});

test('轉給 SA 的需求在 hybrid 帶它自己的 AI 痕跡；沒寫才用通用那句', () => {
  const Sources = require('../sources.js');
  const doc = { title: '亂碼', origin: 'mail', sentences: [{ text: '匯出的 Excel 打開是亂碼', keep: true }], aiTrace: { text: '和 AI 討論的結果：亂碼是因為檔名有中文，他建議檔名改英文。', claim: 'rename' } };
  const sa = Sources.saCard(doc, 'hybrid');
  assert.match(sa.lines.at(-1), /檔名改英文/); assert.strictEqual(sa.sentences.at(-1).judgment, true); assert.strictEqual(sa.sentences.at(-1).keep, false);
  assert.match(Sources.saCard({ ...doc, aiTrace: undefined }, 'hybrid').lines.at(-1), /檢查放在後端/);
});

// ── 退回＝請 AI 改、AI 筆記──
const TOPICS = { auth: { skip: '以後權限我不碰，交給人類', api: '權限檢查一律做在後端 API', axian: 'API 只放行阿賢的帳號' } };
const AUTH_TAGS = { 0: 'auth:api', 1: 'auth:front', 2: 'auth:axian' };
const guardQ = { kind: 'functions', functions: [{ name: 'guardApi', judgment: true, claim: '前端藏按鈕就好', fields: { how: { label: '權限放哪',
  options: ['後端 API', '前端藏按鈕', 'API 只放行阿賢'], answer: 0, ai: { pick: 1 }, tags: AUTH_TAGS,
  fixes: [{ say: '你權限根本亂做', set: { auth: 'skip' } }, { say: '權限檢查最好做在後端', set: { auth: 'api' } }, { say: 'API 應該要檢查是不是阿賢', set: { auth: 'axian' } }] } } }] };
const specQ = { items: [{ text: '內容', options: ['角色表', '權限靠前端', '權限在 API'], answer: [0, 2], ai: { pick: [0, 1] }, tags: { 1: 'auth:front', 2: 'auth:api' } }] };
const noteScript = (quota = 6) => ({ mode: 'hybrid', ai: { quota, turnaround: [10, 10], accuracy: 0, topics: TOPICS },
  cards: [{ at: 0, id: 'p', title: '平台', from: 'SA 怡君', assignee: '玩家', subtasks: [{ work: 'code', question: guardQ }, { work: 'doc_spec', question: specQ }] }] });
const noteStart = (quota) => { const e = new Engine(noteScript(quota)); e.tick(C.MS_PER_GAME_MIN); return e; };
const after = (e) => e.tick(C.MS_PER_GAME_MIN * 11);

test('請 AI 改：圈題目講要改什麼——扣額度、開新一份；講的話變成 AI 口吻的筆記；它只改你講的', () => {
  const e = noteStart(); const card = e.board.get('p');
  const first = e.delegate('p', 'code'); after(e);
  assert.deepStrictEqual(first.answers, [{ how: 1 }], '照它的主張');
  const r = e.reviseAi('p', 'code', first.id, first.answers, [{ key: 'f0.how', fix: 0 }]);   // 「你權限根本亂做」
  assert.strictEqual(first.status, 'rejected'); assert.strictEqual(r.job.attempt, 2); assert.strictEqual(e.ai.left, 4);
  assert.deepStrictEqual(e.aiNotes(), [{ topic: 'auth', stance: 'skip', text: '以後權限我不碰，交給人類' }]);
  after(e);
  assert.deepStrictEqual(card.ai.code[1].answers, [{ how: undefined }], '不碰就留白擺爛');
  assert.strictEqual(e.ai.stats.revised, 1);
});

test('筆記之後一直有效：同主題的別份工作照筆記做；說錯它也照做；刪掉筆記就回到原本的樣子', () => {
  const e = noteStart();
  const first = e.delegate('p', 'code'); after(e);
  e.reviseAi('p', 'code', first.id, first.answers, [{ key: 'f0.how', fix: 2 }]); after(e);   // 「API 應該要檢查是不是阿賢」
  assert.deepStrictEqual(e.board.get('p').ai.code[1].answers, [{ how: 2 }], '照做了，但太窄');
  const spec = e.delegate('p', 'doc_spec'); after(e);
  assert.deepStrictEqual(spec.answers, [[0]], '規格裡沒有「只放行阿賢」，權限那兩項它都拿掉了——錯一路');
  e.deleteNote('auth'); assert.deepStrictEqual(e.aiNotes(), []);
  const again = e.delegate('p', 'doc_spec'); after(e);
  assert.deepStrictEqual(again.answers, [[0, 1]], '沒筆記就照它原本的錯法');
});

test('只圈不說：AI 照原本的正確率重做那題，不寫筆記；額度用完就改不了', () => {
  const e = noteStart(3);
  const first = e.delegate('p', 'doc_spec'); after(e);
  const r = e.reviseAi('p', 'doc_spec', first.id, first.answers, [{ key: 'i0', fix: null }]); after(e);
  assert.deepStrictEqual(r.job.answers, [[0, 1]], '正確率 0：重做還是錯'); assert.deepStrictEqual(e.aiNotes(), []);
  const auto = e.reviseAi('p', 'doc_spec', r.job.id, r.job.answers, [{ key: 'i0', fix: 0 }]); after(e);   // 沒寫補充說明的題目自動給「應該是：正解」
  assert.deepStrictEqual(auto.job.answers, [[0, 2]]);
  assert.deepStrictEqual(e.aiNotes(), [{ topic: 'auth', stance: 'api', text: '權限檢查一律做在後端 API' }]);
  assert.strictEqual(e.ai.left, 0);
  assert.strictEqual(e.reviseAi('p', 'doc_spec', auto.job.id, auto.job.answers, [{ key: 'i0', fix: 0 }]), null, '額度用完');
});

test('矯枉過正的筆記（ask）：交件前停在終端機一題一題問，回答一題再做 5 分鐘問下一題，問完才交', () => {
  const uiQ = { items: [{ text: '元件', options: ['登入框', '搜尋列', '聊天機器人'], answer: [0, 1], ai: { pick: [0, 2] },
    tags: { 1: 'scope:spec', 2: ['chatbot:yes', 'scope:all'] }, askFirst: { 1: '需不需要加搜尋列？', 2: '要不要加聊天機器人？' } }] };
  const script = noteScript(); script.ai.topics = { scope: { ask: '我擅自多做了。以後人類沒明講的，一律先問過再做' } };
  script.cards[0].subtasks.push({ work: 'ui_design', question: uiQ });
  const e = new Engine(script); e.tick(C.MS_PER_GAME_MIN);
  e.ai.notes.scope = { stance: 'ask', text: '我擅自多做了。以後人類沒明講的，一律先問過再做' };
  const asked = []; e.on('ai:asking', ({ job }) => asked.push(job.asks[job.asked].text));
  const ready = []; e.on('ai:ready', () => ready.push(true));
  const job = e.delegate('p', 'ui_design'); after(e);
  assert.strictEqual(job.status, 'asking'); assert.deepStrictEqual(asked, ['需不需要加搜尋列？']);
  assert.strictEqual(e.aiRun(e.board.get('p'), 'ui_design', job.id), null, '還沒交件');
  e.answerAi('p', 'ui_design', job.id, true);
  assert.strictEqual(job.status, 'running');
  e.tick(C.MS_PER_GAME_MIN * 5);
  assert.deepStrictEqual(asked, ['需不需要加搜尋列？', '要不要加聊天機器人？']);
  e.answerAi('p', 'ui_design', job.id, false); e.tick(C.MS_PER_GAME_MIN * 5);
  assert.strictEqual(job.status, 'ready'); assert.strictEqual(ready.length, 1);
  assert.deepStrictEqual(job.answers, [[0, 1]], '照人類的回答改');
  assert.strictEqual(e.ai.stats.asked, 2);
  assert.ok(e.aiTally().includes('AI 停下來問你：2 次'));
});

test('筆記跟著存檔帶到隔天：第二天劇本收 carry.notes', () => {
  const DAY2 = require('../day2.js');
  const e = new Engine(DAY2.make({ picks: {}, lastNo: 121, notes: { auth: { stance: 'api', text: '權限檢查一律做在後端 API' } } }));
  assert.deepStrictEqual(e.aiNotes(), [{ topic: 'auth', stance: 'api', text: '權限檢查一律做在後端 API' }]);
});
