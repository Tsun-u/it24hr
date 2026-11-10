// tests/classroom-integral_image.test.js（node --test）：積分影像頁講義裡寫到的數字都算得出來
const test = require('node:test'); const assert = require('node:assert');
const page = require('../classroom/algorithms/integral_image.js');

// 圖解和實作共用的 4 × 5 小圖；圖解算的是第 2～3 列、第 2～4 行那一塊（列、行從 1 數）
const IMG = [[3, 1, 4, 1, 5], [2, 6, 0, 3, 2], [1, 4, 2, 7, 1], [5, 0, 3, 2, 4]];
const BLOCK = [2, 2, 3, 4];
// 追蹤器的 3 × 3 小圖
const SMALL = [[2, 1, 3], [0, 4, 1], [5, 2, 2]];

const sum = (list) => list.reduce((a, b) => a + b, 0);
const literal = (grid) => JSON.stringify(grid).replaceAll(',', ', ');
// 一格一格加：第 r1 到 r2 列、第 c1 到 c2 行
const slowSum = (img, r1, c1, r2, c2) => sum(img.slice(r1 - 1, r2).map(row => sum(row.slice(c1 - 1, c2))));
// 建累計表；cell(total, img, i, j) 是每一格的算法，預設是頁面上的那一條
const RIGHT_CELL = (t, img, i, j) => img[i - 1][j - 1] + t[i - 1][j] + t[i][j - 1] - t[i - 1][j - 1];
function buildTotal(img, cell = RIGHT_CELL) {
  const total = Array.from({ length: img.length + 1 }, () => new Array(img[0].length + 1).fill(0));
  for (let i = 1; i <= img.length; i++) for (let j = 1; j <= img[0].length; j++) total[i][j] = cell(total, img, i, j);
  return total;
}
const regionSum = (t, r1, c1, r2, c2) => t[r2][c2] - t[r1 - 1][c2] - t[r2][c1 - 1] + t[r1 - 1][c1 - 1];

test('累計表：每一格都是左上角到那一格的總和；任何一塊用四個數算出來，都跟一格一格加一樣', () => {
  for (const img of [IMG, SMALL]) {
    const total = buildTotal(img), rows = img.length, cols = img[0].length;
    for (let i = 0; i <= rows; i++) for (let j = 0; j <= cols; j++) assert.strictEqual(total[i][j], slowSum(img, 1, 1, i, j));
    for (let r1 = 1; r1 <= rows; r1++) for (let r2 = r1; r2 <= rows; r2++) for (let c1 = 1; c1 <= cols; c1++) for (let c2 = c1; c2 <= cols; c2++) {
      assert.strictEqual(regionSum(total, r1, c1, r2, c2), slowSum(img, r1, c1, r2, c2));
    }
  }
});

