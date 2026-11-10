// tests/classroom-knapsack.test.js（node --test）：背包問題頁講義裡寫到的數字都算得出來
const test = require('node:test'); const assert = require('node:assert');
const page = require('../classroom/algorithms/knapsack.js');

// 開場那五樣東西 [重量, 分數]，額度 7 公斤
const ITEMS = [[5, 10], [4, 7], [3, 6], [2, 2], [1, 1]];
const LIMIT = 7;
const sum = (list) => list.reduce((a, b) => a + b, 0);
const weightOf = (items) => sum(items.map(t => t[0])), scoreOf = (items) => sum(items.map(t => t[1]));

// 每樣選或不選全部試過：回傳一共幾種、裝得下的挑法裡分數最高的那一種
function bruteForce(items, limit) {
  let best = [];
  for (let mask = 0; mask < 2 ** items.length; mask++) {
    const chosen = items.filter((_, i) => mask >> i & 1);
    if (weightOf(chosen) <= limit && scoreOf(chosen) > scoreOf(best)) best = chosen;
  }
  return { ways: 2 ** items.length, best, score: scoreOf(best) };
}
// 照某個順序一樣一樣看，裝得下就拿、裝不下就跳過
function pickInOrder(items, limit) {
  const picked = [];
  for (const t of items) if (weightOf(picked) + t[0] <= limit) picked.push(t);
  return picked;
}
// 排序是穩定的：一樣大的照原本的順序
const by = (key) => (items) => [...items].sort((a, b) => key(b) - key(a));
const mostWanted = by(t => t[1]), lightest = by(t => -t[0]), bestPerKg = by(t => t[1] / t[0]);

// 只留一列的寫法和它的幾種改法：ascending 是 w 從小到大填，orEqual 是 > 改成 >=，reversed 是東西倒過來考慮，keepWeight 是帶的時候沒扣掉重量
function oneRow(weight, value, limit, { ascending = false, orEqual = false, reversed = false, keepWeight = false } = {}) {
  const best = new Array(limit + 1).fill(0);
  const order = weight.map((_, i) => i); if (reversed) order.reverse();
  for (const i of order) {
    const cells = []; for (let w = weight[i]; w <= limit; w++) cells.push(w);
    if (!ascending) cells.reverse();
    for (const w of cells) {
      const take = (keepWeight ? best[w] : best[w - weight[i]]) + value[i];
      if (orEqual ? take >= best[w] : take > best[w]) best[w] = take;
    }
  }
  return best[limit];
}
const pairs = (weight, value) => weight.map((w, i) => [w, value[i]]);
const listIn = (code, name) => JSON.parse(code.match(new RegExp(`${name} = (\\[[^\\]]*\\])`))[1]);

test('複習和總結：先拿最想要的 12 分、最輕的 9 分、每公斤最划算的 12 分；最好是 4 公斤加 3 公斤的 13 分；5 樣有 32 種挑法', () => {
  assert.deepStrictEqual(ITEMS.map(t => t[0]), [5, 4, 3, 2, 1]);
  assert.deepStrictEqual(ITEMS.map(t => t[1]), [10, 7, 6, 2, 1]);
  assert.strictEqual(scoreOf(pickInOrder(mostWanted(ITEMS), LIMIT)), 12);
  assert.strictEqual(scoreOf(pickInOrder(lightest(ITEMS), LIMIT)), 9);
  assert.strictEqual(scoreOf(pickInOrder(bestPerKg(ITEMS), LIMIT)), 12);
  const { ways, best, score } = bruteForce(ITEMS, LIMIT);
  assert.strictEqual(ways, 32);
  assert.strictEqual(score, 13);
  assert.deepStrictEqual(best, [[4, 7], [3, 6]]);
});

test('複習和跑幾步：30 樣超過十億種；開場是 5 × 8 = 40 格；30 樣、額度 100 公斤大約三千格', () => {
  assert.ok(2 ** 30 > 1e9 && 2 ** 30 < 2e9);
  assert.strictEqual(ITEMS.length * (LIMIT + 1), 40);
  assert.strictEqual(30 * 100, 3000);
  assert.strictEqual(30 * (100 + 1), 3030, '照 n × (W + 1) 算是 3030 格，講義寫的三千格是大約');
  assert.ok(2 ** 29 < 20 * 1e9, '常見誤解：二十幾樣東西的挑法（最多 2 的 29 次方）比 20 樣、額度十億的表還少');
});

