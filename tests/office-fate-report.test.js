// 第三關「心領神會」的結算卡（劇本「結算卡多的行」）與平行宇宙的新卡（劇本「成功製造需求」）
const test = require('node:test');
const assert = require('node:assert');
const { Engine, Sandbox, tickTo, right, meetAll, shipped, lime } = require('./scenery-helpers.js');
require('../sandbox-fate.js');

const play = (mode = 'legacy') => new Engine(Sandbox.make('fate', mode), { name: '測試', title: '工程師' });
const uiOf = (card) => card.subtasks.find(s => s.work === 'ui_design').question;
const RIGHT_COLORS = { dark: false, light: { bg: 'violet', fg: 'white', deco: 'gold', accent: 'pink' } };
// 照常理做：倒過來的題（有老師不滿的選項）全選那個不滿的，其他照正解
const plain = (q) => right(q).map((a, i) => {
  const hit = Object.entries(q.items[i].outcome || {}).find(([, o]) => o.kind === 'displeased');
  return hit ? Number(hit[0]) : a;
});
const motherAnswers = (e, layout) => { const a = right(uiOf(e.board.get('fate'))); a[0] = RIGHT_COLORS; a[1] = layout; return a; };
const report = (e) => e.script.report(e);

test('結算卡縮圖畫網站首頁（母議題沒有手動測試）；沒有主卡，同事評語不照單張卡算', () => {
  const e = play(); meetAll(e);
  assert.equal(e.script.reportShot, 'fate');
  assert.equal(e.script.mainCard, undefined);
  e.doWork('fate', 'ui_design', motherAnswers(e, 0));
  const shot = require('../screen.js').model(e.board.get(e.script.reportShot));   // app.js 的 reportView 照這個畫縮圖
  assert.equal(shot.built, true);
  assert.equal(shot.template, 'home');
  assert.deepEqual(shot.rituals, ['bagua']);
  assert.equal(shot.theme.bg, '#5B2A86', '首頁照母議題自己的配色');
});

test('照常理做的子議題結案：結算卡寫老師嫌太好用幾次', () => {
  const e = play(); meetAll(e);
  shipped(e, 'profile', { ui_design: plain(uiOf(e.board.get('profile'))) });
  const line = report(e).extra.find(t => t.startsWith('老師嫌太好用'));
  assert.ok(line && !/：0 次/.test(line), line);
});

test('網站選單做成圓盤：結算卡並排無障礙分數和老師很有感覺；一般導覽列就沒有這行', () => {
  const e = play(); meetAll(e);
  e.doWork('fate', 'ui_design', motherAnswers(e, 0));
  const line = report(e).extra.find(t => t.startsWith('Lighthouse'));
  assert.match(line, /^Lighthouse 無障礙 \d+ 分／老師：很有感覺$/);
  assert.ok(Number(line.match(/\d+/)[0]) <= 60, line);
  const other = play(); meetAll(other);
  other.doWork('fate', 'ui_design', motherAnswers(other, 1));
  assert.ok(!report(other).extra.some(t => t.startsWith('Lighthouse')));
});

test('倒過來的前端程式全照常理做：開源精神，雅雯和三位老師說要改成事務所的內部工具', () => {
  const e = play(); meetAll(e);
  e.doWork('fate', 'ui_design', plain(uiOf(e.board.get('fate'))).map((a, i) => (i === 0 ? RIGHT_COLORS : a)));
  shipped(e, 'profile', { ui_design: plain(uiOf(e.board.get('profile'))) });
  const r = report(e);
  assert.ok(r.traits.some(t => t.title === '開源精神'));
  assert.ok(r.peers.some(p => p.text.startsWith('老師們看完說，這個網站的操作太直覺了')));
  assert.equal(r.peers.filter(p => /瀞玄|莉莉絲|熙恩/.test(p.who)).length, 3);
});

test('有一題做成老師要的：沒有開源精神', () => {
  const e = play(); meetAll(e);
  e.doWork('fate', 'ui_design', motherAnswers(e, 0));
  shipped(e, 'profile', { ui_design: plain(uiOf(e.board.get('profile'))) });
  assert.ok(!report(e).traits.some(t => t.title === '開源精神'));
});

test('阿姿在群組抱怨過：成就水逆、同事評語有阿姿；小潘那句一定在', () => {
  const e = play(); meetAll(e);
  e.doWork('fate', 'ui_design', motherAnswers(e, 0));
  shipped(e, 'profile');
  tickTo(e, e.clock.minute + 2);
  const r = report(e);
  assert.ok(r.traits.some(t => t.title === '水逆'));
  assert.ok(r.peers.some(p => p.who === 'QC 阿姿'));
  assert.ok(r.peers.some(p => p.who === '同事 小潘' && p.text.includes('三個命理老師一起擺攤就是惡夢')));
});

test('會議裡半句全部翻對：心領神會；漏問一題就沒有', () => {
  const e = play(); meetAll(e);
  assert.ok(report(e).traits.some(t => t.title === '心領神會'));
  const skipped = play();
  assert.ok(!report(skipped).traits.some(t => t.title === '心領神會'));
});

