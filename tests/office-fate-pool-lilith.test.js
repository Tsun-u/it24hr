// 正式上班第三關「心領神會」：模組池・莉莉絲池（本月星座運勢、今日幸運方針、每日塔羅占卜）
const test = require('node:test');
const assert = require('node:assert');
const { C, Engine, Sandbox, meetAll, skipMeeting, shipped, tickTo, right, codeWith, lime } = require('./scenery-helpers.js');
require('../sandbox-fate.js');
const Works = require('../works.js');
const Screen = require('../screen.js');

const play = (pool, mode = 'legacy') => new Engine(Sandbox.make('fate', mode, { pool: [pool] }), { name: '測試', title: '工程師' });
const specOf = (id) => Sandbox.make('fate', 'legacy', { pool: [id] }).meetings[1].cards.find(c => c.id === id);
const sub = (e, id, work) => e.board.get(id).subtasks.find(s => s.work === work).question;
const uiWith = (e, id, swap) => { const a = right(sub(e, id, 'ui_design')); Object.assign(a, swap); return a; };
const givenOf = (e, id, work, item) => {
  const card = e.board.get(id);
  return Works.givenOptions(sub(e, id, work).items[item], card.picks, w => card.done(w), 'all', e.otherCard);
};
const YAWEN = '解憂時代 助理 雅雯';
const LILITH_POOL = [['monthly', '本月星座運勢'], ['lucky', '今日幸運方針'], ['tarot', '每日塔羅占卜']];
const JINGXUAN_POOL = ['lot', 'bird', 'lamp'];

test('carry.pool 指定莉莉絲池哪一張：散會後怡君開出來，掛在母議題底下、編號排在瀞玄池那張後面', () => {
  for (const [id, title] of LILITH_POOL) {
    const e = play(id); skipMeeting(e);
    const card = e.board.get(id);
    assert.ok(card, id);
    assert.equal(card.title, title);
    assert.equal(card.parent, 'fate');
    const jingxuan = e.board.cards.find(c => JINGXUAN_POOL.includes(c.id));
    assert.equal(card.no, jingxuan.no + 1, id);
    assert.ok(e.script.meetings[1].pages.some(p => p.id === id), '會議多一頁');
  }
});

test('不帶 carry.pool 時莉莉絲池一定抽到一張，三張都抽得到', () => {
  const seen = new Set();
  for (let n = 0; n < 60; n++) {
    const ids = Sandbox.make('fate', 'legacy').meetings[1].cards.map(c => c.id);
    const drawn = LILITH_POOL.map(([id]) => id).filter(id => ids.includes(id));
    assert.equal(drawn.length, 1, ids.join());
    seen.add(drawn[0]);
  }
  assert.deepEqual([...seen].sort(), ['lucky', 'monthly', 'tarot']);
});

test('三張照正解做完交 QC，阿姿驗過結案；莉莉絲池不在阿姿抱怨的名單', () => {
  for (const [id] of LILITH_POOL) {
    const e = play(id); meetAll(e);
    assert.equal(shipped(e, id).status, 'archived', id);
    tickTo(e, e.clock.minute + 2);
    assert.equal(!!e.board.get(id).griped, false, id);
  }
});

test('前端程式照常理做：QC 照過，通知後雅雯轉述莉莉絲老師的不滿', () => {
  const cases = [['monthly', { 0: 1 }, '星座又不是點餐。'], ['monthly', { 1: 1 }, '流年火星都幫你寫完了，誰還要來找我？'],
                 ['lucky', { 0: 1 }, '幸運也要自己動手才會來呀。'], ['lucky', { 1: 1 }, '幸運都告訴你了，你不帶回家？'],
                 ['tarot', { 0: 1 }, '沒洗牌，牌是不會跟你說話的。'], ['tarot', { 1: 1 }, '你都幫牌講完了呀。']];
  for (const [id, swap, say] of cases) {
    const e = play(id); meetAll(e);
    assert.equal(shipped(e, id, { ui_design: uiWith(e, id, swap) }).status, 'archived', id);
    e.notifyDone(id); tickTo(e, e.clock.minute + 3);
    assert.ok(lime(e, YAWEN).includes(`莉莉絲老師說：「${say}」`), `${id} ${say}`);
  }
});