test('常見誤解：每公斤最划算的是 5 公斤和 3 公斤那兩樣，兩樣一起裝不下；先拿 5 公斤的只有 12 分', () => {
  const perKg = ITEMS.map(t => t[1] / t[0]);
  assert.deepStrictEqual(ITEMS.filter((_, i) => perKg[i] === Math.max(...perKg)), [[5, 10], [3, 6]]);
  assert.ok(5 + 3 > LIMIT);
  assert.deepStrictEqual(pickInOrder(bestPerKg(ITEMS), LIMIT), [[5, 10], [2, 2]]);
  assert.strictEqual(scoreOf([[4, 7], [3, 6]]), 13);
  // 一樣划算的那兩樣如果先拿 3 公斤的，接著裝得下 4 公斤的，會拿到 13 分；講義算的是先拿 5 公斤的
  assert.strictEqual(scoreOf(pickInOrder([[3, 6], [5, 10], [4, 7], [2, 2], [1, 1]], LIMIT)), 13);
});

test('常見誤解：從右下角往回看，查得出拿的是 4 公斤和 3 公斤那兩樣', () => {
  const { table } = drawFigure();
  const taken = []; let w = LIMIT;
  for (let i = ITEMS.length; i >= 1; i--) if (table[i][w] !== table[i - 1][w]) { taken.unshift(ITEMS[i - 1]); w -= ITEMS[i - 1][0]; }
  assert.deepStrictEqual(taken, [[4, 7], [3, 6]]);
});

test('追蹤器：重量 1、3、4，額度 4；第三樣 6 分印 7、8 分印 8；每組 40 步以內', () => {
  const weight = listIn(page.trace.code.python, 'weight');
  assert.deepStrictEqual(weight, [1, 3, 4]);
  for (const [label, v, expected] of [['第三樣 6 分', 6, 7], ['第三樣 8 分', 8, 8]]) {
    const value = [2, 5, v];
    assert.ok(page.trace.code.python.includes('value = [2, 5, {{v}}]'));
    assert.strictEqual(bruteForce(pairs(weight, value), 4).score, expected);
    assert.strictEqual(oneRow(weight, value, 4), expected);
    assert.strictEqual(page.trace.runs[label].at(-1).out, `${expected}\n`);
  }
  assert.deepStrictEqual(page.trace.inputs.map(t => t.label), ['第三樣 6 分', '第三樣 8 分']);
  for (const { label } of page.trace.inputs) assert.ok(page.trace.runs[label].length <= 40, `${label} 有 ${page.trace.runs[label].length} 步`);
});

test('實作：開場那五樣，額度 7 是 13 分、額度 10 是 18 分，印出 13 18', () => {
  assert.ok(page.code.python.includes('weight = [5, 4, 3, 2, 1]') && page.code.python.includes('value = [10, 7, 6, 2, 1]'));
  assert.strictEqual(`${bruteForce(ITEMS, 7).score} ${bruteForce(ITEMS, 10).score}`, '13 18');
  assert.strictEqual(page.code.output, '13 18');
});

test('試試看第一題：重量 2、3、4，分數 4、5、6，額度 7 印 11；錯的選項是最輕的先拿 9、從小到大填 13、全部拿 15', () => {
  const q = page.tryit[0];
  const weight = listIn(q.code.python, 'weight'), value = listIn(q.code.python, 'value');
  assert.deepStrictEqual([weight, value], [[2, 3, 4], [4, 5, 6]]);
  const items = pairs(weight, value);
  assert.strictEqual(oneRow(weight, value, 7), 11);
  assert.deepStrictEqual(bruteForce(items, 7).best, [[3, 5], [4, 6]]);
  assert.strictEqual(q.options[q.answer], '11'); assert.strictEqual(q.output, '11');
  assert.deepStrictEqual(q.options, [scoreOf(pickInOrder(lightest(items), 7)), 11, oneRow(weight, value, 7, { ascending: true }), sum(value)].map(String));
  assert.deepStrictEqual(q.options, ['9', '11', '13', '15']);
  assert.strictEqual(sum(weight), 9, '三樣一共 9 公斤');
  assert.strictEqual(4 + 4 + 5, 13); assert.ok(2 + 2 + 3 <= 7);
  // why 裡每一輪填完的樣子
  assert.strictEqual(oneRow([2], [4], 7), 4);
  assert.deepStrictEqual([3, 4, 5, 7].map(w => oneRow([2, 3], [4, 5], w)), [5, 5, 9, 9]);
});

