// tests/classroom-n_queens.test.js（node --test）：八皇后頁講義裡寫到的數字都算得出來
const test = require('node:test'); const assert = require('node:assert');
const page = require('../classroom/algorithms/n_queens.js');

// 檢查的幾種寫法：傳入 diff（前面那個皇后的行減新皇后的行）、row、k，回傳會不會被吃到
const CHECKS = {
  full: (diff, row, k) => diff === 0 || diff === row - k || diff === k - row,
  columnOnly: (diff) => diff === 0,
  diagonalsOnly: (diff, row, k) => diff === row - k || diff === k - row,
  oneDiagonal: (diff, row, k) => diff === 0 || diff === row - k,
  notEqual: (diff) => diff !== 0,
  none: () => false,
};
const isSafe = (cols, row, col, attacked = CHECKS.full) => cols.slice(0, row).every((c, k) => !attacked(c - col, row, k));

// 頁面上的回溯：一列一列放，每一列從最左邊試到最右邊。
// 回傳全部的放法 solutions、放了幾次皇后 placed、照順序的每一次放置 moves（[列, 行]）、整列都沒地方放的時刻 stuck（當時的 cols 和卡住的那一列）
function solve(n, { attacked = CHECKS.full, stopAtFirst = false } = {}) {
  const cols = [], solutions = [], moves = [], stuck = [];
  let done = false;
  (function place(row) {
    if (row === n) { solutions.push([...cols]); done = stopAtFirst; return; }
    let placedHere = 0;
    for (let col = 0; col < n && !done; col++) {
      if (!isSafe(cols, row, col, attacked)) continue;
      cols[row] = col; cols.length = row + 1; placedHere += 1; moves.push([row, col]);
      place(row + 1);
    }
    if (placedHere === 0) stuck.push({ cols: cols.slice(0, row), row, afterMoves: moves.length });
  })(0);
  return { solutions, placed: moves.length, moves, stuck };
}

// n 個裡面挑 k 個有幾種（BigInt，不會溢位）
function choose(n, k) {
  let result = 1n;
  for (let i = 1n; i <= BigInt(k); i++) result = result * (BigInt(n) - BigInt(k) + i) / i;
  return result;
}
// 一組放法轉 90 度、左右翻面
const rotate = (cols) => { const n = cols.length, turned = []; cols.forEach((c, r) => { turned[c] = n - 1 - r; }); return turned; };
const mirror = (cols) => cols.map(c => cols.length - 1 - c);
// 一組放法和它轉向、翻面的八個樣子裡，字典順序最小的那個當代表
function canonical(cols) {
  const forms = [];
  let current = cols;
  for (let turn = 0; turn < 4; turn++) { forms.push(current.join(), mirror(current).join()); current = rotate(current); }
  return forms.sort()[0];
}
// n × n 的棋盤上任意挑格子，最多放得下幾個互不攻擊的皇后（窮舉每一格放或不放）
function mostQueens(n) {
  const cells = Array.from({ length: n * n }, (_, i) => [Math.floor(i / n), i % n]);
  const attack = ([r1, c1], [r2, c2]) => r1 === r2 || c1 === c2 || Math.abs(r1 - r2) === Math.abs(c1 - c2);
  let best = 0;
  for (let mask = 0; mask < 2 ** cells.length; mask++) {
    const chosen = cells.filter((_, i) => mask >> i & 1);
    if (chosen.every((a, i) => chosen.every((b, j) => i >= j || !attack(a, b)))) best = Math.max(best, chosen.length);
  }
  return { best, anyPairAttacks: cells.every((a, i) => cells.every((b, j) => i >= j || attack(a, b))) };
}

test('複習和跑幾步：64 格挑 8 格是 4426165368 種，大約 44 億；一列放一個不檢查是 8 的 8 次方 = 16777216 種', () => {
  assert.strictEqual(choose(64, 8), 4426165368n);
  assert.strictEqual(Math.round(4426165368 / 1e8), 44, '44 億');
  assert.strictEqual(8 ** 8, 16777216);
  assert.deepStrictEqual(page.cost.rows.map(r => r[1]), ['4426165368 種', '8 的 8 次方 = 16777216 種', '數完 92 種一共放 2056 次皇后；找到第一組只放 113 次']);
});

