// tests/engine.test.js（node --test）
const test = require('node:test'); const assert = require('node:assert');
const { C } = require('../contract.js');
const { Engine } = require('../engine.js');

const q1 = { minutes: 30, items: [{ text: 'q', options: ['a', 'b'], answer: 1 }] };
const mini = () => ({
  mainCard: 'a',
  cards: [
    { at: 0, id: 'a', title: 'A', assignee: '玩家', subtasks: [{ work: 'doc_spec', question: q1 }], nags: [{ after: 60, who: 'PM', text: '進度？' }] },
    { at: 30, id: 'b', title: 'B', assignee: '玩家' },
    { at: 40, id: 'c', title: 'C', assignee: '怡君' },
  ],
  hints: [], meetings: [], badEnd: [], unlabeled: { devices: { phone: 60, tablet: 12 } },
});
const min = (n) => C.MS_PER_GAME_MIN * n;

test('劇本到點發卡，卡片記到的是到達當下的時間', () => {
  const e = new Engine(mini()); const got = [];
  e.on('card:arrived', k => got.push(k.id));
  e.tick(min(41)); assert.deepStrictEqual(got, ['a', 'b', 'c']);
  assert.strictEqual(e.board.get('b').arrivedAt, C.DAY_START_MIN + 30);
});

test('提示出現時時鐘暫停，玩家做了提示要的事才繼續', () => {
  const s = mini(); s.hints = [{ after: 'card:arrived:a', text: '點開看板', until: 'board:opened' }];
  const e = new Engine(s); let shown = null;
  e.on('hint', h => shown = h);
  e.tick(min(1)); assert.strictEqual(shown.text, '點開看板');
  const m = e.clock.minute; e.tick(5000); assert.strictEqual(e.clock.minute, m);
  e.emit('board:opened'); assert.strictEqual(e.hint, null);
  e.tick(min(1)); assert.strictEqual(e.clock.minute, m + 1);
});

test('提示叫你按某個工作：按鈕一按、視窗開出來時鐘就走，提示留到做完', () => {
  const s = mini(); s.hints = [{ after: 'card:arrived:a', text: '按需求討論', until: 'work:done:a:doc_spec' }];
  const e = new Engine(s); e.tick(min(1));
  const m = e.clock.minute; e.tick(5000); assert.strictEqual(e.clock.minute, m);
  e.openWork('a', 'doc_spec');
  e.tick(min(2)); assert.strictEqual(e.clock.minute, m + 2); assert.strictEqual(e.hint.text, '按需求討論');
  e.openCard('a'); e.doWork('a', 'doc_spec', [1]); assert.strictEqual(e.hint, null);
});

test('點開卡片寫日誌：位置照進件順序算；別人的卡不記', () => {
  const e = new Engine(mini()); e.tick(min(41));
  e.openCard('b'); assert.strictEqual(e.log.at(-1).position, 'newest');
  e.openCard('a'); assert.strictEqual(e.log.at(-1).position, 'oldest');
  e.openCard('c'); assert.strictEqual(e.log.length, 2);
});

test('做核心工作：計分、吃時間、記卡片歷史、把日誌那筆標成 acted', () => {
  const e = new Engine(mini()); e.tick(min(31)); e.openCard('a');
  const r = e.doWork('a', 'doc_spec', [1]);
  assert.strictEqual(r.score, 1);
  assert.strictEqual(e.clock.label(), '10:01');
  assert.strictEqual(e.log.at(-1).acted, true);
  assert.strictEqual(e.board.get('a').actualMin, 30);
  assert.strictEqual(e.doWork('c', 'doc_spec', [1]), null);
});

test('追問在卡還開著時才來', () => {
  const e = new Engine(mini());
  e.tick(min(61)); assert.strictEqual(e.docs.filter(d => d.kind === 'nag').length, 1); assert.strictEqual(e.docs[0].origin, 'line');
  // 交出去（有部署，QC 不會秒退）之後追問就停；只剩 QC 自己的結案留言不算追問
  const s2 = mini(); s2.cards[0].subtasks.push({ work: 'deploy', question: { items: [{ text: 'd', type: 'order', options: ['x'], answer: [0] }] } });
  const e2 = new Engine(s2); e2.tick(min(1)); e2.openCard('a'); e2.doWork('a', 'deploy', [[0]]); e2.submit('a');
  e2.tick(min(C.QC_TURNAROUND_MIN + 1)); e2.notifyDone('a');   // 結案後有通知，阿賢就不會再來問
  e2.tick(min(61)); assert.strictEqual(e2.docs.filter(d => d.kind === 'nag').length, 0);
  assert.ok(e2.board.get('a').comments.some(c => c.kind === 'note' && c.who === '玩家'), '做完的事留了筆記');
});

test('耗電：沒插電放著半小時掉 1%、拿起來實機測試每分鐘掉 1%、插著電不掉', () => {
  const e = new Engine(mini());   // 手機 60%、平板 12%
  e.tick(min(30)); assert.strictEqual(e.devices.phone, 59, '放著半小時掉 1%');
  e.useDevice('phone'); e.tick(min(5)); assert.strictEqual(e.devices.phone, 54, '拿在手上每分鐘掉 1%');
  e.putDownDevices(); e.tick(min(10)); assert.strictEqual(e.devices.phone, 54, '放下又變回極緩慢');
  e.charge('phone'); e.useDevice('phone'); const charging = e.devices.phone; e.tick(min(3));
  assert.ok(e.devices.phone > charging, '插著電邊用邊充，只會往上');
});

test('裝置：插上充電線先漲一格、插著每分鐘漲、拔掉就停；沒電時不能選真機', () => {
  const s = mini(); s.cards[0].subtasks.push({ work: 'device_test', question: { kind: 'device' } });
  const e = new Engine(s); e.tick(min(1)); e.openCard('a');
  assert.strictEqual(e.doWork('a', 'device_test', ['real']), null);
  e.charge('tablet'); assert.strictEqual(e.devices.tablet, 17);
  e.tick(min(2)); assert.strictEqual(e.devices.tablet, 27);
  e.unplug('tablet'); e.tick(min(5)); assert.strictEqual(e.devices.tablet, 27);
  assert.deepStrictEqual(e.doWork('a', 'device_test', ['real']), { choice: 'real' });
});

