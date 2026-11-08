// 正式上班第三關「心領神會」：骨架、廠商需求會議、#500 母議題、#501 個人資料卡
const test = require('node:test');
const assert = require('node:assert');
const { Engine, Sandbox, meetAll, skipMeeting, shipped } = require('./scenery-helpers.js');
require('../sandbox-fate.js');
const Works = require('../works.js');

const play = (mode = 'legacy', carry = {}) => new Engine(Sandbox.make('fate', mode, carry), { name: '測試', title: '工程師' });
const planOf = (e, id) => e.board.get(id).subtasks.find(s => s.work === 'doc_plan').question.items[0];

test('第三關登記得到，三個時代都產得出劇本；整理需求 AI 讀歪扣 0.2', () => {
  assert.ok(Sandbox.ids().includes('fate'));
  for (const mode of ['legacy', 'hybrid', 'speedrun']) {
    const s = Sandbox.make('fate', mode);
    assert.equal(s.name, '心領神會');
    assert.equal(s.level, 'fate');
    if (mode !== 'legacy') assert.equal(s.ai.readReqPenalty, 0.2);
  }
  assert.equal(Sandbox.make('fate', 'legacy').ai, undefined);
});

test('廠商需求會議散會後，怡君開 #500 母議題和 #501 個人資料卡', () => {
  const e = play(); skipMeeting(e);
  const fate = e.board.get('fate'), profile = e.board.get('profile');
  assert.ok(fate && profile);
  assert.equal(fate.no, 500);
  assert.equal(profile.no, 501);
  assert.equal(profile.parent, 'fate');
});

test('會議裡三位老師各問各的：問到的帶進 #501 開發計畫，沒問的不帶', () => {
  const asked = play(); meetAll(asked);
  const skipped = play(); skipMeeting(skipped);
  const given = (e) => { const c = e.board.get('profile'); return Works.givenOptions(planOf(e, 'profile'), c.picks, (w) => c.done(w)).sort(); };
  // 問到莉莉絲（出生地）→ 出生時間到分、出生地；問到瀞玄 → 互轉；問到長輩不知道 → 可以選「不知道」
  assert.deepEqual(given(asked), [2, 3, 4, 5]);
  assert.deepEqual(given(skipped), []);
});

test('#501 照正解做完交 QC，阿姿驗過結案', () => {
  const e = play(); meetAll(e);
  assert.equal(shipped(e, 'profile').status, 'archived');
});

const { tickTo, right, lime } = require('./scenery-helpers.js');
const sub = (e, id, work) => e.board.get(id).subtasks.find(s => s.work === work).question;
const uiWith = (e, id, swap) => { const a = right(sub(e, id, 'ui_design')); Object.assign(a, swap); return a; };
const YAWEN = '解憂時代 助理 雅雯';
const group = (e) => e.docs.filter(d => d.group === '精銳三人產線').map(d => d.text);

test('照常理做（填資料一頁填完）：QC 照過，通知後雅雯轉述老師不滿，不回讚', () => {
  const e = play(); meetAll(e);
  assert.equal(shipped(e, 'profile', { ui_design: uiWith(e, 'profile', { 0: 1 }) }).status, 'archived');
  e.notifyDone('profile'); tickTo(e, e.clock.minute + 3);
  assert.ok(lime(e, YAWEN).includes('老師們看了說：「這麼隨便，客人會覺得我們不認真。」'));
});

test('正解很難用：阿姿驗完在三人群組抱怨水逆，同一張卡只講一次；個人資料卡不算最扯的，不抱怨', () => {
  const e = play(); meetAll(e);
  const card = shipped(e, 'chart');
  tickTo(e, e.clock.minute + 2);
  assert.deepEqual(group(e).filter(t => t.includes('水逆')), ['這個案子做到我想去問算命師這陣子是不是水逆。']);
  e.afterQC(card); tickTo(e, e.clock.minute + 2);
  assert.equal(group(e).filter(t => t.includes('水逆')).length, 1);
  assert.equal(e.stats.gripes, 1);
  // 照常理做的不抱怨；個人資料卡的儀式不在抱怨名單
  const plain = play(); meetAll(plain);
  shipped(plain, 'chart', { ui_design: uiWith(plain, 'chart', { 0: 1 }) }); shipped(plain, 'profile'); tickTo(plain, plain.clock.minute + 2);
  assert.equal(group(plain).filter(t => t.includes('水逆')).length, 0);
});

test('出生時間那題要莉莉絲兩題都問到才帶；只問到一題不帶', () => {
  const both = play(); meetAll(both);
  const one = play(); meetAll(one, { profile: { circled: [1], asks: { 1: [0, 0, 0] } } });   // 沒問「長輩不知道出生時間」
  const given = (e) => { const c = e.board.get('profile'); return Works.givenOptions(sub(e, 'profile', 'ui_design').items[1], c.picks, (w) => c.done(w)); };
  assert.deepEqual(given(both), [0]);
  assert.deepEqual(given(one), []);
});

test('漏做的前端程式 QC 照樣退：生日只有國曆', () => {
  const e = play(); meetAll(e);
  assert.equal(shipped(e, 'profile', { ui_design: uiWith(e, 'profile', { 2: 1 }) }).status, 'returned');
});

test('規格第 3 題多選，預填到單選的 profileFields：全勾＝都存、少勾＝少存、勾陷阱＝客人自己選', () => {
  const fns = Sandbox.make('fate', 'legacy').meetings[1].cards.find(c => c.id === 'profile').subtasks.find(s => s.work === 'code').question;
  const at = fns.functions.findIndex(f => f.name === 'profileFields');
  const fill = (chosen) => Works.prefill(fns, { doc_spec: { 2: chosen } })[at].flow;
  assert.equal(fill([0, 1, 2, 3, 4]), 0);
  assert.equal(fill([0, 2]), 1);
  assert.equal(fill([0, 1, 2, 3, 4, 5]), 2);
});
