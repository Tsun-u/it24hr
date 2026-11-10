// tests/classroom-sliding_window.test.js（node --test）：滑動視窗頁講義裡寫到的數字都算得出來
const test = require('node:test'); const assert = require('node:assert');
const page = require('../classroom/algorithms/sliding_window.js');

// 開場的 12 攤、追蹤器的 5 攤（就是前 5 攤）
const STALLS = [60, 90, 50, 120, 40, 70, 80, 100, 30, 110, 50, 60];
const FIVE = STALLS.slice(0, 5);
const sum = (list) => list.reduce((a, b) => a + b, 0);
const literal = (list) => JSON.stringify(list).replaceAll(',', ', ');

// 頁面上的寫法。回傳答案、兩根手指各走幾步、走完時的 left 和 total，還有視窗每動一次的 [left, right, total]
// 幾種改法：once 是 while 寫成 if、strict 是 > 寫成 >=、jump 是 left 一次加幾、swapped 是先移 left 才減、early 是退之前就記長度、noPlusOne 是長度少加 1
function slide(prices, budget, { once = false, strict = false, jump = 1, swapped = false, early = false, noPlusOne = false } = {}) {
  let left = 0, total = 0, best = 0, leftMoves = 0; const states = [];
  const over = () => (strict ? total >= budget : total > budget);
  const length = (right) => right - left + (noPlusOne ? 0 : 1);
  const retreat = (right) => {
    if (swapped) { left += jump; total -= prices[left]; } else { total -= prices[left]; left += jump; }
    leftMoves += 1; states.push([left, right, total]);
  };
  prices.forEach((price, right) => {
    total += price; states.push([left, right, total]);
    if (early) best = Math.max(best, length(right));
    if (once) { if (over()) retreat(right); } else while (over()) retreat(right);
    best = Math.max(best, length(right));
  });
  return { best, left, total, leftMoves, rightMoves: prices.length, states };
}
// 兩層迴圈把每一段都加一遍：回傳一共幾段、不超過預算的最長一段（最左邊的那一段）
function everyRun(prices, budget) {
  let runs = 0, best = { length: 0 };
  for (let from = 0; from < prices.length; from++) for (let to = from; to < prices.length; to++) {
    runs += 1;
    const total = sum(prices.slice(from, to + 1));
    if (total <= budget && to - from + 1 > best.length) best = { from, to, total, length: to - from + 1 };
  }
  return { runs, best };
}

test('開場、複習和總結：12 攤有 78 段；300 元最多 4 攤，最左邊的一段是第 2 到第 5 攤，90 + 50 + 120 + 40 剛好 300', () => {
  assert.strictEqual(STALLS.length, 12);
  const { runs, best } = everyRun(STALLS, 300);
  assert.strictEqual(runs, 78); assert.strictEqual(12 * 13 / 2, 78);
  assert.deepStrictEqual(best, { from: 1, to: 4, total: 300, length: 4 });
  assert.deepStrictEqual(STALLS.slice(1, 5), [90, 50, 120, 40]);
  assert.strictEqual(90 + 50 + 120 + 40, 300);
  assert.strictEqual(slide(STALLS, 300).best, 4);
});

test('滑動視窗和兩層迴圈的答案一樣：12 攤從 0 元到 900 元每一種預算，還有 300 組隨機的價錢', () => {
  for (let budget = 0; budget <= 900; budget += 10) assert.strictEqual(slide(STALLS, budget).best, everyRun(STALLS, budget).best.length, `預算 ${budget}`);
  let seed = 7; const next = (n) => { seed = (seed * 1103515245 + 12345) % 2147483648; return seed % n; };
  for (let round = 0; round < 300; round++) {
    const prices = Array.from({ length: 1 + next(10) }, () => next(200)), budget = next(500);
    assert.strictEqual(slide(prices, budget).best, everyRun(prices, budget).best.length, `${prices} 預算 ${budget}`);
  }
});

test('常見誤解：while 寫成 if 會留下超過預算的視窗；長度是 right − left + 1；有負數會錯過答案', () => {
  const once = slide(FIVE, 150, { once: true });
  assert.ok(once.states.some(([l, r, total], k) => total > 150 && (k + 1 === once.states.length || once.states[k + 1][1] !== r)), 'if 的版本有一步做完還超過預算');
  assert.ok(once.total > 150);
  const { best } = everyRun(STALLS, 300);
  assert.strictEqual(best.to - best.from, 3); assert.strictEqual(best.to - best.from + 1, 4);
  const discount = [60, 250, -50];   // 第 3 攤是「折 50 元」
  assert.strictEqual(sum(discount.slice(0, 2)), 310, '吃到第 2 攤超過 300');
  assert.strictEqual(sum(discount), 260, '再吃到折 50 元那攤又回到預算內');
  assert.strictEqual(everyRun(discount, 300).best.length, 3);
  assert.strictEqual(slide(discount, 300).best, 2, '從左邊退掉第 1 攤，錯過 3 攤的答案');
});

