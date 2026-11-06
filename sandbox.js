// sandbox.js — 正式上班（程式裡叫沙盒）共通：關卡登記、抽關、存檔紀錄。
// 每一關一個檔（sandbox-<關卡>.js），用 Sandbox.add 登記；劇本照時代（legacy／hybrid／speedrun）產，問題相同、只換代價。
(function (root) {
  const { ClaireSkills } = typeof require === 'function' ? require('./claire-skills.js') : root;
  const levels = {};
  // 正式上班能寫進 CLAIRE.md 的規範（寫 Skill）：部署流程、整理需求的讀法（原則、情緒化兩句；過於細節派點名的是新人訓練第三天的案子）
  const SKILLS = [ClaireSkills.deploy, ClaireSkills.readReq()];
  const CLOSE_AT = 21 * 60;   // 強制下班的時鐘時間（分鐘）
  const Sandbox = {
    add(id, make) { levels[id] = make; },
    remove(id) { delete levels[id]; },
    ids() { return Object.keys(levels); },
    // kind 讓 engine、app 分得出是正式上班；mode 照舊是時代，版面配色跟新人訓練共用。
    // carry 是從外面帶進來的東西（{ notes }：全域 CLAIRE.md），有 AI 的時代帶進劇本。
    // closeAt：跟新人訓練一樣 21:00 強制下班（隔天 08:00 在茶几結算）；哪一關要不同，劇本自己寫 closeAt 蓋過
    make(id, mode, carry = {}) {
      const make = levels[id];
      if (!make) throw new Error(`沒有這一關：${id}`);
      return { closeAt: CLOSE_AT, ...make(mode, carry), kind: 'sandbox', level: id, mode };
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
    // 同一間公司每一關共用：小事件池（可接可推，推掉那句進結算卡）。trip 是跑一趟的分鐘數，tripText 是黑畫面那句
    ERRANDS: [
      { id: 'water', who: '業務 君傑', text: '飲水機沒水了，你們 IT 可以換一下嗎？', trip: 10, tripText: '你扛著一桶水走到茶水間，換好順便把空桶疊回去。', decline: '你們 IT 不是什麼都會？' },
      { id: 'aircon', who: '行政 淑芬', text: '冷氣好冷，可以幫忙調高一點嗎？', trip: 5, tripText: '你把冷氣從 22 度調到 26 度，淑芬說終於不用穿外套了。', decline: '冷氣是電器，IT 要負責吧？' },
      { id: 'font', who: '老闆', text: '手機字太小了，過來幫我弄大一點。', trip: 10, tripText: '你把老闆手機的字調到最大，他說這樣好多了，一個畫面只剩三行。', decline: '手機不是 IT 要處理嗎？' },
      { id: 'projector', who: '財務 美玲', text: '投影機沒訊號，等一下要開會，可以幫忙看一下嗎？', trip: 15, tripText: '你把投影機後面鬆掉的線插回去，畫面出來了。', decline: 'IT 不幫我們處理投影機我們怎麼開會？' },
    ],
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
