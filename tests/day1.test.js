// tests/day1.test.js（node --test）
const test = require('node:test'); const assert = require('node:assert');
const { C } = require('../contract.js');
const { Engine } = require('../engine.js');
const day1 = require('../day1.js');

test('照提示走完一天：主線卡交 QC、不是 bad end、18:00 下班', () => {
  const e = new Engine(day1);
  const r = e.autoplay('follow_hints');
  assert.strictEqual(r.badEnd, false);
  assert.ok(['to_qc', 'archived'].includes(e.board.get('asset_crud').status), e.board.get('asset_crud').status);
  assert.ok(r.report.lines.some(l => l.startsWith('下班：18:')), r.report.lines.join('\n'));
  assert.ok(r.report.lines.some(l => l.includes('平板：有充電')));
});

test('整天不理主線卡 → bad end，那一天重來', () => {
  const e = new Engine(day1);
  const r = e.autoplay('ignore_all');
  assert.strictEqual(r.badEnd, true); assert.match(r.reason, /Excel/);
  // 老闆沒人理，留了一張紙；小潘的 LIME 進來了，沒變成卡
  assert.strictEqual(e.papers.filter(p => p.origin === 'boss').length, 1);
  assert.ok(e.docs.some(d => d.origin === 'line' && d.from === '同事 小潘')); assert.strictEqual(e.board.get('colleague'), undefined);
});

test('老闆走過來時理他：講的話進文件，自己開卡後是一張負責人掛玩家的卡', () => {
  const e = new Engine(day1); e.tick(C.MS_PER_GAME_MIN * 100);
  assert.strictEqual(e.visitor.id, 'boss');
  e.talkTo('boss'); const doc = e.docs.find(d => d.origin === 'boss');
  const card = e.openCardFrom(doc.id, { type: 'addon', parent: 'asset_crud', module: 'inventory', assignee: 'me', sentences: [0, 1], attach: true });
  assert.deepStrictEqual(card.draft.missing, []); assert.strictEqual(e.board.get(card.id).assignee, '玩家');
});

test('議題編號：阿賢的卡是 #121，之後開的卡照順序發號', () => {
  const e = new Engine(day1); e.tick(C.MS_PER_GAME_MIN * 100);
  assert.strictEqual(e.board.get('asset_crud').no, 121);
  e.talkTo('boss'); const doc = e.docs.find(d => d.origin === 'boss');
  const card = e.openCardFrom(doc.id, { type: 'addon', parent: 'asset_crud', module: 'inventory', assignee: 'me', sentences: [0, 1], attach: true });
  assert.strictEqual(card.no, 122); assert.strictEqual(e.board.label('asset_crud'), '#121');
});