test('常見誤解和跑幾步：12 攤兩根手指一共 24 步以內；一萬攤是五千萬段對兩萬步', () => {
  for (const budget of [300, 200]) {
    const { leftMoves, rightMoves } = slide(STALLS, budget);
    assert.strictEqual(rightMoves, 12);
    assert.ok(leftMoves <= 12 && leftMoves + rightMoves <= 24, `預算 ${budget} 走了 ${leftMoves + rightMoves} 步`);
  }
  assert.strictEqual(10000 * 10001 / 2, 50005000);
  assert.strictEqual(2 * 10000, 20000);
  const all = slide(Array(1000).fill(10), 5);   // 每一攤都超過預算：left 也走完全程，剛好 2n 步
  assert.strictEqual(all.leftMoves + all.rightMoves, 2000);
  assert.ok(page.cost.note.text.endsWith('Big-O 的意思和怎麼算，在資料結構的附錄。'));
  assert.strictEqual(page.cost.note.see, 'ds/complexity');
});

test('追蹤器：用的是前 5 攤；200 元印 3、300 元印 4', () => {
  assert.ok(page.trace.code.python.includes(`prices = ${literal(FIVE)}`));
  assert.strictEqual(slide(FIVE, 200).best, 3); assert.strictEqual(everyRun(FIVE, 200).best.length, 3);
  assert.strictEqual(slide(FIVE, 300).best, 4); assert.strictEqual(everyRun(FIVE, 300).best.length, 4);
  assert.strictEqual(page.trace.runs['200 元'].at(-1).out, '3\n');
  assert.strictEqual(page.trace.runs['300 元'].at(-1).out, '4\n');
});

test('追蹤器的步數：每組輸入都在 40 步以內', () => {
  assert.deepStrictEqual(page.trace.inputs.map(i => i.label), ['200 元', '300 元']);
  for (const { label } of page.trace.inputs) assert.ok(page.trace.runs[label].length <= 40, `${label} 有 ${page.trace.runs[label].length} 步`);
});

test('實作：用開場那 12 攤，300 元 4 攤、200 元 3 攤，印出 4 3', () => {
  assert.ok(page.code.python.includes(`prices = ${literal(STALLS)}`));
  assert.strictEqual(`${slide(STALLS, 300).best} ${slide(STALLS, 200).best}`, '4 3');
  assert.strictEqual(`${everyRun(STALLS, 300).best.length} ${everyRun(STALLS, 200).best.length}`, '4 3');
  assert.strictEqual(page.code.output, '4 3');
});

const optionOf = (q) => q.options[q.answer];

test('試試看第一題：6 攤、150 元印 3；錯的選項 2 是長度少加 1、4 是退之前就記長度、6 是全部都算', () => {
  const q = page.tryit[0], prices = [40, 70, 30, 90, 20, 50];
  assert.ok(q.code.python.includes(`prices = ${literal(prices)}`));
  const { best, states } = slide(prices, 150);
  assert.strictEqual(best, 3); assert.strictEqual(everyRun(prices, 150).best.length, 3);
  assert.strictEqual(optionOf(q), '3'); assert.strictEqual(q.output, '3');
  assert.deepStrictEqual(q.options, [slide(prices, 150, { noPlusOne: true }).best, best, slide(prices, 150, { early: true }).best, prices.length].map(String));
  assert.deepStrictEqual(states.map(s => s[2]), [40, 110, 140, 230, 190, 120, 140, 190, 160, 70], '解說裡每一步的總和');
  assert.strictEqual(sum(prices), 300);
});

test('試試看第二題：while 寫成 if 印出 2 160；改成 while 是 1 40；其他三種改法是 2 160、-1 210、2 100', () => {
  const q = page.tryit[1];
  assert.ok(q.code.python.includes(`prices = ${literal(FIVE)}`));
  const printed = (options) => { const { left, total } = slide(FIVE, 150, options); return `${5 - left} ${total}`; };
  assert.strictEqual(printed({ once: true }), '2 160'); assert.strictEqual(q.output, '2 160');
  assert.strictEqual(q.answer, 1);
  assert.strictEqual(printed({}), '1 40');
  assert.strictEqual(printed({ once: true, strict: true }), '2 160');
  assert.strictEqual(printed({ once: true, jump: 2 }), '-1 210');
  assert.strictEqual(printed({ once: true, swapped: true }), '2 100');
  assert.deepStrictEqual(slide(FIVE, 150, { once: true }).states.map(s => s[2]), [60, 150, 200, 140, 260, 170, 210, 160], '解說裡每一步的總和');
  assert.strictEqual(120 + 40, 160);
  assert.strictEqual(slide(FIVE, 150, { once: true }).best, slide(FIVE, 150).best, '價錢不是負的時候，if 的版本記到的最長長度還是對的，所以題目看的是留下來的視窗');
});

