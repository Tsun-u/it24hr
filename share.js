// share.js — 結算卡分享（參考 fab24hr）：一張直式 1080×1920 的結算圖、一段帶網址的文字。
// 圖用 canvas 自己畫（零依賴；頭像也是程式畫的，不讀圖檔，file:// 開也能存圖）。
// 手機能用系統分享就叫出分享面板；不行的話，圖片跳出大圖讓玩家存，文字複製到剪貼簿。
(function (root) {
  const isNode = typeof module !== 'undefined';
  const { C } = isNode ? require('./contract.js') : { C: root.C };
  const TAG = '#IT24hr';
  const url = () => `${C.SHARE_URL}?utm_source=share`;
  const dayOf = (view) => (view.scriptName || '').split('：')[0];

  // 分享的那段話：withUrl 是複製到剪貼簿用（系統分享另外帶網址）
  function text(view, withUrl = false) {
    const { report, badEnd, summary } = view;
    const head = summary ? `我在 IT24hr 完成了新人訓練：${summary.chain}` : badEnd ? `我在 IT24hr 的${dayOf(view)} BAD END 了：「${badEnd}」` : `我在 IT24hr 過完了${dayOf(view)}，今天我是「${report.kind}」：${report.line}`;
    return `${head} 軟體工程師的一天，免安裝的小遊戲${withUrl ? `：${url()}` : ''} ${TAG}`;
  }

  // ── 結算圖（上半張成品畫面，下半張印章、總評、習慣與成就、一句同事評語，最底下網址）──
  const W = 1080, H = 1920, PAD = 64;
  const INK = '#1f2328', PAPER = '#f6f1e7', MUTED = '#6b7280', RED = '#b3261e', AMBER = '#ffd166';
  const BACKDROP = { legacy: '#d9d3c3', hybrid: '#cdd4dc', speedrun: '#2b2f3a' };

  function card(view) {
    if (view.summary) return summaryCard(view);
    const { report, shot, badEnd, mode } = view;
    const cv = document.createElement('canvas'); cv.width = W; cv.height = H;
    const g = cv.getContext('2d');
    const css = getComputedStyle(document.documentElement);
    const SANS = css.getPropertyValue('--font').trim() || 'sans-serif', MONO = css.getPropertyValue('--mono').trim() || 'monospace';
    const font = (size, weight = 400, family = SANS) => { g.font = `${weight} ${size}px ${family}`; };
    // 中文沒有空白可以斷：一個字一個字量，超過寬度就換行，最多 maxLines 行（超過的最後一行補…）
    const wrap = (s, maxW, maxLines = 99) => {
      const lines = []; let line = '';
      for (const ch of String(s)) {
        if (ch === '\n') { lines.push(line); line = ''; continue; }
        if (g.measureText(line + ch).width > maxW && line) { lines.push(line); line = ch; } else line += ch;
      }
      if (line) lines.push(line);
      if (lines.length > maxLines) { lines.length = maxLines; lines[maxLines - 1] = lines[maxLines - 1].slice(0, -1) + '…'; }
      return lines;
    };
    const rrect = (x, y, w, h, r) => { g.beginPath(); g.roundRect(x, y, w, h, r); };

    g.fillStyle = BACKDROP[mode] || BACKDROP.legacy; g.fillRect(0, 0, W, H);
    // 頂端：遊戲名＋哪一天
    g.fillStyle = '#1a1d23'; g.fillRect(0, 0, W, 120);
    g.textBaseline = 'middle'; font(44, 700, MONO); g.fillStyle = AMBER; g.fillText('IT24hr', PAD, 62);
    const wName = g.measureText('IT24hr').width; font(34, 500); g.fillStyle = '#e6e8ee';
    g.fillText(`${dayOf(view)}・${mode || 'legacy'}`, PAD + wName + 28, 64);
    let y = 120;
    if (badEnd) {   // BAD END：上面一條暗紅底，原因寫在裡面
      g.fillStyle = 'rgba(26, 10, 10, .92)'; g.fillRect(0, y, W, 190);
      g.textAlign = 'center'; font(64, 800, MONO); g.fillStyle = '#ffd9d9'; g.fillText('B A D   E N D', W / 2, y + 62);
      font(32, 500); wrap(badEnd, W - PAD * 2, 2).forEach((l, i) => g.fillText(l, W / 2, y + 122 + i * 40));
      g.textAlign = 'left'; y += 190;
    }
    y += 40;
    // 成品畫面：簡化成一個瀏覽器視窗，裡面照成品的欄位和資料畫表格；沒寫程式就是 404
    if (shot) {
      const m = shot.model, h = badEnd ? 380 : 460, x = PAD, w = W - PAD * 2;
      g.save(); g.shadowColor = 'rgba(0,0,0,.25)'; g.shadowBlur = 30; g.shadowOffsetY = 10;
      rrect(x, y, w, h, 18); g.fillStyle = '#2d333b'; g.fill(); g.restore();
      ['#ff6b5f', '#ffbd2e', '#28c840'].forEach((c, i) => { g.beginPath(); g.arc(x + 34 + i * 30, y + 30, 9, 0, Math.PI * 2); g.fillStyle = c; g.fill(); });
      font(28, 600); g.fillStyle = '#e6e8ee'; g.fillText(m.app || '', x + 140, y + 31);
      const theme = m.theme || { bg: '#ffffff', fg: INK, accent: '#2563eb' };
      const bx = x + 14, by = y + 60, bw = w - 28, bh = h - 74;
      rrect(bx, by, bw, bh, 10); g.fillStyle = theme.bg; g.fill();
      g.save(); rrect(bx, by, bw, bh, 10); g.clip();
      if (!m.built) {
        g.textAlign = 'center'; font(150, 300); g.fillStyle = '#9aa1ab'; g.fillText('404', bx + bw / 2, by + bh / 2 - 20);
        font(30); g.fillText('還沒有成品', bx + bw / 2, by + bh / 2 + 80); g.textAlign = 'left';
      } else {
        const cols = (m.fields || []).slice(0, 5), colW = bw / Math.max(1, cols.length);
        g.fillStyle = theme.accent; g.fillRect(bx, by, bw, 64);
        font(26, 700); g.fillStyle = '#ffffff';
        cols.forEach((f, i) => g.fillText(wrap(f, colW - 24, 1)[0], bx + 16 + i * colW, by + 33));
        (m.rows || []).slice(0, Math.floor((bh - 64) / 64)).forEach((r, k) => {
          const ry = by + 64 + k * 64;
          if (k % 2) { g.fillStyle = 'rgba(127,127,127,.08)'; g.fillRect(bx, ry, bw, 64); }
          font(26); g.fillStyle = theme.fg;
          cols.forEach((_, i) => g.fillText(wrap(r[i] ?? '', colW - 24, 1)[0], bx + 16 + i * colW, ry + 33));
        });
      }
      g.restore();
      y += h + 22;
      font(26); g.fillStyle = mode === 'speedrun' ? '#c9ced6' : MUTED; g.fillText(wrap(shot.label, W - PAD * 2, 1)[0], PAD, y + 14);
      y += 52;
    }
    // 紙卡：頭像名字、今天你是（印章）、總評、習慣與成就、一句同事評語
    const cx = PAD, cw = W - PAD * 2, cTop = y, cBottom = H - 130;
    g.save(); g.shadowColor = 'rgba(0,0,0,.28)'; g.shadowBlur = 36; g.shadowOffsetY = 12;
    rrect(cx, cTop, cw, cBottom - cTop, 22); g.fillStyle = PAPER; g.fill(); g.restore();
    const ix = cx + 48, iw = cw - 96; y = cTop + 48;
    const face = root.Avatar.draw(document.createElement('canvas'), { name: report.player.name, gender: report.player.gender, salt: report.player.avatarSalt || 0 }, 7);
    g.imageSmoothingEnabled = false; g.drawImage(face, ix, y, face.width, face.height); g.imageSmoothingEnabled = true;
    g.textBaseline = 'alphabetic'; font(54, 800); g.fillStyle = INK; g.fillText(report.player.name, ix + face.width + 32, y + 80);
    font(34); g.fillStyle = MUTED; g.fillText(report.player.title || '', ix + face.width + 32, y + 134);
    y += face.height + 40;
    font(30, 500); g.fillStyle = MUTED; g.fillText('今天你是', ix, y);
    // 印章：雙框紅字，歪 4 度
    font(88, 800, MONO); const sw = g.measureText(report.kind).width + 72;
    g.save(); g.translate(ix + 6, y + 26); g.rotate(-4 * Math.PI / 180);
    g.strokeStyle = RED; g.lineWidth = 6; rrect(0, 0, sw, 128, 14); g.stroke(); g.lineWidth = 2; rrect(11, 11, sw - 22, 106, 9); g.stroke();
    g.fillStyle = RED; g.textBaseline = 'middle'; g.fillText(report.kind, 36, 68); g.restore();
    g.textBaseline = 'alphabetic'; y += 214;
    font(44, 800); g.fillStyle = INK;
    for (const l of wrap(report.line, iw, 3)) { g.fillText(l, ix, y); y += 60; }
    y += 24;
    const room = (need) => y + need < cBottom - 48;
    const traits = report.traits || [];
    if (traits.length && room(120)) {
      font(30, 600); g.fillStyle = MUTED; g.fillText('習慣與成就', ix, y); y += 56;
      for (const t of traits) {
        if (!room(56)) break;
        font(36, 800); g.fillStyle = INK; g.fillText(t.title, ix, y);
        font(36); g.fillText(wrap(t.text, iw - 210, 1)[0], ix + 210, y); y += 56;
      }
      y += 30;
    }
    // 同事怎麼說：先算放得下幾句（最多三句），一句都放不下就不印標題
    const quotes = []; let need = 56;
    font(36, 700);
    for (const peer of (report.peers || []).slice(0, 3)) {
      const lines = wrap(peer.text, iw, 2), h = lines.length * 50 + 52;
      if (!room(need + h)) break;
      quotes.push({ peer, lines }); need += h;
    }
    if (quotes.length) { font(30, 600); g.fillStyle = MUTED; g.fillText('同事怎麼說', ix, y); y += 56; }
    for (const { peer, lines } of quotes) {
      font(36, 700); g.fillStyle = INK; for (const l of lines) { g.fillText(l, ix, y); y += 50; }
      font(28); g.fillStyle = MUTED; g.textAlign = 'right'; g.fillText(`—— ${peer.who}`, ix + iw, y); g.textAlign = 'left'; y += 52;
    }
    // 底下：網址和 hashtag
    g.textAlign = 'center'; g.textBaseline = 'middle';
    font(32, 700); g.fillStyle = mode === 'speedrun' ? '#e6e8ee' : INK; g.fillText('軟體工程師的一天，免安裝的小遊戲', W / 2, H - 82);
    font(28, 500, MONO); g.fillText(`${C.SHARE_URL.replace(/^https?:\/\//, '').replace(/\/$/, '')}  ${TAG}`, W / 2, H - 38);
    return cv;
  }

  // 三天總結算圖：頂端遊戲名、紙卡上頭像名字、三天各一格（哪一天・時代、印章、總評）、最底下印章接成的一串
  function summaryCard({ summary, player }) {
    const cv = document.createElement('canvas'); cv.width = W; cv.height = H;
    const g = cv.getContext('2d');
    const css = getComputedStyle(document.documentElement);
    const SANS = css.getPropertyValue('--font').trim() || 'sans-serif', MONO = css.getPropertyValue('--mono').trim() || 'monospace';
    const font = (size, weight = 400, family = SANS) => { g.font = `${weight} ${size}px ${family}`; };
    const wrap = (s, maxW, maxLines) => {
      const lines = []; let line = '';
      for (const ch of String(s)) { if (g.measureText(line + ch).width > maxW && line) { lines.push(line); line = ch; } else line += ch; }
      if (line) lines.push(line);
      if (lines.length > maxLines) { lines.length = maxLines; lines[maxLines - 1] = lines[maxLines - 1].slice(0, -1) + '…'; }
      return lines;
    };
    const rrect = (x, y, w, h, r) => { g.beginPath(); g.roundRect(x, y, w, h, r); };
    g.fillStyle = BACKDROP.speedrun; g.fillRect(0, 0, W, H);
    g.fillStyle = '#1a1d23'; g.fillRect(0, 0, W, 120);
    g.textBaseline = 'middle'; font(44, 700, MONO); g.fillStyle = AMBER; g.fillText('IT24hr', PAD, 62);
    const wName = g.measureText('IT24hr').width; font(34, 500); g.fillStyle = '#e6e8ee'; g.fillText('新人訓練結業', PAD + wName + 28, 64);
    const cx = PAD, cw = W - PAD * 2, cTop = 180, cBottom = H - 130;
    g.save(); g.shadowColor = 'rgba(0,0,0,.28)'; g.shadowBlur = 36; g.shadowOffsetY = 12;
    rrect(cx, cTop, cw, cBottom - cTop, 22); g.fillStyle = PAPER; g.fill(); g.restore();
    const ix = cx + 48, iw = cw - 96; let y = cTop + 48;
    const face = root.Avatar.draw(document.createElement('canvas'), { name: player.name, gender: player.gender, salt: player.avatarSalt || 0 }, 7);
    g.imageSmoothingEnabled = false; g.drawImage(face, ix, y, face.width, face.height); g.imageSmoothingEnabled = true;
    g.textBaseline = 'alphabetic'; font(54, 800); g.fillStyle = INK; g.fillText(player.name, ix + face.width + 32, y + 80);
    font(34); g.fillStyle = MUTED; g.fillText(player.title || '', ix + face.width + 32, y + 134);
    y += face.height + 56;
    for (const d of summary.days) {
      font(30, 600, MONO); g.fillStyle = MUTED; g.fillText(`${d.day}・${d.mode}`, ix, y);
      font(64, 800, MONO); const sw = g.measureText(d.stamp).width + 56;
      g.save(); g.translate(ix + 4, y + 36); g.rotate(-4 * Math.PI / 180);
      g.strokeStyle = RED; g.lineWidth = 5; rrect(0, 0, sw, 96, 12); g.stroke(); g.lineWidth = 2; rrect(9, 9, sw - 18, 78, 8); g.stroke();
      g.fillStyle = RED; g.textBaseline = 'middle'; g.fillText(d.stamp, 28, 51); g.restore();
      g.textBaseline = 'alphabetic'; y += 196;
      font(38, 700); g.fillStyle = INK;
      for (const l of wrap(d.line, iw, 2)) { g.fillText(l, ix, y); y += 52; }
      y += 72;
    }
    font(36, 800, MONO); g.fillStyle = INK; g.textAlign = 'center';
    for (const l of wrap(summary.chain, iw, 2)) { g.fillText(l, W / 2, Math.max(y, cBottom - 120)); y += 48; }
    g.textBaseline = 'middle';
    font(32, 700); g.fillStyle = '#e6e8ee'; g.fillText('軟體工程師的一天，免安裝的小遊戲', W / 2, H - 82);
    font(28, 500, MONO); g.fillText(`${C.SHARE_URL.replace(/^https?:\/\//, '').replace(/\/$/, '')}  ${TAG}`, W / 2, H - 38);
    return cv;
  }

  // 圖片：先畫好、轉成 jpg（之後分享或存圖都用這份）
  function image(view) {
    return new Promise((resolve) => {
      let cv; try { cv = card(view); } catch { resolve(null); return; }
      cv.toBlob((blob) => {
        if (!blob) { resolve(null); return; }
        const file = new File([blob], 'it24hr.jpg', { type: 'image/jpeg' });
        let canShare = false; try { canShare = !!(navigator.canShare && navigator.share && navigator.canShare({ files: [file] })); } catch { canShare = false; }
        resolve({ url: URL.createObjectURL(blob), file, canShare });
      }, 'image/jpeg', 0.9);
    });
  }

  const COARSE = () => typeof matchMedia === 'function' && matchMedia('(pointer: coarse)').matches;
  // 系統分享被玩家自己取消（AbortError）就算了，其他失敗改用備案
  const tryShare = (data, fallback) => { try { navigator.share(data).then(() => {}, (e) => { if (!e || e.name !== 'AbortError') fallback(); }); } catch { fallback(); } };

  // 結算卡底下的兩個鈕：分享結算卡（圖）、分享連結（文字）
  function buttons(view, el) {
    const pic = el('button', 'btn', '分享結算卡'); pic.type = 'button'; pic.disabled = true;
    const link = el('button', 'btn', '分享連結'); link.type = 'button';
    const ready = image(view);
    ready.then((img) => { if (img) pic.disabled = false; else pic.hidden = true; });
    pic.addEventListener('click', async () => {
      const img = await ready; if (!img) return;
      const open = () => viewer(img.url, el);
      if (img.canShare) tryShare({ files: [img.file], text: text(view) }, open); else open();
    });
    link.addEventListener('click', () => {
      const all = text(view, true);
      const copy = () => copyText(all).then(() => { link.textContent = '已複製連結'; }, () => { link.textContent = '請複製網址列'; });
      if (COARSE() && navigator.share) tryShare({ text: text(view), url: url() }, copy); else copy();
    });
    return [pic, link];
  }
  function copyText(s) {
    if (navigator.clipboard && navigator.clipboard.writeText) return navigator.clipboard.writeText(s).catch(() => legacyCopy(s));
    return legacyCopy(s);
  }
  function legacyCopy(s) {
    return new Promise((resolve, reject) => {
      try {
        const t = document.createElement('textarea'); t.value = s; t.style.position = 'fixed'; t.style.opacity = '0';
        document.body.appendChild(t); t.select(); const ok = document.execCommand('copy'); t.remove();
        if (ok) resolve(); else reject(new Error('copy'));
      } catch (e) { reject(e); }
    });
  }
  // 不能用系統分享（電腦、部分瀏覽器）：跳出大圖，按「存圖」或長按／右鍵另存
  function viewer(src, el) {
    const box = el('div', 'share-viewer'); box.setAttribute('role', 'dialog'); box.setAttribute('aria-label', '結算卡圖片');
    const inner = el('div', 'share-viewer-inner');
    const img = el('img'); img.src = src; img.alt = '結算卡';
    const tip = el('p', 'share-tip', COARSE() ? '按「存圖」（或長按圖片）存下來，再貼到任何地方。' : '按「存圖」（或在圖上按右鍵另存），就可以貼到任何地方。');
    const save = el('a', 'btn primary', '存圖'); save.href = src; save.download = 'it24hr.jpg';
    const close = el('button', 'btn', '關閉'); close.type = 'button';
    const done = () => box.remove();
    close.addEventListener('click', done); box.addEventListener('click', (e) => { if (e.target === box) done(); });
    const row = el('div', 'share-actions'); row.append(save, close);
    inner.append(img, tip, row); box.append(inner); document.body.append(box); close.focus();
  }

  const api = { text, url, card, image, buttons };
  if (isNode) module.exports = api; else root.Share = api;
})(typeof window !== 'undefined' ? window : globalThis);
