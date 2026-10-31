// csie.js — CSIE 課程頁（csie.html）：APCS 和資工所六科的小教室目錄。
// 網址 #<課程> 開那門課、#<課程>/<頁> 直接翻到那一頁（結算卡的印章從這裡進來）；沒有 # 就是課程目錄
(function (root) {
  // 七門課：APCS 的程式設計排第一（讀資料結構之前的那一門），後面是資工所常考的六科；ready 的課有小教室可以讀
  const COURSES = [
    { id: 'programming', name: 'APCS 程式設計', note: '資料型態、條件與迴圈、函式、遞迴、陣列：考 APCS、讀資料結構之前的第一門課。' },
    { id: 'ds', name: '資料結構', note: '陣列、鏈結串列、堆疊、佇列、樹、圖，附錄是雜湊、搜尋、排序和 Big-O。每頁有圖解、可以按的沙盒和四種語言的程式。', ready: true },
    { id: 'algorithms', name: '演算法', note: '分治、貪婪、動態規劃、圖的演算法，還有排序為什麼最快只能到 n log n。' },
    { id: 'os', name: '作業系統', note: 'CPU 排程、記憶體分頁、死結：電腦怎麼同時做好多件事。' },
    { id: 'co', name: '計算機組織', note: '二補數、指令、管線、快取：程式最後怎麼在硬體上跑。' },
    { id: 'discrete', name: '離散數學', note: '邏輯、集合、排列組合、遞迴關係、圖論。' },
    { id: 'linear', name: '線性代數', note: '向量、矩陣、線性變換、特徵值。' },
  ];
  const parseHash = (hash) => { const [course = '', page = ''] = hash.replace(/^#/, '').split('/'); return { course, page }; };
  const course = (id) => COURSES.find(c => c.id === id) || null;

  function boot() {
    const main = document.getElementById('csie');
    const h = (tag, cls, text) => { const el = document.createElement(tag); if (cls) el.className = cls; if (text !== undefined) el.textContent = text; return el; };

    function showList() {
      document.title = 'CSIE 課程｜IT24hr';
      const list = h('div', 'csie-courses');
      for (const c of COURSES) {
        const card = h(c.ready ? 'a' : 'div', `csie-course${c.ready ? '' : ' soon'}`);
        if (c.ready) card.href = `#${c.id}`;
        card.append(h('strong', '', c.name), h('span', '', c.note), h('small', '', c.ready ? '開始讀' : '籌備中'));
        list.append(card);
      }
      main.replaceChildren(h('p', 'csie-intro', '寫給想認識資訊工程的人：從高中生、準備 APCS 和大學申請，到準備證照、研究所考試的學生。'), list);
    }
    function showCourse(c, page) {
      document.title = `${c.name}｜CSIE 課程｜IT24hr`;
      const back = h('a', 'csie-back', '‹ 所有課程'); back.href = '#';
      const room = h('div', 'csie-room');
      main.replaceChildren(back, h('h2', 'csie-course-title', c.name), room);
      root.ClassroomView.mount(room, { id: page, onSelect: (id) => history.replaceState(null, '', `#${c.id}/${id}`) });
    }
    function render() {
      const { course: id, page } = parseHash(location.hash);
      const c = course(id);
      if (c && c.ready) showCourse(c, page); else showList();
      window.scrollTo(0, 0);
    }
    window.addEventListener('hashchange', render);
    render();
  }

  const api = { COURSES, parseHash, course };
  if (typeof module !== 'undefined') module.exports = api;
  else { root.Csie = api; boot(); }
})(typeof window !== 'undefined' ? window : globalThis);
