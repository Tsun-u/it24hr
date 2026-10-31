// tests/review.test.js（node --test）：檢閱程式碼的兩款小遊戲——前端三機找碴（spot）、後端讀 diff 標行（diff）的評分與 AI 代做
const test = require('node:test'); const assert = require('node:assert');
const W = require('../works.js');
const { REVIEWS } = require('../day3.js');

test('三機找碴：區塊對＋原因對算 1、原因錯算 0.5、點到行銷部要的算誤點；picks 只留抓到的 fix', () => {
  const q = REVIEWS.campaignFront;
  const full = W.grade(q, { marks: [{ key: 'product', reason: 'broken' }, { key: 'submit', reason: 'covered' }, { key: 'form', reason: 'overflow' }] });
  assert.strictEqual(full.score, 3); assert.strictEqual(full.max, 3); assert.deepStrictEqual(full.falses, []);
  assert.deepStrictEqual(full.picks, [['fixImages', 'fixMobileButton', 'fixTabletForm']]);
  const half = W.grade(q, { marks: [{ key: 'product', reason: 'covered' }, { key: 'banner', reason: 'loud' }] });
  assert.strictEqual(half.score, 0.5); assert.strictEqual(half.half.length, 1); assert.strictEqual(half.misses.length, 2);
  assert.strictEqual(half.falses.length, 1); assert.match(half.falses[0].why, /行銷部/);
  assert.deepStrictEqual(half.picks, [[]], '原因錯的不算抓到，不帶 fix');
  assert.match(W.summarize(q, {}, half), /標了 1 處.*1 處不用改也標了/);
});

test('讀 diff 標行：LGTM 什麼都不標、記 skipped；點沒問題的行與 nit 都算誤點；提示次數跟著答案走', () => {
  const q = REVIEWS.signupBack;
  const lgtm = W.grade(q, { lgtm: true });
  assert.ok(lgtm.skipped && lgtm.score === 0 && lgtm.misses.length === 3);
  assert.match(W.summarize(q, {}, lgtm), /LGTM/);
  const r = W.grade(q, { marks: [{ key: 2, reason: 'local_pii' }, { key: 4, reason: 'get_pii' }, { key: 7, reason: 'extra' }, { key: 5, reason: 'extra' }], hintsUsed: 2 });
  assert.strictEqual(r.score, 2); assert.strictEqual(r.hintsUsed, 2);
  assert.deepStrictEqual(r.falses.map(f => f.key), [7, 5]);
  assert.match(r.falses[0].why, /formatter/); assert.match(r.falses[1].why, /沒問題/);
  assert.deepStrictEqual(r.picks, [['storeOnServer', 'postNotGet']]);
});

test('交給 Claire 檢閱：配色字級、縮排命名它都標（trap／nit），真問題只挑 aiFinds 列的；它不是退回得了的那種答案卡', () => {
  const front = W.aiAnswers(REVIEWS.campaignFront, { accuracy: 1, seed: 's' });
  assert.deepStrictEqual(front.answers.marks.map(m => `${m.key}:${m.reason}`).sort(), ['banner:loud', 'countdown:big']);
  const g = W.grade(REVIEWS.campaignFront, front.answers);
  assert.strictEqual(g.score, 0); assert.strictEqual(g.falses.length, 2);
  const back = W.aiAnswers(REVIEWS.panPrBack, { accuracy: 1, seed: 's' });
  assert.ok(back.answers.marks.some(m => m.key === 315 && m.reason === 'extra'), '多的設定頁它挑得出');
  assert.ok(!back.answers.marks.some(m => m.key === 312), '找不到的函式它漏掉');
  assert.deepStrictEqual(W.aiSpots(REVIEWS.panPrBack, back.answers), []);
});

test('結算卡：兩款檢閱各記抓到／誤點／提示／LGTM，成就與同事評語照卡的 reviewSays', () => {
  const { C } = require('../contract.js'); const { Engine } = require('../engine.js'); const DAY2 = require('../day2.js');
  const card = { at: 1, id: 'page', title: '行銷部的活動頁', from: '行銷部', assignee: '玩家', requester: '行銷部',
    reviewSays: { review_front: { who: '資安 畇蓁', hit: '「這樣可以上。」', miss: '「我說過了，不行。」', trap: { who: '莎禾 PM 佩珊', text: '「那個是我們要的欸。」' } }, review_back: { who: '同事 小潘', hit: '「謝啦。」', miss: '「欸你不是看過了？」' } },
    subtasks: [{ work: 'review_front', question: REVIEWS.campaignFront }, { work: 'review_back', question: REVIEWS.panPrBack }] };
  const e = new Engine({ ...DAY2.day3stub, meetings: [], sources: [], cards: [card], mainCard: null }, { name: '小明', title: '軟體工程師' });
  e.tick(C.MS_PER_GAME_MIN * 3);
  assert.ok(e.doWork('page', 'review_front', { marks: [{ key: 'product', reason: 'broken' }, { key: 'submit', reason: 'covered' }, { key: 'form', reason: 'overflow' }, { key: 'banner', reason: 'loud' }], hintsUsed: 1 }));
  assert.ok(e.doWork('page', 'review_back', { marks: [{ key: 318, reason: 'indent' }], lgtm: false }));
  assert.deepStrictEqual(e.board.get('page').picks.review_front, [['fixImages', 'fixMobileButton', 'fixTabletForm']], '開發的 function 用 needs 接得到抓到的 fix');
  const r = e.report();
  assert.ok(r.lines.some(l => /#\d+ 前端：抓到 3／3，誤點 1，提示 1 次/.test(l)), r.lines.join('\n'));
  assert.ok(r.lines.some(l => /後端：抓到 0／3，誤點 1/.test(l)));
  assert.ok(r.traits.some(t => t.title === '挑縮排') && r.traits.some(t => t.title === '提示') && !r.traits.some(t => t.title === '三機都看了'), '誤點了橫幅就不算三機都看了');
  assert.ok(r.peers.some(p => /那個是我們要的欸/.test(p.text)) && r.peers.some(p => /這樣可以上/.test(p.text)) && r.peers.some(p => /不是看過了/.test(p.text)));
});
