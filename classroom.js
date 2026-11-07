// classroom.js — 資料結構小教室的目錄與登記處。
// 每一頁是 classroom/<id>.js 一個檔：講義內容、沙盒的純函式、畫圖，載入時用 add 登記；登記了就是寫好的頁。
// 畫面在 classroom-view.js，四種語言的程式碼用 scripts/run-classroom-code.js 真的跑過。
(function (root) {
  // 目錄：初階篇照教科書由淺到深，附錄、進階篇（研究所範圍）、彩蛋
  const TOC = [
    { group: '初階篇', items: [
      { id: 'array', name: 'Array', zh: '陣列' },
      { id: 'linked_list', name: 'Linked List', zh: '鏈結串列' },
      { id: 'stack', name: 'Stack', zh: '堆疊' },
      { id: 'queue', name: 'Queue', zh: '佇列' },
      { id: 'circular_queue', name: 'Circular Queue', zh: '環狀佇列' },
      { id: 'deque', name: 'Deque', zh: '雙向佇列' },
      { id: 'tree', name: 'Tree', zh: '樹' },
      { id: 'graph', name: 'Graph', zh: '圖' },
    ] },
    { group: '附錄', items: [
      { id: 'hashing', name: 'Hashing', zh: '雜湊' },
      { id: 'searching', name: 'Searching', zh: '搜尋' },
      { id: 'sorting', name: 'Sorting', zh: '排序' },
      { id: 'disjoint_set', name: 'Disjoint Set', zh: '互斥集合' },
      { id: 'complexity', name: 'Big-O', zh: '時間複雜度' },
    ] },
    { group: '進階篇', items: [
      { id: 'heap', name: 'Heap', zh: '堆積' },
      { id: 'trie', name: 'Trie', zh: '字典樹' },
      { id: 'avl', name: 'AVL Tree', zh: 'AVL 樹' },
      { id: 'red_black', name: 'Red-Black Tree', zh: '紅黑樹' },
      { id: 'b_tree', name: 'B-Tree', zh: 'B 樹' },
      { id: 'topological_sort', name: 'Topological Sort', zh: '拓樸排序' },
      { id: 'shortest_path', name: 'Shortest Path', zh: '最短路徑' },
      { id: 'mst', name: 'MST', zh: '最小生成樹' },
    ] },
    { group: '彩蛋', items: [{ id: 'null', name: 'null', zh: '還沒初始化' }] },
  ];
  // 結算卡印章（verdict.js 的 kind）→ 小教室哪一頁
  const STAMP_PAGE = { stack: 'stack', queue: 'queue', deque: 'deque', tree: 'tree', mixed: 'linked_list', null: 'null' };
  // 結算卡上印的是顯示名（例如 Linked List），names 是 verdict.js 的 NAMES
  const pageForStamp = (name, names) => { const kind = Object.keys(names).find(k => names[k].name === name); return kind ? STAMP_PAGE[kind] : null; };
  const LANGS = [['python', 'Python'], ['js', 'JavaScript'], ['java', 'Java'], ['cpp', 'C++']];

  const PAGES = {};
  const add = (id, page) => { PAGES[id] = page; };
  // 照一串操作從頭跑那頁的沙盒，回傳每一步之後的狀態（分格靜態圖用）
  function replay(id, ops) {
    const box = PAGES[id].sandbox; let s = box.init();
    return ops.map((op) => { s = box.apply(s, op); return { op, state: s, label: box.label(op, s) }; });
  }

  const items = () => TOC.flatMap(g => g.items);
  // 附錄 Big-O 的總表：照目錄順序，每一頁的時間複雜度
  const complexityTable = () => items().filter(it => PAGES[it.id] && PAGES[it.id].complexity)
    .map(it => ({ id: it.id, name: it.name, zh: it.zh, rows: PAGES[it.id].complexity }));
  const api = { TOC, STAMP_PAGE, LANGS, PAGES, add, replay, complexityTable, pageForStamp, item: (id) => items().find(i => i.id === id) || null };
  if (typeof module !== 'undefined') {
    module.exports = api;
    // node（測試、實跑程式）沒有 script 標籤：classroom/ 底下每一頁都載進來
    const fs = require('fs'), path = require('path'), dir = path.join(__dirname, 'classroom');
    for (const file of fs.readdirSync(dir)) if (file.endsWith('.js')) add(path.basename(file, '.js'), require(path.join(dir, file)));
  } else root.Classroom = api;
})(typeof window !== 'undefined' ? window : globalThis);
