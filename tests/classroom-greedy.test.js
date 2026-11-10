// tests/classroom-greedy.test.js（node --test）：貪婪法頁講義裡寫到的數字都算得出來
const test = require('node:test'); const assert = require('node:assert');
const page = require('../classroom/algorithms/greedy.js');

// 影展的 8 場 [開演, 散場]，照散場時間排好
const SESSIONS = [[10, 13], [12, 14], [9, 15], [13, 16], [14, 17], [16, 19], [18, 20], [19, 22]];
const BEST = [[10, 13], [13, 16], [16, 19], [19, 22]];
const overlaps = (a, b) => a[0] < b[1] && b[0] < a[1];
const byKey = (key) => (a, b) => key(a) - key(b);
const byEnd = byKey(s => s[1]), byStart = byKey(s => s[0]), byLength = byKey(s => s[1] - s[0]);

// 頁面上的寫法：照陣列的順序從頭看，開演時間不早於 free 就挑，free 更新成它的散場時間
function scan(sessions, arrive = 0) {
  let free = arrive; const picked = [];
  for (const s of sessions) if (s[0] >= free) { picked.push(s); free = s[1]; }
  return picked;
}
// 照某個規則排好，從頭看下去，跟已經挑的都不重疊就挑
function pickBy(order, sessions = SESSIONS) {
  const picked = [];
  for (const s of [...sessions].sort(order)) if (picked.every(p => !overlaps(p, s))) picked.push(s);
  return picked;
}
// 每一場選或不選全部試過：回傳一共幾種、互不重疊的挑法最多幾場
function bruteForce(sessions) {
  let best = 0;
  for (let mask = 0; mask < 2 ** sessions.length; mask++) {
    const chosen = sessions.filter((_, i) => mask >> i & 1);
    if (chosen.every((a, i) => chosen.every((b, j) => i === j || !overlaps(a, b)))) best = Math.max(best, chosen.length);
  }
  return { ways: 2 ** sessions.length, best };
}
// 每次先拿最大面額，回傳每種面額拿幾個
function greedyCoins(coins, amount) {
  return coins.map(c => { const k = Math.floor(amount / c); amount -= k * c; return k; });
}
// 湊出 amount 最少要幾個硬幣（一格一格填表）
function fewestCoins(coins, amount) {
  const need = [0];
  for (let a = 1; a <= amount; a++) need[a] = Math.min(...coins.filter(c => c <= a).map(c => need[a - c] + 1));
  return need[amount];
}
const sum = (list) => list.reduce((a, b) => a + b, 0);
const arrays = (sessions) => [sessions.map(s => s[0]), sessions.map(s => s[1])];

test('複習和跑幾步：8 場有 256 種；2 的 50 次方大約一千兆；50 場排序加挑一趟是幾百步', () => {
  assert.strictEqual(bruteForce(SESSIONS).ways, 256);
  assert.strictEqual(Math.round(2 ** 50 / 1e15), 1, '一千兆是 10 的 15 次方');
  const steps = 50 * Math.log2(50) + 50;
  assert.ok(steps > 100 && steps < 1000, `排序加挑一趟大約 ${Math.round(steps)} 步`);
});

test('圖解和總結：最早散場先挑 4 場，就是 10–13、13–16、16–19、19–22；最早開演、片長最短都只有 3 場', () => {
  assert.deepStrictEqual([...SESSIONS].sort(byEnd), SESSIONS, '圖解的八條由上往下是照散場時間排的');
  assert.deepStrictEqual(pickBy(byEnd), BEST);
  assert.deepStrictEqual(scan(SESSIONS), BEST, '頁面上的寫法和「不重疊就挑」挑到同樣四場');
  assert.strictEqual(pickBy(byStart).length, 3);
  assert.strictEqual(pickBy(byLength).length, 3);
});

test('窮舉確認：256 種挑法裡，互不重疊的最多就是 4 場', () => {
  assert.strictEqual(bruteForce(SESSIONS).best, 4);
});

