// scripts/work-links.js：從劇本資料抓出每張卡各工作之間的連動（given／showIf／needs／spec／sentence／carry／onlyIf／judgment／skipIfSA／accept／drives），
// 印成 Markdown。用法：node scripts/work-links.js
const DAY1 = require('../day1.js');
const DAY2 = require('../day2.js');
const DAY3 = require('../day3.js');
const Works = require('../works.js');
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
          const cond = g.when ? `第 ${g.when.item + 1} ${unit}${g.when.sub != null ? `第 ${g.when.sub + 1} 問` : ''}選了第 ${g.when.picked + 1} 個` : '有做就帶';
          rows.push(`- ${L(s.work)}${q.items.length > 1 ? `（${item.text}）` : ''} ← ${L(g.work)}（${cond}）：自動勾 ${g.options.map(o => opt(item, o)).join('、')}`);
        }
        for (const [o, cond] of Object.entries(item.showIf || {}))
          rows.push(`- ${L(s.work)}：${opt(item, +o)} 只有 ${[].concat(cond).map(c => `${L(c.work)} 第 ${c.item + 1} 段／題選了第 ${c.picked + 1} 個`).join('，或 ')}才出現（showIf）`);
        for (const [o, cond] of Object.entries(item.hideIf || {}))
          rows.push(`- ${L(s.work)}：${opt(item, +o)} 在 ${[].concat(cond).map(c => `${L(c.work)} 第 ${c.item + 1} 段／題選了第 ${c.picked + 1} 個`).join('，或 ')}之後消失（hideIf）`);
        if (item.onPick) for (const [o, ev] of Object.entries(item.onPick)) rows.push(`- ${L(s.work)}：選了 ${opt(item, +o)} → ${ev.who} 來${ev.origin === 'line' ? ' LIME' : '信'}（onPick）`);
        for (const [o, text] of Object.entries(item.fires || {})) rows.push(`- ${L(s.work)}：選了 ${opt(item, +o)} → 客戶試用時在群組說「${text}」（fires）`);
      });
      const itemOf = (work) => { const dep = (c.subtasks.find(x => x.work === work) || {}).question; return dep && dep.items && dep.items[0]; };
      const named = (work, i) => (itemOf(work) ? opt(itemOf(work), i) : `第 ${i + 1} 項`);
      for (const f of q.functions || []) {
        const why = [];
        if (f.judgment) why.push('AI 主張，一律自己填');
        if (f.carry) why.push(`前一天${L(f.carry.work)}選了第 ${f.carry.picked + 1} 項 → 直接拉進來（carry）`);
        const docs = [];
        if (f.needs) docs.push(`${L(f.needs.work)} 有 ${named(f.needs.work, f.needs.picked)}（needs）`);
        if (f.spec != null) docs.push(`${L('doc_spec')} 有 ${named('doc_spec', f.spec)}（spec）`);
        if (docs.length) why.push(`要 ${docs.join('，或 ')}`);
        if (f.sentence != null) why.push(f.judgment ? `手動測試看卡上第 ${f.sentence + 1} 句（sentence，沒有驗收的卡）` : `要卡上有第 ${f.sentence + 1} 句需求（sentence）`);
        if (f.onlyIf) why.push(`${L(f.onlyIf.work)} 選了第 ${f.onlyIf.picked + 1} 個才有這個 function（onlyIf）`);
        if (!why.length) why.push('文件寫不到，一律自己填');
        if (f.accept != null) why.push(`手動測試看驗收的 ${named('doc_accept', f.accept)}（accept）`);
        if (f.drives) why.push(`AI 開發 \`${f.drives.fn}\` 時照這個測試寫（drives）`);
        rows.push(`- ${L(s.work)}的 \`${f.name}\`（${f.does || ''}）：${why.join('；')}`);
        for (const fld of Object.values(f.fields || {})) for (const [o, text] of Object.entries(fld.fires || {})) rows.push(`- ${L(s.work)}的 \`${f.name}\`：選了 ${opt(fld, +o)} → 客戶試用時在群組說「${text}」（fires）`);
      }
    }
    if (rows.length) lines.push(`\n### ${c.title}（${c.where}，${c.id}）`, ...rows);
  }
  return lines.join('\n');
}
console.log(dump('第一天', DAY1));
console.log('\n' + dump('第二天', DAY2.make()));
console.log('\n' + dump('第三天', DAY3.make()));
