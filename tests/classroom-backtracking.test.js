// tests/classroom-backtracking.test.js（node --test）：回溯頁講義裡寫到的數字都算得出來
const test = require('node:test'); const assert = require('node:assert');
const page = require('../classroom/algorithms/backtracking.js');

const PLAYLIST = [6, 5, 4, 7, 3, 8, 5, 4, 6, 3, 7, 4];
const sum = list => list.reduce((a, b) => a + b, 0);

// 實作的 find：找到第一組就停。回傳走了幾步（函式被呼叫幾次）和選的那幾首。
// 三個開關對應試試看第二題的選項：reset 回來把記號改回 0、trySkip 選的不行再試不選、atLeast 把「超過」寫成 >=
function findFirst(songs, target, { reset = true, trySkip = true, atLeast = false } = {}) {
  const chosen = songs.map(() => 0); let steps = 0;
  const find = (i, total) => {
    steps += 1;
    if (total === target) return 1;
    if (i === songs.length || (atLeast ? total >= target : total > target)) return 0;
    chosen[i] = 1;
    if (find(i + 1, total + songs[i]) === 1) return 1;
    if (reset) chosen[i] = 0;
    return trySkip ? find(i + 1, total) : 0;
  };
  const found = find(0, 0);
  return { found, steps, picked: songs.filter((_, i) => chosen[i] === 1) };
}

// 把每一組都數出來：每首歌都決定完才算一組。prune 是「超過目標就不往下」
function countAll(songs, target, prune) {
  let steps = 0, groups = 0;
  const walk = (i, total) => {
    steps += 1;
    if (prune && total > target) return;
    if (i === songs.length) { if (total === target) groups += 1; return; }
    walk(i + 1, total + songs[i]);
    walk(i + 1, total);
  };
  walk(0, 0);
  return { steps, groups };
}

test('Hook 和複習的數字：12 首有 4096 種、30 首超過十億種、前四首 22 分鐘所以後面八首的 256 種不用看', () => {
  assert.strictEqual(2 ** 12, 4096);
  assert.ok(2 ** 30 > 1e9 && 2 ** 29 < 1e9);
  assert.strictEqual(sum(PLAYLIST.slice(0, 4)), 22);
  assert.strictEqual(2 ** (PLAYLIST.length - 4), 256);
});

test('總結和實作：12 首湊 20 分鐘，走 25 步找到 6、5、4、5', () => {
  const { found, steps, picked } = findFirst(PLAYLIST, 20);
  assert.strictEqual(found, 1);
  assert.strictEqual(steps, 25);
  assert.deepStrictEqual(picked, [6, 5, 4, 5]);
  assert.strictEqual(sum(picked), 20);
  assert.strictEqual(page.code.output, picked.join(' '));
  assert.ok(page.summary.includes('25 步') && page.summary.includes('6、5、4、5'));
});

test('跑幾步：全部 89 組，超過就剪走 2271 步，不剪走 8191 步', () => {
  assert.deepStrictEqual(countAll(PLAYLIST, 20, true), { steps: 2271, groups: 89 });
  assert.deepStrictEqual(countAll(PLAYLIST, 20, false), { steps: 8191, groups: 89 });
  assert.strictEqual(2 ** 13 - 1, 8191);
  const row = page.cost.rows[1][0];
  for (const n of ['25 步', '89 組', '2271 步', '8191 步']) assert.ok(row.includes(n), n);
});

test('圖解：選 8 再選 7 是 15 超過 13，退回改選 5 是 13 剛好，走 5 步就找到', () => {
  assert.ok(8 + 7 === 15 && 15 > 13);
  assert.strictEqual(8 + 5, 13);
  assert.deepStrictEqual(findFirst([8, 7, 5], 13), { found: 1, steps: 5, picked: [8, 5] });
});

