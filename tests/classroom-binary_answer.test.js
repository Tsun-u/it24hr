// tests/classroom-binary_answer.test.js（node --test）：二分搜尋答案頁講義裡寫到的數字都算得出來
const test = require('node:test'); const assert = require('node:assert');
const page = require('../classroom/algorithms/binary_answer.js');

const HOOK = [750, 620, 480, 390];
// 每條剪 length 公分，全部的緞帶一共剪得出幾條
const pieces = (ribbons, length) => ribbons.reduce((sum, ribbon) => sum + Math.floor(ribbon / length), 0);

// 對答案二分，回傳每一次猜的 [lo, hi, mid, 條數] 和最後的答案。可以換掉講義寫法的每個部分，驗算試試看錯的選項會怎樣：
// upper 是 mid 要不要取偏上、enough 是「夠」的判斷、reversed 是兩個分支有沒有寫反；猜超過 100 次當成停不下來，answer 是 null
function search(ribbons, need, { lo = 1, hi = Math.max(...ribbons), upper = true, enough = (count) => count >= need, reversed = false } = {}) {
  const guesses = [];
  while (lo < hi) {
    if (guesses.length === 100) return { guesses, answer: null };
    const mid = Math.floor((lo + hi + (upper ? 1 : 0)) / 2), count = pieces(ribbons, mid);
    guesses.push([lo, hi, mid, count]);
    if (enough(count) !== reversed) lo = mid; else hi = mid - 1;
  }
  return { guesses, answer: lo };
}

test('開場與複習的數字：一共 2240 公分、除以 12 是 186、照 186 剪只有 11 條；一公分一公分試到 161 第一次不夠', () => {
  assert.strictEqual(HOOK.reduce((a, b) => a + b), 2240);
  assert.strictEqual(Math.floor(2240 / 12), 186);
  assert.deepStrictEqual(HOOK.map(r => Math.floor(r / 186)), [4, 3, 2, 2]);
  assert.strictEqual(pieces(HOOK, 186), 11);
  assert.ok(HOOK.every(r => r % 186 > 0), '四捲各剩一段零頭');
  let length = 1, tries = 1;
  while (pieces(HOOK, length) >= 12) { length += 1; tries += 1; }
  assert.deepStrictEqual([length, tries], [161, 161]);
});

test('單調性：1 到 750 公分，前面一段都剪得出 12 條、後面一段都剪不出，交界在 160；751 公分連一條都剪不出', () => {
  for (let length = 1; length <= 750; length++) assert.strictEqual(pieces(HOOK, length) >= 12, length <= 160, `${length} 公分`);
  assert.strictEqual(pieces(HOOK, 750), 1);
  assert.strictEqual(pieces(HOOK, 751), 0);
});

// 假的畫圖工具：記下 figure 寫了哪些字、畫了哪些長方形和線
function drawFigure() {
  const texts = [], rects = [], lines = [];
  const svg = { append() {} };
  page.figure({
    svgEl: (width, height) => Object.assign(svg, { width, height }),
    svgText: (s, x, y, text, size = 15) => { texts.push({ x, y, text, size }); return { setAttribute() {} }; },
    rough: { svg: () => ({ rectangle: (x, y, w, h, options) => { rects.push({ x, y, w, h, options }); return {}; }, line: (x1, y1, x2, y2, options) => { lines.push({ x1, y1, x2, y2, options }); return {}; } }) },
    INK: '#1f2328', FILL: '#9cc3f5', NEW: '#ffd166',
  });
  return { svg, texts, rects, lines };
}
// 一段字大約多寬：中文和全形符號一個字佔字級那麼寬，等寬字體的英數和空白佔 0.6 個字級
const widthOf = ({ text, size }) => [...text].reduce((w, ch) => w + (ch.charCodeAt(0) < 128 ? 0.6 : 1) * size, 0);

const FIGURE_ROWS = [
  ['1～750', '猜 376：4 條 ✗'], ['1～375', '猜 188：10 條 ✗'], ['1～187', '猜 94：22 條 ✓'], ['94～187', '猜 141：14 條 ✓'], ['141～187', '猜 164：11 條 ✗'],
  ['141～163', '猜 152：13 條 ✓'], ['152～163', '猜 158：12 條 ✓'], ['158～163', '猜 161：11 條 ✗'], ['158～160', '猜 159：12 條 ✓'], ['159～160', '猜 160：12 條 ✓'],
];

test('圖解：十次猜測的範圍、猜的長度、條數和勾叉照決定表；最後範圍只剩 160', () => {
  const { guesses, answer } = search(HOOK, 12);
  assert.deepStrictEqual(guesses.map(([lo, hi, mid, count]) => [`${lo}～${hi}`, `猜 ${mid}：${count} 條 ${count >= 12 ? '✓' : '✗'}`]), FIGURE_ROWS);
  assert.strictEqual(answer, 160);
  const { texts, rects, lines } = drawFigure();
  assert.deepStrictEqual(texts.map(t => t.text), ['四捲緞帶要剪 12 條：每次猜中間的長度', ...FIGURE_ROWS.flat(), '範圍只剩 160：答案']);
  assert.strictEqual(rects.length, 10);
  assert.strictEqual(lines.length, 10);
});

