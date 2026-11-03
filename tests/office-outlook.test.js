// tests/office-outlook.test.js（node --test）：第一關「美玲的信箱滿了」整張卡——13:30 來訊、問她、正解、四個錯誤、檢討報告卡、下午又滿開新卡、結算卡
const test = require('node:test');
const assert = require('node:assert');
const { C } = require('../contract.js');
const { Engine } = require('../engine.js');
const { Sandbox } = require('../sandbox.js');
require('../sandbox-blur.js');

const MEILING = '財務 美玲';
const play = () => new Engine(Sandbox.make('blur', 'legacy'), { name: '測試', title: '工程師' });
const tickTo = (e, minute) => { while (e.clock.minute < minute && !e.ended) e.tick(C.MS_PER_GAME_MIN); };
const at = (h, m) => h * 60 + m;
const asked = () => { const e = play(); tickTo(e, at(13, 31)); return e; };
const lines = (e, from) => e.docs.filter(d => d.from === from && d.origin === 'line').map(d => d.text);
const act = (e, ...actions) => actions.map(a => e.benchAct('outlook', a));
const peers = (e) => e.script.report(e).peers.map(p => `${p.who}：${p.text}`);

test('13:30 美玲 LIME 說信寄不出去（可以開卡）；問她附件，她說信都很重要', () => {
  const e = play();
  tickTo(e, at(13, 29));
  assert.ok(!e.docs.some(d => d.id === 'outlook_ask'));
  tickTo(e, at(13, 31));
  const ask = e.docs.find(d => d.id === 'outlook_ask');
  assert.ok(ask && ask.sentences.length && ask.chore === 'outlook');
  const o = e.contactOptions(MEILING).find(x => x.say.startsWith('信箱裡有沒有'));
  e.talk(o.talkId, o.i);
  tickTo(e, e.clock.minute + 5);
  assert.ok(lines(e, MEILING).includes('我的信都很重要，沒有亂存東西。'));
});

test('正解：刪尾牙影片和型錄、清空刪除的郵件 → 寄得出去、低於安全線（美玲說寬敞）；第二輪轉寄進來也沒事（換一句還好清得夠乾淨）', () => {
  const e = asked();
  act(e, { type: 'delete', ids: ['video', 'catalog'] });
  assert.notStrictEqual(e.chores.outlook.stage, 'done', '只刪不清空，容量沒少');
  act(e, { type: 'purge', inPerson: true });
  assert.strictEqual(e.chores.outlook.stage, 'done');
  assert.ok(peers(e).includes(`${MEILING}：信箱好寬敞，像剛報完帳。`));
  assert.ok(e.script.report(e).extra.includes('美玲的信箱清掉 504 MB'));
  tickTo(e, e.clock.minute + 65);
  assert.strictEqual(e.chores.outlook.stage, 'done');
  assert.ok(!lines(e, MEILING).includes('又寄不出去了！剛剛不是清過了嗎？'));
  assert.ok(peers(e).includes(`${MEILING}：下午尾牙影片又被轉寄一輪，還好你清得夠乾淨。`));
});

test('只清掉尾牙影片：寄得出去；60 分鐘後第二輪轉寄又爆，美玲那則可以開新卡（掛同一件雜事），結算卡多一句', () => {
  const e = asked();
  act(e, { type: 'delete', ids: ['video'] }, { type: 'purge', inPerson: true });
  assert.strictEqual(e.chores.outlook.stage, 'done');
  tickTo(e, e.clock.minute + 61);
  assert.strictEqual(e.chores.outlook.stage, 'doing');
  const again = e.docs.find(d => d.from === MEILING && d.text === '又寄不出去了！剛剛不是清過了嗎？');
  assert.ok(again && again.sentences.length && again.chore === 'outlook');
  assert.ok(peers(e).includes(`${MEILING}：下午又滿了，你是不是沒清乾淨？`));
});

test('封存檔放共用槽：30 分鐘後君傑、淑芬抱怨；結算卡君傑那句', () => {
  const e = asked();
  act(e, { type: 'archiveTo', place: 'share' }, { type: 'archive', ids: ['video', 'drafts'] });
  assert.strictEqual(e.chores.outlook.stage, 'done');
  tickTo(e, e.clock.minute + 33);
  assert.ok(lines(e, '業務 君傑').includes('共用槽滿了，我的報價單存不進去！'));
  assert.ok(lines(e, '行政 淑芬').includes('共用槽是不是滿了？會議記錄存不了。'));
  assert.ok(peers(e).includes('業務 君傑：共用槽滿的那段時間，我的報價單存不進去。'));
});

// 刪會計師的信並清空，一路走到 IT 經理來信，開出檢討報告卡
const reportCard = () => {
  const e = asked();
  act(e, { type: 'delete', ids: ['audit', 'video'] }, { type: 'purge' });
  tickTo(e, at(15, 41));
  const mail = e.docs.find(d => d.origin === 'mail' && d.from === 'IT 經理');
  return { e, mail, card: e.openCardFrom(mail.id, { assignee: 'me' }) };
};

