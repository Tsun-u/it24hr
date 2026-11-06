// tests/office-claire.test.js（node --test）：第一關的問 Claire（hybrid、speedrun）與 legacy 問小潘——題目何時出現、額度、模型、
// 「這件事需要手」、Pedia 一天一次、B8964 幻覺接上客服、這關不能交給 AI、全域 CLAIRE.md 帶進來、speedrun 老闆那句、結算卡
const test = require('node:test');
const assert = require('node:assert');
const { C } = require('../contract.js');
const { Engine } = require('../engine.js');
const { Sandbox } = require('../sandbox.js');
require('../sandbox-blur.js');

const play = (mode, carry) => new Engine(Sandbox.make('blur', mode, carry), { name: '測試', title: '工程師' });
const tickTo = (e, minute) => { while (e.clock.minute < minute && !e.ended) e.tick(C.MS_PER_GAME_MIN); };
const at = (h, m) => h * 60 + m;
const topic = (e, id) => e.claireTopics().find(t => t.id === id);
const answers = (e) => { const out = []; e.on('claire:answer', (x) => out.push(x)); return out; };
const PAN = '同事 小潘';
const panLines = (e) => e.docs.filter(d => d.from === PAN && d.origin === 'line' && d.kind !== 'sent').map(d => d.text);

test('hybrid：君傑開口（09:20）之後才問得到加記憶體那三題，還有「幫我加記憶體」', () => {
  const e = play('hybrid');
  tickTo(e, at(9, 19));
  assert.ok(!topic(e, 'ram'));
  tickTo(e, at(9, 21));
  const ram = topic(e, 'ram');
  assert.deepStrictEqual(ram.asks.map(a => a.say), ['怎麼看記憶體是 DDR 幾？', '君傑的電腦是 DDR 幾？', '哪條記憶體最快？']);
  assert.strictEqual(ram.hands, '幫我加記憶體');
});

test('Verse 問淑芬的印表機型號：扣 1 格、1 分鐘後編出 B8964，記下 toner:b8964，客服那邊報得出 B8964', () => {
  const e = play('hybrid'); const got = answers(e);
  tickTo(e, at(9, 51));
  const left = e.ai.left;
  assert.strictEqual(e.askClaire('toner', 'model', 'Verse').wait, 1);
  assert.strictEqual(e.ai.left, left - 1);
  assert.ok(!e.knows.has('toner:b8964'), '還沒回答前不知道');
  tickTo(e, e.clock.minute + 1);
  assert.deepStrictEqual(got[0].lines, ['淑芬的印表機應該是 MP LazyJet B8964。']);
  assert.ok(e.knows.has('toner:b8964'));
});

test('Essay 多一句收尾、多等一分鐘；Novel 扣 2 格、4 分鐘後印開頭和本文', () => {
  const e = play('hybrid'); const got = answers(e);
  tickTo(e, at(9, 21));
  e.askClaire('ram', 'ddr_how', 'Essay');
  tickTo(e, e.clock.minute + 2);
  assert.strictEqual(got[0].lines[got[0].lines.length - 1], '以上，供您參考。');
  const left = e.ai.left;
  e.askClaire('ram', 'ddr_how', 'Novel');
  assert.strictEqual(e.ai.left, left - 2);
  tickTo(e, e.clock.minute + 4);
  assert.strictEqual(got[1].lines[0], '這是一個好問題，值得我們從頭談起。');
  assert.ok(got[1].lines.some(l => l.includes('Ctrl、Shift、Esc')), '關鍵藏在本文中間');
});

test('「幫我加記憶體」：Claire 說這件事需要手，不扣額度、不算問了一次', () => {
  const e = play('hybrid'); const got = answers(e);
  tickTo(e, at(9, 21));
  const left = e.ai.left;
  e.askClaire('ram', 'hands');
  assert.deepStrictEqual(got[0].lines, ['這件事需要手。']);
  assert.strictEqual(e.ai.left, left);
  assert.strictEqual(e.hints.asked, 0);
});

test('額度不夠的模型問不了：回說明、不扣', () => {
  const e = play('hybrid');
  tickTo(e, at(9, 21));
  e.ai.left = 1;
  const r = e.askClaire('ram', 'ddr_how', 'Novel');
  assert.match(r.error, /Novel.*2 格/);
  assert.strictEqual(e.ai.left, 1);
});

