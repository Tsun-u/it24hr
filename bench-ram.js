// bench-ram.js — 加記憶體工作台的規則（純函式，node 和瀏覽器都能用）。
// 狀態存在 engine（收工、走開都不會掉），工作台畫面照狀態畫，把點擊翻成動作送進 apply；
// apply 當下就算出新狀態和要講的話，畫面拿前後差播動畫。需要等的事（關機、磁碟檢查）由畫面計時，時間到送 shutdownDone、checkDone
(function (root) {
  const BOARD = { gen: 'DDR4', form: 'DIMM' };          // 君傑的主機板吃的記憶體
  const SLOTS = ['A1', 'A2', 'B1', 'B2'];
  const PAIRS = [['A1', 'B1'], ['A2', 'B2']];           // 同一組兩個都插才是雙通道
  const ORIGINAL_GB = 8;                                 // 君傑電腦原本的容量
  const PRESS_POWER = '按正面的電源鈕開機。';
  const DARK_SCREEN = '主機的電源燈亮了，可是螢幕黑黑的。';
  const EXCEL_CRY = '君傑：「欸欸欸！我的 Excel 還沒存！」';

  // 貼紙只寫世代和容量，筆電用的 SO-DIMM 要看長短才看得出來
  const label = (stick) => `${stick.gen} ${stick.size}GB`;
  // 各世代的規格：notch 是金手指缺口離中心多遠（桌機 DIMM 長 1.33 的 3D 單位，DDR4 剛好對上君傑主機板插槽的凸點），
  // speed、pc 是貼紙上真的會印的兩行
  const SPECS = {
    DDR3: { notch: 0.30, speed: 'DDR3-1600', pc: 'PC3-12800' },
    DDR4: { notch: 0.17, speed: 'DDR4-2666', pc: 'PC4-21300' },
    DDR5: { notch: -0.05, speed: 'DDR5-4800', pc: 'PC5-38400' },
  };
  const withSpec = (stick) => ({ ...stick, notch: SPECS[stick.gen].notch, sticker: [`${stick.size}GB ${SPECS[stick.gen].speed}`, SPECS[stick.gen].pc] });
  const installed = (state) => state.sticks.filter(s => SLOTS.includes(s.where));
  const hasPower = (state) => state.plugged && state.psuOn;
  // 君傑能不能工作：電腦開著才能
  const blocked = (state) => !state.powered;

  function memoryText(state) {
    if (state.shown == null) return null;
    const sticks = installed(state);
    if (sticks.length < 2) return `${state.shown} GB`;
    const dual = PAIRS.some(pair => pair.every(slot => sticks.some(s => s.where === slot)));
    return `${state.shown} GB（${dual ? '雙通道' : '單通道'}）`;
  }

  function init(box = []) {
    return {
      powered: true, plugged: true, psuOn: true, display: true,
      screws: 3, screwsOut: [false, false, false], panelOff: false, opened: false,
      excel: 'unsaved',            // unsaved → saved → closed（關機就關掉）
      menu: false, prompt: false, shuttingDown: false, lostOnShutdown: false,
      dirty: false, check: null,   // dirty：上次沒有正常關機；check：開機時檢查磁碟（'running'）
      shown: null, shownText: null,   // 開機後螢幕上的容量（GB）和那一行字（含雙通道、單通道）
      sticks: [{ id: 'old', gen: 'DDR4', form: 'DIMM', size: 8, where: 'A2' }, ...box.map((s, i) => ({ id: `box${i}`, ...s, where: 'box' }))].map(withSpec),
    };
  }

  // 料箱（自己座位）：拿一條放手上，手上原本那條放回去
  function take(prev, id) {
    const state = structuredClone(prev);
    for (const s of state.sticks) if (s.where === 'hand') s.where = 'box';
    const stick = state.sticks.find(s => s.id === id);
    if (stick && stick.where === 'box') stick.where = 'hand';
    return state;
  }
  // 整箱搬：料箱裡每條都到手上（帶到同事座位全部擺在桌上）
  function takeAll(prev) {
    const state = structuredClone(prev);
    for (const s of state.sticks) if (s.where === 'box') s.where = 'hand';
    return state;
  }
  function stow(prev) {
    const state = structuredClone(prev);
    for (const s of state.sticks) if (s.where === 'hand') s.where = 'box';
    return state;
  }

  // 開機、檢查完、螢幕線插回時接在後面的容量報告；比原本的 8 GB 多就算裝好（12 GB、單通道 16 GB 都算，結算卡評語不同），回報 installed
  function report(state, out) {
    const sticks = installed(state);
    if (state.shown > ORIGINAL_GB) { out.events.push('installed'); return `螢幕顯示 ${state.shown} GB，安裝成功，可以回報君傑了。`; }
    if (sticks.length === 1 && sticks[0].id === 'old') return `螢幕顯示 ${state.shown} GB，新的那條還沒裝。`;
    if (sticks.length === 1) return `螢幕顯示 ${state.shown} GB，只認到一條。`;
    return `螢幕顯示 ${state.shown} GB。`;
  }

  function powerOff(state) {
    Object.assign(state, { powered: false, menu: false, prompt: false, shuttingDown: false, lostOnShutdown: false, check: null, shown: null, shownText: null });
  }
  // 沒照順序關機（按住電源鈕、開著斷電）：下次開機要先檢查磁碟，報價單沒存就沒了
  function forceOff(state, out, what) {
    const lost = state.excel === 'unsaved';
    powerOff(state); state.dirty = true; state.excel = 'closed';
    if (lost) out.events.push('lostExcel');
    out.say = lost ? `${what}${EXCEL_CRY}` : what;
  }
  function shutDown(state, out, lost, lead = '') {
    state.shuttingDown = true; state.lostOnShutdown = lost;
    out.say = `${lead}正在關機…`;
  }
  function showMemory(state, out, lead) {
    state.shown = installed(state).reduce((n, s) => n + s.size, 0);
    state.shownText = memoryText(state);
    out.say = state.display ? lead + report(state, out) : '';
  }
  function boot(state, out) {
    state.powered = true; state.menu = false;
    if (!installed(state).length) { out.say = '主機嗶嗶叫，螢幕一直是黑的。'; return; }
    if (state.dirty) { state.check = 'running'; out.say = state.display ? '開機了。上次沒有正常關機，系統要先檢查磁碟，等它跑完。' : DARK_SCREEN; return; }
    showMemory(state, out, '開機了，');
    if (!state.display) out.say = DARK_SCREEN;
  }

  // 點螢幕：畫面算出點到哪一塊（target），這裡決定發生什麼
  function onScreen(state, out, target) {
    if (!state.powered) { out.say = '螢幕是黑的，電腦沒開。'; return; }
    if (!state.display) { out.say = '螢幕黑黑的，可是主機的電源燈亮著。'; return; }
    if (state.check) { out.say = '系統在檢查磁碟，等它跑完。'; return; }
    if (state.shuttingDown) return;
    if (state.prompt) {   // 「要儲存嗎？」開著：只能按那三顆
      if (target === 'promptSave') { state.prompt = false; state.excel = 'saved'; shutDown(state, out, false, '先存報價單，再關機。'); }
      else if (target === 'promptDiscard') { state.prompt = false; shutDown(state, out, true); }
      else if (target === 'promptCancel') { state.prompt = false; out.say = '不關機了。'; }
      return;
    }
    if (state.menu && target === 'shutdown') {
      state.menu = false;
      if (state.excel === 'unsaved') { state.prompt = true; out.say = '螢幕跳出來問：報價單還沒存，要儲存嗎？'; return; }
      shutDown(state, out, false); return;
    }
    if (state.excel !== 'closed' && target === 'save') {
      if (state.excel === 'unsaved') { state.excel = 'saved'; out.say = '幫君傑把報價單存好了。'; }
      return;
    }
    state.menu = target === 'start' ? !state.menu : false;
  }

  function insert(state, out, stick, slot, flipped) {
    if (!stick) {
      const loose = state.sticks.some(s => s.where === 'hand' || s.where === 'desk');
      out.say = loose ? '先點桌上的記憶體拿起來。' : '手上沒有記憶體。新的要回座位從舊料箱拿。';
      return;
    }
    const refuse = (why, text) => { out.events.push(`refused:${why}`); out.say = text; };
    if (!state.panelOff) return refuse('panel', '側板還沒拆。');
    if (state.sticks.some(s => s.where === slot)) return refuse('occupied', '這個插槽已經有一條了。');
    if (hasPower(state)) return refuse('power', '電源還沒切斷，先拔電源線或關掉電源供應器的開關，再插記憶體。');
    if (flipped) return refuse('flipped', '插不進去：金手指的缺口跟插槽的凸點對不上。點記憶體轉 180° 再試。');
    if (stick.gen !== BOARD.gen) return refuse('gen', '插不進去：轉過來也對不上，缺口的位置根本不一樣。');
    if (stick.form !== BOARD.form) return refuse('form', '插不進去：這條比插槽短一截。');
    stick.where = slot; out.events.push('seated');
    const restore = [!state.plugged && '插回電源線', !state.psuOn && '把電源供應器的開關切回 I'].filter(Boolean).join('、');
    out.say = `喀一聲，卡榫扣上了（${slot}）。${restore}，${PRESS_POWER}`;
  }

  function apply(prev, action) {
    const state = structuredClone(prev);
    const out = { state, say: '', events: [] };
    const stick = action.stick ? state.sticks.find(s => s.id === action.stick) : null;
    switch (action.type) {
      case 'screen': onScreen(state, out, action.target); break;
      case 'shutdownDone': {
        if (!state.shuttingDown) break;   // 關機途中被斷電，已經照強制關機處理了
        const lost = state.lostOnShutdown;
        state.excel = 'closed'; powerOff(state);
        if (lost) out.events.push('lostExcel');
        out.say = `關機了。${lost ? EXCEL_CRY : ''}接著到背面斷電：拔掉電源線，或關掉電源供應器的開關。`;
        break;
      }
      case 'power':
        if (state.shuttingDown) break;
        if (state.powered) forceOff(state, out, '你按著電源鈕強制關機了。');
        else if (!state.plugged) out.say = '按了沒反應：電源線沒插。到背面把插頭插回去。';
        else if (!state.psuOn) out.say = '按了沒反應：電源供應器的開關關著。到背面把它切回 I。';
        else boot(state, out);
        break;
      case 'checkDone':
        if (state.check !== 'running') break;
        state.check = null; state.dirty = false;
        showMemory(state, out, '磁碟檢查完了，');
        break;
      case 'psu':
        state.psuOn = !state.psuOn;
        if (!state.psuOn && state.powered) forceOff(state, out, '電腦還開著你就關掉電源供應器了。');
        else out.say = state.psuOn ? `電源供應器的開關切回 I。${state.plugged ? PRESS_POWER : ''}` : '電源供應器的開關切到 O，斷電了。';
        break;
      case 'plug':
        state.plugged = !state.plugged;
        if (!state.plugged && state.powered) forceOff(state, out, '電腦還開著你就拔電源了。');
        else out.say = state.plugged ? `電源線插回去了。${state.psuOn ? PRESS_POWER : ''}` : '電源線拔掉了。';
        break;
      case 'display':
        state.display = !state.display; state.menu = false;
        if (!state.display) out.say = state.powered ? '螢幕線拔掉了，螢幕黑掉了。' : '螢幕線拔掉了。';
        else if (!state.powered) out.say = '螢幕線插回去了。';
        else out.say = `螢幕線插回去了，螢幕又亮了。${state.shown != null ? report(state, out) : ''}`;
        break;
      case 'screw': {
        const i = action.i;
        if (!state.screwsOut[i]) {
          state.screwsOut[i] = true; state.screws -= 1;
          out.say = state.screws ? `鬆開一顆，先放在機殼頂上，還有 ${state.screws} 顆。` : '螺絲都鬆開了，先放在機殼頂上。點側板拆下來。';
        } else if (state.panelOff) out.say = '側板還沒裝回去，螺絲鎖不上。';
        else {
          state.screwsOut[i] = false; state.screws += 1;
          out.say = state.screws < 3 ? `鎖回一顆，還有 ${3 - state.screws} 顆。` : '螺絲都鎖回去了，機殼恢復原狀。';
        }
        break;
      }
      case 'panel':
        if (!state.panelOff) {
          if (state.screws) { out.say = `側板拆不下來：背面還有 ${state.screws} 顆螺絲。`; break; }
          state.panelOff = true;
          if (!state.opened) { state.opened = true; out.events.push('opened'); }
          out.say = '側板拆下來了。主機板上有四個插槽，藍色那兩個是一組。';
        } else if (action.holding) out.say = '手上還拿著記憶體，先放回桌上或插好。';
        else { state.panelOff = false; out.say = state.screws < 3 ? '側板裝回去了，螺絲還放在機殼頂上。' : '側板裝回去了。'; }
        break;
      case 'pick':
        if (stick) out.say = `記憶體拿起來了（貼紙：${label(stick)}）。看金手指的缺口跟插槽的凸點對不對得上，點記憶體可以轉 180°，點插槽插進去。`;
        break;
      case 'look':
        if (stick) out.say = `這條的貼紙寫著 ${label(stick)}。電腦還開著，先不要拔。`;
        break;
      case 'insert': insert(state, out, stick, action.slot, action.flipped); break;
      case 'pull':
        if (!stick || !SLOTS.includes(stick.where)) break;
        if (state.powered) out.say = '電腦還開著，先從「開始」關機再拔記憶體。';
        else if (hasPower(state)) out.say = '電源還沒切斷，先拔電源線或關掉電源供應器的開關，再拔記憶體。';
        else { stick.where = 'desk'; out.events.push('pulled'); out.say = `扳開卡榫，記憶體拔出來了（貼紙：${label(stick)}）。點別的插槽改插，點旁邊放回桌上。`; }
        break;
      case 'diy': {   // 君傑等太久自己動手：看得到的才會動，側板拆了才把舊的拔下來放桌上
        const old = state.sticks.find(s => s.id === 'old');
        if (state.panelOff && SLOTS.includes(old.where)) { old.where = 'desk'; out.events.push('diy'); }
        break;
      }
      default: break;
    }
    // 給 engine 的結果：裝好就結案（記下螢幕顯示的容量給結算卡評語），報價單沒存要記著
    if (out.events.includes('installed')) { out.done = true; out.flags = { shown: { size: state.shown, text: state.shownText } }; }
    if (out.events.includes('lostExcel')) out.flags = { ...out.flags, lostExcel: true };
    return out;
  }

  // 手上拿著的記憶體；兩條以上＝整箱搬著走，走路比較久
  function carrying(state) {
    const items = state.sticks.filter(s => s.where === 'hand');
    return { items, heavy: items.length >= 2 };
  }

  const BenchRam = { SLOTS, init, apply, take, takeAll, stow, label, installed, memoryText, blocked, hasPower, carrying, countsTurns: true };
  root.BenchRam = BenchRam;
  if (typeof module !== 'undefined') module.exports = { BenchRam };
})(typeof window !== 'undefined' ? window : globalThis);
