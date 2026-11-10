// tests/classroom-huffman.test.js（node --test）：霍夫曼編碼頁講義裡寫到的數字都算得出來
const test = require('node:test'); const assert = require('node:assert');
const page = require('../classroom/algorithms/huffman.js');

// 這一頁的訊息：五種字母各出現幾次，和圖解上的代碼表
const LETTERS = ['A', 'B', 'C', 'D', 'E'];
const COUNTS = [7, 4, 2, 1, 1];
const CODES = { A: '0', B: '10', C: '110', D: '1110', E: '1111' };
// 追蹤器的樹：節點 0 到 3 是中間的節點（0 是樹根），4 到 8 是 A 到 E
const GO0 = [4, 5, 6, 7], GO1 = [1, 2, 3, 8];
const sum = (list) => list.reduce((a, b) => a + b, 0);
const pyList = (list) => JSON.stringify(list).replaceAll(',', ', ');

// 建霍夫曼樹：每次挑次數最少的兩個合起來，照圖解的畫法把排在前面的符號放左邊、剛合出來的放右邊（flip 是左右對調）；
// 回傳每次合併的和、每個符號的代碼
function build(counts, names = LETTERS, flip = false) {
  let nodes = counts.map((count, i) => ({ count, name: names[i], order: i }));
  const merges = [];
  while (nodes.length > 1) {
    nodes.sort((a, b) => a.count - b.count || b.order - a.order);
    const [first, second] = [nodes[0], nodes[1]].sort((a, b) => (a.order - b.order) * (flip ? -1 : 1));
    merges.push(first.count + second.count);
    nodes = [{ count: first.count + second.count, left: first, right: second, order: Math.min(first.order, second.order) }, ...nodes.slice(2)];
  }
  const codes = {};
  const walk = (node, code) => { if (node.name) codes[node.name] = code; else { walk(node.left, code + '0'); walk(node.right, code + '1'); } };
  walk(nodes[0], '');
  return { merges, codes };
}
// 次數一樣時先合誰都試過：回傳每一種合法的總長度、和每個符號代碼長度的組合
function everyTree(counts) {
  const totals = new Set(), shapes = new Set();
  (function go(nodes, total) {
    if (nodes.length === 1) { totals.add(total); shapes.add(nodes[0].depths.join(',')); return; }
    const sorted = [...nodes].sort((a, b) => a.count - b.count);
    const second = sorted[1].count;
    for (let i = 0; i < nodes.length; i++) for (let j = i + 1; j < nodes.length; j++) {
      const pair = [nodes[i].count, nodes[j].count].sort((a, b) => a - b);
      if (pair[0] !== sorted[0].count || pair[1] !== second) continue;
      const depths = nodes[i].depths.map((d, k) => (d >= 0 || nodes[j].depths[k] >= 0 ? Math.max(d, nodes[j].depths[k]) + 1 : -1));
      go([...nodes.filter((_, k) => k !== i && k !== j), { count: pair[0] + pair[1], depths }], total + pair[0] + pair[1]);
    }
  })(counts.map((count, i) => ({ count, depths: counts.map((_, k) => (k === i ? 0 : -1)) })), 0);
  return { totals: [...totals], shapes: [...shapes] };
}
// 每個符號的代碼長度全部試過（要湊得成前綴碼：2 的負長度次方加起來不超過 1），回傳最短的總長度
function shortestTotal(counts, maxLength = 6) {
  let best = Infinity;
  (function go(i, kraft, total) {
    if (kraft > 1) return;
    if (i === counts.length) { best = Math.min(best, total); return; }
    for (let length = 1; length <= maxLength; length++) go(i + 1, kraft + 2 ** -length, total + counts[i] * length);
  })(0, 0, 0);
  return best;
}
// 照樹解碼：flip 是把 0、1 的方向看反，once 是解出第一個字母就停
function decode(bits, { flip = false, once = false } = {}) {
  let node = 0, out = '';
  for (const bit of bits) {
    node = (bit === 0) !== flip ? GO0[node] : GO1[node];
    if (node >= 4) { out += LETTERS[node - 4]; node = 0; if (once) break; }
  }
  return out;
}
// 一串位元照代碼表有幾種切法
function parses(bits, codes) {
  if (bits === '') return 1;
  return sum(Object.values(codes).filter(c => bits.startsWith(c)).map(c => parses(bits.slice(c.length), codes)));
}
// 頁面上「每次用迴圈找兩個合起來」的寫法；largest 是挑成最大的兩個，add 是加倒數第幾格，until 是 while 做到剩幾個
function mergeLoop(input, { largest = false, add = 2, until = 1 } = {}) {
  const counts = [...input]; let n = counts.length, total = 0;
  while (n > until) {
    for (let k = 0; k < 2; k++) {
      let pick = 0;
      for (let i = 1; i < n - k; i++) if (largest ? counts[i] > counts[pick] : counts[i] < counts[pick]) pick = i;
      [counts[pick], counts[n - 1 - k]] = [counts[n - 1 - k], counts[pick]];
    }
    counts[n - 2] += counts[n - 1];
    total += counts[n - add];
    n -= 1;
  }
  return total;
}
// 照陣列的順序從頭合，不挑最小的
const mergeInOrder = (counts) => { let acc = counts[0], total = 0; for (const c of counts.slice(1)) { acc += c; total += acc; } return total; };
const optionOf = (q) => q.options[q.answer];