test('圖解：寬 320px、每一筆的 seed 固定且不重複；黃色那段落在橫線上、至少 3px；字不超出畫面、同一列的字和橫線不互相疊到', () => {
  const { svg, texts, rects, lines } = drawFigure();
  assert.strictEqual(svg.width, 320);
  const seeds = [...rects, ...lines].map(shape => shape.options.seed);
  assert.ok(seeds.every(Number.isInteger) && new Set(seeds).size === seeds.length);
  rects.forEach((r, k) => {
    assert.ok(r.w >= 3, `第 ${k + 1} 列的黃色那段只有 ${r.w}px`);
    assert.ok(r.x >= lines[k].x1 && r.x + r.w <= lines[k].x2 + 3, `第 ${k + 1} 列的黃色那段跑出橫線`);
  });
  for (const t of texts) {
    const half = widthOf(t) / 2;
    assert.ok(t.x - half >= 0 && t.x + half <= 320, `「${t.text}」超出畫面：${t.x - half}～${t.x + half}`);
    assert.ok(t.y - t.size / 2 >= 0 && t.y + t.size / 2 <= svg.height, `「${t.text}」上下超出畫面`);
  }
  lines.forEach((line, k) => {
    const [range, verdict] = [texts[1 + k * 2], texts[2 + k * 2]];
    assert.ok(range.x + widthOf(range) / 2 < line.x1, `「${range.text}」疊到橫線`);
    assert.ok(verdict.x - widthOf(verdict) / 2 > line.x2 + 3, `「${verdict.text}」疊到橫線`);
  });
  const ys = [...new Set(texts.map(t => t.y))];
  ys.slice(1).forEach((y, k) => assert.ok(y - ys[k] >= 12, `第 ${k + 1}、${k + 2} 行字上下疊到`));
});

test('總結與核心觀念：750 公分的範圍猜 10 次；剩 159、160 兩格時不加 1 的 mid 永遠是 159，停不下來', () => {
  assert.strictEqual(search(HOOK, 12).guesses.length, 10);
  assert.strictEqual(Math.ceil(Math.log2(750)), 10);
  assert.strictEqual(Math.floor((159 + 160) / 2), 159);
  assert.strictEqual(Math.floor((159 + 160 + 1) / 2), 160);
  const stuck = search(HOOK, 12, { lo: 159, hi: 160, upper: false });
  assert.strictEqual(stuck.answer, null);
  assert.ok(stuck.guesses.every(([lo, hi, mid]) => lo === 159 && hi === 160 && mid === 159));
});

test('追蹤器：兩組都猜 5、3、4 三次，要 4 條印 4、要 6 條印 3，都在 40 步以內', () => {
  for (const [label, need, answer] of [['要 4 條', 4, 4], ['要 6 條', 6, 3]]) {
    const steps = page.trace.runs[label];
    assert.ok(steps.length <= 40, `${label} 有 ${steps.length} 步`);
    assert.strictEqual(steps.at(-1).out, `${answer}\n`);
    assert.deepStrictEqual(steps.filter(s => s.line === 6).map(s => s.vars.mid), [5, 3, 4]);
    const expected = search([9, 7, 5], need);
    assert.strictEqual(expected.answer, answer);
    assert.deepStrictEqual(expected.guesses.map(g => g[2]), [5, 3, 4]);
  }
  assert.deepStrictEqual(page.trace.inputs.map(i => i.label), ['要 4 條', '要 6 條']);
});

test('追蹤器的 lines：Python 每一行對到的那一行，在各語言是同一句', () => {
  const python = page.trace.code.python.split('\n');
  // 每一行認得出來的那一小段，四種語言都有
  const MARK = { 1: 'ribbons', 2: 'need = {{k}}', 3: 'lo = 1', 4: 'hi = 9', 5: 'lo < hi', 6: 'mid = (lo + hi + 1)', 7: 'count = ribbons[0]', 8: 'count >= need', 9: 'lo = mid', 11: 'hi = mid - 1', 12: 'lo' };
  const PRINT = { c: 'printf', cpp: 'std::cout', java: 'System.out.println' };
  for (const [lang, map] of Object.entries(page.trace.lines)) {
    const other = page.trace.code[lang].split('\n');
    assert.deepStrictEqual(Object.keys(map), Object.keys(MARK), lang);
    for (const [line, mark] of Object.entries(MARK)) {
      assert.ok(python[line - 1].includes(mark), `Python 第 ${line} 行`);
      assert.ok(other[map[line] - 1].includes(mark), `${lang} 第 ${map[line]} 行不是 Python 第 ${line} 行那一句：${other[map[line] - 1]}`);
    }
    assert.ok(other[map[12] - 1].includes(PRINT[lang]), `${lang} 印出答案的那一行`);
  }
  assert.ok(python[11].startsWith('print('));
});

