// tests/classroom-inversions.test.js（node --test）：逆序數對頁講義裡寫到的數字都算得出來
const test = require('node:test'); const assert = require('node:assert');
const page = require('../classroom/algorithms/inversions.js');

// 開場那套漫畫在書架上的順序，和完全倒過來的 8 本
const SHELF = [3, 1, 4, 8, 2, 6, 5, 7];
const BACKWARDS = [8, 7, 6, 5, 4, 3, 2, 1];
// 圖解和追蹤器合併的兩半
const LEFT = [2, 5, 8], RIGHT = [1, 4, 6];
const sum = (list) => list.reduce((a, b) => a + b, 0);
const pairsOf = (n) => n * (n - 1) / 2;
const sorted = (list) => [...list].sort((a, b) => a - b);
const pyList = (list) => JSON.stringify(list).replaceAll(',', ', ');

// 兩層迴圈一對一對看：回傳一共看了幾對、其中幾對是逆序
function bruteForce(data) {
  let pairs = 0, inversions = 0;
  for (let a = 0; a < data.length; a++) for (let b = a + 1; b < data.length; b++) { pairs += 1; if (data[a] > data[b]) inversions += 1; }
  return { pairs, inversions };
}
// 頁面上的寫法：切兩半各自數，合併時每拿一個右半的就加上左半還沒拿的個數；回傳對數和排好的陣列
function countInversions(data) {
  if (data.length <= 1) return { count: 0, sorted: [...data] };
  const mid = Math.ceil(data.length / 2);
  const l = countInversions(data.slice(0, mid)), r = countInversions(data.slice(mid));
  let count = l.count + r.count, i = 0, j = 0; const merged = [];
  while (i < l.sorted.length && j < r.sorted.length) {
    if (l.sorted[i] <= r.sorted[j]) merged.push(l.sorted[i++]);
    else { count += l.sorted.length - i; merged.push(r.sorted[j++]); }
  }
  return { count, sorted: [...merged, ...l.sorted.slice(i), ...r.sorted.slice(j)] };
}
// 只走合併那一步（追蹤器和試試看的程式）。strict：比較寫成 <；add(i, j, n)：拿右半時加多少；addOnLeft(i, j, n)：拿左半時加多少
// 回傳 count 和每次拿右半那一刻加了多少
function mergeStep(left, right, { strict = false, add = (i, j, n) => n - i, addOnLeft = () => 0 } = {}) {
  const n = left.length; let i = 0, j = 0, count = 0; const added = [];
  while (i < n && j < n) {
    if (strict ? left[i] < right[j] : left[i] <= right[j]) { count += addOnLeft(i, j, n); i += 1; }
    else { added.push(add(i, j, n)); count += add(i, j, n); j += 1; }
  }
  return { count, added };
}
// 一左一右的每一對裡，符合條件的有幾對
const crossPairs = (left, right, match) => sum(left.map(a => right.filter(b => match(a, b)).length));
// 相鄰對調最少幾次能排好：從排好的順序往外一層一層找（8 本共 40320 種順序）
function fewestAdjacentSwaps(data) {
  const goal = sorted(data).join(','), start = data.join(',');
  let layer = [goal]; const seen = new Set(layer);
  for (let swaps = 0; layer.length; swaps++) {
    if (seen.has(start) && layer.includes(start)) return swaps;
    const next = [];
    for (const key of layer) {
      const order = key.split(',');
      for (let k = 0; k + 1 < order.length; k++) {
        const moved = [...order]; [moved[k], moved[k + 1]] = [moved[k + 1], moved[k]];
        const id = moved.join(',');
        if (!seen.has(id)) { seen.add(id); next.push(id); }
      }
    }
    layer = next;
  }
  return -1;
}
// 氣泡排序：回傳交換了幾次
function bubbleSwaps(data) {
  const list = [...data]; let swaps = 0;
  for (let pass = 0; pass < list.length; pass++) for (let k = 0; k + 1 < list.length; k++) {
    if (list[k] > list[k + 1]) { [list[k], list[k + 1]] = [list[k + 1], list[k]]; swaps += 1; }
  }
  return swaps;
}

test('開場和總結：那套漫畫相鄰對調最少 8 次，剛好等於逆序數對 8 對', () => {
  assert.ok(page.analogy.includes(SHELF.join('、')));
  assert.strictEqual(bruteForce(SHELF).inversions, 8);
  assert.strictEqual(fewestAdjacentSwaps(SHELF), 8);
  assert.strictEqual(countInversions(SHELF).count, 8);
  assert.ok(page.summary.includes('最少要調 8 次') && page.summary.includes('28 對'));
});

