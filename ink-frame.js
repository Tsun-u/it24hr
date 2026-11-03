// ink-frame.js — 電腦外的一般介面（桌上的實體物件、遊戲外框）用手繪外框；電腦螢幕裡的 App 維持軟體的樣子。
// 筆觸照 looseleaf（MIT）的做法、用自己的程式重寫：一筆畫完的框，從上緣中段下筆、繞一圈多畫一點收筆，
// 四角只微微抖、邊只帶一點弧，線頭尾漸細；底色用同一圈形狀填，才不會從線外露出來。
// 真的 <button> 後面墊一張不吃點擊的 SVG，色讀 CSS 變數 --ink-fill／--ink；同尺寸同 seed 的形狀快取共用，
// 只有尺寸變了才重畫，按下的當下不動節點（iOS WebKit 觸碰時重建 DOM 會吃掉點擊）。
(function (root) {
  const SVG = 'http://www.w3.org/2000/svg';
  const PEN_WIDTH = 1.7;
  const cache = new Map();
  const frames = new WeakMap();   // 元素 → 它的框；內容整個重建時框會被清掉，再套一次就把同一張接回去
  const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

  function seeded(seed) {
    let a = (seed >>> 0) || 1;
    const next = () => {
      a = (a + 0x6D2B79F5) >>> 0;
      let t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
    next.range = (lo, hi) => lo + (hi - lo) * next();
    next.gauss = (mean, sd) => mean + sd * Math.sqrt(-2 * Math.log(1 - next())) * Math.cos(2 * Math.PI * next());
    return next;
  }

  // 一段微微彎的直線：bow 是中點往法線方向偏多少 px
  function bowed(a, b, bow) {
    const dx = b[0] - a[0], dy = b[1] - a[1], len = Math.hypot(dx, dy) || 1;
    const nx = -dy / len, ny = dx / len, n = Math.max(2, Math.ceil(len / 2));
    const out = [];
    for (let i = 0; i <= n; i++) { const t = i / n, k = bow * Math.sin(Math.PI * t); out.push([a[0] + dx * t + nx * k, a[1] + dy * t + ny * k]); }
    return out;
  }

  // 依序走過幾個頂點，轉角用二次曲線收圓（半徑每角略有不同）
  function corners(vs, bows, rad, rnd) {
    const dir = (p, q) => { const l = Math.hypot(q[0] - p[0], q[1] - p[1]) || 1; return [(q[0] - p[0]) / l, (q[1] - p[1]) / l]; };
    const edges = vs.length - 1, d = [], len = [];
    for (let i = 0; i < edges; i++) { d.push(dir(vs[i], vs[i + 1])); len.push(Math.hypot(vs[i + 1][0] - vs[i][0], vs[i + 1][1] - vs[i][1])); }
    const r = new Array(edges + 1).fill(0);
    for (let j = 1; j < edges; j++) r[j] = Math.min(rad * (0.75 + rnd() * 0.5), len[j - 1] * 0.45, len[j] * 0.45);
    const out = [];
    for (let i = 0; i < edges; i++) {
      const s = [vs[i][0] + d[i][0] * r[i], vs[i][1] + d[i][1] * r[i]];
      const e = [vs[i + 1][0] - d[i][0] * r[i + 1], vs[i + 1][1] - d[i][1] * r[i + 1]];
      out.push(...bowed(s, e, bows[i]).slice(i ? 1 : 0));
      if (i < edges - 1 && r[i + 1] > 0.6) {
        const v = vs[i + 1], b = [v[0] + d[i + 1][0] * r[i + 1], v[1] + d[i + 1][1] * r[i + 1]];
        const k = 0.9 + rnd() * 0.1, c = [v[0] * k + (e[0] + b[0]) / 2 * (1 - k), v[1] * k + (e[1] + b[1]) / 2 * (1 - k)];
        const steps = Math.max(3, Math.ceil(r[i + 1] / 1.5));
        for (let j = 1; j < steps; j++) { const t = j / steps, u = 1 - t; out.push([u * u * e[0] + 2 * u * t * c[0] + t * t * b[0], u * u * e[1] + 2 * u * t * c[1] + t * t * b[1]]); }
      }
    }
    return out;
  }

  // 框的中心線：從上緣中段下筆，順時針繞一圈，回到起點後多畫一小段
  function boxLine(w, h, radius, rnd) {
    const m = Math.min(w, h), jitter = clamp(0.012 * m, 0.12, 0.4), tilt = rnd.gauss(0, 0.0012);
    const x = 1, y = 1, W = w - 2, H = h - 2;
    const at = (px, py, sy) => [px + rnd.gauss(0, jitter), py + rnd.gauss(0, jitter) + sy * tilt * W];
    const TL = at(x, y, 0), TR = at(x + W, y, 1), BR = at(x + W, y + H, 1), BL = at(x, y + H, 0);
    const lift = (l) => rnd.range(0.05, 0.32) * clamp(l / 110, 0.3, 1.2);
    const drift = (l) => rnd.gauss(0, 0.1) * clamp(l / 40, 0.4, 1);
    const t0 = rnd.range(0.35, 0.65), S = [TL[0] + (TR[0] - TL[0]) * t0, TL[1] + (TR[1] - TL[1]) * t0];
    const run = Math.min(0.06 * W, rnd.range(1.6, 2.6));
    return corners([S, TR, BR, BL, TL, [S[0] + run, S[1]]], [-lift(W * (1 - t0)), drift(H), lift(W), drift(H), -lift(W * t0 + run)], radius, rnd);
  }

  // 中心線變成一條有粗細的筆畫：頭尾漸細，中間粗細有一點點起伏
  function stroke(pts, rnd) {
    const acc = [0];
    for (let i = 1; i < pts.length; i++) acc.push(acc[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
    const total = acc[acc.length - 1], ph = rnd() * Math.PI * 2;
    const left = [], right = [];
    pts.forEach((p, i) => {
      const a = pts[Math.max(0, i - 1)], b = pts[Math.min(pts.length - 1, i + 1)];
      const dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy) || 1;
      const taper = clamp(Math.min(acc[i], total - acc[i]) / 4, 0.45, 1);   // 頭尾收細但不能太細：起筆收筆疊在一起的地方要補實，不然像一個缺口
      const half = PEN_WIDTH / 2 * taper * (1 + 0.08 * Math.sin(acc[i] / 23 + ph));
      left.push([p[0] - dy / l * half, p[1] + dx / l * half]); right.push([p[0] + dy / l * half, p[1] - dx / l * half]);
    });
    return 'M' + [...left, ...right.reverse()].map(p => `${p[0].toFixed(2)},${p[1].toFixed(2)}`).join(' L') + ' Z';
  }

  function shapes(w, h, seed, pill) {
    const key = `${w}x${h}:${seed}:${pill ? 'pill' : 'box'}`;
    if (!cache.has(key)) {
      const rnd = seeded(seed);
      const line = boxLine(w, h, pill ? Math.min(w, h) / 2 - 0.5 : clamp(h * 0.09, 2.5, 4.4), rnd);
      cache.set(key, { fill: 'M' + line.map(p => `${p[0].toFixed(2)},${p[1].toFixed(2)}`).join(' L') + ' Z', line: stroke(line, rnd) });
    }
    return cache.get(key);
  }

  // 量的是 SVG 實際佔的範圍（padding box）：有邊框的元素用 offsetWidth 量，viewBox 會比 SVG 大、整個框被等比縮小
  function draw(el, svg, seed, pill) {
    const w = el.clientWidth, h = el.clientHeight;
    if (!w || !h || svg.dataset.size === `${w}x${h}`) return;
    svg.dataset.size = `${w}x${h}`;
    svg.setAttribute('viewBox', `0 0 ${w} ${h}`);
    const { fill, line } = shapes(w, h, seed, pill);
    const path = (d, cls) => { const p = document.createElementNS(SVG, 'path'); p.setAttribute('d', d); p.setAttribute('class', cls); return p; };
    svg.replaceChildren(path(fill, 'ink-fill'), path(line, 'ink-line'));
  }

  // 幫一個元素墊手繪外框；pill 是膠囊形（圓角＝半高）
  function frame(el, { seed = 1, pill = false } = {}) {
    if (!el) return;
    const kept = frames.get(el);
    if (kept) { if (kept.parentNode !== el) el.prepend(kept); return; }
    el.classList.add('inked');
    const svg = document.createElementNS(SVG, 'svg');
    svg.setAttribute('class', 'ink-frame'); svg.setAttribute('aria-hidden', 'true');
    frames.set(el, svg);
    el.prepend(svg);
    draw(el, svg, seed, pill);
    if (root.ResizeObserver) new ResizeObserver(() => draw(el, svg, seed, pill)).observe(el);
    // 會捲動的面板：框跟著看得到的範圍走，不跟內容一起捲走
    el.addEventListener('scroll', () => { svg.style.transform = `translate(${el.scrollLeft}px, ${el.scrollTop}px)`; }, { passive: true });
  }

  // 電腦外的一般介面一次套上：遊戲外框與面板、表單欄位、分頁、按鈕；seed 照出現順序，同一個畫面每次長一樣。
  // 根元素自己符合也算（浮層面板直接傳面板進來）。字有底線的鈕本身就是連結的樣子，不再加外框（要掛在畫面上才讀得到樣式）
  const BOX = '.badge-cols, .mode-badge, .mode-card, .report, .grad-card, .summary-card, .hb-panel, .box-panel, .home-box, .seat-props li, .ink-field, .seg, .atlas-tab, .journal-tab, .btn';
  const PILL = '.reroll, .hb-jump, .hm-chip, .hm-tab';
  const PAPER = `${BOX}, ${PILL}`;
  const underlined = (el) => getComputedStyle(el).textDecorationLine.includes('underline');
  function paperize(rootEl) {
    if (!rootEl) return;
    const els = [rootEl, ...rootEl.querySelectorAll(PAPER)].filter(el => el.matches(PAPER) && !underlined(el));
    els.forEach((el, i) => frame(el, { seed: 101 + i, pill: el.matches(PILL) }));
  }

  const Ink = { frame, shapes, paperize };
  root.Ink = Ink;
  if (typeof module !== 'undefined') module.exports = { Ink };
})(typeof window !== 'undefined' ? window : globalThis);
