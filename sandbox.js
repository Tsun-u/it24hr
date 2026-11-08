// sandbox.js — 正式上班（程式裡叫沙盒）共通：關卡登記、抽關、存檔紀錄。
// 每一關一個檔（sandbox-<關卡>.js），用 Sandbox.add 登記；劇本照時代（legacy／hybrid／speedrun）產，問題相同、只換代價。
(function (root) {
  const { ClaireSkills } = typeof require === 'function' ? require('./claire-skills.js') : root;
  const levels = {};
  // 正式上班能寫進 CLAIRE.md 的規範（寫 Skill）：部署流程、整理需求的讀法（原則、情緒化兩句；過於細節派點名的是新人訓練第三天的案子）
  const SKILLS = [ClaireSkills.deploy, ClaireSkills.readReq()];
  const CLOSE_AT = 21 * 60;   // 強制下班的時鐘時間（分鐘）

  // AI 錯法通則（劇本沒寫 ai 的題目才補，題目沒 ai 的話骰到錯也只能答對）。
  // 前端程式照時代錯：eraPick[mode] 是 outcome kind 的先後，挑題目 outcome 裡第一個有的那種。
  // 寫成陣列只套欄位題（role 'field'，第二關）；寫成 { kinds, any: true } 套所有掛了後果的題目（第三關：AI 照常理做、老師不滿）
  function withEra(item, eraRule) {
    const order = Array.isArray(eraRule) ? eraRule : eraRule && eraRule.kinds;
    if (!order || !item.outcome || (Array.isArray(eraRule) && item.role !== 'field')) return item;
    const opts = Object.keys(item.outcome).map(Number);
    const kind = order.find(k => opts.some(o => item.outcome[o].kind === k)); if (!kind) return item;
    const pick = opts.find(o => item.outcome[o].kind === kind);
    return { ...item, ai: { pick: Array.isArray(item.answer) ? [pick] : pick, kind: 'flexible' } };
  }
  // 其他題目：單選選第一個錯的選項；開發計畫漏第一步、多排一個陷阱步驟；驗收漏最後一項、多一個陷阱案例；部署多做通知
  function missOf(item, work, roles) {
    if (item.ai || item.free || item.type === 'hours') return item;
    const traps = item.options.map((_, i) => i).filter(i => ![].concat(item.answer).includes(i));
    if (item.type === 'order') {
      if (work === 'deploy') return roles && roles.notify != null ? { ...item, ai: { pick: [...item.answer, roles.notify], kind: 'extra' } } : item;
      return { ...item, ai: { pick: [...item.answer.slice(1), ...traps.slice(0, 1)], kind: 'extra' } };
    }
    if (Array.isArray(item.answer)) return { ...item, ai: { pick: [...item.answer.slice(0, -1), ...traps.slice(0, 1)], kind: 'miss' } };
    return traps.length ? { ...item, ai: { pick: traps[0], kind: work === 'read_req' ? 'miss' : 'logic' } } : item;
  }
  // 開發、測試程式的欄位選第一個錯的（陷阱測試就是真的去測）
  function fieldMiss(field) {
    if (field.ai) return field;
    const wrong = field.options.findIndex((_, i) => i !== field.answer);
    return wrong < 0 ? field : { ...field, ai: { pick: wrong, kind: 'logic' } };
  }
  function withMisses(s, mode, eraPick) {
    const q = s.question; if (!q || !eraPick[mode]) return s;   // legacy 沒有 AI
    if (q.items) return { ...s, question: { ...q, items: q.items.map(item => missOf(s.work === 'ui_design' ? withEra(item, eraPick[mode]) : item, s.work, q.roles)) } };
    if (q.functions) return { ...s, question: { ...q, functions: q.functions.map(f => ({ ...f,
      fields: Object.fromEntries(Object.entries(f.fields || {}).map(([k, field]) => [k, fieldMiss(field)])) })) } };
    return s;
  }

  // ── 平行宇宙的新卡：小卡（前端程式的欄位題、開發的 function、手動測試、部署），當天就能做、不做完也沒差 ──
  // 需求簡單，卡片本身就是文件：開發的 function 只寫 sentence，卡上有那句就從卡片直接拉進來。前端程式沒做時欄位都是什麼都收（ifSkipped 2）。
  // site 是部署時備份的那套系統（「備份測試機上的{site}」）
  function smallCard({ id, title, body, fields, functions, screen, tryIt, site }) {
    return { id, title, body, type: 'feature', screen: { form: true, bugs: {}, ...screen }, subtasks: [
      { work: 'ui_design', question: { items: fields.map(f => ({ role: 'field', answer: 0, ifSkipped: 2, ...f })) } },
      { work: 'code', question: { kind: 'functions', functions } },
      { work: 'manual_test', question: { kind: 'manual' } },
      { work: 'deploy', question: { roles: { backup: 0, upload: 1, replace: 2, smoke: 3, notify: 4 },
        items: [{ text: '步驟', type: 'order', options: [`備份測試機上的${site}`, '上傳新版', '替換', `開網址${tryIt}試試`, '通知需求單位'], answer: [0, 1, 2, 3],
          why: '通知需求單位要等 QC 驗過，從已完成的卡上按' }] } },
    ] };
  }
  // 小卡欄位題的三種答法：正解、跳紅字（annoy）、什麼都收（miss）
  const fieldOf = (field, text, sample, options, annoy, miss) => ({ field, text, sample, options,
    outcome: { 1: { kind: 'annoy', say: annoy.say, red: annoy.red }, 2: { kind: 'miss', say: miss.say, junk: miss.junk } } });
  const fnOf = (sentence, name, does, code, label, options) => ({ sentence, name, does, code, fields: { how: { label, options, answer: 0 } } });

  // 單卡試玩：只留那張卡和它的母議題，會議也只講這兩頁。池子裡的卡要那一關的 make 照 carry.only 抽到（第三關有接）。
  // trial 標著這一天是試玩：結算卡不寫進正式上班的存檔
  function onlyCard(script, id) {
    const all = [...script.cards, ...script.meetings.flatMap(m => m.cards || [])];
    const card = all.find(c => c.id === id);
    if (!card) throw new Error(`這一關沒有這張卡：${id}（有 ${all.map(c => c.id).join('、')}）`);
    const keep = (c) => c.id === id || c.id === card.parent;
    return { ...script, trial: id, cards: script.cards.filter(keep),
      meetings: script.meetings.map(m => (m.cards ? { ...m, cards: m.cards.filter(keep), ...(m.pages && { pages: m.pages.filter(keep) }) } : m)) };
  }

  const Sandbox = {
    smallCard, fieldOf, fnOf,
    // 一張卡套上時代的 AI 錯法；有選路的卡（routes），每條路的工作也一起套
    forEra: (card, mode, eraPick) => ({ ...card, subtasks: card.subtasks.map(s => withMisses(s, mode, eraPick)),
      ...(card.routes && { routes: card.routes.map(r => ({ ...r, subtasks: r.subtasks.map(s => withMisses(s, mode, eraPick)) })) }) }),
    add(id, make) { levels[id] = make; },
    remove(id) { delete levels[id]; },
    ids() { return Object.keys(levels); },
    // kind 讓 engine、app 分得出是正式上班；mode 照舊是時代，版面配色跟新人訓練共用。
    // carry 是從外面帶進來的東西（{ notes }：全域 CLAIRE.md），有 AI 的時代帶進劇本。
    // closeAt：跟新人訓練一樣 21:00 強制下班（隔天 08:00 在茶几結算）；哪一關要不同，劇本自己寫 closeAt 蓋過
    // 單卡試玩（審卡用）：carry.only 是卡的 id，carry.parallel 讓平行宇宙一定開出新卡，見 onlyCard
    make(id, mode, carry = {}) {
      const make = levels[id];
      if (!make) throw new Error(`沒有這一關：${id}`);
      const script = { closeAt: CLOSE_AT, ...make(mode, carry), kind: 'sandbox', level: id, mode };
      if (carry.parallel && script.parallel) script.parallel = { ...script.parallel, chance: 1 };
      return carry.only ? onlyCard(script, carry.only) : script;
    },
    // 存檔：{ levels: { 關卡: { 時代: { view, at, plays } } } }，每個時代只留最後一次的結算卡
    record(old, level, mode, view, at) {
      const saved = { ...((old && old.levels) || {}) };
      const prev = (saved[level] || {})[mode];
      saved[level] = { ...(saved[level] || {}), [mode]: { view, at, plays: (prev ? prev.plays : 0) + 1 } };
      return { levels: saved };
    },
    last(save, level, mode) { return (save && save.levels && save.levels[level] && save.levels[level][mode]) || null; },
    // 抽關：avoid 是重抽時不想再抽到的（現在顯示的那關）；只剩那幾關時照樣從全部抽
    draw(avoid = [], random = Math.random) {
      const all = Object.keys(levels); const rest = all.filter(id => !avoid.includes(id));
      const pool = rest.length ? rest : all;
      return pool[Math.floor(random() * pool.length)];
    },
    // 玩過＝任何一個時代玩完過一次（三個時代問題相同）；玩過的關可以在抽關畫面直接選
    opened(save) { return Object.keys((save && save.levels) || {}); },
    // 各時代的 Claire 方案（legacy 沒有）：hybrid 挑三姐妹，speedrun 多 Pedia（單件 3 格、98%、一天一次，問一句、交辦、整組、整張共用）。
    // groups：整組交辦的格數（沒寫的組是單件加總 −1）；oneShot：整張交給 Pedia 最多幾格（剩下的照整組、單件加起來，超過就算這個數）；perDay：一天能用幾次；
    // cap：一天的上限是關卡額度的幾成（退回請它改也算；還沒到就能用，花到或超過之後才擋）
    // askMin 是問了之後幾分鐘回答；turnaround、accuracy 是交辦用的，跟新人訓練第二（hybrid）、三天（speedrun）一樣，額度也一樣。
    // 兩個時代都能寫 Skill（skills）
    AI: {
      hybrid: { model: 'Essay 4.5', quota: 6, permission: 'acceptEdits', skills: SKILLS, models: {
        Verse: { label: 'Verse 4.5', cost: 1, askMin: 1, turnaround: [5, 10], accuracy: 0.4 },
        Essay: { label: 'Essay 4.5', cost: 1, askMin: 2, turnaround: [10, 25], accuracy: 0.5 },
        Novel: { label: 'Novel 4.5', cost: 2, askMin: 4, turnaround: [15, 30], accuracy: 0.65 } } },
      speedrun: { model: 'Essay 5', quota: 10, permission: 'auto', skills: SKILLS, models: {
        Verse: { label: 'Verse 5', cost: 1, askMin: 1, turnaround: [3, 6], accuracy: 0.65 },
        Essay: { label: 'Essay 5', cost: 1, askMin: 2, turnaround: [6, 12], accuracy: 0.75 },
        Novel: { label: 'Novel 5', cost: 2, askMin: 4, turnaround: [10, 20], accuracy: 0.9 },
        Pedia: { label: 'Pedia 5', cost: 3, groups: { docs: 5, dev: 4 }, oneShot: 6, perDay: 1, cap: 0.6, askMin: 3, turnaround: [10, 20], accuracy: 0.98 } } },
    },
    // 茶几（下班後）的設定
    HOME: { commute: 30, pickupExtra: 15, deliveryWait: 40, vpnMin: 5, vpnDrop: 0.15, ringMin: 20, emergencies: [] },
  };
  if (typeof module !== 'undefined') module.exports = { Sandbox };
  else root.Sandbox = Sandbox;
})(typeof window !== 'undefined' ? window : globalThis);
