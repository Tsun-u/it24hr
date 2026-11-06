// tests/office-scenery-meeting.test.js（node --test）：廠商需求會議——客戶一段講一個模組、怡君問要不要問時時鐘停、
// 按提問才算時間、換段才往下講，最後怡君問時程，回答完散會、怡君開卡、卡上的需求討論唯讀
const test = require('node:test');
const assert = require('node:assert');
const { C } = require('../contract.js');
const { Engine } = require('../engine.js');
const Works = require('../works.js');

const Q = { kind: 'discuss', segments: ['價錢喔，就時價啊。', '進來就秤。'],
  asks: { 0: { text: '秀琴姐：「就看當天行情啊。」', options: ['「看哪裡的行情？」', '「好。」'], answer: 0, replies: ['「漁業署的中價。」', '「讚。」'] } } };
const Q2 = { kind: 'discuss', segments: ['看師傅。'], asks: {} };
const CARD = { id: 'buy', title: '收購計價', from: 'SA 怡君', assignee: '玩家', requester: '秀琴姐',
  subtasks: [{ work: 'discuss', question: { ...Q, fromMeeting: 'buy' } }, { work: 'estimate', question: { items: [{ type: 'hours', free: true, text: '你估：' }] } }] };
const ERP = { id: 'erp', title: '源裕水產 ERP', from: 'SA 怡君', assignee: '玩家', requester: '建宏', noQC: true,
  subtasks: [{ work: 'estimate', question: { items: [{ type: 'hours', free: true, text: '整套 ERP，你估：', real: { manual: '6 個月～1.5 年', ai: '4～8 個月', note: '約 3 個月在釐清需求' } }] } }] };
const PROMPT = { who: 'SA 怡君', text: '記下來了，IT 有細節想問嗎？' };
const MEETING = { kind: 'vendor', at: 30, handover: 10, title: '09:30 廠商需求會議',
  intro: [PROMPT], prompt: PROMPT,
  pages: [{ id: 'buy', title: '收購計價', who: '秀琴姐', question: Q }, { id: 'yield', title: '加工估量', who: '建宏', question: Q2 }],
  schedule: { card: 'erp', who: 'SA 怡君', text: '最後一個，IT 這邊時程大概抓多久？' }, cards: [CARD, ERP] };
const play = (meeting = MEETING) => new Engine({ name: '測試', issueBase: 399, cards: [], sources: [], meetings: [meeting] }, { name: '測試', title: '工程師' });
const tickTo = (e, m) => { while (e.clock.minute < m && !e.ended) e.tick(C.MS_PER_GAME_MIN); };
const at = (h, m) => h * 60 + m;
const ASKED = { circled: [0], asks: { 0: [0] } };
// 模組都講完、停在時程那段
const toSchedule = (e) => { while (e.vendorStep().page) e.vendorNext(); return e.vendorStep(); };

