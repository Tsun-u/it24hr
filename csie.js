// csie.js — CSIE 課程：APCS 和資工所六科的課程清單，加上講義頁的開頭（把靜態的內文換成互動版）。
// 網址：csie/index.html 課程目錄、csie/<課>/index.html 一門課、csie/<課>/<頁>.html 一頁講義（classroom-static.js 產生）；
// 舊網址 csie.html#<課>/<頁>（結算卡的印章、分享出去的連結）轉到新網址
(function (root) {
  // 七門課：APCS 的程式設計排第一（讀資料結構之前的那一門），後面是資工所常考的六科；ready 的課有小教室可以讀
  const COURSES = [
    { id: 'programming', name: 'APCS 程式設計', note: '資料型態、條件與迴圈、函式、遞迴、陣列：考 APCS、讀資料結構之前的第一門課。每頁有一行一行跑的程式追蹤器、C／C++／Java／Python 四種語言的程式和試試看。', ready: true },
    { id: 'ds', name: '資料結構', note: '陣列、鏈結串列、堆疊、佇列、樹、圖；附錄是雜湊、搜尋、排序、互斥集合和 Big-O；進階篇是堆積、字典樹、AVL 樹、紅黑樹、B 樹和圖的經典問題。每頁有圖解、可以按的沙盒和四種語言的程式。', ready: true },
    { id: 'algorithms', name: '演算法', note: '前綴和、二分搜尋答案、回溯、分治、貪婪、動態規劃：APCS 實作中高級的解題方法。跟 APCS 程式設計一樣，每頁有程式追蹤器、四種語言的程式和試試看。', ready: true },
    { id: 'os', name: '作業系統', note: 'CPU 排程、記憶體分頁、死結：電腦怎麼同時做好多件事。' },
    { id: 'co', name: '計算機組織', note: '二補數、指令、管線、快取：程式最後怎麼在硬體上跑。' },
    { id: 'discrete', name: '離散數學', note: '邏輯、集合、排列組合、遞迴關係、圖論。' },
    { id: 'linear', name: '線性代數', note: '向量、矩陣、線性變換、特徵值。' },
  ];
  const parseHash = (hash) => { const [course = '', page = ''] = hash.replace(/^#/, '').split('/'); return { course, page }; };
  const course = (id) => COURSES.find(c => c.id === id) || null;
  // 舊網址的 hash 要轉去哪（相對網站根目錄）：開了的課才有自己的頁，其他回課程目錄
  function legacyTarget(hash) {
    const { course: id, page } = parseHash(hash);
    if (!course(id)?.ready) return 'csie/index.html';
    return `csie/${id}/${page || 'index'}.html`;
  }
  // 講義頁的網址是哪門課哪一頁；不是講義頁回 null
  function parsePath(pathname) {
    const m = pathname.match(/\/csie\/([^/]+)\/([^/]+)\.html$/);
    return m && m[2] !== 'index' ? { course: m[1], page: m[2] } : null;
  }

  function boot() {
    const here = parsePath(location.pathname);
    if (here) root.ClassroomView.render(document.querySelector('.cr-body'), here);
    else location.replace(legacyTarget(location.hash));
  }

  const api = { COURSES, parseHash, course, legacyTarget, parsePath };
  if (typeof module !== 'undefined') module.exports = api;
  else { root.Csie = api; boot(); }
})(typeof window !== 'undefined' ? window : globalThis);