test('平行宇宙：每張子議題和池卡都有新卡；個人資料卡做歪開出客人問事紀錄', () => {
  const e = play(); meetAll(e);
  const cards = e.script.parallel.cards;
  for (const id of ['profile', 'chart', 'reading', 'booking', 'lot', 'bird', 'lamp', 'monthly', 'lucky', 'tarot', 'quiz', 'comic', 'column']) assert.ok(cards[id], id);
  assert.deepEqual(e.script.parallel.ignore, ['displeased']);
  const fresh = e.spawnParallel(e.board.get('profile'));
  assert.equal(fresh.title, '客人問事紀錄');
  assert.ok(lime(e, '解憂時代 助理 雅雯').some(t => t.includes('可以改成客人問事紀錄嗎')));
});

test('結算卡客人那句：都做成老師要的講功力在流動，有一題照一般網站做講真的準嗎', () => {
  const ritual = play(); meetAll(ritual); ritual.doWork('fate', 'ui_design', motherAnswers(ritual, 0)); shipped(ritual, 'profile');
  assert.deepEqual(ritual.userReview(), [{ who: '客人', text: '「感受到老師的功力在網站中流動。」' }]);
  const plain = play(); meetAll(plain); plain.doWork('fate', 'ui_design', motherAnswers(plain, 1));
  assert.deepEqual(plain.userReview(), [{ who: '客人', text: '「感覺很普通，算出來的內容真的準嗎？」' }]);
  assert.deepEqual(play().userReview(), []);
});

test('阿姿只抱怨畫面最扯的幾張：三句各講一次就停，鳥卦那句另外算', () => {
  const e = new Engine(Sandbox.make('fate', 'legacy', { pool: ['bird'] }), { name: '測試', title: '工程師' }); meetAll(e);
  e.doWork('fate', 'ui_design', motherAnswers(e, 0));
  for (const id of ['profile', 'chart', 'bird', 'booking']) { shipped(e, id); tickTo(e, e.clock.minute + 2); }
  const said = e.docs.filter(d => d.from === 'QC 阿姿' && d.group).map(d => d.text);
  assert.equal(said.length, 3);   // 圓盤選單（第一張子議題驗收時）、羅盤、鳥卦；三句水逆只講了兩句，第三句留給光明燈
  assert.ok(said.some(t => t.includes('影片快轉鈕')));
  assert.equal(new Set(said).size, 3);
});

test('傍晚 18:00 雅雯轉述：正解講好的那句、照常理做講不好的那句', () => {
  assert.deepEqual(Sandbox.make('fate', 'legacy').evening, { at: 18 * 60, from: '解憂時代 助理 雅雯' });
  const good = play(); meetAll(good); shipped(good, 'profile');
  assert.equal(good.eveningReview(), true);
  assert.ok(lime(good, '解憂時代 助理 雅雯').some(t => t.includes('填資料的過程很有儀式感')));
  const bad = play(); meetAll(bad); shipped(bad, 'profile', { ui_design: plain(uiOf(bad.board.get('profile'))) });
  bad.eveningReview();
  assert.ok(lime(bad, '解憂時代 助理 雅雯').some(t => t.includes('一頁就填完')));
});

test('聖筊次數寫死：驗收勾了「後台改成 1」那條，阿姿照著測就退件；沒勾就上線，月底才出事', () => {
  const codeWith = (e) => { const q = e.board.get('lot').subtasks.find(s => s.work === 'code').question; const a = right(q); a[q.functions.findIndex(f => f.name === 'throwCount')] = { flow: 1 }; return a; };
  const level = () => new Engine(Sandbox.make('fate', 'legacy', { pool: ['lot'] }), { name: '測試', title: '工程師' });
  const caught = level(); meetAll(caught);
  assert.equal(shipped(caught, 'lot', { code: codeWith(caught) }).status, 'returned');
  const missed = level(); meetAll(missed);
  const accept = missed.board.get('lot').subtasks.find(s => s.work === 'doc_accept').question;
  assert.equal(shipped(missed, 'lot', { code: codeWith(missed), doc_accept: [right(accept)[0].filter(i => i !== 2)] }).status, 'archived');
  assert.ok(missed.cardOutcomes(missed.board.get('lot')).some(o => o.kind === 'late'));
});

test('夏令時間只寫了幾年的年表：QC 驗不出來上線了，結算卡排錯的盤', () => {
  const e = play(); meetAll(e);
  const code = e.board.get('profile').subtasks.find(s => s.work === 'code').question;
  const picks = right(code); picks[code.functions.findIndex(f => f.name === 'dstFix')] = { flow: 1 };
  shipped(e, 'profile', { code: picks });
  assert.equal(e.board.get('profile').status, 'archived');
  assert.ok(report(e).extra.includes('排錯的盤：1 張'));
});

test('解說只露一半接預約：導去預約的客人照題目的人數加總', () => {
  const e = play(); meetAll(e); shipped(e, 'reading');
  assert.ok(report(e).extra.includes('導去預約的客人：12 位'));
});

test('前端程式選了儀式的寫法：成品畫面多那一塊，網站門面的圓盤選單每一頁都有', () => {
  const e = new Engine(Sandbox.make('fate', 'legacy', { pool: ['lot'] }), { name: '測試', title: '工程師' }); meetAll(e);
  e.doWork('fate', 'ui_design', motherAnswers(e, 0));
  const lot = e.board.get('lot');
  e.doWork('lot', 'ui_design', right(uiOf(lot)));
  const m = e.screenOf(lot);
  assert.deepEqual(m.siteRituals, ['bagua']);
  assert.deepEqual(m.rituals, ['jiao', { kind: 'fog', say: '請老師為您解籤' }]);
});
