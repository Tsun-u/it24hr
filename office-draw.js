// office-draw.js — 正式上班的抽劇本畫面：按「上班」後打開，抽到的關卡顯示名稱和說明，可以重抽、上班、退出；
// 玩過的關（任何一個時代玩完過）列在下面，點了直接選。上面寫已玩幾關／總共幾關
(function (root) {
  const h = (tag, cls, text) => { const n = document.createElement(tag); if (cls) n.className = cls; if (text !== undefined) n.textContent = text; return n; };
  const button = (cls, text, onClick) => { const b = h('button', `btn ${cls}`.trim(), text); b.type = 'button'; b.addEventListener('click', onClick); return b; };
  let overlay = null;
  const onKey = (e) => { if (e.key === 'Escape') close(); };
  function close() { if (overlay) { overlay.remove(); overlay = null; document.removeEventListener('keydown', onKey); } }

  // era：{ id, title }（legacy／hybrid／speedrun）；office：正式上班存檔；onStart(關卡)；onReport(結算卡)
  function open({ era, office, onStart, onReport }) {
    close();
    const ids = Sandbox.ids(); const played = Sandbox.opened(office).filter(id => ids.includes(id));
    const info = (id) => Sandbox.make(id, era.id);
    overlay = h('div', 'hb-overlay');
    const panel = h('div', 'hb-panel office-draw'); const head = h('header', 'hb-head');
    head.append(h('h2', '', `正式上班・${era.title}`), h('span', 'draw-count', `已玩 ${played.length}／${ids.length}`));
    const card = h('div', 'draw-card'); const actions = h('div', 'draw-actions'); const list = h('div', 'draw-played');
    let current = null;
    const show = (id) => {
      current = id;
      const level = info(id); const last = Sandbox.last(office, id, era.id);
      card.replaceChildren(h('p', 'draw-label', played.includes(id) ? '玩過的關' : '今天抽到'), h('h3', 'draw-name', level.name), h('p', 'draw-brief', level.brief));
      if (last) card.append(button('ghost small draw-last', '上次的結算卡', () => { close(); onReport(last.view); }));
      for (const b of list.querySelectorAll('button')) b.classList.toggle('active', b.dataset.level === id);
      Ink.paperize(panel);
    };
    actions.append(
      button('primary draw-go', '上班', () => { close(); onStart(current); }),
      button('', '重抽', () => show(Sandbox.draw([current]))),
      button('', '退出', close),
    );
    if (played.length) {
      list.append(h('p', 'draw-label', '玩過的關可以直接選'));
      for (const id of played) { const b = button('small', info(id).name, () => show(id)); b.dataset.level = id; list.append(b); }
    }
    panel.append(head, card, actions, list); overlay.append(panel);
    overlay.addEventListener('click', (e) => { if (e.target === overlay) close(); });
    document.addEventListener('keydown', onKey);
    document.body.append(overlay);
    show(Sandbox.draw());
  }
  root.OfficeDraw = { open, close };
})(window);
