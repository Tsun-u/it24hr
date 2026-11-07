// screen.js — 成品畫面：那張卡做出來的網頁長什麼樣。
// model(card) 把前端程式的答案（版型、元件、防呆）、劇本給的欄位與假資料、開發的 bug 併成純資料（node 可測）；
// render(model, device) 把它畫成 DOM，手動測試的預覽和結算卡縮圖都用它。
// 卡的 screen：{ app, fields, rows, bugs: { functionName: effect } }；effect 是 serialWrong／scrapGone／filterBroken／editBroken，
// 第三天 POC 的：wrongDomain／wrongReset／approveVisible（登入與權限）、axianApproves／serialOurs／deptOurs（簽核照客戶的組織）、
// botChatty／botLeaks（QA 機器人）、bomVisible／noSchedule（匯出給 ERP）；effect 也可以直接寫成 { voice, row?, cells }（正式上班第二關起）。
// screen.form：多畫一張新增表單，欄位照前端程式的欄位題（role 'field'）畫成下拉、紅字或怪東西。
// 沒做前端程式：版型 plain（2008 年內網風的裸表格）、什麼元件都沒有。
(function (root) {
  const Works = typeof require === 'function' ? require('./works.js') : root.Works;
  const flags =(item, answer) => { const idx = [].concat(answer ?? []); return Object.fromEntries((item.keys || []).map((k, i) => [k, idx.includes(i)])); };

  // 行銷部用 AI 做的活動頁（第三天，檢閱程式碼前端「三機找碴」）：卡的 screen 是 { app, campaign: true, defects: { 瑕疵: 修它的 function } }。
  // 瑕疵一開始都在；開發裡對應的 function 填對了那個瑕疵才消失（檢閱沒抓到的照原樣，手動測試照現況畫）
  function campaignModel(card, spec) {
    const code = [...(card.history || [])].reverse().find(h => h.work === 'code' && h.result);
    const fns = ((card.subtasks || []).find(s => s.work === 'code') || { question: {} }).question.functions || [];
    const filled = new Set((code ? code.result.toFill || [] : []).map(i => (fns[i] || {}).name));
    const buggy = new Set((code ? code.result.bugs || [] : []).map(b => b.fn));
    const fixed = Object.entries(spec.defects || {}).filter(([, fn]) => filled.has(fn) && !buggy.has(fn)).map(([d]) => d);
    const effects = Object.fromEntries(Object.keys(spec.defects || {}).filter(d => !fixed.includes(d)).map(d => [d, true]));
    return { app: spec.app, campaign: true, designed: true, built: true, template: 'campaign', components: {}, validations: {}, theme: spec.theme || null, confirm: null, hint: null,
      fields: [], rows: [], effects, fixed, readOnly: false, loginRequired: false, report: false, styleRef: null, aliases: null, deptOptions: null, exportPreview: false, loginLabel: '', pwReset: false, erpPreview: false,
      form: false, fieldLooks: {}, annoyed: [], bugNotes: [] };
  }
  function model(card) {
    const spec = card.screen || { app: card.title, fields: [], rows: [], bugs: {} };
    if (spec.campaign) return campaignModel(card, spec);
    const sub = (card.subtasks || []).find(s => s.work === 'ui_design');
    const answers = card.picks && card.picks.ui_design;
    const designed = !!(sub && answers);
    let template = 'plain', components = {}, validations = {}, theme = null, confirm = null, hint = null;
    let report = false;
    // 沒有前端程式這件工作的卡（改既有系統的信件卡）：畫面就是既有的那套（劇本 screen.design），bug 照樣看得到
    const fixed = !sub && spec.design;
    if (fixed) ({ template, components, validations, theme, confirm, hint } = { template: 'list', components: {}, validations: {}, theme: null, confirm: null, hint: null, ...spec.design });
    // 有做前端程式但那張卡沒有「版型」那題（例如 QA 機器人只挑元件）：版型就是一般的清單頁
    if (designed && !sub.question.items.some(item => item.role === 'template')) template = 'list';
    if (designed) sub.question.items.forEach((item, i) => {
      const first = [].concat(answers[i])[0];
      // 版型可以多選：加分項（bonus，例如報表頁）是額外多一塊，版型照第一個不是加分項的
      if (item.role === 'template') {
        const picks = [].concat(answers[i] ?? []); const bonus = item.bonus || [];
        template = item.keys[picks.find(p => !bonus.includes(p)) ?? picks[0]] || 'plain';
        report = picks.some(p => bonus.includes(p));
      }
      if (item.role === 'components') components = flags(item, answers[i]);
      if (item.role === 'validations') validations = flags(item, answers[i]);
      if (item.role === 'palette' && item.swatch[first]) { const [bg, fg, accent] = item.swatch[first]; theme = { bg, fg, accent }; }
      if (item.role === 'confirm') confirm = item.thumb[first] || null;
      if (item.role === 'hint') hint = item.thumb[first] || null;
    });
    const code = [...(card.history || [])].reverse().find(h => h.work === 'code' && h.result);
    // 開發的 bug：效果名稱（字串，畫面照名稱畫），或劇本直接寫長怎樣 { voice, row?, cells: { 欄位: 顯示的值 } }
    const effects = {}; const bugNotes = [];
    for (const fn of new Set(((code && code.result.bugs) || []).map(b => b.fn))) {
      const eff = (spec.bugs || {})[fn];
      if (typeof eff === 'string') effects[eff] = true; else if (eff) bugNotes.push(eff);
    }
    // 欄位題（role 'field'）：每個欄位最後做成什麼樣子——正解是下拉（sample），題目寫 input 'free' 的正解是自由填的文字框（free，sample 當提示字）、
    // 做錯是跳紅字（red）、漏做是收了怪東西（junk）；其他寫法的後果有寫 sample 的（例：配方只記主原料），那一格照它畫；
    // 沒做前端程式照每題的 ifSkipped。員工的惱怒（annoy 的 say）給 userVoice
    const fieldLooks = {}; let annoyed = [];
    if (sub && (sub.question.items || []).some(item => item.role === 'field')) {
      const outs = Works.outcomes(sub.question, answers, { done: designed, picks: card.picks });
      for (const item of sub.question.items.filter(it => it.role === 'field' && it.field)) {
        const mine = outs.filter(o => o.field === item.field);
        const junk = mine.find(o => o.kind === 'miss'), red = mine.find(o => o.kind === 'annoy'), shown = mine.find(o => o.sample != null);
        fieldLooks[item.field] = junk ? { look: 'junk', text: junk.junk || '' } : red ? { look: 'red', text: red.red || '' }
          : shown ? { look: 'right', text: shown.sample } : { look: item.input === 'free' ? 'free' : 'right', text: item.sample || '' };
      }
      annoyed = outs.filter(o => o.kind === 'annoy').map(o => o.say);
    }
    return { app: spec.app, designed: designed || !!fixed, template, components, validations, theme, confirm, hint, fields: spec.fields || [], rows: spec.rows || [], effects, built: !!code, readOnly: !!spec.readOnly, loginRequired: !!spec.loginRequired, report, styleRef: spec.styleRef || null,
      aliases: spec.aliases || null, deptOptions: spec.deptOptions || null, exportPreview: !!spec.exportPreview,
      loginLabel: spec.loginLabel || '公司帳號 ▢　密碼 ▢　[用公司 AD 登入]', pwReset: !!spec.pwReset, erpPreview: !!spec.erpPreview,
      form: !!spec.form, fieldLooks, annoyed, bugNotes };
  }
  // 唯讀頁上出現了能改資料的東西：自己放了新增／修改／報廢，或程式寫成能改
  const editableOnReadOnly = (m) => m.readOnly && (m.effects.editable || m.components.add || m.components.edit || m.components.scrap);
  // 風格＝配色（沒做前端程式就是 plain）；追加需求跟母議題比這個。版型不算：版型照需求走（老闆只要唯讀和匯出，就不用編輯表單）
  const styleOf = (m) => (m.designed ? (m.theme ? `${m.theme.bg}/${m.theme.fg}/${m.theme.accent}` : 'designed') : 'plain');

  // ── 簡易 Lighthouse：四個分數＋原因。無障礙用真的 WCAG 對比公式算；最佳做法看提示方式；效能看會不會狂打 API ──
  const hexRgb = (hex) => { const n = parseInt(hex.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; };
  const luminance = (hex) => { const [r, g, b] = hexRgb(hex).map(v => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }); return 0.2126 * r + 0.7152 * g + 0.0722 * b; };
  const contrast = (a, b) => { const [x, y] = [luminance(a), luminance(b)]; return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); };
  const reddish = (hex) => { const [r, g, b] = hexRgb(hex); return r > g + 60 && r > b + 60; };
  const greenish = (hex) => { const [r, g, b] = hexRgb(hex); return g > r + 40 && g > b + 40; };
  const NAME = { dialog: 'Dialog', toast: 'Toast', tooltip: 'Tooltip', inline: '一行字', alert: 'alert()' };
  function lighthouse(m) {
    const notes = []; let accessibility = 100, bestPractices = 100, performance = 100;
    if (!m.designed) { accessibility = 70; bestPractices = 60; notes.push('沒做前端程式，瀏覽器預設樣式撐全場'); }
    if (m.theme) {
      const cr = contrast(m.theme.fg, m.theme.bg);
      if (cr < 3) { accessibility -= 60; notes.push(`文字對比 ${cr.toFixed(1)}:1，看不清楚（至少要 4.5:1）`); }
      else if (cr < 4.5) { accessibility -= 30; notes.push(`文字對比 ${cr.toFixed(1)}:1，不到 4.5:1`); }
      if ((reddish(m.theme.bg) && greenish(m.theme.fg)) || (greenish(m.theme.bg) && reddish(m.theme.fg))) { accessibility -= 25; notes.push('紅配綠，色弱的人看不出哪個是狀態'); }
    }
    if (m.confirm === 'toast' || m.confirm === 'tooltip') { bestPractices -= 40; notes.push(`不可逆的操作用 ${NAME[m.confirm]} 確認，擋不住手滑`); }
    if (m.confirm === 'alert' || m.hint === 'alert') { bestPractices -= 25; notes.push('用了 alert()，瀏覽器會問使用者要不要封鎖這個網站的對話框'); }
    if (m.hint === 'dialog') { bestPractices -= 20; notes.push('每個欄位錯誤都跳視窗'); }
    if (m.hint === 'tooltip') { bestPractices -= 15; notes.push('錯誤藏在 Tooltip 裡，滑鼠不過去看不到'); }
    if (m.components.login && !m.loginRequired) { bestPractices -= 10; notes.push('多做了登入，沒人有帳號'); }
    if (m.validations.autosave) { performance -= 45; notes.push('每打一個字就打一次 API'); }
    if (m.validations.datePicker) { bestPractices -= 15; notes.push('大批輸入的表單叫人一筆一筆點日曆'); }
    if (m.rows.length > 50 && !m.components.pager) { performance -= 30; notes.push('幾千筆一次全撈，沒分頁'); }
    notes.push('SEO 100：內網系統，這欄是裝飾');
    const clamp = (v) => Math.max(0, Math.min(100, v));
    return { performance: clamp(performance), accessibility: clamp(accessibility), bestPractices: clamp(bestPractices), seo: 100, notes };
  }

  // 匯出的 CSV 用 Excel 打開：前三列；沒加 BOM 的話中文照字碼換成看不懂的字（英數照常）
  const MOJIBAKE = '蝺刻鞈璅嚗隞撌桀瘜曉蝯梯摰嗅銝芰';
  const garble = (s) => String(s).replace(/[㐀-鿿]/g, (ch) => MOJIBAKE[ch.charCodeAt(0) % MOJIBAKE.length]);
  function exportBox(m, el) {
    const box = el('div', 'mock-form'); box.append(el('h4', '', '匯出的 CSV 用 Excel 打開'));
    const fix = m.effects.csvGarbled ? garble : (s) => s;
    const t = el('table', 'mock-table'); const hr = el('tr'); for (const f of m.fields) hr.append(el('th', '', fix(f))); t.append(hr);
    for (const row of m.rows.slice(0, 3)) { const tr = el('tr'); for (const c of row) tr.append(el('td', '', fix(c))); t.append(tr); }
    box.append(t); return box;
  }

  // 開發的 bug 反映在資料上：報廢寫成刪除 → 報廢那列不見；編號格式錯 → 編號長得不對；篩選壞掉 → 一筆都篩不出來
  function visibleRows(m) {
    let rows = m.rows.map(r => [...r]);
    // 劇本寫的 bug：那一列（沒寫是第一列）的那幾格換成寫錯時的樣子
    for (const n of m.bugNotes || []) { const r = rows[n.row || 0]; if (r) for (const [f, v] of Object.entries(n.cells || {})) { const i = m.fields.indexOf(f); if (i >= 0) r[i] = v; } }
    if (m.effects.scrapGone) rows = rows.filter(r => !r.includes('報廢'));
    if (m.effects.serialWrong) rows = rows.map(r => { const [no, ...rest] = r; const p = String(no).split('-'); return [p.length === 3 ? `${p[1]}-${p[0]}-${Number(p[2])}` : no, ...rest]; });
    if (m.effects.filterBroken && m.components.filter) rows = [];
    // 舊資料的部門對回來了：舊寫法換成正式名稱；沒對回來的照舊亂
    if (m.aliases && !m.effects.deptNotMigrated) rows = rows.map(r => r.map(c => m.aliases[c] || c));
    // 第三天 POC：簽核人寫成阿賢（客戶的系統裡沒有他）、編號沿用我們的格式、部門用我們公司的部門表
    const col = (name) => m.fields.indexOf(name);
    const put = (name, fn) => { const i = col(name); if (i >= 0) rows = rows.map(r => { const c = [...r]; c[i] = fn(c[i]); return c; }); };
    if (m.effects.axianApproves) put('簽核', v => (v === '待簽核' ? '待阿賢簽核' : v));
    if (m.effects.serialOurs) put('編號', v => { const p = String(v).split('-'); return p.length === 2 ? `IT-2026-${p[1]}` : v; });
    if (m.effects.deptOurs) put('部門', () => '資產室');
    // 財務季報表：折舊後金額用錯公式，每列都跟「原價 − 累計折舊」對不起來（顯示成原價 × 0.8）
    const price = col('原價'), net = col('折舊後金額');
    if (m.effects.depreciationWrong && price >= 0 && net >= 0) {
      const num = (v) => Number(String(v).replace(/,/g, ''));
      rows = rows.map(r => { const c = [...r]; c[net] = (num(c[price]) * 0.8).toLocaleString('en-US'); return c; });
    }
    return rows;
  }
  // 莎禾 ERP 凌晨 2 點來讀的 CSV：沒排程就沒有檔案；加了 BOM 第一個欄名多三個怪字，ERP 對不到欄位
  function erpBox(m, el) {
    const box = el('div', 'mock-form'); box.append(el('h4', '', 'ERP 凌晨 2 點讀到的檔案'));
    if (m.effects.noSchedule) { box.append(el('div', 'mock-error', '02:00　約定位置沒有檔案（要有人按「匯出」才會產生）')); return box; }
    const head = (m.effects.bomVisible ? 'ï»¿' : '') + m.fields.join(',');
    const pre = el('pre', 'mock-csv', [head, ...m.rows.slice(0, 2).map(r => r.join(','))].join('\n'));
    box.append(pre);
    box.append(m.effects.bomVisible ? el('div', 'mock-error', `ERP：找不到欄位「${m.fields[0]}」（第一欄叫「ï»¿${m.fields[0]}」），匯入失敗`) : el('p', 'mock-empty', `ERP：匯入 ${m.rows.length} 筆`));
    return box;
  }
  // QA 機器人的問答小視窗：只答盤點的問題、答不出來請洽資產管理員；寫成什麼都聊會作詩、把資料全丟給 AI 會講出別人名下的資產
  function botBox(m, el) {
    const box = el('div', 'mock-form mock-chat'); box.append(el('h4', '', '盤點小幫手'));
    const qa = (q, a) => { box.append(el('p', 'mock-chat-q', `同仁：${q}`), el('p', 'mock-chat-a', `小幫手：${a}`)); };
    qa('資產不見了怎麼辦？', '手冊 3.2：在盤點表把狀態選「不見了」並填原因，送出後據點的資產管理員會聯絡你。');
    qa('大家都盤完了嗎？', m.effects.botLeaks ? '還有 3 位沒盤：王協理（ThinkPad T14）、林經理（iPad 第 9 代）、陳同仁（Dell 24 吋螢幕）。' : '這個問題請洽據點的資產管理員。');
    qa('幫我寫一首詩', m.effects.botChatty ? '資產如秋葉，一葉一編號；盤點夜未央，簽核待天明。' : '我只能回答盤點的問題。');
    return box;
  }

  // 活動頁：商品圖、橫幅、倒數、報名表單、送出鈕，每塊帶 data-region（三機找碴點的就是它）。
  // 瑕疵：brokenImages 商品圖破圖（三台都有）、bannerOverButton 手機版橫幅固定在底部蓋住送出鈕、formOverflow 平板版表單寬到要左右捲
  function renderCampaign(m, device, page, el) {
    const region = (name, cls) => { const n = el('div', `mock-region ${cls || ''}`); n.dataset.region = name; return n; };
    page.append(el('header', 'mock-top', m.app));
    const banner = region('banner', 'mock-campaign-banner'); banner.append(el('b', '', '週年慶 全館 5 折起'));
    if (device === 'phone' && m.effects.bannerOverButton) banner.classList.add('mock-sticky-bottom');
    const products = region('product', 'mock-campaign-products');
    for (const name of ['招牌拿鐵', '肉桂捲', '禮盒組']) {
      const card = el('div', 'mock-product');
      card.append(m.effects.brokenImages ? el('div', 'mock-img-broken', '🖼 圖片無法顯示') : el('div', 'mock-img', name.slice(0, 2)), el('span', '', name));
      products.append(card);
    }
    const countdown = region('countdown', 'mock-campaign-countdown'); countdown.append(el('b', '', '剩 03 天 12:34:56'));
    const form = region('form', `mock-campaign-form${device === 'tablet' && m.effects.formOverflow ? ' mock-overflow' : ''}`);
    for (const f of ['姓名', '電話', '地址', 'Email']) { const row = el('label', 'mock-field'); row.append(el('span', '', f), el('input', 'mock-input')); form.append(row); }
    const submit = region('submit', 'mock-campaign-submit'); submit.append(el('button', 'mock-btn primary', '送出報名'));
    page.append(banner, products, countdown, form, submit);
    return page;
  }
  // 新增表單：每個欄位照 fieldLooks 畫——正解是下拉（自由填的欄位是空的文字框、sample 當提示字）、做錯是輸入框底下一行紅字、漏做是輸入框裡填著怪東西
  function formBox(m, el) {
    const box = el('div', 'mock-form'); box.append(el('h4', '', `新增${m.app.split('・').pop()}`));
    for (const f of m.fields) {
      const look = m.fieldLooks[f]; const row = el('label', 'mock-field'); row.append(el('span', '', f));
      row.dataset.region = f;   // 三機找碴點的就是這一列
      if (look && look.look === 'right') { const s = el('select', 'mock-select'); s.append(new Option(look.text)); row.append(s); }
      else {
        const input = el('input', `mock-input${look && look.look === 'junk' ? ' mock-junk' : ''}`);
        if (look && look.look === 'junk') input.value = look.text;
        if (look && look.look === 'free') input.placeholder = look.text;
        row.append(input);
      }
      box.append(row);
      if (look && look.look === 'red') box.append(el('p', 'mock-red', look.text));
    }
    box.append(el('button', 'mock-btn primary', '存檔'));
    return box;
  }
  function render(m, device = 'pc') {
    const el = (tag, cls, text) => { const n = document.createElement(tag); if (cls) n.className = cls; if (text !== undefined) n.textContent = text; return n; };
    const page = el('div', `mock mock-${m.template} mock-${device}${m.form ? ' mock-has-form' : ''}`);
    if (m.theme && m.template !== 'plain') { page.style.setProperty('--mock-bg', m.theme.bg); page.style.setProperty('--mock-fg', m.theme.fg); page.style.setProperty('--mock-accent', m.theme.accent); }
    if (!m.built) { page.append(el('div', 'mock-404', '404'), el('p', 'mock-empty', '還沒有這個頁面。')); return page; }
    if (m.campaign) return renderCampaign(m, device, page, el);
    // 提示方式的示範：同一句話照 dialog／toast／tooltip／inline／alert 畫出來
    const demo = (kind, text, buttons) => {
      const d = el('div', `mock-demo mock-demo-${kind}`);
      if (kind === 'dialog' || kind === 'alert') { const box = el('div', 'mock-demo-box'); box.append(el('p', '', kind === 'alert' ? `此網頁顯示：${text}` : text)); const row = el('div', 'mock-demo-btns'); for (const b of buttons) row.append(el('button', 'mock-btn small', b)); box.append(row); d.append(box); }
      else d.append(el('span', '', text));
      return d;
    };
    page.append(el('header', 'mock-top', m.app));
    // jQuery 直接升到最新版：舊寫法被拿掉，按鈕都沒反應
    if (m.effects.jqueryBroken) page.append(el('div', 'mock-error', '篩選、匯出按了沒反應　console：Uncaught TypeError: $(...).live is not a function'));
    // 唯讀頁的程式寫成能改：每列都冒出修改鈕
    const c = m.readOnly && m.effects.editable ? { ...m.components, edit: true } : m.components, v = m.validations;
    if (m.template !== 'plain') {
      // 登入：需求沒要的時候是陷阱（「我哪有帳號？」）；第二天每個人上來填，登入就是需求
      if (c.login) page.append(el('div', 'mock-login', m.loginRequired ? m.loginLabel : `帳號 ▢　密碼 ▢　[登入]　（${m.readOnly ? '財務' : '阿賢'}：我哪有帳號？）`));
      // 第三天 POC 的登入：接到我們公司的 AD，莎禾的測試帳號登不進去；忘記密碼導到我們公司的重設頁
      if (c.login && m.effects.wrongDomain) page.append(el('div', 'mock-error', 'poc_user01 → 帳號或密碼錯誤（接的是我們公司的 AD，不是莎禾的）'));
      if (c.login && m.pwReset) page.append(m.effects.wrongReset ? el('div', 'mock-error', '忘記密碼？ → 開到的是我們公司 AD 的重設頁') : el('div', 'mock-login', '忘記密碼？ → 莎禾 AD 自助重設'));
      const bar = el('div', 'mock-bar');
      if (c.search) { const s = el('input', 'mock-input'); s.placeholder = '搜尋名稱、持有人'; bar.append(s); }
      if (c.filter) { const f = el('select', 'mock-select'); for (const o of ['全部狀態', '使用中', '閒置', '報廢']) f.append(new Option(o)); bar.append(f); }
      if (c.add) bar.append(el('button', 'mock-btn primary', '＋ 新增'));
      if (c.export) bar.append(el('button', 'mock-btn', '匯出 Excel'));
      if (c.perm) bar.append(el('button', 'mock-btn', '權限設定'));
      if (c.dark) bar.append(el('button', 'mock-btn', '◐'));
      if (c.bot) bar.append(el('button', 'mock-btn', '問問 AI 小幫手'));
      if (c.faq) for (const q of ['怎麼盤點？', '資產不見了？', '簽核在哪？']) bar.append(el('button', 'mock-btn small', q));
      if (c.voice) bar.append(el('button', 'mock-btn', '語音輸入'));
      if (c.avatar) bar.append(el('button', 'mock-btn', '頭像換裝'));
      if (bar.children.length) page.append(bar);
    }
    const rows = visibleRows(m);
    if (m.template === 'dashboard') {
      const tiles = el('div', 'mock-tiles');
      for (const [label, n] of [['使用中', rows.filter(r => r.includes('使用中')).length], ['閒置', rows.filter(r => r.includes('閒置')).length], ['報廢', rows.filter(r => r.includes('報廢')).length]]) { const t = el('div', 'mock-tile'); t.append(el('b', '', String(n)), el('span', '', label)); tiles.append(t); }
      page.append(tiles);
    }
    // 報表頁（加分項）：明細之外一張簡易樞紐分析（照盤點／狀態欄計數）
    if (m.report && m.template !== 'plain') {
      const col = m.fields.findIndex(f => f === '盤點' || f === '狀態');
      if (col >= 0) {
        const counts = {}; for (const r of rows) counts[r[col]] = (counts[r[col]] || 0) + 1;
        const box = el('div', 'mock-form'); box.append(el('h4', '', `報表：依${m.fields[col]}彙總`));
        const t = el('table', 'mock-table'); const hr = el('tr'); hr.append(el('th', '', m.fields[col]), el('th', '', '筆數')); t.append(hr);
        for (const [k, n] of Object.entries(counts)) { const tr = el('tr'); tr.append(el('td', '', k), el('td', '', String(n))); t.append(tr); }
        box.append(t); page.append(box);
      }
    }
    const actions = (m.template !== 'plain') && (c.edit || c.scrap || c.check || c.approve);
    const actionCell = (row) => {
      const cell = el('span', 'mock-actions');
      if (c.check) { const s = el('select', 'mock-select'); for (const o of ['還在', '不見了', '壞了']) s.append(new Option(o)); cell.append(s); }
      if (c.approve) cell.append(el('button', 'mock-btn small', m.effects.approveVisible ? '簽核（一般同仁也按得到）' : '簽核'));
      if (c.edit) cell.append(el('button', 'mock-btn small', m.effects.editBroken ? '修改（沒反應）' : '修改'));
      if (c.scrap && !row.includes('報廢')) { const b = el('button', 'mock-btn small danger', '報廢'); if (v.confirmScrap) b.title = '會再問一次'; cell.append(b); }
      return cell;
    };
    if (device === 'phone' && m.template !== 'plain') {
      const list = el('div', 'mock-cards');
      for (const row of rows) { const card = el('div', 'mock-card'); card.append(el('b', '', row[1] || row[0]), el('span', '', `${row[0]} ・ ${row[row.length - 1]}`)); if (actions) card.append(actionCell(row)); list.append(card); }
      if (!rows.length) list.append(el('p', 'mock-empty', '沒有資料'));
      page.append(list);
    } else {
      const table = el('table', 'mock-table'); const head = el('tr');
      for (const f of m.fields) head.append(el('th', '', f)); if (actions) head.append(el('th', '', ''));
      table.append(head);
      for (const row of rows) { const tr = el('tr', row.includes('報廢') ? 'scrapped' : ''); for (const cell of row) tr.append(el('td', '', cell)); if (actions) { const td = el('td'); td.append(actionCell(row)); tr.append(td); } table.append(tr); }
      if (!rows.length) { const tr = el('tr'); const td = el('td', 'mock-empty', '沒有資料'); td.colSpan = m.fields.length + (actions ? 1 : 0); tr.append(td); table.append(tr); }
      page.append(table);
    }
    // 版型 plain 也畫：沒做前端程式的成品就是一排什麼都收的輸入框
    if (m.form) page.append(formBox(m, el));
    // 匯出：用 Excel 打開長什麼樣子（UTF-8 沒加 BOM，中文就變亂碼）
    if (m.exportPreview) page.append(exportBox(m, el));
    if (m.erpPreview) page.append(erpBox(m, el));
    if (m.template !== 'plain' && c.chat) page.append(botBox(m, el));
    if (m.template !== 'plain' && c.pager) page.append(el('div', 'mock-pager', '‹ 1 ›'));
    if (m.template !== 'plain' && c.add) {
      const form = el('div', 'mock-form'); form.append(el('h4', '', '新增資產'));
      for (const f of m.fields) {
        const row = el('label', 'mock-field'); row.append(el('span', '', f + (v.required ? ' *' : '')));
        // 部門改成下拉：選項照人資的部門表；寫死的話，現在資料裡亂打的寫法全變成選項
        const input = f === '部門' && m.deptOptions ? el('select', 'mock-select') : el('input', 'mock-input');
        if (input.tagName === 'SELECT') for (const o of m.effects.deptHardcode ? m.deptOptions.hardcode : m.deptOptions.hr) input.append(new Option(o));
        if (f === '編號' && v.serial) { input.placeholder = 'IT-2024-0001'; input.value = 'it2024-31'; input.classList.add('bad'); }
        // 實務做法：讓人直接打 20261123，程式自己轉 2026/11/23，轉不了才把框變紅
        if (f === '購入日期') { if (v.datePicker) input.type = 'date'; else if (v.dateSmart) { input.placeholder = '20261123'; input.value = '2026/11/23'; input.title = '打 20261123 就會自己轉成這樣'; } else if (v.dateFormat) input.placeholder = '2026-11-23'; }
        row.append(input); form.append(row);
        if (f === '編號' && v.serial && m.hint) form.append(demo(m.hint, '編號格式不對，要像 IT-2024-0001', ['確定']));
      }
      form.append(el('button', 'mock-btn primary', v.autosave ? '（每個字都自動存了）' : '儲存'));
      page.append(form);
    }
    if (m.template !== 'plain' && c.scrap && m.confirm) {
      const box = el('div', 'mock-form'); box.append(el('h4', '', '按下「報廢」會：'));
      box.append(demo(m.confirm, m.confirm === 'toast' ? '已報廢 ThinkPad T14（3 秒後消失）' : m.confirm === 'tooltip' ? '再按一次就報廢' : m.confirm === 'inline' ? '確定？' : '確定要報廢 ThinkPad T14？', ['取消', '報廢']));
      page.append(box);
    }
    return page;
  }

  // 用的人怎麼說（結算卡用）：跟 Lighthouse 看同樣的事，但講的是使用者的話。沙盒有好幾張卡時每張都算、同一句只留一次。
  // parent 是母議題的 model：追加需求的風格跟母議題不一樣，不管前面講了什麼，最後都多一句 STYLE_LINE。
  // 沒有母議題但 m.styleRef 有值（前一天同一套系統的風格），一樣比
  const PRAISE_LINE = '畫面很清楚，不用教就會用。';
  const STYLE_LINE = '風格能夠一致會更好。';
  function userVoice(m, parent = null) {
    const ref = parent ? styleOf(parent) : m.styleRef;
    const says = [];
    if (!m.built) return says;
    if (!m.designed) says.push('這畫面是 2008 年的嗎？');
    if (m.theme) {
      const cr = contrast(m.theme.fg, m.theme.bg);
      if (cr < 3) says.push('文字和背景根本分不開。'); else if (cr < 4.5) says.push('字看得很吃力。');
      if ((reddish(m.theme.bg) && greenish(m.theme.fg)) || (greenish(m.theme.bg) && reddish(m.theme.fg))) says.push('紅紅綠綠的，哪一筆是報廢？', '主任問是不是要過年了。');
    }
    if (m.confirm === 'toast' || m.confirm === 'tooltip') says.push('我手滑報廢了一台，它只閃了一下。');
    if (m.confirm === 'alert' || m.hint === 'alert') says.push('它一直問我要不要封鎖這個網站的對話框。');
    if (m.hint === 'dialog') says.push('打錯一個字就跳一個視窗，我想砸電腦。');
    if (m.hint === 'tooltip') says.push('存不進去也不說哪裡錯，滑鼠要自己去找。');
    if (m.components.login && !m.loginRequired) says.push('我哪有帳號？');
    if (m.loginRequired && m.designed && !m.components.login) says.push('沒有登入，大家看到的都一樣？');
    if (m.components.bot) says.push('那個 AI 小幫手一直跳出來問我需不需要幫忙。');
    if (m.effects.seeAll) says.push('我怎麼看得到主任的筆電？');
    if (m.effects.noApproval) says.push('阿賢還沒簽核，狀態就改了。');
    if (m.effects.noReason) says.push('不見了的那台沒寫原因也送出去了，稽核會問。');
    if (m.validations.autosave) says.push('打字會卡。');
    if (m.validations.datePicker) says.push('幾百筆資料要一筆一筆點日曆，我手要廢了。');
    if (m.validations.dateFormat && !m.validations.dateSmart) says.push('很棒，能少打斜線就更好了。');
    if (m.effects.scrapGone) says.push('報廢的那台不見了，稽核來怎麼辦？');
    if (editableOnReadOnly(m)) says.push('不是說我們只要看嗎？差點把資產室的資料改掉。');
    if (m.validations.photoAlways) says.push('東西不見了，只好拍我的空桌面。');
    if (m.report) says.push('報表一目了然，主任和財務都說很方便。');
    // 第三天 POC：講話的是莎禾的人
    if (m.effects.wrongDomain) says.push('我們的人用自己的帳號登不進去。');
    if (m.effects.wrongReset) says.push('按忘記密碼，跳到別家公司的頁面。');
    if (m.effects.approveVisible) says.push('一般同仁也看得到簽核鈕，有人真的按了。');
    if (m.effects.axianApproves) says.push('阿賢是誰？為什麼簽核都卡在他那裡。');
    if (m.effects.serialOurs) says.push('編號跟我們 ERP 的對不起來。');
    if (m.effects.deptOurs) says.push('部門選單裡只有「資產室」，我們沒有這個單位。');
    if (m.effects.botChatty) says.push('小幫手寫了一首詩給我。');
    if (m.effects.botLeaks) says.push('小幫手把別人名下的資產講出來了。');
    if (m.effects.bomVisible) says.push('ERP 讀不進來，第一欄名字前面多了怪字。');
    if (m.effects.noSchedule) says.push('凌晨 2 點 ERP 去撈，什麼都沒有。');
    // 財務季報表：講話的是財務
    if (m.effects.depreciationWrong) says.push('折舊後金額跟原價減累計折舊對不起來，我還是得自己按計算機。');
    // 行銷部的活動頁：講話的是來報名的客人
    if (m.effects.brokenImages) says.push('商品圖都是破的，這是賣什麼？');
    if (m.effects.bannerOverButton) says.push('手機上送出鈕被橫幅蓋住，按不到。');
    if (m.effects.formOverflow) says.push('平板上表單要左右捲，Email 欄在螢幕外面。');
    says.push(...(m.annoyed || []), ...(m.bugNotes || []).map(n => n.voice));   // 員工看到紅字的惱怒、劇本寫的 bug
    if (!says.length) says.push(PRAISE_LINE);
    if (ref && styleOf(m) !== ref) says.push(STYLE_LINE);
    return says;
  }

  const api = { model, render, visibleRows, lighthouse, contrast, userVoice, styleOf, PRAISE_LINE, STYLE_LINE };
  if (typeof module !== 'undefined') module.exports = api;
  else root.Screen = api;
})(typeof window !== 'undefined' ? window : globalThis);
