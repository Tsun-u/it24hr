// bench-printer.js — 換碳粉匣工作台的規則（純函式，node 和瀏覽器都能用）。
// 淑芬那台 MP LazyJet C8763：外殼只剩「MP Lazy」，背面財產貼紙剩「Jet C8763」。碳粉匣照機型字首分系列，只有 C 系列裝得進去。
// 狀態存在 engine，畫面照狀態畫、把點擊翻成動作送進 apply；廠商送來的碳粉匣由 engine 用 deliver 放上桌
(function (root) {
  const FITS = 'C';            // 這台吃的系列
  const STARBURST = 16;        // 同一盒搖到第 16 下：星爆十六連擊；裝進去的那盒剛好搖了 16 下（不多不少）是成就
  const SHAKE_LINES = { 5: '要更快', 10: '還要更快！', [STARBURST]: '良し！' };

  // oldSeries：原本裝在裡面那盒的系列（就是這台吃的），畫面照它上色
  function init() {
    return { sticker: false, cover: 'closed', opened: false, old: 'in', oldSeries: FITS, carts: [], page: null };
  }
  // 廠商送到：每個系列一盒，放在桌上、封條還在
  function deliver(prev, series) {
    const state = structuredClone(prev);
    for (const s of series) state.carts.push({ id: `cart-${s}`, series: s, shakes: 0, seal: true, at: 'desk' });
    return state;
  }

  const inPrinter = (state) => state.carts.find(c => c.at === 'printer');

  function apply(prev, action) {
    const state = structuredClone(prev);
    const out = { state, say: '', events: [] };
    const cart = action.cart ? state.carts.find(c => c.id === action.cart) : null;
    switch (action.type) {
      case 'sawBack':
        if (!state.sticker) { state.sticker = true; out.events.push('sticker'); out.flags = { sawSticker: true }; }
        out.say = '背面的財產貼紙：「Jet C8763」。';
        break;
      case 'open':
        // 第一次打開：印表機要停一下，跟旁邊的淑芬打聲招呼（彩蛋）
        out.say = state.cover === 'open' ? '前蓋已經開著。'
          : '打開前蓋，看得到裡面的碳粉匣。' + (state.opened ? '' : '\n你：「幫我撐十秒！」淑芬：「好，知道了，換快一點。」');
        state.cover = 'open'; state.opened = true;
        break;
      case 'close':
        state.cover = 'closed'; out.say = '關上前蓋。';
        break;
      case 'pullOld':
        if (state.cover !== 'open') { out.say = '前蓋還關著。'; break; }
        if (state.old !== 'in') { out.say = '舊的已經拿出來了。'; break; }
        state.old = 'out'; out.say = '舊碳粉匣抽出來了，手上沾到一點黑粉。';
        break;
      case 'pull':
        if (!cart || cart.at !== 'printer') break;
        if (state.cover !== 'open') { out.say = '前蓋還關著。'; break; }
        cart.at = 'desk'; out.say = '把碳粉匣拉出來。';
        break;
      case 'shake':
        if (!cart || cart.at !== 'desk') break;
        cart.shakes += 1;
        out.say = SHAKE_LINES[cart.shakes] || '沙沙沙……';
        if (cart.shakes === STARBURST) out.events.push('starburst');
        break;
      case 'peel':
        if (!cart) break;
        if (cart.at !== 'desk') { out.say = '要先拿出來才撕得到封條。'; break; }
        if (!cart.seal) { out.say = '封條已經撕掉了。'; break; }
        cart.seal = false; out.say = '撕掉封條。';
        break;
      case 'insert': {
        if (!cart || cart.at !== 'desk') break;
        if (state.cover !== 'open') { out.say = '前蓋還關著。'; break; }
        if (state.old === 'in') { out.say = '舊的還在裡面，要先抽出來。'; break; }
        if (inPrinter(state)) { out.say = '裡面已經有一盒了。'; break; }
        if (cart.series !== FITS) { out.events.push('refused'); out.say = `推不進去，${cart.series} 系列不是這台的。`; break; }
        cart.at = 'printer'; out.say = '喀一聲，裝進去了。';
        out.flags = { starburst: cart.shakes === STARBURST };   // 抽出來再搖、重裝，照最後裝進去那次算
        break;
      }
      case 'print': {
        if (state.cover === 'open') { out.say = '前蓋沒關，印表機亮紅燈。'; break; }
        const installed = inPrinter(state);
        if (state.old === 'in') { state.page = 'faint'; out.say = '還是碳粉不足，印出來淡淡的。'; break; }
        if (!installed) { out.say = '沒有碳粉匣，印不出來。'; break; }
        if (installed.seal) { state.page = 'blank'; out.events.push('blank'); out.say = '測試頁一片空白。'; break; }
        state.page = 'ok'; out.events.push('printed'); out.done = true; out.say = '測試頁印出來了，字很清楚。';
        break;
      }
      default: break;   // 同事等太久自己動手（diy）：印表機淑芬不會自己修
    }
    return out;
  }

  const done = (state) => state.page === 'ok';
  // 人走開時印表機能不能用：前蓋開著、或舊的抽掉新的還沒裝，淑芬就會催
  const blocked = (state) => state.cover === 'open' || (state.old === 'out' && !inPrinter(state));
  const carrying = () => ({ items: [], heavy: false });

  const BenchPrinter = { FITS, init, deliver, apply, done, blocked, carrying };
  root.BenchPrinter = BenchPrinter;
  if (typeof module !== 'undefined') module.exports = { BenchPrinter };
})(typeof window !== 'undefined' ? window : globalThis);