test('常見誤解：9–15 跟四場重疊；12–14 和 18–20 各跟挑中的四場裡前後兩場重疊', () => {
  const others = (s) => SESSIONS.filter(o => o !== s && overlaps(o, s));
  assert.deepStrictEqual(others(SESSIONS[2]), [[10, 13], [12, 14], [13, 16], [14, 17]]);
  assert.deepStrictEqual(pickBy(byStart)[0], [9, 15], '照開演時間挑，第一場就是 9–15');
  assert.deepStrictEqual(BEST.filter(o => overlaps(o, [12, 14])), [[10, 13], [13, 16]]);
  assert.deepStrictEqual(BEST.filter(o => overlaps(o, [18, 20])), [[16, 19], [19, 22]]);
  assert.deepStrictEqual(pickBy(byLength).slice(0, 2), [[12, 14], [18, 20]], '照片長挑，先挑到的是這兩場 2 小時的短片');
  assert.strictEqual(SESSIONS[2][1] - SESSIONS[2][0], 6, '9–15 是 6 小時的長片');
});

test('常見誤解和用途的硬幣：1、4、5 元湊 8 元，貪婪 4 個、最少 2 個；87 元是 50 一個、10 三個、5 一個、1 兩個', () => {
  assert.deepStrictEqual(greedyCoins([5, 4, 1], 8), [1, 0, 3]);
  assert.strictEqual(sum(greedyCoins([5, 4, 1], 8)), 4);
  assert.strictEqual(fewestCoins([1, 4, 5], 8), 2);
  assert.deepStrictEqual(greedyCoins([50, 10, 5, 1], 87), [1, 3, 1, 2]);
  assert.strictEqual(sum(greedyCoins([50, 10, 5, 1], 87)), fewestCoins([50, 10, 5, 1], 87), '台幣的面額先拿最大的就是最少');
});

test('追蹤器：用的是影展那 8 場；9 點到印 4、13 點到印 3；每組輸入 40 步以內', () => {
  const [start, end] = arrays(SESSIONS);
  assert.ok(page.trace.code.python.includes(`start = ${JSON.stringify(start).replaceAll(',', ', ')}`));
  assert.ok(page.trace.code.python.includes(`end = ${JSON.stringify(end).replaceAll(',', ', ')}`));
  assert.strictEqual(scan(SESSIONS, 9).length, 4);
  assert.strictEqual(scan(SESSIONS, 13).length, 3);
  assert.strictEqual(page.trace.runs['9 點到'].at(-1).out, '4\n');
  assert.strictEqual(page.trace.runs['13 點到'].at(-1).out, '3\n');
  for (const { label } of page.trace.inputs) assert.ok(page.trace.runs[label].length <= 40, `${label} 有 ${page.trace.runs[label].length} 步`);
});

test('實作：9 點到 4 場、14 點到 2 場，印出 4 2', () => {
  assert.strictEqual(`${scan(SESSIONS, 9).length} ${scan(SESSIONS, 14).length}`, '4 2');
  assert.strictEqual(page.code.output, '4 2');
  assert.strictEqual(bruteForce(SESSIONS.filter(s => s[0] >= 14)).best, 2, '14 點才到，最多也只看得到 2 場');
});

// 試試看的幾種改法：strict 是把 >= 看成 >，update 是 free 更新成什麼（'end'、'start'、'never'、'always' 每一場都更新）
function variant(sessions, { strict = false, update = 'end' } = {}) {
  let free = 0, count = 0;
  for (const [start, end] of sessions) {
    const ok = strict ? start > free : start >= free;
    if (ok) count += 1;
    if (update === 'always' || (ok && update === 'end')) free = end;
    if (ok && update === 'start') free = start;
  }
  return count;
}
const optionOf = (q) => q.options[q.answer];

test('試試看第一題：6 場照結束時間排好，挑 3 場；三個錯的選項各是一種看錯', () => {
  const q = page.tryit[0];
  const meetings = [[8, 10], [9, 11], [10, 12], [11, 14], [13, 15], [12, 16]];
  assert.deepStrictEqual([...meetings].sort(byEnd), meetings);
  assert.ok(q.code.python.includes('start = [8, 9, 10, 11, 13, 12]') && q.code.python.includes('end = [10, 11, 12, 14, 15, 16]'));
  assert.deepStrictEqual(scan(meetings), [[8, 10], [10, 12], [13, 15]]);
  assert.strictEqual(bruteForce(meetings).best, 3);
  assert.strictEqual(optionOf(q), '3'); assert.strictEqual(q.output, '3');
  assert.deepStrictEqual(q.options, [variant(meetings, { strict: true }), 3, variant(meetings, { update: 'start' }), variant(meetings, { update: 'never' })].map(String));
  assert.deepStrictEqual(q.options, ['2', '3', '5', '6']);
});

