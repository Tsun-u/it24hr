// works.js — 核心工作小關卡的題目格式與計分。純邏輯，畫面只負責顯示題目和收答案。
//
// 一題：{ work, minutes, items: [{ text, type?, options, answer, heuristic?, why? }] }
//   type 省略＝單選（answer 是索引）；answer 是陣列且 type 省略＝多選；type:'order'＝排序
//   heuristic 只有前端設計用：Nielsen 十原則的第幾條，答錯就記成違反
// 答案：每題一個值，單選是索引、多選與排序是索引陣列。
// 計分：{ score, max, minutes, wrong: [題號], violated: [heuristic] }
(function (root) {
  // 每種核心工作的預設說明（口氣：工作、帶一點厭世）。劇本的小關卡沒自己寫 intro 就用這裡的
  const INTROS = {
    read_req: '每天看同事的需求就像在做閱讀測驗，而且同事不是職業作家。總之先把需求畫成重點，等等才知道要做什麼。',
    discuss: '每一個「我以為你知道」都會在幾天之後變成「我們沒默契」，不如現在就講開來。',
    estimate: '老闆等一下一定會問要多久。估少了之後你會有麻煩，估多了之後會被找麻煩。',
    ui_design: '介面再美，只要有使用者卡住就會變成迷宮花園。',
    doc_plan: '雖然計畫趕不上變化，但沒有開發計畫的程式會千變萬化到讓人害怕。',
    doc_spec: '寫給之後接手的人和 QC 看。對了，之後接手的人就是三個月後的自己。',
    code: '規格有寫的，翻譯成程式語言就好；沒寫的，靠你的記憶和運氣了。',
    test: '其實不測不會怎麼樣，頂多上線那天會有最堅強的測試團隊打電話照三餐問候你。',
    device_test: '框架內建的 RWD 是世界上最美的謊言。',
    manual_test: '堅持手工是一種職人精神，框架內建的 RWD 是世界上最美的謊言。',
    review_back: '這程式碼是誰寫的？實在是——等等，這個 Author Name 好眼熟……',
    review_front: '三台都開給你看了，使用者不會跟你說哪裡按不到，他們只會把畫面關起來留負評。',
    debug: '錯誤不會因為你的無視就消失，它會潛藏在程式角落的陰影裡等著反撲。',
    deploy: '系統 502 的時間多長，取決於你要花多少時間把步驟做對。',
    doc_accept: '你寫得越清楚，QC 退你的時候寫得也越清楚。',
    reply: '已讀不回也是一種回覆，只是通常不是對方想要的那種。',
  };
  const LABELS = {
    read_req: '整理需求', discuss: '需求討論', estimate: '估時', ui_design: '前端設計',
    code: '開發', test: '寫測試程式', device_test: '跨裝置測試', manual_test: '手動測試', review_front: '檢閱程式碼（前端）', review_back: '檢閱程式碼（後端）',
    debug: 'Debug', deploy: '部署', doc_plan: '開發計畫文件', doc_spec: '開發規格文件',
    doc_accept: '驗收文件', reply: '回訊息', reject: '退回 SA',
    report: '寫檢討報告', dig: '嘗試找舊資料', restore: '手動補救',
  };

  // 卡片介面的核心操作列：有 children 的是子選單
  // 驗收文件也是文件；開發分測試程式、程式本體；檢閱程式碼分前端、後端（第三天才有）；手動測試獨立一顆
  const MENU = [
    { id: 'read_req' }, { id: 'discuss' }, { id: 'estimate' }, { id: 'ui_design' },
    { id: 'docs', label: '文件', children: [{ id: 'doc_plan', short: '計畫' }, { id: 'doc_spec', short: '規格' }, { id: 'doc_accept', short: '驗收' }] },   // short：手機版的按鈕字，上層已經寫了文件
    { id: 'dev', label: '開發', children: [{ id: 'test', label: '測試程式' }, { id: 'code', label: '程式本體' }] },
    { id: 'reviews', label: '檢閱程式碼', children: [{ id: 'review_front', label: '前端' }, { id: 'review_back', label: '後端' }] },
    { id: 'manual_test' },
    { id: 'deploy' },
  ];

  const same = (a, b) => a.length === b.length && a.every((v, i) => v === b[i]);
  const sorted = (a) => [...a].sort((x, y) => x - y);

  // 前面某個工作第 when.item 題選了什麼（需求討論是 picks.discuss.asks[段][sub]）
  function pickedIn(picks, work, when) {
    const p = picks && picks[work]; if (!p) return [];
    if (p.asks) { const got = [].concat(p.asks[when.item] ?? []); return when.sub === undefined ? got : [got[when.sub]]; }
    return [].concat(p[when.item] ?? []);
  }
  // 條件可以是一串：其中一個成立就算（例如財務那項：需求討論問到，或怡君退回時問回來）
  const met = (picks, cond) => [].concat(cond).some(c => pickedIn(picks, c.work, c).includes(c.picked));
  // item.given：前面某個工作做過了（而且 when 那題選了 picked），這幾個選項從它的文件帶進來、勾好鎖住。
  // 規則是一條或一串 { work, options, when?: { item, sub?, picked } }；done(work) 回答那件工作做了沒。文件往後流跟誰寫無關，AI 寫的也帶
  function givenOptions(item, picks, done) {
    const out = [];
    for (const rule of [].concat(item.given || [])) {
      if (!done(rule.work) || (rule.when && !met(picks, { work: rule.work, ...rule.when }))) continue;
      out.push(...rule.options);
    }
    return [...new Set(out)];
  }
  // item.showIf：{ 選項: 條件 }——條件沒達成的選項看不到、也不算在正解裡（例如需求討論有問到財務那段，驗收才會多出「財務只看得到簽核過的」）
  // item.hideIf：{ 選項: 條件 }——反過來，條件達成就收掉（例如退回 SA 指出 R4 是 AI 加的，怡君刪掉後文件裡那項跟著消失）
  function hiddenOptions(item, picks) {
    const notShown = Object.entries(item.showIf || {}).filter(([, cond]) => !met(picks, cond));
    const gone = Object.entries(item.hideIf || {}).filter(([, cond]) => met(picks, cond));
    return [...notShown, ...gone].map(([i]) => Number(i));
  }
  // 看得到的題目：還看不到的選項從正解拿掉，也從 AI 會勾的清單拿掉（AI 答對、退回時自動那句、照說法重做都用這個，
  // 不然會把看不到的選項塞回去、算成多勾）。AI 的清單拿掉後跟正解一樣就當它沒得錯——卡上已經沒有那條，它也不會憑空加回來
  function visibleItem(item, picks) {
    const hidden = hiddenOptions(item, picks);
    if (!hidden.length) return item;
    const keep = (v) => (Array.isArray(v) ? v.filter(x => !hidden.includes(x)) : v);
    const answer = keep(item.answer);
    let ai = item.ai;
    if (ai && 'pick' in ai) {
      const pick = keep(ai.pick);
      const want = [].concat(answer);
      const same = Array.isArray(pick) ? pick.length === want.length && pick.every(v => want.includes(v)) : hidden.includes(pick) || pick === answer;
      ai = same ? undefined : { ...ai, pick };
    }
    return { ...item, answer, ai };
  }
  // f.onlyIf：前面某題選了某個選項才有這個 function（例如前端設計勾了報表頁，開發多三個 function）
  const activeFunction = (f, picks) => !f.onlyIf || met(picks, f.onlyIf);

  // 多選：漏選照比例扣，多勾了最多拿一半
  // item.alt：{ 選項: 它頂替的正解 }——勾了替代解算答到那一項，不算多勾（例如日期照格式打 vs 自動轉，兩種都對）
  // item.bonus：加分項，勾了不算多勾（例如報表頁：勾了主任和財務會覺得方便，但開發多做三個 function）
  function pickedRatio(item, answer, hidden) {
    const alt = item.alt || {}, bonus = item.bonus || [];
    const want = new Set(item.answer.filter(v => !hidden.includes(v)));
    const got = new Set([].concat(answer).map(v => (v in alt ? alt[v] : v)).filter(v => !bonus.includes(v)));
    const hit = [...want].filter(v => got.has(v)).length;
    const extra = [...got].filter(v => !want.has(v)).length;
    if (extra > 0) return Math.min(hit / want.size, 0.5);
    return hit / want.size;
  }
  // 排序題寫了 item.before（[[先, 後], …]，只列真的有先後關係的兩步）：挑對步驟照多選算一半，先後關係排對幾條算另一半，
  // 兩步都有排、而且先的在前面，那條才算排對（開發計畫：匯出和手機版誰先都行，資料表一定在功能前面）。
  // 沒有先後條件的排序題全對才給分
  function orderRatio(item, answer, hidden) {
    if (!item.before || !item.before.length) return same(answer, item.answer) ? 1 : 0;
    const at = (step) => answer.indexOf(step);
    const kept = item.before.filter(([first, then]) => at(first) >= 0 && at(then) >= 0 && at(first) < at(then)).length;
    return (pickedRatio(item, answer, hidden) + kept / item.before.length) / 2;
  }

  // 部署題的先後關係由 roles 推：備份要在動到線上的步驟（替換、資料轉換、匯入資料）之前、上傳在替換和匯入之前、
  // 驗證在這些步驟之後；備份排在上傳前或上傳後都對（上傳是傳到新資料夾，線上還沒動）
  const DEPLOY_ORDER = [['backup', 'replace'], ['backup', 'migrate'], ['backup', 'seed'], ['upload', 'replace'], ['upload', 'seed'], ['replace', 'smoke'], ['migrate', 'smoke'], ['seed', 'smoke']];
  function deployBefore(roles) {
    return DEPLOY_ORDER.filter(([first, then]) => first in roles && then in roles).map(([first, then]) => [roles[first], roles[then]]);
  }
  const withDeployOrder = (question, item) =>
    (question.roles && item.type === 'order' && !item.before ? { ...item, before: deployBefore(question.roles) } : item);

  function gradeItem(item, answer, hidden = []) {
    if (answer === undefined || answer === null) return 0;
    if (item.type === 'order') return orderRatio(item, answer, hidden);
    if (Array.isArray(item.answer)) return pickedRatio(item, answer, hidden);
    if (item.accept) return item.accept.includes(answer) ? 1 : 0;   // 單選但有好幾個答案都算對
    return answer === item.answer ? 1 : 0;
  }

  // kind:'functions'：開發小關卡，用 function 當單位。預填（直接拉進 IDE、不用填）要兩關都過：
  // ① 卡上有那句需求（sentence；covered 為 'all' 代表 SA 開的卡或劇本卡，全部算有寫）——卡上沒寫，IT 不會通靈；
  // ② 有文件撐著：f.needs = { work, picked }（開發靠開發計畫排了那一步、測試靠驗收寫了那個案例）或 f.spec（開發規格寫了那一項），其中一份寫到就算。
  // 只有 sentence 的 function 是需求簡單、卡片本身就是文件的卡，只看第一關；兩種都沒標的是文件寫不到的，一律自己填。judgment 是 AI 的主張，永遠要填
  function functionsToFill(question, covered = 'all', picks = null) {
    const inDoc = (work, picked) => [].concat((picks && picks[work] && picks[work][0]) || []).includes(picked);
    const documented = (f) => !!f.needs || f.spec !== undefined;
    const backed = (f) => !documented(f) || (f.needs && inDoc(f.needs.work, f.needs.picked)) || (f.spec !== undefined && inDoc('doc_spec', f.spec));
    const stated = (f) => f.sentence === undefined ? documented(f) : (covered === 'all' || covered.includes(f.sentence));
    // f.carried：前一天的規格寫過（第二天的劇本照第一天的選擇標），直接拉進來
    // f.ifStated：噪音句的 function（AI 寫的報告裡的修辭）——那句被挑上卡才出現、而且要自己填：挑太多句子的代價
    return question.functions
      .map((f, i) => activeFunction(f, picks) && (f.ifStated ? stated(f) : (f.judgment || (!f.carried && (!backed(f) || !stated(f))))) ? i : -1)
      .filter(i => i >= 0);
  }
  // 測試程式管哪個開發 function：f.drives = { fn, field, map: { 測試選項: 開發選項 } }。卡上的測試選了什麼，AI 開發就照著讓它過
  // （AI 照先寫好的測試開發，測試沒過就是紅燈它會想辦法變綠）；選的那項沒對應＝測試太鬆，不約束。預填的測試算選正解
  function testDrives(question, answers, { covered = 'all', picks = null } = {}) {
    const out = {};
    if (!question || question.kind !== 'functions') return out;
    const toFill = functionsToFill(question, covered, picks);
    question.functions.forEach((f, i) => {
      if (!f.drives) return;
      const [key, field] = Object.entries(f.fields)[0];
      const picked = toFill.includes(i) ? ((answers && answers[i]) || {})[key] : field.answer;
      const to = f.drives.map[picked];
      if (to !== undefined) (out[f.drives.fn] ||= {})[f.drives.field] = to;
    });
    return out;
  }

  // LIME 泡泡本身就是對話：選項和台詞整句包著「」時，泡泡裡拿掉引號，句號留著，引號裡外都有標點才收成一個；句子中間引用的話照舊
  const chatText = (text) => {
    const m = /^「([^「」]*)」(。?)$/.exec(text);
    if (!m) return text;
    return /[。？！…～]$/.test(m[1]) ? m[1] : m[1] + m[2];
  };

  // 做完一件事在卡上留的筆記（像 Redmine note，記錄人是玩家自己）：把選了什麼用人話寫下來
  function summarize(question, answers, result) {
    if (question.kind === 'manual') return result && result.nullException ? '手動測試：對著空氣測了一下。' : `手動測試：${(result && result.version) || '沒做任何操作'}。`;
    if (question.kind === 'spot' || question.kind === 'diff') {
      if (!result) return '檢閱程式碼。';
      if (result.skipped) return '檢閱程式碼：LGTM，什麼都沒標。';
      const got = [...result.hits, ...result.half].map(t => t.text).join('、');
      return `檢閱程式碼：標了 ${result.hits.length + result.half.length} 處${got ? `（${got}）` : ''}${result.falses.length ? `，另外 ${result.falses.length} 處不用改也標了` : ''}${result.hintsUsed ? `，看了 ${result.hintsUsed} 次提示` : ''}。`;
    }
    if (question.kind === 'discuss') {
      const a = answers || {};
      const asked = Object.entries(a.asks || {}).flatMap(([i, js]) => [].concat(js).map((j, k) => {
        const ask = askList(question, i)[k]; if (!ask || j === undefined || ask.options[j] === undefined) return null;
        return `${ask.options[j]}${ask.replies && ask.replies[j] ? `→${ask.replies[j]}` : ''}`;
      })).filter(Boolean);
      return `圈了 ${(a.circled || []).length} 處。${asked.length ? `問了：${asked.join('；')}` : '沒問什麼。'}`;
    }
    if (question.kind === 'functions') {
      const fill = (result && result.toFill) || [];
      const wrote = question.functions.filter((f, i) => fill.includes(i)).map(f => f.name);
      const pulled = question.functions.filter((f, i) => !fill.includes(i)).map(f => f.name);
      return `${wrote.length ? `寫了 ${wrote.join('、')}` : '沒有要自己寫的'}${pulled.length ? `；${pulled.join('、')} 從文件拉進來` : ''}。`;
    }
    if (question.kind === 'device') return `跨裝置測試：${answers && answers[0] === 'real' ? '實機' : 'PC 模擬'}。`;
    if (question.kind === 'terminal') return `在終端機跑了 ${[...new Set([].concat(answers || []))].length} 個指令${result && result.done ? '，該查的都查了' : '，還沒查完'}。`;
    if (question.kind === 'entry') return result ? `補了 ${question.records.length} 筆：${result.wrongText} 筆字不對、${result.wrongPhoto} 筆照片沒對上。` : '補資料。';
    const parts = (question.items || []).map((item, i) => {
      const a = answers && answers[i]; if (a == null || (Array.isArray(a) && !a.length)) return null;
      const val = optText(item, a);
      return item.text.includes('____') ? item.text.replace('____', `［${val}］`) : `${item.text.replace(/[：:]$/, '')}：${val}`;
    }).filter(Boolean);
    return parts.length ? `${parts.join('；')}。` : '做完了。';
  }

  // 測試的寫法不問玩家，從時間推：測試程式寫在程式之前＝先寫測試、之後＝邊開發邊寫、只手動＝人工測
  function testStyle(history) {
    const first = (work) => history.findIndex(h => h.work === work);
    const code = first('code'), test = first('test'), manual = first('manual_test');
    if (test >= 0 && (code < 0 || test < code)) return '先寫測試再寫程式';
    if (test >= 0) return '邊開發邊寫測試';
    if (manual >= 0) return '不寫測試，做完人工測';
    return '沒測';
  }
  // 答案：每個 function 一個物件 { 欄位: 選項索引 }；填錯的欄位是 bug，之後 QC 會抓
  function gradeFunctions(question, answers, ctx) {
    const toFill = functionsToFill(question, ctx.covered, ctx.picks);
    let score = 0, max = 0; const bugs = [];
    for (const i of toFill) {
      const f = question.functions[i], a = (answers && answers[i]) || {};
      for (const [key, field] of Object.entries(f.fields || {})) { max++; if (a[key] === field.answer) score++; else bugs.push({ fn: f.name, field: key }); }
    }
    return { score, max, minutes: question.minutes, wrong: bugs.map(b => b.fn), bugs, toFill, violated: [], choices: {} };
  }

  // kind:'discuss'：需求討論。segments 是對方的原話切段，asks 標哪幾段講不清楚、圈起來要問什麼。
  // 答案 { circled: [段索引], asks: { 段索引: 選項索引 } }。沒圈到的講不清楚處記在 missed（之後變成需求不明），不提示玩家
  // asks[i] 可以是一題或一串題（一段原話要問好幾件事）；答案 asks[i] 對應是一個索引或一串索引
  const askList = (question, i) => [].concat(question.asks[i]);
  function gradeDiscuss(question, answers) {
    const circled = (answers && answers.circled) || [], asked = (answers && answers.asks) || {};
    const unclear = Object.keys(question.asks).map(Number);
    let score = 0, max = 0; const wrong = [];
    for (const i of unclear) {
      const list = askList(question, i), got = [].concat(asked[i] ?? []);
      let ok = true;
      list.forEach((q, k) => { max++; if (circled.includes(i) && got[k] === q.answer) score++; else ok = false; });
      if (!ok) wrong.push(i);
    }
    const missed = unclear.filter(i => !circled.includes(i));
    const overAsked = circled.filter(i => !unclear.includes(i));
    return { score, max, minutes: question.minutes, wrong, missed, overAsked, violated: [], choices: {} };
  }

  // ── 交給 AI：AI 把同一張答案卡填好，玩家 review ──
  // AI 錯在哪寫在劇本：item.ai / field.ai = { pick, kind }，pick 是它錯的時候會選的、kind 是錯在哪一類（給寫劇本的人看）。
  // 錯不錯照種子決定（同一個種子永遠一樣）；judgment 的 function 它一律填自己的主張；需求討論它全圈、每題都選最客氣的那個（ask.polite，預設最後一個）。
  // AI 筆記：notes = { 主題: 做法 }（或 { stance, text }），選項標 tags = { 選項: '主題:做法' }。
  // AI 填完先套筆記：單選挑標了那做法的選項、多選只留做法相符的、做法是 skip（「以後我不碰」）就留白擺爛
  function aiRoll(seed) {   // FNV-1a 雜湊＋murmur3 的收尾攪拌 → 0～1（只差最後一個字的種子也要分得開）
    let x = 0x811c9dc5;
    for (const ch of String(seed)) { x ^= ch.codePointAt(0); x = Math.imul(x, 0x01000193) >>> 0; }
    x ^= x >>> 16; x = Math.imul(x, 0x85ebca6b) >>> 0; x ^= x >>> 13; x = Math.imul(x, 0xc2b2ae35) >>> 0; x ^= x >>> 16;
    return (x >>> 0) / 0x100000000;
  }
  // done：卡上做過的工作（前面文件帶進來的，AI 寫的文件也帶）；drives：卡上先寫好的測試要它怎麼寫（testDrives），比筆記和主張都優先；
  // locked(field)：欄位還鎖著（等的文件沒來），只能填 lockedTo——AI 也一樣，資料沒來它也只能寫 TODO
  const lockedFields = (f, locked) => Object.fromEntries(Object.entries(f.fields || {}).filter(([, field]) => locked(field)).map(([key, field]) => [key, field.lockedTo]));
  function aiAnswers(question, { covered = 'all', picks = null, accuracy = 0.5, seed = '', notes = {}, done = [], drives = {}, locked = () => false } = {}) {
    if (!question || ['manual', 'device', 'terminal'].includes(question.kind)) return null;   // 要自己動手的
    const errors = [];
    // 資料登打交給 AI：字都打好了，但照片漏放
    if (question.kind === 'entry') return { answers: question.records.map(r => ({ name: r.name, owner: r.owner, photo: null })), errors: ['miss'] };
    // 檢閱交給 AI：AI 檢閱 AI 寫的東西盲點一樣——配色、字太大、縮排、命名它都挑（trap／nit），真正的問題只挑題目 aiFinds 列的那幾個
    if (question.kind === 'spot' || question.kind === 'diff') {
      const trapReason = (key) => { const src = question.kind === 'spot' ? question.spots.find(s => s.region === key) : question.lines.find(l => l.n === key); return (src && src.aiReason) || (question.reasons[0] || {}).id; };
      const marks = [...reviewTraps(question).map(t => ({ key: t.key, reason: trapReason(t.key) })),
        ...reviewTargets(question).filter(t => (question.aiFinds || []).includes(t.reason)).map(t => ({ key: t.key, reason: t.reason }))];
      errors.push('miss');
      return { answers: { marks, lgtm: false, hintsUsed: 0 }, errors };
    }
    const guess = (spec, right, key) => {
      if (spec && aiRoll(`${seed}:${key}`) >= accuracy) { errors.push(spec.kind || 'logic'); return spec.pick; }
      return right;
    };
    if (question.kind === 'functions') {
      const toFill = functionsToFill(question, covered, picks);
      const driven = (f) => drives[f.name] || {};
      const raw = question.functions.map((f, i) => {
        if (!toFill.includes(i)) return {};
        return Object.fromEntries(Object.entries(f.fields || {}).map(([key, field]) => {
          if (key in driven(f)) return [key, driven(f)[key]];
          if (f.judgment && field.ai) return [key, field.ai.pick];   // 它的主張；筆記沒蓋過才算數（下面記 claim）
          if (field.ai && field.ai.always) { errors.push(field.ai.kind || 'logic'); return [key, field.ai.pick]; }   // 它一定這樣做（例如報表一定做成儀表板）
          return [key, guess(field.ai, field.answer, `${i}:${key}`)];
        }));
      });
      const answers = applyNotes(question, raw, notes).map((a, i) => (toFill.includes(i) ? { ...a, ...driven(question.functions[i]), ...lockedFields(question.functions[i], locked) } : a));
      question.functions.forEach((f, i) => {
        if (f.judgment) for (const [key, field] of Object.entries(f.fields || {})) if (field.ai && answers[i][key] === field.ai.pick) errors.push('claim');
      });
      return { answers, errors };
    }
    if (question.kind === 'discuss') {
      const circled = Object.keys(question.asks).map(Number); const asks = {};
      for (const i of circled) asks[i] = askList(question, i).map(q => {
        const polite = q.polite ?? q.options.length - 1;
        if (polite !== q.answer) errors.push('miss');
        return polite;
      });
      return { answers: { circled, asks }, errors: [...new Set(errors)] };
    }
    // 沒有對錯的題（free，例如估時）：AI 照它自己的填（估時一律樂觀），不算錯
    const answers = applyNotes(question, question.items.map((item, i) => {
      if (item.free) return item.ai && item.ai.pick;
      const shown = visibleItem(item, picks); return guess(shown.ai, shown.answer, i);
    }), notes);
    return { answers: answers.map((a, i) => withGiven(question.items[i], a, givenOptions(question.items[i], picks, (w) => done.includes(w)))), errors };
  }
  // 帶進來的選項 AI 不會漏：多選併進去；排序題照正解的先後插進它排的清單
  function withGiven(item, answer, given) {
    if (!given.length) return answer;
    const list = Array.isArray(answer) ? [...answer] : [];
    if (item.type === 'order') return given.reduce((acc, g) => (acc.includes(g) ? acc : insertInOrder(item, acc, g)), list);
    return [...new Set([...list, ...given])];
  }

  const stanceOf = (note) => (typeof note === 'string' ? note : note && note.stance);
  // 選項的標記：'主題:做法'，或 '主題:做法1,做法2'（這幾種做法的筆記都會選它）；一個選項標好幾個主題就寫成陣列
  const splitTag = (tag) => { const [topic, stances] = tag.split(':'); return { topic, stances: stances.split(',') }; };
  const allTags = (spot) => Object.entries(spot.tags || {}).flatMap(([opt, tags]) => [].concat(tags).map(tag => ({ opt: Number(opt), ...splitTag(tag) })));
  // 照正解順序插進去：排在正解裡它前面、而且已經在清單上的最後一個後面；正解沒有它就放最後
  function insertInOrder(spot, list, opt) {
    const before = spot.answer.slice(0, Math.max(0, spot.answer.indexOf(opt))).filter(v => list.includes(v));
    const at = before.length ? list.indexOf(before[before.length - 1]) + 1 : (spot.answer.includes(opt) ? 0 : list.length);
    return [...list.slice(0, at), opt, ...list.slice(at)];
  }
  // 一題（item 或 function 的一個欄位）套筆記；multi 是多選或排序。做法是 ask 的主題不照筆記決定，交件前先問（firstAsks）
  function noteOne(spot, value, notes) {
    const tagged = allTags(spot).filter(t => notes[t.topic] != null && stanceOf(notes[t.topic]) !== 'ask');
    if (!tagged.length) return value;
    const fits = (t) => t.stances.includes(stanceOf(notes[t.topic]));
    if (!Array.isArray(spot.answer)) {   // 單選：不碰就留白，不然挑標了那做法的
      if (tagged.some(t => stanceOf(notes[t.topic]) === 'skip')) return null;
      const hit = tagged.find(fits);
      return hit ? hit.opt : value;
    }
    // 多選、排序：標了的選項，每個主題的筆記都對得上才留著，對得上又不在清單上就補進去
    const opts = [...new Set(tagged.map(t => t.opt))];
    const keep = (opt) => tagged.filter(t => t.opt === opt).every(fits);
    let list = [].concat(value ?? []).filter(v => !opts.includes(v) || keep(v));
    for (const opt of opts) if (keep(opt) && !list.includes(opt)) list = insertInOrder(spot, list, opt);
    return list;
  }
  // 矯枉過正（筆記做法是 ask）：標了那個主題、寫了 askFirst 的選項，AI 交件前一題一題停下來問人類
  function firstAsks(question, notes = {}) {
    if (!question || !question.items) return [];
    return question.items.flatMap((item, i) => Object.entries(item.askFirst || {})
      .filter(([opt]) => allTags(item).some(t => t.opt === Number(opt) && stanceOf(notes[t.topic]) === 'ask'))
      .map(([opt, ask]) => ({ item: i, opt: Number(opt), yes: '要', no: '不用', ...(typeof ask === 'string' ? { text: ask } : ask) })));
  }
  // 人類回答了一題：要就照正解順序放進去，不要就拿掉
  function applyAsk(question, answers, ask, yes) {
    const item = question.items[ask.item]; const out = [...answers];
    const list = [].concat(out[ask.item] ?? []).filter(v => v !== ask.opt);
    out[ask.item] = yes ? insertInOrder(item, list, ask.opt) : list;
    return out;
  }
  function applyNotes(question, answers, notes = {}) {
    if (!notes || !Object.keys(notes).length || !question) return answers;
    if (question.kind === 'functions') return question.functions.map((f, i) => {
      const a = { ...(answers[i] || {}) };
      for (const [key, field] of Object.entries(f.fields || {})) if (key in a) {
        const v = noteOne(field, a[key], notes); a[key] = v === null ? undefined : v;
      }
      return a;
    });
    if (!question.items) return answers;
    return question.items.map((item, i) => noteOne(item, answers[i], notes));
  }

  // ── 退回＝請 AI 改：圈出錯的或漏的題目，每題各自一組補充說明 ──
  const optText = (spot, v) => (v == null || (Array.isArray(v) && !v.length) ? '（沒填）'
    : spot.type === 'hours' ? `${v} 小時`
    : Array.isArray(v) ? v.map(j => spot.options[j]).join(spot.type === 'order' ? ' → ' : '、') : spot.options[v]);
  // 劇本沒寫補充說明的題目，自動給一句精準的：「應該是：正解」；筆記照正解的 tags 推（取第一個做法；這主題正解沒標的做法就是 no）
  function autoFix(spot) {
    const set = {};
    for (const { opt, topic, stances } of allTags(spot)) {
      if ([].concat(spot.answer).includes(opt)) set[topic] = stances[0];
      else if (!(topic in set)) set[topic] = 'no';
    }
    return { say: `應該是：${optText(spot, spot.answer)}`, pick: spot.answer, set, auto: true };
  }
  // 劇本的 fixes 可以寫 'auto' 把自動那句放在指定位置
  const fixesOf = (spot) => (spot.fixes && spot.fixes.length ? spot.fixes.map(f => (f === 'auto' ? autoFix(spot) : f)) : [autoFix(spot)]);
  // 答案卡上能圈的每一題：key、題目、它填的、補充說明
  function aiSpots(question, answers, { covered = 'all', picks = null } = {}) {
    if (!question || ['manual', 'device', 'terminal', 'entry', 'spot', 'diff'].includes(question.kind)) return [];
    if (question.kind === 'functions') {
      const toFill = functionsToFill(question, covered, picks);
      return question.functions.flatMap((f, i) => (toFill.includes(i) ? Object.entries(f.fields || {}).map(([key, field]) => (
        { key: `f${i}.${key}`, label: `${f.name}：${field.label || key}`, shown: optText(field, (answers[i] || {})[key]), fixes: fixesOf(field) })) : []));
    }
    if (question.kind === 'discuss') {
      return ((answers && answers.circled) || []).flatMap(seg => askList(question, seg).map((ask, k) => (
        { key: `d${seg}.${k}`, label: question.segments[seg], shown: optText(ask, ((answers.asks || {})[seg] || [])[k]), fixes: fixesOf(ask) })));
    }
    // 沒有對錯的題（free）沒得圈：不對就自己在答案卡上改
    return question.items.flatMap((item, i) => (item.free ? [] : [{ key: `i${i}`, label: item.text, shown: optText(item, answers[i]), fixes: fixesOf(visibleItem(item, picks)) }]));
  }
  // 講的話寫成筆記：劇本有 AI 口吻（ai.topics[主題][做法]）就用，沒有就用講的那句（自動那句寫成「記住：正解」）
  // 做法寫 null 的主題不是筆記，是要劃掉的舊筆記（fixDrops）；沒有 set 的補充說明不留筆記，那題照正確率重做
  function fixNotes(fix, topics = {}) {
    return Object.fromEntries(Object.entries((fix && fix.set) || {}).filter(([, stance]) => stance !== null).map(([topic, stance]) => [topic, {
      stance, text: (topics[topic] && topics[topic][stance]) || (fix.auto ? `記住：${fix.say.replace(/^應該是：/, '')}` : fix.say) }]));
  }
  // 人類那句戳到的是舊筆記的前提（「阿賢不是莎禾的人」）：新一代的 AI 把那條劃掉、不另寫一條
  const fixDrops = (fix) => Object.entries((fix && fix.set) || {}).filter(([, stance]) => stance === null).map(([topic]) => topic);
  // 只改圈到的題目：有說法而且說法帶答案就照改，不然照正確率重擲；改完整份再套一次筆記（同一份的其他題也跟著筆記走）
  function reviseAnswers(question, base, requests, { notes = {}, accuracy = 0.5, seed = '', picks = null, done = [], locked = () => false } = {}) {
    const clone = (v) => (v && typeof v === 'object' ? JSON.parse(JSON.stringify(v)) : v);
    const answers = clone(base);
    const redo = (spot, key) => (spot.ai && aiRoll(`${seed}:${key}`) >= accuracy ? spot.ai.pick : spot.answer);
    for (const { key, fix } of requests) {
      const [, kind, a, b] = key.match(/^([ifd])(\d+)(?:\.(.+))?$/) || [];
      if (kind === 'i') {
        const item = visibleItem(question.items[a], picks);
        answers[a] = withGiven(item, fix && fix.pick !== undefined ? fix.pick : redo(item, key), givenOptions(item, picks, (w) => done.includes(w)));
      }
      if (kind === 'f') {
        const field = question.functions[a].fields[b];
        (answers[a] ||= {})[b] = locked(field) ? field.lockedTo : fix && fix.pick !== undefined ? fix.pick : redo(field, key);
      }
      if (kind === 'd') {
        const ask = askList(question, Number(a))[Number(b)]; const list = (answers.asks[a] ||= []);
        list[Number(b)] = fix && fix.pick !== undefined ? fix.pick : (aiRoll(`${seed}:${key}`) >= accuracy ? (ask.polite ?? ask.options.length - 1) : ask.answer);
      }
    }
    return question.kind === 'discuss' ? answers : applyNotes(question, answers, notes);
  }

  // kind:'terminal'：自己在終端機點指令。answers 是跑過的指令編號；required 的都跑過才算查完
  function gradeTerminal(question, answers) {
    const ran = [...new Set([].concat(answers || []))];
    const need = question.commands.map((c, i) => (c.required ? i : -1)).filter(i => i >= 0);
    const hit = need.filter(i => ran.includes(i)).length;
    const minutes = ran.reduce((s, i) => s + ((question.commands[i] || {}).minutes || 0), 0);
    return { score: hit, max: need.length, minutes, done: hit === need.length, ran, wrong: need.filter(i => !ran.includes(i)), violated: [], choices: {} };
  }
  // kind:'entry'：資料登打。answers 每列 { name, owner, photo } 對 records 同一列；字（去頭尾空白）和照片都要對
  function gradeEntry(question, answers) {
    const rows = answers || []; let wrongText = 0, wrongPhoto = 0;
    question.records.forEach((r, i) => {
      const a = rows[i] || {};
      if ((a.name || '').trim() !== r.name || (a.owner || '').trim() !== r.owner) wrongText++;
      if (a.photo !== r.photo) wrongPhoto++;
    });
    const max = question.records.length * 2;
    return { score: max - wrongText - wrongPhoto, max, wrongText, wrongPhoto, wrong: [], violated: [], choices: {} };
  }

  // 檢閱程式碼的兩款小遊戲：前端「三機找碴」kind 'spot'（點畫面的區塊）、後端「讀 diff 標行」kind 'diff'（點 diff 的行）。
  // 答案 { marks: [{ key, reason }], lgtm, hintsUsed }：key 是區塊名或行號。要抓的（spot 沒標 trap、line 有 issue）點到＋原因對＝1、
  // 原因錯＝0.5；點到 trap／nit／沒問題的行算誤點。LGTM 什麼都不標直接交（skipped）。picks 只留抓到的 fix，開發的 function 用 needs 接
  const reviewTargets = (q) => (q.kind === 'spot'
    ? q.spots.filter(s => !s.trap).map(s => ({ key: s.region, reason: s.reason, fix: s.fix, text: s.text }))
    : q.lines.filter(l => l.issue).map(l => ({ key: l.n, reason: l.issue, fix: l.fix, text: l.code.trim() })));
  const reviewTraps = (q) => (q.kind === 'spot'
    ? q.spots.filter(s => s.trap).map(s => ({ key: s.region, text: s.text, why: s.trap }))
    : q.lines.filter(l => l.nit).map(l => ({ key: l.n, text: l.code.trim(), why: l.nit })));
  function gradeReview(question, answers) {
    const a = answers || {}; const marks = a.lgtm ? [] : (a.marks || []);
    const targets = reviewTargets(question), traps = reviewTraps(question);
    let score = 0; const hits = [], half = [], misses = [];
    for (const t of targets) {
      const m = marks.find(x => String(x.key) === String(t.key));
      if (m && m.reason === t.reason) { score += 1; hits.push(t); } else if (m) { score += 0.5; half.push(t); } else misses.push(t);
    }
    const falses = marks.filter(m => !targets.some(t => String(t.key) === String(m.key))).map(m => traps.find(t => String(t.key) === String(m.key)) || { key: m.key, text: `第 ${m.key} 行`, why: '這行沒問題' });
    return { score, max: targets.length, hits, half, misses, falses, hintsUsed: a.hintsUsed || 0, skipped: !!a.lgtm,
      wrong: [...half, ...misses].map(t => t.key), violated: [], choices: {}, picks: [hits.map(h => h.fix).filter(Boolean)] };
  }
  // item.free：沒有對錯的題（例如估時：type 'hours' 自己填幾小時），不計分，填了什麼記在 choices
  function grade(question, answers, ctx = {}) {
    if (question.kind === 'spot' || question.kind === 'diff') return gradeReview(question, answers);
    if (question.kind === 'functions') return gradeFunctions(question, answers, ctx);
    if (question.kind === 'discuss') return gradeDiscuss(question, answers);
    if (question.kind === 'terminal') return gradeTerminal(question, answers);
    if (question.kind === 'entry') return gradeEntry(question, answers);
    let score = 0, max = 0; const wrong = [], violated = [], choices = {};
    question.items.forEach((item, i) => {
      if (item.free) { choices[item.key || i] = answers[i]; return; }
      max++;
      const s = gradeItem(withDeployOrder(question, item), answers[i], hiddenOptions(item, ctx.picks));
      score += s;
      if (s < 1) { wrong.push(i); if (item.heuristic) violated.push(item.heuristic); }
    });
    // item.onPick：選了某個選項會發生的事（例如檢討報告寫「請職代確認」，小潘來信抱怨）；engine 照這個發
    const effects = question.items.flatMap((item, i) => [].concat(answers[i] ?? []).map(a => item.onPick && item.onPick[a]).filter(Boolean));
    const minutes = typeof question.minutes === 'function' ? question.minutes(choices) : question.minutes;
    return { score, max, minutes, wrong, violated: sorted(violated), choices, effects };
  }

  const LOW_BATTERY = 15;   // 電量百分比，這以下算沒電
  function deviceTestOptions(battery) {
    const dead = Object.entries(battery).filter(([, v]) => v <= LOW_BATTERY).map(([k]) => ({ phone: '手機', tablet: '平板' }[k] || k));
    return [
      { id: 'real', label: '乖乖拿裝置測', minutes: 40, disabled: dead.length > 0, reason: dead.length ? `${dead.join('、')}沒電` : '' },
      { id: 'sim', label: '全部用 PC 模擬', minutes: 10, disabled: false, reason: '' },
    ];
  }

  const label = (id) => LABELS[id] || id;

  const intro = (work, question) => (question && question.intro) || INTROS[work] || '';
  // 回訊息：每一題都選了才送得出去（單選要有選項、多選至少勾一個）
  const replyAnswered = (question, answers) => question.items.every((item, i) => { const a = answers[i]; return a != null && (!Array.isArray(a) || a.length > 0); });
  // 選項顯示的順序（正解都放在第一個）：劇本照寫，畫面上照種子打散；選項的值還是原本的編號，評分不受影響。
  // 同一個種子永遠同一個順序（重新打開同一題不會亂跳）；keepOrder 是有大小順序的選項（估時），不打散
  function displayOrder(n, seed, keepOrder = false) {
    const order = Array.from({ length: n }, (_, i) => i);
    if (keepOrder) return order;
    for (let i = n - 1; i > 0; i--) { const j = Math.floor(aiRoll(`${seed}:${i}`) * (i + 1)); [order[i], order[j]] = [order[j], order[i]]; }
    return order;
  }

  const api = { grade, replyAnswered, chatText, deployBefore, functionsToFill, testDrives, givenOptions, summarize, testStyle, deviceTestOptions, label, intro, aiAnswers, aiRoll, applyNotes, firstAsks, applyAsk, aiSpots, fixNotes, fixDrops, reviseAnswers, displayOrder, pickedIn, hiddenOptions, visibleItem, activeFunction, LABELS, INTROS, MENU, LOW_BATTERY };
  if (typeof module !== 'undefined') module.exports = api;
  else root.Works = api;
})(typeof window !== 'undefined' ? window : globalThis);
