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
  const HIGHLIGHT = 'rgba(255, 209, 102, .55)', PENCIL = '#8a8172';
  const GLUE = new Set('，。、？！：；）」』》…,.?!:;)');   // 換行時不放在行首的標點
  const seedOf = (s) => { let h = 7; for (const ch of String(s)) h = (h * 31 + ch.codePointAt(0)) % 2147483647; return h || 1; };
  // 數字連同後面的英文單位（12 GB、2666 MT/s）、英文字、檔名各是一塊，其餘一個字一塊
  const TOKEN = /\d[\d.,]*(?: ?[A-Za-z]+(?:\/[A-Za-z]+)?)?|[A-Za-z0-9][A-Za-z0-9._\/-]*|[\s\S]/gu;

  // canvas 換行：中文一個字一個字量寬度，英文字、數字整塊換到下一行（比整行還長才拆開）；
  // 新的一行不以空白或標點開頭，最多 maxLines 行（超過的最後一行補…）
  function wrapText(g, s, maxW, maxLines = 99) {
    const lines = []; let line = '';
    const add = (tok) => {
      if (tok === '\n') { lines.push(line); line = ''; return; }
      if (g.measureText(line + tok).width > maxW && line && !GLUE.has(tok)) { lines.push(line); line = tok.trimStart(); } else line += tok;
    };
    for (const tok of String(s).match(TOKEN) || []) {
      if (tok.length > 1 && g.measureText(tok).width > maxW) for (const ch of tok) add(ch); else add(tok);
    }
    if (line) lines.push(line);
    if (lines.length > maxLines) { lines.length = maxLines; lines[maxLines - 1] = lines[maxLines - 1].slice(0, -1) + '…'; }
    return lines;
  }

  // 紙上的東西（標題紙條、紙卡、印章）用 rough.js 手繪，seed 從玩家名字算；成品畫面是螢幕上的系統，照原樣畫
  function card(view) {
    if (view.summary) return summaryCard(view);
    const { report, shot, badEnd, mode } = view;
    const cv = document.createElement('canvas'); cv.width = W; cv.height = H;
    const g = cv.getContext('2d'), rc = root.rough.canvas(cv);
    let seed = seedOf(report.player.name);
    const pen = (o = {}) => ({ seed: seed++, roughness: 1.3, bowing: 1.2, strokeWidth: 3, stroke: INK, ...o });
    const css = getComputedStyle(document.documentElement);
    const SANS = css.getPropertyValue('--font').trim() || 'sans-serif', MONO = css.getPropertyValue('--mono').trim() || 'monospace';
    const font = (size, weight = 400, family = SANS) => { g.font = `${weight} ${size}px ${family}`; };
    const wrap = (s, maxW, maxLines) => wrapText(g, s, maxW, maxLines);
    const rrect = (x, y, w, h, r) => { g.beginPath(); g.roundRect(x, y, w, h, r); };

    g.fillStyle = BACKDROP[mode] || BACKDROP.legacy; g.fillRect(0, 0, W, H);
    // 頂端：遊戲名＋哪一天，寫在一張微歪的紙條上
    g.save(); g.translate(PAD, 34); g.rotate(-1.2 * Math.PI / 180);
    rc.rectangle(0, 0, 560, 92, pen({ fill: '#1a1d23', fillStyle: 'solid', stroke: '#1a1d23', roughness: 1.1 }));
    g.textBaseline = 'middle'; font(44, 700, MONO); g.fillStyle = AMBER; g.fillText('IT24hr', 30, 48);
    const wName = g.measureText('IT24hr').width; font(32, 500); g.fillStyle = '#e6e8ee';
    g.fillText(`${dayOf(view)}・${mode || 'legacy'}`, 30 + wName + 24, 50); g.restore();
    g.textBaseline = 'middle';
    let y = 150;
    if (badEnd) {   // BAD END：一塊暗紅底，原因寫在裡面
      rc.rectangle(PAD - 10, y, W - PAD * 2 + 20, 180, pen({ fill: 'rgba(26, 10, 10, .92)', fillStyle: 'solid', stroke: '#3a1414' }));
      g.textAlign = 'center'; g.textBaseline = 'middle'; font(64, 800, MONO); g.fillStyle = '#ffd9d9'; g.fillText('B A D   E N D', W / 2, y + 58);
      font(32, 500); wrap(badEnd, W - PAD * 2 - 40, 2).forEach((l, i) => g.fillText(l, W / 2, y + 118 + i * 40));
      g.textAlign = 'left'; y += 200;
    }
    y += 20;
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
    g.save(); g.shadowColor = 'rgba(0,0,0,.22)'; g.shadowBlur = 30; g.shadowOffsetY = 10;
    g.fillStyle = PAPER; g.fillRect(cx + 4, cTop + 4, cw - 8, cBottom - cTop - 8); g.restore();
    rc.rectangle(cx, cTop, cw, cBottom - cTop, pen({ stroke: PENCIL, strokeWidth: 2.5, roughness: 1.5 }));
    const ix = cx + 48, iw = cw - 96; y = cTop + 48;
    const face = root.Avatar.draw(document.createElement('canvas'), { name: report.player.name, gender: report.player.gender, salt: report.player.avatarSalt || 0 }, 7);
    g.imageSmoothingEnabled = false; g.drawImage(face, ix, y, face.width, face.height); g.imageSmoothingEnabled = true;
    rc.rectangle(ix - 6, y - 6, face.width + 12, face.height + 12, pen({ stroke: PENCIL, strokeWidth: 2 }));
    g.textBaseline = 'alphabetic'; font(54, 800); g.fillStyle = INK; g.fillText(report.player.name, ix + face.width + 32, y + 80);
    font(34); g.fillStyle = MUTED; g.fillText(report.player.title || '', ix + face.width + 32, y + 134);
    y += face.height + 40;
    font(30, 500); g.fillStyle = MUTED; g.fillText('今天你是', ix, y);
    // 印章：手繪雙框紅字，歪 4 度
    font(88, 800, MONO); const sw = g.measureText(report.kind).width + 72;
    g.save(); g.translate(ix + 6, y + 26); g.rotate(-4 * Math.PI / 180);
    rc.rectangle(0, 0, sw, 128, pen({ stroke: RED, strokeWidth: 6, roughness: 1.8 }));
    rc.rectangle(11, 11, sw - 22, 106, pen({ stroke: RED, strokeWidth: 2, roughness: 1.4 }));
    g.fillStyle = RED; g.textBaseline = 'middle'; g.fillText(report.kind, 36, 68); g.restore();
    g.textBaseline = 'alphabetic'; y += 214;
    font(44, 800); g.fillStyle = INK;
    for (const l of wrap(report.line, iw, 3)) { g.fillText(l, ix, y); y += 60; }
    y += 24;
    const room = (need) => y + need < cBottom - 48;
    // 區塊標題：先塗一筆螢光筆，字寫在上面
    const heading = (s) => {
      font(30, 600); const w = g.measureText(s).width;
      rc.line(ix - 6, y - 10, ix + w + 8, y - 12, pen({ stroke: HIGHLIGHT, strokeWidth: 28, roughness: 2 }));
      g.fillStyle = INK; g.fillText(s, ix, y); y += 56;
    };
    const traits = report.traits || [];
    if (traits.length && room(120)) {
      heading('習慣與成就');
      // 說明對齊在最長的名稱後面；名稱超過 210px（約六個字），說明換到下一行，留寬一點給說明
      font(36, 800);
      const titleW = Math.min(210, Math.max(...traits.map(t => g.measureText(t.title).width)));
      const tx = ix + 28 + titleW + 28, tw = ix + iw - tx;
      for (const t of traits) {
        font(36, 800); const below = g.measureText(t.title).width > titleW;
        font(36); const lines = wrap(t.text, tw, 2);
        if (!room(56 * (lines.length + (below ? 1 : 0)))) break;
        rc.circle(ix + 8, y - 12, 14, pen({ fill: INK, fillStyle: 'solid', roughness: .8, strokeWidth: 1 }));
        font(36, 800); g.fillStyle = INK; g.fillText(t.title, ix + 28, y);
        if (below) y += 50;
        font(36); for (const l of lines) { g.fillText(l, tx, y); y += 50; }
        y += 6;
      }
      y += 30;
    }
    // 同事怎麼說：先算放得下幾句（最多三句），一句都放不下就不印標題
    const quotes = []; let need = 56;
    font(36, 700);
    for (const peer of (report.peers || []).slice(0, 3)) {
      const lines = wrap(peer.text, iw - 30, 2), h = lines.length * 50 + 52;
      if (!room(need + h)) break;
      quotes.push({ peer, lines }); need += h;
    }
    if (quotes.length) heading('同事怎麼說');
    for (const { peer, lines } of quotes) {
      const top = y - 38;
      font(36, 700); g.fillStyle = INK; for (const l of lines) { g.fillText(l, ix + 30, y); y += 50; }
      rc.line(ix + 8, top, ix + 6, y - 40, pen({ stroke: '#b9b0a0', strokeWidth: 4, roughness: 1.2 }));   // 引言前的手畫直線
      font(28); g.fillStyle = MUTED; g.textAlign = 'right'; g.fillText(`—— ${peer.who}`, ix + iw, y); g.textAlign = 'left'; y += 52;
    }
    // 底下：網址和 hashtag
    g.textAlign = 'center'; g.textBaseline = 'middle';
    font(32, 700); g.fillStyle = mode === 'speedrun' ? '#e6e8ee' : INK; g.fillText('軟體工程師的一天，免安裝的小遊戲', W / 2, H - 82);
    font(28, 500, MONO); g.fillText(`${C.SHARE_URL.replace(/^https?:\/\//, '').replace(/\/$/, '')}  ${TAG}`, W / 2, H - 38);
    return cv;
  }

  // 總結算圖每天一句同事評語：三天盡量不同人、不同句（評語第一句永遠是 SA，直接取會同一個人講三次）
  function dayQuotes(days) {
    const who = new Set(), said = new Set();
    return days.map((d) => {
      const peers = d.peers || [];
      const pick = peers.find(p => !who.has(p.who) && !said.has(p.text)) || peers.find(p => !said.has(p.text)) || peers[0] || null;
      if (pick) { who.add(pick.who); said.add(pick.text); }
      return pick;
    });
  }

  // 三天總結算圖：頂端遊戲名、紙卡上頭像名字、三天各一格（哪一天・時代、印章、總評、一句同事評語）、最底下印章接成的一串
  function summaryCard({ summary, player }) {
    const cv = document.createElement('canvas'); cv.width = W; cv.height = H;
    const g = cv.getContext('2d');
    const css = getComputedStyle(document.documentElement);
    const SANS = css.getPropertyValue('--font').trim() || 'sans-serif', MONO = css.getPropertyValue('--mono').trim() || 'monospace';
    const font = (size, weight = 400, family = SANS) => { g.font = `${weight} ${size}px ${family}`; };
    const wrap = (s, maxW, maxLines) => wrapText(g, s, maxW, maxLines);
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
    // 每天一格的高度先算好：評語兩行放不下就收成一行，格子之間的空白平分剩下的
    const quotes = dayQuotes(summary.days), STAMP_H = 180, bottom = cBottom - 170;
    const layout = (quoteRows) => summary.days.map((d, i) => {
      font(38, 700); const lines = wrap(d.line, iw, 2);
      font(30, 600); const quote = quotes[i] ? wrap(quotes[i].text, iw, quoteRows) : [];
      return { d, lines, quote, peer: quotes[i], h: STAMP_H + lines.length * 52 + (quote.length ? quote.length * 42 + 40 : 0) };
    });
    const total = (rows) => rows.reduce((sum, r) => sum + r.h, 0);
    let rows = layout(2); if (y + total(rows) > bottom) rows = layout(1);
    const gap = Math.max(12, Math.min(56, (bottom - y - total(rows)) / rows.length));
    for (const { d, lines, quote, peer } of rows) {
      font(30, 600, MONO); g.fillStyle = MUTED; g.fillText(`${d.day}・${d.mode}`, ix, y);
      font(64, 800, MONO); const sw = g.measureText(d.stamp).width + 56;
      g.save(); g.translate(ix + 4, y + 36); g.rotate(-4 * Math.PI / 180);
      g.strokeStyle = RED; g.lineWidth = 5; rrect(0, 0, sw, 96, 12); g.stroke(); g.lineWidth = 2; rrect(9, 9, sw - 18, 78, 8); g.stroke();
      g.fillStyle = RED; g.textBaseline = 'middle'; g.fillText(d.stamp, 28, 51); g.restore();
      g.textBaseline = 'alphabetic'; y += STAMP_H;
      font(38, 700); g.fillStyle = INK;
      for (const l of lines) { g.fillText(l, ix, y); y += 52; }
      if (quote.length) {
        font(30, 600); for (const l of quote) { g.fillText(l, ix, y); y += 42; }
        font(26); g.fillStyle = MUTED; g.textAlign = 'right'; g.fillText(`—— ${peer.who}`, ix + iw, y - 4); g.textAlign = 'left'; y += 40;
      }
      y += gap;
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
    root.Ink.paperize(row);
  }

  const api = { text, url, card, image, buttons, dayQuotes };
  if (isNode) module.exports = api; else root.Share = api;
})(typeof window !== 'undefined' ? window : globalThis);