test('試試看第三題：1000 攤每攤 10 元、預算 95，一共移動 1991 次；錯的選項是 500500 段、1000 × 1000、2n', () => {
  const q = page.tryit[2];
  const { leftMoves, rightMoves, best } = slide(Array(1000).fill(10), 95);
  assert.strictEqual(best, 9); assert.strictEqual(leftMoves, 991); assert.strictEqual(rightMoves, 1000);
  assert.strictEqual(optionOf(q), String(leftMoves + rightMoves)); assert.strictEqual(q.output, '1991');
  assert.deepStrictEqual(q.options, [1000 * 1001 / 2, 1991, 1000 * 1000, 2 * 1000].map(String));
});

// 不開瀏覽器畫一次圖解：記下每段文字和每個格子的位置
function drawFigure() {
  const texts = [], cells = [];
  const kit = {
    svgEl: (width, height) => ({ width, height, append() {} }),
    svgText: (s, x, y, text, size) => { texts.push({ x, y, text, size }); return { setAttribute() {} }; },
    rough: { svg: () => ({ rectangle: (x, y, w, h, o) => { cells.push({ x, y, w, h, fill: o.fill, seed: o.seed }); return {}; } }) },
    INK: 'ink', FILL: 'fill', NEW: 'new',
  };
  return { svg: page.figure(kit), texts, cells };
}
// 文字佔的範圍（置中對齊）：中文字和全形標點算一個字級寬，數字、空白和半形符號算 0.6 個
const extent = ({ x, y, text, size }) => {
  const width = sum([...text].map(ch => (ch.charCodeAt(0) > 127 ? 1 : 0.6) * size));
  return { left: x - width / 2, right: x + width / 2, top: y - size / 2, bottom: y + size / 2 };
};

test('圖解：寬 320 以內；六列各 12 格，塗黃的是那一步的視窗，下面寫的總和就是黃格加起來；有剛好 300 的第 2～5 攤和「超過，左邊退一攤」', () => {
  const { svg, texts, cells } = drawFigure();
  assert.ok(svg.width <= 320);
  const rows = slide(STALLS, 300).states.slice(2, 8);
  assert.deepStrictEqual(rows, [[0, 2, 200], [0, 3, 320], [1, 3, 260], [1, 4, 300], [1, 5, 370], [2, 5, 280]]);
  assert.strictEqual(cells.length, rows.length * 12);
  assert.strictEqual(new Set(cells.map(c => c.seed)).size, cells.length, '每一格的 seed 固定而且不重複');
  const captions = texts.filter(t => t.text.startsWith('第 '));
  assert.strictEqual(captions.length, rows.length);
  rows.forEach(([left, right, total], k) => {
    const row = cells.slice(k * 12, k * 12 + 12);
    assert.deepStrictEqual(row.map(c => c.fill === 'new'), STALLS.map((_, i) => i >= left && i <= right));
    assert.strictEqual(sum(STALLS.filter((_, i) => row[i].fill === 'new')), total);
    const next = total > 300 ? '超過，左邊退一攤' : total === 300 ? '剛好用完' : '還吃得下';
    assert.strictEqual(captions[k].text, `第 ${left + 1}～${right + 1} 攤：${total}，${next}`);
    row.forEach((c, i) => {
      assert.ok(c.x >= 0 && c.x + c.w <= svg.width && c.y + c.h <= svg.height);
      const price = texts.find(t => t.text === String(STALLS[i]) && Math.abs(t.x - (c.x + c.w / 2)) < 0.01 && Math.abs(t.y - (c.y + c.h / 2)) < 0.01);
      assert.ok(price, `第 ${k + 1} 列第 ${i + 1} 攤的價錢要寫在格子正中間`);
      const b = extent(price);
      assert.ok(b.left >= c.x && b.right <= c.x + c.w && b.top >= c.y && b.bottom <= c.y + c.h, `${price.text} 超出格子`);
    });
  });
  assert.ok(captions.some(t => t.text === '第 2～5 攤：300，剛好用完'));
  assert.ok(captions.some(t => t.text.endsWith('超過，左邊退一攤')));
  assert.ok(texts.every(t => !/[⁰¹²³⁴-⁹]/.test(t.text)), '不用 Unicode 上標字元');
});

test('圖解：文字不超出畫面、不互相疊到；格子外的文字不壓到格子', () => {
  const { svg, texts, cells } = drawFigure();
  const boxes = texts.map(extent);
  const inCell = (b) => cells.some(c => b.left >= c.x && b.right <= c.x + c.w && b.top >= c.y && b.bottom <= c.y + c.h);
  boxes.forEach((b, i) => {
    assert.ok(b.left >= 0 && b.right <= svg.width && b.top >= 0 && b.bottom <= svg.height, `「${texts[i].text}」超出畫面`);
    boxes.forEach((o, j) => assert.ok(i >= j || b.right <= o.left || o.right <= b.left || b.bottom <= o.top || o.bottom <= b.top, `「${texts[i].text}」和「${texts[j].text}」疊在一起`));
    if (!inCell(b)) cells.forEach((c) => assert.ok(b.right <= c.x || c.x + c.w <= b.left || b.bottom <= c.y || c.y + c.h <= b.top, `「${texts[i].text}」壓到格子`));
  });
});
