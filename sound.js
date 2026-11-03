// sound.js — 電腦通知的提示音：Web Audio 現場合成，不放音檔。LIME 是兩聲短的「啵啵」、信箱是一聲「叮」。
// 靜音記在這台瀏覽器（localStorage），讀不到就當有聲音。
(function (root) {
  const KEY = 'it24hr.sound';
  let ctx = null;
  let muted = false;
  try { muted = localStorage.getItem(KEY) === 'off'; } catch { /* 無痕視窗：當有聲音 */ }

  // 瀏覽器要玩家點過畫面才給出聲：每次點畫面都確認一次聲音是開著的
  function unlock() {
    const Ctx = root.AudioContext || root.webkitAudioContext; if (!Ctx) return;
    if (!ctx) ctx = new Ctx();
    if (ctx.state === 'suspended') ctx.resume();
  }
  // 一個音：起音 5ms，之後指數衰減到聽不見
  function tone(freq, start, length, volume) {
    const t = ctx.currentTime + start;
    const osc = ctx.createOscillator(); const gain = ctx.createGain();
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(volume, t + 0.005);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + length);
    osc.connect(gain).connect(ctx.destination);
    osc.start(t); osc.stop(t + length + 0.02);
  }
  const SOUNDS = {
    line: () => { tone(880, 0, 0.12, 0.12); tone(1320, 0.09, 0.16, 0.12); },
    mail: () => { tone(1046.5, 0, 0.6, 0.1); tone(2093, 0, 0.35, 0.03); },
    connect: () => { tone(440, 0, 0.7, 0.07); tone(480, 0, 0.7, 0.07); },   // 電話接通：嘟——
  };
  const audible = () => !muted && ctx && ctx.state === 'running';
  function play(kind) { if (audible() && SOUNDS[kind]) SOUNDS[kind](); }

  // 循環播放的：等候音樂是《給愛麗絲》開頭（貝多芬，公有領域；電話等候的經典）。每一輪開始前看一次靜音
  const ELISE = [[659.25, 0], [622.25, 0.2], [659.25, 0.4], [622.25, 0.6], [659.25, 0.8], [493.88, 1], [587.33, 1.2], [523.25, 1.4], [440, 1.6]];
  const LOOPS = { hold: { every: 2.6, play: () => ELISE.forEach(([freq, at], i) => tone(freq, at, i === ELISE.length - 1 ? 0.8 : 0.22, 0.05)) } };
  function loop(kind) {
    const spec = LOOPS[kind]; if (!spec) return () => {};
    const once = () => { if (audible()) spec.play(); };
    once();
    const id = setInterval(once, spec.every * 1000);
    return () => clearInterval(id);
  }
  // 撥號按鍵音（DTMF）：每個鍵是一個低頻（列）加一個高頻（欄）同時響
  const DTMF_ROW = { 1: 697, 2: 697, 3: 697, 4: 770, 5: 770, 6: 770, 7: 852, 8: 852, 9: 852, '*': 941, 0: 941, '#': 941 };
  const DTMF_COL = { 1: 1209, 4: 1209, 7: 1209, '*': 1209, 2: 1336, 5: 1336, 8: 1336, 0: 1336, 3: 1477, 6: 1477, 9: 1477, '#': 1477 };
  function key(k) { if (audible() && DTMF_ROW[k]) { tone(DTMF_ROW[k], 0, 0.15, 0.05); tone(DTMF_COL[k], 0, 0.15, 0.05); } }
  function setMuted(off) { muted = off; try { localStorage.setItem(KEY, off ? 'off' : 'on'); } catch { /* 同上 */ } }

  root.Sound = { play, loop, key, unlock, setMuted, get muted() { return muted; } };
})(window);