test('複習和跑幾步：8 本有 28 對；十萬筆是 4999950000 對（將近 50 億）；n × log₂ n 大約 170 萬', () => {
  assert.strictEqual(bruteForce(SHELF).pairs, 28);
  assert.strictEqual(pairsOf(8), 28);
  assert.strictEqual(pairsOf(100000), 4999950000);
  assert.ok(pairsOf(100000) < 5e9 && pairsOf(100000) / 5e9 > 0.99, '將近 50 億');
  const steps = 100000 * Math.log2(100000);
  assert.strictEqual(Math.round(steps / 1e5), 17, `n × log₂ n 是 ${Math.round(steps)}，大約 170 萬`);
  assert.ok(page.cost.note.text.includes('將近 50 億對') && page.cost.note.text.includes('170 萬步'));
});

test('用途和核心觀念：排好的 0 對、完全倒過來的 n(n − 1) / 2 對；氣泡排序交換的次數等於逆序數對', () => {
  for (let n = 1; n <= 9; n++) {
    const up = Array.from({ length: n }, (_, k) => k + 1), down = [...up].reverse();
    assert.strictEqual(bruteForce(up).inversions, 0);
    assert.strictEqual(bruteForce(down).inversions, pairsOf(n));
    assert.strictEqual(countInversions(down).count, pairsOf(n));
  }
  for (const data of [SHELF, BACKWARDS, [2, 2, 1, 3, 1]]) assert.strictEqual(bubbleSwaps(data), bruteForce(data).inversions);
});

test('核心觀念：對調一對相鄰又反了的，逆序數對剛好少 1；分治數到的跟一對一對看一樣，兩半先排好也不影響一左一右的對數', () => {
  const list = [...SHELF];
  for (let left = bruteForce(list).inversions; left > 0; left--) {
    const k = list.findIndex((v, n) => n + 1 < list.length && v > list[n + 1]);
    [list[k], list[k + 1]] = [list[k + 1], list[k]];
    assert.strictEqual(bruteForce(list).inversions, left - 1);
  }
  assert.deepStrictEqual(list, sorted(SHELF));
  // 固定的亂數種子，試各種長度（含重複的數）
  let seed = 7; const random = (n) => { seed = (seed * 1103515245 + 12345) % 2147483648; return seed % n; };
  for (let round = 0; round < 200; round++) {
    const data = Array.from({ length: 1 + random(12) }, () => random(9));
    assert.strictEqual(countInversions(data).count, bruteForce(data).inversions, data.join(' '));
    const mid = Math.ceil(data.length / 2), l = data.slice(0, mid), r = data.slice(mid);
    const greater = (a, b) => a > b;
    assert.strictEqual(crossPairs(sorted(l), sorted(r), greater), crossPairs(l, r, greater));
    assert.strictEqual(bruteForce(data).inversions, bruteForce(l).inversions + bruteForce(r).inversions + crossPairs(l, r, greater));
  }
});

test('常見誤解：一樣大的不算；十萬筆的對數超過 int 的上限；數完陣列已經排好', () => {
  assert.strictEqual(bruteForce([5, 5]).inversions, 0);
  assert.strictEqual(countInversions([5, 5, 5, 5]).count, 0);
  assert.ok(pairsOf(100000) > 2 ** 31 - 1, 'int 最大是 2147483647');
  assert.ok(pairsOf(100000) < 2 ** 63, 'long long、long 裝得下');
  assert.deepStrictEqual(countInversions(SHELF).sorted, [1, 2, 3, 4, 5, 6, 7, 8]);
  assert.ok(/long long count_inversions/.test(page.code.c) && /long long count_inversions/.test(page.code.cpp) && /static long countInversions/.test(page.code.java));
});

test('追蹤器：左半 2、5、8，右半最後是 6 印 6、是 9 印 5；每組輸入 40 步以內', () => {
  assert.ok(page.trace.code.python.includes(`left = ${pyList(LEFT)}`));
  assert.ok(page.trace.code.python.includes('right = [1, 4, {{x}}]'));
  assert.deepStrictEqual(page.trace.inputs, [{ label: '右半最後是 6', values: { x: 6 } }, { label: '右半最後是 9', values: { x: 9 } }]);
  assert.strictEqual(mergeStep(LEFT, [1, 4, 6]).count, 6);
  assert.strictEqual(mergeStep(LEFT, [1, 4, 9]).count, 5);
  assert.strictEqual(crossPairs(LEFT, [1, 4, 6], (a, b) => a > b), 6);
  assert.strictEqual(crossPairs(LEFT, [1, 4, 9], (a, b) => a > b), 5);
  assert.strictEqual(page.trace.runs['右半最後是 6'].at(-1).out, '6\n');
  assert.strictEqual(page.trace.runs['右半最後是 9'].at(-1).out, '5\n');
  for (const { label } of page.trace.inputs) assert.ok(page.trace.runs[label].length <= 40, `${label} 有 ${page.trace.runs[label].length} 步`);
});

