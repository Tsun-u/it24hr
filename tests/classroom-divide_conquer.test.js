// tests/classroom-divide_conquer.test.js（node --test）：分治法頁講義裡寫到的數字都算得出來
const test = require('node:test'); const assert = require('node:assert');
const page = require('../classroom/algorithms/divide_conquer.js');

const half = n => Math.floor(n / 2);

// 照講義的寫法算 a 的 n 次方（BigInt，十億次方也不會失準）：回傳答案、乘了幾次、n 一路切成哪些數
function power(a, n) {
  if (n === 0) return { value: 1n, multiplies: 0, path: [0] };
  const sub = power(a, half(n)), odd = n % 2 === 1;
  return { value: sub.value * sub.value * (odd ? BigInt(a) : 1n), multiplies: sub.multiplies + (odd ? 2 : 1), path: [n, ...sub.path] };
}

// 每乘一次取一次餘數的版本，對照實作的 output
function powerMod(a, n, m) {
  if (n === 0n) return 1n;
  const sub = powerMod(a, n / 2n, m), squared = sub * sub % m;
  return n % 2n === 1n ? squared * (a % m) % m : squared;
}

test('開場和總結：30 個 2 相乘要乘 29 次；2 的 30 次方是 1073741824，切一半的寫法只乘 9 次；紙的厚度超過 100 公里', () => {
  assert.strictEqual(30 - 1, 29);
  const { value, multiplies } = power(2, 30);
  assert.strictEqual(value, 1073741824n);
  assert.strictEqual(Number(value), 2 ** 30);
  assert.strictEqual(multiplies, 9);
  const MM_PER_KM = 1000 * 1000;
  assert.ok(0.1 * 2 ** 30 / MM_PER_KM > 100);
});

test('核心觀念：30 → 15 → 7 → 3 → 1 → 0 切 5 次、每一層最多乘 2 次；十億次方切 30 次、乘 40 幾次', () => {
  const { path } = power(2, 30);
  assert.deepStrictEqual(path, [30, 15, 7, 3, 1, 0]);
  assert.strictEqual(path.length - 1, 5);
  const billion = power(1, 1000000000);
  assert.strictEqual(billion.path.length - 1, 30);
  assert.strictEqual(billion.multiplies, 43);
  for (let n = 1; n <= 1000; n++) {
    const levels = power(1, n).path.length - 1;
    assert.ok(power(1, n).multiplies <= 2 * levels);
    assert.strictEqual(levels, Math.floor(Math.log2(n)) + 1);
  }
});

test('核心觀念和常見誤解的次方：2¹⁵ = 2⁷ × 2⁷ × 2、2⁷ × 2⁷ 是 2¹⁴、15 / 2 是 7、2⁶³ 超過 long long 的上限', () => {
  assert.strictEqual(2 ** 15, 2 ** 7 * 2 ** 7 * 2);
  assert.strictEqual(2 ** 7 * 2 ** 7, 2 ** 14);
  assert.strictEqual(half(15), 7);
  const LLONG_MAX = 9223372036854775807n;
  assert.ok(2n ** 63n > LLONG_MAX);
  assert.ok((1000000007n - 1n) ** 2n <= LLONG_MAX);
});

// 假的畫圖工具：記下 figure 寫的每一段字（位置、字級、對齊），不用開瀏覽器就能檢查
function drawFigure() {
  const texts = [], shape = () => ({});
  const svg = { append() {} };
  const kit = {
    svgEl: (width, height) => Object.assign(svg, { width, height }),
    svgText: (s, x, y, text, size = 15) => {
      const entry = { x, y, text, size, anchor: 'middle' }; texts.push(entry);
      return { setAttribute(name, value) { if (name === 'text-anchor') entry.anchor = value; } };
    },
    rough: { svg: () => ({ line: shape, polygon: shape, rectangle: shape }) },
    INK: '#000', FILL: '#aaa', NEW: '#ff0',
  };
  page.figure(kit);
  return { svg, texts };
}