test('實作：開場那四捲，要 12 條最長 160、要 5 條最長 375', () => {
  assert.strictEqual(search(HOOK, 12).answer, 160);
  assert.strictEqual(search(HOOK, 5).answer, 375);
  assert.deepStrictEqual([pieces(HOOK, 375), pieces(HOOK, 376)], [5, 4]);
  assert.strictEqual(page.code.output, '160 375');
});

test('常見誤解第四條：1 公分最多剪 2240 條；要 2241 條時 lo 從 0 開始答案是 0，從 1 開始會錯答成 1', () => {
  assert.strictEqual(pieces(HOOK, 1), 2240);
  assert.strictEqual(search(HOOK, 2241, { lo: 0 }).answer, 0);
  assert.strictEqual(search(HOOK, 2241).answer, 1);
});

test('跑幾步：750 公分猜 10 次、範圍到十億猜 30 次', () => {
  assert.strictEqual(search(HOOK, 12).guesses.length, 10);
  assert.strictEqual(search([1000000000], 1).guesses.length, 30);
  assert.strictEqual(search([1000000000], 2).guesses.length, 30);
});

const TRY = [30, 24, 15];

test('試試看第一題：猜 16、8、12、14、13，印出 12；8 是第一個夠的、13 是 69 除以 5、15 是最短那捲，13 和 15 都只有 4 條', () => {
  const { guesses, answer } = search(TRY, 5);
  assert.deepStrictEqual(guesses.map(([, , mid, count]) => [mid, count]), [[16, 2], [8, 7], [12, 5], [14, 4], [13, 4]]);
  assert.deepStrictEqual([16, 8, 12].map(mid => TRY.map(r => Math.floor(r / mid))), [[1, 1, 0], [3, 3, 1], [2, 2, 1]]);
  assert.strictEqual(answer, 12);
  const q = page.tryit[0];
  assert.strictEqual(q.options[q.answer], '12'); assert.strictEqual(q.output, '12');
  assert.strictEqual(Math.floor(TRY.reduce((a, b) => a + b) / 5), 13);
  assert.strictEqual(TRY.reduce((a, b) => a + b), 69);
  assert.strictEqual(Math.min(...TRY), 15);
  assert.deepStrictEqual([13, 15].map(length => TRY.map(r => Math.floor(r / length))), [[2, 1, 1], [2, 1, 1]]);
});

test('試試看第二題：分支寫反印出 30（猜 16、23、27、29、30）；對調印 12；其他三個選項分別是停不下來、印 1、還是 30', () => {
  const buggy = search(TRY, 5, { reversed: true });
  assert.deepStrictEqual(buggy.guesses.map(([, , mid, count]) => [mid, count >= 5]), [[16, false], [23, false], [27, false], [29, false], [30, false]]);
  assert.strictEqual(buggy.guesses[0][3], 2);
  assert.strictEqual(buggy.answer, 30);
  const q = page.tryit[1];
  assert.strictEqual(q.output, '30');
  assert.ok(q.options[q.answer].includes('對調'));
  assert.strictEqual(search(TRY, 5).answer, 12);
  const lower = search(TRY, 5, { reversed: true, upper: false });
  assert.strictEqual(lower.answer, null);
  assert.deepStrictEqual(lower.guesses.at(-1).slice(0, 3), [29, 30, 29]);
  const small = search(TRY, 5, { reversed: true, hi: 15 });
  assert.deepStrictEqual(small.guesses.map(([, , mid, count]) => [mid, count >= 5]), [[8, true], [4, true], [2, true]]);
  assert.strictEqual(small.answer, 1);
  assert.strictEqual(search(TRY, 5, { reversed: true, enough: count => count > 5 }).answer, 30);
});

test('試試看第三題：一捲 1000000 公分、要 1 條，while 跑 20 圈；第一圈就排除 1 到 500000；1000 是 1000000 開根號', () => {
  const { guesses, answer } = search([1000000], 1);
  assert.strictEqual(guesses.length, 20);
  assert.strictEqual(answer, 1000000);
  assert.ok(guesses.every(([, , , count]) => count >= 1), '猜多長都剪得出來');
  assert.deepStrictEqual(guesses.slice(0, 3).map(([lo, hi]) => hi - lo + 1), [1000000, 500000, 250000]);
  assert.strictEqual(guesses[1][0], 500001);
  const q = page.tryit[2];
  assert.strictEqual(q.options[q.answer], '20'); assert.strictEqual(q.output, '20');
  assert.strictEqual(Math.sqrt(1000000), 1000);
});

test('課外補充：2 的平方根猜 20 次，lo 和 hi 差不到 0.00001，兩邊都是 1.41421 開頭', () => {
  let lo = 0, hi = 2;
  for (let k = 0; k < 20; k++) { const mid = (lo + hi) / 2; if (mid * mid > 2) hi = mid; else lo = mid; }
  assert.ok(hi - lo < 0.00001);
  assert.ok(String(lo).startsWith('1.41421') && String(hi).startsWith('1.41421'));
});