test('試試看第二題：重量 1、3、4，分數 2、5、7，額度 5 從小到大填印 10，應該是 9；其他三種改法是 10、10、14', () => {
  const q = page.tryit[1];
  const weight = listIn(q.code.python, 'weight'), value = listIn(q.code.python, 'value');
  assert.deepStrictEqual([weight, value], [[1, 3, 4], [2, 5, 7]]);
  assert.strictEqual(oneRow(weight, value, 5, { ascending: true }), 10);
  assert.strictEqual(q.output, '10');
  assert.strictEqual(q.answer, 1);
  assert.strictEqual(oneRow(weight, value, 5), 9);
  assert.deepStrictEqual(bruteForce(pairs(weight, value), 5).best, [[1, 2], [4, 7]]);
  assert.strictEqual(oneRow([1], [2], 5, { ascending: true }), 10, '1 公斤那樣拿了五次');
  assert.strictEqual(oneRow(weight, value, 5, { ascending: true, orEqual: true }), 10);
  assert.strictEqual(oneRow(weight, value, 5, { ascending: true, reversed: true }), 10);
  assert.strictEqual(oneRow(weight, value, 5, { ascending: true, keepWeight: true }), 14);
  assert.strictEqual(sum(value), 14); assert.strictEqual(sum(weight), 8);
});

test('試試看第三題：6 樣、額度 9 填 60 格；錯的選項是 6 × 9、2 的 6 次方、7 × 10', () => {
  const q = page.tryit[2];
  const n = listIn(q.code.python, 'weight').length, limit = 9;
  assert.strictEqual(n, 6);
  assert.ok(q.code.python.includes('range(1, 7)') && q.code.python.includes('range(10)'));
  assert.strictEqual(q.options[q.answer], '60'); assert.strictEqual(q.output, '60');
  assert.deepStrictEqual(q.options, [n * limit, n * (limit + 1), 2 ** n, (n + 1) * (limit + 1)].map(String));
});

// 不開瀏覽器畫一次圖解：記下每段文字和每一格的位置，再把格子裡的數字照列和欄排回一張表
function drawFigure() {
  const texts = [], cells = [];
  const kit = {
    svgEl: (width, height) => ({ width, height, append() {} }),
    svgText: (s, x, y, text, size) => { texts.push({ x, y, text, size }); return { setAttribute() {} }; },
    rough: { svg: () => ({ rectangle: (x, y, w, h, o) => { cells.push({ x, y, w, h, fill: o.fill }); return {}; }, line: () => ({}) }) },
    INK: 'ink', FILL: 'fill', NEW: 'new',
  };
  const svg = page.figure(kit);
  const inside = (t, c) => t.x > c.x && t.x < c.x + c.w && t.y > c.y && t.y < c.y + c.h;
  const xs = [...new Set(cells.map(c => c.x))].sort((a, b) => a - b), ys = [...new Set(cells.map(c => c.y))].sort((a, b) => a - b);
  const table = ys.map(() => []), marked = [];
  for (const c of cells) {
    const i = ys.indexOf(c.y), w = xs.indexOf(c.x);
    table[i][w] = Number(texts.find(t => inside(t, c)).text);
    if (c.fill === 'new') marked.push([i, w]);
  }
  return { svg, texts, cells, table, marked, xs, ys };
}
// 文字佔的範圍（置中對齊）：中文字和全形符號算一個字級寬，英數和半形符號算 0.6 個
const extent = ({ x, y, text, size }) => {
  const width = sum([...text].map(ch => (ch.charCodeAt(0) > 0x7f ? 1 : 0.6) * size));
  return { left: x - width / 2, right: x + width / 2, top: y - size / 2, bottom: y + size / 2 };
};

