// sandbox.js — 正式上班（程式裡叫沙盒）共通：關卡登記、抽關、存檔紀錄。
// 每一關一個檔（sandbox-<關卡>.js），用 Sandbox.add 登記；劇本照時代（legacy／hybrid／speedrun）產，問題相同、只換代價。
(function (root) {
  const levels = {};
  const Sandbox = {
    add(id, make) { levels[id] = make; },
    ids() { return Object.keys(levels); },
    // kind 讓 engine、app 分得出是正式上班；mode 照舊是時代，版面配色跟新人訓練共用
    make(id, mode) {
      const make = levels[id];
      if (!make) throw new Error(`沒有這一關：${id}`);
      return { ...make(mode), kind: 'sandbox', level: id, mode };
    },
    // 存檔：{ levels: { 關卡: { 時代: { view, at, plays } } } }，每個時代只留最後一次的結算卡
    record(old, level, mode, view, at) {
      const saved = { ...((old && old.levels) || {}) };
      const prev = (saved[level] || {})[mode];
      saved[level] = { ...(saved[level] || {}), [mode]: { view, at, plays: (prev ? prev.plays : 0) + 1 } };
      return { levels: saved };
    },
    last(save, level, mode) { return (save && save.levels && save.levels[level] && save.levels[level][mode]) || null; },
    // 抽關：每次玩抽一個，skip 是這次已經跳過的（玩過的關才能跳）；全部跳過就回 null
    draw(skip = [], random = Math.random) {
      const pool = Object.keys(levels).filter(id => !skip.includes(id));
      return pool.length ? pool[Math.floor(random() * pool.length)] : null;
    },
    // 開過＝任何一個時代玩完過一次；全部開過之後可以不抽、直接選
    opened(save) { return Object.keys((save && save.levels) || {}); },
    allOpened(save) { const opened = Sandbox.opened(save); return Object.keys(levels).every(id => opened.includes(id)); },
  };
  if (typeof module !== 'undefined') module.exports = { Sandbox };
  else root.Sandbox = Sandbox;
})(typeof window !== 'undefined' ? window : globalThis);