test('本月星座運勢：換座照中氣那題的正解選得到；會議問到交界日才帶，沒問要自己選', () => {
  const asked = play('monthly'); meetAll(asked);
  assert.deepEqual(givenOf(asked, 'monthly', 'doc_spec', 0), [0]);
  const skipped = play('monthly'); skipMeeting(skipped);
  assert.deepEqual(givenOf(skipped, 'monthly', 'doc_spec', 0), []);
  const q = sub(skipped, 'monthly', 'doc_spec');
  assert.match(q.items[0].options[q.items[0].answer], /太陽實際到達的時刻/);
  skipped.doWork('monthly', 'doc_spec', right(q));
  const code = sub(skipped, 'monthly', 'code');
  const at = code.functions.findIndex(f => f.name === 'signBySun');
  assert.equal(Works.prefill(code, skipped.board.get('monthly').picks)[at].flow, 0, '規格選了中氣，後端預填照太陽到達的時刻');
});

test('本月星座運勢：沒問的退回 SA 勾到交界日，規格一樣帶入', () => {
  const e = play('monthly'); skipMeeting(e);
  e.rejectToSA('monthly', [[0]]);
  tickTo(e, e.clock.minute + C.SA_RECHECK_MIN + 1);
  assert.deepEqual(givenOf(e, 'monthly', 'doc_spec', 0), [0]);
  assert.deepEqual(givenOf(e, 'monthly', 'doc_spec', 1), [], '排程沒勾到不帶');
});

test('本月星座運勢：換座寫死日期 QC 退；要人工發布 QC 驗不出來，上線時間整欄等人工發布', () => {
  const fixed = play('monthly'); meetAll(fixed);
  assert.equal(shipped(fixed, 'monthly', { code: codeWith(fixed, 'monthly', { signBySun: 1 }) }).status, 'returned');
  const manual = play('monthly'); meetAll(manual);
  const card = shipped(manual, 'monthly', { code: codeWith(manual, 'monthly', { autoPublish: 1 }) });
  assert.equal(card.status, 'archived');
  assert.ok(manual.usageTally().late.includes('莉莉絲逆行，一號下午才上線'));
  const rows = Screen.visibleRows(Screen.model(card, manual.board.get('fate')));
  assert.ok(rows.every(r => r[2] === '（等人工發布）'));
});

test('本月星座運勢的測試寫成「兩個都是雙魚」：AI 後端照著寫死固定日期', () => {
  const e = play('monthly'); meetAll(e);
  const q = sub(e, 'monthly', 'test'); const answers = right(q);
  answers[q.functions.findIndex(f => f.name === 'testCusp')] = { assert: 1 };
  assert.equal(Works.testDrives(q, answers).signBySun.flow, 1);
});

test('今日幸運方針規格第 2 題（幸運數字）：會議問到、退回 SA 勾到、計畫和整理需求都做對，也不帶', () => {
  const e = play('lucky'); meetAll(e);
  assert.ok(e.board.get('lucky').picks.discuss.asks[0], '會議問了幸運數字有範圍嗎');
  assert.deepEqual(givenOf(e, 'lucky', 'doc_spec', 1), []);
  e.doWork('lucky', 'read_req', right(sub(e, 'lucky', 'read_req')));
  e.doWork('lucky', 'doc_plan', right(sub(e, 'lucky', 'doc_plan')));
  assert.deepEqual(givenOf(e, 'lucky', 'doc_spec', 1), []);
  assert.deepEqual(givenOf(e, 'lucky', 'doc_spec', 0), [0], '第 1 題照樣帶');
  const rejected = play('lucky'); skipMeeting(rejected);
  rejected.rejectToSA('lucky', [[0, 1, 2]]);
  tickTo(rejected, rejected.clock.minute + C.SA_RECHECK_MIN + 1);
  assert.deepEqual(givenOf(rejected, 'lucky', 'doc_spec', 1), []);
});

test('今日幸運方針：幸運數字從網站吉數挑只被莉莉絲嫌、第二列的 3 變成 8；每次重算 QC 退', () => {
  const site = play('lucky'); meetAll(site);
  const card = shipped(site, 'lucky', { code: codeWith(site, 'lucky', { luckyNumber: 1 }) });
  assert.equal(card.status, 'archived');
  assert.equal(Screen.visibleRows(Screen.model(card, site.board.get('fate')))[1][3], '8');
  site.notifyDone('lucky'); tickTo(site, site.clock.minute + 3);
  assert.ok(lime(site, YAWEN).includes('莉莉絲老師說：「那是網站的命，不是客人的命呀～」'));
  const reroll = play('lucky'); meetAll(reroll);
  assert.equal(shipped(reroll, 'lucky', { code: codeWith(reroll, 'lucky', { dailySeed: 1 }) }).status, 'returned');
});

