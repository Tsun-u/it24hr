// 正式上班第三關「心領神會」：模組池・熙恩池（心理測驗精選、情境漫畫、宇宙能量專欄）
const test = require('node:test');
const assert = require('node:assert');
const { Engine, Sandbox, meetAll, skipMeeting, shipped, tickTo, right, codeWith, lime } = require('./scenery-helpers.js');
require('../sandbox-fate.js');
const Works = require('../works.js');
const Screen = require('../screen.js');

// 瀞玄池也指定一張，抽池才不靠亂數；議題編號照池的順序，合併莉莉絲池後會變，所以一律用卡片 id 找卡
const play = (id, mode = 'legacy') => new Engine(Sandbox.make('fate', mode, { pool: ['lot', id] }), { name: '測試', title: '工程師' });
const sub = (e, id, work) => e.board.get(id).subtasks.find(s => s.work === work).question;
const uiWith = (e, id, swap) => { const a = right(sub(e, id, 'ui_design')); Object.assign(a, swap); return a; };
const givenOf = (e, id, work, item) => {
  const card = e.board.get(id);
  return Works.givenOptions(sub(e, id, work).items[item], card.picks, w => card.done(w), 'all', e.otherCard);
};
const specOf = (id) => Sandbox.make('fate', 'legacy', { pool: [id] }).meetings[1].cards.find(c => c.id === id);
const YAWEN = '解憂時代 助理 雅雯';
const XIEN_CARDS = [['quiz', '心理測驗精選'], ['comic', '情境漫畫'], ['column', '宇宙能量專欄']];
// 傍晚轉述挑哪一句：前端或後端有老師不滿、漏做、月底出事的講 bad（engine.eveningReview 的判定）
const eveningLine = (e, id) => {
  const card = e.board.get(id);
  const bad = e.cardOutcomes(card).some(o => ['displeased', 'miss', 'late'].includes(o.kind));
  return bad ? specOf(id).evening.bad : specOf(id).evening.good;
};

test('carry.pool 指定熙恩池哪一張：會議多一頁、散會後怡君開出那張，掛在母議題底下、編號排在最後', () => {
  for (const [id, title] of XIEN_CARDS) {
    const s = Sandbox.make('fate', 'legacy', { pool: [id] });
    assert.ok(s.meetings[1].pages.some(p => p.id === id && p.who === '解憂時代 熙恩教授'), id);
    const e = new Engine(s, { name: '測試', title: '工程師' }); skipMeeting(e);
    const card = e.board.get(id);
    assert.ok(card, id);
    assert.equal(card.title, title);
    assert.equal(card.parent, 'fate');
    assert.equal(card.no, Math.max(...e.board.cards.map(c => c.no)), '熙恩池是最後一池');
  }
});

test('三張照正解做完交 QC，阿姿驗過結案', () => {
  for (const [id] of XIEN_CARDS) {
    const e = play(id); meetAll(e);
    assert.equal(shipped(e, id).status, 'archived', id);
  }
});

test('前端程式照常理做：QC 照過，通知後雅雯轉述熙恩教授的不滿', () => {
  const cases = [['quiz', '一直重測，波函數會亂掉。'], ['comic', '第四格是結論，結論要校準過才能給。'], ['column', '這樣看起來像是我自己寫的。']];
  for (const [id, say] of cases) {
    const e = play(id); meetAll(e);
    assert.equal(shipped(e, id, { ui_design: uiWith(e, id, { 0: 1 }) }).status, 'archived', id);
    e.notifyDone(id); tickTo(e, e.clock.minute + 3);
    assert.ok(lime(e, YAWEN).includes(`熙恩教授說：「${say}」`), id);
  }
});

test('熙恩池不在阿姿抱怨的名單（只抱怨畫面最扯的幾張）', () => {
  for (const [id, griped] of [['quiz', false], ['comic', false], ['column', false]]) {
    const e = play(id); meetAll(e);
    shipped(e, id); tickTo(e, e.clock.minute + 2);
    assert.equal(!!e.board.get(id).griped, griped, id);
  }
});

test('心理測驗跨卡：抽到 quiz、它的規格或計畫寫了結果存到資料卡，#502 規格「16 型人格」帶入正解；寫不存不帶', () => {
  const bySpec = play('quiz'); meetAll(bySpec);
  assert.deepEqual(givenOf(bySpec, 'chart', 'doc_spec', 2), [], '心理測驗精選的文件還沒寫');
  bySpec.doWork('quiz', 'doc_spec', right(sub(bySpec, 'quiz', 'doc_spec')));
  assert.deepEqual(givenOf(bySpec, 'chart', 'doc_spec', 2), [0]);

  const byPlan = play('quiz'); meetAll(byPlan);
  byPlan.doWork('quiz', 'doc_plan', right(sub(byPlan, 'quiz', 'doc_plan')));
  assert.deepEqual(givenOf(byPlan, 'chart', 'doc_spec', 2), [0]);

  const notSaved = play('quiz'); meetAll(notSaved);
  notSaved.doWork('quiz', 'doc_spec', [1]);
  assert.deepEqual(givenOf(notSaved, 'chart', 'doc_spec', 2), []);
});

