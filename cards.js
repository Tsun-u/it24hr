// cards.js — 卡片與看板的模型。純邏輯，不碰畫面。
// 卡片像 Redmine 的 issue：內文、附件、負責人、估時、實際工時、歷史、留言。
// 每張卡的標籤都是 Priority，永遠一樣。
(function (root) {
  const { C } = typeof require === 'function' ? require('./contract.js') : root;

  class Card {
    constructor(spec) {
      this.id = spec.id;
      this.title = spec.title;
      this.body = spec.body || '';
      this.attachments = spec.attachments || [];
      this.assignee = spec.assignee;
      this.from = spec.from || '';
      this.requester = spec.requester || this.from;   // 需求單位：通知、追問找的人（SA 開的卡 from 是 SA，需求單位另寫）
      this.no = spec.no ?? null;                // 議題編號，進看板時發（Board.add）
      this.type = spec.type || 'feature';       // feature／addon（追加需求）／bug
      this.parent = spec.parent || null;        // 追加需求掛在哪張卡底下（卡的 id，玩家開卡時選的）
      this.relatedTo = spec.relatedTo || null;  // 這張其實是哪張卡的追加需求（來源決定，跟玩家掛在哪無關）
      this.screen = spec.screen || null;        // 成品畫面的規格（screen.js 用）：{ app, fields, rows, bugs }
      this.deviceBugs = spec.deviceBugs || [];  // 只有實機測得出來的 bug：[{ text }]
      this.noDeploy = !!spec.noDeploy;          // 不用部署也能交 QC（例如資料補救）
      this.noQC = !!spec.noQC;                  // 不交 QC：部署完直接進已完成（第三天的 POC 母議題，子議題驗過視同驗過）
      this.closeWith = spec.closeWith || null;  // 'children'：母議題不交 QC，底下的子議題都結案它就跟著結案（engine.closeParentOf）
      this.mustEstimate = !!spec.mustEstimate;   // 一整天都沒估時，結算卡估時表照樣列出、主管說一句（沒標的卡沒估就不列）
      this.closeOn = spec.closeOn || null;      // 做完這個工作就結案（沒部署、沒 QC 的卡，例如看小潘的 PR）
      this.reviewFires = spec.reviewFires || null;   // 檢閱放水的代價：{ work: { at, miss } }，那個時間需求者在 LIME 說那句
      this.deployTarget = spec.deployTarget || 'test';   // 部署到哪：test（測試機）／poc（客戶的 POC 環境）
      this.deployGate = spec.deployGate || null; // (engine) => 能不能部署；gateText 是反灰時滑上去的那句
      this.gateText = spec.gateText || '';
      this.reviewer = spec.reviewer || null;   // 誰驗這張卡：{ who, pass? }（沒寫就是 QC 阿姿；例：檢討報告給 IT 經理看），pass 是驗過時那句
      this.notifyGroup = spec.notifyGroup || null;   // 「通知需求單位」發到哪個 LIME 群組（沒有就私訊 requester）
      this.notifyText = spec.notifyText || null;   // 「通知需求單位」那則的內容（沒寫就是「QC 驗過、上線了，可以用了」）
      this.trialBy = spec.trialBy || null;   // 通知群組後是誰來試用、在群組裡講子議題留下的問題（沒寫就是 requester）
      this.nextRound = !!spec.nextRound;     // 排進下一版，這輪不用做（客戶回饋開的新卡）
      this.trialHello = spec.trialHello || null;   // 試用的人登進去後先說的那句（10 分鐘後）；沒寫就不說
      this.wordy = {};   // 哪幾件文件還留著 Novel 寫的廢話（{ doc_accept: ['…', …] }，刪完是 false）；交 QC 會被退、交給客戶會被唸
      this.wordyFires = spec.wordyFires || null;   // 廢話沒刪完就交給客戶的文件，試用的人在群組說的話（{ doc_spec: '…' }）
      this.reviewSays = spec.reviewSays || null;   // 檢閱程式碼的評語：{ review_front: { who, hit, miss, trap? }, review_back: {…} }
      this.noReject = spec.noReject || null;    // 退回 SA 會被馬上退回來，這是怡君的那句話
      this.onNoBackup = spec.onNoBackup || null;  // 部署沒備份會出的事（engine.loseData）
      this.saChecks = spec.saChecks || null;    // 退回 SA 的勾選題：[{ title, options: [{ text, right, adds?, replaces?, claim?, asked?, why? }] }]
      this.estimate = spec.estimate ?? null;    // 玩家估的時間（小時）
      this.subtasks = spec.subtasks || [];      // [{ work, question }]
      this.routes = spec.routes || null;        // 卡上選路（接手或重來）：[{ subtasks }, …]，選了哪條，卡的工作換成那條的（engine.chooseRoute）
      this.route = null;                        // 選了第幾條路
      this.migrate = spec.migrate || null;      // 部署的資料轉換有轉不過去的舊資料：{ rows, left, sample }（engine.deployStep 印；第一次轉時一筆一分鐘對回去）
      this.reconciled = false;                  // 轉不過去的那幾筆對過了沒
      this.tag = C.PRIORITY;
      this.status = 'new';
      this.history = [];                        // [{ work, minutes, version, at }]
      this.comments = [];                       // [{ kind, who, text, at }]
      this.actualMin = 0;
      this.arrivedAt = null;
      this.closedAt = null;                     // QC 驗過、進已完成
      this.events = [];                         // 交給 AI、交 QC、結案這類動作：[{ kind, at, work? }]
    }
    log(kind, at, extra = {}) { this.events.push({ kind, at, ...extra }); }
    // 卡片的紀錄（畫面上的「紀錄」區）：做了的工作、留言、動作，照時間排；type 是留言或動作的種類
    timeline() {
      return [...this.history.map(x => ({ ...x, kind: 'work' })),
              ...this.comments.filter(c => c.kind !== 'note').map(c => ({ ...c, kind: 'comment', type: c.kind })),
              ...this.events.map(e => ({ ...e, kind: 'event', type: e.kind }))].sort((a, b) => (a.at || 0) - (b.at || 0));
    }
    // by：'ai' 是交給 AI 的（reviewed 記玩家送出前有沒有看過）
    // aiJob：收下 AI 那份時記 { group：哪一批交辦（'oneshot' 是整張交給 Pedia）, untouched：照它交的原樣收下 }
    record(work, { minutes = 0, version, at = null, result, by = 'self', reviewed, aiJob } = {}) {
      this.history.push({ work, minutes, version, at, result, by, reviewed, aiJob });
      this.actualMin += minutes;
      if (this.status === 'new') this.status = 'open';
    }
    latest(work) {
      for (let i = this.history.length - 1; i >= 0; i--) if (this.history[i].work === work) return this.history[i].version;
      return undefined;
    }
    done(work) { return this.history.some(h => h.work === work); }
    submit(at = null) { this.status = 'to_qc'; this.log('submit', at); }
    reject(who, text, at = null) { this.status = 'returned'; this.comments.push({ kind: 'reject', who, text, at }); }
    rejectToSA(text, at = null) { this.status = 'rejected_to_sa'; this.comments.push({ kind: 'to_sa', who: this.assignee, text, at }); }
    nag(who, text, at = null) { this.comments.push({ kind: 'nag', who, text, at }); }
    archive(at = null) { this.status = 'archived'; this.closedAt = at; this.log('closed', at); }
    get isOpen() { return this.status === 'new' || this.status === 'open' || this.status === 'returned'; }
  }

  // 存檔裡的卡（JSON）還原成 Card；shift 是時間要平移幾分鐘（帶到隔天＝-1440，昨天的事變成負的分鐘）
  Card.restore = function (data, shift = 0) {
    const card = Object.assign(new Card(data), data);
    const move = (t) => (t == null ? t : t + shift);
    for (const key of ['arrivedAt', 'closedAt', 'down']) card[key] = move(card[key]);
    for (const list of [card.history, card.comments, card.events]) for (const x of list) x.at = move(x.at);
    for (const c of Object.values(card.claims || {})) c.at = move(c.at);
    for (const runs of Object.values(card.ai || {})) for (const job of runs) { job.startedAt = move(job.startedAt); job.doneAt = move(job.doneAt); }
    return card;
  };

  function makeCard(spec) { return new Card(spec); }

  class Board {
    // issueBase：這家公司的看板已經開到幾號了，新卡從下一號開始發（每個時代起始號不同，編號本身就在講公司的年紀）
    constructor(player, issueBase = 100) { this.player = player; this.cards = []; this.nextNo = issueBase + 1; }
    add(card, minute = null) { card.arrivedAt = minute; if (card.no == null) card.no = this.nextNo++; this.cards.push(card); return card; }
    label(id) { const k = this.get(id); return k ? `#${k.no}` : `#?`; }
    get(id) { return this.cards.find(k => k.id === id); }
    // 只有在自己手上的卡能動（新需求、處理中、被 QC 退回）；交 QC、退回 SA 的時候卡在別人那邊
    canOperate(card) { return card.assignee === this.player && card.isOpen; }
    openOrder() {
      return this.cards.filter(k => k.isOpen && k.assignee === this.player)
        .sort((a, b) => a.arrivedAt - b.arrivedAt);
    }
    positionOf(id) {
      const order = this.openOrder(); const i = order.findIndex(k => k.id === id);
      if (i < 0) return null;
      if (order.length === 1) return 'only';
      if (i === order.length - 1) return 'newest';
      if (i === 0) return 'oldest';
      return 'middle';
    }
    columns() {
      const cols = {}; for (const s of C.CARD_STATUS) cols[s] = [];
      for (const k of this.cards) cols[k.status].push(k);
      return cols;
    }
  }

  if (typeof module !== 'undefined') module.exports = { Card, makeCard, Board };
  else Object.assign(root, { Card, makeCard, Board });
})(typeof window !== 'undefined' ? window : globalThis);
