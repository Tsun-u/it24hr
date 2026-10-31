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
  };
  function play(kind) { if (!muted && ctx && ctx.state === 'running' && SOUNDS[kind]) SOUNDS[kind](); }
  function setMuted(off) { muted = off; try { localStorage.setItem(KEY, off ? 'off' : 'on'); } catch { /* 同上 */ } }

  root.Sound = { play, unlock, setMuted, get muted() { return muted; } };
})(window);
