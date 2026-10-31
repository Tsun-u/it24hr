// clock.js — 遊戲時鐘。09:00 坐到桌前起算，真實毫秒換算成遊戲分鐘。
// 暫停有多個來源（玩家按暫停、提示等玩家按按鈕），任一來源在就不走。
// 到點事件用 at(minute, fn) 登記，時間跨過那一分鐘就觸發一次。
(function (root) {
  const { C } = typeof require === 'function' ? require('./contract.js') : root;

  class Clock {
    constructor() {
      this.elapsedMin = 0;          // 從 09:00 起過了幾個遊戲分鐘
      this.carryMs = 0;             // 不滿一分鐘的毫秒
      this.pauses = new Set();
      this.timers = [];             // { minute, fn, fired }
    }
    get minute() { return C.DAY_START_MIN + this.elapsedMin; }
    get isPaused() { return this.pauses.size > 0; }
    pause(reason) { this.pauses.add(reason); }
    resume(reason) { this.pauses.delete(reason); }
    label() {
      const m = this.minute % (24 * 60);
      return `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;
    }
    at(minute, fn) {
      this.timers.push({ minute, fn, fired: false });
      this.timers.sort((a, b) => a.minute - b.minute);
    }
    advance(ms) {
      if (this.isPaused) return;
      this.carryMs += ms;
      const whole = Math.floor(this.carryMs / C.MS_PER_GAME_MIN);
      if (whole <= 0) return;
      this.carryMs -= whole * C.MS_PER_GAME_MIN;
      this.spend(whole);
    }
    // 到點事件照時間順序觸發，觸發時時鐘停在那一分鐘（回呼裡讀到的是事件當下的時間，
    // 回呼裡新登記、也落在這段裡的事件一樣會被撿到），全部處理完才跳到終點。
    spend(minutes) {
      const target = this.elapsedMin + minutes;
      let t;
      while ((t = this.timers.find(x => !x.fired && x.minute - C.DAY_START_MIN <= target))) {
        t.fired = true;
        this.elapsedMin = Math.max(this.elapsedMin, t.minute - C.DAY_START_MIN);
        t.fn(this);
      }
      this.elapsedMin = target;
    }
  }

  if (typeof module !== 'undefined') module.exports = { Clock };
  else root.Clock = Clock;
})(typeof window !== 'undefined' ? window : globalThis);
