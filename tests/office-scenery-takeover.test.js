// tests/office-scenery-takeover.test.js（node --test）：speedrun 的批號追溯是建宏用 AI 做過的版本——卡上選接手或從頭規劃
const test = require('node:test');
const assert = require('node:assert');
const Works = require('../works.js');
const Screen = require('../screen.js');
const { C, XIONG, play, at, tickTo, right, skipMeeting, meetAll, doAll, shipped, lime } = require('./scenery-helpers.js');
const speed = () => skipMeeting(play('speedrun'));   // 預設池（批號追溯＋冷凍庫），不靠亂數
const works = (card) => card.subtasks.map(s => s.work);
const pickTakeover = () => { const e = speed(); e.doWork('trace', 'route', [0]); return e; };
const sub = (e, work) => e.board.get('trace').subtasks.find(s => s.work === work).question;
// 檢閱全部抓對的答案：要抓的區塊／行都標上正確原因
const marksOf = (q) => (q.kind === 'spot' ? q.spots.filter(s => !s.trap).map(s => ({ key: s.region, reason: s.reason })) : q.lines.filter(l => l.issue).map(l => ({ key: l.n, reason: l.issue })));
const frontMarks = (e, regions) => ({ marks: marksOf(sub(e, 'review_front')).filter(m => regions.includes(m.key)), lgtm: false, hintsUsed: 0 });

test('speedrun 的批號追溯：投影幕那頁多建宏的兩句；一開始卡上只有「接手或重來」', () => {
  const e = speed(); const t = e.board.get('trace');
  assert.ok(t);
  assert.ok(e.script.meetings[1].pages.find(p => p.id === 'trace').aside.some(l => l.text.includes('我有用 AI 做過一版')));
  assert.deepStrictEqual(works(t), ['route']);
});
test('選接手：卡上多檢閱程式碼前端、後端，排在開發計畫前面', () => {
  const e = speed(); e.doWork('trace', 'route', [0]);
  const w = works(e.board.get('trace'));
  assert.ok(w.includes('review_front') && w.includes('review_back') && w.includes('ui_design'));
  assert.ok(w.indexOf('review_back') < w.indexOf('doc_plan'));
  assert.strictEqual(w[0], 'route');
  assert.strictEqual(e.board.get('trace').route, 0);
});
test('選從頭規劃：照一般做，沒有檢閱；部署多一步資料轉換', () => {
  const e = speed(); e.doWork('trace', 'route', [1]);
  const t = e.board.get('trace');
  assert.ok(!works(t).includes('review_front'));
  assert.ok('migrate' in t.subtasks.find(s => s.work === 'deploy').question.roles);
});
test('選過就不能換；沒挑路不算做過', () => {
  const e = speed();
  assert.strictEqual(e.doWork('trace', 'route', [null]), null);
  assert.ok(!e.board.get('trace').done('route'));
  e.doWork('trace', 'route', [1]);
  assert.strictEqual(e.doWork('trace', 'route', [0]), null);
  assert.strictEqual(e.board.get('trace').route, 1);
  assert.ok(!works(e.board.get('trace')).includes('review_front'));
});
test('會議問的需求討論兩條路都帶著：選路之前就記成做過，問的跟會議上一樣', () => {
  for (const route of [0, 1]) {
    const e = meetAll(play('speedrun'));
    const asked = e.board.get('trace').picks.discuss;
    assert.ok(asked && asked.circled.length, '會議上問了批號追溯那段');
    e.doWork('trace', 'route', [route]);
    const t = e.board.get('trace');
    assert.ok(t.done('discuss'), `route ${route}`);
    assert.deepStrictEqual(t.picks.discuss, asked);
  }
});
test('接手或重來是自己的判斷：不能交給 AI，整張交給 Pedia 也不算它', () => {
  const e = speed();
  assert.strictEqual(e.delegable(e.board.get('trace'), 'route'), false);
  assert.deepStrictEqual(e.oneShotWorks(e.board.get('trace')), []);
});