test('實作：那套漫畫 8 對、完全倒過來的 8 本 28 對，印出 8 28', () => {
  assert.ok(page.code.python.includes(`shelf = ${pyList(SHELF)}`) && page.code.python.includes(`backwards = ${pyList(BACKWARDS)}`));
  assert.deepStrictEqual(BACKWARDS, sorted(SHELF).reverse());
  assert.strictEqual(`${countInversions(SHELF).count} ${countInversions(BACKWARDS).count}`, '8 28');
  assert.strictEqual(`${bruteForce(SHELF).inversions} ${bruteForce(BACKWARDS).inversions}`, '8 28');
  assert.strictEqual(page.code.output, '8 28');
});

const optionOf = (q) => q.options[q.answer];

test('試試看第一題：左半 3、6、7、9 和右半 1、4、5、8 合併數到 11（4 + 3 + 3 + 1）；三個錯的選項各是一種看錯', () => {
  const q = page.tryit[0];
  const left = [3, 6, 7, 9], right = [1, 4, 5, 8];
  assert.ok(q.code.python.includes(`left = ${pyList(left)}`) && q.code.python.includes(`right = ${pyList(right)}`));
  assert.deepStrictEqual(sorted(left), left); assert.deepStrictEqual(sorted(right), right);
  assert.deepStrictEqual(mergeStep(left, right).added, [4, 3, 3, 1]);
  assert.strictEqual(mergeStep(left, right).count, 11);
  assert.strictEqual(crossPairs(left, right, (a, b) => a > b), 11);
  assert.strictEqual(optionOf(q), '11'); assert.strictEqual(q.output, '11');
  const onlyOne = mergeStep(left, right, { add: () => 1 }).count;
  const onLeft = mergeStep(left, right, { add: () => 0, addOnLeft: (i, j, n) => n - j }).count;
  const oneShort = mergeStep(left, right, { add: (i, j, n) => n - 1 - i });
  assert.deepStrictEqual(oneShort.added, [3, 2, 2, 0]);
  assert.deepStrictEqual(q.options, [onlyOne, onLeft, oneShort.count, 11].map(String));
  assert.deepStrictEqual(q.options, ['4', '5', '7', '11']);
});

test('試試看第二題：加在拿左半的時候印 3；移到拿右半、加左半還剩幾個是 6；其他三種改法是 3、5、3', () => {
  const q = page.tryit[1];
  assert.ok(q.code.python.includes(`left = ${pyList(LEFT)}`) && q.code.python.includes(`right = ${pyList(RIGHT)}`));
  const buggy = { add: () => 0, addOnLeft: (i, j, n) => n - j };
  assert.strictEqual(mergeStep(LEFT, RIGHT, buggy).count, 3);
  assert.strictEqual(q.output, '3');
  assert.strictEqual(q.answer, 1);
  assert.deepStrictEqual(mergeStep(LEFT, RIGHT).added, [3, 2, 1]);
  assert.strictEqual(mergeStep(LEFT, RIGHT).count, 6);
  assert.strictEqual(mergeStep(LEFT, RIGHT, { ...buggy, strict: true }).count, 3, '把 <= 改成 <');
  assert.strictEqual(mergeStep(LEFT, RIGHT, { add: () => 0, addOnLeft: (i, j, n) => n - i }).count, 5, '改成 3 - i、位置不動');
  assert.strictEqual(mergeStep(LEFT, RIGHT, { add: () => 1 }).count, 3, '移到 else、只加 1');
});

test('試試看第三題：左半 2、5、5 和右半 2、5、7，真正的逆序 2 對；比較寫成 < 印 5，多出來的 3 是一樣大的那 3 對', () => {
  const q = page.tryit[2];
  const left = [2, 5, 5], right = [2, 5, 7];
  assert.ok(q.code.python.includes(`left = ${pyList(left)}`) && q.code.python.includes(`right = ${pyList(right)}`));
  const greater = crossPairs(left, right, (a, b) => a > b), equal = crossPairs(left, right, (a, b) => a === b);
  assert.strictEqual(greater, 2); assert.strictEqual(equal, 3);
  assert.strictEqual(mergeStep(left, right).count, 2);
  assert.deepStrictEqual(mergeStep(left, right, { strict: true }).added, [3, 2]);
  assert.strictEqual(mergeStep(left, right, { strict: true }).count, 5);
  assert.strictEqual(optionOf(q), '5'); assert.strictEqual(q.output, '5');
  assert.deepStrictEqual(q.options, [greater, equal, greater + equal, left.length * right.length].map(String));
});

