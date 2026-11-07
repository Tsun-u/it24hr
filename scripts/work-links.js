// scripts/work-links.js：從劇本資料抓出每張卡各工作之間的連動（given／showIf／needs／spec／sentence／carry／onlyIf／judgment／skipIfSA／accept／drives），
// 印成 Markdown。用法：node scripts/work-links.js
const DAY1 = require('../day1.js');
const DAY2 = require('../day2.js');
const DAY3 = require('../day3.js');
const Works = require('../works.js');
const { Sandbox } = require('../sandbox.js');
require('../sandbox-scenery.js');
const L = (w) => (Works.LABELS && Works.LABELS[w]) || w;

function cardsOf(script) {
  const out = [];
  for (const c of script.cards || []) out.push({ where: '劇本卡', id: c.id, title: c.title, subtasks: c.subtasks });
  for (const s of script.sources || []) {
    // 有版本的來源（老闆稽核）：variants 第一個是版本二（條件成立才用），最後一個是預設的版本一
    const versions = s.variants ? s.variants.map((v, i) => [i === s.variants.length - 1 ? '版本一（預設）' : `版本${'二三四'[i]}`, v]) : [['', s]];
    for (const [tag, v] of versions) if (v.subtasks && v.subtasks.length)
      out.push({ where: `來源（${s.kind}）${tag ? `，${tag}` : ''}`, id: s.id, title: s.title, subtasks: v.subtasks });
    if (s.onNoBackup && s.onNoBackup.card) out.push({ where: '資料遺失事件', id: s.onNoBackup.card.id, title: s.onNoBackup.card.title, subtasks: s.onNoBackup.card.subtasks });
  }
  for (const c of script.cards || []) if (c.onNoBackup && c.onNoBackup.card) out.push({ where: '資料遺失事件', id: c.onNoBackup.card.id, title: c.onNoBackup.card.title, subtasks: c.onNoBackup.card.subtasks });
  for (const em of (script.home && script.home.emergencies) || []) if (em.card) out.push({ where: '半夜緊急', id: em.card.id, title: em.card.title, subtasks: em.card.subtasks });
  for (const m of script.meetings || []) for (const c of m.cards || []) {
    out.push({ where: '會議後開的卡', id: c.id, title: c.title, subtasks: c.subtasks });
    // 選路的卡（接手或重來）：每條路各一份工作，路名取選項括號前那段
    const routeNames = c.routes ? c.subtasks.find(s => s.work === 'route').question.items[0].options : [];
    (c.routes || []).forEach((r, i) => out.push({ where: `選路：${routeNames[i].split('（')[0]}`, id: c.id, title: c.title, subtasks: r.subtasks }));
  }
  for (const [id, p] of Object.entries((script.parallel && script.parallel.cards) || {})) out.push({ where: '平行宇宙小卡', id, title: p.card.title, subtasks: p.card.subtasks });
  return out;
}
const opt = (item, i) => `「${(item.options || [])[i]}」`;
function dump(name, script) {
  const lines = [`## ${name}`];
  for (const c of cardsOf(script)) {
    const rows = [];
    for (const s of c.subtasks || []) {
      const q = s.question || {};
      if (s.skipIfSA) rows.push(`- ${L(s.work)}：轉給怡君開卡的話這件拿掉（skipIfSA）`);
      (q.items || []).forEach((item) => {
        for (const g of [].concat(item.given || [])) {
          const unit = g.work === 'discuss' ? '段' : '題';
          const cond = (g.when ? `第 ${g.when.item + 1} ${unit}${g.when.sub != null ? `第 ${g.when.sub + 1} 問` : ''}選了第 ${g.when.picked + 1} 個` : '有做就帶')
            + (g.sentence !== undefined ? `，卡上要有第 ${g.sentence + 1} 句需求` : '');
          const verb = Array.isArray(item.answer) || item.type === 'order' ? '自動勾' : '直接選好鎖住';
          rows.push(`- ${L(s.work)}${q.items.length > 1 ? `（${item.text}）` : ''} ← ${L(g.work)}（${cond}）：${verb} ${g.options.map(o => opt(item, o)).join('、')}`);
        }
        for (const [o, cond] of Object.entries(item.showIf || {}))
          rows.push(`- ${L(s.work)}：${opt(item, +o)} 只有 ${[].concat(cond).map(c => `${L(c.work)} 第 ${c.item + 1} 段／題選了第 ${c.picked + 1} 個`).join('，或 ')}才出現（showIf）`);
        for (const [o, cond] of Object.entries(item.hideIf || {}))
          rows.push(`- ${L(s.work)}：${opt(item, +o)} 在 ${[].concat(cond).map(c => `${L(c.work)} 第 ${c.item + 1} 段／題選了第 ${c.picked + 1} 個`).join('，或 ')}之後消失（hideIf）`);
        if (item.onPick) for (const [o, ev] of Object.entries(item.onPick)) rows.push(`- ${L(s.work)}：選了 ${opt(item, +o)} → ${ev.who} 來${ev.origin === 'line' ? ' LIME' : '信'}（onPick）`);
        for (const [o, text] of Object.entries(item.fires || {})) rows.push(`- ${L(s.work)}：選了 ${opt(item, +o)} → 客戶試用時在群組說「${text}」（fires）`);
        if (item.onlyIf) rows.push(`- ${L(s.work)}（${item.text}）：照原本的版本 ${opt(item, item.inherit)}，${L(item.onlyIf.work)}挑出 \`${item.onlyIf.picked}\` 才能改（onlyIf／inherit）`);
      });
      const itemOf = (work) => { const dep = (c.subtasks.find(x => x.work === work) || {}).question; return dep && dep.items && dep.items[0]; };
      const named = (work, i) => (itemOf(work) ? opt(itemOf(work), i) : `第 ${i + 1} 項`);
      for (const f of q.functions || []) {
        const why = [];
        if (f.judgment) why.push('AI 主張，一律自己填');
        if (f.carry) why.push(`前一天${L(f.carry.work)}選了第 ${f.carry.picked + 1} 項 → 直接拉進來（carry）`);
        const docs = [];
        if (f.needs) docs.push(`${L(f.needs.work)} 有 ${named(f.needs.work, f.needs.picked)}（needs）`);
        // spec 是數字＝規格那一題（多選）的第幾項；是 { item }＝規格的第幾題（單選，規格選什麼就照寫）
        const specItem = (k) => ((c.subtasks.find(x => x.work === 'doc_spec') || {}).question || { items: [] }).items[k];
        if (f.spec != null) docs.push(typeof f.spec === 'object'
          ? `${L('doc_spec')} 第 ${f.spec.item + 1} 題「${specItem(f.spec.item).text}」寫了就照它選的（spec）`
          : `${L('doc_spec')} 有 ${named('doc_spec', f.spec)}（spec）`);
        if (docs.length) why.push(`要 ${docs.join('，或 ')}`);
        if (f.sentence != null) why.push(f.judgment ? `手動測試看卡上第 ${f.sentence + 1} 句（sentence，沒有驗收的卡）` : `要卡上有第 ${f.sentence + 1} 句需求（sentence）`);
        if (f.onlyIf) why.push(`${L(f.onlyIf.work)} 選了第 ${f.onlyIf.picked + 1} 個才有這個 function（onlyIf）`);
        if (!why.length) why.push('文件寫不到，一律自己填');
        if (f.accept != null) why.push(`手動測試看驗收的 ${named('doc_accept', f.accept)}（accept）`);
        const uiItems = ((c.subtasks.find(x => x.work === 'ui_design') || {}).question || { items: [] }).items;
        for (const d of [].concat(f.drives || [])) why.push(d.ui !== undefined
          ? `AI 寫前端程式「${uiItems[d.ui].text}」時照這個測試寫（drives）`
          : `AI 寫後端程式 \`${d.fn}\` 時照這個測試寫（drives）`);
        rows.push(`- ${L(s.work)}的 \`${f.name}\`（${f.does || ''}）：${why.join('；')}`);
        for (const fld of Object.values(f.fields || {})) for (const [o, text] of Object.entries(fld.fires || {})) rows.push(`- ${L(s.work)}的 \`${f.name}\`：選了 ${opt(fld, +o)} → 客戶試用時在群組說「${text}」（fires）`);
        for (const fld of Object.values(f.fields || {})) if (fld.lockedUnless) rows.push(`- ${L(s.work)}的 \`${f.name}\`：鎖在 ${opt(fld, fld.lockedTo)}，${L(fld.lockedUnless.work)}挑出 \`${fld.lockedUnless.picked}\` 才解開（lockedUnless）`);
      }
    }
    if (rows.length) lines.push(`\n### ${c.title}（${c.where}，${c.id}）`, ...rows);
  }
  return lines.join('\n');
}
console.log(dump('第一天', DAY1));
console.log('\n' + dump('第二天', DAY2.make()));
console.log('\n' + dump('第三天', DAY3.make()));
// 正式上班第二關：模組卡是廠商需求會議散會後開的；模組池三抽二，抽兩組湊滿六張。
// 批號追溯在 speedrun 是選路的卡（接手或重來），另外印它的兩條路；平行宇宙小卡三個時代一樣
const scenery = (mode, pool) => Sandbox.make('scenery', mode, { pool });
const scene = scenery('legacy', ['trace', 'stock']);
const claim = scenery('legacy', ['claim', 'stock']).meetings[1].cards.filter(c => c.id === 'claim');
const routed = scenery('speedrun', ['trace', 'stock']).meetings[1].cards.filter(c => c.routes);
console.log('\n' + dump('正式上班第二關（最美的風景）', { cards: [], meetings: [{ cards: [...scene.meetings[1].cards, ...claim] }, { cards: routed }], parallel: scene.parallel }));