// ── 接手：檢閱沒挑出來的設計和程式照建宏那版，看得到不能改 ──
test('接手、檢閱什麼都沒挑（LGTM）：全照建宏那版——部位是文字框 QC 退，批號跳紅字，程式只能往下查又要主管按確認', () => {
  const e = pickTakeover();
  const card = shipped(e, 'trace');   // right() 給檢閱的是 LGTM；開發照正解送，但鎖住的欄位一律存建宏那版
  assert.match(card.comments.at(-1).text, /肚仔/);
  const outs = e.cardOutcomes(card);
  assert.ok(outs.some(o => o.work === 'ui_design' && o.kind === 'annoy'));
  assert.deepStrictEqual(outs.filter(o => o.kind === 'stuck').map(o => o.fn).sort(), ['approveFlow', 'traceBack']);
  const fns = sub(e, 'code').functions;
  for (const name of ['traceBack', 'carryBatch', 'approveFlow']) assert.strictEqual(card.picks.code[fns.findIndex(f => f.name === name)].flow, 1, name);
});
test('接手、檢閱什麼都沒挑：前端設計四題照建宏那版計分，玩家選正解也是 0／4', () => {
  const e = pickTakeover(); doAll(e, 'trace');
  const r = e.board.get('trace').history.filter(h => h.work === 'ui_design').at(-1).result;
  assert.deepStrictEqual([r.score, r.max], [0, 4]);
});
test('QC 退回後重做檢閱前端、挑出部位：部位那題解開，改成勾選就沒有 miss', () => {
  const e = pickTakeover();
  shipped(e, 'trace');
  e.doWork('trace', 'review_front', frontMarks(e, ['部位']));
  e.doWork('trace', 'ui_design', right(sub(e, 'ui_design')));
  assert.ok(!e.cardOutcomes(e.board.get('trace')).some(o => o.kind === 'miss'));
});
test('接手、全部挑出來：前端設計、程式照玩家選的正解，沒有後果', () => {
  const e = pickTakeover();
  shipped(e, 'trace', { review_front: { marks: marksOf(sub(e, 'review_front')), lgtm: false, hintsUsed: 0 }, review_back: { marks: marksOf(sub(e, 'review_back')), lgtm: false, hintsUsed: 0 } });
  assert.deepStrictEqual(e.cardOutcomes(e.board.get('trace')), []);
});
test('程式的鎖：檢閱後端挑出那一行才解開；鎖著時 AI 也只寫建宏那版', () => {
  const e = pickTakeover(); const card = e.board.get('trace');
  const fn = (name) => sub(e, 'code').functions.find(f => f.name === name).fields.flow;
  assert.ok(e.fieldLocked(fn('traceBack'), card) && e.fieldLocked(fn('approveFlow'), card));
  const ai = (c) => Works.aiAnswers(sub(e, 'code'), { ...e.aiCtx(c), accuracy: 1, seed: 's' }).answers;
  const idx = (name) => sub(e, 'code').functions.findIndex(f => f.name === name);
  assert.strictEqual(ai(card)[idx('traceBack')].flow, 1);
  e.doWork('trace', 'review_back', { marks: marksOf(sub(e, 'review_back')).filter(m => m.key === 5), lgtm: false, hintsUsed: 0 });
  assert.ok(!e.fieldLocked(fn('traceBack'), card), '挑出 traceForward 那行：往回查解開');
  assert.ok(e.fieldLocked(fn('approveFlow'), card), '沒挑的照樣鎖著');
  assert.strictEqual(ai(card)[idx('traceBack')].flow, 0);
});
test('檢閱前端看的是建宏那版的表單：配方只記一種魚漿、部位是自由填', () => {
  const e = pickTakeover(); const card = e.board.get('trace'); const q = sub(e, 'review_front');
  const m = Screen.model({ ...card, history: [{ work: 'code', result: { toFill: [], bugs: [] } }], picks: { ...card.picks, ui_design: q.inherited } });
  assert.deepStrictEqual(m.fieldLooks['配方'], { look: 'right', text: '鯊魚漿' });
  assert.strictEqual(m.fieldLooks['部位'].look, 'junk');
  assert.strictEqual(m.fieldLooks['批號'].look, 'red');
  for (const s of q.spots) assert.ok(m.fields.includes(s.region), `${s.region} 在表單上點得到`);
});

