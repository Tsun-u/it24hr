// classroom/complexity.js — 小教室附錄「Big-O 時間複雜度」：觀念頁（layout: 'reference'），沒有實作，改放「怎麼算」和全部頁的總表
(function (root) {
  // 沙盒的五條長條：n 都是 2 的次方，log₂ n 是整數
  const CLASSES = [
    { name: 'O(1)', steps: () => 1 },
    { name: 'O(log n)', steps: (n) => Math.log2(n) },
    { name: 'O(n)', steps: (n) => n },
    { name: 'O(n log n)', steps: (n) => n * Math.log2(n) },
    { name: 'O(n²)', steps: (n) => n * n },
  ];
  const MIN_N = 2, MAX_N = 1024;

  const page = {
    layout: 'reference',
    analogy: '估搬家要多久：一箱搬幾分鐘不是重點，重點是箱子變十倍時，時間跟著變十倍還是一百倍。',
    summary: '下次估搬家要多久，你就知道：一箱幾分鐘不是重點，箱子變多時時間怎麼長才是——這就是 Big-O。',   // 總結：呼應開頭的比喻（教學怪物教案的回環結構）
    frames: ['double', 'double', 'double', 'double'],
    uses: [
      '估工作量：一份名單 100 個人要處理 1 分鐘，變成一萬個人時要等 100 分鐘，還是一萬分鐘？看的就是工作量隨資料量長得多快。',
      '挑資料結構：前面每一頁最後都有一張時間複雜度表。常常要插到最前面就別用陣列，常常要照編號讀就別用鏈結串列。',
      '程式寫好之前先知道會不會太慢：資料有一百萬筆時，O(n²) 要做大約一兆步，O(n log n) 大約兩千萬步——一個要跑好幾個小時，一個眨眼就完成。',
      '考試和面試：資料結構、演算法的題目幾乎都會問「這段程式的時間複雜度是多少」。',
    ],
    concept: [
      'Big-O 描述的是：資料量 n 變大的時候，程式的步數最多大約怎麼長。它只在乎長的速度，所以常數和比較小的項都丟掉：3n + 5 寫成 O(n)，n² + 100n 寫成 O(n²)。',
      '常見的幾種，由快到慢：O(1) 不管資料多少都一樣（陣列讀 a[i]、堆疊 push）；O(log n) 每次砍一半（二分搜尋）；O(n) 一個一個看（線性搜尋、鏈結串列走到尾）；O(n log n) 切一半再合起來（合併排序）；O(n²) 兩兩比一遍（氣泡排序）；O(2ⁿ) 每多一個就翻倍（河內塔要搬 2ⁿ − 1 步）。',
      '同一個操作常常分成最好、平均、最差三種情況，例如快速排序平均 O(n log n)、最差 O(n²)；雜湊表找東西平均 O(1)、最差 O(n)。沒有特別說的時候，Big-O 通常講的是最差情況。',
      '正式定義（考試會考）：如果存在常數 c > 0 和 n₀，讓所有 n ≥ n₀ 都有 f(n) ≤ c · g(n)，就寫成 f(n) = O(g(n))，意思是 g(n) 是 f(n) 的上界。另外 Ω 是下界、Θ 是上下界都對得上，演算法小教室會細講。',
      '同樣的方法也能估「額外用了多少記憶體」，叫空間複雜度：例如合併排序要多用 O(n) 的空間，插入排序只要 O(1)。',
    ],
    // 怎麼算：幾個常見的程式長相，一步一步數出步數再丟掉常數（程式用 Python 寫，其他語言的數法一樣）
    howto: [
      {
        title: '一層迴圈',
        code: 'total = 0\nfor i in range(n):\n    total += a[i]',
        note: '迴圈跑 n 次，每次做固定幾步，共大約 n 步：O(n)。',
      },
      {
        title: '兩層迴圈，各跑 n 次',
        code: 'for i in range(n):\n    for j in range(n):\n        if a[i] == a[j]:\n            count += 1',
        note: '外層 n 次，每一次內層又跑 n 次，共 n × n = n² 步：O(n²)。',
      },
      {
        title: '內層越跑越短',
        code: 'for i in range(n):\n    for j in range(i + 1, n):\n        compare(a[i], a[j])',
        note: '內層依序跑 n − 1、n − 2、…、1 次，加起來是 n(n − 1) / 2。丟掉常數 1/2 和比較小的項，還是 O(n²)。氣泡排序、選擇排序就是這個形狀。',
      },
      {
        title: '每次砍一半',
        code: 'while n > 1:\n    n = n // 2',
        note: 'n 每圈變一半，16 → 8 → 4 → 2 → 1 砍了 4 次，剛好是 log₂ 16。要砍 log₂ n 次：O(log n)。二分搜尋就是這個形狀。',
      },
      {
        title: '先後兩段是相加，不是相乘',
        code: 'for i in range(n):          # 第一段：n 步\n    print(a[i])\nfor i in range(n):          # 第二段：n² 步\n    for j in range(n):\n        print(a[i], a[j])',
        note: '兩段接著做，總共 n + n² 步。只留長得最快的那一項：O(n²)。巢狀才是相乘，接著做是相加。',
      },
    ],
    traps: [
      '「O(1) 就是只做一步」——其實是「步數不會跟著資料量變」。固定做 100 步也是 O(1)。',
      '「O(n) 一定比 O(n²) 快」——資料少的時候不一定，前面被丟掉的常數可能差很多。Big-O 講的是 n 夠大以後，誰長得比較快。',
      '「兩層迴圈一定是 O(n²)」——要看內層跑幾次：內層固定跑 10 次，整段是 O(n)；內層每次砍一半，整段是 O(n log n)。',
      '「log n 的底數很重要」——log₂ n 和 log₁₀ n 只差一個常數倍（大約 3.3 倍），Big-O 會把常數丟掉，所以通常不寫底數。',
      '「Big-O 算的是秒數」——它算的是步數怎麼跟著資料量長，跟電腦快慢無關。換一台快十倍的電腦，O(n²) 的程式在資料變十倍時，還是會慢一百倍。',
      '「平均 O(1) 就代表每次都是 O(1)」——雜湊表平均 O(1)，最差全部撞在同一格就是 O(n)。看複雜度要看清楚講的是哪一種情況。',
    ],
    // 沙盒：n 從 8 開始，加倍或減半，看五種複雜度的步數各變幾倍
    sandbox: {
      ops: [{ op: 'double', label: 'n 加倍 ×2' }, { op: 'half', label: 'n 減半 ÷2' }],
      errors: { max: `n 最大到 ${MAX_N}：再大的話 n² 就超過一百萬，長條畫不下了。`, min: `n 最小是 ${MIN_N}。` },
      init() { return { n: 8, prev: null, error: null }; },
      apply(s, op) {
        if (op === 'double' && s.n >= MAX_N) return { ...s, error: 'max' };
        if (op === 'half' && s.n <= MIN_N) return { ...s, error: 'min' };
        return { n: op === 'double' ? s.n * 2 : s.n / 2, prev: s.n, error: null };
      },
      label(op, s) { return `${op === 'double' ? 'n 加倍' : 'n 減半'} → ${s.n}`; },
      steps(n) { return CLASSES.map(c => ({ name: c.name, steps: c.steps(n) })); },
    },
    // 五條橫的長條，長度照 n² 那條等比例畫（n 一大，其他幾條就短到快看不見，這正是重點）；右邊寫步數，跟上一步比變幾倍
    draw({ rough, svgEl, svgText, INK, FILL }, { n, prev }, { sandbox = false } = {}) {
      const w = sandbox ? 320 : 260, rowH = 28, top = 24, labelW = 86, numW = sandbox ? 96 : 84;
      const barW = w - labelW - numW - 8, hgt = top + CLASSES.length * rowH + 6;
      const s = svgEl(w, hgt); const rc = rough.svg(s);
      const left = (t) => { t.setAttribute('text-anchor', 'start'); return t; };
      left(svgText(s, 4, 10, `n = ${n}`, 13));
      const max = n * n;
      CLASSES.forEach((c, i) => {
        const y = top + i * rowH, v = c.steps(n);
        left(svgText(s, 4, y + rowH / 2, c.name, 12));
        const len = Math.max(3, (barW * v) / max);
        s.append(rc.rectangle(labelW, y + 5, len, rowH - 10,
          { stroke: INK, fill: FILL, fillStyle: 'hachure', hachureGap: 4, roughness: 0.8, seed: 40 + i }));
        const ratio = prev ? v / c.steps(prev) : null;
        const tail = ratio === null ? '' : `　×${Number.isInteger(ratio) ? ratio : ratio.toFixed(2)}`;
        left(svgText(s, labelW + barW + 6, y + rowH / 2, `${v.toLocaleString('en-US')}${tail}`, 11));
      });
      return s;
    },
  };
  if (typeof module !== 'undefined') module.exports = page; else root.Classroom.add('complexity', page);
})(typeof window !== 'undefined' ? window : globalThis);
