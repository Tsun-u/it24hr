// verdict.js — 從點擊日誌判定玩家今天是哪一種資料結構，並產出結算卡的文字。
//
// 日誌一筆：{ minute, cardId, position: 'newest'|'oldest'|'middle'|'only', opened, acted }
//   acted=false 是點開看了沒做（Tree 的訊號）。
// 規則：
//   1. 沒有任何一筆 → null
//   2. 看了沒做的比例 ≥ 40%，而且最後動手前看過 ≥ 2 張 → tree
//   3. 只看動手的那些筆，排除 only：最新 ≥ 60% → stack；最早 ≥ 60% → queue；
//      最新＋最早 ≥ 80% 且各 ≥ 30% → deque
//   4. 都不是 → mixed
(function (root) {
  const NAMES = {
    stack: { name: 'Stack', line: '永遠做最新進來的。早上第一件事：未開啟。' },
    queue: { name: 'Queue', line: '你很公平。沒有人覺得你公平。' },
    deque: { name: 'Deque', line: '這個 deque 是大家的，誰都能從前面塞。' },
    tree:  { name: 'Tree', line: '你種了一棵很漂亮的樹。' },
    null:  { name: 'null', line: '大家都在等你初始化。' },
    mixed: { name: 'Linked List', line: '誰拉你，你就跟著走。' },
  };
  const POS_TEXT = { newest: '拿了最新的那件', oldest: '拿了最早的那件', middle: '拿了中間的那件', only: '桌上只有一件' };

  // 時鐘分鐘 → HH:MM。帶到隔天的卡時間往前推一天、會是負的：寫成「昨天 HH:MM」
  function hhmm(minute) {
    const day = Math.floor(minute / (24 * 60)), m = minute - day * 24 * 60;
    const clock = `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;
    return day >= 0 ? clock : `${day === -1 ? '昨天' : `${-day} 天前`} ${clock}`;
  }
  // 估時的參考：這張卡在現實中大約多久；claire 是把 Claire 自己加的規格也做完的工時
  const realLine = (real) => `現實中純手工大約 ${real.manual}，有 AI 幫忙大約 ${real.ai}${real.claire ? `，加了 Claire 自主規格大約 ${real.claire}` : ''}`;
  // 主管看估時：估的比實際多超過 4 小時是摸魚、實際比估的多超過 4 小時是能力不足，其他算按時
  const ESTIMATE_GAP_HOURS = 4;
  function estimateComment(estimateHours, actualMin) {
    const gap = estimateHours - actualMin / 60;
    if (gap > ESTIMATE_GAP_HOURS) return '你在摸魚嗎？';
    if (gap < -ESTIMATE_GAP_HOURS) return '多花了這麼多時間是能力不足嗎？';
    return '按時完成，繼續保持';
  }
  // 一段時間（分鐘）：「7 小時 50 分」「40 分鐘」
  function duration(min) {
    const h = Math.floor(min / 60), m = min % 60;
    return h ? `${h} 小時${m ? ` ${m} 分` : ''}` : `${m} 分鐘`;
  }
  const evidenceOf = (entries, filter) =>
    entries.filter(filter).slice(0, 3).map(e => `${hhmm(e.minute)} ${e.acted ? POS_TEXT[e.position] : '點開看了沒做'}`);

  function classify(log) {
    if (!log.length) return { kind: 'null', evidence: [], counts: {} };
    const looked = log.filter(e => !e.acted);
    const lookRatio = looked.length / log.length;
    const lastAct = log.map(e => e.acted).lastIndexOf(true);
    const lookedBefore = new Set(log.slice(0, Math.max(lastAct, 0)).filter(e => !e.acted).map(e => e.cardId)).size;
    if (lookRatio >= 0.4 && lookedBefore >= 2) return { kind: 'tree', evidence: evidenceOf(log, e => !e.acted), counts: { looked: looked.length } };

    const acted = log.filter(e => e.acted && e.position !== 'only');
    const n = acted.length;
    const count = (p) => acted.filter(e => e.position === p).length;
    const newest = count('newest'), oldest = count('oldest');
    const counts = { newest, oldest, middle: count('middle') };
    if (n && newest / n >= 0.6) return { kind: 'stack', evidence: evidenceOf(acted, e => e.position === 'newest'), counts };
    if (n && oldest / n >= 0.6) return { kind: 'queue', evidence: evidenceOf(acted, e => e.position === 'oldest'), counts };
    if (n && (newest + oldest) / n >= 0.8 && newest / n >= 0.3 && oldest / n >= 0.3)
      return { kind: 'deque', evidence: evidenceOf(acted, e => e.position !== 'middle'), counts };
    return { kind: 'mixed', evidence: evidenceOf(log, () => true), counts };
  }

  // 結算卡（版面）：左欄放詳細統計（tally，每行帶 weight 決定字級）；
  // 右欄放成就、彙整統計和有評語的——「今天你是 {資料結構}」印章＋總評、習慣與成就、同事怎麼說、估時表。
  // lines 是整張卡攤平的文字，給測試和純文字輸出用
  // 分數最多一位小數、無條件捨去：差一點的不會被進位成滿分
  const oneDecimal = (n) => Math.floor(n * 10 + 1e-9) / 10;
  // estimates：有估時的卡 [{ card, yours, actual, boss, real: { manual, ai } }]
  // traits：習慣與成就 [{ title, text }]（測試風格、大胃王、公私分明……），便條和平板也排進這裡
  // extra：左欄的其他明細，字串或 { text, group }
  // works：照卡分組 [{ card: '#124 卡名', items: [{ label, score, max, times }] }]，同一張卡重做的工作只列最後一次、註明做了幾次
  function report({ player, verdict, handled, skippedDocs, works, estimates = [], unlabeled, leftAt, extra = [], traits = [], peers = [] }) {
    const v = NAMES[verdict.kind];
    const tally = [
      { text: `處理了 ${handled} 件`, weight: 'big' },
      { text: '真正被優先處理：0 件', weight: 'big' },
      ...works.flatMap(g => [{ text: g.card, weight: 'card' },
        ...g.items.map(w => ({ text: `${w.label}：${oneDecimal(w.score)}／${w.max}${w.times > 1 ? `（做了 ${w.times} 次）` : ''}`, weight: 'work' }))]),
    ];
    if (skippedDocs) tally.push({ text: `跳過的文件：${skippedDocs} 份` });
    tally.push(...extra.map(x => (typeof x === 'string' ? { text: x } : x)));   // { text, group } 的畫面上收成一個可以摺的區塊
    if (leftAt) tally.push({ text: `下班：${leftAt}`, weight: 'big' });
    const habits = [...traits];
    if (unlabeled.note !== undefined) habits.push({ title: '便條', text: unlabeled.note ? '看了' : '沒打開' });
    if (unlabeled.charged !== undefined) habits.push({ title: '平板', text: unlabeled.charged ? '有充電' : '3%' });
    const lines = [
      `${player.name}｜${player.title}`,
      `今天你是一個 ${v.name}`,
      v.line,
      ...verdict.evidence.map(e => `・${e}`),
      ...tally.map(t => t.text),
      ...(habits.length ? ['── 習慣與成就 ──', ...habits.map(t => `${t.title}：${t.text}`)] : []),
      ...estimates.map(e => `估時 ${e.card}：你估 ${e.yours}，實際 ${e.actual}${e.real ? `（${realLine(e.real)}）` : ''}${e.boss ? `，主管：「${e.boss}」` : ''}`),
      ...(peers.length ? ['── 同事怎麼說 ──', ...peers.map(p => `${p.who}：${p.text}`)] : []),
    ];
    return { lines, player, kind: v.name, line: v.line, evidence: verdict.evidence, tally, traits: habits, estimates, peers };
  }

  // 同事怎麼說：SA 看所有文件；QC 看驗收文件和你自己測的落實度（＋退了幾次）；
  // 其他 IT 看規格、程式、測試方式、部署；需求單位看這張卡的完成度
  function ratio(card, work) {
    const h = [...card.history].reverse().find(x => x.work === work && x.result && x.result.max);
    return h ? h.result.score / h.result.max : null;
  }
  function avg(list) { const v = list.filter(x => x !== null); return v.length ? v.reduce((a, b) => a + b, 0) / v.length : null; }
  // 需求單位的預設評語：有沒有做需求討論 × 功能有沒有全對。劇本可以用 flavor 覆寫結案／沒結案的那句
  function requesterLine(card, name, flavor = {}) {
    if (card.status === 'archived' && flavor.done) return flavor.done;
    if (!['archived', 'to_qc'].includes(card.status) && flavor.undone) return flavor.undone;
    const discussed = card.history.filter(h => h.work === 'discuss').length;
    const code = [...card.history].reverse().find(h => h.work === 'code' && h.result);
    const allRight = !!code && !(code.result.bugs || []).length;
    const tail = card.unnotified ? '「……上線了也沒人跟我說。」' : card.earlyNotify ? '「你叫我用的時候還不能用欸。」' : '';
    if (discussed && discussed <= 2 && allRight) return `「${name}，足感心的～」${tail}`;
    if (!discussed && allRight) return `「${name}怎麼都知道？」${tail}`;
    if (!discussed) return `「這跟我想的有點不一樣。」${tail}`;
    return `「老師在講你有沒有在聽？」${tail}`;
  }
  function peerReviews(card, { testStyle = '', name = '你', flavor } = {}) {
    const docs = avg([ratio(card, 'doc_plan'), ratio(card, 'doc_spec'), ratio(card, 'doc_accept')]);
    const sa = docs === null ? '「一份文件都沒有，我當你是口頭承諾。」'
      : docs >= 0.9 ? '「文件寫得比我開的卡還清楚。」' : docs >= 0.6 ? '「文件有寫，有幾處要補。」' : '「下次文件先寫再動手，拜託。」';
    const selfTested = card.history.some(h => h.work === 'test') || card.history.some(h => h.work === 'manual_test' && h.result && h.result.ops && h.result.ops.length);
    const rejects = card.qcRejects || 0;
    const early = card.earlyNotify ? '「還沒驗就叫人家用？」' : '';
    const qc = early + (ratio(card, 'doc_accept') === null ? '「沒有驗收文件，我只能照自己的想法驗。」'
      : rejects >= 2 ? `「退了 ${rejects} 次。測試是你的工作，不是我的。」`
      : rejects === 1 ? (selfTested ? '「有自己測，但還是漏了一個。」' : '「沒自己測就交過來，是要我幫你測？」')
      : selfTested ? '「自己先測過的卡，驗起來就是不一樣。」' : '「這次運氣好。」');
    const it = avg([ratio(card, 'doc_spec'), ratio(card, 'code'), ratio(card, 'deploy')]);
    const peer = it === null ? '「沒看到規格也沒看到程式，無法評論。」'
      : it >= 0.9 ? `「規格清楚、程式乾淨，${testStyle || '有測'}——可以。」` : it >= 0.6 ? '「能動，但接手的人會想找你。」' : '「這段程式我不想接。」';
    return [
      { who: 'SA 怡君', text: sa }, { who: 'QC 阿姿', text: qc }, { who: '同事 小潘', text: peer },
      { who: (flavor && flavor.who) || '需求單位', text: requesterLine(card, name, flavor) },
    ];
  }

  // 三天總結算：三個時代各一句總評、三天的印章並排，底下是那天結算卡右欄的「習慣與成就」「同事怎麼說」「估時」。
  // reports 是存檔裡每天的結算卡（app.reportView），少一天就少一格
  const TRAINING = [['day1', '第一天'], ['day2', '第二天'], ['day3', '第三天']];
  function summary(reports = {}) {
    const days = TRAINING.filter(([key]) => reports[key]).map(([key, name]) => {
      const { report, mode } = reports[key];
      return { day: name, mode: mode || 'legacy', stamp: report.kind, line: report.line,
        traits: report.traits || [], peers: report.peers || [], estimates: report.estimates || [] };
    });
    return { days, chain: days.map(d => d.stamp).join(' → ') };
  }

  if (typeof module !== 'undefined') module.exports = { classify, report, peerReviews, requesterLine, NAMES, hhmm, duration, realLine, estimateComment, summary };
  else Object.assign(root, { Verdict: { classify, report, peerReviews, requesterLine, NAMES, hhmm, duration, realLine, estimateComment, summary } });
})(typeof window !== 'undefined' ? window : globalThis);
