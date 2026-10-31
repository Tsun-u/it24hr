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
    reviewSays: src.reviewSays || null, // 檢閱程式碼的評語（跟著卡走）
    saInstant: !!src.saInstant,         // 轉給怡君秒過（她丟給她的 Claire），不等 90 分鐘
    saVerbatim: !!src.saVerbatim,       // 怡君的 Claire 把原文原封不動搬上卡：噪音句的 function 也得填
    nagEvery: src.nagEvery || 0, nagText: src.nagText || null,   // 沒回就每隔幾分鐘追一則（（已讀）不算回）
  });
  // bug 不用寫規格
  const subtasksFor = (type, doc) => (type === 'bug' ? doc.subtasks.filter(s => s.work !== 'doc_spec') : doc.subtasks);
  const ORIGIN_WORD = { boss: '老闆口頭', mail: '信', line: 'LIME', paper: '紙本' };   // 附件「原文：…（來源）」的字
  // 劇本裡任何一句的 {玩家名稱} 換成玩家取的名字。開工時整份換一次（共用的物件照樣共用，function 不動）
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
      this.player = player;
      this.clock = new Clock();
      this.board = new Board(player.name, script.issueBase);
      this.log = [];                 // 點擊日誌，給 verdict 用
      this.listeners = {};
      this.flags = {};
      this.hint = null;              // 目前顯示的提示
      this.hintQueue = [...(script.hints || [])];
      this.meeting = null;           // 進行中的會議
      this.ended = null;             // { badEnd, reason } 或 { badEnd:false, report }
      this.noteOpened = false;
      this.devices = { ...((script.unlabeled && script.unlabeled.devices) || { phone: 100, tablet: 100 }) };
      this.submitted = 0;
      this.visitor = null;           // 站在桌邊的人（老闆）
      this.papers = [];              // 桌上的紙
      this.docs = [];                // 電腦裡的文件（含信、LINE）
      this.stats = { forwardedToSA: 0, emptyDrafts: 0, selfOpened: 0 };
      this.plugged = new Set();      // 插著充電線的裝置
      this.inUse = new Set();        // 拿起來實機測試中的裝置
      this.drainCarry = {};          // 還不到 1% 的耗電，累積到滿 1 才扣
      // AI 同事（hybrid 之後）：額度、AI 筆記（{ 主題: { stance, text } }，前一天的從 carry 帶進劇本）、交給它幾次
      this.ai = script.ai ? { left: script.ai.quota, max: script.ai.quota, notes: { ...(script.ai.notes || {}) },
        stats: { delegated: 0, unreviewed: 0, reviewed: 0, revised: 0, asked: 0, models: {} } } : null;
      // 自己早上寫的便條也是桌上的一張紙
      if (script.unlabeled && script.unlabeled.note)
        this.papers.push({ id: 'note', title: '便條', from: '自己', module: null, text: script.unlabeled.note, sentences: [], subtasks: [], origin: 'self' });
      if (carried) this.restore(carried);
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
      for (const src of s.sources || []) this.clock.at(C.DAY_START_MIN + src.at, () => { if (due(src)) this.arriveSource(src); });
      for (const m of s.meetings || []) {
        this.clock.at(C.DAY_START_MIN + m.at, () => this.startMeeting(m));
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
      // 追問從 LINE 來，不寫在卡上
      (spec.nags || []).forEach((nag, n) => this.clock.at(this.clock.minute + nag.after, () => {
        if (!card.isOpen) return;
        this.addDoc({ id: `${card.id}:nag:${n}`, title: nag.who, from: nag.who, module: null, origin: 'line', kind: 'nag', cardId: card.id, text: nag.text, sentences: [], subtasks: [] });
      }));
      this.emit('card:arrived', card); this.emit(`card:arrived:${card.id}`, card);
      return card;
    }

    // ── 來源：老闆、信、LINE、紙、文件 ──
    // src.variants：來的時候照當下的狀況挑一個版本（when(engine) 為真的第一個；沒寫 when 的是預設），蓋過來源本身的欄位
    arriveSource(src) {
      if (src.variants) src = { ...src, ...(src.variants.find(v => !v.when || v.when(this)) || {}), variants: undefined };
      if (src.kind === 'boss') {
        this.visitor = src; this.emit('visitor:arrived', src);
        this.clock.at(this.clock.minute + (src.patience || 20), () => { if (this.visitor === src) this.leaveBehindPaper(src); });
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
      if (paper.origin === 'self') { this.noteOpened = true; this.emit('note:opened'); }
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
      if (doc.cardSpec) return this.openFixedCard(doc.cardSpec, draft.assignee === 'sa' ? SA : this.player.name);
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
        id: `${doc.id}:card`, title: doc.title, from: this.player.name, assignee: this.player.name,
        body: draft.attach ? doc.text : '', subtasks: subtasksFor(draft.type, doc),
        type: draft.type, parent: draft.parent || null, relatedTo: doc.relatedTo, screen: doc.screen, reviewSays: doc.reviewSays, onNoBackup: doc.onNoBackup,
      }), this.clock.minute);
      card.draft = { ...draft, ...grade }; card.docId = doc.id;
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
    openFixedCard(cardSpec, from) {
      if (this.board.get(cardSpec.id)) return null;
      for (const d of this.docs) if (d.cardSpec && d.cardSpec.id === cardSpec.id) d.carded = true;
      const card = this.board.add(makeCard({ ...cardSpec, from, assignee: this.player.name }), this.clock.minute);
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
      this.stats.replies = (this.stats.replies || 0) + 1;
      this.emit('doc:replied', doc); this.emit(`doc:replied:${doc.id}`, doc);
      return result;
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
    // 提示出現時時鐘暫停，玩家做了任何動作就恢復；提示本身留著，直到做了它要的事（until）。
    // 劇本 holdHints（第一天，每件工作都是第一次碰到）：照提示找卡、打開那件工作不算動作，時鐘停到做完（holdsHintPause）。
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
      while (!this.hint && this.hintQueue.length && this.skipHint(this.hintQueue[0], event)) this.hintQueue.shift();
      if (!this.hint && this.hintQueue.length && [].concat(this.hintQueue[0].after).includes(event)) {
        this.hint = this.hintQueue.shift();
        if (this.hint.pause !== false) this.clock.pause('hint');
        this.emit('hint', this.hint);
      }
    }
    // 只有提示要玩家做某件工作時才撐住；做了別的事（開別的工作、交 QC、轉給 SA）照舊恢復，提示要的事做不到時才不會卡死
    holdsHintPause(event) {
      if (!this.script.holdHints) return false;
      if (event.startsWith('work:done:*:')) return true;   // 做完的最後一個事件，下一句提示這時已經出來了，不能把它剛停的時鐘放開
      const wanted = [].concat(this.hint.until).filter(e => /^(work:done|card:opened):/.test(e));
      if (!wanted.length) return false;
      if (event === 'work:opened' || event.startsWith('work:opened:*:')) return true;
      if (event.startsWith('work:opened:')) return wanted.includes(event.replace('work:opened', 'work:done'));
      return event.startsWith('card:opened') || event.startsWith('board:opened');
    }
    // 提示上的「已完成」：這句當作過關、時鐘恢復，只推進提示鏈，那件工作沒有真的做；下一句照它自己的條件出現
    completeHint() { if (this.hint) this.checkHints([].concat(this.hint.until)[0]); }
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
    // function 的欄位可以鎖到某份文件到了才開（field.lockedUntil 是文件 id，lockedTo 是鎖著時唯一能選的選項）
    fieldLocked(field) { return !!(field && field.lockedUntil && !this.docs.some(d => d.id === field.lockedUntil)); }
    doWork(id, work, answers = [], opts = {}) {
      const card = this.board.get(id);
      if (!card || !this.board.canOperate(card) || this.ended || !this.online()) return null;
      const sub = this.subtask(card, work);
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
          result = Works.grade(sub.question, answers, { covered: card.draft ? card.draft.covered : 'all', picks: card.picks });
          card.picks[work] = result.picks || answers;   // 玩家在每個工作選了什麼，後面的工作會用（計畫→規格→程式）；檢閱程式碼只留抓到的 fix
          minutes = result.minutes || 0;   // 小關卡進行中時鐘本來就在走，沒另外標分鐘的就不再加
          if (result.missed) card.vague = result.missed.map(i => sub.question.segments[i]);   // 需求討論沒圈到的＝需求不明
          if (work === 'estimate') card.estimate = answers[0] ?? null;
        }
      }
      const by = opts.by === 'ai' ? 'ai' : 'self';
      card.record(work, { minutes, version, at: this.clock.minute, result, by, reviewed: by === 'ai' ? !!opts.reviewed : undefined });
      // 自己做和 AI 做不衝突：手寫不會丟掉 AI 那幾份，它們照樣在終端機等，之後要拿哪份蓋過卡上的版本都行
      const job = by === 'ai' ? this.aiRun(card, work, opts.jobId) : null;
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
        const lines = opts.printed ? [] : this.deployScript(card, roles, order, before);
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
    // ── 交給 AI（hybrid 之後）──
    // 交出去扣一次額度，過一段時間 AI 把同一張答案卡填好（status ready），交件只出現在終端機（ai:ready 事件，畫面不跳通知）。
    // 同一件可以叫它跑好幾次，每次一份、各扣額度、可以同時跑：card.ai[work] 是一串 run（id 就是第幾份）。
    // 每份可以直接交（acceptAi，沒看）或看一下再送出（doWork 帶 by:'ai', reviewed:true, jobId）；看一下時可以退回＝請它改（reviseAi）。
    // speedrun 交給 AI 時自己挑模型（劇本 ai.models：{ 名稱: { label, turnaround, accuracy, cost } }）；沒有 models 的（第二天）用 ai.model 那一個
    aiModel(name) { const ms = this.script.ai && this.script.ai.models; return ms ? ms[name] || null : null; }
    aiPicksModel() { return !!(this.script.ai && this.script.ai.models); }
    aiCost(model) { return (this.aiModel(model) || {}).cost ?? 1; }
    // 額度夠不夠跑這個模型：夠回 null，不夠回說明（Novel 一次要 2 格，只剩 1 格不是「用完了」）
    aiLack(model) {
      const cost = this.aiCost(model), left = this.ai.left;
      if (left >= cost) return null;
      return left <= 0 ? '這個時段的 AI 額度用完了。' : `額度不夠：${this.aiName(model)}一次要 ${cost} 格，現在只剩 ${left} 格。`;
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
      return !!(sub && sub.question && !['manual', 'device', 'terminal'].includes(sub.question.kind));   // 要自己動手的：拿裝置、自己下指令
    }
    delegate(cardId, work, model = null) {
      const card = this.board.get(cardId); const sub = card && this.subtask(card, work);
      if (!this.ai || !this.delegable(card, work) || !this.board.canOperate(card) || this.ended || !this.online()) return null;
      if (this.aiPicksModel() && !this.aiModel(model)) return null;
      if (this.home) this.workedAtHome(card, work);
      if (sub.question.roles && STEPWISE_DEPLOY.includes(this.script.ai.permission))
        return this.startRun(card, work, (seed) => ({ deploy: this.deployPlan(card, sub.question, seed) }), `$ claire --issue ${card.no} --task ${work}`, { model });
      const drives = this.testDrives(card, work);   // 交出去那一刻卡上已經有的測試，AI 照著寫（先寫測試才算數）
      return this.startRun(card, work, (seed) => Works.aiAnswers(sub.question, { ...this.aiCtx(card), accuracy: this.aiAccuracy(model, work), seed, notes: this.ai.notes, drives }),
        `$ claire --issue ${card.no} --task ${work}`, { model });
    }
    // 整組交給 AI（speedrun）：主按鈕底下的子項依序跑，後一份拿前一份的草稿當帶入；已經在卡上的跳過，
    // 還沒交到卡上的舊稿作廢；時間＝單件加總打七折，額度＝單件加總 −1，只剩一份要跑就照單件
    delegateGroup(cardId, groupId, model) {
      const card = this.board.get(cardId); const group = Works.MENU.find(m => m.id === groupId && m.children);
      if (!this.ai || !card || !group || !this.aiModel(model) || !this.board.canOperate(card) || this.ended || !this.online()) return null;
      const works = group.children.map(c => c.id).filter(w => this.delegable(card, w) && !card.done(w));
      if (!works.length) return null;
      if (works.length === 1) { const job = this.delegate(cardId, works[0], model); return job ? [job] : null; }
      const cost = works.length * this.aiCost(model) - 1;
      if (this.ai.left < cost) { this.emit('ai:empty', { card, work: groupId }); return null; }
      if (this.home) this.workedAtHome(card, works[0]);
      for (const w of works) for (const j of (card.ai && card.ai[w]) || []) if (['running', 'asking', 'ready'].includes(j.status)) j.status = 'expired';
      this.ai.left -= cost;
      const drafts = {};
      const ctx = () => { const base = this.aiCtx(card); return { ...base, picks: { ...base.picks, ...drafts }, done: [...new Set([...base.done, ...Object.keys(drafts)])] }; };
      let at = 0;
      return works.map(w => {
        const sub = this.subtask(card, w);
        at += Math.round(this.aiMinutes(card, w, ((card.ai && card.ai[w]) || []).length + 1, model) * C.AI_GROUP_TIME);
        return this.startRun(card, w, (seed) => {
          const now = ctx();
          const out = Works.aiAnswers(sub.question, { ...now, accuracy: this.aiAccuracy(model, w), seed, notes: this.ai.notes, drives: this.testDrives(card, w, now) });
          drafts[w] = out.answers; return out;
        }, `$ claire --issue ${card.no} --task ${groupId}`, { model, cost: 0, minutes: at, group: groupId });
      });
    }
    aiCtx(card) {
      return { covered: card.draft ? card.draft.covered : 'all', picks: card.picks, done: [...new Set(card.history.map(h => h.work))], locked: (field) => this.fieldLocked(field) };
    }
    testDrives(card, work, ctx = this.aiCtx(card)) {
      const test = this.subtask(card, 'test');
      if (work !== 'code' || !test || !ctx.done.includes('test')) return {};
      return Works.testDrives(test.question, ctx.picks && ctx.picks.test, ctx);
    }
    // 一份要做幾分鐘：照模型（沒有就照劇本 ai.turnaround）忽快忽慢，但同一份每次一樣
    aiMinutes(card, work, attempt, model) {
      const [lo, hi] = (this.aiModel(model) || {}).turnaround || this.script.ai.turnaround || [10, 25];
      return lo + Math.floor(Works.aiRoll(`${card.id}:${work}:${attempt}:t`) * (hi - lo + 1));
    }
    // 開一份 AI 的工作：扣額度、記一份 run、時間到用 compute(種子) 填答案卡（AI 做事前先讀筆記，所以筆記看交件那一刻的）
    // opts：model（挑的模型）、cost（扣幾格，整組交辦的子項已經一起扣過了）、minutes（整組交辦算好的交件時間）、group
    startRun(card, work, compute, cmd, { model = null, cost = this.aiCost(model), minutes = null, group = null } = {}) {
      if (cost && this.ai.left < cost) { this.emit('ai:empty', { card, work }); return null; }
      this.ai.left -= cost; this.ai.stats.delegated++;
      if (model) this.ai.stats.models[model] = (this.ai.stats.models[model] || 0) + 1;
      const runs = (card.ai ||= {})[work] ||= [];
      const attempt = runs.length + 1;
      const takes = minutes ?? this.aiMinutes(card, work, attempt, model);
      const job = { id: attempt, status: 'running', attempt, model, group, startedAt: this.clock.minute, doneAt: this.clock.minute + takes, errors: [] };
      runs.push(job); card.log('ai', this.clock.minute, { work });
      this.markActed(card.id);
      const lines = [{ text: cmd, kind: 'cmd' }, { text: `${this.aiName(model)}接手 #${card.no} ${Works.label(work)}（第 ${attempt} 份），預計 ${takes} 分鐘。`, kind: 'out' }];
      this.emit('ai:started', { card, work, job, lines }); this.emit(`ai:started:${card.id}:${work}`, { card, work, job }); this.emit(`ai:started:*:${work}`, { card, work, job });
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
    deployPlan(card, question, seed) {
      const roles = question.roles, item = question.items[0];
      const right = item.answer.map(i => Object.keys(roles).find(r => roles[r] === i));
      // 劇本裡 AI 的排法本來就沒備份的那張一定忘，其他照機率
      const forgot = !item.ai.pick.includes(roles.backup) || Works.aiRoll(`${seed}:backup`) < C.AI_FORGET_BACKUP;
      // CLAIRE.md 有部署 SKILL（「寫 Skill」）：照正確順序一步做到底，不會忘備份、不問、不通知
      const auto = !!this.ai.notes.deploy;
      const steps = auto ? [...right] : [...right.filter(r => !(forgot && r === 'backup')), ...(roles.notify != null ? ['notify'] : [])];
      return { right, steps, at: 0, done: [], choosing: false, auto, ctx: this.deployCtx(card, roles, []) };
    }
    deployOption(card, work, role) { const q = this.subtask(card, work).question; return q.items[0].options[q.roles[role]]; }
    deployNext(card, work, job) {
      const d = job.deploy;
      if (d.auto) {   // 照 CLAIRE.md 的部署流程：每一步直接做，做完交件
        if (!d.done.length) this.emit('ai:deploying', { card, work, job, lines: [{ text: '照 CLAIRE.md 的部署流程做。', kind: 'note' }] });
        while (d.at < d.steps.length) { this.deployDo(card, work, job, d.steps[d.at]); d.at++; }
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
    deployDo(card, work, job, role) {
      const lines = this.deployStep(card, job.deploy.ctx, role);
      job.deploy.done.push(role); card.terminal = [...(card.terminal || []), ...lines];
      this.emit('ai:deploying', { card, work, job, lines });
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
      Object.assign(job, { status: 'running', startedAt: this.clock.minute, doneAt: this.clock.minute + C.AI_ASK_GAP_MIN });
      this.clock.at(job.doneAt, () => { if (job.status === 'running') this.deployNext(card, work, job); });
      return job;
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
      if (this.ai.left < this.aiCost(job.model)) { this.emit('ai:empty', { card, work }); return null; }
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
      this.addDoc({ id: `${card.id}:notified`, title: group || card.requester, from: card.requester, group, module: null, origin: 'line', kind: 'sent', cardId: card.id, text: group ? `#${card.no} ${card.title} 上 POC 了，麻煩登入看看` : `#${card.no} ${card.title} QC 驗過、上線了，可以用了`, sentences: [], subtasks: [] });
      this.sendSticker(card.requester, `${card.id}:notified:re`, 'thumb', group);
      if (group) this.customerTrial(card);
      this.emit('card:notified', card); this.emit(`card:notified:${card.id}`, card);
      return card;
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
      const lines = [...new Set(subs.flatMap(c => [...this.firedLines(c), ...wordyLines(c)]))];
      const who = parent.trialBy || parent.requester;
      const say = (id, text) => this.addDoc({ id: `${parent.id}:trial:${id}`, title: parent.notifyGroup, from: who, group: parent.notifyGroup, module: null, origin: 'line', kind: 'chat', cardId: parent.id, text, sentences: [], subtasks: [] });
      if (parent.trialHello) this.clock.at(this.clock.minute + 10, () => say('hello', parent.trialHello));   // 先登進去說一聲，問題接在後面
      this.stats.trialFound ??= 0;   // 有試用過才上結算卡
      lines.forEach((text, n) => this.clock.at(this.clock.minute + 15 + 3 * n, () => { say(n, text); this.stats.trialFound++; }));
      return lines;
    }
    downMinutes(card) { return (card.downMinutes || 0) + (card.down != null ? this.clock.minute - card.down : 0); }
    // 部署在終端機上長什麼樣（legacy：指令自己打）。照玩家排的順序一步一行指令＋輸出；before 是 AI 中斷前做過的步驟（不再印）。
    // 替換排在上傳前面，替換完接著 curl 就是 502，之後的煙霧測試也是 502；通知那一步不是指令，是 LIME 送出去的一句
    deployScript(card, roles, order, before = []) {
      const byIndex = Object.fromEntries(Object.entries(roles).map(([role, i]) => [i, role]));
      const ctx = this.deployCtx(card, roles, [...before.map(r => roles[r]), ...order]);
      for (const r of before) ctx.ran.add(r);
      const lines = order.flatMap(idx => (byIndex[idx] ? this.deployStep(card, ctx, byIndex[idx]) : []));
      if (!order.length) lines.push({ text: '（什麼都沒做就按了部署）', kind: 'note' });
      lines.push({ text: `# ${this.clock.label()} 部署結束`, kind: 'note' });
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
      if (role === 'migrate') { cmd(`ssh it@${host} ./migrate.sh ${app}`); out('migrated: 1,284 rows'); }
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
      if (this.home) return;   // 阿姿下班了：在家交的卡停在交 QC，隔天早上她才驗（schedule 排補驗）
      // 有部署就排時間驗（上次退件時沒備份的，這次驗加倍久）
      const bounce = this.qcBounce(card); if (bounce) return this.qcReject(card, bounce);
      this.clock.at(this.clock.minute + C.QC_TURNAROUND_MIN * (card.slowQC ? 2 : 1), () => this.qcReview(card));
    }
    // 阿姿一拿到就退的：沒部署（沒東西可驗）、網站 502 中、程式裡還留著 TODO
    qcBounce(card) {
      if (!card.noDeploy && !card.done('deploy')) return '還沒上測試機，我沒東西可以驗。';
      if (card.down != null) return '網站 502，我驗什麼？';
      return this.wordyBounce(card) || this.todoLeft(card);
    }
    // Novel 寫的驗收文件廢話沒刪完就交 QC：阿姿退「請用人話寫」；第一次退的時候她在群組裡也唸一句
    wordyBounce(card) {
      if (!card.wordy.doc_accept) return null;
      if (!this.wordyTold) {
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
    // 防呆沒做的地方（業界前端最大的坑）：自己測不會出事，QC 亂打才會。前端設計那題標了 fails 的選項，
    // 正解裡沒勾的就是 QC 會退的理由；整關沒做＝全漏
    validationGaps(card) {
      const sub = this.subtask(card, 'ui_design'); if (!sub || !sub.question.items) return [];
      const gaps = [];
      sub.question.items.forEach((item, i) => {
        if (!item.fails) return;
        const raw = [].concat((card.picks && card.picks.ui_design && card.picks.ui_design[i]) || []);
        const picked = raw.map(v => (item.alt && v in item.alt) ? item.alt[v] : v);   // 替代解也算做到了
        for (const idx of item.answer) if (!picked.includes(idx) && item.fails[idx]) gaps.push(item.fails[idx]);
        // item.conflicts：兩個都對但只能擇一，兩個都勾程式自己打架（退件理由寫在 conflictFail）
        for (const pair of item.conflicts || []) if (pair.every(v => raw.includes(v))) gaps.push(item.conflictFail);
      });
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
    // QC 只會退你自己沒測出來的 bug；沒做煙霧測試會多翻一個；防呆漏的她亂打就翻出來；都乾淨就結案
    qcReview(card) {
      if (card.status !== 'to_qc' || this.home) return;   // 阿姿也下班了：在家交的卡停在交 QC
      const last = [...card.history].reverse().find(h => h.work === 'code');
      const bugs = ((last && last.result) || {}).bugs || [];
      const remaining = [...new Set(bugs.map(b => b.fn))].filter(fn => !(card.bugsFound || []).includes(fn));
      // 沒拿實機測、被翻出只有實機才看得到的問題：阿姿原本的話後面多問一句（非 IT 的玩家不知道要用實機測）
      const fns = (this.subtask(card, 'code') || { question: {} }).question.functions || [];
      const device = this.deviceGaps(card);
      const deviceMissed = !card.realTested && (device.length > 0 || remaining.some(fn => (fns.find(f => f.name === fn) || {}).device));
      if (card.noSmoke) remaining.push('新增完頁面白掉');
      remaining.push(...this.validationGaps(card), ...device, ...this.entryGaps(card));
      if (remaining.length) return this.qcReject(card, `驗到 ${remaining.length} 個問題：${remaining.join('、')}。退回。${deviceMissed ? '你是不是沒有用開發用手機測過？' : ''}`);
      card.archive(this.clock.minute); this.qcSays(card, '驗過了，進已完成。');
      this.emit('card:closed', card); this.emit(`card:closed:${card.id}`, card);
      // 有部署門檻的卡（POC 母議題）：這張驗過之後門開了就說一聲，提示鏈接得上
      for (const c of this.board.cards) if (c.deployGate && !c.gateOpened && c.deployGate(this)) { c.gateOpened = true; this.emit(`gate:open:${c.id}`, c); }
      this.clock.at(this.clock.minute + 30, () => {
        if (card.notified) return;
        card.unnotified = true;
        this.addDoc({ id: `${card.id}:unnotified:${this.clock.minute}`, title: card.requester, from: card.requester, module: null, origin: 'line', kind: 'nag', cardId: card.id, text: '那個……好了嗎？沒人跟我說。', sentences: [], subtasks: [] });
      });
    }
    qcReject(card, text) {
      if (card.noBackup && card.done('deploy')) { text += '沒備份？那只能等你修。'; card.slowQC = true; }
      card.reject('QC 阿姿', text, this.clock.minute); card.qcRejects = (card.qcRejects || 0) + 1; this.qcSays(card, text);
      this.emit('card:returned', card); this.emit(`card:returned:${card.id}`, card);
    }
    // 阿姿驗完在 LIME 跟你說結果（不然她都沒回）；同部門的同事用 LIME
    qcSays(card, text) {
      this.addDoc({ id: `${card.id}:qc:${this.clock.minute}`, title: 'QC 阿姿', from: 'QC 阿姿', module: null, origin: 'line', kind: 'chat', cardId: card.id,
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
        this.emit('device:drained', name);
      }
      this.clock.at(this.clock.minute + 1, () => this.drain());
    }
    // 手動測試拿起哪台裝置（一次只拿一台）；放下、換去電腦看就沒在用
    useDevice(name) { this.inUse.clear(); if (name in this.devices) this.inUse.add(name); }
    putDownDevices() { this.inUse.clear(); }

    // ── 會議 ──
    // 句子照時間一句一句發出去（畫面做成彈幕飄過）；標 key 的那句飄過時可以舉手。
    // ifSilent：沒舉手的下場，可以是一張卡（id）、一個旗標（flag）、一句話（text）。
    // answered：舉過手的句子 → { at: 回答的時間, reply: 對方有沒有接話 }
    startMeeting(m) { this.meeting = { spec: m, current: null, raised: false, answered: new Map() }; this.emit('meeting:start', m); }
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
      this.meeting = null; this.emit('meeting:end', { spec: m, raised });
    }

    // 用的人對前端的評價：今天所有做出畫面的卡一起看，同一句抱怨只講一次，最多三句；
    // 追加需求的風格跟母議題不一致時，不管前面講了什麼，最後都再加「風格能夠一致會更好」
    userReview() {
      const says = [];
      for (const card of this.board.cards) if (card.screen && card.done('code')) {
        const parent = card.relatedTo && this.board.get(card.relatedTo);
        says.push(...Screen.userVoice(Screen.model(card), parent && parent.screen ? Screen.model(parent) : null));
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
    // 估時沒有對錯：有估時的卡列你估的、實際（卡片第一筆紀錄到最後一次交 QC，不交 QC 的卡算到結案，跨夜也算）、主管看兩者差多少的一句，
    // 再附劇本寫的參考：這張卡在現實中純手工、有 AI 幫忙大約多久（item.real）。還沒完成的沒有實際，主管也不評
    estimates() {
      return this.board.cards.filter(k => k.estimate != null && this.subtask(k, 'estimate')).map(k => {
        const item = this.subtask(k, 'estimate').question.items[0];
        const submitted = k.events.filter(ev => ev.kind === 'submit').at(-1);
        const spent = k.closedAt == null ? null : (submitted ? submitted.at : k.closedAt) - k.timeline().find(r => r.at != null).at;
        return { card: `#${k.no} ${k.title}`, yours: `${k.estimate} 小時`, real: item.real || null,
          actual: spent == null ? '還沒完成' : Verdict.duration(spent),
          boss: spent == null ? null : Verdict.estimateComment(k.estimate, spent) };
      });
    }
    // ── 下班 ──
    canLeave() { return !this.ended && !this.home && this.clock.minute >= C.OFF_WORK_MIN; }
    // 離開公司就是進茶几：劇本寫了 home 的天先停在下班選單，隔天 08:00 才結算；沒寫的天照舊直接結算
    leave({ forced = false } = {}) {
      if (this.ended || this.home) return null;
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
      const report = Verdict.report({
        player: this.player, verdict: Verdict.classify(this.log), handled: this.submitted, skippedDocs, works, estimates: this.estimates(),
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
        ],
        traits: [
          ...(main ? [{ title: '測試', text: testStyle }] : []),
          ...this.reviewTraits(),
          ...(this.home && this.home.phase !== 'menu' ? this.homeTraits() : []),
        ],
        peers: [
          ...(main ? Verdict.peerReviews(main, {
            testStyle, name: this.player.name,
            flavor: ((this.script.cards || []).find(c => c.id === this.script.mainCard) || {}).reviews,
          }) : []),
          ...this.reviewPeers(),
          ...this.userReview(),
          ...(forced ? [{ who: '警衛', text: '「還不回家？要鎖門了。」' }] : []),
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