test('刪了會計師的信並清空：15:30 美玲來問，IT 經理來信要檢討報告，從信開出檢討報告卡（需求單位是美玲）', () => {
  const e = asked();
  act(e, { type: 'delete', ids: ['audit', 'video'] }, { type: 'purge' });
  tickTo(e, at(15, 29));
  assert.ok(!lines(e, MEILING).includes('會計師要上次寄的查帳資料，我信箱裡怎麼找不到了？'));
  tickTo(e, at(15, 41));
  assert.ok(lines(e, MEILING).includes('會計師要上次寄的查帳資料，我信箱裡怎麼找不到了？'));
  const mail = e.docs.find(d => d.origin === 'mail' && d.from === 'IT 經理');
  assert.ok(mail && /測試：/.test(mail.text), '信裡的玩家名稱換成名字');
  const card = e.openCardFrom(mail.id, { assignee: 'me' });
  assert.strictEqual(card.id, 'outlook_report');
  assert.deepStrictEqual(card.subtasks.map(s => s.work), ['report']);
  assert.strictEqual(card.requester, MEILING);
  assert.ok(peers(e).includes(`${MEILING}：會計師要的資料不見了，我被唸了一頓。`));
});

test('檢討報告卡交給 IT 經理驗（不是阿姿）：30 分鐘後 IT 經理 LIME 說看過了、進已完成，通知需求單位發給美玲', () => {
  const { e, card } = reportCard();
  assert.strictEqual(e.reviewerOf(card), 'IT 經理');
  e.submit(card.id);
  assert.strictEqual(card.status, 'to_qc');
  tickTo(e, e.clock.minute + 31);
  assert.strictEqual(card.status, 'archived');
  assert.ok(lines(e, 'IT 經理').some(t => t.endsWith('報告看過了，進已完成。')));
  assert.ok(!lines(e, 'QC 阿姿').length, '阿姿不會出現');
  e.notifyDone(card.id);
  const sent = e.docs.find(d => d.id === `${card.id}:notified`);
  assert.strictEqual(sent.from, MEILING);
  assert.ok(sent.text.endsWith('經理看過了，會計師要的資料照報告處理。'));
});

test('檢討報告卡驗過後沒通知：30 分鐘後美玲來問', () => {
  const { e, card } = reportCard();
  e.submit(card.id);
  tickTo(e, e.clock.minute + 62);
  assert.ok(lines(e, MEILING).includes('那個……好了嗎？沒人跟我說。'));
});

test('檢討報告卡回家才交：停在待驗收（IT 經理也下班了），照樣結算', () => {
  const { e, card } = reportCard();
  tickTo(e, C.OFF_WORK_MIN);
  e.leave();
  e.goHome({ channel: 'pickup', order: {}, laptop: true });
  e.home.vpn = 'on';
  e.submit(card.id);
  assert.strictEqual(card.status, 'to_qc');
  tickTo(e, e.clock.minute + 60);
  assert.strictEqual(card.status, 'to_qc');
  assert.ok(e.finishDay(), '結算照出');
});

test('雜事卡照舊沒有人驗：卡上是結案', () => {
  const e = asked();
  const ask = e.docs.find(d => d.id === 'outlook_ask');
  const card = e.openCardFrom(ask.id, { assignee: 'me', sentences: [0] });
  assert.strictEqual(e.reviewerOf(card), null);
  e.closeCard(card.id);
  assert.strictEqual(card.status, 'archived');
  const report = e.finishDay();
  assert.ok(report.lines.includes('處理了 1 件'), '自己結案的雜事卡也算處理了一件');
});

test('刪了會計師的信但還沒清空：移回收件匣就沒事', () => {
  const e = asked();
  act(e, { type: 'delete', ids: ['audit', 'video'] }, { type: 'restore', ids: ['audit'] }, { type: 'purge' });
  tickTo(e, at(16, 0));
  assert.ok(!e.docs.some(d => d.from === 'IT 經理'));
});

test('叫美玲自己刪：她刪一封說還是滿的，結算卡記一句', () => {
  const e = asked();
  const o = e.contactOptions(MEILING).find(x => x.say.startsWith('你可以自己刪'));
  e.talk(o.talkId, o.i);
  tickTo(e, e.clock.minute + 5);
  assert.ok(lines(e, MEILING).includes('刪了一封，還是滿的。'));
  assert.ok(peers(e).includes(`${MEILING}：我自己刪了一封，還是滿的。`));
});

test('人在她座位清好：當面道謝，不傳 LIME；人在自己座位清好：一分鐘後 LIME', () => {
  const near = asked();
  act(near, { type: 'delete', ids: ['video', 'catalog'] }, { type: 'purge', inPerson: true });
  tickTo(near, near.clock.minute + 3);
  assert.ok(!lines(near, MEILING).includes('可以寄了，謝謝！'));
  const far = asked();
  act(far, { type: 'delete', ids: ['video', 'catalog'] }, { type: 'purge' });
  tickTo(far, far.clock.minute + 3);
  assert.ok(lines(far, MEILING).includes('可以寄了，謝謝！'));
});

test('自己結案的卡算進印章：從最新的雜事卡往回結案是 Stack', () => {
  const e = asked();
  const cards = ['ram_ask', 'toner_ask', 'outlook_ask'].map(id => e.openCardFrom(id, { assignee: 'me', sentences: [0] }));
  for (const card of [...cards].reverse()) { e.openCard(card.id); e.closeCard(card.id); }
  assert.strictEqual(e.finishDay().kind, 'Stack');
});