// 不開瀏覽器畫一次圖解：記下每段文字和每個格子的位置
function drawFigure() {
  const texts = [], cells = [];
  const kit = {
    svgEl: (width, height) => ({ width, height, append() {} }),
    svgText: (s, x, y, text, size) => { texts.push({ x, y, text, size }); return { setAttribute() {} }; },
    rough: { svg: () => ({ rectangle: (x, y, w, h, o) => { cells.push({ x, y, w, h, fill: o.fill }); return {}; }, line: () => ({}) }) },
    INK: 'ink', FILL: 'fill', NEW: 'new',
  };
  return { svg: page.figure(kit), texts, cells };
}
// 文字佔的範圍（置中對齊）：中文字和全形標點算一個字級寬，數字和符號算 0.6 個
const extent = ({ x, y, text, size }) => {
  const width = sum([...text].map(ch => (/[一-鿿：，、]/.test(ch) ? 1 : 0.6) * size));
  return { left: x - width / 2, right: x + width / 2, top: y - size / 2, bottom: y + size / 2 };
};
const inside = (b, c) => b.left >= c.x && b.right <= c.x + c.w && b.top >= c.y && b.bottom <= c.y + c.h;
const apart = (b, c) => b.right <= c.x || c.x + c.w <= b.left || b.bottom <= c.y || c.y + c.h <= b.top;

test('圖解：寬 320 以內；三列是拿 1、拿 4、拿 6 的那一刻，加 3、加 2、加 1，一共 6 對；左半還沒拿的和拿的那個數塗黃', () => {
  const { svg, texts, cells } = drawFigure();
  assert.ok(svg.width <= 320);
  assert.strictEqual(cells.length, 18, '三列，每列左半三格、右半三格');
  const { added } = mergeStep(LEFT, RIGHT);
  assert.deepStrictEqual(added, [3, 2, 1]);
  added.forEach((n, k) => {
    const row = cells.slice(k * 6, k * 6 + 6).map(c => c.fill);
    assert.deepStrictEqual(row.slice(0, 3), LEFT.map((_, at) => (at < 3 - n ? 'none' : 'new')), `第 ${k + 1} 列左半剩 ${n} 個`);
    assert.deepStrictEqual(row.slice(3), RIGHT.map((_, at) => (at < k ? 'none' : at === k ? 'new' : 'fill')), `第 ${k + 1} 列拿的是 ${RIGHT[k]}`);
    assert.ok(texts.some(t => t.text === `拿 ${RIGHT[k]}，左半剩 ${n} 個`));
    assert.ok(texts.some(t => t.text === `+${n}`));
  });
  assert.ok(texts.some(t => t.text === '3 + 2 + 1 = 6 對'));
  cells.forEach(c => assert.ok(c.x >= 0 && c.x + c.w <= svg.width && c.y >= 0 && c.y + c.h <= svg.height));
  cells.forEach((c, i) => cells.forEach((o, j) => assert.ok(i >= j || c.x + c.w <= o.x || o.x + o.w <= c.x || c.y + c.h <= o.y || o.y + o.h <= c.y, '格子疊在一起')));
  // 格子裡的數字：照畫的順序，每畫一格就寫一個數字
  const numbers = texts.filter(t => /^\d$/.test(t.text));
  assert.deepStrictEqual(numbers.map(t => t.text), [0, 1, 2].flatMap(() => [...LEFT, ...RIGHT]).map(String));
  numbers.forEach((t, k) => assert.ok(inside(extent(t), cells[k]), `格子裡的 ${t.text} 超出格子`));
  const boxes = texts.map(extent);
  boxes.forEach((b, i) => {
    assert.ok(b.left >= 0 && b.right <= svg.width && b.top >= 0 && b.bottom <= svg.height, `「${texts[i].text}」超出畫面`);
    boxes.forEach((o, j) => assert.ok(i >= j || b.right <= o.left || o.right <= b.left || b.bottom <= o.top || o.bottom <= b.top, `「${texts[i].text}」和「${texts[j].text}」疊在一起`));
    if (!numbers.includes(texts[i])) cells.forEach(c => assert.ok(apart(b, c), `「${texts[i].text}」壓到格子`));
  });
  assert.ok(!texts.some(t => /[⁰¹²³⁴-⁹ⁿ]/.test(t.text)), '不用 Unicode 上標字元');
});