test('18:00 後可以下班，下班產出結算卡', () => {
  const e = new Engine(mini()); assert.ok(!e.canLeave());
  e.tick(min(9 * 60)); assert.ok(e.canLeave());
  const r = e.leave(); assert.ok(r.lines.some(l => l.includes('真正被優先處理：0 件')));
  assert.ok(r.lines.some(l => l.includes('跳過的文件：1')));
});

test('bad end：到點檢查不過就結束，照樣算一張結算卡（BAD END 還是要有結算卡）', () => {
  const s = mini(); s.badEnd = [{ at: 9 * 60, check: (e) => e.board.get('a').status !== 'to_qc' ? 'Excel' : null }];
  const e = new Engine(s); let bad = null; e.on('bad_end', b => bad = b);
  e.tick(min(9 * 60 + 1)); assert.strictEqual(bad.reason, 'Excel'); assert.ok(e.ended.badEnd);
  assert.ok(bad.report && bad.report.kind && Array.isArray(bad.report.tally)); assert.strictEqual(e.ended.report, bad.report);
});

test('會議：到點開始、句子照時間出、舉手設旗標、沉默就多一張卡', () => {
  const s = mini();
  s.meetings = [{ at: 120, end: 150, title: '週會', lines: [
    { at: 5, text: '資產那個誰在做？', key: true, options: [{ text: '我', flag: 'claimed' }] }],
    ifSilent: { id: 'm1', title: '會議結論', assignee: '玩家' } }];
  const e = new Engine(s); const ev = [];
  e.on('meeting:start', () => ev.push('start')); e.on('meeting:line', l => ev.push(l.text)); e.on('meeting:end', () => ev.push('end'));
  e.tick(min(126)); assert.deepStrictEqual(ev, ['start', '資產那個誰在做？']);
  assert.ok(e.raiseHand(0)); assert.ok(e.flags.claimed);
  e.tick(min(30)); assert.deepStrictEqual(ev.at(-1), 'end'); assert.strictEqual(e.board.get('m1'), undefined);
  const e2 = new Engine(s); e2.tick(min(151)); assert.ok(e2.board.get('m1'));
});

test('會議：可以舉手的那句還在飛，就等它飛完才散會，飛的時候都能舉手', () => {
  const s = mini();
  s.meetings = [{ at: 120, end: 130, title: '週會', lines: [{ at: 8, text: '誰要接？', key: true, options: [{ text: '我', flag: 'claimed' }] }] }];
  const e = new Engine(s); let ended = null;
  e.on('meeting:end', () => { ended = e.clock.minute; });
  e.tick(min(135)); assert.strictEqual(ended, null, '劇本寫 130 散會，但那句 128 才出來');
  assert.ok(e.raiseHand(0)); assert.ok(e.flags.claimed);
  e.tick(min(5)); assert.strictEqual(ended, C.DAY_START_MIN + 128 + C.DANMAKU_FLY_MIN);
});
test('第三天早會：IT 經理那句（技術支援窗口）飛完前都還在開會', () => {
  const DAY2 = require('../day2.js'); const m = DAY2.transitionNext;
  const key = m.lines.find(l => l.at === 23);
  const e = new Engine({ ...mini(), cards: [], meetings: [m] });
  e.tick(min(m.at + key.at + C.DANMAKU_FLY_MIN - 1));
  assert.ok(e.meeting, '那句還在飛');
  assert.ok(e.raiseHand(0, e.meeting.spec.lines.find(l => l.at === 23)));
});
test('收尾句等能舉手的那句有結果才講：第三天老闆的「好，那就這樣」排在 IT 經理接話之後', () => {
  const DAY2 = require('../day2.js'); const m = DAY2.transitionNext;
  const run = (raiseAt) => {
    const e = new Engine({ ...mini(), cards: [], meetings: [m] }); const said = []; let ended = null;
    e.on('meeting:line', l => said.push([e.clock.minute - C.DAY_START_MIN, l.text]));
    e.on('meeting:end', () => { ended = e.clock.minute - C.DAY_START_MIN; });
    if (raiseAt != null) { e.tick(min(raiseAt)); assert.ok(e.raiseHand(0, e.meeting.spec.lines.find(l => l.at === 23))); }
    e.tick(min(60));
    return { closingAt: said.find(([, t]) => /好，那就這樣/.test(t))[0], ended };
  };
  assert.deepStrictEqual(run(30), { closingAt: 32, ended: 33 }, '09:30 才回、經理接話，兩分鐘後老闆才收尾');
  assert.deepStrictEqual(run(24), { closingAt: 26, ended: 27 }, '一出來就回：照劇本時間');
  assert.deepStrictEqual(run(null), { closingAt: 33, ended: 34 }, '沒回：那句飛走才收尾');
});

// ── 來源：老闆、紙、文件、開卡、轉 SA ──
const SRC = {
  id: 'boss1', kind: 'boss', at: 10, patience: 30, from: '老闆', title: '資產的東西', module: 'inventory',
  lines: ['那個資產的東西，阿賢說你在弄？', '順便加個匯出。'],
  sentences: [{ text: '資產清單要能匯出', keep: true }, { text: '順便', keep: false }],
  subtasks: [{ work: 'code', question: q1 }],
};
const withSrc = () => new Engine({ ...mini(), cards: [], sources: [SRC] });

test('老闆：理他 → 電腦裡的文件；不理 → 桌上的紙', () => {
  const e = withSrc(); e.tick(min(10));
  assert.strictEqual(e.visitor.id, 'boss1');
  e.talkTo('boss1'); assert.strictEqual(e.visitor, null); assert.strictEqual(e.docs[0].origin, 'boss');
  const e2 = withSrc(); e2.tick(min(45));
  assert.strictEqual(e2.visitor, null); assert.strictEqual(e2.papers[0].origin, 'boss'); assert.strictEqual(e2.docs.length, 0);
});

