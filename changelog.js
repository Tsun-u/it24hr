// 版號與更新履歷：版號是最新 commit 的 hash，履歷是簡化版的 git log（資料在 changelog-data.js）
(function (root) {
  const ENTRIES = typeof module !== 'undefined' ? require('./changelog-data.js') : root.CHANGELOG;
  const [LATEST] = ENTRIES;
  const REPO_URL = 'https://github.com/Tsun-u/it24hr';

  const h = (tag, cls, text) => { const n = document.createElement(tag); if (cls) n.className = cls; if (text !== undefined) n.textContent = text; return n; };
  // 同一天的 commit 排在同一個日期底下
  function byDate(entries) {
    const days = new Map();
    for (const entry of entries) days.set(entry.date, [...(days.get(entry.date) || []), entry]);
    return [...days];
  }
  function rowNode({ hash, subject }) {
    const row = h('p', 'cl-row');
    const link = h('a', 'cl-hash mono', hash);
    Object.assign(link, { href: `${REPO_URL}/commit/${hash}`, target: '_blank', rel: 'noopener' });
    row.append(link, h('span', '', subject));
    return row;
  }
  function dayNode([date, entries]) {
    const day = h('section', 'cl-day');
    day.append(h('h3', 'mono', date), ...entries.map(rowNode));
    return day;
  }

  // 整頁浮層：樣式沿用新人手冊的
  let overlay = null;
  function closeOverlay() { if (overlay) overlay.remove(); overlay = null; }
  function openOverlay() {
    if (overlay) return;
    overlay = h('div', 'hb-overlay');
    const panel = h('div', 'hb-panel'); const head = h('header', 'hb-head');
    const shut = h('button', 'btn ghost', '關閉'); shut.type = 'button'; shut.addEventListener('click', closeOverlay);
    head.append(h('h2', '', '更新履歷'), shut);
    const body = h('div', 'changelog'); body.append(h('p', 'cl-command', '$ git log --oneline'), ...byDate(ENTRIES).map(dayNode));
    panel.append(head, body); overlay.append(panel);
    overlay.addEventListener('click', (e) => { if (e.target === overlay) closeOverlay(); });
    document.body.append(overlay);
  }
  if (typeof document !== 'undefined') document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeOverlay(); });

  // 首頁那一行：版號加最新一筆的說明，點了打開更新履歷
  function latestButton() {
    const button = h('button', 'whats-new'); button.type = 'button';
    button.append(h('b', 'mono', LATEST.hash), ` ${LATEST.subject} ›`);
    button.addEventListener('click', openOverlay);
    return button;
  }

  const api = { ENTRIES, LATEST, byDate, latestButton, openOverlay, closeOverlay };
  if (typeof module !== 'undefined') module.exports = api;
  else root.Changelog = api;
})(typeof window !== 'undefined' ? window : globalThis);
