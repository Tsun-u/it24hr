// tests/day3.test.js（node --test）：第三天（speedrun）
const test = require('node:test'); const assert = require('node:assert');
const { C } = require('../contract.js');
const { Engine } = require('../engine.js');
const DAY2 = require('../day2.js');
const DAY3 = require('../day3.js');
const Works = require('../works.js');

const MIN = C.MS_PER_GAME_MIN;
const PLAYER = { name: '小明', title: '軟體工程師' };
const SUBS = ['poc_login', 'poc_approve', 'poc_compliance'];
const startDay3 = () => { const e = new Engine(DAY3.make(), PLAYER); e.dismissHint && e.hint && e.dismissHint(); return e; };
// 提示會暫停時鐘：往前走的時候遇到提示就關掉；會議中時鐘也停，舉手或等它結束。走不動就丟錯，不要空轉
const tickTo = (e, minute) => {
  for (let guard = 0; e.clock.minute < minute; guard++) {
    if (guard > 5000) throw new Error(`時鐘卡在 ${e.clock.minute}（hint=${!!e.hint} meeting=${!!e.meeting} ended=${e.ended} pauses=${[...e.clock.pauses]}）`);
    if (e.hint) e.dismissHint();
    e.tick(MIN);
  }
};

test('第三天骨架：開場是第二天結束的早會，10:30 母議題＋四張子議題進看板，追加的兩張照群組時間來', () => {
  const e = startDay3();
  assert.strictEqual(e.script.meetings[0].title, DAY2.transitionNext.title);   // 劇本開工時整份換過 {玩家名稱}，不是同一個物件
  tickTo(e, C.DAY_START_MIN + 91);
  assert.deepStrictEqual(e.board.cards.map(c => c.id).sort(), ['poc', 'poc_approve', 'poc_compliance', 'poc_load', 'poc_login'].sort());
  const poc = e.board.get('poc');
  assert.ok(poc.noQC && poc.deployGate && poc.deployTarget === 'poc' && poc.notifyGroup === DAY3.POC);
  tickTo(e, C.DAY_START_MIN + 393);
  assert.ok(e.board.get('poc_bot') && e.board.get('poc_erp'));
  assert.strictEqual(e.board.get('poc_bot').parent, 'poc');
});

test('進度詢問：12:00 佩珊問、怡君接；母議題還沒上 POC 時 21:00 在家也照發', () => {
  const e = startDay3();
  tickTo(e, C.DAY_START_MIN + 183);
  const ids = () => e.docs.map(d => d.id);
  assert.ok(ids().includes('poc_ask1') && ids().includes('poc_ask1_sa'));
  assert.strictEqual(e.docs.find(d => d.id === 'poc_ask1').group, DAY3.POC);
  tickTo(e, C.OFF_WORK_MIN + 1); e.leave(); e.goHome({ channel: 'pickup', order: {}, laptop: true });
  assert.ok(e.home, '下班進茶几');
  tickTo(e, C.DAY_START_MIN + 721);
  assert.ok(ids().includes('poc_ask3'), '客戶的詢問在家也發');
});

test('欄位鎖到文件來才開：志豪的 AD 信 12:00 到之前 loginWith 鎖著', () => {
  const e = startDay3();
  const field = { lockedUntil: 'sahe_ad', lockedTo: 2, options: ['我們公司的 AD', '自己建帳號', 'TODO：等客戶的串接資訊'] };
  tickTo(e, C.DAY_START_MIN + 91);
  assert.ok(e.fieldLocked(field));
  tickTo(e, C.DAY_START_MIN + 181);
  assert.ok(e.docs.some(d => d.id === 'sahe_ad'));
  assert.ok(!e.fieldLocked(field));
});

test('估時的實際：不交 QC 的卡算到結案，結算卡不會寫還沒完成，主管照樣評', () => {
  const e = startDay3(); tickTo(e, C.DAY_START_MIN + 91);
  const poc = e.board.get('poc'), row = () => e.estimates().find(r => r.card.includes(poc.title));
  assert.ok(e.doWork('poc', 'estimate', [8]));
  assert.strictEqual(row().actual, '還沒完成', '還沒部署');
  for (const id of SUBS) e.board.get(id).status = 'archived';
  assert.ok(e.doWork('poc', 'deploy', [[0, 1, 2, 3]]));
  assert.strictEqual(row().actual, require('../verdict.js').duration(poc.closedAt - poc.timeline().find(r => r.at != null).at));
  assert.ok(row().boss, '主管看得到實際，就有評語');
});

test('母議題：三張子議題沒驗過不能部署；驗過後部署完直接進已完成，通知發到 POC 群組，之後進度詢問不再來', () => {
  const e = startDay3();
  tickTo(e, C.DAY_START_MIN + 91);
  const order = [[0, 1, 2, 3]];
  assert.strictEqual(e.doWork('poc', 'deploy', order), null, '門檻沒到');
  for (const id of SUBS) e.board.get(id).status = 'archived';
  assert.ok(e.doWork('poc', 'deploy', order));
  const poc = e.board.get('poc');
  assert.strictEqual(poc.status, 'archived');
  assert.ok(e.notifyDone('poc'));
  const sent = e.docs.find(d => d.id === 'poc:notified');
  assert.strictEqual(sent.group, DAY3.POC); assert.match(sent.text, /上 POC 了/);
  tickTo(e, C.DAY_START_MIN + 183);
  assert.ok(!e.docs.some(d => d.id === 'poc_ask1'), '上了 POC 就不問了');
});

