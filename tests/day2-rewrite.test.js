// tests/day2-rewrite.test.js（node --test）：改寫第二天後的新規則
const test = require('node:test'); const assert = require('node:assert');
const { C } = require('../contract.js');
const { Engine } = require('../engine.js');
const Works = require('../works.js');
const Screen = require('../screen.js');
const DAY2 = require('../day2.js');

const M = C.MS_PER_GAME_MIN;
const right = (q) => q.kind === 'functions' ? q.functions.map(f => Object.fromEntries(Object.entries(f.fields || {}).map(([k, v]) => [k, v.answer])))
  : q.kind === 'discuss' ? { circled: Object.keys(q.asks).map(Number), asks: Object.fromEntries(Object.keys(q.asks).map(i => [i, [].concat(q.asks[i]).map(a => a.answer)])) }
  : q.kind === 'manual' ? [{ target: 'tablet' }] : q.items.map(i => i.answer);
// 主線卡照正解做完、交 QC；over 可以換掉某幾件工作的答案
function platform(over = {}, carry = null) {
  const e = new Engine(DAY2.make(carry)); e.tick(M * 31);
  const card = e.board.get('asset_platform');
  for (const s of card.subtasks) e.doWork(card.id, s.work, over[s.work] || right(s.question));
  e.submit(card.id); e.tick(M * (C.QC_TURNAROUND_MIN + 1));
  return { e, card };
}
const uiRight = () => right(DAY2.make().cards[0].subtasks.find(s => s.work === 'ui_design').question);

test('照正解做完主線：QC 結案（拍照本來就有、拿平板實機測過）', () => {
  const { card } = platform();
  assert.strictEqual(card.status, 'archived', (card.comments.at(-1) || {}).text);
});

test('只用 devtools 模擬、沒拿實機測：QC 翻出老手機上傳不了照片', () => {
  const { card } = platform({ manual_test: [{ target: 'pc', sim: 'phone' }] });
  assert.strictEqual(card.status, 'returned'); assert.match(card.comments.at(-1).text, /老ㄐㄒㄈ手機沒辦法上傳照片/);
});

test('重複回報兩種做法擇一都對；兩個都勾，QC 退件', () => {
  const ui = uiRight();
  ui[2] = [0, 1, 3, 4]; assert.strictEqual(platform({ ui_design: ui }).card.status, 'archived', '只勾「要擋下來」也對');
  ui[2] = [0, 1, 2, 3, 4];
  const { card } = platform({ ui_design: ui });
  assert.strictEqual(card.status, 'returned'); assert.match(card.comments.at(-1).text, /畫面擋下來說禁止重複回報，但是資料已經被修改了/);
});

test('一定要拍照：QC 照過，使用者評價多一句空桌面', () => {
  const ui = uiRight(); ui[2] = [0, 1, 2, 4, 5];
  const { e, card } = platform({ ui_design: ui });
  assert.strictEqual(card.status, 'archived');
  assert.match(e.userReview()[0].text, /只好拍我的空桌面/);
});

test('報表頁是加分項：勾了不算多勾、開發多三個 function、評價多一句；AI 開發一定做成儀表板', () => {
  const q = DAY2.make().cards[0].subtasks.find(s => s.work === 'ui_design').question;
  assert.strictEqual(Works.grade(q, [[0, 2], ...uiRight().slice(1)]).score, q.items.length);
  const code = DAY2.make().cards[0].subtasks.find(s => s.work === 'code').question;
  const names = (picks) => Works.functionsToFill(code, 'all', picks).map(i => code.functions[i].name);
  assert.ok(!names({ ui_design: [[0]] }).includes('summaryView'));
  assert.ok(['summaryView', 'summaryExport', 'exportCheckResults'].every(n => names({ ui_design: [[0, 2]] }).includes(n)));
  const ai = Works.aiAnswers(code, { picks: { ui_design: [[0, 2]] }, accuracy: 1, seed: 's' });
  assert.strictEqual(ai.answers[code.functions.findIndex(f => f.name === 'summaryView')].layout, 1, '儀表板');
  const ui = uiRight(); ui[0] = [0, 2];
  const { e } = platform({ ui_design: ui });
  assert.match(e.userReview()[0].text, /主任和財務都說很方便/);
});

