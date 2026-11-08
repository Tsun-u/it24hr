// tests/scenery-helpers.js：第二關「最美的風景」測試共用的小工具（檔名不是 .test.js，不會被當成測試跑）
const { C } = require('../contract.js');
const { Engine } = require('../engine.js');
const { Sandbox } = require('../sandbox.js');
require('../sandbox-scenery.js');

const XIUQIN = '源裕 管理部 秀琴姐', JIANHONG = '源裕 少東 建宏', XIONG = '源裕 組長 雄哥';
// carry.pool 指定模組池抽哪兩個（測試要固定）；app.js 不帶就隨機抽
const play = (mode = 'legacy', carry = { pool: ['trace', 'stock'] }) => new Engine(Sandbox.make('scenery', mode, carry), { name: '測試', title: '工程師' });
const at = (h, m) => h * 60 + m;
// 推到某個時鐘分鐘：提示先收掉；21:00 被趕下班會停在下班選單（時鐘暫停），空手回家接著推
const tickTo = (e, minute) => {
  while (e.clock.minute < minute && !e.ended) {
    if (e.hint) e.dismissHint();
    if (e.home && e.home.phase === 'menu') e.goHome({ channel: 'pickup', order: {} });
    e.tick(C.MS_PER_GAME_MIN);
  }
};
// 照正解做一件工作的答案（寫法在 Works.rightAnswers，審卡頁也用它）
const right = require('../works.js').rightAnswers;
// 廠商需求會議：09:31 起客戶一段一段講，每段照正解問完再換下一段（swap[頁] 換掉那一段的答案，寫 null 是那段不問）；
// 時程不回答就散會，等怡君開卡
function meetAll(e, swap = {}) {
  tickTo(e, at(9, 31));
  for (let step = e.vendorStep(); step; step = e.vendorNext()) {
    if (!step.page) continue;
    const answers = step.page.id in swap ? swap[step.page.id] : right(step.page.question);
    if (answers !== null) e.vendorAsk(step.page.id, answers);
  }
  tickTo(e, e.clock.minute + 11);
  return e;
}
// 廠商需求會議什麼都不問：每段都說沒問題、時程也不回答，散會後等怡君開卡（會議沒有時間限制，不走完就不散會）
function skipMeeting(e) {
  tickTo(e, at(9, 31));
  while (e.vendorNext());
  tickTo(e, e.clock.minute + 11);
  return e;
}
// 一張卡的工作照卡上的順序全部做完；swap[work] 換掉那件工作的答案（可以是函式 (e, card) => 答案，做到那件時才算），
// 寫 null 是跳過那件不做。會議帶進來的需求討論是唯讀的，doWork 會擋，不影響
function doAll(e, id, swap = {}) {
  const card = e.board.get(id);
  for (const s of card.subtasks) {
    if (s.work === 'route' && card.route != null) continue;   // 路選過了，不再做一次「接手或重來」
    const given = s.work in swap ? swap[s.work] : right(s.question);
    const answers = typeof given === 'function' ? given(e, card) : given;
    if (answers !== null) e.doWork(id, s.work, answers);
  }
}
// 開卡、做完、交 QC、等阿姿驗完
function shipped(e, id, swap = {}) { doAll(e, id, swap); e.submit(id); tickTo(e, e.clock.minute + C.QC_TURNAROUND_MIN + 1); return e.board.get(id); }
// 開發照正解，但幾個 function 改成指定的寫法：codeWith(e, 'buy', { regularPrice: 1 })（規格連動的 function 只有一格 flow）
function codeWith(e, id, flows) {
  const q = e.board.get(id).subtasks.find(s => s.work === 'code').question; const a = right(q);
  q.functions.forEach((f, i) => { if (f.name in flows) a[i] = { [Object.keys(f.fields)[0]]: flows[f.name] }; });
  return a;
}
const lime = (e, from) => e.docs.filter(d => d.from === from && d.origin === 'line').map(d => d.text);
module.exports = { C, Engine, Sandbox, XIUQIN, JIANHONG, XIONG, play, at, tickTo, right, meetAll, skipMeeting, doAll, shipped, codeWith, lime };