test('圖解的文字都在 320px 裡面，互相不疊、也不疊到別的圓圈', () => {
  const texts = [], circles = [];
  const shape = () => ({ setAttribute() {} });
  const kit = {
    svgEl: (w, h) => ({ w, h, append() {} }),
    svgText: (s, x, y, text, size = 15) => { texts.push({ x, y, text, size }); return shape(); },
    rough: { svg: () => ({ line: shape, polygon: shape, rectangle: shape, circle: (x, y, d) => { circles.push({ x, y, r: d / 2 }); return shape(); } }) },
    INK: '#000', FILL: '#aaa', NEW: '#ff0',
  };
  const svg = page.figure(kit);
  assert.ok(svg.w <= 320);
  // 文字置中對齊：全形字算一個字寬、半形算 0.6 個
  const box = ({ x, y, text, size }) => {
    const w = [...text].reduce((a, ch) => a + (ch.charCodeAt(0) > 255 ? size : size * 0.6), 0);
    return { l: x - w / 2, r: x + w / 2, t: y - size / 2, b: y + size / 2 };
  };
  const overlap = (a, b) => a.l < b.r && b.l < a.r && a.t < b.b && b.t < a.b;
  const boxes = texts.map(t => ({ ...t, ...box(t) }));
  for (const b of boxes) assert.ok(b.l >= 0 && b.r <= svg.w && b.t >= 0 && b.b <= svg.h, `「${b.text}」超出圖的範圍`);
  boxes.forEach((a, i) => boxes.slice(i + 1).forEach(b => assert.ok(!overlap(a, b), `「${a.text}」和「${b.text}」疊在一起`)));
  for (const b of boxes) for (const c of circles) {
    if (b.x === c.x && b.y === c.y) continue;   // 寫在圓圈裡的分鐘數
    assert.ok(!overlap(b, { l: c.x - c.r, r: c.x + c.r, t: c.y - c.r, b: c.y + c.r }), `「${b.text}」疊到圓圈`);
  }
  for (const n of ['0', '8', '15', '13']) assert.ok(texts.some(t => t.text === n), `圖上少了 ${n}`);
});

test('追蹤器：湊 13、湊 15 都印 yes，每組 40 步以內', () => {
  for (const label of ['湊 13 分鐘', '湊 15 分鐘']) {
    const run = page.trace.runs[label];
    assert.strictEqual(run.at(-1).out, 'yes\n');
    assert.ok(run.length <= 40, `${label} 有 ${run.length} 步`);
  }
  assert.deepStrictEqual(findFirst([8, 7, 5], 15).picked, [8, 7]);
});

test('試試看第一、二題：5、4、3 湊 7 印 4 3；忘了改回 0 印 5 4 3（加起來 12）；其他選項會怎樣', () => {
  const songs = [5, 4, 3];
  assert.deepStrictEqual(findFirst(songs, 7).picked, [4, 3]);
  assert.strictEqual(page.tryit[0].options[page.tryit[0].answer], '4 3');
  assert.strictEqual(page.tryit[0].output, '4 3');
  assert.ok(5 + 4 === 9 && 5 + 3 === 8);
  const buggy = findFirst(songs, 7, { reset: false });
  assert.deepStrictEqual(buggy.picked, [5, 4, 3]);
  assert.strictEqual(sum(buggy.picked), 12);
  assert.strictEqual(page.tryit[1].output, '5 4 3');
  assert.ok(page.tryit[1].options[page.tryit[1].answer].includes('chosen[i] = 0'));
  assert.deepStrictEqual(findFirst(songs, 7, { reset: false, atLeast: true }).picked, [5, 4, 3]);
  assert.deepStrictEqual(findFirst(songs, 7, { reset: false, trySkip: false }).picked, [5, 4]);
});

test('試試看第三題：4 首不剪枝呼叫 31 次；16 是挑法數、15 是最底層以外、24 是 4!', () => {
  assert.strictEqual(countAll([5, 4, 3, 2], 7, false).steps, 31);
  assert.strictEqual(1 + 2 + 4 + 8 + 16, 31);
  assert.strictEqual(2 ** 4, 16);
  assert.strictEqual(1 + 2 + 4 + 8, 15);
  assert.strictEqual(4 * 3 * 2 * 1, 24);
  assert.strictEqual(page.tryit[2].options[page.tryit[2].answer], '31');
  assert.strictEqual(page.tryit[2].output, '31');
});

test('課外補充：6 個人有 720 種坐法', () => {
  assert.strictEqual(6 * 5 * 4 * 3 * 2 * 1, 720);
});
