// atlas.js — IT 圖鑑：俗稱「IT」的職稱分四大類，各一個分頁，每個職稱一行說明。
// 跟新人手冊（術語辭典）是兩件事：手冊解釋遊戲裡出現的詞，圖鑑介紹 IT 領域的分工；職稱在手冊有詞條的，用 term 連過去。
(function (root) {
  const TABS = [
    { id: 'software', icon: 'code', name: '軟體研發與工程', en: 'Software / RD', art: 'assets/atlas/software.webp', alt: '手繪插圖：前端工程師看著跑版的手機畫面說「手機版跑掉了」，隔著桌子的後端工程師站在機櫃旁說「API 我沒動喔」', jobs: [
      { title: '前端工程師', desc: '負責網頁的使用者介面與互動體驗：HTML（HyperText Markup Language，超文件標示語言）、CSS（Cascading Style Sheets，階層式樣式表）、JavaScript。', term: 'dev_layers' },
      { title: '後端工程師', desc: '負責伺服器、資料庫邏輯與 API（Application Programming Interface，應用程式介面）開發（Java、Python、PHP、Ruby）。', term: 'dev_layers' },
      { title: '全端工程師', desc: '兼顧前後端開發。', term: 'dev_layers' },
      { title: 'App 工程師（iOS／Android）', desc: '開發 Apple iOS 或 Android 等行動裝置的應用程式（App：Application）。' },
    ] },
    { id: 'hardware', icon: 'cpu', name: '硬體與底層技術', en: 'Hardware / Embedded', art: 'assets/atlas/hardware.webp', alt: '手繪插圖：硬體工程師焊著電路板說「是韌體的問題」，韌體工程師對著筆電說「是硬體的問題」，兩人中間擺著示波器', jobs: [
      { title: '硬體工程師', desc: '電路設計、PCB（Printed Circuit Board，印刷電路板）Layout 與電子元件研發。' },
      { title: '韌體工程師（Firmware）', desc: '寫入硬體晶片中的底層控制程式（C／C++／Assembly）。' },
      { title: '嵌入式系統工程師', desc: '結合硬體與微控制器的系統開發。' },
    ] },
    { id: 'data', icon: 'database', name: '資料與 AI 領域', en: 'Data / AI', art: 'assets/atlas/data.webp', alt: '手繪插圖：資料工程師把一箱箱原始資料倒進漏斗整理成長條圖，一邊說「這批資料好髒」；演算法工程師站在畫著下滑曲線的黑板前說「準確率又掉了」', jobs: [
      { title: '資料工程師', desc: '建立與維護巨量資料的收集、前處理與保存（Hadoop、Spark、SQL）。SQL（Structured Query Language，結構化查詢語言）。' },
      { title: '演算法工程師', desc: '運用統計學與機器學習建立預測模型（Python、TensorFlow）。' },
      { title: 'AI 顧問', desc: '大致瞭解大多數能用來實作人工智慧（AI，Artificial Intelligence）的技術（包括但不限於數學統計、機器學習、資料探勘、最佳化方法等）的專家，能根據需求給予解決方案或研發方向，通常會和上述兩者合作，以及軟體研發的 IT 合作。' },
    ] },
    { id: 'ops', icon: 'shield', name: '維運、安全與支援', en: 'Ops & Security', art: 'assets/atlas/ops.webp', alt: '手繪插圖：工程師站在機櫃旁說「自動部署完成」，一面盾牌彈開小蟲子，MIS 站在梯子上修天花板的線路，同事抱著筆電求助「我的帳號登不進去」', jobs: [
      { title: 'DevOps／雲端工程師', desc: '負責 CI/CD（Continuous Integration／Continuous Delivery，持續整合／持續交付）自動化部署、Docker／K8s（Kubernetes）容器化與雲端架構管理，例如 AWS（Amazon Web Services）、GCP（Google Cloud Platform）、Azure。', term: 'devops' },
      { title: '網路安全工程師／資安工程師', desc: '系統漏洞檢測、防火牆設定與防範駭客入侵。', term: 'security' },
      { title: 'IT 技術支援（IT Support／MIS）', desc: '企業內部軟硬體故障排除、帳號管理與日常維運；台灣職缺常寫「MIS 工程師」「資訊管理人員」。IT（Information Technology，資訊科技）、MIS（Management Information System，資訊管理系統）。', term: 'mis' },
    ] },
  ];
  // 開頭的聲明（放分頁上面）與結語（放最下面）
  const INTRO = [
    '雖然本遊戲把所有 IT 的工作都簡化成一樣的，但實際上 IT 領域下的不同職稱都有自己的專業。',
    '本圖鑑只列出較為常見的分類和職稱，實際上因應各個團隊的職場文化，每個團隊的職稱或業務會略有不同。',
  ];
  const NOTES = [
    '這個圖鑑旨在介紹 IT 領域下的常見分工，並讓大家理解 IT 領域內的工作真的南轅北轍，希望大家不要再叫演算法工程師去裝 Wi-Fi 分享器，或是叫 MIS 寫公司下午茶團購網頁了。',
  ];

  const data = { TABS, INTRO, NOTES };
  if (typeof module !== 'undefined') { module.exports = data; return; }

  const h = (tag, cls, text) => { const el = document.createElement(tag); if (cls) el.className = cls; if (text !== undefined) el.textContent = text; return el; };

  // 四個分頁的內容；onMore(termId) 是「多知道一點」要做的事（開手冊跳到那條）
  function panelNode(onMore) {
    const wrap = h('div', 'handbook atlas'); wrap.dataset.noTerms = '';
    INTRO.forEach((line, i) => wrap.append(h('p', i === 0 ? 'atlas-claim' : 'hb-intro', line)));   // 第一句是聲明，字不縮小
    const tabs = h('div', 'atlas-tabs'); const body = h('div', 'atlas-body');
    const pages = TABS.map((tab) => {
      const page = h('section', 'atlas-page'); page.dataset.tab = tab.id;
      const list = h('dl', 'hb-list');
      for (const job of tab.jobs) {
        const item = h('div', 'hb-item');
        const dd = h('dd', '', job.desc);
        if (job.term && onMore && Glossary.get(job.term)) {
          const more = h('button', 'term-pop-more', '多知道一點 ›'); more.type = 'button';
          more.addEventListener('click', () => onMore(job.term));
          dd.append(' ', more);
        }
        item.append(h('dt', '', job.title), dd);
        list.append(item);
      }
      const art = h('img', 'atlas-art');
      Object.assign(art, { src: tab.art, alt: tab.alt, width: 1040, height: 462, loading: 'lazy' });
      page.append(art, list);
      return page;
    });
    const show = (id) => {
      for (const b of tabs.children) b.classList.toggle('on', b.dataset.tab === id);
      for (const p of pages) p.hidden = p.dataset.tab !== id;
    };
    for (const tab of TABS) {
      const b = h('button', 'atlas-tab'); b.type = 'button'; b.dataset.tab = tab.id;
      b.append(Icons.el(tab.icon, 'atlas-ico'), h('span', '', tab.name), h('small', '', tab.en));
      b.addEventListener('click', () => show(tab.id));
      tabs.append(b);
    }
    body.append(...pages);
    const notes = h('footer', 'atlas-notes'); for (const n of NOTES) notes.append(h('p', '', n));
    wrap.append(tabs, body, notes);
    show(TABS[0].id);
    return wrap;
  }

  // 識別證頁、選玩法頁看圖鑑：整頁浮層（樣式沿用新人手冊的）
  let overlay = null;
  function openOverlay() {
    if (overlay) return;
    overlay = h('div', 'hb-overlay');
    const panel = h('div', 'hb-panel'); const head = h('header', 'hb-head');
    const shut = h('button', 'btn ghost', '關閉'); shut.type = 'button'; shut.addEventListener('click', closeOverlay);
    head.append(h('h2', '', 'IT 圖鑑'), shut);
    // 「多知道一點」把手冊疊在圖鑑上面：關掉手冊就回到圖鑑看到一半的地方
    panel.append(head, panelNode((id) => Handbook.openOverlay(id)));
    overlay.append(panel);
    overlay.addEventListener('click', (e) => { if (e.target === overlay) closeOverlay(); });
    document.body.append(overlay);
  }
  function closeOverlay() { if (overlay) overlay.remove(); overlay = null; }
  // Esc：手冊疊在上面時先關手冊（handbook.js 自己會關），圖鑑留著。用捕捉階段，在手冊關掉前先數有幾層
  const handbookOpen = () => document.querySelectorAll('.hb-overlay').length > (overlay ? 1 : 0);
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !handbookOpen()) closeOverlay(); }, true);

  root.Atlas = { TABS, INTRO, NOTES, panelNode, openOverlay, closeOverlay };
})(typeof window !== 'undefined' ? window : globalThis);