test('09:30 開會：客戶從第一段講起，講完那段問、換段才講下一段；模組講完是怡君問時程，再換段就散會；換段不另外算時間', () => {
  const e = play(); tickTo(e, at(9, 31));
  assert.strictEqual(e.meeting.spec.kind, 'vendor');
  assert.deepStrictEqual(e.vendorStep(), { page: MEETING.pages[0], index: 0, total: 2 });
  assert.deepStrictEqual(e.vendorAsk('buy', ASKED), ASKED);
  const t = e.clock.minute;
  assert.strictEqual(e.vendorNext().page.id, 'yield');
  assert.ok(e.vendorNext().schedule, '模組講完是時程');
  assert.strictEqual(e.vendorNext(), null);
  assert.strictEqual(e.meeting, null);
  assert.strictEqual(e.clock.minute, t);
});
test('怡君問要不要問時鐘停；按提問才開始走，問多久算多久，問完又停；沒問就換段，時間一分都不動', () => {
  const e = play(); tickTo(e, at(9, 31)); e.vendorWindow(true);
  const t = e.clock.minute;
  e.tick(C.MS_PER_GAME_MIN * 5); assert.strictEqual(e.clock.minute, t, '等著回答怡君');
  assert.ok(e.vendorStartAsk());
  e.tick(C.MS_PER_GAME_MIN * 7); assert.strictEqual(e.clock.minute, t + 7, '問了 7 分鐘');
  e.vendorAsk('buy', ASKED);
  e.tick(C.MS_PER_GAME_MIN * 5); assert.strictEqual(e.clock.minute, t + 7, '問完了，看回答不算');
  e.vendorNext(); e.tick(C.MS_PER_GAME_MIN * 5);
  assert.strictEqual(e.clock.minute, t + 7, '下一段怡君又在等');
  e.vendorNext(); assert.ok(e.vendorStep().schedule);
  assert.strictEqual(e.vendorStartAsk(), false, '時程那段是回答怡君，不是提問');
});
test('問到一半把提問視窗收起來：時鐘照走；再打開從怡君問要不要問開始，時鐘又停', () => {
  const e = play(); tickTo(e, at(9, 31)); e.vendorWindow(true); e.vendorStartAsk();
  e.vendorWindow(false); const t = e.clock.minute;
  e.tick(C.MS_PER_GAME_MIN * 3); assert.strictEqual(e.clock.minute, t + 3);
  e.vendorWindow(true); assert.strictEqual(e.meeting.asking, false);
  e.tick(C.MS_PER_GAME_MIN * 3); assert.strictEqual(e.clock.minute, t + 3);
});
test('只問得到正在講的那段：講過的、還沒講的都不收；時程要講到那段才回答得了', () => {
  const e = play(); tickTo(e, at(9, 31));
  assert.strictEqual(e.vendorAsk('yield', { circled: [0], asks: {} }), null, '還沒講到');
  assert.strictEqual(e.vendorEstimate(1200), null, '還沒講到時程');
  e.vendorNext();
  assert.strictEqual(e.vendorAsk('buy', ASKED), null, '已經講過了');
});
test('散會 10 分鐘後怡君開卡：問到的帶進卡上的需求討論，記成會議上問的，卡還是新需求', () => {
  const e = play(); tickTo(e, at(9, 31)); e.vendorAsk('buy', ASKED);
  while (e.vendorNext());
  tickTo(e, e.clock.minute + 9); assert.ok(!e.board.get('buy'));
  tickTo(e, e.clock.minute + 2);
  const card = e.board.get('buy');
  assert.strictEqual(card.no, 400);
  assert.ok(card.done('discuss')); assert.deepStrictEqual(card.picks.discuss, ASKED);
  assert.strictEqual(card.history.find(h => h.work === 'discuss').by, 'meeting');
  assert.strictEqual(card.status, 'new', '怡君剛開的卡還沒動過');
});
test('卡上的需求討論是唯讀的：不能重做、不能交給 AI', () => {
  const e = play(); tickTo(e, at(9, 31)); e.vendorAsk('buy', ASKED); while (e.vendorNext()); tickTo(e, e.clock.minute + 11);
  assert.strictEqual(e.doWork('buy', 'discuss', { circled: [], asks: {} }), null);
  assert.strictEqual(e.delegable(e.board.get('buy'), 'discuss'), false);
  assert.deepStrictEqual(e.board.get('buy').picks.discuss, ASKED);
});
test('提問視窗開著時鐘停；收起來再走', () => {
  const e = play(); tickTo(e, at(9, 31));
  e.vendorWindow(true); const t = e.clock.minute; e.tick(C.MS_PER_GAME_MIN * 5);
  assert.strictEqual(e.clock.minute, t);
  e.vendorWindow(false); e.tick(C.MS_PER_GAME_MIN * 5);
  assert.strictEqual(e.clock.minute, t + 5);
});
test('開到 cutoff 還沒散：那句收尾、散會（問過的照算），結算卡多那個成就；在那之前走完的沒有', () => {
  const cutoff = { at: 300, who: 'SA 怡君', text: '因為大家都沒吃午餐，不如我們今天先到這，之後有需要再電話聯絡。', trait: { title: '把客戶關在會議室', text: '開到下午兩點' } };
  const e = play({ ...MEETING, cutoff }); const said = []; e.on('meeting:cutoff', (c) => said.push(`${c.who}：${c.text}`));
  tickTo(e, at(9, 31)); e.vendorAsk('buy', ASKED); e.vendorNext();
  tickTo(e, at(13, 59)); assert.ok(e.meeting, '13:59 還在開');
  tickTo(e, at(14, 1));
  assert.strictEqual(e.meeting, null);
  assert.deepStrictEqual(said, [`SA 怡君：${cutoff.text}`]);
  tickTo(e, at(14, 11));
  assert.deepStrictEqual(e.board.get('buy').picks.discuss, ASKED);
  assert.ok(e.report().traits.some(t => t.title === '把客戶關在會議室'));
  const early = play({ ...MEETING, cutoff }); tickTo(early, at(9, 31)); while (early.vendorNext()); tickTo(early, at(14, 30));
  assert.ok(!early.report().traits.some(t => t.title === '把客戶關在會議室'));
});
test('沒寫 cutoff 的會議沒有時間限制：客戶等你問完，幾點都不會自己散會；走完才開卡，沒問的段落記成需求不明', () => {
  const e = play(); tickTo(e, at(13, 0));
  assert.strictEqual(e.meeting.spec.kind, 'vendor');
  while (e.vendorNext()); tickTo(e, e.clock.minute + 11);
  const card = e.board.get('buy');
  assert.ok(card.done('discuss')); assert.deepStrictEqual(card.picks.discuss, { circled: [], asks: {} });
  assert.deepStrictEqual(card.vague, ['價錢喔，就時價啊。']);
});
test('離席：會議對你結束，問過的照算，一樣 10 分鐘後開卡', () => {
  const e = play(); tickTo(e, at(9, 31)); e.vendorAsk('buy', ASKED); e.leaveMeeting();
  tickTo(e, e.clock.minute + 11);
  assert.deepStrictEqual(e.board.get('buy').picks.discuss, ASKED);
});
test('提問視窗開著時離席：時鐘照走，不會停在會議那一刻', () => {
  const e = play(); tickTo(e, at(9, 31)); e.vendorWindow(true); e.leaveMeeting();
  const t = e.clock.minute; e.tick(C.MS_PER_GAME_MIN * 5);
  assert.strictEqual(e.clock.minute, t + 5);
});