test('心理測驗沒抽到：#502 規格「16 型人格」照舊不帶，照正解做完照樣結案', () => {
  const e = play('comic'); meetAll(e);
  assert.equal(e.board.get('quiz'), undefined);
  assert.deepEqual(givenOf(e, 'chart', 'doc_spec', 2), []);
  assert.equal(shipped(e, 'chart').status, 'archived');
});

test('心理測驗：會議問到重測，前端第 1 題定好、計畫帶存結果；問到參考資料，前端第 3 題定好；沒問不帶', () => {
  const asked = play('quiz'); meetAll(asked);
  const skipped = play('quiz'); skipMeeting(skipped);
  assert.deepEqual(givenOf(asked, 'quiz', 'ui_design', 0), [0]);
  assert.deepEqual(givenOf(asked, 'quiz', 'ui_design', 2), [0]);
  assert.deepEqual(givenOf(asked, 'quiz', 'doc_plan', 0).sort(), [2, 3]);
  assert.deepEqual(givenOf(skipped, 'quiz', 'ui_design', 0), []);
  assert.deepEqual(givenOf(skipped, 'quiz', 'ui_design', 2), []);
  skipped.doWork('quiz', 'doc_plan', right(sub(skipped, 'quiz', 'doc_plan')));
  assert.deepEqual(givenOf(skipped, 'quiz', 'ui_design', 0), [0], '計畫排了存結果也定好');
});

test('心理測驗：結果不存 QC 退（排盤時又要選四個字母），成品畫面「存到資料卡」整欄變否', () => {
  const e = play('quiz'); meetAll(e);
  const card = shipped(e, 'quiz', { code: codeWith(e, 'quiz', { saveResult: 1 }) });
  assert.equal(card.status, 'returned');
  const rows = Screen.visibleRows(Screen.model(card, e.board.get('fate')));
  assert.deepEqual(rows.map(r => r[5]), ['否', '否', '否']);
});

test('心理測驗的測試寫成「再打開重新開始」：AI 後端照著寫，前端也做成有重測鈕', () => {
  const e = play('quiz'); meetAll(e);
  const q = sub(e, 'quiz', 'test'); const answers = right(q);
  answers[q.functions.findIndex(f => f.name === 'testReopen')] = { assert: 1 };
  const drives = Works.testDrives(q, answers);
  assert.equal(drives.lastResult.reopen, 1);
  assert.deepEqual([].concat(drives.ui_design[0]), [1]);
});

test('情境漫畫：沒有替代文字 QC 退、Lighthouse 無障礙分數變低；賣書的替代文字照樣過', () => {
  const lh = (swap) => {
    const e = play('comic'); meetAll(e);
    const card = shipped(e, 'comic', { ui_design: uiWith(e, 'comic', swap) });
    return { card, score: Screen.lighthouse(Screen.model(card, e.board.get('fate'))) };
  };
  const ok = lh({}), none = lh({ 1: 2 }), described = lh({ 1: 1 });
  assert.equal(none.card.status, 'returned');
  assert.ok(none.score.accessibility < ok.score.accessibility);
  assert.ok(none.score.notes.includes('漫畫的圖沒有替代文字'));
  assert.equal(described.card.status, 'archived');
  assert.equal(described.score.accessibility, ok.score.accessibility);
});

test('情境漫畫：只能手動上架 QC 驗不出來、月底才出事；照上架時間排只被熙恩嫌', () => {
  const manual = play('comic'); meetAll(manual);
  assert.equal(shipped(manual, 'comic', { code: codeWith(manual, 'comic', { schedule: 1 }) }).status, 'archived');
  assert.ok(manual.usageTally().late.includes('週五晚上八點，雅雯在吃飯'));
  const byDate = play('comic'); meetAll(byDate);
  assert.equal(shipped(byDate, 'comic', { code: codeWith(byDate, 'comic', { bloodPick: 1 }) }).status, 'archived');
  byDate.notifyDone('comic'); tickTo(byDate, byDate.clock.minute + 3);
  assert.ok(lime(byDate, YAWEN).some(t => t.includes('熙恩教授說：「同頻率的人會互相吸引，你把頻率打散了。」')));
});