test('複習、總結、跑幾步：15 個字、五種字母要 3 個位元，固定長度 45 個位元；霍夫曼 29 個', () => {
  assert.strictEqual(sum(COUNTS), 15);
  assert.strictEqual(Math.ceil(Math.log2(LETTERS.length)), 3, '2 個位元只分得出 4 種，五種字母要 3 個');
  assert.strictEqual(sum(COUNTS) * 3, 45);
  assert.strictEqual(sum(COUNTS.map((c, i) => c * CODES[LETTERS[i]].length)), 29);
  assert.ok(page.review[0].includes('15 個字') && page.review[0].includes('45 個位元') && page.review[0].includes('A 出現了 7 次') && page.review[0].includes('E 只出現 1 次'));
  assert.ok(page.summary.includes('從 45 個位元變成 29 個'));
  assert.strictEqual(page.cost.rows[0][1], '15 × 3 = 45 個位元');
});

test('圖解和核心觀念：D、E 合成 2，再合成 4、8、15，加起來 29；代碼是 A = 0、B = 10、C = 110、D = 1110、E = 1111', () => {
  const { merges, codes } = build(COUNTS);
  assert.deepStrictEqual(merges, [2, 4, 8, 15]);
  assert.strictEqual(sum(merges), 29);
  assert.ok(page.concept[4].includes('2 + 4 + 8 + 15 = 29'));
  assert.deepStrictEqual(codes, CODES);
  assert.deepStrictEqual(LETTERS.map(l => CODES[l].length), [1, 2, 3, 4, 4], 'A 一個位元、B 兩個、C 三個、D 和 E 四個');
});

test('核心觀念：沒有一個代碼是另一個代碼的開頭；29 是所有前綴碼裡最短的', () => {
  for (const a of LETTERS) for (const b of LETTERS) assert.ok(a === b || !CODES[b].startsWith(CODES[a]), `${a} 的代碼是 ${b} 的開頭`);
  assert.strictEqual(shortestTotal(COUNTS), 29);
});

test('常見誤解：A = 0、B = 1、C = 00 時 00 有兩種讀法；左右對調代碼不一樣、總長度一樣是 29；次數一樣時先合誰，代碼長度不一樣、總長度一樣', () => {
  assert.strictEqual(parses('00', { A: '0', B: '1', C: '00' }), 2);
  assert.strictEqual(parses('00', CODES), 1, '用前綴碼就只有一種讀法');
  const flipped = build(COUNTS, LETTERS, true).codes;
  assert.notDeepStrictEqual(flipped, CODES);
  assert.strictEqual(sum(COUNTS.map((c, i) => c * flipped[LETTERS[i]].length)), 29);
  assert.deepStrictEqual(everyTree(COUNTS).totals, [29]);
  // 2、2、1、1：合出 2 之後有三個 2，先合哪兩個，代碼長度會是 1、2、3、3 或 2、2、2、2，總長度都是 12
  const { totals, shapes } = everyTree([2, 2, 1, 1]);
  assert.deepStrictEqual(totals, [12]);
  assert.ok(shapes.includes('2,2,2,2') && shapes.length > 1, `代碼長度的組合：${shapes.join('｜')}`);
});

