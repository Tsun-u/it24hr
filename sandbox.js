// sandbox.js — 正式上班（程式裡叫沙盒）共通：關卡登記、抽關、存檔紀錄。
// 每一關一個檔（sandbox-<關卡>.js），用 Sandbox.add 登記；劇本照時代（legacy／hybrid／speedrun）產，問題相同、只換代價。
(function (root) {
  const levels = {};
  const Sandbox = {
    add(id, make) { levels[id] = make; },
    remove(id) { delete levels[id]; },
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
    // 抽關：avoid 是重抽時不想再抽到的（現在顯示的那關）；只剩那幾關時照樣從全部抽
    draw(avoid = [], random = Math.random) {
      const all = Object.keys(levels); const rest = all.filter(id => !avoid.includes(id));
      const pool = rest.length ? rest : all;
      return pool[Math.floor(random() * pool.length)];
    },
    // 玩過＝任何一個時代玩完過一次（三個時代問題相同）；玩過的關可以在抽關畫面直接選
    opened(save) { return Object.keys((save && save.levels) || {}); },
  };
  if (typeof module !== 'undefined') module.exports = { Sandbox };
  else root.Sandbox = Sandbox;
})(typeof window !== 'undefined' ? window : globalThis);
