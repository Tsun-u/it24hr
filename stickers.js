// stickers.js — LIME 的貼圖：一顆萊姆，手刻 SVG，字由程式寫上去（不用 emoji、不用生圖）。
// 用法：Stickers.html('thanks')。thanks 謝啦、ok 好喔（engine 的 stickerFor 預設用這兩張）、thumb 讚、huh 問號（劇本 reply 題的 stickers 指定）。
(function (root) {
  const INK = '#233026';
  const eyeDot = (x) => `<circle cx="${x}" cy="63" r="3.6" fill="${INK}"/>`;
  const eyeSmile = (x) => `<path d="M${x - 5} 65 q5 -7 10 0" fill="none" stroke="${INK}" stroke-width="3" stroke-linecap="round"/>`;
  const blush = '<ellipse cx="39" cy="74" rx="5.5" ry="3.2" fill="#f28b82" opacity=".65"/><ellipse cx="81" cy="74" rx="5.5" ry="3.2" fill="#f28b82" opacity=".65"/>';
  const FACES = {
    thanks: { text: '謝啦！', face: eyeSmile(48) + eyeSmile(72) + blush + `<path d="M52 73 q8 11 16 0 z" fill="#8a3030" stroke="${INK}" stroke-width="2" stroke-linejoin="round"/>` },
    ok: { text: '好喔～', face: eyeDot(48) + eyeDot(72) + blush + `<path d="M52 75 q8 7 16 0" fill="none" stroke="${INK}" stroke-width="3" stroke-linecap="round"/>` },
    thumb: { text: '讚！', face: eyeDot(48) + eyeSmile(72) + blush + `<path d="M49 72 q11 13 22 0 z" fill="#8a3030" stroke="${INK}" stroke-width="2" stroke-linejoin="round"/>`
      + '<path d="M104 40 l6 -6 M106 52 l9 0 M100 30 l2 -9" stroke="#e8b400" stroke-width="3" stroke-linecap="round"/>' },
    huh: { text: '？？', face: `<circle cx="48" cy="63" r="4.6" fill="${INK}"/><circle cx="72" cy="63" r="4.6" fill="${INK}"/><circle cx="49.5" cy="61.5" r="1.4" fill="#fff"/><circle cx="73.5" cy="61.5" r="1.4" fill="#fff"/>`
      + `<circle cx="60" cy="78" r="3.4" fill="none" stroke="${INK}" stroke-width="2.6"/><path d="M90 42 q-5 8 0 11 q5 -3 0 -11 z" fill="#8ecae6" stroke="#4b8bb0" stroke-width="1.5"/>` },
  };
  function html(id) {
    const s = FACES[id] || FACES.ok;
    return `<svg class="sticker-art" viewBox="0 0 120 120" role="img" aria-label="貼圖：${s.text}">
      <ellipse cx="60" cy="106" rx="30" ry="5" fill="#000" opacity=".15"/>
      <path d="M60 31 C57 19 65 10 78 10 C78 23 70 31 60 31 Z" fill="#3f8f3a" stroke="#2b5e27" stroke-width="2"/>
      <ellipse cx="60" cy="66" rx="40" ry="36" fill="#9ccc3c" stroke="#4d6b10" stroke-width="3.5"/>
      <circle cx="100.5" cy="66" r="3" fill="#7aa82c"/>
      <ellipse cx="42" cy="49" rx="10" ry="5.5" fill="#fff" opacity=".45" transform="rotate(-25 42 49)"/>
      ${s.face}
      <text x="4" y="27" transform="rotate(-8 4 27)" font-size="22" font-weight="900" fill="#fff" stroke="#2d3b2d" stroke-width="5" paint-order="stroke" stroke-linejoin="round">${s.text}</text>
    </svg>`;
  }
  root.Stickers = { html };
})(window);
