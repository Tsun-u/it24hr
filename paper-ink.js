// paper-ink.js — 手寫文件：劇本寫死的紙上文字，事先在本機畫成透明 PNG（assets/hand/<key>.png），
// 網頁用 <img> 放在紙上。字型檔不隨遊戲散布。
// 對照表 HAND_DATA 由 scripts/build-handwriting.js 產生（hand-data.js）；查不到的文字照舊用打字的。
(function (root) {
  // FNV-1a 32 位元：建置腳本和瀏覽器用同一支算出檔名
  function textKey(text) {
    let hash = 0x811c9dc5;
    for (const ch of String(text)) {
      const code = ch.codePointAt(0);
      hash ^= code & 0xff; hash = Math.imul(hash, 0x01000193);
      hash ^= code >>> 8; hash = Math.imul(hash, 0x01000193);
    }
    return (hash >>> 0).toString(16).padStart(8, '0');
  }

  function handFor(text, data = root.HAND_DATA) {
    const key = textKey(text), size = data && data[key];
    return size ? { src: `assets/hand/${key}.png`, width: size[0], height: size[1] } : null;
  }

  // 有手寫圖就回一個 <img class="hand">（版面窄時照比例縮小），沒有就回 null。
  // 用 <img> 不用 CSS mask：mask 的圖要過 CORS，file:// 開遊戲時會被擋掉、整段字不見
  function handNode(text, doc = root.document) {
    const hand = handFor(text); if (!hand) return null;
    const img = doc.createElement('img'); img.className = 'hand';
    img.src = hand.src; img.alt = text; img.width = hand.width; img.height = hand.height;
    return img;
  }

  const PaperInk = { textKey, handFor, handNode };
  if (typeof module !== 'undefined') module.exports = PaperInk;
  else root.PaperInk = PaperInk;
})(typeof window !== 'undefined' ? window : globalThis);
