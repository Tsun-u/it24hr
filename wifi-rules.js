// wifi-rules.js — 老闆娘手機連不上 Wi-Fi 的規則（純函式，node 和瀏覽器都能用）。
// 原因：公司基地台開著 MAC 過濾（白名單），她換了新手機、手機又開著私人位址（用隨機的 MAC 連線），密碼對了還是被擋。
// 兩個畫面（她的手機設定、基地台管理頁）把點擊翻成動作送進 apply；誰說什麼話寫在劇本（雜事的 on），這裡只回發生了什麼事件。
(function (root) {
  const REAL_MAC = '7C:2E:0D:41:9A:B3';      // 手機真正的 MAC（關掉私人位址才用這個）
  const PRIVATE_MAC = 'D6:5F:13:8A:2C:7E';   // 私人位址：第一組的第二個字是 2、6、A、E 的是隨機產生的
  const SECURITY_CHECK_MIN = 30;             // 過濾關掉後多久資安會發現
  const PRINT_FAIL_MIN = 30;                 // 用訪客網路多久後她會發現印不到
  const at = (h, m) => h * 60 + m;

  // 白名單裡本來就有的公司設備；連線紀錄裡 10:58 那筆被擋的是她，其他是雜訊
  function init() {
    return {
      phone: { private: true, network: 'office', retyped: 0 },
      ap: { filter: true, whitelist: ['00:1B:63:5D:8E:20', 'F0:9F:C2:11:6B:44'], reboots: 0 },
      log: [
        { at: at(8, 47), mac: '3A:91:C4:07:EE:12', result: 'blocked' },
        { at: at(9, 12), mac: '00:1B:63:5D:8E:20', result: 'ok' },
        { at: at(10, 31), mac: 'F0:9F:C2:11:6B:44', result: 'ok' },
        { at: at(10, 58), mac: PRIVATE_MAC, result: 'blocked' },
      ],
      connected: null,       // 'office'｜'guest'｜null
      printFailed: false,    // 用訪客網路印不到了
      securityScheduled: false,
    };
  }
  const phoneMac = (s) => (s.phone.private ? PRIVATE_MAC : REAL_MAC);
  const done = (s) => s.connected === 'office' || (s.connected === 'guest' && !s.printFailed);
  // 靠私人位址連上的（只登記了隨機的 MAC）：連得上，但她哪天重設網路就又不行了
  const privateListed = (s) => s.connected === 'office' && s.ap.filter && s.phone.private && s.ap.whitelist.includes(PRIVATE_MAC);

  // 手機用目前選的網路重連一次：公司網路要過 MAC 過濾（過不了就在紀錄記一筆擋下），訪客網路一律連得上
  function reconnect(s, now) {
    if (s.phone.network === 'guest') { s.connected = 'guest'; return; }
    const mac = phoneMac(s);
    const ok = !s.ap.filter || s.ap.whitelist.includes(mac);
    s.connected = ok ? 'office' : null;
    s.log.push({ at: now, mac, result: ok ? 'ok' : 'blocked' });
  }
  const status = (s) => (s.connected === 'office' ? '連上公司網路了。' : s.connected === 'guest' ? '連上訪客網路了。' : '還是無法加入網路。');

  function apply(prev, action) {
    const state = structuredClone(prev); const now = action.at;
    const out = { state, say: '', events: [] };
    const wasDone = done(prev);
    switch (action.type) {
      case 'retype':
        state.phone.retyped += 1;
        if (state.phone.network === 'office' && !state.connected) reconnect(state, now);
        out.say = status(state);
        break;
      case 'togglePrivate':
        state.phone.private = !state.phone.private;
        if (state.phone.network === 'office') reconnect(state, now);
        out.say = `${state.phone.private ? '打開' : '關掉'}私人位址，手機重新連線……${status(state)}`;
        break;
      case 'join':
        state.phone.network = action.network;
        reconnect(state, now);
        out.say = status(state);
        if (action.network === 'guest') { out.flags = { guest: true }; out.later = [{ after: PRINT_FAIL_MIN, act: { type: 'printFail' } }]; }
        break;
      case 'whitelist':
        if (!state.ap.whitelist.includes(action.mac)) state.ap.whitelist.push(action.mac);
        out.say = `${action.mac} 加進白名單了。`;
        if (state.phone.network === 'office' && !state.connected && phoneMac(state) === action.mac) reconnect(state, now);
        break;
      case 'filter':
        state.ap.filter = action.on;
        if (!action.on) {
          out.say = 'MAC 過濾關掉了，誰都連得上。';
          out.flags = { filterOff: true };
          if (!state.securityScheduled) { state.securityScheduled = true; out.later = [{ after: SECURITY_CHECK_MIN, act: { type: 'securityCheck' } }]; }
          if (state.phone.network === 'office' && !state.connected) reconnect(state, now);
        } else {
          out.say = 'MAC 過濾打開了。';
          // 打開時沒登記的裝置會被踢掉
          if (state.connected === 'office' && !state.ap.whitelist.includes(phoneMac(state))) reconnect(state, now);
        }
        break;
      case 'reboot':
        state.ap.reboots += 1;
        out.events.push('outage');
        out.flags = { reboots: state.ap.reboots };
        if (state.phone.network === 'office') reconnect(state, now);
        out.say = '基地台重新啟動，全公司的 Wi-Fi 斷了一陣子。';
        break;
      case 'securityCheck':
        out.events.push('securityMail');
        break;
      case 'printFail':
        if (state.connected === 'guest' && !state.printFailed) { state.printFailed = true; out.events.push('printFail'); }
        break;
      default: break;
    }
    const isDone = done(state);
    if (isDone && !wasDone) { out.done = true; out.events.push('connected'); }
    if (!isDone && wasDone) out.reopen = true;
    return out;
  }
  const blocked = () => false;   // 沒有拆到一半不能用的狀態

  const WifiRules = { REAL_MAC, PRIVATE_MAC, init, apply, done, blocked, privateListed };
  root.WifiRules = WifiRules;
  if (typeof module !== 'undefined') module.exports = { WifiRules };
})(typeof window !== 'undefined' ? window : globalThis);
