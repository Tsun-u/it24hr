// engine.js — 遊戲狀態機：把時鐘、看板、劇本、點擊日誌接起來。純邏輯，不碰畫面。
// 畫面用 engine.on(event, fn) 收事件，用 engine 的方法做事。
//
// 劇本格式（day1.js）：
//   cards:   [{ at, id, title, body, from, assignee, subtasks: [{ work, question }], nags: [{ after, who, text }] }]
//   hints:   [{ after: 事件名, text, until: 事件名 }]   提示出現時時鐘暫停，until 事件發生才繼續
//   meetings:[{ at, end, title, lines: [{ at, text, key, options: [{ text, flag, card, reply }] }], ifSilent: card }]
//   badEnd:  [{ at, reason, check(engine) }]
//   unlabeled: { note: '便條內容', devices: { phone, tablet } }
//   sources: [{ at, id, kind: 'boss'|'mail'|'line', from, title, module, text | lines, patience, sentences: [{ text, keep }], subtasks, relatedTo? }]
//     relatedTo：這份需求其實是哪張卡的追加需求；玩家開卡時掛對母議題（draft.parent）才對，轉給 SA 她會自己掛
//     來源不直接變卡：boss 先當訪客站在桌邊（理他→電腦裡的文件；不理→桌上的紙），mail／line 直接進文件；
//     文件由玩家開卡（openCardFrom）或轉給 SA，卡填得好不好記在 card.draft
//
// 事件名：card:arrived:<id>、card:opened:<id>、work:done:<id>:<work>、card:submitted:<id>、
//   card:to_sa:<id>、card:nagged:<id>、note:opened、device:charged:<name>、board:opened（畫面發）、
//   visitor:arrived、visitor:talked、visitor:left、paper:arrived、doc:arrived:<origin>、doc:forwarded、card:needs_source、
//   hint、hint:cleared、meeting:start、meeting:line、meeting:end、meeting:closed（畫面收掉會議室，desk 發）、bad_end、day:end
(function (root) {
  const isNode = typeof require === 'function';
  const { C } = isNode ? require('./contract.js') : root;
  const { Clock } = isNode ? require('./clock.js') : root;
  const { Card, makeCard, Board } = isNode ? require('./cards.js') : root;
  const Works = isNode ? require('./works.js') : root.Works;
  const Verdict = isNode ? require('./verdict.js') : root.Verdict;
  const Sources = isNode ? require('./sources.js') : root.Sources;
  const Screen = isNode ? require('./screen.js') : root.Screen;
  const Home = isNode ? require('./home.js') : root.Home;
  const hhmm = (m) => `${String(Math.floor(m / 60) % 24).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;
  const SA = 'SA 怡君';
  const QC = 'QC 阿姿';

  const CHARGE_RATE = 5;   // 插著充電線時每分鐘漲的電量（%）
  const DRAIN_IDLE = 1 / 30;   // 沒插電放著每分鐘掉的電量（%）：半小時 1%，極緩慢
  const DRAIN_IN_USE = 1;      // 拿來實機測試的時候每分鐘掉的電量（%）
  const PLAYER_EVENTS = ['card:opened', 'work:opened', 'work:done', 'card:submitted', 'card:to_sa', 'note:opened', 'device:charged', 'board:opened', 'meeting:raised', 'visitor:talked', 'doc:', 'paper:read', 'ai:started', 'ai:answered', 'ai:notes', 'claim:checked'];
  const AI_RESET_MIN = 5 * 60;   // AI 額度每五小時重置（09:00、14:00、19:00）
  // LIME 回訊息後對方回哪張貼圖：reply 題寫了 stickers 就照寫的；沒寫的話，回對了謝啦、其他好喔
  const stickerFor = (item, picked) => (item.stickers && item.stickers[picked]) || (picked === item.answer ? 'thanks' : 'ok');
  // Accept Edits、Auto 的 AI 部署每一步怎麼問；GUARDED 是不可逆、選 N 就停下來（中斷或補做）的，其他選 N 就是不做
  const STEPWISE_DEPLOY = ['acceptEdits', 'auto'];
  const DEPLOY_ASKS ={ upload: '可以上傳嗎？', replace: '可以替換嗎？', migrate: '可以跑資料轉換嗎？', smoke: '需要測試嗎？', notify: '要不要通知？' };
  const DEPLOY_GUARDED = { upload: '上傳', replace: '替換', migrate: '跑資料轉換' };
  const DOC_WORKS = ['doc_plan', 'doc_spec', 'doc_accept'];   // 文件類工作：Novel 寫的會太長（card.wordy）
  const TEAM_GROUP = '精銳三人產線';
  // Claire 的回答長相（劇本 claire[事]）：Verse 一句、Essay 多一句收尾、Novel 照問題開頭再接同一篇本文、
  // Pedia 一整個條目（問個別設備先說查不到）
  function claireLines(topic, ask, model) {
    if (model === 'Novel') return [ask.novel, ...topic.novel];
    if (model === 'Pedia') return [`條目「${topic.pedia.title}」`, ...(ask.pediaMiss ? ['本百科不收錄個別設備之資料。以下為相關條目。'] : []), ...topic.pedia.lines];
    return model === 'Essay' ? [ask.short, '以上，供您參考。'] : [ask.short];
  }
  const PLAIN_NOTE = '文件寫人話：只寫要做什麼、怎麼驗，不寫為什麼要有這份文件。';   // 退回選「用人話寫」記進 CLAIRE.md 的那句

  const MEETING_REPLY_GAP_MIN = 2;   // 舉手後對方接話，隔多久才輪到收尾句（跟劇本句子的間隔差不多）
  // 會議幾點散（從 09:00 起算）：照劇本的 end，但可以舉手的那句還在飛就等它飛完，不然玩家來不及點
  const meetingEnd = (m) => Math.max(m.end, ...(m.lines || []).filter(l => l.key).map(l => m.at + l.at + C.DANMAKU_FLY_MIN));
  // 來源進電腦之後的樣子；老闆講的話併成一段
  const makeDoc = (src, origin) => ({
    id: src.id, title: src.title, from: src.from, module: src.module || null,
    text: src.text || (src.lines || []).join('\n'), sentences: src.sentences || [], subtasks: src.subtasks || [], origin, reply: src.reply,
    group: src.group || null,           // LIME 群組名（例如「精銳三人產線」）：訊息放進群組，不是個人對話
    chase: !!src.chase,                 // 客戶來追進度（結算卡數「客戶在群組追問」）
    relatedTo: src.relatedTo || null,   // 這份需求其實是哪張卡的追加需求（卡的 id）
    screen: src.screen || null,         // 做出來的頁面長什麼樣（screen.js）
    aiTrace: src.aiTrace || null,       // 轉給 SA 時（hybrid）她跟 AI 討論出來的那句主張
    saChecks: src.saChecks || null,     // 怡君開成卡之後，退回 SA 的勾選題（跟著卡走）
    onNoBackup: src.onNoBackup || null, // 這張卡部署沒備份會出的事（資料遺失事件）
    cardSpec: src.cardSpec || null,     // 不管誰開都是同一張固定的卡（好幾則訊息講同一件事）
    chore: src.chore || null,           // 正式上班：這則是哪件雜事（開卡時卡掛上它）
    errand: src.errand || null,         // 正式上班：這則是哪件小事件（回「好，我過去。」就跑一趟）
    reviewSays: src.reviewSays || null, // 檢閱程式碼的評語（跟著卡走）
    saInstant: !!src.saInstant,         // 轉給怡君秒過（她丟給她的 Claire），不等 90 分鐘
    saVerbatim: !!src.saVerbatim,       // 怡君的 Claire 把原文原封不動搬上卡：噪音句的 function 也得填
    nagEvery: src.nagEvery || 0, nagText: src.nagText || null,   // 沒回就每隔幾分鐘追一則（（已讀）不算回）
  });
  // bug 不用寫規格
  const subtasksFor = (type, doc) => (type === 'bug' ? doc.subtasks.filter(s => s.work !== 'doc_spec') : doc.subtasks);
  const ORIGIN_WORD = { boss: '老闆口頭', mail: '信', line: 'LIME', paper: '紙本' };   // 附件「原文：…（來源）」的字
  // 劇本裡任何一句的 {玩家名稱} 換成玩家取的名字。開工時整份換一次（共用的物件照樣共用，function 不動）
  // 字串種子的亂數（mulberry32）：同一個種子每次出來的一串都一樣
  function seededRandom(seed) {
    let a = 2166136261;
    for (const ch of String(seed)) a = Math.imul(a ^ ch.charCodeAt(0), 16777619);
    return () => {
      a = (a + 0x6D2B79F5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function fillName(v, name, seen = new Map()) {
    if (typeof v === 'string') return v.replaceAll('{玩家名稱}', () => name);
    if (!v || typeof v !== 'object') return v;
    if (seen.has(v)) return seen.get(v);
    const out = Array.isArray(v) ? [] : {};
    seen.set(v, out);
    for (const [k, x] of Object.entries(v)) out[k] = fillName(x, name, seen);
    return out;
  }

  class Engine {
    // carried：昨天沒結案的卡（carryOver 存的），今天照原樣放回看板
    constructor(script, player = { name: '玩家', title: '軟體工程師' }, { carried = null } = {}) {
      this.script = fillName(script, player.name);
      this.shuffleSeed = Math.floor(Math.random() * 1e9).toString(36);   // 這一輪選項顯示順序的種子（每玩一次不一樣）
      this.random = seededRandom(this.shuffleSeed);   // 這一輪的亂數（舊料箱內容、對方回訊息的間隔），同一輪固定
      this.player = player;
      this.clock = new Clock();
      this.board = new Board(player.name, script.issueBase);
      this.log = [];                 // 點擊日誌，給 verdict 用
      this.listeners = {};
      this.flags = {};
      this.hint = null;              // 目前顯示的提示
      this.heldHint = null;          // 輪到了、等會議室收掉才出的提示（holdHints）
      this.hintsHeld = false;
      this.hintQueue = [...(script.hints || [])];
      this.meeting = null;           // 進行中的會議
      this.ended = null;             // { badEnd, reason } 或 { badEnd:false, report }
      this.noteOpened = false;
      this.devices = { ...((script.unlabeled && script.unlabeled.devices) || { phone: 100, tablet: 100 }) };
      this.submitted = 0;
      this.closedByHand = 0;         // 自己按結案的卡（雜事卡、沒有人驗的卡）；跟交出去的一起算結算卡的「處理了 N 件」
      this.visitor = null;           // 站在桌邊的人（老闆）
      this.papers = [];              // 桌上的紙
      this.docs = [];                // 電腦裡的文件（含信、LINE）
      this.stats = { forwardedToSA: 0, emptyDrafts: 0, selfOpened: 0, trips: 0, turns: 0 };
      // 正式上班的雜事：進度跟卡分開存，可以不開卡直接做；卡結案了雜事照樣在（例如信箱清太少，下午又滿）
      this.chores = Object.fromEntries((this.script.chores || []).map(c => [c.id, { ...c, stage: 'new', flags: {}, log: [] }]));
      this.place = 'desk';           // 人在哪裡：desk，或劇本 seats 的 id（到同事座位）
      this.askedInPerson = new Set();   // 還沒開口就被走過去、改成當面問的來源（劇本 src.early）
      this.knows = new Set();        // 玩家查到的事（劇本自己取的鍵，例：toner:c8763），打電話時能報什麼看這個
      this.call = null;              // 公務手機正在打的電話（劇本 calls），掛斷後留著讓畫面看最後幾句
      this.plugged = new Set();      // 插著充電線的裝置
      this.inUse = new Set();        // 拿起來實機測試中的裝置
      this.drainCarry = {};          // 還不到 1% 的耗電，累積到滿 1 才扣
      // AI 同事（hybrid 之後）：額度、AI 筆記（{ 主題: { stance, text } }，前一天的從 carry 帶進劇本）、交給它幾次
      this.ai = script.ai ? { left: script.ai.quota, max: script.ai.quota, notes: { ...(script.ai.notes || {}) },
        stats: { delegated: 0, unreviewed: 0, reviewed: 0, revised: 0, asked: 0, models: {} } } : null;
      this.hints = { asked: 0, spent: 0 };   // 在終端機問 Claire（劇本 ai.askable）：問了幾次、花了幾格
      this.modelUses = {};                   // 一天有次數上限的模型（劇本 models.X.perDay）今天用在哪幾件事：{ Pedia: ['#401 收購計價（整張）'] }
      this.modelSpent = {};                  // 各模型今天花了幾格（額度補滿也不歸零；劇本 models.X.cap 看這個）
      // 自己早上寫的便條也是桌上的一張紙
      if (script.unlabeled && script.unlabeled.note) {
        this.papers.push({ id: 'note', title: '便條', from: '自己', module: null, text: script.unlabeled.note, sentences: [], subtasks: [], origin: 'self' });
        // HTTP 對照表給寫程式的日子；沒排開發的劇本寫 noHttpNote 就不放
        if (!script.noHttpNote) this.papers.push({ id: 'http_note', title: 'HTTP 對照表', label: 'HTTP', from: '自己', module: null, text: C.HTTP_NOTE, sentences: [], subtasks: [], origin: 'self' });
      }
      if (carried) this.restore(carried);
      this.on('card:closed', (card) => this.closeParentOf(card));
      this.schedule();
    }

    // ── 換天：沒進已完成的卡隔天留在看板上 ──
    // 今天收尾再整張存起來：怡君手上的卡算她做完了、AI 沒做完的那份作廢（部署做到一半的照中斷處理）；
    // 「SA 要原始來源」的 LIME 訊息跟著卡走，不然那張卡關不掉
    carryOver() {
      const cards = this.board.cards.filter(c => c.status !== 'archived');
      for (const card of cards) {
        if (card.pending) this.saReady(card, this.docs.find(d => d.id === card.docId), { quiet: true });
        for (const runs of Object.values(card.ai || {})) for (const job of runs) {
          if (!['running', 'asking', 'ready'].includes(job.status)) continue;
          if (job.deploy) { if (job.deploy.done.length) card.aiDeployed = [...job.deploy.done]; delete job.deploy; }
          job.status = 'expired';
        }
      }
      const ids = new Set(cards.map(c => c.id));
      const docs = this.docs.filter(d => d.kind === 'source_request' && !d.carded && ids.has(d.cardId));
      return JSON.parse(JSON.stringify({ cards, docs }));
    }
    // 昨天帶來的卡放回看板：時間往前推一天（昨天的事是負的分鐘）。不發事件，畫面還沒接上
    restore(carried) {
      const { cards = [], docs = [] } = JSON.parse(JSON.stringify(carried));
      for (const data of cards) this.board.cards.push(Card.restore(data, -C.DAY_GAME_MIN));
      this.board.nextNo = Math.max(this.board.nextNo, ...this.board.cards.map(c => c.no + 1));
      this.docs.push(...docs.map(d => (d.arrivedAt == null ? d : { ...d, arrivedAt: d.arrivedAt - C.DAY_GAME_MIN })));
    }

    // ── 事件 ──
    on(event, fn) { (this.listeners[event] ||= []).push(fn); return this; }
    emit(event, payload) {
      for (const fn of this.listeners[event] || []) fn(payload);
      for (const fn of this.listeners['*'] || []) fn(event, payload);
      this.checkHints(event);
    }

    // ── 劇本排程 ──
    schedule() {
      const s = this.script;
      // 下班回家了，劇本排的新卡、新來源就不進來了（茶几上同事都下班了）；atHome 的例外（趕 POC 的客戶時間到了照樣問）；
      // when(engine) 不成立的不來（例如早會沒推掉技術支援窗口才有的卡、母議題上了 POC 之後的進度詢問）
      const due = (x) => (!this.home || x.atHome) && (!x.when || x.when(this));
      for (const spec of s.cards || []) this.clock.at(C.DAY_START_MIN + spec.at, () => { if (due(spec)) this.arrive(spec); });
      for (const src of s.sources || []) this.clock.at(C.DAY_START_MIN + src.at, () => this.sourceDue(src, due));
      if (s.errands) this.scheduleErrands(s.errands, due);
      for (const m of s.meetings || []) {
        this.clock.at(C.DAY_START_MIN + m.at, () => this.startMeeting(m));
        // 廠商需求會議沒有彈幕：客戶等玩家問完，時程那段之後才散會（vendorNext）；
        // 例外是 cutoff（09:00 起算）：開到那時還沒散，怡君收尾（cutMeeting）
        if (m.kind === 'vendor') {
          if (m.cutoff) this.clock.at(C.DAY_START_MIN + m.cutoff.at, () => this.cutMeeting(m));
          continue;
        }
        for (const line of m.lines || []) this.clock.at(C.DAY_START_MIN + m.at + line.at, () => (line.closing ? this.closeMeeting(m, line) : this.meetingLine(m, line)));
        // 有收尾句的會議由收尾句決定散會時間（closeMeeting）
        if (!(m.lines || []).some(l => l.closing)) this.clock.at(C.DAY_START_MIN + meetingEnd(m), () => this.endMeeting(m));
      }
      for (const b of s.badEnd || []) this.clock.at(C.DAY_START_MIN + b.at, () => {
        if (this.ended) return;
        const reason = b.check(this);
        // bad end 也算一張結算卡（BAD END 還是要有結算卡）；那一天沒過，不存檔
        if (reason) { const report = this.report({ forced: !!(this.home && this.home.forced) }); this.ended = { badEnd: true, reason, report }; this.emit('bad_end', { reason, report }); }
      });
      // 劇本的 closeAt（時鐘時間）：到點強制結算（教學關 21:00，不讓人留在辦公室）；沒寫就是待到隔天 08:00
      const closeAt = s.closeAt ?? C.DAY_END_MIN;
      this.clock.at(closeAt, () => { if (!this.ended) this.leave({ forced: !!s.closeAt }); });
      // 有茶几的天：隔天 08:00 結算（通宵也要出門、通勤）
      if (s.home) this.clock.at(C.DAY_END_MIN, () => this.finishDay());
      // 上線後的抱怨（劇本 usage.complainAt 是時鐘時間）：到點才看哪些卡上線了
      if (s.usage) (s.usage.complainAt || []).forEach((t, n) => this.clock.at(t, () => this.complain(n)));
      // 相罵本（劇本 quarrel.at 是時鐘時間）
      if (s.quarrel) this.clock.at(s.quarrel.at, () => this.quarrel());
      // 傍晚需求單位轉述業主看成品的評語（劇本 evening.at 是時鐘時間）
      if (s.evening) this.clock.at(s.evening.at, () => this.eveningReview());
      // 阿姿加班：19:00 離開辦公室、22:30 睡覺，都在群組說一聲（劇本沒有 QC 的關卡不說）
      if (!s.noQC) {
        const qcTeamSay = (id, text) => () => { if (!this.ended) this.addDoc({ id, title: TEAM_GROUP, from: QC, group: TEAM_GROUP, module: null, origin: 'line', kind: 'chat', text, sentences: [], subtasks: [] }); };
        this.clock.at(C.QC_LEAVE_OFFICE_MIN, qcTeamSay('qc_leave_office', '我先離開辦公室了，晚上交的我回家驗，會比較慢喔。'));
        this.clock.at(C.QC_SLEEP_MIN, qcTeamSay('qc_sleep', '先睡了，剩下明天再驗。'));
      }
      // 昨天交了 QC 還沒驗的：07:30 前交的一進公司就有結果，其他的從 09:00 開始算阿姿驗的時間
      for (const card of this.board.cards.filter(c => c.status === 'to_qc')) {
        const submitted = card.events.filter(ev => ev.kind === 'submit').at(-1);
        const early = submitted && submitted.at <= C.QC_OVERNIGHT_MIN;
        this.clock.at(C.DAY_START_MIN + (early ? 0 : C.QC_TURNAROUND_MIN * (card.slowQC ? 2 : 1)), () => this.qcReceive(card));
      }
      // 昨天退回 SA、怡君還沒處理的：她一早處理
      for (const card of this.board.cards.filter(c => c.status === 'rejected_to_sa' && c.toSA)) this.clock.at(C.DAY_START_MIN, () => this.saReturns(card));
      if (this.ai) for (let t = C.DAY_START_MIN + AI_RESET_MIN; t < C.DAY_END_MIN; t += AI_RESET_MIN)
        this.clock.at(t, () => { this.ai.left = this.ai.max; this.emit('ai:quota', this.ai); });
      this.clock.at(C.DAY_START_MIN + 1, () => this.drain());
    }
    // 劇本裡負責人寫「玩家」的卡，掛到玩家取的名字上
    arrive(spec) {
      const card = this.board.add(makeCard({ ...spec, assignee: spec.assignee === '玩家' ? this.player.name : spec.assignee }), this.clock.minute);
      if (card.from === SA && card.assignee === this.player.name) this.saHandsOver(card);
      this.scheduleNags(card, spec.nags || []);
      this.emit('card:arrived', card); this.emit(`card:arrived:${card.id}`, card);
      return card;
    }
    // 追問、催單從 LIME 來，不寫在卡上：nags = [{ after, who, text }]，after 從現在起算；
    // whileOpen 是卡還在手上才發（開卡時排的追問，交出去就不追）；tag 分開同一張卡的不同批（nag：追問、stuck：上線後卡住的單）。下班了 addDoc 自己會擋
    scheduleNags(card, nags, { whileOpen = true, tag = 'nag' } = {}) {
      nags.forEach((nag, n) => this.clock.at(this.clock.minute + nag.after, () => {
        if (whileOpen && !card.isOpen) return;
        this.addDoc({ id: `${card.id}:${tag}:${n}`, title: nag.who, from: nag.who, module: null, origin: 'line', kind: 'nag', cardId: card.id, text: nag.text, sentences: [], subtasks: [] });
      }));
    }

    // ── 來源：老闆、信、LINE、紙、文件 ──
    // 劇本排的來源到點：due 不成立、已經當面問過的不來。src.afterCard = { id, gap } 是講某張卡的事：到點時那張卡還沒開
    // （例如需求會議開太久，怡君還沒開卡），等那張卡開了 gap 分鐘後才來
    sourceDue(src, due) {
      if (!due(src) || this.askedInPerson.has(src.id)) return;
      const wait = src.afterCard;
      if (wait && !this.board.get(wait.id)) {
        let waiting = true;
        this.on(`card:arrived:${wait.id}`, () => {
          if (!waiting) return;
          waiting = false; this.clock.at(this.clock.minute + wait.gap, () => this.sourceDue(src, due));
        });
        return;
      }
      this.arriveSource(src);
    }
    // src.variants：來的時候照當下的狀況挑一個版本（when(engine) 為真的第一個；沒寫 when 的是預設），蓋過來源本身的欄位
    arriveSource(src) {
      if (src.variants) src = { ...src, ...(src.variants.find(v => !v.when || v.when(this)) || {}), variants: undefined };
      if (src.kind === 'boss') {
        this.visitor = src; this.visitorListening = false; this.emit('visitor:arrived', src);
        this.clock.at(this.clock.minute + (src.patience || 20), () => { if (this.visitor === src && !this.visitorListening) this.leaveBehindPaper(src); });
      } else this.addDoc(makeDoc(src, src.kind));
    }
    addDoc(doc) {
      if (this.home && doc.kind === 'nag') return null;   // 下班了，追問停了
      if (doc.arrivedAt == null) doc.arrivedAt = this.clock.minute;
      this.docs.push(doc); this.emit('doc:arrived', doc); this.emit(`doc:arrived:${doc.origin}`, doc);
      if (doc.nagEvery) this.nagLoop(doc);
      if (doc.chase) this.stats.chased = (this.stats.chased || 0) + 1;
      return doc;
    }
    // 劇本裡有客戶來追進度的訊息（第三天 POC 群組），結算卡才列「客戶在群組追問」
    hasChases() {
      return [...(this.script.sources || []), ...((this.script.home || {}).emergencies || [])].some(s => s.chase);
    }
    // 沒回就一直追（鄭哥找技術支援、跟 POC 群組一樣）：回了（不是（已讀））或下班才停
    nagLoop(doc, n = 0) {
      this.clock.at(this.clock.minute + doc.nagEvery, () => {
        if (this.home || (doc.replied && !doc.replied.seen)) return;
        this.addDoc({ id: `${doc.id}:nag:${n}`, title: doc.title, from: doc.from, group: doc.group, module: null, origin: doc.origin, kind: 'nag', text: doc.nagText, sentences: [], subtasks: [] });
        this.nagLoop(doc, n + 1);
      });
    }
    // 轉給怡君要等多久：她丟給 Claire 的（saInstant）一分鐘就回來
    saDelay(doc) { return doc.saInstant ? 1 : C.SA_TURNAROUND_MIN; }
    // 開始聽站在桌邊的人講話了：講完、等你回話的這段時間他不會因為等太久走掉
    listenTo(id) { if (this.visitor && this.visitor.id === id) this.visitorListening = true; }
    talkTo(id) {
      const src = this.visitor; if (!src || src.id !== id) return null;
      this.visitor = null; this.emit('visitor:talked', src);
      return this.addDoc(makeDoc(src, 'boss'));
    }
    leaveBehindPaper(src) {
      this.visitor = null; this.emit('visitor:left', src);
      const paper = makeDoc(src, 'boss'); this.papers.push(paper); this.emit('paper:arrived', paper);
    }
    // 拿起桌上的紙來看；自己的便條看過會記在結算卡
    readPaper(id) {
      const paper = this.papers.find(p => p.id === id); if (!paper) return;
      if (paper.id === 'note') { this.noteOpened = true; this.emit('note:opened'); }
      this.emit('paper:read', paper);
    }
    digitize(paperId) {
      const i = this.papers.findIndex(p => p.id === paperId); if (i < 0) return null;
      const [paper] = this.papers.splice(i, 1);
      return this.addDoc({ ...paper, origin: 'paper' });
    }
    // 開卡：指派 SA 就是把需求轉回去，卡晚點以 SA 開好的樣子回來；指派自己就照草稿開，填得好不好記在 card.draft
    openCardFrom(docId, draft) {
      const doc = this.docs.find(d => d.id === docId); if (!doc || doc.carded || !doc.sentences.length || !this.online()) return null;   // 沒需求句的訊息開不了卡
      if (doc.cardSpec) return this.openFixedCard(doc.cardSpec, draft.assignee === 'sa' ? SA : this.player.name, doc.from);
      doc.carded = true;
      if (draft.assignee === 'sa') {
        this.stats.forwardedToSA++; this.emit('doc:forwarded', doc);
        // 轉出去那一刻 Tearlol 就先有一張怡君名下、標「需求分析中」的卡（只能看）：內文是玩家勾的句子、附件照玩家有沒有掛；
        // 她寫好了同一張卡變成玩家的，內文換成她消化過的條列（保留的需求句＋那個時代的痕跡），原話變成附件
        const original = `原文：${doc.title}（${ORIGIN_WORD[doc.origin] || doc.origin}）`;
        const picked = (draft.sentences || []).map(i => doc.sentences[i]).filter(Boolean).map(s => `・${s.text}`).join('\n');
        const card = this.board.add(makeCard({
          id: `${doc.id}:sa`, title: doc.title, from: 'SA 怡君', assignee: 'SA 怡君',
          body: picked || '（什麼都沒勾就轉過去了）', attachments: draft.attach ? [original] : [],
          type: doc.relatedTo ? 'addon' : 'feature', parent: doc.relatedTo || null,   // SA 知道這是哪張卡的追加需求，會自己掛成子議題
          relatedTo: doc.relatedTo, screen: doc.screen, reviewSays: doc.reviewSays, requester: doc.from, onNoBackup: doc.onNoBackup,   // 卡是怡君開的，但通知要給原本提需求的人
        }), this.clock.minute);
        card.pending = true; card.docId = doc.id;
        this.emit('card:arrived', card); this.emit(`card:arrived:${card.id}`, card);
        this.clock.at(this.clock.minute + this.saDelay(doc), () => { if (card.pending) this.saReady(card, doc); });
        return null;
      }
      const grade = Sources.gradeDraft(doc, draft);
      if (grade.missing.length === 3) this.stats.emptyDrafts++;
      this.stats.selfOpened++;
      const card = this.board.add(makeCard({
        id: `${doc.id}:card`, title: doc.title, from: this.player.name, assignee: this.player.name, requester: doc.from,   // 卡是玩家開的，需求討論和通知找原本提需求的人
        body: draft.attach ? doc.text : '', subtasks: subtasksFor(draft.type, doc),
        type: draft.type, parent: draft.parent || null, relatedTo: doc.relatedTo, screen: doc.screen, reviewSays: doc.reviewSays, onNoBackup: doc.onNoBackup,
      }), this.clock.minute);
      card.draft = { ...draft, ...grade }; card.docId = doc.id;
      if (doc.chore) card.chore = doc.chore;   // 正式上班的雜事卡：卡上看得到雜事的進度、可以自己結案
      // 來源其實是某張既有卡的追加需求、卻開成獨立的卡：SA 會在卡上提醒一句（不擋，只是提醒）
      if (doc.relatedTo && card.parent !== doc.relatedTo && this.board.get(doc.relatedTo)) {
        card.nag('SA 怡君', `這跟 ${this.board.label(doc.relatedTo)} 不是同一件事嗎？掛在那張底下吧。`, this.clock.minute);
      }
      this.emit('card:arrived', card); this.emit(`card:arrived:${card.id}`, card);
      return card;
    }
    // 怡君寫好了：同一張卡變成玩家的，內文換成她消化過的條列，原話變附件。quiet：換天收尾時不發事件
    saReady(card, doc, { quiet = false } = {}) {
      const sa = Sources.saCard(doc, this.script.mode || 'legacy');
      Object.assign(card, {
        title: sa.title, subtasks: sa.subtasks, saChecks: doc.saChecks, assignee: this.player.name, pending: false, arrivedAt: this.clock.minute,
        body: sa.lines.map(line => `・${line}`).join('\n'), attachments: [`原文：${doc.title}（${ORIGIN_WORD[doc.origin] || doc.origin}）`],
      });
      if (!quiet) { this.saHandsOver(card); this.emit('card:ready', card); this.emit(`card:ready:${card.id}`, card); }
    }
    // 好幾則訊息講同一件事、不管誰開都是同一張固定的卡（cardSpec）：開了之後其他那幾則也算開過了
    openFixedCard(cardSpec, from, requester = cardSpec.requester) {
      if (this.board.get(cardSpec.id)) return null;
      for (const d of this.docs) if (d.cardSpec && d.cardSpec.id === cardSpec.id) d.carded = true;
      const card = this.board.add(makeCard({ ...cardSpec, from, assignee: this.player.name, requester: cardSpec.requester || requester }), this.clock.minute);
      if (from === SA) this.saHandsOver(card);
      this.emit('card:arrived', card); this.emit(`card:arrived:${card.id}`, card);
      return card;
    }
    // 怡君把卡開給玩家，在 LIME 說一聲。要排在卡片事件之前：提示是跟著卡片事件出來的，訊息進來會讓暫停的時鐘繼續走
    saHandsOver(card) {
      this.addDoc({ id: `${card.id}:handover`, title: SA, from: SA, module: null, origin: 'line', kind: 'chat', cardId: card.id,
        text: `「#${card.no} ${card.title}」開給你了，需求整理在卡上。`, sentences: [], subtasks: [] });
    }
    // 部署沒備份出事（card.onNoBackup）：照部署的時間往後排——幾則訊息陸續進來（都能開同一張卡、都能回），
    // 都沒人開卡的話怡君自己開
    loseData(spec) {
      const t = this.clock.minute;
      for (const m of spec.messages) this.clock.at(t + m.after, () =>
        this.addDoc({ id: m.id, title: m.title, from: m.from, module: null, origin: m.origin, text: m.text, sentences: spec.sentences, subtasks: [], reply: m.reply, cardSpec: spec.card }));
      this.clock.at(t + spec.saAfter, () => { if (!this.board.get(spec.card.id)) this.openFixedCard(spec.card, SA); });
    }
    // 手動補救前先跑一趟（資料登打那關的 tripMin）：時間過掉、文件多一份照片與清單
    restoreTrip(cardId) {
      const card = this.board.get(cardId); const sub = card && (card.subtasks || []).find(s => s.question && s.question.kind === 'entry');
      if (!sub || card.tripped || !this.board.canOperate(card)) return null;
      card.tripped = true; this.markActed(cardId);
      this.clock.spend(sub.question.tripMin || 60);
      const list = sub.question.records.map(r => `${r.no}　${r.name}　持有人：${r.owner}　照片：${r.photo}`).join('\n');
      const doc = this.addDoc({ id: `${card.id}:photos`, title: sub.question.docTitle, from: this.player.name, module: null, origin: 'paper', kind: 'file', cardId: card.id, text: list, sentences: [], subtasks: [] });
      this.emit('trip:done', { card, doc });
      return doc;
    }
    // 在 LINE／信箱裡回一則訊息：訊息本身帶 reply 題；回了記在那則訊息上。reply 題的 replies 是對方接著回的話，
    // LIME 上沒寫回話的，對方至少回一張貼圖（回了沒反應很奇怪）。
    // 群組裡好幾個人可以接著回：replies 的一格寫成一串 [{ who, text }]，照順序每兩分鐘一則；沒寫 who 的是發訊息的人
    replyTo(docId, answers) {
      const doc = this.docs.find(d => d.id === docId); if (!doc || !doc.reply || doc.replied || !Works.replyAnswered(doc.reply, answers)) return null;
      const result = Works.grade(doc.reply, answers);
      const item = doc.reply.items[0] || {};
      // 選（已讀）就是已讀不回：回訊息的鈕收起來，對方沒反應，也不算回了一則
      const seen = /^（已讀）/.test((item.options || [])[answers[0]] || '');
      doc.replied = { answers, result, at: this.clock.minute, seen, text: Works.summarize(doc.reply, answers, result) };
      if (seen) { this.emit('doc:replied', doc); this.emit(`doc:replied:${doc.id}`, doc); return result; }
      // 過了截止時間才回的（lateAt，從 09:00 起算的分鐘），對方改回 lateReplies[選項]（例：收單之後才 +1）
      const late = item.lateAt != null && this.clock.minute >= C.DAY_START_MIN + item.lateAt;
      const pool = (late && (item.lateReplies || {})[answers[0]]) || (item.replies || [])[answers[0]];
      const backs = [].concat(pool || []).map(b => (typeof b === 'string' ? { who: doc.from, text: b } : { who: doc.from, ...b }));
      backs.forEach((b, n) => this.clock.at(this.clock.minute + 2 * (n + 1), () => this.addDoc({ id: `${doc.id}:re${n || ''}`, title: doc.group || b.who, from: b.who, group: doc.group, module: null, origin: doc.origin, kind: 'chat', text: b.text, sentences: [], subtasks: [] })));
      if (!backs.length && doc.origin === 'line') this.sendSticker(doc.from, `${doc.id}:re`, stickerFor(item, answers[0]), doc.group);
      // 回了某個選項會引來的事（followUps[選項] = { at, src }）：那個時間點來一個來源（例如回「幫你申請加購」，下午財務來要效益分析）
      const follow = (item.followUps || {})[answers[0]];
      if (follow) this.clock.at(Math.max(this.clock.minute + 1, C.DAY_START_MIN + follow.at), () => this.arriveSource(follow.src));
      // 多選題漏勾的（missSays[正解索引]）：對方 missAfter 分鐘後一句一句來問（老闆的簡介漏攔，佩珊在群組問）
      if (Array.isArray(item.answer) && item.missSays) {
        const picked = [].concat(answers[0] ?? []);
        item.answer.filter(i => !picked.includes(i) && item.missSays[i]).forEach((i, n) => this.clock.at(this.clock.minute + (item.missAfter || 60) + n * 3, () =>
          this.addDoc({ id: `${doc.id}:miss:${i}`, title: item.missGroup || item.missFrom || doc.from, from: item.missFrom || doc.from, group: item.missGroup || null, module: null, origin: 'line', kind: 'chat', text: item.missSays[i], sentences: [], subtasks: [] })));
      }
      // 小事件回「好，我過去。」（第一個選項）：畫面黑一下跑一趟，跑完畫面呼叫 errandTrip
      const errand = doc.errand && answers[0] === 0 && (this.errands || []).find(x => x.id === doc.errand && !x.done);
      if (errand) this.emit('errand:go', { id: errand.id, tripText: errand.tripText });
      this.stats.replies = (this.stats.replies || 0) + 1;
      this.emit('doc:replied', doc); this.emit(`doc:replied:${doc.id}`, doc);
      return result;
    }
    // ── 小事件（劇本 errands：{ pick, slots, pool }）：開工時從池子抽 pick 件，照 slots（09:00 起算的分鐘）排成 LIME，
    // 回「好，我過去。」跑一趟、「我現在走不開。」對方回推掉那句（decline），（已讀）或不回也算推掉 ──
    scheduleErrands(spec, due) {
      const pool = [...spec.pool];
      for (let i = pool.length - 1; i > 0; i--) { const j = Math.floor(this.random() * (i + 1)); [pool[i], pool[j]] = [pool[j], pool[i]]; }
      this.errands = pool.slice(0, spec.pick).map((x, i) => ({ ...x, at: spec.slots[i], done: false }));
      for (const x of this.errands) {
        const src = { kind: 'line', at: x.at, id: `errand_${x.id}`, title: x.who, from: x.who, module: null, errand: x.id, text: x.text, sentences: [], subtasks: [],
          // 「好，我過去。」對方回讚：貼圖到的時候玩家已經跑完一趟、事情處理好了（童童定）
          reply: { items: [{ text: '你回：', free: true, options: ['「好，我過去。」', '「我現在走不開。」', '（已讀）'], replies: [null, x.decline], stickers: ['thumb'] }] } };
        this.clock.at(C.DAY_START_MIN + x.at, () => { if (due(src)) this.arriveSource(src); });
      }
    }
    // 跑一趟：時間過掉那件的分鐘數、走了 N 趟 +1，跑完回到自己座位（人在同事那邊接的也一樣）
    errandTrip(id) {
      const x = (this.errands || []).find(r => r.id === id); if (!x || x.done || this.ended) return null;
      x.done = true; this.clock.spend(x.trip); this.stats.trips++;
      if (this.place !== 'desk') { this.place = 'desk'; this.emit('place:changed', this.place); }
      this.emit('errand:done', x);
      return x;
    }
    // 結算卡的同事評語：來了沒跑的（推掉、已讀、沒回），對方推掉時那句
    errandPeers() {
      return (this.errands || []).filter(x => !x.done && this.docs.some(d => d.errand === x.id)).map(x => ({ who: x.who, text: x.decline }));
    }
    // LIME 一個對話的顯示順序，跟 LINE 一樣照時間：對方的訊息排在到的那一分鐘，你回的話排在你回的那一分鐘之後（晚回的就在後面）。
    // 回（已讀）是已讀不回，畫面上不留字。你回的話沒有緊接在被回的那則後面（中間隔了別的話），
    // 就像 LINE 的回覆一樣帶上被回的那則（quote），不然看不出在回哪一則。回傳 [{ msg } | { mine: 你回的字, quote }]
    chatLog(msgs) {
      const entries = [];
      msgs.forEach((msg, i) => {
        entries.push({ at: msg.arrivedAt ?? -Infinity, i, msg });
        if (msg.replied && !msg.replied.seen) entries.push({ at: msg.replied.at + 0.5, i, mine: msg.replied.text.replace(/^你回：/, ''), to: msg });
      });
      entries.sort((a, b) => (a.at - b.at) || (a.i - b.i));
      return entries.map((e, k) => (e.mine ? { mine: e.mine, quote: entries[k - 1] && entries[k - 1].msg === e.to ? null : e.to } : { msg: e.msg }));
    }
    // 對方兩分鐘後在 LIME 回一張貼圖（Stickers 的 id）；group：回在群組裡
    sendSticker(from, id, sticker, group = null) {
      this.clock.at(this.clock.minute + 2, () => this.addDoc({ id, title: group || from, from, group, module: null, origin: 'line', kind: 'sticker', sticker, text: '傳了一張貼圖', sentences: [], subtasks: [] }));
    }
    // 補回原始來源：卡重新可以交 QC
    attachSource(cardId) {
      const card = this.board.get(cardId); if (!card || !card.draft) return;
      const doc = this.docs.find(d => d.id === card.docId);
      card.body = doc ? doc.text : card.body; card.draft.attach = true; card.draft.noSource = false; card.needsSource = false;
      this.emit('card:source_attached', card);
    }
    get unclosable() { return [...this.board.cards.values()].filter(c => c.needsSource).length; }

    // ── 提示 ──
    // 提示出現時時鐘暫停，玩家做了別的事才恢復；照提示找卡、打開那件工作不算，時鐘停到做完（holdsHintPause）。
    // 提示本身留著，直到做了它要的事（until）。
    // until 可以是一串（例如「交給 AI」或「自己做完」都算）；skipOn：還排在隊伍裡、這件事就發生了的話，這個提示不用出了
    // （例如「等 AI 交件」那幾個提示，玩家自己做掉了就跳過，提示鏈才不會卡住）；skipIf(engine)：輪到它時已經成立就跳過
    // 事件裡的 * 是「不管哪張卡」（work:opened:*:deploy），提示要接任何一張卡的同一件工作時用
    skipHint(hint, event) { return (hint.skipOn || []).includes(event) || !!(hint.skipIf && hint.skipIf(this)); }
    checkHints(event) {
      if (this.hint && [].concat(this.hint.until).includes(event)) {
        this.hint = null; this.clock.resume('hint'); this.emit('hint:cleared');
      } else if (this.hint && PLAYER_EVENTS.some(p => event.startsWith(p)) && !this.holdsHintPause(event)) {
        this.clock.resume('hint');
      }
      if (this.heldHint && ([].concat(this.heldHint.until).includes(event) || this.skipHint(this.heldHint, event))) this.heldHint = null;
      const idle = () => !this.hint && !this.heldHint;
      while (idle() && this.hintQueue.length && this.skipHint(this.hintQueue[0], event)) this.hintQueue.shift();
      if (idle() && this.hintQueue.length && [].concat(this.hintQueue[0].after).includes(event)) {
        const hint = this.hintQueue.shift();
        if (this.hintsHeld) this.heldHint = hint; else this.openHint(hint);
      }
    }
    openHint(hint) {
      this.hint = hint;
      if (hint.pause !== false) this.clock.pause('hint');
      this.emit('hint', hint);
    }
    // 畫面上的會議室開著時（desk 開會議室時拿著、收掉才放），輪到的提示先拿著：提示會暫停時鐘，把會議和還在飛的彈幕凍住。
    // 拿著的時候它要的事就做了，那句不出；放開時還在就出現
    holdHints(on) {
      this.hintsHeld = on;
      if (on || !this.heldHint) return;
      const hint = this.heldHint; this.heldHint = null; this.openHint(hint);
    }
    // 只有提示要玩家做某件工作時才撐住；做了別的事（開別的工作、交 QC、轉給 SA）照舊恢復，提示要的事做不到時才不會卡死
    holdsHintPause(event) {
      if (event.startsWith('work:done:*:')) return true;   // 做完的最後一個事件，下一句提示這時已經出來了，不能把它剛停的時鐘放開
      const wanted = [].concat(this.hint.until).filter(e => /^(work:done|card:opened)(:|$)/.test(e));
      if (!wanted.length) return false;
      if (event === 'work:opened' || event.startsWith('work:opened:*:')) return true;
      if (event.startsWith('work:opened:')) return wanted.includes('work:done') || wanted.includes(event.replace('work:opened', 'work:done'));
      return event.startsWith('card:opened') || event.startsWith('board:opened');
    }
    // 提示上的「略過此提示」：這句當作過關、時鐘恢復，只推進提示鏈，那件工作沒有真的做；下一句照它自己的條件出現
    passHint() { if (this.hint) this.checkHints([].concat(this.hint.until)[0]); }
    dismissHint() { this.clock.resume('hint'); }
    // 玩家按了某個工作的按鈕、視窗開出來了：這就算動作，提示暫停的時鐘從這裡恢復（不用等做完）
    openWork(cardId, work) { this.emit('work:opened', { cardId, work }); this.emit(`work:opened:${cardId}:${work}`, { cardId, work }); this.emit(`work:opened:*:${work}`, { cardId, work }); }

    // ── 時間 ──
    tick(ms) { if (!this.ended) this.clock.advance(ms); }
    pause() { this.clock.pause('player'); }
    resume() { this.clock.resume('player'); }
    get paused() { return this.clock.pauses.has('player'); }

    // ── 玩家動作 ──
    openCard(id) {
      const card = this.board.get(id); if (!card) return null;
      const position = this.board.positionOf(id);
      if (position && this.board.canOperate(card)) this.log.push({ minute: this.clock.minute, cardId: id, position, opened: true, acted: false });
      this.emit('card:opened', card); this.emit(`card:opened:${id}`, card);
      return card;
    }
    subtask(card, work) { return (card.subtasks || []).find(s => s.work === work); }
    // function 的欄位可以鎖住，鎖著時唯一能選的是 lockedTo：lockedUntil 是等某份文件到（文件 id），
    // lockedUnless 是前面某件工作挑到才解開（{ work, item, picked }，接手別人的版本時檢閱挑出來才改得到）
    fieldLocked(field, card = null) {
      if (field && field.lockedUnless) return !(card && Works.pickedIn(card.picks, field.lockedUnless.work, field.lockedUnless).includes(field.lockedUnless.picked));
      return !!(field && field.lockedUntil && !this.docs.some(d => d.id === field.lockedUntil));
    }
    // 改不動的地方一律存原本那版（畫面上本來就只能選它；測試、自動玩照正解送的也一樣）：
    // 題目的 onlyIf 沒成立存 inherit，lockedUnless 鎖著的欄位存 lockedTo
    keepInherited(card, question, answers) {
      if (question.kind === 'functions') {
        const locked = (field) => !!field.lockedUnless && this.fieldLocked(field, card);
        if (!question.functions.some(f => Object.values(f.fields || {}).some(locked))) return answers;
        return question.functions.map((f, i) => {
          const out = { ...((answers && answers[i]) || {}) };
          for (const [key, field] of Object.entries(f.fields || {})) if (locked(field)) out[key] = field.lockedTo;
          return out;
        });
      }
      const off = (question.items || []).map((item, i) => (Works.activeItem(item, card.picks) ? -1 : i)).filter(i => i >= 0);
      if (!off.length) return answers;
      const out = [...(answers || [])]; for (const i of off) out[i] = question.items[i].inherit;
      return out;
    }
    doWork(id, work, answers = [], opts = {}) {
      const card = this.board.get(id);
      if (!card || !this.board.canOperate(card) || this.ended || !this.online()) return null;
      const sub = this.subtask(card, work);
      if (this.fromMeeting(card, work)) return null;   // 廠商需求會議上做掉的（需求討論、估時）是唯讀的
      if (work === 'route' && card.routes && (card.route != null || !card.routes[[].concat(answers)[0]])) return null;   // 選路只選一次，而且要挑一條
      if (work === 'deploy' && card.deployGate && !card.deployGate(this)) return null;   // 門檻沒到（例如三張子議題還沒驗過）
      let result = null, minutes = opts.minutes || 0, version = opts.version;
      if (sub && sub.question) {
        if (sub.question.kind === 'manual') {
          result = this.manualTest(card, answers); version = result.version;
        } else if (sub.question.kind === 'device') {
          const choice = Works.deviceTestOptions(this.devices).find(o => o.id === answers[0]);
          if (!choice || choice.disabled) return null;
          minutes = choice.minutes; result = { choice: choice.id }; version = choice.label;
        } else {
          card.picks = card.picks || {};
          answers = this.keepInherited(card, sub.question, answers);
          result = Works.grade(sub.question, answers, { covered: card.draft ? card.draft.covered : 'all', picks: card.picks });
          card.picks[work] = result.picks || answers;   // 玩家在每個工作選了什麼，後面的工作會用（計畫→規格→程式）；檢閱程式碼只留抓到的 fix
          minutes = result.minutes || 0;   // 小關卡進行中時鐘本來就在走，沒另外標分鐘的就不再加
          if (result.missed) card.vague = result.missed.map(i => sub.question.segments[i]);   // 需求討論沒圈到的＝需求不明
          if (work === 'estimate') card.estimate = answers[0] ?? null;
        }
      }
      // 自己部署、排了資料轉換，舊資料有轉不過去的還沒對過（card.migrate）：一筆一筆對回去，一筆一分鐘。
      // AI 一步一步部署的（printed）在時鐘的回呼裡跑，不在這裡花時間
      if (work === 'deploy' && !opts.printed && card.migrate && !card.reconciled && sub && sub.question.roles && [].concat(answers[0] || []).includes(sub.question.roles.migrate)) minutes += card.migrate.left;
      const by = opts.by === 'ai' ? 'ai' : 'self';
      // 自己做和 AI 做不衝突：手寫不會丟掉 AI 那幾份，它們照樣在終端機等，之後要拿哪份蓋過卡上的版本都行
      const job = by === 'ai' ? this.aiRun(card, work, opts.jobId) : null;
      // 照 AI 交的原樣收下（沒看就收、看了沒改都算；AI 自己一步一步部署的沒有答案卡，也算）
      const aiJob = job ? { group: job.group, untouched: !job.answers || JSON.stringify(answers) === JSON.stringify(job.answers) } : undefined;
      card.record(work, { minutes, version, at: this.clock.minute, result, by, reviewed: by === 'ai' ? !!opts.reviewed : undefined, aiJob });
      if (work === 'route' && card.routes) this.chooseRoute(card, answers[0]);
      if (job) job.status = 'taken';
      // Novel 寫的文件多一堆廢話：收下時還留著的跟著卡走，沒刪完就交出去會被退；Verse／Essay 寫的、筆記說了要寫人話的沒有。
      // 只有換成另一份 AI 的版本才重算：自己在卡上重新按完成，廢話不會自己消失
      if (DOC_WORKS.includes(work) && job) { const left = this.aiFiller(job, work); card.wordy[work] = left.length ? [...left] : false; }
      if (by === 'ai' && this.ai) this.ai.stats[opts.reviewed ? 'reviewed' : 'unreviewed']++;
      if (sub && sub.question) card.comments.push({ kind: 'note', who: this.player.name, text: (by === 'ai' ? '（AI 填的）' : '') + Works.summarize(sub.question, answers, result), at: this.clock.minute });
      // 選了某個選項會有人來信／來 LIME（item.onPick：{ who, text, origin, after }）
      for (const ef of (result && result.effects) || []) this.clock.at(this.clock.minute + (ef.after ?? 10), () =>
        this.addDoc({ id: `${card.id}:${work}:pick:${this.clock.minute}`, title: ef.who, from: ef.who, module: null, origin: ef.origin || 'mail', kind: 'chat', cardId: card.id, text: ef.text, sentences: [], subtasks: [] }));
      if (work === 'deploy' && sub && sub.question.roles) {
        // AI 中斷前做過的步驟算數，接在玩家排的前面；AI 一步一步做的已經印在終端機了（printed）
        const roles = sub.question.roles, before = opts.printed ? [] : (card.aiDeployed || []), order = answers[0] || [];
        this.deployOutcome(card, roles, [...before.map(r => roles[r]), ...order]);
        const lines = opts.printed ? [] : this.deployScript(card, roles, order, before, minutes);
        card.terminal = [...(card.terminal || []), ...lines]; if (result) result.terminal = lines;
        if (!opts.printed) this.emit('deploy:run', { card, lines });
        card.aiDeployed = null;
      }
      this.markActed(id);
      if (this.home) this.workedAtHome(card, work);
      this.clock.spend(minutes);
      // 不交 QC 的卡（POC 母議題）：部署完就算完成，通知鈕打開
      if (((work === 'deploy' && card.noQC) || card.closeOn === work) && card.status !== 'archived') { card.archive(this.clock.minute); this.emit('card:closed', card); this.emit(`card:closed:${card.id}`, card); }
      // 檢閱放水（LGTM 或有漏）的代價：那個時間點需求者在 LIME 說那句（小潘的 PR 下午上線整頁白掉）
      const fire = card.reviewFires && card.reviewFires[work];
      if (fire && result && (result.skipped || (result.misses || []).length)) this.clock.at(C.DAY_START_MIN + fire.at, () =>
        this.addDoc({ id: `${card.id}:fire:${work}`, title: card.requester, from: card.requester, module: null, origin: 'line', kind: 'chat', cardId: card.id, text: fire.miss, sentences: [], subtasks: [] }));
      this.emit('work:done', { card, work, result }); this.emit(`work:done:${id}:${work}`, { card, work, result }); this.emit(`work:done:*:${work}`, { card, work, result });
      return result;
    }
    // 卡上選路（第二關 speedrun 的批號追溯：接手建宏那版，或從頭規劃）：卡的工作換成那條路的，「接手或重來」留在最前面
    chooseRoute(card, i) {
      if (card.route != null || !card.routes[i]) return;
      card.route = i;
      card.subtasks = [this.subtask(card, 'route'), ...card.routes[i].subtasks];
      this.emit('card:route', card);
    }
    // ── 交給 AI（hybrid 之後）──
    // 交出去扣一次額度，過一段時間 AI 把同一張答案卡填好（status ready），交件只出現在終端機（ai:ready 事件，畫面不跳通知）。
    // 同一件可以叫它跑好幾次，每次一份、各扣額度、可以同時跑：card.ai[work] 是一串 run（id 就是第幾份）。
    // 每份可以直接交（acceptAi，沒看）或看一下再送出（doWork 帶 by:'ai', reviewed:true, jobId）；看一下時可以退回＝請它改（reviseAi）。
    // speedrun 交給 AI 時自己挑模型（劇本 ai.models：{ 名稱: { label, turnaround, accuracy, cost } }）；沒有 models 的（第二天）用 ai.model 那一個
    aiModel(name) { const ms = this.script.ai && this.script.ai.models; return ms ? ms[name] || null : null; }
    aiPicksModel() { return !!(this.script.ai && this.script.ai.models); }
    aiCost(model) { return (this.aiModel(model) || {}).cost ?? 1; }
    // 額度夠不夠跑這個模型：夠回 null，不夠回說明（Novel 一次要 2 格，只剩 1 格不是「用完了」）；cost 是這次要花幾格（整組、整張跟單件不同價）
    aiLack(model, cost = this.aiCost(model)) {
      if (this.capReached(model)) return `${model} 額度已達上限，請選擇其他模型接手。`;
      const left = this.ai.left;
      if (left >= cost) return null;
      return left <= 0 ? '這個時段的 AI 額度用完了。' : `額度不夠：${this.aiName(model)}一次要 ${cost} 格，現在只剩 ${left} 格。`;
    }
    // 一天的上限：劇本 models.X.cap 是關卡額度的幾成（Pedia 0.6：現實中 Fable 的上限是整週額度的一半）。
    // 跟現實一樣不先算這次會不會超過：還沒到上限就能用（這次可以衝過去），花到上限或超過之後才擋
    capReached(model) {
      const share = (this.aiModel(model) || {}).cap;
      return share != null && (this.modelSpent[model] || 0) >= Math.floor(this.ai.max * share);
    }
    // 扣額度：所有花 AI 額度的地方都走這裡，模型的花費跟著記
    payAi(model, cost) {
      this.ai.left -= cost;
      if (model) this.modelSpent[model] = (this.modelSpent[model] || 0) + cost;
    }
    // 整理需求交給 AI 容易讀歪：照模型的正確率再低一截（劇本 ai.readReqPenalty）
    aiAccuracy(model = null, work = null) {
      const m = this.aiModel(model);
      const base = m ? m.accuracy : (this.script.ai && this.script.ai.accuracy) ?? 0.5;
      const penalty = work === 'read_req' ? ((this.script.ai && this.script.ai.readReqPenalty) || 0) * this.readReqFactor() : 0;
      return Math.max(0, base - penalty);
    }
    // CLAIRE.md 寫了「整理需求的讀法」：原則派讀歪的機率減半；情緒化派 AI 做過頭、更不敢挑，讀歪加倍；過於細節派只對點名的那種項目有效
    readReqFactor() {
      const n = this.ai && this.ai.notes.readReq; const stance = n && (n.stance || n);
      return stance === 'principle' ? 0.5 : stance === 'emotional' ? 2 : 1;
    }
    // ── 問 Claire：能在終端機問 Claire 問題的關卡（劇本 ai.askable）。問題寫在劇本 claire[事]，那件事發生了（when）才列 ──
    askable() { return !!(this.script.ai && this.script.ai.askable); }
    claireTopics() {
      if (!this.ai || !this.askable()) return [];
      return Object.entries(this.script.claire || {}).filter(([, t]) => t.when(this)).map(([id, t]) => ({
        id, label: t.label, hands: t.hands || null,
        asks: t.asks.filter(a => !a.when || a.when(this)).map(a => ({ id: a.id, say: a.say })),
      }));
    }
    // 這個模型現在用得了嗎（問 Claire、交辦都看這個）：可以回 null，不行回說明。
    // 劇本 perDay 是一天能用幾次（Pedia 一次）：問一句、單件、整組、整張、會議裡請它擬都算一次
    modelLack(model) {
      const m = this.aiModel(model);
      if (!m) return '沒有這個模型。';
      if (this.usedUp(model)) return `${model} 一天只能用${m.perDay === 1 ? '一' : ` ${m.perDay} `}次。`;
      return this.aiLack(model);
    }
    usedUp(model) {
      const m = this.aiModel(model);
      return !!m && m.perDay != null && (this.modelUses[model] || []).length >= m.perDay;
    }
    useModel(model, purpose) {
      if (!model || (this.aiModel(model) || {}).perDay == null) return;
      (this.modelUses[model] ||= []).push(purpose);
      this.emit('ai:used', { model, purpose });
    }
    // 整組交給 AI 要幾格：只剩一件照單件；劇本 models.X.groups 有寫的照寫的（Pedia 文件 5、開發 4），沒寫的是單件加總 −1。
    // 不在任何組裡的工作當成一件的組
    groupCost(model, groupId, count) {
      if (count === 1) return this.aiCost(model);
      const fixed = ((this.aiModel(model) || {}).groups || {})[groupId];
      return fixed ?? count * this.aiCost(model) - 1;
    }
    // 整組交辦會跑的那幾件：能交辦、還沒做的
    groupWorks(card, groupId) {
      const group = Works.MENU.find(m => m.id === groupId && m.children);
      return group ? group.children.map(c => c.id).filter(w => this.delegable(card, w) && !card.done(w)) : [];
    }
    // 問一題：扣額度、過 askMin 分鐘把回答丟給畫面（claire:answer）。「幫我○○」（askId 'hands'）Claire 不做，不扣也不算一次
    // （回「這件事需要手。」；劇本 handsSays 可以換一句，例：網路設定是沒權限）。
    // 題目帶 know 的，回答到了就記下（講錯的也算：玩家照著它去做，例如客服那邊報 B8964）；Pedia 不會亂編，不記
    askClaire(topicId, askId, model = null) {
      if (this.place !== 'desk' || this.ended || !this.online()) return null;   // 終端機在自己座位
      if (!this.claireTopics().some(t => t.id === topicId)) return null;
      const topic = this.script.claire[topicId];
      if (askId === 'hands') {
        const lines = [topic.handsSays || '這件事需要手。'];
        this.emit('claire:asked', { topic: topicId, say: topic.hands, model: null, wait: 0 });
        this.emit('claire:answer', { topic: topicId, say: topic.hands, model: null, lines });
        return { wait: 0, lines };
      }
      const ask = topic.asks.find(a => a.id === askId && (!a.when || a.when(this))); if (!ask) return null;
      const lack = this.modelLack(model); if (lack) return { error: lack };
      const m = this.aiModel(model);
      this.payAi(model, m.cost); this.hints.asked++; this.hints.spent += m.cost;
      this.useModel(model, ask.say);
      const lines = claireLines(topic, ask, model);
      this.emit('claire:asked', { topic: topicId, say: ask.say, model, wait: m.askMin });
      this.clock.at(this.clock.minute + m.askMin, () => {
        if (ask.know && model !== 'Pedia') this.know(ask.know);
        this.emit('claire:answer', { topic: topicId, say: ask.say, model, lines });
      });
      return { wait: m.askMin, lines };
    }
    // 遊戲裡的 AI 工具：Claire Code，模型級距 Verse／Essay／Novel，版本號跟年代走（劇本 ai.model）
    aiName(model = null) {
      const m = this.aiModel(model); const label = m ? m.label : this.script.ai && this.script.ai.model;
      return label ? `Claire Code（${label}）` : 'Claire Code';
    }
    // 指定的那份；沒指定就是最新一份交件了還沒處理的
    aiRun(card, work, jobId) {
      const runs = (card.ai && card.ai[work]) || [];
      const job = jobId != null ? runs.find(j => j.id === jobId) : [...runs].reverse().find(j => j.status === 'ready');
      return job && job.status === 'ready' ? job : null;
    }
    delegable(card, work) {
      const sub = card && this.subtask(card, work);
      // 要自己動手的（拿裝置、自己下指令）、廠商需求會議上做掉的（唯讀）、接手或重來（自己的判斷）不能交辦
      return !!(sub && sub.question && !['manual', 'device', 'terminal'].includes(sub.question.kind)) && !this.fromMeeting(card, work) && work !== 'route';
    }
    delegate(cardId, work, model = null) {
      const card = this.board.get(cardId); const sub = card && this.subtask(card, work);
      if (!this.ai || !this.delegable(card, work) || !this.board.canOperate(card) || this.ended || !this.online()) return null;
      if (this.aiPicksModel() && (!this.aiModel(model) || this.usedUp(model))) return null;   // 額度不夠的照舊由 startRun 擋（會發 ai:empty）
      if (this.home) this.workedAtHome(card, work);
      const cmd = `$ claire --issue ${card.no} --task ${work}`;
      const drives = this.testDrives(card, work);   // 交出去那一刻卡上已經有的測試，AI 照著寫（先寫測試才算數）
      const job = this.aiDeploys(sub.question)
        ? this.startRun(card, work, (seed) => ({ deploy: this.deployPlan(card, sub.question, seed) }), cmd, { model })
        : this.startRun(card, work, (seed) => Works.aiAnswers(sub.question, { ...this.aiCtx(card), accuracy: this.aiAccuracy(model, work), seed, notes: this.ai.notes, drives }), cmd, { model });
      if (job) this.useModel(model, `#${card.no} ${Works.label(work)}`);
      return job;
    }
    // 整組交給 AI（speedrun）：主按鈕底下的子項依序跑，後一份拿前一份的草稿當帶入；已經在卡上的跳過，
    // 還沒交到卡上的舊稿作廢；時間＝單件加總打七折，額度照 groupCost，只剩一份要跑就照單件
    delegateGroup(cardId, groupId, model) {
      const card = this.board.get(cardId); const group = Works.MENU.find(m => m.id === groupId && m.children);
      if (!this.ai || !card || !group || !this.aiModel(model) || !this.board.canOperate(card) || this.ended || !this.online()) return null;
      const works = this.groupWorks(card, groupId);
      if (!works.length) return null;
      if (works.length === 1) { const job = this.delegate(cardId, works[0], model); return job ? [job] : null; }
      if (this.usedUp(model)) return null;
      const jobs = this.delegateWorks(card, works, model, { cost: this.groupCost(model, groupId, works.length), cmd: `$ claire --issue ${card.no} --task ${groupId}`, group: groupId, title: group.label });
      if (jobs) this.useModel(model, `#${card.no} ${group.label}`);
      return jobs;
    }
    // 一次交出好幾份（整組交辦、one shot 共用）：照 works 的順序一份接一份，後一份拿前一份的草稿當帶入；這幾件還沒交到卡上的舊稿作廢。
    // cost 一次扣（額度不夠回 null）；交件時間＝單件加總打七折；rollOnce：每份只骰一次、focus：這次的暫時筆記（Works.aiAnswers）。
    // 終端機只印一次：指令一行、「接手 #N 標題：A → B → C，一份接一份，預計 X 分鐘。」一行，之後每份交件各一行
    delegateWorks(card, works, model, { cost, cmd, group, title, rollOnce = false, focus = null }) {
      if (this.aiLack(model, cost)) { this.emit('ai:empty', { card, work: group }); return null; }
      if (this.home) this.workedAtHome(card, works[0]);
      for (const w of works) for (const j of (card.ai && card.ai[w]) || []) if (['running', 'asking', 'ready'].includes(j.status)) j.status = 'expired';
      this.payAi(model, cost);
      const drafts = {};
      const ctx = () => { const base = this.aiCtx(card); return { ...base, picks: { ...base.picks, ...drafts }, done: [...new Set([...base.done, ...Object.keys(drafts)])] }; };
      let at = 0;
      const doneAt = works.map(w => (at += Math.round(this.aiMinutes(card, w, ((card.ai && card.ai[w]) || []).length + 1, model) * C.AI_GROUP_TIME)));
      const lines = [{ text: cmd, kind: 'cmd' },
        { text: `${this.aiName(model)}接手 #${card.no} ${title}：${works.map(w => Works.label(w)).join(' → ')}，一份接一份，預計 ${at} 分鐘。`, kind: 'out' }];
      return works.map((w, i) => {
        const sub = this.subtask(card, w);
        return this.startRun(card, w, (seed) => {
          if (this.aiDeploys(sub.question)) return { deploy: this.deployPlan(card, sub.question, seed) };   // 部署照單件交辦那樣一步一步做，不交答案卡
          const now = ctx();
          const out = Works.aiAnswers(sub.question, { ...now, accuracy: this.aiAccuracy(model, w), seed, notes: this.ai.notes, drives: this.testDrives(card, w, now), rollOnce, focus });
          drafts[w] = out.answers; return out;
        }, cmd, { model, cost: 0, minutes: doneAt[i], group, lines: i === 0 ? lines : [] });
      });
    }
    // Pedia one shot 能交的工作：卡上的順序，能交辦、還沒做的。需求討論（會議問的、唯讀）、手動測試由 delegable 擋掉；
    // 估時是自己的事，另外排除；部署要 CLAIRE.md 寫了部署流程（寫 Skill）才排進去，沒寫 Pedia 不部署
    oneShotWorks(card) {
      const skip = ['estimate', ...(this.ai && this.ai.notes.deploy ? [] : ['deploy'])];
      return (card.subtasks || []).map(s => s.work).filter(w => !skip.includes(w) && this.delegable(card, w) && !card.done(w));
    }
    // Pedia one shot（正式上班 speedrun）：整張卡能交辦的工作一次交給 Pedia，照卡上的順序一份接一份；算 Pedia 用了一次，每份只骰一次
    // 整張交給 Pedia 要幾格：one shot 會做的那幾件照整組、單件算加起來，超過劇本 models.Pedia.oneShot（6 格）就算 6 格
    oneShotCost(card) {
      const counts = {};   // 組 id（不在組裡的就用工作自己的 id）→ 幾件
      for (const w of this.oneShotWorks(card)) {
        const group = Works.MENU.find(m => m.children && m.children.some(c => c.id === w));
        const id = group ? group.id : w;
        counts[id] = (counts[id] || 0) + 1;
      }
      const total = Object.entries(counts).reduce((sum, [id, n]) => sum + this.groupCost('Pedia', id, n), 0);
      const cap = (this.aiModel('Pedia') || {}).oneShot;
      return cap == null ? total : Math.min(cap, total);
    }
    // 能不能整張交：可以回 null，不行回說明
    oneShotLack(card) {
      const lack = this.modelLack('Pedia'); if (lack) return lack;
      const cost = this.oneShotCost(card);
      if (this.capReached('Pedia')) return this.aiLack('Pedia', cost);
      return this.ai.left < cost ? `額度不夠：整張交給 Pedia 要 ${cost} 格，現在只剩 ${this.ai.left} 格。` : null;
    }
    // focus 是交付重點（C.ONE_SHOT_FOCUS 的 id）：選錯的照它的 kinds 做到底，答案只當這一次的暫時筆記（寫在終端機那行，不進 CLAIRE.md）；
    // 不是那三個（畫面上按取消）就不交
    oneShot(cardId, focus = 'site') {
      const card = this.board.get(cardId); const pick = C.ONE_SHOT_FOCUS.options.find(o => o.id === focus);
      if (!pick || !card || !this.ai || !this.aiModel('Pedia') || !this.board.canOperate(card) || this.ended || !this.online()) return null;
      if (this.oneShotLack(card)) return null;
      const works = this.oneShotWorks(card);
      if (!works.length) return null;
      const jobs = this.delegateWorks(card, works, 'Pedia', { cost: this.oneShotCost(card), cmd: `$ claire --model pedia --issue ${card.no} --one-shot --focus "${pick.text}"`,
        group: 'oneshot', title: `${card.title}整張`, rollOnce: true, focus: pick.kinds || null });
      if (!jobs) return null;
      card.oneShotRun = { focus, works };   // 平行宇宙看這次選的交付重點、交了哪幾件
      this.useModel('Pedia', `#${card.no} ${card.title}（整張）`);
      this.emit('ai:oneshot', { card });
      return jobs;
    }
    aiCtx(card) {
      return { covered: card.draft ? card.draft.covered : 'all', picks: card.picks, done: [...new Set(card.history.map(h => h.work))], locked: (field) => this.fieldLocked(field, card), others: this.otherCard };
    }
    // 跨卡帶入用：別張卡的 { picks, done }（卡還沒開或不在今天的看板上就是 null）
    otherCard = (id) => { const c = this.board.get(id); return c ? { picks: c.picks || {}, done: (w) => c.done(w) } : null; };
    testDrives(card, work, ctx = this.aiCtx(card)) {
      const test = this.subtask(card, 'test');
      if (!['code', 'ui_design'].includes(work) || !test || !ctx.done.includes('test')) return {};
      return Works.testDrives(test.question, ctx.picks && ctx.picks.test, ctx);
    }
    // 一份要做幾分鐘：照模型（沒有就照劇本 ai.turnaround）忽快忽慢，但同一份每次一樣
    aiMinutes(card, work, attempt, model) {
      const [lo, hi] = (this.aiModel(model) || {}).turnaround || this.script.ai.turnaround || [10, 25];
      return lo + Math.floor(Works.aiRoll(`${card.id}:${work}:${attempt}:t`) * (hi - lo + 1));
    }
    // 開一份 AI 的工作：扣額度、記一份 run、時間到用 compute(種子) 填答案卡（AI 做事前先讀筆記，所以筆記看交件那一刻的）
    // opts：model（挑的模型）、cost（扣幾格，整組交辦的子項已經一起扣過了）、minutes（整組交辦算好的交件時間）、group、
    // lines（終端機要印的，整組交辦由 delegateWorks 一次印好，其他份不印）
    startRun(card, work, compute, cmd, { model = null, cost = this.aiCost(model), minutes = null, group = null, lines = null } = {}) {
      if (cost && this.aiLack(model, cost)) { this.emit('ai:empty', { card, work }); return null; }
      this.payAi(model, cost); this.ai.stats.delegated++;
      if (model) this.ai.stats.models[model] = (this.ai.stats.models[model] || 0) + 1;
      const runs = (card.ai ||= {})[work] ||= [];
      const attempt = runs.length + 1;
      const takes = minutes ?? this.aiMinutes(card, work, attempt, model);
      const job = { id: attempt, status: 'running', attempt, model, group, startedAt: this.clock.minute, doneAt: this.clock.minute + takes, errors: [] };
      runs.push(job); card.log('ai', this.clock.minute, { work });
      this.markActed(card.id);
      const shown = lines ?? [{ text: cmd, kind: 'cmd' }, { text: `${this.aiName(model)}接手 #${card.no} ${Works.label(work)}（第 ${attempt} 份），預計 ${takes} 分鐘。`, kind: 'out' }];
      this.emit('ai:started', { card, work, job, lines: shown }); this.emit(`ai:started:${card.id}:${work}`, { card, work, job }); this.emit(`ai:started:*:${work}`, { card, work, job });
      this.clock.at(job.doneAt, () => {
        if (job.status !== 'running') return;
        Object.assign(job, compute(`${card.id}:${work}:${attempt}`));
        if (job.deploy) { this.deployNext(card, work, job); return; }
        job.asks = Works.firstAsks(this.subtask(card, work).question, this.ai.notes); job.asked = 0;
        this.nextStep(card, work, job);
      });
      return job;
    }
    // 交件前最後一步：筆記矯枉過正（ask）的話，還有沒問的就停在終端機問人類；都問完才交件
    nextStep(card, work, job) {
      const name = `#${card.no} ${Works.label(work)}（第 ${job.id} 份）`;
      const ask = job.asks[job.asked];
      if (ask) { job.status = 'asking'; this.emit('ai:asking', { card, work, job }); return; }
      job.status = 'ready';
      this.emit('ai:ready', { card, work, job, lines: [{ text: `✓ ${name}：做好了，等你確認。`, kind: 'ai' }] });
      this.emit(`ai:ready:${card.id}:${work}`, { card, work, job });
      // 整組交辦的每一份都做好了（同一次交辦＝同一個 group、同一個開始時間）
      const batch = job.group ? Object.values(card.ai).flat().filter(j => j.group === job.group && j.startedAt === job.startedAt) : [];
      if (batch.length && batch.every(j => !['running', 'asking'].includes(j.status))) this.emit('ai:group_ready', { card, group: job.group });
    }
    // 回答 AI 停下來問的那一題：照回答改答案卡，它再做一下（AI_ASK_GAP_MIN）才問下一題或交件
    answerAi(cardId, work, jobId, yes) {
      const card = this.board.get(cardId); const job = card && ((card.ai && card.ai[work]) || []).find(j => j.id === jobId);
      if (!job || job.status !== 'asking' || this.ended || !this.online()) return null;
      if (job.deploy) return this.deployAnswer(card, work, job, yes);
      const ask = job.asks[job.asked];
      job.answers = Works.applyAsk(this.subtask(card, work).question, job.answers, ask, yes);
      job.asked++; this.ai.stats.asked++;
      Object.assign(job, { status: 'running', startedAt: this.clock.minute, doneAt: this.clock.minute + C.AI_ASK_GAP_MIN });
      this.emit('ai:answered', { card, work, job, lines: [{ text: `? #${card.no} ${Works.label(work)}（第 ${job.id} 份）：${ask.text}`, kind: 'ai' }, { text: `> ${yes ? ask.yes : ask.no}`, kind: 'cmd' }] });
      this.clock.at(job.doneAt, () => { if (job.status === 'running') this.nextStep(card, work, job); });
      return job;
    }
    // ── Accept Edits、Auto 的 AI 部署：照正確順序一步一步做，備份它自己做（會忘），其他步驟先問你。
    // 上傳、替換、資料轉換選 N：中斷 AI，或請它補做漏掉的步驟再問一次；測試、通知選 N 就是不做。回答不寫進 CLAIRE.md
    aiDeploys(question) { return !!question.roles && STEPWISE_DEPLOY.includes(this.script.ai.permission); }
    deployPlan(card, question, seed) {
      const roles = question.roles, item = question.items[0];
      const right = item.answer.map(i => Object.keys(roles).find(r => roles[r] === i));
      // 劇本寫了 AI 的排法、本來就沒備份的那張一定忘；其他（含劇本沒寫 AI 排法的）照機率
      const scripted = item.ai && item.ai.pick;
      const forgot = (scripted && !scripted.includes(roles.backup)) || Works.aiRoll(`${seed}:backup`) < C.AI_FORGET_BACKUP;
      // CLAIRE.md 有部署 SKILL（「寫 Skill」）：照正確順序一步做到底，不會忘備份、不問、不通知
      const auto = !!this.ai.notes.deploy;
      const steps = auto ? [...right] : [...right.filter(r => !(forgot && r === 'backup')), ...(roles.notify != null ? ['notify'] : [])];
      return { right, steps, at: 0, done: [], choosing: false, auto, ctx: this.deployCtx(card, roles, []) };
    }
    deployOption(card, work, role) { const q = this.subtask(card, work).question; return q.items[0].options[q.roles[role]]; }
    deployNext(card, work, job) {
      const d = job.deploy;
      if (d.auto) {   // 照 CLAIRE.md 的部署流程：每一步直接做，做完交件；資料轉換要對回去的，對完才接著做
        if (!d.done.length) this.emit('ai:deploying', { card, work, job, lines: [{ text: '照 CLAIRE.md 的部署流程做。', kind: 'note' }] });
        while (d.at < d.steps.length) {
          this.deployDo(card, work, job, d.steps[d.at]); d.at++;
          const wait = this.takeWait(d);
          if (wait) return this.deployLater(card, work, job, wait);
        }
        return this.deployFinish(card, work, job);
      }
      while (d.steps[d.at] === 'backup') { this.deployDo(card, work, job, 'backup'); d.at++; }
      if (d.at >= d.steps.length) return this.deployFinish(card, work, job);
      const role = d.steps[d.at];
      const text = DEPLOY_ASKS[role] + (DEPLOY_GUARDED[role] && role !== 'migrate' ? '' : `（${this.deployOption(card, work, role)}）`);
      Object.assign(job, { status: 'asking', asks: [{ text, yes: 'Y', no: 'N' }], asked: 0 });
      this.emit('ai:asking', { card, work, job });
      return job;
    }
    // 資料轉換有轉不過去的（第一次轉）：AI 接著一筆一筆對回去，下一步等對完（deploy.wait 分鐘）才做；玩家的時鐘不跳
    deployDo(card, work, job, role) {
      const reconcile = role === 'migrate' && card.migrate && !card.reconciled;
      const lines = this.deployStep(card, job.deploy.ctx, role);
      if (reconcile) {
        job.deploy.wait = this.aiReconcileMinutes(card, job);
        lines.push({ text: `${this.aiName(job.model)}把轉不過去的 ${card.migrate.left} 筆一筆一筆對回去，預計 ${job.deploy.wait} 分鐘。`, kind: 'out' });
      }
      job.deploy.done.push(role); card.terminal = [...(card.terminal || []), ...lines];
      this.emit('ai:deploying', { card, work, job, lines });
    }
    aiReconcileMinutes(card, job) {
      const [lo, hi] = C.AI_RECONCILE.map(r => Math.round(card.migrate.left * r));
      return lo + Math.floor(Works.aiRoll(`${card.id}:deploy:${job.id}:reconcile`) * (hi - lo + 1));
    }
    // 剛才資料轉換要對回去的分鐘數（取一次就歸零）
    takeWait(d) { const wait = d.wait || 0; d.wait = 0; return wait; }
    // 過幾分鐘再做下一步（問完一題的空檔、對資料的時間）
    deployLater(card, work, job, minutes) {
      Object.assign(job, { status: 'running', startedAt: this.clock.minute, doneAt: this.clock.minute + minutes });
      this.clock.at(job.doneAt, () => { if (job.status === 'running') this.deployNext(card, work, job); });
      return job;
    }
    // 還沒做、照正確順序應該排在這步前面的步驟（忘了的備份）
    deployMissing(d, role) { return d.right.slice(0, d.right.indexOf(role)).filter(r => !d.done.includes(r)); }
    deployAnswer(card, work, job, answer) {
      const d = job.deploy, role = d.steps[d.at], ask = job.asks[0];
      const said = ask.choices ? ask.choices.find(c => c.value === answer).label : answer ? 'Y' : 'N';
      this.emit('ai:answered', { card, work, job, lines: [{ text: `? #${card.no} ${Works.label(work)}（第 ${job.id} 份）：${ask.text}`, kind: 'ai' }, { text: `> ${said}`, kind: 'cmd' }] });
      this.ai.stats.asked++;
      if (d.choosing) {
        d.choosing = false;
        if (answer === 'stop') return this.deployStop(card, work, job);
        for (const r of this.deployMissing(d, role)) this.deployDo(card, work, job, r);   // 補做完再問一次同一步
      } else if (answer) { this.deployDo(card, work, job, role); d.at++; }
      else if (DEPLOY_GUARDED[role]) {
        d.choosing = true;
        const missing = this.deployMissing(d, role).map(r => this.deployOption(card, work, r));
        job.asks = [{ text: `好，先不${DEPLOY_GUARDED[role]}。然後呢？`, choices: [{ value: 'stop', label: '中斷 AI' },
          ...(missing.length ? [{ value: 'fix', label: `修正 AI 流程：補做${missing.join('、')}` }] : [])] }];
        this.emit('ai:asking', { card, work, job });
        return job;
      } else d.at++;   // 不測試、不通知
      return this.deployLater(card, work, job, C.AI_ASK_GAP_MIN + this.takeWait(d));
    }
    // 中斷：做過的步驟留在卡上（card.aiDeployed），玩家自己排部署時接著算
    deployStop(card, work, job) {
      const done = job.deploy.done;
      job.status = 'stopped'; card.aiDeployed = [...done];
      const did = done.length ? `，已經做了：${done.map(r => this.deployOption(card, work, r)).join('、')}` : '';
      this.emit('ai:deploying', { card, work, job, lines: [{ text: `^C ${this.aiName()}停下來了${did}。剩下的步驟你自己來。`, kind: 'note' }] });
      return job;
    }
    deployFinish(card, work, job) {
      const q = this.subtask(card, work).question;
      job.status = 'ready';   // 讓 doWork 收下這份（taken），終端機才不會再畫它的進度條
      const result = this.doWork(card.id, work, [job.deploy.done.map(r => q.roles[r])], { by: 'ai', reviewed: true, jobId: job.id, printed: true });
      this.emit('ai:deploying', { card, work, job, lines: [{ text: `✓ #${card.no} ${Works.label(work)}（第 ${job.id} 份）：做完了。`, kind: 'ai' }] });
      return result;
    }
    // 退回＝請 AI 改：base 是答案卡上現在的樣子，requests = [{ key: 圈的題目, fix: 第幾句補充說明（null＝只說這題不對）}]。
    // 講的話馬上寫進 AI 筆記（AI 的口吻）；它只改圈到的題目，再對整份套一次筆記。再扣一次額度、再等一次
    reviseAi(cardId, work, jobId, base, requests) {
      const card = this.board.get(cardId); const job = card && this.aiRun(card, work, jobId); const sub = job && this.subtask(card, work);
      if (!sub || !this.board.canOperate(card) || this.ended || !this.online()) return null;
      if (this.aiLack(job.model)) { this.emit('ai:empty', { card, work }); return null; }
      const spots = Works.aiSpots(sub.question, base, this.aiCtx(card));
      // 「用人話寫」（key 'style'）：不圈題目也能退，記進筆記之後 Novel 寫的文件不再落落長
      const plain = requests.some(r => r.key === 'style');
      if (plain) this.ai.notes.style = { stance: 'plain', text: PLAIN_NOTE };
      const told = requests.filter(r => r.key !== 'style').map(({ key, fix }) => { const spot = spots.find(s => s.key === key); return { key, fix: spot && fix != null ? spot.fixes[fix] : null }; });
      for (const { fix } of told) {
        for (const topic of Works.fixDrops(fix)) delete this.ai.notes[topic];
        Object.assign(this.ai.notes, Works.fixNotes(fix, this.script.ai.topics));
      }
      job.status = 'rejected'; this.ai.stats.revised++;
      const said = [...(plain ? ['「用人話寫」'] : []), ...told.filter(t => t.fix).map(t => `「${t.fix.say}」`)].join('');
      const next = this.startRun(card, work, (seed) => ({ answers: Works.reviseAnswers(sub.question, base, told, { ...this.aiCtx(card), notes: this.ai.notes, accuracy: this.aiAccuracy(job.model, work), seed }), errors: [] }),
        `$ claire --issue ${card.no} --task ${work} --fix ${said || '「這幾題不對」'}`, { model: job.model });
      this.emit('ai:notes', this.aiNotes());
      return { job: next };
    }
    // AI 筆記：畫面列出來（AI 的口吻），可以刪
    aiNotes() {
      if (!this.ai) return [];
      return Object.entries(this.ai.notes).map(([topic, n]) => (typeof n === 'string' ? { topic, stance: n, text: n } : { topic, stance: n.stance, text: n.text }));
    }
    deleteNote(topic) { if (this.ai && this.ai.notes[topic] != null) { delete this.ai.notes[topic]; this.emit('ai:notes', this.aiNotes()); } }
    // 事先寫進 CLAIRE.md 的規範（「寫 Skill」）：劇本 ai.skills 列出能寫的；寫了就是一條筆記，AI 之後照著做
    skills() { return ((this.script.ai && this.script.ai.skills) || []).filter(s => !(this.ai && this.ai.notes[s.id])); }
    addSkill(id, stance = null) {
      const skill = this.skills().find(s => s.id === id); if (!skill || !this.ai) return null;
      const chosen = skill.options ? skill.options.find(o => o.stance === stance && o.say) : skill;
      if (!chosen) return null;
      this.ai.notes[id] = { stance: chosen.stance || 'skill', text: chosen.text };
      this.emit('ai:notes', this.aiNotes()); this.emit(`skill:${id}`, this.ai.notes[id]);
      return this.ai.notes[id];
    }
    acceptAi(cardId, work, jobId) {
      const card = this.board.get(cardId); const job = card && this.aiRun(card, work, jobId);
      if (!job) return null;
      return this.doWork(cardId, work, job.answers, { by: 'ai', reviewed: false, jobId: job.id });
    }
    // AI 的主張（judgment function）怎麼判斷：請小潘提證據＝等他 LIME；自己驗＝花時間、當場看到結果；
    // 憑經驗＝不花時間，只靠卡上的線索。每個主張判斷一次，記在 card.claims
    checkClaim(cardId, fnName, how) {
      const card = this.board.get(cardId); const sub = card && this.subtask(card, 'code');
      const f = sub && (sub.question.functions || []).find(x => x.name === fnName && x.judgment);
      if (!f || !this.board.canOperate(card) || (card.claims && card.claims[fnName]) || !['ask', 'test', 'gut'].includes(how)) return null;
      const ev = f.evidence || {};
      let note = null;
      if (how === 'ask') {   // 你在 LIME 問小潘，他二十分鐘後回
        this.addDoc({ id: `${card.id}:claim:${fnName}:ask`, title: '同事 小潘', from: '同事 小潘', module: null, origin: 'line', kind: 'sent', cardId: card.id, text: `AI 說「${f.claim}」，這樣對嗎？`, sentences: [], subtasks: [] });
        this.clock.at(this.clock.minute + 20, () => this.addDoc({ id: `${card.id}:claim:${fnName}`, title: '同事 小潘', from: '同事 小潘', module: null, origin: 'line', kind: 'chat', cardId: card.id, text: ev.ask || '我也不知道欸，你試試看？', sentences: [], subtasks: [] }));
      }
      if (how === 'test') { note = ev.test || '試了一下，看不出差別。'; this.clock.spend(ev.testMin || 30); }
      (card.claims ||= {})[fnName] = { how, at: this.clock.minute, note };
      this.markActed(cardId);
      this.emit('claim:checked', { card, fn: fnName, how, note }); this.emit(`claim:checked:${card.id}:${fnName}`, { card, how, note });
      return { how, note };
    }

    // 手動測試：answers 是操作清單 [{ target: 'phone'|'tablet'|'pc', sim?: 'phone'|'tablet' }]。
    // 沒程式→Null Exception；實機翻全部 bug、模擬只翻一般 bug。手動測試照著驗收文件測：function 的 accept 是它對應的驗收案例，
    // 驗收有寫那個案例，它的 bug 才翻得出來；驗收還沒做＝不知道從何測起。沒有驗收這件工作的卡，卡片就是驗收文件：卡上有那句（sentence）就翻得出來
    manualTest(card, ops = []) {
      if (!card.done('code')) return { nullException: true, ops: [], found: [], version: '物理意義上的 Null Exception' };
      const hasAccept = !!this.subtask(card, 'doc_accept');
      const blind = hasAccept && !card.done('doc_accept');
      const fns = this.subtask(card, 'code').question.functions || [];
      const bugs = ((card.history.filter(h => h.work === 'code').at(-1) || {}).result || {}).bugs || [];
      const cases = [].concat((card.picks && card.picks.doc_accept && card.picks.doc_accept[0]) || []);
      const covered = card.draft ? card.draft.covered : 'all';
      const measurable = (name) => {
        const f = fns.find(x => x.name === name); if (!f) return false;
        if (hasAccept) return f.accept !== undefined && cases.includes(f.accept);
        return f.sentence !== undefined && (covered === 'all' || covered.includes(f.sentence));
      };
      const done = [], found = new Set();
      for (const op of ops) {
        const real = op.target !== 'pc';
        if (real && this.devices[op.target] <= Works.LOW_BATTERY) { done.push({ ...op, ok: false }); continue; }
        done.push({ ...op, ok: true });
        if (real) card.realTested = true;   // 拿實機測過：只有實機才測得出來的 bug（deviceBugs）就抓到了
        if (blind) continue;
        for (const b of bugs) {
          const f = fns.find(x => x.name === b.fn);
          if ((real || !(f && f.device)) && measurable(b.fn)) found.add(b.fn);
        }
      }
      card.bugsFound = [...new Set([...(card.bugsFound || []), ...found])];
      const label = (op) => (op.target === 'pc' ? (op.sim ? `PC 模擬${op.sim === 'tablet' ? '平板' : '手機'}` : 'PC') : `${op.target === 'tablet' ? '平板' : '手機'}實機`) + (op.ok ? '' : '（沒電）');
      return { nullException: false, blind, ops: done, found: [...found], version: done.length ? done.map(label).join('、') : '沒做任何操作' };
    }
    // 部署順序排錯的後果：替換排在上傳前面→內網 502 到下次部署好為止（阿賢會 LINE 來問、分鐘數記在結算卡）；
    // 漏備份→之後被退件時沒得回，QC 再驗加倍久；漏煙霧測試→QC 多翻一個「新增完頁面白掉」；漏通知→阿賢不知道上線了，會來問。
    // 備份排在動到線上的步驟（替換、資料轉換）後面，備到的已經是改過的東西，跟漏備份一樣
    deployOutcome(card, roles, order) {
      const pos = (role) => order.indexOf(roles[role]);
      const has = (role) => pos(role) >= 0;
      const backupLate = has('backup') && ['replace', 'migrate'].some(role => has(role) && pos(role) < pos('backup'));
      const broken = has('replace') && (!has('upload') || pos('replace') < pos('upload'));
      if (broken && card.down == null) {
        card.down = this.clock.minute; this.emit('site:down', card);
        this.clock.at(this.clock.minute + 10, () => { if (card.down != null) this.addDoc({ id: `${card.id}:down:${card.down}`, title: card.requester, from: card.requester, module: null, origin: 'line', kind: 'nag', cardId: card.id, text: '網頁打不開欸，是在弄嗎？', sentences: [], subtasks: [] }); });
      } else if (!broken && card.down != null) {
        card.downMinutes = (card.downMinutes || 0) + (this.clock.minute - card.down); card.down = null; this.emit('site:up', card);
      }
      card.noBackup = !has('backup') || backupLate;
      card.noSmoke = !has('smoke');
      if (card.noBackup && card.onNoBackup && !card.lostData) { card.lostData = true; this.loseData(card.onNoBackup); }
      // 部署時就通知需求單位是陷阱：還沒過 QC 就叫人用。有 bug 的話阿賢十五分鐘後就來問
      if (has('notify')) {
        card.earlyNotify = true;
        const bugs = ((([...card.history].reverse().find(h => h.work === 'code') || {}).result || {}).bugs || []).length;
        if (bugs) this.clock.at(this.clock.minute + 15, () => this.addDoc({ id: `${card.id}:early:${this.clock.minute}`, title: card.requester, from: card.requester, module: null, origin: 'line', kind: 'nag', cardId: card.id, text: '我開來用了欸，有些地方怪怪的，是還沒好嗎？', sentences: [], subtasks: [] }));
      }
    }
    // QC 驗過之後，玩家在已完成的卡上按「通知需求單位」，LIME 才發；沒按，半小時後阿賢來問
    notifyDone(id) {
      const card = this.board.get(id);
      if (!card || card.status !== 'archived' || card.assignee !== this.player.name || card.notified || !this.online()) return null;
      card.notified = true; card.unnotified = false;
      const group = card.notifyGroup || null;   // 母議題發到 POC 群組，其他私訊需求單位
      this.addDoc({ id: `${card.id}:notified`, title: group || card.requester, from: card.requester, group, module: null, origin: 'line', kind: 'sent', cardId: card.id, text: group ? `#${card.no} ${card.title} 上 POC 了，麻煩登入看看` : `#${card.no} ${card.title} ${card.notifyText || 'QC 驗過、上線了，可以用了'}`, sentences: [], subtasks: [] });
      if (group || !this.afterNotify(card)) this.sendSticker(card.requester, `${card.id}:notified:re`, 'thumb', group);
      if (group) this.customerTrial(card);
      this.emit('card:notified', card); this.emit(`card:notified:${card.id}`, card);
      return card;
    }
    // 需求單位拿到成品先試一下（劇本 usage）：流程卡住的一張一張催；有跳紅字的欄位，兩分鐘後回 irkReply；
    // 照常理做、業主不滿意的（displeased），兩分鐘後轉述不滿的那幾句（outcome 帶 who 的寫「誰說」，沒帶的照 usage.displeased 的口氣）。
    // 這兩種都取代讚的貼圖。回傳有沒有回話
    afterNotify(card) {
      const u = this.script.usage; if (!u) return false;
      const outs = this.cardOutcomes(card);
      // 程式（或前端程式）是流程卡住的寫法：她一試就卡住，每隔 stuckGap 分鐘催一張
      this.scheduleNags(card, outs.filter(o => o.kind === 'stuck').map((o, n) => ({ after: u.stuckGap * (n + 1), who: card.requester, text: o.say })), { whileOpen: false, tag: 'stuck' });
      const tell = (id, text) => this.clock.at(this.clock.minute + 2, () => this.addDoc({ id: `${card.id}:${id}`, title: card.requester, from: card.requester, module: null, origin: 'line', kind: 'chat', cardId: card.id, text, sentences: [], subtasks: [] }));
      const unhappy = [...new Map(outs.filter(o => o.kind === 'displeased').map(o => [o.say, o])).values()];
      if (unhappy.length) tell('displeased', unhappy.map(o => (o.who ? `${o.who}說：「${o.say}」` : u.displeased.replace('{say}', o.say))).join('\n'));
      if (outs.some(o => o.kind === 'annoy')) tell('tried', u.irkReply);
      return unhappy.length > 0 || outs.some(o => o.kind === 'annoy');
    }
    // 第 n 次抱怨：已結案的卡裡員工惱怒的那幾句（同一句只講一次），照順序取第 n 句，用 usage.complain 的口氣從 usage.who 傳來
    complain(n) {
      const u = this.script.usage; if (!u || this.ended) return null;
      const says = [...new Set(this.board.cards.filter(c => c.status === 'archived').flatMap(c => this.cardOutcomes(c)).filter(o => o.kind === 'annoy').map(o => o.say))];
      if (!says[n]) return null;
      return this.addDoc({ id: `usage:complain:${n}`, title: u.who, from: u.who, module: null, origin: 'line', kind: 'chat', text: u.complain.replace('{say}', says[n]), sentences: [], subtasks: [] });
    }
    // 上線後的帳（劇本 usage，結算卡用）：已結案的卡算紅字次數（跳紅字的題數 × 那個模組一天的單數）、變回紙本
    // （跳紅字的題數到 paperAt 的模組，一半的單回去寫紙本）、卡住的單（一題一張）、月底才出的事（late 的那句）和公斤數；
    // 怪東西是阿姿驗的時候亂打填進去、翻出來的（card.junkFound），改好再交也留著
    usageTally() {
      const u = this.script.usage || { forms: {}, paperAt: Infinity };
      const out = { red: 0, paper: 0, stuck: 0, late: [], junk: [], kg: { short: 0, untracked: 0, petFood: 0 } };
      for (const card of this.board.cards.filter(c => c.status === 'archived')) {
        const outs = this.cardOutcomes(card); const forms = u.forms[card.id] || 0;
        const annoy = outs.filter(o => o.kind === 'annoy').length;
        out.red += annoy * forms;
        if (annoy >= u.paperAt) out.paper += Math.ceil(forms / 2);
        out.stuck += outs.filter(o => o.kind === 'stuck').length;
        out.late.push(...outs.filter(o => o.kind === 'late').map(o => o.say));
        for (const o of outs) for (const [k, v] of Object.entries(o.kg || {})) out.kg[k] = (out.kg[k] || 0) + v;
      }
      out.junk = [...new Set(this.board.cards.flatMap(c => c.junkFound || []))];
      return out;
    }
    // 相罵本（劇本 quarrel）：從上線（已結案）的卡挑一件吵架；那張卡記錄的那一格（cases[卡].logged）最後是正解，
    // 一查紀錄就收工，不然輸的那方 LIME 找上門。一天一件，結果記在 stats.quarrel
    quarrel() {
      const q = this.script.quarrel; if (!q || this.ended) return null;
      const live = this.board.cards.filter(c => c.status === 'archived' && q.cases[c.id]);
      if (!live.length) return null;
      const card = live[Math.floor(this.random() * live.length)]; const c = q.cases[card.id];
      const { spot, picked } = this.quarrelSpot(card, c.logged);
      this.stats.quarrel = { cardId: card.id, logged: (picked ?? spot.ifSkipped) === spot.answer };
      // 卡上選了路的（card.route），那條路有自己的一句就換成它（例：接手別人的版本——「你們不是來收尾的嗎？」）
      const blame = (c.routeBlame && c.routeBlame[card.route]) || q.blame;
      if (!this.stats.quarrel.logged) this.addDoc({ id: 'quarrel:blame', title: c.loser, from: c.loser, module: null, origin: 'line', kind: 'chat', cardId: card.id, text: `${c.ask}${blame}`, sentences: [], subtasks: [] });
      return this.stats.quarrel;
    }
    // 相罵本看的那一格：{ work, item } 是那件工作的第幾題，{ fn } 是開發那個 function 唯一的欄位（成品看後端程式，規格只負責預填）。
    // 那件工作沒做，picked 是 undefined，呼叫的人照 ifSkipped；題目照原本那版（onlyIf 沒成立）的，picked 是 inherit
    quarrelSpot(card, logged) {
      if (logged.fn) {
        const fns = this.subtask(card, 'code').question.functions; const i = fns.findIndex(f => f.name === logged.fn);
        const [key, field] = Object.entries(fns[i].fields)[0];
        return { spot: field, picked: card.done('code') ? (((card.picks && card.picks.code) || [])[i] || {})[key] : undefined };
      }
      const item = this.subtask(card, logged.work).question.items[logged.item];
      const picked = !Works.activeItem(item, card.picks) ? item.inherit : card.done(logged.work) ? ((card.picks && card.picks[logged.work]) || [])[logged.item] : undefined;
      return { spot: item, picked };
    }
    // 成品跟卡上的需求差多少（平行宇宙用，看結果不看手段）：成品是前端程式＋後端程式，兩件最後一次的分數平均，1 減掉它；
    // 規格只負責預填開發，不另外算。沒做的算 0 分，開發全部從文件拉進來（沒有要自己寫的）算全對；卡上沒有這兩件的回 0
    mismatch(card) {
      const works = ['ui_design', 'code'].filter(w => this.subtask(card, w));
      if (!works.length) return 0;
      // 劇本 parallel.ignore 列的後果種類（第三關：老師不滿）不算對不上——太好用是做歪，但跟平行宇宙的歪不一樣
      const ignore = (this.script.parallel && this.script.parallel.ignore) || [];
      const forgiven = (w) => this.cardOutcomes(card).filter(o => o.work === w && ignore.includes(o.kind)).length;
      const ratio = (w) => { const h = [...card.history].reverse().find(x => x.work === w && x.result); return !h ? 0 : h.result.max ? Math.min(h.result.max, h.result.score + forgiven(w)) / h.result.max : 1; };
      return 1 - works.reduce((sum, w) => sum + ratio(w), 0) / works.length;
    }
    // 平行宇宙（劇本 parallel.cards 寫了這張卡）：成品對不上超過 over 的卡交 QC，每交一次 chance 的機率；同一張卡中過就不再擲。
    // 整張交給 Pedia、交付重點選錯、Pedia 交的每一份都原樣收下的，不看對不上多少，一定擲
    parallelRoll(card) {
      const rule = this.script.parallel; if (!rule || !rule.cards || !rule.cards[card.id] || card.parallel) return;
      if ((this.untouchedWrongShot(card) || this.mismatch(card) > rule.over) && this.random() < rule.chance) card.parallel = 'rolled';
    }
    // 整張交給 Pedia 時交付重點選錯，而且那幾件卡上最後的版本都是 Pedia 那一批、原樣收下（改過、退回請它改、自己重做、沒收下都不算）
    untouchedWrongShot(card) {
      const shot = card.oneShotRun;
      if (!shot || shot.focus === 'site') return false;
      return shot.works.every(w => {
        const last = [...card.history].reverse().find(h => h.work === w);
        return !!(last && last.aiJob && last.aiJob.group === 'oneshot' && last.aiJob.untouched);
      });
    }
    // 阿姿驗完（退件或結案都一樣）才輪到需求單位看成品
    afterQC(card) { this.qcGripe(card); if (card.parallel === 'rolled') this.spawnParallel(card); }
    // 傍晚評語：已上線的卡（卡上寫了 evening: { good, bad }），前端或後端有業主不滿、漏做、月底出事的講 bad，都對的講 good，合成一則 LIME。
    // 一張都還沒上線就不講（回傳有沒有講）
    eveningReview() {
      const ev = this.script.evening; if (!ev || this.ended) return false;
      const lines = this.board.cards.filter(c => c.evening && c.status === 'archived').map(c => {
        const bad = this.cardOutcomes(c).some(o => ['displeased', 'miss', 'late'].includes(o.kind));
        return bad ? c.evening.bad : c.evening.good;
      }).filter(Boolean);
      if (!lines.length) return false;
      this.addDoc({ id: 'evening-review', title: ev.from, from: ev.from, module: null, origin: 'line', kind: 'chat', text: [ev.intro, ...lines].filter(Boolean).join('\n'), sentences: [], subtasks: [] });
      return true;
    }
    // 正解很難用（outcome kind 'gripe'）：QC 不能退，阿姿驗完在三人群組抱怨，一張卡最多一次。那個後果自己寫了 say 就講它（例：鳥卦要快轉鈕）；
    // 沒寫的照劇本 qcGripes 依序講，每句一天只講一次。母議題不交 QC，它的前端程式（網站門面）是阿姿驗子議題時看到的，所以也算
    qcGripe(card) {
      const lines = this.script.qcGripes; if (!lines) return;
      const parent = card.parent && this.board.get(card.parent);
      const target = [card, parent].find(c => c && !c.griped && this.cardOutcomes(c).some(o => o.kind === 'gripe'));
      if (!target) return;
      const own = this.cardOutcomes(target).find(o => o.kind === 'gripe' && o.say);
      const n = this.stats.gripeLines || 0;
      if (!own && n >= lines.length) return;
      target.griped = true; this.stats.gripes = (this.stats.gripes || 0) + 1;
      if (!own) this.stats.gripeLines = n + 1;
      this.clock.at(this.clock.minute + 1, () => this.addDoc({ id: `${card.id}:gripe`, title: TEAM_GROUP, from: 'QC 阿姿', group: TEAM_GROUP, module: null, origin: 'line', kind: 'chat', text: own ? own.say : lines[n], sentences: [], subtasks: [] }));
    }
    // 需求單位看了做歪的成品，覺得剛好能拿來做別的：他在 LIME 說那句，怡君開一張新卡給玩家（舊卡掛在附件當參考），當天就能做
    spawnParallel(card) {
      const spec = this.script.parallel.cards[card.id]; card.parallel = 'spawned';
      this.addDoc({ id: `${card.id}:parallel`, title: spec.who, from: spec.who, module: null, origin: 'line', kind: 'chat', cardId: card.id, text: spec.say, sentences: [], subtasks: [] });
      const fresh = this.arrive({ ...spec.card, from: SA, assignee: '玩家', requester: spec.who, attachments: [`參考文件：#${card.no} ${card.title}`] });
      this.stats.parallel = (this.stats.parallel || 0) + 1;
      return fresh;
    }
    // 筆記發作時群組裡的那句（第三天）：母議題通知到群組後客戶開始試用，子議題裡選錯又沒被攔下來的地方
    // （劇本在那個選項上寫 fires），試用的人（卡的 trialBy）會一句一句在群組裡講。看的是最後交出去的答案，文件、測試、程式都算
    firedLines(card) {
      const lines = [];
      for (const st of card.subtasks) {
        const picks = (card.picks || {})[st.work]; if (!picks) continue;
        const q = st.question || {};
        (q.functions || []).forEach((f, i) => { for (const [key, field] of Object.entries(f.fields || {})) { const t = (field.fires || {})[(picks[i] || {})[key]]; if (t) lines.push(t); } });
        (q.items || []).forEach((item, i) => { for (const p of [].concat(picks[i] ?? [])) { const t = (item.fires || {})[p]; if (t) lines.push(t); } });
      }
      return [...new Set(lines)];
    }
    customerTrial(parent) {
      const subs = this.board.cards.filter(c => c.parent === parent.id && c.status === 'archived');
      // 廢話沒刪完的 Novel 文件交給了客戶（例如資安問卷）：卡的 wordyFires 寫志豪會怎麼說
      const wordyLines = (c) => Object.entries(c.wordyFires || {}).filter(([work]) => c.wordy[work]).map(([, text]) => text);
      const linesOf = (c) => [...this.firedLines(c), ...wordyLines(c)];
      const lines = [...new Set(subs.flatMap(linesOf))];
      const who = parent.trialBy || parent.requester;
      const say = (id, text) => this.addDoc({ id: `${parent.id}:trial:${id}`, title: parent.notifyGroup, from: who, group: parent.notifyGroup, module: null, origin: 'line', kind: 'chat', cardId: parent.id, text, sentences: [], subtasks: [] });
      if (parent.trialHello) this.clock.at(this.clock.minute + 10, () => say('hello', parent.trialHello));   // 先登進去說一聲，問題接在後面
      this.stats.trialFound ??= 0;   // 有試用過才上結算卡
      lines.forEach((text, n) => this.clock.at(this.clock.minute + 15 + 3 * n, () => { say(n, text); this.stats.trialFound++; }));
      if (lines.length) this.clock.at(this.clock.minute + 15 + 3 * lines.length + 5, () => this.openFeedbackCard(parent, subs.filter(c => linesOf(c).length), lines));
      return lines;
    }
    // 上線的卡算結案、不重開：客戶的回饋由怡君開成一張新卡，舊卡掛成參考文件，排進下一版
    openFeedbackCard(parent, sources, lines) {
      const card = this.board.add(makeCard({
        id: `${parent.id}:feedback`, title: `${parent.title}：客戶回饋`, type: 'bug', from: SA, assignee: SA, requester: parent.trialBy || parent.requester, nextRound: true,
        body: lines.map(line => `・${line}`).join('\n'), attachments: [parent, ...sources].map(c => `參考文件：#${c.no} ${c.title}`),
      }), this.clock.minute);
      this.emit('card:arrived', card); this.emit(`card:arrived:${card.id}`, card);
      this.addDoc({ id: `${card.id}:said`, title: SA, from: SA, module: null, origin: 'line', kind: 'chat', cardId: card.id,
        text: `客戶的回饋我開成新卡了（#${card.no}），舊卡掛在附件當參考。排進下一版，這輪不用動。`, sentences: [], subtasks: [] });
      return card;
    }
    downMinutes(card) { return (card.downMinutes || 0) + (card.down != null ? this.clock.minute - card.down : 0); }
    // 部署在終端機上長什麼樣（legacy：指令自己打）。照玩家排的順序一步一行指令＋輸出；before 是 AI 中斷前做過的步驟（不再印）。
    // 替換排在上傳前面，替換完接著 curl 就是 502，之後的煙霧測試也是 502；通知那一步不是指令，是 LIME 送出去的一句。
    // spent 是這次部署花掉的分鐘數（資料轉換對回去的時間），結束時間照它印
    deployScript(card, roles, order, before = [], spent = 0) {
      const byIndex = Object.fromEntries(Object.entries(roles).map(([role, i]) => [i, role]));
      const ctx = this.deployCtx(card, roles, [...before.map(r => roles[r]), ...order]);
      for (const r of before) ctx.ran.add(r);
      const lines = order.flatMap(idx => (byIndex[idx] ? this.deployStep(card, ctx, byIndex[idx]) : []));
      if (!order.length) lines.push({ text: '（什麼都沒做就按了部署）', kind: 'note' });
      lines.push({ text: `# ${hhmm(this.clock.minute + spent)} 部署結束`, kind: 'note' });
      return lines;
    }
    // 一次部署共用的東西：站台名、主機（卡的 deployTarget 是 poc 就上客戶的 POC 環境，其他上公司內網）、時間戳、
    // 替換是不是排在上傳前面（整份順序看）、做過哪些步驟
    deployCtx(card, roles, order) {
      const pos = (role) => order.indexOf(roles[role]);
      return { app: (card.module || card.id).replace(/[^a-z0-9_]/gi, '_').toLowerCase(), host: card.deployTarget === 'poc' ? 'poc' : 'intranet',
        stamp: this.clock.label().replace(':', ''), broken: pos('replace') >= 0 && (pos('upload') < 0 || pos('replace') < pos('upload')), ran: new Set() };
    }
    deployStep(card, ctx, role) {
      const { app, host, stamp, broken, ran } = ctx; const lines = [];
      const cmd = (t) => lines.push({ text: `$ ${t}`, kind: 'cmd' });
      const out = (t, kind = 'out') => lines.push({ text: t, kind });
      const curl = () => { cmd(`curl -I http://${host}/${app}/`); broken ? out('HTTP/1.1 502 Bad Gateway', 'err') : out('HTTP/1.1 200 OK'); };
      if (role === 'backup') {
        cmd(`tar czf backups/${app}_${stamp}.tgz /var/www/${app}/current`); out(`backups/${app}_${stamp}.tgz  12.4 MB`);
        if (ran.has('migrate')) out('（資料已經轉換過了，備份到的是轉換後的資料）', 'note');
        else if (ran.has('replace')) out('（current 已經指到新版了，備份到的是新版）', 'note');
      }
      if (role === 'upload') { cmd(`scp -r dist/ it@${host}:/var/www/${app}/release_${stamp}`); out('dist/                 100%  3.1 MB'); }
      if (role === 'replace') { cmd(`ssh it@${host} ln -sfn release_${stamp} /var/www/${app}/current`); if (broken) curl(); }
      if (role === 'migrate') {
        cmd(`ssh it@${host} ./migrate.sh ${app}`);
        // 舊資料有轉不過去的（card.migrate）：第一次印出筆數、記在結算卡，之後再轉就是對過的
        const m = card.migrate;
        if (!m) out('migrated: 1,284 rows');
        else if (card.reconciled) out(`migrated: ${m.rows} rows（轉不過去的 ${m.left} 筆上次對過了）`);
        else { out(`migrated: ${m.rows} rows；轉不過去 ${m.left} 筆（${m.sample}）`, 'err'); card.reconciled = true; this.stats.unmigrated = m.left; }
      }
      if (role === 'seed') { cmd(`ssh it@poc ./seed.sh ${app} --from sahe_testdata.csv`); out('seeded: 5 users, 3 sites, 312 assets'); }
      if (role === 'copyprod') {   // 客戶的環境放我們的正式資料：資安事故
        cmd(`ssh it@poc ./import.sh ${app} --from prod_db_dump.sql`); out('imported: 2,418 rows（含本公司 142 位同仁的個資）', 'err'); card.copiedProd = true;
      }
      if (role === 'smoke') curl();
      if (role === 'notify') {   // 通知不是指令：真的從 LIME 送一則給需求單位——但這時候還沒過 QC（陷阱，後果在 deployOutcome）
        const text = `${card.title} 上線了，麻煩看一下`;
        this.addDoc({ id: `${card.id}:notify:${stamp}`, title: card.requester, from: card.requester, module: null, origin: 'line', kind: 'sent', cardId: card.id, text, sentences: [], subtasks: [] });
        this.sendSticker(card.requester, `${card.id}:notify:${stamp}:re`, 'ok');
        out(`LIME → ${card.requester}：${text}（已送出，還沒過 QC）`, 'note');
      }
      ran.add(role);
      return lines;
    }
    markActed(id) {
      for (let i = this.log.length - 1; i >= 0; i--) if (this.log[i].cardId === id) { this.log[i].acted = true; break; }
    }
    submit(id) {
      const card = this.board.get(id); if (!card || !this.board.canOperate(card) || !this.online()) return;
      // 沒附原始來源的卡 QC 不收：退給 SA，SA 用 LINE 來要來源。補上（attachSource）才能再交
      if (card.draft && card.draft.noSource) {
        card.needsSource = true; this.markActed(id);
        this.addDoc({ id: `${card.id}:line`, title: 'SA 怡君', from: 'SA 怡君', module: null, origin: 'line', kind: 'source_request', cardId: card.id, sentences: [], subtasks: [],
          text: `QC 把「${card.title}」退到我這了，需求原始來源在哪？mail 還是 LIME？補給我。` });
        this.emit('card:needs_source', card); this.emit(`card:needs_source:${id}`, card);
        return;
      }
      card.submit(this.clock.minute); this.submitted++; this.markActed(id);
      this.emit('card:submitted', card); this.emit(`card:submitted:${id}`, card);
      if (!this.reviewerOnDuty(card)) return;   // 驗的人睡了／下班了：卡停在交 QC，隔天早上才驗（schedule 排補驗）
      // 有部署就排時間驗（上次退件時沒備份的，這次驗加倍久）
      const bounce = this.qcBounce(card); if (bounce) return this.qcReject(card, bounce);
      this.parallelRoll(card);
      this.clock.at(this.clock.minute + this.qcTurnaround(card), () => this.qcReview(card));
    }
    // 驗的人還在不在工作：阿姿照自己的時間加班（19:00 回家繼續驗、22:30 睡），其他驗的人跟玩家一起下班
    reviewerOnDuty(card) {
      return this.reviewerOf(card) === QC ? this.clock.minute < C.QC_SLEEP_MIN : !this.home;
    }
    // 驗一張要多久：阿姿 19:00 之後在家驗比較慢；上次退件時沒備份的加倍
    qcTurnaround(card) {
      const base = this.reviewerOf(card) === QC && this.clock.minute >= C.QC_LEAVE_OFFICE_MIN ? C.QC_HOME_TURNAROUND_MIN : C.QC_TURNAROUND_MIN;
      return base * (card.slowQC ? 2 : 1);
    }
    // 阿姿一拿到就退的：沒部署（沒東西可驗）、網站 502 中、程式裡還留著 TODO
    // quiet：只問會不會退，不在群組唸（結算卡預判用）
    qcBounce(card, { quiet = false } = {}) {
      if (!card.noDeploy && !card.done('deploy')) return '還沒上測試機，我沒東西可以驗。';
      if (card.down != null) return '網站 502，我驗什麼？';
      return this.wordyBounce(card, quiet) || this.todoLeft(card);
    }
    // Novel 寫的驗收文件廢話沒刪完就交 QC：阿姿退「請用人話寫」；第一次退的時候她在群組裡也唸一句
    wordyBounce(card, quiet = false) {
      if (!card.wordy.doc_accept) return null;
      if (!quiet && !this.wordyTold) {
        this.wordyTold = true;
        this.clock.at(this.clock.minute + 3, () => this.addDoc({ id: 'team3_qc_pages', title: TEAM_GROUP, from: 'QC 阿姿', group: TEAM_GROUP, module: null, origin: 'line', kind: 'chat', text: '我今天看了十二頁的驗收文件，裡面有八頁在講為什麼要驗收。', sentences: [], subtasks: [] }));
      }
      return '驗收文件十二頁，八頁在講為什麼要驗收。請用人話寫。';
    }
    // 筆記說了文件要寫人話（退回時選「用人話寫」）：之後 Novel 寫的也不會太長
    plainStyle() { const s = this.ai && this.ai.notes.style; return !!(s && (s.stance || s) === 'plain'); }
    // 這份 AI 寫的會不會太長：Novel 寫的文件，而且筆記還沒說要寫人話（答案卡還沒收下時畫面也用這個判斷）
    isWordy(job, work) { return !!(job && job.model === 'Novel' && DOC_WORKS.includes(work) && !this.plainStyle()); }
    // 這份 AI 寫的有哪些廢話（劇本 ai.filler[文件]）：只有太長的那份才有；玩家在答案卡上刪掉的不會回來
    aiFiller(job, work) {
      if (!this.isWordy(job, work)) return [];
      if (!job.filler) job.filler = [...((this.script.ai.filler || {})[work] || [])];
      return job.filler;
    }
    // 刪掉一行廢話（全部刪完才算精簡）。帶 jobId 是答案卡上那份 AI 的，沒帶是卡上的版本；
    // 刪的時間就是玩家自己點的時間，遊戲不另外扣。回傳還剩下的；這行不在裡面回 null
    trimFiller(cardId, work, line, jobId = null) {
      const card = this.board.get(cardId);
      if (!card || !this.board.canOperate(card) || this.ended) return null;
      const job = jobId == null ? null : this.aiRun(card, work, jobId);
      const lines = jobId == null ? card.wordy[work] : job && this.aiFiller(job, work);
      const at = lines ? lines.indexOf(line) : -1;
      if (at < 0) return null;
      lines.splice(at, 1);
      if (jobId == null && !lines.length) {
        card.wordy[work] = false;
        card.comments.push({ kind: 'note', who: this.player.name, text: `（把${Works.label(work)}的廢話都刪掉了）`, at: this.clock.minute });
        this.markActed(cardId);
      }
      return lines;
    }
    // 鎖到文件來才能選的欄位（field.lockedUntil）還填著 lockedTo 那個 TODO：那段根本沒做，QC 沒東西可測
    todoLeft(card) {
      const sub = this.subtask(card, 'code'); const picks = card.picks && card.picks.code;
      if (!sub || !picks) return null;
      for (const [i, f] of (sub.question.functions || []).entries())
        for (const [key, field] of Object.entries(f.fields || {}))
          if (field.lockedUntil && picks[i] && picks[i][key] === field.lockedTo) return field.lockedBounce || `${f.does}那段還是 TODO，我要測什麼？`;
      return null;
    }
    // 昨天交、今天早上才驗的：在家交的卡沒經過一拿到就退那關，這裡補上
    qcReceive(card) {
      if (card.status !== 'to_qc') return;
      const bounce = this.qcBounce(card);
      return bounce ? this.qcReject(card, bounce) : this.qcReview(card);
    }
    // 成品上線後會怎樣（Works.outcomes）：前端程式決定畫面、後端程式決定流程（規格只負責預填開發）；那件工作還沒做就照 ifSkipped
    // 成品畫面：子議題跟著母議題的網站門面（配色）
    screenOf(card) { return Screen.model(card, card.parent ? this.board.get(card.parent) : null); }
    cardOutcomes(card) {
      return ['ui_design', 'code'].flatMap(work => {
        const sub = this.subtask(card, work); if (!sub) return [];
        return Works.outcomes(sub.question, card.picks && card.picks[work], { done: card.done(work), picks: card.picks }).map(o => ({ ...o, work, cardId: card.id }));
      });
    }
    // 防呆沒做的地方（業界前端最大的坑）：自己測不會出事，QC 亂打才會。前端程式那題標了 fails 的選項，
    // 正解裡沒勾的就是 QC 會退的理由；整關沒做＝全漏。選了 outcome 是 miss 的寫法（欄位收了怪東西），阿姿亂打一樣翻得出來
    validationGaps(card) {
      const gaps = [];
      const sub = this.subtask(card, 'ui_design');
      if (sub && sub.question.items) sub.question.items.forEach((item, i) => {
        if (!item.fails) return;
        const raw = [].concat((card.picks && card.picks.ui_design && card.picks.ui_design[i]) || []);
        const picked = raw.map(v => (item.alt && v in item.alt) ? item.alt[v] : v);   // 替代解也算做到了
        for (const idx of [].concat(item.answer)) if (!picked.includes(idx) && item.fails[idx]) gaps.push(item.fails[idx]);
        // item.conflicts：兩個都對但只能擇一，兩個都勾程式自己打架（退件理由寫在 conflictFail）
        for (const pair of item.conflicts || []) if (pair.every(v => raw.includes(v))) gaps.push(item.conflictFail);
      });
      gaps.push(...this.cardOutcomes(card).filter(o => o.kind === 'miss').map(o => o.say));
      return gaps;
    }
    // 只有實機測得出來的 bug（card.deviceBugs）：沒拿手機或平板實機測過，QC 會翻出來
    deviceGaps(card) { return card.realTested ? [] : (card.deviceBugs || []).map(b => b.text); }
    // 資料登打（kind:'entry'）：QC 對著原始清單一筆一筆檢查，字打錯、照片沒放或放錯都退
    entryGaps(card) {
      const sub = (card.subtasks || []).find(s => s.question && s.question.kind === 'entry'); if (!sub) return [];
      const last = [...card.history].reverse().find(h => h.work === sub.work);
      if (!last || !last.result) return ['還沒補救，資料還是空的'];
      const { wrongText = 0, wrongPhoto = 0 } = last.result; const gaps = [];
      if (wrongText) gaps.push(`${wrongText} 筆資料跟清單對不上`);
      if (wrongPhoto) gaps.push(`${wrongPhoto} 筆沒放照片或放錯照片`);
      return gaps;
    }
    // 某張卡某個工作第 when.item 題選了什麼（劇本的條件用，例如老闆卡挑版本）
    picked(cardId, work, when) { const card = this.board.get(cardId); return card ? Works.pickedIn(card.picks, work, when) : []; }
    // 阿姿驗這張會翻出什麼（只看不改卡）：remaining 是要退的問題，deviceMissed 是沒拿實機測、被翻出只有實機才看得到的問題
    // （她原本的話後面多問一句，非 IT 的玩家不知道要用實機測），junk 是她亂打時填進去的怪東西
    qcFindings(card) {
      const last = [...card.history].reverse().find(h => h.work === 'code');
      const bugs = ((last && last.result) || {}).bugs || [];
      const remaining = [...new Set(bugs.map(b => b.fn))].filter(fn => !(card.bugsFound || []).includes(fn));
      const fns = (this.subtask(card, 'code') || { question: {} }).question.functions || [];
      const device = this.deviceGaps(card);
      const deviceMissed = !card.realTested && (device.length > 0 || remaining.some(fn => (fns.find(f => f.name === fn) || {}).device));
      if (card.noSmoke) remaining.push('新增完頁面白掉');
      const junk = this.cardOutcomes(card).filter(o => o.kind === 'miss' && o.junk).map(o => o.junk);
      remaining.push(...this.validationGaps(card), ...device, ...this.entryGaps(card));
      return { remaining, deviceMissed, junk };
    }
    // 還在交 QC 的卡，阿姿隔天早上驗會不會過（結算卡用，不改卡）
    wouldPassQC(card) {
      return !this.qcBounce(card, { quiet: true }) && !this.qcFindings(card).remaining.length;
    }
    // QC 只會退你自己沒測出來的 bug；沒做煙霧測試會多翻一個；防呆漏的她亂打就翻出來；都乾淨就結案
    qcReview(card) {
      if (card.status !== 'to_qc' || !this.reviewerOnDuty(card)) return;   // 還沒驗完人就睡了／下班了：卡停在交 QC，隔天早上才驗
      const { remaining, deviceMissed, junk } = this.qcFindings(card);
      // 阿姿亂打時填進去、翻出來的怪東西（結算卡用）：改好再交也留著
      if (junk.length) card.junkFound = [...new Set([...(card.junkFound || []), ...junk])];
      if (remaining.length) {
        this.qcReject(card, `驗到 ${remaining.length} 個問題：${remaining.join('、')}。退回。${deviceMissed ? '你是不是沒有用開發用手機測過？' : ''}`);
        return this.afterQC(card);
      }
      card.archive(this.clock.minute); this.qcSays(card, `${this.reviewPass(card)}。`);
      this.emit('card:closed', card); this.emit(`card:closed:${card.id}`, card);
      // 有部署門檻的卡（POC 母議題）：這張驗過之後門開了就說一聲，提示鏈接得上
      for (const c of this.board.cards) if (c.deployGate && !c.gateOpened && c.deployGate(this)) { c.gateOpened = true; this.emit(`gate:open:${c.id}`, c); }
      this.clock.at(this.clock.minute + 30, () => {
        if (card.notified) return;
        card.unnotified = true;
        this.addDoc({ id: `${card.id}:unnotified:${this.clock.minute}`, title: card.requester, from: card.requester, module: null, origin: 'line', kind: 'nag', cardId: card.id, text: '那個……好了嗎？沒人跟我說。', sentences: [], subtasks: [] });
      });
      this.afterQC(card);
    }
    qcReject(card, text) {
      if (card.noBackup && card.done('deploy')) { text += '沒備份？那只能等你修。'; card.slowQC = true; }
      card.reject(this.reviewerOf(card), text, this.clock.minute); card.qcRejects = (card.qcRejects || 0) + 1; this.qcSays(card, text);
      this.emit('card:returned', card); this.emit(`card:returned:${card.id}`, card);
    }
    // 誰驗這張卡：卡上寫的人（例：檢討報告給 IT 經理看），沒寫就是阿姿；不交 QC 的卡、劇本沒有 QC 的關卡沒有人驗（回 null，卡上是「結案」）
    reviewerOf(card) {
      if (card.noQC) return null;
      return card.reviewer ? card.reviewer.who : this.script.noQC ? null : QC;
    }
    reviewPass(card) { return (card.reviewer && card.reviewer.pass) || '驗過了，進已完成'; }
    // 驗的人看完在 LIME 跟你說結果（不然都沒回）；同部門的同事用 LIME
    qcSays(card, text) {
      const who = this.reviewerOf(card);
      this.addDoc({ id: `${card.id}:qc:${this.clock.minute}`, title: who, from: who, module: null, origin: 'line', kind: 'chat', cardId: card.id,
        text: `「#${card.no} ${card.title}」${text}`, sentences: [], subtasks: [] });
    }
    // 退回 SA：checked[g] 是卡上第 g 類勾了哪幾項（card.saChecks）。有勾對的，怡君去問需求單位、補進卡片內文再還你；
    // 全部勾錯的原封不動丟回來。玩家自己開的卡只有一個理由「我先開卡了」，照開卡時指派給 SA 的流程走。
    // 在家退的、下班前沒處理完的，隔天早上她才處理（schedule 排）
    rejectToSA(id, checked = []) {
      const card = this.board.get(id); if (!card || !this.board.canOperate(card)) return;
      // card.noReject：怡君馬上退回來（例如資料遺失那張：行銷部不想重打一次），卡留在玩家手上
      if (card.noReject) {
        card.nag(SA, card.noReject, this.clock.minute); this.markActed(id);
        this.addDoc({ id: `${card.id}:bounce:${this.clock.minute}`, title: SA, from: SA, module: null, origin: 'line', kind: 'chat', cardId: card.id,
          text: `「#${card.no} ${card.title}」${card.noReject}`, sentences: [], subtasks: [] });
        this.emit('card:bounced', card); return;
      }
      const doc = this.selfOpened(card);
      if (doc) return this.selfToSA(card, doc);
      const groups = card.saChecks || [];
      const picked = groups.map((g, gi) => [...new Set([].concat(checked[gi] || []))].filter(o => g.options[o]));
      // 上次退回已經問回來的（card.picks.reject）不算對也不算錯，她只說卡上有寫
      const before = (card.picks && card.picks.reject) || [];
      const askedBefore = (gi, o) => (before[gi] || []).includes(o);
      const right = picked.map((os, gi) => os.filter(o => groups[gi].options[o].right && !askedBefore(gi, o)));
      const again = picked.flatMap((os, gi) => os.filter(o => askedBefore(gi, o)).map(o => groups[gi].options[o]));
      const wrong = picked.flatMap((os, gi) => os.filter(o => !groups[gi].options[o].right).map(o => groups[gi].options[o]));
      const reason = picked.flatMap((os, gi) => os.map(o => groups[gi].options[o].text)).join('；') || '（沒勾哪裡不清楚）';
      card.toSA = { right, again, wrong, valid: right.some(os => os.length), was: card.status };
      card.rejectToSA(reason, this.clock.minute); this.markActed(id);
      this.stats.toSA = (this.stats.toSA || 0) + 1;
      if (!this.home) this.clock.at(this.clock.minute + (card.toSA.valid ? C.SA_RECHECK_MIN : C.SA_BOUNCE_MIN), () => this.saReturns(card));
      this.emit('card:to_sa', card); this.emit(`card:to_sa:${id}`, card);
    }
    // 玩家自己開、有來源的卡：退回 SA 就是補一次「開卡時指派給 SA」
    selfOpened(card) {
      return card.from === this.player.name && card.docId ? this.docs.find(d => d.id === card.docId) || null : null;
    }
    // 卡變回怡君名下「需求分析中」，做過的工作清掉，90 分鐘後換成她整理過的版本（saReady）
    selfToSA(card, doc) {
      card.comments.push({ kind: 'to_sa', who: this.player.name, text: C.SELF_TO_SA, at: this.clock.minute });
      Object.assign(card, { from: SA, assignee: SA, requester: doc.from, status: 'new', pending: true, draft: null, picks: {}, history: [], claims: null });
      this.markActed(card.id); this.stats.toSA = (this.stats.toSA || 0) + 1;
      this.clock.at(this.clock.minute + this.saDelay(doc), () => { if (card.pending) this.saReady(card, doc); });
      this.emit('card:to_sa', card); this.emit(`card:to_sa:${card.id}`, card);
    }
    // 怡君勾對的那幾項問回來了：補進卡片內文（AI 那句換成問到的）、計畫和規格之後照 card.picks.reject 帶入、需求討論那段記成她問過
    saAnswers(card, right) {
      let lines = card.body.split('\n');
      const AI_LINE = '和 AI 討論的結果';
      const adds = [], said = [], cuts = [];
      right.forEach((os, gi) => os.forEach(o => {
        const opt = card.saChecks[gi].options[o];
        if (opt.adds) { adds.push(`・${opt.adds}`); said.push(opt.adds); }
        if (opt.replaces) {
          cuts.push(opt); said.push(opt.replaces);
          if (opt.claim) (card.claims ||= {})[opt.claim] = { how: 'sa', at: this.clock.minute, note: opt.replaces };
        }
        if (opt.asked !== undefined) card.saAsked = [...new Set([...(card.saAsked || []), opt.asked])];
      }));
      const aiAt = lines.findIndex(line => line.includes(AI_LINE));
      lines.splice(aiAt >= 0 ? aiAt : lines.length, 0, ...adds);
      // AI 加的那幾行刪掉、第一行換成怡君的說法：opt.cuts 指定含哪些字的行；沒指定就是第二天「和 AI 討論的結果」那行、或第三天卡上標 ✅ 的那行
      for (const opt of cuts) {
        const marks = opt.cuts || [AI_LINE, '✅'];
        const hit = lines.map((line, i) => (marks.some(m => line.includes(m)) ? i : -1)).filter(i => i >= 0);
        if (!hit.length) { lines.push(`・${opt.replaces}`); continue; }
        lines[hit[0]] = `・${opt.replaces}`;
        lines = lines.filter((_, i) => !hit.slice(1).includes(i));
      }
      card.body = lines.join('\n');
      const before = (card.picks && card.picks.reject) || [];
      (card.picks ||= {}).reject = right.map((os, gi) => [...new Set([...(before[gi] || []), ...os])]);
      card.record('reject', { at: this.clock.minute, by: 'sa' });
      return said;
    }
    // 怡君把卡還你：勾對的補好、勾錯的說不合理；全部勾錯的原封不動丟回來
    saReturns(card) {
      if (card.status !== 'rejected_to_sa' || !card.toSA) return;
      const { valid, right, again, wrong, was } = card.toSA;
      const refused = [...again.map(o => `「${o.text}」我剛剛問過了，卡上有寫。`),
        ...wrong.map(o => `「${o.text}」我問過了，我覺得你的提議不合理${o.why ? `：${o.why}` : ''}。`)].join('');
      let text;
      if (valid) text = `問過${card.requester}了，卡上補好了：${this.saAnswers(card, right).join('；')}。${refused}卡還你。`;
      else {
        this.stats.saBounced = (this.stats.saBounced || 0) + 1;
        text = refused ? `${refused}卡原封不動還你。` : '需求很清楚，請照做。';
      }
      card.status = was === 'new' ? 'new' : 'open'; card.toSA = null;
      card.nag(SA, text, this.clock.minute);
      this.addDoc({ id: `${card.id}:sa-back:${this.clock.minute}`, title: SA, from: SA, module: null, origin: 'line', kind: 'chat', cardId: card.id,
        text: `「#${card.no} ${card.title}」${text}`, sentences: [], subtasks: [] });
      this.emit('card:from_sa', card); this.emit(`card:from_sa:${card.id}`, card);
    }
    openNote() { this.readPaper('note'); }
    // 充電是把線插上：插著每分鐘漲 CHARGE_RATE，拔掉就停。插上那一刻就算「有充電」（提示鏈、結算卡看這個）
    charge(name) {
      if (this.plugged.has(name)) return;
      this.plugged.add(name); this.clock.spend(1);
      const step = () => {
        if (!this.plugged.has(name) || this.devices[name] >= 100) return;
        this.devices[name] = Math.min(100, this.devices[name] + CHARGE_RATE);
        this.emit('device:charging', name);
        this.clock.at(this.clock.minute + 1, step);
      };
      step();
      this.emit('device:charged', name); this.emit(`device:charged:${name}`, name);
    }
    unplug(name) { this.plugged.delete(name); this.emit('device:unplugged', name); }
    // 耗電：沒插電會極緩慢地掉，拿起來實機測試時掉得快；插著電只充不掉。每分鐘算一次
    drain() {
      for (const name of Object.keys(this.devices)) {
        if (this.plugged.has(name) || this.devices[name] <= 0) continue;
        this.drainCarry[name] = (this.drainCarry[name] || 0) + (this.inUse.has(name) ? DRAIN_IN_USE : DRAIN_IDLE);
        const lost = Math.floor(this.drainCarry[name] + 1e-9);
        if (!lost) continue;
        this.drainCarry[name] -= lost; this.devices[name] = Math.max(0, this.devices[name] - lost);
        // 公務手機講到沒電：電話直接斷
        if (name === 'work' && this.devices.work <= 0 && this.call && this.call.stage !== 'ended') this.endCall('dead', '……手機沒電了。');
        this.emit('device:drained', name);
      }
      this.clock.at(this.clock.minute + 1, () => this.drain());
    }
    // 手動測試拿起哪台裝置（一次只拿一台）；放下、換去電腦看就沒在用
    useDevice(name) { this.inUse.delete('phone'); this.inUse.delete('tablet'); if (name in this.devices) this.inUse.add(name); }
    putDownDevices() { this.inUse.delete('phone'); this.inUse.delete('tablet'); }   // 測試用的開發機放下；講電話中的公務手機不算

    // ── 會議 ──
    // 句子照時間一句一句發出去（畫面做成彈幕飄過）；標 key 的那句飄過時可以舉手。
    // ifSilent：沒舉手的下場，可以是一張卡（id）、一個旗標（flag）、一句話（text）。
    // answered：舉過手的句子 → { at: 回答的時間, reply: 對方有沒有接話 }
    // 廠商需求會議另外記：step 客戶講到第幾段（m.pages 的索引，講完是時程）、notes 每一段問到的（頁 id → 需求討論的答案）、
    // estimate 會議上回答怡君的時程（小時）、windowOpen 提問視窗開著、asking 玩家按了提問正在問
    startMeeting(m) { this.meeting = { spec: m, current: null, raised: false, answered: new Map(), step: 0, notes: {}, drafts: {}, estimate: null, windowOpen: false, asking: false }; this.emit('meeting:start', m); }
    meetingLine(m, line) { if (this.meeting) { this.meeting.current = line; this.emit('meeting:line', line); } }
    raiseHand(optionIdx, line = this.meeting && this.meeting.current) {
      if (!this.meeting || !line || !line.key || this.meeting.answered.has(line)) return false;
      if (!this.meeting.spec.lines.includes(line)) return false;
      const opt = line.options[optionIdx]; if (!opt) return false;
      this.meeting.raised = true; this.meeting.answered.set(line, { at: this.clock.minute, reply: !!opt.reply });
      if (opt.flag) this.flags[opt.flag] = true;
      if (opt.card) this.arrive(opt.card);
      this.emit('meeting:raised', { line, opt });
      return true;
    }
    // 收尾句（closing，例如老闆的「好，那就這樣」）等能舉手的句子都有結果才講，不然會在對方接話之前就散會；
    // 還沒有結果就每分鐘再看一次。講完照劇本原本收尾句到 end 的間隔散會
    closeMeeting(m, line) {
      if (!this.meeting || this.meeting.spec !== m) return;
      if (this.keysSettledAt(m) > this.clock.minute) { this.clock.at(this.clock.minute + 1, () => this.closeMeeting(m, line)); return; }
      this.meetingLine(m, line);
      this.clock.at(this.clock.minute + Math.max(1, m.end - (m.at + line.at)), () => this.endMeeting(m));
    }
    // 能舉手的句子都有結果的時間：舉手回答了＝回答當下（對方有接話就再等它飄出去），沒回答＝那句飛走的時候
    keysSettledAt(m) {
      return Math.max(-Infinity, ...m.lines.filter(l => l.key).map(l => {
        const a = this.meeting.answered.get(l);
        return a ? a.at + (a.reply ? MEETING_REPLY_GAP_MIN : 0) : C.DAY_START_MIN + m.at + l.at + C.DANMAKU_FLY_MIN;
      }));
    }
    // 離席：會議對你來說直接結束，後面的話都聽不到；沒舉過手的下場照 ifSilent
    leaveMeeting() {
      if (!this.meeting) return false;
      this.flags.left_meeting = true;
      this.endMeeting(this.meeting.spec);
      return true;
    }
    endMeeting(m) {
      if (!this.meeting) return;
      const raised = this.meeting.raised;
      if (!raised && m.ifSilent) {
        if (m.ifSilent.id) this.arrive(m.ifSilent);
        if (m.ifSilent.flag) this.flags[m.ifSilent.flag] = true;
        this.emit('meeting:silent', m.ifSilent);
      }
      if (m.kind === 'vendor') this.afterVendor(m, this.meeting.notes, this.meeting.estimate);
      this.meeting = null; this.emit('meeting:end', { spec: m, raised });
    }

    // ── 廠商需求會議（meeting.kind 'vendor'）：客戶一段講一個模組（m.pages），講完怡君問「IT 有細節想問嗎？」（m.prompt）。
    // 提問視窗開著時鐘停；玩家按提問（vendorStartAsk）才開始走，問多久算多久，問完（vendorAsk）又停；換段（vendorNext）不另外算時間。
    // 模組都講完，怡君問時程（m.schedule，vendorEstimate），再 vendorNext 就散會；
    // 散會 handover 分鐘後怡君開 m.cards，卡上 fromMeeting 的需求討論記成會議問到的、m.schedule.card 那張的估時記成會議上回答的 ──
    // 現在講到哪：{ page, index, total }（模組那段）或 { schedule }（怡君問時程）；不在廠商需求會議裡、或都講完了是 null
    vendorStep() {
      const m = this.meeting && this.meeting.spec; if (!m || m.kind !== 'vendor') return null;
      const i = this.meeting.step;
      if (i < m.pages.length) return { page: m.pages[i], index: i, total: m.pages.length };
      return i === m.pages.length && m.schedule ? { schedule: m.schedule } : null;
    }
    // 按提問：從這一刻起時鐘照走，到問完為止
    vendorStartAsk() {
      const step = this.vendorStep(); if (!step || !step.page) return false;
      this.meeting.asking = true; this.vendorClock();
      return true;
    }
    // 問完了，記下這段問到的（只問得到正在講的那段）；時鐘又停下來等換段
    vendorAsk(pageId, answers) {
      const step = this.vendorStep();
      if (!step || !step.page || step.page.id !== pageId || !answers) return null;
      this.meeting.notes[pageId] = { circled: [...(answers.circled || [])], asks: { ...(answers.asks || {}) } };
      this.meeting.asking = false; this.vendorClock();
      this.emit('meeting:asked', { pageId });
      return this.meeting.notes[pageId];
    }
    // 怡君問「時程大概抓多久」，玩家回答幾小時
    vendorEstimate(hours) {
      const step = this.vendorStep();
      if (!step || !step.schedule || !Number.isFinite(hours) || hours <= 0) return null;
      this.meeting.estimate = hours;
      return hours;
    }
    // 這段結束，換下一段；最後一段結束就散會。回傳下一段，散會了回 null
    vendorNext() {
      const step = this.vendorStep(); if (!step) return null;
      const m = this.meeting.spec;
      this.meeting.step += 1; this.meeting.asking = false; this.vendorClock();
      const next = this.vendorStep();
      if (!next) this.endMeeting(m);
      return next;
    }
    // 請 Claire 幫忙擬正在講的那段要問什麼（有 AI 的時代）：扣那個模型的額度，回傳它圈的句子和選的問法（Works.aiAnswers，每題照正確率骰），
    // 等同按了提問、時鐘開始走；送出照樣要玩家按（vendorAsk），送出前可以改、也可以再請它擬一次（每次另骰、另扣額度）。
    // 額度不夠、今天的次數用完了先回說明（modelLack），再看是不是正在講、還沒問完的那段
    vendorDelegate(pageId, model) {
      const step = this.vendorStep();
      if (!step || !this.ai || !this.aiModel(model)) return null;
      const lack = this.modelLack(model); if (lack) return { error: lack };
      const page = step.page; if (!page || page.id !== pageId || this.meeting.notes[pageId]) return null;
      this.payAi(model, this.aiCost(model)); this.ai.stats.delegated++;
      this.ai.stats.models[model] = (this.ai.stats.models[model] || 0) + 1;
      this.useModel(model, `廠商需求會議・${page.title}`);
      this.emit('claire:asked', { topic: null, say: `廠商需求會議：幫我擬「${page.title}」這段要問什麼`, model, wait: 0 });   // 終端機記一行、額度條跟著扣
      const tries = this.meeting.drafts[pageId] = (this.meeting.drafts[pageId] || 0) + 1;
      const out = Works.aiAnswers(page.question, { accuracy: this.aiAccuracy(model), seed: `${this.shuffleSeed}:meeting:${pageId}:${tries}` });
      this.vendorStartAsk();
      return out.answers;
    }
    // 開到 m.cutoff 還沒散：那句收尾、散會，結算卡多 cutoff.trait 那個成就（問到一半的那段不算問）
    cutMeeting(m) {
      if (!this.meeting || this.meeting.spec !== m) return;
      this.stats.meetingCutoff = m.cutoff.trait;
      this.emit('meeting:cutoff', m.cutoff);
      this.endMeeting(m);
    }
    // 提問視窗開著時鐘停（跟舉手一樣），收起來照走；收起來就不算在問，再打開從怡君問要不要問開始
    vendorWindow(open) {
      if (!this.meeting) { this.clock.resume('vendor'); return; }
      this.meeting.windowOpen = open;
      if (!open) this.meeting.asking = false;
      this.vendorClock();
    }
    // 視窗開著、又沒在問的時候停，其他時候照走
    vendorClock() {
      const v = this.meeting;
      if (v && v.windowOpen && !v.asking) this.clock.pause('vendor'); else this.clock.resume('vendor');
    }
    // 散會（送出、時間到、離席都一樣）：提問視窗的暫停一起收掉
    afterVendor(m, notes, estimate) {
      this.clock.resume('vendor');
      const estimateFor = (spec) => (m.schedule && m.schedule.card === spec.id ? estimate : null);
      this.clock.at(this.clock.minute + m.handover, () => { for (const spec of m.cards) this.arriveFromMeeting(spec, notes, estimateFor(spec)); });
    }
    // 怡君會後開的卡：需求討論記成會議裡那頁問到的（沒問的頁就是什麼都沒問）；會議上回答了時程的，估時記成那個數字
    // （沒回答的估時照舊留給玩家在卡上填）。會議上做掉的不算動過，卡還是「新需求」
    arriveFromMeeting(spec, notes, estimate = null) {
      const card = this.arrive(spec);
      // 要先選路的卡（card.routes）一開始只有「接手或重來」：會議問的需求討論兩條路都有，先記在卡上，選了哪條都是做過的
      const sub = this.subtask(card, 'discuss') || (card.routes && card.routes[0].subtasks.find(s => s.work === 'discuss'));
      if (sub && sub.question.fromMeeting) {
        const answers = notes[sub.question.fromMeeting] || { circled: [], asks: {} };
        const result = Works.grade(sub.question, answers);
        card.picks = { ...(card.picks || {}), discuss: answers };
        card.vague = result.missed.map(i => sub.question.segments[i]);
        card.record('discuss', { at: this.clock.minute, result, by: 'meeting' });
        card.status = 'new';
      }
      const est = estimate != null && this.subtask(card, 'estimate');
      if (est) {
        card.picks = { ...(card.picks || {}), estimate: [estimate] };
        card.estimate = estimate;
        card.record('estimate', { at: this.clock.minute, result: Works.grade(est.question, [estimate]), by: 'meeting' });
        card.status = 'new';
      }
      return card;
    }
    // 廠商需求會議上做掉的工作，卡上唯讀：會議問的需求討論（question.fromMeeting）、會議上回答的估時（紀錄 by 'meeting'）
    fromMeeting(card, work) {
      const sub = card && this.subtask(card, work);
      return !!(sub && sub.question && sub.question.fromMeeting) || !!(card && card.history.some(h => h.work === work && h.by === 'meeting'));
    }

    // 用的人對前端的評價：今天所有做出畫面的卡一起看，同一句抱怨只講一次，最多三句；
    // 追加需求的風格跟母議題不一致時，不管前面講了什麼，最後都再加「風格能夠一致會更好」
    userReview() {
      // 劇本自己定客人的話（userVoice: { who, ritual, plain }）：做了畫面的卡裡有一題照常理做（業主不滿）就講 plain，都做成業主要的講 ritual
      const voice = this.script.userVoice;
      if (voice) {
        const made = this.board.cards.filter(c => c.done('ui_design') || (c.screen && c.done('code')));
        if (!made.length) return [];
        const plain = made.some(c => this.cardOutcomes(c).some(o => o.kind === 'displeased'));
        return [{ who: voice.who, text: `「${plain ? voice.plain : voice.ritual}」` }];
      }
      const says = [];
      for (const card of this.board.cards) if (card.screen && card.done('code')) {
        const parent = card.relatedTo && this.board.get(card.relatedTo);
        says.push(...Screen.userVoice(this.screenOf(card), parent && parent.screen ? Screen.model(parent) : null));
      }
      if (!says.length) return [];
      const uniq = [...new Set(says)].filter(s => s !== Screen.STYLE_LINE); const bad = uniq.filter(s => s !== Screen.PRAISE_LINE);
      const lines = (bad.length ? bad : uniq).slice(0, 3).concat(says.includes(Screen.STYLE_LINE) ? [Screen.STYLE_LINE] : []);
      return [{ who: '使用者', text: `「${lines.join('」「')}」` }];
    }
    // 結算卡的 AI 段：交給它幾次、沒看就收下幾次、請它改幾次、筆記幾條；每個 AI 主張你怎麼判斷、最後有沒有照它做
    aiTally() {
      const s = this.ai.stats;
      const lines = [`交給 AI：${s.delegated} 次`, `沒看就收下：${s.unreviewed} 次`];
      if (s.revised) lines.push(`請 AI 改：${s.revised} 次`);
      if (s.asked) lines.push(`AI 停下來問你：${s.asked} 次`);
      if (this.aiNotes().length) lines.push(`AI 筆記：${this.aiNotes().length} 條`);
      const picked = Object.entries(s.models || {}).map(([name, n]) => `${(this.aiModel(name) || {}).label || name} ×${n}`);
      if (picked.length) lines.push(`挑模型：${picked.join('、')}`);   // 整組交辦的每一份各算一次
      const HOW = { ask: '請小潘看了', test: '自己驗了', gut: '憑經驗', sa: '退回給怡君問清楚' };
      for (const card of this.board.cards) {
        const sub = this.subtask(card, 'code'); if (!sub || !card.done('code')) continue;
        (sub.question.functions || []).forEach((f, i) => {
          if (!f.judgment) return;
          const a = ((card.picks && card.picks.code) || [])[i] || {};
          const followed = Object.entries(f.fields || {}).some(([k, fd]) => fd.ai && a[k] === fd.ai.pick);
          lines.push(`AI 說「${f.claim}」：${HOW[(card.claims && card.claims[f.name] || {}).how] || '沒查證'}，${followed ? '照做了' : '沒照做'}`);
        });
      }
      return lines;
    }
    // 估時沒有對錯：有估時的卡列你估的、實際（進「IT 處理中」到最後一次交 QC，不交 QC 的卡算到結案，跨夜也算）、主管看兩者差多少的一句，
    // 再附劇本寫的參考：這張卡在現實中純手工、有 AI 幫忙大約多久（item.real）。還沒完成的沒有實際，主管也不評。
    // 結算時還在交 QC、等阿姿驗的卡，當作隔天早上她驗過了：會過就算完成，會退就是還沒完成。
    // 卡上標了 mustEstimate 的（例：會議上說「回去估好再說」的母議題），一整天都沒估也列出來（missed），主管照樣說一句
    estimates() {
      const listed = (k) => this.subtask(k, 'estimate') && (k.estimate != null || k.mustEstimate);
      return this.board.cards.filter(listed).map(k => {
        const item = this.subtask(k, 'estimate').question.items[0];
        const submitted = k.events.filter(ev => ev.kind === 'submit').at(-1);
        const finished = k.closedAt != null || (k.status === 'to_qc' && this.reviewerOf(k) === QC && this.wouldPassQC(k));
        const end = submitted ? submitted.at : k.closedAt;
        const spent = finished && end != null ? end - this.startedAt(k) : null;
        const actual = spent == null ? '還沒完成' : Verdict.duration(spent);
        if (k.estimate == null) return { card: `#${k.no} ${k.title}`, yours: '沒估', missed: true, real: item.real || null, actual, boss: Verdict.estimateComment(null) };
        return { card: `#${k.no} ${k.title}`, yours: `${k.estimate} 小時`, real: item.real || null, actual,
          boss: spent == null ? null : Verdict.estimateComment(k.estimate, spent) };
      });
    }
    // 卡進「IT 處理中」的時間：第一次動手做工作那時（沒做過工作的卡用第一筆紀錄）
    startedAt(card) {
      const first = card.history.find(h => h.at != null) || card.timeline().find(r => r.at != null);
      return first ? first.at : card.arrivedAt;
    }
    // ── 正式上班：雜事與走動 ──
    // 雜事做完了：規則判定完成才算；沒做完就按結案視同沒做完，規則把它重新打開（下午又出事）也回到沒做完
    choreFinished(id) { const chore = this.chores[id]; return !!chore && chore.stage === 'done'; }
    choreSet(id, patch, note) {
      const chore = this.chores[id]; if (!chore) return null;
      Object.assign(chore, patch);
      if (note) chore.log.push({ at: this.clock.minute, text: note });
      this.emit('chore:changed', chore);
      return chore;
    }
    // ── 工作台：狀態存在雜事上（chore.bench），規則是劇本給的 chore.rules（例：BenchRam），畫面只送動作進來 ──
    benchState(choreId) {
      const chore = this.chores[choreId]; if (!chore || !chore.rules) return null;
      if (!chore.bench) chore.bench = chore.rules.init(typeof chore.box === 'function' ? chore.box(this.random) : (chore.box || []));
      return chore.bench;
    }
    // 規則回 out.done 就結案、out.flags 併進雜事的旗標（結算卡、同事評語要用的事實由各張卡的規則自己決定）。
    // 動作會帶上現在的時間（at）。規則回的事件照劇本的 chore.on 傳話（{ after?, from, text } 是 LIME、{ mail } 是信）；
    // out.later 過一段時間再把動作送回規則（例：關掉過濾 30 分鐘後資安檢查）；out.reopen 把結案的雜事打開。
    // 做完時委託的人道謝：動作帶 inPerson（人就在她旁邊）算當面講過了，人在自己座位就一分鐘後傳 LIME，在別的座位等回座位再傳
    benchAct(choreId, action) {
      const chore = this.chores[choreId]; const before = this.benchState(choreId); if (!before) return null;
      const out = chore.rules.apply(before, { ...action, at: this.clock.minute });
      chore.bench = out.state;
      if (out.flags) Object.assign(chore.flags, out.flags);
      if (out.done) {
        this.choreSet(choreId, { stage: 'done' }, out.say);
        if (chore.doneMessage && !chore.flags.doneSent) {
          if (action.inPerson) chore.flags.doneSent = true;
          else if (this.place === 'desk') this.sendDoneMessage(chore);
        }
      } else if (out.reopen) {
        chore.flags.doneSent = false;
        this.choreSet(choreId, { stage: 'doing' }, out.say);
      } else if (chore.stage === 'new' && JSON.stringify(out.state) !== JSON.stringify(before)) this.choreSet(choreId, { stage: 'doing' });
      for (const ev of out.events || []) {
        for (const say of [].concat((chore.on || {})[ev] || [])) this.clock.at(this.clock.minute + (say.after || 0), () => this.choreSay(chore, say));
      }
      for (const { after, act } of out.later || []) this.clock.at(this.clock.minute + after, () => this.benchAct(choreId, act));
      return out;
    }
    // 雜事的事件傳話：寫 mail 的是一封信，其他是 LIME。信可以帶 sentences＋cardSpec（從信開出一張固定的卡，例：檢討報告）；
    // LIME 寫 card: true 就能從這則開卡，新卡掛同一件雜事（例：清完下午又滿）
    choreSay(chore, say) {
      if (!say.mail) { this.choreLine(chore, say); return; }
      const { title, from, text, sentences = [], cardSpec = null } = say.mail;
      const n = this.choreLineCount = (this.choreLineCount || 0) + 1;
      this.addDoc({ id: `${chore.id}:mail:${n}`, title, from, module: null, origin: 'mail', kind: 'chat', text, sentences, subtasks: [], cardSpec });
    }
    closeBench(choreId) { this.emit('bench:closed', { chore: choreId }); }
    // 結算卡的「機殼：轉了 N 圈」只算宣告 countsTurns 的工作台
    benchTurned(choreId) { const chore = this.chores[choreId]; if (chore && chore.rules && chore.rules.countsTurns) this.stats.turns++; }
    // 自己座位的舊料箱：有 box 的雜事，列料箱裡和手上的
    partsBox() {
      const chore = Object.values(this.chores).find(c => c.box && c.rules); if (!chore) return null;
      return { chore, sticks: this.benchState(chore.id).sticks.filter(s => s.where === 'box' || s.where === 'hand') };
    }
    takeStick(choreId, stickId) { this.updateBench(choreId, (rules, state) => rules.take(state, stickId)); }
    takeAllSticks(choreId) { this.updateBench(choreId, (rules, state) => rules.takeAll(state)); }
    // 走一趟的分鐘：手上搬著重的（規則的 carrying 說 heavy，例：整箱舊料）比較久
    walkMinutes() {
      const heavy = Object.values(this.chores).some(c => c.bench && c.rules.carrying && c.rules.carrying(c.bench).heavy);
      return C.WALK_MIN + (heavy ? C.BOX_WALK_EXTRA_MIN : 0);
    }
    stowStick(choreId) { this.updateBench(choreId, (rules, state) => rules.stow(state)); }
    updateBench(choreId, change) {
      if (this.place !== 'desk' || !this.benchState(choreId)) return;
      const chore = this.chores[choreId];
      chore.bench = change(chore.rules, chore.bench);
      this.emit('chore:changed', chore);
    }
    // 同事在座位旁邊講的話（人在那邊才聽得到）；不在旁邊時講的話走 LIME
    seatSay(seatId, text) {
      const seat = (this.script.seats || {})[seatId]; if (!seat) return;
      for (const chore of Object.values(this.chores)) if (chore.seat === seatId) chore.log.push({ at: this.clock.minute, text });
      this.emit('seat:say', { seat: seatId, who: seat.who, text });
    }
    coworkerSays(chore, text) {
      this.addDoc({ id: `${chore.id}:say:${this.clock.minute}`, title: chore.from, from: chore.from, module: null, origin: 'line', kind: 'chat',
        text, sentences: [], subtasks: [] });
    }
    // 電腦拆到一半人走開：同事每隔一陣子催，等太久自己動手。時鐘排程不能取消，所以每次離開記一個 awaySince，排程觸發時先確認還是同一次離開
    leaveChore(chore) {
      const since = this.clock.minute; chore.flags.awaySince = since;
      const still = () => this.place !== chore.seat && chore.flags.awaySince === since && chore.rules.blocked(chore.bench);
      const nag = (t) => this.clock.at(t, () => { if (!still()) return; this.coworkerSays(chore, '好了沒？'); nag(t + C.RAM_NAG_MIN); });
      nag(since + C.RAM_NAG_MIN);
      this.clock.at(since + C.RAM_DIY_MIN, () => {
        if (!still()) return;
        const out = chore.rules.apply(chore.bench, { type: 'diy' });
        if (!out.events.includes('diy')) return;
        chore.bench = out.state; chore.flags.diyUnseen = true;
        this.coworkerSays(chore, '我幫你拆好了！');
        this.emit('chore:changed', chore);
      });
    }
    // 走到同事座位要時間，去程、回程各算一趟；下班了（this.home）人不在公司，走不過去
    walk(seatId) {
      if (this.home || this.place !== 'desk' || !(this.script.seats || {})[seatId]) return false;
      this.clock.spend(this.walkMinutes()); this.stats.trips++;
      this.place = seatId; this.emit('place:changed', this.place);
      for (const chore of Object.values(this.chores)) {
        if (chore.seat === seatId && chore.flags.diyUnseen) { chore.flags.diyUnseen = false; this.seatSay(seatId, '我幫你拆好了！'); }
      }
      this.askEarly(seatId);
      return true;
    }
    // ── 主動傳訊（劇本 talks）：對誰、回覆走哪個管道、幾輪。每輪的選項選錯劃掉、選對進下一輪；對方回之前不能再傳 ──
    talkState(id) {
      if (!this.talkStates) this.talkStates = {};
      if (!this.talkStates[id]) this.talkStates[id] = { round: 0, struck: [], waiting: false, ended: null };
      return this.talkStates[id];
    }
    // 話題開著：劇本的 when 成立，而且它跟著的雜事（talk.chore）還沒收尾——事情處理完了，這個話題就不用再傳
    talkOpen(talk) { return (!talk.when || talk.when(this)) && !(talk.chore && this.choreFinished(talk.chore)); }
    talkOptions(id) {
      const talk = (this.script.talks || {})[id];
      if (!talk || !this.talkOpen(talk)) return [];
      const state = this.talkState(id);
      const round = !state.waiting && !state.ended && talk.rounds[state.round];
      // 選項也可以有自己的 when（例：收到阿賢的信才問得出「這兩台哪台比較好？」）
      return round ? round.options.map((o, i) => ({ ...o, i })).filter(o => !state.struck.includes(o.i) && (!o.when || o.when(this))) : [];
    }
    // 公司通訊錄：現在找得到話題的人，一個人列一次（ids 是他現在的話題，例：阿賢同時管記憶體和印表機的財產資料）
    contacts() {
      const byWho = new Map();
      for (const [id, t] of Object.entries(this.script.talks || {})) {
        if (!this.talkOpen(t)) continue;
        if (!byWho.has(t.who)) byWho.set(t.who, { who: t.who, ids: [] });
        byWho.get(t.who).ids.push(id);
      }
      return [...byWho.values()];
    }
    // 對一個人現在能傳的句子：各話題這一輪的選項合起來，標上是哪個話題（talkId）
    contactOptions(who) {
      const contact = this.contacts().find(c => c.who === who); if (!contact) return [];
      return contact.ids.flatMap(talkId => this.talkOptions(talkId).map(o => ({ ...o, talkId })));
    }
    // 正在等這個人回哪種管道（'line'／'mail'），沒有在等就是 null；話題收掉了，已經傳出去的照樣會回
    contactWaiting(who) {
      const id = Object.keys(this.script.talks || {}).find(talkId => this.script.talks[talkId].who === who && this.talkState(talkId).waiting);
      return id ? (this.script.talks[id].replyBy || 'line') : null;
    }
    talk(id, i) {
      const option = this.talkOptions(id).find(o => o.i === i); if (!option) return null;
      const talk = this.script.talks[id]; const state = this.talkState(id);
      const n = this.talkCount = (this.talkCount || 0) + 1;
      state.waiting = true;
      this.addDoc({ id: `talk:${id}:${n}`, title: talk.who, from: talk.who, module: null, origin: 'line', kind: 'sent', text: option.say, sentences: [], subtasks: [] });
      const [lo, hi] = talk.delay || [2, 2];
      this.clock.at(this.clock.minute + lo + Math.floor(this.random() * (hi - lo + 1)), () => {
        const back = option.back;
        if (talk.replyBy === 'mail') {
          this.addDoc({ id: `talk:${id}:${n}:re`, title: back.title, from: talk.who, module: null, origin: 'mail', kind: 'chat', text: back.text, sentences: [], subtasks: [] });
          // 用信回的人在 LIME 也說一聲，對話才不會停在玩家傳的那句
          if (talk.notice) this.addDoc({ id: `talk:${id}:${n}:notice`, title: talk.who, from: talk.who, module: null, origin: 'line', kind: 'chat', text: talk.notice, sentences: [], subtasks: [] });
        } else this.addDoc({ id: `talk:${id}:${n}:re`, title: talk.who, from: talk.who, module: null, origin: 'line', kind: back.photo ? 'photo' : 'chat',
          photo: back.photo || null, text: back.photo ? `傳了一張照片` : back, sentences: [], subtasks: [] });
        state.waiting = false;
        for (const key of [].concat(option.know || [])) this.know(key);   // 對方回的話裡查到的事（例：阿賢的信寫了型號）
        if (option.end) state.ended = option.end;
        else if (option.next) { state.round += 1; state.struck = []; }
        else state.struck.push(option.i);
        this.emit('talk:changed', { id, state });
      });
      this.emit('talk:changed', { id, state });
      return option;
    }
    know(key) { this.knows.add(key); }

    // ── 公務手機打電話（劇本 calls）：撥出 → 語音選單 → 排隊等候（擴音，可以先做別的事）→ 接通響一聲、時間內要接 → 回答客服 ──
    // 等候、接通的計時用 clock.at，排程不能取消，所以觸發時先確認還是同一通、還在那一步
    callContacts() {
      return Object.entries(this.script.calls || {}).filter(([, c]) => !c.when || c.when(this)).map(([id, c]) => ({ id, who: c.who }));
    }
    // 公務手機（devices.work）沒電就打不了；通話中算拿在手上用，掉電比較快
    workPhoneDead() { return 'work' in this.devices && this.devices.work <= 0; }
    dial(id) {
      const spec = (this.script.calls || {})[id];
      if (!spec || (this.call && this.call.stage !== 'ended') || this.workPhoneDead()) return false;
      this.call = { id, stage: 'menu', lines: [spec.menu.prompt], until: null, reason: null };
      if ('work' in this.devices) this.inUse.add('work');
      this.emit('call:changed', this.call);
      return this.call;
    }
    // 語音選單按鍵（0～9、*、#）：按過的鍵記在 call.keys 給畫面顯示；選單沒有的鍵念 menu.wrong
    press(key) {
      const call = this.call; if (!call || call.stage !== 'menu') return;
      const spec = this.script.calls[call.id]; key = String(key);
      call.keys = (call.keys || '') + key;
      if (key === String(spec.menu.right)) this.queueCall(call, spec);
      else {
        const branch = (spec.menu.press || {})[key];
        if (branch) {
          call.lines.push(branch.say);
          if (branch.hangup) { this.endCall('menu'); return; }
        } else if (spec.menu.wrong) call.lines.push(spec.menu.wrong);
      }
      this.emit('call:changed', call);
    }
    queueCall(call, spec) {
      const [lo, hi] = spec.hold;
      call.stage = 'hold'; call.until = this.clock.minute + lo + Math.floor(this.random() * (hi - lo + 1));
      this.clock.at(call.until, () => {
        if (this.call !== call || call.stage !== 'hold') return;
        call.stage = 'ringing'; call.until = this.clock.minute + spec.answerWithin;
        this.emit('call:connected', call); this.emit('call:changed', call);
        this.clock.at(call.until, () => { if (this.call === call && call.stage === 'ringing') this.endCall('timeout', '嘟——嘟——（對方掛斷了）'); });
      });
    }
    pickUp() {
      const call = this.call; if (!call || call.stage !== 'ringing') return;
      call.stage = 'asking'; call.lines.push(this.script.calls[call.id].greet);
      this.emit('call:changed', call);
    }
    // 客服問的時候能回的話：只列玩家查得到的（答案自己的 when），i 是在劇本 answers 裡的位置
    callAnswers() {
      const call = this.call; if (!call || call.stage !== 'asking') return [];
      return this.script.calls[call.id].answers.map((a, i) => ({ ...a, i })).filter(a => !a.when || a.when(this));
    }
    answer(i) {
      const a = this.callAnswers().find(x => x.i === i); if (!a) return;
      const spec = this.script.calls[this.call.id];
      this.call.lines.push(a.say, a.back);
      if (a.order) this.placeOrder(spec, a);
      this.endCall(a.order ? 'ordered' : 'hangup');
    }
    hangUp() { if (this.call && this.call.stage !== 'ended') this.endCall('hangup'); }
    endCall(reason, line) {
      const call = this.call; call.stage = 'ended'; call.reason = reason;
      this.inUse.delete('work');
      if (line) call.lines.push(line);
      this.emit('call:changed', call);
    }
    // 下單：可以重複訂，每一單各自過 C.TONER_DELIVERY_MIN 分鐘送到（下班後才到的就不送了）；送來的放上那張卡的工作台
    placeOrder(spec, a) {
      const chore = this.chores[spec.chore];
      chore.flags.bought = (chore.flags.bought || 0) + a.order.length;
      if (a.allIn) chore.flags.allIn = true;
      if (chore.stage === 'new') this.choreSet(chore.id, { stage: 'doing' });
      this.clock.at(this.clock.minute + C.TONER_DELIVERY_MIN, () => {
        if (this.home) return;
        chore.bench = chore.rules.deliver(this.benchState(chore.id), a.order);
        chore.flags.delivered = (chore.flags.delivered || 0) + a.order.length;
        this.choreLine(chore, spec.delivered);
        // 送來的總數到了 bulk.count：收貨的人問一句（只問一次）
        if (spec.bulk && !chore.flags.bulkAsked && chore.flags.delivered >= spec.bulk.count) { chore.flags.bulkAsked = true; this.choreLine(chore, spec.bulk); }
        this.emit('chore:changed', chore);
      });
    }
    choreLine(chore, { from, text, card }) {
      const n = this.choreLineCount = (this.choreLineCount || 0) + 1;
      this.addDoc({ id: `${chore.id}:line:${n}`, title: from, from, module: null, origin: 'line', kind: 'chat', text,
        sentences: card ? [{ text, keep: true }] : [], subtasks: [], chore: card ? chore.id : null });
    }
    // 對方還沒開口就走到他座位：他當面講（劇本 src.early），請求變成口頭的文件（跟老闆講的話一樣），排好的那則就不來了
    askEarly(seatId) {
      for (const src of this.script.sources || []) {
        const early = src.early;
        if (!early || early.seat !== seatId || this.askedInPerson.has(src.id)) continue;
        if (this.clock.minute >= C.DAY_START_MIN + src.at || this.docs.some(d => d.id === src.id)) continue;
        this.askedInPerson.add(src.id);
        this.seatSay(seatId, early.text);
        this.addDoc(makeDoc({ ...src, ...early, kind: 'boss' }, 'boss'));
      }
    }
    goBack() {
      if (this.place === 'desk') return false;
      const from = this.place;
      this.clock.spend(this.walkMinutes()); this.stats.trips++;
      this.place = 'desk'; this.emit('place:changed', this.place);
      for (const chore of Object.values(this.chores)) {
        if (chore.seat === from && chore.bench && chore.rules.blocked(chore.bench)) this.leaveChore(chore);
        if (chore.stage === 'done' && chore.doneMessage && !chore.flags.doneSent) this.sendDoneMessage(chore);
      }
      return true;
    }
    // 雜事做完、人回到自己座位：委託的人一分鐘後傳 LIME（劇本 doneMessage：text 和 reply 題），只傳一次
    sendDoneMessage(chore) {
      chore.flags.doneSent = true;
      const { text, reply } = chore.doneMessage;
      this.clock.at(this.clock.minute + 1, () => this.addDoc({ id: `${chore.id}:done`, title: chore.from, from: chore.from, module: null, origin: 'line', kind: 'chat', text, reply, sentences: [], subtasks: [] }));
    }
    // 雜事卡沒有 QC，什麼時候算結案玩家自己決定
    closeCard(cardId) {
      const card = this.board.get(cardId); if (!card || card.status === 'archived') return null;
      // 沒做完就按結案（成就「粉飾太平」）：雜事卡看雜事做完沒，一般卡看卡上的工作都做了沒；結案不會讓事情變成做完
      const unfinished = card.chore ? !this.choreFinished(card.chore) : card.subtasks.some(s => !card.done(s.work));
      if (unfinished) this.stats.whitewashed = (this.stats.whitewashed || 0) + 1;
      card.archive(this.clock.minute); this.closedByHand++; this.markActed(cardId);   // 結案也是處理了這張卡：算進「處理了 N 件」和印章的判定
      this.emit('card:closed', card);
      return card;
    }
    // 母議題寫了 closeWith: 'children'（不交 QC）：底下的子議題（parent 是它）都結案了，它跟著結案
    closeParentOf(card) {
      const parent = card.parent && this.board.get(card.parent);
      if (!parent || parent.closeWith !== 'children' || parent.status === 'archived') return;
      if (!this.board.cards.filter(c => c.parent === parent.id).every(c => c.status === 'archived')) return;
      parent.archive(this.clock.minute);
      this.afterNotify(parent);   // 母議題自己的前端程式（例：網站門面）照常理做的，結案時需求單位一樣轉述
      this.emit('card:closed', parent); this.emit(`card:closed:${parent.id}`, parent);
    }

    // ── 下班 ──
    canLeave() { return !this.ended && !this.home && this.place === 'desk' && this.clock.minute >= C.OFF_WORK_MIN; }
    // 離開公司就是進茶几：劇本寫了 home 的天先停在下班選單，隔天 08:00 才結算；沒寫的天照舊直接結算
    leave({ forced = false } = {}) {
      if (this.ended || this.home) return null;
      if (this.place !== 'desk') { this.place = 'desk'; this.emit('place:changed', this.place); }   // 被趕下班時人在同事座位：先回到自己座位
      this.clock.resume('hint');   // 人都走了，提示不用再留住時間
      if (!this.script.home) return this.finish(this.report({ forced }));
      this.home = { phase: 'menu', leftAt: this.clock.minute, forced, menu: Home.menuFor(this.clock.minute) };
      this.clock.pause('home-menu');
      this.emit('home:menu', this.home);
      return null;
    }
    finish(report) { this.ended = { badEnd: false, report }; this.emit('day:end', report); return report; }
    finishDay() { return this.ended ? null : this.finish(this.report({ forced: !!(this.home && this.home.forced) })); }

    // ── 茶几 ──
    // 選好吃的、要不要帶公司筆電就回家：順路買多花時間、東西直接上桌；外送從下班算起 deliveryWait 分鐘才到
    goHome({ channel, order = {}, laptop = false, leisure = [] } = {}) {
      const h = this.home, s = this.script.home;
      if (!h || h.phase !== 'menu' || Home.checkOrder(h.menu, channel, order) || leisure.some(id => !Home.LEISURE[id])) return null;
      Object.assign(h, { phase: 'commute', channel, order: { ...order }, food: {}, leisure: [...leisure], fun: {}, playing: {}, laptop: !!laptop, computer: laptop ? 'company' : 'personal',
        vpn: 'off', drops: 0, worked: 0, personalUsed: false, confidential: [], missed: [], answered: [], dnd: false, asleep: false, ringing: null });
      this.clock.resume('home-menu');
      const serve = () => { h.food = { ...h.order }; this.emit('home:food', h); };
      if (channel === 'delivery') this.clock.at(h.leftAt + s.deliveryWait, serve);
      for (const em of s.emergencies || []) this.clock.at(em.at, () => this.emergency(em));
      this.clock.spend(s.commute + (channel === 'pickup' ? s.pickupExtra : 0));
      h.phase = 'table';
      if (channel === 'pickup') serve();
      this.emit('home:arrived', h);
      // 下班後才傳的 LIME（劇本 afterWork）：到家 after 分鐘後，when(engine) 成立才傳
      for (const m of this.script.afterWork || []) this.clock.at(this.clock.minute + (m.after ?? 10), () => {
        if (this.ended || (m.when && !m.when(this))) return;
        this.addDoc({ id: m.id, title: m.from, from: m.from, module: null, origin: 'line', kind: 'chat', text: m.text, sentences: [], subtasks: [] });
      });
      return h;
    }
    // 在家處理公司的事要先掛 VPN；還在公司就一直是通的
    online() { return !this.home || this.home.vpn === 'on'; }
    vpnConnect() {
      const h = this.home; if (!h || h.phase !== 'table' || h.vpn !== 'off' || h.asleep) return null;
      h.vpn = 'connecting'; this.emit('home:vpn', h);
      this.clock.at(this.clock.minute + this.script.home.vpnMin, () => { if (h.vpn === 'connecting') { h.vpn = 'on'; this.emit('home:vpn', h); } });
      return h;
    }
    // 有帶公司筆電才能換；換一台就要重掛 VPN
    useComputer(kind) {
      const h = this.home; if (!h || h.phase !== 'table' || (kind === 'company' && !h.laptop) || h.computer === kind) return null;
      Object.assign(h, { computer: kind, vpn: 'off' }); this.emit('home:vpn', h);
      return h;
    }
    // 在家做了一件公司的事：私人電腦留一份機密檔（隱藏要素）；做完有機率斷線
    workedAtHome(card, work) {
      const h = this.home; h.worked++;
      if (h.computer === 'personal') {
        h.personalUsed = true;
        h.confidential.push({ id: `${card.id}:${work}:${h.worked}`, name: `機密_#${card.no}_${Works.label(work)}.docx` });
        this.emit('home:files', h);
      }
      if (Works.aiRoll(`vpn:${card.id}:${work}:${this.clock.minute}`) < this.script.home.vpnDrop) { h.vpn = 'off'; h.drops++; this.emit('home:vpn', h); }
    }
    deleteConfidential(id) {
      const h = this.home; const i = h ? h.confidential.findIndex(f => f.id === id) : -1;
      if (i < 0) return null;
      h.confidential.splice(i, 1); this.emit('home:files', h);
      return h;
    }
    // 半夜的緊急狀況：到點才看白天有沒有做好（when）。LIME 直接進來；電話會把人吵醒，免打擾的話記成漏接
    emergency(em) {
      const h = this.home; if (!h || this.ended || !em.when(this)) return;
      if (em.kind === 'line') { this.addDoc({ id: `home:${em.id}`, title: em.group || em.from, from: em.from, group: em.group || null, chase: !!em.chase, module: null, origin: 'line', kind: 'chat', text: em.text, sentences: [], subtasks: [] }); return; }
      if (h.asleep && h.dnd) { h.missed.push(em); return; }
      Object.assign(h, { asleep: false, ringing: em }); this.emit('home:call', em);
      // 不接也不掛，響一陣子就斷了，算漏接
      this.clock.at(this.clock.minute + this.script.home.ringMin, () => {
        if (h.ringing !== em) return;
        h.ringing = null; h.missed.push(em); this.emit('home:call:end', em);
      });
    }
    answerCall(accept) {
      const h = this.home, em = h && h.ringing; if (!em) return null;
      h.ringing = null;
      if (!accept) { h.missed.push(em); this.emit('home:call:end', em); return null; }
      h.answered.push(em.id); h.vpn = 'off';   // 接了回到茶几，桌上一張新卡，VPN 要重掛
      const card = em.card ? this.arrive({ ...em.card, assignee: '玩家' }) : null;
      this.emit('home:call:end', em);
      return card;
    }
    // 下班休閒：像開著的視窗，玩家自己關掉才停；電話來了也不停，接不接是玩家的事。開著的時間都算玩
    startPlay(id) {
      const h = this.home; if (!h || h.phase !== 'table' || h.asleep || this.ended || !h.leisure.includes(id) || h.playing[id] != null) return null;
      h.playing[id] = this.clock.minute; this.emit('home:play', { id, playing: true });
      return h;
    }
    stopPlay(id) {
      const h = this.home; if (!h || h.playing[id] == null) return null;
      h.fun[id] = (h.fun[id] || 0) + this.clock.minute - h.playing[id];
      delete h.playing[id]; this.emit('home:play', { id, playing: false });
      return h;
    }
    playedMinutes(id) { const h = this.home; return (h.fun[id] || 0) + (h.playing[id] != null ? this.clock.minute - h.playing[id] : 0); }
    // 洗澡睡覺：快轉到隔天 08:00 結算；電話響了就停下來
    sleep({ dnd = false } = {}) {
      const h = this.home; if (!h || h.phase !== 'table' || h.ringing || this.ended) return null;
      for (const id of Object.keys(h.playing)) this.stopPlay(id);   // 上床了，平板、遊戲機都放下
      Object.assign(h, { asleep: true, dnd, vpn: 'off' }); this.emit('home:sleep', h);
      while (h.asleep && !this.ended) this.clock.spend(1);
      return h;
    }
    // 茶几的結算：左欄的明細（吃了什麼、玩了多久、在家做了幾件、漏接）
    homeTally() {
      const h = this.home, place = Home.MENUS[h.menu][h.channel].place;
      const unresolved = (this.script.home.emergencies || []).filter(em => em.kind === 'line' && this.docs.some(d => d.id === `home:${em.id}`) && em.when(this));
      return [
        `${h.menu === 'dinner' ? '晚餐' : '宵夜'}（${place}）：${Home.describe(h.order)}`,
        ...(h.leisure.length ? [`下班休閒：${Home.describeFun(Object.fromEntries(h.leisure.map(id => [id, this.playedMinutes(id)]))) || `${h.leisure.map(id => Home.LEISURE[id].name).join('、')}擺在桌上，沒碰`}`] : []),
        `回家後做了 ${h.worked} 件公司的事${h.drops ? `，VPN 斷了 ${h.drops} 次` : ''}`,
        ...(!h.confidential.length && h.personalUsed ? ['用私人電腦碰過公司的事，機密檔都刪了'] : []),
        ...h.missed.map(em => `漏接：${hhmm(em.at)} ${em.from}「${em.text}」`),
        ...unresolved.map(em => `${em.from} ${hhmm(em.at)} 的 LIME 還沒處理：「${em.text}」`),
      ];
    }
    // 茶几的成就（右欄）：大胃王／小鳥胃、公私分明／資安稽核重點人物
    homeTraits() {
      const h = this.home, place = Home.MENUS[h.menu][h.channel].place, eats = Home.appetite(h.menu, h.channel, h.order);
      return [
        ...(eats === '大胃王' ? [{ title: '大胃王', text: `把${place}買光了` }] : eats === '小鳥胃' ? [{ title: '小鳥胃', text: '下班幾乎沒吃東西' }] : []),
        ...(h.confidential.length ? [{ title: '資安稽核重點人物', text: `家裡電腦還留著 ${h.confidential.length} 份機密檔` }]
          : h.personalUsed ? [] : [{ title: '公私分明', text: '沒用私人電腦碰公司的事' }]),
      ];
    }
    // 檢閱程式碼兩款小遊戲的結算：每張卡每款最後一次的 hits／misses／誤點／提示／LGTM；提示不扣分只寫一句；
    // 評語照卡的 reviewSays（{ who, hit, miss, trap?: { who, text } }），誤點行銷部要的東西時佩珊多一句
    reviewResults() {
      const out = [];
      for (const card of this.board.cards) for (const work of ['review_front', 'review_back']) {
        const last = [...card.history].reverse().find(h => h.work === work && h.result && h.result.hits);
        if (last) out.push({ card, work, r: last.result });
      }
      return out;
    }
    reviewTally() {
      return this.reviewResults().map(({ card, work, r }) => ({ group: '檢閱程式碼',
        text: `#${card.no} ${work === 'review_front' ? '前端' : '後端'}：${r.skipped ? 'LGTM，什麼都沒標' : `抓到 ${r.hits.length}／${r.max}${r.half.length ? `（${r.half.length} 處原因不對）` : ''}${r.falses.length ? `，誤點 ${r.falses.length}` : ''}${r.hintsUsed ? `，提示 ${r.hintsUsed} 次` : ''}`}` }));
    }
    // 平行宇宙（劇本 parallel）：成品跟需求對不上，客戶卻接受了
    parallelUniverse() { const rule = this.script.parallel; return !!rule && rule.check(this); }
    reviewTraits() {
      const all = this.reviewResults(); if (!all.length) return [];
      const traits = [];
      if (all.every(x => x.r.skipped)) traits.push({ title: '只按 LGTM', text: '檢閱都沒看就過了' });
      if (all.some(x => x.r.falses.some(f => /formatter|縮排|命名/.test(f.why || '')))) traits.push({ title: '挑縮排', text: 'formatter 會處理的事你也挑了' });
      if (all.some(x => x.work === 'review_front' && !x.r.skipped && x.r.misses.length === 0 && x.r.half.length === 0 && x.r.falses.length === 0)) traits.push({ title: '三機都看了', text: '手機、平板、電腦的問題一個不漏' });
      const hints = all.reduce((n, x) => n + (x.r.hintsUsed || 0), 0);
      if (hints) traits.push({ title: '提示', text: `檢閱時按了 ${hints} 次提示——沒關係，看得懂比較重要` });
      return traits;
    }
    // 主卡需求單位的評語（劇本 reviews：{ who, done, undone }）：主卡寫在 cards，或是廠商需求會議散會後才開的（meetings 的 cards）；
    // done 可以是函式，看當天的狀況換一句（例：紅字太多）
    mainCardReviews() {
      const spec = [...(this.script.cards || []), ...(this.script.meetings || []).flatMap(m => m.cards || [])].find(c => c.id === this.script.mainCard);
      const reviews = spec && spec.reviews;
      return reviews && typeof reviews.done === 'function' ? { ...reviews, done: reviews.done(this) } : reviews;
    }
    reviewPeers() {
      const peers = [];
      for (const { card, work, r } of this.reviewResults()) {
        const says = card.reviewSays && card.reviewSays[work]; if (!says) continue;
        const good = !r.skipped && r.misses.length === 0;
        peers.push({ who: says.who, text: good ? says.hit : says.miss });
        if (says.trap && r.falses.some(f => /行銷部/.test(f.why || ''))) peers.push(says.trap);
      }
      return peers;
    }
    report({ forced = false } = {}) {
      const main = this.script.mainCard ? this.board.get(this.script.mainCard) : null;
      const skippedDocs = main
        ? (main.subtasks || []).filter(s => s.work.startsWith('doc_') && !main.done(s.work)).length : 0;
      // 小關卡分數照卡分組（不同卡的「部署 1／1」要分得出來）；同一張卡重做的取最後一次。
      // 只算今天的紀錄：昨天帶來的卡，昨天做的已經寫在昨天的結算卡
      const works = [];
      for (const card of this.board.cards) {
        const byWork = new Map();
        for (const h of card.history) if (h.result && h.result.max && (h.at ?? C.DAY_START_MIN) >= C.DAY_START_MIN) {
          const w = byWork.get(h.work) || { label: Works.label(h.work), times: 0 };
          Object.assign(w, { score: h.result.score, max: h.result.max, times: w.times + 1 }); byWork.set(h.work, w);
        }
        if (byWork.size) works.push({ card: `#${card.no} ${card.title}`, items: [...byWork.values()] });
      }
      const testStyle = main ? Works.testStyle(main.history) : '';
      const fromScript = this.script.report ? this.script.report(this) : {};   // 劇本自己多的行（正式上班每一關不一樣）
      const verdict = Verdict.classify(this.log);
      const report = Verdict.report({
        player: this.player, verdict, handled: this.submitted + this.closedByHand, skippedDocs, works, estimates: this.estimates(),
        unlabeled: { note: this.noteOpened, charged: this.devices.tablet > Works.LOW_BATTERY }, leftAt: this.home ? hhmm(this.home.leftAt) : this.clock.label(),
        extra: [
          ...(main && this.downMinutes(main) ? [`502：${this.downMinutes(main)} 分鐘`] : []),
          `自己開的卡：${this.stats.selfOpened} 張`, `轉給 SA：${this.stats.forwardedToSA} 張`,
          ...(this.stats.toSA ? [`退回 SA：${this.stats.toSA} 次${this.stats.saBounced ? `（被丟回來 ${this.stats.saBounced} 次）` : ''}`] : []),
          ...(this.unclosable ? [`關不掉的卡：${this.unclosable} 張（沒附原始來源）`] : []),
          ...(this.stats.trialFound != null ? [`客戶試用時抓到的問題：${this.stats.trialFound} 個`] : []),
          ...(this.hasChases() ? [`客戶在群組追問：${this.stats.chased || 0} 次`] : []),
          ...(this.ai ? this.aiTally().map(text => ({ text, group: 'AI 同事' })) : []),   // 結算卡上預設摺起來
          ...this.reviewTally(),
          ...(this.home && this.home.phase !== 'menu' ? this.homeTally() : []),
          ...(fromScript.extra || []),
        ],
        traits: [
          ...(main ? [{ title: '測試', text: testStyle }] : []),
          ...this.reviewTraits(),
          ...(this.parallelUniverse() ? this.script.parallel.traits : []),
          ...(this.home && this.home.phase !== 'menu' ? this.homeTraits() : []),
          ...(fromScript.traits || []),
          ...(this.stats.meetingCutoff ? [this.stats.meetingCutoff] : []),
          ...(this.stats.whitewashed ? [{ title: '粉飾太平', text: `事情沒做完，卡先結案了（${this.stats.whitewashed} 張）` }] : []),
          ...(this.script.kind === 'sandbox' && verdict.kind === 'null' ? [{ title: '我就爛', text: '一整天，一張卡都沒打開' }] : []),   // 正式上班可以擺爛
        ],
        peers: [
          ...(main ? Verdict.peerReviews(main, { testStyle, name: this.player.name, flavor: this.mainCardReviews() }) : []),
          ...this.reviewPeers(),
          ...this.userReview(),
          ...(forced ? [{ who: '警衛', text: '「還不回家？要鎖門了。」' }] : []),
          ...(fromScript.peers || []),
        ],
      });
      return report;
    }

    // ── 測試用：自動玩 ──
    // follow_hints：每次提示出現就做提示要的事（照題目的正確答案）；ignore_all：只推時鐘
    autoplay(mode) {
      const step = C.MS_PER_GAME_MIN;
      let guard = 0;
      while (!this.ended && guard++ < 5000) {
        // 下班了：空手回家、帶公司筆電、開免打擾睡到隔天
        if (this.home && this.home.phase === 'menu') this.goHome({ channel: 'pickup', order: {}, laptop: true });
        else if (this.home) this.sleep({ dnd: true });
        else if (mode === 'follow_hints' && this.hint && this.hint.pause !== false) this.follow(this.hint);
        else if (mode === 'follow_hints' && this.canLeave()) this.leave();
        else { if (this.hint) this.dismissHint(); this.tick(step); }
      }
      return this.ended;
    }
    follow(hint) {
      const until = [].concat(hint.until)[0];   // 有好幾個的話照第一個（劇本寫在前面的那條路）做
      const [kind, id, work] = until.split(':');
      if (until === 'board:opened') return this.emit('board:opened');
      if (until === 'note:opened') return this.openNote();
      if (kind === 'card' && id === 'opened') return this.openCard(work);
      if (kind === 'device') return this.charge(work);
      if (kind === 'card' && id === 'submitted') return this.submit(work);
      if (kind === 'card' && id === 'notified') return this.notifyDone(work);
      if (kind === 'meeting') return this.raiseHand(0);
      if (kind === 'ai' && id === 'started') return this.delegate(work, until.split(':')[3]);
      if (kind === 'work') {
        const card = this.board.get(work); const w = until.split(':')[3];
        const sub = this.subtask(card, w);
        // AI 交件了：當作看過一遍、把錯的改掉再送出
        const ready = this.aiRun(card, w);
        const opts = ready ? { by: 'ai', reviewed: true, jobId: ready.id } : {};
        if (sub.question.kind === 'device') {
          const real = Works.deviceTestOptions(this.devices).find(o => o.id === 'real');
          return this.doWork(work, w, [real.disabled ? 'sim' : 'real']);
        }
        if (sub.question.kind === 'manual')
          return this.doWork(work, w, [this.devices.tablet > Works.LOW_BATTERY ? { target: 'tablet' } : { target: 'pc', sim: 'tablet' }]);
        if (sub.question.kind === 'discuss') {
          const unclear = Object.keys(sub.question.asks).map(Number);
          return this.doWork(work, w, { circled: unclear, asks: Object.fromEntries(unclear.map(i => [i, [].concat(sub.question.asks[i]).map(q => q.answer)])) }, opts);
        }
        if (sub.question.kind === 'functions')
          return this.doWork(work, w, sub.question.functions.map(f => Object.fromEntries(Object.entries(f.fields || {}).map(([k, v]) => [k, v.answer]))), opts);
        return this.doWork(work, w, sub.question.items.map(i => i.answer), opts);
      }
      throw new Error(`autoplay 不會處理的提示：${until}`);
    }
  }

  if (typeof module !== 'undefined') module.exports = { Engine };
  else root.Engine = Engine;
})(typeof window !== 'undefined' ? window : globalThis);