test('總結和跑幾步：八皇后 92 種，數完一共放 2056 次皇后；找到第一組只放 113 次', () => {
  const all = solve(8);
  assert.strictEqual(all.solutions.length, 92);
  assert.strictEqual(all.placed, 2056);
  assert.strictEqual(solve(8, { stopAtFirst: true }).placed, 113);
  for (const cols of all.solutions) cols.forEach((c, r) => assert.ok(isSafe(cols, r, c), `${cols} 的第 ${r} 列會被吃到`));
});

test('常見誤解：92 種扣掉轉向和翻面重複的剩 12 種', () => {
  assert.strictEqual(new Set(solve(8).solutions.map(canonical)).size, 12);
});

test('常見誤解：2 × 2 任兩格互吃、3 × 3 最多放 2 個；n = 2、3 沒有解，1 和 4 到 10 都有解', () => {
  assert.deepStrictEqual(mostQueens(2), { best: 1, anyPairAttacks: true });
  assert.strictEqual(mostQueens(3).best, 2);
  assert.deepStrictEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(n => solve(n).solutions.length), [1, 0, 0, 2, 10, 4, 40, 92, 352, 724]);
});

test('常見誤解和核心觀念：同一條斜線就是列差幾格、行就差幾格；右斜線 row − col 一樣、左斜線 row + col 一樣', () => {
  for (let r1 = 0; r1 < 8; r1++) for (let c1 = 0; c1 < 8; c1++) for (let r2 = 0; r2 < 8; r2++) for (let c2 = 0; c2 < 8; c2++) {
    if (r1 === r2) continue;
    // 沿著兩個斜的方向一格一格走，看走不走得到
    let walked = false;
    for (let step = 1; step < 8; step++) for (const [dr, dc] of [[1, 1], [1, -1], [-1, 1], [-1, -1]]) if (r1 + dr * step === r2 && c1 + dc * step === c2) walked = true;
    assert.strictEqual(Math.abs(r1 - r2) === Math.abs(c1 - c2), walked);
    assert.strictEqual(r1 - c1 === r2 - c2 || r1 + c1 === r2 + c2, walked);
  }
});

test('課外補充：n × n 的棋盤兩種斜線各有 2n − 1 條；row − col + n − 1 和 row + col 都落在 0 到 2n − 2', () => {
  for (const n of [4, 8]) {
    const right = new Set(), left = new Set();
    for (let row = 0; row < n; row++) for (let col = 0; col < n; col++) { right.add(row - col + n - 1); left.add(row + col); }
    for (const ids of [right, left]) {
      assert.strictEqual(ids.size, 2 * n - 1);
      assert.strictEqual(Math.min(...ids), 0); assert.strictEqual(Math.max(...ids), 2 * n - 2);
    }
  }
  const smallest = (n) => Math.min(...Array.from({ length: n * n }, (_, i) => Math.floor(i / n) - i % n));
  assert.strictEqual(smallest(8), -7, '不加 n − 1 的話，row − col 最小是 −(n − 1)，是負的');
});

// 圖解四張小棋盤該有的樣子：從 4 皇后回溯的過程算出來
function fourQueensStory() {
  const { solutions, moves, stuck } = solve(4);
  return { solutions, moves, stuck, afterSecondStuck: moves[stuck[1].afterMoves] };
}

test('圖解的過程：先卡在 [0, 2] 的第三列，再卡在 [0, 3, 1] 的第四列，接著第一列改放第 1 行，第一組解是 1、3、0、2', () => {
  const { solutions, moves, stuck, afterSecondStuck } = fourQueensStory();
  assert.deepStrictEqual(stuck[0], { cols: [0, 2], row: 2, afterMoves: 2 });
  assert.deepStrictEqual(stuck[1], { cols: [0, 3, 1], row: 3, afterMoves: 4 });
  assert.deepStrictEqual(moves.slice(0, 4), [[0, 0], [1, 2], [1, 3], [2, 1]], '退回第二列，從第 2 行改放第 3 行，第三列放第 1 行');
  assert.deepStrictEqual(afterSecondStuck, [0, 1], '第二次卡住之後，下一次放置是第一列的第 1 行');
  assert.deepStrictEqual(solutions, [[1, 3, 0, 2], [2, 0, 3, 1]], '四皇后 2 種');
  assert.deepStrictEqual(solutions[0].map(c => c + 1), [2, 4, 1, 3], '從 1 數就是第 2、4、1、3 格');
  assert.strictEqual(solve(4, { stopAtFirst: true }).placed, 8);
});

