// 正式上班第三關「心領神會」：模組池・瀞玄池（#505 每日一籤、線上鳥卦、代點光明燈）
const test = require('node:test');
const assert = require('node:assert');
const { Engine, Sandbox, meetAll, skipMeeting, shipped, tickTo, right, codeWith, lime } = require('./scenery-helpers.js');
require('../sandbox-fate.js');
const Works = require('../works.js');

const play = (pool, mode = 'legacy') => new Engine(Sandbox.make('fate', mode, { pool: [pool] }), { name: '測試', title: '工程師' });
const sub = (e, id, work) => e.board.get(id).subtasks.find(s => s.work === work).question;
const uiWith = (e, id, swap) => { const a = right(sub(e, id, 'ui_design')); Object.assign(a, swap); return a; };
// 驗收文件少勾第 n 條案例（QC 照驗收測，沒寫的那種坑就驗不出來）
const acceptWithout = (e, id, n) => [right(sub(e, id, 'doc_accept'))[0].filter(i => i !== n)];
const givenOf = (e, id, work, item) => {
  const card = e.board.get(id);
  return Works.givenOptions(sub(e, id, work).items[item], card.picks, w => card.done(w), 'all', e.otherCard);
};
const YAWEN = '解憂時代 助理 雅雯';
const POOLS = [['lot', 'bird', 'lamp'], ['monthly', 'lucky', 'tarot'], ['quiz', 'comic', 'column']];
const MANDATORY = ['profile', 'chart', 'reading', 'booking'];

test('carry.pool 指定瀞玄池哪一張：散會後怡君開出 #505，掛在母議題底下', () => {
  for (const [id, title] of [['lot', '每日一籤'], ['bird', '線上鳥卦'], ['lamp', '代點光明燈']]) {
    const e = play(id); skipMeeting(e);
    const card = e.board.get(id);
    assert.ok(card, id);
    assert.equal(card.no, 505, id);
    assert.equal(card.title, title);
    assert.equal(card.parent, 'fate');
  }
});

test('會議多一頁抽到的那張；不帶 carry.pool 時每池最多抽一張、瀞玄池一定抽到一張，編號照池的順序', () => {
  const seen = new Set();
  for (let n = 0; n < 60; n++) {
    const s = Sandbox.make('fate', 'legacy');
    const children = s.meetings[1].cards.filter(c => c.parent === 'fate').map(c => c.id);
    const drawn = children.filter(id => !MANDATORY.includes(id));
    const perPool = POOLS.map(pool => drawn.filter(id => pool.includes(id)));
    assert.ok(perPool.every(p => p.length <= 1), drawn.join());
    assert.equal(perPool[0].length, 1);
    assert.deepEqual(drawn, perPool.flat(), '照池的順序（瀞玄、莉莉絲、熙恩）');
    assert.deepEqual(s.meetings[1].pages.map(p => p.id), ['fate', ...MANDATORY, ...drawn]);
    seen.add(perPool[0][0]);
  }
  assert.deepEqual([...seen].sort(), ['bird', 'lamp', 'lot']);
});

test('三張照正解做完交 QC，阿姿驗過結案', () => {
  for (const id of ['lot', 'bird', 'lamp']) {
    const e = play(id); meetAll(e);
    assert.equal(shipped(e, id).status, 'archived', id);
  }
});

test('前端程式照常理做：QC 照過，通知後雅雯轉述瀞玄老師的不滿', () => {
  const cases = [['lot', '神明都還沒點頭，你就幫祂決定了？'], ['bird', '鳥飛了一圈你跳過，牠會覺得不被尊重。'], ['lamp', '點燈要有點燈的樣子。']];
  for (const [id, say] of cases) {
    const e = play(id); meetAll(e);
    assert.equal(shipped(e, id, { ui_design: uiWith(e, id, { 0: 1 }) }).status, 'archived', id);
    e.notifyDone(id); tickTo(e, e.clock.minute + 3);
    assert.ok(lime(e, YAWEN).includes(`瀞玄老師說：「${say}」`), id);
  }
});