test('問題各自的條件：收到阿賢的信之前問不出「這兩台哪台比較好？」「InkJot 是什麼？」', () => {
  const e = play('hybrid');
  tickTo(e, at(9, 51));
  assert.deepStrictEqual(topic(e, 'toner').asks.map(a => a.id), ['model', 'kinds']);
  e.know('toner:d87');
  assert.deepStrictEqual(topic(e, 'toner').asks.map(a => a.id), ['better', 'model', 'kinds', 'inkjot']);
});

test('speedrun 有 Pedia：問一句 3 格、一天一次；問個別設備先說查不到、不記 B8964；hybrid 沒有 Pedia', () => {
  const e = play('speedrun'); const got = answers(e);
  tickTo(e, at(9, 51));
  const left = e.ai.left;
  e.askClaire('toner', 'model', 'Pedia');
  assert.strictEqual(e.ai.left, left - 3);
  tickTo(e, e.clock.minute + 3);
  assert.deepStrictEqual(got[0].lines.slice(0, 2), ['條目「印表機」', '本百科不收錄個別設備之資料。以下為相關條目。']);
  assert.ok(!e.knows.has('toner:b8964'));
  assert.match(e.askClaire('toner', 'kinds', 'Pedia').error, /一天只能用一次/);
  assert.ok(!play('hybrid').aiModel('Pedia'));
});

test('檢討報告可以交給 AI 寫；Pedia 也能交辦單件（3 格），跟問一句共用一天一次', () => {
  const reportCard = (mode) => {
    const e = play(mode);
    tickTo(e, at(13, 31));
    e.benchAct('outlook', { type: 'delete', ids: ['audit', 'video'] }); e.benchAct('outlook', { type: 'purge' });
    tickTo(e, at(15, 41));
    const mail = e.docs.find(d => d.origin === 'mail' && d.from === 'IT 經理');
    return { e, card: e.openCardFrom(mail.id, { assignee: 'me' }) };
  };
  const { e, card } = reportCard('hybrid');
  assert.strictEqual(e.delegable(card, 'report'), true);
  const left = e.ai.left;
  assert.ok(e.delegate(card.id, 'report', 'Essay'));
  assert.strictEqual(e.ai.left, left - 1);
  const fast = reportCard('speedrun');
  const before = fast.e.ai.left;
  assert.ok(fast.e.delegate(fast.card.id, 'report', 'Pedia'));
  assert.strictEqual(fast.e.ai.left, before - 3);
  assert.deepStrictEqual(fast.e.modelUses.Pedia, [`#${fast.card.no} 寫檢討報告`]);
  assert.match(fast.e.askClaire('toner', 'kinds', 'Pedia').error, /一天只能用一次/, '交辦過就不能再問');
  assert.strictEqual(fast.e.delegate(fast.card.id, 'report', 'Pedia'), null, '也不能再交辦');
});

test('「幫我設定老闆娘的手機」：Claire 說沒有權限動公司的網路設定，不扣額度', () => {
  const e = play('hybrid'); const got = answers(e);
  tickTo(e, at(12, 0));   // 老闆娘 11:00 走到桌邊，講完或留了紙條才算來過
  assert.ok(topic(e, 'wifi'));
  const left = e.ai.left;
  e.askClaire('wifi', 'hands');
  assert.deepStrictEqual(got[0].lines, ['我沒有權限去動公司的網路設定。']);
  assert.strictEqual(e.ai.left, left);
});

test('hybrid 也能問小潘：回得跟 legacy 一樣，但會唸你怎麼不問 Claire', () => {
  const e = play('hybrid');
  tickTo(e, at(9, 51));
  const ask = e.contactOptions(PAN).find(o => o.say === '噴墨和雷射差在哪？');
  e.talk(ask.talkId, ask.i);
  tickTo(e, e.clock.minute + 20);
  assert.ok(panLines(e).includes('噴墨吃墨水匣，雷射吃碳粉匣。會叫碳粉不足的就是雷射。\n……話說你怎麼不問 Claire？公司有買欸。'));
});

