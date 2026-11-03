// photos.js — LIME 裡同事傳來的照片，程式畫的 SVG（不用圖檔）。Photos.html(id) 回 SVG 字串。
// 只畫通用系統工具的樣子，不放任何作業系統的名字或標誌
(function (root) {
  const W = 320, H = 240;
  const frame = (inner, bg = '#0b1220') => `<svg class="photo-svg" viewBox="0 0 ${W} ${H}" role="img" xmlns="http://www.w3.org/2000/svg">`
    + `<rect width="${W}" height="${H}" fill="${bg}"/>${inner}</svg>`;
  // 螢幕上的工作管理員視窗（拍得有點歪）
  const taskWindow = (body, title = '工作管理員') => `<g transform="rotate(-2 160 120)">`
    + `<rect x="24" y="20" width="272" height="196" rx="4" fill="#f3f4f6"/>`
    + `<rect x="24" y="20" width="272" height="20" rx="4" fill="#d1d5db"/>`
    + `<text x="34" y="34" font-size="11" fill="#111827">${title}</text>${body}</g>`;
  const PHOTOS = {
    // 反光：螢幕上一大片白光，邊角看得到一點視窗框
    glare: frame(`<rect x="20" y="16" width="280" height="204" rx="6" fill="#1f2937"/>`
      + `<path d="M28 24h60v14H28z" fill="#d1d5db" opacity=".6"/>`
      + `<defs><radialGradient id="g1" cx="55%" cy="45%" r="60%"><stop offset="0" stop-color="#fff"/><stop offset=".45" stop-color="#fff" stop-opacity=".95"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient></defs>`
      + `<ellipse cx="176" cy="110" rx="170" ry="120" fill="url(#g1)"/>`),
    // 處理程序那頁：Excel 佔了一大塊
    processes: frame(taskWindow(
      `<text x="34" y="58" font-size="10" fill="#2563eb">處理程序</text><text x="90" y="58" font-size="10" fill="#6b7280">效能</text>`
      + [['Excel', 3.2], ['瀏覽器', 1.1], ['LIME', 0.4], ['防毒', 0.3]].map(([n, gb], i) =>
        `<text x="34" y="${84 + i * 26}" font-size="11" fill="#111827">${n}</text>`
        + `<rect x="100" y="${74 + i * 26}" width="${gb * 50}" height="12" fill="#93c5fd"/>`
        + `<text x="${106 + gb * 50}" y="${84 + i * 26}" font-size="10" fill="#374151">${gb} GB</text>`).join(''))),
    // 拍到自己：君傑的剪影，背後是螢幕的藍光
    selfie: frame(`<rect x="0" y="0" width="${W}" height="${H}" fill="#1e3a8a" opacity=".55"/>`
      + `<circle cx="160" cy="104" r="46" fill="#111827"/><path d="M70 240c8-62 46-86 90-86s82 24 90 86z" fill="#111827"/>`),
    // 又一張自拍，這次比了 YA
    selfieYa: frame(`<rect x="0" y="0" width="${W}" height="${H}" fill="#1e3a8a" opacity=".55"/>`
      + `<circle cx="160" cy="104" r="46" fill="#111827"/><path d="M70 240c8-62 46-86 90-86s82 24 90 86z" fill="#111827"/>`
      + `<path d="M232 240l6-70 10 0-2 40 14-58 11 3-15 62 6 23z" fill="#111827"/>`),
    // 清楚：效能 → 記憶體
    clear: frame(taskWindow(
      `<text x="34" y="58" font-size="10" fill="#6b7280">處理程序</text><text x="90" y="58" font-size="10" fill="#2563eb">效能</text>`
      + `<text x="34" y="80" font-size="16" font-weight="bold" fill="#111827">記憶體</text><text x="286" y="80" font-size="16" fill="#111827" text-anchor="end">8.0 GB DDR4</text>`
      + `<rect x="34" y="88" width="252" height="54" fill="#ede9fe"/><path d="M34 128 L90 120 L140 124 L190 110 L240 114 L286 108" stroke="#7c3aed" fill="none"/>`
      + [['速度:', '2666 MT/s'], ['已使用插槽:', '1 (總共 4)'], ['尺寸:', 'DIMM']].map(([k, v], i) =>
        `<text x="34" y="${164 + i * 16}" font-size="11" fill="#6b7280">${k}</text><text x="120" y="${164 + i * 16}" font-size="11" fill="#111827">${v}</text>`).join(''))),
  };
  const Photos = { html: (id) => PHOTOS[id] || '' , ids: () => Object.keys(PHOTOS) };
  root.Photos = Photos;
  if (typeof module !== 'undefined') module.exports = { Photos };
})(typeof window !== 'undefined' ? window : globalThis);