test('常見誤解和實作：四種符號各出現 5 次，每個代碼都是 2 個位元，40 個位元跟固定長度一樣', () => {
  const { codes } = build([5, 5, 5, 5], ['A', 'B', 'C', 'D']);
  assert.deepStrictEqual(Object.values(codes).map(c => c.length), [2, 2, 2, 2]);
  assert.strictEqual(mergeLoop([5, 5, 5, 5]), 40);
  assert.strictEqual(20 * 2, 40);
});

test('用途：摩斯電碼的 E 是一個點、Q 是四個符號', () => {
  const MORSE = { E: '.', Q: '--.-' };
  assert.strictEqual(MORSE.E, '.');
  assert.strictEqual(MORSE.Q.length, 4);
});

test('追蹤器：go0、go1 就是圖解那棵樹；兩組輸入印出 BD、BE；每組輸入 40 步以內', () => {
  const python = page.trace.code.python;
  assert.ok(python.includes(`go0 = ${pyList(GO0)}`) && python.includes(`go1 = ${pyList(GO1)}`) && python.includes('letters = "ABCDE"'));
  assert.ok(python.includes('bits = [1, 0, 1, 1, 1, {{b}}]'));
  LETTERS.forEach((letter) => assert.strictEqual(decode([...CODES[letter]].map(Number)), letter, `照 ${letter} 的代碼走，要走到 ${letter}`));
  assert.strictEqual(decode([1, 0, 1, 1, 1, 0]), 'BD');
  assert.strictEqual(decode([1, 0, 1, 1, 1, 1]), 'BE');
  assert.strictEqual(page.trace.runs['最後一個位元是 0'].at(-1).out, 'BD\n');
  assert.strictEqual(page.trace.runs['最後一個位元是 1'].at(-1).out, 'BE\n');
  for (const { label } of page.trace.inputs) assert.ok(page.trace.runs[label].length <= 40, `${label} 有 ${page.trace.runs[label].length} 步`);
});

test('實作：7、4、2、1、1 是 29，四個 5 是 40，印出 29 40', () => {
  assert.strictEqual(`${mergeLoop(COUNTS)} ${mergeLoop([5, 5, 5, 5])}`, '29 40');
  assert.strictEqual(page.code.output, '29 40');
  assert.ok(page.code.python.includes(`message = ${pyList(COUNTS)}`) && page.code.python.includes('even = [5, 5, 5, 5]'));
});

test('試試看第一題：110、0、10 解成 CAB；三個錯的選項是方向看反、從後面讀、解一個字就停', () => {
  const q = page.tryit[0];
  const bits = [1, 1, 0, 0, 1, 0];
  assert.ok(q.code.python.includes(`bits = ${pyList(bits)}`));
  assert.strictEqual(bits.join(''), CODES.C + CODES.A + CODES.B);
  assert.strictEqual(decode(bits), 'CAB');
  assert.strictEqual(optionOf(q), 'CAB'); assert.strictEqual(q.output, 'CAB');
  assert.deepStrictEqual(q.options, [decode(bits, { flip: true }), decode([...bits].reverse()), decode(bits, { once: true }), 'CAB']);
  assert.deepStrictEqual(q.options, ['AAC', 'ABA', 'C', 'CAB']);
});