test('追蹤器：前三列放在第 1、3、0 行（就是四皇后第一組解的前三列），檢查第 3 列；col = 2 印 1、col = 1 印 0；每組輸入 40 步以內', () => {
  assert.ok(page.trace.code.python.includes('cols = [1, 3, 0]') && page.trace.code.python.includes('row = 3'));
  assert.deepStrictEqual(solve(4).solutions[0].slice(0, 3), [1, 3, 0]);
  assert.deepStrictEqual(page.trace.inputs.map(i => i.label), ['col = 2', 'col = 1']);
  assert.strictEqual(isSafe([1, 3, 0], 3, 2), true);
  assert.strictEqual(isSafe([1, 3, 0], 3, 1), false);
  assert.strictEqual(page.trace.runs['col = 2'].at(-1).out, '1\n');
  assert.strictEqual(page.trace.runs['col = 1'].at(-1).out, '0\n');
  for (const { label } of page.trace.inputs) assert.ok(page.trace.runs[label].length <= 40, `${label} 有 ${page.trace.runs[label].length} 步`);
});

test('實作：n = 6 有 4 種、n = 8 有 92 種，印出 4 92', () => {
  assert.strictEqual(`${solve(6).solutions.length} ${solve(8).solutions.length}`, '4 92');
  assert.strictEqual(page.code.output, '4 92');
});

const optionOf = (q) => q.options[q.answer];

test('試試看第一題：6 × 6、前三列在第 0、2、4 行，第 3 列只有第 1 行可以放；錯的選項是只查斜線 2、只查同一行 3、都不查 6', () => {
  const q = page.tryit[0];
  const cols = [0, 2, 4];
  assert.ok(q.code.python.includes('cols = [0, 2, 4]') && q.code.python.includes('range(6)'));
  cols.forEach((c, r) => assert.ok(isSafe(cols, r, c), '題目給的前三列本身不互吃'));
  const safeCols = (attacked) => [0, 1, 2, 3, 4, 5].filter(col => isSafe(cols, 3, col, attacked));
  assert.deepStrictEqual(safeCols(CHECKS.full), [1]);
  assert.deepStrictEqual(safeCols(CHECKS.diagonalsOnly), [1, 2], '斜線吃得到的是第 0、3、4、5 行');
  assert.deepStrictEqual(safeCols(CHECKS.columnOnly), [1, 3, 5]);
  // 解說裡的細節：第 3、5 行在第 2 列那個皇后的斜線上，第 3 行也在第 0 列那個皇后的斜線上
  assert.ok(CHECKS.diagonalsOnly(cols[2] - 3, 3, 2) && CHECKS.diagonalsOnly(cols[2] - 5, 3, 2) && CHECKS.diagonalsOnly(cols[0] - 3, 3, 0));
  assert.strictEqual(optionOf(q), '1'); assert.strictEqual(q.output, '1');
  assert.deepStrictEqual(q.options, [CHECKS.full, CHECKS.diagonalsOnly, CHECKS.columnOnly, CHECKS.none].map(check => String(safeCols(check).length)));
  assert.deepStrictEqual(q.options, ['1', '2', '3', '6']);
});