// ── 從頭規劃：資料轉換轉不過去的一筆一筆對 ──
const rebuilt = () => { const e = speed(); e.doWork('trace', 'route', [1]); doAll(e, 'trace', { deploy: null }); return e; };
test('從頭規劃：部署的資料轉換印出轉不過去 37 筆，一筆一分鐘對回收購單', () => {
  const e = rebuilt(); const before = e.clock.minute;
  e.doWork('trace', 'deploy', [[0, 1, 2, 3, 4]]);
  const card = e.board.get('trace');
  assert.ok(card.terminal.some(l => l.text.includes('轉不過去 37 筆')));
  assert.ok(e.clock.minute - before >= 37);
  assert.strictEqual(e.stats.unmigrated, 37);
});
test('對過一次就好：再部署一次照樣轉，不用再對', () => {
  const e = rebuilt(); e.doWork('trace', 'deploy', [[0, 1, 2, 3, 4]]);
  const before = e.clock.minute;
  e.doWork('trace', 'deploy', [[0, 1, 2, 3, 4]]);
  assert.ok(e.clock.minute - before < 37);
  assert.strictEqual(e.stats.unmigrated, 37);
});
test('從頭規劃：部署結束那行印對完資料之後的時間', () => {
  const e = rebuilt();
  e.doWork('trace', 'deploy', [[0, 1, 2, 3, 4]]);
  assert.strictEqual(e.board.get('trace').terminal.at(-1).text, `# ${e.clock.label()} 部署結束`);
});
// AI 部署：轉不過去的資料它也一筆一筆對，只要人工（一筆一分鐘）的 1/6～1/3；玩家的時鐘不跳
const DEPLOY_NOTE = { deploy: { stance: 'skill', text: '部署：先備份，再上傳、替換，最後煙霧測試；通知等 QC 驗過，由人按。' } };
const aiRebuilt = (notes) => { const e = skipMeeting(play('speedrun', { pool: ['trace', 'stock'], notes })); e.doWork('trace', 'route', [1]); doAll(e, 'trace', { deploy: null }); return e; };
test('從頭規劃交給 AI 一步一步部署：轉資料那步之後多等它對 6～12 分鐘，終端機寫預計幾分鐘', () => {
  const e = aiRebuilt(); const job = e.delegate('trace', 'deploy', 'Essay');
  tickTo(e, job.doneAt + 1);
  let waited = null;
  while (job.status === 'asking') {
    const migrating = job.deploy.steps[job.deploy.at] === 'migrate', now = e.clock.minute;
    e.answerAi('trace', 'deploy', job.id, true);
    if (migrating) waited = job.doneAt - now - C.AI_ASK_GAP_MIN;
    tickTo(e, job.doneAt + 1);
  }
  assert.ok(waited >= 6 && waited <= 12, `等了 ${waited} 分鐘`);
  const card = e.board.get('trace');
  assert.ok(card.done('deploy'));
  assert.ok(card.terminal.some(l => /轉不過去的 37 筆一筆一筆對回去，預計 \d+ 分鐘/.test(l.text)));
  assert.ok(e.clock.minute - job.doneAt < 5, '收下 AI 部署時，玩家的時鐘不跳 37 分鐘');
  assert.strictEqual(e.stats.unmigrated, 37);
});
test('CLAIRE.md 有部署流程的 AI：轉完資料先停下來對，對完才接著冒煙測試', () => {
  const e = aiRebuilt(DEPLOY_NOTE); const job = e.delegate('trace', 'deploy', 'Essay');
  const first = job.doneAt; tickTo(e, first + 1);
  assert.deepStrictEqual(job.deploy.done, ['backup', 'upload', 'replace', 'migrate']);
  assert.strictEqual(job.status, 'running');
  assert.ok(job.doneAt - first >= 6 && job.doneAt - first <= 12, `等了 ${job.doneAt - first} 分鐘`);
  tickTo(e, job.doneAt + 1);
  assert.deepStrictEqual(job.deploy.done, ['backup', 'upload', 'replace', 'migrate', 'smoke']);
  assert.ok(e.board.get('trace').done('deploy'));
});
test('沒排資料轉換：沒有轉不過去的資料，也不花時間對', () => {
  const e = rebuilt(); const before = e.clock.minute;
  e.doWork('trace', 'deploy', [[0, 1, 2, 4]]);
  assert.ok(!e.board.get('trace').terminal.some(l => l.text.includes('轉不過去')));
  assert.ok(e.clock.minute - before < 37);
  assert.strictEqual(e.stats.unmigrated, undefined);
});