test('speedrun 問小潘：他把問 Claire Essay 的回答原封不動貼過來，型號那題照貼 B8964', () => {
  const e = play('speedrun');
  tickTo(e, at(9, 51));
  const ask = e.contactOptions(PAN).find(o => o.say === '淑芬的印表機是什麼型號？');
  e.talk(ask.talkId, ask.i);
  tickTo(e, e.clock.minute + 20);
  assert.ok(panLines(e).includes('淑芬的印表機應該是 MP LazyJet B8964。\n以上，供您參考。'));
  assert.ok(e.knows.has('toner:b8964'));
  assert.strictEqual(e.hints.asked, 0, '小潘替你問的不算你問 Claire');
});

test('全域 CLAIRE.md 帶進來：hybrid 開工時的 AI 筆記就是存檔那份', () => {
  const notes = { readReq: { stance: 'principle', text: '整理需求先看原文' } };
  const e = play('hybrid', { notes });
  assert.deepStrictEqual(e.aiNotes().map(n => n.topic), ['readReq']);
  assert.strictEqual(play('legacy', { notes }).ai, null);
});

test('人在同事座位問不了（終端機要回座位）', () => {
  const e = play('hybrid');
  tickTo(e, at(9, 31));
  e.walk('junjie');
  assert.strictEqual(e.askClaire('ram', 'ddr_how', 'Verse'), null);
});

test('legacy 沒有 Claire：問小潘，20 分鐘後回、問過就劃掉；問型號他提示能問阿賢，不會編 B8964', () => {
  const e = play('legacy');
  assert.strictEqual(e.ai, null);
  assert.deepStrictEqual(e.claireTopics(), []);
  tickTo(e, at(9, 51));
  const ask = e.contactOptions(PAN).find(o => o.say === '淑芬的印表機是什麼型號？');
  e.talk(ask.talkId, ask.i);
  tickTo(e, e.clock.minute + 19);
  assert.ok(!panLines(e).length);
  tickTo(e, e.clock.minute + 1);
  assert.ok(panLines(e).includes('我哪知道？除了淑芬大概就阿賢有機會了，財標都他貼的。'));
  assert.ok(!e.knows.has('toner:b8964'));
  assert.ok(!e.contactOptions(PAN).some(o => o.say === '淑芬的印表機是什麼型號？'), '問過劃掉');
});

test('speedrun 14:00 碳粉匣還沒換好：老闆傳那句；hybrid、legacy 不傳', () => {
  const boss = (e) => e.docs.filter(d => d.from === '老闆' && d.text === '公司花這麼多錢買 AI，碳粉為什麼還沒換？');
  for (const [mode, n] of [['speedrun', 1], ['hybrid', 0], ['legacy', 0]]) {
    const e = play(mode); tickTo(e, at(14, 1));
    assert.strictEqual(boss(e).length, n, mode);
  }
});

test('結算卡：問了 Claire 幾次花了幾格、寫了幾份文件；問小潘三個時代都列、名詞不同；speedrun 問過 Pedia 有今日王牌模型用途', () => {
  const askPan = (e) => { const o = e.contactOptions(PAN).find(x => x.say === '噴墨和雷射差在哪？'); e.talk(o.talkId, o.i); };
  const e = play('hybrid');
  tickTo(e, at(9, 51));
  e.askClaire('toner', 'kinds', 'Verse'); e.askClaire('toner', 'model', 'Novel'); askPan(e);
  let r = e.script.report(e);
  assert.ok(r.extra.includes('問了 Claire 2 次，花了 3 格'));
  assert.ok(r.extra.includes('省下的 AI 額度：1 格'));
  assert.ok(r.extra.includes('寫了 0 份文件'));

  const old = play('legacy');
  tickTo(old, at(9, 51));
  askPan(old);
  r = old.script.report(old);
  assert.ok(r.extra.includes('問了小潘 1 次'));
  assert.ok(!r.extra.some(x => String(x).startsWith('問了 Claire')));

  const fast = play('speedrun');
  tickTo(fast, at(9, 51));
  fast.askClaire('toner', 'kinds', 'Pedia'); askPan(fast);
  r = fast.script.report(fast);
  assert.ok(r.extra.includes('小潘花費的 AI 額度：1 格'));
  assert.ok(r.traits.some(t => t.title === '今日王牌模型用途' && t.text === '「噴墨和雷射差在哪？」'));
  assert.ok(!e.script.report(e).traits.some(t => t.title === '今日王牌模型用途'));
});