test('試試看第二題：5、3、2、2 合出 4、7、12，一共 23；錯的選項是只看最後一次、固定 2 個位元、照順序合', () => {
  const q = page.tryit[1];
  const counts = [5, 3, 2, 2];
  assert.ok(q.code.python.includes(`counts = ${pyList(counts)}`));
  assert.deepStrictEqual(build(counts, ['A', 'B', 'C', 'D']).merges, [4, 7, 12]);
  assert.strictEqual(mergeLoop(counts), 23);
  assert.strictEqual(shortestTotal(counts), 23);
  assert.strictEqual(optionOf(q), '23'); assert.strictEqual(q.output, '23');
  assert.strictEqual(Math.ceil(Math.log2(counts.length)), 2);
  assert.deepStrictEqual(q.options, [sum(counts), 23, sum(counts) * 2, mergeInOrder(counts)].map(String));
  assert.deepStrictEqual(q.options, ['12', '23', '24', '30']);
});

test('試試看第三題：挑成最大的兩個印 53，比固定長度的 45 多；改回 < 是 29，另外三種改法是 53、45、38', () => {
  const q = page.tryit[2];
  assert.ok(q.code.python.includes(`counts = ${pyList(COUNTS)}`));
  assert.strictEqual(mergeLoop(COUNTS, { largest: true }), 53);
  assert.strictEqual(11 + 13 + 14 + 15, 53);
  assert.ok(53 > sum(COUNTS) * 3);
  assert.strictEqual(q.output, '53');
  assert.strictEqual(q.answer, 2);
  assert.ok(optionOf(q).includes('counts[i] < counts[pick]'));
  assert.strictEqual(mergeLoop(COUNTS), 29);
  assert.strictEqual(mergeLoop([...COUNTS].sort((a, b) => a - b), { largest: true }), 53, '先排序再跑，還是 53');
  assert.strictEqual(mergeLoop(COUNTS, { largest: true, add: 1 }), 45);
  assert.strictEqual(mergeLoop(COUNTS, { largest: true, until: 2 }), 38);
  for (const text of ['加起來 53', '一樣印出 53', '印出 45', '印出 38', '2 + 4 + 8 + 15 = 29']) assert.ok(q.why.includes(text), text);
});

// 不開瀏覽器畫一次圖解：記下每段文字、每個節點（圓的是合併出來的、方的是符號）和每條邊的位置
function drawFigure() {
  const texts = [], shapes = [], edges = [];
  const kit = {
    svgEl: (width, height) => ({ width, height, append() {} }),
    svgText: (s, x, y, text, size) => { texts.push({ x, y, text, size }); return { setAttribute() {} }; },
    rough: { svg: () => ({
      rectangle: (x, y, w, h, o) => { shapes.push({ kind: 'leaf', x, y, w, h, fill: o.fill }); return {}; },
      circle: (cx, cy, d, o) => { shapes.push({ kind: 'inner', x: cx - d / 2, y: cy - d / 2, w: d, h: d, fill: o.fill }); return {}; },
      line: (x1, y1, x2, y2) => { edges.push({ x1, y1, x2, y2 }); return {}; },
    }) },
    INK: 'ink', FILL: 'fill', NEW: 'new',
  };
  return { svg: page.figure(kit), texts, shapes, edges };
}
// 文字佔的範圍（置中對齊）：中文字算一個字級寬，數字和符號算 0.6 個
const extent = ({ x, y, text, size }) => {
  const width = sum([...text].map(ch => (/[一-鿿：，、]/.test(ch) ? 1 : 0.6) * size));
  return { left: x - width / 2, right: x + width / 2, top: y - size / 2, bottom: y + size / 2 };
};
const apart = (a, b) => a.right <= b.left || b.right <= a.left || a.bottom <= b.top || b.bottom <= a.top;
const boxOf = (shape) => ({ left: shape.x, right: shape.x + shape.w, top: shape.y, bottom: shape.y + shape.h });
const centerOf = (shape) => ({ x: shape.x + shape.w / 2, y: shape.y + shape.h / 2 });