test('紙 → 數位化 → 開卡：空草稿的卡沒涵蓋任何需求句，交 QC 會被要來源', () => {
  const e = withSrc(); e.tick(min(45)); e.digitize('boss1');
  assert.strictEqual(e.papers.length, 0); assert.strictEqual(e.docs[0].origin, 'paper');
  const card = e.openCardFrom('boss1', { type: 'feature', module: '', assignee: 'me', sentences: [], attach: false });
  assert.strictEqual(e.board.get(card.id).assignee, '玩家');
  assert.strictEqual(card.draft.noSource, true); assert.deepStrictEqual(card.draft.covered, []);
  const before = e.clock.minute; e.doWork(card.id, 'code', [1]);
  assert.strictEqual(e.clock.minute - before, q1.minutes);
  e.submit(card.id);
  assert.strictEqual(card.needsSource, true); assert.strictEqual(e.unclosable, 1);
  assert.strictEqual(e.docs.at(-1).origin, 'line');
  e.attachSource(card.id); assert.strictEqual(card.needsSource, false); assert.strictEqual(e.unclosable, 0);
  e.submit(card.id); assert.strictEqual(e.submitted, 1);
});

test('轉給 SA：卡晚點回來，負責人是玩家，同一份文件不能開兩次', () => {
  const e = withSrc(); e.tick(min(10)); e.talkTo('boss1');
  assert.strictEqual(e.openCardFrom('boss1', { assignee: 'sa', sentences: [0], attach: true }), null);
  assert.strictEqual(e.openCardFrom('boss1', { assignee: 'me' }), null);
  const card = e.board.get('boss1:sa');   // 轉出去那一刻就在看板上，怡君名下、需求分析中、玩家不能動；內文是玩家勾的
  assert.strictEqual(card.assignee, 'SA 怡君'); assert.strictEqual(card.pending, true); assert.strictEqual(e.board.canOperate(card), false);
  assert.strictEqual(card.body, '・資產清單要能匯出'); assert.match(card.attachments[0], /^原文：/);
  const ready = []; e.on('card:ready', c => ready.push(c.id));
  e.tick(min(C.SA_TURNAROUND_MIN));
  assert.strictEqual(card.assignee, '玩家'); assert.strictEqual(card.pending, false); assert.ok(card.subtasks.length); assert.deepStrictEqual(ready, ['boss1:sa']);
  assert.match(card.body, /^・資產清單要能匯出/m); assert.doesNotMatch(card.body, /順便/);   // 怡君消化過的版本，不是老闆原話
  assert.match(card.attachments[0], /原文：.*老闆口頭/);
  assert.strictEqual(e.stats.forwardedToSA, 1);
});

// ── 手動測試 ──
const CODE_Q = { kind: 'functions', functions: [
  { accept: 0, name: 'a', fields: { x: { options: ['p', 'q'], answer: 0 } } },
  { accept: 1, device: true, name: 'b', fields: { x: { options: ['p', 'q'], answer: 0 } } },
  { accept: 2, name: 'c', fields: { x: { options: ['p', 'q'], answer: 0 } } },
] };
const ACCEPT_Q = { items: [{ text: 's', options: ['s0', 's1', 's2'], answer: [0, 1, 2] }] };
const withManual = () => {
  const s = mini(); s.cards[0].subtasks = [{ work: 'doc_accept', question: ACCEPT_Q }, { work: 'code', question: CODE_Q }, { work: 'manual_test', question: { kind: 'manual' } }];
  const e = new Engine(s); e.tick(min(1)); e.openCard('a'); return e;
};
test('手動測試：沒程式就是 Null Exception，記一筆、不花時間', () => {
  const e = withManual(); const before = e.clock.minute;
  const r = e.doWork('a', 'manual_test', [{ target: 'tablet' }]);
  assert.strictEqual(r.nullException, true); assert.strictEqual(e.clock.minute, before);
  assert.strictEqual(e.board.get('a').latest('manual_test'), '物理意義上的 Null Exception');
});
test('手動測試：照著驗收文件測，驗收還沒寫就不知道從何測起', () => {
  const e = withManual(); e.doWork('a', 'code', [{ x: 1 }, { x: 1 }, { x: 1 }]);
  const r = e.doWork('a', 'manual_test', [{ target: 'phone' }]);
  assert.strictEqual(r.blind, true); assert.deepStrictEqual(r.found, []);
});
test('手動測試：模擬翻一般 bug、實機翻裝置 bug；驗收沒寫到的案例翻不出來；沒電的實機算失敗', () => {
  const e = withManual(); e.doWork('a', 'doc_accept', [[0, 1]]); e.doWork('a', 'code', [{ x: 1 }, { x: 1 }, { x: 1 }]);
  const sim = e.doWork('a', 'manual_test', [{ target: 'pc', sim: 'phone' }]);
  assert.deepStrictEqual(sim.found, ['a']);                      // b 是裝置 bug 模擬翻不出、c 驗收沒寫到
  const real = e.doWork('a', 'manual_test', [{ target: 'phone' }, { target: 'tablet' }]);
  assert.deepStrictEqual(real.found.sort(), ['a', 'b']); assert.strictEqual(real.ops[1].ok, false);   // 平板 12% 沒電
  assert.deepStrictEqual(e.board.get('a').bugsFound.sort(), ['a', 'b']);
  assert.match(e.board.get('a').latest('manual_test'), /手機實機、平板實機（沒電）/);
});
test('測試寫法從時間推', () => {
  const W = require('../works.js');
  assert.strictEqual(W.testStyle([{ work: 'test' }, { work: 'code' }]), '先寫測試再寫程式');
  assert.strictEqual(W.testStyle([{ work: 'code' }, { work: 'test' }]), '邊開發邊寫測試');
  assert.strictEqual(W.testStyle([{ work: 'code' }, { work: 'manual_test' }]), '不寫測試，做完人工測');
  assert.strictEqual(W.testStyle([{ work: 'code' }]), '沒測');
});