test('今日幸運方針前端第 2 題：會議問到幸運物連購買頁才定好；測試寫「連到工作室首頁」前端照樣有購買鈕', () => {
  const asked = play('lucky'); meetAll(asked);
  const skipped = play('lucky'); skipMeeting(skipped);
  assert.deepEqual(givenOf(asked, 'lucky', 'ui_design', 1), [0]);
  assert.deepEqual(givenOf(skipped, 'lucky', 'ui_design', 1), []);
  const q = sub(asked, 'lucky', 'test'); const answers = right(q);
  answers[q.functions.findIndex(f => f.name === 'testCrystalLink')] = { assert: 1 };
  const drives = Works.testDrives(q, answers);
  assert.equal(drives.crystalLink.to, 1);
  assert.deepEqual([].concat(drives.ui_design[1]), [0]);
});

test('每日塔羅占卜：每次重洗 QC 退；只做大牌、逆位關不掉 QC 驗不出來；只有正位被莉莉絲嫌、第二列變正位', () => {
  const reshuffle = play('tarot'); meetAll(reshuffle);
  assert.equal(shipped(reshuffle, 'tarot', { code: codeWith(reshuffle, 'tarot', { dailyDraw: 1 }) }).status, 'returned');
  const major = play('tarot'); meetAll(major);
  assert.equal(shipped(major, 'tarot', { code: codeWith(major, 'tarot', { fullDeck: 1 }) }).status, 'archived');
  assert.ok(major.usageTally().late.includes('抽到的永遠是大事'));
  const locked = play('tarot'); meetAll(locked);
  assert.equal(shipped(locked, 'tarot', { code: codeWith(locked, 'tarot', { reversed: 2 }) }).status, 'archived');
  assert.ok(locked.usageTally().late.includes('莉莉絲說今天不讀逆位，你們改不了'));
  const upright = play('tarot'); meetAll(upright);
  const card = shipped(upright, 'tarot', { code: codeWith(upright, 'tarot', { reversed: 1 }) });
  assert.equal(card.status, 'archived');
  assert.equal(Screen.visibleRows(Screen.model(card, upright.board.get('fate')))[1][3], '正位');
});

test('每日塔羅占卜：會議問到逆位、重抽才帶進計畫和規格；牌組前面沒有文件寫到', () => {
  const asked = play('tarot'); meetAll(asked);
  const skipped = play('tarot'); skipMeeting(skipped);
  assert.ok(givenOf(asked, 'tarot', 'doc_plan', 0).includes(1) && givenOf(asked, 'tarot', 'doc_plan', 0).includes(2));
  assert.deepEqual(givenOf(skipped, 'tarot', 'doc_plan', 0), []);
  assert.deepEqual(givenOf(asked, 'tarot', 'doc_spec', 2), [0]);
  assert.deepEqual(givenOf(skipped, 'tarot', 'doc_spec', 2), []);
  asked.doWork('tarot', 'read_req', right(sub(asked, 'tarot', 'read_req')));
  asked.doWork('tarot', 'doc_plan', right(sub(asked, 'tarot', 'doc_plan')));
  assert.deepEqual(givenOf(asked, 'tarot', 'doc_spec', 1), []);
});

test('卡上的傍晚評語照劇本原句：有正解的、照常理做或漏了的各一句', () => {
  const lines = {
    monthly: ['莉莉絲老師說客人在星盤上找到自己的星座時都會笑。', '莉莉絲老師說十二個按鈕排兩排，星座又不是點餐。'],
    lucky: ['莉莉絲老師說客人刮開的時候最開心，今天水晶賣掉三顆。', '莉莉絲老師說一打開就看完了，幸運也要自己動手才會來呀。'],
    tarot: ['莉莉絲老師說洗牌、切牌那段，客人都很專心。', '莉莉絲老師說按一下就翻牌，牌不會跟客人說話。'],
  };
  for (const [id, [good, bad]] of Object.entries(lines)) assert.deepEqual(specOf(id).evening, { good, bad }, id);
});

test('#501 的規格存了國曆生日：星座換座、幸運方針同一天要一樣、塔羅一天一張直接定在照資料卡；#501 規格沒做就不帶', () => {
  for (const [id, item] of [['monthly', 0], ['lucky', 0], ['tarot', 0]]) {
    const e = play(id); skipMeeting(e);
    assert.deepEqual(givenOf(e, id, 'doc_spec', item), [], `${id} 沒做 #501 規格`);
    e.doWork('profile', 'doc_spec', right(sub(e, 'profile', 'doc_spec')));
    assert.deepEqual(givenOf(e, id, 'doc_spec', item), [0], `${id} #501 存了國曆生日`);
  }
});