// ── 時程在會議上問：怡君問、玩家回答幾小時，散會後填進母議題的估時、卡上唯讀 ──
test('會議上回答時程：散會後母議題的估時已經做完、記成會議上答的，卡還是新需求', () => {
  const e = play(); tickTo(e, at(9, 31)); toSchedule(e);
  assert.strictEqual(e.vendorEstimate(1200), 1200);
  e.vendorNext(); tickTo(e, e.clock.minute + 11);
  const erp = e.board.get('erp');
  assert.ok(erp.done('estimate')); assert.strictEqual(erp.estimate, 1200);
  assert.strictEqual(erp.history.find(h => h.work === 'estimate').by, 'meeting');
  assert.strictEqual(erp.status, 'new');
});
test('會議上回答的估時在卡上唯讀：不能重做、不能交給 AI', () => {
  const e = play(); tickTo(e, at(9, 31)); toSchedule(e); e.vendorEstimate(1200); e.vendorNext(); tickTo(e, e.clock.minute + 11);
  const erp = e.board.get('erp');
  assert.strictEqual(e.doWork('erp', 'estimate', [8]), null);
  assert.strictEqual(e.delegable(erp, 'estimate'), false);
  assert.strictEqual(e.fromMeeting(erp, 'estimate'), true);
  assert.strictEqual(erp.estimate, 1200);
});
test('時程不回答就散會（回去估好再說）：母議題的估時照舊留給玩家在卡上填', () => {
  const e = play(); tickTo(e, at(9, 31)); toSchedule(e); e.vendorNext(); tickTo(e, e.clock.minute + 11);
  const erp = e.board.get('erp');
  assert.ok(!erp.done('estimate')); assert.strictEqual(e.fromMeeting(erp, 'estimate'), false);
  assert.ok(e.doWork('erp', 'estimate', [800]));
  assert.strictEqual(erp.estimate, 800);
});
test('時程的回答要是正的數字；沒有時程這段的會議，模組講完就散會', () => {
  const e = play(); tickTo(e, at(9, 31)); toSchedule(e);
  for (const bad of [undefined, null, 0, -5, NaN]) assert.strictEqual(e.vendorEstimate(bad), null);
  const plain = play({ ...MEETING, schedule: undefined }); tickTo(plain, at(9, 31));
  plain.vendorNext();
  assert.strictEqual(plain.vendorNext(), null);
  assert.strictEqual(plain.meeting, null);
});
test('回答過時程後離席：估時一樣填進母議題', () => {
  const left = play(); tickTo(left, at(9, 31)); toSchedule(left); left.vendorEstimate(1600); left.leaveMeeting(); tickTo(left, left.clock.minute + 11);
  assert.strictEqual(left.board.get('erp').estimate, 1600);
});
test('結算卡的估時表照舊附現實參考（含 note）', () => {
  const e = play(); tickTo(e, at(9, 31)); toSchedule(e); e.vendorEstimate(1200); e.vendorNext(); tickTo(e, e.clock.minute + 11);
  const row = e.estimates().find(r => r.card.includes('源裕水產 ERP'));
  assert.strictEqual(row.yours, '1200 小時');
  assert.deepStrictEqual(row.real, ERP.subtasks[0].question.items[0].real);
});