// ── QC ──
const DEPLOY_Q = { items: [{ text: 'd', type: 'order', options: ['x', 'y'], answer: [0, 1] }] };
const withQC = () => { const s = mini(); s.cards[0].subtasks = [{ work: 'code', question: CODE_Q }, { work: 'deploy', question: DEPLOY_Q }, { work: 'manual_test', question: { kind: 'manual' } }]; const e = new Engine(s); e.tick(min(1)); e.openCard('a'); return e; };
test('QC：沒部署就交，秒退', () => {
  const e = withQC(); e.doWork('a', 'code', [{ x: 0 }, { x: 0 }, { x: 0 }]); e.submit('a');
  const c = e.board.get('a'); assert.strictEqual(c.status, 'returned'); assert.match(c.comments.at(-1).text, /還沒上測試機/); assert.strictEqual(c.qcRejects, 1);
});
test('QC：只退你自己沒測出來的 bug；修好再交就結案', () => {
  const e = withQC(); e.doWork('a', 'code', [{ x: 1 }, { x: 0 }, { x: 1 }]); e.doWork('a', 'deploy', [[0, 1]]);
  e.doWork('a', 'manual_test', [{ target: 'phone' }]);           // 沒規格沒驗收：什麼都翻不出來
  e.submit('a'); assert.strictEqual(e.board.get('a').status, 'to_qc');
  e.tick(min(C.QC_TURNAROUND_MIN + 1));
  const c = e.board.get('a'); assert.strictEqual(c.status, 'returned'); assert.match(c.comments.at(-1).text, /驗到 2 個問題：a、c/);
  e.doWork('a', 'code', [{ x: 0 }, { x: 0 }, { x: 0 }]); e.submit('a'); e.tick(min(C.QC_TURNAROUND_MIN + 1));
  assert.strictEqual(e.board.get('a').status, 'archived');
});
test('阿姿驗完在 LIME 傳結果；怡君把卡開給你也傳 LIME（開給她自己的不傳）', () => {
  const e = withQC(); e.doWork('a', 'code', [{ x: 1 }, { x: 0 }, { x: 0 }]); e.doWork('a', 'deploy', [[0, 1]]);
  e.submit('a'); e.tick(min(C.QC_TURNAROUND_MIN + 1));
  const qc = () => e.docs.filter(d => d.from === 'QC 阿姿');
  assert.deepStrictEqual(qc().map(d => d.origin), ['line']); assert.match(qc()[0].text, /^「#\d+ A」驗到 1 個問題.*退回/);
  e.doWork('a', 'code', [{ x: 0 }, { x: 0 }, { x: 0 }]); e.submit('a'); e.tick(min(C.QC_TURNAROUND_MIN + 1));
  assert.match(qc().at(-1).text, /驗過了，進已完成/);

  const s = mini(); s.cards[1].from = 'SA 怡君'; s.cards[2].from = 'SA 怡君';
  const e2 = new Engine(s); e2.tick(min(41));
  assert.deepStrictEqual(e2.docs.filter(d => d.from === 'SA 怡君').map(d => d.cardId), ['b']);
  const day1 = require('../day1.js'); const e3 = new Engine(day1); e3.tick(min(100)); e3.talkTo('boss');
  e3.openCardFrom('boss', { assignee: 'sa' }); e3.tick(min(C.SA_TURNAROUND_MIN + 1));
  assert.ok(e3.docs.some(d => d.from === 'SA 怡君' && /開給你了/.test(d.text)), '轉給怡君的需求，她整理好也說一聲');
});
test('退回 SA 勾選：勾對的怡君 60 分鐘後補進內文、AI 那句換成問到的；勾錯的她說不合理；計畫照 card.picks.reject 帶入', () => {
  const DAY2 = require('../day2.js'); const Works = require('../works.js');
  const run = (e, n) => { for (let i = 0; i < n; i++) { if (e.hint) e.dismissHint(); e.tick(min(1)); } };
  const e = new Engine(DAY2.make()); run(e, 31);
  const card = e.board.get('asset_platform');
  e.rejectToSA('asset_platform', [[0, 2], [0], []]);   // 不同意怎麼辦（對）、誰盤點（錯）、API 要檢查權限（對）
  assert.strictEqual(card.status, 'rejected_to_sa');
  run(e, C.SA_RECHECK_MIN - 1); assert.strictEqual(card.status, 'rejected_to_sa');
  run(e, 1);
  assert.strictEqual(card.status, 'new', '還回來，跟退之前一樣');
  assert.match(card.body, /・阿賢不同意就退回持有人重填，要寫理由/);
  assert.match(card.body, /・權限在後端每支 API 檢查角色/); assert.doesNotMatch(card.body, /和 AI 討論的結果/);
  assert.strictEqual(card.claims.guardApi.how, 'sa'); assert.match(card.claims.guardApi.note, /後端每支 API 檢查角色/);
  assert.strictEqual(e.checkClaim('asset_platform', 'guardApi', 'gut'), null, '怡君問過了，不用再判斷');
  assert.match(e.docs.filter(d => d.from === 'SA 怡君').at(-1).text,
    /問過資產室 阿賢了，卡上補好了：.*「卡上沒寫誰盤點」我問過了，我覺得你的提議不合理：卡上寫了，持有人自己盤點。卡還你。/);
  assert.deepStrictEqual(card.picks.reject, [[0], [0], []]); assert.ok(card.done('reject'));
  assert.deepStrictEqual(card.saAsked, [3], '需求討論再問「不同意」那段，阿賢會說怡君問過了');
  const plan = card.subtasks.find(s => s.work === 'doc_plan').question.items[0];
  const given = Works.givenOptions(plan, card.picks, (w) => card.done(w));
  assert.ok(given.includes(4) && given.includes(5), '計畫帶入「做簽核」「後端每支 API 檢查角色」');

  e.rejectToSA('asset_platform', [[0], [], []]); run(e, C.SA_BOUNCE_MIN);   // 同一項再退一次：她問過了，卡原封不動丟回
  assert.strictEqual(card.status, 'new'); assert.match(card.comments.at(-1).text, /「卡上沒寫阿賢不同意的時候怎麼辦」我剛剛問過了，卡上有寫。卡原封不動還你。/);
  assert.strictEqual(card.body.split('阿賢不同意就退回持有人重填').length, 2, '內文不會重複補');
  assert.strictEqual(card.history.filter(h => h.work === 'reject').length, 1);
  e.rejectToSA('asset_platform', [[0, 1], [], []]); run(e, C.SA_RECHECK_MIN);   // 漏勾的補退：只補新的那項
  assert.match(card.body, /・不見了的原因用選的/); assert.strictEqual(card.body.split('阿賢不同意就退回持有人重填').length, 2);
  assert.deepStrictEqual(card.picks.reject, [[0, 1], [0], []]);
});
test('退回 SA 勾選：財務那項怡君問回來也看得到；全部勾錯 20 分鐘原封不動丟回來', () => {
  const DAY2 = require('../day2.js'); const Works = require('../works.js');
  const run = (e, n) => { for (let i = 0; i < n; i++) { if (e.hint) e.dismissHint(); e.tick(min(1)); } };
  const e = new Engine(DAY2.make()); run(e, 31);
  const card = e.board.get('asset_platform');
  const spec = card.subtasks.find(s => s.work === 'doc_spec').question.items[0];
  assert.ok(!Works.visibleItem(spec, card.picks).answer.includes(9), '還沒人問，看不到財務那項');
  e.rejectToSA('asset_platform', [[2], [1, 3], [1]]); run(e, C.SA_BOUNCE_MIN);
  assert.strictEqual(card.status, 'new'); assert.match(card.comments.at(-1).text, /「API 只能放行阿賢」我問過了，我覺得你的提議不合理：主任也要能改簽核結果。.*卡原封不動還你。/);
  assert.ok(!card.done('reject'));
  e.rejectToSA('asset_platform', [[], [2], []]); run(e, C.SA_RECHECK_MIN);
  assert.ok(Works.visibleItem(spec, card.picks).answer.includes(9));
  assert.ok(Works.givenOptions(spec, card.picks, (w) => card.done(w)).includes(9));
  assert.ok(e.report().lines.includes('退回 SA：2 次（被丟回來 1 次）'));
});
test('自己開的卡退回 SA：照開卡時指派給 SA 的流程，90 分鐘後變成怡君整理過的版本', () => {
  const day1 = require('../day1.js'); const e = new Engine(day1); e.tick(min(100)); e.talkTo('boss');
  const card = e.openCardFrom('boss', {}); e.doWork(card.id, 'read_req', [0]);
  e.rejectToSA(card.id);
  assert.strictEqual(card.pending, true); assert.strictEqual(card.assignee, 'SA 怡君'); assert.deepStrictEqual(card.history, []);
  assert.strictEqual(card.comments.at(-1).text, C.SELF_TO_SA);
  e.tick(min(C.SA_TURNAROUND_MIN + 1));
  assert.strictEqual(card.pending, false); assert.strictEqual(card.assignee, e.player.name); assert.strictEqual(card.from, 'SA 怡君');
});
test('問小潘：你的提問先出現在 LIME，他二十分鐘後回證據', () => {
  const DAY2 = require('../day2.js');
  const e = new Engine(DAY2.make()); for (let i = 0; i < 31; i++) { if (e.hint) e.dismissHint(); e.tick(min(1)); }
  e.checkClaim('asset_platform', 'guardApi', 'ask');
  const pan = () => e.docs.filter(d => d.from === '同事 小潘').map(d => d.kind);
  assert.deepStrictEqual(pan(), ['sent']);
  for (let i = 0; i < 21; i++) { if (e.hint) e.dismissHint(); e.tick(min(1)); }
  assert.deepStrictEqual(pan(), ['sent', 'chat']);
});
test('交 QC、退回 SA 之後卡在別人那邊：不能再交、再退、再做事（交 QC 後不該有那兩個按鈕）', () => {
  const e = withQC(); e.doWork('a', 'code', [{ x: 0 }, { x: 0 }, { x: 0 }]); e.doWork('a', 'deploy', [[0, 1]]);
  e.submit('a'); const c = e.board.get('a');
  assert.strictEqual(c.status, 'to_qc'); assert.strictEqual(e.board.canOperate(c), false);
  e.submit('a'); assert.strictEqual(e.submitted, 1, '交 QC 中再按一次不會多算一件');
  e.rejectToSA('a'); assert.strictEqual(c.status, 'to_qc');
  assert.strictEqual(e.doWork('a', 'code', [{ x: 1 }, { x: 1 }, { x: 1 }]), null);
  e.tick(min(C.QC_TURNAROUND_MIN + 1)); assert.strictEqual(c.status, 'archived');

  const e2 = withQC(); e2.rejectToSA('a'); const c2 = e2.board.get('a');
  assert.strictEqual(c2.status, 'rejected_to_sa'); assert.strictEqual(e2.board.canOperate(c2), false);
  e2.submit('a'); assert.strictEqual(c2.status, 'rejected_to_sa', '退回 SA 的卡不能直接交 QC');
});
test('教學關到 closeAt 強制結算：21:00 警衛來趕人，出結算卡；沒寫 closeAt 的劇本 21:00 還在上班', () => {
  const s = mini(); s.closeAt = 21 * 60;
  const e = new Engine(s); e.tick(min(12 * 60 - 1)); assert.strictEqual(e.ended, null);
  e.tick(min(1));
  assert.ok(e.ended && !e.ended.badEnd);
  assert.ok(e.ended.report.lines.includes('下班：21:00'));
  assert.ok(e.ended.report.lines.some(l => l.includes('警衛')));
  const e2 = new Engine(mini()); e2.tick(min(12 * 60)); assert.strictEqual(e2.ended, null);
  assert.ok(!e2.leave().lines.some(l => l.includes('警衛')), '自己按下班不會有警衛那行');
  assert.strictEqual(require('../day1.js').closeAt, 21 * 60);
  assert.strictEqual(require('../day2.js').make().closeAt, 21 * 60);
});
test('結算卡附同事的評價', () => {
  const V = require('../verdict.js'); const e = withQC(); const c = e.board.get('a');
  const peers = V.peerReviews(c);
  assert.strictEqual(peers.length, 4); assert.strictEqual(peers[0].who, 'SA 怡君');
  assert.strictEqual(peers[3].who, '需求單位'); assert.match(peers[3].text, /^「這跟我想的有點不一樣/);
  const r = e.leave(); assert.ok(r.lines.some(l => l.startsWith('QC 阿姿：「'))); assert.strictEqual(r.peers.length, 4);
  const R = V.requesterLine; const mk = (works, bugs) => ({ status: 'archived', history: [...works.map(w => ({ work: w })), { work: 'code', result: { bugs } }] });
  assert.strictEqual(R(mk(['discuss'], []), '阿宇'), '「阿宇，足感心的～」');
  assert.strictEqual(R(mk([], []), '阿宇'), '「阿宇怎麼都知道？」');
  assert.strictEqual(R(mk([], [{ fn: 'a' }]), '阿宇'), '「這跟我想的有點不一樣。」');
  assert.strictEqual(R(mk(['discuss'], [{ fn: 'a' }]), '阿宇'), '「老師在講你有沒有在聽？」');
  assert.strictEqual(R(mk(['discuss'], []), '阿宇', { done: '「讚。」' }), '「讚。」');
});

// ── 部署順序排錯的後果 ──
const ROLE_Q = { roles: { backup: 0, upload: 1, replace: 2, smoke: 3, notify: 4 }, items: [{ text: 'd', type: 'order', options: ['備份', '上傳', '替換', '煙霧測試', '通知'], answer: [0, 1, 2, 3, 4] }] };
const withDeploy = () => { const s = mini(); s.cards[0].subtasks = [{ work: 'code', question: CODE_Q }, { work: 'deploy', question: ROLE_Q }]; const e = new Engine(s); e.tick(min(1)); e.openCard('a'); e.doWork('a', 'code', [{ x: 0 }, { x: 0 }, { x: 0 }]); return e; };
test('替換排在上傳前面：502 到下次部署好，阿賢 LINE 來問，分鐘數記著；502 中交 QC 秒退', () => {
  const e = withDeploy(); const c = e.board.get('a');
  e.doWork('a', 'deploy', [[0, 2, 1, 3, 4]]); assert.strictEqual(c.down, e.clock.minute);
  e.submit('a'); assert.strictEqual(c.status, 'returned'); assert.match(c.comments.at(-1).text, /502/);
  e.tick(min(12)); assert.ok(e.docs.some(d => d.kind === 'nag' && /打不開/.test(d.text)));
  e.doWork('a', 'deploy', [[0, 1, 2, 3, 4]]); assert.strictEqual(c.down, null); assert.strictEqual(e.downMinutes(c), 12);
});
test('部署在終端機上照順序打指令：排對是 200，替換排在上傳前面就 502，通知是 LIME 的一句', () => {
  const e = withDeploy(); const got = []; e.on('deploy:run', ({ lines }) => got.push(lines));
  const bad = e.doWork('a', 'deploy', [[0, 2, 1, 3, 4]]).terminal.map(l => l.text).join('\n');
  assert.match(bad, /tar czf backups\//); assert.match(bad, /502 Bad Gateway/); assert.doesNotMatch(bad, /200 OK/);
  const good = e.doWork('a', 'deploy', [[0, 1, 2, 3, 4]]).terminal;
  assert.match(good.map(l => l.text).join('\n'), /200 OK/); assert.ok(good.some(l => l.kind === 'note' && /LIME.*還沒過 QC/.test(l.text)));
  const sent = e.docs.filter(d => d.origin === 'line' && d.kind === 'sent');
  assert.strictEqual(sent.length, 2); assert.match(sent[0].text, /上線了/); assert.strictEqual(sent[0].from, e.board.get('a').from);
  assert.strictEqual(e.board.get('a').earlyNotify, true);
  assert.strictEqual(got.length, 2); assert.strictEqual(e.board.get('a').terminal.length, bad.split('\n').length + good.length);
});

test('漏備份：退件時 QC 補一句、再驗加倍久；漏煙霧測試：QC 多翻一個 bug', () => {
  const e = withDeploy(); const c = e.board.get('a');
  e.doWork('a', 'deploy', [[1, 2]]);            // 沒備份、沒煙霧測試
  assert.ok(c.noBackup && c.noSmoke);
  e.submit('a'); e.tick(min(C.QC_TURNAROUND_MIN + 1));
  assert.strictEqual(c.status, 'returned'); assert.match(c.comments.at(-1).text, /新增完頁面白掉.*沒備份/); assert.strictEqual(c.slowQC, true);
  e.doWork('a', 'deploy', [[0, 1, 2, 3]]); e.submit('a');
  e.tick(min(C.QC_TURNAROUND_MIN + 1)); assert.strictEqual(c.status, 'to_qc');      // 加倍久：還在驗
  e.tick(min(C.QC_TURNAROUND_MIN)); assert.strictEqual(c.status, 'archived');
});

test('備份要在動到線上的步驟之前：上傳前後都算有備份，排在替換後面備到新版＝沒備份，終端機註明', () => {
  const e = withDeploy(); const c = e.board.get('a');
  e.doWork('a', 'deploy', [[1, 0, 2, 3]]); assert.strictEqual(c.noBackup, false, '上傳後、替換前備份：備到的還是舊版');
  const late = e.doWork('a', 'deploy', [[1, 2, 0, 3]]);
  assert.strictEqual(c.noBackup, true);
  assert.ok(late.terminal.some(l => l.kind === 'note' && /current 已經指到新版/.test(l.text)));

  // 有資料轉換的部署（部門下拉那張）：轉換也會動到線上，備份要在它前面
  const MIG_Q = { roles: { backup: 0, upload: 1, replace: 2, migrate: 3, smoke: 4 }, items: [{ text: 'd', type: 'order', options: ['備份', '上傳', '替換', '轉換', '驗證'], answer: [0, 1, 2, 3, 4] }] };
  const s = mini(); s.cards[0].subtasks = [{ work: 'deploy', question: MIG_Q }]; const e2 = new Engine(s); e2.tick(min(1)); e2.openCard('a');
  const c2 = e2.board.get('a');
  const ok = e2.doWork('a', 'deploy', [[0, 1, 2, 3, 4]]); assert.strictEqual(c2.noBackup, false);
  assert.ok(ok.terminal.some(l => /migrat/.test(l.text)), '轉換在終端機上也有一行指令');
  const lateMig = e2.doWork('a', 'deploy', [[1, 3, 0, 2, 4]]); assert.strictEqual(c2.noBackup, true);
  assert.ok(lateMig.terminal.some(l => l.kind === 'note' && /資料已經轉換過了/.test(l.text)));
});
test('通知要等 QC 驗過：已完成的卡按通知才發 LIME；沒按半小時後阿賢來問；部署時就通知是陷阱', () => {
  const V = require('../verdict.js');
  const e = withDeploy(); const c = e.board.get('a');
  assert.strictEqual(e.notifyDone('a'), null);                  // 還沒結案不能通知
  e.doWork('a', 'deploy', [[0, 1, 2, 3]]); e.submit('a'); e.tick(min(C.QC_TURNAROUND_MIN + 1));
  assert.strictEqual(c.status, 'archived');
  const got = []; e.on('card:notified', k => got.push(k.id));
  assert.ok(e.notifyDone('a')); assert.strictEqual(c.notified, true); assert.deepStrictEqual(got, ['a']);
  assert.ok(e.docs.some(d => d.kind === 'sent' && /QC 驗過/.test(d.text))); assert.strictEqual(e.notifyDone('a'), null);
  e.tick(min(40)); assert.ok(!e.docs.some(d => d.kind === 'nag' && /好了嗎/.test(d.text))); assert.doesNotMatch(V.requesterLine(c, '阿宇'), /沒人跟我說/);
  const e2 = withDeploy(); const c2 = e2.board.get('a');
  e2.doWork('a', 'deploy', [[0, 1, 2, 3]]); e2.submit('a'); e2.tick(min(C.QC_TURNAROUND_MIN + 31));
  assert.ok(e2.docs.some(d => d.kind === 'nag' && /好了嗎/.test(d.text))); assert.match(V.requesterLine(c2, '阿宇'), /沒人跟我說/);
  const e3 = withDeploy(); e3.doWork('a', 'code', [{ x: 1 }, { x: 0 }, { x: 0 }]); const c3 = e3.board.get('a');
  e3.doWork('a', 'deploy', [[0, 1, 2, 3, 4]]); e3.tick(min(16));
  assert.strictEqual(c3.earlyNotify, true); assert.ok(e3.docs.some(d => d.kind === 'nag' && /怪怪的/.test(d.text)));
  assert.match(V.requesterLine(c3, '阿宇'), /還不能用/); assert.match(V.peerReviews(c3)[1].text, /還沒驗就叫人家用/);
});

test('LIME 回了訊息、對方沒寫回話的，兩分鐘後回一張貼圖：回對謝啦、其他好喔；信箱不回貼圖', () => {
  const ask = (id, kind) => ({ id, kind, at: 1, from: '同事 小潘', title: '借問', text: 'q', module: null, reply: { items: [{ text: '你回：', options: ['對的', '隨便', '（已讀）'], answer: 0 }] } });
  const e = new Engine({ ...mini(), cards: [], sources: [ask('l1', 'line'), ask('l2', 'line'), ask('m1', 'mail')] });
  e.tick(min(2));
  e.replyTo('l1', [0]); e.replyTo('l2', [1]); e.replyTo('m1', [0]); e.tick(min(3));
  assert.deepStrictEqual(e.docs.filter(d => d.kind === 'sticker').map(d => [d.id, d.sticker]), [['l1:re', 'thanks'], ['l2:re', 'ok']]);
});
test('回（已讀）就是已讀不回：回訊息的鈕收起來（replied），對方沒反應，也不算回了一則', () => {
  const e = new Engine({ ...mini(), cards: [], sources: [{ id: 'l1', kind: 'line', at: 1, from: '同事 小潘', title: '借問', text: 'q', module: null,
    reply: { items: [{ text: '你回：', options: ['對的', '（已讀）'], answer: 0, replies: ['「謝啦」', '「？」'] }] } }] });
  e.tick(min(2)); e.replyTo('l1', [1]); e.tick(min(5));
  const doc = e.docs.find(d => d.id === 'l1');
  assert.strictEqual(doc.replied.seen, true);
  assert.strictEqual(e.docs.length, 1, '對方沒回話也沒貼圖');
  assert.strictEqual(e.stats.replies, undefined);
});
test('LIME 群組：好幾個人照順序接話、都留在群組裡；沒寫回話的貼圖也回在群組裡', () => {
  const DAY1 = require('../day1.js');
  const say = (id) => DAY1.teamSay(1, id, 'SA 怡君', '下午茶？', ['「+1」', '「不用」'], [[{ who: 'QC 阿姿', text: '「+1」' }, { who: 'SA 怡君', text: '「好，我點。」' }]]);
  const e = new Engine({ ...mini(), cards: [], sources: [say('t1'), say('t2')] }); e.tick(min(2));
  assert.deepStrictEqual(e.docs.map(d => [d.group, d.from]), [['精銳三人產線', 'SA 怡君'], ['精銳三人產線', 'SA 怡君']]);
  e.replyTo('t1', [0]); e.replyTo('t2', [1]); e.tick(min(5));
  const after = e.docs.slice(2).map(d => [d.id, d.from, d.group, d.kind]);
  assert.deepStrictEqual(after, [
    ['t1:re', 'QC 阿姿', '精銳三人產線', 'chat'], ['t2:re', 'SA 怡君', '精銳三人產線', 'sticker'], ['t1:re1', 'SA 怡君', '精銳三人產線', 'chat']]);
});
test('第一天 12:10 阿姿收單：公告不用回，照玩家 12:00 怎麼回挑一句', () => {
  const DAY1 = require('../day1.js');
  const lunch = DAY1.sources.filter(s => /^team_lunch/.test(s.id));
  const closeText = (answer) => {
    const e = new Engine({ ...mini(), cards: [], sources: lunch });
    e.tick(min(181)); if (answer !== null) e.replyTo('team_lunch', [answer]);
    e.tick(min(10));
    const doc = e.docs.find(d => d.id === 'team_lunch_close');
    assert.strictEqual(doc.reply, undefined); assert.strictEqual(doc.group, '精銳三人產線');
    return doc.text;
  };
  assert.strictEqual(closeText(0), '收單：排骨、雞腿，加我的一共三個，打電話訂了。');
  assert.strictEqual(closeText(1), '收單，打電話訂了。');
  assert.strictEqual(closeText(2), '收單了喔，沒講話的當作不用。');   // 回（已讀）
  assert.strictEqual(closeText(null), '收單了喔，沒講話的當作不用。');
});
test('第一天收單之後才回 +1：阿姿回「下次請早」，怡君不接；自己帶的照原本回', () => {
  const DAY1 = require('../day1.js');
  const lunch = DAY1.sources.filter(s => /^team_lunch/.test(s.id));
  const lateBacks = (answer) => {
    const e = new Engine({ ...mini(), cards: [], sources: lunch });
    e.tick(min(196)); e.replyTo('team_lunch', [answer]); e.tick(min(5));
    return e.docs.filter(d => /^team_lunch:re/.test(d.id)).map(d => [d.from, d.text]);
  };
  assert.deepStrictEqual(lateBacks(0), [['QC 阿姿', '「收單了啦，下次請早。」']]);
  assert.deepStrictEqual(lateBacks(1), [['QC 阿姿', '「好喔，自己帶便當的模範員工。」']]);
});
test('LIME 照時間排：晚回的話排在回的那一分鐘，不黏在被回的那則下面；（已讀）不留字', () => {
  const DAY1 = require('../day1.js');
  const lunch = DAY1.sources.filter(s => /^team_lunch/.test(s.id));
  const e = new Engine({ ...mini(), cards: [], sources: lunch });
  e.tick(min(196)); e.replyTo('team_lunch', [0]); e.tick(min(3));
  const log = e.chatLog(e.docs.filter(d => d.group)).map(x => x.mine || x.msg.text);
  assert.deepStrictEqual(log, ['中午訂便當，要的 +1，十二點十分收單。', '收單了喔，沒講話的當作不用。', '「+1，排骨」。', '「收單了啦，下次請早。」']);
  const late = e.chatLog(e.docs.filter(d => d.group)).find(x => x.mine);
  assert.strictEqual(late.quote.id, 'team_lunch', '中間隔了收單那則：像 LINE 一樣引用被回的那則');
  const now = new Engine({ ...mini(), cards: [], sources: lunch });
  now.tick(min(182)); now.replyTo('team_lunch', [0]);
  assert.strictEqual(now.chatLog(now.docs.filter(d => d.group)).find(x => x.mine).quote, null, '緊接著回的不用引用');
  const seen = new Engine({ ...mini(), cards: [], sources: lunch });
  seen.tick(min(182)); seen.replyTo('team_lunch', [2]);
  assert.deepStrictEqual(seen.chatLog(seen.docs.filter(d => d.group)).map(x => x.mine || x.msg.text), ['中午訂便當，要的 +1，十二點十分收單。']);
});
test('跨天帶過來的 LIME 訊息，到的時間跟卡片一樣往前推一天', () => {
  const e = new Engine({ ...mini(), cards: [] });
  e.restore({ cards: [], docs: [{ id: 'req', origin: 'line', kind: 'source_request', from: 'SA 怡君', text: '原文？', arrivedAt: 1000 }] });
  assert.strictEqual(e.docs[0].arrivedAt, 1000 - C.DAY_GAME_MIN);
});
test('通知需求單位之後，對方在 LIME 回一張讚', () => {
  const e = new Engine({ ...mini(), cards: [{ at: 0, id: 'k', title: '平台', from: 'SA 怡君', assignee: '玩家', requester: '阿賢', subtasks: [] }] });
  e.tick(min(1)); const card = e.board.get('k'); card.archive(e.clock.minute);
  e.notifyDone('k'); e.tick(min(3));
  assert.deepStrictEqual(e.docs.filter(d => d.kind === 'sticker').map(d => [d.from, d.sticker]), [['阿賢', 'thumb']]);
});
test('回訊息掛在訊息上：回了記在那則訊息、不是卡', () => {
  const e = new Engine({ ...mini(), cards: [], sources: [{ id: 'm1', kind: 'mail', at: 1, from: '小潘', title: '借問', text: 'q', module: null, reply: { items: [{ text: '你回：', options: ['a', 'b'], answer: 0 }] } }] });
  e.tick(min(2)); const doc = e.docs[0]; assert.ok(doc.reply);
  const r = e.replyTo('m1', [0]); assert.strictEqual(r.score, 1); assert.strictEqual(doc.replied.text, '你回：a。');
  assert.strictEqual(e.replyTo('m1', [1]), null);   // 回過就不能再回
});

test('QC：沒用實機測被翻出實機才看得到的問題，阿姿原本的話後面多問一句', () => {
  const s = mini(); s.cards[0].deviceBugs = [{ text: '老手機沒辦法上傳照片' }];
  const e = new Engine(s); e.tick(min(1));
  const card = e.board.get('a'); card.status = 'to_qc'; e.qcReview(card);
  assert.match(card.comments.at(-1).text, /老手機沒辦法上傳照片。退回。你是不是沒有用開發用手機測過？$/);
  card.status = 'to_qc'; card.realTested = true; e.qcReview(card);
  assert.strictEqual(card.status, 'archived', '拿實機測過就沒有這個問題');
});
test('QC：只有實機翻得出的 function bug 沒翻到也會多問；一般 bug 不問', () => {
  const e = withManual(); e.doWork('a', 'code', [{ x: 0 }, { x: 1 }, { x: 0 }]);
  const card = e.board.get('a'); card.status = 'to_qc'; e.qcReview(card);
  assert.match(card.comments.at(-1).text, /：b。退回。你是不是沒有用開發用手機測過？$/);
  const e2 = withManual(); e2.doWork('a', 'code', [{ x: 1 }, { x: 0 }, { x: 0 }]);
  const c2 = e2.board.get('a'); c2.status = 'to_qc'; e2.qcReview(c2);
  assert.match(c2.comments.at(-1).text, /：a。退回。$/);
});
test('手動測試：沒有驗收這件工作的卡，卡片就是驗收文件（卡上有那句才翻得出來）', () => {
  // 信件卡的 AI 主張 function 一律自己填，記它對應卡上哪一句
  const claims = { kind: 'functions', functions: ['a', 'b', 'c'].map((name, i) => ({ judgment: true, ...(i < 2 ? { sentence: i } : {}), name, fields: { x: { options: ['p', 'q'], answer: 0 } } })) };
  const s = mini(); s.cards[0].subtasks = [{ work: 'code', question: claims }, { work: 'manual_test', question: { kind: 'manual' } }];
  const e = new Engine(s); e.tick(min(1)); e.openCard('a');
  e.board.get('a').draft = { covered: [0] }; e.doWork('a', 'code', [{ x: 1 }, { x: 1 }, { x: 1 }]);
  const r = e.doWork('a', 'manual_test', [{ target: 'phone' }]);
  assert.strictEqual(r.blind, false); assert.deepStrictEqual(r.found, ['a']);   // b 那句開卡時沒留、c 沒對應卡上哪句
});