test('情境漫畫：規格排程只吃會議問到的（計畫排了排程不帶）；測試寫「看得到第一格就好」AI 後端只存第一格', () => {
  const skipped = play('comic'); skipMeeting(skipped);
  skipped.doWork('comic', 'doc_plan', right(sub(skipped, 'comic', 'doc_plan')));
  assert.deepEqual(givenOf(skipped, 'comic', 'doc_spec', 0), []);
  assert.deepEqual(givenOf(skipped, 'comic', 'doc_spec', 1), [0], '計畫排了照血型推薦');
  const asked = play('comic'); meetAll(asked);
  assert.deepEqual(givenOf(asked, 'comic', 'doc_spec', 0), [0]);
  const q = sub(asked, 'comic', 'test'); const answers = right(q);
  answers[q.functions.findIndex(f => f.name === 'testUpload')] = { assert: 1 };
  assert.equal(Works.testDrives(q, answers).uploadComic.store, 2);
});

test('宇宙能量專欄：只能貼圖 QC 驗不出來、公式那欄變圖片；「研究顯示」連到維基百科只被熙恩嫌', () => {
  const image = play('column'); meetAll(image);
  const card = shipped(image, 'column', { code: codeWith(image, 'column', { mathEditor: 1 }) });
  assert.equal(card.status, 'archived');
  assert.ok(image.usageTally().late.includes('公式改一個數字要重做一張圖'));
  assert.deepEqual(Screen.visibleRows(Screen.model(card, image.board.get('fate'))).map(r => r[2]), ['（圖片）', '（圖片）']);
  const wiki = play('column'); meetAll(wiki);
  assert.equal(shipped(wiki, 'column', { ui_design: uiWith(wiki, 'column', { 2: 1 }) }).status, 'archived');
  wiki.notifyDone('column'); tickTo(wiki, wiki.clock.minute + 3);
  assert.ok(lime(wiki, YAWEN).some(t => t.includes('熙恩教授說：「主流科學常常忽視特殊個案')));
});

test('宇宙能量專欄：會議問到公式、連結，前端第 1、3 題定好；規格寫了數學式也定第 1 題；作者介紹沒有文件寫得到', () => {
  const asked = play('column'); meetAll(asked);
  assert.deepEqual([0, 1, 2].map(i => givenOf(asked, 'column', 'ui_design', i)), [[0], [], [0]]);
  const skipped = play('column'); skipMeeting(skipped);
  assert.deepEqual(givenOf(skipped, 'column', 'ui_design', 0), []);
  skipped.doWork('column', 'doc_spec', [0]);
  assert.deepEqual(givenOf(skipped, 'column', 'ui_design', 0), [0]);
  const q = sub(asked, 'column', 'test'); const answers = right(q);
  answers[q.functions.findIndex(f => f.name === 'testShopLink')] = { assert: 1 };
  const drives = Works.testDrives(q, answers);
  assert.equal(drives.linkShop.to, 1);
  assert.equal((drives.ui_design || {})[2], undefined, '「書店首頁」對不到前端的選項');
});

test('傍晚轉述：卡上寫了雅雯的好壞兩句；照正解做完挑好的，照常理做挑壞的', () => {
  const lines = {
    quiz: { good: '熙恩教授說客人看到前世身分都說「這就是我」，靈魂頻率分析約滿了。', bad: '熙恩教授說客人一直按重測，波函數都亂掉了。' },
    comic: { good: '熙恩教授說讀者滑到最後一格都會停下來，好幾位去預約了。', bad: '熙恩教授說四格一次看完，結論還沒校準就給出去了。' },
    column: { good: '熙恩教授說文章開頭那排公式，讀者都看得很認真。', bad: '熙恩教授說版面太乾淨，看起來像是他自己寫的。' },
  };
  for (const [id] of XIEN_CARDS) {
    assert.deepEqual(specOf(id).evening, lines[id], id);
    const good = play(id); meetAll(good); shipped(good, id);
    assert.equal(eveningLine(good, id), lines[id].good, id);
    const plain = play(id); meetAll(plain); shipped(plain, id, { ui_design: uiWith(plain, id, { 0: 1 }) });
    assert.equal(eveningLine(plain, id), lines[id].bad, id);
  }
});

test('#501 的規格存了血型：漫畫的推薦直接定在照血型推', () => {
  const e = play('comic'); skipMeeting(e);
  assert.deepEqual(givenOf(e, 'comic', 'doc_spec', 1), []);
  e.doWork('profile', 'doc_spec', right(sub(e, 'profile', 'doc_spec')));
  assert.deepEqual(givenOf(e, 'comic', 'doc_spec', 1), [0]);
});

test('情境漫畫排程寫錯：第二列推薦給寫等後台上架，上架時間停在最後一次更新', () => {
  const e = play('comic'); meetAll(e);
  const card = shipped(e, 'comic', { code: codeWith(e, 'comic', { schedule: 1 }) });
  const rows = Screen.visibleRows(Screen.model(card, e.board.get('fate')));
  assert.equal(rows[1][0], '11/13 20:00');
  assert.equal(rows[1][5], '今日內容等後台上架');
});
