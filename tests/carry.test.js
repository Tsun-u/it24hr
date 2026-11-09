// tests/carry.test.js（node --test）：前一天沒結案的卡帶到隔天——還原、早上補驗、估時跨夜、結算只算今天
const test = require('node:test'); const assert = require('node:assert');
const { C } = require('../contract.js');
const { Engine } = require('../engine.js');
const Verdict = require('../verdict.js');
const DAY1 = require('../day1.js');

const min = (n) => C.MS_PER_GAME_MIN * n;
const CODE_Q = { kind: 'functions', functions: [
  { spec: 0, name: 'a', fields: { x: { options: ['p', 'q'], answer: 0 } } },
  { spec: 1, device: true, name: 'b', fields: { x: { options: ['p', 'q'], answer: 0 } } },
  { spec: 2, name: 'c', fields: { x: { options: ['p', 'q'], answer: 0 } } },
] };
const DEPLOY_Q = { items: [{ text: 'd', type: 'order', options: ['x', 'y'], answer: [0, 1] }] };
const ESTIMATE = { work: 'estimate', question: { items: [{ type: 'hours', free: true, text: '估' }] } };
const script = () => ({
  mainCard: null, closeAt: 21 * 60, issueBase: 120,
  cards: [{ at: 0, id: 'a', title: 'A', assignee: '玩家', subtasks: [ESTIMATE, { work: 'code', question: CODE_Q }, { work: 'deploy', question: DEPLOY_Q }] }],
  hints: [], meetings: [], badEnd: [],
});
const CLEAN = [{ x: 0 }, { x: 0 }, { x: 0 }];
// 第一天：tick 到 at 分鐘（從 09:00 起算）
const day1 = (at = 1) => { const e = new Engine(script()); e.tick(min(at)); return e; };
const nextDay = (e) => new Engine({ ...script(), cards: [], issueBase: 100 }, undefined, { carried: e.carryOver() });

test('時間往前推一天：卡片紀錄寫「昨天」；看板號碼接著帶來的卡', () => {
  assert.strictEqual(Verdict.hhmm(-60), '昨天 23:00');
  assert.strictEqual(Verdict.hhmm(-2000), '2 天前 14:40');
  assert.strictEqual(Verdict.hhmm(1607), '02:47', '凌晨（隔天座標）照舊');
  const e = day1(); e.doWork('a', 'estimate', [3]);
  const e2 = nextDay(e); const card = e2.board.get('a');
  assert.strictEqual(card.arrivedAt, 540 - 1440);
  assert.strictEqual(card.history[0].at, 541 - 1440);
  assert.strictEqual(card.status, 'open');
  assert.ok(e2.board.canOperate(card), '還在玩家手上，照常可以做');
  assert.strictEqual(e2.board.nextNo, 122, '昨天開到 #121，今天接著');
});

test('已完成的卡不帶；第一天 20:45 交 QC → 隔天一進公司就有結果', () => {
  const done = day1(); done.doWork('a', 'code', CLEAN); done.doWork('a', 'deploy', [[0, 1]]); done.submit('a'); done.tick(min(C.QC_TURNAROUND_MIN + 1));
  assert.strictEqual(done.board.get('a').status, 'archived');
  assert.deepStrictEqual(done.carryOver().cards, []);

  const e = day1(); e.doWork('a', 'code', CLEAN); e.doWork('a', 'deploy', [[0, 1]]);
  e.tick(min(11 * 60 + 44)); e.submit('a'); e.tick(min(15));   // 20:45 交，21:00 被趕走，阿姿還沒驗
  assert.strictEqual(e.board.get('a').status, 'to_qc'); assert.ok(e.ended);
  const e2 = nextDay(e); const card = e2.board.get('a');
  assert.strictEqual(card.status, 'to_qc');
  e2.tick(min(1));
  assert.strictEqual(card.status, 'archived');
});

test('在家 07:45 交的從 09:00 開始算（09:30 才有結果）；沒部署就交的，早上第一句就是沒部署', () => {
  const e = day1(); e.doWork('a', 'code', CLEAN); e.doWork('a', 'deploy', [[0, 1]]);
  e.board.get('a').submit(31 * 60 + 45);   // 在家交：引擎不排 QC
  const e2 = nextDay(e); const card = e2.board.get('a');
  e2.tick(min(C.QC_TURNAROUND_MIN - 1)); assert.strictEqual(card.status, 'to_qc', '09:29 還沒');
  e2.tick(min(2)); assert.strictEqual(card.status, 'archived');

  const lazy = day1(); lazy.doWork('a', 'code', CLEAN); lazy.board.get('a').submit(23 * 60);
  const e3 = nextDay(lazy); const c3 = e3.board.get('a');
  e3.tick(min(1));
  assert.strictEqual(c3.status, 'returned'); assert.match(c3.comments.at(-1).text, /還沒上測試機/);
});