// ── 廠商需求會議裡請 Claire 問正在講的那段（第二關的劇本，有 AI 的時代）：它只擬好要問的，送出還是玩家按 ──
const scenery = require('./scenery-helpers.js');
const real = (mode) => { const e = scenery.play(mode); scenery.tickTo(e, at(9, 31)); return e; };
test('請 Claire 問：扣額度、終端機記一行，回傳它圈的句子和問法；等同按了提問，送出前還沒問', () => {
  const e = real('hybrid'); const left = e.ai.left; e.vendorWindow(true); const t = e.clock.minute;
  const said = []; e.on('claire:asked', (x) => said.push(x));
  const draft = e.vendorDelegate('buy', 'Essay');
  assert.deepStrictEqual(said.map(x => [x.model, x.wait]), [['Essay', 0]], '終端機記一行、額度條跟著扣');
  assert.deepStrictEqual(Object.keys(draft.asks).map(Number), draft.circled, 'AI 全圈，每句都擬了問法');
  assert.strictEqual(e.meeting.notes.buy, undefined, '還沒送出');
  assert.strictEqual(e.ai.left, left - 1);
  assert.deepStrictEqual([e.ai.stats.delegated, e.ai.stats.models.Essay], [1, 1]);
  e.tick(C.MS_PER_GAME_MIN * 3); assert.strictEqual(e.clock.minute, t + 3, '擬好就開始算，看多久算多久');
  e.vendorAsk('buy', draft);
  assert.deepStrictEqual(e.meeting.notes.buy.asks, draft.asks);
  assert.strictEqual(e.vendorDelegate('buy', 'Essay'), null, '問完的那段不能再擬');
});
test('請 Claire 問可以一直重擬：每次另扣額度、另骰（第 n 次用第 n 個種子），每題照那個模型的正確率', () => {
  const e = real('hybrid'); e.shuffleSeed = 'fixed'; const left = e.ai.left;
  const q = e.vendorStep().page.question;
  for (const n of [1, 2, 3]) {
    const draft = e.vendorDelegate('buy', 'Verse');
    assert.deepStrictEqual(draft, Works.aiAnswers(q, { accuracy: e.aiAccuracy('Verse'), seed: `fixed:meeting:buy:${n}` }).answers);
  }
  assert.strictEqual(e.ai.left, left - 3);
});
test('speedrun 請 Pedia 問：一天一次，跟問一句、交辦共用', () => {
  const e = real('speedrun');
  assert.ok(e.vendorDelegate('buy', 'Pedia'));
  assert.match(e.modelUses.Pedia[0], /廠商需求會議/);
  assert.deepStrictEqual(e.vendorDelegate('yield', 'Pedia'), { error: 'Pedia 一天只能用一次。' });
});
test('legacy 沒有 Claire；只幫得了正在講的那段，不是的不扣額度', () => {
  assert.strictEqual(real('legacy').vendorDelegate('buy', 'Essay'), null);
  const e = real('hybrid'); const left = e.ai.left;
  assert.strictEqual(e.vendorDelegate('yield', 'Essay'), null);
  assert.strictEqual(e.vendorDelegate('buy', 'Pedia'), null, 'hybrid 沒有 Pedia');
  assert.strictEqual(e.ai.left, left);
});
test('請 Claire 擬好、玩家改過再送出的，帶進卡上的需求討論，跟自己問的一樣', () => {
  const e = real('hybrid'); const draft = e.vendorDelegate('buy', 'Novel');
  e.vendorAsk('buy', { ...draft, asks: { ...draft.asks, 1: [0] } });
  while (e.vendorNext()); scenery.tickTo(e, e.clock.minute + 11);
  assert.deepStrictEqual(e.board.get('buy').picks.discuss.asks, { ...draft.asks, 1: [0] });
});