test('試試看第二題：照開演時間排，程式印 3；照散場時間排好是 4；其他三種改法是 2、8、1', () => {
  const q = page.tryit[1];
  const sorted = [...SESSIONS].sort(byStart);
  const [start, end] = arrays(sorted);
  assert.ok(q.code.python.includes(`start = ${JSON.stringify(start).replaceAll(',', ', ')}`));
  assert.ok(q.code.python.includes(`end = ${JSON.stringify(end).replaceAll(',', ', ')}`));
  assert.deepStrictEqual(scan(sorted), [[9, 15], [16, 19], [19, 22]]);
  assert.strictEqual(q.output, '3');
  assert.strictEqual(q.answer, 1);
  assert.strictEqual(scan([...sorted].sort(byEnd)).length, 4);
  assert.strictEqual(variant(sorted, { strict: true }), 2);
  assert.strictEqual(variant(sorted, { update: 'start' }), 8);
  assert.strictEqual(variant(sorted, { update: 'always' }), 1);
});

test('試試看第三題：面額 5、4、1 湊 8 元印 4；錯的選項 2 是最少的個數、3 是面額有幾種、8 是全部用 1 元', () => {
  const q = page.tryit[2];
  assert.strictEqual(optionOf(q), '4'); assert.strictEqual(q.output, '4');
  assert.deepStrictEqual(q.options, [fewestCoins([5, 4, 1], 8), [5, 4, 1].length, sum(greedyCoins([5, 4, 1], 8)), 8 / 1].map(String));
  assert.strictEqual(5 + 4 + 1, 10);
});

// 不開瀏覽器畫一次圖解：記下每段文字和每條橫槓的位置
function drawFigure() {
  const texts = [], bars = [];
  const kit = {
    svgEl: (width, height) => ({ width, height, append() {} }),
    svgText: (s, x, y, text, size) => { texts.push({ x, y, text, size }); return { setAttribute() {} }; },
    rough: { svg: () => ({ rectangle: (x, y, w, h, o) => { bars.push({ x, y, w, h, fill: o.fill }); return {}; }, line: () => ({}) }) },
    INK: 'ink', FILL: 'fill', NEW: 'new',
  };
  return { svg: page.figure(kit), texts, bars };
}
// 文字佔的範圍（置中對齊）：中文字算一個字級寬，數字和符號算 0.6 個
const extent = ({ x, y, text, size }) => {
  const width = sum([...text].map(ch => (/[一-鿿：，]/.test(ch) ? 1 : 0.6) * size));
  return { left: x - width / 2, right: x + width / 2, top: y - size / 2, bottom: y + size / 2 };
};

test('圖解：寬 320 以內；八條橫槓照時間畫、挑中的四場塗黃；文字不超出畫面、不互相疊到、不壓到橫槓', () => {
  const { svg, texts, bars } = drawFigure();
  assert.ok(svg.width <= 320);
  assert.strictEqual(bars.length, 8);
  assert.deepStrictEqual(bars.map(b => b.fill === 'new'), SESSIONS.map(s => BEST.some(b => b[0] === s[0] && b[1] === s[1])));
  const hour = bars[0].w / 3;
  bars.forEach((b, k) => {
    assert.strictEqual(b.w, (SESSIONS[k][1] - SESSIONS[k][0]) * hour);
    assert.strictEqual(b.x - bars[2].x, (SESSIONS[k][0] - 9) * hour);
    assert.ok(b.x + b.w <= svg.width && b.y + b.h <= svg.height);
  });
  for (const line of ['最早開演的先挑：3 場', '片長最短的先挑：3 場', '最早散場的先挑：4 場']) assert.ok(texts.some(t => t.text === line), line);
  SESSIONS.forEach(([from, to]) => assert.ok(texts.some(t => t.text === `${from}–${to}`)));
  const boxes = texts.map(extent);
  boxes.forEach((b, i) => {
    assert.ok(b.left >= 0 && b.right <= svg.width && b.top >= 0 && b.bottom <= svg.height, `「${texts[i].text}」超出畫面`);
    boxes.forEach((o, j) => assert.ok(i >= j || b.right <= o.left || o.right <= b.left || b.bottom <= o.top || o.bottom <= b.top, `「${texts[i].text}」和「${texts[j].text}」疊在一起`));
    bars.forEach((bar) => assert.ok(b.right <= bar.x || bar.x + bar.w <= b.left || b.bottom <= bar.y || bar.y + bar.h <= b.top, `「${texts[i].text}」壓到橫槓`));
  });
});
