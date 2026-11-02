// bench-loader.js — 打開 3D 工作台：一塊蓋住辦公桌的面板＋載入中，要用時才用 import() 載 bench-view.js（ES module）。
// 載入中暫停時鐘，第一幀畫好或載入失敗都恢復；用工作台的時候時間照走。
// 「收工」把 three.js 拆乾淨（主迴圈不管它）
(function (root) {
  const TAG = 'bench-loading';
  const BenchLoader = {
    open({ host, engine, scene }) {
      const panel = document.createElement('div'); panel.className = 'bench-panel';
      panel.innerHTML = `<div class="bench-stage"><div class="bench-loading" role="status"><span class="bench-spinner" aria-hidden="true"></span><span class="bench-loading-text">正在把電腦搬上桌…</span></div></div>
        <div class="bench-bar"><p class="bench-msg"></p><button class="btn primary bench-close" type="button">收工</button></div>`;
      host.append(panel);
      const stage = panel.querySelector('.bench-stage'); const msg = panel.querySelector('.bench-msg');
      let handle = null; let closed = false;
      engine.clock.pause(TAG);
      const ready = () => { panel.querySelector('.bench-loading').classList.add('done'); engine.clock.resume(TAG); };
      const onEvent = (ev) => { if (ev.type === 'say') msg.textContent = ev.text; engine.emit('bench:event', { scene, ...ev }); };
      import('./bench-view.js').then((mod) => {
        if (closed) return;
        handle = mod.mount(stage, { scene, onReady: ready, onEvent });
      }).catch(() => {
        panel.querySelector('.bench-spinner').remove();
        panel.querySelector('.bench-loading-text').textContent = '電腦沒搬上來（載入失敗），收工再試一次。';
        engine.clock.resume(TAG);
      });
      panel.querySelector('.bench-close').addEventListener('click', () => {
        closed = true;
        if (handle) handle.unmount();
        panel.remove(); engine.clock.resume(TAG);
        engine.emit('bench:closed', { scene });
      });
      return panel;
    },
  };
  root.BenchLoader = BenchLoader;
})(window);