test('複習和跑幾步：100 × 100 的框是一萬個像素；幾萬個框就是幾億次加法；查表是 4 個數', () => {
  assert.strictEqual(100 * 100, 10000);
  for (const boxes of [10000, 50000, 90000]) assert.ok(boxes * 10000 >= 1e8 && boxes * 10000 < 1e9, `${boxes} 個框`);
  assert.ok(page.review.some(t => t.text && t.text.includes('一個 100 × 100 的框有一萬個像素，幾萬個框就是幾億次加法')));
  assert.ok(page.cost.note.text.includes('100 × 100 的框一格一格加是一萬次，查表是 4 次'));
  assert.strictEqual(RIGHT_CELL.toString().match(/t\[/g).length + 1, 4, '建表一格：這一格加上表裡的三個數');
  assert.strictEqual(regionSum.toString().match(/t\[/g).length, 4, '問一塊：表裡的四個數');
});

test('常見誤解一：只拿右下角減左上角，上面一整條和左邊一整條都還留在裡面', () => {
  const [r1, c1, r2, c2] = BLOCK, total = buildTotal(IMG);
  const twoNumbers = total[r2][c2] - total[r1 - 1][c1 - 1];
  const above = slowSum(IMG, 1, c1, r1 - 1, c2), left = slowSum(IMG, r1, 1, r2, c1 - 1);
  assert.strictEqual(twoNumbers, 31);
  assert.strictEqual(twoNumbers, regionSum(total, ...BLOCK) + above + left);
  assert.ok(above > 0 && left > 0);
});

test('常見誤解二：建表只加上面和左邊，左上角那一塊被加了兩次', () => {
  const wrong = buildTotal(IMG, (t, img, i, j) => img[i - 1][j - 1] + t[i - 1][j] + t[i][j - 1]);
  const right = buildTotal(IMG);
  assert.strictEqual(wrong[2][2] - right[2][2], right[1][1], '第 2 列第 2 行那一格，多出來的剛好是左上角那一塊');
  assert.notDeepStrictEqual(wrong, right);
});

test('常見誤解三：上面減成 total[r1][c2]，第 r1 列整列就不見了', () => {
  const [r1, c1, r2, c2] = BLOCK, t = buildTotal(IMG);
  const wrong = t[r2][c2] - t[r1][c2] - t[r2][c1 - 1] + t[r1 - 1][c1 - 1];
  assert.strictEqual(regionSum(t, ...BLOCK) - wrong, slowSum(IMG, r1, 1, r1, c2), '少掉的是第 r1 列從第 1 行到第 c2 行');
  assert.notStrictEqual(wrong, regionSum(t, ...BLOCK));
});

test('常見誤解四：原圖改一格，那一格右下方的每一格累計都會變', () => {
  const before = buildTotal(IMG), rows = IMG.length, cols = IMG[0].length;
  for (let r = 1; r <= rows; r++) for (let c = 1; c <= cols; c++) {
    const changed = IMG.map(row => [...row]); changed[r - 1][c - 1] += 1;
    const after = buildTotal(changed);
    for (let i = 0; i <= rows; i++) for (let j = 0; j <= cols; j++) assert.strictEqual(after[i][j] !== before[i][j], i >= r && j >= c);
  }
  const first = IMG.map(row => [...row]); first[0][0] += 1;
  assert.strictEqual(buildTotal(first).flat().filter((v, k) => v !== before.flat()[k]).length, rows * cols, '改左上角那一格，整張表都要重算');
});

test('追蹤器：3 × 3 的小圖；下面兩列印 14、右下 2 × 2 印 9；每組輸入 40 步以內', () => {
  assert.ok(page.trace.code.python.includes(`img = ${literal(SMALL)}`));
  assert.deepStrictEqual(page.trace.inputs.map(i => [i.label, i.values]), [['下面兩列', { r: 1, c: 0 }], ['右下 2 × 2', { r: 1, c: 1 }]]);
  // 程式問的是第 r + 1 到 3 列、第 c + 1 到 3 行
  const total = buildTotal(SMALL);
  const expected = { '下面兩列': slowSum(SMALL, 2, 1, 3, 3), '右下 2 × 2': slowSum(SMALL, 2, 2, 3, 3) };
  assert.deepStrictEqual(expected, { '下面兩列': 14, '右下 2 × 2': 9 });
  for (const { label, values: { r, c } } of page.trace.inputs) {
    assert.strictEqual(total[3][3] - total[r][3] - total[3][c] + total[r][c], expected[label]);
    const run = page.trace.runs[label];
    assert.strictEqual(run.at(-1).out, `${expected[label]}\n`);
    assert.deepStrictEqual(run.at(-1).vars.total, total, '追蹤器跑出來的累計表');
    assert.ok(run.length <= 40, `${label} 有 ${run.length} 步`);
  }
});

test('實作：圖解那一塊是 22、貼著左上角的 2 × 3 那一塊是 16，印出 22 16；四種語言用的是同一張圖', () => {
  const total = buildTotal(IMG);
  assert.strictEqual(`${regionSum(total, 2, 2, 3, 4)} ${regionSum(total, 1, 1, 2, 3)}`, '22 16');
  assert.strictEqual(`${slowSum(IMG, 2, 2, 3, 4)} ${slowSum(IMG, 1, 1, 2, 3)}`, '22 16');
  assert.strictEqual(page.code.output, '22 16');
  assert.ok(page.code.python.includes(`img = ${literal(IMG)}`));
  const braces = literal(IMG).replaceAll('[', '{').replaceAll(']', '}');
  for (const lang of ['c', 'cpp', 'java']) assert.ok(page.code[lang].includes(braces), lang);
  assert.ok(IMG.flat().every(v => Number.isInteger(v) && v >= 0 && v <= 9), '每一格都是個位數');
});

const optionOf = (q) => q.options[q.answer];

test('試試看第一題：1 到 9 的 3 × 3 小圖，第 2～3 列、第 2～3 行是 28；三個錯的選項各是一種看錯', () => {
  const q = page.tryit[0];
  const img = [[1, 2, 3], [4, 5, 6], [7, 8, 9]], t = buildTotal(img);
  assert.ok(q.code.python.includes(`total = ${literal(t)}`), '題目給的累計表');
  assert.ok(q.code.python.includes('r1, c1, r2, c2 = 2, 2, 3, 3'));
  const [r1, c1, r2, c2] = [2, 2, 3, 3];
  assert.deepStrictEqual([t[r2][c2], t[r1 - 1][c2], t[r2][c1 - 1], t[r1 - 1][c1 - 1]], [45, 6, 12, 1]);
  assert.deepStrictEqual([t[r1][c2], t[r2][c1], t[r1][c1]], [21, 27, 12]);
  assert.strictEqual(slowSum(img, r1, c1, r2, c2), 5 + 6 + 8 + 9);
  assert.deepStrictEqual(q.options, [
    t[r2][c2] - t[r1 - 1][c1 - 1],                              // 只用兩個數
    t[r2][c2] - t[r1 - 1][c2] - t[r2][c1 - 1],                  // 忘了把左上角加回來
    regionSum(t, r1, c1, r2, c2),
    t[r2][c2] - t[r1][c2] - t[r2][c1] + t[r1][c1],              // r1 − 1、c1 − 1 看成 r1、c1
  ].map(String));
  assert.deepStrictEqual(q.options, ['44', '27', '28', '9']);
  assert.strictEqual(optionOf(q), '28'); assert.strictEqual(q.output, '28');
  assert.strictEqual(img[2][2], 9, '看錯成 r1、c1 的話只剩右下角那一格');
});

test('試試看第二題：2 × 2 的小圖忘了扣左上角印 11；四種改法是 12、10、7、8', () => {
  const q = page.tryit[1];
  const img = [[1, 2], [3, 4]];
  assert.ok(q.code.python.includes(`img = ${literal(img)}`));
  const corner = (cell) => buildTotal(img, cell)[2][2];
  const buggy = buildTotal(img, (t, g, i, j) => g[i - 1][j - 1] + t[i - 1][j] + t[i][j - 1]);
  assert.strictEqual(buggy[2][2], 11); assert.strictEqual(q.output, '11');
  assert.deepStrictEqual([buggy[1][2], buggy[2][1]], [3, 4], '上面那格 3、左邊那格 4');
  assert.strictEqual(sum(img.flat()), 10);
  const fixes = [
    (t, g, i, j) => g[i - 1][j - 1] + t[i - 1][j] + t[i][j - 1] + t[i - 1][j - 1],
    RIGHT_CELL,
    (t, g, i, j) => g[i - 1][j - 1] + t[i][j - 1],
    (t, g, i, j) => g[i - 1][j - 1] + t[i - 1][j - 1] + t[i][j - 1],
  ];
  assert.deepStrictEqual(fixes.map(corner), [12, 10, 7, 8]);
  assert.strictEqual(q.answer, 1);
  assert.ok(q.options[1].includes('減掉 total[i - 1][j - 1]'));
});

test('試試看第三題：1000 × 1000 的圖問 1000 次 100 × 100 的框，一格一格加一千萬次、累計表 3003000 次', () => {
  const q = page.tryit[2];
  const [n, queries, h, w] = [1000, 1000, 100, 100];
  assert.ok(q.code.python.includes('n, q, h, w = 1000, 1000, 100, 100'));
  const slow = queries * h * w, fast = n * n * 3 + queries * 3;
  assert.deepStrictEqual(q.options, [
    `${slow} ${queries * 3}`,                 // 忘了建表那一趟
    `${queries * h} ${fast}`,                 // 一個框只數了一邊
    `${slow} ${n * n + queries}`,             // 每格、每個框都當成一次
    `${slow} ${fast}`,
  ]);
  assert.strictEqual(optionOf(q), '10000000 3003000'); assert.strictEqual(q.output, '10000000 3003000');
  assert.deepStrictEqual([h * w, n * n, n * n * 3, queries * 3], [10000, 1000000, 3000000, 3000]);
  assert.ok(slow < 2 ** 31, 'int 裝得下');
});

// 不開瀏覽器畫一次圖解：記下每段文字、每個長方形的位置
function drawFigure() {
  const texts = [], rects = [];
  const kit = {
    svgEl: (width, height) => ({ width, height, append() {} }),
    svgText: (s, x, y, text, size) => { texts.push({ x, y, text, size }); return { setAttribute() {} }; },
    rough: { svg: () => ({ rectangle: (x, y, w, h, o) => { rects.push({ x, y, w, h, fill: o.fill }); return {}; }, line: () => ({}) }) },
    INK: 'ink', FILL: 'fill', NEW: 'new',
  };
  return { svg: page.figure(kit), texts, rects };
}
// 文字佔的範圍（置中對齊）：中文字和全形標點算一個字級寬，數字和符號算 0.6 個
const extent = ({ x, y, text, size }) => {
  const width = sum([...text].map(ch => (/[一-鿿：，、～（）]/.test(ch) ? 1 : 0.6) * size));
  return { left: x - width / 2, right: x + width / 2, top: y - size / 2, bottom: y + size / 2 };
};
const apart = (a, b) => a.right <= b.left || b.right <= a.left || a.bottom <= b.top || b.bottom <= a.top;
const edges = (r) => ({ left: r.x, right: r.x + r.w, top: r.y, bottom: r.y + r.h });

test('圖解：寬 320 以內；上面是 4 × 5 的小圖、要的那一塊塗黃；四張小圖是 34、9、6、3，算出 22', () => {
  const { svg, texts, rects } = drawFigure();
  assert.ok(svg.width <= 320);
  const [r1, c1, r2, c2] = BLOCK, total = buildTotal(IMG);
  const four = [total[r2][c2], total[r1 - 1][c2], total[r2][c1 - 1], total[r1 - 1][c1 - 1]];
  assert.deepStrictEqual(four, [34, 9, 6, 3]);
  assert.strictEqual(four[0] - four[1] - four[2] + four[3], 22);
  assert.strictEqual(slowSum(IMG, ...BLOCK), 22);
  assert.strictEqual(new Set([...four, 22]).size, 5, '五個數都不一樣，圖上不會認錯');

  // 前 20 個長方形是小圖的格子，一列一列畫
  const cells = rects.slice(0, 20), digits = texts.filter(t => t.size === 14).slice(0, 20);
  assert.deepStrictEqual(digits.map(t => Number(t.text)), IMG.flat());
  cells.forEach((cell, k) => {
    const i = Math.floor(k / 5) + 1, j = k % 5 + 1;
    assert.strictEqual(cell.fill === 'new', i >= r1 && i <= r2 && j >= c1 && j <= c2, `第 ${i} 列第 ${j} 行`);
    assert.strictEqual(cell.x - cells[0].x, (j - 1) * cell.w); assert.strictEqual(cell.y - cells[0].y, (i - 1) * cell.h);
    assert.ok(digits[k].x > cell.x && digits[k].x < cell.x + cell.w && digits[k].y > cell.y && digits[k].y < cell.y + cell.h, '數字在格子裡');
  });

  // 接著每張小圖三個長方形：整張、那一張講的那一塊（從左上角開始）、要的那一塊
  const panels = [0, 1, 2, 3].map(k => rects.slice(20 + k * 3, 23 + k * 3));
  assert.strictEqual(rects.length, 32);
  const corners = [[r2, c2], [r1 - 1, c2], [r2, c1 - 1], [r1 - 1, c1 - 1]];
  panels.forEach(([whole, part, want], k) => {
    const cell = whole.w / 5;
    assert.strictEqual(whole.h, cell * 4);
    assert.deepStrictEqual([part.x, part.y, part.w, part.h], [whole.x, whole.y, corners[k][1] * cell, corners[k][0] * cell], `第 ${k + 1} 張`);
    assert.deepStrictEqual([want.x, want.y, want.w, want.h], [whole.x + (c1 - 1) * cell, whole.y + (r1 - 1) * cell, (c2 - c1 + 1) * cell, (r2 - r1 + 1) * cell]);
    assert.strictEqual(want.fill, 'new');
    assert.ok(part.fill !== 'new' && part.fill !== 'fill', '那一塊用另一個顏色');
    assert.ok(texts.some(t => t.text === `total[${corners[k][0]}][${corners[k][1]}]`));
    assert.ok(texts.some(t => t.text === String(four[k]) && Math.abs(t.x - (whole.x + whole.w / 2)) < 1), `第 ${k + 1} 張底下寫 ${four[k]}`);
    if (k > 0) assert.ok(edges(panels[k - 1][0]).right < whole.x);
  });
  assert.deepStrictEqual(texts.filter(t => t.text === '−' || t.text === '+').map(t => t.text), ['−', '−', '+']);
  assert.ok(texts.some(t => t.text === '34 − 9 − 6 + 3 = 22'));
  assert.ok(texts.some(t => t.text === '要算第 2～3 列、第 2～4 行那一塊'));
  for (const t of texts) assert.ok(!/[⁰¹²³⁴-⁹]/.test(t.text), `「${t.text}」用了上標字元`);
});

test('圖解：文字不超出畫面、不互相疊到；除了格子裡的數字，文字不壓到長方形', () => {
  const { svg, texts, rects } = drawFigure();
  const boxes = texts.map(extent), inCell = new Set(texts.filter(t => t.size === 14).slice(0, 20));
  for (const r of rects) assert.ok(r.x >= 0 && r.x + r.w <= svg.width && r.y >= 0 && r.y + r.h <= svg.height);
  boxes.forEach((b, i) => {
    assert.ok(b.left >= 0 && b.right <= svg.width && b.top >= 0 && b.bottom <= svg.height, `「${texts[i].text}」超出畫面`);
    boxes.forEach((o, j) => assert.ok(i >= j || apart(b, o), `「${texts[i].text}」和「${texts[j].text}」疊在一起`));
    if (!inCell.has(texts[i])) rects.forEach((r) => assert.ok(apart(b, edges(r)), `「${texts[i].text}」壓到長方形`));
  });
});