test('正解的儀式感：鳥卦的影片阿姿抱怨要快轉鈕；每日一籤不在抱怨名單', () => {
  const e = play('bird'); meetAll(e);
  shipped(e, 'bird'); tickTo(e, e.clock.minute + 2);
  assert.equal(e.board.get('bird').griped, true);
  assert.ok(e.docs.some(d => d.from === 'QC 阿姿' && d.text.includes('內部測試用的影片快轉鈕')));
  const lot = play('lot'); meetAll(lot);
  shipped(lot, 'lot'); tickTo(lot, lot.clock.minute + 2);
  assert.equal(!!lot.board.get('lot').griped, false);
});

test('每日一籤：籤詩只顯示籤號 QC 退；後端籤詩網路上隨便抓一套 QC 退、寫死三次聖筊、驗收沒勾那條就驗不出來', () => {
  const onlyNo = play('lot'); meetAll(onlyNo);
  assert.equal(shipped(onlyNo, 'lot', { ui_design: uiWith(onlyNo, 'lot', { 1: 2 }) }).status, 'returned');
  const anySet = play('lot'); meetAll(anySet);
  assert.equal(shipped(anySet, 'lot', { code: codeWith(anySet, 'lot', { lotSet: 2 }) }).status, 'returned');
  const three = play('lot'); meetAll(three);
  assert.equal(shipped(three, 'lot', { code: codeWith(three, 'lot', { throwCount: 1 }), doc_accept: acceptWithout(three, 'lot', 2) }).status, 'archived');
  assert.ok(three.usageTally().late.includes('老師說今天神明只要一個就好，你們改不了'));
});

test('每日一籤前端第 1 題：計畫排了擲筊就定好；會議問到的帶進計畫和規格', () => {
  const e = play('lot'); meetAll(e);
  assert.deepEqual(givenOf(e, 'lot', 'ui_design', 0), []);
  e.doWork('lot', 'doc_plan', right(sub(e, 'lot', 'doc_plan')));
  assert.deepEqual(givenOf(e, 'lot', 'ui_design', 0), [0]);
  assert.ok(givenOf(e, 'lot', 'doc_plan', 0).includes(0) && givenOf(e, 'lot', 'doc_plan', 0).includes(4));
  const skipped = play('lot'); skipMeeting(skipped);
  assert.deepEqual(givenOf(skipped, 'lot', 'doc_spec', 2), []);
  assert.deepEqual(givenOf(e, 'lot', 'doc_spec', 2), [0]);
});

test('每日一籤的測試寫成「每次都是聖筊」：AI 後端照著寫，前端也做成按一下直接出籤', () => {
  const e = play('lot'); meetAll(e);
  const q = sub(e, 'lot', 'test'); const answers = right(q);
  answers[q.functions.findIndex(f => f.name === 'testJiao')] = { assert: 2 };
  const drives = Works.testDrives(q, answers);
  assert.equal(drives.throwJiao.result, 1);
  assert.deepEqual([].concat(drives.ui_design[0]), [1]);
});

test('線上鳥卦：規格影片那題要「真的讓鳥叼」「卦牌幾張」兩題都問到才帶；影片共用一段、驗收沒勾那條就驗不出來', () => {
  const both = play('bird'); meetAll(both);
  const one = play('bird'); meetAll(one, { bird: { circled: [2], asks: { 2: [0] } } });   // 沒問卦牌幾張
  assert.deepEqual(givenOf(both, 'bird', 'doc_spec', 1), [0]);
  assert.deepEqual(givenOf(one, 'bird', 'doc_spec', 1), []);
  const shared = play('bird'); meetAll(shared);
  assert.equal(shipped(shared, 'bird', { code: codeWith(shared, 'bird', { cardVideo: 1 }), doc_accept: acceptWithout(shared, 'bird', 2) }).status, 'archived');
  assert.ok(shared.usageTally().late.includes('每張牌鳥都叼同一個位置'));
  const reroll = play('bird'); meetAll(reroll);
  assert.equal(shipped(reroll, 'bird', { code: codeWith(reroll, 'bird', { dailyCard: 1 }) }).status, 'returned');
});