// 一段字佔的左右範圍：中文字抓一個字級寬，其他抓 0.6 個字級（寧可估寬）
function extent({ x, text, size, anchor }) {
  const width = [...text].reduce((sum, ch) => sum + (/[一-鿿，]/.test(ch) ? size : size * 0.6), 0);
  const left = anchor === 'start' ? x : anchor === 'end' ? x - width : x - width / 2;
  return [left, left + width];
}

test('圖解：六列的算式照決定表，右欄是每一列回來的答案 1073741824、32768、128、8、2、1', () => {
  const { texts } = drawFigure();
  const written = texts.map(t => t.text);
  // 次方是小一號（10px）、往上抬 6px 的數字；把同一列靠左寫的字照 x 排好接起來，次方前面補 ^
  const rows = [['2^30=2^15×2^15', 30], ['2^15=2^7×2^7×2', 15], ['2^7=2^3×2^3×2', 7], ['2^3=2^1×2^1×2', 3], ['2^1=2^0×2^0×2', 1], ['2^0=1', 0]];
  const answers = texts.filter(t => t.anchor === 'end');
  assert.strictEqual(answers.length, rows.length);
  rows.forEach(([equation, n], k) => {
    const y = answers[k].y;
    const parts = texts.filter(t => t.anchor === 'start' && !/[一-鿿]/.test(t.text) && (t.y === y || (t.size === 10 && t.y === y - 6))).sort((a, b) => a.x - b.x);
    assert.strictEqual(parts.map(t => (t.size === 10 ? `^${t.text}` : t.text)).join(''), equation);
    assert.strictEqual(answers[k].text, String(power(2, n).value), `${equation} 那一列要寫回來的答案`);
  });
  assert.deepStrictEqual(rows.map(([, n]) => String(power(2, n).value)), ['1073741824', '32768', '128', '8', '2', '1']);
  for (const text of ['2 的 30 次方，一路切一半', '切', '合', '切到這裡直接知道答案']) assert.ok(written.includes(text), text);
});

test('圖解：寬 320px 以內，字不超出畫面、同一列的字不互相疊到', () => {
  const { svg, texts } = drawFigure();
  assert.ok(svg.width <= 320);
  for (const t of texts) {
    const [left, right] = extent(t);
    assert.ok(left >= 0 && right <= svg.width, `「${t.text}」超出畫面：${left}～${right}`);
    assert.ok(t.y - t.size / 2 >= 0 && t.y + t.size / 2 <= svg.height, `「${t.text}」超出畫面的高度`);
  }
  texts.forEach((a, i) => texts.slice(i + 1).forEach(b => {
    if (Math.abs(a.y - b.y) >= (a.size + b.size) / 2) return;
    const [aLeft, aRight] = extent(a), [bLeft, bRight] = extent(b);
    const gap = a.size === 10 || b.size === 10 ? 0 : 4;   // 次方緊貼在底數後面
    assert.ok(aRight + gap <= bLeft || bRight + gap <= aLeft, `「${a.text}」和「${b.text}」疊在一起`);
  }));
});

test('追蹤器：2 的 10 次方印 1024、2 的 5 次方印 32，每組 40 步以內', () => {
  assert.strictEqual(page.trace.runs['2 的 10 次方'].at(-1).out, '1024\n');
  assert.strictEqual(page.trace.runs['2 的 5 次方'].at(-1).out, '32\n');
  assert.strictEqual(power(2, 10).value, 1024n);
  assert.strictEqual(power(2, 5).value, 32n);
  for (const { label } of page.trace.inputs) assert.ok(page.trace.runs[label].length <= 40, `${label} 有 ${page.trace.runs[label].length} 步`);
});

test('實作：2 的 30 次方、3 的十億次方各除以 1000000007 的餘數', () => {
  const M = 1000000007n;
  assert.strictEqual(powerMod(2n, 30n, M), 73741817n);
  assert.strictEqual(2n ** 30n % M, 73741817n);
  assert.strictEqual(page.code.output, `${powerMod(2n, 30n, M)} ${powerMod(3n, 1000000000n, M)}`);
  for (let n = 0n; n <= 200n; n++) assert.strictEqual(powerMod(3n, n, M), 3n ** n % M);
});

