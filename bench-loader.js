// bench-loader.js — 打開 3D 工作台：一塊蓋住辦公桌的面板＋載入中，要用時才用 import() 載 bench-view.js（ES module）。
// 載入中暫停時鐘，第一幀畫好或載入失敗都恢復；用工作台的時候時間照走。
// 「收工」把 three.js 拆乾淨（主迴圈不管它）
(function (root) {
  const TAG = 'bench-loading';
  const LOADING = { ram: '正在把電腦搬上桌…', printer: '正在把印表機轉過來…' };   // 每個場景載入時的那句
  const BenchLoader = {
    // chore：這個工作台是哪件雜事的（狀態存在 engine，畫面拿 state 畫、用 act 送動作）
    open({ host, engine, scene, chore }) {
      const panel = document.createElement('div'); panel.className = 'bench-panel';
      panel.innerHTML = `<div class="bench-stage"><div class="bench-loading" role="status"><span class="bench-spinner" aria-hidden="true"></span><span class="bench-loading-text">${LOADING[scene] || '正在準備工作台…'}</span></div></div>
        <div class="bench-bar"><p class="bench-msg"></p><button class="btn primary bench-close" type="button">收工</button></div>`;
      host.append(panel);
      const stage = panel.querySelector('.bench-stage'); const msg = panel.querySelector('.bench-msg');
      let handle = null; let closed = false;
      engine.clock.pause(TAG);
      const ready = () => { panel.querySelector('.bench-loading').classList.add('done'); engine.clock.resume(TAG); };
      const onEvent = (ev) => {
        if (ev.type === 'say' && ev.text) msg.textContent = ev.text;
        if (ev.type === 'turns') engine.benchTurned(chore);
        engine.emit('bench:event', { scene, ...ev });
      };
      const ctx = chore ? { state: engine.benchState(chore), act: (action) => engine.benchAct(chore, action) } : {};
      import('./bench-view.js').then((mod) => {
        if (closed) return;
        handle = mod.mount(stage, { scene, ...ctx, onReady: ready, onEvent });
        if (root.__game) root.__game.bench = handle;   // 瀏覽器驗收用：看狀態、找零件
      }).catch(() => {
        panel.querySelector('.bench-spinner').remove();
        panel.querySelector('.bench-loading-text').textContent = '電腦沒搬上來（載入失敗），收工再試一次。';
        engine.clock.resume(TAG);
      });
      panel.querySelector('.bench-close').addEventListener('click', () => {
        closed = true;
        if (handle) handle.unmount();
        if (root.__game) root.__game.bench = null;
        panel.remove(); engine.clock.resume(TAG);
        if (chore) engine.closeBench(chore); else engine.emit('bench:closed', { scene });
      });
      return panel;
    },
  };
  root.BenchLoader = BenchLoader;
})(window);