test('代點光明燈：規格第 1 題多選，預填到單選的 fieldLimit', () => {
  const fns = Sandbox.make('fate', 'legacy', { pool: ['lamp'] }).meetings[1].cards.find(c => c.id === 'lamp').subtasks.find(s => s.work === 'code').question;
  const at = fns.functions.findIndex(f => f.name === 'fieldLimit');
  const fill = (chosen) => Works.prefill(fns, { doc_spec: { 0: chosen } })[at].flow;
  assert.equal(fill([0, 1, 2]), 0, '三項都勾、沒勾陷阱');
  assert.equal(fill([0, 1]), 0, '少勾帶出：帶出有自己的 saveLamp');
  assert.equal(fill([0, 1, 2, 3]), 1, '勾了不限字數');
  assert.equal(fill([1, 2]), 1, '沒勾字數限制');
  assert.equal(fill([0, 1, 2, 4]), 2, '勾了送出才跳紅字');
});

test('代點光明燈：規格欄位限制跨卡帶「從會員資料帶出」——#501 規格寫了資料卡存國曆生日和出生地才帶', () => {
  const e = play('lamp'); meetAll(e);
  assert.deepEqual(givenOf(e, 'lamp', 'doc_spec', 0).sort(), [0, 1], '會議要到廟裡的規定 → 字數、生日和出生地');
  e.doWork('profile', 'doc_spec', right(sub(e, 'profile', 'doc_spec')));
  assert.deepEqual(givenOf(e, 'lamp', 'doc_spec', 0).sort(), [0, 1, 2]);
  const noPlace = play('lamp'); meetAll(noPlace);
  const spec = right(sub(noPlace, 'profile', 'doc_spec')); spec[2] = [0, 1, 2, 4];   // 沒存出生地
  noPlace.doWork('profile', 'doc_spec', spec);
  assert.ok(!givenOf(noPlace, 'lamp', 'doc_spec', 0).includes(2));
});

test('代點光明燈：不限字數 QC 退；送出才跳紅字 QC 照過但雅雯問紅字；捐款收據、驗收沒勾那條就驗不出來', () => {
  const free = play('lamp'); meetAll(free);
  assert.equal(shipped(free, 'lamp', { code: codeWith(free, 'lamp', { fieldLimit: 1 }) }).status, 'returned');
  const red = play('lamp'); meetAll(red);
  assert.equal(shipped(red, 'lamp', { code: codeWith(red, 'lamp', { fieldLimit: 2 }) }).status, 'archived');
  red.notifyDone('lamp'); tickTo(red, red.clock.minute + 3);
  assert.ok(lime(red, YAWEN).includes('這個紅字是什麼意思？'));
  const donation = play('lamp'); meetAll(donation);
  assert.equal(shipped(donation, 'lamp', { code: codeWith(donation, 'lamp', { receiptType: 1 }), doc_accept: acceptWithout(donation, 'lamp', 5) }).status, 'archived');
  assert.ok(donation.usageTally().late.includes('客人拿去報稅被國稅局退'));
});

test('代點光明燈前端第 2 題：會議問到犯太歲照哪一份才定好；測試寫「照網路上的名單標」前端照樣有提示', () => {
  const asked = play('lamp'); meetAll(asked);
  const skipped = play('lamp'); skipMeeting(skipped);
  assert.deepEqual(givenOf(asked, 'lamp', 'ui_design', 1), [0]);
  assert.deepEqual(givenOf(skipped, 'lamp', 'ui_design', 1), []);
  const q = sub(asked, 'lamp', 'test'); const answers = right(q);
  answers[q.functions.findIndex(f => f.name === 'testTaisui')] = { assert: 1 };
  const drives = Works.testDrives(q, answers);
  assert.equal(drives.taisuiList.flow, 1);
  assert.deepEqual([].concat(drives.ui_design[1]), [0]);
});