test('試試看第一題：f(13) = 4（13 → 6 → 3 → 1 → 0）；錯的選項 13、5、3 各是怎麼來的', () => {
  let called = 0;
  const f = n => { called += 1; return n === 0 ? 0 : f(half(n)) + 1; };
  assert.strictEqual(f(13), 4);
  assert.strictEqual(called, 5);
  assert.deepStrictEqual(power(1, 13).path, [13, 6, 3, 1, 0]);
  const minusOne = n => (n === 0 ? 0 : minusOne(n - 1) + 1);
  assert.strictEqual(minusOne(13), 13);
  assert.strictEqual(half(1), 0);
  const q = page.tryit[0];
  assert.strictEqual(q.options[q.answer], '4'); assert.strictEqual(q.output, '4');
  assert.deepStrictEqual([...q.options].sort(), ['13', '3', '4', '5']);
});

test('試試看第二題：calls(16) = 63；每一層的次數 1、2、4、8、16、32；錯的選項 6、17、32', () => {
  const calls = n => (n === 0 ? 1 : 1 + calls(half(n)) + calls(half(n)));
  assert.deepStrictEqual([0, 1, 2, 4, 8, 16].map(calls), [1, 3, 7, 15, 31, 63]);
  const perLevel = [0, 1, 2, 3, 4, 5].map(depth => 2 ** depth);
  assert.deepStrictEqual(perLevel, [1, 2, 4, 8, 16, 32]);
  assert.strictEqual(perLevel.reduce((a, b) => a + b), 63);
  assert.strictEqual(perLevel.slice(0, 5).reduce((a, b) => a + b), 31);
  assert.strictEqual(power(2, 16).path.length, 6);          // 算一次存起來：16、8、4、2、1、0 各呼叫一次
  assert.deepStrictEqual(power(2, 16).path, [16, 8, 4, 2, 1, 0]);
  assert.strictEqual(1 + 8 + 8, 17);
  const q = page.tryit[1];
  assert.strictEqual(q.options[q.answer], '63'); assert.strictEqual(q.output, '63');
  assert.deepStrictEqual(q.options, ['6', '17', '32', '63']);
});

test('試試看第三題：少了奇數那段 power(2, 5) 印 1，幾次方都是 1；補上是 32；另外三種改法印 1、128、256', () => {
  // base 是終止條件的 n、baseValue 是那時回傳的值；combine 把 half 合成這一層的答案
  const variant = (base, baseValue, combine) => function run(a, n) { return n === base ? baseValue(a) : combine(run(a, half(n)), a, n); };
  const broken = variant(0, () => 1, h => h * h);
  assert.strictEqual(broken(2, 5), 1);
  for (let n = 0; n <= 40; n++) assert.strictEqual(broken(2, n), 1);
  const fixed = variant(0, () => 1, (h, a, n) => (n % 2 === 1 ? h * h * a : h * h));
  assert.strictEqual(fixed(2, 5), 32);
  assert.deepStrictEqual([1, 2, 5].map(n => fixed(2, n)), [2, 4, 4 * 4 * 2]);
  assert.strictEqual(variant(1, () => 1, h => h * h)(2, 5), 1);          // 終止條件改成 n == 1 回傳 1
  assert.strictEqual(half(0), 0);                                        // 那種改法算 0 次方：0 / 2 還是 0，碰不到 n == 1
  assert.strictEqual(variant(0, () => 1, (h, a) => h * h * a)(2, 5), 128);   // 每一層都多乘一個 a
  assert.strictEqual(variant(0, a => a, h => h * h)(2, 5), 256);         // 終止條件回傳 a
  assert.deepStrictEqual(power(2, 5).path, [5, 2, 1, 0]);
  const q = page.tryit[2];
  assert.strictEqual(q.output, '1');
  assert.strictEqual(q.options[q.answer], 'n 是奇數時，改成回傳 half * half * a');
});