test('財務只看得到簽核過的：需求討論問到財務那段 → 規格才有那項 → 驗收才有那個案例（原本漏了需求討論→規格）', () => {
  const subs = DAY2.make().cards[0].subtasks, q = (w) => subs.find(s => s.work === w).question;
  const spec = q('doc_spec').items[0], accept = q('doc_accept').items[0];
  const FIN = spec.options.indexOf('財務的唯讀頁只看得到簽核同意的');
  assert.deepStrictEqual(Works.hiddenOptions(spec, {}), [FIN], '沒問到：規格看不到這項');
  assert.strictEqual(Works.grade(q('doc_spec'), [[0, 1, 2, 4, 7]], { picks: {} }).score, 1, '沒問到：規格不勾也是滿分');
  const asked = { discuss: { circled: [5], asks: { 5: [0] } } }, done = (w) => w in asked;
  assert.deepStrictEqual(Works.hiddenOptions(spec, asked), []);
  assert.ok(Works.givenOptions(spec, asked, done).includes(FIN), '問到就帶進規格');
  assert.deepStrictEqual(Works.hiddenOptions(accept, asked), [5], '規格還沒寫，驗收看不到');
  const specced = { ...asked, doc_spec: [[0, 1, 2, 4, 7, FIN]] };
  assert.deepStrictEqual(Works.hiddenOptions(accept, specced), []);
  assert.ok(Works.givenOptions(accept, specced, (w) => w in specced).includes(5), '規格有寫就帶進驗收');
  assert.ok(Works.grade(q('doc_accept'), [[0, 1, 2, 3, 4]], { picks: specced }).score < 1, '規格有寫：驗收要有這個案例');
});

test('老闆卡兩個版本：主線勾了報表而且結案 → 版本二；其他 → 版本一（轉給怡君時需求討論那關拿掉）', () => {
  const e1 = new Engine(DAY2.make()); e1.tick(M * 201); e1.talkTo('boss_audit');
  const v1 = e1.docs.find(d => d.id === 'boss_audit');
  assert.match(v1.text, /pdf彙總/); assert.ok(v1.subtasks.some(s => s.work === 'discuss'));
  e1.openCardFrom('boss_audit', { assignee: 'sa' }); e1.tick(M * (C.SA_TURNAROUND_MIN + 1));
  assert.ok(!e1.board.get('boss_audit:sa').subtasks.some(s => s.work === 'discuss'), '怡君問清楚了');
  const ui = uiRight(); ui[0] = [0, 2];
  const { e } = platform({ ui_design: ui });
  e.dismissHint(); e.tick(M * (201 - e.clock.minute + C.DAY_START_MIN)); e.talkTo('boss_audit');
  const v2 = e.docs.find(d => d.id === 'boss_audit');
  assert.match(v2.text, /報表太讚了/); assert.strictEqual(v2.subtasks.find(s => s.work === 'code').question.functions.length, 1);
});

test('配色跟第一天主線不一樣：即使是正解，評價也多一句「風格能夠一致會更好」', () => {
  const plain = platform({}, { picks: {}, style: 'plain' });
  assert.ok(plain.e.userReview()[0].text.includes(Screen.STYLE_LINE));
  const same = platform({}, { picks: {}, style: '#ffffff/#1f2328/#2563eb' });
  assert.ok(!same.e.userReview()[0].text.includes(Screen.STYLE_LINE));
});

test('選了某個選項會有人來信（onPick）', () => {
  const script = { cards: [{ at: 0, id: 'k', title: 't', assignee: '玩家', subtasks: [{ work: 'read_req', question: { items: [
    { text: 'q', options: ['a', 'b'], answer: 0, accept: [0, 1], onPick: { 1: { who: '同事 小潘', text: '你給我找事做喔', after: 5 } } }] } }] }] };
  const e = new Engine(script); e.tick(M);
  assert.strictEqual(e.doWork('k', 'read_req', [1]).score, 1, '兩個答案都算對');
  e.tick(M * 6);
  assert.ok(e.docs.some(d => d.from === '同事 小潘' && /找事做/.test(d.text)));
});