// ── 結算卡那一行、相罵本 ──
const extra = (e) => e.script.report(e).extra;
test('結算卡：接手改掉幾個紅字；打掉重練轉不過去幾筆；沒上線不記', () => {
  let e = pickTakeover();
  shipped(e, 'trace', { review_front: frontMarks(e, ['批號']) });   // 部位還是建宏那版的文字框（miss），QC 退
  assert.notStrictEqual(e.board.get('trace').status, 'archived');
  assert.ok(!extra(e).some(l => l.startsWith('建宏的版本')));
  e = pickTakeover();
  shipped(e, 'trace', { review_front: frontMarks(e, ['批號', '部位']) });   // 部位是 miss 不是紅字，紅字只改掉批號那 1 個
  assert.strictEqual(e.board.get('trace').status, 'archived');
  assert.ok(extra(e).includes('建宏的版本：接手，改掉 1 個紅字'));
  e = speed(); e.doWork('trace', 'route', [1]); shipped(e, 'trace');
  assert.ok(extra(e).includes('建宏的版本：打掉重練，轉不過去的資料 37 筆'));
});
test('接手後自己把批號又做成跳紅字：那個不算改掉', () => {
  const e = pickTakeover();
  const ui = right(sub(e, 'ui_design')); ui[0] = 1;   // 檢閱挑出批號，前端設計卻還是選讓人自己打
  shipped(e, 'trace', { review_front: frontMarks(e, ['批號', '部位']), ui_design: ui });
  assert.ok(extra(e).includes('建宏的版本：接手，改掉 0 個紅字'));
});
test('相罵本挑到接手的批號追溯、配方沒挑出來：雄哥說「你們不是來收尾的嗎？」', () => {
  const e = pickTakeover();
  // 只挑出部位（不然部位照建宏那版是文字框，QC 會退、上不了線）；配方照建宏那版只記主原料
  shipped(e, 'trace', { review_front: frontMarks(e, ['部位']) });
  assert.strictEqual(e.board.get('trace').status, 'archived');
  tickTo(e, at(22, 31));
  assert.deepStrictEqual(e.stats.quarrel, { cardId: 'trace', logged: false });
  assert.ok(lime(e, XIONG).includes('魚丸怪味是哪一批？你們不是來收尾的嗎？'));
});
test('相罵本挑到接手的批號追溯、配方挑出來也改成各記批號：一查收工', () => {
  const e = pickTakeover();
  shipped(e, 'trace', { review_front: frontMarks(e, ['部位', '配方']) });
  tickTo(e, at(22, 31));
  assert.deepStrictEqual(e.stats.quarrel, { cardId: 'trace', logged: true });
});
test('從頭規劃的批號追溯沒記錄時，雄哥說的是一般那句', () => {
  const e = speed(); e.doWork('trace', 'route', [1]);
  const ui = right(sub(e, 'ui_design')); ui[2] = 1;
  shipped(e, 'trace', { ui_design: ui });
  tickTo(e, at(22, 31));
  assert.ok(lime(e, XIONG).includes('魚丸怪味是哪一批？你們系統沒記，這筆到底算誰的？'));
});
test('legacy、hybrid 的批號追溯照一般做', () => {
  for (const mode of ['legacy', 'hybrid']) {
    const e = skipMeeting(play(mode));   // 預設池是批號追溯＋冷凍庫
    assert.ok(!works(e.board.get('trace')).includes('route'), mode);
    assert.ok(!e.script.meetings[1].pages.find(p => p.id === 'trace').aside, mode);
  }
});
