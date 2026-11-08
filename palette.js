// palette.js — 配色題（前端程式 type: 'palette'）的判定：幾種顏色填進底色、文字、裝飾色、元件色四格；可以做深色主題（深淺兩組各四格）。
// 純函式，node 和瀏覽器共用。題目資料：colors、slots、teacherColors（顏色 id → 誰算的）、right（正解那組）、tianshu（天書那組）、
// missingSays（誰的顏色沒用到時她講什麼）、foreign（用到沒人算的顏色）、alsoSays（用到某些顏色時多一句）
(function (root) {
  // WCAG 2 的相對亮度與對比度
  const luminance = (hex) => {
    const c = [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16) / 255).map(v => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
    return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
  };
  const contrast = (a, b) => { const [x, y] = [luminance(a), luminance(b)]; return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); };
  const TEXT_MIN = 4.5, COMPONENT_MIN = 3;   // 文字對底色、元件對底色
  const DARK_BG = 0.18;                      // 底色亮度低於這個算深色
  const SET_NAMES = { light: '淺色主題', night: '深色主題' };

  const hexOf = (item, id) => (item.colors.find(c => c.id === id) || {}).hex;
  const sameSet = (a, b) => !!a && !!b && [...new Set([...Object.keys(a), ...Object.keys(b)])].every(k => a[k] === b[k]);
  const filled = (item, set) => !!set && item.slots.every(s => set[s.key]);
  // 這次填了哪幾組：沒做深色主題只有一組（light），做了就是 light＋night
  const setsOf = (answer) => (answer ? (answer.dark ? ['light', 'night'] : ['light']).map(k => [k, answer[k]]) : []);
  // 看不看得清楚：文字和元件都要跟底色拉得開
  function readable(item, set) {
    const bg = hexOf(item, set.bg);
    return contrast(hexOf(item, set.fg), bg) >= TEXT_MIN && contrast(hexOf(item, set.accent), bg) >= COMPONENT_MIN;
  }
  const darkBg = (item, set) => luminance(hexOf(item, set.bg)) < DARK_BG;

  // 判一份答案。complete：每組四格都填了；ok：老師的顏色都用到、沒有外色、每組都看得清楚（或暗藏玄機：一組天書、一組看得清楚）
  function judge(item, answer) {
    const sets = setsOf(answer).map(([key, set]) => ({ key, name: SET_NAMES[key], set, complete: filled(item, set) }));
    const complete = sets.length > 0 && sets.every(s => s.complete);
    if (!complete) return { complete: false, ok: false, sets, missing: [], foreign: [], achievements: [], outcomes: [] };
    for (const s of sets) { s.readable = readable(item, s.set); s.tianshu = sameSet(s.set, item.tianshu); s.darkBg = darkBg(item, s.set); }
    const used = new Set(sets.flatMap(s => item.slots.map(slot => s.set[slot.key])));
    const missing = Object.keys(item.teacherColors).filter(id => !used.has(id));
    const foreign = [...used].filter(id => !(id in item.teacherColors));
    const night = sets.find(s => s.key === 'night'), light = sets.find(s => s.key === 'light');
    const hidden = !!night && [light, night].some(s => s.tianshu) && [light, night].some(s => !s.tianshu && s.readable);
    const achievements = [
      ...(sets.some(s => s.tianshu) ? ['天書'] : []),
      ...(hidden ? ['暗藏玄機'] : []),
      ...(night && !night.darkBg && light.darkBg ? ['倒轉天罡'] : []),
    ];
    // 老師不滿：沒用到她的顏色（同一位只講一次）；用到沒人算的顏色三位一起問，某些顏色多一句
    const teachers = [...new Set(missing.map(id => item.teacherColors[id]))];
    const outcomes = [
      ...teachers.map(who => ({ kind: 'displeased', who, say: item.missingSays[who] })),
      ...(foreign.length ? [{ kind: 'displeased', who: item.foreign.who, say: item.foreign.say }] : []),
      ...(item.alsoSays || []).filter(a => a.colors.some(id => used.has(id))).map(a => ({ kind: 'displeased', who: a.who, say: a.say })),
    ];
    const ok = !missing.length && !foreign.length && (sets.every(s => s.readable) || hidden);
    return { complete, ok, sets, missing, foreign, achievements, outcomes };
  }
  // 寫成一句話（工作紀錄、AI 答案卡用）：淺色主題：底色 紫羅蘭、文字 白、……；深色主題：……
  function describe(item, answer) {
    const name = (id) => (item.colors.find(c => c.id === id) || {}).name || '（沒填）';
    return setsOf(answer).map(([key, set]) => `${answer.dark ? `${SET_NAMES[key]}：` : ''}${item.slots.map(s => `${s.name} ${name((set || {})[s.key])}`).join('、')}`).join('；');
  }
  // 成品畫面用的三色：淺色主題那組（沒做深色主題就是唯一那組）的底色、文字、元件色
  function theme(item, answer) {
    const set = answer && answer.light;
    if (!filled(item, set)) return null;
    return { bg: hexOf(item, set.bg), fg: hexOf(item, set.fg), accent: hexOf(item, set.accent) };
  }

  const Palette = { judge, describe, theme, contrast, luminance, TEXT_MIN, COMPONENT_MIN };
  if (typeof module !== 'undefined') module.exports = { Palette };
  else root.Palette = Palette;
})(typeof window !== 'undefined' ? window : globalThis);