// ── 資料遺失事件（部門卡部署沒備份）──
function deptNoBackup() {
  const e = new Engine(DAY2.make()); e.tick(M * 151);
  const card = e.openCardFrom('dept_select', { type: 'feature', module: 'inventory', assignee: 'me', sentences: [0, 1], attach: true });
  for (const s of card.subtasks) if (s.work !== 'deploy') e.doWork(card.id, s.work, right(s.question));
  e.doWork(card.id, 'deploy', [[1, 2, 3, 4]]);   // AI 的排法：沒備份
  return { e, at: e.clock.minute };
}
const tickTo = (e, minute) => { e.dismissHint(); e.tick(M * (minute - e.clock.minute)); };

test('部門卡部署沒備份：15 分鐘後小潘 LIME、30 分鐘後阿賢來信，回了對方會回話；兩則開的是同一張卡', () => {
  const { e, at } = deptNoBackup();
  tickTo(e, at + 16); assert.ok(e.docs.some(d => d.id === 'lost_pan'));
  e.replyTo('lost_pan', [1]); tickTo(e, at + 19);
  assert.match(e.docs.find(d => d.id === 'lost_pan:re').text, /幻覺比AI嚴重/);
  tickTo(e, at + 31); assert.ok(e.docs.some(d => d.id === 'lost_xian'));
  const card = e.openCardFrom('lost_xian', { assignee: 'me', sentences: [0], attach: true });
  assert.strictEqual(card.id, 'where_is_the_data'); assert.strictEqual(card.body, '更新過程中遺失了12筆已回報資產，請IT協助還原。');
  assert.strictEqual(e.openCardFrom('lost_pan', { assignee: 'me', sentences: [0], attach: true }), null, '另一則也算開過了');
});

test('都沒人開：40 分鐘後怡君自己開；退回 SA 會馬上被退回來', () => {
  const { e, at } = deptNoBackup(); tickTo(e, at + 41);
  const card = e.board.get('where_is_the_data'); assert.strictEqual(card.from, 'SA 怡君'); assert.strictEqual(card.assignee, '玩家');
  e.rejectToSA(card.id, '需求不明'); assert.strictEqual(card.status, 'new');
  assert.match(card.comments.at(-1).text, /行銷部不想重打一次/);
});

test('檢討報告：第三題兩個都算對；選「請職代確認」小潘 LIME 抱怨', () => {
  const { e, at } = deptNoBackup(); tickTo(e, at + 41);
  assert.strictEqual(e.doWork('where_is_the_data', 'report', [0, 0, 0]).score, 3);
  tickTo(e, e.clock.minute + 16); assert.ok(e.docs.some(d => d.from === '同事 小潘' && /職代是我/.test(d.text)));
});

test('找舊資料要自己下指令（不能交給 AI），該查的都查了才算完；手動補救先跑一趟行銷部、交給 AI 漏放照片、QC 檢查', () => {
  const { e, at } = deptNoBackup(); tickTo(e, at + 41);
  const id = 'where_is_the_data'; const card = e.board.get(id);
  assert.strictEqual(e.delegate(id, 'dig'), null);
  assert.strictEqual(e.doWork(id, 'dig', [0, 1]).done, false);
  assert.strictEqual(e.doWork(id, 'dig', [0, 1, 2, 3]).done, true);
  const before = e.clock.minute; const doc = e.restoreTrip(id);
  assert.strictEqual(e.clock.minute - before, 60); assert.match(doc.text, /MK-2024-0101/);
  e.delegate(id, 'restore'); tickTo(e, e.clock.minute + 26);
  const r = e.acceptAi(id, 'restore'); assert.strictEqual(r.wrongText, 0); assert.strictEqual(r.wrongPhoto, 12, 'AI 漏放照片');
  e.submit(id); tickTo(e, e.clock.minute + C.QC_TURNAROUND_MIN + 1);
  assert.strictEqual(card.status, 'returned'); assert.match(card.comments.at(-1).text, /12 筆沒放照片/);
  const rec = card.subtasks.find(s => s.work === 'restore').question.records;
  e.doWork(id, 'restore', rec.map(x => ({ name: x.name, owner: x.owner, photo: x.photo })));
  e.submit(id); tickTo(e, e.clock.minute + C.QC_TURNAROUND_MIN * 2 + 1);
  assert.strictEqual(card.status, 'archived', '不用部署也能結案');
});