test('估時的實際：第一筆紀錄到最後一次交 QC，跨夜也算；昨天的分數不進今天的結算卡', () => {
  const e = day1(); e.doWork('a', 'estimate', [3]); e.doWork('a', 'code', [{ x: 1 }, { x: 0 }, { x: 0 }]);
  const e2 = nextDay(e); e2.tick(min(1));
  e2.doWork('a', 'code', CLEAN); e2.doWork('a', 'deploy', [[0, 1]]); e2.submit('a'); e2.tick(min(C.QC_TURNAROUND_MIN + 1));
  const card = e2.board.get('a'); assert.strictEqual(card.status, 'archived');
  const r = e2.leave();
  assert.strictEqual(r.estimates[0].actual, Verdict.duration(24 * 60), '昨天 09:01 到今天 09:01 交 QC');
  assert.ok(r.lines.includes('後端程式：3／3'), '今天重寫的那次');
  assert.ok(!r.lines.some(l => l.startsWith('估時：')), '估時是昨天做的，不再列一次');
});

test('換天收尾：怡君手上的卡算她做完了；AI 沒做完的作廢，部署做到一半的照中斷處理', () => {
  const e = new Engine(DAY1); e.tick(min(100)); e.talkTo('boss'); e.openCardFrom('boss', { assignee: 'sa' });
  const pending = e.board.cards.find(c => c.pending);
  const card = e.board.get('asset_crud');
  card.ai = { code: [{ id: 1, status: 'running' }, { id: 2, status: 'taken' }], deploy: [{ id: 1, status: 'asking', deploy: { done: ['backup'], ctx: { ran: new Set(['backup']) } } }] };
  const { cards } = e.carryOver();
  const sa = cards.find(c => c.id === pending.id);
  assert.strictEqual(sa.pending, false); assert.strictEqual(sa.assignee, e.player.name);
  const main = cards.find(c => c.id === 'asset_crud');
  assert.deepStrictEqual(main.ai.code.map(j => j.status), ['expired', 'taken']);
  assert.strictEqual(main.ai.deploy[0].status, 'expired'); assert.strictEqual(main.ai.deploy[0].deploy, undefined);
  assert.deepStrictEqual(main.aiDeployed, ['backup']);
});

test('下班前退回 SA、怡君還沒處理的：隔天一早丟回來', () => {
  const e = day1(); e.tick(min(11 * 60 + 49));   // 20:50 退，20 分鐘後已經 21:00 下班
  e.rejectToSA('a'); e.tick(min(10));
  assert.ok(e.ended); assert.strictEqual(e.board.get('a').status, 'rejected_to_sa');
  const e2 = nextDay(e); const card = e2.board.get('a');
  e2.tick(min(1));
  assert.strictEqual(card.status, 'new'); assert.match(card.comments.at(-1).text, /需求很清楚/);
});

test('怡君 19:30 下班、群組說一聲：之前退的照常回來，之後才到期的留到隔天早上', () => {
  const at = (e, clock) => e.tick(min(clock - e.clock.minute));
  const early = day1(); at(early, C.SA_LEAVE_MIN - C.SA_BOUNCE_MIN - 1);
  early.rejectToSA('a'); early.tick(min(C.SA_BOUNCE_MIN));
  assert.strictEqual(early.board.get('a').status, 'new', '19:29 前丟回來');
  const late = day1(); at(late, C.SA_LEAVE_MIN - 10);
  late.rejectToSA('a'); late.tick(min(C.SA_BOUNCE_MIN + 5));
  assert.strictEqual(late.board.get('a').status, 'rejected_to_sa', '她 19:30 走了');
  assert.ok(late.docs.some(d => d.id === 'sa_leave' && d.group === '精銳三人產線' && d.from === 'SA 怡君'));
});

test('同一份 carried 給兩次（BAD END 重來那天）：時間不會被推兩次', () => {
  const e = day1(); e.doWork('a', 'estimate', [3]); const carried = e.carryOver();
  const s = { ...script(), cards: [] };
  new Engine(s, undefined, { carried });
  const again = new Engine(s, undefined, { carried });
  assert.strictEqual(again.board.get('a').arrivedAt, 540 - 1440);
});
