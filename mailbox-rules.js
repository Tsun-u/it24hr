// mailbox-rules.js — 美玲的信箱滿了的規則（純函式，node 和瀏覽器都能用）。
// 信箱超過上限就寄不出信。信照交談分組，一列是一串信：可以封存（搬出信箱，存到選好的封存檔位置）或刪除；
// 刪掉的先進「刪除的郵件」，清空之前還算在容量裡，清空之後才真的少、也救不回來。
// 兩個畫面（她的 OutLuck、自己電腦的郵件管理頁）把點擊翻成動作送進 apply；誰說什麼話寫在劇本（雜事的 on），這裡只回事件。
(function (root) {
  const QUOTA_MB = 2000;
  const SAFE_RATIO = 0.8;                 // 安全線：清到這以下，下午第二輪轉寄進來也不會爆
  const REFILL_AFTER_MIN = 60;            // 第一次寄得出信之後多久，尾牙影片又被轉寄一輪
  const SHARE_FULL_MIN = 30;              // 封存檔放共用槽之後多久，共用槽滿
  const ACCOUNTANT_ASKS_AT = 15 * 60 + 30;   // 會計師最早來要資料的時間（永久刪掉之後至少再隔 ACCOUNTANT_ASKS_MIN）
  const ACCOUNTANT_ASKS_MIN = 60;
  const REFILL = { id: 'video2', subject: 'FW: FW: 尾牙影片（字幕版）', from: '福委 阿德 等 28 人', count: 45, each: 9, kind: 'video', date: '今天', order: 400 };

  // order 是日期先後（越大越新），清單預設照它排；misc 是一千多封小信，不能整串動
  function init() {
    return {
      quota: QUOTA_MB,
      groups: [
        { id: 'video', subject: 'FW: FW: FW: 尾牙影片（大家看看我們主管跳舞）', from: '福委 阿德 等 31 人', count: 46, each: 9, kind: 'video', date: '1/27', order: 27 },
        { id: 'audit', subject: 'RE: 年度查帳資料', from: '林會計師事務所', count: 8, each: 22, kind: 'accountant', date: '10/30', order: 303 },
        { id: 'drafts', subject: '季報表草稿 v1～v12', from: '財務 美玲', count: 12, each: 18, kind: 'draft', date: '10/2', order: 275 },
        { id: 'catalog', subject: '2026 下半年辦公用品型錄', from: '文具廠商', count: 6, each: 15, kind: 'catalog', date: '9/18', order: 261 },
        { id: 'photos', subject: '部門聚餐照片', from: '行政 淑芬', count: 10, each: 6, kind: 'photo', date: '8/9', order: 221 },
        { id: 'news', subject: '公司電子報', from: '公司電子報', count: 120, each: 0.4, kind: 'news', date: '10/31', order: 304 },
        { id: 'misc', subject: '其他往來信件（報帳、簽核、通知）', from: '各處', count: 1830, size: 1016, kind: 'misc', date: '今天', order: 399 },
      ].map(g => ({ ...g, where: 'inbox' })),
      archiveTo: null,          // 'local'｜'share'｜null（第一次封存時才問）
      refillScheduled: false, refilled: false,
      shareScheduled: false, accountantGone: false,
    };
  }
  const groupSize = (g) => (g.size != null ? g.size : g.count * g.each);
  // 信箱用量：收件匣＋刪除的郵件（清空之前都還算）
  const used = (s) => s.groups.filter(g => g.where === 'inbox' || g.where === 'trash').reduce((n, g) => n + groupSize(g), 0);
  const pct = (s) => Math.round(used(s) / s.quota * 1000) / 10;
  const done = (s) => used(s) < s.quota;          // 寄得出信
  const safe = (s) => used(s) <= s.quota * SAFE_RATIO;
  // 清掉了多少：封存搬走的加上清空刪除的郵件真的刪掉的（第二輪轉寄進來的不扣）
  const cleared = (s) => Math.round(s.groups.filter(g => g.where === 'archive' || g.where === 'gone').reduce((n, g) => n + groupSize(g), 0));
  const movable = (g) => g.kind !== 'misc';
  const pick = (s, ids, where) => s.groups.filter(g => ids.includes(g.id) && movable(g) && where.includes(g.where));
  const sizeText = (mb) => `${Math.round(mb)} MB`;

  function apply(prev, action) {
    const state = structuredClone(prev); const now = action.at;
    const out = { state, say: '', events: [] };
    const wasDone = done(prev);
    const later = (after, act) => { (out.later = out.later || []).push({ after, act }); };
    switch (action.type) {
      case 'archiveTo': {
        state.archiveTo = action.place;
        out.say = action.place === 'share' ? '封存檔改放公司共用槽（\\\\fs01\\共用）。' : '封存檔改放這台電腦（D:\\封存）。';
        if (action.place === 'share' && state.groups.some(g => g.where === 'archive') && !state.shareScheduled) { state.shareScheduled = true; later(SHARE_FULL_MIN, { type: 'shareCheck' }); }
        break;
      }
      case 'archive': {
        if (!state.archiveTo) { out.say = '第一次封存，要先選封存檔放哪裡。'; out.needPlace = true; break; }
        const gs = pick(state, action.ids, ['inbox', 'trash']);
        for (const g of gs) g.where = 'archive';
        out.say = gs.length ? `封存了 ${gs.reduce((n, g) => n + g.count, 0)} 封（${sizeText(gs.reduce((n, g) => n + groupSize(g), 0))}）。` : '';
        if (gs.length && state.archiveTo === 'share' && !state.shareScheduled) { state.shareScheduled = true; later(SHARE_FULL_MIN, { type: 'shareCheck' }); }
        break;
      }
      case 'delete': {
        const gs = pick(state, action.ids, ['inbox']);
        for (const g of gs) g.where = 'trash';
        out.say = gs.length ? `${gs.reduce((n, g) => n + g.count, 0)} 封移到「刪除的郵件」。` : '';
        break;
      }
      case 'restore': {
        const gs = pick(state, action.ids, ['trash']);
        for (const g of gs) g.where = 'inbox';
        out.say = gs.length ? `${gs.reduce((n, g) => n + g.count, 0)} 封移回收件匣。` : '';
        break;
      }
      case 'purge': {
        const gs = state.groups.filter(g => g.where === 'trash');
        for (const g of gs) g.where = 'gone';
        out.say = gs.length ? `「刪除的郵件」清空了，少了 ${sizeText(gs.reduce((n, g) => n + groupSize(g), 0))}。` : '「刪除的郵件」本來就是空的。';
        if (gs.some(g => g.kind === 'accountant') && !state.accountantGone) {
          state.accountantGone = true; out.flags = { ...(out.flags || {}), accountantGone: true };
          later(Math.max(ACCOUNTANT_ASKS_MIN, ACCOUNTANT_ASKS_AT - now), { type: 'accountantAsks' });
        }
        break;
      }
      case 'shareCheck':
        if (state.archiveTo === 'share') { out.events.push('shareFull'); out.flags = { shareFull: true }; }
        break;
      case 'accountantAsks':
        out.events.push('accountantAsks');
        break;
      case 'refill':
        if (state.refilled) break;
        state.refilled = true;
        state.groups.push({ ...REFILL, where: 'inbox' });
        if (!done(state)) { out.events.push('refull'); out.flags = { refull: true }; }
        break;
      default: break;
    }
    const isDone = done(state);
    if (isDone && !wasDone) {
      out.done = true;
      if (!state.refillScheduled) { state.refillScheduled = true; later(REFILL_AFTER_MIN, { type: 'refill' }); }
    }
    if (!isDone && wasDone) out.reopen = true;
    return out;
  }
  const blocked = () => false;

  const MailboxRules = { QUOTA_MB, SAFE_RATIO, init, apply, done, blocked, used, pct, safe, cleared, groupSize, movable };
  root.MailboxRules = MailboxRules;
  if (typeof module !== 'undefined') module.exports = { MailboxRules };
})(typeof window !== 'undefined' ? window : globalThis);
