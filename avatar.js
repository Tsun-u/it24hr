// avatar.js — 識別證的像素頭像：名字當種子抽出來的，同一個名字永遠同一張臉；「換一張」就加鹽重抽。
// 24×28 格，畫在 canvas 上。不用圖檔、不用 AI。
(function (root) {
  const W = 24, H = 28;
  const SKIN = ['#f6d7c3', '#eec1a3', '#d9a07a', '#b9795a', '#8d5a3f', '#f9e0cf'];
  const HAIR = ['#2b2118', '#4a3222', '#7a4a2a', '#b07a3c', '#d9b36a', '#1f1f2e', '#5b4b8a', '#a83c3c', '#c9c9c9'];
  const SHIRT = ['#2563eb', '#15803d', '#b45309', '#7c3aed', '#be123c', '#0f766e', '#475569', '#1f2328', '#f59e0b'];
  const BG = ['#dfe7f0', '#e8e0d5', '#dde8dc', '#e9dfe8'];
  const INK = '#1f2328', MOUTH = '#b5544a', GLASS = '#4a5160';
  // 髮型：女生池、男生池，「其他」全部
  const STYLES = { 女: ['long', 'bob', 'ponytail', 'bun', 'short'], 男: ['short', 'buzz', 'side', 'curly', 'long'], 其他: ['long', 'bob', 'ponytail', 'bun', 'short', 'buzz', 'side', 'curly'] };

  function hash(str) { let h = 2166136261; for (const ch of str) { h ^= ch.codePointAt(0); h = Math.imul(h, 16777619) >>> 0; } return h; }
  function rng(seed) { let a = seed >>> 0; return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
  const pick = (r, arr) => arr[Math.floor(r() * arr.length)];

  // 從種子決定長相
  function features({ name = '', gender = '其他', salt = 0 }) {
    const r = rng(hash(`${name}|${gender}|${salt}`));
    const styles = STYLES[gender] || STYLES.其他;
    return {
      bg: pick(r, BG), skin: pick(r, SKIN), hair: pick(r, HAIR), style: pick(r, styles), shirt: pick(r, SHIRT),
      glasses: r() < 0.4, eyes: pick(r, ['dot', 'line', 'wide']), mouth: pick(r, ['smile', 'small']),
      blush: r() < 0.35, collar: r() < 0.5,
      mustache: gender !== '女' && r() < 0.25,
    };
  }

  // 把長相畫成格子
  function paint(f) {
    const g = Array.from({ length: H }, () => Array(W).fill(f.bg));
    const rect = (x0, y0, x1, y1, c) => { for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) if (g[y] && x >= 0 && x < W) g[y][x] = c; };
    const shade = (hex, k) => { const n = parseInt(hex.slice(1), 16); const f2 = (v) => Math.max(0, Math.min(255, Math.round(v * k))); return `#${[(n >> 16) & 255, (n >> 8) & 255, n & 255].map(f2).map(v => v.toString(16).padStart(2, '0')).join('')}`; };
    // 肩膀與衣服
    rect(4, 21, 19, 27, f.shirt); rect(3, 23, 20, 27, f.shirt);
    if (f.collar) { rect(10, 21, 13, 22, shade(f.shirt, 1.35)); rect(11, 23, 12, 23, shade(f.shirt, 1.35)); }
    // 脖子
    rect(10, 18, 13, 21, shade(f.skin, 0.85));
    // 頭
    rect(8, 7, 15, 17, f.skin); rect(7, 9, 16, 15, f.skin); rect(9, 6, 14, 6, f.skin); rect(9, 18, 14, 18, f.skin);
    // 耳朵
    rect(6, 11, 6, 13, f.skin); rect(17, 11, 17, 13, f.skin);
    // 頭髮
    const h = f.hair, hd = shade(h, 0.8);
    switch (f.style) {
      case 'short': rect(8, 4, 15, 7, h); rect(7, 6, 7, 9, h); rect(16, 6, 16, 9, h); rect(9, 3, 14, 3, h); break;
      case 'buzz': rect(8, 5, 15, 6, h); rect(9, 4, 14, 4, h); rect(7, 7, 7, 8, h); rect(16, 7, 16, 8, h); break;
      case 'side': rect(8, 4, 15, 7, h); rect(9, 3, 14, 3, h); rect(7, 6, 7, 10, h); rect(16, 6, 16, 8, h); rect(12, 7, 15, 8, h); break;
      case 'curly': rect(7, 4, 16, 7, h); rect(8, 3, 15, 3, h); rect(6, 6, 6, 10, h); rect(17, 6, 17, 10, h); rect(7, 8, 7, 9, hd); rect(16, 8, 16, 9, hd); break;
      case 'bob': rect(8, 4, 15, 7, h); rect(9, 3, 14, 3, h); rect(6, 6, 7, 16, h); rect(16, 6, 17, 16, h); rect(6, 16, 7, 16, hd); rect(16, 16, 17, 16, hd); break;
      case 'long': rect(8, 4, 15, 7, h); rect(9, 3, 14, 3, h); rect(5, 6, 7, 22, h); rect(16, 6, 18, 22, h); rect(5, 22, 7, 22, hd); rect(16, 22, 18, 22, hd); break;
      case 'ponytail': rect(8, 4, 15, 7, h); rect(9, 3, 14, 3, h); rect(7, 6, 7, 9, h); rect(16, 6, 16, 9, h); rect(17, 8, 19, 20, h); rect(18, 20, 19, 22, hd); break;
      case 'bun': rect(8, 4, 15, 7, h); rect(9, 3, 14, 3, h); rect(7, 6, 7, 9, h); rect(16, 6, 16, 9, h); rect(9, 1, 14, 2, h); rect(10, 0, 13, 0, hd); break;
    }
    // 眼睛；戴眼鏡就只畫框、不畫眼珠，框加眼珠會糊成一條黑帶。框畫大、蓋過臉緣也沒關係，鏡片塗白
    const ey = 12;
    if (f.glasses) {
      const lens = (x0) => { rect(x0, ey - 2, x0 + 4, ey + 1, GLASS); rect(x0 + 1, ey - 1, x0 + 3, ey, '#ffffff'); };
      lens(6); lens(12);
      rect(11, ey - 1, 11, ey - 1, GLASS);
      rect(5, ey - 1, 5, ey - 1, GLASS); rect(17, ey - 1, 17, ey - 1, GLASS);
    } else if (f.eyes === 'dot') { rect(9, ey, 10, ey, INK); rect(13, ey, 14, ey, INK); }
    else if (f.eyes === 'line') { rect(9, ey, 10, ey, INK); rect(13, ey, 14, ey, INK); rect(9, ey - 1, 10, ey - 1, shade(f.skin, 0.9)); rect(13, ey - 1, 14, ey - 1, shade(f.skin, 0.9)); }
    else { rect(9, ey - 1, 10, ey, INK); rect(13, ey - 1, 14, ey, INK); rect(10, ey - 1, 10, ey - 1, '#ffffff'); rect(14, ey - 1, 14, ey - 1, '#ffffff'); }
    if (f.blush) { rect(8, 14, 8, 14, '#f3a6a0'); rect(15, 14, 15, 14, '#f3a6a0'); }
    // 鬍子照瑪利歐的做法：解析度低就用鬍子交代鼻子和嘴的位置——鼻子一點、鬍子深色、比嘴寬、兩格厚，有鬍子就不另外畫嘴
    const my = 15;
    if (f.mustache) {
      rect(11, 13, 12, 14, shade(f.skin, 0.82));
      const dark = shade(f.hair, 0.55);
      rect(8, my, 15, my + 1, dark); rect(9, my + 2, 14, my + 2, dark);
    } else if (f.mouth === 'smile') { rect(10, my, 13, my, MOUTH); rect(10, my - 1, 10, my - 1, MOUTH); rect(13, my - 1, 13, my - 1, MOUTH); }
    else rect(11, my, 12, my, MOUTH);
    return g;
  }

  function draw(canvas, opts, scale = 4) {
    const g = paint(features(opts));
    canvas.width = W * scale; canvas.height = H * scale;
    const ctx = canvas.getContext('2d'); ctx.imageSmoothingEnabled = false;
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { ctx.fillStyle = g[y][x]; ctx.fillRect(x * scale, y * scale, scale, scale); }
    return canvas;
  }
  function dataURL(opts, scale = 4) { return draw(document.createElement('canvas'), opts, scale).toDataURL(); }

  root.Avatar = { draw, dataURL, features, W, H };
})(window);