test('圖解：6 列 8 欄，每一格都是「前 i 樣、額度 w」全部試過的最高分；右下角 13', () => {
  const { table } = drawFigure();
  assert.strictEqual(table.length, 6);
  table.forEach((row, i) => {
    assert.strictEqual(row.length, 8);
    row.forEach((score, w) => assert.strictEqual(score, bruteForce(ITEMS.slice(0, i), w).score, `第 ${i} 列、額度 ${w}`));
  });
  assert.deepStrictEqual(table[0], [0, 0, 0, 0, 0, 0, 0, 0]);
  assert.strictEqual(table[5][7], 13);
});

test('圖解：塗黃的是第 3 樣額度 7、正上方、上一列額度 4 三格；下面那行寫「不帶：10 分｜帶：7 + 6 = 13 分，取大的」', () => {
  const { table, marked, texts } = drawFigure();
  assert.deepStrictEqual(marked.sort(), [[2, 4], [2, 7], [3, 7]]);
  assert.deepStrictEqual(ITEMS[2], [3, 6]);
  assert.deepStrictEqual([table[2][7], table[2][7 - 3], table[3][7]], [10, 7, 13]);
  assert.strictEqual(Math.max(table[2][7], table[2][4] + 6), table[3][7]);
  assert.ok(texts.some(t => t.text === '第 3 樣（3 公斤、6 分）、額度 7 這一格：'));
  assert.ok(texts.some(t => t.text === '不帶：10 分｜帶：7 + 6 = 13 分，取大的'));
});

test('圖解：寬 320 以內；左邊一欄寫重量／分數、上面一列寫額度；字不超出畫面、不互相疊到，數字在自己的格子裡、其他字不壓到格子', () => {
  const { svg, texts, cells, xs, ys } = drawFigure();
  assert.ok(svg.width <= 320);
  assert.strictEqual(cells.length, 48);
  cells.forEach(c => assert.ok(c.x >= 0 && c.x + c.w <= svg.width && c.y >= 0 && c.y + c.h <= svg.height));
  const tableLeft = xs[0], tableTop = ys[0], cellW = cells[0].w, cellH = cells[0].h;
  ITEMS.forEach(([weight, score], k) => {
    const t = texts.find(o => o.text === `${weight}／${score}`);
    assert.ok(t && t.y > ys[k + 1] && t.y < ys[k + 1] + cellH && extent(t).right <= tableLeft, `第 ${k + 1} 樣的重量／分數要寫在那一列的左邊`);
  });
  for (let w = 0; w <= LIMIT; w++) assert.ok(texts.some(t => t.text === String(w) && t.x > xs[w] && t.x < xs[w] + cellW && extent(t).bottom <= tableTop), `額度 ${w} 要寫在那一欄的上面`);
  const boxes = texts.map(extent);
  boxes.forEach((b, i) => {
    assert.ok(b.left >= 0 && b.right <= svg.width && b.top >= 0 && b.bottom <= svg.height, `「${texts[i].text}」超出畫面`);
    boxes.forEach((o, j) => assert.ok(i >= j || b.right <= o.left || o.right <= b.left || b.bottom <= o.top || o.bottom <= b.top, `「${texts[i].text}」和「${texts[j].text}」疊在一起`));
    const home = cells.filter(c => b.left >= c.x && b.right <= c.x + c.w && b.top >= c.y && b.bottom <= c.y + c.h);
    const touched = cells.filter(c => !(b.right <= c.x || c.x + c.w <= b.left || b.bottom <= c.y || c.y + c.h <= b.top));
    assert.ok(touched.length === 0 || (home.length === 1 && touched.length === 1), `「${texts[i].text}」壓到格線`);
  });
  for (const t of texts) assert.ok(!/[⁰¹²³⁴-⁹ⁿ]/.test(t.text), `「${t.text}」用了上標字元`);
});