test('退回 SA 指出 R4 是 Claire 加的之後，文件裡 MFA 那項消失、AI 也不再把它排進去（hideIf）', () => {
  const W = require('../works.js');
  const subs = DAY3.make().cards.find(c => c.id === 'poc_login').subtasks;
  const q = (w) => subs.find(s => s.work === w).question;
  const plan = q('doc_plan').items[0], MFA = plan.options.indexOf('導入 MFA 與生物辨識');
  assert.deepStrictEqual(W.hiddenOptions(plan, {}), []);
  assert.ok(W.aiAnswers(q('doc_plan'), { accuracy: 0, seed: 's', picks: {} }).answers[0].includes(MFA), '沒退回：Claire 會把 MFA 排進計畫');
  const gone = { reject: [[], [0]] };   // 範圍那組勾了「MFA、生物辨識要不要做」
  assert.deepStrictEqual(W.hiddenOptions(plan, gone), [MFA]);
  const after = W.aiAnswers(q('doc_plan'), { accuracy: 0, seed: 's', picks: gone });
  assert.ok(!after.answers[0].includes(MFA), '卡上沒有 R4 了，AI 不會憑空加回來');
  assert.deepStrictEqual(after.errors, [], '剩下的清單跟正解一樣，不算它錯');
  assert.strictEqual(W.grade(q('doc_plan'), after.answers, { picks: gone }).score, 1);
  const load = DAY3.make().cards.find(c => c.id === 'poc_load').subtasks.find(s => s.work === 'doc_accept').question;
  const million = { reject: [[1]] };
  assert.deepStrictEqual(W.hiddenOptions(load.items[0], million), [1], '單選題也收：100 萬人那項不見');
  assert.strictEqual(W.aiAnswers(load, { accuracy: 0, seed: 's', picks: million }).answers[0], 0);
});