test('老闆講的是阿賢那張卡的追加需求：掛對母議題沒事，開成獨立的卡 SA 會留言；轉給 SA 她自己會掛', () => {
  const e = new Engine(day1); e.tick(C.MS_PER_GAME_MIN * 100); e.talkTo('boss');
  const doc = e.docs.find(d => d.origin === 'boss');
  const ok = e.openCardFrom(doc.id, { type: 'addon', parent: 'asset_crud', module: 'inventory', assignee: 'me', sentences: [0, 1], attach: true });
  assert.strictEqual(ok.parent, 'asset_crud'); assert.deepStrictEqual(ok.comments, []);
  const e2 = new Engine(day1); e2.tick(C.MS_PER_GAME_MIN * 100); e2.talkTo('boss');
  const alone = e2.openCardFrom('boss', { type: 'feature', module: 'inventory', assignee: 'me', sentences: [0, 1], attach: true });
  assert.strictEqual(alone.parent, null); assert.match(alone.comments[0].text, /#121/); assert.strictEqual(alone.comments[0].who, 'SA 怡君');
  const e3 = new Engine(day1); e3.tick(C.MS_PER_GAME_MIN * 100); e3.talkTo('boss');
  e3.openCardFrom('boss', { assignee: 'sa' }); e3.tick(C.MS_PER_GAME_MIN * (C.SA_TURNAROUND_MIN + 1));
  assert.strictEqual(e3.board.get('boss:sa').parent, 'asset_crud'); assert.strictEqual(e3.board.get('boss:sa').type, 'addon');
  // 怡君寫得比老闆明確：規格語言的條列，原話變附檔
  assert.strictEqual(e3.board.get('boss:sa').body, '・資產清單新增唯讀頁（財務用）\n・唯讀頁也具有匯出 Excel 功能\n・老闆原話如附檔。');
});

test('防呆是 QC 亂打才翻出來的：跳過前端設計交 QC 會被退、理由是漏掉的防呆；做滿就沒事', () => {
  const run = (ui) => {
    const e = new Engine(day1); e.tick(C.MS_PER_GAME_MIN * 11); e.openCard('asset_crud');
    const card = e.board.get('asset_crud'); const fn = card.subtasks.find(s => s.work === 'code').question.functions;
    if (ui) e.doWork('asset_crud', 'ui_design', ui);
    e.doWork('asset_crud', 'code', fn.map(f => Object.fromEntries(Object.entries(f.fields).map(([k, v]) => [k, v.answer]))));
    e.doWork('asset_crud', 'deploy', [[0, 1, 2, 3, 4]]); e.submit('asset_crud'); e.tick(C.MS_PER_GAME_MIN * (C.QC_TURNAROUND_MIN + 1));
    return card;
  };
  const skipped = run(null);
  assert.strictEqual(skipped.status, 'returned'); assert.match(skipped.comments.at(-1).text, /編號亂打也存得進去/); assert.match(skipped.comments.at(-1).text, /手滑就報廢了/);
  const half = run([0, [0, 1, 2, 3, 4, 5], [0, 1]]);
  assert.strictEqual(half.status, 'returned'); assert.doesNotMatch(half.comments.at(-1).text, /編號亂打/); assert.match(half.comments.at(-1).text, /同一個編號建了兩筆/);
  assert.strictEqual(run([0, [0, 1, 2, 3, 4, 5], [0, 1, 2, 3, 4]]).status, 'archived');
  assert.strictEqual(run([0, [0, 1, 2, 3, 4, 5], [0, 1, 8, 3, 4]]).status, 'archived');   // 日期照格式打也算有防呆
});

test('結算卡有使用者對前端的評價：壞配色會被說文字和背景分不開；做好就是不用教就會用', () => {
  const run = (ui) => {
    const e = new Engine(day1); e.tick(C.MS_PER_GAME_MIN * 11); e.openCard('asset_crud');
    const card = e.board.get('asset_crud'); const fn = card.subtasks.find(s => s.work === 'code').question.functions;
    e.doWork('asset_crud', 'ui_design', ui);
    e.doWork('asset_crud', 'code', fn.map(f => Object.fromEntries(Object.entries(f.fields).map(([k, v]) => [k, v.answer]))));
    return e.leave().peers.find(p => p.who === '使用者');
  };
  assert.match(run([0, [0, 1, 2, 3, 4, 5], [0, 1, 2, 3, 4], 1, 1, 1]).text, /文字和背景根本分不開/);
  assert.match(run([0, [0, 1, 2, 3, 4, 5], [0, 1, 2, 3, 4], 0, 0, 0]).text, /不用教就會用/);
  const e = new Engine(day1); e.tick(C.MS_PER_GAME_MIN * 11); assert.strictEqual(e.leave().peers.find(p => p.who === '使用者'), undefined);
});

test('老闆的卡走得完：寫程式、驗收、測試、部署後交 QC，QC 驗完結案', () => {
  const e = new Engine(day1); e.tick(C.MS_PER_GAME_MIN * 100); e.talkTo('boss');
  const doc = e.docs.find(d => d.origin === 'boss');
  const card = e.openCardFrom(doc.id, { type: 'addon', parent: 'asset_crud', module: 'inventory', assignee: 'me', sentences: [0, 1], attach: true });
  const fn = card.subtasks.find(s => s.work === 'code').question.functions;
  e.doWork(card.id, 'code', fn.map(() => ({ scope: 0, how: 0 })));
  e.doWork(card.id, 'doc_accept', [[0, 1]]);
  e.doWork(card.id, 'test', [{ assert: 0 }, { assert: 0 }]);
  e.doWork(card.id, 'manual_test', [{ target: 'pc' }]);
  e.doWork(card.id, 'deploy', [[0, 1, 2, 3, 4]]);
  e.submit(card.id); assert.strictEqual(card.status, 'to_qc');
  e.tick(C.MS_PER_GAME_MIN * (C.QC_TURNAROUND_MIN + 1)); assert.strictEqual(card.status, 'archived');
});

test('老闆的卡帶著唯讀頁的畫面；配色跟阿賢那張不一樣，結算卡的使用者評價一定多那一句', () => {
  const play = (bossPalette, bad) => {
    const e = new Engine(day1); e.tick(C.MS_PER_GAME_MIN * 100); e.openCard('asset_crud');
    const main = e.board.get('asset_crud'); const fn = main.subtasks.find(s => s.work === 'code').question.functions;
    e.doWork('asset_crud', 'ui_design', bad ? [0, [0, 1, 2, 3, 4, 5, 7], [0, 1, 2, 3, 4, 6], 1, 1, 1] : [0, [0, 1, 2, 3, 4, 5], [0, 1, 2, 3, 4], 0, 0, 0]);
    e.doWork('asset_crud', 'code', fn.map(f => Object.fromEntries(Object.entries(f.fields).map(([k, v]) => [k, v.answer]))));
    e.talkTo('boss');
    const card = e.openCardFrom('boss', { type: 'feature', module: 'inventory', assignee: 'me', sentences: [0, 1], attach: true });   // 掛錯母議題也還是追加需求
    assert.ok(card.screen && card.screen.readOnly); assert.strictEqual(card.relatedTo, 'asset_crud');
    e.doWork(card.id, 'ui_design', [0, [0, 1, 2], bossPalette]);
    e.doWork(card.id, 'code', [{ scope: 0, how: 0 }]);
    return e.leave().peers.find(p => p.who === '使用者').text;
  };
  assert.doesNotMatch(play(0), /風格能夠一致/);
  assert.match(play(4), /不用教就會用.*風格能夠一致會更好/);
  assert.match(play(4, true), /風格能夠一致會更好/, '抱怨滿三句也不會被擠掉');
  const e = new Engine(day1); e.tick(C.MS_PER_GAME_MIN * 100); e.talkTo('boss'); e.openCardFrom('boss', { assignee: 'sa' });
  e.tick(C.MS_PER_GAME_MIN * (C.SA_TURNAROUND_MIN + 1));
  assert.ok(e.board.get('boss:sa').screen.readOnly); assert.ok(e.board.get('boss:sa').subtasks.some(s => s.work === 'ui_design'));
});

test('估時沒有對錯：自己填幾小時，結算卡列你估的、實際＝第一筆紀錄到最後一次交 QC，附現實中大約多久', () => {
  const Verdict = require('../verdict.js'); const Works = require('../works.js');
  const open = new Engine(day1); open.tick(C.MS_PER_GAME_MIN * 11);
  const done = open.doWork('asset_crud', 'estimate', [5]);
  assert.strictEqual(done.max, 0, '不計分');
  assert.strictEqual(open.board.get('asset_crud').estimate, 5);
  const r = open.leave();
  assert.deepStrictEqual(r.estimates, [{ card: '#121 ' + open.board.get('asset_crud').title, yours: '5 小時', actual: '還沒完成', boss: null, real: { manual: '3 天', ai: '1 天' } }]);
  assert.ok(r.lines.includes(`估時 #121 ${open.board.get('asset_crud').title}：你估 5 小時，實際 還沒完成（現實中純手工大約 3 天，有 AI 幫忙大約 1 天）`), r.lines.join('\n'));
  assert.ok(!r.lines.some(l => l.startsWith('估時：')), '估時沒有分數');
  assert.match(Works.summarize(day1.cards[0].subtasks.find(s => s.work === 'estimate').question, [5]), /你估：5 小時/);

  const e = new Engine(day1); e.tick(C.MS_PER_GAME_MIN * 11);
  const card = e.board.get('asset_crud'); const fn = card.subtasks.find(s => s.work === 'code').question.functions;
  e.doWork('asset_crud', 'estimate', [24]);
  e.doWork('asset_crud', 'ui_design', [0, [0, 1, 2, 3, 4, 5], [0, 1, 2, 3, 4]]);
  e.doWork('asset_crud', 'code', fn.map(f => Object.fromEntries(Object.entries(f.fields).map(([k, v]) => [k, v.answer]))));
  e.doWork('asset_crud', 'deploy', [[0, 1, 2, 3, 4]]); e.submit('asset_crud'); e.tick(C.MS_PER_GAME_MIN * (C.QC_TURNAROUND_MIN + 1));
  assert.strictEqual(card.status, 'archived');
  const rows = card.timeline();
  assert.strictEqual(rows[0].at, C.DAY_START_MIN + 11, '第一列是估時');
  assert.deepStrictEqual(rows.slice(-2).map(r => r.type), ['submit', 'closed'], '交 QC、結案都有一列');
  const est = e.leave().estimates[0];
  assert.strictEqual(est.yours, '24 小時');
  assert.strictEqual(est.boss, '你在摸魚嗎？', '估 24 小時、不到一小時就做完');
  assert.strictEqual(r.estimates[0].boss, null, '還沒完成，主管不評');
  // 估值－實際：超過 4 小時摸魚、少於 −4 小時能力不足，剛好 4 小時以內算按時
  const say = (est, min) => Verdict.estimateComment(est, min);
  assert.strictEqual(say(10, 5 * 60), '你在摸魚嗎？');
  assert.strictEqual(say(9, 5 * 60), '按時完成，繼續保持');
  assert.strictEqual(say(1, 5 * 60), '按時完成，繼續保持');
  assert.strictEqual(say(1, 5 * 60 + 1), '多花了這麼多時間是能力不足嗎？');
  assert.strictEqual(est.actual, Verdict.duration(rows.filter(r => r.type === 'submit').at(-1).at - rows[0].at), '阿姿驗的那 30 分鐘不算');
  assert.strictEqual(Verdict.duration(470), '7 小時 50 分'); assert.strictEqual(Verdict.duration(40), '40 分鐘'); assert.strictEqual(Verdict.duration(120), '2 小時');
});

const allCards = () => [...day1.cards, ...day1.sources];

test('劇本裡每種教學關要教的核心工作至少出現一次', () => {
  const used = new Set(allCards().flatMap(k => (k.subtasks || []).map(s => s.work)));
  for (const w of ['read_req', 'discuss', 'estimate', 'doc_plan', 'doc_spec', 'ui_design', 'code', 'test', 'manual_test', 'doc_accept', 'deploy'])
    assert.ok(used.has(w), `缺 ${w}`);
  assert.ok(day1.sources.some(s => s.reply), '至少一則訊息可以回');
});

test('每道題的答案都落在選項範圍內', () => {
  for (const card of allCards()) for (const s of card.subtasks || []) {
    const q = s.question; if (!q.items) continue;
    for (const it of q.items) {
      if (it.free) continue;   // 沒有對錯的題（估時）沒有答案
      const idx = Array.isArray(it.answer) ? it.answer : [it.answer];
      for (const i of idx) assert.ok(i >= 0 && i < it.options.length, `${card.id}/${s.work}: ${it.text}`);
    }
  }
});

test('第一天中間沒有會議；過場會議在第二天開頭，沒舉手就被指定', () => {
  assert.deepStrictEqual(day1.meetings, []);
  const e = new Engine(day1.day2stub); const got = [];
  e.on('meeting:line', l => got.push(l.text)); e.on('meeting:silent', s => got.push(`silent:${s.flag}`));
  e.tick(C.MS_PER_GAME_MIN * 30);
  assert.strictEqual(got.length, 5); assert.strictEqual(got.at(-1), 'silent:assigned_anyway');
  assert.ok(e.flags.assigned_anyway);
  const e2 = new Engine(day1.day2stub); let key = null;
  e2.on('meeting:line', l => { if (l.key) key = l; });
  e2.tick(C.MS_PER_GAME_MIN * 14); assert.ok(e2.raiseHand(0, key)); assert.ok(e2.flags.volunteered);
  assert.ok(!e2.raiseHand(1, key), '同一句不能舉兩次');
  e2.tick(C.MS_PER_GAME_MIN * 20); assert.strictEqual(e2.flags.assigned_anyway, undefined);
});

test('離席：會議立刻結束、後面的句子不再出現、沒舉手照樣被指定', () => {
  const e = new Engine(day1.day2stub); const got = [];
  e.on('meeting:line', l => got.push(l.text)); e.on('meeting:end', () => got.push('end'));
  e.tick(C.MS_PER_GAME_MIN * 8); assert.strictEqual(got.length, 2);
  assert.ok(e.leaveMeeting()); assert.ok(e.flags.left_meeting); assert.ok(e.flags.assigned_anyway);
  e.tick(C.MS_PER_GAME_MIN * 30);
  assert.deepStrictEqual(got.slice(2), ['end']);
  assert.ok(!e.leaveMeeting(), '已經不在會議裡');
});

test('阿賢問過怡君才直接開給你：內文第一句寫明；退回 SA 怡君秒退，也傳 LIME', () => {
  const DAY1 = require('../day1.js'); const { C } = require('../contract.js');
  assert.match(DAY1.cards[0].body, /^我問過怡君了，她說可以直接開給你。\n/);
  const s = { ...DAY1, hints: [], meetings: [] };
  const e = new Engine(s); e.tick(C.MS_PER_GAME_MIN * 11);
  const card = e.board.get('asset_crud'); const before = card.status;
  e.rejectToSA('asset_crud', '這個流程不合理');
  assert.strictEqual(card.status, before, '卡留在玩家手上');
  assert.match(card.comments.at(-1).text, /阿賢說得很清楚.*直接找阿賢/);
  assert.ok(e.docs.some(d => d.origin === 'line' && d.from === 'SA 怡君' && /直接找阿賢/.test(d.text)));
});

// 第一天每件工作都是第一次碰到：照提示做時，時鐘停到按完成
const atHint = (e, text) => { for (let i = 0; i < 400 && !(e.hint && text.test(e.hint.text)); i++) { if (e.hint) e.follow(e.hint); else e.tick(C.TICK_MS || 1000); } assert.match(e.hint.text, text); };
const frozen = (e) => { const m = e.clock.minute; e.tick(60000); return e.clock.minute === m; };

test('第一天照提示做：找卡、打開工作都不走時間，做完才換下一句', () => {
  const e = new Engine(day1); atHint(e, /整理需求/);
  assert.ok(frozen(e), '提示出來時鐘停著');
  e.emit('board:opened'); assert.ok(frozen(e), '打開看板找卡不算動作');
  e.openCard('asset_crud'); assert.ok(frozen(e), '打開卡片不算動作');
  e.openWork('asset_crud', 'read_req'); assert.ok(frozen(e), '打開提示要的工作，做完之前時鐘都停著');
  e.follow(e.hint); assert.match(e.hint.text, /需求討論/); assert.ok(frozen(e), '做完換下一句，時鐘繼續停');
  atHint(e, /拉到它上面/); assert.ok(frozen(e), '要插電的提示也停著');
  atHint(e, /手動測試/); assert.ok(frozen(e), '插上電之後下一句也停著');
});

test('第一天沒照提示走時間照走，提示要的事做不到也不會卡死', () => {
  const other = new Engine(day1); atHint(other, /整理需求/);
  other.openWork('asset_crud', 'estimate'); assert.ok(!frozen(other), '開別的工作時間照走');
  const away = new Engine(day1); atHint(away, /整理需求/);
  away.emit('card:to_sa', away.board.get('asset_crud')); assert.ok(!frozen(away), '做了別的事時間照走，SA 的 90 分鐘才過得完');
  away.emit('board:opened'); assert.ok(!frozen(away), '恢復之後看看板不會又停住');
});

test('第二天也停到做完；交給 AI 時間照走，AI 才跑得完', () => {
  const { DAY2 } = (() => { const d = require('../day2.js'); return { DAY2: d.make ? d : d.DAY2 }; })();
  const e = new Engine(DAY2.make());
  for (let i = 0; i < 400 && !(e.hint && /交給 AI 試試/.test(e.hint.text)); i++) { if (e.hint) e.dismissHint(); e.tick(1000); }
  assert.ok(e.hint); e.clock.pause('hint');
  e.openWork(e.script.mainCard, 'read_req'); assert.ok(frozen(e), '打開提示要的工作不走時間');
  assert.ok(e.delegate(e.script.mainCard, 'read_req')); assert.ok(!frozen(e), '交給 AI 就恢復');
});

test('提示掛著時下班，時間不會被留住', () => {
  const { DAY2 } = (() => { const d = require('../day2.js'); return { DAY2: d.make ? d : d.DAY2 }; })();
  const e = new Engine(DAY2.make());
  e.clock.pause('hint'); e.leave();
  assert.ok(!e.clock.pauses.has('hint'));
});

test('提示上的「略過此提示」：這句算過關、時間恢復，工作沒有真的做，後面照舊', () => {
  const e = new Engine(day1); atHint(e, /整理需求/);
  e.passHint();
  assert.match(e.hint.text, /需求討論/, '下一句照它的條件出來');
  assert.ok(!e.board.get('asset_crud').done('read_req'), '那件工作沒有被標成做完');
  assert.ok(frozen(e), '下一句有自己的暫停');
  e.hint.until = 'never'; e.hintQueue.length = 0; e.passHint();
  assert.strictEqual(e.hint, null); assert.ok(!frozen(e), '後面沒有提示了，時間繼續');
});

test('第一句提示還在時開看板找卡，時間也不走', () => {
  const e = new Engine(day1); atHint(e, /打開 Tearlol/);
  e.emit('board:opened'); assert.ok(frozen(e));
});

test('桌上多一張 HTTP 對照表：三天都在，看了不算看過原本那張便條', () => {
  const e = new Engine(day1);
  const note = e.papers.find(p => p.id === 'http_note');
  assert.ok(note && /502/.test(note.text) && /404/.test(note.text)); assert.strictEqual(note.origin, 'self');
  e.readPaper('http_note'); assert.strictEqual(e.noteOpened, false, '結算卡的便條只算原本那張');
  e.openNote(); assert.strictEqual(e.noteOpened, true);
  const { DAY2 } = (() => { const d = require('../day2.js'); return { DAY2: d.make ? d : d.DAY2 }; })();
  assert.ok(new Engine(DAY2.make()).papers.some(p => p.id === 'http_note'));
});

test('自己開卡時需求單位是提需求的人：需求討論和通知都找對方，不是玩家自己', () => {
  const e = new Engine(day1); e.tick(C.MS_PER_GAME_MIN * 100); e.talkTo('boss');
  const card = e.openCardFrom('boss', { type: 'feature', module: 'inventory', assignee: 'me', sentences: [0, 1], attach: true });
  assert.strictEqual(card.from, e.player.name); assert.strictEqual(card.requester, '老闆');
  const fixed = e.openFixedCard({ id: 'fixed', title: '同一件事' }, e.player.name, '財務 美玲');
  assert.strictEqual(fixed.requester, '財務 美玲');
});

test('LIME 泡泡拿掉整句外面的引號，句子中間引用的話不動', () => {
  const { chatText } = require('../works.js');
  assert.strictEqual(chatText('「老闆看到會很開心」。'), '老闆看到會很開心。');
  assert.strictEqual(chatText('「那就別刪了。」'), '那就別刪了。');
  assert.strictEqual(chatText('「我盡力。」。'), '我盡力。');
  assert.strictEqual(chatText('「哪一個玩笑？」。'), '哪一個玩笑？');
  assert.strictEqual(chatText('「收到」'), '收到');
  assert.strictEqual(chatText('AI 幫我整理的會議記錄，把老闆開的玩笑也記成需求了。'), 'AI 幫我整理的會議記錄，把老闆開的玩笑也記成需求了。');
  assert.strictEqual(chatText('老闆說「好」，主任說「不行」。'), '老闆說「好」，主任說「不行」。');
  assert.strictEqual(chatText('「好」和「不好」'), '「好」和「不好」');
});