test('圖解：寬 320 以內；樹一路往右下長，節點寫次數、符號旁邊寫字母、邊上往左 0 往右 1；代碼表和樹對得起來', () => {
  const { svg, texts, shapes, edges } = drawFigure();
  assert.ok(svg.width <= 320);
  const inner = shapes.filter(s => s.kind === 'inner').map(centerOf), leaves = shapes.filter(s => s.kind === 'leaf').map(centerOf);
  assert.strictEqual(inner.length, 4); assert.strictEqual(leaves.length, 5);
  const textAt = (p) => texts.find(t => t.x === p.x && t.y === p.y)?.text;
  assert.deepStrictEqual(inner.map(textAt), ['15', '8', '4', '2']);
  assert.deepStrictEqual(leaves.map(textAt), COUNTS.map(String));
  leaves.forEach((p, i) => assert.ok(texts.some(t => t.text === LETTERS[i] && t.x === p.x && t.y > p.y && t.y - p.y < 30), `${LETTERS[i]} 的字母要在它的葉子下面`));
  // 每個中間節點：左下是一個符號，右下是下一個中間節點（最後一個的右下是 E）
  inner.forEach((p, i) => {
    const left = leaves[i], right = i < 3 ? inner[i + 1] : leaves[4];
    assert.ok(left.x < p.x && left.y > p.y, `${LETTERS[i]} 在第 ${i + 1} 個中間節點的左下`);
    assert.ok(right.x > p.x && right.y > p.y, `第 ${i + 1} 個中間節點的右邊往右下長`);
    for (const to of [left, right]) assert.ok(edges.some(e => e.x1 === p.x && e.y1 === p.y && e.x2 === to.x && e.y2 === to.y), '父子之間有一條邊');
    const zero = texts.find(t => t.text === '0' && t.size === 11 && t.y > p.y && t.y < left.y && t.x < p.x && t.x > left.x - 10);
    const one = texts.find(t => t.text === '1' && t.size === 11 && t.y > p.y && t.y < right.y && t.x > p.x && t.x < right.x + 10);
    assert.ok(zero && one, `第 ${i + 1} 個中間節點的兩條邊要標 0 和 1`);
  });
  assert.strictEqual(edges.length, 8);
  // 代碼表：每個字母那一列，= 右邊的位元由左到右接起來就是它的代碼
  LETTERS.forEach((letter) => {
    const head = texts.find(t => t.text === letter && t.x > 220);
    assert.ok(head, `代碼表少了 ${letter}`);
    const row = texts.filter(t => t.y === head.y && t.x > head.x).sort((a, b) => a.x - b.x).map(t => t.text).join('');
    assert.strictEqual(row, `=${CODES[letter]}`);
  });
  assert.ok(texts.some(t => t.text.includes('往左記 0') && t.text.includes('往右記 1') && t.text.includes('15 個字一共 29 個位元')));
  for (const t of texts) assert.ok(!/[⁰¹²³⁴-⁹ⁿ]/.test(t.text), `「${t.text}」用了 Unicode 上標`);
  const boxes = texts.map(extent);
  shapes.map(boxOf).forEach((b) => assert.ok(b.left >= 0 && b.right <= svg.width && b.top >= 0 && b.bottom <= svg.height, '節點超出畫面'));
  boxes.forEach((b, i) => {
    assert.ok(b.left >= 0 && b.right <= svg.width && b.top >= 0 && b.bottom <= svg.height, `「${texts[i].text}」超出畫面`);
    boxes.forEach((o, j) => assert.ok(i >= j || apart(b, o), `「${texts[i].text}」和「${texts[j].text}」疊在一起`));
    // 節點裡的次數以外，文字不壓到節點
    shapes.forEach((shape) => {
      const c = centerOf(shape);
      assert.ok((texts[i].x === c.x && texts[i].y === c.y) || apart(b, boxOf(shape)), `「${texts[i].text}」壓到節點`);
    });
  });
  // 節點之間不互相疊到
  shapes.forEach((a, i) => shapes.forEach((b, j) => assert.ok(i >= j || apart(boxOf(a), boxOf(b)), '兩個節點疊在一起')));
});