test('試試看第二題：只檢查同一行，4 × 4 印出 24；補上兩條斜線是 2；只補一條是 7、改成不等於是 4、只查斜線還是 24', () => {
  const q = page.tryit[1];
  const count = (attacked) => solve(4, { attacked }).solutions.length;
  assert.strictEqual(count(CHECKS.columnOnly), 24);
  assert.strictEqual(4 * 3 * 2 * 1, 24);
  assert.strictEqual(q.output, '24');
  assert.strictEqual(q.answer, 1);
  assert.strictEqual(count(CHECKS.full), 2);
  assert.strictEqual(count(CHECKS.oneDiagonal), 7);
  assert.strictEqual(count(CHECKS.notEqual), 4);
  solve(4, { attacked: CHECKS.notEqual }).solutions.forEach(cols => assert.strictEqual(new Set(cols).size, 1, '4 個皇后排成一直線'));
  const diagonalsOnly = solve(4, { attacked: CHECKS.diagonalsOnly }).solutions;
  assert.strictEqual(diagonalsOnly.length, 24);
  assert.ok(diagonalsOnly.some(cols => new Set(cols).size < 4), '只查斜線的 24 種裡有同一行放好幾個皇后的');
});

test('試試看第三題：4 × 4 數完一共放 16 次（各列 4、6、4、2 次）；錯的選項是放法 2 種、找到第一種就停 8 次、不檢查 340 次', () => {
  const q = page.tryit[2];
  const all = solve(4);
  assert.strictEqual(all.placed, 16);
  assert.deepStrictEqual([0, 1, 2, 3].map(row => all.moves.filter(m => m[0] === row).length), [4, 6, 4, 2]);
  assert.strictEqual(optionOf(q), '16'); assert.strictEqual(q.output, '16');
  assert.deepStrictEqual(q.options, [all.solutions.length, solve(4, { stopAtFirst: true }).placed, all.placed, solve(4, { attacked: CHECKS.none }).placed].map(String));
  assert.strictEqual(4 + 16 + 64 + 256, 340);
});

// 不開瀏覽器畫一次圖解：記下每段文字、每個格子、每個皇后（圓）和每條叉叉的線
function drawFigure() {
  const texts = [], cells = [], queens = [], crossLines = [];
  const kit = {
    svgEl: (width, height) => ({ width, height, append() {} }),
    svgText: (s, x, y, text, size) => { texts.push({ x, y, text, size }); return { setAttribute() {} }; },
    rough: { svg: () => ({
      rectangle: (x, y, w, h, o) => { cells.push({ x, y, w, h, fill: o.fill }); return {}; },
      circle: (x, y, d, o) => { queens.push({ x, y, d, fill: o.fill }); return {}; },
      line: (x1, y1, x2, y2) => { crossLines.push({ x1, y1, x2, y2 }); return {}; },
    }) },
    INK: 'ink', FILL: 'fill', NEW: 'new',
  };
  return { svg: page.figure(kit), texts, cells, queens, crossLines };
}
const sum = (list) => list.reduce((a, b) => a + b, 0);
// 文字佔的範圍（置中對齊）：中文字、全形標點和 × 算一個字級寬，數字、空白和半形符號算 0.6 個
const extent = ({ x, y, text, size }) => {
  const width = sum([...text].map(ch => (/[一-鿿：，、。×]/.test(ch) ? 1 : 0.6) * size));
  return { left: x - width / 2, right: x + width / 2, top: y - size / 2, bottom: y + size / 2 };
};

