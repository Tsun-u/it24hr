// classroom.js — CSIE 課程各門課小教室的目錄與登記處。
// 每一頁是 classroom/<課程>/<id>.js 一個檔：講義內容、沙盒的純函式、畫圖，載入時用 add 登記；登記了就是寫好的頁。
// 畫面在 classroom-view.js，四種語言的程式碼用 scripts/run-classroom-code.js 真的跑過。
(function (root) {
  // 每門課的目錄（鍵是 csie.js 的課程 id）。資料結構：初階篇照教科書由淺到深，附錄、進階篇（研究所範圍）、彩蛋
  const TOC = { ds: [
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
  ],
  // APCS 程式設計：照 APCS 程式實作的等級由淺到深
  programming: [
    { group: '基礎', items: [
      { id: 'variables', name: 'Variables', zh: '變數與資料型態' },
      { id: 'expressions', name: 'Expressions', zh: '運算式' },
      { id: 'io', name: 'Input & Output', zh: '輸入與輸出' },
      { id: 'selection', name: 'if / else', zh: '條件判斷' },
      { id: 'loops', name: 'Loops', zh: '迴圈' },
    ] },
    { group: '陣列與字串', items: [
      { id: 'arrays', name: 'Arrays', zh: '陣列與串列' },
      { id: 'strings', name: 'Strings', zh: '字元與字串' },
    ] },
    { group: '函式', items: [
      { id: 'functions', name: 'Functions', zh: '函式' },
      { id: 'recursion', name: 'Recursion', zh: '遞迴' },
      { id: 'structs', name: 'Structs', zh: '自訂資料型態' },
    ] },
  ],
  // 演算法：基礎篇對準 APCS 程式實作的中高級；資料結構已經教過的搜尋、排序、圖的演算法不重複
  algorithms: [
    { group: '基礎篇', items: [
      { id: 'prefix_sum', name: 'Prefix Sum & Two Pointers', zh: '前綴和與雙指標' },
      { id: 'binary_answer', name: 'Binary Search on Answer', zh: '二分搜尋答案' },
      { id: 'backtracking', name: 'Backtracking', zh: '暴力枚舉與回溯' },
      { id: 'divide_conquer', name: 'Divide and Conquer', zh: '分治法' },
      { id: 'greedy', name: 'Greedy', zh: '貪婪法' },
      { id: 'dp', name: 'Dynamic Programming', zh: '動態規劃' },
    ] },
  ] };
  // 結算卡印章（verdict.js 的 kind）→ 資料結構小教室哪一頁
  const STAMP_PAGE = { stack: 'stack', queue: 'queue', deque: 'deque', tree: 'tree', mixed: 'linked_list', null: 'null' };
  // 結算卡上印的是顯示名（例如 Linked List），names 是 verdict.js 的 NAMES
  const pageForStamp = (name, names) => { const kind = Object.keys(names).find(k => names[k].name === name); return kind ? STAMP_PAGE[kind] : null; };
  // 每門課實作用的語言：資料結構照常用的四種；APCS 程式設計和演算法照程式實作能用的四種（C、C++、Java、Python）
  const APCS_LANGS = [['c', 'C'], ['cpp', 'C++'], ['java', 'Java'], ['python', 'Python']];
  const LANGS = {
    ds: [['python', 'Python'], ['js', 'JavaScript'], ['java', 'Java'], ['cpp', 'C++']],
    programming: APCS_LANGS,
    algorithms: APCS_LANGS,
  };

  // 登記好的頁：PAGES[課程][頁 id]
  const PAGES = {};
  const add = (course, id, page) => { (PAGES[course] ||= {})[id] = page; };
  // 照一串操作從頭跑那頁的沙盒，回傳每一步之後的狀態（分格靜態圖用）
  function replay(course, id, ops) {
    const box = PAGES[course][id].sandbox; let s = box.init();
    return ops.map((op) => { s = box.apply(s, op); return { op, state: s, label: box.label(op, s) }; });
  }

  const items = (course) => (TOC[course] || []).flatMap(g => g.items);
  const item = (course, id) => items(course).find(i => i.id === id) || null;
  // 附錄 Big-O 的總表：照目錄順序，那門課每一頁的時間複雜度
  const complexityTable = (course) => items(course).filter(it => PAGES[course]?.[it.id]?.complexity)
    .map(it => ({ id: it.id, name: it.name, zh: it.zh, rows: PAGES[course][it.id].complexity }));

  // 程式設計課的程式追蹤器（頁的 trace：四種語言的程式、Python 行號對到各語言的行號、build-traces.js 產生的每一步）
  // 每一步的欄位見 scripts/trace_python.py。程式裡的 {{n}} 換成挑的那組輸入（讀 stdin 的程式可以沒有 values）
  const fill = (code, values = {}) => Object.entries(values).reduce((s, [k, v]) => s.split(`{{${k}}}`).join(String(v)), code);
  // Python 的第幾行，在那種語言是第幾行
  const traceLine = (trace, lang, pyLine) => (lang === 'python' ? pyLine : trace.lines[lang][pyLine]);
  // 程式自己定義的資料型態的值：{ __type: 型態名, 欄位: 值, ... }
  const isRecord = (v) => v !== null && typeof v === 'object' && !Array.isArray(v) && '__type' in v;
  const fieldsOf = (v) => Object.keys(v).filter(k => k !== '__type');
  const showValue = (v) => (typeof v === 'string' ? `"${v}"`
    : Array.isArray(v) ? `[${v.map(showValue).join(', ')}]`
    : isRecord(v) ? `${v.__type}(${fieldsOf(v).map(k => `${k}: ${showValue(v[k])}`).join(', ')})`
    : String(v));
  // 呼叫堆疊：第幾層（主程式是 1）、那一步那一層的變數
  const depthOf = (step) => (step.stack ? step.stack.length : 1);
  const frameVars = (step, depth) => (step.stack ? step.stack[depth - 1]?.vars : depth === 1 ? step.vars : undefined);
  // 這一步之前，正在跑的那一層的變數（剛呼叫函式的那一步是新的一層，之前沒有）
  const varsBefore = (prev, step) => (prev && !step.call ? frameVars(prev, depthOf(step)) : undefined);
  // 這一步改了哪些變數（第一次出現的也算）；比的是同一層
  const changedVars = (prev, step) => { const before = varsBefore(prev, step); return Object.keys(step.vars).filter(k => !before || showValue(before[k]) !== showValue(step.vars[k])); };
  // 一個變數怎麼變的：資料型態只改了幾個欄位就寫欄位（a.score：72 → 73），其他寫整個值
  function changeText(k, before, now) {
    if (before === undefined) return [`${k} = ${showValue(now)}`];
    if (isRecord(before) && isRecord(now) && before.__type === now.__type) {
      const fields = fieldsOf(now).filter(f => showValue(before[f]) !== showValue(now[f]));
      if (fields.length < fieldsOf(now).length) return fields.map(f => `${k}.${f}：${showValue(before[f])} → ${showValue(now[f])}`);
    }
    return [`${k}：${showValue(before)} → ${showValue(now)}`];
  }
  // 條件：while (i <= n) {、if (x > 0) {、while i <= n: 取出括號或冒號前面那段
  const CONDITION = /^(?:\}\s*)?(while|if|else if|elif)\s*\(?(.*?)\)?\s*[{:]?$/;
  // 追蹤器第 i 步的說明：條件那行代入變數的值、寫成立或不成立；其他行寫讀進什麼、哪個變數變了、印了什麼；
  // 呼叫函式、函式回傳、定義函式或資料型態各有一句。lang 決定條件照哪種語言寫
  function stepNote(trace, label, i, lang) {
    const run = trace.runs[label], step = run[i], prev = run[i - 1];
    const input = trace.inputs.find(x => x.label === label);
    const source = (l) => fill(trace.code[l], input.values).split('\n')[traceLine(trace, l, step.line) - 1].trim();
    if (step.call) {
      const args = Object.entries(step.vars).map(([k, v]) => `${k} = ${showValue(v)}`).join('、');
      return `呼叫 ${step.call}${args ? `（${args}）` : ''}`;
    }
    const parts = [];
    if ('cond' in step) {
      const m = CONDITION.exec(source(lang));
      if (!m) parts.push(step.cond ? '還有下一個，進迴圈' : '走完了，離開迴圈');   // for 迴圈
      else {
        const scope = { ...(step.stack ? step.stack[0].vars : {}), ...step.vars };
        // 代入值：a.score 這種取欄位的整串一起代成那個欄位的值
        const lookup = (path) => path.split('.').reduce((v, k) => (v !== undefined && v !== null && typeof v === 'object' && k in v ? v[k] : undefined), scope);
        // 取不到欄位的（Java 的 name.length()）只代前面的變數
        const plug = (w) => {
          if (lookup(w) !== undefined) return showValue(lookup(w));
          const [head, ...rest] = w.split('.');
          return head in scope ? [showValue(scope[head]), ...rest].join('.') : w;
        };
        const plugged = m[2].replace(/\b[A-Za-z_]\w*(?:\.[A-Za-z_]\w*)*\b/g, plug);
        const loop = m[1] === 'while' ? (step.cond ? '，進迴圈' : '，離開迴圈') : '';
        parts.push(`${m[2]}（${plugged}）${step.cond ? '成立' : '不成立'}${loop}`);
      }
    } else {
      const read = input.stdin === undefined ? '' : input.stdin.slice(prev ? prev.read : 0, step.read).trim();
      if (read) parts.push(`讀進 ${read}`);
      const before = varsBefore(prev, step);
      for (const k of changedVars(prev, step)) parts.push(...changeText(k, before && before[k], step.vars[k]));
      const printed = step.out.slice(prev ? prev.out.length : 0).trim();
      if (printed) parts.push(`印出 ${printed}`);
      for (const name of [].concat(step.def || [])) parts.push(`${/^class\b/.test(source('python')) ? '定義資料型態' : '定義函式'} ${name}`);
    }
    if ('ret' in step) {
      const fn = step.stack[step.stack.length - 1].fn;
      parts.push(step.ret === null ? `${fn} 跑完了，回到呼叫它的地方` : `${fn} 回傳 ${showValue(step.ret)}`);
    }
    return parts.join('；');
  }

  const api = { TOC, STAMP_PAGE, LANGS, PAGES, add, replay, complexityTable, pageForStamp, item, fill, traceLine, isRecord, fieldsOf, showValue, depthOf, frameVars, changedVars, stepNote };
  if (typeof module !== 'undefined') {
    module.exports = api;
    // node（測試、實跑程式）沒有 script 標籤：classroom/<課程>/ 底下每一頁都載進來
    const fs = require('fs'), path = require('path'), dir = path.join(__dirname, 'classroom');
    for (const course of fs.readdirSync(dir)) for (const file of fs.readdirSync(path.join(dir, course))) {
      if (file.endsWith('.js')) add(course, path.basename(file, '.js'), require(path.join(dir, course, file)));
    }
  } else root.Classroom = api;
})(typeof window !== 'undefined' ? window : globalThis);