test('退回 SA 勾到 Claire 加的那條：怡君把卡上 ✅ 那行換成她的說法；效益分析整段刪掉（cuts）', () => {
  const e = startDay3(); tickTo(e, C.DAY_START_MIN + 91);
  const login = e.board.get('poc_login'), approve = e.board.get('poc_approve');
  e.rejectToSA('poc_login', [[], [0]]); e.rejectToSA('poc_approve', [[], [0, 1]]);
  for (let guard = 0; !(approve.picks && approve.picks.reject) && guard < 300; guard++) { if (e.hint) e.dismissHint(); e.tick(MIN); }
  assert.doesNotMatch(login.body, /✅/); assert.match(login.body, /・R4 刪除：MFA/);
  assert.match(login.body, /R3：角色分為/, '其他需求項目還在');
  assert.doesNotMatch(approve.body, /✅|## 效益分析|提升 300%/); assert.match(approve.body, /・R4 刪除：區塊鏈/); assert.match(approve.body, /・效益分析刪除/);
});

test('loginWith 鎖著時交給 AI 也只會填 TODO；帶著 TODO 交 QC，阿姿一拿到就退', () => {
  const W = require('../works.js');
  const e = startDay3(); tickTo(e, C.DAY_START_MIN + 91);
  const card = e.board.get('poc_login'), code = e.subtask(card, 'code').question;
  const i = code.functions.findIndex(f => f.name === 'loginWith'), TODO = code.functions[i].fields.source.lockedTo;
  assert.strictEqual(W.aiAnswers(code, { ...e.aiCtx(card), accuracy: 1, seed: 's' }).answers[i].source, TODO, '鎖著：AI 寫對也只能寫 TODO');
  const answers = code.functions.map(f => Object.fromEntries(Object.entries(f.fields).map(([k, fld]) => [k, fld.answer])));
  answers[i].source = TODO;
  assert.ok(e.doWork('poc_login', 'code', answers) && e.doWork('poc_login', 'deploy', [[0, 1, 2, 3]]));
  e.submit('poc_login');
  assert.strictEqual(card.status, 'returned');
  assert.match(card.comments.at(-1).text, /還是 TODO/);
  tickTo(e, C.DAY_START_MIN + 181);
  assert.strictEqual(W.aiAnswers(code, { ...e.aiCtx(card), accuracy: 1, seed: 's' }).answers[i].source, 0, '信來了：AI 照正解填');
  answers[i].source = 0; e.doWork('poc_login', 'code', answers);
  assert.strictEqual(e.todoLeft(card), null);
});

test('第三天早會：AI 技術支援窗口只有回「我要做 POC」才推得掉，其他回答和沒回都落到玩家身上', () => {
  const meet = (pick) => {
    const e = new Engine(DAY2.day3stub, { name: '小明', title: '軟體工程師' });
    e.tick(C.MS_PER_GAME_MIN * 24);
    const line = e.meeting.spec.lines.find(l => l.at === 23);
    assert.match(line.text, /小明昨天用 Claire/);
    if (pick != null) assert.ok(e.raiseHand(pick, line));
    return e;
  };
  assert.ok(meet(0).flags.support_declined);
  for (const pick of [1, 2, 3, null]) assert.ok(!meet(pick).flags.support_declined, `選 ${pick}`);
});

test('劇本排的來源可以有 when：條件不成立就不來', () => {
  const e = new Engine({ ...DAY2.day3stub, meetings: [], sources: [
    { kind: 'mail', at: 5, id: 'only_if', title: '條件信', from: '人資', text: '有條件才來', when: (en) => !!en.flags.go },
    { kind: 'mail', at: 5, id: 'always', title: '一定來', from: '人資', text: '一定來' },
  ] });
  e.tick(C.MS_PER_GAME_MIN * 6);
  assert.deepStrictEqual(e.docs.map(d => d.id).filter(id => ['only_if', 'always'].includes(id)), ['always']);
});

test('筆記發作時群組裡的那句：母議題通知群組後志豪試用，子議題選錯的地方照 fires 一句一句講；POC 的終端機打 it@poc', () => {
  const e = startDay3(); tickTo(e, C.DAY_START_MIN + 91);
  const login = e.board.get('poc_login'), code = e.subtask(login, 'code').question;
  const answers = code.functions.map(f => Object.fromEntries(Object.entries(f.fields).map(([k, fld]) => [k, fld.answer])));
  answers[code.functions.findIndex(f => f.name === 'loginWith')].source = 1;        // 接我們公司的 AD（第二天的筆記）
  answers[code.functions.findIndex(f => f.name === 'forgotPassword')].where = 1;    // 重設頁也導到我們公司
  assert.ok(e.doWork('poc_login', 'code', answers));
  assert.deepStrictEqual(e.firedLines(login), ['我們的人登不進去，登入頁寫的是你們公司的網域。', '忘記密碼的連結導到你們公司去了。']);
  for (const id of SUBS) e.board.get(id).status = 'archived';
  const poc = e.board.get('poc'), roles = e.subtask(poc, 'deploy').question.roles;
  assert.ok(e.deployScript(poc, roles, [0, 1, 2, 3]).some(l => /it@poc/.test(l.text)), 'POC 環境的指令打 it@poc');
  assert.ok(e.deployScript(login, e.subtask(login, 'deploy').question.roles, [0, 1, 2, 3]).some(l => /it@intranet/.test(l.text)), '子議題還是上測試機');
  assert.ok(e.doWork('poc', 'deploy', [[0, 1, 2, 3]]) && e.notifyDone('poc'));
  const start = e.clock.minute;
  tickTo(e, start + 20);
  assert.match(e.docs.find(d => d.id === 'poc:trial:hello').text, /登進去了/, '志豪先說登進去了，再講問題');
  const trial = e.docs.filter(d => /^poc:trial:\d+$/.test(d.id));
  assert.strictEqual(trial.length, 2);
  assert.strictEqual(trial[0].from, DAY3.IT); assert.strictEqual(trial[0].group, DAY3.POC);
  assert.match(trial[0].text, /你們公司的網域/); assert.match(trial[1].text, /忘記密碼/);
  assert.ok(e.report().tally.some(t => t.text === '客戶試用時抓到的問題：2 個'), '結算卡記客戶抓到幾個');

  // 上線就算結案：回饋由怡君開成新卡，舊卡掛成參考文件，排進下一版
  assert.strictEqual(e.board.get('poc:feedback'), undefined, '回饋講完才開卡');
  tickTo(e, start + 30);
  const feedback = e.board.get('poc:feedback');
  assert.strictEqual(feedback.assignee, 'SA 怡君');
  assert.ok(feedback.nextRound, '排進下一版，玩家這輪不用動');
  assert.strictEqual(feedback.subtasks.length, 0);
  assert.match(feedback.body, /你們公司的網域[\s\S]*忘記密碼/);
  assert.deepStrictEqual(feedback.attachments, [`參考文件：#${poc.no} ${poc.title}`, `參考文件：#${login.no} ${login.title}`]);
  assert.strictEqual(poc.status, 'archived', '舊卡維持結案');
  assert.match(e.docs.find(d => d.id === 'poc:feedback:said').text, new RegExp(`#${feedback.no}`), '怡君跟玩家說一聲');
  assert.doesNotThrow(() => { e.report(); e.carryOver(); }, '結算、換天都不受影響');
});

test('客戶試用沒抓到問題就不開回饋卡', () => {
  const e = startDay3(); tickTo(e, C.DAY_START_MIN + 91);
  assert.deepStrictEqual(e.customerTrial(e.board.get('poc')), []);
  tickTo(e, e.clock.minute + 60);
  assert.strictEqual(e.board.get('poc:feedback'), undefined);
});

test('半夜事件 (c)：群組裡答應「今天給」、QA 機器人沒結案，22:15 佩珊來討；回保守的那句就不會', () => {
  const run = (pick) => {
    const e = startDay3(); tickTo(e, C.DAY_START_MIN + 241);
    assert.ok(e.replyTo('poc_add_bot', [pick]));
    tickTo(e, C.OFF_WORK_MIN + 1); e.leave(); e.goHome({ channel: 'pickup', order: {}, laptop: true });
    tickTo(e, 22 * 60 + 16);
    return e.docs.some(d => d.id === 'home:night_bot');
  };
  assert.ok(run(1), '答應了今天給：佩珊來問');
  assert.ok(!run(0), '只說會評估：沒人來討');
});

test('Novel 寫的文件多一堆廢話：沒刪完交 QC 秒退「請用人話寫」、阿姿在群組唸一次；全部刪完才算；Essay 寫的沒有', () => {
  const e = startDay3(); tickTo(e, C.DAY_START_MIN + 181);
  const card = e.board.get('poc_login'), accept = e.subtask(card, 'doc_accept').question;
  const right = accept.items.map(it => it.answer);
  const byModel = (model) => { const job = { id: 99, model, answers: right, status: 'ready' }; (card.ai ||= {}).doc_accept = [job]; return e.acceptAi('poc_login', 'doc_accept', 99); };
  assert.ok(byModel('Novel')); assert.ok(card.wordy.doc_accept.length >= 6, 'Novel 寫的驗收多一堆廢話');
  const code = e.subtask(card, 'code').question;
  e.doWork('poc_login', 'code', code.functions.map(f => Object.fromEntries(Object.entries(f.fields).map(([k, fld]) => [k, fld.answer]))));
  e.doWork('poc_login', 'deploy', [[0, 1, 2, 3]]);
  e.submit('poc_login');
  assert.strictEqual(card.status, 'returned'); assert.match(card.comments.at(-1).text, /請用人話寫/);
  tickTo(e, e.clock.minute + 4);
  assert.ok(e.docs.some(d => d.id === 'team3_qc_pages' && /十二頁/.test(d.text)), '阿姿在群組唸');
  const lines = [...card.wordy.doc_accept], last = lines.pop();
  for (const line of lines) assert.ok(e.trimFiller('poc_login', 'doc_accept', line));
  assert.deepStrictEqual(card.wordy.doc_accept, [last], '留一行還是算太長');
  e.doWork('poc_login', 'doc_accept', right);
  assert.deepStrictEqual(card.wordy.doc_accept, [last], '自己在卡上重新按完成，廢話不會自己消失');
  const before = e.clock.minute;
  assert.deepStrictEqual(e.trimFiller('poc_login', 'doc_accept', last), []);
  assert.ok(!card.wordy.doc_accept, '全部刪完才算精簡'); assert.strictEqual(e.clock.minute, before, '刪的時間就是玩家點的時間，不另外扣');
  assert.ok(/廢話都刪掉了/.test(card.comments.at(-1).text));
  assert.strictEqual(e.trimFiller('poc_login', 'doc_accept', last), null, '沒東西可刪');
  assert.ok(byModel('Novel')); assert.ok(card.wordy.doc_accept.length >= 6, '再收一份 Novel 的，廢話又回來了');
  assert.ok(byModel('Essay')); assert.ok(!card.wordy.doc_accept, 'Essay 寫的蓋過去：沒有廢話');
  e.doWork('poc_login', 'doc_accept', right); assert.ok(!card.wordy.doc_accept, '自己寫的也沒有');
});

test('答案卡上先刪的廢話不跟著卡走：刪掉幾行就少幾行，全部刪完收下就是精簡的', () => {
  const e = startDay3(); tickTo(e, C.DAY_START_MIN + 91);
  const card = e.board.get('poc_approve'), spec = e.subtask(card, 'doc_spec').question, right = spec.items.map(it => it.answer);
  const job = { id: 1, model: 'Novel', answers: right, status: 'ready' }; (card.ai ||= {}).doc_spec = [job];
  const all = [...e.aiFiller(job, 'doc_spec')]; assert.ok(all.length >= 6);
  assert.deepStrictEqual(e.trimFiller('poc_approve', 'doc_spec', all[0], 1), all.slice(1));
  assert.strictEqual(e.trimFiller('poc_approve', 'doc_spec', '沒有這行', 1), null);
  assert.deepStrictEqual(e.aiFiller(job, 'doc_spec'), all.slice(1), '刪掉的不會回來');
  assert.ok(e.acceptAi('poc_approve', 'doc_spec', 1)); assert.deepStrictEqual(card.wordy.doc_spec, all.slice(1), '收下時還留著的跟著卡走');
  const clean = { id: 2, model: 'Novel', answers: right, status: 'ready' }; card.ai.doc_spec.push(clean);
  for (const line of [...e.aiFiller(clean, 'doc_spec')]) e.trimFiller('poc_approve', 'doc_spec', line, 2);
  assert.ok(e.acceptAi('poc_approve', 'doc_spec', 2)); assert.ok(!card.wordy.doc_spec, '全部刪完才收下：這份沒有廢話');
});

test('Novel 寫的資安問卷沒精簡就交出去：母議題通知群組後志豪在群組唸', () => {
  const e = startDay3(); tickTo(e, C.DAY_START_MIN + 91);
  const card = e.board.get('poc_compliance'), spec = e.subtask(card, 'doc_spec').question;
  (card.ai ||= {}).doc_spec = [{ id: 7, model: 'Novel', answers: spec.items.map(it => it.answer), status: 'ready' }];
  assert.ok(e.acceptAi('poc_compliance', 'doc_spec', 7) && card.wordy.doc_spec);
  for (const id of SUBS) e.board.get(id).status = 'archived';
  assert.ok(e.doWork('poc', 'deploy', [[0, 1, 2, 3]]) && e.notifyDone('poc'));
  tickTo(e, e.clock.minute + 20);
  assert.ok(e.docs.some(d => /^poc:trial:/.test(d.id) && /用人話寫/.test(d.text)));
});

test('退回選「用人話寫」：記進筆記、之後 Novel 寫的文件不再太長', () => {
  const e = startDay3(); tickTo(e, C.DAY_START_MIN + 91);
  const card = e.board.get('poc_approve'), spec = e.subtask(card, 'doc_spec').question, right = spec.items.map(it => it.answer);
  const job = { id: 1, model: 'Novel', answers: right, status: 'ready' }; (card.ai ||= {}).doc_spec = [job];
  assert.ok(e.isWordy(job, 'doc_spec'), '答案卡還沒收下就知道這份會太長');
  const r = e.reviseAi('poc_approve', 'doc_spec', 1, right, [{ key: 'style', fix: 'plain' }]);
  assert.ok(r && r.job && r.job.model === 'Novel');
  assert.ok(!e.isWordy(r.job, 'doc_spec'), '筆記寫了人話：下一份不會太長');
  assert.strictEqual(e.ai.notes.style.stance, 'plain'); assert.ok(e.aiNotes().some(n => /人話/.test(n.text)), 'CLAIRE.md 多一條');
  tickTo(e, r.job.doneAt + 1);
  assert.ok(e.acceptAi('poc_approve', 'doc_spec', r.job.id));
  assert.ok(!card.wordy.doc_spec, '筆記說了寫人話：Novel 這份不算太長');
});

test('額度不夠跑這個模型：講實話（Novel 要 2 格、只剩 1 格），不是「用完了」；退回也擋得住、筆記不會先寫進去', () => {
  const e = startDay3(); tickTo(e, C.DAY_START_MIN + 91);
  const card = e.board.get('poc_approve'), spec = e.subtask(card, 'doc_spec').question, right = spec.items.map(it => it.answer);
  (card.ai ||= {}).doc_spec = [{ id: 1, model: 'Novel', answers: right, status: 'ready' }];
  e.ai.left = 2; assert.strictEqual(e.aiLack('Novel'), null);
  e.ai.left = 1;
  assert.match(e.aiLack('Novel'), /2 格.*1 格/); assert.strictEqual(e.aiLack('Essay'), null, 'Essay 一格就夠');
  assert.strictEqual(e.reviseAi('poc_approve', 'doc_spec', 1, right, [{ key: 'style', fix: 'plain' }]), null);
  assert.strictEqual(e.ai.notes.style, undefined, '沒退成：筆記不寫'); assert.strictEqual(e.ai.left, 1, '額度沒扣');
  e.ai.left = 0; assert.match(e.aiLack('Essay'), /用完了/);
  const day2 = new Engine(DAY2.make(), PLAYER);   // 第二天沒有模型級距，一律一格
  day2.ai.left = 1; assert.strictEqual(day2.aiLack(), null);
  day2.ai.left = 0; assert.match(day2.aiLack(), /用完了/);
});

test('部署 SKILL 的提示：會議室收掉就教，不綁哪張卡；寫了就收，沒寫到 POC 進看板換下一句，後面不會卡住', () => {
  const afterMeeting = () => { const e = startDay3(); tickTo(e, C.DAY_START_MIN + 60); assert.strictEqual(e.meeting, null, '早會開完了'); e.emit('meeting:closed'); return e; };
  const shown = afterMeeting();
  assert.match(shown.hint.text, /新增規範/);
  assert.ok(shown.clock.isPaused, '跟其他提示一樣先停下來讓人看');
  shown.emit('doc:opened');
  assert.ok(!shown.clock.isPaused, '玩家動了就恢復，不用真的去寫');
  assert.match(shown.hint.text, /新增規範/, '提示留著');

  const wrote = afterMeeting();
  assert.ok(wrote.addSkill('deploy'));
  assert.strictEqual(wrote.hint, null, '寫了就收');
  tickTo(wrote, C.DAY_START_MIN + 91);
  assert.match(wrote.hint.text, /整組交辦/);

  tickTo(shown, C.DAY_START_MIN + 91);
  assert.match(shown.hint.text, /整組交辦/, '沒寫：POC 進看板時直接換成下一句');

  const noDesk = startDay3(); tickTo(noDesk, C.DAY_START_MIN + 91);
  assert.match(noDesk.hint.text, /整組交辦/, '沒等到會議室收掉也不會卡住後面');
});

test('CLAIRE.md 新增規範：寫了部署流程，AI 部署照順序做到底不再問、不會忘備份、不通知；沒寫照舊一步一步問', () => {
  const run = (withSkill) => {
    const e = startDay3(); tickTo(e, C.DAY_START_MIN + 181);
    assert.ok(e.skills().some(s => s.id === 'deploy'), '清單上有部署流程');
    if (withSkill) { assert.ok(e.addSkill('deploy')); assert.ok(!e.skills().some(s => s.id === 'deploy'), '寫過的從清單消失'); assert.ok(e.aiNotes().some(n => /部署/.test(n.text))); }
    const card = e.board.get('poc_login'), code = e.subtask(card, 'code').question;
    e.doWork('poc_login', 'code', code.functions.map(f => Object.fromEntries(Object.entries(f.fields).map(([k, fld]) => [k, fld.answer]))));
    const job = e.delegate('poc_login', 'deploy', 'Essay'); assert.ok(job);
    tickTo(e, job.doneAt + 1);
    return { e, card, job };
  };
  const a = run(true);
  assert.ok(a.card.done('deploy'), '有 SKILL：直接部署完');
  assert.deepStrictEqual(a.job.deploy.done, ['backup', 'upload', 'replace', 'smoke']);
  assert.ok(!a.card.earlyNotify && !a.card.noBackup, '沒通知、有備份');
  const b = run(false);
  assert.strictEqual(b.job.status, 'asking', '沒 SKILL：停在終端機問');
  assert.ok(!b.card.done('deploy'));
});

test('整理需求的讀法 SKILL：原則派筆記讓 AI 讀歪的扣分減半、情緒化加倍；沒寫照劇本的 readReqPenalty', () => {
  const e = startDay3();
  const base = e.aiModel('Essay').accuracy, penalty = e.script.ai.readReqPenalty;
  assert.ok(Math.abs(e.aiAccuracy('Essay', 'read_req') - (base - penalty)) < 1e-9);
  e.ai.notes.readReq = { stance: 'principle', text: 'x' };
  assert.ok(Math.abs(e.aiAccuracy('Essay', 'read_req') - (base - penalty / 2)) < 1e-9);
  e.ai.notes.readReq = { stance: 'emotional', text: 'x' };
  assert.ok(Math.abs(e.aiAccuracy('Essay', 'read_req') - (base - penalty * 2)) < 1e-9);
  assert.ok(Math.abs(e.aiAccuracy('Essay', 'code') - base) < 1e-9, '別的工作不受影響');
  // 三派句子：寫進 CLAIRE.md 是一條筆記；過於細節只對點名的區塊鏈有效
  const pick = (stance) => {
    const x = startDay3(); tickTo(x, C.DAY_START_MIN + 91);
    assert.ok(x.addSkill('readReq', stance) && x.ai.notes.readReq.stance === stance);
    const q = x.subtask(x.board.get('poc_approve'), 'read_req').question;
    return Works.aiAnswers(q, { accuracy: 0, seed: 's', notes: x.ai.notes }).answers[0];   // 正確率 0：沒筆記一定把區塊鏈挑進來
  };
  assert.ok(!pick('detail').includes(3), '細節派：區塊鏈不挑'); assert.ok(!pick('principle').includes(3), '原則派：區塊鏈不挑');
  assert.ok(pick('emotional').includes(3), '情緒化：不敢判斷，區塊鏈照單全收');
  assert.ok(startDay3().skills().find(s => s.id === 'readReq').options.every(o => o.say), '三句都寫了，畫面全列');
});

// 三派補充說明：新一代的 Claire 純罵不記筆記、罵戳到舊筆記的前提就劃掉、有事實才記事實
test('第三天的補充說明：純罵不留筆記、戳到第二天舊筆記就劃掉、原則派寫成第三天口吻', () => {
  const carry = { notes: { loadtest: { stance: 'never', text: '公司只有 200 人，一律不做壓測' }, approve: { stance: 'axian', text: '資產狀態一律等阿賢簽核過才改' } } };
  const e = new Engine(DAY3.make(carry), PLAYER); tickTo(e, C.DAY_START_MIN + 91);
  const card = e.board.get('poc_load'), q = e.subtask(card, 'doc_accept').question;
  const run = (base, fix) => { (card.ai ||= {}).doc_accept = [{ id: 1, model: 'Essay', answers: base, status: 'ready' }]; return e.reviseAi('poc_load', 'doc_accept', 1, base, [{ key: 'i0', fix }]); };
  const spots = Works.aiSpots(q, [2]);
  assert.deepStrictEqual(spots[0].fixes.map(f => f.say).slice(0, 2), ['你怎麼連壓力測試都辦不到？我們有付費耶！', '壓測要看預期規模決定要不要做、測試的程度。']);
  assert.ok(run([2], 0), '情緒化那句');
  assert.strictEqual(e.ai.notes.loadtest, undefined, '戳到「200 人不壓測」的前提：那條劃掉、不另寫');
  assert.strictEqual(e.ai.notes.approve.stance, 'axian', '別的主題不動');
  assert.ok(run([2], 1), '原則那句');
  assert.strictEqual(e.ai.notes.loadtest.stance, 'scale'); assert.ok(!/一律/.test(e.ai.notes.loadtest.text), '第三天口吻不寫一律');
  // 純罵沒內容：沒有 set，筆記一條都不多
  const code = e.subtask(e.board.get('poc_approve'), 'code').question;
  const dept = Works.aiSpots(code, [{ who: 0 }, { rule: 0 }, { from: 2 }]).find(s => s.key === 'f2.from');
  assert.strictEqual(dept.fixes[0].say, '你做的根本不能用。'); assert.deepStrictEqual(Works.fixNotes(dept.fixes[0], e.script.ai.topics), {}); assert.deepStrictEqual(Works.fixDrops(dept.fixes[0]), []);
  assert.deepStrictEqual(Works.fixDrops(Works.aiSpots(code, [{ who: 1 }]).find(s => s.key === 'f0.who').fixes[0]), ['approve'], '「你要累死阿賢嗎」劃掉簽核那條');
});

test('第三天新開的做法套得上：清單帳號、jQuery 釘版本、回答來源、不加 BOM', () => {
  const e = startDay3(); tickTo(e, C.DAY_START_MIN + 243);
  const approve = e.subtask(e.board.get('poc_approve'), 'code').question;
  assert.deepStrictEqual(Works.applyNotes(approve, [{ who: 1 }, { rule: 1 }, { from: 2 }], { approve: { stance: 'allowlist' }, serial: { stance: 'sahe' }, dept: { stance: 'saheHr' } }), [{ who: 3 }, { rule: 0 }, { from: 0 }]);
  assert.ok(approve.functions[0].fields.who.fires[3], '清單上沒有新人：志豪會講');
  const login = e.subtask(e.board.get('poc_login'), 'code').question;
  assert.strictEqual(Works.applyNotes(login, [{ source: 1 }, { where: 1 }, { how: 1 }], { auth: { stance: 'allowlist' }, login: { stance: 'sahe' }, pwreset: { stance: 'sahe' } })[2].how, 3);
  const upgrade = e.subtask(e.board.get('poc_compliance'), 'code').question;
  assert.strictEqual(Works.applyNotes(upgrade, [{ how: 1 }], { upgrade: { stance: 'pin' } })[0].how, 4);
  const bot = e.subtask(e.board.get('poc_bot'), 'code').question;
  assert.deepStrictEqual(Works.applyNotes(bot, [{ scope: 2 }, { source: 1 }], { chatbot: { stance: 'faqOnly' }, botSource: { stance: 'keepIn' } }), [{ scope: 0 }, { source: 0 }]);
  const spec = e.subtask(e.board.get('poc_bot'), 'doc_spec').question;
  assert.ok(Works.applyNotes(spec, [[0, 1, 3]], { botSource: { stance: 'manual' } })[0].includes(2), '規格補回「盤點資料不送外部 AI」');
  // 只記得 MFA 不用做的細節派：別的多加的照加
  const ui = e.subtask(e.board.get('poc_approve'), 'ui_design').question;
  assert.deepStrictEqual(Works.applyNotes(ui, [[0], [0, 1, 2, 3, 5, 6], [0, 1], 0], { scope: { stance: 'noMfa' } })[1], [0, 1, 2, 3, 5, 6]);
  assert.deepStrictEqual(Works.applyNotes(ui, [[0], [0, 1, 2, 3, 5, 6], [0, 1], 0], { scope: { stance: 'trim' } })[1], [0, 1, 2, 3]);
  assert.deepStrictEqual(Works.applyNotes(ui, [[0], [0, 1, 2, 3, 5, 6], [0, 1], 0], { scope: { stance: 'spec' } })[1], [0, 1, 2, 3], '原則派不會被塞進「匯出 Excel」');
  assert.strictEqual(Works.firstAsks(ui, { scope: { stance: 'ask' } }).length, 3, '先問派三項都還會問');
});

// ── 亂象小卡與技術支援卡──
const draft = (assignee, sentences) => ({ assignee, sentences, attach: true, type: 'feature', module: null });
const ids = (e) => e.docs.map(d => d.id);
const toFillNames = (e, card) => { const q = e.subtask(card, 'code').question; const ctx = e.aiCtx(card); return Works.functionsToFill(q, ctx.covered, ctx.picks).map(i => q.functions[i].name); };

test('財務的三頁報告：轉給怡君秒過、原文整份搬上卡、修辭句的 function 全要填；自己只挑那一句就沒有東西要填', () => {
  const e = startDay3(); tickTo(e, C.DAY_START_MIN + 30);
  assert.ok(ids(e).includes('finance_report'));
  e.openCardFrom('finance_report', draft('sa', [0])); tickTo(e, e.clock.minute + 2);
  const sa = e.board.get('finance_report:sa');
  assert.ok(!sa.pending && /賦能/.test(sa.body), '一分鐘就回來，內文是原文');
  assert.deepStrictEqual(toFillNames(e, sa), ['optimizeReportFlow', 'aiDepreciationForecast', 'cutReportTime65']);
  const f = startDay3(); tickTo(f, C.DAY_START_MIN + 30);
  assert.deepStrictEqual(toFillNames(f, f.openCardFrom('finance_report', draft('self', [0]))), []);
  const g = startDay3(); tickTo(g, C.DAY_START_MIN + 30);
  assert.deepStrictEqual(toFillNames(g, g.openCardFrom('finance_report', draft('self', [0, 3]))), ['aiDepreciationForecast'], '挑了修辭句，那句的 function 要自己填');
});

test('小潘的 PR：看完就結案；按 LGTM 下午上線小潘在 LIME 找你', () => {
  const e = startDay3(); tickTo(e, C.DAY_START_MIN + 151);
  const card = e.openCardFrom('pan_pr_line', draft('self', [0]));
  assert.strictEqual(card.id, 'pan_pr');
  const r = e.doWork('pan_pr', 'review_back', { marks: [], lgtm: true });
  assert.ok(r.skipped && card.status === 'archived', '檢閱做完就結案');
  tickTo(e, C.DAY_START_MIN + 452);
  assert.ok(ids(e).includes('pan_pr:fire:review_back'), '16:30 小潘：整頁白掉');
});

test('老闆的簡介：漏攔的那幾句，佩珊在 POC 群組一句一句問', () => {
  const e = startDay3(); tickTo(e, C.DAY_START_MIN + 332);
  assert.strictEqual(e.visitor && e.visitor.id, 'boss_brochure');
  const doc = e.talkTo('boss_brochure'); assert.ok(doc.reply);
  e.replyTo('boss_brochure', [[0]]); tickTo(e, e.clock.minute + 100);
  const misses = e.docs.filter(d => /^boss_brochure:miss/.test(d.id));
  assert.deepStrictEqual(misses.map(d => d.id), ['boss_brochure:miss:1', 'boss_brochure:miss:2']);
  assert.ok(misses.every(d => d.group === DAY3.POC && /ISO|自動盤點/.test(d.text)));
});

test('鄭哥的額度：沒回每 30 分鐘追；回「申請加購」下午財務來要效益分析；早會推掉窗口就都不來', () => {
  const e = startDay3(); tickTo(e, C.DAY_START_MIN + 125);
  assert.deepStrictEqual(ids(e).filter(i => /ai_support_quota:nag/.test(i)), ['ai_support_quota:nag:0', 'ai_support_quota:nag:1']);
  e.replyTo('ai_support_quota', [1]); tickTo(e, C.DAY_START_MIN + 200);
  assert.strictEqual(ids(e).filter(i => /ai_support_quota:nag/.test(i)).length, 2, '回了就不追');
  tickTo(e, C.DAY_START_MIN + 332); assert.ok(ids(e).includes('finance_quota'));
  const d = startDay3(); d.flags.support_declined = true; tickTo(d, C.DAY_START_MIN + 272);
  assert.ok(!ids(d).includes('ai_support_quota') && !ids(d).includes('ai_support_page'));
});

test('行銷部的活動頁：檢閱勾到的進開發與驗收，沒勾的照行銷部原樣', () => {
  const e = startDay3(); tickTo(e, C.DAY_START_MIN + 271);
  e.openCardFrom('ai_support_page', draft('sa', [0, 1])); tickTo(e, e.clock.minute + 2);
  const card = e.board.get('ai_support_page:sa');
  assert.ok(!card.pending && card.screen.campaign && card.reviewSays.review_front);
  e.doWork(card.id, 'review_front', { marks: [{ key: 'product', reason: 'broken' }, { key: 'submit', reason: 'covered' }], hintsUsed: 0 });
  e.doWork(card.id, 'review_back', { marks: [{ key: 2, reason: 'local_pii' }, { key: 4, reason: 'get_pii' }] });
  assert.deepStrictEqual(toFillNames(e, card), ['fixImages', 'fixMobileButton', 'storeOnServer', 'postNotGet']);
  const acc = e.subtask(card, 'doc_accept').question.items[0];
  assert.deepStrictEqual(Works.givenOptions(acc, card.picks, (w) => e.aiCtx(card).done.includes(w)), [0, 1, 3, 4]);
});

test('提示鏈：寫 Skill → 交辦 → 挑模型 → 整組好了 → 手動測試 → 上 POC → 通知', () => {
  const e = startDay3(); const seen = [];
  e.on('hint', (h) => seen.push(h.text.slice(0, 4)));
  for (const ev of ['meeting:closed', 'skill:deploy', 'card:arrived:poc', 'ai:picking', 'ai:started', 'ai:group_ready', 'work:opened', 'work:done:poc_approve:code',
    'work:done:poc_approve:manual_test', 'gate:open:poc', 'work:done:poc:deploy']) e.emit(ev);
  assert.deepStrictEqual(seen, ['部署可以', 'POC ', '挑模型：', '整組都好', '手動測試', '登入、簽', '在母議題']);
});

test('提示鏈：從來不整組交辦、不寫規範自己部署，也走得到上 POC 那句', () => {
  const e = startDay3(); const seen = [];
  e.on('hint', (h) => seen.push(h.text.slice(0, 4)));
  for (const ev of ['card:arrived:poc', 'ai:picking', 'ai:started', 'work:done:poc_bot:code', 'work:done:poc_bot:manual_test',
    'work:done:poc_bot:deploy', 'work:done:*:deploy', 'gate:open:poc']) e.emit(ev);
  assert.deepStrictEqual(seen, ['POC ', '挑模型：', '手動測試', '登入、簽']);
});

test('每個 function 都有白話說明：開發畫面的註解靠它，非 IT 的玩家才看得懂在問什麼', () => {
  const seen = new Set(), missing = []; let total = 0;
  const walk = (node) => {
    if (!node || typeof node !== 'object' || seen.has(node)) return; seen.add(node);
    for (const f of Array.isArray(node.functions) ? node.functions : []) { total++; if (!f.does) missing.push(f.name); }
    Object.values(node).forEach(walk);
  };
  for (const day of [require('../day1.js'), DAY2, DAY3]) walk(day.make ? day.make() : day);
  assert.ok(total > 60, `只走到 ${total} 個`); assert.deepStrictEqual(missing, []);
});

test('整組交辦每一份都好了才發 ai:group_ready（一次）', () => {
  const e = startDay3(); tickTo(e, C.DAY_START_MIN + 100);
  let ready = 0; e.on('ai:group_ready', () => ready++);
  const jobs = e.delegateGroup('poc_approve', 'docs', 'Verse'); assert.ok(jobs && jobs.length > 1);
  tickTo(e, Math.max(...jobs.map(j => j.doneAt)) + 1);
  assert.strictEqual(ready, 1);
});

test('結算卡：客戶在群組追問幾次（POC 還沒上，12:00 佩珊來問算一次）；沒試用過不列試用那行', () => {
  const e = startDay3(); tickTo(e, C.DAY_START_MIN + 185);
  const tally = e.report().tally.map(t => t.text);
  assert.ok(tally.includes('客戶在群組追問：1 次'), tally.join('\n'));
  assert.ok(!tally.some(t => t.startsWith('客戶試用時')), '還沒通知群組、客戶沒試用');
  assert.ok(!new Engine(DAY2.make(), PLAYER).report().tally.some(t => t.text.startsWith('客戶在群組追問')), '第二天沒有客戶');
});

test('結算卡 AI 那組：挑模型各用幾次（整組交辦每一份各算一次）', () => {
  const e = startDay3(); tickTo(e, C.DAY_START_MIN + 100);
  assert.ok(e.delegateGroup('poc_approve', 'docs', 'Verse'));
  assert.ok(e.delegate('poc_compliance', 'read_req', 'Novel'));
  const line = e.aiTally().find(t => t.startsWith('挑模型'));
  assert.match(line, /Verse 5 ×\d/); assert.match(line, /Novel 5 ×1/); assert.doesNotMatch(line, /Essay/);
});

test('提示鏈：整天不碰 AI 的玩家，自己做完程式就接到手動測試那句', () => {
  const e = startDay3(); const seen = [];
  e.on('hint', (h) => seen.push(h.text.slice(0, 4)));
  for (const ev of ['card:arrived:poc', 'work:done', 'work:done:poc_bot:code']) e.emit(ev);
  assert.deepStrictEqual(seen, ['POC ', '手動測試']);
});

test('每一張部署題都算得出分數：正解滿分，備份和上傳對調也算對，亂排不會出現 NaN', () => {
  const Day1 = require('../day1.js'), Day2 = require('../day2.js');
  const scripts = [Day1.DAY1 || Day1, (Day2.DAY2 || Day2).make(), DAY3.make({ notes: {} })];
  const questions = [];
  for (const s of scripts) for (const c of [...(s.cards || []), ...(s.sources || []), ...(s.sources || []).map(x => x.cardSpec || {})]) for (const st of c.subtasks || []) if (st.question && st.question.roles) questions.push({ id: c.id, q: st.question });
  assert.ok(questions.some(x => x.id === 'poc'), '有掃到 POC 那張');
  for (const { id, q } of questions) {
    const item = q.items[0], { backup, upload } = q.roles;
    assert.strictEqual(Works.grade(q, [item.answer]).score, 1, `${id} 正解要滿分`);
    const swapped = item.answer.map(i => (i === backup ? upload : i === upload ? backup : i));
    if (!(q.roles.replace === undefined && q.roles.seed === undefined)) assert.strictEqual(Works.grade(q, [swapped]).score, 1, `${id} 備份在上傳前後都對`);
    for (const order of [[], [...item.answer].reverse(), item.options.map((_, i) => i), item.ai ? item.ai.pick : []]) assert.ok(Number.isFinite(Works.grade(q, [order]).score), `${id} 的 ${order} 要算得出分數`);
  }
});

test('排序題的 before 是空的時候照全對才給分，不會除以零', () => {
  const q = { items: [{ text: '步驟', type: 'order', options: ['甲', '乙'], answer: [0, 1], before: [] }] };
  assert.strictEqual(Works.grade(q, [[0, 1]]).score, 1);
  assert.strictEqual(Works.grade(q, [[1, 0]]).score, 0);
});