test('圖解：寬 320 以內；四張 4 × 4 棋盤排成 2 × 2，皇后和打叉的列照回溯的過程；每張底下一行說明，文字不超出畫面、不互相疊到、不壓到棋盤', () => {
  const { svg, texts, cells, queens, crossLines } = drawFigure();
  assert.ok(svg.width <= 320);
  assert.strictEqual(cells.length, 4 * 16);
  // 每 16 格是一張棋盤，第一格是左上角
  const boards = [0, 1, 2, 3].map(b => {
    const own = cells.slice(b * 16, b * 16 + 16), { x, y, w } = own[0];
    own.forEach((cell, i) => assert.deepStrictEqual([cell.x, cell.y, cell.w, cell.h], [x + (i % 4) * w, y + Math.floor(i / 4) * w, w, w]));
    return { x, y, size: 4 * w, cell: w, right: x + 4 * w, bottom: y + 4 * w, own };
  });
  boards.forEach(b => assert.ok(b.x >= 0 && b.right <= svg.width && b.y >= 0 && b.bottom <= svg.height, '棋盤超出畫面'));
  assert.ok(boards[0].y === boards[1].y && boards[2].y === boards[3].y && boards[0].x === boards[2].x && boards[1].x === boards[3].x, '排成 2 × 2');
  assert.ok(boards[0].right < boards[1].x && boards[0].bottom < boards[2].y, '棋盤之間有間隔');

  // 每個皇后在哪一張的哪一格（圓心在格子正中間）
  const queensOf = boards.map(() => []);
  for (const q of queens) {
    const b = boards.findIndex(bd => q.x > bd.x && q.x < bd.right && q.y > bd.y && q.y < bd.bottom);
    assert.ok(b >= 0, '皇后畫在棋盤外面');
    const col = (q.x - boards[b].x) / boards[b].cell - 0.5, row = (q.y - boards[b].y) / boards[b].cell - 0.5;
    assert.ok(Number.isInteger(col) && Number.isInteger(row), '皇后沒有畫在格子正中間');
    assert.ok(q.d < boards[b].cell, '皇后比格子大');
    queensOf[b][row] = col;
  }
  const { solutions, stuck, afterSecondStuck } = fourQueensStory();
  assert.deepStrictEqual(queensOf, [stuck[0].cols, stuck[1].cols, [afterSecondStuck[1]], solutions[0]]);
  assert.deepStrictEqual(queensOf, [[0, 2], [0, 3, 1], [1], [1, 3, 0, 2]]);
  assert.strictEqual(queens.filter(q => q.fill === 'new').length, 4, '只有最後那組解的四個皇后塗黃');
  assert.ok(queens.slice(-4).every(q => q.fill === 'new'));

  // 卡住的那一列：整列換一個底色，左邊打一個叉（兩條線）
  const stuckRowOf = boards.map(b => {
    const plain = b.own.find(c => b.own.filter(o => o.fill === c.fill).length > 4).fill;   // 一般格子的底色：超過一列的格子都是它
    const rows = [0, 1, 2, 3].filter(r => b.own.slice(r * 4, r * 4 + 4).every(c => c.fill !== plain));
    assert.ok(b.own.every((c, i) => c.fill === plain || rows.includes(Math.floor(i / 4))), '只有卡住的那一列換底色');
    return rows;
  });
  assert.deepStrictEqual(stuckRowOf, [[stuck[0].row], [stuck[1].row], [], []]);
  assert.strictEqual(crossLines.length, 4, '兩個叉、各兩條線');
  [0, 1].forEach(b => {
    const rowMiddle = boards[b].y + (stuck[b].row + 0.5) * boards[b].cell;
    for (const l of crossLines.slice(b * 2, b * 2 + 2)) {
      assert.strictEqual((l.y1 + l.y2) / 2, rowMiddle, '叉叉對齊卡住的那一列');
      assert.ok(Math.max(l.x1, l.x2) < boards[b].x && Math.min(l.x1, l.x2) >= 0 && (b === 0 || Math.min(l.x1, l.x2) > boards[0].right), '叉叉在棋盤左邊、不壓到別張');
    }
  });

  // 說明：標題一行、每張底下一行
  assert.strictEqual(texts.length, 5);
  const notes = texts.slice(1);
  notes.forEach((t, b) => {
    assert.ok(t.y > boards[b].bottom && (b >= 2 || t.y < boards[2].y), `「${t.text}」要在第 ${b + 1} 張棋盤底下`);
    assert.strictEqual(t.x, boards[b].x + boards[b].size / 2, '說明對齊棋盤中間');
  });
  const boxes = texts.map(extent);
  boxes.forEach((b, i) => {
    assert.ok(b.left >= 0 && b.right <= svg.width && b.top >= 0 && b.bottom <= svg.height, `「${texts[i].text}」超出畫面`);
    boxes.forEach((o, j) => assert.ok(i >= j || b.right <= o.left || o.right <= b.left || b.bottom <= o.top || o.bottom <= b.top, `「${texts[i].text}」和「${texts[j].text}」疊在一起`));
    boards.forEach(bd => assert.ok(b.right <= bd.x || bd.right <= b.left || b.bottom <= bd.y || bd.bottom <= b.top, `「${texts[i].text}」壓到棋盤`));
  });
  assert.ok(texts.every(t => !/[⁰¹²³⁴-⁹♕♛]/.test(t.text)), '不用上標字元和西洋棋符號');
});
